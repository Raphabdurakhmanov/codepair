import { cookies } from "next/headers";

export const THEMES = ["dark", "light"] as const;
export const ACCENTS = ["blue", "red"] as const;
export type Theme = (typeof THEMES)[number];
export type Accent = (typeof ACCENTS)[number];

export async function getAppearance(): Promise<{ theme: Theme; accent: Accent }> {
  const c = await cookies();
  const theme = c.get("theme")?.value === "light" ? "light" : "dark";
  const accent = c.get("accent")?.value === "red" ? "red" : "blue";
  return { theme, accent };
}
