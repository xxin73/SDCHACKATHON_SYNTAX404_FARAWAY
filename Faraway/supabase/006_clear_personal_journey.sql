-- Clears only the signed-in user's saved AI plans and learning progress.
-- Run once in Supabase SQL Editor. The shared career/course catalogue and
-- AI abuse-prevention attempt log are intentionally preserved.
create or replace function public.clear_personal_journey_history(expected_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null or uid is distinct from expected_user_id then
    raise exception 'Sign in to the matching account first' using errcode = '42501';
  end if;

  delete from public.active_learning_plans where user_id = uid;
  delete from public.learning_completions where user_id = uid;
  delete from public.recommendation_runs where user_id = uid;
end;
$$;

revoke all on function public.clear_personal_journey_history(uuid) from public, anon;
grant execute on function public.clear_personal_journey_history(uuid) to authenticated;
