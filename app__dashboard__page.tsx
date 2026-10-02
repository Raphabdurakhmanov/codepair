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

  // wave 1: independent queries in parallel
  const [{ data: invData }, { data: memberRows }, { data: openData }] = await Promise.all([
    supabase
      .from("invitations")
      .select("*")
      .or(`to_user.eq.${user.id},from_user.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("project_members").select("project_id").eq("user_id", user.id),
    supabase.from("projects").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(100),
  ]);
  const invitations = (invData ?? []) as Invitation[];
  const incoming = invitations.filter((i) => i.to_user === user.id && i.status === "pending");
  const sent = invitations.filter((i) => i.from_user === user.id).slice(0, 10);
  const myIds: string[] = (memberRows ?? []).map((r: { project_id: string }) => r.project_id);
  const open = ((openData ?? []) as Project[]).filter((p) => !myIds.includes(p.id));

  // wave 2: details that depend on wave 1, also in parallel
  const relatedProjectIds = [...new Set([...myIds, ...invitations.map((i) => i.project_id)])];
  const peopleIds = [...new Set(invitations.flatMap((i) => [i.from_user, i.to_user]))];
  const [{ data: projData }, { data: pplData }, openMembers] = await Promise.all([
    relatedProjectIds.length ? supabase.from("projects").select("*").in("id", relatedProjectIds) : Promise.resolve({ data: [] }),
    peopleIds.length ? supabase.from("profiles").select("*").in("id", peopleIds) : Promise.resolve({ data: [] }),
    loadMembers(supabase, open.map((p) => p.id)),
  ]);
  const projectsById = new Map(((projData ?? []) as Project[]).map((p) => [p.id, p]));
  const peopleById = new Map(((pplData ?? []) as Profile[]).map((p) => [p.id, p]));
  const myProjects = myIds.map((id) => projectsById.get(id)).filter((p): p is Project => !!p);

  const me = toMatchPerson(profile);
  const recommended = open
    .map((p) => ({ p, match: scoreMatch(me, p, teamRolesFor(openMembers.filter((m) => m.project_id === p.id))) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, 4);

  const name = (id: string) => peopleById.get(id)?.full_name || "—";
  const title = (id: string) => projectsById.get(id)?.title || "—";

  const checks = [
    profile.full_name,
    profile.university,
    profile.bio,
    profile.roles.length,
    profile.skills.length,
    profile.interests.length,
    profile.telegram,
    profile.github_username,
  ];
  const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const best = recommended[0]?.match.score ?? 0;

  return (
    <div className="stack">
      <div className="two-col">
        <section className="card">
          <div className="row between" style={{ alignItems: "flex-start" }}>
            <div>
              <div className="eyebrow">{t.dashboard.overview}</div>
              <h1>{fmt(t.dashboard.hello, { name: profile.full_name.split(" ")[0] || "👋" })}</h1>
              <p className="muted" style={{ maxWidth: 520 }}>{t.common.tagline}</p>
            </div>
            <span className="live-dot">{t.dashboard.live}</span>
          </div>

          {profile.roles.length === 0 && (
            <p className="notice notice-warn">
              {t.profile.completeFirst} <Link href="/profile">{t.nav.profile} →</Link>
            </p>
          )}

          <div className="grid-3" style={{ marginTop: 18 }}>
            <div className="tile">
              <div className="tile-label">{t.dashboard.statProjects}</div>
              <div className="tile-value">{myProjects.length}</div>
              <div className="tile-sub">{myProjects.filter((p) => p.status === "done").length} ✓ {t.status.done.toLowerCase()}</div>
            </div>
            <div className="tile">
              <div className="tile-label">{t.dashboard.statInbox}</div>
              <div className="tile-value">{incoming.length}</div>
              <div className="tile-sub">{t.dashboard.pending}</div>
            </div>
            <div className="tile">
              <div className="tile-label">{t.dashboard.statBest}</div>
              <div className="tile-value">{best}%</div>
              <div className="tile-sub">{recommended[0]?.p.title ?? "—"}</div>
            </div>
          </div>

          <div className="row" style={{ marginTop: 22, gap: 26 }}>
            <div className="ring" style={{ background: `conic-gradient(var(--accent) ${completeness}%, var(--glass-strong) 0)` }}>
              <div className="ring-inner">
                <div>
                  <b>{completeness}%</b>
                  <small>{t.dashboard.profileReady}</small>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }} className="stack">
              <div className="tile">
                <div className="tile-label">{t.profile.roles}</div>
                <div style={{ marginTop: 8 }} className="chips">
                  {profile.roles.length ? profile.roles.map((r) => <span key={r} className="tag tag-accent">{t.roles[r] ?? r}</span>) : <span className="muted small">—</span>}
                </div>
              </div>
              <Link href="/profile" className="btn btn-sm" style={{ alignSelf: "flex-start" }}>
                {t.common.edit} {t.nav.profile.toLowerCase()} →
              </Link>
            </div>
          </div>
        </section>

        <aside className="stack">
          <section className="card card-accent">
            <div className="eyebrow">{t.dashboard.inbox}</div>
            <div style={{ fontSize: "3rem", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{incoming.length}</div>
            <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>
              {incoming.length ? t.dashboard.pending : t.dashboard.noInbox}
            </p>
          </section>

          <section className="card">
            <div className="eyebrow">Matching</div>
            <h2>{t.dashboard.recommended}</h2>
            {recommended.length === 0 ? (
              <p className="muted small">{t.dashboard.noRecommended}</p>
            ) : (
              <div>
                {recommended.map(({ p, match }, i) => (
                  <Link key={p.id} href={`/projects/${p.id}`} className="list-item">
                    <span className="rank">{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</b>
                      <span className="muted small">
                        {match.covers.length > 0
                          ? fmt(t.reasons.covers_gap, { x: match.covers.map((r) => t.roles[r] ?? r).join(", ") })
                          : t.status[p.status]}
                      </span>
                    </span>
                    <Score t={t} value={match.score} />
                  </Link>
                ))}
              </div>
            )}
            <Link href="/projects" className="btn btn-sm" style={{ marginTop: 14 }}>{t.nav.projects} →</Link>
          </section>
        </aside>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="eyebrow">{t.dashboard.inbox}</div>
          <h2>{t.dashboard.inbox}</h2>
          {incoming.length === 0 ? (
            <p className="muted">{t.dashboard.noInbox}</p>
          ) : (
            <div>
              {incoming.map((i) => {
                const from = peopleById.get(i.from_user);
                return (
                  <div key={i.id} className="list-item" style={{ alignItems: "flex-start" }}>
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
                      <form action={respondInvitation} className="row" style={{ marginTop: 10 }}>
                        <input type="hidden" name="id" value={i.id} />
                        <button name="accept" value="1" className="btn btn-primary btn-sm">{t.dashboard.accept}</button>
                        <button name="accept" value="0" className="btn btn-sm">{t.dashboard.decline}</button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sent.length > 0 && (
            <>
              <h3 style={{ marginTop: 24 }}>{t.dashboard.sent}</h3>
              <div>
                {sent.map((i) => (
                  <div key={i.id} className="list-item small" style={{ justifyContent: "space-between" }}>
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
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="card">
          <div className="row between">
            <div>
              <div className="eyebrow">{t.nav.projects}</div>
              <h2 style={{ margin: 0 }}>{t.dashboard.myProjects}</h2>
            </div>
            <Link href="/projects/new" className="icon-btn" aria-label={t.nav.newProject}>+</Link>
          </div>
          {myProjects.length === 0 ? (
            <p className="muted" style={{ marginTop: 14 }}>{t.dashboard.noProjects}</p>
          ) : (
            <div style={{ marginTop: 14 }}>
              {myProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="list-item" style={{ justifyContent: "space-between" }}>
                  <b>{p.title}</b>
                  <span className={`tag ${p.status === "done" ? "tag-good" : p.status === "open" ? "tag-accent" : "tag-warn"}`}>{t.status[p.status]}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
