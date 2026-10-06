import Link from "next/link";
import { getMyProfile, getSession, getUnreadCount } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { getAppearance, nextAccent } from "@/lib/theme";
import { toggleAccent, toggleTheme } from "@/app/actions";
import LangSwitcher from "./LangSwitcher";
import NavLink from "./NavLink";
import Icon from "./Icons";
import Avatar from "./Avatar";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";

export default async function Shell({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getDict();
  const { theme, accent } = await getAppearance();
  const { user } = await getSession();

  const themeSwitch = (
    <form action={toggleTheme}>
      <input type="hidden" name="theme" value={theme === "dark" ? "light" : "dark"} />
      <button className="rail-btn" type="submit" title={theme === "dark" ? t.nav.themeLight : t.nav.themeDark} aria-label={t.nav.theme}>
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </button>
    </form>
  );
  const accentSwitch = (
    <form action={toggleAccent}>
      <input type="hidden" name="accent" value={nextAccent(accent)} />
      <button className="rail-btn" type="submit" title={t.nav.accent} aria-label={t.nav.accent}>
        <span className={`accent-dot accent-dot-${nextAccent(accent)}`} />
      </button>
    </form>
  );

  if (!user) {
    return (
      <>
        <header className="container public-bar glass">
          <Link href="/" className="brand">
            <Logo /> Code<span>Pair</span>
          </Link>
          <div className="row">
            <LangSwitcher current={locale} />
            {themeSwitch}
            {accentSwitch}
            <Link href="/login" className="btn btn-primary btn-sm">
              {t.common.signIn}
            </Link>
          </div>
        </header>
        <main className="container public-main">{children}</main>
      </>
    );
  }

  const [profile, unread] = await Promise.all([getMyProfile(), getUnreadCount()]);

  return (
    <div className="app">
      <aside className="rail glass">
        <Link href="/dashboard" className="rail-logo" aria-label="CodePair">
          <Logo size={30} />
        </Link>
        <nav className="rail-group">
          <NavLink href="/dashboard" title={t.nav.dashboard}><Icon name="home" /></NavLink>
          <NavLink href="/projects" title={t.nav.projects}><Icon name="folder" /></NavLink>
          <NavLink href="/team" title={t.nav.team}><Icon name="team" /></NavLink>
          <NavLink href="/people" title={t.nav.people}><Icon name="users" /></NavLink>
          <NavLink href="/profile" title={t.nav.profile}><Icon name="user" /></NavLink>
        </nav>
        <span className="rail-label">quick</span>
        <div className="rail-group">
          <Link href="/projects/new" className="rail-btn rail-btn-accent" title={t.nav.newProject} aria-label={t.nav.newProject}>
            <Icon name="plus" />
          </Link>
          {themeSwitch}
          {accentSwitch}
          <form action="/auth/signout" method="post">
            <button className="rail-btn" type="submit" title={t.common.signOut} aria-label={t.common.signOut}>
              <Icon name="logout" />
            </button>
          </form>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar glass">
          <div>
            <div className="eyebrow">CodePair</div>
            <div className="topbar-title">{t.nav.workspace}</div>
          </div>
          <div className="topbar-right">
            <LangSwitcher current={locale} />
            <NotificationBell initial={unread} title={t.nav.notifications} />
            <Link href={`/u/${user.id}`} className="pill-group">
              <Avatar name={profile?.full_name ?? ""} url={profile?.avatar_url} />
              <span className="pill-text">
                <small>{profile?.university || "CodePair"}</small>
                <b>{profile?.full_name || "—"}</b>
              </span>
            </Link>
            <Link href="/projects/new" className="btn btn-primary">
              + {t.nav.newProject}
            </Link>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
