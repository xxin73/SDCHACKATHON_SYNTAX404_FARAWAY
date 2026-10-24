import {t as localeLabel,ui as localeText} from '@/lib/i18n';
import {t as translateUi,useLanguage} from '@/lib/i18n';
import {useState,useId} from 'react';
import {SDGS} from '@/data/careers';
import {skillSdg} from './bits';
import {hexagonPages,chartSegments,radarWedges,type RadarValue} from '@/lib/radar-model';
export type RadarAxis=RadarValue;
export function SkillRadar({axes,size=360,showSdg,onHover,hovered,compact,translucentFill=false,uniqueWedgeColors=false}:{axes:RadarAxis[];size?:number;showSdg?:boolean;onHover?:(skill:string|null)=>void;hovered?:string|null;compact?:boolean;translucentFill?:boolean;uniqueWedgeColors?:boolean}){
  useLanguage();
 const [page,setPage]=useState(0),id=useId().replace(/:/g,'');const pages=hexagonPages(axes),active=Math.min(page,pages.length-1),slots=pages[active],n=6,c=size/2,R=c-(compact?55:84);const pt=(i:number,v:number)=>{const a=-Math.PI/2+i/n*Math.PI*2;return [c+Math.cos(a)*R*v/5,c+Math.sin(a)*R*v/5];};const points=(values:number[])=>values.map((v,i)=>pt(i,v).join(',')).join(' ');
 const wedges=radarWedges(slots);
 const wedgePath=(index:number,next:number)=>{
   const start=pt(index,20),end=pt(next,20),steps=(next-index+n)%n;
   return `M ${c} ${c} L ${start.join(' ')} A ${R*4} ${R*4} 0 ${steps>n/2?1:0} 1 ${end.join(' ')} Z`;
 };
 const dataPolygons=[slots.map(a=>a.need),slots.map(a=>a.future),slots.map(a=>a.have)]
   .map(values=>values.flatMap((v,i)=>v==null?[]:[pt(i,v).join(',')]))
   .filter(vertices=>vertices.length>=3);
 // Draw each wedge only once. The union clip retains every data polygon's
 // footprint without stacking the same translucent fill for each dataset.
 const wedgeBackground=translucentFill&&uniqueWedgeColors&&dataPolygons.length>0&&
   <g pointerEvents="none" aria-hidden="true" data-radar-wedge-layer="true">
     <defs>
       <clipPath id={`rad-wedges-${id}-clip`}>{dataPolygons.map((vertices,i)=><polygon key={i} points={vertices.join(' ')}/>)}</clipPath>
       {wedges.map(wedge=><linearGradient key={wedge.index} id={`rad-wedge-${id}-${wedge.index}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={wedge.color} stopOpacity=".28"/><stop offset="1" stopColor={wedge.color} stopOpacity=".16"/></linearGradient>)}
     </defs>
     <g clipPath={`url(#rad-wedges-${id}-clip)`}>{wedges.map(wedge=><path key={wedge.index} data-radar-wedge={wedge.index} data-wedge-color={wedge.color} d={wedgePath(wedge.index,wedge.next)} fill={`url(#rad-wedge-${id}-${wedge.index})`} stroke="none"/>)}</g>
   </g>;
 const shape=(values:(number|null|undefined)[],color:string,fill:string,dashed=false)=>{
   const assessed=values.flatMap((v,i)=>v==null?[]:[pt(i,v).join(',')]);
   const gradientId=`rad-fill-${id}-${color.slice(1)}`;
   return <g>
     {translucentFill&&!uniqueWedgeColors&&assessed.length>=3&&<g pointerEvents="none" aria-hidden="true">
         <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor={color} stopOpacity=".28"/><stop offset="1" stopColor={color} stopOpacity=".16"/></linearGradient></defs>
         <polygon points={assessed.join(' ')} fill={`url(#${gradientId})`} stroke="none"/>
     </g>}
     {values.every(v=>v!=null)?<polygon points={points(values as number[])} fill={translucentFill?'none':fill} stroke={color} strokeWidth={2} strokeDasharray={dashed?'5 4':undefined}/>:<g>{chartSegments(values).filter(a=>a.length>1).map((indices,i)=><polyline key={i} points={indices.map(j=>pt(j,values[j]!).join(',')).join(' ')} fill="none" stroke={color} strokeWidth={2} strokeDasharray={dashed?'5 4':undefined}/>)}</g>}
   </g>;
 };
 return <div className="min-w-0"><svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full" role="img" aria-label={localeLabel("Six-axis skill hexagon; unassessed skills are N/A")} data-testid="chart-radar"><defs><linearGradient id={'rad-'+id}><stop stopColor="#7aa7ff" stopOpacity=".4"/><stop offset="1" stopColor="#ff8fc7" stopOpacity=".35"/></linearGradient></defs>{[5,4,3,2,1].map(l=><polygon key={l} points={points(Array(6).fill(l))} fill={l===5?'hsl(232 60% 98.5%)':'none'} stroke="hsl(232 35% 88%)"/>)}{wedgeBackground}{slots.map((a,i)=>{const [x,y]=pt(i,5);return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="hsl(232 35% 90%)"/>;})}{localeText(shape(slots.map(a=>a.need),'#dda341','rgba(221,163,65,.07)',true))}{localeText(shape(slots.map(a=>a.future),'#824bdc','rgba(130,75,220,.05)',true))}{localeText(shape(slots.map(a=>a.have),'#9a6bff',`url(#rad-${id})`))}{slots.map((a,i)=>{const [x,y]=pt(i,6.35);const anchor='middle' as const;const hot=hovered===a.skill,sdg=SDGS[skillSdg(a.skill)];const have=a.have;const [px,py]=pt(i,have??0);return <g key={i}><g transform={`translate(${x},${y})`} role={onHover&&!a.placeholder?'button':undefined} tabIndex={onHover&&!a.placeholder?0:undefined} onFocus={()=>!a.placeholder&&onHover?.(a.skill)} onClick={()=>!a.placeholder&&onHover?.(a.skill)} onMouseEnter={()=>!a.placeholder&&onHover?.(a.skill)} data-testid={a.placeholder?undefined:`radar-point-${a.skill.replace(/\W/g,'')}`}><text textAnchor={anchor} fontSize={compact?9:10} fill={a.placeholder?'#9ca3af':hot?'#824bdc':'#333'} fontWeight={hot?600:500}>{localeText(a.skill.length>20?a.skill.slice(0,18)+'…':a.skill)}<title>{localeText(a.skill)}</title></text><text textAnchor={anchor} y={14} fontSize={9} fill="#777">{localeText(have===null?'N/A':`${Number(have.toFixed(1))}/5`)}</text>{showSdg&&!a.placeholder&&sdg&&<text textAnchor={anchor} y={27} fontSize={9} fill={sdg.color}>{localeLabel("SDG")}{' '}{localeText(sdg.n)}</text>}</g>{have!==null&&<circle cx={px} cy={py} r={hot?6:3.5} fill="#fff" stroke="#9a6bff" strokeWidth={2}/>}</g>;})}</svg><p className="text-center text-[10px] text-muted-foreground">{localeText("N/A means unassessed or an unused axis, not zero. Only assessed points are drawn.")}</p>{pages.length>1&&<div className="mt-3 flex items-center justify-center gap-3 text-xs"><button className="underline" disabled={active===0} onClick={()=>setPage(active-1)}>{localeLabel("Previous skills")}</button><span>{localeText(active+1)}/{localeText(pages.length)} · {localeText(axes.length)}{' '}{localeLabel("skills")}</span><button className="underline" disabled={active===pages.length-1} onClick={()=>setPage(active+1)}>{translateUi("More skills")}</button></div>}</div>;
}
export function RadarLegend({withNeed}:{withNeed?:boolean}){
  useLanguage();return <div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>{localeText("● Assessed level")}</span>{withNeed&&<><span className="text-amber-600">{localeLabel("┄ Role requirement")}</span><span className="text-violet-600">{localeLabel("┄ Future scenario")}</span></>}</div>;}
