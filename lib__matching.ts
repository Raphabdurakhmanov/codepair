// CodePair matching: COMPLEMENTARY > SIMILAR.
// Pure functions, no dependencies — easy to test and to tune.
//
// Score (0–100):
//   40  covers a missing role in the team (skill gap)
//   25  overlap between candidate skills (+ GitHub languages) and project tech
//   15  shared interest in the project domain
//   10  practical level
//   10  available hours per week
//   +5  bonus for previously completed projects (capped at 100 total)

export interface MatchPerson {
  id: string;
  roles: string[];
  skills: string[];
  interests: string[];
  level: "beginner" | "intermediate" | "advanced" | string;
  hours_per_week: number;
  github_skills?: string[]; // GitHub languages already mapped to skill ids
  completed_projects?: number;
}

export interface MatchProject {
  needed_roles: string[];
  tech: string[];
  interests: string[];
}

export type Reason =
  | { code: "covers_gap"; roles: string[] }
  | { code: "duplicate_role"; roles: string[] }
  | { code: "skills"; items: string[] }
  | { code: "interests"; items: string[] }
  | { code: "level"; level: string }
  | { code: "time"; hours: number }
  | { code: "experience"; count: number };

export interface MatchResult {
  score: number;
  covers: string[];
  reasons: Reason[];
}

export const WEIGHTS = { gap: 40, skills: 25, interests: 15, level: 10, time: 10, experience: 5 };

const LEVEL_POINTS: Record<string, number> = { beginner: 0.4, intermediate: 0.75, advanced: 1 };

const intersect = (a: string[], b: string[]) => {
  const s = new Set(b);
  return [...new Set(a)].filter((x) => s.has(x));
};

/** Roles the project needs that nobody in the team covers yet. */
export function skillGap(project: Pick<MatchProject, "needed_roles">, teamRoles: string[]): string[] {
  const have = new Set(teamRoles);
  return [...new Set(project.needed_roles)].filter((r) => !have.has(r));
}

export function scoreMatch(person: MatchPerson, project: MatchProject, teamRoles: string[] = []): MatchResult {
  const reasons: Reason[] = [];
  let score = 0;

  // 1) Skill gap coverage — the core of complementary matching
  const gap = skillGap(project, teamRoles);
  const covers = intersect(person.roles, gap);
  if (covers.length > 0) {
    // covering one missing role is already most of the value; more roles add a little
    score += WEIGHTS.gap * Math.min(1, 0.8 + 0.2 * (covers.length - 1));
    reasons.push({ code: "covers_gap", roles: covers });
  } else if (project.needed_roles.length === 0) {
    // project did not specify roles: reward people who bring a role the team lacks
    const newRoles = person.roles.filter((r) => !teamRoles.includes(r));
    if (newRoles.length > 0) {
      score += WEIGHTS.gap * 0.5;
      reasons.push({ code: "covers_gap", roles: newRoles });
    }
  } else {
    const dup = intersect(person.roles, teamRoles);
    if (dup.length > 0) reasons.push({ code: "duplicate_role", roles: dup });
  }

  // 2) Tech overlap (declared skills + GitHub languages)
  if (project.tech.length > 0) {
    const all = [...person.skills, ...(person.github_skills ?? [])];
    const matched = intersect(project.tech, all);
    if (matched.length > 0) {
      score += WEIGHTS.skills * (matched.length / new Set(project.tech).size);
      reasons.push({ code: "skills", items: matched });
    }
  }

  // 3) Domain interest
  if (project.interests.length > 0) {
    const shared = intersect(project.interests, person.interests);
    if (shared.length > 0) {
      score += WEIGHTS.interests * Math.min(1, shared.length / Math.min(2, new Set(project.interests).size));
      reasons.push({ code: "interests", items: shared });
    }
  }

  // 4) Level
  const lvl = LEVEL_POINTS[person.level] ?? 0.4;
  score += WEIGHTS.level * lvl;
  if (person.level !== "beginner") reasons.push({ code: "level", level: person.level });

  // 5) Time: 10h/week or more is full points
  const hours = Math.max(0, person.hours_per_week || 0);
  score += WEIGHTS.time * Math.min(1, hours / 10);
  if (hours >= 8) reasons.push({ code: "time", hours });

  // 6) Previous team work
  const done = person.completed_projects ?? 0;
  if (done > 0) {
    score += Math.min(WEIGHTS.experience, done * 2.5);
    reasons.push({ code: "experience", count: done });
  }

  return { score: Math.round(Math.min(100, score)), covers, reasons };
}

/** Roles a team currently covers: explicit member role, or the member's profile roles (e.g. for the owner). */
export function teamRolesOf(
  members: { role: string; profile_roles: string[] }[],
  isKnownRole: (r: string) => boolean,
): string[] {
  const out = new Set<string>();
  for (const m of members) {
    if (m.role && isKnownRole(m.role)) out.add(m.role);
    else m.profile_roles.forEach((r) => out.add(r));
  }
  return [...out];
}

/** Sort helper: rank people for a project. */
export function rankPeople<T extends MatchPerson>(people: T[], project: MatchProject, teamRoles: string[]) {
  return people
    .map((p) => ({ person: p, match: scoreMatch(p, project, teamRoles) }))
    .sort((a, b) => b.match.score - a.match.score);
}
