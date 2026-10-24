import {skillRating,skillKey} from '../../../../supabase/functions/faraway-recommendations/skill-policy';
import {CAREERS,careerById,type Scenario} from '@/data/careers';
import {scenarioRequirements} from '../../../../supabase/functions/faraway-recommendations/core';
import type {Member,OrganizationData,Assignment} from './org-model';
export const roleForPosition=(value:string)=>{
 const normal=(s:string)=>s.toLowerCase().replace(/[^a-z0-9+#]+/g,' ').trim().replace(/s$/,'');
 const q=normal(value);if(!q)return undefined;
 const exact=CAREERS.find(c=>c.id.toLowerCase()===value.toLowerCase()||normal(c.title)===q);
 if(exact)return exact;
 if(q==='software developer')return CAREERS.find(c=>c.id==='software-engineer');
 const base=q.replace(/^(senior|junior|lead|principal|assistant)\s+/,'');
 const matches=CAREERS.filter(c=>normal(c.title)===base);
 // Only infer a unique role; generic titles such as staff/leader remain unassigned.
 return matches.length===1?matches[0]:undefined;
};

export function targetFor(m:Member,skill:string,scenario:Scenario,org:OrganizationData){const role=careerById(m.target)||roleForPosition(m.position);if(role)return scenarioRequirements(role.required,scenario,role.futureSkills)[Object.keys(role.required).find(s=>skillKey(s)===skillKey(skill))??skill]??0;return org.departmentSetup?.find(d=>d.name===m.department)?.skills.some(s=>skillKey(s)===skillKey(skill))?3:0;}
export function readinessFor(m:Member,roleId:string,scenario:Scenario){const role=careerById(roleId);if(!role)return null;const targets=scenarioRequirements(role.required,scenario,role.futureSkills);if(!Object.keys(targets).some(s=>skillRating(m.skills,s)!==undefined))return null;return Math.round(100*Object.entries(targets).reduce((n,[s,target])=>n+Math.min(1,(skillRating(m.skills,s)??0)/target),0)/Object.keys(targets).length);}
export function gapRows(org:OrganizationData,skill:string,scenario:Scenario,department='all'){return org.members.filter(m=>(department==='all'||m.department===department)&&targetFor(m,skill,scenario,org)>0).map(m=>({member:m,current:skillRating(m.skills,skill),required:targetFor(m,skill,scenario,org),gap:skillRating(m.skills,skill)===undefined?null:Math.max(0,targetFor(m,skill,scenario,org)-skillRating(m.skills,skill)!)}));}
export function assignmentProgress(a:Assignment){if(a.activities?.length){const total=a.activities.reduce((n,x)=>n+x.hours,0);return total?a.activities.filter(x=>x.done).reduce((n,x)=>n+x.hours,0)/total:0;}return a.done?1:0;}
export function toggleAssignment(a:Assignment,activityId?:string):Assignment{if(activityId&&a.activities){const activities=a.activities.map(x=>x.id===activityId?{...x,done:!x.done}:x);return {...a,activities,done:activities.every(x=>x.done)};}return {...a,done:!a.done,activities:a.activities?.map(x=>({...x,done:!a.done}))};}

