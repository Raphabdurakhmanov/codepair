import { NextResponse } from "next/server";
import { deliverPending, hasSecret, setupBot } from "@/lib/telegram";

// Open once in the browser: /api/telegram/setup?secret=YOUR_SECRET
// Connects the bot to this site (webhook) and sets the command menu.
export async function GET(req: Request) {
  if (!hasSecret(req)) return NextResponse.json({ ok: false, error: "wrong or missing secret" }, { status: 403 });
  const missing = ["TELEGRAM_BOT_TOKEN", "SUPABASE_SECRET_KEY", "CODEPAIR_BOT_SECRET"].filter((k) => !process.env[k]);
  if (missing.length) return NextResponse.json({ ok: false, missing }, { status: 500 });
  try {
    const origin = new URL(req.url).origin;
    const webhook = await setupBot(origin);
    const sent = await deliverPending();
    return NextResponse.json({ ok: true, message: "Bot is connected to the site", webhook, sent_pending: sent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
