import test from 'node:test';
import assert from 'node:assert/strict';
import { importMembers } from '../../artifacts/faraway/src/lib/org-model';
import { skillError, cleanSkill } from '../../artifacts/faraway/src/lib/skill-validation';
import { personalDataSchema } from '../../artifacts/faraway/src/lib/personal-data';
import { defaults } from '../../artifacts/faraway/src/lib/store';
import { courseMatches, preferences } from '../../supabase/functions/faraway-recommendations/core';
test('CSV imports departments, quoted commas and ratings without inventing a target',()=>{
 const rows=importMembers('\uFEFFname,department,position,skill:SQL,skill:C++\r\n"Low, Xin Hui",Engineering,Student,4,3');
 assert.equal(rows[0].name,'Low, Xin Hui');assert.equal(rows[0].department,'Engineering');assert.equal(rows[0].target,'');assert.deepEqual(rows[0].skills,{SQL:4,'C++':3});
});
test('CSV recognises common headings, semicolons, tabs and role benchmark titles',()=>{
 const rows=importMembers('Full Name;Department;Role;SQL\nAlex;Data;Data Analyst;5');
 assert.equal(rows[0].target,'data-analyst');assert.equal(rows[0].skills.SQL,5);
 assert.equal(importMembers('name\tdepartment\tskill:SQL\nAlex\tData\t1')[0].skills.SQL,1);
});
test('CSV rejects invalid rows and ratings; blank means unassessed',()=>{
 for(const bad of ['0','6','1.5','hello'])assert.throws(()=>importMembers('name,department,skill:SQL\nAlex,Data,'+bad),/1 to 5/);
 assert.deepEqual(importMembers('name,department,skill:SQL\nAlex,Data,')[0].skills,{});
 assert.throws(()=>importMembers('name,department\nAlex,Data\n,Business'),/Row 3/);
 assert.throws(()=>importMembers('name,department,skill:SQL\nAlex,Data,3,4'),/expected 3 columns/);
});
test('skill validation blocks profanity and links but accepts technical and Unicode skill names',()=>{
 for(const good of ['C++','C#','SQL','Web Development','UI / UX','数据分析'])assert.equal(skillError(good),'');
 for(const bad of ['fuck','s\u200bhit','https://example.com','傻逼'])assert.notEqual(skillError(bad),'');
 assert.equal(cleanSkill('  Web   Development  '),'Web Development');
});
test('new profile fields survive cloud validation; old profiles remain valid',()=>{
 const data=structuredClone(defaults);data.profile.preUQualification='A-Level';data.profile.avatar='ocean';data.profile.years=99;
 assert.equal(personalDataSchema.parse(data).profile.preUQualification,'A-Level');
 assert.equal(personalDataSchema.parse(data).profile.avatar,'ocean');
 assert.equal(personalDataSchema.parse(defaults).profile.preUQualification,undefined);
});
test('broadening learning format preserves Free and excludes paid courses',()=>{
 const original={...defaults.plan,cost:'free' as const,delivery:'online' as const,onlineOnly:true};
 const broadened={...original,setting:'either' as const,delivery:'any' as const,onlineOnly:false};
 const paid={id:'paid',version:'1',title:'Paid',provider:'Provider',skills:['SQL'],hours:1,cost:50,rating:5,online:true,setting:'indoor',hrdc:false};
 assert.equal(preferences(broadened).cost,'free');assert.equal(courseMatches(paid,preferences(broadened)),false);
});
