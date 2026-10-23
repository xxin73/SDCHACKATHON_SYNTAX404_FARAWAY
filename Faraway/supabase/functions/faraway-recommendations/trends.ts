import type {Role} from './core';
export type TrendObservation={provider:'JobStreet'|'Indeed';role:string;query:string;geography:string;date:string;count:number;url:string;method:string};
export function validateTrendObservations(value:unknown):TrendObservation[]{
 if(value===undefined)return [];if(!Array.isArray(value)||value.length>40)throw new Error('Send at most 40 chart observations.');
 return value.map(v=>{if(!v||typeof v!=='object')throw new Error('Invalid chart observation.');const r=v as Record<string,unknown>;
 if(r.provider!=='JobStreet'&&r.provider!=='Indeed')throw new Error('Unsupported trend source.');
 for(const k of ['role','query','geography','date','url','method'])if(typeof r[k]!=='string'||!(r[k] as string).trim()||(r[k] as string).length>500)throw new Error('Invalid chart metadata.');
 const date=r.date as string;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date>new Date().toISOString().slice(0,10))throw new Error('Invalid chart date.');
 const url=new URL(r.url as string);if(url.protocol!=='https:'||url.hostname!==(r.provider==='JobStreet'?'my.jobstreet.com':'malaysia.indeed.com'))throw new Error('Invalid chart source URL.');
 if(r.geography!=='Malaysia'||typeof r.count!=='number'||!Number.isSafeInteger(r.count)||r.count<0)throw new Error('Invalid chart count or geography.');
 return {provider:r.provider,role:r.role as string,query:r.query as string,geography:'Malaysia',date,count:r.count,url:url.href,method:r.method as string};});
}
const norm=(s:string)=>s.trim().toLowerCase();
export function observationsForRole(role:Pick<Role,'id'|'title'>,rows:TrendObservation[]){const labels=[role.id,role.title,...role.title.split('/')].map(norm);return rows.filter(r=>labels.includes(norm(r.role)));}
export function chartFacts(role:Role,rows:TrendObservation[]){
 const groups=new Map<string,TrendObservation[]>();for(const r of observationsForRole(role,rows)){const key=JSON.stringify([r.provider,r.role,r.query,r.geography,r.method]);groups.set(key,[...(groups.get(key)||[]),r]);}
 return [...groups.values()].flatMap(group=>{group.sort((a,b)=>b.date.localeCompare(a.date));const latest=group[0];const previous=group.find(r=>Number(r.date.slice(0,4))===Number(latest.date.slice(0,4))-1&&r.date.slice(4)===latest.date.slice(4));return previous?[{provider:latest.provider,query:latest.query,method:latest.method,previous,latest,change:latest.count-previous.count,percent:previous.count?Math.round((latest.count-previous.count)/previous.count*1000)/10:null}]:[];});
}
