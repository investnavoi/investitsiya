/* ═══════════════════════════════════════
   ADMIN LOGIN (Firebase Auth)
   Email whitelist + custom claim based admin role
═══════════════════════════════════════ */

function openAdminOrLogin(tab='tab-investors'){
  if(window.isAdmin){
    switchAdminTab(tab.replace('tab-',''));
    showPage('admin');
    return;
  }
  pendingAdminTab = tab;
  const overlay = document.getElementById('loginOverlay');
  if(overlay) overlay.classList.add('open');
  setTimeout(function(){
    const i = document.getElementById('loginInput');
    if(i) i.focus();
  }, 200);
}
window.openAdminOrLogin = openAdminOrLogin;

function closeLogin(){
  const overlay = document.getElementById('loginOverlay');
  if(overlay) overlay.classList.remove('open');
  const err = document.getElementById('loginErr');
  if(err){ err.style.display = 'none'; err.textContent = ''; }
  const li = document.getElementById('loginInput');
  if(li) li.value = '';
  const pi = document.getElementById('passInput');
  if(pi) pi.value = '';
}
window.closeLogin = closeLogin;

async function doLogin(){
  const li = document.getElementById('loginInput');
  const pi = document.getElementById('passInput');
  const errEl = document.getElementById('loginErr');
  const btn = document.getElementById('loginBtn');
  const email = li ? li.value.trim() : '';
  const password = pi ? pi.value : '';

  if(!email || !password){
    if(errEl){ errEl.textContent = 'Email va parolni kiriting'; errEl.style.display = 'block'; }
    return;
  }
  if(errEl){ errEl.style.display = 'none'; errEl.textContent = ''; }
  if(btn){ btn.disabled = true; btn.textContent = 'Kirmoqda...'; }

  try {
    if(typeof window.fbLogin !== 'function'){
      throw new Error('Firebase Auth hali yuklanmagan, biroz kuting');
    }
    const user = await window.fbLogin(email, password);
    /* onAuthStateChanged in firebase-auth.js will apply UI updates */
    closeLogin();
    if(typeof toast === 'function'){
      toast('✅ Xush kelibsiz, ' + (user.displayName || user.email));
    }
    /* Wait for auth state to apply, then navigate */
    setTimeout(function(){
      if(window.isAdmin && pendingAdminTab){
        switchAdminTab(pendingAdminTab.replace('tab-',''));
        pendingAdminTab = null;
        showPage('admin');
      } else if(window.isAdmin){
        showPage('admin');
      }
    }, 500);
  } catch(err){
    const msg = err && err.message ? err.message : 'Kirishda xatolik';
    if(errEl){ errEl.textContent = msg; errEl.style.display = 'block'; }
  } finally {
    if(btn){ btn.disabled = false; btn.textContent = 'Kirish'; }
  }
}
window.doLogin = doLogin;

async function logoutAdmin(){
  try {
    if(typeof window.fbLogout === 'function') await window.fbLogout();
  } catch(e){}
  /* Clear local caches that should not persist across users */
  try { localStorage.removeItem('_adminLoggedIn'); } catch(e){}
  if(typeof toast === 'function') toast('🚪 Chiqildi');
  showPage('investors');
}
window.logoutAdmin = logoutAdmin;

async function forgotPassword(){
  const li = document.getElementById('loginInput');
  const errEl = document.getElementById('loginErr');
  const email = li ? li.value.trim() : '';
  if(!email){
    if(errEl){ errEl.textContent = 'Email kiriting'; errEl.style.display = 'block'; }
    return;
  }
  try {
    if(typeof window.fbSendPasswordReset !== 'function') throw new Error('Auth yuklanmagan');
    await window.fbSendPasswordReset(email);
    if(errEl){
      errEl.style.color = '#059669';
      errEl.style.background = '#ECFDF5';
      errEl.style.borderColor = '#A7F3D0';
      errEl.textContent = 'Parol tiklash havolasi ' + email + ' ga yuborildi';
      errEl.style.display = 'block';
    }
  } catch(err){
    if(errEl){
      errEl.textContent = (err && err.message) ? err.message : 'Yuborishda xatolik';
      errEl.style.display = 'block';
    }
  }
}
window.forgotPassword = forgotPassword;

function applyAdminUI(admin, user){
  /* Auth gate — login qilingan bo'lsa saytni ochamiz, aks holda gate ko'rinadi */
  try {
    document.body.dataset.auth = user ? 'true' : 'false';
    /* Login qilingach: chatbot/dot reset, oldingi user qoldiqlari tozalansin */
    if(user && typeof window.resetChat === 'function'){
      /* faqat user almashganda chat tarixini tozalash kerak emas — qoldiramiz */
    }
  } catch(e){}

  const av = document.getElementById('navAvatar');
  const un = document.getElementById('navUname');
  const lbl = document.getElementById('adminTabLabel');
  /* Joriy jamoa a'zosi (login emaili bo'yicha) — ism/rolni shundan olamiz */
  var member = (typeof getCurrentMember === 'function') ? getCurrentMember() : null;
  if(av) av.textContent = member ? String(member.name || 'X').charAt(0).toUpperCase()
    : (user ? String(user.email || 'X').charAt(0).toUpperCase() : 'B');
  if(un){
    if(member) un.textContent = member.name;
    else if(user) un.textContent = user.displayName || user.email || "Foydalanuvchi";
    else un.textContent = "Bo'lim Xodimi";
  }
  if(lbl) lbl.textContent = member ? member.roleLabel : (user ? 'Profil' : 'Kirish');
  /* RBAC — nav elementlarini rol bo'yicha ko'rsatish/yashirish */
  if(typeof applyRoleNav === 'function') applyRoleNav();
  const ijLock = document.getElementById('ijLockOverlay');
  if(ijLock) ijLock.classList.toggle('hidden', admin);
  /* Show/hide admin-only UI elements */
  document.querySelectorAll('[data-admin-only]').forEach(function(el){
    el.style.display = admin ? '' : 'none';
  });
  /* Show/hide auth-required elements */
  document.querySelectorAll('[data-auth-only]').forEach(function(el){
    el.style.display = user ? '' : 'none';
  });
  /* Show/hide guest-only elements */
  document.querySelectorAll('[data-guest-only]').forEach(function(el){
    el.style.display = user ? 'none' : '';
  });
}
window.applyAdminUI = applyAdminUI;

/* If auth state was already restored before this script loaded, re-apply UI */
if(window._currentUser || window.isAdmin){
  applyAdminUI(!!window.isAdmin, window._currentUser || null);
}
