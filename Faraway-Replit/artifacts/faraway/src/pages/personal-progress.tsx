import {getLanguage,formatText} from '@/lib/i18n';
import {t as localeLabel,ui as localeText} from '@/lib/i18n';
import {t as translateUi,useLanguage} from '@/lib/i18n';
import {TrendUpdates,PlanEvidenceNotice} from '@/components/trend-updates';
import { LearningJourney } from '@/components/learning-journey';
import { duration } from '@/lib/learning-resources';
import { useState } from 'react';
import { Link } from 'wouter';
import { RefreshCw } from 'lucide-react';
import { Card, CardTitle, NeedProfile, PageTitle } from '@/components/bits';
import { RecommendationMeta } from '@/components/recommendation-meta';
import { useRecommendations } from '@/lib/recommendations';
import { completionKey, progressFor } from '../../../../supabase/functions/faraway-recommendations/core';
import { cn } from '@/lib/utils';

export default function PersonalProgress(){
  useLanguage();
  const ai=useRecommendations();const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  const plan=ai.active?.result.plan;
  if(!plan)return <div className="space-y-5"><NeedProfile text={translateUi("Save a generated study plan before tracking progress.")}/><Link href="/plan" className="btn-ink">{translateUi("Review study plan")}</Link></div>;
  const progress=progressFor(plan,ai.completed);
  const completedCourses=plan.modules.filter(m=>m.activities.every(a=>ai.completed.has(completionKey(m.courseId,m.courseVersion,a.id))));
  const achievements=[{name:'First step',earned:progress.doneHours>0,description:'Complete your first learning activity'},{name:'Course finisher',earned:completedCourses.length>0,description:'Complete every activity in one course'},{name:'Halfway there',earned:progress.percent>=50,description:'Complete half of your planned learning hours'},{name:'Pathway complete',earned:progress.percent===100,description:'Complete every activity in this plan'}];
  return <div className="space-y-7"><PageTitle eyebrow={translateUi("Learning progress")} title={<>{translateUi("Small steps.")}<br/><span className="text-muted-foreground">{translateUi("Real momentum.")}</span></>} right={<Link className="btn-ghost" href="/plan">{translateUi("Revise plan")}</Link>}>{localeText("Your saved plan is a fixed revision. Completed learning is retained across revisions; course completion does not change self-assessed skill levels.")}</PageTitle><TrendUpdates/><PlanEvidenceNotice/><RecommendationMeta meta={ai.active!.result.meta}/>{error&&<p role="alert">{error}</p>}<Card className="spectrum-border"><CardTitle eyebrow={translateUi("Your route")} title={localeLabel(`${progress.percent}% complete`)}/><div className="h-3 overflow-hidden rounded-full bg-violet-100"><div className="spectrum-bar h-full rounded-full" style={{width:progress.percent+'%'}}/></div><p className="mt-4 font-mono text-sm" data-testid="personal-progress-hours">{localeText(duration(progress.doneHours))} / {localeText(duration(progress.totalHours))}</p><Link className="btn-ghost mt-4" href={'/jobs/'+ai.active!.result.careerId}><RefreshCw size={15}/>{translateUi("Reassess my skills")}</Link></Card><Card testId="learning-badges"><CardTitle eyebrow={translateUi("Your achievements")} title={translateUi("Learning badges")}/><div className="grid gap-3 sm:grid-cols-2">{achievements.map(b=><div key={b.name} className={cn('rounded-2xl border p-4',b.earned?'border-amber-300 bg-amber-50':'bg-white/60 text-muted-foreground')}><p className="font-medium">{localeText(b.earned?'★':'☆')} {translateUi(b.name)} · {localeText(b.earned?'Earned':'Locked')}</p><p className="mt-1 text-xs">{translateUi(b.description)}</p></div>)}</div><p className="mt-3 text-xs text-muted-foreground">{localeText("Badges recognise self-reported learning activity; they are not accredited qualifications.")}</p></Card>{plan.modules.map(module=><Card key={module.courseId}><div className="grid gap-6 md:grid-cols-2"><div><h3 className="font-display text-3xl">{localeText(module.title)}</h3><p className="mt-3 text-sm">{localeText((ai.active?.result.meta.language??'en')===getLanguage()?module.why:formatText('Strengthen {skills} with guided practice and the linked learning resource. Complete the activities, apply what you learn, then reassess your progress.',{skills:localeLabel(module.skills.join(', '))}))}</p>{module.skills.filter(s=>plan.resourceQuotes?.[s]).map(s=><a className="block mt-3 text-sm underline" key={s} href={plan.resourceQuotes![s].url} target="_blank" rel="noreferrer">{localeLabel("Selected paid resource for")}{' '}{translateUi(s)}{' '}{localeLabel("· your quote RM")}{' '}{localeText(plan.resourceQuotes![s].price)}</a>)}<p className="mt-3 text-xs text-muted-foreground">{localeText(module.provider)} · {localeText(duration(module.hours))} · {localeText(module.provider==='Faraway self-study'?'authored practice outline; estimated duration':'illustrative catalogue listing')}</p></div><LearningJourney module={module} completed={ai.completed} busy={busy} onToggle={async(id:string)=>{setBusy(true);setError('');try{await ai.tick(module,id);}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}}/></div></Card>)}</div>;
}

