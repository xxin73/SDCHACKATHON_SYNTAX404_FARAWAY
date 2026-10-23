-- Run this first. Keep normal application RLS enabled.
begin;
do $guard$ begin if not exists(select 1 from public.recommendation_catalogues where is_current) then raise exception 'Install the base AI catalogue first'; end if; end $guard$;
create schema if not exists faraway_import;
revoke all on schema faraway_import from public, anon, authenticated;
create table if not exists faraway_import.catalogue_parts (part integer primary key, content text not null);
revoke all on faraway_import.catalogue_parts from public, anon, authenticated;
alter table faraway_import.catalogue_parts enable row level security;
commit;
