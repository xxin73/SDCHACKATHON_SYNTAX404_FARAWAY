export type SdgGoal = { n: number; title: string; description: string; url: string };

const rows: [string, string][] = [
  ['No Poverty', "End poverty in all its forms everywhere."],
  ['Zero Hunger', "End hunger, achieve food security and improved nutrition and promote sustainable agriculture."],
  ['Good Health and Well-being', "Ensure healthy lives and promote well-being for all at all ages."],
  ['Quality Education', "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all."],
  ['Gender Equality', "Achieve gender equality and empower all women and girls."],
  ['Clean Water and Sanitation', "Ensure availability and sustainable management of water and sanitation for all."],
  ['Affordable and Clean Energy', "Ensure access to affordable, reliable, sustainable and modern energy for all."],
  ['Decent Work and Economic Growth', "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all."],
  ['Industry, Innovation and Infrastructure', "Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation."],
  ['Reduced Inequalities', "Reduce inequality within and among countries."],
  ['Sustainable Cities and Communities', "Make cities and human settlements inclusive, safe, resilient and sustainable."],
  ['Responsible Consumption and Production', "Ensure sustainable consumption and production patterns."],
  ['Climate Action', "Take urgent action to combat climate change and its impacts."],
  ['Life Below Water', "Conserve and sustainably use the oceans, seas and marine resources for sustainable development."],
  ['Life on Land', "Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss."],
  ['Peace, Justice and Strong Institutions', "Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels."],
  ['Partnerships for the Goals', "Strengthen the means of implementation and revitalize the Global Partnership for Sustainable Development."],
];

export const SDG_GOALS: SdgGoal[] = rows.map(([title, description], i) => ({
  n: i + 1, title, description, url: `https://sdgs.un.org/goals/goal${i + 1}`,
}));

/** Node positions (percent of the map) on a slightly irregular ellipse. */
export const SDG_POS = SDG_GOALS.map((_, i) => {
  const a = ((-90 + (i * 360) / 17) * Math.PI) / 180;
  const f = i % 2 ? 0.9 : 1;
  const x = Math.min(93, Math.max(7, 50 + 45 * f * Math.cos(a)));
  const y = Math.min(92, Math.max(8, 50 + 42 * f * Math.sin(a)));
  return { x: +x.toFixed(2), y: +y.toFixed(2) };
});

export const SDG_EDGES: [number, number][] = (() => {
  const s = new Set<string>(); const out: [number, number][] = [];
  const add = (a: number, b: number) => { const k = a < b ? `${a}-${b}` : `${b}-${a}`; if (a !== b && !s.has(k)) { s.add(k); out.push([a, b]); } };
  for (let i = 0; i < 17; i++) {
    add(i, (i + 1) % 17);
    if (i % 2 === 0) add(i, (i + 3) % 17);
    if (i % 3 === 0) add(i, (i + 7) % 17);
    if (i % 4 === 1) add(i, (i + 5) % 17);
  }
  return out;
})();
