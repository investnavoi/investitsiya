# Navoiy Invest — Deploy, Rollback va Jamoa sozlamalari

Bu hujjat: (1) Vercel'ga deploy, (2) istalgan vaqtda oldingi versiyaga qaytish
(kod + database), (3) jamoa a'zolarini sozlash bo'yicha qisqa qo'llanma.

---

## 1. Vercel'ga deploy qilish

Loyiha allaqachon Vercel uchun sozlangan (`vercel.json`):
- Build: `npm run build`  →  natija `dist/` papkasiga chiqadi.
- Har GitHub push avtomatik yangi deploy hosil qiladi.

### Variant A — GitHub orqali ulash (TAVSIYA, bir marta)
1. https://vercel.com → **Add New → Project**.
2. **Import Git Repository** → `investnavoi/investitsiya` ni tanlang
   (birinchi marta bo'lsa "Install GitHub App" → repo'ga ruxsat bering).
3. Sozlamalar avtomatik aniqlanadi (`vercel.json` bor):
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy** bosing. Bir necha daqiqada `https://<loyiha>.vercel.app` tayyor bo'ladi.
5. Qaysi branch deploy bo'lishini tanlang: Production = `main`.
   `team-scale-up` kabi branch'lar avtomatik **Preview** deploy oladi
   (ya'ni ishlab ko'rish uchun alohida URL, production'ga tegmaydi).

### Variant B — Vercel CLI orqali (terminaldan)
```bash
npm i -g vercel
vercel login          # brauzerda tasdiqlaysiz
vercel                # preview deploy
vercel --prod         # production deploy
```

> ⚠️ Firebase/Firestore mijoz tomonida ishlaydi — Vercel'da qo'shimcha maxfiy
> kalit shart emas. Rejalashtirilgan email (GitHub Actions) esa alohida ishlaydi
> va Vercel'ga bog'liq emas.

---

## 2. Oldingi versiyaga qaytish (Rollback)

### 2a. Kod (frontend/backend)
Har muhim bosqichda git **tag** qo'yiladi. Mavjud tagni ko'rish:
```bash
git tag                       # barcha nuqtalar
git log --oneline -20         # commitlar
```
Butun kodni oldingi barqaror nuqtaga qaytarish:
```bash
git checkout stable-team-v1   # faqat ko'rish uchun (detached)
# yoki main'ni o'sha nuqtaga qaytarish (ehtiyot bo'ling):
git revert <commit>           # xavfsiz: yangi commit bilan orqaga qaytaradi
```
Vercel'da esa har deploy tarixda saqlanadi: **Vercel → Deployments → eski
deploy → "Promote to Production"** — bir bosishda saytni oldingi holatga qaytaradi.

### 2b. Ma'lumotlar bazasi (Firestore)
Kundalik yoki katta o'zgarishdan oldin snapshot oling:
```bash
node scripts/backup-firestore.cjs
#  → backups/backup-YYYY-MM-DD.../ ichiga barcha kolleksiyalar JSON bo'lib saqlanadi
```
Qaytarish (rollback):
```bash
node scripts/restore-firestore.cjs backups/backup-<sana>            # DRY-RUN (ko'rsatadi, yozmaydi)
node scripts/restore-firestore.cjs backups/backup-<sana> --commit   # HAQIQIY qaytaradi
```
> Buning uchun `scripts/service-account.json` kerak (Firebase Console → Settings →
> Service accounts → Generate new private key). Bu fayl gitignore qilingan — hech
> qachon commit qilinmaydi.

---

## 3. Jamoa a'zolarini sozlash (`assets/js/team.js`)

`TEAM_MEMBERS` ro'yxatida har a'zoning **login emaili**ni to'ldiring:
```js
{ id:'suhrob', name:'Suhrob', roleLabel:'Lead outreach', role:'outreach', email:'suhrob@example.com' },
```
- Email to'ldirilsa — a'zo tizimga kirganda avtomatik aniqlanadi.
- Emailsiz ham ishlaydi: har kishi "Mening sahifam"da yoki jadval ustidagi
  "Men kimman?" selektoridan o'zini bir marta tanlaydi (qurilmada eslab qolinadi).

Har a'zoga admin huquqi berish (email yuborish uchun kerak):
```bash
node scripts/set-admin-claim.cjs <email>
```

Eski leadlarga yangi maydonlarni (status/owner) qo'shish — bir marta, admin
sifatida brauzer konsolida:
```js
backfillLeadFields()
```

---

## 4. Har kishi o'z emailini ulashi

Har a'zo o'z qurilmasida "Mening sahifam" → **📧 Emailni ulash** (yoki Sozlamalar →
Gmail) orqali o'z pochtasini ulaydi. Shundan keyin uning yuborgan emaillari o'z
pochtasidan (reply-to) ketadi va statistikada `sentBy` bo'yicha o'ziga yoziladi.
