-- Run once in Supabase Dashboard > SQL Editor > New query > Run.
-- No service-role key is used. All reads/writes run as the signed-in user.
begin;

create table if not exists public.personal_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb check (jsonb_typeof(profile) = 'object'),
  journey jsonb not null default '{}'::jsonb check (jsonb_typeof(journey) = 'object'),
  updated_at timestamptz not null default now()
);
create table if not exists public.skill_assessments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ratings jsonb not null default '{}'::jsonb check (jsonb_typeof(ratings) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.personal_profiles enable row level security;
alter table public.skill_assessments enable row level security;

drop policy if exists "Own personal profile" on public.personal_profiles;
create policy "Own personal profile" on public.personal_profiles
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "Own skill assessments" on public.skill_assessments;
create policy "Own skill assessments" on public.skill_assessments
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.personal_profiles, public.skill_assessments from anon;
grant select, insert, update, delete on public.personal_profiles, public.skill_assessments to authenticated;

-- Both rows are saved atomically. The expected ID prevents an in-flight
-- request from writing one account's data after an account switch.
create or replace function public.save_personal_journey(expected_user_id uuid, journey jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  uid uuid := auth.uid();
  ratings jsonb := journey #> '{profile,skills}';
begin
  if uid is null or uid is distinct from expected_user_id then
    raise exception 'Sign in to the matching account first' using errcode = '42501';
  end if;
  if jsonb_typeof(journey) is distinct from 'object'
     or jsonb_typeof(journey->'profile') is distinct from 'object'
     or jsonb_typeof(ratings) is distinct from 'object' then
    raise exception 'Invalid personal profile or skill assessments';
  end if;
  if exists (
    select 1 from jsonb_each(ratings) as r
    where jsonb_typeof(r.value) <> 'number'
       or r.value::text !~ '^[0-5]$'
  ) then raise exception 'Skill ratings must be whole numbers from 0 to 5'; end if;

  insert into public.personal_profiles(user_id, profile, journey, updated_at)
  values (uid, (journey->'profile') - 'skills', journey - 'profile', now())
  on conflict (user_id) do update
    set profile = excluded.profile, journey = excluded.journey, updated_at = excluded.updated_at;
  insert into public.skill_assessments(user_id, ratings, updated_at)
  values (uid, ratings, now())
  on conflict (user_id) do update set ratings = excluded.ratings, updated_at = excluded.updated_at;
end;
$$;

create or replace function public.load_personal_journey(expected_user_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null or auth.uid() is distinct from expected_user_id then
    raise exception 'Sign in to the matching account first' using errcode = '42501';
  end if;
  select p.journey || jsonb_build_object('profile',
    p.profile || jsonb_build_object('skills', coalesce(s.ratings, '{}'::jsonb)))
  into result from public.personal_profiles p
  left join public.skill_assessments s on s.user_id = p.user_id
  where p.user_id = auth.uid();
  return result;
end;
$$;

revoke all on function public.save_personal_journey(uuid, jsonb) from public, anon;
revoke all on function public.load_personal_journey(uuid) from public, anon;
grant execute on function public.save_personal_journey(uuid, jsonb) to authenticated;
grant execute on function public.load_personal_journey(uuid) to authenticated;

commit;
