#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   SINTAKSIS TEKSHIRUVI (CI uchun)
   ───────────────────────────────────────────────────────────────────────
   Barcha frontend JS fayllarini `node --check` bilan tekshiradi.
   Maqsad: bitta sintaksis xatosi jonli saytni buzmasligi uchun — har push
   va PR'da avtomatik ishlaydi (.github/workflows/ci.yml).

   Lokal ishlatish:  npm run check
   ═══════════════════════════════════════════════════════════════════════ */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.vite']);

// Tekshiriladigan papkalar
const TARGET_DIRS = ['assets/js', 'scripts'];

function collectJsFiles(dir, out){
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch(_e){ return out; }
  for(const e of entries){
    if(e.isDirectory()){
      if(SKIP_DIRS.has(e.name)) continue;
      collectJsFiles(path.join(dir, e.name), out);
    } else if(/\.(js|cjs|mjs)$/.test(e.name)){
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

let files = [];
for(const d of TARGET_DIRS){
  collectJsFiles(path.join(ROOT, d), files);
}

let failed = 0;
const errors = [];

for(const file of files){
  const rel = path.relative(ROOT, file);
  try {
    execSync(`node --check "${file}"`, { stdio: 'pipe' });
  } catch(err){
    failed++;
    const msg = (err.stderr ? err.stderr.toString() : err.message).trim();
    errors.push({ rel, msg });
  }
}

console.log(`\n  Sintaksis tekshiruvi: ${files.length} ta JS fayl tekshirildi\n`);

if(failed === 0){
  console.log(`  ✅ Barcha fayllar sintaktik to'g'ri\n`);
  process.exit(0);
} else {
  console.error(`  ❌ ${failed} ta faylda sintaksis xatosi:\n`);
  for(const e of errors){
    console.error(`  • ${e.rel}`);
    console.error(`    ${e.msg.split('\n').slice(0, 3).join('\n    ')}\n`);
  }
  process.exit(1);
}
