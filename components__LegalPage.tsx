import type { LegalDoc } from "@/lib/legal";
import { UPDATED } from "@/lib/legal";

export default function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <article className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="eyebrow">CodePair</div>
      <h1>{doc.title}</h1>
      <p className="muted small">
        {doc.updated}: {UPDATED}
      </p>
      <p>{doc.intro}</p>
      {doc.sections.map(([title, body]) => (
        <section key={title} style={{ marginTop: 22 }}>
          <h2>{title}</h2>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {body.map((line) => (
              <li key={line} style={{ marginTop: 6 }}>
                {line}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}
