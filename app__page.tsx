import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import LegalLinks from "@/components/LegalLinks";

export default async function Landing() {
  const { user } = await getSession();
  if (user) redirect("/dashboard");
  const { t, locale } = await getDict();

  return (
    <>
      <section className="hero">
        <div className="eyebrow">{t.landing.eyebrow}</div>
        <h1 style={{ marginTop: 12 }}>{t.landing.title}</h1>
        <p className="tag tag-accent" style={{ marginBottom: 16 }}>{t.common.tagline}</p>
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

      <div className="card card-accent" style={{ marginTop: 24 }}>
        <div className="eyebrow">Matching</div>
        <h3>{t.landing.principleTitle}</h3>
        <p style={{ margin: 0 }}>{t.landing.principleText}</p>
      </div>
      <LegalLinks locale={locale} />
    </>
  );
}
