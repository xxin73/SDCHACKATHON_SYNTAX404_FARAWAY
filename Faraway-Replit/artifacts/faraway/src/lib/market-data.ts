import {parseCsv} from './org-model';
export const MARKET_KEY='faraway-job-observations-v1';
export type Observation={provider:'JobStreet'|'Indeed';role:string;query:string;geography:string;date:string;count:number;url:string;method:string};
export function parseObservations(text:string):Observation[]{
 const rows=parseCsv(text);const headers=rows.shift()?.map(s=>s.trim().toLowerCase())||[];
 const fields=['provider','role','query','geography','observed_at','count','source_url','method'];
 if(fields.some(f=>!headers.includes(f)))throw new Error('Required columns: '+fields.join(', '));
 if(!rows.length||rows.length>2000)throw new Error('Import between 1 and 2,000 observations.');
 const seen=new Set<string>();
 return rows.map((row,i)=>{const get=(k:string)=>row[headers.indexOf(k)]?.trim()||'';const provider=get('provider');
 if(provider!=='JobStreet'&&provider!=='Indeed')throw new Error(`Row ${i+2}: provider must be JobStreet or Indeed.`);
 const date=get('observed_at'),count=Number(get('count'));let url:URL;try{url=new URL(get('source_url'));}catch{throw new Error(`Row ${i+2}: invalid source URL.`);}
 const host=provider==='JobStreet'?'my.jobstreet.com':'malaysia.indeed.com';
 if(url.protocol!=='https:'||url.hostname!==host)throw new Error(`Row ${i+2}: use an HTTPS ${host} source URL.`);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date).toISOString().slice(0,10)!==date||date>new Date().toISOString().slice(0,10))throw new Error(`Row ${i+2}: invalid or future date.`);
 if(!get('count')||!Number.isSafeInteger(count)||count<0)throw new Error(`Row ${i+2}: count must be a nonnegative whole number.`);
 const role=get('role'),query=get('query'),geography=get('geography'),method=get('method');
 if(!role||!query||geography!=='Malaysia'||!method)throw new Error(`Row ${i+2}: provide role, query, method and geography Malaysia.`);
 const key=JSON.stringify([provider,role,query,geography,date,method]);if(seen.has(key))throw new Error(`Row ${i+2}: duplicate observation.`);seen.add(key);
 return {provider,role,query,geography,date,count,url:url.href,method};});
}
export function loadObservations():Observation[]{try{const value=localStorage.getItem(MARKET_KEY);if(!value)return [];return parseObservations(JSON.parse(value));}catch{return [];}}
export function observationPairs(rows:Observation[],provider:Observation['provider']){
 const latest=rows.filter(r=>r.provider===provider).sort((a,b)=>b.date.localeCompare(a.date));
 const groups=new Map<string,Observation[]>();for(const r of latest){const key=JSON.stringify([r.role,r.query,r.geography,r.method]);groups.set(key,[...(groups.get(key)||[]),r]);}
 return [...groups.values()].flatMap(group=>{const current=group[0];const prior=group.find(r=>Number(r.date.slice(0,4))===Number(current.date.slice(0,4))-1&&r.date.slice(4)===current.date.slice(4));return prior?[{role:current.role,first:prior.count,second:current.count,current,prior}]:[];});
}
