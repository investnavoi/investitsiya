/* ═══════════════════════════════════════
   UTILS
═══════════════════════════════════════ */
function escapeHtmlText(text){
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(s){
  if(!s) return '—';
  // YYYY-MM-DD → DD.MM.YYYY
  const p = s.split('-');
  if(p.length===3 && p[0].length===4) return `${p[2]}.${p[1]}.${p[0]}`;
  // already DD.MM.YYYY
  return s;
}

// dd.mm.yyyy mask
function dateMask(el){
  let v = el.value.replace(/\D/g,'');
  if(v.length>2) v = v.slice(0,2)+'.'+v.slice(2);
  if(v.length>5) v = v.slice(0,5)+'.'+v.slice(5);
  el.value = v.slice(0,10);
}

// dd.mm.yyyy → YYYY-MM-DD (for Firebase/sorting)
function dateToISO(s){
  if(!s) return '';
  if(s.includes('-')) return s; // already ISO
  const p = s.split('.');
  if(p.length===3) return `${p[2]}-${p[1]}-${p[0]}`;
  return s;
}

// YYYY-MM-DD → dd.mm.yyyy (for display in inputs)
function dateToDisplay(s){
  if(!s) return '';
  if(s.includes('-')){const p=s.split('-');return`${p[2]}.${p[1]}.${p[0]}`;}
  return s;
}
function fmtMoney(v){const n=parseFloat(v)||0;if(n>=1e6)return`$${(n/1e6).toFixed(1)}M`;if(n>=1000)return`$${(n/1000).toFixed(0)}K`;return`$${n}`;}
function nextId(arr){
  const nums = (arr||[]).map(r=>Number(r&&r.id)).filter(n=>Number.isFinite(n));
  return nums.length ? Math.max(...nums)+1 : 1;
}
function getInitials(name=''){return(name.split(' ').slice(0,2).map(w=>w[0]||'').join('').toUpperCase())||'??';}
function v(id){const el=document.getElementById(id);return el?el.value.trim():'';}

function makomBadge(m){
  if(!m)return`<span class="badge bdg-gray">—</span>`;
  const ml = m.toLowerCase().replace(/[''`]/g,"'");
  if(ml.includes('kelishilgan'))return`<span class="badge bdg-green">${m}</span>`;
  if(ml.includes("ko'rib")||ml.includes('korib'))return`<span class="badge bdg-amber">${m}</span>`;
  if(ml.includes('yangi'))return`<span class="badge bdg-blue">${m}</span>`;
  return`<span class="badge bdg-gray">${m}</span>`;
}
function holatBadge(h){
  if(!h)return`<span class="badge bdg-gray">—</span>`;
  if(h==='Tayyor')return`<span class="badge bdg-green">Tayyor</span>`;
  if(h==='Muzokarada')return`<span class="badge bdg-amber">Muzokarada</span>`;
  if(h==='Yangi')return`<span class="badge bdg-blue">Yangi</span>`;
  return`<span class="badge bdg-gray">${h}</span>`;
}
function natijaHolatBadge(n){
  if(!n)return`<span class="badge bdg-gray">—</span>`;
  if(n==='Ijobiy')return`<span class="badge bdg-green">Ijobiy</span>`;
  if(n==='Davom etmoqda')return`<span class="badge bdg-amber">Davom etmoqda</span>`;
  if(n==='Salbiy')return`<span class="badge bdg-red">Salbiy</span>`;
  if(n==='Kutilmoqda')return`<span class="badge bdg-purple">Kutilmoqda</span>`;
  return`<span class="badge bdg-gray">${n}</span>`;
}

/* ═══════════════════════════════════════
   TOAST
═══════════════════════════════════════ */
function toast(msg,type='success'){
  var w=document.getElementById('navNotifWrap');
  if(!w || !document.body.contains(w)){
    var old = document.getElementById('toastWrap'); if(old) old.remove();
    w = document.createElement('div');
    w.id = 'navNotifWrap';
    w.style.cssText = 'position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;display:flex!important;flex-direction:column-reverse!important;gap:8px!important;pointer-events:none!important;max-width:400px!important;';
    (document.body || document.documentElement).appendChild(w);
  }
  var colors = {success:'linear-gradient(135deg,#059669,#06D6A0)', error:'linear-gradient(135deg,#dc2626,#EF233C)', info:'linear-gradient(135deg,#4361EE,#4895ef)', loading:'linear-gradient(135deg,#334155,#475569)'};
  var d=document.createElement('div');
  d.innerHTML=msg;
  d.style.cssText = 'padding:12px 18px!important;border-radius:10px!important;font-size:13px!important;font-weight:600!important;color:#fff!important;box-shadow:0 8px 30px rgba(0,0,0,.4)!important;max-width:380px!important;pointer-events:auto!important;background:'+(colors[type]||colors.success)+'!important;animation:navNotifIn .25s ease!important;';
  w.appendChild(d);
  var duration = type === 'loading' ? 15000 : 4000;
  d._toastTimer = setTimeout(function(){ if(d.parentNode) d.parentNode.removeChild(d); }, duration);
  return d;
}
if(!document.getElementById('navNotifKeyframes')){
  var _kf = document.createElement('style');
  _kf.id = 'navNotifKeyframes';
  _kf.textContent = '@keyframes navNotifIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(_kf);
}
function toastLoading(msg){
  return toast(msg, 'loading');
}
function toastDone(loadingToast, msg, type){
  if(loadingToast && loadingToast.parentNode){
    clearTimeout(loadingToast._toastTimer);
    loadingToast.remove();
  }
  return toast(msg, type || 'success');
}


function escHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* Format large numbers into human-readable ($127M, €5.2M) */
function formatRevenue(val){
  if(val === null || val === undefined || val === '') return '—';
  var s = String(val).trim();
  if(!s || s === '—' || s === '-') return '—';
  // Already formatted with letter (M/K/B) or currency text — pass through
  if(/[MKBmkb]\b|million|thousand|billion/i.test(s)) return s;
  var raw = s.replace(/[^\d.\-]/g,'');
  var n = parseFloat(raw);
  if(!isFinite(n) || n === 0) return s;
  var curMatch = s.match(/[\$€£¥₽]|USD|EUR|GBP|UZS|RUB/i);
  var cur = curMatch ? curMatch[0] : '$';
  var abs = Math.abs(n);
  var out;
  if(abs >= 1e9) out = (n/1e9).toFixed(n >= 10e9 ? 0 : 1).replace(/\.0$/,'')+'B';
  else if(abs >= 1e6) out = (n/1e6).toFixed(n >= 10e6 ? 0 : 1).replace(/\.0$/,'')+'M';
  else if(abs >= 1e3) out = (n/1e3).toFixed(n >= 10e3 ? 0 : 1).replace(/\.0$/,'')+'K';
  else out = String(n);
  return cur + out;
}
window.formatRevenue = formatRevenue;

// Attribute escape — used by forum-detail / products / many renderers (must load before defer scripts)
function tgEscapeAttr(value){
  return String(value||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
}
