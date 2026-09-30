import { skillLabel } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";

type Kind = "roles" | "skills" | "interests";

export function label(t: Dict, kind: Kind, id: string) {
  if (kind === "skills") return skillLabel(id);
  return (kind === "roles" ? t.roles : t.interests)[id] ?? id;
}

export default function Tags({
  t,
  kind,
  items,
  variant,
}: {
  t: Dict;
  kind: Kind;
  items: string[];
  variant?: "accent" | "good" | "warn";
}) {
  if (!items?.length) return null;
  return (
    <div className="chips">
      {items.map((id) => (
        <span key={id} className={`tag${variant ? ` tag-${variant}` : ""}`}>
          {label(t, kind, id)}
        </span>
      ))}
    </div>
  );
}
