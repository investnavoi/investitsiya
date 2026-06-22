/* ═══════════════════════════════════════════════════════════════════════
   MAHSULOT TARKIBI (Product Composition)
   ───────────────────────────────────────────────────────────────────────
   Mahsulot strukturaviy nimalardan tashkil topganini ko'rsatadi.
   Har sahifada ishlatish uchun qayta ishlatiladigan modul.

   Manba tartibi:
     1) product.composition (qo'lda kiritilgan) — agar bo'lsa, shu ishlatiladi
     2) HS kod (6/4/2 raqam) bo'yicha bilimlar bazasi
     3) Mahsulot nomidagi kalit so'zlar
     4) Generic fallback (xom ashyo nomidan)
   ═══════════════════════════════════════════════════════════════════════ */

/* HS kod → tipik tarkib (foiz). Geologik/kimyoviy o'rtacha qiymatlar.
   Kalit: HS-6, HS-4 yoki HS-2 (qancha aniq bo'lsa, shuncha ustun). */
var PRODUCT_COMPOSITION_DB = {
  /* ── HS 25 — Tuz, oltingugurt, tuproq, tosh, gips, ohak, sement ── */
  '2501': [ {name:'Natriy xlorid (NaCl)', pct:97}, {name:'Namlik', pct:2}, {name:'Boshqa minerallar', pct:1} ],
  '2505': [ {name:'Kremnezyom (SiO₂)', pct:95}, {name:'Gil minerallari', pct:3}, {name:'Temir oksidi', pct:2} ], // qum
  '2506': [ {name:'Kvars (SiO₂)', pct:98}, {name:'Aralashmalar', pct:2} ], // kvarsit
  '2507': [ {name:'Kaolinit (Al₂O₃·2SiO₂·2H₂O)', pct:85}, {name:'Kvars', pct:10}, {name:'Dala shpati', pct:5} ], // kaolin
  '2508': [ {name:'Gil minerallari', pct:80}, {name:'Kvars', pct:12}, {name:'Temir oksidi', pct:8} ], // boshqa gillar
  '2515': [ {name:'Kalsiy karbonat (CaCO₃)', pct:95}, {name:'Magniy karbonat', pct:3}, {name:'Aralashmalar', pct:2} ], // marmar
  '2516': [ {name:'Dala shpati', pct:60}, {name:'Kvars (SiO₂)', pct:30}, {name:'Slюda (mica)', pct:10} ], // granit
  '2517': [ {name:'Tosh boʻlaklari (turli)', pct:90}, {name:'Qum', pct:10} ], // shag'al
  '2518': [ {name:'Dolomit (CaMg(CO₃)₂)', pct:96}, {name:'Aralashmalar', pct:4} ],
  '2520': [ {name:'Gips (CaSO₄·2H₂O)', pct:92}, {name:'Angidrit', pct:5}, {name:'Gil', pct:3} ], // gips
  '2521': [ {name:'Kalsiy karbonat (CaCO₃)', pct:97}, {name:'Aralashmalar', pct:3} ], // ohaktosh flyus
  '2522': [ {name:'Kalsiy oksidi (CaO)', pct:93}, {name:'Magniy oksidi', pct:4}, {name:'Aralashmalar', pct:3} ], // ohak
  '2523': [ {name:'Klinker (ohaktosh+gil)', pct:90}, {name:'Gips', pct:5}, {name:'Qoʻshimchalar', pct:5} ], // sement
  '25':   [ {name:'Mineral asos', pct:90}, {name:'Tabiiy aralashmalar', pct:10} ], // umumiy HS25

  /* ── HS 26 — Rudalar, shlaklar ── */
  '26':   [ {name:'Metall oksidi/rudasi', pct:65}, {name:'Jins (gangue)', pct:30}, {name:'Namlik', pct:5} ],

  /* ── HS 28 — Anorganik kimyo ── */
  '2814': [ {name:'Ammiak (NH₃)', pct:99}, {name:'Suv', pct:1} ],
  '2808': [ {name:'Azot kislotasi (HNO₃)', pct:68}, {name:'Suv', pct:32} ],
  '2807': [ {name:'Sulfat kislota (H₂SO₄)', pct:98}, {name:'Suv', pct:2} ],
  '28':   [ {name:'Asosiy kimyoviy birikma', pct:96}, {name:'Suv/aralashmalar', pct:4} ],

  /* ── HS 29 — Organik kimyo ── */
  '29':   [ {name:'Organik birikma', pct:97}, {name:'Aralashmalar', pct:3} ],

  /* ── HS 31 — Oʻgʻitlar ── */
  '3102': [ {name:'Karbamid (CO(NH₂)₂)', pct:46}, {name:'Toʻldiruvchi/granula', pct:52}, {name:'Namlik', pct:2} ], // azotli o'g'it
  '3103': [ {name:'Fosfor angidridi (P₂O₅)', pct:18}, {name:'Kalsiy birikmalari', pct:75}, {name:'Namlik', pct:7} ],
  '3104': [ {name:'Kaliy oksidi (K₂O)', pct:60}, {name:'Xlorid/sulfat', pct:38}, {name:'Namlik', pct:2} ],
  '3105': [ {name:'Azot (N)', pct:16}, {name:'Fosfor (P₂O₅)', pct:16}, {name:'Kaliy (K₂O)', pct:16}, {name:'Toʻldiruvchi', pct:52} ], // NPK
  '31':   [ {name:'Faol oziq element', pct:46}, {name:'Toʻldiruvchi', pct:52}, {name:'Namlik', pct:2} ],

  /* ── HS 39 — Plastmassa ── */
  '39':   [ {name:'Polimer (asos)', pct:85}, {name:'Toʻldiruvchi', pct:10}, {name:'Qoʻshimchalar', pct:5} ],

  /* ── HS 68 — Tosh, gips, sement buyumlari ── */
  '6801': [ {name:'Tabiiy tosh (granit/bazalt)', pct:97}, {name:'Aralashmalar', pct:3} ],
  '6802': [ {name:'Dala shpati', pct:55}, {name:'Kvars', pct:33}, {name:'Slюda', pct:12} ], // ishlangan tosh
  '6809': [ {name:'Gips (CaSO₄·2H₂O)', pct:90}, {name:'Toʻldiruvchi', pct:10} ],
  '6810': [ {name:'Sement', pct:15}, {name:'Qum/shagʻal (toʻldiruvchi)', pct:80}, {name:'Suv (qotgan)', pct:5} ],
  '68':   [ {name:'Mineral asos', pct:88}, {name:'Bogʻlovchi', pct:12} ],

  /* ── HS 69 — Keramika ── */
  '6907': [ {name:'Kaolin/gil', pct:50}, {name:'Dala shpati', pct:25}, {name:'Kvars', pct:25} ], // plitkalar
  '6908': [ {name:'Kaolin/gil', pct:50}, {name:'Dala shpati', pct:25}, {name:'Kvars', pct:25} ],
  '69':   [ {name:'Gil/kaolin', pct:55}, {name:'Dala shpati', pct:25}, {name:'Kvars', pct:20} ],

  /* ── HS 70 — Shisha ── */
  '7005': [ {name:'Kremnezyom qum (SiO₂)', pct:72}, {name:'Soda (Na₂O)', pct:14}, {name:'Ohak (CaO)', pct:10}, {name:'Boshqa oksidlar', pct:4} ],
  '70':   [ {name:'Kremnezyom qum (SiO₂)', pct:72}, {name:'Soda kuli', pct:14}, {name:'Ohaktosh', pct:10}, {name:'Qoʻshimchalar', pct:4} ],

  /* ── HS 72-73 — Temir va poʻlat ── */
  '72':   [ {name:'Temir (Fe)', pct:97}, {name:'Uglerod (C)', pct:2}, {name:'Legirlovchi elementlar', pct:1} ],
  '73':   [ {name:'Poʻlat (Fe-C)', pct:98}, {name:'Legirlovchi/qoplama', pct:2} ],

  /* ── HS 52/55 — Toʻqimachilik ── */
  '52':   [ {name:'Paxta tolasi (sellyuloza)', pct:99}, {name:'Namlik', pct:1} ],
  '55':   [ {name:'Sintetik tola (polyester)', pct:65}, {name:'Paxta', pct:35} ],

  /* ── HS 48 — Qogʻoz ── */
  '48':   [ {name:'Sellyuloza tolasi', pct:85}, {name:'Toʻldiruvchi (kaolin/karbonat)', pct:12}, {name:'Namlik', pct:3} ]
};

/* Mahsulot nomidagi kalit soʻzlar boʻyicha tarkib (HS yoʻq boʻlsa). */
var COMPOSITION_KEYWORDS = [
  { rx:/granit|granite/i,           comp:[ {name:'Dala shpati', pct:60}, {name:'Kvars', pct:30}, {name:'Slюda', pct:10} ] },
  { rx:/marmar|marble/i,            comp:[ {name:'Kalsiy karbonat (CaCO₃)', pct:95}, {name:'Aralashmalar', pct:5} ] },
  { rx:/ohak|lime|kalsi/i,          comp:[ {name:'Kalsiy oksidi (CaO)', pct:93}, {name:'Aralashmalar', pct:7} ] },
  { rx:/kaolin|gil|clay/i,          comp:[ {name:'Kaolinit', pct:85}, {name:'Kvars', pct:10}, {name:'Dala shpati', pct:5} ] },
  { rx:/kvars|quartz|silica|kremn/i,comp:[ {name:'Kvars (SiO₂)', pct:98}, {name:'Aralashmalar', pct:2} ] },
  { rx:/gips|gypsum/i,              comp:[ {name:'Gips (CaSO₄·2H₂O)', pct:92}, {name:'Angidrit/gil', pct:8} ] },
  { rx:/sement|cement/i,            comp:[ {name:'Klinker', pct:90}, {name:'Gips', pct:5}, {name:'Qoʻshimchalar', pct:5} ] },
  { rx:/shisha|glass/i,             comp:[ {name:'Kremnezyom qum', pct:72}, {name:'Soda', pct:14}, {name:'Ohak', pct:10}, {name:'Oksidlar', pct:4} ] },
  { rx:/keramik|ceramic|plitka|tile/i, comp:[ {name:'Gil/kaolin', pct:50}, {name:'Dala shpati', pct:25}, {name:'Kvars', pct:25} ] },
  { rx:/karbamid|urea|mochevin/i,   comp:[ {name:'Karbamid (CO(NH₂)₂)', pct:46}, {name:'Granula/toʻldiruvchi', pct:54} ] },
  { rx:/ammiak|ammonia/i,           comp:[ {name:'Ammiak (NH₃)', pct:99}, {name:'Suv', pct:1} ] },
  { rx:/selitra|nitrate|nitrat/i,   comp:[ {name:'Ammoniy nitrat (NH₄NO₃)', pct:98}, {name:'Qoʻshimchalar', pct:2} ] },
  { rx:/dala shpati|feldspar/i,     comp:[ {name:'Dala shpati (KAlSi₃O₈)', pct:92}, {name:'Kvars', pct:8} ] },
  { rx:/dolomit|dolomite/i,         comp:[ {name:'Dolomit (CaMg(CO₃)₂)', pct:96}, {name:'Aralashmalar', pct:4} ] },
  { rx:/qum|sand/i,                 comp:[ {name:'Kremnezyom (SiO₂)', pct:95}, {name:'Gil/temir oksidi', pct:5} ] }
];

/* Foizlarni 100 ga normallashtirib, tartibga soladi. */
function _normalizeComposition(list){
  if(!Array.isArray(list) || !list.length) return [];
  var clean = list
    .filter(function(c){ return c && c.name; })
    .map(function(c){ return { name:String(c.name).trim(), pct:Math.max(0, Number(c.pct||c.percentage||0)) }; });
  var total = clean.reduce(function(s,c){ return s + c.pct; }, 0);
  if(total <= 0) return clean.map(function(c){ return { name:c.name, pct:Math.round(100/clean.length) }; });
  // 100 ga normallashtirish (agar yigʻindi 100 boʻlmasa)
  if(Math.abs(total - 100) > 0.5){
    clean = clean.map(function(c){ return { name:c.name, pct:Math.round((c.pct/total)*100) }; });
  }
  return clean.sort(function(a,b){ return b.pct - a.pct; });
}

/* Mahsulot tarkibini qaytaradi: [{name, pct}, ...] yoki [] (topilmasa). */
function getProductComposition(product){
  if(!product) return [];
  // 1) Qoʻlda kiritilgan tarkib
  if(Array.isArray(product.composition) && product.composition.length){
    return _normalizeComposition(product.composition);
  }
  // 2) HS kod boʻyicha (6 → 4 → 2 raqam)
  var hs = String(product.hs_code || '').replace(/\D/g,'');
  if(hs){
    var keys = [hs.slice(0,6), hs.slice(0,4), hs.slice(0,2)];
    for(var i=0;i<keys.length;i++){
      if(keys[i] && PRODUCT_COMPOSITION_DB[keys[i]]){
        return _normalizeComposition(PRODUCT_COMPOSITION_DB[keys[i]]);
      }
    }
  }
  // 3) Nom boʻyicha kalit soʻz
  var nameText = String((product.name_en||'') + ' ' + (product.name_uz||'') + ' ' + (product.name||'') + ' ' + (product.raw_name||''));
  for(var k=0;k<COMPOSITION_KEYWORDS.length;k++){
    if(COMPOSITION_KEYWORDS[k].rx.test(nameText)){
      return _normalizeComposition(COMPOSITION_KEYWORDS[k].comp);
    }
  }
  // 4) Generic: xom ashyo nomidan
  var rawName = String(product.raw_name || '').trim();
  if(rawName){
    return [ { name:rawName + ' (asosiy)', pct:100 } ];
  }
  return [];
}

/* Tarkib uchun rang palitrasi (indeks boʻyicha). */
var _COMPOSITION_COLORS = ['#465fff','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#84cc16'];

/* Tarkibni vizual HTML qilib qaytaradi (bar diagramma).
   opts.compact = true → ixcham koʻrinish. */
function buildProductCompositionHtml(product, opts){
  opts = opts || {};
  var comp = getProductComposition(product);
  if(!comp.length){
    return '<div style="font-size:.7rem;color:var(--text3);font-style:italic">Tarkib maʼlumoti mavjud emas</div>';
  }
  var isDerived = !(Array.isArray(product.composition) && product.composition.length);
  var rows = comp.map(function(c, idx){
    var color = _COMPOSITION_COLORS[idx % _COMPOSITION_COLORS.length];
    return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem">' +
        '<div style="min-width:'+(opts.compact?'90px':'140px')+';font-size:.68rem;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+escapeHtmlText(c.name)+'">'+escapeHtmlText(c.name)+'</div>' +
        '<div style="flex:1;height:'+(opts.compact?'7px':'9px')+';background:var(--ta-gray-100,#f0f1f5);border-radius:20px;overflow:hidden;min-width:60px">' +
          '<div style="height:100%;width:'+c.pct+'%;background:'+color+';border-radius:20px;transition:width .6s ease"></div>' +
        '</div>' +
        '<div style="min-width:38px;text-align:right;font-size:.68rem;font-weight:700;color:'+color+'">'+c.pct+'%</div>' +
      '</div>';
  }).join('');

  var badge = isDerived
    ? '<span style="font-size:.56rem;color:var(--text3);background:var(--ta-gray-100,#f0f1f5);padding:1px 6px;border-radius:6px;margin-left:6px" title="HS kod / nom asosida avtomatik baholandi">≈ taxminiy</span>'
    : '<span style="font-size:.56rem;color:#10b981;background:rgba(16,185,129,.1);padding:1px 6px;border-radius:6px;margin-left:6px">✓ aniq</span>';

  return '<div class="prod-composition" style="padding:'+(opts.compact?'.5rem .2rem':'.7rem .9rem')+'">' +
      (opts.hideTitle ? '' :
        '<div style="display:flex;align-items:center;font-size:.64rem;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.04em;margin-bottom:.5rem">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></svg>' +
          'Tarkibi (strukturaviy)' + badge +
        '</div>') +
      rows +
    '</div>';
}

/* Jadval qatoridagi tarkibni ochish/yopish (expandable row). */
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
}

// Global eksport
window.getProductComposition = getProductComposition;
window.buildProductCompositionHtml = buildProductCompositionHtml;
window.toggleProductComposition = toggleProductComposition;
window.PRODUCT_COMPOSITION_DB = PRODUCT_COMPOSITION_DB;
