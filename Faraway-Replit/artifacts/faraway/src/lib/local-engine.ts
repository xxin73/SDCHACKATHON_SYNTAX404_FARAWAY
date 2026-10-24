import { readCvText, parseCvText, type CvResult } from './cv-reader';
/** Offline prototype engine. No network calls and no claim of trained/live AI. */
import { useState } from 'react';
import type { CareerInsight, CareerInsightInput, StudyPlan, StudyPlanInput } from '@workspace/api-client-react';
import { getState, type Plan } from './store';
import { checklistFor, courseForSkill } from './match';
function useLocalMutation<I, O>(calculate: (input:I)=>O|Promise<O>) {
  const [data,setData] = useState<O>(); const [error,setError]=useState<Error|null>(null); const [isPending,setPending]=useState(false);
  const mutate = ({data:input}:{data:I}, options?:{onSuccess?:(result:O)=>void}) => {
    setPending(true); setError(null);
    Promise.resolve().then(()=>calculate(input)).then(r=>{setData(r);options?.onSuccess?.(r);}).catch(e=>{setError(e instanceof Error?e:new Error(String(e)));}).finally(()=>setPending(false));
  };
  return {data,error,isPending,mutate,reset:()=>{setData(undefined);setError(null);}};
}
export function useGetCareerInsight(){return useLocalMutation<CareerInsightInput,CareerInsight>(x=>({
 headline:`Your route towards ${x.careerTitle}`,
 scenarioExplanation:`This is a rules-based explanation using the illustrative ${x.scenario} AI adoption scenario. It is a possible future, not a forecast or a live AI response.`,
 fitSummary:`Your weighted match is ${x.matchScore ?? 0}%. Skill fit accounts for 65%, interests 15%, experience 10%, and modelled demand 10%. Unrated skills count as zero for this estimate; reassess them before making a decision.`,
 sdgImpact:`Potential contribution: ${(x.sdgs??[]).join('; ')}. These are relevance links; a job title alone does not prove SDG impact.`,
 actions:x.gaps.length?x.gaps.slice(0,4).map(g=>`Review ${g.skill}: rated ${g.have}/5; target ${g.need}/5. Practise on a work sample, then reassess.`):['Validate your self-ratings with a portfolio task.','Choose a stretch skill and review current employer requirements.']
}));}
export function useGenerateStudyPlan(){return useLocalMutation<StudyPlanInput,StudyPlan>(x=>{
 const plan:Plan={...getState().plan,minutesPerDay:x.minutesPerDay,setting:x.setting??'either',cost:x.cost??'any'};
 const seen=new Map<string, string>();
 const modules=x.skills.flatMap(g=>{const course=courseForSkill(g.skill,plan);const hours=course?.hours??0;if(course&&seen.has(course.id))return [];if(course)seen.set(course.id,g.skill);const covered=course?x.skills.filter(g=>course.skills.includes(g.skill)).map(g=>g.skill).join(', '):g.skill;return [{skill:covered,weeks:Math.ceil(hours*60/(x.minutesPerDay*7)),why:`${g.have}/5 → ${g.need}/5 target. Confirm proficiency with a practical assessment.`,steps:course?checklistFor(g.skill,hours).map(p=>({title:p.label,hours:p.hours})):[],resource:course?`${course.title} · illustrative catalogue`:'No matching course. Change your filters before saving.'}];});
 const hours=modules.flatMap(m=>m.steps).reduce((a,b)=>a+b.hours,0);
 return {overview:`A rules-based study outline for ${x.targetJob} at ${x.minutesPerDay} minutes per day, seven days a week. Estimated hours are illustrative. Modules can run sequentially; no learning outcome is guaranteed.`,totalWeeks:Math.ceil(hours*60/(x.minutesPerDay*7)),modules};
});}
export function useParseCv(){return useLocalMutation<{fileName:string;mimeType:string;contentBase64:string;knownSkills:string[]},CvResult>(async x=>parseCvText(await readCvText(x),x.knownSkills,getState().profile));}
