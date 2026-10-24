/** Transparent product rule, not a statistical forecast. Inputs are fractions 0–1. */
export const OPPORTUNITY_FACTOR_WEIGHTS = {
 readiness: .6,
 interest: .2,
 experience: .1,
 employmentOutlook: .1,
} as const;

export function scoreOpportunity(readiness:number,interest:number,experience:number,growthPercent:number|null){
 const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
 const marketIndex=growthPercent===null?null:clamp(50+2*growthPercent,0,100);
 const w=OPPORTUNITY_FACTOR_WEIGHTS;
 const score=100*(w.readiness*clamp(readiness,0,1)+w.interest*clamp(interest,0,1)+w.experience*clamp(experience,0,1)+(marketIndex??0)/100*w.employmentOutlook)/(marketIndex===null?1-w.employmentOutlook:1);
 return {score:Math.round(score*10)/10,marketIndex};
}
