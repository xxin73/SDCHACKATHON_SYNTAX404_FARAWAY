import { z } from 'zod';
import type { State } from './store';

export type PersonalData = Omit<State, 'session'>;
const education = z.object({ field: z.string(), institution: z.string(), year: z.string() });
export const personalDataSchema = z.object({
  profile: z.object({
    stream: z.string(), careers: z.array(z.string()), name: z.string(), email: z.string(), location: z.string(),
    status: z.enum(['graduate', 'jobseeker', 'switcher']), years: z.number().nonnegative(),
    roles: z.array(z.object({ title: z.string(), company: z.string(), years: z.number().nonnegative(), responsibilities: z.string().optional() })),
    secondaryQualification: z.string().optional(), otherInterest: z.string().optional(), otherCareer: z.string().optional(),
    highest: z.enum(['', 'Secondary', 'Pre-U', 'SPM', 'Diploma', 'Degree', 'Masters', 'PhD']), ug: education, pg: education, phd: education,
    skills: z.record(z.number().int().min(0).max(5)), summary: z.string(), complete: z.boolean(),
  }),
  scenario: z.enum(['moderate', 'fast']),
  plan: z.object({ setting: z.enum(['indoor', 'outdoor', 'either']), minutesPerDay: z.number().positive(),
    cost: z.enum(['free', 'low', 'moderate', 'hrdc', 'any']), delivery: z.enum(['online','in-person','hybrid','any']).optional(), futureScenario: z.enum(['moderate','fast']).optional(), onlineOnly: z.boolean(), mode: z.enum(['recommended', 'custom']),
    target: z.string(), skills: z.array(z.string()), saved: z.boolean() }),
  progress: z.record(z.array(z.string())), lessons: z.record(z.array(z.string())), badges: z.array(z.string()),
});

export function personalData(state: State): PersonalData {
  const { session: _session, ...data } = state;
  return structuredClone(data);
}

