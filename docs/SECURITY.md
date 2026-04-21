# Xavfsizlik — Firebase Auth + Custom Claims

Ushbu hujjat yangi autentifikatsiya tizimini sozlash uchun.

## Arxitektura

- **Autentifikatsiya:** Firebase Auth (Email + Password)
- **Ruxsat:** Firebase custom claim `admin: true`
- **Domain cheklov:** faqat `@navoi.gov.uz` emaillar
- **Server himoyasi:** Firestore Security Rules (admin yoza oladi, whitelisted user o'qiydi)

## Ruxsatlar jadvali

| Resurs | Guest | User (@navoi.gov.uz) | Admin |
|--------|-------|----------------------|-------|
| Investors ro'yxati | ❌ | 👀 Read | ✏️ Write |
| Investor Companies (CRM) | ❌ | 👀 Read | ✏️ Write |
| Raw Materials, Products | ❌ | 👀 Read | ✏️ Write |
| Forumlar, Zoom | ❌ | 👀 Read | ✏️ Write |
| Trade Atlas, Import | ❌ | 👀 Read | ✏️ Write |
| **API Keys** | ❌ | ❌ | ✏️ Read+Write |
| Settings | ❌ | 👀 Read | ✏️ Write |

## Sozlash (bir marta)

### 1. Firebase Console sozlamalari

1. **Authentication → Sign-in method**
   - **Email/Password** provayderini yoqing
   - Email link (passwordless) yoqilmasin — parolli auth ishlaydi

2. **Authentication → Settings → Authorized domains**
   - Production domenni qo'shing (masalan: `investnavoi.github.io`)

3. **Firestore → Rules**
   - `firestore.rules` fayl mazmunini nusxalab joylang
   - "Publish" tugmasini bosing

### 2. Admin foydalanuvchi yaratish

**A) Firebase Console orqali:**
1. Authentication → Users → Add user
2. Email: `admin@navoi.gov.uz` (yoki haqiqiy xodim email)
3. Parol: kuchli parol belgilang

**B) Admin claim berish:**

```bash
# Firebase service account key oling:
# Firebase Console → Settings → Service accounts → Generate new private key
# Faylni quyidagi joyga saqlang:
#   scripts/service-account.json

# Node.js Admin SDK o'rnating:
npm install firebase-admin

# Admin huquqini bering:
node scripts/set-admin-claim.js admin@navoi.gov.uz

# Admin huquqini olib tashlash:
node scripts/set-admin-claim.js admin@navoi.gov.uz --revoke
```

### 3. Oddiy foydalanuvchilar qo'shish

Har bir xodim uchun:
1. Firebase Console → Authentication → Add user
2. Email: `familiya@navoi.gov.uz`
3. Vaqtinchalik parol bering
4. Foydalanuvchi 1-marta kirishda parolni o'zgartiradi (Forgot password link orqali)

## Xavfsizlik tekshirish

### Client-side tekshiruvlar (UX uchun, himoya EMAS)

```js
if(!window.isAdmin){ /* hide buttons */ }
if(window.requireAdmin('delete')){ doDelete(); }
```

### Server-side himoya (haqiqiy)

Barcha Firestore operatsiyalari `firestore.rules` orqali tekshirilinadi.
Client-side checkni aylanib o'tish mumkin, lekin Firestore server ruxsat bermaydi.

## Muhim fayllar

| Fayl | Vazifasi |
|------|----------|
| `assets/js/firebase-init.js` | Firestore + app init |
| `assets/js/firebase-auth.js` | Auth listener, login/logout |
| `assets/js/admin-login.js` | Login UI + doLogin() |
| `firestore.rules` | Server security rules |
| `scripts/set-admin-claim.js` | Admin claim sozlash |
| `.gitignore` | service-account.json ni himoyalaydi |

## API Kalit himoyasi

⚠️ `firebaseConfig.apiKey` — ochiq ko'rsatilishi NORMAL
  (Firebase docs: ["This API key is safe to include"](https://firebase.google.com/docs/projects/api-keys#api-keys-for-firebase-are-different))
  chunki haqiqiy himoya Firestore Rules orqali.

⚠️ Lekin **Apollo**, **Gmail**, **OpenAI** kalitlari Firestore'da `apiKeys` collection'da saqlanadi.
   Firestore Rules bo'yicha faqat admin o'qiy oladi.
   Oddiy foydalanuvchilar bu kalitlarga kirolmaydi.

## Audit log (ixtiyoriy kelajakda)

`auditLogs/` collection'i yaratilgan. Sensitiv harakatlarni yozish uchun:

```js
await setDoc(doc(db, 'auditLogs', crypto.randomUUID()), {
  uid: window._currentUser.uid,
  email: window._currentUser.email,
  action: 'delete_company',
  targetId: recId,
  timestamp: new Date().toISOString()
});
```

## Migratsiya — eski foydalanuvchilar uchun

Hozirgi hardcoded `admin`/`shahzod` paroli endi ishlamaydi.

1. Admin `admin@navoi.gov.uz` email bilan qayta ro'yxatdan o'tsin
2. `node scripts/set-admin-claim.js admin@navoi.gov.uz` ishga tushiring
3. Admin qayta login qilsin — admin Panel ko'rinadi
