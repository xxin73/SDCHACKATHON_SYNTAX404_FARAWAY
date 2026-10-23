import { careerById } from '@/data/careers';

/** Displays provenance for the SAME requirements used by scoring and the server. */
export function EscoReference({careerId}:{careerId:string}) {
  const source=careerById(careerId)?.skillEvidence;
  if(!source)return null;
  return <div className="my-3 text-xs text-muted-foreground" data-testid="esco-reference">
    <p>Six skill areas informed by ESCO {source.version}. Target: 3/5 for independent routine tasks, set by Faraway for practice.</p>
    <details className="mt-2">
      <summary className="cursor-pointer underline">Why these skills?</summary>
      <p className="mt-2">Mapped occupation: {source.occupationLabel}. This is a selected pathway, not an official top-six ranking or a complete list of job requirements. Missing assessments count as zero until you reassess.</p>
      <ul className="mt-2 space-y-2">{source.groups.map(group=><li key={group.skill}>
        <strong>{group.skill}</strong>: {group.sourceSkills.map(s=>`${s.label} (${s.relation})`).join('; ')}.
        {' '}{group.note}
      </li>)}</ul>
      <p className="mt-2">{source.rubric}</p>
      <a className="underline" href="https://esco.ec.europa.eu/en/use-esco/download" target="_blank" rel="noreferrer">Source: European Commission ESCO dataset</a>
    </details>
  </div>;
}
