import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, type Profile, type Project } from "@/lib/data";
import { getDict, fmt } from "@/lib/i18n";
import Avatar from "@/components/Avatar";
import Tags from "@/components/Tags";

interface MembershipRow {
  role: string;
  contribution: string;
  joined_at: string;
  project: Project;
}

export default async function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getDict();
  const { supabase, user } = await requireUser();

  const { data: profileData } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!profileData) notFound();
  const p = profileData as Profile;

  const { data: rows } = await supabase
    .from("project_members")
    .select("role, contribution, joined_at, project:projects(*)")
    .eq("user_id", id)
    .order("joined_at", { ascending: false });
  const memberships = (rows ?? []) as unknown as MembershipRow[];
  const done = memberships.filter((m) => m.project?.status === "done");
  const active = memberships.filter((m) => m.project && m.project.status !== "done");
  const roleName = (m: MembershipRow) => t.roles[m.role] ?? (m.role || "—");

  return (
    <div className="two-col">
      <div className="stack">
        <div className="card">
          <div className="row" style={{ gap: 16 }}>
            <Avatar name={p.full_name} url={p.avatar_url} large />
            <div>
              <h1 style={{ margin: 0 }}>{p.full_name || "—"}</h1>
              <p className="muted" style={{ margin: 0 }}>
                {[p.university, t.levels[p.level], fmt(t.common.hoursWeek, { n: p.hours_per_week })].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          {p.bio && <p style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{p.bio}</p>}
          {p.goals && (
            <p className="small">
              <b>{t.profile.goals}:</b> {p.goals}
            </p>
          )}
          <div className="stack" style={{ marginTop: 16 }}>
            <Tags t={t} kind="roles" items={p.roles} variant="accent" />
            <Tags t={t} kind="skills" items={p.skills} />
            <Tags t={t} kind="interests" items={p.interests} />
          </div>
          {id === user.id && (
            <p style={{ marginTop: 16 }}>
              <Link href="/profile" className="btn btn-sm">
                {t.common.edit}
              </Link>
            </p>
          )}
        </div>

        <div className="card">
          <h2>✓ {t.profile.verified}</h2>
          {done.length === 0 ? (
            <p className="muted">{t.profile.noVerified}</p>
          ) : (
            <ul className="list">
              {done.map((m) => (
                <li key={m.project.id}>
                  <div className="row between">
                    <Link href={`/projects/${m.project.id}`}>
                      <b>{m.project.title}</b>
                    </Link>
                    <span className="tag tag-good">{roleName(m)}</span>
                  </div>
                  <p className="muted small" style={{ margin: "4px 0" }}>
                    {new Date(m.joined_at).toLocaleDateString()} – {m.project.deadline ?? ""}
                  </p>
                  {m.contribution && <p className="small" style={{ margin: "4px 0" }}>{m.contribution}</p>}
                  <Tags t={t} kind="skills" items={m.project.tech} />
                  <div className="row small" style={{ marginTop: 6 }}>
                    {m.project.result_url && <a href={m.project.result_url} target="_blank" rel="noreferrer">{t.project.result} ↗</a>}
                    {m.project.repo_url && <a href={m.project.repo_url} target="_blank" rel="noreferrer">{t.project.repo} ↗</a>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="stack">
        <div className="card">
          <h3>{t.profile.contact}</h3>
          {p.telegram ? (
            <p>
              <a href={`https://t.me/${p.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                Telegram: @{p.telegram.replace(/^@/, "")}
              </a>
            </p>
          ) : (
            <p className="muted small">—</p>
          )}
          {p.github_username && (
            <p className="small">
              <a href={`https://github.com/${p.github_username}`} target="_blank" rel="noreferrer">
                GitHub: @{p.github_username}
              </a>
              {p.github_synced_at && <> · {fmt(t.profile.githubInfo, { n: p.github_repos })}</>}
            </p>
          )}
          {p.github_languages.length > 0 && (
            <div className="chips">
              {p.github_languages.map((l) => (
                <span className="tag" key={l}>{l}</span>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3>{t.profile.projects}</h3>
          {active.length === 0 ? (
            <p className="muted small">—</p>
          ) : (
            <ul className="list">
              {active.map((m) => (
                <li key={m.project.id}>
                  <Link href={`/projects/${m.project.id}`}>{m.project.title}</Link>
                  <div className="muted small">{roleName(m)} · {t.status[m.project.status]}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
