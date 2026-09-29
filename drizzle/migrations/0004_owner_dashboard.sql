CREATE TYPE public.app_role AS ENUM ('owner');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Price snapshot per booking
ALTER TABLE public.bookings ADD COLUMN total_price integer;
UPDATE public.bookings b SET total_price = p.price FROM public.packages p WHERE p.id = b.package_id AND b.total_price IS NULL;
CREATE OR REPLACE FUNCTION public.set_booking_price() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.total_price IS NULL THEN SELECT price INTO NEW.total_price FROM public.packages WHERE id = NEW.package_id; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_set_price BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_booking_price();

-- Owner can edit package prices
GRANT UPDATE ON public.packages TO authenticated;
CREATE POLICY "Owners update packages" ON public.packages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
GRANT SELECT ON public.packages TO anon, authenticated;

-- Blocked slots
CREATE TABLE public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id text NOT NULL REFERENCES public.branches(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
GRANT SELECT, INSERT, DELETE ON public.blocked_slots TO authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage blocks" ON public.blocked_slots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));

CREATE OR REPLACE FUNCTION public.reject_blocked_booking() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'cancelled' AND (TG_OP = 'INSERT' OR NEW.slot_start IS DISTINCT FROM OLD.slot_start) AND EXISTS (
    SELECT 1 FROM public.blocked_slots s WHERE s.branch_id = NEW.branch_id AND s.starts_at < NEW.slot_end AND s.ends_at > NEW.slot_start
  ) THEN RAISE EXCEPTION 'slot_taken'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER bookings_reject_blocked BEFORE INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.reject_blocked_booking();

CREATE OR REPLACE FUNCTION public.get_booked_slots(_branch_id text, _from timestamptz, _to timestamptz)
RETURNS TABLE(slot_start timestamptz, slot_end timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.slot_start, b.slot_end FROM public.bookings b
  WHERE b.branch_id = _branch_id AND b.status <> 'cancelled'
    AND b.slot_start < _to AND b.slot_end > _from AND _to - _from <= interval '31 days'
  UNION ALL
  SELECT o.slot_start, o.slot_start + interval '30 minutes' FROM public.waitlist_offers o
  WHERE o.branch_id = _branch_id AND o.status = 'active' AND o.expires_at > now()
    AND o.slot_start < _to AND o.slot_start + interval '30 minutes' > _from AND _to - _from <= interval '31 days'
  UNION ALL
  SELECT s.starts_at, s.ends_at FROM public.blocked_slots s
  WHERE s.branch_id = _branch_id AND s.starts_at < _to AND s.ends_at > _from AND _to - _from <= interval '31 days';
$$;

-- Owner RPCs
CREATE OR REPLACE FUNCTION public.admin_day_bookings(_day date)
RETURNS TABLE(id uuid, booking_code text, branch_id text, package_id text, customer_name text, whatsapp text, people_count int, slot_start timestamptz, slot_end timestamptz, status public.booking_status, deposit_status public.deposit_status, recovered_via_waitlist boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY SELECT b.id, b.booking_code, b.branch_id, b.package_id, b.customer_name, b.whatsapp, b.people_count, b.slot_start, b.slot_end, b.status, b.deposit_status, b.recovered_via_waitlist
  FROM public.bookings b
  WHERE (b.slot_start AT TIME ZONE 'Asia/Jakarta')::date = _day AND b.status <> 'cancelled'
  ORDER BY b.slot_start;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_booking_status(_id uuid, _status public.booking_status)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _status NOT IN ('completed', 'no_show', 'confirmed') THEN RAISE EXCEPTION 'invalid_status'; END IF;
  UPDATE public.bookings SET status = _status WHERE id = _id AND status <> 'cancelled';
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  _week_start date := date_trunc('week', (now() AT TIME ZONE 'Asia/Jakarta'))::date;
  _res jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'owner') THEN RAISE EXCEPTION 'forbidden'; END IF;
  WITH b AS (
    SELECT bk.*, (bk.slot_start AT TIME ZONE 'Asia/Jakarta') AS local_start,
      coalesce(bk.total_price, p.price) AS price,
      round(coalesce(bk.total_price, p.price) * 0.3 / 1000.0)::int * 1000 AS deposit
    FROM public.bookings bk JOIN public.packages p ON p.id = bk.package_id
  ), rev AS (
    SELECT local_start::date AS d,
      (CASE WHEN deposit_status = 'paid' THEN deposit ELSE 0 END)
      + (CASE WHEN status = 'completed' THEN price - deposit ELSE 0 END) AS amount
    FROM b
  )
  SELECT jsonb_build_object(
    'today_revenue', (SELECT coalesce(sum(amount), 0) FROM rev WHERE d = _today),
    'week_revenue', (SELECT coalesce(sum(amount), 0) FROM rev WHERE d >= _week_start AND d < _week_start + 7),
    'no_show', (SELECT count(*) FROM b WHERE status = 'no_show' AND slot_start >= now() - interval '30 days' AND slot_start <= now()),
    'attended', (SELECT count(*) FROM b WHERE status IN ('completed', 'no_show') AND slot_start >= now() - interval '30 days' AND slot_start <= now()),
    'recovered_count', (SELECT count(*) FROM b WHERE recovered_via_waitlist AND status <> 'cancelled'),
    'recovered_revenue', (SELECT coalesce(sum(price), 0) FROM b WHERE recovered_via_waitlist AND status <> 'cancelled'),
    'hours', (SELECT coalesce(jsonb_agg(jsonb_build_object('hour', h, 'count', c) ORDER BY h), '[]'::jsonb) FROM (
       SELECT extract(hour FROM local_start)::int AS h, count(*) AS c FROM b
       WHERE status <> 'cancelled' AND slot_start >= now() - interval '30 days' AND slot_start < now() + interval '15 days'
       GROUP BY 1) x)
  ) INTO _res;
  RETURN _res;
END $$;

GRANT EXECUTE ON FUNCTION public.admin_day_bookings(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_booking_status(uuid, public.booking_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_day_bookings(date) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_booking_status(uuid, public.booking_status) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_stats() FROM anon, public;