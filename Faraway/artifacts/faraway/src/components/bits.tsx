import {AiScenarioControl} from './ai-scenario-control';
import {t as localeLabel,ui as localeText} from '@/lib/i18n';
import {t as translateUi,useLanguage} from '@/lib/i18n';
import {targetForContext} from '../../../../supabase/functions/faraway-recommendations/sdg-targets';
import {skillGoal} from '../../../../supabase/functions/faraway-recommendations/impact-context';
import {ImpactStory} from './impact-story';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Link } from 'wouter';
import { Compass } from 'lucide-react';
import { SDGS, SDG_WHY, SKILL_SDG, type Scenario } from '@/data/careers';
import { setState, useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { SpectrumIcon } from './spectrum';

export function Reveal({ children, delay = 0, className, y = 22 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  useLanguage();
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y, filter: 'blur(6px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.45, delay, ease: [0.2, 0.8, 0.2, 1] }}>
      {localeText(children)}
    </motion.div>
  );
}

export function Card({ children, className, testId }: { children: ReactNode; className?: string; testId?: string }) {
  useLanguage();
  return <div data-testid={testId} className={cn('glass glass-hover min-w-0 max-w-full rounded-[1.75rem] p-6', className)}>{localeText(children)}</div>;
}

export function CardTitle({ eyebrow, title, right }: { eyebrow?: string; title: ReactNode; right?: ReactNode }) {
  useLanguage();
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>{eyebrow && <p className="eyebrow mb-1.5">{translateUi(eyebrow)}</p>}<h3 className="font-display text-2xl leading-tight">{localeText(typeof title==='string'?translateUi(title):title)}</h3></div>
      {localeText(right)}
    </div>
  );
}

export function Counter({ to, decimals = 0, suffix = '' }: { to: number; decimals?: number; suffix?: string }) {
  useLanguage();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setV(to); return; }
    let raf = 0; const start = performance.now(); const from = 0;
    const tick = (t: number) => { const p = Math.min((t - start) / 1400, 1); setV(from + (to - from) * (1 - Math.pow(1 - p, 4))); if (p < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, reduce]);
  return <span ref={ref}>{localeText(v.toFixed(decimals))}{localeText(suffix)}</span>;
}

export function ScenarioToggle({ compact }: { id?: string; compact?: boolean }) {
 const scenario=useStore(s=>s.scenario);
 return <AiScenarioControl value={scenario} compact={compact} onChange={scenario=>setState(s=>({...s,scenario}))}/>;
}

export function SdgPill({ n, small, onHover, active }: { n: number; small?: boolean; onHover?: (n: number | null) => void; active?: boolean }) {
  useLanguage();
  const s = SDGS[n];
  if (!s) return null;
  return (
    <span title={localeLabel(`SDG ${n}: ${translateUi(s.title)}`)} role={onHover ? "button" : undefined} tabIndex={onHover ? 0 : undefined} onFocus={() => onHover?.(n)} onClick={() => onHover?.(n)} onKeyDown={(e) => {if(e.key === "Enter" || e.key === " "){e.preventDefault();onHover?.(n);}}} onMouseEnter={() => onHover?.(n)} data-testid={`pill-sdg-${n}`}
      className={cn('inline-flex cursor-default items-center gap-2 rounded-full border bg-white/80 transition-all', small ? 'py-0.5 pl-0.5 pr-2 text-[10.5px]' : 'py-1 pl-1 pr-3 text-xs', active && 'shadow-md')}
      style={active ? { borderColor: s.color } : undefined}>
      <span className="grid place-items-center rounded-full font-mono font-semibold text-white" style={{ background: s.color, width: small ? 16 : 22, height: small ? 16 : 22, fontSize: small ? 9 : 10 }}>{localeText(n)}</span>
      <span className="text-foreground/80">{translateUi(s.title)}</span>
    </span>
  );
}

/** Hover explanation panel for an SDG: what it is, and how the job / skill links to it. */
export function SdgExplain({ n, skill, job, placeholder }: { n: number | null; skill?: string | null; job?: string; placeholder: string }) {
  useLanguage();
  const s = n ? SDGS[n] : null;
  const target=n?targetForContext(n,skill??'',job??''):null;
  return (
    <div className="relative min-h-[150px]" aria-live="polite">
      {s ? (
        <motion.div key={`${n}-${skill}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl font-mono text-lg font-semibold text-white shadow-md" style={{ background: s.color }}>{localeText(s.n)}</span>
            <div><p className="eyebrow">{localeLabel("SDG")}{' '}{localeText(s.n)}</p><p className="font-medium leading-tight">{translateUi(s.title)}</p></div>
          </div>
          {skill && <p className="text-sm"><strong className="font-medium">{localeText(skill)}</strong>{localeLabel(": turn practice into possibility.")}</p>}
          {job && !skill && <p className="text-sm"><strong className="font-medium">{localeText(job)}</strong>{localeLabel(": work with a purpose.")}</p>}
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{localeText(SDG_WHY[s.n])}</p>{target&&<div className="mt-3 rounded-xl border p-3 text-xs"><p className="font-medium">{translateUi("Target")}{localeText(' ')}{localeText(target.id)} · {localeText(target.title)}</p><p className="mt-2">{localeText(target.summary)}</p><a className="mt-2 inline-block underline" href={target.url} target="_blank" rel="noreferrer">{translateUi("UN target reference ↗")}</a><p className="mt-2 text-[10px] text-muted-foreground">{translateUi("Faraway’s suggested link · potential contribution, not measured achievement")}</p></div>}<ImpactStory job={job} skill={skill} n={s.n}/>
          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted"><motion.div className="h-full rounded-full" style={{ background: s.color }} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8 }} /></div>
        </motion.div>
      ) : <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{localeText(placeholder)}</p>}
    </div>
  );
}

export const skillSdg = (skill: string) => SKILL_SDG[skill] ?? skillGoal(skill);

export function ScoreRing({ score, size = 84, stroke = 5 }: { score: number | null; size?: number; stroke?: number }) {
  useLanguage();
  const r = size / 2 - stroke; const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} data-testid="ring-score">
      <svg width={size} height={size} className="-rotate-90">
        <defs><linearGradient id={`ring-${size}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6f9cff" /><stop offset=".5" stopColor="#c08bff" /><stop offset="1" stopColor="#ff8fc7" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(232 40% 95%)" strokeWidth={stroke} fill="none" />
        {score !== null && <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={`url(#ring-${size})`} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - score / 100) }} transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }} />}
      </svg>
      <span className="absolute font-mono font-medium" style={{ fontSize: size * 0.22 }}>{localeText(score === null ? '—' : score.toFixed(0))}</span>
    </div>
  );
}

export function NeedProfile({ text = 'Your compass has no bearing yet.' }: { text?: string }) {
  useLanguage();
  return (
    <div className="glass mx-auto max-w-xl rounded-[2rem] p-10 text-center" data-testid="state-need-profile">
      <div className="relative mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border bg-white shadow-md">
        <SpectrumIcon icon={Compass} size={34} />
      </div>
      <h2 className="font-display text-3xl">{translateUi(text)}</h2>
      <p className="mt-3 text-muted-foreground">{localeText("Chart where you are first — your stream, interests and skills. Four minutes, or one click with the sample profile or your CV.")}</p>
      <Link href="/pathway" className="btn-ink mt-8" data-testid="link-start-pathway">{translateUi("Explore my pathway")}</Link>
    </div>
  );
}

export function PageTitle({ eyebrow, title, children, right }: { eyebrow: string; title: ReactNode; children?: ReactNode; right?: ReactNode }) {
  useLanguage();
  return (
    <div className="page-heading mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Reveal><p className="eyebrow mb-3">{translateUi(eyebrow)}</p></Reveal>
        <Reveal delay={0.05}><h1 className="font-display text-4xl leading-[1.02] sm:text-5xl md:text-6xl">{localeText(typeof title==='string'?translateUi(title):title)}</h1></Reveal>
        {children && <Reveal delay={0.1}><div className="mt-4 text-base text-muted-foreground">{localeText(children)}</div></Reveal>}
      </div>
      {right && <Reveal delay={0.15}>{localeText(right)}</Reveal>}
    </div>
  );
}

export const LEVELS = ['None', 'Aware', 'Beginner', 'Working', 'Strong', 'Expert'];
