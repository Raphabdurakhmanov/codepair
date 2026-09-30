import Link from "next/link";
import { requireUser, loadMembers, teamRolesFor, toMatchPerson, completedCounts, type Profile, type Project, type Invitation } from "@/lib/data";
import { getDict, fmt } from "@/lib/i18n";
import { ROLES, SKILLS } from "@/lib/catalog";
import { rankPeople, skillGap } from "@/lib/matching";
import { inviteUser } from "@/app/actions";
import Avatar from "@/components/Avatar";
import Tags from "@/components/Tags";
import MatchScore from "@/components/MatchScore";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; role?: string; skill?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const { t } = await getDict();
  const { supabase, user } = await requireUser();

  // projects I own and can recruit for
  const { data: ownData } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .neq("status", "done")
    .order("created_at", { ascending: false });
  const ownProjects = (ownData ?? []) as Project[];
  const project = ownProjects.find((p) => p.id === sp.project) ?? null;

  // people query
  let q = supabase.from("profiles").select("*").neq("id", user.id).limit(300);
  if (sp.role && (ROLES as readonly string[]).includes(sp.role)) q = q.contains("roles", [sp.role]);
  if (sp.skill && SKILLS.some((s) => s.id === sp.skill)) q = q.contains("skills", [sp.skill]);
  const text = (sp.q ?? "").replace(/[,()%*\\]/g, " ").trim().slice(0, 60);
  if (text) q = q.or(`full_name.ilike.%${text}%,university.ilike.%${text}%,bio.ilike.%${text}%`);
  const { data: peopleData } = await q;
  const people = ((peopleData ?? []) as Profile[]).filter((p) => p.roles.length > 0);

  // matching context
  let ranked: { person: Profile; match: ReturnType<typeof rankPeople>[number]["match"] | null }[] = people.map((person) => ({ person, match: null }));
  let memberIds = new Set<string>();
  let invitedIds = new Set<string>();
  let gap: string[] = [];

  if (project) {
    const members = await loadMembers(supabase, [project.id]);
    memberIds = new Set(members.map((m) => m.user_id));
    const teamRoles = teamRolesFor(members);
    gap = skillGap(project, teamRoles);
    const counts = await completedCounts(supabase, people.map((p) => p.id));
    const byId = new Map(people.map((p) => [p.id, p]));
    ranked = rankPeople(
      people.filter((p) => !memberIds.has(p.id)).map((p) => toMatchPerson(p, counts[p.id] ?? 0)),
      project,
      teamRoles,
    ).map((r) => ({ person: byId.get(r.person.id)!, match: r.match }));

    const { data: inv } = await supabase
      .from("invitations")
      .select("*")
      .eq("project_id", project.id)
      .eq("kind", "invite")
      .eq("status", "pending");
    invitedIds = new Set(((inv ?? []) as Invitation[]).map((i) => i.to_user));
  }

  return (
    <>
      <h1>{project ? fmt(t.people.forProject, { title: project.title }) : t.people.title}</h1>
      <p className="muted">{project ? t.people.forProjectHint : t.people.subtitle}</p>

      {project && gap.length > 0 && (
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="small"><b>{t.project.skillGap}:</b></span>
          <Tags t={t} kind="roles" items={gap} variant="warn" />
        </div>
      )}

      <form className="card row" style={{ marginBottom: 16 }}>
        {ownProjects.length > 0 && (
          <select name="project" defaultValue={project?.id ?? ""} style={{ width: "auto", maxWidth: 260 }} aria-label={t.nav.projects}>
            <option value="">— {t.people.pickProject}</option>
            {ownProjects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        )}
        <select name="role" defaultValue={sp.role ?? ""} style={{ width: "auto" }} aria-label={t.people.role}>
          <option value="">{t.people.role}: {t.common.all}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{t.roles[r]}</option>
          ))}
        </select>
        <select name="skill" defaultValue={sp.skill ?? ""} style={{ width: "auto" }} aria-label={t.people.skill}>
          <option value="">{t.people.skill}: {t.common.all}</option>
          {SKILLS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <input type="search" name="q" defaultValue={sp.q ?? ""} placeholder={t.people.query} style={{ flex: 1, minWidth: 180 }} />
        <button className="btn btn-primary btn-sm">{t.common.search}</button>
      </form>

      {ranked.length === 0 ? (
        <div className="empty">{t.people.noResults}</div>
      ) : (
        <div className="grid">
          {ranked.map(({ person: p, match }) => (
            <div className="card" key={p.id}>
              <div className="row">
                <Avatar name={p.full_name} url={p.avatar_url} />
                <div style={{ minWidth: 0 }}>
                  <Link href={`/u/${p.id}`}><b>{p.full_name || "—"}</b></Link>
                  <div className="muted small">
                    {[p.university, t.levels[p.level], fmt(t.common.hoursWeek, { n: p.hours_per_week })].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              <div className="stack" style={{ marginTop: 12 }}>
                <Tags t={t} kind="roles" items={p.roles} variant="accent" />
                <Tags t={t} kind="skills" items={p.skills.slice(0, 8)} />
              </div>
              {match && (
                <div style={{ marginTop: 12 }}>
                  <MatchScore t={t} match={match} />
                </div>
              )}
              {project && (
                <div style={{ marginTop: 12 }}>
                  {memberIds.has(p.id) ? (
                    <span className="tag tag-good">{t.people.member}</span>
                  ) : invitedIds.has(p.id) ? (
                    <span className="tag tag-accent">{t.people.invited}</span>
                  ) : (
                    <form action={inviteUser} className="row">
                      <input type="hidden" name="project_id" value={project.id} />
                      <input type="hidden" name="to_user" value={p.id} />
                      <select name="role" defaultValue={match?.covers[0] ?? p.roles[0] ?? ""} style={{ width: "auto", flex: 1 }} aria-label={t.people.inviteAs}>
                        {p.roles.map((r) => (
                          <option key={r} value={r}>{t.roles[r]}</option>
                        ))}
                      </select>
                      <button className="btn btn-primary btn-sm">{t.people.invite}</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
