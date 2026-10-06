import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { Member } from "@/lib/data";
import { RoleOptions } from "./RoleSelect";
import Avatar from "./Avatar";
import { removeMember, saveContribution, setMemberRole, transferOwnership } from "@/app/actions";

/** Team list. With `manage` the owner gets role select, transfer and remove for each member. */
export default function TeamMembers({
  t,
  projectId,
  members,
  ownerId,
  meId,
  manage,
}: {
  t: Dict;
  projectId: string;
  members: Member[];
  ownerId: string;
  meId: string;
  manage: boolean;
}) {
  const roleName = (r: string) => t.roles[r] ?? r;
  // owner first, then by join date
  const sorted = [...members].sort((a, b) => Number(b.user_id === ownerId) - Number(a.user_id === ownerId));
  return (
    <ul className="list">
      {sorted.map((m) => {
        const isMe = m.user_id === meId;
        const isTheOwner = m.user_id === ownerId;
        const canManage = manage && !isMe;
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
                    <input type="hidden" name="project_id" value={projectId} />
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
                        <input type="hidden" name="project_id" value={projectId} />
                        <input type="hidden" name="user_id" value={m.user_id} />
                        <p className="small muted">{t.project.makeOwnerConfirm}</p>
                        <button className="btn btn-sm">★ {t.project.makeOwner}</button>
                      </form>
                      <form action={removeMember}>
                        <input type="hidden" name="project_id" value={projectId} />
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
                <input type="hidden" name="project_id" value={projectId} />
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
  );
}
