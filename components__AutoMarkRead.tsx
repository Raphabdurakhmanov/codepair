"use client";
import { useEffect } from "react";
import { markNotificationsRead } from "@/app/actions";

/** Marks notifications as read shortly after the page is opened (the highlight stays until next visit). */
export default function AutoMarkRead({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      markNotificationsRead().catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [enabled]);
  return null;
}
