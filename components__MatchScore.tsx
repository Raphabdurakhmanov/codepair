import type { MatchResult, Reason } from "@/lib/matching";
import { fmt, type Dict } from "@/lib/i18n";
import { label } from "./Tags";

function reasonText(t: Dict, r: Reason): string {
  switch (r.code) {
    case "covers_gap":
      return fmt(t.reasons.covers_gap, { x: r.roles.map((x) => label(t, "roles", x)).join(", ") });
    case "duplicate_role":
      return fmt(t.reasons.duplicate_role, { x: r.roles.map((x) => label(t, "roles", x)).join(", ") });
    case "skills":
      return fmt(t.reasons.skills, { x: r.items.map((x) => label(t, "skills", x)).join(", ") });
    case "interests":
      return fmt(t.reasons.interests, { x: r.items.map((x) => label(t, "interests", x)).join(", ") });
    case "level":
      return fmt(t.reasons.level, { x: t.levels[r.level] ?? r.level });
    case "time":
      return fmt(t.reasons.time, { n: r.hours });
    case "experience":
      return fmt(t.reasons.experience, { n: r.count });
  }
}

export function Score({ t, value }: { t: Dict; value: number }) {
  const cls = value >= 60 ? "" : value >= 35 ? " mid" : " low";
  return (
    <span className={`score${cls}`}>
      {value}% <small>{t.common.match}</small>
    </span>
  );
}

export default function MatchScore({ t, match }: { t: Dict; match: MatchResult }) {
  return (
    <div>
      <Score t={t} value={match.score} />
      <ul className="reasons">
        {match.reasons.map((r, i) => (
          <li key={i} className={r.code === "covers_gap" ? "plus" : r.code === "duplicate_role" ? "minus" : ""}>
            {reasonText(t, r)}
          </li>
        ))}
      </ul>
    </div>
  );
}
