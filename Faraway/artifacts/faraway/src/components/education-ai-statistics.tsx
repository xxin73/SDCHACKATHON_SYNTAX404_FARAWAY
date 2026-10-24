import { CountUp } from '@/components/count-up';
import { EDUCATION_AI_STATS, EVIDENCE_NOTE, VERIFICATION_NOTE } from '@/data/education-ai';
import './education-ai-statistics.css';

export function HeroEducationStats() {
  return (
    <div className="flv-stats eas-hero" role="group" aria-label="AI in education, OECD teacher survey">
      <p className="eas-context text-xs text-muted-foreground">OECD averages · Lower-secondary teachers · TALIS 2024</p>
      {EDUCATION_AI_STATS.map((s) => (
        <div key={s.id} className="eas-hstat" tabIndex={0} aria-label={`${s.value} percent, ${s.title}`}>
          <p className="font-display text-3xl eas-num"><CountUp value={s.value} testId={`stat-${s.id}`} />%</p>
          <p className="text-xs text-muted-foreground"><span className="flv-star" aria-hidden />{s.title}</p>
          <p className="eas-hsrc text-xs text-muted-foreground">{s.type === 'teacher-reported adoption' ? 'Reported use in the previous 12 months' : 'Teachers agreeing with the statement'}</p>
          <p className="eas-hsrc text-xs text-muted-foreground">
            {s.sourceOrg} {s.publicationYear} · <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{s.locator} (PDF)</a>
          </p>
        </div>
      ))}
    </div>
  );
}

export function OverviewEducationStats() {
  return (
    <div className="eas" data-testid="education-ai-statistics">
      <p className="eas-note">OECD averages · Lower-secondary teachers · TALIS 2024</p>
      <div className="eas-grid">
        {EDUCATION_AI_STATS.map((s) => (
          <div key={s.id} className="eas-item">
            <p className="font-display text-4xl eas-num"><CountUp value={s.value} testId={`landing-stat-${s.id}`} />%</p>
            <h4 className="eas-t">{s.title}</h4>
            <p className="eas-cap">{s.caption}</p>
            <details className="eas-det">
              <summary>Source details</summary>
              <dl>
                <dt>Source</dt><dd>{s.sourceOrg}, {s.publicationYear} ({s.locator})</dd>
                <dt>Survey</dt><dd>TALIS {s.surveyYear}, {s.population}</dd>
                <dt>Statement</dt><dd>{s.definition}</dd>
                <dt>Type</dt><dd>{s.type}</dd>
              </dl>
              <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">Open OECD PDF</a>
            </details>
          </div>
        ))}
      </div>
      <p className="eas-note">{EVIDENCE_NOTE}</p>
      <details className="eas-det eas-ver">
        <summary>How these figures were checked</summary>
        <p>{VERIFICATION_NOTE}</p>
      </details>
    </div>
  );
}
