import type {Profile} from './store';
export const experienceYears=(value:string|number)=>Math.max(0,Math.min(99,Number(value)||0));
export function withTotalYears(profile:Profile,value:string|number):Partial<Profile>{const years=experienceYears(value);return {years,...(profile.roles.length===1?{roles:[{...profile.roles[0],years}]}:{})};}
export function withRoleYears(profile:Profile,index:number,value:string|number):Partial<Profile>{const roles=profile.roles.map((role,i)=>i===index?{...role,years:experienceYears(value)}:role);return {roles,...(roles.length===1?{years:roles[0].years}:{})};}

export function experienceError(profile:Pick<Profile,"roles"|"years">){if(profile.roles.length<2)return "";const total=profile.roles.reduce((n,r)=>n+r.years,0);return Math.abs(total-profile.years)>0.001?`Role durations add up to ${Number(total.toFixed(2))} years, but total experience is ${profile.years}. Make them equal before continuing.`:"";}
