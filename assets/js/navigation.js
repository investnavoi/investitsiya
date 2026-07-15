/* ═══════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════ */

function buildNavGroup(groupId, icon, label, isOpen){
  var wrap=document.createElement('div');
  wrap.className='tn-menu-group' + (isOpen ? ' open' : '');
  wrap.id='nav-group-'+groupId;

  var head=document.createElement('button');
  head.className='tn-group-head' + (isOpen ? ' open' : '');
  head.id='nav-group-head-'+groupId;
  head.type='button';
  head.onclick=function(){ toggleNavGroup(groupId); };
  head.innerHTML='<span class="tn-group-head-main"><span class="tn-group-icon">'+icon+'</span><span>'+label+'</span></span><span class="tn-group-caret">▾</span>';

  var body=document.createElement('div');
  body.className='tn-group-body' + (isOpen ? ' open' : '');
  body.id='nav-group-body-'+groupId;

  wrap.appendChild(head);
  wrap.appendChild(body);
  return {wrap:wrap, body:body, head:head};
}

function initGroupedNav(){
  return;
  var host=document.getElementById('tnNavGroups');
  if(!host || host.dataset.grouped==='1') return;

  var tabs = {
    overview:document.getElementById('tab-overview'),
    investors:document.getElementById('tab-investors'),
    local:document.getElementById('tab-local'),
    zoom:document.getElementById('tab-zoom'),
    forums:document.getElementById('tab-forums'),
    investor:document.getElementById('tab-investor'),
    admin:document.getElementById('tab-admin'),
    products:document.getElementById('tab-products'),
    finder:document.getElementById('tab-finder'),
    ailetter:document.getElementById('tab-ailetter'),
    pipeline:document.getElementById('tab-pipeline'),
    trade:document.getElementById('tab-trade'),
    settings:document.getElementById('tab-settings')
  };
  if(!tabs.overview || !tabs.products || !tabs.forums) return;

  var shell=document.createElement('div');
  shell.className='tn-menu-shell';

  var left=document.createElement('div');
  left.className='tn-menu-left';
  var sectionsGroup=buildNavGroup('sections','🗂',"Bo\'lim ma\'lumotlari", true);
  [tabs.overview,tabs.investors,tabs.local,tabs.zoom].forEach(function(tab){ if(tab) sectionsGroup.body.appendChild(tab); });
  var outreachGroup=buildNavGroup('outreach','📡','Outreach', false);
  [tabs.products,tabs.import,tabs.finder,tabs.ailetter,tabs.pipeline].forEach(function(tab){ if(tab) outreachGroup.body.appendChild(tab); });
  left.appendChild(sectionsGroup.wrap);
  left.appendChild(outreachGroup.wrap);

  var right=document.createElement('div');
  right.className='tn-menu-right';
  [tabs.forums,tabs.investor,tabs.trade,tabs.settings,tabs.admin].forEach(function(tab){ if(tab) right.appendChild(tab); });

  shell.appendChild(left);
  shell.appendChild(right);
  host.innerHTML='';
  host.appendChild(shell);
  host.dataset.grouped='1';
  syncNavGroups(currentPage || 'overview');
}

var SIDEBAR_GROUPS = {
  sections: ['overview','investors','local','zoom']
};

function setSidebarGroupState(groupId, isOpen){
  var wrap = document.getElementById('sb-group-'+groupId);
  var head = document.getElementById('sb-group-head-'+groupId);
  var body = document.getElementById('sb-group-body-'+groupId);
  if(!wrap || !head || !body) return;
  wrap.classList.toggle('open', !!isOpen);
  head.classList.toggle('open', !!isOpen);
  body.classList.toggle('open', !!isOpen);
}

function toggleSidebarGroup(groupId){
  var body = document.getElementById('sb-group-body-'+groupId);
  if(!body) return;
  setSidebarGroupState(groupId, !body.classList.contains('open'));
}

function syncSidebarGroups(activePage){
  return;
}

/* ═══ ApexCharts instance manager — destroy before recreate ═══ */
var _apexStore = {};
function apexRender(key, el, opts){
  if(!el) return null;
  if(_apexStore[key]){
    try{ _apexStore[key].destroy(); }catch(e){}
    delete _apexStore[key];
  }
  el.innerHTML = '';
  var chart = new ApexCharts(el, opts);
  chart.render();
  _apexStore[key] = chart;
  return chart;
}

/* ═══ Page enter animation — replay all AOS + charts smoothly ═══ */
function replayAllAnimations(container){
  if(!container || typeof AOS === 'undefined') return;
  // 1. Remove aos-animate from ALL elements globally (not just container)
  document.querySelectorAll('.aos-animate').forEach(function(el){
    el.classList.remove('aos-animate');
  });
  // 2. Force browser to paint the un-animated state
  void container.offsetHeight;
  // 3. Re-initialize AOS completely — this is what happens on first page load
  setTimeout(function(){
    AOS.init({duration:500, once:false, offset:20});
  }, 50);
}

/* ── Bo'lim ma'lumotlari sidebar collapse/expand ── */
function toggleSidebarSection(section){
  var items = document.querySelectorAll('.nav-'+section);
  var chevron = document.getElementById(section+'-chevron');
  var hidden = items.length && items[0].style.display === 'none';
  for(var i=0;i<items.length;i++){
    items[i].style.display = hidden ? '' : 'none';
  }
  if(chevron){
    chevron.style.transform = hidden ? 'rotate(0deg)' : 'rotate(-90deg)';
  }
}

var _showPageRaf = 0;
function showPage(id){
  if(id==='admin'&&!isAdmin){openAdminOrLogin();return;}
  // RBAC — rol aniqlangan (login qilingan) bo'lsa, ruxsat yo'q sahifaga kirishni to'sadi
  if(typeof getCurrentRole==='function' && getCurrentRole() && typeof canAccessPage==='function' && !canAccessPage(id)){
    if(typeof toast==='function') toast('⛔ Bu sahifaga ruxsatingiz yo\'q');
    id = 'myteam';
  }
  if(_showPageRaf) cancelAnimationFrame(_showPageRaf);
  _showPageRaf = requestAnimationFrame(function(){
    _showPageInner(id);
  });
}

function _showPageInner(id){
  if(typeof applyRoleNav === 'function') applyRoleNav();
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.querySelectorAll('.tn-tab, .sb-tab').forEach(function(t){ t.classList.remove('active'); });
  var pg=document.getElementById('page-'+id);
  if(pg) pg.classList.add('active');
  var tb=document.getElementById('tab-'+id);
  if(tb) tb.classList.add('active');
  document.querySelectorAll('#sidebar-menu .nav-link').forEach(function(a){ a.classList.remove('active'); });
  var sidebarLink = document.querySelector('#tab-' + id);
  if(sidebarLink) sidebarLink.classList.add('active');
  currentPage=id;
  // URL parametrini yangilash (sahifa yangilanganda shu bo'limda qolish uchun)
  try{
    var url = new URL(window.location.href);
    url.searchParams.set('page', id);
    window.history.replaceState(null, '', url.toString());
  }catch(e){}
  var titles={
    overview:"Umumiy ma'lumotlar",
    myteam:'Dashboard',
    investors:'Investorlar tashriflari',
    local:'Mahalliy tadbirkorlar',
    zoom:'Zoom uchrashuvlar',
    forums:'Forumlar',
    investor:'Investorlar bazasi',
    products:'Mahsulotlar',
    import:'Import Tahlili',
    finder:'Kompaniya qidiruvi',
    pipeline:'Outreach statistikasi',
    trade:'Jahon tashqi savdosi',
    settings:'Sozlamalar',
    admin:'Admin Panel'
  };
  var titleEl=document.getElementById('topbarTitle');
  if(titleEl) titleEl.textContent=titles[id]||id;

  // Re-trigger page enter animation — CSS class toggle (reflow yo'q)
  if(pg){
    pg.classList.remove('page-anim-restart');
    requestAnimationFrame(function(){ pg.classList.add('page-anim-restart'); });
  }

  // Scroll to top
  window.scrollTo(0, 0);

  // Render section content
  if(id==='overview')renderOverview();
  else if(id==='myteam'){ if(typeof renderMyPage==='function') renderMyPage(); }
  else if(id==='investors')renderInvestors();
  else if(id==='local')renderLocal();
  else if(id==='zoom')renderZoom();
  else if(id==='forums'){renderForums();renderIntlForums();}
  else if(id==='investor'){
    renderInvestorCompanies();
    var geoCompanies = window._pendingInvestorGeoCompanies || (DB.investorCompanies||[]).concat(DB.finderResults||[]);
    window._pendingInvestorGeoCompanies = null;
    setTimeout(function(){ renderInvestorGeoCard(geoCompanies); }, 150);
  }
  else if(id==='admin')renderAdminLists();
  else if(id==='products'){
    var _doRenderProducts = function(){ if(typeof renderProducts==='function') renderProducts(); };
    if(window.ensureCollectionLoaded){
      Promise.all([window.ensureCollectionLoaded('rawMaterials'), window.ensureCollectionLoaded('products')])
        .then(_doRenderProducts);
    } else { _doRenderProducts(); }
  }
  else if(id==='import'){
    var _doImport = function(){ if(typeof populateProductSelects==='function') populateProductSelects(); };
    if(window.ensureCollectionLoaded){
      Promise.all([window.ensureCollectionLoaded('importSnapshots'), window.ensureCollectionLoaded('rawMaterials'), window.ensureCollectionLoaded('products')])
        .then(_doImport);
    } else { _doImport(); }
  }
  else if(id==='materialai'){if(typeof renderInvestAiPage==='function')renderInvestAiPage();}
  else if(id==='finder'){if(typeof populateProductSelects==='function')populateProductSelects();if(typeof updateFinderModeUI==='function')updateFinderModeUI();if(typeof handleImportProductChange==='function')handleImportProductChange();}
  else if(id==='ailetter'){if(typeof populateProductSelects==='function')populateProductSelects();}
  else if(id==='pipeline'){
    // crmActivities kolleksiyasini yuklash (backend faoliyatlar uchun)
    var _doCrm = function(){ if(typeof renderCrmDashboard==='function') renderCrmDashboard(); };
    if(window.ensureCollectionLoaded){
      window.ensureCollectionLoaded('crmActivities').then(_doCrm).catch(_doCrm);
    } else { _doCrm(); }
  }
  else if(id==='trade'){
    // Collection'larni preload qilamiz (manual qidiruv tez ishlashi uchun), lekin
    // avtomatik oxirgi qidiruvni TIKLAMAYMIZ — foydalanuvchi o'zi davlat tanlab
    // "Qidirish" bosgandagina natija chiqsin.
    if(window.ensureCollectionLoaded){
      Promise.all([window.ensureCollectionLoaded('tradeData'), window.ensureCollectionLoaded('tradeSnapshots'), window.ensureCollectionLoaded('tradeSnapshotChunks')]);
    }
  }
  else if(id==='settings'){if(typeof mountPersonalSettings==='function')mountPersonalSettings();if(typeof loadSettings==='function')loadSettings();if(typeof checkTgStatus==='function')checkTgStatus();}

  // Re-trigger AOS animations — same as first load
  replayAllAnimations(pg);
}

/* Theme & Lang moved to assets/js/theme-lang.js */

/* Admin Login moved to assets/js/admin-login.js */

/* Admin Tabs+Forms moved to assets/js/admin-forms.js */



