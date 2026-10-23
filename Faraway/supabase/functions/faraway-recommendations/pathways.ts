// @ts-ignore Deno's Edge runtime requires an explicit TypeScript extension.
import { PATHWAY_DATA } from './pathway-data.ts';
import type {Catalogue,Role,Course,ProfileInput} from './core';
export const PATHWAY_VERSION=PATHWAY_DATA.version;
export type PathwayEvidence={version:string;code:string;occupation:string;mapping:string;groups:{skill:string;target:number;concepts:{id:string;label:string;importance:number;scale:string;updatedAt:string;source:string}[]}[]};
const detail:Record<string,string>={
 lawyer:'Research legal issues, interpret rules, prepare legal documents and develop evidence-based arguments. Communication, negotiation and careful reasoning support legal practice.',
 'legal-researcher':'Locate and evaluate legal materials, summarise cases and support document preparation. Check jurisdiction, authority and source currency.',
 'policy-analyst':'Compare policy options, assess evidence and explain likely trade-offs to public decision makers.',
 politician:'Explore legislative work, public representation and reasoned public debate. This is an elected public-service pathway rather than an ordinary vacancy-based profession.',
};
export const PATHWAY_ROLES=PATHWAY_DATA.roles.map(r=>({
 id:r.id,title:r.title,stream:r.stream,interests:[...r.interests],blurb:detail[r.id]??`Apply ${r.groups.slice(0,2).map(g=>g.skill.toLowerCase()).join(' and ')} in ${r.title.toLowerCase()} work.`,description:detail[r.id]??`Explore ${r.title.toLowerCase()} through its occupation-linked knowledge and transferable skills. Assess your current skills before planning focused practice.`,
 prospects:'Occupational reference for exploration. Malaysian vacancy, salary and future-growth figures have not been verified for this role.',salary:[0,0],minYears:0,
 required:Object.fromEntries(r.groups.map(g=>[g.skill,g.target])),core:r.groups.slice(0,3).map(g=>g.skill),futureSkills:[...r.futureSkills],qualificationNote:r.qualificationNote,
 demand:{moderate:0,fast:0},growth:{moderate:0,fast:0},automationRisk:{moderate:0,fast:0},marketStatus:'unavailable',sdgs:['law','public'].includes(r.stream)?[4,8,16]:[4,8],
 pathwayEvidence:{version:PATHWAY_DATA.sourceVersion,code:r.code,occupation:r.sourceTitle,mapping:r.id==='politician'?'Political Scientists is a proxy for practice skills; no legislator skill measurements are claimed.':'Faraway selected occupational analogue and interest links, using O*NET US occupational data. Not an official Malaysian qualification or ESCO/MASCO crosswalk.',groups:structuredClone(r.groups)} as unknown as PathwayEvidence,
}));
const practice:Record<string,string[]>={
 'Legal Research':['Identify a legal question and relevant jurisdiction','Compare primary authority with commentary','Write a sourced case or legislation brief','Check authority, currency and limits of your conclusion'],
 'Legal Writing':['Read a short legal text and identify the issue','Draft an issue-rule-application-conclusion outline','Write a concise legal memorandum with citations','Revise clarity, reasoning and source accuracy'],
 'Debate & Argumentation':['Identify claims, evidence and assumptions','Build a reasoned argument on a public issue','Prepare a counterargument and record a short debate','Review reasoning, listening and respectful rebuttal'],
 'Policy Analysis':['Define a public problem and affected groups','Compare policy options and evidence quality','Draft a policy brief explaining trade-offs','Review implementation limits and uncertainty'],
 'Communication':['Identify the audience and purpose','Practise active listening and a clear explanation','Deliver a short role-related presentation','Review structure, accuracy and audience feedback'],
 Negotiation:['Identify interests and constraints','Prepare options and an evidence-based proposal','Role-play a negotiation and record agreements','Reflect on fairness, listening and unresolved issues'],
};
const skills=[...new Set(PATHWAY_ROLES.flatMap(r=>Object.keys(r.required)))];
export const PATHWAY_COURSES=skills.map((skill,i)=>({id:'pathway-'+skill.toLowerCase().replace(/[^a-z0-9]+/g,'-'),version:PATHWAY_VERSION,title:skill+' — guided self-study',provider:'Faraway self-study',category:'Business',level:'Beginner',hours:4,cost:0,rating:0,learners:0,instructor:'Self-directed practice',hue:(i*37)%360,online:true,delivery:'online',setting:'indoor',hrdc:false,skills:[skill],description:`An authored practice outline for ${skill}. Four hours is a Faraway planning estimate, not a provider duration, accreditation or professional credential. Adapt each exercise to your selected career.`,activityTitles:practice[skill]??[`Identify the main ${skill.toLowerCase()} concepts in your chosen occupation`,`Work through a ${skill.toLowerCase()} example related to that occupation`,`Complete a small ${skill.toLowerCase()} task for your selected career`,`Review your ${skill.toLowerCase()} work against sources and record improvements`]}));
export function enrichCatalogue(catalogue:Catalogue):Catalogue {
 const ids=new Set<string>(PATHWAY_ROLES.map(r=>r.id));const courseIds=new Set(PATHWAY_COURSES.map(c=>c.id));
 return {...catalogue,careers:[...catalogue.careers.filter(r=>!ids.has(r.id)),...PATHWAY_ROLES as unknown as Role[]],courses:[...catalogue.courses.filter(c=>!courseIds.has(c.id)),...PATHWAY_COURSES as unknown as Course[]]};
}
export function relevantRole(role:Role,profile:Pick<ProfileInput,'stream'|'careers'>){return profile.careers.includes(role.id)||role.stream===profile.stream||Boolean(role.interests?.includes(profile.stream));}
export function interestRoles(stream:string,roles:Role[]){return roles.filter(r=>r.stream===stream||r.interests?.includes(stream));}
export function interestSkills(stream:string,roles:Role[]){return [...new Set(interestRoles(stream,roles).flatMap(r=>Object.keys(r.required)))];}
