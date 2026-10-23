import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { CAREERS } from '../artifacts/faraway/src/data/careers';
import { COURSES } from '../artifacts/faraway/src/data/courses';

// Explicit fixture snapshot, not scraped/verified market or provider evidence.
const payload = { careers: CAREERS, courses: COURSES.map(c => ({...c,version:createHash('sha256').update(JSON.stringify({id:c.id,skills:c.skills,hours:c.hours,description:c.description,activitiesVersion:'four-activities-v1'})).digest('hex').slice(0,16)})) };
const file = new URL('../supabase/002_ai_recommendations.sql', import.meta.url);
const base = (await readFile(file,'utf8')).split('-- CATALOGUE_SEED')[0];
const sql = JSON.stringify(payload).replaceAll("'","''");
await writeFile(file, base + `-- CATALOGUE_SEED (generated from the existing practice fixtures)\ninsert into public.recommendation_catalogues(version,published_at,observed_at,status,payload,is_current)\nvalues ('practice-2026-10-23-v1','2026-10-23T00:00:00Z',null,'illustrative','${sql}'::jsonb,\nnot exists(select 1 from public.recommendation_catalogues where is_current))\non conflict(version) do nothing;\n`);
