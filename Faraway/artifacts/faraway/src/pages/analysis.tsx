import {useTrendEvidence} from '@/lib/live-trends';
import {OpportunityDetails} from '@/components/trend-updates';
import { TrendPanels } from '@/components/trend-panels';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, Briefcase, Cloud, Shield, Cpu, LineChart, Users, Palette, Calculator, Megaphone, Target } from 'lucide-react';
import { JOB_SOURCES, JOB_TRENDS, JOB_TRENDS_LINKEDIN, SKILL_TRENDS } from '@/data/careers';
import { setState, useStore } from '@/lib/store';
import { suggested, type MatchResult } from '@/lib/match';
import { Card, CardTitle, NeedProfile, PageTitle, Reveal, ScenarioToggle, SdgPill } from '@/components/bits';
import { FlipCard, HBars, VBars } from '@/components/charts';
import { SpectrumIcon, Tilt } from '@/components/spectrum';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const JOB_ICON: Record<string, typeof Briefcase> = {
  'data-analyst': LineChart, 'software-engineer': Cpu, 'cloud-engineer': Cloud, 'cyber-analyst': Shield, 'ml-engineer': Cpu,
  'financial-analyst': Calculator, 'risk-analyst': Shield, accountant: Calculator, 'business-analyst': LineChart, 'digital-marketer': Megaphone,
  'hr-specialist': Users, 'product-manager': Target, 'ux-designer': Palette,
};
export const jobIcon = (id: string) => JOB_ICON[id] ?? Briefcase;

export default function Analysis() {
  useTrendEvidence();
  const profile = useStore((s) => s.profile);
  const scenario = useStore((s) => s.scenario);
  const target = useStore((s) => s.plan.target);
  const [more, setMore] = useState(false);
  const [future, setFuture] = useState(false);
  const has = profile.complete && !!profile.stream && Object.keys(profile.skills).length > 0;
  const list = has ? suggested(profile, scenario, more) : [];
  const shown = more ? list : list.slice(0, 6);
  const max = Math.max(...[...JOB_TRENDS, ...JOB_TRENDS_LINKEDIN].map((d) => Math.max(d.fast, d.moderate, d.history[4])));

  return (
    <div className="space-y-8">
      <PageTitle eyebrow="Skill analysis" title={<>Explore technical skills.<br /><span className="text-muted-foreground">Compare possible futures.</span></>} >
        Explore careers linked to your interest, compare their required skills and review dated job observations when available. Careers are ordered by opportunity: scenario readiness, interest, experience and the available US employment outlook. Personal fit remains a separate score. AI scenarios are planning assumptions; unverified imported counts do not affect ranking.

      </PageTitle>

      <TrendPanels careerId={target}/>

      <section>
        <Reveal><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow mb-2">Suggested for you</p><h2 className="font-display text-4xl">Careers that fit</h2></div><p className="text-xs text-muted-foreground">Related interests first · opportunity = 60% scenario readiness + 20% interest + 10% experience + 10% market outlook</p></div></Reveal>
        {!has ? <NeedProfile text="Rate your skills to see matches." /> : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {shown.map((m, i) => <JobCard key={m.career.id} m={m} i={i} isTarget={target === m.career.id} />)}
            </div>
            <div className="mt-8 flex justify-center">
              <button onClick={() => setMore((x) => !x)} className="btn-ghost" data-testid="button-explore-more">{more ? 'Show related careers' : 'Explore other careers'}<ChevronDown className={cn('h-4 w-4 transition-transform', more && 'rotate-180')} /></button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function JobCard({ m, i, isTarget }: { m: MatchResult; i: number; isTarget: boolean }) {
  const [, nav] = useLocation();
  const { toast } = useToast();
  const [hot, setHot] = useState(false);
  const Icon = jobIcon(m.career.id);
  const set = () => {
    setState((s) => ({ ...s, plan: { ...s.plan, target: m.career.id, skills: m.gaps.map((g) => g.skill), saved: false } }));
    toast({ title: 'Career target set', description: `${m.career.title} is now your bearing.` });
    nav(`/jobs/${m.career.id}`);
  };
  return (
    <Reveal delay={(i % 3) * 0.08}>
      <Tilt max={7}>
        <div onMouseEnter={() => setHot(true)} onMouseLeave={() => setHot(false)} data-testid={`card-job-${m.career.id}`}
          className={cn('glass glass-hover min-w-0 max-w-full flex h-full flex-col rounded-[1.75rem] p-6', isTarget && 'spectrum-border')}>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate rounded-full border bg-white px-3 py-1 text-sm font-medium">{m.career.title}</span>
            {isTarget && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3 w-3" />Target</span>}
          </div>
          <Link href={`/jobs/${m.career.id}`} className="relative my-6 grid h-32 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(222_100%_97%)] via-white to-[hsl(330_100%_97.5%)]" data-testid={`link-job-${m.career.id}`}>
            <motion.div animate={hot ? { scale: 1.12, rotate: -4 } : { scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
              <SpectrumIcon icon={Icon} size={56} still={!hot} />
            </motion.div>
            <span className="absolute bottom-2 right-3 font-mono max-w-full px-2 text-[10px] text-muted-foreground">{m.career.marketStatus==='unavailable'?'Market observations not available':`Illustrative scenario index: ${m.career.demand.moderate}/100`}</span>
          </Link>
          <p className="text-sm text-muted-foreground">{m.career.blurb}</p>
          <div className="mt-4 flex items-center justify-between text-sm"><span>Personal fit</span><span className="font-mono font-medium" data-testid={`text-score-${m.career.id}`}>{m.score.toFixed(1)}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[hsl(232_40%_95%)]"><motion.div className="spectrum-bar h-full rounded-full" initial={{ width: 0 }} whileInView={{ width: `${m.score}%` }} viewport={{ once: true }} transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }} /></div>
          <div className="mt-4 flex items-center justify-between text-sm"><span>Opportunity ranking score</span><span className="font-mono">{m.opportunityScore.toFixed(1)}</span></div><OpportunityDetails career={m.career} score={m.opportunityScore} readiness={m.scenarioReadiness}/><div className="mt-4 flex flex-wrap gap-1.5">{m.career.sdgs.map((n) => <SdgPill key={n} n={n} small />)}</div>
          <div className="flex-1" />
          <button onClick={set} className="btn-ink mt-6 w-full" data-testid={`button-set-target-${m.career.id}`}>Set career target<ArrowRight className="h-4 w-4" /></button>
        </div>
      </Tilt>
    </Reveal>
  );
}

