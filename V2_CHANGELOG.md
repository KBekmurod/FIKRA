# FIKRA 2.0 — O'zgarishlar ro'yxati

Mind-map PDF asosida 1.0 → 2.0 ga o'tkazilgan asosiy o'zgarishlar.

## 🆕 Yangi imkoniyatlar

### 1. Material yuklash tizimi (3 xil yo'l)
- **Matn (copy-paste)** — 25,000–30,000 belgi
- **Rasm (OCR)** — Gemini Vision orqali rasmdan matn ajratish
- **Fayl** — PDF/DOCX/PPTX dan matn ajratish (20 sahifagacha)

OCR/Fayl natijasi avtomatik tahrirlash oynasiga tushadi: foydalanuvchi
"Test yaratishdan oldin matnni tekshirib oling" oynasida tuzata oladi.

### 2. AI Test Generatsiyasi
- Foydalanuvchining o'z materiallaridan DeepSeek AI orqali test yaratish
- "Bu materialdan N ta test yarata olaman" — taklif → tasdiq → generatsiya
- Yaratilgan testlar **Shaxsiy individual testlar tarixi**ga saqlanadi

### 3. Beta / Delta / Alfa Daraja tizimi
- **Beta** (v1–3): Standart + shaxsiy testlar natijasi
- **Delta** (v4–7): Standart + shaxsiy (chuqurroq)
- **Alfa** (v8–10): Mini-testlar (xato savollardan)
- Har oy avtomatik nolga tushadi, oylik tarix saqlanib boradi

### 4. Xato qilingan testlarda AI bilan rivojlanish
- Har xato uchun: mavzu konteksti + isbot + xulosa
- Mini-test generatsiyasi (xatolarga o'xshash yangi savollar)

### 5. Rich Text Rendering
- **KaTeX** — matematika va fizika formulalar: `$S = \pi r^2$`
- **mhchem** — kimyo reaksiyalari: `$\ce{H2SO4 + 2NaOH -> Na2SO4 + 2H2O}$`
- **JPG/PNG rasmlar** — savol bilan birga
- Inline va block math, fallback to plain text

## 🔄 O'zgartirilgan

### Navigatsiya (5 ta tugma)
- 🏠 Bosh
- 📚 Fanlar (eski "Test" o'rnida) — **markaziy hub**
- 🤖 AI
- 📊 Daraja (yangi)
- 👤 Profil

### Olib tashlangan
- ❌ XP / Rank tizimi (Urug' → Imperator)
- ❌ `streakDays` ko'rsatkichi
- ❌ `totalGamesPlayed`, `totalAiRequests` ko'rsatkichlari

DB'dagi mavjud qiymatlar buzilmaydi (back-compat), faqat kod ishlatmaydi.

## 🗂 Loyiha tuzilishi

### Backend (Node.js + Express + MongoDB)
```
src/
├── models/
│   ├── User.js               (XP/rank olib tashlangan)
│   ├── StudyMaterial.js      🆕
│   ├── PersonalTest.js       🆕
│   ├── UserLevel.js          🆕
│   └── ...
├── services/
│   ├── materialService.js    🆕
│   ├── ocrService.js         🆕
│   ├── fileParseService.js   🆕
│   ├── testGeneratorService.js 🆕
│   ├── levelService.js       🆕
│   └── ...
└── routes/
    ├── materials.js          🆕 — POST /api/materials/*
    ├── personalTests.js      🆕 — POST /api/personal-tests/*
    ├── level.js              🆕 — GET /api/level/*
    └── ...
```

### Frontend (React + TypeScript + Vite)
```
client/src/
├── pages/
│   ├── HomePage.tsx          (yangilangan — daraja kartasi)
│   ├── SubjectsPage.tsx      🆕 — markaziy hub
│   ├── SubjectDetailPage.tsx 🆕
│   ├── MaterialAddPage.tsx   🆕 — 3 tab: Matn/Rasm/Fayl
│   ├── MaterialEditPage.tsx  🆕
│   ├── PersonalTestRunPage.tsx 🆕
│   ├── PersonalTestResultPage.tsx 🆕
│   ├── LevelPage.tsx         🆕 — beta/delta/alfa progressi
│   ├── ProfilePage.tsx       (yangilangan — material limitlari)
│   └── ...
├── components/
│   ├── RichText.tsx          🆕 — KaTeX + mhchem render
│   └── ...
└── api/
    └── endpoints.ts          (yangilangan — materialApi, personalTestApi, levelApi)
```

## 📦 Yangi paketlar

### Backend
- `pdf-parse` — PDF matn ajratish
- `mammoth` — DOCX matn ajratish
- `jszip`, `xml2js` — PPTX matn ajratish

### Frontend
- `katex`, `react-katex` — formula render
- `@types/katex`, `@types/react-katex` — TypeScript turlar

## 🚀 Deploy

Mavjud Railway konfiguratsiyasi (`nixpacks.toml`) o'zgarmaydi. Faqat:
```bash
npm install
npm run build
npm start
```

`.env` da o'zgarish yo'q (DeepSeek va Gemini API kalitlari mavjud).
