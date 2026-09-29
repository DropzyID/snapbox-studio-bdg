create or replace function public.most_booked_theme()
returns text
language sql
stable
security definer
set search_path = public
as $$
  with counts as (
    select theme_id::text as t, count(*) as c
    from public.bookings
    where status <> 'cancelled'
    group by theme_id
  ),
  top as (
    select t from counts where c = (select max(c) from counts)
  )
  select case when count(*) = 1 then max(t) else null end from top;
$$;

grant execute on function public.most_booked_theme() to anon, authenticated;