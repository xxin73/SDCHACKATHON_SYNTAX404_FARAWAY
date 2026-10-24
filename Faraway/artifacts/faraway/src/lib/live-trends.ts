import published from '../../public/trend-evidence.json';
import {scoreOpportunity} from './opportunity-score';
import {useSyncExternalStore} from 'react';
import {BLS_OCCUPATIONS,CAREER_SOC,BLS_URL} from '@/data/official-trends';
import type {Career,Scenario} from '@/data/careers';
import {scenarioRequirements} from '../../../../supabase/functions/faraway-recommendations/core';
import {skillRating} from '../../../../supabase/functions/faraway-recommendations/skill-policy';
export type Occupation={title:string;first:number;second:number};
type Source<T>={lastSuccessAt?:string;lastCheckFailed?:boolean;status:'live'|'unavailable';url:string;data:T|null};
export type TrendEvidence={schemaVersion:1;checkedAt:string;bls:Source<{baseYear:number;futureYear:number;occupations:Record<string,Occupation>}>;dosm:Source<{period:string;unemployment:number;participation:number;employedThousands:number}>;onet:Source<{version:string;released:string}>;research:Source<{title:string;url:string;publishedAt:string}[]>};
type State={evidence:TrendEvidence|null};
function valid(x:any):x is TrendEvidence{
 if(x?.schemaVersion!==1||!Number.isFinite(Date.parse(x.checkedAt))||Date.parse(x.checkedAt)>Date.now()+60_000)return false;
 const hosts={bls:'www.bls.gov',dosm:'storage.dosm.gov.my',onet:'www.onetcenter.org',research:'export.arxiv.org'};
 for(const [key,host] of Object.entries(hosts)){const s=x[key];if(!s||!['live','unavailable'].includes(s.status))return false;try{if(new URL(s.url).hostname!==host)return false;}catch{return false;}}
 const b=x.bls.data;if(x.bls.status==='live'&&(!b||!Number.isInteger(b.baseYear)||!Number.isInteger(b.futureYear)||b.futureYear<=b.baseYear||Object.keys(b.occupations??{}).length<500||Object.values(b.occupations).some((r:any)=>!r.title||!Number.isFinite(r.first)||r.first<=0||!Number.isFinite(r.second)||r.second<0)))return false;
 const d=x.dosm.data;if(x.dosm.status==='live'&&(!d||!/^20\d{2}-\d{2}-\d{2}$/.test(d.period)||!['unemployment','participation','employedThousands'].every(k=>Number.isFinite(d[k]))))return false;
 if(x.onet.status==='live'&&(!/^\d{2}\.\d$/.test(x.onet.data?.version)||typeof x.onet.data?.released!=='string'))return false;
 if(x.research.status==='live'&&(!Array.isArray(x.research.data)||x.research.data.some((p:any)=>typeof p.title!=='string'||!/^https:\/\/arxiv.org\/abs\/[\w.\/-]+$/.test(p.url)||!/^20\d{2}-\d{2}-\d{2}$/.test(p.publishedAt))))return false;
 return true;
}
const state:State={evidence:valid(published)?published:null};
const listeners=new Set<()=>void>();
export const getTrendEvidence=()=>state.evidence;
export const subscribeTrends=(f:()=>void)=>{listeners.add(f);return()=>{listeners.delete(f);};};
export function useTrendEvidence(){return useSyncExternalStore(subscribeTrends,()=>state);}
export function evidenceFingerprint(e:TrendEvidence|null){
 // Dates checked and unrelated new papers do not invalidate a learning plan.
 const b=e?.bls.status==='live'?e.bls.data:null;
 return JSON.stringify(b?{years:[b.baseYear,b.futureYear],rows:Object.entries(b.occupations).sort(([a],[b])=>a.localeCompare(b))}:BLS_OCCUPATIONS);
}
export function marketOutlook(role:Career){
 const e=state.evidence;const live=e?.bls.status==='live'?e.bls.data:null;
 const soc=CAREER_SOC[role.id]??role.pathwayEvidence?.code?.slice(0,7)??'';
 const liveRow=live?.occupations[soc];const row=liveRow??BLS_OCCUPATIONS[soc];
 if(!row||row.first<=0)return null;
 const growth=(row.second/row.first-1)*100;
 return {soc,row,growth,index:Math.max(0,Math.min(100,50+growth*2)),baseYear:liveRow?live!.baseYear:2025,futureYear:liveRow?live!.futureYear:2035,url:BLS_URL,cached:!liveRow};
}
export function opportunity(role:Career,skills:Record<string,number>,interest:number,experience:number,scenario:Scenario){
 const required=scenarioRequirements(role.required,scenario,role.futureSkills);
 const entries=Object.entries(required);const readiness=entries.length?entries.reduce((sum,[s,n])=>sum+Math.min((skillRating(skills,s)??0)/n,1),0)/entries.length:0;
 const market=marketOutlook(role);
 const result=scoreOpportunity(readiness,interest,experience,market?.growth??null);
 return {score:result.score,readiness,market};
}
const PLAN_KEY='faraway_plan_evidence_v1:';
export function markPlanEvidence(userId:string,runId:string,role:Career|undefined){if(!role)return;try{localStorage.setItem(PLAN_KEY+userId+':'+runId,planFingerprint(role));}catch{}}
export function planFingerprint(role:Career){const m=marketOutlook(role);return JSON.stringify({soc:m?.soc??null,first:m?.row.first??null,second:m?.row.second??null,base:m?.baseYear??null,future:m?.futureYear??null});}
export function planNeedsReview(userId:string,runId:string,role:Career){try{const old=localStorage.getItem(PLAN_KEY+userId+':'+runId);return {review:old!==planFingerprint(role),known:Boolean(old)};}catch{return {review:true,known:false};}}
