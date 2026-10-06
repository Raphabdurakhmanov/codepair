import { fmt, type Dict } from "@/lib/i18n";

export interface SiteNotification {
  id: number;
  user_id: string;
  kind: string;
  payload: Record<string, any>;
  created_at: string;
  read_at: string | null;
}

const ICONS: Record<string, string> = {
  invite_received: "📩",
  request_received: "🙋",
  invite_accepted: "✅",
  invite_declined: "❌",
  request_accepted: "🎉",
  request_declined: "😔",
  member_joined: "👋",
  member_left: "🚪",
  member_removed: "🚪",
  role_changed: "🔄",
  ownership_received: "👑",
  project_done: "🏁",
  new_project: "🆕",
};

/** invitation_answered is stored once and shown as one of four texts. */
export function effectiveKind(n: Pick<SiteNotification, "kind" | "payload">): string {
  if (n.kind !== "invitation_answered") return n.kind;
  const prefix = n.payload.kind === "invite" ? "invite" : "request";
  return `${prefix}_${n.payload.status === "accepted" ? "accepted" : "declined"}`;
}

/** Text, icon and link for one notification in the current language. */
export function describe(t: Dict, n: Pick<SiteNotification, "kind" | "payload">) {
  const kind = effectiveKind(n);
  const p = n.payload ?? {};
  const role = p.role && p.role !== "owner" ? t.roles[p.role] ?? p.role : "—";
  const template = (t.notif as Record<string, string>)[kind] ?? kind;
  const text = fmt(template, {
    from: p.from || "—",
    by: p.by || "—",
    project: p.project || "—",
    role,
  });
  const pid = p.project_id ? String(p.project_id) : "";
  let href = pid ? `/projects/${pid}` : "/dashboard";
  if (kind === "request_received" || kind === "member_left" || kind === "invite_declined") href = `/team?project=${pid}`;
  if (kind === "member_removed" || kind === "request_declined") href = "/projects";
  return { kind, icon: ICONS[kind] ?? "🔔", text, href, message: typeof p.message === "string" ? p.message : "" };
}
