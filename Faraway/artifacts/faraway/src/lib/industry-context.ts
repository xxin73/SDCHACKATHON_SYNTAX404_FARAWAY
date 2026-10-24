import {CAREERS,type Career} from '@/data/careers';
import {roleForPosition} from './org-intelligence';
import type {OrganizationData} from './org-model';
const sectors:[RegExp,string[]][]=[[/hospital|touris|hotel|restaurant|cater|food service/i,['hospitality']],[/technolog|software|\bit\b|comput|data/i,['cs']],[/health|medic|clinic/i,['health']],[/financ|bank|account/i,['finance']],[/manufactur|engineer|chemical/i,['engineering']],[/educat|univers|tvet|teach/i,['education']],[/agricult|farm/i,['agriculture']],[/business|market|sales|customer|human resource|\bhr\b|administrat|insurance|real estate|consult/i,['business']],[/retail|commerce/i,['entrepreneurship']],[/logistic|transport/i,['logistics']],[/construct|build/i,['construction']],[/law|legal/i,['law']]];
/** Departments (HR) and academic programmes (university) use the same relevance rules. */
export function industryRoles(org:OrganizationData,department='all'):Career[]{
 const units=(org.departmentSetup??[]).filter(d=>department==='all'||d.name===department);
 const names=units.length?units.map(d=>d.name):department==='all'?[]:[department];
 const key=(s:string)=>s.toLowerCase().replace(/[^a-z0-9+#]+/g,' ').trim();
 const common=new Set(['ai tools','communication','communications and media','english language','administration and management','problem solving']);
 const scored=new Map<string,number>();
 for(const name of names){
  const unit=units.find(d=>d.name===name);
  const members=org.members.filter(m=>m.department===name);
  const skills=new Set([...(unit?.skills??[]),...members.flatMap(m=>Object.keys(m.skills))].map(key));
  const specific=[...skills].filter(s=>!common.has(s));
  const streams=sectors.filter(([re])=>re.test(name)).flatMap(([,s])=>s);
  const words=key(name).split(' ').filter(w=>w.length>=4&&!['department','programme','program','management','general','services','service'].includes(w));
  for(const role of CAREERS){
   const required=Object.keys(role.required).map(key);
   const overlap=specific.filter(s=>required.includes(s)).length;
   const titleMatch=words.some(w=>key(role.title).includes(w));
   const streamMatch=streams.includes(role.stream)||role.interests?.some(s=>streams.includes(s));
   const explicit=members.some(m=>(m.target||roleForPosition(m.position)?.id)===role.id);
   // Recognised unit names define the candidate field; specific skill overlap
   // narrows unknown unit names without letting common skills match every job.
   const hasSpecific=specific.length>0;
   const educationRole=/teacher|instructor|professor|postsecondary/i.test(role.title);
   const educationUnit=/educat|teach|training/i.test(name);
   const eligible=explicit||((!educationRole||educationUnit)&&(hasSpecific?(overlap>=2&&(titleMatch||streamMatch||!streams.length)):(titleMatch||streamMatch)));
   if(eligible)scored.set(role.id,Math.max(scored.get(role.id)??0,(titleMatch?8:0)+(streamMatch?4:0)+(explicit?6:0)+overlap*3));
  }
 }
 // Before units exist, the organisation industry supplies initial setup suggestions.
 if(!names.length){
  const streams=sectors.filter(([re])=>re.test(org.industry)).flatMap(([,s])=>s);
  return CAREERS.filter(c=>streams.includes(c.stream)||c.interests?.some(s=>streams.includes(s)));
 }
 return CAREERS.filter(c=>scored.has(c.id)).sort((a,b)=>(scored.get(b.id)??0)-(scored.get(a.id)??0));
}
export function departmentSuggestions(name:string,org:OrganizationData){const roles=industryRoles({...org,departmentSetup:[{name,teams:[],skills:[]} ]},name);return [...new Set(roles.slice(0,3).flatMap(c=>Object.keys(c.required)))].slice(0,8);}
