import { motion } from 'framer-motion';
import { SDGS } from '@/data/careers';
import { skillSdg } from './bits';

export interface RadarAxis { skill: string; have: number; need?: number }

/** Hand-built SVG radar: user hexagon + optional job requirement overlay + SDG tags per point. */
export function SkillRadar({ axes, size = 360, showSdg, onHover, hovered, compact }: {
  axes: RadarAxis[]; size?: number; showSdg?: boolean; onHover?: (skill: string | null) => void; hovered?: string | null; compact?: boolean;
}) {
  const n = axes.length;
  if (n < 3) {
    return <div className="grid place-items-center text-center text-sm text-muted-foreground" style={{ height: size * 0.75 }}>Rate at least three skills to draw your hexagon.</div>;
  }
  const pad = compact ? 34 : 70;
  const vb = size; const c = vb / 2; const R = c - pad;
  const pt = (i: number, v: number) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [c + Math.cos(a) * R * (v / 5), c + Math.sin(a) * R * (v / 5)]; };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, Math.max(v, 0.08)).join(',')).join(' ');
  const hasNeed = axes.some((a) => a.need !== undefined);
  return (
    <svg viewBox={`0 0 ${vb} ${vb}`} className="h-auto w-full overflow-visible" role="img" aria-label="Skill radar map" data-testid="chart-radar">
      <defs>
        <linearGradient id="rad-you" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7aa7ff" stopOpacity=".55" /><stop offset=".5" stopColor="#b48cff" stopOpacity=".45" /><stop offset="1" stopColor="#ff8fc7" stopOpacity=".45" /></linearGradient>
        <linearGradient id="rad-you-s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5b8bf5" /><stop offset=".5" stopColor="#9a6bff" /><stop offset="1" stopColor="#f070b0" /></linearGradient>
      </defs>
      {[1, 2, 3, 4, 5].map((l) => <polygon key={l} points={poly(Array(n).fill(l))} fill={l === 5 ? 'hsl(232 60% 98.5%)' : 'none'} stroke="hsl(232 35% 90%)" strokeWidth={1} />)}
      {axes.map((_, i) => { const [x, y] = pt(i, 5); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="hsl(232 35% 91%)" />; })}
      {hasNeed && (
        <motion.polygon initial={false} animate={{ points: poly(axes.map((a) => a.need ?? 0)) }} transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          fill="hsl(40 92% 55% / .08)" stroke="hsl(40 85% 50%)" strokeWidth={1.5} strokeDasharray="5 4" />
      )}
      <motion.polygon initial={false} animate={{ points: poly(axes.map((a) => a.have)) }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}
        fill="url(#rad-you)" stroke="url(#rad-you-s)" strokeWidth={2} strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, Math.max(a.have, 0.08));
        return <motion.circle key={a.skill} initial={false} animate={{ cx: x, cy: y, r: hovered === a.skill ? 6 : 3.5 }} fill="#fff" stroke="#9a6bff" strokeWidth={2} />;
      })}
      {axes.map((a, i) => {
        const [x, y] = pt(i, compact ? 5.9 : 6.3);
        const anchor = Math.abs(x - c) < 8 ? 'middle' : x > c ? 'start' : 'end';
        const sdg = SDGS[skillSdg(a.skill)];
        const gap = a.need !== undefined && a.have < a.need;
        const hot = hovered === a.skill;
        return (
          <g key={a.skill} transform={`translate(${x},${y})`} onMouseEnter={() => onHover?.(a.skill)} onMouseLeave={() => onHover?.(null)} style={{ cursor: onHover ? 'help' : 'default' }} data-testid={`radar-point-${a.skill.replace(/\W/g, '')}`}>
            <rect x={anchor === 'start' ? -6 : anchor === 'end' ? -110 : -58} y={-16} width={116} height={showSdg ? 38 : 24} fill="transparent" />
            <text textAnchor={anchor} y={showSdg ? -2 : 4} fontSize={compact ? 10 : 12} fontWeight={hot ? 600 : 500} fill={gap ? 'hsl(330 60% 50%)' : 'hsl(232 30% 22%)'}>{a.skill}</text>
            {showSdg && (
              <g transform={`translate(${anchor === 'start' ? 0 : anchor === 'end' ? -46 : -23},6)`}>
                <rect width={46} height={15} rx={7.5} fill={hot ? sdg.color : '#fff'} stroke={sdg.color} strokeWidth={1} />
                <text x={23} y={10.8} textAnchor="middle" fontSize={9} fontFamily="Geist Mono" fill={hot ? '#fff' : sdg.color}>SDG {sdg.n}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function RadarLegend({ withNeed }: { withNeed?: boolean }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-gradient-to-br from-[#7aa7ff] to-[#ff8fc7]" />You</span>
      {withNeed && <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm border border-dashed border-[hsl(40_85%_50%)]" />Job requirement</span>}
      {withNeed && <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-[hsl(330_60%_50%)]" />Gap skill</span>}
    </div>
  );
}
