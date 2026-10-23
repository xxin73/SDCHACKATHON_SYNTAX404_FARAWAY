import test from 'node:test';
import assert from 'node:assert/strict';
import { courseMatches, preferences, candidates, scenarioRequirements, type Catalogue } from '../../supabase/functions/faraway-recommendations/core';
import { personalDataSchema } from '../../artifacts/faraway/src/lib/personal-data';
import { defaults, getState, setState, replaceAccountState } from '../../artifacts/faraway/src/lib/store';
import { duration } from '../../artifacts/faraway/src/lib/learning-resources';
import { parseCvText } from '../../artifacts/faraway/src/lib/cv-reader';
const pref={target:'analyst',setting:'either',cost:'any',onlineOnly:false,minutesPerDay:60,mode:'recommended',skills:[]};
const online={id:'learn',version:'v1',title:'Learn',provider:'Provider',skills:['SQL'],hours:10,cost:100,rating:4,online:true,setting:'indoor',hrdc:false};
test('delivery and budget filters are enforced independently, including online-only and verified HRD Corp',()=>{
 assert.equal(courseMatches(online,preferences({...pref,delivery:'online'})),true);
 assert.equal(courseMatches({...online,online:false},preferences({...pref,delivery:'online'})),false);
 assert.equal(courseMatches(online,preferences({...pref,delivery:'in-person'})),false);
 assert.equal(courseMatches({...online,cost:300},preferences({...pref,cost:'moderate'})),true);
 assert.equal(courseMatches({...online,cost:501},preferences({...pref,cost:'moderate'})),false);
 assert.equal(courseMatches({...online,hrdc:true},preferences({...pref,cost:'hrdc'})),false);
 assert.equal(courseMatches({...online,hrdc:true,hrdcVerifiedUrl:'https://example.com/verified'},preferences({...pref,cost:'hrdc'})),true);
});
test('recommendations include low non-zero skills and selected future targets without modifying baseline',()=>{
 const role={id:'analyst',title:'Analyst',stream:'cs',required:{SQL:3},minYears:0,demand:{moderate:80}};
 const cat={version:'v1',published_at:'today',observed_at:null,status:'illustrative',careers:[role],courses:[online]} as Catalogue;
 const profile={stream:'cs',careers:['analyst'],years:0,skills:{SQL:2},complete:true};
 assert.deepEqual(candidates(cat,profile,preferences(pref)).selected,['SQL']);
 assert.equal(candidates(cat,profile,preferences({...pref,futureScenario:'fast'})).match.gaps[0].need,5);
 assert.deepEqual(role.required,{SQL:3});
 assert.deepEqual(scenarioRequirements({SQL:3,Communication:3},'moderate'),{SQL:4,Communication:3});
});
test('new education starts unselected; expanded profile details survive validation',()=>{
 assert.equal(defaults.profile.highest,'');
 const data=structuredClone(defaults);data.profile.highest='Pre-U';data.profile.otherInterest='Marine science';data.profile.roles=[{title:'Assistant',company:'Test',years:1,responsibilities:'Analysed information'}];data.plan.delivery='online';data.plan.futureScenario='fast';data.plan.cost='moderate';
 const parsed=personalDataSchema.parse(data);assert.equal(parsed.profile.roles[0].responsibilities,'Analysed information');assert.equal(parsed.plan.delivery,'online');
});
test('explicit reassessment stays confirmed; ordinary profile editing invalidates confirmation',()=>{
 replaceAccountState({id:'one',name:'One',email:'one@test.com'});setState(s=>({...s,profile:{...s.profile,complete:true,skills:{SQL:1}}}));
 setState(s=>({...s,profile:{...s.profile,skills:{SQL:2}}}),false,true);assert.equal(getState().profile.complete,true);
 setState(s=>({...s,profile:{...s.profile,name:'Edited'}}),false);assert.equal(getState().profile.complete,false);
});
test('durations use hours and minutes; CV keyword detection does not invent proficiency',()=>{
 assert.equal(duration(3.75),'3 hours 45 minutes');assert.equal(duration(.5),'30 minutes');
 const parsed=parseCvText('Xin Hui\nxin@example.com\nPython and SQL', ['Python','SQL'],defaults.profile);
 assert.equal(parsed.email,'xin@example.com');assert.equal(parsed.skills[0].level,0);assert.equal(parsed.highest,'');
});
