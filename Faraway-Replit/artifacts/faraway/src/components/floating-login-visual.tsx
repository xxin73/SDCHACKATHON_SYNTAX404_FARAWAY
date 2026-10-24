import { useEffect, useId, useMemo, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import './floating-login-visual.css';

const HUES = [220, 265, 330, 28, 165];
const SPARKS = 16;
export function FloatingLoginVisual() {
  const reducedMotion = useReducedMotion();
  const fadeId = useId().replace(/:/g, '');
  const root = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const orbit = useRef<SVGGElement>(null);
  const fx = useRef<HTMLDivElement>(null);
  const halos = useRef<(SVGCircleElement | null)[]>([]);
  const sparks = useRef<(HTMLSpanElement | null)[]>([]);
  const { nodes, links } = useMemo(() => {
    const cx = 500, cy = 440;
    const nodes = Array.from({ length: 34 }, (_, i) => {
      const ring = 1 + (i % 3), a = i * 2.399 + ring;
      const r = 130 + ring * 105 + ((i * 37) % 40);
      return { x: cx + Math.cos(a) * r * 1.2, y: cy + Math.sin(a) * r * 0.95, s: 1.6 + ((i * 7) % 5) * 0.5, h: HUES[i % 5], d: (i % 9) * 0.5 };
    });
    const links: [number, number, number, number, number][] = [];
    nodes.forEach((n, i) => {
      if (i % 2 === 0) links.push([cx, cy, n.x, n.y, n.h]);
      const m = nodes[(i + 5) % nodes.length];
      if (Math.hypot(m.x - n.x, m.y - n.y) < 260) links.push([n.x, n.y, m.x, m.y, n.h]);
    });
    return { nodes, links };
  }, []);
  useEffect(() => {
    const el = root.current, g = orbit.current, svg = svgRef.current;
    if (!el || !g || !svg || reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let rect = el.getBoundingClientRect();
    let tx = 0, ty = 0, x = 0, y = 0, s = 0, target = 0, boost = 0, px = 0, py = 0;
    let raf = 0, last = 0, visible = true, running = false;
    const cool = new Array(nodes.length).fill(0);
    const sp = Array.from({ length: SPARKS }, () => ({ l: 0, x: 0, y: 0, vx: 0, vy: 0, h: 0 }));
    const emit = (ex: number, ey: number, n: number, h: number) => {
      let c = 0;
      for (const p of sp) if (p.l <= 0 && c < n) {
        const a = Math.random() * 6.283, v = 12 + Math.random() * 38;
        p.l = 1; p.x = ex; p.y = ey; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - 8; p.h = h + Math.random() * 40; c++;
      }
    };
    const frame = (t: number) => {
      raf = 0;
      if (!visible || document.hidden) { running = false; return; }
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
      const k = 1 - Math.exp(-dt * 9), k2 = 1 - Math.exp(-dt * 3.2);
      x += (tx - x) * k; y += (ty - y) * k; s += (target - s) * k2; boost *= Math.exp(-dt * 2.4);
      px += (((tx / rect.width) - 0.5) * s - px) * k2; py += (((ty / rect.height) - 0.5) * s - py) * k2;
      svg.style.transform = `translate3d(${px * 9}px,${py * 8}px,0) rotateY(${px * 3}deg) rotateX(${-py * 3}deg)`;
      if (fx.current) fx.current.style.transform = `translate3d(${px * 20}px,${py * 16}px,0)`;
      const m = g.getScreenCTM();
      let busy = s > 0.01 || boost > 0.01;
      if (m) {
        const inv = m.inverse(), pt = new DOMPoint(rect.left + x, rect.top + y).matrixTransform(inv);
        nodes.forEach((n, i) => {
          const h = halos.current[i]; if (!h) return;
          const d = Math.hypot(n.x - pt.x, n.y - pt.y), q = Math.max(0, 1 - d / 150) * s;
          h.setAttribute('opacity', (q * 0.6).toFixed(3)); h.setAttribute('r', (n.s * 4 + q * n.s * 6).toFixed(2));
          cool[i] -= dt;
          if (q > 0.55 && cool[i] <= 0) {
            cool[i] = 2.5 + Math.random() * 2;
            const sp0 = new DOMPoint(n.x, n.y).matrixTransform(m);
            emit(sp0.x - rect.left, sp0.y - rect.top, 4, n.h);
          }
        });
      }
      sp.forEach((p, i) => {
        const e = sparks.current[i]; if (!e) return;
        if (p.l > 0) {
          p.l -= dt * 1.1; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97; p.vy *= 0.97; busy = true;
          e.style.opacity = String(Math.max(0, p.l)); e.style.background = `hsl(${p.h} 95% 70%)`;
          e.style.transform = `translate3d(${p.x}px,${p.y}px,0) scale(${0.4 + p.l})`;
        } else if (e.style.opacity !== '0') e.style.opacity = '0';
      });
      if (busy || Math.abs(tx - x) > 0.3) { raf = requestAnimationFrame(frame); } else {
        running = false;
        svg.style.transform = '';
        if (fx.current) fx.current.style.transform = '';
        halos.current.forEach((h) => h?.setAttribute('opacity', '0'));
      }
    };
    const kick = () => { if (!running && visible && !document.hidden) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } };
    const inside = (e: PointerEvent) => {
      rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    };
    const move = (e: PointerEvent) => {
      if (inside(e)) {
        if (target === 0) { x = tx = e.clientX - rect.left; y = ty = e.clientY - rect.top; }
        tx = e.clientX - rect.left; ty = e.clientY - rect.top; target = 1;
        if (e.buttons || e.pointerType === 'touch') { boost = Math.max(boost, 0.7); if (Math.random() < 0.25) emit(tx, ty, 1, 200 + Math.random() * 160); }
        kick();
      } else if (target) { target = 0; kick(); }
    };
    const down = (e: PointerEvent) => { if (inside(e)) { move(e); boost = 1; emit(tx, ty, 6, Math.random() * 360); kick(); } };
    const leave = () => { if (target) { target = 0; kick(); } };
    const syncPaused = () => { el.dataset.paused = String(!visible || document.hidden); };
    const vis = () => { syncPaused(); if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; running = false; target = 0; } else kick(); };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; syncPaused(); if (!visible) { if (raf) cancelAnimationFrame(raf); raf = 0; running = false; target = 0; } else { rect = el.getBoundingClientRect(); kick(); } });
    io.observe(el);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', leave, { passive: true });
    window.addEventListener('pointercancel', leave, { passive: true });
    document.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', vis);
    return () => {
      if (raf) cancelAnimationFrame(raf); io.disconnect();
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', leave); window.removeEventListener('pointercancel', leave);
      document.removeEventListener('pointerleave', leave); document.removeEventListener('visibilitychange', vis);
      svg.style.transform = '';
      if (fx.current) fx.current.style.transform = '';
      halos.current.forEach((h) => h?.setAttribute('opacity', '0'));
      sparks.current.forEach((s) => { if (s) s.style.opacity = '0'; });
      delete el.dataset.paused;
    };
  }, [nodes, reducedMotion]);
  return (
    <div className="flv" ref={root}>
      <div className="flv-field">
      <svg ref={svgRef} viewBox="0 0 1000 880" preserveAspectRatio="xMidYMid meet" aria-hidden className="pointer-events-none">
        <defs>
          <radialGradient id={`${fadeId}-fade`} gradientUnits="userSpaceOnUse" cx="500" cy="440" r="660">
            <stop offset="58%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id={`${fadeId}-edges`} maskUnits="userSpaceOnUse" x="-200" y="-260" width="1400" height="1400" style={{ maskType: 'alpha' }}>
            <circle cx="500" cy="440" r="660" fill={`url(#${fadeId}-fade)`} />
          </mask>
        </defs>
        <g mask={`url(#${fadeId}-edges)`}>
        <g className="flv-orbit" ref={orbit}>
          {links.map((l, i) => <g key={i} stroke={`hsl(${l[4]} 80% 65%)`}>
            <line className="flv-link-base" x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} />
            <line className="flv-link" x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} style={{ animationDelay: `${-(i % 7)}s` }} />
          </g>)}
          {links.map((l, i) => i % 4 === 0 && <line key={`c${i}`} className="flv-comet" pathLength={100} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke={`hsl(${l[4]} 95% 70%)`} style={{ animationDelay: `${-(i * 1.7) % 11}s`, animationDuration: `${8 + (i % 5)}s` }} />)}
          {nodes.map((n, i) => (
            <g key={i} className="flv-node" style={{ animationDelay: `${-n.d}s` }}>
              <circle cx={n.x} cy={n.y} r={n.s * 4} fill={`hsl(${n.h} 90% 78%)`} opacity={0.25} />
              <circle cx={n.x} cy={n.y} r={n.s} fill="#fff" stroke={`hsl(${n.h} 80% 65%)`} strokeWidth={1} />
              <path d={`M${n.x - n.s * 5},${n.y}h${n.s * 10} M${n.x},${n.y - n.s * 5}v${n.s * 10}`} stroke={`hsl(${n.h} 80% 65%)`} strokeWidth=".8" opacity=".75" />
            </g>
          ))}
          {nodes.map((n, i) => <circle key={`h${i}`} ref={(e) => { halos.current[i] = e; }} cx={n.x} cy={n.y} r={n.s * 4} fill={`hsl(${n.h} 95% 72%)`} opacity={0} />)}
          {Array.from({ length: 46 }, (_, i) => (
            <circle key={`dust-${i}`} className="flv-dust" cx={80 + ((i * 137) % 840)} cy={30 + ((i * 211) % 820)} r={i % 3 ? 1 : 1.7} fill={`hsl(${HUES[i % HUES.length]} 80% 68%)`} style={{ animationDelay: `${-(i % 11) * .7}s` }} />
          ))}
        </g>
        </g>
      </svg>
      </div>
      <div className="flv-fx" aria-hidden>
        <div ref={fx} className="flv-fxl">{Array.from({ length: SPARKS }, (_, i) => <span key={i} className="flv-spark" ref={(e) => { sparks.current[i] = e; }} />)}</div>
      </div>
    </div>
  );
}
