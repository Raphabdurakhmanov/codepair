import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDict } from "@/lib/i18n";

export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  const { t } = await getDict();

  return (
    <>
      <section className="hero">
        <p className="tag tag-accent">{t.common.tagline}</p>
        <h1 style={{ marginTop: 16 }}>{t.landing.title}</h1>
        <p>{t.landing.subtitle}</p>
        <Link href="/login" className="btn btn-primary btn-lg" style={{ marginTop: 12 }}>
          {t.landing.cta}
        </Link>
      </section>

      <div className="section-title">
        <h2>{t.landing.loopTitle}</h2>
      </div>
      <div className="grid steps">
        {t.landing.steps.map(([title, text]) => (
          <div className="card" key={title}>
            <h3>{title}</h3>
            <p className="muted small" style={{ margin: 0 }}>
              {text}
            </p>
          </div>
        ))}
      </div>

      <div className="card notice" style={{ marginTop: 24 }}>
        <h3>{t.landing.principleTitle}</h3>
        <p style={{ margin: 0 }}>{t.landing.principleText}</p>
      </div>
    </>
  );
}
