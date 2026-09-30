import { setLocale } from "@/app/actions";
import { LOCALES, type Locale } from "@/lib/i18n";

const LABELS: Record<Locale, string> = { ru: "RU", en: "EN", uz: "UZ" };

export default function LangSwitcher({ current }: { current: Locale }) {
  return (
    <form action={setLocale} className="lang">
      {LOCALES.map((l) => (
        <button key={l} name="locale" value={l} type="submit" aria-current={l === current}>
          {LABELS[l]}
        </button>
      ))}
    </form>
  );
}
