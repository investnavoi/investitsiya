import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, getDocs, getDocsFromCache, deleteDoc, writeBatch, onSnapshot
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
// Firestore + IndexedDB persistent cache — 10x tezroq, offline ishlaydi
let db;
try {
  db = initializeFirestore(fbApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
  console.log('🚀 Firestore IndexedDB persistent cache yoqildi');
} catch(e){
  // Fallback to default (memory cache)
  console.warn('Persistent cache fail, using memory:', e.message);
  const { getFirestore } = await import("https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js");
  db = getFirestore(fbApp);
}

// Collections: investors, local, zoom, forums, investorCompanies
// Critical — load immediately (small, needed for first paint)
const COLLECTIONS_CRITICAL = ['investors','local','zoom','forums','investorCompanies','entrepreneurs','rawMaterials','products'];
// On-demand only — load WHEN user navigates to that page (huge: importSnapshots=512, tradeSnapshotChunks=80)
const COLLECTIONS_LAZY = ['tradeData','tradeSnapshots','tradeSnapshotChunks','importSnapshots'];
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

// Apply loaded rows to DB + cache + handle entrepreneurs fallback + seed defaults
function _applyCollectionToDb(col, rows, batchRef){
  if(col==='entrepreneurs' && rows.length===0){
    var localBackup = getLocalCollectionBackup('entrepreneurs');
    if(localBackup.length){
      rows.push.apply(rows, localBackup);
      console.log('♻️ Tadbirkorlar local backupdan tiklandi:', localBackup.length);
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
    console.error(`Lazy load error (${col}):`, e);
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

    // 1. Show cached data INSTANTLY
    var hadCache = _loadCacheAndRenderFast();
    if(hadCache && loadEl) loadEl.style.display = 'none';

    // 2. If cache is FRESH (<5 min) AND has data for ALL critical+main collections → skip Firebase
    var requiredCols = COLLECTIONS_CRITICAL.concat(['rawMaterials','products']);
    var allCached = requiredCols.every(function(c){ return Array.isArray(DB[c]) && DB[c].length > 0; });
    if(hadCache && _isCacheFresh() && allCached){
      console.log('✅ Kesh fresh + to\'liq — Firebase fetch o\'tkazib yuborildi (instant load)');
      try { await Promise.all([loadApiKeys(), fbLoadSettings()]); } catch(e){}
      COLLECTIONS.forEach(col => { window._lazyLoaded[col] = true; });
      return;
    }
    if(hadCache && _isCacheFresh() && !allCached){
      console.log('⚠️ Kesh fresh, ammo ba\'zi collectionlar bo\'sh — Firebase\'dan to\'ldirilmoqda');
    }

    // 3. Load CRITICAL collections — only those NOT already cached
    const t0 = Date.now();
    const missingCrit = COLLECTIONS_CRITICAL.filter(function(col){
      return !(Array.isArray(DB[col]) && DB[col].length > 0);
    });
    const critPromises = missingCrit.map(col =>
      _loadOneCollection(col).then(rows => ({ col, rows }))
    );
    const [critResults] = await Promise.all([
      Promise.all(critPromises),
      loadApiKeys(),
      fbLoadSettings()
    ]);

    const batchRef = { batch: writeBatch(db), needSeed: false };
    let totalDocs = 0;
    for(const { col, rows } of critResults){
      totalDocs += _applyCollectionToDb(col, rows, batchRef);
      window._lazyLoaded[col] = true;
    }
    // Mark cached critical collections as loaded too
    COLLECTIONS_CRITICAL.forEach(function(col){
      if(Array.isArray(DB[col]) && DB[col].length > 0) window._lazyLoaded[col] = true;
    });
    if(batchRef.needSeed) await batchRef.batch.commit();

    if(loadEl) loadEl.style.display = 'none';
    renderAll();
    renderOverview();
    if(typeof applyTranslations==='function') applyTranslations();
    console.log(`✅ Firebase critical: ${totalDocs} ta yozuv (${Date.now()-t0}ms)`);

    // 4. Heavy collections (tradeData, tradeSnapshots, importSnapshots) load ON DEMAND only
    //    when user navigates to that page (via showPage → ensureCollectionLoaded).
    //    No background fetch — saves bandwidth and time.
    _setCacheTimestamp();
  } catch(e){
    console.error('Firebase load error:', e);
    const loadEl = document.getElementById('fb-loading');
    if(loadEl) loadEl.style.display = 'none';
    renderAll();
    renderOverview();
    if(typeof applyTranslations==='function') applyTranslations();
  }
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
  } catch(e){ console.error('fbSave error:', e); }
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
  } catch(e){ console.error('fbSaveCollection error:', e); }
};

// Delete entire collection from Firebase
window.fbDeleteCollection = async function(colName){
  try {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    if(snap.empty) return;
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log('🗑 Firebase: '+colName+' — '+snap.size+' ta yozuv o\'chirildi');
  } catch(e){ console.error('fbDeleteCollection error:', e); }
};

// Wait for DB to be defined then load
function waitForDB(){
  if(typeof DB !== 'undefined' && typeof renderAll === 'function'){
    // Restore saved language
    const savedLang = localStorage.getItem('_lang');
    if(savedLang && ['uz','ru','en'].includes(savedLang)){
      window.currentLang = savedLang;
      document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.remove('active');
        if(b.textContent.trim().toLowerCase() === savedLang) b.classList.add('active');
      });
      var langLabel = document.getElementById('currentLangLabel');
      if(langLabel) langLabel.textContent = savedLang.toUpperCase();
      // Auto-translate after page renders if non-Uzbek
      if(savedLang !== 'uz' && typeof autoTranslatePage === 'function'){
        [500, 2000, 5000, 10000].forEach(function(delay){
          setTimeout(function(){ autoTranslatePage(savedLang); }, delay);
        });
      }
    }
    // Restore admin session
    if(localStorage.getItem('_adminLoggedIn')==='1'){
      window.isAdmin = true;
      if(typeof applyAdminUI==='function') applyAdminUI(true);
    }
    // URL ?page= parametridan sahifani darhol tiklash
    try{
      var urlParams = new URLSearchParams(window.location.search);
      var pageFromUrl = urlParams.get('page');
      if(pageFromUrl && typeof showPage==='function'){
        showPage(pageFromUrl);
      } else {
        showPage('investors');
      }
    }catch(e){ showPage('investors'); }
    loadFromFirestore();
  } else {
    setTimeout(waitForDB, 100);
  }
}
waitForDB();
