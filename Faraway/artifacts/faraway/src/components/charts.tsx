import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import type { JobTrend, Scenario, SkillTrend } from '@/data/careers';
import { cn } from '@/lib/utils';

const HUES = ['#7aa7ff', '#9c8cff', '#c78cff', '#ff8fc7', '#ffa98a', '#ffc46b', '#7fd8be', '#6fc3e8'];
export const hueAt = (i: number) => HUES[i % HUES.length];

/** Horizontal diverging bars for skill trends. */
export function HBars({ data, field, testId }: { data: SkillTrend[]; field: 'now' | Scenario; testId?: string }) {
  const max = Math.max(...data.map((d) => Math.abs(d[field])), 1);
  return (
    <div className="space-y-2.5" data-testid={testId}>
      {data.map((d, i) => {
        const v = d[field]; const w = (Math.abs(v) / max) * 50;
        return (
          <div key={d.skill} className="grid grid-cols-[120px_1fr_44px] items-center gap-3 text-sm sm:grid-cols-[150px_1fr_52px]">
            <span className="truncate text-foreground/80">{d.skill}</span>
            <div className="relative h-2.5 rounded-full bg-[hsl(232_40%_96%)]">
              <span className="absolute left-1/2 top-[-3px] h-[16px] w-px bg-[hsl(232_30%_85%)]" />
              <motion.div className="absolute top-0 h-full rounded-full" initial={{ width: 0 }} whileInView={{ width: `${w}%` }} viewport={{ once: true }} animate={{ width: `${w}%` }}
                transition={{ duration: 0.9, delay: i * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
                style={v >= 0 ? { left: '50%', background: `linear-gradient(90deg, ${hueAt(i)}, #b48cff)` } : { right: '50%', background: 'linear-gradient(270deg, #ffb3a1, #ff7f9f)' }} />
            </div>
            <span className={cn('text-right font-mono text-xs', v >= 0 ? 'text-[hsl(250_50%_50%)]' : 'text-[hsl(350_60%_52%)]')}>{v > 0 ? '+' : ''}{v}%</span>
          </div>
        );
      })}
    </div>
  );
}

/** Vertical bars with optional mirrored reflection for a 3D look. */
export function VBars({ data, value, reflect, height = 180, highlight, testId, max: maxIn }: {
  data: JobTrend[]; value: (d: JobTrend) => number; reflect?: boolean; height?: number; highlight?: string; testId?: string; max?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = maxIn ?? Math.max(...data.map(value), 1);
  return (
    <div data-testid={testId}>
      <div className="flex items-end gap-2 sm:gap-4" style={{ height }}>
        {data.map((d, i) => {
          const v = value(d); const h = (v / max) * 100; const hot = hover === i || highlight === d.role;
          return (
            <div key={d.role} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <motion.span className="mb-1 text-center font-mono text-[10.5px] text-muted-foreground" animate={{ opacity: hot ? 1 : 0.7 }}>{v}</motion.span>
              <motion.div className="relative w-full origin-bottom rounded-t-xl" initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }}
                animate={{ height: `${h}%` }} transition={{ duration: 0.9, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ background: `linear-gradient(180deg, ${hueAt(i)}, ${hueAt(i)}55)`, boxShadow: hot ? `0 12px 30px -10px ${hueAt(i)}` : undefined }}>
                <span className="absolute inset-x-0 top-0 h-1/3 rounded-t-xl bg-gradient-to-b from-white/50 to-transparent" />
              </motion.div>
            </div>
          );
        })}
      </div>
      {reflect && (
        <div className="pointer-events-none flex items-start gap-2 sm:gap-4" style={{ height: height * 0.35, maskImage: 'linear-gradient(180deg, rgba(0,0,0,.35), transparent)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,.35), transparent)' }} aria-hidden>
          {data.map((d, i) => (
            <motion.div key={d.role} className="flex-1 rounded-b-xl" initial={false} animate={{ height: `${((value(d) / max) * 100)}%` }} transition={{ duration: 0.9 }}
              style={{ background: `linear-gradient(0deg, ${hueAt(i)}00, ${hueAt(i)})`, filter: 'blur(1.5px)' }} />
          ))}
        </div>
      )}
      <div className="mt-2 flex gap-2 sm:gap-4">
        {data.map((d) => <span key={d.role} className="flex-1 text-center text-[10.5px] leading-tight text-muted-foreground">{d.role}</span>)}
      </div>
    </div>
  );
}

/** A card that flips in 3D on click. axis 'y' = left/right, 'x' = up/down. */
export function FlipCard({ front, back, axis = 'y', className, testId, hint }: { front: React.ReactNode; back: React.ReactNode; axis?: 'x' | 'y'; className?: string; testId?: string; hint?: [string, string] }) {
  const [flipped, setFlipped] = useState(false);
  const rot = axis === 'y' ? { rotateY: flipped ? 180 : 0 } : { rotateX: flipped ? 180 : 0 };
  return (
    <div className={cn('flip-3d', className)}>
      <motion.div className="preserve-3d relative grid cursor-pointer" animate={rot} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
        onClick={() => setFlipped((f) => !f)} role="button" tabIndex={0} aria-pressed={flipped} data-testid={testId}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); } }}>
        <div className="glass backface-hidden col-start-1 row-start-1 rounded-[1.75rem] p-6">
          {front}
          <FlipHint label={hint?.[0] ?? 'Click to flip to future scenarios'} />
        </div>
        <div className="spectrum-border glass backface-hidden col-start-1 row-start-1 rounded-[1.75rem] p-6" style={{ transform: axis === 'y' ? 'rotateY(180deg)' : 'rotateX(180deg)' }}>
          {back}
          <FlipHint label={hint?.[1] ?? 'Click to flip back to today'} />
        </div>
      </motion.div>
    </div>
  );
}

function FlipHint({ label }: { label: string }) {
  return <p className="mt-5 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground"><RotateCw className="h-3 w-3" />{label}</p>;
}
