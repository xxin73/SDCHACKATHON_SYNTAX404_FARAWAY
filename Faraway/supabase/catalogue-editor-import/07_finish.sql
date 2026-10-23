-- Run the complete block. No temporary table is used.
do $finish$
declare raw_data text; imported_data jsonb; part_count integer;
begin
perform pg_advisory_xact_lock(hashtext('faraway-catalogue-update'));
select count(*),string_agg(content,'' order by part) into part_count,raw_data from faraway_import.catalogue_parts;
if part_count<>5 or raw_data is null or md5(raw_data)<>'6ddc04b9792837d75b7f501827cebf80' then
raise exception 'Import incomplete. Run all five data files before finishing.';
end if;
imported_data:=raw_data::jsonb;
if not exists(select 1 from public.recommendation_catalogues where is_current) then raise exception 'No current base catalogue found'; end if;
insert into public.recommendation_catalogues(version,published_at,observed_at,status,payload,is_current)
select 'expanded-onet31-mslearn-v2',now(),observed_at,status,
jsonb_set(jsonb_set(jsonb_set(payload,'{careers}',(select jsonb_agg(value) from (select distinct on (value->>'id') value from (select value from jsonb_array_elements(payload->'careers') union all select value from jsonb_array_elements((imported_data->'careers'))) all_roles order by value->>'id') unique_roles)), '{courses}',(select jsonb_agg(value) from (select distinct on (value->>'id') value from (select value from jsonb_array_elements(payload->'courses') union all select value from jsonb_array_elements((imported_data->'courses'))) all_courses order by value->>'id') unique_courses)), '{skillHistory}',(imported_data->'skillHistory')),false
from public.recommendation_catalogues where is_current
on conflict (version) do nothing;
update public.recommendation_catalogues set is_current=false where is_current and version<>'expanded-onet31-mslearn-v2';
update public.recommendation_catalogues set is_current=true where version='expanded-onet31-mslearn-v2';
drop table faraway_import.catalogue_parts;
end;
$finish$;
