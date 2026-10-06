import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { githubLanguageToSkill, isRole } from "@/lib/catalog";
import { teamRolesOf, type MatchPerson } from "@/lib/matching";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  university: string;
  roles: string[];
  skills: string[];
  interests: string[];
  level: string;
  hours_per_week: number;
  goals: string;
  telegram: string;
  github_username: string;
  github_languages: string[];
  github_repos: number;
  github_synced_at: string | null;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  tech: string[];
  interests: string[];
  needed_roles: string[];
  deadline: string | null;
  status: "open" | "in_progress" | "done";
  chat_link: string;
  repo_url: string;
  result_url: string;
  created_at: string;
}

export interface Member {
  project_id: string;
  user_id: string;
  role: string;
  contribution: string;
  joined_at: string;
  profile: Profile;
}

export interface Invitation {
  id: string;
  project_id: string;
  from_user: string;
  to_user: string;
  kind: "invite" | "request";
  role: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

/** Current session — cached per request, so layout and page share one auth call. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

/** Current user's profile — cached per request. Creates it if the sign-up trigger did not run. */
export const getMyProfile = cache(async (): Promise<Profile | null> => {
  const { supabase, user } = await getSession();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (profile) return profile as Profile;
  const meta = user.user_metadata ?? {};
  const { data } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name: meta.full_name ?? meta.name ?? "",
      avatar_url: meta.avatar_url ?? null,
      github_username: meta.user_name ?? "",
    })
    .select("*")
    .single();
  return (data as Profile) ?? null;
});

/** Current user + profile, or redirect to /login. */
export async function requireUser() {
  const { supabase, user } = await getSession();
  if (!user) redirect("/login");
  const profile = await getMyProfile();
  return { supabase, user, profile: profile as Profile };
}

export function toMatchPerson(p: Profile, completed = 0): MatchPerson {
  return {
    id: p.id,
    roles: p.roles ?? [],
    skills: p.skills ?? [],
    interests: p.interests ?? [],
    level: p.level,
    hours_per_week: p.hours_per_week,
    github_skills: (p.github_languages ?? []).map(githubLanguageToSkill).filter((x): x is string => !!x),
    completed_projects: completed,
  };
}

type Supa = Awaited<ReturnType<typeof createClient>>;

/** Members of the given projects with their profiles. */
export async function loadMembers(supabase: Supa, projectIds: string[]): Promise<Member[]> {
  if (projectIds.length === 0) return [];
  const { data, error } = await supabase
    .from("project_members")
    .select("*, profile:profiles!project_members_user_id_fkey(*)")
    .in("project_id", projectIds)
    .order("joined_at");
  if (!error && data) return data as Member[];

  // fallback without embedding: members first, then their profiles
  const { data: rows } = await supabase.from("project_members").select("*").in("project_id", projectIds).order("joined_at");
  const list = (rows ?? []) as Omit<Member, "profile">[];
  const ids = [...new Set(list.map((m) => m.user_id))];
  const { data: profs } = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
  const byId = new Map(((profs ?? []) as Profile[]).map((p) => [p.id, p]));
  return list.map((m) => ({ ...m, profile: byId.get(m.user_id) as Profile }));
}

export function teamRolesFor(members: Member[]): string[] {
  return teamRolesOf(
    members.map((m) => ({ role: m.role, profile_roles: m.profile?.roles ?? [] })),
    isRole,
  );
}

/** Number of completed projects per user (for the "previous team work" factor). */
export async function completedCounts(supabase: Supa, userIds: string[]): Promise<Record<string, number>> {
  if (userIds.length === 0) return {};
  const { data } = await supabase
    .from("project_members")
    .select("user_id, projects!inner(status)")
    .in("user_id", userIds)
    .eq("projects.status", "done");
  const out: Record<string, number> = {};
  for (const row of (data ?? []) as { user_id: string }[]) out[row.user_id] = (out[row.user_id] ?? 0) + 1;
  return out;
}
