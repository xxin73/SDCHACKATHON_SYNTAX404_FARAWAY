import { hasDatabaseCatalogue } from '@/lib/catalogue-status';
import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Check, GraduationCap, Briefcase, Layers, Target, Code2, Database, BarChart2, Sparkles } from 'lucide-react';
import { careerById, careerInScenario, JOB_TRENDS, SKILL_TRENDS } from '@/data/careers';
import { useStore } from '@/lib/store';
import { computeMatch, rankCareers, checklistFor, courseForSkill } from '@/lib/match';
import { Card, CardTitle, Counter, Reveal, ScenarioToggle, ScoreRing, SdgExplain, SdgPill, skillSdg } from '@/components/bits';
import { SkillRadar } from '@/components/radar';
import { HBars, VBars } from '@/components/charts';
import { LOGO, Magnetic, SpectrumIcon, Tilt } from '@/components/spectrum';
import { cn } from '@/lib/utils';
import { useRecommendations } from '@/lib/recommendations';
import { progressFor } from '../../../../supabase/functions/faraway-recommendations/core';

const STEPS = ['Interest', 'Profile / CV', 'Skills', 'Analysis', 'Study plan'];
const ICONS = [Code2, Database, BarChart2, Layers, Sparkles, Target];

export function JourneyStepper({ done, active, labels = STEPS }: { done: boolean[]; active: number; labels?: string[] }) {
  return (
    <div className="relative mx-auto max-w-3xl px-2" data-testid="stepper-journey">
      <div className="absolute left-[10%] right-[10%] top-[11px] h-px bg-[hsl(232_30%_90%)]" />
      <motion.div className="spectrum-bar absolute left-[10%] top-[10px] h-[3px] rounded-full" initial={{ width: 0 }} animate={{ width: `${(Math.max(done.lastIndexOf(true), 0) / 4) * 80}%` }} transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }} />
      <ol className="relative grid grid-cols-5">
        {labels.map((s, i) => (
          <li key={s} className="flex flex-col items-center gap-2 text-center">
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 * i, type: 'spring' }}
              className={cn('grid h-[23px] w-[23px] place-items-center rounded-full border-2 bg-white text-[10px]', done[i] ? 'border-transparent bg-ink text-white' : i === active ? 'border-[hsl(260_70%_70%)] shadow-[0_0_0_5px_hsl(260_80%_70%/.12)]' : 'border-[hsl(232_30%_86%)]')}>
              {done[i] ? <Check className="h-3 w-3" /> : <span className="font-mono text-muted-foreground">{i + 1}</span>}
            </motion.span>
            <span className={cn('text-[11px] sm:text-xs', i === active ? 'font-medium' : 'text-muted-foreground')}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Dashboard() {
  const recommendations=useRecommendations();
  const profile = useStore((s) => s.profile);
  const scenario = useStore((s) => s.scenario);
  const plan = useStore((s) => s.plan);
  const progress = useStore((s) => s.progress);
  const session = useStore((s) => s.session);
  const [hoverSkill, setHoverSkill] = useState<string | null>(null);

  const has = !!profile.stream && Object.keys(profile.skills).length > 0;
  const ranked = useMemo(() => (has ? rankCareers(profile, scenario) : []), [has, profile, scenario]);
  const target = careerInScenario(careerById(plan.target) ?? ranked[0]?.career, hasDatabaseCatalogue() ? 'moderate' : scenario);
  const match = target && has ? computeMatch(target, profile, scenario) : null;
  const done = [!!profile.stream, !!profile.name, Object.keys(profile.skills).length >= 3, !!plan.target, plan.saved];
  const active = done.findIndex((d) => !d);

  const axes = target ? Object.entries(target.required).map(([skill, need]) => ({ skill, need, have: profile.skills[skill] ?? 0 })) : [];
  const fixedPlan=recommendations.active?.result.plan;
  const planSkills = fixedPlan ? [...new Set(fixedPlan.modules.flatMap(m=>m.skills))] : plan.skills.length ? plan.skills : match?.gaps.map((g) => g.skill) ?? [];
  const pct = (s: string) => { const saved=recommendations.active?.result.plan; if(saved){const modules=saved.modules.filter(m=>m.skills.includes(s));return progressFor({...saved,modules,totalHours:modules.reduce((n,m)=>n+m.hours,0)},recommendations.completed).percent/100;} const course=courseForSkill(s,plan); return course ? (progress[plan.target+':'+course.id]?.length??0)/4 : 0; };
  const trend = JOB_TRENDS.find((j) => target && j.role.toLowerCase().startsWith(target.title.split(' ')[0].toLowerCase()));
  const first = session?.name.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-8">
      <Reveal><JourneyStepper done={done} active={active === -1 ? 4 : active} /></Reveal>

      {/* Hero */}
      <Reveal delay={0.05}>
        <Tilt max={2.5}>
          <div className="glass spectrum-border relative overflow-hidden rounded-[2.25rem] p-8 sm:p-12" data-testid="card-hero">
            <div className="pointer-events-none absolute -right-10 -top-10 h-[130%] w-[45%] opacity-90">
              <motion.img src={LOGO} alt="" className="absolute right-[8%] top-[18%] w-[62%] max-w-[300px] object-contain opacity-[.9] drop-shadow-[0_20px_40px_rgba(210,160,0,.2)]" animate={{ rotate: [0, 4, 0, -4, 0] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
            </div>
            <div className="relative max-w-xl">
              <p className="eyebrow">Workspace · Personal</p>
              <h1 className="mt-4 font-display text-5xl leading-[0.98] sm:text-6xl">Good to see you, {first}.<br /><span className="text-muted-foreground">{has ? 'Your bearing is set.' : 'Let us find your bearing.'}</span></h1>
              <p className="mt-5 text-muted-foreground">{has && target ? <>Faraway is tracking <strong className="font-medium text-foreground">{target.title}</strong> under <strong className="font-medium text-foreground">{scenario}</strong> AI adoption. {match?.gaps.length ? `${match.gaps.length} skill gaps stand between you and it.` : 'You already meet every required level.'}</> : 'Tell Faraway what interests you, drop in your CV, and it will compute how your skills and the jobs around them move as AI spreads.'}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnetic><Link href="/pathway" className="btn-ink px-6 py-3" data-testid="button-explore-pathway">Explore my pathway <ArrowRight className="h-4 w-4" /></Link></Magnetic>
                {has && <Link href="/analysis" className="btn-ghost" data-testid="link-hero-analysis">See skill analysis</Link>}
              </div>
            </div>
            <a href="#summary" className="absolute bottom-6 right-8 hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex" data-testid="link-scroll-down">Scroll down <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.8, repeat: Infinity }}><ChevronDown className="h-3.5 w-3.5" /></motion.span></a>
          </div>
        </Tilt>
      </Reveal>

      {/* Summary band */}
      <Reveal>
        <div id="summary" className="glass grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] bg-[hsl(232_30%_93%)] md:grid-cols-4" data-testid="band-summary">
          {[
            { icon: GraduationCap, label: 'Highest education', v: profile.name ? profile.highest : null },
            { icon: Briefcase, label: 'Experience', v: profile.name ? `${profile.years} yrs` : null },
            { icon: Layers, label: 'Skills rated', v: has ? String(Object.keys(profile.skills).length) : null },
            { icon: Target, label: 'Best match', v: ranked[0] ? `${ranked[0].score.toFixed(1)}` : null },
          ].map((s) => (
            <div key={s.label} className="bg-white/90 p-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><SpectrumIcon icon={s.icon} size={16} still />{s.label}</div>
              <p className="mt-3 font-display text-3xl" data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>{s.v ?? <span className="text-muted-foreground/50">—</span>}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Radar + trend */}
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal>
          <Card className="h-full" testId="card-mini-radar">
            <CardTitle eyebrow="Skills snapshot" title={target ? `You vs ${target.title}` : 'Your hexagon'} />
            {has && axes.length ? <div className="mx-auto max-w-[320px]"><SkillRadar axes={axes} size={320} compact /></div> : (
              <div className="grid h-[260px] place-items-center rounded-2xl border border-dashed text-center text-sm text-muted-foreground"><div><p className="font-display text-4xl text-foreground/30">— — —</p><p className="mt-2">Upload a CV or rate skills to draw it.</p></div></div>
            )}
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="h-full" testId="card-skill-trend">
            <CardTitle eyebrow="Malaysia postings to 2030" title="Skill trend" right={<ScenarioToggle id="dash-scn" compact />} />
            <HBars data={SKILL_TRENDS.slice(0, 7)} field={scenario} />
          </Card>
        </Reveal>
      </div>

      {/* Match + chart */}
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <Reveal>
          <Card className="h-full" testId="card-match">
            <CardTitle eyebrow="Career target" title={target?.title ?? 'Not set'} />
            <div className="flex items-center gap-5">
              <ScoreRing score={match?.score ?? null} size={104} />
              <div className="text-sm text-muted-foreground">
                <p>Match score</p>
                <p className="mt-1 text-xs">100 × (0.65 skill + 0.15 interest + 0.10 experience + 0.10 market)</p>
              </div>
            </div>
            {target && <div className="mt-5 flex flex-wrap gap-1.5">{target.sdgs.map((n) => <SdgPill key={n} n={n} small />)}</div>}
            {target && <Link href={`/jobs/${target.id}`} className="btn-ghost mt-6 w-full" data-testid="link-target-detail">Open job detail <ArrowRight className="h-4 w-4" /></Link>}
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="h-full" testId="card-target-chart">
            <CardTitle eyebrow="Job trend index · 2021 = 100" title={trend ? `${trend.role} demand` : 'Roles on the move'} right={<ScenarioToggle id="dash-scn2" compact />} />
            <VBars data={JOB_TRENDS} value={(d) => d[scenario]} highlight={trend?.role} height={190} />
          </Card>
        </Reveal>
      </div>

      {/* Study plan overview */}
      <Reveal>
        <Card className="p-0" testId="card-plan-overview">
          <div className="grid lg:grid-cols-[1fr_320px]">
            <div className="p-6 sm:p-8">
              <CardTitle eyebrow="Study plan overview" title={<>Study plan <span className="text-muted-foreground">|</span> {careerById(recommendations.active?.result.careerId??'')?.title ?? target?.title ?? '[Job name]'}</>} right={<Link href={plan.saved ? '/progress' : '/plan'} className="btn-ghost" data-testid="link-plan">{plan.saved ? 'Continue learning' : 'Build plan'}</Link>} />
              {planSkills.length ? (
                <ul className="space-y-3">
                  {planSkills.map((s, i) => {
                    const p = pct(s); const course = fixedPlan?.modules.find(m=>m.skills.includes(s)) ?? courseForSkill(s, plan);
                    const hrs = course ? checklistFor(s, course.hours).reduce((a, b) => a + b.hours, 0) : 0;
                    return (
                      <li key={s} onMouseEnter={() => setHoverSkill(s)} onMouseLeave={() => setHoverSkill(null)} data-testid={`row-plan-${s.replace(/\W/g, '')}`}
                        className={cn('flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-all', hoverSkill === s && 'border-border bg-white shadow-md')}>
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-white"><SpectrumIcon icon={ICONS[i % ICONS.length]} size={20} still={hoverSkill !== s} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between text-sm"><span className="font-medium">{s}</span><span className="font-mono text-xs text-muted-foreground">{Math.round(p * 100)}% · {hrs}h</span></div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[hsl(232_40%_95%)]"><motion.div className="spectrum-bar h-full rounded-full" initial={{ width: 0 }} whileInView={{ width: `${Math.max(p * 100, 2)}%` }} viewport={{ once: true }} transition={{ duration: 1 }} /></div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No plan yet — set a career target and Faraway will list the skills to close.</p>}
            </div>
            <div className="border-t bg-[hsl(232_50%_98.5%)]/80 p-6 lg:rounded-r-[1.75rem] lg:border-l lg:border-t-0">
              <p className="eyebrow mb-4">SDG explanation</p>
              <SdgExplain n={hoverSkill ? skillSdg(hoverSkill) : null} skill={hoverSkill} placeholder="Hover a skill to see which UN Sustainable Development Goal it advances, and how." />
            </div>
          </div>
        </Card>
      </Reveal>
      {has && <p className="text-center text-xs text-muted-foreground">Computed live from your profile · <Counter to={ranked.length} /> careers ranked</p>}
    </div>
  );
}
