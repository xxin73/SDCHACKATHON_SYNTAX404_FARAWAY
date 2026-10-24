import {useSyncExternalStore} from 'react';
import translations from './translations.json';
export type Language='en'|'zh'|'ms';
const KEY='faraway_language_v1';
export const languageTag:Record<Language,string>={en:'en',zh:'zh-Hans',ms:'ms'};
const supported=(value:unknown):value is Language=>value==='en'||value==='zh'||value==='ms';
let language:Language='en';
try{const value=localStorage.getItem(KEY);if(supported(value))language=value;}catch{}
const listeners=new Set<()=>void>();
function updateDocument(){if(typeof document!=='undefined')document.documentElement.lang=languageTag[language];}
updateDocument();
export function setLanguage(next:Language){
 if(!supported(next)||language===next)return;
 language=next;try{localStorage.setItem(KEY,next);}catch{}
 updateDocument();listeners.forEach(listener=>listener());
}
if(typeof window!=='undefined')window.addEventListener('storage',event=>{if(event.key===KEY&&supported(event.newValue)){language=event.newValue;updateDocument();listeners.forEach(listener=>listener());}});
export function useLanguage(){return useSyncExternalStore(listener=>{listeners.add(listener);return()=>{listeners.delete(listener);};},()=>language,()=>language);}
/** Translate presentation text only. Original form values and catalogue IDs stay canonical. */
export function t(text:string):string{
 if(language==='en')return text;
 return (translations as Record<string,{zh:string;ms:string}>)[text]?.[language]??text;
}
