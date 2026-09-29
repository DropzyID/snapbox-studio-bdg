CREATE OR REPLACE FUNCTION public.simulate_deposit_paid(_booking_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _n int;
BEGIN
  UPDATE public.bookings SET deposit_status = 'paid', status = 'confirmed'
  WHERE booking_code = _booking_code AND status = 'pending' AND deposit_status = 'unpaid'
    AND created_at > now() - interval '11 minutes';
  GET DIAGNOSTICS _n = ROW_COUNT;
  IF _n = 0 THEN RAISE EXCEPTION 'payment_window_closed'; END IF;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.expire_unpaid_booking(_booking_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.bookings SET status = 'cancelled'
  WHERE booking_code = _booking_code AND status = 'pending' AND deposit_status = 'unpaid';
  RETURN true;
END; $$;

GRANT EXECUTE ON FUNCTION public.simulate_deposit_paid(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_unpaid_booking(text) TO anon, authenticated;