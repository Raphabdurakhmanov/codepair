import Link from "next/link";
import { requireUser, type Invitation } from "@/lib/data";
import { getDict, fmt } from "@/lib/i18n";
import { describe, type SiteNotification } from "@/lib/notifications";
import { respondInvitation, markNotificationsRead, clearReadNotifications } from "@/app/actions";
import AutoMarkRead from "@/components/AutoMarkRead";

function timeAgo(iso: string, locale: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
  ];
  const abs = Math.abs(diff);
  for (let i = 0; i < steps.length; i++) {
    if (abs < steps[i][0]) {
      const unitSec = i === 0 ? 1 : steps[i - 1][0];
      return rtf.format(Math.round(diff / unitSec), steps[i][1]);
    }
  }
  return new Date(iso).toLocaleDateString(locale);
}

export default async function NotificationsPage() {
  const { t, locale } = await getDict();
  const { supabase, user } = await requireUser();

  const [{ data, error }, { data: tg }] = await Promise.all([
    supabase.from("site_notifications").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("telegram_links").select("chat_id").eq("user_id", user.id).maybeSingle(),
  ]);
  const items = (error ? [] : data ?? []) as SiteNotification[];
  const unread = items.filter((n) => !n.read_at).length;

  // which invitations / requests can still be answered right here
  const invIds = items
    .filter((n) => n.kind === "invite_received" || n.kind === "request_received")
    .map((n) => String(n.payload?.invitation_id ?? ""))
    .filter(Boolean);
  const { data: pendingData } = invIds.length
    ? await supabase.from("invitations").select("*").in("id", invIds).eq("status", "pending").eq("to_user", user.id)
    : { data: [] as Invitation[] };
  const pending = new Set(((pendingData ?? []) as Invitation[]).map((i) => i.id));

  return (
    <>
      <div className="team-head">
        <div>
          <div className="eyebrow">{t.nav.notifications}</div>
          <h1 style={{ margin: 0 }}>
            {t.notif.title} {unread > 0 && <span className="tag tag-accent">{unread} {t.notif.unread}</span>}
          </h1>
          <p className="muted">{t.notif.subtitle}</p>
        </div>
        {items.length > 0 && (
          <div className="row">
            {unread > 0 && (
              <form action={markNotificationsRead}>
                <button className="btn btn-sm">{t.notif.markAll}</button>
              </form>
            )}
            <form action={clearReadNotifications}>
              <button className="btn btn-ghost btn-sm">{t.notif.clear}</button>
            </form>
          </div>
        )}
      </div>

      {!tg?.chat_id && (
        <p className="notice small" style={{ marginBottom: 16 }}>
          📲 <Link href="/profile#telegram">{t.notif.tgHint}</Link>
        </p>
      )}

      {items.length === 0 ? (
        <div className="empty">{t.notif.empty}</div>
      ) : (
        <ul className="notif-list">
          {items.map((n) => {
            const d = describe(t, n);
            const invId = String(n.payload?.invitation_id ?? "");
            const canAnswer = invId && pending.has(invId);
            return (
              <li key={n.id} className={`notif${n.read_at ? "" : " is-unread"}`}>
                <span className="notif-icon" aria-hidden="true">{d.icon}</span>
                <div className="notif-body">
                  <Link href={d.href} className="notif-text">{d.text}</Link>
                  {n.payload?.role && n.payload.role !== "owner" && (d.kind === "invite_received" || d.kind === "request_received") && (
                    <div className="small muted">{fmt(t.dashboard.asRole, { role: t.roles[n.payload.role] ?? n.payload.role })}</div>
                  )}
                  {d.message && <div className="small" style={{ marginTop: 4 }}>💬 {d.message}</div>}
                  <div className="notif-time">{timeAgo(n.created_at, locale)}</div>
                  {canAnswer && (
                    <form action={respondInvitation} className="notif-actions">
                      <input type="hidden" name="id" value={invId} />
                      <button name="accept" value="1" className="btn btn-primary btn-sm">{t.dashboard.accept}</button>
                      <button name="accept" value="0" className="btn btn-ghost btn-sm">{t.dashboard.decline}</button>
                    </form>
                  )}
                </div>
                {!n.read_at && <span className="notif-dot" aria-label={t.notif.new} />}
              </li>
            );
          })}
        </ul>
      )}
      <AutoMarkRead enabled={unread > 0} />
    </>
  );
}
