"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "./Icons";

/** Bell with unread badge. Server passes the count on every navigation; the client re-checks every 30 s. */
export default function NotificationBell({ initial, title }: { initial: number; title: string }) {
  const [count, setCount] = useState(initial);
  const path = usePathname();

  useEffect(() => setCount(initial), [initial]);

  useEffect(() => {
    const supabase = createClient();
    let stop = false;
    const check = async () => {
      if (document.hidden) return;
      const { count: c, error } = await supabase
        .from("site_notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null);
      if (!stop && !error) setCount(c ?? 0);
    };
    const timer = setInterval(check, 30000);
    document.addEventListener("visibilitychange", check);
    return () => {
      stop = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\+?\)\s*/, "");
    document.title = count > 0 ? `(${count > 99 ? "99+" : count}) ${base}` : base;
  }, [count, path]);

  const active = path === "/notifications";
  return (
    <Link
      href="/notifications"
      className={`rail-btn bell${active ? " is-active" : ""}`}
      title={title}
      aria-label={count > 0 ? `${title}: ${count}` : title}
    >
      <Icon name="bell" />
      {count > 0 && <span className="bell-badge">{count > 99 ? "99+" : count}</span>}
    </Link>
  );
}
