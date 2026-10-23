// Curated resource links, not enrolments or claims that the illustrative course is real.
export type LearningResource={title:string;url:string;skills:string[]};
const resources:LearningResource[]=[
 {title:'Microsoft Excel help & learning',url:'https://support.microsoft.com/en-us/excel',skills:['Excel','Financial Modelling','Accounting']},
 {title:'Khan Academy: statistics and probability',url:'https://www.khanacademy.org/math/statistics-probability',skills:['Statistics','Risk Management']},
 {title:'Microsoft Learn: Power BI',url:'https://learn.microsoft.com/en-us/training/powerplatform/power-bi',skills:['Data Visualisation']},
 {title:'Python official tutorial',url:'https://docs.python.org/3/tutorial/',skills:['Python','Problem Solving']},
 {title:'Microsoft Learn: SQL',url:'https://learn.microsoft.com/en-us/training/browse/?terms=SQL',skills:['SQL']},
 {title:'MDN JavaScript guide',url:'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',skills:['JavaScript']},
 {title:'Git reference and book',url:'https://git-scm.com/book/en/v2',skills:['Git & DevOps']},
 {title:'Microsoft Learn: AI',url:'https://learn.microsoft.com/en-us/training/browse/?terms=AI',skills:['AI Tools','Machine Learning']},
 {title:'Microsoft Learn: cloud',url:'https://learn.microsoft.com/en-us/training/browse/?terms=cloud',skills:['Cloud Computing','Cybersecurity']},
 {title:'OpenLearn: free learning catalogue',url:'https://www.open.edu/openlearn/free-courses/full-catalogue',skills:['Communication','Stakeholder Management','Project Management','Digital Marketing','UX Research','UI Design','Visual Design','Prototyping']},
];
export const resourcesFor=(skills:string[])=>resources.filter(r=>r.skills.some(s=>skills.includes(s)));
export function duration(hours:number){const minutes=Math.round(hours*60),h=Math.floor(minutes/60),m=minutes%60;return [h?`${h} ${h===1?'hour':'hours'}`:'',m?`${m} ${m===1?'minute':'minutes'}`:''].filter(Boolean).join(' ')||'0 minutes';}
