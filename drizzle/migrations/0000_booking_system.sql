CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','cancelled','no_show','completed');
CREATE TYPE public.deposit_status AS ENUM ('unpaid','paid');

CREATE TABLE public.branches (
  id text PRIMARY KEY,
  name text NOT NULL,
  address text NOT NULL,
  open_time time NOT NULL,
  close_time time NOT NULL
);
CREATE TABLE public.packages (
  id text PRIMARY KEY,
  name text NOT NULL,
  price integer NOT NULL CHECK (price >= 0),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  max_people integer NOT NULL CHECK (max_people > 0)
);
CREATE TABLE public.themes (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL
);
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text NOT NULL UNIQUE,
  branch_id text NOT NULL REFERENCES public.branches(id),
  package_id text NOT NULL REFERENCES public.packages(id),
  theme_id text NOT NULL REFERENCES public.themes(id),
  customer_name text NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 60),
  whatsapp text NOT NULL CHECK (whatsapp ~ '^(\+62|62|0)8[0-9]{7,11}$'),
  people_count integer NOT NULL CHECK (people_count > 0),
  slot_start timestamptz NOT NULL,
  slot_end timestamptz NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  deposit_status public.deposit_status NOT NULL DEFAULT 'unpaid',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (slot_end > slot_start),
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    branch_id WITH =,
    tstzrange(slot_start, slot_end, '[)') WITH &&
  ) WHERE (status <> 'cancelled')
);
CREATE INDEX bookings_branch_start_idx ON public.bookings (branch_id, slot_start);

CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id text NOT NULL REFERENCES public.branches(id),
  slot_start timestamptz NOT NULL,
  customer_name text NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 60),
  whatsapp text NOT NULL CHECK (whatsapp ~ '^(\+62|62|0)8[0-9]{7,11}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.branches, public.packages, public.themes TO anon, authenticated;
GRANT ALL ON public.branches, public.packages, public.themes, public.bookings, public.waitlist TO service_role;
GRANT INSERT ON public.waitlist TO anon, authenticated;

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read branches" ON public.branches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read packages" ON public.packages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read themes" ON public.themes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.get_booked_slots(_branch_id text, _from timestamptz, _to timestamptz)
RETURNS TABLE (slot_start timestamptz, slot_end timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.slot_start, b.slot_end FROM public.bookings b
  WHERE b.branch_id = _branch_id AND b.status <> 'cancelled'
    AND b.slot_start < _to AND b.slot_end > _from
    AND _to - _from <= interval '31 days';
$$;

CREATE OR REPLACE FUNCTION public.create_booking(
  _branch_id text, _package_id text, _theme_id text,
  _customer_name text, _whatsapp text, _people_count integer, _slot_start timestamptz
) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pkg public.packages%ROWTYPE;
  _code text;
  _chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
BEGIN
  SELECT * INTO _pkg FROM public.packages WHERE id = _package_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'invalid_package'; END IF;
  IF _people_count < 1 OR _people_count > _pkg.max_people THEN RAISE EXCEPTION 'invalid_people'; END IF;
  IF _slot_start < now() OR _slot_start > now() + interval '15 days' THEN RAISE EXCEPTION 'invalid_slot'; END IF;
  LOOP
    _code := 'SB-';
    FOR i IN 1..5 LOOP
      _code := _code || substr(_chars, 1 + floor(random() * length(_chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE booking_code = _code);
  END LOOP;
  BEGIN
    INSERT INTO public.bookings (booking_code, branch_id, package_id, theme_id, customer_name, whatsapp, people_count, slot_start, slot_end)
    VALUES (_code, _branch_id, _package_id, _theme_id, trim(_customer_name), _whatsapp, _people_count, _slot_start,
            _slot_start + make_interval(mins => _pkg.duration_minutes));
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'slot_taken';
  END;
  RETURN _code;
END;
$$;

REVOKE ALL ON FUNCTION public.get_booked_slots(text, timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_booking(text, text, text, text, text, integer, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(text, timestamptz, timestamptz) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking(text, text, text, text, text, integer, timestamptz) TO anon, authenticated;

INSERT INTO public.branches (id, name, address, open_time, close_time) VALUES
  ('dago', 'Dago', 'Dago, Bandung', '10:00', '21:00'),
  ('buahbatu', 'Buah Batu', 'Buah Batu, Bandung', '10:00', '21:00');
INSERT INTO public.packages (id, name, price, duration_minutes, max_people) VALUES
  ('solo', 'Solo', 60000, 15, 1),
  ('duo', 'Duo', 100000, 20, 2),
  ('group', 'Group', 180000, 30, 6);
INSERT INTO public.themes (id, name, description) VALUES
  ('y2k', 'Y2K', 'Bubblegum energy — chrome, stars and a butterfly clip.'),
  ('vintage', 'Vintage', 'Warm amber film vibes — soft grain and nostalgic light.'),
  ('minimal', 'Minimal', 'Clean and quiet — soft cream tones that let you shine.');