import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentSingleTabManager,
  collection, doc, setDoc, getDoc, getDocs, getDocsFromCache, deleteDoc, writeBatch, onSnapshot
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSsZMH6jJCw6dsX479PWusBU9lxTyoVuM",
  authDomain: "invest-nav-7bc47.firebaseapp.com",
  projectId: "invest-nav-7bc47",
  storageBucket: "invest-nav-7bc47.firebasestorage.app",
  messagingSenderId: "1027461291187",
  appId: "1:1027461291187:web:d6f8c0bf1e162b214024c6",
  measurementId: "G-B3XEBVJCV3"
};

const fbApp = initializeApp(firebaseConfig);
window.fbApp = fbApp;
// Firestore + IndexedDB persistent cache — 10x tezroq, offline ishlaydi.
// Single-tab manager ishlatamiz: multi-tab manager Firebase v11'da
// "INTERNAL ASSERTION FAILED: Unexpected state" xatosini keltirib chiqaradi
// (bir nechta tab o'rtasida IndexedDB lease koordinatsiyasi bug'i).
let db;
try {
  db = initializeFirestore(fbApp, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) })
  });
  console.log('🚀 Firestore IndexedDB persistent cache yoqildi (single-tab)');
} catch(e){
  // Fallback to default (memory cache)
  console.warn('Persistent cache fail, using memory:', e.message);
  const { getFirestore } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
  db = getFirestore(fbApp);
}

// Collections: investors, local, zoom, forums, investorCompanies
// Critical — load immediately (small, needed for first paint)
const COLLECTIONS_CRITICAL = ['investors','local','zoom','forums','investorCompanies','entrepreneurs','rawMaterials','products','investAiHistory','crmActivities'];
// On-demand only — load WHEN user navigates to that page (huge: importSnapshots=512, tradeSnapshotChunks=80)
const COLLECTIONS_LAZY = ['tradeData','tradeSnapshots','tradeSnapshotChunks','importSnapshots','taFirmSnapshots','embassyLetters'];
const COLLECTIONS = COLLECTIONS_CRITICAL.concat(COLLECTIONS_LAZY);
window.COLLECTIONS = COLLECTIONS;
window.COLLECTIONS_LAZY = COLLECTIONS_LAZY;

// Load API keys from separate doc
async function loadApiKeys(){
  // 1. Always load from localStorage first (instant, works offline/file://)
  try {
    const local = localStorage.getItem('_apiKeys');
    if(local){
      window._apiKeys = JSON.parse(local);
      console.log('🔑 API kalitlar localStorage dan yuklandi');
    }
  } catch(e){}
  // 2. Then try Firebase (overwrites with latest)
  try {
    const snap = await getDocs(collection(db, 'apiKeys'));
    snap.forEach(d => {
      const data = d.data();
      window._apiKeys = Object.assign(window._apiKeys || {}, data);
    });
    if(window._apiKeys){
      localStorage.setItem('_apiKeys', JSON.stringify(window._apiKeys));
      console.log('🔑 API kalitlar Firebase dan yuklandi');
    }
  } catch(e){ console.log('API keys Firebase load error (using localStorage):', e); }
}

window.saveApiKey = async function(keyName, keyValue){
  if(!window._apiKeys) window._apiKeys = {};
  window._apiKeys[keyName] = keyValue;
  // 1. Always save to localStorage (instant, works everywhere)
  try { localStorage.setItem('_apiKeys', JSON.stringify(window._apiKeys)); } catch(e){}
  // 2. Then sync to Firebase (best effort)
  try {
    await setDoc(doc(db, 'apiKeys', 'keys'), {[keyName]: keyValue}, {merge: true});
    console.log('🔑 API kalit saqlandi (Firebase + localStorage):', keyName);
  } catch(e){ console.warn('API key Firebase save error (saved to localStorage):', e); }
};
var saveApiKey = window.saveApiKey;

async function loadAllApiKeys(){
  // localStorage fallback
  try {
    const local = localStorage.getItem('_apiKeys');
    if(local) window._apiKeys = JSON.parse(local);
  } catch(e){}
  try {
    const snap = await getDocs(collection(db, 'apiKeys'));
    if(!window._apiKeys) window._apiKeys = {};
    snap.forEach(d => {
      Object.assign(window._apiKeys, d.data());
    });
    if(window._apiKeys) localStorage.setItem('_apiKeys', JSON.stringify(window._apiKeys));
  } catch(e){}
}

// Settings save/load via Firebase
async function fbSaveSettings(settings){
  try {
    await setDoc(doc(db, 'settings', 'main'), settings);
  } catch(e){ console.error('Settings save error:', e); }
}
window.fbSaveSettings = fbSaveSettings;

async function fbLoadSettings(){
  try {
    const snap = await getDocs(collection(db, 'settings'));
    snap.forEach(d => { DB.settings = d.data(); });
  } catch(e){}
}
window.fbLoadSettings = fbLoadSettings;

/* ═══════════════════════════════════════
   Generic single-doc helpers
   Kichik vidjetlar (masalan Ijro Intizomi) uchun bitta hujjatni
   Firestore'ga saqlash / o'qish. Har doim best-effort — xato bo'lsa
   localStorage fallback ishlaydi, sayt qulamaydi.
═══════════════════════════════════════ */
window.fbSetDoc = async function(col, id, data){
  try {
    await setDoc(doc(db, col, String(id)), data, { merge: true });
    return true;
  } catch(e){
    console.warn('fbSetDoc('+col+'/'+id+') error:', e && e.message);
    return false;
  }
};
window.fbGetDoc = async function(col, id){
  try {
    const snap = await getDoc(doc(db, col, String(id)));
    return snap.exists() ? snap.data() : null;
  } catch(e){
    console.warn('fbGetDoc('+col+'/'+id+') error:', e && e.message);
    return null;
  }
};

/* ═══════════════════════════════════════
   Per-user cross-device settings sync
   Stored in users/{uid} — theme, language, Gmail config, prefs.
═══════════════════════════════════════ */
const USER_SETTINGS_KEYS = [
  'theme',
  '_lang',
  '_gmailClientId',
  '_myEmail',
  '_gmailUserEmail',
  '_pollSecs',
  '_autotr_disabled'
];

function _currentUid(){
  try {
    return (window._currentUser && window._currentUser.uid)
      || localStorage.getItem('_auth_uid') || '';
  } catch(e){ return ''; }
}

function _readSyncedLocal(){
  var out = {};
  for(var i=0;i<USER_SETTINGS_KEYS.length;i++){
    var k = USER_SETTINGS_KEYS[i];
    try {
      var v = localStorage.getItem(k);
      if(v !== null && v !== undefined) out[k] = v;
    } catch(e){}
  }
  return out;
}

var _syncUserSettingsTimer = null;
window.syncUserSettings = function(immediate){
  var uid = _currentUid();
  if(!uid) return;
  if(_syncUserSettingsTimer) clearTimeout(_syncUserSettingsTimer);
  var run = async function(){
    try {
      var payload = _readSyncedLocal();
      payload.updatedAt = new Date().toISOString();
      await setDoc(doc(db, 'users', uid), payload, { merge: true });
    } catch(e){ console.warn('syncUserSettings failed:', e && e.message); }
  };
  if(immediate) run(); else _syncUserSettingsTimer = setTimeout(run, 1500);
};

window.loadUserSettings = async function(){
  var uid = _currentUid();
  if(!uid) return;
  try {
    var snap = await getDoc(doc(db, 'users', uid));
    if(!snap.exists()) return;
    var data = snap.data() || {};
    var changed = 0;
    for(var i=0;i<USER_SETTINGS_KEYS.length;i++){
      var k = USER_SETTINGS_KEYS[i];
      if(data[k] !== undefined && data[k] !== null){
        try {
          var cur = localStorage.getItem(k);
          var val = String(data[k]);
          if(cur !== val){
            // Use raw setter to avoid triggering sync-back loop
            Storage.prototype._origSetItem
              ? Storage.prototype._origSetItem.call(localStorage, k, val)
              : localStorage.setItem(k, val);
            changed++;
          }
        } catch(e){}
      }
    }
    if(changed > 0){
      console.log('☁️ '+changed+' ta sozlama Firebase\'dan tiklandi');
      try {
        if(typeof applyTheme === 'function') applyTheme();
        if(typeof applyTranslations === 'function') applyTranslations();
      } catch(e){}
    }
  } catch(e){ console.warn('loadUserSettings failed:', e && e.message); }
};

/* Auto-sync: intercept localStorage.setItem for whitelisted keys only */
(function _instrumentLocalStorage(){
  try {
    if(Storage.prototype._origSetItem) return; // already instrumented
    var orig = Storage.prototype.setItem;
    Storage.prototype._origSetItem = orig;
    Storage.prototype.setItem = function(key, value){
      orig.apply(this, arguments);
      if(USER_SETTINGS_KEYS.indexOf(String(key)) !== -1){
        try { window.syncUserSettings && window.syncUserSettings(); } catch(e){}
      }
    };
  } catch(e){ /* silent */ }
})();

function getLocalCollectionBackup(colName){
  try {
    var raw = localStorage.getItem('_backup_'+colName);
    if(!raw) return [];
    var parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch(e){
    return [];
  }
}
window.getLocalCollectionBackup = getLocalCollectionBackup;

function setLocalCollectionBackup(colName, rows){
  try {
    localStorage.setItem('_backup_'+colName, JSON.stringify(Array.isArray(rows) ? rows : []));
  } catch(e){}
}
window.setLocalCollectionBackup = setLocalCollectionBackup;

// Load all data from Firestore and replace DB — OPTIMIZED: parallel + cache
function _sortRows(rows){
  rows.sort((a,b)=>{
    const av = Number(a.id);
    const bv = Number(b.id);
    if(!Number.isNaN(av) && !Number.isNaN(bv)) return av-bv;
    return String(a.id||'').localeCompare(String(b.id||''));
  });
  return rows;
}

function _loadCacheAndRenderFast(){
  var cached = false;
  for(const col of COLLECTIONS){
    var local = getLocalCollectionBackup(col);
    if(local.length){
      DB[col] = local;
      cached = true;
      // Mark as loaded so lazy fetch doesn't re-fire from Firebase
      window._lazyLoaded[col] = true;
    }
  }
  // finderResults Firestore kolleksiyasi emas (finder sessiyada hosil qiladi) —
  // faqat local backup'dan tiklaymiz, shunda CRM dashboard reload'dan keyin ham
  // finder leadlarini ko'radi va son 0 bo'lib qolmaydi.
  try {
    var _finderBackup = getLocalCollectionBackup('finderResults');
    if(_finderBackup.length) DB.finderResults = _finderBackup;
  } catch(e){}
  if(cached){
    console.log('⚡ Keshdan tezkor render');
    renderAll();
    renderOverview();
    if(typeof applyTranslations==='function') applyTranslations();
  }
  return cached;
}

// Load a single collection from Firestore + return rows
async function _loadOneCollection(col){
  const snap = await getDocs(collection(db, col));
  const rows = [];
  snap.forEach(d => {
    const row = d.data();
    if(row && (row.id === undefined || row.id === null || String(row.id).trim() === '')){
      row.id = d.id;
    }
    rows.push(row);
  });
  return _sortRows(rows);
}

// Apply loaded rows to DB + cache + handle backup fallback + seed defaults
function _applyCollectionToDb(col, rows, batchRef){
  // ═══ DATA-LOSS GUARD (barcha kolleksiyalar uchun) ═══
  // Firebase bo'sh javob qaytarsa (tranzient xato, qoida muammosi yoki tarmoq),
  // lekin bizda to'la local backup bo'lsa — ma'lumotni O'CHIRMAYMIZ, backup'dan
  // tiklaymiz. Ilgari bu himoya faqat entrepreneurs + investorCompanies uchun edi;
  // endi investors/zoom/forums va boshqalar ham himoyalangan.
  // Qasddan tozalash (fbDeleteCollection/fbSaveCollection) backup'ni ham yangilaydi,
  // shuning uchun bu guard faqat TASODIFIY bo'shlikda ishga tushadi.
  if(rows.length === 0){
    var _guardBackup = getLocalCollectionBackup(col);
    if(_guardBackup.length){
      rows.push.apply(rows, _guardBackup);
      console.log('♻️ '+col+' local backupdan tiklandi (data-loss guard):', _guardBackup.length);
    }
  }
  DB[col] = rows;
  if(rows.length) setLocalCollectionBackup(col, rows);
  // Seed from defaults if empty
  if(rows.length === 0){
    const DEFAULT_DB = getDefaultDB();
    if(DEFAULT_DB[col] && DEFAULT_DB[col].length){
      DB[col] = DEFAULT_DB[col];
      if(batchRef){
        DEFAULT_DB[col].forEach(r => batchRef.batch.set(doc(db, col, String(r.id)), r));
        batchRef.needSeed = true;
        console.log(`Seeding: ${col} (${DEFAULT_DB[col].length} ta)`);
      }
    }
  }
  return DB[col].length;
}

// Lazy-load a single collection on demand (called by page handlers)
window._lazyLoaded = window._lazyLoaded || {};
window.ensureCollectionLoaded = async function(col){
  if(window._lazyLoaded[col]) return DB[col];
  window._lazyLoaded[col] = true;
  try {
    const t0 = Date.now();
    const rows = await _loadOneCollection(col);
    const batchRef = { batch: writeBatch(db), needSeed: false };
    _applyCollectionToDb(col, rows, batchRef);
    if(batchRef.needSeed) await batchRef.batch.commit();
    console.log(`📦 Lazy load: ${col} — ${DB[col].length} ta (${Date.now()-t0}ms)`);
    return DB[col];
  } catch(e){
    // embassyLetters uchun permission xatosi bo'lsa jim — Firestore qoidalari hali deploy qilinmagan
    var msg = String((e && e.message) || e || '');
    if(col === 'embassyLetters' && msg.indexOf('insufficient permissions') !== -1){
      console.warn('embassyLetters Firestore qoidalari deploy qilinmagan — local-only ishlaydi');
    } else {
      console.error('Lazy load error ('+col+'):', e);
    }
    window._lazyLoaded[col] = false; // allow retry
    return DB[col] || [];
  }
};

// Cache freshness — if cache was synced recently, skip Firebase fetch entirely
const FB_CACHE_FRESH_MS = 5 * 60 * 1000; // 5 minutes
function _getCacheTimestamp(){
  try { return parseInt(localStorage.getItem('_fbCacheTs') || '0', 10) || 0; } catch(e){ return 0; }
}
function _setCacheTimestamp(){
  try { localStorage.setItem('_fbCacheTs', String(Date.now())); } catch(e){}
}
function _isCacheFresh(){
  return (Date.now() - _getCacheTimestamp()) < FB_CACHE_FRESH_MS;
}

async function loadFromFirestore(){
  try {
    const loadEl = document.getElementById('fb-loading');
    if(loadEl) loadEl.style.display = 'flex';

    // 1. Show cached data INSTANTLY (instant first paint)
    var hadCache = _loadCacheAndRenderFast();
    if(hadCache && loadEl) loadEl.style.display = 'none';

    // 2. ALWAYS fetch Firebase — har bir foydalanuvchi yangi va to'liq ma'lumot ko'radi.
    //    Eski cache "skip" optimizatsiyasi olib tashlandi — har xil hamkasb har xil son
    //    ko'rishi muammosi shu sababli edi. Cache faqat instant first paint uchun.
    const t0 = Date.now();
    const critPromises = COLLECTIONS_CRITICAL.map(col =>
      _loadOneCollection(col)
        .then(rows => ({ col, rows }))
        .catch(err => {
          console.warn('Firebase load failed for ' + col + ':', err && err.message);
          return { col, rows: null };
        })
    );
    const [critResults] = await Promise.all([
      Promise.all(critPromises),
      loadApiKeys(),
      fbLoadSettings()
    ]);

    const batchRef = { batch: writeBatch(db), needSeed: false };
    let totalDocs = 0;
    for(const { col, rows } of critResults){
      // Firebase fetch fail bo'lsa cache'dagi ma'lumot saqlanadi
      if(rows === null){
        if(Array.isArray(DB[col]) && DB[col].length){
          totalDocs += DB[col].length;
        }
        window._lazyLoaded[col] = true;
        continue;
      }
      // Firebase javob qaytarsa — DB'ni Firebase ma'lumoti bilan to'liq yangilaymiz
      // (haqiqat manbai = Firebase, cache faqat fallback)
      totalDocs += _applyCollectionToDb(col, rows, batchRef);
      window._lazyLoaded[col] = true;
    }
    if(batchRef.needSeed) await batchRef.batch.commit();

    if(loadEl) loadEl.style.display = 'none';
    // Firebase yangilanishi bo'yicha render — rAF bilan keyingi framega surish.
    // Bu birinchi cache render'i bilan bir frameda blokirovka qilmaydi
    // (kesh + Firebase bir vaqtda renderAll() chaqirganda 2x freeze chiqardi).
    // Ma'lumotlar xavfsiz — DB allaqachon to'liq yangilangan, faqat render keyinga suriladi.
    requestAnimationFrame(function(){
      renderAll();
      renderOverview();
      if(typeof applyTranslations==='function') applyTranslations();
    });
    console.log(`✅ Firebase yangilandi: ${totalDocs} ta yozuv (${Date.now()-t0}ms)`);

    // 3. Heavy collections (tradeData, tradeSnapshots, importSnapshots) load ON DEMAND only
    //    when user navigates to that page (via showPage → ensureCollectionLoaded).
    _setCacheTimestamp();

    // 4. Real-time — boshqa xodim email yuborsa / mas'ul o'zgartirsa, hammaga darrov
    //    ko'rinadi (dublikat yuborishning oldi olinadi).
    _subscribeInvestorCompanies();
  } catch(e){
    console.error('Firebase load error:', e);
    const loadEl = document.getElementById('fb-loading');
    if(loadEl) loadEl.style.display = 'none';
    renderAll();
    renderOverview();
    if(typeof applyTranslations==='function') applyTranslations();
  }
}

// Real-time listener — investorCompanies o'zgarishlarini hammaga jonli yetkazadi.
// Maqsad: kimdir email yuborsa / mas'ul biriktirsa, boshqalar darrov ko'radi va
// dublikat email yubormaydi.
var _icSnapTimer = null;
function _subscribeInvestorCompanies(){
  if(window._icUnsub) return; // faqat bir marta o'rnatiladi
  try {
    window._icUnsub = onSnapshot(collection(db, 'investorCompanies'), function(snap){
      // Faqat BOSHQA foydalanuvchi o'zgarishiga reaksiya — o'z yozuvimiz echo'sini o'tkazamiz
      var remote = snap.docChanges().some(function(ch){ return !ch.doc.metadata.hasPendingWrites; });
      if(!remote) return;
      var rows = [];
      snap.forEach(function(d){
        var row = d.data();
        if(row && (row.id === undefined || row.id === null || String(row.id).trim() === '')) row.id = d.id;
        rows.push(row);
      });
      DB.investorCompanies = _sortRows(rows);
      setLocalCollectionBackup('investorCompanies', DB.investorCompanies);
      if(_icSnapTimer) clearTimeout(_icSnapTimer);
      _icSnapTimer = setTimeout(function(){
        // Dashboard/statistika har doim xavfsiz yangilanadi
        try { if(typeof renderMyPage === 'function' && document.getElementById('page-myteam') && document.getElementById('page-myteam').classList.contains('active')) renderMyPage(); } catch(e){}
        try { if(typeof renderTeamDashboard === 'function') renderTeamDashboard(); } catch(e){}
        // Leadlar jadvalini faqat foydalanuvchi ish jarayonida BO'LMAGANDA yangilaymiz
        // (email modal / AI ochiq bo'lsa yoki soha tahrirlanayotgan bo'lsa — tegmaymiz).
        var busy = (document.getElementById('emailModal') && document.getElementById('emailModal').classList.contains('open'))
          || window._investorAiOpen || window._finderAiOpen || window._investorSohaEditId;
        if(!busy){
          try { if(typeof renderInvestorCompanies === 'function' && document.getElementById('page-investor') && document.getElementById('page-investor').classList.contains('active')) renderInvestorCompanies(); } catch(e){}
        }
        console.log('🔄 Real-time: investorCompanies yangilandi ('+rows.length+' ta)');
      }, 1200);
    }, function(err){
      console.warn('investorCompanies real-time listener xatosi:', err && err.message);
    });
    console.log('📡 Real-time listener yoqildi: investorCompanies');
  } catch(e){ console.warn('Real-time subscribe xatosi:', e && e.message); }
}

// Manual refresh — force Firebase reload regardless of cache
window.forceRefreshFromFirebase = function(){
  try { localStorage.removeItem('_fbCacheTs'); } catch(e){}
  window._lazyLoaded = {};
  return loadFromFirestore();
};
window.loadFromFirestore = loadFromFirestore;

// Save single record to Firestore
window.fbSave = async function(colName, record){
  try {
    await setDoc(doc(db, colName, String(record.id)), record);
    if(colName==='entrepreneurs'){
      var list = Array.isArray(DB.entrepreneurs) ? DB.entrepreneurs : [];
      setLocalCollectionBackup('entrepreneurs', list);
    }
    // investorCompanies uchun ham backup yangilanadi — refresh'da yo'qolib ketmasligi uchun
    if(colName==='investorCompanies'){
      var icList = Array.isArray(DB.investorCompanies) ? DB.investorCompanies : [];
      setLocalCollectionBackup('investorCompanies', icList);
    }
  } catch(e){
    // embassyLetters uchun permission xatosi bo'lsa jim (qoidalar deploy qilinmagan)
    var _msg = String((e && e.message) || e || '');
    if(colName === 'embassyLetters' && _msg.indexOf('insufficient permissions') !== -1){
      console.warn('embassyLetters cross-device sync ishlamayapti — Firestore qoidalarini deploy qiling');
    } else {
      console.error('fbSave error:', e);
    }
    // Firebase fail bo'lsa ham localStorage'da saqlaymiz, foydalanuvchi yo'qotmasin
    if(colName==='investorCompanies'){
      try {
        var fallbackList = Array.isArray(DB.investorCompanies) ? DB.investorCompanies : [];
        setLocalCollectionBackup('investorCompanies', fallbackList);
      } catch(_e){}
    }
  }
};

// Bulk ADD — ko'p yozuvni batch bilan qo'shadi (mavjudlarni O'CHIRMAYDI).
// Apollo bulk import kabi katta yuklashlar uchun. writeBatch = 500/commit limiti.
window.fbBulkAdd = async function(colName, records, onProgress){
  if(!Array.isArray(records) || !records.length) return 0;
  var written = 0;
  for(var i=0;i<records.length;i+=450){
    var batch = writeBatch(db);
    records.slice(i, i+450).forEach(function(r){ batch.set(doc(db, colName, String(r.id)), r); });
    await batch.commit();
    written += Math.min(450, records.length - i);
    if(typeof onProgress === 'function'){ try { onProgress(written, records.length); } catch(_e){} }
  }
  // DB + local backup yangilash (id bo'yicha merge)
  try {
    if(!Array.isArray(DB[colName])) DB[colName] = [];
    var byId = Object.create(null);
    DB[colName].forEach(function(x){ byId[String(x.id)] = x; });
    records.forEach(function(r){ byId[String(r.id)] = r; });
    DB[colName] = Object.keys(byId).map(function(k){ return byId[k]; });
    setLocalCollectionBackup(colName, DB[colName]);
  } catch(e){}
  return written;
};

// Delete single record
window.fbDelete = async function(colName, id){
  try {
    await deleteDoc(doc(db, colName, String(id)));
    // Keep localStorage backup in sync so page refresh doesn't resurrect deleted rows
    try {
      var _list = Array.isArray(DB[colName]) ? DB[colName] : [];
      setLocalCollectionBackup(colName, _list.filter(function(item){ return String(item && item.id) !== String(id); }));
    } catch(_e){}
  } catch(e){ console.error('fbDelete error:', e); }
};

// Save entire collection (for bulk import / clearAll)
window.fbSaveCollection = async function(colName, records){
  try {
    const colRef = collection(db, colName);
    // Delete all existing
    const snap = await getDocs(colRef);
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    // Add new records
    records.forEach(r => batch.set(doc(db, colName, String(r.id)), r));
    await batch.commit();
    // Data-loss guard bilan mos: qasddan yozilgan to'plamni backup'ga ham yozamiz
    setLocalCollectionBackup(colName, Array.isArray(records) ? records : []);
  } catch(e){ console.error('fbSaveCollection error:', e); }
};

// Delete entire collection from Firebase
window.fbDeleteCollection = async function(colName){
  try {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    if(snap.empty){ setLocalCollectionBackup(colName, []); return; }
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    // Qasddan tozalash — backup'ni ham bo'shatamiz, aks holda data-loss guard
    // keyingi reload'da o'chirilgan yozuvlarni qaytadan tiriltiradi.
    setLocalCollectionBackup(colName, []);
    console.log('🗑 Firebase: '+colName+' — '+snap.size+' ta yozuv o\'chirildi');
  } catch(e){ console.error('fbDeleteCollection error:', e); }
};

// Auth state ni kutish — sayt faqat login qilganlar uchun ochiq, shuning uchun
// Firestore so'rovlari auth tugaguncha kutadi. publicRead → isAuthed bo'ldi —
// anonim so'rov endi permission-denied qaytaradi.
window._fbLoadStarted = false;
function _kickoffFirstFirestoreLoad(){
  if(window._fbLoadStarted) return;
  if(!window._currentUser) return; // hali login qilinmagan
  window._fbLoadStarted = true;
  try{
    var urlParams = new URLSearchParams(window.location.search);
    var pageFromUrl = urlParams.get('page');
    if(pageFromUrl && typeof showPage==='function'){
      showPage(pageFromUrl);
    } else if(typeof showPage==='function'){
      showPage('myteam');
    }
  }catch(e){ if(typeof showPage==='function') showPage('myteam'); }
  loadFromFirestore();
}

// Wait for DB to be defined, then prepare UI and arm auth listener
function waitForDB(){
  if(typeof DB !== 'undefined' && typeof renderAll === 'function'){
    // Restore saved language (auth talab qilinmaydi — UI qoladi)
    const savedLang = localStorage.getItem('_lang');
    if(savedLang && ['uz','ru','en'].includes(savedLang)){
      window.currentLang = savedLang;
      document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.remove('active');
        if(b.textContent.trim().toLowerCase() === savedLang) b.classList.add('active');
      });
      var langLabel = document.getElementById('currentLangLabel');
      if(langLabel) langLabel.textContent = savedLang.toUpperCase();
      if(savedLang !== 'uz' && typeof autoTranslatePage === 'function'){
        [500, 2000, 5000, 10000].forEach(function(delay){
          setTimeout(function(){ autoTranslatePage(savedLang); }, delay);
        });
      }
    }
    // Agar auth allaqachon hal qilingan bo'lsa (refresh holatida), darrov ishga tushir
    _kickoffFirstFirestoreLoad();
    // Aks holda auth qachon o'rnatilsa, polling orqali aniqlaymiz
    var pollAuth = setInterval(function(){
      if(window._currentUser){
        clearInterval(pollAuth);
        _kickoffFirstFirestoreLoad();
      }
    }, 200);
    // 5 daqiqa ichida auth bo'lmasa, polling to'xtaydi (login qilmagan visitor)
    setTimeout(function(){ clearInterval(pollAuth); }, 5 * 60 * 1000);
  } else {
    setTimeout(waitForDB, 100);
  }
}
waitForDB();
