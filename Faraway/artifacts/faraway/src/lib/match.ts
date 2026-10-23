import { CAREERS, careerInScenario, type Career, type Scenario } from '@/data/careers';
import { COURSES, type Course } from '@/data/courses';
import type { Plan, Profile } from './store';
import { demandFromEvidence } from './evidence';

export interface MatchResult {
  career: Career;
  score: number;
  skillFit: number;
  interestFit: number;
  experienceFit: number;
  marketFit: number;
  gaps: { skill: string; have: number; need: number }[];
}

export function computeMatch(c: Career, p: Profile, scenario: Scenario, skillsOverride?: Record<string, number>): MatchResult {
  c = careerInScenario(c, scenario)!;
  const skills = skillsOverride ?? p.skills;
  const entries = Object.entries(c.required);
  const skillFit = entries.reduce((a, [k, need]) => a + Math.min((skills[k] ?? 0) / need, 1), 0) / entries.length;
  const interestFit = p.careers.includes(c.id) ? 1 : p.stream === c.stream ? 0.6 : 0.25;
  const experienceFit = Math.min((p.years + 0.5) / (c.minYears + 0.5), 1);
  const marketFit = demandFromEvidence(c.id, c.demand[scenario]) / 100;
  const score = 100 * (0.65 * skillFit + 0.15 * interestFit + 0.1 * experienceFit + 0.1 * marketFit);
  const gaps = entries
    .map(([skill, need]) => ({ skill, have: skills[skill] ?? 0, need }))
    .filter((g) => g.have < g.need)
    .sort((a, b) => b.need - b.have - (a.need - a.have));
  return { career: c, score: Math.round(score * 10) / 10, skillFit, interestFit, experienceFit, marketFit, gaps };
}

export function rankCareers(p: Profile, scenario: Scenario) {
  return CAREERS.map((c) => computeMatch(c, p, scenario)).sort((a, b) => b.score - a.score);
}

export function suggested(p: Profile, scenario: Scenario, more: boolean) {
  const ranked = rankCareers(p, scenario);
  const primary = ranked.filter((r) => r.career.stream === p.stream || p.careers.includes(r.career.id));
  if (!more) return primary.slice(0, 4);
  return ranked;
}

export function filterCourses(plan: Plan): Course[] {
  return COURSES.filter((c) => {
    if (plan.setting !== 'either' && c.setting !== plan.setting) return false;
    if (plan.onlineOnly && !c.online) return false;
    if (plan.cost === 'free' && c.cost > 0) return false;
    if (plan.cost === 'low' && c.cost > 200) return false;
    if (plan.cost === 'hrdc' && !c.hrdc) return false;
    return true;
  });
}

/** best course for a skill under the plan's preferences (never bypasses preferences) */
export function courseForSkill(skill: string, plan: Plan): Course | undefined {
  const pool = filterCourses(plan).filter((c) => c.skills.includes(skill));
  return pool.sort((a, b) => a.cost - b.cost || b.rating - a.rating)[0];
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
