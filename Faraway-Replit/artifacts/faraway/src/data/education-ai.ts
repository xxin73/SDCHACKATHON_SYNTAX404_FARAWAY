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
    id: 'teachers-using-ai', value: 36, title: 'Teachers Using AI',
    caption: 'Teacher-reported adoption: share who said they used AI in their teaching in the 12 months before the survey.',
    type: 'teacher-reported adoption', sourceOrg: 'OECD', publicationYear: 2026, surveyYear: 2024, population: POP,
    definition: 'Having used AI in their teaching during the 12 months prior to the survey.',
    sourceUrl: SOURCE_URL, locator: 'Figure 1.4',
  },
  {
    id: 'ai-lesson-planning', value: 53, title: 'AI Supports Lesson Planning',
    caption: 'Teacher perception: share who said AI helps them write or improve lesson plans. Not a measured learning outcome.',
    type: 'teacher perception', sourceOrg: 'OECD', publicationYear: 2026, surveyYear: 2024, population: POP,
    definition: 'AI helps teachers write or improve lesson plans.',
    sourceUrl: SOURCE_URL, locator: 'Figure 1.4',
  },
  {
    id: 'academic-integrity', value: 72, title: 'Academic Integrity Concerns',
    caption: 'Teacher perception: share who said AI enables students to misrepresent others\u2019 work as their own. A concern, not measured misconduct.',
    type: 'teacher perception', sourceOrg: 'OECD', publicationYear: 2026, surveyYear: 2024, population: POP,
    definition: 'AI enables students to misrepresent others\u2019 work as their own.',
    sourceUrl: SOURCE_URL, locator: 'Figure 1.4',
  },
  {
    id: 'inaccurate-recommendations', value: 66, title: 'Inaccurate AI Recommendations',
    caption: 'Teacher perception: share who said AI makes incorrect or inappropriate recommendations. Self-reported, not an audit of AI output.',
    type: 'teacher perception', sourceOrg: 'OECD', publicationYear: 2026, surveyYear: 2024, population: POP,
    definition: 'AI makes incorrect or inappropriate recommendations.',
    sourceUrl: SOURCE_URL, locator: 'Figure 1.4',
  },
];

export const EVIDENCE_NOTE =
  'All four figures are self-reports and perceptions from the 2024 TALIS survey, published in OECD Digital Education Outlook 2026 (19 January 2026). They do not show actual harms, benefits or causal outcomes.';

export const VERIFICATION_NOTE =
  'Verification: values were read directly from Figure 1.4 of the full OECD PDF. A web summary gave 37% and 57% for the first two indicators; the primary figure shows 36% and 53%, so those are used here. The proposed 62% student AI-literacy figure was not used because its survey definition and population could not be confirmed; the verified 66% teacher concern about incorrect recommendations is shown instead.';

export interface InsightTab { id: string; label: string; kind: string; summary: string; points: string[] }

export const EDUCATION_INSIGHTS: InsightTab[] = [
  {
    id: 'opportunities', label: 'Learning Opportunities', kind: 'Potential benefit',
    summary: 'AI can offer explanations, practice and tutoring-style support, but benefits depend on how the tool is designed and used.',
    points: [
      'Explanations can be adapted to a learner\u2019s pace and prior knowledge.',
      'Tutoring-style support tends to help most when it prompts thinking rather than handing over answers.',
      'Personalised practice is a design choice, not an automatic result of using AI.',
    ],
  },
  {
    id: 'teacher-support', label: 'Teacher Support', kind: 'Perceived benefit',
    summary: 'Teachers describe AI mainly as a time-saver for preparation and routine work.',
    points: [
      'Planning: drafting and improving lesson plans.',
      'Materials: preparing exercises, examples and resources.',
      'Admin: help with routine writing and organisation tasks.',
    ],
  },
  {
    id: 'risks', label: 'Challenges and Risks', kind: 'Potential risk',
    summary: 'Risks are about trust and skill: what AI gets wrong, who it may disadvantage, and whether people know how to use it.',
    points: [
      'Integrity: students may pass off AI-generated work as their own.',
      'Inaccuracy: outputs can be incorrect or inappropriate and need checking.',
      'Bias: outputs can reflect uneven training data.',
      'AI literacy: learners and teachers need skills to question and verify outputs.',
    ],
  },
];
