ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'waiting';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS recovered_via_waitlist boolean NOT NULL DEFAULT false;

CREATE TABLE public.waitlist_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  waitlist_id uuid NOT NULL REFERENCES public.waitlist(id) ON DELETE CASCADE,
  branch_id text NOT NULL REFERENCES public.branches(id),
  slot_start timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.waitlist_offers TO service_role;
ALTER TABLE public.waitlist_offers ENABLE ROW LEVEL SECURITY;
CREATE INDEX waitlist_offers_active_idx ON public.waitlist_offers (branch_id, slot_start) WHERE status = 'active';
CREATE INDEX waitlist_slot_idx ON public.waitlist (branch_id, slot_start, created_at) WHERE status = 'waiting';

-- Offer a freed slot to the next person waiting for it
CREATE OR REPLACE FUNCTION public.offer_next_waitlist(_branch_id text, _slot_start timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _w public.waitlist%ROWTYPE;
BEGIN
  IF _slot_start <= now() THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.waitlist_offers WHERE branch_id = _branch_id AND slot_start = _slot_start AND status = 'active') THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.bookings WHERE branch_id = _branch_id AND status <> 'cancelled'
             AND slot_start < _slot_start + interval '15 minutes' AND slot_end > _slot_start) THEN RETURN; END IF;
  SELECT * INTO _w FROM public.waitlist
   WHERE branch_id = _branch_id AND slot_start = _slot_start AND status = 'waiting'
   ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE public.waitlist SET status = 'offered' WHERE id = _w.id;
  INSERT INTO public.waitlist_offers (token, waitlist_id, branch_id, slot_start, expires_at)
  VALUES (substr(md5(random()::text || clock_timestamp()::text || _w.id::text), 1, 12), _w.id, _branch_id, _slot_start,
          least(now() + interval '10 minutes', _slot_start));
END; $$;

-- Expire stale offers and move on to the next person
CREATE OR REPLACE FUNCTION public.process_waitlist_offers()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o record;
BEGIN
  FOR _o IN SELECT * FROM public.waitlist_offers WHERE status = 'active' AND expires_at <= now() FOR UPDATE SKIP LOCKED LOOP
    UPDATE public.waitlist_offers SET status = 'expired' WHERE id = _o.id;
    UPDATE public.waitlist SET status = 'expired' WHERE id = _o.waitlist_id;
    PERFORM public.offer_next_waitlist(_o.branch_id, _o.slot_start);
  END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.on_booking_freed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    PERFORM public.offer_next_waitlist(OLD.branch_id, OLD.slot_start);
  ELSIF NEW.status <> 'cancelled' AND NEW.slot_start <> OLD.slot_start THEN
    PERFORM public.offer_next_waitlist(OLD.branch_id, OLD.slot_start);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER bookings_offer_waitlist AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.on_booking_freed();

CREATE OR REPLACE FUNCTION public.join_waitlist(_branch_id text, _slot_start timestamptz, _customer_name text, _whatsapp text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF length(trim(_customer_name)) < 2 OR length(trim(_customer_name)) > 60 THEN RAISE EXCEPTION 'invalid_name'; END IF;
  IF length(public.normalize_wa(_whatsapp)) < 8 OR length(public.normalize_wa(_whatsapp)) > 13 THEN RAISE EXCEPTION 'invalid_whatsapp'; END IF;
  IF _slot_start <= now() OR _slot_start > now() + interval '15 days' THEN RAISE EXCEPTION 'invalid_slot'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.branches WHERE id = _branch_id) THEN RAISE EXCEPTION 'invalid_branch'; END IF;
  IF EXISTS (SELECT 1 FROM public.waitlist WHERE branch_id = _branch_id AND slot_start = _slot_start
             AND status IN ('waiting','offered') AND public.normalize_wa(whatsapp) = public.normalize_wa(_whatsapp)) THEN
    RETURN true;
  END IF;
  INSERT INTO public.waitlist (branch_id, slot_start, customer_name, whatsapp) VALUES (_branch_id, _slot_start, trim(_customer_name), _whatsapp);
  PERFORM public.offer_next_waitlist(_branch_id, _slot_start);
  RETURN true;
END; $$;

-- Public offer lookups: never return names or numbers
CREATE OR REPLACE FUNCTION public.get_waitlist_offer(_token text)
RETURNS TABLE(branch_id text, slot_start timestamptz, expires_at timestamptz, status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.process_waitlist_offers();
  RETURN QUERY SELECT o.branch_id, o.slot_start, o.expires_at, o.status FROM public.waitlist_offers o WHERE o.token = _token;
END; $$;

CREATE OR REPLACE FUNCTION public.list_active_offers()
RETURNS TABLE(token text, branch_id text, slot_start timestamptz, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.process_waitlist_offers();
  RETURN QUERY SELECT o.token, o.branch_id, o.slot_start, o.expires_at FROM public.waitlist_offers o
   WHERE o.status = 'active' ORDER BY o.created_at DESC LIMIT 50;
END; $$;

-- Offered slots are held (30 min) so nobody else grabs them during the offer
CREATE OR REPLACE FUNCTION public.get_booked_slots(_branch_id text, _from timestamptz, _to timestamptz)
RETURNS TABLE(slot_start timestamptz, slot_end timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.slot_start, b.slot_end FROM public.bookings b
  WHERE b.branch_id = _branch_id AND b.status <> 'cancelled'
    AND b.slot_start < _to AND b.slot_end > _from AND _to - _from <= interval '31 days'
  UNION ALL
  SELECT o.slot_start, o.slot_start + interval '30 minutes' FROM public.waitlist_offers o
  WHERE o.branch_id = _branch_id AND o.status = 'active' AND o.expires_at > now()
    AND o.slot_start < _to AND o.slot_start + interval '30 minutes' > _from AND _to - _from <= interval '31 days';
$$;

DROP FUNCTION public.create_booking(text, text, text, text, text, integer, timestamptz);
CREATE FUNCTION public.create_booking(_branch_id text, _package_id text, _theme_id text, _customer_name text, _whatsapp text, _people_count integer, _slot_start timestamptz, _claim_token text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pkg public.packages%ROWTYPE;
  _code text;
  _chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  _end timestamptz;
  _offer public.waitlist_offers%ROWTYPE;
  _recovered boolean := false;
  i int;
BEGIN
  PERFORM public.process_waitlist_offers();
  SELECT * INTO _pkg FROM public.packages WHERE id = _package_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_package'; END IF;
  IF _people_count < 1 OR _people_count > _pkg.max_people THEN RAISE EXCEPTION 'invalid_people'; END IF;
  IF _slot_start < now() OR _slot_start > now() + interval '15 days' THEN RAISE EXCEPTION 'invalid_slot'; END IF;
  _end := _slot_start + make_interval(mins => _pkg.duration_minutes);

  IF _claim_token IS NOT NULL THEN
    SELECT * INTO _offer FROM public.waitlist_offers
     WHERE token = _claim_token AND status = 'active' AND expires_at > now()
       AND branch_id = _branch_id AND slot_start = _slot_start FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'offer_expired'; END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM public.waitlist_offers o WHERE o.branch_id = _branch_id AND o.status = 'active' AND o.expires_at > now()
             AND o.slot_start < _end AND o.slot_start + interval '30 minutes' > _slot_start
             AND (_offer.id IS NULL OR o.id <> _offer.id)) THEN
    RAISE EXCEPTION 'slot_taken';
  END IF;

  LOOP
    _code := 'SB-';
    FOR i IN 1..5 LOOP
      _code := _code || substr(_chars, 1 + floor(random() * length(_chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE booking_code = _code);
  END LOOP;
  BEGIN
    INSERT INTO public.bookings (booking_code, branch_id, package_id, theme_id, customer_name, whatsapp, people_count, slot_start, slot_end, recovered_via_waitlist)
    VALUES (_code, _branch_id, _package_id, _theme_id, trim(_customer_name), _whatsapp, _people_count, _slot_start, _end, _offer.id IS NOT NULL);
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'slot_taken';
  END;
  IF _offer.id IS NOT NULL THEN
    UPDATE public.waitlist_offers SET status = 'claimed' WHERE id = _offer.id;
    UPDATE public.waitlist SET status = 'claimed' WHERE id = _offer.waitlist_id;
  END IF;
  RETURN _code;
END; $$;

REVOKE ALL ON FUNCTION public.offer_next_waitlist(text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_booking_freed() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_waitlist_offers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_waitlist(text, timestamptz, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_waitlist_offer(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_active_offers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_booking(text, text, text, text, text, integer, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_waitlist_offers() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.join_waitlist(text, timestamptz, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_waitlist_offer(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_active_offers() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(text, text, text, text, text, integer, timestamptz, text) TO anon, authenticated;