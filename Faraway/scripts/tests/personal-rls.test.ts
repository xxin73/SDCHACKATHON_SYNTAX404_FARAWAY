import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { defaults } from '../../artifacts/faraway/src/lib/store';
import { personalData } from '../../artifacts/faraway/src/lib/personal-data';

test('actual PostgreSQL migration: atomic persistence, ownership RLS, anonymous denial and cascade cleanup', async () => {
  const db = new PGlite();
  const a = '11111111-1111-4111-8111-111111111111';
  const b = '22222222-2222-4222-8222-222222222222';
  try {
    // Emulate only Supabase's auth schema/roles; the migration and RLS run unmodified.
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      insert into auth.users values ('${a}'), ('${b}');`);
    const migration = await readFile(new URL('../../supabase/001_personal_auth.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(migration); // Re-running the documented setup is safe.
    const asUser = async (id: string) => {
      await db.exec('reset role; set role authenticated;');
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    };
    const save = (id: string, state: unknown) => db.query('select public.save_personal_journey($1, $2::jsonb)', [id, JSON.stringify(state)]);
    const load = async (id: string) => (await db.query<{ journey: unknown }>('select public.load_personal_journey($1) as journey', [id])).rows[0].journey;
    const one = personalData(structuredClone(defaults)); one.profile.name = 'Account A'; one.profile.skills = { SQL: 3, Python: 4 };
    const two = personalData(structuredClone(defaults)); two.profile.name = 'Account B'; two.profile.skills = { SQL: 1 };
    await asUser(a); assert.equal(await load(a), null); await save(a, one);
    assert.deepEqual(await load(a), one);
    await asUser(b); assert.equal(await load(b), null); await save(b, two);
    assert.deepEqual(await load(b), two);
    for (const table of ['personal_profiles', 'skill_assessments']) {
      assert.deepEqual((await db.query(`select user_id from public.${table}`)).rows, [{ user_id: b }]);
      assert.equal((await db.query(`update public.${table} set updated_at = now() where user_id = $1 returning user_id`, [a])).rows.length, 0);
      assert.equal((await db.query(`delete from public.${table} where user_id = $1 returning user_id`, [a])).rows.length, 0);
      await assert.rejects(db.query(`update public.${table} set user_id = $1 where user_id = $2`, [a, b]), /row-level security/);
    }
    await assert.rejects(db.query('insert into public.personal_profiles(user_id) values ($1)', [a]), /row-level security/);
    await assert.rejects(db.query('insert into public.skill_assessments(user_id) values ($1)', [a]), /row-level security/);
    await assert.rejects(load(a), /matching account/);
    await assert.rejects(save(a, one), /matching account/);
    const invalid = structuredClone(two); invalid.profile.name = 'Must not commit'; invalid.profile.skills.SQL = 6;
    await assert.rejects(save(b, invalid), /whole numbers/);
    assert.deepEqual(await load(b), two);
    await asUser(a); assert.deepEqual(await load(a), one);
    await db.exec('reset role; set role anon;');
    for (const table of ['personal_profiles', 'skill_assessments']) await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
    await assert.rejects(load(a), /permission denied/);
    await assert.rejects(save(a, one), /permission denied/);
    await asUser(''); await assert.rejects(load(a), /matching account/);
    await db.exec('reset role;');
    await db.query('delete from auth.users where id = $1', [a]);
    for (const table of ['personal_profiles', 'skill_assessments']) assert.equal((await db.query(`select * from public.${table} where user_id = $1`, [a])).rows.length, 0);
  } finally { await db.close(); }
});
