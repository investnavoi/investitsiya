/* ═══════════════════════════════════════
   ADMIN LOGIN
═══════════════════════════════════════ */
function openAdminOrLogin(tab='tab-investors'){
  if(isAdmin){
    switchAdminTab(tab.replace('tab-',''));
    showPage('admin');
    return;
  }
  pendingAdminTab=tab;
  document.getElementById('loginOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('loginInput').focus(),200);
}
function closeLogin(){
  document.getElementById('loginOverlay').classList.remove('open');
  document.getElementById('loginErr').style.display='none';
  document.getElementById('loginInput').value='';
  document.getElementById('passInput').value='';
}
function doLogin(){
  const u=document.getElementById('loginInput').value.trim();
  const p=document.getElementById('passInput').value;
  if(u==='admin'&&p==='shahzod'){
    isAdmin=true;
    localStorage.setItem('_adminLoggedIn','1');
    closeLogin();
    applyAdminUI(true);
    renderInvestorCompanies();
    renderAdminLists();
    toast('✅ Admin sifatida kirdingiz!');
    if(pendingAdminTab){
      switchAdminTab(pendingAdminTab.replace('tab-',''));
      pendingAdminTab=null;
    }
    showPage('admin');
  } else {
    document.getElementById('loginErr').style.display='block';
  }
}
function logoutAdmin(){
  isAdmin=false;
  localStorage.removeItem('_adminLoggedIn');
  applyAdminUI(false);
  renderInvestorCompanies();
  toast('🚪 Chiqildi');
  showPage('investors');
}
function applyAdminUI(admin){
  document.getElementById('navAvatar').textContent = admin ? 'A' : 'B';
  document.getElementById('navUname').textContent  = admin ? 'Admin' : "Bo'lim Xodimi";
  document.getElementById('adminTabLabel').textContent = admin ? 'Admin Panel' : 'Kirish';
  const ijLock = document.getElementById('ijLockOverlay');
  if(ijLock) ijLock.classList.toggle('hidden', admin);
}
