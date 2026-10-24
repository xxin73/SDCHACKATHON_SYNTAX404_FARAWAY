import { ALL_SKILLS, CAREERS } from '../data/careers';
import { BLS_OCCUPATIONS, CAREER_SOC } from '../data/official-trends';
import { skillKey } from '../../../../supabase/functions/faraway-recommendations/skill-policy';
import { scenarioRequirements } from '../../../../supabase/functions/faraway-recommendations/core';
import { OPPORTUNITY_FACTOR_WEIGHTS } from './opportunity-score';
import { roleIndex } from './trend-index';

/**
 * Only the login hero's analytical-capability counts. Catalogue-coverage
 * statistics elsewhere remain separate.
 */
export function getLoginAnalysisStatistics() {
  // The assessment's built-in skill vocabulary; custom user-entered skills
  // are unbounded and are not counted. Normalize just as skillRating does.
  const skills = new Set(ALL_SKILLS.map(skillKey).filter(Boolean));
  const factors = Object.values(OPPORTUNITY_FACTOR_WEIGHTS).filter((w) => w > 0);

  // Three measures actually rendered by TrendPanels' current-vs-future
  // sections. Count only types backed by usable local catalogue/evidence.
  // Scenario targets and indices are planning assumptions, not forecasts.
  const indicators = {
    futureSkillTargets: CAREERS.some((role) =>
      Object.values(scenarioRequirements(role.required, 'moderate', role.futureSkills))
        .some((level) => Number.isFinite(level)),
    ),
    occupationSkillIndex: CAREERS.some((role) =>
      Number.isFinite(roleIndex(role, 'moderate').future),
    ),
    projectedEmployment: CAREERS.some((role) => {
      const soc = CAREER_SOC[role.id] ?? role.pathwayEvidence?.code?.slice(0, 7) ?? '';
      const row = BLS_OCCUPATIONS[soc];
      return row && Number.isFinite(row.first) && row.first > 0 &&
        Number.isFinite(row.second) && row.second >= 0;
    }),
  };

  return [
    [String(skills.size), 'Skills analysed'],
    [String(factors.length), 'Career matching factors'],
    [String(Object.values(indicators).filter(Boolean).length), 'Future trend indicators'],
  ] as const;
}
