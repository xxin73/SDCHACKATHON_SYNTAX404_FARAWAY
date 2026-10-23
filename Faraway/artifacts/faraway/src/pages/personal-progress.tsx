import { useState } from 'react';
import { Link } from 'wouter';
import { Check, RefreshCw } from 'lucide-react';
import { Card, CardTitle, NeedProfile, PageTitle } from '@/components/bits';
import { RecommendationMeta } from '@/components/recommendation-meta';
import { useRecommendations } from '@/lib/recommendations';
import { completionKey, progressFor } from '../../../../supabase/functions/faraway-recommendations/core';
import { cn } from '@/lib/utils';

export default function PersonalProgress(){
  const ai=useRecommendations();const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  const plan=ai.active?.result.plan;
  if(!plan)return <div className="space-y-5"><NeedProfile text="Save a generated study plan before tracking progress."/><Link href="/plan" className="btn-ink">Review study plan</Link></div>;
  const progress=progressFor(plan,ai.completed);
  return <div className="space-y-7"><PageTitle eyebrow="Learning progress" title={<>Small steps.<br/><span className="text-muted-foreground">Real momentum.</span></>} right={<Link className="btn-ghost" href="/plan">Revise plan</Link>}>Your saved plan is a fixed revision. Completed learning is retained across revisions; course completion does not change self-assessed skill levels.</PageTitle><RecommendationMeta meta={ai.active!.result.meta}/>{error&&<p role="alert">{error}</p>}<Card className="spectrum-border"><CardTitle eyebrow="Your route" title={`${progress.percent}% complete`}/><div className="h-3 overflow-hidden rounded-full bg-violet-100"><div className="spectrum-bar h-full rounded-full" style={{width:progress.percent+'%'}}/></div><p className="mt-4 font-mono text-sm" data-testid="personal-progress-hours">{progress.doneHours} / {progress.totalHours} hours</p><Link className="btn-ghost mt-4" href={'/jobs/'+ai.active!.result.careerId}><RefreshCw size={15}/>Reassess my skills</Link></Card>{plan.modules.map(module=><Card key={module.courseId}><div className="grid gap-6 md:grid-cols-2"><div><h3 className="font-display text-3xl">{module.title}</h3><p className="mt-3 text-sm">{module.why}</p><p className="mt-3 text-xs text-muted-foreground">{module.provider} · {module.hours}h · illustrative catalogue listing</p></div><ul className="space-y-2">{module.activities.map(activity=>{const checked=ai.completed.has(completionKey(module.courseId,module.courseVersion,activity.id));return <li key={activity.id}><button disabled={busy} aria-pressed={checked} data-testid={`activity-${module.courseId}-${activity.id}`} onClick={async()=>{setBusy(true);setError('');try{await ai.tick(module,activity.id);}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}} className={cn('flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm',checked?'border-emerald-200 bg-emerald-50':'bg-white/70')}><span className="grid h-5 w-5 place-items-center rounded border">{checked&&<Check size={13}/>}</span><span className="flex-1">{activity.title}</span><span>{activity.hours}h</span></button></li>;})}</ul></div></Card>)}</div>;
}
