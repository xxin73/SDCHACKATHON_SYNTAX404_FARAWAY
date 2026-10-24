import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ClipboardList, Compass, GitCompare, GraduationCap, Layers, Search } from 'lucide-react';
import { CAREERS, SDGS } from '@/data/careers';
import { scenarioRequirements } from '../../../../supabase/functions/faraway-recommendations/core';
import { SpectrumIcon, Tilt } from '@/components/spectrum';
import { OverviewEducationStats } from '@/components/education-ai-statistics';
import { EducationInsights } from '@/components/education-insights';
import './landing-sections.css';

export { CountUp } from './count-up';

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`fwl-reveal${on ? ' in' : ''} ${className}`}>{children}</div>;
}

const STEPS = [
  { icon: ClipboardList, t: 'Map your skills', d: 'Create an account and record your skills and experience in a personal profile. Your profile and progress save to your account.' },
  { icon: Compass, t: 'Compare career fit', d: 'Faraway compares your skill levels against the required skill levels of each career profile in the catalogue.' },
  { icon: GitCompare, t: 'Compare AI scenarios', d: 'View a role under current, moderate or rapid AI adoption assumptions. Skills flagged as future skills are raised by one or two levels.' },
  { icon: GraduationCap, t: 'Plan your learning', d: 'Turn skill gaps into a learning plan with courses and resources chosen to match your preferences.' },
];
type Sc = 'current' | 'moderate' | 'fast';
const SCN: { k: Sc; l: string; d: string }[] = [
  { k: 'current', l: 'Current', d: 'Catalogue skill levels as listed.' },
  { k: 'moderate', l: 'Moderate AI adoption', d: 'Future skills +1 level, capped at 5.' },
  { k: 'fast', l: 'Rapid AI adoption', d: 'Future skills +2 levels, capped at 5.' },
];

export function LandingSections() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [q, setQ] = useState('');
  const [cid, setCid] = useState(CAREERS[0]?.id ?? '');
  const [sc, setSc] = useState<Sc>('current');
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    return CAREERS.filter((c) => !s || c.title.toLowerCase().includes(s)).slice(0, 8);
  }, [q]);
  const career = CAREERS.find((c) => c.id === cid) ?? CAREERS[0];
  const base = career?.required ?? {};
  const req = useMemo(() => scenarioRequirements(base, sc === 'current' ? undefined : sc, career?.futureSkills), [base, sc, career]);
  const skills = Object.entries(req).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const S = STEPS[step];

  return (
    <div className="fwl" data-testid="section-landing">
      <Reveal>
        <section id="platform-overview" className="fwl-sec" style={{ marginTop: 0 }} aria-labelledby="fwl-ov">
          <nav className="fwl-nav" aria-label="Explore Faraway">
            {[['platform-overview', 'Overview'], ['platform-workflow', 'How it works'], ['career-preview', 'Career preview'], ['sdc-mission', 'Our mission']].map(([id, label]) => <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({behavior: reduce ? 'instant' : 'smooth', block:'start'}); }}>{label}</a>)}
          </nav>
          <p className="eyebrow">What Faraway does</p>
          <h2 id="fwl-ov">A compass for <em className="spectrum-text">skills and careers</em></h2>
          <p className="lead">Faraway helps Malaysian learners understand their skills, compare career fit and prepare a practical learning plan.</p>
          <div className="fwl-grid ov">
            <Tilt max={reduce ? 0 : 3}><div className="glass spectrum-border fwl-card h-full">
              <SpectrumIcon icon={Layers} size={28} still={!!reduce} />
              <h3>AI in education</h3>
              <OverviewEducationStats />
            </div></Tilt>
            <div className="glass glass-hover fwl-card"><SpectrumIcon icon={Search} size={26} still={!!reduce} /><h3>Skill-based</h3><p>Each career profile lists required skills on a 1 to 5 scale, so comparisons are about skill levels you can act on.</p></div>
            <div className="glass glass-hover fwl-card"><SpectrumIcon icon={GraduationCap} size={26} still={!!reduce} /><h3>Plan-ready</h3><p>Skill gaps feed a learning plan, so exploring ends in concrete next steps.</p></div>
          </div>
          <EducationInsights />
        </section>
      </Reveal>

      <Reveal>
        <section id="platform-workflow" className="fwl-sec" aria-labelledby="fwl-how" data-testid="section-workflow">
          <p className="eyebrow">How it works</p>
          <h2 id="fwl-how">From skills to a learning plan</h2>
          <div className="fwl-steps">
            {STEPS.map((s, i) => (
              <button key={s.t} type="button" className="glass glass-hover fwl-step" aria-pressed={step === i} onClick={() => setStep(i)} data-testid={`button-workflow-step-${i + 1}`}>
                <span className="n">{i + 1}</span><h3>{s.t}</h3>
              </button>
            ))}
          </div>
          <div className="glass fwl-detail" aria-live="polite" data-testid="text-workflow-detail">
            <span className="inline-flex items-center gap-3"><SpectrumIcon icon={S.icon} size={22} still={!!reduce} /><b className="font-display text-lg">{S.t}</b></span>
            <p className="mt-2">{S.d}</p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section id="career-preview" className="fwl-sec" aria-labelledby="fwl-pv" data-testid="section-career-preview">
          <p className="eyebrow">Career profile preview</p>
          <h2 id="fwl-pv">See what a role asks for</h2>
          <p className="lead">Pick a role and an AI adoption assumption to see its skill targets. This is a planning preview, not a prediction.</p>
          <div className="fwl-grid pv">
            <div className="glass fwl-card">
              <label htmlFor="fwl-q" className="text-sm font-medium">Find a career profile</label>
              <input id="fwl-q" className="field fwl-input py-3" placeholder="Search by title" value={q} onChange={(e) => setQ(e.target.value)} data-testid="input-career-search" />
              <div className="fwl-list" role="group" aria-label="Career profiles">
                {matches.length === 0 && <p className="text-sm text-muted-foreground">No profile matches that title.</p>}
                {matches.map((c) => (
                  <button key={c.id} type="button" className="fwl-opt" aria-pressed={c.id === cid} onClick={() => setCid(c.id)} data-testid={`button-career-${c.id}`}>{c.title}</button>
                ))}
              </div>
            </div>
            {career && (
              <div className="glass spectrum-border fwl-card" data-testid="card-career-preview">
                <p className="eyebrow">{career.stream}</p>
                <h3 data-testid="text-career-title">{career.title}</h3>
                <p>{career.blurb}</p>
                <div className="fwl-chips" role="group" aria-label="AI adoption assumption">
                  {SCN.map((s) => (
                    <button key={s.k} type="button" className="fwl-chip" aria-pressed={sc === s.k} onClick={() => setSc(s.k)} data-testid={`button-scenario-${s.k}`}>{s.l}</button>
                  ))}
                </div>
                <p className="!mt-3 text-xs" data-testid="text-scenario-assumption">Assumption: {SCN.find((s) => s.k === sc)?.d}</p>
                <div className="mt-2">
                  {skills.map(([k, v]) => (
                    <div key={k} className="fwl-row">
                      <div className="flex justify-between"><b>{k}</b><span className="font-mono text-xs">{v}/5{v > (base[k] ?? 0) && <span className="fwl-up">+{v - (base[k] ?? 0)}</span>}</span></div>
                      <div className="fwl-bar"><i style={{ width: `${v * 20}%` }} /></div>
                    </div>
                  ))}
                </div>
                {career.sdgs.length > 0 && <p className="!mt-4 text-xs">Linked SDGs: {career.sdgs.map((n) => `${n} ${SDGS[n]?.title ?? ''}`.trim()).join(' · ')}</p>}
                <p className="fwl-note">Source: Faraway career catalogue skill benchmarks. Showing {skills.length} of {Object.keys(req).length} skills, highest target levels first. Scenario levels are planning assumptions, not forecasts of jobs or demand. Sign in to compare against your own skills.</p>
              </div>
            )}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
