import {Link} from 'wouter';
import {Card,CardTitle} from './bits';
import {useTrendEvidence,marketOutlook,planNeedsReview,markPlanEvidence} from '@/lib/live-trends';
import {useStore,setState} from '@/lib/store';
import {useRecommendations} from '@/lib/recommendations';
import {careerById,type Career} from '@/data/careers';
export function TrendUpdates(){
 const {evidence:e}=useTrendEvidence();
 return <Card><CardTitle eyebrow="Sources & dates" title="Evidence behind your next step"/>
 <p className="text-sm text-muted-foreground">Charts and opportunity rankings use the published evidence snapshot. Sources are refreshed by the scheduled daily workflow.</p>
 <p className="mt-3 text-xs">Snapshot checked: {e?new Date(e.checkedAt).toLocaleString():'dated bundled baseline'}</p>
 <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
 <p><a className="underline" href="https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm" target="_blank" rel="noreferrer">BLS employment outlook</a>: {e?.bls.data?`${e.bls.data.baseYear}–${e.bls.data.futureYear}, ${Object.keys(e.bls.data.occupations).length} occupations`:'dated 2025–2035 bundled snapshot'}. {e?.bls.lastCheckFailed?`Cached source retrieval: ${new Date(e.bls.lastSuccessAt??e.checkedAt).toLocaleString()}. `:''}United States; occupational analogues, not Malaysian vacancies.</p>
 <p><a className="underline" href="https://open.dosm.gov.my/data-catalogue/lfs_month" target="_blank" rel="noreferrer">DOSM labour-force context</a>: {e?.dosm.data?`${e.dosm.data.period.slice(0,7)} · unemployment ${e.dosm.data.unemployment}%`:'unavailable from update service'}. National context does not change individual-role scores. The separate DOSM job-offering group chart remains a reviewed quarterly snapshot.</p>
 <p><a className="underline" href="https://www.onetcenter.org/db_releases.html" target="_blank" rel="noreferrer">O*NET release check</a>: {e?.onet.data?`${e.onet.data.version}, ${e.onet.data.released}`:'release check unavailable'}. Imported skill charts still use releases 30.3 and 31.0; a new release needs a reviewed skill import.</p>
 <p><a className="underline" href="https://arxiv.org/list/cs.AI/recent" target="_blank" rel="noreferrer">arXiv AI/ML research</a>: {e?.research.data?.[0]?.publishedAt??'feed unavailable'}. Research signals are context, not peer-reviewed proof or job forecasts.</p>
 </div>
 {e?.research.data?.length?<details className="mt-4 text-sm"><summary className="cursor-pointer underline">Recent AI research signals and publication dates</summary><ul className="mt-3 space-y-2">{e.research.data.slice(0,5).map(p=><li key={p.url}><a href={p.url} target="_blank" rel="noreferrer" className="underline">{p.title}</a><span className="ml-2 text-xs">{p.publishedAt}</span></li>)}</ul></details>:null}
 </Card>;
}
export function MatchScoreDetails({career,readiness}:{career:Career;readiness:number}){
 useTrendEvidence();const m=marketOutlook(career);
 return <details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">How this match score is calculated</summary><p className="mt-2">60% scenario skill readiness ({(readiness*100).toFixed(1)}%) + 20% interest + 10% experience + 10% employment outlook. Product weights are planning choices, not validated predictions.</p>{m?<><p className="mt-2">BLS {m.row.title} · SOC {m.soc}: {m.row.first.toLocaleString()} → {m.row.second.toLocaleString()} thousand employed ({m.baseYear}–{m.futureYear}), {m.growth>=0?'+':''}{m.growth.toFixed(1)}% baseline change. US occupation analogue.</p><p className="mt-2">Market index = clamp(50 + 2 × baseline growth %, 0, 100) = {m.index.toFixed(1)}. AI scenarios change readiness targets, not official BLS growth.</p><a href={m.url} className="mt-2 inline-block underline" target="_blank" rel="noreferrer">Source table and data period</a></>:<p className="mt-2">No BLS occupation mapping. Market evidence is unavailable; the other 90% is rescaled to 100%. This does not imply zero demand.</p>}</details>;
}
export function PlanEvidenceNotice(){
 const {evidence}=useTrendEvidence();const context=useRecommendations();const session=useStore(s=>s.session);const scenario=useStore(s=>s.scenario);const plan=useStore(s=>s.plan);
 const active=context.active;const role=careerById(active?.result.careerId??plan.target);
 if(!session?.id||!active||!role)return null;
 const status=planNeedsReview(session.id,active.id,role);
 if(!status.review)return <p className="text-xs text-muted-foreground">Your active plan was reviewed against the employment outlook currently available in this browser. Last source check: {evidence?new Date(evidence.checkedAt).toLocaleString():'bundled snapshot'}.</p>;
 return <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm"><p className="font-medium">{status.known?'Employment outlook changed — review your learning plan':'Review your saved plan against current evidence'}</p><p className="mt-2">{status.known?'The source employment figures for your target occupation differ from those used at your last review.':'This plan has no evidence review recorded in this browser.'} Check the new outlook and skill gaps before deciding whether to generate a new plan. Employment growth alone does not establish new skill requirements. Completed learning stays recorded.</p><div className="mt-3 flex flex-wrap gap-3"><Link href="/plan" className="underline" onClick={()=>setState(s=>({...s,plan:{...s.plan,futureScenario:scenario,saved:false}}))}>Review gaps and update plan</Link><button className="underline" onClick={()=>{markPlanEvidence(session.id!,active.id,role);setState(s=>({...s,plan:{...s.plan}}));}}>Reviewed — keep this plan</button></div></div>;
}
