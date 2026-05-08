/* ═══════════════════════════════════════
   M1: MAHSULOTLAR (DATA ENGINE)
═══════════════════════════════════════ */
if(!DB.rawMaterials) DB.rawMaterials = [];
if(!DB.products) DB.products = [];
if(!DB.settings) DB.settings = {};
if(!DB.pipeline) DB.pipeline = [];
if(!DB.aiLetters) DB.aiLetters = [];
if(!DB.tradeSnapshots) DB.tradeSnapshots = [];
if(!DB.importSnapshots) DB.importSnapshots = [];

var TARGET_COUNTRIES = [
  {code:'RU',name:'Rossiya',flag:'🇷🇺',comtrade:'643'},
  {code:'KZ',name:'Qozog\'iston',flag:'🇰🇿',comtrade:'398'},
  {code:'KG',name:'Qirg\'iziston',flag:'🇰🇬',comtrade:'417'},
  {code:'TJ',name:'Tojikiston',flag:'🇹🇯',comtrade:'762'},
  {code:'TM',name:'Turkmaniston',flag:'🇹🇲',comtrade:'795'},
  {code:'AZ',name:'Ozarbayjon',flag:'🇦🇿',comtrade:'031'},
  {code:'GE',name:'Gruziya',flag:'🇬🇪',comtrade:'268'},
  {code:'AM',name:'Armaniston',flag:'🇦🇲',comtrade:'051'},
  {code:'AF',name:'Afg\'oniston',flag:'🇦🇫',comtrade:'004'},
  {code:'IR',name:'Eron',flag:'🇮🇷',comtrade:'364'},
  {code:'PK',name:'Pokiston',flag:'🇵🇰',comtrade:'586'},
  {code:'MN',name:'Mo\'g\'uliston',flag:'🇲🇳',comtrade:'496'}
];

var PRODUCT_SECTION_STATE = {
  build: false,
  azot: false,
  other: false
};
var PRODUCT_ACTIVE_SECTION = 'build';
var PRODUCT_SECTION_RAW_FILTER = '';
var PRODUCT_AI_STATE = {
  section: '',
  rawId: '',
  open: false
};
var PRODUCT_SECTION_LABELS = {
  build: "Noruda xomashyolar",
  azot: "Navoiyazot ishlab chiqaradigan xomashyolar",
  other: "Boshqalar (Qayta tiklanadigan xomashyolar)"
};

function normalizeProductSection(section){
  return (section === 'azot' || section === 'other') ? section : 'build';
}

function getProductSectionLabel(section){
  return PRODUCT_SECTION_LABELS[normalizeProductSection(section)] || PRODUCT_SECTION_LABELS.build;
}

function getProductSectionIcon(section){
  section = normalizeProductSection(section);
  if(section === 'azot') return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#465fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M9 3h6l-1 7h4L10 21l1-7H7L9 3z"/></svg>';
  if(section === 'other') return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#465fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/></svg>';
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#465fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M2 20h20M5 20V8l7-5 7 5v12"/><path d="M9 20v-5h6v5"/><path d="M9 12h6"/></svg>';
}

function getSectionRawMaterials(section){
  section = normalizeProductSection(section);
  return (DB.rawMaterials || []).filter(function(raw){
    return normalizeProductSection(raw.section) === section;
  });
}

function getSectionProducts(section){
  section = normalizeProductSection(section);
  return (DB.products || []).filter(function(product){
    return normalizeProductSection(product.section) === section;
  });
}

function getSelectedProductAiRaw(){
  if(!PRODUCT_AI_STATE.open || !PRODUCT_AI_STATE.rawId) return null;
  return (DB.rawMaterials || []).find(function(raw){
    return String(raw.id) === String(PRODUCT_AI_STATE.rawId);
  }) || null;
}

function doesInvestAiMaterialMatchRaw(material, raw){
  if(!material || !raw) return false;
  var needle = investAiNormalizeText(material);
  var uz = investAiNormalizeText(raw.name_uz);
  var en = investAiNormalizeText(raw.name_en);
  return needle === uz || needle === en || (!!uz && needle.indexOf(uz) !== -1) || (!!en && needle.indexOf(en) !== -1);
}

function getRawDisplayName(raw){
  return raw ? (raw.name_uz || raw.name_en || '—') : '—';
}

function getRawAnalysisMaterialName(raw){
  return raw ? (raw.name_en || raw.name_uz || '') : '';
}

function findInvestAiHistoryIndexForRaw(raw){
  if(!raw) return -1;
  var items = getInvestAiHistory();
  for(var i=0;i<items.length;i++){
    if(doesInvestAiMaterialMatchRaw(items[i].material, raw)) return i;
  }
  return -1;
}

// Mirror hidden section body -> visible expand body (chips/AI panel update)
function _syncExpandBody(){
  var srcBody = document.getElementById('productSection'+PRODUCT_ACTIVE_SECTION.charAt(0).toUpperCase()+PRODUCT_ACTIVE_SECTION.slice(1)+'Body');
  var expandBody = document.getElementById('resursExpandBody');
  if(srcBody && expandBody) expandBody.innerHTML = srcBody.innerHTML;
}

function focusProductRawAnalysis(section, rawId){
  PRODUCT_ACTIVE_SECTION = normalizeProductSection(section);
  PRODUCT_SECTION_RAW_FILTER = rawId || '';
  PRODUCT_AI_STATE.section = PRODUCT_ACTIVE_SECTION;
  PRODUCT_AI_STATE.rawId = String(rawId || '');
  PRODUCT_AI_STATE.open = !!rawId;
  var raw = getSelectedProductAiRaw();
  if(raw && typeof fillInvestAiMaterial === 'function') fillInvestAiMaterial(getRawAnalysisMaterialName(raw));
  renderInlineProductSection(PRODUCT_ACTIVE_SECTION);
  _syncExpandBody();
  setTimeout(function(){
    var shell = document.getElementById('productRawAiShell');
    if(shell) shell.scrollIntoView({behavior:'smooth',block:'center'});
  }, 50);
}
window.focusProductRawAnalysis = focusProductRawAnalysis;

window.filterProductsByRaw = function(rawId){
  filterProductsByRaw(rawId);
  _syncExpandBody();
};

// Expose function helpers for other modules (import-analysis) to trigger chip re-render.
// PRODUCT_ACTIVE_SECTION is already auto-exposed on window via top-level `var`.
window.renderInlineProductSection = renderInlineProductSection;
window._syncExpandBody = _syncExpandBody;

// Delegated click handler — guarantees chip clicks work even if inline onclick
// misfires after innerHTML replacements in resursExpandBody.
(function _bindChipDelegation(){
  if(window._prodChipDelegated) return;
  window._prodChipDelegated = true;
  document.addEventListener('click', function(e){
    var chip = e.target && e.target.closest ? e.target.closest('.prod-chip') : null;
    if(!chip) return;
    // Skip the × remove button (it has its own handler + stopPropagation)
    if(e.target.classList && e.target.classList.contains('prod-chip-x')) return;
    // "Hammasi" chip — reset filter
    if(chip.classList.contains('prod-chip-all')){
      e.preventDefault();
      e.stopPropagation();
      window.filterProductsByRaw('');
      return;
    }
    // Raw-material chip — activate AI panel for this raw
    var onclickAttr = chip.getAttribute('onclick') || '';
    var m = onclickAttr.match(/focusProductRawAnalysis\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/);
    if(m){
      e.preventDefault();
      e.stopPropagation();
      window.focusProductRawAnalysis(m[1], m[2]);
    }
  }, true);
})();

// Section videos: cache first-frame poster to localStorage so video appears INSTANTLY next time
// Real video downloads in background after poster is shown.
(function smartVideoLoader(){
  function getPosterCache(key){
    try { return localStorage.getItem('_videoPoster_' + key); } catch(e){ return null; }
  }
  function setPosterCache(key, dataUrl){
    try { localStorage.setItem('_videoPoster_' + key, dataUrl); } catch(e){}
  }
  function captureFirstFrame(v, key){
    try {
      var canvas = document.createElement('canvas');
      canvas.width = v.videoWidth; canvas.height = v.videoHeight;
      canvas.getContext('2d').drawImage(v, 0, 0);
      var dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      setPosterCache(key, dataUrl);
    } catch(e){}
  }
  function attachVideo(v){
    if(v._lazyAttached) return;
    v._lazyAttached = true;
    var realSrc = v.getAttribute('data-src');
    if(!realSrc) return;
    var key = realSrc.split('/').pop().split('?')[0] + '_v2'; // bumped after compressing videos
    // 1. Show cached poster INSTANTLY if available
    var cachedPoster = getPosterCache(key);
    if(cachedPoster){
      v.poster = cachedPoster;
      v.style.opacity = 1;
    }
    // 2. Start downloading real video in background
    v.preload = 'auto';
    v.src = realSrc;
    v.load();
    v.addEventListener('loadeddata', function(){
      v.style.opacity = 1;
      if(!cachedPoster) captureFirstFrame(v, key);
      var p = v.play();
      if(p && p.catch) p.catch(function(){});
    }, { once: true });
  }
  function startAll(){
    var videos = document.querySelectorAll('.resurs-slide video[data-src]');
    if(!videos.length) return setTimeout(startAll, 300);
    videos.forEach(attachVideo);
    console.log('🎬 ' + videos.length + ' ta video — keshlangan poster + parallel yuklash');
  }
  function check(){
    var productsPage = document.getElementById('page-products');
    if(productsPage && productsPage.classList.contains('active')) startAll();
    else setTimeout(check, 500);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check);
  else check();
})();

function closeProductRawAi(section){
  if(section && normalizeProductSection(section) !== PRODUCT_ACTIVE_SECTION) return;
  PRODUCT_AI_STATE.open = false;
  PRODUCT_AI_STATE.rawId = '';
  renderInlineProductSection(PRODUCT_ACTIVE_SECTION);
}

function openProductRawAiPage(){
  var raw = getSelectedProductAiRaw();
  if(!raw){ toast('⚠️ Avval xomashyoni tanlang','error'); return; }
  fillInvestAiMaterial(getRawAnalysisMaterialName(raw));
  showPage('materialai');
  var idx = findInvestAiHistoryIndexForRaw(raw);
  if(idx >= 0) loadInvestAiHistory(idx);
}

function loadProductRawAiHistory(){
  var raw = getSelectedProductAiRaw();
  var idx = findInvestAiHistoryIndexForRaw(raw);
  if(idx < 0){
    toast('⚠️ Bu xomashyo uchun saqlangan AI tahlil topilmadi','error');
    return;
  }
  fillInvestAiMaterial(getRawAnalysisMaterialName(raw));
  loadInvestAiHistory(idx);
}

function analyzeSelectedProductRaw(){
  var raw = getSelectedProductAiRaw();
  if(!raw){
    toast('⚠️ Avval xomashyoni tanlang','error');
    return;
  }
  var name = getRawAnalysisMaterialName(raw);
  fillInvestAiMaterial(name);
  // Pass rawId directly so collectInvestAiTradeContext can find it by ID
  _investAiDirectRawId = String(raw.id || '');
  analyzeInvestmentMaterial();
}
window.closeProductRawAi = function(section){ closeProductRawAi(section); _syncExpandBody(); };
window.openProductRawAiPage = openProductRawAiPage;
window.loadProductRawAiHistory = loadProductRawAiHistory;
window.analyzeSelectedProductRaw = analyzeSelectedProductRaw;

// ═══ AI'siz Excel hisobot — xomashyo + mahsulotlar × 12 davlat ═══
async function exportRawMaterialReport(section, rawId){
  if(typeof XLSX === 'undefined'){ toast('⚠️ Excel kutubxonasi yuklanmagan','error'); return; }
  var raws = (DB.rawMaterials||[]).filter(function(r){ return String(r.id) === String(rawId); });
  var raw = raws[0];
  if(!raw){ toast('⚠️ Xomashyo topilmadi','error'); return; }
  var products = (DB.products||[]).filter(function(p){ return String(p.raw_id) === String(rawId); });
  if(!products.length){ toast('⚠️ Bu xomashyoda mahsulot yo\'q','error'); return; }

  var rawName = raw.name_uz || raw.name_en || 'Xomashyo';
  var loading = toastLoading('📊 '+products.length+' ta mahsulot uchun '+TARGET_COUNTRIES.length+' davlat ma\'lumotlari yuklanmoqda...');

  var year = (DB.settings && DB.settings.tradeYear) || (new Date().getFullYear() - 1);
  var wb = XLSX.utils.book_new();

  // ===== Sheet 1: Xulosa =====
  var summaryRows = [
    ['Xomashyo bo\'yicha hisobot'],
    [],
    ['Xomashyo nomi (UZ):', rawName],
    ['Xomashyo nomi (EN):', raw.name_en || '—'],
    ['Bo\'lim:', getProductSectionLabel(section)],
    ['Mahsulotlar soni:', products.length],
    ['Davlatlar soni:', TARGET_COUNTRIES.length],
    ['Yil:', year],
    ['Hisobot sanasi:', new Date().toISOString().slice(0,10)],
    [],
    ['Mahsulotlar ro\'yxati:'],
    ['#', 'Mahsulot (UZ)', 'Mahsulot (EN)', 'HS kod', 'Soha', 'Import ma\'lumoti']
  ];
  products.forEach(function(p, i){
    summaryRows.push([
      i+1,
      p.name_uz || '—',
      p.name_en || '—',
      p.hs_code || '—',
      p.main_sector || p.usage || '—',
      p.import_info || '—'
    ]);
  });
  var ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws1['!cols'] = [{wch:5},{wch:35},{wch:35},{wch:12},{wch:25},{wch:30}];
  XLSX.utils.book_append_sheet(wb, ws1, 'Xulosa');

  // ===== Sheet 2: Davlatlar bo'yicha import (mahsulot × davlat matritsa) =====
  var matrixHeader = ['#', 'Mahsulot', 'HS kod'].concat(TARGET_COUNTRIES.map(function(c){ return c.flag+' '+c.name; })).concat(['JAMI ($)']);
  var matrixRows = [matrixHeader];

  var totalProcessed = 0;
  for(var pi = 0; pi < products.length; pi++){
    var p = products[pi];
    var hs = String(p.hs_code || '').trim();
    if(!hs){
      var emptyRow = [pi+1, p.name_uz || p.name_en || '—', '—'];
      for(var ci = 0; ci < TARGET_COUNTRIES.length; ci++) emptyRow.push('');
      emptyRow.push(0);
      matrixRows.push(emptyRow);
      continue;
    }

    var row = [pi+1, p.name_uz || p.name_en || '—', hs];
    var rowTotal = 0;
    var data = null;
    try {
      data = await fetchComtrade(hs, year, TARGET_COUNTRIES, 'comtrade');
    } catch(e){
      console.warn('fetchComtrade xato:', hs, e.message);
    }

    TARGET_COUNTRIES.forEach(function(country){
      var match = data && data.find(function(d){
        return String(d.country_code || d.code || '').toLowerCase() === country.code.toLowerCase()
          || String(d.country_name || d.name || '').toLowerCase().indexOf(country.name.toLowerCase()) !== -1;
      });
      var val = match ? (match.import_usd || match.value || 0) : 0;
      rowTotal += val;
      row.push(val ? Math.round(val) : '');
    });
    row.push(Math.round(rowTotal));
    matrixRows.push(row);
    totalProcessed++;
    // Update progress
    if(totalProcessed % 3 === 0){
      toastDone(loading, '📊 '+totalProcessed+'/'+products.length+' mahsulot tayyor...', 'loading');
      loading = document.querySelector('#navNotifWrap > div:last-child');
    }
  }

  // Total row
  var totalRow = ['', 'JAMI', ''];
  for(var ci = 0; ci < TARGET_COUNTRIES.length; ci++){
    var sum = 0;
    for(var ri = 1; ri < matrixRows.length; ri++){
      var v = matrixRows[ri][3 + ci];
      if(typeof v === 'number') sum += v;
    }
    totalRow.push(sum || '');
  }
  var grand = 0;
  for(var ri = 1; ri < matrixRows.length; ri++){
    var v = matrixRows[ri][matrixRows[ri].length - 1];
    if(typeof v === 'number') grand += v;
  }
  totalRow.push(grand);
  matrixRows.push(totalRow);

  var ws2 = XLSX.utils.aoa_to_sheet(matrixRows);
  var cols2 = [{wch:5},{wch:30},{wch:12}];
  for(var i = 0; i < TARGET_COUNTRIES.length; i++) cols2.push({wch:14});
  cols2.push({wch:16});
  ws2['!cols'] = cols2;
  XLSX.utils.book_append_sheet(wb, ws2, 'Davlat × Mahsulot');

  // ===== Sheet 3: Davlat bo'yicha jami (top countries) =====
  var perCountry = TARGET_COUNTRIES.map(function(c, idx){
    var sum = 0;
    for(var ri = 1; ri < matrixRows.length - 1; ri++){
      var v = matrixRows[ri][3 + idx];
      if(typeof v === 'number') sum += v;
    }
    return { name: c.flag + ' ' + c.name, code: c.code, sum: sum };
  }).sort(function(a,b){ return b.sum - a.sum; });

  var ws3Rows = [
    ['Davlatlar reytingi (jami import, USD)'],
    [],
    ['#', 'Davlat', 'Kod', 'Jami import ($)', 'Ulush (%)']
  ];
  var grandSum = perCountry.reduce(function(s,c){ return s + c.sum; }, 0);
  perCountry.forEach(function(c, i){
    ws3Rows.push([i+1, c.name, c.code, c.sum ? Math.round(c.sum) : '', grandSum ? ((c.sum/grandSum*100).toFixed(2)+'%') : '']);
  });
  var ws3 = XLSX.utils.aoa_to_sheet(ws3Rows);
  ws3['!cols'] = [{wch:5},{wch:25},{wch:8},{wch:18},{wch:12}];
  XLSX.utils.book_append_sheet(wb, ws3, 'Davlatlar reytingi');

  var fname = 'Xomashyo-'+rawName.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,40)+'-'+year+'.xlsx';
  XLSX.writeFile(wb, fname);
  toastDone(loading, '✅ Excel yuklandi: '+fname, 'success');
}
window.exportRawMaterialReport = exportRawMaterialReport;

function renderProductRawAiBlock(section, sectionRaws, sectionProds){
  section = normalizeProductSection(section);
  if(!PRODUCT_AI_STATE.open || PRODUCT_AI_STATE.section !== section || !PRODUCT_AI_STATE.rawId) return '';
  var raw = sectionRaws.find(function(item){ return String(item.id) === String(PRODUCT_AI_STATE.rawId); });
  if(!raw) return '';
  var rawName = getRawDisplayName(raw);
  var relatedProducts = sectionProds.filter(function(product){
    return String(product.raw_id) === String(raw.id);
  });
  var hsCodes = relatedProducts.map(function(product){
    return String(product.hs_code || '').trim();
  }).filter(Boolean).filter(function(code, idx, arr){ return arr.indexOf(code) === idx; });
  var historyIdx = findInvestAiHistoryIndexForRaw(raw);
  var historyBadge = historyIdx >= 0 ? '<span class="prod-ai-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Saqlangan tahlil mavjud</span>' : '<span class="prod-ai-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:2px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Yangi AI tahlil tayyorlash mumkin</span>';
  var preview = relatedProducts.slice(0,6).map(function(product){
    return '<span class="prod-ai-preview-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#465fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:2px"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> '+escapeHtmlText(product.name_uz || product.name_en || '\u2014')+'</span>';
  }).join('');
  if(relatedProducts.length > 6){
    preview += '<span class="prod-ai-preview-more">+'+(relatedProducts.length - 6)+' ta mahsulot</span>';
  }
  return '' +
    '<div class="prod-ai-shell" id="productRawAiShell">' +
      '<div class="prod-ai-head">' +
        '<div>' +
          '<div class="prod-ai-eyebrow">AI Invest Lens</div>' +
          '<div class="prod-ai-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> '+escapeHtmlText(rawName)+'</div>' +
          '<div class="prod-ai-sub">'+escapeHtmlText(getProductSectionLabel(section))+' bo\'limidagi ushbu xomashyoga tegishli mahsulotlar, TN VED kodlar va UN Comtrade asosidagi investitsiya tahlili shu yerda ishlaydi.</div>' +
          '<div class="prod-ai-pills">' +
            '<span class="prod-ai-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:2px"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> '+relatedProducts.length+' ta mahsulot</span>' +
            '<span class="prod-ai-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:2px"><path d="M4 7h16M4 12h16M4 17h10"/></svg> '+hsCodes.length+' ta HS kod</span>' +
            '<span class="prod-ai-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:2px"><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49"/></svg> '+escapeHtmlText(getProductSectionLabel(section))+'</span>' +
            historyBadge +
          '</div>' +
        '</div>' +
        '<div class="prod-ai-actions">' +
          '<button class="btn btn-green btn-sm" onclick="exportRawMaterialReport(\''+section+'\',\''+raw.id+'\')">📊 Excel hisobot (12 davlat)</button>' +
          '<button class="btn btn-blue btn-sm" id="productRawAiAnalyzeBtn" onclick="analyzeSelectedProductRaw()">🧠 AI tahlil qilish</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="loadProductRawAiHistory()">🕘 Oxirgi tahlilni ochish</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="openProductRawAiPage()">↗ To\'liq AI sahifada ochish</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="closeProductRawAi(\''+section+'\')">✕ Yopish</button>' +
        '</div>' +
      '</div>' +
      '<div class="prod-ai-preview">'+(preview || '<span class="prod-ai-preview-more">Mahsulotlar hali kiritilmagan</span>')+'</div>' +
      '<div class="prod-ai-note">Kreativ yondashuv sifatida bu panel xomashyodan boshlab investitsiya tahlilini shu joyning o\'zida ochadi. AI natija tayyor bo\'lgach, shu yerning o\'zida ko\'rasiz va kerak bo\'lsa to\'liq AI Invest Tahlili sahifasiga o\'tasiz.</div>' +
      '<div class="prod-ai-divider"></div>' +
      '<div class="tcard prod-ai-inline-card" id="productRawAiProgressCard" style="display:none">' +
        '<div class="tc-head"><div class="tc-title">⏳ Tahlil bosqichlari</div><div class="anx-running">AI tahlil ishlayapti...</div></div>' +
        '<div class="anx-progress" id="productRawAiProgress"></div>' +
      '</div>' +
      '<div class="tcard prod-ai-inline-card" id="productRawAiOutputCard" style="display:none">' +
        '<div class="tc-head"><div class="tc-title">📄 Xomashyo bo\'yicha AI hisobot</div><div style="font-size:.72rem;color:var(--text3)" id="productRawAiOutputMeta">—</div></div>' +
        '<div class="anx-output-wrap"><div class="anx-output" id="productRawAiOutput"><p>Mahsulot tahlilini boshlash uchun yuqoridagi tugmani bosing.</p></div></div>' +
      '</div>' +
      '<div class="tcard prod-ai-inline-card" id="productRawAiExcelNotice" style="display:none">' +
        '<div class="anx-cta-card">' +
          '<div class="anx-cta-title">📘 To\'liq Excel workbook mavjud</div>' +
          '<div class="anx-cta-body">UN Comtrade asosidagi AI tahlil yakunlangach, shu xomashyo uchun workbook yuklab olishingiz mumkin.</div>' +
          '<div style="margin-top:.85rem"><button class="btn btn-green btn-sm" id="productRawAiExportBtn" onclick="exportInvestAiWorkbook()">📥 Excel yuklab olish</button></div>' +
        '</div>' +
      '</div>' +
    '</div>';
}

function syncProductRawAiPanelState(section){
  section = normalizeProductSection(section);
  if(!PRODUCT_AI_STATE.open || PRODUCT_AI_STATE.section !== section) return;
  var raw = getSelectedProductAiRaw();
  if(!raw) return;
  var analyzeBtn = document.getElementById('productRawAiAnalyzeBtn');
  if(analyzeBtn){
    analyzeBtn.disabled = _investAiBusy;
    analyzeBtn.textContent = _investAiBusy ? '⏳ AI tahlil qilinmoqda...' : '🧠 Shu xomashyoni tahlil qilish';
  }
  if(doesInvestAiMaterialMatchRaw(_investAiCurrentMaterial, raw) && _investAiMarkdown){
    renderInvestAiProgressInto('productRawAiProgress', 'productRawAiProgressCard', _investAiBusy ? Math.max(_investAiPhase,0) : 3, !_investAiBusy);
    renderInvestAiMarkdownInto('productRawAiOutput', _investAiMarkdown);
    updateInvestAiOutputMetaInto('productRawAiOutputMeta', _investAiCurrentMaterial, new Date().toISOString());
    var outputCard = document.getElementById('productRawAiOutputCard');
    var notice = document.getElementById('productRawAiExcelNotice');
    if(outputCard) outputCard.style.display = 'block';
    if(notice) notice.style.display = _investAiBusy ? 'none' : 'block';
    return;
  }
  var historyIdx = findInvestAiHistoryIndexForRaw(raw);
  var items = getInvestAiHistory();
  var cached = historyIdx >= 0 ? items[historyIdx] : null;
  var outputCard = document.getElementById('productRawAiOutputCard');
  var notice = document.getElementById('productRawAiExcelNotice');
  var progressCard = document.getElementById('productRawAiProgressCard');
  if(progressCard) progressCard.style.display = 'none';
  if(cached && cached.markdown){
    renderInvestAiMarkdownInto('productRawAiOutput', cached.markdown);
    updateInvestAiOutputMetaInto('productRawAiOutputMeta', cached.material || getRawAnalysisMaterialName(raw), cached.savedAt || new Date().toISOString());
    if(outputCard) outputCard.style.display = 'block';
    if(notice) notice.style.display = 'block';
  } else {
    if(outputCard) outputCard.style.display = 'block';
    renderInvestAiMarkdownInto('productRawAiOutput', '');
    updateInvestAiOutputMetaInto('productRawAiOutputMeta', getRawAnalysisMaterialName(raw), new Date().toISOString());
    if(notice) notice.style.display = 'none';
  }
}

function shouldMirrorInvestAiToProductPanel(material){
  var shell = document.getElementById('productRawAiShell');
  var raw = getSelectedProductAiRaw();
  if(!shell || !raw) return false;
  return doesInvestAiMaterialMatchRaw(material || _investAiCurrentMaterial, raw);
}

function syncProductSections(rms, prods){
  var buildMeta = document.getElementById('productSectionBuildMeta');
  var azotMeta = document.getElementById('productSectionAzotMeta');
  var otherMeta = document.getElementById('productSectionOtherMeta');
  var sectionRaws = {
    build: getSectionRawMaterials('build'),
    azot: getSectionRawMaterials('azot'),
    other: getSectionRawMaterials('other')
  };
  var sectionProds = {
    build: getSectionProducts('build'),
    azot: getSectionProducts('azot'),
    other: getSectionProducts('other')
  };

  if(buildMeta){
    buildMeta.textContent = sectionRaws.build.length + ' ta xomashyo • ' + sectionProds.build.length + ' ta mahsulot';
  }
  if(azotMeta){
    azotMeta.textContent = sectionProds.azot.length || sectionRaws.azot.length
      ? sectionRaws.azot.length + ' ta xomashyo • ' + sectionProds.azot.length + ' ta mahsulot'
      : 'mahsulotlar keyin kiritiladi';
  }
  if(otherMeta){
    otherMeta.textContent = sectionProds.other.length || sectionRaws.other.length
      ? sectionRaws.other.length + ' ta xomashyo • ' + sectionProds.other.length + ' ta mahsulot'
      : 'bo\'lim keyin to\'ldiriladi';
  }

  ['build','azot','other'].forEach(function(section){
    var body = document.getElementById('productSection' + section.charAt(0).toUpperCase() + section.slice(1) + 'Body');
    if(!body) return;
    body.style.display = PRODUCT_SECTION_STATE[section] ? 'block' : 'none';
    if(PRODUCT_SECTION_STATE[section]) renderInlineProductSection(section);
  });
}

function toggleProductSection(section){
  section = normalizeProductSection(section);
  var nextState = !PRODUCT_SECTION_STATE[section];
  PRODUCT_SECTION_STATE.build = false;
  PRODUCT_SECTION_STATE.azot = false;
  PRODUCT_SECTION_STATE.other = false;
  PRODUCT_SECTION_STATE[section] = nextState;
  PRODUCT_ACTIVE_SECTION = section;
  PRODUCT_SECTION_RAW_FILTER = '';
  syncProductSections();
}

/* ═══ RESURS VIDEO SLIDER ═══ */
var _resursSliderIdx = 0;
var _resursSliderSections = ['build','azot','other'];
var _resursSliderTitles = {'build':'Noruda xomashyolar','azot':'Navoiyazot xomashyolari','other':'Qayta tiklanadigan xomashyolar'};

function resursSliderMove(dir){
  _resursSliderIdx = Math.max(0, Math.min(_resursSliderSections.length-1, _resursSliderIdx+dir));
  resursSliderUpdate();
}
function resursSliderGoTo(idx){
  _resursSliderIdx = idx;
  resursSliderUpdate();
}
function resursSliderUpdate(){
  var track = document.getElementById('resursSliderTrack');
  if(track) track.style.transform = 'translateX(-'+(100/3*_resursSliderIdx)+'%)';
  var dots = document.querySelectorAll('.resurs-dot');
  dots.forEach(function(d,i){ d.style.opacity = i===_resursSliderIdx ? '1' : '.5'; });
}

function resursSlideClick(section){
  section = normalizeProductSection(section);
  var expandArea = document.getElementById('resursExpandArea');
  var expandBody = document.getElementById('resursExpandBody');
  var expandTitle = document.getElementById('resursExpandTitle');
  var expandMeta = document.getElementById('resursExpandMeta');
  if(!expandArea || !expandBody) return;
  // Toggle if same section clicked again
  if(expandArea.style.display !== 'none' && expandArea.getAttribute('data-active') === section){
    expandArea.style.display = 'none';
    return;
  }
  expandArea.setAttribute('data-active', section);
  expandArea.style.display = 'block';
  if(expandTitle) expandTitle.textContent = _resursSliderTitles[section] || section;
  // Open the product section and render its content
  PRODUCT_SECTION_STATE.build = false;
  PRODUCT_SECTION_STATE.azot = false;
  PRODUCT_SECTION_STATE.other = false;
  PRODUCT_SECTION_STATE[section] = true;
  PRODUCT_ACTIVE_SECTION = section;
  PRODUCT_SECTION_RAW_FILTER = '';
  // Render inline content
  renderInlineProductSection(section);
  // Copy rendered content to expand body
  var srcBody = document.getElementById('productSection'+section.charAt(0).toUpperCase()+section.slice(1)+'Body');
  if(srcBody){
    expandBody.innerHTML = srcBody.innerHTML;
    // Update meta badge
    var sectionRaws = getSectionRawMaterials(section);
    var sectionProds = getSectionProducts(section);
    if(expandMeta) expandMeta.textContent = sectionRaws.length+' ta xomashyo \u2022 '+sectionProds.length+' ta mahsulot';
  }
  expandArea.scrollIntoView({behavior:'smooth', block:'nearest'});
}

// Attach slide click events on load
(function(){
  setTimeout(function(){
    var slides = document.querySelectorAll('.resurs-slide');
    slides.forEach(function(slide){
      slide.addEventListener('click', function(e){
        if(e.target.closest('button')) return;
        resursSlideClick(this.getAttribute('data-section'));
      });
    });
  }, 500);
})();

function renderProducts(){
  var rms = DB.rawMaterials||[];
  var prods = DB.products||[];
  document.getElementById('pr-k1').innerHTML = rms.length+'<span>ta</span>';
  document.getElementById('pr-k2').innerHTML = prods.length+'<span>ta</span>';
  var _uniqueCompanies = new Set();
  (DB.investorCompanies||[]).forEach(function(r){
    var _name = String(r && r.kompaniya || '').trim().toLowerCase();
    if(_name) _uniqueCompanies.add(_name);
  });
  document.getElementById('pr-k4').innerHTML = _uniqueCompanies.size+'<span>ta</span>';
  // pr-k3 (Eksport) - already has "12" in HTML, add span dynamically if not wrapped
  var _k3 = document.getElementById('pr-k3');
  if(_k3 && _k3.innerHTML.indexOf('<span>') === -1){
    var _val = _k3.textContent.trim().replace(/\s*ta\s*$/i, '').trim();
    _k3.innerHTML = _val + '<span>ta</span>';
  }
  document.getElementById('badge-products').textContent = prods.length;
  syncProductSections(rms, prods);

  // Populate selects
  populateProductSelects();
}
function renderInlineProductSection(section){
  section = normalizeProductSection(section);
  var bodyId = 'productSection' + section.charAt(0).toUpperCase() + section.slice(1) + 'Body';
  var body = document.getElementById(bodyId);
  if(!body) return;
  var sectionRaws = getSectionRawMaterials(section);
  var sectionProds = getSectionProducts(section);
  var filteredProds = PRODUCT_ACTIVE_SECTION === section && PRODUCT_SECTION_RAW_FILTER
    ? sectionProds.filter(function(product){ return String(product.raw_id) === String(PRODUCT_SECTION_RAW_FILTER); })
    : sectionProds.slice();

  var allActive = PRODUCT_ACTIVE_SECTION !== section || !PRODUCT_SECTION_RAW_FILTER;
  var chipsHtml = sectionRaws.length
    ? '<div class="prod-chip-bar">' +
        '<span class="prod-chip prod-chip-all '+(allActive ? 'is-active' : '')+'" onclick="filterProductsByRaw(\'\')">' +
          '<span class="prod-chip-label">Hammasi</span>' +
          '<span class="prod-chip-count">'+sectionProds.length+'</span>' +
        '</span>' +
        sectionRaws.map(function(r){
          var cnt = sectionProds.filter(function(p){ return p.raw_id == r.id; }).length;
          var isActive = PRODUCT_ACTIVE_SECTION === section && String(PRODUCT_SECTION_RAW_FILTER || '') === String(r.id);
          var hasHistory = findInvestAiHistoryIndexForRaw(r) >= 0;
          return '<span class="prod-chip '+(isActive ? 'is-active' : '')+'" onclick="focusProductRawAnalysis(\''+section+'\',\''+r.id+'\')">' +
            '<span class="prod-chip-label">'+escapeHtmlText(r.name_uz||r.name_en||'\u2014')+'</span>' +
            '<span class="prod-chip-count">'+cnt+'</span>' +
            (hasHistory ? '<span class="prod-chip-ai" title="AI tahlil mavjud">AI</span>' : '') +
            '<span class="prod-chip-x" onclick="event.stopPropagation();deleteRawMaterial(\''+r.id+'\')" title="O\'chirish">×</span>' +
          '</span>';
        }).join('') +
      '</div>'
    : '<div class="prod-empty-hint">Bu bo\'limda hali xomashyo yo\'q.</div>';
  var aiPanelHtml = renderProductRawAiBlock(section, sectionRaws, sectionProds);

  var rowsHtml = filteredProds.length ? filteredProds.map(function(p,i){
    var rm = sectionRaws.find(function(r){ return r.id == p.raw_id; });
    return '<tr><td>'+(i+1)+'</td><td><b>'+formatBilingualProductName(p)+'</b>'+(p.description?'<div style="font-size:.55rem;color:var(--ta-gray-400);max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+p.description+'</div>':'')+'</td><td style="font-size:.7rem">'+(rm?rm.name_uz:(p.raw_name||'—'))+'</td><td style="font-size:.65rem">'+(p.hs_code||'—')+'</td><td style="font-size:.65rem">'+(p.main_sector||p.usage||p.price||'—').toString().slice(0,40)+'</td><td style="font-size:.6rem">'+(p.import_info||'—').toString().slice(0,40)+'</td><td style="white-space:nowrap"><button class="ta-btn ta-btn-primary ta-btn-sm" onclick="generateProductPPTX(\''+p.id+'\')" style="margin-right:3px" title="Prezentatsiya">📊</button><button class="ta-btn ta-btn-danger ta-btn-sm" onclick="deleteProduct(\''+p.id+'\')">🗑</button></td></tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text3)">Bu bo\'limda mahsulot qo\'shilmagan</td></tr>';

  body.innerHTML =
    '<div class="prod-section-toolbar">' +
      '<div class="prod-section-meta">' +
        '<div class="prod-section-eyebrow">'+getProductSectionLabel(section)+'</div>' +
        '<div class="prod-section-sub">Ushbu bo\'limga tegishli xomashyo va mahsulotlar ro\'yxati</div>' +
      '</div>' +
      '<div class="prod-section-actions">' +
        '<button class="prod-act-btn prod-act-primary" onclick="showAddRawModal()" title="Xomashyo qo\'shish">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
          '<span>Xomashyo</span>' +
        '</button>' +
        '<button class="prod-act-btn prod-act-primary" onclick="showAddProductModal()" title="Mahsulot qo\'shish">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
          '<span>Mahsulot</span>' +
        '</button>' +
        '<button class="prod-act-btn prod-act-ghost" onclick="loadSampleProducts()" title="AI bilan to\'ldirish">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>' +
          '<span>AI bilan to\'ldirish</span>' +
        '</button>' +
        '<button class="prod-act-btn prod-act-ghost" onclick="uploadPptxTemplate()" title="PPTX Template">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>' +
          '<span>PPTX Template</span>' +
        '</button>' +
      '</div>' +
    '</div>' +
    chipsHtml +
    aiPanelHtml +
    '<div id="prodDropZone-'+section+'" style="margin:0 0 1rem 0;padding:'+(sectionProds.length > 0 ? '.6rem' : '1.5rem')+';border:2px dashed var(--ta-gray-200);border-radius:12px;text-align:center;cursor:pointer;transition:all .15s;background:var(--ta-gray-50)" ondragover="event.preventDefault();this.style.borderColor=\'var(--ta-success-500)\';this.style.background=\'var(--ta-success-50)\'" ondragleave="this.style.borderColor=\'var(--ta-gray-200)\';this.style.background=\'var(--ta-gray-50)\'" ondrop="event.preventDefault();this.style.borderColor=\'var(--ta-gray-200)\';this.style.background=\'var(--ta-gray-50)\';importProductsExcel({files:event.dataTransfer.files})" onclick="var fi=this.querySelector(\'input[type=file]\');if(fi)fi.click()">' +
      (sectionProds.length > 0
        ? '<div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap"><span style="font-size:.7rem;color:var(--text3)">📊 Excel faylni shu yerga tashlang yoki</span><label style="font-size:.7rem;color:#059669;font-weight:700;cursor:pointer;text-decoration:underline">tanlang<input type="file" accept=".xlsx,.xls" style="display:none" onchange="importProductsExcel(this)"></label></div>'
        : '<div style="font-size:2rem;margin-bottom:.4rem">📊</div><div style="font-size:.82rem;font-weight:700;color:var(--text)">Excel faylni shu yerga tashlang</div><div style="font-size:.65rem;color:var(--text3);margin-top:4px">Import "'+getProductSectionLabel(section)+'" bo\'limiga yoziladi</div><input type="file" accept=".xlsx,.xls" style="display:none" onchange="importProductsExcel(this)">') +
    '</div>' +
    '<div class="tscroll"><table class="ta-table"><thead><tr><th>#</th><th>Mahsulot</th><th>Xomashyo</th><th>HS Kod</th><th>Soha</th><th>Import</th><th>Amal</th></tr></thead><tbody>'+rowsHtml+'</tbody></table></div>' +
    '<div style="padding:.8rem 0 0 0;font-size:.72rem;color:var(--text3)">Jami mahsulotlar: '+filteredProds.length+'</div>';
  syncProductRawAiPanelState(section);
}

function formatBilingualProductName(p){
  if(!p) return '—';
  var en = String(p.name_en || p.name || '').trim();
  var uz = String(p.name_uz || '').trim();
  var exactUz = resolveExactUzProductName(en, p.hs_code);
  if((!uz || uz.toLowerCase() === en.toLowerCase()) && exactUz && exactUz.toLowerCase() !== en.toLowerCase()){
    uz = exactUz;
  }
  if(!en && uz) return uz;
  if(!uz || uz.toLowerCase() === en.toLowerCase()) return en || '—';
  return en + ' - ' + uz;
}

function getImportAnalysisProductSelect(){
  return document.getElementById('finder-product-select') || document.getElementById('import-product-select');
}

function populateProductSelects(){
  var prods = DB.products||[];
  var raws = DB.rawMaterials||[];

  // ═══ Custom collapsible dropdown uchun ═══
  var dd = document.getElementById('finder-dropdown');
  if(dd){
    var html = '';
    ['build','azot','other'].forEach(function(section){
      var sectionRaws = getSectionRawMaterials(section);
      var sectionProds = getSectionProducts(section);
      var sectionLabel = getProductSectionLabel(section);
      var sectionIcon = getProductSectionIcon(section);
      var sectionCount = sectionProds.length || 0;
      html += '<div class="csd-group csd-group-section" data-section="'+section+'">';
      html += '<div class="csd-group-head csd-section-head" onclick="toggleCsdGroup(this)"><span>'+sectionIcon+' '+escapeHtmlText(sectionLabel)+'</span><span class="csd-count">'+sectionCount+'</span><span class="csd-caret">▾</span></div>';
      html += '<div class="csd-group-items csd-section-items">';

      sectionRaws.forEach(function(raw){
        var rawProds = sectionProds.filter(function(p){ return String(p.raw_id || '') === String(raw.id); });
        var rawName = raw.name_uz || raw.name_en || 'Nomsiz';
        html += '<div class="csd-group csd-group-raw" data-rawid="'+raw.id+'">';
        html += '<div class="csd-group-head csd-raw-head" onclick="toggleCsdGroup(this)"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#465fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'+escapeHtmlText(rawName)+'</span><span class="csd-count">'+rawProds.length+'</span><span class="csd-caret">▾</span></div>';
        html += '<div class="csd-group-items csd-raw-items">';
        if(rawProds.length){
          rawProds.forEach(function(p){
            html += '<div class="csd-item" data-pid="'+p.id+'" onclick="selectCsdItem(this,\''+p.id+'\')">'+escapeHtmlText(formatBilingualProductName(p))+(p.hs_code?' ('+escapeHtmlText(p.hs_code)+')':'')+'</div>';
          });
        } else {
          html += '<div class="csd-item" style="cursor:default;color:var(--text3)">Mahsulot topilmadi</div>';
        }
        html += '</div></div>';
      });

      var orphans = sectionProds.filter(function(p){
        return !p.raw_id || !sectionRaws.some(function(r){ return String(r.id) === String(p.raw_id); });
      });
      if(orphans.length){
        html += '<div class="csd-group csd-group-raw">';
        html += '<div class="csd-group-head csd-raw-head" onclick="toggleCsdGroup(this)"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#465fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> Boshqa mahsulotlar</span><span class="csd-count">'+orphans.length+'</span><span class="csd-caret">▾</span></div>';
        html += '<div class="csd-group-items csd-raw-items">';
        orphans.forEach(function(p){
          html += '<div class="csd-item" data-pid="'+p.id+'" onclick="selectCsdItem(this,\''+p.id+'\')">'+escapeHtmlText(formatBilingualProductName(p))+(p.hs_code?' ('+escapeHtmlText(p.hs_code)+')':'')+'</div>';
        });
        html += '</div></div>';
      }

      if(!sectionRaws.length && !orphans.length){
        html += '<div class="csd-item" style="cursor:default;color:var(--text3)">Bu bo\'limda hozircha ma\'lumot yo\'q</div>';
      }
      html += '</div></div>';
    });
    dd.innerHTML = html;
  }

  // ailetter company select
  var asel = document.getElementById('ailetter-company-select');
  if(asel){
    var co = DB.investorCompanies||[];
    asel.innerHTML = '<option value="">— Bazadan tanlang —</option>' + co.map(function(c){
      return '<option value="'+c.id+'">'+c.kompaniya+' — '+(c.rahbar||'?')+' ('+(c.davlat||'?')+')</option>';
    }).join('');
  }

  renderFinderProductPicker();
}

function renderFinderProductPicker(){
  var hidden = document.getElementById('finder-product-select');
  var display = document.getElementById('finder-select-display');
  var dd = document.getElementById('finder-dropdown');
  if(!hidden || !display) return;
  var pid = String(hidden.value || '');
  if(!pid){
    display.textContent = 'Mahsulotni tanlang';
    display.classList.add('is-placeholder');
    if(dd) dd.querySelectorAll('.csd-item').forEach(function(item){ item.classList.remove('selected'); });
    return;
  }
  var product = (DB.products || []).find(function(p){ return String(p.id) === pid; });
  if(product){
    display.textContent = formatBilingualProductName(product) + (product.hs_code ? ' (' + product.hs_code + ')' : '');
    display.classList.remove('is-placeholder');
    if(dd){
      dd.querySelectorAll('.csd-item').forEach(function(item){
        item.classList.toggle('selected', String(item.getAttribute('data-pid') || '') === pid);
      });
    }
  } else {
    display.textContent = 'Mahsulotni tanlang';
    display.classList.add('is-placeholder');
  }
}

function toggleFinderDropdown(){
  var dd = document.getElementById('finder-dropdown');
  if(dd) dd.classList.toggle('open');
}

function toggleCsdGroup(head){
  head.classList.toggle('open');
  var items = head.nextElementSibling;
  if(items) items.classList.toggle('open');
}

function selectCsdItem(el, pid){
  // Hidden input'ga qiymat yozish
  var hidden = document.getElementById('finder-product-select');
  if(hidden) hidden.value = pid;
  // Display'ni yangilash
  var display = document.getElementById('finder-select-display');
  if(display) display.textContent = el.textContent;
  // Tanlangan elementni belgilash
  var dd = document.getElementById('finder-dropdown');
  if(dd) dd.querySelectorAll('.csd-item').forEach(function(i){i.classList.remove('selected');});
  el.classList.add('selected');
  // Dropdown'ni yopish
  if(dd) dd.classList.remove('open');
  // handleImportProductChange chaqirish
  if(typeof handleImportProductChange === 'function') handleImportProductChange();
}

function renderInvestorProductFilterPicker(){
  var hidden = document.getElementById('investor-soha-filter-select');
  var display = document.getElementById('investor-soha-filter-display');
  var dd = document.getElementById('investor-soha-filter-dropdown');
  var clearBtn = document.getElementById('investor-soha-filter-clear');
  if(!hidden || !display || !dd) return;
  var pid = String(hidden.value || '');
  var allInvestorCompanies = DB.investorCompanies || [];
  // Geo filter — agar davlat tanlangan bo'lsa, faqat shu davlat kompaniyalari
  var geoCode = (typeof _investorGeoFilterStateCode === 'string') ? _investorGeoFilterStateCode : '';
  // Source filter (Apollo/TradeAtlas)
  var srcFilter = window._investorSourceFilter || null;
  var investorCompanies = allInvestorCompanies.filter(function(rec){
    if(geoCode && typeof getInvestorGeoStateCode === 'function'){
      if(getInvestorGeoStateCode(rec, {}) !== geoCode) return false;
    }
    if(srcFilter){
      var src = String(rec.manba || rec.source || '').toLowerCase().trim();
      if(srcFilter === 'apollo' && src.indexOf('apollo') === -1) return false;
      if(srcFilter === 'tradeatlas' && src.indexOf('tradeatlas') === -1 && src !== 'trade') return false;
    }
    return true;
  });
  var signature = (geoCode||'')+'|'+(srcFilter||'')+'|'+String(investorCompanies.length) + '|' + investorCompanies.map(function(rec){
    return [rec.id, getInvestorSohaValue(rec), rec.mahsulotNomi, rec.mahsulotHs, rec.productId].join(':');
  }).join('|');
  if(dd.dataset.signature !== signature){
    var matchedProducts = (DB.products || []).filter(function(product){
      return investorCompanies.some(function(rec){
        return investorCompanyMatchesProductFilter(rec, product);
      });
    });

    // ═══ Manual HS kodlari — DB.products'da yo'q lekin kompaniyalarda mavjud HS kodlar ═══
    var virtualHsProducts = [];
    var seenManualHs = {};
    investorCompanies.forEach(function(rec){
      var hs = String(rec.mahsulotHs || rec.hsCode || '').replace(/\D/g,'');
      if(!hs){
        var m = String(rec.mahsulotNomi || '').match(/HS\s*(\d{2,10})/i);
        if(m) hs = m[1];
      }
      if(!hs || hs.length < 2) return;
      if(seenManualHs[hs]) return;
      var hasDbMatch = matchedProducts.some(function(p){
        var pHs = String(p.hs_code || '').replace(/\D/g,'');
        return pHs && pHs === hs;
      });
      if(hasDbMatch) return;
      var prodName = String(rec.mahsulotNomi || rec.soha || '').trim();
      prodName = prodName
        .replace(/^HS\s*\d{2,10}\s*(\([^)]+\))?\s*[-—:]?\s*/i, '')
        .replace(/^\s*[-—:]\s*/, '')
        .trim();
      if(!prodName) prodName = 'HS ' + hs;
      seenManualHs[hs] = true;
      virtualHsProducts.push({
        id: 'manual_hs_' + hs,
        hs_code: hs,
        name_uz: prodName,
        name_en: prodName,
        raw_id: '',
        _isManualHs: true
      });
    });

    var html = '';
    ['build','azot','other'].forEach(function(section){
      var sectionProds = getSectionProducts(section).filter(function(product){
        return matchedProducts.some(function(item){ return String(item.id || '') === String(product.id || ''); });
      });
      if(!sectionProds.length) return;
      var sectionRaws = getSectionRawMaterials(section).filter(function(raw){
        return sectionProds.some(function(product){ return String(product.raw_id || '') === String(raw.id || ''); });
      });
      var sectionLabel = getProductSectionLabel(section);
      var sectionIcon = getProductSectionIcon(section);
      var sectionCount = sectionProds.length || 0;
      html += '<div class="csd-group csd-group-section" data-section="'+section+'">';
      html += '<div class="csd-group-head csd-section-head" onclick="toggleCsdGroup(this)"><span>'+sectionIcon+' '+escapeHtmlText(sectionLabel)+'</span><span class="csd-count">'+sectionCount+'</span><span class="csd-caret">▾</span></div>';
      html += '<div class="csd-group-items csd-section-items">';
      sectionRaws.forEach(function(raw){
        var rawProds = sectionProds.filter(function(p){ return String(p.raw_id || '') === String(raw.id); });
        if(!rawProds.length) return;
        var rawName = raw.name_uz || raw.name_en || 'Nomsiz';
        html += '<div class="csd-group csd-group-raw" data-rawid="'+raw.id+'">';
        html += '<div class="csd-group-head csd-raw-head" onclick="toggleCsdGroup(this)"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#465fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'+escapeHtmlText(rawName)+'</span><span class="csd-count">'+rawProds.length+'</span><span class="csd-caret">▾</span></div>';
        html += '<div class="csd-group-items csd-raw-items">';
        rawProds.forEach(function(p){
          html += '<div class="csd-item" data-pid="'+p.id+'" onclick="selectInvestorProductFilter(this,\''+p.id+'\')">'+escapeHtmlText(formatBilingualProductName(p))+(p.hs_code?' ('+escapeHtmlText(p.hs_code)+')':'')+'</div>';
        });
        html += '</div></div>';
      });
      var orphans = sectionProds.filter(function(p){
        return !p.raw_id || !sectionRaws.some(function(r){ return String(r.id) === String(p.raw_id); });
      });
      if(orphans.length){
        html += '<div class="csd-group csd-group-raw">';
        html += '<div class="csd-group-head csd-raw-head" onclick="toggleCsdGroup(this)"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#465fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> Boshqa mahsulotlar</span><span class="csd-count">'+orphans.length+'</span><span class="csd-caret">▾</span></div>';
        html += '<div class="csd-group-items csd-raw-items">';
        orphans.forEach(function(p){
          html += '<div class="csd-item" data-pid="'+p.id+'" onclick="selectInvestorProductFilter(this,\''+p.id+'\')">'+escapeHtmlText(formatBilingualProductName(p))+(p.hs_code?' ('+escapeHtmlText(p.hs_code)+')':'')+'</div>';
        });
        html += '</div></div>';
      }
      html += '</div></div>';
    });
    // ═══ Manual HS kodlari section ═══
    // Jadval bilan AYNAN MOS hisoblash: importyor record va group-importer bekor qilinadi
    function _pickFirstRecRole(rec){
      var mode = String(rec.finderMode || rec.role || '').toLowerCase();
      if(mode === 'exporters' || mode === 'exporter') return 'exporter';
      if(mode === 'importers' || mode === 'importer') return 'importer';
      if(Array.isArray(rec._partners) && rec._partners.length){
        var fp = rec._partners[0];
        if(fp && fp.role === 'importer') return 'exporter';
        if(fp && fp.role === 'exporter') return 'importer';
      }
      if(Array.isArray(rec._partnerOf) && rec._partnerOf.length){
        var fr = rec._partnerOf[0];
        if(fr && fr.role === 'exporter') return 'importer';
        if(fr && fr.role === 'importer') return 'exporter';
      }
      return '';
    }
    function _recIsImporter(r){
      var fm = String(r.finderMode || r.role || '').toLowerCase();
      if(fm === 'importers' || fm === 'importer') return true;
      if(fm === 'exporters' || fm === 'exporter') return false;
      if(Array.isArray(r._partners) && r._partners.length){
        var pr0 = String((r._partners[0] || {}).role || '').toLowerCase();
        if(pr0 === 'importer') return false;
        if(pr0 === 'exporter') return true;
      }
      if(Array.isArray(r._partnerOf) && r._partnerOf.length){
        var po0 = String((r._partnerOf[0] || {}).role || '').toLowerCase();
        if(po0 === 'exporter') return true;
        if(po0 === 'importer') return false;
      }
      return false;
    }
    // Group → first record map (jadval _detectGroupRole bilan bir xil)
    var _firstRecMap = Object.create(null);
    investorCompanies.forEach(function(rec){
      var key = (typeof getInvestorCompanyGroupKey === 'function') ? getInvestorCompanyGroupKey(rec) : String(rec.kompaniya || '').toLowerCase();
      if(!key) return;
      if(!_firstRecMap[key]) _firstRecMap[key] = rec;
    });
    var virtualHsWithCount = virtualHsProducts.map(function(p){
      var seenGroups = Object.create(null);
      investorCompanies.forEach(function(rec){
        if(_recIsImporter(rec)) return;
        var key = (typeof getInvestorCompanyGroupKey === 'function') ? getInvestorCompanyGroupKey(rec) : String(rec.kompaniya || '').toLowerCase();
        if(!key || seenGroups[key]) return;
        var firstRec = _firstRecMap[key];
        if(firstRec && _pickFirstRecRole(firstRec) === 'importer') return;
        if(typeof investorCompanyMatchesProductFilter === 'function' && investorCompanyMatchesProductFilter(rec, p)){
          seenGroups[key] = true;
        }
      });
      return { product: p, count: Object.keys(seenGroups).length };
    }).filter(function(x){ return x.count > 0; });
    if(virtualHsWithCount.length){
      html += '<div class="csd-group csd-group-section" data-section="manual_hs">';
      html += '<div class="csd-group-head csd-section-head" onclick="toggleCsdGroup(this)"><span>📋 Manual HS kodlari</span><span class="csd-count">'+virtualHsWithCount.length+'</span><span class="csd-caret">▾</span></div>';
      html += '<div class="csd-group-items csd-section-items">';
      virtualHsWithCount.forEach(function(x){
        var p = x.product;
        var label = escapeHtmlText(p.name_uz) + ' (' + escapeHtmlText(p.hs_code) + ')';
        html += '<div class="csd-item" data-pid="'+p.id+'" onclick="selectInvestorProductFilter(this,\''+p.id+'\')">'+label+'<span class="csd-count" style="margin-left:6px;font-size:.65rem;color:var(--text3)">'+x.count+'</span></div>';
      });
      html += '</div></div>';
    }

    if(!html){
      html = '<div class="csd-item" style="cursor:default;color:var(--text3)">Mos mahsulot topilmadi</div>';
    }
    dd.innerHTML = html;
    dd.dataset.signature = signature;
  }
  if(!pid){
    display.textContent = '— Barcha sohalar —';
    dd.querySelectorAll('.csd-item').forEach(function(item){ item.classList.remove('selected'); });
    if(clearBtn) clearBtn.style.display = 'none';
    return;
  }
  var product = (DB.products || []).find(function(p){ return String(p.id) === pid; });
  // Manual HS kod product (DB.products'da yo'q) — tanlovni virtual list'dan topish
  if(!product && pid.indexOf('manual_hs_') === 0){
    var manualHs = pid.replace(/^manual_hs_/, '');
    product = { id: pid, hs_code: manualHs, name_uz: 'HS ' + manualHs, name_en: 'HS ' + manualHs, _isManualHs: true };
  }
  if(product){
    display.textContent = (product.name_uz || product.name_en || ('HS ' + (product.hs_code||''))) + (product.hs_code ? ' (' + product.hs_code + ')' : '');
    dd.querySelectorAll('.csd-item').forEach(function(item){
      item.classList.toggle('selected', String(item.getAttribute('data-pid') || '') === pid);
    });
    if(clearBtn) clearBtn.style.display = 'inline-flex';
  } else {
    display.textContent = '— Barcha sohalar —';
    if(clearBtn) clearBtn.style.display = 'none';
  }
}

function toggleInvestorProductDropdown(){
  var dd = document.getElementById('investor-soha-filter-dropdown');
  var wrap = document.getElementById('investor-soha-filter-wrap');
  if(dd) dd.classList.toggle('open');
  // open-inline o'rniga absolute popup ko'rinishida qoladi (kontentni pastga tushirmaydi)
  if(wrap) wrap.classList.remove('open-inline');
}

function selectInvestorProductFilter(el, pid){
  var hidden = document.getElementById('investor-soha-filter-select');
  if(hidden) hidden.value = pid;
  _investorProductFilterId = String(pid || '');
  var dd = document.getElementById('investor-soha-filter-dropdown');
  var wrap = document.getElementById('investor-soha-filter-wrap');
  if(dd) dd.classList.remove('open');
  if(wrap) wrap.classList.remove('open-inline');
  renderInvestorProductFilterPicker();
  renderInvestorCompanies();
}

function clearInvestorProductFilter(){
  _investorProductFilterId = '';
  var hidden = document.getElementById('investor-soha-filter-select');
  if(hidden) hidden.value = '';
  var dd = document.getElementById('investor-soha-filter-dropdown');
  var wrap = document.getElementById('investor-soha-filter-wrap');
  if(dd) dd.classList.remove('open');
  if(wrap) wrap.classList.remove('open-inline');
  renderInvestorProductFilterPicker();
  renderInvestorCompanies();
}
window.toggleInvestorProductDropdown = toggleInvestorProductDropdown;
window.selectInvestorProductFilter = selectInvestorProductFilter;
window.clearInvestorProductFilter = clearInvestorProductFilter;

// Click tashqarida dropdown yopish
document.addEventListener('click', function(e){
  var wrap = document.getElementById('finder-select-wrap');
  if(wrap && !wrap.contains(e.target)){
    var dd = document.getElementById('finder-dropdown');
    if(dd) dd.classList.remove('open');
  }
  var investorWrap = document.getElementById('investor-soha-filter-wrap');
  if(investorWrap && !investorWrap.contains(e.target)){
    var investorDd = document.getElementById('investor-soha-filter-dropdown');
    if(investorDd) investorDd.classList.remove('open');
    investorWrap.classList.remove('open-inline');
  }
});

function filterProductsByRaw(rawId){
  PRODUCT_SECTION_RAW_FILTER = rawId || '';
  if(!rawId){
    PRODUCT_AI_STATE.open = false;
    PRODUCT_AI_STATE.rawId = '';
  }
  renderInlineProductSection(PRODUCT_ACTIVE_SECTION);
}

var PRODUCT_NAME_UZ_EXACT = [
  [/^Granite,\s*Crude\/Roughly\s*Trimmed$/i, "Granit, xom yoki qo'pol ishlov berilgan"],
  [/^Stone\s+Sets,\s*Curbstones,\s*Flagstones$/i, "Yo'lbop tosh to'plamlari, bordyur toshlari va yassi tosh plitalar"],
  [/^Refractory\s+Bricks\s*\(>?\s*50%\s*SiO.?2\)$/i, "O'tga chidamli g'ishtlar (50% dan ortiq kremniy dioksidli)"],
  [/^Silicon\s+Dioxide\s*\(Silica\)$/i, "Kremniy dioksidi (silika)"],
  [/^Limestone\s+Flux\/Calcareous\s+Stone$/i, "Flyusbop ohaktosh yoki kalkerli tosh"],
  [/^Quicklime\s*\(CaO\)$/i, "So'ndirilmagan ohak (CaO)"],
  [/^Slaked\s+Lime\s*\(Ca\(OH\)₂\)$/i, "So'ndirilgan ohak (Ca(OH)₂)"],
  [/^Slaked\s+Lime\s*\(Ca\(OH\)2\)$/i, "So'ndirilgan ohak (Ca(OH)₂)"],
  [/^Portland\s+Cement$/i, "Portland sementi"],
  [/^White\s+Portland\s+Cement$/i, "Oq portland sementi"],
  [/^Other\s+Portland\s+Cement$/i, "Boshqa portland sementlari"],
  [/^Aluminous\s+Cement$/i, "Aluminat sement"],
  [/^Other\s+Hydraulic\s+Cements$/i, "Boshqa gidravlik sementlar"],
  [/^Ceramic\s+Tiles$/i, "Keramik plitkalar"],
  [/^Other\s+Ceramic\s+Tiles$/i, "Boshqa keramik plitkalar"],
  [/^Ceramic\s+Sanitary\s+Ware$/i, "Keramik sanitariya buyumlari"],
  [/^Glass\s+Containers\/Bottles$/i, "Shisha idishlar va butilkalar"],
  [/^Float\s+Glass\s*\(Coated\)$/i, "Qoplamali float-shisha"],
  [/^Float\s+Glass\s*\(Other\)$/i, "Boshqa float-shisha"],
  [/^Animal\s+Feed\s+Preparations$/i, "Tayyor yem mahsulotlari"],
  [/^Urea$/i, "Karbamid (urea)"],
  [/^Ammonium\s+Sulphate$/i, "Ammoniy sulfat"],
  [/^Anionic\s+Surfactants$/i, "Anion sirt-faol moddalar"],
  [/^Other\s+Surface-Active\s+Agents$/i, "Boshqa sirt-faol moddalar"],
  [/^Washing\s+Preparations\s*\(Retail\)$/i, "Chakana savdo uchun yuvish vositalari"],
  [/^Washing\s+Preparations$/i, "Yuvish vositalari"],
  [/^Petroleum\s+Coke\s*\(Calcined\)$/i, "Kalsinatsiyalangan neft koksi"],
  [/^Non-Refractory\s+Mortars$/i, "O'tga chidamsiz qurilish qorishmalari"],
  [/^Chemical\s+Preparations\s*\(NES\s*1\)$/i, "Kimyoviy aralashmalar (NES 1)"],
  [/^Chemical\s+Preparations\s*\(NES\s*2\)$/i, "Kimyoviy aralashmalar (NES 2)"],
  [/^Chemical\s+Preparations$/i, "Kimyoviy aralashmalar"],
  [/^Plasterboard\s*\(Not\s+Decorated\)$/i, "Bezaksiz gipsokarton"],
  [/^Other\s+Gypsum\s+Board\/Sheets$/i, "Boshqa gips plitalari va listlari"],
  [/^Other\s+Gypsum\s+Articles$/i, "Boshqa gips buyumlari"],
  [/^Paints\s*&\s*Varnishes\s*\(Acrylic\)$/i, "Akril bo'yoqlar va laklar"],
  [/^Other\s+Paints\s*&\s*Varnishes$/i, "Boshqa bo'yoqlar va laklar"],
  [/^Porcelain\s+Tableware$/i, "Chinni idish-tovoqlar"],
  [/^Calcium\s+Carbonate\s*\(Precipitated\)$/i, "Cho'ktirilgan kaltsiy karbonat"],
  [/^Sodium\s+Carbonate\s*\(Soda\s+Ash\)$/i, "Natriy karbonat (soda kuli)"],
  [/^Sodium\s+Bicarbonate$/i, "Natriy gidrokarbonat"],
  [/^Barium\s+Carbonate$/i, "Bariy karbonat"]
];

function translateHSUzOnly(hsCode){
  if(!hsCode) return '';
  hsCode = String(hsCode).replace(/\s+/g,'');
  if(HS_UZ[hsCode]) return HS_UZ[hsCode];
  if(hsCode.length>=4 && HS_UZ[hsCode.slice(0,4)]) return HS_UZ[hsCode.slice(0,4)];
  if(hsCode.length>=2 && HS_UZ[hsCode.slice(0,2)]) return HS_UZ[hsCode.slice(0,2)];
  return '';
}

function resolveExactUzProductName(enName, hsCode){
  var en = String(enName||'').trim();
  for(var i=0;i<PRODUCT_NAME_UZ_EXACT.length;i++){
    if(PRODUCT_NAME_UZ_EXACT[i][0].test(en)) return PRODUCT_NAME_UZ_EXACT[i][1];
  }
  return translateHSUzOnly(hsCode);
}

function showAddRawModal(){
  var name = prompt('Xomashyo nomi (masalan: Marmor):');
  if(!name) return;
  var nameEn = prompt('Inglizcha nomi (masalan: Marble):') || name;
  var section = normalizeProductSection(PRODUCT_ACTIVE_SECTION);
  var rec = {id: 'rm_'+Date.now(), name_uz: name, name_en: nameEn, location:'Navoiy', section:section};
  DB.rawMaterials.push(rec);
  if(typeof fbSave==='function') fbSave('rawMaterials', rec);
  renderProducts();
  toast('✅ Xomashyo "'+getProductSectionLabel(section)+'" bo\'limiga qo\'shildi: ' + name);
}

function showAddProductModal(){
  var section = normalizeProductSection(PRODUCT_ACTIVE_SECTION);
  var rms = getSectionRawMaterials(section);
  if(!rms.length){ toast('⚠️ Avval xomashyo qo\'shing','error'); return; }
  var rmList = rms.map(function(r,i){return (i+1)+'. '+r.name_uz;}).join('\n');
  var rmIdx = prompt('Xomashyo tanlang (raqam kiriting):\n'+rmList);
  if(!rmIdx) return;
  var rm = rms[parseInt(rmIdx)-1];
  if(!rm){ toast('⚠️ Noto\'g\'ri raqam','error'); return; }
  var name = prompt('Mahsulot nomi (inglizcha):');
  if(!name) return;
  var hs = prompt('HS kod (ixtiyoriy):') || '';
  var price = prompt('Narx (masalan: $25/m²):') || '';
  var rec = {id: 'pr_'+Date.now(), raw_id: rm.id, name_en: name, name_uz:'', hs_code: hs, price: price, section:section, raw_name:rm.name_uz||rm.name_en||''};
  DB.products.push(rec);
  if(typeof fbSave==='function') fbSave('products', rec);
  renderProducts();
  toast('✅ Mahsulot "'+getProductSectionLabel(section)+'" bo\'limiga qo\'shildi: ' + name);
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL TRADE DATA — UN Comtrade API
   196 davlatning BARCHA import/export mahsulotlari
   ═══════════════════════════════════════════════════════════════ */
// ═══ DAVLATLAR RO'YXATI — Qidiruvli dropdown ═══
var TRADE_COUNTRIES = [
  {c:'860',n:'🇺🇿 O\'zbekiston',g:'Markaziy Osiyo'},{c:'398',n:'🇰🇿 Qozog\'iston',g:'Markaziy Osiyo'},{c:'417',n:'🇰🇬 Qirg\'iziston',g:'Markaziy Osiyo'},{c:'762',n:'🇹🇯 Tojikiston',g:'Markaziy Osiyo'},{c:'795',n:'🇹🇲 Turkmaniston',g:'Markaziy Osiyo'},
  {c:'643',n:'🇷🇺 Rossiya',g:'MDH'},{c:'031',n:'🇦🇿 Ozarbayjon',g:'MDH'},{c:'268',n:'🇬🇪 Gruziya',g:'MDH'},{c:'051',n:'🇦🇲 Armaniston',g:'MDH'},{c:'112',n:'🇧🇾 Belorussiya',g:'MDH'},{c:'804',n:'🇺🇦 Ukraina',g:'MDH'},{c:'498',n:'🇲🇩 Moldova',g:'MDH'},
  {c:'156',n:'🇨🇳 Xitoy',g:'Sharqiy Osiyo'},{c:'392',n:'🇯🇵 Yaponiya',g:'Sharqiy Osiyo'},{c:'410',n:'🇰🇷 Janubiy Koreya',g:'Sharqiy Osiyo'},{c:'408',n:'🇰🇵 Shimoliy Koreya',g:'Sharqiy Osiyo'},{c:'496',n:'🇲🇳 Mo\'g\'uliston',g:'Sharqiy Osiyo'},{c:'158',n:'🇹🇼 Tayvan',g:'Sharqiy Osiyo'},{c:'344',n:'🇭🇰 Gonkong',g:'Sharqiy Osiyo'},
  {c:'360',n:'🇮🇩 Indoneziya',g:'J-Sh Osiyo'},{c:'458',n:'🇲🇾 Malayziya',g:'J-Sh Osiyo'},{c:'764',n:'🇹🇭 Tailand',g:'J-Sh Osiyo'},{c:'704',n:'🇻🇳 Vyetnam',g:'J-Sh Osiyo'},{c:'608',n:'🇵🇭 Filippin',g:'J-Sh Osiyo'},{c:'702',n:'🇸🇬 Singapur',g:'J-Sh Osiyo'},{c:'104',n:'🇲🇲 Myanma',g:'J-Sh Osiyo'},{c:'116',n:'🇰🇭 Kambodja',g:'J-Sh Osiyo'},{c:'418',n:'🇱🇦 Laos',g:'J-Sh Osiyo'},
  {c:'356',n:'🇮🇳 Hindiston',g:'Janubiy Osiyo'},{c:'586',n:'🇵🇰 Pokiston',g:'Janubiy Osiyo'},{c:'050',n:'🇧🇩 Bangladesh',g:'Janubiy Osiyo'},{c:'144',n:'🇱🇰 Shri Lanka',g:'Janubiy Osiyo'},{c:'524',n:'🇳🇵 Nepal',g:'Janubiy Osiyo'},{c:'004',n:'🇦🇫 Afg\'oniston',g:'Janubiy Osiyo'},{c:'064',n:'🇧🇹 Butan',g:'Janubiy Osiyo'},{c:'462',n:'🇲🇻 Maldiv',g:'Janubiy Osiyo'},
  {c:'792',n:'🇹🇷 Turkiya',g:'Yaqin Sharq'},{c:'364',n:'🇮🇷 Eron',g:'Yaqin Sharq'},{c:'368',n:'🇮🇶 Iroq',g:'Yaqin Sharq'},{c:'682',n:'🇸🇦 Saudiya Arabistoni',g:'Yaqin Sharq'},{c:'784',n:'🇦🇪 BAA (Dubai)',g:'Yaqin Sharq'},{c:'634',n:'🇶🇦 Qatar',g:'Yaqin Sharq'},{c:'414',n:'🇰🇼 Quvayt',g:'Yaqin Sharq'},{c:'512',n:'🇴🇲 Ummon',g:'Yaqin Sharq'},{c:'048',n:'🇧🇭 Bahrayn',g:'Yaqin Sharq'},{c:'400',n:'🇯🇴 Iordaniya',g:'Yaqin Sharq'},{c:'422',n:'🇱🇧 Livan',g:'Yaqin Sharq'},{c:'760',n:'🇸🇾 Suriya',g:'Yaqin Sharq'},{c:'376',n:'🇮🇱 Isroil',g:'Yaqin Sharq'},{c:'887',n:'🇾🇪 Yaman',g:'Yaqin Sharq'},{c:'196',n:'🇨🇾 Kipr',g:'Yaqin Sharq'},
  {c:'276',n:'🇩🇪 Germaniya',g:'G\'arbiy Yevropa'},{c:'250',n:'🇫🇷 Fransiya',g:'G\'arbiy Yevropa'},{c:'826',n:'🇬🇧 Buyuk Britaniya',g:'G\'arbiy Yevropa'},{c:'380',n:'🇮🇹 Italiya',g:'G\'arbiy Yevropa'},{c:'724',n:'🇪🇸 Ispaniya',g:'G\'arbiy Yevropa'},{c:'528',n:'🇳🇱 Niderlandiya',g:'G\'arbiy Yevropa'},{c:'056',n:'🇧🇪 Belgiya',g:'G\'arbiy Yevropa'},{c:'040',n:'🇦🇹 Avstriya',g:'G\'arbiy Yevropa'},{c:'756',n:'🇨🇭 Shveytsariya',g:'G\'arbiy Yevropa'},{c:'372',n:'🇮🇪 Irlandiya',g:'G\'arbiy Yevropa'},
  {c:'752',n:'🇸🇪 Shvetsiya',g:'Shimoliy Yevropa'},{c:'578',n:'🇳🇴 Norvegiya',g:'Shimoliy Yevropa'},{c:'208',n:'🇩🇰 Daniya',g:'Shimoliy Yevropa'},{c:'246',n:'🇫🇮 Finlandiya',g:'Shimoliy Yevropa'},{c:'352',n:'🇮🇸 Islandiya',g:'Shimoliy Yevropa'},{c:'233',n:'🇪🇪 Estoniya',g:'Shimoliy Yevropa'},{c:'428',n:'🇱🇻 Latviya',g:'Shimoliy Yevropa'},{c:'440',n:'🇱🇹 Litva',g:'Shimoliy Yevropa'},
  {c:'616',n:'🇵🇱 Polsha',g:'Sharqiy Yevropa'},{c:'203',n:'🇨🇿 Chexiya',g:'Sharqiy Yevropa'},{c:'348',n:'🇭🇺 Vengriya',g:'Sharqiy Yevropa'},{c:'642',n:'🇷🇴 Ruminiya',g:'Sharqiy Yevropa'},{c:'100',n:'🇧🇬 Bolgariya',g:'Sharqiy Yevropa'},{c:'703',n:'🇸🇰 Slovakiya',g:'Sharqiy Yevropa'},{c:'705',n:'🇸🇮 Sloveniya',g:'Sharqiy Yevropa'},{c:'191',n:'🇭🇷 Xorvatiya',g:'Sharqiy Yevropa'},{c:'688',n:'🇷🇸 Serbiya',g:'Sharqiy Yevropa'},{c:'070',n:'🇧🇦 Bosniya',g:'Sharqiy Yevropa'},{c:'807',n:'🇲🇰 Shimoliy Makedoniya',g:'Sharqiy Yevropa'},{c:'008',n:'🇦🇱 Albaniya',g:'Sharqiy Yevropa'},{c:'499',n:'🇲🇪 Chernogoriya',g:'Sharqiy Yevropa'},
  {c:'620',n:'🇵🇹 Portugaliya',g:'Janubiy Yevropa'},{c:'300',n:'🇬🇷 Gretsiya',g:'Janubiy Yevropa'},
  {c:'842',n:'🇺🇸 AQSh',g:'Shimoliy Amerika'},{c:'124',n:'🇨🇦 Kanada',g:'Shimoliy Amerika'},{c:'484',n:'🇲🇽 Meksika',g:'Shimoliy Amerika'},
  {c:'192',n:'🇨🇺 Kuba',g:'Karib'},{c:'214',n:'🇩🇴 Dominikan Resp.',g:'Karib'},{c:'332',n:'🇭🇹 Gaiti',g:'Karib'},{c:'388',n:'🇯🇲 Yamayka',g:'Karib'},{c:'320',n:'🇬🇹 Gvatemala',g:'M. Amerika'},{c:'188',n:'🇨🇷 Kosta-Rika',g:'M. Amerika'},{c:'591',n:'🇵🇦 Panama',g:'M. Amerika'},
  {c:'076',n:'🇧🇷 Braziliya',g:'J. Amerika'},{c:'032',n:'🇦🇷 Argentina',g:'J. Amerika'},{c:'152',n:'🇨🇱 Chili',g:'J. Amerika'},{c:'170',n:'🇨🇴 Kolumbiya',g:'J. Amerika'},{c:'604',n:'🇵🇪 Peru',g:'J. Amerika'},{c:'862',n:'🇻🇪 Venesuela',g:'J. Amerika'},{c:'218',n:'🇪🇨 Ekvador',g:'J. Amerika'},{c:'068',n:'🇧🇴 Boliviya',g:'J. Amerika'},{c:'600',n:'🇵🇾 Paragvay',g:'J. Amerika'},{c:'858',n:'🇺🇾 Urugvay',g:'J. Amerika'},
  {c:'818',n:'🇪🇬 Misr',g:'Sh. Afrika'},{c:'504',n:'🇲🇦 Marokash',g:'Sh. Afrika'},{c:'012',n:'🇩🇿 Jazoir',g:'Sh. Afrika'},{c:'788',n:'🇹🇳 Tunis',g:'Sh. Afrika'},{c:'434',n:'🇱🇾 Liviya',g:'Sh. Afrika'},{c:'736',n:'🇸🇩 Sudan',g:'Sh. Afrika'},
  {c:'566',n:'🇳🇬 Nigeriya',g:'G\'arbiy Afrika'},{c:'288',n:'🇬🇭 Gana',g:'G\'arbiy Afrika'},{c:'384',n:'🇨🇮 Kot-d\'Ivuar',g:'G\'arbiy Afrika'},{c:'686',n:'🇸🇳 Senegal',g:'G\'arbiy Afrika'},{c:'466',n:'🇲🇱 Mali',g:'G\'arbiy Afrika'},
  {c:'404',n:'🇰🇪 Keniya',g:'Sharqiy Afrika'},{c:'834',n:'🇹🇿 Tanzaniya',g:'Sharqiy Afrika'},{c:'231',n:'🇪🇹 Efiopiya',g:'Sharqiy Afrika'},{c:'800',n:'🇺🇬 Uganda',g:'Sharqiy Afrika'},{c:'646',n:'🇷🇼 Ruanda',g:'Sharqiy Afrika'},{c:'508',n:'🇲🇿 Mozambik',g:'Sharqiy Afrika'},
  {c:'180',n:'🇨🇩 Kongo DR',g:'M. Afrika'},{c:'120',n:'🇨🇲 Kamerun',g:'M. Afrika'},{c:'178',n:'🇨🇬 Kongo Resp.',g:'M. Afrika'},
  {c:'710',n:'🇿🇦 Janubiy Afrika Resp.',g:'J. Afrika'},{c:'024',n:'🇦🇴 Angola',g:'J. Afrika'},{c:'516',n:'🇳🇦 Namibiya',g:'J. Afrika'},{c:'072',n:'🇧🇼 Botsvana',g:'J. Afrika'},{c:'716',n:'🇿🇼 Zimbabve',g:'J. Afrika'},{c:'894',n:'🇿🇲 Zambiya',g:'J. Afrika'},
  {c:'036',n:'🇦🇺 Avstraliya',g:'Okeaniya'},{c:'554',n:'🇳🇿 Yangi Zelandiya',g:'Okeaniya'},{c:'598',n:'🇵🇬 Papua Yangi Gvineya',g:'Okeaniya'},{c:'242',n:'🇫🇯 Fiji',g:'Okeaniya'}
];

function showTradeCountries(){
  var el = document.getElementById('trade-country-list');
  el.style.display = 'block';
  document.getElementById('trade-country-search').style.color = 'transparent';
  document.getElementById('trade-country-label').textContent = '';
  filterTradeCountries();
}

var _tradeCountryOpenGroups = {};
// Subregion → 6 ta qit'a (Finder filtridek)
function _tradeRegionToContinent(g){
  var s = String(g || '');
  if(s.indexOf('Yevropa') !== -1 || s === 'MDH') return 'Yevropa';
  if(s === 'Markaziy Osiyo' || s === 'Sharqiy Osiyo' || s === 'J-Sh Osiyo' || s === 'Janubiy Osiyo' || s === 'Yaqin Sharq' || s.indexOf('Osiyo') !== -1) return 'Osiyo';
  if(s === 'Shimoliy Amerika') return 'Shimoliy Amerika';
  if(s === 'Janubiy Amerika') return 'Janubiy Amerika';
  if(s === 'Okeaniya') return 'Okeaniya';
  if(s.indexOf('Afrika') !== -1) return 'Afrika';
  return s;
}
function filterTradeCountries(){
  var inSearch = document.getElementById('trade-country-inner-search');
  var extSearch = document.getElementById('trade-country-search');
  var q = inSearch ? (inSearch.value||'').toLowerCase().trim() : (extSearch ? (extSearch.value||'').toLowerCase().trim() : '');
  var el = document.getElementById('trade-country-list');
  var filtered = q.length > 0 ? TRADE_COUNTRIES.filter(function(c){
    var name = c.n.slice(c.n.indexOf(' ')+1).toLowerCase();
    return name.indexOf(q) !== -1 || c.g.toLowerCase().indexOf(q) !== -1 || c.c.indexOf(q) !== -1;
  }) : TRADE_COUNTRIES;

  var groups = {};
  var groupOrder = [];
  filtered.forEach(function(c){
    var cont = _tradeRegionToContinent(c.g);
    if(!groups[cont]){ groups[cont] = []; groupOrder.push(cont); }
    groups[cont].push(c);
  });
  // Qit'alar tartibi (Finder filtridek)
  var preferredOrder = ['Osiyo','Yevropa','Shimoliy Amerika','Janubiy Amerika','Afrika','Okeaniya'];
  groupOrder.sort(function(a,b){
    var ai = preferredOrder.indexOf(a), bi = preferredOrder.indexOf(b);
    if(ai === -1) ai = 99; if(bi === -1) bi = 99;
    return ai - bi;
  });

  var totalGroups = {};
  TRADE_COUNTRIES.forEach(function(c){
    var cont = _tradeRegionToContinent(c.g);
    totalGroups[cont] = (totalGroups[cont]||0) + 1;
  });

  var selectedCode = (document.getElementById('trade-country')||{}).value || '';

  var searchHtml =
    '<div style="padding:10px 14px 6px">'+
      '<div style="position:relative">'+
        '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9CA3AF;display:flex;align-items:center">'+
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>'+
        '</span>'+
        '<input id="trade-country-inner-search" type="text" placeholder="Davlat qidirish..." value="'+(q ? q.replace(/"/g,'&quot;') : '')+'" oninput="filterTradeCountries()" autocomplete="off" '+
          'style="border-radius:8px;background:#F9FAFB;border:1px solid #E5E7EB;padding:8px 10px 8px 30px;font-size:.78rem;width:100%;outline:none;color:#14233F;font-family:Inter,sans-serif">'+
      '</div>'+
    '</div>';

  if(!filtered.length){
    el.innerHTML = searchHtml + '<div style="padding:12px;text-align:center;color:#9CA3AF;font-size:.75rem">Topilmadi</div>';
    var inp1 = document.getElementById('trade-country-inner-search');
    if(inp1){ inp1.focus(); var L = inp1.value.length; try{ inp1.setSelectionRange(L,L); } catch(_e){} }
    return;
  }

  var listHtml = '<div style="padding:4px 14px 10px;display:flex;flex-direction:column;gap:1px">';
  groupOrder.forEach(function(gName){
    var arr = groups[gName];
    var totalInGroup = totalGroups[gName] || arr.length;
    var isOpen = !!_tradeCountryOpenGroups[gName] || q.length > 0;
    // Tanlangan davlat bu guruhda?
    var hasSelected = arr.some(function(c){ return c.c === selectedCode; });
    listHtml +=
      '<div style="border-top:1px solid #F3F4F6">'+
        '<div onclick="event.stopPropagation();toggleTradeCountryGroup(\''+gName.replace(/'/g,"\\'")+'\')" '+
          'style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;cursor:pointer;border-radius:8px;transition:background .15s" '+
          'onmouseenter="this.style.background=\'#F9FAFB\'" onmouseleave="this.style.background=\'transparent\'">'+
          '<span style="display:flex;align-items:center;gap:10px">'+
            '<span style="width:15px;height:15px;border-radius:4px;border:1.5px solid '+(hasSelected?'#465fff':'#D1D5DB')+';background:'+(hasSelected?'#465fff':'#fff')+';display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
              (hasSelected ? '<span style="color:#fff;font-size:9px;font-weight:700">✓</span>' : '')+
            '</span>'+
            '<span style="font-size:.78rem;font-weight:500;color:#344054">'+gName+'</span>'+
          '</span>'+
          '<span style="display:flex;align-items:center;gap:6px">'+
            '<span style="font-size:.65rem;font-weight:600;background:#EFF4FF;color:#465fff;padding:2px 7px;border-radius:5px;min-width:36px;text-align:center">'+(hasSelected?1:0)+'/'+totalInGroup+'</span>'+
            '<span style="color:#9CA3AF;transition:transform .2s;transform:rotate('+(isOpen?'90':'0')+'deg);display:flex;align-items:center">'+
              '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'+
            '</span>'+
          '</span>'+
        '</div>';
    if(isOpen){
      listHtml += '<div style="padding:4px 10px 8px;display:flex;flex-wrap:wrap;gap:.25rem">';
      arr.forEach(function(c){
        var cleanName = c.n.slice(c.n.indexOf(' ')+1);
        var sel = (selectedCode === c.c);
        listHtml += '<div onclick="event.stopPropagation();selectTradeCountry(\''+c.c+'\',\''+cleanName.replace(/'/g,"\\'")+'\')" '+
          'style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;cursor:pointer;font-size:.68rem;color:#344054;background:'+(sel?'rgba(70,95,255,.1)':'#F9FAFB')+';border-radius:6px;border:1px solid '+(sel?'rgba(70,95,255,.3)':'#E5E7EB')+';font-weight:500;transition:all .15s" '+
          'onmouseenter="this.style.background=\'rgba(70,95,255,.08)\'" onmouseleave="this.style.background=\''+(sel?'rgba(70,95,255,.1)':'#F9FAFB')+'\'">'+cleanName+'</div>';
      });
      listHtml += '</div>';
    }
    listHtml += '</div>';
  });
  listHtml += '</div>';
  el.innerHTML = searchHtml + listHtml;
  var inp = document.getElementById('trade-country-inner-search');
  if(inp){
    inp.focus();
    var len = inp.value.length;
    try{ inp.setSelectionRange(len, len); } catch(_e){}
  }
}

function toggleTradeCountryGroup(name){
  _tradeCountryOpenGroups[name] = !_tradeCountryOpenGroups[name];
  filterTradeCountries();
}

function selectTradeCountry(code, name){
  setTradeCountrySelection(code, name);
  if(typeof onTradeCountryChange === 'function') onTradeCountryChange();
}

// ═══════ Partner (hamkor davlat) — ikkinchi davlat tanlovi ═══════
function showTradePartnerCountries(){
  var el = document.getElementById('trade-partner-list');
  if(!el) return;
  el.style.display = 'block';
  document.getElementById('trade-partner-search').style.color = 'transparent';
  document.getElementById('trade-partner-label').textContent = '';
  filterTradePartnerCountries();
}

var _tradePartnerOpenGroups = {};
function filterTradePartnerCountries(){
  var inSearch = document.getElementById('trade-partner-inner-search');
  var extSearch = document.getElementById('trade-partner-search');
  var q = inSearch ? (inSearch.value||'').toLowerCase().trim() : (extSearch ? (extSearch.value||'').toLowerCase().trim() : '');
  var el = document.getElementById('trade-partner-list');
  if(!el) return;

  var primaryCode = (document.getElementById('trade-country')||{}).value || '';
  var allList = (typeof TRADE_COUNTRIES !== 'undefined' ? TRADE_COUNTRIES : []).filter(function(c){
    return c.c !== primaryCode;
  });
  var filtered = q.length > 0 ? allList.filter(function(c){
    var name = c.n.slice(c.n.indexOf(' ')+1).toLowerCase();
    return name.indexOf(q) !== -1 || c.g.toLowerCase().indexOf(q) !== -1 || c.c.indexOf(q) !== -1;
  }) : allList;

  var groups = {};
  var groupOrder = [];
  filtered.forEach(function(c){
    var cont = _tradeRegionToContinent(c.g);
    if(!groups[cont]){ groups[cont] = []; groupOrder.push(cont); }
    groups[cont].push(c);
  });
  var preferredOrder = ['Osiyo','Yevropa','Shimoliy Amerika','Janubiy Amerika','Afrika','Okeaniya'];
  groupOrder.sort(function(a,b){
    var ai = preferredOrder.indexOf(a), bi = preferredOrder.indexOf(b);
    if(ai === -1) ai = 99; if(bi === -1) bi = 99;
    return ai - bi;
  });

  var totalGroups = {};
  allList.forEach(function(c){
    var cont = _tradeRegionToContinent(c.g);
    totalGroups[cont] = (totalGroups[cont]||0) + 1;
  });

  var selectedCode = (document.getElementById('trade-partner-country')||{}).value || '';

  var searchHtml =
    '<div style="padding:10px 14px 6px">'+
      '<div style="position:relative">'+
        '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9CA3AF;display:flex;align-items:center">'+
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>'+
        '</span>'+
        '<input id="trade-partner-inner-search" type="text" placeholder="Importyor davlat qidirish..." value="'+(q ? q.replace(/"/g,'&quot;') : '')+'" oninput="filterTradePartnerCountries()" autocomplete="off" '+
          'style="border-radius:8px;background:#F9FAFB;border:1px solid #E5E7EB;padding:8px 10px 8px 30px;font-size:.78rem;width:100%;outline:none;color:#14233F;font-family:Inter,sans-serif">'+
      '</div>'+
    '</div>';

  if(!filtered.length){
    el.innerHTML = searchHtml + '<div style="padding:12px;text-align:center;color:#9CA3AF;font-size:.75rem">Topilmadi</div>';
    var inp1 = document.getElementById('trade-partner-inner-search');
    if(inp1){ inp1.focus(); var L = inp1.value.length; try{ inp1.setSelectionRange(L,L); } catch(_e){} }
    return;
  }

  var listHtml = '<div style="padding:4px 14px 10px;display:flex;flex-direction:column;gap:1px">';
  groupOrder.forEach(function(gName){
    var arr = groups[gName];
    var totalInGroup = totalGroups[gName] || arr.length;
    var isOpen = !!_tradePartnerOpenGroups[gName] || q.length > 0;
    var hasSelected = arr.some(function(c){ return c.c === selectedCode; });
    listHtml +=
      '<div style="border-top:1px solid #F3F4F6">'+
        '<div onclick="event.stopPropagation();toggleTradePartnerGroup(\''+gName.replace(/'/g,"\\'")+'\')" '+
          'style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;cursor:pointer;border-radius:8px;transition:background .15s" '+
          'onmouseenter="this.style.background=\'#F9FAFB\'" onmouseleave="this.style.background=\'transparent\'">'+
          '<span style="display:flex;align-items:center;gap:10px">'+
            '<span style="width:15px;height:15px;border-radius:4px;border:1.5px solid '+(hasSelected?'#10b981':'#D1D5DB')+';background:'+(hasSelected?'#10b981':'#fff')+';display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
              (hasSelected ? '<span style="color:#fff;font-size:9px;font-weight:700">✓</span>' : '')+
            '</span>'+
            '<span style="font-size:.78rem;font-weight:500;color:#344054">'+gName+'</span>'+
          '</span>'+
          '<span style="display:flex;align-items:center;gap:6px">'+
            '<span style="font-size:.65rem;font-weight:600;background:#ECFDF5;color:#10b981;padding:2px 7px;border-radius:5px;min-width:36px;text-align:center">'+(hasSelected?1:0)+'/'+totalInGroup+'</span>'+
            '<span style="color:#9CA3AF;transition:transform .2s;transform:rotate('+(isOpen?'90':'0')+'deg);display:flex;align-items:center">'+
              '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'+
            '</span>'+
          '</span>'+
        '</div>';
    if(isOpen){
      listHtml += '<div style="padding:4px 10px 8px;display:flex;flex-wrap:wrap;gap:.25rem">';
      arr.forEach(function(c){
        var cleanName = c.n.slice(c.n.indexOf(' ')+1);
        var sel = (selectedCode === c.c);
        listHtml += '<div onclick="event.stopPropagation();selectTradePartnerCountry(\''+c.c+'\',\''+cleanName.replace(/'/g,"\\'")+'\')" '+
          'style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;cursor:pointer;font-size:.68rem;color:#344054;background:'+(sel?'rgba(16,185,129,.12)':'#F9FAFB')+';border-radius:6px;border:1px solid '+(sel?'rgba(16,185,129,.4)':'#E5E7EB')+';font-weight:500;transition:all .15s" '+
          'onmouseenter="this.style.background=\'rgba(16,185,129,.08)\'" onmouseleave="this.style.background=\''+(sel?'rgba(16,185,129,.12)':'#F9FAFB')+'\'">'+cleanName+'</div>';
      });
      listHtml += '</div>';
    }
    listHtml += '</div>';
  });
  listHtml += '</div>';
  el.innerHTML = searchHtml + listHtml;
  var inp = document.getElementById('trade-partner-inner-search');
  if(inp){ inp.focus(); var len = inp.value.length; try{ inp.setSelectionRange(len, len); }catch(_e){} }
}

function toggleTradePartnerGroup(name){
  _tradePartnerOpenGroups[name] = !_tradePartnerOpenGroups[name];
  filterTradePartnerCountries();
}

function selectTradePartnerCountry(code, name){
  document.getElementById('trade-partner-country').value = code;
  var label = document.getElementById('trade-partner-label');
  label.textContent = '📥 ' + name;
  label.style.color = 'var(--text)';
  var clr = document.getElementById('trade-partner-clear');
  if(clr) clr.style.display = 'inline-flex';
  document.getElementById('trade-partner-list').style.display = 'none';
  document.getElementById('trade-partner-search').style.color = 'transparent';
  _updateTradeFlowVisibility();
}

function clearTradePartnerCountry(){
  document.getElementById('trade-partner-country').value = '';
  var label = document.getElementById('trade-partner-label');
  label.textContent = '🔍 Importyor davlat tanlang (ixtiyoriy)';
  label.style.color = 'var(--text3)';
  var clr = document.getElementById('trade-partner-clear');
  if(clr) clr.style.display = 'none';
  document.getElementById('trade-partner-list').style.display = 'none';
  _updateTradeFlowVisibility();
}

// Yo'nalish dropdown — ikki davlat tanlanganda yashirinadi
// (yo'nalish aniq: Eksportyor → Importyor = har doim X (eksport))
function _updateTradeFlowVisibility(){
  var primary = (document.getElementById('trade-country')||{}).value || '';
  var partner = (document.getElementById('trade-partner-country')||{}).value || '';
  var flowGroup = document.getElementById('trade-flow-group');
  var flowSel = document.getElementById('trade-flow');
  if(!flowGroup || !flowSel) return;
  if(primary && partner){
    flowGroup.style.display = 'none';
    flowSel.value = 'X'; // Eksportyor → Importyor = eksport
  } else {
    flowGroup.style.display = '';
  }
}

// Davlat kodi orqali toza nom (emoji/bayroqsiz) topish
function _getTradeCountryNameByCode(code){
  if(!code) return '';
  var list = (typeof TRADE_COUNTRIES !== 'undefined') ? TRADE_COUNTRIES : [];
  for(var i = 0; i < list.length; i++){
    if(list[i].c === code){
      var n = String(list[i].n || '');
      // "🇰🇷 South Korea" → "South Korea" (birinchi probelgacha bayroq olib tashlanadi)
      var spaceIdx = n.indexOf(' ');
      return spaceIdx > -1 ? n.slice(spaceIdx + 1) : n;
    }
  }
  return '';
}

// ═══════════════════════════════════════════════════════════════
// UN M49 davlat kodi → Finder English nomi (TradeAtlas integratsiyasi uchun)
// TRADE_COUNTRIES (UN code) → FINDER_SOURCE_REGIONS (English) ko'prik
// ═══════════════════════════════════════════════════════════════
var UN_CODE_TO_FINDER_NAME = {
  '860':'Uzbekistan','398':'Kazakhstan','417':'Kyrgyzstan','762':'Tajikistan','795':'Turkmenistan',
  '643':'Russia','031':'Azerbaijan','268':'Georgia','051':'Armenia','112':'Belarus','804':'Ukraine','498':'Moldova',
  '156':'China','392':'Japan','410':'South Korea','408':'North Korea','496':'Mongolia','158':'China','344':'China',
  '360':'Indonesia','458':'Malaysia','764':'Thailand','704':'Vietnam','608':'Philippines','702':'Singapore','104':'Myanmar','116':'Cambodia','418':'Laos',
  '356':'India','586':'Pakistan','050':'Bangladesh','144':'Sri Lanka','524':'Nepal','004':'Afghanistan','064':'Bhutan','462':'Maldives',
  '792':'Turkey','364':'Iran','368':'Iraq','682':'Saudi Arabia','784':'United Arab Emirates','634':'Qatar','414':'Kuwait','512':'Oman','048':'Bahrain','400':'Jordan','422':'Lebanon','760':'Syria','376':'Israel','887':'Yemen','196':'Cyprus',
  '276':'Germany','250':'France','826':'United Kingdom','380':'Italy','724':'Spain','528':'Netherlands','056':'Belgium','040':'Austria','756':'Switzerland','372':'Ireland',
  '752':'Sweden','578':'Norway','208':'Denmark','246':'Finland','352':'Iceland','233':'Estonia','428':'Latvia','440':'Lithuania',
  '616':'Poland','203':'Czech Republic','348':'Hungary','642':'Romania','100':'Bulgaria','703':'Slovakia','705':'Slovenia','191':'Croatia','688':'Serbia','070':'Bosnia and Herzegovina','807':'North Macedonia','008':'Albania','499':'Montenegro',
  '620':'Portugal','300':'Greece',
  '842':'United States','124':'Canada','484':'Mexico',
  '192':'Cuba','214':'Dominican Republic','332':'Haiti','388':'Jamaica','320':'Guatemala','188':'Costa Rica','591':'Panama',
  '076':'Brazil','032':'Argentina','152':'Chile','170':'Colombia','604':'Peru','862':'Venezuela','218':'Ecuador','068':'Bolivia','600':'Paraguay','858':'Uruguay',
  '818':'Egypt','504':'Morocco','012':'Algeria','788':'Tunisia','434':'Libya','736':'Sudan',
  '566':'Nigeria','288':'Ghana','384':'Ivory Coast','686':'Senegal','466':'Mali',
  '404':'Kenya','834':'Tanzania','231':'Ethiopia','800':'Uganda','646':'Rwanda','508':'Mozambique',
  '180':'DR Congo','120':'Cameroon','178':'Congo',
  '710':'South Africa','024':'Angola','516':'Namibia','072':'Botswana','716':'Zimbabwe','894':'Zambia',
  '036':'Australia','554':'New Zealand','598':'Papua New Guinea','242':'Fiji'
};

function _unCodeToFinderName(code){
  if(!code) return '';
  var raw = String(code);
  while(raw.length < 3) raw = '0' + raw;
  return UN_CODE_TO_FINDER_NAME[raw] || UN_CODE_TO_FINDER_NAME[String(code)] || '';
}

// ═══════════════════════════════════════════════════════════════
// Navoiy mahsulot row click → TradeAtlas inline modal (Trade sahifasi)
// Trade sahifasidagi tanlangan eksportyor/importyor davlatlardan foydalanadi
// Finder bo'limiga o'tmaydi — modal o'sha yerda ishlaydi
// ═══════════════════════════════════════════════════════════════
async function openTradeAtlasFromNavoi(hsCode, productName){
  var hs = String(hsCode||'').replace(/\D/g,'');
  if(!hs){
    if(typeof toast === 'function') toast('⚠️ HS kod topilmadi','error');
    return;
  }
  // ═══ Toggle: agar shu HS uchun panel ochiq bo'lsa, yopamiz ═══
  var existingPanel = document.querySelector('tr.navoi-ta-inline-row');
  if(existingPanel){
    var openHs = existingPanel.dataset.hs || '';
    existingPanel.remove();
    // Agar boshqa HS bosilgan bo'lsa, yangi panel ochamiz; aks holda shunchaki yopiladi
    if(openHs === hs) return;
  }
  var exporterCode = (document.getElementById('trade-country')||{}).value || '';
  var importerCode = (document.getElementById('trade-partner-country')||{}).value || '';
  var exporterName = _unCodeToFinderName(exporterCode);
  var importerName = _unCodeToFinderName(importerCode);

  if(!exporterCode && !importerCode){
    if(typeof toast === 'function') toast('⚠️ Avval Eksportyor yoki Importyor davlatni tanlang','error');
    return;
  }
  if(exporterCode && !exporterName){
    if(typeof toast === 'function') toast('⚠️ Eksportyor davlat TradeAtlas xaritasida topilmadi','error');
    return;
  }
  if(importerCode && !importerName){
    if(typeof toast === 'function') toast('⚠️ Importyor davlat TradeAtlas xaritasida topilmadi','error');
    return;
  }

  // ═══ Rejim ═══
  var mode = exporterName ? 'exporters' : 'importers';
  var meta = (typeof getFinderModeMeta === 'function') ? getFinderModeMeta(mode) : { mode:mode, resultWord:(mode==='exporters'?'eksportyorlari':'importyorlari') };

  // Synthetic prod (manual HS) — Finder funksiyalariga uzatiladi
  var prod = {
    id: 'navoi-trade-' + hs,
    hs_code: hs,
    name: 'HS ' + hs + (productName ? (' — ' + productName) : ''),
    name_uz: 'HS ' + hs + (productName ? (' — ' + productName) : ''),
    name_en: productName || ('HS ' + hs)
  };

  // Target/source ro'yxatlari (English names)
  var targetCountries = importerName ? [importerName] : ((typeof FINDER_ALWAYS_TARGET_COUNTRIES !== 'undefined') ? FINDER_ALWAYS_TARGET_COUNTRIES.slice() : []);
  var sourceEffective = exporterName ? [exporterName] : [];
  var sourceScope = {
    continents: [],
    countries: sourceEffective.slice(),
    effectiveCountries: sourceEffective.slice(),
    hasFilter: !!sourceEffective.length,
    summary: sourceEffective.join(', '),
    promptText: '',
    keywordHint: sourceEffective[0] || ''
  };

  // ═══ Modal yaratish (Trade sahifa uchun) ═══
  _navoiTaShowModal(prod, hs, exporterName, importerName, productName);

  try {
    // Cache pre-check
    if(typeof ensureCollectionLoaded === 'function'){
      try { await ensureCollectionLoaded('taFirmSnapshots'); } catch(_e){}
    }
    // ═══ Trade sahifasidagi YIL selektoridan sana oraligi (Finder year emas) ═══
    var tradeYearEl = document.getElementById('trade-year');
    var tradeYear = String((tradeYearEl && tradeYearEl.value) || '').trim();
    var dateRange;
    if(tradeYear && /^\d{4}$/.test(tradeYear)){
      dateRange = { startDate: tradeYear + '-01-01', endDate: tradeYear + '-12-31' };
    } else {
      // Trade year tanlanmagan — Import analysis fallback
      dateRange = (typeof getImportAnalysisDateRange === 'function') ? getImportAnalysisDateRange() : { startDate:'', endDate:'' };
    }
    // Finder funksiyalari Trade year'ni ko'rishi uchun #finder-year ham vaqtincha sinxronlashtiramiz
    var finderYearEl = document.getElementById('finder-year');
    var _origFinderYear = finderYearEl ? finderYearEl.value : null;
    if(finderYearEl && tradeYear && /^\d{4}$/.test(tradeYear)){
      finderYearEl.value = tradeYear;
    }
    console.log('[NavoiTA] Date range:', dateRange.startDate, '→', dateRange.endDate, '(Trade year:', tradeYear || 'none', ')');
    var targetCodes = targetCountries.map(getTradeAtlasCountryCode).filter(Boolean);
    var sourceCodes = (typeof filterTradeAtlasAfricanCodes === 'function')
      ? filterTradeAtlasAfricanCodes(sourceEffective.map(getTradeAtlasCountryCode).filter(Boolean))
      : sourceEffective.map(getTradeAtlasCountryCode).filter(Boolean);
    var snapIdFirms = (typeof _buildTaSnapshotId === 'function') ? _buildTaSnapshotId(prod, hs, targetCodes, sourceCodes, dateRange, 'firms') : '';
    var snapIdShipments = (typeof _buildTaSnapshotId === 'function') ? _buildTaSnapshotId(prod, hs, targetCodes, sourceCodes, dateRange, 'shipments') : '';
    var cacheFlags = {
      firms: !!(typeof _getTaSnapshot === 'function' && _getTaSnapshot(snapIdFirms)),
      shipments: !!(typeof _getTaSnapshot === 'function' && _getTaSnapshot(snapIdShipments))
    };

    _navoiTaSetStatus('⚙️ Sozlash modal ochiladi...');
    var taPreRes = await showTradeAtlasPreSearchConfirm(prod, meta, targetCountries, sourceScope, cacheFlags);
    if(!taPreRes || !taPreRes.confirmed){
      _navoiTaCloseModal();
      if(typeof toast === 'function') toast('ℹ️ TradeAtlas qidiruvi bekor qilindi','info');
      return;
    }
    var apiMode = taPreRes.apiMode || 'firms';
    var forceRefresh = !!taPreRes.forceRefresh;
    window._taApiMode = apiMode;
    window._taMaxLimit = Number(taPreRes.maxLimit) || 0;
    var snapId = apiMode === 'shipments' ? snapIdShipments : snapIdFirms;
    var cachedSnapshot = forceRefresh ? null : ((typeof _getTaSnapshot === 'function') ? _getTaSnapshot(snapId) : null);

    var label = exporterName && importerName ? (exporterName + ' → ' + importerName)
              : (exporterName ? (exporterName + ' (dunyoga)') : ('dunyodan → ' + importerName));
    _navoiTaSetStatus('🔍 TradeAtlas: HS '+hs+' | '+label+' ('+(apiMode==='shipments'?'shipments':'firms')+')...');

    var results;
    var actualApiMode = apiMode; // user'ning original tanlovi
    if(cachedSnapshot && Array.isArray(cachedSnapshot.results) && cachedSnapshot.results.length){
      results = cachedSnapshot.results.slice();
      _navoiTaSetStatus('💾 Firebase keshidan tiklandi: ' + results.length + ' kompaniya (kreditsiz)');
      if(typeof toast === 'function') toast('💾 Saqlangan natija: ' + results.length + ' (kreditsiz)', 'success');
    } else if(apiMode === 'shipments'){
      // Shipments mode — proxy ba'zan 404 qaytaradi, shu sabab firms fallback ishlaydi
      try {
        results = await tradeAtlasFinderSearch(prod, meta, targetCountries, sourceScope);
      } catch(shipErr){
        console.warn('[NavoiTA] Shipments search failed:', shipErr && shipErr.message);
        results = [];
      }
      // Agar shipments mode 0 natija qaytarsa — firms mode'ga avtomatik o'tamiz
      if(!Array.isArray(results) || !results.length){
        _navoiTaSetStatus('⚠️ Shipments rejimida natija yo\'q. Firmalar rejimiga o\'tilmoqda...');
        if(typeof toast === 'function') toast('⚠️ Shipments rejimi natija qaytarmadi — Firmalar rejimida sinab ko\'ramiz','info');
        try {
          results = await tradeAtlasFirmsOnlySearch(prod, meta, targetCountries, sourceScope);
          actualApiMode = 'firms';
          if(Array.isArray(results) && results.length){
            // Yangi snapId firms uchun
            snapId = snapIdFirms;
          }
        } catch(firmsErr){
          console.warn('[NavoiTA] Firms fallback failed:', firmsErr && firmsErr.message);
          results = [];
        }
      }
    } else {
      results = await tradeAtlasFirmsOnlySearch(prod, meta, targetCountries, sourceScope);
    }
    apiMode = actualApiMode;
    if(!Array.isArray(results) || !results.length){
      _navoiTaSetStatus('');
      var emptyHs = hs;
      var emptyFlow = (exporterName && importerName) ? (exporterName + ' → ' + importerName)
                    : (exporterName ? exporterName : importerName);
      var emptyHints = '<ul style="margin:.6rem 0 0;padding:0 0 0 1.1rem;text-align:left;color:#475569;font-size:.78rem;line-height:1.65">' +
        '<li>HS kod yetarlicha keng emas — <b>4 raqamga qisqartirib</b> ko\'ring (masalan '+emptyHs.slice(0,4)+'XX)</li>' +
        '<li>Importyor davlatni <b>olib tashlang</b> — yana boshqasini sinab ko\'ring</li>' +
        '<li>Year selektorini boshqa yilga (2023, 2022) o\'zgartiring</li>' +
        (apiMode === 'firms'
          ? '<li><b>📦 Shipmentlar (aniq)</b> rejimida sinab ko\'ring — natija boshqacha bo\'lishi mumkin</li>'
          : '<li><b>🏢 Firmalar (arzon)</b> rejimida sinab ko\'ring</li>') +
        '</ul>';
      _navoiTaSetBody(
        '<div style="padding:2rem;text-align:center;color:#475569;font-size:.85rem">' +
          '<div style="font-size:2rem;margin-bottom:.5rem">⚠️</div>' +
          '<div style="font-weight:700;color:#0f172a;margin-bottom:.3rem">Natija topilmadi</div>' +
          '<div style="font-size:.78rem;color:#64748b;margin-bottom:1rem">HS '+emptyHs+' · '+emptyFlow.replace(/</g,'&lt;')+' · '+(apiMode==='shipments'?'shipmentlar':'firmalar')+' · '+(dateRange.startDate.slice(0,4))+'</div>' +
          '<div style="background:#f8fafc;border-radius:10px;padding:.8rem 1rem;display:inline-block;max-width:480px">' +
            '<div style="font-weight:700;color:#0f172a;font-size:.78rem;margin-bottom:.3rem">💡 Bu nima degani?</div>' +
            '<div style="color:#64748b;font-size:.74rem;line-height:1.55">TradeAtlas bazasida ushbu HS kod, davlat va yil kombinatsiyasi bo\'yicha kompaniya yozuvlari yo\'q. Bu xatolik emas — shu mahsulot oqimi shu davlatlar o\'rtasida hujjatlanmagan bo\'lishi mumkin.</div>' +
            emptyHints +
          '</div>' +
        '</div>'
      );
      return;
    }

    // ═══ Yangi natija — Firebase keshiga saqlash ═══
    // Format finder.js'dagi `_saveTaSnapshot` chaqirig'i bilan moslashtirilgan
    if(!cachedSnapshot && typeof _saveTaSnapshot === 'function' && Array.isArray(results) && results.length){
      var snapshotPayload = {
        id: snapId,
        productId: String(prod.id || ''),
        productName: String(prod.name_en || prod.name_uz || prod.name || 'HS '+hs),
        hsCode: hs,
        targetCodes: (targetCodes || []).slice().sort(),
        sourceCodes: (sourceCodes || []).slice().sort(),
        startDate: (dateRange && dateRange.startDate) || '',
        endDate: (dateRange && dateRange.endDate) || '',
        apiMode: apiMode,
        results: results.slice(),
        cachedAt: new Date().toISOString()
      };
      console.log('[NavoiTA] Saving snapshot to Firebase:', snapshotPayload.id, 'firms:', results.length);
      try {
        await _saveTaSnapshot(snapshotPayload);
        if(typeof toast === 'function') toast('💾 '+results.length+' kompaniya Firebase keshiga saqlandi','success');
      } catch(saveErr){
        console.warn('[NavoiTA] Snapshot save fail:', saveErr && saveErr.message);
        if(typeof toast === 'function') toast('⚠️ Kesh saqlash xatosi: '+(saveErr && saveErr.message || 'noma\'lum'),'error');
      }
    }

    _navoiTaRenderResults(results, prod, meta, hs, exporterName, importerName);
  } catch(err){
    console.error('openTradeAtlasFromNavoi error:', err);
    _navoiTaSetStatus('');
    _navoiTaSetBody('<div style="padding:2rem;text-align:center;color:#dc2626;font-size:.85rem">❌ Xato: '+(err && err.message ? String(err.message).replace(/</g,'&lt;') : 'noma\'lum')+'</div>');
  } finally {
    // Finder year selektorini tiklash (boshqa komponentlarga ta'sir qilmasligi uchun)
    try {
      var _fye = document.getElementById('finder-year');
      if(_fye && typeof _origFinderYear !== 'undefined' && _origFinderYear !== null){
        _fye.value = _origFinderYear;
      }
    } catch(_re){}
  }
}
window.openTradeAtlasFromNavoi = openTradeAtlasFromNavoi;

// ─── Inline expandable row (modal o'rniga) ─────────────────────
// Mahsulot qatori OSTIDA colspan TR yaratamiz, click qaytsa yopiladi
function _navoiTaShowModal(prod, hs, exporterName, importerName, productName){
  // Bu nom backward-compat uchun saqlanadi — endi inline ochiladi
  return _navoiTaShowInline(prod, hs, exporterName, importerName, productName);
}
function _navoiTaShowInline(prod, hs, exporterName, importerName, productName){
  // Avvalgi inline panellarni yopib qo'yamiz
  document.querySelectorAll('tr.navoi-ta-inline-row').forEach(function(r){ r.remove(); });
  // Click qilingan qatorni topamiz (HS kod orqali)
  var tb = document.getElementById('trade-tbody');
  if(!tb) return;
  // tr ichidan onclick'da hs ma'lumoti bilan moslashadiganini topamiz
  var targetRow = null;
  var rows = tb.querySelectorAll('tr');
  for(var i = 0; i < rows.length; i++){
    var oc = rows[i].getAttribute('onclick') || '';
    if(oc.indexOf("openTradeAtlasFromNavoi('"+hs+"'") !== -1){
      targetRow = rows[i];
      break;
    }
  }
  if(!targetRow){
    // Fallback: birinchi qator pastiga
    targetRow = tb.firstElementChild;
  }
  // Yangi inline row
  var inlineTr = document.createElement('tr');
  inlineTr.className = 'navoi-ta-inline-row';
  inlineTr.id = 'navoiTaInlineRow';
  inlineTr.dataset.hs = hs;
  var flow = exporterName && importerName
    ? ('🚢 ' + exporterName + ' → ' + importerName)
    : (exporterName ? ('🚢 ' + exporterName + ' (dunyoga)') : ('🌍 dunyodan → ' + (importerName||'—')));
  var titleProduct = productName ? (' — ' + String(productName).slice(0,60).replace(/</g,'&lt;')) : '';
  inlineTr.innerHTML =
    '<td colspan="7" style="padding:0;background:#f8fafc;border-top:2px solid #0ea5e9;border-bottom:2px solid #0ea5e9">'+
      '<div style="background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;padding:.85rem 1.2rem;display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;margin-bottom:3px">📊 TradeAtlas — HS '+hs+'</div>'+
          '<div style="font-size:.95rem;font-weight:700;line-height:1.3">'+flow+titleProduct+'</div>'+
          '<div id="navoiTaStatus" style="margin-top:.3rem;font-size:.7rem;color:#cbd5e1"></div>'+
        '</div>'+
        '<button onclick="_navoiTaCloseModal()" type="button" style="background:rgba(255,255,255,.1);border:none;color:#fff;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:700;flex-shrink:0">✕</button>'+
      '</div>'+
      '<div id="navoiTaBody" style="background:#fff">'+
        '<div style="padding:1.5rem;text-align:center;color:#94a3b8;font-size:.85rem"><div style="display:inline-block;width:32px;height:32px;border:3px solid #e2e8f0;border-top-color:#0ea5e9;border-radius:50%;animation:spin 1s linear infinite"></div><div style="margin-top:.6rem">Tayyorlanmoqda...</div></div>'+
      '</div>'+
      '<div id="navoiTaFooter" style="padding:.7rem 1.2rem;border-top:1px solid #e2e8f0;background:#f8fafc;display:none;justify-content:space-between;align-items:center;gap:1rem"></div>'+
    '</td>';
  // Click qilingan qator OSTIGA qo'shamiz
  if(targetRow.nextSibling){
    targetRow.parentNode.insertBefore(inlineTr, targetRow.nextSibling);
  } else {
    targetRow.parentNode.appendChild(inlineTr);
  }
  // Spinner CSS bir marta inject
  if(!document.getElementById('navoiTaSpinKf')){
    var st = document.createElement('style');
    st.id = 'navoiTaSpinKf';
    st.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(st);
  }
  // Skroll qilib yangi panelga olib boramiz
  setTimeout(function(){
    try { inlineTr.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(_e){}
  }, 80);
}
function _navoiTaCloseModal(){
  // Inline rowni o'chirish (backward-compat: modal nomi saqlangan)
  document.querySelectorAll('tr.navoi-ta-inline-row').forEach(function(r){ r.remove(); });
  var legacy = document.getElementById('navoiTaModal');
  if(legacy) legacy.remove();
}
function _navoiTaSetStatus(text){
  var el = document.getElementById('navoiTaStatus');
  if(el) el.textContent = text || '';
}
function _navoiTaSetBody(html){
  var el = document.getElementById('navoiTaBody');
  if(el) el.innerHTML = html;
}

// ─── Natijalar — Investor card stilida (xuddi forum-detail.js'dagi kabi) ─────
function _navoiTaRenderResults(results, prod, meta, hs, exporterName, importerName){
  // Tartiblash: trade value bo'yicha kamayuvchi
  var rows = results.slice().sort(function(a,b){
    return (Number(b._tradeAtlasTradeValue||0) - Number(a._tradeAtlasTradeValue||0));
  });
  window._navoiTaLastResults = rows;
  window._navoiTaLastProd = prod;
  window._navoiTaLastMeta = meta;
  window._navoiTaLastHs = hs;

  var totalValue = rows.reduce(function(s,r){ return s + Number(r._tradeAtlasTradeValue||0); }, 0);
  var totalQty = rows.reduce(function(s,r){ return s + Number(r._tradeAtlasQuantity||0); }, 0);
  var totalDocs = rows.reduce(function(s,r){ return s + Number(r._tradeAtlasDocCount||0); }, 0);
  var fmtUsd = (typeof formatTradeAtlasUsd === 'function') ? formatTradeAtlasUsd : function(v){return '$'+Number(v||0).toLocaleString();};
  var modeIsExporter = (meta && meta.mode === 'exporters');

  var html = '<div style="padding:.8rem 1.4rem .4rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.6rem;background:#f8fafc;border-bottom:1px solid #e2e8f0">'+
    _navoiTaKpi('Kompaniyalar', String(rows.length), '#0ea5e9')+
    _navoiTaKpi('Jami qiymat', fmtUsd(totalValue), '#10b981')+
    _navoiTaKpi('Jami hujjatlar', String(totalDocs), '#f59e0b')+
    _navoiTaKpi('Jami hajm', totalQty ? Math.round(totalQty).toLocaleString()+' kg' : '—', '#6366f1')+
  '</div>';

  html += '<div style="padding:.8rem 1rem;display:flex;flex-direction:column;gap:.7rem;background:#fafbfc">';
  rows.forEach(function(r, i){
    html += _navoiTaCardHtml(r, i, modeIsExporter, hs, prod);
  });
  html += '</div>';

  _navoiTaSetBody(html);
  _navoiTaSetStatus('✅ '+rows.length+' kompaniya topildi');

  // Footer: hammasini saqlash + yopish
  var footer = document.getElementById('navoiTaFooter');
  if(footer){
    footer.style.display = 'flex';
    // Counterpart firmlar sonini hisoblash
    var totalCounterparts = rows.reduce(function(s, r){
      return s + (Array.isArray(r._tradeAtlasCounterpartFirms) ? r._tradeAtlasCounterpartFirms.length : 0);
    }, 0);
    var saveLabel = totalCounterparts
      ? '💾 Hammasini saqlash ('+rows.length+' eksportyor + ~'+totalCounterparts+' importyor)'
      : '💾 Hammasini saqlash ('+rows.length+')';
    footer.innerHTML =
      '<div style="font-size:.7rem;color:#64748b">💡 Eksportyor + uning importyor xaridorlari investor bazasiga saqlanadi</div>'+
      '<div style="display:flex;gap:.6rem">'+
        '<button id="navoiTaSaveAllBtn" type="button" style="background:#10b981;color:#fff;border:none;border-radius:10px;padding:.55rem 1rem;font-weight:700;cursor:pointer;font-size:.8rem">'+saveLabel+'</button>'+
        '<button id="navoiTaCloseBtn2" type="button" style="background:#fff;color:#475569;border:1.5px solid #e2e8f0;border-radius:10px;padding:.55rem 1rem;font-weight:600;cursor:pointer;font-size:.8rem">Yopish</button>'+
      '</div>';
    document.getElementById('navoiTaCloseBtn2').onclick = _navoiTaCloseModal;
    document.getElementById('navoiTaSaveAllBtn').onclick = function(){ _navoiTaSaveAll(this); };
  }
}

// ─── Bitta kompaniya kartochkasi (Investor stilida) ──────────────
function _navoiTaCardHtml(r, idx, modeIsExporter, hs, prod){
  var name = String(r.kompaniya || '—');
  var country = String(r.davlat || '');
  var city = String(r.shahar || '').trim();
  var website = String(r.website || '').trim();
  var initials = name.split(/\s+/).filter(Boolean).slice(0,2).map(function(w){return w.charAt(0).toUpperCase();}).join('') || 'TA';
  var flag = (typeof _COUNTRY_FLAG_MAP !== 'undefined' && country && _COUNTRY_FLAG_MAP[country]) ? _COUNTRY_FLAG_MAP[country] : '🌍';
  var roleHtml = modeIsExporter
    ? '<div style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:6px;background:linear-gradient(135deg,#059669,#047857);color:#fff;font-size:.6rem;font-weight:800;letter-spacing:.05em;box-shadow:0 2px 4px rgba(5,150,105,.25)">📤 EKSPORTYOR</div>'
    : '<div style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:6px;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;font-size:.6rem;font-weight:800;letter-spacing:.05em;box-shadow:0 2px 4px rgba(124,58,237,.25)">📥 IMPORTYOR</div>';

  // Counterpart (xaridor importyor) firmlar
  var counterFirms = Array.isArray(r._tradeAtlasCounterpartFirms) ? r._tradeAtlasCounterpartFirms : [];
  var counterToggleHtml = '';
  var counterListHtml = '';
  if(counterFirms.length){
    counterToggleHtml = '<div onclick="_navoiTaToggleCounter('+idx+',this)" style="cursor:pointer;color:#7C3AED;font-size:.7rem;font-weight:700;margin-top:6px;display:inline-flex;align-items:center;gap:4px">'+
      '<span class="navoi-ta-arrow" style="display:inline-block;transition:transform .15s">▶</span>'+
      '<span>'+counterFirms.length+' ta '+(modeIsExporter?'importyor':'eksportyor')+'</span>'+
    '</div>';
    counterListHtml = '<div id="navoiTaCounter'+idx+'" style="display:none;margin-top:6px;padding:8px;background:#FAF5FF;border-left:3px solid #7C3AED;border-radius:6px">'+
      '<div style="font-size:.6rem;color:#6B21A8;font-weight:700;letter-spacing:.04em;margin-bottom:4px;text-transform:uppercase">▼ BU '+(modeIsExporter?'EKSPORTYORDAN IMPORT':'IMPORTYORGA EKSPORT')+' QILGAN KOMPANIYALAR</div>';
    counterFirms.slice(0,10).forEach(function(cp){
      var cpName = String((cp && cp.name) || '—');
      var cpCountry = String((cp && cp.country) || '');
      var cpFlag = (typeof _COUNTRY_FLAG_MAP !== 'undefined' && cpCountry && _COUNTRY_FLAG_MAP[cpCountry]) ? _COUNTRY_FLAG_MAP[cpCountry] : '';
      var qty = Number((cp && cp.totalQty) || 0);
      var qtyTxt = qty >= 1e6 ? (qty/1e6).toFixed(1)+'M kg' : qty >= 1e3 ? (qty/1e3).toFixed(1)+'K kg' : (qty?Math.round(qty)+' kg':'');
      var val = Number((cp && cp.totalValue) || 0);
      var valTxt = val >= 1e6 ? '$'+(val/1e6).toFixed(1)+'M' : val >= 1e3 ? '$'+(val/1e3).toFixed(0)+'K' : (val?'$'+val:'');
      var dt = (cp && cp.lastDate) ? String(cp.lastDate).slice(0,10) : '';
      var meta = [qtyTxt,valTxt,dt?'📅 '+dt:''].filter(Boolean).join(' · ');
      counterListHtml += '<div style="font-size:.7rem;color:#5B21B6;line-height:1.45;padding:5px 6px;border-radius:5px">'+
        '<b style="color:#7C3AED">'+(modeIsExporter?'Importyor':'Eksportyor')+'</b> '+
        '<b>'+cpName.replace(/</g,'&lt;')+'</b>'+(cpFlag?' '+cpFlag:'')+(cpCountry?' '+cpCountry.replace(/</g,'&lt;'):'')+
        (meta?'<div style="color:#9CA3AF;font-size:.62rem;margin-top:2px;margin-left:4px">· '+meta+'</div>':'')+
      '</div>';
    });
    if(counterFirms.length > 10){
      counterListHtml += '<div style="font-size:.62rem;color:#9CA3AF;text-align:center;padding:4px;font-style:italic">+'+(counterFirms.length-10)+' ta yana</div>';
    }
    counterListHtml += '</div>';
  }

  // Trade qiymat va hajm chip'lari
  var tradeValue = Number(r._tradeAtlasTradeValue||0);
  var tradeQty = Number(r._tradeAtlasQuantity||0);
  var tradeDate = String(r._tradeAtlasLastArrivalDate||'').slice(0,10);
  var infoBits = [];
  if(tradeQty){
    var qtyT = tradeQty>=1e6?(tradeQty/1e6).toFixed(1)+'M':tradeQty>=1e3?(tradeQty/1e3).toFixed(1)+'K':String(Math.round(tradeQty));
    infoBits.push('<span style="background:rgba(5,150,105,.1);color:#059669;padding:2px 8px;border-radius:6px;font-weight:700">📦 '+qtyT+' kg</span>');
  }
  if(tradeValue){
    var valT = tradeValue>=1e6?'$'+(tradeValue/1e6).toFixed(1)+'M':tradeValue>=1e3?'$'+(tradeValue/1e3).toFixed(0)+'K':'$'+Math.round(tradeValue);
    infoBits.push('<span style="background:rgba(34,197,94,.1);color:#16A34A;padding:2px 8px;border-radius:6px;font-weight:700">💰 '+valT+'</span>');
  }
  if(tradeDate){
    infoBits.push('<span style="background:rgba(99,102,241,.08);color:#4338CA;padding:2px 8px;border-radius:6px;font-weight:600;font-size:.62rem">📅 '+tradeDate+'</span>');
  }
  var infoLine = infoBits.length ? '<div style="margin-top:5px;display:flex;gap:6px;flex-wrap:wrap;font-size:.65rem">'+infoBits.join('')+'</div>' : '';

  // Aloqa chip'lari
  var contactBits = [];
  if(r.email) contactBits.push('<a href="mailto:'+r.email+'" title="'+r.email.replace(/"/g,'&quot;')+'" style="background:#E0F2FE;color:#0369A1;padding:4px 7px;border-radius:6px;text-decoration:none;font-size:.65rem;font-weight:600">📧 Email</a>');
  if(r.telefon) contactBits.push('<a href="tel:'+r.telefon+'" style="background:#D1FAE5;color:#047857;padding:4px 7px;border-radius:6px;text-decoration:none;font-size:.65rem;font-weight:600">📞 Tel</a>');
  if(website){
    var safeWeb = website.indexOf('http')===0?website:'https://'+website;
    contactBits.push('<a href="'+safeWeb+'" target="_blank" rel="noopener" style="color:#6366F1;text-decoration:none;font-size:.7rem;font-weight:600">🌐 '+website.replace(/^https?:\/\//,'').replace(/^www\./,'').slice(0,40)+'</a>');
  }
  if(r.linkedin) contactBits.push('<a href="'+r.linkedin+'" target="_blank" style="background:#DBEAFE;color:#0A66C2;padding:4px 7px;border-radius:6px;text-decoration:none;font-size:.65rem;font-weight:600">💼 LI</a>');

  // HS + manual badge
  var hsBadge = '<span style="display:inline-flex;align-items:center;gap:5px;background:#FFF7ED;color:#9A3412;padding:4px 10px;border-radius:8px;font-size:.7rem;font-weight:700;border:1px solid #FED7AA">HS '+hs+' (manual)'+(prod && prod.name_uz ? ' — '+String(prod.name_uz).slice(0,30) : '')+'</span>';

  // Status chip'lar (TA, AI, Email, Calendar, Delete) — visual only (Lead topish bosilganda saqlanadi)
  var statusChips =
    '<span title="TradeAtlas" style="background:#1E40AF;color:#fff;width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.55rem;font-weight:800">TA</span>'+
    '<span title="AI" style="background:#F97316;color:#fff;width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:800">Ai</span>'+
    '<span title="Email" style="background:#06B6D4;color:#fff;width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.7rem">📨</span>'+
    '<span title="Calendar" style="background:#94A3B8;color:#fff;width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.7rem">📅</span>'+
    '<span title="Yuborilmagan" style="background:#FEF3C7;color:#92400E;padding:3px 9px;border-radius:6px;font-size:.6rem;font-weight:700">● Yuborilmagan</span>';

  return '<div id="navoiTaCard'+idx+'" style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:1rem 1.1rem;display:grid;grid-template-columns:46px 1fr auto;gap:1rem;align-items:flex-start;box-shadow:0 1px 3px rgba(0,0,0,.04)">'+
    // Avatar
    '<div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#A78BFA,#7C3AED);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.85rem">'+initials+'</div>'+
    // Main info
    '<div style="min-width:0">'+
      '<div style="margin-bottom:4px">'+roleHtml+'</div>'+
      '<div style="font-size:.95rem;font-weight:800;color:#0F172A;line-height:1.25">'+name.replace(/</g,'&lt;')+'</div>'+
      (website?'<div style="margin-top:2px"><a href="'+(website.indexOf('http')===0?website:'https://'+website)+'" target="_blank" rel="noopener" style="color:#6366F1;font-size:.7rem;text-decoration:none">'+website.replace(/^https?:\/\//,'').slice(0,60)+'</a></div>':'')+
      '<div style="margin-top:3px;font-size:.7rem;color:#475569;display:flex;align-items:center;gap:5px">'+
        '<span>'+flag+'</span>'+
        '<span>'+(country?country.replace(/</g,'&lt;'):'—')+(city && city!=='-' ? ', '+city.replace(/</g,'&lt;') : '')+'</span>'+
      '</div>'+
      infoLine+
      counterToggleHtml+
      counterListHtml+
      (contactBits.length?'<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">'+contactBits.join('')+'</div>':'')+
    '</div>'+
    // Right column: Lead topish + HS + status
    '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;min-width:200px">'+
      '<button onclick="_navoiTaSaveAndFindLead('+idx+',this)" style="background:linear-gradient(135deg,#7C3AED,#465fff);color:#fff;border:none;border-radius:10px;padding:9px 16px;font-size:.75rem;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(124,58,237,.35);white-space:nowrap">🔍 Lead topish</button>'+
      '<div>'+hsBadge+'</div>'+
      '<div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:flex-end">'+statusChips+'</div>'+
      '<button onclick="_navoiTaSaveOne('+idx+',this)" style="background:#0ea5e9;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:.65rem;font-weight:700;cursor:pointer" title="Eksportyor va uning importyor xaridorlarini bazaga saqlash">💾 Eksp+Imp saqlash</button>'+
    '</div>'+
  '</div>';
}

window._navoiTaToggleCounter = function(idx, el){
  var box = document.getElementById('navoiTaCounter'+idx);
  if(!box) return;
  var arrow = el && el.querySelector ? el.querySelector('.navoi-ta-arrow') : null;
  if(box.style.display === 'none' || !box.style.display){
    box.style.display = 'block';
    if(arrow) arrow.style.transform = 'rotate(90deg)';
  } else {
    box.style.display = 'none';
    if(arrow) arrow.style.transform = 'rotate(0deg)';
  }
};

// ─── Lead topish: kompaniyani saqlab keyin findContactsForInvestorRecord ──
window._navoiTaSaveAndFindLead = async function(idx, btn){
  var rows = window._navoiTaLastResults || [];
  var item = rows[idx];
  if(!item){ if(typeof toast==='function') toast('⚠️ Item topilmadi','error'); return; }
  // Avval saqlash (yoki mavjud bo'lsa qaytadan ishlatish)
  var rec = _navoiTaSaveToInvestorCompanies(item, window._navoiTaLastProd, window._navoiTaLastMeta, true);
  if(!rec){
    if(typeof toast==='function') toast('⚠️ Kompaniya saqlash muvaffaqiyatsiz','error');
    return;
  }
  if(btn){ btn.disabled = true; btn.textContent = '⏳ Lead izlash...'; btn.style.opacity = '.7'; }
  if(typeof window.findContactsForInvestorRecord === 'function'){
    try {
      await window.findContactsForInvestorRecord(rec.id, btn);
      if(btn){ btn.textContent = '✅ Lead topildi'; btn.style.background = '#10b981'; }
    } catch(e){
      console.error('Lead topish xato:', e);
      if(btn){ btn.disabled = false; btn.textContent = '🔍 Lead topish'; btn.style.opacity = '1'; }
      if(typeof toast === 'function') toast('❌ Lead topish xato: '+(e && e.message || ''),'error');
    }
  } else {
    if(typeof toast === 'function') toast('⚠️ Lead topish funksiyasi mavjud emas','error');
    if(btn){ btn.disabled = false; btn.textContent = '🔍 Lead topish'; btn.style.opacity = '1'; }
  }
};
function _navoiTaKpi(label, value, color){
  return '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:.5rem .7rem">'+
    '<div style="font-size:.55rem;text-transform:uppercase;color:#94a3b8;letter-spacing:.05em;font-weight:700">'+label+'</div>'+
    '<div style="font-size:1rem;font-weight:800;color:'+color+';margin-top:2px">'+value+'</div>'+
  '</div>';
}

// ─── Saqlash (Eksportyor + Importyor counterparts ham) ─────────
function _navoiTaSaveOne(idx, btn){
  var rows = window._navoiTaLastResults || [];
  var item = rows[idx];
  if(!item){ if(typeof toast==='function') toast('⚠️ Item topilmadi','error'); return; }
  var stats = _navoiTaSavePairWithPartners(item, window._navoiTaLastProd, window._navoiTaLastMeta);
  if(stats.parentSaved || stats.partnersAdded){
    if(btn){
      btn.textContent = '✅ Saqlandi ('+(stats.parentSaved?'1':'0')+'+'+stats.partnersAdded+')';
      btn.style.background = '#94a3b8';
      btn.disabled = true;
    }
    if(typeof toast === 'function'){
      var msg = '✅ Saqlandi: '+(item.kompaniya||'') + (stats.partnersAdded?(' + '+stats.partnersAdded+' ta importyor'):'');
      toast(msg,'success');
    }
  } else {
    if(typeof toast === 'function') toast('ℹ️ Allaqachon bazada bor: '+(item.kompaniya||''),'info');
  }
}
function _navoiTaSaveAll(btn){
  var rows = window._navoiTaLastResults || [];
  if(!rows.length){ if(typeof toast==='function') toast('⚠️ Saqlash uchun natija yo\'q','error'); return; }
  var addedParents = 0;
  var addedPartners = 0;
  rows.forEach(function(r){
    var s = _navoiTaSavePairWithPartners(r, window._navoiTaLastProd, window._navoiTaLastMeta);
    if(s.parentSaved) addedParents++;
    addedPartners += s.partnersAdded;
  });
  var total = addedParents + addedPartners;
  if(btn){ btn.textContent = '✅ '+total+' ta saqlandi'; btn.style.background = '#94a3b8'; btn.disabled = true; }
  if(typeof toast === 'function'){
    toast('✅ '+addedParents+' ta eksportyor + '+addedPartners+' ta importyor (jami '+total+') investor bazasiga saqlandi','success');
  }
}

// ═══ Parent (eksportyor/importyor) + uning counterpart firmalari (importyor/eksportyor) ═══
function _navoiTaSavePairWithPartners(item, prod, meta){
  var stats = { parentSaved: false, partnersAdded: 0 };
  if(!item || !String(item.kompaniya||'').trim()) return stats;
  // Parent saqlash
  var parentRec = _navoiTaSaveToInvestorCompanies(item, prod, meta, true);
  if(!parentRec) return stats;
  // Yangimi yoki eskimi — _navoiTaSaveToInvestorCompanies push qildi yoki existing qaytardi
  // Yangiligini aniqlash: createdAt < 1s oldin bo'lsa yangi saqlangan
  var nowMs = Date.now();
  var createdMs = parentRec.createdAt ? Date.parse(parentRec.createdAt) : 0;
  stats.parentSaved = (createdMs && nowMs - createdMs < 5000); // <5s = yangi

  // Counterpart firmalar (BU EKSPORTYORDAN IMPORT QILGAN KOMPANIYALAR)
  var counterFirms = Array.isArray(item._tradeAtlasCounterpartFirms) ? item._tradeAtlasCounterpartFirms : [];
  if(!counterFirms.length) return stats;

  var modeIsExporter = (meta && meta.mode === 'exporters') || (item.finderMode || '').toLowerCase().indexOf('exporter') !== -1;
  var partnerRole = modeIsExporter ? 'importer' : 'exporter';
  var parentRole = modeIsExporter ? 'exporter' : 'importer';

  if(!Array.isArray(parentRec._partners)) parentRec._partners = [];
  var parentChanged = false;

  counterFirms.forEach(function(cp){
    if(!cp || !String(cp.name||'').trim()) return;
    // Counterpart record sifatida saqlash
    var partnerSyntheticItem = {
      kompaniya: cp.name,
      davlat: cp.country || '',
      shahar: cp.cityState || '',
      website: cp.web || '',
      email: cp.email || '',
      telefon: cp.tel || '',
      linkedin: cp.linkedin || '',
      soha: item.soha || '',
      manba: 'TradeAtlas',
      finderMode: partnerRole + 's',
      score: item.score || 70,
      _tradeAtlasTradeValue: cp.totalValue || 0,
      _tradeAtlasQuantity: cp.totalQty || 0,
      _tradeAtlasDocCount: cp.docCount || 0,
      _tradeAtlasCountryCode: cp.countryCode || ''
    };
    var partnerRec = _navoiTaSaveToInvestorCompanies(partnerSyntheticItem, prod, { mode: partnerRole+'s' }, true);
    if(!partnerRec) return;
    var partnerKey = String(cp.name).trim().toLowerCase();

    // Yangi saqlanganmi?
    var pCreated = partnerRec.createdAt ? Date.parse(partnerRec.createdAt) : 0;
    var partnerIsNew = (pCreated && nowMs - pCreated < 5000);
    if(partnerIsNew) stats.partnersAdded++;

    // _partnerOf — counterpart record parent bilan bog'lanadi
    if(!Array.isArray(partnerRec._partnerOf)) partnerRec._partnerOf = [];
    var parentLinkKey = String(parentRec.kompaniya||'').trim().toLowerCase();
    var existingLink = partnerRec._partnerOf.find(function(p){
      return String(p.kompaniya||'').trim().toLowerCase() === parentLinkKey;
    });
    if(!existingLink){
      partnerRec._partnerOf.push({
        kompaniya: parentRec.kompaniya,
        davlat: parentRec.davlat || '',
        role: parentRole,
        totalValue: cp.totalValue || 0,
        totalQty: cp.totalQty || 0,
        docCount: cp.docCount || 0,
        lastDate: cp.lastDate || ''
      });
      if(typeof fbSave === 'function'){
        try { fbSave('investorCompanies', partnerRec); } catch(_e){}
      }
    }

    // Parent's _partners array
    var existingPartner = parentRec._partners.find(function(p){
      return String(p.kompaniya||'').trim().toLowerCase() === partnerKey;
    });
    if(!existingPartner){
      parentRec._partners.push({
        kompaniya: cp.name,
        davlat: cp.country || '',
        countryCode: cp.countryCode || '',
        cityState: cp.cityState || '',
        email: cp.email || '',
        tel: cp.tel || '',
        web: cp.web || '',
        role: partnerRole,
        totalValue: cp.totalValue || 0,
        totalQty: cp.totalQty || 0,
        docCount: cp.docCount || 0,
        lastDate: cp.lastDate || ''
      });
      parentChanged = true;
    }
  });

  if(parentChanged && typeof fbSave === 'function'){
    try { fbSave('investorCompanies', parentRec); } catch(_e){}
  }
  return stats;
}

function _navoiTaSaveToInvestorCompanies(item, prod, meta, returnRec){
  if(!item || !String(item.kompaniya||'').trim()) return returnRec ? null : false;
  if(!DB.investorCompanies) DB.investorCompanies = [];
  // Mavjudligini tekshirish
  var key = String(item.kompaniya).trim().toLowerCase();
  var existing = DB.investorCompanies.find(function(r){
    return String(r.kompaniya||'').trim().toLowerCase() === key;
  });
  if(existing){
    return returnRec ? existing : false; // duplicate (Lead topish uchun mavjud rec qaytaramiz)
  }
  var rec = {
    id: 'inv_jts_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
    kompaniya: item.kompaniya || '',
    rahbar: item.rahbar || '',
    lavozim: item.lavozim || '',
    email: item.email || '',
    telefon: item.telefon || '',
    davlat: item.davlat || '',
    shahar: item.shahar || '',
    soha: item.soha || '',
    linkedin: item.linkedin || '',
    website: item.website || '',
    description: item.description || '',
    keywords: item.keywords || '',
    daromad: item.daromad || '',
    score: item.score || 0,
    // Jahon Tashqi Savdosi bo'limidan saqlangan — alohida statistika va badge uchun
    manba: 'JahonTashqiSavdosi',
    _sourceBase: 'TradeAtlas', // asl ma'lumot manbai (TradeAtlas API)
    finderMode: item.finderMode || (meta && meta.mode) || 'exporters',
    mahsulotNomi: (prod && (prod.name_uz || prod.name_en || prod.name)) || '',
    productId: (prod && prod.id) || '',
    mahsulotHs: (prod && prod.hs_code) || '',
    contacts: Array.isArray(item.contacts) ? item.contacts : [],
    _tradeAtlasTradeValue: item._tradeAtlasTradeValue || 0,
    _tradeAtlasQuantity: item._tradeAtlasQuantity || 0,
    _tradeAtlasDocCount: item._tradeAtlasDocCount || 0,
    _tradeAtlasCountryCode: item._tradeAtlasCountryCode || '',
    _tradeAtlasHsCodes: item._tradeAtlasHsCodes || [],
    _tradeAtlasCounterpartCountries: item._tradeAtlasCounterpartCountries || [],
    createdAt: new Date().toISOString()
  };
  DB.investorCompanies.push(rec);
  if(typeof fbSave === 'function'){
    try { fbSave('investorCompanies', rec); } catch(_e){ console.warn('fbSave fail:', _e && _e.message); }
  }
  return returnRec ? rec : true;
}
window._navoiTaSaveOne = _navoiTaSaveOne;
window._navoiTaSaveAll = _navoiTaSaveAll;
window._navoiTaCloseModal = _navoiTaCloseModal;

// Eksportyor va importyor davlatlarni almashtirish
function swapTradeCountries(){
  var primaryCode = (document.getElementById('trade-country')||{}).value || '';
  var partnerCode = (document.getElementById('trade-partner-country')||{}).value || '';
  if(!primaryCode && !partnerCode){
    if(typeof toast === 'function') toast('Avval davlat tanlang','error');
    return;
  }
  // Toza nomlarni KOD orqali olish (regex emoji'ni kesishda buzilmaydi)
  var primaryName = _getTradeCountryNameByCode(primaryCode);
  var partnerName = _getTradeCountryNameByCode(partnerCode);

  if(primaryCode && !partnerCode){
    // primary -> partner
    if(typeof selectTradePartnerCountry === 'function') selectTradePartnerCountry(primaryCode, primaryName);
    if(typeof setTradeCountrySelection === 'function') setTradeCountrySelection('', '');
  } else if(!primaryCode && partnerCode){
    // partner -> primary
    if(typeof setTradeCountrySelection === 'function') setTradeCountrySelection(partnerCode, partnerName);
    if(typeof clearTradePartnerCountry === 'function') clearTradePartnerCountry();
  } else {
    // Ikkalasi bor — joyini almashtiramiz
    if(typeof setTradeCountrySelection === 'function') setTradeCountrySelection(partnerCode, partnerName);
    if(typeof selectTradePartnerCountry === 'function') selectTradePartnerCountry(primaryCode, primaryName);
  }
  _updateTradeFlowVisibility();
  if(typeof toast === 'function') toast('🔄 Davlatlar almashtirildi','info');
}

// Tashqarida bosilganda partner dropdown yopiladi
document.addEventListener('click', function(e){
  var wrap = document.getElementById('trade-partner-wrap');
  if(wrap && !wrap.contains(e.target)){
    var list = document.getElementById('trade-partner-list');
    if(list) list.style.display = 'none';
    var inp = document.getElementById('trade-partner-search');
    var label = document.getElementById('trade-partner-label');
    if(inp && label){
      if(document.getElementById('trade-partner-country').value){
        label.style.color = 'var(--text)';
      } else {
        label.textContent = '🔍 Hamkor davlat (ixtiyoriy)';
        label.style.color = 'var(--text3)';
      }
      inp.style.color = 'transparent';
    }
  }
});

// Click tashqarida yopish
document.addEventListener('click', function(e){
  var wrap = document.getElementById('trade-country-wrap');
  if(wrap && !wrap.contains(e.target)){
    document.getElementById('trade-country-list').style.display = 'none';
    var inp = document.getElementById('trade-country-search');
    var label = document.getElementById('trade-country-label');
    // Agar davlat tanlangan bo'lsa — nomni ko'rsatish
    if(inp && document.getElementById('trade-country').value){
      label.style.color = 'var(--text)';
    } else {
      label.textContent = '🔍 Davlat tanlang...';
      label.style.color = 'var(--text3)';
    }
    inp.style.color = 'transparent';
  }
});

// Klaviaturada harf yozganda avtomatik country search'ga focus
document.addEventListener('keydown', function(e){
  if(typeof currentPage==='undefined' || currentPage !== 'trade') return;
  var active = document.activeElement;
  if(active && (active.tagName==='INPUT' || active.tagName==='TEXTAREA' || active.tagName==='SELECT')) return;
  if(e.key && e.key.length === 1 && /[a-zA-Z0-9']/.test(e.key)){
    var searchInput = document.getElementById('trade-country-search');
    if(searchInput){
      searchInput.value = '';
      searchInput.focus();
      searchInput.style.color = 'transparent';
      document.getElementById('trade-country-label').textContent = '';
      // Harf qo'shiladi focus'dan keyin
      setTimeout(function(){
        searchInput.value = e.key;
        showTradeCountries();
        filterTradeCountries();
      }, 10);
      e.preventDefault();
    }
  }
});

var TRADE_SNAPSHOT_ROW_LIMIT = 1500;
var TRADE_SNAPSHOT_CHUNK_SIZE = 1200;
var TRADE_SNAPSHOT_VERSION = 3;
var _tradeData = [];
var _tradeCache = {};
var _tradeSource = '';
var _tradeMeta = {};
var _tradeViewMode = 'market';
var _tradeUzExportData = [];
var _tradeUzExportSource = '';
var _tradeUzExportMeta = {};
var _tradeUzExportCache = {};
var _tradeTariffData = [];
var _tradeTariffSource = '';
var _tradeTariffMeta = {};
var _tradeTariffCache = {};

function upsertDbRecord(listName, record){
  if(!DB[listName]) DB[listName] = [];
  var idx = DB[listName].findIndex(function(item){ return String(item.id)===String(record.id); });
  if(idx>=0) DB[listName][idx] = record;
  else DB[listName].push(record);
}

function removeDbRecord(listName, id){
  if(!DB[listName]) return;
  DB[listName] = DB[listName].filter(function(item){ return String(item.id)!==String(id); });
}

function getTradeSnapshotRows(snapshot){
  if(!snapshot) return [];
  if(Array.isArray(snapshot.data) && snapshot.data.length && (!snapshot.chunkCount || snapshot.version < 3)){
    return snapshot.data;
  }
  var chunks = (DB.tradeSnapshotChunks||[]).filter(function(chunk){
    return String(chunk.parentId||'') === String(snapshot.id||'');
  }).sort(function(a,b){
    return Number(a.index||0) - Number(b.index||0);
  });
  if(!chunks.length) return Array.isArray(snapshot.data) ? snapshot.data : [];
  var rows = [];
  chunks.forEach(function(chunk){
    (chunk.rows||[]).forEach(function(row){ rows.push(row); });
  });
  return rows;
}

function saveSettingsPatch(patch){
  if(!DB.settings) DB.settings = {};
  Object.keys(patch||{}).forEach(function(key){ DB.settings[key] = patch[key]; });
  if(typeof fbSaveSettings==='function') fbSaveSettings(DB.settings);
}

function setTradeCountrySelection(code, name){
  var searchEl = document.getElementById('trade-country-search');
  var labelEl = document.getElementById('trade-country-label');
  var hiddenEl = document.getElementById('trade-country');
  var listEl = document.getElementById('trade-country-list');
  if(hiddenEl) hiddenEl.value = code||'';
  if(searchEl){
    searchEl.value = name||'';
    searchEl.style.color = 'transparent';
  }
  if(labelEl){
    labelEl.textContent = name ? ('📤 ' + name) : '🔍 Eksportyor davlat tanlang...';
    labelEl.style.color = name ? 'var(--text)' : 'var(--text3)';
  }
  if(listEl) listEl.style.display = 'none';
  if(typeof _updateTradeFlowVisibility === 'function') _updateTradeFlowVisibility();
}

function buildTradeSnapshotId(countryCode, year, flow, hsLevel, hsFilter, partnerCode){
  // Partner kalitga kiritildi — har eksportyor↔importyor juftligi alohida saqlanadi
  // Eski snapshot id'lar bilan moslash uchun: partner bo'sh bo'lsa, eski format saqlanadi
  var partner = String(partnerCode||'').trim();
  var parts = ['trade',countryCode||'na',year||'na',flow||'M',hsLevel||'4',hsFilter||'all'];
  if(partner) parts.push('p'+partner);
  return parts.join('_').replace(/[^a-zA-Z0-9_-]/g,'_');
}

function normalizeTradeRows(rows){
  var grouped = {};
  (rows||[]).forEach(function(row, idx){
    var hsCode = String(row.hsCode||row.h||row.cmdCode||row.hs_code||row.commodityCode||'').trim();
    var description = row.description||row.d||row.cmdDesc||row.commodityDescription||'';
    var key = hsCode || description || ('row_'+idx);
    var value = Number(row.value||row.v||row.primaryValue||row.fobvalue||row.cifvalue||row.TradeValue||row.import_usd||0) || 0;
    var weight = Number(row.weight||row.w||row.netWgt||row.grossWgt||row.NetWeight||row.quantity||0) || 0;
    var partner2 = Number(row.partner2Code || row.partner2 || 0) || 0;
    var score = partner2===0 ? 2 : 1;

    var normalized = {
      hsCode: hsCode,
      description: description,
      value: value,
      weight: weight,
      partner: row.partner || row.partnerDesc || row.ptTitle || 'World',
      year: row.year || row.period || row.yr || '',
      flow: row.flow || '',
      _score: score
    };

    var current = grouped[key];
    if(!current || normalized._score > current._score || (normalized._score === current._score && normalized.value > current.value)){
      grouped[key] = normalized;
    }
  });

  return Object.keys(grouped).map(function(key){
    var row = grouped[key];
    delete row._score;
    return row;
  }).filter(function(row){
    return row.value > 0;
  }).sort(function(a,b){
    return (b.value||0) - (a.value||0);
  });
}

function buildNavoiProductRows(){
  var raws = DB.rawMaterials || [];
  var products = DB.products || [];
  var tradeRows = _tradeData || [];
  var grouped = {};

  // Birlashgan moslashtirish hovuzi: xomashyolar (47) + mahsulotlar (455)
  // Har bir element: { hs_code, name, type: 'raw'|'product', sector, raw_id }
  var pool = [];
  raws.forEach(function(r){
    if(!r || !r.hs_code) return;
    pool.push({
      hs_code: String(r.hs_code).replace(/\s+/g,''),
      name: r.name_uz || r.name_en || '—',
      type: 'raw',
      sector: r.main_sector || r.sector || 'Xomashyo',
      raw_id: r.id
    });
  });
  products.forEach(function(p){
    if(!p || !p.hs_code) return;
    pool.push({
      hs_code: String(p.hs_code).replace(/\s+/g,''),
      name: p.name_uz || p.name_en || '—',
      type: 'product',
      sector: p.main_sector || p.usage || 'Mahsulot',
      raw_id: p.raw_id
    });
  });

  pool.forEach(function(item){
    var navoiHs = item.hs_code;
    if(!navoiHs) return;
    var navoiHs4 = navoiHs.slice(0,4);
    var matchedTrade = tradeRows.find(function(t){
      var tradeHs = String(t.hsCode||'').replace(/\s+/g,'');
      var tradeHs4 = tradeHs.slice(0,4);
      if(!tradeHs) return false;
      return tradeHs === navoiHs || tradeHs.indexOf(navoiHs)===0 || navoiHs.indexOf(tradeHs)===0 || (navoiHs4 && tradeHs4 && navoiHs4 === tradeHs4);
    });
    if(!matchedTrade) return;
    var tradeHs = String(matchedTrade.hsCode || navoiHs).replace(/\s+/g,'');
    var key = tradeHs || navoiHs;
    if(!grouped[key]){
      grouped[key] = {
        hsCode: tradeHs || navoiHs,
        description: matchedTrade.description || item.name || '—',
        value: Number(matchedTrade.value||0),
        weight: Number(matchedTrade.weight||0),
        navoiNames: [],
        notes: [],
        tags: [],
        types: [],
        source: 'Navoi'
      };
    }
    if(grouped[key].navoiNames.indexOf(item.name) === -1) grouped[key].navoiNames.push(item.name);
    var tagPrefix = item.type === 'raw' ? '🪨 ' : '';
    var tag = tagPrefix + (item.sector || (item.type === 'raw' ? 'Xomashyo' : 'Mahsulot'));
    if(grouped[key].tags.indexOf(tag) === -1) grouped[key].tags.push(tag);
    if(grouped[key].types.indexOf(item.type) === -1) grouped[key].types.push(item.type);
  });

  return Object.keys(grouped).map(function(key){
    var row = grouped[key];
    row.navoiName = row.navoiNames[0] || 'Mavjud';
    row.note = '';
    row.tag = row.tags[0] || 'Navoiy mahsuloti';
    return row;
  }).sort(function(a,b){
    return (b.value||0) - (a.value||0);
  });
}

function getCurrentTradeRows(){
  if(_tradeViewMode === 'navoi') return buildNavoiProductRows();
  if(_tradeViewMode === 'uzexport') return _tradeUzExportData || [];
  return _tradeData || [];
}

function parseTariffRange(productCode){
  var code = String(productCode||'');
  var m = code.match(/^(\d{2})-(\d{2})_/);
  if(m) return { start: Number(m[1]), end: Number(m[2]) };
  var s = code.match(/^(\d{2})_/);
  if(s) return { start: Number(s[1]), end: Number(s[1]) };
  return null;
}

function getTariffInfoForHs(hsCode){
  var hs2 = parseInt(String(hsCode||'').replace(/\D/g,'').slice(0,2), 10);
  if(!hs2 || !_tradeTariffData || !_tradeTariffData.length) return null;
  var match = _tradeTariffData.find(function(row){
    var range = parseTariffRange(row.productCode);
    return range && hs2 >= range.start && hs2 <= range.end;
  });
  if(!match) return null;
  var rate = (match.appliedRate!=null && !isNaN(match.appliedRate)) ? Number(match.appliedRate) : ((match.mfnRate!=null && !isNaN(match.mfnRate)) ? Number(match.mfnRate) : null);
  if(rate==null || isNaN(rate)) return null;
  return {
    rate: rate,
    type: (match.appliedRate!=null && !isNaN(match.appliedRate)) ? 'AHS' : 'MFN',
    productCode: match.productCode,
    productName: match.productName || '',
    appliedRate: match.appliedRate,
    mfnRate: match.mfnRate
  };
}

function formatTariffCell(hsCode){
  if(String(document.getElementById('trade-country').value||'') === '860'){
    return '<span style="color:var(--text3);font-size:.58rem">—</span>';
  }
  if(_tradeTariffMeta && _tradeTariffMeta.loading){
    return '<span style="color:#6366f1;font-size:.58rem;font-weight:700">⏳ Yuklanmoqda</span>';
  }
  var info = getTariffInfoForHs(hsCode);
  if(!info){
    return '<span style="color:var(--text3);font-size:.58rem">—</span>';
  }
  var badgeColor = info.type === 'AHS' ? '#7c3aed' : '#f59e0b';
  var title = (info.type === 'AHS' ? 'Applied tariff (Uzbekistan)' : 'MFN tariff (World)') + ' • ' + (info.productName||info.productCode||'');
  return '<div title="'+String(title).replace(/"/g,'&quot;')+'"><span style="display:inline-block;background:'+badgeColor+';color:#fff;padding:2px 8px;border-radius:999px;font-size:.55rem;font-weight:700">'+info.rate.toFixed(2)+'%</span><div style="font-size:.52rem;color:var(--text3);margin-top:3px">'+info.type+'</div></div>';
}

async function loadTradeTariffData(countryCode, countryName, year){
  if(!countryCode || String(countryCode) === '860'){
    _tradeTariffData = [];
    _tradeTariffSource = '';
    _tradeTariffMeta = { emptyReason: 'same_country' };
    return;
  }
  var cacheKey = [countryCode, year].join('_');
  if(_tradeTariffCache[cacheKey]){
    _tradeTariffData = _tradeTariffCache[cacheKey].data||[];
    _tradeTariffSource = _tradeTariffCache[cacheKey].source||'WITS - UNCTAD TRAINS';
    _tradeTariffMeta = _tradeTariffCache[cacheKey].meta||{};
    return;
  }
  _tradeTariffMeta = { loading: true, countryCode: countryCode, countryName: countryName||'', year: year };
  var BASE = 'https://navoiy-api-proxy.vercel.app';
  var url = BASE+'/api/wits-tariff?reporter='+encodeURIComponent(countryCode)+'&partner=UZB&year='+encodeURIComponent(year||'2024');
  try{
    var resp = await fetch(url);
    var json = resp.ok ? await resp.json() : {data:[]};
    _tradeTariffData = Array.isArray(json.data) ? json.data : [];
    _tradeTariffSource = json.source || 'WITS - UNCTAD TRAINS';
    _tradeTariffMeta = {
      countryCode: countryCode,
      countryName: countryName || '',
      year: year,
      usedYear: json.year || year,
      requestedYear: json.requestedYear || year,
      isFallback: !!json.isFallback,
      count: _tradeTariffData.length
    };
    _tradeTariffCache[cacheKey] = {
      data: _tradeTariffData.slice(),
      source: _tradeTariffSource,
      meta: Object.assign({}, _tradeTariffMeta)
    };
  } catch(err){
    console.log('Trade tariff error:', err.message);
    _tradeTariffData = [];
    _tradeTariffSource = 'WITS - UNCTAD TRAINS';
    _tradeTariffMeta = { error: err.message, countryCode: countryCode, countryName: countryName||'', year: year };
  }
}

function ensureTradeTariffLoaded(countryCode, countryName, year){
  var samePayload =
    _tradeTariffMeta &&
    !_tradeTariffMeta.loading &&
    String(_tradeTariffMeta.countryCode||'') === String(countryCode||'') &&
    String(_tradeTariffMeta.year||'') === String(year||'');
  if(samePayload) return;
  loadTradeTariffData(countryCode, countryName, year).then(function(){
    var currentCode = document.getElementById('trade-country').value || '';
    var currentYear = document.getElementById('trade-year').value || '';
    if(String(currentCode) !== String(countryCode) || String(currentYear) !== String(year)) return;
    var flow = document.getElementById('trade-flow').value;
    renderTradeListView(countryName, flow==='M'?'Import':'Export', year);
  });
}

async function loadUzbekistanExportData(partnerCode, partnerName, year, hsLevel, hsFilter){
  if(!partnerCode || String(partnerCode) === '860'){
    _tradeUzExportData = [];
    _tradeUzExportSource = 'UN Comtrade';
    _tradeUzExportMeta = { emptyReason: 'same_country' };
    return;
  }
  var cacheKey = [partnerCode, year, hsLevel||'4', hsFilter||'all'].join('_');
  if(_tradeUzExportCache[cacheKey]){
    _tradeUzExportData = _tradeUzExportCache[cacheKey].data||[];
    _tradeUzExportSource = _tradeUzExportCache[cacheKey].source||'UN Comtrade';
    _tradeUzExportMeta = _tradeUzExportCache[cacheKey].meta||{};
    return;
  }
  var BASE = 'https://navoiy-api-proxy.vercel.app';
  var comtradeKey = (window._apiKeys && window._apiKeys.comtrade) || '';
  var url = BASE+'/api/trade?reporter=860&partner='+encodeURIComponent(partnerCode)+'&year='+encodeURIComponent(year)+'&flow=X&level='+encodeURIComponent(hsLevel||'4')+(hsFilter?'&hs='+encodeURIComponent(hsFilter):'')+(comtradeKey?'&key='+encodeURIComponent(comtradeKey):'');
  try{
    var resp = await fetch(url);
    var json = resp.ok ? await resp.json() : {data:[]};
    var rawData = json.data || [];
    _tradeUzExportData = normalizeTradeRows(rawData.map(function(r){
      return {
        hsCode: String(r.cmdCode||r.hs_code||r.commodityCode||''),
        description: r.cmdDesc || r.description || r.commodityDescription || '',
        value: r.primaryValue || r.fobvalue || r.cifvalue || r.TradeValue || 0,
        weight: r.netWgt || r.grossWgt || r.NetWeight || r.quantity || 0,
        partner: r.partnerDesc || r.partner || partnerName || 'World',
        year: r.period || r.yr || year,
        flow: 'X'
      };
    }).filter(function(r){
      if(!r.value || r.value <= 0) return false;
      if(hsFilter || hsLevel==='all') return true;
      var len = String(r.hsCode||'').length;
      if(hsLevel==='2') return len <= 2;
      if(hsLevel==='4') return len >= 3 && len <= 4;
      if(hsLevel==='6') return len >= 5 && len <= 6;
      return true;
    }));
    _tradeUzExportSource = json.source || 'UN Comtrade';
    _tradeUzExportMeta = {
      partnerCode: partnerCode,
      partnerName: partnerName || '',
      year: year,
      hsLevel: hsLevel || '4',
      hsFilter: hsFilter || ''
    };
    _tradeUzExportCache[cacheKey] = {
      data: _tradeUzExportData.slice(),
      source: _tradeUzExportSource,
      meta: Object.assign({}, _tradeUzExportMeta)
    };
  } catch(err){
    console.log('Uzbekistan export error:', err.message);
    _tradeUzExportData = [];
    _tradeUzExportSource = 'UN Comtrade';
    _tradeUzExportMeta = { error: err.message, partnerCode: partnerCode, partnerName: partnerName || '' };
  }
}

function ensureUzExportDataLoaded(countryCode, countryName, year, hsLevel, hsFilter){
  var samePayload =
    _tradeUzExportMeta &&
    String(_tradeUzExportMeta.partnerCode||'') === String(countryCode||'') &&
    String(_tradeUzExportMeta.year||'') === String(year||'') &&
    String(_tradeUzExportMeta.hsLevel||'4') === String(hsLevel||'4') &&
    String(_tradeUzExportMeta.hsFilter||'') === String(hsFilter||'');
  if(samePayload) return;
  loadUzbekistanExportData(countryCode, countryName, year, hsLevel, hsFilter).then(function(){
    var currentCode = document.getElementById('trade-country').value || '';
    var currentYear = document.getElementById('trade-year').value || '';
    if(String(currentCode) !== String(countryCode) || String(currentYear) !== String(year)) return;
    var flow = document.getElementById('trade-flow').value;
    renderTradeListView(countryName, flow==='M'?'Import':'Export', year);
  });
}

function renderTradeSubTabs(countryName){
  var tabs = document.getElementById('tradeSubTabs');
  if(!tabs) return;
  var marketCount = (_tradeData||[]).length;
  var navoiRows = buildNavoiProductRows();
  var navoiCount = navoiRows.length;
  var navoiTotalValue = navoiRows.reduce(function(sum, row){
    return sum + (Number(row.value)||0);
  }, 0);
  var exportCount = (_tradeUzExportData||[]).length;
  var iconNavoi = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px"><path d="M2 20h20M5 20V8l5 4V8l5 4V4h4v16"/></svg>';
  var iconExport = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
  var iconList = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';
  tabs.innerHTML =
    '<button class="trade-subtab '+(_tradeViewMode==='navoi'?'active':'')+'" onclick="setTradeViewMode(\'navoi\')">'+iconNavoi+'Navoiy viloyatida ishlab chiqariladigan mahsulotlar ('+navoiCount+' | '+formatTradeMoney(navoiTotalValue)+')</button>'+
    '<button class="trade-subtab '+(_tradeViewMode==='uzexport'?'active':'')+'" onclick="setTradeViewMode(\'uzexport\')">'+iconExport+'O\'zbekistondan '+(countryName||'shu davlatga')+' eksport bo\'lgan ('+exportCount+')</button>'+
    '<button class="trade-subtab '+(_tradeViewMode==='market'?'active':'')+'" onclick="setTradeViewMode(\'market\')">'+iconList+'Mahsulotlar ro\'yxati ('+marketCount+')</button>';
}

function renderTradeListView(countryName, flowName, year){
  var data = getCurrentTradeRows();
  var titleEl = document.getElementById('trade-title-text');
  var noteEl = document.getElementById('tradeViewNote');
  var tariffCol = document.getElementById('trade-tariff-col');
  var lastCol = document.getElementById('trade-last-col');
  var matchBtn = document.getElementById('trade-match-btn');
  var tb = document.getElementById('trade-tbody');
  var navProducts = DB.products || [];
  if(!tb) return;

  renderTradeSubTabs(countryName);

  if(_tradeViewMode === 'navoi'){
    var navoiTotalValue = data.reduce(function(sum, row){
      return sum + (Number(row.value)||0);
    }, 0);
    if(titleEl) titleEl.textContent = 'Navoiy viloyatida ishlab chiqariladigan mahsulotlar ro\'yxati';
    if(tariffCol) tariffCol.textContent = 'Tarif (%)';
    if(lastCol) lastCol.textContent = 'Navoiy mahsuloti';
    if(noteEl) noteEl.textContent = 'Tanlangan davlatning '+year+'-yildagi importi ichidan Navoiy viloyatida ishlab chiqariladigan mahsulotlar qoldirildi. Jami: '+data.length+' ta mahsulot, umumiy qiymat: '+formatTradeMoney(navoiTotalValue)+'. Tarif ustuni WITS - UNCTAD TRAINS rasmiy ma\'lumotidan olinadi.'+((_tradeTariffMeta&&_tradeTariffMeta.isFallback)?(' Tarif ma\'lumoti '+_tradeTariffMeta.usedYear+' yildan olindi.'):'');
    if(matchBtn) matchBtn.style.display = 'none';
    document.getElementById('trade-count').textContent = data.length+' | '+formatTradeMoney(navoiTotalValue);
    tb.innerHTML = data.length ? data.map(function(r,i){
      var valStr = r.value>=1e9?'$'+(r.value/1e9).toFixed(2)+'B':r.value>=1e6?'$'+(r.value/1e6).toFixed(1)+'M':'$'+(r.value/1e3).toFixed(0)+'K';
      var wStr = r.weight>=1e9?(r.weight/1e9).toFixed(0)+' Kt':r.weight>=1e6?(r.weight/1e6).toFixed(0)+' t':r.weight>=1e3?(r.weight/1e3).toFixed(0)+' kg':(r.weight||0)+' g';
      var tariffHtml = formatTariffCell(r.hsCode);
      var badgeHtml = (r.navoiNames||[r.navoiName||'Mavjud']).slice(0,4).map(function(name){
        return '<span style="display:inline-block;background:#059669;color:#fff;padding:2px 8px;border-radius:999px;font-size:.55rem;font-weight:700;margin:2px 4px 2px 0">'+name+'</span>';
      }).join('');
      if((r.navoiNames||[]).length > 4){
        badgeHtml += '<span style="display:inline-block;background:#e2e8f0;color:#0f172a;padding:2px 8px;border-radius:999px;font-size:.55rem;font-weight:700;margin:2px 4px 2px 0">+'+((r.navoiNames||[]).length-4)+' ta</span>';
      }
      var descExtra = r.note ? '<div style="font-size:.58rem;color:var(--text3);margin-top:2px">'+(r.note||'—')+'</div>' : '';
      var safeHs = String(r.hsCode||'').replace(/[^0-9]/g,'');
      var safeName = String(r.description||'').replace(/'/g,"\\'").replace(/"/g,'&quot;').slice(0,80);
      var clickHint = safeHs ? ('TradeAtlas qidiruv: HS '+safeHs+' (Eksportyor/Importyor davlatlari bo\'yicha)') : 'HS kod yo\'q';
      var rowAttrs = safeHs
        ? ' style="background:rgba(5,150,105,.04);cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'rgba(5,150,105,.12)\'" onmouseout="this.style.background=\'rgba(5,150,105,.04)\'" onclick="openTradeAtlasFromNavoi(\''+safeHs+'\',\''+safeName+'\')" title="'+clickHint.replace(/"/g,'&quot;')+'"'
        : ' style="background:rgba(5,150,105,.04)"';
      return '<tr'+rowAttrs+'>'+
        '<td>'+(i+1)+'</td>'+
        '<td style="font-family:monospace;font-size:.7rem;font-weight:700">'+(r.hsCode||'—')+'</td>'+
        '<td style="font-size:.7rem"><b>'+(r.description||'—')+'</b>'+descExtra+'</td>'+
        '<td style="font-weight:700;color:#059669">'+valStr+'</td>'+
        '<td style="font-size:.65rem;color:var(--text3)">'+wStr+'</td>'+
        '<td>'+tariffHtml+'</td>'+
        '<td title="'+String((r.tags||[]).join(', ') || r.tag || 'Navoiy mahsuloti').replace(/"/g,'&quot;')+'">'+badgeHtml+'</td>'+
      '</tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:var(--text3)">Tanlangan davlat importida Navoiyga mos mahsulot topilmadi</td></tr>';
    return;
  }

  if(_tradeViewMode === 'uzexport'){
    if(tariffCol) tariffCol.textContent = 'Tarif (%)';
    if(titleEl) titleEl.textContent = 'O\'zbekistondan '+(countryName||'shu davlatga')+' eksport bo\'lgan';
    if(lastCol) lastCol.textContent = 'Navoiy mos';
    if(noteEl){
      if(_tradeUzExportMeta && _tradeUzExportMeta.emptyReason === 'same_country') noteEl.textContent = 'Tanlangan davlat O\'zbekiston bo\'lgani uchun bu bo\'lim bo\'sh.';
      else noteEl.textContent = 'UN Comtrade orqali O\'zbekistondan shu davlatga eksport qilingan mahsulotlar. Tarif ustuni WITS - UNCTAD TRAINS rasmiy ma\'lumotidan olinadi.'+((_tradeTariffMeta&&_tradeTariffMeta.isFallback)?(' Tarif ma\'lumoti '+_tradeTariffMeta.usedYear+' yildan olindi.'):'');
    }
    if(matchBtn) matchBtn.style.display = '';
  } else {
    if(tariffCol) tariffCol.textContent = 'Tarif (%)';
    if(titleEl) titleEl.textContent = 'Mahsulotlar ro\'yxati';
    if(lastCol) lastCol.textContent = 'Navoiy mos';
    if(noteEl) noteEl.textContent = (countryName||'Tanlangan davlat')+' uchun '+flowName+' mahsulotlar ro\'yxati ('+year+'). Tarif ustuni WITS - UNCTAD TRAINS rasmiy ma\'lumotidan olinadi.'+((_tradeTariffMeta&&_tradeTariffMeta.isFallback)?(' Tarif ma\'lumoti '+_tradeTariffMeta.usedYear+' yildan olindi.'):'');
    if(matchBtn) matchBtn.style.display = '';
  }

  document.getElementById('trade-count').textContent = data.length;
  tb.innerHTML = data.length ? data.map(function(r,i){
    var valStr = r.value>=1e9?'$'+(r.value/1e9).toFixed(2)+'B':r.value>=1e6?'$'+(r.value/1e6).toFixed(1)+'M':'$'+(r.value/1e3).toFixed(0)+'K';
    var wStr = r.weight>=1e9?(r.weight/1e9).toFixed(0)+' Kt':r.weight>=1e6?(r.weight/1e6).toFixed(0)+' t':r.weight>=1e3?(r.weight/1e3).toFixed(0)+' kg':(r.weight||0)+' g';
    var tariffHtml = formatTariffCell(r.hsCode);
    var match = navProducts.find(function(p){
      return p.hs_code && r.hsCode && (p.hs_code.indexOf(r.hsCode)===0 || r.hsCode.indexOf(String(p.hs_code).replace(/\s/g,'').slice(0,4))===0);
    });
    var matchBadge = match ?
      '<span style="background:#059669;color:#fff;padding:2px 6px;border-radius:4px;font-size:.55rem;font-weight:700;cursor:pointer" onclick="event.stopPropagation();showPage(\'products\')" title="'+match.name_en+'">✅ '+match.name_en.slice(0,20)+'</span>' :
      '<span style="color:var(--text3);font-size:.55rem">—</span>';
    // ═══ TradeAtlas click handler — har row bosilganda HS kod va tanlangan davlatlar bilan qidirish ═══
    var safeHs = String(r.hsCode||'').replace(/[^0-9]/g,'');
    var safeName = String(r.description||'').replace(/'/g,"\\'").replace(/"/g,'&quot;').slice(0,80);
    var clickAttrs = '';
    var rowBgBase = match ? 'rgba(5,150,105,.04)' : '';
    var rowBgHover = match ? 'rgba(5,150,105,.12)' : 'rgba(99,102,241,.06)';
    if(safeHs){
      var clickHint = 'TradeAtlas qidiruv: HS '+safeHs+' (Eksportyor/Importyor davlatlari bo\'yicha)';
      clickAttrs = ' style="cursor:pointer;transition:background .15s'+(rowBgBase?(';background:'+rowBgBase):'')+'"' +
        ' onmouseover="this.style.background=\''+rowBgHover+'\'"' +
        ' onmouseout="this.style.background=\''+(rowBgBase||'')+'\'"' +
        ' onclick="openTradeAtlasFromNavoi(\''+safeHs+'\',\''+safeName+'\')"' +
        ' title="'+clickHint.replace(/"/g,'&quot;')+'"';
    } else if(match){
      clickAttrs = ' style="background:'+rowBgBase+'"';
    }
    return '<tr'+clickAttrs+'>'+
      '<td>'+(i+1)+'</td>'+
      '<td style="font-family:monospace;font-size:.7rem;font-weight:700">'+(r.hsCode||'—')+'</td>'+
      '<td style="font-size:.7rem">'+translateHS(r.hsCode,r.description)+'</td>'+
      '<td style="font-weight:700;color:'+(_tradeViewMode==='uzexport'?'#059669':(flowName==='Import'?'#EF233C':'#059669'))+'">'+valStr+'</td>'+
      '<td style="font-size:.65rem;color:var(--text3)">'+wStr+'</td>'+
      '<td>'+tariffHtml+'</td>'+
      '<td>'+matchBadge+'</td>'+
    '</tr>';
  }).join('') : '<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:var(--text3)">Bu bo\'lim uchun ma\'lumot topilmadi</td></tr>';
}

function setTradeViewMode(mode){
  _tradeViewMode = mode;
  var countryName = document.getElementById('trade-country-search').value;
  var flow = document.getElementById('trade-flow').value;
  var year = document.getElementById('trade-year').value;
  renderTradeListView(countryName, flow==='M'?'Import':'Export', year);
}

function getTradeSnapshot(countryCode, year, flow, hsLevel, hsFilter, partnerCode){
  var id = buildTradeSnapshotId(countryCode, year, flow, hsLevel, hsFilter, partnerCode);
  return (DB.tradeSnapshots||[]).find(function(item){ return String(item.id)===String(id); }) || null;
}

function restoreTradeSnapshot(snapshot, quiet){
  var snapshotRows = getTradeSnapshotRows(snapshot);
  if(!snapshot || !snapshotRows.length) return false;
  setTradeCountrySelection(snapshot.countryCode||'', snapshot.countryName||'');
  // Partner davlatni ham qaytaramiz (agar saqlangan bo'lsa)
  if(snapshot.partnerCode && typeof selectTradePartnerCountry === 'function'){
    try { selectTradePartnerCountry(snapshot.partnerCode, snapshot.partnerName || ''); } catch(_e){}
  } else if(typeof clearTradePartnerCountry === 'function' && !snapshot.partnerCode){
    try { clearTradePartnerCountry(); } catch(_e){}
  }
  var emptyEl = document.getElementById('tradeEmpty');
  var loadingEl = document.getElementById('tradeLoading');
  if(emptyEl) emptyEl.style.display = 'none';
  if(loadingEl) loadingEl.style.display = 'none';
  var yearEl = document.getElementById('trade-year');
  var flowEl = document.getElementById('trade-flow');
  var levelEl = document.getElementById('trade-hs-level');
  var hsEl = document.getElementById('trade-hs-filter');
  var nameEl = document.getElementById('trade-name-filter');
  if(yearEl && snapshot.year) yearEl.value = String(snapshot.year);
  if(flowEl && snapshot.flow) flowEl.value = String(snapshot.flow);
  if(levelEl && snapshot.hsLevel) levelEl.value = String(snapshot.hsLevel);
  if(hsEl) hsEl.value = snapshot.hsFilter||'';
  if(nameEl) nameEl.value = '';

  _tradeData = normalizeTradeRows((snapshotRows||[]).map(function(r){
    return {
      hsCode:r.h||r.hsCode||'',
      description:r.d||r.description||'',
      value:Number(r.v||r.value||0)||0,
      weight:Number(r.w||r.weight||0)||0,
      partner:'World',
      year:snapshot.year||'',
      flow:snapshot.flow||'M'
    };
  }));
  _tradeSource = snapshot.source||'UN Comtrade (cached)';
  _tradeMeta = {
    totalValue:Number(snapshot.totalValue||0)||null,
    isPartial:!!snapshot.isPartial || Number(snapshot.savedRowCount||0) < Number(snapshot.rowCount||0),
    hsFilter:snapshot.hsFilter||'',
    requestedLevel:snapshot.requestedLevel||snapshot.hsLevel||'4',
    requestedCmdCode:snapshot.requestedCmdCode||''
  };
  var restoredTotal = Number(_tradeMeta.totalValue||0)||0;
  var restoredSum = _tradeData.reduce(function(sum, row){ return sum + Number(row.value||0); }, 0);
  var restoredMax = _tradeData.length ? Number(_tradeData[0].value||0) : 0;
  if(restoredTotal > 0 && restoredTotal < Math.max(restoredMax, restoredSum)){
    _tradeMeta.totalValue = null;
  }
  // Render uchun partner mavjud bo'lsa, ↔ ko'rsatamiz
  var renderName = snapshot.partnerCode && snapshot.partnerName
    ? (snapshot.countryName||'') + ' ↔ ' + snapshot.partnerName
    : (snapshot.countryName||'');
  renderTradeResults(renderName, (snapshot.flow==='X'?'Export':'Import'), snapshot.year||'', snapshot.hsFilter||'');
  if(snapshot.version !== TRADE_SNAPSHOT_VERSION){
    saveTradeSnapshot(snapshot.countryName||'', snapshot.year||'', snapshot.flow||'M', snapshot.hsLevel||'4', snapshot.hsFilter||'', snapshot.partnerCode||'', snapshot.partnerName||'');
  }
  if(!quiet) toast('💾 Firebase keshidan ochildi: '+(snapshot.countryName||'')+(snapshot.partnerName?' ↔ '+snapshot.partnerName:'')+' '+(snapshot.year||''));
  return true;
}

function saveTradeSnapshot(countryName, year, flow, hsLevel, hsFilter, partnerCode, partnerName){
  if(!_tradeData.length) return;
  if((_tradeSource||'').indexOf('UN Comtrade')===-1) return;
  var countryCode = document.getElementById('trade-country').value||'';
  // Agar partner argumentlar uzatilmagan bo'lsa, DOM'dan o'qib olamiz (backward compat)
  if(typeof partnerCode === 'undefined'){
    var _pe = document.getElementById('trade-partner-country');
    partnerCode = _pe ? (_pe.value || '').trim() : '';
  }
  if(typeof partnerName === 'undefined'){
    var _pl = document.getElementById('trade-partner-label');
    partnerName = _pl ? String(_pl.textContent || '').replace(/^🤝\s*/, '').trim() : '';
  }
  var allRows = _tradeData.map(function(r){
    return {h:r.hsCode||'', d:r.description||'', v:Number(r.value||0)||0, w:Number(r.weight||0)||0};
  });
  var chunkedRows = [];
  for(var i=0;i<allRows.length;i+=TRADE_SNAPSHOT_CHUNK_SIZE){
    chunkedRows.push(allRows.slice(i, i+TRADE_SNAPSHOT_CHUNK_SIZE));
  }
  var snapshotId = buildTradeSnapshotId(countryCode, year, flow, hsLevel, hsFilter, partnerCode);
  var previous = (DB.tradeSnapshots||[]).find(function(item){ return String(item.id)===String(snapshotId); });
  var previousChunkCount = Number(previous && previous.chunkCount || 0);
  var snapshot = {
    id: snapshotId,
    version: TRADE_SNAPSHOT_VERSION,
    countryCode: countryCode,
    countryName: countryName||'',
    partnerCode: partnerCode||'',
    partnerName: partnerName||'',
    year: String(year||''),
    flow: String(flow||'M'),
    hsLevel: String(hsLevel||'4'),
    hsFilter: hsFilter||'',
    source: _tradeSource||'UN Comtrade',
    totalValue: Number((_tradeMeta&&_tradeMeta.totalValue)||0)||0,
    isPartial: !!(_tradeMeta&&_tradeMeta.isPartial),
    requestedLevel: (_tradeMeta&&_tradeMeta.requestedLevel)||hsLevel||'4',
    requestedCmdCode: (_tradeMeta&&_tradeMeta.requestedCmdCode)||'',
    rowCount: _tradeData.length,
    savedRowCount: allRows.length,
    chunkCount: chunkedRows.length,
    updatedAt: new Date().toISOString(),
    data: chunkedRows.length <= 1 ? allRows : []
  };
  upsertDbRecord('tradeSnapshots', snapshot);
  if(typeof fbSave==='function') fbSave('tradeSnapshots', snapshot);
  if(!DB.tradeSnapshotChunks) DB.tradeSnapshotChunks = [];
  chunkedRows.forEach(function(rows, idx){
    var chunk = {
      id: snapshotId+'__'+idx,
      parentId: snapshotId,
      index: idx,
      rowCount: rows.length,
      updatedAt: snapshot.updatedAt,
      rows: rows
    };
    upsertDbRecord('tradeSnapshotChunks', chunk);
    if(typeof fbSave==='function') fbSave('tradeSnapshotChunks', chunk);
  });
  for(var j=chunkedRows.length;j<previousChunkCount;j++){
    var staleId = snapshotId+'__'+j;
    removeDbRecord('tradeSnapshotChunks', staleId);
    if(typeof fbDelete==='function') fbDelete('tradeSnapshotChunks', staleId);
  }
  saveSettingsPatch({lastTradeSnapshotId:snapshot.id});
  if(typeof updateTradeFirebaseCount==='function') updateTradeFirebaseCount();
}

function restoreLastTradeSnapshot(){
  var lastId = DB.settings && DB.settings.lastTradeSnapshotId;
  if(!lastId) return false;
  var snapshot = (DB.tradeSnapshots||[]).find(function(item){ return String(item.id)===String(lastId); });
  if(!snapshot) return false;
  return restoreTradeSnapshot(snapshot, true);
}

async function loadGlobalTradeData(){
  var countryCode = document.getElementById('trade-country').value;
  if(!countryCode){ toast('⚠️ Davlat tanlang','error'); return; }
  var year = document.getElementById('trade-year').value;
  var flow = document.getElementById('trade-flow').value;
  var hsLevel = document.getElementById('trade-hs-level').value;
  var hsFilter = (document.getElementById('trade-hs-filter').value||'').trim().replace(/\s+/g,'');
  var countryName = document.getElementById('trade-country-search').value;
  // Hamkor davlat (partner) — bo'sh bo'lsa World (0)
  var partnerEl = document.getElementById('trade-partner-country');
  var partnerCode = partnerEl ? (partnerEl.value || '').trim() : '';
  var partnerLabelEl = document.getElementById('trade-partner-label');
  var partnerName = '';
  if(partnerCode && partnerLabelEl){
    partnerName = String(partnerLabelEl.textContent || '').replace(/^🤝\s*/, '').trim();
  }
  // Partner tanlangan bo'lsa — mahsulot bo'yicha breakdown (AG6) majburiy
  if(partnerCode && hsLevel === 'all'){ hsLevel = '6'; }
  var flowName = flow==='M'?'Import':'Export';

  // Check cache (partner ham kalitga kiritildi)
  var cacheKey = countryCode+'_'+(partnerCode||'world')+'_'+year+'_'+flow+'_'+hsLevel+'_'+(hsFilter||'all');
  if(_tradeCache[cacheKey]){
    _tradeData = _tradeCache[cacheKey].data||[];
    _tradeSource = _tradeCache[cacheKey].source||'';
    _tradeMeta = _tradeCache[cacheKey].meta||{};
    renderTradeResults(countryName, flowName, year, hsFilter);
    return;
  }

  // Firebase keshini ochishdan oldin tradeSnapshots / chunks yuklangan bo'lsin
  if(typeof ensureCollectionLoaded === 'function'){
    try {
      await Promise.all([
        ensureCollectionLoaded('tradeSnapshots'),
        ensureCollectionLoaded('tradeSnapshotChunks')
      ]);
    } catch(_e){ /* silent */ }
  }
  var savedSnapshot = getTradeSnapshot(countryCode, year, flow, hsLevel, hsFilter, partnerCode);
  if(savedSnapshot){
    restoreTradeSnapshot(savedSnapshot, false);
    return;
  }

  // ═══ FIREBASE FIRST: Check if we have manual/CSV data ═══
  var fbData = (DB.tradeData||[]).filter(function(r){
    return r.countryCode == countryCode && r.year == year && r.flow == flow;
  });
  if(fbData.length > 0){
    _tradeData = fbData.map(function(r){
      return {hsCode:r.hsCode, description:r.description, value:r.value||0, weight:r.weight||0, partner:'World', year:r.year, flow:r.flow};
    }).filter(function(r){
      if(hsFilter){
        return String(r.hsCode||'').indexOf(hsFilter)!==-1;
      }
      var code = r.hsCode;
      if(hsLevel==='all') return true;
      if(hsLevel==='2') return code.length<=2;
      if(hsLevel==='4') return code.length<=4;
      if(hsLevel==='6') return code.length<=6;
      return true;
    }).sort(function(a,b){return b.value-a.value;});

    _tradeSource = 'Firebase';
    _tradeMeta = {totalValue:null,isPartial:false,hsFilter:hsFilter,requestedLevel:hsLevel};
    _tradeCache[cacheKey] = {data:_tradeData,source:_tradeSource,meta:_tradeMeta};
    renderTradeResults(countryName, flowName, year, hsFilter);
    toast('🔥 Firebase\'dan '+_tradeData.length+' ta yozuv yuklandi ('+countryName+' '+flowName+' '+year+')');
    return;
  }

  document.getElementById('tradeEmpty').style.display = 'none';
  document.getElementById('tradeTableCard').style.display = 'none';
  document.getElementById('tradeChartCard').style.display = 'none';
  document.getElementById('tradeKpis').style.display = 'none';
  document.getElementById('tradeLoading').style.display = 'block';
  document.getElementById('tradeBar').style.width = '20%';
  document.getElementById('tradeLoadingText').textContent = '🌐 '+countryName+' — '+flowName+' ma\'lumotlari yuklanmoqda ('+year+')...';

  // Get Comtrade subscription key if available
  var comtradeKey = (window._apiKeys && window._apiKeys.comtrade) || '';
  var BASE = 'https://navoiy-api-proxy.vercel.app';

  try {
    document.getElementById('tradeBar').style.width = '20%';
    document.getElementById('tradeLoadingText').textContent = '🌐 Ma\'lumot yuklanmoqda...';
    
    var json = null;
    var dataSource = '';
    _tradeMeta = {totalValue:null,isPartial:false,hsFilter:hsFilter,requestedLevel:hsLevel};

    // ═══ SOURCE 1: UN Comtrade (Netlify proxy) ═══
    document.getElementById('tradeLoadingText').textContent = '🌐 UN Comtrade orqali...';
    try {
      var _tradeUrl = BASE+'/api/trade?reporter='+encodeURIComponent(countryCode)+'&year='+encodeURIComponent(year)+'&flow='+encodeURIComponent(flow)+'&level='+encodeURIComponent(hsLevel)+(hsFilter?'&hs='+encodeURIComponent(hsFilter):'')+(partnerCode?'&partner='+encodeURIComponent(partnerCode):'')+(comtradeKey?'&key='+encodeURIComponent(comtradeKey):'');
      console.log('[loadGlobalTradeData] fetch URL:', _tradeUrl);
      var r1 = await fetch(_tradeUrl);
      if(r1.ok){
        var j1 = await r1.json();
        if((j1.data||[]).length > 0 || Number(j1.total_value||0) > 0){
          json = j1;
          dataSource = 'UN Comtrade';
          _tradeMeta = {
            totalValue:Number(j1.total_value||0)||null,
            isPartial:!!j1.is_partial,
            hsFilter:j1.hs_filter||hsFilter,
            requestedLevel:j1.requested_level||hsLevel,
            requestedCmdCode:j1.requested_cmd_code||'',
            maxRecords:Number(j1.max_records||0)||0
          };
        }
        else console.log('Comtrade: data bo\'sh');
      } else console.log('Comtrade proxy:', r1.status);
    } catch(e){ console.log('Comtrade error:', e.message); }

    document.getElementById('tradeBar').style.width = '40%';

    // ═══ SOURCE 2: WTO API (Netlify proxy) ═══
    if(!json){
      document.getElementById('tradeLoadingText').textContent = '🌐 WTO API orqali...';
      try {
        var wtoKey = (window._apiKeys&&window._apiKeys.wtoKey) || '';
        var r2 = await fetch(BASE+'/api/wto-trade?reporter='+countryCode+'&year='+year+'&flow='+flow+(wtoKey?'&key='+encodeURIComponent(wtoKey):''));
        if(r2.ok){
          var j2 = await r2.json();
          if((j2.data||[]).length > 0){json = j2; dataSource = j2.source||'WTO';}
          else console.log('WTO: data bo\'sh', j2);
        } else {
          var errText = await r2.text().catch(function(){return '';});
          console.log('WTO error:', r2.status, errText.slice(0,200));
        }
      } catch(e){ console.log('WTO fetch error:', e.message); }
    }

    document.getElementById('tradeBar').style.width = '65%';

    // ═══ SOURCE 3: WITS World Bank (Netlify proxy) ═══
    if(!json){
      document.getElementById('tradeLoadingText').textContent = '🌐 WITS (World Bank) orqali...';
      try {
        var r3 = await fetch(BASE+'/api/wits-trade?reporter='+countryCode+'&year='+year+'&flow='+flow);
        if(r3.ok){
          var j3 = await r3.json();
          if((j3.data||[]).length > 0){json = j3; dataSource = j3.source||'WITS';}
          else console.log('WITS: data bo\'sh', j3);
        } else {
          var errText = await r3.text().catch(function(){return '';});
          console.log('WITS error:', r3.status, errText.slice(0,200));
        }
      } catch(e){ console.log('WITS fetch error:', e.message); }
    }

    document.getElementById('tradeBar').style.width = '85%';

    if(!json) throw new Error('Barcha API\'lardan ma\'lumot topilmadi (Comtrade, WTO, WITS)');

    // Parse results — proxy va direct API turli formatda bo'lishi mumkin
    var rawData = json.data || json.countries || [];
    if(!rawData.length && json.dataset) rawData = json.dataset; // eski Comtrade format
    
    _tradeData = normalizeTradeRows(rawData.map(function(r){
      var code = String(r.cmdCode||r.hs_code||r.commodityCode||'');
      return {
        hsCode: code,
        description: r.cmdDesc || r.description || r.commodityDescription || '',
        value: r.primaryValue || r.fobvalue || r.cifvalue || r.TradeValue || r.import_usd || 0,
        weight: r.netWgt || r.grossWgt || r.NetWeight || r.quantity || 0,
        partner: r.partnerDesc || r.partner || r.ptTitle || 'World',
        partner2Code: r.partner2Code || r.partner2 || 0,
        year: r.period || r.yr || year,
        flow: flow
      };
    }).filter(function(r){
      if(!r.value || r.value <= 0) return false;
      if(hsFilter || hsLevel==='all') return true;
      // Filter by HS level
      var len = r.hsCode.length;
      if(hsLevel==='2') return len <= 2;
      if(hsLevel==='4') return len >= 3 && len <= 4;
      if(hsLevel==='6') return len >= 5 && len <= 6;
      return true;
    }));

    // Cache
    _tradeSource = dataSource;
    if(!_tradeMeta.requestedLevel) _tradeMeta.requestedLevel = hsLevel;
    if(!_tradeMeta.hasOwnProperty('hsFilter')) _tradeMeta.hsFilter = hsFilter;
    if(!_tradeMeta.hasOwnProperty('isPartial')) _tradeMeta.isPartial = false;
    _tradeCache[cacheKey] = {data:_tradeData,source:_tradeSource,meta:_tradeMeta};

    document.getElementById('tradeBar').style.width = '100%';
    document.getElementById('tradeLoading').style.display = 'none';

    if(!_tradeData.length){
      console.log('⚠️ Trade: rawData='+rawData.length+', filtered=0. hsLevel='+hsLevel);
      if(rawData.length > 0){
        // Data bor lekin filter tufayli yo'q — HS darajasini o'zgartirish kerak
        toast('⚠️ '+rawData.length+' ta mahsulot topildi, lekin tanlangan HS rejimida yo\'q. "Darajasiz / avto" yoki boshqa HS darajani sinab ko\'ring.','info');
        // Show all data without HS filter
        _tradeData = normalizeTradeRows(rawData.map(function(r){
          var code = String(r.cmdCode||r.hs_code||'');
          return {hsCode:code, description:r.cmdDesc||r.description||'', value:r.primaryValue||r.fobvalue||0, weight:r.netWgt||0, partner2Code:r.partner2Code||r.partner2||0, year:r.period||year, flow:flow};
        }));
      }
      if(!_tradeData.length) throw new Error('Bu davlat uchun '+year+'-yil '+flowName+' ma\'lumoti topilmadi');
    }

    // Partner tanlangan bo'lsa, mamlakat nomiga "→ Hamkor" qo'shiladi (faqat ko'rinish uchun)
    var renderCountryName = partnerCode && partnerName
      ? countryName + ' ↔ ' + partnerName
      : countryName;
    renderTradeResults(renderCountryName, flowName, year, hsFilter);
    saveTradeSnapshot(countryName, year, flow, hsLevel, hsFilter, partnerCode, partnerName);

  } catch(e){
    document.getElementById('tradeLoading').style.display = 'none';
    document.getElementById('tradeEmpty').style.display = 'block';
    document.getElementById('tradeEmpty').innerHTML = '<div class="tc-empty-icon">⚠️</div>'+
      '<p>'+e.message+'</p>'+
      '<div style="font-size:.7rem;color:var(--text3);margin-top:.5rem">'+
      '<b>Yechimlar:</b><br>'+
      '1️⃣ Boshqa <b>yilni</b> tanlang (2023 yoki 2022 — ko\'proq ma\'lumot bor)<br>'+
      '2️⃣ HS darajasini <b>"Darajasiz / avto"</b> yoki <b>"2-raqamli"</b> ga o\'zgartiring<br>'+
      '3️⃣ Boshqa davlatni tanlang (katta davlatlarda ko\'proq ma\'lumot)<br>'+
      '4️⃣ ⚙️ Sozlamalar → UN Comtrade Subscription Key kiriting (500/kun)<br>'+
      '5️⃣ "📥 CSV/Excel import" orqali qo\'lda yuklang</div>';
    toast('⚠️ UN Comtrade API: '+e.message+'. CSV import yoki keyinroq urinib ko\'ring.','error');
  }
}

// ═══ HS kodlari O'zbekcha tarjima lug'ati ═══
var HS_UZ = {
  '01':'Tirik hayvonlar','02':'Go\'sht','03':'Baliq va dengiz mahsulotlari','04':'Sut, tuxum, asal',
  '05':'Boshqa hayvonot mahsulotlari','06':'Tirik o\'simliklar, gullar','07':'Sabzavotlar','08':'Mevalar',
  '09':'Choy, qahva, ziravorlar','10':'Don mahsulotlari (bug\'doy, guruch)','11':'Un, kraxmal','12':'Moyli urug\'lar',
  '13':'Tabiiy smolalar','14':'O\'simlik tolalari','15':'Hayvon va o\'simlik yog\'lari','16':'Go\'sht konservalari',
  '17':'Shakar va qandolat','18':'Kakao','19':'Non va qandolat mahsulotlari','20':'Sabzavot-meva konservalari',
  '21':'Turli oziq-ovqat','22':'Ichimliklar, spirt','23':'Ozuqa va chiqindilar','24':'Tamaki',
  '25':'Tuz, oltingugurt, tosh, gips, ohak','26':'Rudalar','27':'Neft, gaz, ko\'mir',
  '28':'Noorganik kimyoviy moddalar','29':'Organik kimyoviy moddalar','30':'Dori-darmonlar',
  '31':'O\'g\'itlar','32':'Bo\'yoq, lak','33':'Atir-upa, kosmetika','34':'Sovun, yuvish vositalari',
  '35':'Oqsil moddalar, yelimlar','36':'Portlovchi moddalar','37':'Fotomateriallar',
  '38':'Boshqa kimyoviy mahsulotlar','39':'Plastmassa va mahsulotlari','40':'Kauchuk va rezina',
  '41':'Xom teri','42':'Charm buyumlar, sumkalar','43':'Mo\'yna','44':'Yog\'och va mahsulotlari',
  '45':'Probka','46':'To\'quv materiallari','47':'Qog\'oz xamirasi','48':'Qog\'oz va karton',
  '49':'Bosma mahsulotlar, kitoblar','50':'Ipak','51':'Jun va ip','52':'Paxta',
  '53':'Boshqa o\'simlik tolalari','54':'Sun\'iy tolalar','55':'Sintetik tolalar',
  '56':'Paxtali materiallar','57':'Gilamlar','58':'Maxsus to\'qimalar','59':'Texnik matolar',
  '60':'Trikotaj matolar','61':'Trikotaj kiyimlar','62':'To\'qima kiyimlar',
  '63':'Boshqa to\'qima buyumlar','64':'Poyabzallar','65':'Bosh kiyimlar',
  '66':'Soyabonlar','67':'Sun\'iy gullar, patlar','68':'Tosh, gips, tsement mahsulotlari',
  '69':'Keramika mahsulotlari','70':'Shisha va buyumlar','71':'Oltin, kumush, javohirlar',
  '72':'Temir va po\'lat','73':'Temir-po\'lat mahsulotlari','74':'Mis va mahsulotlari',
  '75':'Nikel','76':'Alyuminiy va mahsulotlari','78':'Qo\'rg\'oshin','79':'Rux (sink)',
  '80':'Qalay','81':'Boshqa metallar','82':'Asbob-uskunalar (pichoq, qaychi)',
  '83':'Metall buyumlar','84':'Mashina va mexanizmlar','85':'Elektr jihozlar, elektronika',
  '86':'Temir yo\'l transporti','87':'Avtomobillar','88':'Samolyotlar','89':'Kemalar',
  '90':'Optik, tibbiy asboblar','91':'Soatlar','92':'Musiqa asboblari',
  '93':'Qurol va o\'q-dorilar','94':'Mebel, yoritish','95':'O\'yinchoqlar, sport jihozlari',
  '96':'Turli sanoat mahsulotlari','97':'San\'at asarlari, antikvar',
  // 4-raqamli tez-tez uchraydigan kodlar
  '2516':'Granit, bazalt (xom)','2515':'Marmor, travertin (xom)','2517':'Shag\'al, tosh maydalangan',
  '6802':'Ishlangan tosh (plitka, slab)','6801':'Tosh yo\'l qoplamalari',
  '6803':'Ishlangan slanets','6810':'Tsement mahsulotlari','6811':'Asbest-tsement',
  '2523':'Tsement','2522':'Ohak','2521':'Ohaktosh','2520':'Gips',
  '2709':'Xom neft','2710':'Neft mahsulotlari','2711':'Tabiiy gaz',
  '7108':'Oltin','7106':'Kumush','7102':'Olmos',
  '8703':'Yengil avtomobillar','8704':'Yuk avtomobillari','8711':'Mototsikllar',
  '8517':'Telefonlar, aloqa jihozlari','8471':'Kompyuterlar','8528':'Monitorlar, televizorlar',
  '5201':'Xom paxta','5205':'Paxta ip','5208':'Paxta mato','5209':'Paxta gazlama',
  '0713':'Quritilgan dukkaklilar','0806':'Uzum','0808':'Olma, nok','0809':'O\'rik, shaftoli',
  '1001':'Bug\'doy','1005':'Makkajo\'xori','1006':'Guruch','1003':'Arpa',
  '3004':'Dori-darmonlar','3808':'Pestitsidlar','3105':'Mineral o\'g\'itlar',
  '7210':'Po\'lat prokat','7213':'Po\'lat sim','7214':'Po\'lat armatura',
  '7601':'Alyuminiy (xom)','7604':'Alyuminiy profil','7606':'Alyuminiy list',
  '8544':'Elektr simlari, kabellar','8501':'Elektr motorlar','8504':'Transformatorlar',
  '9403':'Mebel','9405':'Yoritish jihozlari','9401':'O\'rindiqlar',
  '6908':'Keramik plitka','6907':'Keramik qoplamalar',
  '4407':'Yog\'och taxta','4410':'Yog\'och plita (DSP)','4411':'Yog\'och tolali plita',
  '3917':'Plastik trubalar','3920':'Plastik plyonka','3923':'Plastik idishlar',
  '7308':'Metall konstruksiyalar','7304':'Po\'lat trubalar','7306':'Temir trubalar',
  '0201':'Mol go\'shti (yangi)','0202':'Mol go\'shti (muzlatilgan)','0207':'Parranda go\'shti',
  '0401':'Sut va qaymoq','0402':'Quruq sut','0405':'Sariyog\'',
  '1701':'Shakar','1704':'Qandolat (shokoladsiz)','1806':'Shokolad',
  '2201':'Ichimlik suvi','2202':'Shirin ichimliklar','2204':'Vino',
  '1101':'Bug\'doy uni','1507':'Soya yog\'i','1512':'Kungaboqar yog\'i',
  '4801':'Gazeta qog\'ozi','4802':'Yozuv qog\'ozi','4819':'Karton qutilar',
};

function translateHS(hsCode, engDesc){
  if(!hsCode) return engDesc || '—';
  hsCode = String(hsCode);
  if(HS_UZ[hsCode]) return HS_UZ[hsCode];
  if(hsCode.length>=4 && HS_UZ[hsCode.slice(0,4)]) return HS_UZ[hsCode.slice(0,4)];
  if(hsCode.length>=2 && HS_UZ[hsCode.slice(0,2)]) return HS_UZ[hsCode.slice(0,2)] + (engDesc?' ('+engDesc.slice(0,30)+')':'');
  return engDesc || hsCode;
}

function formatTradeMoney(value){
  if(!value || value <= 0) return '$0';
  if(value >= 1e9) return '$'+(value/1e9).toFixed(1)+'B';
  if(value >= 1e6) return '$'+(value/1e6).toFixed(0)+'M';
  return '$'+(value/1e3).toFixed(0)+'K';
}

function renderTradeResults(countryName, flowName, year, hsFilter){
  var data = _tradeData;

  // Apply name filter
  var nameFilter = (document.getElementById('trade-name-filter').value||'').toLowerCase();
  if(nameFilter){
    data = data.filter(function(r){return r.description.toLowerCase().indexOf(nameFilter)!==-1 || r.hsCode.indexOf(nameFilter)!==-1;});
  }

  // KPIs
  var filteredTotalValue = data.reduce(function(s,r){return s+r.value;},0);
  var officialTotalValue = Number((_tradeMeta&&_tradeMeta.totalValue)||0);
  var maxItemValue = data.length ? Number(data[0].value||0) : 0;
  var officialLooksValid = officialTotalValue > 0 && officialTotalValue >= maxItemValue && officialTotalValue >= filteredTotalValue;
  var useOfficialTotal = !nameFilter && !((_tradeMeta&&_tradeMeta.hsFilter)||hsFilter) && officialLooksValid;
  var totalValue = useOfficialTotal ? officialTotalValue : filteredTotalValue;
  var totalWeight = data.reduce(function(s,r){return s+r.weight;},0);
  var topProduct = data[0]||{description:'—',value:0,hsCode:''};
  document.getElementById('tradeKpis').style.display = 'grid';
  document.getElementById('tradeKpis').innerHTML =
    '<div class="kpi-card c1"><div class="kpi-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/></svg></div><div class="kpi-card-body"><div class="kpi-label">Jami '+flowName+'</div><div class="kpi-val">'+formatTradeMoney(totalValue)+'</div></div></div>'+
    '<div class="kpi-card c2"><div class="kpi-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z" fill="currentColor"/></svg></div><div class="kpi-card-body"><div class="kpi-label">Mahsulot turlari</div><div class="kpi-val">'+data.length+'</div></div></div>'+
    '<div class="kpi-card c3"><div class="kpi-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" fill="currentColor"/></svg></div><div class="kpi-card-body"><div class="kpi-label">Eng katta</div><div class="kpi-val" style="font-size:.6rem">'+translateHS(topProduct.hsCode,topProduct.description).slice(0,25)+'</div></div></div>'+
    '<div class="kpi-card c4"><div class="kpi-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" fill="currentColor"/></svg></div><div class="kpi-card-body"><div class="kpi-label">Jami og\'irlik</div><div class="kpi-val">'+(totalWeight>=1e9?(totalWeight/1e9).toFixed(0)+'Kt':totalWeight>=1e6?(totalWeight/1e6).toFixed(0)+'t':(totalWeight/1e3).toFixed(0)+'kg')+'</div></div></div>';

  // Chart — top 20
  var top20 = data.slice(0,20);
  document.getElementById('tradeChartCard').style.display = 'block';
  document.getElementById('tradeChartTitle').textContent = countryName+' — TOP 20 '+flowName+' mahsulotlari ('+year+')' + (_tradeSource?' · '+_tradeSource:'');

  // Build bar chart with HTML — rangli (multi-color)
  var maxVal = top20[0]?top20[0].value:1;
  document.getElementById('tradeChartArea').innerHTML = top20.map(function(r,i){
    var pct = Math.max(r.value/maxVal*100, 2);
    var valStr = formatTradeMoney(r.value);
    var colors = ['#4361EE','#059669','#F59E0B','#EF233C','#8B5CF6','#14B8A6','#F97316','#EC4899','#6366F1','#10B981'];
    var color = colors[i%colors.length];
    return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">'+
      '<div style="width:60px;font-size:.55rem;text-align:right;color:var(--text3);flex-shrink:0">'+r.hsCode+'</div>'+
      '<div style="flex:1;height:22px;background:var(--border);border-radius:3px;overflow:hidden;position:relative">'+
        '<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:3px"></div>'+
        '<div style="position:absolute;left:4px;top:2px;font-size:.55rem;color:#fff;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,.5)">'+translateHS(r.hsCode,r.description).slice(0,40)+'</div>'+
      '</div>'+
      '<div style="width:70px;font-size:.6rem;font-weight:700;color:var(--text);text-align:right">'+valStr+'</div>'+
    '</div>';
  }).join('');
  var chartMeta = document.getElementById('tradeChartMeta');
  if(chartMeta){
    var notes = [];
    if(useOfficialTotal) notes.push('Rasmiy jami: '+formatTradeMoney(officialTotalValue)+' (UN Comtrade TOTAL, partner: World)');
    if(_tradeMeta && _tradeMeta.isPartial) notes.push('Jadval API limitiga tushgan bo\'lishi mumkin; to\'liq ro\'yxat uchun Comtrade key kiriting');
    if((_tradeMeta&&_tradeMeta.requestedLevel)==='all') notes.push('Darajasiz qidiruv rejimi: eng batafsil mavjud HS satrlar yuklandi');
    chartMeta.textContent = notes.join(' | ');
  }

  _tradeViewMode = _tradeViewMode || 'market';
  document.getElementById('tradeTableCard').style.display = 'block';
  renderTradeListView(countryName, flowName, year);
  ensureUzExportDataLoaded(document.getElementById('trade-country').value, countryName, year, document.getElementById('trade-hs-level').value, hsFilter);
  ensureTradeTariffLoaded(document.getElementById('trade-country').value, countryName, year);

  var navProducts = (DB.products||[]);
  var matchCount = data.filter(function(r){
    return navProducts.some(function(p){return p.hs_code && r.hsCode && (p.hs_code.indexOf(r.hsCode)===0 || r.hsCode.indexOf(p.hs_code.slice(0,4))===0);});
  }).length;
  if(matchCount>0) toast('🔗 '+matchCount+' ta mahsulot Navoiy ishlab chiqarishi bilan mos keldi!');
  toast('✅ '+data.length+' ta mahsulot yuklandi: '+countryName+' '+flowName+' ('+year+') — '+(_tradeSource||'UN Comtrade'));
}

function filterTradeTable(){
  if(!_tradeData.length) return;
  var countryName = document.getElementById('trade-country-search').value;
  var flow = document.getElementById('trade-flow').value;
  var year = document.getElementById('trade-year').value;
  renderTradeResults(countryName, flow==='M'?'Import':'Export', year, '');
}

function onTradeCountryChange(){
  // Check if Firebase has data for this country
  var code = document.getElementById('trade-country').value;
  if(code && DB.tradeData){
    var fbData = DB.tradeData.filter(function(r){return r.countryCode==code;});
    if(fbData.length) toast('💡 Firebase\'da '+fbData.length+' ta yozuv bor. "🔍 Qidirish" bosing.','info');
  }
}

/* ═══ TRADE DATA: Firebase qo'lda kiritish ═══ */
function addTradeRecord(){
  var country = document.getElementById('tm-country').value.trim();
  var countryName = document.getElementById('tm-country-name').value.trim();
  var year = document.getElementById('tm-year').value.trim();
  var flow = document.getElementById('tm-flow').value;
  var hs = document.getElementById('tm-hs').value.trim();
  var name = document.getElementById('tm-name').value.trim();
  var value = parseFloat(document.getElementById('tm-value').value)||0;
  var weight = parseFloat(document.getElementById('tm-weight').value)||0;
  if(!country||!hs||!name||!value){toast('⚠️ Davlat, HS kod, nom va qiymat kiriting','error');return;}
  var rec = {id:'tr_'+Date.now(), countryCode:country, countryName:countryName||country, year:year||'2023', flow:flow, hsCode:hs, description:name, value:value, weight:weight, source:'manual'};
  if(!DB.tradeData) DB.tradeData = [];
  DB.tradeData.push(rec);
  if(typeof fbSave==='function') fbSave('tradeData', rec);
  document.getElementById('tm-hs').value='';document.getElementById('tm-name').value='';document.getElementById('tm-value').value='';document.getElementById('tm-weight').value='';
  updateTradeFirebaseCount();
  toast('✅ '+name+' (HS:'+hs+') — $'+value.toLocaleString());
}

function importTradeCSV(input){
  var file = (input.files||[])[0];
  if(!file) return;
  toast('📥 '+file.name+' o\'qilmoqda...');
  var reader = new FileReader();
  reader.onload = function(e){
    try {
      var rows = [];
      if(file.name.toLowerCase().endsWith('.csv')){
        var lines = e.target.result.split('\n');
        lines.forEach(function(line){var cols=line.split(/[,;\t]/).map(function(c){return c.trim().replace(/^"|"$/g,'');});if(cols.length>=3) rows.push(cols);});
      } else {
        var wb = XLSX.read(e.target.result,{type:'array'});
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:''});
      }
      // Detect header
      var startRow = 0;
      for(var i=0;i<Math.min(5,rows.length);i++){
        var s = rows[i].join('|').toLowerCase();
        if(s.indexOf('hs')!==-1||s.indexOf('code')!==-1||s.indexOf('product')!==-1||s.indexOf('mahsulot')!==-1){startRow=i+1;break;}
      }
      // Detect format: full (8 cols) or simple (4 cols)
      var sample = rows[startRow]||rows[0];
      var isFull = sample && sample.length >= 7;
      var country = document.getElementById('tm-country').value.trim()||'860';
      var countryName = document.getElementById('tm-country-name').value.trim()||"O\'zbekiston";
      var year = document.getElementById('tm-year').value.trim()||'2023';
      var flow = document.getElementById('tm-flow').value||'M';
      if(!DB.tradeData) DB.tradeData = [];
      var added = 0;
      for(var r=startRow;r<rows.length;r++){
        var row = rows[r];
        if(!row||row.length<3) continue;
        var rec;
        if(isFull){
          rec = {id:'tr_'+(Date.now()+r), countryCode:String(row[0]||country).trim(), countryName:String(row[1]||countryName).trim(), year:String(row[2]||year).trim(), flow:String(row[3]||flow).trim().toUpperCase(), hsCode:String(row[4]||'').trim(), description:String(row[5]||'').trim(), value:parseFloat(String(row[6]||'0').replace(/[^0-9.-]/g,''))||0, weight:parseFloat(String(row[7]||'0').replace(/[^0-9.-]/g,''))||0, source:'csv'};
        } else {
          rec = {id:'tr_'+(Date.now()+r), countryCode:country, countryName:countryName, year:year, flow:flow, hsCode:String(row[0]||'').trim(), description:String(row[1]||'').trim(), value:parseFloat(String(row[2]||'0').replace(/[^0-9.-]/g,''))||0, weight:parseFloat(String(row[3]||'0').replace(/[^0-9.-]/g,''))||0, source:'csv'};
        }
        if(rec.hsCode && rec.value>0){DB.tradeData.push(rec);if(typeof fbSave==='function') fbSave('tradeData',rec);added++;}
      }
      updateTradeFirebaseCount();
      toast('✅ '+added+' ta savdo yozuvi import qilindi!');
    } catch(err){toast('⚠️ '+err.message,'error');console.error(err);}
  };
  if(file.name.toLowerCase().endsWith('.csv')) reader.readAsText(file); else reader.readAsArrayBuffer(file);
  if(input.value!==undefined) input.value='';
}

function loadTradeFromFirebase(){
  toast('🔥 Firebase\'dan savdo ma\'lumotlari yuklanmoqda...');
  var manualCount = (DB.tradeData||[]).length;
  var snapshotCount = (DB.tradeSnapshots||[]).length;
  if(!manualCount && !snapshotCount){toast('⚠️ Firebase\'da savdo ma\'lumoti yo\'q. CSV import yoki qo\'lda kiriting.','info');return;}
  toast('✅ Firebase\'da '+manualCount+' ta qo\'lda yozuv va '+snapshotCount+' ta auto-cache bor!');
  updateTradeFirebaseCount();
}

function clearTradeFirebase(){
  var manualCount = (DB.tradeData||[]).length;
  var snapshotCount = (DB.tradeSnapshots||[]).length;
  if(!confirm((manualCount+snapshotCount)+' ta savdo cache/yozuvini o\'chirish?')) return;
  DB.tradeData=[];
  DB.tradeSnapshots=[];
  DB.tradeSnapshotChunks=[];
  _tradeCache={};
  _tradeData=[];
  if(typeof fbDeleteCollection==='function') fbDeleteCollection('tradeData');
  if(typeof fbDeleteCollection==='function') fbDeleteCollection('tradeSnapshots');
  if(typeof fbDeleteCollection==='function') fbDeleteCollection('tradeSnapshotChunks');
  saveSettingsPatch({lastTradeSnapshotId:''});
  updateTradeFirebaseCount();
  toast('🗑 Savdo ma\'lumotlari tozalandi');
}

function updateTradeFirebaseCount(){
  var el=document.getElementById('trade-fb-count');
  if(el) el.textContent=((DB.tradeData||[]).length + (DB.tradeSnapshots||[]).length);
}

function exportTradeCSV(){
  var rows = getCurrentTradeRows();
  if(!rows.length){toast('⚠️ Ma\'lumot yo\'q','error');return;}
  var countryName = document.getElementById('trade-country-search').value||'Country';
  var year = document.getElementById('trade-year').value;
  var flow = document.getElementById('trade-flow').value==='M'?'Import':'Export';
  var filenamePrefix = 'trade_list';
  var csv = '';
  if(_tradeViewMode === 'navoi'){
    filenamePrefix = 'navoiy_products';
    csv = 'HS Code,Product Name,Tariff (%),Category,Note\n';
    rows.forEach(function(r){
      var tariffInfo = getTariffInfoForHs(r.hsCode);
      csv += '"'+(r.hsCode||'')+'","'+String(r.description||'').replace(/"/g,'""')+'","'+(tariffInfo ? tariffInfo.rate.toFixed(2) : '')+'","'+String(r.tag||'').replace(/"/g,'""')+'","'+String(r.note||'').replace(/"/g,'""')+'"\n';
    });
  } else if(_tradeViewMode === 'uzexport'){
    filenamePrefix = 'uzbekistan_exports_to_'+countryName.replace(/[^a-zA-Z0-9]/g,'_').toLowerCase();
    csv = 'HS Code,Product Name,Value (USD),Weight (kg),Tariff (%),Year,Flow,Partner\n';
    rows.forEach(function(r){
      var tariffInfo = getTariffInfoForHs(r.hsCode);
      csv += '"'+(r.hsCode||'')+'","'+String(r.description||'').replace(/"/g,'""')+'",'+(r.value||0)+','+(r.weight||0)+',"'+(tariffInfo ? tariffInfo.rate.toFixed(2) : '')+'",'+(r.year||year)+',Export,"'+String(countryName||r.partner||'').replace(/"/g,'""')+'"\n';
    });
  } else {
    filenamePrefix = countryName.replace(/[^a-zA-Z0-9]/g,'_')+'_'+flow+'_'+year;
    csv = 'HS Code,Product Name,Value (USD),Weight (kg),Tariff (%),Year,Flow\n';
    rows.forEach(function(r){
      var tariffInfo = getTariffInfoForHs(r.hsCode);
      csv += '"'+(r.hsCode||'')+'","'+String(r.description||'').replace(/"/g,'""')+'",'+(r.value||0)+','+(r.weight||0)+',"'+(tariffInfo ? tariffInfo.rate.toFixed(2) : '')+'",'+(r.year||year)+','+flow+'\n';
    });
  }

  var blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filenamePrefix+'.csv';
  link.click();
  toast('📥 CSV yuklandi: '+link.download);
}

function matchTradeWithProducts(){
  if(_tradeViewMode === 'navoi'){
    toast('ℹ️ Bu bo\'lim Navoiy mahsulotlar bazasining o\'zi. Moslashtirish kerak emas.','info');
    return;
  }
  var sourceRows = getCurrentTradeRows();
  if(!sourceRows.length){toast('⚠️ Ma\'lumot yo\'q','error');return;}
  var navProducts = DB.products||[];
  if(!navProducts.length){toast('⚠️ Mahsulotlar bazasi bo\'sh. Avval Excel import qiling.','error');return;}

  var matches = [];
  sourceRows.forEach(function(trade){
    navProducts.forEach(function(prod){
      if(prod.hs_code && trade.hsCode){
        var prodHS = prod.hs_code.replace(/\s/g,'').slice(0,4);
        var tradeHS = trade.hsCode.slice(0,4);
        if(prodHS === tradeHS){
          matches.push({trade:trade, product:prod, matchLevel: prodHS.length >= 4 ? 'exact' : 'partial'});
        }
      }
    });
  });

  if(!matches.length){
    toast('⚠️ HS kod bo\'yicha mos mahsulot topilmadi','info');
    return;
  }

  var msg = '🔗 '+matches.length+' ta moslik topildi!\n\n';
  matches.slice(0,15).forEach(function(m){
    var valStr = m.trade.value>=1e6?'$'+(m.trade.value/1e6).toFixed(1)+'M':'$'+(m.trade.value/1e3).toFixed(0)+'K';
    msg += '• '+m.product.name_en+' (HS:'+m.product.hs_code+') ↔ '+m.trade.description.slice(0,40)+' ['+valStr+']\n';
  });
  if(matches.length>15) msg += '\n...va yana '+(matches.length-15)+' ta';
  msg += '\n\n🎯 Bu davlat Navoiy mahsulotlari uchun potensial bozor!';
  alert(msg);
  toast('🔗 '+matches.length+' ta mos mahsulot topildi!');
}

/* ═══════════════════════════════════════════════════════════════
   MAHALLIY TADBIRKORLAR — Excel import, Forum moslashtirish, Telegram
   ═══════════════════════════════════════════════════════════════ */
// ═══ TELEGRAM XABAR: MTProto (telefonga) yoki Bot API (guruhga) ═══
/* TG_API_BASE moved to assets/js/api-config.js */

// Telegram status check
async function checkTgStatus(){
  var el=document.getElementById('tg-setup-status');if(!el) return;
  try {
    var r=await fetch(TG_API_BASE+'/tg-status');var d=await r.json();
    if(d.ready) el.innerHTML='<div style="padding:8px 12px;background:rgba(5,150,105,.1);border-radius:8px;color:#059669;font-weight:700;font-size:.75rem">✅ Telegram MTProto tayyor! Telefon raqamga to\'g\'ridan-to\'g\'ri xabar yuboriladi.</div>';
else el.innerHTML='<div style="padding:8px 12px;background:rgba(239,68,60,.1);border-radius:8px;color:#EF233C;font-size:.7rem">❌ Vercel env sozlanmagan. TG_API_ID, TG_API_HASH, TG_SESSION kerak.</div>';
} catch(e){el.innerHTML='<div style="font-size:.65rem;color:var(--text3)">⚠️ Vercel project deploy va env sozlamalarini tekshiring.</div>';}
}

var TG_SEND_DELAY_MIN_MS = 6000;
var TG_SEND_DELAY_MAX_MS = 9000;
var TG_BATCH_BURST_SIZE = 4;
var TG_BATCH_BURST_PAUSE_MS = 30000;
var TG_DEFAULT_COOLDOWN_MS = 45 * 60 * 1000;
var _tgBatchRunning = false;
var _entrSelectedIds = null;

// tgEscapeAttr moved to utils.js (needed early, before defer scripts)

function tgNormalizePhone(phone){
  var raw = String(phone||'').trim();
  if(!raw) return '';
  var cleanPhone = raw.replace(/[\s\-\(\)]/g,'');
  if(cleanPhone.indexOf('00')===0) cleanPhone = '+' + cleanPhone.slice(2);
  if(cleanPhone.startsWith('+')) return cleanPhone.replace(/^\+998998/,'+998');
  var digits = cleanPhone.replace(/\D/g,'');
  if(!digits) return '';
  if(digits.length===9) return ('+998' + digits).replace(/^\+998998/,'+998');
  if(digits.length===12 && digits.indexOf('998')===0) return ('+' + digits).replace(/^\+998998/,'+998');
  if(digits.length>=10) return '+' + digits;
  return '+' + digits;
}

function detectTgErrorCode(value){
  var raw = String(value||'').toUpperCase();
  if(raw.indexOf('PEER_FLOOD')!==-1) return 'PEER_FLOOD';
  if(raw.indexOf('FLOOD_WAIT')!==-1) return 'FLOOD_WAIT';
  if(raw.indexOf('PHONE_NOT_OCCUPIED')!==-1) return 'PHONE_NOT_OCCUPIED';
  if(raw.indexOf('USER_PRIVACY_RESTRICTED')!==-1) return 'USER_PRIVACY_RESTRICTED';
  if(raw.indexOf('CHAT_WRITE_FORBIDDEN')!==-1) return 'CHAT_WRITE_FORBIDDEN';
  if(raw.indexOf('USER_IS_BLOCKED')!==-1) return 'USER_IS_BLOCKED';
  if(raw.indexOf('INPUT_USER_DEACTIVATED')!==-1) return 'INPUT_USER_DEACTIVATED';
  return '';
}

function parseTgRetryAfterMs(value){
  var raw = String(value||'');
  var match = raw.match(/FLOOD_WAIT_?(\d+)/i);
  if(match) return (parseInt(match[1],10)||0) * 1000;
  match = raw.match(/(\d+)\s*(seconds?|sec|s)\b/i);
  if(match) return (parseInt(match[1],10)||0) * 1000;
  match = raw.match(/retry\s+after\s+(\d+)/i);
  if(match) return (parseInt(match[1],10)||0) * 1000;
  return 0;
}

function formatTgDuration(ms){
  var totalSec = Math.max(1, Math.ceil((ms||0)/1000));
  var min = Math.floor(totalSec/60);
  var sec = totalSec % 60;
  if(min && sec) return min+' daqiqa '+sec+' soniya';
  if(min) return min+' daqiqa';
  return sec+' soniya';
}

function humanizeTgError(value, code){
  var finalCode = code || detectTgErrorCode(value);
  if(finalCode==='CONTACT_IMPORTED') return 'Kontakt Telegram akkauntga saqlandi. Spam himoyasi sabab 10-15 daqiqadan keyin yana yuboring.';
  if(finalCode==='PEER_FLOOD') return 'Telegram akkaunt vaqtincha chekladi (PEER_FLOOD).';
  if(finalCode==='FLOOD_WAIT'){
    var waitMs = parseTgRetryAfterMs(value);
    return 'Telegram kutishni talab qildi' + (waitMs ? ' ('+formatTgDuration(waitMs)+')' : '') + '.';
  }
  if(finalCode==='PHONE_NOT_OCCUPIED') return 'Bu raqam Telegram profiliga ulanmagan.';
  if(finalCode==='USER_PRIVACY_RESTRICTED') return 'Foydalanuvchi maxfiylik sozlamasi sabab xabar qabul qila olmaydi.';
  if(finalCode==='CHAT_WRITE_FORBIDDEN') return 'Bu foydalanuvchiga yozish ruxsati yo\'q.';
  if(finalCode==='USER_IS_BLOCKED') return 'Telegram akkaunt bloklangan foydalanuvchiga duch keldi.';
  if(finalCode==='INPUT_USER_DEACTIVATED') return 'Foydalanuvchi akkaunti faol emas.';
  return String(value||'Telegram yuborishda xato');
}

function clearTgCooldownInfo(){
  if(typeof saveSettingsPatch==='function') saveSettingsPatch({tgFloodUntil:'',tgFloodReason:'',tgFloodUpdatedAt:''});
  try {
    localStorage.removeItem('_tgFloodUntil');
    localStorage.removeItem('_tgFloodReason');
  } catch(e){}
}

function getTgCooldownInfo(){
  var settingUntil = DB.settings && DB.settings.tgFloodUntil ? DB.settings.tgFloodUntil : '';
  var settingReason = DB.settings && DB.settings.tgFloodReason ? DB.settings.tgFloodReason : '';
  var localUntil = '';
  var localReason = '';
  try {
    localUntil = localStorage.getItem('_tgFloodUntil') || '';
    localReason = localStorage.getItem('_tgFloodReason') || '';
  } catch(e){}

  var until = settingUntil || localUntil;
  if(settingUntil && localUntil){
    until = new Date(settingUntil).getTime() >= new Date(localUntil).getTime() ? settingUntil : localUntil;
  }
  var reason = settingReason || localReason || 'PEER_FLOOD';
  var ts = until ? new Date(until).getTime() : 0;
  if(ts && ts > Date.now()){
    return {active:true, until:until, reason:reason, remainingMs:ts-Date.now()};
  }
  if(until) clearTgCooldownInfo();
  return {active:false, until:'', reason:'', remainingMs:0};
}

function setTgCooldownInfo(result){
  var retryMs = ((result && result.retryAfterSec) ? result.retryAfterSec * 1000 : 0) || parseTgRetryAfterMs(result && (result.rawError || result.error));
  var cooldownMs = retryMs || TG_DEFAULT_COOLDOWN_MS;
  var untilIso = new Date(Date.now() + cooldownMs).toISOString();
  if(typeof saveSettingsPatch==='function') saveSettingsPatch({
    tgFloodUntil:untilIso,
    tgFloodReason:(result && result.code) || 'PEER_FLOOD',
    tgFloodUpdatedAt:new Date().toISOString()
  });
  try {
    localStorage.setItem('_tgFloodUntil', untilIso);
    localStorage.setItem('_tgFloodReason', (result && result.code) || 'PEER_FLOOD');
  } catch(e){}
  return untilIso;
}

function tgRandomInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getTgQueueDelayMs(attemptNumber){
  var delay = tgRandomInt(TG_SEND_DELAY_MIN_MS, TG_SEND_DELAY_MAX_MS);
  if(attemptNumber > 0 && attemptNumber % TG_BATCH_BURST_SIZE === 0) delay += TG_BATCH_BURST_PAUSE_MS;
  return delay;
}

function getEntrepreneurTgStatusMeta(ent, tgCooldown){
  if(ent.tgReplyAt){
    var replyTitle = 'Javob keldi';
    if(ent.tgReplyAt) replyTitle += ': ' + new Date(ent.tgReplyAt).toLocaleString('uz-UZ');
    if(ent.tgReplyText) replyTitle += ' — ' + ent.tgReplyText.slice(0, 120);
    return {
      icon: ent.tgReplySeen ? '💬' : '🆕',
      color: ent.tgReplySeen ? '#2563EB' : '#7C3AED',
      title: replyTitle,
      action: 'reply'
    };
  }
  if(ent.tgSent){
    var sentTitle = 'Yuborilgan';
    if(ent.tgDate) sentTitle += ': ' + ent.tgDate;
    if(ent.tgUser) sentTitle += ' (' + ent.tgUser + ')';
    return {icon:'✅', color:'#059669', title:sentTitle};
  }
  var blockedUntil = ent.tgBlockedUntil ? new Date(ent.tgBlockedUntil).getTime() : 0;
  if(blockedUntil && blockedUntil > Date.now()){
    return {
      icon:'⏳',
      color:'#F59E0B',
      title:'Telegram cheklovi: ' + new Date(ent.tgBlockedUntil).toLocaleString('uz-UZ')
    };
  }
  if(ent.tgPreparedAt){
    return {icon:'📇', color:'#2563EB', title:'Kontakt saqlandi, keyingi urinishda yuboriladi: ' + new Date(ent.tgPreparedAt).toLocaleString('uz-UZ')};
  }
  if(ent.tgLastError){
    return {icon:'⚠️', color:'#EF233C', title:'Oxirgi xato: ' + ent.tgLastError};
  }
  if(tgCooldown && tgCooldown.active && ent.matchedForum){
    return {
      icon:'⏸',
      color:'#F59E0B',
      title:'Telegram batch pauzada: ' + formatTgDuration(tgCooldown.remainingMs)
    };
  }
  if(ent.matchedForum) return {icon:'🟡', color:'#F59E0B', title:'Forumga mos, hali yuborilmagan'};
  return {icon:'⚪', color:'var(--text3)', title:'Telegram yuborilmagan'};
}

function renderEntrepreneurTgStatusHtml(ent, tgMeta){
  if(tgMeta && tgMeta.action === 'reply'){
    return '<button class="btn btn-sm" onclick="showEntrepreneurReply(\''+ent.id+'\')" '+
      'style="background:'+(ent.tgReplySeen?'rgba(37,99,235,.12)':'rgba(124,58,237,.12)')+';color:'+(ent.tgReplySeen?'#2563EB':'#7C3AED')+';border:1px solid rgba(37,99,235,.18);font-size:.58rem;padding:2px 6px" '+
      'title="'+tgEscapeAttr(tgMeta.title)+'">'+tgMeta.icon+'</button>';
  }
  return '<span style="color:'+tgMeta.color+'" title="'+tgEscapeAttr(tgMeta.title)+'">'+tgMeta.icon+'</span>';
}

function getEntrepreneurReplySince(ent){
  var candidates = [];
  [ent.tgLastTryAt, ent.tgPreparedAt, ent.tgReplyAt].forEach(function(value){
    if(!value) return;
    var ts = new Date(value).getTime();
    if(ts) candidates.push(ts);
  });
  if(ent.tgDate){
    var tgDateTs = new Date(ent.tgDate + 'T00:00:00').getTime();
    if(tgDateTs) candidates.push(tgDateTs);
  }
  if(!candidates.length) return '';
  return new Date(Math.max.apply(null, candidates)).toISOString();
}

function getTelegramReplyTargets(ids){
  var idList = Array.isArray(ids) ? ids.map(function(item){ return String(item); }) : [];
  return (DB.entrepreneurs||[]).filter(function(ent){
    if(idList.length && idList.indexOf(String(ent.id)) === -1) return false;
    return !!ent.phone && (!!ent.tgSent || !!ent.tgPreparedAt || !!ent.tgPeerId || !!ent.tgUser);
  }).map(function(ent){
    return {
      id: ent.id,
      phone: ent.phone || '',
      name: ent.name || '',
      tgPeerId: ent.tgPeerId || '',
      since: getEntrepreneurReplySince(ent),
      sentMessage: ent.tgSentMessage || ''
    };
  });
}

function showEntrepreneurReply(id){
  var ent = (DB.entrepreneurs||[]).find(function(item){ return item.id===id; });
  if(!ent || !ent.tgReplyText){
    toast('ℹ️ Telegram javobi topilmadi','info');
    return;
  }
  markTgReplySeen(id);
  alert(
    'Telegram javobi\n\n' +
    'Ism / kompaniya: ' + (ent.name||'—') + '\n' +
    'Sana: ' + (ent.tgReplyAt ? new Date(ent.tgReplyAt).toLocaleString('uz-UZ') : '—') + '\n' +
    'Telefon: ' + (ent.phone||'—') + '\n\n' +
    ent.tgReplyText
  );
  if(!ent.tgReplySeen){
    ent.tgReplySeen = true;
    if(typeof fbSave==='function') fbSave('entrepreneurs', ent);
    renderEntrepreneurs();
    if(document.getElementById('forumEntrepreneursModal') && document.getElementById('forumEntrepreneursModal').style.display==='flex' && _currentModalForum){
      showForumEntrepreneurs(_currentModalForum);
    }
  }
}
window.showEntrepreneurReply = showEntrepreneurReply;

async function checkTelegramReplies(options){
  options = options || {};
  var targets = getTelegramReplyTargets(options.ids);
  if(!targets.length){
    if(options.silent!==true) toast('ℹ️ Telegram javobi tekshiriladigan tadbirkor topilmadi','info');
    return {updated:0,replied:0};
  }
  if(options.silent!==true) toast('💬 Telegram javoblari tekshirilmoqda...');
  try {
    var resp = await fetch(TG_API_BASE + '/tg-status', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({mode:'replies', targets:targets})
    });
    var data = await resp.json();
    if(!data.ok) throw new Error(data.error || 'Telegram javoblarini tekshirib bo\'lmadi');

    var updated = 0;
    var replied = 0;
    (data.replies || []).forEach(function(item){
      var ent = (DB.entrepreneurs||[]).find(function(row){ return row.id===item.id; });
      if(!ent) return;
      if(item.peerId) ent.tgPeerId = item.peerId;
      if(item.username) ent.tgPeerUsername = item.username;
      if(item.user && !ent.tgUser) ent.tgUser = item.user;
      if(item.replied){
        replied++;
        var changed = item.text !== (ent.tgReplyText||'') || item.date !== (ent.tgReplyAt||'');
        ent.tgReplyAt = item.date || ent.tgReplyAt || '';
        ent.tgReplyText = item.text || ent.tgReplyText || '';
        ent.tgReplyFrom = item.user || ent.tgReplyFrom || ent.tgUser || '';
        if(changed){
          ent.tgReplySeen = false;
          updated++;
        }
        if(typeof fbSave==='function') fbSave('entrepreneurs', ent);
      }
    });

    renderEntrepreneurs();
    if(document.getElementById('forumEntrepreneursModal') && document.getElementById('forumEntrepreneursModal').style.display==='flex' && _currentModalForum){
      showForumEntrepreneurs(_currentModalForum);
    }

    if(options.silent!==true){
      if(updated) toast('💬 '+updated+' ta yangi Telegram javobi topildi!');
      else if(replied) toast('ℹ️ Javoblar bor, lekin yangisi topilmadi','info');
      else toast('ℹ️ Hozircha yangi Telegram javobi kelmagan','info');
    }
    return {updated:updated,replied:replied};
  } catch(error){
    if(options.silent!==true) toast('⚠️ '+error.message,'error');
    return {updated:0,replied:0,error:error.message};
  }
}
window.checkTelegramReplies = checkTelegramReplies;

function markTgReplySeen(id){
  var ent = (DB.entrepreneurs||[]).find(function(e){return e.id===id;});
  if(ent && ent.tgReplyText){
    ent.tgReplySeen = true;
    if(typeof fbSave==='function') fbSave('entrepreneurs', ent);
    renderEntrepreneurs();
  }
}
window.markTgReplySeen = markTgReplySeen;

async function checkSingleTelegramReply(id){
  var ent = (DB.entrepreneurs||[]).find(function(item){ return item.id===id; });
  if(!ent){
    toast('⚠️ Tadbirkor topilmadi','error');
    return;
  }
  if(!ent.phone){
    toast('⚠️ Avval telefon raqamini kiriting','error');
    return;
  }
  return checkTelegramReplies({ids:[id], silent:false});
}
window.checkSingleTelegramReply = checkSingleTelegramReply;

function getSelectedEntrepreneurIds(){
  return Array.from(document.querySelectorAll('.entr-check:checked')).map(function(el){
    return String(el.dataset.id||'');
  }).filter(Boolean);
}

function updateEntrepreneurSelectedCount(){
  var ids = getSelectedEntrepreneurIds();
  _entrSelectedIds = ids;
  var countEl = document.getElementById('entrSelectedCount');
  if(countEl) countEl.textContent = ids.length ? ids.length+' ta tanlangan' : '0 ta tanlangan';
  var btn = document.getElementById('entrBulkTgBtn');
  if(btn) btn.disabled = !ids.length;
  var allChecks = Array.from(document.querySelectorAll('.entr-check'));
  var checkAll = document.getElementById('entrCheckAll');
  if(checkAll){
    checkAll.checked = !!allChecks.length && ids.length === allChecks.length;
    checkAll.indeterminate = ids.length > 0 && ids.length < allChecks.length;
  }
}

function toggleAllEntrepreneurs(el){
  document.querySelectorAll('.entr-check').forEach(function(c){
    c.checked = !!el.checked;
  });
  updateEntrepreneurSelectedCount();
}

function getSelectedEntrepreneurs(){
  var ids = getSelectedEntrepreneurIds();
  return (DB.entrepreneurs||[]).filter(function(e){
    return ids.indexOf(String(e.id)) !== -1;
  });
}

function applyTgResultToEntrepreneur(ent, result){
  if(!ent) return;
  var nowIso = new Date().toISOString();
  if(result.user) ent.tgUser = result.user || ent.tgUser || '';
  if(result.userId) ent.tgPeerId = result.userId || ent.tgPeerId || '';
  if(result.username) ent.tgPeerUsername = result.username || ent.tgPeerUsername || '';
  if(result.ok){
    ent.tgSent = true;
    ent.tgDate = nowIso.slice(0,10);
    ent.tgMethod = result.method || 'mtproto';
    ent.tgLastTryAt = nowIso;
    ent.tgLastError = '';
    ent.tgRawError = '';
    ent.tgRetryAfterSec = 0;
    ent.tgBlockedUntil = '';
    ent.tgPreparedAt = '';
    ent.tgSentMessage = result.sentMessage || ent.tgSentMessage || '';
  } else {
    ent.tgSent = false;
    ent.tgLastTryAt = nowIso;
    ent.tgLastError = result.error || 'Telegram yuborishda xato';
    ent.tgRawError = result.rawError || '';
    ent.tgRetryAfterSec = result.retryAfterSec || 0;
    ent.tgBlockedUntil = '';
    ent.tgPreparedAt = result.code==='CONTACT_IMPORTED' ? nowIso : '';
    if(result.shouldStopBatch || detectTgErrorCode(result.rawError || result.error)==='PEER_FLOOD' || detectTgErrorCode(result.rawError || result.error)==='FLOOD_WAIT'){
      ent.tgBlockedUntil = setTgCooldownInfo(result);
    }
  }
  if(typeof fbSave==='function') fbSave('entrepreneurs', ent);
}

function buildTgBatchToast(prefix, result){
  var parts = [prefix + ' ' + (result.sent||0) + ' ta yuborildi'];
  if(result.fail) parts.push(result.fail + ' ta xato');
  if(result.skipped) parts.push(result.skipped + ' ta telefonsiz');
  if(result.remaining) parts.push(result.remaining + ' ta navbatda qoldi');
  return parts.join(', ') + '.';
}

async function sendTelegramBatch(rawList, buildMessage, options){
  options = options || {};
  var list = (rawList || []).filter(function(item){ return !!item; });
  var sendable = list.filter(function(item){ return !!item.phone; });
  var skipped = list.length - sendable.length;

  if(_tgBatchRunning){
    var busyMsg = 'Telegram yuborish allaqachon davom etmoqda. Avvalgi navbat tugasin.';
    toast(busyMsg,'info');
    return {sent:0, fail:0, skipped:skipped, remaining:sendable.length, stopped:true, reason:'BUSY', message:busyMsg};
  }

  var cooldown = getTgCooldownInfo();
  if(cooldown.active){
    var cooldownMsg = 'Telegram vaqtincha pauzada. ' + formatTgDuration(cooldown.remainingMs) + ' dan keyin yana urinib ko\'ring.';
    toast(cooldownMsg,'error');
    return {sent:0, fail:0, skipped:skipped, remaining:sendable.length, stopped:true, reason:cooldown.reason, message:cooldownMsg};
  }

  if(!sendable.length){
    return {sent:0, fail:0, skipped:skipped, remaining:0, stopped:false, reason:'NO_PHONE', message:'Telefon raqamli tadbirkor topilmadi'};
  }

  _tgBatchRunning = true;
  var sent = 0, fail = 0, stopped = false, stopReason = '', stopMessage = '';
  try {
    for(var i=0;i<sendable.length;i++){
      var ent = sendable[i];
      var result = await sendTgMessage(ent.phone, buildMessage(ent, i), ent.name);
      applyTgResultToEntrepreneur(ent, result);
      if(result.ok){
        sent++;
        console.log('📲 '+ent.name+' → '+(result.phone||ent.phone)+' ✅');
      } else {
        fail++;
        console.log('❌ '+ent.name+' ('+(result.phone||ent.phone||'')+'): '+result.error);
        if(result.code==='CONTACT_IMPORTED'){
          stopped = true;
          stopReason = result.code;
          stopMessage = 'Yangi kontakt Telegram akkauntga saqlandi. Spam himoyasini asrash uchun 10-15 daqiqadan keyin yana yuboring.';
          break;
        }
        if(result.shouldStopBatch){
          stopped = true;
          stopReason = result.code || detectTgErrorCode(result.rawError || result.error) || 'PEER_FLOOD';
          var activeCooldown = getTgCooldownInfo();
          stopMessage = 'Telegram ' + stopReason + ' chiqardi, batch to\'xtatildi.';
          if(activeCooldown.active) stopMessage += ' Qayta urinish: ' + new Date(activeCooldown.until).toLocaleString('uz-UZ');
          break;
        }
      }

      if(i < sendable.length - 1){
        var waitMs = getTgQueueDelayMs(i + 1);
        if(waitMs >= TG_BATCH_BURST_PAUSE_MS && options.showWaitToasts!==false){
          toast('⏳ Limitni asrash uchun ' + Math.round(waitMs/1000) + ' soniya pauza qilinmoqda...','info');
        }
        await new Promise(function(resolve){ setTimeout(resolve, waitMs); });
      }
    }
  } finally {
    _tgBatchRunning = false;
    renderEntrepreneurs();
  }

  return {
    sent:sent,
    fail:fail,
    skipped:skipped,
    stopped:stopped,
    remaining:Math.max(0, sendable.length - sent - fail),
    reason:stopReason,
    message:stopMessage
  };
}

// Telefon raqamga to'g'ridan-to'g'ri Telegram xabar yuborish
async function sendTgMessage(phone, message, name){
  var cleanPhone = tgNormalizePhone(phone);
  if(!cleanPhone) return {ok:false, error:'Telefon raqam yo\'q', code:'NO_PHONE', shouldStopBatch:false};

  var cooldown = getTgCooldownInfo();
  if(cooldown.active){
    return {
      ok:false,
      phone:cleanPhone,
      error:'Telegram vaqtincha pauzada. ' + formatTgDuration(cooldown.remainingMs) + ' dan keyin yana urinib ko\'ring.',
      rawError:cooldown.reason || 'PEER_FLOOD',
      code:cooldown.reason || 'PEER_FLOOD',
      retryAfterSec:Math.ceil(cooldown.remainingMs / 1000),
      shouldStopBatch:true
    };
  }

  try {
    var resp = await fetch(TG_API_BASE+'/tg-send', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({phone:cleanPhone, message:message, firstName:name||'Tadbirkor'})
    });
    var data = await resp.json();
    if(data.ok){
      return {
        ok:true,
        method:data.method||'mtproto',
        phone:cleanPhone,
        user:data.user||'',
        userId:data.userId||'',
        username:data.username||'',
        contactSource:data.contactSource||'',
        sentMessage:message || ''
      };
    }
    var code = data.code || detectTgErrorCode(data.error);
    return {
      ok:false,
      phone:cleanPhone,
      error:humanizeTgError(data.error, code),
      rawError:data.error || '',
      user:data.user||'',
      userId:data.userId||'',
      username:data.username||'',
      code:code,
      retryAfterSec:data.retryAfterSec || 0,
      shouldStopBatch:!!data.shouldStopBatch || code==='PEER_FLOOD' || code==='FLOOD_WAIT'
    };
  } catch(e){
    var fallbackCode = detectTgErrorCode(e.message);
    return {
      ok:false,
      phone:cleanPhone,
      error:humanizeTgError(e.message, fallbackCode),
      rawError:e.message || '',
      code:fallbackCode,
      retryAfterSec:Math.ceil(parseTgRetryAfterMs(e.message) / 1000),
      shouldStopBatch:fallbackCode==='PEER_FLOOD' || fallbackCode==='FLOOD_WAIT'
    };
  }
}

var SECTOR_KEYWORDS = {
  'qurilish':['qurilish','building','construction','cement','beton','plitka','granit','marmor','tosh','kafel','gips','kirpich','temir','armatura','qum','ohak','bino','uy','қурилиш','цемент','бетон','плитка','гранит','мармар','тош','кафел','гипс','ғишт','темир','арматура','қум','оҳак','бино'],
  'oziq-ovqat':['oziq','ovqat','food','non','go\'sht','sut','meva','sabzavot','don','un','yog\'','shakar','ichimlik','konserva','agrar','agro','озиқ','овқат','нон','гўшт','сут','мева','сабзавот','дон','ун','ёғ','шакар','пахта','ғалла'],
  'to\'qimachilik':['to\'qimachilik','textile','mato','ip','gazlama','tikuv','kiyim','libos','charm','teri','paxta','ipak','тўқимачилик','мато','ип','газлама','тикув','кийим','либос','чарм','тери','пахта','ипак'],
  'kimyo':['kimyo','chemical','plastik','polietilen','rezina','shisha','boya','dori','farmatsevtika','polimer','кимё','пластик','полиэтилен','резина','шиша','бўёқ','дори','фармацевтика','полимер'],
  'energetika':['energetika','energy','solar','quyosh','shamol','gaz','neft','elektr','generator','kabel','энергетика','энергия','қуёш','шамол','газ','нефт','электр','генератор','кабел'],
  'elektronika':['elektronika','electronic','kompyuter','telefon','texnologiya','IT','dastur','software','электроника','компьютер','технология','дастур'],
  'qishloq':['qishloq','fermer','chorva','paranda','baliq','issiqxona','o\'g\'it','dehqon','bog\'dorchilik','қишлоқ','фермер','чорва','паранда','балиқ','иссиқхона','ўғит','деҳқон','етиштириш','пахта'],
  'transport':['transport','logistika','yuk','tashish','avto','poyezd','samolyot','havo','temir yo\'l','транспорт','логистика','юк','ташиш','авто','поезд','самолёт','ҳаво','темир йўл'],
  'turizm':['turizm','tourism','mehmonxona','hotel','restoran','sayohat','kafe','dam olish','туризм','меҳмонхона','отел','ресторан','саёҳат','кафе','дам олиш'],
  'konchilik':['konchilik','mining','kon','oltin','mis','uran','fosfat','maden','mineral','rudnik','qazib','кончилик','қазиб','олтин','мис','уран','фосфат','минерал','рудник','қазиб олиш','каолин','кварц','marble','гранит'],
  'mebel':['mebel','furniture','yog\'och','wood','faner','eshik','deraza','karavot','shkaf','stol','мебел','ёғоч','фанер','эшик','дераза','каравот','шкаф','стол'],
  'metallurgiya':['metall','po\'lat','steel','alyuminiy','quyish','prokat','sim','truba','quvur','металл','пўлат','алюминий','қуйиш','прокат','сим','труба','қувур'],
  'sanoat':['sanoat','industrial','ishlab chiqarish','zavod','fabrika','sex','korxona','саноат','ишлаб чиқариш','завод','фабрика','цех','корхона','қайта ишлаш']
};

function renderEntrepreneurs(){
  var list = DB.entrepreneurs||[];
  if(!list.length){
    var fallbackEntrepreneurs = getLocalCollectionBackup('entrepreneurs');
    if(!fallbackEntrepreneurs.length){
      fallbackEntrepreneurs = (getDefaultDB().entrepreneurs||[]).map(function(item){ return Object.assign({}, item); });
    }
    if(fallbackEntrepreneurs.length){
      DB.entrepreneurs = fallbackEntrepreneurs;
      list = DB.entrepreneurs;
      setLocalCollectionBackup('entrepreneurs', list);
      if(typeof fbSaveCollection==='function') fbSaveCollection('entrepreneurs', list);
    }
  }
  var tgCooldown = getTgCooldownInfo();
  var el = document.getElementById('entr-count');
  if(el) el.textContent = list.length;
  var tb = document.getElementById('entr-tbody');
  if(!tb) return;
  if(!list.length){
    _entrSelectedIds = [];
    tb.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:2rem;color:var(--text3)">Tadbirkorlar bazasi bo\'sh. "📥 Excel import" orqali yuklang.</td></tr>';
    updateEntrepreneurSelectedCount();
    checkForumAlerts();
    return;
  }
  var hasSavedSelection = Array.isArray(_entrSelectedIds);
  tb.innerHTML = list.map(function(e,i){
    var tgMeta = getEntrepreneurTgStatusMeta(e, tgCooldown);
    var stIcon = renderEntrepreneurTgStatusHtml(e, tgMeta);
    var replyCheckBtn = '<button class="btn btn-sm" onclick="checkSingleTelegramReply(\''+e.id+'\')" style="background:#2563EB;color:#fff;border:none;font-size:.72rem;padding:5px 9px;margin-right:2px" title="Telegram javobini tekshirish">💬</button>';

    // replyBadge built safely via data attribute to avoid apostrophe issues
    var replyBadgeHtml = e.tgReplyText && !e.tgReplySeen
      ? '<span class="tg-reply-badge new" data-eid="'+escHtml(String(e.id))+'">● Yangi javob</span>'
      : (e.tgReplyText
          ? '<span class="tg-reply-badge seen" data-eid="'+escHtml(String(e.id))+'" title="'+escHtml(e.tgReplyText.slice(0,120))+'">💬 '+escHtml(e.tgReplyText.slice(0,30))+(e.tgReplyText.length>30?'...':'')+'</span>'
          : '<span style="color:var(--text3);font-size:.65rem">—</span>');
    var replyBadge = replyBadgeHtml;
    var checked = hasSavedSelection ? _entrSelectedIds.indexOf(String(e.id)) !== -1 : !!e.matchedForum;
    var nameCell = '<span id="nm-display-'+e.id+'" style="cursor:pointer" onclick="editEntName(\''+e.id+'\')" title="Bosib tahrirlang"><b>'+escHtml(e.name||'—')+'</b> ✏️</span>'+
      '<div id="nm-edit-'+e.id+'" style="display:none;align-items:center;gap:4px;flex-wrap:wrap">'+
        '<input style="width:220px;padding:2px 6px;font-size:.72rem;border:1px solid #4361EE;border-radius:4px" id="nm-input-'+e.id+'" value="'+tgEscapeAttr(e.name||'')+'" placeholder="Ism / Kompaniya" onkeydown="if(event.key===\'Enter\')saveEntName(\''+e.id+'\')">'+
        '<button onclick="saveEntName(\''+e.id+'\')" style="background:#059669;color:#fff;border:none;border-radius:4px;padding:2px 6px;font-size:.6rem;cursor:pointer">💾</button>'+
      '</div>';
    var phoneCell = e.phone ?
      '<span id="ph-display-'+e.id+'" style="cursor:pointer" onclick="editEntPhone(\''+e.id+'\')" title="Bosib tahrirlang">'+e.phone+' ✏️</span>' :
      '<button class="btn btn-sm" onclick="editEntPhone(\''+e.id+'\')" style="background:#F59E0B;color:#fff;border:none;font-size:.6rem;padding:2px 8px">📞 Qo\'shish</button>';
    var phoneEdit = '<div id="ph-edit-'+e.id+'" style="display:none"><input style="width:120px;padding:2px 4px;font-size:.7rem;border:1px solid #4361EE;border-radius:4px" id="ph-input-'+e.id+'" value="'+(e.phone||'')+'" placeholder="+998..." onkeydown="if(event.key===\'Enter\')saveEntPhone(\''+e.id+'\')"><button onclick="saveEntPhone(\''+e.id+'\')" style="background:#059669;color:#fff;border:none;border-radius:4px;padding:2px 6px;font-size:.6rem;margin-left:2px;cursor:pointer">💾</button></div>';
    return '<tr'+(e.matchedForum?' style="background:rgba(5,150,105,.04)"':'')+'>'+
      '<td><input type="checkbox" class="entr-check" data-id="'+e.id+'" '+(checked?'checked':'')+' onchange="updateEntrepreneurSelectedCount()"></td>'+
      '<td>'+(i+1)+'</td>'+
      '<td>'+nameCell+'</td>'+
      '<td style="font-size:.7rem">'+(e.district||'—')+'</td>'+
      '<td style="font-size:.75rem">'+phoneCell+phoneEdit+'</td>'+
      '<td style="font-size:.7rem">'+(e.sector||'—')+'</td>'+
      '<td style="font-size:.7rem;font-weight:700;color:#059669">'+(e.projectValue?'$'+e.projectValue+'M':'—')+'</td>'+
      '<td style="font-size:.6rem;color:#4361EE">'+(e.matchedForum||'—')+'</td>'+
      '<td style="font-size:.65rem">'+stIcon+'</td>'+
      '<td style="font-size:.72rem;min-width:90px">'+replyBadge+'</td>'+
      '<td style="white-space:nowrap">'+
        replyCheckBtn+
        '<button class="btn btn-sm" onclick="sendSingleTg(\''+e.id+'\')" style="background:#0088cc;color:#fff;border:none;font-size:.72rem;padding:5px 9px;margin-right:2px" title="Telegram xabar"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg></button>'+
        '<button class="btn btn-danger btn-sm" onclick="deleteEntrepreneur(\''+e.id+'\')" style="font-size:.72rem;padding:5px 9px">🗑</button>'+
      '</td></tr>';
  }).join('');
  updateEntrepreneurSelectedCount();
  checkForumAlerts();
  // Delegate clicks on reply badges
  var tbody = document.querySelector('#entr-tbody, tbody[id*="entr"]') || document.getElementById('entr-table-wrap');
  if(tbody){
    tbody.onclick = tbody.onclick || function(ev){
      var badge = ev.target.closest('.tg-reply-badge');
      if(badge && badge.dataset.eid) showEntrepreneurReply(badge.dataset.eid);
    };
  }
}

function editEntName(id){
  var display = document.getElementById('nm-display-'+id);
  var edit = document.getElementById('nm-edit-'+id);
  if(display) display.style.display = 'none';
  if(edit) edit.style.display = 'inline-flex';
  var inp = document.getElementById('nm-input-'+id);
  if(inp) inp.focus();
}

function saveEntName(id){
  var inp = document.getElementById('nm-input-'+id);
  if(!inp) return;
  var newName = inp.value.trim();
  if(!newName){
    toast('⚠️ Ism / kompaniya nomi bo\'sh bo\'lmasin','error');
    inp.focus();
    return;
  }
  var ent = (DB.entrepreneurs||[]).find(function(e){ return e.id===id; });
  if(!ent) return;
  ent.name = newName;
  if(typeof fbSave==='function') fbSave('entrepreneurs', ent);
  renderEntrepreneurs();
  toast('✏️ Ism / kompaniya yangilandi');
}

function editEntPhone(id){
  var display = document.getElementById('ph-display-'+id);
  var edit = document.getElementById('ph-edit-'+id);
  if(display) display.style.display = 'none';
  if(edit) edit.style.display = 'inline-flex';
  var inp = document.getElementById('ph-input-'+id);
  if(inp) inp.focus();
}

function saveEntPhone(id){
  var inp = document.getElementById('ph-input-'+id);
  if(!inp) return;
  var newPhone = inp.value.trim();
  var normalizedPhone = tgNormalizePhone(newPhone);
  var ent = (DB.entrepreneurs||[]).find(function(e){return e.id===id;});
  if(!ent) return;
  var oldPhone = ent.phone || '';
  ent.phone = normalizedPhone || newPhone;
  if(oldPhone !== ent.phone){
    ent.tgSent = false;
    ent.tgDate = '';
    ent.tgMethod = '';
    ent.tgUser = '';
    ent.tgPeerId = '';
    ent.tgPeerUsername = '';
    ent.tgLastError = '';
    ent.tgRawError = '';
    ent.tgRetryAfterSec = 0;
    ent.tgBlockedUntil = '';
    ent.tgPreparedAt = '';
    ent.tgReplyAt = '';
    ent.tgReplyText = '';
    ent.tgReplySeen = false;
    ent.tgSentMessage = '';
  }
  if(typeof fbSave==='function') fbSave('entrepreneurs', ent);
  renderEntrepreneurs();
  toast('📞 Telefon yangilandi: '+ent.name+' → '+ent.phone);
}

// Bitta tadbirkorga Telegram xabar yuborish
function buildEntrepreneurTelegramMessage(ent, forumText){
  var finalForum = String(forumText || ent.matchedForum || '').trim();
  var lines = [];
  lines.push('Hurmatli ' + (ent.name || 'hamkor') + ',');
  if(finalForum){
    lines.push(finalForum + ' tadbiri bo\'yicha Sizni ishtirok etishga taklif qilamiz.');
  } else {
    lines.push('Siz bilan hamkorlik va investitsiya imkoniyatlari bo\'yicha bog\'lanmoqdamiz.');
  }
  var meta = [];
  if(ent.sector) meta.push('faoliyat yo\'nalishi: ' + ent.sector);
  if(ent.district) meta.push('hudud: ' + ent.district);
  if(ent.projectValue) meta.push('loyiha qiymati: $' + ent.projectValue + 'M');
  if(meta.length){
    lines.push('Ma\'lumot uchun, ' + meta.join(', ') + '.');
  }
  if(finalForum){
    lines.push('Mazkur forum Sizning yo\'nalishingizga mos bo\'lishi mumkin. Ishtirokingizdan mamnun bo\'lamiz.');
  } else {
    lines.push('Hamkorlik imkoniyatlarini muhokama qilishdan mamnun bo\'lamiz.');
  }
  lines.push('Forum bo\'yicha qo\'shimcha savollar bo\'lsa Navoiy viloyati Investitsiyalar, sanoat va savdo boshqarmasi bosh mutaxassisi Shahzod Barnoqulovga (+998888901110) aloqaga chiqing.');
  return lines.join('\n\n');
}

async function sendSingleTg(id){
  var ent = (DB.entrepreneurs||[]).find(function(e){return e.id===id;});
  if(!ent) return;
  if(!ent.phone){toast('⚠️ Telefon raqam yo\'q. Avval raqam qo\'shing.','error');editEntPhone(id);return;}
  if(_tgBatchRunning){toast('⏳ Hozir Telegram batch ishlayapti. Tugagach qayta urinib ko\'ring.','info');return;}
  var msg = buildEntrepreneurTelegramMessage(ent);
  toast('📲 '+ent.name+' ('+ent.phone+') ga xabar yuborilmoqda...');
  var result = await sendTgMessage(ent.phone, msg, ent.name);
  applyTgResultToEntrepreneur(ent, result);
  renderEntrepreneurs();
  if(result.ok){
    toast('📲 ✅ '+ent.name+' ('+ent.phone+') ga xabar yuborildi!'+(result.user?' TG: '+result.user:''));
    startTgReplyPolling(id);
  } else {
    toast('❌ '+ent.name+': '+result.error,'error');
  }
}

// Auto-polling: 30s intervals, max 20 times (10 min) per contact
var _tgPollingTimers = {};
function startTgReplyPolling(id){
  if(_tgPollingTimers[id]) clearInterval(_tgPollingTimers[id]);
  var attempts = 0;
  var maxAttempts = 20;
  _tgPollingTimers[id] = setInterval(async function(){
    attempts++;
    var ent = (DB.entrepreneurs||[]).find(function(e){return e.id===id;});
    if(!ent || attempts > maxAttempts){
      clearInterval(_tgPollingTimers[id]);
      delete _tgPollingTimers[id];
      return;
    }
    // Already got reply — stop polling
    if(ent.tgReplyText && ent.tgReplySeen){
      clearInterval(_tgPollingTimers[id]);
      delete _tgPollingTimers[id];
      return;
    }
    var res = await checkTelegramReplies({ids:[id], silent:true});
    if(res && res.updated > 0){
      // New reply arrived
      var updated = (DB.entrepreneurs||[]).find(function(e){return e.id===id;});
      toast('💬 '+( updated ? updated.name : 'Tadbirkor')+' dan Telegram javobi keldi!', 'success');
      clearInterval(_tgPollingTimers[id]);
      delete _tgPollingTimers[id];
    }
  }, 30000); // 30 seconds
}
window.startTgReplyPolling = startTgReplyPolling;

async function sendTelegramToSelected(){
  var list = getSelectedEntrepreneurs();
  if(!list.length){
    toast('⚠️ Avval jadvaldan tadbirkorlarni belgilang','error');
    return;
  }
  var sendable = list.filter(function(e){ return !!e.phone; });
  var noPhoneCount = list.length - sendable.length;
  if(!sendable.length){
    toast('⚠️ Tanlangan tadbirkorlarda telefon raqam yo\'q','error');
    return;
  }
  var matchedCount = list.filter(function(e){ return !!e.matchedForum; }).length;
  var confirmMsg = sendable.length+' ta tanlangan tadbirkorga Telegram xabar yuborilsinmi?\nXabarlar xavfsiz navbat bilan ketadi.';
  if(matchedCount) confirmMsg += '\nMos forumli: '+matchedCount+' ta';
  if(noPhoneCount) confirmMsg += '\nTelefonsiz: '+noPhoneCount+' ta';
  if(!confirm(confirmMsg)) return;
  toast('📲 '+sendable.length+' ta tanlangan tadbirkorga Telegram yuborilmoqda...');
  var batch = await sendTelegramBatch(sendable, function(e){
    return buildEntrepreneurTelegramMessage(e);
  }, {showWaitToasts:true});
  toast(buildTgBatchToast(batch.stopped?'⏸ Telegram batch to\'xtadi:':'📲 Tayyor!', batch), batch.stopped?'error':'success');
  if(batch.message) toast(batch.message, batch.stopped?'error':'info');
}
window.sendTelegramToSelected = sendTelegramToSelected;

function importEntrepreneurs(input){
  var file = (input.files||[])[0];
  if(!file) return;
  toast('📥 '+file.name+' o\'qilmoqda...');
  var reader = new FileReader();
  reader.onload = function(ev){
    try {
      var rows = [];
      if(file.name.toLowerCase().endsWith('.csv')){
        ev.target.result.split('\n').forEach(function(line){
          var cols = line.split(/[,;\t]/).map(function(c){return c.trim().replace(/^"|"$/g,'');});
          if(cols.length>=2) rows.push(cols);
        });
      } else {
        var wb = XLSX.read(ev.target.result,{type:'array'});
        var ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false});
      }
      console.log('📥 Import: '+rows.length+' qator');

      // ═══ UNIVERSAL COLUMN DETECTION ═══
      var headerIdx=-1, cN=-1, cP=-1, cS=-1, cD=-1, cV=-1;
      var kwN=['kompaniya','компания','корхона','ism','name','nom','шахс','firma'];
      var kwP=['telefon','телефон','phone','tel','raqam','aloqa','contact','mob'];
      var kwS=['faoliyat','фаолият','лойиҳа','loyiha','sector','yo\'nalish','йўналиш','soha','направлен'];
      var kwD=['tuman','туман','район','shahar','шаҳар','city','district','hudud'];
      var kwV=['qiymat','қиймат','стоимость','value','mln','млн','dollar','долл','invest','narx'];

      for(var i=0;i<Math.min(15,rows.length);i++){
        if(!rows[i]) continue;
        var cells=rows[i].map(function(c){return String(c||'').toLowerCase().trim();});
        if(cells.filter(function(c){return c.length>1;}).length<2) continue;
        var sc=0;
        for(var ci=0;ci<cells.length;ci++){
          var h=cells[ci]; if(!h||h.length<2||h==='№'||h==='#') continue;
          if(cN<0&&kwN.some(function(k){return h.indexOf(k)!==-1;})){cN=ci;sc++;}
          else if(cP<0&&kwP.some(function(k){return h.indexOf(k)!==-1;})){cP=ci;sc++;}
          else if(cS<0&&kwS.some(function(k){return h.indexOf(k)!==-1;})){cS=ci;sc++;}
          else if(cD<0&&kwD.some(function(k){return h.indexOf(k)!==-1;})){cD=ci;sc++;}
          else if(cV<0&&kwV.some(function(k){return h.indexOf(k)!==-1;})){cV=ci;sc++;}
        }
        if(sc>=2){headerIdx=i;console.log('📋 Header qator '+i+': N='+cN+' P='+cP+' S='+cS+' D='+cD+' V='+cV);break;}
      }

      // Find first data row
      var startRow=headerIdx+1;
      while(startRow<rows.length){
        if(!rows[startRow]){startRow++;continue;}
        if(rows[startRow].some(function(c){var v=String(c||'').trim();return v.length>1&&!v.startsWith('=');})) break;
        startRow++;
      }
      console.log('📋 Data: qator '+startRow);

      if(!DB.entrepreneurs) DB.entrepreneurs=[];
      var added=0;
      for(var r=startRow;r<rows.length;r++){
        var row=rows[r]; if(!row) continue;
        var nm=cN>=0?String(row[cN]||'').trim():'';
        var ph=cP>=0?String(row[cP]||'').trim():'';
        var sec=cS>=0?String(row[cS]||'').trim():'';
        var dist=cD>=0?String(row[cD]||'').trim():'';
        var val=cV>=0?String(row[cV]||'').trim():'';
        // Fallback: find first long text if name empty
        if(!nm||nm.length<2||(!isNaN(nm)&&nm.length<4)){
          for(var ci=0;ci<row.length;ci++){
            if(ci===cP||ci===cD||ci===cV) continue;
            var cv=String(row[ci]||'').trim();
            if(cv.length>3&&isNaN(cv)&&!cv.startsWith('=')&&!cv.startsWith('+')){nm=cv;break;}
          }
        }
        if(!nm||nm.length<2) continue;
        if(nm.startsWith('=')) continue;
        if(!isNaN(nm)) continue;
        nm=nm.replace(/жис\.?\s*шахс\s*[:;]\s*/gi,'').trim();
        if(!nm||nm.length<2) continue;
        if(ph&&!ph.match(/[\d\+]/)) ph='';
        if(DB.entrepreneurs.some(function(x){return x.name===nm;})) continue;
        var rec={id:'ent_'+(Date.now()+r),name:nm,phone:(tgNormalizePhone(ph)||ph),sector:sec,district:dist,projectValue:(val&&!isNaN(val)?val:''),telegram:'',matchedForum:'',tgSent:false,addedDate:new Date().toISOString().slice(0,10)};
        DB.entrepreneurs.push(rec);
        if(typeof fbSave==='function') fbSave('entrepreneurs',rec);
        added++;
        console.log('  ✅ '+nm+' | '+ph+' | '+sec);
      }
      setLocalCollectionBackup('entrepreneurs', DB.entrepreneurs||[]);
      renderEntrepreneurs();
      toast('✅ '+added+' ta tadbirkor import qilindi!');
      if(added>0) setTimeout(function(){autoMatchAndNotify(added);},500);
    } catch(err){toast('⚠️ '+err.message,'error');console.error(err);}
  };
  if(file.name.toLowerCase().endsWith('.csv')) reader.readAsText(file); else reader.readAsArrayBuffer(file);
  if(input.value!==undefined) input.value='';
}
// ═══ AVTOMATIK OQIM: Import → Moslashtirish → Telegram ═══
async function autoMatchAndNotify(importedCount){
  toast('🔗 Forum moslashtirish boshlanmoqda...');

  // 1. MOSLASHTIRISH
  var forums=DB.forums||[];
  var entrList=DB.entrepreneurs||[];
  var allForums=[];
  forums.forEach(function(f){allForums.push({nom:f.nom||'',sana:f.sana||'',desc:f.desc||'',turi:f.turi||''});});
  if(typeof INTL_FORUMS!=='undefined'&&typeof INTL_REGIONS!=='undefined'){
    INTL_REGIONS.forEach(function(reg){
      (INTL_FORUMS[reg.key]||[]).forEach(function(f){allForums.push({nom:f.name||f.nom||'',sana:f.date||f.sana||'',desc:(f.focus||'')+(f.tags?f.tags.join(' '):''),turi:'intl'});});
    });
  }

  // Filter upcoming 90 days
  var now=new Date();
  var upcoming=allForums.filter(function(f){
    if(!f.sana) return true;
    var d=new Date(f.sana); var diff=(d-now)/86400000;
    return diff>-7 && diff<90;
  });
  if(!upcoming.length) upcoming=allForums;

  var matched=0;
  entrList.forEach(function(ent){
    if(ent.matchedForum) return; // allaqachon moslashtirilgan
    var entSec=(ent.sector||'').toLowerCase();
    if(!entSec) return;
    var bestForum=null, bestScore=0;
    upcoming.forEach(function(forum){
      var fText=(forum.nom+' '+forum.desc).toLowerCase();
      var score=0;
      for(var sk in SECTOR_KEYWORDS){
        var kws=SECTOR_KEYWORDS[sk];
        var entHas=kws.some(function(kw){return entSec.indexOf(kw)!==-1;});
        if(entHas&&kws.some(function(kw){return fText.indexOf(kw)!==-1;})) score+=10;
      }
      entSec.split(/[\s,;\/]+/).forEach(function(w){if(w.length>3&&fText.indexOf(w)!==-1) score+=5;});
      if(score>bestScore){bestScore=score;bestForum=forum;}
    });
    if(bestForum&&bestScore>=5){
      ent.matchedForum=bestForum.nom.slice(0,40)+(bestForum.sana?' ('+bestForum.sana+')':'');
      if(typeof fbSave==='function') fbSave('entrepreneurs',ent);
      matched++;
    }
  });

  renderEntrepreneurs();

  if(!matched){
    toast('⚠️ '+importedCount+' ta import qilindi, lekin mos forum topilmadi. Forumlar bazasini tekshiring.');
    return;
  }

  toast('🔗 '+matched+' ta tadbirkor forumga moslashtirildi!');

  // 2. TELEGRAM YUBORISH

  var readyList=entrList.filter(function(e){return e.matchedForum&&!e.tgSent;});
  var readyWithPhone=readyList.filter(function(e){return !!e.phone;});
  var noPhoneCount=readyList.length-readyWithPhone.length;
  if(!readyList.length) return;
  if(!readyWithPhone.length){
    toast('⚠️ Moslashtirilgan tadbirkorlar bor, lekin telefon raqamlari yo\'q. Avval raqamlarni to\'ldiring.','error');
    return;
  }

  // Natijani ko'rsatish
  var summary = '📋 NATIJA:\n\n';
  summary += '✅ Import: '+importedCount+' ta tadbirkor\n';
  summary += '🔗 Forum mos: '+matched+' ta\n';
  summary += '📨 Telegram tayyor: '+readyWithPhone.length+' ta\n';
  if(noPhoneCount) summary += '📵 Telefonsiz: '+noPhoneCount+' ta\n';
  summary += '\n';
  readyWithPhone.slice(0,5).forEach(function(e){
    summary += '• '+e.name+(e.phone?' ('+e.phone+')':'')+'\n  → '+e.matchedForum+'\n';
  });
  if(readyWithPhone.length>5) summary += '\n... va yana '+(readyWithPhone.length-5)+' ta';
  summary += '\n\nTelegram xabar yuborilsinmi?\n(Xavfsiz navbat bilan, har birida bir necha soniya pauza bo\'ladi)';

  if(!confirm(summary)) return;

  // 3. TELEGRAM YUBORISH — telefonga to'g'ridan-to'g'ri
  toast('📨 '+readyWithPhone.length+' ta tadbirkorga Telegram xabar xavfsiz navbat bilan yuborilmoqda...');
  var batch = await sendTelegramBatch(readyWithPhone, function(e){
    return buildEntrepreneurTelegramMessage(e);
  }, {showWaitToasts:true});
  toast(buildTgBatchToast(batch.stopped?'⏸ Telegram batch to\'xtadi:':'📨 Tayyor!', batch), batch.stopped?'error':'success');
  if(batch.message) toast(batch.message, batch.stopped?'error':'info');
}

function deleteEntrepreneur(id){
  DB.entrepreneurs=(DB.entrepreneurs||[]).filter(function(e){return e.id!==id;});
  setLocalCollectionBackup('entrepreneurs', DB.entrepreneurs||[]);
  if(typeof fbDelete==='function') fbDelete('entrepreneurs',id);
  renderEntrepreneurs();
}

function matchForumsToEntrepreneurs(){
  var forums=DB.forums||[];
  var entrList=DB.entrepreneurs||[];
  if(!entrList.length){toast('⚠️ Avval tadbirkorlar ro\'yxatini import qiling','error');return;}

  // Collect all forums: local + international
  var allForums=[];
  forums.forEach(function(f){allForums.push({nom:f.nom||'',sana:f.sana||'',desc:f.desc||'',turi:f.turi||''});});
  // Add INTL_FORUMS
  if(typeof INTL_FORUMS!=='undefined'&&typeof INTL_REGIONS!=='undefined'){
    INTL_REGIONS.forEach(function(reg){
      (INTL_FORUMS[reg.key]||[]).forEach(function(f){allForums.push({nom:f.name||f.nom||'',sana:f.date||f.sana||'',desc:(f.focus||'')+(f.tags?f.tags.join(' '):''),turi:'intl'});});
    });
  }
  if(!allForums.length){toast('⚠️ Forumlar bazasi bo\'sh','error');return;}

  var now=new Date();
  // Filter upcoming (next 90 days)
  var upcoming=allForums.filter(function(f){
    if(!f.sana) return true;
    var d=new Date(f.sana);
    var diff=(d-now)/(86400000);
    return diff>-7&&diff<90;
  });
  if(!upcoming.length) upcoming=allForums;

  var matched=0;
  entrList.forEach(function(ent){
    ent.matchedForum='';
    var entSec=(ent.sector||'').toLowerCase();
    if(!entSec) return;
    var bestForum=null,bestScore=0;
    upcoming.forEach(function(forum){
      var fText=(forum.nom+' '+forum.desc).toLowerCase();
      var score=0;
      for(var sk in SECTOR_KEYWORDS){
        var kws=SECTOR_KEYWORDS[sk];
        var entHas=kws.some(function(kw){return entSec.indexOf(kw)!==-1;});
        if(entHas&&kws.some(function(kw){return fText.indexOf(kw)!==-1;})) score+=10;
      }
      entSec.split(/[\s,;\/]+/).forEach(function(w){if(w.length>3&&fText.indexOf(w)!==-1) score+=5;});
      if(score>bestScore){bestScore=score;bestForum=forum;}
    });
    if(bestForum&&bestScore>=5){
      ent.matchedForum=bestForum.nom.slice(0,40)+(bestForum.sana?' ('+bestForum.sana+')':'');
      if(typeof fbSave==='function') fbSave('entrepreneurs',ent);
      matched++;
    }
  });
  renderEntrepreneurs();
  toast('🔗 '+matched+' ta tadbirkor forumga moslashtirildi! ('+(entrList.length-matched)+' ta mos kelmadi)');
}

function toggleEntrepreneursPanel(){
  var body=document.getElementById('entrBody');
  var icon=document.getElementById('entr-toggle-icon');
  if(!body) return;
  if(body.style.display==='none'){body.style.display='block';if(icon)icon.textContent='▲';}
  else{body.style.display='none';if(icon)icon.textContent='▼';}
}
window.toggleEntrepreneursPanel = toggleEntrepreneursPanel;

var _currentModalForum = '';

function showForumEntrepreneurs(forumNom){
  var entrList=DB.entrepreneurs||[];
  var tgCooldown = getTgCooldownInfo();
  var matched=entrList.filter(function(e){return e.matchedForum&&e.matchedForum.indexOf(forumNom.slice(0,15))!==-1;});
  _currentModalForum = forumNom;

  document.getElementById('femTitle').innerHTML='🗓 <b>'+forumNom+'</b> — '+matched.length+' ta mos tadbirkor';

  if(!matched.length){
    document.getElementById('femBody').innerHTML='<div style="text-align:center;padding:2rem;color:var(--text3)">Bu forumga mos tadbirkor topilmadi.<br>Avval "🔗 Moslashtirish" bosing.</div>';
  } else {
    document.getElementById('femBody').innerHTML='<table style="width:100%;font-size:.75rem"><thead><tr><th>#</th><th>Ism</th><th>Tuman</th><th>📞 Telefon</th><th>Faoliyat</th><th>📨</th><th>Amal</th></tr></thead><tbody>'+
      matched.map(function(e,i){
        var tgMeta = getEntrepreneurTgStatusMeta(e, tgCooldown);
        var st = renderEntrepreneurTgStatusHtml(e, tgMeta);
        var actionBtns = '<button class="btn btn-sm" onclick="checkSingleTelegramReply(\''+e.id+'\')" style="background:#2563EB;color:#fff;border:none;font-size:.55rem;padding:2px 6px;margin-right:2px" title="Telegram javobini tekshirish">💬</button>' +
          (e.tgReplyText ? '<button class="btn btn-sm" onclick="showEntrepreneurReply(\''+e.id+'\')" style="background:#7C3AED;color:#fff;border:none;font-size:.55rem;padding:2px 6px" title="Telegram javobini ko\'rish">👁</button>' : '');
        return '<tr><td>'+(i+1)+'</td><td><b>'+e.name+'</b></td><td style="font-size:.65rem">'+(e.district||'—')+'</td><td>'+(e.phone||'—')+'</td><td style="font-size:.65rem">'+e.sector+'</td><td>'+st+'</td><td>'+actionBtns+'</td></tr>';
      }).join('')+'</tbody></table>';
  }

  document.getElementById('forumEntrepreneursModal').style.display='flex';
}

async function sendTgForModalForum(){
  if(!_currentModalForum){toast('⚠️ Forum tanlanmagan','error');return;}
  var list=(DB.entrepreneurs||[]).filter(function(e){return e.matchedForum&&e.matchedForum.indexOf(_currentModalForum.slice(0,15))!==-1&&!e.tgSent;});
  var sendable=list.filter(function(e){return !!e.phone;});
  var noPhoneCount=list.length-sendable.length;
  if(!sendable.length){toast('⚠️ Xabar yuborish uchun telefon raqamli tadbirkor yo\'q','info');return;}
  var confirmMsg = sendable.length+' ta tadbirkorga "'+_currentModalForum.slice(0,30)+'" haqida Telegram xabar yuborilsinmi?\nXabarlar navbat bilan yuboriladi.';
  if(noPhoneCount) confirmMsg += '\nTelefonsiz: '+noPhoneCount+' ta';
  if(!confirm(confirmMsg)) return;
  toast('📲 '+sendable.length+' ta tadbirkorga xabar xavfsiz navbat bilan yuborilmoqda...');
  var batch = await sendTelegramBatch(sendable, function(e){
    return buildEntrepreneurTelegramMessage(e, _currentModalForum);
  }, {showWaitToasts:true});
  showForumEntrepreneurs(_currentModalForum);
  toast(buildTgBatchToast(batch.stopped?'⏸ Telegram batch to\'xtadi:':'📲 Tayyor!', batch), batch.stopped?'error':'success');
  if(batch.message) toast(batch.message, batch.stopped?'error':'info');
}

function checkForumAlerts(){
  var forums=DB.forums||[];
  var entrList=DB.entrepreneurs||[];
  var el=document.getElementById('forumAlerts');
  if(!el) return;

  // Include intl forums
  var allForums=[];
  forums.forEach(function(f){allForums.push({nom:f.nom||'',sana:f.sana||''});});
  if(typeof INTL_FORUMS!=='undefined'&&typeof INTL_REGIONS!=='undefined'){
    INTL_REGIONS.forEach(function(reg){
      (INTL_FORUMS[reg.key]||[]).forEach(function(f){allForums.push({nom:f.name||f.nom||'',sana:f.date||f.sana||''});});
    });
  }

  var now=new Date();
  var alerts=[];
  allForums.forEach(function(f){
    if(!f.sana) return;
    var d=new Date(f.sana);
    var days=Math.ceil((d-now)/86400000);
    if(days>0&&days<=30){
      var mc=entrList.filter(function(e){return e.matchedForum&&e.matchedForum.indexOf(f.nom.slice(0,20))!==-1;}).length;
      alerts.push({nom:f.nom,sana:f.sana,days:days,matches:mc,urgency:days<=7?'🔴':days<=14?'🟡':'🟢'});
    }
  });
  if(!alerts.length){el.style.display='none';return;}
  el.style.display='block';
  el.innerHTML='<div class="tcard" style="padding:.8rem"><div style="font-size:.8rem;font-weight:700;color:var(--text);margin-bottom:.5rem">🔔 Yaqinlashib kelayotgan forumlar (bosing → mos tadbirkorlar)</div>'+
    alerts.sort(function(a,b){return a.days-b.days;}).map(function(a){
      return '<div onclick="showForumEntrepreneurs(\''+a.nom.replace(/'/g,'')+'\')" style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg2);border-radius:8px;margin-bottom:4px;font-size:.75rem;cursor:pointer;transition:all .15s;border:1px solid var(--border)" onmouseover="this.style.background=\'rgba(67,97,238,.08)\';this.style.borderColor=\'#4361EE\'" onmouseout="this.style.background=\'var(--bg2)\';this.style.borderColor=\'var(--border)\'">'+
        '<span>'+a.urgency+'</span>'+
        '<span style="flex:1"><b>'+a.nom.slice(0,40)+'</b> — '+a.sana+'</span>'+
        '<span style="color:#4361EE;font-weight:700">'+a.days+' kun</span>'+
        '<span style="background:'+(a.matches>0?'#059669':'var(--text3)')+';color:#fff;padding:2px 8px;border-radius:10px;font-size:.6rem;font-weight:700">'+a.matches+' ta tadbirkor</span>'+
        '<span style="font-size:.8rem">→</span>'+
      '</div>';
    }).join('')+'</div>';
}

async function sendTelegramToMatched(){
  var list=(DB.entrepreneurs||[]).filter(function(e){return e.matchedForum&&!e.tgSent;});
  if(!list.length){toast('⚠️ Moslashtirilgan/yuborilmagan tadbirkor yo\'q','error');return;}
  var sendable=list.filter(function(e){return !!e.phone;});
  var noPhoneCount=list.length-sendable.length;
  if(!sendable.length){toast('⚠️ Moslashtirilgan tadbirkorlar bor, lekin telefon raqamlari yo\'q','error');return;}
  var confirmMsg = sendable.length+' ta tadbirkorga Telegram profiliga to\'g\'ridan-to\'g\'ri xabar yuboriladi.\nXabarlar xavfsiz navbat bilan ketadi.';
  if(noPhoneCount) confirmMsg += '\nTelefonsiz: '+noPhoneCount+' ta';
  if(!confirm(confirmMsg)) return;
  toast('📲 '+sendable.length+' ta tadbirkorga xabar yuborilmoqda...');
  var batch = await sendTelegramBatch(sendable, function(e){
    return buildEntrepreneurTelegramMessage(e);
  }, {showWaitToasts:true});
  toast(buildTgBatchToast(batch.stopped?'⏸ Telegram batch to\'xtadi:':'📲 Tayyor!', batch), batch.stopped?'error':'success');
  if(batch.message) toast(batch.message, batch.stopped?'error':'info');
}
window.sendTelegramToMatched = sendTelegramToMatched;

async function sendTelegramForForum(forumNom, forumSana){
  var list=(DB.entrepreneurs||[]).filter(function(e){return e.matchedForum&&e.matchedForum.indexOf(forumNom.slice(0,15))!==-1&&!e.tgSent;});
  if(!list.length){toast('⚠️ "'+forumNom+'" uchun mos/yuborilmagan tadbirkor yo\'q','info');return;}
  var sendable=list.filter(function(e){return !!e.phone;});
  var noPhoneCount=list.length-sendable.length;
  if(!sendable.length){toast('⚠️ "'+forumNom+'" uchun telefon raqamli tadbirkor topilmadi','info');return;}
  toast('📲 "'+forumNom.slice(0,30)+'" — '+sendable.length+' ta tadbirkorga xavfsiz navbat bilan...');
  if(noPhoneCount) toast('ℹ️ Telefonsiz '+noPhoneCount+' ta tadbirkor o\'tkazib yuborildi.','info');
  var batch = await sendTelegramBatch(sendable, function(e){
    return buildEntrepreneurTelegramMessage(e, forumNom+(forumSana?' — '+forumSana:''));
  }, {showWaitToasts:true});
  toast(buildTgBatchToast(batch.stopped?'⏸ Telegram batch to\'xtadi:':'📲 Tayyor!', batch), batch.stopped?'error':'success');
  if(batch.message) toast(batch.message, batch.stopped?'error':'info');
}

/* ═══════════════════════════════════════════════════════════════
   NAVOI INVESTMENT PPTX GENERATOR — 23 SLIDES
   Matches template: Проект_мраморная_линия.pptx
   Each product gets individual presentation with real data
   ═══════════════════════════════════════════════════════════════ */

/* ═══ PPTX GENERATOR — Template Cloning via JSZip ═══ */
var PPTX_TEMPLATE_URLS = [
  'https://navoiy-api-proxy.vercel.app/template.pptx',
  'https://investnavoi.github.io/investitsiya/template_english.pptx',
  './template_english.pptx'
];
var _pptxTemplateCache = null;

async function fetchPptxTemplate(){
  if(_pptxTemplateCache) return _pptxTemplateCache;
  toast('📥 Template yuklanmoqda (faqat 1 marta)...');
  for(var i=0; i<PPTX_TEMPLATE_URLS.length; i++){
    try {
      var resp = await fetch(PPTX_TEMPLATE_URLS[i]);
      if(resp.ok){
        _pptxTemplateCache = await resp.arrayBuffer();
        toast('✅ Template yuklandi! ('+Math.round(_pptxTemplateCache.byteLength/1024)+'KB)');
        return _pptxTemplateCache;
      }
    } catch(e){ console.log('PPTX template URL #'+(i+1)+' failed:', e.message); }
  }
  toast('⚠️ Template URL ishlamadi. Mahalliy fayldan yuklang.','error');
  throw new Error('Template topilmadi. ⚙️ Sozlamalar → PPTX Template Yuklash bosing.');
}

async function generateProductPPTX(productId){
  var product = (DB.products||[]).find(function(p){return p.id===productId;});
  if(!product) return toast('❌ Mahsulot topilmadi','error');
  var rawMat = (DB.rawMaterials||[]).find(function(r){return r.id===product.raw_id;}) || {name_en:product.raw_name||'Unknown'};

  toast('📊 Prezentatsiya tayyorlanmoqda: '+product.name_en+'...');

  // Step 1: Fetch template
  var templateBuf;
  try {
    templateBuf = await fetchPptxTemplate();
  } catch(e){
    // Fallback: ask user to upload template
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.pptx';
    inp.onchange = async function(){
      var file = inp.files[0];
      if(!file) return;
      _pptxTemplateCache = await file.arrayBuffer();
      toast('✅ Template yuklandi! Qayta urinilmoqda...');
      generateProductPPTX(productId);
    };
    inp.click();
    return;
  }

  // Step 2: Open with JSZip
  var zip = await JSZip.loadAsync(templateBuf);

  // Step 3: Define replacements
  var prodName = product.name_en || 'Product';
  var rawName = rawMat.name_en || rawMat.name_uz || 'Raw Material';
  var hsCode = product.hs_code || 'N/A';

  // Get AI-generated data for this specific product
  var aiData = null;
  try {
    var key = getGeminiKey();
    if(key){
      var prompt = 'Return ONLY raw JSON for investment project producing "'+prodName+'" (HS:'+hsCode+') from "'+rawName+'" in Navoi, Uzbekistan.\n'+
        '{"investment_mln":"3.56","jobs":59,"payback_months":56,"export_pct":70,"domestic_pct":30,'+
        '"deposit_reserves":"577,900 m³","deposit_color":"Gray, White-Gray, White",'+
        '"density":"2.72","water_absorption":"0.05-0.09%","compressive_strength":"818 kg/cm²",'+
        '"frost_resistance":"F-25","annual_capacity":"15,000 tons",'+
        '"top5_importers":[{"country":"Russia","value_mln":45},{"country":"Kazakhstan","value_mln":12},'+
        '{"country":"Turkey","value_mln":28},{"country":"China","value_mln":65},{"country":"Germany","value_mln":32}],'+
        '"quarry_equip_total_usd":"924,718","factory_equip_total_usd":"1,393,720","building_total_usd":"646,237",'+
        '"annual_revenue_usd":"1,327,940","annual_expenses_usd":"551,650","npv_usd":"776,290"}';
      var body = {contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:600}};
      var data = await callGemini(body);
      aiData = safeParseJSON(geminiText(data));
    }
  } catch(e){ console.log('PPTX AI:', e); }

  // Build replacement map — {PRODUCT_NAME} and {RAW_MATERIAL} are primary
  var replacements = {
    '{PRODUCT_NAME}': prodName,
    '{RAW_MATERIAL}': rawName
  };

  // AI-specific number replacements (matching template values)
  if(aiData){
    if(aiData.investment_mln) replacements['3,56'] = String(aiData.investment_mln);
    if(aiData.jobs) replacements['>59<'] = '>'+aiData.jobs+'<';
    if(aiData.payback_months) replacements['56 months'] = aiData.payback_months+' months';
    if(aiData.deposit_reserves) replacements['577,9'] = String(aiData.deposit_reserves).replace(/\s*m[³3]?\s*/g,'');
    if(aiData.deposit_color) replacements['Gray, White-Gray, White'] = aiData.deposit_color;
    if(aiData.density) replacements['2,721'] = String(aiData.density);
    if(aiData.compressive_strength) replacements['818'] = String(aiData.compressive_strength).replace(/[^0-9.,]/g,'');
    if(aiData.frost_resistance) replacements['F-25'] = String(aiData.frost_resistance).replace('Grade ','');
    if(aiData.export_pct) replacements['70 %'] = aiData.export_pct+' %';
    if(aiData.domestic_pct) replacements['30 %'] = aiData.domestic_pct+' %';
  }

  // Step 4: Replace text in all slide XMLs
  var slideFiles = Object.keys(zip.files).filter(function(f){
    return f.startsWith('ppt/slides/slide') && f.endsWith('.xml');
  });

  for(var i=0; i<slideFiles.length; i++){
    var fileName = slideFiles[i];
    var content = await zip.file(fileName).async('string');
    var modified = false;

    for(var oldText in replacements){
      if(content.indexOf(oldText) !== -1){
        // Use global replace
        content = content.split(oldText).join(replacements[oldText]);
        modified = true;
      }
    }

    if(modified){
      zip.file(fileName, content);
    }
  }

  // Step 5: Generate and download
  var blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    compression: 'DEFLATE',
    compressionOptions: {level: 6}
  });

  // Download
  var fileName = prodName.replace(/[^a-zA-Z0-9\s]/g,'').replace(/\s+/g,'_').slice(0,35)+'_Investment.pptx';
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  toast('✅ Prezentatsiya yuklandi: '+fileName+' (23 slayd, xuddi namuna asosida)');
}

// Allow manual template upload via Settings
function uploadPptxTemplate(){
  var inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.pptx';
  inp.onchange = async function(){
    var file = inp.files[0];
    if(!file) return;
    _pptxTemplateCache = await file.arrayBuffer();
    var statusEl = document.getElementById('pptx-template-status');
    if(statusEl) statusEl.textContent = '✅ '+file.name+' ('+Math.round(file.size/1024)+'KB)';
    statusEl.style.color = '#059669';
    toast('✅ PPTX template yuklandi: '+file.name+'. Endi har qanday mahsulotda 📊 bosing!');
  };
  inp.click();
}



function deleteProduct(id){
  DB.products = (DB.products||[]).filter(function(p){return p.id!=id;});
  if(typeof fbDelete==='function') fbDelete('products', id);
  renderProducts();
  toast('🗑 Mahsulot o\'chirildi va Firebase\'dan ham o\'chirildi');
}

function deleteRawMaterial(id){
  // O'chirish oldidan shu xomashyoga tegishli mahsulotlarni ham o'chirish
  var relatedProducts = (DB.products||[]).filter(function(p){return p.raw_id==id;});
  if(relatedProducts.length > 0){
    if(!confirm(relatedProducts.length + ' ta mahsulot ham o\'chiriladi. Davom etsinmi?')) return;
    relatedProducts.forEach(function(p){
      if(typeof fbDelete==='function') fbDelete('products', p.id);
    });
    DB.products = (DB.products||[]).filter(function(p){return p.raw_id!=id;});
  }
  DB.rawMaterials = (DB.rawMaterials||[]).filter(function(r){return r.id!=id;});
  if(typeof fbDelete==='function') fbDelete('rawMaterials', id);
  renderProducts();
  toast('🗑 Xomashyo va uning mahsulotlari o\'chirildi');
}

function importProductsExcel(input){
  var file = (input.files||[])[0];
  if(!file) return;
  var activeSection = normalizeProductSection(PRODUCT_ACTIVE_SECTION);
  toast('📥 Excel o\'qilmoqda: '+file.name+'...');

  var reader = new FileReader();
  reader.onload = function(e){
    try {
      var wb = XLSX.read(e.target.result, {type:'array'});
      // Find best sheet: 'Master Product List', 'асосий ўзгарди', 'асосий', or first
      var sheetName = wb.SheetNames.find(function(s){return s.indexOf('Master')!==-1;})
        || wb.SheetNames.find(function(s){return s.indexOf('асосий')!==-1;})
        || wb.SheetNames[0];
      var ws = wb.Sheets[sheetName];
      var rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:''});

      var rawMaterials = [];
      var products = [];
      var format = 'unknown';

      // AUTO-DETECT FORMAT by scanning first 10 rows
      for(var i=0;i<Math.min(10,rows.length);i++){
        var rowStr = rows[i].join('|').toLowerCase();
        if(rowStr.indexOf('xomashyolar hs code')!==-1 && rowStr.indexOf('mahsulotlar hs code')!==-1 && rowStr.indexOf('xomashyolar')!==-1 && rowStr.indexOf('mahsulotlar')!==-1){
          format = 'navoiyazot_headers';
          break;
        }
        if(rowStr.indexOf('raw material')!==-1 && rowStr.indexOf('product name')!==-1){
          format = 'english';
          break;
        }
        if(rowStr.indexOf('хомаш')!==-1 || (rowStr.indexOf('махсулот')!==-1 && rowStr.indexOf('хомаш')!==-1)){
          format = 'uzbek';
          break;
        }
      }

      console.log('📥 Excel format aniqlandi:', format, '| Sheet:', sheetName);

      if(format === 'navoiyazot_headers'){
        // ═══ FORMAT: NavoiyAzot paired columns ═══
        // Headers: No. | Xomashyolar | Mahsulotlar | Xomashyolar HS code | Mahsulotlar HS code
        var headerRowIdx = -1;
        var headerMap = { rawName:-1, productName:-1, rawHs:-1, productHs:-1 };
        for(var h=0; h<Math.min(10, rows.length); h++){
          var hr = rows[h] || [];
          for(var c=0; c<hr.length; c++){
            var head = String(hr[c] || '').trim().toLowerCase();
            if(head === 'xomashyolar') headerMap.rawName = c;
            else if(head === 'mahsulotlar') headerMap.productName = c;
            else if(head === 'xomashyolar hs code') headerMap.rawHs = c;
            else if(head === 'mahsulotlar hs code') headerMap.productHs = c;
          }
          if(headerMap.rawName >= 0 && headerMap.productName >= 0){
            headerRowIdx = h;
            break;
          }
        }
        if(headerRowIdx < 0) throw new Error('NavoiyAzot ustunlari topilmadi');

        var rawMap = {};
        var productMap = {};
        var rawCounter = 0;
        var productCounter = 0;

        function azotKey(name, hs){
          return String(name || '').trim().toLowerCase() + '|' + String(hs || '').replace(/\s+/g,'');
        }

        for(var r=headerRowIdx+1; r<rows.length; r++){
          var row = rows[r] || [];
          var rawName = String(row[headerMap.rawName] || '').trim();
          var productName = String(row[headerMap.productName] || '').trim();
          var rawHs = String(row[headerMap.rawHs] || '').replace(/\s+/g,'').trim();
          var productHs = String(row[headerMap.productHs] || '').replace(/\s+/g,'').trim();

          if(!rawName && !productName) continue;
          if(rawName && /^xomashyolar$/i.test(rawName)) continue;
          if(productName && /^mahsulotlar$/i.test(productName)) continue;

          var rawRec = null;
          if(rawName){
            var rk = azotKey(rawName, rawHs);
            rawRec = rawMap[rk];
            if(!rawRec){
              rawCounter++;
              rawRec = {
                id: 'rm_tmp_' + rawCounter,
                name_uz: rawName,
                name_en: rawName,
                hs_code: rawHs,
                location: 'Navoiy',
                source: 'NavoiyAzot Excel'
              };
              rawMap[rk] = rawRec;
              rawMaterials.push(rawRec);
            }
          }

          if(productName){
            var pk = azotKey(productName, productHs) + '|' + (rawRec ? rawRec.id : rawName);
            if(!productMap[pk]){
              productCounter++;
              var linkedRaw = rawRec || rawMaterials.find(function(item){ return String(item.name_en || '').trim().toLowerCase() === rawName.toLowerCase(); }) || null;
              productMap[pk] = {
                id: 'pr_tmp_' + productCounter,
                raw_id: linkedRaw ? linkedRaw.id : '',
                raw_name: linkedRaw ? (linkedRaw.name_en || linkedRaw.name_uz || rawName) : rawName,
                name_en: productName,
                name_uz: productName,
                hs_code: productHs,
                processing_level: activeSection === 'azot' ? 'NavoiyAzot mahsuloti' : '',
                price: '',
                description: '',
                usage: activeSection === 'azot' ? 'NavoiyAzot ishlab chiqarish zanjiri' : '',
                import_info: '',
                main_sector: activeSection === 'azot' ? 'Kimyo / NavoiyAzot' : '',
                main_buyers: ''
              };
              products.push(productMap[pk]);
            }
          }
        }
      } else if(format === 'english'){
        // ═══ FORMAT: English (Master Product List) ═══
        // Headers: #, Raw Material, Product Name, HS Code, Processing Level, Raw Material #
        var currentRaw = null;
        var currentRawId = 0;

        for(var r=0; r<rows.length; r++){
          var row = rows[r];
          if(!row || row.length < 3) continue;

          var colA = String(row[0]||'').trim();
          var colB = String(row[1]||'').trim();
          var colC = String(row[2]||'').trim();
          var colD = String(row[3]||'').trim();
          var colE = String(row[4]||'').trim();

          // Skip header/title rows
          if(colA === '#' || colA.indexOf('NAVOI')!==-1 || colA.indexOf('Total')!==-1) continue;
          if(!colA) continue;

          // Section header: "#1 — GRANITE" or "#2  —  BASALT"
          if(colA.match(/^#\d+/) && !colB){
            // Extract raw material name from section header
            var rawName = colA.replace(/^#\d+\s*[—–-]\s*/,'').trim();
            currentRawId++;
            currentRaw = {
              id: 'rm_'+currentRawId,
              name_uz: rawName.charAt(0).toUpperCase()+rawName.slice(1).toLowerCase(),
              name_en: rawName.charAt(0).toUpperCase()+rawName.slice(1).toLowerCase(),
              location: 'Navoiy'
            };
            var exists = rawMaterials.find(function(rm){return rm.name_en.toLowerCase()===rawName.toLowerCase();});
            if(!exists) rawMaterials.push(currentRaw);
            else currentRaw = exists;
            continue;
          }

          // Data row: number in col A, raw material in B, product in C
          if(colB && colC && !isNaN(parseInt(colA))){
            // If no section header was found yet, create raw material from B column
            if(!currentRaw || currentRaw.name_en.toLowerCase() !== colB.toLowerCase()){
              var existRM = rawMaterials.find(function(rm){return rm.name_en.toLowerCase()===colB.toLowerCase();});
              if(!existRM){
                currentRawId++;
                currentRaw = {id:'rm_'+currentRawId, name_uz:colB, name_en:colB, location:'Navoiy'};
                rawMaterials.push(currentRaw);
              } else {
                currentRaw = existRM;
              }
            }

            products.push({
              id: 'pr_'+(products.length+1),
              raw_id: currentRaw.id,
              raw_name: currentRaw.name_en,
              name_en: colC,
              name_uz: colC,
              hs_code: colD.replace(/\s+/g,''),
              processing_level: colE,
              price: '',
              description: '',
              usage: colE || '',
              import_info: '',
              main_sector: colE || '',
              main_buyers: ''
            });
          }
        }
      } else {
        // ═══ FORMAT: Uzbek (асосий) ═══
        var currentRaw2 = null;
        var currentRawId2 = 0;
        var startRow = 0;

        for(var i=0;i<Math.min(10,rows.length);i++){
          var rowStr = rows[i].join(' ').toLowerCase();
          if(rowStr.indexOf('хомаш')!==-1 || rowStr.indexOf('махсулот')!==-1){
            startRow = i+1;
            if(rows[i+1] && rows[i+1].join(' ').indexOf('Аниқланган')!==-1) startRow = i+2;
            break;
          }
        }
        if(startRow===0) startRow = 5;

        for(var r=startRow; r<rows.length; r++){
          var row = rows[r];
          if(!row || row.length<6) continue;

          var colB = String(row[1]||'').trim();
          var colC = String(row[2]||'').trim();
          var colD = row[3];
          var colE = row[4];
          var colF = String(row[5]||'').trim();
          var colG = String(row[6]||'').trim();
          var colH = String(row[7]||'').trim();
          var colI = String(row[8]||'').trim();
          var colJ = String(row[9]||'').trim();
          var colK = String(row[10]||'').trim();
          var colL = String(row[11]||'').trim();
          var colM = String(row[12]||'').trim();

          if(colB && colB.length>1 && colB!=='None' && isNaN(colB)){
            currentRawId2++;
            currentRaw2 = {id:'rm_'+currentRawId2, name_uz:colB, name_en:colB, unit:colC,
              reserve_confirmed:parseFloat(colD)||0, reserve_prospective:parseFloat(colE)||0, location:'Navoiy'};
            var exists = rawMaterials.find(function(rm){return rm.name_uz===colB;});
            if(!exists) rawMaterials.push(currentRaw2);
            else currentRaw2 = exists;
          }

          if(colF && colF.length>2 && currentRaw2){
            products.push({id:'pr_'+(products.length+1), raw_id:currentRaw2.id, raw_name:currentRaw2.name_uz,
              name_en:colF, name_uz:colF, hs_code:colG.replace(/\s+/g,' '), share:colH,
              description:colI.slice(0,150), usage:colJ.slice(0,150), import_info:colK.slice(0,150),
              main_sector:colL.slice(0,150), main_buyers:colM.slice(0,150)});
          }
        }
      }

      if(!rawMaterials.length && !products.length){
        toast('⚠️ Fayldan ma\'lumot o\'qib bo\'lmadi. Ustunlarni tekshiring.','error');
        return;
      }

      // Preview
      var msg = '📥 Excel natijasi ('+format+' format):\n\n';
      msg += '⛏️ Xomashyolar: '+rawMaterials.length+' ta\n';
      msg += '📦 Mahsulotlar: '+products.length+' ta\n\n';
      rawMaterials.forEach(function(rm){
        var cnt = products.filter(function(p){return p.raw_id===rm.id;}).length;
        msg += '• '+(rm.name_en||rm.name_uz)+': '+cnt+' ta\n';
      });
      msg += '\nSaqlashni tasdiqlaysizmi?';

      if(!confirm(msg)) return;

      var idSeed = Date.now();
      var rawIdMap = {};
      rawMaterials = rawMaterials.map(function(rm, idx){
        var oldId = rm.id;
        var newId = 'rm_' + activeSection + '_' + idSeed + '_' + (idx+1);
        rawIdMap[oldId] = newId;
        return Object.assign({}, rm, { id:newId, section:activeSection });
      });
      products = products.map(function(product, idx){
        return Object.assign({}, product, {
          id: 'pr_' + activeSection + '_' + idSeed + '_' + (idx+1),
          raw_id: rawIdMap[product.raw_id] || product.raw_id,
          section: activeSection
        });
      });

      var removedRaws = (DB.rawMaterials||[]).filter(function(r){ return normalizeProductSection(r.section) === activeSection; });
      var removedProducts = (DB.products||[]).filter(function(p){ return normalizeProductSection(p.section) === activeSection; });
      var keptRaws = (DB.rawMaterials||[]).filter(function(r){ return normalizeProductSection(r.section) !== activeSection; });
      var keptProducts = (DB.products||[]).filter(function(p){ return normalizeProductSection(p.section) !== activeSection; });

      // Save to DB section-wise
      DB.rawMaterials = keptRaws.concat(rawMaterials);
      DB.products = keptProducts.concat(products);

      // Save to Firebase
      if(typeof fbDelete==='function'){
        removedProducts.forEach(function(p){ fbDelete('products', p.id); });
        removedRaws.forEach(function(r){ fbDelete('rawMaterials', r.id); });
      }
      if(typeof fbSave==='function'){
        rawMaterials.forEach(function(r){ fbSave('rawMaterials', r); });
        products.forEach(function(p){ fbSave('products', p); });
      }

      renderProducts();
      toast('✅ '+rawMaterials.length+' ta xomashyo, '+products.length+' ta mahsulot "'+getProductSectionLabel(activeSection)+'" bo\'limiga import qilindi!');

    } catch(err){
      toast('⚠️ Excel o\'qishda xato: '+err.message,'error');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
  if(input.value !== undefined) input.value = '';
}

async function loadSampleProducts(){
  var activeSection = normalizeProductSection(PRODUCT_ACTIVE_SECTION);
  toast('🤖 Gemini AI xomashyo va mahsulotlar bazasini to\'ldirmoqda...');
  try {
    var prompt = 'You are an expert on Navoi region Uzbekistan natural resources. Return ONLY raw JSON, no markdown, no backticks, no explanation.\n\nJSON format:\n{"rawMaterials":[{"name_uz":"Marmor","name_en":"Marble"}],"products":[{"raw":"Marble","name_en":"Marble tiles","hs_code":"6802.21","price":"$25/m2"}]}\n\nList 10 raw materials found in Navoi region. For each give 5 products. Total: 10 raw materials, 50 products. Use real HS codes. Keep product names short (2-3 words max).';
    var body = {contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.2,maxOutputTokens:4000}};
    var data = await callGemini(body);
    var parsed = safeParseJSON(geminiText(data));

    var idSeed = Date.now();
    var newRaws = parsed.rawMaterials.map(function(r,i){
      return {id:'rm_'+activeSection+'_'+idSeed+'_'+i, name_uz:r.name_uz, name_en:r.name_en, location:'Navoiy', section:activeSection};
    });
    var newProducts = parsed.products.map(function(p,i){
      var rm = newRaws.find(function(r){return r.name_en.toLowerCase()===String(p.raw||'').toLowerCase();});
      return {id:'pr_'+activeSection+'_'+idSeed+'_'+i, raw_id:rm?rm.id:'', raw_name:rm?(rm.name_uz||rm.name_en):String(p.raw||''), name_en:p.name_en, hs_code:p.hs_code||'', price:p.price||'', section:activeSection};
    });

    var keptRaws = (DB.rawMaterials||[]).filter(function(r){ return normalizeProductSection(r.section) !== activeSection; });
    var keptProducts = (DB.products||[]).filter(function(p){ return normalizeProductSection(p.section) !== activeSection; });
    var removedRaws = (DB.rawMaterials||[]).filter(function(r){ return normalizeProductSection(r.section) === activeSection; });
    var removedProducts = (DB.products||[]).filter(function(p){ return normalizeProductSection(p.section) === activeSection; });
    DB.rawMaterials = keptRaws.concat(newRaws);
    DB.products = keptProducts.concat(newProducts);

    if(typeof fbDelete==='function'){
      removedProducts.forEach(function(p){fbDelete('products',p.id);});
      removedRaws.forEach(function(r){fbDelete('rawMaterials',r.id);});
    }
    if(typeof fbSave==='function'){
      newRaws.forEach(function(r){fbSave('rawMaterials',r);});
      newProducts.forEach(function(p){fbSave('products',p);});
    }
    renderProducts();
    toast('✅ '+newRaws.length+' ta xomashyo, '+newProducts.length+' ta mahsulot "'+getProductSectionLabel(activeSection)+'" bo\'limiga yuklandi!');
  } catch(e){
    toast('⚠️ Xato: '+e.message,'error');
    console.error(e);
  }
}
