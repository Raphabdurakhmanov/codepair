import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";
import { getLocale } from "@/lib/i18n";
import { getAppearance } from "@/lib/theme";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "CodePair",
  description: "From skills to teams. From teams to real projects.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { theme, accent } = await getAppearance();
  return (
    <html lang={locale} data-theme={theme} data-accent={accent} className={manrope.variable}>
      <body>
        <div className="bg-orbs" aria-hidden="true" />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
