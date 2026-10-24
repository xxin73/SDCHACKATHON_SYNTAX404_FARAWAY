import {useId} from 'react';
import {type Scenario} from '@/data/careers';
import {t,useLanguage} from '@/lib/i18n';

export function AiScenarioControl({value,onChange,compact=true}:{value:Scenario;onChange:(value:Scenario)=>void;compact?:boolean}){
 useLanguage();const description=useId();
 return <div className="flex max-w-sm flex-col items-start gap-1.5">
  <div role="group" aria-label={t('AI adoption scenario')} aria-describedby={description} className="inline-flex rounded-full border bg-white/80 p-1 shadow-sm backdrop-blur">
   {(['moderate','fast'] as const).map(option=><button type="button" key={option} aria-pressed={value===option} data-testid={`toggle-scenario-${option}`} onClick={()=>onChange(option)} className={'rounded-full font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 '+(compact?'px-3 py-1 text-xs ':'px-4 py-1.5 text-sm ')+(value===option?'bg-ink text-white':'text-muted-foreground hover:text-foreground')}>{t(option==='fast'?'Rapid AI':'Moderate AI')}</button>)}
  </div>
  <p id={description} aria-live="polite" className="text-[11px] leading-relaxed text-muted-foreground">{t(value==='fast'?'Faster AI adoption: future skills rise by up to 2 levels.':'Gradual AI adoption: future skills rise by up to 1 level.')} <span>{t('Planning assumptions, not forecasts.')}</span></p>
 </div>;
}
