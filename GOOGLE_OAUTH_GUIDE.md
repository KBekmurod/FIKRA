# 🔐 Google OAuth Integration Guide

## Overview
FIKRA loyihasi endi **Google OAuth 2.0** orqali ro'yxatdan o'tish va kirishni qo'llab-quvvatlaydi. Bu abituriyentlarga email orqali tezkor kirishni imkon beradi.

## Setup Instructions

### 1️⃣ Google Cloud Project Setup

#### Google Cloud Console'da project yaratish:
1. [Google Cloud Console](https://console.cloud.google.com) ga kiring
2. "Select a Project" → "New Project" bosing
3. Project nomi: `FIKRA DTM Platform`
4. Create bosing

#### OAuth 2.0 Credentials setup:
1. **APIs & Services** → **Credentials** ga kiring
2. **+ CREATE CREDENTIALS** → **OAuth client ID** bosing
3. Agar "Consent Screen" sozla taklif qilsa:
   - **OAuth consent screen** bosing
   - User type: **External** tanlang
   - Kerakli ma'lumotlarni to'ldiring (app nomi, email, qo'llab-quvvatlash URL)
4. Keyin yana Credentials ga qaytib, **OAuth client ID** yarating:
   - Application type: **Web application**
   - Name: `FIKRA Web Client`
   - **Authorized JavaScript origins** qo'shing:
     - `http://localhost:5173` (local dev)
     - `http://localhost:3000` (alternative local)
     - `https://fikra.uz` (production)
     - `https://your-app.railway.app` (Railway production)
   - **Authorized redirect URIs** qo'shing:
     - `http://localhost:5000/api/auth/google-callback` (local backend)
     - `https://your-app.railway.app/api/auth/google-callback` (production backend)
5. Save qilib, **Client ID** va **Client Secret** nusxasini oling

### 2️⃣ Backend Setup

#### Environment variables qo'shish (.env file):
```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

#### Install dependencies:
```bash
npm install google-auth-library
```

#### Backend already configured:
- ✅ User model'ga `googleId` va `email` fields qo'shildi
- ✅ `/api/auth/google` endpoint implemented
- ✅ Token verification va user creation logic qilindi

### 3️⃣ Frontend Setup

#### Frontend environment variables (.env.local):
```bash
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

#### Install dependencies:
```bash
npm install @react-oauth/google
```

#### Frontend already configured:
- ✅ `App.tsx`'ga `GoogleOAuthProvider` qo'shildi
- ✅ `AuthPage.tsx`'da Google Sign-In button ishlashda
- ✅ API endpoint `authApi.googleLogin()` implemented

### 4️⃣ How It Works

#### Frontend Flow:
```
1. Abituriyent AuthPage'da Google tugmasini bosadi
2. Google login modal paydo bo'ladi
3. Tayyor bo'lgach, JWT token qaytariladi
4. Frontend bu tokenni backend'ga yuboradi: POST /api/auth/google
5. Backend Google'dan token tasdiqlaydi
6. User database'da yangi yoki mavjud bo'lsa shu user login bo'ladi
7. Backend accessToken + refreshToken qaytaradi
8. Frontend tokens saqlab, app'ga kiritadi
```

#### Backend Security:
```typescript
// Google token verification (backend)
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const ticket = await client.verifyIdToken({
  idToken: token,
  audience: GOOGLE_CLIENT_ID,
});

// Payload dekodlash
const { sub, email, given_name, family_name, picture } = ticket.getPayload();

// User creation/update logic
// - Agar googleId bilan user mavjud → login
// - Agar email bilan user mavjud → googleId qo'shib login
// - Aksincha → yangi user yaratish
```

### 5️⃣ Database Schema

#### User model'ga qo'shilgan fields:
```javascript
{
  googleId: String,        // Google sub ID (unique)
  email: String,           // Google email (unique)
  googleName: String,      // "FirstName LastName"
  firstName: String,       // Synchronized from Google
  lastName: String,        // Synchronized from Google
  photoUrl: String,        // Google profile picture
  // ... qolgan fields ...
}
```

### 6️⃣ Testing

#### Local Development:
```bash
# Backend
npm install
npm run dev
# Listens: http://localhost:5000

# Frontend (new terminal)
cd client
npm install
npm run dev
# Listens: http://localhost:5173
```

#### Test Steps:
1. `http://localhost:5173` ga kiring
2. Auth page'da Google button ko'ring
3. Google accountingiz bilan login qiling
4. `http://localhost:5000/api/auth/me` da user data ko'rasiz

### 7️⃣ Production Deployment

#### Railway/Vercel setup:
1. Environment variables qo'shish (secrets):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `VITE_GOOGLE_CLIENT_ID`

2. Google Cloud'da production origin qo'shish:
   - Authorized JS Origins: `https://your-app.railway.app`
   - Authorized Redirects: `https://your-app.railway.app/api/auth/google-callback`

3. Deploy:
   ```bash
   git push (Railway auto-deploy)
   ```

### 8️⃣ Error Handling

#### Common Errors:

**"Google token yaroqsiz"**
- ✅ GOOGLE_CLIENT_ID to'g'ri ekanligini tekshiring
- ✅ Token expiration vaqti tekshiring

**"CORS error"**
- ✅ Frontend URL'i Google Cloud'da authorized bo'lganini tekshiring

**"User already exists"**
- ✅ Email orqali duplicate user check implemented
- ✅ Auto-merge logic yordamida birlashtiriladi

### 9️⃣ Features

✅ **One-Tap Sign-In** - Google account automatik taniladi
✅ **Email-based Login** - Email duplicate user check
✅ **Profile Sync** - Google profili avtomatik sinkronizlanadi
✅ **Security** - Token server-side verification
✅ **Fallback** - Telefon + password optsiyasi ham mavjud

### 🔟 Next Steps

Qo'lganlar:
- [ ] Dynamic Weakness Drill
- [ ] Avtomatik Manda Generatori
- [ ] Liga Tizimi (Haftalik Reyting)

---

**Need help?** Check backend logs: `npm run dev` output

**Security Note**: Production'da `.env` files'ni GitHub'ga push qilmang! Railway/hosting platform secrets'idan foydalaning.
