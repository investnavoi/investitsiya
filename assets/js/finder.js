/* ═══════════════════════════════════════
   M3: COMPANY FINDER
═══════════════════════════════════════ */
var _finderResults = [];
var _finderMode = 'importers';
var FINDER_TARGET_COUNTRY_META = {
  'Uzbekistan': {flag:'🇺🇿', label:"O'zbekiston"},
  'Turkmenistan': {flag:'🇹🇲', label:'Turkmaniston'},
  'Tajikistan': {flag:'🇹🇯', label:'Tojikiston'},
  'Kyrgyzstan': {flag:'🇰🇬', label:"Qirg'iziston"},
  'Kazakhstan': {flag:'🇰🇿', label:"Qozog'iston"},
  'Mongolia': {flag:'🇲🇳', label:'Mongoliya'},
  'Russia': {flag:'🇷🇺', label:'Rossiya'},
  'Azerbaijan': {flag:'🇦🇿', label:'Ozarbayjon'},
  'Georgia': {flag:'🇬🇪', label:'Gruziya'},
  'Armenia': {flag:'🇦🇲', label:'Armaniston'},
  'Iran': {flag:'🇮🇷', label:'Eron'},
  'Afghanistan': {flag:'🇦🇫', label:"Afg'oniston"},
  'Pakistan': {flag:'🇵🇰', label:'Pokiston'}
};
var FINDER_SOURCE_REGIONS = {
  "Afrika": ['Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cabo Verde','Cameroon','Central African Republic','Chad','Comoros','Congo','DR Congo','Djibouti','Egypt','Equatorial Guinea','Eritrea','Eswatini','Ethiopia','Gabon','Gambia','Ghana','Guinea','Guinea-Bissau','Ivory Coast','Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi','Mali','Mauritania','Mauritius','Morocco','Mozambique','Namibia','Niger','Nigeria','Rwanda','Sao Tome and Principe','Senegal','Seychelles','Sierra Leone','Somalia','South Africa','South Sudan','Sudan','Tanzania','Togo','Tunisia','Uganda','Zambia','Zimbabwe'],
  "Osiyo": ['Afghanistan','Armenia','Azerbaijan','Bahrain','Bangladesh','Bhutan','Brunei','Cambodia','China','Cyprus','Georgia','India','Indonesia','Iran','Iraq','Israel','Japan','Jordan','Kazakhstan','Kuwait','Kyrgyzstan','Laos','Lebanon','Malaysia','Maldives','Mongolia','Myanmar','Nepal','North Korea','Oman','Pakistan','Palestine','Philippines','Qatar','Saudi Arabia','Singapore','South Korea','Sri Lanka','Syria','Tajikistan','Thailand','Timor-Leste','Turkey','Turkmenistan','United Arab Emirates','Uzbekistan','Vietnam','Yemen'],
  "Yevropa": ['Albania','Andorra','Austria','Belarus','Belgium','Bosnia and Herzegovina','Bulgaria','Croatia','Czech Republic','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','Iceland','Ireland','Italy','Kosovo','Latvia','Liechtenstein','Lithuania','Luxembourg','Malta','Moldova','Monaco','Montenegro','Netherlands','North Macedonia','Norway','Poland','Portugal','Romania','Russia','San Marino','Serbia','Slovakia','Slovenia','Spain','Sweden','Switzerland','Ukraine','United Kingdom','Vatican City'],
  "Shimoliy Amerika": ['Antigua and Barbuda','Bahamas','Barbados','Belize','Canada','Costa Rica','Cuba','Dominica','Dominican Republic','El Salvador','Grenada','Guatemala','Haiti','Honduras','Jamaica','Mexico','Nicaragua','Panama','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Trinidad and Tobago','United States'],
  "Janubiy Amerika": ['Argentina','Bolivia','Brazil','Chile','Colombia','Ecuador','Guyana','Paraguay','Peru','Suriname','Uruguay','Venezuela'],
  "Okeaniya": ['Australia','Fiji','Kiribati','Marshall Islands','Micronesia','Nauru','New Zealand','Palau','Papua New Guinea','Samoa','Solomon Islands','Tonga','Tuvalu','Vanuatu']
};
var _finderSourceContinents = [];
var _finderSourceCountries = [];
var FINDER_ALWAYS_TARGET_COUNTRIES = ['Uzbekistan','Turkmenistan','Tajikistan','Kyrgyzstan','Kazakhstan','Mongolia','Russia','Azerbaijan','Georgia','Armenia','Iran','Afghanistan','Pakistan'];
var _finderTargetCountries = FINDER_ALWAYS_TARGET_COUNTRIES.slice();
var _finderTargetOpenGroups = {};

var _COUNTRY_FLAG_MAP={Afghanistan:'🇦🇫',Albania:'🇦🇱',Algeria:'🇩🇿',Andorra:'🇦🇩',Angola:'🇦🇴','Antigua and Barbuda':'🇦🇬',Argentina:'🇦🇷',Armenia:'🇦🇲',Australia:'🇦🇺',Austria:'🇦🇹',Azerbaijan:'🇦🇿',Bahamas:'🇧🇸',Bahrain:'🇧🇭',Bangladesh:'🇧🇩',Barbados:'🇧🇧',Belarus:'🇧🇾',Belgium:'🇧🇪',Belize:'🇧🇿',Benin:'🇧🇯',Bhutan:'🇧🇹',Bolivia:'🇧🇴','Bosnia and Herzegovina':'🇧🇦',Botswana:'🇧🇼',Brazil:'🇧🇷',Brunei:'🇧🇳',Bulgaria:'🇧🇬','Burkina Faso':'🇧🇫',Burundi:'🇧🇮','Cabo Verde':'🇨🇻',Cambodia:'🇰🇭',Cameroon:'🇨🇲',Canada:'🇨🇦','Central African Republic':'🇨🇫',Chad:'🇹🇩',Chile:'🇨🇱',China:'🇨🇳',Colombia:'🇨🇴',Comoros:'🇰🇲',Congo:'🇨🇬','Costa Rica':'🇨🇷',Croatia:'🇭🇷',Cuba:'🇨🇺',Cyprus:'🇨🇾','Czech Republic':'🇨🇿','DR Congo':'🇨🇩',Denmark:'🇩🇰',Djibouti:'🇩🇯',Dominica:'🇩🇲','Dominican Republic':'🇩🇴',Ecuador:'🇪🇨',Egypt:'🇪🇬','El Salvador':'🇸🇻','Equatorial Guinea':'🇬🇶',Eritrea:'🇪🇷',Estonia:'🇪🇪',Eswatini:'🇸🇿',Ethiopia:'🇪🇹',Fiji:'🇫🇯',Finland:'🇫🇮',France:'🇫🇷',Gabon:'🇬🇦',Gambia:'🇬🇲',Georgia:'🇬🇪',Germany:'🇩🇪',Ghana:'🇬🇭',Greece:'🇬🇷',Grenada:'🇬🇩',Guatemala:'🇬🇹',Guinea:'🇬🇳','Guinea-Bissau':'🇬🇼',Guyana:'🇬🇾',Haiti:'🇭🇹',Honduras:'🇭🇳',Hungary:'🇭🇺',Iceland:'🇮🇸',India:'🇮🇳',Indonesia:'🇮🇩',Iran:'🇮🇷',Iraq:'🇮🇶',Ireland:'🇮🇪',Israel:'🇮🇱',Italy:'🇮🇹','Ivory Coast':'🇨🇮',Jamaica:'🇯🇲',Japan:'🇯🇵',Jordan:'🇯🇴',Kazakhstan:'🇰🇿',Kenya:'🇰🇪',Kiribati:'🇰🇮',Kosovo:'🇽🇰',Kuwait:'🇰🇼',Kyrgyzstan:'🇰🇬',Laos:'🇱🇦',Latvia:'🇱🇻',Lebanon:'🇱🇧',Lesotho:'🇱🇸',Liberia:'🇱🇷',Libya:'🇱🇾',Liechtenstein:'🇱🇮',Lithuania:'🇱🇹',Luxembourg:'🇱🇺',Madagascar:'🇲🇬',Malawi:'🇲🇼',Malaysia:'🇲🇾',Maldives:'🇲🇻',Mali:'🇲🇱',Malta:'🇲🇹','Marshall Islands':'🇲🇭',Mauritania:'🇲🇷',Mauritius:'🇲🇺',Mexico:'🇲🇽',Micronesia:'🇫🇲',Moldova:'🇲🇩',Monaco:'🇲🇨',Mongolia:'🇲🇳',Montenegro:'🇲🇪',Morocco:'🇲🇦',Mozambique:'🇲🇿',Myanmar:'🇲🇲',Namibia:'🇳🇦',Nauru:'🇳🇷',Nepal:'🇳🇵',Netherlands:'🇳🇱','New Zealand':'🇳🇿',Nicaragua:'🇳🇮',Niger:'🇳🇪',Nigeria:'🇳🇬','North Korea':'🇰🇵','North Macedonia':'🇲🇰',Norway:'🇳🇴',Oman:'🇴🇲',Pakistan:'🇵🇰',Palau:'🇵🇼',Palestine:'🇵🇸',Panama:'🇵🇦','Papua New Guinea':'🇵🇬',Paraguay:'🇵🇾',Peru:'🇵🇪',Philippines:'🇵🇭',Poland:'🇵🇱',Portugal:'🇵🇹',Qatar:'🇶🇦',Romania:'🇷🇴',Russia:'🇷🇺',Rwanda:'🇷🇼','Saint Kitts and Nevis':'🇰🇳','Saint Lucia':'🇱🇨','Saint Vincent and the Grenadines':'🇻🇨',Samoa:'🇼🇸','San Marino':'🇸🇲','Sao Tome and Principe':'🇸🇹','Saudi Arabia':'🇸🇦',Senegal:'🇸🇳',Serbia:'🇷🇸',Seychelles:'🇸🇨','Sierra Leone':'🇸🇱',Singapore:'🇸🇬',Slovakia:'🇸🇰',Slovenia:'🇸🇮','Solomon Islands':'🇸🇧',Somalia:'🇸🇴','South Africa':'🇿🇦','South Korea':'🇰🇷','South Sudan':'🇸🇸',Spain:'🇪🇸','Sri Lanka':'🇱🇰',Sudan:'🇸🇩',Suriname:'🇸🇷',Sweden:'🇸🇪',Switzerland:'🇨🇭',Syria:'🇸🇾',Tajikistan:'🇹🇯',Tanzania:'🇹🇿',Thailand:'🇹🇭','Timor-Leste':'🇹🇱',Togo:'🇹🇬',Tonga:'🇹🇴','Trinidad and Tobago':'🇹🇹',Tunisia:'🇹🇳',Turkey:'🇹🇷',Turkmenistan:'🇹🇲',Tuvalu:'🇹🇻',Uganda:'🇺🇬',Ukraine:'🇺🇦','United Arab Emirates':'🇦🇪','United Kingdom':'🇬🇧','United States':'🇺🇸',Uruguay:'🇺🇾',Uzbekistan:'🇺🇿',Vanuatu:'🇻🇺','Vatican City':'🇻🇦',Venezuela:'🇻🇪',Vietnam:'🇻🇳',Yemen:'🇾🇪',Zambia:'🇿🇲',Zimbabwe:'🇿🇼'};
function getFinderCountryMeta(name){
  var meta = FINDER_TARGET_COUNTRY_META[name];
  if(meta) return meta;
  var flag = _COUNTRY_FLAG_MAP[name] || '🏳️';
  return {flag:flag, label:name};
}

function getFinderCountryLabel(name){
  return getFinderCountryMeta(name).label;
}

function getFinderCountryFlag(name){
  return getFinderCountryMeta(name).flag;
}

function getFinderStrategyFilters(){
  var top100El = document.getElementById('finder-filter-top100');
  var expansionEl = document.getElementById('finder-filter-expansion');
  return {
    top100: !!(top100El && top100El.checked),
    expansion: !!(expansionEl && expansionEl.checked),
    target13: false
  };
}

function getFinderCountSettings(){
  var modeEl = document.getElementById('finder-count-mode');
  var countEl = document.getElementById('finder-count');
  var count = parseInt((countEl && countEl.value) || '5', 10);
  if(!count || count < 1) count = 5;
  if(count > 100) count = 100;
  if(countEl) countEl.value = count;
  return {
    mode: (modeEl && modeEl.value) || 'per_country',
    count: count
  };
}

function applyFinderUiDefaults(){
  var countModeEl = document.getElementById('finder-count-mode');
  var countEl = document.getElementById('finder-count');
  var sourceEl = document.getElementById('import-source-select');
  if(countModeEl) countModeEl.value = 'total';
  if(countEl) countEl.value = '1';
  if(sourceEl) sourceEl.value = 'comtrade';
}

function getFinderBlockedSourceCountries(){
  return (_finderTargetCountries || []).slice();
}

function isFinderSourceCountryBlocked(name){
  return getFinderBlockedSourceCountries().indexOf(name) !== -1;
}

function syncFinderSourceAgainstTarget(){
  var blocked = getFinderBlockedSourceCountries();
  if(!blocked.length) return;
  _finderSourceCountries = _finderSourceCountries.filter(function(country){
    return blocked.indexOf(country) === -1;
  });
}

function toggleFinderTargetCountry(name){
  var idx = _finderTargetCountries.indexOf(name);
  if(idx >= 0) _finderTargetCountries.splice(idx,1);
  else _finderTargetCountries.push(name);
  syncFinderSourceAgainstTarget();
  renderFinderSourceFilters();
  renderFinderTargetFilters();
}

function toggleFinderTargetGroup(name){
  _finderTargetOpenGroups[name] = !_finderTargetOpenGroups[name];
  renderFinderTargetFilters();
}

function toggleFinderTargetGroupAll(name){
  var groupCountries = [];
  if(name === 'Maqsad davlatlar') groupCountries = FINDER_ALWAYS_TARGET_COUNTRIES.slice();
  else groupCountries = (FINDER_SOURCE_REGIONS[name] || []).filter(function(country){
    return FINDER_ALWAYS_TARGET_COUNTRIES.indexOf(country) === -1;
  });
  if(!groupCountries.length) return;
  var allSelected = groupCountries.every(function(country){
    return _finderTargetCountries.indexOf(country) !== -1;
  });
  if(allSelected){
    _finderTargetCountries = _finderTargetCountries.filter(function(country){
      return groupCountries.indexOf(country) === -1;
    });
  } else {
    groupCountries.forEach(function(country){
      if(_finderTargetCountries.indexOf(country) === -1) _finderTargetCountries.push(country);
    });
  }
  syncFinderSourceAgainstTarget();
  renderFinderSourceFilters();
  renderFinderTargetFilters();
}

function renderFinderTargetFilters(){
  var wrap = document.getElementById('finderCountries');
  if(!wrap) return;
  var searchEl = document.getElementById('finderTargetSearch');
  var search = searchEl ? searchEl.value.toLowerCase().trim() : '';
  var groups = [{name:'Maqsad davlatlar', countries:FINDER_ALWAYS_TARGET_COUNTRIES.slice(), isCore:true}];
  Object.keys(FINDER_SOURCE_REGIONS).forEach(function(cont){
    groups.push({
      name: cont,
      countries: (FINDER_SOURCE_REGIONS[cont]||[]).filter(function(c){ return FINDER_ALWAYS_TARGET_COUNTRIES.indexOf(c)===-1; }),
      isCore: false
    });
  });
  wrap.innerHTML = '';
  groups.forEach(function(group){
    var allC = group.countries;
    var filteredC = allC.filter(function(c){
      return !search || c.toLowerCase().indexOf(search)!==-1 || getFinderCountryLabel(c).toLowerCase().indexOf(search)!==-1;
    });
    if(search && filteredC.length===0) return;
    var selCount = allC.filter(function(c){ return _finderTargetCountries.indexOf(c)!==-1; }).length;
    var allChecked = allC.length>0 && selCount===allC.length;
    var someChecked = selCount>0 && !allChecked;
    var isOpen = !!_finderTargetOpenGroups[group.name] || search.length>0;
    var div = document.createElement('div');
    if(group.isCore){
      div.style.cssText = 'background:linear-gradient(135deg,rgba(70,95,255,.04),rgba(70,95,255,.08));border:1px solid rgba(70,95,255,.15);border-radius:8px;margin-bottom:4px';
    } else {
      div.style.cssText = 'border-top:1px solid #F3F4F6;padding:0';
    }
    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 10px;cursor:pointer;border-radius:8px;transition:background .15s';
    hdr.addEventListener('mouseenter', function(){ if(!group.isCore) this.style.background='#F9FAFB'; });
    hdr.addEventListener('mouseleave', function(){ if(!group.isCore) this.style.background='transparent'; });
    hdr.addEventListener('click', function(){ _finderTargetOpenGroups[group.name]=!_finderTargetOpenGroups[group.name]; renderFinderTargetFilters(); });
    var left = document.createElement('span');
    left.style.cssText = 'display:flex;align-items:center;gap:10px';
    var cb = document.createElement('div');
    cb.style.cssText = 'width:15px;height:15px;border-radius:4px;border:1.5px solid '+(allChecked?'#465fff':'#D1D5DB')+';background:'+(allChecked?'#465fff':'#fff')+';display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .15s';
    if(allChecked) cb.innerHTML = '<span style="color:#fff;font-size:9px;font-weight:700">✓</span>';
    else if(someChecked) { cb.style.background='#465fff'; cb.style.borderColor='#465fff'; cb.innerHTML='<span style="color:#fff;font-size:9px;font-weight:700">−</span>'; }
    cb.addEventListener('click', function(e){ e.stopPropagation(); toggleFinderTargetGroupAll(group.name); renderFinderTargetFilters(); });
    var nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'font-size:.78rem;font-weight:'+(group.isCore?'600':'500')+';color:'+(group.isCore?'#465fff':'#344054');
    nameSpan.textContent = group.name;
    left.appendChild(cb); left.appendChild(nameSpan);
    var right = document.createElement('span');
    right.style.cssText = 'display:flex;align-items:center;gap:6px';
    var countSpan = document.createElement('span');
    countSpan.style.cssText = 'font-size:.65rem;font-weight:600;background:'+(group.isCore?'#465fff':'#EFF4FF')+';color:'+(group.isCore?'#fff':'#465fff')+';padding:2px 7px;border-radius:5px;min-width:36px;text-align:center';
    countSpan.textContent = selCount+'/'+allC.length;
    var arrowSpan = document.createElement('span');
    arrowSpan.style.cssText = 'color:#9CA3AF;transition:transform .2s;transform:rotate('+(isOpen?'90':'0')+'deg);display:flex;align-items:center';
    arrowSpan.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
    right.appendChild(countSpan); right.appendChild(arrowSpan);
    hdr.appendChild(left); hdr.appendChild(right);
    div.appendChild(hdr);
    if(isOpen && filteredC.length){
      var list = document.createElement('div');
      list.style.cssText = 'padding:4px 10px 8px;display:flex;flex-wrap:wrap;gap:.25rem';
      filteredC.forEach(function(country){
        var checked = _finderTargetCountries.indexOf(country)!==-1;
        var lbl = document.createElement('label');
        lbl.style.cssText = 'display:flex;align-items:center;gap:3px;padding:3px 8px;background:'+(checked?'rgba(70,95,255,.1)':'#F9FAFB')+';border-radius:6px;font-size:.68rem;cursor:pointer;border:1px solid '+(checked?'rgba(70,95,255,.3)':'#E5E7EB')+';color:#344054;font-weight:500;transition:all .15s';
        var ccb = document.createElement('input');
        ccb.type = 'checkbox'; ccb.checked = checked; ccb.style.display = 'none';
        ccb.addEventListener('change', (function(c){ return function(){ toggleFinderTargetCountry(c); renderFinderTargetFilters(); }; })(country));
        lbl.appendChild(ccb);
        lbl.appendChild(document.createTextNode(getFinderCountryFlag(country)+' '+getFinderCountryLabel(country)));
        lbl.addEventListener('click', function(e){ if(e.target!==ccb){ e.preventDefault(); ccb.checked=!ccb.checked; ccb.dispatchEvent(new Event('change')); } });
        list.appendChild(lbl);
      });
      div.appendChild(list);
    }
    wrap.appendChild(div);
  });
}

function getImportAnalysisTargetCountries(){
  var selectedNames = (_finderTargetCountries || []).slice().filter(Boolean);
  return selectedNames.map(function(name){
    var meta = getFinderCountryMeta(name);
    return {
      name: name,
      label: meta.label || name,
      flag: meta.flag || ''
    };
  });
}

function getFinderSourceSelection(){
  var continents = _finderSourceContinents.slice();
  var countries = _finderSourceCountries.slice();
  var blockedCountries = getFinderBlockedSourceCountries();
  var effectiveCountries = [];
  if(countries.length){
    effectiveCountries = countries.filter(function(country){
      return blockedCountries.indexOf(country) === -1;
    });
  } else {
    continents.forEach(function(cont){
      (FINDER_SOURCE_REGIONS[cont] || []).forEach(function(country){
        if(blockedCountries.indexOf(country) !== -1) return;
        if(effectiveCountries.indexOf(country) === -1) effectiveCountries.push(country);
      });
    });
  }
  var promptCountries = effectiveCountries.slice(0, 25);
  return {
    continents: continents,
    countries: countries,
    effectiveCountries: effectiveCountries,
    hasFilter: !!(continents.length || countries.length),
    summary: countries.length ? countries.join(', ') : continents.join(', '),
    promptText: effectiveCountries.length
      ? ('Only include exporter companies headquartered in these source countries: ' + promptCountries.join(', ') + (effectiveCountries.length > promptCountries.length ? (' and ' + (effectiveCountries.length - promptCountries.length) + ' more') : '') + '.')
      : '',
    keywordHint: countries.length ? countries.slice(0,3).join(', ') : (effectiveCountries[0] || continents[0] || '')
  };
}

function clearFinderSourceFilters(){
  _finderSourceContinents = [];
  _finderSourceCountries = [];
  var searchEl = document.getElementById('finderSourceSearch');
  if(searchEl) searchEl.value = '';
  renderFinderSourceFilters();
}

function toggleFinderSourceContinentAll(name){
  var allCountries = (FINDER_SOURCE_REGIONS[name]||[]).filter(function(c){ return !isFinderSourceCountryBlocked(c); });
  var allChecked = allCountries.length>0 && allCountries.every(function(c){ return _finderSourceCountries.indexOf(c)!==-1; });
  if(allChecked){
    allCountries.forEach(function(c){ var i=_finderSourceCountries.indexOf(c); if(i>=0)_finderSourceCountries.splice(i,1); });
  } else {
    allCountries.forEach(function(c){ if(_finderSourceCountries.indexOf(c)===-1)_finderSourceCountries.push(c); });
  }
  renderFinderSourceFilters();
}

function toggleFinderSourceContinent(name){
  var idx = _finderSourceContinents.indexOf(name);
  if(idx >= 0) _finderSourceContinents.splice(idx,1);
  else _finderSourceContinents.push(name);
  renderFinderSourceFilters();
}

function toggleFinderSourceCountry(name){
  if(isFinderSourceCountryBlocked(name)) return;
  var idx = _finderSourceCountries.indexOf(name);
  if(idx >= 0) _finderSourceCountries.splice(idx,1);
  else _finderSourceCountries.push(name);
  renderFinderSourceFilters();
}

function renderFinderSourceFilters(){
  var wrap = document.getElementById('finderSourceScopeWrap');
  var chipsEl = document.getElementById('finderSourceContinentChips');
  var selectedEl = document.getElementById('finderSourceSelected');
  if(!wrap || !chipsEl) return;
  var meta = getFinderModeMeta((document.getElementById('finder-mode')||{}).value || 'importers');
  wrap.style.display = 'block';
  syncFinderSourceAgainstTarget();
  var searchEl = document.getElementById('finderSourceSearch');
  var search = searchEl ? searchEl.value.toLowerCase().trim() : '';
  var blockedCountries = getFinderBlockedSourceCountries();
  chipsEl.innerHTML = '';
  var _sourceOpenGroups = window._finderSourceOpenGroups || {};
  window._finderSourceOpenGroups = _sourceOpenGroups;
  Object.keys(FINDER_SOURCE_REGIONS).forEach(function(cont){
    var allC = FINDER_SOURCE_REGIONS[cont]||[];
    var availableC = allC.filter(function(c){ return blockedCountries.indexOf(c)===-1; });
    var filteredC = allC.filter(function(c){ return !search || c.toLowerCase().indexOf(search)!==-1; });
    if(search && filteredC.length===0) return;
    var allChecked = availableC.length>0 && availableC.every(function(c){ return _finderSourceCountries.indexOf(c)!==-1; });
    var someChecked = !allChecked && availableC.some(function(c){ return _finderSourceCountries.indexOf(c)!==-1; });
    var isOpen = !!_sourceOpenGroups[cont] || search.length>0;
    var div = document.createElement('div');
    div.style.cssText = 'border-top:1px solid #F3F4F6;padding:0';
    var hdr = document.createElement('div');
    hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 10px;cursor:pointer;border-radius:8px;transition:background .15s';
    hdr.addEventListener('mouseenter', function(){ this.style.background='#F9FAFB'; });
    hdr.addEventListener('mouseleave', function(){ this.style.background='transparent'; });
    hdr.addEventListener('click', function(){ _sourceOpenGroups[cont]=!_sourceOpenGroups[cont]; renderFinderSourceFilters(); });
    var left = document.createElement('span');
    left.style.cssText = 'display:flex;align-items:center;gap:10px';
    var cb = document.createElement('div');
    cb.style.cssText = 'width:15px;height:15px;border-radius:4px;border:1.5px solid '+(allChecked?'#465fff':'#D1D5DB')+';background:'+(allChecked?'#465fff':'#fff')+';display:flex;align-items:center;justify-content:center;cursor:'+(availableC.length===0?'not-allowed':'pointer')+';flex-shrink:0;transition:all .15s'+(availableC.length===0?';opacity:.5':'');
    if(allChecked) cb.innerHTML = '<span style="color:#fff;font-size:9px;font-weight:700">✓</span>';
    else if(someChecked) { cb.style.background='#465fff'; cb.style.borderColor='#465fff'; cb.innerHTML='<span style="color:#fff;font-size:9px;font-weight:700">−</span>'; }
    cb.addEventListener('click', function(e){ e.stopPropagation(); if(availableC.length>0) toggleFinderSourceContinentAll(cont); });
    var nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'font-size:.78rem;font-weight:500;color:#344054';
    nameSpan.textContent = cont;
    left.appendChild(cb); left.appendChild(nameSpan);
    var right = document.createElement('span');
    right.style.cssText = 'display:flex;align-items:center;gap:6px';
    var countSpan = document.createElement('span');
    countSpan.style.cssText = 'font-size:.65rem;font-weight:600;background:#EFF4FF;color:#465fff;padding:2px 7px;border-radius:5px;min-width:36px;text-align:center';
    var selCount = availableC.filter(function(c){ return _finderSourceCountries.indexOf(c)!==-1; }).length;
    countSpan.textContent = availableC.length;
    var arrowSpan = document.createElement('span');
    arrowSpan.style.cssText = 'color:#9CA3AF;transition:transform .2s;transform:rotate('+(isOpen?'90':'0')+'deg);display:flex;align-items:center';
    arrowSpan.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
    right.appendChild(countSpan); right.appendChild(arrowSpan);
    hdr.appendChild(left); hdr.appendChild(right);
    div.appendChild(hdr);
    if(isOpen && filteredC.length){
      var list = document.createElement('div');
      list.style.cssText = 'padding:4px 10px 8px;display:flex;flex-wrap:wrap;gap:.25rem';
      filteredC.forEach(function(country){
        var blocked = blockedCountries.indexOf(country)!==-1;
        var checked = _finderSourceCountries.indexOf(country)!==-1;
        var lbl = document.createElement('label');
        lbl.style.cssText = 'display:flex;align-items:center;gap:3px;padding:3px 8px;background:'+(blocked?'rgba(148,163,184,.10)':checked?'rgba(70,95,255,.1)':'#F9FAFB')+';border-radius:6px;font-size:.68rem;cursor:'+(blocked?'not-allowed':'pointer')+';border:1px solid '+(blocked?'rgba(148,163,184,.25)':checked?'rgba(70,95,255,.3)':'#E5E7EB')+';color:#344054;font-weight:500;transition:all .15s;opacity:'+(blocked?'.55':'1');
        var ccb = document.createElement('input');
        ccb.type='checkbox'; ccb.checked=checked; ccb.disabled=blocked; ccb.style.display='none';
        ccb.addEventListener('change', (function(c){ return function(){ toggleFinderSourceCountry(c); }; })(country));
        lbl.appendChild(ccb);
        lbl.appendChild(document.createTextNode((typeof getFinderCountryFlag==='function'?getFinderCountryFlag(country):'')+' '+(typeof getFinderCountryLabel==='function'?getFinderCountryLabel(country):country)));
        lbl.addEventListener('click', function(e){ if(e.target!==ccb){ e.preventDefault(); ccb.checked=!ccb.checked; ccb.dispatchEvent(new Event('change')); } });
        list.appendChild(lbl);
      });
      div.appendChild(list);
    }
    chipsEl.appendChild(div);
  });
  if(selectedEl){
    var sel = getFinderSourceSelection();
    selectedEl.textContent = sel.hasFilter ? ('Tanlangan: '+sel.summary) : '';
  }
}

function getFinderModeMeta(mode){
  if(mode === 'exporters'){
    return {
      mode: 'exporters',
      countryLabel: '🌍 Maqsad davlatlar (shu davlatlarga eksport qiluvchi eksportyor kompaniyalar qidiriladi)',
      volumeLabel: 'Eksport hajmi',
      resultWord: 'eksportyorlari',
      actionLabel: 'eksportyor kompaniyalar',
      apolloKeyword: ' exporter supplier manufacturer to ',
      apolloTitles: ['Export Manager','Sales Manager','Business Development Manager','Commercial Director','Managing Director','CEO','Founder'],
      apolloFallbackTitles: ['Sales Manager','Managing Director','CEO','Founder'],
      promptRole: 'SELLERS / EXPORTERS / SUPPLIERS',
      promptVerb: 'EXPORT',
      promptVolumeField: 'export_volume_usd',
      sourceLabel: 'Eksport'
    };
  }
  return {
    mode: 'importers',
    countryLabel: '🌍 Maqsad davlatlar (importyor kompaniyalar qidiriladi)',
    volumeLabel: 'Import hajmi',
    resultWord: 'importyorlari',
    actionLabel: 'importyor kompaniyalar',
    apolloKeyword: ' importer buyer distributor in ',
    apolloTitles: ['Procurement Manager','Purchasing Manager','Sourcing Manager','Supply Chain Manager','Import Manager','Operations Manager','General Manager','CEO','Founder'],
    apolloFallbackTitles: ['Procurement Manager','Buyer','Sourcing Manager','CEO','Founder'],
    promptRole: 'BUYERS / IMPORTERS',
    promptVerb: 'IMPORT',
    promptVolumeField: 'import_volume_usd',
    sourceLabel: 'Import'
  };
}

function getApolloFinderKeywords(prod, meta, sourceScope, country, targetCountries){
  var parts = [];
  if(prod && prod.name_en) parts.push(prod.name_en);
  if(prod && prod.name_uz && prod.name_uz !== prod.name_en) parts.push(prod.name_uz);
  if(prod && prod.raw_name) parts.push(prod.raw_name);
  parts.push(meta && meta.mode === 'exporters' ? 'export supplier manufacturer' : 'import buyer distributor');
  if(country) parts.push(country);
  if(meta && meta.mode === 'exporters' && Array.isArray(targetCountries) && targetCountries.length){
    parts.push('exports to ' + targetCountries.slice(0,5).join(' '));
  }
  if(sourceScope && sourceScope.hasFilter && sourceScope.keywordHint) parts.push(sourceScope.keywordHint);
  return Array.from(new Set(parts.filter(Boolean).map(function(x){ return String(x).trim(); }).filter(Boolean))).join(' ');
}

function getApolloPreferredKeywords(prod){
  var text = [
    prod && prod.name_en,
    prod && prod.name_uz,
    prod && prod.raw_name,
    prod && prod.description,
    prod && prod.usage,
    prod && prod.main_sector
  ].filter(Boolean).join(' ');
  var normalized = apolloNormalizeText(text);
  var keywords = [];

  function pushAll(arr){
    arr.forEach(function(v){
      v = apolloStripHsNoise(v);
      if(v && keywords.indexOf(v) === -1) keywords.push(v);
    });
  }

  if(prod && prod.name_en) pushAll([prod.name_en]);
  if(prod && prod.name_uz && prod.name_uz !== prod.name_en) pushAll([prod.name_uz]);
  if(prod && prod.raw_name) pushAll([prod.raw_name]);

  if(/superphosphate/.test(normalized)) pushAll(['superphosphate','phosphate fertilizer','phosphate','fertilizer','agrochemical']);
  if(/phosph|fertili/.test(normalized)) pushAll(['phosphate','fertilizer','fertiliser','agrochemical','crop nutrition']);
  if(/cement|clinker/.test(normalized)) pushAll(['cement','clinker','construction materials','building materials']);
  if(/gypsum|plaster/.test(normalized)) pushAll(['gypsum','plaster','drywall','board']);
  if(/granite|marble|basalt|limestone|dolomite|stone/.test(normalized)) pushAll(['stone','granite','marble','basalt','limestone','quarry','building materials']);
  if(/kaolin|clay|bentonite/.test(normalized)) pushAll(['kaolin','clay','bentonite','industrial minerals','ceramics']);
  if(/silica|quartz|feldspar/.test(normalized)) pushAll(['silica','quartz','feldspar','glass','ceramics']);
  if(/lime|quicklime|slaked lime|cao|caoh/.test(normalized)) pushAll(['lime','quicklime','hydrated lime','construction materials']);
  if(/sulfur|sulphur|acid/.test(normalized)) pushAll(['sulfur','sulphur','acid','chemical']);

  // Ceramic & tile products (HS 6905, 6907, 6908 etc)
  if(/roof.*tile|tile.*roof|ceramic.*tile|keramika|roofing/.test(normalized)) pushAll(['roofing tiles','ceramic tiles','roof tiles','clay tiles','terracotta tiles','tile manufacturer','building ceramics']);
  if(/ceramic|keram|porcelain/.test(normalized)) pushAll(['ceramics','ceramic tiles','porcelain tiles','tile manufacturer','ceramic products']);
  if(/brick|g'isht/.test(normalized)) pushAll(['brick','clay brick','construction brick','building materials']);
  if(/glass|oyna/.test(normalized)) pushAll(['glass','float glass','glass products','glazing']);
  if(/fiber|fibre|composite/.test(normalized)) pushAll(['fiber','composite materials','construction composite']);
  if(/insulation|izol/.test(normalized)) pushAll(['insulation','thermal insulation','building insulation']);
  if(/pipe|truba/.test(normalized)) pushAll(['pipes','construction pipes','plumbing','drainage']);
  if(/wire|kabel|cable/.test(normalized)) pushAll(['cable','wire','electrical cable','construction cable']);
  if(/steel|po'lat|metal/.test(normalized)) pushAll(['steel','metal products','construction steel','structural steel']);
  if(/wood|yog'och|timber/.test(normalized)) pushAll(['wood','timber','lumber','wooden products']);
  if(/cotton|paxta/.test(normalized)) pushAll(['cotton','raw cotton','cotton fiber','textile']);
  if(/textile|to'qima/.test(normalized)) pushAll(['textile','fabric','garment','apparel']);
  if(/medicament|medicine|pharmaceutical|drug|dori|tablet|capsule|injection/.test(normalized)) pushAll(['pharmaceutical','medicine','drug manufacturer','medicaments','pharma','healthcare','API manufacturer']);
  if(/chemical|kimyo/.test(normalized)) pushAll(['chemical','industrial chemical','specialty chemical']);
  if(/organic.*chem|inorganic.*chem/.test(normalized)) pushAll(['chemical','specialty chemical','fine chemical']);
  if(/plastic|polimer/.test(normalized)) pushAll(['plastic','polymer','PVC','polyethylene']);
  if(/rubber|rezina/.test(normalized)) pushAll(['rubber','industrial rubber','rubber products']);
  if(/paper|qog'oz/.test(normalized)) pushAll(['paper','packaging','cardboard']);
  if(/food|oziq|grain|bug'doy|wheat|flour|un/.test(normalized)) pushAll(['food processing','grain','flour','food manufacturer']);
  if(/oil|yog|petroleum/.test(normalized)) pushAll(['oil','petroleum products','lubricant']);
  if(/solar|quyosh|energy/.test(normalized)) pushAll(['solar','renewable energy','solar panels']);
  if(/fertilizer|o'g\'it/.test(normalized)) pushAll(['fertilizer','agrochemical','crop nutrition']);
  if(/gold|oltin|silver|kumush|precious/.test(normalized)) pushAll(['gold','silver','precious metals','mining']);
  if(/copper|mis|aluminum|alyumin/.test(normalized)) pushAll(['copper','aluminum','non-ferrous metals']);
  if(/uranium|uran/.test(normalized)) pushAll(['uranium','nuclear','mining']);

  // Always add product English name variations
  if(prod && prod.name_en){
    var nameEn = prod.name_en.toLowerCase();
    // Add singular/plural and common industry terms
    var words = nameEn.split(/[\s,\/\-]+/).filter(function(w){ return w.length > 3; });
    words.forEach(function(w){ if(keywords.indexOf(w) === -1) keywords.push(w); });
  }

  return keywords.slice(0, 8);
}

/* ═══ TRADEATLAS FUNCTIONS ═══ */
var TRADEATLAS_COUNTRY_ALIASES = {
  'russia':'RU','russian federation':'RU','south korea':'KR','north korea':'KP',
  "ivory coast":'CI',"cote d ivoire":'CI',"cote d'ivoire":'CI',
  'dr congo':'CD','democratic republic of the congo':'CD','congo':'CG','republic of the congo':'CG',
  'czech republic':'CZ','czechia':'CZ','turkey':'TR','turkiye':'TR',
  'laos':'LA','viet nam':'VN','vietnam':'VN','palestine':'PS',
  'vatican city':'VA','holy see':'VA','eswatini':'SZ','swaziland':'SZ',
  'cape verde':'CV','cabo verde':'CV','micronesia':'FM',
  'timor leste':'TL','timor-leste':'TL','east timor':'TL','kosovo':'XK',
  'sao tome and principe':'ST','north macedonia':'MK','moldova':'MD','brunei':'BN',
  'united states':'US','united kingdom':'GB',
  'kyrgyzstan':'KG','kazakhstan':'KZ','tajikistan':'TJ','turkmenistan':'TM',
  'uzbekistan':'UZ','azerbaijan':'AZ','georgia':'GE','armenia':'AM',
  'iran':'IR','afghanistan':'AF','pakistan':'PK','mongolia':'MN','china':'CN'
};

function getTradeAtlasCountryNameMap(){
  if(window._tradeAtlasCountryNameMap) return window._tradeAtlasCountryNameMap;
  var reverse = {};
  try{
    if(typeof Intl !== 'undefined' && Intl.DisplayNames && Intl.supportedValuesOf){
      var regionNames = new Intl.DisplayNames(['en'], { type:'region' });
      Intl.supportedValuesOf('region').forEach(function(code){
        var label = regionNames.of(code);
        if(label) reverse[apolloNormalizeText(label)] = code;
      });
    }
  } catch(_e){}
  Object.keys(TRADEATLAS_COUNTRY_ALIASES).forEach(function(key){
    reverse[apolloNormalizeText(key)] = TRADEATLAS_COUNTRY_ALIASES[key];
  });
  window._tradeAtlasCountryNameMap = reverse;
  return reverse;
}

function getTradeAtlasCountryCode(countryName){
  var key = apolloNormalizeText(countryName || '');
  if(!key) return '';
  if(TRADEATLAS_COUNTRY_ALIASES[key]) return TRADEATLAS_COUNTRY_ALIASES[key];
  var reverse = getTradeAtlasCountryNameMap();
  return reverse[key] || '';
}

function getTradeAtlasProductKeyword(prod){
  var preferred = getApolloPreferredKeywords(prod).map(apolloStripHsNoise).filter(Boolean);
  var base = apolloStripHsNoise((prod && prod.name_en) || (prod && prod.raw_name) || '');
  var candidates = Array.from(new Set([base].concat(preferred))).filter(Boolean);
  var tokens = [];
  var seen = new Set();
  candidates.forEach(function(part){
    apolloNormalizeText(part).split(' ').forEach(function(word){
      var w = String(word || '').trim();
      if(!w || w.length < 3 || seen.has(w)) return;
      seen.add(w);
      tokens.push(w);
    });
  });
  return tokens.slice(0, 6).join(' ').trim().slice(0, 48);
}

function tradeAtlasNormalizeArray(data){
  if(Array.isArray(data)) return data;
  if(data && Array.isArray(data.firms)) return data.firms;
  if(data && Array.isArray(data.data)) return data.data;
  return [];
}

function formatTradeAtlasUsd(value){
  var num = Number(value || 0) || 0;
  if(!num) return ' - ';
  if(num >= 1000000000) return '$' + (num / 1000000000).toFixed(1).replace(/\.0$/,'') + 'B';
  if(num >= 1000000) return '$' + (num / 1000000).toFixed(1).replace(/\.0$/,'') + 'M';
  if(num >= 1000) return '$' + (num / 1000).toFixed(1).replace(/\.0$/,'') + 'K';
  return '$' + Math.round(num).toLocaleString('en-US');
}

function tradeAtlasComputeScore(firm){
  var docs = Number((firm && (firm.doc_count || firm.docCount || firm.shipment_count)) || 0) || 0;
  var tradeValue = Number((firm && (firm.total_trade_value_usd || firm.trade_value_usd)) || 0) || 0;
  var score = 72 + Math.round((Math.log(docs + 1) / Math.log(2)) * 3);
  if(tradeValue > 1000000) score += 4;
  if(tradeValue > 10000000) score += 4;
  return Math.max(72, Math.min(96, score));
}

function tradeAtlasPersonName(firm){
  return String(
    (firm && (firm.contact_person || firm.contact_name || firm.person_name || firm.person)) ||
    (firm && (firm.firm_name || firm.name)) ||
    'TradeAtlas kontakt'
  ).trim();
}

function mapTradeAtlasFirmToFinderResult(firm, meta, prod){
  var website = apolloAbsoluteUrl((firm && (firm.web || firm.website || firm.url)) || '');
  var email = String((firm && (firm.e_mail || firm.email || firm.email_address)) || '').trim();
  var phone = String((firm && (firm.tel || firm.phone || firm.phone_number)) || '').trim();
  var companyName = String((firm && (firm.firm_name || firm.name)) || '').trim();
  var countryName = String((firm && (firm.firm_country || firm.country || firm.country_name)) || '').trim();
  var cityState = String((firm && (firm.city_state || firm.city || firm.state)) || '').trim();
  var tradeValue = Number((firm && (firm.total_trade_value_usd || firm.trade_value_usd)) || 0) || 0;
  var quantity = Number((firm && (firm.total_quantity || firm.quantity)) || 0) || 0;
  var quantityUnit = String((firm && (firm.quantity_unit || firm.quantityUnit)) || '').trim();
  var counterpart = Array.isArray(firm && firm.counterpart_countries) ? firm.counterpart_countries.slice(0,3).join(', ') : '';
  var contact = {
    personId: '',
    name: tradeAtlasPersonName(firm),
    title: meta.mode === 'exporters' ? 'TradeAtlas eksport kontakti' : 'TradeAtlas import kontakti',
    email: email, telefon: phone, photoUrl: '',
    linkedin: String((firm && firm.linkedin) || '').trim(),
    website: website, source: 'TradeAtlas'
  };
  return {
    id: 'fc_ta_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
    kompaniya: companyName, rahbar: contact.name, lavozim: contact.title,
    email: email, telefon: phone, davlat: countryName, shahar: cityState || ' - ',
    soha: String((firm && (firm.sector || firm.industry || firm.product_group)) || '') || (prod ? formatBilingualProductName(prod) : ''),
    linkedin: contact.linkedin, website: website,
    description: counterpart ? ('Hamkor davlatlar: ' + counterpart) : '',
    keywords: String((firm && (firm.product_details || firm.hs_description)) || '').trim(),
    daromad: formatTradeAtlasUsd(tradeValue), score: tradeAtlasComputeScore(firm),
    manba: 'TradeAtlas', finderMode: meta.mode,
    xodimlar: Number((firm && firm.doc_count) || 0) || 0,
    products_imported: prod ? formatBilingualProductName(prod) : '',
    import_volume: tradeValue ? String(tradeValue) : '',
    contacts: [contact], _contactCandidates: [contact], _contactsBootstrapped: true,
    _tradeAtlasTradeValue: tradeValue, _tradeAtlasQuantity: quantity, _tradeAtlasQuantityUnit: quantityUnit
  };
}

async function fetchTradeAtlasCount(endpoint, payload){
  var resp = await fetch(TRADEATLAS_PROXY, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ mode: endpoint === 'firms/count' ? 'firms_count' : 'shipments_count', endpoint: endpoint, payload: payload || {} })
  });
  var data = {};
  try { data = await resp.json(); } catch(_e){}
  if(!resp.ok){ throw new Error((data && data.error) || ('TradeAtlas count error ' + resp.status)); }
  return (data && data.data) || data || {};
}

function _extractCountNumber(countData){
  if(!countData || typeof countData !== 'object') return null;
  var candidates = ['count','total','totalCount','firmsCount','firms_count','shipmentsCount','shipments_count','total_entries','totalEntries','importerCount','exporterCount'];
  for(var i=0;i<candidates.length;i++){
    if(typeof countData[candidates[i]] === 'number') return countData[candidates[i]];
  }
  // Sum importer + exporter if both present
  if(typeof countData.importerCount === 'number' || typeof countData.exporterCount === 'number'){
    return (countData.importerCount||0) + (countData.exporterCount||0);
  }
  // Walk nested
  var found = null;
  (function walk(o){
    if(!o || typeof o !== 'object' || found != null) return;
    Object.keys(o).forEach(function(k){
      if(found != null) return;
      var v = o[k], kl = k.toLowerCase();
      if(typeof v === 'number' && (kl.indexOf('count') !== -1 || kl.indexOf('total') !== -1)){ found = v; }
      else if(typeof v === 'object'){ walk(v); }
    });
  })(countData);
  return found;
}

async function showTradeAtlasPreSearchConfirm(prod, meta, targetCountries, sourceScope){
  var hsCode = (typeof getExactImportHsCode === 'function') ? getExactImportHsCode(prod) : (prod && prod.hs_code) || '';
  var targetCodes = (targetCountries || []).map(getTradeAtlasCountryCode).filter(Boolean);
  var sourceCodes = ((sourceScope && sourceScope.effectiveCountries) || []).map(getTradeAtlasCountryCode).filter(Boolean);
  var dateRange = (typeof getImportAnalysisDateRange === 'function') ? getImportAnalysisDateRange() : { startDate:'', endDate:'' };
  var taFlowType = (meta.mode === 'importers') ? 'IMPORT' : 'EXPORT';
  var taFirmType = (meta.mode === 'importers') ? 'IMPORTER' : 'EXPORTER';
  var taCountries = sourceCodes.length ? sourceCodes.slice() : targetCodes.slice();

  // Shipments/count — ishlaydigan /shipments/search bilan bir xil payload (firms/count buyruqi ishlamayotgan bo'lishi mumkin)
  var shipmentsPayload = {
    countries: targetCodes.slice(0, 5),
    flowType: 'IMPORT',
    firmFilter: [1, 2],
    parameters: [{ HS_CODE: hsCode }]
  };
  // Firms/count — ishlaydigan /firms/search bilan bir xil
  var firmsPayload = {
    countries: taCountries.slice(0, 5),
    firmType: taFirmType,
    flowType: taFlowType,
    firmFilter: [1, 2],
    parameters: [{ HS_CODE: hsCode }]
  };
  if(sourceCodes.length === 1){
    shipmentsPayload.parameters.push({ EXPORTER_COUNTRY_CODE: sourceCodes[0] });
  }
  // Yil filtrini ikkalasiga ham qoshamiz
  if(dateRange && dateRange.startDate){
    shipmentsPayload.startDate = dateRange.startDate;
    firmsPayload.startDate = dateRange.startDate;
  }
  if(dateRange && dateRange.endDate){
    shipmentsPayload.endDate = dateRange.endDate;
    firmsPayload.endDate = dateRange.endDate;
  }

  var loading = toastLoading('⏳ TradeAtlas: so\'rov hajmi tekshirilmoqda (0 kredit)...');
  var firmsCount = null, shipmentsCount = null, errMsg = '';
  try {
    var results = await Promise.allSettled([
      fetchTradeAtlasCount('firms/count', firmsPayload),
      fetchTradeAtlasCount('shipments/count', shipmentsPayload)
    ]);
    if(results[0].status === 'fulfilled') firmsCount = _extractCountNumber(results[0].value);
    if(results[1].status === 'fulfilled') shipmentsCount = _extractCountNumber(results[1].value);
    if(firmsCount == null && shipmentsCount == null){
      errMsg = (results[0].reason && results[0].reason.message) || (results[1].reason && results[1].reason.message) || 'Count endpointi javob qaytarmadi';
    }
  } catch(e){ errMsg = e.message; }
  if(loading && loading.parentNode){ clearTimeout(loading._toastTimer); loading.remove(); }

  return await new Promise(function(resolve){
    // Kredit = faqat kompaniyalar soni (firms/search orqali yuklanadi, shipmentsiz)
    var firmsTxtValue = firmsCount;
    var firmsEstimated = false;
    if((firmsCount == null || firmsCount === 0) && shipmentsCount){
      firmsTxtValue = Math.max(1, Math.round(shipmentsCount / 10));
      firmsEstimated = true;
    }
    var estimatedCredits = firmsTxtValue != null ? firmsTxtValue : '?';
    var firmsTxt = firmsTxtValue != null ? (firmsEstimated ? '~' : '') + Number(firmsTxtValue).toLocaleString() : '—';
    var shipTxt = shipmentsCount != null ? Number(shipmentsCount).toLocaleString() : '—';

    var bodyCards =
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin-bottom:1rem">'+
        '<div style="padding:.85rem;border-radius:12px;background:rgba(15,118,110,.08);border:1px solid rgba(15,118,110,.25)"><div style="font-size:.6rem;color:#115E59;font-weight:700;letter-spacing:.04em">KOMPANIYALAR</div><div style="font-size:1.3rem;font-weight:800;color:#0F766E;margin-top:2px">'+firmsTxt+'</div></div>'+
        '<div style="padding:.85rem;border-radius:12px;background:rgba(67,97,238,.08);border:1px solid rgba(67,97,238,.2)"><div style="font-size:.6rem;color:#1E3A8A;font-weight:700;letter-spacing:.04em">SHIPMENTLAR</div><div style="font-size:1.3rem;font-weight:800;color:#4361EE;margin-top:2px">'+shipTxt+'</div></div>'+
        '<div style="padding:.85rem;border-radius:12px;background:linear-gradient(135deg,rgba(217,119,6,.12),rgba(245,158,11,.08));border:1px solid rgba(217,119,6,.25)"><div style="font-size:.6rem;color:#9A3412;font-weight:700;letter-spacing:.04em">TAXMINIY KREDIT</div><div style="font-size:1.3rem;font-weight:800;color:#D97706;margin-top:2px">~'+(typeof estimatedCredits === 'number' ? estimatedCredits.toLocaleString() : estimatedCredits)+'</div></div>'+
      '</div>';

    var errBlock = errMsg ? ('<div style="padding:.7rem;border-radius:8px;background:rgba(239,35,60,.08);color:#991B1B;font-size:.75rem;margin-bottom:.8rem">⚠️ '+escHtml(errMsg)+'</div>') : '';

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:16px;padding:1.6rem;max-width:500px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3)';
    box.innerHTML =
      '<div style="display:flex;align-items:center;gap:.7rem;margin-bottom:1rem"><div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#0F766E,#059669);display:flex;align-items:center;justify-content:center;color:#fff"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M2 12h20M12 2c2.5 2.8 4 6.2 4 10s-1.5 7.2-4 10c-2.5-2.8-4-6.2-4-10s1.5-7.2 4-10z" stroke="currentColor" stroke-width="1.8"/></svg></div><div><h3 style="margin:0;font-size:1.05rem;color:#1a1a2e">TradeAtlas so\'rov xulosasi</h3><div style="font-size:.7rem;color:#64748B">Count endpointlari (0 kredit)</div></div></div>'+
      '<div style="background:#F8FAFC;border-radius:10px;padding:.85rem;margin-bottom:1rem;font-size:.78rem;color:#475569">'+
        '<div style="margin-bottom:.3rem"><strong>Mahsulot:</strong> '+escHtml(prod.name_en||prod.name_uz||'—')+' (HS '+escHtml(hsCode||'—')+')</div>'+
        '<div><strong>Davlatlar:</strong> '+escHtml(taCountries.slice(0,5).join(', ') || '—')+(taCountries.length>5?'...':'')+'</div>'+
      '</div>'+
      bodyCards + errBlock +
      '<div style="display:flex;gap:.7rem;justify-content:flex-end">'+
        '<button id="taPreCancel" style="padding:.6rem 1.3rem;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#475569;font-weight:600;cursor:pointer;font-size:.82rem">Bekor qilish</button>'+
        '<button id="taPreConfirm" style="padding:.6rem 1.3rem;border-radius:10px;border:none;background:linear-gradient(135deg,#0F766E,#059669);color:#fff;font-weight:600;cursor:pointer;font-size:.82rem">Yuklab olish</button>'+
      '</div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    var close = function(v){ if(overlay.parentNode) overlay.parentNode.removeChild(overlay); resolve(v); };
    document.getElementById('taPreCancel').onclick = function(){ close(false); };
    document.getElementById('taPreConfirm').onclick = function(){ close(true); };
    overlay.addEventListener('click', function(e){ if(e.target === overlay) close(false); });
  });
}

async function fetchTradeAtlasUsage(){
  var resp = await fetch(TRADEATLAS_PROXY, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ mode: 'usage', endpoint: 'statistics/usage' })
  });
  var data = {};
  try { data = await resp.json(); } catch(_e){}
  if(!resp.ok){
    throw new Error((data && data.error) || ('TradeAtlas error ' + resp.status));
  }
  return data || {};
}

function _parseTradeAtlasUsage(data){
  // Try common shapes — proxy may forward raw /statistics/usage response
  if(!data) return null;
  var out = { limit: null, used: null, remaining: null, raw: data };
  var root = data.usage || data.data || data;
  if(typeof root === 'object'){
    // Look for numeric fields in any nested structure
    var searchKeys = ['remaining','limit','used','quota','total','count','downloadLimit','downloadUsed','downloadRemaining'];
    function walk(obj){
      if(!obj || typeof obj !== 'object') return;
      Object.keys(obj).forEach(function(k){
        var v = obj[k];
        var kl = k.toLowerCase();
        if(typeof v === 'number'){
          if(kl.indexOf('remain') !== -1 && out.remaining == null) out.remaining = v;
          else if(kl === 'limit' || kl.indexOf('limit') !== -1) { if(out.limit == null) out.limit = v; }
          else if(kl.indexOf('used') !== -1 && out.used == null) out.used = v;
        } else if(typeof v === 'object'){ walk(v); }
      });
    }
    walk(root);
  }
  if(out.remaining == null && typeof out.limit === 'number' && typeof out.used === 'number'){
    out.remaining = out.limit - out.used;
  }
  return out;
}

async function showTradeAtlasUsageDialog(){
  var loading = toastLoading('⏳ TradeAtlas kredit holati tekshirilmoqda...');
  var usage = null, errMsg = '';
  try {
    var raw = await fetchTradeAtlasUsage();
    usage = _parseTradeAtlasUsage(raw);
  } catch(e){
    errMsg = (e && e.message) || 'Noma\'lum xato';
  }
  if(loading && loading.parentNode){ clearTimeout(loading._toastTimer); loading.remove(); }

  var bodyHtml;
  if(usage && (usage.remaining != null || usage.limit != null || usage.used != null)){
    var remTxt = usage.remaining != null ? Number(usage.remaining).toLocaleString() : '—';
    var limTxt = usage.limit != null ? Number(usage.limit).toLocaleString() : '—';
    var usedTxt = usage.used != null ? Number(usage.used).toLocaleString() : '—';
    var pct = (usage.limit && usage.used != null) ? Math.min(100, Math.round(usage.used/usage.limit*100)) : 0;
    bodyHtml =
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin-bottom:1rem">'+
        '<div style="padding:.85rem;border-radius:12px;background:linear-gradient(135deg,rgba(5,150,105,.12),rgba(6,214,160,.08));border:1px solid rgba(5,150,105,.25)"><div style="font-size:.6rem;color:#065F46;font-weight:700;letter-spacing:.04em">QOLDI</div><div style="font-size:1.3rem;font-weight:800;color:#059669;margin-top:2px">'+remTxt+'</div></div>'+
        '<div style="padding:.85rem;border-radius:12px;background:rgba(67,97,238,.08);border:1px solid rgba(67,97,238,.2)"><div style="font-size:.6rem;color:#1E3A8A;font-weight:700;letter-spacing:.04em">SARFLANDI</div><div style="font-size:1.3rem;font-weight:800;color:#4361EE;margin-top:2px">'+usedTxt+'</div></div>'+
        '<div style="padding:.85rem;border-radius:12px;background:rgba(148,163,184,.08);border:1px solid rgba(148,163,184,.25)"><div style="font-size:.6rem;color:#475569;font-weight:700;letter-spacing:.04em">JAMI LIMIT</div><div style="font-size:1.3rem;font-weight:800;color:#334155;margin-top:2px">'+limTxt+'</div></div>'+
      '</div>'+
      (usage.limit ? ('<div style="height:8px;border-radius:999px;background:rgba(148,163,184,.15);overflow:hidden;margin-bottom:1rem"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#059669,#06D6A0)"></div></div>') : '');
  } else {
    bodyHtml = '<div style="padding:1rem;border-radius:10px;background:rgba(239,35,60,.08);border:1px solid rgba(239,35,60,.25);color:#991B1B;font-size:.78rem">⚠️ Kredit ma\'lumotlari olinmadi.<br><span style="color:#475569">'+escHtml(errMsg || 'Proxy endpointi statistics/usage ni qo\'llab-quvvatlamaydi.')+'</span></div>';
  }

  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
  var box = document.createElement('div');
  box.style.cssText = 'background:#fff;border-radius:16px;padding:1.6rem;max-width:460px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,.3)';
  box.innerHTML =
    '<div style="display:flex;align-items:center;gap:.7rem;margin-bottom:1.1rem"><div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#0F766E,#059669);display:flex;align-items:center;justify-content:center;color:#fff"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M2 12h20M12 2c2.5 2.8 4 6.2 4 10s-1.5 7.2-4 10c-2.5-2.8-4-6.2-4-10s1.5-7.2 4-10z" stroke="currentColor" stroke-width="1.8"/></svg></div><div><h3 style="margin:0;font-size:1.05rem;color:#1a1a2e">TradeAtlas kredit holati</h3><div style="font-size:.7rem;color:#64748B">GET /statistics/usage</div></div></div>'+
    bodyHtml+
    '<div style="display:flex;justify-content:flex-end"><button id="taUsageClose" style="padding:.55rem 1.3rem;border-radius:10px;border:none;background:linear-gradient(135deg,#0F766E,#059669);color:#fff;font-weight:600;cursor:pointer;font-size:.82rem">Yopish</button></div>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  var close = function(){ if(overlay.parentNode) overlay.parentNode.removeChild(overlay); };
  document.getElementById('taUsageClose').onclick = close;
  overlay.addEventListener('click', function(e){ if(e.target === overlay) close(); });

  if(usage && usage.remaining != null){
    try { localStorage.setItem('tradeAtlasCreditsRemaining', String(usage.remaining)); } catch(_e){}
    _updateTradeAtlasCreditBadge(usage.remaining);
  }
}

function _updateTradeAtlasCreditBadge(remaining){
  var btns = document.querySelectorAll('button[onclick*="runCompanyFinder(\'tradeatlas\')"]');
  btns.forEach(function(btn){
    var badge = btn.querySelector('.ta-credit-badge');
    if(!badge){
      badge = document.createElement('span');
      badge.className = 'ta-credit-badge';
      badge.style.cssText = 'margin-left:6px;padding:2px 7px;border-radius:999px;background:rgba(255,255,255,.22);font-size:.62rem;font-weight:700;letter-spacing:.02em';
      btn.appendChild(badge);
    }
    var num = Number(remaining);
    var label = num >= 1000 ? (num/1000).toFixed(num>=10000?0:1).replace(/\.0$/,'')+'K' : String(num);
    badge.textContent = label;
  });
}

(function _initTradeAtlasCreditBadge(){
  try {
    var cached = localStorage.getItem('tradeAtlasCreditsRemaining');
    if(cached) _updateTradeAtlasCreditBadge(cached);
  } catch(_e){}
  document.addEventListener('DOMContentLoaded', function(){
    try {
      var cached = localStorage.getItem('tradeAtlasCreditsRemaining');
      if(cached) _updateTradeAtlasCreditBadge(cached);
    } catch(_e){}
  });
})();

async function tradeAtlasRequestJson(payload){
  var resp = await fetch(TRADEATLAS_PROXY, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload || {})
  });
  var data = {};
  try { data = await resp.json(); } catch(_e){}
  var errMsg = String((data && data.error) || '').trim();
  if(!resp.ok || (errMsg && errMsg.toLowerCase() !== 'null' && errMsg.toLowerCase() !== 'undefined')){
    if(/credit limit is exceeded/i.test(errMsg)){
      throw new Error('TradeAtlas trial limiti tugagan. TradeAtlas hisobidan limitni yangilash kerak.');
    }
    throw new Error(errMsg || ('TradeAtlas error ' + resp.status));
  }
  return data || {};
}

async function tradeAtlasFinderSearch(prod, meta, targetCountries, sourceScope){
  var hsCode = getExactImportHsCode(prod);
  if(!hsCode) throw new Error('TradeAtlas uchun mahsulot HS kodi topilmadi');
  var targetCodes = (targetCountries || []).map(getTradeAtlasCountryCode).filter(Boolean);
  if(!targetCodes.length) throw new Error('TradeAtlas uchun maqsad davlat kodi topilmadi');
  var sourceCodes = ((sourceScope && sourceScope.effectiveCountries) || []).map(getTradeAtlasCountryCode).filter(Boolean);
  var dateRange = getImportAnalysisDateRange();
  var taFlowType = (meta.mode === 'importers') ? 'IMPORT' : 'EXPORT';
  var taFirmType = (meta.mode === 'importers') ? 'IMPORTER' : 'EXPORTER';
  var taCountries = sourceCodes.length ? sourceCodes.slice() : targetCodes.slice();
  var payload = {
    accountId: (window.TRADEATLAS_ACCOUNT_ID || (DB.settings && DB.settings.tradeAtlasAccountId) || 'investnavoi.uz'),
    countries: taCountries, firmFilter: [0,1,2], firmType: taFirmType, flowType: taFlowType,
    page: 1, parameters: [{ HS_CODE: hsCode }], mode: meta.mode,
    targetCountries: targetCodes, sourceCountries: sourceCodes,
    hsCode: hsCode, startDate: dateRange.startDate, endDate: dateRange.endDate, size: 250
  };
  var pageSize = 250, maxPages = 20;
  var found = [], expectedTotal = 0;
  for(var page=1; page<=maxPages; page++){
    payload.page = page;
    payload.size = pageSize;
    var data = await tradeAtlasRequestJson(payload);
    var firms = tradeAtlasNormalizeArray(data);
    if(!expectedTotal) expectedTotal = Number((data && data.count) || 0) || 0;
    var beforeCount = found.length;
    firms.forEach(function(firm){
      var item = mapTradeAtlasFirmToFinderResult(firm, meta, prod);
      if(!item || !String(item.kompaniya || '').trim()) return;
      apolloUpsertFinderItem(found, item, meta);
    });
    if(!firms.length) break;
    if(found.length === beforeCount) break;
    if(expectedTotal > 0 && found.length >= expectedTotal) break;
    if(firms.length < pageSize) break;
  }
  return found.filter(finderResultIsRenderable).sort(function(a,b){
    return (Number(b._tradeAtlasTradeValue || 0) - Number(a._tradeAtlasTradeValue || 0)) || ((b.score || 0) - (a.score || 0));
  });
}

// Faqat /firms/search orqali kompaniyalarni olish (arzon yol — 1 kredit har firma)
async function tradeAtlasFirmsOnlySearch(prod, meta, targetCountries, sourceScope){
  var hsCode = getExactImportHsCode(prod);
  if(!hsCode) throw new Error('TradeAtlas uchun mahsulot HS kodi topilmadi');
  var targetCodes = (targetCountries || []).map(getTradeAtlasCountryCode).filter(Boolean);
  if(!targetCodes.length) throw new Error('TradeAtlas uchun maqsad davlat kodi topilmadi');
  var sourceCodes = ((sourceScope && sourceScope.effectiveCountries) || []).map(getTradeAtlasCountryCode).filter(Boolean);
  var taFirmType = (meta.mode === 'importers') ? 'IMPORTER' : 'EXPORTER';
  var taCountries = sourceCodes.length ? sourceCodes.slice() : targetCodes.slice();
  var dateRange = getImportAnalysisDateRange();

  var found = [];
  // TradeAtlas cheklovi: countries max 5 ta — 5 talik chunk'larga bolamiz
  var chunks = [];
  for(var i = 0; i < taCountries.length; i += 5){
    chunks.push(taCountries.slice(i, i + 5));
  }
  if(!chunks.length) chunks = [[]];

  for(var ch = 0; ch < chunks.length; ch++){
    var chunkCountries = chunks[ch];
    // Legacy firms shape — proxy shuni /firms/search ga yuboradi (hasTargetShape=false)
    for(var page = 1; page <= 20; page++){
      var payload = {
        countries: chunkCountries,
        hsCode: hsCode,
        mode: meta.mode,
        page: page,
        firmType: taFirmType,
        flowType: (meta.mode === 'importers') ? 'IMPORT' : 'EXPORT',
        firmFilter: [1, 2],
        parameters: [{ HS_CODE: hsCode }]
      };
      if(dateRange && dateRange.startDate) payload.startDate = dateRange.startDate;
      if(dateRange && dateRange.endDate) payload.endDate = dateRange.endDate;
      var data = await tradeAtlasRequestJson(payload);
      var firms = tradeAtlasNormalizeArray(data);
      if(!firms.length) break;
      var beforeCount = found.length;
      firms.forEach(function(firm){
        var item = mapTradeAtlasFirmToFinderResult(firm, meta, prod);
        if(!item || !String(item.kompaniya || '').trim()) return;
        apolloUpsertFinderItem(found, item, meta);
      });
      if(found.length === beforeCount) break;
      if(firms.length < 50) break;
    }
  }
  return found.filter(finderResultIsRenderable).sort(function(a,b){
    return (Number(b._tradeAtlasTradeValue || 0) - Number(a._tradeAtlasTradeValue || 0)) || ((b.score || 0) - (a.score || 0));
  });
}

function tradeAtlasFirmCountryCode(firm){
  var direct = String((firm && (firm.firm_country_code || firm.country_code || firm.countryCode)) || '').trim().toUpperCase();
  if(direct && direct.length === 2) return direct;
  return getTradeAtlasCountryCode((firm && (firm.firm_country || firm.country || firm.country_name)) || '');
}

function tradeAtlasQuantityToKg(qty, unit){
  var value = Number(qty || 0) || 0;
  if(!(value > 0)) return 0;
  var u = String(unit || '').toLowerCase();
  if(u && u.indexOf('kg') === -1 && (u.indexOf('ton') !== -1 || u === 't' || u === 'tons')) return value * 1000;
  return value;
}

function tradeAtlasPickImporterCompany(firm){
  var direct = String((firm && (firm.importer_company || firm.importer_firm || firm.importer_firm_name || firm.importer_name || firm.importer)) || '').trim();
  if(direct && direct !== '.') return direct;
  var examples = Array.isArray(firm && firm.shipment_examples) ? firm.shipment_examples : [];
  for(var i=0; i<examples.length; i++){
    var ex = examples[i] || {};
    var cand = String(ex.importerCompany || ex.importer_company || ex.importerFirm || ex.importer_firm || ex.importerName || ex.importer_name || ex.importer || ex.buyer || '').trim();
    if(cand && cand !== '.') return cand;
  }
  return '';
}

function tradeAtlasParseNumber(value){
  if(value === null || value === undefined) return 0;
  if(typeof value === 'number') return Number.isFinite(value) ? value : 0;
  var text = String(value).trim();
  if(!text || text === '.') return 0;
  var cleaned = text.replace(/[^0-9.,-]/g, '').replace(/\s+/g, '');
  if(!cleaned) return 0;
  var hasComma = cleaned.indexOf(',') !== -1;
  var hasDot = cleaned.indexOf('.') !== -1;
  if(hasComma && hasDot) cleaned = cleaned.replace(/,/g, '');
  else if(hasComma && !hasDot) cleaned = cleaned.replace(',', '.');
  var num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function tradeAtlasPickUsdFob(firm){
  var directCandidates = [
    firm && firm.total_fob_value_usd, firm && firm.total_fob_usd,
    firm && firm.fob_value_usd, firm && firm.fob_usd,
    firm && firm.total_trade_value_fob_usd, firm && firm.trade_value_fob_usd
  ];
  if(firm && typeof firm === 'object'){
    Object.keys(firm).forEach(function(key){
      var k = String(key || '').toLowerCase();
      if(k.indexOf('fob') !== -1 && (k.indexOf('usd') !== -1 || k.indexOf('value') !== -1)) directCandidates.push(firm[key]);
    });
  }
  for(var i=0; i<directCandidates.length; i++){
    var dv = tradeAtlasParseNumber(directCandidates[i]);
    if(dv > 0) return dv;
  }
  var examples = Array.isArray(firm && firm.shipment_examples) ? firm.shipment_examples : [];
  var sumFromExamples = 0;
  for(var j=0; j<examples.length; j++){
    var ex = examples[j] || {};
    var exCandidates = [ex.fobValueUsd, ex.fob_value_usd, ex.fobUsd, ex.fob_usd, ex.usdFob, ex.usd_fob];
    Object.keys(ex).forEach(function(key){
      var k = String(key || '').toLowerCase();
      if(k.indexOf('fob') !== -1 && (k.indexOf('usd') !== -1 || k.indexOf('value') !== -1)) exCandidates.push(ex[key]);
    });
    var ev = 0;
    for(var ec=0; ec<exCandidates.length; ec++){ ev = tradeAtlasParseNumber(exCandidates[ec]); if(ev > 0) break; }
    if(ev > 0) sumFromExamples += ev;
  }
  if(sumFromExamples > 0) return sumFromExamples;
  return tradeAtlasParseNumber((firm && (firm.total_trade_value_usd || firm.trade_value_usd)) || 0);
}

function buildTradeAtlasAnalysisRow(firm, reporterLabel, year){
  var companyName = String((firm && (firm.firm_name || firm.name)) || '').trim();
  if(!companyName) return null;
  var exporterCountry = String((firm && (firm.firm_country || firm.country || firm.country_name)) || '').trim();
  var tradeValue = tradeAtlasPickUsdFob(firm);
  var qtyRaw = tradeAtlasParseNumber((firm && (firm.total_quantity || firm.quantity)) || 0);
  var qtyUnitRaw = String((firm && (firm.quantity_unit || firm.quantityUnit)) || '').trim();
  var qtyKg = tradeAtlasQuantityToKg(qtyRaw, qtyUnitRaw);
  var importerCompany = tradeAtlasPickImporterCompany(firm);
  return {
    period: String(year || ''), reporter: reporterLabel || '',
    partner: companyName, partnerDesc: companyName, partnerCode: 1,
    value: tradeValue, weight: qtyKg, quantity: qtyKg, quantityUnit: 'Kilogram',
    exporterCountry: exporterCountry || '',
    exporterCountryCode: tradeAtlasFirmCountryCode(firm) || '',
    importerCompany: importerCompany || '', companyName: companyName,
    companyWebsite: String((firm && (firm.web || firm.website || firm.url)) || '').trim(),
    companyEmail: String((firm && (firm.e_mail || firm.email || firm.email_address)) || '').trim(),
    companyPhone: String((firm && (firm.tel || firm.phone || firm.phone_number)) || '').trim(),
    docCount: Number((firm && (firm.doc_count || firm.docCount || firm.shipment_count)) || 0) || 0
  };
}

async function fetchTradeAtlasImportAnalysis(prod, targetCountries, sourceScope){
  var hsCode = getExactImportHsCode(prod);
  if(!hsCode) throw new Error('TradeAtlas uchun mahsulot HS kodi topilmadi');
  var selectedTargets = (targetCountries || []).slice();
  if(!selectedTargets.length) return [];
  var modeMeta = getFinderModeMeta((document.getElementById('finder-mode') || {}).value || 'exporters');
  var taFlowType = (modeMeta.mode === 'importers') ? 'IMPORT' : 'EXPORT';
  var taFirmType = (modeMeta.mode === 'importers') ? 'IMPORTER' : 'EXPORTER';
  var years = getImportAnalysisDisplayYears();
  var accountId = (window.TRADEATLAS_ACCOUNT_ID || (DB.settings && DB.settings.tradeAtlasAccountId) || 'investnavoi.uz');
  var sourceSelection = sourceScope || getFinderSourceSelection();
  var sourceCodes = ((sourceSelection && sourceSelection.effectiveCountries) || []).map(getTradeAtlasCountryCode).filter(Boolean);
  var sourceCodeSet = {};
  sourceCodes.forEach(function(code){ sourceCodeSet[String(code || '').toUpperCase()] = true; });
  var out = [];
  for(var ti=0; ti<selectedTargets.length; ti++){
    var target = selectedTargets[ti];
    var targetName = typeof target === 'string' ? target : String((target && (target.name || target.label || target.code)) || '').trim();
    if(!targetName) continue;
    var targetCode = getTradeAtlasCountryCode(targetName);
    var targetLabel = typeof target === 'string' ? (getFinderCountryLabel(targetName) || targetName) : (target.label || getFinderCountryLabel(targetName) || targetName);
    var targetFlag = typeof target === 'string' ? (getFinderCountryFlag(targetName) || '') : (target.flag || getFinderCountryFlag(targetName) || '');
    var countryNode = {
      code: targetCode || String((target && target.code) || '').trim().toUpperCase(),
      name: targetName, flag: targetFlag, import_usd: 0, trend_pct: 0, volume_tons: 0,
      products: [], year_imports: {}, year_statuses: {}, status: 'no_data'
    };
    var countryWeightKg = 0;
    for(var yi=0; yi<years.length; yi++){
      var year = String(years[yi] || '');
      var requestCountries = sourceCodes.length ? sourceCodes.slice() : (targetCode ? [targetCode] : []);
      if(!requestCountries.length){ countryNode.year_imports[year] = 0; countryNode.year_statuses[year] = 'no_data'; continue; }
      var payload = {
        accountId: accountId, countries: requestCountries, firmFilter: [0,1,2],
        firmType: taFirmType, flowType: taFlowType, page: 1,
        parameters: [{ HS_CODE: hsCode }], mode: modeMeta.mode,
        targetCountries: targetCode ? [targetCode] : [], sourceCountries: sourceCodes.slice(),
        hsCode: hsCode, startDate: year + '-01-01', endDate: year + '-12-31', size: 250
      };
      var yearFirmMap = {};
      var pageSize = 250, maxPages = 8, expectedTotal = 0;
      for(var page=1; page<=maxPages; page++){
        payload.page = page; payload.size = pageSize;
        var pageData = await tradeAtlasRequestJson(payload);
        var pageFirms = tradeAtlasNormalizeArray(pageData);
        if(!expectedTotal) expectedTotal = Number((pageData && pageData.count) || 0) || 0;
        if(!pageFirms.length) break;
        pageFirms.forEach(function(firm){
          var row = buildTradeAtlasAnalysisRow(firm, targetLabel, year);
          if(!row) return;
          var firmCode = String(row.exporterCountryCode || '').toUpperCase();
          if(sourceCodes.length && firmCode && !sourceCodeSet[firmCode]) return;
          var dedupeKey = [apolloNormalizeText(row.companyName || row.partner || ''), firmCode || apolloNormalizeText(row.exporterCountry || ''), row.period].join('|');
          if(!yearFirmMap[dedupeKey]){ yearFirmMap[dedupeKey] = row; return; }
          yearFirmMap[dedupeKey].value += row.value;
          yearFirmMap[dedupeKey].weight += row.weight;
          yearFirmMap[dedupeKey].quantity = yearFirmMap[dedupeKey].weight;
          yearFirmMap[dedupeKey].docCount = (yearFirmMap[dedupeKey].docCount || 0) + (row.docCount || 0);
          if(!yearFirmMap[dedupeKey].companyWebsite && row.companyWebsite) yearFirmMap[dedupeKey].companyWebsite = row.companyWebsite;
          if(!yearFirmMap[dedupeKey].importerCompany && row.importerCompany) yearFirmMap[dedupeKey].importerCompany = row.importerCompany;
          if(!yearFirmMap[dedupeKey].companyEmail && row.companyEmail) yearFirmMap[dedupeKey].companyEmail = row.companyEmail;
          if(!yearFirmMap[dedupeKey].companyPhone && row.companyPhone) yearFirmMap[dedupeKey].companyPhone = row.companyPhone;
        });
        if(expectedTotal > 0 && Object.keys(yearFirmMap).length >= expectedTotal) break;
        if(pageFirms.length < pageSize) break;
      }
      var yearRows = Object.keys(yearFirmMap).map(function(key){ return yearFirmMap[key]; }).sort(function(a,b){ return (Number(b.value||0)||0) - (Number(a.value||0)||0); });
      var yearValue = yearRows.reduce(function(sum, row){ return sum + (Number(row.value||0)||0); }, 0);
      var yearWeightKg = yearRows.reduce(function(sum, row){ return sum + (Number(row.weight||0)||0); }, 0);
      countryNode.year_imports[year] = yearValue;
      countryNode.year_statuses[year] = (yearValue > 0 || yearRows.length) ? 'ok' : 'no_data';
      countryNode.products = countryNode.products.concat(yearRows);
      countryNode.import_usd += yearValue;
      countryWeightKg += yearWeightKg;
    }
    countryNode.volume_tons = countryWeightKg > 0 ? (countryWeightKg / 1000) : 0;
    countryNode.status = countryNode.import_usd > 0 ? 'ok' : 'no_data';
    out.push(countryNode);
  }
  return out;
}

/* ═══ END TRADEATLAS FUNCTIONS ═══ */

function apolloStripHsNoise(value){
  var v = String(value || '');
  if(!v) return '';
  // Product names often include HS in parentheses: "(251611)".
  v = v.replace(/\(\s*\d{4,10}\s*\)/g, ' ');
  // Also remove standalone long numeric tokens from keyword query.
  v = v.replace(/\b\d{4,10}\b/g, ' ');
  v = v.replace(/\s+/g, ' ').trim();
  return v;
}

function isApolloBuildingMaterialsProduct(prod){
  var text = apolloNormalizeText([
    prod && prod.name_en,
    prod && prod.name_uz,
    prod && prod.raw_name,
    prod && prod.description,
    prod && prod.main_sector
  ].filter(Boolean).join(' '));
  var hsCode = String((prod && prod.hs_code) || '').replace(/\D/g,'');
  var hsChapter = hsCode.slice(0,2);
  if(['25','68','69','70'].indexOf(hsChapter) !== -1) return true;
  return /(granite|marble|kaolin|stone|slab|tile|ceramic|limestone|dolomite|basalt|quarry)/.test(text);
}

function getApolloIndustryKeywordBoost(prod){
  if(!isApolloBuildingMaterialsProduct(prod)) return [];
  return ['building materials','construction materials','stone'];
}

function dedupeFinderResults(){
  var map = new Map();
  (_finderResults || []).forEach(function(item){
    if(!item || !String(item.kompaniya || '').trim()) return;
    var key = [apolloCompanyKey(item.kompaniya), apolloNormalizeText(item.davlat), _finderMode || item.finderMode || ''].join('|');
    if(!map.has(key)){
      map.set(key, item);
      return;
    }
    apolloMergeFinderItem(map.get(key), item, { mode:_finderMode || item.finderMode || 'importers' });
  });
  _finderResults = Array.from(map.values()).filter(function(item){
    return !!String(item.kompaniya || '').trim();
  });
}

function mapApolloPersonToFinderResult(p, country, meta){
  var org = p.organization || {};
  var item = {
    id:'fc_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),
    kompaniya:org.name || p.organization_name || '',
    rahbar:((p.first_name||'')+' '+(p.last_name||'')).trim(),
    photoUrl:p.photo_url || p.photoUrl || '',
    lavozim:p.title||'',
    email:p.email||'',
    telefon:'',
    davlat:country,
    shahar:org.city || p.city || '',
    soha:org.industry || org.industry_tag || org.primary_industry || '',
    linkedin:'',
    website:apolloAbsoluteUrl(org.website_url || org.website || ''),
    description:org.short_description || org.organization_headline || org.headline || '',
    keywords:Array.isArray(org.keywords) ? org.keywords.join(' ') : (org.keywords || ''),
    xodimlar:Number(org.estimated_num_employees || org.num_employees || org.employee_count || 0) || 0,
    import_volume:'',
    score:Math.floor(Math.random()*20)+75,
    manba:'Apollo',
    finderMode:meta.mode,
    contacts:[],
    _contactCandidates:[],
    _contactsBootstrapped:true,
    _orgId:String(org.id || org.organization_id || '').trim(),
    _personId:String(p.id || '').trim(),
    _hasEmail:!!(p.email || p.has_email)
  };
  apolloMergeContactCandidate(item, apolloPersonToContact(p, org));
  apolloApplyCompanyContacts(item);
  return item;
}

function normalizeApolloArray(data, keys){
  data = data || {};
  for(var i=0; i<keys.length; i++){
    var val = data[keys[i]];
    if(Array.isArray(val)) return val;
    if(val && Array.isArray(val.entries)) return val.entries;
    if(val && Array.isArray(val.results)) return val.results;
  }
  if(Array.isArray(data.results)) return data.results;
  return [];
}

function apolloAbsoluteUrl(url){
  url = String(url || '').trim();
  if(!url) return '';
  if(/^https?:\/\//i.test(url)) return url;
  if(url.indexOf('.') !== -1) return 'https://' + url.replace(/^\/+/, '');
  return '';
}

function mapApolloOrganizationToFinderResult(org, country, meta){
  return {
    id:'fc_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),
    kompaniya:org.name || org.organization_name || org.account_name || '',
    rahbar:'',
    lavozim:meta.mode === 'exporters' ? 'Exportyor kompaniya' : 'Importyor kompaniya',
    email:'',
    telefon:'',
    davlat:country || org.country || org.organization_country || org.country_name || '',
    shahar:'',
    soha:org.industry || org.industry_tag || org.primary_industry || org.organization_industry || '',
    linkedin:'',
    website:apolloAbsoluteUrl(org.website_url || org.website || org.organization_website || ''),
    description:org.short_description || org.organization_headline || org.headline || org.seo_description || '',
    keywords:Array.isArray(org.keywords) ? org.keywords.join(' ') : (org.keywords || org.search_keywords || ''),
    xodimlar:Number(org.estimated_num_employees || org.num_employees || org.employee_count || 0) || 0,
    import_volume:'',
    score:Math.floor(Math.random()*10)+82,
    manba:'Apollo Org',
    finderMode:meta.mode,
    apolloOrgId:org.id || org.organization_id || org.account_id || '',
    _orgId:String(org.id || org.organization_id || org.account_id || '').trim(),
    contacts:[],
    _contactCandidates:[],
    _contactsBootstrapped:true
  };
}

function apolloNormalizeText(value){
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}

function sanitizeUiMojibake(text){
  return String(text || '')
    .replace(/вЂў|РІР‚Сћ|•/g, ' - ')
    .replace(/вЂ"|РІР‚вЂќ/g, '-')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function apolloCompanyKey(name){
  return apolloNormalizeText(name || '').replace(/\b(co|company|corp|corporation|ltd|llc|inc|group|holding|holdings|limited|plc|sa|ag|gmbh|pte|pty)\b/g,'').replace(/\s+/g,' ').trim();
}

function apolloNormalizePhone(value){
  return String(value || '').replace(/[^\d+]/g,'').trim();
}

function apolloExtractPhoneList(person){
  var out = [];
  var seen = new Set();
  function pushPhone(value){
    var raw = String(value || '').trim();
    var norm = apolloNormalizePhone(raw);
    if(!norm || seen.has(norm)) return;
    seen.add(norm);
    out.push(raw);
  }
  if(Array.isArray((person || {}).phone_numbers)){
    person.phone_numbers.forEach(function(ph){
      if(!ph) return;
      pushPhone(ph.sanitized_number || ph.number || ph.raw_number || ph.phone_number || '');
    });
  }
  [
    person && person.phone,
    person && person.mobile_phone,
    person && person.direct_phone,
    person && person.work_phone,
    person && person.sanitized_phone,
    person && person.home_phone
  ].forEach(pushPhone);
  if(person && person.organization && person.organization.primary_phone){
    pushPhone(person.organization.primary_phone.sanitized_number || person.organization.primary_phone.number || '');
  }
  return out;
}

function apolloRoleBucket(title){
  var text = apolloNormalizeText(title || '');
  if(/chief executive|ceo|founder|owner|president|managing director|general director|country manager|regional director|executive|chairman|managing partner|head of company/.test(text)) return 'executive';
  if(/sales|export|commercial|account manager|business development|market development|marketing|commercial director|trade manager|sales manager/.test(text)) return 'sales';
  if(/technical|technician|engineer|operations|production|quality|chemist|research|laboratory|plant|factory|manufacturing|procurement|purchase|purchasing|sourcing|supply chain/.test(text)) return 'technical';
  return 'other';
}

function apolloScoreContact(contact){
  var score = 0;
  if(contact.email) score += 10;
  else if(contact.hasEmailHint) score += 6;
  if(contact.telefon) score += 9;
  else if(contact.hasPhoneHint) score += 3;
  if(contact.name) score += 2;
  if(contact.photoUrl) score += 1;
  if(contact.bucket === 'executive') score += 5;
  else if(contact.bucket === 'sales') score += 4;
  else if(contact.bucket === 'technical') score += 4;
  else score += 1;
  return score;
}

function apolloPersonToContact(person, org){
  var phones = apolloExtractPhoneList(person);
  var contact = {
    personId: String((person && person.id) || '').trim(),
    name: (((person && person.first_name) || '') + ' ' + ((person && (person.last_name || person.last_name_obfuscated)) || '')).trim(),
    title: String((person && person.title) || '').trim(),
    email: String((person && person.email) || '').trim(),
    telefon: String(phones[0] || '').trim(),
    phones: phones,
    photoUrl: String((person && (person.photo_url || person.photoUrl)) || '').trim(),
    linkedin: String((person && person.linkedin_url) || '').trim(),
    bucket: apolloRoleBucket(person && person.title),
    organizationId: String((org && org.id) || '').trim(),
    hasEmailHint: !!((person && person.email) || (person && person.has_email)),
    hasPhoneHint: !!(phones[0] || (person && person.has_direct_phone) || (person && person.has_mobile_phone)),
    hasDirectPhoneHint: !!(person && person.has_direct_phone),
    hasMobilePhoneHint: !!(person && person.has_mobile_phone)
  };
  contact.score = apolloScoreContact(contact);
  return contact;
}

function apolloEnsureContactBuckets(item){
  if(!item._contactCandidates) item._contactCandidates = [];
  if(!item.contacts) item.contacts = [];
  if(item._contactsBootstrapped) return;
  item._contactsBootstrapped = true;
  var bootstrap = {
    personId: String(item._personId || '').trim(),
    name: String(item.rahbar || '').trim(),
    title: String(item.lavozim || '').trim(),
    email: String(item.email || '').trim(),
    telefon: String(item.telefon || '').trim(),
    phones: item.telefon ? [String(item.telefon).trim()] : [],
    photoUrl: String(item.photoUrl || item.photo_url || '').trim(),
    linkedin: String(item.linkedin || '').trim(),
    bucket: apolloRoleBucket(item.lavozim || ''),
    hasEmailHint: !!String(item.email || '').trim(),
    hasPhoneHint: !!String(item.telefon || '').trim(),
    hasDirectPhoneHint: false,
    hasMobilePhoneHint: false
  };
  if(bootstrap.personId || bootstrap.name || bootstrap.email || bootstrap.telefon){
    bootstrap.score = apolloScoreContact(bootstrap);
    item._contactCandidates.push(bootstrap);
  }
}

function apolloContactKey(contact){
  return [
    String((contact && contact.personId) || '').trim(),
    apolloNormalizeText((contact && contact.name) || ''),
    apolloNormalizeText((contact && contact.title) || ''),
    String((contact && contact.email) || '').trim().toLowerCase(),
    apolloNormalizePhone((contact && contact.telefon) || '')
  ].join('|');
}

function apolloMergeContactCandidate(item, candidate){
  if(!item || !candidate) return;
  apolloEnsureContactBuckets(item);
  if(!candidate.personId && !candidate.name && !candidate.email && !candidate.telefon) return;
  candidate.bucket = candidate.bucket || apolloRoleBucket(candidate.title || '');
  candidate.phones = Array.isArray(candidate.phones) ? candidate.phones.filter(Boolean) : (candidate.telefon ? [candidate.telefon] : []);
  candidate.telefon = String(candidate.telefon || candidate.phones[0] || '').trim();
  candidate.hasEmailHint = !!(candidate.hasEmailHint || candidate.email);
  candidate.hasPhoneHint = !!(candidate.hasPhoneHint || candidate.telefon || (candidate.phones && candidate.phones.length));
  candidate.hasDirectPhoneHint = !!candidate.hasDirectPhoneHint;
  candidate.hasMobilePhoneHint = !!candidate.hasMobilePhoneHint;
  candidate.score = apolloScoreContact(candidate);
  var key = apolloContactKey(candidate);
  var existing = item._contactCandidates.find(function(c){
    return apolloContactKey(c) === key || (candidate.personId && c.personId && c.personId === candidate.personId);
  });
  if(existing){
    existing.name = existing.name || candidate.name || '';
    existing.title = existing.title || candidate.title || '';
    existing.email = existing.email || candidate.email || '';
    existing.telefon = existing.telefon || candidate.telefon || '';
    existing.photoUrl = existing.photoUrl || candidate.photoUrl || '';
    existing.linkedin = existing.linkedin || candidate.linkedin || '';
    existing.bucket = existing.bucket || candidate.bucket || 'other';
    existing.phones = Array.from(new Set([].concat(existing.phones || [], candidate.phones || []).filter(Boolean)));
    existing.hasEmailHint = existing.hasEmailHint || candidate.hasEmailHint || false;
    existing.hasPhoneHint = existing.hasPhoneHint || candidate.hasPhoneHint || false;
    existing.hasDirectPhoneHint = existing.hasDirectPhoneHint || candidate.hasDirectPhoneHint || false;
    existing.hasMobilePhoneHint = existing.hasMobilePhoneHint || candidate.hasMobilePhoneHint || false;
    if(!existing.telefon && existing.phones.length) existing.telefon = existing.phones[0];
    existing.score = apolloScoreContact(existing);
    return;
  }
  item._contactCandidates.push(candidate);
}

function apolloPickBestContact(pool, preferredBuckets){
  var list = Array.isArray(pool) ? pool : [];
  var prefs = Array.isArray(preferredBuckets) ? preferredBuckets : [];
  for(var i=0; i<prefs.length; i++){
    var found = list.find(function(contact){
      return contact && contact.bucket === prefs[i];
    });
    if(found) return found;
  }
  return list[0] || null;
}

function apolloChooseCompanyContacts(candidates){
  var pool = (Array.isArray(candidates) ? candidates : []).filter(function(contact){
    return finderContactHasEmail(contact);
  }).sort(function(a,b){
    return Number(!!b.telefon) - Number(!!a.telefon) || (b.score || 0) - (a.score || 0);
  });
  if(pool.length < 2) return [];
  var primary = apolloPickBestContact(
    pool.filter(finderContactHasPhone),
    ['executive','sales','technical','other']
  );
  if(!primary) return [];
  var primaryKey = apolloContactKey(primary);
  var remaining = pool.filter(function(contact){
    return apolloContactKey(contact) !== primaryKey;
  });
  if(!remaining.length) return [];
  var secondaryPrefs = ['executive','sales','technical','other'].filter(function(bucket){
    return bucket !== primary.bucket;
  });
  secondaryPrefs.push(primary.bucket);
  var secondary = apolloPickBestContact(remaining, secondaryPrefs);
  if(!secondary) return [];
  return [primary, secondary];
}

function apolloCountEmailContacts(item){
  return (Array.isArray(item && item._contactCandidates) ? item._contactCandidates : []).filter(function(contact){
    return finderContactHasEmail(contact);
  }).length;
}

function apolloChooseEnrichmentTargets(candidates, maxCount){
  var limit = Math.max(1, Math.min(2, Number(maxCount || 2) || 2));
  var pool = (Array.isArray(candidates) ? candidates : []).filter(function(contact){
    return contact && contact.personId && (!finderContactHasEmail(contact) || !finderContactHasPhone(contact));
  }).sort(function(a,b){
    return Number(!finderContactHasPhone(b)) - Number(!finderContactHasPhone(a))
      || Number(!finderContactHasEmail(b)) - Number(!finderContactHasEmail(a))
      || Number(!!b.hasPhoneHint) - Number(!!a.hasPhoneHint)
      || Number(!!b.hasEmailHint) - Number(!!a.hasEmailHint)
      || (b.score || 0) - (a.score || 0);
  });
  var chosen = [];
  var seen = new Set();
  ['executive','sales','technical'].forEach(function(bucket){
    var match = pool.find(function(contact){
      var key = apolloContactKey(contact);
      return contact.bucket === bucket && !seen.has(key);
    });
    if(match && chosen.length < limit){
      chosen.push(match);
      seen.add(apolloContactKey(match));
    }
  });
  pool.forEach(function(contact){
    if(chosen.length >= limit) return;
    var key = apolloContactKey(contact);
    if(seen.has(key)) return;
    chosen.push(contact);
    seen.add(key);
  });
  return chosen.slice(0, limit);
}

function apolloContactRoleKey(contact){
  if(!contact) return '';
  var titleKey = apolloNormalizeText(contact.title || '');
  if(titleKey) return 'title:' + titleKey;
  var bucketKey = apolloRoleBucket(contact.title || '');
  if(bucketKey && bucketKey !== 'other') return 'bucket:' + bucketKey;
  return '';
}

function apolloHasMinimumContactCoverage(item){
  return finderHasMinimumContactSet(getFinderRenderableContacts(item));
}

function apolloApplyCompanyContacts(item){
  if(!item) return item;
  apolloEnsureContactBuckets(item);
  item.contacts = apolloChooseCompanyContacts(item._contactCandidates || []);
  var primary = item.contacts[0] || null;
  if(primary){
    item.rahbar = primary.name || item.rahbar || '';
    item.lavozim = primary.title || item.lavozim || '';
    item.email = primary.email || item.email || '';
    item.telefon = primary.telefon || item.telefon || '';
    item.photoUrl = primary.photoUrl || item.photoUrl || item.photo_url || '';
    item.photo_url = item.photoUrl;
    item.linkedin = primary.linkedin || item.linkedin || '';
    item._personId = primary.personId || item._personId || '';
  }
  return item;
}

function apolloFindCompanyItem(found, companyName, country){
  var companyKey = apolloCompanyKey(companyName);
  var countryKey = apolloNormalizeText(country);
  if(!companyKey) return null;
  return (found || []).find(function(item){
    return apolloCompanyKey(item.kompaniya) === companyKey &&
      apolloNormalizeText(item.davlat) === countryKey;
  }) || null;
}

function apolloMergeFinderItem(target, source, meta){
  if(!target || !source) return target || source;
  apolloEnsureContactBuckets(target);
  apolloEnsureContactBuckets(source);
  (source._contactCandidates || []).forEach(function(contact){
    apolloMergeContactCandidate(target, Object.assign({}, contact));
  });
  (source.contacts || []).forEach(function(contact){
    apolloMergeContactCandidate(target, Object.assign({}, contact));
  });
  if(source._personId || source.rahbar || source.email || source.telefon){
    apolloMergeContactCandidate(target, {
      personId: String(source._personId || '').trim(),
      name: String(source.rahbar || '').trim(),
      title: String(source.lavozim || '').trim(),
      email: String(source.email || '').trim(),
      telefon: String(source.telefon || '').trim(),
      phones: source.telefon ? [String(source.telefon).trim()] : [],
      photoUrl: String(source.photoUrl || source.photo_url || '').trim(),
      linkedin: String(source.linkedin || '').trim(),
      bucket: apolloRoleBucket(source.lavozim || '')
    });
  }
  ['kompaniya','davlat','shahar','soha','linkedin','website','description','keywords','daromad','tpilyil','manba'].forEach(function(key){
    target[key] = target[key] || source[key] || '';
  });
  target.finderMode = target.finderMode || source.finderMode || ((meta && meta.mode) || '');
  target._orgId = String(target._orgId || source._orgId || source.apolloOrgId || '').trim();
  target.apolloOrgId = target.apolloOrgId || source.apolloOrgId || target._orgId || '';
  target._personId = String(target._personId || source._personId || '').trim();
  target._hasEmail = target._hasEmail || source._hasEmail || false;
  target.score = Math.max(Number(target.score || 0) || 0, Number(source.score || 0) || 0);
  target.xodimlar = Number(target.xodimlar || 0) || Number(source.xodimlar || 0) || 0;
  target.photoUrl = target.photoUrl || target.photo_url || source.photoUrl || source.photo_url || '';
  target.photo_url = target.photoUrl;
  apolloApplyCompanyContacts(target);
  return target;
}

function apolloUpsertFinderItem(found, item, meta){
  if(!item || !String(item.kompaniya || '').trim()) return null;
  var existing = apolloFindCompanyItem(found, item.kompaniya, item.davlat);
  if(existing){
    return apolloMergeFinderItem(existing, item, meta);
  }
  apolloApplyCompanyContacts(item);
  found.push(item);
  return item;
}

async function apolloEnrichCompanyContacts(item, apolloKey, maxEnrich){
  if(!item) return item;
  apolloEnsureContactBuckets(item);
  if(apolloHasMinimumContactCoverage(item)) return item;
  var enrichLimit = Math.max(0, Math.min(1, Number(maxEnrich || 1) || 1));
  if(enrichLimit < 1) return apolloApplyCompanyContacts(item);
  var targets = apolloChooseEnrichmentTargets(item._contactCandidates || [], enrichLimit).filter(function(contact){
    return contact && !contact._enrichedAttempted;
  });
  if(!targets.length) return apolloApplyCompanyContacts(item);
  function getWebsiteDomain(url){
    try {
      var source = String(url || '').trim();
      if(!source) return '';
      if(!/^https?:\/\//i.test(source)) source = 'https://' + source;
      return (new URL(source)).hostname.replace(/^www\./i,'').trim();
    } catch(_e){
      return '';
    }
  }
  var contact = targets[0];
  contact._enrichedAttempted = true;
  var rawName = String(contact && contact.name || '').trim();
  var parts = rawName ? rawName.split(/\s+/) : [];
  var firstName = parts[0] || '';
  var lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
  if(!firstName && !contact.email && !contact.personId){
    return apolloApplyCompanyContacts(item);
  }
  try {
    var singleData = await apolloRequestJson({
      search_type:'people_enrichment',
      api_key:apolloKey,
      id:contact.personId ? String(contact.personId).trim() : '',
      first_name:firstName,
      last_name:lastName,
      email:contact && contact.email ? String(contact.email || '').trim() : '',
      organization_name:item && item.kompaniya ? String(item.kompaniya || '').trim() : '',
      organization_domain:getWebsiteDomain(item && item.website)
    });
    var person = singleData && singleData.person ? singleData.person : null;
    if(person){
      var merged = apolloPersonToContact(person, person.organization || {});
      apolloMergeContactCandidate(item, merged);
    }
  } catch(_enrichErr){}
  apolloApplyCompanyContacts(item);
  return item;
}

function getApolloProductSignals(prod){
  var text = [
    prod && prod.name_en,
    prod && prod.name_uz,
    prod && prod.raw_name,
    prod && prod.description,
    prod && prod.usage,
    prod && prod.main_sector
  ].filter(Boolean).join(' ');
  var normalized = apolloNormalizeText(text);
  var tokens = Array.from(new Set(normalized.split(' ').filter(function(t){
    return t && t.length >= 4 && ['other','with','used','than','that','into','from','basis','including','retail','water','products','product'].indexOf(t) === -1;
  })));

  function pushAll(arr){
    arr.forEach(function(v){
      if(tokens.indexOf(v) === -1) tokens.push(v);
    });
  }

  if(/phosph|superphosphate|fertili/.test(normalized)) pushAll(['phosphate','phosphor','fertilizer','fertiliser','agrochemical','agriculture','crop','nutrition','chemical']);
  if(/cement|clinker|concrete/.test(normalized)) pushAll(['cement','clinker','construction','building','concrete']);
  if(/gypsum|plaster/.test(normalized)) pushAll(['gypsum','plaster','drywall','board','construction']);
  if(/granite|marble|basalt|limestone|dolomite|stone|slab|tile/.test(normalized)) pushAll(['stone','quarry','mining','ceramic','tile','marble','granite','limestone','basalt','construction']);
  if(/kaolin|clay|bentonite|silica|quartz|feldspar/.test(normalized)) pushAll(['mineral','ceramic','glass','silica','quartz','kaolin','clay','bentonite']);
  if(/sulfur|sulphur|acid/.test(normalized)) pushAll(['sulfur','sulphur','chemical','acid']);

  return { tokens: tokens };
}

function getApolloStrictCategorySignals(prod){
  var normalized = apolloNormalizeText([
    prod && prod.name_en,
    prod && prod.name_uz,
    prod && prod.raw_name,
    prod && prod.description,
    prod && prod.usage,
    prod && prod.main_sector
  ].filter(Boolean).join(' '));
  if(/tile|ceramic|porcelain|sanitary/.test(normalized)) return ['tile','tiles','ceramic','porcelain','roof tile','wall tile','floor tile','sanitary ware'];
  if(/granite|marble|basalt|limestone|dolomite|stone|slab|flagstone|curbstone|cut\/sawn|sawn/.test(normalized)) return ['stone','granite','marble','basalt','limestone','dolomite','quarry','slab','sawn','cut stone','processed stone'];
  if(/cement|clinker|concrete|lime|quicklime|slaked lime/.test(normalized)) return ['cement','clinker','concrete','lime','quicklime','hydrated lime'];
  if(/gypsum|plaster|board|drywall/.test(normalized)) return ['gypsum','plaster','drywall','board','plasterboard'];
  if(/phosph|superphosphate|fertili/.test(normalized)) return ['phosphate','superphosphate','fertilizer','fertiliser','agrochemical','crop nutrition','chemical'];
  if(/kaolin|clay|bentonite|silica|quartz|feldspar/.test(normalized)) return ['kaolin','clay','bentonite','silica','quartz','feldspar','industrial minerals','ceramic','glass','mining'];
  if(/sulfur|sulphur|acid/.test(normalized)) return ['sulfur','sulphur','acid','chemical'];
  return [];
}

function getApolloCoreCommoditySignals(prod){
  var normalized = apolloNormalizeText([
    prod && prod.name_en,
    prod && prod.name_uz,
    prod && prod.raw_name,
    prod && prod.description
  ].filter(Boolean).join(' '));
  if(/granite|marble|basalt|limestone|dolomite|stone|slab|flagstone|curbstone|cut\/sawn|sawn/.test(normalized)){
    return ['stone','granite','marble','basalt','limestone','dolomite','quarry','slab','sawn'];
  }
  if(/tile|ceramic|porcelain|roof tile|wall tile|floor tile|sanitary/.test(normalized)){
    return ['tile','ceramic','porcelain','roof tile','wall tile','floor tile'];
  }
  if(/cement|clinker|concrete|lime|quicklime|slaked lime/.test(normalized)){
    return ['cement','clinker','concrete','lime','quicklime','hydrated lime'];
  }
  if(/gypsum|plaster|board|drywall/.test(normalized)){
    return ['gypsum','plaster','drywall','board'];
  }
  if(/phosph|superphosphate|fertili/.test(normalized)){
    return ['phosphate','superphosphate','fertilizer','fertiliser'];
  }
  return [];
}

function isApolloObviousMismatch(entity, prod){
  var productText = apolloNormalizeText([
    prod && prod.name_en,
    prod && prod.name_uz,
    prod && prod.raw_name
  ].filter(Boolean).join(' '));
  var entityText = apolloNormalizeText([
    entity.kompaniya,
    entity.soha,
    entity.description,
    entity.keywords,
    entity.lavozim
  ].filter(Boolean).join(' '));
  if(!productText || !entityText) return false;
  if(/linkedin|daily|news|media|review|journal|magazine|newspaper|times|press|broadcast|television|tv|radio|university|college|school|academy|research institute|government|ministry|embassy|consulate|association|foundation|ngo|nonprofit|blog|portal/.test(entityText)){
    return true;
  }
  if(/phosph|superphosphate|fertili|cement|clinker|gypsum|stone|granite|marble|basalt|limestone|dolomite|kaolin|clay|bentonite|silica|quartz|lime|sulfur|acid/.test(productText)){
    if(/huawei|alibaba|xiaomi|tencent|baidu|jd com|bytedance|telecom|telecommunications|consumer electronics|smartphone|mobile devices|internet|e commerce|cloud computing|software|semiconductors/.test(entityText)){
      return true;
    }
  }
  return false;
}

function isApolloEntityRelevant(entity, prod){
  if(isApolloObviousMismatch(entity, prod)) return false;
  var signals = getApolloProductSignals(prod);
  var strictSignals = getApolloStrictCategorySignals(prod);
  var coreSignals = getApolloCoreCommoditySignals(prod);
  if(!signals.tokens.length) return true;
  var text = apolloNormalizeText([
    entity.kompaniya,
    entity.soha,
    entity.rahbar,
    entity.lavozim,
    entity.email,
    entity.products_imported,
    entity.description,
    entity.keywords,
    entity.summary
  ].filter(Boolean).join(' '));
  if(!text) return false;
  var hits = signals.tokens.filter(function(token){ return text.indexOf(token) !== -1; });
  var strictHits = strictSignals.filter(function(token){ return text.indexOf(apolloNormalizeText(token)) !== -1; });
  var coreHits = coreSignals.filter(function(token){ return text.indexOf(apolloNormalizeText(token)) !== -1; });
  var buildingHint = /(construction|building materials|stone|quarry|mining|ceramic|tile|marble|granite|limestone|dolomite|mineral)/.test(text);
  if(strictSignals.length){
    if(coreSignals.length){
      if(coreHits.length > 0 || strictHits.length >= 2) return true;
      if(isApolloBuildingMaterialsProduct(prod)) return buildingHint;
      return false;
    }
    if(strictHits.length > 0) return true;
    if(isApolloBuildingMaterialsProduct(prod)) return buildingHint;
    return false;
  }
  return hits.length > 0;
}

function mergeApolloPeopleIntoCompanies(found, peopleResults, country, meta, prod){
  peopleResults.forEach(function(item){
    if(!isApolloEntityRelevant(item, prod)) return;
    var personKey = apolloCompanyKey(item.kompaniya);
    var existing = found.find(function(row){
      return apolloCompanyKey(row.kompaniya) === personKey && apolloNormalizeText(row.davlat) === apolloNormalizeText(country);
    });
    if(existing){
      existing.email = existing.email || item.email || '';
      existing.rahbar = existing.rahbar || item.rahbar || '';
      existing.photoUrl = existing.photoUrl || item.photoUrl || item.photo_url || '';
      existing.lavozim = existing.lavozim || item.lavozim || (meta.mode === 'exporters' ? 'Eksport bo\'yicha kontakt' : 'Import bo\'yicha kontakt');
      existing.soha = existing.soha || item.soha || '';
    } else if(item.email || item.kompaniya){
      found.push({
        id:item.id,
        kompaniya:item.kompaniya,
        rahbar:item.rahbar || '',
        photoUrl:item.photoUrl || item.photo_url || '',
        lavozim:item.lavozim || (meta.mode === 'exporters' ? 'Eksport bo\'yicha kontakt' : 'Import bo\'yicha kontakt'),
        email:item.email || '',
        telefon:'',
        davlat:country,
        shahar:'',
        soha:item.soha || '',
        linkedin:'',
        website:'',
        import_volume:'',
        score:item.score || 76,
        manba:'Apollo',
        finderMode:meta.mode
      });
    }
  });
  return found;
}

function finderMatchesExpansionSignal(item){
  var text = apolloNormalizeText([
    item.kompaniya,
    item.rahbar,
    item.lavozim,
    item.soha,
    item.description,
    item.keywords
  ].filter(Boolean).join(' '));
  return /export|international|global|business development|sales manager|commercial|regional|growth|expansion|new market|market development|export manager|trade/.test(text);
}

function finderMatchesTop100Signal(item){
  var employees = Number(item.xodimlar || 0) || 0;
  if(employees >= 100) return true;
  var text = apolloNormalizeText([
    item.kompaniya,
    item.soha,
    item.description,
    item.keywords
  ].filter(Boolean).join(' '));
  return /group|holdings|international|global|leading|top|largest|major manufacturer|major supplier/.test(text);
}

function finderMatchesTarget13Signal(item, meta){
  var text = apolloNormalizeText([
    item.lavozim,
    item.description,
    item.keywords,
    item.soha,
    item.why
  ].filter(Boolean).join(' '));
  if(meta && meta.mode === 'exporters'){
    return /export|supplier|manufacturer|international|trade|global/.test(text);
  }
  return true;
}

function finalizeApolloFinderResults(found, prod, perCountry, strategy, meta){
  var strictSignals = getApolloStrictCategorySignals(prod);
  var filtered = (found || []).filter(function(item){
    if(!String(item && item.kompaniya || '').trim()) return false;
    if(isApolloObviousMismatch(item, prod)) return false;
    return isApolloEntityRelevant(item, prod);
  });
  // Qat'iy signal bo'lmagan mahsulotlarda yumshoq fallback ruxsat.
  if(!filtered.length && !strictSignals.length){
    filtered = (found || []).filter(function(item){
      return !isApolloObviousMismatch(item, prod) && String(item && item.kompaniya || '').trim();
    });
  }
  // Qat'iy mahsulotlarda irrelevant kompaniya qaytarmaymiz.
  if(!filtered.length){
    return [];
  }
  strategy = strategy || {top100:false, expansion:false, target13:false};
  if(strategy.top100){
    filtered = filtered.filter(function(item){ return finderMatchesTop100Signal(item); });
  }
  if(strategy.expansion){
    filtered = filtered.filter(function(item){ return finderMatchesExpansionSignal(item); });
  }
  if(strategy.target13){
    filtered = filtered.filter(function(item){ return finderMatchesTarget13Signal(item, meta); });
  }
  var seen = new Set();
  var unique = filtered.filter(function(item){
    var key = [apolloCompanyKey(item.kompaniya), apolloNormalizeText(item.davlat)].join('|');
    if(!apolloCompanyKey(item.kompaniya)) return false;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort(function(a,b){
    return getFinderRenderableContacts(b).length - getFinderRenderableContacts(a).length || (Number(b.score || 0) - Number(a.score || 0));
  });
  var strong = unique.filter(function(item){ return apolloHasMinimumContactCoverage(item); });
  return (strong.length ? strong : unique).slice(0, Math.min(2, perCountry || 2));
}

function finderCountryMatchesRecord(record, country){
  var targetCandidates = [country, getFinderCountryLabel(country)].map(function(v){ return apolloNormalizeText(v); }).filter(Boolean);
  if(!targetCandidates.length) return false;
  var recText = apolloNormalizeText([
    record && record.davlat,
    record && record.shahar,
    record && record.kompaniyaManzili,
    record && record.manzil,
    record && record.address
  ].filter(Boolean).join(' '));
  if(!recText) return false;
  return targetCandidates.some(function(t){ return recText.indexOf(t) !== -1; });
}

function getApolloFallbackSignalTokens(prod){
  var tokens = []
    .concat(getApolloCoreCommoditySignals(prod) || [])
    .concat(getApolloStrictCategorySignals(prod) || [])
    .concat(getApolloPreferredKeywords(prod) || [])
    .map(apolloStripHsNoise)
    .map(apolloNormalizeText)
    .filter(function(t){ return t && t.length >= 3 && !/^\d+$/.test(t); });
  return Array.from(new Set(tokens)).slice(0, 16);
}

function buildApolloLocalFallbackResults(prod, country, perCountry, meta, strategy){
  var rows = DB.investorCompanies || [];
  if(!rows.length) return [];
  var signalTokens = getApolloFallbackSignalTokens(prod);
  var grouped = new Map();
  rows.forEach(function(rec){
    var company = String(rec && rec.kompaniya || '').trim();
    if(!company) return;
    if(!finderCountryMatchesRecord(rec, country)) return;
    var text = apolloNormalizeText([
      company,
      rec && rec.soha,
      rec && rec.mahsulotNomi,
      rec && rec.description
    ].filter(Boolean).join(' '));
    if(signalTokens.length && !signalTokens.some(function(t){ return text.indexOf(t) !== -1; })) return;
    var key = [apolloCompanyKey(company), apolloNormalizeText(country)].join('|');
    var item = grouped.get(key);
    if(!item){
      item = {
        id:'fc_local_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),
        kompaniya:company,
        rahbar:'',
        lavozim:meta && meta.mode === 'exporters' ? 'Eksport bo\'yicha kontakt' : 'Import bo\'yicha kontakt',
        email:'',
        telefon:'',
        davlat:country,
        shahar:rec.shahar || '',
        soha:rec.soha || rec.mahsulotNomi || '',
        website:apolloAbsoluteUrl(rec.website || ''),
        description:rec.description || '',
        xodimlar:Number(rec.xodimlar || 0) || 0,
        score:Number(rec.score || 72) || 72,
        manba:'Local fallback',
        finderMode:(meta && meta.mode) || _finderMode || 'importers',
        contacts:[]
      };
      grouped.set(key, item);
    }
    var contact = {
      name:String(rec.rahbar || '').trim(),
      title:String(rec.lavozim || '').trim(),
      email:String(rec.email || '').trim(),
      telefon:String(rec.telefon || rec.tel || '').trim(),
      photoUrl:String(rec.photoUrl || rec.photo_url || '').trim(),
      linkedin:String(rec.linkedin || '').trim()
    };
    if(!contact.email) return;
    var exists = item.contacts.some(function(c){
      if(contact.email && c.email) return apolloNormalizeText(c.email) === apolloNormalizeText(contact.email);
      if(contact.name && c.name) return apolloNormalizeText(c.name) === apolloNormalizeText(contact.name);
      return false;
    });
    if(!exists) item.contacts.push(contact);
    if(!item.rahbar && contact.name) item.rahbar = contact.name;
    if(!item.email && contact.email) item.email = contact.email;
    if(!item.telefon && contact.telefon) item.telefon = contact.telefon;
  });

  var out = Array.from(grouped.values()).map(function(item){
    apolloApplyCompanyContacts(item);
    return item;
  });
  out = out.filter(function(item){
    return String(item && item.kompaniya || '').trim() && !isApolloObviousMismatch(item, prod) && finderResultIsRenderable(item);
  });
  strategy = strategy || {top100:false, expansion:false, target13:false};
  if(strategy.top100){
    out = out.filter(function(item){ return finderMatchesTop100Signal(item); });
  }
  if(strategy.expansion){
    out = out.filter(function(item){ return finderMatchesExpansionSignal(item); });
  }
  if(strategy.target13){
    out = out.filter(function(item){ return finderMatchesTarget13Signal(item, meta); });
  }
  out = out.sort(function(a,b){
    return getFinderVisibleContacts(b).length - getFinderVisibleContacts(a).length || (Number(b.score || 0) - Number(a.score || 0));
  });
  return out.slice(0, Math.min(2, perCountry || 2));
}

function apolloNeedContactCoverage(found, perCountry){
  var top = (found || []).slice(0, perCountry);
  if(!top.length) return true;
  var withContact = top.filter(function(item){
    return getFinderRenderableContacts(item).length >= 2;
  }).length;
  return withContact < Math.min(top.length, Math.max(1, Math.ceil(perCountry * 0.7)));
}
async function apolloRequestJson(payload){
  var body = Object.assign({}, payload);
  if(body.search_type === 'people'){ body.action = 'people_search'; delete body.search_type; }
  else if(body.search_type === 'organizations'){ body.action = 'organization_search'; delete body.search_type; }
  else if(body.search_type === 'people_enrichment'){ body.action = 'people_enrichment'; delete body.search_type; }
  else if(body.search_type === 'bulk_people_enrichment'){ body.action = 'bulk_people_enrichment'; delete body.search_type; }
  else if(body.search_type === 'org_enrichment'){ body.action = 'org_enrichment'; delete body.search_type; }
  // q_organization_keyword_tags — har bir keyword ALOHIDA element bo'lishi kerak
  if(body.q_organization_keyword_tags && Array.isArray(body.q_organization_keyword_tags)){
    var normalized = [];
    body.q_organization_keyword_tags.forEach(function(tag){
      var v = String(tag || '').trim();
      if(!v) return;
      if(normalized.indexOf(v) === -1) normalized.push(v);
      // Apollo ba'zan phrase bo'yicha aniq topmaydi, shuning uchun so'zlarga ham bo'lamiz.
      v.split(/[\s,]+/).forEach(function(w){
        w = String(w || '').trim();
        if(w && normalized.indexOf(w) === -1) normalized.push(w);
      });
    });
    body.q_organization_keyword_tags = normalized;
  }
  if(body.action === 'people_enrichment' && body.organization_domain){
    body.domain = body.organization_domain; delete body.organization_domain;
  }
  var resp = await fetch(APOLLO_PROXY,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  var json = null;
  try { json = await resp.json(); } catch(_e){}
  if(!resp.ok && resp.status !== 200){
    var errText = (json && (json.error || json.message)) || ('Apollo xato: ' + resp.status);
    throw new Error(errText);
  }
  if(json && json._action) delete json._action;
  if(json && json._status) delete json._status;
  return json || {};
}

function getProductIndustryTags(prod){
  var hsCode = String((prod && prod.hs_code) || '').replace(/\D/g,'');
  var ch = hsCode.slice(0,2);
  // Apollo industry_tag_ids — real Apollo internal IDs
  // Source: Apollo /account_stages and /labels API
  var TAG_MAP = {
    '25': ['5567cd4673696439b10b0200','5567cd4773696439b10b0200'], // building materials, construction
    '28': ['5567cd4773696439b10b0000','5567cd4773696439b10b0001'], // chemicals, industrial chemicals
    '29': ['5567cd4773696439b10b0000'], // chemicals
    '30': ['5567cd4673696439b10b0000','5567ce1a7369644d39040000'], // pharmaceuticals, biotechnology
    '31': ['5567cd4773696439b10b0000','55718d5b69702d0ae06b0000'], // chemicals, agriculture
    '52': ['5567cd4673696439b10b0100','5567cd4673696439b10b0101'], // textiles, apparel & fashion
    '55': ['5567cd4673696439b10b0100','5567cd4673696439b10b0101'],
    '68': ['5567cd4673696439b10b0200','5567cd4773696439b10b0200'], // construction, building materials
    '69': ['5567cd4673696439b10b0200','5567cd4773696439b10b0200'],
    '72': ['5567cd4773696439b10b0300','5567cd4773696439b10b0301'], // mining & metals, industrial
    '73': ['5567cd4773696439b10b0300'],
    '84': ['5567cd4773696439b10b0400','5567cd4773696439b10b0401'], // industrial machinery, manufacturing
    '85': ['5567cd4773696439b10b0400','5567cd4673696439b10b0500'], // machinery, electrical
    '87': ['5567cd4673696439b10b0600'], // automotive
    '10': ['55718d5b69702d0ae06b0000','5567cd4773696439b10b0700'], // agriculture, food production
    '11': ['5567cd4773696439b10b0700','55718d5b69702d0ae06b0000'],
    '15': ['5567cd4773696439b10b0700'],
  };
  var tags = TAG_MAP[ch] || [];
  if(!tags.length && isApolloBuildingMaterialsProduct(prod)){
    tags = ['5567cd4673696439b10b0200','5567cd4773696439b10b0200'];
  }
  return tags;
}

// Apollo keyword_tags map per HS chapter
function getProductKeywordTags(prod){
  var hsCode = String((prod && prod.hs_code) || '').replace(/\D/g,'');
  var ch = hsCode.slice(0,2);

  var KEYWORD_MAP = {
    '25': ['building materials','construction materials','stone','granite','marble','kaolin'],
    '28': ['chemical','industrial chemical','specialty chemical','chemical manufacturer'],
    '29': ['chemical','organic chemical','fine chemical','specialty chemical'],
    '30': ['pharmaceutical','medicine','drug','medicament','pharma','healthcare','biotechnology'],
    '31': ['fertilizer','agrochemical','crop nutrition','plant nutrition'],
    '52': ['cotton','textile','fabric','yarn','cotton fiber'],
    '55': ['textile','synthetic fiber','fabric','yarn','apparel'],
    '68': ['stone','granite','marble','limestone','dolomite','quarry','slab','sawn'],
    '69': ['ceramic','tile','tiles','porcelain','roof tile','wall tile','floor tile'],
    '70': ['glass','float glass','building materials'],
    '72': ['steel','iron','metal','structural steel'],
    '73': ['metal products','steel fabrication','construction steel'],
    '84': ['machinery','industrial equipment','manufacturing equipment'],
    '85': ['electrical','electronics','electrical equipment'],
    '87': ['automotive','vehicle','auto parts','transport'],
    '10': ['grain','wheat','agriculture','cereal','food'],
    '15': ['vegetable oil','edible oil','food processing'],
    '39': ['plastic','polymer','PVC','packaging'],
    '40': ['rubber','industrial rubber','rubber products'],
    '71': ['gold','silver','jewelry','precious metals','gems'],
  };

  var tags = KEYWORD_MAP[ch] ? KEYWORD_MAP[ch].slice() : [];
  var NOISE = {
    other:1, with:1, from:1, into:1, over:1, under:1, mixed:1, crude:1,
    rough:1, roughly:1, trimmed:1, product:1, products:1, material:1, materials:1,
    processed:1, worked:1, thereof:1
  };
  // Add product name words (strictly sanitized, skip noisy tokens)
  if(prod && prod.name_en){
    prod.name_en.toLowerCase().split(/[\s,\/\-\(\),]+/).forEach(function(w){
      w = String(w || '').trim();
      if(!w || w.length < 4 || w.length > 24) return;
      if(NOISE[w]) return;
      if(!/^[a-z0-9]+$/.test(w)) return;
      if(tags.indexOf(w) === -1) tags.push(w);
    });
  }
  if(isApolloBuildingMaterialsProduct(prod)){
    ['building materials','construction materials'].forEach(function(token){
      if(tags.indexOf(token) === -1) tags.push(token);
    });
  }
  return tags.slice(0, 6);
}

function getProductSpecificTitles(prod, mode){
  var hsCode = String((prod && prod.hs_code) || '').replace(/\D/g,'');
  var ch = hsCode.slice(0,2);
  var prodName = ((prod && prod.name_en) || '').toLowerCase();
  var modePrefix = mode === 'exporters' ? ['Export Manager','Sales Export Manager'] : ['Import Manager','Procurement Manager','Purchasing Manager'];

  // HS chapter based titles
  var TITLE_MAP = {
    '30':['Pharmaceutical Sales Manager','Medical Sales Representative','Pharma Export Manager','Drug Registration Manager','Regulatory Affairs Manager','Healthcare Business Development','Pharma Product Manager','Clinical Sales Manager'],
    '28':['Chemical Sales Manager','Industrial Chemical Export Manager','Chemical Business Development','Specialty Chemical Manager','Chemical Product Manager'],
    '29':['Chemical Sales Manager','Organic Chemistry Manager','Chemical Export Manager','Specialty Chemical Business Development'],
    '31':['Agrochemical Sales Manager','Fertilizer Export Manager','Agricultural Sales Manager','Crop Nutrition Manager'],
    '69':['Ceramic Sales Manager','Tile Export Manager','Building Materials Sales','Construction Materials Manager','Ceramic Product Manager'],
    '68':['Building Materials Sales Manager','Stone Export Manager','Construction Materials Export','Marble Sales Manager'],
    '72':['Steel Sales Manager','Metal Export Manager','Steel Trading Manager','Iron Steel Business Development'],
    '73':['Metal Products Sales Manager','Steel Fabrication Manager','Construction Steel Manager'],
    '52':['Cotton Export Manager','Textile Sales Manager','Cotton Trading Manager','Fiber Export Manager'],
    '55':['Textile Export Manager','Fabric Sales Manager','Yarn Export Manager','Synthetic Fiber Manager'],
    '84':['Machinery Sales Manager','Equipment Export Manager','Industrial Equipment Sales','Manufacturing Equipment Manager'],
    '85':['Electrical Equipment Sales','Electronics Export Manager','Industrial Electronics Manager'],
    '87':['Automotive Sales Manager','Vehicle Export Manager','Auto Parts Manager'],
    '10':['Grain Export Manager','Commodity Trading Manager','Agricultural Export Manager','Wheat Trading Manager'],
    '15':['Vegetable Oil Export Manager','Food Industry Sales Manager','Edible Oil Manager'],
  };

  var titles = modePrefix.slice();
  if(TITLE_MAP[ch]){
    titles = titles.concat(TITLE_MAP[ch]);
  }
  // Always add general sales titles as fallback
  titles = titles.concat(['Sales Manager','Business Development Manager','Commercial Director','Managing Director','CEO','Founder','Export Director','International Sales Manager']);
  // Dedupe
  var seen = {};
  return titles.filter(function(t){ if(seen[t]) return false; seen[t]=true; return true; });
}

function isOrgRelevantToProduct(org, keywords, prod){
  var orgText = [
    org.name || '',
    org.industry || '',
    org.industry_tag || '',
    org.short_description || '',
    org.organization_headline || '',
    Array.isArray(org.keywords) ? org.keywords.join(' ') : (org.keywords || '')
  ].join(' ').toLowerCase();

  var orgIndustry = (org.industry || '').toLowerCase();

  // Determine product category from HS code and name
  var hsCode = String((prod && prod.hs_code) || '').replace(/\D/g,'');
  var hsChapter = hsCode.slice(0,2);
  var prodName = ((prod && prod.name_en) || '').toLowerCase();
  var strictSignals = getApolloStrictCategorySignals(prod).map(function(token){
    return apolloNormalizeText(token);
  }).filter(Boolean);
  // HS 25/26/68/69: mahsulot mosligi qat'iy bo'lsin (stone/tile/mineral yo'nalishlar)
  if(['25','26','68','69'].indexOf(hsChapter) !== -1 && strictSignals.length){
    var strictSignalHit = strictSignals.some(function(token){ return orgText.indexOf(token) !== -1; });
    var buildingHint = /construction|building materials|stone|quarry|mining|ceramic|tile|marble|granite|mineral/.test((orgIndustry || '') + ' ' + orgText);
    if(!strictSignalHit && !buildingHint) return false;
  }

  // ── Map HS chapters to allowed/blocked industries ──
  var CHAPTER_MAP = {
    // Chemicals, pharma, medicaments
    '28':{ allow:['chemical','pharmaceutical','biotechnology','laboratory','medical','drug','health care'], block:['automotive','machinery','food','construction','textile','mining','real estate','retail'] },
    '29':{ allow:['chemical','pharmaceutical','specialty chemical','organic chemical','laboratory'], block:['automotive','food','construction','textile','mining'] },
    '30':{ allow:['pharmaceutical','medical','biotechnology','health care','drug','medicine','clinical'], block:['automotive','machinery','food','construction','textile','mining','real estate'] },
    '31':{ allow:['fertilizer','agrochemical','chemical','agriculture','farming'], block:['automotive','machinery','construction','textile','mining'] },
    // Building materials
    '25':{ allow:['mining','minerals','construction','building materials','quarry','stone'], block:['automotive','pharmaceutical','food','textile'] },
    '26':{ allow:['mining','metals','minerals','ore','steel'], block:['automotive','pharmaceutical','food','textile'] },
    '68':{ allow:['construction','building materials','stone','ceramics','glass','ceramics'], block:['automotive','pharmaceutical','food','textile'] },
    '69':{ allow:['ceramics','building materials','construction','tiles','porcelain'], block:['automotive','pharmaceutical','food','textile'] },
    '70':{ allow:['glass','construction','building materials'], block:['automotive','pharmaceutical','food','textile'] },
    // Metals
    '72':{ allow:['steel','metal','iron','manufacturing','industrial'], block:['pharmaceutical','food','textile'] },
    '73':{ allow:['metal','steel','manufacturing','construction','industrial'], block:['pharmaceutical','food','textile'] },
    '74':{ allow:['copper','metal','manufacturing','electrical'], block:['pharmaceutical','food','textile'] },
    '76':{ allow:['aluminum','metal','manufacturing'], block:['pharmaceutical','food','textile'] },
    // Textiles
    '50':{ allow:['textile','fabric','apparel','garment','fashion'], block:['automotive','pharmaceutical','mining','construction'] },
    '51':{ allow:['textile','fabric','apparel','garment'], block:['automotive','pharmaceutical','mining','construction'] },
    '52':{ allow:['cotton','textile','fabric','apparel','garment'], block:['automotive','pharmaceutical','mining','construction'] },
    '55':{ allow:['textile','fabric','apparel','fiber','yarn'], block:['automotive','pharmaceutical','mining','construction'] },
    // Food
    '10':{ allow:['food','grain','agriculture','farming','milling'], block:['automotive','pharmaceutical','mining','textile','construction'] },
    '11':{ allow:['food','flour','milling','agriculture','grain'], block:['automotive','pharmaceutical','mining','textile','construction'] },
    '15':{ allow:['food','oil','fats','agriculture'], block:['automotive','pharmaceutical','mining','textile','construction'] },
    // Machinery
    '84':{ allow:['machinery','manufacturing','industrial','engineering','equipment'], block:['pharmaceutical','food & beverages','textile','mining'] },
    '85':{ allow:['electrical','electronics','manufacturing','industrial','equipment'], block:['pharmaceutical','food & beverages','mining'] },
    // Automotive/transport
    '87':{ allow:['automotive','vehicle','transport','manufacturing','machinery'], block:['pharmaceutical','food','textile','mining'] },
    // Energy/solar
    '85s':{ allow:['solar','energy','renewable','electrical','electronics'], block:[] },
    // Plastics/rubber
    '39':{ allow:['plastic','polymer','chemical','manufacturing','packaging'], block:['automotive','pharmaceutical','food','mining'] },
    '40':{ allow:['rubber','chemical','manufacturing','industrial'], block:['pharmaceutical','food','mining'] },
    // Paper
    '48':{ allow:['paper','packaging','printing','publishing','cardboard'], block:['automotive','pharmaceutical','mining'] },
    // Mining/precious
    '26':{ allow:['mining','metals','minerals'], block:['pharmaceutical','food','textile'] },
    '71':{ allow:['jewelry','precious metals','mining','gold','gems'], block:['automotive','pharmaceutical','food','textile'] },
  };

  var map = CHAPTER_MAP[hsChapter];

  // ── Hard reject by HS chapter ──
  // If we know the HS chapter, block industries that can NEVER match
  var CHAPTER_HARD_BLOCK = {
    '30': ['automotive','machinery','food & beverages','retail','apparel','fashion','textile','construction','mining','real estate','oil & energy','utilities','transportation','logistics'],
    '28': ['automotive','food & beverages','retail','apparel','fashion','textile','real estate','oil & energy','utilities'],
    '29': ['automotive','food & beverages','retail','apparel','fashion','textile','real estate'],
    '31': ['automotive','machinery','retail','apparel','fashion','textile','real estate','oil & energy'],
    '69': ['automotive','pharmaceutical','food & beverages','retail','apparel','fashion','textile','oil & energy','financial'],
    '68': ['automotive','pharmaceutical','food & beverages','retail','apparel','fashion','textile','oil & energy'],
    '72': ['pharmaceutical','food & beverages','retail','apparel','fashion'],
    '52': ['automotive','pharmaceutical','machinery','mining','construction','oil & energy','financial'],
    '55': ['automotive','pharmaceutical','machinery','mining','construction','oil & energy'],
    '84': ['pharmaceutical','food & beverages','retail','apparel','fashion','textile'],
    '10': ['automotive','pharmaceutical','machinery','textile','construction','oil & energy'],
  };
  var hardBlock = CHAPTER_HARD_BLOCK[hsChapter] || [];
  if(hardBlock.length && orgIndustry){
    var isHardBlocked = hardBlock.some(function(b){ return orgIndustry.indexOf(b) !== -1; });
    if(isHardBlocked) return false;
  }

  // Always block clearly irrelevant industries regardless of product
  var ALWAYS_BLOCK = ['information technology & services','software','internet','accounting','insurance','legal services','staffing & recruiting','human resources','marketing & advertising','public relations & communications','newspapers','broadcast media','online media','gambling & casinos','sports','entertainment','religious institutions','government administration','political organization','think tanks','non-profit organization management'];
  var isAlwaysBlock = ALWAYS_BLOCK.some(function(b){ return orgIndustry.indexOf(b) !== -1; });
  if(isAlwaysBlock) return false;

  if(map){
    // Check if industry matches allowed list — if so, definitely relevant
    var isAllowed = map.allow.some(function(a){ return orgIndustry.indexOf(a) !== -1; });
    if(isAllowed) return true;

    // Check if industry is in block list for this product category
    var isBlocked = map.block.some(function(b){ return orgIndustry.indexOf(b) !== -1; });
    if(isBlocked){
      // Last chance: check if product keyword appears in org name/description
      var kwMatch = (keywords || []).some(function(kw){
        return kw && orgText.indexOf(kw.toLowerCase()) !== -1;
      });
      return kwMatch;
    }
  }

  // No HS map or no industry — check keyword match
  var allKws = (keywords || []).filter(function(k){ return k && k.length > 3; });
  if(allKws.length){
    var matched = allKws.some(function(kw){ return orgText.indexOf(kw.toLowerCase()) !== -1; });
    if(matched) return true;
    var strictMatched = strictSignals.some(function(token){ return orgText.indexOf(token) !== -1; });
    if(strictMatched) return true;
    // If we have good keywords but no match — reject (including unknown industry)
    return false;
  }

  if(strictSignals.length){
    return strictSignals.some(function(token){ return orgText.indexOf(token) !== -1; });
  }
  // If no reliable product signals exist, keep only orgs that at least have industry metadata.
  return !!orgIndustry;
}

function guessEmailFromDomain(fullName, website){
  // Extract domain from website
  var domain = '';
  try {
    var url = website.replace(/^https?:\/\//,'').split('/')[0];
    domain = url.replace(/^www\./, '');
  } catch(e){ return ''; }
  if(!domain || domain.length < 4) return '';
  // Build email formats: first.last@domain or first@domain
  var parts = fullName.trim().split(/\s+/);
  if(parts.length < 1) return '';
  var first = (parts[0]||'').toLowerCase().replace(/[^a-z]/g,'');
  var last = (parts[parts.length-1]||'').toLowerCase().replace(/[^a-z]/g,'');
  if(!first) return '';
  // Most common format: first.last@domain
  if(last && last !== first) return first + '.' + last + '@' + domain;
  return first + '@' + domain;
}

async function apolloFinderSearchCountry(prod, country, perCountry, meta, sourceScope, targetCountries, strategy){
  var apolloKey = getApolloApiKey();
  if(!apolloKey) throw new Error('Apollo API key topilmadi. Sozlamalar sahifasiga kiriting.');
  var preferredKeywords = getApolloPreferredKeywords(prod);
  var coreSignals = getApolloCoreCommoditySignals(prod);
  var kw1 = apolloStripHsNoise(coreSignals[0] || preferredKeywords[0] || ((prod && prod.name_en) || ''));
  var kw2 = apolloStripHsNoise(coreSignals[1] || preferredKeywords[1] || kw1);
  var productKeywordTags = getProductKeywordTags(prod);
  var industryKeywordBoost = getApolloIndustryKeywordBoost(prod);
  var productIndustryTags = getProductIndustryTags(prod);
  var found = [];
  var lastError = null;
  var hadSuccess = false;
  var enablePeopleDiscovery = true;
  var enableBroadOrgFallback = true;
  var enableFallbackPeople = true;
  var candidateCompanyLimit = Math.max(1, Math.min(2, Number(perCountry || 2) || 2));
  var discoveryPerPage = Math.max(4, Math.min(8, candidateCompanyLimit * 4));
  var peoplePerPage = 2;
  function dedupeStrings(list){
    return Array.from(new Set((list || []).map(function(v){ return String(v || '').trim(); }).filter(Boolean)));
  }
  var qKeywordTagsBase = dedupeStrings([].concat(
    industryKeywordBoost,
    productKeywordTags.length ? productKeywordTags : [kw1].filter(Boolean)
  )).slice(0, 10);
  var softKeywordTokens = dedupeStrings(
    preferredKeywords.map(apolloStripHsNoise).filter(function(token){
      var t = String(token || '').trim();
      if(!t) return false;
      if(/^\d{4,}$/.test(t)) return false;
      return true;
    })
  ).slice(0, 4);
  var softQuery = dedupeStrings([].concat([kw1, kw2], softKeywordTokens)).join(' ').trim();
  if(!softQuery){
    softQuery = getApolloFinderKeywords(prod, meta, sourceScope, country, targetCountries);
  }
  function roleTitleList(bucket, fallback){
    var picked = dedupeStrings([].concat(
      (getProductSpecificTitles(prod, meta.mode) || []).filter(function(title){ return apolloRoleBucket(title) === bucket; }),
      (meta.apolloTitles || []).filter(function(title){ return apolloRoleBucket(title) === bucket; }),
      fallback || []
    ));
    return picked.slice(0, 6);
  }
  async function searchPeopleAndMerge(item, titles, limit, maxPages){
    var pages = Math.max(1, Number(maxPages || 1) || 1);
    for(var page=1; page<=pages; page++){
      var req = {
        search_type:'people',
        page:page,
        per_page:limit || peoplePerPage,
        api_key:apolloKey
      };
      if(item && item._orgId){
        req.organization_ids = [item._orgId];
      } else {
        req.organization_locations = [country];
        req.q_organization_keyword_tags = qKeywordTagsBase.length ? qKeywordTagsBase : [kw1].filter(Boolean);
        req.q_keywords = item && item.kompaniya ? item.kompaniya : softQuery;
      }
      if(productIndustryTags.length){
        req.q_organization_industry_tag_ids = productIndustryTags;
      }
      if(Array.isArray(titles) && titles.length){
        req.person_titles = titles.slice(0, 6);
      }
      var data = await apolloRequestJson(req);
      hadSuccess = true;
      var mergedAny = false;
      normalizeApolloArray(data, ['people','contacts']).forEach(function(person){
        var org = person.organization || {};
        var companyName = org.name || person.organization_name || (item && item.kompaniya) || '';
        if(!companyName) return;
        var sameOrg = item && item._orgId && String(org.id || '').trim() && String(org.id || '').trim() === String(item._orgId || '').trim();
        if(item && item.kompaniya && !sameOrg && apolloCompanyKey(companyName) !== apolloCompanyKey(item.kompaniya)) return;
        apolloMergeContactCandidate(item, apolloPersonToContact(person, Object.assign({}, org, { id:(org && org.id) || item._orgId || '' })));
        mergedAny = true;
        if(org){
          item._orgId = item._orgId || String(org.id || '').trim();
          item.shahar = item.shahar || org.city || person.city || '';
          item.soha = item.soha || org.industry || org.industry_tag || '';
          item.website = item.website || apolloAbsoluteUrl(org.website_url || org.website || '');
          item.description = item.description || org.short_description || '';
          item.xodimlar = item.xodimlar || Number(org.estimated_num_employees || 0) || 0;
          item.daromad = item.daromad || org.organization_revenue_printed || org.annual_revenue_printed || '';
          item.tpilyil = item.tpilyil || org.founded_year || '';
        }
      });
      apolloApplyCompanyContacts(item);
      var totalCandidates = (item._contactCandidates || []).length;
      var emailContacts = apolloCountEmailContacts(item);
      if(apolloHasMinimumContactCoverage(item) || emailContacts >= 2 || totalCandidates >= 8){
        break;
      }
      if(!mergedAny) break;
    }
  }

  var executiveTitles = roleTitleList('executive', ['CEO','Chief Executive Officer','Founder','Owner','President','Managing Director','General Director']);
  var salesTitles = roleTitleList('sales', ['Sales Director','Sales Manager','Export Manager','Commercial Director','Business Development Manager','Account Manager']);
  var technicalTitles = roleTitleList('technical', ['Technical Director','Technical Manager','Chief Engineer','Engineer','Technician','Operations Manager','Production Manager','Plant Manager','Procurement Manager']);
  var broadTitles = dedupeStrings([].concat(
    executiveTitles,
    salesTitles,
    technicalTitles,
    getProductSpecificTitles(prod, meta.mode) || [],
    meta.apolloTitles || [],
    meta.apolloFallbackTitles || []
  ));
  var peopleSets = [
    executiveTitles.concat(salesTitles.slice(0, 2)),
    technicalTitles.concat(salesTitles.slice(2, 4))
  ].map(dedupeStrings).filter(function(set){ return set.length; });

  // ═══ STEP 1: People Search — kompaniyalarni topish va kontaktlarni yig'ish ═══
  for(var psi=0; psi<(enablePeopleDiscovery ? Math.min(1, peopleSets.length) : 0); psi++){
    if(found.length >= candidateCompanyLimit) break;
    for(var psPage=1; psPage<=1; psPage++){
      if(found.length >= candidateCompanyLimit) break;
      try {
        var psReq = {
          search_type:'people',
          page:psPage,
          per_page:discoveryPerPage,
          api_key:apolloKey,
          organization_locations:[country],
          person_titles: peopleSets[psi],
          q_organization_keyword_tags: qKeywordTagsBase.length ? qKeywordTagsBase : [kw1].filter(Boolean),
          q_keywords: softQuery
        };
        if(productIndustryTags.length){
          psReq.q_organization_industry_tag_ids = productIndustryTags;
        }
        var psData = await apolloRequestJson(psReq);
        hadSuccess = true;
        var pagePeople = normalizeApolloArray(psData, ['people','contacts']);
        pagePeople.forEach(function(person){
          if(found.length >= candidateCompanyLimit) return;
          var org = person.organization || {};
          var name = org.name || person.organization_name || '';
          if(!name) return;
          var mappedPerson = mapApolloPersonToFinderResult(person, country, meta);
          if(!isOrgRelevantToProduct(org, preferredKeywords, prod) || isApolloObviousMismatch(mappedPerson, prod)) return;
          apolloUpsertFinderItem(found, mappedPerson, meta);
        });
        if(!pagePeople.length) break;
      } catch(e){ lastError = e; if(apolloIsFatalError(e)) throw e; }
    }
  }

  // ═══ STEP 1b: Organization Search fallback ═══
  if(found.length < candidateCompanyLimit){
    var kwSets = [[kw1], [kw2], [softQuery], ['']];
    var seenKwSets = {};
    kwSets = kwSets.filter(function(s){
      var key = s.slice().sort().join('|');
      if(seenKwSets[key]) return false;
      seenKwSets[key] = true;
      return true;
    });
    var orgIndustryPasses = productIndustryTags.length ? [productIndustryTags, []] : [[]];
    var orgKeywordPasses = qKeywordTagsBase.length ? [qKeywordTagsBase, []] : [[]];
    for(var oi=0; oi<orgIndustryPasses.length; oi++){
      if(found.length >= candidateCompanyLimit) break;
      for(var oki=0; oki<orgKeywordPasses.length; oki++){
        if(found.length >= candidateCompanyLimit) break;
        for(var ki=0; ki<kwSets.length; ki++){
        if(found.length >= candidateCompanyLimit) break;
        for(var orgPage=1; orgPage<=1; orgPage++){
          if(found.length >= candidateCompanyLimit) break;
          try {
            var orgReq = {
              search_type:'organizations',
              page:orgPage,
              per_page:discoveryPerPage,
              api_key:apolloKey,
              organization_locations:[country],
              q_keywords: kwSets[ki].join(' ')
            };
            if(!String(orgReq.q_keywords || '').trim()) delete orgReq.q_keywords;
            if(orgKeywordPasses[oki].length){
              orgReq.q_organization_keyword_tags = orgKeywordPasses[oki];
            }
            if(orgIndustryPasses[oi].length){
              orgReq.q_organization_industry_tag_ids = orgIndustryPasses[oi];
            }
            var apData = await apolloRequestJson(orgReq);
            hadSuccess = true;
            var orgList = normalizeApolloArray(apData, ['organizations','accounts','companies']);
            orgList.forEach(function(org){
              if(found.length >= candidateCompanyLimit) return;
              var name = org.name || '';
              if(!name || name.length > 100 || /\|/.test(name)) return;
              var mappedOrg = mapApolloOrganizationToFinderResult(org, country, meta);
              if(!isOrgRelevantToProduct(org, preferredKeywords, prod) || isApolloObviousMismatch(mappedOrg, prod)) return;
              apolloUpsertFinderItem(found, mappedOrg, meta);
            });
            if(!orgList.length) break;
          } catch(eOrg){ lastError = eOrg; if(apolloIsFatalError(eOrg)) throw eOrg; }
        }
        }
      }
    }
  }

  if(!found.length && enableBroadOrgFallback){
    try {
      var broadOrgReq = {
        search_type:'organizations',
        page:1,
        per_page:Math.max(2, discoveryPerPage),
        api_key:apolloKey,
        organization_locations:[country],
        q_organization_keyword_tags: qKeywordTagsBase.length ? qKeywordTagsBase : [kw1].filter(Boolean),
        q_keywords: softQuery || kw1 || kw2
      };
      if(productIndustryTags.length){
        broadOrgReq.q_organization_industry_tag_ids = productIndustryTags;
      }
      var broadOrgData = await apolloRequestJson(broadOrgReq);
      hadSuccess = true;
      normalizeApolloArray(broadOrgData, ['organizations','accounts','companies']).forEach(function(org){
        if(found.length >= candidateCompanyLimit) return;
        var name = org.name || '';
        if(!name || name.length > 120 || /\|/.test(name)) return;
        var mappedOrg = mapApolloOrganizationToFinderResult(org, country, meta);
        if(!isOrgRelevantToProduct(org, preferredKeywords, prod) || isApolloObviousMismatch(mappedOrg, prod)) return;
        apolloUpsertFinderItem(found, mappedOrg, meta);
      });
    } catch(eBroadOrg){ lastError = eBroadOrg; if(apolloIsFatalError(eBroadOrg)) throw eBroadOrg; }
  }

  // ═══ STEP 2: Har bir kompaniya uchun 2–4 kontakt yig'ish ═══
  var coverageTitles = dedupeStrings([].concat(
    executiveTitles,
    salesTitles,
    technicalTitles,
    broadTitles.slice(0, 6)
  )).slice(0, 6);

  var candidates = found.slice().sort(function(a,b){
    return (Number(b.score || 0) - Number(a.score || 0));
  }).slice(0, Math.min(2, candidateCompanyLimit));

  for(var fi=0; fi<candidates.length; fi++){
    var item = candidates[fi];
    try {
      if(item._orgId){
        if(!apolloHasMinimumContactCoverage(item)) await searchPeopleAndMerge(item, coverageTitles, 4, 1);
      } else {
        await searchPeopleAndMerge(item, coverageTitles, 4, 1);
      }
      apolloApplyCompanyContacts(item);
    } catch(ePeople){
      console.log('Contact coverage for '+item.kompaniya+': '+ePeople.message);
      if(apolloIsFatalError(ePeople)) throw ePeople;
    }
  }

  // ═══ STEP 3: Fallback — hali hech narsa topilmagan bo'lsa people search ═══
  if(!found.length && enableFallbackPeople){
    try {
      for(var fbPage=1; fbPage<=1; fbPage++){
        var fbReq = {
          search_type:'people',
          page:fbPage,
          per_page:discoveryPerPage,
          api_key:apolloKey,
          person_titles:broadTitles.slice(0, 8),
          organization_locations:[country],
          q_organization_keyword_tags:qKeywordTagsBase.length ? qKeywordTagsBase : [kw1].filter(Boolean),
          q_keywords:softQuery
        };
        if(productIndustryTags.length){
          fbReq.q_organization_industry_tag_ids = productIndustryTags;
        }
        var fbData = await apolloRequestJson(fbReq);
        hadSuccess = true;
        var fallbackPeople = normalizeApolloArray(fbData, ['people','contacts']);
        fallbackPeople.forEach(function(person){
          var org = person.organization || {};
          var compName = org.name || person.organization_name || '';
          if(!compName) return;
          var fallbackPerson = mapApolloPersonToFinderResult(person, country, meta);
          if(!isOrgRelevantToProduct(org, preferredKeywords, prod) || isApolloObviousMismatch(fallbackPerson, prod)) return;
          apolloUpsertFinderItem(found, fallbackPerson, meta);
        });
        if(!fallbackPeople.length) break;
      }
      // Kreditni tejash: fallback natijalarida qo'shimcha enrichment qilinmaydi.
    } catch(e3){ lastError = e3; if(apolloIsFatalError(e3)) throw e3; }
  }

  if(!found.length){
    var localFallback = buildApolloLocalFallbackResults(prod, country, perCountry, meta, strategy);
    if(localFallback.length){
      return localFallback;
    }
  }
  if(!found.length && !hadSuccess && lastError) throw lastError;
  return finalizeApolloFinderResults(found, prod, perCountry, strategy, meta);
}

function updateFinderModeUI(){
  var modeEl = document.getElementById('finder-mode');
  var meta = getFinderModeMeta(modeEl ? modeEl.value : 'importers');
  _finderMode = meta.mode;
  var countriesLabel = document.getElementById('finderCountriesLabel');
  if(countriesLabel) countriesLabel.textContent = meta.countryLabel;
  var volHead = document.getElementById('finder-volume-head');
  if(volHead) volHead.textContent = meta.volumeLabel;
  renderFinderTargetFilters();
  renderFinderSourceFilters();
}

async function runCompanyFinder(source){
  updateFinderModeUI();
  var sel = document.getElementById('finder-product-select');
  var prodId = sel.value;
  if(!prodId){
    if(source === 'tradeatlas'){ showTradeAtlasUsageDialog(); return; }
    toast('⚠️ Mahsulot tanlang','error');
    return;
  }
  var prod = (DB.products||[]).find(function(p){return p.id==prodId;});
  if(!prod) return;
  var meta = getFinderModeMeta((document.getElementById('finder-mode')||{}).value || 'importers');
  _finderMode = meta.mode;
  var sourceScope = getFinderSourceSelection();
  var countSettings = getFinderCountSettings();
  var requestedCount = countSettings.count;
  var strategy = getFinderStrategyFilters();

  // ═══ TOP 100 GLOBAL MODE (kredit tejash uchun 2 ta bilan cheklangan) ═══
  var isTop100Global = !!(strategy.top100 && source === 'apollo');
  var TOP100_CAP = 2;
  if(isTop100Global){
    requestedCount = TOP100_CAP;
  }

  var effectiveRequestedCount = (source === 'apollo' && !isTop100Global) ? Math.min(2, Math.max(1, requestedCount || 2)) : requestedCount;
  var requestPerCountry = countSettings.mode === 'total'
    ? Math.max(1, Math.ceil(effectiveRequestedCount / Math.max((meta.mode === 'exporters' ? (sourceScope.effectiveCountries || []).length : (_finderTargetCountries || []).length), 1)))
    : effectiveRequestedCount;
  if(source === 'apollo' && !isTop100Global){
    requestPerCountry = Math.min(2, Math.max(1, requestPerCountry));
  }
  var finalDisplayLimit = source === 'tradeatlas'
    ? Number.MAX_SAFE_INTEGER
    : effectiveRequestedCount;

  // Get selected target countries
  var targetCountries = (_finderTargetCountries || []).slice();
  if(!isTop100Global && !targetCountries.length){ toast('⚠️ Kamida bitta davlat tanlang','error'); return; }
  var searchCountries = meta.mode === 'exporters'
    ? (sourceScope.effectiveCountries || []).slice()
    : targetCountries.slice();
  if(meta.mode === 'exporters' && !searchCountries.length && source !== 'tradeatlas' && !isTop100Global){
    toast('⚠️ Eksportyor kompaniyalar uchun avval "Eksportyor manbasi" bo\'limidan qit\'a yoki davlat tanlang','error');
    return;
  }

  // ═══ TOP 100: Confirmation before API calls ═══
  if(isTop100Global){
    var estimatedCredits = 1;
    var confirmed = await new Promise(function(resolve){
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
      var box = document.createElement('div');
      box.style.cssText = 'background:#fff;border-radius:16px;padding:2rem;max-width:440px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.3)';
      box.innerHTML = '<div style="text-align:center;margin-bottom:1.2rem"><div style="width:56px;height:56px;border-radius:50%;background:#FEF3C7;display:inline-flex;align-items:center;justify-content:center;margin-bottom:.8rem"><svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 19h20L12 2z" stroke="#D97706" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="14" r="1.5" fill="#D97706"/><path d="M12 8v3" stroke="#D97706" stroke-width="2" stroke-linecap="round"/></svg></div><h3 style="margin:0;font-size:1.1rem;color:#1a1a2e">Apollo Top '+TOP100_CAP+' Qidiruvi</h3></div>'+
        '<div style="background:#F8FAFC;border-radius:10px;padding:1rem;margin-bottom:1rem;font-size:.82rem;color:#475569">'+
        '<div style="margin-bottom:.5rem"><strong>Mahsulot:</strong> '+(prod.name_en||prod.name_uz||'')+'</div>'+
        '<div style="margin-bottom:.5rem"><strong>Rejim:</strong> Dunyo bo\'yicha Top '+TOP100_CAP+' ishlab chiqaruvchi</div>'+
        '<div style="margin-bottom:.5rem"><strong>Saralash:</strong> Daromad va xodimlar soni bo\'yicha</div>'+
        '<div><strong>Taxminiy kredit:</strong> ~'+estimatedCredits+' ta Apollo so\'rov</div>'+
        '</div>'+
        '<div style="display:flex;gap:.8rem;justify-content:center">'+
        '<button id="top100Cancel" style="padding:.6rem 1.5rem;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#475569;font-weight:600;cursor:pointer;font-size:.85rem">Bekor qilish</button>'+
        '<button id="top100Confirm" style="padding:.6rem 1.5rem;border-radius:10px;border:none;background:linear-gradient(135deg,#D97706,#B45309);color:#fff;font-weight:600;cursor:pointer;font-size:.85rem">🚀 Qidiruvni boshlash</button>'+
        '</div>';
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      document.getElementById('top100Cancel').onclick = function(){ document.body.removeChild(overlay); resolve(false); };
      document.getElementById('top100Confirm').onclick = function(){ document.body.removeChild(overlay); resolve(true); };
      overlay.addEventListener('click', function(e){ if(e.target===overlay){ document.body.removeChild(overlay); resolve(false); }});
    });
    if(!confirmed) return;
  }

  var _finderToast = toastLoading('⏳ ' + (source==='tradeatlas'?'TradeAtlas':source==='apollo'?(isTop100Global?('Apollo Top '+TOP100_CAP):'Apollo'):'Gemini') + ': "'+prod.name_en+'" qidirilmoqda...');
  document.getElementById('finderEmpty').style.display = 'none';
  document.getElementById('finderResultCard').style.display = 'none';
  document.getElementById('finderKpiGrid').style.display = 'none';
  document.getElementById('finderProgress').style.display = 'block';
  document.getElementById('finderBar').style.width = '10%';
      document.getElementById('finderProgressText').textContent =
        isTop100Global
          ? ('🏆 Dunyo bo\'yicha "'+prod.name_en+'" Top '+TOP100_CAP+' yirik kompaniyalar qidirilmoqda...')
          : (meta.mode === 'exporters'
            ? ('Manba: '+searchCountries.map(getFinderCountryLabel).slice(0,5).join(', ')+(searchCountries.length>5?'...':'')+' | Maqsad: '+targetCountries.map(getFinderCountryLabel).slice(0,4).join(', ')+(targetCountries.length>4?'...':''))
            : (searchCountries.length+' ta davlatda "'+prod.name_en+'" '+meta.resultWord+' qidirilmoqda...')
          ) + (!isTop100Global && sourceScope.hasFilter && meta.mode !== 'exporters' ? (' | Manba: '+sourceScope.summary) : '');

  _finderResults = [];

  if(source === 'tradeatlas'){
    var taConfirmed = await showTradeAtlasPreSearchConfirm(prod, meta, targetCountries, sourceScope);
    if(!taConfirmed){
      document.getElementById('finderProgress').style.display = 'none';
      toast('ℹ️ TradeAtlas qidiruvi bekor qilindi','info');
      return;
    }
  }

  try {
    if(source === 'tradeatlas'){
      syncImportSourceSelect('tradeatlas');
      runImportAnalysis(true, 'tradeatlas').catch(function(err){
        console.warn('TradeAtlas auto analysis error:', err && err.message ? err.message : err);
      });
      document.getElementById('finderBar').style.width = '38%';
      document.getElementById('finderProgressText').textContent =
        'TradeAtlas: HS ' + (getExactImportHsCode(prod) || '-') +
        ' | Importyor: ' + targetCountries.slice(0,4).map(getFinderCountryLabel).join(', ') + (targetCountries.length > 4 ? '...' : '') +
        ' | Eksportyor: ' + (((sourceScope && sourceScope.effectiveCountries) || []).length
          ? sourceScope.effectiveCountries.slice(0,4).map(getFinderCountryLabel).join(', ') + (sourceScope.effectiveCountries.length > 4 ? '...' : '')
          : 'Butun dunyo');
      // Arzon yol: /firms/search (har firma = 1 kredit), shipment aggregation yoq
      var tradeAtlasResults = await tradeAtlasFirmsOnlySearch(prod, meta, targetCountries, sourceScope);
      tradeAtlasResults.filter(finderResultIsRenderable).forEach(function(item){
        _finderResults.push(item);
      });
      dedupeFinderResults();
      _finderResults = _finderResults.filter(finderResultIsRenderable);
      if(!_finderResults.length){
        throw new Error('TradeAtlas qidiruvi natija qaytarmadi');
      }
      document.getElementById('finderBar').style.width = '88%';
    } else if(source==='apollo' && isTop100Global){
      // ═══ APOLLO TOP 100 GLOBAL SEARCH ═══
      document.getElementById('finderBar').style.width = '15%';
      document.getElementById('finderProgressText').textContent = '🏆 Apollo Top '+TOP100_CAP+': "'+prod.name_en+'" — dunyo bo\'yicha yirik kompaniyalar qidirilmoqda...';
      var apolloKey = getApolloApiKey();
      if(!apolloKey) throw new Error('Apollo API key topilmadi. Sozlamalar sahifasiga kiriting.');
      var preferredKeywords = getApolloPreferredKeywords(prod);
      var coreSignals = getApolloCoreCommoditySignals(prod);
      var kw1 = apolloStripHsNoise(coreSignals[0] || preferredKeywords[0] || ((prod && prod.name_en) || ''));
      var productKeywordTags = getProductKeywordTags(prod);
      var industryKeywordBoost = getApolloIndustryKeywordBoost(prod);
      var productIndustryTags = getProductIndustryTags(prod);
      var qKeywordTagsBase100 = Array.from(new Set([].concat(industryKeywordBoost, productKeywordTags.length ? productKeywordTags : [kw1].filter(Boolean)).map(function(v){return String(v||'').trim();}).filter(Boolean))).slice(0,10);
      var softQuery100 = Array.from(new Set(preferredKeywords.map(apolloStripHsNoise).filter(function(t){return t && !/^\d{4,}$/.test(t);}))).slice(0,4).concat([kw1]).join(' ').trim();
      if(!softQuery100) softQuery100 = kw1;

      // Employee size ranges — largest first for top companies
      var sizeRanges = [
        '10001+',
        '5001,10000',
        '1001,5000',
        '501,1000',
        '201,500',
        '51,200'
      ];
      var top100Results = [];
      var top100Errors = [];
      var pagesDone = 0;
      var totalPages = sizeRanges.length * 2; // org search + people enrichment

      for(var si=0; si<sizeRanges.length; si++){
        if(top100Results.length >= TOP100_CAP) break;
        var sizeRange = sizeRanges[si];
        document.getElementById('finderProgressText').textContent = '🏆 Apollo Top: xodimlar '+sizeRange+' — qidirilmoqda... ('+top100Results.length+'/'+TOP100_CAP+')';
        try {
          var orgReq100 = {
            search_type:'organizations',
            page:1,
            per_page:TOP100_CAP,
            api_key:apolloKey,
            organization_num_employees_ranges:[sizeRange],
            q_keywords: softQuery100
          };
          if(qKeywordTagsBase100.length) orgReq100.q_organization_keyword_tags = qKeywordTagsBase100;
          if(productIndustryTags.length) orgReq100.q_organization_industry_tag_ids = productIndustryTags;

          var orgData100 = await apolloRequestJson(orgReq100);
          var orgList100 = normalizeApolloArray(orgData100, ['organizations','accounts','companies']);

          orgList100.forEach(function(org){
            if(top100Results.length >= TOP100_CAP) return;
            var name = org.name || '';
            if(!name || name.length > 120) return;
            // Dedupe
            var key = name.toLowerCase().replace(/[^a-z0-9]/g,'');
            if(top100Results.some(function(r){return r.kompaniya.toLowerCase().replace(/[^a-z0-9]/g,'')===key;})) return;

            var revenue = org.organization_revenue_printed || org.annual_revenue_printed || org.estimated_annual_revenue || '';
            var employees = Number(org.estimated_num_employees || 0) || 0;

            top100Results.push({
              id:'top100_'+Date.now()+'_'+top100Results.length,
              kompaniya: name,
              rahbar:'',
              lavozim:'',
              email:'',
              telefon:'',
              davlat: org.country || org.raw_address || '',
              shahar: org.city || '',
              soha: org.industry || org.industry_tag_id || '',
              website: apolloAbsoluteUrl(org.website_url || org.website || ''),
              xodimlar: employees,
              daromad: revenue,
              tpilyil: org.founded_year || '',
              description: org.short_description || '',
              import_volume:'',
              import_share:'',
              products_imported:'',
              why: (revenue ? 'Daromad: '+revenue+'. ' : '')+(employees ? employees+' xodim. ' : '')+(org.short_description || ''),
              score: employees >= 10000 ? 95 : employees >= 5000 ? 90 : employees >= 1000 ? 85 : employees >= 500 ? 78 : 70,
              manba:'Apollo Top 100',
              finderMode: meta.mode,
              _orgId: org.id || ''
            });
          });

          // Page 2 if needed
          if(top100Results.length < TOP100_CAP && orgList100.length >= 20){
            var orgReq100p2 = Object.assign({}, orgReq100, {page:2});
            var orgData100p2 = await apolloRequestJson(orgReq100p2);
            normalizeApolloArray(orgData100p2, ['organizations','accounts','companies']).forEach(function(org){
              if(top100Results.length >= TOP100_CAP) return;
              var name = org.name || '';
              if(!name || name.length > 120) return;
              var key = name.toLowerCase().replace(/[^a-z0-9]/g,'');
              if(top100Results.some(function(r){return r.kompaniya.toLowerCase().replace(/[^a-z0-9]/g,'')===key;})) return;
              var revenue = org.organization_revenue_printed || org.annual_revenue_printed || org.estimated_annual_revenue || '';
              var employees = Number(org.estimated_num_employees || 0) || 0;
              top100Results.push({
                id:'top100_'+Date.now()+'_'+top100Results.length,
                kompaniya: name, rahbar:'', lavozim:'', email:'', telefon:'',
                davlat: org.country || '', shahar: org.city || '',
                soha: org.industry || '', website: apolloAbsoluteUrl(org.website_url || org.website || ''),
                xodimlar: employees, daromad: revenue, tpilyil: org.founded_year || '',
                description: org.short_description || '',
                import_volume:'', import_share:'', products_imported:'',
                why: (revenue ? 'Daromad: '+revenue+'. ' : '')+(employees ? employees+' xodim. ' : '')+(org.short_description || ''),
                score: employees >= 10000 ? 95 : employees >= 5000 ? 90 : employees >= 1000 ? 85 : employees >= 500 ? 78 : 70,
                manba:'Apollo Top 100', finderMode: meta.mode, _orgId: org.id || ''
              });
            });
          }
        } catch(e100){
          console.log('Apollo Top100 size '+sizeRange+' error:', e100);
          if(apolloIsFatalError(e100)) throw e100;
          top100Errors.push(sizeRange+': '+((e100&&e100.message)||'xato'));
        }
        pagesDone++;
        document.getElementById('finderBar').style.width = (15 + pagesDone/totalPages*75)+'%';
      }

      // Sort by score (which is based on employee count)
      top100Results.sort(function(a,b){ return (b.score||0)-(a.score||0) || (b.xodimlar||0)-(a.xodimlar||0); });
      top100Results = top100Results.slice(0, TOP100_CAP);

      // Add rank
      top100Results.forEach(function(item, idx){ item.top100Rank = idx + 1; });

      _finderResults = top100Results;
      if(!_finderResults.length){
        throw new Error('Apollo Top '+TOP100_CAP+' qidiruvi natija qaytarmadi.' + (top100Errors.length ? ' Xatolar: '+top100Errors.slice(0,3).join(' | ') : ''));
      }
    } else if(source==='apollo'){
      // Apollo proxy — organization search first, then people fallback
      document.getElementById('finderBar').style.width = '40%';
      var apolloFatalError = null;
      var apolloSoftErrors = [];
      for(var ci=0; ci<searchCountries.length; ci++){
        document.getElementById('finderProgressText').textContent = '🅰️ Apollo: '+getFinderCountryLabel(searchCountries[ci])+' ('+(ci+1)+'/'+searchCountries.length+') — '+meta.resultWord+'...'+(meta.mode === 'exporters' ? (' | Maqsad: '+targetCountries.slice(0,4).map(getFinderCountryLabel).join(', ')+(targetCountries.length>4?'...':'')) : '');
        try {
          var countryResults = await apolloFinderSearchCountry(prod, searchCountries[ci], requestPerCountry, meta, sourceScope, targetCountries, strategy);
          countryResults.filter(finderResultIsRenderable).forEach(function(item){ _finderResults.push(item); });
          dedupeFinderResults();
          if(_finderResults.length >= effectiveRequestedCount) break;
        } catch(e){
          console.log('Apollo '+searchCountries[ci]+' error:', e);
          if(apolloIsFatalError(e)){
            apolloFatalError = e;
            break;
          }
          apolloSoftErrors.push(getFinderCountryLabel(searchCountries[ci]) + ': ' + ((e && e.message) || 'xato'));
          continue;
        }
        document.getElementById('finderBar').style.width = (40+ci/searchCountries.length*50)+'%';
      }
      if(apolloFatalError) throw apolloFatalError;
      dedupeFinderResults();
      _finderResults = _finderResults.filter(finderResultIsRenderable).slice(0, effectiveRequestedCount);
      if(!_finderResults.length && apolloSoftErrors.length){
        throw new Error('Apollo qidiruvi natija qaytarmadi. Ayrim davlatlarda xatolar bo\'ldi: ' + apolloSoftErrors.slice(0,3).join(' | '));
      }
    } else {
      // Gemini AI — country-by-country search for importers
      var batchSize = Math.min(searchCountries.length, 4); // Process 4 countries at a time
      for(var bi=0; bi<searchCountries.length; bi+=batchSize){
        var batch = searchCountries.slice(bi, bi+batchSize);
        var pct = 20 + (bi/searchCountries.length)*70;
        document.getElementById('finderBar').style.width = pct+'%';
        document.getElementById('finderProgressText').textContent = '🤖 '+batch.map(getFinderCountryLabel).join(', ')+' — '+meta.resultWord+' qidirilmoqda... ('+(bi+batch.length)+'/'+searchCountries.length+')';

        var prompt;
        if(meta.mode === 'exporters'){
          prompt = 'You are a B2B trade intelligence expert. Return ONLY valid JSON array.\n'+
            'Find REAL exporter / supplier / manufacturer companies headquartered in these source countries: '+batch.join(', ')+'.\n'+
            'These companies should export or be capable of exporting "'+prod.name_en+'" (HS Code: '+(prod.hs_code||'N/A')+') to one or more of these destination countries: '+targetCountries.join(', ')+'.\n'+
            (countSettings.mode === 'total'
              ? ('Return TOTAL '+requestedCount+' real exporter companies across the selected source countries.\n')
              : ('For EACH source country find '+requestedCount+' real exporter companies.\n'))+
            'Do NOT return importer companies from the destination countries.\n'+
            (strategy.top100 ? 'Prioritize top 100 or market-leading companies in this sector.\n' : '')+
            (strategy.expansion ? 'Prioritize companies showing expansion intent, growth, new market development, or international business development.\n' : '')+
            (strategy.target13 ? 'Only include exporters that appear capable of serving the 13 selected target markets; exclude generic exporters without clear regional fit.\n' : '')+
            'JSON format: [{"company":"Real Company Name","country":"Germany","city":"Hamburg",'+
            '"contact_name":"Anna Schmidt","title":"Export Director",'+
            '"industry":"Construction Materials Manufacturing",'+
            '"website":"www.realsite.com","employees":200,'+
            '"'+meta.promptVolumeField+'":"$5M/year","trade_share_pct":15,'+
            '"products_traded":"granite slabs, marble tiles",'+
            '"score":85,"why":"Exports stone products to Central Asia and Caucasus"}]\n'+
            (sourceScope.promptText ? (sourceScope.promptText+'\n') : '')+
            'Score 1-100: 90+ = direct exporter/manufacturer of this exact product, 70-89 = strong supplier/exporter of similar products, 50-69 = potential lead.\n'+
            'IMPORTANT: The "country" field must be the exporter company source country, not the destination market.';
        } else {
          prompt = 'You are a B2B trade intelligence expert. Return ONLY valid JSON array.\n'+
            'Find REAL companies that '+meta.promptVerb+' "'+prod.name_en+'" (HS Code: '+(prod.hs_code||'N/A')+') for these countries: '+batch.join(', ')+'.\n'+
            (countSettings.mode === 'total'
              ? ('Return TOTAL '+requestedCount+' companies across the selected countries that are '+meta.promptRole+' of this product.\n')
              : ('For EACH country find '+requestedCount+' companies that are '+meta.promptRole+' of this product.\n'))+
            'These should be real active companies relevant to cross-border trade of this product.\n'+
            (strategy.top100 ? 'Prioritize top 100 or market-leading companies in this sector.\n' : '')+
            (strategy.expansion ? 'Prioritize companies showing expansion intent, growth, new market development, or active sourcing scale-up.\n' : '')+
            'JSON format: [{"company":"Real Company Name","country":"Russia","city":"Moscow",'+
            '"contact_name":"Ivan Petrov","title":"Purchase Director",'+
            '"industry":"Construction Materials Distribution",'+
            '"website":"www.realsite.com","employees":200,'+
            '"'+meta.promptVolumeField+'":"$5M/year","trade_share_pct":15,'+
            '"products_traded":"granite slabs, marble tiles",'+
            '"score":85,"why":"Major distributor of stone products in Moscow region"}]\n'+
            'Score 1-100: 90+ = direct importer of this exact product, 70-89 = trades similar products, 50-69 = potential lead.\n'+
            'IMPORTANT: Use REALISTIC company names from '+batch.join(', ')+'. Include trade volume estimates.';
        }

        var body = {contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.5,maxOutputTokens:4000}};
        var data = await callGemini(body);
        var arr = [];
        try { arr = safeParseJSON(geminiText(data)); } catch(e){ console.log('Parse error for batch:', e); }
        if(!Array.isArray(arr)) arr = [];

        arr.forEach(function(c){
          _finderResults.push({
            id:'fc_'+Date.now()+'_'+_finderResults.length,
            kompaniya:c.company||'Unknown',
            rahbar:c.contact_name||'',
            lavozim:c.title||'',
            email:c.email||'',
            telefon:c.phone||'',
            davlat:c.country||batch[0],
            shahar:c.city||'',
            soha:c.industry||'',
            website:c.website||'',
            xodimlar:c.employees||'',
            import_volume:c.import_volume_usd||c.export_volume_usd||c.trade_volume_usd||'',
            import_share:c.import_share_pct||c.trade_share_pct||'',
            products_imported:c.products_imported||c.products_traded||'',
            why:c.why||'',
            score:c.score||60,
            manba:'Gemini AI',
            finderMode:meta.mode
          });
        });
      }
    }

    if(countSettings.mode === 'total' && _finderResults.length > requestedCount){
      _finderResults = _finderResults
        .sort(function(a,b){ return (b.score||0) - (a.score||0); })
        .slice(0, requestedCount);
    }

    document.getElementById('finderBar').style.width = '100%';
    setTimeout(function(){
      document.getElementById('finderProgress').style.display = 'none';

      _finderResults = (_finderResults || []).filter(finderResultIsRenderable);

      if(!_finderResults.length){
        if(source === 'apollo'){
          toast('ℹ️ Apollo natija bermadi, Gemini fallback ishga tushdi','warning');
          runCompanyFinder('gemini');
          return;
        }
        document.getElementById('finderEmpty').style.display = 'block';
        toast('⚠️ Kompaniya topilmadi','error');
        return;
      }

      // KPI summary
      var countryGroups = {};
      _finderResults.forEach(function(r){
        if(!countryGroups[r.davlat]) countryGroups[r.davlat] = [];
        countryGroups[r.davlat].push(r);
      });
      var countryNames = Object.keys(countryGroups);
      var highScore = _finderResults.filter(function(r){return r.score>=80;}).length;

      document.getElementById('finderKpiGrid').style.display = 'grid';
      document.getElementById('finderKpiGrid').innerHTML =
        '<div class="kpi-card c1"><div class="kpi-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="currentColor"/></svg></div><div class="kpi-card-body"><div class="kpi-label">Jami kompaniyalar</div><div class="kpi-val">'+_finderResults.length+'</div></div></div>'+
        '<div class="kpi-card c2"><div class="kpi-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/></svg></div><div class="kpi-card-body"><div class="kpi-label">Davlatlar</div><div class="kpi-val">'+countryNames.length+'</div></div></div>'+
        '<div class="kpi-card c3"><div class="kpi-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg></div><div class="kpi-card-body"><div class="kpi-label">Yuqori baholilar (80+)</div><div class="kpi-val">'+highScore+'</div></div></div>'+
        '<div class="kpi-card c4"><div class="kpi-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z" fill="currentColor"/></svg></div><div class="kpi-card-body"><div class="kpi-label">Mahsulot</div><div class="kpi-val" style="font-size:.7rem">'+prod.name_en.slice(0,20)+'</div></div></div>';

      document.getElementById('finderResultCard').style.display = 'block';
      _finderActiveCountryFilter = '';
      refreshFinderResultTabs();
      renderCurrentFinderTable();

      toastDone(_finderToast, '✅ '+_finderResults.length+' ta kompaniya '+countryNames.length+' ta davlatdan topildi!');
    }, 500);

  } catch(e){
    document.getElementById('finderProgress').style.display = 'none';
    document.getElementById('finderEmpty').style.display = 'block';
    toastDone(_finderToast, '❌ Xato: '+e.message,'error');
    console.error(e);
  }
}

function _legacyRenderFinderTable_v2(results){
  updateFinderModeUI();
  var tb = document.getElementById('finder-tbody');
  if(!tb) return;
  var rows = [];
  results.sort(function(a,b){ return (b.score||0)-(a.score||0); }).forEach(function(r,i){
    var scoreColor = r.score>=80?'#059669':r.score>=60?'#FFB703':'#EF233C';
    var contacts = getFinderVisibleContacts(r);
    if(!contacts.length) return;
    var rowspan = Math.max(1, contacts.length);
    contacts.forEach(function(contact, contactIdx){
      var row = '<tr>';
      if(contactIdx === 0){
        row += '<td rowspan="'+rowspan+'"><input type="checkbox" class="fc-check" data-idx="'+i+'" checked></td>';
        row += '<td rowspan="'+rowspan+'">'+(i+1)+'</td>';
        row += '<td rowspan="'+rowspan+'"><b>'+escHtml(r.kompaniya||'—')+'</b>'+(r.website?'<div style="font-size:.55rem;color:var(--text3)">'+escHtml(r.website)+'</div>':'')+'</td>';
        row += '<td rowspan="'+rowspan+'">'+getFinderCountryFlag(r.davlat)+' '+getFinderCountryLabel(r.davlat)+'</td>';
        row += '<td rowspan="'+rowspan+'" style="font-size:.7rem">'+escHtml(r.shahar||'—')+'</td>';
      }
      row += '<td>'+renderFinderContactCard(contact)+'</td>';
      if(contactIdx === 0){
        row += '<td rowspan="'+rowspan+'" style="font-size:.65rem">'+escHtml(r.soha||'—')+'</td>';
        row += '<td rowspan="'+rowspan+'" style="font-size:.65rem">'+escHtml(r.daromad||'—')+'</td>';
        row += '<td rowspan="'+rowspan+'"><span style="font-weight:800;color:'+scoreColor+'">'+escHtml(String(r.score||0))+'</span></td>';
      }
      row += '<td style="white-space:nowrap"><button class="btn btn-blue btn-sm" onclick="goToAiLetter('+i+')" title="AI xat" style="font-size:.58rem;padding:3px 8px">📧</button></td></tr>';
      rows.push(row);
    });
  });
  tb.innerHTML = rows.join('');
}

function filterFinderByCountry(country){
  _finderActiveCountryFilter = String(country || '').trim();
  refreshFinderResultTabs();
  renderCurrentFinderTable();
}

// Override finder table rendering so each qualified contact gets its own detail/status/action controls.
function _legacyRenderFinderTable_v3(results){
  updateFinderModeUI();
  var tb = document.getElementById('finder-tbody');
  if(!tb) return;
  var rows = [];
  var allResults = Array.isArray(_finderResults) ? _finderResults : [];
  (results || []).slice().sort(function(a,b){
    return (b.score || 0) - (a.score || 0);
  }).forEach(function(r, i){
    var scoreColor = r.score>=80 ? '#059669' : r.score>=60 ? '#FFB703' : '#EF233C';
    var contacts = getFinderVisibleContacts(r);
    if(!contacts.length) return;
    var sourceIdx = allResults.indexOf(r);
    if(sourceIdx < 0) sourceIdx = i;
    contacts.forEach(function(contact, contactIdx){
      var aiRecord = findFinderContactInvestorRecord(r, contact);
      var aiTargetKey = getFinderContactTargetKey(sourceIdx, contactIdx, aiRecord);
      var isFinderAiOpen = !!_finderAiOpen && aiTargetKey === String(_finderAiTargetKey || '');
      var isFinderDetailOpen = String(_finderDetailTargetKey || '') === aiTargetKey;
      var row = '<tr>';
      row += '<td><input type="checkbox" class="fc-check" data-idx="'+sourceIdx+'" checked></td>';
      row += '<td>'+(i+1)+'</td>';
      row += '<td><b>'+escHtml(r.kompaniya || '—')+'</b>'+(r.website ? '<div style="font-size:.55rem;color:var(--text3)">'+escHtml(r.website)+'</div>' : '')+'</td>';
      row += '<td>'+getFinderCountryFlag(r.davlat)+' '+getFinderCountryLabel(r.davlat)+'</td>';
      row += '<td style="font-size:.7rem">'+escHtml(r.shahar || '—')+'</td>';
      row += '<td>'+renderFinderContactCard(contact)+'</td>';
      row += '<td style="font-size:.65rem">'+escHtml(r.soha || '—')+'</td>';
      row += '<td style="font-size:.65rem">'+escHtml(r.daromad || '—')+'</td>';
      row += '<td><span style="font-weight:800;color:'+scoreColor+'">'+escHtml(String(r.score || 0))+'</span></td>';
      row += '<td><button type="button" onclick="openFinderContactDetail('+sourceIdx+','+contactIdx+')" class="btn btn-ghost btn-sm" style="font-size:.68rem;padding:5px 10px">Batafsil</button></td>';
      row += '<td>'+renderFinderContactEmailStatus(sourceIdx, contactIdx, contact)+'</td>';
      row += '<td><div style="display:flex;gap:6px;align-items:center;white-space:nowrap">'+
        '<button class="btn btn-sm" onclick="openFinderContactAi('+sourceIdx+','+contactIdx+')" title="AI tahlil va xat" style="background:linear-gradient(135deg,#7C3AED,#4361EE);color:#fff;border:none">🤖</button>'+
        (contact.email ? '<button class="btn btn-blue btn-sm" onclick="openFinderContactEmail('+sourceIdx+','+contactIdx+')" title="Xat yuborish">📧</button>' : '')+
        (contact.email ? '<button class="btn btn-sm" onclick="openFinderContactSchedule('+sourceIdx+','+contactIdx+')" title="Rejalashtirish" style="background:var(--bg2);color:var(--text2);border:1px solid var(--border)">📅</button>' : '')+
        '<button class="btn btn-danger btn-sm" onclick="deleteFinderContactResult('+sourceIdx+','+contactIdx+')" title="Kontaktni olib tashlash">🗑</button>'+
      '</div></td></tr>';
      rows.push(row);
      if(isFinderDetailOpen || isFinderAiOpen){
        var detailRec = aiRecord || ensureFinderContactInvestorRecord(sourceIdx, contactIdx);
        var inlineBlocks = '';
        if(isFinderDetailOpen){
          inlineBlocks += renderFinderInlineDetail(r, contact, detailRec);
        }
        if(isFinderAiOpen){
          inlineBlocks += '<div id="finderAiRowMount" style="padding:.2rem 0 .2rem"></div>';
        }
        rows.push(
          '<tr class="finder-ai-inline-row">'+
            '<td colspan="12" style="padding:0;background:rgba(67,97,238,.03)">'+
              '<div style="padding:.85rem 1rem .35rem">'+inlineBlocks+'</div>'+
            '</td>'+
          '</tr>'
        );
      }
    });
  });
  tb.innerHTML = rows.join('');
  mountInvestorAiWorkspace();
}

// Final override: keep one company row-group and show multiple contacts under that company.
function renderFinderTable(results){
  updateFinderModeUI();
  var tb = document.getElementById('finder-tbody');
  if(!tb) return;
  var rows = [];
  var allResults = Array.isArray(_finderResults) ? _finderResults : [];
  (results || []).slice().sort(function(a,b){
    return (b.score || 0) - (a.score || 0);
  }).forEach(function(r, i){
    var contacts = getFinderVisibleContacts(r);
    if(!contacts.length) return;
    var sourceIdx = allResults.indexOf(r);
    if(sourceIdx < 0) sourceIdx = i;
    var scoreColor = r.score>=80 ? '#059669' : r.score>=60 ? '#FFB703' : '#EF233C';
    var contactRows = contacts.map(function(contact, contactIdx){
      var aiRecord = findFinderContactInvestorRecord(r, contact);
      var aiTargetKey = getFinderContactTargetKey(sourceIdx, contactIdx, aiRecord);
      return {
        contact: contact,
        contactIdx: contactIdx,
        aiRecord: aiRecord,
        isFinderAiOpen: !!_finderAiOpen && aiTargetKey === String(_finderAiTargetKey || ''),
        isFinderDetailOpen: String(_finderDetailTargetKey || '') === aiTargetKey
      };
    });
    var inlineCount = contactRows.filter(function(state){
      return state.isFinderAiOpen || state.isFinderDetailOpen;
    }).length;
    var rowspan = contactRows.length + inlineCount;
    contactRows.forEach(function(state, contactRowIdx){
      var row = '<tr>';
      if(contactRowIdx === 0){
        row += '<td rowspan="'+rowspan+'"><input type="checkbox" class="fc-check" data-idx="'+sourceIdx+'" checked></td>';
        row += '<td rowspan="'+rowspan+'">'+(i+1)+'</td>';
        row += '<td rowspan="'+rowspan+'"><div onclick="openFinderContactDetail('+sourceIdx+',0)" style="cursor:pointer;padding:4px 6px;border-radius:8px;transition:background .15s" onmouseover="this.style.background=\'rgba(70,95,255,.06)\'" onmouseout="this.style.background=\'\'" title="Batafsil"><b>'+escHtml(r.kompaniya || '—')+'</b>'+(r.website ? '<div style="font-size:.55rem;color:var(--text3)">'+escHtml(r.website)+'</div>' : '')+'</div></td>';
        row += '<td rowspan="'+rowspan+'">'+getFinderCountryFlag(r.davlat)+' '+getFinderCountryLabel(r.davlat)+'</td>';
        row += '<td rowspan="'+rowspan+'" style="font-size:.7rem">'+escHtml(r.shahar || '—')+'</td>';
      }
      row += '<td>'+renderFinderContactCard(state.contact)+'</td>';
      if(contactRowIdx === 0){
        row += '<td rowspan="'+rowspan+'"><span style="font-weight:800;color:'+scoreColor+'">'+escHtml(String(r.score || 0))+'</span></td>';
      }
      row += '<td>'+renderFinderContactEmailStatus(sourceIdx, state.contactIdx, state.contact)+'</td>';
      var _fabtn = 'width:30px;height:30px;border-radius:7px;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all .2s ease;flex-shrink:0;padding:0;';
      row += '<td><div style="display:flex;gap:4px;align-items:center;flex-wrap:nowrap">'+
        '<button type="button" onclick="openFinderContactAi('+sourceIdx+','+state.contactIdx+')" title="AI tahlil va xat" style="'+_fabtn+'background:transparent"><svg width="26" height="26" viewBox="0 0 24 24"><defs><radialGradient id="fai'+sourceIdx+'_'+state.contactIdx+'" cx="50%" cy="40%" r="65%"><stop offset="0%" stop-color="#FFB554"/><stop offset="100%" stop-color="#F57C00"/></radialGradient></defs><circle cx="12" cy="12" r="11" fill="url(#fai'+sourceIdx+'_'+state.contactIdx+')"/><text x="12" y="16" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="11" fill="#fff">Ai</text></svg></button>'+
        (state.contact.email ? '<button type="button" onclick="openFinderContactEmail('+sourceIdx+','+state.contactIdx+')" title="Xat yuborish" style="'+_fabtn+'background:#EFF4FF;color:#3B82F6" onmouseover="this.style.background=\'#3B82F6\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'#EFF4FF\';this.style.color=\'#3B82F6\'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 20.5H7c-3 0-5-1.5-5-5v-7c0-3.5 2-5 5-5h10c3 0 5 1.5 5 5v7c0 3.5-2 5-5 5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 9l-3.13 2.5c-1.03.82-2.72.82-3.75 0L7 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : '')+
        (state.contact.email ? '<button type="button" onclick="openFinderContactSchedule('+sourceIdx+','+state.contactIdx+')" title="Rejalashtirish" style="'+_fabtn+'background:#F3F4F6;color:#6B7280" onmouseover="this.style.background=\'#6B7280\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'#F3F4F6\';this.style.color=\'#6B7280\'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : '')+
        '<button type="button" onclick="deleteFinderContactResult('+sourceIdx+','+state.contactIdx+')" title="O\'chirish" style="'+_fabtn+'background:#FEF3F2;color:#EF4444" onmouseover="this.style.background=\'#EF4444\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'#FEF3F2\';this.style.color=\'#EF4444\'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 5.98c-3.33-.33-6.68-.5-10.02-.5-1.98 0-3.96.1-5.94.3L3 5.98M8.5 4.97l.22-1.31C8.88 2.71 9 2 10.69 2h2.62c1.69 0 1.82.75 1.97 1.67l.22 1.3M18.85 9.14l-.65 10.07C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'+
      '</div></td></tr>';
      rows.push(row);
      if(state.isFinderDetailOpen || state.isFinderAiOpen){
        var detailRec = state.aiRecord || ensureFinderContactInvestorRecord(sourceIdx, state.contactIdx);
        var inlineBlocks = '';
        if(state.isFinderDetailOpen){
          inlineBlocks += renderFinderInlineDetail(r, state.contact, detailRec);
        }
        if(state.isFinderAiOpen){
          inlineBlocks += '<div id="finderAiRowMount" style="padding:.2rem 0 .2rem"></div>';
        }
        rows.push(
          '<tr class="finder-ai-inline-row">'+
            '<td colspan="4" style="padding:0;background:rgba(67,97,238,.03)">'+
              '<div style="padding:.85rem 1rem .35rem">'+inlineBlocks+'</div>'+
            '</td>'+
          '</tr>'
        );
      }
    });
  });
  tb.innerHTML = rows.join('');
  mountInvestorAiWorkspace();
}

function _legacySaveFinderResults_v1(){
  if(!_finderResults.length){ toast('⚠️ Natija yo\'q','error'); return; }
  if(!DB.investorCompanies) DB.investorCompanies = [];
  var added = 0;
  var meta = getCurrentFinderProductMeta();
  (_finderResults || []).forEach(function(item){
    var contacts = getFinderVisibleContacts(item);
    contacts.forEach(function(contact){
      var existing = findFinderContactInvestorRecord(item, contact);
      var isNew = !existing;
      var rec = upsertFinderContactInvestorRecord(existing, item, contact, meta);
      if(rec && isNew) added++;
    });
  });
  toast('✅ '+added+' ta kontakt bazaga saqlandi!');
  renderCurrentFinderTable();
  renderInvestorCompanies();
  renderProducts();
}

// Final override: clearer save result feedback (new vs updated contacts).
function saveFinderResults(){
  if(!_finderResults.length){ toast('⚠️ Natija yo\'q','error'); return; }
  if(!DB.investorCompanies) DB.investorCompanies = [];
  var added = 0;
  var updated = 0;
  var meta = getCurrentFinderProductMeta();
  (_finderResults || []).forEach(function(item){
    var contacts = getFinderVisibleContacts(item);
    contacts.forEach(function(contact){
      var existing = findFinderContactInvestorRecord(item, contact);
      var rec = upsertFinderContactInvestorRecord(existing, item, contact, meta);
      if(!rec) return;
      if(existing) updated++;
      else added++;
    });
  });
  if(added > 0 && updated > 0){
    toast('✅ '+added+' ta yangi kontakt saqlandi, '+updated+' ta kontakt yangilandi!');
  } else if(added > 0){
    toast('✅ '+added+' ta kontakt bazaga saqlandi!');
  } else if(updated > 0){
    toast('✅ Yangi kontakt yo\'q, '+updated+' ta mavjud kontakt yangilandi.');
  } else {
    toast('⚠️ Saqlanadigan kontakt topilmadi','error');
  }
  renderCurrentFinderTable();
  renderInvestorCompanies();
  renderProducts();
}

/* ═══ CSV IMPORT TO FINDER ═══ */
function importFinderCSV(input){
  var file = input.files[0];
  if(!file){ return; }
  var ext = file.name.split('.').pop().toLowerCase();
  if(typeof XLSX === 'undefined'){
    toast('⚠️ XLSX kutubxonasi yuklanmagan','error');
    return;
  }
  var reader = new FileReader();
  reader.onload = function(e){
    try {
      var wb;
      if(ext === 'csv') wb = XLSX.read(e.target.result, {type:'string'});
      else wb = XLSX.read(e.target.result, {type:'array'});
      var sheetNames = wb.SheetNames || [];
      var sheetsParsed = sheetNames.map(function(n){return XLSX.utils.sheet_to_json(wb.Sheets[n], {defval:''});});
      function isContactsSheet(rows){
        if(!rows || !rows.length) return false;
        var keys = Object.keys(rows[0]).map(function(k){return String(k||'').toLowerCase().trim();});
        return keys.indexOf('first name') !== -1 || keys.indexOf('last name') !== -1;
      }
      var contactsIdx = sheetsParsed.findIndex(isContactsSheet);
      if(contactsIdx === -1) contactsIdx = 0;
      var accountsIdx = sheetsParsed.findIndex(function(r,i){return i!==contactsIdx && r && r.length;});
      var firstRows = sheetsParsed[contactsIdx];
      var accountsMap = {};
      if(accountsIdx !== -1){
        var secondRows = sheetsParsed[accountsIdx];
        secondRows.forEach(function(row){
          var keys = Object.keys(row);
          var pick = function(names){
            for(var i=0;i<names.length;i++) for(var j=0;j<keys.length;j++){
              if(keys[j].toLowerCase().trim() === names[i].toLowerCase()){
                var v = row[keys[j]]; if(v!==undefined && v!==null && String(v).trim()) return String(v).trim();
              }
            }
            return '';
          };
          var name = pick(['company name','company','organization name','organization']);
          var site = pick(['website','company website','domain']);
          var siteKey = String(site||'').toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0];
          var nameKey = String(name||'').toLowerCase().trim();
          var info = {
            foundedYear: pick(['founded year','year founded','founded']),
            annualRevenue: pick(['annual revenue','revenue']),
            employees: pick(['# employees','#employees','num employees','employees','employee count']),
            industry: pick(['industry']),
            companyPhone: pick(['company phone','phone']),
            companyLinkedin: pick(['company linkedin url','linkedin url','linkedin']),
            companyCity: pick(['company city','city']),
            companyCountry: pick(['company country','country'])
          };
          if(siteKey) accountsMap['site:'+siteKey] = info;
          if(nameKey) accountsMap['name:'+nameKey] = info;
        });
      }
      firstRows.forEach(function(r){
        var keys = Object.keys(r);
        var siteCol = keys.find(function(k){return k.toLowerCase().trim()==='website'||k.toLowerCase().trim()==='company website';});
        var nameCol = keys.find(function(k){return k.toLowerCase().trim()==='company name'||k.toLowerCase().trim()==='company';});
        var sv = siteCol ? String(r[siteCol]||'').toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0] : '';
        var nv = nameCol ? String(r[nameCol]||'').toLowerCase().trim() : '';
        var info = (sv && accountsMap['site:'+sv]) || (nv && accountsMap['name:'+nv]) || null;
        if(info){
          if(info.foundedYear && !r['Founded Year']) r['Founded Year'] = info.foundedYear;
          if(info.annualRevenue && !r['Annual Revenue']) r['Annual Revenue'] = info.annualRevenue;
          if(info.employees && !r['# Employees']) r['# Employees'] = info.employees;
          if(info.industry && !r['Industry']) r['Industry'] = info.industry;
          if(info.companyPhone && !r['Company Phone']) r['Company Phone'] = info.companyPhone;
          if(info.companyLinkedin && !r['Company Linkedin Url']) r['Company Linkedin Url'] = info.companyLinkedin;
          if(info.companyCity && !r['Company City']) r['Company City'] = info.companyCity;
          if(info.companyCountry && !r['Company Country']) r['Company Country'] = info.companyCountry;
        }
      });
      _parseFinderRows(firstRows);
    } catch(err){
      console.error('Finder import error:', err);
      toast('❌ Import xatosi: '+err.message,'error');
    }
  };
  if(ext === 'csv') reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
  input.value = '';
}

function _parseFinderRows(jsonRows){
  if(!Array.isArray(jsonRows) || !jsonRows.length){ toast('⚠️ Ma\'lumot yo\'q','error'); return; }
  var rawHeaders = Object.keys(jsonRows[0]);
  var headers = rawHeaders.map(function(h){return String(h||'').trim().toLowerCase().replace(/['"]/g,'');});
  var rowsByHeaderIdx = jsonRows.map(function(row){
    return rawHeaders.map(function(h){
      var v = row[h];
      return v==null ? '' : String(v);
    });
  });
  _processFinderHeaderRows(headers, rowsByHeaderIdx);
}

function _parseFinderCSV(csvText){
  var jsonRows = [];
  try {
    var wb = XLSX.read(csvText, {type:'string'});
    jsonRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval:''});
  } catch(e){
    console.error('CSV parse error:', e);
    toast('❌ CSV parse xatosi: '+e.message,'error');
    return;
  }
  _parseFinderRows(jsonRows);
}

function _processFinderHeaderRows(headers, rowsArr){

  // Map Apollo CSV columns to our fields
  var colMap = {
    company: _findCol(headers, ['company','company name','organization name','kompaniya']),
    firstName: _findCol(headers, ['first name','first_name','firstname','ism']),
    lastName: _findCol(headers, ['last name','last_name','lastname','familiya']),
    title: _findCol(headers, ['title','job title','job_title','lavozim']),
    email: _findCol(headers, ['email','email address','corporate email','work email']),
    phone: _findCol(headers, ['corporate phone','work direct phone','mobile phone','company phone','phone','phone number','direct phone','telefon']),
    country: _findCol(headers, ['company country','country','person country','davlat']),
    city: _findCol(headers, ['company city','city','person city','shahar']),
    industry: _findCol(headers, ['industry','sanoat','company industry']),
    website: _findCol(headers, ['website','company website','website url','domain']),
    employees: _findCol(headers, ['# employees','employees','number of employees','company headcount','xodimlar']),
    revenue: _findCol(headers, ['annual revenue','revenue','company revenue']),
    foundedYear: _findCol(headers, ['founded year','year founded','founded','tashkil yil','tpilyil']),
    linkedin: _findCol(headers, ['person linkedin url','company linkedin url','linkedin url','linkedin','linkedin profile']),
    keywords: _findCol(headers, ['keywords','company keywords','seo description'])
  };

  // Get selected product info
  var meta = typeof getCurrentFinderProductMeta === 'function' ? getCurrentFinderProductMeta() : {};

  var results = [];
  var companyGroups = {};

  // Build sets of existing contacts in investor base (skip duplicates)
  var existingEmails = new Set();
  var existingNameKeys = new Set();
  var existingCompanyNames = new Set();
  (DB.investorCompanies||[]).forEach(function(rec){
    if(rec.email) existingEmails.add(String(rec.email).toLowerCase().trim());
    var nk = String(rec.kompaniya||'').toLowerCase().trim() + '|' + String(rec.rahbar||'').toLowerCase().trim();
    if(nk !== '|') existingNameKeys.add(nk);
    if(rec.kompaniya) existingCompanyNames.add(String(rec.kompaniya).toLowerCase().trim());
  });
  var skippedExisting = 0;
  var duplicateCompanies = {};

  for(var i = 0; i < rowsArr.length; i++){
    var cols = rowsArr[i];
    if(!cols || !cols.length) continue;

    var company = _getCol(cols, colMap.company) || '';
    var firstName = _getCol(cols, colMap.firstName) || '';
    var lastName = _getCol(cols, colMap.lastName) || '';
    var fullName = (firstName + ' ' + lastName).trim();
    var title = _getCol(cols, colMap.title) || '';
    var email = _getCol(cols, colMap.email) || '';
    var phone = _getCol(cols, colMap.phone) || '';
    var country = _getCol(cols, colMap.country) || '';
    var city = _getCol(cols, colMap.city) || '';
    var industry = _getCol(cols, colMap.industry) || '';
    var website = _getCol(cols, colMap.website) || '';
    var employees = _getCol(cols, colMap.employees) || '';
    var revenue = _getCol(cols, colMap.revenue) || '';
    var foundedYear = _getCol(cols, colMap.foundedYear) || '';
    var linkedin = _getCol(cols, colMap.linkedin) || '';

    if(!company && !fullName) continue;
    if(company && (company.length > 100 || company.split(/\s+/).length > 8)) continue;

    // Skip if already exists in investor base
    var emailLc = String(email||'').toLowerCase().trim();
    var nameKey = String(company||'').toLowerCase().trim() + '|' + String(fullName||'').toLowerCase().trim();
    var compLc = String(company||'').toLowerCase().trim();
    var isDup = (emailLc && existingEmails.has(emailLc)) || (nameKey !== '|' && existingNameKeys.has(nameKey));
    if(isDup){
      skippedExisting++;
      if(compLc){
        if(!duplicateCompanies[compLc]) duplicateCompanies[compLc] = { name: company, country: country, contacts: [] };
        duplicateCompanies[compLc].contacts.push({ name: fullName, email: email, title: title });
      }
      continue;
    }

    var key = company.toLowerCase().trim();
    if(!companyGroups[key]){
      companyGroups[key] = {
        kompaniya: company,
        name: company,
        davlat: country,
        country: country,
        shahar: city,
        city: city,
        sanoat: industry || (meta.product || ''),
        industry: industry,
        website: website,
        employees: employees,
        revenue: revenue,
        xodimlar: employees,
        daromad: revenue,
        tpilyil: foundedYear,
        telefon: phone,
        linkedin: linkedin,
        source: 'csv-import',
        mahsulot: meta.product || '',
        hsCode: meta.hsCode || '',
        contacts: []
      };
    } else {
      var g = companyGroups[key];
      if(!g.xodimlar && employees) g.xodimlar = employees;
      if(!g.daromad && revenue) g.daromad = revenue;
      if(!g.tpilyil && foundedYear) g.tpilyil = foundedYear;
      if(!g.telefon && phone) g.telefon = phone;
      if(!g.linkedin && linkedin) g.linkedin = linkedin;
      if(!g.website && website) g.website = website;
    }
    if(fullName || email){
      companyGroups[key].contacts.push({
        name: fullName,
        ism: fullName,
        title: title,
        lavozim: title,
        email: email,
        telefon: phone,
        linkedin: linkedin
      });
    }
  }

  // Convert to finder results format
  var imported = Object.values(companyGroups);
  if(!imported.length){ toast('⚠️ CSV dan kompaniya topilmadi','error'); return; }

  // Hide import analysis cards after CSV import
  ['importResults','importEmpty','importDemographicCard','finderImportDetailWrap'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.style.display = 'none';
  });

  // Add to _finderResults
  if(typeof _finderResults === 'undefined') window._finderResults = [];
  imported.forEach(function(item){
    _finderResults.push(item);
  });

  // Show results
  var resultCard = document.getElementById('finderResultCard');
  if(resultCard) resultCard.style.display = 'block';
  var countEl = document.getElementById('finder-result-count');
  if(countEl) countEl.textContent = _finderResults.length;

  if(typeof renderCurrentFinderTable === 'function') renderCurrentFinderTable();

  // Show duplicates banner
  var dups = Object.values(duplicateCompanies);
  renderFinderDuplicatesBanner(dups, skippedExisting);

  var msg = '✅ ' + imported.length + ' ta yangi kompaniya, ' + rowsArr.length + ' ta kontakt CSV dan o\'qildi';
  if(skippedExisting > 0) msg += ' · ⚠️ ' + skippedExisting + ' ta takroriy kontakt o\'tkazildi';
  toast(msg, 'success');
}

function renderFinderDuplicatesBanner(dups, totalSkipped){
  var existing = document.getElementById('finderDuplicatesBanner');
  if(existing) existing.remove();
  if(!dups || !dups.length) return;
  var resultCard = document.getElementById('finderResultCard');
  if(!resultCard) return;
  var html = '<div id="finderDuplicatesBanner" style="margin:10px 0;border:1px solid #FBBF24;background:#FFFBEB;border-radius:12px;overflow:hidden">'+
    '<div onclick="toggleFinderDuplicates()" style="cursor:pointer;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px">'+
      '<div style="display:flex;align-items:center;gap:10px">'+
        '<span style="font-size:1.2rem">⚠️</span>'+
        '<div>'+
          '<div style="font-size:.85rem;font-weight:700;color:#92400E">'+dups.length+' ta takroriy kompaniya</div>'+
          '<div style="font-size:.7rem;color:#A16207">'+totalSkipped+' ta kontakt allaqachon investorlar bazasida bor — qo\'shilmadi</div>'+
        '</div>'+
      '</div>'+
      '<span id="finderDupCaret" style="color:#92400E;font-size:.9rem">▾ Ko\'rsatish</span>'+
    '</div>'+
    '<div id="finderDuplicatesList" style="display:none;max-height:300px;overflow-y:auto;background:#fff;border-top:1px solid #FBBF24">'+
      dups.map(function(d, i){
        return '<div style="padding:10px 16px;border-bottom:1px solid #F3F4F6;font-size:.78rem">'+
          '<div style="font-weight:700;color:#111827">'+(i+1)+'. '+escHtml(d.name||'—')+(d.country ? ' <span style="color:#6B7280;font-weight:400">('+escHtml(d.country)+')</span>' : '')+'</div>'+
          '<div style="font-size:.7rem;color:#6B7280;margin-top:3px">'+
            d.contacts.map(function(c){return escHtml((c.name||'?') + (c.email ? ' — '+c.email : ''));}).join(', ')+
          '</div>'+
        '</div>';
      }).join('')+
    '</div>'+
  '</div>';
  resultCard.insertAdjacentHTML('beforebegin', html);
}

function toggleFinderDuplicates(){
  var list = document.getElementById('finderDuplicatesList');
  var caret = document.getElementById('finderDupCaret');
  if(!list) return;
  var open = list.style.display !== 'none';
  list.style.display = open ? 'none' : 'block';
  if(caret) caret.textContent = open ? '▾ Ko\'rsatish' : '▴ Yashirish';
}
window.toggleFinderDuplicates = toggleFinderDuplicates;

function _csvSplitRow(row){
  var result = [];
  var current = '';
  var inQuote = false;
  for(var i = 0; i < row.length; i++){
    var ch = row[i];
    if(ch === '"'){ inQuote = !inQuote; continue; }
    if(ch === ',' && !inQuote){ result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

function _findCol(headers, names){
  for(var i = 0; i < names.length; i++){
    var idx = headers.indexOf(names[i]);
    if(idx !== -1) return idx;
  }
  // Partial match
  for(var i = 0; i < names.length; i++){
    for(var j = 0; j < headers.length; j++){
      if(headers[j].indexOf(names[i]) !== -1) return j;
    }
  }
  return -1;
}

function _getCol(cols, idx){
  if(idx < 0 || idx >= cols.length) return '';
  return (cols[idx] || '').trim().replace(/^["']|["']$/g, '');
}

function goToAiLetter(idx){
  var comp = _finderResults[idx];
  if(!comp) return;
  var contacts = getFinderVisibleContacts(comp);
  if(!contacts.length){
    toast('⚠️ AI uchun kontakt topilmadi','error');
    return;
  }
  var meta = getCurrentFinderProductMeta();
  contacts.forEach(function(contact){
    var existing = findFinderContactInvestorRecord(comp, contact);
    upsertFinderContactInvestorRecord(existing, comp, contact, meta);
  });
  renderCurrentFinderTable();
  openFinderContactAi(idx, 0);
}

function aiLetterAll(){
  saveFinderResults();
  if(!_finderResults.length){
    toast('⚠️ Natija yo\'q','error');
    return;
  }
  var firstIdx = (_finderResults || []).findIndex(function(item){
    return getFinderVisibleContacts(item).length > 0;
  });
  if(firstIdx < 0){
    toast('⚠️ AI uchun kontakt topilmadi','error');
    return;
  }
  openFinderContactAi(firstIdx, 0);
}

