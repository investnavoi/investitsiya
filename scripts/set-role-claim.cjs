#!/usr/bin/env node
/**
 * Jamoa a'zosiga ROL berish (Firebase custom claim).
 *
 * Bu — tizimdagi YAGONA ishonchli rol manbai. Firestore qoidalari aynan shu
 * claim'ni o'qiydi (firestore.rules). Mijoz kodidagi TEAM_MEMBERS ro'yxati faqat
 * ism/ko'rinish uchun — u huquq bermaydi.
 *
 * ROLLAR:
 *   superadmin  — hammasini ko'radi va tahrirlaydi (texnik lead)
 *   admin       — hammasini ko'radi, tahrirlamaydi (monitoring/koordinator)
 *   member      — ko'radi + faqat o'z lead ishini (email, status, mas'ul)
 *
 * TAYYORGARLIK (bir marta):
 *   1. npm install firebase-admin
 *   2. Firebase Console → Project settings → Service accounts → Generate new private key
 *      → saqlang: scripts/service-account.json   (gitignore qilingan — hech qachon commit qilinmaydi)
 *
 * ISHLATISH:
 *   node scripts/set-role-claim.cjs <email> <role>
 *   node scripts/set-role-claim.cjs bltvazbk@gmail.com superadmin
 *   node scripts/set-role-claim.cjs shahzod@example.com admin
 *   node scripts/set-role-claim.cjs suhrob@example.com member
 *
 *   node scripts/set-role-claim.cjs --list             (kim qanday rolda — barcha userlar)
 *   node scripts/set-role-claim.cjs <email> --revoke   (rolni butunlay olib tashlash)
 *
 * MUHIM: rol o'zgargach foydalanuvchi TIZIMDAN CHIQIB QAYTA KIRISHI kerak
 *        (yoki brauzerda: await fbRefreshClaims()) — token yangilanishi uchun.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const VALID_ROLES = ['superadmin', 'admin', 'member'];

const SA_PATH = path.join(__dirname, 'service-account.json');
if (!fs.existsSync(SA_PATH)) {
  console.error('❌ service-account.json topilmadi:', SA_PATH);
  console.error('   Firebase Console → Project settings → Service accounts → Generate new private key');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(SA_PATH)) });

const args = process.argv.slice(2);

async function listUsers() {
  console.log('\n👥 Foydalanuvchilar va rollari:\n');
  let next;
  let n = 0;
  do {
    const res = await admin.auth().listUsers(1000, next);
    res.users.forEach(function (u) {
      const c = u.customClaims || {};
      const r = c.role || (c.admin === true ? 'admin:true (legacy → superadmin)' : '— rol yo\'q');
      console.log('   ' + String(u.email || u.uid).padEnd(38) + ' → ' + r);
      n++;
    });
    next = res.pageToken;
  } while (next);
  console.log('\n   Jami: ' + n + ' ta foydalanuvchi\n');
}

(async function () {
  try {
    if (args.includes('--list') || args.length === 0) {
      await listUsers();
      if (args.length === 0) {
        console.log('Ishlatish: node scripts/set-role-claim.cjs <email> <superadmin|admin|member>');
      }
      process.exit(0);
    }

    const email = args[0];
    const revoke = args.includes('--revoke');
    const role = args[1];

    const user = await admin.auth().getUserByEmail(email);

    if (revoke) {
      await admin.auth().setCustomUserClaims(user.uid, null);
      console.log('✅ Rol OLIB TASHLANDI: ' + email);
      console.log('   Endi u faqat o\'qiy oladi (hech qanday yozish huquqi yo\'q).');
      console.log('   Foydalanuvchi qayta login qilishi kerak.');
      process.exit(0);
    }

    if (!role || VALID_ROLES.indexOf(role) === -1) {
      console.error('❌ Rol noto\'g\'ri: "' + (role || '') + '"');
      console.error('   Ruxsat etilgan: ' + VALID_ROLES.join(' | '));
      process.exit(1);
    }

    /* admin:true ni ham qo'yamiz — eski kod/qoidalar bilan mos bo'lishi uchun.
       Faqat superadmin haqiqiy global yozish huquqiga ega. */
    const claims = { role: role, admin: role === 'superadmin' };
    await admin.auth().setCustomUserClaims(user.uid, claims);

    console.log('✅ Rol o\'rnatildi');
    console.log('   Email : ' + email);
    console.log('   UID   : ' + user.uid);
    console.log('   Rol   : ' + role);
    console.log('   Claim : ' + JSON.stringify(claims));
    console.log('');
    console.log('   ⚠️  Foydalanuvchi CHIQIB QAYTA KIRISHI kerak (yoki fbRefreshClaims()).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Xato:', err && err.message);
    if (err && err.code === 'auth/user-not-found') {
      console.error('   Avval Firebase Console → Authentication da foydalanuvchi yarating.');
    }
    process.exit(1);
  }
})();
