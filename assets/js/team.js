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

  /* ── Jamoa a'zolari ──────────────────────────────────────────────
     email — kishining tizimga kirish (login) emaili. To'ldirilsa, joriy
     foydalanuvchi avtomatik aniqlanadi. Bo'sh bo'lsa ham ishlaydi: har kim
     toolbar'dagi "Men:" tugmasidan o'zini bir marta tanlaydi (localStorage).
     Yangi a'zo qo'shish / emailni to'g'rilash uchun shu ro'yxatni tahrirlang. */
  window.TEAM_MEMBERS = window.TEAM_MEMBERS || [
    { id:'azizbek', name:'Azizbek', roleLabel:"Texnik + Lead",           role:'tech_lead',   email:'' },
    { id:'shahzod', name:'Shahzod', roleLabel:"Monitoring + Koordinator", role:'coordinator', email:'' },
    { id:'suhrob',  name:'Suhrob',  roleLabel:"Lead outreach",            role:'outreach',    email:'' },
    { id:'azo4',    name:"A'zo 4",  roleLabel:"Lead outreach",            role:'outreach',    email:'' },
    { id:'azo5',    name:"A'zo 5",  roleLabel:"Lead outreach",            role:'outreach',    email:'' },
    { id:'azo6',    name:"A'zo 6",  roleLabel:"Lead outreach",            role:'outreach',    email:'' },
    { id:'azo7',    name:"A'zo 7",  roleLabel:"Lead outreach",            role:'outreach',    email:'' }
  ];

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

  /* Joriy foydalanuvchini aniqlash:
     1) login emaili TEAM_MEMBERS bilan mos kelsa — o'sha a'zo;
     2) aks holda — localStorage'dagi qo'lda tanlangan a'zo ("Men:" tugmasi). */
  function currentAuthEmail(){
    try {
      return String((window._currentUser && window._currentUser.email)
        || localStorage.getItem('_auth_email')
        || localStorage.getItem('_myEmail') || '').toLowerCase().trim();
    } catch(e){ return ''; }
  }
  function getCurrentMember(){
    var byEmail = teamMemberByEmail(currentAuthEmail());
    if(byEmail) return byEmail;
    try {
      var manual = localStorage.getItem('_myTeamMemberId');
      if(manual) return teamMemberById(manual);
    } catch(e){}
    return null;
  }
  function getCurrentMemberId(){ var m = getCurrentMember(); return m ? m.id : ''; }

  function setMyTeamMember(id){
    try { localStorage.setItem('_myTeamMemberId', String(id||'')); } catch(e){}
    if(typeof toast === 'function'){
      var m = teamMemberById(id);
      toast('👤 Siz: ' + (m ? m.name : '—'));
    }
    rerenderIc();
  }
  window.setMyTeamMember = setMyTeamMember;

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
    var list = (window.DB && Array.isArray(DB.investorCompanies)) ? DB.investorCompanies : [];
    return list.find(function(r){
      if(excludeId != null && String(r.id) === String(excludeId)) return false;
      return normalizeCompanyName(r.kompaniya) === key;
    }) || null;
  }
  window.findDuplicateCompany = findDuplicateCompany;
  window.isDuplicateCompany = function(name, excludeId){ return !!findDuplicateCompany(name, excludeId); };

  /* ── Yordamchi: record'ni DB.investorCompanies dan topish ──────── */
  function findRec(id){
    var list = (window.DB && Array.isArray(DB.investorCompanies)) ? DB.investorCompanies : [];
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
    var list = (window.DB && Array.isArray(DB.investorCompanies)) ? DB.investorCompanies : [];
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

    // Kim ekani noma'lum bo'lsa — o'zini tanlashni so'raymiz
    if(!me){
      var pick = members().map(function(m){
        return '<button type="button" onclick="setMyTeamMember(\''+m.id+'\')" style="text-align:left;border:1px solid var(--border);background:var(--card);border-radius:10px;padding:10px 14px;cursor:pointer;color:var(--text)"><b>'+escOpt(m.name)+'</b><div style="font-size:.66rem;color:var(--text3)">'+escOpt(m.roleLabel)+'</div></button>';
      }).join('');
      host.innerHTML = '<div style="max-width:520px;margin:2rem auto;text-align:center">'+
        '<div style="font-size:2.4rem">👤</div>'+
        '<h3 style="margin:.5rem 0;color:var(--text)">Siz kimsiz?</h3>'+
        '<p style="color:var(--text3);font-size:.85rem;margin-bottom:1.2rem">Shaxsiy sahifangizni ko\'rish uchun o\'zingizni tanlang. Bu ushbu qurilmada eslab qolinadi.</p>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left">'+pick+'</div>'+
      '</div>';
      return;
    }

    var s = T.stats[me.id] || { assigned:0, sent:0, today:0, replied:0, meeting:0, loi:0, contract:0 };
    var mailbox = (typeof getPrimaryMailboxEmail === 'function') ? getPrimaryMailboxEmail() : (localStorage.getItem('_myEmail') || '');
    var connected = !!mailbox;

    // KPI kartalari
    function kpi(label, val, color){
      return '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px 18px;flex:1;min-width:120px">'+
        '<div style="font-size:1.8rem;font-weight:800;color:'+color+';font-variant-numeric:tabular-nums;line-height:1">'+val+'</div>'+
        '<div style="font-size:.72rem;color:var(--text3);margin-top:6px">'+label+'</div>'+
      '</div>';
    }
    var kpis = [
      kpi('Mening leadlarim', s.assigned, '#4361EE'),
      kpi('Yuborilgan email', s.sent, '#3B82F6'),
      kpi('Bugun', s.today, '#0EA5E9'),
      kpi('Javob keldi', s.replied, '#8B5CF6'),
      kpi('Uchrashuv', s.meeting, '#0EA5E9'),
      kpi('LOI / Shartnoma', (s.loi + s.contract), '#059669')
    ].join('');

    // Sheriklar reytingi — email + javob + uchrashuv bo'yicha
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

    host.innerHTML =
      '<div style="max-width:1100px;margin:0 auto;padding:1.2rem 1.6rem">'+
        // Salom + rol
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:1.2rem">'+
          '<div style="display:flex;align-items:center;gap:14px">'+
            '<div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#4361EE,#7C3AED);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800">'+escOpt(me.name.charAt(0))+'</div>'+
            '<div><h2 style="margin:0;font-size:1.15rem;color:var(--text)">Salom, '+escOpt(me.name)+'! 👋</h2>'+
            '<div style="font-size:.75rem;color:var(--text3)">'+escOpt(me.roleLabel)+'</div></div>'+
          '</div>'+
          '<button type="button" onclick="setOwnerFilter(\'mine\');showPage(\'investor\')" style="background:#4361EE;color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:.78rem;font-weight:700;cursor:pointer">👤 Mening leadlarim →</button>'+
        '</div>'+
        // Email ulanish holati
        '<div style="background:'+(connected?'rgba(5,150,105,.06)':'rgba(217,119,6,.06)')+';border:1px solid '+(connected?'rgba(5,150,105,.2)':'rgba(217,119,6,.25)')+';border-radius:14px;padding:14px 18px;margin-bottom:1.2rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'+
          '<div style="display:flex;align-items:center;gap:10px">'+
            '<span style="font-size:1.3rem">'+(connected?'✅':'⚠️')+'</span>'+
            '<div><div style="font-size:.82rem;font-weight:700;color:var(--text)">'+(connected?'Email ulangan':'Email ulanmagan')+'</div>'+
            '<div style="font-size:.72rem;color:var(--text3)">'+(connected?escOpt(mailbox):'Email yuborish uchun o\'z pochtangizni ulang')+'</div></div>'+
          '</div>'+
          '<button type="button" onclick="(typeof openGmailSetup===\'function\'?openGmailSetup():showPage(\'settings\'))" style="background:'+(connected?'var(--ta-gray-100)':'#D97706')+';color:'+(connected?'var(--text)':'#fff')+';border:none;border-radius:10px;padding:8px 14px;font-size:.74rem;font-weight:700;cursor:pointer">'+(connected?'Sozlash':'📧 Emailni ulash')+'</button>'+
        '</div>'+
        // KPI
        '<div style="font-size:.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Mening natijalarim</div>'+
        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:1.6rem">'+kpis+'</div>'+
        // Sheriklar reytingi
        '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden">'+
          '<div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'+
            '<div style="font-size:.9rem;font-weight:700;color:var(--text)">🏆 Jamoa reytingi</div>'+
            '<div style="font-size:.68rem;color:var(--text3)">Bugun jami: '+T.todayTotal+' email · Javob: '+T.respRate+'%</div>'+
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

  /* ── Backfill: eski leadlarga yetishmayotgan maydonlarni to'ldirish ──
     Xavfsiz va idempotent — faqat YO'Q maydonlarni qo'shadi, mavjudlarga
     tegmaydi. Admin konsoldan chaqiradi: backfillLeadFields()
     Eski data buzilmaydi; owner biriktirilmaydi (bo'sh qoldiriladi). */
  window.backfillLeadFields = async function(){
    if(!window.isAdmin){ if(typeof toast==='function') toast('⛔ Faqat admin'); return; }
    var list = (window.DB && Array.isArray(DB.investorCompanies)) ? DB.investorCompanies : [];
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
    var meOpts = ['<option value="">— Men kimman? —</option>'];
    members().forEach(function(m){
      meOpts.push('<option value="'+m.id+'"'+(me && me.id===m.id?' selected':'')+'>'+escOpt(m.name)+' · '+escOpt(m.roleLabel)+'</option>');
    });
    host.innerHTML =
      '<select id="icWhoAmI" onchange="setMyTeamMember(this.value)" title="Ushbu qurilmada kim ishlayapti" style="font-size:.7rem;font-weight:600;border:1px solid var(--ta-gray-200);border-radius:8px;padding:4px 8px;background:#fff;color:#1F2937;cursor:pointer">'+meOpts.join('')+'</select>'+
      '<button id="icMyLeadsBtn" data-active="0" type="button" onclick="setOwnerFilter(\'mine\')" style="font-size:.7rem;font-weight:600;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;background:var(--ta-gray-100);color:var(--ta-gray-700)">👤 Mening leadlarim</button>'+
      '<button id="icUnassignedBtn" data-active="0" type="button" onclick="setOwnerFilter(\'unassigned\')" style="font-size:.7rem;font-weight:600;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;background:var(--ta-gray-100);color:var(--ta-gray-700)">🅾️ Mas\'ulsiz</button>';
    updateOwnerFilterButtons();
  };

})();
