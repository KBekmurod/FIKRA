# FIKRA v8.0 — Deploy yo'riqnomasi

## Texnik stek
- **Backend:** Node.js + Express + MongoDB
- **Frontend:** React + Vite + TypeScript
- **Auth:** Email yoki telefon nomer + parol (Telegram, Google yo'q)
- **Deploy:** Railway (avtomatik build)

## Environment Variables (Railway)

### Majburiy
```bash
MONGODB_URI=<mongodb_atlas>
JWT_SECRET=<32+ belgi random>
JWT_REFRESH_SECRET=<boshqa 32+ belgi>
NODE_ENV=production
FRONTEND_URL=https://your-app.railway.app
PORT=3000
```

### AI uchun
```bash
DEEPSEEK_API_KEY=sk-...     # Chat, test va Hujjat AI
GEMINI_API_KEY=AI...        # Rasm AI
```

### Admin
```bash
ADMIN_SECRET=<kuchli_parol>             # Admin panel kalit
ADMIN_USERNAME=<telegram_username>      # P2P to'lov uchun (foydalanuvchi admin'ga yozadi)
```

## Deploy

### 1. Railway loyiha yarating
- railway.app → New Project → Deploy from GitHub repo

### 2. Variables qo'shing (yuqoridagi list)

### 3. MongoDB Atlas
- Cluster yarating (free tier)
- Database User yarating
- Network Access → 0.0.0.0/0 (Railway IP avtomatik aniqlanadi)
- Connection String'ni `MONGODB_URI` ga qo'ying

### 4. Auto Deploy
Railway o'zi:
1. `npm install` qiladi
2. `cd client && npm install && npm run build` qiladi (frontend → /public)
3. `node src/app.js` ishga tushiradi

### 5. Test savollarini yuklash (bir marta)
Railway Shell:
```bash
npm run seed
```

## URL'lar
- **Foydalanuvchi:** `https://your-app.railway.app` (web yoki PWA)
- **Admin Panel:** `https://your-app.railway.app/admin`
- **Health Check:** `https://your-app.railway.app/health`

## Lokal ishlatish

### Backend
```bash
npm install
npm run dev   # nodemon
```

### Frontend (alohida terminal)
```bash
cd client
npm install
npm run dev   # http://localhost:5173 (proxy → backend:3000)
```

## Fayl tuzilishi
```
fikra/
  src/                   # Backend (Express)
    models/              # Mongoose schemas
    routes/              # API endpointlar
    services/            # Biznes logika
    middleware/          # Auth, rate limit
    utils/               # Helper funksiyalar
    app.js               # Express app
  client/                # Frontend (React + Vite)
    src/
      pages/             # Sahifalar
      components/        # UI komponentlar
      api/               # API client
      store/             # Zustand state
      types/             # TypeScript tiplar
  public/                # Build natijasi (Vite chiqaradi)
    index.html
    admin.html
    assets/
  package.json
  nixpacks.toml          # Railway config
```

## Autentifikatsiya

FIKRA faqat **email yoki telefon nomer + parol** orqali ishlaydi:
- Roʻyxatdan oʻtish: foydalanuvchi email YOKI telefon nomer tanlaydi
- Kirish: bitta input maydoniga email yoki telefon kiritadi (tizim oʻzi aniqlaydi)
- Parol: kamida 8 belgi
- Telefon format: `+998 90 123 45 67` (avtomatik normalize)

JWT token (1 soat) + Refresh token (7 kun) ishlatiladi.
