import {roleForPosition} from './org-intelligence';
export interface DepartmentSetup {name:string;teams:string[];skills:string[]}
import { cleanSkill, skillError } from './skill-validation';
import { CAREERS, ALL_SKILLS, type Scenario } from '@/data/careers';
export interface Member {id:string;name:string;position:string;department:string;team?:string;target:string;skills:Record<string,number>}
export interface Assignment {id:string;memberId:string;skill:string;courseId:string;title:string;hours:number;cost:number;done:boolean;created:string;scenario:Scenario;activities?:{id:string;title:string;hours:number;done:boolean}[];planId?:string;resourceUrl?:string;preferences?:{hoursPerWeek:number;duration:number;budget:number;format:string;schedule:string};mode?:"skill"|"people"}
export interface OrganizationData {kind:'company'|'university';name:string;industry:string;headcount:number;departments?:string[];departmentCount?:number;departmentSetup?:DepartmentSetup[];members:Member[];assignments:Assignment[]}
export const ORG_KEY='faraway_workspaces_v3';
export const newOrg=(kind:OrganizationData['kind']):OrganizationData=>({kind,name:'',industry:'',headcount:0,departments:[],departmentCount:0,members:[],assignments:[]});
export function requiredLevel(target:string,skill:string,scenario:Scenario){const c=CAREERS.find(c=>c.id===target);const base=c?.required[skill]??0;return base?Math.min(5,base+(scenario==='fast'&&['AI Tools','Python','SQL','Machine Learning','Data Visualisation','Cloud Computing'].includes(skill)?1:0)):0;}
export function memberReadiness(m:Member,scenario:Scenario){const c=CAREERS.find(c=>c.id===m.target);if(!c)return null;const entries=Object.keys(c.required);return Math.round(100*entries.reduce((a,s)=>a+Math.min((m.skills[s]??0)/requiredLevel(m.target,s,scenario),1),0)/entries.length);}
export function sampleOrg(kind:OrganizationData['kind']):OrganizationData{
 const students=kind==='university';const groups=students?['Computer Science','Business Administration','Accounting']:['Operations','People & Culture','Finance'];
 return {...newOrg(kind),name:students?'Meridian University · Sample':'Meridian Logistics · Sample',industry:students?'University':'Logistics',headcount:8,members:[
 {id:'demo1',name:'Aina Sofea',position:students?'Year 3':'Operations Analyst',department:groups[0],target:'data-analyst',skills:{Python:2,SQL:2,'Data Visualisation':2,Statistics:3,'AI Tools':1,Communication:4}},
 {id:'demo2',name:'Irfan Hakim',position:students?'Year 2':'Operations Executive',department:groups[0],target:'data-analyst',skills:{Python:1,SQL:3,'Data Visualisation':2,Statistics:2,'AI Tools':2,Communication:3}},
 {id:'demo3',name:'Mei Ling',position:students?'Year 3':'HR Executive',department:groups[1],target:'hr-specialist',skills:{Communication:4,'Stakeholder Management':3,Excel:3,'AI Tools':1,'Project Management':2}},
 {id:'demo4',name:'Kavitha Raman',position:students?'Final year':'People Partner',department:groups[1],target:'business-analyst',skills:{Communication:4,Excel:4,SQL:1,'AI Tools':2,'Stakeholder Management':4}},
 {id:'demo5',name:'Adam Lee',position:students?'Year 2':'Accounts Executive',department:groups[2],target:'accountant',skills:{Accounting:4,Excel:3,'AI Tools':1,'Risk Management':2,Communication:3}},
 {id:'demo6',name:'Siti Nur',position:students?'Final year':'Finance Analyst',department:groups[2],target:'financial-analyst',skills:{'Financial Modelling':2,Excel:4,Statistics:2,Communication:4,'AI Tools':2}},
 {id:'demo7',name:'Daniel Tan',position:students?'Year 3':'Software Developer',department:groups[0],target:'software-engineer',skills:{JavaScript:3,Python:3,'Git & DevOps':2,'AI Tools':2,'Problem Solving':4}},
 {id:'demo8',name:'Priya Nair',position:students?'Year 2':'Marketing Executive',department:groups[1],target:'digital-marketer',skills:{'Digital Marketing':3,Communication:4,'AI Tools':1,'Data Visualisation':1,'Visual Design':3}}
 ]};
}
/** RFC4180-style CSV parser; preserves quoted commas and quoted line breaks. */
export function parseCsv(text:string):string[][]{const rows:string[][]=[];let row:string[]=[];let field='';let quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';}else field+=c;}if(quoted)throw new Error('Unclosed quotation mark in CSV.');row.push(field);if(row.some(v=>v.trim()))rows.push(row);return rows;}
export function importMembers(text:string,context?:{department:string;team:string;skills:string[];student?:boolean}):Member[]{
 const clean=text.replace(/^\uFEFF/,'');const first=clean.split(/\r?\n/)[0];
 const delimiter=first.includes(',')?',':first.includes('\t')?'\t':';';
 // Normalise delimiters only outside quoted fields, keeping quoted separators intact.
 let normal='',quoted=false;for(let i=0;i<clean.length;i++){const c=clean[i];if(c==='"'){if(quoted&&clean[i+1]==='"'){normal+='""';i++;continue;}quoted=!quoted;}normal+=c===delimiter&&!quoted?',':c;}
 const rows=parseCsv(normal);const header=rows.shift()?.map(s=>s.trim().toLowerCase().replace(/_/g,' '))??[];
 const aliases:Record<string,string>={'study year':'position','academic programme':'department','full name':'name','employee name':'name','group':'department','programme':'department','program':'department','current role':'position','role':'position','job title':'position'};
 const keys=header.map(h=>aliases[h]||h);
 for(const h of (context?(context.student?['name']:['name','position']):['name','department']))if(!keys.includes(h))throw new Error(`Missing column: ${h}. Use the department CSV template.`);
 if(new Set(keys).size!==keys.length)throw new Error('Duplicate CSV column names. Keep one column for each field or skill.');
 if(rows.length>500)throw new Error('Please import at most 500 people per file.');if(!rows.length)throw new Error('The CSV has headers but no people. Add one person per row.');
 return rows.map((row,i)=>{const get=(h:string)=>row[keys.indexOf(h)]?.trim()??'';
 if(row.length!==header.length)throw new Error(`Row ${i+2}: expected ${header.length} columns, found ${row.length}. Quote values that contain commas.`);
 if(!get('name')||!(context?.department||get('department')))throw new Error(`Row ${i+2}: name and department are required.`);
 const benchmark=get('target')||get('position');const c=CAREERS.find(c=>c.id.toLowerCase()===benchmark.toLowerCase())||roleForPosition(benchmark);
 const skills:Record<string,number>={};header.forEach((h,j)=>{const prefixed=h.startsWith('skill:');const raw=(prefixed?h.slice(6):h).trim().replace(/\s*\((?:[01]\s*[-–]\s*5|rating)\)$/i,'');const known=[...ALL_SKILLS,...(context?.skills??[]),'C++','C#','HTML','CSS'].find(s=>s.toLowerCase()===raw);if(!prefixed&&!known)return;const value=row[j]?.trim();if(!value)return;const name=known||cleanSkill(raw);const n=Number(value);if(skillError(name)||!Number.isInteger(n)||n<0||n>5)throw new Error(`Row ${i+2}: ${h} must have a skill rating from 0 to 5, or be blank if unassessed.`);if(context&&!context.skills.some(s=>s.toLowerCase()===name.toLowerCase()))throw new Error(`Row ${i+2}: ${name} is not an assessment skill for this department. Download its template.`);skills[name]=n;});
 return{id:(globalThis.crypto?.randomUUID?.()??`id-${Date.now()}-${Math.random().toString(36).slice(2)}`),name:get('name'),department:context?.department||get('department'),team:context?.team||get('team'),position:get('position'),target:c?.id||'',skills};});
}
export function download(name:string,data:string,type='text/csv'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export const csvCell=(s:unknown)=>'"'+String(s??'').replace(/"/g,'""')+'"';
