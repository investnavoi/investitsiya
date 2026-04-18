/**
 * Production build script
 * - Concatenates all assets/js/*.js in load order → bundle.min.js
 * - Minifies via terser (preserves globals — vanilla JS uses last-declaration-wins override pattern)
 * - Minifies CSS
 * - Rewrites index.html → dist/index.html with single bundle script tag
 * - Copies static assets
 */
import { readFile, writeFile, mkdir, copyFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

// Load order — must match index.html
const JS_FILES = [
  'state.js',
  'utils.js',
  'default-data.js',
  'api-config.js',
  'gemini.js',
  'apollo-config.js',
  'apollo.js',
  'snov.js',
  'ai-letter.js',
  'settings.js',
  'theme-lang.js',
  'auto-translate.js',
  'admin-login.js',
  'admin-forms.js',
  'pipeline-crm.js',
  'finder.js',
  'import-analysis.js',
  'products.js',
  'email-modal.js',
  'investor-companies.js',
  'excel-media.js',
  'forum-detail.js',
  'intl-forums.js',
  'csv-import.js',
  'admin-lists.js',
  'navigation.js',
  'render-pages.js',
  'app-init.js',
  'gmail.js',
  'embassy.js',
  'chatbot.js',
  'sidebar.js'
];

async function copyDir(src, dest){
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for(const entry of entries){
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if(entry.isDirectory()) await copyDir(s, d);
    else await copyFile(s, d);
  }
}

async function build(){
  console.log('🔨 Build boshlandi...');
  const t0 = Date.now();

  // 1. Clean dist
  if(existsSync(DIST)){
    const { rm } = await import('node:fs/promises');
    await rm(DIST, { recursive: true, force: true });
  }
  await mkdir(DIST, { recursive: true });

  // 2. Concat all JS
  console.log('📦 JS fayllarni birlashtirish...');
  let combined = '';
  let totalRaw = 0;
  for(const file of JS_FILES){
    const path = join(ROOT, 'assets/js', file);
    const code = await readFile(path, 'utf8');
    totalRaw += code.length;
    combined += `\n/* ===== ${file} ===== */\n${code}\n`;
  }
  console.log(`   Raw: ${(totalRaw/1024).toFixed(0)} KB`);

  // 3. Minify with terser — keep top-level names safe (globals shared cross-file)
  console.log('🗜️  Terser minify...');
  const result = await minify(combined, {
    compress: {
      drop_debugger: true,
      passes: 2
    },
    mangle: {
      toplevel: false,  // CRITICAL: keep global function/var names intact
      reserved: ['DB', 'currentPage', 'currentLang', 'isAdmin']
    },
    format: { comments: false }
  });

  if(result.error) throw result.error;
  const minSize = result.code.length;
  console.log(`   Minified: ${(minSize/1024).toFixed(0)} KB (-${Math.round((1-minSize/totalRaw)*100)}%)`);

  // 4. Write bundle
  await mkdir(join(DIST, 'assets/js'), { recursive: true });
  await writeFile(join(DIST, 'assets/js/bundle.min.js'), result.code);

  // 5. Minify CSS (simple — strip comments + whitespace)
  console.log('🎨 CSS minify...');
  const css = await readFile(join(ROOT, 'assets/css/main.css'), 'utf8');
  const cssMin = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
  await mkdir(join(DIST, 'assets/css'), { recursive: true });
  await writeFile(join(DIST, 'assets/css/main.css'), cssMin);
  console.log(`   CSS: ${(css.length/1024).toFixed(0)} KB → ${(cssMin.length/1024).toFixed(0)} KB`);

  // 6. Rewrite index.html
  console.log('📄 index.html qayta yozish...');
  let html = await readFile(join(ROOT, 'index.html'), 'utf8');
  // Remove all assets/js/*.js script tags (including defer)
  html = html.replace(/<script src="assets\/js\/[^"]+\.js"(?: defer)?><\/script>\n?/g, '');
  // Insert single bundle tag before </head> (no defer — body inline scripts call getGeminiKey() etc. synchronously)
  html = html.replace('</head>', '<script src="assets/js/bundle.min.js"></script>\n</head>');
  await writeFile(join(DIST, 'index.html'), html);

  // 7. Copy firebase-init.js (ES module — not bundled, used as-is)
  await copyFile(join(ROOT, 'assets/js/firebase-init.js'), join(DIST, 'assets/js/firebase-init.js'));

  // 8. Copy static assets
  console.log('📁 Static fayllarni nusxalash...');
  for(const dir of ['maps', 'assets/img']){
    const src = join(ROOT, dir);
    if(existsSync(src)) await copyDir(src, join(DIST, dir));
  }
  for(const file of ['mapdata.js', 'worldmap.js', 'investor-world-map.svg', 'navoi-invest-ai-white.png']){
    const src = join(ROOT, file);
    if(existsSync(src)) await copyFile(src, join(DIST, file));
  }

  const dt = ((Date.now()-t0)/1000).toFixed(1);
  console.log(`\n✅ Build tayyor: dist/  (${dt}s)`);
  console.log(`   bundle.min.js: ${(minSize/1024).toFixed(0)} KB`);
  console.log(`   gzip ~${Math.round(minSize*0.3/1024)} KB (taxminan)`);
}

build().catch(err => { console.error('❌ Build xato:', err); process.exit(1); });
