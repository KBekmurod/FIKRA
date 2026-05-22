# FIKRA 8.0 — AUTENTIFIKATSIYANI TOZALASH

## 🔥 Asosiy o'zgarish

**Telegram ID, Telegram bot, Google OAuth — barchasini olib tashladik.**
Endi faqat **email yoki telefon nomer + parol** orqali kirish.

---

## 🗑 Olib tashlangan narsalar

### Backend
- `bot.js` — Telegram bot toʻliq oʻchirildi
- `verifyTelegramInitData` middleware
- `/api/auth/google`, `/api/auth/telegram-only`, `/api/auth/telegram-link`, `/api/auth/telegram-unlink` endpointlari
- `POST /api/sub/activate` — Stars webhook
- `telegraf` va `google-auth-library` dependencies
- `BOT_TOKEN`, `BOT_USERNAME`, `GOOGLE_CLIENT_ID`, `TELEGRAM_WEBAPP_URL`, `STARS_WEBHOOK_SECRET`, `ADMIN_TELEGRAM_IDS` env variables

### Model field'lari
- `User.telegramId`
- `User.googleId`
- `User.username`
- `User.authProvider`
- `PendingOrder.telegramId` → `userId` (ObjectId)
- `PendingOrder.priceStars` va `paymentType === 'stars'`

### Frontend
- `loginWithGoogle`, `loginWithTelegram`, `linkTelegram` metodlari store'dan
- Google Sign-In SDK va tugmasi
- Telegram WebApp.init() chaqirig'i `main.tsx` dan
- `<script src="telegram-web-app.js">` `index.html` dan
- ProfilePage'dan Referral (Telegram link) boʻlimi
- Telegram HapticFeedback Toast'dan
- `tg.openTelegramLink()`, `tg.openLink()` SubscriptionModal va AIPage'dan
- `User.username`, `User.telegramId`, `User.googleId`, `User.authProvider`, `User._demo` types'dan
- Service Worker dan `telegram.org` maxsus handling

---

## ✅ Yangi qoʻshildi

### Model
- `User.phone` (sparse unique) — E.164 format, masalan `+998901234567`
- `User.passwordHash` endi **majburiy**
- Pre-validate hook: `email` yoki `phone` — kamida bittasi boʻlishi shart
- `PendingOrder.userId`, `userEmail`, `userPhone`

### API endpointlari
- `POST /api/auth/register` → `{ identifier, password, name }`
- `POST /api/auth/login` → `{ identifier, password }`
- `POST /api/auth/add-identifier` → mavjud akkountga email yoki telefon qoʻshish

### Frontend
- `WelcomePage` — soddalashtirildi (faqat "Roʻyxatdan oʻtish" va "Kirish")
- `LoginPage` — bitta input "Email yoki telefon nomer", emoji indikator (📧 yoki 📱)
- `RegisterPage` — email/telefon tab'lar (foydalanuvchi tanlaydi)
- `ProfilePage` — "Akkount" boʻlimi: email va telefon koʻrsatiladi
- `store.login(identifier, password)` va `store.register(identifier, password, name)`

### Helper funksiyalar
- `normalizePhone(raw)` — `+998 90 123 45 67` yoki `901234567` → `+998901234567`
- `parseIdentifier(raw)` — `@` belgisi orqali email/phone avtomatik aniqlash
- `detectIdentifierType(s)` (frontend) — real-vaqtda emoji koʻrsatish uchun

---

## 🎯 Foydalanuvchi tajribasi

### Roʻyxatdan oʻtish
1. **WelcomePage** → "Roʻyxatdan oʻtish"
2. **RegisterPage** → Ism + (Email YOKI Telefon tab) + Parol + Tasdiq
3. Avtomatik login va `/` ga yoʻnaltiriladi

### Kirish
1. **WelcomePage** → "Mavjud akkountga kirish"
2. **LoginPage** → bitta input ("user@gmail.com" yoki "+998 90 123 45 67") + Parol
3. Tizim avtomatik aniqlaydi va `/` ga yoʻnaltiriladi

### Profil
- Foydalanuvchi oʻz email yoki telefonini koʻradi
- `POST /api/auth/add-identifier` orqali ikkinchisini qoʻshish mumkin (UI'da hozir yoʻq, keyinroq qoʻshamiz)

---

## 📊 Yakuniy holat

| Soha | Holat |
|---|---|
| Backend modellar | 10 (Telegram izlari yoʻq) |
| Backend servislar | 11 |
| Backend routelar | 11 (`bot.js` olib tashlandi) |
| Frontend sahifalar | 26 |
| TypeScript xatolar | 0 |
| Backend syntax xatolar | 0 |
| Telegram referencelari (kod ichida) | 0 |
| Google referencelari (kod ichida) | 0 |
| Bog'liqliklar (dependencies) | -2 (`telegraf`, `google-auth-library`) |

---

## ⚠️ Migratsiya

**Eski foydalanuvchilar oʻchirildi (DB tozalandi).** Yangi foydalanuvchilar email yoki telefon + parol bilan qaytadan roʻyxatdan oʻtishadi.

`User` modelidagi yangi `passwordHash: required: true` qoidasi sababli eski telegram-only foydalanuvchilar avtomatik xato beradi — bu maqsadli xulq.

## 🔒 Xavfsizlik

- JWT access token: 1 soat
- JWT refresh token: 7 kun
- Parol: bcrypt (10 round)
- Parol minimum: 8 belgi
- Rate limit: `authLimiter` saqlandi
- Telefon formati validatsiyasi (E.164)
