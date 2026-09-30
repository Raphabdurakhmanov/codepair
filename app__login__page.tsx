import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n";
import LoginButtons from "./LoginButtons";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { t } = await getDict();
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="card" style={{ maxWidth: 420, margin: "48px auto" }}>
      <h1>{t.login.title}</h1>
      <p className="muted">{t.login.subtitle}</p>
      {sp.error && <p className="notice notice-warn">{t.common.error}</p>}
      <LoginButtons next={sp.next ?? "/dashboard"} labels={{ github: t.login.github, google: t.login.google }} />
    </div>
  );
}
