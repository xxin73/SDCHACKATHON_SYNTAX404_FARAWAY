// Shared deterministic rules. No network, model calls, browser storage or secrets.
export type ProfileInput = { stream: string; careers: string[]; years: number; skills: Record<string, number>; complete: boolean };
export type Preferences = { target: string; setting: string; cost: string; onlineOnly: boolean; minutesPerDay: number; mode: string; skills: string[]; delivery?: 'online'|'in-person'|'hybrid'|'any'; futureScenario?: 'moderate'|'fast' };
export type SkillEvidence = { version:string; occupationLabel:string; occupationUri:string; rubric:string; groups:{skill:string;target:number;note:string;sourceSkills:{uri:string;label:string;relation:string}[]}[] };
export type Role = { id: string; title: string; stream: string; skillEvidence?: SkillEvidence; required: Record<string, number>; minYears: number; demand: { moderate: number } };
export type Course = { id: string; title: string; provider: string; version: string; skills: string[]; hours: number; cost: number; rating: number; online: boolean; setting: string; hrdc: boolean };
export type Catalogue = { version: string; published_at: string; observed_at: string | null; status: 'illustrative'; careers: Role[]; courses: Course[] };
export type Match = { careerId: string; score: number; gaps: { skill: string; have: number; need: number }[] };
export type Module = { courseId: string; courseVersion: string; title: string; provider: string; skills: string[]; hours: number; cost: number; weeks: number; why: string; activities: { id: string; title: string; hours: number }[] };
export type PlanResult = { overview: string; modules: Module[]; missing: string[]; totalHours: number; totalCost: number; totalWeeks: number };
export type Explanation = { careerId: string; fitSummary: string; actions: string[] };
export type Generated = { kind: 'explain' | 'plan'; rankings: Match[]; explanations?: Explanation[]; plan?: PlanResult; careerId?: string; meta: { catalogueVersion: string; cataloguePublishedAt: string; evidenceObservedAt: string | null; evidenceStatus: string; profileHash: string; preferencesHash: string; generatedAt: string; model: string; promptVersion: string; calculationVersion: string } };
export const PROMPT_VERSION = 'grounded-personal-esco-v4';
export const CALCULATION_VERSION = 'weighted-baseline-v1';

function object(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object.');
}
export function profileInput(value: unknown): ProfileInput {
  object(value);
  if (value.complete !== true) throw new Error('Confirm your profile and skills on the pathway Summary step first.');
  if (typeof value.stream !== 'string' || !value.stream || value.stream.length > 100) throw new Error('Choose an interest stream.');
  if (!Array.isArray(value.careers) || value.careers.length > 30 || value.careers.some(x => typeof x !== 'string' || x.length > 100)) throw new Error('Invalid career interests.');
  if (typeof value.years !== 'number' || !Number.isFinite(value.years) || value.years < 0 || value.years > 99) throw new Error('Experience must be between 0 and 99 years.');
  object(value.skills);
  if (!Object.keys(value.skills).length || Object.keys(value.skills).length > 100) throw new Error('Confirm between 1 and 100 skills.');
  for (const [skill, rating] of Object.entries(value.skills)) if (!skill || skill.length > 100 || !Number.isInteger(rating) || Number(rating) < 0 || Number(rating) > 5) throw new Error('Skill ratings must be whole numbers from 0 to 5.');
  return { stream: value.stream, careers: [...value.careers] as string[], years: value.years, skills: { ...value.skills } as Record<string, number>, complete: true };
}
export function preferences(value: unknown): Preferences {
  object(value);
  if (!['indoor','outdoor','either'].includes(String(value.setting)) || !['free','low','moderate','hrdc','any'].includes(String(value.cost)) || !['recommended','custom'].includes(String(value.mode)) || typeof value.onlineOnly !== 'boolean') throw new Error('Invalid learning preferences.');
  if (typeof value.minutesPerDay !== 'number' || !Number.isInteger(value.minutesPerDay) || value.minutesPerDay < 15 || value.minutesPerDay > 240) throw new Error('Choose 15–240 study minutes per day.');
  if (typeof value.target !== 'string' || value.target.length > 100 || !Array.isArray(value.skills) || value.skills.length > 100 || value.skills.some(x => typeof x !== 'string' || x.length > 100)) throw new Error('Invalid target or skills.');
  if(value.delivery!==undefined&&!['online','in-person','hybrid','any'].includes(String(value.delivery)))throw new Error('Invalid delivery preference.');
  if(value.futureScenario!==undefined&&!['moderate','fast'].includes(String(value.futureScenario)))throw new Error('Invalid future scenario.');
  return { ...(value.delivery?{delivery:value.delivery as Preferences['delivery']}:{}), ...(value.futureScenario?{futureScenario:value.futureScenario as Preferences['futureScenario']}:{}), target: value.target, setting: String(value.setting), cost: String(value.cost), onlineOnly: value.onlineOnly, minutesPerDay: value.minutesPerDay, mode: String(value.mode), skills: [...value.skills] as string[] };
}
export function stable(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => JSON.stringify(k) + ':' + stable(v)).join(',') + '}';
  return JSON.stringify(value);
}
export async function digest(value: unknown) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(stable(value))))).map(x => x.toString(16).padStart(2,'0')).join('');
}
export function rank(profile: ProfileInput, catalogue: Catalogue): Match[] {
  return catalogue.careers.map(c => {
    const required = Object.entries(c.required);
    if (!required.length || required.some(([,v]) => !Number.isFinite(v) || v <= 0 || v > 5)) throw new Error('Invalid catalogue requirements.');
    const skillFit = required.reduce((n,[s,v]) => n + Math.min((profile.skills[s] ?? 0)/v,1),0)/required.length;
    const interest = profile.careers.includes(c.id) ? 1 : profile.stream === c.stream ? .6 : .25;
    const experience = Math.min((profile.years+.5)/(c.minYears+.5),1);
    // Existing practice heuristic: the 10% market component is an illustrative
    // fixture, never a forecast. It is not sent to Gemini as evidence.
    const marketFit = c.demand.moderate / 100;
    const score = Math.round((100 * (.65*skillFit+.15*interest+.1*experience+.1*marketFit)) * 10) / 10;
    return { careerId: c.id, score, gaps: required.map(([skill,need]) => ({skill,need,have:profile.skills[skill]??0})).filter(g => g.have<g.need).sort((a,b) => (b.need-b.have)-(a.need-a.have)) };
  }).sort((a,b) => b.score-a.score || a.careerId.localeCompare(b.careerId));
}
export const FUTURE_SKILLS = ['AI Tools','Python','SQL','Machine Learning','Data Visualisation','Cloud Computing'];
// Explicit what-if rule; ESCO does not supply future proficiency targets.
export function scenarioRequirements(required:Record<string,number>,scenario?:'moderate'|'fast') {
 return Object.fromEntries(Object.entries(required).map(([skill,level])=>[skill,Math.min(5,level+(scenario&&FUTURE_SKILLS.includes(skill)?scenario==='fast'?2:1:0))]));
}
export function courseMatches(c:{setting:string;online:boolean;cost:number;hrdc:boolean;delivery?:string;hrdcVerifiedUrl?:string},pref:Preferences){
 const delivery=c.delivery??(c.online?'online':'in-person');
 return (pref.setting==='either'||pref.setting===c.setting)&&(!pref.onlineOnly||delivery==='online')&&(!pref.delivery||pref.delivery==='any'||pref.delivery===delivery)&&(pref.cost!=='free'||c.cost===0)&&(pref.cost!=='low'||c.cost<=200)&&(pref.cost!=='moderate'||c.cost<=500)&&(pref.cost!=='hrdc'||(c.hrdc&&Boolean(c.hrdcVerifiedUrl)));
}
export function candidates(catalogue: Catalogue, profile: ProfileInput, pref: Preferences) {
  const match = rank(profile,catalogue).find(m => m.careerId === pref.target);
  const role = catalogue.careers.find(r => r.id === pref.target);
  if (!match || !role) throw new Error('Choose a career from the current catalogue.');
  const required=scenarioRequirements(role.required,pref.futureScenario);
  const gaps=Object.entries(required).map(([skill,need])=>({skill,need,have:profile.skills[skill]??0})).filter(g=>g.have<g.need).sort((a,b)=>(b.need-b.have)-(a.need-a.have));
  const selected = [...new Set(pref.mode === 'recommended' ? gaps.map(g=>g.skill) : pref.skills)];
  const vocabulary = new Set(catalogue.careers.flatMap(r=>Object.keys(r.required)));
  if (selected.some(s=>!vocabulary.has(s))) throw new Error('Selected skill is not in the catalogue.');
  const pool = catalogue.courses.filter(c=>courseMatches(c,pref));
  const modules = new Map<string, {course: Course; skills: string[]}>();
  const missing: string[] = [];
  for (const skill of selected) {
    const course = pool.filter(c=>c.skills.includes(skill)).sort((a,b)=>a.cost-b.cost || b.rating-a.rating || a.id.localeCompare(b.id))[0];
    if (!course) { missing.push(skill); continue; }
    const entry = modules.get(course.id) ?? {course,skills:[]}; entry.skills.push(skill); modules.set(course.id,entry);
  }
  return {match:{...match,gaps},role:{...role,required},selected,modules:[...modules.values()],missing};
}
export function activities(course: Course) {
  return [{id:'foundations',title:'Core concepts',w:.25},{id:'practice',title:'Guided practice exercises',w:.3},{id:'project',title:'Mini project applying the skill',w:.3},{id:'assess',title:'Self-assessment and reflection',w:.15}].map(a=>({id:a.id,title:a.title,hours:Math.round(course.hours*a.w*100)/100}));
}
function text(value: unknown, max = 1200): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error('AI returned an invalid explanation. Please retry.');
  // Facts and references are rendered from the catalogue, never model text.
  if (/https?:|www\.|\b(?:salary|salaries|guarantee[ds]?|2030|forecast|jobstreet|linkedin|coursera|udemy)\b|(?:RM|USD|MYR|\$)\s*\d/i.test(value)) throw new Error('AI returned unsupported claims or external resources. Please retry.');
  return value.trim();
}
export function validateExplanation(raw: unknown, matches: Match[]): Explanation[] {
  object(raw);
  if (!Array.isArray(raw.explanations) || raw.explanations.length !== matches.length) throw new Error('AI omitted a requested career explanation.');
  const ids = new Set<string>();
  return raw.explanations.map(v=> {
    object(v);
    if (typeof v.careerId !== 'string' || !matches.some(m=>m.careerId===v.careerId) || ids.has(v.careerId)) throw new Error('AI returned an unknown or duplicate career.');
    ids.add(v.careerId);
    if (!Array.isArray(v.actions)||v.actions.length<1||v.actions.length>4) throw new Error('AI returned invalid actions.');
    return {careerId:v.careerId,fitSummary:text(v.fitSummary),actions:v.actions.map(x=>text(x,400))};
  });
}
export function organise(raw: unknown, selection: ReturnType<typeof candidates>, minutes: number): PlanResult {
  object(raw);
  if (!Array.isArray(raw.modules)||raw.modules.length!==selection.modules.length) throw new Error('AI omitted a required course.');
  const used = new Set<string>();
  const modules = raw.modules.map(v=> {
    object(v); const found = selection.modules.find(m=>m.course.id===v.courseId);
    if (!found || used.has(found.course.id)) throw new Error('AI invented or duplicated a course.');
    used.add(found.course.id); const c=found.course;
    return {courseId:c.id,courseVersion:c.version,title:c.title,provider:c.provider,skills:found.skills,hours:c.hours,cost:c.cost,weeks:Math.ceil(c.hours*60/minutes/7),why:text(v.why,700),activities:activities(c)};
  });
  const totalHours = modules.reduce((n,m)=>n+m.hours,0);
  return {overview:text(raw.overview),modules,missing:selection.missing,totalHours,totalCost:modules.reduce((n,m)=>n+m.cost,0),totalWeeks:Math.ceil(totalHours*60/minutes/7)};
}
export function completionKey(courseId: string, version: string, activityId: string) { return `${courseId}:${version}:${activityId}`; }
export function progressFor(plan: PlanResult, completed: Set<string>) {
  const doneHours = Math.round(plan.modules.reduce((n,m)=>n+m.activities.filter(a=>completed.has(completionKey(m.courseId,m.courseVersion,a.id))).reduce((h,a)=>h+a.hours,0),0)*100)/100;
  return {doneHours,totalHours:plan.totalHours,percent:plan.totalHours?Math.min(100,Math.round(doneHours/plan.totalHours*100)):0};
}
