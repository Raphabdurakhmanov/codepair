// AI Team Builder: free-text idea → roles, tech, domains.
// Uses Google Gemini (free tier) when GEMINI_API_KEY is set; otherwise a keyword fallback.

import { ROLES, SKILLS, INTERESTS, cleanInterests, cleanRoles, cleanSkills } from "./catalog";

export interface TeamPlan {
  title: string;
  description: string;
  needed_roles: string[];
  tech: string[];
  interests: string[];
  source: "ai" | "fallback";
}

const LANG: Record<string, string> = { ru: "Russian", en: "English", uz: "Uzbek (Latin script)" };

export async function buildTeamPlan(idea: string, locale: string): Promise<TeamPlan> {
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      return await geminiPlan(idea, locale, key);
    } catch (e) {
      console.error("Gemini failed, using fallback", e);
    }
  }
  return keywordPlan(idea);
}

async function geminiPlan(idea: string, locale: string, key: string): Promise<TeamPlan> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `You help students form balanced project teams.
Given a project idea, choose the roles, technologies and domains needed for a realistic student MVP built in one semester.
Prefer a small complementary team (3-6 roles), not several people with the same role.
For security projects use security roles (pentest, soc, appsec, forensics, malware, cti, grc, ...).
Use ONLY ids from these lists:
roles: ${ROLES.join(", ")}
tech: ${SKILLS.map((s) => s.id).join(", ")}
domains: ${INTERESTS.join(", ")}
Write "title" (max 80 chars) and "description" (2-3 sentences: problem, MVP scope) in ${LANG[locale] ?? "Russian"}.
Idea: """${idea.slice(0, 2000)}"""`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            description: { type: "STRING" },
            needed_roles: { type: "ARRAY", items: { type: "STRING" } },
            tech: { type: "ARRAY", items: { type: "STRING" } },
            interests: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["title", "description", "needed_roles", "tech", "interests"],
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = JSON.parse(text);
  const plan: TeamPlan = {
    title: String(parsed.title ?? "").slice(0, 120),
    description: String(parsed.description ?? "").slice(0, 1500),
    needed_roles: cleanRoles(parsed.needed_roles ?? []),
    tech: cleanSkills(parsed.tech ?? []),
    interests: cleanInterests(parsed.interests ?? []),
    source: "ai",
  };
  if (plan.needed_roles.length === 0) throw new Error("empty roles");
  return plan;
}

// ---- keyword fallback (works without any API key) ----

const RULES: { re: RegExp; roles?: string[]; tech?: string[]; interests?: string[] }[] = [
  { re: /(?:^|[^a-z])(ai|ml|gpt|llm)(?![a-z])|(?:^|[^а-яё])ии(?![а-яё])|нейро|искусствен|sun.?iy|machine learning|chat ?bot|чат-?бот/i, roles: ["ml"], tech: ["python", "llm"], interests: ["ai"] },
  { re: /(экзам|учеб|студент|школ|курс|образов|exam|study|learn|educat|ta.?lim|imtihon|o.?quv)/i, interests: ["edtech"] },
  { re: /(мобил|прилож|android|ios|mobile|app\b|ilova)/i, roles: ["mobile"], tech: ["flutter"] },
  { re: /(сайт|веб|web|site|платформ|platform|portal|sayt)/i, roles: ["frontend", "backend"], tech: ["react", "nextjs", "postgresql"] },
  { re: /(дан|аналит|data|analytic|dashboard|дашборд|statist|ma.?lumot)/i, roles: ["data"], tech: ["python", "pandas", "sql"] },
  { re: /(оплат|плат[её]ж|финанс|банк|pay|fintech|finance|bank|to.?lov)/i, interests: ["fintech"] },
  { re: /(здоров|медиц|врач|health|medic|doctor|sog.?liq|shifokor)/i, interests: ["health"] },
  { re: /(магазин|маркетплейс|shop|store|market|e-?commerce|do.?kon)/i, interests: ["ecommerce"] },
  { re: /(игр|game|o.?yin)/i, interests: ["games"], tech: ["csharp"] },
  { re: /(эколог|климат|отход|eco|climate|waste|ekolog)/i, interests: ["ecology"] },
  { re: /(туризм|путешеств|travel|tour|sayohat)/i, interests: ["travel"] },
  { re: /(iot|arduino|датчик|сенсор|sensor|raspberry)/i, interests: ["hardware"], tech: ["cpp"] },
  { re: /(telegram|телеграм|бот|bot)/i, roles: ["backend"], tech: ["python"] },
  { re: /(кибер|безопасн|уязвим|пентест|взлом|ctf|htb|hack|security|vulnerab|pentest|phishing|фишинг|xavfsiz|zaiflik)/i, roles: ["pentest", "soc", "appsec"], tech: ["linux", "owasp", "burp"], interests: ["cybersecurity"] },
  { re: /(siem|soc|инцидент|incident|лог|log monitoring|threat)/i, roles: ["soc", "cti"], tech: ["siem", "wireshark"], interests: ["cybersecurity"] },
  { re: /(малвар|вредонос|malware|реверс|reverse|forensic|форензик)/i, roles: ["malware", "forensics"], tech: ["ghidra", "c"], interests: ["cybersecurity"] },
  { re: /(облак|cloud|aws|azure|kubernetes|k8s|devops|инфраструкт|infrastructure)/i, roles: ["devops", "cloud"], tech: ["docker", "kubernetes", "terraform"] },
  { re: /(блокчейн|blockchain|web3|крипто|crypto|nft|smart.?contract|смарт.?контракт)/i, roles: ["blockchain"], tech: ["solidity"], interests: ["blockchain"] },
  { re: /(unity|unreal|игров|геймдев|gamedev)/i, roles: ["gamedev"], tech: ["unity", "csharp"], interests: ["games"] },
  { re: /(ios|iphone|swift)/i, roles: ["ios"], tech: ["swift"] },
  { re: /(android|kotlin)/i, roles: ["android"], tech: ["kotlin"] },
];

export function keywordPlan(idea: string): TeamPlan {
  const roles = new Set<string>(["product", "uiux"]);
  const tech = new Set<string>(["figma", "git"]);
  const interests = new Set<string>();
  for (const r of RULES) {
    if (r.re.test(idea)) {
      r.roles?.forEach((x) => roles.add(x));
      r.tech?.forEach((x) => tech.add(x));
      r.interests?.forEach((x) => interests.add(x));
    }
  }
  if (!["frontend", "backend", "mobile", "fullstack"].some((x) => roles.has(x))) {
    roles.add("fullstack");
    ["react", "nodejs", "postgresql"].forEach((x) => tech.add(x));
  }
  const first = idea.trim().split(/[.!?\n]/)[0].slice(0, 80);
  return {
    title: first,
    description: idea.trim().slice(0, 1500),
    needed_roles: cleanRoles([...roles]),
    tech: cleanSkills([...tech]),
    interests: cleanInterests([...interests]),
    source: "fallback",
  };
}
