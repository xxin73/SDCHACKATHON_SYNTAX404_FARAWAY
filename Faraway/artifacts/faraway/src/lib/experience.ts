import type {Profile} from './store';
export const experienceYears=(value:string|number)=>Math.max(0,Math.min(99,Number(value)||0));
export function withTotalYears(profile:Profile,value:string|number):Partial<Profile>{const years=experienceYears(value);return {years,...(profile.roles.length===1?{roles:[{...profile.roles[0],years}]}:{})};}
export function withRoleYears(profile:Profile,index:number,value:string|number):Partial<Profile>{const roles=profile.roles.map((role,i)=>i===index?{...role,years:experienceYears(value)}:role);return {roles,years:experienceYears(roles.reduce((sum,role)=>sum+role.years,0))};}
