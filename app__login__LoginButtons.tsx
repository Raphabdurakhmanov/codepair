"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginButtons({ next, labels }: { next: string; labels: { github: string; google: string } }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function signIn(provider: "github" | "google") {
    setBusy(provider);
    const supabase = createClient();
    // always return to the same domain the user started on (PKCE cookie lives there)
    const site = window.location.origin;
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${site}/auth/callback?next=${encodeURIComponent(safeNext)}` },
    });
  }

  return (
    <div className="stack" style={{ marginTop: 20 }}>
      <button className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={!!busy} onClick={() => signIn("github")}>
        {busy === "github" ? "…" : labels.github}
      </button>
      <button className="btn btn-lg" style={{ width: "100%" }} disabled={!!busy} onClick={() => signIn("google")}>
        {busy === "google" ? "…" : labels.google}
      </button>
    </div>
  );
}
