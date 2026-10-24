import './learning-journey.css';
import { useState } from 'react';
import { BookOpen, ClipboardCheck, FlaskConical, PencilRuler } from 'lucide-react';
import { completionKey, type Module } from '../../../../supabase/functions/faraway-recommendations/core';
import { duration, resourcesFor } from '@/lib/learning-resources';
import { t, ui, useLanguage } from '@/lib/i18n';

const web = (u: string) => { try { const p = new URL(u); return /^https?:$/.test(p.protocol) ? p : null; } catch { return null; } };
const ACTIVITY_ICONS: Record<string, typeof BookOpen> = { foundations: BookOpen, practice: PencilRuler, project: FlaskConical, assess: ClipboardCheck };

function instruction(id: string, title: string, skills: string): string {
  const s = skills || title;
  switch (id) {
    case 'foundations': return `Read or watch the shared resources to understand the key ideas behind ${s}.`;
    case 'practice': return `Work through exercises that use ${s}, then check your answers against the resource.`;
    case 'project': return `Apply ${s} in a small piece of your own work and note what you would improve.`;
    case 'assess': return `Review what you practised in ${s} and note what to revisit.`;
    default: return `Work on "${title}" using the shared resources for ${s}.`;
  }
}

export function LearningJourney({ module, completed, busy, onToggle }: { module: Module; completed: Set<string>; busy: boolean; onToggle: (activityId: string) => void }) {
  useLanguage();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [started, setStarted] = useState<Set<string>>(new Set());
  const resources = resourcesFor(module.skills);
  const skills = module.skills.join(', ');
  const done = module.activities.filter(a => completed.has(completionKey(module.courseId, module.courseVersion, a.id))).length;
  const total = module.activities.length;
  const flip = (id: string) => setOpen(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return <div className="learning-journey" data-testid={`journey-${module.courseId}`}>
    <div className="lj-head"><h4 className="font-medium">{t('Learning journey')}</h4>
      <span className="lj-count" data-testid={`journey-count-${module.courseId}`} aria-live="polite">{ui(`${done} of ${total} completed`)}</span></div>
    <div className="lj-bar" role="presentation"><span className="spectrum-bar" style={{ transform: `scaleX(${total ? done / total : 0})` }} /></div>
    <ol>{module.activities.map((a, i) => {
      const isDone = completed.has(completionKey(module.courseId, module.courseVersion, a.id));
      const isOpen = open.has(a.id);
      const state = isDone ? 'done' : isOpen || started.has(a.id) ? 'progress' : 'none';
      const label = state === 'done' ? 'Completed' : state === 'progress' ? 'In progress' : 'Not started';
      const pid = `lj-${module.courseId}-${a.id}`;
      const ActivityIcon = ACTIVITY_ICONS[a.id] ?? BookOpen;
      return <li key={a.id} className="lj-step" data-done={isDone}>
        <div className="lj-rail">
          <button type="button" disabled={busy} aria-pressed={isDone} aria-label={`${isDone ? t('Mark as not completed') : t('Mark as completed')}: ${t(a.title)}`} data-testid={`activity-${module.courseId}-${a.id}`} className="lj-check" onClick={() => onToggle(a.id)}>
            <span className="lj-num" aria-hidden="true">{i + 1}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" style={{ position: 'absolute' }}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </button>
          {i < total - 1 && <span className="lj-line" aria-hidden="true" />}
        </div>
        <div className="lj-body">
          <button type="button" className="lj-toggle" aria-expanded={isOpen} aria-controls={pid} onClick={() => flip(a.id)}>
            <span style={{ minWidth: 0 }}>
              <span className="lj-heading"><ActivityIcon size={16} className="lj-activity-icon" aria-hidden="true" /><span className="lj-title">{ui(a.title)}</span><span className="lj-dur">{ui(duration(a.hours))}</span></span>
              <span className="lj-meta"><span className="lj-status" data-s={state}>{t(label)}</span></span>
            </span>
            <svg className="lj-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <div id={pid} className="lj-panel" data-open={isOpen} aria-hidden={!isOpen}><div><div className="lj-inner">
            <div><h5>{t('Learning objective')}</h5><p className="lj-text">{ui(instruction(a.id, a.title, skills))}</p></div>
            <div><h5>{t('Shared resources for')} {ui(skills)}</h5>
              {resources.length ? <ul className="lj-res">{resources.map(r => {
                const u = web(r.url); const title = r.displayTitle ?? r.title; const prov = r.provider ?? u?.hostname.replace(/^www\./, '');
                const inner = <><span><span className="lj-rt">{ui(title)}</span>{prov && <span className="lj-rp">{ui(prov)}</span>}</span>{u && <svg className="lj-ext" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>}</>;
                return <li key={r.url}>{u ? <a href={r.url} target="_blank" rel="noopener noreferrer" tabIndex={isOpen ? undefined : -1} onClick={() => setStarted(p => new Set(p).add(a.id))}>{inner}</a> : <div className="lj-rt">{inner}</div>}</li>;
              })}</ul> : <p className="lj-note">{t('Resource not yet curated for this skill.')}</p>}
            </div>
            <p className="lj-note">{t('Use the resource for this activity; completing it here does not certify provider completion.')}</p>
          </div></div></div>
        </div>
      </li>;
    })}</ol>
  </div>;
}
