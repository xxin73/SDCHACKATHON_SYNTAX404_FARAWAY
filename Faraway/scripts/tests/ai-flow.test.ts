import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { candidates, completionKey, digest, organise, preferences, profileInput, progressFor, rank, validateExplanation, type Catalogue, type Generated } from '../../supabase/functions/faraway-recommendations/core';
import { createHandler } from '../../supabase/functions/faraway-recommendations/index';
import { defaults, sampleProfile } from '../../artifacts/faraway/src/lib/store';
import { computeMatch } from '../../artifacts/faraway/src/lib/match';
import { CAREERS } from '../../artifacts/faraway/src/data/careers';
import { setDatabaseCatalogue } from '../../artifacts/faraway/src/lib/catalogue-status';

const sql = await readFile(new URL('../../supabase/002_ai_recommendations.sql',import.meta.url),'utf8');
const payload = JSON.parse(sql.match(/'illustrative','(.+)'::jsonb/)![1].replaceAll("''", "'"));
const catalogue:Catalogue={...payload,version:'practice-2026-10-23-v1',published_at:'2026-10-23T00:00:00Z',observed_at:null,status:'illustrative'};
const profile={...structuredClone(sampleProfile),complete:true};
const pref={...defaults.plan,target:'data-analyst'};
const selection=()=>candidates(catalogue,profileInput(profile),preferences(pref));
const modelOutput=()=>({overview:'Build your skills through focused practice.',modules:selection().modules.map(m=>({courseId:m.course.id,why:'Practise the selected skills before reassessment.'}))});

test('authenticated screen scores and gaps match the server baseline even when a demo scenario is toggled',()=>{
  setDatabaseCatalogue(true);
  try {
    for (const match of rank(profile,catalogue)) {
      const career=CAREERS.find(c=>c.id===match.careerId)!;
      const shown=computeMatch(career,profile,'fast');
      assert.equal(shown.score,match.score);
      assert.deepEqual(shown.gaps,match.gaps);
    }
  } finally {setDatabaseCatalogue(false);}
});

test('AI cannot invent courses, inflate hours, duplicate modules, bypass preferences or change computed results',()=>{
  const selected=selection();
  const result=organise({...modelOutput(),totalHours:9999},selected,60);
  assert.equal(result.totalHours,selected.modules.reduce((n,m)=>n+m.course.hours,0));
  assert.equal(new Set(result.modules.map(m=>m.courseId)).size,result.modules.length);
  assert.throws(()=>organise({...modelOutput(),modules:[{courseId:'invented',why:'Try it'}]},selected,60),/omitted|invented/);
  const duplicate=modelOutput();duplicate.modules[1]=duplicate.modules[0];
  assert.throws(()=>organise(duplicate,selected,60),/duplicated/);
  const noCoverage=candidates(catalogue,profileInput(profile),preferences({...pref,cost:'hrdc'}));
  assert.equal(noCoverage.modules.length,0);assert.ok(noCoverage.missing.length);
  assert.throws(()=>organise({...modelOutput(),overview:'Guaranteed salary RM 9000'},selected,60),/unsupported/);
  assert.throws(()=>validateExplanation({explanations:[{careerId:'invented',fitSummary:'Fit',actions:['Learn']}]},rank(profile,catalogue).slice(0,1)),/unknown/);
  assert.throws(()=>profileInput({...profile,complete:false}),/Confirm/);
  assert.throws(()=>profileInput({...profile,skills:{SQL:6}}),/ratings/);
  assert.throws(()=>preferences({...pref,minutesPerDay:0}),/15/);
});

test('completion survives reordered/revised plans; a different course version does not inherit unverified completion',()=>{
  const first=organise(modelOutput(),selection(),60);
  const module=first.modules[0];
  const complete=new Set(module.activities.map(a=>completionKey(module.courseId,module.courseVersion,a.id)));
  const next=organise({...modelOutput(),modules:modelOutput().modules.reverse()},selection(),120);
  assert.equal(progressFor(first,complete).doneHours,module.hours);
  assert.equal(progressFor(next,complete).doneHours,module.hours);
  const changed=structuredClone(next);changed.modules.find(m=>m.courseId===module.courseId)!.courseVersion='new-content';
  assert.equal(progressFor(changed,complete).doneHours,0);
});

test('real AI SQL migration: owned revisions, persistent completion, privileged quotas, cache and stale-profile rejection',async()=>{
  const db=new PGlite();const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema public,auth to anon,authenticated,service_role;
      insert into auth.users values('${a}'),('${b}');`);
    await db.exec(await readFile(new URL('../../supabase/001_personal_auth.sql',import.meta.url),'utf8'));
    await db.exec(sql);await db.exec(sql);
    await db.exec('grant all on public.personal_profiles,public.skill_assessments to service_role;');
    const asUser=async(id:string)=>{await db.exec('reset role;set role authenticated;');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);};
    const asServer=()=>db.exec('reset role;set role service_role;');
    const save=async(p:any)=>{await asUser(a);await db.query('select public.save_personal_journey($1,$2::jsonb)',[a,JSON.stringify({ ...structuredClone(defaults),profile,plan:p })]);};
    const reserve=async(hash:string,p:any)=>{await asServer();return (await db.query<{r:any}>('select public.reserve_recommendation($1,$2,$3,$4::jsonb,$5::jsonb) as r',[a,hash,'plan',JSON.stringify(profile),JSON.stringify(p)])).rows[0].r;};
    const finish=async(reserved:any,result:any)=>{await asServer();await db.query('select public.finish_recommendation($1,$2,$3::jsonb)',[reserved.run.id,reserved.run.lease,JSON.stringify(result)]);};
    await save(pref);
    const first=await reserve('first',pref);
    const result={kind:'plan',careerId:pref.target,plan:organise(modelOutput(),selection(),60)};
    await finish(first,result);
    await asUser(a);await db.query('select public.activate_learning_plan($1)',[first.run.id]);
    const module=result.plan.modules[0];
    await db.query('insert into public.learning_completions(user_id,course_id,course_version,activity_id) values($1,$2,$3,$4)',[a,module.courseId,module.courseVersion,'foundations']);
    const revised={...pref,minutesPerDay:120};await save(revised);
    const second=await reserve('second',revised);await finish(second,{...result,plan:organise(modelOutput(),selection(),120)});
    await asUser(a);await db.query('select public.activate_learning_plan($1)',[second.run.id]);
    assert.equal((await db.query('select * from public.learning_completions')).rows.length,1);
    assert.equal((await db.query('select * from public.recommendation_runs')).rows.length,2);
    const cached=await reserve('second',revised);assert.equal(cached.cached,true);
    assert.equal((await db.query('select * from public.ai_request_attempts')).rows.length,2);
    await assert.rejects(reserve('third',revised),/RATE_LIMIT/);
    await asUser(b);
    for(const table of ['recommendation_runs','active_learning_plans','learning_completions'])assert.equal((await db.query(`select * from public.${table}`)).rows.length,0);
    await assert.rejects(db.query('select public.activate_learning_plan($1)',[first.run.id]),/belonging/);
    await assert.rejects(db.query('insert into public.learning_completions(user_id,course_id,course_version,activity_id) values($1,$2,$3,$4)',[a,module.courseId,module.courseVersion,'project']),/row-level security/);
    await assert.rejects(db.query("select public.reserve_recommendation($1,'bad','plan','{}','{}')",[b]),/permission denied/);
    await assert.rejects(db.query("insert into public.recommendation_runs(user_id,request_hash,kind,status,profile_snapshot,preferences_snapshot) values($1,'bad','plan','complete','{}','{}')",[b]),/permission denied/);
    await db.exec('reset role;set role anon;');await assert.rejects(db.query('select * from public.recommendation_runs'),/permission denied/);
    await asServer();await db.exec("update public.ai_request_attempts set started_at=now()-interval '2 days';");
    const third=await reserve('third',revised);
    await asUser(a);await db.query("update public.personal_profiles set profile=profile||'{\"complete\":false}'::jsonb where user_id=$1",[a]);
    await assert.rejects(finish(third,result),/PROFILE_CHANGED/);
    assert.equal((await db.query("select * from public.recommendation_runs where status='complete'")).rows.length,2);
  }finally{await db.close();}
});

test('Edge handler authenticates, validates, uses server secrets, redacts identity, caches and rejects provider failures',async()=>{
  let providerCalls=0,cache:any=null,providerStatus=200;
  const profileHash=await digest(profileInput(profile)),preferencesHash=await digest(preferences(pref));
  const fakeFetch:typeof fetch=async(input,init)=>{
    const url=String(input);const body=init?.body?JSON.parse(String(init.body)):null;
    if(url.endsWith('/auth/v1/user'))return Response.json({id:'owner',email:'never-send@example.com'});
    if(url.includes('/rest/v1/personal_profiles'))return Response.json([{profile:{...profile,skills:undefined},journey:{plan:pref}}]);
    if(url.includes('/rest/v1/skill_assessments'))return Response.json([{ratings:profile.skills}]);
    if(url.includes('/rest/v1/recommendation_catalogues'))return Response.json([{...catalogue,payload}]);
    if(url.endsWith('/rpc/reserve_recommendation'))return Response.json(cache?{cached:true,run:cache}:{cached:false,run:{id:'run',lease:'lease'}});
    if(url.endsWith('/rpc/finish_recommendation')){cache={id:'run',kind:'plan',result:body.p_result};return Response.json(cache);}
    if(url.includes('recommendation_runs?'))return new Response(null,{status:204});
    if(url.includes('generativelanguage.googleapis.com')){
      providerCalls++;assert.equal((init!.headers as any)['x-goog-api-key'],'server-secret');
      assert.ok(!String(init!.body).includes(profile.name));assert.ok(!String(init!.body).includes(profile.email));assert.ok(!String(init!.body).includes('never-send@example.com'));
      if(providerStatus!==200)return Response.json({error:'unavailable'},{status:providerStatus});
      return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(modelOutput())}]}}]});
    }
    throw new Error('Unexpected URL '+url);
  };
  const handler=createHandler({env:n=>({SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service',GEMINI_API_KEY:'server-secret',GEMINI_MODEL:'gemini-2.5-flash'}[n]),fetch:fakeFetch});
  const request=(body:any,authorization='Bearer token',origin='https://faraway-practice-faraway.vercel.app')=>new Request('https://test/functions/v1/faraway-recommendations',{method:'POST',headers:{authorization,origin,'content-type':'application/json'},body:JSON.stringify(body)});
  const body={kind:'plan',careerId:pref.target,profileHash,preferencesHash};
  assert.equal((await handler(request(body,''))).status,401);
  assert.equal((await handler(request(body,'Bearer token','https://evil.example'))).status,403);
  assert.equal((await handler(request({...body,profileHash:'0'.repeat(64)}))).status,409);
  assert.equal((await handler(request({...body,extra:'injected'}))).status,400);
  assert.equal((await handler(request({...body,extra:'x'.repeat(5000)}))).status,413);
  assert.equal((await handler(request(body))).status,200);assert.equal(providerCalls,1);
  assert.equal((await handler(request(body))).status,200);assert.equal(providerCalls,1);
  cache=null;providerStatus=429;
  const failure=await handler(request(body));assert.equal(failure.status,429);assert.match((await failure.json()).error,/quota/);
  assert.equal(cache,null);
});
