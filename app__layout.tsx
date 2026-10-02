import type { Metadata } from "next";
import "./globals.css";
import Shell from "@/components/Shell";
import { getLocale } from "@/lib/i18n";
import { getAppearance } from "@/lib/theme";

export const metadata: Metadata = {
  title: "CodePair",
  description: "From skills to teams. From teams to real projects.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { theme, accent } = await getAppearance();
  return (
    <html lang={locale} data-theme={theme} data-accent={accent}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="bg-orbs" aria-hidden="true" />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
