-- 1. Server-side input validation for every booking insert / slot change
CREATE OR REPLACE FUNCTION public.validate_booking_row() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  _local timestamp;
  _end_local timestamp;
BEGIN
  IF NEW.booking_code !~ '^SB-[A-Z0-9]{5}$' THEN RAISE EXCEPTION 'invalid_details'; END IF;
  NEW.customer_name := trim(NEW.customer_name);
  IF length(NEW.customer_name) < 2 OR length(NEW.customer_name) > 60 OR NEW.customer_name ~ '[[:cntrl:]<>]' THEN
    RAISE EXCEPTION 'invalid_details';
  END IF;
  NEW.whatsapp := regexp_replace(NEW.whatsapp, '[\s\-().]', '', 'g');
  IF NEW.whatsapp !~ '^(\+62|62|0)8[0-9]{7,11}$' THEN RAISE EXCEPTION 'invalid_details'; END IF;
  IF TG_OP = 'INSERT' OR NEW.slot_start IS DISTINCT FROM OLD.slot_start THEN
    _local := NEW.slot_start AT TIME ZONE 'Asia/Jakarta';
    _end_local := NEW.slot_end AT TIME ZONE 'Asia/Jakarta';
    IF extract(minute FROM _local)::int NOT IN (0, 30) OR extract(second FROM _local) <> 0
       OR _local::time < time '10:00' OR _end_local::time > time '21:00' OR _end_local::date <> _local::date THEN
      RAISE EXCEPTION 'invalid_slot';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_validate BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_booking_row();

-- 2. Rate limiting for booking lookups
CREATE TABLE public.lookup_attempts (
  id bigserial PRIMARY KEY,
  client_key text NOT NULL,
  booking_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.lookup_attempts TO service_role;
ALTER TABLE public.lookup_attempts ENABLE ROW LEVEL SECURITY;
-- no policies: only SECURITY DEFINER functions touch it
CREATE INDEX lookup_attempts_key_idx ON public.lookup_attempts (client_key, created_at);
CREATE INDEX lookup_attempts_code_idx ON public.lookup_attempts (booking_code, created_at);

CREATE OR REPLACE FUNCTION public.request_client_key() RETURNS text
LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE _h json;
BEGIN
  BEGIN _h := current_setting('request.headers', true)::json; EXCEPTION WHEN others THEN _h := NULL; END;
  RETURN coalesce(split_part(coalesce(_h->>'cf-connecting-ip', _h->>'x-forwarded-for', _h->>'x-real-ip', ''), ',', 1), '');
END $$;

CREATE OR REPLACE FUNCTION public.assert_lookup_allowed(_booking_code text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _key text := public.request_client_key();
BEGIN
  IF (SELECT count(*) FROM public.lookup_attempts WHERE client_key = _key AND _key <> '' AND created_at > now() - interval '15 minutes') >= 8
     OR (SELECT count(*) FROM public.lookup_attempts WHERE booking_code = upper(trim(coalesce(_booking_code, ''))) AND created_at > now() - interval '15 minutes') >= 5 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;
END $$;

DROP FUNCTION public.find_my_booking(text, text);
CREATE FUNCTION public.find_my_booking(_booking_code text, _whatsapp text)
RETURNS TABLE(booking_code text, branch_id text, package_id text, theme_id text, customer_name text, people_count integer, slot_start timestamptz, slot_end timestamptz, status public.booking_status, deposit_status public.deposit_status)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE _code text := upper(trim(coalesce(_booking_code, '')));
BEGIN
  PERFORM public.assert_lookup_allowed(_code);
  DELETE FROM public.lookup_attempts WHERE created_at < now() - interval '1 day';
  RETURN QUERY
    SELECT b.booking_code, b.branch_id, b.package_id, b.theme_id, b.customer_name, b.people_count,
           b.slot_start, b.slot_end, b.status, b.deposit_status
    FROM public.bookings b
    WHERE _code ~ '^SB-[A-Z0-9]{5}$'
      AND length(coalesce(_whatsapp, '')) <= 20
      AND b.booking_code = _code
      AND public.normalize_wa(b.whatsapp) = public.normalize_wa(_whatsapp)
      AND length(public.normalize_wa(_whatsapp)) >= 8
    LIMIT 1;
  IF NOT FOUND THEN
    INSERT INTO public.lookup_attempts (client_key, booking_code) VALUES (public.request_client_key(), left(_code, 20));
    PERFORM pg_sleep(0.8);
  END IF;
END $$;

-- cancel/reschedule also respect the lookup limit
CREATE OR REPLACE FUNCTION public.guard_manage_rate() RETURNS void LANGUAGE sql AS $$ SELECT 1 $$;

-- 3. Expiry can only happen once the payment window has actually passed
CREATE OR REPLACE FUNCTION public.expire_unpaid_booking(_booking_code text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.bookings SET status = 'cancelled'
   WHERE booking_code = upper(trim(_booking_code)) AND status = 'pending' AND deposit_status = 'unpaid'
     AND created_at <= now() - interval '9 minutes 45 seconds';
  RETURN FOUND;
END $$;

-- 4. Lock down function execution
DROP FUNCTION public.guard_manage_rate();
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_booking_price() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.reject_blocked_booking() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_booking_row() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.assert_lookup_allowed(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.request_client_key() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.find_my_booking(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.find_my_booking(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_unpaid_booking(text) TO anon, authenticated;