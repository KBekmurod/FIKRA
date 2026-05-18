# FIKRA 3.0 — Yangi tizim arxitekturasi

## 🆕 Yangi: Material Papkasi tizimi (OMBOR)

**Qat'iy qoida:** 1 Material = 1 Papka = 1 AI Test

```
🏛 Ombor → Fan → [Majburiy / Mutaxassislik] → Papkalar ro'yxati
                                              ↓
                                         Papka ichi:
                                         • Material
                                         • Test (1 marta yaratiladi)
                                         • Urinishlar statistikasi
```

### Yangi modellar (Backend)
- `MaterialFolder` — papka tizimi (subjectId + context + materialId + testId)
- `StudyMaterial` — `folderId`, `hasGeneratedTest` qo'shildi
- `PersonalTest` — `folderId`, `materialId` qo'shildi

### Yangi servis
- `folderService` — papkalar boshqaruvi, yetarlilik tekshirish, urinishlar statistika
- `getStandardCountByContext`: majburiy=10, mutaxassislik=30

### Yangi API endpointlari
- `GET /api/folders/by-subject/:subjectId?context=...`
- `GET /api/folders/subjects-summary` — Ombor sahifasi uchun
- `GET /api/folders/:id` — papka detali (material + urinishlar)
- `POST /api/folders` — yangi papka (materialId + subjectId + context)
- `POST /api/folders/:id/check-sufficiency` — yetarlilikni tekshirish
- `POST /api/folders/:id/generate` — AI test yaratish
- `POST /api/folders/:id/retry` — qaytadan urinish
- `DELETE /api/folders/:id`

## 🎯 Dual-Context fanlar (B variant)

3 fan IKKALA kontekstda bo'la oladi:
- `math` — Matematika (10/30)
- `tarix` — Tarix (10/30)

Faqat **majburiy**: `uztil` (Ona tili)
Faqat **mutaxassislik**: `adab` (Ona tili va adabiyoti) va boshqalari

Foydalanuvchi math papkasini ikkala kontekstda alohida yaratishi mumkin:
- Matematika (majburiy) — 10 ta test, 1.1 ball
- Matematika (mutaxassislik) — 30 ta test, 3.1 ball

## 🆕 6 ta yangi mutaxassislik fani

- Davlat va huquq asoslari (`huquq`)
- Nemis tili (`nemis`)
- Fransuz tili (`fransuz`)
- Arab tili (`arab`)
- Fors tili (`fors`)
- Turk tili (`turk`)

**Jami fanlar: 18 ta** (3 majburiy + 15 mutaxassislik, math/tarix dual)

## 💳 To'lov tizimi yangilangan

- **Stars to'lov OLIB TASHLANGAN** (yuqori komissiya)
- **P2P qoladi** (asosiy yo'l)
- **Payme, Click — tez orada** (banner ko'rinishida)
- `subscription/create-invoice` endpoint 410 status qaytaradi

## 🖼 Yangi home screen ikoni

- Foydalanuvchi yuborgan SVG faylidan PNG'lar generatsiya qilindi:
  - `icon-192.png`
  - `icon-512.png`
  - `apple-touch-icon.png` (180x180)
- Ichidagi logolar (header'dagi "FIKRA.") TEGILMADI

## 🎨 Vizual birxillik (Telegram vs Chrome)

- `index.html`'ga Telegram theme override skripti qo'shildi
- `index.css`'ga `--tg-theme-*` o'zgaruvchilari mahkamlandi
- Chrome va Telegram'da bir xil ko'rinish

## ⬅️ Back tugma bo'sh sahifa muammosi

- Yangi `useGoBack(fallback)` hook
- Agar history bo'sh — fallback marshrutga yo'naltirish
- Direct link orqali kelganda ham xavfsiz

## 📊 Daraja tartibi

- v1-3 → DELTA (boshlang'ich, ko'k)
- v4-7 → BETA (o'rta, yashil)
- v8-10 → ALFA (yuqori, oltin)

## 📁 Yangi/yangilangan sahifalar

Frontend:
- `OmborPage` — fanlar ro'yxati (Majburiy/Mutaxassislik tab)
- `OmborSubjectPage` — fan ichi, papkalar ro'yxati, dual context tab
- `OmborFolderPage` — papka ichi (material + test + statistika)
- `MaterialAddPage` — papka yaratish (matn/OCR/fayl)
- `SubscriptionModal` — faqat P2P + tez orada Payme/Click

Backend:
- `MaterialFolder` model
- `folderService`
- `routes/folders.js`

## 🔒 Qat'iy qoidalar

1. **1 material = 1 papka = 1 test** — har material faqat 1 marta AI test yaratadi
2. **Test ko'p marta ishlanishi mumkin** — har urinish papka statistikasiga qo'shiladi
3. **Standart sonlar qat'iy:** majburiy=10, mutaxassislik=30
4. **Material yetarli emas** — modal so'rovi:
   - ➕ Material qo'shish
   - 🤖 AI o'zi yetkazib bersin (sifat pasayadi)
   - ✗ Bekor
5. **Material tahriri** — test eski qoladi
6. **Test chiqib ketsa** — abandoned, tarixga saqlanmaydi
7. **AI tushuntirish + Mini-test** — har sessiyada 1 marta
