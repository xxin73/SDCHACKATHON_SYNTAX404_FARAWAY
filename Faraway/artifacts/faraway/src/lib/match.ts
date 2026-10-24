import {opportunity} from './live-trends';
import {skillRating} from '../../../../supabase/functions/faraway-recommendations/skill-policy';
import {relevantRole} from '../../../../supabase/functions/faraway-recommendations/pathways';
import { courseMatches, preferences } from '../../../../supabase/functions/faraway-recommendations/core';
import { CAREERS, careerById, careerInScenario, type Career, type Scenario } from '@/data/careers';
import { COURSES, type Course } from '@/data/courses';
import type { Plan, Profile } from './store';
import { demandFromEvidence } from './evidence';
import { hasDatabaseCatalogue } from './catalogue-status';

export interface MatchResult {
  career: Career;
  score: number;
  opportunityScore: number;
  scenarioReadiness: number;
  skillFit: number;
  interestFit: number;
  experienceFit: number;
  marketFit: number;
  gaps: { skill: string; have: number; need: number }[];
}

export function computeMatch(c: Career, p: Profile, scenario: Scenario, skillsOverride?: Record<string, number>): MatchResult {
  c = careerInScenario(c, hasDatabaseCatalogue() ? 'moderate' : scenario)!;
  const skills = skillsOverride ?? p.skills;
  const entries = Object.entries(c.required);
  const skillFit = entries.reduce((a, [k, need]) => a + Math.min((skillRating(skills,k) ?? 0) / need, 1), 0) / entries.length;
  const interestFit = p.careers.includes(c.id) ? 1 : relevantRole(c,p) ? 0.8 : 0.1;
  const experienceFit = Math.min((p.years + 0.5) / (c.minYears + 0.5), 1);
  const marketFit = (hasDatabaseCatalogue() ? c.demand.moderate : demandFromEvidence(c.id, c.demand[scenario])) / 100;
  const score = 100 * (0.7 * skillFit + 0.2 * interestFit + 0.1 * experienceFit);
  const gaps = entries
    .map(([skill, need]) => ({ skill, have: skillRating(skills,skill) ?? 0, need }))
    .filter((g) => g.have < g.need)
    .sort((a, b) => b.need - b.have - (a.need - a.have));
  const outlook=opportunity(c,skills,interestFit,experienceFit,scenario);
  return { opportunityScore:outlook.score,scenarioReadiness:outlook.readiness,career: c, score: Math.round(score * 10) / 10, skillFit, interestFit, experienceFit, marketFit, gaps };
}

export function rankCareers(p: Profile, scenario: Scenario) {
  return CAREERS.map((c) => computeMatch(c, p, scenario)).sort((a, b) => Number(relevantRole(b.career,p))-Number(relevantRole(a.career,p)) || b.opportunityScore - a.opportunityScore || b.score - a.score || a.career.id.localeCompare(b.career.id));
}

export function suggested(p: Profile, scenario: Scenario, more: boolean) {
  const ranked = rankCareers(p, scenario);
  const primary = ranked.filter((r) => relevantRole(r.career,p));
  if (!more) return (p.stream==='other'?ranked:primary).slice(0, 6);
  return ranked;
}

export function filterCourses(plan: Plan): Course[] {
  return COURSES.filter(c=>courseMatches(c,preferences({...plan,resources:undefined})));
}

/** best course for a skill under the plan's preferences (never bypasses preferences) */
export function courseForSkill(skill: string, plan: Plan): Course | undefined {
  const pool = filterCourses(plan).filter((c) => c.skills.includes(skill));
  return pool.sort((a,b)=>(careerById(plan.target)?.pathwayEvidence?Number(b.id.startsWith('pathway-'))-Number(a.id.startsWith('pathway-')):0)||a.cost-b.cost||b.rating-a.rating||a.id.localeCompare(b.id))[0];
}

export const myr = (n: number) => 'RM ' + n.toLocaleString('en-MY');

/** checklist for a skill — each item is ~ a portion of the course hours */
export function checklistFor(skill: string, hours: number) {
  const parts = [
    { id: 'foundations', label: `${skill}: core concepts`, w: 0.25 },
    { id: 'practice', label: 'Guided practice exercises', w: 0.3 },
    { id: 'project', label: 'Mini project applying the skill', w: 0.3 },
    { id: 'assess', label: 'Self-assessment and reflection', w: 0.15 },
  ];
  return parts.map((p) => ({ ...p, hours: Math.round(hours * p.w * 100) / 100 }));
}

