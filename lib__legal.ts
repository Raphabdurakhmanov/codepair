// Privacy policy and terms of use (RU / EN / UZ). Plain-language MVP texts.
import type { Locale } from "@/lib/i18n";

export const CONTACT_EMAIL = "raphabdurakhmanov@gmail.com";
export const UPDATED = "2026-10-02";

type Section = [title: string, body: string[]];
interface LegalDoc {
  title: string;
  updated: string;
  intro: string;
  sections: Section[];
}

const privacy: Record<Locale, LegalDoc> = {
  ru: {
    title: "Политика конфиденциальности",
    updated: "Обновлено",
    intro:
      "CodePair — студенческий проект, который помогает собирать команды для учебных и pet-проектов. Здесь простыми словами описано, какие данные мы собираем и как ими пользуемся.",
    sections: [
      ["Какие данные мы получаем", [
        "При входе через GitHub или Google: имя, email и фото профиля.",
        "Данные, которые вы указываете сами: университет, роли, навыки, интересы, уровень, свободное время, цели, Telegram, GitHub-логин, описание проектов и сообщения в заявках.",
        "Публичные данные GitHub по вашему логину: количество публичных репозиториев и используемые языки программирования.",
      ]],
      ["Зачем они нужны", [
        "Чтобы показывать ваш профиль другим участникам и подбирать команды и проекты по навыкам и интересам.",
        "Чтобы работали приглашения, заявки и страницы команд.",
        "Мы не продаём данные и не используем их для рекламы.",
      ]],
      ["Кто видит ваши данные", [
        "Ваш профиль и проекты видят другие зарегистрированные пользователи CodePair.",
        "Email не показывается другим пользователям.",
      ]],
      ["Где хранятся данные и кто их обрабатывает", [
        "База данных и авторизация — Supabase (сервера в ЕС). Хостинг сайта — Vercel.",
        "Если вы пользуетесь AI Team Builder, текст описания идеи отправляется в Google Gemini для разбора на роли и технологии.",
      ]],
      ["Cookies", [
        "Мы используем только необходимые cookies: для входа в аккаунт и для запоминания языка и темы оформления.",
      ]],
      ["Ваши права", [
        `Вы можете изменить свои данные в профиле в любой момент. Чтобы удалить аккаунт и все данные, напишите на ${CONTACT_EMAIL} — мы удалим их в течение 14 дней.`,
      ]],
      ["Контакты", [`Вопросы о данных: ${CONTACT_EMAIL}`]],
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated",
    intro:
      "CodePair is a student project that helps people form teams for study and side projects. This page explains in plain words what data we collect and how we use it.",
    sections: [
      ["Data we collect", [
        "When you sign in with GitHub or Google: your name, email and profile photo.",
        "Information you provide: university, roles, skills, interests, level, available time, goals, Telegram, GitHub username, project descriptions and messages in join requests.",
        "Public GitHub data for your username: number of public repositories and the programming languages used.",
      ]],
      ["Why we use it", [
        "To show your profile to other members and match teams and projects by skills and interests.",
        "To run invitations, join requests and team pages.",
        "We do not sell your data or use it for advertising.",
      ]],
      ["Who can see your data", [
        "Your profile and projects are visible to other signed-in CodePair users.",
        "Your email is not shown to other users.",
      ]],
      ["Where data is stored and who processes it", [
        "Database and authentication: Supabase (servers in the EU). Website hosting: Vercel.",
        "If you use the AI Team Builder, the text of your idea is sent to Google Gemini to suggest roles and technologies.",
      ]],
      ["Cookies", [
        "We only use essential cookies: to keep you signed in and to remember your language and theme.",
      ]],
      ["Your rights", [
        `You can edit your data in your profile at any time. To delete your account and all data, email ${CONTACT_EMAIL} — we will delete it within 14 days.`,
      ]],
      ["Contact", [`Data questions: ${CONTACT_EMAIL}`]],
    ],
  },
  uz: {
    title: "Maxfiylik siyosati",
    updated: "Yangilangan",
    intro:
      "CodePair — talabalarga o‘quv va shaxsiy loyihalar uchun jamoa tuzishda yordam beradigan talabalar loyihasi. Bu sahifada qanday ma’lumotlarni yig‘ishimiz va ulardan qanday foydalanishimiz oddiy so‘zlar bilan tushuntirilgan.",
    sections: [
      ["Qanday ma’lumotlarni olamiz", [
        "GitHub yoki Google orqali kirganda: ismingiz, email va profil rasmingiz.",
        "O‘zingiz kiritgan ma’lumotlar: universitet, rollar, ko‘nikmalar, qiziqishlar, daraja, bo‘sh vaqt, maqsadlar, Telegram, GitHub login, loyiha tavsiflari va arizalardagi xabarlar.",
        "GitHub loginingiz bo‘yicha ochiq ma’lumotlar: ochiq repozitoriylar soni va ishlatilgan dasturlash tillari.",
      ]],
      ["Nima uchun kerak", [
        "Profilingizni boshqa ishtirokchilarga ko‘rsatish va ko‘nikma hamda qiziqishlar bo‘yicha jamoa va loyihalarni moslashtirish uchun.",
        "Takliflar, arizalar va jamoa sahifalari ishlashi uchun.",
        "Biz ma’lumotlarni sotmaymiz va reklama uchun ishlatmaymiz.",
      ]],
      ["Ma’lumotlaringizni kim ko‘radi", [
        "Profilingiz va loyihalaringizni CodePair’ning boshqa ro‘yxatdan o‘tgan foydalanuvchilari ko‘radi.",
        "Email boshqa foydalanuvchilarga ko‘rsatilmaydi.",
      ]],
      ["Ma’lumotlar qayerda saqlanadi va kim ishlov beradi", [
        "Ma’lumotlar bazasi va avtorizatsiya — Supabase (serverlar Yevropa Ittifoqida). Sayt hostingi — Vercel.",
        "AI Team Builder’dan foydalansangiz, g‘oya matni rollar va texnologiyalarni aniqlash uchun Google Gemini’ga yuboriladi.",
      ]],
      ["Cookie fayllar", [
        "Faqat zarur cookie’lardan foydalanamiz: hisobga kirish holatini va til hamda mavzuni eslab qolish uchun.",
      ]],
      ["Huquqlaringiz", [
        `Ma’lumotlaringizni profilda istalgan vaqtda o‘zgartirishingiz mumkin. Hisob va barcha ma’lumotlarni o‘chirish uchun ${CONTACT_EMAIL} manziliga yozing — 14 kun ichida o‘chiramiz.`,
      ]],
      ["Aloqa", [`Ma’lumotlar bo‘yicha savollar: ${CONTACT_EMAIL}`]],
    ],
  },
};

const terms: Record<Locale, LegalDoc> = {
  ru: {
    title: "Условия использования",
    updated: "Обновлено",
    intro: "Пользуясь CodePair, вы соглашаетесь с этими простыми правилами.",
    sections: [
      ["Что такое CodePair", [
        "Бесплатная платформа в стадии тестирования (MVP) для поиска команды и проектов. Функции могут меняться, возможны ошибки и перерывы в работе.",
      ]],
      ["Ваш аккаунт", [
        "Указывайте о себе правдивую информацию. Вы отвечаете за то, что публикуете в профиле, проектах и сообщениях.",
      ]],
      ["Чего делать нельзя", [
        "Публиковать оскорбления, спам, рекламу, чужие персональные данные или незаконный контент.",
        "Выдавать себя за другого человека или пытаться получить доступ к чужим аккаунтам.",
        "Мы можем удалить такой контент и заблокировать аккаунт.",
      ]],
      ["Проекты и результаты", [
        "Права на проекты принадлежат их участникам. CodePair не претендует на ваш код, идеи и результаты. Как делить работу и права внутри команды, договариваются сами участники.",
      ]],
      ["Ответственность", [
        "Сервис предоставляется «как есть». Мы не гарантируем, что найденная команда доведёт проект до конца, и не отвечаем за договорённости между участниками.",
      ]],
      ["Изменения", [`Мы можем обновлять эти условия. Вопросы: ${CONTACT_EMAIL}`]],
    ],
  },
  en: {
    title: "Terms of Use",
    updated: "Last updated",
    intro: "By using CodePair you agree to these simple rules.",
    sections: [
      ["What CodePair is", [
        "A free platform in testing (MVP) for finding teams and projects. Features may change; bugs and downtime are possible.",
      ]],
      ["Your account", [
        "Provide truthful information about yourself. You are responsible for what you post in your profile, projects and messages.",
      ]],
      ["What is not allowed", [
        "Posting abuse, spam, advertising, other people's personal data or illegal content.",
        "Impersonating others or trying to access other people's accounts.",
        "We may remove such content and suspend the account.",
      ]],
      ["Projects and results", [
        "Projects belong to their members. CodePair makes no claim to your code, ideas or results. Team members agree among themselves how to share work and rights.",
      ]],
      ["Liability", [
        "The service is provided “as is”. We do not guarantee that a team will finish a project and are not responsible for agreements between members.",
      ]],
      ["Changes", [`We may update these terms. Questions: ${CONTACT_EMAIL}`]],
    ],
  },
  uz: {
    title: "Foydalanish shartlari",
    updated: "Yangilangan",
    intro: "CodePair’dan foydalanib, siz ushbu oddiy qoidalarga rozilik bildirasiz.",
    sections: [
      ["CodePair nima", [
        "Jamoa va loyihalar topish uchun sinov bosqichidagi (MVP) bepul platforma. Funksiyalar o‘zgarishi, xatolar va uzilishlar bo‘lishi mumkin.",
      ]],
      ["Hisobingiz", [
        "O‘zingiz haqingizda to‘g‘ri ma’lumot kiriting. Profil, loyihalar va xabarlarda e’lon qilgan narsalaringiz uchun o‘zingiz javobgarsiz.",
      ]],
      ["Nima qilish mumkin emas", [
        "Haqorat, spam, reklama, boshqalarning shaxsiy ma’lumotlari yoki noqonuniy kontentni joylash.",
        "Boshqa odam nomidan harakat qilish yoki boshqalarning hisoblariga kirishga urinish.",
        "Bunday kontentni o‘chirib, hisobni bloklashimiz mumkin.",
      ]],
      ["Loyihalar va natijalar", [
        "Loyihalar ularning ishtirokchilariga tegishli. CodePair kodingiz, g‘oyalaringiz va natijalaringizga da’vo qilmaydi. Ish va huquqlarni taqsimlashni ishtirokchilar o‘zaro kelishadi.",
      ]],
      ["Javobgarlik", [
        "Xizmat «boricha» taqdim etiladi. Topilgan jamoa loyihani oxiriga yetkazishini kafolatlamaymiz va ishtirokchilar o‘rtasidagi kelishuvlar uchun javob bermaymiz.",
      ]],
      ["O‘zgarishlar", [`Bu shartlarni yangilashimiz mumkin. Savollar: ${CONTACT_EMAIL}`]],
    ],
  },
};

export const getPrivacy = (l: Locale) => privacy[l];
export const getTerms = (l: Locale) => terms[l];
export type { LegalDoc };
