// Shared vocabulary for profiles, projects and matching.
// IDs are stored in the database; labels come from i18n dictionaries (roles, interests)
// or are shown as-is (skills are technology names).

export const ROLE_GROUPS: { id: string; roles: string[] }[] = [
  { id: "dev", roles: ["frontend", "backend", "fullstack", "mobile", "ios", "android", "gamedev", "embedded", "blockchain", "arvr", "architect", "teamlead"] },
  { id: "data", roles: ["ml", "ai_engineer", "data_scientist", "data_engineer", "data", "bi", "mlops"] },
  { id: "security", roles: ["pentest", "soc", "security_engineer", "appsec", "cloud_security", "forensics", "malware", "cti", "grc", "iam", "crypto", "ctf"] },
  { id: "infra", roles: ["devops", "sre", "cloud", "sysadmin", "network", "dba", "support"] },
  { id: "qa", roles: ["qa", "qa_automation", "performance"] },
  { id: "product", roles: ["uiux", "graphic", "product", "project_manager", "scrum", "business_analyst", "system_analyst"] },
  { id: "other", roles: ["tech_writer", "devrel", "marketing", "it_recruiter", "mentor"] },
];

export const ROLES: string[] = ROLE_GROUPS.flatMap((g) => g.roles);
export type Role = string;

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
  { id: "c", label: "C" },
  { id: "rust", label: "Rust" },
  { id: "solidity", label: "Solidity" },
  { id: "unity", label: "Unity" },
  { id: "kubernetes", label: "Kubernetes" },
  { id: "terraform", label: "Terraform" },
  { id: "aws", label: "AWS" },
  { id: "azure", label: "Azure" },
  { id: "gcp", label: "Google Cloud" },
  { id: "linux", label: "Linux" },
  { id: "bash", label: "Bash / PowerShell" },
  { id: "networking", label: "Networking / TCP-IP" },
  { id: "burp", label: "Burp Suite" },
  { id: "nmap", label: "Nmap" },
  { id: "metasploit", label: "Metasploit" },
  { id: "wireshark", label: "Wireshark" },
  { id: "siem", label: "SIEM (Splunk / ELK)" },
  { id: "owasp", label: "OWASP Top 10" },
  { id: "ghidra", label: "Ghidra / IDA" },
  { id: "kali", label: "Kali Linux" },
  { id: "selenium", label: "Selenium / Playwright" },
  { id: "power-bi", label: "Power BI / Tableau" },
  { id: "jira", label: "Jira / Agile" },
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
  "cybersecurity",
  "blockchain",
  "devtools",
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
    C: "c",
    PHP: "php",
    PLpgSQL: "sql",
    TSQL: "sql",
    Dockerfile: "docker",
    Rust: "rust",
    Solidity: "solidity",
    Shell: "bash",
    PowerShell: "bash",
    HCL: "terraform",
  };
  return map[lang] ?? null;
}
