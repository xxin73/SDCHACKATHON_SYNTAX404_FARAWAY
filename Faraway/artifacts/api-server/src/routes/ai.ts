import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  ParseCvBody,
  ParseCvResponse,
  GetCareerInsightBody,
  GetCareerInsightResponse,
  GenerateStudyPlanBody,
  GenerateStudyPlanResponse,
} from "@workspace/api-zod";
import { extractCvText } from "../lib/cv-text";

const router: IRouter = Router();

const MODEL = "gpt-5.4-mini";

async function askJson(system: string, user: string): Promise<unknown> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    max_completion_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned an empty response");
  return JSON.parse(content);
}

function fail(req: Request, res: Response, err: unknown, msg: string) {
  req.log.error({ err }, msg);
  res.status(502).json({ error: msg });
}

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(str(v));
  return Number.isFinite(n) ? n : 0;
};
const edu = (v: unknown) => {
  const o = (v ?? {}) as Record<string, unknown>;
  return { field: str(o.field), institution: str(o.institution), year: str(o.year) };
};

/** Coerce the model's loosely-typed CV output into the strict response shape. */
function normaliseCv(raw: unknown) {
  const o = (raw ?? {}) as Record<string, unknown>;
  const highestOpts = ["SPM", "Diploma", "Degree", "Masters", "PhD"] as const;
  const streamOpts = ["cs", "finance", "business", "design"] as const;
  const highest = highestOpts.find((h) => h.toLowerCase() === str(o.highest).toLowerCase()) ?? "Degree";
  const suggestedStream = streamOpts.find((s) => s === str(o.suggestedStream).toLowerCase()) ?? "cs";
  const roles = Array.isArray(o.roles)
    ? o.roles.map((r) => {
        const x = (r ?? {}) as Record<string, unknown>;
        return { title: str(x.title), company: str(x.company), years: Math.max(0, num(x.years)) };
      })
    : [];
  const skills = Array.isArray(o.skills)
    ? o.skills
        .map((s) => {
          const x = (s ?? {}) as Record<string, unknown>;
          return {
            name: str(x.name).trim(),
            level: Math.min(5, Math.max(1, Math.round(num(x.level) || 1))),
            evidence: x.evidence ? str(x.evidence) : undefined,
          };
        })
        .filter((s) => s.name)
    : [];
  return ParseCvResponse.parse({
    name: str(o.name),
    email: str(o.email),
    location: str(o.location),
    summary: str(o.summary),
    highest,
    years: Math.max(0, num(o.years)),
    roles,
    ug: edu(o.ug),
    pg: edu(o.pg),
    phd: edu(o.phd),
    skills,
    suggestedStream,
    missing: Array.isArray(o.missing) ? o.missing.map(str).filter(Boolean) : [],
  });
}

router.post("/ai/parse-cv", async (req, res) => {
  const parsed = ParseCvBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid CV input" });
    return;
  }
  const body = parsed.data;

  let text: string;
  try {
    text = body.contentBase64
      ? await extractCvText(body.contentBase64, body.fileName, body.mimeType)
      : (body.text ?? "");
  } catch (err) {
    req.log.warn({ err }, "CV text extraction failed");
    res.status(400).json({ error: "Could not read this file. Please upload a PDF, DOCX or TXT CV." });
    return;
  }
  text = text.replace(/\s+\n/g, "\n").trim().slice(0, 30000);
  if (text.length < 30) {
    res.status(400).json({ error: "The CV appears to be empty or is a scanned image without text." });
    return;
  }

  const vocab = (body.knownSkills ?? []).join(", ");
  const system = `You extract structured profile data from CVs for Faraway, a Malaysian career guidance app.
Return ONLY a JSON object with keys:
name, email, location, summary (2 sentences, third person), highest (one of SPM, Diploma, Degree, Masters, PhD — highest completed qualification),
years (total years of work experience, number, internships count as fractions),
roles (array of {title, company, years}),
ug, pg, phd (each {field, institution, year}; use empty strings when absent),
skills (array of {name, level 1-5, evidence}: level 1 = aware, 3 = practical use, 5 = expert; base on evidence in the CV),
suggestedStream (one of cs, finance, business, design),
missing (array of human-readable profile fields the CV does not cover, e.g. "Location", "Postgraduate education", "Work experience").
${vocab ? `When a skill matches one of these names, use the exact name: ${vocab}. Include other notable skills too.` : ""}
Never invent facts. Use empty strings when unknown.`;

  try {
    const raw = await askJson(system, `CV text:\n"""\n${text}\n"""`);
    res.json(normaliseCv(raw));
  } catch (err) {
    fail(req, res, err, "AI could not analyse this CV. Please try again.");
  }
});

router.post("/ai/career-insight", async (req, res) => {
  const parsed = GetCareerInsightBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid insight input" });
    return;
  }
  const b = parsed.data;
  const system = `You are Faraway's career analyst for Malaysian graduates and workers facing AI disruption.
Scenario meanings: "moderate" = AI adoption grows steadily, most roles evolve gradually; "fast" = rapid AI adoption, routine tasks automated quickly, demand shifts sharply toward AI-adjacent skills.
Be specific, warm and concise. Reference the Malaysian context (e.g. MDEC, HRD Corp, local industries) where relevant.
Return ONLY JSON: { "headline": short punchy line (max 12 words), "scenarioExplanation": 2-3 sentences on how this career changes under the given scenario, "fitSummary": 2 sentences on the person's fit given skills and gaps, "sdgImpact": 2 sentences on how this career contributes to the listed UN SDGs, "actions": 3-4 short concrete next steps }`;
  const user = JSON.stringify(b);
  try {
    const raw = (await askJson(system, user)) as Record<string, unknown>;
    res.json(
      GetCareerInsightResponse.parse({
        headline: str(raw.headline),
        scenarioExplanation: str(raw.scenarioExplanation),
        fitSummary: str(raw.fitSummary),
        sdgImpact: str(raw.sdgImpact),
        actions: Array.isArray(raw.actions) ? raw.actions.map(str).filter(Boolean) : [],
      }),
    );
  } catch (err) {
    fail(req, res, err, "AI insight is unavailable right now. Please try again.");
  }
});

router.post("/ai/study-plan", async (req, res) => {
  const parsed = GenerateStudyPlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid study plan input" });
    return;
  }
  const b = parsed.data;
  const system = `You are Faraway's learning planner. Build a realistic study plan for a Malaysian learner.
Respect their minutes per day, setting preference (indoor/outdoor/either) and cost preference (free, low = under RM200, hrdc = HRD Corp claimable, any).
Order skills so the largest and most job-critical gaps come first. Under the "fast" AI scenario, emphasise AI-adjacent practice.
Return ONLY JSON: { "overview": 2 sentences, "totalWeeks": number, "modules": [ { "skill": exact skill name from input, "weeks": number, "why": one sentence, "steps": [ { "title": short sub-topic, "hours": number } ] (3-5 steps), "resource": a named, real course or resource type that fits the cost preference } ] }`;
  try {
    const raw = (await askJson(system, JSON.stringify(b))) as Record<string, unknown>;
    const modules = Array.isArray(raw.modules)
      ? raw.modules.map((m) => {
          const x = (m ?? {}) as Record<string, unknown>;
          return {
            skill: str(x.skill),
            weeks: Math.max(1, num(x.weeks)),
            why: str(x.why),
            steps: Array.isArray(x.steps)
              ? x.steps.map((s) => {
                  const y = (s ?? {}) as Record<string, unknown>;
                  return { title: str(y.title), hours: Math.max(0.5, num(y.hours)) };
                })
              : [],
            resource: str(x.resource),
          };
        })
      : [];
    res.json(
      GenerateStudyPlanResponse.parse({
        overview: str(raw.overview),
        totalWeeks: Math.max(1, num(raw.totalWeeks) || modules.reduce((a, m) => a + m.weeks, 0)),
        modules,
      }),
    );
  } catch (err) {
    fail(req, res, err, "AI study plan is unavailable right now. Please try again.");
  }
});

export default router;
