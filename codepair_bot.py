#!/usr/bin/env python3
"""
CodePair Telegram bot — notifications about invitations, join requests,
new matching projects and completed projects.

No dependencies (Python 3.10+ standard library only).
Runs for --duration seconds, then exits (designed for GitHub Actions cron,
but `--duration 0` runs forever on any server).

Environment:
  TELEGRAM_BOT_TOKEN   token from @BotFather
  SUPABASE_URL         https://<project>.supabase.co
  SUPABASE_SECRET_KEY  Supabase secret (service role) key — never put it in code
  SITE_URL             https://codepair-swart.vercel.app
"""

from __future__ import annotations

import argparse
import html
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Callable

# ---------------------------------------------------------------- texts

ROLES = {
    "ru": {
        "frontend": "Frontend",
        "backend": "Backend",
        "fullstack": "Full-stack",
        "mobile": "Mobile (кроссплатформа)",
        "ios": "iOS-разработчик",
        "android": "Android-разработчик",
        "gamedev": "GameDev",
        "embedded": "Embedded / IoT",
        "blockchain": "Blockchain / Web3",
        "arvr": "AR / VR",
        "architect": "Архитектор ПО",
        "teamlead": "Tech Lead",
        "ml": "ML-инженер",
        "ai_engineer": "AI / LLM-инженер",
        "data_scientist": "Data Scientist",
        "data_engineer": "Data Engineer",
        "data": "Аналитик данных",
        "bi": "BI-аналитик",
        "mlops": "MLOps",
        "pentest": "Пентестер / Red Team",
        "soc": "SOC-аналитик / Blue Team",
        "security_engineer": "Инженер по безопасности",
        "appsec": "AppSec / DevSecOps",
        "cloud_security": "Безопасность облаков",
        "forensics": "Форензика / DFIR",
        "malware": "Реверс и анализ ВПО",
        "cti": "Threat Intelligence",
        "grc": "GRC / Compliance",
        "iam": "IAM / управление доступом",
        "crypto": "Криптография",
        "ctf": "CTF-игрок",
        "devops": "DevOps",
        "sre": "SRE",
        "cloud": "Cloud-инженер",
        "sysadmin": "Системный администратор",
        "network": "Сетевой инженер",
        "dba": "Администратор БД",
        "support": "IT-поддержка / Helpdesk",
        "qa": "QA / ручное тестирование",
        "qa_automation": "QA Automation",
        "performance": "Нагрузочное тестирование",
        "uiux": "UI/UX-дизайнер",
        "graphic": "Графический / моушн-дизайнер",
        "product": "Product Manager",
        "project_manager": "Project Manager",
        "scrum": "Scrum Master / Agile",
        "business_analyst": "Бизнес-аналитик",
        "system_analyst": "Системный аналитик",
        "tech_writer": "Технический писатель",
        "devrel": "DevRel / комьюнити",
        "marketing": "Маркетинг / SMM",
        "it_recruiter": "IT-рекрутер",
        "mentor": "Ментор / преподаватель",
        "owner": "автор проекта"
    },
    "en": {
        "frontend": "Frontend",
        "backend": "Backend",
        "fullstack": "Full-stack",
        "mobile": "Mobile (cross-platform)",
        "ios": "iOS developer",
        "android": "Android developer",
        "gamedev": "GameDev",
        "embedded": "Embedded / IoT",
        "blockchain": "Blockchain / Web3",
        "arvr": "AR / VR",
        "architect": "Software architect",
        "teamlead": "Tech Lead",
        "ml": "ML engineer",
        "ai_engineer": "AI / LLM engineer",
        "data_scientist": "Data Scientist",
        "data_engineer": "Data Engineer",
        "data": "Data analyst",
        "bi": "BI analyst",
        "mlops": "MLOps",
        "pentest": "Pentester / Red Team",
        "soc": "SOC analyst / Blue Team",
        "security_engineer": "Security engineer",
        "appsec": "AppSec / DevSecOps",
        "cloud_security": "Cloud security",
        "forensics": "Forensics / DFIR",
        "malware": "Reverse engineering / Malware",
        "cti": "Threat Intelligence",
        "grc": "GRC / Compliance",
        "iam": "IAM / Access management",
        "crypto": "Cryptography",
        "ctf": "CTF player",
        "devops": "DevOps",
        "sre": "SRE",
        "cloud": "Cloud engineer",
        "sysadmin": "System administrator",
        "network": "Network engineer",
        "dba": "Database administrator",
        "support": "IT support / Helpdesk",
        "qa": "QA / manual testing",
        "qa_automation": "QA Automation",
        "performance": "Performance testing",
        "uiux": "UI/UX designer",
        "graphic": "Graphic / motion designer",
        "product": "Product manager",
        "project_manager": "Project manager",
        "scrum": "Scrum Master / Agile",
        "business_analyst": "Business analyst",
        "system_analyst": "System analyst",
        "tech_writer": "Technical writer",
        "devrel": "DevRel / community",
        "marketing": "Marketing / SMM",
        "it_recruiter": "IT recruiter",
        "mentor": "Mentor / teacher",
        "owner": "project author"
    },
    "uz": {
        "frontend": "Frontend",
        "backend": "Backend",
        "fullstack": "Full-stack",
        "mobile": "Mobile (kross-platforma)",
        "ios": "iOS dasturchi",
        "android": "Android dasturchi",
        "gamedev": "GameDev",
        "embedded": "Embedded / IoT",
        "blockchain": "Blockchain / Web3",
        "arvr": "AR / VR",
        "architect": "Dasturiy ta’minot arxitektori",
        "teamlead": "Tech Lead",
        "ml": "ML muhandisi",
        "ai_engineer": "AI / LLM muhandisi",
        "data_scientist": "Data Scientist",
        "data_engineer": "Data Engineer",
        "data": "Ma’lumotlar tahlilchisi",
        "bi": "BI tahlilchisi",
        "mlops": "MLOps",
        "pentest": "Pentester / Red Team",
        "soc": "SOC tahlilchisi / Blue Team",
        "security_engineer": "Xavfsizlik muhandisi",
        "appsec": "AppSec / DevSecOps",
        "cloud_security": "Bulut xavfsizligi",
        "forensics": "Forensika / DFIR",
        "malware": "Revers va zararli dasturlar tahlili",
        "cti": "Threat Intelligence",
        "grc": "GRC / Compliance",
        "iam": "IAM / kirishni boshqarish",
        "crypto": "Kriptografiya",
        "ctf": "CTF ishtirokchisi",
        "devops": "DevOps",
        "sre": "SRE",
        "cloud": "Bulut muhandisi",
        "sysadmin": "Tizim administratori",
        "network": "Tarmoq muhandisi",
        "dba": "Ma’lumotlar bazasi administratori",
        "support": "IT yordam / Helpdesk",
        "qa": "QA / qo‘lda testlash",
        "qa_automation": "QA Automation",
        "performance": "Yuklama testlash",
        "uiux": "UI/UX dizayner",
        "graphic": "Grafik / moushn dizayner",
        "product": "Product menejer",
        "project_manager": "Loyiha menejeri",
        "scrum": "Scrum Master / Agile",
        "business_analyst": "Biznes tahlilchi",
        "system_analyst": "Tizim tahlilchisi",
        "tech_writer": "Texnik yozuvchi",
        "devrel": "DevRel / hamjamiyat",
        "marketing": "Marketing / SMM",
        "it_recruiter": "IT rekruter",
        "mentor": "Mentor / o‘qituvchi",
        "owner": "loyiha muallifi"
    }
}

T = {
    "ru": {
        "welcome": "👋 Это бот <b>CodePair</b>.\n\nЧтобы получать уведомления, откройте свой профиль на сайте и нажмите «Подключить Telegram»:\n{site}/profile",
        "linked": "✅ Telegram подключён к профилю <b>{name}</b>.\n\nЯ буду присылать:\n• приглашения и заявки в команды\n• ответы на ваши приглашения\n• новые проекты, где нужна ваша роль\n• завершение ваших проектов\n\n/stop — выключить, /on — включить снова.",
        "bad_token": "⚠️ Ссылка устарела. Откройте профиль на сайте и нажмите «Подключить Telegram» ещё раз:\n{site}/profile",
        "stopped": "🔕 Уведомления выключены. /on — включить снова.",
        "started": "🔔 Уведомления включены.",
        "not_linked": "Этот чат ещё не подключён. Нажмите «Подключить Telegram» в профиле:\n{site}/profile",
        "help": "<b>CodePair</b> — уведомления о командах и проектах.\n/on — включить\n/stop — выключить\n/help — помощь\n\nСайт: {site}",
        "invite_received": "📩 <b>{from}</b> приглашает вас в проект «<b>{project}</b>»{role_part}.{message_part}\n\nОтветить: {site}/dashboard",
        "request_received": "🙋 <b>{from}</b> хочет присоединиться к вашему проекту «<b>{project}</b>»{role_part}.{message_part}\n\nОтветить: {site}/dashboard",
        "invite_accepted": "✅ <b>{by}</b> принял(а) приглашение в «<b>{project}</b>»{role_part}. Команда растёт!\n\n{site}/projects/{project_id}",
        "invite_declined": "❌ <b>{by}</b> отклонил(а) приглашение в «<b>{project}</b>». Попробуйте подобрать другого участника:\n{site}/people?project={project_id}",
        "request_accepted": "🎉 Вас приняли в команду «<b>{project}</b>»{role_part}!\n\n{site}/projects/{project_id}",
        "request_declined": "😔 Заявка в «<b>{project}</b>» отклонена. Посмотрите другие проекты:\n{site}/projects",
        "new_project": "🆕 Новый проект «<b>{project}</b>» от {owner} ищет: {needed}.\nВаша роль <b>{yours}</b> нужна этой команде!\n\n{site}/projects/{project_id}",
        "project_done": "🏁 Проект «<b>{project}</b>» завершён! Ваша роль ({role}) и вклад добавлены в профиль как подтверждённый опыт.\n\n{site}/projects/{project_id}",
        "as_role": " на роль <b>{role}</b>",
        "message": "\n\n💬 «{message}»",
    },
    "en": {
        "welcome": "👋 This is the <b>CodePair</b> bot.\n\nTo get notifications, open your profile on the website and press “Connect Telegram”:\n{site}/profile",
        "linked": "✅ Telegram is connected to <b>{name}</b>.\n\nI will send you:\n• team invitations and join requests\n• answers to your invitations\n• new projects that need your role\n• completion of your projects\n\n/stop — mute, /on — unmute.",
        "bad_token": "⚠️ This link has expired. Open your profile and press “Connect Telegram” again:\n{site}/profile",
        "stopped": "🔕 Notifications are off. /on — turn them back on.",
        "started": "🔔 Notifications are on.",
        "not_linked": "This chat is not connected yet. Press “Connect Telegram” in your profile:\n{site}/profile",
        "help": "<b>CodePair</b> — team and project notifications.\n/on — turn on\n/stop — turn off\n/help — help\n\nWebsite: {site}",
        "invite_received": "📩 <b>{from}</b> invites you to “<b>{project}</b>”{role_part}.{message_part}\n\nReply: {site}/dashboard",
        "request_received": "🙋 <b>{from}</b> wants to join your project “<b>{project}</b>”{role_part}.{message_part}\n\nReply: {site}/dashboard",
        "invite_accepted": "✅ <b>{by}</b> accepted your invitation to “<b>{project}</b>”{role_part}. The team is growing!\n\n{site}/projects/{project_id}",
        "invite_declined": "❌ <b>{by}</b> declined the invitation to “<b>{project}</b>”. Find another member:\n{site}/people?project={project_id}",
        "request_accepted": "🎉 You joined the team “<b>{project}</b>”{role_part}!\n\n{site}/projects/{project_id}",
        "request_declined": "😔 Your request to “<b>{project}</b>” was declined. See other projects:\n{site}/projects",
        "new_project": "🆕 New project “<b>{project}</b>” by {owner} is looking for: {needed}.\nYour role <b>{yours}</b> is needed!\n\n{site}/projects/{project_id}",
        "project_done": "🏁 Project “<b>{project}</b>” is completed! Your role ({role}) and contribution are now verified experience in your profile.\n\n{site}/projects/{project_id}",
        "as_role": " as <b>{role}</b>",
        "message": "\n\n💬 “{message}”",
    },
    "uz": {
        "welcome": "👋 Bu <b>CodePair</b> boti.\n\nBildirishnomalarni olish uchun saytdagi profilingizni oching va «Telegramni ulash» tugmasini bosing:\n{site}/profile",
        "linked": "✅ Telegram <b>{name}</b> profiliga ulandi.\n\nMen yuboraman:\n• jamoaga takliflar va arizalar\n• takliflaringizga javoblar\n• rolingiz kerak bo‘lgan yangi loyihalar\n• loyihalaringiz tugashi\n\n/stop — o‘chirish, /on — yoqish.",
        "bad_token": "⚠️ Havola eskirgan. Profilni ochib, «Telegramni ulash» tugmasini qayta bosing:\n{site}/profile",
        "stopped": "🔕 Bildirishnomalar o‘chirildi. /on — qayta yoqish.",
        "started": "🔔 Bildirishnomalar yoqildi.",
        "not_linked": "Bu chat hali ulanmagan. Profilda «Telegramni ulash» tugmasini bosing:\n{site}/profile",
        "help": "<b>CodePair</b> — jamoa va loyihalar haqida bildirishnomalar.\n/on — yoqish\n/stop — o‘chirish\n/help — yordam\n\nSayt: {site}",
        "invite_received": "📩 <b>{from}</b> sizni «<b>{project}</b>» loyihasiga taklif qilmoqda{role_part}.{message_part}\n\nJavob berish: {site}/dashboard",
        "request_received": "🙋 <b>{from}</b> «<b>{project}</b>» loyihangizga qo‘shilmoqchi{role_part}.{message_part}\n\nJavob berish: {site}/dashboard",
        "invite_accepted": "✅ <b>{by}</b> «<b>{project}</b>» taklifini qabul qildi{role_part}. Jamoa o‘smoqda!\n\n{site}/projects/{project_id}",
        "invite_declined": "❌ <b>{by}</b> «<b>{project}</b>» taklifini rad etdi. Boshqa ishtirokchini toping:\n{site}/people?project={project_id}",
        "request_accepted": "🎉 Siz «<b>{project}</b>» jamoasiga qabul qilindingiz{role_part}!\n\n{site}/projects/{project_id}",
        "request_declined": "😔 «<b>{project}</b>» loyihasiga arizangiz rad etildi. Boshqa loyihalar:\n{site}/projects",
        "new_project": "🆕 {owner}ning yangi «<b>{project}</b>» loyihasi izlamoqda: {needed}.\nSizning rolingiz <b>{yours}</b> kerak!\n\n{site}/projects/{project_id}",
        "project_done": "🏁 «<b>{project}</b>» loyihasi tugallandi! Rolingiz ({role}) va hissangiz profilingizga tasdiqlangan tajriba sifatida qo‘shildi.\n\n{site}/projects/{project_id}",
        "as_role": " (rol: <b>{role}</b>)",
        "message": "\n\n💬 «{message}»",
    },
}


def lang_of(code: str | None) -> str:
    code = (code or "").lower()
    if code.startswith("uz"):
        return "uz"
    if code.startswith("ru"):
        return "ru"
    return "en" if code else "ru"


def role_label(lang: str, role: str) -> str:
    return ROLES[lang].get(role, role)


def render(kind: str, payload: dict[str, Any], lang: str, site: str) -> str:
    """Turn a queued notification into a Telegram HTML message."""
    lang = lang if lang in T else "ru"
    t = T[lang]
    e = lambda v: html.escape(str(v or "—"))  # noqa: E731
    role = payload.get("role") or ""
    role_part = t["as_role"].format(role=e(role_label(lang, role))) if role and role != "owner" else ""
    msg = (payload.get("message") or "").strip()
    message_part = t["message"].format(message=e(msg[:300])) if msg else ""
    data = {
        "site": site,
        "project": e(payload.get("project")),
        "project_id": payload.get("project_id", ""),
        "from": e(payload.get("from")),
        "by": e(payload.get("by")),
        "owner": e(payload.get("owner")),
        "role": e(role_label(lang, role)),
        "role_part": role_part,
        "message_part": message_part,
        "needed": e(", ".join(role_label(lang, r) for r in payload.get("needed_roles") or [])),
        "yours": e(", ".join(role_label(lang, r) for r in payload.get("your_roles") or [])),
    }
    if kind == "invitation_answered":
        prefix = "invite" if payload.get("kind") == "invite" else "request"
        kind = f"{prefix}_{'accepted' if payload.get('status') == 'accepted' else 'declined'}"
    template = t.get(kind)
    if not template:
        raise ValueError(f"unknown notification kind: {kind}")
    return template.format(**data)


# ---------------------------------------------------------------- HTTP

Http = Callable[[str, str, dict[str, str], Any], Any]


def http_json(method: str, url: str, headers: dict[str, str], body: Any = None, timeout: int = 40) -> Any:
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method, headers={"Content-Type": "application/json", **headers})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        detail = err.read().decode(errors="replace")[:500]
        raise ApiError(err.code, detail) from None


class ApiError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(f"HTTP {status}: {detail}")
        self.status = status
        self.detail = detail


class Supabase:
    """Minimal PostgREST client using the secret (service role) key."""

    def __init__(self, url: str, key: str, http: Http = http_json):
        self.base = url.rstrip("/") + "/rest/v1"
        self.headers = {"apikey": key}
        if key.startswith("eyJ"):  # legacy JWT keys also need the Authorization header
            self.headers["Authorization"] = f"Bearer {key}"
        self.http = http

    def _url(self, table: str, query: dict[str, str] | None = None) -> str:
        return f"{self.base}/{table}" + ("?" + urllib.parse.urlencode(query) if query else "")

    def select(self, table: str, query: dict[str, str]) -> list[dict]:
        return self.http("GET", self._url(table, query), self.headers, None) or []

    def update(self, table: str, query: dict[str, str], values: dict) -> None:
        self.http("PATCH", self._url(table, query), {**self.headers, "Prefer": "return=minimal"}, values)

    def upsert(self, table: str, values: dict) -> None:
        self.http("POST", self._url(table), {**self.headers, "Prefer": "resolution=merge-duplicates,return=minimal"}, values)


class Telegram:
    def __init__(self, token: str, http: Http = http_json):
        self.base = f"https://api.telegram.org/bot{token}"
        self.http = http

    def call(self, method: str, **params: Any) -> Any:
        res = self.http("POST", f"{self.base}/{method}", {}, params)
        return res.get("result") if isinstance(res, dict) else res

    def send(self, chat_id: int, text: str) -> None:
        self.call("sendMessage", chat_id=chat_id, text=text, parse_mode="HTML", disable_web_page_preview=True)


# ---------------------------------------------------------------- bot logic

class Bot:
    def __init__(self, db: Supabase, tg: Telegram, site: str, log: Callable[[str], None] = print):
        self.db, self.tg, self.site, self.log = db, tg, site.rstrip("/"), log

    # --- incoming messages -------------------------------------------------

    def get_offset(self) -> int:
        rows = self.db.select("bot_state", {"key": "eq.telegram_offset", "select": "value"})
        return int(rows[0]["value"]) if rows else 0

    def set_offset(self, offset: int) -> None:
        self.db.upsert("bot_state", {"key": "telegram_offset", "value": str(offset)})

    def poll_updates(self, wait: int) -> int:
        offset = self.get_offset()
        updates = self.tg.call("getUpdates", offset=offset, timeout=wait, allowed_updates=["message"]) or []
        for upd in updates:
            try:
                self.handle_message(upd.get("message") or {})
            except Exception as exc:  # one bad message must not stop the bot
                self.log(f"update {upd.get('update_id')} failed: {exc}")
            offset = max(offset, upd["update_id"] + 1)
        if updates:
            self.set_offset(offset)
        return len(updates)

    def handle_message(self, msg: dict) -> None:
        chat = (msg.get("chat") or {}).get("id")
        text = (msg.get("text") or "").strip()
        if not chat or not text.startswith("/"):
            return
        lang = lang_of((msg.get("from") or {}).get("language_code"))
        cmd, _, arg = text.partition(" ")
        cmd = cmd.split("@")[0].lower()
        t = T[lang]

        if cmd == "/start" and arg.strip():
            token = arg.strip()
            if not token.replace("-", "").replace("_", "").isalnum() or len(token) > 64:
                self.tg.send(chat, t["bad_token"].format(site=self.site))
                return
            rows = self.db.select("telegram_links", {"link_token": f"eq.{token}", "select": "user_id,profiles(full_name)"})
            if not rows:
                self.tg.send(chat, t["bad_token"].format(site=self.site))
                return
            row = rows[0]
            self.db.update(
                "telegram_links",
                {"user_id": f"eq.{row['user_id']}"},
                {"chat_id": chat, "link_token": None, "lang": lang, "enabled": True,
                 "linked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
            )
            name = ((row.get("profiles") or {}).get("full_name")) or "CodePair"
            self.tg.send(chat, t["linked"].format(name=html.escape(name)))
            self.log(f"linked chat {chat}")
        elif cmd == "/start":
            self.tg.send(chat, t["welcome"].format(site=self.site))
        elif cmd in ("/stop", "/on"):
            linked = self.db.select("telegram_links", {"chat_id": f"eq.{chat}", "select": "user_id"})
            if not linked:
                self.tg.send(chat, t["not_linked"].format(site=self.site))
                return
            self.db.update("telegram_links", {"chat_id": f"eq.{chat}"}, {"enabled": cmd == "/on"})
            self.tg.send(chat, t["started" if cmd == "/on" else "stopped"])
        else:
            self.tg.send(chat, t["help"].format(site=self.site))

    # --- outgoing notifications --------------------------------------------

    def deliver(self, batch: int = 50) -> int:
        rows = self.db.select(
            "notifications",
            {"sent_at": "is.null", "error": "is.null", "order": "id.asc", "limit": str(batch),
             "select": "id,kind,payload,telegram_links(chat_id,lang,enabled)"},
        )
        sent = 0
        for n in rows:
            link = n.get("telegram_links") or {}
            now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            if not link.get("chat_id") or not link.get("enabled"):
                self.db.update("notifications", {"id": f"eq.{n['id']}"}, {"sent_at": now, "error": "skipped: not linked or muted"})
                continue
            try:
                text = render(n["kind"], n.get("payload") or {}, link.get("lang") or "ru", self.site)
                self.tg.send(link["chat_id"], text)
                self.db.update("notifications", {"id": f"eq.{n['id']}"}, {"sent_at": now})
                sent += 1
            except ApiError as exc:
                if exc.status == 429:  # rate limited: try again next round
                    self.log("telegram rate limit, pausing")
                    time.sleep(3)
                    break
                if exc.status == 403:  # user blocked the bot → stop sending to this chat
                    self.db.update("telegram_links", {"chat_id": f"eq.{link['chat_id']}"}, {"enabled": False})
                self.db.update("notifications", {"id": f"eq.{n['id']}"}, {"sent_at": now, "error": str(exc)[:300]})
            except Exception as exc:
                self.db.update("notifications", {"id": f"eq.{n['id']}"}, {"sent_at": now, "error": str(exc)[:300]})
            time.sleep(0.05)  # stay far below Telegram limits
        return sent

    def setup(self) -> None:
        for lang in ("ru", "en", "uz"):
            cmds = {
                "ru": [("start", "Подключение"), ("on", "Включить уведомления"), ("stop", "Выключить уведомления"), ("help", "Помощь")],
                "en": [("start", "Connect"), ("on", "Turn notifications on"), ("stop", "Turn notifications off"), ("help", "Help")],
                "uz": [("start", "Ulash"), ("on", "Bildirishnomalarni yoqish"), ("stop", "Bildirishnomalarni o‘chirish"), ("help", "Yordam")],
            }[lang]
            params: dict[str, Any] = {"commands": [{"command": c, "description": d} for c, d in cmds]}
            if lang != "en":
                params["language_code"] = lang
            self.tg.call("setMyCommands", **params)

    def run(self, duration: int) -> None:
        start = time.monotonic()
        self.setup()
        total = 0
        while True:
            left = duration - (time.monotonic() - start) if duration else 60
            if duration and left < 5:
                break
            total += self.deliver()
            self.poll_updates(wait=int(min(20, max(1, left - 4))))
            total += self.deliver()
        self.log(f"done, sent {total} notifications")


def main() -> int:
    ap = argparse.ArgumentParser(description="CodePair Telegram notifications bot")
    ap.add_argument("--duration", type=int, default=290, help="seconds to run (0 = forever)")
    args = ap.parse_args()
    missing = [k for k in ("TELEGRAM_BOT_TOKEN", "SUPABASE_URL", "SUPABASE_SECRET_KEY") if not os.environ.get(k)]
    if missing:
        print("Missing environment variables: " + ", ".join(missing), file=sys.stderr)
        return 1
    bot = Bot(
        Supabase(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SECRET_KEY"]),
        Telegram(os.environ["TELEGRAM_BOT_TOKEN"]),
        os.environ.get("SITE_URL", "https://codepair-swart.vercel.app"),
    )
    bot.run(args.duration)
    return 0


if __name__ == "__main__":
    sys.exit(main())
