#!/usr/bin/env node
/**
 * Firestore FULL BACKUP — barcha kolleksiyalarni vaqt belgili JSON'ga eksport qiladi.
 *
 * TAYYORGARLIK (bir marta):
 *   1. npm install firebase-admin
 *   2. Firebase Console → Settings → Service accounts → Generate new private key
 *      Saqlang: scripts/service-account.json  (gitignore qilingan — maxfiy!)
 *
 * ISHLATISH:
 *   node scripts/backup-firestore.cjs
 *      → backups/backup-YYYY-MM-DDTHH-mm-ss/<collection>.json fayllarini yaratadi
 *
 * ROLLBACK (oldingi holatga qaytarish):
 *   node scripts/restore-firestore.cjs backups/backup-<sana>
 *
 * TAVSIYA: har kuni ishga tushiring (yoki katta o'zgarishdan oldin). Faylni
 * xavfsiz joyda saqlang — bu sizning "database version control"ingiz.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const SA_PATH = path.join(__dirname, 'service-account.json');
if(!fs.existsSync(SA_PATH)){
  console.error('❌ service-account.json topilmadi:', SA_PATH);
  console.error('   Firebase Console → Settings → Service accounts → Generate new private key');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(SA_PATH)) });
const db = admin.firestore();

function stamp(){
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

(async function(){
  try {
    const outDir = path.join(__dirname, '..', 'backups', 'backup-' + stamp());
    fs.mkdirSync(outDir, { recursive: true });

    const cols = await db.listCollections();
    if(!cols.length){ console.log('⚠️  Hech qanday kolleksiya topilmadi.'); process.exit(0); }

    let totalDocs = 0;
    const manifest = {};
    for(const colRef of cols){
      const snap = await colRef.get();
      const rows = [];
      snap.forEach(function(d){ rows.push({ __id: d.id, data: d.data() }); });
      const file = path.join(outDir, colRef.id + '.json');
      fs.writeFileSync(file, JSON.stringify(rows, null, 2), 'utf8');
      manifest[colRef.id] = rows.length;
      totalDocs += rows.length;
      console.log('  ✅ ' + colRef.id + ' — ' + rows.length + ' ta hujjat');
    }
    fs.writeFileSync(path.join(outDir, '_manifest.json'),
      JSON.stringify({ createdAt: new Date().toISOString(), collections: manifest, totalDocs }, null, 2), 'utf8');

    console.log('\n📦 Backup tayyor: ' + outDir);
    console.log('   Jami: ' + totalDocs + ' ta hujjat, ' + Object.keys(manifest).length + ' ta kolleksiya');
    process.exit(0);
  } catch(err){
    console.error('❌ Backup xatosi:', err.message);
    process.exit(1);
  }
})();
