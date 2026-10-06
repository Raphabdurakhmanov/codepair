import Link from "next/link";
import { requireUser, loadMembers, teamRolesFor, toMatchPerson, type Invitation, type Profile, type Project } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { rankPeople, skillGap } from "@/lib/matching";
import { RoleOptions } from "@/components/RoleSelect";
import { cancelInvitation, inviteToProject, leaveProject, respondInvitation, setProjectStatus } from "@/app/actions";
import TeamMembers from "@/components/TeamMembers";
import Avatar from "@/components/Avatar";
import Tags from "@/components/Tags";
import { Score } from "@/components/MatchScore";

type WithPerson = Invitation & { person?: Profile };

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const { t } = await getDict();
  const { supabase, user } = await requireUser();
  const roleName = (r: string) => t.roles[r] ?? r;

  // all teams I am in
  const { data: myRows } = await supabase.from("project_members").select("project_id").eq("user_id", user.id);
  const ids = ((myRows ?? []) as { project_id: string }[]).map((r) => r.project_id);
  const [{ data: projData }, { data: reqData }] = await Promise.all([
    ids.length ? supabase.from("projects").select("*").in("id", ids) : Promise.resolve({ data: [] as Project[] }),
    supabase.from("invitations").select("project_id").eq("to_user", user.id).eq("kind", "request").eq("status", "pending"),
  ]);
  const projects = ((projData ?? []) as Project[]).sort(
    (a, b) =>
      Number(b.owner_id === user.id) - Number(a.owner_id === user.id) ||
      Number(a.status === "done") - Number(b.status === "done") ||
      b.created_at.localeCompare(a.created_at),
  );
  const reqCount = new Map<string, number>();
  for (const r of (reqData ?? []) as { project_id: string }[]) reqCount.set(r.project_id, (reqCount.get(r.project_id) ?? 0) + 1);

  if (projects.length === 0) {
    return (
      <>
        <div className="eyebrow">{t.nav.team}</div>
        <h1>{t.team.title}</h1>
        <div className="empty">
          <p>{t.team.noTeams}</p>
          <div className="row" style={{ justifyContent: "center" }}>
            <Link href="/projects/new" className="btn btn-primary">+ {t.team.createFirst}</Link>
            <Link href="/projects" className="btn">{t.team.findProject}</Link>
          </div>
        </div>
      </>
    );
  }

  const project = projects.find((p) => p.id === sp.project) ?? projects[0];
  const id = project.id;
  const isOwner = project.owner_id === user.id;
  const canManage = isOwner && project.status !== "done";

  const allMembers = await loadMembers(supabase, projects.map((p) => p.id));
  const members = allMembers.filter((m) => m.project_id === id);
  const sizeOf = (pid: string) => allMembers.filter((m) => m.project_id === pid).length;
  const teamRoles = teamRolesFor(members);
  const gap = skillGap(project, teamRoles);
  const memberIds = new Set(members.map((m) => m.user_id));

  // owner data: requests, invitations, candidates, search
  let requests: WithPerson[] = [];
  let sentInvites: WithPerson[] = [];
  let history: WithPerson[] = [];
  let candidates: { person: Profile; score: number; covers: string[] }[] = [];
  let found: Profile[] | null = null;
  const invitedIds = new Set<string>();

  if (isOwner) {
    const text = (sp.q ?? "").replace(/[,()%*\\]/g, " ").trim().slice(0, 60);
    let cq = supabase.from("profiles").select("*").neq("id", user.id).limit(150);
    if (gap.length > 0) cq = cq.overlaps("roles", gap);
    const [{ data: inv }, { data: cand }, { data: search }] = await Promise.all([
      supabase.from("invitations").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(60),
      canManage ? cq : Promise.resolve({ data: [] as Profile[] }),
      canManage && text
        ? supabase
            .from("profiles")
            .select("*")
            .neq("id", user.id)
            .or(`full_name.ilike.%${text}%,university.ilike.%${text}%,github_username.ilike.%${text}%`)
            .limit(12)
        : Promise.resolve({ data: null }),
    ]);
    const all = (inv ?? []) as Invitation[];
    const otherIds = [...new Set(all.map((i) => (i.kind === "request" ? i.from_user : i.to_user)))];
    const { data: profs } = otherIds.length
      ? await supabase.from("profiles").select("*").in("id", otherIds)
      : { data: [] as Profile[] };
    const byId = new Map(((profs ?? []) as Profile[]).map((x) => [x.id, x]));
    const withPerson = (i: Invitation): WithPerson => ({ ...i, person: byId.get(i.kind === "request" ? i.from_user : i.to_user) });

    requests = all.filter((i) => i.kind === "request" && i.status === "pending" && i.to_user === user.id).map(withPerson);
    sentInvites = all.filter((i) => i.kind === "invite" && i.status === "pending").map(withPerson);
    history = all.filter((i) => i.status !== "pending").slice(0, 10).map(withPerson);
    all.filter((i) => i.status === "pending").forEach((i) => invitedIds.add(i.kind === "invite" ? i.to_user : i.from_user));

    const pool = ((cand ?? []) as Profile[]).filter((x) => x.roles.length > 0 && !memberIds.has(x.id) && !invitedIds.has(x.id));
    const poolById = new Map(pool.map((x) => [x.id, x]));
    candidates = rankPeople(pool.map((x) => toMatchPerson(x)), project, teamRoles)
      .slice(0, 5)
      .map((r) => ({
        person: poolById.get(r.person.id)!,
        score: r.match.score,
        covers: r.match.reasons.flatMap((x) => (x.code === "covers_gap" ? x.roles : [])),
      }));
    found = search ? (search as Profile[]) : null;
  }

  const inviteForm = (person: Profile, role: string) =>
    memberIds.has(person.id) ? (
      <span className="tag tag-good">{t.team.alreadyMember}</span>
    ) : invitedIds.has(person.id) ? (
      <span className="tag">{t.team.alreadyInvited}</span>
    ) : (
      <form action={inviteToProject} className="row" style={{ gap: 6 }}>
        <input type="hidden" name="project_id" value={id} />
        <input type="hidden" name="to_user" value={person.id} />
        <select name="role" defaultValue={role} className="select-sm" aria-label={t.people.inviteAs}>
          <option value="">—</option>
          <RoleOptions t={t} />
        </select>
        <button className="btn btn-primary btn-sm">{t.people.invite}</button>
      </form>
    );

  const personRow = (p: Profile | undefined, fallbackId: string, sub: React.ReactNode, right: React.ReactNode, extra?: React.ReactNode) => (
    <li key={fallbackId}>
      <div className="row between member-row">
        <div className="row">
          <Avatar name={p?.full_name ?? ""} url={p?.avatar_url} />
          <div>
            <Link href={`/u/${fallbackId}`}><b>{p?.full_name || "—"}</b></Link>
            <div className="muted small">{sub}</div>
          </div>
        </div>
        <div className="member-actions">{right}</div>
      </div>
      {extra}
    </li>
  );

  return (
    <>
      <div className="eyebrow">{t.nav.team}</div>
      <h1 style={{ marginBottom: 4 }}>{t.team.title}</h1>
      <p className="muted">{t.team.subtitle}</p>

      <nav className="team-tabs" aria-label={t.nav.projects}>
        {projects.map((p) => (
          <Link key={p.id} href={`/team?project=${p.id}`} className={`team-tab${p.id === id ? " is-active" : ""}`}>
            {p.owner_id === user.id ? "★ " : ""}
            {p.title}
            <span className="count">👥 {sizeOf(p.id)}</span>
            {(reqCount.get(p.id) ?? 0) > 0 && <span className="badge">{reqCount.get(p.id)}</span>}
          </Link>
        ))}
      </nav>

      <div className="two-col">
        <div className="stack">
          <div className="card">
            <div className="team-head">
              <div>
                <div className="eyebrow">{isOwner ? t.team.owned : t.team.memberOf}</div>
                <h2 style={{ margin: 0 }}>{project.title}</h2>
                <p className="muted small" style={{ margin: "4px 0 0" }}>
                  {t.project.membersCount}: {members.length} · {t.status[project.status]}
                </p>
              </div>
              <Link href={`/projects/${id}`} className="btn btn-sm">{t.team.openProject}</Link>
            </div>
            <div style={{ height: 16 }} />
            <TeamMembers t={t} projectId={id} members={members} ownerId={project.owner_id} meId={user.id} manage={canManage} />
            {!isOwner && <p className="muted small" style={{ marginTop: 14 }}>{t.team.readOnly}</p>}
            {isOwner && project.status === "done" && <p className="notice notice-good small" style={{ marginTop: 14 }}>{t.team.done}</p>}
          </div>

          {canManage && (
            <div className="card">
              <div className="eyebrow">{t.team.tabRequests}</div>
              <h3>
                {t.project.requests} {requests.length > 0 && <span className="tag tag-accent">{requests.length}</span>}
              </h3>
              {requests.length === 0 ? (
                <p className="muted small">{t.project.noRequests}</p>
              ) : (
                <ul className="list">
                  {requests.map((r) =>
                    personRow(
                      r.person,
                      r.from_user,
                      r.role ? `${t.project.wantsRole} ${roleName(r.role)}` : (r.person?.roles ?? []).map(roleName).join(" · "),
                      <form action={respondInvitation} className="row" style={{ gap: 6 }}>
                        <input type="hidden" name="id" value={r.id} />
                        <button name="accept" value="1" className="btn btn-primary btn-sm">{t.dashboard.accept}</button>
                        <button name="accept" value="0" className="btn btn-ghost btn-sm">{t.dashboard.decline}</button>
                      </form>,
                      r.message ? <p className="small" style={{ margin: "6px 0 0 48px" }}>💬 {r.message}</p> : null,
                    ),
                  )}
                </ul>
              )}
            </div>
          )}

          {canManage && (
            <div className="card" id="invite">
              <div className="eyebrow">{t.team.tabInvite}</div>
              <h3>{t.team.searchTitle}</h3>
              <form className="row" action="/team">
                <input type="hidden" name="project" value={id} />
                <input type="search" name="q" defaultValue={sp.q ?? ""} placeholder={t.team.searchPh} style={{ flex: 1, minWidth: 200 }} />
                <button className="btn btn-sm">{t.team.searchBtn}</button>
              </form>
              {found && (
                found.length === 0 ? (
                  <p className="muted small" style={{ marginTop: 12 }}>{t.team.searchEmpty}</p>
                ) : (
                  <ul className="list" style={{ marginTop: 14 }}>
                    {found.map((p) =>
                      personRow(p, p.id, [p.university, p.roles.map(roleName).join(" · ")].filter(Boolean).join(" · "), inviteForm(p, p.roles[0] ?? "")),
                    )}
                  </ul>
                )
              )}

              <div className="row between" style={{ marginTop: 22 }}>
                <h3 style={{ margin: 0 }}>{t.project.inviteHint}</h3>
                <Link href={`/people?project=${id}`} className="btn btn-ghost btn-sm">{t.project.allCandidates}</Link>
              </div>
              {gap.length > 0 && (
                <div style={{ margin: "10px 0" }}>
                  <Tags t={t} kind="roles" items={gap} variant="warn" />
                </div>
              )}
              {candidates.length === 0 ? (
                <p className="muted small">{t.people.noResults}</p>
              ) : (
                <ul className="list" style={{ marginTop: 10 }}>
                  {candidates.map(({ person: c, score, covers }) =>
                    personRow(
                      c,
                      c.id,
                      c.roles.map(roleName).join(" · "),
                      <>
                        <Score t={t} value={score} />
                        {inviteForm(c, covers[0] ?? c.roles[0] ?? "")}
                      </>,
                    ),
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        <aside className="stack">
          {isOwner && (
            <div className="card">
              <h3>{t.project.pendingInvites}</h3>
              {sentInvites.length === 0 ? (
                <p className="muted small">{t.project.noInvites}</p>
              ) : (
                <ul className="list">
                  {sentInvites.map((i) =>
                    personRow(
                      i.person,
                      i.to_user,
                      i.role ? `${t.project.invited} · ${roleName(i.role)}` : t.project.invited,
                      <form action={cancelInvitation}>
                        <input type="hidden" name="id" value={i.id} />
                        <button className="btn btn-ghost btn-sm">{t.dashboard.cancel}</button>
                      </form>,
                    ),
                  )}
                </ul>
              )}
            </div>
          )}

          {isOwner && (
            <div className="card">
              <h3>{t.project.status}</h3>
              <form action={setProjectStatus} className="row">
                <input type="hidden" name="id" value={id} />
                {(["open", "in_progress", "done"] as const).map((s) => (
                  <button key={s} name="status" value={s} className={`btn btn-sm${s === project.status ? " btn-primary" : ""}`} disabled={s === project.status}>
                    {t.status[s]}
                  </button>
                ))}
              </form>
            </div>
          )}

          {isOwner && (
            <div className="card">
              <h3>{t.team.history}</h3>
              {history.length === 0 ? (
                <p className="muted small">{t.team.noHistory}</p>
              ) : (
                <ul className="list small">
                  {history.map((i) => (
                    <li key={i.id} className="row between">
                      <span>
                        {i.kind === "invite" ? "📩" : "🙋"} {i.person?.full_name || "—"}
                        {i.role ? ` · ${roleName(i.role)}` : ""}
                      </span>
                      <span className={`tag ${i.status === "accepted" ? "tag-good" : "tag-warn"}`}>
                        {i.status === "accepted" ? t.dashboard.accepted : t.dashboard.declined}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!isOwner && (
            <div className="card">
              <p className="notice notice-good small">{t.project.youAreMember}</p>
              {project.chat_link && (
                <p className="small"><a href={project.chat_link} target="_blank" rel="noreferrer">💬 {t.project.chat} ↗</a></p>
              )}
              <form action={leaveProject}>
                <input type="hidden" name="project_id" value={id} />
                <button className="btn btn-ghost btn-sm btn-danger">{t.project.leave}</button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
