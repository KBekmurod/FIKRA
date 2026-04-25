# FIKRA — E2E Test Checklist

To'liq test bosqichlari Railway da deploy qilingandan keyin Telegram botda bajariladi.

---

## 1. Pre-deploy tekshiruvlar (lokal)

```bash
# Sintaksis
node --check src/app.js
for f in src/services/*.js src/routes/*.js public/js/*.js; do node --check "$f"; done

# Ma'lumotlar bazasi seed
node src/utils/seedQuestions.js
# Kutilgan: "155 ta savol yuklandi"
```

---

## 2. Railway Deploy

- [ ] GitHub ga push qilish
- [ ] Railway.app → New Project → GitHub repo
- [ ] Environment variables qo'shilgan (pastdagi ro'yxat)
- [ ] Deploy muvaffaqiyatli bajarildi
- [ ] HTTPS URL olindi (`https://your-app.up.railway.app`)
- [ ] `/health` endpoint javob beradi

### Environment Variables checklist

```
BOT_TOKEN=<telegram>
MONGODB_URI=<atlas>
JWT_SECRET=<32+ chars>
JWT_REFRESH_SECRET=<32+ chars>
DEEPSEEK_API_KEY=<key>
GEMINI_API_KEY=<key>
FAL_API_KEY=<key>
ADSGRAM_BLOCK_ID=<id>
ADSGRAM_SECRET=<secret>
STARS_WEBHOOK_SECRET=<secret>
BOT_USERNAME=fikraai_bot
NODE_ENV=production
ENABLE_CRON=true
FRONTEND_URL=https://your-app.up.railway.app
```

---

## 3. @BotFather sozlamalar

- [ ] `/mybots` → bot tanlash → **Bot Settings**
- [ ] **Payments → Enable Stars** ✅
- [ ] **Menu Button** → URL: `https://your-app.up.railway.app`
- [ ] **Configure Mini App** → bir xil URL

---

## 4. Auth xavfsizligi (ENG MUHIM!)

### 4.1 Bir foydalanuvchi rejimi
- [ ] Telegram dan botga `/start`
- [ ] WebApp ochiladi
- [ ] Yuklanish ekranidan keyin **o'z ismingiz** ko'rinadi (boshqa user emas)
- [ ] DevTools Console: `[Auth] User OK Telegram ID: <sizning ID>`

### 4.2 Boshqa user testi (asosiy muammo)
- [ ] **Boshqa Telegram akkaunti** bilan kiring
- [ ] WebApp ochiladi
- [ ] **O'z ismingiz** ko'rinadi (oldingi userning emas!)
- [ ] **0 token bilan boshlanadi** (yangi user)
- [ ] Console: `[Auth] User ID mismatch` xabari yo'q

### 4.3 Token tozalash
- [ ] LocalStorage da `fikra_token`, `fikra_user_tg_id` mavjud
- [ ] Boshqa user kirganida bu maydonlar tozalanadi va yangidan yoziladi

---

## 5. Bosh sahifa

- [ ] Bosh sahifa yuklanadi, profilda ism ko'rinadi
- [ ] Token soni ko'rinadi
- [ ] Streak (kunlik bonus) belgisi ishlaydi
- [ ] Slider 3 slaydli (statik / musiqa / turnir)
- [ ] **Slider swipe** chap-o'ng ishlaydi (touchscreen)
- [ ] **Slider autoplay** har 5s da o'zgaradi
- [ ] Leaderboard (top 5) yuklanadi
- [ ] Tournament banner dinamik ma'lumot ko'rsatadi

---

## 6. Stroop o'yini

- [ ] Stroop ga kirish — birinchi marta **tutorial modal** chiqadi
- [ ] "Tushundim, boshlash" bosgach o'yin boshlanadi
- [ ] **15 sekund** taymer
- [ ] To'g'ri javob: yashil rang + haptic feedback
- [ ] Noto'g'ri javob: qizil + to'g'ri variant ham yashilda
- [ ] 3 xato yoki vaqt tugagach **natija ekrani** chiqadi
  - [ ] Score, best score, accuracy
  - [ ] Token ko'rinadi
  - [ ] XP ko'rinadi
  - [ ] 3 ta tugma: Reklama / Qayta o'ynash / Chiqish
- [ ] **Qayta o'ynash** ishlaydi
- [ ] **Reklama ko'rish** + token tushadi
- [ ] localStorage da `fikra_stroop_best` saqlangan

---

## 7. DTM Test

- [ ] Test bo'limi ochiladi
- [ ] Majburiy fanlar: O'zbek, Matematika, Tarix
- [ ] Mutaxassislik fanlar: 6 ta tanlash
- [ ] Har savol uchun **batafsil tushuntirish** (200+ belgi)
- [ ] To'g'ri/noto'g'ri javoblar hisoblanadi
- [ ] Test oxirida natija va token

---

## 8. AI xizmatlar

### 8.1 AI Chat
- [ ] AI Chat ga kirib xabar yozish
- [ ] DeepSeek javob beradi
- [ ] **Token tushadi** (5t/xabar)
- [ ] **Bitta scroll** (qo'sh scroll yo'q!)
- [ ] Yangi chat boshlash (`uiConfirm` modal)
- [ ] Eski chatlar tarixda saqlangan
- [ ] Chat tarixi paneliga o'tib, eski chatga qaytish

### 8.2 Hujjat yaratish
- [ ] DOCX/PDF/PPTX format tanlash
- [ ] Yuklab olish ishlaydi (10t)

### 8.3 Rasm yaratish
- [ ] Gemini orqali rasm chiqadi (30t)
- [ ] Olingan rasmlar tarixda saqlanadi

---

## 9. Yangi o'yinlar

### 9.1 Avto Tuning
- [ ] Boshlang'ich Lada bepul beriladi
- [ ] **SVG mashina rasmi** chiziladi (rang, tuning ko'rinadi)
- [ ] Tuning daraja oshirish — token tushadi, qiymat ortadi
- [ ] **Rang o'zgartirish** — 7 ta rangdan biri (50t)
- [ ] Spoiler ≥ 2 da SVG ga spoiler chiqadi
- [ ] Paint ≥ 3 da gloss effekti
- [ ] Engine ≥ 4 da olov effekti
- [ ] Do'kondan yangi mashina sotib olish (token sarflash)
- [ ] **Bozorga sotish** — narx kiritish
- [ ] Bozordan sotib olish — 3% soliq olinadi

### 9.2 Fashion Design
- [ ] Boshlang'ich klassik libos
- [ ] **SVG outfit** rasmi (top + bottom + shoes ranglarda)
- [ ] Dizayn qilish — rang o'zgartirish (100t)
- [ ] Yangi uslub sotib olish (Sport/Bohem/Casual/Formal)
- [ ] Bozor — sotish/sotib olish

### 9.3 Football Master Liga
- [ ] **Klub tanlash** modali (8 klub)
- [ ] Jamoa tuziladi (4 starter o'yinchi)
- [ ] **Jamoa reytingi** ko'rinadi
- [ ] **Bot bilan o'ynash** tugmasi → bet kiritish
- [ ] O'yin natijasi: 90 daqiqa, gollar, kartochkalar
- [ ] G'alaba: 1.8x token qaytadi
- [ ] Durang: 0.5x
- [ ] Mag'lubiyat: 0
- [ ] Stat upgrade — har +1 ga 200t
- [ ] Player SVG karta — pozitsiya rangi, stat barlari

---

## 10. Iqtisod

### 10.1 Obuna
- [ ] 6 plan ko'rinadi (Basic/Pro/VIP/Business/Pro Premium/Business Pro)
- [ ] Telegram Stars to'lov modali ochiladi
- [ ] Test rejimida obuna bekor qilinishi mumkin
- [ ] Obunadan keyin tier yangilanadi

### 10.2 Token paketlar
- [ ] 4 paket (50/200/500/1500 token)
- [ ] Stars orqali sotib olish

### 10.3 Reklama mantiqi (KRITIK!)
- [ ] **Free user:** reklama chiqadi, token oladi
- [ ] **Basic:** rewarded reklama bor, interstitial yo'q
- [ ] **Pro/VIP/Business:** **reklamasiz** — to'g'ridan-to'g'ri 5t bonus
- [ ] **Pro user kuniga 5 marta** premium bonus oladi
- [ ] AdsEvent jadvalida log saqlangan

### 10.4 Bozor solig'i
- [ ] Sotuvchi 97% oladi
- [ ] 3% biznes foyda saqlandi

---

## 11. Daraja tizimi

- [ ] XP yig'ilganda profilda progress bar oshadi
- [ ] Lavozim oshganda **level up animatsiyasi**
- [ ] 8 lavozim: Urug' → Uyg'ongan → Elektr → Sehrgar → Creative → Dragon → Galaktika → Imperator
- [ ] Streak multiplier (7+ kun = 2x XP)

---

## 12. Turnir

- [ ] Haftalik XP turniri ko'rinadi
- [ ] Reyting yangilanadi (real vaqtda)
- [ ] Qolgan vaqt to'g'ri ko'rinadi
- [ ] Yakshanba 23:59 da turnir tugaydi
- [ ] Dushanba 00:05 da prize beriladi (cron)

---

## 13. Musiqa

- [ ] Musiqa modal ochiladi
- [ ] **Binaural to'lqin** generate bo'ladi (Web Audio API)
- [ ] **Naushnikda** ikki quloqqa har xil chastota keladi
- [ ] Volume slider ishlaydi
- [ ] Pause/Play tugma
- [ ] Pro/VIP user uchun premium treklar ochiq
- [ ] Free user uchun faqat 4 trek

---

## 14. PWA + Responsive

- [ ] HTTPS da kirish (Railway avtomatik)
- [ ] **Manifest yuklanadi** (`/manifest.json`)
- [ ] **Service Worker faol** (DevTools → Application)
- [ ] **3 marta kirgandan keyin** "Yuklab oling" banner chiqadi
- [ ] **Install** tugmasi — home screen ga qo'shadi
- [ ] **Apple touch icon** to'g'ri ko'rinadi (180x180 PNG)
- [ ] Favicon brauzerda ko'rinadi

### Responsive testlar
- [ ] **Mobile (375px):** default, normal
- [ ] **Tablet (768px):** kattaroq typography, 600px max-width
- [ ] **Desktop (1200px+):** 3 ustun grid layout
- [ ] **Landscape orientation:** scrollable
- [ ] **360px (kichik telefon):** kichikroq tugmalar

---

## 15. UI sifat

- [ ] **Native confirm/prompt yo'q** — barchasi `uiConfirm`/`uiPrompt`
- [ ] **Escape tugmasi** modallarni yopadi
- [ ] **Haptic feedback** ishlatiladi (Telegram ichida)
- [ ] **Toast bildirishnomalar** — har action uchun
- [ ] **Inputmode** chat va form da to'g'ri

---

## 16. Xavfsizlik

- [ ] Telegram HMAC-SHA256 server-side verifikatsiya
- [ ] JWT 24 soat amal qiladi
- [ ] Refresh token bilan yangilanish
- [ ] Boshqa user kirsa avtomatik tozalanadi
- [ ] XSS himoya (`_escapeHtml` har joyda)
- [ ] Adsgram secret server da tekshiriladi
- [ ] Stars webhook secret tasdiqlanadi
- [ ] Token operatsiyalari atomic
- [ ] Rate limit AI/ads endpointlarda

---

## 17. Performance

- [ ] Bosh sahifa < 3 soniya yuklanadi
- [ ] Service Worker static fayllarni cache qiladi
- [ ] API javoblari < 1 soniya
- [ ] Music modal binaural ~200ms da boshlanadi

---

## 18. Bug topilganda

Har bug uchun:
1. Console log saqlash (DevTools → Console)
2. Network tab dagi xato so'rov (status code)
3. Reproduce qilish bosqichlari
4. Issue.md fayliga yozish

---

## Eng muhim 3 ta E2E test

1. **Auth muammosi tuzatildi** (siz qayd etgan asosiy muammo) — boshqa user kirsa, profil sizga emas — o'ziga ochiladi
2. **Pro user reklamasiz** — Pro/VIP/Business obuna olganda reklama umuman chiqmaydi
3. **Football match ishlaydi** — bet qilib o'ynash mumkin, real natija olinadi

---

## Foydalanuvchi tajribasi (UX) testi

Bu — texnik test emas, balki **insoniy** test:

- [ ] Yangi user 1 daqiqa ichida birinchi token oladi
- [ ] 5 daqiqada birinchi o'yin (Stroop yoki test) tugatadi
- [ ] 10 daqiqada Avto tuning va birinchi o'zgartirishni qiladi
- [ ] 30 daqiqada — qaytib keladi va ko'proq foydalanadi (qiziqish)

Asosiy savol: **"Bot bilan birinchi tanishganidan keyin foydalanuvchi qaytarilgan o'yin/xizmat o'ynashga undaladigan biror narsa bormi?"**

Javob bor bo'lsa — loyiha muvaffaqiyatli.
