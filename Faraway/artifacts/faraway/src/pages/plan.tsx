import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Home, Trees, Shuffle, Wifi, AlertTriangle, BookOpen, RefreshCw } from 'lucide-react';
import { useGenerateStudyPlan } from '@/lib/local-engine';
import type { StudyPlan } from '@workspace/api-client-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { careerById, careerInScenario, ALL_SKILLS } from '@/data/careers';
import { getState, setState, useStore, type Plan } from '@/lib/store';
import { computeMatch, courseForSkill, myr } from '@/lib/match';
import { Card, CardTitle, NeedProfile, PageTitle, Reveal, ScenarioToggle, SdgPill, skillSdg } from '@/components/bits';
import { AiStage, Magnetic, SpectrumIcon } from '@/components/spectrum';
import { cn } from '@/lib/utils';

const aiKey = () => 'faraway_ai_plan_v2:' + (getState().session?.id || 'demo');
export function loadAiPlan(): StudyPlan | null { try { const r = localStorage.getItem(aiKey()); return r ? (JSON.parse(r) as StudyPlan) : null; } catch { return null; } }

const updPlan = (p: Partial<Plan>) => setState((s) => ({ ...s, plan: { ...s.plan, ...p, saved: p.saved ?? false } }));

export default function PlanPage() {
  const profile = useStore((s) => s.profile);
  const scenario = useStore((s) => s.scenario);
  const plan = useStore((s) => s.plan);
  const [, nav] = useLocation();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [ai, setAi] = useState<StudyPlan | null>(null);
  const [outlineKey, setOutlineKey] = useState('');
  const gen = useGenerateStudyPlan();
  const career = careerInScenario(careerById(plan.target), scenario);
  if (!profile.stream) return <NeedProfile />;
  if (!career) return <NeedProfile text="Pick a career target first." />;

  const match = computeMatch(career, profile, scenario);
  const recommended = match.gaps.map((g) => g.skill);
  const selected = plan.mode === 'recommended' ? recommended : plan.skills;
  const pool = Array.from(new Set([...Object.keys(career.required), ...ALL_SKILLS]));
  const options = plan.mode === 'recommended' ? recommended : pool;
  const rows = selected.map((s) => ({ skill: s, course: courseForSkill(s, plan), have: profile.skills[s] ?? 0, need: career.required[s] ?? 4 }));
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
  const generate = () => gen.mutate({ data: { targetJob: career.title, scenario, minutesPerDay: plan.minutesPerDay, setting: plan.setting, cost: plan.cost, skills: rows.map(({ skill, have, need }) => ({ skill, have, need })) } }, {
    onSuccess: (r) => { setAi(r); setOutlineKey(JSON.stringify([plan, scenario])); try { localStorage.setItem(aiKey(), JSON.stringify(r)); } catch { /* ignore */ } },
  });
  const save = () => { if (rows.some(r => !r.course)) return; updPlan({ skills: selected, saved: true }); nav('/progress'); };

  return (
    <div className="space-y-8">
      <PageTitle eyebrow={`Study plan · ${career.title}`} title={<>Your route,<br /><span className="text-muted-foreground">your pace.</span></>} right={<ScenarioToggle id="plan-scn" />}>
        Demo catalogue. Prices, hours and claimability are illustrative, not verified provider offers. The plan adapts to <strong className="font-medium text-foreground">{scenario}</strong> AI adoption and your preferences.
      </PageTitle>

      <Reveal><Card testId="card-preferences">
        <CardTitle eyebrow="Preferences" title="How you like to learn" />
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium">Setting</p>
            <div className="grid grid-cols-3 gap-2">
              {([['indoor', Home, 'Indoor'], ['outdoor', Trees, 'Outdoor'], ['either', Shuffle, 'Either']] as const).map(([v, I, l]) => (
                <button key={v} onClick={() => updPlan({ setting: v })} data-testid={`button-setting-${v}`} className={cn('flex flex-col items-center gap-2 rounded-2xl border bg-white/70 p-4 text-sm transition-all', plan.setting === v && 'spectrum-border border-transparent bg-white shadow-md')}><SpectrumIcon icon={I} size={22} still={plan.setting !== v} />{l}</button>
              ))}
            </div>
            <p className="mb-2 mt-6 text-sm font-medium">Cost</p>
            <div className="flex flex-wrap gap-2">
              {([['free', 'Free'], ['low', 'Low cost (up to RM 200)'], ['hrdc', 'HRD Corp verified only'], ['any', 'Any']] as const).map(([v, l]) => (
                <button key={v} onClick={() => updPlan({ cost: v })} data-testid={`button-cost-${v}`} className={cn('rounded-full border px-4 py-2 text-sm transition-all', plan.cost === v ? 'border-ink bg-ink text-white' : 'bg-white')}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm"><span className="font-medium">Study time per day</span><span className="font-mono">{plan.minutesPerDay} min</span></div>
            <input type="range" min={15} max={240} step={15} value={plan.minutesPerDay} onChange={(e) => updPlan({ minutesPerDay: Number(e.target.value) })} className="range mt-3" data-testid="range-minutes"
              style={{ background: `linear-gradient(90deg, #8fb0ff, #c08bff ${((plan.minutesPerDay - 15) / 225) * 100}%, hsl(232 40% 94%) ${((plan.minutesPerDay - 15) / 225) * 100}%)` }} />
            <label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl border bg-white/70 p-4 text-sm">
              <span className="flex items-center gap-2"><Wifi className="h-4 w-4" />Online only</span>
              <input type="checkbox" checked={plan.onlineOnly} onChange={(e) => updPlan({ onlineOnly: e.target.checked })} className="h-4 w-4 accent-[hsl(250_60%_60%)]" data-testid="checkbox-online" />
            </label>
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
          <div className="flex flex-wrap gap-2">
            {options.map((s) => { const on = selected.includes(s); return (
              <button key={s} onClick={() => toggle(s)} data-testid={`chip-skill-${s.replace(/\W/g, '')}`} className={cn('inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-all', on ? 'border-ink bg-ink text-white' : 'bg-white hover:border-[hsl(250_50%_80%)]')}>
                {s}{career.core.includes(s) && <span className={cn('rounded-full px-1.5 font-mono text-[9px]', on ? 'bg-white/20' : 'bg-muted')}>CORE</span>}
              </button>
            ); })}
          </div>
          {recommended.length === 0 && plan.mode === 'recommended' && <p className="mt-4 text-sm text-muted-foreground">No gaps — switch to Custom to stretch further.</p>}
          <div className="mt-8 overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(232_50%_98%)] text-left text-xs text-muted-foreground"><tr><th className="p-3 font-medium">Skill</th><th className="p-3 font-medium">Course</th><th className="hidden p-3 font-medium sm:table-cell">Hours</th><th className="p-3 text-right font-medium">Cost</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.skill} className="border-t bg-white/70" data-testid={`row-course-${r.skill.replace(/\W/g, '')}`}>
                  <td className="p-3"><span className="flex items-center gap-2">{r.skill}<SdgPill n={skillSdg(r.skill)} small /></span></td>
                  <td className="p-3 text-muted-foreground">{r.course ? <>{r.course.title}<span className="block text-xs">{r.course.provider}{r.course.hrdc && ' · HRD Corp'}</span></> : 'No matching course — adjust preferences'}</td>
                  <td className="hidden p-3 font-mono sm:table-cell">{r.course?.hours ?? '—'}</td>
                  <td className="p-3 text-right font-mono">{r.course ? (r.course.cost ? myr(r.course.cost) : 'Free') : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card></Reveal>
        <Reveal delay={0.08}><Card className="spectrum-border h-full" testId="card-cost-summary">
          <p className="eyebrow">Estimate</p>
          <p className="mt-4 font-display text-5xl" data-testid="text-total-cost">{rows.some(r=>!r.course) ? 'Incomplete' : total ? myr(total) : 'Free'}</p>
          <p className="text-sm text-muted-foreground">unique course cost · illustrative</p><p className="mt-3 text-xs text-muted-foreground">A course covering multiple skills is counted once. No verified HRD Corp courses are currently in this demo catalogue.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border bg-white/80 p-3"><p className="font-mono text-xl">{hours}h</p><p className="text-xs text-muted-foreground">study</p></div>
            <div className="rounded-2xl border bg-white/80 p-3"><p className="font-mono text-xl">{weeks || 0} wk</p><p className="text-xs text-muted-foreground">at {plan.minutesPerDay} min/day</p></div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{rows.some(r=>!r.course) ? "Some selected skills have no matching course. This estimate covers matching modules only; adjust preferences to continue." : "Estimated study time assumes seven study days each week."}</p><button onClick={save} disabled={!selected.length || rows.some(r => !r.course)} className="btn-ink mt-6 w-full" data-testid="button-save-plan">Save plan &amp; start<ArrowRight className="h-4 w-4" /></button>
        </Card></Reveal>
      </div>

      <Reveal><Card className="spectrum-border" testId="card-ai-plan">
        <CardTitle eyebrow="Spectrum engine" title="Your weekly learning outline" right={!gen.isPending && <Magnetic><button onClick={generate} disabled={!selected.length} className="btn-ink" data-testid="button-generate-plan">{ai ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{ai ? 'Regenerate' : 'Generate plan'}</button></Magnetic>} />
        <AiStage pending={gen.isPending} error={gen.error} onRetry={generate} testId="plan" phases={['Sequencing skills by dependency', `Fitting ${plan.minutesPerDay} minutes a day`, 'Matching resources to your budget', 'Breaking modules into steps']}>
          {ai && outlineKey === JSON.stringify([plan, scenario]) ? (
            <div data-testid="result-ai-plan">
              <div className="mb-6 flex flex-wrap items-baseline gap-4"><p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{ai.overview}</p><span className="font-mono text-sm">{ai.totalWeeks} weeks total</span></div>
              <div className="grid gap-4 md:grid-cols-2">
                {ai.modules.map((m, i) => (
                  <motion.div key={m.skill + i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="rounded-2xl border bg-white/80 p-5">
                    <div className="flex items-center justify-between"><p className="font-medium">{m.skill}</p><span className="font-mono text-xs text-muted-foreground">{m.weeks} wk</span></div>
                    <p className="mt-1 text-sm text-muted-foreground">{m.why}</p>
                    <ul className="mt-3 space-y-1.5">{m.steps.map((s, j) => <li key={j} className="flex justify-between gap-3 text-sm"><span>{s.title}</span><span className="font-mono text-xs text-muted-foreground">{s.hours}h</span></li>)}</ul>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><BookOpen className="h-3 w-3" />{m.resource}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground">Let the engine sequence your selected skills into weekly modules with step-by-step hours.</p>}
        </AiStage>
      </Card></Reveal>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-[hsl(28_90%_55%)]" />{confirm} is a core skill</AlertDialogTitle>
            <AlertDialogDescription>Employers hiring a {career.title} screen for {career.core.join(', ')}. Removing it will keep your match score lower and may limit interviews.</AlertDialogDescription>
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
