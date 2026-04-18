/* ═══════════════════════════════════════
   M4: AI LETTER GENERATOR
═══════════════════════════════════════ */
var AI_COUNTRY_API_BASE = 'https://navoiy-api-proxy.vercel.app/api';
var AI_COUNTRY_ANALYSIS_CACHE = {};
var AI_PRODUCT_TARIFF_CACHE = {};
var AI_LS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Hydrate caches from localStorage on load — country/tariff data rarely changes
(function hydrateAiCachesFromLs(){
  try {
    var rawC = localStorage.getItem('_aiCountryCache');
    if(rawC){
      var parsed = JSON.parse(rawC);
      var now = Date.now();
      Object.keys(parsed || {}).forEach(function(k){
        var entry = parsed[k];
        if(entry && entry._ts && (now - entry._ts) < AI_LS_CACHE_TTL_MS){
          AI_COUNTRY_ANALYSIS_CACHE[k] = entry.data;
        }
      });
    }
    var rawT = localStorage.getItem('_aiTariffCache');
    if(rawT){
      var parsed2 = JSON.parse(rawT);
      var now2 = Date.now();
      Object.keys(parsed2 || {}).forEach(function(k){
        var entry = parsed2[k];
        if(entry && entry._ts && (now2 - entry._ts) < AI_LS_CACHE_TTL_MS){
          AI_PRODUCT_TARIFF_CACHE[k] = entry.data;
        }
      });
    }
    var nC = Object.keys(AI_COUNTRY_ANALYSIS_CACHE).length;
    var nT = Object.keys(AI_PRODUCT_TARIFF_CACHE).length;
    if(nC || nT) console.log('🔄 AI cache hydrated: '+nC+' country + '+nT+' tariff entries');
  } catch(e){ console.warn('AI cache hydrate error:', e); }
})();

function persistAiCountryCache(){
  try {
    var out = {};
    Object.keys(AI_COUNTRY_ANALYSIS_CACHE).forEach(function(k){
      out[k] = { _ts: Date.now(), data: AI_COUNTRY_ANALYSIS_CACHE[k] };
    });
    localStorage.setItem('_aiCountryCache', JSON.stringify(out));
  } catch(e){}
}
function persistAiTariffCache(){
  try {
    var out = {};
    Object.keys(AI_PRODUCT_TARIFF_CACHE).forEach(function(k){
      out[k] = { _ts: Date.now(), data: AI_PRODUCT_TARIFF_CACHE[k] };
    });
    localStorage.setItem('_aiTariffCache', JSON.stringify(out));
  } catch(e){}
}

/* escapeHtmlText moved to utils.js */

function getAiCompanyCountry(comp){
  if(!comp) return '';
  var country = String(comp.davlat || comp.country || comp.mamlakat || comp.countryName || comp.joylashuv || '').trim();
  if(country) return country;
  // Try to extract from location fields
  var loc = String(comp.manzil || comp.location || comp.city || comp.shahar || '').trim();
  if(loc){
    var parts = loc.split(',');
    if(parts.length > 1) return parts[parts.length - 1].trim();
  }
  // Try ISO2 code lookup
  var iso2 = String(comp.iso2 || comp.countryIso2 || comp.country_iso2 || '').trim().toUpperCase();
  if(iso2){
    try{
      var dn = new Intl.DisplayNames(['en'],{type:'region'});
      return dn.of(iso2) || iso2;
    }catch(e){ return iso2; }
  }
  return '';
}

function getAiCountryCacheKey(countryName){
  return String(countryName || '').trim().toLowerCase();
}

function getAiProductCacheKey(sourceIso3, hsCode){
  return [String(sourceIso3 || '').trim().toUpperCase(), String(hsCode || '').replace(/\D/g,'').slice(0,6)].join('|');
}

function normalizeAiLookupText(value){
  return String(value || '')
    .toLowerCase()
    .replace(/[''`"]/g,'')
    .replace(/[^a-z0-9а-яёўқғҳөү\s]+/gi,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function getAiCompanyProductInfo(comp){
  if(!comp) return null;
  var rawHs = String(comp.mahsulotHs || comp.hsCode || comp.productHs || '').replace(/\D/g,'');
  var productId = String(comp.productId || comp.mahsulotProductId || '').trim();
  var productName = String(comp.mahsulotNomi || comp.soha || comp.productName || '').trim();
  var product = null;
  if(productId){
    product = (DB.products || []).find(function(item){ return String(item.id || '') === productId; }) || null;
  }
  if(!product && rawHs){
    product = (DB.products || []).find(function(item){
      var itemHs = String(item.hs_code || '').replace(/\D/g,'');
      return itemHs && (itemHs.slice(0,6) === rawHs.slice(0,6) || itemHs.slice(0,4) === rawHs.slice(0,4));
    }) || null;
  }
  if(!product && productName){
    var needle = normalizeAiLookupText(productName);
    product = (DB.products || []).find(function(item){
      var hay = normalizeAiLookupText((item.name_en || '') + ' ' + (item.name_uz || ''));
      return hay && (hay === needle || hay.indexOf(needle) !== -1 || needle.indexOf(hay) !== -1);
    }) || null;
  }
  var hsCode = rawHs || String((product && product.hs_code) || '').replace(/\D/g,'');
  var displayName = product
    ? formatBilingualProductName(product)
    : (productName || '—');
  return {
    product: product,
    productId: product ? String(product.id || '') : productId,
    hsCode: hsCode ? hsCode.slice(0,6) : '',
    displayName: displayName
  };
}

async function fetchOfficialAiCountryAnalysis(comp){
  var countryName = getAiCompanyCountry(comp);
  if(!countryName) throw new Error('Kompaniyaning joylashgan davlati ko\'rsatilmagan');
  var cacheKey = getAiCountryCacheKey(countryName);
  if(AI_COUNTRY_ANALYSIS_CACHE[cacheKey] && !isAiAnalysisStale(AI_COUNTRY_ANALYSIS_CACHE[cacheKey])){
    return AI_COUNTRY_ANALYSIS_CACHE[cacheKey];
  }
  var resp = await fetch(AI_COUNTRY_API_BASE + '/ai-country-analysis?country=' + encodeURIComponent(countryName));
  var data = await resp.json().catch(function(){ return {}; });
  if(!resp.ok || data.error) throw new Error(data.error || ('Rasmiy tahlil API xato berdi ('+resp.status+')'));
  AI_COUNTRY_ANALYSIS_CACHE[cacheKey] = data;
  persistAiCountryCache();
  return data;
}

async function fetchOfficialAiTariffSummary(comp, analysis){
  var sourceIso3 = String((((analysis || {}).country || {}).iso3) || '').trim().toUpperCase();
  var productInfo = getAiCompanyProductInfo(comp);
  if(!sourceIso3) throw new Error('Kompaniya davlati aniqlanmadi');
  if(!productInfo || !productInfo.hsCode || productInfo.hsCode.length < 2) throw new Error('Mahsulotning HS kodi topilmadi');
  var cacheKey = getAiProductCacheKey(sourceIso3, productInfo.hsCode);
  if(AI_PRODUCT_TARIFF_CACHE[cacheKey]) return AI_PRODUCT_TARIFF_CACHE[cacheKey];
  var url = AI_COUNTRY_API_BASE + '/ai-country-analysis?mode=tariff&source=' + encodeURIComponent(sourceIso3) + '&hs=' + encodeURIComponent(productInfo.hsCode) + '&productName=' + encodeURIComponent(productInfo.displayName);
  var resp = await fetch(url);
  var data = await resp.json().catch(function(){ return {}; });
  if(!resp.ok || data.error) throw new Error(data.error || ('Tarif tahlil API xato berdi (' + resp.status + ')'));
  data.productInfo = productInfo;
  AI_PRODUCT_TARIFF_CACHE[cacheKey] = data;
  persistAiTariffCache();
  return data;
}

function isAiAnalysisStale(analysis){
  var tax = ((((analysis || {}).metrics || {}).totalTaxRate) || {});
  var indicator = String(tax.indicator || '');
  return !Number.isFinite(Number(tax.country)) ||
    !Number.isFinite(Number(tax.uzbekistan)) ||
    /IC\.TAX\.TOTL\.CP\.ZS/i.test(indicator);
}

function isAiTariffSummaryMissing(summary){
  if(!summary) return true;
  if(summary.status === 'unavailable') return false;
  return !Array.isArray(summary.routes) || !summary.routes.length;
}

function getAiTariffUnavailableSummary(comp, analysis, errorMessage){
  var productInfo = getAiCompanyProductInfo(comp) || null;
  return {
    status: 'unavailable',
    error: String(errorMessage || 'Rasmiy tarif ma\'lumoti topilmadi'),
    sourceIso3: String((((analysis || {}).country || {}).iso3) || '').trim().toUpperCase(),
    productName: (productInfo && productInfo.displayName) || comp.mahsulotNomi || comp.soha || 'Tanlangan mahsulot',
    hsCode: (productInfo && productInfo.hsCode) || '',
    productInfo: productInfo,
    routes: [],
    avgSourceRate: null,
    avgUzRate: null,
    avgDiff: null,
    avgDiffPct: null,
    bestAdvantage: null
  };
}

async function refreshInvestorAiOfficialData(comp){
  if(!comp || !comp.aiLetterData || !comp.aiLetterData.analysis) return;
  var saved = comp.aiLetterData || {};
  var needAnalysis = isAiAnalysisStale(saved.analysis);
  var needTariff = isAiTariffSummaryMissing(saved.tariffSummary);
  if(!needAnalysis && !needTariff) return;
  try{
    var analysis = needAnalysis ? await fetchOfficialAiCountryAnalysis(comp) : saved.analysis;
    var tariffSummary = saved.tariffSummary || null;
    if(needTariff){
      try{
        tariffSummary = await fetchOfficialAiTariffSummary(comp, analysis);
      }catch(err){
        tariffSummary = getAiTariffUnavailableSummary(comp, analysis, err && err.message ? err.message : 'Tarif ma\'lumoti topilmadi');
      }
    }
    var transportSummary = saved.transportSummary || buildAiTransportAnalysis((analysis || {}).country || {});
    comp.aiLetterData = Object.assign({}, saved, {
      analysis: analysis,
      transportSummary: transportSummary,
      tariffSummary: tariffSummary
    });
    if(typeof fbSave === 'function') fbSave('investorCompanies', comp);
    if(_investorAiOpen && String(_investorAiTargetId || '') === String(comp.id)){
      hydrateAiScope('investor', comp, {
        analysis: analysis,
        transportSummary: transportSummary,
        tariffSummary: tariffSummary,
        letterSubject: saved.subject || '',
        letterBody: saved.body || '',
        lang: saved.lang || 'en',
        generatedAt: saved.generatedAt || ''
      });
    }
  }catch(err){
    console.warn('Investor AI official refresh skipped:', err && err.message ? err.message : err);
  }
}

function aiRound(value, digits){
  var num = Number(value);
  if(!Number.isFinite(num)) return null;
  var p = Math.pow(10, digits || 0);
  return Math.round(num * p) / p;
}

function aiFmtCompactUsd(value){
  var num = Number(value);
  if(!Number.isFinite(num)) return '—';
  if(num >= 1e9) return '$' + aiRound(num / 1e9, 1) + 'B';
  if(num >= 1e6) return '$' + aiRound(num / 1e6, 1) + 'M';
  if(num >= 1e3) return '$' + aiRound(num / 1e3, 1) + 'K';
  return '$' + aiRound(num, 0);
}

function aiFmtUsdExact(value){
  var num = Number(value);
  if(!Number.isFinite(num)) return '—';
  if(num >= 1000) return '$' + aiRound(num, 0).toLocaleString('en-US');
  if(num >= 100) return '$' + aiRound(num, 1);
  return '$' + aiRound(num, 2);
}

function aiFmtWageValue(value, basisLabel){
  var num = Number(value);
  if(!Number.isFinite(num)) return '—';
  var prefix = String(basisLabel || '').indexOf('PPP') !== -1 ? 'PPP$' : '$';
  if(num >= 1000) return prefix + aiRound(num, 0).toLocaleString('en-US');
  if(num >= 100) return prefix + aiRound(num, 1);
  return prefix + aiRound(num, 2);
}

function aiFmtMwh(value){
  var num = Number(value);
  if(!Number.isFinite(num)) return '—';
  return '$' + aiRound(num, 1) + '/MWh';
}

function aiFmtPct(value){
  var num = Number(value);
  if(!Number.isFinite(num)) return '—';
  return aiRound(num, 1) + '%';
}

function aiRatioDirectionText(countryValue, uzValue, cheaperMode){
  var c = Number(countryValue);
  var u = Number(uzValue);
  if(!(c > 0) || !(u > 0)) return 'Ma\'lumot yo\'q';
  var ratio = c / u;
  if(cheaperMode){
    if(ratio >= 1.05) return aiRound(ratio, 1) + 'x arzon';
    if(ratio <= 0.95) return aiRound(1/ratio, 1) + 'x qimmat';
    return 'Deyarli teng';
  }
  if(ratio >= 1.05) return aiRound(ratio, 1) + 'x yuqori';
  if(ratio <= 0.95) return aiRound(1/ratio, 1) + 'x past';
  return 'Deyarli teng';
}

function getAiScopeKey(scope){
  return scope === 'investor' ? 'investor' : 'default';
}

function aiValueOrDash(value, formatter){
  return Number.isFinite(Number(value)) ? formatter(value) : '—';
}

function aiMetricDiffText(metricKey, countryValue, uzValue){
  var c = Number(countryValue);
  var u = Number(uzValue);
  if(!Number.isFinite(c) || !Number.isFinite(u)) return '—';
  var diff = c - u;
  if(metricKey === 'gdpPerCapita') return aiFmtUsdExact(diff);
  if(metricKey === 'industryShare' || metricKey === 'totalTaxRate') return aiFmtPct(diff);
  if(metricKey === 'monthlyWage') return aiFmtUsdExact(diff);
  if(metricKey === 'electricityPrice' || metricKey === 'naturalGasPrice') return aiFmtMwh(diff);
  return String(aiRound(diff, 2));
}

function getAiMetricDescriptor(metricKey, analysis){
  var metrics = (analysis && analysis.metrics) || {};
  if(metricKey === 'gdpPerCapita') return { key:metricKey, icon:'📈', label:'YaIM / kishi', accent:'#2563EB', metric:metrics.gdpPerCapita || {}, formatter:aiFmtUsdExact, inverse:false };
  if(metricKey === 'industryShare') return { key:metricKey, icon:'🏭', label:'Sanoat ulushi', accent:'#F59E0B', metric:metrics.industryShare || {}, formatter:aiFmtPct, inverse:false };
  if(metricKey === 'totalTaxRate') return { key:metricKey, icon:'🧾', label:'Soliq yuklamasi (% foyda)', accent:'#7C3AED', metric:metrics.totalTaxRate || {}, formatter:aiFmtPct, inverse:true };
  if(metricKey === 'monthlyWage') return { key:metricKey, icon:'👷', label:'Mehnat narxi (oylik)', accent:'#2563EB', metric:metrics.monthlyWage || {}, formatter:aiFmtWageValue, inverse:true };
  if(metricKey === 'electricityPrice') return { key:metricKey, icon:'⚡', label:'Elektr energiyasi', accent:'#DC2626', metric:metrics.electricityPrice || {}, secondaryMetric:metrics.naturalGasPrice || {}, formatter:aiFmtMwh, inverse:true };
  return null;
}

var _aiDonutId = 0;
function _aiDonutAnimate(uid, cFinal, uFinal){
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      var c = document.getElementById(uid + 'c');
      var u = document.getElementById(uid + 'u');
      if(c) c.style.strokeDashoffset = cFinal;
      if(u) u.style.strokeDashoffset = uFinal;
    });
  });
}
function buildAiDonutChart(countryVal, uzVal, ratioText, diffText, countryColor, uzColor){
  var cN = Math.abs(Number(countryVal)) || 0;
  var uN = Math.abs(Number(uzVal)) || 0;
  var total = cN + uN;
  if(total === 0) return '';
  var cPct = cN / total;
  var uPct = uN / total;
  var r = 40, cx = 55, cy = 55, sw = 14;
  var circ = 2 * Math.PI * r;
  var cLen = circ * cPct;
  var uLen = circ * uPct;
  var cFinal = 0;
  var uFinal = -cLen;
  var uid = 'aiDonut' + (++_aiDonutId);
  setTimeout(function(){ _aiDonutAnimate(uid, cFinal, uFinal); }, 50);
  return '<div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;animation:aiDonutFadeIn .6s ease both">' +
    '<div style="position:relative;width:120px;height:120px">' +
      '<svg viewBox="0 0 110 110" width="120" height="120" style="transform:rotate(-90deg);overflow:visible">' +
        '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="rgba(0,0,0,.04)" stroke-width="'+sw+'"/>' +
        '<circle id="'+uid+'c" cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+countryColor+'" stroke-width="'+sw+'" stroke-dasharray="'+cLen+' '+circ+'" stroke-dashoffset="'+circ+'" style="transition:stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1) .1s;filter:drop-shadow(0 2px 4px '+countryColor+'44)"/>' +
        '<circle id="'+uid+'u" cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+uzColor+'" stroke-width="'+sw+'" stroke-dasharray="'+uLen+' '+circ+'" stroke-dashoffset="'+circ+'" style="transition:stroke-dashoffset 1s cubic-bezier(.4,0,.2,1) .45s;filter:drop-shadow(0 2px 4px '+uzColor+'44)"/>' +
      '</svg>' +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;pointer-events:none;padding:6px">' +
        '<div style="font-size:.58rem;color:var(--text3);line-height:1.15;letter-spacing:.3px">Nisbat / farq</div>' +
        '<div style="font-size:.82rem;font-weight:800;color:#7C3AED;line-height:1.25;margin:2px 0">' + escapeHtmlText(ratioText) + '</div>' +
        '<div style="font-size:.52rem;color:var(--text3);line-height:1.2">Farq: ' + escapeHtmlText(diffText) + '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function buildAiDetailRows(rows){
  return rows.map(function(row){
    return '<tr><td style="font-weight:700;color:var(--text)">' + escapeHtmlText(row.label || '—') + '</td><td>' + escapeHtmlText(row.country || '—') + '</td><td>' + escapeHtmlText(row.uzbekistan || '—') + '</td></tr>';
  }).join('');
}

function buildAiMetricDetail(metricKey, analysis){
  if(metricKey === 'transportSummary'){
    var transportDom = getAiScopeDom('investor');
    var summary = null;
    if(transportDom && transportDom.analysisCard && transportDom.analysisCard._analysisData === analysis){
      summary = transportDom.analysisCard._transportSummary || null;
    }
    if(!summary){
      var pageDom = getAiScopeDom('page');
      if(pageDom && pageDom.analysisCard && pageDom.analysisCard._analysisData === analysis){
        summary = pageDom.analysisCard._transportSummary || null;
      }
    }
    if(!summary || !summary.routes || !summary.routes.length){
      return '<div style="border:1px solid rgba(67,97,238,.18);border-radius:14px;background:#fff;padding:1rem;color:var(--text2)">Transport kalkulyatori ma\'lumoti topilmadi.</div>';
    }
    return buildAiTransportDetail(summary);
  }
  var descriptor = getAiMetricDescriptor(metricKey, analysis);
  if(!descriptor) return '';
  var metric = descriptor.metric || {};
  var secondary = descriptor.secondaryMetric || {};
  var countryName = (((analysis || {}).country || {}).display) || 'Tanlangan davlat';
  var countryBasis = metric.countryCurrencyBasis || null;
  var uzBasis = metric.uzbekistanCurrencyBasis || null;
  var countryValue = descriptor.key === 'monthlyWage'
    ? aiValueOrDash(metric.country, function(v){ return descriptor.formatter(v, countryBasis); })
    : aiValueOrDash(metric.country, descriptor.formatter);
  var uzValue = descriptor.key === 'monthlyWage'
    ? aiValueOrDash(metric.uzbekistan, function(v){ return descriptor.formatter(v, uzBasis); })
    : aiValueOrDash(metric.uzbekistan, descriptor.formatter);
  var ratioText = aiRatioDirectionText(metric.country, metric.uzbekistan, descriptor.inverse);
  var diffText = aiMetricDiffText(descriptor.key, metric.country, metric.uzbekistan);
  var rows = [
    { label: descriptor.label, country: countryValue, uzbekistan: uzValue },
    { label: 'Oxirgi yil', country: metric.countryYear || '—', uzbekistan: metric.uzbekistanYear || '—' },
    { label: 'Birlik', country: metric.unit || '—', uzbekistan: metric.unit || '—' },
    { label: 'Manba', country: metric.source || '—', uzbekistan: metric.source || '—' },
    { label: 'Indikator', country: metric.indicator || '—', uzbekistan: metric.indicator || '—' }
  ];
  var note = '';
  if(descriptor.key === 'totalTaxRate'){
    var cParts = ((metric.components || {}).country) || {};
    var uParts = ((metric.components || {}).uzbekistan) || {};
    rows.push(
      { label: 'Labor tax', country: aiValueOrDash(cParts.laborTax, aiFmtPct), uzbekistan: aiValueOrDash(uParts.laborTax, aiFmtPct) },
      { label: 'Profit tax', country: aiValueOrDash(cParts.profitTax, aiFmtPct), uzbekistan: aiValueOrDash(uParts.profitTax, aiFmtPct) },
      { label: 'Other taxes', country: aiValueOrDash(cParts.otherTaxes, aiFmtPct), uzbekistan: aiValueOrDash(uParts.otherTaxes, aiFmtPct) }
    );
    note = 'Soliq yuklamasi uchta rasmiy komponent yig\'indisi sifatida hisoblangan: labor tax + profit tax + other taxes.';
  }
  if(descriptor.key === 'monthlyWage'){
    rows.push({ label: 'Valyuta bazasi', country: countryBasis || '—', uzbekistan: uzBasis || '—' });
    note = 'Mehnat narxi ILOSTAT ma\'lumotiga ko\'ra oylik ish haqi ko\'rsatkichi asosida taqqoslanadi.';
  }
  if(descriptor.key === 'electricityPrice'){
    rows.push(
      { label: 'Tabiiy gaz', country: aiValueOrDash(secondary.country, aiFmtMwh), uzbekistan: aiValueOrDash(secondary.uzbekistan, aiFmtMwh) },
      { label: 'Gaz yili', country: secondary.countryYear || '—', uzbekistan: secondary.uzbekistanYear || '—' },
      { label: 'Gaz manbasi', country: secondary.source || '—', uzbekistan: secondary.source || '—' }
    );
    note = 'Elektr energiyasi bilan birga tabiiy gaz bo\'yicha ham qo\'shimcha energetik fon berildi.';
  }
  var donutHtml = buildAiDonutChart(metric.country, metric.uzbekistan, ratioText, diffText, descriptor.accent || '#2563EB', '#059669');
  return '<div style="border:1px solid rgba(67,97,238,.18);border-radius:14px;background:#fff;box-shadow:0 12px 34px rgba(15,23,42,.06)">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1rem .85rem;border-bottom:1px solid rgba(67,97,238,.12);flex-wrap:wrap">' +
      '<div><div style="font-family:Sora,sans-serif;font-size:.98rem;font-weight:800;color:var(--text)">' + descriptor.icon + ' ' + escapeHtmlText(descriptor.label) + ' statistikasi</div><div style="font-size:.72rem;color:var(--text3);margin-top:4px">' + escapeHtmlText(countryName) + ' va O\'zbekiston bo\'yicha rasmiy taqqoslash</div></div>' +
      '<div style="display:flex;align-items:center;gap:.7rem;flex-wrap:wrap">' +
        '<div style="min-width:120px;padding:.58rem .7rem;border-radius:12px;background:rgba(37,99,235,.08)"><div style="font-size:.62rem;color:var(--text3)">' + escapeHtmlText(countryName) + '</div><div style="font-size:.95rem;font-weight:800;color:' + descriptor.accent + '">' + escapeHtmlText(countryValue) + '</div></div>' +
        '<div style="min-width:120px;padding:.58rem .7rem;border-radius:12px;background:rgba(5,150,105,.08)"><div style="font-size:.62rem;color:var(--text3)">O\'zbekiston</div><div style="font-size:.95rem;font-weight:800;color:#059669">' + escapeHtmlText(uzValue) + '</div></div>' +
        donutHtml +
      '</div>' +
    '</div>' +
    '<div class="tscroll" style="padding:0 1rem 1rem"><table class="ai-detail-tbl"><thead><tr><th>Ko\'rsatkich</th><th>' + escapeHtmlText(countryName) + '</th><th>O\'zbekiston</th></tr></thead><tbody>' + buildAiDetailRows(rows) + '</tbody></table></div>' +
    (note ? '<div style="padding:0 1rem 1rem;font-size:.72rem;line-height:1.6;color:var(--text2)"><strong>Izoh:</strong> ' + escapeHtmlText(note) + '</div>' : '') +
  '</div>';
}

function renderAiAnalysisDetail(scope, analysis){
  var dom = getAiScopeDom(scope);
  if(!dom.analysisDetail) return;
  var metricKey = _aiAnalysisOpenMetric[getAiScopeKey(scope)] || '';
  /* Hide transport & tariff cards by default */
  if(dom.transportCard) dom.transportCard.style.display = 'none';
  if(dom.tariffCard) dom.tariffCard.style.display = 'none';
  if(!metricKey){
    dom.analysisDetail.style.display = 'none';
    dom.analysisDetail.innerHTML = '';
    if(dom.analysisHint) dom.analysisHint.style.display = 'block';
    return;
  }
  if(dom.analysisHint) dom.analysisHint.style.display = 'none';
  /* Show transport/tariff card when their metric is selected */
  if(metricKey === 'transportSummary'){
    dom.analysisDetail.style.display = 'none';
    dom.analysisDetail.innerHTML = '';
    if(dom.transportCard) dom.transportCard.style.display = 'block';
    return;
  }
  if(metricKey === 'tariffSummary'){
    dom.analysisDetail.style.display = 'none';
    dom.analysisDetail.innerHTML = '';
    if(dom.tariffCard) dom.tariffCard.style.display = 'block';
    return;
  }
  dom.analysisDetail.style.display = 'block';
  dom.analysisDetail.innerHTML = buildAiMetricDetail(metricKey, analysis);
}

function toggleAiAnalysisDetail(scope, metricKey){
  var dom = getAiScopeDom(scope);
  var analysis = dom.analysisCard && dom.analysisCard._analysisData;
  if(!analysis) return;
  var scopeKey = getAiScopeKey(scope);
  _aiAnalysisOpenMetric[scopeKey] = (_aiAnalysisOpenMetric[scopeKey] === metricKey) ? '' : metricKey;
  renderAiAnalysis(analysis, scope);
}

window.toggleAiAnalysisDetail = toggleAiAnalysisDetail;

function buildAiMetricCard(icon, label, main, detail, accent, options){
  var scope = options && options.scope ? options.scope : '';
  var metricKey = options && options.metricKey ? options.metricKey : '';
  var selected = !!(options && options.selected);
  var clickable = scope && metricKey;
  var countryVal = options && options.countryVal;
  var uzVal = options && options.uzVal;
  var tag = clickable ? 'button' : 'div';
  var attrs = clickable ? ' type="button" onclick="toggleAiAnalysisDetail(\'' + escapeHtmlText(scope) + '\',\'' + escapeHtmlText(metricKey) + '\')"' : '';
  var accentBg = (accent || '#059669') + '15';
  var barHtml = '';
  if(countryVal != null && uzVal != null){
    var cN = Number(countryVal) || 0;
    var uN = Number(uzVal) || 0;
    var maxV = Math.max(cN, uN, 1);
    var cPct = Math.round((cN / maxV) * 100);
    var uPct = Math.round((uN / maxV) * 100);
    barHtml =
      '<div style="margin-top:.6rem">' +
        '<div style="display:flex;justify-content:space-between;font-size:.6rem;margin-bottom:3px"><span style="color:#2563EB;font-weight:600">Kompaniya davlati</span><span style="font-weight:700;color:#2563EB">' + escapeHtmlText(String(options.countryLabel || cN)) + '</span></div>' +
        '<div style="height:6px;background:var(--bg);border-radius:20px;overflow:hidden;margin-bottom:6px"><div style="height:100%;width:' + cPct + '%;background:linear-gradient(90deg,#2563EB,#4CC9F0);border-radius:20px;transition:width 1s ease"></div></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:.6rem;margin-bottom:3px"><span style="color:#059669;font-weight:600">O\'zbekiston</span><span style="font-weight:700;color:#059669">' + escapeHtmlText(String(options.uzLabel || uN)) + '</span></div>' +
        '<div style="height:6px;background:var(--bg);border-radius:20px;overflow:hidden"><div style="height:100%;width:' + uPct + '%;background:linear-gradient(90deg,#059669,#06D6A0);border-radius:20px;transition:width 1s ease"></div></div>' +
      '</div>';
  }
  return '<' + tag + attrs + ' style="padding:1.1rem;background:var(--card);border-radius:12px;border:' + (selected ? '2px solid ' + (accent || '#4361EE') : '1px solid var(--border)') + ';box-shadow:' + (selected ? '0 8px 24px rgba(67,97,238,.12)' : '0 1px 3px rgba(0,0,0,.04)') + ';text-align:left;width:100%;cursor:' + (clickable ? 'pointer' : 'default') + ';transition:all .2s">' +
    '<div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.5rem">' +
      '<div style="width:40px;height:40px;border-radius:10px;background:' + accentBg + ';color:' + (accent || '#059669') + ';display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">' + icon + '</div>' +
      '<div style="flex:1;min-width:0"><div style="font-size:.68rem;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.03em">' + escapeHtmlText(label) + '</div></div>' +
    '</div>' +
    '<div style="font-family:\'Sora\',sans-serif;font-size:1.2rem;font-weight:800;color:' + (accent || '#059669') + ';line-height:1.2">' + escapeHtmlText(main) + '</div>' +
    '<div style="font-size:.65rem;color:var(--text3);margin-top:.2rem;line-height:1.4">' + detail + '</div>' +
    barHtml +
    (clickable ? '<div style="margin-top:.5rem;font-size:.62rem;color:' + (selected ? accent || '#4361EE' : 'var(--text3)') + ';font-weight:600;display:flex;align-items:center;gap:4px">' + (selected ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 15l-6-6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Batafsil ochiq' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Batafsil ko\'rish') + '</div>' : '') +
  '</' + tag + '>';
}

var _investorAiTargetId = null;
var _investorAiOpen = false;
var _investorAiWorkspaceEl = null;
var _aiAnalysisOpenMetric = { investor:'', default:'' };

function getAiScopeDom(scope){
  if(scope === 'investor'){
    return {
      workspace: document.getElementById('investorAiWorkspace'),
      companyMeta: document.getElementById('invAiCompanyMeta'),
      lang: document.getElementById('invAiLang'),
      analysisCard: document.getElementById('invAiAnalysisCard'),
      analysisTitle: document.getElementById('invAiAnalysisTitle'),
      analysisGrid: document.getElementById('invAiAnalysisGrid'),
      analysisHint: document.getElementById('invAiAnalysisHint'),
      analysisDetail: document.getElementById('invAiAnalysisDetail'),
      analysisMeta: document.getElementById('invAiAnalysisMeta'),
      profitEstimate: document.getElementById('invAiProfitEstimate'),
      transportCard: document.getElementById('invAiTransportCard'),
      transportTitle: document.getElementById('invAiTransportTitle'),
      transportGrid: document.getElementById('invAiTransportGrid'),
      transportTbody: document.getElementById('invAiTransportTbody'),
      transportMeta: document.getElementById('invAiTransportMeta'),
      tariffCard: document.getElementById('invAiTariffCard'),
      tariffTitle: document.getElementById('invAiTariffTitle'),
      tariffGrid: document.getElementById('invAiTariffGrid'),
      tariffTbody: document.getElementById('invAiTariffTbody'),
      tariffMeta: document.getElementById('invAiTariffMeta'),
      letterCard: document.getElementById('invAiLetterCard'),
      letterSubject: document.getElementById('invAiLetterSubject'),
      letterBody: document.getElementById('invAiLetterBody'),
      emptyCard: document.getElementById('invAiLetterEmpty')
    };
  }
  return {
    workspace: document.getElementById('page-ailetter'),
    companyMeta: null,
    lang: document.getElementById('ailetter-lang'),
    analysisCard: document.getElementById('aiAnalysisCard'),
    analysisTitle: document.getElementById('aiAnalysisTitle'),
    analysisGrid: document.getElementById('aiAnalysisGrid'),
    analysisHint: document.getElementById('aiAnalysisHint'),
    analysisDetail: document.getElementById('aiAnalysisDetail'),
    analysisMeta: document.getElementById('aiAnalysisMeta'),
    profitEstimate: document.getElementById('aiProfitEstimate'),
    transportCard: document.getElementById('aiTransportCard'),
    transportTitle: document.getElementById('aiTransportTitle'),
    transportGrid: document.getElementById('aiTransportGrid'),
    transportTbody: document.getElementById('aiTransportTbody'),
    transportMeta: document.getElementById('aiTransportMeta'),
    tariffCard: null,
    tariffTitle: null,
    tariffGrid: null,
    tariffTbody: null,
    tariffMeta: null,
    letterCard: document.getElementById('aiLetterCard'),
    letterSubject: document.getElementById('aiLetterSubject'),
    letterBody: document.getElementById('aiLetterBody'),
    emptyCard: document.getElementById('aiLetterEmpty')
  };
}

function getInvestorAiWorkspaceEl(){
  if(_investorAiWorkspaceEl && _investorAiWorkspaceEl.nodeType === 1) return _investorAiWorkspaceEl;
  _investorAiWorkspaceEl = document.getElementById('investorAiWorkspace');
  return _investorAiWorkspaceEl;
}

function mountInvestorAiWorkspace(){
  var workspace = getInvestorAiWorkspaceEl();
  if(!workspace) return;
  var modalBody = document.getElementById('investorAiModalBody');
  var modal = document.getElementById('investorAiModal');
  var dock = document.getElementById('investorAiDock');
  if(_investorAiOpen && modalBody){
    modalBody.appendChild(workspace);
    workspace.style.display = 'block';
    workspace.style.marginTop = '0';
    if(modal){ modal.classList.add('open'); modal.style.display = 'flex'; }
    renderBulkAiNav();
  } else {
    if(modal){ modal.classList.remove('open'); modal.style.display = 'none'; }
    if(dock){
      dock.appendChild(workspace);
      workspace.style.display = 'none';
      workspace.style.marginTop = '1rem';
    }
  }
}

function renderBulkAiNav(){
  var modal = document.getElementById('investorAiModal');
  var modalBody = document.getElementById('investorAiModalBody');
  if(!modal) return;
  if(modalBody){
    modalBody.style.overflow = '';
    modalBody.style.overflowY = 'auto';
    modalBody.style.overflowX = 'hidden';
  }
  ['bulkAiNavPrev','bulkAiNavNext','bulkAiNavBar'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.remove();
  });
  var queue = Array.isArray(window._bulkAiQueue) ? window._bulkAiQueue : [];
  var curId = String(_investorAiTargetId || '');
  var idx = queue.indexOf(curId);
  if(queue.length < 2 || idx === -1) return;
  var prevDisabled = idx <= 0;
  var nextDisabled = idx >= queue.length - 1;
  var btnBase = 'position:fixed;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;border:none;box-shadow:0 4px 14px rgba(15,23,42,.22);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10001;transition:all .2s';
  var leftPos = 'calc(50% - min(480px, 48vw) - 26px)';
  var rightPos = 'calc(50% - min(480px, 48vw) - 26px)';
  var prev = '<button id="bulkAiNavPrev" type="button" onclick="bulkAiNavigate(-1)" '+(prevDisabled?'disabled':'')+' title="Oldingi" style="'+btnBase+';left:'+leftPos+';background:'+(prevDisabled?'#e5e7eb':'#fff')+';color:'+(prevDisabled?'#9ca3af':'#465fff')+';cursor:'+(prevDisabled?'not-allowed':'pointer')+'"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  var next = '<button id="bulkAiNavNext" type="button" onclick="bulkAiNavigate(1)" '+(nextDisabled?'disabled':'')+' title="Keyingi" style="'+btnBase+';right:'+rightPos+';background:'+(nextDisabled?'#e5e7eb':'#fff')+';color:'+(nextDisabled?'#9ca3af':'#7C3AED')+';cursor:'+(nextDisabled?'not-allowed':'pointer')+'"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
  modal.insertAdjacentHTML('beforeend', prev + next);
}

function bulkAiNavigate(delta){
  var queue = Array.isArray(window._bulkAiQueue) ? window._bulkAiQueue : [];
  if(queue.length < 2) return;
  var curId = String(_investorAiTargetId || '');
  var idx = queue.indexOf(curId);
  if(idx === -1) return;
  var next = idx + delta;
  if(next < 0 || next >= queue.length) return;
  var nextId = queue[next];
  _investorAiTargetId = '';
  openInvestorAiWorkspace(nextId);
}
window.bulkAiNavigate = bulkAiNavigate;

function resetAiScope(scope, emptyText){
  var dom = getAiScopeDom(scope);
  _aiAnalysisOpenMetric[getAiScopeKey(scope)] = '';
  if(dom.analysisCard) dom.analysisCard.style.display = 'none';
  if(dom.analysisCard) dom.analysisCard._transportSummary = null;
  if(dom.analysisDetail){
    dom.analysisDetail.style.display = 'none';
    dom.analysisDetail.innerHTML = '';
  }
  if(dom.analysisHint) dom.analysisHint.style.display = 'block';
  if(dom.transportCard) dom.transportCard.style.display = 'none';
  if(dom.tariffCard) dom.tariffCard.style.display = 'none';
  if(dom.letterCard) dom.letterCard.style.display = 'none';
  if(dom.emptyCard){
    dom.emptyCard.style.display = 'block';
    if(emptyText){
      var p = dom.emptyCard.querySelector('p');
      if(p) p.textContent = emptyText;
    }
  }
}

function setInvestorAiMeta(comp){
  var dom = getAiScopeDom('investor');
  if(!dom.companyMeta) return;
  if(!comp){
    dom.companyMeta.textContent = 'Investor tanlang';
    return;
  }
  dom.companyMeta.innerHTML =
    '<b>' + escapeHtmlText(comp.kompaniya || '—') + '</b>' +
    (comp.rahbar ? ' — ' + escapeHtmlText(comp.rahbar) : '') +
    (comp.davlat ? ' (' + escapeHtmlText(comp.davlat) + ')' : '');
}

function openInvestorAiWorkspace(id){
  var comp = (DB.investorCompanies || []).find(function(item){ return String(item.id) === String(id); });
  if(!comp){
    toast('⚠️ Investor topilmadi','error');
    return;
  }
  _finderAiOpen = false;
  _finderAiTargetKey = '';
  var switching = String(_investorAiTargetId || '') !== String(comp.id);
  if(!switching && _investorAiOpen){
    closeInvestorAiWorkspace();
    return;
  }
  _investorAiTargetId = String(comp.id);
  _investorAiOpen = true;
  setInvestorAiMeta(comp);
  if(switching){
    resetAiScope('investor', 'Investor tanlandi. Endi "AI Xat Yozish" tugmasini bosing');
    // Hide contacts list on switch
    var cl = document.getElementById('invAiContactsList');
    if(cl) cl.style.display = 'none';
  }
  mountInvestorAiWorkspace();

  // Show all contacts from same company
  var companyKey = getInvestorCompanyGroupKey(comp);
  var allContacts = (DB.investorCompanies||[]).filter(function(c){
    return getInvestorCompanyGroupKey(c) === companyKey;
  });
  if(allContacts.length > 1){
    renderAiContactsList(allContacts, 'investor');
    // Load existing letters for all contacts
    window._aiContactLetters = window._aiContactLetters || {};
    allContacts.forEach(function(c){
      if(c.aiLetterData && c.aiLetterData.analysis){
        window._aiContactLetters[String(c.id)] = {
          contact: c,
          payload: {
            analysis: c.aiLetterData.analysis,
            transportSummary: c.aiLetterData.transportSummary,
            tariffSummary: c.aiLetterData.tariffSummary || null,
            letterSubject: c.aiLetterData.subject || '',
            letterBody: c.aiLetterData.body || '',
            lang: c.aiLetterData.lang || 'en',
            generatedAt: c.aiLetterData.generatedAt || ''
          }
        };
      }
    });
  }

  if(comp.aiLetterData && comp.aiLetterData.analysis){
    hydrateAiScope('investor', comp, {
      analysis: comp.aiLetterData.analysis,
      transportSummary: comp.aiLetterData.transportSummary,
      tariffSummary: comp.aiLetterData.tariffSummary || null,
      letterSubject: comp.aiLetterData.subject || '',
      letterBody: comp.aiLetterData.body || '',
      lang: comp.aiLetterData.lang || 'en',
      generatedAt: comp.aiLetterData.generatedAt || ''
    });
    var dom = getAiScopeDom('investor');
    if(dom.lang && comp.aiLetterData.lang) dom.lang.value = comp.aiLetterData.lang;
    refreshInvestorAiOfficialData(comp);
  }
}

function closeInvestorAiWorkspace(){
  var hadFinderAi = !!_finderAiOpen;
  _investorAiOpen = false;
  _finderAiOpen = false;
  _finderAiTargetKey = '';
  window._bulkAiQueue = [];
  renderInvestorCompanies();
  if(hadFinderAi && Array.isArray(_finderResults)) renderCurrentFinderTable();
  mountInvestorAiWorkspace();
}

window.openInvestorAiWorkspace = openInvestorAiWorkspace;
window.closeInvestorAiWorkspace = closeInvestorAiWorkspace;

function closeFinderAiWorkspace(){
  _finderAiOpen = false;
  _finderAiTargetKey = '';
  _investorAiOpen = false;
  if(Array.isArray(_finderResults)) renderCurrentFinderTable();
  mountInvestorAiWorkspace();
}

function renderAiAnalysis(analysis, scope){
  var dom = getAiScopeDom(scope);
  var countryName = (analysis && analysis.country && analysis.country.display) || 'Tanlangan davlat';
  var metrics = (analysis && analysis.metrics) || {};
  var scopeKey = getAiScopeKey(scope);
  var selectedMetric = _aiAnalysisOpenMetric[scopeKey] || '';
  var transportSummary = (dom.analysisCard && dom.analysisCard._transportSummary) || null;
  var meta = [];
  var grid = [];
  var gdp = metrics.gdpPerCapita || {};
  var industry = metrics.industryShare || {};
  var tax = metrics.totalTaxRate || {};
  var wage = metrics.monthlyWage || {};
  var electricity = metrics.electricityPrice || {};
  var gas = metrics.naturalGasPrice || {};
  var titleEl = dom.analysisTitle;
  var metaEl = dom.analysisMeta;
  if(titleEl) titleEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="vertical-align:text-bottom;margin-right:4px"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#4361EE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Iqtisodiy Tahlil — ' + escapeHtmlText(countryName) + ' vs O\'zbekiston';

  grid.push(buildAiMetricCard(
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'YaIM / kishi',
    aiRatioDirectionText(gdp.country, gdp.uzbekistan, false),
    '<span style="font-size:.6rem">World Bank · ' + escapeHtmlText((gdp.countryYear||'—') + '/' + (gdp.uzbekistanYear||'—')) + '</span>',
    '#2563EB',
    { scope: scope, metricKey: 'gdpPerCapita', selected: selectedMetric === 'gdpPerCapita', countryVal: gdp.country, uzVal: gdp.uzbekistan, countryLabel: aiFmtCompactUsd(gdp.country), uzLabel: aiFmtCompactUsd(gdp.uzbekistan) }
  ));

  grid.push(buildAiMetricCard(
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 20h20M5 20V8l5 4V8l5 4V4h4v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'Sanoat ulushi',
    aiRatioDirectionText(industry.country, industry.uzbekistan, false),
    '<span style="font-size:.6rem">World Bank · ' + escapeHtmlText((industry.countryYear||'—') + '/' + (industry.uzbekistanYear||'—')) + '</span>',
    '#F59E0B',
    { scope: scope, metricKey: 'industryShare', selected: selectedMetric === 'industryShare', countryVal: industry.country, uzVal: industry.uzbekistan, countryLabel: aiFmtPct(industry.country), uzLabel: aiFmtPct(industry.uzbekistan) }
  ));

  grid.push(buildAiMetricCard(
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 14l-4-4m0 0l4-4m-4 4h11a4 4 0 010 8h-1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'Soliq yuklamasi',
    aiRatioDirectionText(tax.country, tax.uzbekistan, true),
    '<span style="font-size:.6rem">World Bank · ' + escapeHtmlText((tax.countryYear||'—') + '/' + (tax.uzbekistanYear||'—')) + '</span>',
    '#7C3AED',
    { scope: scope, metricKey: 'totalTaxRate', selected: selectedMetric === 'totalTaxRate', countryVal: tax.country, uzVal: tax.uzbekistan, countryLabel: aiFmtPct(tax.country), uzLabel: aiFmtPct(tax.uzbekistan) }
  ));

  grid.push(buildAiMetricCard(
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'Mehnat narxi',
    aiRatioDirectionText(wage.country, wage.uzbekistan, true),
    '<span style="font-size:.6rem">ILOSTAT · ' + escapeHtmlText((wage.countryYear||'—') + '/' + (wage.uzbekistanYear||'—')) + '</span>',
    '#059669',
    { scope: scope, metricKey: 'monthlyWage', selected: selectedMetric === 'monthlyWage', countryVal: wage.country, uzVal: wage.uzbekistan, countryLabel: aiFmtWageValue(wage.country, wage.countryCurrencyBasis), uzLabel: aiFmtWageValue(wage.uzbekistan, wage.uzbekistanCurrencyBasis) }
  ));

  grid.push(buildAiMetricCard(
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    'Elektr energiyasi',
    aiRatioDirectionText(electricity.country, electricity.uzbekistan, true),
    '<span style="font-size:.6rem">' + escapeHtmlText(electricity.source || 'Official API') + ' · ' + escapeHtmlText((electricity.countryYear||'—') + '/' + (electricity.uzbekistanYear||'—')) + '</span>',
    '#DC2626',
    { scope: scope, metricKey: 'electricityPrice', selected: selectedMetric === 'electricityPrice', countryVal: electricity.country, uzVal: electricity.uzbekistan, countryLabel: aiFmtMwh(electricity.country), uzLabel: aiFmtMwh(electricity.uzbekistan) }
  ));

  if(transportSummary && transportSummary.routes && transportSummary.routes.length){
    grid.push(buildAiMetricCard(
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M1 3h15v13H1zM16 8h4l3 4v5h-7V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2"/></svg>',
      'Transport kalkulyatori',
      aiFmtTransportUsd(transportSummary.avgSaving) + ' (' + transportSummary.avgSavingPct + '%)',
      '13 davlat bo\'yicha o\'rtacha logistika ustunligi',
      '#D97706',
      { scope: scope, metricKey: 'transportSummary', selected: selectedMetric === 'transportSummary', countryVal: transportSummary.avgForeign, uzVal: transportSummary.avgNavoi, countryLabel: aiFmtTransportUsd(transportSummary.avgForeign), uzLabel: aiFmtTransportUsd(transportSummary.avgNavoi) }
    ));
  }

  var tariffSummary = (dom.analysisCard && dom.analysisCard._tariffSummary) || null;
  if(tariffSummary && !tariffSummary.error && Array.isArray(tariffSummary.routes) && tariffSummary.routes.length){
    grid.push(buildAiMetricCard(
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 5H2v16h20V5h-7M9 5V3h6v2M9 5h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 14l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      'Bojxona tarifi',
      Number.isFinite(Number(tariffSummary.avgDiff)) ? (aiFmtPct(tariffSummary.avgDiff) + ' (' + (tariffSummary.avgDiffPct||0) + '%)') : 'Ma\'lumot yo\'q',
      escapeHtmlText(((tariffSummary.productInfo||{}).displayName) || tariffSummary.productName || 'Mahsulot tarifi'),
      '#7C3AED',
      { scope: scope, metricKey: 'tariffSummary', selected: selectedMetric === 'tariffSummary', countryVal: tariffSummary.avgSourceRate, uzVal: tariffSummary.avgUzRate, countryLabel: aiFmtPct(tariffSummary.avgSourceRate), uzLabel: aiFmtPct(tariffSummary.avgUzRate) }
    ));
  }

  meta.push('• YaIM / kishi: World Bank Open Data API (' + escapeHtmlText((gdp.countryYear||'—') + '/' + (gdp.uzbekistanYear||'—')) + ')');
  meta.push('• Sanoat ulushi: World Bank Open Data API (' + escapeHtmlText((industry.countryYear||'—') + '/' + (industry.uzbekistanYear||'—')) + ')');
  meta.push('• Soliq yuklamasi: World Bank Open Data API / labor tax + profit tax + other taxes (% of profit) (' + escapeHtmlText((tax.countryYear||'—') + '/' + (tax.uzbekistanYear||'—')) + ')');
  meta.push('• Mehnat narxi: ILOSTAT EAR_EMTA_SEX_CUR_NB_A (' + escapeHtmlText((wage.countryYear||'—') + '/' + (wage.uzbekistanYear||'—')) + ') · ' + escapeHtmlText((wage.countryCurrencyBasis||'—') + ' / ' + (wage.uzbekistanCurrencyBasis||'—')));
  meta.push('• Elektr energiyasi: ' + escapeHtmlText(electricity.source || 'Official energy API') + ' (' + escapeHtmlText((electricity.countryYear||'—') + '/' + (electricity.uzbekistanYear||'—')) + ')');
  if(Number.isFinite(Number(gas.country)) || Number.isFinite(Number(gas.uzbekistan))){
    meta.push('• Tabiiy gaz: ' + escapeHtmlText(gas.source || 'IEA Prices API') + ' (' + escapeHtmlText((gas.countryYear||'—') + '/' + (gas.uzbekistanYear||'—')) + ') · ' + escapeHtmlText(aiFmtMwh(gas.country) + ' → ' + aiFmtMwh(gas.uzbekistan)));
  }

  if(dom.analysisCard) dom.analysisCard.style.display = 'block';
  if(dom.analysisCard) dom.analysisCard._analysisData = analysis;
  if(dom.analysisGrid) dom.analysisGrid.innerHTML = grid.join('');
  renderAiAnalysisDetail(scope, analysis);
  if(metaEl){
    metaEl.style.display = 'block';
    var toggleId = 'aiSourceToggle' + Date.now();
    metaEl.innerHTML = '<div style="padding-top:.3rem;border-top:1px dashed rgba(59,130,246,.25)">' +
      '<a href="javascript:void(0)" onclick="var c=document.getElementById(\'' + toggleId + '\');var arr=this.querySelector(\'svg\');if(c.style.display===\'none\'){c.style.display=\'block\';arr.style.transform=\'rotate(90deg)\';}else{c.style.display=\'none\';arr.style.transform=\'rotate(0deg)\';}" style="display:inline-flex;align-items:center;gap:6px;font-weight:700;color:var(--text);text-decoration:none;cursor:pointer;font-size:.82rem;padding:4px 0">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="transition:transform .25s ease;transform:rotate(0deg)"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        'Rasmiy manbalar' +
      '</a>' +
      '<div id="' + toggleId + '" style="display:none;margin-top:6px;padding-left:4px;animation:modalFadeIn .25s ease">' + meta.join('<br>') + '</div>' +
    '</div>';
  }

  // === Navoiy iqtisodiy foyda hisoblash ===
  var profitEl = dom.profitEstimate;
  if(profitEl){
    var comp = null;
    if(scope === 'investor' && _investorAiTargetId){
      comp = (DB.investorCompanies||[]).find(function(c){ return String(c.id) === String(_investorAiTargetId); });
    } else if(scope === 'page'){
      var selId = ((document.getElementById('ailetter-company-select')||{}).value || '');
      if(selId) comp = (DB.investorCompanies||[]).find(function(c){ return String(c.id) === String(selId); });
    }
    var investSum = comp ? (parseFloat(comp.summa) || 0) : 0;
    if(investSum <= 0) investSum = 10000000; // default $10M agar summa yo'q bo'lsa

    var savingsBreakdown = [];
    var totalAnnualSaving = 0;

    // 1. Soliq tejamkorlik (tax saving)
    var taxC = Number(tax.country), taxU = Number(tax.uzbekistan);
    if(Number.isFinite(taxC) && Number.isFinite(taxU) && taxC > taxU){
      var taxSaving = investSum * 0.30 * ((taxC - taxU) / 100); // assume 30% of investment is annual profit
      totalAnnualSaving += taxSaving;
      savingsBreakdown.push({label:'Soliq tejamkorlik', value:taxSaving, pct:((taxC-taxU).toFixed(1))+'%', color:'#7C3AED', desc:'Soliq yuklamasi: '+taxC.toFixed(1)+'% → '+taxU.toFixed(1)+'%'});
    }

    // 2. Mehnat narxi tejamkorlik (labor cost saving)
    var wageC = Number(wage.country), wageU = Number(wage.uzbekistan);
    if(Number.isFinite(wageC) && Number.isFinite(wageU) && wageC > wageU){
      var workerCount = Math.max(20, Math.round(investSum / 200000)); // taxminiy ishchi soni
      var annualWageSaving = (wageC - wageU) * 12 * workerCount;
      totalAnnualSaving += annualWageSaving;
      savingsBreakdown.push({label:'Mehnat narxi tejamkorlik', value:annualWageSaving, pct:((1-wageU/wageC)*100).toFixed(0)+'%', color:'#059669', desc:workerCount+' ishchi × $'+Math.round(wageC-wageU)+'/oy farq'});
    }

    // 3. Elektr energiya tejamkorlik
    var elC = Number(electricity.country), elU = Number(electricity.uzbekistan);
    if(Number.isFinite(elC) && Number.isFinite(elU) && elC > elU){
      var annualMwh = investSum / 1500; // taxminiy yillik energiya sarfi MWh
      var elSaving = (elC - elU) * annualMwh;
      totalAnnualSaving += elSaving;
      savingsBreakdown.push({label:'Elektr energiya tejamkorlik', value:elSaving, pct:((1-elU/elC)*100).toFixed(0)+'%', color:'#DC2626', desc:Math.round(annualMwh)+' MWh × $'+((elC-elU).toFixed(1))+' farq'});
    }

    // 4. Tabiiy gaz tejamkorlik
    var gasC = Number(gas.country), gasU = Number(gas.uzbekistan);
    if(Number.isFinite(gasC) && Number.isFinite(gasU) && gasC > gasU){
      var annualGasMwh = investSum / 3000;
      var gasSaving = (gasC - gasU) * annualGasMwh;
      totalAnnualSaving += gasSaving;
      savingsBreakdown.push({label:'Tabiiy gaz tejamkorlik', value:gasSaving, pct:((1-gasU/gasC)*100).toFixed(0)+'%', color:'#F59E0B', desc:Math.round(annualGasMwh)+' MWh × $'+((gasC-gasU).toFixed(1))+' farq'});
    }

    // 5. Transport tejamkorlik
    if(transportSummary && Number.isFinite(Number(transportSummary.avgSaving)) && Number(transportSummary.avgSaving) > 0){
      var shipments = Math.max(12, Math.round(investSum / 500000)); // taxminiy yillik jo'natmalar
      var trSaving = Number(transportSummary.avgSaving) * shipments;
      totalAnnualSaving += trSaving;
      savingsBreakdown.push({label:'Transport logistika tejamkorlik', value:trSaving, pct:transportSummary.avgSavingPct+'%', color:'#D97706', desc:shipments+' jo\'natma × $'+Math.round(Number(transportSummary.avgSaving))+' farq'});
    }

    if(totalAnnualSaving > 0){
      profitEl.style.display = 'block';
      var mln = totalAnnualSaving / 1000000;

      var svgIcons = {
        'Soliq tejamkorlik': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 14l-4-4m0 0l4-4m-4 4h11a4 4 0 010 8h-1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        'Mehnat narxi tejamkorlik': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm11 0l-3 3m0 0l-3-3m3 3V4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        'Elektr energiya tejamkorlik': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        'Tabiiy gaz tejamkorlik': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C8 6 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-8-8-12z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        'Transport logistika tejamkorlik': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 3h15v13H1zM16 8h4l3 4v5h-7V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2"/></svg>'
      };

      var savingsRows = savingsBreakdown.map(function(s){
        var sMln = s.value / 1000000;
        var barWidth = Math.min(100, Math.round((s.value / totalAnnualSaving) * 100));
        var valStr = sMln >= 0.01 ? ('$' + sMln.toFixed(2).replace(/0+$/,'').replace(/\.$/,'') + ' mln') : ('$' + (s.value/1000).toFixed(0) + 'K');
        var ico = svgIcons[s.label] || '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        return '<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">' +
          '<div style="width:34px;height:34px;border-radius:10px;background:' + s.color + '15;color:' + s.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">' + ico + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">' +
              '<span style="font-size:.74rem;font-weight:700;color:var(--text)">' + escapeHtmlText(s.label) + '</span>' +
              '<span style="font-family:\'Sora\',sans-serif;font-size:.78rem;font-weight:800;color:' + s.color + '">' + valStr + '</span>' +
            '</div>' +
            '<div style="font-size:.64rem;color:var(--text3);margin-bottom:5px">' + escapeHtmlText(s.desc) + ' · <span style="color:' + s.color + ';font-weight:600">↓ ' + escapeHtmlText(s.pct) + ' arzon</span></div>' +
            '<div style="height:5px;background:var(--bg);border-radius:20px;overflow:hidden">' +
              '<div style="height:100%;width:' + barWidth + '%;background:linear-gradient(90deg,' + s.color + ',' + s.color + 'aa);border-radius:20px;transition:width 1.2s cubic-bezier(.4,0,.2,1)"></div>' +
            '</div>' +
          '</div>' +
        '</div>';
      });

      var investLabel = investSum >= 1000000 ? ('$' + (investSum/1000000).toFixed(1).replace(/\.0$/,'') + ' mln') : ('$' + (investSum/1000).toFixed(0) + 'K');

      profitEl.innerHTML = '<div style="margin-top:.6rem;background:var(--card);border-radius:16px;border:1px solid var(--border);box-shadow:0 2px 12px rgba(58,87,232,.06);overflow:hidden;animation:aiDonutFadeIn .6s ease both">' +
        /* Header */
        '<div style="padding:1rem 1.2rem;background:linear-gradient(135deg,#059669,#10B981);display:flex;align-items:center;gap:12px">' +
          '<div style="width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</div>' +
          '<div style="flex:1">' +
            '<div style="font-family:\'Sora\',sans-serif;font-size:.88rem;font-weight:800;color:#fff">Navoiyda loyiha qilgandagi yillik iqtisod</div>' +
            '<div style="font-size:.66rem;color:rgba(255,255,255,.75);margin-top:2px">Investitsiya: ' + investLabel + ' · ' + escapeHtmlText(countryName) + ' bilan taqqoslaganda</div>' +
          '</div>' +
        '</div>' +
        /* Main values */
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border-bottom:1px solid var(--border)">' +
          '<div style="padding:1rem 1.2rem;text-align:center;border-right:1px solid var(--border)">' +
            '<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-bottom:.35rem">Yillik tejamkorlik</div>' +
            '<div style="font-family:\'Sora\',sans-serif;font-size:1.65rem;font-weight:900;color:#059669;line-height:1.1">$' + mln.toFixed(2) + '</div>' +
            '<div style="font-size:.62rem;font-weight:600;color:#059669;opacity:.7;margin-top:2px">million / yil</div>' +
          '</div>' +
          '<div style="padding:1rem 1.2rem;text-align:center">' +
            '<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text3);margin-bottom:.35rem">5 yillik prognoz</div>' +
            '<div style="font-family:\'Sora\',sans-serif;font-size:1.65rem;font-weight:900;color:#4361EE;line-height:1.1">$' + (mln*5).toFixed(1) + '</div>' +
            '<div style="font-size:.62rem;font-weight:600;color:#4361EE;opacity:.7;margin-top:2px">million / 5 yil</div>' +
          '</div>' +
        '</div>' +
        /* Breakdown */
        '<div style="padding:.8rem 1.2rem">' +
          '<div style="font-size:.64rem;font-weight:700;color:var(--text2);margin-bottom:.4rem;text-transform:uppercase;letter-spacing:.06em">Tejamkorlik tarkibi</div>' +
          savingsRows.join('') +
        '</div>' +
        /* Footer note */
        '<div style="padding:.6rem 1.2rem;background:var(--bg);border-top:1px solid var(--border);display:flex;align-items:flex-start;gap:8px">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;margin-top:1px;color:var(--text3)"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" stroke-width="2"/><path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
          '<div style="font-size:.62rem;color:var(--text3);line-height:1.55"><b style="color:var(--text2)">Eslatma:</b> Ushbu hisob-kitob taxminiy bo\'lib, rasmiy API ma\'lumotlariga asoslangan. Haqiqiy natijalar loyiha hajmi va sohaga qarab farq qilishi mumkin.</div>' +
        '</div>' +
      '</div>';
    } else {
      profitEl.style.display = 'none';
    }
  }
}

function buildOfficialAnalysisLines(analysis){
  var countryName = (analysis && analysis.country && analysis.country.display) || 'Selected country';
  var metrics = (analysis && analysis.metrics) || {};
  var lines = [];

  function pushMetric(label, metric, formatterCountry, formatterUz, sourceLabel){
    if(!metric || !Number.isFinite(Number(metric.country)) || !Number.isFinite(Number(metric.uzbekistan))) return;
    lines.push(
      label + ': ' + countryName + ' ' + formatterCountry(metric.country) + ' (' + (metric.countryYear||'n/a') + ', ' + (sourceLabel||metric.source||'Official API') + ') vs Uzbekistan ' +
      formatterUz(metric.uzbekistan) + ' (' + (metric.uzbekistanYear||'n/a') + ', ' + (sourceLabel||metric.source||'Official API') + ').'
    );
  }

  pushMetric('GDP per capita', metrics.gdpPerCapita, aiFmtUsdExact, aiFmtUsdExact, 'World Bank');
  pushMetric('Industry share of GDP', metrics.industryShare, aiFmtPct, aiFmtPct, 'World Bank');
  pushMetric('Total tax and contribution rate (% of profit)', metrics.totalTaxRate, aiFmtPct, aiFmtPct, 'World Bank (labor + profit + other taxes)');
  pushMetric('Average monthly earnings', metrics.monthlyWage, function(value){
    return aiFmtWageValue(value, metrics.monthlyWage && metrics.monthlyWage.countryCurrencyBasis);
  }, function(value){
    return aiFmtWageValue(value, metrics.monthlyWage && metrics.monthlyWage.uzbekistanCurrencyBasis);
  }, 'ILOSTAT');
  pushMetric('Industrial electricity price', metrics.electricityPrice, aiFmtMwh, aiFmtMwh, metrics.electricityPrice && metrics.electricityPrice.source);
  if(metrics.naturalGasPrice && Number.isFinite(Number(metrics.naturalGasPrice.country)) && Number.isFinite(Number(metrics.naturalGasPrice.uzbekistan))){
    pushMetric('Industrial natural gas price', metrics.naturalGasPrice, aiFmtMwh, aiFmtMwh, metrics.naturalGasPrice.source);
  }
  return lines;
}

var AI_TRANSPORT_TARGETS = [
  { iso3:'UZB', code:'UZ', name:"O'zbekiston", lat:40.1039, lon:65.3686, navoiCost:180, navoiDays:1, navoiMode:'Mahalliy / avto' },
  { iso3:'TKM', code:'TM', name:'Turkmaniston', lat:37.9601, lon:58.3261, navoiCost:900, navoiDays:2, navoiMode:'Avto' },
  { iso3:'TJK', code:'TJ', name:'Tojikiston', lat:38.5598, lon:68.7870, navoiCost:800, navoiDays:2, navoiMode:'Avto' },
  { iso3:'KGZ', code:'KG', name:"Qirg'iziston", lat:42.8746, lon:74.5698, navoiCost:1400, navoiDays:3, navoiMode:'Avto' },
  { iso3:'KAZ', code:'KZ', name:"Qozog'iston", lat:43.2389, lon:76.8897, navoiCost:1200, navoiDays:2, navoiMode:'Avto + temir yo\'l' },
  { iso3:'MNG', code:'MN', name:'Mongoliya', lat:47.8864, lon:106.9057, navoiCost:2600, navoiDays:6, navoiMode:'Temir yo\'l + avto' },
  { iso3:'RUS', code:'RU', name:'Rossiya', lat:55.7558, lon:37.6173, navoiCost:2500, navoiDays:7, navoiMode:'Temir yo\'l + avto' },
  { iso3:'AZE', code:'AZ', name:'Ozarbayjon', lat:40.4093, lon:49.8671, navoiCost:2200, navoiDays:5, navoiMode:'Avto + multimodal' },
  { iso3:'GEO', code:'GE', name:'Gruziya', lat:41.7151, lon:44.8271, navoiCost:2400, navoiDays:6, navoiMode:'Avto + multimodal' },
  { iso3:'ARM', code:'AM', name:'Armaniston', lat:40.1792, lon:44.4991, navoiCost:2500, navoiDays:6, navoiMode:'Avto + multimodal' },
  { iso3:'IRN', code:'IR', name:'Eron', lat:35.6892, lon:51.3890, navoiCost:1500, navoiDays:4, navoiMode:'Avto + temir yo\'l' },
  { iso3:'AFG', code:'AF', name:"Afg'oniston", lat:34.5553, lon:69.2075, navoiCost:1100, navoiDays:3, navoiMode:'Avto' },
  { iso3:'PAK', code:'PK', name:'Pokiston', lat:31.5204, lon:74.3587, navoiCost:1800, navoiDays:5, navoiMode:'Avto + multimodal' }
];

var AI_TRANSPORT_HUBS = {
  UZB:{name:'Navoi',lat:40.1039,lon:65.3686,profile:'regional'},
  USA:{name:'New York',lat:40.7128,lon:-74.0060,profile:'americas'},
  DEU:{name:'Frankfurt',lat:50.1109,lon:8.6821,profile:'europe'},
  FRA:{name:'Paris',lat:48.8566,lon:2.3522,profile:'europe'},
  ITA:{name:'Milan',lat:45.4642,lon:9.1900,profile:'europe'},
  ESP:{name:'Madrid',lat:40.4168,lon:-3.7038,profile:'europe'},
  GBR:{name:'London',lat:51.5072,lon:-0.1276,profile:'europe'},
  NLD:{name:'Rotterdam',lat:51.9244,lon:4.4777,profile:'europe'},
  BEL:{name:'Antwerp',lat:51.2194,lon:4.4025,profile:'europe'},
  CHE:{name:'Zurich',lat:47.3769,lon:8.5417,profile:'europe'},
  AUT:{name:'Vienna',lat:48.2082,lon:16.3738,profile:'europe'},
  POL:{name:'Warsaw',lat:52.2297,lon:21.0122,profile:'europe'},
  CZE:{name:'Prague',lat:50.0755,lon:14.4378,profile:'europe'},
  TUR:{name:'Istanbul',lat:41.0082,lon:28.9784,profile:'middle'},
  ARE:{name:'Dubai',lat:25.2048,lon:55.2708,profile:'middle'},
  SAU:{name:'Riyadh',lat:24.7136,lon:46.6753,profile:'middle'},
  QAT:{name:'Doha',lat:25.2854,lon:51.5310,profile:'middle'},
  CHN:{name:'Xi\'an',lat:34.3416,lon:108.9398,profile:'eastAsia'},
  JPN:{name:'Tokyo',lat:35.6762,lon:139.6503,profile:'eastAsia'},
  KOR:{name:'Seoul',lat:37.5665,lon:126.9780,profile:'eastAsia'},
  IND:{name:'Delhi',lat:28.6139,lon:77.2090,profile:'southAsia'},
  CAN:{name:'Toronto',lat:43.6532,lon:-79.3832,profile:'americas'},
  AUS:{name:'Sydney',lat:-33.8688,lon:151.2093,profile:'oceania'},
  BRA:{name:'Sao Paulo',lat:-23.5505,lon:-46.6333,profile:'americas'},
  MEX:{name:'Mexico City',lat:19.4326,lon:-99.1332,profile:'americas'},
  SGP:{name:'Singapore',lat:1.3521,lon:103.8198,profile:'eastAsia'},
  RUS:{name:'Moscow',lat:55.7558,lon:37.6173,profile:'europeAsia'},
  KAZ:{name:'Almaty',lat:43.2389,lon:76.8897,profile:'regional'},
  KGZ:{name:'Bishkek',lat:42.8746,lon:74.5698,profile:'regional'},
  TJK:{name:'Dushanbe',lat:38.5598,lon:68.7870,profile:'regional'},
  TKM:{name:'Ashgabat',lat:37.9601,lon:58.3261,profile:'regional'},
  MNG:{name:'Ulaanbaatar',lat:47.8864,lon:106.9057,profile:'eastAsia'},
  AZE:{name:'Baku',lat:40.4093,lon:49.8671,profile:'middle'},
  GEO:{name:'Tbilisi',lat:41.7151,lon:44.8271,profile:'middle'},
  ARM:{name:'Yerevan',lat:40.1792,lon:44.4991,profile:'middle'},
  IRN:{name:'Tehran',lat:35.6892,lon:51.3890,profile:'middle'},
  AFG:{name:'Kabul',lat:34.5553,lon:69.2075,profile:'regional'},
  PAK:{name:'Lahore',lat:31.5204,lon:74.3587,profile:'southAsia'}
};

var AI_TRANSPORT_PROFILE_CFG = {
  regional:{base:180,perKm:0.82,border:80,dayDiv:450,dayBase:1,mode:'Avto / temir yo\'l'},
  middle:{base:320,perKm:0.90,border:140,dayDiv:550,dayBase:2,mode:'Avto + temir yo\'l'},
  southAsia:{base:340,perKm:0.80,border:160,dayDiv:580,dayBase:2,mode:'Avto + multimodal'},
  europe:{base:420,perKm:0.95,border:180,dayDiv:650,dayBase:3,mode:'Temir yo\'l + avto'},
  europeAsia:{base:300,perKm:0.88,border:120,dayDiv:620,dayBase:2,mode:'Temir yo\'l + avto'},
  eastAsia:{base:650,perKm:1.00,border:220,dayDiv:720,dayBase:4,mode:'Temir yo\'l + dengiz'},
  americas:{base:1200,perKm:0.55,border:240,dayDiv:900,dayBase:8,mode:'Dengiz + avto'},
  oceania:{base:1400,perKm:0.58,border:260,dayDiv:950,dayBase:9,mode:'Dengiz + avto'}
};

function aiFmtTransportUsd(value){
  var num = Number(value);
  if(!Number.isFinite(num)) return '—';
  return '$' + Math.round(num).toLocaleString('en-US');
}

function aiTransportHaversineKm(lat1, lon1, lat2, lon2){
  var toRad = Math.PI / 180;
  var dLat = (lat2 - lat1) * toRad;
  var dLon = (lon2 - lon1) * toRad;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

function getAiTransportHub(countryInfo){
  var iso3 = String((countryInfo && countryInfo.iso3) || '').toUpperCase();
  if(iso3 && AI_TRANSPORT_HUBS[iso3]) return Object.assign({iso3:iso3}, AI_TRANSPORT_HUBS[iso3]);
  var display = String((countryInfo && countryInfo.display) || countryInfo || '').toLowerCase();
  var foundKey = Object.keys(AI_TRANSPORT_HUBS).find(function(key){
    var hub = AI_TRANSPORT_HUBS[key];
    return hub && String(hub.name || '').toLowerCase() === display;
  });
  if(foundKey) return Object.assign({iso3:foundKey}, AI_TRANSPORT_HUBS[foundKey]);
  return Object.assign({iso3:'UZB'}, AI_TRANSPORT_HUBS.UZB);
}

function estimateAiExportRoute(sourceHub, target){
  var sameCountry = sourceHub.iso3 === target.iso3;
  if(sameCountry){
    return {
      foreignCost: 240,
      foreignDays: 1,
      foreignMode: 'Mahalliy / ichki logistika'
    };
  }
  var cfg = AI_TRANSPORT_PROFILE_CFG[sourceHub.profile] || AI_TRANSPORT_PROFILE_CFG.regional;
  var km = aiTransportHaversineKm(sourceHub.lat, sourceHub.lon, target.lat, target.lon);
  var border = cfg.border;
  if(target.iso3 === 'AFG') border += 220;
  if(target.iso3 === 'PAK') border += 180;
  if(target.iso3 === 'MNG') border += 120;
  if(target.iso3 === 'RUS') border += 90;
  if(target.iso3 === 'IRN') border += 60;
  var foreignCost = Math.round(cfg.base + (km * cfg.perKm) + border);
  var foreignDays = Math.max(1, Math.round((km / cfg.dayDiv) + cfg.dayBase));
  return {
    foreignCost: foreignCost,
    foreignDays: foreignDays,
    foreignMode: cfg.mode
  };
}

function buildAiTransportAnalysis(countryInfo){
  var sourceHub = getAiTransportHub(countryInfo);
  var routes = AI_TRANSPORT_TARGETS.map(function(target){
    var estimate = estimateAiExportRoute(sourceHub, target);
    var saving = estimate.foreignCost - target.navoiCost;
    var savingPct = estimate.foreignCost > 0 ? Math.round((saving / estimate.foreignCost) * 100) : 0;
    return {
      code: target.code,
      iso3: target.iso3,
      name: target.name,
      foreignCost: estimate.foreignCost,
      foreignDays: estimate.foreignDays,
      foreignMode: estimate.foreignMode,
      navoiCost: target.navoiCost,
      navoiDays: target.navoiDays,
      navoiMode: target.navoiMode,
      saving: saving,
      savingPct: savingPct
    };
  });
  var totalForeign = routes.reduce(function(sum, row){ return sum + row.foreignCost; }, 0);
  var totalNavoi = routes.reduce(function(sum, row){ return sum + row.navoiCost; }, 0);
  var totalSaving = totalForeign - totalNavoi;
  var avgForeign = routes.length ? Math.round(totalForeign / routes.length) : 0;
  var avgNavoi = routes.length ? Math.round(totalNavoi / routes.length) : 0;
  var avgSaving = routes.length ? Math.round(totalSaving / routes.length) : 0;
  var avgSavingPct = avgForeign > 0 ? Math.round((avgSaving / avgForeign) * 100) : 0;
  var topSaving = routes.filter(function(row){ return row.saving > 0; }).sort(function(a, b){ return b.saving - a.saving; })[0] || null;
  var fastestNavoi = routes.slice().sort(function(a, b){ return a.navoiDays - b.navoiDays; })[0] || null;
  return {
    sourceCountry: String((countryInfo && countryInfo.display) || sourceHub.name || 'Tanlangan davlat'),
    sourceHub: sourceHub,
    routes: routes,
    totalForeign: totalForeign,
    totalNavoi: totalNavoi,
    totalSaving: totalSaving,
    avgForeign: avgForeign,
    avgNavoi: avgNavoi,
    avgSaving: avgSaving,
    avgSavingPct: avgSavingPct,
    topSaving: topSaving,
    fastestNavoi: fastestNavoi
  };
}

function buildAiTransportDetail(summary){
  return '<div style="border:1px solid rgba(16,185,129,.18);border-radius:14px;background:#fff;box-shadow:0 12px 34px rgba(15,23,42,.06)">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1rem .85rem;border-bottom:1px solid rgba(16,185,129,.12);flex-wrap:wrap">' +
      '<div><div style="font-family:Sora,sans-serif;font-size:.98rem;font-weight:800;color:var(--text)">🚛 Transport kalkulyatori statistikasi</div><div style="font-size:.72rem;color:var(--text3);margin-top:4px">' + escapeHtmlText(summary.sourceCountry) + ' va Navoiy bo\'yicha 13 davlatga eksport taqqoslanishi</div></div>' +
    '</div>' +
    '<div style="padding:1rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem">' +
      buildAiMetricCard('🌍', summary.sourceCountry + 'dan o\'rtacha', aiFmtTransportUsd(summary.avgForeign), '13 ta davlatga eksport xarajatining o\'rtachasi', '#2563EB') +
      buildAiMetricCard('🇺🇿', 'Navoiydan o\'rtacha', aiFmtTransportUsd(summary.avgNavoi), 'Navoiydan 13 ta davlatga eksport xarajatining o\'rtachasi', '#059669') +
      buildAiMetricCard('💰', 'O\'rtacha tejamkorlik', aiFmtTransportUsd(summary.avgSaving) + ' (' + summary.avgSavingPct + '%)', 'Har bir bozor bo\'yicha o\'rtacha ustunlik', '#D97706') +
      buildAiMetricCard('🎯', 'Eng kuchli bozor', summary.topSaving ? summary.topSaving.name : '—', summary.topSaving ? (aiFmtTransportUsd(summary.topSaving.saving) + ' (' + summary.topSaving.savingPct + '% arzon)') : '—', '#7C3AED') +
    '</div>' +
    '<div class="tscroll" style="padding:0 1rem 1rem"><table class="ai-detail-tbl"><thead><tr><th>#</th><th>Davlat</th><th>' + escapeHtmlText(summary.sourceCountry) + 'dan</th><th>Navoiydan</th><th>Tejamkorlik</th><th>Yo\'nalish</th></tr></thead><tbody>' +
      summary.routes.map(function(row, idx){
        var savingColor = row.saving >= 0 ? '#059669' : '#EF233C';
        var savingPrefix = row.saving >= 0 ? '−' : '+';
        return '<tr>' +
          '<td>' + (idx + 1) + '</td>' +
          '<td><b>' + escapeHtmlText(row.name) + '</b></td>' +
          '<td style="font-weight:700;color:#2563EB">' + escapeHtmlText(aiFmtTransportUsd(row.foreignCost)) + '<div style="font-size:.58rem;color:var(--text3)">' + escapeHtmlText(row.foreignMode + ' · ~' + row.foreignDays + ' kun') + '</div></td>' +
          '<td style="font-weight:700;color:#059669">' + escapeHtmlText(aiFmtTransportUsd(row.navoiCost)) + '<div style="font-size:.58rem;color:var(--text3)">' + escapeHtmlText(row.navoiMode + ' · ~' + row.navoiDays + ' kun') + '</div></td>' +
          '<td style="font-weight:800;color:' + savingColor + '">' + escapeHtmlText(savingPrefix + aiFmtTransportUsd(Math.abs(row.saving)).replace('$','')) + '<div style="font-size:.58rem;color:' + savingColor + '">' + escapeHtmlText(Math.abs(row.savingPct) + '%') + '</div></td>' +
          '<td style="font-size:.66rem;color:var(--text2)">' + escapeHtmlText(summary.sourceHub.name + ' → ' + row.name) + '<br>' + escapeHtmlText('Navoiy → ' + row.name) + '</td>' +
        '</tr>';
      }).join('') +
    '</tbody></table></div>' +
    '<div style="padding:0 1rem 1rem;font-size:.72rem;line-height:1.6;color:var(--text2)"><strong>Logistika modeli:</strong><br>• Kompaniya joylashgan davlat uchun markaziy logistika hub: ' + escapeHtmlText(summary.sourceHub.name) + '.<br>• Narxlar 1 ta 40ft konteyner bo\'yicha taxminiy multimodal eksport modeli asosida hisoblandi.<br>• Navoiy narxlari ichki koridor benchmarklari, qolganlari esa masofa + koridor profili bo\'yicha modellashtirildi.' + (summary.fastestNavoi ? '<br>• Eng tez Navoiy yo\'nalishi: ' + escapeHtmlText(summary.fastestNavoi.name) + ' (~' + summary.fastestNavoi.navoiDays + ' kun).' : '') + '</div>' +
  '</div>';
}

function renderAiTransportAnalysis(summary, scope){
  var dom = getAiScopeDom(scope);
  var card = dom.transportCard;
  var titleEl = dom.transportTitle;
  var gridEl = dom.transportGrid;
  var tbody = dom.transportTbody;
  var metaEl = dom.transportMeta;
  if(dom.analysisCard) dom.analysisCard._transportSummary = summary || null;
  if(dom.analysisCard && dom.analysisCard._analysisData){
    renderAiAnalysis(dom.analysisCard._analysisData, scope);
  }
  if(dom.analysisCard && dom.analysisCard._analysisData && _aiAnalysisOpenMetric[getAiScopeKey(scope)] === 'transportSummary'){
    renderAiAnalysisDetail(scope, dom.analysisCard._analysisData);
  }
  if(card) card.style.display = 'none';
  if(!card || !titleEl || !gridEl || !tbody || !metaEl || !summary) return;

  titleEl.textContent = '🚛 Transport kalkulyatori — ' + summary.sourceCountry + ' vs Navoiy (13 davlat)';
  gridEl.innerHTML =
    buildAiMetricCard('🌍', summary.sourceCountry + ' dan', aiFmtTransportUsd(summary.avgForeign), 'O\'rtacha eksport xarajati', '#2563EB', {countryVal:summary.avgForeign, uzVal:summary.avgNavoi, countryLabel:aiFmtTransportUsd(summary.avgForeign), uzLabel:aiFmtTransportUsd(summary.avgNavoi)}) +
    buildAiMetricCard('🇺🇿', 'Navoiy dan', aiFmtTransportUsd(summary.avgNavoi), 'O\'rtacha eksport xarajati', '#059669') +
    buildAiMetricCard('💰', 'Tejamkorlik', aiFmtTransportUsd(summary.avgSaving) + ' (' + summary.avgSavingPct + '%)', 'Har bir bozor bo\'yicha o\'rtacha', '#D97706') +
    buildAiMetricCard('🎯', 'Top bozor', (summary.topSaving ? summary.topSaving.name : '—'), summary.topSaving ? (aiFmtTransportUsd(summary.topSaving.saving) + ' · ' + summary.topSaving.savingPct + '% arzon') : '—', '#7C3AED');

  var maxCost = 1;
  summary.routes.forEach(function(r){ maxCost = Math.max(maxCost, r.foreignCost||0, r.navoiCost||0); });
  tbody.innerHTML = summary.routes.map(function(row, idx){
    var savingColor = row.saving >= 0 ? '#059669' : '#EF233C';
    var savingPrefix = row.saving >= 0 ? '−$' : '+$';
    var savingBg = row.saving >= 0 ? 'rgba(5,150,105,.1)' : 'rgba(239,35,60,.1)';
    var fPct = Math.round(((row.foreignCost||0) / maxCost) * 100);
    var nPct = Math.round(((row.navoiCost||0) / maxCost) * 100);
    return '<tr>' +
      '<td style="font-weight:600;color:var(--text3)">' + (idx + 1) + '</td>' +
      '<td><div style="font-weight:700">' + row.name + '</div><div style="font-size:.58rem;color:var(--text3)">' + summary.sourceHub.name + ' → ' + row.name + '</div></td>' +
      '<td><div style="display:flex;align-items:center;gap:.5rem"><span style="font-weight:700;color:#2563EB;min-width:52px">' + aiFmtTransportUsd(row.foreignCost) + '</span><div style="flex:1;height:8px;background:var(--bg2);border-radius:20px;overflow:hidden"><div style="height:100%;width:' + fPct + '%;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:20px;transition:width 1s"></div></div></div><div style="font-size:.56rem;color:var(--text3);margin-top:2px">' + row.foreignMode + ' · ~' + row.foreignDays + ' kun</div></td>' +
      '<td><div style="display:flex;align-items:center;gap:.5rem"><span style="font-weight:700;color:#059669;min-width:52px">' + aiFmtTransportUsd(row.navoiCost) + '</span><div style="flex:1;height:8px;background:var(--bg2);border-radius:20px;overflow:hidden"><div style="height:100%;width:' + nPct + '%;background:linear-gradient(90deg,#059669,#06D6A0);border-radius:20px;transition:width 1s"></div></div></div><div style="font-size:.56rem;color:var(--text3);margin-top:2px">' + row.navoiMode + ' · ~' + row.navoiDays + ' kun</div></td>' +
      '<td><div style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;background:' + savingBg + ';font-weight:800;font-size:.78rem;color:' + savingColor + '">' + savingPrefix + Math.abs(row.saving).toLocaleString() + '</div><div style="font-size:.58rem;color:' + savingColor + ';font-weight:600;margin-top:2px">' + (row.saving >= 0 ? '↓' : '↑') + ' ' + Math.abs(row.savingPct) + '%</div></td>' +
    '</tr>';
  }).join('');

  metaEl.style.display = 'block';
  metaEl.innerHTML = '<div style="padding-top:.3rem;border-top:1px dashed rgba(16,185,129,.28)"><strong>Logistika modeli:</strong><br>• Kompaniya joylashgan davlat uchun markaziy logistika hub: ' + escapeHtmlText(summary.sourceHub.name) + '.<br>• Narxlar 1 ta 40ft konteyner bo\'yicha taxminiy multimodal eksport modeli asosida hisoblandi.<br>• Navoiy narxlari ichki koridor benchmarklari, qolganlari esa masofa + koridor profili bo\'yicha modellashtirildi. Xat ichida ushbu qiymatlar logistika ustunligi sifatida ishlatiladi.</div>';
  /* card stays hidden until user clicks transport metric card in analysis section */
}

function buildAiTransportPromptLines(summary){
  if(!summary || !summary.routes || !summary.routes.length) return [];
  var topRoutes = summary.routes.filter(function(route){ return route.saving > 0; }).sort(function(a, b){ return b.saving - a.saving; }).slice(0, 4);
  var lines = [
    'Transport comparison (estimated 40ft container export cost): average from ' + summary.sourceCountry + ' to the 13 target markets is ' + aiFmtTransportUsd(summary.avgForeign) + ', while average from Navoi is ' + aiFmtTransportUsd(summary.avgNavoi) + '.',
    'Average logistics advantage from Navoi across the 13 target markets: ' + aiFmtTransportUsd(summary.avgSaving) + ' (' + summary.avgSavingPct + '%) per market.',
    'Fastest Navoi export market in this set: ' + ((summary.fastestNavoi && summary.fastestNavoi.name) || 'n/a') + ' in about ' + ((summary.fastestNavoi && summary.fastestNavoi.navoiDays) || 'n/a') + ' days.'
  ];
  topRoutes.forEach(function(route){
    lines.push('For ' + route.name + ', exporting from ' + summary.sourceCountry + ' is about ' + aiFmtTransportUsd(route.foreignCost) + ' versus Navoi ' + aiFmtTransportUsd(route.navoiCost) + ', so Navoi is cheaper by ' + aiFmtTransportUsd(route.saving) + ' (' + route.savingPct + '%).');
  });
  return lines;
}

function renderAiTariffAnalysis(summary, scope){
  var dom = getAiScopeDom(scope);
  if(dom.analysisCard) dom.analysisCard._tariffSummary = summary || null;
  /* Re-render analysis cards to include tariff metric card */
  if(dom.analysisCard && dom.analysisCard._analysisData){
    renderAiAnalysis(dom.analysisCard._analysisData, scope);
  }
  var card = dom.tariffCard;
  var titleEl = dom.tariffTitle;
  var gridEl = dom.tariffGrid;
  var tbody = dom.tariffTbody;
  var metaEl = dom.tariffMeta;
  if(!card || !titleEl || !gridEl || !tbody || !metaEl || !summary) return;

  var productName = ((summary.productInfo || {}).displayName) || summary.productName || 'Tanlangan mahsulot';
  titleEl.textContent = '🛃 Bojxona tarifi — ' + productName;
  if(summary.error || !Array.isArray(summary.routes) || !summary.routes.length){
    gridEl.innerHTML =
      buildAiMetricCard('🛃', 'Tarif holati', 'Ma\'lumot yo\'q', escapeHtmlText(summary.error || 'Rasmiy bojxona tarifi topilmadi'), '#7C3AED') +
      buildAiMetricCard('🏷️', 'HS kodi', escapeHtmlText(String(summary.hsCode || '—')), 'Mahsulot kodi bo\'yicha rasmiy tarif qidirildi', '#2563EB');
    tbody.innerHTML = '<tr><td colspan="5" style="padding:1rem;color:var(--text2)">' + escapeHtmlText(summary.error || 'Ushbu investor uchun tarif ma\'lumoti topilmadi.') + '</td></tr>';
    metaEl.style.display = 'block';
    metaEl.innerHTML =
      '<div style="padding-top:.3rem;border-top:1px dashed rgba(124,58,237,.25)">' +
        '<strong>Izoh:</strong><br>' +
        escapeHtmlText(summary.error || 'Tarif ma\'lumoti topilmadi') + '<br>' +
        '• Mahsulot HS kodi investor yozuvida saqlangan bo\'lishi kerak.<br>' +
        '• Vercel backend yangi tarif logikasi bilan redeploy qilingan bo\'lishi kerak.' +
      '</div>';
    /* tariff card stays hidden until user clicks tariff metric */
    return;
  }
  gridEl.innerHTML =
    buildAiMetricCard('🌍', 'Kompaniya davlati', aiFmtPct(summary.avgSourceRate), 'O\'rtacha bojxona tarifi', '#2563EB', {countryVal:summary.avgSourceRate, uzVal:summary.avgUzRate, countryLabel:aiFmtPct(summary.avgSourceRate), uzLabel:aiFmtPct(summary.avgUzRate)}) +
    buildAiMetricCard('🇺🇿', 'O\'zbekiston', aiFmtPct(summary.avgUzRate), 'O\'rtacha bojxona tarifi', '#059669') +
    buildAiMetricCard('📉', 'Tarif ustunligi', Number.isFinite(Number(summary.avgDiff)) ? (aiFmtPct(summary.avgDiff) + (Number.isFinite(Number(summary.avgDiffPct)) ? ' (' + summary.avgDiffPct + '%)' : '')) : '—', 'Musbat farq = pastroq tarif', '#D97706') +
    buildAiMetricCard('🎯', 'Top bozor', summary.bestAdvantage ? summary.bestAdvantage.targetName : '—', summary.bestAdvantage ? (aiFmtPct(summary.bestAdvantage.diff) + ' · ' + summary.bestAdvantage.diffPct + '%') : '—', '#7C3AED');

  var maxRate = 1;
  (summary.routes || []).forEach(function(r){ maxRate = Math.max(maxRate, Number(r.sourceRate)||0, Number(r.uzRate)||0); });
  tbody.innerHTML = (summary.routes || []).map(function(row, idx){
    var diffNum = Number(row.diff);
    var diffColor = Number.isFinite(diffNum) ? (diffNum >= 0 ? '#059669' : '#EF233C') : 'var(--text3)';
    var diffBg = Number.isFinite(diffNum) ? (diffNum >= 0 ? 'rgba(5,150,105,.1)' : 'rgba(239,35,60,.1)') : 'var(--bg2)';
    var diffText = Number.isFinite(diffNum)
      ? ('<div style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;background:' + diffBg + ';font-weight:800;font-size:.78rem;color:' + diffColor + '">' + (diffNum >= 0 ? '↓' : '↑') + ' ' + aiFmtPct(Math.abs(diffNum)) + '</div>' + (Number.isFinite(Number(row.diffPct)) ? '<div style="font-size:.56rem;color:' + diffColor + ';font-weight:600;margin-top:2px">' + Math.abs(row.diffPct) + '%</div>' : ''))
      : '<span style="color:var(--text3)">—</span>';
    var sN = Number(row.sourceRate) || 0;
    var uN = Number(row.uzRate) || 0;
    var sPct = Math.round((sN / maxRate) * 100);
    var uPct = Math.round((uN / maxRate) * 100);
    var sourceText = Number.isFinite(Number(row.sourceRate))
      ? ('<div style="display:flex;align-items:center;gap:.5rem"><span style="font-weight:700;color:#2563EB;min-width:42px">' + aiFmtPct(row.sourceRate) + '</span><div style="flex:1;height:7px;background:var(--bg2);border-radius:20px;overflow:hidden"><div style="height:100%;width:' + sPct + '%;background:linear-gradient(90deg,#2563EB,#60A5FA);border-radius:20px"></div></div></div><div style="font-size:.55rem;color:var(--text3);margin-top:2px">' + (row.sourceType || '—') + ' · ' + (row.sourceYear || '—') + '</div>')
      : '<span style="color:var(--text3)">—</span>';
    var uzText = Number.isFinite(Number(row.uzRate))
      ? ('<div style="display:flex;align-items:center;gap:.5rem"><span style="font-weight:700;color:#059669;min-width:42px">' + aiFmtPct(row.uzRate) + '</span><div style="flex:1;height:7px;background:var(--bg2);border-radius:20px;overflow:hidden"><div style="height:100%;width:' + uPct + '%;background:linear-gradient(90deg,#059669,#06D6A0);border-radius:20px"></div></div></div><div style="font-size:.55rem;color:var(--text3);margin-top:2px">' + (row.uzType || '—') + ' · ' + (row.uzYear || '—') + '</div>')
      : '<span style="color:var(--text3)">—</span>';
    return '<tr>' +
      '<td style="font-weight:600;color:var(--text3)">' + (idx + 1) + '</td>' +
      '<td><div style="font-weight:700">' + row.targetName + '</div></td>' +
      '<td>' + sourceText + '</td>' +
      '<td>' + uzText + '</td>' +
      '<td>' + diffText + '</td>' +
    '</tr>';
  }).join('');

  metaEl.style.display = 'block';
  metaEl.innerHTML =
    '<div style="padding-top:.3rem;border-top:1px dashed rgba(124,58,237,.25)">' +
      '<strong>Rasmiy tarif manbasi:</strong><br>' +
      '• WITS - UNCTAD TRAINS API ishlatildi.<br>' +
      '• Reporter = maqsad import bozori, partner = kompaniya davlati yoki O\'zbekiston.<br>' +
      '• Mahsulot HS kodi: ' + escapeHtmlText(String(summary.hsCode || '—')) + '.<br>' +
      '• Musbat farq O\'zbekiston uchun pastroq bojxona tarifini bildiradi.' +
    '</div>';
  /* tariff card stays hidden until user clicks tariff metric */
}

function buildAiTariffPromptLines(summary){
  if(!summary || !summary.routes || !summary.routes.length) return [];
  var productName = ((summary.productInfo || {}).displayName) || summary.productName || 'selected product';
  var lines = [
    'Official tariff comparison for ' + productName + ' (HS ' + (summary.hsCode || 'n/a') + ') across the 13 target markets: average tariff from the company country is ' + aiFmtPct(summary.avgSourceRate) + ', while average tariff from Uzbekistan is ' + aiFmtPct(summary.avgUzRate) + '.',
    'Average tariff advantage for Uzbekistan across comparable markets: ' + (Number.isFinite(Number(summary.avgDiff)) ? (aiFmtPct(summary.avgDiff) + (Number.isFinite(Number(summary.avgDiffPct)) ? ' (' + summary.avgDiffPct + '%)' : '')) : 'n/a') + '.'
  ];
  (summary.routes || []).filter(function(row){
    return Number.isFinite(Number(row.diff)) && row.diff > 0;
  }).sort(function(a, b){
    return Number(b.diff || 0) - Number(a.diff || 0);
  }).slice(0, 4).forEach(function(row){
    lines.push('For ' + row.targetName + ', tariff from the company country is ' + aiFmtPct(row.sourceRate) + ' versus Uzbekistan ' + aiFmtPct(row.uzRate) + ', so Uzbekistan is lower by ' + aiFmtPct(row.diff) + (Number.isFinite(Number(row.diffPct)) ? ' (' + row.diffPct + '%).' : '.'));
  });
  return lines;
}

function handleAiCompanyChange(){
  resetAiScope('page', 'Kompaniya tanlang va "AI Xat Yozish" bosing');
}

function getAiLangName(lang){
  return {en:'English',ru:'Russian',de:'German',zh:'Chinese',fr:'French',fa:'Persian'}[lang]||'English';
}

async function buildAiLetterPackage(comp, lang, sharedAnalysis, sharedTariff){
  var langName = getAiLangName(lang);
  // Reuse pre-computed analysis (saves quota when same company has multiple contacts)
  var analysis = sharedAnalysis || await fetchOfficialAiCountryAnalysis(comp);
  var officialLines = buildOfficialAnalysisLines(analysis);
  if(!officialLines.length) throw new Error('Rasmiy iqtisodiy ko\'rsatkichlar topilmadi');
  var transportSummary = buildAiTransportAnalysis(analysis.country);
  var transportLines = buildAiTransportPromptLines(transportSummary);
  var productInfo = getAiCompanyProductInfo(comp);
  var tariffSummary = null;
  var tariffLines = [];
  if(sharedTariff){
    tariffSummary = sharedTariff;
    tariffLines = buildAiTariffPromptLines(tariffSummary);
  } else {
    try{
      tariffSummary = await fetchOfficialAiTariffSummary(comp, analysis);
      tariffLines = buildAiTariffPromptLines(tariffSummary);
    }catch(err){
      console.warn('AI tariff analysis skipped:', err && err.message ? err.message : err);
      tariffSummary = getAiTariffUnavailableSummary(comp, analysis, err && err.message ? err.message : 'Tarif ma\'lumoti topilmadi');
    }
  }
  var productLabel = (productInfo && productInfo.displayName) || comp.mahsulotNomi || comp.soha || 'selected product';
  var industryLabel = comp.mahsulotNomi || comp.soha || productLabel || 'Manufacturing';

  var letterPrompt = 'Write a FULL, DETAILED professional business letter (minimum 5-7 paragraphs, at least 400 words) in '+langName+'.\n'+
    'FROM: Navoi Regional Investment Office, Uzbekistan.\n'+
    'TO: '+comp.rahbar+', '+(comp.lavozim||'CEO')+' of '+(comp.kompaniya||'the company')+', '+(comp.davlat||'abroad')+'.\n'+
    'SUBJECT: Strategic investment and export partnership for '+productLabel+' from Navoi, Uzbekistan.\n\n'+
    'STRUCTURE:\n'+
    'Paragraph 1 (Opening): Formal greeting, introduce Navoi Regional Investment Office and purpose of letter.\n'+
    'Paragraph 2 (Company recognition): Acknowledge the recipient company, its market position and the product line.\n'+
    'Paragraph 3 (Economic opportunity): Use the economic figures below — GDP, trade data, growth rates.\n'+
    'Paragraph 4 (Logistics & connectivity): Use transport/logistics data below — mention the 13 nearby export markets advantage.\n'+
    'Paragraph 5 (Tariffs & trade terms): Use tariff comparison data below. Mention customs advantages where relevant.\n'+
    'Paragraph 6 (Navoi advantages): Industrial zones, free economic zone benefits, skilled workforce, investor support.\n'+
    'Paragraph 7 (Call to action): Specific invitation — visit, meeting, MOU, next steps. Express eagerness to partner.\n'+
    'Paragraph 8 (Closing): Warm professional close with full signatory block.\n\n'+
    'ECONOMIC & LOGISTICS DATA (use ALL relevant figures naturally in the letter):\n'+
    officialLines.map(function(line){ return '- ' + line; }).join('\n') + '\n' +
    transportLines.map(function(line){ return '- ' + line; }).join('\n') + '\n' +
    tariffLines.map(function(line){ return '- ' + line; }).join('\n') + '\n\n'+
    'Product: ' + productLabel + ' | Industry: '+industryLabel+'\n\n'+
    'RULES:\n'+
    '- Minimum 400 words, 5-7 full paragraphs\n'+
    '- Use ONLY figures from the data above — do not invent numbers\n'+
    '- Tone: professional, warm, compelling and specific\n'+
    '- Do NOT use bullet points or headers inside the letter body — write in flowing prose paragraphs\n'+
    '- Sign as:\nSincerely,\nDeputy Governor of Navoi region\nE.I.Gafforov\n\n'+
    'FORMAT OUTPUT:\n'+
    'First line: email subject (no "Subject:" prefix)\n'+
    'Second line: ===BODY===\n'+
    'Then: full letter body\n\n'+
    'Example format:\nStrategic Granite Partnership — Navoi, Uzbekistan\n===BODY===\nDear Mr. Schmidt,\n\n[Full letter body with 5-7 paragraphs]\n\nSincerely,\nDeputy Governor of Navoi region\nE.I.Gafforov';

  var body2 = {contents:[{role:'user',parts:[{text:letterPrompt}]}],generationConfig:{temperature:0.72,maxOutputTokens:8192}};
  // Use streaming to get full letter without truncation
  var letterRaw = await (async function(){
    var key = getGeminiKey();
    if(!key) throw new Error('Gemini API kalit yo\'q.');
    var models = typeof GEMINI_MODELS !== 'undefined' ? GEMINI_MODELS : ['gemini-2.0-flash'];
    for(var mi=0;mi<models.length;mi++){
      try{
        var streamUrl = 'https://generativelanguage.googleapis.com/v1beta/models/'+models[mi]+':streamGenerateContent?alt=sse&key='+key;
        var resp = await fetch(streamUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body2)});
        if(!resp.ok) continue;
        var reader = resp.body.getReader();
        var decoder = new TextDecoder();
        var full = '';
        var buf = '';
        while(true){
          var chunk = await reader.read();
          if(chunk.done) break;
          buf += decoder.decode(chunk.value, {stream:true});
          var lines = buf.split('\n');
          buf = lines.pop();
          for(var li=0;li<lines.length;li++){
            var line = lines[li].trim();
            if(!line.startsWith('data:')) continue;
            var dataStr = line.slice(5).trim();
            if(!dataStr || dataStr==='[DONE]') continue;
            try{
              var payload = JSON.parse(dataStr);
              full += extractGeminiStreamText(payload);
            }catch(e){}
          }
        }
        if(full) return full;
      }catch(e){ console.warn('Streaming xato:', e); }
    }
    // Fallback to non-streaming
    var data2f = await callGemini(body2);
    return geminiText(data2f);
  })();
  var letterSubject = 'Investment Opportunity in Navoi, Uzbekistan';
  var letterBody = letterRaw;
  var sepIdx = letterRaw.indexOf('===BODY===');
  if(sepIdx > 0){
    letterSubject = letterRaw.slice(0, sepIdx).trim().replace(/^Subject:\s*/i,'').replace(/\*\*/g,'');
    letterBody = letterRaw.slice(sepIdx + 10).trim();
  } else {
    var lines = letterRaw.split('\n');
    if(lines.length > 3){
      letterSubject = lines[0].replace(/^Subject:\s*/i,'').replace(/\*\*/g,'').trim();
      letterBody = lines.slice(1).join('\n').trim();
    }
  }

  return {
    analysis: analysis,
    transportSummary: transportSummary,
    tariffSummary: tariffSummary,
    productInfo: productInfo,
    officialLines: officialLines,
    transportLines: transportLines,
    tariffLines: tariffLines,
    letterSubject: letterSubject,
    letterBody: letterBody,
    lang: lang,
    generatedAt: new Date().toISOString()
  };
}

function saveAiLetterPackage(comp, payload){
  if(!comp || !payload) return;
  comp.aiLetterData = {
    lang: payload.lang,
    generatedAt: payload.generatedAt,
    subject: payload.letterSubject,
    body: payload.letterBody,
    analysis: payload.analysis,
    transportSummary: payload.transportSummary,
    tariffSummary: payload.tariffSummary || null
  };
  if(!Array.isArray(DB.aiLetters)) DB.aiLetters = [];
  DB.aiLetters.unshift({
    id: 'ail_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
    companyId: comp.id,
    company: comp.kompaniya || '',
    country: getAiCompanyCountry(comp),
    subject: payload.letterSubject,
    lang: payload.lang,
    createdAt: payload.generatedAt
  });
  DB.aiLetters = DB.aiLetters.slice(0, 200);
  if(typeof fbSave==='function') fbSave('investorCompanies', comp);
}

function hydrateAiScope(scope, comp, payload){
  var dom = getAiScopeDom(scope);
  if(scope === 'investor') setInvestorAiMeta(comp);
  renderAiAnalysis(payload.analysis, scope);
  renderAiTransportAnalysis(payload.transportSummary, scope);
  if(payload.tariffSummary){
    renderAiTariffAnalysis(payload.tariffSummary, scope);
  }else if(dom.tariffCard){
    dom.tariffCard.style.display = 'none';
  }
  if(dom.letterSubject) dom.letterSubject.value = payload.letterSubject || '';
  if(dom.letterBody) dom.letterBody.value = payload.letterBody || '';
  if(dom.letterCard) dom.letterCard.style.display = 'block';
  if(dom.emptyCard) dom.emptyCard.style.display = 'none';
}

async function generateAiLetterForScope(scope){
  var dom = getAiScopeDom(scope);
  var compId = scope === 'investor'
    ? _investorAiTargetId
    : ((document.getElementById('ailetter-company-select')||{}).value || '');
  if(!compId){ toast('⚠️ Kompaniya tanlang','error'); return; }
  var comp = (DB.investorCompanies||[]).find(function(c){return String(c.id)===String(compId);});
  if(!comp){ toast('⚠️ Kompaniya topilmadi','error'); return; }
  if(!getAiCompanyCountry(comp)){ toast('⚠️ Kompaniyaning joylashgan davlati ko\'rsatilmagan','error'); return; }

  var lang = dom.lang ? dom.lang.value : 'en';

  // Find all contacts from same company
  var companyKey = getInvestorCompanyGroupKey(comp);
  var allContacts = (DB.investorCompanies||[]).filter(function(c){
    return getInvestorCompanyGroupKey(c) === companyKey;
  });

  var lt = toastLoading('⏳ AI xat tayyorlanmoqda: ' + escHtml(comp.kompaniya || '') + ' (' + allContacts.length + ' ta kontakt)...');

  try {
    // Generate letters for all contacts — analysis runs ONCE per company (shared across contacts)
    window._aiContactLetters = {};
    var sharedAnalysis = null;
    var sharedTariff = null;
    for(var ci=0; ci<allContacts.length; ci++){
      var contact = allContacts[ci];
      // First contact: full pipeline (country analysis + tariff). Subsequent: reuse, only letter regenerated.
      if(ci === 0){
        // Country first (tariff needs iso3 from it). Cache hit = ~0ms.
        sharedAnalysis = await fetchOfficialAiCountryAnalysis(contact);
        try {
          sharedTariff = await fetchOfficialAiTariffSummary(contact, sharedAnalysis);
        } catch(err){
          console.warn('AI tariff analysis skipped:', err && err.message ? err.message : err);
          sharedTariff = getAiTariffUnavailableSummary(contact, sharedAnalysis, err && err.message ? err.message : 'Tarif ma\'lumoti topilmadi');
        }
      } else {
        toast('🔁 ' + (contact.rahbar || 'kontakt') + ': tahlil qayta o\'tkazilmadi, faqat xat yangilanmoqda');
      }
      var payload = await buildAiLetterPackage(contact, lang, sharedAnalysis, sharedTariff);
      saveAiLetterPackage(contact, payload);
      window._aiContactLetters[String(contact.id)] = {contact: contact, payload: payload};
    }

    // Show contacts list
    renderAiContactsList(allContacts, scope);

    // Hydrate with first contact
    hydrateAiScope(scope, allContacts[0], window._aiContactLetters[String(allContacts[0].id)].payload);

    toastDone(lt, '✅ AI xat tayyor! ' + escHtml(comp.kompaniya || '') + ' — ' + allContacts.length + ' ta kontakt');

  } catch(e){
    toastDone(lt, '❌ Xato: '+e.message,'error');
    console.error(e);
  }
}

function renderAiContactsList(contacts, scope){
  var container = scope === 'investor'
    ? document.getElementById('invAiContactsList')
    : document.getElementById('aiContactsList');
  if(!container || contacts.length < 2){ if(container) container.style.display='none'; return; }

  var html = '<div class="tcard" style="overflow:visible"><div class="tc-head" style="padding:.6rem 1rem"><div class="tc-title" style="font-size:.85rem">👥 Kontaktlar (' + contacts.length + ' ta)</div></div>';
  html += '<div style="padding:.5rem 1rem;display:flex;gap:.5rem;flex-wrap:wrap">';
  contacts.forEach(function(c, i){
    var name = c.rahbar || c.name || 'Kontakt';
    var title = c.lavozim || c.title || '';
    var email = c.email || '';
    var isActive = i === 0 ? 'background:#4361EE;color:#fff;border-color:#4361EE' : 'background:#fff;color:var(--ta-gray-700);border-color:var(--border)';
    var safeId = String(c.id).replace(/'/g,"\\'").replace(/"/g,'&quot;');
    html += '<button class="ai-contact-btn" data-contact-id="'+escHtml(String(c.id))+'" onclick="switchAiContact(\''+safeId+'\',\''+scope+'\')" style="display:flex;align-items:center;gap:.5rem;padding:.5rem .8rem;border-radius:10px;border:1.5px solid;cursor:pointer;transition:all .2s;'+isActive+'">';
    html += '<div style="width:32px;height:32px;border-radius:50%;background:'+(i===0?'rgba(255,255,255,.2)':'#EEF2FF')+';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.7rem;flex-shrink:0">' + escapeHtmlText(name.charAt(0).toUpperCase()) + '</div>';
    html += '<div style="text-align:left"><div style="font-size:.75rem;font-weight:600;line-height:1.2">' + escapeHtmlText(name) + '</div>';
    if(title) html += '<div style="font-size:.6rem;opacity:.7;line-height:1.2">' + escapeHtmlText(title) + '</div>';
    if(email) html += '<div style="font-size:.6rem;opacity:.6;line-height:1.2">' + escapeHtmlText(email) + '</div>';
    html += '</div></button>';
  });
  html += '</div></div>';
  container.innerHTML = html;
  container.style.display = 'block';
}

function switchAiContact(contactId, scope){
  var data = (window._aiContactLetters||{})[String(contactId)];
  if(!data) return;
  hydrateAiScope(scope, data.contact, data.payload);
  // Update active button styles
  var container = scope === 'investor'
    ? document.getElementById('invAiContactsList')
    : document.getElementById('aiContactsList');
  if(container){
    container.querySelectorAll('.ai-contact-btn').forEach(function(btn){
      if(btn.dataset.contactId === String(contactId)){
        btn.style.background = '#4361EE';
        btn.style.color = '#fff';
        btn.style.borderColor = '#4361EE';
        var avatar = btn.querySelector('div');
        if(avatar) avatar.style.background = 'rgba(255,255,255,.2)';
      } else {
        btn.style.background = '#fff';
        btn.style.color = 'var(--ta-gray-700)';
        btn.style.borderColor = 'var(--border)';
        var avatar = btn.querySelector('div');
        if(avatar) avatar.style.background = '#EEF2FF';
      }
    });
  }
}

async function generateAiLetter(){
  return generateAiLetterForScope('page');
}

async function generateInvestorAiLetter(){
  return generateAiLetterForScope('investor');
}

async function generateBulkAiLetters(){
  if(!isAdmin){toast('⚠️ AI xat yozish uchun admin sifatida kiring!','error');openAdminOrLogin();return;}
  var ids = getSelectedIds();
  if(!ids.length){ toast('⚠️ Avval kompaniyalarni tanlang!','error'); return; }

  var companies = ids.map(function(id){
    return (DB.investorCompanies||[]).find(function(c){ return String(c.id) === String(id); });
  }).filter(Boolean);
  if(!companies.length){ toast('⚠️ Tanlangan kompaniyalar topilmadi','error'); return; }

  var langEl = document.getElementById('invAiLang');
  var lang = langEl ? langEl.value : 'en';
  var btn = document.getElementById('bulkAiBtn');
  var originalText = btn ? btn.textContent : '';
  if(btn){
    btn.disabled = true;
    btn.textContent = '⏳ AI xatlar yozilmoqda...';
  }

  var ok = 0, failed = 0, skipped = 0, firstOkId = null;
  var okIds = [];
  try{
    for(var i=0;i<companies.length;i++){
      var comp = companies[i];
      if(comp.aiLetterData && comp.aiLetterData.analysis){
        skipped++;
        if(!firstOkId) firstOkId = comp.id;
        okIds.push(String(comp.id));
        continue;
      }
      if(!getAiCompanyCountry(comp)){
        failed++;
        continue;
      }
      if(btn) btn.textContent = '⏳ ' + (i+1) + '/' + companies.length + ' — ' + (comp.kompaniya || 'Kompaniya');
      try{
        var payload = await buildAiLetterPackage(comp, lang);
        saveAiLetterPackage(comp, payload);
        if(!firstOkId) firstOkId = comp.id;
        okIds.push(String(comp.id));
        ok++;
      }catch(err){
        console.error('Bulk AI letter error for', comp && comp.kompaniya, err);
        failed++;
      }
    }
    renderInvestorCompanies();
    window._bulkAiQueue = okIds;
    if(firstOkId){
      openInvestorAiWorkspace(firstOkId);
    }
    toast('✅ AI xatlar: yangi '+ok+' ta'+(skipped?(', oldindan '+skipped+' ta'):'')+(failed?(', xato '+failed+' ta'):''), (ok||skipped) ? 'success' : 'error');
  }finally{
    if(btn){
      btn.disabled = false;
      btn.textContent = originalText || '🤖 AI xat yozish';
    }
    updateSelectedCount();
  }
}

function sendAiLetterForScope(scope){
  var dom = getAiScopeDom(scope);
  var compId = scope === 'investor'
    ? _investorAiTargetId
    : ((document.getElementById('ailetter-company-select')||{}).value || '');
  var comp = (DB.investorCompanies||[]).find(function(c){return String(c.id)===String(compId);});
  if(!comp||!comp.email){ toast('⚠️ Kompaniyaning email manzili yo\'q','error'); return; }
  var subject = dom.letterSubject ? dom.letterSubject.value : '';
  var body = dom.letterBody ? dom.letterBody.value : '';
  // Use existing email system
  openEmailModal(comp.id);
  setTimeout(function(){
    var subEl = document.getElementById('emailSubject');
    var bodyEl = document.getElementById('emailBody');
    if(subEl) subEl.value = subject;
    if(bodyEl) bodyEl.value = body;
  },500);
}

function sendAiLetter(){
  return sendAiLetterForScope('page');
}

function sendInvestorAiLetter(){
  return sendAiLetterForScope('investor');
}

function scheduleAiLetter(){
  toast('📅 Rejalashtirish funksiyasi — "Investorlar bazasi" sahifasidan foydalaning');
}

function scheduleInvestorAiLetter(){
  if(!_investorAiTargetId){ toast('⚠️ Investor tanlang','error'); return; }
  openScheduleModal(_investorAiTargetId);
}

