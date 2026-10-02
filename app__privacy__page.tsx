import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import { getPrivacy } from "@/lib/legal";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy — CodePair" };

export default async function PrivacyPage() {
  return <LegalPage doc={getPrivacy(await getLocale())} />;
}
