export interface RadarValue {skill:string;have:number|null;need?:number;future?:number;placeholder?:boolean}
// Span Faraway's full pastel spectrum; never cycle a fixed palette.
export function radarSegmentColors(count:number):string[]{
  if(!Number.isSafeInteger(count)||count<0)throw new RangeError('Segment count must be a non-negative safe integer.');
  return Array.from({length:count},(_,i)=>`hsl(${(210+360*i/Math.max(1,count))%360} 65% 64%)`);
}
export function radarWedges(axes:RadarValue[]){
  const indices=axes.flatMap((axis,i)=>axis.placeholder?[]:[i]);
  const colors=radarSegmentColors(indices.length);
  return indices.map((index,i)=>({index,next:indices[(i+1)%indices.length],color:colors[i]}));
}
export function hexagonPages(axes:RadarValue[]){const pages:RadarValue[][]=[];for(let offset=0;offset<Math.max(1,axes.length);offset+=6){const page=axes.slice(offset,offset+6);while(page.length<6)page.push({skill:'N/A',have:null,placeholder:true});pages.push(page);}return pages;}
export function chartSegments(values:(number|null|undefined)[]){const segments:number[][]=[];let active:number[]=[];values.forEach((v,i)=>{if(v===null||v===undefined){if(active.length)segments.push(active);active=[];}else active.push(i);});if(active.length)segments.push(active);if(segments.length>1&&values[0]!=null&&values[values.length-1]!=null){segments[0]=[...segments.pop()!,...segments[0]];}return segments;}
import {skillKey,skillRating} from '../../../../supabase/functions/faraway-recommendations/skill-policy';
export function jobRadarAxes(required:Record<string,number>,ratings:Record<string,number>,future?:Record<string,number>):RadarValue[]{const labels=new Map<string,string>();for(const s of [...Object.keys(required),...Object.keys(ratings)])if(!labels.has(skillKey(s)))labels.set(skillKey(s),s);return [...labels.values()].map(skill=>{const source=Object.keys(required).find(s=>skillKey(s)===skillKey(skill));return {skill,have:skillRating(ratings,skill)??null,...(source?{need:required[source],future:future?.[source]}:{})};});}
