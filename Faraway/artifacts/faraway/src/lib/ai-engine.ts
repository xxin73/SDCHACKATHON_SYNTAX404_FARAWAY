import { useEffect, useState } from 'react';
import type { CareerInsight, StudyPlan } from '@workspace/api-client-react';
import { useRecommendations, type Run } from './recommendations';
import { getState, useStore } from './store';
import { careerById } from '@/data/careers';
import { digest, preferences, profileInput, type Generated } from '../../../../supabase/functions/faraway-recommendations/core';

export type SavedInsight = CareerInsight & { meta: Generated['meta'] };
export type SavedStudyPlan = StudyPlan & { runId: string; meta: Generated['meta'] };
function insight(run: Run, id: string): SavedInsight | undefined {
  const explanation=run.result.explanations?.find(e=>e.careerId===id);
  if(!explanation)return;
  return {headline:`Your route towards ${careerById(id)?.title??id}`,scenarioExplanation:'Baseline catalogue requirements. No trend prediction or live market evidence was used.',fitSummary:explanation.fitSummary,sdgImpact:'SDG labels describe potential relevance; they do not establish measured impact.',actions:explanation.actions,meta:run.result.meta};
}
function studyPlan(run:Run):SavedStudyPlan|undefined {
  const plan=run.result.plan;if(!plan)return;
  return {runId:run.id,meta:run.result.meta,overview:plan.overview,totalWeeks:plan.totalWeeks,modules:plan.modules.map(m=>({skill:m.skills.join(', '),weeks:m.weeks,why:m.why,resource:m.title+' · '+m.provider+' · illustrative catalogue',steps:m.activities.map(a=>({title:a.title,hours:a.hours}))}))};
}
function useRemote(kind:'explain'|'plan',careerId?:string) {
  const context=useRecommendations(); const profile=useStore(s=>s.profile),plan=useStore(s=>s.plan),session=useStore(s=>s.session);
  const [run,setRun]=useState<Run>(),[error,setError]=useState<Error|null>(null),[pending,setPending]=useState(false);
  useEffect(()=>{
    let current=true;setRun(undefined);setError(null);
    if(!session?.id||!profile.complete)return;
    void Promise.all([digest(profileInput(profile)),digest(preferences(plan))]).then(([p,q])=>{
      const found=context.runs.find(r=>r.kind===kind&&r.result.meta.profileHash===p&&r.result.meta.catalogueVersion===context.catalogue?.version&&(kind!=='plan'||r.result.meta.preferencesHash===q)&&(kind!=='explain'||r.result.explanations?.some(e=>e.careerId===careerId)));
      if(current)setRun(found);
    }).catch(()=>{});
    return()=>{current=false;};
  },[profile,plan,session?.id,context.runs,context.catalogue?.version,kind,careerId]);
  const mutate=async(_input:unknown,options?:{onSuccess?:(value:any)=>void})=>{
    setError(null);setPending(true);
    try{
      const found=await context.generate(kind,kind==='plan'?getState().plan.target:careerId);
      setRun(found);options?.onSuccess?.(kind==='plan'?studyPlan(found):insight(found,careerId!));
    }catch(e){setError(e instanceof Error?e:new Error(String(e)));}finally{setPending(false);}
  };
  return {run,error,isPending:pending,mutate,reset:()=>{setRun(undefined);setError(null);}};
}
export function useGetCareerInsight(id:string){const remote=useRemote('explain',id);return {...remote,data:remote.run?insight(remote.run,id):undefined};}
export function useGenerateStudyPlan(){const remote=useRemote('plan');return {...remote,data:remote.run?studyPlan(remote.run):undefined};}
