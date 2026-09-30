import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n";
import LangSwitcher from "./LangSwitcher";

export default async function Nav() {
  const { locale, t } = await getDict();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href={user ? "/dashboard" : "/"} className="brand">
          Code<span>Pair</span>
        </Link>
        {user ? (
          <nav className="nav-links">
            <Link href="/dashboard">{t.nav.dashboard}</Link>
            <Link href="/projects">{t.nav.projects}</Link>
            <Link href="/people">{t.nav.people}</Link>
            <Link href="/profile">{t.nav.profile}</Link>
          </nav>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <div className="nav-right">
          <LangSwitcher current={locale} />
          {user ? (
            <>
              <Link href="/projects/new" className="btn btn-primary btn-sm">
                + {t.nav.newProject}
              </Link>
              <form action="/auth/signout" method="post">
                <button className="btn btn-ghost btn-sm" type="submit">
                  {t.common.signOut}
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              {t.common.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
