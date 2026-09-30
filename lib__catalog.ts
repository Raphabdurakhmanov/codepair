// Shared vocabulary for profiles, projects and matching.
// IDs are stored in the database; labels come from i18n dictionaries (roles, interests)
// or are shown as-is (skills are technology names).

export const ROLES = [
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "ml",
  "data",
  "uiux",
  "product",
  "devops",
  "qa",
  "marketing",
] as const;
export type Role = (typeof ROLES)[number];

export const SKILLS: { id: string; label: string }[] = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "react", label: "React" },
  { id: "nextjs", label: "Next.js" },
  { id: "vue", label: "Vue" },
  { id: "html-css", label: "HTML/CSS" },
  { id: "nodejs", label: "Node.js" },
  { id: "fastapi", label: "FastAPI" },
  { id: "django", label: "Django" },
  { id: "java", label: "Java" },
  { id: "kotlin", label: "Kotlin" },
  { id: "swift", label: "Swift" },
  { id: "flutter", label: "Flutter" },
  { id: "go", label: "Go" },
  { id: "csharp", label: "C#" },
  { id: "cpp", label: "C++" },
  { id: "php", label: "PHP" },
  { id: "sql", label: "SQL" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "mongodb", label: "MongoDB" },
  { id: "docker", label: "Docker" },
  { id: "git", label: "Git" },
  { id: "pytorch", label: "PyTorch" },
  { id: "tensorflow", label: "TensorFlow" },
  { id: "pandas", label: "Pandas" },
  { id: "llm", label: "LLM / Prompting" },
  { id: "figma", label: "Figma" },
  { id: "product-mgmt", label: "Product management" },
  { id: "smm", label: "SMM" },
];

export const INTERESTS = [
  "edtech",
  "ai",
  "fintech",
  "health",
  "ecommerce",
  "social",
  "games",
  "gov",
  "ecology",
  "travel",
  "productivity",
  "hardware",
] as const;

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

const skillIds = new Set(SKILLS.map((s) => s.id));
const roleIds = new Set<string>(ROLES);
const interestIds = new Set<string>(INTERESTS);

export const skillLabel = (id: string) => SKILLS.find((s) => s.id === id)?.label ?? id;
export const isRole = (v: string) => roleIds.has(v);

/** Keep only known values (protects DB from arbitrary input). */
export const cleanRoles = (v: string[]) => [...new Set(v.filter((x) => roleIds.has(x)))];
export const cleanSkills = (v: string[]) => [...new Set(v.filter((x) => skillIds.has(x)))];
export const cleanInterests = (v: string[]) => [...new Set(v.filter((x) => interestIds.has(x)))];

/** Map GitHub "language" names to our skill ids. */
export function githubLanguageToSkill(lang: string): string | null {
  const map: Record<string, string> = {
    Python: "python",
    "Jupyter Notebook": "python",
    JavaScript: "javascript",
    TypeScript: "typescript",
    HTML: "html-css",
    CSS: "html-css",
    SCSS: "html-css",
    Vue: "vue",
    Java: "java",
    Kotlin: "kotlin",
    Swift: "swift",
    Dart: "flutter",
    Go: "go",
    "C#": "csharp",
    "C++": "cpp",
    C: "cpp",
    PHP: "php",
    PLpgSQL: "sql",
    TSQL: "sql",
    Dockerfile: "docker",
  };
  return map[lang] ?? null;
}
