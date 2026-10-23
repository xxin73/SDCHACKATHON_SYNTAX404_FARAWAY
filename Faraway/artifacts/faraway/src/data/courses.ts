import expanded from './expanded-catalogue.json';
import {PATHWAY_COURSES} from '../../../../supabase/functions/faraway-recommendations/pathways';
export type Category = 'Programming' | 'AI & Machine Learning' | 'Design' | 'Science' | 'Business' | 'Mathematics';
export const CATEGORIES: Category[] = ['Programming', 'AI & Machine Learning', 'Design', 'Science', 'Business', 'Mathematics'];

export type Level = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Course {
  version?:string; resourceUrl?:string; sourceType?:string; activityTitles?:string[];
  id: string;
  title: string;
  category: Category;
  level: Level;
  hours: number;
  description: string;
  skills: string[];
  cost: number; // MYR, 0 = free
  hrdc: boolean;
  online: boolean;
  delivery?: 'online'|'in-person'|'hybrid';
  hrdcVerifiedUrl?: string;
  setting: 'indoor' | 'outdoor';
  instructor: string;
  provider: string;
  rating: number;
  learners: number;
  hue: number;
}

export const COURSES: Course[] = [
  { id: 'python-programming', title: 'Python Programming', category: 'Programming', level: 'Beginner', hours: 14, description: 'Build your coding foundation with Python, from variables to a working final project.', skills: ['Python', 'Problem Solving'], cost: 0, hrdc: false, online: true, setting: 'indoor', instructor: 'Dr. Aisyah Rahman', provider: 'Faraway Academy', rating: 4.8, learners: 12684, hue: 44 },
  { id: 'sql-for-analysts', title: 'SQL for Analysts', category: 'Programming', level: 'Beginner', hours: 10, description: 'Query real retail and banking datasets with joins, window functions and CTEs.', skills: ['SQL'], cost: 89, hrdc: false, online: true, setting: 'indoor', instructor: 'Kelvin Ong', provider: 'Kuala Lumpur Data School', rating: 4.7, learners: 8421, hue: 200 },
  { id: 'modern-javascript', title: 'Modern JavaScript & Web Apps', category: 'Programming', level: 'Intermediate', hours: 26, description: 'ES2023, async patterns, and a deployed React project you can show employers.', skills: ['JavaScript', 'Git & DevOps'], cost: 249, hrdc: false, online: true, setting: 'indoor', instructor: 'Priya Nair', provider: 'Penang Code Collective', rating: 4.6, learners: 5133, hue: 52 },
  { id: 'cloud-foundations', title: 'Cloud Foundations (AWS & Azure)', category: 'Programming', level: 'Intermediate', hours: 22, description: 'Compute, storage, networking and infrastructure-as-code with hands-on labs.', skills: ['Cloud Computing', 'Git & DevOps'], cost: 420, hrdc: false, online: false, setting: 'indoor', instructor: 'Hafiz Zulkifli', provider: 'Cyberjaya Tech Institute', rating: 4.7, learners: 3290, hue: 190 },
  { id: 'cyber-defence', title: 'Cyber Defence Essentials', category: 'Programming', level: 'Intermediate', hours: 18, description: 'Threat modelling, SOC workflows, incident response drills and capture-the-flag labs.', skills: ['Cybersecurity'], cost: 380, hrdc: false, online: false, setting: 'outdoor', instructor: 'Nurul Huda Ismail', provider: 'CyberSecurity Malaysia Partner', rating: 4.8, learners: 2764, hue: 352 },
  { id: 'ml-fundamentals', title: 'Machine Learning Fundamentals', category: 'AI & Machine Learning', level: 'Intermediate', hours: 30, description: 'Regression, classification, evaluation and deploying a model with scikit-learn.', skills: ['Machine Learning', 'Python', 'Statistics'], cost: 299, hrdc: false, online: true, setting: 'indoor', instructor: 'Prof. Lim Wei Jie', provider: 'Faraway Academy', rating: 4.9, learners: 6942, hue: 268 },
  { id: 'ai-at-work', title: 'AI Tools at Work', category: 'AI & Machine Learning', level: 'Beginner', hours: 6, description: 'Prompting, verification and responsible use of AI copilots for everyday tasks.', skills: ['AI Tools'], cost: 0, hrdc: false, online: true, setting: 'indoor', instructor: 'Sarah Tan', provider: 'Faraway Academy', rating: 4.6, learners: 18205, hue: 280 },
  { id: 'llm-applications', title: 'Building with Large Language Models', category: 'AI & Machine Learning', level: 'Advanced', hours: 24, description: 'Retrieval, evaluation, guardrails and shipping an LLM feature end to end.', skills: ['Machine Learning', 'AI Tools', 'Python'], cost: 520, hrdc: false, online: true, setting: 'indoor', instructor: 'Arjun Menon', provider: 'Faraway Academy', rating: 4.7, learners: 2148, hue: 300 },
  { id: 'ux-research', title: 'UX Research in Practice', category: 'Design', level: 'Beginner', hours: 12, description: 'Interviews, usability tests and synthesis, with field sessions at real local businesses.', skills: ['UX Research', 'Communication'], cost: 150, hrdc: false, online: false, setting: 'outdoor', instructor: 'Mei Ling Chow', provider: 'Studio Selatan', rating: 4.8, learners: 1987, hue: 330 },
  { id: 'interface-design', title: 'Interface Design & Prototyping', category: 'Design', level: 'Intermediate', hours: 20, description: 'Design systems, layout, typography and interactive Figma prototypes.', skills: ['UI Design', 'Prototyping', 'Visual Design'], cost: 199, hrdc: false, online: true, setting: 'indoor', instructor: 'Daniel Yap', provider: 'Studio Selatan', rating: 4.7, learners: 3410, hue: 15 },
  { id: 'data-viz', title: 'Data Visualisation & Storytelling', category: 'Design', level: 'Beginner', hours: 9, description: 'Chart choice, dashboards in Power BI and presenting insight to decision makers.', skills: ['Data Visualisation', 'Communication'], cost: 0, hrdc: false, online: true, setting: 'indoor', instructor: 'Farah Aziz', provider: 'Faraway Academy', rating: 4.6, learners: 7802, hue: 170 },
  { id: 'climate-science', title: 'Climate Science for Professionals', category: 'Science', level: 'Beginner', hours: 8, description: 'Carbon accounting basics and ESG disclosure for Bursa-listed companies.', skills: ['Risk Management', 'Communication'], cost: 0, hrdc: false, online: true, setting: 'outdoor', instructor: 'Dr. Ravi Subramaniam', provider: 'Universiti Pantai Timur', rating: 4.5, learners: 2311, hue: 140 },
  { id: 'astro-data', title: 'Astronomy with Data', category: 'Science', level: 'Intermediate', hours: 16, description: 'Analyse real telescope catalogues with Python and night-sky observation sessions.', skills: ['Python', 'Statistics'], cost: 120, hrdc: false, online: false, setting: 'outdoor', instructor: 'Dr. Siti Mariam', provider: 'Langkawi Observatory Program', rating: 4.9, learners: 964, hue: 230 },
  { id: 'financial-modelling', title: 'Financial Modelling in Excel', category: 'Business', level: 'Intermediate', hours: 15, description: 'Three-statement models, DCF valuation and scenario analysis.', skills: ['Financial Modelling', 'Excel'], cost: 340, hrdc: false, online: true, setting: 'indoor', instructor: 'Jason Lee CFA', provider: 'KL Finance Academy', rating: 4.7, learners: 4120, hue: 38 },
  { id: 'project-leadership', title: 'Agile Project Leadership', category: 'Business', level: 'Beginner', hours: 11, description: 'Scrum, stakeholder mapping and running a team retrospective that actually works.', skills: ['Project Management', 'Stakeholder Management'], cost: 210, hrdc: false, online: false, setting: 'indoor', instructor: 'Amanda Teoh', provider: 'Penang Skills Development Centre', rating: 4.5, learners: 2893, hue: 25 },
  { id: 'growth-marketing', title: 'Growth & Digital Marketing', category: 'Business', level: 'Beginner', hours: 13, description: 'Performance campaigns, SEO, analytics and AI-assisted content workflows.', skills: ['Digital Marketing', 'AI Tools'], cost: 95, hrdc: false, online: true, setting: 'indoor', instructor: 'Hannah Goh', provider: 'Faraway Academy', rating: 4.4, learners: 5370, hue: 340 },
  { id: 'accounting-ai', title: 'Accounting in the Age of AI', category: 'Business', level: 'Intermediate', hours: 12, description: 'Automated reconciliation, audit analytics and the shift to advisory work.', skills: ['Accounting', 'AI Tools'], cost: 180, hrdc: false, online: true, setting: 'indoor', instructor: 'Rosli Hamzah CA', provider: 'MIA Learning Partner', rating: 4.5, learners: 1832, hue: 60 },
  { id: 'statistics', title: 'Statistics You Will Actually Use', category: 'Mathematics', level: 'Beginner', hours: 12, description: 'Distributions, hypothesis tests and A/B experiments with worked examples.', skills: ['Statistics'], cost: 0, hrdc: false, online: true, setting: 'indoor', instructor: 'Dr. Tan Hui Min', provider: 'Faraway Academy', rating: 4.7, learners: 9214, hue: 210 },
  { id: 'linear-algebra', title: 'Linear Algebra for Machine Learning', category: 'Mathematics', level: 'Advanced', hours: 18, description: 'Vectors, matrices, eigen-decomposition and gradient intuition.', skills: ['Machine Learning', 'Statistics'], cost: 160, hrdc: false, online: true, setting: 'indoor', instructor: 'Prof. Lim Wei Jie', provider: 'Faraway Academy', rating: 4.8, learners: 3015, hue: 250 },
  { id: 'risk-quant', title: 'Quantitative Risk Management', category: 'Mathematics', level: 'Advanced', hours: 20, description: 'VaR, stress testing and credit models aligned with BNM guidelines.', skills: ['Risk Management', 'Statistics'], cost: 460, hrdc: false, online: false, setting: 'indoor', instructor: 'Dr. Kumar Pillai', provider: 'KL Finance Academy', rating: 4.6, learners: 1206, hue: 5 },
];

COURSES.push(...PATHWAY_COURSES as unknown as Course[],...expanded.courses as unknown as Course[]);

export const courseById = (id: string) => COURSES.find((c) => c.id === id);

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  summary: string;
  points: string[];
  code?: string;
}

export const PYTHON_LESSONS: Lesson[] = [
  { id: 'intro', title: 'Introduction to Python', duration: '12:34', summary: 'Why Python powers data, AI and automation, and how to run your first program.', points: ['Install Python 3.12 and VS Code', 'Use the interactive REPL', 'Write and run a .py file'], code: 'print("Selamat datang ke Faraway!")' },
  { id: 'variables', title: 'Variables', duration: '15:20', summary: 'Store and update values with names that explain themselves.', points: ['Assignment and reassignment', 'Naming conventions (snake_case)', 'Multiple assignment'], code: 'city = "Kuching"\nyears_coding = 0\nyears_coding += 1' },
  { id: 'types', title: 'Data Types', duration: '14:05', summary: 'Numbers, strings and booleans, and how to convert between them.', points: ['int, float, str, bool', 'Type conversion', 'f-strings for formatting'], code: 'salary = 4200.50\nprint(f"RM {salary:,.2f}")' },
  { id: 'control', title: 'Control Flow', duration: '18:45', summary: 'Make decisions and repeat work with if, for and while.', points: ['if / elif / else', 'for loops over ranges', 'break and continue'], code: 'for score in [62, 78, 91]:\n    if score >= 75:\n        print("strong match")' },
  { id: 'functions', title: 'Functions', duration: '16:32', summary: 'Package logic into reusable, testable pieces.', points: ['def, parameters and return', 'Default and keyword arguments', 'Docstrings'], code: 'def match(skill, interest):\n    return 100 * (0.65 * skill + 0.15 * interest)' },
  { id: 'lists', title: 'Lists and Tuples', duration: '14:12', summary: 'Ordered collections, slicing and comprehension.', points: ['Indexing and slicing', 'List comprehensions', 'When to use tuples'], code: 'skills = ["SQL", "Python", "Excel"]\nupper = [s.upper() for s in skills]' },
  { id: 'dicts', title: 'Dictionaries', duration: '17:08', summary: 'Key-value data, the shape of most real-world records.', points: ['Create, read, update', 'Iterating items', 'Nested dictionaries'], code: 'profile = {"name": "Aina", "level": 3}\nprofile["level"] += 1' },
  { id: 'modules', title: 'Modules', duration: '12:55', summary: 'Import the standard library and third-party packages.', points: ['import and from-import', 'pip and virtual environments', 'Organising your own modules'], code: 'import statistics\nstatistics.mean([3, 4, 5])' },
  { id: 'project', title: 'Final Project', duration: '20:10', summary: 'Build a career-match calculator that reads a CSV of skills and ranks jobs.', points: ['Read CSV input', 'Compute weighted scores', 'Present a ranked report'], code: 'import csv\nwith open("skills.csv") as f:\n    rows = list(csv.DictReader(f))' },
];

export const PYTHON_RESOURCES = [
  { name: 'Python cheat sheet', type: 'PDF', size: '412 KB', content: 'Faraway Python Cheat Sheet\n\nprint(), variables, types, if/for/while, def, lists, dicts, import.\n' },
  { name: 'Lesson notebooks', type: 'IPYNB', size: '1.2 MB', content: '# Faraway sample notebook placeholder\nprint("hello")\n' },
  { name: 'Final project dataset', type: 'CSV', size: '38 KB', content: 'name,skill,level\nAina,Python,3\nAina,SQL,2\n' },
];

/** Generic syllabus used for courses that are not fully authored yet */
export function genericLessons(c: Course): Lesson[] {
  const s = c.skills[0];
  return [
    { id: 'l1', title: `Orientation: ${c.title}`, duration: '09:40', summary: `What you will build and how ${s} is used in Malaysian workplaces today.`, points: ['Course map', 'Tools setup', 'Meet your cohort'] },
    { id: 'l2', title: `${s} fundamentals`, duration: '18:20', summary: `Core concepts of ${s}.`, points: ['Key vocabulary', 'Worked example', 'Practice set'] },
    { id: 'l3', title: 'Applied workshop', duration: '24:05', summary: 'A guided, realistic scenario.', points: ['Brief', 'Build', 'Review'] },
    { id: 'l4', title: 'Capstone and reflection', duration: '21:30', summary: 'Pull it together into a portfolio piece.', points: ['Capstone brief', 'Peer review', 'Next steps'] },
  ];
}
