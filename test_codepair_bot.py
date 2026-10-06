"""Tests for codepair_bot.py with in-memory fakes of Supabase (PostgREST) and Telegram.
Run: python3 -m unittest tests/test_bot.py
"""
import json
import os
import sys
import unittest
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path[:0] = [HERE, os.path.join(HERE, "..")]  # works from tests/ and from the repo root
import codepair_bot as cb  # noqa: E402


class FakeWorld:
    """Fake HTTP layer: a tiny PostgREST for the tables the bot uses + a Telegram API."""

    def __init__(self):
        self.profiles = {"u1": {"full_name": "Dina <Designer>"}}
        self.links = {"u1": {"user_id": "u1", "chat_id": None, "link_token": "tok123", "lang": "ru", "enabled": True}}
        self.notifications = []
        self.state = {}
        self.sent = []  # (chat_id, text)
        self.updates = []
        self.blocked = set()

    def __call__(self, method, url, headers, body):
        u = urllib.parse.urlparse(url)
        q = dict(urllib.parse.parse_qsl(u.query))
        if "api.telegram.org" in u.netloc:
            name = u.path.rsplit("/", 1)[-1]
            if name == "sendMessage":
                if body["chat_id"] in self.blocked:
                    raise cb.ApiError(403, "bot was blocked by the user")
                self.sent.append((body["chat_id"], body["text"]))
                return {"ok": True, "result": {}}
            if name == "getUpdates":
                res = [x for x in self.updates if x["update_id"] >= body["offset"]]
                return {"ok": True, "result": res}
            return {"ok": True, "result": True}
        assert headers.get("apikey") == "sb_secret_test", "secret key must be sent"
        table = u.path.rsplit("/", 1)[-1]

        def match(row, q):
            for k, v in q.items():
                if k in ("select", "order", "limit"):
                    continue
                op, _, val = v.partition(".")
                cur = row.get(k)
                if op == "eq" and str(cur) != val:
                    return False
                if op == "is" and val == "null" and cur is not None:
                    return False
            return True

        if table == "bot_state":
            if method == "GET":
                return [{"value": self.state["telegram_offset"]}] if "telegram_offset" in self.state else []
            self.state[body["key"]] = body["value"]
            return None
        if table == "telegram_links":
            rows = [r for r in self.links.values() if match(r, q)]
            if method == "GET":
                return [{**r, "profiles": self.profiles.get(r["user_id"])} for r in rows]
            for r in rows:
                r.update(body)
            return None
        if table == "notifications":
            rows = [n for n in self.notifications if match(n, q)]
            if method == "GET":
                rows = sorted(rows, key=lambda n: n["id"])[: int(q.get("limit", 100))]
                return [{**n, "telegram_links": self.links.get(n["user_id"])} for n in rows]
            for n in rows:
                n.update(body)
            return None
        raise AssertionError(f"unexpected {method} {url}")

    def msg(self, chat, text, lang="ru"):
        self.updates.append({"update_id": len(self.updates) + 1,
                             "message": {"chat": {"id": chat}, "text": text, "from": {"language_code": lang}}})


def make_bot(world):
    logs = []
    bot = cb.Bot(cb.Supabase("https://x.supabase.co", "sb_secret_test", world),
                 cb.Telegram("123:abc", world), "https://site.test", log=logs.append)
    return bot, logs


class BotTests(unittest.TestCase):
    def test_linking_with_token(self):
        w = FakeWorld()
        bot, _ = make_bot(w)
        w.msg(555, "/start tok123", lang="uz")
        bot.poll_updates(wait=0)
        link = w.links["u1"]
        self.assertEqual(link["chat_id"], 555)
        self.assertIsNone(link["link_token"], "token is one-time")
        self.assertEqual(link["lang"], "uz")
        self.assertIn("Dina &lt;Designer&gt;", w.sent[-1][1], "name is HTML-escaped")
        self.assertEqual(w.state["telegram_offset"], "2")
        # second poll does not re-process the same update
        bot.poll_updates(wait=0)
        self.assertEqual(len(w.sent), 1)

    def test_bad_token_and_plain_start(self):
        w = FakeWorld()
        bot, _ = make_bot(w)
        w.msg(1, "/start wrong")
        w.msg(1, "/start")
        w.msg(1, "/start ../../etc")
        bot.poll_updates(wait=0)
        self.assertIn("устарела", w.sent[0][1])
        self.assertIn("site.test/profile", w.sent[1][1])
        self.assertIn("устарела", w.sent[2][1])
        self.assertIsNone(w.links["u1"]["chat_id"])

    def test_stop_and_on(self):
        w = FakeWorld()
        w.links["u1"]["chat_id"] = 7
        bot, _ = make_bot(w)
        w.msg(7, "/stop")
        bot.poll_updates(wait=0)
        self.assertFalse(w.links["u1"]["enabled"])
        w.msg(7, "/on")
        bot.poll_updates(wait=0)
        self.assertTrue(w.links["u1"]["enabled"])
        w.msg(8, "/stop")  # unknown chat
        bot.poll_updates(wait=0)
        self.assertIn("не подключён", w.sent[-1][1])

    def test_delivery_all_kinds(self):
        w = FakeWorld()
        w.links["u1"].update(chat_id=7, lang="ru")
        p = {"project_id": "p1", "project": "Exam <AI>"}
        kinds = [
            ("invite_received", {**p, "from": "Olim", "role": "uiux", "message": "Join us"}),
            ("request_received", {**p, "from": "Bob", "role": "backend", "message": ""}),
            ("invitation_answered", {**p, "by": "Dina", "kind": "invite", "status": "accepted", "role": "uiux"}),
            ("invitation_answered", {**p, "by": "Dina", "kind": "invite", "status": "declined", "role": "uiux"}),
            ("invitation_answered", {**p, "by": "Olim", "kind": "request", "status": "accepted", "role": "ml"}),
            ("invitation_answered", {**p, "by": "Olim", "kind": "request", "status": "declined", "role": "ml"}),
            ("new_project", {**p, "owner": "Olim", "needed_roles": ["uiux", "backend"], "your_roles": ["uiux"]}),
            ("project_done", {**p, "role": "owner"}),
        ]
        for i, (k, pl) in enumerate(kinds, 1):
            w.notifications.append({"id": i, "user_id": "u1", "kind": k, "payload": pl, "sent_at": None, "error": None})
        bot, _ = make_bot(w)
        self.assertEqual(bot.deliver(), len(kinds))
        texts = [t for _, t in w.sent]
        self.assertIn("приглашает вас", texts[0])
        self.assertIn("UI/UX-дизайнер", texts[0])
        self.assertIn("Join us", texts[0])
        self.assertIn("Exam &lt;AI&gt;", texts[0])
        self.assertIn("хочет присоединиться", texts[1])
        self.assertIn("принял(а)", texts[2])
        self.assertIn("отклонил(а)", texts[3])
        self.assertIn("Вас приняли", texts[4])
        self.assertIn("Заявка", texts[5])
        self.assertIn("ищет: UI/UX-дизайнер, Backend", texts[6])
        self.assertIn("завершён", texts[7])
        self.assertTrue(all(n["sent_at"] for n in w.notifications))
        self.assertEqual(bot.deliver(), 0, "nothing is sent twice")

    def test_blocked_user_is_muted(self):
        w = FakeWorld()
        w.links["u1"].update(chat_id=9)
        w.blocked.add(9)
        w.notifications.append({"id": 1, "user_id": "u1", "kind": "project_done",
                                "payload": {"project": "X", "project_id": "p", "role": "qa"}, "sent_at": None, "error": None})
        bot, _ = make_bot(w)
        bot.deliver()
        self.assertFalse(w.links["u1"]["enabled"])
        self.assertIn("403", w.notifications[0]["error"])

    def test_render_languages(self):
        pl = {"project": "P", "project_id": "1", "role": "data"}
        self.assertIn("tugallandi", cb.render("project_done", pl, "uz", "s"))
        self.assertIn("completed", cb.render("project_done", pl, "en", "s"))
        self.assertIn("Ma’lumotlar tahlilchisi", cb.render("project_done", pl, "uz", "s"))
        with self.assertRaises(ValueError):
            cb.render("unknown", pl, "ru", "s")

    def test_team_management_kinds(self):
        pl = {"project": "P", "project_id": "1", "by": "Ann", "role": "pentest"}
        self.assertIn("исключил", cb.render("member_removed", pl, "ru", "s"))
        self.assertIn("left your project", cb.render("member_left", pl, "en", "s"))
        self.assertIn("Пентестер / Red Team", cb.render("role_changed", pl, "ru", "s"))
        self.assertIn("muallif", cb.render("ownership_received", pl, "uz", "s"))

    def test_lang_detection(self):
        self.assertEqual(cb.lang_of("uz-UZ"), "uz")
        self.assertEqual(cb.lang_of("ru"), "ru")
        self.assertEqual(cb.lang_of("de"), "en")
        self.assertEqual(cb.lang_of(None), "ru")

    def test_legacy_jwt_key_sends_authorization(self):
        db = cb.Supabase("https://x", "eyJabc", lambda *a: None)
        self.assertEqual(db.headers["Authorization"], "Bearer eyJabc")
        db2 = cb.Supabase("https://x", "sb_secret_x", lambda *a: None)
        self.assertNotIn("Authorization", db2.headers)


if __name__ == "__main__":
    unittest.main()
