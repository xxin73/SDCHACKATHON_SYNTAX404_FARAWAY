/** Transparent product rule, not a statistical forecast. Inputs are fractions 0–1. */
export function scoreOpportunity(readiness:number,interest:number,experience:number,growthPercent:number|null){
 const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
 const marketIndex=growthPercent===null?null:clamp(50+2*growthPercent,0,100);
 const score=100*(.6*clamp(readiness,0,1)+.2*clamp(interest,0,1)+.1*clamp(experience,0,1)+(marketIndex??0)/100*.1)/(marketIndex===null?.9:1);
 return {score:Math.round(score*10)/10,marketIndex};
}
