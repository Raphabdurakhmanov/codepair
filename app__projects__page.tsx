import Link from "next/link";
import { requireUser, loadMembers, teamRolesFor, toMatchPerson, type Project } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { RoleOptions } from "@/components/RoleSelect";
import { ROLES } from "@/lib/catalog";
import { scoreMatch, skillGap } from "@/lib/matching";
import Tags from "@/components/Tags";
import MatchScore from "@/components/MatchScore";
import MemberStack from "@/components/MemberStack";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; all?: string }>;
}) {
  const sp = await searchParams;
  const { t } = await getDict();
  const { supabase, profile } = await requireUser();

  let query = supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(200);
  if (!sp.all) query = query.neq("status", "done");
  if (sp.role && (ROLES as readonly string[]).includes(sp.role)) query = query.contains("needed_roles", [sp.role]);
  const { data } = await query;
  const projects = (data ?? []) as Project[];

  const members = await loadMembers(supabase, projects.map((p) => p.id));
  const me = toMatchPerson(profile);
  const rows = projects
    .map((p) => {
      const team = members.filter((m) => m.project_id === p.id);
      const roles = teamRolesFor(team);
      return {
        p,
        team,
        size: team.length,
        mine: team.some((m) => m.user_id === profile.id),
        gap: skillGap(p, roles),
        match: scoreMatch(me, p, roles),
      };
    })
    .sort((a, b) => Number(a.mine) - Number(b.mine) || b.match.score - a.match.score);

  return (
    <>
      <div className="section-title" style={{ marginTop: 0 }}>
        <div>
          <div className="eyebrow">CodePair</div>
          <h1 style={{ margin: 0 }}>{t.projects.title}</h1>
          <p className="muted" style={{ margin: 0 }}>{t.projects.subtitle}</p>
        </div>
        <Link href="/projects/new" className="btn btn-primary">+ {t.nav.newProject}</Link>
      </div>

      <form className="card row" style={{ marginBottom: 18, padding: 14, borderRadius: 24 }}>
        <select name="role" defaultValue={sp.role ?? ""} style={{ width: "auto" }} aria-label={t.people.role}>
          <option value="">{t.people.role}: {t.common.all}</option>
          <RoleOptions t={t} />
        </select>
        <label className="row small">
          <input type="checkbox" name="all" value="1" defaultChecked={!!sp.all} /> {t.projects.showAll}
        </label>
        <button className="btn btn-sm">{t.common.search}</button>
      </form>

      {rows.length === 0 ? (
        <div className="empty">{t.projects.noResults}</div>
      ) : (
        <div className="grid">
          {rows.map(({ p, team, size, mine, gap, match }) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="card" style={{ color: "inherit", textDecoration: "none" }}>
              <div className="row between">
                <span className="tag">{t.status[p.status]} · 👥 {size}</span>
                {mine && <span className="tag tag-good">{t.project.youAreMember}</span>}
              </div>
              <h3 style={{ marginTop: 10 }}>{p.title}</h3>
              <div style={{ margin: "-4px 0 8px" }}>
                <MemberStack members={team} />
              </div>
              <p className="muted small" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {p.description}
              </p>
              {gap.length > 0 && (
                <>
                  <p className="small" style={{ margin: "8px 0 4px" }}><b>{t.project.skillGap}:</b></p>
                  <Tags t={t} kind="roles" items={gap} variant="warn" />
                </>
              )}
              <div style={{ marginTop: 10 }}>
                <Tags t={t} kind="skills" items={p.tech.slice(0, 6)} />
              </div>
              {!mine && (
                <div style={{ marginTop: 12 }}>
                  <MatchScore t={t} match={match} />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
