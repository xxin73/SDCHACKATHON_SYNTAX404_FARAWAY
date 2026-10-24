import { useEffect, useState } from 'react';
import { SdgConstellation } from './sdg-constellation';
import './sdc-mission.css';

const PILLARS = [
  ['Learning with purpose', 'Identify the skills you need and find practical ways to develop them.'],
  ['Preparing for change', 'Compare AI adoption scenarios to explore how future skill requirements could change.'],
  ['Growing together', 'Support learning across individuals, teams and academic programmes.'],
];

export function SdcMission() {
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduce(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const jump = (e: MouseEvent) => {
    e.preventDefault();
    document.getElementById('sdc-mission')?.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth', block: 'start' });
  };

  const hub = (
    <div className="sdc-hub-copy">
      <h2>Skills for a sustainable future</h2>
      <p>Faraway helps learners, employers and educators prepare for a changing world of work. Explore career possibilities, understand skill gaps and turn your next step into a practical learning plan.</p>
      <p>Our work supports relevant skills and decent work, inspired by the United Nations Sustainable Development Goals (SDGs). Explore the 17 goals below and discover how learning can contribute to a more inclusive future.</p>
    </div>
  );

  return (
    <>
      <section id="sdc-mission" className={`sdc-mission${reduce ? ' sdc-reduce' : ''}`} aria-label="Faraway mission" data-testid="section-sdc-mission">
        <div className="sdc-inner">
          <SdgConstellation reduce={reduce} hub={hub} />
          <div className="sdc-pillars">
            {PILLARS.map(([h, p]) => (
              <article key={h} className="sdc-pillar" data-testid={`pillar-${h.slice(3, 10).toLowerCase().replace(/\W+/g, '-')}`}>
                <h3>{h}</h3>
                <p>{p}</p>
              </article>
            ))}
          </div>
          <p className="sdc-cta">Build your skills. Explore your possibilities. Shape your next step.</p>
        </div>
      </section>
    </>
  );
}
