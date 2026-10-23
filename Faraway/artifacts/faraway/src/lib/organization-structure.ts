import type {OrganizationData,DepartmentSetup} from './org-model';
export const setupFor=(org:OrganizationData):DepartmentSetup[]=>Array.from(new Set([...(org.departmentSetup??[]).map(d=>d.name),...(org.departments??[]),...org.members.map(m=>m.department)])).map(name=>org.departmentSetup?.find(d=>d.name===name)??{name,teams:[],skills:[]});
export const structureReady=(org:OrganizationData)=>{const list=setupFor(org);return list.length>0&&list.every(d=>d.skills.length>0);};
