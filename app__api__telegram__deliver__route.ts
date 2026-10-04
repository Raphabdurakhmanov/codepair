import { NextResponse } from "next/server";
import { deliverPending, hasSecret } from "@/lib/telegram";

// Called by the database (pg_net trigger) right after new notifications are queued.
export async function POST(req: Request) {
  if (!hasSecret(req)) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    const sent = await deliverPending();
    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    console.error("telegram delivery failed", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
