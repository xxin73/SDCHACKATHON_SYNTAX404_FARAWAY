import {useState} from 'react';
import {CAREERS,type Scenario,type Career} from '@/data/careers';
import {useStore} from '@/lib/store';
import {sourceHistory,roleIndex} from '@/lib/trend-index';
import {scenarioRequirements} from '../../../../supabase/functions/faraway-recommendations/core';
import {relevantRole} from '../../../../supabase/functions/faraway-recommendations/pathways';
import {BLS_OCCUPATIONS,BLS_URL,CAREER_SOC,DOSM_GROUPS,DOSM_URL} from '@/data/official-trends';
import {Card,CardTitle} from './bits';

type Pair={label:string;first:number|null;second:number|null};
function Scenario({value,onChange}:{value:Scenario;onChange:(s:Scenario)=>void}){return <div className="flex gap-1 rounded-full border p-1 text-xs">{(['moderate','fast'] as const).map(s=><button key={s} aria-pressed={s===value} className={'rounded-full px-3 py-1 '+(s===value?'bg-ink text-white':'')} onClick={()=>onChange(s)}>{s==='fast'?'Rapid AI':'Moderate AI'}</button>)}</div>;}
export function VerticalPairs({data,labels}:{data:Pair[];labels:[string,string]}){const max=Math.max(1,...data.flatMap(d=>[d.first??0,d.second??0]));return <div><div className="mb-4 flex gap-4 text-xs"><span className="text-teal-700">■ {labels[0]}</span><span className="text-amber-600">■ {labels[1]}</span></div><div className="overflow-auto"><div className="flex min-w-max gap-5">{data.map(d=><div className="w-28" key={d.label}><div className="flex h-44 items-end gap-2">{[d.first,d.second].map((n,i)=><div className="flex h-full w-1/2 flex-col justify-end text-center" key={i}><span className="text-[11px]">{n===null?'—':n.toLocaleString('en-US',{maximumFractionDigits:1})}</span><div role="img" aria-label={`${d.label}, ${labels[i]}: ${n===null?'no data':n}`} className={'min-h-1 rounded-t '+(n===null?'bg-slate-100':i?'bg-amber-400':'bg-teal-500')} style={{height:n===null?'4px':`${n/max*80}%`}}/></div>)}</div><p className="mt-2 text-center text-[11px]">{d.label}</p></div>)}</div></div></div>;}

export function TrendPanels({careerId,departmentSkills,rolesOverride,organization=false}:{careerId?:string;departmentSkills?:string[];rolesOverride?:Career[];organization?:boolean}){
 const profile=useStore(s=>s.profile);
 const [scenario,setScenario]=useState<Scenario>('moderate');
 const [skillRole,setSkillRole]=useState('');
 const related=rolesOverride??CAREERS.filter(r=>departmentSkills?Object.keys(r.required).filter(s=>departmentSkills.includes(s)).length>=2:profile.stream==='other'||relevantRole(r,profile));
 const preferred=organization?[]:related.filter(r=>profile.careers.includes(r.id));
 const selectedRole=related.find(r=>r.id===skillRole)||related.find(r=>r.id===careerId);
 const roles=[...new Map([...(selectedRole?[selectedRole]:[]),...(preferred.length?preferred:related)].map(r=>[r.id,r])).values()].slice(0,6);
 const role=selectedRole||roles[0];
 if(!role)return <Card><CardTitle title="Skill and job trends"/><p className="text-sm text-muted-foreground">Set up your interest, industry or academic programmes to show relevant occupations.</p></Card>;
 const history=sourceHistory(role), index=roleIndex(role,scenario), baseline=roleIndex(role,'moderate');
 const skillHistory=Object.keys(role.required).filter(skill=>history[skill]?.previous!==null&&history[skill]?.previous!==undefined&&history[skill]?.current!==null&&history[skill]?.current!==undefined).map(skill=>({label:skill,first:history[skill].previous!,second:history[skill].current!}));
 const skillFuture=Object.entries(role.required).map(([skill,current])=>({label:skill,first:current,second:scenarioRequirements(role.required,scenario,role.futureSkills)[skill]??current}));
 const blsRows=roles.map(r=>{const code=CAREER_SOC[r.id],occupation=BLS_OCCUPATIONS[code];const baseIndex=roleIndex(r,'moderate'),scenarioIndex=roleIndex(r,scenario);const adjustment=baseIndex.future&&scenarioIndex.future?scenarioIndex.future/baseIndex.future:1;return {role:r,code,occupation,scenarioFuture:occupation?.second===null||occupation?.second===undefined?null:occupation.second*adjustment};});
 const onetHistory=roles.map(r=>{const d=roleIndex(r,scenario);return {label:r.title,first:d.previous,second:d.current};});
 const onetFuture=roles.map(r=>{const d=roleIndex(r,scenario);return {label:r.title,first:d.current,second:d.future};});
 const maxSkillHistory=Math.max(5,...skillHistory.flatMap(d=>[d.first,d.second]));
 const maxSkillFuture=5;
 const SkillBars=({data,max,labels}:{data:Pair[];max:number;labels:[string,string]})=><div className="space-y-3">{data.map(d=><div key={d.label} className="grid gap-2 sm:grid-cols-[130px_1fr]"><span className="text-xs">{d.label}</span><div className="space-y-1">{[d.first,d.second].map((n,i)=><div key={i} className="flex items-center gap-2 text-[10px]"><span className="w-20 shrink-0 text-muted-foreground">{labels[i]}</span><div className="h-2 flex-1 rounded bg-slate-100"><div className={'h-full rounded '+(i?'bg-amber-400':'bg-teal-500')} style={{width:`${Math.max(0,Math.min(100,(n??0)/max*100))}%`}}/></div><span className="w-8 text-right">{n===null?'N/A':n.toFixed(1)}</span></div>)}</div></div>)}</div>;
 return <div className="min-w-0 space-y-6">
  <Card><CardTitle title="Skill trends" right={<><label className="sr-only" htmlFor="skill-trend-career">Career</label><select id="skill-trend-career" className="field max-w-[220px]" value={role.id} onChange={e=>setSkillRole(e.target.value)}>{related.map(r=><option key={r.id} value={r.id}>{r.title}</option>)}</select><Scenario value={scenario} onChange={setScenario}/></>}/>
   <div className="grid gap-6 lg:grid-cols-2">
    <section><h3 className="mb-3 text-sm font-medium">O*NET skill importance · previous vs current</h3>{skillHistory.length?<SkillBars data={skillHistory} max={maxSkillHistory} labels={['Previous','Current']}/>:<p className="text-sm text-muted-foreground">No mapped O*NET skill history for this career.</p>}<p className="mt-3 text-[11px] text-muted-foreground">O*NET releases 30.3 → 31.0; importance ratings are not hiring demand.</p></section>
    <section><h3 className="mb-3 text-sm font-medium">Skill requirements · current vs future</h3><SkillBars data={skillFuture} max={maxSkillFuture} labels={['Current target','Future target']}/><p className="mt-3 text-[11px] text-muted-foreground">Future targets use Faraway’s explicit {scenario==='fast'?'rapid':'moderate'} AI planning assumptions; proficiency scale 0–5.</p></section>
   </div>
  </Card>
  <div><CardTitle eyebrow="Job trend analysis" title="Previous vs current"/></div>
  <div className="grid gap-6 lg:grid-cols-2">
   <Card><CardTitle eyebrow="Occupation reference index · /100" title="O*NET previous vs current"/><VerticalPairs data={onetHistory} labels={['O*NET 30.3','O*NET 31.0']}/><p className="mt-3 text-[11px] text-muted-foreground">Mean hard-skill importance index. Occupational requirements, not vacancy counts; mapped careers use occupational analogues.</p></Card>
   <Card><CardTitle eyebrow="Malaysia · online job offerings" title="DOSM Q1 vs Q2 2026"/><VerticalPairs data={DOSM_GROUPS} labels={['Q1 2026','Q2 2026']}/><p className="mt-3 text-xs text-muted-foreground">Broad occupational groups; these counts cannot be assigned to an individual career. <a className="underline" href={DOSM_URL} target="_blank" rel="noreferrer">DOSM source, published 18 Aug 2026</a>.</p></Card>
  </div>
  <div><CardTitle eyebrow={scenario==='fast'?'Rapid AI scenario':'Moderate AI scenario'} title="Current vs future"/></div>
  <div className="grid gap-6 lg:grid-cols-2">
   <Card><CardTitle eyebrow="Occupation reference index · /100" title="O*NET current vs future" right={<Scenario value={scenario} onChange={setScenario}/>}/><VerticalPairs data={onetFuture} labels={['Current index',scenario==='fast'?'Rapid AI scenario':'Moderate AI scenario']}/><p className="mt-3 text-[11px] text-muted-foreground">Future = current index adjusted by the role’s scenario skill-target ratio. A planning sensitivity measure, not an employment forecast.</p></Card>
   <Card><CardTitle eyebrow="United States · employment, thousands" title="BLS current vs future estimate" right={<Scenario value={scenario} onChange={setScenario}/>}/><VerticalPairs data={blsRows.map(({role:r,occupation:o,scenarioFuture})=>({label:r.title,first:o?.first??null,second:scenarioFuture}))} labels={['BLS 2025 estimate',scenario==='fast'?'2035 rapid AI estimate':'2035 moderate AI estimate']}/><div className="mt-4 space-y-1 text-xs text-muted-foreground">{blsRows.map(({role:r,code,occupation:o})=><p key={r.id}>{r.title}: {o?`${o.title} (SOC ${code}); occupational analogue`:'No verified BLS occupation mapping; N/A'}</p>)}</div><p className="mt-3 text-xs text-muted-foreground">BLS publishes the 2025 estimate and 2035 baseline projection, not AI scenarios. The future bar applies the selected Faraway skill-target ratio to the BLS projection; this is an illustrative scenario estimate, not an official BLS forecast. <a className="underline" href={BLS_URL} target="_blank" rel="noreferrer">BLS Table 1.2, 2025–2035</a>.</p></Card>
  </div>
 </div>;
}
