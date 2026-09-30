import { cookies, headers } from "next/headers";
import ru, { type Dict } from "./ru";
import en from "./en";
import uz from "./uz";

export const LOCALES = ["ru", "en", "uz"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_COOKIE = "locale";

const DICTS: Record<Locale, Dict> = { ru, en, uz };

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

export async function getLocale(): Promise<Locale> {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  const accept = ((await headers()).get("accept-language") ?? "").toLowerCase();
  if (accept.startsWith("uz")) return "uz";
  if (accept.startsWith("en")) return "en";
  return "ru";
}

export async function getDict(): Promise<{ locale: Locale; t: Dict }> {
  const locale = await getLocale();
  return { locale, t: DICTS[locale] };
}

/** "Hello {name}" + {name: "Ali"} → "Hello Ali" */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export type { Dict };
