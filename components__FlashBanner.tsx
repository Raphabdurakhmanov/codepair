"use client";
import { useEffect, useState } from "react";

/** One-time message from a server action (cookie "flash"); disappears on close or after 8 s. */
export default function FlashBanner({ message, closeLabel }: { message: string; closeLabel: string }) {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    document.cookie = "flash=; Max-Age=0; path=/";
    const timer = setTimeout(() => setShown(false), 8000);
    return () => clearTimeout(timer);
  }, [message]);
  if (!shown) return null;
  return (
    <div className="flash notice notice-warn" role="alert">
      <span>⚠️ {message}</span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShown(false)} aria-label={closeLabel}>
        ✕
      </button>
    </div>
  );
}
