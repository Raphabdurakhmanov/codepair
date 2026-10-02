import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const LABELS: Record<Locale, [string, string]> = {
  ru: ["Политика конфиденциальности", "Условия использования"],
  en: ["Privacy Policy", "Terms of Use"],
  uz: ["Maxfiylik siyosati", "Foydalanish shartlari"],
};

export default function LegalLinks({ locale }: { locale: Locale }) {
  const [privacy, terms] = LABELS[locale];
  return (
    <p className="muted small" style={{ textAlign: "center", marginTop: 28 }}>
      <Link href="/privacy">{privacy}</Link> · <Link href="/terms">{terms}</Link>
    </p>
  );
}
