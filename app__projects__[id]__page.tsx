import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, loadMembers, teamRolesFor, toMatchPerson, type Invitation, type Project } from "@/lib/data";
import { getDict, fmt } from "@/lib/i18n";
import { skillGap, scoreMatch } from "@/lib/matching";
import { RoleOptions } from "@/components/RoleSelect";
import { deleteProject, leaveProject, requestJoin, setProjectStatus, cancelInvitation } from "@/app/actions";
import TeamMembers from "@/components/TeamMembers";
import Tags from "@/components/Tags";
import MatchScore from "@/components/MatchScore";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getDict();
  const { supabase, user, profile } = await requireUser();

  const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const project = data as Project;

  const [members, { data: myReq }] = await Promise.all([
    loadMembers(supabase, [id]),
    supabase
      .from("invitations")
      .select("*")
      .eq("project_id", id)
      .eq("from_user", user.id)
      .eq("kind", "request")
      .eq("status", "pending")
      .maybeSingle(),
  ]);
  const teamRoles = teamRolesFor(members);
  const gap = skillGap(project, teamRoles);
  const isOwner = project.owner_id === user.id;

  // owner: how many join requests are waiting (managed on /team)
  let requestCount = 0;
  if (isOwner) {
    const { count } = await supabase
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .eq("project_id", id)
      .eq("kind", "request")
      .eq("status", "pending");
    requestCount = count ?? 0;
  }

  const me = members.find((m) => m.user_id === user.id);
  const owner = members.find((m) => m.user_id === project.owner_id);

  const pendingRequest = myReq as Invitation | null;

  const myMatch = !me ? scoreMatch(toMatchPerson(profile), project, teamRoles) : null;

  return (
    <div className="two-col">
      <div className="stack">
        <div className="card">
          <div className="row between">
            <span className={`tag ${project.status === "done" ? "tag-good" : project.status === "open" ? "tag-accent" : "tag-warn"}`}>
              {t.status[project.status]}
            </span>
            {isOwner && (
              <Link href={`/projects/${id}/edit`} className="btn btn-sm">
                {t.common.edit}
              </Link>
            )}
          </div>
          <h1 style={{ marginTop: 12 }}>{project.title}</h1>
          <p className="muted small">
            {t.project.owner}: {owner ? <Link href={`/u/${owner.user_id}`}>{owner.profile?.full_name || "—"}</Link> : "—"}
            {project.deadline && <> · {t.project.deadline}: {project.deadline}</>}
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>{project.description || <span className="muted">{t.project.noDescription}</span>}</p>
          <div className="stack">
            <Tags t={t} kind="skills" items={project.tech} />
            <Tags t={t} kind="interests" items={project.interests} />
          </div>
        </div>

        {project.status === "done" && (
          <div className="card notice notice-good">
            <h3>✓ {t.project.verifiedTitle}</h3>
            <p className="small" style={{ margin: 0 }}>{t.project.verifiedText}</p>
          </div>
        )}

        <div className="card">
          <div className="row between">
            <div>
              <div className="eyebrow">{isOwner ? t.project.manage : t.project.team}</div>
              <h2 style={{ margin: 0 }}>
                {t.project.membersCount} ({members.length})
              </h2>
            </div>
            {isOwner && (
              <Link href={`/team?project=${id}`} className="btn btn-primary btn-sm">
                {t.project.manageTeam}
                {requestCount > 0 && <span className="tag" style={{ marginLeft: 6 }}>{fmt(t.project.requestsBadge, { n: requestCount })}</span>}
              </Link>
            )}
          </div>
          <div style={{ height: 14 }} />
          <TeamMembers t={t} projectId={id} members={members} ownerId={project.owner_id} meId={user.id} manage={false} />
        </div>

      </div>

      <aside className="stack">
        <div className="card">
          <div className="eyebrow">Skill gap</div>
          <h3>{t.project.skillGap}</h3>
          {gap.length === 0 ? <p className="muted small">{t.project.gapNone}</p> : <Tags t={t} kind="roles" items={gap} variant="warn" />}
          {isOwner && project.status !== "done" && (
            <Link href={`/team?project=${id}#invite`} className="btn btn-primary" style={{ marginTop: 14, width: "100%" }}>
              {t.project.findCandidates}
            </Link>
          )}
        </div>

        {!me && project.status !== "done" && (
          <div className="card">
            {myMatch && <MatchScore t={t} match={myMatch} />}
            {pendingRequest ? (
              <div style={{ marginTop: 12 }}>
                <p className="notice small">{t.project.requestSent}</p>
                <form action={cancelInvitation}>
                  <input type="hidden" name="id" value={pendingRequest.id} />
                  <button className="btn btn-ghost btn-sm">{t.dashboard.cancel}</button>
                </form>
              </div>
            ) : (
              <form action={requestJoin} className="form" style={{ marginTop: 12 }}>
                <input type="hidden" name="project_id" value={id} />
                <label className="field">
                  <span className="label">{t.project.requestRole}</span>
                  <select name="role" defaultValue={myMatch?.covers[0] ?? profile.roles[0] ?? ""}>
                    <RoleOptions t={t} />
                  </select>
                </label>
                <textarea name="message" placeholder={t.project.messagePh} maxLength={1000} style={{ minHeight: 70 }} />
                <button className="btn btn-primary" style={{ width: "100%" }}>
                  {t.project.requestJoin}
                </button>
              </form>
            )}
          </div>
        )}

        {me && (
          <div className="card">
            <p className="notice notice-good small">{t.project.youAreMember}</p>
            {isOwner && (
              <form action={setProjectStatus} className="row">
                <input type="hidden" name="id" value={id} />
                {(["open", "in_progress", "done"] as const)
                  .filter((s) => s !== project.status)
                  .map((s) => (
                    <button key={s} name="status" value={s} className="btn btn-sm">
                      → {t.status[s]}
                    </button>
                  ))}
              </form>
            )}
            {!isOwner && (
              <form action={leaveProject}>
                <input type="hidden" name="project_id" value={id} />
                <button className="btn btn-ghost btn-sm btn-danger">{t.project.leave}</button>
              </form>
            )}
          </div>
        )}

        {(project.chat_link || project.repo_url || project.result_url) && (
          <div className="card">
            <h3>{t.project.links}</h3>
            <ul className="list small">
              {project.chat_link && me && (
                <li>
                  <a href={project.chat_link} target="_blank" rel="noreferrer">💬 {t.project.chat} ↗</a>
                </li>
              )}
              {project.repo_url && (
                <li>
                  <a href={project.repo_url} target="_blank" rel="noreferrer">⌥ {t.project.repo} ↗</a>
                </li>
              )}
              {project.result_url && (
                <li>
                  <a href={project.result_url} target="_blank" rel="noreferrer">★ {t.project.result} ↗</a>
                </li>
              )}
            </ul>
          </div>
        )}

        {isOwner && (
          <details className="inline small">
            <summary className="muted">{t.common.delete}…</summary>
            <form action={deleteProject}>
              <input type="hidden" name="id" value={id} />
              <p>{t.project.deleteConfirm}</p>
              <button className="btn btn-sm btn-danger">{t.common.delete}</button>
            </form>
          </details>
        )}
      </aside>
    </div>
  );
}
