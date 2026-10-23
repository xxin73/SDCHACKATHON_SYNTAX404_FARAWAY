import { withRoleYears, withTotalYears } from '@/lib/experience';
import { cleanSkill, skillError } from '@/lib/skill-validation';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, FileUp, Plus, ScanLine, Trash2, UserRound, X } from 'lucide-react';
import { useParseCv } from '@/lib/local-engine';
import { detectSkills, type CvResult as ParsedCv } from '@/lib/cv-reader';
import { ALL_SKILLS, CAREERS, STREAMS, careerById, careerInScenario } from '@/data/careers';
import { setState, useStore, type Highest, type Profile } from '@/lib/store';
import { AiStage, SpectrumIcon } from '@/components/spectrum';
import { LEVELS, Reveal, SdgPill, skillSdg } from '@/components/bits';
import { RadarLegend, SkillRadar } from '@/components/radar';
import { JourneyStepper } from './dashboard';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STEPS = ['Interest', 'Profile & CV', 'Education', 'Skills', 'Summary'];
const HIGHEST: Highest[] = ['Secondary', 'Pre-U', 'Diploma', 'Degree', 'Masters', 'PhD'];

const upd = (fn: (p: Profile) => Partial<Profile>) => setState((s) => ({ ...s, profile: { ...s.profile, ...fn(s.profile) } }));

export default function Pathway() {
  const profile = useStore((s) => s.profile);
  const target = useStore((s) => s.plan.target);
  const scenario = useStore((s) => s.scenario);
  const [step, setStep] = useState(new URLSearchParams(window.location.search).get('step')==='skills'?3:0);
  const [missing, setMissing] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [hoverSkill, setHoverSkill] = useState<string | null>(null);
  const [, nav] = useLocation();
  const { toast } = useToast();
  const parse = useParseCv();
  const fileRef = useRef<HTMLInputElement>(null);
  const lastInput = useRef<{ fileName: string; mimeType: string; contentBase64: string } | null>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<{url:string;type:string;name:string}|null>(null);
  const [cvReview,setCvReview]=useState<ParsedCv|null>(null);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview.url);},[preview]);

  const stream = STREAMS.find((s) => s.id === profile.stream);
  const skillList = Array.from(new Set([...(stream?.skills ?? []), ...CAREERS.filter(c=>profile.careers.includes(c.id)||c.id===target).flatMap(c=>Object.keys(c.required)), ...Object.keys(profile.skills)]));
  const job = careerInScenario(careerById(target) ?? (profile.careers[0] ? careerById(profile.careers[0]) : undefined), scenario);

  const apply = (r: ParsedCv) => {
    const skills: Record<string, number> = {};
    r.skills.forEach((s) => { skills[s.name] = profile.skills[s.name] ?? 0; });
    upd((p) => ({
      name: r.name || p.name, email: r.email || p.email, location: r.location || p.location, summary: r.summary || p.summary,
      highest: r.highest || p.highest, years: p.years, roles: r.roles?.length ? r.roles : p.roles, ug: r.ug.field ? r.ug : p.ug, pg: r.pg.field ? r.pg : p.pg, phd: r.phd.field ? r.phd : p.phd,
      skills: { ...p.skills, ...skills }, stream: p.stream || r.suggestedStream,
    }));
    const empty = ['name', 'email', 'location'].filter((k) => !(r as unknown as Record<string, string>)[k]);
    setMissing(Array.from(new Set([...(r.missing ?? []).map((m) => m.toLowerCase()), ...empty])));
    toast({ title: 'CV scanned', description: `${r.skills.length} skills extracted. Dashed boxes need your input.` });
  };
  const run = (input: { fileName: string; mimeType: string; contentBase64: string }) => {
    lastInput.current = input;
    parse.mutate({ data: { ...input, knownSkills: ALL_SKILLS } }, { onSuccess: setCvReview });
  };
  const onFile = (f?: File | null) => {
    if (!f || parse.isPending) return;
    if (f.size > 8 * 1024 * 1024) { toast({ title: 'File too large', description: 'Please upload a CV under 8 MB.' }); return; }
    setPreview({url:URL.createObjectURL(f),type:f.type|| (f.name.toLowerCase().endsWith('.pdf')?'application/pdf':'text/plain'),name:f.name}); setCvReview(null);
    const reader = new FileReader();
    reader.onload = () => { const res = String(reader.result); run({ fileName: f.name, mimeType: f.type || 'application/octet-stream', contentBase64: res.slice(res.indexOf(',') + 1) }); };
    reader.readAsDataURL(f);
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0]); };
  const miss = (k: string, v: string) => (missing.some((m) => m.includes(k)) && !v ? 'field-missing' : '');

  const finish = () => { upd(p => ({ complete: true, skills: {...Object.fromEntries(skillList.map(s=>[s,0])),...p.skills} })); nav('/analysis'); };
  const canNext = step === 0 ? !!profile.stream && (profile.stream!=='other'||!!profile.otherInterest?.trim()) : step === 1 ? !!profile.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email) : step === 2 ? !!profile.highest && (profile.highest!=='Secondary'||!!profile.secondaryQualification)&&(profile.highest!=='Pre-U'||!!profile.preUQualification)&&(profile.highest!=='Diploma'||!!profile.diploma?.field.trim()) : step === 3 ? skillList.length >= 3 : true;

  const cvPanel = (
    <div className="space-y-4 lg:sticky lg:top-6">
      <AiStage pending={parse.isPending} error={parse.error} onRetry={() => lastInput.current && run(lastInput.current)} testId="cv"
        phases={['Reading document structure', 'Detecting contact details', 'Detecting catalogue skill keywords', 'Preparing skills for your review']}>
        <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop} onClick={() => fileRef.current?.click()}
          role="button" tabIndex={0} data-testid="dropzone-cv" onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          className={cn('glass group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-6 text-center transition-all', drag ? 'spectrum-border scale-[1.01] border-transparent' : 'hover:border-[hsl(250_50%_82%)]')}>
          <motion.div animate={drag ? { scale: 1.15, rotate: -6 } : { scale: 1, rotate: 0 }} className="grid h-16 w-16 place-items-center rounded-2xl border bg-white shadow-md"><SpectrumIcon icon={drag ? ScanLine : FileUp} size={30} /></motion.div>
          <p className="mt-4 font-display text-2xl">{preview?'CV uploaded':'Upload CV'}</p>{preview&&<p className="text-xs">{preview.name} · click to replace</p>}
          <p className="mt-1 max-w-[240px] text-sm text-muted-foreground">PDF, TXT, PNG or JPG / JPEG · up to 8 MB. Text extraction runs in your browser. Review the results and rate your skills; a CV does not prove proficiency.</p>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.png,.jpg,.jpeg,application/pdf,text/plain,image/png,image/jpeg" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} data-testid="input-cv-file" />
        </div>
      </AiStage>
      {preview&&<div className="rounded-2xl border p-3"><p className="mb-2 text-sm font-medium">{preview.name}</p>{preview.type.startsWith('image/')?<img src={preview.url} alt="Your uploaded CV" className="w-full"/>:<iframe src={preview.url} title="Your uploaded CV" className="h-[480px] w-full"/>}</div>}
      {cvReview&&<div className="space-y-3 rounded-2xl border bg-white p-4"><h3 className="font-medium">Review extracted details</h3><p className="text-xs">Only the uploaded file is used. Empty fields keep your saved details. Check every suggestion before applying.</p>{(['name','email','location'] as const).map(k=><label key={k} className="block text-sm">{k}<input className="field" value={cvReview[k]} onChange={e=>setCvReview({...cvReview,[k]:e.target.value})}/></label>)}<p className="text-sm">Education detected: {cvReview.highest||'Needs manual review'}</p>{cvReview.educationText&&<pre className="whitespace-pre-wrap text-xs">{cvReview.educationText}</pre>}{cvReview.experienceText&&<><p className="text-sm">Experience text — use this to enter your roles; dates and durations are not guessed.</p><pre className="whitespace-pre-wrap text-xs">{cvReview.experienceText}</pre></>}<p className="text-xs">Suggested skills (rate these yourself): {cvReview.skills.map(s=>s.name).join(', ')||'None detected'}</p><button className="btn-ink" onClick={()=>{apply(cvReview);setCvReview(null);}}>Apply reviewed details</button><button className="btn-ghost" onClick={()=>setCvReview(null)}>Discard</button></div>}
      <p className="text-xs text-muted-foreground">No CV? Enter your information manually. Image/scanned PDF reading currently uses English OCR and downloads recognition files on first use.</p>
      {missing.length > 0 && <p className="rounded-2xl bg-[hsl(30_100%_97%)] p-3 text-xs text-[hsl(25_60%_38%)]" data-testid="text-missing">Could not confidently extract: {missing.join(', ')}. Review or enter these details manually; they may still be present in your CV.</p>}
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
                  <p className="mt-1 text-sm text-muted-foreground">Choose an interest area, then select careers you want to explore. Careers and assessment skills below follow the occupation links for your chosen interest.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {STREAMS.map((s) => (
                      <motion.button whileTap={{ scale: 0.98 }} key={s.id} onClick={() => {upd((p) => ({ stream: s.id, careers: p.stream === s.id ? p.careers.filter(id=>s.id==='other'||s.careers.includes(id)) : [] }));if(s.id!=='other'&&!s.careers.includes(target))setState(state=>({...state,plan:{...state.plan,target:s.careers[0]??'',skills:[],saved:false}}));}} data-testid={`button-stream-${s.id}`}
                        className={cn('relative rounded-2xl border bg-white/70 p-5 text-left transition-all hover:shadow-md', profile.stream === s.id && 'spectrum-border border-transparent bg-white shadow-md')}>
                        <p className="font-medium">{s.name}</p><p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
                        {profile.stream === s.id && <Check className="absolute right-4 top-4 h-4 w-4" />}
                      </motion.button>
                    ))}
                  </div>
                  {profile.stream==='other'&&<Field label="Your interest"><input className="field mt-4" maxLength={100} value={profile.otherInterest??''} onChange={e=>upd(()=>({otherInterest:e.target.value}))} placeholder="For example: marine conservation"/></Field>}
                  {stream && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                      <p className="text-sm font-medium">Career interests <span className="font-normal text-muted-foreground">(select any)</span></p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(stream.id==='other'?CAREERS.map(c=>c.id):stream.careers).map((id) => { const c = careerById(id); if(!c)return null; const on = profile.careers.includes(id); return (
                          <button key={id} onClick={() => upd((p) => ({ careers: on ? p.careers.filter((x) => x !== id) : [...p.careers, id] }))} data-testid={`chip-career-${id}`}
                            className={cn('rounded-full border px-4 py-2 text-sm transition-all', on ? 'border-ink bg-ink text-white' : 'bg-white hover:border-[hsl(250_50%_80%)]')}>{c.title}</button>
                        ); })}
                      </div><Field label="Other career interest (optional)"><input className="field mt-4" maxLength={100} value={profile.otherCareer??''} onChange={e=>upd(()=>({otherCareer:e.target.value}))} placeholder="Tell us a role you cannot find"/></Field><p className="mt-2 text-xs text-muted-foreground">Custom interests are saved to your profile. We only score roles with defined skill requirements; we do not invent a match for an unsupported role.</p>
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
                    <p className="mt-3 text-sm text-muted-foreground">Add each role and its duration in years (maximum 99 years per role and in total). Total experience updates automatically and is capped at 99 years; If roles overlap, adjust the total below to count that time once.</p>
                    <Field label="Total relevant experience in years (adjust if roles overlap)"><input type="number" min={0} max={99} step={0.25} className="field mt-3 max-w-xs" placeholder="0" value={profile.years||''} onChange={e=>upd(p=>withTotalYears(p,e.target.value))} data-testid="input-years"/></Field>
                    <div className="mt-4 space-y-3">
                      {profile.roles.map((r,i)=><div key={i} className="rounded-2xl border bg-white/70 p-4"><div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Job title"><input className="field" placeholder="For example: pharmacy assistant" value={r.title} onChange={e=>upd(p=>({roles:p.roles.map((x,j)=>j===i?{...x,title:e.target.value}:x)}))} data-testid={`input-role-title-${i}`}/></Field>
                        <Field label="Company / organisation"><input className="field" value={r.company} onChange={e=>upd(p=>({roles:p.roles.map((x,j)=>j===i?{...x,company:e.target.value}:x)}))} data-testid={`input-role-company-${i}`}/></Field>
                        <Field label="Duration in years (0.5 = 6 months)"><input className="field" type="number" min={0} max={99} step={0.25} placeholder="0" value={r.years||''} onChange={e=>upd(p=>withRoleYears(p,i,e.target.value))} data-testid={`input-role-years-${i}`}/></Field>
                      </div><Field label="Responsibilities and achievements"><textarea className="field mt-3" value={r.responsibilities??''} placeholder="What did you do? Which tools did you use? What did you achieve?" onChange={e=>upd(p=>({roles:p.roles.map((x,j)=>j===i?{...x,responsibilities:e.target.value.slice(0,3000)}:x)}))}/></Field><button className="btn-ghost mt-2 text-xs" onClick={()=>{const found=detectSkills(r.responsibilities??'',ALL_SKILLS);upd(p=>({skills:{...Object.fromEntries(found.map(sk=>[sk,0])),...p.skills}}));toast({title:found.length?'Skills added for your review':'No catalogue keywords found',description:found.length?found.join(', '):'Add skills manually in the Skills step.'});}}>Find skills in responsibilities</button><button className="btn-ghost mt-2 text-xs" onClick={()=>upd(p=>{const roles=p.roles.filter((_,j)=>j!==i);return {roles,years:Math.min(99,roles.reduce((n,x)=>n+x.years,0))};})} data-testid={`button-remove-role-${i}`}><Trash2 size={14}/>Remove this role</button></div>)}
                      <button onClick={() => upd((p) => ({ roles: [...p.roles, { title: '', company: '', years: p.roles.length?0:p.years, responsibilities: '' }] }))} className={cn('btn-ghost', !profile.roles.length && missing.some((m) => m.includes('role') || m.includes('experience')) && 'field-missing')} data-testid="button-add-role"><Plus className="h-4 w-4" />Add role</button>
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
                  <p className="mt-1 text-sm text-muted-foreground">Highest level completed, then the qualification and field that apply.</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {HIGHEST.map((h) => <button key={h} onClick={() => upd(() => ({ highest: h }))} data-testid={`button-highest-${h}`} className={cn('rounded-full border px-4 py-2 text-sm transition-all', profile.highest === h ? 'border-ink bg-ink text-white' : 'bg-white')}>{h}</button>)}
                  </div>
                  {profile.highest==='Pre-U'&&<div className="mt-6 space-y-4"><Field label="Pre-university qualification"><select className="field" value={profile.preUQualification??''} onChange={e=>upd(()=>({preUQualification:e.target.value}))}><option value="">Select qualification</option>{['A-Level','STPM','Foundation','Matriculation','International Baccalaureate (IB)','UEC','Other pre-university qualification'].map(q=><option key={q}>{q}</option>)}</select></Field><EducationFields entry={profile.preU??{field:'',institution:'',year:''}} showField={false} onChange={entry=>upd(()=>({preU:entry}))} testId="preu"/></div>}
                  {profile.highest==='Secondary'&&<Field label="Secondary qualification"><select className="field mt-4" value={profile.secondaryQualification??''} onChange={e=>upd(()=>({secondaryQualification:e.target.value}))}><option value="">Select qualification</option>{['SPM','PT3','IGCSE / O-Level','Other secondary qualification'].map(q=><option key={q}>{q}</option>)}</select></Field>}
                  {profile.highest==='Diploma'&&<div className="mt-6"><p className="eyebrow mb-3">Diploma</p><EducationFields entry={profile.diploma??{field:'',institution:'',year:''}} onChange={entry=>upd(()=>({diploma:entry}))} testId="diploma"/></div>}
                  {(['ug','pg','phd'] as const).filter((k)=>(k==='ug'&&['Degree','Masters','PhD'].includes(profile.highest))||(k==='pg'&&['Masters','PhD'].includes(profile.highest))||(k==='phd'&&profile.highest==='PhD')).map(k=><div key={k} className="mt-6"><p className="eyebrow mb-3">{k==='ug'?'Degree':k==='pg'?'Masters':'PhD'}</p><EducationFields entry={profile[k]} onChange={entry=>upd(()=>({[k]:entry}))} testId={k}/></div>)}

                </section>
                {cvPanel}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <section>
                  <h2 className="font-display text-3xl">Skills</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Self-rate each skill from 0 to 5. Add other relevant skills below.</p>
                  <ul className="mt-6 space-y-4">
                    {skillList.map((sk) => { const v = profile.skills[sk] ?? 0; return (
                      <li key={sk} onMouseEnter={() => setHoverSkill(sk)} onMouseLeave={() => setHoverSkill(null)}>
                        <div className="mb-1.5 flex items-center justify-between text-sm"><span className="flex items-center gap-2">{sk}<SdgPill n={skillSdg(sk)} small /></span><span className="font-mono text-xs text-muted-foreground">{LEVELS[v]} · {v}/5</span></div>
                        <input type="range" min={0} max={5} value={v} className="range" aria-label={`${sk} level`} data-testid={`range-skill-${sk.replace(/\W/g, '')}`}
                          onChange={(e) => { const n = Number(e.target.value); upd((p) => { const s = { ...p.skills }; s[sk] = n; return { skills: s }; }); }}
                          style={{ background: `linear-gradient(90deg, #8fb0ff, #c08bff ${v * 20}%, hsl(232 40% 94%) ${v * 20}%)` }} />
                      </li>
                    ); })}
                  </ul>
                  <div className="mt-6 flex gap-2">
                    <input list="all-skills" className="field" placeholder="Others — add a skill" value={other} onChange={(e) => setOther(e.target.value)} data-testid="input-other-skill" />
                    <datalist id="all-skills">{ALL_SKILLS.map((s) => <option key={s} value={s} />)}</datalist>
                    <button className="btn-ghost shrink-0" disabled={!other.trim()} onClick={() => { const error=skillError(other);if(error){toast({title:'Invalid skill',description:error});return;}const name=cleanSkill(other);upd((p) => ({ skills: { ...p.skills, [name]: p.skills[name] ?? 0 } })); setOther(''); }} data-testid="button-add-skill"><Plus className="h-4 w-4" />Add</button>
                  </div>
                </section>

              </div>
            )}

            {step === 4 && (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <section className="space-y-5">
                  <h2 className="font-display text-3xl">Summary</h2>

                  <dl className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2">
                    {[['Name', profile.name || '—'], ['Location', profile.location || '—'], ['Interest area', profile.otherInterest || stream?.name || '—'], ['Careers to explore', [...profile.careers.map((c) => careerById(c)?.title),profile.otherCareer].filter(Boolean).join(', ') || '—'], ['Highest education', [profile.highest,profile.highest==='Pre-U'?profile.preUQualification:'',profile.highest==='Secondary'?profile.secondaryQualification:'',profile.highest==='Diploma'?profile.diploma?.field:profile.highest==='Pre-U'?'':profile.ug.field].filter(Boolean).join(' · ')], ['Experience', `${profile.years} yrs · ${profile.roles.length} roles`]].map(([k, v]) => (
                      <div key={k} className="bg-white p-4"><dt className="eyebrow">{k}</dt><dd className="mt-1 text-sm">{v}</dd></div>
                    ))}
                  </dl>
                </section>
                <section className="glass rounded-3xl p-6">
                  <p className="eyebrow mb-3">{Object.keys(profile.skills).length} skills rated</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profile.skills).map(([s, v]) => (
                      <span key={s} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm">{s}<span className="font-mono text-xs text-muted-foreground">{v}/5</span>
</span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">Use Back to edit your skill ratings; this summary is read-only.</p><p className="mt-6 text-xs text-muted-foreground">Of {CAREERS.length} careers modelled, Faraway will rank the ones that fit you best on the next screen.</p>
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

function EducationFields({entry,onChange,testId,showField=true}:{entry:Profile['ug'];onChange:(entry:Profile['ug'])=>void;testId:string;showField?:boolean}){return <div className="grid gap-4 sm:grid-cols-2">{showField&&<Field label="Field of study"><input className="field" value={entry.field} onChange={e=>onChange({...entry,field:e.target.value})} placeholder="e.g. Software Engineering" data-testid={`input-${testId}-field`}/></Field>}<Field label="School / institution"><input className="field" value={entry.institution} onChange={e=>onChange({...entry,institution:e.target.value})} data-testid={`input-${testId}-institution`}/></Field><Field label="Graduation / completion year"><input className="field" type="text" inputMode="numeric" maxLength={4} pattern="[0-9]{4}" placeholder="e.g. 2025" value={entry.year} onChange={e=>onChange({...entry,year:e.target.value.replace(/\D/g,'').slice(0,4)})} data-testid={`input-${testId}-year`}/></Field></div>;}
