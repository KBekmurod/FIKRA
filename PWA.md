# FIKRA PWA Yo'riqnoma

## Nima bu?

FIKRA endi PWA (Progressive Web App) bo'lib, foydalanuvchilar:

1. **Brauzerdan** kiradilar (Chrome, Safari, Firefox)
2. Ilovani **telefoniga/kompyuteriga yuklashlari** mumkin
3. **Offline** ham oddiy sahifalar ishlaydi

## Qanday ishlaydi?

### Foydalanuvchi uchun

**Telegram orqali** (eng oson):
- Botdan `/start` bosib WebApp ochadi
- Hamma joyda ishlaydi

**Brauzer orqali (PWA)**:
1. `https://your-fikra.app` ga kirsin
2. 3 marta kirgandan keyin "📱 FIKRA ni yuklab oling" banner chiqadi
3. "Yuklash" tugmasini bosgach — home screen ga qo'shiladi
4. Telegram tashqarisida ham ishlaydi (faqat login shart)

### Developer uchun

**Railway deploy:**
1. Avtomatik HTTPS (PWA shart)
2. Service Worker `/service-worker.js` da
3. Manifest `/manifest.json` da

**Icon fayllar:**
- `public/icons/icon.svg` — asosiy logo (SVG)
- `public/icons/icon-192.png` — placeholder (real PNG bilan almashtiring)
- `public/icons/icon-512.png` — placeholder

**Real PNG yaratish uchun:**

Variant 1 — onlayn:
- https://realfavicongenerator.net ga SVG yuklang
- PNG lar yuklab oling
- `public/icons/` ga joylang

Variant 2 — terminal (librsvg bilan):
```bash
rsvg-convert -w 192 -h 192 icon.svg -o icon-192.png
rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
```

Variant 3 — Figma/Sketch dan eksport qilish.

## Offline strategiya

| Fayl turi | Strategiya |
|---|---|
| HTML, CSS, JS | Cache-first (tez) |
| API (`/api/...`) | Network-first (aniq) |
| Tashqi CDN (Telegram, Adsgram) | By-pass (direkt) |
| Navigatsiya offline | `/index.html` fallback |

## Responsive breakpointlar

| Ekran | Breakpoint | Layout |
|---|---|---|
| Telefon | 360-480px | Default (1 ustun) |
| Planshet | 768px+ | Kattaroq typography, 600px max-width |
| Desktop | 1200px+ | 3 ustun grid (sidebar + main + aside) |

## Tekshirish

1. **Lighthouse audit** — Chrome DevTools → Lighthouse → Progressive Web App
2. **DevTools Application tab** → Manifest + Service Workers
3. **Offline test** — Network tabda "Offline" ga tushirib sinab ko'ring

## Push bildirishnomalar

Hozir faqat `service-worker.js` da asos bor. Push yuborishga server-side VAPID kalitlari kerak. Keyinchalik qo'shiladi.
