import {Globe} from 'lucide-react';
import {t,useLanguage,setLanguage,type Language} from '@/lib/i18n';
export function LanguageSelector(){
 const language=useLanguage();
 return <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-3 z-50 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-full border bg-white/95 px-3 py-2 shadow-lg backdrop-blur md:bottom-5 md:right-5" title={t('Saved AI explanations and external source titles remain in their original language.')}>
 <Globe className="h-4 w-4 shrink-0" aria-hidden="true"/><label className="sr-only" htmlFor="faraway-language">{t('Interface language')}</label>
 <select id="faraway-language" data-testid="language-selector" aria-label={t('Interface language')} value={language} onChange={event=>setLanguage(event.target.value as Language)} className="max-w-[145px] rounded-lg bg-transparent py-1 text-sm outline-offset-2">
 <option value="en" lang="en">English</option><option value="zh" lang="zh-Hans">中文</option><option value="ms" lang="ms">Bahasa Melayu</option>
 </select></div>;
}
