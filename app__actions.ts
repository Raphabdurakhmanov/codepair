"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { cleanInterests, cleanRoles, cleanSkills, isRole, LEVELS } from "@/lib/catalog";
import { isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { fetchGithubSummary } from "@/lib/github";

// ---------- helpers ----------

const str = (fd: FormData, k: string, max = 2000) => String(fd.get(k) ?? "").trim().slice(0, max);
const list = (fd: FormData, k: string) => fd.getAll(k).map(String);
const safeUrl = (v: string) => (v === "" || /^https?:\/\/\S+$/i.test(v) ? v : "");

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// ---------- locale ----------

export async function setLocale(fd: FormData) {
  const locale = fd.get("locale");
  if (isLocale(locale)) {
    (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  revalidatePath("/", "layout");
}

// ---------- appearance ----------

export async function toggleTheme(fd: FormData) {
  const next = fd.get("theme") === "light" ? "light" : "dark";
  (await cookies()).set("theme", next, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function toggleAccent(fd: FormData) {
  const next = fd.get("accent") === "red" ? "red" : "blue";
  (await cookies()).set("accent", next, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

// ---------- profile ----------

export async function saveProfile(fd: FormData) {
  const { supabase, user } = await authed();
  const level = str(fd, "level");
  const hours = Math.max(0, Math.min(80, parseInt(str(fd, "hours_per_week"), 10) || 0));
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: str(fd, "full_name", 120),
      university: str(fd, "university", 120),
      bio: str(fd, "bio", 1500),
      goals: str(fd, "goals", 500),
      telegram: str(fd, "telegram", 64),
      github_username: str(fd, "github_username", 39).replace(/^@/, ""),
      roles: cleanRoles(list(fd, "roles")),
      skills: cleanSkills(list(fd, "skills")),
      interests: cleanInterests(list(fd, "interests")),
      level: (LEVELS as readonly string[]).includes(level) ? level : "beginner",
      hours_per_week: hours,
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/profile?saved=1");
}

export async function syncGithub() {
  const { supabase, user } = await authed();
  const { data: profile } = await supabase.from("profiles").select("github_username").eq("id", user.id).single();
  const username = profile?.github_username || (user.user_metadata?.user_name as string | undefined) || "";
  const summary = username ? await fetchGithubSummary(username) : null;
  if (!summary) redirect("/profile?github=notfound");
  await supabase
    .from("profiles")
    .update({
      github_username: summary.username,
      github_languages: summary.languages,
      github_repos: summary.publicRepos,
      github_synced_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  revalidatePath("/profile");
  redirect("/profile?github=ok");
}

// ---------- projects ----------

function projectFields(fd: FormData) {
  const deadline = str(fd, "deadline", 10);
  return {
    title: str(fd, "title", 120),
    description: str(fd, "description", 4000),
    tech: cleanSkills(list(fd, "tech")),
    interests: cleanInterests(list(fd, "interests")),
    needed_roles: cleanRoles(list(fd, "needed_roles")),
    deadline: /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? deadline : null,
    chat_link: safeUrl(str(fd, "chat_link", 300)),
    repo_url: safeUrl(str(fd, "repo_url", 300)),
    result_url: safeUrl(str(fd, "result_url", 300)),
  };
}

export async function createProject(fd: FormData) {
  const { supabase, user } = await authed();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...projectFields(fd), owner_id: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(fd: FormData) {
  const { supabase } = await authed();
  const id = str(fd, "id", 64);
  const status = str(fd, "status", 20);
  const fields = {
    ...projectFields(fd),
    ...(["open", "in_progress", "done"].includes(status) ? { status } : {}),
  };
  const { error } = await supabase.from("projects").update(fields).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect(`/projects/${id}`);
}

export async function setProjectStatus(fd: FormData) {
  const { supabase } = await authed();
  const id = str(fd, "id", 64);
  const status = str(fd, "status", 20);
  if (!["open", "in_progress", "done"].includes(status)) return;
  await supabase.from("projects").update({ status }).eq("id", id);
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(fd: FormData) {
  const { supabase } = await authed();
  await supabase.from("projects").delete().eq("id", str(fd, "id", 64));
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ---------- team ----------

export async function inviteUser(fd: FormData) {
  const { supabase, user } = await authed();
  const role = str(fd, "role", 40);
  await supabase.from("invitations").insert({
    project_id: str(fd, "project_id", 64),
    from_user: user.id,
    to_user: str(fd, "to_user", 64),
    kind: "invite",
    role: isRole(role) ? role : "",
  });
  revalidatePath("/people");
}

export async function requestJoin(fd: FormData) {
  const { supabase, user } = await authed();
  const projectId = str(fd, "project_id", 64);
  const { data: project } = await supabase.from("projects").select("owner_id").eq("id", projectId).single();
  if (!project) return;
  const role = str(fd, "role", 40);
  await supabase.from("invitations").insert({
    project_id: projectId,
    from_user: user.id,
    to_user: project.owner_id,
    kind: "request",
    role: isRole(role) ? role : "",
    message: str(fd, "message", 1000),
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function respondInvitation(fd: FormData) {
  const { supabase } = await authed();
  await supabase.rpc("respond_invitation", {
    inv_id: str(fd, "id", 64),
    accept: fd.get("accept") === "1",
  });
  revalidatePath("/", "layout");
}

export async function cancelInvitation(fd: FormData) {
  const { supabase } = await authed();
  await supabase.from("invitations").delete().eq("id", str(fd, "id", 64));
  revalidatePath("/", "layout");
}

export async function leaveProject(fd: FormData) {
  const { supabase } = await authed();
  const id = str(fd, "project_id", 64);
  await supabase.rpc("leave_project", { p: id });
  revalidatePath("/", "layout");
  redirect(`/projects/${id}`);
}

export async function removeMember(fd: FormData) {
  const { supabase } = await authed();
  const id = str(fd, "project_id", 64);
  await supabase.from("project_members").delete().eq("project_id", id).eq("user_id", str(fd, "user_id", 64));
  revalidatePath(`/projects/${id}`);
}

export async function saveContribution(fd: FormData) {
  const { supabase, user } = await authed();
  const id = str(fd, "project_id", 64);
  await supabase
    .from("project_members")
    .update({ contribution: str(fd, "contribution", 1000) })
    .eq("project_id", id)
    .eq("user_id", user.id);
  revalidatePath(`/projects/${id}`);
}
