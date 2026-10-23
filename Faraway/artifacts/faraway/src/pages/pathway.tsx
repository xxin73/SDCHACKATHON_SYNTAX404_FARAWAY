import { useRef, useState, type DragEvent } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, FileUp, Plus, ScanLine, Trash2, UserRound, X } from 'lucide-react';
import { useParseCv } from '@/lib/local-engine';
import type { ParsedCv } from '@workspace/api-client-react';
import { ALL_SKILLS, CAREERS, STREAMS, careerById, careerInScenario } from '@/data/careers';
import { sampleProfile, setState, useStore, type Highest, type Profile } from '@/lib/store';
import { AiStage, SpectrumIcon } from '@/components/spectrum';
import { LEVELS, Reveal, SdgPill, skillSdg } from '@/components/bits';
import { RadarLegend, SkillRadar } from '@/components/radar';
import { JourneyStepper } from './dashboard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STEPS = ['Interest', 'Profile & CV', 'Education', 'Skills', 'Summary'];
const HIGHEST: Highest[] = ['SPM', 'Diploma', 'Degree', 'Masters', 'PhD'];

const upd = (fn: (p: Profile) => Partial<Profile>) => setState((s) => ({ ...s, profile: { ...s.profile, ...fn(s.profile) } }));

export default function Pathway() {
  const profile = useStore((s) => s.profile);
  const target = useStore((s) => s.plan.target);
  const scenario = useStore((s) => s.scenario);
  const [step, setStep] = useState(0);
  const [missing, setMissing] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [hoverSkill, setHoverSkill] = useState<string | null>(null);
  const [, nav] = useLocation();
  const { toast } = useToast();
  const parse = useParseCv();
  const fileRef = useRef<HTMLInputElement>(null);
  const lastInput = useRef<{ fileName: string; mimeType: string; contentBase64: string } | null>(null);
  const [drag, setDrag] = useState(false);

  const stream = STREAMS.find((s) => s.id === profile.stream);
  const skillList = Array.from(new Set([...(stream?.skills ?? []), ...Object.keys(profile.skills)]));
  const job = careerInScenario(careerById(target) ?? (profile.careers[0] ? careerById(profile.careers[0]) : undefined), scenario);

  const apply = (r: ParsedCv) => {
    const skills: Record<string, number> = {};
    r.skills.forEach((s) => { skills[s.name] = Math.max(1, Math.min(5, Math.round(s.level))); });
    upd((p) => ({
      name: r.name || p.name, email: r.email || p.email, location: r.location || p.location, summary: r.summary || p.summary,
      highest: r.highest, years: r.years ?? p.years, roles: r.roles?.length ? r.roles : p.roles, ug: r.ug, pg: r.pg, phd: r.phd,
      skills: { ...p.skills, ...skills }, stream: p.stream || r.suggestedStream,
    }));
    const empty = ['name', 'email', 'location'].filter((k) => !(r as unknown as Record<string, string>)[k]);
    setMissing(Array.from(new Set([...(r.missing ?? []).map((m) => m.toLowerCase()), ...empty])));
    toast({ title: 'CV scanned', description: `${r.skills.length} skills extracted. Dashed boxes need your input.` });
  };
  const run = (input: { fileName: string; mimeType: string; contentBase64: string }) => {
    lastInput.current = input;
    parse.mutate({ data: { ...input, knownSkills: ALL_SKILLS } }, { onSuccess: apply });
  };
  const onFile = (f?: File | null) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toast({ title: 'File too large', description: 'Please upload a CV under 8 MB.' }); return; }
    const reader = new FileReader();
    reader.onload = () => { const res = String(reader.result); run({ fileName: f.name, mimeType: f.type || 'application/octet-stream', contentBase64: res.slice(res.indexOf(',') + 1) }); };
    reader.readAsDataURL(f);
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); };
  const miss = (k: string, v: string) => (missing.some((m) => m.includes(k)) && !v ? 'field-missing' : '');

  const useSample = () => { setState((s) => ({ ...s, profile: { ...sampleProfile } })); setMissing([]); toast({ title: 'Sample profile loaded', description: 'Aina, a fresh CS graduate from UiTM.' }); };
  const finish = () => { upd(() => ({ complete: true })); nav('/analysis'); };
  const canNext = step === 0 ? !!profile.stream : step === 1 ? !!profile.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email) : step === 3 ? Object.keys(profile.skills).length >= 3 : true;

  const cvPanel = (
    <div className="space-y-4 lg:sticky lg:top-6">
      <AiStage pending={parse.isPending} error={parse.error} onRetry={() => lastInput.current && run(lastInput.current)} testId="cv"
        phases={['Reading document structure', 'Extracting roles and education', 'Mapping skills to the Faraway vocabulary', 'Preparing skills for your review']}>
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop} onClick={() => fileRef.current?.click()}
          role="button" tabIndex={0} data-testid="dropzone-cv" onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          className={cn('glass group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition-all', drag ? 'spectrum-border scale-[1.01] border-transparent' : 'hover:border-[hsl(250_50%_82%)]')}>
          <motion.div animate={drag ? { scale: 1.15, rotate: -6 } : { scale: 1, rotate: 0 }} className="grid h-16 w-16 place-items-center rounded-2xl border bg-white shadow-md"><SpectrumIcon icon={drag ? ScanLine : FileUp} size={30} /></motion.div>
          <p className="mt-4 font-display text-2xl">Upload CV</p>
          <p className="mt-1 max-w-[240px] text-sm text-muted-foreground">Upload a TXT CV to detect contact details and skill keywords locally. Review every field and rate your own skills.</p>
          <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} data-testid="input-cv-file" />
        </div>
      </AiStage>
      <button onClick={useSample} className="btn-ghost w-full" data-testid="button-sample-profile"><UserRound className="h-4 w-4" />No CV? Use sample profile</button>
      {missing.length > 0 && <p className="rounded-2xl bg-[hsl(30_100%_97%)] p-3 text-xs text-[hsl(25_60%_38%)]" data-testid="text-missing">Not found in CV: {missing.join(', ')}. Fill the dashed boxes.</p>}
    </div>
  );

  return (
    <div>
      <Reveal><p className="eyebrow mb-3">Explore pathway</p><h1 className="font-display text-4xl sm:text-5xl">Chart where you stand.</h1></Reveal>
      <div className="glass mt-8 rounded-[2.25rem] p-5 sm:p-10">
        <JourneyStepper labels={STEPS} done={STEPS.map((_, i) => i < step)} active={step} />
        <div className="my-8 h-px bg-border" />
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}>
            {step === 0 && (
              <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                <section>
                  <h2 className="font-display text-3xl">Interest</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Pick a stream first, then the careers that pull at you.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {STREAMS.map((s) => (
                      <motion.button whileTap={{ scale: 0.98 }} key={s.id} onClick={() => upd((p) => ({ stream: s.id, careers: p.stream === s.id ? p.careers : [] }))} data-testid={`button-stream-${s.id}`}
                        className={cn('relative rounded-2xl border bg-white/70 p-5 text-left transition-all hover:shadow-md', profile.stream === s.id && 'spectrum-border border-transparent bg-white shadow-md')}>
                        <p className="font-medium">{s.name}</p><p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
                        {profile.stream === s.id && <Check className="absolute right-4 top-4 h-4 w-4" />}
                      </motion.button>
                    ))}
                  </div>
                  {stream && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                      <p className="text-sm font-medium">Interested careers <span className="font-normal text-muted-foreground">(select any)</span></p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stream.careers.map((id) => { const c = careerById(id)!; const on = profile.careers.includes(id); return (
                          <button key={id} onClick={() => upd((p) => ({ careers: on ? p.careers.filter((x) => x !== id) : [...p.careers, id] }))} data-testid={`chip-career-${id}`}
                            className={cn('rounded-full border px-4 py-2 text-sm transition-all', on ? 'border-ink bg-ink text-white' : 'bg-white hover:border-[hsl(250_50%_80%)]')}>{c.title}</button>
                        ); })}
                      </div>
                    </motion.div>
                  )}
                </section>
                {cvPanel}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                <section className="space-y-8">
                  <div>
                    <h2 className="font-display text-3xl">Basic info</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field label="Full name"><input className={cn('field', miss('name', profile.name))} value={profile.name} onChange={(e) => upd(() => ({ name: e.target.value }))} data-testid="input-name" /></Field>
                      <Field label="Email"><input className={cn('field', miss('email', profile.email))} value={profile.email} onChange={(e) => upd(() => ({ email: e.target.value }))} data-testid="input-email" /></Field>
                      <Field label="Location"><input className={cn('field', miss('location', profile.location))} value={profile.location} onChange={(e) => upd(() => ({ location: e.target.value }))} placeholder="Shah Alam, Selangor" data-testid="input-location" /></Field>
                      <Field label="Status">
                        <select className="field" value={profile.status} onChange={(e) => upd(() => ({ status: e.target.value as Profile['status'] }))} data-testid="select-status">
                          <option value="graduate">Fresh graduate</option><option value="jobseeker">Job seeker</option><option value="switcher">Worker switching career</option>
                        </select>
                      </Field>
                    </div>
                  </div>
                  <div>
                    <h2 className="font-display text-3xl">Experience</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-[160px_1fr]">
                      <Field label="Total years"><input type="number" min={0} step={0.5} className={cn('field', miss('year', String(profile.years || '')))} value={profile.years} onChange={(e) => upd(() => ({ years: Number(e.target.value) }))} data-testid="input-years" /></Field>
                    </div>
                    <div className="mt-4 space-y-3">
                      {profile.roles.map((r, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_80px_36px] gap-2">
                          <input className="field" placeholder="Title" value={r.title} onChange={(e) => upd((p) => ({ roles: p.roles.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) }))} data-testid={`input-role-title-${i}`} />
                          <input className="field" placeholder="Company" value={r.company} onChange={(e) => upd((p) => ({ roles: p.roles.map((x, j) => (j === i ? { ...x, company: e.target.value } : x)) }))} data-testid={`input-role-company-${i}`} />
                          <input className="field" type="number" min={0} step={0.5} value={r.years} onChange={(e) => upd((p) => ({ roles: p.roles.map((x, j) => (j === i ? { ...x, years: Number(e.target.value) } : x)) }))} data-testid={`input-role-years-${i}`} />
                          <button onClick={() => upd((p) => ({ roles: p.roles.filter((_, j) => j !== i) }))} className="grid place-items-center rounded-xl text-muted-foreground hover:bg-muted" aria-label="Remove role" data-testid={`button-remove-role-${i}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      ))}
                      <button onClick={() => upd((p) => ({ roles: [...p.roles, { title: '', company: '', years: 0 }] }))} className={cn('btn-ghost', !profile.roles.length && missing.some((m) => m.includes('role') || m.includes('experience')) && 'field-missing')} data-testid="button-add-role"><Plus className="h-4 w-4" />Add role</button>
                    </div>
                  </div>
                </section>
                {cvPanel}
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                <section>
                  <h2 className="font-display text-3xl">Education</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Highest level completed, then the details that apply.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {HIGHEST.map((h) => <button key={h} onClick={() => upd(() => ({ highest: h }))} data-testid={`button-highest-${h}`} className={cn('rounded-full border px-4 py-2 text-sm transition-all', profile.highest === h ? 'border-ink bg-ink text-white' : 'bg-white')}>{h}</button>)}
                  </div>
                  {(['ug', 'pg', 'phd'] as const).filter((k) => (k === 'ug' && profile.highest !== 'SPM') || (k === 'pg' && ['Masters', 'PhD'].includes(profile.highest)) || (k === 'phd' && profile.highest === 'PhD')).map((k) => (
                    <div key={k} className="mt-6">
                      <p className="eyebrow mb-2">{k === 'ug' ? 'Undergraduate / Diploma' : k === 'pg' ? 'Postgraduate' : 'Doctorate'}</p>
                      <div className="grid gap-3 sm:grid-cols-[1.4fr_1.2fr_100px]">
                        {(['field', 'institution', 'year'] as const).map((f) => (
                          <input key={f} placeholder={f[0].toUpperCase() + f.slice(1)} value={profile[k][f]} onChange={(e) => upd((p) => ({ [k]: { ...p[k], [f]: e.target.value } }))}
                            className={cn('field', missing.some((m) => m.includes('educ') || m.includes(k)) && !profile[k][f] && 'field-missing')} data-testid={`input-${k}-${f}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
                {cvPanel}
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
                <section>
                  <h2 className="font-display text-3xl">Skills</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Self-rate each from 0 to 5. The radar redraws as you drag.</p>
                  <ul className="mt-6 space-y-4">
                    {skillList.map((sk) => { const v = profile.skills[sk] ?? 0; return (
                      <li key={sk} onMouseEnter={() => setHoverSkill(sk)} onMouseLeave={() => setHoverSkill(null)}>
                        <div className="mb-1.5 flex items-center justify-between text-sm"><span className="flex items-center gap-2">{sk}<SdgPill n={skillSdg(sk)} small /></span><span className="font-mono text-xs text-muted-foreground">{LEVELS[v]} · {v}/5</span></div>
                        <input type="range" min={0} max={5} value={v} className="range" aria-label={`${sk} level`} data-testid={`range-skill-${sk.replace(/\W/g, '')}`}
                          onChange={(e) => { const n = Number(e.target.value); upd((p) => { const s = { ...p.skills }; if (n === 0) delete s[sk]; else s[sk] = n; return { skills: s }; }); }}
                          style={{ background: `linear-gradient(90deg, #8fb0ff, #c08bff ${v * 20}%, hsl(232 40% 94%) ${v * 20}%)` }} />
                      </li>
                    ); })}
                  </ul>
                  <div className="mt-6 flex gap-2">
                    <input list="all-skills" className="field" placeholder="Others — add a skill" value={other} onChange={(e) => setOther(e.target.value)} data-testid="input-other-skill" />
                    <datalist id="all-skills">{ALL_SKILLS.map((s) => <option key={s} value={s} />)}</datalist>
                    <button className="btn-ghost shrink-0" disabled={!other.trim()} onClick={() => { upd((p) => ({ skills: { ...p.skills, [other.trim()]: p.skills[other.trim()] ?? 2 } })); setOther(''); }} data-testid="button-add-skill"><Plus className="h-4 w-4" />Add</button>
                  </div>
                </section>
                <section className="glass rounded-3xl p-6 lg:sticky lg:top-6 lg:self-start">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-display text-2xl">Radar map</p><span className="flex items-center gap-1.5 font-mono text-[10.5px] text-muted-foreground"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9a6bff]" />REAL-TIME</span></div>
                  <p className="mb-2 text-xs text-muted-foreground">{job ? `Overlaid with ${job.title} requirements` : 'Select a career target to overlay its requirements'}</p>
                  <SkillRadar size={380} hovered={hoverSkill} onHover={setHoverSkill}
                    axes={job ? Array.from(new Set([...Object.keys(job.required), ...Object.keys(profile.skills)])).slice(0, 8).map((s) => ({ skill: s, have: profile.skills[s] ?? 0, need: job.required[s] ?? 0 })) : Object.entries(profile.skills).slice(0, 8).map(([skill, have]) => ({ skill, have }))} />
                  <RadarLegend withNeed={!!job} />
                </section>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <section className="space-y-5">
                  <h2 className="font-display text-3xl">Summary</h2>
                  <textarea className="field min-h-[110px]" placeholder="One or two lines about you" value={profile.summary} onChange={(e) => upd(() => ({ summary: e.target.value }))} data-testid="input-summary" />
                  <dl className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
                    {[['Name', profile.name || '—'], ['Location', profile.location || '—'], ['Stream', stream?.name ?? '—'], ['Interests', profile.careers.map((c) => careerById(c)?.title).join(', ') || '—'], ['Highest education', `${profile.highest}${profile.ug.field ? ` · ${profile.ug.field}` : ''}`], ['Experience', `${profile.years} yrs · ${profile.roles.length} roles`]].map(([k, v]) => (
                      <div key={k} className="bg-white p-4"><dt className="eyebrow">{k}</dt><dd className="mt-1 text-sm">{v}</dd></div>
                    ))}
                  </dl>
                </section>
                <section className="glass rounded-3xl p-6">
                  <p className="eyebrow mb-3">{Object.keys(profile.skills).length} skills rated</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profile.skills).map(([s, v]) => (
                      <span key={s} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm">{s}<span className="font-mono text-xs text-muted-foreground">{v}/5</span>
                        <button onClick={() => upd((p) => { const n = { ...p.skills }; delete n[s]; return { skills: n }; })} aria-label={`Remove ${s}`} data-testid={`button-remove-skill-${s.replace(/\W/g, '')}`}><X className="h-3 w-3 text-muted-foreground" /></button></span>
                    ))}
                  </div>
                  <p className="mt-6 text-xs text-muted-foreground">Of {CAREERS.length} careers modelled, Faraway will rank the ones that fit you best on the next screen.</p>
                </section>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between border-t pt-6">
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost" data-testid="button-back"><ArrowLeft className="h-4 w-4" />Back</button>
          <span className="font-mono text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
          {step < 4 ? <button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="btn-ink" data-testid="button-next">Next<ArrowRight className="h-4 w-4" /></button>
            : <button onClick={finish} className="btn-ink" data-testid="button-finish">See skill analysis<ArrowRight className="h-4 w-4" /></button>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>{children}</label>;
}
