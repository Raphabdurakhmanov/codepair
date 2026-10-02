import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n";
import LoginButtons from "./LoginButtons";
import Logo from "@/components/Logo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { t } = await getDict();
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="card" style={{ maxWidth: 440, margin: "48px auto", textAlign: "center" }}>
      <div className="rail-logo" style={{ margin: "0 auto 18px", width: 72, height: 72, borderRadius: 24 }}>
        <Logo size={40} />
      </div>
      <h1>{t.login.title}</h1>
      <p className="muted">{t.login.subtitle}</p>
      {sp.error && (
        <p className="notice notice-warn">
          {t.common.error}
          {sp.error !== "auth" && (
            <>
              <br />
              <small className="muted">{sp.error}</small>
            </>
          )}
        </p>
      )}
      <LoginButtons next={sp.next ?? "/dashboard"} labels={{ github: t.login.github, google: t.login.google }} />
    </div>
  );
}
