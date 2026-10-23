import type { SkillEvidence } from '../../../../supabase/functions/faraway-recommendations/core';
export type Scenario = 'fast' | 'moderate';

export interface Stream {
  id: string;
  name: string;
  tagline: string;
  careers: string[];
  skills: string[];
}

export const STREAMS: Stream[] = [
  {
    id: 'cs',
    name: 'Computer Science',
    tagline: 'Software, data, cloud and security',
    careers: ['data-analyst', 'software-engineer', 'cloud-engineer', 'cyber-analyst', 'ml-engineer'],
    skills: ['Python', 'SQL', 'JavaScript', 'Cloud Computing', 'Cybersecurity', 'Machine Learning', 'Data Visualisation', 'Statistics', 'Git & DevOps', 'Communication', 'Problem Solving', 'AI Tools'],
  },
  {
    id: 'finance',
    name: 'Finance',
    tagline: 'Analysis, risk, accounting and fintech',
    careers: ['financial-analyst', 'risk-analyst', 'accountant', 'data-analyst'],
    skills: ['Excel', 'Financial Modelling', 'SQL', 'Python', 'Accounting', 'Statistics', 'Risk Management', 'Data Visualisation', 'Communication', 'AI Tools', 'Problem Solving'],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'Strategy, marketing, operations and people',
    careers: ['business-analyst', 'digital-marketer', 'hr-specialist', 'product-manager'],
    skills: ['Excel', 'SQL', 'Data Visualisation', 'Digital Marketing', 'Project Management', 'Communication', 'Stakeholder Management', 'UX Research', 'AI Tools', 'Problem Solving', 'Statistics'],
  },
  {
    id: 'design',
    name: 'Design & Media',
    tagline: 'Product, visual and content design',
    careers: ['ux-designer', 'digital-marketer', 'product-manager'],
    skills: ['UX Research', 'UI Design', 'Prototyping', 'Visual Design', 'Digital Marketing', 'Communication', 'JavaScript', 'AI Tools', 'Project Management', 'Problem Solving'],
  },
];

export const ALL_SKILLS = Array.from(new Set(STREAMS.flatMap((s) => s.skills))).sort();

export interface SDG {
  n: number;
  title: string;
  color: string;
}

export const SDGS: Record<number, SDG> = {
  4: { n: 4, title: 'Quality Education', color: '#c5192d' },
  5: { n: 5, title: 'Gender Equality', color: '#ff3a21' },
  8: { n: 8, title: 'Decent Work & Economic Growth', color: '#a21942' },
  9: { n: 9, title: 'Industry, Innovation & Infrastructure', color: '#fd6925' },
  10: { n: 10, title: 'Reduced Inequalities', color: '#dd1367' },
  11: { n: 11, title: 'Sustainable Cities', color: '#fd9d24' },
  12: { n: 12, title: 'Responsible Consumption', color: '#bf8b2e' },
  16: { n: 16, title: 'Peace, Justice & Strong Institutions', color: '#00689d' },
};

/** which SDG each skill most connects to */
export const SKILL_SDG: Record<string, number> = {
  Python: 9, SQL: 9, JavaScript: 9, 'Cloud Computing': 9, Cybersecurity: 16, 'Machine Learning': 9,
  'Data Visualisation': 4, Statistics: 4, 'Git & DevOps': 9, Communication: 4, 'Problem Solving': 8,
  'AI Tools': 8, Excel: 8, 'Financial Modelling': 8, Accounting: 16, 'Risk Management': 16,
  'Digital Marketing': 12, 'Project Management': 8, 'Stakeholder Management': 10, 'UX Research': 10,
  'UI Design': 9, Prototyping: 9, 'Visual Design': 11,
};

export interface Career {
  skillEvidence?: SkillEvidence;
  id: string;
  title: string;
  stream: string;
  blurb: string;
  description: string;
  prospects: string;
  salary: [number, number]; // MYR per month
  minYears: number;
  required: Record<string, number>; // skill -> level 1..5
  core: string[];
  demand: Record<Scenario, number>; // 0..100
  growth: Record<Scenario, number>; // % change to 2030
  automationRisk: Record<Scenario, number>; // % of tasks exposed
  sdgs: number[];
}

export const CAREERS: Career[] = [
  {
    id: 'data-analyst', title: 'Data Analyst', stream: 'cs',
    blurb: 'Turn messy numbers into decisions people trust.',
    description: 'Collect, clean and analyse business data, build dashboards and explain findings to non-technical teams. Increasingly works alongside AI copilots that draft queries and charts.',
    prospects: 'Steady demand across banking, e-commerce and government-linked companies in Klang Valley and Penang. Routine reporting is automating; analysts who frame questions and validate AI output rise into analytics engineering or product analytics.',
    salary: [4200, 7800], minYears: 0,
    required: { SQL: 4, Python: 3, 'Data Visualisation': 4, Statistics: 3, Communication: 3, 'AI Tools': 3 },
    core: ['SQL', 'Data Visualisation', 'Statistics'],
    demand: { fast: 74, moderate: 82 }, growth: { fast: 9, moderate: 18 }, automationRisk: { fast: 46, moderate: 31 }, sdgs: [8, 9, 4],
  },
  {
    id: 'software-engineer', title: 'Software Engineer', stream: 'cs',
    blurb: 'Design and ship the systems everyone else depends on.',
    description: 'Build, test and maintain web and backend services. AI pair-programming accelerates delivery, shifting the role toward architecture, review and reliability.',
    prospects: 'Strong hiring from regional tech hubs and MSC-status firms. Juniors face more competition as AI handles boilerplate; engineers with system design and cloud depth remain scarce.',
    salary: [4800, 11000], minYears: 0,
    required: { JavaScript: 4, Python: 3, 'Git & DevOps': 3, 'Cloud Computing': 3, 'Problem Solving': 4, 'AI Tools': 3 },
    core: ['JavaScript', 'Problem Solving', 'Git & DevOps'],
    demand: { fast: 79, moderate: 85 }, growth: { fast: 12, moderate: 21 }, automationRisk: { fast: 38, moderate: 24 }, sdgs: [9, 8],
  },
  {
    id: 'cloud-engineer', title: 'Cloud Engineer', stream: 'cs',
    blurb: 'Keep the infrastructure of the digital economy running.',
    description: 'Provision, automate and secure cloud infrastructure on AWS, Azure or GCP. Malaysia’s hyperscale data-centre build-out in Johor and Cyberjaya is driving local demand.',
    prospects: 'One of the fastest-growing roles in Malaysia through 2030 under both scenarios; fast AI adoption increases compute demand further.',
    salary: [5500, 12500], minYears: 1,
    required: { 'Cloud Computing': 4, 'Git & DevOps': 4, Python: 3, Cybersecurity: 3, 'Problem Solving': 3 },
    core: ['Cloud Computing', 'Git & DevOps'],
    demand: { fast: 93, moderate: 86 }, growth: { fast: 34, moderate: 26 }, automationRisk: { fast: 22, moderate: 15 }, sdgs: [9, 11],
  },
  {
    id: 'cyber-analyst', title: 'Cybersecurity Analyst', stream: 'cs',
    blurb: 'Stand watch over systems as threats get smarter.',
    description: 'Monitor, investigate and respond to security incidents; harden systems and train staff. AI-generated phishing and attacks are expanding the threat surface.',
    prospects: 'National Cyber Security Act 2024 raises compliance needs. Talent gap estimated in the tens of thousands across ASEAN.',
    salary: [5000, 11500], minYears: 1,
    required: { Cybersecurity: 4, 'Cloud Computing': 3, Python: 2, 'Problem Solving': 4, Communication: 3 },
    core: ['Cybersecurity', 'Problem Solving'],
    demand: { fast: 91, moderate: 84 }, growth: { fast: 31, moderate: 23 }, automationRisk: { fast: 19, moderate: 14 }, sdgs: [16, 9],
  },
  {
    id: 'ml-engineer', title: 'Machine Learning Engineer', stream: 'cs',
    blurb: 'Build the models that are reshaping every other job.',
    description: 'Train, evaluate and deploy machine learning models into products, including fine-tuning and governing large language models.',
    prospects: 'Highest upside under fast adoption. Entry is competitive and usually needs a portfolio or postgraduate study.',
    salary: [6500, 15500], minYears: 1,
    required: { Python: 5, 'Machine Learning': 4, Statistics: 4, 'Cloud Computing': 3, SQL: 3, 'AI Tools': 4 },
    core: ['Python', 'Machine Learning', 'Statistics'],
    demand: { fast: 96, moderate: 81 }, growth: { fast: 47, moderate: 29 }, automationRisk: { fast: 17, moderate: 12 }, sdgs: [9, 4, 8],
  },
  {
    id: 'financial-analyst', title: 'Financial Analyst', stream: 'finance',
    blurb: 'Model the future of a business, one assumption at a time.',
    description: 'Build forecasts, valuation models and management reports. Spreadsheet grunt work is moving to AI; judgement, scenario thinking and communication carry the role.',
    prospects: 'Stable in banks and GLCs; fast AI adoption compresses junior headcount but rewards analysts who can code and automate.',
    salary: [4000, 8800], minYears: 0,
    required: { Excel: 4, 'Financial Modelling': 4, Accounting: 3, Python: 2, Communication: 3, 'AI Tools': 3 },
    core: ['Excel', 'Financial Modelling'],
    demand: { fast: 61, moderate: 72 }, growth: { fast: -4, moderate: 7 }, automationRisk: { fast: 54, moderate: 37 }, sdgs: [8, 16],
  },
  {
    id: 'risk-analyst', title: 'Risk & Compliance Analyst', stream: 'finance',
    blurb: 'Help institutions stay solvent, honest and ahead of regulators.',
    description: 'Assess credit, market and operational risk; monitor compliance with Bank Negara guidelines; increasingly validate AI models used in lending.',
    prospects: 'AI governance creates a new strand of model-risk work, keeping demand resilient.',
    salary: [4600, 9800], minYears: 1,
    required: { 'Risk Management': 4, Statistics: 3, Excel: 4, SQL: 2, Communication: 3 },
    core: ['Risk Management', 'Statistics'],
    demand: { fast: 77, moderate: 74 }, growth: { fast: 15, moderate: 11 }, automationRisk: { fast: 33, moderate: 25 }, sdgs: [16, 8],
  },
  {
    id: 'accountant', title: 'Accountant', stream: 'finance',
    blurb: 'Keep the books, then become the advisor behind them.',
    description: 'Prepare financial statements, manage tax and audits. Bookkeeping and reconciliation are among the most automatable tasks in the economy.',
    prospects: 'Moderate scenario: steady. Fast scenario: significant reshaping toward advisory, ESG reporting and systems roles.',
    salary: [3500, 7200], minYears: 0,
    required: { Accounting: 5, Excel: 4, 'AI Tools': 2, Communication: 3, 'Financial Modelling': 2 },
    core: ['Accounting', 'Excel'],
    demand: { fast: 48, moderate: 66 }, growth: { fast: -17, moderate: -3 }, automationRisk: { fast: 68, moderate: 47 }, sdgs: [8, 16],
  },
  {
    id: 'business-analyst', title: 'Business Analyst', stream: 'business',
    blurb: 'Translate between the people who need things and the people who build them.',
    description: 'Gather requirements, map processes, analyse data and guide digital transformation projects.',
    prospects: 'Transformation programmes keep demand healthy; BAs who can prototype with AI tools and SQL stand out.',
    salary: [4300, 8500], minYears: 0,
    required: { SQL: 3, Excel: 4, 'Stakeholder Management': 4, 'Project Management': 3, Communication: 4, 'Data Visualisation': 3 },
    core: ['Stakeholder Management', 'Communication'],
    demand: { fast: 71, moderate: 76 }, growth: { fast: 8, moderate: 13 }, automationRisk: { fast: 39, moderate: 28 }, sdgs: [8, 9],
  },
  {
    id: 'digital-marketer', title: 'Digital Marketing Specialist', stream: 'business',
    blurb: 'Find the audience, tell the story, measure what works.',
    description: 'Plan and run paid, social and content campaigns; analyse performance. Generative AI now produces much of the first-draft content.',
    prospects: 'Volume content roles shrink under fast adoption; strategy, analytics and brand roles grow.',
    salary: [3300, 7000], minYears: 0,
    required: { 'Digital Marketing': 4, 'Data Visualisation': 3, Communication: 4, 'AI Tools': 4, 'Visual Design': 2 },
    core: ['Digital Marketing', 'Communication'],
    demand: { fast: 58, moderate: 70 }, growth: { fast: -6, moderate: 6 }, automationRisk: { fast: 57, moderate: 39 }, sdgs: [12, 8],
  },
  {
    id: 'hr-specialist', title: 'HR & Talent Specialist', stream: 'business',
    blurb: 'Shape how people are hired, grown and kept.',
    description: 'Run recruitment, onboarding and learning programmes; increasingly use people analytics and manage HRD Corp training grants.',
    prospects: 'Reskilling mandates push HR toward learning design and workforce analytics.',
    salary: [3500, 7500], minYears: 0,
    required: { Communication: 4, 'Stakeholder Management': 3, 'Project Management': 3, Excel: 3, 'AI Tools': 2 },
    core: ['Communication', 'Stakeholder Management'],
    demand: { fast: 63, moderate: 69 }, growth: { fast: 2, moderate: 8 }, automationRisk: { fast: 44, moderate: 32 }, sdgs: [8, 5, 10],
  },
  {
    id: 'product-manager', title: 'Product Manager', stream: 'business',
    blurb: 'Decide what gets built and why it matters.',
    description: 'Own product strategy and roadmap, align design, engineering and business, and measure outcomes.',
    prospects: 'AI-native products expand PM roles; usually entered after 1–3 years in an adjacent role.',
    salary: [6500, 14000], minYears: 2,
    required: { 'Stakeholder Management': 4, 'UX Research': 3, 'Project Management': 4, 'Data Visualisation': 3, Communication: 4, 'AI Tools': 3 },
    core: ['Stakeholder Management', 'Project Management'],
    demand: { fast: 83, moderate: 77 }, growth: { fast: 19, moderate: 14 }, automationRisk: { fast: 24, moderate: 18 }, sdgs: [9, 8],
  },
  {
    id: 'ux-designer', title: 'UX / Product Designer', stream: 'design',
    blurb: 'Make technology feel obvious to the people using it.',
    description: 'Research user needs, design flows and interfaces, prototype and test. AI speeds up mock-ups; research and judgement differentiate.',
    prospects: 'Healthy demand in fintech and super-apps; generalist visual work faces automation pressure.',
    salary: [4000, 9500], minYears: 0,
    required: { 'UX Research': 4, 'UI Design': 4, Prototyping: 4, 'Visual Design': 3, Communication: 3, 'AI Tools': 2 },
    core: ['UX Research', 'UI Design', 'Prototyping'],
    demand: { fast: 69, moderate: 74 }, growth: { fast: 6, moderate: 12 }, automationRisk: { fast: 41, moderate: 29 }, sdgs: [10, 9],
  },
];

export const careerById = (id: string) => CAREERS.find((c) => c.id === id);

export interface SkillTrend {
  skill: string;
  now: number; // % change in postings 2021->2025
  fast: number; // projected % change to 2030
  moderate: number;
}

export const SKILL_TRENDS: SkillTrend[] = [
  { skill: 'AI Tools', now: 41, fast: 63, moderate: 34 },
  { skill: 'Machine Learning', now: 28, fast: 52, moderate: 29 },
  { skill: 'Cybersecurity', now: 24, fast: 38, moderate: 26 },
  { skill: 'Cloud Computing', now: 22, fast: 33, moderate: 21 },
  { skill: 'Data Visualisation', now: 14, fast: 11, moderate: 17 },
  { skill: 'Python', now: 18, fast: 21, moderate: 19 },
  { skill: 'Stakeholder Mgmt', now: 7, fast: 12, moderate: 9 },
  { skill: 'Manual Bookkeeping', now: -14, fast: -41, moderate: -19 },
  { skill: 'Data Entry', now: -22, fast: -53, moderate: -28 },
  { skill: 'Basic Copywriting', now: -9, fast: -36, moderate: -15 },
];

export interface JobTrend {
  role: string;
  history: number[]; // posting index 2021..2025 (2021=100)
  fast: number; // 2030 index
  moderate: number;
}

export const TREND_YEARS = ['2021', '2022', '2023', '2024', '2025'];

export const JOB_TRENDS: JobTrend[] = [
  { role: 'Cloud Engineer', history: [100, 118, 131, 149, 166], fast: 241, moderate: 208 },
  { role: 'Cyber Analyst', history: [100, 112, 127, 141, 158], fast: 226, moderate: 193 },
  { role: 'ML Engineer', history: [100, 121, 152, 187, 214], fast: 338, moderate: 262 },
  { role: 'Data Analyst', history: [100, 109, 117, 121, 126], fast: 132, moderate: 151 },
  { role: 'Accountant', history: [100, 98, 95, 91, 88], fast: 61, moderate: 81 },
  { role: 'Data Entry Clerk', history: [100, 91, 83, 72, 64], fast: 29, moderate: 47 },
];

export const JOB_SOURCES = [
  { id: 'jobstreet', name: 'Illustrative posting sample A', note: 'Synthetic baseline index, 2021 = 100' },
  { id: 'linkedin', name: 'Illustrative hiring sample B', note: 'Synthetic baseline index, 2021 = 100' },
];

/** second source (LinkedIn-style) — same shape as JOB_TRENDS */
export const JOB_TRENDS_LINKEDIN: JobTrend[] = [
  { role: 'Cloud Engineer', history: [100, 124, 139, 158, 177], fast: 256, moderate: 214 },
  { role: 'Cyber Analyst', history: [100, 109, 122, 138, 151], fast: 219, moderate: 186 },
  { role: 'ML Engineer', history: [100, 129, 163, 201, 233], fast: 352, moderate: 271 },
  { role: 'Data Analyst', history: [100, 113, 119, 124, 131], fast: 128, moderate: 149 },
  { role: 'Accountant', history: [100, 97, 92, 87, 83], fast: 57, moderate: 78 },
  { role: 'Data Entry Clerk', history: [100, 88, 79, 69, 58], fast: 24, moderate: 42 },
];

/** how each SDG is advanced by work and skills (used for hover explanations) */
export const SDG_WHY: Record<number, string> = {
  4: 'Builds the knowledge and literacy others learn from — explaining data, teaching tools and spreading skills.',
  5: 'Shapes fair hiring, pay and progression so opportunity is not decided by gender.',
  8: 'Creates productive, decent jobs and keeps Malaysian firms competitive as AI reshapes work.',
  9: 'Powers the digital infrastructure and innovation that new industries are built on.',
  10: 'Designs services and workplaces that include people who are usually left out.',
  11: 'Supports resilient, connected cities and the public systems they run on.',
  12: 'Encourages honest marketing and responsible consumption choices.',
  16: 'Protects institutions, data and money from fraud, attack and misuse.',
};

/** Explicit demo assumption, applied consistently in every workspace. */
export function careerInScenario(c: Career | undefined, scenario: Scenario): Career | undefined {
 if (!c) return undefined;
 const base = CAREERS.find(x => x.id === c.id) ?? c;
 const growing = ['AI Tools','Python','SQL','Machine Learning','Data Visualisation','Cloud Computing'];
 return {...base,required:Object.fromEntries(Object.entries(base.required).map(([skill,n])=>[skill,Math.min(5,n+(scenario==='fast'&&growing.includes(skill)?1:0))]))};
}
