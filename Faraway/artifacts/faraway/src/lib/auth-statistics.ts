import { CAREERS, SDGS } from '../data/careers';

/** Catalogue coverage, not a claim of market forecasts or measured UN impact. */
export function getAuthStatistics() {
  // The assembled catalogue includes original, pathway, and expanded profiles.
  const profiles = CAREERS.filter((career) =>
    career.id && career.title && Object.keys(career.required).length > 0,
  );
  const scenarios = new Set(
    profiles.flatMap((career) =>
      Object.keys(career.demand).filter((scenario) =>
        scenario in career.growth && scenario in career.automationRisk,
      ),
    ),
  );
  // Count goals actually linked to profiles, not every goal in a reference list.
  const mappedGoals = new Set(
    profiles.flatMap((career) => career.sdgs).filter((goal) => SDGS[goal]),
  );

  return [
    [String(new Set(profiles.map((career) => career.id)).size), 'career profiles available'],
    [String(scenarios.size), 'AI adoption scenarios'],
    [String(mappedGoals.size), 'UN SDGs mapped'],
  ] as const;
}
