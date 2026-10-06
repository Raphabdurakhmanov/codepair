import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, loadMembers, teamRolesFor, toMatchPerson, type Invitation, type Profile, type Project } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { skillGap, scoreMatch, rankPeople } from "@/lib/matching";
import { RoleOptions } from "@/components/RoleSelect";
import {
  deleteProject,
  leaveProject,
  removeMember,
  requestJoin,
  saveContribution,
  setProjectStatus,
  cancelInvitation,
  respondInvitation,
  setMemberRole,
  transferOwnership,
  inviteToProject,
} from "@/app/actions";
import Avatar from "@/components/Avatar";
import Tags from "@/components/Tags";
import MatchScore, { Score } from "@/components/MatchScore";

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

  // owner-only: incoming requests, sent invitations, quick candidates
  let requests: (Invitation & { person?: Profile })[] = [];
  let sentInvites: (Invitation & { person?: Profile })[] = [];
  let candidates: { person: Profile; score: number; covers: string[] }[] = [];
  if (isOwner && project.status !== "done") {
    let cq = supabase.from("profiles").select("*").neq("id", user.id).limit(150);
    if (gap.length > 0) cq = cq.overlaps("roles", gap);
    const [{ data: inv }, { data: cand }] = await Promise.all([
      supabase.from("invitations").select("*").eq("project_id", id).eq("status", "pending").order("created_at"),
      cq,
    ]);
    const pending = (inv ?? []) as Invitation[];
    const otherIds = [...new Set(pending.map((i) => (i.kind === "request" ? i.from_user : i.to_user)))];
    const { data: profs } = otherIds.length
      ? await supabase.from("profiles").select("*").in("id", otherIds)
      : { data: [] as Profile[] };
    const byId = new Map(((profs ?? []) as Profile[]).map((x) => [x.id, x]));
    requests = pending
      .filter((i) => i.kind === "request" && i.to_user === user.id)
      .map((i) => ({ ...i, person: byId.get(i.from_user) }));
    sentInvites = pending.filter((i) => i.kind === "invite").map((i) => ({ ...i, person: byId.get(i.to_user) }));

    const taken = new Set([...members.map((m) => m.user_id), ...pending.map((i) => i.to_user), ...pending.map((i) => i.from_user)]);
    const pool = ((cand ?? []) as Profile[]).filter((x) => x.roles.length > 0 && !taken.has(x.id));
    const poolById = new Map(pool.map((x) => [x.id, x]));
    candidates = rankPeople(pool.map((x) => toMatchPerson(x)), project, teamRoles)
      .slice(0, 4)
      .map((r) => ({
        person: poolById.get(r.person.id)!,
        score: r.match.score,
        covers: r.match.reasons.flatMap((x) => (x.code === "covers_gap" ? x.roles : [])),
      }));
  }
  const me = members.find((m) => m.user_id === user.id);
  const owner = members.find((m) => m.user_id === project.owner_id);

  const pendingRequest = myReq as Invitation | null;

  const myMatch = !me ? scoreMatch(toMatchPerson(profile), project, teamRoles) : null;
  const roleName = (r: string) => t.roles[r] ?? r;

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
            {isOwner && project.status !== "done" && (
              <a href="#invite" className="btn btn-primary btn-sm">+ {t.project.inviteMember}</a>
            )}
          </div>
          <div style={{ height: 14 }} />
          <ul className="list">
            {members.map((m) => {
              const isMe = m.user_id === user.id;
              const isTheOwner = m.user_id === project.owner_id;
              const canManage = isOwner && !isMe;
              return (
                <li key={m.user_id}>
                  <div className="row between member-row">
                    <div className="row">
                      <Avatar name={m.profile?.full_name ?? ""} url={m.profile?.avatar_url} />
                      <div>
                        <Link href={`/u/${m.user_id}`}>
                          <b>{m.profile?.full_name || "—"}</b>
                        </Link>
                        {isMe && <span className="muted small"> ({t.project.you})</span>}
                        <div className="small" style={{ marginTop: 2 }}>
                          {isTheOwner && <span className="tag tag-accent" style={{ marginRight: 6 }}>★ {t.roles.owner}</span>}
                          <span className="muted">
                            {m.role && m.role !== "owner"
                              ? roleName(m.role)
                              : (m.profile?.roles ?? []).map(roleName).join(" · ")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {canManage && (
                      <div className="member-actions">
                        <form action={setMemberRole} className="row" style={{ gap: 6 }}>
                          <input type="hidden" name="project_id" value={id} />
                          <input type="hidden" name="user_id" value={m.user_id} />
                          <select name="role" defaultValue={m.role === "owner" ? "" : m.role} aria-label={t.project.changeRole} className="select-sm">
                            <option value="">{t.project.noRole}</option>
                            <RoleOptions t={t} />
                          </select>
                          <button className="btn btn-sm">{t.common.save}</button>
                        </form>
                        <details className="inline member-more">
                          <summary className="btn btn-ghost btn-sm" aria-label={t.project.manage}>⋯</summary>
                          <div className="member-menu">
                            <form action={transferOwnership}>
                              <input type="hidden" name="project_id" value={id} />
                              <input type="hidden" name="user_id" value={m.user_id} />
                              <p className="small muted">{t.project.makeOwnerConfirm}</p>
                              <button className="btn btn-sm">★ {t.project.makeOwner}</button>
                            </form>
                            <form action={removeMember}>
                              <input type="hidden" name="project_id" value={id} />
                              <input type="hidden" name="user_id" value={m.user_id} />
                              <p className="small muted">{t.project.removeConfirm}</p>
                              <button className="btn btn-sm btn-danger">{t.project.removeMember}</button>
                            </form>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                  {isMe ? (
                    <form action={saveContribution} className="row" style={{ marginTop: 8 }}>
                      <input type="hidden" name="project_id" value={id} />
                      <input
                        type="text"
                        name="contribution"
                        defaultValue={m.contribution}
                        placeholder={t.project.contributionPh}
                        maxLength={1000}
                        style={{ flex: 1, minWidth: 200 }}
                        aria-label={t.project.contribution}
                      />
                      <button className="btn btn-sm">{t.common.save}</button>
                    </form>
                  ) : (
                    m.contribution && <p className="small" style={{ margin: "6px 0 0 48px" }}>{m.contribution}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {isOwner && project.status !== "done" && (
          <div className="card">
            <div className="eyebrow">{t.project.requests}</div>
            <h3>
              {t.project.requests} {requests.length > 0 && <span className="tag tag-accent">{requests.length}</span>}
            </h3>
            {requests.length === 0 ? (
              <p className="muted small">{t.project.noRequests}</p>
            ) : (
              <ul className="list">
                {requests.map((r) => (
                  <li key={r.id}>
                    <div className="row between">
                      <div className="row">
                        <Avatar name={r.person?.full_name ?? ""} url={r.person?.avatar_url} />
                        <div>
                          <Link href={`/u/${r.from_user}`}><b>{r.person?.full_name || "—"}</b></Link>
                          <div className="muted small">
                            {r.role ? `${t.project.wantsRole} ${roleName(r.role)}` : (r.person?.roles ?? []).map(roleName).join(" · ")}
                          </div>
                        </div>
                      </div>
                      <form action={respondInvitation} className="row" style={{ gap: 6 }}>
                        <input type="hidden" name="id" value={r.id} />
                        <button name="accept" value="1" className="btn btn-primary btn-sm">{t.dashboard.accept}</button>
                        <button name="accept" value="0" className="btn btn-ghost btn-sm">{t.dashboard.decline}</button>
                      </form>
                    </div>
                    {r.message && <p className="small" style={{ margin: "6px 0 0 48px" }}>💬 {r.message}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isOwner && project.status !== "done" && (
          <div className="card" id="invite">
            <div className="row between">
              <div>
                <div className="eyebrow">{t.project.inviteMember}</div>
                <h3 style={{ margin: 0 }}>{t.project.inviteHint}</h3>
              </div>
              <Link href={`/people?project=${id}`} className="btn btn-sm">{t.project.allCandidates}</Link>
            </div>
            {candidates.length === 0 ? (
              <p className="muted small" style={{ marginTop: 12 }}>{t.people.noResults}</p>
            ) : (
              <ul className="list" style={{ marginTop: 14 }}>
                {candidates.map(({ person: c, score, covers }) => (
                  <li key={c.id}>
                    <div className="row between">
                      <div className="row">
                        <Avatar name={c.full_name} url={c.avatar_url} />
                        <div>
                          <Link href={`/u/${c.id}`}><b>{c.full_name || "—"}</b></Link>
                          <div className="muted small">{c.roles.map(roleName).join(" · ")}</div>
                        </div>
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <Score t={t} value={score} />
                        <form action={inviteToProject} className="row" style={{ gap: 6 }}>
                          <input type="hidden" name="project_id" value={id} />
                          <input type="hidden" name="to_user" value={c.id} />
                          <select name="role" defaultValue={covers[0] ?? c.roles[0] ?? ""} className="select-sm" aria-label={t.people.inviteAs}>
                            <RoleOptions t={t} />
                          </select>
                          <button className="btn btn-primary btn-sm">{t.people.invite}</button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <h4 style={{ marginTop: 18 }}>{t.project.pendingInvites}</h4>
            {sentInvites.length === 0 ? (
              <p className="muted small">{t.project.noInvites}</p>
            ) : (
              <ul className="list">
                {sentInvites.map((i) => (
                  <li key={i.id}>
                    <div className="row between">
                      <div className="row">
                        <Avatar name={i.person?.full_name ?? ""} url={i.person?.avatar_url} />
                        <div>
                          <Link href={`/u/${i.to_user}`}><b>{i.person?.full_name || "—"}</b></Link>
                          <div className="muted small">
                            {t.project.invited}
                            {i.role ? ` · ${roleName(i.role)}` : ""}
                          </div>
                        </div>
                      </div>
                      <form action={cancelInvitation}>
                        <input type="hidden" name="id" value={i.id} />
                        <button className="btn btn-ghost btn-sm">{t.dashboard.cancel}</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <aside className="stack">
        <div className="card">
          <div className="eyebrow">Skill gap</div>
          <h3>{t.project.skillGap}</h3>
          {gap.length === 0 ? <p className="muted small">{t.project.gapNone}</p> : <Tags t={t} kind="roles" items={gap} variant="warn" />}
          {isOwner && project.status !== "done" && (
            <Link href={`/people?project=${id}`} className="btn btn-primary" style={{ marginTop: 14, width: "100%" }}>
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
