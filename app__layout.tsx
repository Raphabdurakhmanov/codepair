import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "CodePair",
  description: "From skills to teams. From teams to real projects.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <Nav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
