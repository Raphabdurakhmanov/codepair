import { cookies } from "next/headers";

export const THEMES = ["dark", "light"] as const;
export const ACCENTS = ["blue", "red", "htb"] as const;
export type Theme = (typeof THEMES)[number];
export type Accent = (typeof ACCENTS)[number];

export async function getAppearance(): Promise<{ theme: Theme; accent: Accent }> {
  const c = await cookies();
  const theme = c.get("theme")?.value === "light" ? "light" : "dark";
  const raw = c.get("accent")?.value;
  const accent: Accent = raw === "red" || raw === "htb" ? raw : "blue";
  return { theme, accent };
}

/** Accent the switcher moves to next: blue → red → HTB green → blue. */
export const nextAccent = (a: Accent): Accent => ACCENTS[(ACCENTS.indexOf(a) + 1) % ACCENTS.length];
