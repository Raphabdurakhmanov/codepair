// Server-side Telegram bot (webhook mode on Vercel). Same behaviour as codepair_bot.py.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { COMMANDS, T, esc, fill, langOf, render, type Lang } from "./telegram-texts";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://codepair-swart.vercel.app").replace(/\/$/, "");

export class TelegramError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Supabase client with the secret key — server only, bypasses RLS. */
export function adminDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_SECRET_KEY is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function tg(method: string, params: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: unknown; error_code?: number; description?: string };
  if (!json.ok) throw new TelegramError(json.error_code ?? res.status, json.description ?? "Telegram error");
  return json.result;
}

const send = (chat: number, text: string) =>
  tg("sendMessage", { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true });

/** Shared secret check (Telegram webhook header or our own header / ?secret=). */
export function hasSecret(req: Request): boolean {
  const secret = process.env.CODEPAIR_BOT_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  return (
    req.headers.get("x-telegram-bot-api-secret-token") === secret ||
    req.headers.get("x-codepair-secret") === secret ||
    url.searchParams.get("secret") === secret
  );
}

// ---------------------------------------------------------------- incoming

interface TgMessage {
  chat?: { id: number };
  text?: string;
  from?: { language_code?: string };
}

export async function handleUpdate(update: { message?: TgMessage }) {
  const msg = update.message;
  const chat = msg?.chat?.id;
  const text = (msg?.text ?? "").trim();
  if (!chat || !text.startsWith("/")) return;
  const lang: Lang = langOf(msg?.from?.language_code);
  const t = T[lang];
  const [rawCmd, ...rest] = text.split(/\s+/);
  const cmd = rawCmd.split("@")[0].toLowerCase();
  const arg = rest.join(" ").trim();
  const db = adminDb();

  if (cmd === "/start" && arg) {
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(arg)) return send(chat, fill(t.bad_token, { site: SITE }));
    const { data } = await db.from("telegram_links").select("user_id, profiles(full_name)").eq("link_token", arg).maybeSingle();
    if (!data) return send(chat, fill(t.bad_token, { site: SITE }));
    await db
      .from("telegram_links")
      .update({ chat_id: chat, link_token: null, lang, enabled: true, linked_at: new Date().toISOString() })
      .eq("user_id", data.user_id);
    const prof = data.profiles as { full_name?: string } | { full_name?: string }[] | null;
    const name = (Array.isArray(prof) ? prof[0]?.full_name : prof?.full_name) || "CodePair";
    return send(chat, fill(t.linked, { name: esc(name) }));
  }
  if (cmd === "/start") return send(chat, fill(t.welcome, { site: SITE }));
  if (cmd === "/stop" || cmd === "/on") {
    const { data } = await db.from("telegram_links").select("user_id").eq("chat_id", chat);
    if (!data?.length) return send(chat, fill(t.not_linked, { site: SITE }));
    await db.from("telegram_links").update({ enabled: cmd === "/on" }).eq("chat_id", chat);
    return send(chat, cmd === "/on" ? t.started : t.stopped);
  }
  return send(chat, fill(t.help, { site: SITE }));
}

// ---------------------------------------------------------------- outgoing

export async function deliverPending(limit = 50): Promise<number> {
  const db = adminDb();
  const { data: rows, error } = await db
    .from("notifications")
    .select("id, kind, payload, telegram_links(chat_id, lang, enabled)")
    .is("sent_at", null)
    .is("error", null)
    .order("id", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);

  let sent = 0;
  for (const n of rows ?? []) {
    const raw = n.telegram_links as unknown;
    const link = (Array.isArray(raw) ? raw[0] : raw) as { chat_id: number | null; lang: string; enabled: boolean } | null;
    const now = new Date().toISOString();
    // claim the row first so parallel deliveries never send twice
    const { data: claimed } = await db
      .from("notifications")
      .update({ sent_at: now })
      .eq("id", n.id)
      .is("sent_at", null)
      .select("id");
    if (!claimed?.length) continue;
    if (!link?.chat_id || !link.enabled) {
      await db.from("notifications").update({ error: "skipped: not linked or muted" }).eq("id", n.id);
      continue;
    }
    try {
      await send(link.chat_id, render(n.kind, (n.payload as Record<string, unknown>) ?? {}, link.lang, SITE));
      sent++;
    } catch (e) {
      const err = e as TelegramError;
      if (err.status === 429) {
        await db.from("notifications").update({ sent_at: null }).eq("id", n.id); // retry later
        break;
      }
      if (err.status === 403) await db.from("telegram_links").update({ enabled: false }).eq("chat_id", link.chat_id);
      await db.from("notifications").update({ error: String(err.message).slice(0, 300) }).eq("id", n.id);
    }
  }
  return sent;
}

export async function setupBot(origin: string) {
  const secret = process.env.CODEPAIR_BOT_SECRET!;
  await tg("setWebhook", {
    url: `${origin}/api/telegram/webhook`,
    secret_token: secret,
    allowed_updates: ["message"],
  });
  for (const lang of ["ru", "en", "uz"] as Lang[]) {
    await tg("setMyCommands", {
      commands: COMMANDS[lang].map(([command, description]) => ({ command, description })),
      ...(lang === "en" ? {} : { language_code: lang }),
    });
  }
  return tg("getWebhookInfo", {});
}
