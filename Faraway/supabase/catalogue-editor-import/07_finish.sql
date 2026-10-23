begin;
select pg_advisory_xact_lock(hashtext('faraway-catalogue-update'));
do $check$ begin if (select count(*) from faraway_import.catalogue_parts)<>5 or (select md5(string_agg(content,'' order by part)) from faraway_import.catalogue_parts)<>'6ddc04b9792837d75b7f501827cebf80' then raise exception 'Import incomplete. Run every numbered data part before this final file.'; end if; end $check$;
create temporary table faraway_expansion on commit drop as select string_agg(content,'' order by part)::jsonb as data from faraway_import.catalogue_parts;
insert into public.recommendation_catalogues(version,published_at,observed_at,status,payload,is_current)
select 'expanded-onet31-mslearn-v2',now(),observed_at,status,
jsonb_set(jsonb_set(jsonb_set(payload,'{careers}',(select jsonb_agg(value) from (select distinct on (value->>'id') value from (select value from jsonb_array_elements(payload->'careers') union all select value from jsonb_array_elements((select data->'careers' from faraway_expansion))) all_roles order by value->>'id') unique_roles)), '{courses}',(select jsonb_agg(value) from (select distinct on (value->>'id') value from (select value from jsonb_array_elements(payload->'courses') union all select value from jsonb_array_elements((select data->'courses' from faraway_expansion))) all_courses order by value->>'id') unique_courses)), '{skillHistory}',(select data->'skillHistory' from faraway_expansion)),false
from public.recommendation_catalogues where is_current
on conflict (version) do nothing;
update public.recommendation_catalogues set is_current=false where is_current and version<>'expanded-onet31-mslearn-v2';
update public.recommendation_catalogues set is_current=true where version='expanded-onet31-mslearn-v2';
drop table faraway_import.catalogue_parts;
commit;
