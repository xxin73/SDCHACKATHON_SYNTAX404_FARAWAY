import { cleanSkill, skillError } from '@/lib/skill-validation';
import { scenarioRequirements } from '../../../../supabase/functions/faraway-recommendations/core';
import { duration, resourcesFor } from '@/lib/learning-resources';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { hasDatabaseCatalogue } from '@/lib/catalogue-status';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Home, Trees, Shuffle, Wifi, AlertTriangle, BookOpen } from 'lucide-react';
import { useGenerateStudyPlan } from '@/lib/ai-engine';
import { useRecommendations } from '@/lib/recommendations';
import { RecommendationMeta } from '@/components/recommendation-meta';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { careerById, careerInScenario, ALL_SKILLS } from '@/data/careers';
import { setState, useStore, type Plan } from '@/lib/store';
import { computeMatch, courseForSkill, myr } from '@/lib/match';
import { Card, CardTitle, NeedProfile, PageTitle, Reveal, ScenarioToggle, SdgPill, skillSdg } from '@/components/bits';
import { AiStage, SpectrumIcon } from '@/components/spectrum';
import { cn } from '@/lib/utils';


const updPlan = (p: Partial<Plan>) => setState((s) => ({ ...s, plan: { ...s.plan, ...p, saved: p.saved ?? false } }));

export default function PlanPage() {
  const profile = useStore((s) => s.profile);
  const scenario = useStore((s) => s.scenario);
  const plan = useStore((s) => s.plan);
  const [, nav] = useLocation();
  const [confirm, setConfirm] = useState<string | null>(null);
  const recommendations = useRecommendations();
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [review,setReview]=useState(false);
  const [availability,setAvailability]=useState(false);
  const [customSkill,setCustomSkill]=useState('');
  const [customError,setCustomError]=useState('');
  const gen = useGenerateStudyPlan();
  const ai = gen.data;
  const career = careerInScenario(careerById(plan.target), hasDatabaseCatalogue() ? 'moderate' : scenario);
  if (!profile.stream || !profile.complete) return <NeedProfile text="Confirm your profile and skills before generating a plan." />;
  if (!career) return <NeedProfile text="Pick a career target first." />;

  const match = computeMatch(career, profile, scenario);
  const required=scenarioRequirements(career.required,plan.futureScenario,career.futureSkills);
  const gaps=Object.entries(required).map(([skill,need])=>({skill,need,have:profile.skills[skill]??0})).filter(g=>g.have<g.need).sort((a,b)=>(b.need-b.have)-(a.need-a.have));
  const recommended = gaps.map(g=>g.skill);
  const selected = plan.mode === 'recommended' ? recommended : plan.skills;
  const pool = Array.from(new Set([...Object.keys(career.required), ...ALL_SKILLS, ...plan.skills]));
  const options = plan.mode === 'recommended' ? recommended : pool;
  const rows = selected.map((s) => ({ skill: s, course: courseForSkill(s, plan), have: profile.skills[s] ?? 0, need: required[s] ?? 4 }));
  const missingSkills = rows.filter(r=>!r.course).map(r=>r.skill);
  const availableSkills=rows.filter(r=>r.course).map(r=>r.skill);
  const canGenerate = selected.length > 0 && missingSkills.length === 0;
  const hasPreviousPlan = recommendations.runs.some(r=>r.kind==='plan');
  const uniqueRows = Array.from(new Map(rows.filter(r=>r.course).map(r=>[r.course!.id,r])).values());
  const total = uniqueRows.reduce((a, r) => a + (r.course?.cost ?? 0), 0);
  const hours = uniqueRows.reduce((a, r) => a + (r.course?.hours ?? 0), 0);
  const weeks = Math.ceil((hours * 60) / plan.minutesPerDay / 7);

  const toggle = (s: string) => {
    if (selected.includes(s)) {
      if (career.core.includes(s)) { setConfirm(s); return; }
      updPlan({ mode: 'custom', skills: selected.filter((x) => x !== s), saved: false });
    } else updPlan({ mode: 'custom', skills: [...selected, s], saved: false });
  };
  const generate = () => { setSaveError(''); if(!canGenerate){setAvailability(true);return;} void gen.mutate({}, {onSuccess:()=>setReview(true)}); };
  const save = async () => {
    setSaveError('');setSaving(true);
    try {
      if (!gen.run || rows.some(r=>!r.course)) throw new Error('Generate a complete AI plan for your current preferences first.');
      await recommendations.activate(gen.run);nav('/progress');
    } catch(e) { setSaveError(e instanceof Error?e.message:String(e)); }
    finally {setSaving(false);}
  };

  return (
    <div className="space-y-8">
      <PageTitle eyebrow={`Study plan · ${career.title}`} title={<>Your route,<br /><span className="text-muted-foreground">your pace.</span></>} >
        AI sequences learning around your selected career and confirmed skill gaps. Faraway self-study modules are authored practice outlines with estimated hours; other catalogue offers remain illustrative. Completing a plan does not award a professional qualification. Costs cover selected catalogue modules; optional provider purchases are checked separately.
      </PageTitle>

      {career.qualificationNote&&<p className="rounded-2xl border p-4 text-sm">{career.qualificationNote}</p>}
      <Reveal><Card testId="card-preferences">
        <CardTitle eyebrow="Preferences" title="How you like to learn" />
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Learning format</p><div className="flex flex-wrap gap-2">{([['online','Online only'],['in-person','In person'],['hybrid','Hybrid'],['any','No preference']] as const).map(([v,label])=><button key={v} className={cn('rounded-full border px-4 py-2 text-sm',(plan.delivery??(plan.onlineOnly?'online':'any'))===v?'bg-ink text-white':'bg-white')} data-testid={`button-delivery-${v}`} onClick={()=>updPlan({delivery:v,onlineOnly:v==='online',setting:'either'})}>{label}</button>)}</div>
            <p className="mb-2 mt-6 text-sm font-medium">Cost</p>
            <div className="flex flex-wrap gap-2">
              {([['free', 'Free'], ['low', 'Low cost (up to RM 200)'], ['moderate', 'Moderate (up to RM 500)'], ['any', 'No budget limit']] as const).map(([v, l]) => (
                <button key={v} onClick={() => updPlan({ cost: v })} data-testid={`button-cost-${v}`} className={cn('rounded-full border px-4 py-2 text-sm transition-all', plan.cost === v ? 'border-ink bg-ink text-white' : 'bg-white')}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm"><span className="font-medium">Study time per day</span><span className="font-mono">{plan.minutesPerDay} min</span></div>
            <input type="range" min={15} max={240} step={15} value={plan.minutesPerDay} onChange={(e) => updPlan({ minutesPerDay: Number(e.target.value) })} className="range mt-3" data-testid="range-minutes"
              style={{ background: `linear-gradient(90deg, #8fb0ff, #c08bff ${((plan.minutesPerDay - 15) / 225) * 100}%, hsl(232 40% 94%) ${((plan.minutesPerDay - 15) / 225) * 100}%)` }} />
            <div className="mt-5 rounded-2xl border bg-white/70 p-4"><p className="text-sm font-medium">Which future are you preparing for?</p><p className="mt-1 text-xs text-muted-foreground">Choose current requirements, or a what-if AI development scenario. This changes the target skill gaps used for this plan.</p><select className="field mt-3" aria-label="Plan future scenario" value={plan.futureScenario??'current'} onChange={e=>updPlan({futureScenario:e.target.value==='current'?undefined:e.target.value as 'moderate'|'fast'})}><option value="current">Current catalogue requirements</option><option value="moderate">Moderate AI development</option><option value="fast">Fast AI development</option></select><p className="mt-2 text-xs text-muted-foreground">Selected role-specific skill targets increase by 1 (moderate) or 2 (fast), capped at 5. This is a transparent planning assumption, not a forecast.</p></div>
            <p className="mb-2 mt-6 text-sm font-medium">Plan type</p>
            <div className="inline-flex rounded-full border bg-white p-1">
              {(['recommended', 'custom'] as const).map((m) => (
                <button key={m} onClick={() => updPlan({ mode: m, skills: m === 'custom' ? selected : plan.skills })} data-testid={`button-mode-${m}`} className={cn('relative rounded-full px-4 py-1.5 text-sm capitalize', plan.mode === m ? 'text-white' : 'text-muted-foreground')}>
                  {plan.mode === m && <motion.span layoutId="plan-mode" className="absolute inset-0 rounded-full bg-ink" />}<span className="relative">{m}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card></Reveal>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Reveal><Card className="h-full" testId="card-skill-select">
          <CardTitle eyebrow={plan.mode === 'recommended' ? 'Recommended from your gaps' : 'Custom — choose any'} title="Skills to learn" />
          {plan.mode==='custom'&&<div className="mb-5"><label className="text-sm" htmlFor="custom-learning-skill">What else would you like to learn?</label><div className="mt-2 flex gap-2"><input id="custom-learning-skill" className="field" list="custom-plan-skills" value={customSkill} onChange={e=>{setCustomSkill(e.target.value);setCustomError('');}} placeholder="Type a skill, e.g. SQL"/><datalist id="custom-plan-skills">{pool.map(s=><option key={s}>{s}</option>)}</datalist><button className="btn-ghost" onClick={()=>{const error=skillError(customSkill);if(error){setCustomError(error);return;}const raw=cleanSkill(customSkill);const skill=pool.find(s=>s.toLowerCase()===raw.toLowerCase())??raw;updPlan({skills:Array.from(new Set([...selected,skill]))});setCustomSkill('');}}>Add</button></div>{customError&&<p role="alert" className="mt-2 text-sm text-red-700">{customError}</p>}<p className="mt-2 text-xs text-muted-foreground">Custom skills are saved. Generating a course plan requires a matching course; unavailable skills are shown below.</p></div>}
          <div className="flex flex-wrap gap-2">
            {options.map((s) => { const on = selected.includes(s); return (
              <button key={s} onClick={() => toggle(s)} data-testid={`chip-skill-${s.replace(/\W/g, '')}`} className={cn('inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-all', on ? 'border-ink bg-ink text-white' : 'bg-white hover:border-[hsl(250_50%_80%)]')}>
                {s}{selected.includes(s)&&<span className="text-[10px]">{(profile.skills[s]??0)===0?'Start here':`Improve ${profile.skills[s]}/5 → ${required[s]??4}/5`}</span>}{career.core.includes(s) && <span className={cn('rounded-full px-1.5 font-mono text-[9px]', on ? 'bg-white/20' : 'bg-muted')}>CORE</span>}
              </button>
            ); })}
          </div>
          {recommended.length === 0 && plan.mode === 'recommended' && <p className="mt-4 text-sm text-muted-foreground">No gaps — switch to Custom to stretch further.</p>}
          <div className="mt-8 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(232_50%_98%)] text-left text-xs text-muted-foreground"><tr><th className="p-3 font-medium">Skill</th><th className="p-3 font-medium">Course</th><th className="hidden p-3 font-medium sm:table-cell">Hours</th><th className="p-3 text-right font-medium">Cost</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.skill} className="border-t bg-white/70" data-testid={`row-course-${r.skill.replace(/\W/g, '')}`}>
                  <td className="p-3"><span className="flex items-center gap-2">{r.skill}<span className="text-[10px]">{r.have===0?'High priority · foundation':r.need-r.have>=2?'High priority · develop':'Build next'}</span><SdgPill n={skillSdg(r.skill)} small /></span></td>
                  <td className="p-3 text-muted-foreground">{r.course ? <>{r.course.title}<span className="block text-xs">{r.course.provider}</span><span className="mt-2 block space-y-1 text-xs">{resourcesFor([r.skill],plan.cost).slice(0,3).map(resource=><a key={resource.url} className="block underline" href={resource.url} target="_blank" rel="noreferrer">{resource.title}{resource.price?' · '+resource.price:''}</a>)}</span>{r.course.resourceUrl&&<a className="block text-xs underline" href={r.course.resourceUrl} target="_blank" rel="noreferrer">Open learning resource ↗</a>}</> : 'No matching course — adjust preferences'}</td>
                  <td className="hidden p-3 font-mono sm:table-cell">{r.course?duration(r.course.hours):'—'}</td>
                  <td className="p-3 text-right font-mono">{r.course ? (r.course.cost ? myr(r.course.cost) : 'Free') : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card></Reveal>
        <Reveal delay={0.08}><Card className="spectrum-border h-full" testId="card-cost-summary">
          <p className="eyebrow">Estimate</p>
          <p className="mt-4 font-display text-5xl" data-testid="text-total-cost">{rows.some(r=>!r.course) ? 'Incomplete' : total ? myr(total) : 'Free'}</p>
          <p className="text-sm text-muted-foreground">unique course cost · illustrative</p><p className="mt-3 text-xs text-muted-foreground">A course covering multiple skills is counted once. Fees and hours are catalogue estimates. Provider enrolment is separate.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-white/80 p-3"><p className="font-mono text-xl">{duration(hours)}</p><p className="text-xs text-muted-foreground">study</p></div>
            <div className="rounded-2xl border bg-white/80 p-3"><p className="font-mono text-xl">{weeks || 0} wk</p><p className="text-xs text-muted-foreground">at {plan.minutesPerDay} min/day</p></div>
          </div>
          {saveError && <p role="alert" className="mt-4 text-sm">{saveError}</p>}
          <div className="mt-4 text-sm" role="status" data-testid="plan-next-step">
            {!selected.length ? <p>Select at least one skill to learn.</p>
              : missingSkills.length ? <>
                <p className="font-medium">No matching course for: {missingSkills.join(', ')}.</p>
                <p className="mt-2 text-muted-foreground">Your current cost, setting or online-only filters exclude the available courses, or the catalogue has no coverage. AI cannot fill this with invented courses.</p>
                {plan.cost==='hrdc' && <p className="mt-2">There are no verified HRD Corp courses in this catalogue yet.</p>}
                <button className="btn-ghost mt-3" data-testid="button-broaden-course-filters" onClick={()=>updPlan({setting:'either',onlineOnly:false,delivery:'any'})}>Show any learning format (keep budget)</button>
                {availableSkills.length>0&&<button className="btn-ghost mt-3" onClick={()=>updPlan({mode:'custom',skills:availableSkills})}>Keep {availableSkills.length} available skills only</button>}
                <p className="mt-2 text-xs text-muted-foreground">Your budget stays unchanged. You can explicitly change Cost above, or remove skills with no matching course from your custom plan.</p>
              </> : gen.isPending ? <p>Generating a plan for your current preferences…</p>
              : !gen.run ? <p>{hasPreviousPlan ? 'Your preferences or skills differ from the saved plan. Generate a new plan below, then save it. Your existing progress is kept.' : 'Step 1: Generate your plan below. Step 2: Review it and save.'}</p>
              : <p>Your plan matches these preferences. Review the outline below, then save.</p>}
          </div>
          <button onClick={generate} disabled={!selected.length||gen.isPending||saving} className="btn-ink mt-5 w-full" data-testid="button-generate-plan">
            <Sparkles className="h-4 w-4" />{gen.isPending ? 'Generating…' : ai ? 'Regenerate plan' : 'Generate plan'}
          </button>
          <button onClick={()=>setReview(true)} disabled={saving || gen.isPending || !gen.run || !canGenerate} className="btn-ghost mt-3 w-full" data-testid="button-save-plan">{saving?'Saving…':'Review & start plan'}<ArrowRight className="h-4 w-4" /></button>
          <p className="mt-3 text-xs text-muted-foreground">Estimated study time assumes seven study days each week. Changing preferences requires generating a matching plan before saving.</p>
        </Card></Reveal>
      </div>

      <Reveal><Card className="spectrum-border" testId="card-ai-plan">
        <CardTitle eyebrow="AI organiser" title="Your weekly learning outline" />
        <AiStage pending={gen.isPending} error={gen.error} onRetry={generate} testId="plan" phases={['Sequencing skills by dependency', `Fitting ${plan.minutesPerDay} minutes a day`, 'Matching resources to your budget', 'Breaking modules into steps']}>
          {ai ? (
            <div data-testid="result-ai-plan"><RecommendationMeta meta={ai.meta}/>
              <div className="mb-6 flex flex-wrap items-baseline gap-4"><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{ai.overview}</p><span className="font-mono text-sm">{ai.totalWeeks} weeks total</span></div>
              <div className="grid gap-4 md:grid-cols-2">
                {ai.modules.map((m, i) => (
                  <motion.div key={m.skill + i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-2xl border bg-white/80 p-5">
                    <div className="flex items-center justify-between"><p className="font-medium">{m.skill}</p><span className="font-mono text-xs text-muted-foreground">{m.weeks} wk</span></div>
                    <p className="mt-1 text-sm text-muted-foreground">{m.why}</p>
                    <ul className="mt-3 space-y-1.5">{m.steps.map((s, j) => <li key={j} className="flex justify-between gap-3 text-sm"><span>{s.title}</span><span className="font-mono text-xs text-muted-foreground">{duration(s.hours)}</span></li>)}</ul>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><BookOpen className="h-3 w-3" />{m.resource}</p><div className="mt-3 space-y-1">{resourcesFor(m.skill.split(', '),plan.cost).map(r=><a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="block text-xs underline">{r.title} ↗</a>)}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground">Let the engine sequence your selected skills into weekly modules with step-by-step hours.</p>}
        </AiStage>
      </Card></Reveal>

      <Dialog open={availability} onOpenChange={setAvailability}><DialogContent className="max-w-lg rounded-3xl"><DialogTitle>Review course availability</DialogTitle><DialogDescription>Your budget and learning-format choices will stay as selected.</DialogDescription><p className="text-sm">No matching course for: {missingSkills.join(', ')}.</p>{availableSkills.length>0?<><p className="text-sm">You can generate a plan for {availableSkills.join(', ')}. The unavailable skills listed above will be excluded only if you choose this option.</p><button className="btn-ink" disabled={gen.isPending} onClick={()=>{updPlan({mode:'custom',skills:availableSkills});setAvailability(false);void gen.mutate({}, {onSuccess:()=>setReview(true)});}}>Generate for available skills only</button></>:<p className="text-sm">No selected skill has a course matching these preferences. Add or choose another skill, or explicitly change your filters. We will not replace Free with paid courses.</p>}<button className="btn-ghost" onClick={()=>setAvailability(false)}>Back to preferences</button></DialogContent></Dialog>

      <Dialog open={review&&!!ai} onOpenChange={setReview}><DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-3xl"><DialogTitle className="font-display text-3xl">Your plan is ready</DialogTitle><DialogDescription>Review your generated plan, then start learning. Your completed activities will be kept.</DialogDescription>{ai&&<><p className="text-sm">{ai.overview}</p><p className="font-medium">{duration(hours)} · {weeks} weeks · {total?myr(total):'Free'}</p><ul className="space-y-3">{ai.modules.map((m,i)=><li key={i} className="rounded-xl border p-3"><p className="font-medium">{i+1}. {m.skill}</p><p className="text-sm text-muted-foreground">{m.why}</p></li>)}</ul></>}{saveError&&<p role="alert">{saveError}</p>}<div className="flex flex-wrap gap-3"><button className="btn-ghost" onClick={()=>setReview(false)}>Edit preferences</button><button className="btn-ink" disabled={saving||!gen.run||!canGenerate} onClick={save} data-testid="button-start-plan">{saving?'Starting…':'Start plan'}<ArrowRight size={16}/></button></div></DialogContent></Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-[hsl(28_90%_55%)]" />{confirm} is a core skill</AlertDialogTitle>
            <AlertDialogDescription>The practice catalogue lists {career.core.join(', ')} as core skills for {career.title}. Removing this skill leaves its gap unaddressed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" data-testid="button-keep-core">Keep it</AlertDialogCancel>
            <AlertDialogAction className="rounded-full" data-testid="button-remove-core" onClick={() => { updPlan({ mode: 'custom', skills: selected.filter((x) => x !== confirm), saved: false }); setConfirm(null); }}>Remove anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
