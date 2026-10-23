import expanded from '@/data/expanded-catalogue.json';
import {loadObservations} from './market-data';
import {observationsForRole} from '../../../../supabase/functions/faraway-recommendations/trends';
import {enrichCatalogue,PATHWAY_VERSION} from '../../../../supabase/functions/faraway-recommendations/pathways';
import {CALCULATION_VERSION} from '../../../../supabase/functions/faraway-recommendations/core';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { requireSupabase } from './supabase';
import { getState, setState } from './store';
import { CAREERS, syncInterestCatalogue, type Career } from '@/data/careers';
import { COURSES, type Course } from '@/data/courses';
import { setDatabaseCatalogue } from './catalogue-status';
import { completionKey, digest, preferences, profileInput, type Catalogue, type Generated, type Module } from '../../../../supabase/functions/faraway-recommendations/core';

export type Run = {id:string;kind:'explain'|'plan';result:Generated};
type Context = {ready:boolean;error:string;catalogue:Catalogue|null;runs:Run[];active:Run|null;completed:Set<string>;reload:()=>Promise<void>;generate:(kind:'explain'|'plan',careerId?:string,careerIds?:string[])=>Promise<Run>;activate:(run:Run)=>Promise<void>;tick:(module:Module,activityId:string)=>Promise<void>};
const Context = createContext<Context|null>(null);
const originalCareers=structuredClone(CAREERS),originalCourses=structuredClone(COURSES);
function replaceCatalogue(catalogue:Catalogue|null) {
  CAREERS.splice(0,CAREERS.length,...(catalogue?[...catalogue.careers,...expanded.careers.filter(c=>!catalogue.careers.some(old=>old.id===c.id||old.title.toLowerCase()===c.title.toLowerCase()))] as Career[]:originalCareers));
  COURSES.splice(0,COURSES.length,...(catalogue?[...catalogue.courses,...expanded.courses.filter(c=>!catalogue.courses.some(old=>old.id===c.id))] as unknown as Course[]:originalCourses));
  syncInterestCatalogue();
  setDatabaseCatalogue(Boolean(catalogue));
}
export function RecommendationProvider({children}:{children:ReactNode}) {
  const auth=useAuth(); const userId=auth.user?.id;
  const generation=useRef(0);
  const [ready,setReady]=useState(false),[error,setError]=useState('');
  const [catalogue,setCatalogue]=useState<Catalogue|null>(null),[runs,setRuns]=useState<Run[]>([]),[active,setActive]=useState<Run|null>(null),[completed,setCompleted]=useState(new Set<string>());
  const reload=async()=> {
    const current=++generation.current;
    if(!userId){replaceCatalogue(null);setReady(true);setError('');setCatalogue(null);setRuns([]);setActive(null);setCompleted(new Set());return;}
    setReady(false);setError('');
    try {
      const db=requireSupabase();
      const results=await Promise.all([
        db.from('recommendation_catalogues').select('*').eq('is_current',true).single(),
        db.from('recommendation_runs').select('id,kind,result').eq('status','complete').order('started_at',{ascending:false}).limit(50),
        db.from('active_learning_plans').select('run_id').maybeSingle(),
        db.from('learning_completions').select('*'),
      ]);
      if(current!==generation.current)return;
      for(const r of results)if(r.error)throw r.error;
      const row=results[0].data!;
      const cat={...row.payload,version:row.version,published_at:row.published_at,observed_at:row.observed_at,status:row.status} as Catalogue;
      if(!cat.careers?.length||!cat.courses?.length)throw new Error('The practice catalogue is empty.');
      const found=results[1].data as Run[];
      let selected=found.find(r=>r.id===results[2].data?.run_id)??null;
      if(!selected&&results[2].data?.run_id){const extra=await db.from('recommendation_runs').select('id,kind,result').eq('id',results[2].data.run_id).single();if(extra.error)throw extra.error;selected=extra.data as Run;}
      if(current!==generation.current)return;
      replaceCatalogue(cat);setCatalogue(cat);setRuns(found);setActive(selected);
      setCompleted(new Set(results[3].data!.filter(r=>r.completed).map(r=>completionKey(r.course_id,r.course_version,r.activity_id))));
      // Children mount only after the authoritative catalogue has loaded.
      setReady(true);
    } catch(e){if(current===generation.current)setError(`Recommendation setup is unavailable: ${e instanceof Error?e.message:'database request failed'}. Apply 002_ai_recommendations.sql, then retry.`);}
  };
  useEffect(()=>{void reload();return()=>{generation.current++;replaceCatalogue(null);};},[userId]);
  const generate=async(kind:'explain'|'plan',careerId?:string,careerIds?:string[])=> {
    if(!userId)throw new Error('Sign in with an individual account to use real AI. Demo output is not substituted.');
    const current=generation.current;
    await auth.flush();
    const state=getState();
    if(state.session?.id!==userId)throw new Error('Your account changed. Sign in again.');
    const p=profileInput(state.profile),pref=preferences(state.plan);
    const profileHash=await digest(p),preferencesHash=await digest(pref);
    const role=CAREERS.find(r=>r.id===careerId);
    const marketObservations=(careerIds?loadObservations().filter(r=>CAREERS.filter(c=>careerIds.includes(c.id)).some(c=>observationsForRole(c,[r]).length>0)):role?observationsForRole(role,loadObservations()):[]).slice(0,40);
    const {data,error}=await requireSupabase().functions.invoke('faraway-recommendations',{body:{kind,careerId,profileHash,preferencesHash,pathwayVersion:PATHWAY_VERSION,scenario:state.scenario,marketObservations,...(careerIds?{careerIds}:{})}});
    if(error){let detail='';try{detail=(await error.context?.json())?.error??'';}catch{}throw new Error(detail==='Invalid recommendation request.'?'The AI server needs the latest occupation-pathway update. Deploy the updated faraway-recommendations function, then retry.':detail||'AI function unavailable. Deploy faraway-recommendations and check the server secrets.');}
    if(data?.error)throw new Error(data.error);
    if(current!==generation.current||getState().session?.id!==userId)throw new Error('Your account changed during generation.');
    if(await digest(profileInput(getState().profile))!==profileHash || (kind==='plan'&&await digest(preferences(getState().plan))!==preferencesHash))throw new Error('Your inputs changed. Confirm them and generate again.');
    if(kind==='explain'&&getState().scenario!==state.scenario)throw new Error('Your chart scenario changed. Generate its explanation again.');
    const run=data.run as Run;
    if(run?.result?.meta.calculationVersion!==CALCULATION_VERSION||run?.result?.meta.pathwayVersion!==PATHWAY_VERSION)throw new Error('The AI server needs the latest occupation-pathway update. Deploy the updated faraway-recommendations function, then retry. Your saved plan is unchanged.');
    if(!run?.id||run.result?.meta.profileHash!==profileHash||run.result?.meta.catalogueVersion!==catalogue?.version)throw new Error('AI returned a different data version. Reload before continuing.');
    setRuns(before=>[run,...before.filter(r=>r.id!==run.id)]);
    return run;
  };
  const activate=async(run:Run)=> {
    const current=generation.current;
    await auth.flush();
    if(getState().session?.id!==userId)throw new Error('Your account changed. Sign in again.');
    const {error}=await requireSupabase().rpc('activate_learning_plan',{p_run_id:run.id});
    if(error)throw new Error(error.message);
    if(current!==generation.current||getState().session?.id!==userId)throw new Error('Your account changed during activation.');
    // Migrate legacy completed activities without resetting any history.
    const state=getState();
    const legacy: {user_id:string|undefined;course_id:string;course_version:string;activity_id:string;completed:boolean}[]=[];
    for(const module of run.result.plan?.modules??[]) for(const activity of module.activities) {
      if(Object.entries(state.progress).some(([key,done])=>key.endsWith(':'+module.courseId)&&done.includes(activity.id)) && !completed.has(completionKey(module.courseId,module.courseVersion,activity.id))) legacy.push({user_id:userId,course_id:module.courseId,course_version:module.courseVersion,activity_id:activity.id,completed:true});
    }
    if(legacy.length){const {error}=await requireSupabase().from('learning_completions').upsert(legacy);if(error)throw new Error('The plan was activated, but existing completion history could not be migrated. Retry Save plan.');if(current!==generation.current)throw new Error('Your account changed during activation.');setCompleted(before=>new Set([...before,...legacy.map(r=>completionKey(r.course_id,r.course_version,r.activity_id))]));}
    if(current!==generation.current||getState().session?.id!==userId)throw new Error('Your account changed during activation.');
    setActive(run);
    setState(s=>({...s,plan:{...s.plan,saved:true}}));
  };
  const tick=async(module:Module,activityId:string)=> {
    if(!module.activities.some(a=>a.id===activityId)||!active?.result.plan?.modules.some(m=>m.courseId===module.courseId&&m.courseVersion===module.courseVersion))throw new Error('Activity is not in your saved plan.');
    const current=generation.current;
    const key=completionKey(module.courseId,module.courseVersion,activityId),next=!completed.has(key);
    const {error}=await requireSupabase().from('learning_completions').upsert({user_id:userId,course_id:module.courseId,course_version:module.courseVersion,activity_id:activityId,completed:next,updated_at:new Date().toISOString()});
    if(error)throw new Error('Completion was not saved. Please retry.');
    if(current===generation.current)setCompleted(before=>{const copy=new Set(before);if(next)copy.add(key);else copy.delete(key);return copy;});
  };
  return <Context.Provider value={{ready,error,catalogue,runs,active,completed,reload,generate,activate,tick}}>{children}</Context.Provider>;
}
export function useRecommendations(){const value=useContext(Context);if(!value)throw new Error('RecommendationProvider is required');return value;}
