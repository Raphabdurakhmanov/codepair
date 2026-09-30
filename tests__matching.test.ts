import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreMatch, skillGap, rankPeople, teamRolesOf, type MatchPerson } from "../lib/matching.ts";

const project = { needed_roles: ["backend", "ml", "uiux"], tech: ["python", "react", "figma"], interests: ["edtech"] };
const base = { skills: [], interests: [], level: "intermediate", hours_per_week: 10 };
const pythonDev: MatchPerson = { id: "py", roles: ["backend"], ...base, skills: ["python"] };
const designer: MatchPerson = { id: "ux", roles: ["uiux"], ...base, skills: ["figma"], interests: ["edtech"] };

test("skill gap lists only uncovered roles", () => {
  assert.deepEqual(skillGap(project, ["backend", "ml"]), ["uiux"]);
});

test("complementary beats similar: team has backend+ml → designer ranks above 4th python dev", () => {
  const ranked = rankPeople([pythonDev, designer], project, ["backend", "ml"]);
  assert.equal(ranked[0].person.id, "ux");
  assert.deepEqual(ranked[0].match.covers, ["uiux"]);
  assert.ok(ranked[1].match.reasons.some((r) => r.code === "duplicate_role"));
});

test("github languages count as skills", () => {
  const withGh = scoreMatch({ ...pythonDev, skills: [], github_skills: ["python"] }, project, []);
  const without = scoreMatch({ ...pythonDev, skills: [] }, project, []);
  assert.ok(withGh.score > without.score);
});

test("score stays within 0..100", () => {
  const star: MatchPerson = { id: "s", roles: ["backend", "ml", "uiux"], skills: ["python", "react", "figma"], interests: ["edtech"], level: "advanced", hours_per_week: 40, completed_projects: 10 };
  const r = scoreMatch(star, project, []);
  assert.ok(r.score <= 100 && r.score >= 95, String(r.score));
  const zero = scoreMatch({ id: "z", roles: [], skills: [], interests: [], level: "beginner", hours_per_week: 0 }, project, []);
  assert.ok(zero.score >= 0 && zero.score < 10, String(zero.score));
});

test("project without needed roles rewards new roles", () => {
  const r = scoreMatch(designer, { needed_roles: [], tech: [], interests: [] }, ["backend"]);
  assert.ok(r.reasons.some((x) => x.code === "covers_gap"));
});

test("teamRolesOf uses explicit role, falls back to profile roles for owner", () => {
  const roles = teamRolesOf(
    [{ role: "owner", profile_roles: ["backend", "ml"] }, { role: "uiux", profile_roles: ["frontend"] }],
    (r) => ["backend", "ml", "uiux", "frontend"].includes(r),
  );
  assert.deepEqual(roles.sort(), ["backend", "ml", "uiux"]);
});
