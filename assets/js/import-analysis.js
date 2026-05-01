/* ═══════════════════════════════════════
   M2: IMPORT TAHLILI (ANALYSIS ENGINE)
═══════════════════════════════════════ */
/* COMTRADE_PROXY, WORLDBANK_PROXY, TRADEATLAS_PROXY, COUNTRY_COMTRADE moved to assets/js/api-config.js */

// Import-analysis partnerlarini investor bazaga eksportyor sifatida saqlash (kreditsiz, snapshot'dan)
window.saveImportPartnersToInvestorBase = function(payloadJson, btnEl){
  var data;
  try { data = JSON.parse(decodeURIComponent(payloadJson)); }
  catch(e){ if(typeof toast === 'function') toast('Ma\'lumotni o\'qib bo\'lmadi','error'); return; }
  if(!data || !Array.isArray(data.partners) || !data.partners.length){
    if(typeof toast === 'function') toast('Saqlanadigan partner topilmadi','error');
    return;
  }
  if(!Array.isArray(DB.investorCompanies)) DB.investorCompanies = [];
  var existingNames = Object.create(null);
  DB.investorCompanies.forEach(function(r){
    var k = String(r.kompaniya || '').trim().toLowerCase();
    if(k) existingNames[k] = r;
  });
  var added = 0, updated = 0;
  var importerName = String(data.targetCountry || '').trim();
  data.partners.forEach(function(p){
    var name = String(p.kompaniya || '').trim();
    if(!name) return;
    var key = name.toLowerCase();
    var lastDate = p.year ? (String(p.year) + '-12-31') : (data.year + '-12-31');
    var existing = existingNames[key];
    if(existing){
      // Mavjud — eksport ma'lumotlarini yangilaymiz, partner aloqasini qo'shamiz
      existing.finderMode = existing.finderMode || 'exporters';
      existing.manba = existing.manba || 'TradeAtlas';
      existing._tradeAtlasQuantity = Math.max(Number(existing._tradeAtlasQuantity || 0), Number(p.weight || 0));
      existing._tradeAtlasTradeValue = Math.max(Number(existing._tradeAtlasTradeValue || 0), Number(p.value || 0));
      existing._tradeAtlasDocCount = Number(existing._tradeAtlasDocCount || 0) + Number(p.docCount || 0);
      if(!existing._tradeAtlasLastArrivalDate || lastDate > existing._tradeAtlasLastArrivalDate){
        existing._tradeAtlasLastArrivalDate = lastDate;
      }
      // Partner (importyor xaridor) ro'yxatiga qo'shish
      if(!Array.isArray(existing._partners)) existing._partners = [];
      var importerKey = importerName.toLowerCase();
      var existingPartner = existing._partners.find(function(p){
        return String(p.kompaniya || '').trim().toLowerCase() === importerKey;
      });
      if(!existingPartner && importerName){
        existing._partners.push({
          kompaniya: importerName, davlat: importerName, role: 'importer',
          totalValue: Number(p.value || 0), totalQty: Number(p.weight || 0),
          docCount: Number(p.docCount || 0), lastDate: lastDate
        });
      }
      if(typeof fbSave === 'function') fbSave('investorCompanies', existing);
      updated++;
    } else {
      // Yangi eksportyor record
      var newRec = {
        id: 'imp_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
        kompaniya: name,
        davlat: '', shahar: '',
        soha: p.productName || '',
        mahsulotNomi: p.productName || '',
        productId: p.productId || '',
        mahsulotHs: p.hsCode || '',
        manba: 'TradeAtlas',
        finderMode: 'exporters',
        score: 70,
        rahbar: '', lavozim: '',
        email: '', telefon: '', website: '', linkedin: '',
        emailSent: false, holat: 'Yangi',
        _tradeAtlasTradeValue: Number(p.value || 0),
        _tradeAtlasQuantity: Number(p.weight || 0),
        _tradeAtlasDocCount: Number(p.docCount || 0),
        _tradeAtlasLastArrivalDate: lastDate,
        _partners: importerName ? [{
          kompaniya: importerName, davlat: importerName, role: 'importer',
          totalValue: Number(p.value || 0), totalQty: Number(p.weight || 0),
          docCount: Number(p.docCount || 0), lastDate: lastDate
        }] : []
      };
      DB.investorCompanies.push(newRec);
      existingNames[key] = newRec;
      if(typeof fbSave === 'function') fbSave('investorCompanies', newRec);
      added++;
    }
  });
  if(btnEl){
    btnEl.textContent = '✅ '+added+' yangi · '+updated+' yangilangan';
    btnEl.style.background = 'linear-gradient(135deg,#059669,#16A34A)';
    btnEl.disabled = true;
    setTimeout(function(){ btnEl.style.opacity = '.6'; }, 200);
  }
  if(typeof toast === 'function') toast('💾 '+added+' ta yangi eksportyor + '+updated+' ta yangilandi · Investor bazada ko\'rinadi','success');
  // Investor companies sahifasini yangilab qo'yamiz (agar ochiq bo'lsa)
  if(typeof renderInvestorCompanies === 'function') try { renderInvestorCompanies(); } catch(_e){}
};

function getImportAnalysisSource(){
  var sel = document.getElementById('import-source-select');
  return sel ? String(sel.value || 'comtrade').toLowerCase() : 'comtrade';
}

function getImportAnalysisSelectedYear(){
  var el = document.getElementById('finder-year');
  var raw = String((el && el.value) || 'all').trim();
  if(raw === 'all') return 'all';
  var year = parseInt(raw, 10);
  if(!year || year < 2021) return 'all';
  return String(year);
}

function getImportAnalysisDisplayYears(){
  var selectedYear = getImportAnalysisSelectedYear();
  if(selectedYear !== 'all') return [selectedYear];
  return ['2021','2022','2023','2024'];
}

function getImportAnalysisYearsText(){
  var years = getImportAnalysisDisplayYears();
  return years.length === 1 ? years[0] : (years[0] + '-' + years[years.length - 1]);
}

function getImportAnalysisPrimaryYear(){
  var years = getImportAnalysisDisplayYears();
  return years.length ? String(years[years.length - 1]) : '2024';
}

function getImportAnalysisDateRange(){
  var selectedYear = getImportAnalysisSelectedYear();
  if(selectedYear !== 'all'){
    return { startDate: selectedYear + '-01-01', endDate: selectedYear + '-12-31' };
  }
  var years = getImportAnalysisDisplayYears();
  var startYear = String(years[0] || '2021');
  var endYear = String(years[years.length - 1] || startYear);
  return { startDate: startYear + '-01-01', endDate: endYear + '-12-31' };
}

function handleImportYearChange(){
  // Avtomatik tahlil o'chirildi — foydalanuvchi "Tahlil qilish" tugmasini bossin
  resetImportAnalysisUi('Yil o\'zgartirildi. "Tahlil qilish" tugmasini bosing');
}

function getImportAnalysisFinderMode(){
  var el = document.getElementById('finder-mode');
  return (el && String(el.value || '').toLowerCase() === 'importers') ? 'importers' : 'exporters';
}

function getImportAnalysisTradeFlowCode(){
  return getImportAnalysisFinderMode() === 'importers' ? 'X' : 'M';
}

function getImportAnalysisLabels(){
  var yearsText = getImportAnalysisYearsText();
  if(getImportAnalysisFinderMode() === 'importers'){
    return {
      totalKpi: "Jami eksport "+yearsText,
      biggestKpi: "Top eksportyor",
      chartTitleSuffix: "Eksport Hajmi ("+yearsText+")",
      emptyText: "Tanlangan davlatlar bo'yicha eksport ma'lumotlari topilmadi",
      sourceLabel: "Ma'lumot manbasi",
      valueColumn: "Eksport ($)"
    };
  }
  return {
    totalKpi: "Jami import "+yearsText,
    biggestKpi: "Top eksportyor",
    chartTitleSuffix: "Import Hajmi ("+yearsText+")",
    emptyText: "Tanlangan davlatlar bo'yicha import ma'lumotlari topilmadi",
    sourceLabel: "Ma'lumot manbasi",
    valueColumn: "Import ($)"
  };
}

function getImportAnalysisSourceLabel(source){
  var value = String(source || '').toLowerCase();
  if(value === 'tradeatlas' || value.indexOf('tradeatlas') >= 0) return 'TradeAtlas Shipments';
  if(value === 'wits' || value.indexOf('wits') >= 0) return 'WITS (World Bank)';
  return 'UN Comtrade (real)';
}

function getImportAnalysisSourceKey(source){
  var value = String(source || '').toLowerCase();
  if(value === 'tradeatlas' || value.indexOf('tradeatlas') >= 0) return 'tradeatlas';
  return (value === 'wits' || value.indexOf('wits') >= 0) ? 'wits' : 'comtrade';
}

function getImportAnalysisSnapshotSourceKey(source){
  var key = getImportAnalysisSourceKey(source);
  if(key === 'tradeatlas') return 'tradeatlas_shipments_v1';
  return key === 'wits' ? 'wits_exact_v2' : 'comtrade_exact_v3';
}

function getExactImportHsCode(product){
  var hsDigits = String((product && product.hs_code) || '').replace(/\D/g,'');
  if(hsDigits.length >= 6) return hsDigits.slice(0,6);
  if(hsDigits.length >= 4) return hsDigits.slice(0,4);
  if(hsDigits.length >= 2) return hsDigits.slice(0,2);
  // Mahsulot tanlanmagan / HS kodi yo'q — manual input field'dan o'qish
  try {
    var manualEl = document.getElementById('finder-manual-hs');
    var manual = manualEl ? String(manualEl.value || '').replace(/\D/g,'') : '';
    if(manual.length >= 6) return manual.slice(0,6);
    if(manual.length >= 4) return manual.slice(0,4);
    if(manual.length >= 2) return manual.slice(0,2);
  } catch(_e){}
  return '';
}

function syncImportSourceSelect(source){
  var sel = document.getElementById('import-source-select');
  if(!sel) return;
  sel.value = getImportAnalysisSourceKey(source);
}

async function fetchComtrade(hsCode, year, targetCountries, source){
  try {
    var countriesParam = ((targetCountries && targetCountries.length) ? targetCountries : TARGET_COUNTRIES).map(function(t){
      if(typeof t === 'string') return t;
      // Prefer comtrade code, then english name variants, then code
      return String((t && (t.comtrade || t.name_en || t.label_en || t.name || t.label || t.code)) || '').trim();
    }).filter(Boolean).join('|');
    var url = COMTRADE_PROXY+'?hs='+encodeURIComponent(hsCode)+'&year='+(year||'2023')+'&countries='+encodeURIComponent(countriesParam)+'&source='+encodeURIComponent(getImportAnalysisSourceKey(source))+'&flow='+encodeURIComponent(getImportAnalysisTradeFlowCode());
    if(window._apiKeys && window._apiKeys.comtrade){
      url += '&key='+encodeURIComponent(window._apiKeys.comtrade);
    }
    // Add source countries filter only in exporter mode
    if(getImportAnalysisFinderMode() === 'exporters'){
      try {
        var srcSel = getFinderSourceSelection();
        if(srcSel && srcSel.hasFilter && srcSel.effectiveCountries && srcSel.effectiveCountries.length){
          url += '&sourceCountries='+encodeURIComponent(srcSel.effectiveCountries.join('|'));
        }
      } catch(selErr){ console.log('sourceSelection xato:', selErr.message); }
    }
    var resp = await fetch(url);
    if(!resp.ok) throw new Error('Comtrade proxy: '+resp.status);
    var data = await resp.json();
    console.log('[fetchComtrade] response:', data && data.countries ? data.countries.length+' countries' : 'no countries', 'url:', url.slice(0,120));
    if(data.countries && data.countries.length>0) return data.countries;
  } catch(e){ console.log('Comtrade API xato:', e.message, e.stack); }
  return null;
}

async function fetchWorldBank(countryCode, indicator){
  try {
    var url = WORLDBANK_URL+'/'+countryCode+'/indicator/'+indicator+'?format=json&date=2022:2024&per_page=5';
    var resp = await fetch(url);
    if(!resp.ok) return null;
    var data = await resp.json();
    if(data[1] && data[1].length>0){
      var latest = data[1].find(function(d){return d.value!==null;});
      return latest ? latest.value : null;
    }
  } catch(e){ console.log('WorldBank xato:',e.message); }
  return null;
}

async function _legacyRunImportAnalysis_v1(){
  var sel = document.getElementById('import-product-select');
  var prodId = sel.value;
  if(!prodId){ toast('⚠️ Mahsulot tanlang','error'); return; }
  var prod = (DB.products||[]).find(function(p){return p.id==prodId;});
  if(!prod) return;

  document.getElementById('importEmpty').style.display = 'none';
  document.getElementById('importResults').style.display = 'block';

  var hsCode = getExactImportHsCode(prod);
  var source = 'Gemini AI (taxminiy)';
  var countries = null;

  // 1. Try UN Comtrade real API
  if(hsCode && hsCode.length>=2){
    toast('📊 UN Comtrade real ma\'lumot olmoqda (HS: '+hsCode+')...');
    countries = await fetchComtrade(hsCode, '2023');
    if(countries && countries.length>0){
      source = 'UN Comtrade (real)';
      toast('✅ UN Comtrade: '+countries.length+' ta davlat ma\'lumoti olindi!');
    }
  }

  // 1.5 Try WTO API fallback
  if(!countries || countries.length===0){
    if(hsCode && hsCode.length>=2){
      toast('📊 WTO API orqali sinash...');
      try {
        var wtoKey = (window._apiKeys&&window._apiKeys.wtoKey) || '';
        var targetCodes = ['643','398','417','762','795','031','268','051','004','364','586','496'];
        var wtoCountries = [];
        for(var ti=0; ti<targetCodes.length; ti++){
          try {
            var wr = await fetch(TG_API_BASE.replace('/api','')+'/api/trade?reporter='+targetCodes[ti]+'&year=2023&flow=M&hs='+hsCode);
            if(wr.ok){
              var wj = await wr.json();
              if(wj.data && wj.data.length>0){
                var totalVal = wj.data.reduce(function(s,d){return s+(d.primaryValue||d.fobvalue||0);},0);
                if(totalVal>0){
                  var cNames = {'643':'Russia','398':'Kazakhstan','417':'Kyrgyzstan','762':'Tajikistan','795':'Turkmenistan','031':'Azerbaijan','268':'Georgia','051':'Armenia','004':'Afghanistan','364':'Iran','586':'Pakistan','496':'Mongolia'};
                  var cCodes = {'643':'RU','398':'KZ','417':'KG','762':'TJ','795':'TM','031':'AZ','268':'GE','051':'AM','004':'AF','364':'IR','586':'PK','496':'MN'};
                  wtoCountries.push({code:cCodes[targetCodes[ti]]||targetCodes[ti], name:cNames[targetCodes[ti]]||targetCodes[ti], import_usd:totalVal, trend_pct:0, volume_tons:0});
                }
              }
            }
          } catch(e){}
        }
        if(wtoCountries.length>0){
          countries = wtoCountries;
          source = 'API (real)';
          toast('✅ '+countries.length+' ta davlat ma\'lumoti olindi!');
        }
      } catch(e){ console.log('WTO import tahlili xato:', e.message); }
    }
  }

  // 2. Fallback: Gemini AI
  if(!countries || countries.length===0){
    toast('📊 Gemini AI import tahlili qilmoqda...');
    try {
      var prompt = 'You are a trade data analyst. Return ONLY valid JSON (no markdown). For the product "'+prod.name_en+'" (HS code: '+(prod.hs_code||'unknown')+'), estimate annual import values for these 12 countries from world market. Format:\n{"countries":[{"code":"RU","name":"Russia","import_usd":45000000,"trend_pct":12,"volume_tons":150000}],"total_usd":0,"biggest_market":"","fastest_growing":"","recommendation":""}\nCountries: Russia, Kazakhstan, Kyrgyzstan, Tajikistan, Turkmenistan, Azerbaijan, Georgia, Armenia, Afghanistan, Iran, Pakistan, Mongolia.\nUse realistic estimates based on 2024 data. Recommendation in Uzbek language.';
      var body = {contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.3,maxOutputTokens:2000}};
      var data = await callGemini(body);
      var result = safeParseJSON(geminiText(data));      countries = result.countries.map(function(c){
        var tc = TARGET_COUNTRIES.find(function(t){return t.code===c.code;});
        return {code:c.code, name:c.name, flag:tc?tc.flag:'', import_usd:c.import_usd||0, trend_pct:c.trend_pct||0, volume_tons:c.volume_tons||0};
      });
      source = 'Gemini AI (taxminiy)';
    } catch(e){
      toast('⚠️ Xato: '+e.message,'error');
      return;
    }
  }

  // 3. Render results
  renderImportResults(countries, prod, source);
}

function scrollToImportDetailCountry(code){
  if(!code) return;
  // 1. Try tbody accordion (renderDefaultImportDetailTable)
  var tbodyEl = document.querySelector('tbody[data-detail-country="'+code+'"]');
  if(tbodyEl){
    var nextBody = tbodyEl.nextElementSibling;
    if(nextBody && nextBody.style.display === 'none'){
      tbodyEl.querySelector('tr').click();
    }
    tbodyEl.scrollIntoView({behavior:'smooth', block:'center'});
    tbodyEl.style.background = 'rgba(70,95,255,.12)';
    setTimeout(function(){ tbodyEl.style.background = ''; }, 1500);
    return;
  }
  // 2. Try details accordion (renderCountryImportAccordion / WITS)
  var detailsEl = document.querySelector('details[data-detail-country="'+code+'"]');
  if(detailsEl){
    detailsEl.open = true;
    detailsEl.scrollIntoView({behavior:'smooth', block:'center'});
    detailsEl.style.background = 'rgba(70,95,255,.12)';
    detailsEl.style.borderRadius = '12px';
    setTimeout(function(){ detailsEl.style.background = ''; }, 1500);
    return;
  }
  // 3. Try simple detail row (first renderImportResults)
  var trEl = document.querySelector('tr[data-detail-country-row="'+code+'"]');
  if(trEl){
    var nextTr = trEl.nextElementSibling;
    if(nextTr && nextTr.style.display === 'none'){
      trEl.click();
    }
    trEl.scrollIntoView({behavior:'smooth', block:'center'});
    trEl.style.background = 'rgba(70,95,255,.12)';
    setTimeout(function(){ trEl.style.background = ''; }, 1500);
    return;
  }
  // 4. Fallback: scroll to detail container
  var detailCard = document.getElementById('import-detail-container');
  if(detailCard) detailCard.scrollIntoView({behavior:'smooth', block:'start'});
}

function _legacyRenderImportResults_v1(countries, prod, source){
  // Sort by import value
  countries.sort(function(a,b){return (b.import_usd||0)-(a.import_usd||0);});

  var total = countries.reduce(function(s,c){return s+(c.import_usd||0);},0);
  var biggest = countries[0] || {};
  var fastest = countries.slice().sort(function(a,b){return (b.trend_pct||0)-(a.trend_pct||0);})[0] || {};
  var labels = (typeof getImportAnalysisLabels === 'function')
    ? getImportAnalysisLabels()
    : { totalKpi:'Jami import 2021-2024', biggestKpi:'Top eksportyor' };
  var k1Label = document.getElementById('imp-k1-label');
  var k2Label = document.getElementById('imp-k2-label');
  if(k1Label) k1Label.textContent = labels.totalKpi;
  if(k2Label) k2Label.textContent = labels.biggestKpi;

  document.getElementById('imp-k1').textContent = '$'+Math.round(total/1e6)+'M';
  document.getElementById('imp-k2').textContent = (biggest.flag||'')+' '+(biggest.name||'—');
  document.getElementById('imp-k3').textContent = (fastest.flag||'')+' '+(fastest.name||'—')+' ↑'+(fastest.trend_pct||0)+'%';
  document.getElementById('imp-k4').textContent = source;

  // Bar chart removed — data shown in country table below map instead

  // Table — expandable rows
  var tb = document.getElementById('import-tbody');
  tb.innerHTML = '';
  countries.forEach(function(c,i){
    var tc = TARGET_COUNTRIES.find(function(t){return t.code===c.code;});
    var trend = (c.trend_pct||0);
    var trendColor = trend>0?'var(--ta-success-600)':'var(--ta-error-600)';
    var mainRow = document.createElement('tr');
    mainRow.style.cssText = 'cursor:pointer;transition:background .15s';
    mainRow.setAttribute('data-detail-country-row', (c.code||'').toUpperCase());
    mainRow.innerHTML = '<td>'+(i+1)+'</td><td style="font-weight:600"><span class="imp-arrow" style="display:none"></span><img class="country-flag-img" src="https://flagcdn.com/24x18/'+(c.code||'').toLowerCase()+'.png" onerror="this.style.display=\'none\'" alt="" style="margin-right:6px">'+c.name+'</td><td style="font-weight:700">$'+Math.round((c.import_usd||0)/1e6)+'M</td><td style="color:'+trendColor+';font-weight:700">'+(trend?(trend>0?'↑':'↓')+Math.abs(trend)+'%':'—')+'</td><td>'+(c.volume_tons?Math.round(c.volume_tons/1000)+'K t':'—')+'</td><td><button class="ta-btn ta-btn-primary ta-btn-sm" onclick="event.stopPropagation();goToFinder(\''+prod.id+'\',\''+c.code+'\')">🔍</button></td>';
    mainRow.onmouseover = function(){ this.style.background='var(--ta-gray-50)'; };
    mainRow.onmouseout = function(){ this.style.background=''; };
    var detailRow = document.createElement('tr');
    detailRow.style.display = 'none';
    var detailTd = document.createElement('td');
    detailTd.colSpan = 6;
    detailTd.style.cssText = 'padding:0 1rem 1rem 2.5rem;background:var(--ta-gray-50);border-bottom:1px solid var(--ta-gray-200)';
    // Build detail content
    var yi = c.year_imports || {};
    var years = ['2021','2022','2023','2024'];
    var detailHtml = '<div style="display:flex;gap:1.5rem;flex-wrap:wrap;padding-top:.75rem">';
    detailHtml += '<div style="flex:1;min-width:200px"><div style="font-size:.72rem;font-weight:600;color:var(--ta-gray-700);margin-bottom:.5rem">📊 Yillik import dinamikasi</div><table class="ta-table" style="font-size:.72rem"><thead><tr><th>Yil</th><th>Import (USD)</th></tr></thead><tbody>';
    years.forEach(function(yr){
      var val = Number(yi[yr] || 0);
      detailHtml += '<tr><td>'+yr+'</td><td style="font-weight:600">'+(val>0?'$'+Number(val.toFixed(0)).toLocaleString('en-US'):'—')+'</td></tr>';
    });
    detailHtml += '</tbody></table></div>';
    detailHtml += '<div style="flex:1;min-width:200px"><div style="font-size:.72rem;font-weight:600;color:var(--ta-gray-700);margin-bottom:.5rem">📋 Qo\'shimcha ma\'lumot</div>';
    detailHtml += '<div style="font-size:.72rem;color:var(--ta-gray-500);line-height:1.8">';
    detailHtml += '🏳️ Davlat: <b>'+(tc?tc.flag+' ':'')+(c.name||'—')+'</b><br>';
    detailHtml += '💰 Jami import: <b>$'+Math.round((c.import_usd||0)/1e6)+'M</b><br>';
    detailHtml += '📈 Trend: <b style="color:'+trendColor+'">'+(trend>0?'↑':'↓')+Math.abs(trend)+'%</b><br>';
    detailHtml += '⚖️ Hajm: <b>'+(c.volume_tons?Math.round(c.volume_tons/1000)+'K tonna':'—')+'</b>';
    detailHtml += '</div></div></div>';
    detailTd.innerHTML = detailHtml;
    detailRow.appendChild(detailTd);
    mainRow.onclick = function(){
      var isOpen = detailRow.style.display !== 'none';
      detailRow.style.display = isOpen ? 'none' : '';
      mainRow.querySelector('.imp-arrow').style.transform = isOpen ? '' : 'rotate(90deg)';
    };
    tb.appendChild(mainRow);
    tb.appendChild(detailRow);
  });

  // Source badge
  chartEl.innerHTML += '<div style="text-align:right;margin-top:8px;font-size:.6rem;color:var(--text3)">📊 Manba: '+source+'</div>';
  // Show jsvectormap + country list (TailAdmin Demographic style)
  var demoCard = document.getElementById('importDemographicCard');
  var mapEl = document.getElementById('importJvMap');
  var countryListEl = document.getElementById('importCountryList');
  if(demoCard && mapEl && countryListEl){
    demoCard.style.display = '';
    // Country coordinates for markers
    var countryCoords = {
      UZ:[41.3,69.3], RU:[61.5,105], KZ:[48.0,68.0], KG:[41.2,74.8],
      TJ:[38.9,71.3], TM:[38.9,59.6], AZ:[40.1,47.6], GE:[42.3,43.4],
      AM:[40.0,45.0], AF:[33.9,67.7], IR:[32.4,53.7], PK:[30.4,69.3],
      MN:[46.9,103.8], CN:[35.9,104.2], TR:[38.9,35.2], IN:[20.6,79.0],
      UA:[48.4,31.2], BY:[53.7,27.9], DE:[51.2,10.5], PL:[51.9,19.1]
    };
    // Build markers and highlighted regions
    var markers = [];
    var regionColors = {};
    countries.forEach(function(c){
      var coords = countryCoords[c.code];
      if(coords) markers.push({name: c.name+' — $'+Math.round((c.import_usd||0)/1e6)+'M', coords: coords});
      regionColors[c.code] = 0;
    });
    // Destroy existing map if any
    mapEl.innerHTML = '';
    if(window._importJvMapInstance){
      try{ window._importJvMapInstance.destroy(); }catch(e){}
      window._importJvMapInstance = null;
    }
    try{
      window._importJvMapInstance = new jsVectorMap({
        selector: '#importJvMap',
        map: 'world',
        zoomButtons: false,
        zoomOnScroll: false,
        regionStyle: {
          initial: { fill: '#D1D5DB', 'fill-opacity': 1, stroke: '#fff', 'stroke-width': 0.5 },
          hover: { 'fill-opacity': 0.8, fill: '#465fff' }
        },
        series: {
          regions: [{
            attribute: 'fill',
            scale: ['#465fff'],
            values: regionColors
          }]
        },
        markers: markers,
        markerStyle: {
          initial: { fill: '#465fff', stroke: '#fff', 'stroke-width': 1, r: 5 },
          hover: { fill: '#3b4fd9', r: 7 }
        },
        labels: { markers: { render: function(m){ return m.name; } } },
        showTooltip: true
      });
    }catch(e){ console.warn('jsvectormap error:', e); }

    // Country table — Davlat, Jami import, Ulush, 2021-2024, Trend
    var tHtml = '<table class="ta-table" style="width:100%;font-size:.78rem">';
    tHtml += '<thead><tr><th style="min-width:140px">Davlat</th><th>Jami import</th><th style="min-width:110px">Ulush</th><th>2021</th><th>2022</th><th>2023</th><th>2024</th><th>Trend</th></tr></thead><tbody>';
    countries.forEach(function(c, idx){
      var pct = total > 0 ? Math.round((c.import_usd||0)/total*100) : 0;
      var code2 = (c.code||'').toLowerCase();
      var flagSrc = 'https://flagcdn.com/w40/'+code2+'.png';
      var yi = c.year_imports || {};
      function fmtYSimple(y){
        var val = Number(yi[y] || 0);
        return val > 0 ? '<b>$'+Math.round(val/1e3)+'K</b>' : '<span style="color:var(--ta-gray-400)">—</span>';
      }
      var totalFmt = '$'+Math.round((c.import_usd||0)/1e6)+'M';
      var trend = c.trend_pct || 0;
      var trendFmt = trend ? ((trend>0?'+':'')+trend+'%') : '—';
      var trendColor = trend ? (trend>0?'var(--ta-success-600)':'var(--ta-error-600)') : 'var(--ta-gray-400)';
      var rowId1 = 'impMapRow1_'+idx;
      var detailId1 = 'impMapDetail1_'+idx;
      tHtml += '<tr id="'+rowId1+'" style="cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'var(--ta-gray-50)\'" onmouseout="var d=document.getElementById(\''+detailId1+'\');if(d&&d.style.display===\'none\')this.style.background=\'\'">' +
        '<td><div style="display:flex;align-items:center;gap:.5rem"><img class="country-flag-round" src="'+flagSrc+'" onerror="this.style.display=\'none\'" alt="" style="width:28px;height:28px"> <span style="font-weight:600">'+c.name+'</span></div></td>' +
        '<td style="font-weight:700;color:var(--ta-brand)">'+totalFmt+'</td>' +
        '<td><div style="display:flex;align-items:center;gap:.5rem"><div style="flex:1;height:5px;border-radius:3px;background:var(--ta-gray-200);min-width:50px;overflow:hidden"><div style="height:100%;border-radius:3px;background:var(--ta-brand);width:'+pct+'%;transition:width .6s"></div></div><span style="font-size:.72rem;font-weight:500;min-width:28px;text-align:right">'+pct+'%</span></div></td>' +
        '<td>'+fmtYSimple('2021')+'</td><td>'+fmtYSimple('2022')+'</td><td>'+fmtYSimple('2023')+'</td><td>'+fmtYSimple('2024')+'</td>' +
        '<td style="font-weight:600;color:'+trendColor+'">'+trendFmt+'</td>' +
      '</tr>';
      // Inline detail row
      var dH1 = '<tr id="'+detailId1+'" style="display:none"><td colspan="8" style="padding:0;border-bottom:2px solid var(--ta-gray-200)">';
      dH1 += '<div style="padding:16px 20px;background:linear-gradient(135deg,rgba(70,95,255,.03),rgba(70,95,255,.07))">';
      dH1 += '<div style="display:flex;gap:1.5rem;flex-wrap:wrap">';
      dH1 += '<div style="flex:1;min-width:220px"><div style="font-size:.78rem;font-weight:700;color:var(--ta-gray-700);margin-bottom:8px">Yillik import dinamikasi</div>';
      dH1 += '<table style="width:100%;font-size:.75rem;border-collapse:collapse"><thead><tr style="background:rgba(70,95,255,.08)"><th style="padding:6px 10px;text-align:left;font-weight:600;color:var(--ta-gray-600);border-radius:6px 0 0 0">Yil</th><th style="padding:6px 10px;text-align:right;font-weight:600;color:var(--ta-gray-600);border-radius:0 6px 0 0">Import</th></tr></thead><tbody>';
      ['2021','2022','2023','2024'].forEach(function(yr){ var val=Number(yi[yr]||0); dH1 += '<tr style="border-top:1px solid rgba(70,95,255,.06)"><td style="padding:6px 10px;font-weight:500">'+yr+'</td><td style="padding:6px 10px;text-align:right;font-weight:700;color:var(--ta-brand)">'+(val>0?'$'+Math.round(val/1e3)+'K':'—')+'</td></tr>'; });
      dH1 += '</tbody></table></div>';
      dH1 += '<div style="flex:1;min-width:200px"><div style="font-size:.78rem;font-weight:700;color:var(--ta-gray-700);margin-bottom:8px">Qo\'shimcha ma\'lumot</div>';
      dH1 += '<div style="display:flex;flex-direction:column;gap:6px;font-size:.78rem">';
      dH1 += '<div style="display:flex;justify-content:space-between;padding:6px 12px;background:rgba(255,255,255,.7);border-radius:8px"><span style="color:var(--ta-gray-500)">Davlat</span><b>'+c.name+'</b></div>';
      dH1 += '<div style="display:flex;justify-content:space-between;padding:6px 12px;background:rgba(255,255,255,.7);border-radius:8px"><span style="color:var(--ta-gray-500)">Jami import</span><b style="color:var(--ta-brand)">'+totalFmt+'</b></div>';
      dH1 += '<div style="display:flex;justify-content:space-between;padding:6px 12px;background:rgba(255,255,255,.7);border-radius:8px"><span style="color:var(--ta-gray-500)">Ulush</span><b>'+pct+'%</b></div>';
      dH1 += '<div style="display:flex;justify-content:space-between;padding:6px 12px;background:rgba(255,255,255,.7);border-radius:8px"><span style="color:var(--ta-gray-500)">Trend</span><b style="color:'+trendColor+'">'+trendFmt+'</b></div>';
      dH1 += '<div style="display:flex;justify-content:space-between;padding:6px 12px;background:rgba(255,255,255,.7);border-radius:8px"><span style="color:var(--ta-gray-500)">Hajm</span><b>'+(c.volume_tons?Math.round(c.volume_tons/1000)+'K tonna':'—')+'</b></div>';
      dH1 += '</div></div></div></div></td></tr>';
      tHtml += dH1;
    });
    tHtml += '</tbody></table>';
    countryListEl.innerHTML = tHtml;
    // Attach click: inline expand
    countryListEl.querySelectorAll('tr[id^="impMapRow1_"]').forEach(function(row){
      row.addEventListener('click', function(){
        var detId = this.id.replace('impMapRow1_','impMapDetail1_');
        var det = document.getElementById(detId);
        if(!det) return;
        var isOpen = det.style.display !== 'none';
        det.style.display = isOpen ? 'none' : 'table-row';
        this.style.background = isOpen ? '' : 'var(--ta-gray-50)';
      });
    });
  }
}

/* ═══ WORLD BANK API (bepul, CORS qo'llab-quvvatlaydi) ═══ */
var WB_COUNTRIES = [
  {iso:'RUS',code:'RU',name:'Rossiya',flag:'🇷🇺'},
  {iso:'KAZ',code:'KZ',name:"Qozog'iston",flag:'🇰🇿'},
  {iso:'KGZ',code:'KG',name:"Qirg'iziston",flag:'🇰🇬'},
  {iso:'TJK',code:'TJ',name:'Tojikiston',flag:'🇹🇯'},
  {iso:'TKM',code:'TM',name:'Turkmaniston',flag:'🇹🇲'},
  {iso:'AZE',code:'AZ',name:'Ozarbayjon',flag:'🇦🇿'},
  {iso:'GEO',code:'GE',name:'Gruziya',flag:'🇬🇪'},
  {iso:'ARM',code:'AM',name:'Armaniston',flag:'🇦🇲'},
  {iso:'AFG',code:'AF',name:"Afg'oniston",flag:'🇦🇫'},
  {iso:'IRN',code:'IR',name:'Eron',flag:'🇮🇷'},
  {iso:'PAK',code:'PK',name:'Pokiston',flag:'🇵🇰'},
  {iso:'MNG',code:'MN',name:"Mo'g'uliston",flag:'🇲🇳'}
];

var WB_FALLBACK = {
  RUS:{gdp:14889, ind:30.7, pop:143.5},
  KAZ:{gdp:14155, ind:32.1, pop:20.6},
  KGZ:{gdp:2420, ind:24.7, pop:7.2},
  TJK:{gdp:1341, ind:33.6, pop:10.6},
  TKM:{gdp:6857, ind:37.5, pop:7.5},
  AZE:{gdp:7284, ind:42.6, pop:10.2},
  GEO:{gdp:9241, ind:19.6, pop:3.7},
  ARM:{gdp:8556, ind:22.9, pop:3.0},
  AFG:{gdp:414, ind:13.4, pop:42.6},
  IRN:{gdp:5190, ind:36.1, pop:91.6},
  PAK:{gdp:1479, ind:20.2, pop:251.3},
  MNG:{gdp:6751, ind:38.1, pop:3.5}
};

// O'zbekiston IEZ ma'lumotlari (solishtirish uchun)
var UZB_DATA = {
  iso:'UZB', code:'UZ', name:"O'zbekiston (Navoiy IEZ)", flag:'🇺🇿',
  gdp_per_capita: 2255, industry_pct: 28.6, avg_wage: 400, electricity: 0.03, population: 36.0
};

var WB_COUNTRY_LIST_CACHE = null;
var WB_COUNTRY_NAME_ALIASES = {
  'russia': 'russian federation',
  'rossiya': 'russian federation',
  'kyrgyzstan': 'kyrgyz republic',
  "qirg'iziston": 'kyrgyz republic',
  'qirgiziston': 'kyrgyz republic',
  'iran': 'iran, islamic rep.',
  'eron': 'iran, islamic rep.',
  'egypt': 'egypt, arab rep.',
  'dr congo': 'congo, dem. rep.',
  'congo': 'congo, rep.',
  'ivory coast': "cote d'ivoire",
  'south korea': 'korea, rep.',
  'north korea': "korea, dem. people's rep.",
  'laos': 'lao pdr',
  'syria': 'syrian arab republic',
  'gambia': 'gambia, the',
  'bahamas': 'bahamas, the',
  'slovakia': 'slovak republic',
  'czech republic': 'czechia',
  'turkey': 'turkiye',
  'turkiya': 'turkiye',
  'brunei': 'brunei darussalam',
  'vatican city': 'holy see',
  'palestine': 'west bank and gaza',
  'saint kitts and nevis': 'st. kitts and nevis',
  'saint lucia': 'st. lucia',
  'saint vincent and the grenadines': 'st. vincent and the grenadines',
  'yemen': 'yemen, rep.'
};

function normalizeWbCountryName(value){
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

async function getWorldBankCountryList(){
  if(WB_COUNTRY_LIST_CACHE) return WB_COUNTRY_LIST_CACHE;
  try{
    var resp = await fetch(WORLDBANK_PROXY + '?meta=countries');
    if(!resp.ok) return [];
    var data = await resp.json();
    WB_COUNTRY_LIST_CACHE = Array.isArray(data && data.countries) ? data.countries : [];
    return WB_COUNTRY_LIST_CACHE;
  }catch(e){
    console.log('WB country meta fetch error:', e);
    return [];
  }
}

function getWorldBankIso3Alias(name){
  var normalized = normalizeWbCountryName(name);
  return INVESTOR_GEO_ALIASES[normalized] || '';
}

function buildSelectedWorldBankCountries(countryList){
  var selectedTargets = getImportAnalysisTargetCountries();
  var byName = {};
  (countryList || []).forEach(function(country){
    if(!country || !country.name) return;
    byName[normalizeWbCountryName(country.name)] = country;
  });
  var rows = [];
  selectedTargets.forEach(function(target){
    var rawName = target && (target.name || target.label) ? (target.name || target.label) : '';
    if(!rawName) return;
    var normalizedName = normalizeWbCountryName(rawName);
    var labelName = normalizeWbCountryName(target.label || rawName);
    var aliasName = WB_COUNTRY_NAME_ALIASES[normalizedName] || WB_COUNTRY_NAME_ALIASES[labelName] || '';
    var matched = byName[normalizedName] || byName[labelName] || (aliasName ? byName[aliasName] : null);
    var iso3 = getWorldBankIso3Alias(rawName) || getWorldBankIso3Alias(target.label || '');
    var wbCode = (matched && (matched.iso3 || matched.iso2)) || iso3 || '';
    if(!wbCode) return;
    rows.push({
      iso: (matched && matched.iso3) || iso3 || wbCode,
      wbCode: wbCode,
      name: target.label || rawName,
      rawName: rawName,
      flag: target.flag || getFinderCountryFlag(rawName) || '🏳️'
    });
  });
  return rows.filter(function(country, idx, arr){
    return arr.findIndex(function(item){ return item.wbCode === country.wbCode; }) === idx;
  });
}

function getWorldBankValue(map, country){
  if(!map || !country) return null;
  return map[country.iso] || map[country.wbCode] || null;
}

async function fetchWBIndicator(countryCodes, indicator){
  try {
    var url = WORLDBANK_PROXY+'?country='+encodeURIComponent(countryCodes)+'&indicator='+encodeURIComponent(indicator)+'&format=json&date=2020:2024&per_page=500';
    var resp = await fetch(url);
    if(!resp.ok) return {};
    var data = await resp.json();
    var result = {};
    if(data[1]){
      data[1].forEach(function(r){
        if(r.value !== null){
          var iso3 = r.countryiso3code || '';
          var iso2 = (r.country && r.country.id) ? r.country.id : '';
          [iso3, iso2].filter(Boolean).forEach(function(key){
            if(!result[key] || parseInt(r.date) > parseInt(result[key].year)){
              result[key] = {value: r.value, year: r.date};
            }
          });
          if(r.country && r.country.value){
            var nameKey = normalizeWbCountryName(r.country.value);
            if(nameKey && (!result[nameKey] || parseInt(r.date) > parseInt(result[nameKey].year))){
              result[nameKey] = {value: r.value, year: r.date};
            }
          }
        }
      });
    }
    return result;
  } catch(e){ console.log('WB fetch error:', indicator, e); return {}; }
}

async function fetchIlostatWages(countryCodes){
  try {
    var url = WORLDBANK_PROXY+'?source=ilostat-wage&country='+encodeURIComponent(countryCodes);
    var resp = await fetch(url);
    if(!resp.ok) return {};
    var data = await resp.json();
    return data && data.countries ? data.countries : {};
  } catch(e){ console.log('ILOSTAT wage fetch error:', e); return {}; }
}

async function loadWorldBankData(){
  document.getElementById('wbEmpty').style.display = 'none';
  document.getElementById('wbLoading').style.display = 'block';
  document.getElementById('wbData').style.display = 'none';

  toast('🏦 World Bank API\'dan 12 davlat ma\'lumoti yuklanmoqda...');

  var codes = WB_COUNTRIES.map(function(c){return c.iso;}).join(';') + ';UZB';

  // Parallel fetch — 5 indikator + rasmiy ish haqi
  var results = await Promise.all([
    fetchWBIndicator(codes, 'NY.GDP.PCAP.CD'),        // YaIM per capita
    fetchWBIndicator(codes, 'NV.IND.TOTL.ZS'),        // Sanoat ulushi (% YaIM)
    fetchWBIndicator(codes, 'SP.POP.TOTL'),            // Aholi
    fetchWBIndicator(codes, 'SL.IND.EMPL.ZS'),        // Sanoat bandligi %
    fetchWBIndicator(codes, 'NE.IMP.GNFS.CD'),         // Jami import $
    fetchIlostatWages(codes)                           // O'rtacha ish haqi (ILOSTAT)
  ]);

  var gdpData = results[0];
  var indData = results[1];
  var popData = results[2];
  var emplData = results[3];
  var impData = results[4];
  var wageData = results[5] || {};
  var cachedRows = (((DB||{}).worldBankData||{}).countries || []);
  var cachedByIso = {};
  cachedRows.forEach(function(r){
    if(r && r.iso) cachedByIso[r.iso] = r;
  });

  document.getElementById('wbLoading').style.display = 'none';
  document.getElementById('wbData').style.display = 'block';

  // O'zbekiston ma'lumotlarini yangilash
  if(gdpData['UZB']) UZB_DATA.gdp_per_capita = Math.round(gdpData['UZB'].value);
  if(indData['UZB']) UZB_DATA.industry_pct = Math.round(indData['UZB'].value*10)/10;
  if(popData['UZB']) UZB_DATA.population = Math.round(popData['UZB'].value/1e6*10)/10;

  // Settings'dan Navoiy IEZ tariflari
  var s = DB.settings||{};
  UZB_DATA.avg_wage = s.maosh || 400;
  UZB_DATA.electricity = s.elektr || 0.03;

  // Build table
  var rows = WB_COUNTRIES.map(function(c){
    var cached = cachedByIso[c.iso] || {};
    var fallback = WB_FALLBACK[c.iso] || {};
    var gdp = gdpData[c.iso] ? Math.round(gdpData[c.iso].value) : '—';
    var ind = indData[c.iso] ? Math.round(indData[c.iso].value*10)/10 : '—';
    var pop = popData[c.iso] ? Math.round(popData[c.iso].value/1e6*10)/10 : '—';
    var empl = emplData[c.iso] ? Math.round(emplData[c.iso].value*10)/10 : '—';
    var imp = impData[c.iso] ? Math.round(impData[c.iso].value/1e9*10)/10 : '—';
    var wageMeta = wageData[c.iso] && !wageData[c.iso].error ? wageData[c.iso] : null;
    var officialWage = wageMeta && typeof wageMeta.value === 'number' && !isNaN(wageMeta.value) ? Math.round(wageMeta.value) : '—';
    if(gdp === 'вЂ"' && typeof cached.gdp === 'number') gdp = cached.gdp;
    if(gdp === 'вЂ"' && typeof fallback.gdp === 'number') gdp = fallback.gdp;
    if(ind === 'вЂ"' && typeof cached.ind === 'number') ind = cached.ind;
    if(ind === 'вЂ"' && typeof fallback.ind === 'number') ind = fallback.ind;
    if(pop === 'вЂ"' && typeof cached.pop === 'number') pop = cached.pop;
    if(pop === 'вЂ"' && typeof fallback.pop === 'number') pop = fallback.pop;
    if(empl === 'вЂ"' && typeof cached.empl === 'number') empl = cached.empl;
    if(imp === 'вЂ"' && typeof cached.imp === 'number') imp = cached.imp;
    if(officialWage === 'вЂ"' && typeof cached.wage === 'number') officialWage = cached.wage;
    if(gdp === 'вЂ"' && typeof cached.gdp === 'number') gdp = cached.gdp;
    if(gdp === 'вЂ"' && typeof fallback.gdp === 'number') gdp = fallback.gdp;
    if(ind === 'вЂ"' && typeof cached.ind === 'number') ind = cached.ind;
    if(ind === 'вЂ"' && typeof fallback.ind === 'number') ind = fallback.ind;
    if(pop === 'вЂ"' && typeof cached.pop === 'number') pop = cached.pop;
    if(pop === 'вЂ"' && typeof fallback.pop === 'number') pop = fallback.pop;
    if(empl === 'вЂ"' && typeof cached.empl === 'number') empl = cached.empl;
    if(imp === 'вЂ"' && typeof cached.imp === 'number') imp = cached.imp;
    if(officialWage === 'вЂ"' && typeof cached.wage === 'number') officialWage = cached.wage;
    // Taxminiy elektr narxi (mintaqaviy o'rtacha)
    var estElec = gdp !== '—' ? (gdp > 10000 ? 0.15 : gdp > 5000 ? 0.08 : gdp > 2000 ? 0.05 : 0.03) : '—';

    // Navoiyga nisbat
    var wageRatio = (officialWage !== '—' && officialWage > 0) ? Math.round(officialWage / UZB_DATA.avg_wage * 10)/10 + 'x' : '—';
    var elecRatio = (estElec !== '—') ? Math.round(estElec / UZB_DATA.electricity * 10)/10 + 'x' : '—';

    return {iso:c.iso, code:c.code, name:c.name, flag:c.flag, gdp:gdp, ind:ind, pop:pop, empl:empl, imp:imp, wage:officialWage, wageYear:wageMeta ? wageMeta.year : '', wageBasis:wageMeta ? wageMeta.currencyLabel : '', estElec:estElec, wageRatio:wageRatio, elecRatio:elecRatio};
  });

  // KPI grid
  var totalPop = rows.reduce(function(s,r){return s+(typeof r.pop==='number'?r.pop:0);},0);
  var totalImp = rows.reduce(function(s,r){return s+(typeof r.imp==='number'?r.imp:0);},0);
  var avgGdp = rows.filter(function(r){return typeof r.gdp==='number';});
  var avgGdpVal = avgGdp.length ? Math.round(avgGdp.reduce(function(s,r){return s+r.gdp;},0)/avgGdp.length) : 0;
  var totalPopDisplay = totalPop > 0 ? Math.round(totalPop)+' mln' : 'вЂ"';
  var avgGdpDisplay = avgGdpVal > 0 ? '$'+avgGdpVal.toLocaleString() : 'вЂ"';
  var totalImpDisplay = totalImp > 0 ? '$'+Math.round(totalImp)+'B' : 'вЂ"';

  document.getElementById('wbKpiGrid').innerHTML =
    '<div style="padding:.8rem;background:var(--bg2);border-radius:10px;text-align:center"><div style="font-size:1.3rem">🌍</div><div style="font-size:.6rem;color:var(--text3)">12 davlat aholisi</div><div style="font-size:1rem;font-weight:800;color:var(--text)">'+Math.round(totalPop)+' mln</div></div>'+
    '<div style="padding:.8rem;background:var(--bg2);border-radius:10px;text-align:center"><div style="font-size:1.3rem">💰</div><div style="font-size:.6rem;color:var(--text3)">O\'rtacha YaIM/kishi</div><div style="font-size:1rem;font-weight:800;color:var(--text)">$'+avgGdpVal.toLocaleString()+'</div></div>'+
    '<div style="padding:.8rem;background:var(--bg2);border-radius:10px;text-align:center"><div style="font-size:1.3rem">📦</div><div style="font-size:.6rem;color:var(--text3)">Jami import</div><div style="font-size:1rem;font-weight:800;color:var(--text)">$'+Math.round(totalImp)+'B</div></div>'+
    '<div style="padding:.8rem;background:linear-gradient(135deg,rgba(5,150,105,.1),rgba(6,214,160,.1));border-radius:10px;text-align:center;border:1px solid rgba(5,150,105,.3)"><div style="font-size:1.3rem">🇺🇿</div><div style="font-size:.6rem;color:var(--text3)">Navoiy IEZ ish haqi</div><div style="font-size:1rem;font-weight:800;color:#059669">$'+UZB_DATA.avg_wage+'/oy</div></div>';

  // Table
  var tb = document.getElementById('wb-tbody');
  tb.innerHTML = rows.sort(function(a,b){return (typeof b.gdp==='number'?b.gdp:0)-(typeof a.gdp==='number'?a.gdp:0);}).map(function(r,i){
    var wageColor = r.wageRatio!=='—' && parseFloat(r.wageRatio)>2 ? '#059669' : 'var(--text)';
    return '<tr>'+
      '<td>'+(i+1)+'</td>'+
      '<td>'+r.flag+' <b>'+r.name+'</b></td>'+
      '<td style="font-weight:700">$'+(typeof r.gdp==='number'?r.gdp.toLocaleString():r.gdp)+'</td>'+
      '<td>'+(typeof r.ind==='number'?r.ind+'%':r.ind)+'</td>'+
      '<td>$'+(typeof r.wage==='number'?r.wage.toLocaleString():r.wage)+'</td>'+
      '<td>~$'+(typeof r.estElec==='number'?r.estElec:r.estElec)+'</td>'+
      '<td>'+(typeof r.pop==='number'?r.pop+'M':r.pop)+'</td>'+
      '<td style="color:'+wageColor+';font-weight:700">'+(r.wageRatio!=='—'?'👷 '+r.wageRatio+' | ⚡ '+r.elecRatio:'—')+'</td>'+
      '</tr>';
  }).join('');

  // Add Uzbekistan row
  tb.innerHTML += '<tr style="background:linear-gradient(135deg,rgba(5,150,105,.05),rgba(6,214,160,.05));font-weight:700">'+
    '<td>🏆</td><td>🇺🇿 <b>Navoiy IEZ</b></td>'+
    '<td>$'+UZB_DATA.gdp_per_capita.toLocaleString()+'</td>'+
    '<td>'+UZB_DATA.industry_pct+'%</td>'+
    '<td style="color:#059669">$'+UZB_DATA.avg_wage+'</td>'+
    '<td style="color:#059669">$'+UZB_DATA.electricity+'</td>'+
    '<td>'+UZB_DATA.population+'M</td>'+
    '<td style="color:#059669;font-weight:800">✅ ENG ARZON</td></tr>';

  // Save to Firebase
  DB.worldBankData = {countries: rows, updated: new Date().toISOString(), uzb: UZB_DATA};
  if(typeof fbSave==='function') fbSave('worldBankData', DB.worldBankData);

  toast('✅ 12 davlat iqtisodiy ma\'lumotlari yuklandi! (World Bank)');
}

loadWorldBankData = async function(){
  var wbEmpty = document.getElementById('wbEmpty');
  var wbLoading = document.getElementById('wbLoading');
  var wbData = document.getElementById('wbData');
  var titleEl = document.getElementById('wbSectionTitle');
  var kpiGrid = document.getElementById('wbKpiGrid');
  var tbody = document.getElementById('wb-tbody');

  if(wbEmpty) wbEmpty.style.display = 'none';
  if(wbLoading) wbLoading.style.display = 'block';
  if(wbData) wbData.style.display = 'none';

  var countryList = await getWorldBankCountryList();
  var selectedCountries = buildSelectedWorldBankCountries(countryList);
  var selectedCount = selectedCountries.length;

  if(titleEl){
    titleEl.textContent = "🏦 " + selectedCount + " Davlat Iqtisodiy Ko'rsatkichlari (World Bank)";
  }

  if(!selectedCount){
    if(wbLoading) wbLoading.style.display = 'none';
    if(wbData) wbData.style.display = 'none';
    if(wbEmpty) wbEmpty.style.display = 'block';
    toast("🌍 Avval Maqsad davlatlar bo'limidan kamida 1 ta davlat tanlang");
    return;
  }

  toast("🏦 World Bank API'dan " + selectedCount + " davlat ma'lumoti yuklanmoqda...");

  var uniqueCodes = [];
  selectedCountries.forEach(function(country){
    if(country && country.wbCode && uniqueCodes.indexOf(country.wbCode) === -1) uniqueCodes.push(country.wbCode);
  });
  if(uniqueCodes.indexOf('UZB') === -1) uniqueCodes.push('UZB');
  var codes = uniqueCodes.join(';');

  var results = await Promise.all([
    fetchWBIndicator(codes, 'NY.GDP.PCAP.CD'),
    fetchWBIndicator(codes, 'NV.IND.TOTL.ZS'),
    fetchWBIndicator(codes, 'SP.POP.TOTL'),
    fetchWBIndicator(codes, 'SL.IND.EMPL.ZS'),
    fetchWBIndicator(codes, 'NE.IMP.GNFS.CD'),
    fetchIlostatWages(codes)
  ]);

  var gdpData = results[0] || {};
  var indData = results[1] || {};
  var popData = results[2] || {};
  var emplData = results[3] || {};
  var impData = results[4] || {};
  var wageData = results[5] || {};
  var cachedRows = (((DB||{}).worldBankData||{}).countries || []);
  var cachedByIso = {};
  cachedRows.forEach(function(r){
    if(r && r.iso) cachedByIso[r.iso] = r;
    if(r && r.wbCode) cachedByIso[r.wbCode] = r;
  });

  if(wbLoading) wbLoading.style.display = 'none';
  if(wbData) wbData.style.display = 'block';

  var uzbCountry = { iso:'UZB', wbCode:'UZB' };
  var uzbGdpEntry = getWorldBankValue(gdpData, uzbCountry);
  var uzbIndEntry = getWorldBankValue(indData, uzbCountry);
  var uzbPopEntry = getWorldBankValue(popData, uzbCountry);
  if(uzbGdpEntry) UZB_DATA.gdp_per_capita = Math.round(uzbGdpEntry.value);
  if(uzbIndEntry) UZB_DATA.industry_pct = Math.round(uzbIndEntry.value * 10) / 10;
  if(uzbPopEntry) UZB_DATA.population = Math.round(uzbPopEntry.value / 1e6 * 10) / 10;

  var s = DB.settings || {};
  UZB_DATA.avg_wage = s.maosh || 400;
  UZB_DATA.electricity = s.elektr || 0.03;

  var rows = selectedCountries.map(function(c){
    var cached = cachedByIso[c.iso] || cachedByIso[c.wbCode] || {};
    var fallback = WB_FALLBACK[c.iso] || WB_FALLBACK[c.wbCode] || {};
    var gdpEntry = getWorldBankValue(gdpData, c);
    var indEntry = getWorldBankValue(indData, c);
    var popEntry = getWorldBankValue(popData, c);
    var emplEntry = getWorldBankValue(emplData, c);
    var impEntry = getWorldBankValue(impData, c);
    var gdp = gdpEntry ? Math.round(gdpEntry.value) : '—';
    var ind = indEntry ? Math.round(indEntry.value * 10) / 10 : '—';
    var pop = popEntry ? Math.round(popEntry.value / 1e6 * 10) / 10 : '—';
    var empl = emplEntry ? Math.round(emplEntry.value * 10) / 10 : '—';
    var imp = impEntry ? Math.round(impEntry.value / 1e9 * 10) / 10 : '—';
    var wageMeta = wageData[c.iso] && !wageData[c.iso].error ? wageData[c.iso] : null;
    var officialWage = wageMeta && typeof wageMeta.value === 'number' && !isNaN(wageMeta.value) ? Math.round(wageMeta.value) : '—';

    if(gdp === '—' && typeof cached.gdp === 'number') gdp = cached.gdp;
    if(gdp === '—' && typeof fallback.gdp === 'number') gdp = fallback.gdp;
    if(ind === '—' && typeof cached.ind === 'number') ind = cached.ind;
    if(ind === '—' && typeof fallback.ind === 'number') ind = fallback.ind;
    if(pop === '—' && typeof cached.pop === 'number') pop = cached.pop;
    if(pop === '—' && typeof fallback.pop === 'number') pop = fallback.pop;
    if(empl === '—' && typeof cached.empl === 'number') empl = cached.empl;
    if(empl === '—' && typeof fallback.empl === 'number') empl = fallback.empl;
    if(imp === '—' && typeof cached.imp === 'number') imp = cached.imp;
    if(imp === '—' && typeof fallback.imp === 'number') imp = fallback.imp;
    if(officialWage === '—' && typeof cached.wage === 'number') officialWage = cached.wage;
    if(officialWage === '—' && typeof fallback.wage === 'number') officialWage = fallback.wage;

    var estElec = gdp !== '—' ? (gdp > 10000 ? 0.15 : gdp > 5000 ? 0.08 : gdp > 2000 ? 0.05 : 0.03) : '—';
    var wageRatio = (officialWage !== '—' && officialWage > 0) ? Math.round(officialWage / UZB_DATA.avg_wage * 10) / 10 + 'x' : '—';
    var elecRatio = (estElec !== '—' && UZB_DATA.electricity > 0) ? Math.round(estElec / UZB_DATA.electricity * 10) / 10 + 'x' : '—';

    return {
      iso: c.iso,
      wbCode: c.wbCode,
      code: c.code || '',
      name: c.name,
      flag: c.flag || '',
      gdp: gdp,
      ind: ind,
      pop: pop,
      empl: empl,
      imp: imp,
      wage: officialWage,
      wageYear: wageMeta ? wageMeta.year : '',
      wageBasis: wageMeta ? wageMeta.currencyLabel : '',
      estElec: estElec,
      wageRatio: wageRatio,
      elecRatio: elecRatio
    };
  });

  var totalPop = rows.reduce(function(sum, row){ return sum + (typeof row.pop === 'number' ? row.pop : 0); }, 0);
  var totalImp = rows.reduce(function(sum, row){ return sum + (typeof row.imp === 'number' ? row.imp : 0); }, 0);
  var avgGdpRows = rows.filter(function(row){ return typeof row.gdp === 'number'; });
  var avgGdpVal = avgGdpRows.length ? Math.round(avgGdpRows.reduce(function(sum, row){ return sum + row.gdp; }, 0) / avgGdpRows.length) : 0;
  var totalPopDisplay = totalPop > 0 ? Math.round(totalPop) + ' mln' : '—';
  var avgGdpDisplay = avgGdpVal > 0 ? '$' + avgGdpVal.toLocaleString() : '—';
  var totalImpDisplay = totalImp > 0 ? '$' + Math.round(totalImp) + 'B' : '—';

  if(kpiGrid){
    kpiGrid.innerHTML =
      '<div style="padding:.8rem;background:var(--bg2);border-radius:10px;text-align:center"><div style="font-size:1.3rem">🌍</div><div style="font-size:.6rem;color:var(--text3)">' + selectedCount + ' davlat aholisi</div><div style="font-size:1rem;font-weight:800;color:var(--text)">' + totalPopDisplay + '</div></div>'+
      '<div style="padding:.8rem;background:var(--bg2);border-radius:10px;text-align:center"><div style="font-size:1.3rem">💰</div><div style="font-size:.6rem;color:var(--text3)">O\'rtacha YaIM/kishi</div><div style="font-size:1rem;font-weight:800;color:var(--text)">' + avgGdpDisplay + '</div></div>'+
      '<div style="padding:.8rem;background:var(--bg2);border-radius:10px;text-align:center"><div style="font-size:1.3rem">📦</div><div style="font-size:.6rem;color:var(--text3)">Jami import</div><div style="font-size:1rem;font-weight:800;color:var(--text)">' + totalImpDisplay + '</div></div>'+
      '<div style="padding:.8rem;background:linear-gradient(135deg,rgba(5,150,105,.1),rgba(6,214,160,.1));border-radius:10px;text-align:center;border:1px solid rgba(5,150,105,.3)"><div style="font-size:1.3rem">UZ</div><div style="font-size:.6rem;color:var(--text3)">Navoiy IEZ ish haqi</div><div style="font-size:1rem;font-weight:800;color:#059669">$' + UZB_DATA.avg_wage + '/oy</div></div>';
  }

  if(tbody){
    tbody.innerHTML = rows
      .sort(function(a,b){ return (typeof b.gdp === 'number' ? b.gdp : 0) - (typeof a.gdp === 'number' ? a.gdp : 0); })
      .map(function(r, i){
        var wageColor = r.wageRatio !== '—' && parseFloat(r.wageRatio) > 2 ? '#059669' : 'var(--text)';
        return '<tr>'+
          '<td>' + (i + 1) + '</td>'+
          '<td>' + r.flag + ' <b>' + r.name + '</b></td>'+
          '<td style="font-weight:700">' + (typeof r.gdp === 'number' ? '$' + r.gdp.toLocaleString() : r.gdp) + '</td>'+
          '<td>' + (typeof r.ind === 'number' ? r.ind + '%' : r.ind) + '</td>'+
          '<td>' + (typeof r.wage === 'number' ? '$' + r.wage.toLocaleString() : r.wage) + '</td>'+
          '<td>' + (typeof r.estElec === 'number' ? '~$' + r.estElec : r.estElec) + '</td>'+
          '<td>' + (typeof r.pop === 'number' ? r.pop + 'M' : r.pop) + '</td>'+
          '<td style="color:' + wageColor + ';font-weight:700">' + (r.wageRatio !== '—' ? '👷 ' + r.wageRatio + ' | ⚡ ' + r.elecRatio : '—') + '</td>'+
          '</tr>';
      }).join('');

    tbody.innerHTML += '<tr style="background:linear-gradient(135deg,rgba(5,150,105,.05),rgba(6,214,160,.05));font-weight:700">'+
      '<td>🏆</td><td>uz Navoiy IEZ</td>'+
      '<td>$' + UZB_DATA.gdp_per_capita.toLocaleString() + '</td>'+
      '<td>' + UZB_DATA.industry_pct + '%</td>'+
      '<td style="color:#059669">$' + UZB_DATA.avg_wage + '</td>'+
      '<td style="color:#059669">$' + UZB_DATA.electricity + '</td>'+
      '<td>' + UZB_DATA.population + 'M</td>'+
      '<td style="color:#059669;font-weight:800">✅ ENG ARZON</td></tr>';
  }

  DB.worldBankData = {
    countries: rows,
    selectedCountries: selectedCountries.map(function(c){
      return { iso: c.iso, wbCode: c.wbCode, name: c.name, rawName: c.rawName, flag: c.flag, code: c.code || '' };
    }),
    updated: new Date().toISOString(),
    uzb: UZB_DATA
  };
  if(typeof fbSave === 'function') fbSave('worldBankData', DB.worldBankData);

  toast("✅ " + selectedCount + " davlat iqtisodiy ma'lumoti yuklandi! (World Bank)");
};

function resetAllPipeline(){
  if(!confirm('Barcha kompaniyalarning pipeline holatini "Yangi" ga qaytarish tasdiqlaysizmi?')) return;
  var co = DB.investorCompanies||[];
  co.forEach(function(c){
    c.pipelineStage = 'new';
    c.emailSent = false;
    c.emailSentDate = '';
    if(typeof fbSave==='function') fbSave('investorCompanies', c);
  });
  renderPipeline();
toast('🗑 Outreach statistikasi tozalandi — barcha kompaniyalar "Yangi" holatiga qaytarildi');
}

function clearWorldBankData(){
  if(!confirm('World Bank ma\'lumotlarini tozalash?')) return;
  DB.worldBankData = null;
  document.getElementById('wbData').style.display = 'none';
  document.getElementById('wbEmpty').style.display = 'block';
  document.getElementById('wb-tbody').innerHTML = '';
  document.getElementById('wbKpiGrid').innerHTML = '';
  toast('🗑 World Bank ma\'lumotlari tozalandi');
}

/* ═══ TRANSPORT TAB SWITCHING ═══ */
TARGET_COUNTRIES = [
  {code:'UZ',name:"O'zbekiston",flag:'',comtrade:'860'},
  {code:'TM',name:'Turkmaniston',flag:'',comtrade:'795'},
  {code:'TJ',name:'Tojikiston',flag:'',comtrade:'762'},
  {code:'KG',name:"Qirg'iziston",flag:'',comtrade:'417'},
  {code:'KZ',name:"Qozog'iston",flag:'',comtrade:'398'},
  {code:'MN',name:"Mo'g'uliston",flag:'',comtrade:'496'},
  {code:'RU',name:'Rossiya',flag:'',comtrade:'643'},
  {code:'AZ',name:'Ozarbayjon',flag:'',comtrade:'031'},
  {code:'GE',name:'Gruziya',flag:'',comtrade:'268'},
  {code:'AM',name:'Armaniston',flag:'',comtrade:'051'},
  {code:'IR',name:'Eron',flag:'',comtrade:'364'},
  {code:'AF',name:"Afg'oniston",flag:'',comtrade:'004'},
  {code:'PK',name:'Pokiston',flag:'',comtrade:'586'}
];

function initImportAnalysisComtradeOnly(){
  var targetCountries = arguments[0];
  var source = arguments[1] || 'comtrade';
  var labels = getImportAnalysisLabels();
  var count = (targetCountries && targetCountries.length) ? targetCountries.length : TARGET_COUNTRIES.length;
  var importPage = document.getElementById('page-import');
  if(!importPage) return;

  var sub = importPage.querySelector('.pg-sub');
  if(sub) sub.textContent = count+" davlat import statistikasi - 2021-2024 "+getImportAnalysisSourceLabel(source);

  var kpi1 = document.getElementById('imp-k1');
  var kpi1Label = kpi1 ? kpi1.previousElementSibling : null;
  if(kpi1Label) kpi1Label.textContent = labels.totalKpi;

  var kpi4 = document.getElementById('imp-k4');
  var kpi4Label = kpi4 ? kpi4.previousElementSibling : null;
  if(kpi4Label) kpi4Label.textContent = labels.sourceLabel;

  var kpi3 = document.getElementById('imp-k3');
  var kpi3Label = kpi3 ? kpi3.previousElementSibling : null;
  if(kpi3Label) kpi3Label.textContent = labels.biggestKpi;

  // Bar chart title update removed (chart hidden)

  var wbLoading = document.getElementById('wbLoading');
  var wbCard = wbLoading ? wbLoading.closest('.tcard') : null;
  if(wbCard) wbCard.style.display = '';
}

function buildImportTargetKey(targetCountries){
  var names = (targetCountries && targetCountries.length ? targetCountries : FINDER_ALWAYS_TARGET_COUNTRIES.slice()).map(function(country){
    if(typeof country === 'string') return country;
    return String(country && (country.name || country.label || country.code) || '').trim();
  }).filter(Boolean).sort();
  var base = names.join('|') || 'default';
  var hash = 0;
  for(var i=0;i<base.length;i++){
    hash = ((hash << 5) - hash) + base.charCodeAt(i);
    hash |= 0;
  }
  return 't' + Math.abs(hash).toString(36);
}

function hashTargetList(items){
  return buildImportTargetKey(items || []);
}

function buildImportSnapshotId(prod, hsCode, targetCountries, source){
  var sourceScope = getImportAnalysisSourceScopeState();
  var year = (typeof getImportAnalysisSelectedYear === 'function') ? getImportAnalysisSelectedYear() : 'all';
  return ['importv6', getImportAnalysisFinderMode(), getImportAnalysisSnapshotSourceKey(source), sourceScope.cacheKey, (prod&&prod.id)||'na', hsCode||'na', buildImportTargetKey(targetCountries), 'y' + year]
    .join('_')
    .replace(/[^a-zA-Z0-9_-]/g,'_');
}

function getImportSnapshot(prod, hsCode, targetCountries, source){
  var id = buildImportSnapshotId(prod, hsCode, targetCountries, source);
  return (DB.importSnapshots||[]).find(function(item){ return String(item.id)===String(id); }) || null;
}

function getImportAnalysisSourceScopeState(source){
  var sourceKey = getImportAnalysisSourceKey(source || getImportAnalysisSource());
  if(getImportAnalysisFinderMode() === 'importers' && sourceKey !== 'tradeatlas'){
    return {
      hasFilter: false,
      countries: [],
      continents: [],
      effectiveCountries: [],
      cacheKey: 'world'
    };
  }
  var selection = getFinderSourceSelection();
  var effectiveCountries = (selection.effectiveCountries || []).slice().sort();
  var countries = (selection.countries || []).slice().sort();
  var continents = (selection.continents || []).slice().sort();
  return {
    hasFilter: !!selection.hasFilter,
    countries: countries,
    continents: continents,
    effectiveCountries: effectiveCountries,
    cacheKey: effectiveCountries.length ? ('src_' + hashTargetList(effectiveCountries)) : 'world'
  };
}

function restoreImportSnapshot(snapshot, quiet){
  if(!snapshot || !(snapshot.countries||[]).length) return false;
  var storedTargets = (snapshot.targetCountries && snapshot.targetCountries.length) ? snapshot.targetCountries : FINDER_ALWAYS_TARGET_COUNTRIES.slice();
  var sourceKey = getImportAnalysisSourceKey(snapshot.source || snapshot.sourceKey || 'comtrade');
  _finderSourceContinents = (snapshot.sourceContinents || []).slice();
  _finderSourceCountries = (snapshot.sourceCountries || []).slice();
  renderFinderSourceFilters();
  var targetCountries = storedTargets.map(function(name){
    return {name:name,label:getFinderCountryLabel(name),flag:getFinderCountryFlag(name)};
  });
  syncImportSourceSelect(sourceKey);
  initImportAnalysisComtradeOnly(targetCountries, sourceKey);
  var sel = getImportAnalysisProductSelect();
  if(sel && snapshot.productId) sel.value = String(snapshot.productId);
  var prod = (DB.products||[]).find(function(p){ return String(p.id)===String(snapshot.productId); });
  if(!prod) return false;
  var resultsEl = document.getElementById('importResults');
  var emptyEl = document.getElementById('importEmpty');
  var finderEmptyEl = document.getElementById('finderEmpty');
  var detailEl = document.getElementById('finderImportDetailWrap');
  if(resultsEl) resultsEl.style.display = 'block';
  if(emptyEl) emptyEl.style.display = 'none';
  if(finderEmptyEl) finderEmptyEl.style.display = 'none';
  if(detailEl) detailEl.style.display = 'block';
  var countries = (snapshot.countries||[]).map(function(c){
    return {
      code:c.c||c.code||'',
      name:c.n||c.name||'',
      flag:c.f||c.flag||'',
      import_usd:Number(c.u||c.import_usd||0)||0,
      trend_pct:typeof (c.t||c.trend_pct) === 'number' ? (c.t||c.trend_pct) : (c.t===0?0:null),
      volume_tons:Number(c.v||c.volume_tons||0)||0,
      year_imports:c.y||c.year_imports||{},
      year_statuses:c.s||c.year_statuses||{},
      status:c.st||c.status||'ok',
      products:(c.pr||[]).map(function(p){
        return {
          period:p.period||'',
          reporter:p.reporter||'',
          partner:p.partner||'',
          partnerDesc:p.partner||'',
          partnerCode:Number(p.partnerCode||0),
          value:Number(p.value||0),
          weight:Number(p.weight||0),
          exporterCountry:p.exporterCountry||'',
          exporterCountryCode:p.exporterCountryCode||'',
          importerCompany:p.importerCompany||'',
          companyWebsite:p.companyWebsite||'',
          companyEmail:p.companyEmail||'',
          companyPhone:p.companyPhone||'',
          docCount:Number(p.docCount||0)
        };
      })
    };
  });
  renderImportResults(countries, prod, snapshot.source||getImportAnalysisSourceLabel(sourceKey), targetCountries);
  if(!quiet) toast('💾 Firebase cache ochildi: '+(snapshot.productName||formatBilingualProductName(prod)||''));
  return true;
}

function saveImportSnapshot(prod, hsCode, countries, source, targetCountries){
  if(!prod || !countries || !countries.length) return;
  var sourceKey = getImportAnalysisSourceKey(source);
  var sourceScope = getImportAnalysisSourceScopeState();
  var snapshotTargets = ((targetCountries && targetCountries.length) ? targetCountries : FINDER_ALWAYS_TARGET_COUNTRIES.slice()).map(function(country){
    return typeof country === 'string' ? country : String(country && (country.name || country.label || country.code) || '');
  }).filter(Boolean);
  var snapshot = {
    id: buildImportSnapshotId(prod, hsCode, snapshotTargets, sourceKey),
    productId: String(prod.id||''),
    productName: formatBilingualProductName(prod),
    hsCode: hsCode||'',
    source: source||getImportAnalysisSourceLabel(sourceKey),
    sourceKey: sourceKey,
    sourceContinents: sourceScope.continents,
    sourceCountries: sourceScope.countries,
    sourceEffectiveCountries: sourceScope.effectiveCountries,
    sourceScopeKey: sourceScope.cacheKey,
    updatedAt: new Date().toISOString(),
    targetCountries: snapshotTargets,
    countries: countries.map(function(c){
      return {
        c:c.code||'',
        n:c.name||'',
        f:c.flag||'',
        u:Number(c.import_usd||0)||0,
        t:typeof c.trend_pct === 'number' ? c.trend_pct : null,
        v:Number(c.volume_tons||0)||0,
        y:c.year_imports||{},
        s:c.year_statuses||{},
        st:c.status||'ok',
        pr:(c.products||[]).map(function(p){
          return {
            period:p.period||'',
            reporter:p.reporter||'',
            partner:p.partner||p.partnerDesc||'',
            partnerCode:Number(p.partnerCode||0),
            value:Number(p.value||0),
            weight:Number(p.weight||0),
            exporterCountry:p.exporterCountry||'',
            exporterCountryCode:p.exporterCountryCode||'',
            importerCompany:p.importerCompany||'',
            companyWebsite:p.companyWebsite||'',
            companyEmail:p.companyEmail||'',
            companyPhone:p.companyPhone||'',
            docCount:Number(p.docCount||0)
          };
        })
      };
    })
  };
  upsertDbRecord('importSnapshots', snapshot);
  if(typeof fbSave==='function') fbSave('importSnapshots', snapshot);
  saveSettingsPatch({lastImportSnapshotId:snapshot.id});
}

function restoreLastImportSnapshot(){
  var lastId = DB.settings && DB.settings.lastImportSnapshotId;
  if(!lastId) return false;
  var snapshot = (DB.importSnapshots||[]).find(function(item){ return String(item.id)===String(lastId); });
  if(!snapshot) return false;
  return restoreImportSnapshot(snapshot, true);
}

function resetImportAnalysisUi(message){
  var resultsEl = document.getElementById('importResults');
  var emptyEl = document.getElementById('importEmpty');
  var finderEmptyEl = document.getElementById('finderEmpty');
  var detailEl = document.getElementById('finderImportDetailWrap');
  var emptyText = emptyEl ? emptyEl.querySelector('p') : null;
  if(resultsEl) resultsEl.style.display = 'none';
  if(emptyEl) emptyEl.style.display = 'block';
  if(finderEmptyEl) finderEmptyEl.style.display = '';
  if(detailEl) detailEl.style.display = 'none';
  if(emptyText) emptyText.textContent = message || 'Mahsulot tanlang va "Tahlil qilish" tugmasini bosing';

  var ids = ['imp-k1','imp-k2','imp-k3','imp-k4'];
  ids.forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.textContent = '—';
  });
  var chartEl = document.getElementById('importBarChart');
  if(chartEl) chartEl.innerHTML = '';
  clearImportDetailBody('');
}

function clearImportDetailBody(message){
  var bodyEl = document.getElementById('import-detail-body');
  if(!bodyEl) return;
  bodyEl.innerHTML = message ? '<div class="import-detail-empty">'+escHtml(message)+'</div>' : '';
}

function formatImportDetailUsd(value){
  var num = Number(value || 0) || 0;
  return num > 0 ? ('$' + Math.round(num).toLocaleString('en-US')) : '\u2014';
}

function formatImportDetailTons(value, compact){
  var num = Number(value || 0) || 0;
  if(!(num > 0)) return '\u2014';
  if(compact && num >= 1000) return Math.round(num / 1000).toLocaleString('en-US') + 'K t';
  return Math.round(num).toLocaleString('en-US') + ' t';
}

function getImportRowWeightTons(row){
  if(!row) return 0;
  var qty = Number(row.weight || row.quantity || 0) || 0;
  var unit = String(row.quantityUnit || '').toLowerCase();
  if(unit && unit.indexOf('kg') === -1 && (unit.indexOf('ton') !== -1 || unit === 't')) return qty;
  return qty / 1000;
}

function getImportRowWeightKg(row){
  if(!row) return 0;
  var qty = Number(row.weight || row.quantity || 0) || 0;
  var unit = String(row.quantityUnit || '').toLowerCase();
  if(unit && unit.indexOf('kg') === -1 && (unit.indexOf('ton') !== -1 || unit === 't')) return qty * 1000;
  return qty;
}

function formatImportDetailKg(weightKg){
  var n = Number(weightKg || 0);
  if(!(n > 0)) return '\u2014';
  var rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString('en-US', {
    minimumFractionDigits: rounded % 1 ? 2 : 0,
    maximumFractionDigits: rounded % 1 ? 2 : 0
  }) + ' kg';
}

function isImportWorldRow(row){
  var partner = String(row && (row.partner || row.partnerDesc || '') || '').trim().toLowerCase();
  return partner === 'world' || Number(row && row.partnerCode) === 0;
}

function renderCountryImportAccordion(countries, getCountryMeta){
  var bodyEl = document.getElementById('import-detail-body');
  if(!bodyEl) return;
  var sortedCountries = (countries || []).slice().sort(function(a, b){
    return (b.import_usd || 0) - (a.import_usd || 0);
  });
  var singleCountryMode = sortedCountries.length === 1;
  if(!sortedCountries.length){
    clearImportDetailBody('Batafsil import ma\'lumotlari topilmadi');
    return;
  }

  var years = ['2024','2023','2022','2021'];
  bodyEl.innerHTML = sortedCountries.map(function(country, index){
    var meta = getCountryMeta(country);
    var flag = meta.flag ? escHtml(meta.flag) + ' ' : '';
    var label = escHtml(meta.label || country.name || '\u2014');
    var countryTotal = country.status === 'ok' ? formatImportDetailUsd(country.import_usd) : '\u2014';
    var countryVolume = country.status === 'ok' ? formatImportDetailTons(country.volume_tons, true) : '\u2014';
    var yi = country.year_imports || {};
    var cv21 = Number(yi['2021']||0), cv24 = Number(yi['2024']||0);
    var countryCagr = (cv21 > 0 && cv24 > 0) ? (Math.pow(cv24/cv21, 1/3) - 1) * 100 : null;
    var countryCagrFmt = countryCagr !== null ? (countryCagr >= 0 ? '+' : '') + countryCagr.toFixed(1) + '%' : '\u2014';
    var countryCagrColor = countryCagr !== null ? (countryCagr >= 0 ? '#059669' : '#EF233C') : 'var(--text3)';
    var rows = Array.isArray(country.products) ? country.products.slice() : [];
    var yearBlocks = years.map(function(year){
      var yearRows = rows.filter(function(row){
        return String(row.period || '') === year;
      });
      var worldRow = yearRows.find(isImportWorldRow);
      var partnerRows = yearRows.filter(function(row){
        return !isImportWorldRow(row) && (Number(row.value || 0) > 0 || Number(row.weight || row.quantity || 0) > 0);
      }).sort(function(a, b){
        return (Number(b.value || 0) || 0) - (Number(a.value || 0) || 0);
      });
      var yearValue = worldRow ? Number(worldRow.value || 0) : Number((country.year_imports || {})[year] || 0);
      if(!(yearValue > 0) && !worldRow){
        yearValue = partnerRows.reduce(function(sum, row){ return sum + Number(row.value || 0); }, 0);
      }
      var yearTons = worldRow ? getImportRowWeightTons(worldRow) : partnerRows.reduce(function(sum, row){ return sum + getImportRowWeightTons(row); }, 0);
      var yearStatus = String(((country.year_statuses || {})[year]) || country.status || 'no_data');
      var yearLabel = yearStatus === 'ok' ? formatImportDetailUsd(yearValue) : (yearStatus === 'rate_limited' ? 'limit' : (yearStatus === 'error' ? 'xato' : '\u2014'));
      var yearVolume = yearStatus === 'ok' ? formatImportDetailTons(yearTons, false) : '\u2014';
      var sourcesCount = partnerRows.length;
      var sourceRowsHtml = partnerRows.length
        ? ('<div class="import-source-table-wrap"><div class="tscroll"><table class="import-source-table"><thead><tr>' +
            '<th>#</th>' +
            '<th>PERIOD</th>' +
            '<th>REPORTER</th>' +
            '<th>PARTNER</th>' +
            '<th>IMPORT ($)</th>' +
            '<th>HAJM (KG)</th>' +
            '<th>NARX (\$/KG)</th>' +
            '<th>CAGR</th>' +
            '<th>AMAL</th>' +
          '</tr></thead><tbody>' + partnerRows.map(function(row, rowIndex){
            var reporterLabel = row.reporter || country.name || meta.label || '\u2014';
            return '<tr>' +
              '<td class="td-num">' + (rowIndex + 1) + '</td>' +
              '<td class="td-num">' + escHtml(year) + '</td>' +
              '<td class="import-source-reporter">' + escHtml(reporterLabel) + '</td>' +
              '<td class="import-source-partner">' + escHtml(row.partner || row.partnerDesc || '\u2014') +
                (row.exporterCountry ? ' <span style="display:inline-block;padding:1px 6px;border-radius:5px;background:rgba(70,95,255,.08);color:#465fff;font-size:.62rem;font-weight:700;letter-spacing:.04em;margin-left:6px;vertical-align:middle">'+(typeof getFinderCountryFlag==='function'?getFinderCountryFlag(row.exporterCountry)+' ':'')+escHtml(row.exporterCountry)+'</span>' : '') +
              '</td>' +
              '<td class="import-source-value">' + formatImportDetailUsd(row.value) + '</td>' +
              '<td class="import-source-weight">' + escHtml(formatImportDetailKg(getImportRowWeightKg(row))) + '</td>' +
              (function(){
                var wk=getImportRowWeightKg(row);
                var up=(Number(row.value||0)>0&&wk>0)?(Number(row.value||0)/wk):null;
                var pCell='<td style="color:#059669;font-weight:600">'+(up!==null?'$'+(up>=1?up.toFixed(2):up.toFixed(4))+'/kg':'—')+'</td>';
                var yi=country.year_imports||{};
                var cv21=Number(yi['2021']||0), cv24=Number(yi['2024']||0);
                var cagr=(cv21>0&&cv24>0)?(Math.pow(cv24/cv21,1/3)-1)*100:null;
                var cagrFmt=cagr!==null?(cagr>=0?'+':'')+cagr.toFixed(1)+'%':'—';
                var cagrColor=cagr!==null?(cagr>=0?'#059669':'#EF233C'):'var(--text3)';
                var cCell='<td style="font-weight:700;color:'+cagrColor+'">'+cagrFmt+'</td>';
                return pCell+cCell;
              })() +
              '<td class="import-source-action-cell"><button type="button" class="import-source-action" title="Partner tafsiloti">🔍</button></td>' +
            '</tr>';
          }).join('') + '</tbody></table></div></div>')
        : '<div class="import-source-table-wrap"><div class="import-source-empty">Bu yil uchun partner kesimidagi import ma\'lumotlari topilmadi.</div></div>';
      // "Bazaga saqlash" tugmasi — bu yildagi partnerlarni investor base'ga eksportyor sifatida saqlash
      var saveBtnHtml = '';
      if(partnerRows.length){
        var partnerPayload = {
          year: year,
          targetCountry: country.name || '',
          targetCountryCode: country.code || '',
          partners: partnerRows.map(function(r){
            return {
              kompaniya: r.partner || r.partnerDesc || '',
              importer: r.reporter || country.name || '',
              value: Number(r.value || 0),
              weight: Number(r.weight || 0),
              docCount: Number(r.docCount || 0),
              hsCode: r.hsCode || (prod && prod.hs_code) || '',
              productName: (prod && (prod.name_en || prod.name_uz)) || '',
              productId: String((prod && prod.id) || '')
            };
          })
        };
        var payloadJson = encodeURIComponent(JSON.stringify(partnerPayload));
        saveBtnHtml = '<button type="button" onclick="event.stopPropagation();saveImportPartnersToInvestorBase(\''+payloadJson+'\',this)" style="background:linear-gradient(135deg,#465fff,#7C3AED);color:#fff;border:none;border-radius:8px;padding:5px 12px;font-size:.7rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;margin-left:8px;box-shadow:0 2px 6px rgba(70,95,255,.25)" title="Bu yildagi '+partnerRows.length+' ta partnerni Investor bazaga saqlash (eksportyor sifatida)">💾 Bazaga saqlash ('+partnerRows.length+')</button>';
      }
      return '<details class="import-year-item"' + (index === 0 && year === '2024' ? ' open' : '') + '>' +
        '<summary class="import-year-summary">' +
          '<div class="import-year-main">' +
            '<span class="import-year-arrow"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></span>' +
            '<div><div class="import-year-label">' + escHtml(year) + '</div><div class="import-year-sources">' + sourcesCount + ' ta manba</div></div>' +
          '</div>' +
          '<div class="import-year-meta"><span class="import-year-total">' + escHtml(yearLabel) + '</span><span class="import-year-volume">' + escHtml(yearVolume) + '</span>' + saveBtnHtml + '</div>' +
        '</summary>' +
        sourceRowsHtml +
      '</details>';
    }).join('');

    if(singleCountryMode){
      return '<div class="import-country-years">' + yearBlocks + '</div>';
    }

    return '<details class="import-country-item" data-detail-country="' + escHtml((country.code||'').toUpperCase()) + '"' + (index === 0 ? ' open' : '') + '>' +
      '<summary class="import-country-summary">' +
        '<div class="import-country-main">' +
          '<span class="import-country-arrow"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></span>' +
          '<span class="import-country-name">' + flag + label + '</span>' +
        '</div>' +
        '<div class="import-country-meta"><span class="import-country-total">' + escHtml(countryTotal) + '</span><span style="font-size:.78rem;font-weight:700;color:' + countryCagrColor + ';min-width:3.5rem;text-align:right">' + escHtml(countryCagrFmt) + '</span><span class="import-country-volume">' + escHtml(countryVolume) + '</span></div>' +
      '</summary>' +
      '<div class="import-country-years">' + yearBlocks + '</div>' +
    '</details>';
  }).join('');
}

function handleImportProductChange(){
  var targetCountries = getImportAnalysisTargetCountries();
  var sourceKey = getImportAnalysisSource();
  initImportAnalysisComtradeOnly(targetCountries, sourceKey);
  renderFinderProductPicker();
  var sel = getImportAnalysisProductSelect();
  var prodId = sel ? sel.value : '';
  // CSV Import tugmasini ko'rsatish/yashirish
  var csvBtn = document.getElementById('finderCsvBtn');
  if(csvBtn) csvBtn.style.display = prodId ? 'inline-flex' : 'none';
  if(!prodId){
    resetImportAnalysisUi('Mahsulot tanlang va "Tahlil qilish" tugmasini bosing');
    return;
  }
  var prod = (DB.products||[]).find(function(p){ return String(p.id)===String(prodId); });
  if(!prod){
    resetImportAnalysisUi('Mahsulot tanlandi. Endi "Tahlil qilish" tugmasini bosing');
    return;
  }
  // Avtomatik snapshot tiklash o'chirildi — faqat "Tahlil qilish" tugmasi bosilganda tahlil bo'lsin
  resetImportAnalysisUi('Mahsulot tanlandi. Endi "Tahlil qilish" tugmasini bosing');
}

function prepareImportAnalysisPage(){
  initImportAnalysisComtradeOnly(null, getImportAnalysisSource());
  resetImportAnalysisUi('Mahsulot tanlang va "Tahlil qilish" tugmasini bosing');
}

function handleImportSourceChange(){
  handleImportProductChange();
}

async function runImportAnalysis(forceRefresh, sourceOverride){
  var targetCountries = getImportAnalysisTargetCountries();
  var sourceKey = (typeof sourceOverride === 'string' && sourceOverride) ? sourceOverride : 'comtrade';
  var sourceLabel = sourceKey === 'tradeatlas' ? 'TradeAtlas' : 'UN Comtrade';
  var selectedYear = getImportAnalysisPrimaryYear();
  syncImportSourceSelect(sourceKey);
  if(sourceKey !== 'tradeatlas') initImportAnalysisComtradeOnly(targetCountries, sourceKey);

  var sel = getImportAnalysisProductSelect();
  var prodId = sel ? sel.value : '';
  if(!prodId){ toast('Mahsulot tanlang','error'); return; }
  if(!targetCountries.length){ toast('Kamida bitta maqsad davlat tanlang','error'); return; }

  var prod = (DB.products||[]).find(function(p){ return String(p.id)===String(prodId); });
  if(!prod){ toast('Mahsulot topilmadi','error'); return; }

  var resultsEl = document.getElementById('importResults');
  var emptyEl = document.getElementById('importEmpty');
  var finderEmptyEl = document.getElementById('finderEmpty');
  var detailEl = document.getElementById('finderImportDetailWrap');
  if(resultsEl) resultsEl.style.display = 'block';
  if(emptyEl) emptyEl.style.display = 'none';
  if(finderEmptyEl) finderEmptyEl.style.display = 'none';
  if(detailEl) detailEl.style.display = 'none';

  var hsCode = getExactImportHsCode(prod);
  if(hsCode.length < 2){
    if(resultsEl) resultsEl.style.display = 'none';
    if(emptyEl) emptyEl.style.display = 'block';
    if(finderEmptyEl) finderEmptyEl.style.display = '';
    if(detailEl) detailEl.style.display = 'none';
    toast('Bu mahsulot uchun HS kod topilmadi','error');
    return;
  }

  // 1-qadam: Firebase kolleksiyasini yuklab, snapshot bor-yo'qligini tekshiramiz
  var _snapshotToast = toastLoading('⏳ Firebase ma\'lumot bazasi tekshirilmoqda...');
  try {
    if(typeof ensureCollectionLoaded === 'function') await ensureCollectionLoaded('importSnapshots');
  } catch(_e){}
  var savedSnapshot = getImportSnapshot(prod, hsCode, targetCountries, sourceKey);
  if(_snapshotToast && _snapshotToast.parentNode){ clearTimeout(_snapshotToast._toastTimer); _snapshotToast.remove(); }
  if(savedSnapshot){
    restoreImportSnapshot(savedSnapshot, false);
    toast('✅ Firebase\'dan saqlangan tahlil tiklandi','success');
    return;
  }

  var _tahlilToast = toastLoading('⏳ '+sourceLabel+' ma\'lumot olmoqda (HS: '+hsCode+')...');
  var countries = null;
  if(sourceKey === 'tradeatlas'){
    var sourceScope = getImportAnalysisSourceScopeState(sourceKey);
    countries = await fetchTradeAtlasImportAnalysis(prod, targetCountries, sourceScope);
  } else {
    countries = await fetchComtrade(hsCode, selectedYear, targetCountries, sourceKey);
  }

  if(!countries || !countries.length){
    if(resultsEl) resultsEl.style.display = 'none';
    if(emptyEl) emptyEl.style.display = 'block';
    if(detailEl) detailEl.style.display = 'none';
    toastDone(_tahlilToast, '❌ '+sourceLabel+' dan ma\'lumot topilmadi.','error');
    return;
  }

  renderImportResults(countries, prod, sourceLabel, targetCountries);
  if(detailEl) detailEl.style.display = 'block';
  saveImportSnapshot(prod, hsCode, countries, sourceLabel, targetCountries);
  var okCount = countries.filter(function(c){ return c.status==='ok'; }).length;
  var noDataCount = countries.filter(function(c){ return c.status==='no_data'; }).length;
  var limitCount = countries.filter(function(c){ return c.status==='rate_limited'; }).length;
  toastDone(_tahlilToast, '✅ Tahlil tayyor: '+okCount+' davlat, '+noDataCount+' ma\'lumotsiz');
}

function buildWitsDetailRows(countries){
  var rows = [];
  (countries || []).forEach(function(country){
    (country.products || []).forEach(function(row){
      rows.push({
        reporter: row.reporter || country.name || '—',
        tradeFlow: row.tradeFlow || 'Import',
        productCode: row.hs || '',
        productDescription: row.desc || '',
        year: row.period || '',
        partner: row.partner || '—',
        tradeValue1000Usd: Number(row.tradeValue1000Usd || ((row.value || 0) / 1000) || 0),
        quantity: Number(row.quantity || row.weight || 0),
        quantityUnit: row.quantityUnit || 'Kg'
      });
    });
  });
  rows.sort(function(a,b){
    if(String(a.reporter) !== String(b.reporter)) return String(a.reporter).localeCompare(String(b.reporter));
    if(String(a.year) !== String(b.year)) return String(b.year).localeCompare(String(a.year));
    if(String(a.partner) === 'World' && String(b.partner) !== 'World') return -1;
    if(String(b.partner) === 'World' && String(a.partner) !== 'World') return 1;
    return (b.tradeValue1000Usd || 0) - (a.tradeValue1000Usd || 0);
  });
  return rows;
}

function renderWitsImportDetailTable(countries, getTargetMeta){
  renderCountryImportAccordion(countries, getTargetMeta);
}

function renderDefaultImportDetailTable(countries, prod, getTargetMeta){
  var theadEl = document.getElementById('import-thead');
  var tb = document.getElementById('import-tbody');
  if(!theadEl || !tb) return;
  var tableEl = tb.parentNode;
  Array.from(tableEl.querySelectorAll('tbody[data-extra]')).forEach(function(el){ el.remove(); });

  var hasProducts = countries.some(function(c){
    return (c.products||[]).some(function(p){
      return Number(p.partnerCode!==undefined?p.partnerCode:-1)!==0 && (p.value||p.weight);
    });
  });

  if(hasProducts){
    // Reporter > Year > flat rows accordion
    theadEl.innerHTML = '';
    tb.innerHTML = '';
    var sorted = countries.slice().sort(function(a,b){return (b.import_usd||0)-(a.import_usd||0);});
    sorted.forEach(function(c,ci){
      var tc = getTargetMeta(c);
      var totalFmt = c.status==='ok' ? investAiFmtUsd(c.import_usd||0) : '—';
      var vol = c.volume_tons>0?(c.volume_tons>999?Math.round(c.volume_tons/1000)+'K t':Math.round(c.volume_tons)+'t'):'—';
      var flagImg = '<img class="country-flag-img" src="https://flagcdn.com/24x18/'+(c.code||'').toLowerCase()+'.png" onerror="this.style.display=\'none\'" alt="" style="margin-right:6px">';
      var rHead=document.createElement('tbody'); rHead.setAttribute('data-extra','1');
      var rTr=document.createElement('tr');
      rTr.style.cssText='cursor:pointer;background:var(--bg2);border-top:2px solid var(--border)';
      var ryi=c.year_imports||{};
      // Find earliest and latest years with data (min 2 years needed)
      var ryears=['2021','2022','2023','2024'];
      var ryWithData=ryears.filter(function(y){return Number(ryi[y]||0)>0;});
      var rcagr=null;
      if(ryWithData.length>=2){
        var ryFirst=ryWithData[0], ryLast=ryWithData[ryWithData.length-1];
        var rvFirst=Number(ryi[ryFirst]||0), rvLast=Number(ryi[ryLast]||0);
        var rySpan=Number(ryLast)-Number(ryFirst);
        rcagr=rySpan>0?(Math.pow(rvLast/rvFirst,1/rySpan)-1)*100:null;
      }
      var rcagrFmt=rcagr!==null?(rcagr>=0?'+':'')+rcagr.toFixed(1)+'%':'—';
      var rcagrColor=rcagr!==null?(rcagr>=0?'#059669':'#EF233C'):'var(--text3)';
      rTr.innerHTML='<td colspan="8" style="padding:.75rem 1rem"><div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:.8rem"><span class="r-arrow" style="color:#4361EE;font-size:.8rem;display:inline-block;transition:transform .2s">►</span>'+flagImg+'<b style="font-size:.92rem;color:var(--text)">'+escHtml(tc.label||c.name||'')+'</b></div><div style="display:flex;align-items:center"><b style="color:#4361EE;font-size:.88rem;min-width:8rem;text-align:right">'+escHtml(totalFmt)+'</b><span style="font-size:.78rem;font-weight:700;color:'+rcagrColor+';min-width:4.5rem;text-align:right">'+escHtml(rcagrFmt)+'</span><span style="color:var(--text3);font-size:.78rem;min-width:3.5rem;text-align:right">'+escHtml(vol)+'</span></div></div></td>';
      rHead.setAttribute('data-detail-country', c.code||'');
      rHead.appendChild(rTr);
      var rBody=document.createElement('tbody'); rBody.setAttribute('data-extra','1'); rBody.style.display='none';
      var byYear={};
      (c.products||[]).forEach(function(p){
        if(Number(p.partnerCode!==undefined?p.partnerCode:-1)===0) return;
        if(!p.value&&!p.weight) return;
        var yr=String(p.period||'');
        if(!byYear[yr]) byYear[yr]=[];
        byYear[yr].push(p);
      });
      Object.keys(byYear).sort(function(a,b){return Number(b)-Number(a);}).forEach(function(yr){
        var yRows=byYear[yr].sort(function(a,b){return (b.value||0)-(a.value||0);});
        var yTotal=yRows.reduce(function(s,r){return s+Number(r.value||0);},0);
        var yWgt=yRows.reduce(function(s,r){return s+Number(r.weight||r.quantity||0);},0);
        var yTotalFmt=yTotal>0?'$'+Number(yTotal.toFixed(0)).toLocaleString('en-US'):'—';
        var yWgtFmt=yWgt>999?Math.round(yWgt/1000)+'K t':Math.round(yWgt)+'t';
        var yTr=document.createElement('tr');
        yTr.style.cssText='cursor:pointer;background:rgba(67,97,238,.05)';
        yTr.innerHTML='<td colspan="8" style="padding:.55rem 1rem .55rem 2.5rem"><div style="display:flex;align-items:center;justify-content:space-between"><div style="display:flex;align-items:center;gap:.6rem"><span class="y-arrow" style="color:var(--text3);font-size:.65rem;display:inline-block;transition:transform .2s">►</span><b style="color:var(--text2);font-size:.82rem">'+escHtml(yr)+'</b><span style="font-size:.65rem;color:var(--text3)">'+yRows.length+' ta manba</span></div><div style="display:flex;gap:1.2rem"><b style="font-size:.78rem">'+escHtml(yTotalFmt)+'</b><span style="color:var(--text3);font-size:.72rem">'+escHtml(yWgtFmt)+'</span></div></div></td>';
        rBody.appendChild(yTr);
        var colTr=document.createElement('tr');
        colTr.style.cssText='display:none;background:rgba(67,97,238,.08);font-size:.65rem;color:var(--text3);font-weight:700';
        colTr.innerHTML='<th style="padding:.35rem .8rem .35rem 4rem">#</th><th style="padding:.35rem .8rem">Period</th><th style="padding:.35rem .8rem">Reporter</th><th style="padding:.35rem .8rem">Partner</th><th style="padding:.35rem .8rem">'+getImportAnalysisLabels().valueColumn+'</th><th style="padding:.35rem .8rem">Hajm (kg)</th><th style="padding:.35rem .8rem">Narx ($/kg)</th><th style="padding:.35rem .8rem">Amal</th>';
        rBody.appendChild(colTr);
        var dataRows=[colTr];
        yRows.forEach(function(row,ri){
          var rFmt=Number(row.value||0)>0?'$'+Number(Number(row.value||0).toFixed(3)).toLocaleString('en-US'):'—';
          var wFmt=Number(row.weight||0)>0?Number(row.weight||0).toLocaleString('en-US')+' kg':'—';
          var partner=row.partner||row.partnerDesc||'';
          // Unit price: value ($) / weight (kg)
          var unitPrice = (Number(row.value||0)>0 && Number(row.weight||0)>0)
            ? (Number(row.value||0) / Number(row.weight||0))
            : null;
          var priceFmt = unitPrice !== null
            ? '$' + (unitPrice >= 1 ? unitPrice.toFixed(2) : unitPrice.toFixed(4)) + '/kg'
            : '—';
          var dTr=document.createElement('tr');
          dTr.style.cssText='display:none;font-size:.8rem;border-top:1px solid rgba(67,97,238,.07)';
          dTr.innerHTML='<td style="padding:.5rem .8rem .5rem 4rem;color:var(--text3)">'+(ri+1)+'</td><td style="padding:.5rem .8rem;font-weight:700">'+escHtml(yr)+'</td><td style="padding:.5rem .8rem">'+escHtml(c.name||'')+'</td><td style="padding:.5rem .8rem;font-weight:600;color:var(--ta-brand)">'+escHtml(partner||'—')+'</td><td style="padding:.5rem .8rem;font-weight:700">'+escHtml(rFmt)+'</td><td style="padding:.5rem .8rem;color:var(--text2)">'+escHtml(wFmt)+'</td><td style="padding:.5rem .8rem;color:var(--ta-success-600);font-weight:600">'+escHtml(priceFmt)+'</td><td style="padding:.5rem .8rem"><button class="ta-btn ta-btn-primary ta-btn-sm" data-pid="'+escHtml(String(prod.id||''))+'" data-code="'+escHtml(String(c.code||''))+'">&#128269;</button></td>';
          dTr.querySelector('button').addEventListener('click',function(){goToFinder(this.dataset.pid,this.dataset.code);});
          dataRows.push(dTr);
          rBody.appendChild(dTr);
        });
        yTr.addEventListener('click',function(e){
          e.stopPropagation();
          var isOpen=colTr.style.display!=='none';
          dataRows.forEach(function(r){r.style.display=isOpen?'none':'';});
          var arrow=this.querySelector('.y-arrow');
          if(arrow) arrow.style.transform=isOpen?'':'rotate(90deg)';
        });
      });
      rTr.addEventListener('click',function(){
        var isOpen=rBody.style.display!=='none';
        rBody.style.display=isOpen?'none':'';
        var arrow=this.querySelector('.r-arrow');
        if(arrow) arrow.style.transform=isOpen?'':'rotate(90deg)';
      });
      tableEl.appendChild(rHead);
      tableEl.appendChild(rBody);
    });
    return;
  }

  // Fallback: yillar bo'yicha summary
  theadEl.innerHTML='<tr><th>#</th><th>Davlat</th><th>Jami</th><th>2021</th><th>2022</th><th>2023</th><th>2024</th><th>Hajm</th><th>Amal</th></tr>';
  tb.innerHTML='';
  countries.forEach(function(c,i){
    var tc=getTargetMeta(c);
    var yi=c.year_imports||{}, ys=c.year_statuses||{};
    function fmtY(y){
      var st=ys[y]||c.status||'no_data',val=Number(yi[y]||0);
      if(st==='ok'&&val>0) return '<b>'+investAiFmtShortUsd(val)+'</b>';
      if(st==='rate_limited') return '<span style="color:#d97706;font-size:.65rem">limit</span>';
      if(st==='error') return '<span style="color:#EF233C;font-size:.65rem">xato</span>';
      return '<span style="color:var(--text3)">—</span>';
    }
    var total=c.status==='ok'?investAiFmtUsd(c.import_usd||0):'—';
    var vol=c.volume_tons>0?(c.volume_tons>999?Math.round(c.volume_tons/1000)+'K t':Math.round(c.volume_tons)+'t'):'—';
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+(i+1)+'</td><td style="font-weight:600"><img class="country-flag-img" src="https://flagcdn.com/24x18/'+(c.code||'').toLowerCase()+'.png" onerror="this.style.display=\'none\'" alt=""> '+escHtml(tc.label||c.name||'')+'</td><td style="font-weight:800;color:var(--ta-brand)">'+total+'</td><td>'+fmtY('2021')+'</td><td>'+fmtY('2022')+'</td><td>'+fmtY('2023')+'</td><td>'+fmtY('2024')+'</td><td>'+escHtml(vol)+'</td><td><button class="ta-btn ta-btn-primary ta-btn-sm" data-pid="'+escHtml(String(prod.id||''))+'" data-code="'+escHtml(String(c.code||''))+'">&#128269;</button></td>';
    tr.querySelector('button').addEventListener('click',function(){goToFinder(this.dataset.pid,this.dataset.code);});
    tb.appendChild(tr);
  });
}

function countryHasImportDisplayData(country){
  if(!country) return false;
  if((Number(country.import_usd || 0) || 0) > 0) return true;
  var years = country.year_imports || {};
  var rows = Array.isArray(country.products) ? country.products : [];
  if(rows.some(function(row){
    return (Number(row.value || 0) || 0) > 0 || (Number(row.weight || row.quantity || 0) || 0) > 0;
  })) return true;
  return ['2021','2022','2023','2024'].some(function(y){
    if((Number(years[y] || 0) || 0) > 0) return true;
    return rows.some(function(row){
      return String(row.period || '') === y && (Number(row.value || 0) || 0) > 0;
    });
  });
}

function renderImportResults(countries, prod, source, targetCountries){
  targetCountries = (targetCountries && targetCountries.length) ? targetCountries : getImportAnalysisTargetCountries();
  initImportAnalysisComtradeOnly(targetCountries, getImportAnalysisSourceKey(source));
  var labels = getImportAnalysisLabels();
  var detailTitleEl = document.getElementById('import-detail-title');
  if(detailTitleEl){
    detailTitleEl.textContent = getImportAnalysisFinderMode() === 'importers'
      ? "Batafsil eksport ma'lumotlari"
      : "Batafsil import ma'lumotlari";
  }
  countries = Array.isArray(countries) ? countries.slice() : [];
  countries.sort(function(a,b){return (b.import_usd||0)-(a.import_usd||0);});
  if(!countries.length){
    clearImportDetailBody('Tanlangan davlatar bo\'yicha 2021–2024 import ma\'lumotlari topilmadi');
    // Bar chart empty state removed (chart hidden)
    document.getElementById('imp-k1').textContent = '$0';
    document.getElementById('imp-k2').textContent = '—';
    document.getElementById('imp-k3').textContent = '—';
    document.getElementById('imp-k4').textContent = source || '—';
    return;
  }
  var targetMetaByName = {};
  var targetMetaByCode = {};
  targetCountries.forEach(function(country){
    var name = typeof country === 'string' ? country : String(country && (country.name || country.label || '') || '');
    var label = typeof country === 'string' ? getFinderCountryLabel(country) : (country.label || country.name || '');
    var flag = typeof country === 'string' ? getFinderCountryFlag(country) : (country.flag || '');
    if(name){
      targetMetaByName[String(name).toLowerCase()] = {label:label || name, flag:flag || ''};
      targetMetaByCode[String(name).toUpperCase()] = {label:label || name, flag:flag || ''};
    }
  });

  function getTargetMeta(country){
    var byName = targetMetaByName[String(country && country.name || '').toLowerCase()];
    if(byName) return byName;
    var byCode = targetMetaByCode[String(country && country.code || '').toUpperCase()];
    if(byCode) return byCode;
    return {label:(country && country.name) || '—', flag:(country && country.flag) || ''};
  }

  var okCountries = countries.filter(function(c){ return c.status === 'ok'; });
  var total = okCountries.reduce(function(s,c){return s+(c.import_usd||0);},0);
  var biggest = okCountries.slice().sort(function(a, b){
    return (b.import_usd || 0) - (a.import_usd || 0);
  })[0] || {};
  var exporterTotals = {};
  okCountries.forEach(function(country){
    var rows = Array.isArray(country.products) ? country.products : [];
    rows.forEach(function(row){
      if(isImportWorldRow(row)) return;
      var exporterName = String(row && (row.partner || row.partnerDesc || '') || '').trim();
      var exporterValue = Number(row && row.value || 0) || 0;
      if(!exporterName || !(exporterValue > 0)) return;
      if(!exporterTotals[exporterName]){
        exporterTotals[exporterName] = {
          name: exporterName,
          value: 0,
          flag: getFinderCountryFlag(exporterName) || '',
          label: getFinderCountryLabel(exporterName) || exporterName
        };
      }
      exporterTotals[exporterName].value += exporterValue;
    });
  });
  var topPartner = Object.keys(exporterTotals).map(function(name){
    return exporterTotals[name];
  }).sort(function(a, b){
    return (b.value || 0) - (a.value || 0);
  })[0] || null;
  var topPartnerShare = total > 0 && topPartner && topPartner.value ? Math.round((topPartner.value / total) * 100) : 0;
  var topReporter = biggest;
  var topReporterShare = total > 0 && topReporter.import_usd ? Math.round((topReporter.import_usd / total) * 100) : 0;
  var isImporterMode = getImportAnalysisFinderMode() === 'importers';
  var topExporterCard = isImporterMode ? topReporter : topPartner;
  var topExporterCardShare = isImporterMode ? topReporterShare : topPartnerShare;
  var topImporterCard = isImporterMode ? topPartner : topReporter;
  var topImporterCardShare = isImporterMode ? topPartnerShare : topReporterShare;
  var topExporter = topExporterCard || topReporter || topPartner || {};
  var topImporter = topImporterCard || topPartner || topReporter || {};
  var topImporterShare = topImporterCardShare || topPartnerShare || topReporterShare || 0;
  var singleCountry = okCountries.length === 1;
  var compactChartAmounts = countries.length > 3;
  var k1Label = document.getElementById('imp-k1-label');
  var k2Label = document.getElementById('imp-k2-label');
  var k3Label = document.getElementById('imp-k3-label');

  if(k1Label) k1Label.textContent = labels.totalKpi;
  if(k2Label) k2Label.textContent = labels.biggestKpi;
  if(k3Label) k3Label.textContent = singleCountry
    ? (getImportAnalysisFinderMode() === 'importers' ? '2024 eksport' : '2024 import')
    : 'Top importyor';

  document.getElementById('imp-k1').textContent = investAiFmtUsd(total);
  document.getElementById('imp-k2').textContent = topExporterCard
    ? ((topExporter.flag || '') + ' ' + (topExporter.label || topExporter.name || '—')).trim()
    : ((biggest.flag||'')+' '+(biggest.name||'—'));
  if(topExporterCard){
    document.getElementById('imp-k2').textContent = ((topExporterCard.flag || '') + ' ' + (topExporterCard.label || topExporterCard.name || '—')).trim();
  }
  document.getElementById('imp-k3').textContent = singleCountry
    ? investAiFmtUsd(Number((((topImporter.year_imports || {})['2024']) || ((topImporter.year_imports || {})['2023']) || topImporter.import_usd || 0)))
    : (topImporter.name ? ((topImporter.flag||'')+' '+topImporter.name+' • '+topImporterShare+'%') : '—');
  if(!singleCountry && topImporterCard && topImporterCard.name){
    document.getElementById('imp-k3').textContent = (((topImporterCard.flag||'')+' '+topImporterCard.name+' • '+topImporterCardShare+'%')).trim();
  }
  document.getElementById('imp-k4').textContent = source;
  // Final KPI normalization: green card always shows the leading exporter,
  // yellow card shows the leading importer/counterparty for the current mode.
  if(k2Label) k2Label.textContent = 'Top eksportyor';
  if(k3Label) k3Label.textContent = singleCountry
    ? (isImporterMode ? '2024 import' : '2024 eksport')
    : 'Top importyor';
  document.getElementById('imp-k2').textContent = topExporterCard
    ? ((topExporterCard.flag || '') + ' ' + (topExporterCard.label || topExporterCard.name || 'вЂ"')).trim()
    : ((topReporter.flag||'')+' '+(topReporter.name||'вЂ"'));
  document.getElementById('imp-k3').textContent = singleCountry
    ? investAiFmtUsd(Number(((((topImporterCard && topImporterCard.year_imports) || {})['2024']) || (((topImporterCard && topImporterCard.year_imports) || {})['2023']) || (topImporterCard && (topImporterCard.import_usd || topImporterCard.value)) || 0)))
    : (topImporterCard && topImporterCard.name ? (((topImporterCard.flag||'')+' '+topImporterCard.name+' вЂў '+topImporterCardShare+'%')).trim() : 'вЂ"');

  var impK2El = document.getElementById('imp-k2');
  var impK3El = document.getElementById('imp-k3');
  if(impK2El) impK2El.textContent = sanitizeUiMojibake(impK2El.textContent);
  if(impK3El) impK3El.textContent = sanitizeUiMojibake(impK3El.textContent);

  // Bar chart removed — data shown in country table below map instead

  if(String(source || '').toLowerCase().indexOf('wits') !== -1){
    renderWitsImportDetailTable(countries, getTargetMeta);
  } else {
    renderDefaultImportDetailTable(countries, prod, getTargetMeta);
  }


  // === TailAdmin-style jsvectormap + country flag list ===
  var demoCard = document.getElementById('importDemographicCard');
  var mapEl = document.getElementById('importJvMap');
  var countryListEl = document.getElementById('importCountryList');
  if(demoCard && mapEl && countryListEl && okCountries.length > 0){
    demoCard.style.display = '';
    var countryCoords = {
      UZ:[41.3,69.3], RU:[61.5,105], KZ:[48.0,68.0], KG:[41.2,74.8],
      TJ:[38.9,71.3], TM:[38.9,59.6], AZ:[40.1,47.6], GE:[42.3,43.4],
      AM:[40.0,45.0], AF:[33.9,67.7], IR:[32.4,53.7], PK:[30.4,69.3],
      MN:[46.9,103.8], CN:[35.9,104.2], TR:[38.9,35.2], IN:[20.6,79.0],
      UA:[48.4,31.2], BY:[53.7,27.9], DE:[51.2,10.5], PL:[51.9,19.1]
    };
    var markers = [];
    var regionColors = {};
    okCountries.forEach(function(c){
      var tc = getTargetMeta(c);
      var coords = countryCoords[c.code];
      if(coords) markers.push({name: (tc.label||c.name||'')+' — '+investAiFmtUsd(c.import_usd||0), coords: coords});
      regionColors[c.code] = 0;
    });
    mapEl.innerHTML = '';
    if(window._importJvMapInstance){
      try{ window._importJvMapInstance.destroy(); }catch(e){}
      window._importJvMapInstance = null;
    }
    try{
      window._importJvMapInstance = new jsVectorMap({
        selector: '#importJvMap',
        map: 'world',
        zoomButtons: false,
        zoomOnScroll: false,
        regionStyle: {
          initial: { fill: '#D1D5DB', 'fill-opacity': 1, stroke: '#fff', 'stroke-width': 0.5 },
          hover: { 'fill-opacity': 0.8, fill: '#465fff' }
        },
        series: { regions: [{ attribute: 'fill', scale: ['#465fff'], values: regionColors }] },
        markers: markers,
        markerStyle: {
          initial: { fill: '#465fff', stroke: '#fff', 'stroke-width': 1, r: 5 },
          hover: { fill: '#3b4fd9', r: 7 }
        },
        showTooltip: true
      });
    }catch(e){ console.warn('jsvectormap error:', e); }

    // Country table (like screenshot 2 — Davlat, Jami import, Ulush, 2021-2024, Trend) — expandable rows
    var tHtml = '<table class="ta-table" style="width:100%;font-size:.78rem">';
    tHtml += '<thead><tr><th style="min-width:140px">Davlat</th><th>Jami import</th><th style="min-width:110px">Ulush</th><th>2021</th><th>2022</th><th>2023</th><th>2024</th><th>Trend</th></tr></thead><tbody>';
    countries.forEach(function(c, idx){
      var tc = getTargetMeta(c);
      var pct = total > 0 ? Math.round((c.import_usd||0)/total*100) : 0;
      var code2 = (c.code||'').toLowerCase();
      var flagSrc = 'https://flagcdn.com/w40/'+code2+'.png';
      var yi = c.year_imports || {};
      var ys = c.year_statuses || {};
      function fmtY(y){
        var st = ys[y] || (c.status || 'no_data');
        var val = Number(yi[y] || 0);
        if(st==='ok' && val>0) return '<b>'+investAiFmtShortUsd(val)+'</b>';
        if(st==='rate_limited') return '<span style="color:#d97706;font-size:.65rem">limit</span>';
        if(st==='error') return '<span style="color:#EF233C;font-size:.65rem">xato</span>';
        return '<span style="color:var(--ta-gray-400)">—</span>';
      }
      var totalFmt = c.status === 'ok' ? investAiFmtShortUsd(c.import_usd||0) : (c.status==='no_data'?'yo\'q':'xato');
      var totalStyle = c.status === 'ok' ? 'font-weight:700;color:var(--ta-brand)' : 'color:var(--ta-gray-400)';
      // CAGR trend
      var ryears = ['2021','2022','2023','2024'];
      var ryWithData = ryears.filter(function(y){ return Number(yi[y]||0) > 0; });
      var cagr = null;
      if(ryWithData.length >= 2){
        var first = ryWithData[0], last = ryWithData[ryWithData.length-1];
        var vFirst = Number(yi[first]||0), vLast = Number(yi[last]||0);
        var span = Number(last) - Number(first);
        if(span > 0 && vFirst > 0) cagr = (Math.pow(vLast/vFirst, 1/span) - 1) * 100;
      }
      var trendFmt = cagr !== null ? ((cagr>=0?'+':'')+cagr.toFixed(1)+'%') : '—';
      var trendColor = cagr !== null ? (cagr >= 0 ? 'var(--ta-success-600)' : 'var(--ta-error-600)') : 'var(--ta-gray-400)';
      var rowId2 = 'impDemoRow2_'+idx;
      var detailId2 = 'impDemoDetail2_'+idx;
      tHtml += '<tr id="'+rowId2+'" style="cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'var(--ta-gray-50)\'" onmouseout="var d=document.getElementById(\''+detailId2+'\');if(d&&d.style.display===\'none\')this.style.background=\'\'">' +
        '<td><div style="display:flex;align-items:center;gap:.5rem"><img class="country-flag-round" src="'+flagSrc+'" onerror="this.style.display=\'none\'" alt="" style="width:28px;height:28px"> <span style="font-weight:600">'+(tc.label||c.name||'—')+'</span></div></td>' +
        '<td style="'+totalStyle+'">'+totalFmt+'</td>' +
        '<td><div style="display:flex;align-items:center;gap:.5rem"><div style="flex:1;height:5px;border-radius:3px;background:var(--ta-gray-200);min-width:50px;overflow:hidden"><div style="height:100%;border-radius:3px;background:var(--ta-brand);width:'+pct+'%;transition:width .6s"></div></div><span style="font-size:.72rem;font-weight:500;min-width:28px;text-align:right">'+pct+'%</span></div></td>' +
        '<td>'+fmtY('2021')+'</td>' +
        '<td>'+fmtY('2022')+'</td>' +
        '<td>'+fmtY('2023')+'</td>' +
        '<td>'+fmtY('2024')+'</td>' +
        '<td style="font-weight:600;color:'+trendColor+'">'+trendFmt+'</td>' +
      '</tr>';
      // Inline detail row — full accordion with year > partner breakdown
      var detH = '<tr id="'+detailId2+'" style="display:none"><td colspan="8" style="padding:0;border-bottom:2px solid var(--ta-gray-200)">';
      detH += '<div style="padding:0">';
      // Build year accordion from c.products
      var dProducts = Array.isArray(c.products) ? c.products : [];
      var dByYear = {};
      dProducts.forEach(function(p){
        if(Number(p.partnerCode!==undefined?p.partnerCode:-1)===0) return;
        if(!p.value&&!p.weight) return;
        var yr = String(p.period||'');
        if(!dByYear[yr]) dByYear[yr]=[];
        dByYear[yr].push(p);
      });
      var dYearKeys = Object.keys(dByYear).sort(function(a,b){return Number(b)-Number(a);});
      if(dYearKeys.length > 0){
        dYearKeys.forEach(function(yr, yIdx){
          var yRows = dByYear[yr].sort(function(a,b){return (b.value||0)-(a.value||0);});
          var yTotal = yRows.reduce(function(s,r){return s+Number(r.value||0);},0);
          var yWgt = yRows.reduce(function(s,r){return s+Number(r.weight||r.quantity||0);},0);
          var yTotalFmt = yTotal>0?'$'+Number(yTotal.toFixed(0)).toLocaleString('en-US'):'—';
          var yWgtFmt = yWgt>999?Math.round(yWgt/1000)+'K t':Math.round(yWgt)+'t';
          var yDetailId = detailId2+'_y'+yr;
          detH += '<div style="border-top:1px solid var(--ta-gray-200)">';
          detH += '<div class="imp-yr-hdr" data-target="'+yDetailId+'" style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;cursor:pointer;background:'+(yIdx===0?'rgba(67,97,238,.05)':'var(--ta-gray-50)')+';transition:background .15s">';
          detH += '<div style="display:flex;align-items:center;gap:6px"><span class="imp-yr-arrow" style="color:#4361EE;display:inline-flex;align-items:center;transition:transform .2s"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></span><b style="color:var(--ta-gray-800);font-size:.75rem">'+yr+'</b><span style="font-size:.6rem;color:var(--ta-gray-400)">'+yRows.length+' ta manba</span></div>';
          detH += '<div style="display:flex;gap:1.2rem;align-items:center"><b style="font-size:.8rem;color:var(--ta-brand)">'+yTotalFmt+'</b><span style="color:var(--ta-gray-400);font-size:.72rem">'+yWgtFmt+'</span></div>';
          detH += '</div>';
          // Year detail table (hidden)
          detH += '<div id="'+yDetailId+'" style="display:none;overflow-x:auto">';
          detH += '<table style="width:100%;font-size:.75rem;border-collapse:collapse">';
          detH += '<thead><tr style="background:rgba(67,97,238,.08);font-size:.65rem;color:var(--ta-gray-500);font-weight:700"><th style="padding:6px 10px">#</th><th style="padding:6px 10px">Period</th><th style="padding:6px 10px">Reporter</th><th style="padding:6px 10px">Partner</th><th style="padding:6px 10px">Import ($)</th><th style="padding:6px 10px">Hajm (kg)</th><th style="padding:6px 10px">Narx ($/kg)</th></tr></thead><tbody>';
          yRows.forEach(function(row,ri){
            var rVal = Number(row.value||0);
            var rWgt = Number(row.weight||0);
            var rFmt = rVal>0?'$'+Number(rVal.toFixed(3)).toLocaleString('en-US'):'—';
            var wFmt = rWgt>0?Number(rWgt).toLocaleString('en-US')+' kg':'—';
            var unitP = (rVal>0&&rWgt>0)?(rVal/rWgt):null;
            var pFmt = unitP!==null?'$'+(unitP>=1?unitP.toFixed(4):unitP.toFixed(4))+'/kg':'—';
            var partner = row.partner||row.partnerDesc||'—';
            var reporter = row.reporter||(tc.label||c.name||'—');
            detH += '<tr style="border-top:1px solid rgba(67,97,238,.07)"><td style="padding:6px 10px;color:var(--ta-gray-400)">'+(ri+1)+'</td><td style="padding:6px 10px;font-weight:700">'+yr+'</td><td style="padding:6px 10px">'+reporter+'</td><td style="padding:6px 10px;font-weight:600;color:var(--ta-brand)">'+partner+'</td><td style="padding:6px 10px;font-weight:700">'+rFmt+'</td><td style="padding:6px 10px;color:var(--ta-gray-600)">'+wFmt+'</td><td style="padding:6px 10px;color:var(--ta-success-600);font-weight:600">'+pFmt+'</td></tr>';
          });
          detH += '</tbody></table></div></div>';
        });
      } else {
        // No products data — show simple year summary
        detH += '<div style="padding:12px 16px">';
        ryears.forEach(function(yr){
          var val = Number(yi[yr]||0);
          detH += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--ta-gray-100);font-size:.78rem"><span style="font-weight:500">'+yr+'</span><b style="color:var(--ta-brand)">'+(val>0?investAiFmtShortUsd(val):'—')+'</b></div>';
        });
        detH += '</div>';
      }
      detH += '</div></td></tr>';
      tHtml += detH;
    });
    tHtml += '</tbody></table>';
    countryListEl.innerHTML = tHtml;
    // Attach click: inline expand detail below each row
    countryListEl.querySelectorAll('tr[id^="impDemoRow2_"]').forEach(function(row){
      row.addEventListener('click', function(){
        var detId = this.id.replace('impDemoRow2_','impDemoDetail2_');
        var det = document.getElementById(detId);
        if(!det) return;
        var isOpen = det.style.display !== 'none';
        det.style.display = isOpen ? 'none' : 'table-row';
        this.style.background = isOpen ? '' : 'var(--ta-gray-50)';
      });
    });
    // Year accordion toggle inside detail rows
    countryListEl.querySelectorAll('.imp-yr-hdr').forEach(function(hdr){
      hdr.addEventListener('click', function(e){
        e.stopPropagation();
        var targetId = this.getAttribute('data-target');
        var panel = document.getElementById(targetId);
        if(!panel) return;
        var isOpen = panel.style.display !== 'none';
        panel.style.display = isOpen ? 'none' : 'block';
        var arrow = this.querySelector('.imp-yr-arrow');
        if(arrow) arrow.style.transform = isOpen ? '' : 'rotate(90deg)';
      });
    });
  }
}

initImportAnalysisComtradeOnly();

function showTransportTab(tab){
  ['rail','truck','air','widget'].forEach(function(t){
    var panel = document.getElementById('trPanel-'+t);
    var tabEl = document.getElementById('trTab-'+t);
    if(panel) panel.style.display = t===tab ? 'block' : 'none';
    if(tabEl){
      tabEl.style.borderBottom = t===tab ? '2px solid #4361EE' : '2px solid transparent';
      tabEl.style.background = t===tab ? 'rgba(67,97,238,.08)' : 'transparent';
    }
  });
}

/* ═══ TRANSPORT SOLISHTIRMA KALKULYATOR ═══ */
var NAVOI_ROUTES = {
  tashkent: {name:'Toshkent',km:480,price:500,days:1,mode:'Temir yo\'l'},
  almaty: {name:'Olma-ota',km:1200,price:1200,days:2,mode:'Avto'},
  bishkek: {name:'Bishkek',km:1400,price:1400,days:3,mode:'Avto'},
  dushanbe: {name:'Dushanbe',km:600,price:800,days:2,mode:'Avto'},
  kabul: {name:'Kobul',km:900,price:1100,days:3,mode:'Avto'},
  navoi: {name:'Navoiy',km:0,price:0,days:0,mode:'Mahalliy'}
};

function calculateFreightCompare(){
  var intlPrice = parseInt(document.getElementById('tr-intl-price').value) || 5500;
  var toKey = document.getElementById('tr-to').value;
  var annual = parseInt(document.getElementById('tr-annual').value) || 100;
  var route = NAVOI_ROUTES[toKey] || NAVOI_ROUTES.tashkent;
  var navPrice = route.price;
  var saving = intlPrice - navPrice;
  var savingPct = intlPrice > 0 ? Math.round(saving / intlPrice * 100) : 0;
  var annualSaving = saving * annual;

  document.getElementById('freightResult').style.display = 'block';

  document.getElementById('freightCards').innerHTML =
    '<div style="padding:1rem;background:var(--bg2);border-radius:10px;text-align:center"><div style="font-size:1.3rem">🌍</div><div style="font-size:.6rem;color:var(--text3)">Xorijdan → '+route.name+'</div><div style="font-size:1.2rem;font-weight:800;color:#EF233C">$'+intlPrice.toLocaleString()+'</div><div style="font-size:.55rem;color:var(--text3)">SeaRates narxi</div></div>'+
    '<div style="padding:1rem;background:var(--bg2);border-radius:10px;text-align:center"><div style="font-size:1.3rem">🇺🇿</div><div style="font-size:.6rem;color:var(--text3)">Navoiy → '+route.name+'</div><div style="font-size:1.2rem;font-weight:800;color:#059669">$'+navPrice.toLocaleString()+'</div><div style="font-size:.55rem;color:var(--text3)">'+route.mode+' | ~'+route.days+' kun</div></div>'+
    '<div style="padding:1rem;background:linear-gradient(135deg,rgba(5,150,105,.1),rgba(6,214,160,.1));border-radius:10px;text-align:center;border:1px solid rgba(5,150,105,.3)"><div style="font-size:1.3rem">💰</div><div style="font-size:.6rem;color:var(--text3)">Tejamkorlik</div><div style="font-size:1.2rem;font-weight:800;color:#059669">$'+saving.toLocaleString()+'</div><div style="font-size:.55rem;color:#059669;font-weight:700">-'+savingPct+'% / konteyner</div></div>';

  var maxP = Math.max(intlPrice, navPrice, 1);
  document.getElementById('freightCompare').innerHTML =
    '<div style="font-size:.75rem;font-weight:700;margin-bottom:.8rem">📊 Konteyner narxi solishtirma</div>'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:120px;font-size:.68rem;text-align:right">🌍 Xorijdan</div><div style="flex:1;height:24px;background:var(--border);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+Math.round(intlPrice/maxP*100)+'%;background:linear-gradient(90deg,#EF233C,#FF006E);border-radius:4px;display:flex;align-items:center;padding-left:8px;font-size:.6rem;color:#fff;font-weight:700">$'+intlPrice.toLocaleString()+'</div></div></div>'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><div style="width:120px;font-size:.68rem;text-align:right">🇺🇿 Navoiydan</div><div style="flex:1;height:24px;background:var(--border);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+Math.round(navPrice/maxP*100)+'%;background:linear-gradient(90deg,#059669,#06D6A0);border-radius:4px;display:flex;align-items:center;padding-left:8px;font-size:.6rem;color:#fff;font-weight:700">$'+navPrice.toLocaleString()+'</div></div></div>'+
    '<div style="margin-top:.8rem;padding:.7rem;background:rgba(5,150,105,.08);border-radius:8px;font-size:.72rem;color:#059669">'+
    '<b>💡 Xulosa:</b> Navoiyda ishlab chiqarib '+route.name+'ga yetkazish <b>$'+saving.toLocaleString()+' ('+savingPct+'%)</b> arzon.<br>'+
    'Yiliga <b>'+annual+'</b> konteyner = <b>$'+(annualSaving/1000).toFixed(0)+'K</b> tejamkorlik.'+
    (annualSaving > 1000000 ? '<br>🏆 <b>$'+(annualSaving/1e6).toFixed(1)+'M</b> yillik iqtisod!' : '')+
    '</div>';
}

function goToFinder(prodId, countryCode){
  showPage('finder');
  var sel = document.getElementById('finder-product-select');
  if(sel) sel.value = prodId;
  // Custom dropdown display yangilash
  var prod = (DB.products||[]).find(function(p){return p.id==prodId;});
  if(prod){
    var display = document.getElementById('finder-select-display');
    if(display) display.textContent = formatBilingualProductName(prod) + (prod.hs_code?' ('+prod.hs_code+')':'');
  }
  if(typeof handleImportProductChange === 'function') handleImportProductChange();
}

/* ═══════════════════════════════════════
   AI INVEST ANALYZER
═══════════════════════════════════════ */
var AI_TRADE_ANALYZER_API_BASE = 'https://navoiy-api-proxy.vercel.app/api';
var INVEST_AI_HISTORY_KEY = '_invest_ai_history_v1';
var _investAiBusy = false;
var _investAiPhase = -1;
var _investAiMarkdown = '';
var _investAiCurrentMaterial = '';
var _investAiDirectRawId = '';
var _investAiTradeContext = null;
var INVEST_AI_FALLBACK_MATERIALS = [
  'Basalt','Quartz','Limestone','Gypsum','Granite','Marble','Kaolin','Bentonite','Dolomite','Phosphorite',
  'Silica Sand','Feldspar','Barite','Calcite','Fluorite','Clay','Copper Ore','Lead Ore','Zinc Ore','Iron Ore',
  'Manganese','Talc','Graphite','Sulfur','Salt','Potash','Uranium','Coal','Alumina','Chromite'
];
var INVEST_AI_PHASES = [
  { key:'phase0', title:'Product Research & HS Code Mapping' },
  { key:'phase1', title:'UN Comtrade Data Collection' },
  { key:'phase2', title:'Data Processing & Analysis' },
  { key:'phase3', title:'Report Generation' }
];
var INVEST_AI_I18N = {
  uz: {
    nav:'AI Invest Tahlil',
    pageTitle:'🧠 AI Investitsiya Tahlili',
    pageSub:'Navoiy viloyati uchun xomashyo bo\'yicha AI-powered trade analysis va investitsiya tavsiyasi',
    inputLabel:'Xomashyo nomini kiriting',
    placeholder:'Basalt, Quartz, Limestone, Gypsum...',
    analyze:'🔎 Tahlil qilish',
    analyzing:'⏳ Tahlil qilinmoqda...',
    progressTitle:'⏳ Tahlil bosqichlari',
    running:'AI tahlil ishlayapti...',
    reportTitle:'📄 AI hisoboti',
    historyTitle:'🕘 So\'nggi 5 tahlil',
    historyEmpty:'Hali tahlillar saqlanmagan',
    excelTitle:'📘 To\'liq Excel workbook mavjud',
    excelBody:'9 ta analitik sheetdan iborat to\'liq Excel workbook tayyor bo\'ladi. To\'liq hisobotni olish uchun Investitsiya boshqarmasi bilan bog\'laning.',
    exportBtn:'📥 Excel yuklab olish',
    statusPending:'Kutilmoqda',
    statusActive:'Jarayonda',
    statusDone:'Tayyor',
    emptyHeadline:'Natija mavjud emas',
    outputMeta:'Material: {material} · {time}',
    toastPick:'⚠️ Xomashyo nomini kiriting',
    toastStream:'🤖 AI tahlil boshlanmoqda...',
    toastReady:'✅ Tahlil tayyor!',
    toastHistory:'📂 Saqlangan tahlil yuklandi',
    outputEmpty:'✅ Tahlil qilindi',
    noSystemPrompt:'Anthropic system prompt env sozlanmagan',
    phase0:'Mahsulot va HS mapping',
    phase1:'UN Comtrade yig\'ish',
    phase2:'Qayta ishlash va tahlil',
    phase3:'Hisobot yaratish'
  },
  ru: {
    nav:'AI Инвест Анализ',
    pageTitle:'🧠 AI Анализ Инвестиций',
    pageSub:'AI trade analysis и инвестиционные рекомендации по сырью для Навоийского региона',
    inputLabel:'Введите название сырья',
    placeholder:'Basalt, Quartz, Limestone, Gypsum...',
    analyze:'🔎 Анализировать',
    analyzing:'⏳ Идёт анализ...',
    progressTitle:'⏳ Этапы анализа',
    running:'AI выполняет анализ...',
    reportTitle:'📄 AI отчёт',
    historyTitle:'🕘 Последние 5 анализов',
    historyEmpty:'История анализов пока пуста',
    excelTitle:'📘 Полная Excel-книга доступна',
    excelBody:'Полная Excel-книга с 9 аналитическими листами доступна. Свяжитесь с Департаментом инвестиций, чтобы получить полный отчёт.',
    exportBtn:'📥 Скачать Excel',
    statusPending:'Ожидание',
    statusActive:'В процессе',
    statusDone:'Готово',
    emptyHeadline:'Нет итоговой строки',
    outputMeta:'Материал: {material} · {time}',
    toastPick:'⚠️ Введите название сырья',
    toastStream:'🤖 Запуск AI-анализа...',
    toastReady:'✅ Анализ готов!',
    toastHistory:'📂 Сохранённый анализ загружен',
    outputEmpty:'✅ Анализ выполнен',
    noSystemPrompt:'Anthropic system prompt не настроен в env',
    phase0:'Исследование продукта и HS-код',
    phase1:'Сбор UN Comtrade',
    phase2:'Обработка и анализ',
    phase3:'Генерация отчёта'
  },
  en: {
    nav:'AI Invest Analysis',
    pageTitle:'🧠 AI Investment Analysis',
    pageSub:'AI-powered trade analysis and investment recommendations for raw materials in Navoi Region',
    inputLabel:'Enter raw material name',
    placeholder:'Basalt, Quartz, Limestone, Gypsum...',
    analyze:'🔎 Analyze',
    analyzing:'⏳ Analyzing...',
    progressTitle:'⏳ Analysis phases',
    running:'AI analysis is running...',
    reportTitle:'📄 AI report',
    historyTitle:'🕘 Last 5 analyses',
    historyEmpty:'No analyses saved yet',
    excelTitle:'📘 Full Excel workbook is available',
    excelBody:'A full Excel workbook with 9 analytical sheets is available. Contact the Investment Department to receive the complete report.',
    exportBtn:'📥 Download Excel',
    statusPending:'Pending',
    statusActive:'Running',
    statusDone:'Done',
    emptyHeadline:'No headline available',
    outputMeta:'Material: {material} · {time}',
    toastPick:'⚠️ Enter a raw material name',
    toastStream:'🤖 Starting AI analysis...',
    toastReady:'✅ Analysis complete!',
    toastHistory:'📂 Saved analysis loaded',
    outputEmpty:'✅ Analysis complete',
    noSystemPrompt:'Anthropic system prompt env is not configured',
    phase0:'Product research & HS mapping',
    phase1:'UN Comtrade collection',
    phase2:'Processing & analysis',
    phase3:'Report generation'
  }
};

function investAiT(key){
  var dict = INVEST_AI_I18N[currentLang] || INVEST_AI_I18N.uz;
  return dict[key] || (INVEST_AI_I18N.uz[key] || key);
}

function getInvestAiMaterials(){
  var materials = [];
  (DB.rawMaterials||[]).forEach(function(item){
    var name = String((item && (item.name_en || item.name_uz || item.name)) || '').trim();
    if(name && materials.indexOf(name) === -1) materials.push(name);
  });
  INVEST_AI_FALLBACK_MATERIALS.forEach(function(name){
    if(materials.length >= 30) return;
    if(materials.indexOf(name) === -1) materials.push(name);
  });
  return materials.slice(0, 30);
}

function updateInvestAiI18n(){
  var nav = document.getElementById('materialAiNavLabel');
  if(nav) nav.textContent = investAiT('nav');
  var pageTitle = document.getElementById('materialAiPageTitle');
  if(pageTitle) pageTitle.textContent = investAiT('pageTitle');
  var pageSub = document.getElementById('materialAiPageSub');
  if(pageSub) pageSub.textContent = investAiT('pageSub');
  var inputLabel = document.getElementById('materialAiInputLabel');
  if(inputLabel) inputLabel.textContent = investAiT('inputLabel');
  var input = document.getElementById('materialAiInput');
  if(input) input.placeholder = investAiT('placeholder');
  var btn = document.getElementById('materialAiAnalyzeBtn');
  if(btn) btn.textContent = _investAiBusy ? investAiT('analyzing') : investAiT('analyze');
  var progressTitle = document.getElementById('materialAiProgressTitle');
  if(progressTitle) progressTitle.textContent = investAiT('progressTitle');
  var running = document.getElementById('materialAiRunningLabel');
  if(running) running.textContent = investAiT('running');
  var outputTitle = document.getElementById('materialAiOutputTitle');
  if(outputTitle) outputTitle.textContent = investAiT('reportTitle');
  var historyTitle = document.getElementById('materialAiHistoryTitle');
  if(historyTitle) historyTitle.textContent = investAiT('historyTitle');
  var excelTitle = document.getElementById('materialAiExcelTitle');
  if(excelTitle) excelTitle.textContent = investAiT('excelTitle');
  var excelBody = document.getElementById('materialAiExcelBody');
  if(excelBody) excelBody.textContent = investAiT('excelBody');
  var exportBtn = document.getElementById('materialAiExportBtn');
  if(exportBtn) exportBtn.textContent = investAiT('exportBtn');
}

function renderInvestAiChips(){
  var wrap = document.getElementById('materialAiChips');
  if(!wrap) return;
  wrap.innerHTML = getInvestAiMaterials().map(function(name){
    return '<button type="button" class="anx-chip" onclick="fillInvestAiMaterial(\''+String(name).replace(/\\/g,'\\\').replace(/'/g,"\'")+'\')">'+escapeHtmlText(name)+'</button>';
  }).join('');
}

function fillInvestAiMaterial(name){
  var input = document.getElementById('materialAiInput');
  if(input) input.value = name || '';
  _investAiTradeContext = null;
}

function getInvestAiHistory(){
  // Prefer Firebase-backed DB if populated (cross-device sync)
  if(typeof window.DB !== 'undefined' && Array.isArray(window.DB.investAiHistory) && window.DB.investAiHistory.length){
    return window.DB.investAiHistory.slice().sort(function(a,b){
      return new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime();
    });
  }
  // Fall back to localStorage cache (offline / before Firebase load completes)
  try{
    var raw = localStorage.getItem(INVEST_AI_HISTORY_KEY);
    var parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  }catch(e){
    return [];
  }
}

// One-time migration: push legacy localStorage-only AI history to Firebase
// so past analyses are recoverable from any device.
var _INVEST_AI_MIGRATED_KEY = '_invest_ai_fb_migrated_v1';
function _migrateLocalInvestAiToFirebase(){
  try{
    if(localStorage.getItem(_INVEST_AI_MIGRATED_KEY) === '1') return;
    if(typeof window.fbSave !== 'function') return;
    if(typeof window.DB === 'undefined') return;
    var local = [];
    try {
      var rawStr = localStorage.getItem(INVEST_AI_HISTORY_KEY);
      local = rawStr ? JSON.parse(rawStr) : [];
      if(!Array.isArray(local)) local = [];
    } catch(e){ local = []; }
    if(!local.length){
      localStorage.setItem(_INVEST_AI_MIGRATED_KEY, '1');
      return;
    }
    // Merge into DB and push any that Firebase doesn't already have
    window.DB.investAiHistory = Array.isArray(window.DB.investAiHistory) ? window.DB.investAiHistory : [];
    var existingMaterials = {};
    window.DB.investAiHistory.forEach(function(item){
      if(item && item.material) existingMaterials[String(item.material).toLowerCase()] = true;
    });
    var migrated = 0;
    local.forEach(function(item){
      if(!item || !item.material) return;
      var mKey = String(item.material).toLowerCase();
      if(existingMaterials[mKey]) return;
      var rec = {
        id: item.id || ('ai_' + Date.now() + '_' + Math.random().toString(36).slice(2,8)),
        material: item.material,
        markdown: item.markdown || '',
        headline: item.headline || '',
        savedAt: item.savedAt || new Date().toISOString(),
        tradeContext: item.tradeContext || null
      };
      window.DB.investAiHistory.unshift(rec);
      existingMaterials[mKey] = true;
      try { window.fbSave('investAiHistory', rec); } catch(e){}
      migrated++;
    });
    if(migrated > 0){
      console.log('☁️ '+migrated+' ta AI tahlil Firebase\'ga migrate qilindi');
      // Re-render chips so AI badges appear on migrated materials
      _refreshProductChipsWithAi();
    }
    localStorage.setItem(_INVEST_AI_MIGRATED_KEY, '1');
  }catch(e){
    console.warn('AI history migration failed:', e);
  }
}

// Run migration when Firebase finishes loading
(function scheduleAiHistoryMigration(){
  var tries = 0;
  var timer = setInterval(function(){
    tries++;
    if(typeof window.DB !== 'undefined' && typeof window.fbSave === 'function'){
      clearInterval(timer);
      _migrateLocalInvestAiToFirebase();
    } else if(tries > 60){ // ~30 seconds max
      clearInterval(timer);
    }
  }, 500);
})();

function saveInvestAiHistory(material, markdown, tradeContext){
  var headline = String(markdown || '').split(/\r?\n/).map(function(line){
    return String(line || '').replace(/^#+\s*/, '').trim();
  }).find(function(line){ return !!line; }) || investAiT('emptyHeadline');
  var record = {
    id: 'ai_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
    material: material,
    markdown: markdown,
    headline: headline,
    savedAt: new Date().toISOString(),
    tradeContext: tradeContext || null
  };

  // Update in-memory DB (so re-renders show instantly)
  if(typeof window.DB !== 'undefined'){
    window.DB.investAiHistory = Array.isArray(window.DB.investAiHistory) ? window.DB.investAiHistory : [];
    // Dedupe by material — keep the freshest analysis per material
    window.DB.investAiHistory = window.DB.investAiHistory.filter(function(item){
      return item && item.material !== material;
    });
    window.DB.investAiHistory.unshift(record);
    window.DB.investAiHistory = window.DB.investAiHistory.slice(0, 50);
  }

  // Persist to localStorage cache (offline fallback + instant load on next visit)
  var cachedList = (typeof window.DB !== 'undefined' && Array.isArray(window.DB.investAiHistory))
    ? window.DB.investAiHistory
    : [record].concat(getInvestAiHistory()).filter(function(item, idx, arr){
        return idx === arr.findIndex(function(other){ return other.material === item.material; });
      }).slice(0, 50);
  try { localStorage.setItem(INVEST_AI_HISTORY_KEY, JSON.stringify(cachedList)); } catch(e){}

  // Save to Firebase for cross-device sync (fire-and-forget)
  // tradeContext ~2MB bo'lishi mumkin, Firebase doc 1MB limit. Faqat slim ma'lumotni saqlaymiz.
  if(typeof window.fbSave === 'function'){
    try {
      var slimTradeContext = null;
      if(record.tradeContext){
        slimTradeContext = {
          material: record.tradeContext.material || material,
          officialDataAvailable: !!record.tradeContext.officialDataAvailable,
          analyzedProductsCount: Array.isArray(record.tradeContext.analyzedProducts) ? record.tradeContext.analyzedProducts.length : 0,
          rawId: (record.tradeContext.raw && record.tradeContext.raw.id) || null,
          rawNameUz: (record.tradeContext.raw && record.tradeContext.raw.name_uz) || null,
          rawNameEn: (record.tradeContext.raw && record.tradeContext.raw.name_en) || null
        };
      }
      // Markdown ham 800KB'dan oshib ketmasligi uchun cheklash
      var slimMarkdown = String(record.markdown || '');
      if(slimMarkdown.length > 800000) slimMarkdown = slimMarkdown.slice(0, 800000) + '\n\n[truncated]';
      var slimRecord = {
        id: record.id,
        material: record.material,
        markdown: slimMarkdown,
        headline: record.headline,
        savedAt: record.savedAt,
        tradeContext: slimTradeContext
      };
      window.fbSave('investAiHistory', slimRecord);
    } catch(e){ console.warn('fbSave investAiHistory failed', e); }
  }

  // Trigger chip re-render so the "AI" badge appears on the analyzed raw material
  _refreshProductChipsWithAi();
}

// Re-render inline product section chips so AI badge reflects latest history
function _refreshProductChipsWithAi(){
  try {
    if(typeof window.renderInlineProductSection === 'function' && typeof window.PRODUCT_ACTIVE_SECTION !== 'undefined'){
      window.renderInlineProductSection(window.PRODUCT_ACTIVE_SECTION);
      if(typeof window._syncExpandBody === 'function') window._syncExpandBody();
    } else if(typeof window.renderProducts === 'function'){
      window.renderProducts();
    }
  } catch(e){ /* silent */ }
}

function renderInvestAiHistory(){
  var list = document.getElementById('materialAiHistoryList');
  if(!list) return;
  var items = getInvestAiHistory();
  if(!items.length){
    list.innerHTML = '<div class="anx-history-empty">'+investAiT('historyEmpty')+'</div>';
    return;
  }
  list.innerHTML = items.map(function(item, idx){
    var date = new Date(item.savedAt);
    var stamp = isNaN(date.getTime()) ? item.savedAt : date.toLocaleString();
    return '<div class="anx-history-item" onclick="loadInvestAiHistory('+idx+')">'+
      '<div class="anx-history-material">'+escapeHtmlText(item.material)+'</div>'+
      '<div class="anx-history-meta">'+escapeHtmlText(stamp)+'</div>'+
      '<div class="anx-history-headline">'+escapeHtmlText(item.headline || investAiT('emptyHeadline'))+'</div>'+
    '</div>';
  }).join('');
}

function loadInvestAiHistory(idx){
  var items = getInvestAiHistory();
  var item = items[idx];
  if(!item) return;
  _investAiMarkdown = item.markdown || '';
  _investAiCurrentMaterial = item.material || '';
  fillInvestAiMaterial(_investAiCurrentMaterial);
  _investAiTradeContext = item.tradeContext || null;
  renderInvestAiMarkdown(_investAiMarkdown);
  var outputCard = document.getElementById('materialAiOutputCard');
  var notice = document.getElementById('materialAiExcelNotice');
  if(outputCard) outputCard.style.display = 'block';
  if(notice) notice.style.display = 'block';
  // Also reveal inline product panel cards (when loading from products page)
  var inlineOutputCard = document.getElementById('productRawAiOutputCard');
  var inlineNotice = document.getElementById('productRawAiExcelNotice');
  if(inlineOutputCard) inlineOutputCard.style.display = 'block';
  if(inlineNotice) inlineNotice.style.display = 'block';
  updateInvestAiOutputMeta(item.material, item.savedAt);
  renderInvestAiProgress(3, true);
  toast(investAiT('toastHistory'));
}

function renderInvestAiProgressInto(wrapId, cardId, activeIdx, forceDone){
  var wrap = document.getElementById(wrapId);
  var card = document.getElementById(cardId);
  if(!wrap || !card) return;
  card.style.display = 'block';
  wrap.innerHTML = INVEST_AI_PHASES.map(function(step, idx){
    var state = forceDone || idx < activeIdx ? 'done' : (idx === activeIdx ? 'active' : 'pending');
    var status = state === 'done' ? investAiT('statusDone') : (state === 'active' ? investAiT('statusActive') : investAiT('statusPending'));
    var title = investAiT(step.key) || step.title;
    return '<div class="anx-step '+state+'">'+
      '<div class="anx-step-num">Phase '+idx+'</div>'+
      '<div class="anx-step-name">'+escapeHtmlText(title)+'</div>'+
      '<div class="anx-step-status">'+escapeHtmlText(status)+'</div>'+
    '</div>';
  }).join('');
}

function renderInvestAiProgress(activeIdx, forceDone){
  renderInvestAiProgressInto('materialAiProgress', 'materialAiProgressCard', activeIdx, forceDone);
  if(shouldMirrorInvestAiToProductPanel()){
    renderInvestAiProgressInto('productRawAiProgress', 'productRawAiProgressCard', activeIdx, forceDone);
  }
}

function inferInvestAiPhase(markdown){
  var text = String(markdown || '').toLowerCase();
  if(/phase\s*3|report generation|final summary|investment recommendation|recommendations/i.test(text)) return 3;
  if(/phase\s*2|data processing|analysis|processed data|comparative analysis/i.test(text)) return 2;
  if(/phase\s*1|un comtrade|trade data collection|data collection/i.test(text)) return 1;
  if(/phase\s*0|hs code|product research|code mapping/i.test(text)) return 0;
  return _investAiPhase < 0 ? 0 : _investAiPhase;
}

function decorateInvestAiHtml(html){
  return String(html || '')
    .replace(/\bPriority\s*A\b/gi, '<span class="anx-badge anx-badge-a">Priority A</span>')
    .replace(/\bPriority\s*B\b/gi, '<span class="anx-badge anx-badge-b">Priority B</span>')
    .replace(/\bPriority\s*C\b/gi, '<span class="anx-badge anx-badge-c">Priority C</span>')
    .replace(/\bPriority\s*D\b/gi, '<span class="anx-badge anx-badge-d">Priority D</span>')
    .replace(/✓/g, '<span class="anx-check">✓</span>')
    .replace(/△/g, '<span class="anx-mid">△</span>')
    .replace(/⚠️|⚠/g, '<span class="anx-warn">⚠️</span>')
    .replace(/(\$[0-9][0-9,]*(?:\.\d+)?(?:\s?(?:million|billion|M|B|K))?)/g, '<strong class="anx-money">$1</strong>');
}

function renderInvestAiMarkdownInto(outputId, markdown){
  var output = document.getElementById(outputId);
  if(!output) return;
  var source = String(markdown || '');
  if(!source.trim()){
    output.innerHTML = '<p>'+investAiT('outputEmpty')+'</p>';
    return;
  }
  var html = window.marked ? window.marked.parse(source) : escapeHtmlText(source).replace(/\n/g, '<br>');
  output.innerHTML = decorateInvestAiHtml(html);
}

function renderInvestAiMarkdown(markdown){
  renderInvestAiMarkdownInto('materialAiOutput', markdown);
  if(shouldMirrorInvestAiToProductPanel()){
    renderInvestAiMarkdownInto('productRawAiOutput', markdown);
  }
}

function updateInvestAiOutputMetaInto(metaId, material, dateValue){
  var meta = document.getElementById(metaId);
  if(!meta) return;
  var date = dateValue ? new Date(dateValue) : new Date();
  var stamp = isNaN(date.getTime()) ? '' : date.toLocaleString();
  meta.textContent = investAiT('outputMeta').replace('{material}', material || '—').replace('{time}', stamp || '—');
}

function updateInvestAiOutputMeta(material, dateValue){
  updateInvestAiOutputMetaInto('materialAiOutputMeta', material, dateValue);
  if(shouldMirrorInvestAiToProductPanel(material)){
    updateInvestAiOutputMetaInto('productRawAiOutputMeta', material, dateValue);
  }
}

function stripInvestAiMd(line){
  return String(line || '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\s*[-*+]\s*/, '')
    .replace(/^\s*\d+\.\s*/, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function splitInvestAiSections(markdown){
  var lines = String(markdown || '').split(/\r?\n/);
  var sections = [];
  var current = { title:'Full Report', lines:[] };
  lines.forEach(function(line){
    var m = String(line || '').match(/^##\s+(.*)$/);
    if(m){
      if(current.lines.length || current.title) sections.push(current);
      current = { title: stripInvestAiMd(m[1]), lines:[] };
    } else {
      current.lines.push(line);
    }
  });
  if(current.lines.length || current.title) sections.push(current);
  return sections.filter(function(sec){ return sec && sec.title; });
}

function linesToSheet(lines){
  return (lines || []).map(function(line){ return [stripInvestAiMd(line)]; }).filter(function(row){ return row[0]; });
}

function extractInvestAiBullets(markdown, heading){
  var lines = String(markdown || '').split(/\r?\n/);
  var needle = String(heading || '').toLowerCase();
  var found = false;
  var rows = [];
  lines.forEach(function(line){
    var raw = String(line || '');
    var clean = stripInvestAiMd(raw);
    if(/^###\s+/i.test(raw)){
      found = clean.toLowerCase() === needle;
      return;
    }
    if(found){
      if(/^##\s+/i.test(raw) || /^###\s+/i.test(raw)) found = false;
      else if(/^\s*[-*+]\s+/.test(raw) || /^\s*\d+\.\s+/.test(raw)) rows.push([stripInvestAiMd(raw)]);
      else if(clean) rows.push([clean]);
    }
  });
  return rows;
}

function extractInvestAiTaggedLines(markdown, regex){
  return String(markdown || '')
    .split(/\r?\n/)
    .map(function(line){ return stripInvestAiMd(line); })
    .filter(function(line){ return line && regex.test(line); })
    .map(function(line){ return [line]; });
}

function investAiNormalizeText(value){
  var text = String(value || '').toLowerCase();
  try { text = text.normalize('NFD').replace(/[\u0300-\u036f]/g,''); } catch(e){}
  return text.replace(/[''`"]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}

function investAiParseHsCode(value){
  return String(value || '').replace(/\D/g,'');
}

function investAiFmtUsd(value){
  var num = Number(value || 0) || 0;
  return '$' + Math.round(num).toLocaleString('en-US');
}

function investAiFmtShortUsd(value){
  var num = Number(value || 0) || 0;
  var abs = Math.abs(num);
  if(abs >= 1e9) return '$' + (num / 1e9).toFixed(abs >= 10e9 ? 0 : 1) + 'B';
  if(abs >= 1e6) return '$' + (num / 1e6).toFixed(abs >= 10e6 ? 0 : 1) + 'M';
  if(abs >= 1e3) return '$' + (num / 1e3).toFixed(abs >= 10e3 ? 0 : 1) + 'K';
  return '$' + Math.round(num).toLocaleString('en-US');
}

function investAiFmtPct(value){
  if(value == null || isNaN(value)) return '—';
  return (Number(value) * 100).toFixed(1) + '%';
}

function investAiFmtPercent(value){
  if(value == null || isNaN(value)) return '—';
  return Number(value).toFixed(1) + '%';
}

function investAiCalcCagr(series){
  var years = ['2021','2022','2023','2024'];
  var firstYear = null, lastYear = null, firstValue = 0, lastValue = 0;
  years.forEach(function(year){
    var value = Number((series || {})[year] || 0) || 0;
    if(value > 0 && firstYear === null){
      firstYear = Number(year);
      firstValue = value;
    }
    if(value > 0){
      lastYear = Number(year);
      lastValue = value;
    }
  });
  if(firstYear === null || lastYear === null || lastYear <= firstYear || firstValue <= 0 || lastValue <= 0) return null;
  return Math.pow(lastValue / firstValue, 1 / (lastYear - firstYear)) - 1;
}

function investAiExpandImportSnapshotCountries(snapshot){
  return (snapshot && snapshot.countries || []).map(function(c){
    return {
      code: c.c || c.code || '',
      name: c.n || c.name || '',
      flag: c.f || c.flag || '',
      import_usd: Number(c.u || c.import_usd || 0) || 0,
      trend_pct: typeof (c.t || c.trend_pct) === 'number' ? (c.t || c.trend_pct) : (c.t === 0 ? 0 : null),
      volume_tons: Number(c.v || c.volume_tons || 0) || 0,
      year_imports: c.y || c.year_imports || {},
      year_statuses: c.s || c.year_statuses || {},
      status: c.st || c.status || 'ok'
    };
  });
}

function investAiFindRawMaterial(material){
  var needle = investAiNormalizeText(material);
  var raws = DB.rawMaterials || [];
  if(!needle) return null;
  var scored = raws.map(function(raw){
    var uz = investAiNormalizeText(raw.name_uz);
    var en = investAiNormalizeText(raw.name_en);
    var score = 0;
    if(needle && (needle === uz || needle === en)) score = 100;
    else if(needle && (uz.indexOf(needle) !== -1 || en.indexOf(needle) !== -1)) score = 80;
    else if(needle && (needle.indexOf(uz) !== -1 || needle.indexOf(en) !== -1)) score = 70;
    return { raw: raw, score: score };
  }).filter(function(item){ return item.score > 0; })
    .sort(function(a,b){ return b.score - a.score; });
  return scored.length ? scored[0].raw : null;
}

function investAiFindProducts(material){
  var needle = investAiNormalizeText(material);
  var raw = investAiFindRawMaterial(material);
  var prods = DB.products || [];
  var out = [];
  function pushUnique(product){
    if(!product || !product.id) return;
    if(out.some(function(item){ return String(item.id) === String(product.id); })) return;
    out.push(product);
  }
  if(raw){
    prods.forEach(function(prod){
      if(String(prod.raw_id) === String(raw.id)) pushUnique(prod);
      else {
        var rawName = investAiNormalizeText(prod.raw_name);
        if(rawName && (rawName === investAiNormalizeText(raw.name_uz) || rawName === investAiNormalizeText(raw.name_en))) pushUnique(prod);
      }
    });
    return { raw: raw, products: out };
  }
  prods.forEach(function(prod){
    var en = investAiNormalizeText(prod.name_en);
    var uz = investAiNormalizeText(prod.name_uz);
    var hs = investAiNormalizeText(prod.hs_code);
    if(needle && (needle === en || needle === uz || needle === hs)) pushUnique(prod);
  });
  return { raw: raw, products: out };
}

function investAiInferCategory(product){
  var text = investAiNormalizeText([
    product.name_en,
    product.name_uz,
    product.main_sector,
    product.usage,
    product.description
  ].join(' '));
  if(/ceramic|tile|sanitary|porcelain|brick/.test(text)) return 'CERAMICS';
  if(/paper|paint|rubber|filler|silica|silicon|coating|chemical/.test(text)) return 'FILLER';
  if(/refractory|kiln|alumina|foundry/.test(text)) return 'REFRACTORIES';
  if(/cement|lime|gypsum|mortar|board|plaster|construction/.test(text)) return 'CONSTRUCTION';
  if(/ore|crude|roughly|stone|granite|marble|basalt|limestone|quartz|kaolin|clay|dolomite|phosphorite/.test(text)) return 'RAW';
  return 'PROCESSING';
}

function investAiInferLevel(product){
  var text = investAiNormalizeText([product.name_en, product.main_sector, product.usage].join(' '));
  if(/ore|crude|roughly|stone|raw/.test(text)) return 'Raw';
  if(/cement|lime|powder|board|tile|brick|chemical|plaster|glass/.test(text)) return 'Processed';
  return 'Downstream';
}

function investAiInferCapital(product){
  var text = investAiNormalizeText([product.name_en, product.main_sector, product.usage].join(' '));
  if(/tile|brick|cement|glass|refractory|ceramic/.test(text)) return 'High';
  if(/chemical|silica|filler|coating|board|plaster/.test(text)) return 'Medium';
  return 'Low / Medium';
}

function investAiInferTechnology(product){
  var text = investAiNormalizeText([product.name_en, product.main_sector, product.usage].join(' '));
  if(/chemical|silica|coating|engineered|composite/.test(text)) return 'Advanced';
  if(/tile|glass|cement|ceramic|board|plaster|refractory/.test(text)) return 'Industrial';
  return 'Basic processing';
}

function investAiPickAnalysisYear(entries){
  var years = ['2024','2023','2022','2021'];
  for(var i=0;i<years.length;i++){
    var year = years[i];
    var total = (entries || []).reduce(function(sum, entry){
      return sum + (Number((entry.totalsByYear || {})[year] || 0) || 0);
    }, 0);
    if(total > 0) return year;
  }
  return '2024';
}

function investAiInferPriority(entry){
  var regionalDemand = Number(entry.analysisValue || 0) || 0;
  var uzbImport = Number(entry.uzbValue || 0) || 0;
  var level = String(entry.level || '');
  if(regionalDemand >= 50000000 && uzbImport >= 1000000) return 'Priority A';
  if(regionalDemand >= 15000000 && (uzbImport >= 250000 || /Processed|Downstream/.test(level))) return 'Priority B';
  if(regionalDemand >= 5000000) return 'Priority C';
  return 'Priority D';
}

function investAiInferFeasibility(priority){
  if(priority === 'Priority A') return 'High';
  if(priority === 'Priority B') return 'Medium / High';
  if(priority === 'Priority C') return 'Medium';
  return 'Low';
}

function investAiInferCompetitiveness(entry){
  var regionalDemand = Number(entry.analysisValue || 0) || 0;
  var cagr = typeof entry.cagr === 'number' ? entry.cagr : null;
  if(regionalDemand >= 50000000 && cagr !== null && cagr >= 0.05) return 'Strong';
  if(regionalDemand >= 15000000) return 'Moderate';
  return 'Weak';
}

function investAiInferVerdict(priority, entry){
  if(priority === 'Priority A') return 'Actively promote';
  if(priority === 'Priority B') return 'Validate and target';
  if(priority === 'Priority C') return 'Selective opportunity';
  return (entry.level === 'Raw' ? 'Low value / verify' : 'Not a priority');
}

function investAiPriorityBadgeColor(priority){
  if(priority === 'Priority A') return 'C6EFCE';
  if(priority === 'Priority B') return 'DBEAFE';
  if(priority === 'Priority C') return 'FFEB9C';
  return 'E2E8F0';
}

function investAiBuildWorkbookContext(material, markdown){
  var match = investAiFindProducts(material);
  var activeTradeContext = (_investAiTradeContext && investAiNormalizeText(_investAiTradeContext.material) === investAiNormalizeText(material)) ? _investAiTradeContext : null;
  var raw = activeTradeContext && activeTradeContext.raw ? activeTradeContext.raw : match.raw;
  var sections = splitInvestAiSections(markdown);
  var executiveSummaryRows = extractInvestAiBullets(markdown, 'Executive Summary');
  var nextSteps = extractInvestAiBullets(markdown, 'Recommended Next Steps');
  var investorTargets = extractInvestAiBullets(markdown, 'Recommended Investor Targets');
  var verificationRows = extractInvestAiTaggedLines(markdown, /verified|verification|requires live trade verification|✓|△|⚠/i);
  var riskRows = extractInvestAiTaggedLines(markdown, /risk|caveat|constraint|warning|⚠|gap/i);
  var summaryLines = String(markdown || '').split(/\r?\n/).map(stripInvestAiMd).filter(Boolean);
  var products = [];

  var sourceEntries = [];
  if(activeTradeContext && activeTradeContext.officialDataAvailable && Array.isArray(activeTradeContext.analyzedProducts) && activeTradeContext.analyzedProducts.length){
    sourceEntries = activeTradeContext.analyzedProducts.map(function(item){
      var product = (DB.products || []).find(function(prod){
        return String(prod.id || '') === String(item.productId || '') ||
               investAiParseHsCode(prod.hs_code).slice(0,6) === investAiParseHsCode(item.hsCode).slice(0,6);
      }) || {
        id: item.productId || item.hsCode,
        name_en: item.productName || item.hsCode,
        name_uz: '',
        hs_code: item.hsCode || '',
        raw_id: raw ? raw.id : '',
        raw_name: raw ? (raw.name_uz || raw.name_en || '') : ''
      };
      return {
        product: product,
        hsDigits: investAiParseHsCode(item.hsCode || product.hs_code),
        snapshot: { id: item.snapshotId || '', countries: item.countries || [], source: item.source || 'UN Comtrade' }
      };
    });
  } else {
    sourceEntries = (match.products || []).map(function(product){
      var hsDigits = investAiParseHsCode(product.hs_code);
      return {
        product: product,
        hsDigits: hsDigits,
        snapshot: getImportSnapshot(product, getExactImportHsCode(product))
      };
    });
  }

  var entries = sourceEntries.map(function(sourceEntry){
    var product = sourceEntry.product;
    var hsDigits = sourceEntry.hsDigits;
    var snapshot = sourceEntry.snapshot;
    var expanded = investAiExpandImportSnapshotCountries(snapshot);
    var countryMap = {};
    TARGET_COUNTRIES.forEach(function(target){
      var found = expanded.find(function(item){ return String(item.code) === String(target.code); }) || {
        code: target.code,
        name: target.name,
        flag: target.flag || '',
        import_usd: 0,
        trend_pct: null,
        volume_tons: 0,
        year_imports: {},
        year_statuses: {},
        status: 'no_data'
      };
      var years = {
        '2021': Number((found.year_imports || {})['2021'] || 0) || 0,
        '2022': Number((found.year_imports || {})['2022'] || 0) || 0,
        '2023': Number((found.year_imports || {})['2023'] || 0) || 0,
        '2024': Number((found.year_imports || {})['2024'] || 0) || 0
      };
      if(!years['2021'] && !years['2022'] && !years['2023'] && !years['2024'] && Number(found.import_usd || 0)){
        years['2023'] = Number(found.import_usd || 0) || 0;
      }
      countryMap[target.code] = {
        code: target.code,
        name: target.name,
        years: years,
        status: found.status || 'no_data',
        volumeTons: Number(found.volume_tons || 0) || 0,
        trendPct: typeof found.trend_pct === 'number' ? found.trend_pct : null
      };
    });

    var totalsByYear = { '2021':0,'2022':0,'2023':0,'2024':0 };
    Object.keys(countryMap).forEach(function(code){
      var years = countryMap[code].years;
      totalsByYear['2021'] += Number(years['2021'] || 0) || 0;
      totalsByYear['2022'] += Number(years['2022'] || 0) || 0;
      totalsByYear['2023'] += Number(years['2023'] || 0) || 0;
      totalsByYear['2024'] += Number(years['2024'] || 0) || 0;
    });

    return {
      product: product,
      raw: raw,
      hsCode: hsDigits.slice(0,6) || hsDigits.slice(0,4) || String(product.hs_code || ''),
      displayName: typeof formatBilingualProductName === 'function' ? formatBilingualProductName(product) : (product.name_en || product.name_uz || '—'),
      category: investAiInferCategory(product),
      level: investAiInferLevel(product),
      capital: investAiInferCapital(product),
      technology: investAiInferTechnology(product),
      endUse: product.main_sector || product.usage || product.import_info || 'Requires validation',
      countryMap: countryMap,
      totalsByYear: totalsByYear,
      snapshotId: snapshot ? snapshot.id : '',
      hasSnapshot: !!snapshot
    };
  }).filter(function(entry){
    return entry.product && entry.hsCode && entry.hasSnapshot;
  });

  products = entries.map(function(entry){ return entry.product; });
  var analysisYear = investAiPickAnalysisYear(entries);
  entries.forEach(function(entry){
    entry.analysisValue = Number((entry.totalsByYear || {})[analysisYear] || 0) || 0;
    entry.uzbValue = Number((((entry.countryMap || {}).UZ || {}).years || {})[analysisYear] || 0) || 0;
    entry.cagr = investAiCalcCagr(entry.totalsByYear);
    var countries = Object.keys(entry.countryMap || {}).map(function(code){
      return {
        code: code,
        name: entry.countryMap[code].name,
        value: Number((entry.countryMap[code].years || {})[analysisYear] || 0) || 0
      };
    }).sort(function(a,b){ return (b.value || 0) - (a.value || 0); });
    entry.topImporter = countries[0] || { code:'', name:'—', value:0 };
    entry.priority = investAiInferPriority(entry);
    entry.feasibility = investAiInferFeasibility(entry.priority);
    entry.competitiveness = investAiInferCompetitiveness(entry);
    entry.verdict = investAiInferVerdict(entry.priority, entry);
  });

  entries.sort(function(a,b){ return (b.analysisValue || 0) - (a.analysisValue || 0); });

  var countryTotals = {};
  TARGET_COUNTRIES.forEach(function(target){ countryTotals[target.code] = 0; });
  entries.forEach(function(entry){
    TARGET_COUNTRIES.forEach(function(target){
      countryTotals[target.code] += Number((((entry.countryMap || {})[target.code] || {}).years || {})[analysisYear] || 0) || 0;
    });
  });
  var topCountryCode = Object.keys(countryTotals).sort(function(a,b){ return (countryTotals[b] || 0) - (countryTotals[a] || 0); })[0] || 'UZ';
  var topCountry = TARGET_COUNTRIES.find(function(target){ return target.code === topCountryCode; }) || { code: topCountryCode, name:'—' };

  return {
    material: material,
    raw: raw,
    products: products,
    entries: entries,
    sections: sections,
    analysisYear: analysisYear,
    totalRegionalDemand: entries.reduce(function(sum, entry){ return sum + (Number(entry.analysisValue || 0) || 0); }, 0),
    totalUzbImports: entries.reduce(function(sum, entry){ return sum + (Number(entry.uzbValue || 0) || 0); }, 0),
    priorityACount: entries.filter(function(entry){ return entry.priority === 'Priority A'; }).length,
    countryCount: TARGET_COUNTRIES.length,
    topCountry: topCountry,
    topCountryValue: countryTotals[topCountryCode] || 0,
    executiveSummaryRows: executiveSummaryRows,
    nextSteps: nextSteps,
    investorTargets: investorTargets,
    verificationRows: verificationRows,
    riskRows: riskRows,
    headline: summaryLines[0] || material || 'Trade Analysis',
    summaryLines: summaryLines
  };
}

function investAiWorkbookStyles(){
  function border(color, style){
    return {
      top:{style:style || 'thin',color:{rgb:color}},
      bottom:{style:style || 'thin',color:{rgb:color}},
      left:{style:style || 'thin',color:{rgb:color}},
      right:{style:style || 'thin',color:{rgb:color}}
    };
  }
  return {
    title: {
      font:{name:'Arial',sz:16,bold:true,color:{rgb:'FFFFFF'}},
      fill:{fgColor:{rgb:'0C4A6E'}},
      alignment:{horizontal:'center',vertical:'center',wrapText:true},
      border:border('0C4A6E')
    },
    subtitle: {
      font:{name:'Arial',sz:11,color:{rgb:'0F172A'}},
      fill:{fgColor:{rgb:'F0F9FF'}},
      alignment:{horizontal:'left',vertical:'center',wrapText:true},
      border:border('CBD5E1')
    },
    section: {
      font:{name:'Arial',sz:12,bold:true,color:{rgb:'FFFFFF'}},
      fill:{fgColor:{rgb:'0369A1'}},
      alignment:{horizontal:'left',vertical:'center',wrapText:true},
      border:border('94A3B8')
    },
    metricHead: {
      font:{name:'Arial',sz:10,bold:true,color:{rgb:'FFFFFF'}},
      fill:{fgColor:{rgb:'0369A1'}},
      alignment:{horizontal:'center',vertical:'center',wrapText:true},
      border:border('94A3B8')
    },
    metricValue: {
      font:{name:'Arial',sz:12,bold:true,color:{rgb:'0F172A'}},
      fill:{fgColor:{rgb:'F0F9FF'}},
      alignment:{horizontal:'center',vertical:'center',wrapText:true},
      border:border('CBD5E1')
    },
    header: {
      font:{name:'Arial',sz:10,bold:true,color:{rgb:'FFFFFF'}},
      fill:{fgColor:{rgb:'0369A1'}},
      alignment:{horizontal:'center',vertical:'center',wrapText:true},
      border:border('94A3B8')
    },
    body: {
      font:{name:'Arial',sz:10,color:{rgb:'0F172A'}},
      fill:{fgColor:{rgb:'FFFFFF'}},
      alignment:{horizontal:'left',vertical:'top',wrapText:true},
      border:border('CBD5E1','hair')
    },
    alt: {
      font:{name:'Arial',sz:10,color:{rgb:'0F172A'}},
      fill:{fgColor:{rgb:'F8FAFC'}},
      alignment:{horizontal:'left',vertical:'top',wrapText:true},
      border:border('CBD5E1','hair')
    },
    note: {
      font:{name:'Arial',sz:10,italic:true,color:{rgb:'475569'}},
      fill:{fgColor:{rgb:'F2F2F4'}},
      alignment:{horizontal:'left',vertical:'top',wrapText:true},
      border:border('CBD5E1')
    },
    group: {
      font:{name:'Arial',sz:11,bold:true,color:{rgb:'0F172A'}},
      fill:{fgColor:{rgb:'DBEAFE'}},
      alignment:{horizontal:'left',vertical:'center',wrapText:true},
      border:border('94A3B8')
    }
  };
}

function investAiStyleRow(ws, rowIndex, colCount, style){
  if(!ws || !window.XLSX) return;
  for(var c=0;c<colCount;c++){
    var ref = XLSX.utils.encode_cell({r:rowIndex,c:c});
    if(ws[ref]) ws[ref].s = style;
  }
}

function investAiStyleRowsAlternating(ws, startRow, endRow, colCount, styles){
  for(var r=startRow;r<=endRow;r++){
    investAiStyleRow(ws, r, colCount, (r % 2 === 0 ? styles.alt : styles.body));
  }
}

function investAiMerge(ws, startRow, startCol, endRow, endCol){
  if(!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s:{r:startRow,c:startCol}, e:{r:endRow,c:endCol} });
}

// ═══════ Russian translation layer (Phase 1) ═══════
var INVEST_AI_RU = {
  // Sheet names (max 31 chars)
  sheetExec: 'Главная панель',
  sheetProductMap: 'Карта продуктов',
  sheetTrade: 'Торговые данные',
  sheetCountryMatrix: 'Матрица импорта по странам',
  sheetSuppliers: 'Поставщики',
  sheetPriority: 'Матрица инвестприоритетов',
  sheetImportSubUz: 'Импортозамещение УЗБ',
  sheetImportSubRegional: 'Импортозамещение — регион',
  sheetMethodology: 'Методология',
  // Titles & subtitles
  titleSuffix: ': АНАЛИЗ ТОРГОВЛИ И ИНВЕСТИЦИОННЫЕ ВОЗМОЖНОСТИ',
  navoiPrefix: 'НАВОИЙСКИЙ РЕГИОН — ',
  rawMaterial: 'Сырьё',
  mappedNote: 'Сопоставлено с продуктовым портфелем Навои и анализом регионального спроса',
  // KPI labels
  kpiProducts: 'Продукты',
  kpiRegionalDemand: 'Региональный спрос',
  kpiUzbImports: 'Импорт Узбекистана',
  kpiPriorityA: 'Приоритет A',
  kpiCountries: 'Страны',
  kpiTopMarket: 'Крупнейший рынок',
  // Column headers
  hRank: 'Ранг',
  hHs: 'Код ТН ВЭД',
  hProduct: 'Продукт',
  hRegionalDemand: 'Регион. итого ($)',
  hUzbImports: 'Узбекистан ($)',
  hTopImporter: 'Крупнейший импортёр',
  hTopSupplier: 'Крупнейший поставщик',
  hCagr: 'CAGR',
  hPriority: 'Приоритет',
  hCategory: 'Категория',
  hLevel: 'Уровень',
  hCapital: 'Капитал',
  hTechnology: 'Технология',
  hEndUse: 'Применение',
  hFeasibility: 'Реализуемость',
  hYear: 'Год',
  hImport: 'Импорт ($)',
  hCountry: 'Страна',
  hVolume: 'Объём ($)',
  hNote: 'Примечание',
  hShare: 'Доля',
  hTrend: 'Тренд',
  hValueChain: 'Цепочка создания стоимости',
  // Section labels
  secExecSummary: 'Резюме',
  secVerification: 'Примечания по верификации',
  secMethodology: 'Методология, источники данных и примечания по качеству',
  secDataSource: 'ИСТОЧНИК ДАННЫХ',
  secApiVersion: 'ВЕРСИЯ API',
  secFlow: 'ПОТОК',
  secPeriods: 'ПЕРИОДЫ',
  secClassification: 'КЛАССИФИКАЦИЯ',
  secValues: 'ЗНАЧЕНИЯ',
  secCountries: 'СТРАНЫ-ОТЧЁТНИКИ',
  secNotes: 'ПРИМЕЧАНИЯ ПО КАЧЕСТВУ ДАННЫХ',
  secPriorityScoring: 'СИСТЕМА ОЦЕНКИ ИНВЕСТИЦИОННЫХ ПРИОРИТЕТОВ',
  // Priority labels
  priorityA: 'A — Стратегический',
  priorityB: 'B — Высокий',
  priorityC: 'C — Средний',
  priorityD: 'D — Низкий'
};

// EN → RU country names (top-100 most common partners)
var INVEST_AI_COUNTRY_RU = {
  'Uzbekistan':'Узбекистан', 'Kazakhstan':'Казахстан', 'Kyrgyzstan':'Кыргызстан',
  'Tajikistan':'Таджикистан', 'Turkmenistan':'Туркменистан', 'Russia':'Россия',
  'Russian Federation':'Россия', 'Mongolia':'Монголия', 'Azerbaijan':'Азербайджан',
  'Georgia':'Грузия', 'Armenia':'Армения', 'Iran':'Иран',
  'Iran, Islamic Republic of':'Иран', 'Afghanistan':'Афганистан', 'Pakistan':'Пакистан',
  'China':'Китай', "China, People's Republic of":'Китай',
  'Hong Kong':'Гонконг', 'Hong Kong, China':'Гонконг',
  'India':'Индия', 'Japan':'Япония', 'South Korea':'Южная Корея',
  'Korea, Republic of':'Южная Корея', 'Republic of Korea':'Южная Корея',
  'North Korea':'Северная Корея', 'Vietnam':'Вьетнам', 'Viet Nam':'Вьетнам',
  'Thailand':'Таиланд', 'Indonesia':'Индонезия', 'Malaysia':'Малайзия',
  'Singapore':'Сингапур', 'Philippines':'Филиппины', 'Taiwan':'Тайвань',
  'Bangladesh':'Бангладеш', 'Sri Lanka':'Шри-Ланка', 'Nepal':'Непал',
  'Myanmar':'Мьянма', 'Cambodia':'Камбоджа', 'Laos':'Лаос',
  'United States':'США', 'United States of America':'США', 'USA':'США',
  'Canada':'Канада', 'Mexico':'Мексика', 'Brazil':'Бразилия',
  'Argentina':'Аргентина', 'Chile':'Чили', 'Peru':'Перу',
  'Colombia':'Колумбия', 'Venezuela':'Венесуэла', 'Ecuador':'Эквадор',
  'United Kingdom':'Великобритания', 'UK':'Великобритания',
  'Germany':'Германия', 'France':'Франция', 'Italy':'Италия',
  'Spain':'Испания', 'Portugal':'Португалия', 'Netherlands':'Нидерланды',
  'Belgium':'Бельгия', 'Switzerland':'Швейцария', 'Austria':'Австрия',
  'Sweden':'Швеция', 'Norway':'Норвегия', 'Denmark':'Дания',
  'Finland':'Финляндия', 'Poland':'Польша', 'Czech Republic':'Чехия',
  'Czechia':'Чехия', 'Slovakia':'Словакия', 'Hungary':'Венгрия',
  'Romania':'Румыния', 'Bulgaria':'Болгария', 'Greece':'Греция',
  'Croatia':'Хорватия', 'Serbia':'Сербия', 'Slovenia':'Словения',
  'Bosnia and Herzegovina':'Босния и Герцеговина', 'Albania':'Албания',
  'North Macedonia':'Северная Македония', 'Macedonia':'Северная Македония',
  'Estonia':'Эстония', 'Latvia':'Латвия', 'Lithuania':'Литва',
  'Belarus':'Беларусь', 'Ukraine':'Украина', 'Moldova':'Молдова',
  'Republic of Moldova':'Молдова', 'Cyprus':'Кипр', 'Malta':'Мальта',
  'Iceland':'Исландия', 'Ireland':'Ирландия', 'Luxembourg':'Люксембург',
  'Turkey':'Турция', 'Türkiye':'Турция', 'Israel':'Израиль',
  'Saudi Arabia':'Саудовская Аравия', 'United Arab Emirates':'ОАЭ',
  'UAE':'ОАЭ', 'Qatar':'Катар', 'Kuwait':'Кувейт',
  'Bahrain':'Бахрейн', 'Oman':'Оман', 'Yemen':'Йемен',
  'Iraq':'Ирак', 'Syria':'Сирия', 'Jordan':'Иордания',
  'Lebanon':'Ливан', 'Egypt':'Египет', 'Morocco':'Марокко',
  'Tunisia':'Тунис', 'Algeria':'Алжир', 'Libya':'Ливия',
  'Sudan':'Судан', 'Ethiopia':'Эфиопия', 'Kenya':'Кения',
  'Tanzania':'Танзания', 'Uganda':'Уганда', 'Nigeria':'Нигерия',
  'Ghana':'Гана', 'South Africa':'ЮАР', 'Zimbabwe':'Зимбабве',
  'Zambia':'Замбия', 'Angola':'Ангола', 'Mozambique':'Мозамбик',
  'Madagascar':'Мадагаскар', 'Mauritius':'Маврикий',
  'Australia':'Австралия', 'New Zealand':'Новая Зеландия',
  'Fiji':'Фиджи', 'Papua New Guinea':'Папуа — Новая Гвинея',
  // Uzbek country names → Russian
  "O'zbekiston":'Узбекистан', 'Uzbekiston':'Узбекистан',
  "Qozog'iston":'Казахстан', 'Qozogiston':'Казахстан', 'Qozogʻiston':'Казахстан',
  "Qirg'iziston":'Кыргызстан', 'Qirgiziston':'Кыргызстан',
  'Tojikiston':'Таджикистан', 'Turkmaniston':'Туркменистан',
  'Rossiya':'Россия', "Mo'g'uliston":'Монголия', 'Mongoliya':'Монголия',
  'Ozarbayjon':'Азербайджан', 'Gruziya':'Грузия', 'Armaniston':'Армения',
  'Eron':'Иран', "Afg'oniston":'Афганистан', 'Pokiston':'Пакистан',
  'Xitoy':'Китай', 'Hindiston':'Индия', 'Yaponiya':'Япония',
  'Janubiy Koreya':'Южная Корея', 'Koreya':'Корея',
  'Vyetnam':'Вьетнам', 'Tailand':'Таиланд', 'Indoneziya':'Индонезия',
  'Malayziya':'Малайзия', 'Singapur':'Сингапур', 'Filippin':'Филиппины',
  'Tayvan':'Тайвань', 'Bangladesh':'Бангладеш', 'Myanma':'Мьянма',
  'AQSH':'США', 'AQSh':'США', 'Kanada':'Канада', 'Meksika':'Мексика',
  'Braziliya':'Бразилия', 'Argentina':'Аргентина', 'Chili':'Чили',
  'Buyuk Britaniya':'Великобритания', 'Germaniya':'Германия',
  'Fransiya':'Франция', 'Italiya':'Италия', 'Ispaniya':'Испания',
  'Niderlandiya':'Нидерланды', 'Belgiya':'Бельгия', 'Shveysariya':'Швейцария',
  'Avstriya':'Австрия', 'Shvetsiya':'Швеция', 'Norvegiya':'Норвегия',
  'Daniya':'Дания', 'Finlandiya':'Финляндия', 'Polsha':'Польша',
  'Chexiya':'Чехия', 'Slovakiya':'Словакия', 'Vengriya':'Венгрия',
  'Ruminiya':'Румыния', 'Bolgariya':'Болгария', 'Yunoniston':'Греция',
  'Estoniya':'Эстония', 'Latviya':'Латвия', 'Litva':'Литва',
  'Belarus':'Беларусь', 'Ukraina':'Украина', 'Moldova':'Молдова',
  'Turkiya':'Турция', 'Isroil':'Израиль', 'Saudiya Arabistoni':'Саудовская Аравия',
  'BAA':'ОАЭ', 'Qatar':'Катар', 'Kuvayt':'Кувейт',
  'Iroq':'Ирак', 'Suriya':'Сирия', 'Iordaniya':'Иордания',
  'Livan':'Ливан', 'Misr':'Египет', 'Marokash':'Марокко',
  'Tunis':'Тунис', 'Jazoir':'Алжир', 'Liviya':'Ливия',
  'Janubiy Afrika':'ЮАР', 'Avstraliya':'Австралия', 'Yangi Zelandiya':'Новая Зеландия'
};

function investAiTranslateCountry(name){
  if(!name) return '—';
  var s = String(name).trim();
  if(INVEST_AI_COUNTRY_RU[s]) return INVEST_AI_COUNTRY_RU[s];
  // case-insensitive fallback
  var keys = Object.keys(INVEST_AI_COUNTRY_RU);
  var lower = s.toLowerCase();
  for(var i=0;i<keys.length;i++){
    if(keys[i].toLowerCase() === lower) return INVEST_AI_COUNTRY_RU[keys[i]];
  }
  return s; // unknown — keep original
}

function investAiTranslatePriority(p){
  var s = String(p || '').trim();
  if(s === 'Priority A') return INVEST_AI_RU.priorityA;
  if(s === 'Priority B') return INVEST_AI_RU.priorityB;
  if(s === 'Priority C') return INVEST_AI_RU.priorityC;
  if(s === 'Priority D') return INVEST_AI_RU.priorityD;
  return s;
}

// HS code → Russian product name (curated from NavoiAzot RU template)
var INVEST_AI_HS_RU = {
  '220720':'Этиловый спирт',
  '220900':'Пищевой уксус',
  '270750':'Ароматические углеводороды',
  '280110':'Хлор',
  '280700':'Олеум / Серная кислота',
  '280800':'Азотная кислота',
  '281112':'Синильная кислота',
  '281410':'Аммиак',
  '281511':'Каустическая сода',
  '282710':'Хлорид аммония',
  '283620':'Кальцинированная сода',
  '290129':'Ацетилен',
  '290311':'Хлорметан',
  '290345':'Фреон / хладагенты',
  '290511':'Метанол',
  '290542':'Пентаэритритол',
  '291211':'Формальдегид',
  '291411':'Ацетон',
  '291521':'Уксусная кислота',
  '291532':'Винилацетат',
  '291540':'Монохлоруксусная кислота',
  '300410':'Лекарственные средства (пенициллин и др.)',
  '310210':'Карбамид',
  '310230':'Аммиачная селитра',
  '320413':'Красители (основные)',
  '320910':'Лаки (акриловые/виниловые)',
  '360200':'Взрывчатые вещества',
  '382499':'Химические препараты / Растворители',
  '390410':'ПВХ (поливинилхлорид)',
  '390910':'Карбамидоформальдегидные смолы',
  '390920':'Меламиноформальдегидная смола',
  '390940':'Фенольные смолы',
  '391211':'Ацетат целлюлозы',
  '392043':'ПВХ-плиты/листы/плёнки',
  '392112':'Ячеистые ПВХ-плиты',
  '392113':'ПУ ячеистые плиты / искусственная кожа',
  '392520':'Пластиковые двери/окна/рамы',
  '400231':'Бутилкаучук (IIR)',
  '400259':'Синтетический каучук (прочий)',
  '401691':'Резиновые напольные покрытия',
  '441112':'МДФ (≤5мм)',
  '441114':'МДФ (>9мм)',
  '441192':'Древесноволокнистая плита',
  '481190':'Бумага/картон (мелованные)',
  '551614':'Искусственное волокно (тканое)',
  '590410':'Линолеум',
  '852380':'Записанные носители (прочие)'
};

var INVEST_AI_HS_RU_CACHE_KEY = '_invest_ai_hs_ru_cache';
function investAiLoadHsRuCache(){
  try {
    var raw = localStorage.getItem(INVEST_AI_HS_RU_CACHE_KEY);
    return raw ? (JSON.parse(raw) || {}) : {};
  } catch(_e){ return {}; }
}
function investAiSaveHsRuCache(map){
  try { localStorage.setItem(INVEST_AI_HS_RU_CACHE_KEY, JSON.stringify(map || {})); } catch(_e){}
}

// Returns Russian product name from static map or runtime cache; null if unknown
function investAiLookupHsRu(hsCode){
  var hs = String(hsCode || '').replace(/\D/g,'');
  if(!hs) return null;
  if(INVEST_AI_HS_RU[hs]) return INVEST_AI_HS_RU[hs];
  var hs6 = hs.slice(0,6);
  if(INVEST_AI_HS_RU[hs6]) return INVEST_AI_HS_RU[hs6];
  var cache = investAiLoadHsRuCache();
  if(cache[hs]) return cache[hs];
  if(cache[hs6]) return cache[hs6];
  return null;
}

// Batch-translate unknown product names to Russian via Gemini, cache results
async function investAiBatchTranslateProductsRu(entries){
  if(!Array.isArray(entries) || !entries.length) return;
  var cache = investAiLoadHsRuCache();
  var pending = [];
  entries.forEach(function(e){
    var hs = String(e.hsCode || '').replace(/\D/g,'');
    if(!hs) return;
    var existing = INVEST_AI_HS_RU[hs] || INVEST_AI_HS_RU[hs.slice(0,6)] || cache[hs] || cache[hs.slice(0,6)];
    if(existing){ e.displayName = existing; return; }
    pending.push({ hs:hs, en:String(e.displayName || e.name_en || e.hsCode || '').trim() });
  });
  if(!pending.length) return;
  // Limit batch size to ~50 entries per Gemini call
  var BATCH = 50;
  for(var i=0; i<pending.length; i+=BATCH){
    var chunk = pending.slice(i, i + BATCH);
    var prompt = 'Translate each English HS-code product description into a SHORT Russian commercial-style name (2-6 words). Return STRICT JSON: an object mapping HS code (string) to Russian translation. No commentary, no markdown.\n\nInput (JSON array):\n' + JSON.stringify(chunk);
    try {
      if(typeof callGemini !== 'function') break;
      var resp = await callGemini({
        contents:[{ parts:[{ text: prompt }] }],
        generationConfig:{ temperature: 0.2, responseMimeType: 'application/json' }
      });
      var raw = (typeof geminiText === 'function') ? geminiText(resp) : '';
      if(!raw) continue;
      var parsed = (typeof safeParseJSON === 'function') ? safeParseJSON(raw) : null;
      if(!parsed || typeof parsed !== 'object') {
        try { parsed = JSON.parse(raw); } catch(_p){ parsed = null; }
      }
      if(!parsed || typeof parsed !== 'object') continue;
      Object.keys(parsed).forEach(function(k){
        var hsK = String(k).replace(/\D/g,'');
        var ru = String(parsed[k] || '').trim();
        if(hsK && ru) cache[hsK] = ru;
      });
    } catch(_e){ /* swallow — keep going */ }
  }
  investAiSaveHsRuCache(cache);
  // Apply to entries (after cache update)
  entries.forEach(function(e){
    var hs = String(e.hsCode || '').replace(/\D/g,'');
    if(!hs) return;
    var ru = INVEST_AI_HS_RU[hs] || INVEST_AI_HS_RU[hs.slice(0,6)] || cache[hs] || cache[hs.slice(0,6)];
    if(ru) e.displayName = ru;
  });
}

function investAiBuildExecutiveDashboardSheet(ctx, styles){
  var rows = [];
  rows.push([INVEST_AI_RU.navoiPrefix + String(ctx.material || '').toUpperCase() + INVEST_AI_RU.titleSuffix,'','','','','','','','']);
  rows.push([INVEST_AI_RU.rawMaterial + ': ' + (ctx.material || '—') + ' — ' + ((ctx.raw && (ctx.raw.name_en || ctx.raw.name_uz)) || INVEST_AI_RU.mappedNote),'','','','','','','','']);
  rows.push([]);
  rows.push([INVEST_AI_RU.kpiProducts, INVEST_AI_RU.kpiRegionalDemand + ' ' + ctx.analysisYear, INVEST_AI_RU.kpiUzbImports, INVEST_AI_RU.kpiPriorityA, INVEST_AI_RU.kpiCountries, INVEST_AI_RU.kpiTopMarket,'','','']);
  rows.push([
    ctx.entries.length,
    investAiFmtShortUsd(ctx.totalRegionalDemand),
    investAiFmtShortUsd(ctx.totalUzbImports),
    ctx.priorityACount,
    ctx.countryCount,
    investAiTranslateCountry(ctx.topCountry.name) + ' · ' + investAiFmtShortUsd(ctx.topCountryValue),
    '','',''
  ]);
  rows.push([]);
  rows.push([INVEST_AI_RU.hRank, INVEST_AI_RU.hHs, INVEST_AI_RU.hProduct, INVEST_AI_RU.hRegionalDemand, INVEST_AI_RU.hUzbImports, INVEST_AI_RU.hTopImporter, INVEST_AI_RU.hTopSupplier, INVEST_AI_RU.hCagr, INVEST_AI_RU.hPriority]);
  // Show ALL entries from the raw material (not capped at 15) — user requested dynamic count
  (ctx.entries.length ? ctx.entries : [{
    hsCode:'—', displayName:'Для этого сырья не найдено сопоставленных продуктов', analysisValue:0, uzbValue:0, topImporter:{name:'—'}, cagr:null, priority:'Priority D'
  }]).forEach(function(entry, idx){
    rows.push([
      idx + 1,
      entry.hsCode || '—',
      entry.displayName || '—',
      investAiFmtUsd(entry.analysisValue || 0),
      investAiFmtUsd(entry.uzbValue || 0),
      investAiTranslateCountry((entry.topImporter && entry.topImporter.name) || ''),
      entry.hasSnapshot ? 'Требуются таможенные данные на уровне поставщиков' : 'Данные поставщиков отсутствуют в кэше',
      investAiFmtPct(entry.cagr),
      investAiTranslatePriority(entry.priority || 'Priority D')
    ]);
  });
  rows.push([]);
  rows.push([INVEST_AI_RU.secExecSummary,'','','','','','','','']);
  var summaryLines = (ctx.executiveSummaryRows.length ? ctx.executiveSummaryRows.map(function(row){ return row[0]; }) : ctx.summaryLines.slice(0,6));
  summaryLines.slice(0,6).forEach(function(line){
    rows.push([line,'','','','','','','','']);
  });
  rows.push([]);
  rows.push([INVEST_AI_RU.secVerification,'','','','','','','','']);
  (ctx.verificationRows.length ? ctx.verificationRows : [['△ Данные поставщиков на уровне таможни недоступны в текущем кэше'],['⚠ Видимость торговли с Россией может содержать пробелы из-за санкций и переадресаций']]).slice(0,4).forEach(function(row){
    rows.push([row[0],'','','','','','','','']);
  });

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:8},{wch:12},{wch:42},{wch:18},{wch:18},{wch:16},{wch:20},{wch:10},{wch:12}];
  // Dinamik entry soni — endi cheklanmagan
  var entriesCount = Math.max(ctx.entries.length || 1, 1);
  investAiMerge(ws,0,0,0,8);
  investAiMerge(ws,1,0,1,8);
  investAiMerge(ws,10 + entriesCount,0,10 + entriesCount,8);
  var summaryStart = 11 + entriesCount;
  for(var s=0;s<summaryLines.slice(0,6).length;s++) investAiMerge(ws, summaryStart + s,0,summaryStart + s,8);
  investAiMerge(ws, summaryStart + summaryLines.slice(0,6).length + 1,0,summaryStart + summaryLines.slice(0,6).length + 1,8);
  var verificationStart = summaryStart + summaryLines.slice(0,6).length + 2;
  var verificationCount = (ctx.verificationRows.length ? ctx.verificationRows : [['x'],['y']]).slice(0,4).length;
  for(var v=0; v<verificationCount; v++) investAiMerge(ws, verificationStart + v,0,verificationStart + v,8);

  investAiStyleRow(ws,0,9,styles.title);
  investAiStyleRow(ws,1,9,styles.subtitle);
  investAiStyleRow(ws,3,6,styles.metricHead);
  investAiStyleRow(ws,4,6,styles.metricValue);
  investAiStyleRow(ws,6,9,styles.header);
  investAiStyleRowsAlternating(ws,7,7 + entriesCount - 1,9,styles);
  investAiStyleRow(ws,10 + entriesCount,9,styles.section);
  for(var sr=summaryStart; sr<summaryStart + summaryLines.slice(0,6).length; sr++) investAiStyleRow(ws,sr,9,styles.body);
  investAiStyleRow(ws,summaryStart + summaryLines.slice(0,6).length + 1,9,styles.section);
  for(var vr=verificationStart; vr<verificationStart + verificationCount; vr++) investAiStyleRow(ws,vr,9,styles.note);
  return { name: INVEST_AI_RU.sheetExec, ws:ws };
}

function investAiBuildProductMapSheet(ctx, styles){
  var rows = [];
  rows.push(['КАРТА ПРОДУКТОВ — ' + String(ctx.material || '').toUpperCase(),'','','','','','','','']);
  rows.push(['','','','','','','','','']);
  rows.push(['#', INVEST_AI_RU.hCategory, INVEST_AI_RU.hProduct, INVEST_AI_RU.hHs, INVEST_AI_RU.hLevel, INVEST_AI_RU.hCapital, INVEST_AI_RU.hTechnology, INVEST_AI_RU.hEndUse, INVEST_AI_RU.hFeasibility]);
  var lastCategory = '';
  var count = 0;
  (ctx.entries.length ? ctx.entries : []).forEach(function(entry){
    if(entry.category !== lastCategory){
      rows.push([entry.category,'','','','','','','','']);
      lastCategory = entry.category;
    }
    count += 1;
    rows.push([
      count,
      entry.category,
      entry.displayName,
      entry.hsCode || '—',
      entry.level,
      entry.capital,
      entry.technology,
      entry.endUse || 'Требует проверки',
      entry.feasibility
    ]);
  });
  if(count === 0) rows.push(['1','RAW','Сопоставленный продукт не найден','—','—','—','—','Требует сопоставления','Низкий']);

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:6},{wch:15},{wch:38},{wch:12},{wch:12},{wch:14},{wch:16},{wch:28},{wch:12}];
  investAiMerge(ws,0,0,0,8);
  investAiStyleRow(ws,0,9,styles.title);
  investAiStyleRow(ws,2,9,styles.header);
  for(var r=3;r<rows.length;r++){
    if(rows[r][1] === '' && rows[r][0]) investAiStyleRow(ws,r,9,styles.group);
    else investAiStyleRow(ws,r,9,(r % 2 === 0 ? styles.alt : styles.body));
  }
  return { name: INVEST_AI_RU.sheetProductMap, ws:ws };
}

function investAiBuildTradeDataSheet(ctx, styles){
  var rows = [];
  rows.push(['ТОРГОВЫЕ ДАННЫЕ UN COMTRADE — ' + String(ctx.material || '').toUpperCase(),'','','','','','','','','']);
  rows.push([]);
  rows.push([INVEST_AI_RU.hHs, INVEST_AI_RU.hProduct, INVEST_AI_RU.hCountry, '2021 ($)','2022 ($)','2023 ($)','2024 ($)', INVEST_AI_RU.hCagr, INVEST_AI_RU.hTrend, 'Качество']);
  ctx.entries.forEach(function(entry){
    TARGET_COUNTRIES.forEach(function(target){
      var country = (entry.countryMap || {})[target.code];
      if(!country) return;
      var y2021 = Number((country.years || {})['2021'] || 0) || 0;
      var y2022 = Number((country.years || {})['2022'] || 0) || 0;
      var y2023 = Number((country.years || {})['2023'] || 0) || 0;
      var y2024 = Number((country.years || {})['2024'] || 0) || 0;
      if(!(y2021 || y2022 || y2023 || y2024 || country.status === 'rate_limited')) return;
      var series = {'2021':y2021,'2022':y2022,'2023':y2023,'2024':y2024};
      var cagr = investAiCalcCagr(series);
      var trend = y2024 > y2023 ? 'Рост' : (y2024 < y2023 ? 'Спад' : 'Стабильно');
      var quality = country.status === 'ok' ? 'Подтверждено' : (country.status === 'rate_limited' ? 'Лимит API / частично' : 'Нет данных');
      rows.push([
        entry.hsCode || '—',
        entry.displayName,
        investAiTranslateCountry(target.name),
        investAiFmtUsd(y2021),
        investAiFmtUsd(y2022),
        investAiFmtUsd(y2023),
        investAiFmtUsd(y2024),
        investAiFmtPct(cagr),
        trend,
        quality
      ]);
    });
  });
  if(rows.length === 3) rows.push(['—','Снимок данных не найден','—','$0','$0','$0','$0','—','Стабильно','Нет данных в кэше']);

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:10},{wch:36},{wch:18},{wch:13},{wch:13},{wch:13},{wch:13},{wch:10},{wch:10},{wch:20}];
  investAiMerge(ws,0,0,0,9);
  investAiStyleRow(ws,0,10,styles.title);
  investAiStyleRow(ws,2,10,styles.header);
  investAiStyleRowsAlternating(ws,3,rows.length - 1,10,styles);
  return { name: INVEST_AI_RU.sheetTrade, ws:ws };
}

function investAiBuildCountryMatrixSheet(ctx, styles){
  var header = [INVEST_AI_RU.hHs, INVEST_AI_RU.hProduct].concat(TARGET_COUNTRIES.map(function(target){ return investAiTranslateCountry(target.name); })).concat(['ИТОГО']);
  var rows = [];
  rows.push(['МАТРИЦА ИМПОРТА — ' + String(ctx.material || '').toUpperCase() + ' — ' + ctx.analysisYear + ' ($)']);
  rows.push([]);
  rows.push(header);
  ctx.entries.forEach(function(entry){
    var total = 0;
    var row = [entry.hsCode || '—', entry.displayName];
    TARGET_COUNTRIES.forEach(function(target){
      var value = Number((((entry.countryMap || {})[target.code] || {}).years || {})[ctx.analysisYear] || 0) || 0;
      total += value;
      row.push(investAiFmtUsd(value));
    });
    row.push(investAiFmtUsd(total));
    rows.push(row);
  });
  if(rows.length === 3){
    var emptyRow = ['—','Кэш матрицы стран отсутствует'];
    while(emptyRow.length < header.length) emptyRow.push('—');
    rows.push(emptyRow);
  }

  var ws = XLSX.utils.aoa_to_sheet(rows);
  var cols = [{wch:10},{wch:36}];
  TARGET_COUNTRIES.forEach(function(){ cols.push({wch:14}); });
  cols.push({wch:14});
  ws['!cols'] = cols;
  investAiMerge(ws,0,0,0,header.length - 1);
  investAiStyleRow(ws,0,header.length,styles.title);
  investAiStyleRow(ws,2,header.length,styles.header);
  investAiStyleRowsAlternating(ws,3,rows.length - 1,header.length,styles);
  return { name: INVEST_AI_RU.sheetCountryMatrix, ws:ws };
}

function investAiBuildSuppliersSheet(ctx, styles){
  var rows = [];
  rows.push(['АНАЛИЗ ПОСТАВЩИКОВ — ' + String(ctx.material || '').toUpperCase(),'','','','','','','','','']);
  rows.push([]);
  rows.push([INVEST_AI_RU.hHs, INVEST_AI_RU.hProduct, INVEST_AI_RU.hImport, 'Поставщик №1', INVEST_AI_RU.hShare, 'Поставщик №2', INVEST_AI_RU.hShare, 'Поставщик №3', INVEST_AI_RU.hShare, INVEST_AI_RU.hNote]);
  var groupedCountries = TARGET_COUNTRIES.slice().sort(function(a,b){
    var aVal = ctx.entries.reduce(function(sum, entry){ return sum + (Number((((entry.countryMap || {})[a.code] || {}).years || {})[ctx.analysisYear] || 0) || 0); },0);
    var bVal = ctx.entries.reduce(function(sum, entry){ return sum + (Number((((entry.countryMap || {})[b.code] || {}).years || {})[ctx.analysisYear] || 0) || 0); },0);
    return bVal - aVal;
  }).slice(0,5);
  groupedCountries.forEach(function(target){
    rows.push([investAiTranslateCountry(target.name),'','','','','','','','','']);
    ctx.entries.filter(function(entry){
      return Number((((entry.countryMap || {})[target.code] || {}).years || {})[ctx.analysisYear] || 0) > 0;
    }).slice(0,6).forEach(function(entry){
      rows.push([
        entry.hsCode || '—',
        entry.displayName,
        investAiFmtUsd((((entry.countryMap || {})[target.code] || {}).years || {})[ctx.analysisYear] || 0),
        '—',
        '—',
        '—',
        '—',
        '—',
        '—',
        'Данные поставщиков на уровне таможни недоступны; уточните по таможенным/BL-источникам'
      ]);
    });
  });
  if(rows.length === 3){
    rows.push(['Нет записей поставщиков в текущем наборе данных','','','','','','','','','Используйте поиск по импортёрам/компаниям']);
  }

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:10},{wch:34},{wch:14},{wch:18},{wch:8},{wch:18},{wch:8},{wch:18},{wch:8},{wch:34}];
  investAiMerge(ws,0,0,0,9);
  investAiStyleRow(ws,0,10,styles.title);
  investAiStyleRow(ws,2,10,styles.header);
  for(var r=3;r<rows.length;r++){
    if(rows[r][0] && !rows[r][1] && !rows[r][2]) investAiStyleRow(ws,r,10,styles.group);
    else investAiStyleRow(ws,r,10,(r % 2 === 0 ? styles.alt : styles.body));
  }
  return { name: INVEST_AI_RU.sheetSuppliers, ws:ws };
}

function investAiBuildInvestmentPrioritySheet(ctx, styles){
  var rows = [];
  rows.push(['МАТРИЦА ИНВЕСТПРИОРИТЕТОВ — ' + String(ctx.material || '').toUpperCase(),'','','','','','','','','','']);
  rows.push([]);
  rows.push(['Пр.', INVEST_AI_RU.hHs, INVEST_AI_RU.hProduct, INVEST_AI_RU.hRegionalDemand, INVEST_AI_RU.hUzbImports, INVEST_AI_RU.kpiTopMarket, INVEST_AI_RU.hCagr, INVEST_AI_RU.hLevel, INVEST_AI_RU.hCapital, 'Конкур.', 'Вывод']);
  ctx.entries.forEach(function(entry){
    rows.push([
      entry.priority.replace('Priority ',''),
      entry.hsCode || '—',
      entry.displayName,
      investAiFmtUsd(entry.analysisValue || 0),
      investAiFmtUsd(entry.uzbValue || 0),
      investAiTranslateCountry((entry.topImporter && entry.topImporter.name) || ''),
      investAiFmtPct(entry.cagr),
      entry.level,
      entry.capital,
      entry.competitiveness,
      entry.verdict
    ]);
  });
  if(rows.length === 3) rows.push(['D','—','Нет данных для матрицы инвестиций','$0','$0','—','—','—','—','Слабый','Требуется сопоставление продуктов']);

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:6},{wch:10},{wch:36},{wch:15},{wch:15},{wch:16},{wch:10},{wch:12},{wch:12},{wch:12},{wch:18}];
  investAiMerge(ws,0,0,0,10);
  investAiStyleRow(ws,0,11,styles.title);
  investAiStyleRow(ws,2,11,styles.header);
  investAiStyleRowsAlternating(ws,3,rows.length - 1,11,styles);
  for(var pr=3; pr<rows.length; pr++){
    var badgeCol = 0;
    var ref = XLSX.utils.encode_cell({r:pr,c:badgeCol});
    if(ws[ref]){
      var fill = investAiPriorityBadgeColor('Priority ' + String(rows[pr][0] || 'D'));
      ws[ref].s = {
        font:{name:'Arial',sz:10,bold:true,color:{rgb:'0F172A'}},
        fill:{fgColor:{rgb:fill}},
        alignment:{horizontal:'center',vertical:'center'},
        border:{
          top:{style:'thin',color:{rgb:'94A3B8'}},
          bottom:{style:'thin',color:{rgb:'94A3B8'}},
          left:{style:'thin',color:{rgb:'94A3B8'}},
          right:{style:'thin',color:{rgb:'94A3B8'}}
        }
      };
    }
  }
  return { name: INVEST_AI_RU.sheetPriority, ws:ws };
}

function investAiBuildImportSubUzSheet(ctx, styles){
  var rows = [];
  rows.push(['ИМПОРТОЗАМЕЩЕНИЕ УЗБЕКИСТАНА — ' + String(ctx.material || '').toUpperCase(),'','','','','','','']);
  rows.push([]);
  rows.push([INVEST_AI_RU.hHs, INVEST_AI_RU.hProduct, '2021 ($)','2022 ($)','2023 ($)','2024 ($)', INVEST_AI_RU.hCagr, 'Потенциал']);
  ctx.entries.forEach(function(entry){
    var uz = ((entry.countryMap || {}).UZ || {}).years || {};
    rows.push([
      entry.hsCode || '—',
      entry.displayName,
      investAiFmtUsd(uz['2021'] || 0),
      investAiFmtUsd(uz['2022'] || 0),
      investAiFmtUsd(uz['2023'] || 0),
      investAiFmtUsd(uz['2024'] || 0),
      investAiFmtPct(investAiCalcCagr(uz)),
      entry.priority === 'Priority A' ? 'Высокий' : (entry.priority === 'Priority B' ? 'Средний' : 'Выборочный')
    ]);
  });
  if(rows.length === 3) rows.push(['—','История импорта Узбекистана не найдена','$0','$0','$0','$0','—','Проверить позже']);

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:10},{wch:36},{wch:13},{wch:13},{wch:13},{wch:13},{wch:10},{wch:14}];
  investAiMerge(ws,0,0,0,7);
  investAiStyleRow(ws,0,8,styles.title);
  investAiStyleRow(ws,2,8,styles.header);
  investAiStyleRowsAlternating(ws,3,rows.length - 1,8,styles);
  return { name: INVEST_AI_RU.sheetImportSubUz, ws:ws };
}

function investAiBuildImportSubRegionalSheet(ctx, styles){
  var rows = [];
  rows.push(['ИМПОРТОЗАМЕЩЕНИЕ — РЕГИОН — ' + String(ctx.material || '').toUpperCase(),'','','','','']);
  rows.push([]);
  rows.push([INVEST_AI_RU.hCountry, INVEST_AI_RU.hHs, INVEST_AI_RU.hProduct, ctx.analysisYear + ' ' + INVEST_AI_RU.hImport, INVEST_AI_RU.hCagr, INVEST_AI_RU.hNote]);
  TARGET_COUNTRIES.forEach(function(target){
    rows.push(['== ' + investAiTranslateCountry(target.name) + ' ===','','','','','']);
    ctx.entries.filter(function(entry){
      return Number((((entry.countryMap || {})[target.code] || {}).years || {})[ctx.analysisYear] || 0) > 0;
    }).slice(0,10).forEach(function(entry){
      rows.push([
        investAiTranslateCountry(target.name),
        entry.hsCode || '—',
        entry.displayName,
        investAiFmtUsd((((entry.countryMap || {})[target.code] || {}).years || {})[ctx.analysisYear] || 0),
        investAiFmtPct(entry.cagr),
        entry.priority === 'Priority A' ? 'Сильный кандидат для аутрича' : 'Требует проверки'
      ]);
    });
  });
  if(rows.length === 3) rows.push(['Регион','—','Региональные данные не закэшированы','$0','—','Сначала запустите импорт-анализ']);

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:18},{wch:10},{wch:36},{wch:16},{wch:10},{wch:28}];
  investAiMerge(ws,0,0,0,5);
  investAiStyleRow(ws,0,6,styles.title);
  investAiStyleRow(ws,2,6,styles.header);
  for(var r=3;r<rows.length;r++){
    if(/^==/.test(String(rows[r][0] || ''))) investAiStyleRow(ws,r,6,styles.group);
    else investAiStyleRow(ws,r,6,(r % 2 === 0 ? styles.alt : styles.body));
  }
  return { name: INVEST_AI_RU.sheetImportSubRegional, ws:ws };
}

function investAiBuildMethodologySheet(ctx, styles){
  var today = new Date();
  var rows = [];
  rows.push(['МЕТОДОЛОГИЯ И КАЧЕСТВО ДАННЫХ','']);
  rows.push([]);
  rows.push([INVEST_AI_RU.secDataSource,'UN Comtrade API / официальные кэшированные снимки + AI-нарратив']);
  rows.push([INVEST_AI_RU.secPeriods,'2021–2024']);
  rows.push([INVEST_AI_RU.secClassification,'ТН ВЭД 4/6 знаков, сопоставлено с базой продуктов Навои']);
  rows.push(['Кэшированные снимки', String(ctx.entries.filter(function(entry){ return entry.hasSnapshot; }).length)]);
  rows.push(['Продуктов рассмотрено', String(ctx.entries.length)]);
  rows.push(['Крупнейший рынок (' + ctx.analysisYear + ')', investAiTranslateCountry(ctx.topCountry.name) + ' — ' + investAiFmtUsd(ctx.topCountryValue)]);
  rows.push(['Верификация', ctx.verificationRows.length ? ctx.verificationRows.map(function(row){ return row[0]; }).slice(0,2).join(' | ') : '△ Требуется верификация до выхода на инвесторов']);
  rows.push(['Оговорка по России','Видимость торговли с Россией может быть неполной из-за санкций, переадресации, пробелов в зеркальных данных и классификационного шума.']);
  rows.push(['Организация','Управление инвестиций Навоийской области']);
  rows.push(['Дата', today.toLocaleDateString('ru-RU',{year:'numeric',month:'long',day:'numeric'})]);
  rows.push([]);
  rows.push(['Рекомендуемые следующие шаги','']);
  (ctx.nextSteps.length ? ctx.nextSteps : [['Проверить ТН ВЭД с таможенной практикой'],['Обновить данные UN Comtrade перед аутричем'],['Проверить данные поставщиков по таможне или коммерческим источникам']]).slice(0,6).forEach(function(row){
    rows.push([row[0],'']);
  });

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:26},{wch:86}];
  investAiMerge(ws,0,0,0,1);
  investAiStyleRow(ws,0,2,styles.title);
  for(var mr=2;mr<=10;mr++) investAiStyleRow(ws,mr,2,(mr % 2 === 0 ? styles.alt : styles.body));
  investAiStyleRow(ws,12,2,styles.section);
  for(var nr=13; nr<rows.length; nr++) investAiStyleRow(ws,nr,2,styles.note);
  return { name: INVEST_AI_RU.sheetMethodology, ws:ws };
}

function buildInvestAiWorkbookData(material, markdown){
  var ctx = investAiBuildWorkbookContext(material, markdown);
  // Apply static + cached RU product names synchronously
  if(Array.isArray(ctx.entries)){
    ctx.entries.forEach(function(e){
      var ru = investAiLookupHsRu(e.hsCode);
      if(ru) e.displayName = ru;
    });
  }
  // Top country also translated for methodology sheet etc.
  if(ctx.topCountry && ctx.topCountry.name){
    ctx.topCountry.nameRu = investAiTranslateCountry(ctx.topCountry.name);
  }
  var styles = investAiWorkbookStyles();
  return [
    investAiBuildExecutiveDashboardSheet(ctx, styles),
    investAiBuildProductMapSheet(ctx, styles),
    investAiBuildTradeDataSheet(ctx, styles),
    investAiBuildCountryMatrixSheet(ctx, styles),
    investAiBuildSuppliersSheet(ctx, styles),
    investAiBuildInvestmentPrioritySheet(ctx, styles),
    investAiBuildImportSubUzSheet(ctx, styles),
    investAiBuildImportSubRegionalSheet(ctx, styles),
    investAiBuildMethodologySheet(ctx, styles)
  ];
}

// Convert column number (1-based) to Excel letter (A, B, ..., AA, AB)
function investAiColLetter(col){
  var s = '';
  while(col > 0){
    var rem = (col - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    col = Math.floor((col - 1) / 26);
  }
  return s;
}

// Format USD as compact string ($1.5B, $447M, $12K)
function investAiFmtCompactUsd(v){
  v = Number(v) || 0;
  if(v >= 1e9) return '$' + (v/1e9).toFixed(1).replace(/\.0$/,'') + ' млрд';
  if(v >= 1e6) return '$' + (v/1e6).toFixed(0) + ' млн';
  if(v >= 1e3) return '$' + (v/1e3).toFixed(0) + ' тыс';
  return '$' + Math.round(v);
}

// Helpers to forcefully override inherited column/row formats from the template
function _investAiSetUsd(cell, value){
  cell.value = (value == null || value === '') ? null : Number(value);
  cell.numFmt = '$#,##0';
  cell.style = Object.assign({}, cell.style || {}, { numFmt: '$#,##0' });
}
function _investAiSetPct(cell, value){
  cell.value = (value == null || value === '') ? null : Number(value);
  cell.numFmt = '0.0%';
  cell.style = Object.assign({}, cell.style || {}, { numFmt: '0.0%' });
}
function _investAiSetText(cell, value){
  cell.value = value == null ? null : String(value);
  // Clear inherited numeric formats so text doesn't get number-formatted
  cell.numFmt = '@';
  cell.style = Object.assign({}, cell.style || {}, { numFmt: '@' });
}
function _investAiSetGeneral(cell, value){
  cell.value = value;
  cell.numFmt = 'General';
  cell.style = Object.assign({}, cell.style || {}, { numFmt: 'General' });
}

async function exportInvestAiWorkbook(){
  if(typeof ExcelJS === 'undefined' || !ExcelJS){
    toast('⚠️ ExcelJS kutubxonasi topilmadi','error');
    return;
  }
  var material = String(_investAiCurrentMaterial || ((document.getElementById('materialAiInput')||{}).value || '')).trim();
  var markdown = String(_investAiMarkdown || '').trim();
  if(!material || !markdown){
    toast('⚠️ Avval AI tahlilni yakunlang','error');
    return;
  }
  if(!_investAiTradeContext || investAiNormalizeText(_investAiTradeContext.material) !== investAiNormalizeText(material) || !_investAiTradeContext.officialDataAvailable){
    toast('⚠️ Excel faqat UN Comtrade asosidagi tahlildan keyin yaratiladi','error');
    return;
  }

  var ctx = investAiBuildWorkbookContext(material, markdown);

  // Mahsulot nomlarini ruschaga tarjima qilish (static map + Gemini fallback)
  var translatingToast = (typeof toastLoading === 'function') ? toastLoading('🔤 Mahsulot nomlari ruschaga tarjima qilinmoqda...') : null;
  try {
    await investAiBatchTranslateProductsRu(ctx.entries);
  } catch(_e){ console.warn('[invest-ai] product RU translate failed', _e); }
  finally { if(translatingToast && typeof translatingToast.close === 'function') translatingToast.close(); }

  // Apply static + cached RU names to entries (safety pass)
  ctx.entries.forEach(function(e){
    var ru = investAiLookupHsRu(e.hsCode);
    if(ru) e.displayName = ru;
  });

  var loadingToast = (typeof toastLoading === 'function') ? toastLoading('📥 Шаблон загружается...') : null;
  try {
    // Shablonni ExcelJS bilan yuklash — barcha style/border/format saqlanadi
    var resp = await fetch('assets/templates/navoi_analysis_template_ru.xlsx?t=' + Date.now(), { cache:'no-store' });
    if(!resp.ok) throw new Error('Шаблон не загружен (HTTP ' + resp.status + ')');
    var buf = await resp.arrayBuffer();
    var wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);

    // ═══ Sheet 1: Главная панель ═══
    var ws1 = wb.getWorksheet('Главная панель');
    if(ws1){
      var matUpper = String(material || '').toUpperCase();
      // Title (A1) — material nomi bilan
      ws1.getCell('A1').value = matUpper + ' — АНАЛИЗ ТОРГОВЛИ И ИНВЕСТИЦИОННЫЕ ВОЗМОЖНОСТИ';
      // Subtitle (A2)
      ws1.getCell('A2').value = 'Сырьё: ' + material + ' — Анализ регионального импортного спроса (Данные UN Comtrade ' + ctx.analysisYear + ')';
      // KPI cards (row 4)
      ws1.getCell('A4').value = investAiFmtCompactUsd(ctx.totalRegionalDemand);
      ws1.getCell('C4').value = investAiFmtCompactUsd(ctx.totalUzbImports);
      ws1.getCell('E4').value = ctx.entries.length;
      ws1.getCell('G4').value = ctx.entries.filter(function(e){ return Number(e.analysisValue || 0) >= 10000000; }).length;
      // KPI labels (row 5) — already in template, just adapt 4th label dynamically
      ws1.getCell('E5').value = 'Продуктов проанализировано';
      ws1.getCell('G5').value = 'Продуктов с >$10 млн спросом';
      // TOP section title (row 7)
      ws1.getCell('A7').value = 'ТОП ПРОДУКТОВ ПО РЕГИОНАЛЬНОМУ ИМПОРТНОМУ СПРОСУ (' + ctx.analysisYear + ')';
      // Headers (row 8) — already in template, leave
      // Rows 9 onward: TOP-N entries — clear old NavoiAzot data, fill new
      // Template has 20 product rows (9-28). Clear all first.
      for(var r = 9; r <= 28; r++){
        for(var c = 1; c <= 8; c++){
          var cell = ws1.getCell(r, c);
          cell.value = null;
        }
      }
      // Sort entries by analysisValue desc and fill
      var sortedEntries = ctx.entries.slice().sort(function(a,b){ return (Number(b.analysisValue)||0) - (Number(a.analysisValue)||0); });
      sortedEntries.slice(0, 20).forEach(function(entry, idx){
        var rowIdx = 9 + idx;
        _investAiSetGeneral(ws1.getCell('A' + rowIdx), idx + 1);
        _investAiSetText(ws1.getCell('B' + rowIdx), entry.hsCode || '—');
        _investAiSetText(ws1.getCell('C' + rowIdx), entry.displayName || '—');
        _investAiSetUsd(ws1.getCell('D' + rowIdx), Number(entry.analysisValue) || 0);
        _investAiSetUsd(ws1.getCell('E' + rowIdx), Number(entry.uzbValue) || 0);
        _investAiSetText(ws1.getCell('F' + rowIdx), investAiTranslateCountry((entry.topImporter && entry.topImporter.name) || '—'));
        _investAiSetUsd(ws1.getCell('G' + rowIdx), Number((entry.topImporter && entry.topImporter.value) || 0));
        _investAiSetText(ws1.getCell('H' + rowIdx), investAiTranslatePriority(entry.priority || 'Priority D'));
      });
    }

    // ═══ Sheet 2: Карта продуктов — material'ning xomashyo→mahsulot zanjiri ═══
    var ws2 = wb.getWorksheet('Карта продуктов НавоиАзот') || wb.getWorksheet('Карта продуктов');
    if(ws2){
      // Sheet tab nomini ham yangilab qoyamiz (НавоиАзот yozuvi qolmasligi uchun)
      try { ws2.name = 'Карта продуктов'; } catch(_e){}
      ws2.getCell('A1').value = 'КАРТА ПРОДУКТОВ — ' + matUpper;
      ws2.getCell('A2').value = 'Инвестиционная возможность: переработка сырья «' + material + '» в высокомаржинальную продукцию';
      // Row 4 — generic headers (NavoiAzot mention olib tashlandi)
      ws2.getCell('A4').value = '№';
      ws2.getCell('B4').value = 'Сырьё';
      ws2.getCell('C4').value = 'Код ТН ВЭД сырья';
      ws2.getCell('D4').value = 'Цепочка создания стоимости';
      ws2.getCell('E4').value = 'Продукт';
      ws2.getCell('F4').value = 'Код ТН ВЭД';
      ws2.getCell('G4').value = 'Технология / Процесс';
      // Clear rows 5+ from template
      for(var r2 = 5; r2 <= 100; r2++){
        for(var c2 = 1; c2 <= 15; c2++){
          ws2.getCell(r2, c2).value = null;
        }
      }
      ctx.entries.forEach(function(entry, idx){
        var rowIdx = 5 + idx;
        ws2.getCell('A' + rowIdx).value = idx + 1;
        ws2.getCell('B' + rowIdx).value = material;
        ws2.getCell('C' + rowIdx).value = (ctx.raw && ctx.raw.hs_code) || '—';
        ws2.getCell('D' + rowIdx).value = entry.category || entry.level || '—';
        ws2.getCell('E' + rowIdx).value = entry.displayName || '—';
        ws2.getCell('F' + rowIdx).value = entry.hsCode || '—';
        ws2.getCell('G' + rowIdx).value = entry.technology || entry.endUse || '—';
      });
    }

    // ═══ Sheet 3: Торговые данные — har mahsulot uchun yillik × davlat blok ═══
    var ws3 = wb.getWorksheet('Торговые данные — Все продукты') || wb.getWorksheet('Торговые данные');
    if(ws3){
      ws3.getCell('A1').value = 'ИМПОРТ ПРОДУКЦИИ ПО СТРАНАМ — ' + matUpper + ' (2021–2024, ДОЛЛ. США)';
      ws3.getCell('A2').value = 'Источник: UN Comtrade | Поток: Импорт | Партнёр: Мир (всего) | Значения в долл. США';
      // Tozalash — shablondagi 30 blok (taxminan 290 qator) — kengroq diapazon
      for(var r3 = 3; r3 <= 350; r3++){
        for(var c3 = 1; c3 <= 25; c3++){
          ws3.getCell(r3, c3).value = null;
        }
      }
      // 13 ta MOY davlat ro'yxati (TARGET_COUNTRIES) — ruschada
      var moyCountries = TARGET_COUNTRIES.map(function(t){ return { code: t.code, name: investAiTranslateCountry(t.name) }; });
      var blockYears = ['2021','2022','2023','2024'];
      var curRow = 4;
      ctx.entries.forEach(function(entry){
        // Block header
        var totalThisYear = Number(entry.analysisValue || 0);
        ws3.getCell('A' + curRow).value = 'ТН ВЭД ' + (entry.hsCode || '—') + ' — ' + (entry.displayName || '—') + ' | Региональный итого ' + ctx.analysisYear + ': ' + investAiFmtCompactUsd(totalThisYear);
        curRow++;
        // Year header row
        ws3.getCell('A' + curRow).value = 'Год';
        moyCountries.forEach(function(co, ci){
          ws3.getCell(curRow, 2 + ci).value = co.name;
        });
        ws3.getCell(curRow, 2 + moyCountries.length).value = 'Рег. итого';
        curRow++;
        // 4 yil x davlatlar
        blockYears.forEach(function(yr){
          _investAiSetText(ws3.getCell('A' + curRow), yr);
          var regTotal = 0;
          moyCountries.forEach(function(co, ci){
            var v = Number((((entry.countryMap || {})[co.code] || {}).years || {})[yr] || 0) || 0;
            _investAiSetUsd(ws3.getCell(curRow, 2 + ci), v || null);
            regTotal += v;
          });
          _investAiSetUsd(ws3.getCell(curRow, 2 + moyCountries.length), regTotal || null);
          curRow++;
        });
        // Spacer row
        curRow++;
      });
    }

    // ═══ Sheet 4: Профили стран-импортёров — har bir davlat 2024 import jami ═══
    var ws4 = wb.getWorksheet('Профили стран-импортёров') || wb.getWorksheet('Профили стран');
    if(ws4){
      ws4.getCell('A1').value = 'ПРОФИЛЬ ИМПОРТНОГО СПРОСА СТРАН — ' + matUpper + ' (' + ctx.analysisYear + ', ДОЛЛ. США)';
      // Tozalash — shablon Q-AC (17-30) ustunlarda NavoiAzot mahsulotlar bo'yicha breakdown qoldirgan
      for(var r4 = 2; r4 <= 100; r4++){
        for(var c4 = 1; c4 <= 50; c4++){
          var c4Cell = ws4.getCell(r4, c4);
          c4Cell.value = null;
          // Format ham tozalanadi (shablonning asl style'i ustun-darajasida ishlaydi, lekin
          // bo'sh hujayralar jadvalda chiziq qoldirmasligi uchun)
        }
      }
      // Davlat → jami import (2024)
      var moy4 = TARGET_COUNTRIES.map(function(t){ return { code: t.code, name: investAiTranslateCountry(t.name), total: 0 }; });
      ctx.entries.forEach(function(entry){
        moy4.forEach(function(co){
          var v = Number((((entry.countryMap || {})[co.code] || {}).years || {})[ctx.analysisYear] || 0) || 0;
          co.total += v;
        });
      });
      moy4.sort(function(a,b){ return b.total - a.total; });
      // Header
      ws4.getCell('A3').value = '№';
      ws4.getCell('B3').value = 'Страна';
      ws4.getCell('C3').value = 'Импорт ' + ctx.analysisYear + ' ($)';
      ws4.getCell('D3').value = 'Доля региона';
      var grandTotal = moy4.reduce(function(s, c){ return s + c.total; }, 0);
      moy4.forEach(function(co, idx){
        var rowIdx = 4 + idx;
        _investAiSetGeneral(ws4.getCell('A' + rowIdx), idx + 1);
        _investAiSetText(ws4.getCell('B' + rowIdx), co.name);
        _investAiSetUsd(ws4.getCell('C' + rowIdx), co.total || null);
        _investAiSetPct(ws4.getCell('D' + rowIdx), grandTotal > 0 ? (co.total / grandTotal) : 0);
      });
      var totalRow = 4 + moy4.length;
      _investAiSetText(ws4.getCell('A' + totalRow), 'РЕГИОНАЛЬНЫЙ ИТОГО');
      _investAiSetUsd(ws4.getCell('C' + totalRow), grandTotal || null);
      _investAiSetPct(ws4.getCell('D' + totalRow), 1);
    }

    // ═══ Sheet 5: Матрица инвестприоритетов ═══
    var ws5 = wb.getWorksheet('Матрица инвестприоритетов') || wb.getWorksheet('Матрица');
    if(ws5){
      ws5.getCell('A1').value = 'МАТРИЦА ИНВЕСТИЦИОННЫХ ПРИОРИТЕТОВ — ' + matUpper;
      // Tozalash — shablon L (12+) ustunlarda "ВЫСОКИЙ — Сильный..." vereditlar qoldirgan
      for(var r5 = 2; r5 <= 100; r5++){
        for(var c5 = 1; c5 <= 20; c5++){
          ws5.getCell(r5, c5).value = null;
        }
      }
      // Header
      ws5.getCell('A3').value = 'Пр.';
      ws5.getCell('B3').value = 'Код ТН ВЭД';
      ws5.getCell('C3').value = 'Продукт';
      ws5.getCell('D3').value = 'Регион. итого ($)';
      ws5.getCell('E3').value = 'Узбекистан ($)';
      ws5.getCell('F3').value = 'Крупнейший рынок';
      ws5.getCell('G3').value = 'CAGR';
      ws5.getCell('H3').value = 'Уровень';
      ws5.getCell('I3').value = 'Капитал';
      ws5.getCell('J3').value = 'Конкур.';
      ws5.getCell('K3').value = 'Вывод';
      ctx.entries.slice().sort(function(a,b){ return (Number(b.analysisValue)||0) - (Number(a.analysisValue)||0); }).forEach(function(entry, idx){
        var rowIdx = 4 + idx;
        _investAiSetText(ws5.getCell('A' + rowIdx), String(entry.priority || 'Priority D').replace('Priority ',''));
        _investAiSetText(ws5.getCell('B' + rowIdx), entry.hsCode || '—');
        _investAiSetText(ws5.getCell('C' + rowIdx), entry.displayName || '—');
        _investAiSetUsd(ws5.getCell('D' + rowIdx), Number(entry.analysisValue) || 0);
        _investAiSetUsd(ws5.getCell('E' + rowIdx), Number(entry.uzbValue) || 0);
        _investAiSetText(ws5.getCell('F' + rowIdx), investAiTranslateCountry((entry.topImporter && entry.topImporter.name) || '—'));
        _investAiSetPct(ws5.getCell('G' + rowIdx), entry.cagr != null ? Number(entry.cagr) : null);
        _investAiSetText(ws5.getCell('H' + rowIdx), entry.level || '—');
        _investAiSetText(ws5.getCell('I' + rowIdx), entry.capital || '—');
        _investAiSetText(ws5.getCell('J' + rowIdx), entry.competitiveness || '—');
        _investAiSetText(ws5.getCell('K' + rowIdx), entry.verdict || '—');
      });
    }

    // ═══ Sheet 6: Импортозамещение УЗБ ═══
    var ws6 = wb.getWorksheet('Импортозамещение УЗБ') || wb.getWorksheet('Импортозамещение');
    if(ws6){
      ws6.getCell('A1').value = 'ВОЗМОЖНОСТИ ИМПОРТОЗАМЕЩЕНИЯ УЗБЕКИСТАНА — ' + matUpper;
      // Tozalash — kengroq diapazon
      for(var r6 = 2; r6 <= 100; r6++){
        for(var c6 = 1; c6 <= 20; c6++){
          ws6.getCell(r6, c6).value = null;
        }
      }
      // Header
      ws6.getCell('A3').value = 'Код ТН ВЭД';
      ws6.getCell('B3').value = 'Продукт';
      ws6.getCell('C3').value = '2021 ($)';
      ws6.getCell('D3').value = '2022 ($)';
      ws6.getCell('E3').value = '2023 ($)';
      ws6.getCell('F3').value = '2024 ($)';
      ws6.getCell('G3').value = 'CAGR';
      ws6.getCell('H3').value = 'Потенциал';
      ws6.getCell('I3').value = 'Приоритет';
      ctx.entries.forEach(function(entry, idx){
        var rowIdx = 4 + idx;
        var uz = ((entry.countryMap || {}).UZ || {}).years || {};
        var cagr = investAiCalcCagr(uz);
        _investAiSetText(ws6.getCell('A' + rowIdx), entry.hsCode || '—');
        _investAiSetText(ws6.getCell('B' + rowIdx), entry.displayName || '—');
        _investAiSetUsd(ws6.getCell('C' + rowIdx), Number(uz['2021']) || null);
        _investAiSetUsd(ws6.getCell('D' + rowIdx), Number(uz['2022']) || null);
        _investAiSetUsd(ws6.getCell('E' + rowIdx), Number(uz['2023']) || null);
        _investAiSetUsd(ws6.getCell('F' + rowIdx), Number(uz['2024']) || null);
        _investAiSetPct(ws6.getCell('G' + rowIdx), cagr != null ? Number(cagr) : null);
        var pot = entry.priority === 'Priority A' ? 'Высокий' : (entry.priority === 'Priority B' ? 'Средний' : 'Выборочный');
        _investAiSetText(ws6.getCell('H' + rowIdx), pot);
        _investAiSetText(ws6.getCell('I' + rowIdx), investAiTranslatePriority(entry.priority || 'Priority D'));
      });
    }

    // ═══ Sheet 7: Методология ═══
    var ws7 = wb.getWorksheet('Методология и качество данных') || wb.getWorksheet('Методология');
    if(ws7){
      var today = new Date();
      // Tozalash
      for(var r7 = 1; r7 <= 60; r7++){
        for(var c7 = 1; c7 <= 4; c7++){
          ws7.getCell(r7, c7).value = null;
        }
      }
      ws7.getCell('A1').value = 'МЕТОДОЛОГИЯ, ИСТОЧНИКИ ДАННЫХ И ПРИМЕЧАНИЯ ПО КАЧЕСТВУ — ' + matUpper;
      var rows7 = [
        ['ИСТОЧНИК ДАННЫХ', 'UN Comtrade API / официальные кэшированные снимки + AI-нарратив'],
        ['ВЕРСИЯ API', 'public-v2'],
        ['ПОТОК', 'Импорт (M)'],
        ['ПЕРИОДЫ', '2021–2024'],
        ['КЛАССИФИКАЦИЯ', 'ТН ВЭД 4/6 знаков, сопоставлено с базой продуктов Навои'],
        ['ЗНАЧЕНИЯ', 'Стоимость импорта в долл. США (CIF)'],
        ['СТРАНЫ-ОТЧЁТНИКИ', TARGET_COUNTRIES.map(function(t){ return investAiTranslateCountry(t.name); }).join(', ')],
        ['', ''],
        ['ПРИМЕЧАНИЯ ПО КАЧЕСТВУ ДАННЫХ', ''],
        ['Кэшированные снимки', String(ctx.entries.filter(function(e){ return e.hasSnapshot; }).length) + ' из ' + String(ctx.entries.length)],
        ['Крупнейший рынок (' + ctx.analysisYear + ')', investAiTranslateCountry(ctx.topCountry.name) + ' — ' + investAiFmtUsd(ctx.topCountryValue)],
        ['Оговорка по России', 'Видимость торговли с Россией может быть неполной из-за санкций, переадресации, пробелов в зеркальных данных и классификационного шума.'],
        ['', ''],
        ['СИСТЕМА ОЦЕНКИ ИНВЕСТИЦИОННЫХ ПРИОРИТЕТОВ', ''],
        ['A — Стратегический', 'Региональный спрос ≥ $50 млн И импорт УЗБ ≥ $1 млн'],
        ['B — Высокий', 'Региональный спрос ≥ $15 млн И импорт УЗБ ≥ $0.25 млн'],
        ['C — Средний', 'Региональный спрос ≥ $5 млн'],
        ['D — Низкий', 'Прочие — требует углублённой проверки'],
        ['', ''],
        ['ПОДГОТОВЛЕНО', 'Управление инвестиций — investnavoi.uz'],
        ['ДАТА', today.toLocaleDateString('ru-RU', { year:'numeric', month:'long', day:'numeric' })],
        ['КОНТАКТ', 'investnavoi.uz']
      ];
      rows7.forEach(function(r, i){
        ws7.getCell('A' + (i + 3)).value = r[0];
        ws7.getCell('B' + (i + 3)).value = r[1];
      });
    }

    // Faylni yuklash
    var fileSafe = material.replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim().replace(/\s/g,'_') || 'Material';
    var dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
    var outBuf = await wb.xlsx.writeBuffer();
    var blob = new Blob([outBuf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Navoi_' + fileSafe + '_Trade_Analysis_RU_' + dateStr + '.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    toast('📥 Excel-отчёт скачан (по шаблону НавоиАзот)');
  } catch(e){
    console.error('[invest-ai] template export failed', e);
    toast('⚠️ Excel eksport xatosi: ' + (e && e.message ? e.message : 'noma\'lum'),'error');
  } finally {
    if(loadingToast && typeof loadingToast.close === 'function') loadingToast.close();
  }
}

function investAiSummarizeCountries(countries){
  var expanded = investAiExpandImportSnapshotCountries({ countries: countries || [] });
  var summarized = expanded.map(function(country){
    var latest = Number((((country.year_imports || {})['2024']) || ((country.year_imports || {})['2023']) || country.import_usd || 0)) || 0;
    return {
      code: country.code,
      name: country.name,
      status: country.status || 'ok',
      latestImportUsd: latest,
      import2021: Number((country.year_imports || {})['2021'] || 0) || 0,
      import2022: Number((country.year_imports || {})['2022'] || 0) || 0,
      import2023: Number((country.year_imports || {})['2023'] || 0) || 0,
      import2024: Number((country.year_imports || {})['2024'] || 0) || 0,
      volumeTons: Number(country.volume_tons || 0) || 0
    };
  });
  summarized.sort(function(a,b){ return (b.latestImportUsd || 0) - (a.latestImportUsd || 0); });
  return summarized;
}

async function collectInvestAiTradeContext(material){
  // If called from product panel, use direct raw ID for exact match
  var found;
  if(_investAiDirectRawId){
    var directRaw = (DB.rawMaterials||[]).find(function(r){ return String(r.id)===_investAiDirectRawId; });
    _investAiDirectRawId = '';
    if(directRaw){
      var directProds = (DB.products||[]).filter(function(p){ return String(p.raw_id)===String(directRaw.id); });
      found = { raw: directRaw, products: directProds };
    }
  }
  if(!found) found = investAiFindProducts(material);
  var raw = found.raw;
  var products = (found.products || []);
  if(!raw){
    return {
      material: material,
      rawMaterial: material,
      raw: null,
      matchedProducts: [],
      officialDataAvailable: false,
      officialSource: 'UN Comtrade',
      analyzedProducts: [],
      reason: 'raw_not_found'
    };
  }
  var uniqueHsFetches = {};
  var liveByHs = {};
  var fetchedCount = 0;
  var summaries = [];

  for(var i=0;i<products.length;i++){
    var product = products[i];
    var hsCode = getExactImportHsCode(product);
    if(!hsCode || hsCode.length < 2) continue;
    var snapshot = (DB.importSnapshots||[]).find(function(sn){
      return String(sn.productId)===String(product.id) &&
             String(sn.hsCode||'')===String(hsCode) &&
             /UN Comtrade/i.test(String(sn.source||'')) &&
             (sn.countries||[]).length > 0;
    }) || null;
    // If same HS already fetched, reuse data for this product
    if(!snapshot && liveByHs[hsCode]){
      snapshot = {
        id: buildImportSnapshotId(product, hsCode, FINDER_ALWAYS_TARGET_COUNTRIES, 'comtrade'),
        productId: String(product.id || ''),
        productName: formatBilingualProductName(product),
        hsCode: hsCode,
        source: 'UN Comtrade (real)',
        countries: liveByHs[hsCode]
      };
    }
    // If no snapshot and HS not yet fetched, fetch from API
    if(!snapshot && !uniqueHsFetches[hsCode]){
      uniqueHsFetches[hsCode] = true;
      fetchedCount += 1;
      try{
        var liveCountries = await fetchComtrade(hsCode, '2023');
        if(liveCountries && liveCountries.length){
          liveByHs[hsCode] = liveCountries;
          saveImportSnapshot(product, hsCode, liveCountries, 'UN Comtrade (real)');
          snapshot = {
            id: buildImportSnapshotId(product, hsCode, FINDER_ALWAYS_TARGET_COUNTRIES, 'comtrade'),
            productId: String(product.id || ''),
            productName: formatBilingualProductName(product),
            hsCode: hsCode,
            source: 'UN Comtrade (real)',
            countries: liveCountries
          };
        }
      }catch(e){
        console.log('AI analyzer Comtrade context xato:', e.message);
      }
    }
    // Try any cached snapshot with same HS code from DB
    if(!snapshot){
      var anySnap = (DB.importSnapshots||[]).find(function(sn){
        return String(sn.hsCode||'')===String(hsCode) &&
               /UN Comtrade/i.test(String(sn.source||'')) &&
               (sn.countries||[]).length > 0;
      });
      if(anySnap) snapshot = anySnap;
    }
    if(!snapshot || !(snapshot.countries||[]).length) continue;
    // Expand countries from compressed format for correct year_imports access
    var expandedForSummary = investAiExpandImportSnapshotCountries(snapshot);
    var summarizedCountries = expandedForSummary.map(function(country){
      var latest = Number((country.year_imports||{})['2024'] || (country.year_imports||{})['2023'] || country.import_usd || 0) || 0;
      return {
        code: country.code,
        name: country.name,
        status: country.status || 'ok',
        latestImportUsd: latest,
        import2021: Number((country.year_imports||{})['2021']||0)||0,
        import2022: Number((country.year_imports||{})['2022']||0)||0,
        import2023: Number((country.year_imports||{})['2023']||0)||0,
        import2024: Number((country.year_imports||{})['2024']||0)||0,
        volumeTons: Number(country.volume_tons||0)||0
      };
    }).sort(function(a,b){ return (b.latestImportUsd||0)-(a.latestImportUsd||0); });
    var totalLatest = summarizedCountries.reduce(function(sum, item){ return sum + (Number(item.latestImportUsd || 0) || 0); }, 0);
    summaries.push({
      productId: String(product.id || ''),
      productName: formatBilingualProductName(product),
      hsCode: hsCode,
      source: snapshot.source || 'UN Comtrade',
      snapshotId: snapshot.id || '',
      countries: snapshot.countries || [],
      totalLatestUsd: totalLatest,
      topCountries: summarizedCountries.slice(0,5)
    });
  }

  return {
    material: material,
    rawMaterial: raw ? (raw.name_en || raw.name_uz || material) : material,
    raw: raw,
    matchedProducts: products.map(function(product){
      return {
        id: String(product.id || ''),
        name: formatBilingualProductName(product),
        hsCode: investAiParseHsCode(product.hs_code).slice(0,6) || String(product.hs_code || '')
      };
    }),
    officialDataAvailable: summaries.length > 0,
    officialSource: summaries.length > 0 ? 'UN Comtrade' : '',
    analyzedProducts: summaries
  };
}

function setInvestAiBusy(flag){
  _investAiBusy = !!flag;
  var btn = document.getElementById('materialAiAnalyzeBtn');
  var input = document.getElementById('materialAiInput');
  var inlineBtn = document.getElementById('productRawAiAnalyzeBtn');
  if(btn){
    btn.disabled = _investAiBusy;
    btn.textContent = _investAiBusy ? investAiT('analyzing') : investAiT('analyze');
    btn.style.opacity = _investAiBusy ? '.75' : '1';
    btn.style.cursor = _investAiBusy ? 'not-allowed' : 'pointer';
  }
  if(inlineBtn){
    inlineBtn.disabled = _investAiBusy;
    inlineBtn.textContent = _investAiBusy ? '⏳ AI tahlil qilinmoqda...' : '🧠 Shu xomashyoni tahlil qilish';
    inlineBtn.style.opacity = _investAiBusy ? '.75' : '1';
    inlineBtn.style.cursor = _investAiBusy ? 'not-allowed' : 'pointer';
  }
  if(input) input.disabled = _investAiBusy;
}

function extractGeminiStreamText(payload){
  var texts = [];
  var items = Array.isArray(payload) ? payload : [payload];
  items.forEach(function(item){
    var candidates = item && Array.isArray(item.candidates) ? item.candidates : [];
    candidates.forEach(function(candidate){
      var parts = (((candidate||{}).content||{}).parts)||[];
      parts.forEach(function(part){
        if(part && typeof part.text === 'string' && part.text) texts.push(part.text);
      });
    });
  });
  return texts.join('');
}

function parseAnthropicSseChunk(chunk, onText){
  var lines = String(chunk || '').split(/\r?\n/);
  var dataLines = [];
  for(var i=0;i<lines.length;i++){
    var line = lines[i];
    if(line.indexOf('data:') === 0) dataLines.push(line.slice(5).trim());
  }
  var dataStr = dataLines.join('\n');
  if(!dataStr || dataStr === '[DONE]') return;
  var payload = null;
  try { payload = JSON.parse(dataStr); } catch(e){ return; }
  if(payload.type === 'content_block_delta' && payload.delta && payload.delta.text){
    onText(payload.delta.text);
  } else if(payload.error && payload.error.message){
    throw new Error(payload.error.message);
  } else if(payload.type === 'error'){
    throw new Error((payload.error && payload.error.message) || payload.message || 'Anthropic stream error');
  } else {
    var geminiTextDelta = extractGeminiStreamText(payload);
    if(geminiTextDelta) onText(geminiTextDelta);
  }
}

function extractInvestAiErrorMessage(resp, errText){
  var fallback = 'API error ' + (resp && resp.status ? resp.status : '');
  if(!errText) return fallback;
  try{
    var errJson = JSON.parse(errText);
    var detail = errJson.detail || '';
    if(detail){
      try{
        var nested = JSON.parse(detail);
        detail = (nested.error && nested.error.message) || nested.message || detail;
      }catch(e){}
    }
    var top = (errJson.error && errJson.error.message) || errJson.error || '';
    return detail || top || fallback;
  }catch(e){
    return errText || fallback;
  }
}

async function analyzeInvestmentMaterial(){
  if(_investAiBusy) return;
  var input = document.getElementById('materialAiInput');
  var material = String((input && input.value) || '').trim();
  if(!material){ toast(investAiT('toastPick'),'error'); return; }

  _investAiCurrentMaterial = material;
  _investAiMarkdown = '';
  _investAiTradeContext = null;
  _investAiPhase = 0;
  setInvestAiBusy(true);
  renderInvestAiProgress(0, false);
  updateInvestAiOutputMeta(material, new Date().toISOString());
  var outputCard = document.getElementById('materialAiOutputCard');
  var notice = document.getElementById('materialAiExcelNotice');
  var inlineOutputCard = document.getElementById('productRawAiOutputCard');
  var inlineNotice = document.getElementById('productRawAiExcelNotice');
  if(outputCard) outputCard.style.display = 'block';
  if(notice) notice.style.display = 'none';
  if(shouldMirrorInvestAiToProductPanel(material)){
    if(inlineOutputCard) inlineOutputCard.style.display = 'block';
    if(inlineNotice) inlineNotice.style.display = 'none';
  }
  renderInvestAiMarkdown('');
  toast(investAiT('toastStream'));

  try {
    toast('📊 UN Comtrade konteksti tekshirilmoqda...');
    var tradeContext = await collectInvestAiTradeContext(material);
    if(tradeContext && tradeContext.officialDataAvailable){
      _investAiTradeContext = tradeContext;
      toast('✅ UN Comtrade konteksti topildi: ' + tradeContext.analyzedProducts.length + ' ta mahsulot');
    } else {
      if(tradeContext && tradeContext.reason === 'raw_not_found'){
        throw new Error('Bu xomashyo bazada topilmadi. Faqat bazadagi xomashyolarni tanlang.');
      }
      // Comtrade ma'lumoti yo'q bo'lsa ham raw/products bilan davom etamiz
      if(tradeContext && tradeContext.raw){
        _investAiTradeContext = tradeContext;
        toast('⚠️ Comtrade ma\'lumoti topilmadi, mahsulot ma\'lumotlari bilan davom etilmoqda...');
      } else {
        throw new Error('Bu xomashyo uchun ma\'lumot topilmadi.');
      }
    }
    // Step 1: try to get system prompt from proxy; fall back to built-in if proxy fails
    var FALLBACK_SYSTEM_PROMPT = 'You are an expert investment analyst for Navoiy region of Uzbekistan. ' +
      'Produce a Markdown-formatted investment analysis in Uzbek for the given raw material, using ONLY the UN Comtrade data provided in the context. ' +
      'Required sections: 1) Executive summary 2) Top importing countries (table) 3) Trade trends (2021-2023) 4) Investment opportunities for Navoiy ' +
      '5) Recommended downstream products (from context only) 6) Risks and mitigations 7) Next steps. ' +
      'Use concrete numbers from the context. If data is missing, say it is missing. Keep it under 2000 words. Write in fluent Uzbek.';

    if(!window._cachedSystemPrompt){
      try {
        var promptResp = await fetch(AI_TRADE_ANALYZER_API_BASE + '/analyze-material', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ promptOnly: true })
        });
        if(promptResp.ok){
          var promptData = await promptResp.json();
          if(promptData && promptData.systemPrompt) window._cachedSystemPrompt = promptData.systemPrompt;
        } else {
          console.warn('Proxy system prompt failed ('+promptResp.status+') — using built-in fallback');
        }
      } catch(e){
        console.warn('Proxy unreachable — using built-in system prompt:', e && e.message);
      }
      if(!window._cachedSystemPrompt) window._cachedSystemPrompt = FALLBACK_SYSTEM_PROMPT;
    }
    var systemPrompt = window._cachedSystemPrompt;
    if(!systemPrompt) systemPrompt = FALLBACK_SYSTEM_PROMPT;

    // Step 2: TRIM tradeContext to fit free-tier 15K token/min limit
    // Strip large fields: full snapshot.countries arrays, full raw object, etc.
    var slimContext = {
      material: tradeContext.material,
      rawMaterial: tradeContext.rawMaterial,
      raw: tradeContext.raw ? {
        id: tradeContext.raw.id,
        name_uz: tradeContext.raw.name_uz,
        name_en: tradeContext.raw.name_en,
        section: tradeContext.raw.section,
        hs_code: tradeContext.raw.hs_code
      } : null,
      matchedProducts: (tradeContext.matchedProducts || []).slice(0, 20),
      officialDataAvailable: tradeContext.officialDataAvailable,
      officialSource: tradeContext.officialSource,
      analyzedProducts: (tradeContext.analyzedProducts || []).slice(0, 15).map(function(p){
        return {
          productId: p.productId,
          productName: p.productName,
          hsCode: p.hsCode,
          source: p.source,
          totalLatestUsd: p.totalLatestUsd,
          // Keep only top 5 countries summary, drop full snapshot.countries (too large)
          topCountries: (p.topCountries || []).slice(0, 5)
        };
      })
    };
    var ctxJson = JSON.stringify(slimContext);
    console.log('[analyze-material] context size: ' + ctxJson.length + ' chars (~' + Math.round(ctxJson.length/4) + ' tokens)');

    var contextText = 'Selected raw material: ' + material + '\n\n' +
      'Strict instruction:\n' +
      '- Analyze ONLY the selected raw material.\n' +
      '- Use ONLY the products listed in the official UN Comtrade context below.\n' +
      '- Do NOT use any sample Excel/template data.\n' +
      '- Do NOT add other downstream products unless they are present in the context JSON.\n' +
      '- If data is missing, say it is missing.\n\n' +
      'Official UN Comtrade context:\n' + ctxJson;

    var directKeys = (typeof getAllGeminiKeys === 'function') ? getAllGeminiKeys() : [];
    if(!directKeys.length) throw new Error('Gemini API kalit yo\'q. ⚙️ Sozlamalardan kiriting.');

    // Gemma first — much higher free-tier daily limit (14,400 RPD vs Gemini 250 RPD)
    var directModels = ['gemma-3-27b-it','gemma-3-12b-it','gemma-3-4b-it','gemini-2.5-flash','gemini-2.5-flash-lite','gemini-2.0-flash','gemini-2.0-flash-lite'];
    var resp = null;
    var lastDirectErr = null;
    outer:
    for(var ki=0; ki<directKeys.length; ki++){
      for(var mi=0; mi<directModels.length; mi++){
        var dModel = directModels[mi];
        var isGemma = /^gemma/i.test(dModel);
        var dBody = isGemma ? {
          contents: [{ role:'user', parts:[{ text: systemPrompt + '\n\n---\n\n' + contextText }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
        } : {
          system_instruction: { parts:[{ text: systemPrompt }] },
          contents: [{ role:'user', parts:[{ text: contextText }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
        };
        var dUrl = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(dModel) + ':streamGenerateContent?alt=sse&key=' + directKeys[ki];
        try {
          var r = await fetch(dUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(dBody) });
          if(r.ok){ resp = r; console.log('[analyze-material direct] key#'+(ki+1)+' '+dModel+' OK'); break outer; }
          var eTxt = await r.text();
          var parsedErr = '';
          try {
            var errJson = JSON.parse(eTxt);
            if(Array.isArray(errJson)) errJson = errJson[0];
            parsedErr = (errJson && errJson.error && errJson.error.message) || eTxt;
          } catch(_){ parsedErr = eTxt; }
          lastDirectErr = { status: r.status, model: dModel, key: ki+1, detail: parsedErr };
          console.warn('[analyze-material direct] key#'+(ki+1)+' '+dModel+' -> '+r.status+' :: '+parsedErr.slice(0,300));

          // Per-minute token quota — wait then retry SAME model once
          var retryMatch = parsedErr.match(/retry in ([\d.]+)s/i);
          if(r.status === 429 && retryMatch){
            var waitSec = Math.min(parseFloat(retryMatch[1]) + 2, 30);
            toast('⏳ Per-minute limit — '+Math.ceil(waitSec)+'s kutilmoqda...','info');
            await new Promise(function(rr){ setTimeout(rr, waitSec*1000); });
            try {
              var r2 = await fetch(dUrl, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(dBody) });
              if(r2.ok){ resp = r2; console.log('[analyze-material direct retry] key#'+(ki+1)+' '+dModel+' OK after wait'); break outer; }
              var e2 = await r2.text();
              console.warn('[analyze-material direct retry] '+dModel+' STILL '+r2.status);
            } catch(e2){ console.warn('[retry] exception:', e2.message); }
          }
        } catch(e){
          lastDirectErr = { message: e.message, model: dModel, key: ki+1 };
          console.warn('[analyze-material direct] key#'+(ki+1)+' '+dModel+' exception:', e.message);
        }
      }
    }
    if(!resp){
      var detailMsg = lastDirectErr && lastDirectErr.detail ? lastDirectErr.detail : (lastDirectErr && lastDirectErr.message) || '';
      throw new Error('Gemini API javobi: ' + detailMsg + '\n\nTried: ' + directModels.join(', '));
    }

    var reader = resp.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    while(true){
      var part = await reader.read();
      if(part.done) break;
      buffer += decoder.decode(part.value, {stream:true});
      var match;
      while((match = buffer.match(/\r?\n\r?\n/))){
        var idx = match.index;
        var chunk = buffer.slice(0, idx);
        buffer = buffer.slice(idx + match[0].length);
        parseAnthropicSseChunk(chunk, function(textDelta){
          _investAiMarkdown += textDelta;
          renderInvestAiMarkdown(_investAiMarkdown);
          var stage = inferInvestAiPhase(_investAiMarkdown);
          if(stage !== _investAiPhase){
            _investAiPhase = stage;
            renderInvestAiProgress(_investAiPhase, false);
          }
        });
      }
    }
    if(buffer.trim()){
      parseAnthropicSseChunk(buffer, function(textDelta){
        _investAiMarkdown += textDelta;
        renderInvestAiMarkdown(_investAiMarkdown);
      });
    }

    renderInvestAiProgress(3, true);
    // Excel notice (yuklab olish tugmasi bilan) faqat UN Comtrade ma'lumoti mavjud bo'lsa ko'rinadi
    var _hasOfficialData = !!(_investAiTradeContext && _investAiTradeContext.officialDataAvailable);
    if(notice) notice.style.display = _hasOfficialData ? 'block' : 'none';
    if(shouldMirrorInvestAiToProductPanel(material) && inlineNotice) inlineNotice.style.display = _hasOfficialData ? 'block' : 'none';
    updateInvestAiOutputMeta(material, new Date().toISOString());
    saveInvestAiHistory(material, _investAiMarkdown, _investAiTradeContext);
    renderInvestAiHistory();
    toast(investAiT('toastReady'));
  } catch(e){
    console.error(e);
    renderInvestAiMarkdown('## Error\n\n' + (e && e.message ? e.message : 'Unknown error'));
    toast('⚠️ ' + (e.message || 'Error'),'error');
  } finally {
    setInvestAiBusy(false);
  }
}

function renderInvestAiPage(){
  updateInvestAiI18n();
  renderInvestAiChips();
  renderInvestAiHistory();
  if(_investAiBusy) renderInvestAiProgress(_investAiPhase < 0 ? 0 : _investAiPhase, false);
}

