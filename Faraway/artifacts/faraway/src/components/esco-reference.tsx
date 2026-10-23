import { useEffect, useState } from 'react';
import { requireSupabase } from '@/lib/supabase';

type Reference = {
  occupation_uri: string; occupation_label: string; esco_version: string;
  skills: {uri:string;label:string;relation:'essential'|'optional';type:string;description:string}[];
};

export function EscoReference({careerId}:{careerId:string}) {
  const [record,setRecord]=useState<Reference|null>(null);
  const [status,setStatus]=useState('Loading source skills…');
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    let cancelled=false;
    setRecord(null);setStatus('Loading source skills…');
    async function load(){
      try {
        const {data,error}=await requireSupabase().from('career_skill_references')
          .select('payload').eq('career_id',careerId).eq('esco_version','1.2.1').maybeSingle();
        if(cancelled)return;
        if(error)throw error;
        if(!data){setStatus('No ESCO mapping has been imported for this career yet.');return;}
        const value=data.payload as Reference;
        if(!value || !Array.isArray(value.skills) || !value.occupation_label ||
          value.skills.some(s=>!s.label||!['essential','optional'].includes(s.relation)))throw new Error('Invalid reference data');
        setRecord(value);setStatus('');
      }catch{if(!cancelled)setStatus('Source skills are unavailable. The database import may still be pending.');}
    }
    void load();return()=>{cancelled=true;};
  },[careerId,retry]);
  return <section className="rounded-3xl border bg-white/80 p-6 space-y-4" aria-label="ESCO skill reference" data-testid="esco-reference">
    <div><p className="text-xs uppercase tracking-wider text-muted-foreground">European Commission · ESCO 1.2.1</p>
      <h2 className="font-display text-2xl mt-1">Skills from the source</h2></div>
    <p className="text-sm text-muted-foreground">Reference snapshot with a team-selected occupation mapping. Essential and optional describe the source relationship, not your proficiency. These records do not yet change the demo match score, radar or AI plan.</p>
    {status && <p role="status" className="text-sm">{status} <button className="underline" onClick={()=>setRetry(n=>n+1)}>Retry</button></p>}
    {record && <>
      <p className="text-sm">Mapped occupation: <a className="underline" target="_blank" rel="noreferrer" href={record.occupation_uri.replace('http:','https:')}>{record.occupation_label}</a></p>
      {(['essential','optional'] as const).map(kind=><details key={kind} open={kind==='essential'} className="rounded-xl border p-4">
        <summary className="cursor-pointer font-medium capitalize">{kind} skills and knowledge ({record.skills.filter(s=>s.relation===kind).length})</summary>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">{record.skills.filter(s=>s.relation===kind).map(s=><li key={s.uri} className="text-sm">
          <a href={s.uri.replace('http:','https:')} target="_blank" rel="noreferrer" className="underline" title={s.description}>{s.label}</a>
        </li>)}</ul>
      </details>)}
      <p className="text-xs text-muted-foreground">Source: <a className="underline" href="https://esco.ec.europa.eu/en/use-esco/download" target="_blank" rel="noreferrer">European Commission ESCO classification</a>, version {record.esco_version}. European occupation reference; not evidence of current Malaysian job demand.</p>
    </>}
  </section>;
}
