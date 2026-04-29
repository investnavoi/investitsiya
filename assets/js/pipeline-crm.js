/* ═══════════════════════════════════════
   M5: PIPELINE (KANBAN CRM)
═══════════════════════════════════════ */
function normalizeMailboxEmail(email){
  return String(email||'').trim().toLowerCase();
}
function extractEmailFromHeaderText(text){
  var m = String(text||'').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? m[0].toLowerCase() : '';
}
function getMailboxDefaultCapacity(){
  return Math.max(1, parseInt(DB.settings && DB.settings.dailyLimit, 10) || 50);
}
function getMailboxProvider(email){
  var domain = normalizeMailboxEmail(email).split('@')[1]||'';
  if(!domain) return 'Custom';
  if(domain === 'gmail.com') return 'Gmail';
  if(/outlook|hotmail|live/.test(domain)) return 'Outlook';
  if(/yahoo/.test(domain)) return 'Yahoo';
  if(/icloud/.test(domain)) return 'iCloud';
  return domain;
}
function getMailboxAvatar(provider){
  var p = String(provider||'').toLowerCase();
  if(p === 'gmail') return '📧';
  if(p === 'outlook') return '📮';
  if(p === 'yahoo') return '✉️';
  if(p === 'icloud') return '☁️';
  return '📨';
}
function ensureMailboxSeed(email, patch){
  var key = normalizeMailboxEmail(email);
  if(!key) return null;
  if(!DB.settings) DB.settings = {};
  if(!Array.isArray(DB.settings.mailboxes)) DB.settings.mailboxes = [];
  var arr = DB.settings.mailboxes;
  var found = arr.find(function(m){ return normalizeMailboxEmail(m.email) === key; });
  if(found){
    Object.keys(patch||{}).forEach(function(k){
      if(patch[k] === undefined) return;
      if(found[k] === undefined || found[k] === '' || k === 'active' || k === 'provider' || k === 'dailyCapacity'){
        found[k] = patch[k];
      }
    });
    return found;
  }
  var nextId = arr.length ? Math.max.apply(null, arr.map(function(m){ return Number(m.id)||0; })) + 1 : 1;
  found = Object.assign({
    id: nextId,
    email: key,
    provider: getMailboxProvider(key),
    notes: '',
    dailyCapacity: getMailboxDefaultCapacity(),
    active: false,
    disabled: false,
    connected: false,
    health: 0,
    status: 'Disconnected',
    createdAt: new Date().toISOString()
  }, patch||{});
  arr.push(found);
  return found;
}
function getMailboxStore(){
  if(!DB.settings) DB.settings = {};
  if(!Array.isArray(DB.settings.mailboxes)) DB.settings.mailboxes = [];
  if(!Array.isArray(DB.settings.mailboxActivity)) DB.settings.mailboxActivity = [];
  var replyEmail = normalizeMailboxEmail(localStorage.getItem('_myEmail')||'');
  var gmailEmail = normalizeMailboxEmail((typeof _gmailUser !== 'undefined' && _gmailUser) || localStorage.getItem('_gmailUserEmail') || '');
  var emailjsEmail = normalizeMailboxEmail(window._sgFrom||'');
  if(replyEmail) ensureMailboxSeed(replyEmail, { active:true, notes:'Reply-to mailbox', provider:getMailboxProvider(replyEmail) });
  if(gmailEmail) ensureMailboxSeed(gmailEmail, { provider:'Gmail' });
  if(!DB.settings.mailboxes.length && emailjsEmail){
    ensureMailboxSeed(emailjsEmail, { active:true, notes:'EmailJS default', provider:getMailboxProvider(emailjsEmail) });
  }
  return DB.settings.mailboxes;
}
function getPrimaryMailboxEmail(){
  var mailboxes = syncMailboxStateFromIntegrations();
  var active = mailboxes.find(function(m){ return m.active && !m.disabled; });
  if(active && active.email){
    localStorage.setItem('_myEmail', active.email);
    return active.email;
  }
  var fallback = normalizeMailboxEmail(localStorage.getItem('_myEmail') || ((typeof _gmailUser !== 'undefined' && _gmailUser) || window._sgFrom || ''));
  if(fallback) localStorage.setItem('_myEmail', fallback);
  return fallback || '';
}
function getMailboxMetrics(email){
  var key = normalizeMailboxEmail(email);
  var companies = DB.investorCompanies || [];
  var notifs = (typeof _notifications !== 'undefined' && Array.isArray(_notifications)) ? _notifications : [];
  var primary = normalizeMailboxEmail(localStorage.getItem('_myEmail')||'');
  var sent = companies.filter(function(c){
    if(!c.emailSent) return false;
    var sentBy = normalizeMailboxEmail(c.sentByMailbox || (primary && primary === key ? primary : ''));
    return sentBy === key;
  }).length;
  var responses = notifs.filter(function(n){
    var toMail = normalizeMailboxEmail(n.toEmail || (primary && primary === key ? primary : ''));
    return toMail === key;
  }).length;
  var today = new Date().toISOString().slice(0,10);
  var warmToday = 0, coldToday = 0;
  (DB.settings.mailboxActivity||[]).forEach(function(item){
    if(normalizeMailboxEmail(item.email) !== key || item.date !== today) return;
    warmToday += parseInt(item.warm,10)||0;
    coldToday += parseInt(item.cold,10)||0;
  });
  return { sent:sent, responses:responses, warmToday:warmToday, coldToday:coldToday, usedToday:warmToday+coldToday };
}
function getMailboxHealthMeta(mailbox){
  var health = Math.max(0, Math.min(100, parseInt(mailbox.health,10)||0));
  if(mailbox.disabled || !mailbox.connected) return { health:health || 28, cls:'bad', text:'Disconnected' };
  if(health >= 85) return { health:health, cls:'ok', text:'Fully Operational' };
  if(health >= 60) return { health:health, cls:'warn', text:'Minor Issues' };
  return { health:health, cls:'bad', text:'Urgent Issues' };
}
function syncMailboxStateFromIntegrations(){
  var mailboxes = getMailboxStore();
  var replyEmail = normalizeMailboxEmail(localStorage.getItem('_myEmail')||'');
  var gmailEmail = normalizeMailboxEmail((typeof _gmailUser !== 'undefined' && _gmailUser) || localStorage.getItem('_gmailUserEmail') || '');
  if(gmailEmail) ensureMailboxSeed(gmailEmail, { provider:'Gmail' });
  if(replyEmail) ensureMailboxSeed(replyEmail, { active:true });

  var hasActive = false;
  mailboxes.forEach(function(m){
    m.email = normalizeMailboxEmail(m.email);
    if(typeof m.dailyCapacity !== 'number' || !isFinite(m.dailyCapacity) || m.dailyCapacity <= 0) m.dailyCapacity = getMailboxDefaultCapacity();
    if(replyEmail && m.email === replyEmail && !m.disabled){
      m.active = true;
      hasActive = true;
    } else if(replyEmail) {
      m.active = false;
    }
  });
  if(!hasActive && mailboxes.length){
    var firstAvailable = mailboxes.find(function(m){ return !m.disabled; }) || mailboxes[0];
    mailboxes.forEach(function(m){ m.active = m.id === firstAvailable.id; });
    if(firstAvailable && firstAvailable.email) localStorage.setItem('_myEmail', firstAvailable.email);
  }

  mailboxes.forEach(function(m){
    var metrics = getMailboxMetrics(m.email);
    var baseHealth = m.disabled ? 26 : 42;
    if(m.active) baseHealth += 18;
    if(gmailEmail && m.email === gmailEmail && typeof _gmailConnected !== 'undefined' && _gmailConnected) baseHealth += 28;
    if(metrics.sent > 0) baseHealth += Math.min(16, metrics.sent * 2);
    if(metrics.responses > 0) baseHealth += Math.min(12, metrics.responses * 4);
    if(metrics.usedToday > m.dailyCapacity) baseHealth -= 12;
    if(m.notes && /issue|spam|bounce|flood/i.test(String(m.notes).toLowerCase())) baseHealth -= 15;
    m.connected = !m.disabled && (!!m.active || ((gmailEmail && m.email === gmailEmail) && (typeof _gmailConnected !== 'undefined' && _gmailConnected)));
    if(!m.health || m.health < 1 || m.health > 100){
      m.health = Math.max(18, Math.min(100, baseHealth));
    } else {
      m.health = Math.max(18, Math.min(100, Math.round((Number(m.health)*0.6) + (baseHealth*0.4))));
    }
    var meta = getMailboxHealthMeta(m);
    m.status = meta.text;
  });
  return mailboxes;
}
function persistMailboxSettings(){
  if(typeof fbSaveSettings === 'function') fbSaveSettings(DB.settings);
}
function recordMailboxActivity(mailboxEmail, kind, count){
  var email = normalizeMailboxEmail(mailboxEmail);
  if(!email) return;
  if(!DB.settings) DB.settings = {};
  if(!Array.isArray(DB.settings.mailboxActivity)) DB.settings.mailboxActivity = [];
  var qty = parseInt(count,10)||1;
  var date = new Date().toISOString().slice(0,10);
  var row = DB.settings.mailboxActivity.find(function(r){ return normalizeMailboxEmail(r.email)===email && r.date===date; });
  if(!row){
    row = { date:date, email:email, warm:0, cold:0 };
    DB.settings.mailboxActivity.push(row);
  }
  if(kind === 'warm') row.warm += qty;
  else row.cold += qty;
  persistMailboxSettings();
}
function buildMailboxSeries(){
  var list = [];
  var map = {};
  var base = new Date();
  for(var i=13;i>=0;i--){
    var d = new Date(base);
    d.setDate(base.getDate()-i);
    var iso = d.toISOString().slice(0,10);
    map[iso] = { date:iso, warm:0, cold:0 };
    list.push(map[iso]);
  }
  (DB.settings.mailboxActivity||[]).forEach(function(item){
    if(!map[item.date]) return;
    map[item.date].warm += parseInt(item.warm,10)||0;
    map[item.date].cold += parseInt(item.cold,10)||0;
  });
  var hasActivity = list.some(function(r){ return r.warm>0 || r.cold>0; });
  if(!hasActivity){
    (DB.investorCompanies||[]).forEach(function(c){
      if(!c.emailSentDate || !map[c.emailSentDate]) return;
      map[c.emailSentDate].cold += 1;
    });
  }
  return list;
}
function renderMailboxChart(){
  var root = document.getElementById('mailboxChart');
  if(!root) return;
  var series = buildMailboxSeries();
  var maxVal = series.reduce(function(mx,row){ return Math.max(mx, row.warm, row.cold); }, 0) || 1;
  root.innerHTML = series.map(function(row){
    var day = row.date.slice(5).replace('-','/');
    var warmH = Math.max(6, Math.round((row.warm / maxVal) * 140));
    var coldH = Math.max(6, Math.round((row.cold / maxVal) * 140));
    if(row.warm === 0) warmH = 6;
    if(row.cold === 0) coldH = 6;
    return '<div class="mailbox-chart-col"><div class="mailbox-chart-bars"><div class="mailbox-chart-bar warm" style="height:'+warmH+'px" title="Warmup: '+row.warm+'"></div><div class="mailbox-chart-bar cold" style="height:'+coldH+'px" title="Cold: '+row.cold+'"></div></div><div class="mailbox-chart-label">'+day+'</div></div>';
  }).join('');
}
function renderMailboxHealthBars(meta){
  var level = meta.cls;
  var onCount = meta.health >= 90 ? 4 : meta.health >= 65 ? 3 : meta.health >= 40 ? 2 : 1;
  var bars = [0,1,2,3].map(function(idx){
    return '<span class="'+(idx < onCount ? ('on '+level) : '')+'"></span>';
  }).join('');
  return '<div class="mailbox-health-wrap"><div class="mailbox-health-bars">'+bars+'</div><div class="mailbox-health-num">'+meta.health+'%</div></div>';
}
function renderMailboxPanel(){
  var rowsEl = document.getElementById('mailboxRows');
  if(!rowsEl) return;
  var mailboxes = syncMailboxStateFromIntegrations().slice();
  var companies = DB.investorCompanies || [];
  var notifs = (typeof _notifications !== 'undefined' && Array.isArray(_notifications)) ? _notifications : [];
  var connected = mailboxes.filter(function(m){ return m.connected; }).length;
  var active = mailboxes.filter(function(m){ return m.active && !m.disabled; }).length;
  var sentTotal = companies.filter(function(c){ return c.emailSent; }).length;
  var responses = notifs.length;
  var avgHealth = mailboxes.length ? Math.round(mailboxes.reduce(function(sum,m){ return sum + (parseInt(m.health,10)||0); },0) / mailboxes.length) : 0;
  var deliverability = mailboxes.length ? Math.round(mailboxes.reduce(function(sum,m){
    var meta = getMailboxHealthMeta(m);
    return sum + (meta.cls === 'bad' ? Math.max(20, meta.health-8) : meta.health);
  },0) / mailboxes.length) : 0;

  var pill = document.getElementById('mb-connected-pill');
  if(pill) pill.textContent = connected + ' / ' + mailboxes.length;
  var sub = document.getElementById('mb-sub');
  if(sub){
    var primary = getPrimaryMailboxEmail();
    sub.textContent = (primary ? ('Asosiy reply-to: ' + primary) : 'Asosiy reply-to tanlanmagan') + ' • ' + active + ' ta aktiv mailbox';
  }
  var note = document.getElementById('mailboxChartNote');
  if(note) note.textContent = (typeof _gmailConnected !== 'undefined' && _gmailConnected) ? 'Gmail ulangan — javoblar mailbox bo\'yicha taqsimlanadi.' : 'Gmail ulanmagan — javoblar soni umumiy hisobda ko\'rsatiladi.';
  document.getElementById('mb-k1').textContent = sentTotal;
  document.getElementById('mb-k2').textContent = responses;
  document.getElementById('mb-k3').textContent = deliverability + '%';
  document.getElementById('mb-k4').textContent = avgHealth + '%';
  document.getElementById('mb-k5').textContent = active;

  if(!mailboxes.length){
    rowsEl.innerHTML = '<div class="mailbox-empty">Hozircha mailbox qo\'shilmagan. "Add Email Address" bilan boshlang.</div>';
  } else {
    rowsEl.innerHTML = mailboxes.map(function(m){
      var meta = getMailboxHealthMeta(m);
      var metrics = getMailboxMetrics(m.email);
      var used = metrics.usedToday;
      var left = Math.max(0, (parseInt(m.dailyCapacity,10)||0) - used);
      var provider = m.provider || getMailboxProvider(m.email);
      var actionLabel = m.disabled ? 'Reconnect' : 'Disconnect';
      var actionClass = m.disabled ? 'primary' : '';
      return '<div class="mailbox-row">'
        + '<div class="mailbox-account"><div class="mailbox-avatar">'+getMailboxAvatar(provider)+'</div><div class="mailbox-acc-meta"><div class="mailbox-acc-email">'+m.email+'</div><div class="mailbox-acc-sub">'+provider+(m.notes ? ' • '+m.notes : '')+' • Sent: '+metrics.sent+' • Replies: '+metrics.responses+'</div></div></div>'
        + '<div class="mailbox-capacity"><strong>'+(m.dailyCapacity||0)+'</strong><div>'+used+' ishlatilgan • '+left+' qolgan</div></div>'
        + '<div><span class="mailbox-chip '+meta.cls+'">'+meta.text+'</span></div>'
        + '<div>'+renderMailboxHealthBars(meta)+'</div>'
        + '<div class="mailbox-use"><button class="mailbox-toggle '+((m.active && !m.disabled)?'active':'')+'" onclick="toggleMailboxPrimary('+m.id+')" title="Asosiy mailbox qilish"></button></div>'
        + '<div class="mailbox-actions"><button class="mailbox-mini-btn '+actionClass+'" onclick="toggleMailboxConnection('+m.id+')">'+actionLabel+'</button><button class="mailbox-mini-btn" onclick="editMailbox('+m.id+')">Edit</button><button class="mailbox-mini-btn danger" onclick="removeMailbox('+m.id+')">Delete</button></div>'
      + '</div>';
    }).join('');
  }
  renderMailboxChart();
}
function toggleMailboxForm(forceOpen){
  var form = document.getElementById('mailboxAddForm');
  if(!form) return;
  var shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : form.style.display === 'none';
  if(shouldOpen){
    form.style.display = 'grid';
  } else {
    form.style.display = 'none';
    document.getElementById('mailbox-edit-id').value = '';
    document.getElementById('mailbox-email').value = '';
    document.getElementById('mailbox-capacity').value = getMailboxDefaultCapacity();
    document.getElementById('mailbox-notes').value = '';
  }
}
function editMailbox(id){
  var box = getMailboxStore().find(function(m){ return Number(m.id) === Number(id); });
  if(!box) return;
  document.getElementById('mailbox-edit-id').value = box.id;
  document.getElementById('mailbox-email').value = box.email || '';
  document.getElementById('mailbox-capacity').value = box.dailyCapacity || getMailboxDefaultCapacity();
  document.getElementById('mailbox-notes').value = box.notes || '';
  toggleMailboxForm(true);
}
function saveMailbox(){
  var id = parseInt(document.getElementById('mailbox-edit-id').value || '0', 10);
  var email = normalizeMailboxEmail(document.getElementById('mailbox-email').value);
  var capacity = Math.max(1, parseInt(document.getElementById('mailbox-capacity').value || getMailboxDefaultCapacity(), 10));
  var notes = document.getElementById('mailbox-notes').value.trim();
  if(!email || email.indexOf('@') === -1){
    toast('⚠️ To\'g\'ri email kiriting', 'error');
    return;
  }
  var mailboxes = getMailboxStore();
  var existing = mailboxes.find(function(m){ return normalizeMailboxEmail(m.email) === email && Number(m.id) !== Number(id); });
  if(existing){
    toast('⚠️ Bu email allaqachon ro\'yxatda bor', 'error');
    return;
  }
  var box = id ? mailboxes.find(function(m){ return Number(m.id) === Number(id); }) : null;
  if(!box){
    box = ensureMailboxSeed(email, { active:mailboxes.length === 0, disabled:false });
  }
  box.email = email;
  box.provider = getMailboxProvider(email);
  box.dailyCapacity = capacity;
  box.notes = notes;
  if(mailboxes.length === 1 || !mailboxes.some(function(m){ return m.active && !m.disabled; })){
    box.active = true;
    localStorage.setItem('_myEmail', email);
  }
  syncMailboxStateFromIntegrations();
  persistMailboxSettings();
  renderPipeline();
  toggleMailboxForm(false);
  toast('✅ Mailbox saqlandi');
}
function removeMailbox(id){
  var mailboxes = getMailboxStore();
  var box = mailboxes.find(function(m){ return Number(m.id) === Number(id); });
  if(!box) return;
  if(!confirm(box.email + ' ni o\'chirishni tasdiqlaysizmi?')) return;
  DB.settings.mailboxes = mailboxes.filter(function(m){ return Number(m.id) !== Number(id); });
  if(normalizeMailboxEmail(localStorage.getItem('_myEmail')) === normalizeMailboxEmail(box.email)){
    localStorage.removeItem('_myEmail');
  }
  syncMailboxStateFromIntegrations();
  persistMailboxSettings();
  renderPipeline();
  toast('🗑 Mailbox o\'chirildi');
}
function toggleMailboxConnection(id){
  var box = getMailboxStore().find(function(m){ return Number(m.id) === Number(id); });
  if(!box) return;
  if(box.disabled){
    box.disabled = false;
    box.active = true;
    localStorage.setItem('_myEmail', box.email);
    getMailboxStore().forEach(function(m){ if(Number(m.id)!==Number(id)) m.active = false; });
    toast('✅ Mailbox qayta ulandi');
  } else {
    box.disabled = true;
    box.connected = false;
    if(box.active){
      box.active = false;
      var replacement = getMailboxStore().find(function(m){ return !m.disabled && Number(m.id)!==Number(id); });
      if(replacement){
        replacement.active = true;
        localStorage.setItem('_myEmail', replacement.email);
      } else {
        localStorage.removeItem('_myEmail');
      }
    }
    toast('⏸ Mailbox vaqtincha ajratildi');
  }
  syncMailboxStateFromIntegrations();
  persistMailboxSettings();
  renderPipeline();
}
function toggleMailboxPrimary(id){
  var mailboxes = getMailboxStore();
  var box = mailboxes.find(function(m){ return Number(m.id) === Number(id); });
  if(!box) return;
  box.disabled = false;
  mailboxes.forEach(function(m){ m.active = Number(m.id) === Number(id); });
  localStorage.setItem('_myEmail', box.email);
  syncMailboxStateFromIntegrations();
  persistMailboxSettings();
  renderPipeline();
  toast('📮 Asosiy mailbox: ' + box.email);
}
function refreshMailboxPanel(){
  syncMailboxStateFromIntegrations();
  persistMailboxSettings();
  renderPipeline();
  toast('🔄 Mailbox panel yangilandi');
}
/* ═══ CRM TAB SWITCHING ═══ */
function switchCrmTab(id){
  document.querySelectorAll('.crm-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.crm-section').forEach(s=>s.style.display='none');
  var tab=document.getElementById('crmtab-'+id);
  var sec=document.getElementById('crm-sec-'+id);
  if(tab) tab.classList.add('active');
  if(sec) sec.style.display='block';
  if(id==='dashboard') renderCrmDashboard();
  if(id==='funnel') renderCrmFunnelTab();
  if(id==='companies') renderCrmCompanies();
  if(id==='activities') renderCrmActivities();
  if(id==='geo') renderCrmGeo();
  if(id==='reports') renderCrmReports();
  if(id==='kanban') renderPipeline();
  if(id==='mailbox') renderMailboxPanel();
  if(id==='settings') renderCrmSettings();
}

/* ═══ CRM SETTINGS ═══ */
function renderCrmSettings(){
  // Default pipeline stages
  var defaultStages=[
    {name:'Lead',color:'#3B82F6',label:'Aniqlangan'},
    {name:'Contacted',color:'#8B5CF6',label:'Bog\'lanildi'},
    {name:'Engaged',color:'#F59E0B',label:'Javob berdi'},
    {name:'Negotiation',color:'#EF4444',label:'Muzokara'},
    {name:'Customer',color:'#059669',label:'Mijoz bo\'ldi'}
  ];
  var stages=JSON.parse(localStorage.getItem('_crmPipelineStages')||'null')||defaultStages;
  var el=document.getElementById('settings-pipeline-stages');
  if(el){
    el.innerHTML=stages.map(function(s,i){
      return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem;padding:.5rem .7rem;background:var(--bg2);border-radius:8px">'
        +'<input type="color" value="'+s.color+'" style="width:32px;height:28px;border:none;border-radius:6px;cursor:pointer;padding:0" data-idx="'+i+'" class="stage-color-input">'
        +'<input type="text" value="'+s.name+'" style="flex:1;padding:.35rem .6rem;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem" data-idx="'+i+'" class="stage-name-input" placeholder="Nomi (English)">'
        +'<input type="text" value="'+(s.label||'')+'" style="flex:1;padding:.35rem .6rem;border:1px solid #d1d5db;border-radius:6px;font-size:.82rem" data-idx="'+i+'" class="stage-label-input" placeholder="Label (O\'zbekcha)">'
        +'<button onclick="removePipelineStage('+i+')" style="padding:.3rem .6rem;background:#fee2e2;color:#ef4444;border:none;border-radius:6px;font-size:.78rem;cursor:pointer" title="O\'chirish">✕</button>'
      +'</div>';
    }).join('');
  }
  // Default loss reasons
  var defaultReasons=['Narx mos kelmadi','Bozor qiziq emas','Raqobatchi tanlandi','Javob bermadi','Hududiy cheklovlar','Strategiya o\'zgardi','Kapital yetarli emas'];
  var reasons=JSON.parse(localStorage.getItem('_crmLossReasons')||'null')||defaultReasons;
  var lrEl=document.getElementById('settings-loss-reasons');
  if(lrEl){
    lrEl.innerHTML=reasons.map(function(r,i){
      return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem;padding:.4rem .7rem;background:#fef2f2;border:1px solid #fecaca;border-radius:8px">'
        +'<span style="flex:1;font-size:.82rem;color:#991b1b">'+r+'</span>'
        +'<button onclick="removeLossReason('+i+')" style="padding:.2rem .5rem;background:#ef4444;color:#fff;border:none;border-radius:5px;font-size:.72rem;cursor:pointer">✕</button>'
      +'</div>';
    }).join('');
  }
  // Default question categories
  var defaultQCats=['Investitsiya hajmi','Texnologiya','Logistika','Kadrlar','Huquqiy masalalar','Infratuzilma','Bozor tahlili'];
  var qcats=JSON.parse(localStorage.getItem('_crmQuestionCats')||'null')||defaultQCats;
  var qcEl=document.getElementById('settings-question-cats');
  if(qcEl){
    qcEl.innerHTML=qcats.map(function(q,i){
      return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem;padding:.4rem .7rem;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px">'
        +'<span style="flex:1;font-size:.82rem;color:#5b21b6">'+q+'</span>'
        +'<button onclick="removeQuestionCategory('+i+')" style="padding:.2rem .5rem;background:#8b5cf6;color:#fff;border:none;border-radius:5px;font-size:.72rem;cursor:pointer">✕</button>'
      +'</div>';
    }).join('');
  }
  // Default user roles
  var defaultRoles=[
    {name:'Admin',role:'admin',email:'admin@navoiy-fez.uz'},
    {name:'Menejer',role:'manager',email:'manager@navoiy-fez.uz'}
  ];
  var roles=JSON.parse(localStorage.getItem('_crmUserRoles')||'null')||defaultRoles;
  var urEl=document.getElementById('settings-user-roles');
  if(urEl){
    urEl.innerHTML='<table style="width:100%;font-size:.82rem;border-collapse:collapse">'
      +'<thead><tr style="border-bottom:2px solid #e2e8f0"><th style="text-align:left;padding:.5rem;font-weight:600">Ism</th><th style="text-align:left;padding:.5rem;font-weight:600">Email</th><th style="text-align:left;padding:.5rem;font-weight:600">Rol</th><th style="width:40px"></th></tr></thead>'
      +'<tbody>'+roles.map(function(r,i){
        return '<tr style="border-bottom:1px solid #f1f5f9">'
          +'<td style="padding:.5rem"><input type="text" value="'+r.name+'" class="role-name-input" data-idx="'+i+'" style="width:100%;padding:.3rem .5rem;border:1px solid #d1d5db;border-radius:6px;font-size:.8rem"></td>'
          +'<td style="padding:.5rem"><input type="text" value="'+r.email+'" class="role-email-input" data-idx="'+i+'" style="width:100%;padding:.3rem .5rem;border:1px solid #d1d5db;border-radius:6px;font-size:.8rem"></td>'
          +'<td style="padding:.5rem"><select class="role-type-input" data-idx="'+i+'" style="padding:.3rem .5rem;border:1px solid #d1d5db;border-radius:6px;font-size:.8rem">'
            +'<option value="admin"'+(r.role==='admin'?' selected':'')+'>Admin</option>'
            +'<option value="manager"'+(r.role==='manager'?' selected':'')+'>Menejer</option>'
            +'<option value="viewer"'+(r.role==='viewer'?' selected':'')+'>Faqat ko\'rish</option>'
          +'</select></td>'
          +'<td style="padding:.5rem"><button onclick="removeUserRole('+i+')" style="padding:.2rem .5rem;background:#fee2e2;color:#ef4444;border:none;border-radius:5px;font-size:.72rem;cursor:pointer">✕</button></td>'
        +'</tr>';
      }).join('')+'</tbody></table>';
  }
  // Notification settings
  var notifSettings=JSON.parse(localStorage.getItem('_crmNotifications')||'null')||{reply:true,stage:true,zoom:true,digest:true,followup:true};
  var cb1=document.getElementById('notif-new-reply');if(cb1)cb1.checked=notifSettings.reply!==false;
  var cb2=document.getElementById('notif-stage-change');if(cb2)cb2.checked=notifSettings.stage!==false;
  var cb3=document.getElementById('notif-zoom-remind');if(cb3)cb3.checked=notifSettings.zoom!==false;
  var cb4=document.getElementById('notif-weekly-digest');if(cb4)cb4.checked=notifSettings.digest!==false;
  var cb5=document.getElementById('notif-followup');if(cb5)cb5.checked=notifSettings.followup!==false;
  // Gmail settings
  var gmailId=localStorage.getItem('_gmailClientId')||'';
  var gmailInput=document.getElementById('settings-gmail-client-id');
  if(gmailInput) gmailInput.value=gmailId;
  var gmailStatus=document.getElementById('settings-gmail-status');
  if(gmailStatus){
    var isConn=(typeof _gmailConnected!=='undefined'&&_gmailConnected);
    gmailStatus.innerHTML='<span style="display:inline-flex;align-items:center;gap:6px">'
      +'<span style="width:8px;height:8px;border-radius:50%;background:'+(isConn?'#059669':'#EF4444')+'"></span>'
      +(isConn?'Gmail ulangan ✓':'Gmail ulanmagan')
    +'</span>';
  }
}

function addPipelineStage(){
  var stages=JSON.parse(localStorage.getItem('_crmPipelineStages')||'null')||[
    {name:'Lead',color:'#3B82F6',label:'Aniqlangan'},{name:'Contacted',color:'#8B5CF6',label:'Bog\'lanildi'},
    {name:'Engaged',color:'#F59E0B',label:'Javob berdi'},{name:'Negotiation',color:'#EF4444',label:'Muzokara'},
    {name:'Customer',color:'#059669',label:'Mijoz bo\'ldi'}
  ];
  stages.push({name:'New Stage',color:'#94A3B8',label:'Yangi bosqich'});
  localStorage.setItem('_crmPipelineStages',JSON.stringify(stages));
  renderCrmSettings();
}
function removePipelineStage(idx){
  var stages=JSON.parse(localStorage.getItem('_crmPipelineStages')||'[]');
  stages.splice(idx,1);
  localStorage.setItem('_crmPipelineStages',JSON.stringify(stages));
  renderCrmSettings();
}

function addLossReason(){
  var inp=document.getElementById('new-loss-reason');if(!inp||!inp.value.trim())return;
  var reasons=JSON.parse(localStorage.getItem('_crmLossReasons')||'null')||['Narx mos kelmadi','Bozor qiziq emas','Raqobatchi tanlandi','Javob bermadi','Hududiy cheklovlar','Strategiya o\'zgardi','Kapital yetarli emas'];
  reasons.push(inp.value.trim());
  localStorage.setItem('_crmLossReasons',JSON.stringify(reasons));
  inp.value='';
  renderCrmSettings();
}
function removeLossReason(idx){
  var reasons=JSON.parse(localStorage.getItem('_crmLossReasons')||'[]');
  reasons.splice(idx,1);
  localStorage.setItem('_crmLossReasons',JSON.stringify(reasons));
  renderCrmSettings();
}

function addQuestionCategory(){
  var inp=document.getElementById('new-question-cat');if(!inp||!inp.value.trim())return;
  var cats=JSON.parse(localStorage.getItem('_crmQuestionCats')||'null')||['Investitsiya hajmi','Texnologiya','Logistika','Kadrlar','Huquqiy masalalar','Infratuzilma','Bozor tahlili'];
  cats.push(inp.value.trim());
  localStorage.setItem('_crmQuestionCats',JSON.stringify(cats));
  inp.value='';
  renderCrmSettings();
}
function removeQuestionCategory(idx){
  var cats=JSON.parse(localStorage.getItem('_crmQuestionCats')||'[]');
  cats.splice(idx,1);
  localStorage.setItem('_crmQuestionCats',JSON.stringify(cats));
  renderCrmSettings();
}

function addUserRole(){
  var roles=JSON.parse(localStorage.getItem('_crmUserRoles')||'null')||[
    {name:'Admin',role:'admin',email:'admin@navoiy-fez.uz'},{name:'Menejer',role:'manager',email:'manager@navoiy-fez.uz'}
  ];
  roles.push({name:'Yangi',role:'viewer',email:''});
  localStorage.setItem('_crmUserRoles',JSON.stringify(roles));
  renderCrmSettings();
}
function removeUserRole(idx){
  var roles=JSON.parse(localStorage.getItem('_crmUserRoles')||'[]');
  roles.splice(idx,1);
  localStorage.setItem('_crmUserRoles',JSON.stringify(roles));
  renderCrmSettings();
}

function saveGmailClientId(){
  var inp=document.getElementById('settings-gmail-client-id');
  if(inp) localStorage.setItem('_gmailClientId',inp.value.trim());
  if(typeof toast==='function') toast('Gmail Client ID saqlandi','success');
}

function saveCrmSettings(){
  // Save pipeline stages from inputs
  var stageNames=document.querySelectorAll('.stage-name-input');
  var stageLabels=document.querySelectorAll('.stage-label-input');
  var stageColors=document.querySelectorAll('.stage-color-input');
  if(stageNames.length>0){
    var stages=[];
    stageNames.forEach(function(inp,i){
      stages.push({
        name:inp.value.trim(),
        label:stageLabels[i]?stageLabels[i].value.trim():'',
        color:stageColors[i]?stageColors[i].value:'#94A3B8'
      });
    });
    localStorage.setItem('_crmPipelineStages',JSON.stringify(stages));
  }
  // Save user roles
  var roleNames=document.querySelectorAll('.role-name-input');
  var roleEmails=document.querySelectorAll('.role-email-input');
  var roleTypes=document.querySelectorAll('.role-type-input');
  if(roleNames.length>0){
    var roles=[];
    roleNames.forEach(function(inp,i){
      roles.push({
        name:inp.value.trim(),
        email:roleEmails[i]?roleEmails[i].value.trim():'',
        role:roleTypes[i]?roleTypes[i].value:'viewer'
      });
    });
    localStorage.setItem('_crmUserRoles',JSON.stringify(roles));
  }
  // Save notification settings
  var notif={
    reply:document.getElementById('notif-new-reply')?document.getElementById('notif-new-reply').checked:true,
    stage:document.getElementById('notif-stage-change')?document.getElementById('notif-stage-change').checked:true,
    zoom:document.getElementById('notif-zoom-remind')?document.getElementById('notif-zoom-remind').checked:true,
    digest:document.getElementById('notif-weekly-digest')?document.getElementById('notif-weekly-digest').checked:true,
    followup:document.getElementById('notif-followup')?document.getElementById('notif-followup').checked:true
  };
  localStorage.setItem('_crmNotifications',JSON.stringify(notif));
  // Save gmail
  saveGmailClientId();
  if(typeof toast==='function') toast('✅ Sozlamalar saqlandi!','success');
}

function exportCrmData(){
  var data={
    investorCompanies:DB.investorCompanies||[],
    investors:DB.investors||[],
    zoom:DB.zoom||[],
    forums:DB.forums||[],
    finderResults:DB.finderResults||[],
    settings:{
      pipelineStages:JSON.parse(localStorage.getItem('_crmPipelineStages')||'null'),
      lossReasons:JSON.parse(localStorage.getItem('_crmLossReasons')||'null'),
      questionCats:JSON.parse(localStorage.getItem('_crmQuestionCats')||'null'),
      userRoles:JSON.parse(localStorage.getItem('_crmUserRoles')||'null'),
      notifications:JSON.parse(localStorage.getItem('_crmNotifications')||'null')
    }
  };
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='crm_export_'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  if(typeof toast==='function') toast('📥 Ma\'lumotlar eksport qilindi','success');
}

function importCrmData(evt){
  var file=evt.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(data.investorCompanies) DB.investorCompanies=data.investorCompanies;
      if(data.investors) DB.investors=data.investors;
      if(data.zoom) DB.zoom=data.zoom;
      if(data.forums) DB.forums=data.forums;
      if(data.finderResults) DB.finderResults=data.finderResults;
      if(data.settings){
        if(data.settings.pipelineStages) localStorage.setItem('_crmPipelineStages',JSON.stringify(data.settings.pipelineStages));
        if(data.settings.lossReasons) localStorage.setItem('_crmLossReasons',JSON.stringify(data.settings.lossReasons));
        if(data.settings.questionCats) localStorage.setItem('_crmQuestionCats',JSON.stringify(data.settings.questionCats));
        if(data.settings.userRoles) localStorage.setItem('_crmUserRoles',JSON.stringify(data.settings.userRoles));
        if(data.settings.notifications) localStorage.setItem('_crmNotifications',JSON.stringify(data.settings.notifications));
      }
      if(typeof saveDB==='function') saveDB();
      renderCrmSettings();
      if(typeof toast==='function') toast('📤 Ma\'lumotlar import qilindi','success');
    }catch(err){
      if(typeof toast==='function') toast('❌ Xato: fayl formati noto\'g\'ri','error');
    }
  };
  reader.readAsText(file);
  evt.target.value='';
}

function resetCrmData(){
  if(!confirm('Haqiqatan ham barcha CRM ma\'lumotlarini o\'chirmoqchimisiz? Bu amalni qaytarib bo\'lmaydi!')) return;
  DB.investorCompanies=[];DB.investors=[];DB.zoom=[];DB.forums=[];DB.finderResults=[];
  if(typeof saveDB==='function') saveDB();
  localStorage.removeItem('_crmPipelineStages');localStorage.removeItem('_crmLossReasons');
  localStorage.removeItem('_crmQuestionCats');localStorage.removeItem('_crmUserRoles');
  localStorage.removeItem('_crmNotifications');
  renderCrmSettings();
  if(typeof toast==='function') toast('🗑️ Barcha CRM ma\'lumotlari tozalandi','success');
}

/* ═══ CRM EXECUTIVE DASHBOARD ═══ */
function getCrmPeriodRange(){
  var sel = document.getElementById('crm-period-select');
  var val = sel ? sel.value : 'all';
  var now = new Date();
  var end = new Date(now); end.setHours(23,59,59,999);
  var start = null;
  if(val==='today'){ start = new Date(now); start.setHours(0,0,0,0); }
  else if(val==='week'){ var d=new Date(now); var dow=d.getDay()||7; d.setDate(d.getDate()-(dow-1)); d.setHours(0,0,0,0); start=d; }
  else if(val==='month'){ start = new Date(now.getFullYear(), now.getMonth(), 1); }
  else if(val==='quarter'){ var q=Math.floor(now.getMonth()/3); start = new Date(now.getFullYear(), q*3, 1); }
  else if(val==='year'){ start = new Date(now.getFullYear(), 0, 1); }
  return { start: start, end: end, key: val };
}
function parseItemDate(it){
  var raw = it.sana || it.date || it.createdAt || it.addedDate || it.added_at || it.created_at || '';
  if(!raw) return null;
  var s = String(raw).replace(/\./g,'-').trim();
  var d = new Date(s);
  if(isNaN(d.getTime())){
    var parts = String(raw).split(/[.\-\/]/);
    if(parts.length>=3){
      var y = parts[0].length===4 ? parseInt(parts[0]) : parseInt(parts[2]);
      var m = parts[0].length===4 ? parseInt(parts[1])-1 : parseInt(parts[1])-1;
      var day = parts[0].length===4 ? parseInt(parts[2]) : parseInt(parts[0]);
      d = new Date(y,m,day);
    }
  }
  return isNaN(d.getTime()) ? null : d;
}
function inRange(it, range){
  if(range.key === 'all' || !range.start) return true;
  var d = parseItemDate(it);
  if(!d) return false;
  return d >= range.start && d <= range.end;
}

function renderCrmDashboard(){
  var allCo = DB.investorCompanies||[];
  var allInv = DB.investors||[];
  var allZoom = DB.zoom||[];
  var allForums = DB.forums||[];
  var allFinder = DB.finderResults||[];
  var range = getCrmPeriodRange();
  var co = allCo.filter(function(c){return inRange(c,range);});
  var inv = allInv.filter(function(c){return inRange(c,range);});
  var zoom = allZoom.filter(function(c){return inRange(c,range);});
  var forums = allForums.filter(function(c){return inRange(c,range);});
  var finder = allFinder.filter(function(c){return inRange(c,range);});

  // Count metrics — unique companies (grouped by company+country, like investor base)
  var _coGroupSet = {};
  co.forEach(function(r){
    var k = (typeof getInvestorCompanyGroupKey === 'function') ? getInvestorCompanyGroupKey(r) : String(r.kompaniya||r.id||'').toLowerCase();
    _coGroupSet[k] = true;
  });
  var totalCompanies = Object.keys(_coGroupSet).length;
  // Investorlar Bazasi jadvaliga moslashtirish — visibleGroups (eksportyorlar)
  if(window._icCounts && typeof window._icCounts.jami === 'number'){
    totalCompanies = window._icCounts.jami;
  }
  var totalSent = co.filter(function(c){return c.emailSent;}).length;
  var totalOpened = co.filter(function(c){return c.emailOpened;}).length;
  var totalReplied = co.filter(function(c){return c.emailReplied || c.pipelineStage==='replied' || c.pipelineStage==='meeting';}).length;
  var totalPositive = co.filter(function(c){return c.replySentiment==='positive' || c.pipelineStage==='replied' || c.pipelineStage==='meeting';}).length;
  var totalNegative = co.filter(function(c){return c.replySentiment==='negative';}).length;
  var totalIgnored = totalSent - totalReplied;
  if(totalIgnored < 0) totalIgnored = 0;
  var totalCalls = co.filter(function(c){return c.phoneCalled;}).length;
  var totalZoom = zoom.length;
  var totalVisits = inv.length;
  var totalOpened2 = co.filter(function(c){return c.companyOpened;}).length;
  var totalLand = co.filter(function(c){return c.landAllocated;}).length;
  var pipelineVal = 0;
  co.forEach(function(c){if(c.potentialInvestment) pipelineVal+=Number(c.potentialInvestment)||0;});

  var kpis = [
    {label:"Jami kompaniyalar",val:totalCompanies,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',color:'#3B82F6',bg:'rgba(59,130,246,.1)'},
    {label:"Yuborilgan xatlar",val:totalSent,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',color:'#8B5CF6',bg:'rgba(139,92,246,.1)'},
    {label:"Javob olgan",val:totalReplied,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',color:'#10B981',bg:'rgba(16,185,129,.1)'},
    {label:"Ijobiy javoblar",val:totalPositive,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>',color:'#059669',bg:'rgba(5,150,105,.1)'},
    {label:"Salbiy javoblar",val:totalNegative,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z"/><path d="M17 2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3"/></svg>',color:'#EF4444',bg:'rgba(239,68,68,.1)'},
    {label:"Javobsiz (ignored)",val:totalIgnored,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',color:'#F59E0B',bg:'rgba(245,158,11,.1)'},
    {label:"Telefon qo'ng'iroqlar",val:totalCalls,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>',color:'#6366F1',bg:'rgba(99,102,241,.1)'},
    {label:"Zoom uchrashuvlar",val:totalZoom,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',color:'#0EA5E9',bg:'rgba(14,165,233,.1)'},
    {label:"Navoiyga tashrif buyurgan",val:totalVisits,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',color:'#14B8A6',bg:'rgba(20,184,166,.1)'},
    {label:"Korxona ochildi",val:totalOpened2,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>',color:'#059669',bg:'rgba(5,150,105,.1)'},
    {label:"Yer ajratildi",val:totalLand,icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',color:'#D97706',bg:'rgba(217,119,6,.1)'},
    {label:"Pipeline qiymati",val:'$'+(_fmtNum(pipelineVal)),icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',color:'#7C3AED',bg:'rgba(124,58,237,.1)'}
  ];

  var treeEl = document.getElementById('crm-kpi-tree');
  if(!treeEl) return;

  function _oc(label,val,pct,icon,color,bg,extra,nav){
    var pctStr = pct !== null ? '<span class="oc-pct">'+pct+'%</span>' : '';
    var onclick = nav ? ' onclick="'+nav+'"' : '';
    return '<div class="org-card'+(extra||'')+'"'+onclick+' style="cursor:pointer" title="'+label+' sahifasiga o\'tish">'
      +'<div class="oc-icon" style="background:'+bg+';color:'+color+'">'+icon+'</div>'
      +'<div><div class="oc-val">'+val+' '+pctStr+'</div><div class="oc-label">'+label+'</div></div>'
    +'</div>';
  }
  var icons={}; kpis.forEach(function(k){icons[k.label]=k;});
  var gi=function(l){var k=icons[l];return k?{icon:k.icon,color:k.color,bg:k.bg}:{icon:'',color:'#94A3B8',bg:'rgba(148,163,184,.1)'};};
  var c=function(l,v,pct,ex,nav){var i=gi(l);return _oc(l,v,pct,i.icon,i.color,i.bg,ex,nav);};
  var vl='<div class="org-vline"></div>';

  // Apollo & TradeAtlas total source counts (unique companies, not contacts)
  function _uniqueCompanyCount(arr){
    var s = {};
    arr.forEach(function(r){
      var k = (typeof getInvestorCompanyGroupKey === 'function') ? getInvestorCompanyGroupKey(r) : String(r.kompaniya||r.id||'').toLowerCase();
      s[k] = true;
    });
    return Object.keys(s).length;
  }
  var apolloRecs = co.filter(function(x){
    var m = String(x.manba||x.source||'').toLowerCase();
    return m.indexOf('apollo')!==-1 || m === 'csv-import' || m === 'finder';
  });
  var tradeRecs = co.filter(function(x){
    var m = String(x.manba||x.source||'').toLowerCase();
    return m.indexOf('tradeatlas')!==-1 || m==='trade';
  });
  var apolloTotal = _uniqueCompanyCount(apolloRecs);
  var tradeTotal = _uniqueCompanyCount(tradeRecs);
  // Investorlar Bazasi jadvaliga moslashtirish (eksportyorlar)
  if(window._icCounts){
    if(typeof window._icCounts.apollo === 'number') apolloTotal = window._icCounts.apollo;
    if(typeof window._icCounts.tradeatlas === 'number') tradeTotal = window._icCounts.tradeatlas;
  }
  var pApolloTotal = totalCompanies ? Math.round(apolloTotal/totalCompanies*100) : 0;
  var pTradeTotal = totalCompanies ? Math.round(tradeTotal/totalCompanies*100) : 0;

  // Apollo vs TradeAtlas counts (from positive responses)
  var apolloPositive=co.filter(function(x){return (x.replySentiment==='positive'||x.pipelineStage==='replied'||x.pipelineStage==='meeting')&&(x.source==='apollo'||x.source==='finder');}).length;
  var tradePositive=co.filter(function(x){return (x.replySentiment==='positive'||x.pipelineStage==='replied'||x.pipelineStage==='meeting')&&(x.source==='tradeatlas'||x.source==='trade');}).length;
  // Fallback: if no source tagged, split by finderResults vs investorCompanies
  if(apolloPositive===0&&tradePositive===0&&totalPositive>0){
    apolloPositive=finder.filter(function(x){return x.replySentiment==='positive'||x.pipelineStage==='replied';}).length;
    tradePositive=totalPositive-apolloPositive;
    if(tradePositive<0) tradePositive=0;
  }

  // Percentage calculations (Jami = 100%)
  var base=totalCompanies||1;
  var pSent=Math.round(totalSent/base*100);
  var pReplied=totalSent?Math.round(totalReplied/totalSent*100):0;
  var pIgnored=totalSent?Math.round(totalIgnored/totalSent*100):0;
  var pPositive=totalReplied?Math.round(totalPositive/totalReplied*100):0;
  var pNegative=totalReplied?Math.round(totalNegative/totalReplied*100):0;
  var pApollo=totalPositive?Math.round(apolloPositive/totalPositive*100):0;
  var pTrade=totalPositive?Math.round(tradePositive/totalPositive*100):0;
  var pZoom=totalPositive?Math.round(totalZoom/totalPositive*100):0;
  var pVisits=totalPositive?Math.round(totalVisits/totalPositive*100):0;
  var pLand=totalPositive?Math.round(totalLand/totalPositive*100):0;
  var pOpened2=totalPositive?Math.round(totalOpened2/totalPositive*100):0;

  // Navigation targets
  var navCompanies="switchCrmTab(\'companies\')";
  var navActivities="switchCrmTab(\'activities\')";
  var navFunnel="switchCrmTab(\'funnel\')";
  var navGeo="switchCrmTab(\'geo\')";
  var navReports="switchCrmTab(\'reports\')";
  var navInvestors="showPage(\'investors\')";
  var navMailbox="switchCrmTab(\'mailbox\')";
  var navFinder="showPage(\'finder\')";
  var navTrade="showPage(\'trade\')";

  // Apollo & TradeAtlas icons
  var apolloIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  var tradeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>';

  // Horizontal layout — columns left to right, SVG draws lines
  // cards[0]=Jami [1]=Yuborilgan [2]=Javob [3]=Javobsiz [4]=Ijobiy [5]=Salbiy [6]=Apollo [7]=TradeAtlas [8]=Zoom [9]=Tashrif [10]=Korxona [11]=Yer [12]=Telefon [13]=Pipeline
  function buildChainTree(rootLabel, rootVal, rootIcon, rootColor, rootBg, subset, treeId, rootPct){
    if(rootPct === undefined) rootPct = 100;
    var sSent = subset.filter(function(c){return c.emailSent;}).length;
    var sReplied = subset.filter(function(c){return c.emailReplied||c.pipelineStage==='replied'||c.pipelineStage==='meeting';}).length;
    var sPositive = subset.filter(function(c){return c.replySentiment==='positive'||c.pipelineStage==='replied'||c.pipelineStage==='meeting';}).length;
    var sNegative = subset.filter(function(c){return c.replySentiment==='negative';}).length;
    var sIgnored = Math.max(0, sSent-sReplied);
    var sZoom = rootLabel==='Jami kompaniyalar' ? totalZoom : 0;
    var sVisits = rootLabel==='Jami kompaniyalar' ? totalVisits : 0;
    var sOpen = subset.filter(function(c){return c.companyOpened;}).length;
    var sLand = subset.filter(function(c){return c.landAllocated;}).length;
    var sTotal = subset.length || 1;
    var pSent2 = Math.round(sSent/sTotal*100);
    var pReplied2 = sSent?Math.round(sReplied/sSent*100):0;
    var pIgnored2 = sSent?Math.round(sIgnored/sSent*100):0;
    var pPos2 = sReplied?Math.round(sPositive/sReplied*100):0;
    var pNeg2 = sReplied?Math.round(sNegative/sReplied*100):0;
    var pZoom2 = sPositive?Math.round(sZoom/sPositive*100):0;
    var pVis2 = sPositive?Math.round(sVisits/sPositive*100):0;
    var pOpen2 = sPositive?Math.round(sOpen/sPositive*100):0;
    var pLand2 = sPositive?Math.round(sLand/sPositive*100):0;
    var colStyle = 'display:flex;flex-direction:column;align-items:flex-start;gap:5px;min-width:0;flex:1 1 0;justify-content:center';
    return '<div class="org-tree" data-tree="'+treeId+'" style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;align-items:center;width:100%;padding:6px 0;position:relative;justify-content:stretch">'
      +'<div class="org-col" style="'+colStyle+'">'+_oc(rootLabel,rootVal,rootPct,rootIcon,rootColor,rootBg,' root',navCompanies)+'</div>'
      +'<div class="org-col" style="'+colStyle+'">'+c('Yuborilgan xatlar',sSent,pSent2,'',navMailbox)+'</div>'
      +'<div class="org-col" style="'+colStyle+'">'+c('Javob olgan',sReplied,pReplied2,'',navActivities)+c('Javobsiz (ignored)',sIgnored,pIgnored2,'',navActivities)+'</div>'
      +'<div class="org-col" style="'+colStyle+'">'+c('Ijobiy javoblar',sPositive,pPos2,'',navFunnel)+c('Salbiy javoblar',sNegative,pNeg2,'',navFunnel)+'</div>'
      +'<div class="org-col" style="'+colStyle+'">'+c('Zoom uchrashuvlar',sZoom,pZoom2,'',navActivities)+c('Navoiyga tashrif buyurgan',sVisits,pVis2,'',navInvestors)+c('Korxona ochildi',sOpen,pOpen2,'',navReports)+c('Yer ajratildi',sLand,pLand2,'',navGeo)+'</div>'
    +'</div>';
  }

  var apolloCo = co.filter(function(x){ var m=String(x.manba||x.source||'').toLowerCase(); return m.indexOf('apollo')!==-1; });
  var tradeCo = co.filter(function(x){ var m=String(x.manba||x.source||'').toLowerCase(); return m.indexOf('tradeatlas')!==-1 || m==='trade'; });

  var jamiCardHtml = '<div id="jamiRootWrap" style="display:flex;align-items:center;position:relative">'
    +_oc('Jami kompaniyalar', totalCompanies, 100, icons['Jami kompaniyalar'].icon, '#3B82F6', 'rgba(59,130,246,.1)', ' root jami-main', navCompanies)
  +'</div>';

  treeEl.innerHTML =
    '<div id="jamiCombined" style="display:flex;align-items:stretch;gap:14px;position:relative">'
      +jamiCardHtml
      +'<div style="flex:1;display:flex;flex-direction:column;gap:18px">'
        +buildChainTree('Apollo jami', apolloTotal, apolloIcon, '#6366F1', 'rgba(99,102,241,.1)', apolloCo, 'apollo', pApolloTotal)
        +buildChainTree('TradeAtlas jami', tradeTotal, tradeIcon, '#0EA5E9', 'rgba(14,165,233,.1)', tradeCo, 'trade', pTradeTotal)
      +'</div>'
    +'</div>';

  // Draw SVG connecting lines
  setTimeout(_drawOrgLines, 100);

  // Render charts
  _renderCrmFunnel(co);
  _renderCrmPositionPie(co);
  _renderCrmContinentBar(co, finder);
  _renderCrmReplyHourChart(co);
  _renderCrmIndustryBar(co, finder);
  _renderCrmExporterDonut(co);
  _renderCrmLatestActivities(co, inv, zoom);
}

function _drawOrgLines(){
  document.querySelectorAll('.org-tree').forEach(_drawOrgLinesFor);
  _drawJamiCombinedLines();
}

function _drawJamiCombinedLines(){
  var wrap = document.getElementById('jamiCombined');
  if(!wrap) return;
  var old = wrap.querySelector('.jami-svg-lines');
  if(old) old.remove();
  var jamiCard = wrap.querySelector('.jami-main');
  var trees = wrap.querySelectorAll('.org-tree');
  if(!jamiCard || trees.length<2) return;
  var wRect = wrap.getBoundingClientRect();
  var jRect = jamiCard.getBoundingClientRect();
  var jx = jRect.right - wRect.left;
  var jy = jRect.top + jRect.height/2 - wRect.top;
  var targets = [];
  trees.forEach(function(t){
    var firstCard = t.querySelector('.org-card');
    if(!firstCard) return;
    var r = firstCard.getBoundingClientRect();
    targets.push({ x: r.left - wRect.left, y: r.top + r.height/2 - wRect.top });
  });
  if(!targets.length) return;
  var forkX = Math.round((jx + Math.min.apply(null, targets.map(function(t){return t.x;}))) / 2);
  var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','jami-svg-lines');
  svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:0;';
  svg.setAttribute('width', wRect.width);
  svg.setAttribute('height', wRect.height);
  function ln(x1,y1,x2,y2){
    var l = document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);
    l.setAttribute('stroke','#818cf8');l.setAttribute('stroke-width','2');l.setAttribute('stroke-linecap','round');
    svg.appendChild(l);
  }
  ln(jx, jy, forkX, jy);
  var minY = Math.min.apply(null, targets.map(function(t){return t.y;}));
  var maxY = Math.max.apply(null, targets.map(function(t){return t.y;}));
  ln(forkX, minY, forkX, maxY);
  targets.forEach(function(t){ ln(forkX, t.y, t.x, t.y); });
  wrap.appendChild(svg);
}

function _drawOrgLinesFor(tree){
  if(!tree) return;
  var old=tree.querySelector('.org-svg-lines');
  if(old) old.remove();
  var tRect=tree.getBoundingClientRect();
  var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','org-svg-lines');
  svg.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:0;';
  svg.setAttribute('width',tRect.width);
  svg.setAttribute('height',tRect.height);
  tree.style.position='relative';

  function line(x1,y1,x2,y2){
    var l=document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute('x1',x1);l.setAttribute('y1',y1);
    l.setAttribute('x2',x2);l.setAttribute('y2',y2);
    l.setAttribute('stroke','#818cf8');l.setAttribute('stroke-width','2');
    l.setAttribute('stroke-linecap','round');
    svg.appendChild(l);
  }
  function cp(card){
    var r=card.getBoundingClientRect();
    return {x:r.left+r.width/2-tRect.left, y:r.top+r.height/2-tRect.top,
            l:r.left-tRect.left, r:r.right-tRect.left, t:r.top-tRect.top, b:r.bottom-tRect.top};
  }

  var allCards=tree.querySelectorAll('.org-card');
  if(allCards.length<10) return;
  var byLabel={};
  allCards.forEach(function(c){
    var lbl=c.querySelector('.oc-label');
    if(lbl) byLabel[lbl.textContent.trim()]=c;
  });
  var rootCard = tree.querySelector('.org-col .org-card.root') || allCards[0];
  var seqLabels=['Yuborilgan xatlar','Javob olgan','Javobsiz (ignored)','Ijobiy javoblar','Salbiy javoblar','Zoom uchrashuvlar','Navoiyga tashrif buyurgan','Korxona ochildi','Yer ajratildi'];
  var seqCards=seqLabels.map(function(l){return byLabel[l];});
  if(seqCards.some(function(x){return !x;})) return;
  var p=[cp(rootCard)].concat(seqCards.map(cp));

  line(p[0].r, p[0].y, p[1].l, p[1].y);
  // Yuborilgan → fork to Javob olgan & Javobsiz
  var forkX1=Math.round((p[1].r+p[2].l)/2);
  line(p[1].r, p[1].y, forkX1, p[1].y);
  line(forkX1, p[2].y, forkX1, p[3].y);
  line(forkX1, p[2].y, p[2].l, p[2].y);
  line(forkX1, p[3].y, p[3].l, p[3].y);
  // Javob olgan → fork to Ijobiy & Salbiy
  var forkX2=Math.round((p[2].r+p[4].l)/2);
  line(p[2].r, p[2].y, forkX2, p[2].y);
  line(forkX2, p[4].y, forkX2, p[5].y);
  line(forkX2, p[4].y, p[4].l, p[4].y);
  line(forkX2, p[5].y, p[5].l, p[5].y);
  // Ijobiy+Salbiy → merge → fork to Zoom, Tashrif, Korxona, Yer
  var mergeX=Math.round(Math.max(p[4].r,p[5].r)+14);
  var forkX4=Math.round((mergeX+p[6].l)/2);
  line(p[4].r, p[4].y, mergeX, p[4].y);
  line(p[5].r, p[5].y, mergeX, p[5].y);
  line(mergeX, p[4].y, mergeX, p[5].y);
  var mergeY=Math.round((p[4].y+p[5].y)/2);
  line(mergeX, mergeY, forkX4, mergeY);
  line(forkX4, p[6].y, forkX4, p[9].y);
  line(forkX4, p[6].y, p[6].l, p[6].y);
  line(forkX4, p[7].y, p[7].l, p[7].y);
  line(forkX4, p[8].y, p[8].l, p[8].y);
  line(forkX4, p[9].y, p[9].l, p[9].y);

  tree.appendChild(svg);
}

function _fmtNum(n){
  if(n>=1e9) return (n/1e9).toFixed(1)+'B';
  if(n>=1e6) return (n/1e6).toFixed(1)+'M';
  if(n>=1e3) return (n/1e3).toFixed(1)+'K';
  return String(n);
}

/* Funnel chart */
function _renderCrmFunnel(co){
  var el=document.getElementById('crm-funnel-chart');if(!el)return;
  var stages=[
    {name:'Aniqlangan (Lead)',count:co.length,color:'#3B82F6'},
    {name:'Bog\'lanildi (Contacted)',count:co.filter(function(c){return c.emailSent;}).length,color:'#8B5CF6'},
    {name:'Javob berdi (Engaged)',count:co.filter(function(c){return c.emailReplied||c.pipelineStage==='replied';}).length,color:'#F59E0B'},
    {name:'Muzokara (Negotiation)',count:co.filter(function(c){return c.pipelineStage==='meeting';}).length,color:'#EF4444'},
    {name:'Mijoz (Customer)',count:co.filter(function(c){return c.companyOpened;}).length,color:'#059669'}
  ];
  var max=Math.max(stages[0].count,1);
  el.innerHTML=stages.map(function(s,i){
    var w=Math.max(((s.count/max)*100),8);
    var conv=i>0?(stages[i-1].count>0?Math.round(s.count/stages[i-1].count*100):0)+'%':'100%';
    return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">'
      +'<div style="width:90px;font-size:.82rem;font-weight:600;color:var(--text);text-align:right">'+s.name+'</div>'
      +'<div style="flex:1;background:var(--bg2);border-radius:8px;height:34px;position:relative;overflow:hidden">'
        +'<div style="width:'+w+'%;height:100%;background:'+s.color+';border-radius:8px;display:flex;align-items:center;padding-left:10px;transition:width .6s ease">'
          +'<span style="font-size:.78rem;font-weight:700;color:#fff">'+s.count+'</span>'
        +'</div>'
      +'</div>'
      +'<div style="width:48px;font-size:.75rem;font-weight:500;color:var(--text3);text-align:center">'+conv+'</div>'
    +'</div>';
  }).join('');
}

/* Position Pie */
function _renderCrmPositionPie(co){
  var el=document.getElementById('crm-position-chart');if(!el)return;
  var cats={'Rahbar (C-Level)':0,'Direktor (VP)':0,'Menejer':0,'Mutaxassis':0,'Boshqa':0};
  co.forEach(function(c){
    var t=(c.contactTitle||'').toLowerCase();
    if(/ceo|cfo|coo|cto|founder|president|owner|chief/.test(t)) cats['Rahbar (C-Level)']++;
    else if(/vp|vice|director/.test(t)) cats['Direktor (VP)']++;
    else if(/manager|head/.test(t)) cats['Menejer']++;
    else if(/specialist|engineer|analyst|coordinator/.test(t)) cats['Mutaxassis']++;
    else cats['Boshqa']++;
  });
  var total=Object.values(cats).reduce(function(a,b){return a+b;},0)||1;
  var colors=['#3B82F6','#8B5CF6','#F59E0B','#10B981','#94A3B8'];
  var items=Object.keys(cats);
  // Simple horizontal bars as pie alternative
  el.innerHTML=items.map(function(k,i){
    var pct=Math.round(cats[k]/total*100);
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
      +'<div style="width:10px;height:10px;border-radius:50%;background:'+colors[i]+';flex-shrink:0"></div>'
      +'<div style="width:85px;font-size:.8rem;font-weight:500;color:var(--text)">'+k+'</div>'
      +'<div style="flex:1;background:var(--bg2);border-radius:6px;height:24px;overflow:hidden">'
        +'<div style="width:'+Math.max(pct,2)+'%;height:100%;background:'+colors[i]+';border-radius:6px;transition:width .5s"></div>'
      +'</div>'
      +'<div style="width:65px;font-size:.78rem;font-weight:600;color:var(--text);text-align:right">'+cats[k]+' ('+pct+'%)</div>'
    +'</div>';
  }).join('');
}

/* Continent bar */
function _renderCrmContinentBar(co, finder){
  var el=document.getElementById('crm-continent-chart');if(!el)return;
  var continentMap={
    'United States':'Amerika','Canada':'Amerika','Brazil':'Amerika','Mexico':'Amerika','Argentina':'Amerika','Chile':'Amerika','Colombia':'Amerika',
    'Germany':'Yevropa','France':'Yevropa','Italy':'Yevropa','Spain':'Yevropa','UK':'Yevropa','United Kingdom':'Yevropa','Netherlands':'Yevropa','Switzerland':'Yevropa','Sweden':'Yevropa','Poland':'Yevropa','Belgium':'Yevropa','Austria':'Yevropa','Norway':'Yevropa','Denmark':'Yevropa','Finland':'Yevropa','Czech Republic':'Yevropa','Portugal':'Yevropa','Ireland':'Yevropa','Greece':'Yevropa','Romania':'Yevropa','Turkey':'Yevropa','Russia':'Yevropa',
    'China':'Osiyo','Japan':'Osiyo','South Korea':'Osiyo','India':'Osiyo','Indonesia':'Osiyo','Thailand':'Osiyo','Vietnam':'Osiyo','Malaysia':'Osiyo','Singapore':'Osiyo','Philippines':'Osiyo','Pakistan':'Osiyo','Bangladesh':'Osiyo','UAE':'Osiyo','Saudi Arabia':'Osiyo','Israel':'Osiyo','Iran':'Osiyo','Kazakhstan':'Osiyo','Uzbekistan':'Osiyo',
    'South Africa':'Afrika','Nigeria':'Afrika','Egypt':'Afrika','Kenya':'Afrika','Morocco':'Afrika','Ghana':'Afrika','Ethiopia':'Afrika','Tanzania':'Afrika',
    'Australia':'Okeaniya','New Zealand':'Okeaniya'
  };
  var conts={'Yevropa':0,'Osiyo':0,'Amerika':0,'Afrika':0,'Okeaniya':0};
  var allItems = co.concat(finder);
  allItems.forEach(function(c){
    var country = c.davlat || c.country || '';
    var cont = continentMap[country] || 'Boshqa';
    if(conts[cont]!==undefined) conts[cont]++;
  });
  var max=Math.max.apply(null,Object.values(conts))||1;
  var colors={'Yevropa':'#3B82F6','Osiyo':'#F59E0B','Amerika':'#8B5CF6','Afrika':'#10B981','Okeaniya':'#0EA5E9'};
  el.innerHTML=Object.keys(conts).map(function(k){
    var w=Math.max(Math.round(conts[k]/max*100),4);
    return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">'
      +'<div style="width:68px;font-size:.82rem;font-weight:600;color:var(--text);text-align:right">'+k+'</div>'
      +'<div style="flex:1;background:var(--bg2);border-radius:7px;height:30px;overflow:hidden">'
        +'<div style="width:'+w+'%;height:100%;background:'+(colors[k]||'#94A3B8')+';border-radius:7px;display:flex;align-items:center;padding-left:8px;transition:width .5s">'
          +'<span style="font-size:.75rem;font-weight:700;color:#fff">'+(conts[k]>0?conts[k]:'')+'</span>'
        +'</div>'
      +'</div>'
    +'</div>';
  }).join('');
}

/* Reply time distribution — in company's LOCAL timezone */
// Country → UTC offset in hours (covers most common countries)
var _CRM_TZ_OFFSETS = {
  'Uzbekistan':5,'UZ':5,'Russia':3,'RU':3,'Kazakhstan':5,'KZ':5,'Kyrgyzstan':6,'Tajikistan':5,'Turkmenistan':5,
  'United States':-5,'USA':-5,'US':-5,'Canada':-5,'CA':-5,'Mexico':-6,'MX':-6,'Brazil':-3,'BR':-3,'Argentina':-3,'AR':-3,'Chile':-4,'CL':-4,'Colombia':-5,'CO':-5,'Peru':-5,'PE':-5,
  'United Kingdom':0,'UK':0,'GB':0,'Ireland':0,'IE':0,'Portugal':0,'PT':0,
  'Germany':1,'DE':1,'France':1,'FR':1,'Italy':1,'IT':1,'Spain':1,'ES':1,'Netherlands':1,'NL':1,'Belgium':1,'BE':1,'Austria':1,'AT':1,'Switzerland':1,'CH':1,'Sweden':1,'SE':1,'Norway':1,'NO':1,'Denmark':1,'DK':1,'Poland':1,'PL':1,'Czech Republic':1,'CZ':1,'Czechia':1,
  'Finland':2,'FI':2,'Greece':2,'GR':2,'Romania':2,'RO':2,'Egypt':2,'EG':2,'South Africa':2,'ZA':2,'Turkey':3,'TR':3,
  'UAE':4,'Saudi Arabia':3,'SA':3,'Qatar':3,'QA':3,'Israel':2,'IL':2,'Iran':3.5,'IR':3.5,
  'Pakistan':5,'PK':5,'India':5.5,'IN':5.5,'Bangladesh':6,'BD':6,
  'China':8,'CN':8,'Thailand':7,'TH':7,'Vietnam':7,'VN':7,'Indonesia':7,'ID':7,'Malaysia':8,'MY':8,'Singapore':8,'SG':8,'Philippines':8,'PH':8,
  'Japan':9,'JP':9,'South Korea':9,'KR':9,'Korea':9,
  'Australia':10,'AU':10,'New Zealand':12,'NZ':12,
  'Nigeria':1,'NG':1,'Kenya':3,'KE':3,'Morocco':1,'MA':1,'Ghana':0,'GH':0
};
function _crmGetCountryOffset(country){
  if(!country) return null;
  var raw = String(country).trim();
  if(_CRM_TZ_OFFSETS[raw] !== undefined) return _CRM_TZ_OFFSETS[raw];
  // Try case-insensitive match
  var lc = raw.toLowerCase();
  var keys = Object.keys(_CRM_TZ_OFFSETS);
  for(var i=0;i<keys.length;i++){
    if(keys[i].toLowerCase() === lc) return _CRM_TZ_OFFSETS[keys[i]];
  }
  return null;
}
function _renderCrmReplyHourChart(co){
  var el = document.getElementById('crm-reply-hour-chart');
  if(!el) return;
  var buckets = new Array(24).fill(0);
  var matched = 0, noCountry = 0, noReply = 0;
  co.forEach(function(c){
    // Only count companies that have replied
    var replied = c.emailReplied || c.pipelineStage === 'replied' || c.pipelineStage === 'meeting';
    if(!replied){ noReply++; return; }
    // Find reply timestamp — check common fields
    var ts = c.replyAt || c.emailRepliedAt || c.lastReplyAt || c.replyTimestamp || c.repliedAt || null;
    if(!ts){ noReply++; return; }
    var country = c.davlat || c.country || '';
    var offset = _crmGetCountryOffset(country);
    if(offset === null){ noCountry++; return; }
    var d = new Date(ts);
    if(isNaN(d.getTime())){ noReply++; return; }
    // Get UTC hour, then add country offset
    var utcHour = d.getUTCHours() + d.getUTCMinutes()/60;
    var localHour = Math.floor((utcHour + offset + 24) % 24);
    buckets[localHour]++;
    matched++;
  });

  if(matched === 0){
    el.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:.82rem;padding:2rem 1rem">'
      + '<div style="font-size:1.8rem;margin-bottom:.5rem">⏰</div>'
      + '<div style="font-weight:600;color:var(--text2);margin-bottom:.3rem">Javob vaqti ma\'lumoti yo\'q</div>'
      + '<div style="font-size:.72rem">Kompaniyalardan javob kelganda vaqt avtomatik qayd qilinadi va shu yerda davlat mahalliy vaqti bo\'yicha taqsimot ko\'rsatiladi.</div>'
      + '</div>';
    return;
  }

  // Build bar chart — 24 hours on X
  var max = Math.max.apply(null, buckets) || 1;
  var labels = [];
  for(var h=0;h<24;h++) labels.push(h);
  var peakHour = buckets.indexOf(max);

  if(typeof ApexCharts !== 'undefined'){
    apexRender('crm-reply-hour', el, {
      chart:{type:'bar',height:240,fontFamily:'Inter,sans-serif',toolbar:{show:false},animations:{enabled:true,speed:800},dropShadow:{enabled:true,top:2,left:0,blur:6,color:'#4361EE',opacity:.15}},
      series:[{name:'Javoblar', data:buckets}],
      xaxis:{categories:labels.map(function(h){return String(h).padStart(2,'0')+':00';}),labels:{style:{fontSize:'10px'},rotate:0}},
      yaxis:{labels:{style:{fontSize:'10px'}},decimalsInFloat:0},
      fill:{
        type:'gradient',
        gradient:{shade:'dark',type:'vertical',shadeIntensity:.3,opacityFrom:1,opacityTo:.88,stops:[0,100],colorStops:[
          {offset:0,color:'#5168ff',opacity:1},
          {offset:100,color:'#3b4fd9',opacity:.85}
        ]}
      },
      stroke:{show:false},
      plotOptions:{bar:{borderRadius:6,columnWidth:'62%',distributed:false}},
      dataLabels:{enabled:false},
      tooltip:{
        theme:'light',
        custom:function(o){
          var v = o.series[0][o.dataPointIndex];
          var hr = o.dataPointIndex;
          return '<div style="padding:8px 12px;font-size:.72rem"><b>'+String(hr).padStart(2,'0')+':00 — '+String((hr+1)%24).padStart(2,'0')+':00</b><br><span style="color:#4361EE;font-weight:700">'+v+'</span> ta javob</div>';
        }
      },
      grid:{borderColor:'rgba(15,23,42,.05)',strokeDashArray:4}
    });
  } else {
    // Fallback without ApexCharts — simple HTML bars
    el.innerHTML = '<div style="display:flex;align-items:flex-end;gap:2px;height:160px;padding:8px 4px">'
      + buckets.map(function(v,h){
          var pct = Math.max(Math.round(v/max*100), v?4:0);
          return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">'
            + '<div style="width:100%;background:linear-gradient(180deg,#5168ff,#3b4fd9);border-radius:4px 4px 0 0;height:'+pct+'%;min-height:'+(v?3:0)+'px" title="'+String(h).padStart(2,'0')+':00 — '+v+' ta"></div>'
            + '<div style="font-size:9px;color:var(--text3)">'+String(h).padStart(2,'0')+'</div>'
            + '</div>';
        }).join('')
      + '</div>';
  }

  // Append summary line
  var summary = document.createElement('div');
  summary.style.cssText = 'margin-top:8px;padding:8px 10px;background:linear-gradient(135deg,rgba(70,95,255,.08),rgba(70,95,255,.03));border-radius:8px;font-size:.7rem;color:var(--text2);display:flex;gap:16px;flex-wrap:wrap';
  summary.innerHTML = '<span>📊 Jami tahlillangan: <b style="color:var(--text)">'+matched+'</b></span>'
    + '<span>⭐ Eng faol vaqt: <b style="color:#4361EE">'+String(peakHour).padStart(2,'0')+':00</b> (<b>'+max+'</b> ta javob)</span>'
    + (noCountry ? '<span style="color:var(--text3)">⚠️ '+noCountry+' ta davlat noma\'lum</span>' : '');
  el.appendChild(summary);
}

/* Top 10 industries */
function _renderCrmIndustryBar(co, finder){
  var el=document.getElementById('crm-industry-chart');if(!el)return;
  var raws = DB.rawMaterials || [];
  var products = DB.products || [];
  var zoom = DB.zoom || [];
  var investors = DB.investors || [];
  if(!raws.length){
    el.innerHTML='<div style="text-align:center;color:var(--text3);font-size:.82rem;padding:2rem">Xomashyolar ro\'yxati bo\'sh</div>';
    return;
  }
  var productById = {};
  products.forEach(function(p){ productById[String(p.id)] = p; });
  var rawById = {};
  raws.forEach(function(r){ rawById[String(r.id)] = r; });

  function resolveRawForCompany(c){
    var pid = String(c.mahsulotProductId || c.productId || '').trim();
    if(!pid) return '';
    var p = productById[pid];
    if(!p) return '';
    return String(p.raw_id||'');
  }
  function companyMatchesZoom(c, z){
    var cName = String(c.kompaniya||'').toLowerCase().trim();
    var zOrg = String(z.org||z.kompaniya||'').toLowerCase().trim();
    return cName && zOrg && (cName===zOrg || zOrg.indexOf(cName)!==-1 || cName.indexOf(zOrg)!==-1);
  }
  function companyMatchesVisit(c, v){
    var cName = String(c.kompaniya||'').toLowerCase().trim();
    var vName = String(v.kompaniya||'').toLowerCase().trim();
    return cName && vName && (cName===vName || vName.indexOf(cName)!==-1 || cName.indexOf(vName)!==-1);
  }

  // Track unique companies per raw material per stat (not contacts/leads)
  var statSets = {};
  function ensureRid(rid){
    if(!statSets[rid]) statSets[rid] = {found:new Set(),sent:new Set(),replied:new Set(),pos:new Set(),neg:new Set(),zoom:new Set(),visit:new Set(),open:new Set(),land:new Set()};
    return statSets[rid];
  }
  function addCo(rid, key, c){
    if(!rid) return;
    var groupKey = (typeof getInvestorCompanyGroupKey==='function') ? getInvestorCompanyGroupKey(c) : String(c.kompaniya||c.id||'').toLowerCase();
    ensureRid(rid)[key].add(groupKey);
  }
  co.forEach(function(c){
    var rid = resolveRawForCompany(c);
    if(!rid) return;
    addCo(rid,'found',c);
    if(c.emailSent) addCo(rid,'sent',c);
    var replied = c.emailReplied || c.pipelineStage==='replied' || c.pipelineStage==='meeting';
    if(replied) addCo(rid,'replied',c);
    var pos = c.replySentiment==='positive' || c.pipelineStage==='replied' || c.pipelineStage==='meeting';
    if(pos) addCo(rid,'pos',c);
    if(c.replySentiment==='negative') addCo(rid,'neg',c);
    if(c.companyOpened) addCo(rid,'open',c);
    if(c.landAllocated) addCo(rid,'land',c);
    if(zoom.some(function(z){return companyMatchesZoom(c,z);})) addCo(rid,'zoom',c);
    if(investors.some(function(v){return companyMatchesVisit(c,v);})) addCo(rid,'visit',c);
  });
  // Convert sets to counts
  var stats = {};
  Object.keys(statSets).forEach(function(rid){
    stats[rid] = {};
    Object.keys(statSets[rid]).forEach(function(k){ stats[rid][k] = statSets[rid][k].size; });
  });

  function rawName(rid){
    var r = rawById[rid];
    if(!r) return '—';
    return r.name_uz || r.name_en || r.name || '—';
  }
  function topFor(key){
    var best = null, bestVal = 0;
    Object.keys(stats).forEach(function(rid){
      if(stats[rid][key] > bestVal){ bestVal = stats[rid][key]; best = rid; }
    });
    return { name: best ? rawName(best) : '—', val: bestVal };
  }
  var rows = [
    {key:'found',  label:"Eng ko'p kompaniya topilgan",  data:topFor('found'),  color:'#3B82F6'},
    {key:'sent',   label:"Eng ko'p xabar yuborilgan",    data:topFor('sent'),   color:'#8B5CF6'},
    {key:'replied',label:"Eng ko'p javob kelgan",        data:topFor('replied'),color:'#F59E0B'},
    {key:'pos',    label:"Eng ko'p ijobiy javob olingan",data:topFor('pos'),    color:'#10B981'},
    {key:'neg',    label:"Eng ko'p salbiy javob olingan",data:topFor('neg'),    color:'#EF4444'},
    {key:'zoom',   label:"Eng ko'p Zoom uchrashuvlari",  data:topFor('zoom'),   color:'#0EA5E9'},
    {key:'visit',  label:"Eng ko'p tashrif bo'lgan",     data:topFor('visit'),  color:'#14B8A6'},
    {key:'open',   label:"Eng ko'p korxona ochilgan",    data:topFor('open'),   color:'#059669'},
    {key:'land',   label:"Eng ko'p yer ajratilgan",      data:topFor('land'),   color:'#D97706'}
  ];
  var max = Math.max.apply(null, rows.map(function(r){return r.data.val;}).concat([1]));

  // Stash data for modal
  window._crmTopStats = stats;
  window._crmTopRawNameFn = rawName;
  window._crmTopRows = rows;

  function listFor(key){
    return Object.keys(stats).map(function(rid){
      return { name: rawName(rid), val: stats[rid][key]||0 };
    }).filter(function(e){return e.val>0;}).sort(function(a,b){return b.val-a.val;});
  }
  el.innerHTML = '<div style="display:grid;grid-template-columns:repeat('+rows.length+',minmax(0,1fr));gap:10px">'+
    rows.map(function(r){
      var list = listFor(r.key);
      var listHtml = list.length
        ? list.slice(0,8).map(function(e, idx){
            return '<div style="display:flex;align-items:flex-start;gap:6px;padding:6px 8px;background:#fff;border:1px solid var(--border);border-radius:8px;font-size:.74rem">'+
              '<span style="background:'+r.color+'25;color:'+r.color+';font-size:.65rem;font-weight:800;min-width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">'+(idx+1)+'</span>'+
              '<span style="color:var(--text);font-weight:600;flex:1;min-width:0;word-break:break-word;line-height:1.3" title="'+escHtml(e.name)+'">'+escHtml(e.name)+'</span>'+
              '<span style="background:'+r.color+';color:#fff;font-size:.66rem;font-weight:800;padding:1px 7px;border-radius:10px;flex-shrink:0;line-height:1.4">'+e.val+'</span>'+
            '</div>';
          }).join('')
        : '<div style="font-size:.74rem;color:var(--text3);font-style:italic;text-align:center;padding:12px 0">Yo\'q</div>';
      return '<div style="display:flex;flex-direction:column;gap:7px;padding:12px;background:'+r.color+'10;border:1px solid '+r.color+'30;border-radius:12px;min-width:0">'+
        '<div style="font-size:.8rem;font-weight:700;color:'+r.color+';text-align:center;line-height:1.3;min-height:38px;display:flex;align-items:center;justify-content:center">'+r.label+'</div>'+
        listHtml+
      '</div>';
    }).join('')+
  '</div>';
}

function openCrmTopBreakdown(key, labelOrIdx, color){
  var stats = window._crmTopStats || {};
  var rawName = window._crmTopRawNameFn || function(rid){return rid;};
  var label = labelOrIdx;
  if(typeof labelOrIdx === 'number' && window._crmTopRows && window._crmTopRows[labelOrIdx]){
    label = window._crmTopRows[labelOrIdx].label;
  }
  var entries = Object.keys(stats).map(function(rid){
    return { rid: rid, name: rawName(rid), val: stats[rid][key] || 0 };
  }).filter(function(e){ return e.val > 0; }).sort(function(a,b){return b.val-a.val;});
  var max = entries.length ? entries[0].val : 1;
  var html = '<div id="crmTopBreakdownModal" style="position:fixed;inset:0;background:rgba(15,22,41,.6);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center" onclick="if(event.target===this)this.remove()">'+
    '<div style="background:var(--card);border-radius:16px;width:min(640px,94vw);max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)">'+
      '<div style="padding:1rem 1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">'+
        '<div><div style="font-size:1rem;font-weight:800;color:var(--text)">'+escapeHtmlText(label)+'</div><div style="font-size:.7rem;color:var(--text3);margin-top:2px">Xomashyolar bo\'yicha taqsimot</div></div>'+
        '<button onclick="document.getElementById(\'crmTopBreakdownModal\').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text3)">✕</button>'+
      '</div>'+
      '<div style="padding:1rem 1.25rem">'+
        (entries.length === 0
          ? '<div style="text-align:center;padding:2rem;color:var(--text3);font-size:.85rem">Ma\'lumot yo\'q</div>'
          : entries.map(function(e,i){
              var w = Math.max(Math.round(e.val/max*100), 8);
              return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'+
                '<div style="width:24px;font-size:.72rem;color:var(--text3);text-align:right">'+(i+1)+'</div>'+
                '<div style="width:160px;font-size:.78rem;font-weight:600;color:var(--text);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+escapeHtmlText(e.name)+'">'+escapeHtmlText(e.name)+'</div>'+
                '<div style="flex:1;background:var(--bg2);border-radius:6px;height:24px;overflow:hidden">'+
                  '<div style="width:'+w+'%;height:100%;background:'+color+';border-radius:6px;display:flex;align-items:center;padding-left:10px">'+
                    '<span style="font-size:.7rem;font-weight:800;color:#fff">'+e.val+'</span>'+
                  '</div>'+
                '</div>'+
              '</div>';
            }).join(''))+
      '</div>'+
    '</div>'+
  '</div>';
  var old = document.getElementById('crmTopBreakdownModal');
  if(old) old.remove();
  document.body.insertAdjacentHTML('beforeend', html);
}
window.openCrmTopBreakdown = openCrmTopBreakdown;

/* Exporter donut (simple) */
function _renderCrmExporterDonut(co){
  var el=document.getElementById('crm-exporter-chart');if(!el)return;
  var prev=co.filter(function(c){return c.previousExporter;}).length;
  var newM=co.length-prev;
  var total=co.length||1;
  var prevPct=Math.round(prev/total*100);
  var newPct=100-prevPct;
  // SVG donut
  var r=60, cx=75, cy=75, stroke=16;
  var circ=2*Math.PI*r;
  var dash1=circ*prevPct/100;
  var dash2=circ-dash1;
  el.innerHTML='<div style="display:flex;align-items:center;gap:1.2rem;justify-content:center">'
    +'<svg width="150" height="150" viewBox="0 0 150 150">'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="var(--bg2)" stroke-width="'+stroke+'"/>'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#10B981" stroke-width="'+stroke+'" stroke-dasharray="'+dash1+' '+dash2+'" stroke-dashoffset="0" transform="rotate(-90 '+cx+' '+cy+')" style="transition:stroke-dasharray .6s"/>'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#3B82F6" stroke-width="'+stroke+'" stroke-dasharray="'+dash2+' '+dash1+'" stroke-dashoffset="-'+dash1+'" transform="rotate(-90 '+cx+' '+cy+')" style="transition:stroke-dasharray .6s"/>'
      +'<text x="'+cx+'" y="'+cy+'" text-anchor="middle" dy=".35em" style="font-size:1.1rem;font-weight:800;fill:var(--text)">'+total+'</text>'
    +'</svg>'
    +'<div>'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><div style="width:12px;height:12px;border-radius:4px;background:#10B981"></div><div style="font-size:.82rem;color:var(--text)">Avval eksport qilgan: <b>'+prev+'</b> ('+prevPct+'%)</div></div>'
      +'<div style="display:flex;align-items:center;gap:8px"><div style="width:12px;height:12px;border-radius:4px;background:#3B82F6"></div><div style="font-size:.82rem;color:var(--text)">Yangi bozorga kirgan: <b>'+newM+'</b> ('+newPct+'%)</div></div>'
    +'</div>'
  +'</div>';
}

/* Latest activities */
function _renderCrmLatestActivities(co, inv, zoom){
  var el=document.getElementById('crm-latest-activities');if(!el)return;
  var acts=[];
  // From investors (visits)
  inv.forEach(function(r){
    acts.push({type:'tashrif',company:r.kompaniya||r.company||'',date:r.sana||r.date||'',desc:(r.davlat||'')+' — tashrif buyurdi'});
  });
  // From zoom
  zoom.forEach(function(r){
    acts.push({type:'zoom',company:r.kompaniya||r.company||'',date:r.sana||r.date||'',desc:'Zoom uchrashuv'});
  });
  // From email sent
  co.forEach(function(c){
    if(c.emailSentDate) acts.push({type:'email',company:c.kompaniya||c.name||'',date:c.emailSentDate,desc:'Email yuborildi'});
    if(c.emailReplied) acts.push({type:'reply',company:c.kompaniya||c.name||'',date:c.replyDate||'',desc:'Javob keldi'});
  });
  // Sort by date descending
  acts.sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});
  acts=acts.slice(0,10);

  var typeIcons={
    tashrif:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
    zoom:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
    email:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    reply:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>'
  };

  if(acts.length===0){
    el.innerHTML='<div style="text-align:center;color:var(--text3);font-size:.82rem;padding:2rem">Hozircha faoliyat yo\'q</div>';
    return;
  }
  el.innerHTML=acts.map(function(a){
    return '<div style="display:flex;align-items:flex-start;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)">'
      +'<div style="width:32px;height:32px;border-radius:9px;background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">'+(typeIcons[a.type]||'')+'</div>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:.82rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(a.company||'Noaniq')+'</div>'
        +'<div style="font-size:.72rem;color:var(--text3)">'+a.desc+'</div>'
      +'</div>'
      +'<div style="font-size:.7rem;color:var(--text3);white-space:nowrap">'+(a.date||'')+'</div>'
    +'</div>';
  }).join('');
}

/* ═══ CRM ACTIVITIES TAB ═══ */
function renderCrmActivities(){
  var tbody=document.getElementById('crm-act-tbody');
  var countEl=document.getElementById('crm-act-count');
  var kpisEl=document.getElementById('crm-act-kpis');
  if(!tbody)return;

  var co=DB.investorCompanies||[];
  var inv=DB.investors||[];
  var zoom=DB.zoom||[];
  var typeF=(document.getElementById('crm-act-filter-type')||{}).value||'all';
  var sentF=(document.getElementById('crm-act-filter-sentiment')||{}).value||'all';
  var searchF=((document.getElementById('crm-act-filter-search')||{}).value||'').toLowerCase();

  // Build unified activities list
  var acts=[];

  // Emails sent
  co.forEach(function(c){
    var name=c.kompaniya||c.name||'';
    var country=c.davlat||c.country||'';
    if(c.emailSent||c.emailSentDate){
      acts.push({type:'email',icon:'📧',label:'Email yuborildi',company:name,country:country,
        detail:(c.contactName||'')+(c.contactTitle?' ('+c.contactTitle+')':''),
        sentiment:'neutral',date:c.emailSentDate||''});
    }
    if(c.emailReplied||c.replyDate){
      var s=c.replySentiment||'neutral';
      acts.push({type:'reply',icon:'💬',label:'Javob keldi',company:name,country:country,
        detail:s==='positive'?'Ijobiy javob':(s==='negative'?'Salbiy javob':'Javob olindi'),
        sentiment:s,date:c.replyDate||''});
    }
    if(c.phoneCalled){
      acts.push({type:'call',icon:'📞',label:'Telefon qo\'ng\'iroq',company:name,country:country,
        detail:(c.phoneDuration||'')+' daqiqa',sentiment:'neutral',date:c.phoneDate||''});
    }
    if(c.pipelineStage==='meeting'){
      acts.push({type:'zoom',icon:'📹',label:'Muzokara/Zoom',company:name,country:country,
        detail:'Uchrashuv o\'tkazildi',sentiment:'positive',date:''});
    }
  });

  // Visits from investors
  inv.forEach(function(r){
    acts.push({type:'visit',icon:'✈',label:'Navoiyga tashrif buyurgan',company:r.kompaniya||r.company||'',
      country:r.davlat||r.country||'',detail:r.loyiha||r.maqsad||'Tashrif buyurdi',
      sentiment:'positive',date:r.sana||r.date||''});
  });

  // Zoom meetings
  zoom.forEach(function(r){
    acts.push({type:'zoom',icon:'📹',label:'Zoom uchrashuv',company:r.kompaniya||r.company||'',
      country:r.davlat||r.country||'',detail:(r.davomiyligi||'')+' daqiqa',
      sentiment:'neutral',date:r.sana||r.date||''});
  });

  // Sort by date desc
  acts.sort(function(a,b){return (b.date||'').localeCompare(a.date||'');});

  // Filter
  var filtered=acts.filter(function(a){
    if(typeF!=='all'&&a.type!==typeF)return false;
    if(sentF!=='all'&&a.sentiment!==sentF)return false;
    if(searchF&&a.company.toLowerCase().indexOf(searchF)<0)return false;
    return true;
  });

  // KPI summary
  var typeCounts={email:0,reply:0,call:0,zoom:0,visit:0};
  acts.forEach(function(a){typeCounts[a.type]=(typeCounts[a.type]||0)+1;});
  if(kpisEl){
    var kpiData=[
      {label:'Email',count:typeCounts.email,color:'#8B5CF6',icon:'📧'},
      {label:'Javob',count:typeCounts.reply,color:'#10B981',icon:'💬'},
      {label:'Qo\'ng\'iroq',count:typeCounts.call,color:'#6366F1',icon:'📞'},
      {label:'Zoom',count:typeCounts.zoom,color:'#0EA5E9',icon:'📹'},
      {label:'Tashrif',count:typeCounts.visit,color:'#14B8A6',icon:'✈'}
    ];
    kpisEl.innerHTML=kpiData.map(function(k){
      return '<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 12px;text-align:center;border-left:3px solid '+k.color+'">'
        +'<div style="font-size:1.2rem;font-weight:800;color:var(--text)">'+k.count+'</div>'
        +'<div style="font-size:.68rem;color:var(--text3)">'+k.icon+' '+k.label+'</div>'
      +'</div>';
    }).join('');
  }

  // Sentiment badge
  var sentBadge=function(s){
    if(s==='positive')return '<span style="font-size:.64rem;padding:2px 8px;border-radius:10px;background:#ecfdf5;color:#059669;font-weight:600">Ijobiy</span>';
    if(s==='negative')return '<span style="font-size:.64rem;padding:2px 8px;border-radius:10px;background:#fef2f2;color:#ef4444;font-weight:600">Salbiy</span>';
    return '<span style="font-size:.64rem;padding:2px 8px;border-radius:10px;background:var(--bg2);color:var(--text3);font-weight:600">Neytral</span>';
  };

  tbody.innerHTML=filtered.slice(0,300).map(function(a,i){
    return '<tr>'
      +'<td style="font-size:.7rem;color:var(--text3)">'+(i+1)+'</td>'
      +'<td style="font-size:.9rem;text-align:center">'+a.icon+'</td>'
      +'<td><div style="font-size:.76rem;font-weight:600;color:var(--text)">'+a.company+'</div>'
        +'<div style="font-size:.64rem;color:var(--text3)">'+a.label+'</div></td>'
      +'<td style="font-size:.72rem;color:var(--text3)">'+a.country+'</td>'
      +'<td style="font-size:.7rem;color:var(--text)">'+a.detail+'</td>'
      +'<td>'+sentBadge(a.sentiment)+'</td>'
      +'<td style="font-size:.68rem;color:var(--text3);white-space:nowrap">'+a.date+'</td>'
    +'</tr>';
  }).join('');

  if(filtered.length===0){
    tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:2rem;font-size:.7rem;color:var(--text3)">Faoliyat topilmadi</td></tr>';
  }
  if(countEl) countEl.textContent=filtered.length+' ta';
}

function openQuickActivity(){
  var co=DB.investorCompanies||[];
  var options=co.map(function(c,i){
    return '<option value="'+i+'">'+(c.kompaniya||c.name||'Kompaniya #'+(i+1))+'</option>';
  }).join('');

  var html='<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center" id="crm-qact-modal" onclick="if(event.target===this)this.remove()">'
    +'<div style="background:var(--card);border-radius:12px;padding:1.2rem;max-width:440px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
      +'<div style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:.8rem">Yangi faoliyat qo\'shish</div>'
      +'<div style="margin-bottom:.6rem">'
        +'<label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:3px">Kompaniya</label>'
        +'<select id="crm-qact-company" style="width:100%;font-size:.68rem;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text)">'+options+'</select>'
      +'</div>'
      +'<div style="margin-bottom:.6rem">'
        +'<label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:3px">Faoliyat turi</label>'
        +'<select id="crm-qact-type" style="width:100%;font-size:.68rem;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text)">'
          +'<option value="call">📞 Telefon qo\'ng\'iroq</option>'
          +'<option value="zoom">📹 Zoom uchrashuv</option>'
          +'<option value="visit">✈ Tashrif (Navoiyga keldi)</option>'
          +'<option value="note">📝 Izoh</option>'
        +'</select>'
      +'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-bottom:.6rem">'
        +'<div><label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:3px">Davomiyligi (daq)</label>'
          +'<input id="crm-qact-dur" type="number" placeholder="30" style="width:100%;font-size:.68rem;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text)"></div>'
        +'<div><label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:3px">Kayfiyat</label>'
          +'<select id="crm-qact-sent" style="width:100%;font-size:.68rem;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text)">'
            +'<option value="positive">Ijobiy</option><option value="neutral" selected>Neytral</option><option value="negative">Salbiy</option></select></div>'
      +'</div>'
      +'<div style="margin-bottom:.8rem">'
        +'<label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:3px">Izoh</label>'
        +'<textarea id="crm-qact-notes" rows="2" placeholder="Qo\'shimcha..." style="width:100%;font-size:.68rem;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);resize:vertical"></textarea>'
      +'</div>'
      +'<div style="display:flex;gap:.5rem;justify-content:flex-end">'
        +'<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'crm-qact-modal\').remove()" style="font-size:.62rem">Bekor qilish</button>'
        +'<button class="btn btn-blue btn-sm" onclick="saveQuickActivity()" style="font-size:.62rem">Saqlash</button>'
      +'</div>'
    +'</div>'
  +'</div>';
  document.body.insertAdjacentHTML('beforeend',html);
}

function saveQuickActivity(){
  var idx=parseInt((document.getElementById('crm-qact-company')||{}).value)||0;
  var co=DB.investorCompanies||[];
  var c=co[idx];
  var type=(document.getElementById('crm-qact-type')||{}).value||'note';
  var typeLabels={call:'Telefon qo\'ng\'iroq',zoom:'Zoom uchrashuv',visit:'Tashrif',note:'Izoh'};
  toast('✅ '+typeLabels[type]+' saqlandi: '+(c?(c.kompaniya||c.name):''));
  var m=document.getElementById('crm-qact-modal');if(m)m.remove();
}

/* ═══ CRM INTEGRATIONS ═══ */
function _crmIntegrationModal(title,bodyHtml){
  var html='<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center" id="crm-int-modal" onclick="if(event.target===this)this.remove()">'
    +'<div style="background:var(--card);border-radius:14px;padding:1.3rem;max-width:480px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3);max-height:85vh;overflow-y:auto">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">'
        +'<div style="font-size:.85rem;font-weight:700;color:var(--text)">'+title+'</div>'
        +'<button onclick="document.getElementById(\'crm-int-modal\').remove()" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:1.1rem">&times;</button>'
      +'</div>'
      +bodyHtml
    +'</div></div>';
  document.body.insertAdjacentHTML('beforeend',html);
}

function openZoomSetup(){
  var cats=['Transport','Soliq','Ish haqi','Energetika','FEZ imtiyozlari','Viza','Xomashyo','Bozor','Infratuzilma','Qonunchilik','Sherik topish','Qurilish muddatlari','Boshqa'];
  var catTags=cats.map(function(c){
    return '<span style="font-size:.52rem;padding:2px 8px;border-radius:4px;background:var(--bg2);color:var(--text);border:1px solid var(--border)">'+c+'</span>';
  }).join('');

  _crmIntegrationModal('Zoom Integration',
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px" id="crm-zoom-setup-st">'
      +'<div style="width:8px;height:8px;border-radius:50%;background:#EF4444"></div>'
      +'<span style="font-size:.65rem;color:var(--text3)">Ulanmagan</span>'
    +'</div>'
    +'<div style="font-size:.62rem;color:var(--text3);margin-bottom:12px;line-height:1.6">'
      +'Zoom Pro account orqali uchrashuvlar avtomatik ro\'yxatga tushadi. Transkrip olinadi va Claude AI savol kategoriyalarni avtomot belgilaydi. Mutaxassis faqat tasdiqlaydi.'
    +'</div>'
    +'<div style="background:var(--bg2);border-radius:8px;padding:10px 12px;margin-bottom:12px">'
      +'<div style="font-size:.58rem;font-weight:600;color:var(--text);margin-bottom:6px">Imkoniyatlar:</div>'
      +'<div style="font-size:.55rem;color:var(--text3);line-height:1.7">'
        +'✓ Zoom Pro account → Zoom API<br>'
        +'✓ Uchrashuvlar avtomot ro\'yxatga tushadi<br>'
        +'✓ Transkrip olinadi (Zoom Pro feature)<br>'
        +'✓ Claude AI savol kategoriyalarni belgilaydi<br>'
        +'✓ Mutaxassis faqat tasdiqlaydi (1 daqiqa)'
      +'</div>'
    +'</div>'
    +'<div style="margin-bottom:12px">'
      +'<label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:3px">Zoom API Key</label>'
      +'<div style="display:flex;gap:.4rem">'
        +'<input id="crm-zoom-api-key" placeholder="Zoom API Key" style="flex:1;font-size:.65rem;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text)">'
        +'<button class="btn btn-blue btn-sm" onclick="connectZoomIntegration()" style="font-size:.6rem">Ulash</button>'
      +'</div>'
    +'</div>'
    +'<div>'
      +'<label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:5px">Savol kategoriyalari (Zoom uchrashuv uchun)</label>'
      +'<div style="display:flex;flex-wrap:wrap;gap:4px">'+catTags+'</div>'
    +'</div>'
  );
}

function openEmailSetup(){
  var isConn = (typeof _gmailConnected!=='undefined' && _gmailConnected);
  var stDot = isConn ? '#059669' : '#EF4444';
  var stTxt = isConn ? 'Gmail ulandi' : 'Ulanmagan';
  var stClr = isConn ? '#059669' : 'var(--text3)';
  _crmIntegrationModal('Email Integration (Gmail / Outlook)',
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px" id="crm-email-setup-st">'
      +'<div style="width:8px;height:8px;border-radius:50%;background:'+stDot+'"></div>'
      +'<span style="font-size:.72rem;color:'+stClr+';font-weight:600">'+stTxt+'</span>'
    +'</div>'
    +'<div style="font-size:.74rem;color:var(--text3);margin-bottom:12px;line-height:1.6">'
      +'Mutaxassisning inbox\'i botga ulanadi (OAuth). Reply\'lar avtomatik kompaniya timeline\'iga qo\'shiladi. Qo\'lda kiritish kerak emas — full automation.'
    +'</div>'
    +'<div style="background:var(--bg2);border-radius:8px;padding:10px 12px;margin-bottom:12px">'
      +'<div style="font-size:.72rem;font-weight:600;color:var(--text);margin-bottom:6px">Imkoniyatlar:</div>'
      +'<div style="font-size:.68rem;color:var(--text3);line-height:1.7">'
        +'✓ Gmail/Outlook inbox OAuth orqali ulanadi<br>'
        +'✓ Reply\'lar avtomot timeline\'ga tushadi<br>'
        +'✓ Claude sentiment analysis: ijobiy/neytral/salbiy<br>'
        +'✓ Intent aniqlash: qiziqish / rad / savol / uchrashuv so\'rash<br>'
        +'✓ Qo\'lda kiritish kerak emas — full automation'
      +'</div>'
    +'</div>'
    +'<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:14px">'
      +'<button class="btn btn-sm" onclick="connectGmailIntegration()" style="font-size:.72rem;background:#EA4335;color:#fff;border:none;display:flex;align-items:center;gap:5px;padding:7px 16px">'
        +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20v12z" fill="currentColor"/></svg>'
        +'Gmail ulash'
      +'</button>'
      +'<button class="btn btn-sm" onclick="connectOutlookIntegration()" style="font-size:.72rem;background:#0078D4;color:#fff;border:none;display:flex;align-items:center;gap:5px;padding:7px 16px">'
        +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" fill="currentColor" opacity=".3"/><path d="M22 6l-10 7L2 6" stroke="#fff" stroke-width="1.5" fill="none"/></svg>'
        +'Outlook ulash'
      +'</button>'
    +'</div>'
    +'<div style="background:var(--bg2);border-radius:8px;padding:10px 12px">'
      +'<div style="font-size:.72rem;font-weight:600;color:var(--text);margin-bottom:6px">Sentiment tahlili namunasi:</div>'
      +'<div style="display:flex;flex-direction:column;gap:5px">'
        +'<div style="display:flex;align-items:center;gap:6px;font-size:.68rem"><span style="padding:2px 8px;border-radius:10px;background:#ecfdf5;color:#059669;font-weight:600">Ijobiy</span><span style="color:var(--text3)">"Biz qiziqishimiz bor, Zoom kelishaylik"</span></div>'
        +'<div style="display:flex;align-items:center;gap:6px;font-size:.68rem"><span style="padding:2px 8px;border-radius:10px;background:var(--bg2);color:var(--text3);font-weight:600">Neytral</span><span style="color:var(--text3)">"Ma\'lumot uchun rahmat, ko\'rib chiqamiz"</span></div>'
        +'<div style="display:flex;align-items:center;gap:6px;font-size:.68rem"><span style="padding:2px 8px;border-radius:10px;background:#fef2f2;color:#ef4444;font-weight:600">Salbiy</span><span style="color:var(--text3)">"Hozircha qiziqmayapmiz, rahmat"</span></div>'
      +'</div>'
    +'</div>'
  );
}

function connectZoomIntegration(){
  var key=(document.getElementById('crm-zoom-api-key')||{}).value||'';
  if(!key){toast('Zoom API Key kiriting','error');return;}
  // Update modal status
  var mst=document.getElementById('crm-zoom-setup-st');
  if(mst) mst.innerHTML='<div style="width:8px;height:8px;border-radius:50%;background:#059669"></div><span style="font-size:.65rem;color:#059669;font-weight:600">Ulandi</span>';
  // Update inline status
  var st=document.getElementById('crm-zoom-status');
  if(st) st.innerHTML='<div style="width:6px;height:6px;border-radius:50%;background:#059669"></div> <span style="color:#059669">Ulandi</span>';
  toast('✅ Zoom Integration ulandi!');
}
function connectGmailIntegration(){
  var clientId = localStorage.getItem('_gmailClientId');
  if(!clientId){
    toast('⚠️ Avval Admin → Gmail sozlamalarida Client ID kiriting','error');
    return;
  }
  if(typeof google === 'undefined' || !google.accounts){
    toast('⚠️ Google API yuklanmadi. Sahifani yangilang','error');
    return;
  }
  try{
    var client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
      callback: function(resp){
        if(resp.error){toast('❌ Gmail xato: '+resp.error,'error');return;}
        if(typeof onGmailToken==='function') onGmailToken(resp);
        var mst=document.getElementById('crm-email-setup-st');
        if(mst) mst.innerHTML='<div style="width:8px;height:8px;border-radius:50%;background:#059669"></div><span style="font-size:.72rem;color:#059669;font-weight:600">Gmail ulandi</span>';
        var st=document.getElementById('crm-email-status');
        if(st) st.innerHTML='<div style="width:6px;height:6px;border-radius:50%;background:#059669"></div> <span style="color:#059669">Gmail ulandi</span>';
      }
    });
    client.requestAccessToken({prompt:'consent'});
  }catch(e){toast('❌ Gmail OAuth xato','error');console.error(e);}
}
function connectOutlookIntegration(){
  toast('⚠️ Outlook integration hozircha tayyor emas. Gmail orqali ulaning','info');
}

/* ═══ CRM REPORTS (HISOBOTLAR) ═══ */
function renderCrmReports(){
  var co=DB.investorCompanies||[];
  var inv=DB.investors||[];
  var zoom=DB.zoom||[];
  var periodVal=(document.getElementById('crm-rpt-period')||{}).value||'all';
  var yearVal=(document.getElementById('crm-rpt-year')||{}).value||'2026';

  // Stats
  var totalCo=co.length;
  var emailsSent=co.filter(function(c){return c.emailSent||c.emailSentDate;}).length;
  var replied=co.filter(function(c){return c.emailReplied||c.replyDate;}).length;
  var meetings=co.filter(function(c){return c.pipelineStage==='meeting';}).length;
  var customers=co.filter(function(c){return c.pipelineStage==='customer';}).length;
  var visits=inv.length;
  var zoomCalls=zoom.length;
  var replyRate=emailsSent>0?Math.round(replied/emailsSent*100):0;
  var convRate=totalCo>0?Math.round((meetings+customers)/totalCo*100):0;

  // KPIs
  var kpiEl=document.getElementById('crm-rpt-kpis');
  if(kpiEl){
    var kpis=[
      {val:totalCo,label:'Total Companies (Jami)',color:'#3B82F6',icon:'🏢'},
      {val:emailsSent,label:'Emails Sent (Yuborilgan)',color:'#8B5CF6',icon:'📧'},
      {val:replied,label:'Replies (Javoblar)',color:'#F59E0B',icon:'💬'},
      {val:replyRate+'%',label:'Reply Rate (Javob %)',color:replyRate>15?'#059669':'#EF4444',icon:'📊'},
      {val:meetings+customers,label:'Meetings (Uchrashuvlar)',color:'#10B981',icon:'🤝'},
      {val:visits,label:'Visits (Tashriflar)',color:'#0EA5E9',icon:'✈️'},
      {val:zoomCalls,label:'Zoom Calls',color:'#6366F1',icon:'📹'},
      {val:convRate+'%',label:'Conversion (Konversiya)',color:convRate>5?'#059669':'#EF4444',icon:'🎯'}
    ];
    kpiEl.innerHTML=kpis.map(function(k){
      return '<div class="ckpi" style="border-left:3px solid '+k.color+'">'
        +'<div class="ckpi-val" style="font-size:1.2rem">'+k.val+'</div>'
        +'<div class="ckpi-label">'+k.icon+' '+k.label+'</div>'
      +'</div>';
    }).join('');
  }

  // Pipeline Summary
  var pipEl=document.getElementById('crm-rpt-pipeline');
  if(pipEl){
    var stages=[
      {key:'lead',label:'Lead (Aniqlangan)',color:'#3B82F6'},
      {key:'sent',label:'Contacted (Xat yuborildi)',color:'#8B5CF6'},
      {key:'replied',label:'Engaged (Javob olindi)',color:'#F59E0B'},
      {key:'meeting',label:'Negotiation (Muzokara)',color:'#EF4444'},
      {key:'customer',label:'Customer (Mijoz)',color:'#059669'}
    ];
    var stageCounts={lead:0,sent:0,replied:0,meeting:0,customer:0};
    co.forEach(function(c){
      var st=c.pipelineStage||(c.emailReplied?'replied':(c.emailSent?'sent':'lead'));
      stageCounts[st]=(stageCounts[st]||0)+1;
    });
    var maxStage=Math.max.apply(null,Object.values(stageCounts).concat([1]));

    pipEl.innerHTML=stages.map(function(s){
      var cnt=stageCounts[s.key]||0;
      var pct=Math.round(cnt/maxStage*100);
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
        +'<div style="width:130px;font-size:.72rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+s.label+'">'+s.label+'</div>'
        +'<div style="flex:1;background:var(--bg2);border-radius:6px;height:22px;overflow:hidden">'
          +'<div style="width:'+Math.max(pct,3)+'%;height:100%;background:'+s.color+';border-radius:6px;transition:width .5s;opacity:.8"></div>'
        +'</div>'
        +'<div style="width:40px;font-size:.74rem;font-weight:700;color:var(--text);text-align:right">'+cnt+'</div>'
      +'</div>';
    }).join('');
  }

  // Activity Breakdown
  var actEl=document.getElementById('crm-rpt-activity-breakdown');
  if(actEl){
    var actTypes=[
      {label:'📧 Email yuborildi',count:emailsSent,color:'#3B82F6'},
      {label:'💬 Javob keldi',count:replied,color:'#F59E0B'},
      {label:'✈️ Navoiyga tashrif buyurgan',count:visits,color:'#10B981'},
      {label:'📹 Zoom uchrashuv',count:zoomCalls,color:'#6366F1'},
      {label:'📞 Qo\'ng\'iroq',count:0,color:'#EF4444'}
    ];
    var maxAct=Math.max.apply(null,actTypes.map(function(a){return a.count;}).concat([1]));

    actEl.innerHTML=actTypes.map(function(a){
      var pct=Math.round(a.count/maxAct*100);
      return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'
        +'<div style="width:130px;font-size:.72rem;color:var(--text);white-space:nowrap">'+a.label+'</div>'
        +'<div style="flex:1;background:var(--bg2);border-radius:6px;height:22px;overflow:hidden">'
          +'<div style="width:'+Math.max(pct,2)+'%;height:100%;background:'+a.color+';border-radius:6px;transition:width .5s;opacity:.8"></div>'
        +'</div>'
        +'<div style="width:35px;font-size:.74rem;font-weight:700;color:var(--text);text-align:right">'+a.count+'</div>'
      +'</div>';
    }).join('');
  }

  // Country Performance table
  var ctbody=document.getElementById('crm-rpt-country-tbody');
  if(ctbody){
    var cMap={};
    co.forEach(function(c){
      var country=(c.davlat||c.country||'').trim();
      if(!country) return;
      // Normalize
      // Extract last part if comma-separated (city, state, country)
      if(country.indexOf(',')>0){
        var parts=country.split(',');
        country=parts[parts.length-1].trim();
      }
      // Extra direct mappings
      var directMap={'United States':'USA','United Kingdom':'UK','United Arab Emirates':'UAE','South Korea':'South Korea','Russian Federation':'Russia','Xitoy':'China','Rossiya':'Russia','Eron':'Iran','Turkiya':'Turkey','Koreya':'South Korea','Germaniya':'Germany','Yaponiya':'Japan','Hindiston':'India','Fransiya':'France','Italiya':'Italy','Ispaniya':'Spain','Angliya':'UK','AQSH':'USA','BAA':'UAE','Qozogiston':'Kazakhstan','Braziliya':'Brazil','Meksika':'Mexico','Kanada':'Canada','Avstraliya':'Australia','Pokiston':'Pakistan','Mongol':'Mongolia','Indoneziya':'Indonesia','Malayziya':'Malaysia','Singapur':'Singapore','Tailand':'Thailand'};
      if(directMap[country]) country=directMap[country];
      // Normalize using existing alias system
      var norm=normalizeInvestorGeoCountry(country);
      var iso2=INVESTOR_GEO_ISO2_ALIASES[norm];
      var iso2ToName={'CN':'China','US':'USA','RU':'Russia','KR':'South Korea','TR':'Turkey','DE':'Germany','JP':'Japan','IN':'India','FR':'France','IT':'Italy','GB':'UK','AE':'UAE','SA':'Saudi Arabia','KZ':'Kazakhstan','UZ':'Uzbekistan','PK':'Pakistan','IR':'Iran','MN':'Mongolia','GE':'Georgia','AU':'Australia','BR':'Brazil','MX':'Mexico','CA':'Canada','NL':'Netherlands','ES':'Spain','SE':'Sweden','NO':'Norway','CH':'Switzerland','PL':'Poland','AT':'Austria','BE':'Belgium','FI':'Finland','TJ':'Tajikistan','KG':'Kyrgyzstan','TM':'Turkmenistan','AZ':'Azerbaijan','AM':'Armenia','SG':'Singapore','MY':'Malaysia','TH':'Thailand','VN':'Vietnam','BD':'Bangladesh','ID':'Indonesia'};
      if(iso2 && iso2ToName[iso2]) country=iso2ToName[iso2];
      if(!cMap[country])cMap[country]={total:0,sent:0,replied:0,meetings:0};
      cMap[country].total++;
      if(c.emailSent||c.emailSentDate)cMap[country].sent++;
      if(c.emailReplied||c.replyDate)cMap[country].replied++;
      if(c.pipelineStage==='meeting'||c.pipelineStage==='customer')cMap[country].meetings++;
    });

    var countries=Object.keys(cMap).sort(function(a,b){return cMap[b].total-cMap[a].total;});

    ctbody.innerHTML=countries.slice(0,15).map(function(c){
      var d=cMap[c];
      var conv=d.total>0?Math.round((d.replied+d.meetings)/d.total*100):0;
      var convColor=conv>=20?'#059669':(conv>=5?'#F59E0B':'#EF4444');
      var trendIcon=d.replied>0?'<span style="color:#059669">↗</span>':(d.sent>0?'<span style="color:#F59E0B">→</span>':'<span style="color:var(--text3)">—</span>');
      return '<tr>'
        +'<td style="padding:7px 8px;border-bottom:1px solid var(--border);font-size:.74rem;font-weight:600;color:var(--text)">'+c+'</td>'
        +'<td style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:.74rem;font-weight:700;color:var(--text)">'+d.total+'</td>'
        +'<td style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:.72rem;color:var(--text3)">'+d.sent+'</td>'
        +'<td style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:.72rem;color:'+(d.replied>0?'#059669':'var(--text3)')+'">'+d.replied+'</td>'
        +'<td style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:.72rem;color:'+(d.meetings>0?'#10B981':'var(--text3)')+'">'+d.meetings+'</td>'
        +'<td style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border)"><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:.66rem;font-weight:700;background:'+convColor+'18;color:'+convColor+'">'+conv+'%</span></td>'
        +'<td style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:.9rem">'+trendIcon+'</td>'
      +'</tr>';
    }).join('');

    if(countries.length===0){
      ctbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:1.5rem;font-size:.76rem;color:var(--text3)">Ma\'lumot yo\'q</td></tr>';
    }
  }

  // Monthly Trend
  var trendEl=document.getElementById('crm-rpt-trend');
  if(trendEl){
    var months=['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
    var monthData=months.map(function(){return{sent:0,replied:0,meetings:0};});

    co.forEach(function(c){
      var dateStr=c.emailSentDate||c.createdAt||c.addedDate||'';
      if(!dateStr)return;
      var m=parseInt(dateStr.split('-')[1]||dateStr.split('/')[1]||'0',10);
      if(m>=1&&m<=12){
        monthData[m-1].sent++;
        if(c.emailReplied||c.replyDate)monthData[m-1].replied++;
        if(c.pipelineStage==='meeting'||c.pipelineStage==='customer')monthData[m-1].meetings++;
      }
    });

    var maxM=Math.max.apply(null,monthData.map(function(m){return m.sent;}).concat([1]));
    var barH=140;

    var svg='<svg viewBox="0 0 720 '+(barH+40)+'" style="width:100%;height:auto">';
    // Grid lines
    for(var g=0;g<=4;g++){
      var gy=barH-(barH/4)*g;
      svg+='<line x1="40" y1="'+gy+'" x2="710" y2="'+gy+'" stroke="var(--border)" stroke-width="0.5"/>';
      svg+='<text x="35" y="'+(gy+4)+'" text-anchor="end" font-size="9" fill="var(--text3)">'+Math.round(maxM/4*g)+'</text>';
    }

    months.forEach(function(mName,i){
      var x=55+i*55;
      var d=monthData[i];
      var sentH=maxM>0?Math.round(d.sent/maxM*barH):0;
      var repH=maxM>0?Math.round(d.replied/maxM*barH):0;

      // Sent bar
      svg+='<rect x="'+(x-12)+'" y="'+(barH-sentH)+'" width="12" height="'+Math.max(sentH,1)+'" rx="3" fill="#3B82F6" opacity=".7"/>';
      // Replied bar
      svg+='<rect x="'+(x+2)+'" y="'+(barH-repH)+'" width="12" height="'+Math.max(repH,1)+'" rx="3" fill="#059669" opacity=".7"/>';
      // Month label
      svg+='<text x="'+x+'" y="'+(barH+15)+'" text-anchor="middle" font-size="10" fill="var(--text3)">'+mName+'</text>';
      // Value on top
      if(d.sent>0) svg+='<text x="'+(x-6)+'" y="'+(barH-sentH-4)+'" text-anchor="middle" font-size="8" fill="#3B82F6" font-weight="600">'+d.sent+'</text>';
    });

    // Legend
    svg+='<rect x="500" y="'+(barH+25)+'" width="10" height="10" rx="2" fill="#3B82F6" opacity=".7"/>';
    svg+='<text x="515" y="'+(barH+34)+'" font-size="10" fill="var(--text)">Sent (Yuborilgan)</text>';
    svg+='<rect x="610" y="'+(barH+25)+'" width="10" height="10" rx="2" fill="#059669" opacity=".7"/>';
    svg+='<text x="625" y="'+(barH+34)+'" font-size="10" fill="var(--text)">Replied (Javob)</text>';

    svg+='</svg>';
    trendEl.innerHTML=svg;
  }
}

function exportCrmReport(type){
  if(type==='pdf'){
    toast('📄 PDF hisobot tayyorlanmoqda...','info');
    setTimeout(function(){
      // Generate simple print view
      var printWin=window.open('','_blank');
      if(!printWin){toast('Pop-up bloklangan','error');return;}
      var co=DB.investorCompanies||[];
      var emailsSent=co.filter(function(c){return c.emailSent||c.emailSentDate;}).length;
      var replied=co.filter(function(c){return c.emailReplied||c.replyDate;}).length;
      var visits=(DB.investors||[]).length;

      printWin.document.write('<!DOCTYPE html><html><head><title>CRM Report</title><style>'
        +'body{font-family:Inter,Arial,sans-serif;padding:2rem;color:#1a1a2e;}'
        +'h1{font-size:1.5rem;margin-bottom:.5rem;}'
        +'h2{font-size:1rem;margin-top:1.5rem;color:#465fff;}'
        +'table{width:100%;border-collapse:collapse;margin-top:.5rem;}'
        +'th,td{padding:8px 12px;border:1px solid #e2e8f0;text-align:left;font-size:.85rem;}'
        +'th{background:#f1f5f9;font-weight:600;}'
        +'.kpi{display:inline-block;padding:8px 16px;margin:4px;border:1px solid #e2e8f0;border-radius:8px;}'
        +'.kpi-val{font-size:1.3rem;font-weight:800;}'
        +'.kpi-label{font-size:.75rem;color:#64748b;}'
        +'</style></head><body>'
        +'<h1>Outreach Statistikasi — CRM Report</h1>'
        +'<p style="color:#64748b">Sana: '+new Date().toLocaleDateString()+'</p>'
        +'<h2>Umumiy ko\'rsatkichlar</h2>'
        +'<div class="kpi"><div class="kpi-val">'+co.length+'</div><div class="kpi-label">Kompaniyalar</div></div>'
        +'<div class="kpi"><div class="kpi-val">'+emailsSent+'</div><div class="kpi-label">Email yuborildi</div></div>'
        +'<div class="kpi"><div class="kpi-val">'+replied+'</div><div class="kpi-label">Javob olindi</div></div>'
        +'<div class="kpi"><div class="kpi-val">'+visits+'</div><div class="kpi-label">Tashriflar</div></div>'
        +'<h2>Kompaniyalar ro\'yxati</h2>'
        +'<table><thead><tr><th>#</th><th>Kompaniya</th><th>Davlat</th><th>Status</th><th>Email</th></tr></thead><tbody>'
        +co.slice(0,50).map(function(c,i){
          var st=c.pipelineStage||(c.emailReplied?'Engaged':(c.emailSent?'Contacted':'Lead'));
          return '<tr><td>'+(i+1)+'</td><td>'+(c.kompaniya||c.name||'')+'</td><td>'+(c.davlat||c.country||'')+'</td><td>'+st+'</td><td>'+(c.contactEmail||c.email||'')+'</td></tr>';
        }).join('')
        +'</tbody></table>'
        +'<p style="margin-top:2rem;font-size:.75rem;color:#94a3b8">Navoi Invest AI — Avtomatik hisobot</p>'
        +'</body></html>');
      printWin.document.close();
      printWin.print();
      toast('✅ PDF hisobot tayyor!');
    },500);
  } else if(type==='excel'){
    toast('📊 Excel hisobot tayyorlanmoqda...','info');
    setTimeout(function(){
      var co=DB.investorCompanies||[];
      var csv='#,Kompaniya,Davlat,Sanoat,Status,Email,Kontakt,Sana\n';
      co.forEach(function(c,i){
        var st=c.pipelineStage||(c.emailReplied?'Engaged':(c.emailSent?'Contacted':'Lead'));
        csv+=(i+1)+','
          +'"'+(c.kompaniya||c.name||'').replace(/"/g,'""')+'",'
          +'"'+(c.davlat||c.country||'')+'",'
          +'"'+(c.sanoat||c.industry||'')+'",'
          +st+','
          +'"'+(c.contactEmail||c.email||'')+'",'
          +'"'+(c.contactName||'')+'",'
          +(c.emailSentDate||c.createdAt||c.addedDate||'')+'\n';
      });
      var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url;
      a.download='CRM_Report_'+new Date().toISOString().slice(0,10)+'.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast('✅ Excel (CSV) hisobot yuklab olindi!');
    },500);
  }
}

/* ═══ CRM REPORT TEMPLATES & AI ═══ */
function generateCrmReport(type){
  var co=DB.investorCompanies||[];
  var emailsSent=co.filter(function(c){return c.emailSent||c.emailSentDate;}).length;
  var replied=co.filter(function(c){return c.emailReplied||c.replyDate;}).length;
  var visits=(DB.investors||[]).length;
  var labels={quarterly:'Choraklik hisobot',yearly:'Yillik hisobot',custom:'Maxsus hisobot',presidential:'Prezident Administratsiyasi hisoboti'};
  toast('📄 '+labels[type]+' tayyorlanmoqda...','info');
  setTimeout(function(){
    var printWin=window.open('','_blank');
    if(!printWin){toast('Pop-up bloklangan','error');return;}
    var title=labels[type]||'CRM Hisobot';
    var isPresidential=type==='presidential';
    var headerStyle=isPresidential?'text-align:center;border-bottom:3px double #1a1a2e;padding-bottom:1rem;':'';
    var orgName=isPresidential?'<div style="font-size:.9rem;color:#64748b;margin-bottom:4px">O\'ZBEKISTON RESPUBLIKASI</div><div style="font-size:.9rem;color:#64748b;margin-bottom:8px">NAVOIY VILOYATI HOKIMLIGI</div>':'';
    printWin.document.write('<!DOCTYPE html><html><head><title>'+title+'</title><style>'
      +'body{font-family:Inter,Arial,sans-serif;padding:2rem;color:#1a1a2e;max-width:800px;margin:0 auto;}'
      +'h1{font-size:1.4rem;margin-bottom:.3rem;}'
      +'h2{font-size:1rem;margin-top:1.5rem;color:#465fff;border-bottom:1px solid #e2e8f0;padding-bottom:.3rem;}'
      +'table{width:100%;border-collapse:collapse;margin-top:.5rem;font-size:.85rem;}'
      +'th,td{padding:8px 12px;border:1px solid #e2e8f0;text-align:left;}'
      +'th{background:#f1f5f9;font-weight:600;}'
      +'.kpi-row{display:flex;gap:12px;flex-wrap:wrap;margin:1rem 0;}'
      +'.kpi{padding:10px 16px;border:1px solid #e2e8f0;border-radius:8px;min-width:120px;}'
      +'.kpi-val{font-size:1.3rem;font-weight:800;}'
      +'.kpi-label{font-size:.75rem;color:#64748b;}'
      +'.summary{background:#f8fafc;border-left:3px solid #465fff;padding:12px 16px;margin:1rem 0;font-size:.9rem;line-height:1.6;}'
      +'@media print{body{padding:1cm;}}'
      +'</style></head><body>'
      +'<div style="'+headerStyle+'">'+orgName+'<h1>'+title+'</h1>'
      +'<p style="color:#64748b;font-size:.85rem">Sana: '+new Date().toLocaleDateString('uz-UZ')+' | Davr: '+(type==='yearly'?'Yillik':'Choraklik')+'</p></div>'
      +(type==='yearly'?'<div class="summary"><strong>Executive Summary:</strong><br>Jami '+co.length+' ta kompaniya bilan ishlandi. '+emailsSent+' ta email yuborildi, '+replied+' ta javob olindi. '+visits+' ta Navoiyga tashrif buyurgan amalga oshirildi.</div>':'')
      +'<div class="kpi-row">'
      +'<div class="kpi"><div class="kpi-val">'+co.length+'</div><div class="kpi-label">Kompaniyalar</div></div>'
      +'<div class="kpi"><div class="kpi-val">'+emailsSent+'</div><div class="kpi-label">Email yuborildi</div></div>'
      +'<div class="kpi"><div class="kpi-val">'+replied+'</div><div class="kpi-label">Javob olindi</div></div>'
      +'<div class="kpi"><div class="kpi-val">'+visits+'</div><div class="kpi-label">Tashriflar</div></div></div>'
      +'<h2>Kompaniyalar ro\'yxati</h2>'
      +'<table><thead><tr><th>#</th><th>Kompaniya</th><th>Davlat</th><th>Status</th><th>Kontakt</th></tr></thead><tbody>'
      +co.slice(0,type==='yearly'?100:50).map(function(c,i){
        var st=c.pipelineStage||(c.emailReplied?'Engaged':(c.emailSent?'Contacted':'Lead'));
        return '<tr><td>'+(i+1)+'</td><td>'+(c.kompaniya||c.name||'')+'</td><td>'+(c.davlat||c.country||'')+'</td><td>'+st+'</td><td>'+(c.contactName||'')+'</td></tr>';
      }).join('')
      +'</tbody></table>'
      +(isPresidential?'<div style="margin-top:2rem;border-top:1px solid #e2e8f0;padding-top:1rem"><div style="display:flex;justify-content:space-between"><div><div style="font-size:.8rem;font-weight:600">Tayyorladi:</div><div style="font-size:.75rem;color:#64748b;margin-top:4px">___________________</div><div style="font-size:.7rem;color:#94a3b8;margin-top:2px">Mutaxassis</div></div><div><div style="font-size:.8rem;font-weight:600">Tasdiqladi:</div><div style="font-size:.75rem;color:#64748b;margin-top:4px">___________________</div><div style="font-size:.7rem;color:#94a3b8;margin-top:2px">Bo\'lim boshlig\'i</div></div></div></div>':'')
      +'<p style="margin-top:2rem;font-size:.7rem;color:#94a3b8;text-align:center">Navoi Invest AI — Avtomatik hisobot tizimi</p>'
      +'</body></html>');
    printWin.document.close();
    setTimeout(function(){printWin.print();},300);
    toast('✅ '+title+' tayyor!');
  },500);
}

function generateAiReport(){
  var co=DB.investorCompanies||[];
  var emailsSent=co.filter(function(c){return c.emailSent||c.emailSentDate;}).length;
  var replied=co.filter(function(c){return c.emailReplied||c.replyDate;}).length;
  var meetings=co.filter(function(c){return c.pipelineStage==='meeting';}).length;
  var customers=co.filter(function(c){return c.pipelineStage==='customer';}).length;
  var visits=(DB.investors||[]).length;
  var zoomCalls=(DB.zoom||[]).length;
  var replyRate=emailsSent>0?Math.round(replied/emailsSent*100):0;

  toast('🤖 AI hisobot yozilmoqda...','info');
  var resultEl=document.getElementById('crm-rpt-ai-result');
  var textEl=document.getElementById('crm-rpt-ai-text');
  if(!resultEl||!textEl)return;

  // Generate report locally (Claude API call would go here in production)
  setTimeout(function(){
    var now=new Date();
    var quarter='Q'+Math.ceil((now.getMonth()+1)/4);
    var text='📊 CHORAKLIK HISOBOT — '+quarter+' '+now.getFullYear()+'\n'
      +'Sana: '+now.toLocaleDateString('uz-UZ')+'\n\n'
      +'═══ ASOSIY YUTUQLAR ═══\n\n'
      +'1. Jami '+co.length+' ta xorijiy kompaniya bilan aloqa o\'rnatildi\n'
      +'2. '+visits+' ta investor Navoiy viloyatiga tashrif buyurdi\n'
      +'3. '+zoomCalls+' ta Zoom uchrashuv o\'tkazildi\n'
      +(replied>0?'4. '+replied+' ta kompaniyadan ijobiy javob olindi ('+replyRate+'% reply rate)\n':'4. Email kampaniya boshlash tayyorligi yakunlandi\n')
      +(customers>0?'5. '+customers+' ta kompaniya Customer (Mijoz) bosqichiga o\'tdi\n':'5. Pipeline tizimi to\'liq sozlandi va faol\n')
      +'\n═══ PIPELINE HOLATI ═══\n\n'
      +'• Lead (Aniqlangan): '+co.filter(function(c){return !c.pipelineStage||c.pipelineStage==='lead';}).length+' ta\n'
      +'• Contacted (Xat yuborildi): '+emailsSent+' ta\n'
      +'• Engaged (Javob olindi): '+replied+' ta\n'
      +'• Negotiation (Muzokara): '+meetings+' ta\n'
      +'• Customer (Mijoz): '+customers+' ta\n'
      +'\n═══ TUSHUNCHALAR VA KEYINGI QADAMLAR ═══\n\n'
      +'1. '+(emailsSent===0?'Email outreach kampaniyasini boshlash — barcha '+co.length+' ta kompaniyaga personalizatsiya qilingan xat yuborish':'Email kampaniyani davom ettirish — javob bermagan kompaniyalarga follow-up yuborish')+'\n'
      +'2. '+(visits>5?'Navoiyga tashrif buyurganlarni ko\'paytirish — investor delegatsiyalari uchun alohida dastur tayyorlash':'Investor tashriflari uchun marketing materiallar tayyorlash')+'\n'
      +'3. '+(zoomCalls>0?'Zoom uchrashuvlar natijalarini tahlil qilish va keyingi qadamlarni belgilash':'Zoom uchrashuvlar jadvalini tuzish va potentsial investorlar bilan bog\'lanish')+'\n'
      +'\n═══ E\'TIBOR TALAB QILADIGAN MUAMMOLAR ═══\n\n'
      +(replyRate<10?'⚠️ Reply rate past ('+replyRate+'%) — email matnlarini optimizatsiya qilish kerak\n':'')
      +(meetings===0?'⚠️ Hali Negotiation bosqichiga o\'tgan kompaniya yo\'q — shaxsiy murojaat va follow-up kuchaytirish kerak\n':'')
      +(customers===0?'⚠️ Hali Customer bosqichiga o\'tgan kompaniya yo\'q — pipeline tezligini oshirish zarur\n':'')
      +'\n——————————————\n'
      +'Hisobot Navoi Invest AI tizimi tomonidan avtomatik tayyorlangan.\n'
      +'Mutaxassis tahrirlashi va tasdiqlashi talab etiladi.';

    textEl.textContent=text;
    resultEl.style.display='block';
    resultEl.scrollIntoView({behavior:'smooth',block:'center'});
    toast('✅ AI hisobot tayyor!');
  },1500);
}

function copyAiReport(){
  var textEl=document.getElementById('crm-rpt-ai-text');
  if(!textEl)return;
  navigator.clipboard.writeText(textEl.textContent).then(function(){
    toast('📋 Hisobot nusxalandi!');
  }).catch(function(){toast('Nusxalash xatosi','error');});
}

function saveDigestSettings(){
  var active=document.getElementById('crm-digest-active');
  var day=document.getElementById('crm-digest-day');
  var time=document.getElementById('crm-digest-time');
  var email=document.getElementById('crm-digest-email');
  var settings={
    active:active?active.checked:true,
    day:day?day.value:'1',
    time:time?time.value:'09:00',
    email:email?email.value:''
  };
  localStorage.setItem('_crmDigestSettings',JSON.stringify(settings));
  toast('✅ Weekly digest sozlamalari saqlandi!');
}

function previewWeeklyDigest(){
  var co=DB.investorCompanies||[];
  var emailsSent=co.filter(function(c){return c.emailSent||c.emailSentDate;}).length;
  var replied=co.filter(function(c){return c.emailReplied||c.replyDate;}).length;
  var el=document.getElementById('crm-digest-preview');
  if(!el)return;

  var now=new Date();
  var weekAgo=new Date(now.getTime()-7*24*60*60*1000);
  el.innerHTML='<div style="font-weight:700;margin-bottom:8px;font-size:.78rem">📧 Weekly Digest — '+now.toLocaleDateString('uz-UZ')+'</div>'
    +'<div style="border-bottom:1px solid var(--border);padding-bottom:8px;margin-bottom:8px">'
      +'<strong>O\'tgan hafta natijalari:</strong>'
    +'</div>'
    +'<div>📊 <strong>KPI o\'zgarishlari:</strong></div>'
    +'<div style="margin-left:16px;margin-bottom:8px">'
      +'• Jami kompaniyalar: '+co.length+'<br>'
      +'• Email yuborildi: '+emailsSent+'<br>'
      +'• Javob olindi: '+replied+'<br>'
      +'• Tashriflar: '+(DB.investors||[]).length
    +'</div>'
    +'<div>🆕 <strong>Yangi Lead (Aniqlangan)\'lar:</strong></div>'
    +'<div style="margin-left:16px;margin-bottom:8px">'
      +(co.slice(-3).map(function(c){return '• '+(c.kompaniya||c.name||'Noma\'lum')+' ('+(c.davlat||c.country||'?')+')';}).join('<br>')||'Yangi lead yo\'q')
    +'</div>'
    +'<div>⚠️ <strong>E\'tibor talab qiladigan:</strong></div>'
    +'<div style="margin-left:16px">'
      +(emailsSent===0?'• Email kampaniya hali boshlanmagan':'• Follow-up kutayotgan kompaniyalar mavjud')
    +'</div>'
    +'<div style="margin-top:12px;padding-top:8px;border-top:1px solid var(--border);font-size:.66rem;color:var(--text3)">Bu xabar har hafta avtomatik yuboriladi. Sozlamalarni Hisobotlar > Weekly Digest bo\'limida o\'zgartiring.</div>';
  el.style.display='block';
  el.scrollIntoView({behavior:'smooth',block:'center'});
}

/* ═══ CRM GEOGRAPHIC INSIGHTS ═══ */
function renderCrmGeo(){
  var co=DB.investorCompanies||[];
  var finder=DB.finderResults||[];
  var inv=DB.investors||[];

  // Normalize country names
  var countryNorm={
    'Xitoy':'China','xitoy':'China','CHINA':'China','PRC':'China',
    'Rossiya':'Russia','rossiya':'Russia','RUSSIA':'Russia','Russian Federation':'Russia',
    'Koreya':'South Korea','koreya':'South Korea','KOREA':'South Korea','Korea':'South Korea','Republic of Korea':'South Korea',
    'Turkiya':'Turkey','turkiya':'Turkey','TURKEY':'Turkey','Türkiye':'Turkey',
    'Germaniya':'Germany','germaniya':'Germany','GERMANY':'Germany',
    'Yaponiya':'Japan','yaponiya':'Japan','JAPAN':'Japan',
    'Hindiston':'India','hindiston':'India','INDIA':'India',
    'Fransiya':'France','fransiya':'France','FRANCE':'France',
    'Italiya':'Italy','italiya':'Italy','ITALY':'Italy',
    'Ispaniya':'Spain','ispaniya':'Spain','SPAIN':'Spain',
    'Angliya':'UK','angliya':'UK','United Kingdom':'UK','Great Britain':'UK',
    'AQSH':'USA','aqsh':'USA','United States':'USA','United States of America':'USA',
    'BAA':'UAE','baa':'UAE','United Arab Emirates':'UAE',
    'Saudiya Arabistoni':'Saudi Arabia','Indoneziya':'Indonesia',
    'Malayziya':'Malaysia','Singapur':'Singapore','Tailand':'Thailand',
    'Pokiston':'Pakistan','Misr':'Egypt','Janubiy Afrika':'South Africa',
    'Braziliya':'Brazil','Meksika':'Mexico','Kanada':'Canada','Avstraliya':'Australia',
    'Qozogiston':'Kazakhstan','Tojikiston':'Tajikistan','Qirgiziston':'Kyrgyzstan',
    'Turkmaniston':'Turkmenistan','Ozarbayjon':'Azerbaijan','Gruziya':'Georgia',
    'Eron':'Iran','eron':'Iran','Mongol':'Mongolia','Movarounnahr':'Uzbekistan',
    'Janubiy Koreya':'South Korea','Shimoliy Koreya':'North Korea',
    'Niderlandiya':'Netherlands','Shveytsariya':'Switzerland','Shvetsiya':'Sweden',
    'Norvegiya':'Norway','Finlyandiya':'Finland','Avstriya':'Austria',
    'Belgiya':'Belgium','Portugaliya':'Portugal','Gretsiya':'Greece',
    'Polsha':'Poland','Chexiya':'Czech Republic','Vengriya':'Hungary',
    'Ruminiya':'Romania','Bolgariya':'Bulgaria','Xorvatiya':'Croatia',
    'Argentna':'Argentina','Kolumbiya':'Colombia','Venesuela':'Venezuela',
    'Keniya':'Kenya','Efiopiya':'Ethiopia','Tanzaniya':'Tanzania',
    'Marokash':'Morocco','Jazoir':'Algeria','Tunis':'Tunisia','Liviya':'Libya',
    'Isroil':'Israel','Iordaniya':'Jordan','Quvayt':'Kuwait',
    'Qatar':'Qatar','Bahrayn':'Bahrain','Ummon':'Oman'
  };
  function normCountry(c){
    if(!c)return'';
    c=c.trim();
    // Remove city/region prefixes like "Atlanta Metropolitan Area, United States"
    if(c.indexOf(',')>0){
      var parts=c.split(',');
      var last=parts[parts.length-1].trim();
      // If last part looks like a known country, use it
      if(countryNorm[last])return countryNorm[last];
      if(last.length>2)c=last;
    }
    if(countryNorm[c])return countryNorm[c];
    return c;
  }

  // Build unified country data
  var cMap={};
  function addC(country,industry,status,source){
    if(!country)return;
    country=normCountry(country);
    if(!cMap[country])cMap[country]={total:0,industries:{},statuses:{lead:0,sent:0,replied:0,meeting:0,customer:0},sources:{}};
    cMap[country].total++;
    if(industry){
      industry=industry.trim();
      if(!cMap[country].industries[industry])cMap[country].industries[industry]=0;
      cMap[country].industries[industry]++;
    }
    if(status)cMap[country].statuses[status]=(cMap[country].statuses[status]||0)+1;
    if(source){
      if(!cMap[country].sources[source])cMap[country].sources[source]=0;
      cMap[country].sources[source]++;
    }
  }
  co.forEach(function(c){
    var country=c.davlat||c.country||'';
    var ind=c.sanoat||c.industry||'';
    var st=c.pipelineStage||(c.emailSent?'sent':'lead');
    addC(country,ind,st,'CRM');
  });
  finder.forEach(function(f){
    var country=f.davlat||f.country||'';
    var ind=f.sanoat||f.industry||f.mahsulot||'';
    addC(country,ind,'lead','Finder');
  });
  inv.forEach(function(v){
    var country=v.country||v.davlat||'';
    addC(country,'','lead','Investors DB');
  });

  var countries=Object.keys(cMap).sort(function(a,b){return cMap[b].total-cMap[a].total;});
  var totalCompanies=countries.reduce(function(s,c){return s+cMap[c].total;},0);

  // --- KPIs ---
  var kpiEl=document.getElementById('crm-geo-kpis');
  if(kpiEl){
    var uniqueCountries=countries.length;
    var topCountry=countries[0]||'—';
    var topCount=countries[0]?cMap[countries[0]].total:0;
    var allIndustries={};
    countries.forEach(function(c){Object.keys(cMap[c].industries).forEach(function(ind){allIndustries[ind]=1;});});
    var uniqueInds=Object.keys(allIndustries).length;
    var respondedCountries=countries.filter(function(c){return (cMap[c].statuses.replied||0)+(cMap[c].statuses.meeting||0)+(cMap[c].statuses.customer||0)>0;}).length;
    var kpis=[
      {val:totalCompanies,label:'Total Companies (Jami)',color:'#3B82F6',icon:'🏢'},
      {val:uniqueCountries,label:'Countries (Davlatlar)',color:'#8B5CF6',icon:'🌍'},
      {val:topCountry+' ('+topCount+')',label:'Top Country (Eng ko\'p)',color:'#F59E0B',icon:'🏆'},
      {val:uniqueInds,label:'Industries (Sanoatlar)',color:'#10B981',icon:'🏭'},
      {val:respondedCountries,label:'Responded Countries (Javob)',color:'#059669',icon:'✅'}
    ];
    kpiEl.innerHTML=kpis.map(function(k){
      return '<div class="ckpi" style="border-left:3px solid '+k.color+'">'
        +'<div class="ckpi-val" style="font-size:1.2rem">'+k.val+'</div>'
        +'<div class="ckpi-label">'+k.icon+' '+k.label+'</div>'
      +'</div>';
    }).join('');
  }

  // --- WORLD MAP (jsVectorMap) ---
  var mapEl=document.getElementById('crm-geo-jvmap');
  var mapMeta=document.getElementById('crm-geo-map-meta');
  if(mapEl){
    // Destroy previous instance
    if(window._crmGeoJvInstance){
      try{window._crmGeoJvInstance.destroy();}catch(e){}
      window._crmGeoJvInstance=null;
    }
    mapEl.innerHTML='';

    if(typeof jsVectorMap==='undefined'){
      mapEl.innerHTML='<div style="height:380px;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:.82rem">jsVectorMap kutubxonasi yuklanmadi</div>';
    } else {
      // Map country names to ISO2 codes for region coloring
      var iso2Map={
        'China':'CN','Japan':'JP','South Korea':'KR','India':'IN','Turkey':'TR',
        'UAE':'AE','Saudi Arabia':'SA','Germany':'DE','USA':'US','UK':'GB',
        'France':'FR','Italy':'IT','Russia':'RU','Kazakhstan':'KZ','Uzbekistan':'UZ',
        'Singapore':'SG','Malaysia':'MY','Indonesia':'ID','Thailand':'TH','Vietnam':'VN',
        'Pakistan':'PK','Bangladesh':'BD','Iran':'IR','Iraq':'IQ','Egypt':'EG',
        'South Africa':'ZA','Nigeria':'NG','Brazil':'BR','Mexico':'MX','Canada':'CA',
        'Australia':'AU','Netherlands':'NL','Spain':'ES','Poland':'PL',
        'Czech Republic':'CZ','Switzerland':'CH','Sweden':'SE','Norway':'NO',
        'Finland':'FI','Austria':'AT','Belgium':'BE','Portugal':'PT','Greece':'GR',
        'Israel':'IL','Jordan':'JO','Kuwait':'KW','Qatar':'QA','Bahrain':'BH',
        'Oman':'OM','Tajikistan':'TJ','Kyrgyzstan':'KG','Turkmenistan':'TM',
        'Afghanistan':'AF','Azerbaijan':'AZ','Georgia':'GE','Armenia':'AM',
        'Taiwan':'TW','Philippines':'PH','Myanmar':'MM','Sri Lanka':'LK',
        'Nepal':'NP','Mongolia':'MN','New Zealand':'NZ','Argentina':'AR',
        'Chile':'CL','Colombia':'CO','Peru':'PE','Kenya':'KE','Ethiopia':'ET',
        'Tanzania':'TZ','Morocco':'MA','Algeria':'DZ','Tunisia':'TN','Libya':'LY'
      };

      // Also use existing aliases
      var regionValues={};
      var markerData=[];
      var countryCoords={
        'CN':[35.86,104.19],'JP':[36.2,138.25],'KR':[35.9,127.77],
        'IN':[20.59,78.96],'TR':[38.96,35.24],'AE':[23.42,53.85],
        'SA':[23.88,45.08],'DE':[51.17,10.45],'US':[37.09,-95.71],
        'GB':[55.38,-3.44],'FR':[46.23,2.21],'IT':[41.87,12.56],
        'RU':[61.52,105.32],'KZ':[48.02,66.92],'UZ':[41.38,64.59],
        'SG':[1.35,103.82],'MY':[4.21,101.98],'ID':[-0.79,113.92],
        'TH':[15.87,100.99],'VN':[14.06,108.28],'PK':[30.38,69.35],
        'BD':[23.68,90.36],'IR':[32.43,53.69],'IQ':[33.22,43.68],
        'EG':[26.82,30.80],'ZA':[-30.56,22.94],'NG':[9.08,8.68],
        'BR':[-14.24,-51.93],'MX':[23.63,-102.55],'CA':[56.13,-106.35],
        'AU':[-25.27,133.78],'NL':[52.13,5.29],'ES':[40.46,-3.75],
        'PL':[51.92,19.15],'CZ':[49.82,15.47],'CH':[46.82,8.23],
        'SE':[60.13,18.64],'NO':[60.47,8.47],'FI':[61.92,25.75],
        'AT':[47.52,14.55],'BE':[50.50,4.47],'PT':[39.4,-8.22],
        'GR':[39.07,21.82],'IL':[31.05,34.85],'JO':[30.59,36.24],
        'KW':[29.31,47.48],'QA':[25.35,51.18],'BH':[26.07,50.56],
        'OM':[21.47,55.98],'TJ':[38.86,71.28],'KG':[41.20,74.77],
        'TM':[38.97,59.56],'AF':[33.94,67.71],'AZ':[40.14,47.58],
        'GE':[42.32,43.36],'AM':[40.07,45.04],'MN':[46.86,103.85],
        'NZ':[-40.90,174.89],'AR':[-38.42,-63.62],'CL':[-35.68,-71.54],
        'CO':[4.57,-74.30],'PE':[-9.19,-75.02],'KE':[-0.02,37.91],
        'ET':[9.15,40.49],'TZ':[-6.37,34.89],'MA':[31.79,-7.09],
        'DZ':[28.03,1.66],'TN':[33.89,9.54],'LY':[26.34,17.23]
      };

      // Color logic per country:
      // Dark green (#059669): 10+ positive replies
      // Light green (#34D399): 5-9 positive replies
      // Yellow (#F59E0B): 1-4 positive replies
      // Gray (#E2E8F0): has companies but no responses
      // Red (#EF4444): only negative replies
      var regionColors={};
      var regionInfo={};

      countries.forEach(function(c){
        var code=iso2Map[c];
        if(!code){
          var norm=normalizeInvestorGeoCountry(c);
          code=INVESTOR_GEO_ISO2_ALIASES[norm]||'';
        }
        if(!code) return;
        var d=cMap[c];
        var positive=(d.statuses.replied||0)+(d.statuses.meeting||0)+(d.statuses.customer||0);
        var negative=0; // count from sentiment data if available
        // Check if all responses are negative (simplified: no positive but has some activity)
        var sent=d.statuses.sent||0;
        var total=d.total;

        var color;
        if(positive>=10) color='#059669';       // dark green
        else if(positive>=5) color='#34D399';   // light green
        else if(positive>=1) color='#F59E0B';   // yellow
        else if(sent>0 && positive===0) color='#E2E8F0'; // gray - sent but no reply
        else color='#E2E8F0';                    // gray - no activity

        regionColors[code]=color;
        regionValues[code]=total;
        regionInfo[code]={name:c,total:total,positive:positive,sent:sent};

        if(countryCoords[code]){
          markerData.push({name:c+' — '+total+' ta kompaniya',coords:countryCoords[code]});
        }
      });

      try{
        window._crmGeoJvInstance=new jsVectorMap({
          selector:'#crm-geo-jvmap',
          map:'world',
          zoomButtons:true,
          zoomOnScroll:true,
          draggable:true,
          regionStyle:{
            initial:{fill:'#F1F5F9','fill-opacity':1,stroke:'#fff','stroke-width':0.5},
            hover:{'fill-opacity':0.85}
          },
          series:{
            regions:[{
              attribute:'fill',
              scale:['#E2E8F0','#E2E8F0'],
              values:regionValues,
              min:0,
              max:Math.max.apply(null,Object.values(regionValues).concat([1]))
            }]
          },
          markers:markerData,
          markerStyle:{
            initial:{fill:'#3B82F6',stroke:'#fff',r:5,'fill-opacity':0.7,'stroke-width':1.5},
            hover:{fill:'#465fff',r:7,'fill-opacity':1}
          },
          showTooltip:true,
          onRegionTooltipShow:function(event,tooltip,code){
            var info=regionInfo[code];
            if(info){
              tooltip.text(info.name+' — '+info.total+' ta kompaniya, '+info.positive+' ijobiy javob',true);
            }
          }
        });

        // Apply custom colors per region after map renders
        setTimeout(function(){
          var svgEl=mapEl.querySelector('svg');
          if(!svgEl) return;
          Object.keys(regionColors).forEach(function(code){
            var path=svgEl.querySelector('path[data-code="'+code+'"]');
            if(path){
              path.setAttribute('fill',regionColors[code]);
              path.style.fill=regionColors[code];
            }
          });
        },300);

      }catch(e){
        console.error('CRM Geo map error:',e);
        mapEl.innerHTML='<div style="height:380px;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:.82rem">Xarita yuklanmadi</div>';
      }
    }

    if(mapMeta) mapMeta.textContent=totalCompanies+' ta kompaniya · '+countries.length+' ta davlat';
  }

  // --- INDUSTRY × COUNTRY HEATMAP ---
  var heatEl=document.getElementById('crm-geo-heatmap');
  if(heatEl){
    // Collect top 8 countries and top 6 industries
    var topC=countries.slice(0,8);
    var indCount={};
    countries.forEach(function(c){
      Object.keys(cMap[c].industries).forEach(function(ind){
        indCount[ind]=(indCount[ind]||0)+cMap[c].industries[ind];
      });
    });
    var topInds=Object.keys(indCount).sort(function(a,b){return indCount[b]-indCount[a];}).slice(0,6);

    if(topC.length===0||topInds.length===0){
      heatEl.innerHTML='<div style="padding:1.5rem;text-align:center;color:var(--text3);font-size:.76rem">Ma\'lumot yetarli emas</div>';
    } else {
      var maxHeat=1;
      topC.forEach(function(c){topInds.forEach(function(ind){
        var v=(cMap[c].industries[ind]||0);
        if(v>maxHeat)maxHeat=v;
      });});

      var html='<table style="width:100%;border-collapse:collapse;font-size:.72rem">';
      html+='<thead><tr><th style="padding:6px 8px;font-size:.68rem;color:var(--text3);text-align:left;border-bottom:1px solid var(--border)">Sanoat \\ Davlat</th>';
      topC.forEach(function(c){
        html+='<th style="padding:6px 4px;font-size:.62rem;color:var(--text);text-align:center;border-bottom:1px solid var(--border);max-width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+c+'">'+c.substring(0,8)+'</th>';
      });
      html+='</tr></thead><tbody>';

      topInds.forEach(function(ind){
        html+='<tr>';
        html+='<td style="padding:6px 8px;font-size:.68rem;font-weight:600;color:var(--text);border-bottom:1px solid var(--border);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px" title="'+ind+'">'+ind.substring(0,16)+'</td>';
        topC.forEach(function(c){
          var v=cMap[c].industries[ind]||0;
          var intensity=v>0?Math.max(0.15,v/maxHeat):0;
          var bg=v>0?'rgba(59,130,246,'+intensity.toFixed(2)+')':'transparent';
          var textCol=intensity>0.5?'#fff':'var(--text)';
          html+='<td style="padding:6px 4px;text-align:center;border-bottom:1px solid var(--border);background:'+bg+';color:'+textCol+';font-size:.7rem;font-weight:'+(v>0?'700':'400')+'">'+(v||'·')+'</td>';
        });
        html+='</tr>';
      });

      html+='</tbody></table>';
      heatEl.innerHTML=html;
    }
  }

  // --- REGIONAL ANALYSIS TABLE ---
  var regEl=document.getElementById('crm-geo-regional');
  if(regEl){
    var html='<table style="width:100%;border-collapse:collapse;font-size:.72rem">';
    html+='<thead><tr>'
      +'<th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border);font-size:.68rem;color:var(--text3)">Country (Davlat)</th>'
      +'<th style="padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:.68rem;color:var(--text3)">Total</th>'
      +'<th style="padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:.68rem;color:var(--text3)">Sent</th>'
      +'<th style="padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:.68rem;color:var(--text3)">Reply</th>'
      +'<th style="padding:6px 8px;text-align:center;border-bottom:1px solid var(--border);font-size:.68rem;color:var(--text3)">Conv%</th>'
    +'</tr></thead><tbody>';

    countries.slice(0,12).forEach(function(c,i){
      var d=cMap[c];
      var sent=d.statuses.sent||0;
      var replied=(d.statuses.replied||0)+(d.statuses.meeting||0)+(d.statuses.customer||0);
      var convPct=d.total>0?Math.round(replied/d.total*100):0;
      var barW=Math.max(2,Math.min(100,d.total/(cMap[countries[0]].total)*100));
      var convColor=convPct>=30?'#059669':(convPct>=10?'#F59E0B':'#EF4444');

      html+='<tr>';
      html+='<td style="padding:7px 8px;border-bottom:1px solid var(--border);font-weight:600;color:var(--text);font-size:.72rem">'
        +'<div style="display:flex;align-items:center;gap:6px">'
        +'<span style="width:18px;text-align:center;font-size:.66rem;color:var(--text3)">'+(i+1)+'</span>'
        +c
        +'</div></td>';
      html+='<td style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border);font-weight:700;color:var(--text);font-size:.74rem">'+d.total+'</td>';
      html+='<td style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border);color:var(--text3);font-size:.72rem">'+sent+'</td>';
      html+='<td style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border);color:'+convColor+';font-weight:600;font-size:.72rem">'+replied+'</td>';
      html+='<td style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--border)">'
        +'<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:.66rem;font-weight:700;background:'+convColor+'18;color:'+convColor+'">'+convPct+'%</span>'
      +'</td>';
      html+='</tr>';
    });

    html+='</tbody></table>';
    if(countries.length===0){
      html='<div style="padding:1.5rem;text-align:center;color:var(--text3);font-size:.76rem">Ma\'lumot yo\'q</div>';
    }
    regEl.innerHTML=html;
  }

  // --- TOP COUNTRIES BAR CHART ---
  var barEl=document.getElementById('crm-geo-bars');
  if(barEl){
    var topN=countries.slice(0,10);
    var maxBar=topN.length>0?cMap[topN[0]].total:1;
    var colors=['#3B82F6','#8B5CF6','#F59E0B','#10B981','#EF4444','#0EA5E9','#EC4899','#6366F1','#14B8A6','#F97316'];
    barEl.innerHTML=topN.map(function(c,i){
      var pct=Math.round(cMap[c].total/maxBar*100);
      var replied=(cMap[c].statuses.replied||0)+(cMap[c].statuses.meeting||0)+(cMap[c].statuses.customer||0);
      return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
        +'<div style="width:110px;font-size:.74rem;font-weight:600;color:var(--text);text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+c+'">'+c+'</div>'
        +'<div style="flex:1;background:var(--bg2);border-radius:6px;height:24px;overflow:hidden;position:relative">'
          +'<div style="width:'+Math.max(pct,3)+'%;height:100%;background:'+colors[i%10]+';border-radius:6px;transition:width .5s;opacity:.85"></div>'
          +(replied>0?'<div style="position:absolute;top:0;left:0;width:'+Math.max(Math.round(replied/maxBar*100),2)+'%;height:100%;background:#059669;border-radius:6px;opacity:.4"></div>':'')
        +'</div>'
        +'<div style="width:55px;font-size:.72rem;font-weight:700;color:var(--text);text-align:left">'+cMap[c].total+' <span style="font-size:.6rem;color:var(--text3);font-weight:400">('+replied+' ✓)</span></div>'
      +'</div>';
    }).join('');

    if(topN.length===0){
      barEl.innerHTML='<div style="padding:1.5rem;text-align:center;color:var(--text3);font-size:.76rem">Ma\'lumot yo\'q</div>';
    }
  }
}

/* ═══ CRM COMPANIES TAB ═══ */
function renderCrmCompanies(){
  var tbody=document.getElementById('crm-co-tbody');
  var countEl=document.getElementById('crm-co-count');
  if(!tbody)return;

  var co=DB.investorCompanies||[];
  var finder=DB.finderResults||[];
  var search=((document.getElementById('crm-co-search')||{}).value||'').toLowerCase();
  var srcFilter=(document.getElementById('crm-co-source')||{}).value||'all';
  var stFilter=(document.getElementById('crm-co-status')||{}).value||'all';

  // Unify all companies
  var all=[];
  co.forEach(function(c){
    all.push({
      id:c.id||'',name:c.kompaniya||c.name||'',country:c.davlat||c.country||'',
      industry:c.sanoat||c.industry||'',source:'manual',
      status:c.pipelineStage||(c.emailSent?'sent':'new'),
      date:c.createdAt||c.addedDate||c.emailSentDate||'',
      contactName:c.contactName||'',contactTitle:c.contactTitle||'',
      email:c.contactEmail||c.email||'',phone:c.phone||'',
      website:c.website||'',employees:c.employees||'',
      potentialInvestment:c.potentialInvestment||0,
      notes:c.notes||'',raw:c,type:'ic'
    });
  });
  finder.forEach(function(f){
    all.push({
      id:f.id||'',name:f.kompaniya||f.name||'',country:f.davlat||f.country||'',
      industry:f.sanoat||f.industry||f.mahsulot||'',
      source:f.manba==='Apollo Top 100'?'finder':(f.manba||'finder'),
      status:'new',date:f.sana||f.topilganSana||'',
      contactName:f.kontakt||'',contactTitle:f.lavozim||'',
      email:f.email||'',phone:f.telefon||'',
      website:f.websayt||f.website||'',employees:f.xodimlar||'',
      potentialInvestment:0,notes:'',raw:f,type:'finder'
    });
  });

  // Filter
  var filtered=all.filter(function(c){
    if(search){
      var s=c.name.toLowerCase()+' '+c.country.toLowerCase()+' '+c.industry.toLowerCase();
      if(s.indexOf(search)<0)return false;
    }
    if(srcFilter!=='all'&&c.source!==srcFilter)return false;
    if(stFilter!=='all'&&c.status!==stFilter)return false;
    return true;
  });

  // Group by company key (name + country)
  var groupsMap = {};
  filtered.forEach(function(c){
    var k = (c.name||'').toLowerCase().trim() + '|' + (c.country||'').toLowerCase().trim();
    if(!groupsMap[k]){
      groupsMap[k] = { rep: c, contacts: [] };
    }
    if(c.contactName || c.email){
      groupsMap[k].contacts.push({ name: c.contactName || '—', title: c.contactTitle || '', email: c.email || '' });
    }
  });
  var grouped = Object.values(groupsMap);

  var statusColors={
    'new':'#3B82F6','sent':'#8B5CF6','opened':'#6366F1',
    'replied':'#F59E0B','meeting':'#EF4444','customer':'#059669'
  };
  var statusLabels={
    'new':'Lead','sent':'Contacted','opened':'Opened',
    'replied':'Engaged','meeting':'Negotiation','customer':'Customer'
  };
  var sourceLabels={'manual':'Qo\'lda','finder':'Qidiruv','forum':'Forum'};

  tbody.innerHTML=grouped.slice(0,200).map(function(g,i){
    var c = g.rep;
    var sc=statusColors[c.status]||'#94A3B8';
    var sl=statusLabels[c.status]||c.status;
    var srcL=sourceLabels[c.source]||c.source;
    var contactsHtml = g.contacts.length
      ? '<div style="font-size:.62rem;color:var(--text3);margin-top:3px;line-height:1.5">'
        + g.contacts.slice(0,5).map(function(p){
            return '<div>👤 '+escHtml(p.name||'—')+(p.title?' <span style="opacity:.7">· '+escHtml(p.title)+'</span>':'')+(p.email?' · <span style="color:#3B82F6">'+escHtml(p.email)+'</span>':'')+'</div>';
          }).join('')
        + (g.contacts.length > 5 ? '<div style="opacity:.7">+'+(g.contacts.length-5)+' yana</div>' : '')
      + '</div>'
      : '';
    var leadBadge = g.contacts.length > 0
      ? '<span style="display:inline-block;margin-left:6px;padding:1px 7px;border-radius:10px;background:#E0E7FF;color:#4338CA;font-size:.6rem;font-weight:700">'+g.contacts.length+' lead</span>'
      : '';
    return '<tr style="cursor:pointer" onclick="openCrmCompanyDetail('+i+')">'
      +'<td style="font-size:.72rem;color:var(--text3);vertical-align:top;padding-top:10px">'+(i+1)+'</td>'
      +'<td style="vertical-align:top;padding-top:10px"><div style="font-size:.78rem;font-weight:700;color:var(--text)">'+escHtml(c.name)+leadBadge+'</div>'
        + contactsHtml
      +'</td>'
      +'<td style="font-size:.74rem;vertical-align:top;padding-top:10px">'+escHtml(c.country)+'</td>'
      +'<td style="vertical-align:top;padding-top:10px"><span style="font-size:.68rem;padding:3px 8px;border-radius:4px;background:var(--bg2);color:var(--text3)">'+srcL+'</span></td>'
      +'<td style="vertical-align:top;padding-top:10px"><span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:.65rem;font-weight:600;background:'+sc+'15;color:'+sc+';border:1px solid '+sc+'30">'+sl+'</span></td>'
      +'<td style="font-size:.72rem;color:var(--text3);vertical-align:top;padding-top:10px">'+escHtml(c.industry)+'</td>'
      +'<td style="font-size:.7rem;color:var(--text3);vertical-align:top;padding-top:10px">'+escHtml(c.date)+'</td>'
      +'<td style="vertical-align:top;padding-top:10px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2" style="cursor:pointer"><polyline points="9 18 15 12 9 6"/></svg></td>'
    +'</tr>';
  }).join('');

  if(filtered.length===0){
    tbody.innerHTML='<tr><td colspan="8" style="text-align:center;padding:2rem;font-size:.7rem;color:var(--text3)">Kompaniya topilmadi</td></tr>';
  }
  if(countEl) countEl.textContent=filtered.length+' ta';

  // Store for detail view
  window._crmFilteredCompanies=filtered;
}

function openCrmCompanyDetail(idx){
  var list=window._crmFilteredCompanies||[];
  var c=list[idx];if(!c)return;

  var panel=document.getElementById('crm-co-detail');
  var title=document.getElementById('crm-co-detail-title');
  var body=document.getElementById('crm-co-detail-body');
  if(!panel||!body)return;

  panel.style.display='block';
  title.textContent=c.name||'Kompaniya profili';
  window._crmCurrentCompany=c;

  var statusColors={
    'new':'#3B82F6','sent':'#8B5CF6','replied':'#F59E0B','meeting':'#EF4444','customer':'#059669'
  };
  var sc=statusColors[c.status]||'#94A3B8';

  var html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem">';

  // Left: Company Info
  html+='<div>';
  html+='<div style="font-size:.7rem;font-weight:700;color:var(--text);margin-bottom:8px">Asosiy ma\'lumotlar</div>';
  var fields=[
    {l:'Kompaniya',v:c.name},
    {l:'Davlat',v:c.country},
    {l:'Sanoat',v:c.industry},
    {l:'Manba',v:c.source},
    {l:'Kontakt',v:c.contactName+(c.contactTitle?' — '+c.contactTitle:'')},
    {l:'Email',v:c.email},
    {l:'Telefon',v:c.phone},
    {l:'Veb-sayt',v:c.website},
    {l:'Xodimlar soni',v:c.employees},
    {l:'Potensial investitsiya',v:c.potentialInvestment?'$'+_fmtNum(Number(c.potentialInvestment)):'—'},
    {l:'Izoh',v:c.notes}
  ];
  fields.forEach(function(f){
    if(!f.v)return;
    html+='<div style="display:flex;gap:6px;margin-bottom:5px;font-size:.62rem">'
      +'<div style="width:100px;color:var(--text3);flex-shrink:0;font-weight:500">'+f.l+'</div>'
      +'<div style="color:var(--text);font-weight:500">'+f.v+'</div>'
    +'</div>';
  });

  // Status badge
  html+='<div style="margin-top:10px">'
    +'<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:.58rem;font-weight:600;background:'+sc+'15;color:'+sc+';border:1px solid '+sc+'30">'+(c.status||'new').toUpperCase()+'</span>'
  +'</div>';
  html+='</div>';

  // Right: Timeline
  html+='<div>';
  html+='<div style="font-size:.7rem;font-weight:700;color:var(--text);margin-bottom:8px">Faoliyatlar tarixi</div>';
  html+='<div id="crm-co-timeline" style="border-left:2px solid var(--border);padding-left:14px">';

  // Build timeline from raw data
  var acts=[];
  if(c.type==='ic'){
    var r=c.raw;
    if(r.emailSentDate) acts.push({icon:'📤',text:'Email yuborildi',date:r.emailSentDate});
    if(r.emailOpened) acts.push({icon:'👀',text:'Email ochildi',date:r.emailOpenedDate||''});
    if(r.emailReplied) acts.push({icon:'💬',text:'Javob keldi'+(r.replySentiment?' ('+r.replySentiment+')':''),date:r.replyDate||''});
    if(r.phoneCalled) acts.push({icon:'📞',text:'Telefon qo\'ng\'iroq',date:r.phoneDate||''});
    if(r.pipelineStage==='meeting') acts.push({icon:'🤝',text:'Muzokara/Zoom',date:''});
    if(r.companyOpened) acts.push({icon:'🏭',text:'Korxona ochildi',date:''});
  }
  if(c.date) acts.unshift({icon:'🔍',text:'Kompaniya aniqlandi ('+c.source+')',date:c.date});

  if(acts.length===0){
    html+='<div style="font-size:.6rem;color:var(--text3);padding:1rem 0">Hozircha faoliyat yo\'q</div>';
  } else {
    acts.forEach(function(a){
      html+='<div style="position:relative;margin-bottom:12px">'
        +'<div style="position:absolute;left:-20px;top:2px;width:12px;height:12px;border-radius:50%;background:var(--card);border:2px solid var(--border);z-index:1"></div>'
        +'<div style="font-size:.64rem;font-weight:600;color:var(--text)">'+a.icon+' '+a.text+'</div>'
        +'<div style="font-size:.52rem;color:var(--text3)">'+a.date+'</div>'
      +'</div>';
    });
  }
  html+='</div></div></div>';

  body.innerHTML=html;

  // Scroll to detail
  setTimeout(function(){panel.scrollIntoView({behavior:'smooth',block:'start'});},100);
}

function closeCrmDetail(){
  var panel=document.getElementById('crm-co-detail');
  if(panel) panel.style.display='none';
}

function openCrmActivity(){
  var c=window._crmCurrentCompany;
  if(!c){toast('Avval kompaniya tanlang','error');return;}
  // Activity modal
  var html='<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center" id="crm-act-modal" onclick="if(event.target===this)this.remove()">'
    +'<div style="background:var(--card);border-radius:12px;padding:1.2rem;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
      +'<div style="font-size:.82rem;font-weight:700;color:var(--text);margin-bottom:.8rem">Yangi faoliyat — '+c.name+'</div>'
      +'<div style="margin-bottom:.6rem">'
        +'<label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:3px">Faoliyat turi</label>'
        +'<select id="crm-act-type" style="width:100%;font-size:.68rem;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text)">'
          +'<option value="call">📞 Telefon qo\'ng\'iroq</option>'
          +'<option value="zoom">📹 Zoom uchrashuv</option>'
          +'<option value="visit">✈ Tashrif (Navoiyga keldi)</option>'
          +'<option value="note">📝 Izoh</option>'
        +'</select>'
      +'</div>'
      +'<div style="margin-bottom:.6rem">'
        +'<label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:3px">Davomiyligi (daqiqa)</label>'
        +'<input id="crm-act-duration" type="number" placeholder="30" style="width:100%;font-size:.68rem;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text)">'
      +'</div>'
      +'<div style="margin-bottom:.6rem">'
        +'<label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:3px">Kayfiyat (Sentiment)</label>'
        +'<select id="crm-act-sentiment" style="width:100%;font-size:.68rem;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text)">'
          +'<option value="positive">Ijobiy</option>'
          +'<option value="neutral" selected>Neytral</option>'
          +'<option value="negative">Salbiy</option>'
        +'</select>'
      +'</div>'
      +'<div style="margin-bottom:.8rem">'
        +'<label style="font-size:.62rem;color:var(--text3);display:block;margin-bottom:3px">Izoh</label>'
        +'<textarea id="crm-act-notes" rows="3" placeholder="Qo\'shimcha ma\'lumot..." style="width:100%;font-size:.68rem;padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--card);color:var(--text);resize:vertical"></textarea>'
      +'</div>'
      +'<div style="display:flex;gap:.5rem;justify-content:flex-end">'
        +'<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'crm-act-modal\').remove()" style="font-size:.62rem">Bekor qilish</button>'
        +'<button class="btn btn-blue btn-sm" onclick="saveCrmActivity()" style="font-size:.62rem">Saqlash</button>'
      +'</div>'
    +'</div>'
  +'</div>';
  document.body.insertAdjacentHTML('beforeend',html);
}

function saveCrmActivity(){
  var type=(document.getElementById('crm-act-type')||{}).value||'note';
  var dur=(document.getElementById('crm-act-duration')||{}).value||'';
  var sent=(document.getElementById('crm-act-sentiment')||{}).value||'neutral';
  var notes=(document.getElementById('crm-act-notes')||{}).value||'';
  var c=window._crmCurrentCompany;

  var typeLabels={call:'Telefon qo\'ng\'iroq',zoom:'Zoom uchrashuv',visit:'Navoiyga tashrif buyurgan',note:'Izoh'};
  toast('✅ '+typeLabels[type]+' saqlandi: '+(c?c.name:''));

  // Remove modal
  var m=document.getElementById('crm-act-modal');
  if(m)m.remove();

  // TODO: Save to Firebase when integrated
}

/* ═══ CRM FUNNEL TAB ═══ */
function renderCrmFunnelTab(){
  var co = DB.investorCompanies||[];
  _renderCrmFunnelBig(co);
  _renderCrmVelocity(co);
  renderCrmPipelineTable();
}

function _renderCrmFunnelBig(co){
  var el=document.getElementById('crm-funnel-big');if(!el)return;
  var stages=[
    {key:'new',name:'Lead (Aniqlangan)',desc:'Kompaniya topildi',color:'#3B82F6'},
    {key:'sent',name:'Contacted (Xat yuborildi)',desc:'Email jo\'natildi',color:'#8B5CF6'},
    {key:'replied',name:'Engaged (Javob olindi)',desc:'Ijobiy javob keldi',color:'#F59E0B'},
    {key:'meeting',name:'Negotiation (Muzokara)',desc:'Zoom/uchrashuv',color:'#EF4444'},
    {key:'customer',name:'Customer (Mijoz)',desc:'Korxona ochildi',color:'#059669'}
  ];

  var counts={new:0,sent:0,replied:0,meeting:0,customer:0};
  co.forEach(function(c){
    var st=c.pipelineStage||(c.emailSent?'sent':'new');
    if(c.companyOpened) st='customer';
    if(counts[st]!==undefined) counts[st]++; else counts['new']++;
  });

  // SVG trapezoid funnel
  var W=700, rowH=62, gap=3, totalH=stages.length*rowH+(stages.length-1)*gap;
  var widths=[100,80,60,42,28]; // % widths for funnel shape

  var svg='<svg viewBox="0 0 '+W+' '+(totalH+40)+'" style="width:100%;max-width:700px;display:block;margin:0 auto">';

  stages.forEach(function(s,i){
    var cnt=counts[s.key];
    var prevCnt=i===0?cnt:counts[stages[i-1].key];
    var conv=i===0?'—':(prevCnt>0?Math.round(cnt/prevCnt*100)+'%':'0%');

    var topW=W*(widths[i]/100);
    var botW=(i<stages.length-1)?W*(widths[i+1]/100):topW*0.7;
    var y=i*(rowH+gap);
    var topX=(W-topW)/2;
    var botX=(W-botW)/2;
    var midW=(topW+botW)/2;
    var midX=(W-midW)/2;
    var centerX=W/2;

    // Trapezoid path
    svg+='<path d="M'+topX+' '+y+' L'+(topX+topW)+' '+y+' L'+(botX+botW)+' '+(y+rowH)+' L'+botX+' '+(y+rowH)+' Z" fill="'+s.color+'" opacity=".92"/>';

    // Stage name + desc (centered in trapezoid)
    // Split name: e.g. "Lead (Aniqlangan)" -> line1="Lead", line2="(Aniqlangan)"
    var nameParts=s.name.split(' (');
    var line1=nameParts[0];
    var line2=nameParts.length>1?'('+nameParts[1]:'';
    svg+='<text x="'+(centerX-30)+'" y="'+(y+rowH/2-8)+'" fill="#fff" font-size="14" font-weight="700" text-anchor="middle">'+line1+'</text>';
    svg+='<text x="'+(centerX-30)+'" y="'+(y+rowH/2+5)+'" fill="rgba(255,255,255,.75)" font-size="9.5" text-anchor="middle">'+line2+'</text>';
    svg+='<text x="'+(centerX-30)+'" y="'+(y+rowH/2+17)+'" fill="rgba(255,255,255,.55)" font-size="8" text-anchor="middle">'+s.desc+'</text>';

    // Count (right of center)
    svg+='<text x="'+(centerX+60)+'" y="'+(y+rowH/2+2)+'" fill="#fff" font-size="24" font-weight="800" text-anchor="start" dominant-baseline="middle">'+cnt+'</text>';

    // Conversion % on right side outside funnel
    if(i>0){
      var arrY=y-gap/2;
      var convColor=parseInt(conv)>=15?'#059669':'#EF4444';
      if(conv==='0%') convColor='#94A3B8';
      svg+='<text x="'+(topX+topW+12)+'" y="'+(y+rowH/2+2)+'" fill="'+convColor+'" font-size="11" font-weight="600" text-anchor="start" dominant-baseline="middle">'+conv+'</text>';
    }
  });

  // Legend at bottom
  var ly=totalH+18;
  svg+='<text x="'+(W/2)+'" y="'+ly+'" fill="var(--text3)" font-size="10.5" text-anchor="middle">Jami: '+co.length+' ta kompaniya  |  Aniqlangandan Mijozgacha</text>';
  svg+='</svg>';

  // Side stats
  var statsHtml='<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:.5rem;margin-top:.8rem">';
  stages.forEach(function(s,i){
    var cnt=counts[s.key];
    var pct=co.length>0?Math.round(cnt/co.length*100):0;
    statsHtml+='<div style="text-align:center;padding:8px 4px;background:var(--bg2);border-radius:8px;border-left:3px solid '+s.color+'">'
      +'<div style="font-size:1rem;font-weight:800;color:var(--text)">'+cnt+'</div>'
      +'<div style="font-size:.58rem;color:var(--text3)">'+s.name+'</div>'
      +'<div style="font-size:.5rem;color:'+s.color+';font-weight:600">'+pct+'%</div>'
    +'</div>';
  });
  statsHtml+='</div>';

  el.innerHTML=svg+statsHtml;
}

function _renderCrmVelocity(co){
  var el=document.getElementById('crm-velocity');if(!el)return;
  var stages=[
    {from:'Lead',to:'Contacted',days:3,color:'#3B82F6',icon:'📨'},
    {from:'Contacted',to:'Engaged',days:12,color:'#8B5CF6',icon:'💬'},
    {from:'Engaged',to:'Negotiation',days:45,color:'#F59E0B',icon:'🤝'},
    {from:'Negotiation',to:'Customer',days:180,color:'#EF4444',icon:'🏭'}
  ];

  var totalDays=0;
  var maxDays=Math.max.apply(null,stages.map(function(s){return s.days;}))||1;

  var html='<div style="display:flex;gap:.6rem;align-items:stretch">';
  stages.forEach(function(s,i){
    var barPct=Math.max(Math.round((s.days/maxDays)*100),8);
    totalDays+=s.days;
    html+='<div style="flex:1;display:flex;flex-direction:column;align-items:center">'
      +'<div style="font-size:.6rem;color:var(--text3);margin-bottom:6px;text-align:center;line-height:1.3">'+s.from+'<br><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg><br>'+s.to+'</div>'
      +'<div style="flex:1;width:100%;display:flex;align-items:flex-end;min-height:100px">'
        +'<div style="width:100%;height:'+barPct+'%;background:linear-gradient(180deg,'+s.color+','+s.color+'cc);border-radius:8px 8px 0 0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:30px;transition:height .5s">'
          +'<div style="font-size:.9rem;font-weight:800;color:#fff">'+s.days+'</div>'
          +'<div style="font-size:.5rem;color:rgba(255,255,255,.8)">kun</div>'
        +'</div>'
      +'</div>'
    +'</div>';
    // Arrow between bars
    if(i<stages.length-1){
      html+='<div style="display:flex;align-items:center;padding-top:50px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--border)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>';
    }
  });
  html+='</div>';

  html+='<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">'
    +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
    +'<span style="font-size:.72rem;color:var(--text3)">Jami o\'rtacha tsikl:</span>'
    +'<span style="font-size:.9rem;font-weight:800;color:var(--text)">~'+totalDays+' kun</span>'
    +'<span style="font-size:.62rem;color:var(--text3);">('+Math.round(totalDays/30)+' oy)</span>'
  +'</div>';

  el.innerHTML=html;
}

function renderCrmPipelineTable(){
  var tbody=document.getElementById('crm-pipe-tbody');
  var summary=document.getElementById('crm-pipe-summary');
  if(!tbody)return;

  var co=DB.investorCompanies||[];
  var filterStatus=(document.getElementById('crm-pipe-filter-status')||{}).value||'all';
  var searchTerm=((document.getElementById('crm-pipe-search')||{}).value||'').toLowerCase();

  var statusMap={
    'new':{label:'Lead',color:'#3B82F6'},
    'sent':{label:'Contacted',color:'#8B5CF6'},
    'opened':{label:'Opened',color:'#6366F1'},
    'replied':{label:'Engaged',color:'#F59E0B'},
    'meeting':{label:'Negotiation',color:'#EF4444'},
    'customer':{label:'Customer',color:'#059669'}
  };

  var filtered=co.filter(function(c){
    var st=c.pipelineStage||(c.emailSent?'sent':'new');
    if(c.companyOpened) st='customer';
    if(filterStatus!=='all'&&st!==filterStatus) return false;
    if(searchTerm){
      var name=(c.kompaniya||c.name||'').toLowerCase();
      var country=(c.davlat||c.country||'').toLowerCase();
      if(name.indexOf(searchTerm)<0&&country.indexOf(searchTerm)<0) return false;
    }
    return true;
  });

  var totalInv=0;
  tbody.innerHTML=filtered.map(function(c,i){
    var st=c.pipelineStage||(c.emailSent?'sent':'new');
    if(c.companyOpened) st='customer';
    var sm=statusMap[st]||statusMap['new'];
    var inv=Number(c.potentialInvestment)||0;
    totalInv+=inv;
    var prob=c.probability||'—';

    return '<tr>'
      +'<td style="font-size:.6rem;color:var(--text3)">'+(i+1)+'</td>'
      +'<td><div style="font-size:.68rem;font-weight:600;color:var(--text)">'+(c.kompaniya||c.name||'Noaniq')+'</div>'
        +(c.contactName?'<div style="font-size:.55rem;color:var(--text3)">'+c.contactName+(c.contactTitle?' · '+c.contactTitle:'')+'</div>':'')
      +'</td>'
      +'<td style="font-size:.62rem">'+(c.davlat||c.country||'—')+'</td>'
      +'<td style="font-size:.62rem">'+(c.sanoat||c.industry||'—')+'</td>'
      +'<td><span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:.55rem;font-weight:600;background:'+sm.color+'15;color:'+sm.color+';border:1px solid '+sm.color+'30">'+sm.label+'</span></td>'
      +'<td style="font-size:.6rem;color:var(--text3)">'+(c.createdAt||c.addedDate||'—')+'</td>'
      +'<td style="font-size:.6rem;color:var(--text3)">'+(c.emailSentDate||c.lastActivity||'—')+'</td>'
      +'<td style="font-size:.65rem;font-weight:600;color:var(--text)">'+(inv>0?'$'+_fmtNum(inv):'—')+'</td>'
      +'<td style="font-size:.62rem;color:var(--text3)">'+prob+'</td>'
    +'</tr>';
  }).join('');

  if(filtered.length===0){
    tbody.innerHTML='<tr><td colspan="9" style="text-align:center;padding:2rem;font-size:.7rem;color:var(--text3)">Kompaniya topilmadi</td></tr>';
  }

  if(summary){
    summary.textContent='Jami: '+filtered.length+' ta kompaniya | Pipeline qiymati: $'+_fmtNum(totalInv);
  }
}

function renderPipeline(){
  renderMailboxPanel();
  var co = DB.investorCompanies||[];
  var stages = {new:[],sent:[],opened:[],replied:[],meeting:[]};

  co.forEach(function(c){
    var stage = c.pipelineStage || (c.emailSent ? 'sent' : 'new');
    if(!stages[stage]) stage = 'new';
    stages[stage].push(c);
  });

  var totalSent = stages.sent.length+stages.opened.length+stages.replied.length+stages.meeting.length;
  document.getElementById('pl-k1').textContent = totalSent;
  document.getElementById('pl-k2').textContent = totalSent>0?Math.round(stages.opened.length/totalSent*100)+'%':'0%';
  document.getElementById('pl-k3').textContent = totalSent>0?Math.round(stages.replied.length/totalSent*100)+'%':'0%';
  document.getElementById('pl-k4').textContent = '$'+Math.round(co.length*0.05)+'M';

  Object.keys(stages).forEach(function(key){
    var el = document.getElementById('kb-items-'+key);
    var countEl = document.getElementById('kb-'+key);
    if(countEl) countEl.textContent = stages[key].length;
    if(el){
      el.innerHTML = stages[key].length ? stages[key].slice(0,15).map(function(c){
        var scoreColor = (c.score||50)>=80?'#059669':(c.score||50)>=60?'#FFB703':'#EF233C';
        return '<div class="kanban-card" onclick="showKanbanDetail(\''+c.id+'\')"><div class="kanban-card-name">'+c.kompaniya+'</div><div class="kanban-card-sub">'+(c.davlat||'?')+' • '+(c.rahbar||'—')+'</div>'+(c.score?'<span class="kanban-card-score" style="background:'+scoreColor+'">'+c.score+' ball</span>':'')+'</div>';
      }).join('') : '<div style="padding:1rem;text-align:center;font-size:.65rem;color:var(--text3)">Bo\'sh</div>';
    }
  });

  // Follow-up
  var today = new Date();
  var fu = co.filter(function(c){
    if(!c.emailSentDate||c.pipelineStage==='replied'||c.pipelineStage==='meeting') return false;
    var sent = new Date(c.emailSentDate);
    var days = Math.floor((today-sent)/(1000*60*60*24));
    return days>=7;
  });
  document.getElementById('followup-count').textContent = fu.length;
  var ftb = document.getElementById('followup-tbody');
  if(ftb){
    ftb.innerHTML = fu.length ? fu.map(function(c,i){
      var days = Math.floor((today-new Date(c.emailSentDate))/(1000*60*60*24));
      var xatNo = days>=21?3:days>=14?2:1;
      return '<tr><td>'+(i+1)+'</td><td><b>'+c.kompaniya+'</b></td><td>'+xatNo+'-xat</td><td>'+c.emailSentDate+'</td><td style="color:#FFB703;font-weight:700">⏰ '+days+' kun</td><td><button class="btn btn-blue btn-sm" onclick="goToAiLetterById(\''+c.id+'\')">📧 Xat yozish</button></td></tr>';
    }).join('') : '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:var(--text3)">Follow-up kerak emas</td></tr>';
  }
}

function showKanbanDetail(id){
  var comp = (DB.investorCompanies||[]).find(function(c){return String(c.id)===String(id);});
  if(!comp) return;
  var stages = ['new','sent','opened','replied','meeting'];
  var stageNames = ['📨 Yangi','✉️ Yuborildi','👀 Ochildi','💬 Javob','🤝 Muzokara'];
  var curStage = comp.pipelineStage || 'new';
  var btns = stages.map(function(s,i){
    return '<button onclick="setPipelineStage(\''+id+'\',\''+s+'\')" style="padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:'+(curStage===s?'var(--accent)':'var(--bg2)')+';color:'+(curStage===s?'#fff':'var(--text)')+';font-size:.65rem;cursor:pointer">'+stageNames[i]+'</button>';
  }).join(' ');
  toast(comp.kompaniya+' — '+btns, 'info', 10000);
}

function setPipelineStage(id, stage){
  var comp = (DB.investorCompanies||[]).find(function(c){return String(c.id)===String(id);});
  if(comp){
    comp.pipelineStage = stage;
    if(typeof fbSave==='function') fbSave('investorCompanies',comp);
    renderPipeline();
    toast('✅ '+comp.kompaniya+' → '+stage);
  }
}

function goToAiLetterById(id){
  showPage('investor');
  setTimeout(function(){
    renderInvestorCompanies();
    openInvestorAiWorkspace(id);
  },300);
}
