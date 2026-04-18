/* ═══════════════════════════════════════
   GMAIL NOTIFICATIONS
═══════════════════════════════════════ */
var _gmailConnected = false;
var _gmailToken    = null;
var _gmailUser     = '';
var _pollInterval  = null;
var _seenIds       = new Set(JSON.parse(sessionStorage.getItem('_seenIds')||'[]'));
var _notifications = (function(){
  const saved = JSON.parse(localStorage.getItem('_notifs')||'[]');
  // Deduplicate by id — keep last occurrence
  const seen = new Map();
  saved.forEach(function(n){ if(n.id) seen.set(n.id, n); });
  const deduped = Array.from(seen.values());
  // If duplicates existed, save cleaned version back
  if(deduped.length !== saved.length) localStorage.setItem('_notifs', JSON.stringify(deduped));
  return deduped;
})();
// Also seed _seenIds from saved notifications so they don't get re-added on reload
_notifications.forEach(function(n){ if(n.id) _seenIds.add(n.id); });
var _unreadCount   = 0;

/* ── Bell UI ─────────────────── */
function toggleNotifPanel(){
  const p = document.getElementById('notifPanel');
  const isOpen = p.classList.toggle('open');
  if(isOpen){
    _unreadCount = 0;
    updateBellBadge();
    if(Array.isArray(_notifications)) _notifications.forEach(n=>n.unread=false);
    localStorage.setItem('_notifs', JSON.stringify(_notifications.slice(-50)));
    renderNotifList();
  }
}

function updateBellBadge(){
  const dot = document.getElementById('notifDot');
  const cnt = document.getElementById('notifCount');
  if(_unreadCount > 0){
    dot.classList.add('has-new');
    cnt.classList.add('visible');
    cnt.textContent = _unreadCount > 9 ? '9+' : _unreadCount;
  } else {
    dot.classList.remove('has-new');
    cnt.classList.remove('visible');
  }
}

function renderNotifList(){
  const list = document.getElementById('notifList');
  if(!_notifications.length){
    list.innerHTML = _gmailConnected
      ? '<div class="notif-empty">\u{1F4ED} Yangi email javob yo\'q<br><span style="font-size:.62rem">Har 60 soniyada tekshiriladi</span></div>'
      : '<div class="notif-empty">\u{1F517} Gmail\'ga ulaning<br><span style="font-size:.62rem;color:#4361EE;cursor:pointer" onclick="openGmailSetup()">\u2795 Ulash uchun bosing</span></div>';
    return;
  }
  list.innerHTML = _notifications.slice().reverse().map((n,i)=>`
    <div class="notif-item ${n.unread?'unread':''}" onclick="openNotifAsDrawer(${i})">
      <div class="notif-item-icon">${n.fromShort?n.fromShort[0].toUpperCase():'✉'}</div>
      <div class="notif-item-body">
        <div class="notif-item-from">${escHtml(n.companyName||n.fromShort)}</div>
        <div class="notif-item-subj">${escHtml(n.subject)}</div>
        <div class="notif-item-snippet">${escHtml((n.snippet||'').slice(0,90))}…</div>
      </div>
      <div class="notif-item-time">${n.time}</div>
    </div>`).join('');
}

function markRead(idx){
  if(_notifications[idx]) _notifications[idx].unread = false;
  localStorage.setItem('_notifs', JSON.stringify(_notifications.slice(-50)));
  renderNotifList();
}

function clearAllNotifs(){
  _notifications = [];
  _unreadCount = 0;
  localStorage.removeItem('_notifs');
  updateBellBadge();
  renderNotifList();
}

/* escHtml moved to assets/js/utils.js */

/* ── Setup Modal ─────────────── */
function openGmailSetup(){
  var np = document.getElementById('notifPanel');
  if(np) np.classList.remove('open');
  document.getElementById('gmailSetupModal').classList.add('open');
  var origin = location.origin;
  var originEl = document.getElementById('setupOrigin');
  var errEl = document.getElementById('gmailSetupError');
  if(origin === 'null' || origin.indexOf('file') === 0){
    originEl.textContent = 'http://localhost:3456';
    errEl.style.color = '#d97706';
    errEl.textContent = '⚠️ Siz file:// orqali ochgansiz. Google OAuth ishlashi uchun saytni http://localhost yoki Netlify orqali oching.';
  } else {
    originEl.textContent = origin;
    errEl.textContent = '';
  }
  document.getElementById('gmailClientIdInput').value = localStorage.getItem('_gmailClientId')||'';
  document.getElementById('myEmailInput').value = localStorage.getItem('_myEmail')||'';
}

function closeGmailSetup(){
  document.getElementById('gmailSetupModal').classList.remove('open');
}

function saveAndConnectGmail(){
  const clientId = document.getElementById('gmailClientIdInput').value.trim();
  const myEmail  = document.getElementById('myEmailInput').value.trim();
  const errEl    = document.getElementById('gmailSetupError');

  if(!myEmail || !myEmail.includes('@')){
    errEl.textContent = '⚠️ O\'zingizning Gmail manzilingizni kiriting'; return;
  }
  if(!clientId){
    errEl.textContent = '⚠️ Client ID ni kiriting'; return;
  }
  if(!clientId.includes('googleusercontent.com')){
    errEl.textContent = "⚠️ Format noto'g'ri. ...apps.googleusercontent.com bilan tugashi kerak"; return;
  }
  errEl.style.color = '#059669';
  errEl.textContent = '⏳ Google ga ulanilmoqda...';

  localStorage.setItem('_gmailClientId', clientId);
  localStorage.setItem('_myEmail', myEmail);

  // Check google library loaded
  if(typeof google === 'undefined' || !google.accounts){
    errEl.style.color = '#dc2626';
    errEl.textContent = '❌ Google kutubxonasi yuklanmadi. Sahifani yangilab qayta urining.';
    return;
  }

  try{
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GMAIL_SCOPES,
      prompt: 'select_account',
      callback: (resp) => {
        console.log('OAuth callback:', resp);
        if(!resp || resp.error){
          errEl.style.color = '#dc2626';
          errEl.textContent = '❌ Xato: ' + (resp?.error||'token olinmadi') + (resp?.error === 'idpiframe_initialization_failed'
            ? ' — Netlify manzili Origins ga qo\'shilganmi?'
            : resp?.error === 'access_denied' ? ' — Ruxsat berilmadi' : '');
          return;
        }
        errEl.style.color = '#059669';
        errEl.textContent = '✅ Muvaffaqiyatli ulandi!';
        setTimeout(()=>{ closeGmailSetup(); }, 800);
        onGmailToken(resp);
      }
    });
    client.requestAccessToken({ prompt: 'select_account' });
  } catch(e){
    errEl.style.color = '#dc2626';
    errEl.textContent = '❌ ' + e.message;
  }
}

/* ── OAuth ───────────────────── */
function initGmailAuth(clientId){
  if(!clientId) clientId = localStorage.getItem('_gmailClientId');
  if(!clientId) return;
  if(typeof google === 'undefined' || !google.accounts) return;
  try{
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GMAIL_SCOPES,
      prompt: '',
      callback: (resp) => {
        if(resp.error){ return; } // silent fail on auto-reconnect
        onGmailToken(resp);
      }
    });
    client.requestAccessToken({ prompt: '' });
  } catch(e){ console.warn('GSI reconnect:', e); }
}

function onGmailToken(resp){
  console.log('Gmail token response:', resp);
  if(!resp || resp.error){
    const errEl = document.getElementById('gmailSetupError');
    if(errEl){ errEl.style.color='#dc2626'; errEl.textContent='❌ Xato: '+(resp?.error||'Noma\'lum xato'); }
    toast('❌ Gmail: '+(resp?.error||'token xatosi'), 'error');
    return;
  }
  _gmailToken = resp.access_token;
  _gmailConnected = true;
  // Token 1 soat (3600 sek) ishlaydi — muddatni saqlaymiz
  const expiresAt = Date.now() + (resp.expires_in || 3599) * 1000;
  localStorage.setItem('_gmailToken', resp.access_token);
  localStorage.setItem('_gmailTokenExp', String(expiresAt));
  localStorage.setItem('_gmailWasConnected','1');

  const btn = document.getElementById('gmailConnectBtn');
  if(btn){ btn.textContent = '✅ Ulangan'; btn.classList.add('connected'); }
  fetch('https://www.googleapis.com/oauth2/v3/userinfo',{ headers:{ Authorization:'Bearer '+_gmailToken } })
    .then(r=>r.json()).then(u=>{
      _gmailUser = u.email||'';
      document.getElementById('gmailStatus').textContent = _gmailUser;
      localStorage.setItem('_gmailUserEmail', _gmailUser);
      if(typeof renderPipeline==='function') renderPipeline();
    });
  toast('✅ Gmail ulandi!', 'success');
  if(typeof renderPipeline==='function') renderPipeline();
  checkGmailReplies(true);
  startPolling();
}

function startPolling(){
  clearInterval(_pollInterval);
  const saved = parseInt(localStorage.getItem('_pollSecs')||'60');
  const sel = document.getElementById('pollIntervalSelect');
  if(sel) sel.value = String(saved);
  if(saved === 0) return; // off
  _pollInterval = setInterval(()=>checkGmailReplies(false), saved * 1000);
}

function changePollInterval(){
  const sel = document.getElementById('pollIntervalSelect');
  const secs = parseInt(sel.value);
  localStorage.setItem('_pollSecs', secs);
  clearInterval(_pollInterval);
  if(secs === 0){
    toast('⏸ Avtomatik tekshiruv o\'chirildi', 'info');
    return;
  }
  if(_gmailConnected){
    _pollInterval = setInterval(()=>checkGmailReplies(false), secs * 1000);
    const label = secs < 60 ? secs+'s' : (secs/60)+'daq';
    toast(`🔄 Har ${label} da tekshiriladi`, 'info');
  }
}

/* ── Polling ─────────────────── */
async function checkGmailReplies(manual=false){
  if(!_gmailConnected||!_gmailToken){ if(manual) toast('⚠️ Avval Gmail ga ulaning','error'); return; }
  try {
    // All company emails (whether sent or not - for matching)
    const allCompanyEmails = DB.investorCompanies.filter(r=>r.email).map(r=>r.email.toLowerCase());

    // Broad query: all unread in last 30 days
    const q = encodeURIComponent('is:unread newer_than:30d');
    const r = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=50`,
      { headers:{ Authorization:'Bearer '+_gmailToken } }
    );
    if(r.status===401){ _gmailToken=null; _gmailConnected=false; updateBellBadge(); return; }
    const data = await r.json();
    const msgs = data.messages||[];
    if(manual) toast(`🔄 ${msgs.length} ta xat tekshirilmoqda...`, 'info');

    let newCount=0;
    for(const m of msgs){
      if(_seenIds.has(m.id)) continue;

      const mr = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
        { headers:{ Authorization:'Bearer '+_gmailToken } }
      );
      const md = await mr.json();
      const h={};
      (md.payload?.headers||[]).forEach(x=>{ h[x.name.toLowerCase()]=x.value; });

      const fromRaw    = h['from']||'';
      const fromEmail  = (fromRaw.match(/<([^>]+)>/) || [,''])[1]||fromRaw;
      const fromShort  = fromRaw.replace(/<[^>]+>/,'').trim()||fromEmail;
      const subject    = h['subject']||'(mavzu yo\'q)';
      const inReplyTo  = h['in-reply-to']||'';
      const references = h['references']||'';
      const toHeader   = h['to']||'';

      // Always mark as seen so we don't re-process
      _seenIds.add(m.id);

      // Determine if this is a relevant reply:
      // 1. Has In-Reply-To header (real reply)
      // 2. Subject starts with Re: / RE: / Ответ: / Fwd:
      // 3. From a known company email
      // 4. Sent to our email address and is a reply thread
      const isThreadReply  = !!inReplyTo || !!references;
      const isReSubject    = /^(re|fwd|ответ|fw|ре)[:\s]/i.test(subject.trim());
      const isFromCompany  = allCompanyEmails.includes(fromEmail.toLowerCase());

      // Skip if clearly not a reply and not from a company
      if(!isThreadReply && !isReSubject && !isFromCompany) continue;

      const bodyText = extractEmailBody(md.payload);
      const company  = DB.investorCompanies.find(r=>r.email&&r.email.toLowerCase()===fromEmail.toLowerCase());

      const notifToEmail = extractEmailFromHeaderText(toHeader) || getPrimaryMailboxEmail() || '';
      const notif = {
        id: m.id,
        fromRaw, fromShort, fromEmail, subject,
        snippet:  md.snippet||'',
        body:     bodyText,
        companyName: company?.kompaniya||'',
        companyId:   company?.id||null,
        toEmail:   notifToEmail,
        time:     formatNotifTime(h['date']),
        dateRaw:  h['date']||'',
        unread:   true,
        ts:       Date.now()
      };

      if(company){
        company.emailReplied = true;
        company.replyDate = new Date().toISOString().split('T')[0];
        // Auto-detect sentiment from body text
        var _bLow = (bodyText||'').toLowerCase();
        var _posWords = /interest|agree|yes|great|happy|pleased|look forward|accept|invest|partner|meeting|schedule|call|visit|welcome|glad/i;
        var _negWords = /not interested|no thank|decline|reject|unfortunately|regret|unable|cannot|sorry|pass|unsubscribe|remove|stop/i;
        if(_negWords.test(_bLow)){
          company.replySentiment = 'negative';
        } else if(_posWords.test(_bLow)){
          company.replySentiment = 'positive';
          if(company.pipelineStage !== 'meeting') company.pipelineStage = 'replied';
        } else {
          company.replySentiment = 'neutral';
          if(company.pipelineStage !== 'meeting') company.pipelineStage = 'replied';
        }
        company.replyReceivedAt = new Date().toISOString();
        if(typeof fbSave === 'function') fbSave('investorCompanies', company);
      }

      // Double-check not already in _notifications (in case localStorage had it)
      if(_notifications.some(function(x){return x.id===notif.id;})) continue;

      _notifications.push(notif);
      _replyQueue.push(notif);
      newCount++;
      _unreadCount++;

      if(Notification.permission==='granted'){
        const label = company?.kompaniya || fromShort;
        const dn = new Notification('📧 Yangi javob: '+label,
          { body: subject+'\n'+(md.snippet||'').slice(0,80) });
        dn.onclick=()=>{ window.focus(); openReplyDrawer(notif); };
      }
      toast('📧 '+(company?.kompaniya||fromShort)+': '+subject.slice(0,40), 'info');
    }

    if(newCount>0){
      localStorage.setItem('_notifs', JSON.stringify(_notifications.slice(-100)));
      sessionStorage.setItem('_seenIds', JSON.stringify([..._seenIds].slice(-500)));
      updateBellBadge();
      renderNotifList();
      updateRepliesKpi();
      if(_replyQueue.length > 0) openReplyDrawer(_replyQueue[0]);
    } else if(manual){
      toast('📭 Yangi javob xati topilmadi', 'info');
    }
    setLastCheck();

  } catch(e){
    console.error('Gmail poll error:', e);
    if(manual) toast('❌ Xato: '+(e.message||'Tekshirib bo\'lmadi'), 'error');
  }
}

/* ── Force recheck (clears seenIds for fresh scan) ── */
function forceRecheckGmail(){
  _seenIds.clear();
  sessionStorage.removeItem('_seenIds');
  toast('🔄 Qayta tekshirilmoqda...', 'info');
  checkGmailReplies(true);
}

function formatNotifTime(ds){
  if(!ds) return '';
  const d=new Date(ds), now=new Date(), dm=Math.round((now-d)/60000);
  if(dm<1) return 'Hozirgina';
  if(dm<60) return dm+"d oldin";
  const dh=Math.round(dm/60);
  if(dh<24) return dh+"s oldin";
  return d.toLocaleDateString('uz',{day:'2-digit',month:'short'});
}

function setLastCheck(){
  const el=document.getElementById('notifLastCheck');
  if(el) el.textContent='Son. tekshirildi: '+new Date().toLocaleTimeString('uz',{hour:'2-digit',minute:'2-digit'});
}

/* ── Replies Modal ───────────── */
function updateRepliesKpi(){
  const n = _notifications.length;
  const unread = _notifications.filter(x=>x.unread).length;
  const el = document.getElementById('ic-k5');
  const badge = document.getElementById('ic-k5-new');
  if(el) el.textContent = n;
  if(badge) badge.style.display = unread > 0 ? 'block' : 'none';
}

function openRepliesModal(){
  const list = document.getElementById('repliesModalList');
  const countEl = document.getElementById('repliesModalCount');
  if(!_notifications.length){
    list.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text3)">
      <div style="font-size:2rem;margin-bottom:.5rem">📭</div>
      <div style="font-size:.8rem">Hali email javob kelmagan</div>
      <div style="font-size:.68rem;margin-top:.3rem">Gmail ulanganda javoblar shu yerda ko'rinadi</div>
    </div>`;
    if(countEl) countEl.textContent = '0 ta javob';
  } else {
    if(countEl) countEl.textContent = `${_notifications.length} ta javob`;
    const sorted = _notifications.slice().sort((a,b)=>{
      const da = a.dateRaw ? new Date(a.dateRaw).getTime() : (a.ts||0);
      const db2 = b.dateRaw ? new Date(b.dateRaw).getTime() : (b.ts||0);
      return db2 - da;
    });
    list.innerHTML = sorted.map((n,i)=>{
      const company = n.companyName
        ? `<span style="font-size:.6rem;font-weight:700;background:rgba(67,97,238,.1);color:#4361EE;padding:2px 8px;border-radius:20px;margin-left:6px">🏢 ${escHtml(n.companyName)}</span>`
        : '';
      const unreadDot = n.unread
        ? `<span style="width:8px;height:8px;border-radius:50%;background:#EF233C;display:inline-block;margin-left:4px;flex-shrink:0"></span>`
        : '';
      return `
      <div onclick="openReplyById('${n.id}')"
        style="padding:1rem 1.4rem;border-bottom:1px solid var(--border);cursor:pointer;
               display:flex;gap:.9rem;align-items:flex-start;
               background:${n.unread?'rgba(67,97,238,.03)':'transparent'};
               transition:background .15s"
        onmouseover="this.style.background='rgba(67,97,238,.07)'"
        onmouseout="this.style.background='${n.unread?'rgba(67,97,238,.03)':'transparent'}'">
        <!-- Avatar -->
        <div style="width:40px;height:40px;border-radius:12px;flex-shrink:0;
          background:linear-gradient(135deg,#4361EE,#7209B7);
          display:flex;align-items:center;justify-content:center;
          font-size:1rem;font-weight:800;color:#fff">
          ${(n.companyName||n.fromShort||'?')[0].toUpperCase()}
        </div>
        <!-- Info -->
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:.3rem;flex-wrap:wrap;margin-bottom:3px">
            <span style="font-size:.78rem;font-weight:700;color:var(--text)">${escHtml(n.companyName||n.fromShort)}</span>
            ${company}
            ${unreadDot}
          </div>
          <div style="font-size:.72rem;color:#4361EE;margin-bottom:3px">${escHtml(n.fromEmail)}</div>
          <div style="font-size:.7rem;font-weight:600;color:var(--text);margin-bottom:3px">${escHtml(n.subject)}</div>
          <div style="font-size:.65rem;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml((n.snippet||'').slice(0,100))}…</div>
        </div>
        <!-- Time & arrow -->
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem;flex-shrink:0">
          <span style="font-size:.6rem;color:var(--text2)">${n.time}</span>
          <span style="font-size:.8rem;color:var(--text3)">›</span>
        </div>
      </div>`;
    }).join('');
  }
  // Mark all as read in KPI
  _unreadCount = 0;
  updateBellBadge();
  updateRepliesKpi();
  document.getElementById('repliesModal').classList.add('open');
}

function closeRepliesModal(){
  document.getElementById('repliesModal').classList.remove('open');
}

function openReplyFromModal(idx){
  closeRepliesModal();
  const n = _notifications[idx];
  if(n){ setTimeout(()=>openReplyDrawer(n), 200); }
}
function openReplyById(id){
  closeRepliesModal();
  const n = _notifications.find(x=>x.id===id);
  if(n){ setTimeout(()=>openReplyDrawer(n), 200); }
}
let _replyQueue    = [];
let _currentReply  = null;

function extractEmailBody(payload){
  if(!payload) return '';
  // Try parts recursively
  const tryPart = (part)=>{
    if(!part) return '';
    if(part.mimeType==='text/plain' && part.body?.data){
      return atob(part.body.data.replace(/-/g,'+').replace(/_/g,'/'));
    }
    if(part.parts){ for(const p of part.parts){ const r=tryPart(p); if(r) return r; } }
    return '';
  };
  const plain = tryPart(payload);
  if(plain) return plain;
  // Fallback: body.data at top level
  if(payload.body?.data) return atob(payload.body.data.replace(/-/g,'+').replace(/_/g,'/'));
  return '';
}

function openReplyDrawer(notif){
  _currentReply = notif;
  // Mark as read
  notif.unread = false;
  localStorage.setItem('_notifs', JSON.stringify(_notifications.slice(-50)));
  _unreadCount = _notifications.filter(n=>n.unread).length;
  updateBellBadge();
  renderNotifList();

  // Fill drawer
  const initials = (notif.companyName||notif.fromShort||'?')[0].toUpperCase();
  document.getElementById('rdAvatar').textContent     = initials;
  document.getElementById('rdCompany').textContent    = notif.companyName || notif.fromShort;
  document.getElementById('rdEmail').textContent      = notif.fromEmail;
  document.getElementById('rdTime').textContent       = notif.time;
  document.getElementById('rdSubject').textContent    = notif.subject;

  // Company tag
  const tag = document.getElementById('rdCompanyTag');
  if(notif.companyName){
    tag.style.display = 'inline-flex';
    tag.textContent = '🏢 ' + notif.companyName;
  } else {
    tag.style.display = 'none';
  }

  // Body
  const bodyEl   = document.getElementById('rdBody');
  const loadEl   = document.getElementById('rdBodyLoading');
  const bodyText = notif.body || notif.snippet || '';

  if(bodyText){
    // Clean up quoted reply lines (lines starting with >)
    const cleaned = bodyText
      .split('\n')
      .filter(l => !l.trim().startsWith('>') && !l.trim().startsWith('On ') )
      .join('\n')
      .replace(/\r/g,'')
      .trim();
    bodyEl.textContent = cleaned || bodyText.trim();
    bodyEl.style.display = 'block';
    loadEl.style.display = 'none';
  } else {
    bodyEl.style.display = 'none';
    loadEl.textContent = '(Xat matni mavjud emas)';
    loadEl.style.display = 'block';
  }

  // Queue badge
  const remaining = _replyQueue.filter(r=>r.id !== notif.id).length;
  const qDot = document.getElementById('replyQueueDot');
  if(remaining > 0){ qDot.classList.add('visible'); qDot.textContent=remaining; }
  else { qDot.classList.remove('visible'); }

  // Open
  document.getElementById('replyOverlay').classList.add('open');
  document.getElementById('replyDrawer').classList.add('open');
}

function closeReplyDrawer(){
  document.getElementById('replyDrawer').classList.remove('open');
  document.getElementById('replyOverlay').classList.remove('open');
  // Remove shown reply from queue
  if(_currentReply) _replyQueue = _replyQueue.filter(r=>r.id!==_currentReply.id);
  _currentReply = null;
}

function showNextReply(){
  closeReplyDrawer();
  if(_replyQueue.length > 0){
    setTimeout(()=>openReplyDrawer(_replyQueue[0]), 350);
  }
}

function replyToSender(){
  if(!_currentReply) return;
  // Open single email modal pre-filled
  const co = DB.investorCompanies.find(r=>r.email&&r.email.toLowerCase()===_currentReply.fromEmail.toLowerCase());
  if(co){
    closeReplyDrawer();
    openEmailModal(co.id);
  } else {
    // Generic mailto fallback
    window.open(`mailto:${_currentReply.fromEmail}?subject=Re: ${encodeURIComponent(_currentReply.subject)}`);
  }
}

// Also allow opening drawer from notification list
function openNotifAsDrawer(idx){
  const reversed = _notifications.slice().reverse();
  const n = reversed[idx];
  if(n){
    document.getElementById('notifPanel').classList.remove('open');
    openReplyDrawer(n);
  }
}

window.addEventListener('load', ()=>{
  if(Notification.permission==='default') Notification.requestPermission();

  // Gmail tokenni localStorage dan tiklash (popup yo'q)
  const savedToken  = localStorage.getItem('_gmailToken');
  const savedExp    = parseInt(localStorage.getItem('_gmailTokenExp')||'0');
  const savedEmail2 = localStorage.getItem('_gmailUserEmail');
  if(savedToken && savedExp > Date.now() + 60000){
    // Token hali muddatda — qayta ulamasdan tiklash
    _gmailToken     = savedToken;
    _gmailConnected = true;
    _gmailUser      = savedEmail2 || '';
    const statusEl = document.getElementById('gmailStatus');
    if(statusEl) statusEl.textContent = _gmailUser || 'Ulangan';
    const btn = document.getElementById('gmailConnectBtn');
    if(btn){ btn.textContent = '✅ Ulangan'; btn.classList.add('connected'); }
    if(typeof renderPipeline==='function') renderPipeline();
    startPolling();
  } else if(savedEmail2){
    // Token muddati o'tgan — emailni ko'rsatib, qayta ulash taklifi
    const statusEl = document.getElementById('gmailStatus');
    if(statusEl) statusEl.textContent = savedEmail2 + ' (qayta ulang)';
    localStorage.removeItem('_gmailToken');
    if(typeof renderPipeline==='function') renderPipeline();
  }

  _unreadCount = _notifications.filter(n=>n.unread).length;
  updateBellBadge();
  renderNotifList();
  setTimeout(updateRepliesKpi, 100);
  const savedSecs = parseInt(localStorage.getItem('_pollSecs')||'60');
  const sel = document.getElementById('pollIntervalSelect');
  if(sel) sel.value = String(savedSecs);
});
