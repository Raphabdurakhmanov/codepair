# CodePair — MVP

> **Плоская версия.** Все файлы лежат в одной папке, без подпапок, поэтому их можно загрузить на GitHub одним выбором файлов. Имя `app__projects__page.tsx` означает `app/projects/page.tsx`. Перед `npm run dev`, `npm run build` и `npm test` скрипт `restore.mjs` сам разложит файлы по папкам (на Vercel тоже). SQL для Supabase лежит в файлах `supabase__schema.sql` и `supabase__seed_demo.sql`.

Платформа, которая собирает студенческие команды по принципу **«дополнять, а не повторять»**.

Сценарий MVP: Регистрация → Профиль → Навыки → Проект → Поиск → Подбор → Приглашение → Страница команды → Подтверждённый опыт.

Стек: **Next.js 15 + Supabase (PostgreSQL, Auth) + Vercel + Gemini API**, всё на бесплатных тарифах. Интерфейс на трёх языках: русском, английском и узбекском.

---

## Что внутри

| Функция | Где в коде |
|---|---|
| Вход через GitHub и Google | `app/login`, `app/auth/*`, `middleware.ts` |
| Профиль: роли, навыки, интересы, уровень, время | `app/profile`, публичный профиль `app/u/[id]` |
| Проекты: создание, редактирование, статус | `app/projects/*` |
| **AI Team Builder**: идея обычным языком → роли и технологии | `lib/ai.ts`, `app/api/ai/team-builder` |
| **Подбор участников** (complementary > similar) | `lib/matching.ts`, `app/people` |
| Недостающие роли команды (skill gap) | `lib/matching.ts → skillGap` |
| Рекомендации проектов под профиль | `app/dashboard`, `app/projects` |
| Приглашения и заявки: принять или отклонить | `app/dashboard`, SQL-функция `respond_invitation` |
| Данные из GitHub (языки, репозитории) | `lib/github.ts` |
| Подтверждённый опыт (роль, вклад, технологии, ссылки) | `app/u/[id]` |
| Переключение языка RU / EN / UZ | `lib/i18n/*`, `components/LangSwitcher.tsx` |
| База данных и права доступа (RLS) | `supabase/schema.sql` |

Чат команды специально не писали: это ссылка на Telegram-группу. Задачи ведутся в GitHub Projects.

### Формула подбора (0–100)

| Фактор | Баллы |
|---|---|
| Закрывает недостающую роль в команде | 40 |
| Совпадение технологий (включая языки из GitHub) | 25 |
| Интерес к предметной области | 15 |
| Уровень практического опыта | 10 |
| Доступное время (10+ ч/нед = максимум) | 10 |
| Бонус за завершённые проекты | до +5 |

Веса лежат в `lib/matching.ts → WEIGHTS`. Пользователь всегда видит, почему ему предложили человека или проект.

---

## Запуск: пошагово (≈30–40 минут)

Что нужно: [Node.js 20+](https://nodejs.org), аккаунты GitHub, [Supabase](https://supabase.com) и [Vercel](https://vercel.com).

### 1. Supabase: база данных

1. Supabase → **New project**. Регион: ближайший (например, Frankfurt). Сохраните пароль от базы.
2. **SQL Editor → New query** → вставьте содержимое `supabase/schema.sql` → **Run**.
3. (Необязательно) Выполните так же `supabase/seed_demo.sql`: появятся 8 демо-студентов и демо-проект, и подбор можно проверить в одиночку. В конце файла есть команда для удаления демо-данных.
4. **Project Settings → API**: скопируйте `Project URL` и ключ `anon public`.

### 2. Вход через GitHub

1. GitHub → Settings → Developer settings → **OAuth Apps → New OAuth App**.
   - Homepage URL: `http://localhost:3000` (потом можно заменить адресом сайта).
   - Authorization callback URL: `https://<ВАШ-ПРОЕКТ>.supabase.co/auth/v1/callback`
2. Скопируйте **Client ID**, создайте и скопируйте **Client Secret**.
3. Supabase → **Authentication → Sign In / Providers → GitHub** → включить и вставить оба значения.

### 3. Вход через Google

1. [Google Cloud Console](https://console.cloud.google.com) → создайте проект → **APIs & Services → OAuth consent screen**. Тип External, заполните название и email.
2. **Credentials → Create credentials → OAuth client ID** → Web application.
   - Authorized redirect URI: `https://<ВАШ-ПРОЕКТ>.supabase.co/auth/v1/callback`
3. Supabase → **Authentication → Providers → Google** → вставить Client ID и Secret.

### 4. Адреса перенаправления

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (после деплоя — адрес на Vercel).
- **Redirect URLs**: добавьте `http://localhost:3000/**` и `https://<ваш-сайт>.vercel.app/**`.

### 5. Запуск на своём компьютере

```bash
npm install
cp .env.example .env.local     # и впишите URL и anon key из шага 1
npm run dev                    # откройте http://localhost:3000
```

Проверки:

```bash
npm test          # тесты формулы подбора
npm run build     # полная сборка, как на Vercel
```

### 6. AI Team Builder (необязательно)

1. [Google AI Studio](https://aistudio.google.com) → **Get API key** (бесплатный тариф).
2. Впишите его в `.env.local` как `GEMINI_API_KEY=...`.

Без ключа кнопка всё равно работает, но разбирает идею по ключевым словам. Если модель по умолчанию недоступна, укажите другую в `GEMINI_MODEL`.

### 7. Публикация на Vercel

1. Загрузите код в новый репозиторий GitHub. Проще всего: GitHub → **New repository** → **uploading an existing file** → перетащите содержимое папки (без `node_modules`).
2. Vercel → **Add New → Project** → выберите репозиторий.
3. **Environment Variables**: добавьте всё из `.env.example`, в `NEXT_PUBLIC_SITE_URL` укажите адрес сайта на Vercel.
4. **Deploy**. Затем добавьте адрес сайта в Supabase (шаг 4) и в Homepage URL у GitHub OAuth App.

> Тариф Vercel Hobby разрешён только для некоммерческого использования: для пилота подходит. Бесплатный проект Supabase ставится на паузу после недели без активности, и его можно разбудить из панели. Лимиты бесплатных тарифов меняются, проверяйте их на сайтах сервисов.

---

## Структура

```
app/
  page.tsx                 лендинг
  login/                   вход (GitHub, Google)
  auth/callback, signout   OAuth
  dashboard/               входящие приглашения, мои проекты, рекомендации
  profile/                 редактирование профиля + GitHub
  u/[id]/                  публичный профиль + подтверждённый опыт
  projects/                список, создание (с AI), страница команды, редактирование
  people/                  поиск и подбор кандидатов под проект
  api/ai/team-builder/     AI-разбор идеи
  actions.ts               все серверные действия (сохранение, приглашения и т. д.)
lib/
  matching.ts              формула подбора (чистые функции, покрыты тестами)
  catalog.ts               списки ролей, навыков и областей
  ai.ts, github.ts         интеграции
  i18n/                    ru.ts, en.ts, uz.ts
supabase/
  schema.sql               таблицы, триггеры, функции, RLS
  seed_demo.sql            демо-данные
tests/matching.test.ts
```

### Как добавить навык, роль или перевод

- Навык: добавьте строку в `SKILLS` в `lib/catalog.ts`.
- Роль или область: добавьте id в `ROLES`/`INTERESTS` и перевод в `lib/i18n/ru.ts`, `en.ts`, `uz.ts` (TypeScript подскажет, если где-то забыли).

---

## Что дальше (после проверки спроса)

1. Уведомления о приглашениях через Telegram-бота.
2. Вход через университетскую почту и отметка «студент подтверждён».
3. Отзывы участников после завершения проекта.
4. Campus Dashboard для клуба или хакатона: регистрация, статистика, массовый подбор.
5. Метрики пилота: регистрации, созданные проекты, собранные команды, завершённые проекты.
