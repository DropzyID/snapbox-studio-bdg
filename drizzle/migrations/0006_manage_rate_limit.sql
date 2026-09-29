CREATE OR REPLACE FUNCTION public.cancel_my_booking(_booking_code text, _whatsapp text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _b public.bookings%ROWTYPE;
BEGIN
  PERFORM public.assert_lookup_allowed(_booking_code);
  SELECT * INTO _b FROM public.bookings
  WHERE booking_code = upper(trim(_booking_code)) AND public.normalize_wa(whatsapp) = public.normalize_wa(_whatsapp)
    AND length(public.normalize_wa(_whatsapp)) >= 8 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _b.status NOT IN ('pending','confirmed') THEN RAISE EXCEPTION 'not_changeable'; END IF;
  IF _b.slot_start <= now() + interval '2 hours' THEN RAISE EXCEPTION 'too_late'; END IF;
  UPDATE public.bookings SET status = 'cancelled' WHERE id = _b.id;
  RETURN true;
END; $function$;

CREATE OR REPLACE FUNCTION public.reschedule_my_booking(_booking_code text, _whatsapp text, _new_start timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _b public.bookings%ROWTYPE; _mins int; _local time;
BEGIN
  PERFORM public.assert_lookup_allowed(_booking_code);
  SELECT * INTO _b FROM public.bookings
  WHERE booking_code = upper(trim(_booking_code)) AND public.normalize_wa(whatsapp) = public.normalize_wa(_whatsapp)
    AND length(public.normalize_wa(_whatsapp)) >= 8 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF _b.status NOT IN ('pending','confirmed') THEN RAISE EXCEPTION 'not_changeable'; END IF;
  IF _b.slot_start <= now() + interval '2 hours' THEN RAISE EXCEPTION 'too_late'; END IF;
  SELECT duration_minutes INTO _mins FROM public.packages WHERE id = _b.package_id;
  _local := (_new_start AT TIME ZONE 'Asia/Jakarta')::time;
  IF _new_start < now() OR _new_start > now() + interval '15 days'
     OR _local < time '10:00' OR _local + make_interval(mins => _mins) > time '21:00'
     OR extract(minute FROM _local)::int % 30 <> 0 THEN
    RAISE EXCEPTION 'invalid_slot';
  END IF;
  BEGIN
    UPDATE public.bookings SET slot_start = _new_start, slot_end = _new_start + make_interval(mins => _mins) WHERE id = _b.id;
  EXCEPTION WHEN exclusion_violation THEN RAISE EXCEPTION 'slot_taken';
  END;
  RETURN true;
END; $function$;