import { NextResponse } from "next/server";
import { deliverPending, handleUpdate, hasSecret } from "@/lib/telegram";

// Telegram calls this URL for every message sent to the bot.
export async function POST(req: Request) {
  if (!hasSecret(req)) return NextResponse.json({ ok: false }, { status: 403 });
  const update = await req.json().catch(() => ({}));
  try {
    await handleUpdate(update);
    await deliverPending();
  } catch (e) {
    console.error("telegram webhook failed", e);
  }
  // always 200, otherwise Telegram keeps re-sending the same update
  return NextResponse.json({ ok: true });
}
