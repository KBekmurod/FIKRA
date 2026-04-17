# FIKRA — Telegram Mini App

Miya faolligi va bilim platformasi. O'yinlar, AI xizmatlar, DTM test.

## Texnologiyalar

| Qatlam | Texnologiya | Sababi |
|---|---|---|
| Frontend | Vanilla JS + HTML/CSS | Telegram WebApp bilan sodda |
| Backend | Node.js + Express.js | JS bir til, Telegraf.js |
| Database | MongoDB Atlas | Flexible schema, free tier |
| Bot | Telegraf.js | Node.js uchun eng yaxshi |
| Chat AI | DeepSeek V3.2 | GPT-4o dan 27x arzon |
| Image AI | Gemini 2.5 Flash | Rasm + kaloriya biri |
| Video | Kling via fal.ai | $0.35/video |
| Ads | Adsgram + Monetag | TMA uchun maxsus |
| To'lov | Telegram Stars | Qo'shimcha provider kerak emas |
| Hosting | Railway.app | Auto-deploy, $5-20/oy |

---

## O'rnatish

### 1. Kerakli dasturlar

```bash
node --version    # v18+ bo'lishi kerak
npm --version
git --version
```

Agar yo'q bo'lsa:
- Node.js: https://nodejs.org (LTS versiya)
- Git: https://git-scm.com

### 2. Akkauntlar

| Xizmat | Link | Nima uchun |
|---|---|---|
| MongoDB Atlas | https://mongodb.com/atlas | Bepul 512MB |
| Railway.app | https://railway.app | Server hosting |
| GitHub | https://github.com | Kod + CI/CD |
| Telegram @BotFather | Telegram ichida | Bot token |

### 3. Telegram Bot yaratish

1. Telegram'da `@BotFather` ni toping
2. `/newbot` yuboring
3. Nom bering: `FIKRA Bot`
4. Username bering: `fikra_app_bot`
5. **BOT_TOKEN** ni saqlang

### 4. MongoDB Atlas sozlash

1. https://mongodb.com/atlas → Ro'yxatdan o'ting
2. **Free cluster** yarating (M0 tier)
3. **Database Access** → Foydalanuvchi yarating (username + password)
4. **Network Access** → `0.0.0.0/0` qo'shing (hamma IP)
5. **Connect** → Drivers → Connection string ni nusxalang
6. String: `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/fikra`

### 5. Loyihani sozlash

```bash
# Loyihani yuklab oling
git clone https://github.com/SIZNING-USERNAME/fikra.git
cd fikra/backend

# Dependencies o'rnatish
npm install

# .env fayl yaratish
cp .env.example .env
```

### 6. .env faylni to'ldirish

```bash
# backend/.env faylni oching va to'ldiring:
BOT_TOKEN=7234567890:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/fikra
JWT_SECRET=bu_yerga_kamida_32_ta_tasodifiy_belgi_kiriting
JWT_REFRESH_SECRET=bu_yerga_ham_boshqa_32_ta_belgi_kiriting
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FAL_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:xxxxx
```

**JWT_SECRET yaratish uchun:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7. Test savollarini yuklash

```bash
node src/utils/seedQuestions.js
# "27 ta savol bazaga yuklandi" — muvaffaqiyatli
```

### 8. Lokal ishga tushirish

```bash
npm run dev
# FIKRA server started on port 3000
# MongoDB Atlas ulanish muvaffaqiyatli
# Bot long polling started
```

Brauzerda oching: `http://localhost:3000`

---

## Railway.app ga deploy

### 1. GitHub ga yuklash

```bash
cd fikra
git init
git add .
git commit -m "Initial FIKRA commit"
git remote add origin https://github.com/SIZNING/fikra.git
git push -u origin main
```

### 2. Railway sozlash

1. https://railway.app → GitHub bilan kiring
2. **New Project** → **Deploy from GitHub repo**
3. `fikra` reponi tanlang
4. **Settings** → Root Directory: `backend`
5. **Variables** → `.env` fayldagi barcha o'zgaruvchilarni qo'shing
6. `RAILWAY_TOKEN` ni olish: Railway → Account Settings → Tokens

### 3. GitHub Secrets qo'shish

GitHub repo → Settings → Secrets → Actions:
```
RAILWAY_TOKEN = railway_xxxxxxxxxxxxx
```

### 4. FRONTEND_URL ni yangilash

Deploy tugagach Railway URL ni `.env` ga qo'shing:
```
FRONTEND_URL=https://fikra-production.up.railway.app
NODE_ENV=production
```

### 5. Telegram Webhook

```bash
curl https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://fikra-production.up.railway.app/bot
```

---

## Foydalanish

### API Endpointlar

```
POST /api/auth/login        — Telegram initData → JWT
GET  /api/auth/me           — Profil
GET  /api/tokens/balance    — Token balansi
POST /api/tokens/ads-reward — Reklama ko'rib token olish
POST /api/tokens/daily-bonus — Kunlik bonus
POST /api/games/stroop/result — Stroop natijasi
GET  /api/games/leaderboard/:type — Reyting
POST /api/games/test/result — Test natijasi
POST /api/ai/chat           — AI chat (SSE stream)
POST /api/ai/document       — Hujjat yaratish
POST /api/ai/image          — Rasm yaratish
POST /api/ai/calorie        — Kaloriya tahlili
POST /api/sub/webhook       — Stars to'lov webhook
```

### Savollar qo'shish

```bash
# Yangi savollarni seedQuestions.js ga qo'shing
# Yoki MongoDB Compass bilan to'g'ridan to'g'ri
node src/utils/seedQuestions.js
```

---

## Arxitektura

```
fikra/
├── backend/
│   ├── src/
│   │   ├── app.js          — Express server
│   │   ├── bot.js          — Telegraf bot
│   │   ├── routes/         — auth, tokens, games, ai, subscription
│   │   ├── services/       — tokenService, aiService
│   │   ├── models/         — User, TokenTransaction, GameSession, TestQuestion, AdsEvent
│   │   ├── middleware/     — auth (JWT+HMAC), rateLimit, errorHandler
│   │   └── utils/          — db, logger, seedQuestions
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── css/theme.css
│   └── js/
│       ├── api.js          — Fetch wrapper + JWT
│       ├── app.js          — Router + UI
│       ├── games/          — stroop.js, test.js
│       ├── ai/             — chat.js, doc.js, calorie.js
│       └── ads/            — adsgram.js
└── .github/workflows/deploy.yml
```

---

## Narxlar va daromad

| AI xizmat | Xarajat | Token | Marja |
|---|---|---|---|
| Chat (DeepSeek) | $0.0006/savol | 5t | +16,500% |
| Rasm (Gemini) | $0.039/rasm | 30t | +1,438% |
| Kaloriya | $0.005/skan | 15t | +5,900% |
| Video (Kling) | $0.35/video | 250t | +1,328% |

**500 foydalanuvchi, oylik:**
- Ads: $239
- Obuna: $705
- Xarajat: ~$100
- **Sof foyda: ~$844**

---

## Muammolar

**MongoDB ulanmaydi:**
- Atlas Network Access → `0.0.0.0/0` bormi?
- Connection string to'g'rimi?
- Username/password to'g'rimi?

**Bot ishlamaydi:**
- BOT_TOKEN to'g'rimi?
- Production: webhook set qilinganmi?
- `curl https://api.telegram.org/bot<TOKEN>/getMe` ishlayaptimi?

**AI javob bermaydi:**
- API key to'g'rimi?
- Balance bormi? (DeepSeek, Gemini)
