# FIKRA Loyihasi — To'liq Bajarilish Rejasi

> **Versiya:** 1.0 · **Tuzilgan:** 2026-04-23  
> Har bir bosqich tugagach, tegishli `[ ]` ni `[x]` ga o'zgartiring va commit qiling.

---

## 🌟 Mahsulot Viziyasi

**FIKRA** — "Virtual Intellektual Meta-Olam":

| Yo'nalish | Tavsif |
|---|---|
| 🧠 Miya rivojlantirish | O'yinlar orqali kognitiv qobiliyatlarni oshirish |
| 📚 O'rganish va bilim | DTM, til, tarix, dasturlash sinovlari |
| 🤖 AI yordamchi | Chat, hujjat, rasm, kaloriya, video yaratish |
| 🎮 Kreativ dam olish | Avto tuning, fashion dizayn, futbol menejment |
| 🏆 Gamification | Daraja, lavozim (pagon), yutuqlar, turnirlar |
| 💰 Ichki iqtisodiyot | Tokenlar, obuna, marketplace, P2P savdo |
| 📱 Har yerda | Telegram, PWA (offline), desktop/tablet/mobile |

**Foydalanuvchi tajribasi:**
> "Men FIKRA'ga kirsam, miyamni charxlatadigan o'yin o'ynayman, DTM test yechaman, AI'dan yordam olaman, virtual mashinamni tuning qilaman, boshqa o'yinchilar bilan musobaqalashaman, darajam ko'tarilib, pagonim o'sib boradi. Bu mening ikkinchi dunyom — qiziqarli, foydali va noyob."

---

## 🗺️ "Hozir qilamiz / Keyin qilamiz" Prioritizatsiyasi

### ✅ HOZIR (Phase 1 — birinchi sprint)

| Blok | Nima | Nega muhim |
|---|---|---|
| **A** | Autentifikatsiya va Xavfsizlik | Hamma narsa shunga bog'liq |
| **B** | Foydalanuvchi Profili (core) | Shaxsiylashtirishning asosi |
| **C** | Token Iqtisodiyoti (essentials) | Monetizatsiya + gamification poydevori |
| **D1** | Miya O'yinlari (6 ta) | Asosiy engagement driver; Stroop mavjud, 5 ta scaffold kerak |

### 🔜 KEYIN (Phase 2–6 — keyingi sprintlar)

- D2 O'rganish o'yinlari (Word Master, Tarix, Geografiya, Kod, Mantiq)
- D3 Kreativ o'yinlar (Football, Auto Tuning, Fashion)
- E  AI yordamchi kengaytirish
- F  Cross-platform va kontent boyitish
- G  Biznes rivojlanish (AdMob, Giveaway, Sponsorlik, A/B test)

---

## 🏁 Birinchi Sprint — Aniq Vazifalar va Natijalar

**Muddat:** ~2 hafta  
**Maqsad:** Baraqaror auth + profil + token + 6 miya o'yini ishga tushirish

### Sprint Vazifa Ro'yxati

| # | Vazifa | Mas'ul | Holat |
|---|---|---|---|
| S-1 | Telegram Session Isolation xatosini tuzatish | Backend | `[ ]` |
| S-2 | Enum muammolari (TokenTransaction, TestQuestion) | Backend | `[ ]` |
| S-3 | Rate limiting middleware faollashtirish | Backend | `[ ]` |
| S-4 | Admin endpoint JWT himoyasi | Backend | `[ ]` |
| S-5 | CSP header yoqish | Backend | `[ ]` |
| S-6 | Stroop o'yini stabilizatsiya (bug fix + UX) | Frontend | `[ ]` |
| S-7 | N-Back scaffold (UI + game loop) | Frontend | `[ ]` |
| S-8 | Dual Task scaffold | Frontend | `[ ]` |
| S-9 | Pattern Memory scaffold | Frontend | `[ ]` |
| S-10 | Quick Math scaffold | Frontend | `[ ]` |
| S-11 | Reaction Time scaffold | Frontend | `[ ]` |
| S-12 | Token balans CRUD (earn/spend/history) | Backend | `[ ]` |
| S-13 | Profil sahifasi (avatar, stats, daraja) | Frontend | `[ ]` |

### Definition of Done (Qabul qilish mezoni)

- [ ] Railway'ga deploy qilingan va 2 ta alohida Telegram akkaunt bilan sinab ko'rilgan
- [ ] Barcha 6 miya o'yini ochiladi va tugatiladi (hech bo'lmasa stub darajasida)
- [ ] Token balans to'g'ri hisoblanadi va DB'ga yoziladi
- [ ] Auth: boshqa sessiya eski tokenni bekor qiladi
- [ ] Admin endpointlar JWT'siz 401 qaytaradi
- [ ] `npm start` da hech qanday uncaught exception yo'q

### Test Gates (Tekshiruv darvozalari)

| Test | Kutilayotgan natija |
|---|---|
| 2 akkaunt bir vaqtda login | Har biri o'z sessiyasini oladi |
| Token sarflash (o'yin tugagach) | Balans kamayadi, `TokenTransaction` yoziladi |
| Admin route'ga token'siz murojaat | `401 Unauthorized` |
| Rate limit (60 req/min dan oshiq) | `429 Too Many Requests` |
| Stroop o'yini 3 marta o'ynash | Score DB'ga yoziladi, leaderboard yangilanadi |

---

## 📋 To'liq Bajarilish Cheklisti

### 🔴 FAZA 1: Kritik Xatolar (1 hafta)

- [ ] 1.1 Auth Bug — Telegram Session Isolation
- [ ] 1.2 Enum Muammolari (TokenTransaction, TestQuestion)
- [ ] 1.3 Obuna — Reklama O'chirish
- [ ] 1.4 Rate Limiting Qo'llash
- [ ] 1.5 Admin Endpoint Himoya
- [ ] 1.6 CSP Policy Yoqish
- [ ] TEST: Railway'ga deploy, 2 ta Telegram akkaunt bilan test

### 🟡 FAZA 2: UI/UX (5 kun)

- [ ] 2.1 Qo'sh Scroll — AI Chat
- [ ] 2.2 Chat State Tozalash
- [ ] 2.3 Subscription Period Toggle
- [ ] 2.4 Tablet Slider Responsiv
- [ ] 2.5 Stroop Bug (ANIQLASHTIRISH KERAK)
- [ ] 2.6 Loading/Error/Empty State
- [ ] 2.7 alert/confirm/prompt → Modal
- [ ] 2.8 Telegram WebApp API (BackButton, Haptic)
- [ ] TEST: Har ekranda 4 holat (loading/error/empty/success)

### 🟡 FAZA 3: Daraja, Monetizatsiya, Analytics (1 hafta)

- [ ] 3.1 "Brain Energy" Tizimi
- [ ] 3.2 Lavozim (Pagon) Vizualizatsiya
- [ ] 3.3 Yutuqlar (Achievements) Tizimi
- [ ] 3.4 Analytics — PostHog Integratsiya
- [ ] 3.5 Offerwalls — CPX Research
- [ ] TEST: PostHog'da eventlar ko'rinishi

### 🟢 FAZA 4: Yangi O'yinlar (2-3 hafta)

#### Miya O'yinlari (D1 — birinchi prioritet)

- [ ] 4.0 Stroop — Stabilizatsiya va to'liq bug fix _(Sprint 1'da boshlanadi)_
- [ ] 4.1 N-Back _(Sprint 1'da scaffold)_
- [ ] 4.2 Dual Task _(Sprint 1'da scaffold)_
- [ ] 4.3 Pattern Memory _(Sprint 1'da scaffold)_
- [ ] 4.4 Quick Math _(Sprint 1'da scaffold)_
- [ ] 4.5 Reaction Time _(Sprint 1'da scaffold)_

#### O'rganish O'yinlari (D2 — keyingi sprint)

- [ ] 4.6 Word Master
- [ ] 4.7 Tarix Quiz
- [ ] 4.8 Geografiya
- [ ] 4.9 Kod Challenge
- [ ] 4.10 Mantiqiy Jumboq

#### Kreativ O'yinlar (D3 — keyingi sprint)

- [ ] 4.11 Football Master — Match Simulyatsiyasi
- [ ] 4.12 Auto Tuning — SVG Configurator
- [ ] 4.13 Fashion — Layer-Based Dress-Up

### 🔵 FAZA 5: Cross-Platform va Kontent (1 hafta)

- [ ] 5.1 Real Icon Dizayn
- [ ] 5.2 Real Musiqa URL (Pixabay API / CDN)
- [ ] 5.3 DTM Savollar Chuqurlashtirish (300+)
- [ ] 5.4 Desktop Responsive (3-column)
- [ ] 5.5 Push Notifications (Web Push)
- [ ] TEST: Lighthouse score 90+

### 🚀 FAZA 6: Biznes Rivojlanish (Doimiy)

- [ ] 6.1 AdMob Integratsiya (PWA standalone)
- [ ] 6.2 Haftalik Giveaway Tizimi
- [ ] 6.3 Direct Sponsorship Mediakit
- [ ] 6.4 A/B Testing Infrastrukturasi
- [ ] TEST: 10 ta brendga cold outreach

### ✅ FINAL TEST (Hamma Faza Tugagandan Keyin)

- [ ] 3 ta turli qurilmada test (telefon, tablet, desktop)
- [ ] 5 ta real user beta test
- [ ] 24 soat monitor (errors, crashes)
- [ ] Production deploy (Railway)
- [ ] Telegram Bot @BotFather'da publish
- [ ] PostHog'da 1 haftalik metrikalar

---

## 🔗 Foydali Havolalar

| Hujjat | Maqsad |
|---|---|
| [`DEPLOY.md`](../DEPLOY.md) | Railway deployment yo'riqnomasi |
| [`PWA.md`](../PWA.md) | PWA va offline mode yo'riqnomasi |
| [`README.md`](../README.md) | Loyiha haqida umumiy ma'lumot |

---

_Har bir commit bilan tegishli `[ ]` → `[x]` ga o'zgartiring. Shu tarzda jamoaning hamma a'zosi real vaqtda progress ko'radi._
