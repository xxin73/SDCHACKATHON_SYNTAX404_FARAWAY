import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { rank, candidates, type Catalogue } from '../../supabase/functions/faraway-recommendations/core';
import { computeMatch } from '../../artifacts/faraway/src/lib/match';
import { setDatabaseCatalogue } from '../../artifacts/faraway/src/lib/catalogue-status';
import { CAREERS } from '../../artifacts/faraway/src/data/careers';
import { sampleProfile } from '../../artifacts/faraway/src/lib/store';

test('ESCO migration is repeatable, validates sources and aligns server gaps with the hexagon scores',async()=>{
  const db=new PGlite();
  const original=structuredClone(CAREERS);
  const file=(n:string)=>readFile(new URL('../../supabase/'+n,import.meta.url),'utf8');
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema public,auth to anon,authenticated,service_role;`);
    for(const n of ['001_personal_auth.sql','002_ai_recommendations.sql','003_esco_reference.sql'])await db.exec(await file(n));
    const readCurrent=async()=> (await db.query<any>('select * from recommendation_catalogues where is_current')).rows[0];
    const before=await readCurrent();
    const migration=await file('004_esco_hexagon.sql');
    await db.exec(migration);await db.exec(migration);
    const row=await readCurrent();
    assert.equal(row.version,'esco-1.2.1-six-areas-v1');
    assert.equal((await db.query('select * from recommendation_catalogues')).rows.length,2);
    assert.deepEqual(row.payload.courses,before.payload.courses);
    const cat={...row.payload,version:row.version} as Catalogue;
    const refs=(await db.query<any>('select * from career_skill_references')).rows;
    const mapped=cat.careers.filter(c=>c.skillEvidence);
    assert.equal(mapped.length,5);
    CAREERS.splice(0,CAREERS.length,...cat.careers as any);
    setDatabaseCatalogue(true);
    for(const role of mapped){
      const evidence=role.skillEvidence!;
      assert.equal(Object.keys(role.required).length,6);
      assert.deepEqual(Object.keys(role.required).sort(),evidence.groups.map(g=>g.skill).sort());
      const source=refs.find(r=>r.career_id===role.id).payload;
      for(const group of evidence.groups){
        assert.equal(role.required[group.skill],3);
        for(const s of group.sourceSkills)assert.ok(source.skills.some((t:any)=>t.uri===s.uri&&t.relation===s.relation));
      }
      const profile={...structuredClone(sampleProfile),careers:[role.id],skills:{SQL:1,Statistics:2},complete:true};
      const server=rank(profile,cat).find(m=>m.careerId===role.id)!;
      const client=computeMatch(role as any,profile,'fast');
      assert.equal(server.score,client.score);
      assert.deepEqual(server.gaps,client.gaps);
      const selected=candidates(cat,profile,{target:role.id,setting:'either',cost:'any',onlineOnly:false,minutesPerDay:60,mode:'recommended',skills:[]});
      assert.equal(selected.missing.length,0);
      assert.deepEqual(selected.selected.sort(),server.gaps.map(g=>g.skill).sort());
    }
    // A selected source skill changes the actual score, not only the display.
    const data=cat.careers.find(c=>c.id==='data-analyst')!;
    assert.ok('Excel' in data.required);assert.ok(!('AI Tools' in data.required));
    const p={...structuredClone(sampleProfile),skills:{},complete:true};
    const low=rank(p,cat).find(m=>m.careerId===data.id)!.score;
    assert.ok(rank({...p,skills:{Excel:3}},cat).find(m=>m.careerId===data.id)!.score>low);
    await db.exec('set role authenticated');
    assert.equal((await db.query('select * from career_skill_references')).rows.length,5);
    await assert.rejects(db.query('delete from career_skill_references'),/permission denied/);
    await db.exec('reset role;set role anon');
    await assert.rejects(db.query('select * from career_skill_references'),/permission denied/);
  }finally{CAREERS.splice(0,CAREERS.length,...original);setDatabaseCatalogue(false);await db.close();}
});
