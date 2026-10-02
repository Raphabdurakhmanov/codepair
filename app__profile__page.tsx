import Link from "next/link";
import { requireUser } from "@/lib/data";
import { getDict, fmt } from "@/lib/i18n";
import { INTERESTS, LEVELS, ROLES, SKILLS } from "@/lib/catalog";
import { saveProfile, syncGithub } from "@/app/actions";
import ChipGroup from "@/components/ChipGroup";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; github?: string }>;
}) {
  const { t } = await getDict();
  const { user, profile } = await requireUser();
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

      <aside className="card">
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
      </aside>
    </div>
  );
}
