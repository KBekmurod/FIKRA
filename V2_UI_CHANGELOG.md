# FIKRA 2.0 — Yangi UI/UX o'zgarishlari

## 🗂 Navigatsiya — 6 ta tugma (ikona + yozuv)

```
🏠 Asosiy · 🏛 Ombor · 📝 Testlar · 📚 Tarix · 🤖 AI · 👤 Profil
```

## 📊 Daraja tartibi yangilandi

| Versiya | Daraja | Rang |
|---------|--------|------|
| 1, 2, 3 | **DELTA** (boshlang'ich) | 🔵 Ko'k |
| 4, 5, 6, 7 | **BETA** (o'rta) | 🟢 Yashil |
| 8, 9, 10 | **ALFA** (yuqori) | 🟡 Oltin |

Daraja ko'rinishi: ASOSIY sahifada (aylanma grafik) + PROFIL ichida statistika.

## 🏛 OMBOR (yangi markaziy bo'lim)

Materiallar yig'iladi → AI test generate qiladi → testlar **Testlar → AI testlarim**
bo'limiga joylanadi → ishlangan testlar **Tarix → AI testlarim tarixi** ga saqlanadi.

3 xil ma'lumot yuklash:
- **Matn** (copy-paste, 25–30K belgi)
- **Rasm** (OCR, 3 MB, .jpg/.jpeg/.png)
- **Fayl** (PDF/DOCX/PPTX, 5–7 MB, 20 sahifagacha)

## 📝 TESTLAR

```
TESTLAR
├── A2) 🤖 AI testlarim (chap)        — ombor testlari
└── A1) 🎓 FIKRA testlari (o'ng)      — DTM standart
    ├── B1) 🎯 Maxsus blok testlar
    │   ├── Tayyor yo'nalish (Muhandislik, Tibbiyot, ...)
    │   └── Alohida 2 fan tanlash
    └── B2) 📚 Erkin tanlov
        └── Majburiy + Mutaxassislik aralash
```

### Test yakuni — 3 ta karta
1. **📊 Natijalarni ko'rish** (fan bo'yicha breakdown + pagination)
2. **🎯 Xatolar bilan rivojlanish** (kontekstli AI tushuntirish)
3. **📚 Tarixga saqlandi**

### Kontekstli AI tushuntirish (4 ta rangli karta)
- 📍 **MAVZU** (ko'k)
- 🧠 **NEGA TO'G'RI?** (yashil)
- ⚠️ **CHALG'ITUVCHI USULLAR** (sariq)
- 💡 **XULOSA** (binafsha)

## 🛡 Test xavfsizlik mexanikasi

- Test ichidan boshqa tabga o'tilsa → **modal so'rovi**:
  > "Test to'liq yakunlanmagan. Chiqsangiz natija saqlanmaydi"
- Brauzer/ilova yopilsa → avtomatik **abandoned** (sendBeacon orqali)
- Faqat to'liq tugatilgan test tarixga saqlanadi

## 🔒 1-marotaba qoidalari (bitta test uchun)

- **AI tushuntirish** — har fan uchun **1 marta**
- **Mini-test** generatsiyasi — **1 marta**
  - Majburiy fan: 5 ta savol
  - Mutaxassislik: 15 ta savol
- Limit yetganda yo'l-yo'riq xabar (token tejash)

## 🏠 ASOSIY sahifa

### Mehmon foydalanuvchi uchun
- **TOP**: Kreativ hero (slogan + brending)
- **MAIN**: Ilova imkoniyatlari (5 ta xususiyat)
- **BOTTOM**: Yuklab olish tugmasi yoki Telegram link

### Ro'yxatdan o'tgan foydalanuvchi
- **TOP**: Salomlashish + Aylanma daraja grafigi (foiz bilan)
- **MAIN**: 4 ta menyu karta (Ombor · Testlar · Tarix · AI)
- **BOTTOM**:
  - Agar ilova o'rnatilmagan → yuklab olish
  - Agar o'rnatilgan → 🕓 Oxirgi amaliyat (testdan davom ettirish)

## 📚 TARIX

2 ta tab:
- **🎓 FIKRA testlari** (Maxsus blok + Erkin tanlov)
- **🤖 AI testlarim** (Ombor testlari)

Pagination — "Yana ko'rsatish" tugmasi bilan.

## 🤖 AI bo'limi (Umumiy)

- Chat / Hujjat / Rasm (3 ta tab)
- Chat **tarixi localStorage'da saqlanadi** (foydalanuvchi davom ettira oladi)
- Tozalash tugmasi bilan boshqaruv
- Bu bo'lim **testlarga yo'naltirilmagan** — umumiy ishlatiladi

## 👤 PROFIL

- Foydalanuvchi karta (ism, plan badge)
- PWA o'rnatish banner (agar mumkin bo'lsa)
- Obuna boshqaruvi
- AI limitlar (kunlik)
- Material limitlari (kunlik)
- **📊 Daraja statistikasi** (Delta/Beta/Alfa + 3 ta ko'rsatkich)
- Referral havola

## 🎨 Vizual o'zgarishlar

- **FIKRA logosi**: `Syne` shrifti (800 weight, siz so'raganidek)
- **Aylanma daraja grafigi**: SVG bilan
- **Rangli kontekstli kartalar**: ko'k, yashil, sariq, binafsha
- **Segmented tabs**: pill style
- **Sticky bottom panel**: Erkin tanlov natijasi uchun
