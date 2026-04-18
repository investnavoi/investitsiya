import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, writeBatch, onSnapshot }
  from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
const db = getFirestore(fbApp);

// Collections: investors, local, zoom, forums, investorCompanies
const COLLECTIONS = ['investors','local','zoom','forums','investorCompanies','rawMaterials','products','tradeData','tradeSnapshots','tradeSnapshotChunks','importSnapshots','entrepreneurs'];

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

async function loadFromFirestore(){
  try {
    const loadEl = document.getElementById('fb-loading');
    if(loadEl) loadEl.style.display = 'flex';

    // 1. Show cached data instantly while Firebase loads
    var hadCache = _loadCacheAndRenderFast();
    if(hadCache && loadEl) loadEl.style.display = 'none';

    // 2. Load ALL collections + apiKeys + settings in PARALLEL
    const colPromises = COLLECTIONS.map(col =>
      getDocs(collection(db, col)).then(snap => {
        const rows = [];
        snap.forEach(d => {
          const row = d.data();
          if(row && (row.id === undefined || row.id === null || String(row.id).trim() === '')){
            row.id = d.id;
          }
          rows.push(row);
        });
        return { col, rows: _sortRows(rows) };
      })
    );
    const [colResults] = await Promise.all([
      Promise.all(colPromises),
      loadApiKeys(),
      fbLoadSettings()
    ]);

    let totalDocs = 0;
    for(const { col, rows } of colResults){
      if(col==='entrepreneurs' && rows.length===0){
        var localBackup = getLocalCollectionBackup('entrepreneurs');
        if(localBackup.length){
          rows.push.apply(rows, localBackup);
          console.log('♻️ Mahalliy tadbirkorlar local backupdan tiklandi:', localBackup.length);
        }
      }
      DB[col] = rows;
      // Cache to localStorage for next fast load
      if(rows.length) setLocalCollectionBackup(col, rows);
      totalDocs += rows.length;
    }

    // Check each collection — if empty, seed from defaults
    const DEFAULT_DB = getDefaultDB();
    const batch = writeBatch(db);
    let needSeed = false;

    for(const col of COLLECTIONS){
      if(DB[col].length === 0 && DEFAULT_DB[col] && DEFAULT_DB[col].length){
        DB[col] = DEFAULT_DB[col];
        DEFAULT_DB[col].forEach(r => {
          batch.set(doc(db, col, String(r.id)), r);
        });
        needSeed = true;
        console.log(`Seeding: ${col} (${DEFAULT_DB[col].length} ta)`);
      }
    }

    if(needSeed){
      await batch.commit();
      console.log('✅ Default ma\'lumotlar Firebase ga yozildi');
    }

    if(loadEl) loadEl.style.display = 'none';
    renderAll();
    renderOverview();
    if(typeof applyTranslations==='function') applyTranslations();
    console.log('✅ Firebase: ma\'lumotlar yuklandi. Jami:', totalDocs);
  } catch(e){
    console.error('Firebase load error:', e);
    const loadEl = document.getElementById('fb-loading');
    if(loadEl) loadEl.style.display = 'none';
    renderAll();
    renderOverview();
    if(typeof applyTranslations==='function') applyTranslations();
  }
}

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
    if(colName==='entrepreneurs'){
      var list = Array.isArray(DB.entrepreneurs) ? DB.entrepreneurs : [];
      setLocalCollectionBackup('entrepreneurs', list.filter(function(item){ return String(item.id)!==String(id); }));
    }
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
