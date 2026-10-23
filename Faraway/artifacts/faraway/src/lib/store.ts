import { useSyncExternalStore } from 'react';
import type { Scenario } from '@/data/careers';

export type Highest = 'SPM' | 'Diploma' | 'Degree' | 'Masters' | 'PhD';

export interface EduEntry { field: string; institution: string; year: string }
export interface Role { title: string; company: string; years: number }

export interface Profile {
  stream: string;
  careers: string[];
  name: string;
  email: string;
  location: string;
  status: 'graduate' | 'jobseeker' | 'switcher';
  years: number;
  roles: Role[];
  highest: Highest;
  ug: EduEntry;
  pg: EduEntry;
  phd: EduEntry;
  skills: Record<string, number>;
  summary: string;
  complete: boolean;
}

export interface Plan {
  setting: 'indoor' | 'outdoor' | 'either';
  minutesPerDay: number;
  cost: 'free' | 'low' | 'hrdc' | 'any';
  onlineOnly: boolean;
  mode: 'recommended' | 'custom';
  target: string;
  skills: string[];
  saved: boolean;
}

export interface State {
  session: { id?: string; name: string; email: string } | null;
  profile: Profile;
  scenario: Scenario;
  plan: Plan;
  progress: Record<string, string[]>;
  lessons: Record<string, string[]>;
  badges: string[];
}

const emptyEdu: EduEntry = { field: '', institution: '', year: '' };

export const emptyProfile: Profile = {
  stream: '', careers: [], name: '', email: '', location: '', status: 'graduate', years: 0, roles: [],
  highest: 'Degree', ug: { ...emptyEdu }, pg: { ...emptyEdu }, phd: { ...emptyEdu }, skills: {}, summary: '', complete: false,
};

export const sampleProfile: Profile = {
  stream: 'cs',
  careers: ['data-analyst', 'cloud-engineer'],
  name: 'Aina Sofea binti Kamal',
  email: 'aina.sofea@example.my',
  location: 'Shah Alam, Selangor',
  status: 'graduate',
  years: 1,
  roles: [{ title: 'Data Intern', company: 'Petaling Retail Group', years: 0.5 }, { title: 'Student Developer', company: 'UiTM Hackathon Club', years: 0.5 }],
  highest: 'Degree',
  ug: { field: 'BSc Computer Science (Data Science)', institution: 'Universiti Teknologi MARA', year: '2025' },
  pg: { ...emptyEdu }, phd: { ...emptyEdu },
  skills: { Python: 3, SQL: 3, 'Data Visualisation': 2, Statistics: 3, Communication: 4, 'Problem Solving': 3, 'AI Tools': 2, 'Cloud Computing': 1 },
  summary: 'Fresh Computer Science graduate who enjoys turning data into clear stories. Looking for an analyst role that can grow toward cloud and data engineering.',
  complete: false,
};

export const defaults: State = {
  session: null,
  profile: emptyProfile,
  scenario: 'moderate',
  plan: { setting: 'either', minutesPerDay: 60, cost: 'any', onlineOnly: false, mode: 'recommended', target: '', skills: [], saved: false },
  progress: {},
  lessons: {},
  badges: [],
};

const KEY = 'faraway_state_v1';
let state: State = load();
const listeners = new Set<() => void>();

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const p = JSON.parse(raw) as Partial<State>;
    return { ...defaults, ...p, session: null, profile: { ...emptyProfile, ...(p.profile ?? {}) }, plan: { ...defaults.plan, ...(p.plan ?? {}) } };
  } catch {
    return defaults;
  }
}

export function setState(fn: (s: State) => State, persist = true) {
  const previous = state;
  state = fn(state);
  if (previous.profile.complete && state.profile.complete && JSON.stringify({ ...previous.profile, complete: false }) !== JSON.stringify({ ...state.profile, complete: false })) {
    state = { ...state, profile: { ...state.profile, complete: false } };
  }
  // Signed-in personal data stays in memory and Supabase, never the shared demo cache.
  if (persist && !state.session?.id) {
    try { localStorage.setItem(KEY, JSON.stringify({ ...state, session: null })); } catch { /* storage full or blocked */ }
  }
  listeners.forEach((l) => l());
}

export const loadDemoState = () => load();

export function subscribeStore(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function replaceAccountState(session: State['session'], data?: Omit<State, 'session'> | null) {
  // A new account never inherits a demo or the previous account's profile.
  setState(() => ({ ...structuredClone(defaults), ...data, session }), false);
}

export function resetJourney() {
  setState((s) => ({ ...defaults, session: s.session }));
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => sel(state),
  );
}

export const getState = () => state;
