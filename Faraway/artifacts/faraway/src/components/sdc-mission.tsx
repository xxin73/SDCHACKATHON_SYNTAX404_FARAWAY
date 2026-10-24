import { useEffect, useState, type MouseEvent } from 'react';
import { ArrowDown } from 'lucide-react';
import { SdgConstellation } from './sdg-constellation';
import './sdc-mission.css';

const PILLARS = [
  ['🌍 Focus on real-world challenges', "From combating climate change and promoting clean energy to fostering quality education (SDG 4), good health and well-being (SDG 3), and reducing inequalities, we use technology to address the world's most pressing needs."],
  ['💻 Empowering sustainability through code', 'Transform cutting-edge AI technologies—such as large language models, machine learning, and data analytics—into practical digital solutions, giving every line of code the power to create social value.'],
  ['🤝 Co-creating a green and inclusive future', 'Break down the barriers between technology and reality, ensuring that innovation goes beyond the surface to genuinely serve humanity and the sustainable development of our planet.'],
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
      <h2>About the SDGs (Sustainable Development Goals) &amp; our mission</h2>
      <p>At the SDC (Sustainably Developing Code) AI Hackathon, we see an opportunity to explore how artificial intelligence (AI) and innovative thinking can help address real-world challenges and shape a better future.</p>
      <p>As participants, we aim to go beyond solving technical problems by developing meaningful solutions inspired by the 17 United Nations Sustainable Development Goals (SDGs). Through creativity, technology, and collaboration, we hope to demonstrate how AI can contribute to a more sustainable and inclusive future.</p>
    </div>
  );

  return (
    <>
      <div className="sdc-jump">
        <a href="#sdc-mission" onClick={jump} data-testid="link-sdc-mission">SDC AI Hackathon mission <ArrowDown size={16} aria-hidden /></a>
      </div>
      <section id="sdc-mission" className={`sdc-mission${reduce ? ' sdc-reduce' : ''}`} aria-label="SDC AI Hackathon mission" data-testid="section-sdc-mission">
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
          <p className="sdc-cta">Join us to ignite the spark of sustainable innovation with artificial intelligence and build a better tomorrow through technology!</p>
        </div>
      </section>
    </>
  );
}
