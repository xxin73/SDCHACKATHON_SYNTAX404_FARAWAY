import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../../supabase/functions/faraway-recommendations/index';
import {digest,preferences,profileInput} from '../../supabase/functions/faraway-recommendations/core';
import {PATHWAY_VERSION} from '../../supabase/functions/faraway-recommendations/pathways';
import {defaults} from '../../artifacts/faraway/src/lib/store';
const profile={...structuredClone(defaults.profile),stream:'law',careers:['lawyer'],skills:{Communication:1},complete:true};
const plan={...structuredClone(defaults.plan),target:'lawyer',mode:'recommended',cost:'free',setting:'either',delivery:'online',onlineOnly:true};
const json=(data:unknown)=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
for(const kind of ['explain','plan'] as const)test(`authenticated ${kind} passes career/skill relationships to AI and preserves computed output`,async()=>{
 let payload:any,finished:any;
 const handler=createHandler({env:n=>({SUPABASE_URL:'https://db.example',SUPABASE_ANON_KEY:'test-anon',SUPABASE_SERVICE_ROLE_KEY:'test-service',GEMINI_MODEL:'gemini-2.5-flash',GEMINI_API_KEY:'test-key'} as Record<string,string>)[n],fetch:(async(input:any,init:any)=>{const url=String(input);
 if(url.endsWith('/auth/v1/user'))return json({id:'test-user',is_anonymous:false});
 if(url.includes('personal_profiles?'))return json([{profile,journey:{plan}}]);
 if(url.includes('skill_assessments?'))return json([{ratings:profile.skills}]);
 if(url.includes('recommendation_catalogues?'))return json([{version:'fixture-base',published_at:'2026-10-24',status:'illustrative',observed_at:null,payload:{careers:[],courses:[]}}]);
 if(url.includes('reserve_recommendation'))return json({cached:false,run:{id:'test-run',lease:'test-lease'}});
 if(url.includes('generateContent')){payload=JSON.parse(JSON.parse(init.body).contents[0].parts[0].text);const output=kind==='explain'?{explanations:[{careerId:'lawyer',fitSummary:'Practise legal research and reasoned communication.',actions:['Write a legal issue brief.'],trendSummary:'The supplied snapshots are unverified. Practise checking legal sources under the selected planning scenario.'}]}:{overview:'Build legal foundations before applied practice.',modules:payload.modules.map((m:any)=>({courseId:m.courseId,why:'Practise this skill in the selected legal career.'}))};return json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(output)}]}}]});}
 if(url.includes('finish_recommendation')){finished=JSON.parse(init.body).p_result;return json({id:'test-run',kind,result:finished});}
 throw new Error('Unexpected request '+url);
 }) as typeof fetch});
 const response=await handler(new Request('https://function.example',{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json'},body:JSON.stringify({kind,careerId:'lawyer',profileHash:await digest(profileInput(profile)),preferencesHash:await digest(preferences(plan)),pathwayVersion:PATHWAY_VERSION,scenario:'fast',marketObservations:[]})}));
 assert.equal(response.status,200,JSON.stringify(await response.clone().json()));assert.equal(finished.meta.pathwayVersion,PATHWAY_VERSION);
 if(kind==='explain'){assert.equal(payload.interest.stream,'law');assert.equal(payload.matches[0].pathwayEvidence.code,'23-1011.00');assert.ok(payload.matches[0].qualificationNote);assert.deepEqual(payload.matches[0].chartFacts,[]);assert.equal(payload.matches[0].scenarioTargets['Legal Research'],5);}
 else{assert.equal(payload.career.id,'lawyer');assert.ok(finished.plan.modules.every((m:any)=>m.courseId.startsWith('pathway-')));assert.ok(finished.plan.modules.some((m:any)=>m.activities.some((a:any)=>/case or legislation/.test(a.title))));assert.equal(finished.plan.totalCost,0);}
});
