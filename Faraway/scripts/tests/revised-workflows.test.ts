import test from 'node:test';
import assert from 'node:assert/strict';
import {withTotalYears,withRoleYears} from '../../artifacts/faraway/src/lib/experience';
import {defaults} from '../../artifacts/faraway/src/lib/store';
import {personalDataSchema} from '../../artifacts/faraway/src/lib/personal-data';
import {importMembers} from '../../artifacts/faraway/src/lib/org-model';
import {profileInput} from '../../supabase/functions/faraway-recommendations/core';
import {averageJobSeries,seriesRelevant} from '../../artifacts/faraway/src/lib/job-comparison';
const one=()=>({...structuredClone(defaults.profile),years:1,roles:[{title:'Assistant',company:'Company',years:1}]});
test('one-role totals synchronise both ways; numbers clamp to 99',()=>{
 assert.equal(withTotalYears(one(),'70').roles![0].years,70);
 assert.equal(withRoleYears(one(),0,'70').years,70);
 assert.equal(withTotalYears(one(),'100').years,99);
 assert.equal(withTotalYears(one(),'').years,0);
});
test('total overrides do not arbitrarily change multiple role durations',()=>{
 const p=one();p.roles.push({title:'Second',company:'Company',years:2});
 assert.equal(withTotalYears(p,2).roles,undefined);assert.equal(withRoleYears(p,1,'5').years,6);
});

test('Pre-U and Diploma entries persist independently from Degree',()=>{
 const d=structuredClone(defaults);d.profile.highest='Pre-U';d.profile.preUQualification='A-Level';d.profile.preU={field:'',institution:'College',year:'2024'};d.profile.diploma={field:'IT',institution:'Polytechnic',year:'2023'};d.profile.ug={field:'Software Engineering',institution:'University',year:'2028'};
 const p=personalDataSchema.parse(d).profile;assert.equal(p.preUQualification,'A-Level');assert.equal(p.diploma?.field,'IT');assert.equal(p.ug.field,'Software Engineering');
});
const ctx={department:'IT',team:'Development',skills:['SQL','Python']};
test('department CSV imports human-readable ratings without department or target columns',()=>{
 const m=importMembers('Name,Position,SQL (1-5),Python (1-5)\n"Low, Xin Hui",Developer,4,3',ctx)[0];
 assert.equal(m.name,'Low, Xin Hui');assert.equal(m.department,'IT');assert.equal(m.team,'Development');assert.equal(m.target,'');assert.deepEqual(m.skills,{SQL:4,Python:3});
});
test('department import accepts semicolons, blanks, and rejects invalid or unrelated ratings',()=>{
 assert.equal(importMembers('Name;Position;SQL (1-5)\nAlex;Analyst;5',ctx)[0].skills.SQL,5);
 assert.deepEqual(importMembers('Name,Position,SQL (1-5)\nAlex,Analyst,',ctx)[0].skills,{});
 for(const n of ['0','6','1.5','hello'])assert.throws(()=>importMembers('Name,Position,SQL (1-5)\nAlex,Analyst,'+n,ctx),/1 to 5/);
 assert.throws(()=>importMembers('Name,Position,skill:Accounting\nAlex,Analyst,4',ctx),/not an assessment skill/);
 assert.throws(()=>importMembers('Name,Position,SQL (1-5)\nAlex,Analyst,3\n,Developer,4',ctx),/Row 3/);
});
test('job averages use both sources on the same scale and exclude unmatched rows',()=>{
 const a=[{role:'Data Analyst',history:[100,120,140],fast:200,moderate:160}];const b=[{role:'Data Analyst',history:[100,130,150],fast:220,moderate:180}];
 assert.deepEqual(averageJobSeries(a,b,'fast'),[{role:'Data Analyst',previous:125,current:145,future:210}]);
 assert.equal(averageJobSeries(a,[],'fast').length,0);assert.equal(seriesRelevant('Data Analyst',['SQL']),true);assert.equal(seriesRelevant('Cloud Engineer',['Accounting']),false);
});

test('AI validation accepts 99 years and rejects values beyond the form limit',()=>{const p={...one(),stream:'cs',complete:true,skills:{SQL:2}};assert.equal(profileInput({...p,years:99}).years,99);assert.throws(()=>profileInput({...p,years:100}),/0 and 99/);});
