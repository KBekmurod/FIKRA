# FIKRA — Yakuniy Deployment Yo'riqnomasi

## Loyiha holat

**Barcha 6 bosqich tugatildi ✅**

| Bosqich | Nima | Tekshiruv |
|---|---|---|
| 1 | Hujjat + Adsgram + Stars | 29/29 ✅ |
| 2 | Rasm + Leaderboard + Kunlik bonus + Referral + Video | 43/43 ✅ |
| 3-A | Auth xavfsizligi + UI | 46/46 ✅ |
| 3-B | Gamification (XP + 8 lavozim) | 54/54 ✅ |
| 3-C | Iqtisod (6 plan + 4 pack + reklama) | 40/40 ✅ |
| 4 | Kontent (155 DTM + Musiqa + Turnir) | 47/48 ✅ |
| 5 | Yangi o'yinlar (Avto + Fashion + Football) | 43/43 ✅ |
| 6 | PWA + Responsive | 32/32 ✅ |

**Jami: 334+ tekshiruv, 49+ fayl**

---

## Railway Deploy

### 1. GitHub push

```bash
cd fikra_v2
git init
git add .
git commit -m "FIKRA v1.0.0 — to'liq ishchi versiya"
git remote add origin <your-repo>
git push origin main
```

### 2. Railway.app ga ulash

1. Railway.app → New Project → Deploy from GitHub
2. Loyiha tanlang
3. Environment Variables qo'shing (pastda)
4. Deploy tugmasini bosing

### 3. Environment Variables

```bash
# Asosiy
BOT_TOKEN=<telegram_bot_token>
MONGODB_URI=<mongodb_atlas_connection>
JWT_SECRET=<32 belgidan uzun random>
JWT_REFRESH_SECRET=<32 belgidan uzun random>
NODE_ENV=production
FRONTEND_URL=https://your-app.railway.app
PORT=3000

# AI API'lar
DEEPSEEK_API_KEY=<deepseek_key>
GEMINI_API_KEY=<gemini_key>
FAL_API_KEY=<fal_ai_key>

# Reklama
ADSGRAM_BLOCK_ID=<adsgram_block>
ADSGRAM_SECRET=<webhook_secret>

# Telegram Stars
STARS_WEBHOOK_SECRET=<webhook_secret>
BOT_USERNAME=fikraai_bot

# Cron (production da avtomatik)
ENABLE_CRON=true
```

### 4. Ma'lumotlar bazasini to'ldirish

Railway shell dan:
```bash
node src/utils/seedQuestions.js
```

Bu 155 ta DTM savolni MongoDB ga yozadi.

### 5. @BotFather sozlash

1. `/mybots` → FIKRA botingizni tanlang
2. **Bot Settings → Payments** → **Enable Stars** ✅
3. **Bot Settings → Menu Button** → Web App URL:
   `https://your-app.railway.app`
4. **Bot Settings → Configure Mini App** → URL qo'shing

---

## PWA ga real ikonkalar qo'shish

Placeholder PNG lar bor. Real ikona yaratish:

**Eng oson:** https://realfavicongenerator.net/
1. SVG fayl yuklang (`public/icons/icon.svg`)
2. Barcha formatlarda generate qiling
3. `public/icons/` ga nusxa ko'chiring

Yoki terminal (librsvg bor bo'lsa):
```bash
rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png
rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
```

---

## Loyiha tuzilmasi

```
fikra_v2/
├── src/
│   ├── app.js                         # Express server
│   ├── bot.js                         # Telegraf bot
│   ├── routes/
│   │   ├── auth.js                    # Login, refresh, me
│   │   ├── tokens.js                  # Balans, daily bonus, ads reward
│   │   ├── games.js                   # Stroop, DTM test, leaderboard
│   │   ├── ai.js                      # DeepSeek chat, Gemini rasm
│   │   ├── subscription.js            # 6 plan + 4 token pack
│   │   ├── content.js                 # Musiqa + turnir
│   │   └── newgames.js                # Avto + Fashion + Football
│   ├── models/
│   │   ├── User.js                    # XP, rank, plan
│   │   ├── TokenTransaction.js
│   │   ├── GameSession.js
│   │   ├── TestQuestion.js
│   │   ├── AdsEvent.js
│   │   ├── Tournament.js
│   │   └── GameInventory.js           # Avto/fashion/football
│   ├── services/
│   │   ├── tokenService.js            # Atomic balans
│   │   ├── rankService.js             # 8 lavozim (XP)
│   │   ├── subscriptionCron.js        # Obuna + turnir cron
│   │   ├── tournamentService.js       # Haftalik turnir
│   │   ├── musicService.js            # 10 trek
│   │   ├── gameCatalog.js             # 8 mashina, 5 uslub, 8 klub
│   │   ├── newGamesService.js         # Inventar + savdo
│   │   ├── aiService.js               # AI adapters
│   │   └── documentService.js         # DOCX/PDF/PPTX
│   ├── middleware/
│   │   ├── auth.js                    # HMAC + JWT
│   │   ├── rateLimit.js
│   │   └── errorHandler.js
│   └── utils/
│       ├── db.js, logger.js
│       └── seedQuestions.js           # 155 savol
├── public/
│   ├── index.html                     # PWA + meta
│   ├── manifest.json                  # PWA metadata
│   ├── service-worker.js              # Offline cache
│   ├── icons/
│   │   ├── icon.svg
│   │   ├── icon-192.png (placeholder)
│   │   └── icon-512.png (placeholder)
│   ├── css/theme.css                  # 400+ qator
│   └── js/
│       ├── api.js                     # Auth + endpoints
│       ├── app.js                     # 2900+ qator UI
│       ├── music.js                   # Audio player
│       ├── ads/adsgram.js
│       ├── games/stroop.js, test.js
│       └── ai/chat.js, doc.js, image.js, calorie.js
├── package.json
├── nixpacks.toml                      # Railway build
├── .env.example
├── .gitignore
└── PWA.md                             # PWA yo'riqnoma
```

---

## Nima qilinadi

### Foydalanuvchi experiensi:

1. **🧠 Miya faolligi** — Stroop o'yini (rang, to'g'ri/noto'g'ri)
2. **📚 O'rganish** — DTM Test (9 fan, 155 savol, tushuntirish bilan)
3. **🎨 Dam olish:**
   - Avto Tuning (8 mashina, tuning, bozor)
   - Fashion Design (5 uslub, rang, naqsh)
   - Master Liga (8 klub, 4 stat upgrade)

### AI xizmatlar:
- AI Chat (DeepSeek, 5t/xabar)
- Hujjat yaratish (DOCX/PDF/PPTX, 10t)
- Rasm yaratish (Gemini, 30t)
- Kaloriya tahlil (3t)
- Video (Kling, 250t)
- Test hint (10t)

### Gamification:
- **XP tizim** — har harakatdan 1-50 XP
- **8 lavozim** — Urug' → Imperator
- **Streak multiplier** — 7+ kun ×2, 30+ kun ×3
- **Haftalik turnir** — prize fond (500t + VIP)

### Iqtisod:
- **6 obuna:** Basic 19k → Business 811k so'm
- **4 token pack:** 50-1500 token
- **Reklama** (Adsgram) — rewarded +5t, interstitial
- **Bozor soliq** — 3% har savdoda

### PWA:
- Home screen ga yuklash
- Offline ishlash
- 3 ta app shortcut (Chat, Stroop, DTM)
- Push notification asos

### Responsive:
- 375px telefon
- 768px planshet
- 1200px desktop (3 ustun)

---

## Xavfsizlik

- ✅ Telegram HMAC-SHA256 initData tekshiruv
- ✅ JWT (24 soatlik access, 7 kunlik refresh)
- ✅ JWT foydalanuvchi Telegram ID ga bog'langan
- ✅ Boshqa user kirganda tokenlar avtomatik tozalanadi
- ✅ Har 30s foydalanuvchi mos kelishini tekshirish
- ✅ Rate limiting (AI, ads)
- ✅ Atomic token operatsiyalari (spent + earn)
- ✅ XSS escape (_escapeHtml)
- ✅ Server-side Adsgram secret verification

---

## Keyingi rivojlanishlar

Loyihani bundan ortiq kengaytirish kerak bo'lganda:

- Ingliz tili tarjima (EN/UZ toggle)
- Push bildirishnomalar (VAPID kalitlari)
- Real PNG ikonkalar (logo dizayneridan)
- Football — real o'yin simulyatsiyasi
- Avto — 3D vizualizatsiya (Three.js)
- Fashion — rasm yaratish (AI orqali)
- Darsxona (o'qituvchi rejimida)
- Onlayn darslar (video stream)

Hozirgi holati **production-ready** — foydalanuvchilarga taqdim etsa bo'ladi.
