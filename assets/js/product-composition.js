/* ═══════════════════════════════════════════════════════════════════════
   MAHSULOT TARKIBI (Product Composition)
   ───────────────────────────────────────────────────────────────────────
   Mahsulot strukturaviy nimalardan tashkil topganini ko'rsatadi —
   ANIQ kimyoviy/mineral nomlar va formulalar bilan.

   Manba tartibi (getProductComposition):
     1) localStorage kesh (AI tomonidan oldin hisoblangan — ANIQ)
     2) product.composition (qo'lda kiritilgan — ANIQ)
     3) HS-6 / HS-4 aniq bilimlar bazasi (ANIQ)
     4) Nom bo'yicha kalit so'z (yarim aniq)
     5) HS-2 bob (generic) yoki xom ashyo nomi (fallback)

   ANIQLASHTIRISH: tarkib ochilganda, agar u aniq bo'lmasa, AI (OpenAI)
   avtomatik mahsulot nomi + HS kodi asosida aniq tarkibni hisoblaydi va
   keshlaydi. Keyingi marta darhol ko'rinadi.
   ═══════════════════════════════════════════════════════════════════════ */

/* HS kod → ANIQ tarkib (foiz). Aniq darajadagi (HS-4/HS-6) yozuvlar. */
var PRODUCT_COMPOSITION_DB = {
  /* ── HS 25 — Tuz, oltingugurt, tuproq, tosh, gips, ohak, sement ── */
  '2501': [ {name:'Natriy xlorid (NaCl)', pct:97}, {name:'Namlik (H₂O)', pct:2}, {name:'Sulfat/magniy tuzlari', pct:1} ],
  '2505': [ {name:'Kremnezyom (SiO₂)', pct:95}, {name:'Gil minerallari (Al₂O₃)', pct:3}, {name:'Temir oksidi (Fe₂O₃)', pct:2} ],
  '2506': [ {name:'Kvars (SiO₂)', pct:98}, {name:'Dala shpati', pct:2} ],
  '2507': [ {name:'Kaolinit (Al₂Si₂O₅(OH)₄)', pct:85}, {name:'Kvars (SiO₂)', pct:10}, {name:'Dala shpati', pct:5} ],
  '2508': [ {name:'Montmorillonit/illit gil', pct:80}, {name:'Kvars (SiO₂)', pct:12}, {name:'Temir oksidi (Fe₂O₃)', pct:8} ],
  '2515': [ {name:'Kalsit (CaCO₃)', pct:95}, {name:'Dolomit (CaMg(CO₃)₂)', pct:3}, {name:'Kvars/slюda', pct:2} ],
  '2516': [ {name:'Ortoklaz dala shpati (KAlSi₃O₈)', pct:55}, {name:'Kvars (SiO₂)', pct:32}, {name:'Biotit slюda', pct:8}, {name:'Plagioklaz', pct:5} ],
  '2517': [ {name:'Tabiiy tosh boʻlaklari (granit/ohaktosh)', pct:90}, {name:'Kvars qum', pct:10} ],
  '2518': [ {name:'Dolomit (CaMg(CO₃)₂)', pct:96}, {name:'Kalsit (CaCO₃)', pct:4} ],
  '2520': [ {name:'Gips (CaSO₄·2H₂O)', pct:92}, {name:'Angidrit (CaSO₄)', pct:5}, {name:'Gil aralashmasi', pct:3} ],
  '2521': [ {name:'Kalsit (CaCO₃)', pct:97}, {name:'Magniy/kremniy aralashma', pct:3} ],
  '2522': [ {name:'Kalsiy oksidi (CaO)', pct:93}, {name:'Magniy oksidi (MgO)', pct:4}, {name:'Kremnezyom (SiO₂)', pct:3} ],
  '2523': [ {name:'Klinker (3CaO·SiO₂, 2CaO·SiO₂)', pct:90}, {name:'Gips (CaSO₄·2H₂O)', pct:5}, {name:'Mineral qoʻshimchalar', pct:5} ],

  /* ── HS 28 — Anorganik kimyo ── */
  '2814': [ {name:'Ammiak (NH₃)', pct:99}, {name:'Suv (H₂O)', pct:1} ],
  '2808': [ {name:'Azot kislotasi (HNO₃)', pct:68}, {name:'Suv (H₂O)', pct:32} ],
  '2807': [ {name:'Sulfat kislota (H₂SO₄)', pct:98}, {name:'Suv (H₂O)', pct:2} ],

  /* ── HS 31 — Oʻgʻitlar ── */
  '3102': [ {name:'Karbamid (CO(NH₂)₂)', pct:46}, {name:'Granula/biuret toʻldiruvchi', pct:52}, {name:'Namlik (H₂O)', pct:2} ],
  '3103': [ {name:'Fosfor angidridi (P₂O₅)', pct:18}, {name:'Kalsiy sulfat/fosfat', pct:75}, {name:'Namlik (H₂O)', pct:7} ],
  '3104': [ {name:'Kaliy xlorid (KCl)', pct:95}, {name:'Natriy xlorid (NaCl)', pct:3}, {name:'Namlik (H₂O)', pct:2} ],
  '3105': [ {name:'Azot (N)', pct:16}, {name:'Fosfor (P₂O₅)', pct:16}, {name:'Kaliy (K₂O)', pct:16}, {name:'Toʻldiruvchi', pct:52} ],

  /* ── HS 68-70 — Tosh buyumlari, keramika, shisha ── */
  '6802': [ {name:'Ortoklaz dala shpati', pct:55}, {name:'Kvars (SiO₂)', pct:33}, {name:'Slюda', pct:12} ],
  '6809': [ {name:'Gips (CaSO₄·2H₂O)', pct:90}, {name:'Sellyuloza/toʻldiruvchi', pct:10} ],
  '6810': [ {name:'Portland sement', pct:15}, {name:'Qum/shagʻal toʻldiruvchi', pct:80}, {name:'Bogʻlangan suv', pct:5} ],
  '6907': [ {name:'Kaolin gil (Al₂Si₂O₅(OH)₄)', pct:50}, {name:'Dala shpati', pct:25}, {name:'Kvars (SiO₂)', pct:25} ],
  '6908': [ {name:'Kaolin gil', pct:50}, {name:'Dala shpati', pct:25}, {name:'Kvars (SiO₂)', pct:25} ],
  '7005': [ {name:'Kremnezyom (SiO₂)', pct:72}, {name:'Natriy oksidi (Na₂O)', pct:14}, {name:'Kalsiy oksidi (CaO)', pct:10}, {name:'Alyuminiy/magniy oksidi', pct:4} ]
};

/* Mahsulot nomidagi kalit soʻzlar → ANIQ tarkib (HS aniq emas boʻlsa). */
var COMPOSITION_KEYWORDS = [
  { rx:/granit|granite/i,            comp:[ {name:'Ortoklaz dala shpati (KAlSi₃O₈)', pct:55}, {name:'Kvars (SiO₂)', pct:32}, {name:'Biotit slюda', pct:8}, {name:'Plagioklaz', pct:5} ] },
  { rx:/marmar|marble/i,             comp:[ {name:'Kalsit (CaCO₃)', pct:95}, {name:'Dolomit (CaMg(CO₃)₂)', pct:3}, {name:'Kvars/slюda', pct:2} ] },
  { rx:/dolomit|dolomite/i,          comp:[ {name:'Dolomit (CaMg(CO₃)₂)', pct:96}, {name:'Kalsit (CaCO₃)', pct:4} ] },
  { rx:/ohaktosh|ohak|lime\b|limestone/i, comp:[ {name:'Kalsit (CaCO₃)', pct:96}, {name:'Magniy/kremniy aralashma', pct:4} ] },
  { rx:/soʻndirilgan ohak|quicklime|kalsiy oksid/i, comp:[ {name:'Kalsiy oksidi (CaO)', pct:93}, {name:'Magniy oksidi (MgO)', pct:7} ] },
  { rx:/kaolin|chinni gil|kaolinit/i,comp:[ {name:'Kaolinit (Al₂Si₂O₅(OH)₄)', pct:85}, {name:'Kvars (SiO₂)', pct:10}, {name:'Dala shpati', pct:5} ] },
  { rx:/\bgil\b|clay/i,              comp:[ {name:'Montmorillonit/illit gil', pct:80}, {name:'Kvars (SiO₂)', pct:12}, {name:'Temir oksidi (Fe₂O₃)', pct:8} ] },
  { rx:/kvars|quartz|silica|kremn/i, comp:[ {name:'Kvars (SiO₂)', pct:98}, {name:'Aralashma oksidlar', pct:2} ] },
  { rx:/gips|gypsum/i,               comp:[ {name:'Gips (CaSO₄·2H₂O)', pct:92}, {name:'Angidrit (CaSO₄)', pct:5}, {name:'Gil', pct:3} ] },
  { rx:/sement|cement|klinker/i,     comp:[ {name:'Klinker (3CaO·SiO₂)', pct:90}, {name:'Gips (CaSO₄·2H₂O)', pct:5}, {name:'Mineral qoʻshimcha', pct:5} ] },
  { rx:/shisha|glass/i,              comp:[ {name:'Kremnezyom (SiO₂)', pct:72}, {name:'Natriy oksidi (Na₂O)', pct:14}, {name:'Kalsiy oksidi (CaO)', pct:10}, {name:'Aralashma oksidlar', pct:4} ] },
  { rx:/keramik|ceramic|plitka|tile|chinni|farfor|porcelain/i, comp:[ {name:'Kaolin gil', pct:50}, {name:'Dala shpati', pct:25}, {name:'Kvars (SiO₂)', pct:25} ] },
  { rx:/karbamid|urea|mochevin/i,    comp:[ {name:'Karbamid (CO(NH₂)₂)', pct:46}, {name:'Granula toʻldiruvchi', pct:52}, {name:'Biuret', pct:2} ] },
  { rx:/ammiak|ammonia/i,            comp:[ {name:'Ammiak (NH₃)', pct:99}, {name:'Suv (H₂O)', pct:1} ] },
  { rx:/ammoniy selitra|ammonium nitrate|ammiakli selitra/i, comp:[ {name:'Ammoniy nitrat (NH₄NO₃)', pct:98}, {name:'Toʻldiruvchi/dolomit', pct:2} ] },
  { rx:/selitra|nitrate|nitrat/i,    comp:[ {name:'Ammoniy nitrat (NH₄NO₃)', pct:97}, {name:'Qoʻshimchalar', pct:3} ] },
  { rx:/sulfat kislota|sulfuric acid/i, comp:[ {name:'Sulfat kislota (H₂SO₄)', pct:98}, {name:'Suv (H₂O)', pct:2} ] },
  { rx:/azot kislota|nitric acid/i,  comp:[ {name:'Azot kislotasi (HNO₃)', pct:68}, {name:'Suv (H₂O)', pct:32} ] },
  { rx:/dala shpati|feldspar|ortoklaz/i, comp:[ {name:'Ortoklaz dala shpati (KAlSi₃O₈)', pct:90}, {name:'Kvars (SiO₂)', pct:8}, {name:'Albit', pct:2} ] },
  { rx:/qum|sand/i,                  comp:[ {name:'Kvars qum (SiO₂)', pct:95}, {name:'Gil/temir oksidi', pct:5} ] },
  { rx:/grafit|graphite/i,           comp:[ {name:'Uglerod — grafit (C)', pct:95}, {name:'Kul/mineral', pct:5} ] },
  { rx:/fosfor|phosphate|fosfat/i,   comp:[ {name:'Kalsiy fosfat (Ca₃(PO₄)₂)', pct:75}, {name:'Fosfor angidridi (P₂O₅)', pct:18}, {name:'Aralashmalar', pct:7} ] },
  { rx:/oltingugurt|sulfur|sulphur/i,comp:[ {name:'Oltingugurt (S)', pct:99}, {name:'Aralashmalar', pct:1} ] }
];

/* ── localStorage kesh (AI natijasi) ── */
function _compCacheKey(product){
  var hs = String(product && product.hs_code || '').replace(/\s+/g,'');
  var nm = String((product && (product.name_en || product.name_uz || product.name)) || '').toLowerCase().replace(/\s+/g,' ').trim().slice(0,60);
  return 'pcomp:' + hs + '|' + nm;
}
function _getCachedComposition(product){
  try {
    var raw = localStorage.getItem(_compCacheKey(product));
    if(!raw) return null;
    var arr = JSON.parse(raw);
    return (Array.isArray(arr) && arr.length) ? arr : null;
  } catch(_e){ return null; }
}
function _setCachedComposition(product, comp){
  try { localStorage.setItem(_compCacheKey(product), JSON.stringify(comp)); } catch(_e){}
}

/* Foizlarni 100 ga normallashtirib, kamayish tartibida saralaydi. */
function _normalizeComposition(list){
  if(!Array.isArray(list) || !list.length) return [];
  var clean = list
    .filter(function(c){ return c && c.name; })
    .map(function(c){ return { name:String(c.name).trim(), pct:Math.max(0, Number(c.pct||c.percentage||0)) }; });
  if(!clean.length) return [];
  var total = clean.reduce(function(s,c){ return s + c.pct; }, 0);
  if(total <= 0) return clean.map(function(c){ return { name:c.name, pct:Math.round(100/clean.length) }; });
  if(Math.abs(total - 100) > 0.5){
    clean = clean.map(function(c){ return { name:c.name, pct:Math.round((c.pct/total)*100) }; });
  }
  return clean.sort(function(a,b){ return b.pct - a.pct; });
}

/* Mahsulot tarkibini qaytaradi: {comp:[{name,pct}], specific:bool}.
   specific=true → kesh/qoʻlda/aniq HS/kalit-soʻz; false → generic fallback. */
function getProductCompositionInfo(product){
  if(!product) return { comp:[], specific:false };
  // 1) AI keshi
  var cached = _getCachedComposition(product);
  if(cached) return { comp:_normalizeComposition(cached), specific:true, source:'ai' };
  // 2) Qoʻlda kiritilgan
  if(Array.isArray(product.composition) && product.composition.length){
    return { comp:_normalizeComposition(product.composition), specific:true, source:'manual' };
  }
  // 3) HS-6 / HS-4 aniq bilimlar bazasi
  var hs = String(product.hs_code || '').replace(/\D/g,'');
  if(hs){
    var k6 = hs.slice(0,6), k4 = hs.slice(0,4);
    if(k6 && PRODUCT_COMPOSITION_DB[k6]) return { comp:_normalizeComposition(PRODUCT_COMPOSITION_DB[k6]), specific:true, source:'hs' };
    if(k4 && PRODUCT_COMPOSITION_DB[k4]) return { comp:_normalizeComposition(PRODUCT_COMPOSITION_DB[k4]), specific:true, source:'hs' };
  }
  // 4) Nom boʻyicha kalit soʻz (generic HS-2 dan ustun)
  var nameText = String((product.name_en||'') + ' ' + (product.name_uz||'') + ' ' + (product.name||'') + ' ' + (product.raw_name||''));
  for(var k=0;k<COMPOSITION_KEYWORDS.length;k++){
    if(COMPOSITION_KEYWORDS[k].rx.test(nameText)){
      return { comp:_normalizeComposition(COMPOSITION_KEYWORDS[k].comp), specific:true, source:'keyword' };
    }
  }
  // 5) Generic fallback (xom ashyo nomidan) — ANIQ EMAS
  var rawName = String(product.raw_name || '').trim();
  if(rawName){
    return { comp:[ { name:rawName + ' (asosiy modda)', pct:100 } ], specific:false, source:'raw' };
  }
  return { comp:[], specific:false, source:'none' };
}

/* Eski API (faqat massiv) — moslik uchun. */
function getProductComposition(product){
  return getProductCompositionInfo(product).comp;
}

/* ── AI orqali ANIQ tarkib hisoblash ── */
async function generateProductCompositionAI(product){
  if(typeof callOpenAI !== 'function') throw new Error('OpenAI moduli yuklanmagan');
  var name = String((product && (product.name_en || product.name_uz || product.name)) || '').trim();
  var hs = String((product && product.hs_code) || '').trim();
  var raw = String((product && product.raw_name) || '').trim();
  var prompt =
    'You are a materials scientist. Give the typical chemical/mineralogical composition BY WEIGHT (%) of this industrial product.\n' +
    'Product: "' + name + '"' + (hs ? (' (HS code ' + hs + ')') : '') + (raw ? (', made from raw material: ' + raw) : '') + '.\n\n' +
    'RULES:\n' +
    '- Use SPECIFIC chemical/mineral names WITH formulas, e.g. "Quartz (SiO₂)", "Orthoclase feldspar (KAlSi₃O₈)", "Urea (CO(NH₂)₂)", "Calcite (CaCO₃)".\n' +
    '- NEVER use vague terms like "main compound", "mixture", "other materials", "primary substance".\n' +
    '- 3 to 6 components. Percentages must sum to ~100.\n' +
    '- Component "name" field in Uzbek-friendly form is fine but MUST include the chemical formula in parentheses.\n' +
    'Return STRICT JSON ONLY: {"components":[{"name":"Quartz (SiO₂)","pct":45}, ...]}';
  var res = await callOpenAI(
    [ { role:'system', content:'You are a precise materials/chemistry expert. Return only valid JSON.' },
      { role:'user', content:prompt } ],
    { model:(window.OPENAI_MODEL_MINI || 'gpt-4o-mini'), jsonMode:true, temperature:0.2, maxTokens:500, timeoutMs:30000 }
  );
  var parsed = (typeof safeParseOpenAIJson === 'function') ? safeParseOpenAIJson(res.content) : JSON.parse(res.content);
  var comps = (parsed && (parsed.components || parsed.composition || parsed.tarkib)) || [];
  var norm = _normalizeComposition(comps);
  if(!norm.length) throw new Error('AI tarkib qaytarmadi');
  _setCachedComposition(product, norm);
  return norm;
}

/* Tarkib uchun rang palitrasi. */
var _COMPOSITION_COLORS = ['#465fff','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#84cc16'];

/* Registry — lazy AI enhancement uchun uid → product. */
var _COMP_REGISTRY = {};
var _COMP_UID = 0;

/* Bar qatorlarini yasaydi. */
function _compBars(comp, opts){
  opts = opts || {};
  return comp.map(function(c, idx){
    var color = _COMPOSITION_COLORS[idx % _COMPOSITION_COLORS.length];
    return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem">' +
        '<div style="min-width:'+(opts.compact?'120px':'180px')+';font-size:.68rem;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+escapeHtmlText(c.name)+'">'+escapeHtmlText(c.name)+'</div>' +
        '<div style="flex:1;height:'+(opts.compact?'7px':'9px')+';background:var(--ta-gray-100,#f0f1f5);border-radius:20px;overflow:hidden;min-width:60px">' +
          '<div style="height:100%;width:'+c.pct+'%;background:'+color+';border-radius:20px;transition:width .6s ease"></div>' +
        '</div>' +
        '<div style="min-width:38px;text-align:right;font-size:.68rem;font-weight:700;color:'+color+'">'+c.pct+'%</div>' +
      '</div>';
  }).join('');
}

/* Tarkibni vizual HTML qilib qaytaradi. uid orqali AI bilan aniqlashtirish mumkin. */
function buildProductCompositionHtml(product, opts){
  opts = opts || {};
  var info = getProductCompositionInfo(product);
  var uid = 'pc' + (++_COMP_UID);
  _COMP_REGISTRY[uid] = product;

  if(!info.comp.length){
    return '<div id="'+uid+'" style="font-size:.7rem;color:var(--text3);font-style:italic;padding:.5rem">Tarkib maʼlumoti mavjud emas</div>';
  }

  var badge, aiBtn = '';
  var hasKey = (typeof getOpenAIKey === 'function') && !!getOpenAIKey();
  if(info.source === 'ai' || info.source === 'manual'){
    badge = '<span style="font-size:.56rem;color:#10b981;background:rgba(16,185,129,.1);padding:1px 6px;border-radius:6px;margin-left:6px">✓ aniq</span>';
  } else if(info.specific){
    badge = '<span style="font-size:.56rem;color:#465fff;background:rgba(70,95,255,.1);padding:1px 6px;border-radius:6px;margin-left:6px">tipik tarkib</span>';
    if(hasKey) aiBtn = '<button onclick="enhanceCompositionAI(\''+uid+'\')" style="margin-left:8px;font-size:.56rem;font-weight:700;color:#7c3aed;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);border-radius:6px;padding:2px 8px;cursor:pointer">🧠 AI bilan aniqlashtirish</button>';
  } else {
    badge = '<span style="font-size:.56rem;color:#f59e0b;background:rgba(245,158,11,.12);padding:1px 6px;border-radius:6px;margin-left:6px">≈ taxminiy</span>';
    if(hasKey) aiBtn = '<button onclick="enhanceCompositionAI(\''+uid+'\')" style="margin-left:8px;font-size:.56rem;font-weight:700;color:#7c3aed;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);border-radius:6px;padding:2px 8px;cursor:pointer">🧠 Aniq tarkibni hisoblash</button>';
  }

  var titleRow = opts.hideTitle ? '' :
    '<div style="display:flex;align-items:center;flex-wrap:wrap;font-size:.64rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem">' +
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></svg>' +
      'Tarkibi (strukturaviy)' + badge + aiBtn +
    '</div>';

  return '<div id="'+uid+'" class="prod-composition" data-specific="'+(info.specific?'1':'0')+'" style="padding:'+(opts.compact?'.5rem .2rem':'.7rem .9rem')+'">' +
      titleRow + _compBars(info.comp, opts) +
    '</div>';
}

/* AI bilan aniqlashtirish — uid konteynerini yangilaydi. */
async function enhanceCompositionAI(uid){
  var el = document.getElementById(uid);
  var product = _COMP_REGISTRY[uid];
  if(!el || !product) return;
  // Loading holati
  el.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-size:.7rem;color:#7c3aed;padding:.4rem"><span style="width:14px;height:14px;border:2px solid #7c3aed;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.7s linear infinite"></span> AI aniq tarkibni hisoblamoqda...</div>';
  try {
    await generateProductCompositionAI(product);  // kesh yoziladi
    el.outerHTML = buildProductCompositionHtml(product);  // kesh'dan ANIQ qayta render
  } catch(err){
    console.error('[composition AI]', err);
    if(typeof toast === 'function') toast((window._humanizeError ? window._humanizeError(err) : 'AI tarkib hisoblay olmadi'), 'error');
    // Eski ko'rinishni tiklaymiz (taxminiy)
    el.outerHTML = buildProductCompositionHtml(product);
  }
}

/* Jadval qatoridagi tarkibni ochish/yopish; ochilganda aniq emas bo'lsa AI ni avto chaqiradi. */
function toggleProductComposition(rowId, triggerEl){
  var row = document.getElementById(rowId);
  if(!row) return;
  var isHidden = row.style.display === 'none' || !row.style.display;
  row.style.display = isHidden ? '' : 'none';
  if(triggerEl){
    triggerEl.classList.toggle('is-open', isHidden);
    var caret = triggerEl.querySelector('.prod-comp-caret');
    if(caret) caret.textContent = isHidden ? '▴' : '▾';
  }
  // Ochilganda: aniq emas + AI kaliti bor + hali enhance qilinmagan bo'lsa → avto AI
  if(isHidden){
    var box = row.querySelector('.prod-composition[data-specific="0"]');
    if(box && box.id && typeof getOpenAIKey === 'function' && getOpenAIKey() && !box._aiTried){
      box._aiTried = true;
      enhanceCompositionAI(box.id);
    }
  }
}

// Spinner animatsiyasi (bir marta)
(function(){
  try {
    if(!document.getElementById('pcomp-spin-style')){
      var st = document.createElement('style');
      st.id = 'pcomp-spin-style';
      st.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(st);
    }
  } catch(_e){}
})();

// Global eksport
window.getProductComposition = getProductComposition;
window.getProductCompositionInfo = getProductCompositionInfo;
window.generateProductCompositionAI = generateProductCompositionAI;
window.buildProductCompositionHtml = buildProductCompositionHtml;
window.enhanceCompositionAI = enhanceCompositionAI;
window.toggleProductComposition = toggleProductComposition;
window.PRODUCT_COMPOSITION_DB = PRODUCT_COMPOSITION_DB;
