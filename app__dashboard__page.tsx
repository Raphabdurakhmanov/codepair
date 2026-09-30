import Link from "next/link";
import { requireUser, loadMembers, teamRolesFor, toMatchPerson, type Invitation, type Profile, type Project } from "@/lib/data";
import { getDict, fmt } from "@/lib/i18n";
import { scoreMatch } from "@/lib/matching";
import { respondInvitation, cancelInvitation } from "@/app/actions";
import Avatar from "@/components/Avatar";
import { Score } from "@/components/MatchScore";

export default async function Dashboard() {
  const { t } = await getDict();
  const { supabase, user, profile } = await requireUser();

  // invitations (both directions)
  const { data: invData } = await supabase
    .from("invitations")
    .select("*")
    .or(`to_user.eq.${user.id},from_user.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(50);
  const invitations = (invData ?? []) as Invitation[];
  const incoming = invitations.filter((i) => i.to_user === user.id && i.status === "pending");
  const sent = invitations.filter((i) => i.from_user === user.id).slice(0, 10);

  // my projects
  const { data: memberRows } = await supabase.from("project_members").select("project_id").eq("user_id", user.id);
  const myIds: string[] = (memberRows ?? []).map((r: { project_id: string }) => r.project_id);

  // everything we need to render titles / names
  const relatedProjectIds = [...new Set([...myIds, ...invitations.map((i) => i.project_id)])];
  const { data: projData } = relatedProjectIds.length
    ? await supabase.from("projects").select("*").in("id", relatedProjectIds)
    : { data: [] };
  const projectsById = new Map(((projData ?? []) as Project[]).map((p) => [p.id, p]));
  const peopleIds = [...new Set(invitations.flatMap((i) => [i.from_user, i.to_user]))];
  const { data: pplData } = peopleIds.length ? await supabase.from("profiles").select("*").in("id", peopleIds) : { data: [] };
  const peopleById = new Map(((pplData ?? []) as Profile[]).map((p) => [p.id, p]));

  const myProjects = myIds.map((id) => projectsById.get(id)).filter((p): p is Project => !!p);

  // recommendations: open projects I'm not in
  let recQuery = supabase.from("projects").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(100);
  if (myIds.length) recQuery = recQuery.not("id", "in", `(${myIds.join(",")})`);
  const { data: openData } = await recQuery;
  const open = (openData ?? []) as Project[];
  const openMembers = await loadMembers(supabase, open.map((p) => p.id));
  const me = toMatchPerson(profile);
  const recommended = open
    .map((p) => ({ p, match: scoreMatch(me, p, teamRolesFor(openMembers.filter((m) => m.project_id === p.id))) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 4);

  const name = (id: string) => peopleById.get(id)?.full_name || "—";
  const title = (id: string) => projectsById.get(id)?.title || "—";

  return (
    <>
      <h1>{fmt(t.dashboard.hello, { name: profile.full_name.split(" ")[0] || "👋" })}</h1>
      {profile.roles.length === 0 && (
        <p className="notice notice-warn">
          {t.profile.completeFirst} <Link href="/profile">{t.nav.profile} →</Link>
        </p>
      )}

      <div className="two-col" style={{ marginTop: 16 }}>
        <div className="stack">
          <div className="card">
            <h2>{t.dashboard.inbox}</h2>
            {incoming.length === 0 ? (
              <p className="muted">{t.dashboard.noInbox}</p>
            ) : (
              <ul className="list">
                {incoming.map((i) => {
                  const from = peopleById.get(i.from_user);
                  return (
                    <li key={i.id}>
                      <div className="row" style={{ alignItems: "flex-start" }}>
                        <Avatar name={from?.full_name ?? ""} url={from?.avatar_url} />
                        <div style={{ flex: 1 }}>
                          <div>
                            {fmt(i.kind === "invite" ? t.dashboard.invitesYou : t.dashboard.wantsToJoin, {
                              from: name(i.from_user),
                              project: title(i.project_id),
                            })}
                          </div>
                          <div className="muted small">
                            {i.role && fmt(t.dashboard.asRole, { role: t.roles[i.role] ?? i.role })}
                            {" · "}
                            <Link href={`/u/${i.from_user}`}>{t.nav.profile}</Link>
                            {" · "}
                            <Link href={`/projects/${i.project_id}`}>{t.nav.projects}</Link>
                          </div>
                          {i.message && <p className="small" style={{ margin: "6px 0 0" }}>“{i.message}”</p>}
                          <form action={respondInvitation} className="row" style={{ marginTop: 8 }}>
                            <input type="hidden" name="id" value={i.id} />
                            <button name="accept" value="1" className="btn btn-primary btn-sm">{t.dashboard.accept}</button>
                            <button name="accept" value="0" className="btn btn-sm">{t.dashboard.decline}</button>
                          </form>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="row between">
              <h2 style={{ margin: 0 }}>{t.dashboard.myProjects}</h2>
              <Link href="/projects/new" className="btn btn-sm">+ {t.nav.newProject}</Link>
            </div>
            {myProjects.length === 0 ? (
              <p className="muted" style={{ marginTop: 12 }}>{t.dashboard.noProjects}</p>
            ) : (
              <ul className="list" style={{ marginTop: 12 }}>
                {myProjects.map((p) => (
                  <li key={p.id} className="row between">
                    <Link href={`/projects/${p.id}`}><b>{p.title}</b></Link>
                    <span className={`tag ${p.status === "done" ? "tag-good" : ""}`}>{t.status[p.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {sent.length > 0 && (
            <div className="card">
              <h3>{t.dashboard.sent}</h3>
              <ul className="list small">
                {sent.map((i) => (
                  <li key={i.id} className="row between">
                    <span>
                      {i.kind === "invite" ? `${name(i.to_user)} → ` : ""}
                      <Link href={`/projects/${i.project_id}`}>{title(i.project_id)}</Link>
                      {i.role && <span className="muted"> · {t.roles[i.role] ?? i.role}</span>}
                    </span>
                    <span className="row">
                      <span className={`tag ${i.status === "accepted" ? "tag-good" : i.status === "declined" ? "tag-warn" : ""}`}>
                        {t.dashboard[i.status]}
                      </span>
                      {i.status === "pending" && (
                        <form action={cancelInvitation}>
                          <input type="hidden" name="id" value={i.id} />
                          <button className="btn btn-ghost btn-sm">{t.dashboard.cancel}</button>
                        </form>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="card">
          <h2>{t.dashboard.recommended}</h2>
          {recommended.length === 0 ? (
            <p className="muted small">{t.dashboard.noRecommended}</p>
          ) : (
            <ul className="list">
              {recommended.map(({ p, match }) => (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`}><b>{p.title}</b></Link>
                  <div>
                    <Score t={t} value={match.score} />
                  </div>
                  {match.covers.length > 0 && (
                    <div className="small" style={{ color: "var(--good)" }}>
                      {fmt(t.reasons.covers_gap, { x: match.covers.map((r) => t.roles[r] ?? r).join(", ") })}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Link href="/projects" className="btn btn-sm" style={{ marginTop: 12 }}>{t.nav.projects} →</Link>
        </aside>
      </div>
    </>
  );
}
