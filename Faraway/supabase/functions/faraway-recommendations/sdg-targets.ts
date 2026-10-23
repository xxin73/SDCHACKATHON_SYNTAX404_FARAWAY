export const TARGET_SOURCE='https://sdgs.un.org/2030agenda';
export const SDG_TARGETS:Record<string,{goal:number;title:string;summary:string}>={
 '4.2':{goal:4,title:'Early childhood learning',summary:'Support early development and access to pre-primary education.'},
 '4.3':{goal:4,title:'Access to tertiary and vocational learning',summary:'Widen access to affordable technical, vocational and higher education.'},
 '4.4':{goal:4,title:'Skills for work and enterprise',summary:'Develop relevant technical and vocational capabilities for employment and entrepreneurship.'},
 '5.5':{goal:5,title:'Participation and leadership',summary:'Support equal opportunities to participate in decisions and leadership.'},
 '8.1':{goal:8,title:'Sustainable economic growth',summary:'A national economic-growth target; a course does not demonstrate GDP impact.'},
 '8.2':{goal:8,title:'Productivity through innovation',summary:'Use technology and innovation to improve how useful work gets done.'},
 '8.5':{goal:8,title:'Decent work and equal pay',summary:'Support productive employment, decent work and equal pay for work of equal value.'},
 '9.1':{goal:9,title:'Reliable and inclusive infrastructure',summary:'Develop resilient infrastructure with fair access.'},
 '9.5':{goal:9,title:'Research and industrial capability',summary:'Strengthen scientific research and technological capabilities.'},
 '10.2':{goal:10,title:'Social and economic inclusion',summary:'Enable people to participate in social, economic and political life.'},
 '11.2':{goal:11,title:'Accessible transport',summary:'Support safe, affordable and sustainable transport access.'},
 '11.3':{goal:11,title:'Inclusive urban planning',summary:'Improve inclusive, sustainable planning and management of settlements.'},
 '12.2':{goal:12,title:'Responsible resource use',summary:'Improve the sustainable management and efficient use of natural resources.'},
 '12.5':{goal:12,title:'Waste prevention and reuse',summary:'Prevent and reduce waste through reuse and recycling.'},
 '16.3':{goal:16,title:'Justice and the rule of law',summary:'Support the rule of law and access to justice.'},
 '16.6':{goal:16,title:'Accountable institutions',summary:'Improve institutional effectiveness, accountability and transparency.'},
};
// These context links are Faraway interpretations, not UN endorsement or impact measurements.
export function targetForContext(goal:number,skill='',job=''){const context=skill+' '+job;let id='';if(goal===4)id=/early childhood|preschool|kindergarten|pre-primary/i.test(context)?'4.2':/university|tertiary|vocational|tvet/i.test(context)?'4.3':'4.4';else if(goal===8)id=skill?'8.2':'8.5';else if(goal===9)id=/research|scientific|laboratory/i.test(context)?'9.5':'9.1';else if(goal===12)id=/waste|recycl|reuse/i.test(context)?'12.5':'12.2';else if(goal===16)id=/law|legal|justice|court/i.test(context)?'16.3':'16.6';else id=({5:'5.5',10:'10.2',11:/transport|logistic/i.test(context)?'11.2':'11.3'} as Record<number,string>)[goal]??'';return id?{id,...SDG_TARGETS[id],url:`https://sdgs.un.org/goals/goal${goal}`,sourceDate:'2015-09-25',checkedAt:'2026-10-24'}:null;}
