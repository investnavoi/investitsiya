/* ═══════════════════════════════════════════════════════════════
   TEAM.JS — Jamoa, lead egaligi (Mas'ul), band qilish va status tizimi
   ─────────────────────────────────────────────────────────────────
   Maqsad: 7 kishilik jamoada leadlar chalkashmasligi, bir leadga ikki
   marta email ketmasligi, har lead kimga tegishli ekani ko'rinishi.

   Dizayn: hozircha config asosida (TEAM_MEMBERS), lekin keyin Firestore/
   auth bilan kengaytirishga tayyor. Lead egaligi RECORD ustida saqlanadi
   (assignedTo, reservedBy, status, activityLog) — mavjud fbSave + data-loss
   backup infratuzilmasidan foydalanadi, alohida kolleksiya talab qilmaydi.

   MUHIM: hech qanday hudud/davlat biriktirish YO'Q — faqat shaxsiy egalik.
═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  /* ── Jamoa a'zolari va rollari ────────────────────────────────────
     role: 'superadmin' | 'admin' | 'member'
       - superadmin (Azizbek, texnik lead): HAMMA narsani ko'radi — sozlamalar,
         admin panel, boshqa ma'lumotlar.
       - admin (Shahzod): monitoring + koordinatsiya (CRM/statistika), lekin
         sozlamalar va texnik/boshqa ma'lumotlar ko'rinmaydi.
       - member (qolgan outreach a'zolar): FAQAT o'z dashboardi (shaxsiy +
         jamoa statistikasi) va ish sahifalari (leadlar, qidiruv, mahsulotlar).
     email: tizimga KIRISH emaili — kimligini shu bo'yicha aniqlaymiz. Har a'zoning
     haqiqiy login emailini shu yerga yozing (bo'sh bo'lsa u 'member' darajasida
     cheklangan ko'rinishda bo'ladi — xavfsizlik uchun eng past huquq).  */
  window.TEAM_MEMBERS = window.TEAM_MEMBERS || [
    { id:'azizbek', name:'Azizbek', roleLabel:"Texnik lead (superadmin)", role:'superadmin', email:'bltvazbk@gmail.com' },
    { id:'azizbek_out', name:'Azizbek (outreach)', roleLabel:"Lead outreach", role:'member', email:'azizbek.investnavoi@gmail.com' },
    { id:'shahzod', name:'Shahzod', roleLabel:"Monitoring + Koordinator (admin)", role:'admin', email:'' },
    { id:'suhrob',  name:'Suhrob',  roleLabel:"Lead outreach",            role:'member', email:'' },
    { id:'azo4',    name:"A'zo 4",  roleLabel:"Lead outreach",            role:'member', email:'' },
    { id:'azo5',    name:"A'zo 5",  roleLabel:"Lead outreach",            role:'member', email:'' },
    { id:'azo6',    name:"A'zo 6",  roleLabel:"Lead outreach",            role:'member', email:'' },
    { id:'azo7',    name:"A'zo 7",  roleLabel:"Lead outreach",            role:'member', email:'' }
  ];

  /* Rol darajalari — kattaroq raqam = kengroq huquq */
  window.ROLE_RANK = { member:1, admin:2, superadmin:3 };

  /* Sahifa kirish nazorati — har sahifa uchun MINIMUM rol.
     Ro'yxatda yo'q sahifa = superadmin only (fail-closed, xavfsiz). */
  // HAMMA sahifa barcha foydalanuvchilarga KO'RINADI. Rol farqi = KO'RISH vs TAHRIRLASH
  // (edit huquqi isAdmin/canWorkLeads orqali cheklanadi, sahifani yashirish orqali emas).
  window.PAGE_ACCESS = {
    myteam:'member',     // Dashboard — hammaning shaxsiy uy sahifasi
    // Bo'lim ma'lumotlari
    investors:'member',  // Investorlar tashriflari
    local:'member',      // Mahalliy tadbirkorlar
    zoom:'member',       // Zoom uchrashuvlar
    // Mahsulot outreach
    products:'member',   // Mahsulotlar
    finder:'member',     // Kompaniya qidiruvi
    investor:'member',   // Investorlar bazasi (leadlar)
    pipeline:'member',   // Outreach statistikasi
    // Forum outreach
    trade:'member',      // Jahon tashqi savdosi
    forums:'member',     // Forumlar
    // qo'shimcha ish sahifalari
    import:'member', ailetter:'member', materialai:'member', overview:'member',
    // Sozlamalar — hamma kiradi (shaxsiy sozlamalar); global bo'limlar ichida
    // faqat superadminga ko'rinadi (data-role-min="superadmin").
    settings:'member',
    admin:'superadmin'   // Admin panel — faqat superadmin
  };

  /* Rol imkoniyatlari (capabilities):
       editGlobal — global ma'lumot/sozlamalarni tahrirlash (qo'shish/o'chirish, settings).
       workLeads  — o'z leadlari bilan ishlash (email yuborish, status, mas'ul, band qilish).
     - superadmin (Azizbek): hammasini ko'radi VA tahrirlaydi.
     - admin (Shahzod): hammasini KO'RADI, lekin TAHRIRLAMAYDI (view-only).
     - member (outreach): o'z leadlari bilan ishlaydi; global tahrir yo'q. */
  window.ROLE_CAPS = {
    superadmin: { editGlobal:true,  workLeads:true },
    admin:      { editGlobal:false, workLeads:false },
    member:     { editGlobal:false, workLeads:true }
  };
  function caps(){ return (window.ROLE_CAPS && window.ROLE_CAPS[getCurrentRole()]) || { editGlobal:false, workLeads:false }; }
  window.canEditGlobal = function(){ return !!caps().editGlobal; };
  window.canWorkLeads  = function(){ return !!caps().workLeads; };

  function members(){ return Array.isArray(window.TEAM_MEMBERS) ? window.TEAM_MEMBERS : []; }

  function teamMemberById(id){
    if(!id) return null;
    var s = String(id).toLowerCase();
    return members().find(function(m){ return String(m.id).toLowerCase() === s; }) || null;
  }
  function teamMemberByEmail(email){
    if(!email) return null;
    var e = String(email).toLowerCase().trim();
    return members().find(function(m){ return m.email && String(m.email).toLowerCase().trim() === e; }) || null;
  }

  /* Joriy foydalanuvchi — FAQAT tizimga kirish (login) emaili bo'yicha aniqlanadi.
     Rol/huquqlar shundan olinadi. O'zini qo'lda tanlash (self-elevation) YO'Q. */
  function currentAuthEmail(){
    try {
      return String((window._currentUser && window._currentUser.email)
        || localStorage.getItem('_auth_email') || '').toLowerCase().trim();
    } catch(e){ return ''; }
  }
  function getCurrentMember(){ return teamMemberByEmail(currentAuthEmail()); }
  function getCurrentMemberId(){ var m = getCurrentMember(); return m ? m.id : ''; }
  function getCurrentRole(){
    var m = getCurrentMember();
    if(m && m.role) return m.role;
    return currentAuthEmail() ? 'member' : null; // tanilmagan email → eng past huquq
  }
  window.getCurrentRole = getCurrentRole;
  window.getCurrentMember = getCurrentMember;
  window.getCurrentMemberId = getCurrentMemberId;

  /* window.isAdmin ni ROL bo'yicha sinxronlash — global tahrir huquqi faqat superadminda.
     Bu Firebase custom-claim'ga bog'liqlikni yo'qotadi: superadmin login qilsa darrov
     hamma amalni bajaradi, sahifa almashganda qayta-qayta login so'ralmaydi. */
  function syncRoleAdmin(){ try { window.isAdmin = window.canEditGlobal(); } catch(e){} }
  window.syncRoleAdmin = syncRoleAdmin;

  /* ── Sahifa kirish nazorati (RBAC) ─────────────────────────────── */
  function roleRank(role){ return (window.ROLE_RANK && window.ROLE_RANK[role]) || 0; }
  function canAccessPage(pageId){
    var required = (window.PAGE_ACCESS && window.PAGE_ACCESS[pageId]) || 'superadmin'; // fail-closed
    var role = getCurrentRole();
    if(!role) return false;
    return roleRank(role) >= roleRank(required);
  }
  window.canAccessPage = canAccessPage;

  /* Sidebar nav + [data-role-min] elementlarni rol bo'yicha ko'rsatish/yashirish */
  function applyRoleNav(){
    var role = getCurrentRole();
    document.querySelectorAll('#sidebar-menu a[id^="tab-"]').forEach(function(a){
      var pid = a.id.slice(4);
      var li = a.closest ? a.closest('li') : a.parentNode;
      if(li) li.style.display = canAccessPage(pid) ? '' : 'none';
    });
    document.querySelectorAll('[data-role-min]').forEach(function(el){
      var req = el.getAttribute('data-role-min') || 'superadmin';
      el.style.display = (roleRank(role) >= roleRank(req)) ? '' : 'none';
    });
    // Bo'sh bo'lib qolgan "Sozlamalar" ajratuvchisini ham yashiramiz (superadmin bo'lmasa)
    var settingsDivider = document.getElementById('nav-settings-divider');
    if(settingsDivider) settingsDivider.style.display = canAccessPage('settings') ? '' : 'none';
  }
  window.applyRoleNav = applyRoleNav;

  /* ── Lead status enum ──────────────────────────────────────────── */
  window.LEAD_STATUSES = ['new','email_sent','replied','meeting','loi','contract','not_interested'];
  window.LEAD_STATUS_LABELS = {
    'new':'Yangi',
    'email_sent':'Email yuborilgan',
    'replied':'Javob keldi',
    'meeting':'Uchrashuv',
    'loi':'LOI',
    'contract':'Shartnoma',
    'not_interested':'Qiziqmadi'
  };
  window.LEAD_STATUS_COLORS = {
    'new':'#6B7280','email_sent':'#3B82F6','replied':'#8B5CF6',
    'meeting':'#0EA5E9','loi':'#D97706','contract':'#059669','not_interested':'#EF4444'
  };
  function getLeadStatus(rec){
    if(!rec) return 'new';
    if(rec.status && window.LEAD_STATUSES.indexOf(rec.status) !== -1) return rec.status;
    // Eski yozuvlar uchun fallback — emailSent bo'lsa "email_sent"
    if(rec.emailSent) return 'email_sent';
    return 'new';
  }
  window.getLeadStatus = getLeadStatus;

  /* ── Kompaniya nomini normalize qilish (dublikat aniqlash uchun) ── */
  function normalizeCompanyName(name){
    var s = String(name || '').toLowerCase().trim();
    if(!s) return '';
    // Diakritika va ortiqcha belgilarni soddalashtirish
    s = s.replace(/["'`’.,]/g,' ');
    s = s.replace(/&/g,' and ');
    // Keng tarqalgan yuridik shakl qo'shimchalarini olib tashlash
    s = s.replace(/\b(co|company|corp|corporation|inc|incorporated|ltd|limited|llc|llp|gmbh|ag|plc|sa|srl|bv|nv|pte|pvt|jsc|ojsc|pjsc|oao|ooo|zao|group|holding|holdings|industries|international|intl|trading|import|export|imp|exp)\b/g,' ');
    s = s.replace(/[^a-z0-9Ѐ-ӿ ]+/g,' '); // harflar/raqamlar/kirill qoladi
    s = s.replace(/\s+/g,' ').trim();
    return s;
  }
  window.normalizeCompanyName = normalizeCompanyName;

  /* DB.investorCompanies ichida shu nomli lead bormi? (excludeId — o'zini hisobga olmaslik) */
  function findDuplicateCompany(name, excludeId){
    var key = normalizeCompanyName(name);
    if(!key) return null;
    var list = (typeof DB !== "undefined" && Array.isArray(DB.investorCompanies)) ? DB.investorCompanies : [];
    return list.find(function(r){
      if(excludeId != null && String(r.id) === String(excludeId)) return false;
      return normalizeCompanyName(r.kompaniya) === key;
    }) || null;
  }
  window.findDuplicateCompany = findDuplicateCompany;
  window.isDuplicateCompany = function(name, excludeId){ return !!findDuplicateCompany(name, excludeId); };

  /* ── Yordamchi: record'ni DB.investorCompanies dan topish ──────── */
  function findRec(id){
    var list = (typeof DB !== "undefined" && Array.isArray(DB.investorCompanies)) ? DB.investorCompanies : [];
    return list.find(function(r){ return String(r.id) === String(id); }) || null;
  }

  /* ── Activity log ──────────────────────────────────────────────── */
  function logLeadActivity(rec, action, detail){
    if(!rec) return;
    if(!Array.isArray(rec.activityLog)) rec.activityLog = [];
    var me = getCurrentMember();
    rec.activityLog.push({
      at: new Date().toISOString(),
      by: me ? me.id : (currentAuthEmail() || 'unknown'),
      action: String(action||''),
      detail: String(detail||'')
    });
    // Log cheksiz o'smasin — oxirgi 50 tasi yetarli
    if(rec.activityLog.length > 50) rec.activityLog = rec.activityLog.slice(-50);
    rec.lastActivityAt = new Date().toISOString();
    rec.updatedBy = me ? me.id : (currentAuthEmail() || '');
    rec.updatedAt = new Date().toISOString();
  }
  window.logLeadActivity = logLeadActivity;

  /* ── Lead egaligi (Mas'ul) ─────────────────────────────────────── */
  function getLeadOwner(rec){ return rec && rec.assignedTo ? String(rec.assignedTo) : ''; }
  window.getLeadOwner = getLeadOwner;

  function isLeadMine(rec){
    var mine = getCurrentMemberId();
    return !!mine && getLeadOwner(rec) === mine;
  }
  window.isLeadMine = isLeadMine;

  function assignLeadOwner(recId, memberId){
    var rec = findRec(recId);
    if(!rec) return;
    var prev = rec.assignedTo || '';
    rec.assignedTo = memberId ? String(memberId) : '';
    if(!rec.createdBy){ // eski yozuvlarda createdBy bo'lmasligi mumkin
      var me = getCurrentMember();
      rec.createdBy = me ? me.id : (currentAuthEmail() || '');
    }
    logLeadActivity(rec, 'assign', memberId
      ? ('Mas\'ul: ' + memberName(memberId))
      : 'Mas\'ul olib tashlandi');
    if(typeof fbSave === 'function') fbSave('investorCompanies', rec);
    if(typeof toast === 'function'){
      toast(memberId ? ('👤 Mas\'ul: ' + memberName(memberId)) : '👤 Mas\'ul olib tashlandi');
    }
    rerenderIc();
  }
  window.assignLeadOwner = assignLeadOwner;

  function memberName(id){
    if(!id) return "Mas'ul biriktirilmagan";
    var m = teamMemberById(id);
    return m ? m.name : String(id);
  }
  window.memberName = memberName;

  /* ── Band qilish (reserve / in-progress) ───────────────────────── */
  function getReservation(rec){
    if(!rec || !rec.reservedBy) return null;
    return { by: String(rec.reservedBy), at: rec.reservedAt || '' };
  }
  window.getReservation = getReservation;

  function isReservedByOther(rec){
    var r = getReservation(rec);
    if(!r) return false;
    var mine = getCurrentMemberId();
    return !!mine ? (r.by !== mine) : true; // kim ekaningiz noma'lum bo'lsa — ehtiyot chorasi
  }
  window.isReservedByOther = isReservedByOther;

  function reserveLead(recId){
    var rec = findRec(recId);
    if(!rec) return;
    if(isReservedByOther(rec)){
      var r = getReservation(rec);
      if(typeof toast === 'function') toast('🔒 Bu lead allaqachon ' + memberName(r.by) + ' tomonidan band qilingan','error');
      return;
    }
    var me = getCurrentMember();
    rec.reservedBy = me ? me.id : (currentAuthEmail() || 'unknown');
    rec.reservedAt = new Date().toISOString();
    logLeadActivity(rec, 'reserve', 'Band qilindi');
    if(typeof fbSave === 'function') fbSave('investorCompanies', rec);
    if(typeof toast === 'function') toast('🔒 Lead band qilindi — endi u sizniki');
    rerenderIc();
  }
  window.reserveLead = reserveLead;

  function releaseLead(recId){
    var rec = findRec(recId);
    if(!rec) return;
    if(isReservedByOther(rec)){
      var r = getReservation(rec);
      if(typeof toast === 'function') toast('🔒 Buni faqat ' + memberName(r.by) + ' bo\'shata oladi','error');
      return;
    }
    rec.reservedBy = '';
    rec.reservedAt = '';
    logLeadActivity(rec, 'release', 'Band bo\'shatildi');
    if(typeof fbSave === 'function') fbSave('investorCompanies', rec);
    if(typeof toast === 'function') toast('🔓 Lead bo\'shatildi');
    rerenderIc();
  }
  window.releaseLead = releaseLead;

  /* ── "Mening leadlarim" / owner filtri ─────────────────────────── */
  window._icOwnerFilter = window._icOwnerFilter || ''; // '' | 'mine' | 'unassigned'
  function setOwnerFilter(mode){
    window._icOwnerFilter = (window._icOwnerFilter === mode) ? '' : mode;
    updateOwnerFilterButtons();
    rerenderIc();
  }
  window.setOwnerFilter = setOwnerFilter;
  window.toggleMyLeadsFilter = function(){ setOwnerFilter('mine'); };

  function applyOwnerFilterToGroups(groups){
    var mode = window._icOwnerFilter;
    if(!mode || !Array.isArray(groups)) return groups;
    var mine = getCurrentMemberId();
    return groups.filter(function(g){
      var rec = (g && Array.isArray(g.records) && g.records[0]) ? g.records[0] : null;
      var owner = getLeadOwner(rec);
      if(mode === 'mine') return !!mine && owner === mine;
      if(mode === 'unassigned') return !owner;
      return true;
    });
  }
  window.applyOwnerFilterToGroups = applyOwnerFilterToGroups;

  function updateOwnerFilterButtons(){
    var mineBtn = document.getElementById('icMyLeadsBtn');
    var unBtn = document.getElementById('icUnassignedBtn');
    if(mineBtn) mineBtn.setAttribute('data-active', window._icOwnerFilter === 'mine' ? '1' : '0');
    if(unBtn) unBtn.setAttribute('data-active', window._icOwnerFilter === 'unassigned' ? '1' : '0');
    if(mineBtn) mineBtn.style.background = window._icOwnerFilter === 'mine' ? '#4361EE' : 'var(--ta-gray-100)';
    if(mineBtn) mineBtn.style.color = window._icOwnerFilter === 'mine' ? '#fff' : 'var(--ta-gray-700)';
    if(unBtn) unBtn.style.background = window._icOwnerFilter === 'unassigned' ? '#D97706' : 'var(--ta-gray-100)';
    if(unBtn) unBtn.style.color = window._icOwnerFilter === 'unassigned' ? '#fff' : 'var(--ta-gray-700)';
  }
  window.updateOwnerFilterButtons = updateOwnerFilterButtons;

  /* ── UI: Mas'ul + band qilish badge (kompaniya katakchasiga) ───── */
  function ownerBadgeHtml(rec){
    if(!rec) return '';
    var owner = getLeadOwner(rec);
    var mine = getCurrentMemberId();
    var opts = ['<option value="">Mas\'ul biriktirilmagan</option>'];
    members().forEach(function(m){
      opts.push('<option value="'+m.id+'"'+(owner===m.id?' selected':'')+'>'+escOpt(m.name)+'</option>');
    });
    var dotColor = owner ? '#4361EE' : '#9CA3AF';
    // Reserve holati
    var resv = getReservation(rec);
    var reserveHtml = '';
    if(resv){
      var byOther = isReservedByOther(rec);
      reserveHtml = '<span title="'+(byOther?'Boshqa a\'zo band qilgan':'Siz band qilgansiz')+'" style="display:inline-flex;align-items:center;gap:3px;font-size:.6rem;font-weight:700;padding:2px 7px;border-radius:6px;background:'+(byOther?'#FEF3F2':'#ECFDF5')+';color:'+(byOther?'#DC2626':'#059669')+'">🔒 '+escOpt(memberName(resv.by))+'</span>'+
        (byOther ? '' : '<button type="button" onclick="event.stopPropagation();releaseLead(\''+rec.id+'\')" title="Bo\'shatish" style="border:none;background:none;color:#6B7280;cursor:pointer;font-size:.66rem;padding:0 2px">✕</button>');
    } else {
      reserveHtml = '<button type="button" onclick="event.stopPropagation();reserveLead(\''+rec.id+'\')" title="Ustida ishlash uchun band qiling" style="border:1px solid var(--ta-gray-200);background:var(--ta-gray-50, #F9FAFB);color:#6B7280;cursor:pointer;font-size:.6rem;font-weight:600;padding:2px 7px;border-radius:6px">🔓 Band qilish</button>';
    }
    return '<div onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px">'+
        '<span style="width:7px;height:7px;border-radius:50%;background:'+dotColor+';flex:none"></span>'+
        '<select onchange="event.stopPropagation();assignLeadOwner(\''+rec.id+'\',this.value)" title="Mas\'ulni tanlash" style="font-size:.64rem;font-weight:600;color:'+(owner?'#1F2937':'#9CA3AF')+';border:1px solid var(--ta-gray-200);border-radius:6px;padding:2px 6px;background:#fff;max-width:150px;cursor:pointer"'+
          (owner===mine?' data-mine="1"':'')+'>'+opts.join('')+'</select>'+
        reserveHtml+
      '</div>';
  }
  window.ownerBadgeHtml = ownerBadgeHtml;

  function escOpt(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ── Email yuborishdan oldingi ogohlantirish (email-modal ishlatadi) ── */
  function preSendLeadWarning(rec){
    if(!rec) return '';
    var parts = [];
    if(rec.emailSent){
      parts.push('⚠️ Bu leadga allaqachon email yuborilgan' + (rec.emailSentDate ? ' (' + escOpt(rec.emailSentDate) + ')' : '') + '. Qayta yuborish faqat zarur bo\'lsa.');
    }
    var owner = getLeadOwner(rec);
    var mine = getCurrentMemberId();
    if(owner && mine && owner !== mine){
      parts.push('👤 Bu lead <b>' + escOpt(memberName(owner)) + '</b>ga biriktirilgan. Uning leadiga email yuborishdan oldin kelishing.');
    }
    if(isReservedByOther(rec)){
      var r = getReservation(rec);
      parts.push('🔒 Bu leadni hozir <b>' + escOpt(memberName(r.by)) + '</b> band qilgan.');
    }
    if(!parts.length) return '';
    return '<div style="margin:0 0 12px;padding:10px 12px;border-radius:10px;background:#FFFBEB;border:1px solid #FDE68A;color:#92400E;font-size:.74rem;line-height:1.5">'+
      parts.join('<br>')+
    '</div>';
  }
  window.preSendLeadWarning = preSendLeadWarning;

  /* ── Email yuborilganda lead bookkeeping (barcha yuborish yo'llari) ── */
  function markLeadEmailSent(rec, mailboxEmail){
    if(!rec) return;
    rec.emailSent = true;
    if(!rec.emailSentDate) rec.emailSentDate = new Date().toISOString().split('T')[0];
    rec.emailSentAt = new Date().toISOString();
    if(mailboxEmail) rec.sentByMailbox = mailboxEmail;
    var me = getCurrentMember();
    rec.sentBy = me ? me.id : (currentAuthEmail() || '');
    // Status faqat oldinga suriladi (replied/meeting/loi kabi holatlarni orqaga qaytarmaymiz)
    var order = window.LEAD_STATUSES;
    var cur = getLeadStatus(rec);
    if(order.indexOf(cur) < order.indexOf('email_sent') || !rec.status) rec.status = 'email_sent';
    logLeadActivity(rec, 'email_sent', 'Email yuborildi' + (mailboxEmail ? (' (' + mailboxEmail + ')') : ''));
  }
  window.markLeadEmailSent = markLeadEmailSent;

  /* Status'ni qo'lda o'zgartirish (CRM/dashboard uchun) */
  function setLeadStatus(recId, status){
    if(window.LEAD_STATUSES.indexOf(status) === -1) return;
    var rec = findRec(recId);
    if(!rec) return;
    rec.status = status;
    logLeadActivity(rec, 'status', 'Status: ' + (window.LEAD_STATUS_LABELS[status] || status));
    if(typeof fbSave === 'function') fbSave('investorCompanies', rec);
    if(typeof toast === 'function') toast('🔄 Status: ' + (window.LEAD_STATUS_LABELS[status] || status));
    rerenderIc();
  }
  window.setLeadStatus = setLeadStatus;

  /* ── Yordamchi: IC jadvalini qayta render ──────────────────────── */
  function rerenderIc(){
    try { if(typeof renderInvestorCompanies === 'function') renderInvestorCompanies(); } catch(e){}
    try { if(typeof renderTeamDashboard === 'function') renderTeamDashboard(); } catch(e){}
  }
  window.teamRerenderIc = rerenderIc;

  /* ── Jamoa statistikasini hisoblash (dashboard + shaxsiy sahifa ishlatadi) ── */
  function computeTeamStats(){
    var list = (typeof DB !== "undefined" && Array.isArray(DB.investorCompanies)) ? DB.investorCompanies : [];
    var today = new Date().toISOString().slice(0,10);
    var stats = {};
    members().forEach(function(m){
      stats[m.id] = { id:m.id, name:m.name, roleLabel:m.roleLabel, role:m.role,
        assigned:0, sent:0, today:0, replied:0, meeting:0, loi:0, contract:0 };
    });
    var funnel = { 'new':0, email_sent:0, replied:0, meeting:0, loi:0, contract:0, not_interested:0 };
    var unassigned = 0, totalSent = 0, totalReplied = 0, normMap = {};
    list.forEach(function(r){
      var st = getLeadStatus(r);
      if(funnel[st] != null) funnel[st]++;
      var owner = getLeadOwner(r);
      if(owner && stats[owner]) stats[owner].assigned++;
      else if(!owner) unassigned++;
      if(r.emailSent) totalSent++;
      if(st === 'replied' || st === 'meeting' || st === 'loi' || st === 'contract') totalReplied++;
      var sb = r.sentBy;
      if(sb && stats[sb]){
        stats[sb].sent++;
        if(String(r.emailSentAt || '').slice(0,10) === today) stats[sb].today++;
      }
      if(owner && stats[owner]){
        if(st === 'replied') stats[owner].replied++;
        else if(st === 'meeting') stats[owner].meeting++;
        else if(st === 'loi') stats[owner].loi++;
        else if(st === 'contract') stats[owner].contract++;
      }
      var k = normalizeCompanyName(r.kompaniya);
      if(k){ (normMap[k] = normMap[k] || []).push(r); }
    });
    var dupGroups = Object.keys(normMap).filter(function(k){ return normMap[k].length > 1; });
    return {
      stats: stats, funnel: funnel, unassigned: unassigned,
      totalSent: totalSent, totalReplied: totalReplied, dupGroups: dupGroups,
      todayTotal: members().reduce(function(s,m){ return s + stats[m.id].today; }, 0),
      respRate: totalSent ? Math.round(totalReplied / totalSent * 100) : 0
    };
  }
  window.computeTeamStats = computeTeamStats;

  /* ── Jamoa dashboardi (Shahzod monitoringi uchun) ──────────────── */
  function renderTeamDashboard(){
    var host = document.getElementById('team-dashboard');
    if(!host) return;
    var T = computeTeamStats();
    var stats = T.stats, funnel = T.funnel, unassigned = T.unassigned;
    var respRate = T.respRate, todayTotal = T.todayTotal, dupGroups = T.dupGroups;

    function stat(v){ return '<span style="font-variant-numeric:tabular-nums;font-weight:700">'+v+'</span>'; }

    // Funnel chiplari
    var funnelHtml = window.LEAD_STATUSES.map(function(st){
      var c = window.LEAD_STATUS_COLORS[st] || '#6B7280';
      return '<div style="flex:1;min-width:92px;background:var(--card);border:1px solid var(--border);border-top:3px solid '+c+';border-radius:10px;padding:10px 12px">'+
        '<div style="font-size:1.35rem;font-weight:800;color:'+c+';font-variant-numeric:tabular-nums">'+funnel[st]+'</div>'+
        '<div style="font-size:.66rem;color:var(--text3);margin-top:2px">'+window.LEAD_STATUS_LABELS[st]+'</div>'+
      '</div>';
    }).join('');

    // Har a'zo jadvali
    var rowsHtml = members().map(function(m){
      var s = stats[m.id];
      var isCoord = m.role === 'coordinator', isTech = m.role === 'tech_lead';
      var roleColor = isTech ? '#4361EE' : isCoord ? '#D97706' : '#059669';
      return '<tr>'+
        '<td style="padding:8px 10px;border-bottom:1px solid var(--border)"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+roleColor+';margin-right:7px"></span><b>'+escOpt(m.name)+'</b><div style="font-size:.6rem;color:var(--text3);margin-left:15px">'+escOpt(m.roleLabel)+'</div></td>'+
        '<td style="text-align:center;border-bottom:1px solid var(--border)">'+stat(s.assigned)+'</td>'+
        '<td style="text-align:center;border-bottom:1px solid var(--border)">'+stat(s.sent)+'</td>'+
        '<td style="text-align:center;border-bottom:1px solid var(--border);color:#3B82F6">'+stat(s.today)+'</td>'+
        '<td style="text-align:center;border-bottom:1px solid var(--border);color:#8B5CF6">'+stat(s.replied)+'</td>'+
        '<td style="text-align:center;border-bottom:1px solid var(--border);color:#0EA5E9">'+stat(s.meeting)+'</td>'+
        '<td style="text-align:center;border-bottom:1px solid var(--border);color:#D97706">'+stat(s.loi)+'</td>'+
        '<td style="text-align:center;border-bottom:1px solid var(--border);color:#059669">'+stat(s.contract)+'</td>'+
      '</tr>';
    }).join('');

    host.innerHTML =
      '<div class="tcard" style="border-radius:14px;margin-bottom:1.2rem">'+
        '<div class="tc-head" style="padding:.9rem 1.1rem .5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'+
          '<div class="tc-title" style="font-size:.9rem;font-weight:700">👥 Jamoa monitoringi</div>'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
            '<span style="font-size:.68rem;background:rgba(59,130,246,.1);color:#3B82F6;padding:4px 10px;border-radius:8px;font-weight:700">Bugun: '+todayTotal+' email</span>'+
            '<span style="font-size:.68rem;background:rgba(139,92,246,.1);color:#8B5CF6;padding:4px 10px;border-radius:8px;font-weight:700">Javob: '+respRate+'%</span>'+
            (unassigned ? '<span onclick="setOwnerFilter(\'unassigned\')" title="Ko\'rish" style="cursor:pointer;font-size:.68rem;background:rgba(217,119,6,.1);color:#D97706;padding:4px 10px;border-radius:8px;font-weight:700">🅾️ Mas\'ulsiz: '+unassigned+'</span>' : '')+
            (dupGroups.length ? '<span style="font-size:.68rem;background:rgba(239,68,68,.1);color:#EF4444;padding:4px 10px;border-radius:8px;font-weight:700">⚠️ Dublikat: '+dupGroups.length+'</span>' : '')+
          '</div>'+
        '</div>'+
        '<div style="padding:.4rem 1.1rem 1rem">'+
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">'+funnelHtml+'</div>'+
          '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.76rem;min-width:560px">'+
            '<thead><tr style="text-align:center;color:var(--text3);font-size:.62rem;text-transform:uppercase;letter-spacing:.04em">'+
              '<th style="text-align:left;padding:6px 10px">A\'zo</th>'+
              '<th title="Biriktirilgan leadlar">Biriktirilgan</th><th title="Jami yuborilgan email">Email</th>'+
              '<th title="Bugun yuborilgan">Bugun</th><th>Javob</th><th>Uchrashuv</th><th>LOI</th><th>Shartnoma</th>'+
            '</tr></thead><tbody>'+rowsHtml+'</tbody></table></div>'+
            '<div style="font-size:.62rem;color:var(--text3);margin-top:8px">Eslatma: "Email" ustuni — kim yuborgani <b>sentBy</b> maydoni bo\'yicha. Eski (bu tizimdan oldingi) emaillarda bu maydon bo\'lmasligi mumkin.</div>'+
        '</div>'+
      '</div>';
  }
  window.renderTeamDashboard = renderTeamDashboard;

  /* ── "Mening sahifam" — har foydalanuvchining shaxsiy sahifasi ──── */
  function renderMyPage(){
    var host = document.getElementById('myteam-content');
    if(!host) return;
    var me = getCurrentMember();
    var T = computeTeamStats();

    // Login emaili jamoa ro'yxatida topilmasa — cheklangan ko'rinish (o'zini tanlash YO'Q)
    if(!me){
      host.innerHTML = '<div style="max-width:560px;margin:2.5rem auto;text-align:center;padding:0 1rem">'+
        '<div style="font-size:2.4rem">🔒</div>'+
        '<h3 style="margin:.5rem 0;color:var(--text)">Ko\'rinish cheklangan</h3>'+
        '<p style="color:var(--text3);font-size:.85rem;margin-bottom:.6rem">Siz kirgan email (<b>'+escOpt(currentAuthEmail()||'—')+'</b>) jamoa ro\'yxatida topilmadi.</p>'+
        '<p style="color:var(--text3);font-size:.8rem">Shaxsiy statistikangizni ko\'rish uchun texnik lead (Azizbek) sizning emailingizni jamoaga qo\'shishi kerak.</p>'+
      '</div>';
      return;
    }

    var list = (typeof DB !== "undefined" && Array.isArray(DB.investorCompanies)) ? DB.investorCompanies : [];
    var s = T.stats[me.id] || { assigned:0, sent:0, today:0, replied:0, meeting:0, loi:0, contract:0 };
    var mailbox = (typeof getPrimaryMailboxEmail === 'function') ? getPrimaryMailboxEmail() : (localStorage.getItem('_myEmail') || '');
    var connected = !!mailbox;
    var myWon = s.loi + s.contract;

    // Mening leadlarim va ularning bosqichlari (voronka)
    var myLeads = list.filter(function(r){ return getLeadOwner(r) === me.id; });
    var myFunnel = { 'new':0, email_sent:0, replied:0, meeting:0, loi:0, contract:0, not_interested:0 };
    myLeads.forEach(function(r){ var st = getLeadStatus(r); if(myFunnel[st] != null) myFunnel[st]++; });

    var FUNNEL_ORDER = ['new','email_sent','replied','meeting','loi','contract'];
    function funnelBars(counts){
      var max = 1;
      FUNNEL_ORDER.forEach(function(st){ if((counts[st]||0) > max) max = counts[st]; });
      return FUNNEL_ORDER.map(function(st){
        var c = counts[st] || 0, pct = Math.round(c / max * 100);
        var col = (window.LEAD_STATUS_COLORS && window.LEAD_STATUS_COLORS[st]) || '#4361EE';
        return '<div style="margin-bottom:10px">'+
          '<div style="display:flex;justify-content:space-between;font-size:.72rem;margin-bottom:4px">'+
            '<span style="color:var(--text3)">'+window.LEAD_STATUS_LABELS[st]+'</span>'+
            '<b style="font-variant-numeric:tabular-nums;color:var(--text)">'+c+'</b></div>'+
          '<div style="height:10px;background:var(--ta-gray-100,#eef1f8);border-radius:99px;overflow:hidden">'+
            '<div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:99px;transition:width .5s"></div></div>'+
        '</div>';
      }).join('');
    }

    // Katta KPI kartalari (ikonka + raqam)
    function kpi(icon, label, val, color){
      return '<div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:15px 18px;flex:1;min-width:132px;position:relative">'+
        '<div style="position:absolute;top:12px;right:14px;font-size:1.05rem;opacity:.55">'+icon+'</div>'+
        '<div style="font-size:2rem;font-weight:800;color:'+color+';font-variant-numeric:tabular-nums;line-height:1">'+val+'</div>'+
        '<div style="font-size:.72rem;color:var(--text3);margin-top:6px">'+label+'</div>'+
      '</div>';
    }
    var kpis = [
      kpi('📋','Mening leadlarim', s.assigned, '#4361EE'),
      kpi('✉️','Yuborilgan email', s.sent, '#3B82F6'),
      kpi('☀️','Bugun yuborilgan', s.today, '#0EA5E9'),
      kpi('💬','Javob keldi', s.replied, '#8B5CF6'),
      kpi('🤝','Uchrashuv', s.meeting, '#0EA5E9'),
      kpi('⭐','LOI / Shartnoma', myWon, '#059669')
    ].join('');

    // Sheriklar reytingi
    var board = members().map(function(m){ return T.stats[m.id]; })
      .sort(function(a,b){ return (b.sent - a.sent) || (b.replied - a.replied); });
    var maxSent = Math.max(1, board[0] ? board[0].sent : 1);
    var boardRows = board.map(function(st, i){
      var isMe = st.id === me.id;
      var pct = Math.round(st.sent / maxSent * 100);
      return '<tr style="'+(isMe?'background:rgba(67,97,238,.06)':'')+'">'+
        '<td style="padding:9px 10px;border-bottom:1px solid var(--border);color:var(--text3);font-variant-numeric:tabular-nums">'+(i+1)+'</td>'+
        '<td style="padding:9px 10px;border-bottom:1px solid var(--border)"><b style="color:var(--text)">'+escOpt(st.name)+'</b>'+(isMe?' <span style="font-size:.6rem;color:#4361EE;font-weight:700">(siz)</span>':'')+'<div style="font-size:.6rem;color:var(--text3)">'+escOpt(st.roleLabel)+'</div></td>'+
        '<td style="padding:9px 10px;border-bottom:1px solid var(--border);min-width:120px">'+
          '<div style="display:flex;align-items:center;gap:8px"><div style="flex:1;height:6px;background:var(--ta-gray-100, #eef1f8);border-radius:99px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+(isMe?'#4361EE':'#93A4E8')+';border-radius:99px"></div></div>'+
          '<b style="font-variant-numeric:tabular-nums;color:var(--text);font-size:.8rem">'+st.sent+'</b></div>'+
        '</td>'+
        '<td style="padding:9px 10px;border-bottom:1px solid var(--border);text-align:center;color:#8B5CF6;font-variant-numeric:tabular-nums">'+st.replied+'</td>'+
        '<td style="padding:9px 10px;border-bottom:1px solid var(--border);text-align:center;color:#0EA5E9;font-variant-numeric:tabular-nums">'+st.meeting+'</td>'+
        '<td style="padding:9px 10px;border-bottom:1px solid var(--border);text-align:center;color:#059669;font-variant-numeric:tabular-nums">'+(st.loi + st.contract)+'</td>'+
      '</tr>';
    }).join('');

    function panel(title, sub, inner){
      return '<div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px 18px">'+
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'+
          '<div style="font-size:.85rem;font-weight:700;color:var(--text)">'+title+'</div>'+
          (sub?'<div style="font-size:.66rem;color:var(--text3)">'+sub+'</div>':'')+
        '</div>'+ inner +'</div>';
    }

    host.innerHTML =
      '<div style="max-width:1160px;margin:0 auto;padding:1.2rem 1.6rem">'+
        // Salom + rol
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:1rem">'+
          '<div style="display:flex;align-items:center;gap:14px">'+
            '<div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#4361EE,#7C3AED);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800">'+escOpt(me.name.charAt(0))+'</div>'+
            '<div><h2 style="margin:0;font-size:1.15rem;color:var(--text)">Salom, '+escOpt(me.name)+'! 👋</h2>'+
            '<div style="font-size:.75rem;color:var(--text3)">'+escOpt(me.roleLabel)+'</div></div>'+
          '</div>'+
          '<button type="button" onclick="setOwnerFilter(\'mine\');showPage(\'investor\')" style="background:#4361EE;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:.78rem;font-weight:700;cursor:pointer">👤 Mening leadlarim →</button>'+
        '</div>'+
        // Email ulanish — ixcham bir qatorli
        '<div style="display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px 14px;margin-bottom:1.4rem;font-size:.78rem;flex-wrap:wrap">'+
          '<span style="font-size:1rem">'+(connected?'✅':'⚠️')+'</span>'+
          '<span style="color:var(--text3)">Mening emailim:</span>'+
          '<b style="color:var(--text)">'+(connected?escOpt(mailbox):'ulanmagan')+'</b>'+
          '<button type="button" onclick="(typeof openGmailSetup===\'function\'?openGmailSetup():showPage(\'settings\'))" style="margin-left:auto;background:'+(connected?'transparent':'#D97706')+';color:'+(connected?'#4361EE':'#fff')+';border:'+(connected?'1px solid var(--border)':'none')+';border-radius:8px;padding:5px 12px;font-size:.72rem;font-weight:600;cursor:pointer">'+(connected?'O\'zgartirish':'📧 Emailni ulash')+'</button>'+
        '</div>'+
        // KPI
        '<div style="font-size:.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Mening natijalarim</div>'+
        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:1.4rem">'+kpis+'</div>'+
        // Voronkalar — 2 ustun (responsive)
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-bottom:1.4rem">'+
          panel('📊 Mening voronkam', myLeads.length+' ta lead', funnelBars(myFunnel))+
          panel('👥 Jamoa voronkasi', 'Barcha leadlar', funnelBars(T.funnel))+
        '</div>'+
        // Sheriklar reytingi
        '<div style="background:var(--card);border:1px solid var(--border);border-radius:16px;overflow:hidden">'+
          '<div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'+
            '<div style="font-size:.9rem;font-weight:700;color:var(--text)">🏆 Jamoa reytingi</div>'+
            '<div style="font-size:.68rem;color:var(--text3)">Bugun jami: '+T.todayTotal+' email · Javob: '+T.respRate+'% · Mas\'ulsiz: '+T.unassigned+'</div>'+
          '</div>'+
          '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.78rem;min-width:560px">'+
            '<thead><tr style="color:var(--text3);font-size:.62rem;text-transform:uppercase;letter-spacing:.04em;text-align:left">'+
              '<th style="padding:8px 10px">#</th><th style="padding:8px 10px">A\'zo</th><th style="padding:8px 10px">Email (jami)</th>'+
              '<th style="padding:8px 10px;text-align:center">Javob</th><th style="padding:8px 10px;text-align:center">Uchrashuv</th><th style="padding:8px 10px;text-align:center">LOI+</th>'+
            '</tr></thead><tbody>'+boardRows+'</tbody></table></div>'+
        '</div>'+
      '</div>';
  }
  window.renderMyPage = renderMyPage;

  /* Sozlamalar sahifasidagi "Mening shaxsiy sozlamalarim" bloki — HAMMA uchun */
  window.mountPersonalSettings = function(){
    var host = document.getElementById('personalSettingsBody');
    if(!host) return;
    var me = getCurrentMember();
    var mailbox = (typeof getPrimaryMailboxEmail === 'function') ? getPrimaryMailboxEmail() : (localStorage.getItem('_myEmail') || '');
    var connected = !!mailbox;
    host.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'+
        '<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4361EE,#7C3AED);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800">'+escOpt(me?me.name.charAt(0):'?')+'</div>'+
        '<div><div style="font-weight:700;color:var(--text)">'+escOpt(me?me.name:(currentAuthEmail()||'—'))+'</div><div style="font-size:.72rem;color:var(--text3)">'+escOpt(me?me.roleLabel:'Jamoa ro\'yxatida yo\'q')+'</div></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;gap:10px;border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-top:12px;flex-wrap:wrap">'+
        '<span style="font-size:1.1rem">'+(connected?'✅':'⚠️')+'</span>'+
        '<div style="flex:1;min-width:170px"><div style="font-size:.8rem;font-weight:700;color:var(--text)">'+(connected?'Email ulangan':'Email ulanmagan')+'</div><div style="font-size:.72rem;color:var(--text3)">'+(connected?escOpt(mailbox):'Xat yuborish uchun o\'z pochtangizni ulang')+'</div></div>'+
        '<button type="button" onclick="if(typeof openGmailSetup===\'function\')openGmailSetup()" style="background:'+(connected?'var(--ta-gray-100)':'#4361EE')+';color:'+(connected?'var(--text)':'#fff')+';border:none;border-radius:9px;padding:8px 14px;font-size:.74rem;font-weight:700;cursor:pointer">'+(connected?'O\'zgartirish':'📧 Emailni ulash')+'</button>'+
      '</div>';
  };

  /* ── Backfill: eski leadlarga yetishmayotgan maydonlarni to'ldirish ──
     Xavfsiz va idempotent — faqat YO'Q maydonlarni qo'shadi, mavjudlarga
     tegmaydi. Admin konsoldan chaqiradi: backfillLeadFields()
     Eski data buzilmaydi; owner biriktirilmaydi (bo'sh qoldiriladi). */
  window.backfillLeadFields = async function(){
    if(!window.isAdmin){ if(typeof toast==='function') toast('⛔ Faqat admin'); return; }
    var list = (typeof DB !== "undefined" && Array.isArray(DB.investorCompanies)) ? DB.investorCompanies : [];
    var changed = 0;
    for(var i=0;i<list.length;i++){
      var r = list[i], dirty = false;
      if(r.status === undefined){ r.status = getLeadStatus(r); dirty = true; }        // emailSent'dan hosil
      if(r.assignedTo === undefined){ r.assignedTo = ''; dirty = true; }               // mas'ulsiz
      if(r.reservedBy === undefined){ r.reservedBy = ''; dirty = true; }
      if(r.createdAt === undefined){ r.createdAt = r.sana ? (r.sana + 'T00:00:00.000Z') : ''; dirty = true; }
      if(r.lastActivityAt === undefined){ r.lastActivityAt = r.emailSentDate ? (r.emailSentDate + 'T00:00:00.000Z') : (r.createdAt || ''); dirty = true; }
      if(dirty){
        changed++;
        if(typeof fbSave === 'function'){ try { await fbSave('investorCompanies', r); } catch(e){} }
      }
    }
    if(typeof toast === 'function') toast('✅ Backfill: ' + changed + ' ta lead yangilandi');
    console.log('[team] backfillLeadFields:', changed, 'ta yozuv yangilandi');
    rerenderIc();
    return changed;
  };

  /* ── Toolbar: "Men:" selektori + filtr tugmalarini yaratish ────── */
  window.mountTeamToolbar = function(){
    var host = document.getElementById('icTeamToolbar');
    if(!host) return;
    var me = getCurrentMember();
    var whoHtml = me
      ? '<span title="Siz shu sifatda kirgansiz" style="font-size:.68rem;color:var(--ta-gray-600);display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--ta-gray-100);border-radius:8px"><span style="width:7px;height:7px;border-radius:50%;background:#4361EE"></span>'+escOpt(me.name)+'</span>'
      : '';
    host.innerHTML = whoHtml +
      '<button id="icMyLeadsBtn" data-active="0" type="button" onclick="setOwnerFilter(\'mine\')" style="font-size:.7rem;font-weight:600;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;background:var(--ta-gray-100);color:var(--ta-gray-700)">👤 Mening leadlarim</button>'+
      '<button id="icUnassignedBtn" data-active="0" type="button" onclick="setOwnerFilter(\'unassigned\')" style="font-size:.7rem;font-weight:600;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;background:var(--ta-gray-100);color:var(--ta-gray-700)">🅾️ Mas\'ulsiz</button>';
    updateOwnerFilterButtons();
  };

})();
