import { ROLE_GROUPS } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";
import ChipGroup from "./ChipGroup";

/** <option>s for a role <select>, grouped by area (Development, Security, ...). */
export function RoleOptions({ t, only }: { t: Dict; only?: string[] }) {
  return (
    <>
      {ROLE_GROUPS.map((g) => {
        const roles = only ? g.roles.filter((r) => only.includes(r)) : g.roles;
        if (!roles.length) return null;
        return (
          <optgroup key={g.id} label={t.roleGroups[g.id]}>
            {roles.map((r) => (
              <option key={r} value={r}>
                {t.roles[r] ?? r}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );
}

/** Role chips grouped by area (uncontrolled, for server forms). */
export function RoleChips({ t, name, selected }: { t: Dict; name: string; selected: string[] }) {
  return (
    <div className="role-groups">
      {ROLE_GROUPS.map((g) => (
        <div key={g.id} className="role-group">
          <div className="role-group-title">{t.roleGroups[g.id]}</div>
          <ChipGroup name={name} options={g.roles.map((id) => ({ id, label: t.roles[id] ?? id }))} selected={selected} />
        </div>
      ))}
    </div>
  );
}
