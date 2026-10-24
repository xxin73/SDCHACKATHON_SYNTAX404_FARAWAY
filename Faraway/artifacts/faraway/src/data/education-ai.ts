export type EvidenceType = 'teacher-reported adoption' | 'teacher perception';

export interface EducationAiStat {
  id: string;
  value: number;
  title: string;
  caption: string;
  type: EvidenceType;
  sourceOrg: string;
  publicationYear: 2026;
  surveyYear: 2024;
  population: string;
  definition: string;
  sourceUrl: string;
  locator: string;
}

const SOURCE_URL = 'https://www.oecd.org/content/dam/oecd/en/publications/reports/2026/01/oecd-digital-education-outlook-2026_940e0dd8/062a7394-en.pdf';
const POP = 'Lower-secondary teachers, OECD averages (TALIS 2024)';

export const EDUCATION_AI_STATS: EducationAiStat[] = [
  {
    id: 'teachers-using-ai', value: 36, title: 'Teachers using AI',
    caption: 'Reported using AI in teaching during the previous year.',
    type: 'teacher-reported adoption', sourceOrg: 'OECD', publicationYear: 2026, surveyYear: 2024, population: POP,
    definition: 'Having used AI in their teaching during the 12 months prior to the survey.',
    sourceUrl: SOURCE_URL, locator: 'Figure 1.4',
  },
  {
    id: 'ai-lesson-planning', value: 53, title: 'AI supports lesson planning',
    caption: 'Agreed that AI helps with lesson planning.',
    type: 'teacher perception', sourceOrg: 'OECD', publicationYear: 2026, surveyYear: 2024, population: POP,
    definition: 'AI helps teachers write or improve lesson plans.',
    sourceUrl: SOURCE_URL, locator: 'Figure 1.4',
  },
  {
    id: 'academic-integrity', value: 72, title: 'Academic integrity concerns',
    caption: 'Concerned that AI can enable misrepresentation of work.',
    type: 'teacher perception', sourceOrg: 'OECD', publicationYear: 2026, surveyYear: 2024, population: POP,
    definition: 'AI enables students to misrepresent others\u2019 work as their own.',
    sourceUrl: SOURCE_URL, locator: 'Figure 1.4',
  },
  {
    id: 'inaccurate-recommendations', value: 66, title: 'Inaccurate AI recommendations',
    caption: 'Agreed that AI can give incorrect recommendations.',
    type: 'teacher perception', sourceOrg: 'OECD', publicationYear: 2026, surveyYear: 2024, population: POP,
    definition: 'AI makes incorrect or inappropriate recommendations.',
    sourceUrl: SOURCE_URL, locator: 'Figure 1.4',
  },
];

export const EVIDENCE_NOTE =
  'All four figures are self-reports and perceptions from the 2024 TALIS survey, published in OECD Digital Education Outlook 2026 (19 January 2026). They do not show actual harms, benefits or causal outcomes.';

export const VERIFICATION_NOTE =
  'Values are taken from Figure 1.4 of OECD Digital Education Outlook 2026. The survey covers lower-secondary teachers (TALIS 2024); the figures describe reported use and perceptions, not measured Faraway results.';

export interface InsightTab { id: string; label: string; kind: string; summary: string; points: string[] }

export const EDUCATION_INSIGHTS: InsightTab[] = [
  {
    id: 'opportunities', label: 'Learning opportunities', kind: 'Potential benefit',
    summary: 'AI can offer explanations, practice and tutoring-style support, but benefits depend on how the tool is designed and used.',
    points: [
      'Explanations can be adapted to a learner\u2019s pace and prior knowledge.',
      'Tutoring-style support tends to help most when it prompts thinking rather than handing over answers.',
      'Personalised practice is a design choice, not an automatic result of using AI.',
    ],
  },
  {
    id: 'teacher-support', label: 'Teacher support', kind: 'Perceived benefit',
    summary: 'Teachers describe AI mainly as a time-saver for preparation and routine work.',
    points: [
      'Planning: drafting and improving lesson plans.',
      'Materials: preparing exercises, examples and resources.',
      'Admin: help with routine writing and organisation tasks.',
    ],
  },
  {
    id: 'risks', label: 'Challenges and risks', kind: 'Potential risk',
    summary: 'Risks are about trust and skill: what AI gets wrong, who it may disadvantage, and whether people know how to use it.',
    points: [
      'Integrity: students may pass off AI-generated work as their own.',
      'Inaccuracy: outputs can be incorrect or inappropriate and need checking.',
      'Bias: outputs can reflect uneven training data.',
      'AI literacy: learners and teachers need skills to question and verify outputs.',
    ],
  },
];
