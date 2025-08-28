-- Fix security issues from the voting system migration

-- 1) Fix the view to remove SECURITY DEFINER (it's not needed since we have RLS policies)
drop view if exists public.vw_round_leaderboard;
create or replace view public.vw_round_leaderboard as
select
  r.id as round_id,
  r.name as round_name,
  c.id as contestant_id,
  c.name as contestant_name,
  rt.total,
  rank() over (partition by r.id order by rt.total desc, c.name asc) as position
from public.rounds r
join public.round_totals rt on rt.round_id = r.id
join public.contestants c on c.id = rt.contestant_id;

-- 2) Fix trigger functions by setting search_path properly
create or replace function update_updated_at_column()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function touch_round_totals_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;