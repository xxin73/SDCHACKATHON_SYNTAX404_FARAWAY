import {jobRadarAxes} from '@/lib/radar-model';
import {skillRating,skillKey} from '../../../../supabase/functions/faraway-recommendations/skill-policy';
import {PathwayEvidence} from '@/components/pathway-evidence';
import { OnetReference } from '@/components/onet-reference';
import { scenarioRequirements } from '../../../../supabase/functions/faraway-recommendations/core';
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
  const [hoverJobSdg, setHoverJobSdg] = useState<number | null>(career?.sdgs[0]??null);
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [spin, setSpin] = useState(0);
  const [showFuture,setShowFuture]=useState(true);
  const [, nav] = useLocation();
  const { toast } = useToast();
  const insight = useGetCareerInsight(id??'');


  const match = useMemo(() => (career ? computeMatch(career, profile, scenario) : null), [career, profile, scenario]);
  if (!career) return <NotFound />;
  if (!profile.stream || !profile.complete || !match) return <NeedProfile />;

  const merged = { ...profile.skills, ...draft };
  const futureRequired=scenarioRequirements(career.required,scenario,career.futureSkills);
  const axes = jobRadarAxes(career.required,merged,showFuture?futureRequired:undefined);
  const preview = computeMatch(career, profile, scenario, merged);
  const dirty = Object.keys(draft).length > 0;
  const isTarget = target === career.id;

  const refresh = () => {
    const before = match.score;
    setState((s) => ({ ...s, profile: { ...s.profile, skills: { ...s.profile.skills, ...draft }, complete:true } }), true, true);
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
          <div className="flex min-w-0 flex-col items-start gap-5 sm:flex-row sm:items-center">
            <motion.div key={spin} initial={{ rotate: -120, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 110, damping: 14 }}><ScoreRing score={preview.score} size={104} /></motion.div>
            <div>
              <p className="eyebrow">Career target{isTarget && ' · current'}</p>
              <h1 className="mt-1 break-words font-display text-4xl leading-none sm:text-6xl" data-testid="text-job-title">{career.title}</h1>
              <p className="mt-2 text-muted-foreground">{career.blurb}</p>
            </div>
          </div>
          {isTarget ? <span className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm"><Check className="h-4 w-4" />Your target</span>
            : <button onClick={setTarget} className="btn-ink" data-testid="button-set-target">Set career target</button>}
        </div>
      </Reveal>

      {/* three column: job SDG | radar | skill SDG */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_260px]">
        <Reveal><Card className="h-full" testId="panel-job-sdg">
          <p className="eyebrow mb-1">SDG explanation</p><p className="mb-4 font-medium">This job's SDGs</p>
          <div className="mb-5 flex flex-col items-start gap-2">{career.sdgs.map((n) => <SdgPill key={n} n={n} onHover={setHoverJobSdg} active={hoverJobSdg === n} />)}</div>
          <SdgExplain n={hoverJobSdg} job={career.title} placeholder="Tap or hover an SDG above to see how this role advances it." />
        </Card></Reveal>
        <Reveal delay={0.05}><Card className="h-full" testId="card-radar">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-display text-2xl">Skill hexagon</p><RadarLegend withNeed /></div>
          <div className="mt-4 flex flex-wrap items-center gap-3"><label className="text-xs"><input type="checkbox" checked={showFuture} onChange={e=>setShowFuture(e.target.checked)}/> Show future target</label>{showFuture&&<ScenarioToggle id="radar-future" compact/>}</div><p className="mt-3 text-xs text-muted-foreground">Gold: current catalogue target. Purple dashed: selected future target. What-if assumption: selected role skills +1 for moderate AI development, +2 for fast (maximum 5); not an ESCO forecast.</p>
          <EscoReference careerId={career.id} /><OnetReference careerId={career.id} /><PathwayEvidence careerId={career.id}/>
          <p className="mt-3 text-xs text-muted-foreground">{new Set(Object.keys(profile.skills).map(skillKey)).size} assessed skills in your profile; all are included here. Extra profile skills have no role target and do not change this role’s score.</p><Link href="/pathway?step=skills" className="mt-3 inline-block text-xs underline">Add or edit profile skills →</Link><div className="mx-auto max-w-[460px]"><SkillRadar axes={axes} size={440} showSdg hovered={hoverSkill} onHover={setHoverSkill} /></div>
        </Card></Reveal>
        <Reveal delay={0.1}><Card className="h-full" testId="panel-skill-sdg">
          <p className="eyebrow mb-1">SDG explanation</p><p className="mb-4 font-medium">Each skill's SDG</p>
          <ul className="mb-5 space-y-1">{axes.map((a) => (
            <li key={a.skill} tabIndex={0} onFocus={()=>setHoverSkill(a.skill)} onClick={()=>setHoverSkill(a.skill)} onMouseEnter={() => setHoverSkill(a.skill)} className={cn('flex cursor-default items-center justify-between rounded-lg px-2 py-1 text-sm transition-colors', hoverSkill === a.skill && 'bg-white shadow-sm')}>
              <span className={cn(a.have !== null && a.need !== undefined && a.have < a.need && 'text-[hsl(330_60%_50%)]')}>{a.skill}</span>
              <span className="grid h-5 w-5 place-items-center rounded-full font-mono text-[9px] text-white" style={{ background: SDGS[skillSdg(a.skill)].color }}>{skillSdg(a.skill)}</span>
            </li>
          ))}</ul>
          <SdgExplain job={career.title} n={hoverSkill ? skillSdg(hoverSkill) : null} skill={hoverSkill} placeholder="Hover a radar point or skill to see how it connects to an SDG." />
        </Card></Reveal>
      </div>

      {/* scenario chart + toggle */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
        <Reveal><Card className="h-full" testId="card-scenario-chart">
          <CardTitle eyebrow="Skill priorities for this role" title={`Core skills and ${scenario==='fast'?'rapid':'moderate'} AI development`} right={<ScenarioToggle id="job-skill-priorities" compact/>}/>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-3">Skill</th><th className="p-3">Core for this role?</th><th className="p-3">Future priority</th><th className="p-3">Current → future target</th></tr></thead><tbody>{Object.entries(career.required).map(([skill,level])=><tr key={skill} className="border-t"><td className="p-3">{skill}</td><td className="p-3">{career.core.includes(skill)?'Core':'Supporting'}</td><td className="p-3">{futureRequired[skill]>level?'Growing in selected scenario':'Maintained'}</td><td className="p-3">{level}/5 → {futureRequired[skill]}/5</td></tr>)}</tbody></table></div>
          <p className="mt-4 text-xs text-muted-foreground">Core labels are Faraway’s curated role priorities. Growing means a higher target under the selected planning scenario; it is not measured demand growth or an ESCO prediction.</p>

        </Card></Reveal>
      </div>

      {/* description + reassess */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal><Card className="h-full" testId="card-description">
          <p className="flex items-center gap-2 font-medium"><SpectrumIcon icon={Bot} size={18} still />The role</p>
          <p className="mt-3 leading-relaxed text-foreground/80">{career.description}</p>{career.qualificationNote&&<p className="mt-4 rounded-xl border p-3 text-sm">{career.qualificationNote}</p>}
          <p className="mt-6 flex items-center gap-2 font-medium"><SpectrumIcon icon={TrendingUp} size={18} still />Illustrative prospects</p>
          <p className="mt-3 leading-relaxed text-foreground/80">{career.prospects}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white/80 p-4"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" />Illustrative salary range</p><p className="mt-2 font-mono text-lg" data-testid="text-salary">{career.marketStatus==='unavailable'?'Not available':`${myr(career.salary[0])} – ${myr(career.salary[1])}`}</p><p className="text-xs text-muted-foreground">per month, Malaysia</p></div>
            <div className="rounded-2xl border bg-white/80 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" />Illustrative growth scenario</p><ScenarioToggle id="growth-scenario" compact/></div><p className={cn('mt-2 font-mono text-lg', career.growth[scenario] < 0 && 'text-[hsl(350_60%_52%)]')}>{career.marketStatus==='unavailable'?'Not available':`${career.growth[scenario]>0?'+':''}${career.growth[scenario]}%`}</p><p className="text-xs text-muted-foreground">{scenario} adoption</p></div>
          </div>
          <p className="mt-6 font-medium">Related SDGs</p>
          <div className="mt-3 flex flex-wrap gap-2">{career.sdgs.map((n) => <SdgPill key={n} n={n} />)}</div>
        </Card></Reveal>
        <Reveal delay={0.08}><Card className="h-full" testId="card-reassess">
          <CardTitle eyebrow="Missed something?" title="Reassess skills" />
          <div className="space-y-4">
            {axes.map((d) => (
              <div key={d.skill}>
                <div className="flex justify-between text-sm"><span className={cn(d.have !== null && d.need !== undefined && d.have < d.need && 'text-[hsl(330_60%_50%)]')}>{d.skill}</span><span className="font-mono text-xs text-muted-foreground">{d.have===null?'Unassessed':LEVELS[d.have]} · need {d.need??'N/A'}</span></div>
                <input type="range" min={0} max={5} value={d.have??0} className="range mt-2" aria-label={`${d.skill} level`} data-testid={`range-reassess-${d.skill.replace(/\W/g, '')}`}
                  onChange={(e) => setDraft((x) => ({ ...x, [d.skill]: Number(e.target.value) }))} style={{ background: `linear-gradient(90deg, #8fb0ff, #c08bff ${(d.have??0) * 20}%, hsl(232 40% 94%) ${(d.have??0) * 20}%)` }} />
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
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 gap-6 lg:grid-cols-2" data-testid="result-insight">
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
