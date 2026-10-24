import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export function CountUp({ value, testId }: { value: number; testId?: string }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (reduce) { setN(value); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1400); setN(Math.round(value * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce]);
  return <span ref={ref} data-testid={testId} aria-label={String(value)}>{reduce ? value : n}</span>;
}
