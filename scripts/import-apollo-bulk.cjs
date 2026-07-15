#!/usr/bin/env node
/**
 * Apollo BULK natijalarini (apollo-bulk-results.json) investorCompanies bazasiga import.
 *
 * MUAMMO: apollo-bulk-fetch.js 5719+ kompaniya topgan, lekin ular faqat JSON faylda
 * qolgan — Firestore'ga hech qachon import qilinmagan. Shu sababli bazada atigi ~413 ta.
 * Bu skript o'sha kompaniyalarni bazaga yuklaydi (dublikatlarni tashlab).
 *
 * TAYYORGARLIK:
 *   1. npm install firebase-admin
 *   2. scripts/service-account.json (Firebase Console → Service accounts) — gitignore.
 *   3. AVVAL BACKUP:  node scripts/backup-firestore.cjs
 *
 * ISHLATISH:
 *   node scripts/import-apollo-bulk.cjs                 (DRY-RUN — faqat ko'rsatadi, yozmaydi)
 *   node scripts/import-apollo-bulk.cjs --commit        (HAQIQIY import)
 *   node scripts/import-apollo-bulk.cjs --commit --with-contact-only   (faqat rahbar YOKI telefoni borlarini)
 *
 * XAVFSIZLIK:
 *   - Standart holatda DRY-RUN — hech narsa o'zgartirmaydi.
 *   - Mavjud kompaniyalar (nom bo'yicha) qayta qo'shilmaydi (dedup).
 *   - Doc id = "abulk_<nom-slug>" — qayta ishga tushirilsa dublikat yaratmaydi (idempotent).
 *   - MUHIM: bu yozuvlarda EMAIL yo'q (Apollo qidiruvi email qaytarmagan). Ular
 *     kompaniya + rahbar nomi sifatida bazaga tushadi; email keyin (obuna qaytganda)
 *     "reveal" orqali to'ldiriladi. status='new', needsEmail=true bilan belgilanadi.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const SA_PATH = path.join(__dirname, 'service-account.json');
const IN_FILE = path.join(__dirname, '..', 'apollo-bulk-results.json');

if(!fs.existsSync(SA_PATH)){ console.error('❌ service-account.json topilmadi:', SA_PATH); process.exit(1); }
if(!fs.existsSync(IN_FILE)){ console.error('❌ apollo-bulk-results.json topilmadi:', IN_FILE); process.exit(1); }

const args = process.argv.slice(2);
const commit = args.includes('--commit');
const contactOnly = args.includes('--with-contact-only');

/* team.js dagi normalizeCompanyName bilan mos — dublikatni aniq topish uchun */
function normalizeCompanyName(name){
  var s = String(name || '').toLowerCase().trim();
  if(!s) return '';
  s = s.replace(/["'`’.,]/g,' ').replace(/&/g,' and ');
  s = s.replace(/\b(co|company|corp|corporation|inc|incorporated|ltd|limited|llc|llp|gmbh|ag|plc|sa|srl|bv|nv|pte|pvt|jsc|ojsc|pjsc|oao|ooo|zao|group|holding|holdings|industries|international|intl|trading|import|export|imp|exp)\b/g,' ');
  s = s.replace(/[^a-z0-9Ѐ-ӿ ]+/g,' ').replace(/\s+/g,' ').trim();
  return s;
}
function slug(name){
  return normalizeCompanyName(name).replace(/\s+/g,'_').slice(0, 60) || ('x'+Date.now());
}

admin.initializeApp({ credential: admin.credential.cert(require(SA_PATH)) });
const db = admin.firestore();

(async function(){
  try {
    const raw = JSON.parse(fs.readFileSync(IN_FILE, 'utf8'));
    const bulk = Array.isArray(raw) ? raw : [];
    console.log('📂 apollo-bulk-results.json:', bulk.length, 'ta yozuv');

    // 1) Mavjud investorCompanies nomlarini yig'amiz (dedup uchun)
    const snap = await db.collection('investorCompanies').get();
    const existingNames = new Set();
    snap.forEach(function(d){ var n = normalizeCompanyName((d.data()||{}).kompaniya); if(n) existingNames.add(n); });
    console.log('🗄  Bazada hozir:', snap.size, 'ta yozuv (', existingNames.size, 'noyob nom)');

    // 2) Bulk'ni dedup qilamiz (o'zaro + bazaga nisbatan)
    const seen = new Set();
    const toAdd = [];
    let skipDup = 0, skipNoContact = 0, skipNoName = 0;
    for(const r of bulk){
      const name = String(r.kompaniya || '').trim();
      const key = normalizeCompanyName(name);
      if(!key){ skipNoName++; continue; }
      if(existingNames.has(key)){ skipDup++; continue; }   // bazada bor
      if(seen.has(key)){ skipDup++; continue; }             // bulk ichida takror
      if(contactOnly && !(r.rahbar || r.telefon || r.email)){ skipNoContact++; continue; }
      seen.add(key);
      toAdd.push({
        id: 'abulk_' + slug(name),
        kompaniya: name,
        rahbar: r.rahbar || '', lavozim: r.lavozim || '',
        email: r.email || '', telefon: r.telefon || '',
        davlat: r.davlat || '', shahar: r.shahar || '', soha: r.soha || '',
        linkedin: r.linkedin || '', website: r.website || '', photoUrl: r.photoUrl || '',
        manba: r.manba || 'Apollo.io (bulk)',
        holat: 'Yangi', status: 'new',
        sana: r.sana || new Date().toISOString().slice(0,10),
        emailSent: false,
        needsEmail: !r.email,
        assignedTo: '', createdBy: 'import:apollo-bulk',
        createdAt: new Date().toISOString(), lastActivityAt: new Date().toISOString()
      });
    }

    console.log('');
    console.log('📊 Natija:');
    console.log('   Yangi qo\'shiladi :', toAdd.length);
    console.log('   Dublikat (o\'tkazildi):', skipDup);
    if(contactOnly) console.log('   Kontaktsiz (o\'tkazildi):', skipNoContact);
    console.log('   Nomsiz (o\'tkazildi):', skipNoName);
    console.log('   Import so\'ng bazada bo\'ladi:', snap.size + toAdd.length, 'ta');

    if(!commit){
      console.log('\n🔍 DRY-RUN — hech narsa yozilmadi. Haqiqiy import uchun: --commit qo\'shing.');
      console.log('   (Tavsiya: avval  node scripts/backup-firestore.cjs)');
      process.exit(0);
    }

    // 3) Batch bilan yozamiz (450/batch)
    let written = 0;
    for(let i=0;i<toAdd.length;i+=450){
      const batch = db.batch();
      toAdd.slice(i, i+450).forEach(function(rec){
        batch.set(db.collection('investorCompanies').doc(String(rec.id)), rec);
      });
      await batch.commit();
      written += Math.min(450, toAdd.length - i);
      process.stdout.write('   yozildi: ' + written + '/' + toAdd.length + '\r');
    }
    console.log('\n✅ Import tugadi:', written, 'ta yangi kompaniya qo\'shildi.');
    console.log('   Bazada endi ~' + (snap.size + written) + ' ta. Saytda "Investorlar bazasi"ni yangilang.');
    process.exit(0);
  } catch(err){
    console.error('❌ Import xatosi:', err && err.message);
    process.exit(1);
  }
})();
