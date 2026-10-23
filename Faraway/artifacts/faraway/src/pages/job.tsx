import { EscoReference } from '@/components/esco-reference';
import { hasDatabaseCatalogue } from '@/lib/catalogue-status';
import { useEffect, useMemo, useState } from 'react';
import { Link, Redirect, useLocation, useParams } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, RefreshCw, Sparkles, Wallet, TrendingUp, Bot, Check } from 'lucide-react';
import { useGetCareerInsight } from '@/lib/ai-engine';
import { RecommendationMeta } from '@/components/recommendation-meta';
import { careerById, careerInScenario, SDGS, type Scenario } from '@/data/careers';
import { setState, useStore } from '@/lib/store';
import { computeMatch, myr, rankCareers } from '@/lib/match';
import { Card, CardTitle, LEVELS, NeedProfile, Reveal, ScenarioToggle, ScoreRing, SdgExplain, SdgPill, skillSdg } from '@/components/bits';
import { RadarLegend, SkillRadar } from '@/components/radar';
import { AiStage, Magnetic, SpectrumIcon } from '@/components/spectrum';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import NotFound from './not-found';

export function JobsIndex() {
  const target = useStore((s) => s.plan.target);
  const profile = useStore((s) => s.profile);
  const scenario = useStore((s) => s.scenario);
  const id = target || (profile.stream ? rankCareers(profile, scenario)[0].career.id : 'data-analyst');
  return <Redirect to={`/jobs/${id}`} />;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const profile = useStore((s) => s.profile);
  const scenario = useStore((s) => s.scenario);
  const career = careerInScenario(careerById(id ?? ''), hasDatabaseCatalogue() ? 'moderate' : scenario);
  const target = useStore((s) => s.plan.target);
  const [hoverSkill, setHoverSkill] = useState<string | null>(null);
  const [hoverJobSdg, setHoverJobSdg] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [spin, setSpin] = useState(0);
  const [, nav] = useLocation();
  const { toast } = useToast();
  const insight = useGetCareerInsight(id??'');


  const match = useMemo(() => (career ? computeMatch(career, profile, scenario) : null), [career, profile, scenario]);
  if (!career) return <NotFound />;
  if (!profile.stream || !profile.complete || !match) return <NeedProfile />;

  const merged = { ...profile.skills, ...draft };
  const axes = Object.entries(career.required).map(([skill, need]) => ({ skill, need, have: merged[skill] ?? 0 }));
  const preview = computeMatch(career, profile, scenario, merged);
  const dirty = Object.keys(draft).length > 0;
  const isTarget = target === career.id;

  const refresh = () => {
    const before = match.score;
    setState((s) => ({ ...s, profile: { ...s.profile, skills: { ...s.profile.skills, ...draft } } }));
    setDraft({}); setSpin((x) => x + 1);
    toast({ title: 'Hexagon refreshed', description: `Match moved from ${before.toFixed(1)} to ${preview.score.toFixed(1)}.` });
  };
  const setTarget = () => {
    setState((s) => ({ ...s, plan: { ...s.plan, target: career.id, skills: match.gaps.map((g) => g.skill), saved: false } }));
    toast({ title: 'Career target set', description: career.title });
  };
  const plan = () => { setTarget(); nav('/plan'); };
  const ask = () => insight.mutate({ data: { careerTitle: career.title, scenario, matchScore: match.score, skills: profile.skills, gaps: match.gaps, sdgs: career.sdgs.map((n) => `SDG ${n}: ${SDGS[n].title}`) } });

  return (
    <div className="space-y-6">
      <Link href="/analysis" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" data-testid="link-back-analysis"><ArrowLeft className="h-4 w-4" />Skill analysis</Link>
      <Reveal>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-5">
            <motion.div key={spin} initial={{ rotate: -120, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 110, damping: 14 }}><ScoreRing score={preview.score} size={104} /></motion.div>
            <div>
              <p className="eyebrow">Career target{isTarget && ' · current'}</p>
              <h1 className="mt-1 font-display text-5xl leading-none sm:text-6xl" data-testid="text-job-title">{career.title}</h1>
              <p className="mt-2 text-muted-foreground">{career.blurb}</p>
            </div>
          </div>
          {isTarget ? <span className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm"><Check className="h-4 w-4" />Your target</span>
            : <button onClick={setTarget} className="btn-ink" data-testid="button-set-target">Set career target</button>}
        </div>
      </Reveal>

      {/* three column: job SDG | radar | skill SDG */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr_260px]">
        <Reveal><Card className="h-full" testId="panel-job-sdg">
          <p className="eyebrow mb-1">SDG explanation</p><p className="mb-4 font-medium">This job's SDGs</p>
          <div className="mb-5 flex flex-col items-start gap-2">{career.sdgs.map((n) => <SdgPill key={n} n={n} onHover={setHoverJobSdg} active={hoverJobSdg === n} />)}</div>
          <SdgExplain n={hoverJobSdg} job={career.title} placeholder="Tap or hover an SDG above to see how this role advances it." />
        </Card></Reveal>
        <Reveal delay={0.05}><Card className="h-full" testId="card-radar">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-display text-2xl">Skill hexagon</p><RadarLegend withNeed /></div>
          <EscoReference careerId={career.id} />
          <div className="mx-auto max-w-[460px]"><SkillRadar axes={axes} size={440} showSdg hovered={hoverSkill} onHover={setHoverSkill} /></div>
        </Card></Reveal>
        <Reveal delay={0.1}><Card className="h-full" testId="panel-skill-sdg">
          <p className="eyebrow mb-1">SDG explanation</p><p className="mb-4 font-medium">Each skill's SDG</p>
          <ul className="mb-5 space-y-1">{axes.map((a) => (
            <li key={a.skill} onMouseEnter={() => setHoverSkill(a.skill)} onMouseLeave={() => setHoverSkill(null)} className={cn('flex cursor-default items-center justify-between rounded-lg px-2 py-1 text-sm transition-colors', hoverSkill === a.skill && 'bg-white shadow-sm')}>
              <span className={cn(a.have < a.need && 'text-[hsl(330_60%_50%)]')}>{a.skill}</span>
              <span className="grid h-5 w-5 place-items-center rounded-full font-mono text-[9px] text-white" style={{ background: SDGS[skillSdg(a.skill)].color }}>{skillSdg(a.skill)}</span>
            </li>
          ))}</ul>
          <SdgExplain n={hoverSkill ? skillSdg(hoverSkill) : null} skill={hoverSkill} placeholder="Hover a radar point or skill to see how it connects to an SDG." />
        </Card></Reveal>
      </div>

      {/* scenario chart + toggle */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal><Card className="h-full" testId="card-scenario-chart">
          <CardTitle eyebrow="Illustrative demo only" title="Under each scenario" />
          <p className="mb-4 text-xs text-muted-foreground">These scenario figures and narratives are unverified fixtures, not predictions. They are excluded from AI explanations; rankings use baseline requirements.</p>
          <div className="space-y-6">
            {[{ k: 'demand', label: 'Demo demand index', fmt: (v: number) => `${v}/100`, pct: (v: number) => v },
              { k: 'automationRisk', label: 'Tasks exposed to automation', fmt: (v: number) => `${v}%`, pct: (v: number) => v },
              { k: 'growth', label: 'Job growth', fmt: (v: number) => `${v > 0 ? '+' : ''}${v}%`, pct: (v: number) => 50 + v }].map((row) => (
              <div key={row.k}>
                <p className="mb-2 text-sm">{row.label}</p>
                {(['moderate', 'fast'] as Scenario[]).map((s) => { const v = (career[row.k as 'demand'] as Record<Scenario, number>)[s]; return (
                  <div key={s} className="mb-1.5 grid grid-cols-[72px_1fr_56px] items-center gap-3 text-xs">
                    <span className={cn('capitalize', s === scenario ? 'font-medium' : 'text-muted-foreground')}>{s}</span>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[hsl(232_40%_96%)]"><motion.div className={cn('h-full rounded-full', s === scenario ? 'spectrum-bar' : 'bg-[hsl(232_25%_82%)]')} initial={{ width: 0 }} whileInView={{ width: `${Math.max(2, Math.min(100, row.pct(v)))}%` }} viewport={{ once: true }} transition={{ duration: 1 }} /></div>
                    <span className="text-right font-mono">{row.fmt(v)}</span>
                  </div>
                ); })}
              </div>
            ))}
          </div>
        </Card></Reveal>
        <Reveal delay={0.08}><Card className="h-full" testId="card-scenario-toggle">
          <CardTitle eyebrow="Toggle" title="Moderate or fast?" />
          <ScenarioToggle id="job-scn" />
          <motion.div key={scenario} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {scenario === 'moderate' ? <p><strong className="font-medium text-foreground">Moderate adoption</strong> — Malaysian firms adopt AI gradually through 2030. Most roles are augmented rather than replaced; routine tasks shrink slowly and reskilling has time to catch up.</p>
              : <p><strong className="font-medium text-foreground">Fast adoption</strong> — AI spreads economy-wide within a few years. Routine and entry-level tasks automate quickly, while infrastructure, security and AI-building roles surge.</p>}
            <p>For {career.title}: demand <span className="font-mono text-foreground">{career.demand[scenario]}/100</span>, automation exposure <span className="font-mono text-foreground">{career.automationRisk[scenario]}%</span>.</p>
          </motion.div>
        </Card></Reveal>
      </div>

      {/* description + reassess */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal><Card className="h-full" testId="card-description">
          <p className="flex items-center gap-2 font-medium"><SpectrumIcon icon={Bot} size={18} still />The role</p>
          <p className="mt-3 leading-relaxed text-foreground/80">{career.description}</p>
          <p className="mt-6 flex items-center gap-2 font-medium"><SpectrumIcon icon={TrendingUp} size={18} still />Illustrative prospects</p>
          <p className="mt-3 leading-relaxed text-foreground/80">{career.prospects}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white/80 p-4"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" />Illustrative salary range</p><p className="mt-2 font-mono text-lg" data-testid="text-salary">{myr(career.salary[0])} – {myr(career.salary[1])}</p><p className="text-xs text-muted-foreground">per month, Malaysia</p></div>
            <div className="rounded-2xl border bg-white/80 p-4"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" />Illustrative growth scenario</p><p className={cn('mt-2 font-mono text-lg', career.growth[scenario] < 0 && 'text-[hsl(350_60%_52%)]')}>{career.growth[scenario] > 0 ? '+' : ''}{career.growth[scenario]}%</p><p className="text-xs text-muted-foreground">{scenario} adoption</p></div>
          </div>
          <p className="mt-6 font-medium">Related SDGs</p>
          <div className="mt-3 flex flex-wrap gap-2">{career.sdgs.map((n) => <SdgPill key={n} n={n} />)}</div>
        </Card></Reveal>
        <Reveal delay={0.08}><Card className="h-full" testId="card-reassess">
          <CardTitle eyebrow="Missed something?" title="Reassess skills" />
          <div className="space-y-4">
            {axes.map((d) => (
              <div key={d.skill}>
                <div className="flex justify-between text-sm"><span className={cn(d.have < d.need && 'text-[hsl(330_60%_50%)]')}>{d.skill}</span><span className="font-mono text-xs text-muted-foreground">{LEVELS[d.have]} · need {d.need}</span></div>
                <input type="range" min={0} max={5} value={d.have} className="range mt-2" aria-label={`${d.skill} level`} data-testid={`range-reassess-${d.skill.replace(/\W/g, '')}`}
                  onChange={(e) => setDraft((x) => ({ ...x, [d.skill]: Number(e.target.value) }))} style={{ background: `linear-gradient(90deg, #8fb0ff, #c08bff ${d.have * 20}%, hsl(232 40% 94%) ${d.have * 20}%)` }} />
              </div>
            ))}
          </div>
          <button onClick={refresh} disabled={!dirty} className="btn-ink mt-6 w-full" data-testid="button-refresh-match"><RefreshCw className="h-4 w-4" />Refresh hexagon &amp; score {dirty && <span className="font-mono text-xs opacity-70">→ {preview.score.toFixed(1)}</span>}</button>
        </Card></Reveal>
      </div>

      {/* AI insight */}
      <Reveal><Card className="spectrum-border" testId="card-ai-insight">
        <CardTitle eyebrow="AI explanation" title="Career fit explained" right={!insight.data && !insight.isPending && <Magnetic><button onClick={ask} className="btn-ink" data-testid="button-get-insight"><Sparkles className="h-4 w-4" />Generate insight</button></Magnetic>} />
        <AiStage pending={insight.isPending} error={insight.error} onRetry={ask} testId="insight" phases={['Weighing your skill gaps', 'Reading catalogue requirements', 'Tracing SDG impact', 'Composing next actions']}>
          {insight.data ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6 lg:grid-cols-2" data-testid="result-insight">
              <div className="space-y-4">
                <RecommendationMeta meta={insight.data.meta}/><p className="font-display text-3xl leading-tight">{insight.data.headline}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{insight.data.scenarioExplanation}</p>
                <p className="text-sm leading-relaxed">{insight.data.fitSummary}</p>
                <div className="rounded-2xl border bg-white/80 p-4 text-sm"><p className="eyebrow mb-1">SDG impact</p>{insight.data.sdgImpact}</div>
              </div>
              <div>
                <p className="eyebrow mb-3">Actions</p>
                <ol className="space-y-2">{insight.data.actions.map((a, i) => (
                  <motion.li key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }} className="flex gap-3 rounded-2xl border bg-white/80 p-3 text-sm"><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>{a}</motion.li>
                ))}</ol>
                <button onClick={ask} className="btn-ghost mt-4" data-testid="button-regenerate-insight"><RefreshCw className="h-4 w-4" />Regenerate</button>
              </div>
            </motion.div>
          ) : <p className="text-sm text-muted-foreground">Ask the engine to explain what {career.title} looks like for you using your confirmed skills and the versioned practice catalogue.</p>}
        </AiStage>
      </Card></Reveal>

      <div className="flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border bg-white/80 p-6 sm:flex-row sm:items-center">
        <p className="max-w-xl text-sm">{match.gaps.length ? <>Close <strong>{match.gaps.length}</strong> gap{match.gaps.length > 1 ? 's' : ''} — {match.gaps.map((g) => g.skill).join(', ')}.</> : 'You meet every required level. Keep sharpening.'}</p>
        <button onClick={plan} className="btn-ink shrink-0" data-testid="button-build-plan">Build my study plan<ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

