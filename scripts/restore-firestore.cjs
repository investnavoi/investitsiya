#!/usr/bin/env node
/**
 * Firestore RESTORE / ROLLBACK — backup papkasidan ma'lumotni tiklaydi.
 *
 * ISHLATISH:
 *   node scripts/restore-firestore.cjs backups/backup-<sana>            (DRY-RUN: faqat ko'rsatadi)
 *   node scripts/restore-firestore.cjs backups/backup-<sana> --commit   (HAQIQIY yozadi)
 *   node scripts/restore-firestore.cjs backups/backup-<sana> --commit --only investorCompanies
 *
 * XAVFSIZLIK:
 *   - Standart holatda DRY-RUN — hech narsa o'zgartirmaydi, faqat nima bo'lishini ko'rsatadi.
 *   - --commit bilan yozadi. Har kolleksiyaga qo'yishdan OLDIN avtomatik yangi backup
 *     olib qo'yish TAVSIYA etiladi (avval: node scripts/backup-firestore.cjs).
 *   - Bu MERGE emas — backupdagi hujjatlarni setDoc bilan qayta yozadi (o'sha ID bo'yicha).
 *     Backupdan keyin qo'shilgan YANGI hujjatlar o'chirilmaydi (xavfsizroq).
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const SA_PATH = path.join(__dirname, 'service-account.json');
if(!fs.existsSync(SA_PATH)){
  console.error('❌ service-account.json topilmadi:', SA_PATH);
  process.exit(1);
}

const args = process.argv.slice(2);
const backupDir = args[0];
const commit = args.includes('--commit');
const onlyIdx = args.indexOf('--only');
const onlyCol = onlyIdx !== -1 ? args[onlyIdx + 1] : null;

if(!backupDir || !fs.existsSync(backupDir)){
  console.error('Usage: node scripts/restore-firestore.cjs <backup-papka> [--commit] [--only <collection>]');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require(SA_PATH)) });
const db = admin.firestore();

(async function(){
  try {
    const files = fs.readdirSync(backupDir).filter(function(f){ return f.endsWith('.json') && f !== '_manifest.json'; });
    if(!files.length){ console.log('⚠️  Backup papkada JSON topilmadi.'); process.exit(0); }

    console.log((commit ? '⚠️  HAQIQIY tiklash (--commit)\n' : '🔍 DRY-RUN (hech narsa yozilmaydi)\n'));
    let total = 0;
    for(const file of files){
      const col = file.replace(/\.json$/, '');
      if(onlyCol && col !== onlyCol) continue;
      const rows = JSON.parse(fs.readFileSync(path.join(backupDir, file), 'utf8'));
      console.log('  ' + (commit ? '↩️' : '•') + ' ' + col + ' — ' + rows.length + ' ta hujjat' + (commit ? ' tiklanmoqda...' : ''));
      if(commit){
        // Batchlarga bo'lib yozamiz (Firestore limiti = 500/batch)
        for(let i=0;i<rows.length;i+=450){
          const batch = db.batch();
          rows.slice(i, i+450).forEach(function(row){
            batch.set(db.collection(col).doc(String(row.__id)), row.data || {});
          });
          await batch.commit();
        }
      }
      total += rows.length;
    }
    console.log('\n' + (commit ? '✅ Tiklandi: ' : '🔍 Tiklanadi (dry-run): ') + total + ' ta hujjat');
    if(!commit) console.log('   Haqiqiy tiklash uchun: yuqoridagi buyruqni --commit bilan qayta ishga tushiring.');
    process.exit(0);
  } catch(err){
    console.error('❌ Restore xatosi:', err.message);
    process.exit(1);
  }
})();
