# FIKRA 4.0 — Auth tizimi va AI testlar simmetriyasi

## 🔐 SESSIYA A — Auth tizimi (yangi)

### Backend
- **`User` modeli** kengaytirildi:
  - `email`, `passwordHash` (email/parol auth)
  - `googleId` (Google OAuth)
  - `displayName`, `authProvider`
  - `telegramId` endi majburiy emas (sparse unique)

- **`google-auth-library`** paketi qo'shildi
- **`bcryptjs`** mavjud, parol xeshlash uchun

### Yangi auth endpointlari
| Endpoint | Tavsif |
|---|---|
| `POST /api/auth/register` | Email/parol ro'yxat (8+ belgi, validatsiya) |
| `POST /api/auth/login` | Email/parol kirish |
| `POST /api/auth/google` | Google ID token bilan kirish/ro'yxat |
| `POST /api/auth/telegram-only` | Telegram (ixtiyoriy yo'l) |
| `POST /api/auth/telegram-link` | Joriy akkountga Telegram bog'lash |
| `POST /api/auth/telegram-unlink` | Telegram'ni o'chirish |
| `POST /api/auth/change-password` | Parol o'zgartirish |
| `POST /api/auth/refresh` | Token yangilash |
| `GET /api/auth/me` | Joriy foydalanuvchi |

### Frontend (3 ta yangi sahifa)
- **`WelcomePage`** (`/auth/welcome`) — kirish/ro'yxat tanlovi
  - Hero bilan FIKRA bayrog'i
  - 4 ta imkoniyat ko'rsatkichi
  - Email, Google, Telegram (agar Telegram'da bo'lsa) tugmalar
- **`LoginPage`** (`/auth/login`) — email/parol kirish
- **`RegisterPage`** (`/auth/register`) — email/parol ro'yxat (4 maydon)

### Store yangilandi
Yangi metodlar:
- `bootstrap()` — dastur ochilganda sessiya tekshirish
- `loginWithEmail(email, password)`
- `register(email, password, name)`
- `loginWithGoogle(idToken)` — Google Identity Services orqali
- `loginWithTelegram()` — initData bilan
- `linkTelegram()` — joriy akkountga bog'lash
- `logout()` — local data tozalash

### Auth Guard
Barcha himoyalangan marshrutlar `<RequireAuth>` ichida. Kirmagan
foydalanuvchi avtomatik `/auth/welcome`'ga yo'naltiriladi.

### Profile sahifa
"🚪 Chiqish" tugmasi qo'shildi.

---

## 🤖 SESSIYA B — AI testlar simmetriyasi va Tarix metadata

### AI testlar 3 ta natija karta (FIKRA bilan TENG arxitektura)

Avval `PersonalTestResultPage` faqat ball ko'rsatardi. Endi:

1. **EC1: Savollarni ko'rish** → `/personal-tests/:id/review`
   - Filtrlash: barchasi / to'g'ri / xato
   - Pagination (10 savol/sahifa)
   - Har savol uchun: variantlar, foydalanuvchi tanlovi, to'g'ri javob, AI tushuntirish

2. **EC2: Xatolar bilan rivojlanish** → `/personal-tests/:id/explain`
   - Faqat asosiy test uchun, mini-test uchun emas
   - Har xato savol uchun "🤖 AI batafsil tushuntirsin" tugma
   - Mini-test boshlash (1 marta qoidasi)

3. **EC3: Tarixga saqlandi** → `/tarix`
   - Avtomatik saqlanganlik ko'rsatkichi

### Mini-test 1 marta qoidasi (backend)
`/api/personal-tests/mini` endpointi:
- `sourceTestId` parametri qabul qiladi
- Folder'da `miniTestGenerated: true` bo'lsa **409 qaytaradi**
- Mini-test yaratilgach folder'da `miniTestId` va `miniTestGenerated: true` saqlanadi

### AI explain endpointi (yangi)
`POST /api/personal-tests/:id/explain` — bitta xato savol uchun AI batafsil tushuntirish
(mavjud `aiService.explainWrongAnswer` ishlatiladi, hints kunlik limiti).

### Tarix sahifasi to'liq qayta yozildi

Har test endi to'liq metadata bilan ko'rinadi:

**FIKRA testlar:**
- Test turi: Maxsus blok yoki Erkin tanlov
- Tanlangan yo'nalish (blok): Muhandislik, Tibbiyot va h.k.
- Tanlangan fanlar (erkin): icon'lar bilan

**AI testlar:**
- Test turi badge: 🤖 AI TEST yoki 🎯 MINI-TEST (xatolardan)
- Fan: icon + nom
- Kontekst: majburiy yoki mutaxassislik (rangli badge)
- Papka nomi: 📁 "Algebra qoidalari"
- Sana, natija, to'g'ri/jami

**Filter chiplar:**
- Barcha fanlar bo'yicha filtrlash
- Bitta tugmacha bilan barchasi yoki bitta fan

### AiTestsPage'da papkalar bilan integratsiya
Avval oddiy ro'yxat edi. Endi:
- Majburiy / Mutaxassislik tab
- Dual-context (math, tarix) alohida bo'lim
- Kategoriya bo'yicha guruhlash (Aniq va tabiiy, Gumanitar, Chet tillari)
- Har fan papka soni va statistikasi bilan

### PersonalTestRunPage yangilandi
- `useGoBack` qo'llanildi
- Abandon mexanikasi (`sendBeacon`)
- Test ichidan chiqish modal so'rovi
- Nav-attempt event tinglovi

### Backend testlar tarixi endpointi
`getTestHistory` endi:
- Folder'ni populate qiladi (title, context, materialId)
- Material'larni batch fetch
- `folderInfo` formatlangan obyekt qaytaradi

---

## 📊 Yakuniy texnik holat

| Soha | Holat |
|---|---|
| Backend modellar | 10 ta |
| Backend servislar | 10 ta |
| Backend route fayllar | 11 ta |
| Frontend sahifalar | **27 ta** (4 ta yangi auth + 3 ta AI test) |
| TypeScript xatolar | **0 ta** |
| Build size | 487 KB / **139 KB gzipped** |

## 🔒 Mustahkamlik
- Auth Guard barcha sahifalarda
- JWT + refresh token
- Bcrypt parol xeshlash
- Google Identity Services
- Rate limiting (`authLimiter` registratsiya va kirishda)
- Token expiry handling

## ⚙️ ENV o'zgaruvchilar (yangi)
```
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Google Console'da OAuth 2.0 Client ID yaratish kerak, "Web application"
turini tanlang va frontend URL'larini ruxsat etilgan ro'yxatga qo'shing.

---

## 📋 Foydalanuvchi tomonidan ko'radigan o'zgarishlar

### Yangi foydalanuvchi
1. Brauzerda yoki Telegram'da ilovani ochadi
2. **Welcome sahifasi** ko'rinadi (avtomatik kirish YO'Q)
3. 3 tanlov: Email ro'yxat / mavjud akkountga kirish / Google
4. Telegram'da: qo'shimcha "Telegram bilan davom etish" tugmasi
5. Ro'yxatdan o'tib bo'lgach asosiy sahifa

### Mavjud telegram foydalanuvchilar
Eski telegram-only akkountlari saqlanadi — telegram orqali kirib,
keyin profilda email/parol qo'shishi mumkin.

### Test ishlash oqimi
1. Ombor → Fan → Papka → Test boshlash
2. Test yakuni → **3 ta karta** (Savollar, Xatolar, Tarix)
3. "Xatolar bilan rivojlanish" da AI tushuntirish va mini-test
4. Mini-test natijasi ham 3 ta karta ko'rinishida (mini-test uchun EC2 yo'q)

### Tarix
1. Tarix sahifasi → FIKRA / AI tab
2. Har test to'liq metadata bilan (qaysi fan, papka, mini-testmi)
3. Fan bo'yicha filter
4. Bosib kirish → test natija sahifasi
