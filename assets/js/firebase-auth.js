/* ═══════════════════════════════════════
   FIREBASE AUTH MODULE
   Handles: login, logout, role claims, email whitelist
═══════════════════════════════════════ */
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

/* Allowed email domains — empty means any email allowed (relies on manual user creation) */
const ALLOWED_EMAIL_DOMAINS = [];
window.ALLOWED_EMAIL_DOMAINS = ALLOWED_EMAIL_DOMAINS;

function isEmailWhitelisted(email){
  if(!email) return false;
  if(ALLOWED_EMAIL_DOMAINS.length === 0) return true;
  const e = String(email).toLowerCase().trim();
  return ALLOWED_EMAIL_DOMAINS.some(function(d){ return e.endsWith('@' + d); });
}
window.isEmailWhitelisted = isEmailWhitelisted;

/* Wait for Firebase app to be initialized */
function getFirebaseApp(){
  return new Promise(function(resolve){
    if(window.fbApp) return resolve(window.fbApp);
    const check = setInterval(function(){
      if(window.fbApp){
        clearInterval(check);
        resolve(window.fbApp);
      }
    }, 50);
  });
}

/* Initialize auth with persistent session */
async function initAuth(){
  const app = await getFirebaseApp();
  const auth = getAuth(app);
  window._fbAuth = auth;

  try { await setPersistence(auth, browserLocalPersistence); } catch(e){}

  /* Listen for auth state changes — runs on login, logout, token refresh */
  onAuthStateChanged(auth, async function(user){
    if(user){
      const email = String(user.email || '').toLowerCase();
      if(!isEmailWhitelisted(email)){
        /* Not whitelisted → sign out immediately */
        console.warn('Email not whitelisted, signing out:', email);
        try { await signOut(auth); } catch(e){}
        if(typeof toast === 'function') toast('⛔ Email ruxsat etilmagan');
        applyAuthState(null);
        return;
      }
      /* Get ID token with custom claims */
      try {
        const tokenResult = await user.getIdTokenResult(true);
        const isAdminUser = tokenResult.claims && tokenResult.claims.admin === true;
        applyAuthState({ user: user, isAdmin: isAdminUser });
      } catch(e){
        console.error('Token fetch error:', e);
        applyAuthState({ user: user, isAdmin: false });
      }
    } else {
      applyAuthState(null);
    }
  });
}

/* Central handler — updates global state + UI */
function applyAuthState(state){
  if(state && state.user){
    window._currentUser = state.user;
    window.isAdmin = !!state.isAdmin;
    if(typeof applyAdminUI === 'function') applyAdminUI(!!state.isAdmin, state.user);
    /* Cache minimal session flag (NOT trusted — server enforces via Firestore rules) */
    try {
      localStorage.setItem('_auth_uid', state.user.uid);
      localStorage.setItem('_auth_email', state.user.email || '');
      localStorage.setItem('_auth_admin', state.isAdmin ? '1' : '0');
    } catch(e){}
    /* Pull cross-device user settings from Firebase (theme, lang, Gmail config, prefs) */
    try { if(typeof window.loadUserSettings === 'function') window.loadUserSettings(); } catch(e){}
  } else {
    window._currentUser = null;
    window.isAdmin = false;
    if(typeof applyAdminUI === 'function') applyAdminUI(false, null);
    try {
      localStorage.removeItem('_auth_uid');
      localStorage.removeItem('_auth_email');
      localStorage.removeItem('_auth_admin');
      localStorage.removeItem('_adminLoggedIn');
    } catch(e){}
  }
  /* Re-render admin-sensitive UI */
  if(typeof renderInvestorCompanies === 'function') renderInvestorCompanies();
  if(typeof renderAdminLists === 'function') renderAdminLists();
}

/* Email/password login */
window.fbLogin = async function(email, password){
  const e = String(email || '').toLowerCase().trim();
  if(!isEmailWhitelisted(e)){
    throw new Error('Email ruxsat etilmagan: faqat ' + ALLOWED_EMAIL_DOMAINS.map(function(d){return '@'+d;}).join(', '));
  }
  if(!window._fbAuth) throw new Error('Auth initsializatsiya qilinmagan');
  try {
    const cred = await signInWithEmailAndPassword(window._fbAuth, e, password);
    return cred.user;
  } catch(err){
    const code = String(err.code || '');
    if(code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'){
      throw new Error('Email yoki parol noto\'g\'ri');
    }
    if(code === 'auth/too-many-requests'){
      throw new Error('Ko\'p urinish. Keyinroq qayta urining.');
    }
    if(code === 'auth/network-request-failed'){
      throw new Error('Tarmoqda xatolik');
    }
    throw err;
  }
};

/* Logout */
window.fbLogout = async function(){
  if(!window._fbAuth) return;
  try { await signOut(window._fbAuth); }
  catch(e){ console.error('Logout error:', e); }
};

/* Password reset */
window.fbSendPasswordReset = async function(email){
  const e = String(email || '').toLowerCase().trim();
  if(!isEmailWhitelisted(e)) throw new Error('Email ruxsat etilmagan domenda');
  if(!window._fbAuth) throw new Error('Auth initsializatsiya qilinmagan');
  await sendPasswordResetEmail(window._fbAuth, e);
};

/* Refresh token to pick up newly-set custom claims (e.g. after admin promotion) */
window.fbRefreshClaims = async function(){
  if(!window._fbAuth || !window._fbAuth.currentUser) return null;
  try {
    const tokenResult = await window._fbAuth.currentUser.getIdTokenResult(true);
    const isAdminUser = tokenResult.claims && tokenResult.claims.admin === true;
    window.isAdmin = !!isAdminUser;
    if(typeof applyAdminUI === 'function') applyAdminUI(!!isAdminUser, window._fbAuth.currentUser);
    return tokenResult.claims;
  } catch(e){
    console.error('Refresh claims error:', e);
    return null;
  }
};

/* Guard helper — require admin for sensitive actions */
window.requireAdmin = function(action){
  if(!window.isAdmin){
    if(typeof toast === 'function') toast('⛔ Bu amalni faqat admin bajara oladi');
    return false;
  }
  return true;
};

/* Guard helper — require authenticated user */
window.requireAuth = function(){
  if(!window._currentUser){
    if(typeof toast === 'function') toast('⛔ Avval tizimga kiring');
    return false;
  }
  return true;
};

initAuth();
