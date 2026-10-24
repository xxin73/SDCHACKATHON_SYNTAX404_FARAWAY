import {COURSES} from '@/data/courses';
export type LearningResource={title:string;url:string;skills:string[];price?:string;displayTitle?:string;provider?:string};
const resources:LearningResource[]=[
 {title:'LearnCpp: free modern C++ tutorial',url:'https://www.learncpp.com/',skills:['C++']},
 {title:'Microsoft C++ documentation',url:'https://learn.microsoft.com/en-us/cpp/',skills:['C++']},
 {title:'Python official tutorial',url:'https://docs.python.org/3/tutorial/',skills:['Python','Programming']},
 {title:'MDN web development guides',url:'https://developer.mozilla.org/en-US/docs/Learn_web_development',skills:['HTML','CSS','JavaScript']},
 {title:'Git reference and book',url:'https://git-scm.com/book/en/v2',skills:['Git & DevOps']},
 {title:'OpenLearn: Starting with law (UK introductory context)',url:'https://www.open.edu/openlearn/society-politics-law/starting-law/content-section-0',skills:['Legal Research','Legal Writing','Law and Government','Debate & Argumentation']},
 {title:'Khan Academy: statistics and probability',url:'https://www.khanacademy.org/math/statistics-probability',skills:['Statistics','Mathematics','Risk Management']},
];
export function resourcesFor(skills:string[],cost:string='free'):LearningResource[]{const matched=[...COURSES.filter(c=>c.resourceUrl&&c.skills.some(s=>skills.includes(s))).slice(0,5).map(c=>({title:c.title+' · '+c.provider,displayTitle:c.title,provider:c.provider,url:c.resourceUrl!,skills:c.skills,price:c.cost===0?'Free':'Check provider'})),...resources.filter(r=>r.skills.some(s=>skills.includes(s)))];if(!matched.length&&skills.length)matched.push({title:'Find open learning materials for '+skills[0],url:'https://ocw.mit.edu/search/?q='+encodeURIComponent(skills.join(' ')),skills,price:'Free learning materials'});if(cost!=='free'&&skills.length)matched.unshift({title:'Compare structured courses for '+skills[0]+(cost==='low'?' · verify price under RM 200':cost==='moderate'?' · verify price under RM 500':''),url:'https://www.coursera.org/search?query='+encodeURIComponent(skills.join(' ')),skills,price:'Price varies; confirm against your budget at the provider'});return [...new Map(matched.map(r=>[r.url,r])).values()];}
export function duration(hours:number){const minutes=Math.round(hours*60),h=Math.floor(minutes/60),m=minutes%60;return [h?`${h} ${h===1?'hour':'hours'}`:'',m?`${m} ${m===1?'minute':'minutes'}`:''].filter(Boolean).join(' ')||'0 minutes';}
