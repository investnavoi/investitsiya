/* ═══════════════════════════════════════
   EMAIL MODAL
═══════════════════════════════════════ */
function openEmailModal(id){
  if(!isAdmin){toast('⚠️ Email yuborish uchun admin sifatida kiring!','error');openAdminOrLogin();return;}
  const co=DB.investorCompanies.find(r=>String(r.id)===String(id));
  if(!co||!co.email){toast('Email manzil topilmadi','error');return;}
  var hasAi = co.aiLetterData && co.aiLetterData.body;
  if(!hasAi){ toast('⚠️ Avval AI xat tayyorlang (🤖 tugma)','error'); return; }
  emailTarget=co;
  var nameEl = document.getElementById('emailModalSub');
  if(nameEl) nameEl.innerHTML = '<div onclick="toggleEmailAiPreview()" style="cursor:pointer" title="AI xatni ko\'rish/yashirish">'+escHtml(co.kompaniya||'')+' <span style="color:#7C3AED;font-weight:700;font-size:.7rem;margin-left:6px">🤖 AI xat tayyor ▾</span></div>'+
    '<div id="emailAiPreview" style="margin-top:10px;padding:12px;background:#F9FAFB;border:1px solid var(--border);border-radius:10px">'+
      '<div style="font-size:.65rem;color:#6B7280;margin-bottom:4px;font-weight:700">SUBJECT</div>'+
      '<input id="emailAiSubject" type="text" value="'+tgEscapeAttr(co.aiLetterData.subject||'')+'" oninput="syncEmailAiEdit(\''+co.id+'\')" style="width:100%;padding:8px 10px;font-size:.78rem;font-weight:600;border:1px solid var(--border);border-radius:6px;background:#fff;margin-bottom:10px">'+
      '<div style="font-size:.65rem;color:#6B7280;margin-bottom:4px;font-weight:700">XAT MATNI</div>'+
      '<textarea id="emailAiBody" oninput="syncEmailAiEdit(\''+co.id+'\')" style="width:100%;min-height:240px;max-height:400px;padding:10px;font-size:.74rem;line-height:1.6;color:#1F2937;background:#fff;border:1px solid var(--border);border-radius:6px;font-family:inherit;resize:vertical">'+escHtml(co.aiLetterData.body||'')+'</textarea>'+
      '<div style="font-size:.6rem;color:#059669;margin-top:4px">💾 O\'zgarishlar avtomatik saqlanadi</div>'+
    '</div>';
  document.getElementById('emailRcpt').innerHTML=`${escHtml(co.rahbar||'')} &lt;${escHtml(co.email||'')}&gt;`
    + (co.emailSent ? `<span class="email-sent-badge" style="margin-left:8px">✅ ${co.emailSentDate||''} da yuborilgan</span>` : '');
  var msgEl = document.getElementById('emailMsg');
  if(msgEl){
    msgEl.value = co.aiLetterData.body || '';
    msgEl.style.display = 'none';
  }
  document.getElementById('sendBtn').disabled=false;
  document.getElementById('sendBtn').textContent= co.emailSent ? 'AI XATNI QAYTA YUBORISH 📧' : 'AI XATNI YUBORISH 📧';
  document.getElementById('emailModal').classList.add('open');
}
function toggleEmailAiPreview(){
  var el = document.getElementById('emailAiPreview');
  if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
window.toggleEmailAiPreview = toggleEmailAiPreview;

var _emailAiSaveTimer = null;
function syncEmailAiEdit(id){
  var co = (DB.investorCompanies||[]).find(function(r){return String(r.id)===String(id);});
  if(!co) return;
  var subj = (document.getElementById('emailAiSubject')||{}).value || '';
  var body = (document.getElementById('emailAiBody')||{}).value || '';
  if(!co.aiLetterData) co.aiLetterData = {};
  co.aiLetterData.subject = subj;
  co.aiLetterData.body = body;
  var msgEl = document.getElementById('emailMsg');
  if(msgEl) msgEl.value = body;
  if(_emailAiSaveTimer) clearTimeout(_emailAiSaveTimer);
  _emailAiSaveTimer = setTimeout(function(){
    if(typeof fbSave==='function') fbSave('investorCompanies', co);
  }, 800);
}
window.syncEmailAiEdit = syncEmailAiEdit;

function timeMask(el){
  let v = el.value.replace(/\D/g,'');
  if(v.length>2) v = v.slice(0,2)+':'+v.slice(2);
  // soat 0-23, daqiqa 0-59
  if(v.length>=2){
    let h = parseInt(v.slice(0,2));
    if(h>23) v = '23'+v.slice(2);
  }
  if(v.length===5){
    let m = parseInt(v.slice(3,5));
    if(m>59) v = v.slice(0,3)+'59';
  }
  el.value = v.slice(0,5);
}

function getNextSlot(){
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  if(m < 30){
    return `${String(h).padStart(2,'0')}:30`;
  } else {
    const nextH = (h + 1) % 24;
    return `${String(nextH).padStart(2,'0')}:00`;
  }
}

function openBulkScheduleModal(){
  const ids = getSelectedIds();
  const all = DB.investorCompanies||[];
  const targets = ids.length
    ? ids.map(id=>all.find(r=>String(r.id)===String(id))).filter(r=>r&&r.email)
    : all.filter(r=>r.email);

  if(!targets.length){ toast('⚠️ Email manzili bo\'lgan kompaniya yo\'q','error'); return; }

  const withAi = targets.filter(r => r.aiLetterData && r.aiLetterData.body);
  const allHaveAi = withAi.length === targets.length;
  window._bulkSchedAllHaveAi = allHaveAi;

  document.getElementById('bulkSchedInfo').innerHTML =
    `<b>${targets.length} ta kompaniya</b> uchun rejalashtiriladi` +
    (allHaveAi ? ' <span style="color:#7C3AED;font-weight:700">🤖 AI tayyorlagan xatlar</span>' : ` (${withAi.length} AI, ${targets.length-withAi.length} qo'lda)`) +
    `:<br><span style="font-size:.7rem;color:var(--text3)">${targets.map(r=>r.kompaniya).join(', ')}</span>`;

  document.querySelectorAll('input[name="bSchedType"]').forEach(r=>r.checked=r.value==='once');
  onBSchedTypeChange();
  document.getElementById('bSchedDate').value    = '';
  document.getElementById('bSchedTime').value    = getNextSlot();
  document.getElementById('bSchedSubject').value = '';
  document.getElementById('bSchedMessage').value = '';

  const subjGroup = document.getElementById('bSchedSubject').closest('.form-group');
  const msgGroup = document.getElementById('bSchedMessage').closest('.form-group');
  if(allHaveAi){
    if(subjGroup) subjGroup.style.display = 'none';
    if(msgGroup) msgGroup.style.display = 'none';
  } else {
    if(subjGroup) subjGroup.style.display = '';
    if(msgGroup) msgGroup.style.display = '';
  }

  document.getElementById('bulkScheduleModal').classList.add('open');
}

function closeBulkScheduleModal(){
  document.getElementById('bulkScheduleModal').classList.remove('open');
}

function onBSchedTypeChange(){
  const type = document.querySelector('input[name="bSchedType"]:checked')?.value||'once';
  document.getElementById('bSchedOnceRow').style.display    = type==='once'    ?'block':'none';
  document.getElementById('bSchedMonthlyRow').style.display = type==='monthly' ?'block':'none';
  document.getElementById('bSchedWeeklyRow').style.display  = type==='weekly'  ?'block':'none';
}

function saveBulkSchedule(){
  const type    = document.querySelector('input[name="bSchedType"]:checked')?.value||'once';
  const subject = document.getElementById('bSchedSubject').value.trim();
  const message = document.getElementById('bSchedMessage').value.trim();
  const time    = document.getElementById('bSchedTime').value||'09:00';
  const allHaveAi = !!window._bulkSchedAllHaveAi;

  if(!allHaveAi && (!subject||!message)){ toast('⚠️ Mavzu va xat matnini kiriting','error'); return; }
  if(type==='once'&&!document.getElementById('bSchedDate').value){ toast('⚠️ Sana kiriting','error'); return; }

  const ids = getSelectedIds();
  const all = DB.investorCompanies||[];
  const targets = ids.length
    ? ids.map(id=>all.find(r=>String(r.id)===String(id))).filter(r=>r&&r.email)
    : all.filter(r=>r.email);

  const base = {
    type, active: true, time,
    date:    type==='once'    ? dateToISO(document.getElementById('bSchedDate').value) : '',
    day:     type==='monthly' ? parseInt(document.getElementById('bSchedDay').value) : null,
    weekday: type==='weekly'  ? parseInt(document.getElementById('bSchedWeekday').value) : null,
  };

  targets.forEach(co=>{
    const hasAi = co.aiLetterData && co.aiLetterData.body;
    co.emailSchedule = Object.assign({}, base, {
      subject: hasAi ? (co.aiLetterData.subject || subject || 'Investitsiya taklifi') : subject,
      message: hasAi ? co.aiLetterData.body : message,
      source: hasAi ? 'ai' : 'manual'
    });
    if(typeof fbSave==='function') fbSave('investorCompanies', co);
  });

  renderInvestorCompanies();
  closeBulkScheduleModal();
  toast(`✅ ${targets.length} ta kompaniyaga email rejasi saqlandi!`);
}

function openBulkScheduleModal_all(){
  // Barchasini tanlash
  document.querySelectorAll('.ic-check').forEach(c=>c.checked=true);
  updateSelectedCount();
  openBulkScheduleModal();
}

/* ═══════════════════════════════════════
   EMAIL SCHEDULE MODAL
═══════════════════════════════════════ */
var _schedTargetId = null;

function openScheduleModal(id){
  _schedTargetId = id;
  var co = (DB.investorCompanies||[]).find(function(r){return String(r.id)===String(id);});
  if(!co){ toast('⚠️ Kompaniya topilmadi','error'); return; }
  if(!co.email){ toast('⚠️ Kompaniyada email yo\'q','error'); return; }
  var hasAi = co.aiLetterData && co.aiLetterData.body;
  if(!hasAi){ toast('⚠️ Avval AI xat tayyorlang (🤖 tugma)','error'); return; }

  var modal = document.getElementById('scheduleModal');
  if(!modal){ toast('⚠️ Modal topilmadi','error'); return; }

  try{
    var nameEl = document.getElementById('scheduleCompanyName');
    if(nameEl){
      nameEl.innerHTML =
        '<div onclick="toggleSchedAiPreview()" style="cursor:pointer" title="AI xatni ko\'rish/yashirish">'+
          '<b>' + escHtml(co.kompaniya||'') + '</b> · ' + escHtml(co.email||'') +
          ' <span style="color:#7C3AED;font-weight:700;font-size:.7rem;margin-left:8px">🤖 AI xat tayyor ▾</span>'+
        '</div>'+
        '<div id="schedAiPreview" style="margin-top:10px;padding:12px;background:#fff;border:1px solid var(--border);border-radius:10px">'+
          '<div style="font-size:.65rem;color:#6B7280;margin-bottom:4px;font-weight:700">SUBJECT</div>'+
          '<input id="schedAiSubject" type="text" value="'+tgEscapeAttr(co.aiLetterData.subject||'')+'" oninput="syncSchedAiEdit(\''+co.id+'\')" style="width:100%;padding:8px 10px;font-size:.78rem;font-weight:600;border:1px solid var(--border);border-radius:6px;background:#F9FAFB;margin-bottom:10px">'+
          '<div style="font-size:.65rem;color:#6B7280;margin-bottom:4px;font-weight:700">XAT MATNI</div>'+
          '<textarea id="schedAiBody" oninput="syncSchedAiEdit(\''+co.id+'\')" style="width:100%;min-height:220px;max-height:400px;padding:10px;font-size:.74rem;line-height:1.6;color:#1F2937;background:#F9FAFB;border:1px solid var(--border);border-radius:6px;font-family:inherit;resize:vertical">'+escHtml(co.aiLetterData.body||'')+'</textarea>'+
          '<div style="font-size:.6rem;color:#059669;margin-top:4px">💾 O\'zgarishlar avtomatik saqlanadi</div>'+
        '</div>';
    }

    var s = co.emailSchedule || {};
    var type = s.type || 'once';

    document.querySelectorAll('input[name="schedType"]').forEach(function(r){ r.checked = r.value === type; });
    onSchedTypeChange();

    var dateEl = document.getElementById('schedDate');
    if(dateEl) dateEl.value = dateToDisplay(s.date || '');

    var schedDayEl = document.getElementById('schedDay');
    if(schedDayEl){
      if(!schedDayEl.options.length){ for(var d=1;d<=28;d++){var o=document.createElement('option');o.value=d;o.textContent=d;schedDayEl.appendChild(o);} }
      schedDayEl.value = s.day || '1';
    }
    var wdEl = document.getElementById('schedWeekday');
    if(wdEl) wdEl.value = s.weekday || '1';

    var timeEl = document.getElementById('schedTime');
    if(timeEl) timeEl.value = s.time || getNextSlot();

    var subjEl = document.getElementById('schedSubject');
    if(subjEl){
      subjEl.value = co.aiLetterData.subject || '';
      var subjGroup = subjEl.closest('.form-group');
      if(subjGroup) subjGroup.style.display = 'none';
    }

    var msgEl = document.getElementById('schedMessage');
    if(msgEl){
      msgEl.value = co.aiLetterData.body || '';
      var msgGroup = msgEl.closest('.form-group');
      if(msgGroup) msgGroup.style.display = 'none';
    }

    var actEl = document.getElementById('schedActive');
    if(actEl) actEl.checked = s.active !== false;

    var disBtn = document.getElementById('schedDisableBtn');
    if(disBtn) disBtn.style.display = s.active ? 'inline-flex' : 'none';
  }catch(e){ console.warn('openScheduleModal fill error:', e); }

  modal.classList.add('open');
  modal.style.display = 'flex';
}

function closeScheduleModal(){
  var m = document.getElementById('scheduleModal');
  if(m){ m.classList.remove('open'); m.style.display = 'none'; }
  _schedTargetId = null;
}

function toggleSchedAiPreview(){
  var el = document.getElementById('schedAiPreview');
  if(!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}
window.toggleSchedAiPreview = toggleSchedAiPreview;

var _schedAiSaveTimer = null;
function syncSchedAiEdit(id){
  var co = (DB.investorCompanies||[]).find(function(r){return String(r.id)===String(id);});
  if(!co) return;
  var subj = (document.getElementById('schedAiSubject')||{}).value || '';
  var body = (document.getElementById('schedAiBody')||{}).value || '';
  if(!co.aiLetterData) co.aiLetterData = {};
  co.aiLetterData.subject = subj;
  co.aiLetterData.body = body;
  var subjEl = document.getElementById('schedSubject');
  var msgEl = document.getElementById('schedMessage');
  if(subjEl) subjEl.value = subj;
  if(msgEl) msgEl.value = body;
  if(_schedAiSaveTimer) clearTimeout(_schedAiSaveTimer);
  _schedAiSaveTimer = setTimeout(function(){
    if(typeof fbSave==='function') fbSave('investorCompanies', co);
  }, 800);
}
window.syncSchedAiEdit = syncSchedAiEdit;

function onSchedTypeChange(){
  const type = document.querySelector('input[name="schedType"]:checked')?.value || 'once';
  document.getElementById('schedOnceRow').style.display    = type==='once'    ? 'block' : 'none';
  document.getElementById('schedMonthlyRow').style.display = type==='monthly' ? 'block' : 'none';
  document.getElementById('schedWeeklyRow').style.display  = type==='weekly'  ? 'block' : 'none';
}

function saveSchedule(){
  const co = (DB.investorCompanies||[]).find(r=>String(r.id)===String(_schedTargetId));
  if(!co) return;

  const type    = document.querySelector('input[name="schedType"]:checked')?.value || 'once';
  const subject = document.getElementById('schedSubject').value.trim();
  const message = document.getElementById('schedMessage').value.trim();

  if(!subject||!message){ toast('⚠️ Mavzu va xat matnini kiriting','error'); return; }

  if(type==='once' && !document.getElementById('schedDate').value){
    toast('⚠️ Sana kiriting','error'); return;
  }

  co.emailSchedule = {
    type,
    active:  document.getElementById('schedActive').checked,
    subject,
    message,
    time:    document.getElementById('schedTime').value || '09:00',
    date:    type==='once'    ? dateToISO(document.getElementById('schedDate').value) : '',
    day:     type==='monthly' ? parseInt(document.getElementById('schedDay').value) : null,
    weekday: type==='weekly'  ? parseInt(document.getElementById('schedWeekday').value) : null,
  };

  if(typeof fbSave==='function') fbSave('investorCompanies', co);
  renderInvestorCompanies();
  closeScheduleModal();
  toast('✅ Email rejasi saqlandi!');
}

function disableSchedule(){
  const co = (DB.investorCompanies||[]).find(r=>String(r.id)===String(_schedTargetId));
  if(!co||!co.emailSchedule) return;
  co.emailSchedule.active = false;
  if(typeof fbSave==='function') fbSave('investorCompanies', co);
  renderInvestorCompanies();
  closeScheduleModal();
  toast('🚫 Rejalashtirilgan email o\'chirildi');
}

var _emailAttachment = null;

function closeEmailModal(){
  clearEmailFile();
  document.getElementById('emailModal').classList.remove('open');
  emailTarget=null;
  const linkEl=document.getElementById('emailFileLink');
  if(linkEl) linkEl.value='';
  const btn=document.getElementById('sendBtn');
  if(btn){btn.disabled=false;btn.textContent='YUBORISH 📧';}
}
/* ── Email File Attachment ──── */
var _emailAttachment = null; // { name, size, type, base64 }

function handleEmailFile(file){
  if(!file) return;
  const warnEl = document.getElementById('emailFileSizeWarn');
  const previewEl = document.getElementById('emailFilePreview');
  const labelEl = document.getElementById('emailAttachLabel');

  if(file.size > 5 * 1024 * 1024){
    warnEl.style.display = 'block';
    previewEl.style.display = 'none';
    _emailAttachment = null;
    return;
  }
  warnEl.style.display = 'none';

  const icons = { pdf:'📕', doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', png:'🖼', jpg:'🖼', jpeg:'🖼', zip:'🗜' };
  const ext = file.name.split('.').pop().toLowerCase();
  const icon = icons[ext] || '📄';
  const sizeStr = file.size > 1024*1024 ? (file.size/1024/1024).toFixed(1)+' MB' : Math.round(file.size/1024)+' KB';

  document.getElementById('emailFileIcon').textContent = icon;
  document.getElementById('emailFileName').textContent = file.name;
  document.getElementById('emailFileSize').textContent = sizeStr;
  previewEl.style.display = 'flex';
  labelEl.style.display = 'none';

  // Read as base64
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result.split(',')[1];
    _emailAttachment = { name: file.name, size: file.size, type: file.type, base64, ext };
  };
  reader.readAsDataURL(file);
}

function removeEmailFile(){
  _emailAttachment = null;
  document.getElementById('emailFilePreview').style.display = 'none';
  document.getElementById('emailAttachLabel').style.display = 'block';
  document.getElementById('emailFileSizeWarn').style.display = 'none';
  document.getElementById('emailFileInput').value = '';
}

async function sendEmail(){
  if(!emailTarget) return;
  const msg = document.getElementById('emailMsg').value.trim();
  if(!msg){ toast('⚠️ Iltimos, xabar yozing!','error'); return; }
  const btn = document.getElementById('sendBtn');
  btn.disabled = true; btn.textContent = 'YUBORILMOQDA...';
  try{
    await sendViaEmailJS(msg);
  } catch(err){
    console.error(err);
    toast('❌ Xatolik: Email yuborilmadi','error');
    btn.disabled = false; btn.textContent = 'YUBORISH 📧';
  }
}

var _emailAttachment = null;

function onEmailFileSelect(input){
  const file = input.files[0];
  if(!file) return;
  if(file.size > 5 * 1024 * 1024){ toast('⚠️ Fayl 5MB dan kichik bo\'lishi kerak','error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    _emailAttachment = { data: e.target.result, filename: file.name, contentType: file.type };
    const info = document.getElementById('emailFileInfo');
    document.getElementById('emailFileName').textContent = '📎 ' + file.name + ' (' + (file.size/1024).toFixed(1) + ' KB)';
    info.style.display = 'flex';
    document.getElementById('emailAttachArea').style.borderColor = '#4361EE';
    document.getElementById('emailAttachArea').style.color = '#4361EE';
    document.getElementById('emailAttachArea').textContent = '✅ ' + file.name;
  };
  reader.readAsDataURL(file);
}

function clearEmailFile(){
  _emailAttachment = null;
  document.getElementById('emailFileInput').value = '';
  document.getElementById('emailFileInfo').style.display = 'none';
  document.getElementById('emailAttachArea').style.borderColor = '';
  document.getElementById('emailAttachArea').style.color = '';
  document.getElementById('emailAttachArea').textContent = '📂 Fayl tanlash uchun bosing';
}

async function sendViaEmailJS(fullMsg){
  emailjs.init('tPxgtKC4xvZkjqpd7');
  const mailboxEmail = getPrimaryMailboxEmail();
  const result=await emailjs.send('service_1w08xxe','template_c1nxcvg',{
    to_email:  emailTarget.email,
    to_name:   emailTarget.rahbar,
    company_name: emailTarget.kompaniya,
    message:   fullMsg,
    reply_to:  mailboxEmail || '',
    from_name: 'Navoiy Investitsiya Bo\'limi',
  });
  if(result.status===200){
    const rec=DB.investorCompanies.find(r=>r.id===emailTarget.id);
    if(rec){
      rec.emailSent=true;
      rec.emailSentDate=new Date().toISOString().split('T')[0];
      rec.sentByMailbox = mailboxEmail || '';
      if(typeof fbSave==='function') fbSave('investorCompanies',rec);
    }
    recordMailboxActivity(mailboxEmail, 'cold', 1);
    renderInvestorCompanies();
    if(typeof renderPipeline==='function') renderPipeline();
    toast('✅ Xabar yuborildi (EmailJS)!');
    closeEmailModal();
  }
}

