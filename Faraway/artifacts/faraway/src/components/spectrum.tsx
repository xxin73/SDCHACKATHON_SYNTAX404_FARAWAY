import { useEffect, useRef, useState, type ReactNode, type ComponentType } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export const LOGO = import.meta.env.BASE_URL + 'faraway-logo-trimmed.png';

/** Global SVG defs — the flowing spectrum gradient every icon strokes with. */
export function SpectrumDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <linearGradient id="fw-spectrum" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0" stopColor="#6f9cff" />
          <stop offset="0.25" stopColor="#a983ff" />
          <stop offset="0.5" stopColor="#ff86c0" />
          <stop offset="0.75" stopColor="#ffaa5e" />
          <stop offset="1" stopColor="#4fd2b0" />
          <animateTransform attributeName="gradientTransform" type="rotate" from="0 12 12" to="360 12 12" dur="6s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
    </svg>
  );
}

type IconT = ComponentType<{ size?: number; strokeWidth?: number; color?: string; className?: string }>;

/** Icon with a continuous rainbow stroke that flows along its contours. */
export function SpectrumIcon({ icon: Icon, size = 22, className, still }: { icon: IconT; size?: number; className?: string; still?: boolean }) {
  return (
    <span className={cn('relative inline-grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <Icon size={size} strokeWidth={1.6} className="absolute text-[hsl(232_30%_20%/.14)]" />
      <Icon size={size} strokeWidth={1.75} color="url(#fw-spectrum)" className={cn('absolute', !still && 'spectrum-flow')} />
    </span>
  );
}

/** Pointer-reactive 3D tilt. */
export function Tilt({ children, className, max = 6 }: { children: ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0.5); const y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 160, damping: 18 });
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 160, damping: 18 });
  const gx = useTransform(x, (v) => `${v * 100}%`); const gy = useTransform(y, (v) => `${v * 100}%`);
  return (
    <motion.div
      className={cn('relative', className)}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 1200, ['--gx' as string]: gx, ['--gy' as string]: gy }}
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left) / r.width); y.set((e.clientY - r.top) / r.height); }}
      onPointerLeave={() => { x.set(0.5); y.set(0.5); }}
    >
      {children}
    </motion.div>
  );
}

/** Slight magnetic attraction toward the cursor. */
export function Magnetic({ children, className, strength = 0.28 }: { children: ReactNode; className?: string; strength?: number }) {
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 220, damping: 15 }); const y = useSpring(0, { stiffness: 220, damping: 15 });
  return (
    <motion.div
      className={cn('inline-block', className)}
      style={reduce ? undefined : { x, y }}
      onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * strength); y.set((e.clientY - r.top - r.height / 2) * strength); }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.div>
  );
}

/** Faint pastel aurora light leaks drifting across white. Follows the mouse slightly. */
export function Aurora() {
  const reduce = useReducedMotion();
  const mx = useSpring(0, { stiffness: 30, damping: 20 }); const my = useSpring(0, { stiffness: 30, damping: 20 });
  useEffect(() => {
    if (reduce) return;
    const h = (e: PointerEvent) => { mx.set((e.clientX / window.innerWidth - 0.5) * 60); my.set((e.clientY / window.innerHeight - 0.5) * 40); };
    window.addEventListener('pointermove', h);
    return () => window.removeEventListener('pointermove', h);
  }, [reduce, mx, my]);
  return (
    <>
      <motion.div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ x: mx, y: my }}>
        <div className="absolute -left-[15%] -top-[20%] h-[60vh] w-[60vw] rounded-full opacity-[.32] blur-[90px]" style={{ background: 'radial-gradient(closest-side, #cfe0ff, transparent)', animation: 'aurora-a 28s ease-in-out infinite' }} />
        <div className="absolute right-[-10%] top-[10%] h-[50vh] w-[45vw] rounded-full opacity-[.26] blur-[90px]" style={{ background: 'radial-gradient(closest-side, #f6d6ff, transparent)', animation: 'aurora-b 34s ease-in-out infinite' }} />
        <div className="absolute bottom-[-25%] left-[25%] h-[55vh] w-[50vw] rounded-full opacity-[.22] blur-[100px]" style={{ background: 'radial-gradient(closest-side, #ffe3c9, transparent)', animation: 'aurora-a 40s ease-in-out infinite reverse' }} />
        <div className="absolute bottom-[5%] right-[5%] h-[35vh] w-[30vw] rounded-full opacity-[.2] blur-[90px]" style={{ background: 'radial-gradient(closest-side, #c8f3e6, transparent)', animation: 'aurora-b 31s ease-in-out infinite' }} />
      </motion.div>
      <MosaicField />
    </>
  );
}

/**
 * Rainbow micro-mosaic light field. One canvas pixel = one mosaic tile, upscaled with
 * pixelated rendering; a CSS grout grid on top separates the tiles. Ribbons of pastel
 * light drift slowly and brighten near the pointer.
 */
const CELL = 11;
function MosaicField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let cols = 0, rows = 0, img: ImageData;
    const size = () => {
      cols = Math.ceil(window.innerWidth / CELL); rows = Math.ceil(window.innerHeight / CELL);
      cv.width = cols; cv.height = rows; img = ctx.createImageData(cols, rows);
      cv.style.width = `${cols * CELL}px`; cv.style.height = `${rows * CELL}px`;
    };
    size();
    const ptr = { x: -999, y: -999, tx: -999, ty: -999 };
    const onMove = (e: PointerEvent) => { ptr.tx = e.clientX / CELL; ptr.ty = e.clientY / CELL; if (ptr.x < -900) { ptr.x = ptr.tx; ptr.y = ptr.ty; } };
    const onLeave = () => { ptr.tx = -999; ptr.ty = -999; };
    // hsl -> rgb for pastel spectrum tones
    const rgb = (h: number, s: number, l: number): [number, number, number] => {
      const k = (n: number) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
      return [f(0) * 255, f(8) * 255, f(4) * 255];
    };
    // per-tile jitter so the mosaic reads as individual tiles, not a smooth gradient
    const jitter = new Float32Array(4096).map(() => Math.random());
    let raf = 0, last = 0; const t0 = performance.now();
    const frame = (now: number) => {
      raf = reduce ? 0 : requestAnimationFrame(frame);
      if (now - last < 33 && !reduce) return; // ~30fps is plenty for slow drift
      last = now;
      const t = (now - t0) / 1000;
      if (ptr.tx > -900) { ptr.x += (ptr.tx - ptr.x) * 0.12; ptr.y += (ptr.ty - ptr.y) * 0.12; }
      const d = img.data; const R2 = 15 * 15;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const j = jitter[(x * 31 + y * 17) & 4095];
          // two drifting ribbons of light bending across the screen
          const b1 = Math.sin(x * 0.045 + Math.sin(y * 0.03 + t * 0.12) * 2.2 - t * 0.09);
          const b2 = Math.sin(y * 0.06 - x * 0.02 + Math.cos(x * 0.025 - t * 0.08) * 1.8 + t * 0.07);
          let band = Math.max(0, b1 * 0.6 + b2 * 0.5 - 0.35);
          band = band * band;
          let hue = (x * 2.2 + y * 1.4 + t * 9 + j * 40) % 360;
          let alpha = band * (0.1 + j * 0.18);
          if (ptr.x > -900) {
            const dx = x - ptr.x, dy = y - ptr.y, q = dx * dx + dy * dy;
            if (q < R2 * 4) {
              const f = Math.exp(-q / R2);
              alpha += f * (0.12 + j * 0.3);
              hue = (hue + f * 60) % 360;
            }
          }
          if (j > 0.93) alpha += 0.05 * (0.5 + 0.5 * Math.sin(t * 1.3 + j * 50)); // occasional twinkling tile
          const [r, g, bl] = rgb(hue, 0.85, 0.74);
          const i = (y * cols + x) * 4;
          d[i] = r; d[i + 1] = g; d[i + 2] = bl; d[i + 3] = Math.min(0.42, alpha) * 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    raf = requestAnimationFrame(frame);
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden && !reduce) raf = requestAnimationFrame(frame); };
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [reduce]);
  return (
    <div aria-hidden className="mosaic-field pointer-events-none fixed inset-0 -z-10">
      <canvas ref={ref} className="absolute left-0 top-0" style={{ imageRendering: 'pixelated' }} />
    </div>
  );
}

/** Canvas particle aggregation: spectrum particles converge into a compass ring while a scan line sweeps. */
export function ParticleField({ height = 220, converge = true }: { height?: number; converge?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = cv.clientWidth, h = cv.clientHeight;
    const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const N = 150;
    const P = Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2;
      const ring = i % 3 === 0 ? 0.5 : i % 3 === 1 ? 0.78 : 1;
      return { x: Math.random() * w, y: Math.random() * h, a, ring, hue: (i / N) * 360, s: 1 + Math.random() * 1.6, j: Math.random() * Math.PI * 2 };
    });
    let raf = 0; const t0 = performance.now();
    const draw = (t: number) => {
      const el = (t - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.34;
      for (const p of P) {
        const rot = p.a + el * 0.35 * (p.ring === 0.78 ? -1 : 1);
        const tx = cx + Math.cos(rot) * R * p.ring + Math.sin(el * 2 + p.j) * 3;
        const ty = cy + Math.sin(rot) * R * p.ring + Math.cos(el * 2 + p.j) * 3;
        const k = converge ? Math.min(0.02 + el * 0.012, 0.09) : 0.004;
        p.x += (tx - p.x) * k; p.y += (ty - p.y) * k;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${(p.hue + el * 40) % 360}, 85%, 68%, .85)`;
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
      }
      // scan line
      const sx = ((el * 0.45) % 1) * w;
      const g = ctx.createLinearGradient(sx - 60, 0, sx + 4, 0);
      g.addColorStop(0, 'rgba(180,140,255,0)'); g.addColorStop(0.8, 'rgba(255,143,199,.18)'); g.addColorStop(1, 'rgba(111,156,255,.55)');
      ctx.fillStyle = g; ctx.fillRect(sx - 60, 0, 64, h);
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', size);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, [reduce, converge]);
  return <canvas ref={ref} className="block w-full" style={{ height }} aria-hidden />;
}

/** The AI demo stage — particle aggregation + spectrum scan while pending, error with retry. */
export function AiStage({ pending, error, onRetry, phases, children, testId }: {
  pending: boolean; error?: unknown; onRetry?: () => void; phases: string[]; children?: ReactNode; testId?: string;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!pending) { setI(0); return; }
    const id = setInterval(() => setI((x) => (x + 1) % phases.length), 1500);
    return () => clearInterval(id);
  }, [pending, phases.length]);
  if (pending) {
    return (
      <motion.div data-testid={testId ? `${testId}-loading` : 'ai-loading'} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="spectrum-border glass relative overflow-hidden rounded-3xl">
        <ParticleField height={200} />
        <div className="absolute inset-x-0 bottom-0 p-4 text-center">
          <motion.p key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-xs tracking-wide text-muted-foreground">{phases[i]}</motion.p>
        </div>
      </motion.div>
    );
  }
  if (error) {
    const msg = (error as { data?: { error?: string }; message?: string })?.data?.error ?? (error as Error)?.message ?? 'Something went wrong.';
    return (
      <div className="rounded-3xl border border-[hsl(352_70%_88%)] bg-[hsl(352_100%_98.5%)] p-5" role="alert" data-testid={testId ? `${testId}-error` : 'ai-error'}>
        <p className="flex items-center gap-2 text-sm font-medium text-[hsl(352_60%_42%)]"><AlertTriangle className="h-4 w-4" />The engine could not finish that run.</p>
        <p className="mt-1 text-sm text-muted-foreground">{msg}</p>
        {onRetry && <button onClick={onRetry} className="btn-ghost mt-3" data-testid="button-retry"><RotateCw className="h-4 w-4" />Try again</button>}
      </div>
    );
  }
  return <>{children}</>;
}
