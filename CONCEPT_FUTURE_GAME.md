# 🎮 Sinxron-Taktik Futbol — Kelajak loyihasi (v2.0 yoki alohida brand)

> **Status:** G'oya bosqichida. FIKRA v1.0'ning asosiy maqsadi — abituriyent platformasi.
> Bu o'yin **alohida loyiha** sifatida ishlab chiqiladi (FIKRA ichidagi feature emas).

## Sabab — nega alohida?

1. **Audience farq qiladi:** abituriyent test yechishga keladi, futbol o'ynashga emas
2. **Texnologiya farq qiladi:** Deterministic netcode + real-time PvP + Canvas/Pixi.js — bu FIKRA backend bilan aralashtirilmaydi
3. **Brand farq qiladi:** "FIKRA" — o'qish/o'rganish, bu o'yin — kiber-sport/dam olish
4. **Resurs:** ikkala loyihani parallel qilish ikkalasini ham buzadi

---

## Asosiy g'oya: "Sinxron-Taktik Futbol"

**Janr:** Frozen Synapse + Haxball + Chess gibridi
**Tagline:** *"Boshqarish — juda oson. G'alaba — faqat daho uchun."*
**Format:** Online PvP, 3-5 daqiqa matchlar, mobile-first

### Mexanika: "Yashirin 3 Soniya"

1. **Rejalashtirish fazasi (30 sek)** — vaqt to'xtaydi:
   - Tepadan 2D ko'rinish (xuddi shaxmat)
   - O'yinchilar — dumaloq donalar (ichida pozitsiya piktogrammasi)
   - Barmoq bilan har futbolchining 3 soniyalik harakat yo'lini chizasan
   - **Raqib chizganini ko'rmaysan** (yashirin)
   - "Sharpa" rejimida o'z chizgan yo'lingni ko'rsatib turadi

2. **Harakat fazasi (3 sek)** — vaqt ishlaydi:
   - Ikkala reja bir vaqtda namoyon bo'ladi
   - Real fizika: to'qnashuv, pas, zarba
   - Slow-mo eng oxirgi 0.5 soniyada
   - Dynamic zoom xavfli vaziyatlarda

### Ritm: "30/3" formula → 10-12 raund → 3-5 daqiqa o'yin

---

## "Donalar" — futbolchi turlari

| Tur | Tezlik | Kuch | Maxsus |
|-----|--------|------|--------|
| **Tank** (himoya) | Sekin | Yuqori | To'qnashuvda yiqilmaydi, raqibni uchiradi |
| **Snayper** (yarim himoya) | O'rta | O'rta | Eng uzoq aniq pas/zarba |
| **Flesh** (hujum) | Juda tez | Past | Tezlikning cho'qqisida burilsa, yiqiladi |
| **Mag'lub** (bo'lajak) | — | — | Kelajakda yangi turlar qo'shiladi |

**Balans:** har jamoada faqat 1 ta Tank, 1 ta Flesh ruxsat etiladi (cheklov)

---

## Vizual: "Neon-Minimalizm"

- **Maydon:** to'q ko'k/qora fon, neon yashil chiziqlar
- **O'yinchilar:** dumaloq, ichida ikon, harakatda yorug'lik izi (Tron-style)
- **Hujum chizig'i:** olovrang neon
- **Himoya chizig'i:** muz moviy
- **To'p:** oq, "puls" urib turuvchi yorug'lik
- **Xato to'qnashuv:** qizil "X" belgisi

### Effektlar
- Screen shake — to'qnashuvda
- Slow-mo — gol/yaqin lahzada
- Dynamic zoom — to'p xavfli zonada
- Confetti + maydon rang almashishi — gol urilganda
- "Outsmarted!" / "Ankle Breaker!" yozuvi — muvaffaqiyatli aldash

---

## Psixologik mexanika ("narkotik" effekt)

### Asosiy formula
**90% mahorat + 10% "futbol xudosi" (omad)**

### Near-miss (ozgina qolish)
- To'p ustunga tegib qaytishi
- Darvozabon to'pni chiziq ustida to'xtatishi
- "Eh, ozgina qoldi" → "yana bir marta" → cheksiz sikl

### "Pseudo-luck" (sabab-natija omad)
- Flesh tezligida burilsa → yiqilish ehtimoli ortadi (matematik, lekin o'yinchi xatosidan)
- Tank ustma-ust 2 marta to'qnashsa → biroz sekinlashadi

### Drama generator
- Ikki o'yinchi to'pga bir vaqtda yugurib, to'p havoga sapchib uchinchi o'yinchiga tushishi
- Bu lahzalar avto-GIF qilinadi → ijtimoiy tarmoqlarga ulashish
- Bu **bepul reklama**

---

## Progressiya — "Status drive"

**Pay-to-Win EMAS, Play-to-Style:**
- Yangi xarakterlar — g'alaba orqali ochiladi
- Skin'lar (oltin Tank, olovli Flesh, neon to'p) — kosmetika, balansga ta'sir qilmaydi
- Reyting (MMR) — 1000 dan boshlab, "Grossmeyster" 2500+
- Lokal/global leaderboard

**Draft tizimi:**
- Match boshlanishidan oldin paluba (kolleksiya) yig'iladi
- Maydonda 5 yoki 7 futbolchi
- Raqib palubasi noma'lum → "blöf" elementi

---

## Texnik talablar (kelajakda yozish kerak)

### Backend
- Node.js + Socket.io (yoki uWebSockets) — real-time PvP
- **Deterministic physics engine** — Box2D yoki o'z yozma (kichik scope)
- Matchmaking server — Elo bo'yicha
- Replay storage — har match'ning input log'i (gif uchun)
- Postgres yoki MongoDB — user, MMR, kolleksiya

### Frontend
- **Pixi.js** (asosiy tavsiyam) yoki Phaser
- Chizish: `pointer events`, Bezier kursivlari
- Sound: Howler.js (ASMR effektlari, gol nag'masi)
- Mobile-first, landscape/portrait ikkalasi

### Netcode
- **Lockstep** model — ikki klient bir xil natija olishi shart
- Input validation server-side
- Anti-cheat: serverda fizika qayta hisoblanadi
- Latency < 80ms, ideal

### Monetizatsiya (kelajakda)
- Battle Pass (sezonli skin'lar)
- Premium account (replay HD, custom emoji, priority matchmaking)
- **Pay-to-Win taqiqlanadi** — bu o'yin qadrini yo'qotadi

---

## MVP (eng kichik ishlovchi versiya)

1. ✅ 1 vs 1 PvP
2. ✅ 1 maydon (klassik)
3. ✅ 3 turdagi futbolchi (Tank, Snayper, Flesh)
4. ✅ Har jamoada 5 ta o'yinchi (3 ta tur tanlash)
5. ✅ Real-time match (deterministik fizika)
6. ✅ Reyting (Elo)
7. ✅ Replay GIF avto-yaratish

**MVP'dan keyin:**
- Yangi maydonlar (kichik, devorli, devorsiz)
- Yangi xarakterlar
- Klan/team rejimi (3 vs 3)
- Turnir tizimi
- Push notification ("Raqibing topildi")

---

## Risk va e'tirozlar

| Risk | Yechim |
|------|--------|
| Deterministik fizika qiyin | Box2D Lite, lockstep, 30 FPS fixed |
| Matchmaking bo'sh (kam o'yinchi) | AI bot fallback faqat trial uchun |
| Cheating | Server-authoritative simulation |
| Balans (Tank > hammasi) | A/B test, har 2 hafta tweak |
| Cho'zilgan match → zerikish | Maks 12 raund (3-5 min) hard limit |

---

## Yo'l xaritasi

```
Faza 1 (1-2 oy):  Prototip — chizish, fizika, 1 vs 1 lokal
Faza 2 (2-3 oy):  Multiplayer — Socket.io, lockstep
Faza 3 (1 oy):    UI/UX polish — neon vizual, sound, animatsiya
Faza 4 (1 oy):    Beta — Telegram'dan 100-500 odam test
Faza 5 (2 oy):    Release — App Store, Google Play, web
```

**Jami: 7-9 oy MVP gacha (1 dasturchi)** yoki **3-4 oy (kichik jamoa)**.

---

## Yakuniy qaror

> **Hozir:** FIKRA v1.0 abituriyent platformasi sifatida tugatiladi.
> **Keyin:** Bu g'oya alohida loyiha sifatida boshlanadi.
> **Brand nomi:** keyinroq tanlanadi (masalan, "Pitch IQ", "Mind Pitch", "Sinxron").

Bu g'oyani saqlashning sababi — u haqiqatan ham noyob va yaxshi yo'lga qo'yilsa indie xit bo'lishi mumkin.
Lekin uni **FIKRA bilan aralashtirish ikkala loyihani ham buzadi**.
