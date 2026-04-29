# FIKRA v3.0 — Deploy yo'riqnomasi

## Texnik stek
- **Backend:** Node.js + Express + MongoDB
- **Frontend:** React + Vite + TypeScript
- **Deploy:** Railway (avtomatik build)

## Environment Variables (Railway)

### Majburiy
```bash
BOT_TOKEN=<telegram_bot_token>
BOT_USERNAME=fikraai_bot
MONGODB_URI=<mongodb_atlas>
JWT_SECRET=<32+ belgi random>
JWT_REFRESH_SECRET=<boshqa 32+ belgi>
NODE_ENV=production
FRONTEND_URL=https://your-app.railway.app
PORT=3000
```

### AI uchun
```bash
DEEPSEEK_API_KEY=sk-...     # Chat va Hujjat AI
GEMINI_API_KEY=AI...        # Rasm AI
```

### Obuna va Admin
```bash
STARS_WEBHOOK_SECRET=<random_string>    # Stars to'lov uchun
ADMIN_SECRET=<kuchli_parol>             # Admin panel kalit
ADMIN_USERNAME=<sizning_telegram_username>  # P2P to'lov uchun
ADMIN_TELEGRAM_IDS=<sizning_telegram_id>    # Bot komandalar uchun
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

### 6. Telegram Bot sozlash
@BotFather:
```
/setmenubutton — FIKRA → https://your-app.railway.app
/setdomain — your-app.railway.app
```

## URL'lar
- **Foydalanuvchi:** `https://your-app.railway.app` (Telegram WebApp)
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
    bot.js              # Telegram bot
    app.js              # Express app
  client/                # Frontend (React + Vite)
    src/
      pages/             # Sahifalar (4 ta)
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
