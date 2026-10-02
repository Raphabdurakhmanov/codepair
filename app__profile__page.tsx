import Link from "next/link";
import { requireUser } from "@/lib/data";
import { getDict, fmt } from "@/lib/i18n";
import { INTERESTS, LEVELS, ROLES, SKILLS } from "@/lib/catalog";
import { saveProfile, syncGithub, connectTelegram, disconnectTelegram } from "@/app/actions";
import ChipGroup from "@/components/ChipGroup";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; github?: string; telegram?: string }>;
}) {
  const { t } = await getDict();
  const { supabase, user, profile } = await requireUser();
  const { data: tgLink } = await supabase
    .from("telegram_links")
    .select("chat_id, enabled, link_token")
    .eq("user_id", user.id)
    .maybeSingle();
  const bot = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "").replace(/^@/, "");
  const tg = tgLink as { chat_id: number | null; enabled: boolean; link_token: string | null } | null;
  const sp = await searchParams;
  const p = profile;

  return (
    <div className="two-col">
      <div className="card">
        <div className="row between">
          <div>
            <div className="eyebrow">{t.nav.profile}</div>
            <h1>{t.profile.editTitle}</h1>
          </div>
          <Link href={`/u/${user.id}`} className="small">
            {t.profile.viewPublic} →
          </Link>
        </div>
        {sp.saved && <p className="notice notice-good">{t.common.saved}</p>}
        {p.roles.length === 0 && <p className="notice notice-warn">{t.profile.completeFirst}</p>}

        <form action={saveProfile} className="form">
          <div className="form-row">
            <label className="field">
              <span className="label">{t.profile.fullName}</span>
              <input type="text" name="full_name" defaultValue={p.full_name} required maxLength={120} />
            </label>
            <label className="field">
              <span className="label">{t.profile.university}</span>
              <input type="text" name="university" defaultValue={p.university} maxLength={120} placeholder="Webster University Tashkent" />
            </label>
          </div>

          <fieldset>
            <legend className="label">{t.profile.roles}</legend>
            <ChipGroup name="roles" options={ROLES.map((id) => ({ id, label: t.roles[id] }))} selected={p.roles} />
            <p className="hint">{t.profile.rolesHint}</p>
          </fieldset>

          <fieldset>
            <legend className="label">{t.profile.skills}</legend>
            <ChipGroup name="skills" options={SKILLS} selected={p.skills} />
          </fieldset>

          <fieldset>
            <legend className="label">{t.profile.interests}</legend>
            <ChipGroup name="interests" options={INTERESTS.map((id) => ({ id, label: t.interests[id] }))} selected={p.interests} />
          </fieldset>

          <div className="form-row">
            <label className="field">
              <span className="label">{t.profile.level}</span>
              <select name="level" defaultValue={p.level}>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {t.levels[l]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">{t.profile.hours}</span>
              <input type="number" name="hours_per_week" min={0} max={80} defaultValue={p.hours_per_week} />
            </label>
          </div>

          <label className="field">
            <span className="label">{t.profile.bio}</span>
            <textarea name="bio" defaultValue={p.bio} placeholder={t.profile.bioPh} maxLength={1500} />
          </label>

          <label className="field">
            <span className="label">{t.profile.goals}</span>
            <input type="text" name="goals" defaultValue={p.goals} placeholder={t.profile.goalsPh} maxLength={500} />
          </label>

          <div className="form-row">
            <label className="field">
              <span className="label">{t.profile.telegram}</span>
              <input type="text" name="telegram" defaultValue={p.telegram} placeholder={t.profile.telegramPh} maxLength={64} />
            </label>
            <label className="field">
              <span className="label">{t.profile.github}</span>
              <input type="text" name="github_username" defaultValue={p.github_username} placeholder={t.profile.githubPh} maxLength={39} />
            </label>
          </div>

          <button className="btn btn-primary" type="submit">
            {t.common.save}
          </button>
        </form>
      </div>

      <aside className="stack">
      <div className="card" id="telegram">
        <div className="eyebrow">Telegram</div>
        <h2>{t.profile.tgTitle}</h2>
        <p className="muted small">{t.profile.tgHint}</p>
        {sp.telegram === "error" && <p className="notice notice-warn small">{t.profile.tgError}</p>}
        {tg?.chat_id ? (
          <>
            <p className={`notice small ${tg.enabled ? "notice-good" : "notice-warn"}`}>
              {tg.enabled ? t.profile.tgConnected : t.profile.tgMuted}
            </p>
            <form action={disconnectTelegram}>
              <button className="btn btn-sm btn-ghost btn-danger" type="submit">
                {t.profile.tgDisconnect}
              </button>
            </form>
          </>
        ) : (
          <>
            {tg?.link_token && bot ? (
              <div className="stack">
                <p className="notice small">{t.profile.tgStep}</p>
                <a className="btn btn-primary" href={`https://t.me/${bot}?start=${tg.link_token}`} target="_blank" rel="noreferrer">
                  ✈ {t.profile.tgOpenApp}
                </a>
                <a
                  className="btn"
                  href={`https://web.telegram.org/k/#?tgaddr=${encodeURIComponent(`tg://resolve?domain=${bot}&start=${tg.link_token}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  🌐 {t.profile.tgOpenWeb}
                </a>
                <div className="small muted">
                  {t.profile.tgManual}
                  <code style={{ display: "block", marginTop: 6, padding: "8px 10px", borderRadius: 10, background: "var(--glass-strong)", userSelect: "all", wordBreak: "break-all" }}>
                    /start {tg.link_token}
                  </code>
                  <span>@{bot}</span>
                </div>
                <p className="hint">{t.profile.tgPending}</p>
              </div>
            ) : (
              <form action={connectTelegram}>
                <button className="btn btn-primary" type="submit">
                  ✈ {t.profile.tgConnect}
                </button>
              </form>
            )}
          </>
        )}
      </div>
      <div className="card">
        <div className="eyebrow">Signal</div>
        <h2>GitHub</h2>
        <p className="muted small">{t.profile.githubNote}</p>
        {sp.github === "notfound" && <p className="notice notice-warn small">{t.profile.githubNotFound}</p>}
        {p.github_synced_at && (
          <>
            <p className="small">
              <a href={`https://github.com/${p.github_username}`} target="_blank" rel="noreferrer">
                @{p.github_username}
              </a>{" "}
              · {fmt(t.profile.githubInfo, { n: p.github_repos })}
            </p>
            <p className="label">{t.profile.githubLangs}</p>
            <div className="chips">
              {p.github_languages.map((l) => (
                <span className="tag" key={l}>
                  {l}
                </span>
              ))}
            </div>
          </>
        )}
        <form action={syncGithub} style={{ marginTop: 16 }}>
          <button className="btn" type="submit">
            {t.profile.syncGithub}
          </button>
        </form>
      </div>
      </aside>
    </div>
  );
}
