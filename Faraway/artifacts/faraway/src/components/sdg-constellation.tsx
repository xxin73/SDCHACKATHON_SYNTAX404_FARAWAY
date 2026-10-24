import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  ArrowLeft, ArrowRight, Briefcase, Building2, CloudSun, Coins, Droplets, Equal, ExternalLink, Factory,
  GraduationCap, HeartPulse, Recycle, Share2, TreePine, Landmark, Users, Waves, Wheat, X, Zap,
  type LucideIcon,
} from 'lucide-react';
import { SDG_EDGES, SDG_GOALS, SDG_POS } from './sdg-goals';

const ICONS: LucideIcon[] = [Coins, Wheat, HeartPulse, GraduationCap, Users, Droplets, Zap, Briefcase, Factory, Equal, Building2, Recycle, CloudSun, Waves, TreePine, Landmark, Share2];

const W = 1000, H = 760;
const STARS = Array.from({ length: 70 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453, b = Math.sin(i * 78.233) * 12345.6789;
  return { x: (a - Math.floor(a)) * 100, y: (b - Math.floor(b)) * 100, r: 0.5 + ((i * 7) % 5) * 0.25, d: (i % 9) * 0.5 };
});

export function SdgConstellation({ reduce, hub }: { reduce: boolean; hub: React.ReactNode }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelClose = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const active = hover ?? focus ?? selected;
  const previewCandidate = hover ?? focus;
  const previewId = previewCandidate === selected ? null : previewCandidate;

  const connected = useMemo(() => {
    const m = new Map<number, Set<number>>();
    SDG_GOALS.forEach((_, i) => m.set(i, new Set([i])));
    SDG_EDGES.forEach(([a, b]) => { m.get(a)!.add(b); m.get(b)!.add(a); });
    return m;
  }, []);
  const litSet = active !== null ? connected.get(active)! : null;

  const select = useCallback((i: number) => { setSelected(i); }, []);
  const close = useCallback(() => {
    const i = selected;
    setSelected(null);
    if (i !== null) requestAnimationFrame(() => refs.current[i]?.focus());
  }, [selected]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (selected !== null && !wasOpen.current) {
      panelClose.current?.focus({ preventScroll: true });
      panelRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'instant' : 'smooth' });
    }
    wasOpen.current = selected !== null;
  }, [selected, reduce]);

  const onNodeKey = (e: KeyboardEvent, i: number) => {
    let n = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % 17;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i + 16) % 17;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = 16;
    if (n >= 0) { e.preventDefault(); refs.current[n]?.focus(); }
  };

  const go = (d: number) => { if (selected === null) return; const n = (selected + d + 17) % 17; setSelected(n); };

  const sel = selected !== null ? SDG_GOALS[selected] : null;
  const SelIcon = selected !== null ? ICONS[selected] : null;
  const pv = previewId !== null ? SDG_GOALS[previewId] : null;
  const PvIcon = previewId !== null ? ICONS[previewId] : null;
  const pp = previewId !== null ? SDG_POS[previewId] : null;
  const focusPos = selected !== null ? SDG_POS[selected] : null;

  return (
    <div
      onKeyDown={(e) => { if (e.key === 'Escape' && selected !== null) { e.stopPropagation(); close(); } }}
    >
      <div className="sdc-stage">
        <div className="sdc-hub">{hub}</div>
        <div className={`sdc-map${active !== null ? ' sdc-dim' : ''}`} onPointerMove={reduce ? undefined : (e) => { if (e.pointerType !== 'mouse') return; const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--px', String((e.clientX - r.left) / r.width - 0.5)); e.currentTarget.style.setProperty('--py', String((e.clientY - r.top) / r.height - 0.5)); }} onPointerLeave={(e) => { e.currentTarget.style.setProperty('--px', '0'); e.currentTarget.style.setProperty('--py', '0'); }} role="group" aria-label="Interactive constellation of the 17 UN Sustainable Development Goals" data-testid="sdg-constellation">
          <div className="sdc-drift">
            <div
              className={`sdc-zoom${focusPos ? ' is-focus' : ''}`}
              style={focusPos ? { transformOrigin: `${focusPos.x}% ${focusPos.y}%` } : undefined}
            >
              <svg className="sdc-sky" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: -14, overflow: 'visible' }} />
              <svg className="sdc-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
                <defs><linearGradient id="sdc-rb" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2={H}><stop offset="0" stopColor="#6f9cff" /><stop offset=".25" stopColor="#a983ff" /><stop offset=".5" stopColor="#ff86c0" /><stop offset=".75" stopColor="#ffaa5e" /><stop offset="1" stopColor="#4fd2b0" /></linearGradient></defs>
                {STARS.map((s, i) => (
                  <circle key={i} className={`sdc-dot${i % 3 === 0 ? ' sdc-twinkle' : ''}`} style={{ ['--d' as string]: `${s.d}s` }} cx={s.x * 10} cy={s.y * 7.6} r={s.r} />
                ))}
                {SDG_EDGES.map(([a, b]) => {
                  const lit = active !== null && (a === active || b === active);
                  return <line key={`${a}-${b}`} className={`sdc-edge${lit ? ' lit' : ''}`} x1={SDG_POS[a].x * 10} y1={SDG_POS[a].y * 7.6} x2={SDG_POS[b].x * 10} y2={SDG_POS[b].y * 7.6} />;
                })}
                {!reduce && SDG_EDGES.filter((_, i) => i % 3 === 0).map(([a, b], i) => {
                  const p = `M${SDG_POS[a].x * 10} ${SDG_POS[a].y * 7.6} L${SDG_POS[b].x * 10} ${SDG_POS[b].y * 7.6}`;
                  return (
                    <circle key={`p${a}-${b}`} className="sdc-pt" r="2.4">
                      <animateMotion dur={`${6 + (i % 5)}s`} begin={`${(i % 7) * 0.8}s`} repeatCount="indefinite" path={i % 2 ? p : `M${SDG_POS[b].x * 10} ${SDG_POS[b].y * 7.6} L${SDG_POS[a].x * 10} ${SDG_POS[a].y * 7.6}`} />
                    </circle>
                  );
                })}
              </svg>
              <div className="sdc-center-star" aria-hidden />
              {SDG_GOALS.map((g, i) => (
                <button
                  key={g.n}
                  ref={(el) => { refs.current[i] = el; }}
                  type="button"
                  className={`sdc-node${litSet?.has(i) ? ' lit' : ''}${selected === i ? ' sel' : ''}`}
                  style={{ left: `${SDG_POS[i].x}%`, top: `${SDG_POS[i].y}%`, ['--d' as string]: `${(i % 6) * 0.6}s`, ['--h' as string]: Math.round((i * 360) / 17 + 210) % 360 }}
                  aria-label={`Goal ${g.n}: ${g.title}`}
                  aria-haspopup="dialog"
                  aria-expanded={selected === i}
                  data-testid={`sdg-node-${g.n}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setFocus(i)}
                  onBlur={() => setFocus((f) => (f === i ? null : f))}
                  onClick={() => select(i)}
                  onKeyDown={(e) => onNodeKey(e, i)}
                >
                  <span className="sdc-halo" aria-hidden />
                  <span className="sdc-core" aria-hidden />
                  <span className="sdc-lbl" aria-hidden><b>{g.n}</b><span>{g.title}</span></span>
                </button>
              ))}
            </div>
          </div>
          {pv && PvIcon && pp && (
            <div
              className="sdc-preview"
              aria-hidden
              style={typeof window !== 'undefined' && window.innerWidth >= 640 ? {
                left: pp.x > 50 ? `calc(${pp.x}% - 270px)` : `calc(${pp.x}% + 26px)`,
                top: `${Math.min(80, Math.max(20, pp.y))}%`,
                transform: 'translateY(-50%)',
              } : undefined}
            >
              <div className="h"><PvIcon size={26} /><div><small>SDG {pv.n}</small>{pv.title}</div></div>
              <p>{pv.description}</p>
            </div>
          )}
        </div>
        <p className="sdc-hint">Hover, tap or focus a star. Use Tab or the arrow keys to move between all 17 goals.</p>
      </div>

      {sel && SelIcon && (
        <div ref={panelRef} className="sdc-panel" role="dialog" aria-labelledby="sdc-panel-title" data-testid="sdg-panel">
          <div className="top">
            <div className="ic"><SelIcon size={26} /></div>
            <div>
              <div className="no">Goal {sel.n} of 17</div>
              <h3 id="sdc-panel-title">{sel.title}</h3>
            </div>
            <button ref={panelClose} type="button" className="sdc-btn x" onClick={close} aria-label="Close goal details" data-testid="sdg-panel-close"><X size={18} /></button>
          </div>
          <p aria-live="polite">{sel.description}</p>
          <div className="row">
            <button type="button" className="sdc-btn" onClick={() => go(-1)} aria-label="Previous goal" data-testid="sdg-prev"><ArrowLeft size={16} />Previous</button>
            <button type="button" className="sdc-btn" onClick={() => go(1)} aria-label="Next goal" data-testid="sdg-next">Next<ArrowRight size={16} /></button>
            <a className="sdc-btn" href={sel.url} target="_blank" rel="noopener noreferrer" data-testid="sdg-source">Source: sdgs.un.org<ExternalLink size={15} /></a>
          </div>
        </div>
      )}
    </div>
  );
}
