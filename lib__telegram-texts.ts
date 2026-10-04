// Telegram bot texts and rendering (RU / EN / UZ). Pure module — no imports, easy to test.
// Kept in sync with codepair_bot.py.

export type Lang = "ru" | "en" | "uz";

export const ROLES: Record<Lang, Record<string, string>> = {
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
};

export const T: Record<Lang, Record<string, string>> = {
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
    "message": "\n\n💬 «{message}»"
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
    "message": "\n\n💬 “{message}”"
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
    "message": "\n\n💬 «{message}»"
  }
};

export function langOf(code?: string | null): Lang {
  const c = (code ?? "").toLowerCase();
  if (c.startsWith("uz")) return "uz";
  if (c.startsWith("ru")) return "ru";
  return c ? "en" : "ru";
}

export const esc = (v: unknown) =>
  String(v === undefined || v === null || v === "" ? "—" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function fill(template: string, data: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in data ? data[k] : m));
}

const roleLabel = (lang: Lang, r: string) => ROLES[lang][r] ?? r;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function render(kind: string, payload: Record<string, any>, lang: string, site: string): string {
  const l: Lang = lang === "en" || lang === "uz" ? lang : "ru";
  const t = T[l];
  const role: string = payload.role || "";
  const msg = String(payload.message || "").trim();
  const data: Record<string, string> = {
    site,
    project: esc(payload.project),
    project_id: String(payload.project_id ?? ""),
    from: esc(payload.from),
    by: esc(payload.by),
    owner: esc(payload.owner),
    role: esc(roleLabel(l, role)),
    role_part: role && role !== "owner" ? fill(t.as_role, { role: esc(roleLabel(l, role)) }) : "",
    message_part: msg ? fill(t.message, { message: esc(msg.slice(0, 300)) }) : "",
    needed: esc(((payload.needed_roles as string[]) || []).map((r) => roleLabel(l, r)).join(", ")),
    yours: esc(((payload.your_roles as string[]) || []).map((r) => roleLabel(l, r)).join(", ")),
  };
  let k = kind;
  if (kind === "invitation_answered") {
    const prefix = payload.kind === "invite" ? "invite" : "request";
    k = `${prefix}_${payload.status === "accepted" ? "accepted" : "declined"}`;
  }
  const template = t[k];
  if (!template) throw new Error(`unknown notification kind: ${kind}`);
  return fill(template, data);
}

export const COMMANDS: Record<Lang, [string, string][]> = {
  ru: [["start", "Подключение"], ["on", "Включить уведомления"], ["stop", "Выключить уведомления"], ["help", "Помощь"]],
  en: [["start", "Connect"], ["on", "Turn notifications on"], ["stop", "Turn notifications off"], ["help", "Help"]],
  uz: [["start", "Ulash"], ["on", "Bildirishnomalarni yoqish"], ["stop", "Bildirishnomalarni o‘chirish"], ["help", "Yordam"]],
};
