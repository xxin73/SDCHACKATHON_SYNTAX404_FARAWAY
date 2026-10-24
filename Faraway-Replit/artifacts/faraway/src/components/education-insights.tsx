import { useState } from 'react';
import { EDUCATION_AI_STATS, EDUCATION_INSIGHTS } from '@/data/education-ai';
import './education-ai-statistics.css';

export function EducationInsights() {
  const [id, setId] = useState(EDUCATION_INSIGHTS[0].id);
  const cur = EDUCATION_INSIGHTS.find((t) => t.id === id) ?? EDUCATION_INSIGHTS[0];
  return (
    <div className="glass fwl-card eai" data-testid="education-insights">
      <p className="eyebrow">Qualitative perspectives, not comparable percentages</p>
      <h3>Three ways to read AI in education</h3>
      <div className="eai-tabs" role="tablist" aria-label="AI in education perspectives">
        {EDUCATION_INSIGHTS.map((t) => (
          <button key={t.id} type="button" role="tab" id={`eai-tab-${t.id}`} aria-selected={t.id === id} aria-controls="eai-panel" tabIndex={t.id === id ? 0 : -1}
            className="eai-tab" data-testid={`tab-insight-${t.id}`} onClick={() => setId(t.id)}
            onKeyDown={(e) => {
              const i = EDUCATION_INSIGHTS.findIndex((x) => x.id === id);
              const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
              if (!d && e.key !== 'Home' && e.key !== 'End') return;
              e.preventDefault();
              const n = EDUCATION_INSIGHTS[e.key === 'Home' ? 0 : e.key === 'End' ? EDUCATION_INSIGHTS.length - 1 : (i + d + EDUCATION_INSIGHTS.length) % EDUCATION_INSIGHTS.length];
              setId(n.id); document.getElementById(`eai-tab-${n.id}`)?.focus();
            }}>{t.label}</button>
        ))}
      </div>
      <div key={cur.id} id="eai-panel" role="tabpanel" aria-labelledby={`eai-tab-${cur.id}`} className="eai-panel" tabIndex={0}>
        <p className="eai-kind">{cur.kind}</p>
        <p>{cur.summary}</p>
        <ul>{cur.points.map((p) => <li key={p}>{p}</li>)}</ul>
      </div>
      <p className="text-xs text-muted-foreground">Context: <a href={EDUCATION_AI_STATS[0].sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">OECD Digital Education Outlook 2026</a>. These categories describe possibilities and cautions, not measured Faraway results.</p>
    </div>
  );
}
