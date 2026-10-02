import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import { getTerms } from "@/lib/legal";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Use — CodePair" };

export default async function TermsPage() {
  return <LegalPage doc={getTerms(await getLocale())} />;
}
