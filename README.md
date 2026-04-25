# FIKRA — Virtual Intellektual Meta-Olam 🧠

**FIKRA** — Telegram Mini App va PWA ko'rinishida ishlaydigan "Virtual Intellektual Meta-Olam". Miya o'yinlari, DTM testlar, AI yordamchi, kreativ o'yinlar, gamification va ichki token iqtisodiyotini birlashtiradi.

---

## 🚀 Tezkor Boshlash

```bash
# 1. Bog'liqliklarni o'rnating
npm install

# 2. .env faylini sozlang
cp .env.example .env
# .env ichidagi o'zgaruvchilarni to'ldiring

# 3. Ishga tushiring
npm run dev   # development
npm start     # production
```

> To'liq deployment yo'riqnomasi: [`DEPLOY.md`](DEPLOY.md)  
> PWA o'rnatish: [`PWA.md`](PWA.md)

---

## 📋 Loyiha Bajarilish Rejasi

Jamoa uchun bosqichma-bosqich bajarilish cheklisti, prioritizatsiya va sprint breakdown:

**👉 [`docs/FIKRA_EXECUTION_PLAN.md`](docs/FIKRA_EXECUTION_PLAN.md)**

### Joriy Prioritet (Phase 1)

| Blok | Nima | Holat |
|---|---|---|
| **A** | Autentifikatsiya & Xavfsizlik | 🔴 Birinchi |
| **B** | Foydalanuvchi Profili (core) | 🔴 Birinchi |
| **C** | Token Iqtisodiyoti (essentials) | 🔴 Birinchi |
| **D1** | Miya O'yinlari — 6 ta (Stroop + 5 scaffold) | 🔴 Birinchi |

---

## 🗂️ Loyiha Tuzilmasi

```
FIKRA/
├── src/                   # Backend (Express + Node.js)
│   ├── routes/            # Auth, tokens, games, AI, subscription
│   ├── models/            # Mongoose sxemalar
│   ├── services/          # Biznes logika
│   └── middleware/        # Auth, rate limit, error handler
├── public/                # Frontend (Vanilla JS + PWA)
│   ├── js/games/          # Stroop, DTM test
│   ├── js/ai/             # AI chat, hujjat, rasm, kaloriya
│   └── css/theme.css      # Asosiy stil
├── docs/
│   └── FIKRA_EXECUTION_PLAN.md  # 📋 Bajarilish rejasi
├── DEPLOY.md              # Railway deployment
└── PWA.md                 # PWA yo'riqnoma
```

---

## 🔧 Texnologiyalar

| Qatlam | Stack |
|---|---|
| Backend | Node.js, Express, MongoDB (Mongoose), JWT |
| Frontend | Vanilla JS, PWA, Telegram WebApp API |
| AI | DeepSeek (chat), Gemini (rasm), OpenAI |
| Deploy | Railway, nixpacks |
| Bot | Telegraf (Telegram Bot API) |
