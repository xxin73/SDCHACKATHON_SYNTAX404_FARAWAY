import {useSyncExternalStore,type ReactNode} from 'react';
import reviewed from './translations.json';
import templates from './translation-patterns.json';
export type Language='en'|'zh'|'ms';
const KEY='faraway_language_v1';
export const languageTag:Record<Language,string>={en:'en',zh:'zh-Hans',ms:'ms'};
const supported=(value:unknown):value is Language=>value==='en'||value==='zh'||value==='ms';
let language:Language='en',busy=false,error='',revision=0,request=0;
const listeners=new Set<()=>void>();
const dictionaries:Partial<Record<Language,Record<string,string>>>={en:{}};
const outputs:Partial<Record<Language,Set<string>>>={};
const folded:Partial<Record<Language,Map<string,string>>>={};
const protectedNames=new Set(['Faraway','FARAWAY','Python','SQL','JavaScript','TypeScript','Java','C++','C#','HTML','CSS','React','Node.js','Git','DevOps','Excel','Microsoft Learn','Azure','Power BI','TensorFlow','PyTorch','Docker','Kubernetes','O*NET','BLS','DOSM','ESCO','TVET','arXiv']);
const notify=()=>{revision++;listeners.forEach(fn=>fn());};
function updateDocument(){if(typeof document!=='undefined')document.documentElement.lang=languageTag[language];}
async function load(next:Language){
 if(dictionaries[next])return;
 const module=next==='zh'?await import('./locales/zh.json'):await import('./locales/ms.json');
 const complete={...module.default} as Record<string,string>;
 for(const [source,value] of Object.entries(reviewed))complete[source]=value[next as 'zh'|'ms'];
 dictionaries[next]=complete;outputs[next]=new Set(Object.values(complete));
 folded[next]=new Map(Object.entries(complete).map(([key,value])=>[key.toLowerCase(),value]));for(const [key,value]of Object.entries(reviewed))folded[next]!.set(key.toLowerCase(),value[next as 'zh'|'ms']);
}
export async function setLanguage(next:Language){
 if(!supported(next))return;
 const current=++request;busy=true;error='';notify();
 try{
  await load(next);if(current!==request)return;
  language=next;try{localStorage.setItem(KEY,next);}catch{}
  updateDocument();
  if(typeof document!=='undefined'&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.remove('language-enter');requestAnimationFrame(()=>{document.documentElement.classList.add('language-enter');setTimeout(()=>document.documentElement.classList.remove('language-enter'),350);});}
 }catch{if(current===request)error=next==='zh'?'暂时无法加载语言资源，请重试。':next==='ms'?'Sumber bahasa tidak dapat dimuatkan. Sila cuba semula.':'Language resources could not be loaded. Please retry.';}
 finally{if(current===request){busy=false;notify();}}
}
export async function initializeLanguage(){let preferred:Language='en';try{const value=localStorage.getItem(KEY);if(supported(value))preferred=value;}catch{}await setLanguage(preferred);if(error)throw Error(error);}
if(typeof window!=='undefined')window.addEventListener('storage',event=>{if(event.key===KEY&&supported(event.newValue))void setLanguage(event.newValue);});
const subscribe=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function useLanguage(){useSyncExternalStore(subscribe,()=>revision,()=>revision);return language;}
export function useLanguageStatus(){useLanguage();return {busy,error};}
export const getLanguage=()=>language;
const escape=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const patterns=templates.map(parts=>({parts,regex:new RegExp('^'+parts.map(escape).join('(.*?)')+'$','s')}));
function translated(text:string,depth=0):string{
 if(language==='en'||!text||protectedNames.has(text)||outputs[language]?.has(text)||/^https?:\/\//.test(text)||/\.(?:pdf|docx?|xlsx?|csv|json|png|jpe?g|webp)$/i.test(text))return text;
 const dictionary=dictionaries[language]??{};
 const source=text.replace(/\s+/g,' ').trim();
 const direct=(Object.hasOwn(dictionary,text)?dictionary[text]:undefined)??(Object.hasOwn(dictionary,source)?dictionary[source]:undefined)??folded[language]?.get(source.toLowerCase());if(direct)return text.startsWith(' ')?' '+direct+(text.endsWith(' ')?' ':''):direct+(text.endsWith(' ')?' ':'');
 if(depth<3){
  for(const {parts,regex} of patterns){const match=regex.exec(text);if(!match)continue;let result='';for(let i=0;i<parts.length;i++){result+=translated(parts[i],depth+1);if(i<match.length-1)result+=translated(match[i+1],depth+1);}if(result!==text)return result;}
  const pieces=text.split(/(\s*[·→|]\s*|\n|,\s+|\b\d+(?:\.\d+)?\b)/);if(pieces.length>1){const result=pieces.map(piece=>translated(piece,depth+1)).join('');if(result!==text)return result;}
 }
 return text;
}
export function t(text:string):string;
export function t<T>(text:T):T;
export function t(text:unknown):unknown{return typeof text==='string'?translated(text):text;}
/** Only rendered text is localized. React nodes, form values, identifiers and calculations retain their original identity. */
export function ui(value:ReactNode):ReactNode{return typeof value==='string'?translated(value):Array.isArray(value)?value.map(ui):value;}
export function formatText(template:string,values:Record<string,string|number>){let text=t(template);for(const [key,value] of Object.entries(values))text=text.replaceAll('{'+key+'}',String(value));return text;}
