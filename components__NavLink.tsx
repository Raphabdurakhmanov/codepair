"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = path === href || path.startsWith(href + "/");
  return (
    <Link href={href} className={`rail-btn${active ? " is-active" : ""}`} title={title} aria-label={title}>
      {children}
    </Link>
  );
}
