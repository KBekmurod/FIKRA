# FIKRA v2.0 — Deploy yo'riqnomasi

## Environment Variables (Railway)

```bash
# === MAJBURIY ===
BOT_TOKEN=<telegram_bot_token>
MONGODB_URI=<mongodb_atlas_connection_string>
JWT_SECRET=<kamida_32_ta_random_belgi>
JWT_REFRESH_SECRET=<kamida_32_ta_boshqa_random_belgi>
NODE_ENV=production
FRONTEND_URL=https://your-app.railway.app
PORT=3000
BOT_USERNAME=fikraai_bot

# === AI API (kamida bittasi bo'lishi kerak) ===
DEEPSEEK_API_KEY=<deepseek_key>       # Chat, Hujjat, Hint uchun
GEMINI_API_KEY=<gemini_key>           # Rasm, Kaloriya uchun

# === TO'LOV ===
STARS_WEBHOOK_SECRET=<webhook_secret>  # /api/sub/activate uchun
```

## Deploy qadamlari

### 1. Railway

```bash
git push origin main
```

Railway avtomatik deploy qiladi.

### 2. MongoDB seed (bir marta)

Railway → Shell:
```bash
node src/utils/seedQuestions.js
```

### 3. Telegram Bot sozlash

@BotFather:
```
/setmenubutton — FIKRA → https://your-app.railway.app
/setdomain — your-app.railway.app
```

## Muammo: Qora ekran

Sabablari va yechimlar:

| Sabab | Yechim |
|-------|--------|
| `MONGODB_URI` noto'g'ri | Atlas'da connection string tekshiring |
| `BOT_TOKEN` noto'g'ri | @BotFather dan token oling |
| `FRONTEND_URL` https emas | Railway'da HTTPS bo'lishi kerak |
| `JWT_SECRET` yo'q | .env ga qo'shing |

Server logi tekshirish:
```bash
# Railway → Deployments → Logs
```
