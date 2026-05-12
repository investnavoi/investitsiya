/* ═══════════════════════════════════════
   M3: COMPANY FINDER
═══════════════════════════════════════ */
var _finderResults = [];
var _finderMode = 'importers';

/* Toggle filter popover panels (Maqsad davlatlar / Eksportyor manbasi) */
window.toggleFinderFilterPanel = function(panelName){
  var wrap = document.getElementById('finderSidebarFilters');
  if(!wrap) return;
  var targetPanel = document.getElementById('finderTargetPopover');
  var sourcePanel = document.getElementById('finderSourceScopeWrap');
  var targetPill = document.querySelector('.finder-pill-btn[data-panel="target"]');
  var sourcePill = document.querySelector('.finder-pill-btn[data-panel="source"]');

  /* Only ONE panel visible at a time (for clean positioning under the clicked pill) */
  var showTarget = false, showSource = false;
  var wasOpen = wrap.style.display !== 'none';
  var currentlyTarget = wasOpen && targetPanel && targetPanel.style.display !== 'none';
  var currentlySource = wasOpen && sourcePanel && sourcePanel.style.display !== 'none';

  if(panelName === 'target'){
    showTarget = !currentlyTarget;
  } else if(panelName === 'source'){
    showSource = !currentlySource;
  }

  if(targetPanel) targetPanel.style.display = showTarget ? '' : 'none';
  if(sourcePanel) sourcePanel.style.display = showSource ? '' : 'none';
  wrap.style.display = (showTarget || showSource) ? '' : 'none';

  if(targetPill) targetPill.classList.toggle('active', !!showTarget);
  if(sourcePill) sourcePill.classList.toggle('active', !!showSource);

  /* Position popover under clicked pill */
  if(showTarget || showSource){
    var activePill = showTarget ? targetPill : sourcePill;
    var activePanel = showTarget ? targetPanel : sourcePanel;
    if(activePill && activePanel && wrap.parentNode){
      var pillRect = activePill.getBoundingClientRect();
      var parentRect = wrap.parentNode.getBoundingClientRect();
      /* Horizontal centering under pill */
      var pillCenter = pillRect.left + pillRect.width/2 - parentRect.left;
      var panelWidth = 420;
      var maxLeft = parentRect.width - panelWidth - 20;
      var left = Math.max(10, Math.min(maxLeft, pillCenter - panelWidth/2));
      activePanel.style.width = panelWidth + 'px';
      activePanel.style.marginLeft = left + 'px';
      /* Vertical: position popover just below the pill (not at bottom of form) */
      var pillBottom = pillRect.bottom - parentRect.top;
      wrap.style.top = (pillBottom + 8) + 'px';
    }
  }
};

/* Update pill counts when filters change */
window.updateFinderPillCounts = function(){
  try{
    var targetChecked = document.querySelectorAll('#finderCountries input[type="checkbox"]:checked').length;
    var targetTotal = document.querySelectorAll('#finderCountries input[type="checkbox"]').length;
    var tPill = document.getElementById('finderTargetPillCount');
    if(tPill && targetTotal > 0) tPill.textContent = targetChecked + '/' + targetTotal;

    var sourceChecked = document.querySelectorAll('#finderSourceContinentChips input[type="checkbox"]:checked, #finderSourceCountriesList input[type="checkbox"]:checked').length;
    var sPill = document.getElementById('finderSourcePillCount');
    if(sPill){
      sPill.textContent = sourceChecked > 0 ? (sourceChecked + ' ta') : 'Barchasi';
    }
  }catch(e){}
};
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
  if(typeof window.updateFinderPillCounts === 'function') window.updateFinderPillCounts();
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
  // Afrika qit'asini chiqarib tashlash — foydalanuvchi tanlamasligi mumkin
  var continents = _finderSourceContinents.slice().filter(function(c){ return c !== 'Afrika'; });
  var countries = _finderSourceCountries.slice();
  var blockedCountries = getFinderBlockedSourceCountries();
  var effectiveCountries = [];
  if(countries.length){
    effectiveCountries = countries.filter(function(country){
      return blockedCountries.indexOf(country) === -1;
    });
  } else {
    continents.forEach(function(cont){
      if(cont === 'Afrika') return; // ikki marta xavfsizlik
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
  /* Visibility controlled by toggleFinderFilterPanel — don't force show */
  syncFinderSourceAgainstTarget();
  var searchEl = document.getElementById('finderSourceSearch');
  var search = searchEl ? searchEl.value.toLowerCase().trim() : '';
  var blockedCountries = getFinderBlockedSourceCountries();
  chipsEl.innerHTML = '';
  var _sourceOpenGroups = window._finderSourceOpenGroups || {};
  window._finderSourceOpenGroups = _sourceOpenGroups;
  Object.keys(FINDER_SOURCE_REGIONS).forEach(function(cont){
    // Afrika qit'asini foydalanuvchi tanlay olmaydi — UI dan olib tashlanadi
    if(cont === 'Afrika') return;
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
  if(typeof window.updateFinderPillCounts === 'function') window.updateFinderPillCounts();
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

// Afrika qit'asini TradeAtlas manba sifatida bloklaymiz — kredit ko'p sarflaydi
function getTradeAtlasAfricanCodeSet(){
  if(window._tradeAtlasAfricanCodeSet) return window._tradeAtlasAfricanCodeSet;
  var set = {};
  (FINDER_SOURCE_REGIONS['Afrika'] || []).forEach(function(name){
    var code = getTradeAtlasCountryCode(name);
    if(code) set[String(code).toUpperCase()] = true;
  });
  window._tradeAtlasAfricanCodeSet = set;
  return set;
}

function filterTradeAtlasAfricanCodes(codes){
  var set = getTradeAtlasAfricanCodeSet();
  return (codes || []).filter(function(c){ return !set[String(c || '').toUpperCase()]; });
}

function isTradeAtlasAfricanCode(code){
  return !!getTradeAtlasAfricanCodeSet()[String(code || '').toUpperCase()];
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
  var _strArr = function(v){ return Array.isArray(v) ? v.slice() : []; };
  var _num = function(v){ return Number(v || 0) || 0; };
  var _str = function(v){ return String(v || '').trim(); };
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
    // Core shipment aggregates
    _tradeAtlasTradeValue: tradeValue,
    _tradeAtlasQuantity: quantity,
    _tradeAtlasQuantityUnit: quantityUnit,
    _tradeAtlasDocCount: _num(firm && firm.doc_count),
    _tradeAtlasCountryCode: _str(firm && firm.firm_country_code),
    _tradeAtlasAddress: _str(firm && firm.firm_address),
    // Identity extras
    _tradeAtlasTaxId: _str(firm && firm.tax_id),
    _tradeAtlasCompanyTypeCode: _str(firm && firm.company_type_code),
    _tradeAtlasFax: _str(firm && firm.fax),
    _tradeAtlasFacebook: _str(firm && firm.facebook),
    _tradeAtlasTwitter: _str(firm && firm.twitter),
    _tradeAtlasInstagram: _str(firm && firm.instagram),
    // Financial breakdown
    _tradeAtlasFobUsd: _num(firm && firm.total_fob_usd),
    _tradeAtlasCifUsd: _num(firm && firm.total_cif_usd),
    _tradeAtlasStatValueUsd: _num(firm && firm.total_statistical_value_usd),
    _tradeAtlasFreightUsd: _num(firm && firm.total_freight_usd),
    _tradeAtlasInsuranceUsd: _num(firm && firm.total_insurance_usd),
    _tradeAtlasAvgUnitPriceUsd: _num(firm && firm.avg_unit_price_usd),
    // Volume breakdown
    _tradeAtlasGrossWeight: _num(firm && firm.total_gross_weight),
    _tradeAtlasNetWeight: _num(firm && firm.total_net_weight),
    _tradeAtlasGrossWeightUnit: _str(firm && firm.gross_weight_unit),
    _tradeAtlasNetWeightUnit: _str(firm && firm.net_weight_unit),
    // Packaging
    _tradeAtlasContainers: _num(firm && firm.total_containers),
    _tradeAtlasPackages: _num(firm && firm.total_packages),
    _tradeAtlasPackageUnit: _str(firm && firm.package_unit),
    _tradeAtlasTeus: _num(firm && firm.total_teus),
    // Counterpart
    _tradeAtlasCounterpartCountries: _strArr(firm && firm.counterpart_countries),
    _tradeAtlasCounterpartCountryCodes: _strArr(firm && firm.counterpart_country_codes),
    _tradeAtlasCounterpartCompanies: _strArr(firm && firm.counterpart_companies),
    // Hamkor firmalar — to'liq aloqali (Variant 4 layout uchun)
    _tradeAtlasCounterpartFirms: Array.isArray(firm && firm.counterpart_firms) ? firm.counterpart_firms.slice() : [],
    // Products
    _tradeAtlasHsCodes: _strArr(firm && firm.hs_codes),
    _tradeAtlasHsDescriptions: _strArr(firm && firm.hs_descriptions),
    _tradeAtlasProductDetails: _strArr(firm && firm.product_details),
    _tradeAtlasBrandNames: _strArr(firm && firm.brand_names),
    _tradeAtlasCountriesOfOrigin: _strArr(firm && firm.countries_of_origin),
    _tradeAtlasConditionsNewUsed: _strArr(firm && firm.conditions_new_used),
    // Logistics
    _tradeAtlasPortsOfDeparture: _strArr(firm && firm.ports_of_departure),
    _tradeAtlasPortsOfArrival: _strArr(firm && firm.ports_of_arrival),
    _tradeAtlasVessels: _strArr(firm && firm.vessels),
    _tradeAtlasIncoterms: _strArr(firm && firm.incoterms),
    _tradeAtlasTransportTypes: _strArr(firm && firm.transport_types),
    _tradeAtlasPaymentTypes: _strArr(firm && firm.payment_types),
    _tradeAtlasRegimes: _strArr(firm && firm.regimes),
    _tradeAtlasFirstArrivalDate: _str(firm && firm.first_arrival_date),
    _tradeAtlasLastArrivalDate: _str(firm && firm.last_arrival_date),
    // Other parties
    _tradeAtlasManufacturingCompanies: _strArr(firm && firm.manufacturing_companies),
    _tradeAtlasTransportCompanies: _strArr(firm && firm.transport_companies),
    _tradeAtlasNotifyParties: _strArr(firm && firm.notify_parties),
    // Shipment examples (up to 5, rich payload)
    _tradeAtlasShipmentExamples: Array.isArray(firm && firm.shipment_examples) ? firm.shipment_examples.slice() : []
  };
}

// 10 daqiqali cache — TradeAtlas count endpoint kundalik 200-limitni yeb qo'ymaslik uchun
var _TA_COUNT_CACHE = window._TA_COUNT_CACHE || {};
window._TA_COUNT_CACHE = _TA_COUNT_CACHE;
var _TA_COUNT_TTL_MS = 10 * 60 * 1000;

function _taCountCacheKey(endpoint, payload){
  try { return endpoint + '|' + JSON.stringify(payload || {}); } catch(_e){ return endpoint + '|' + Math.random(); }
}

async function fetchTradeAtlasCount(endpoint, payload){
  var key = _taCountCacheKey(endpoint, payload);
  var now = Date.now();
  var cached = _TA_COUNT_CACHE[key];
  if(cached && (now - cached.ts) < _TA_COUNT_TTL_MS){
    return cached.value;
  }
  var resp = await fetch(TRADEATLAS_PROXY, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ mode: endpoint === 'firms/count' ? 'firms_count' : 'shipments_count', endpoint: endpoint, payload: payload || {} })
  });
  var data = {};
  try { data = await resp.json(); } catch(_e){}
  if(!resp.ok){ throw new Error((data && data.error) || ('TradeAtlas count error ' + resp.status)); }
  // Rate-limit aniqlanishi — xato data.error ichida kelishi mumkin
  var embeddedErr = data && (data.error || (data.data && data.data.error));
  if(embeddedErr && /Daily Request Limit|limit.*exceed|rate.*limit/i.test(String(embeddedErr))){
    throw new Error('TradeAtlas kunlik limit: ' + embeddedErr);
  }
  var out = (data && data.data) || data || {};
  _TA_COUNT_CACHE[key] = { ts: now, value: out };
  return out;
}

function _extractCountNumber(countData){
  if(!countData || typeof countData !== 'object') return null;
  var candidates = ['count','total','totalCount','firmsCount','firms_count','firmCount','shipmentsCount','shipments_count','shipmentCount','total_entries','totalEntries','importerCount','exporterCount'];
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

async function showTradeAtlasPreSearchConfirm(prod, meta, targetCountries, sourceScope, cacheFlags){
  var hsCode = (typeof getExactImportHsCode === 'function') ? getExactImportHsCode(prod) : (prod && prod.hs_code) || '';
  var targetCodes = (targetCountries || []).map(getTradeAtlasCountryCode).filter(Boolean);
  var sourceCodes = filterTradeAtlasAfricanCodes(((sourceScope && sourceScope.effectiveCountries) || []).map(getTradeAtlasCountryCode).filter(Boolean));
  var dateRange = (typeof getImportAnalysisDateRange === 'function') ? getImportAnalysisDateRange() : { startDate:'', endDate:'' };
  var taFlowType = (meta.mode === 'importers') ? 'IMPORT' : 'EXPORT';
  var taFirmType = (meta.mode === 'importers') ? 'IMPORTER' : 'EXPORTER';
  var isWorldWide = !sourceCodes.length && meta.mode === 'exporters';
  var taCountries;
  if(sourceCodes.length){
    taCountries = sourceCodes.slice();
  } else if(isWorldWide){
    var _worldCodes = [];
    Object.keys(FINDER_SOURCE_REGIONS).forEach(function(cont){
      if(cont === 'Afrika') return; // Afrika bloklangan — kredit tejash
      (FINDER_SOURCE_REGIONS[cont] || []).forEach(function(c){
        var code = getTradeAtlasCountryCode(c);
        if(code && _worldCodes.indexOf(code) === -1) _worldCodes.push(code);
      });
    });
    taCountries = _worldCodes;
  } else {
    taCountries = targetCodes.slice();
  }

  // 5 talik chunk'larga bolamiz — TradeAtlas API cheklovi
  function _chunk5(arr){
    var out = [];
    for(var i = 0; i < arr.length; i += 5) out.push(arr.slice(i, i + 5));
    if(!out.length) out = [[]];
    return out;
  }
  var targetChunks = _chunk5(targetCodes);
  var firmChunks = _chunk5(taCountries);

  function _buildShipmentPayload(targetChunk, exporterCode){
    var p = { countries: targetChunk, flowType: 'IMPORT', firmFilter: [1,2], parameters: [{ HS_CODE: hsCode }] };
    if(exporterCode) p.parameters.push({ EXPORTER_COUNTRY_CODE: exporterCode });
    if(dateRange && dateRange.startDate) p.startDate = dateRange.startDate;
    if(dateRange && dateRange.endDate) p.endDate = dateRange.endDate;
    return p;
  }
  function _buildFirmPayload(chunk){
    var p = { countries: chunk, firmType: taFirmType, flowType: taFlowType, firmFilter: [1,2], parameters: [{ HS_CODE: hsCode }] };
    if(dateRange && dateRange.startDate) p.startDate = dateRange.startDate;
    if(dateRange && dateRange.endDate) p.endDate = dateRange.endDate;
    return p;
  }

  // Shipments count — har manba davlat alohida iteratsiya qilinadi
  // TradeAtlas API'da EXPORTER_COUNTRY_CODE faqat 1 davlat qabul qiladi
  // Cap olib tashlangan — kontinent tanlanganda barcha davlatlar hisoblanadi
  // 200/kun count limit'iga e'tibor: 50+ source bo'lsa, ko'p so'rov yuboriladi
  var shipmentPromises = [];
  var sourcesInCount = [];
  if(sourceCodes.length >= 1){
    sourceCodes.forEach(function(srcCode){
      sourcesInCount.push(srcCode);
      targetChunks.forEach(function(tch){
        shipmentPromises.push(fetchTradeAtlasCount('shipments/count', _buildShipmentPayload(tch, srcCode)));
      });
    });
  } else {
    // Filter yo'q — butun dunyo (Afrikasiz)
    targetChunks.forEach(function(tch){
      shipmentPromises.push(fetchTradeAtlasCount('shipments/count', _buildShipmentPayload(tch, null)));
    });
  }

  // firms/count — agar taCountries 50+ bo'lsa (butun dunyo) skip, aks holda 200/kun limitni yeydi
  var skipFirms = taCountries.length > 50;
  var loading = toastLoading('⏳ TradeAtlas: so\'rov hajmi tekshirilmoqda (0 kredit, '+(shipmentPromises.length+(skipFirms?0:firmChunks.length))+' so\'rov)...');
  var firmsCount = null, shipmentsCount = null, errMsg = '';
  try {
    var firmPromises = skipFirms ? [] : firmChunks.map(function(ch){ return fetchTradeAtlasCount('firms/count', _buildFirmPayload(ch)); });
    var all = await Promise.allSettled([].concat(firmPromises, shipmentPromises));
    var firmResults = all.slice(0, firmPromises.length);
    var shipmentResults = all.slice(firmPromises.length);
    var firmSum = 0, firmAny = false;
    firmResults.forEach(function(r){
      if(r.status === 'fulfilled'){
        var n = _extractCountNumber(r.value);
        if(n != null){ firmSum += Number(n) || 0; firmAny = true; }
      }
    });
    var shipSum = 0, shipAny = false;
    shipmentResults.forEach(function(r){
      if(r.status === 'fulfilled'){
        var n = _extractCountNumber(r.value);
        if(n != null){ shipSum += Number(n) || 0; shipAny = true; }
      }
    });
    if(firmAny) firmsCount = firmSum;
    if(shipAny) shipmentsCount = shipSum;
    if(firmsCount == null && shipmentsCount == null){
      var firstErr = all.find(function(r){ return r.status === 'rejected'; });
      errMsg = (firstErr && firstErr.reason && firstErr.reason.message) || 'Count endpointi javob qaytarmadi';
    }
  } catch(e){ errMsg = e.message; }
  if(loading && loading.parentNode){ clearTimeout(loading._toastTimer); loading.remove(); }

  return await new Promise(function(resolve){
    var selectedApiMode = 'firms'; // default — arzon yo'l
    var forceRefresh = false; // user "Yangilash (kreditli)" bossa true bo'ladi
    var _cacheFlags = cacheFlags || { firms: false, shipments: false };
    function _isCachedForCurrentMode(){
      if(forceRefresh) return false;
      return selectedApiMode === 'shipments' ? !!_cacheFlags.shipments : !!_cacheFlags.firms;
    }
    var firmsTxtValue = firmsCount;
    var firmsEstimated = false;
    if((firmsCount == null || firmsCount === 0) && shipmentsCount){
      firmsTxtValue = Math.max(1, Math.round(shipmentsCount / 10));
      firmsEstimated = true;
    }
    var firmsTxt = firmsTxtValue != null ? (firmsEstimated ? '~' : '') + Number(firmsTxtValue).toLocaleString() : '—';
    var shipTxt = shipmentsCount != null ? Number(shipmentsCount).toLocaleString() : '—';

    function _creditsForMode(m){
      if(m === 'shipments') return shipmentsCount;
      return firmsTxtValue;
    }
    function _creditTxtForMode(m){
      var v = _creditsForMode(m);
      if(v == null) return '~?';
      return '~' + Number(v).toLocaleString();
    }

    var isRateLimit = errMsg && /Daily Request Limit|limit.*exceed|kunlik limit/i.test(errMsg);
    var errBlock = errMsg ? ('<div style="padding:.7rem;border-radius:8px;background:'+(isRateLimit?'rgba(245,158,11,.1)':'rgba(239,35,60,.08)')+';color:'+(isRateLimit?'#92400E':'#991B1B')+';font-size:.75rem;margin-bottom:.8rem;line-height:1.5">⚠️ '+escHtml(errMsg)+(isRateLimit?'<br><b>Tashvishlanmang</b> — <u>Yuklab olish</u> ishlaydi: u alohida <code>/firms/search</code> yoki <code>/shipments/search</code> endpointiga boradi (kredit hisobi mustaqil, 200/kun count cheklovidan boshqa).':'')+'</div>') : '';
    var worldBlock = isWorldWide ? ('<div style="padding:.75rem .85rem;border-radius:10px;background:linear-gradient(135deg,rgba(217,119,6,.12),rgba(239,68,68,.08));border:1px solid rgba(217,119,6,.35);color:#9A3412;font-size:.78rem;margin-bottom:.9rem;font-weight:600">🌍 Manba tanlanmagan — <u>butun dunyo ('+taCountries.length+' davlat)</u> bo\'yicha qidiriladi. Kam kredit sarflash uchun qit\'a yoki davlat tanlang.</div>') : '';

    function _modeToggleHtml(){
      var firmsActive = selectedApiMode === 'firms';
      var shipActive = selectedApiMode === 'shipments';
      return ''+
        '<div style="margin-bottom:1rem">'+
          '<div style="font-size:.62rem;color:#64748B;font-weight:700;letter-spacing:.04em;margin-bottom:.45rem">API REJIM</div>'+
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">'+
            '<button type="button" data-mode="firms" class="taModeBtn" style="text-align:left;padding:.7rem .85rem;border-radius:10px;cursor:pointer;border:'+(firmsActive?'1.5px solid #0F766E':'1.5px solid #E5E7EB')+';background:'+(firmsActive?'rgba(15,118,110,.08)':'#fff')+';transition:all .15s">'+
              '<div style="font-size:.75rem;font-weight:800;color:'+(firmsActive?'#0F766E':'#1a1a2e')+';margin-bottom:2px">🏢 Firmalar (arzon)</div>'+
              '<div style="font-size:.62rem;color:#64748B;line-height:1.35">Faqat kompaniya + aloqa. Hajm/qiymat <u>yo\'q</u>.</div>'+
            '</button>'+
            '<button type="button" data-mode="shipments" class="taModeBtn" style="text-align:left;padding:.7rem .85rem;border-radius:10px;cursor:pointer;border:'+(shipActive?'1.5px solid #4361EE':'1.5px solid #E5E7EB')+';background:'+(shipActive?'rgba(67,97,238,.08)':'#fff')+';transition:all .15s">'+
              '<div style="font-size:.75rem;font-weight:800;color:'+(shipActive?'#4361EE':'#1a1a2e')+';margin-bottom:2px">📦 Shipmentlar (aniq)</div>'+
              '<div style="font-size:.62rem;color:#64748B;line-height:1.35">Hajm + FOB qiymat + davlatlar. Kredit ko\'proq.</div>'+
            '</button>'+
          '</div>'+
        '</div>';
    }

    function _bodyCardsHtml(){
      // Shipments mode'da limit input ko'rinadi (kredit tejash uchun)
      var limitBlock = (selectedApiMode === 'shipments') ?
        '<div style="padding:.75rem .85rem;border-radius:10px;background:linear-gradient(135deg,rgba(67,97,238,.06),rgba(124,58,237,.04));border:1px solid rgba(67,97,238,.2);margin-bottom:1rem">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:.7rem;flex-wrap:wrap">'+
            '<div style="flex:1;min-width:200px">'+
              '<div style="font-size:.7rem;font-weight:700;color:#1E3A8A;margin-bottom:2px">📦 Yuklab olish chegarasi (kredit tejash uchun)</div>'+
              '<div style="font-size:.62rem;color:#475569">Bo\'sh qoldiring = barcha '+shipTxt+' shipmentni yuklab oladi. Aks holda faqat ko\'rsatilgan miqdor.</div>'+
            '</div>'+
            '<div style="display:flex;align-items:center;gap:6px">'+
              '<input id="taPreMaxLimit" type="text" inputmode="numeric" pattern="[0-9]*" placeholder="masalan: 300" autocomplete="off" data-lpignore="true" data-form-type="other" name="ta-limit-search" role="searchbox" readonly onfocus="this.removeAttribute(\'readonly\')" style="width:120px;padding:7px 10px;border:1.5px solid #C7D2FE;border-radius:8px;font-size:.78rem;font-weight:600;color:#14233F;font-family:Menlo,Consolas,monospace;outline:none;background:#fff" oninput="this.value=this.value.replace(/[^0-9]/g,\'\')">'+
              '<span style="font-size:.7rem;color:#475569;font-weight:600">ta</span>'+
            '</div>'+
          '</div>'+
          '<div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap">'+
            ['100','250','500','1000'].map(function(v){
              return '<button type="button" onclick="document.getElementById(\'taPreMaxLimit\').value=\''+v+'\'" style="padding:3px 10px;border:1px solid #E5E7EB;background:#fff;color:#475569;border-radius:6px;cursor:pointer;font-size:.65rem;font-weight:600">'+v+' ta</button>';
            }).join('')+
            '<button type="button" onclick="document.getElementById(\'taPreMaxLimit\').value=\'\'" style="padding:3px 10px;border:1px solid #E5E7EB;background:#fff;color:#475569;border-radius:6px;cursor:pointer;font-size:.65rem;font-weight:600">Barchasi</button>'+
          '</div>'+
        '</div>' : '';
      return ''+
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.7rem;margin-bottom:1rem">'+
          '<div style="padding:.85rem;border-radius:12px;background:rgba(15,118,110,.08);border:1px solid rgba(15,118,110,.25)" title="Bu HS kod uchun TradeAtlas\'da topilgan firmalar soni (eksportyor + importyor)"><div style="font-size:.6rem;color:#115E59;font-weight:700;letter-spacing:.04em">KOMPANIYALAR</div><div style="font-size:1.3rem;font-weight:800;color:#0F766E;margin-top:2px">'+firmsTxt+'</div><div style="font-size:.55rem;color:#115E59;margin-top:2px;opacity:.7">Topilgan firmalar</div></div>'+
          '<div style="padding:.85rem;border-radius:12px;background:rgba(67,97,238,.08);border:1px solid rgba(67,97,238,.2)" title="Belgilangan davlatlar va sanalar oraligida TradeAtlas\'dagi shipment yozuvlari soni"><div style="font-size:.6rem;color:#1E3A8A;font-weight:700;letter-spacing:.04em">SHIPMENTLAR</div><div style="font-size:1.3rem;font-weight:800;color:#4361EE;margin-top:2px">'+shipTxt+'</div><div style="font-size:.55rem;color:#1E3A8A;margin-top:2px;opacity:.7">Yuk tashish yozuvlari</div></div>'+
          '<div style="padding:.85rem;border-radius:12px;background:linear-gradient(135deg,rgba(217,119,6,.12),rgba(245,158,11,.08));border:1px solid rgba(217,119,6,.25)" title="Yuklab olish uchun sarflanadigan TradeAtlas krediti — Firmalar rejimi: 1 firma = 1 kredit; Shipmentlar rejimi: 1 shipment ≈ 1 kredit"><div style="font-size:.6rem;color:#9A3412;font-weight:700;letter-spacing:.04em">TAXMINIY KREDIT</div><div style="font-size:1.3rem;font-weight:800;color:#D97706;margin-top:2px">'+_creditTxtForMode(selectedApiMode)+'</div><div style="font-size:.55rem;color:#9A3412;margin-top:2px;opacity:.7">Yuklab olish narxi</div></div>'+
        '</div>'+
        limitBlock;
    }

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:16px;padding:1.6rem;max-width:560px;width:92%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)';
    var close = function(v){ if(overlay.parentNode) overlay.parentNode.removeChild(overlay); resolve(v); };
    var breakdownState = { loading: false, loaded: false, err: '', rows: [], total: 0 };

    async function _loadBreakdown(){
      if(breakdownState.loading || breakdownState.loaded) return;
      breakdownState.loading = true;
      _renderBox();
      // Breakdown: source tanlangan bo'lsa faqat shu davlatlar; aks holda butun dunyo (Afrikasiz)
      // 200/kun limitni yeb qo'ymaslik uchun max 30 davlat bilan cheklanadi (≈90 so'rov)
      var allSourceCodes = sourceCodes.length ? sourceCodes.slice() : (function(){
        var codes = [];
        Object.keys(FINDER_SOURCE_REGIONS).forEach(function(cont){
          if(cont === 'Afrika') return;
          (FINDER_SOURCE_REGIONS[cont] || []).forEach(function(c){
            var code = getTradeAtlasCountryCode(c);
            if(code && codes.indexOf(code) === -1) codes.push(code);
          });
        });
        return codes;
      })();
      var MAX_BREAKDOWN_CODES = 30;
      var breakdownCodes = allSourceCodes.slice(0, MAX_BREAKDOWN_CODES);
      breakdownState.truncated = allSourceCodes.length > MAX_BREAKDOWN_CODES ? allSourceCodes.length - MAX_BREAKDOWN_CODES : 0;

      // TradeAtlas `countries` parametri max 5 — target'ni 5 talik chunklarga bo'lamiz
      var _targetChunks = [];
      for(var ti=0; ti<targetCodes.length; ti+=5) _targetChunks.push(targetCodes.slice(ti, ti+5));
      if(!_targetChunks.length) _targetChunks = [[]];

      function _buildBreakdownPayload(code, targetChunk){
        var p = { countries: targetChunk.slice(), flowType: 'IMPORT', firmFilter: [1,2], parameters: [{ HS_CODE: hsCode }, { EXPORTER_COUNTRY_CODE: code }] };
        if(dateRange && dateRange.startDate) p.startDate = dateRange.startDate;
        if(dateRange && dateRange.endDate) p.endDate = dateRange.endDate;
        return p;
      }

      async function _countForCode(code){
        var sum = 0, gotAny = false;
        for(var tc=0; tc<_targetChunks.length; tc++){
          try {
            var r = await fetchTradeAtlasCount('shipments/count', _buildBreakdownPayload(code, _targetChunks[tc]));
            var n = _extractCountNumber(r);
            if(n != null){ sum += Number(n) || 0; gotAny = true; }
          } catch(_e){}
        }
        return { code: code, count: sum, ok: gotAny };
      }

      var results = [];
      try {
        var BATCH = 6; // 6 source codes × target chunks parallel
        for(var i=0; i<breakdownCodes.length; i+=BATCH){
          var batch = breakdownCodes.slice(i, i+BATCH);
          var promises = batch.map(function(code){
            return _countForCode(code).catch(function(){ return { code: code, count: 0, err: true }; });
          });
          var settled = await Promise.all(promises);
          settled.forEach(function(r){ if(r.count > 0) results.push(r); });
          breakdownState.rows = results.slice().sort(function(a,b){ return b.count - a.count; });
          breakdownState.total = results.reduce(function(s,r){ return s + r.count; }, 0);
          _renderBox();
        }
      } catch(e){
        breakdownState.err = e && e.message ? e.message : 'Breakdown xatosi';
      }
      breakdownState.loading = false;
      breakdownState.loaded = true;
      _renderBox();
    }

    function _breakdownHtml(){
      if(!breakdownState.loaded && !breakdownState.loading){
        return '<div style="margin-bottom:1rem"><button id="taBreakdownBtn" type="button" style="width:100%;padding:.7rem .95rem;border-radius:10px;border:1.5px dashed #4361EE;background:rgba(67,97,238,.04);color:#4361EE;font-weight:700;cursor:pointer;font-size:.8rem;transition:all .15s">📊 Davlat taqsimoti (kreditsiz)</button></div>';
      }
      var head = '<div style="margin-bottom:1rem;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">'+
        '<div style="padding:.55rem .85rem;background:#F8FAFC;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;justify-content:space-between">'+
          '<div style="font-size:.7rem;font-weight:800;color:#1E3A8A">📊 Davlat taqsimoti'+(breakdownState.loading?' (yuklanyapti...)':'')+'</div>'+
          '<div style="font-size:.65rem;color:#64748B;font-weight:600">'+breakdownState.rows.length+' davlat / jami '+Number(breakdownState.total).toLocaleString()+' shipment</div>'+
        '</div>';
      if(breakdownState.err){
        head += '<div style="padding:.7rem;color:#991B1B;font-size:.72rem">⚠️ '+escHtml(breakdownState.err)+'</div></div>';
        return head;
      }
      if(!breakdownState.rows.length && !breakdownState.loading){
        head += '<div style="padding:.7rem;color:#64748B;font-size:.72rem">Hech qaysi davlatdan shipment topilmadi.</div></div>';
        return head;
      }
      var maxCount = Math.max.apply(null, breakdownState.rows.map(function(r){ return r.count; }).concat([1]));
      var rowsHtml = breakdownState.rows.slice(0, 20).map(function(r){
        var pct = Math.round((r.count / maxCount) * 100);
        var pctTotal = breakdownState.total ? ((r.count / breakdownState.total) * 100).toFixed(1) : '0';
        var flag = _COUNTRY_FLAG_MAP ? (Object.keys(_COUNTRY_FLAG_MAP).find(function(k){ return getTradeAtlasCountryCode(k) === r.code; }) ? _COUNTRY_FLAG_MAP[Object.keys(_COUNTRY_FLAG_MAP).find(function(k){ return getTradeAtlasCountryCode(k) === r.code; })] : '🏳️') : '';
        return '<div style="padding:6px 10px;border-top:1px solid #F1F5F9;display:grid;grid-template-columns:28px 40px 1fr 70px 50px;gap:8px;align-items:center;font-size:.72rem">'+
          '<span>'+flag+'</span>'+
          '<span style="font-weight:700;color:#1a1a2e">'+escHtml(r.code)+'</span>'+
          '<div style="height:8px;background:#F1F5F9;border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#4361EE,#7C3AED);border-radius:4px"></div></div>'+
          '<span style="font-weight:700;color:#1E3A8A;text-align:right">'+Number(r.count).toLocaleString()+'</span>'+
          '<span style="color:#64748B;text-align:right">'+pctTotal+'%</span>'+
        '</div>';
      }).join('');
      head += '<div style="max-height:260px;overflow-y:auto">'+rowsHtml+'</div>';
      if(breakdownState.rows.length > 20){
        head += '<div style="padding:6px 10px;border-top:1px solid #F1F5F9;font-size:.65rem;color:#64748B;text-align:center">Yana '+(breakdownState.rows.length-20)+' ta davlat (top 20 ko\'rsatildi)</div>';
      }
      head += '</div>';
      return head;
    }

    function _renderBox(){
      var targetSummary = targetCodes.slice(0, 5).join(', ') + (targetCodes.length > 5 ? ' (+' + (targetCodes.length-5) + ')' : '');
      var sourceSummary = sourceCodes.length ?
        (sourceCodes.slice(0, 5).join(', ') + (sourceCodes.length > 5 ? ' (+' + (sourceCodes.length-5) + ')' : ''))
        : '<span style="color:#9A3412;font-weight:700">Butun dunyo (Afrikasiz)</span>';
      var cached = _isCachedForCurrentMode();
      var cacheBanner = cached
        ? '<div style="padding:.75rem .85rem;border-radius:10px;background:linear-gradient(135deg,rgba(5,150,105,.12),rgba(6,214,160,.06));border:1.5px solid rgba(5,150,105,.35);color:#065F46;font-size:.78rem;margin-bottom:.9rem;line-height:1.5">💾 <b>Saqlangan natija topildi</b> — bu filtr bo\'yicha avval qidirilgan, Firebase keshida saqlangan. <b>Yuklab olish bosilganda 0 kredit sarflanadi.</b><br><span style="font-size:.7rem;color:#475569">Yangi natija kerak bo\'lsa "Yangilash (kreditli)" tugmasini bosing.</span></div>'
        : '';
      var confirmLabel = cached ? '💾 Cached\'dan ishlatish (0 kredit)' : 'Yuklab olish';
      var refreshBtn = cached ? '<button id="taPreRefresh" style="padding:.6rem 1rem;border-radius:10px;border:1.5px solid #D97706;background:#fff;color:#D97706;font-weight:600;cursor:pointer;font-size:.78rem">🔄 Yangilash (kreditli)</button>' : '';
      box.innerHTML =
        '<div style="display:flex;align-items:center;gap:.7rem;margin-bottom:1rem"><div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#0F766E,#059669);display:flex;align-items:center;justify-content:center;color:#fff"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/><path d="M2 12h20M12 2c2.5 2.8 4 6.2 4 10s-1.5 7.2-4 10c-2.5-2.8-4-6.2-4-10s1.5-7.2 4-10z" stroke="currentColor" stroke-width="1.8"/></svg></div><div><h3 style="margin:0;font-size:1.05rem;color:#1a1a2e">TradeAtlas so\'rov xulosasi</h3><div style="font-size:.7rem;color:#64748B">Count endpointlari (0 kredit)</div></div></div>'+
        cacheBanner +
        '<div style="background:#F8FAFC;border-radius:10px;padding:.85rem;margin-bottom:1rem;font-size:.78rem;color:#475569;line-height:1.55">'+
          '<div style="margin-bottom:.35rem"><strong>📦 Mahsulot:</strong> '+escHtml(prod.name_en||prod.name_uz||'—')+' <span style="color:#64748B">(HS '+escHtml(hsCode||'—')+')</span></div>'+
          '<div style="margin-bottom:.35rem"><strong style="color:#0F766E">🎯 Maqsad davlatlar:</strong> '+escHtml(targetSummary || '—')+' <span style="color:#64748B;font-size:.7rem">(import qiluvchi)</span></div>'+
          '<div><strong style="color:#7C3AED">🌐 Manba davlatlar:</strong> '+sourceSummary+' <span style="color:#64748B;font-size:.7rem">(eksport qiluvchi)</span></div>'+
        '</div>'+
        worldBlock + _modeToggleHtml() + _bodyCardsHtml() + _breakdownHtml() + errBlock +
        '<div style="display:flex;gap:.7rem;justify-content:flex-end;flex-wrap:wrap">'+
          '<button id="taPreCancel" style="padding:.6rem 1.3rem;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#475569;font-weight:600;cursor:pointer;font-size:.82rem">Bekor qilish</button>'+
          refreshBtn +
          '<button id="taPreConfirm" style="padding:.6rem 1.3rem;border-radius:10px;border:none;background:linear-gradient(135deg,'+(cached?'#059669,#06D6A0':'#0F766E,#059669')+');color:#fff;font-weight:600;cursor:pointer;font-size:.82rem">'+confirmLabel+'</button>'+
        '</div>';
      var btns = box.querySelectorAll('.taModeBtn');
      for(var bi=0; bi<btns.length; bi++){
        (function(btn){
          btn.onclick = function(){
            selectedApiMode = btn.getAttribute('data-mode') || 'firms';
            forceRefresh = false; // mode o'zgarishi bilan refresh holati reset
            _renderBox();
          };
        })(btns[bi]);
      }
      var bdBtn = document.getElementById('taBreakdownBtn');
      if(bdBtn) bdBtn.onclick = function(){ _loadBreakdown(); };
      var rfBtn = document.getElementById('taPreRefresh');
      if(rfBtn) rfBtn.onclick = function(){ forceRefresh = true; _renderBox(); };
      document.getElementById('taPreCancel').onclick = function(){ close({confirmed:false, apiMode:selectedApiMode, forceRefresh:forceRefresh}); };
      document.getElementById('taPreConfirm').onclick = function(){
        var limitEl = document.getElementById('taPreMaxLimit');
        var maxLim = limitEl ? parseInt(String(limitEl.value || '').replace(/\D/g,''), 10) : 0;
        if(!Number.isFinite(maxLim) || maxLim < 1) maxLim = 0; // 0 = no limit
        close({confirmed:true, apiMode:selectedApiMode, forceRefresh:forceRefresh, maxLimit:maxLim});
      };
    }
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    _renderBox();
    overlay.addEventListener('click', function(e){ if(e.target === overlay) close({confirmed:false, apiMode:selectedApiMode}); });
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
  // /statistics/usage javobi: { account: { endpoint: { ActivitySummary: { current, limit, notes } } } }
  if(!data) return null;
  var out = { limit: null, used: null, remaining: null, notes: '', endpointPath: '', allEndpoints: [], raw: data };
  var root = data.usage || data.data || data;
  if(typeof root !== 'object') return out;

  // Har joyda (current, limit) juftliklarini yig'ib olamiz
  var tuples = [];
  function walkPair(obj, path){
    if(!obj || typeof obj !== 'object') return;
    if(typeof obj.limit === 'number' && typeof obj.current === 'number'){
      tuples.push({ limit: obj.limit, current: obj.current, notes: String(obj.notes || ''), path: path });
    }
    Object.keys(obj).forEach(function(k){
      if(obj[k] && typeof obj[k] === 'object') walkPair(obj[k], path ? (path + ' / ' + k) : k);
    });
  }
  walkPair(root, '');

  if(tuples.length){
    // Asosiy paid quota = limit eng kattasi
    tuples.sort(function(a, b){ return b.limit - a.limit; });
    var best = tuples[0];
    out.limit = best.limit;
    out.used = best.current;
    out.remaining = Math.max(0, best.limit - best.current);
    out.notes = best.notes;
    out.endpointPath = best.path;
    out.allEndpoints = tuples;
    return out;
  }

  // Fallback — eski mantiq + 'current' ham tanish
  function walkAny(obj){
    if(!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach(function(k){
      var v = obj[k];
      var kl = k.toLowerCase();
      if(typeof v === 'number'){
        if(kl.indexOf('remain') !== -1 && out.remaining == null) out.remaining = v;
        else if(kl === 'limit' || kl.indexOf('limit') !== -1) { if(out.limit == null) out.limit = v; }
        else if(kl.indexOf('used') !== -1 && out.used == null) out.used = v;
        else if(kl === 'current' && out.used == null) out.used = v;
      } else if(typeof v === 'object'){ walkAny(v); }
    });
  }
  walkAny(root);
  if(out.remaining == null && typeof out.limit === 'number' && typeof out.used === 'number'){
    out.remaining = Math.max(0, out.limit - out.used);
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
  var errLower = errMsg.toLowerCase();
  // "No data found" — bu xato emas, oddiy bo'sh natija. Bo'sh massiv qaytaramiz.
  if(/no data found|no results|empty/i.test(errMsg)){
    return { data: [], items: [], firms: [], count: 0, total: 0 };
  }
  if(!resp.ok || (errMsg && errLower !== 'null' && errLower !== 'undefined')){
    if(/credit limit is exceeded/i.test(errMsg)){
      throw new Error('TradeAtlas trial limiti tugagan. TradeAtlas hisobidan limitni yangilash kerak.');
    }
    throw new Error(errMsg || ('TradeAtlas error ' + resp.status));
  }
  return data || {};
}

// ═══ ShipmentResponse[] → Firm aggregat ═══
// TradeAtlas Swagger v1 spec: /shipments/search xom shipment yozuvlari qaytaradi.
// Bizga firma kartochkalari kerak — shu sabab biz shu yerda group qilamiz.
function _aggregateShipmentsToFirms(shipments, mode){
  var groups = {};
  var emptyMark = function(v){ return v && String(v).trim() && String(v).trim() !== '.'; };
  (shipments || []).forEach(function(s){
    if(!s || typeof s !== 'object') return;
    var name, country, countryCode, address, cityState, email, tel, web, linkedin, fax, taxId, companyTypeCode, facebook, twitter, instagram;
    var counterName, counterCountry, counterCountryCode, counterEmail, counterTel, counterWeb, counterLinkedin, counterCity;
    if(mode === 'importers'){
      // Importyor firmalarni topamiz (ular natijada ko'rinadi)
      name = s.importerName; country = s.importerCountry; countryCode = s.importerCountryCode;
      address = s.importerAddress; cityState = s.importerCityState;
      email = s.importerEmail; tel = s.importerTel; web = s.importerWeb;
      linkedin = s.importerLinkedin; fax = s.importerFax; taxId = s.importerTaxId;
      companyTypeCode = s.importerCompanyTypeCode; facebook = s.importerFacebook;
      twitter = s.importerTwitter; instagram = s.importerInstagram;
      // Counterpart eksportyor
      counterName = s.exporterName; counterCountry = s.exporterCountry; counterCountryCode = s.exporterCountryCode;
      counterEmail = s.exporterEmail; counterTel = s.exporterTel; counterWeb = s.exporterWeb;
      counterLinkedin = s.exporterLinkedin; counterCity = s.exporterCityState;
    } else {
      name = s.exporterName; country = s.exporterCountry; countryCode = s.exporterCountryCode;
      address = s.exporterAddress; cityState = s.exporterCityState;
      email = s.exporterEmail; tel = s.exporterTel; web = s.exporterWeb;
      linkedin = s.exporterLinkedin; fax = s.exporterFax; taxId = s.exporterTaxId;
      companyTypeCode = s.exporterCompanyTypeCode; facebook = s.exporterFacebook;
      twitter = s.exporterTwitter; instagram = s.exporterInstagram;
      counterName = s.importerName; counterCountry = s.importerCountry; counterCountryCode = s.importerCountryCode;
      counterEmail = s.importerEmail; counterTel = s.importerTel; counterWeb = s.importerWeb;
      counterLinkedin = s.importerLinkedin; counterCity = s.importerCityState;
    }
    if(!emptyMark(name)) return;
    var key = String(name).trim().toLowerCase() + '|' + String(countryCode||'').toLowerCase();
    if(!groups[key]){
      groups[key] = {
        firm_name: name, firm_country: country || '', firm_country_code: countryCode || '',
        firm_address: emptyMark(address) ? address : '', city_state: emptyMark(cityState) ? cityState : '',
        e_mail: emptyMark(email) ? email : '', tel: emptyMark(tel) ? tel : '',
        web: emptyMark(web) ? web : '', linkedin: emptyMark(linkedin) ? linkedin : '',
        fax: emptyMark(fax) ? fax : '', tax_id: emptyMark(taxId) ? taxId : '',
        company_type_code: companyTypeCode || '', facebook: emptyMark(facebook) ? facebook : '',
        twitter: emptyMark(twitter) ? twitter : '', instagram: emptyMark(instagram) ? instagram : '',
        doc_count: 0,
        total_trade_value_usd: 0, total_fob_usd: 0, total_cif_usd: 0,
        total_quantity: 0, quantity_unit: '',
        total_gross_weight: 0, total_net_weight: 0,
        gross_weight_unit: '', net_weight_unit: '',
        total_containers: 0, total_packages: 0, total_teus: 0,
        avg_unit_price_usd: 0,
        _hsCodesSet: {}, _productsSet: {}, _brandsSet: {}, _originSet: {},
        last_arrival_date: '',
        _counterparts: {}
      };
    }
    var g = groups[key];
    g.doc_count++;
    var fob = Number(s.usdFob || s.fobValue || 0) || 0;
    var cif = Number(s.usdCif || s.cifValue || 0) || 0;
    var qty = Number(s.quantity || 0) || 0;
    g.total_fob_usd += fob;
    g.total_cif_usd += cif;
    g.total_trade_value_usd += (fob || cif);
    g.total_quantity += qty;
    if(!g.quantity_unit && s.quantityUnit) g.quantity_unit = s.quantityUnit;
    g.total_gross_weight += Number(s.grossWeight || 0) || 0;
    g.total_net_weight += Number(s.netWeight || 0) || 0;
    if(!g.gross_weight_unit && s.grossWeightUnit) g.gross_weight_unit = s.grossWeightUnit;
    if(!g.net_weight_unit && s.netWeightUnit) g.net_weight_unit = s.netWeightUnit;
    g.total_containers += Number(s.containerCount || 0) || 0;
    g.total_packages += Number(s.packageAmount || 0) || 0;
    g.total_teus += Number(s.totalTeus || 0) || 0;
    if(emptyMark(s.hsCode)) g._hsCodesSet[s.hsCode] = true;
    if(emptyMark(s.productDetails)) g._productsSet[s.productDetails] = true;
    if(emptyMark(s.brandName)) g._brandsSet[s.brandName] = true;
    if(emptyMark(s.countryOfOrigin)) g._originSet[s.countryOfOrigin] = true;
    if(s.arrivalDate && s.arrivalDate > g.last_arrival_date) g.last_arrival_date = s.arrivalDate;

    // Counterpart aggregation
    if(emptyMark(counterName)){
      var cpKey = String(counterName).trim().toLowerCase();
      if(!g._counterparts[cpKey]){
        g._counterparts[cpKey] = {
          name: counterName, country: counterCountry || '', countryCode: counterCountryCode || '',
          email: emptyMark(counterEmail) ? counterEmail : '',
          tel: emptyMark(counterTel) ? counterTel : '',
          web: emptyMark(counterWeb) ? counterWeb : '',
          linkedin: emptyMark(counterLinkedin) ? counterLinkedin : '',
          cityState: emptyMark(counterCity) ? counterCity : '',
          docCount: 0, totalQty: 0, totalValue: 0, lastDate: ''
        };
      }
      var cp = g._counterparts[cpKey];
      cp.docCount++;
      cp.totalQty += qty;
      cp.totalValue += (fob || cif);
      if(s.arrivalDate && s.arrivalDate > cp.lastDate) cp.lastDate = s.arrivalDate;
    }
  });
  // Avg unit price hisoblash + Set → Array
  return Object.keys(groups).map(function(key){
    var g = groups[key];
    var hs_codes = Object.keys(g._hsCodesSet);
    var product_details = Object.keys(g._productsSet);
    var brand_names = Object.keys(g._brandsSet);
    var countries_of_origin = Object.keys(g._originSet);
    if(g.total_quantity > 0 && g.total_trade_value_usd > 0){
      g.avg_unit_price_usd = g.total_trade_value_usd / g.total_quantity;
    }
    var counterpart_firms = Object.keys(g._counterparts).map(function(k){ return g._counterparts[k]; });
    var counterpart_countries = [];
    var counterpart_country_codes = [];
    var counterpart_companies = [];
    counterpart_firms.forEach(function(cp){
      if(cp.country && counterpart_countries.indexOf(cp.country) === -1) counterpart_countries.push(cp.country);
      if(cp.countryCode && counterpart_country_codes.indexOf(cp.countryCode) === -1) counterpart_country_codes.push(cp.countryCode);
      if(cp.name && counterpart_companies.indexOf(cp.name) === -1) counterpart_companies.push(cp.name);
    });
    return {
      firm_name: g.firm_name, firm_country: g.firm_country, firm_country_code: g.firm_country_code,
      firm_address: g.firm_address, city_state: g.city_state,
      e_mail: g.e_mail, tel: g.tel, web: g.web, linkedin: g.linkedin,
      fax: g.fax, tax_id: g.tax_id, company_type_code: g.company_type_code,
      facebook: g.facebook, twitter: g.twitter, instagram: g.instagram,
      doc_count: g.doc_count,
      total_trade_value_usd: g.total_trade_value_usd,
      total_fob_usd: g.total_fob_usd, total_cif_usd: g.total_cif_usd,
      total_quantity: g.total_quantity, quantity_unit: g.quantity_unit,
      total_gross_weight: g.total_gross_weight, total_net_weight: g.total_net_weight,
      gross_weight_unit: g.gross_weight_unit, net_weight_unit: g.net_weight_unit,
      total_containers: g.total_containers, total_packages: g.total_packages, total_teus: g.total_teus,
      avg_unit_price_usd: g.avg_unit_price_usd,
      hs_codes: hs_codes, product_details: product_details,
      brand_names: brand_names, countries_of_origin: countries_of_origin,
      counterpart_firms: counterpart_firms,
      counterpart_countries: counterpart_countries,
      counterpart_country_codes: counterpart_country_codes,
      counterpart_companies: counterpart_companies,
      last_arrival_date: g.last_arrival_date
    };
  });
}

async function tradeAtlasFinderSearch(prod, meta, targetCountries, sourceScope){
  var isFirmNameSearch = !!(prod && prod._firmNameSearch && prod._firmName);
  var hsCode = isFirmNameSearch ? '' : getExactImportHsCode(prod);
  if(!isFirmNameSearch && !hsCode) throw new Error('TradeAtlas uchun mahsulot HS kodi yoki firma nomi topilmadi');
  var targetCodes = (targetCountries || []).map(getTradeAtlasCountryCode).filter(Boolean);
  if(!targetCodes.length) throw new Error('TradeAtlas uchun maqsad davlat kodi topilmadi');
  var sourceCodes = filterTradeAtlasAfricanCodes(((sourceScope && sourceScope.effectiveCountries) || []).map(getTradeAtlasCountryCode).filter(Boolean));
  var dateRange = getImportAnalysisDateRange();
  // ═══ Swagger v1 spec'ga ko'ra: shipments/search faqat IMPORT yo'nalishi va countries=target qabul qiladi ═══
  // Source davlat filter → parameters: [{EXPORTER_COUNTRY_CODE: src}]
  var allSourceCountries = sourceCodes.length ? sourceCodes.slice() : [''];
  // Target countries — max 5 ta (Swagger limit)
  var targetChunks = [];
  for(var ti = 0; ti < targetCodes.length; ti += 5){
    targetChunks.push(targetCodes.slice(ti, ti + 5));
  }
  if(!targetChunks.length) targetChunks = [targetCodes];
  // size 100..10000 (Swagger limit), default 1000
  var userMaxLimit = Number(window._taMaxLimit) || 0;
  var size = userMaxLimit > 0 ? Math.max(100, Math.min(10000, userMaxLimit)) : 1000;
  console.log('[ShipmentsSearch] target chunks:', targetChunks.length, 'sources:', allSourceCountries.length, 'size:', size);
  var allShipments = [];
  var stopAll = false;
  for(var srcIdx = 0; srcIdx < allSourceCountries.length && !stopAll; srcIdx++){
    var srcCode = allSourceCountries[srcIdx];
    for(var tcIdx = 0; tcIdx < targetChunks.length && !stopAll; tcIdx++){
      var tChunk = targetChunks[tcIdx];
      var _params = isFirmNameSearch
        ? [{ EXPORTER_NAME: prod._firmName }]
        : [{ HS_CODE: hsCode }];
      if(srcCode){ _params.push({ EXPORTER_COUNTRY_CODE: srcCode }); }
      // Swagger ShipmentSearchRequest: countries (req), parameters (req), flowType, size, startDate, endDate, firmFilter
      var payload = {
        endpoint: 'shipments/search',
        accountId: (window.TRADEATLAS_ACCOUNT_ID || (DB.settings && DB.settings.tradeAtlasAccountId) || 'investnavoi.uz'),
        countries: tChunk,
        parameters: _params,
        flowType: 'IMPORT',
        firmFilter: [1,2],
        size: size,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      try {
        var data = await tradeAtlasRequestJson(payload);
        var arr = Array.isArray(data) ? data : [];
        console.log('[ShipmentsSearch] target['+tChunk.join(',')+'] source['+(srcCode||'world')+']:', arr.length, 'shipments');
        for(var ai = 0; ai < arr.length; ai++) allShipments.push(arr[ai]);
        if(userMaxLimit > 0 && allShipments.length >= userMaxLimit){
          allShipments = allShipments.slice(0, userMaxLimit);
          stopAll = true;
          break;
        }
      } catch(reqErr){
        console.warn('[ShipmentsSearch] request error:', reqErr && reqErr.message);
      }
    }
  }
  console.log('[ShipmentsSearch] Total raw shipments:', allShipments.length);
  // Aggregat: shipments → firms (mode bo'yicha eksportyor yoki importyor tomon)
  var aggregated = _aggregateShipmentsToFirms(allShipments, meta.mode);
  console.log('[ShipmentsSearch] Aggregated firms:', aggregated.length);
  // mapTradeAtlasFirmToFinderResult orqali finder result formatiga
  var found = [];
  aggregated.forEach(function(firm){
    if(meta.mode === 'exporters'){
      var firmCode = tradeAtlasFirmCountryCode(firm);
      if(firmCode && isTradeAtlasAfricanCode(firmCode)) return;
    }
    var item = mapTradeAtlasFirmToFinderResult(firm, meta, prod);
    if(!item || !String(item.kompaniya || '').trim()) return;
    apolloUpsertFinderItem(found, item, meta);
  });
  console.log('[ShipmentsSearch] FINAL firms after mapping:', found.length);
  // ═══ Shipment-level explode: har firma counterpart_firms array bo'yicha alohida rowlarga ajraladi ═══
  // Maqsad: TradeAtlas saytidagi kabi har juftlik (eksportyor + importyor) alohida ko'rinadi
  var exploded = [];
  found.forEach(function(item){
    var counterparts = Array.isArray(item._tradeAtlasCounterpartFirms) ? item._tradeAtlasCounterpartFirms : [];
    if(!counterparts.length){
      // Counterpart yo'q bo'lsa, asl row qoladi
      exploded.push(item);
      return;
    }
    // Har counterpart uchun yangi row yaratamiz, asl item ma'lumotlarini saqlaymiz
    counterparts.forEach(function(cp, cpIdx){
      var clone = Object.assign({}, item);
      // Counterpart ma'lumotlarini bu row uchun aniq aggregate qilamiz
      clone.id = String(item.id || '') + '_cp' + cpIdx;
      clone._tradeAtlasQuantity = Number((cp && cp.totalQty) || 0) || item._tradeAtlasQuantity;
      clone._tradeAtlasTradeValue = Number((cp && cp.totalValue) || 0) || item._tradeAtlasTradeValue;
      clone._tradeAtlasDocCount = Number((cp && cp.docCount) || 0) || item._tradeAtlasDocCount;
      clone._tradeAtlasLastArrivalDate = String((cp && cp.lastDate) || '') || item._tradeAtlasLastArrivalDate;
      // Faqat ushbu counterpart'ni ko'rsatamiz
      clone._tradeAtlasCounterpartFirms = [cp];
      // Counterpart davlatini saqlash
      clone._tradeAtlasCounterpartCountries = cp && cp.country ? [cp.country] : (item._tradeAtlasCounterpartCountries || []);
      exploded.push(clone);
    });
  });
  console.log('[ShipmentsSearch] After explode by counterpart:', exploded.length);
  return exploded.filter(finderResultIsRenderable).sort(function(a,b){
    return (Number(b._tradeAtlasTradeValue || 0) - Number(a._tradeAtlasTradeValue || 0)) || ((b.score || 0) - (a.score || 0));
  });
}

// ═══ TradeAtlas firm-search snapshot cache (kreditni tejash uchun Firebase'da saqlanadi) ═══
function _buildTaSnapshotId(prod, hsCode, targetCodes, sourceCodes, dateRange, apiMode){
  var targets = (targetCodes || []).slice().sort().join(',');
  var sources = (sourceCodes || []).slice().sort().join(',');
  var startD = (dateRange && dateRange.startDate) ? dateRange.startDate : '';
  var endD = (dateRange && dateRange.endDate) ? dateRange.endDate : '';
  var raw = ['tafirm_v1', String((prod && prod.id) || 'na'), String(hsCode || 'na'), apiMode || 'firms', 't=' + targets, 's=' + (sources || 'world'), 'd=' + startD + '_' + endD].join('|');
  return raw.replace(/[^a-zA-Z0-9_=,|\-]/g, '_');
}

function _getTaSnapshot(id){
  return (DB.taFirmSnapshots || []).find(function(s){ return String(s.id) === String(id); }) || null;
}

async function _saveTaSnapshot(snapshot){
  if(!snapshot || !snapshot.id || !Array.isArray(snapshot.results) || !snapshot.results.length) return;
  if(typeof upsertDbRecord === 'function') upsertDbRecord('taFirmSnapshots', snapshot);
  else {
    if(!Array.isArray(DB.taFirmSnapshots)) DB.taFirmSnapshots = [];
    var idx = DB.taFirmSnapshots.findIndex(function(s){ return String(s.id) === String(snapshot.id); });
    if(idx >= 0) DB.taFirmSnapshots[idx] = snapshot; else DB.taFirmSnapshots.push(snapshot);
  }
  if(typeof fbSave === 'function'){
    try { await fbSave('taFirmSnapshots', snapshot); } catch(_e){ console.warn('TA snapshot save fail:', _e && _e.message); }
  }
  if(typeof setLocalCollectionBackup === 'function'){
    try { setLocalCollectionBackup('taFirmSnapshots', DB.taFirmSnapshots); } catch(_e){}
  }
}

// ═══ /firms/search orqali kompaniyalarni olish (Swagger v1 spec) ═══
// Spec'ga ko'ra firms/search aggregat firmalar qaytaradi.
// Source/target filter: countries=target, parameters=[{EXPORTER_COUNTRY_CODE: src}]
async function tradeAtlasFirmsOnlySearch(prod, meta, targetCountries, sourceScope){
  var hsCode = getExactImportHsCode(prod);
  if(!hsCode) throw new Error('TradeAtlas uchun mahsulot HS kodi topilmadi');
  var targetCodes = (targetCountries || []).map(getTradeAtlasCountryCode).filter(Boolean);
  if(!targetCodes.length) throw new Error('TradeAtlas uchun maqsad davlat kodi topilmadi');
  var sourceCodes = filterTradeAtlasAfricanCodes(((sourceScope && sourceScope.effectiveCountries) || []).map(getTradeAtlasCountryCode).filter(Boolean));
  var dateRange = getImportAnalysisDateRange();

  // Source davlatlar: tanlangan yoki bo'sh (butun dunyo, Swagger ALL ham qabul qiladi)
  // EXPORTER_COUNTRY_CODE filter faqat 1 davlat — har birini alohida iter
  var sourcesToIter = sourceCodes.length ? sourceCodes.slice() : [''];

  async function _searchOneRole(roleMeta, countries){
    var found = [];
    // countries — target tomon (max 5)
    var chunks = [];
    for(var i = 0; i < countries.length; i += 5){
      chunks.push(countries.slice(i, i + 5));
    }
    if(!chunks.length) chunks = [[]];
    var firmType = roleMeta.mode === 'importers' ? 'IMPORTER' : 'EXPORTER';
    // flowType har doim IMPORT (countries=target perspective)
    var flowType = 'IMPORT';

    for(var ch = 0; ch < chunks.length; ch++){
      var chunkCountries = chunks[ch];
      for(var sIdx = 0; sIdx < sourcesToIter.length; sIdx++){
        var srcCode = sourcesToIter[sIdx];
        for(var page = 1; page <= 20; page++){
          var _params = [{ HS_CODE: hsCode }];
          if(srcCode){ _params.push({ EXPORTER_COUNTRY_CODE: srcCode }); }
          var payload = {
            endpoint: 'firms/search',
            accountId: (window.TRADEATLAS_ACCOUNT_ID || (DB.settings && DB.settings.tradeAtlasAccountId) || 'investnavoi.uz'),
            countries: chunkCountries,
            hsCode: hsCode,
            mode: roleMeta.mode,
            page: page,
            firmType: firmType,
            flowType: flowType,
            firmFilter: [1, 2],
            parameters: _params
          };
          if(dateRange && dateRange.startDate) payload.startDate = dateRange.startDate;
          if(dateRange && dateRange.endDate) payload.endDate = dateRange.endDate;
          var data;
          try { data = await tradeAtlasRequestJson(payload); }
          catch(reqErr){
            console.warn('[FirmsOnlySearch] req err:', reqErr && reqErr.message);
            break;
          }
          var firms = tradeAtlasNormalizeArray(data);
          if(!firms.length) break;
          var beforeCount = found.length;
          firms.forEach(function(firm){
            if(roleMeta.mode === 'exporters'){
              var firmCode = tradeAtlasFirmCountryCode(firm);
              if(firmCode && isTradeAtlasAfricanCode(firmCode)) return;
            }
            var item = mapTradeAtlasFirmToFinderResult(firm, roleMeta, prod);
            if(!item || !String(item.kompaniya || '').trim()) return;
            apolloUpsertFinderItem(found, item, roleMeta);
          });
          console.log('[FirmsOnlySearch]', roleMeta.mode, 'target['+chunkCountries.join(',')+'] src['+(srcCode||'world')+'] page', page, 'firms:', firms.length, 'total:', found.length);
          if(found.length === beforeCount && page > 1) break;
          if(firms.length < 100) break;
        }
      }
    }
    return found;
  }

  // Original loop'ni qaytarish uchun yopib qo'yamiz — pastda eski kod bilan moslash
  var _legacyExitMarker = true;
  if(_legacyExitMarker){
    var _foundResults = await _searchOneRole(meta, targetCodes);
    return _foundResults.filter(finderResultIsRenderable).sort(function(a,b){
      return (Number(b._tradeAtlasTradeValue || 0) - Number(a._tradeAtlasTradeValue || 0)) || ((b.score || 0) - (a.score || 0));
    });
  }

  // ═══ Eski kod (ishlatilmaydi, _legacyExitMarker bilan o'tkazib yuboriladi) ═══
  async function _searchOneRoleOld(roleMeta, countries){
    var found = [];
    var chunks = [];
    for(var i = 0; i < countries.length; i += 5){
      chunks.push(countries.slice(i, i + 5));
    }
    if(!chunks.length) chunks = [[]];
    var firmType = roleMeta.mode === 'importers' ? 'IMPORTER' : 'EXPORTER';
    var flowType = roleMeta.mode === 'importers' ? 'IMPORT' : 'EXPORT';

    for(var ch = 0; ch < chunks.length; ch++){
      var chunkCountries = chunks[ch];
      for(var page = 1; page <= 20; page++){
        var payload = {
          endpoint: 'firms/search',
          accountId: (window.TRADEATLAS_ACCOUNT_ID || (DB.settings && DB.settings.tradeAtlasAccountId) || 'investnavoi.uz'),
          countries: chunkCountries,
          hsCode: hsCode,
          mode: roleMeta.mode,
          page: page,
          size: 100,
          firmType: firmType,
          flowType: flowType,
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
          // Eksportyor tomoni uchun Afrika filtrlash
          if(roleMeta.mode === 'exporters'){
            var firmCode = tradeAtlasFirmCountryCode(firm);
            if(firmCode && isTradeAtlasAfricanCode(firmCode)) return;
          }
          var item = mapTradeAtlasFirmToFinderResult(firm, roleMeta, prod);
          if(!item || !String(item.kompaniya || '').trim()) return;
          apolloUpsertFinderItem(found, item, roleMeta);
        });
        if(found.length === beforeCount) break;
        if(firms.length < 50) break;
      }
    }
    return found;
  }

  // Ikkala tomonni parallel qidiramiz: eksportyor + importyor
  var sides = await Promise.all([
    _searchOneRole({ mode: 'exporters' }, exporterCountries).catch(function(e){ console.warn('Eksportyor qidiruv xatosi:', e && e.message); return []; }),
    _searchOneRole({ mode: 'importers' }, importerCountries).catch(function(e){ console.warn('Importyor qidiruv xatosi:', e && e.message); return []; })
  ]);
  var combined = (sides[0] || []).concat(sides[1] || []);

  return combined.filter(finderResultIsRenderable).sort(function(a,b){
    return (Number(b._tradeAtlasTradeValue || 0) - Number(a._tradeAtlasTradeValue || 0)) || ((b.score || 0) - (a.score || 0));
  });
}

// TradeAtlas natijasini Apollo orqali boyitish: organization → people → enrichment (email unlock)
// Tek bir TradeAtlas firma uchun: DB → Apollo → Gemini priority bilan lead topadi
window.findContactsForFinderItem = async function(sourceIdx){
  var item = (_finderResults || [])[sourceIdx];
  if(!item || !item.kompaniya){
    if(typeof toast === 'function') toast('Kompaniya topilmadi','error');
    return;
  }
  var btn = document.getElementById('findLeadBtn-' + sourceIdx);
  if(btn){
    btn.disabled = true;
    btn.textContent = '⏳ Qidirilmoqda...';
    btn.style.opacity = '.7';
  }
  // Mahsulot va meta'ni qaytarib olamiz (global bo'lmasa fallback)
  var prod = window._currentFinderProduct || null;
  if(!prod){
    var prodEl = document.getElementById('finder-product');
    var prodId = prodEl ? prodEl.value : '';
    prod = (DB.products || []).find(function(p){ return String(p.id) === String(prodId); }) || null;
  }
  var meta = { mode: String(item.finderMode || 'exporters').toLowerCase() };
  var foundSource = '';
  try {
    // 0-qadam: Investor bazadan tekshirish
    var dbKey = apolloCompanyKey(item.kompaniya);
    if(dbKey){
      var dbRec = (DB.investorCompanies || []).find(function(rec){
        if(!rec || !rec.kompaniya) return false;
        if(!String(rec.email || '').trim() && !String(rec.rahbar || '').trim()) return false;
        return apolloCompanyKey(rec.kompaniya) === dbKey;
      });
      if(dbRec){
        if(!item.email && dbRec.email) item.email = dbRec.email;
        if(!item.rahbar && dbRec.rahbar) item.rahbar = dbRec.rahbar;
        if(!item.lavozim && dbRec.lavozim) item.lavozim = dbRec.lavozim;
        if(!item.telefon && dbRec.telefon) item.telefon = dbRec.telefon;
        if(!item.linkedin && dbRec.linkedin) item.linkedin = dbRec.linkedin;
        if(!item.website && dbRec.website) item.website = dbRec.website;
        foundSource = 'DB';
      }
    }
    // 1-qadam: Gemini (Apollo subscription tugagan)
    if(!foundSource && typeof callGemini === 'function'){
      if(btn){ btn.textContent = '✨ Gemini qidirmoqda...'; }
      await geminiEnrichTradeAtlasItem(item, prod, meta);
      if(String(item.email || '').trim() || String(item.rahbar || '').trim()){
        foundSource = 'Gemini';
      }
    }
  } catch(e){
    console.error('[findContactsForFinderItem] error:', e && e.message);
    if(typeof toast === 'function') toast('Xatolik: ' + (e && e.message || ''), 'error');
  }
  if(foundSource){
    if(typeof toast === 'function'){
      var label = foundSource === 'DB' ? '🗄️ DB' : foundSource === 'Apollo' ? '🅰️ Apollo' : '✨ Gemini';
      toast('✅ Lead topildi: ' + label + ' — ' + item.kompaniya, 'success');
    }
  } else {
    if(typeof toast === 'function') toast('⚠️ Lead topilmadi: ' + item.kompaniya, 'error');
    if(btn){
      btn.disabled = false;
      btn.textContent = '🔍 Lead topish';
      btn.style.opacity = '1';
    }
  }
  // Jadvalni qayta render qilamiz
  if(typeof renderCurrentFinderTable === 'function') renderCurrentFinderTable();
  else if(typeof renderFinderTable === 'function') renderFinderTable(_finderResults);
};

// Gemini fallback — Apollo'da topilmagan kompaniya kontaktlarini qidiradi
async function geminiEnrichTradeAtlasItem(item, prod, meta){
  if(!item || !item.kompaniya) return item;
  if(typeof callGemini !== 'function') return item;
  // Allaqachon kontakt bor bo'lsa qaytamiz
  if(String(item.email || '').trim() && String(item.rahbar || '').trim()) return item;
  var compName = String(item.kompaniya || '').trim();
  var country = String(item.davlat || '').trim();
  var website = String(item.website || '').trim();
  var sectorHint = (prod && (prod.name_en || prod.name_uz)) || '';
  var roleHint = meta && meta.mode === 'importers' ? 'importer (buyer)' : 'exporter (seller)';
  // Prompt — FAQAT real, publicly verifiable kontaktlar. Yolg'on/generatsiya qilingan ma'lumot YO'Q.
  var prompt = 'You are a B2B contact research assistant. Find ONLY real, publicly verifiable contact info. Return ONLY valid JSON.\n\n'+
    'Company: ' + compName + '\n' +
    'Country: ' + (country || 'unknown') + '\n' +
    (website ? 'Website: ' + website + '\n' : '') +
    'Industry: ' + sectorHint + '\n' +
    'Role: ' + roleHint + '\n\n' +
    'STRICT RULES:\n' +
    '1. ONLY include contacts of REAL PEOPLE you actually know about (verifiable from corporate website, official press, LinkedIn, news articles).\n' +
    '2. Every contact MUST have a real full name (first name + last name) of an actual person.\n' +
    '3. NEVER generate role-based fake contacts like "Sales Department", "Sales Manager", "info@", "sales@", "contact@".\n' +
    '4. NEVER invent emails, phone numbers, or names. NO guessing.\n' +
    '5. If you don\'t actually know a real person who works there — return {"found": false, "contacts": []}.\n' +
    '6. Quality over quantity — better to return ZERO contacts than fake ones.\n' +
    '7. company_email/company_phone — only if PUBLICLY known (from official website), otherwise leave empty.\n\n' +
    'Return JSON:\n' +
    '{\n' +
    '  "found": true/false,\n' +
    '  "contacts": [\n' +
    '    {\n' +
    '      "name": "Real Full Name (first + last)",\n' +
    '      "title": "Real job title",\n' +
    '      "email": "real-email@company-domain.com",\n' +
    '      "telefon": "+real phone",\n' +
    '      "linkedin": "https://linkedin.com/in/..."\n' +
    '    }\n' +
    '  ],\n' +
    '  "company_email": "real info email if publicly known",\n' +
    '  "company_phone": "real phone if publicly known",\n' +
    '  "company_website": "real official site",\n' +
    '  "industry": "sector",\n' +
    '  "city": "headquarter city"\n' +
    '}\n\n' +
    'If you cannot find verified real people — return {"found": false, "contacts": []}.';
  try {
    // Google Search grounding orqali real web qidiruv (LinkedIn, sayt sahifalari)
    // Tools bilan responseMimeType birga ishlamaydi — JSON parse manually qilamiz
    var resp;
    try {
      resp = await callGemini({
        contents: [{role:'user', parts:[{text: prompt}]}],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
      });
    } catch(searchErr){
      // Google search failed — tools'siz fallback (faqat training data)
      console.warn('[Gemini lead] Google search failed, fallback:', searchErr.message);
      resp = await callGemini({
        contents: [{role:'user', parts:[{text: prompt}]}],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048, responseMimeType: 'application/json' }
      });
    }
    var raw = '';
    if(resp && resp.candidates && resp.candidates[0]){
      var cand = resp.candidates[0];
      if(cand.content && cand.content.parts){
        // Bir nechta parts bo'lishi mumkin (text + grounding)
        for(var pi=0; pi<cand.content.parts.length; pi++){
          var pp = cand.content.parts[pi];
          if(pp && pp.text) raw += String(pp.text);
        }
        raw = raw.trim();
      }
    }
    if(!raw) return item;
    // JSON parse — markdown bo'lsa olib tashlash
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    // JSON ichidan first { ... } ni topib parse qilamiz
    var firstBrace = raw.indexOf('{');
    var lastBrace = raw.lastIndexOf('}');
    if(firstBrace !== -1 && lastBrace > firstBrace){
      raw = raw.slice(firstBrace, lastBrace + 1);
    }
    var data;
    try { data = JSON.parse(raw); } catch(_e){ return item; }
    if(!data || data.found === false) return item;
    // STRICT validation — faqat real odam, rol-asosli yolg'on kontaktlar rad qilinadi
    var emailRe = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    var urlRe = /^https?:\/\//i;
    var blacklistDomains = ['example.com','test.com','example.org','domain.com','company.com','email.com'];
    // Rol-asosli ismlar (real odam emas) — rad qilinadi
    var fakeNamePatterns = /^(sales|export|import|info|contact|customer|general|main|office|admin|hr|support|service|inquiry|department|team)\b/i;
    // Rol-asosli email prefikslari (haqiqiy odam emas)
    var fakeEmailPrefixes = ['sales','info','contact','admin','support','office','hr','service','inquiry','help','customer','general','main','export','import','team','marketing','press','media','noreply','no-reply'];
    function isValidContact(c){
      if(!c) return false;
      var nm = String(c.name || '').trim();
      var em = String(c.email || '').trim().toLowerCase();
      // 1. Ism — real odam (kamida 2 so'z, har biri ≥2 harf)
      if(!nm || nm.length < 4) return false;
      var nameWords = nm.split(/\s+/).filter(function(w){ return w.length >= 2; });
      if(nameWords.length < 2) return false;
      // Rol-asosli ism rad qilinadi
      if(fakeNamePatterns.test(nm)) return false;
      // 2. Email MAJBURIY va real bo'lishi kerak (rol-asosli email rad qilinadi)
      if(!em || !emailRe.test(em)) return false;
      var emParts = em.split('@');
      var emPrefix = emParts[0] || '';
      var emDomain = emParts[1] || '';
      if(blacklistDomains.indexOf(emDomain) !== -1) return false;
      if(fakeEmailPrefixes.indexOf(emPrefix) !== -1) return false;
      return true;
    }
    // Item'ni boyitish (faqat valid email va kontakt)
    if(!item.email && data.company_email && emailRe.test(String(data.company_email).trim())){
      item.email = String(data.company_email).trim();
    }
    if(!item.telefon && data.company_phone) item.telefon = String(data.company_phone).trim();
    if(!item.website && data.company_website && urlRe.test(String(data.company_website).trim())){
      item.website = String(data.company_website).trim();
    }
    if(!item.shahar && data.city) item.shahar = String(data.city).trim();
    if(!item.soha && data.industry) item.soha = String(data.industry).trim();
    var newContacts = Array.isArray(data.contacts) ? data.contacts.filter(isValidContact) : [];
    if(newContacts.length){
      apolloEnsureContactBuckets(item);
      newContacts.forEach(function(c){
        var contact = {
          name: String(c.name || '').trim(),
          ism: String(c.name || '').trim(),
          title: String(c.title || '').trim(),
          email: String(c.email || '').trim(),
          telefon: String(c.telefon || '').trim(),
          linkedin: String(c.linkedin || '').trim(),
          website: String(item.website || '').trim(),
          source: 'Gemini',
          _placeholder: false
        };
        if(typeof apolloMergeContactCandidate === 'function'){
          apolloMergeContactCandidate(item, contact);
        } else {
          if(!Array.isArray(item.contacts)) item.contacts = [];
          item.contacts.push(contact);
          if(!Array.isArray(item._contactCandidates)) item._contactCandidates = [];
          item._contactCandidates.push(contact);
        }
        // Asosiy contact'ni item'ga ham yozish
        if(!item.rahbar && contact.name) item.rahbar = contact.name;
        if(!item.lavozim && contact.title) item.lavozim = contact.title;
        if(!item.email && contact.email) item.email = contact.email;
        if(!item.telefon && contact.telefon) item.telefon = contact.telefon;
        if(!item.linkedin && contact.linkedin) item.linkedin = contact.linkedin;
      });
      if(typeof apolloApplyCompanyContacts === 'function'){
        apolloApplyCompanyContacts(item);
      }
    }
    // Fallback YO'Q — agar Gemini real kontakt qaytarmasa, hech narsa qo'shmaymiz.
    // Yolg'on rol-asosli ma'lumot (sales@, info@) ishlatilmaydi.
    item._geminiEnriched = true;
    return item;
  } catch(e){
    console.warn('[Gemini enrichment] '+compName+' error:', e && e.message);
    return item;
  }
}

async function apolloEnrichTradeAtlasItem(item, apolloKey, prod, meta){
  if(!item || !item.kompaniya) return item;
  function getDomain(url){
    try {
      var s = String(url || '').trim();
      if(!s) return '';
      if(!/^https?:\/\//i.test(s)) s = 'https://' + s;
      return new URL(s).hostname.replace(/^www\./i,'').trim();
    } catch(_e){ return ''; }
  }
  var domain = getDomain(item.website);

  // 1-qadam: Apollo organization search — Apollo dashboard'idek katta korpus
  // Apollo UI search top 50+ natija ko'rsatadi, biz ham keng qidiramiz
  function _buildOrgReq(opts){
    var req = {
      search_type: 'organization',
      page: 1,
      per_page: 100, // Apollo dashboard'idek keng
      api_key: apolloKey,
      q_organization_name: opts.query
    };
    if(opts.domain){ req.organization_domains = [opts.domain]; }
    if(opts.country){ req.organization_locations = [opts.country]; }
    return req;
  }
  var orgs = [];
  var seenIds = {};
  function _mergeOrgs(arr){
    (arr || []).forEach(function(o){ if(o && o.id && !seenIds[o.id]){ seenIds[o.id] = true; orgs.push(o); } });
  }
  // Strategy 1: original name + davlat
  try {
    var d1 = await apolloRequestJson(_buildOrgReq({ query: item.kompaniya, domain: domain, country: item.davlat }));
    _mergeOrgs(normalizeApolloArray(d1, ['organizations','accounts','companies']));
    console.log('[Apollo org] s1 (name+davlat): total candidates so far:', orgs.length);
  } catch(_e){}
  // Strategy 2: original name without country
  try {
    var d2 = await apolloRequestJson(_buildOrgReq({ query: item.kompaniya, domain: domain }));
    _mergeOrgs(normalizeApolloArray(d2, ['organizations','accounts','companies']));
    console.log('[Apollo org] s2 (name only): total candidates so far:', orgs.length);
  } catch(_e){}
  // Strategy 3: cleaned name (remove suffixes like "CO LTD.", "Ltd.", "Inc")
  var cleanedName = String(item.kompaniya || '')
    .replace(/[,.]/g,' ')
    .replace(/\b(co|company|corp|corporation|ltd|llc|inc|group|holding|holdings|limited|plc|sa|ag|gmbh|pte|pty)\b/gi,'')
    .replace(/\s+/g,' ')
    .trim();
  if(cleanedName && cleanedName.toLowerCase() !== String(item.kompaniya||'').toLowerCase().trim()){
    try {
      var d3 = await apolloRequestJson(_buildOrgReq({ query: cleanedName }));
      _mergeOrgs(normalizeApolloArray(d3, ['organizations','accounts','companies']));
      console.log('[Apollo org] s3 (cleaned "'+cleanedName+'"): total candidates so far:', orgs.length);
    } catch(_e){}
  }
  if(!orgs.length){
    console.log('[Apollo org] Hech qanday natija — Gemini fallback');
    return item;
  }
  // Eng yaxshi mos kelishi: name match + davlat + xodimlar soni + headcount (Apollo confidence)
  var _kompKey = apolloNormalizeText(item.kompaniya || '');
  var _davlatKey = apolloNormalizeText(item.davlat || '');
  var bestOrg = orgs[0];
  var bestScore = -1;
  var scoredOrgs = [];
  orgs.forEach(function(o){
    var oNameKey = apolloNormalizeText((o && o.name) || '');
    var oCountryKey = apolloNormalizeText((o && (o.country || o.primary_country || (o.primary_location && o.primary_location.country))) || '');
    var employeeCount = Number((o && (o.estimated_num_employees || o.num_employees)) || 0) || 0;
    var orgRevenue = Number((o && (o.organization_revenue || o.annual_revenue)) || 0) || 0;
    var score = 0;
    // 1. Nom o'xshashlik — exact match dominant
    if(oNameKey === _kompKey) score += 200;
    else if(oNameKey.indexOf(_kompKey) === 0) score += 80;
    else if(_kompKey.indexOf(oNameKey) === 0) score += 70;
    else if(oNameKey.indexOf(_kompKey) !== -1 || _kompKey.indexOf(oNameKey) !== -1) score += 30;
    // So'z bo'yicha taqqoslash
    var kompWords = _kompKey.split(' ').filter(function(w){ return w.length > 1; });
    var oWords = oNameKey.split(' ');
    var commonWords = kompWords.filter(function(w){ return oWords.indexOf(w) !== -1; }).length;
    score += commonWords * 5;
    // 2. Davlat bonus
    if(_davlatKey && oCountryKey === _davlatKey) score += 25;
    else if(_davlatKey && oCountryKey && (oCountryKey.indexOf(_davlatKey) !== -1 || _davlatKey.indexOf(oCountryKey) !== -1)) score += 10;
    // 3. Xodimlar soni — kattaroq kompaniya odatda "asosiy" hisoblanadi
    // (10+ xodim: +5, 50+: +10, 200+: +15, 1000+: +20)
    if(employeeCount >= 1000) score += 20;
    else if(employeeCount >= 200) score += 15;
    else if(employeeCount >= 50) score += 10;
    else if(employeeCount >= 10) score += 5;
    // 4. Daromad bo'lsa (yirik kompaniya signali)
    if(orgRevenue > 1000000) score += 5;
    scoredOrgs.push({ org: o, score: score, employees: employeeCount, country: oCountryKey });
    if(score > bestScore){ bestScore = score; bestOrg = o; }
  });
  // Tie-breaking: agar bir nechta orgda eng yuqori score teng bo'lsa, ko'proq xodimi bori g'olib
  var topScoreOrgs = scoredOrgs.filter(function(s){ return s.score === bestScore; });
  if(topScoreOrgs.length > 1){
    topScoreOrgs.sort(function(a,b){ return b.employees - a.employees; });
    bestOrg = topScoreOrgs[0].org;
    console.log('[Apollo org] Tie-break by employees:', topScoreOrgs.map(function(s){ return s.org.name + ' (' + s.employees + ' emp)'; }).join(' | '));
  }
  var org = bestOrg;
  var orgId = String((org && org.id) || '').trim();
  // Top 10 ni log qilish (debugging uchun)
  scoredOrgs.sort(function(a,b){
    if(b.score !== a.score) return b.score - a.score;
    return (b.employees||0) - (a.employees||0);
  });
  // Window'ga saqlash — console'da `_lastApolloOrgs` deb yozib ko'rish mumkin
  window._lastApolloOrgs = orgs;
  window._lastApolloScoredOrgs = scoredOrgs;
  window._lastApolloPicked = org;
  console.log('[Apollo org] picked:', org && org.name, '(country:', org && (org.country || org.primary_country), 'score:', bestScore, ', emp:', (org && (org.estimated_num_employees||0))+')');
  console.log('[Apollo org] TOP 10 → console\'da `_lastApolloScoredOrgs` yozib ko\'ring');
  console.table((scoredOrgs.slice(0,10) || []).map(function(s,i){
    return {
      rank: i+1,
      name: (s.org && s.org.name) || '',
      country: s.country || '',
      score: s.score,
      employees: s.employees,
      id: (s.org && s.org.id) || ''
    };
  }));
  if(!orgId) return item;
  // ═══ Quality guard: agar eng yuqori score 60 dan kichik bo'lsa — bu noto'g'ri match ═══
  // Faqat partial-word match (commonWords * 5) bo'lsa, kompaniya boshqa ekanini bildiradi
  // Apollo'da real exact match bo'lmasa, qaytarmaymiz (Gemini fallback ishlaydi)
  if(bestScore < 60){
    console.warn('[Apollo org] Mos kompaniya topilmadi (best score:', bestScore, ' — exact name match yo\'q). Gemini fallback uchun chiqamiz.');
    return item; // Bu Apollo natijasi ishonchsiz — Gemini sinab ko'rsin
  }

  // Apollo ma'lumotlari bilan item'ni boyitish
  item._orgId = orgId;
  item.website = item.website || apolloAbsoluteUrl(org.website_url || org.website || '');
  item.shahar = item.shahar || org.city || '';
  item.soha = item.soha || org.industry || '';
  item.xodimlar = item.xodimlar || Number(org.estimated_num_employees || 0) || 0;
  item.daromad = item.daromad || org.organization_revenue_printed || org.annual_revenue_printed || '';
  item.tpilyil = item.tpilyil || org.founded_year || '';
  item.description = item.description || org.short_description || '';

  // 2-qadam: People search — avval decision makers, keyin kengroq qidirish
  var titles = ['CEO','Founder','Owner','President','Managing Director','Sales Director','Export Manager','Procurement Manager','Purchasing Manager','Director','Manager','VP','Vice President','Head'];
  var peopleReq = {
    search_type: 'people',
    page: 1,
    per_page: 25,
    api_key: apolloKey,
    organization_ids: [orgId],
    person_titles: titles
  };
  var peopleData;
  try { peopleData = await apolloRequestJson(peopleReq); } catch(_e){ return item; }
  var persons = normalizeApolloArray(peopleData, ['people','contacts']);
  // Fallback: titles bilan 0 odam topilsa, title filter'siz qaytadan
  if(!persons.length){
    console.log('[Apollo people] titles bilan 0 → title filter olib tashlaymiz');
    try {
      var fallbackData = await apolloRequestJson({
        search_type: 'people',
        page: 1,
        per_page: 25,
        api_key: apolloKey,
        organization_ids: [orgId]
      });
      persons = normalizeApolloArray(fallbackData, ['people','contacts']);
    } catch(_e){ console.warn('[Apollo people] fallback err:', _e && _e.message); }
  }
  console.log('[Apollo people]', persons.length, 'persons for org', orgId);
  if(!persons.length) return item;
  var allContacts = persons.map(function(p){ return apolloPersonToContact(p, p.organization || org); }).filter(Boolean);
  var direct = allContacts.filter(finderContactHasEmail);
  var hintOnly = allContacts.filter(function(c){ return !finderContactHasEmail(c) && c.hasEmailHint; });

  // 3-qadam: Email + to'liq ism unlock (people_enrichment) — top 5 kandidat uchun parallel
  // Apollo /people/match endpoint id orqali aniq ma'lumotni qaytaradi (full name + email + tel)
  if(hintOnly.length){
    var topCandidates = hintOnly.slice(0, 5); // top 5 priority kandidatlar
    var enrichPromises = topCandidates.map(function(candidate){
      // Faqat person.id orqali enrich qilamiz — organization_name yo'q,
      // Apollo aniq shu personni qaytaradi (org_match'ni o'zgartirmaslik uchun)
      return apolloRequestJson({
        search_type: 'people_enrichment',
        api_key: apolloKey,
        id: candidate.personId || '',
        reveal_personal_emails: true
      }).then(function(enrichData){
        var enrichedPerson = enrichData && enrichData.person;
        if(!enrichedPerson) return null;
        var enriched = apolloPersonToContact(enrichedPerson, enrichedPerson.organization || org);
        // Apollo to'liq ism qaytarsa (obfuscated emas) — ishlatamiz
        if(enrichedPerson.last_name && !enrichedPerson.last_name_obfuscated){
          enriched.name = String((enrichedPerson.first_name||'')+' '+(enrichedPerson.last_name||'')).trim();
        }
        return enriched;
      }).catch(function(_e){
        console.warn('[Apollo enrich] person error:', candidate.personId, _e && _e.message);
        return null;
      });
    });
    var enrichedList;
    try { enrichedList = await Promise.all(enrichPromises); }
    catch(_e){ enrichedList = []; }
    (enrichedList || []).forEach(function(enriched){
      if(!enriched) return;
      // Email bor bo'lsa — direct'ga; yo'q bo'lsa, lekin to'liq ism kelgan bo'lsa hintOnly'ni yangilaymiz
      if(finderContactHasEmail(enriched)){
        // Eski hintOnly entry'ni almashtirish (personId bo'yicha)
        var idx = direct.findIndex(function(d){ return d.personId === enriched.personId; });
        if(idx < 0) direct.push(enriched);
      } else if(enriched.name){
        // To'liq ism keldi, lekin email yo'q — hintOnly'da yangilaymiz
        var hIdx = hintOnly.findIndex(function(h){ return h.personId === enriched.personId; });
        if(hIdx >= 0 && enriched.name && enriched.name.indexOf('*') === -1){
          hintOnly[hIdx].name = enriched.name;
          hintOnly[hIdx].title = enriched.title || hintOnly[hIdx].title;
          hintOnly[hIdx].linkedin = enriched.linkedin || hintOnly[hIdx].linkedin;
        }
      }
    });
    console.log('[Apollo enrich] direct emails after unlock:', direct.length, 'hintOnly:', hintOnly.length);
  }

  var finalContacts = direct.concat(allContacts.filter(function(c){ return !finderContactHasEmail(c) && !direct.some(function(d){ return d.personId === c.personId; }); }));
  if(finalContacts.length){
    item._contactCandidates = finalContacts;
    var lead = finalContacts.filter(finderContactHasEmail)[0] || finalContacts[0];
    if(lead){
      var secondary = finalContacts.filter(function(c){ return c !== lead; })[0];
      item.contacts = secondary ? [lead, secondary] : [lead];
      item.rahbar = lead.name || item.rahbar || '';
      item.lavozim = lead.title || item.lavozim || '';
      item.email = lead.email || item.email || '';
      item.telefon = lead.telefon || item.telefon || '';
      item.photoUrl = lead.photoUrl || item.photoUrl || '';
      item.linkedin = lead.linkedin || item.linkedin || '';
      item._personId = lead.personId || item._personId || '';
    }
  }
  item.manba = (item.manba || 'TradeAtlas') + ' + Apollo';
  return item;
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

// Import-analysis snapshot'dan BARCHA eksportyor partnerlarni finder result'iga qo'shish (kreditsiz)
// Faqat product/HS bo'yicha match qilinadi, target country va exclusion ishlatilmaydi (foydalanuvchi BARCHA partnerni ko'rishni xohlaydi)
function _enrichFinderFromImportSnapshots(prod, targetCountries, excludeNamesSet){
  var out = [];
  var snapshots = (DB.importSnapshots || []);
  if(!snapshots.length || !prod) {
    console.log('[Enrichment] importSnapshots bo\'sh yoki prod yo\'q', {snapLen: snapshots.length, prod: !!prod});
    return out;
  }
  var prodId = String(prod.id || '');
  var hsCode = getExactImportHsCode(prod);
  console.log('[Enrichment] Filter:', {prodId, hsCode, snapshots: snapshots.length});
  var matchedSnapshots = 0, matchedCountries = 0;
  // Aggregate row'larni (World/jami) chiqarmaslik — comtrade snapshot bo'lsa partnerCode=0 ko'rsatadi
  function isAggregateRow(name, partnerCode){
    if(partnerCode === 0 || partnerCode === '0') return true;
    var k = String(name || '').trim().toLowerCase();
    if(!k) return true;
    if(k === 'world' || k === 'jahon' || k === 'all' || k === 'global') return true;
    return false;
  }
  snapshots.forEach(function(snap){
    if(!snap || !Array.isArray(snap.countries)) return;
    var snapProdId = String(snap.productId || '');
    var snapHs = String(snap.hsCode || '');
    var snapSourceKey = String(snap.sourceKey || '').toLowerCase();
    // FAQAT TradeAtlas snapshot'larini ishlatamiz (comtrade/wits country-level emas)
    if(snapSourceKey && snapSourceKey.indexOf('tradeatlas') === -1) return;
    // Mahsulot mos kelishi shart — productId yoki hsCode bo'yicha
    var prodMatch = false;
    if(prodId && snapProdId && snapProdId === prodId) prodMatch = true;
    else if(hsCode && snapHs && (snapHs === hsCode || snapHs.indexOf(hsCode) === 0 || hsCode.indexOf(snapHs) === 0)) prodMatch = true;
    if(!prodMatch) return;
    matchedSnapshots++;
    snap.countries.forEach(function(country){
      var cName = String(country.n || country.name || '').trim();
      var cCode = String(country.c || country.code || '').trim().toUpperCase();
      if(!cName && !cCode) return;
      // Target country filter olib tashlandi — barcha countries dan partner chiqaramiz
      matchedCountries++;
      var products = country.pr || country.products || [];
      products.forEach(function(p){
        var partnerName = String(p.partner || p.partnerDesc || '').trim();
        if(!partnerName) return;
        // Faqat aggregate row (World/Jahon, partnerCode=0) skip
        if(isAggregateRow(partnerName, p.partnerCode)) return;
        if(excludeNamesSet && excludeNamesSet[partnerName.toLowerCase().trim()]) return;
        var lastDate = p.period ? (String(p.period) + '-12-31') : '';
        // Importyor counterpart — agar TradeAtlas firma'da importer kompaniya nomi mavjud bo'lsa, shuni ishlatamiz
        var importerCompName = String(p.importerCompany || '').trim();
        var counterpartImporter = importerCompName || cName;  // fallback: davlat nomi
        out.push({
          id: 'is_' + Date.now() + '_' + Math.random().toString(36).slice(2,7) + '_' + out.length,
          kompaniya: partnerName,
          davlat: String(p.exporterCountry || '').trim(),
          shahar: '',
          email: String(p.companyEmail || '').trim(),
          telefon: String(p.companyPhone || '').trim(),
          linkedin: '',
          website: String(p.companyWebsite || '').trim(),
          rahbar: '', lavozim: '',
          soha: (prod && (prod.name_en || prod.name_uz)) || '',
          mahsulotNomi: (prod && (prod.name_en || prod.name_uz)) || '',
          mahsulotHs: snapHs || hsCode || '',
          productId: prodId || snapProdId || '',
          manba: 'TradeAtlas',
          finderMode: 'exporters',
          score: 70,
          _tradeAtlasTradeValue: Number(p.value || 0),
          _tradeAtlasQuantity: Number(p.weight || p.quantity || 0),
          _tradeAtlasDocCount: Number(p.docCount || 0),
          _tradeAtlasLastArrivalDate: lastDate,
          // _tradeAtlasCounterpartFirms — importer xaridorni HAMKOR DAVLAT ustunida ko'rsatish uchun
          _tradeAtlasCounterpartFirms: [{
            name: counterpartImporter,
            country: cName,
            countryCode: cCode,
            totalValue: Number(p.value || 0),
            totalQty: Number(p.weight || 0),
            docCount: Number(p.docCount || 0),
            lastDate: lastDate
          }],
          _tradeAtlasCounterpartCountries: cName ? [cName] : [],
          _partners: counterpartImporter ? [{
            kompaniya: counterpartImporter, davlat: cName,
            role: 'importer',
            totalValue: Number(p.value || 0), totalQty: Number(p.weight || 0),
            docCount: Number(p.docCount || 0), lastDate: lastDate
          }] : []
        });
      });
    });
  });
  console.log('[Enrichment] Result:', {matchedSnapshots, matchedCountries, partnerCount: out.length});
  // Dedupe by company name (eng yirik qiymatni saqlaymiz)
  var seen = Object.create(null);
  out.sort(function(a,b){ return Number(b._tradeAtlasTradeValue||0) - Number(a._tradeAtlasTradeValue||0); });
  return out.filter(function(item){
    var k = String(item.kompaniya || '').trim().toLowerCase();
    if(!k || seen[k]) return false;
    seen[k] = true;
    return true;
  });
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
  var sourceCodes = filterTradeAtlasAfricanCodes(((sourceSelection && sourceSelection.effectiveCountries) || []).map(getTradeAtlasCountryCode).filter(Boolean));
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
          // Afrika qit'asidagi firmalarni chiqarmaymiz (eksportyor rejimida)
          if(modeMeta.mode === 'exporters' && firmCode && isTradeAtlasAfricanCode(firmCode)) return;
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
  var key = apolloNormalizeText(name || '');
  // Korporativ suffix'lar (har xil tillarda)
  key = key.replace(/\b(co|company|corp|corporation|ltd|llc|inc|incorporated|group|holding|holdings|limited|plc|sa|ag|gmbh|pte|pty|as|bv|nv|srl|sas|sasu|spa|oao|ooo|zao|pao|kft|sro|jsc|joint|stock)\b/g, '');
  // Turkish/multi-lingual ish-fao'liyat so'zlari
  key = key.replace(/\b(sanayi|ticaret|anonim|sirketi|sti|kimyevi|maddeleri|imp|exp|trade|trading|industry|industries|industrial|manufacturing|manufacture|international|intl|export|exports|exporting|exporter|importer|importers|materials|chemical|chemicals|technology|technologies|enterprise|enterprises|business|societe|society|mines|mining|tebessa|algeria|morocco|china|turkey|usa|america)\b/g, '');
  // Article/conjunctions
  key = key.replace(/\b(va|ve|and|the|de|la|el|los|las|du|des|di)\b/g, '');
  // Qisqa so'zlar (1-2 harfli — A.S., a.s., II, BP, va h.k.)
  key = key.replace(/\b\w{1,2}\b/g, '');
  // Numerik kodlar (4+ raqamli — manzil, postal code)
  key = key.replace(/\b\d{4,}\b/g, '');
  // Bo'shliqlarni to'g'rilash
  key = key.replace(/\s+/g, ' ').trim();
  // BIRINCHI muhim so'z (≥ 4 harfli) — bu primary key
  // SOMIPHOS S.p.A. SOCIETE DES MINES → "somiphos"
  // SOMIPHOS/SPA → "somiphos"
  var words = key.split(' ').filter(function(w){ return w.length >= 4; });
  if(words.length){
    return words[0];
  }
  // Fallback: birinchi qisqa so'z (OCP, OSP, JSC kabi)
  return key.split(' ')[0] || '';
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
  // To'liq ism prioritet: name field > first+last unredacted > first+obfuscated
  var fullName = String((person && person.name) || '').trim();
  if(!fullName){
    var fn = String((person && person.first_name) || '').trim();
    var ln = String((person && person.last_name) || '').trim();
    var lnObf = String((person && person.last_name_obfuscated) || '').trim();
    fullName = (fn + ' ' + (ln || lnObf)).trim();
  }
  var contact = {
    personId: String((person && person.id) || '').trim(),
    name: fullName,
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
  // ═══ TradeAtlas hajm/qiymat aggregate (bir xil kompaniya merge bo'lganda) ═══
  function _sumNum(a, b){ return Number(a || 0) + Number(b || 0); }
  function _maxDate(a, b){
    var s = String(a || '').slice(0,10);
    var t = String(b || '').slice(0,10);
    return (t && t > s) ? t : (s || t);
  }
  function _minDate(a, b){
    var s = String(a || '').slice(0,10);
    var t = String(b || '').slice(0,10);
    if(!s) return t;
    if(!t) return s;
    return (t < s) ? t : s;
  }
  target._tradeAtlasTradeValue = _sumNum(target._tradeAtlasTradeValue, source._tradeAtlasTradeValue);
  target._tradeAtlasQuantity = _sumNum(target._tradeAtlasQuantity, source._tradeAtlasQuantity);
  target._tradeAtlasDocCount = _sumNum(target._tradeAtlasDocCount, source._tradeAtlasDocCount);
  target._tradeAtlasGrossWeight = _sumNum(target._tradeAtlasGrossWeight, source._tradeAtlasGrossWeight);
  target._tradeAtlasNetWeight = _sumNum(target._tradeAtlasNetWeight, source._tradeAtlasNetWeight);
  target._tradeAtlasFobUsd = _sumNum(target._tradeAtlasFobUsd, source._tradeAtlasFobUsd);
  target._tradeAtlasCifUsd = _sumNum(target._tradeAtlasCifUsd, source._tradeAtlasCifUsd);
  target._tradeAtlasStatValueUsd = _sumNum(target._tradeAtlasStatValueUsd, source._tradeAtlasStatValueUsd);
  target._tradeAtlasFreightUsd = _sumNum(target._tradeAtlasFreightUsd, source._tradeAtlasFreightUsd);
  target._tradeAtlasInsuranceUsd = _sumNum(target._tradeAtlasInsuranceUsd, source._tradeAtlasInsuranceUsd);
  target._tradeAtlasContainers = _sumNum(target._tradeAtlasContainers, source._tradeAtlasContainers);
  target._tradeAtlasPackages = _sumNum(target._tradeAtlasPackages, source._tradeAtlasPackages);
  target._tradeAtlasTeus = _sumNum(target._tradeAtlasTeus, source._tradeAtlasTeus);
  target._tradeAtlasLastArrivalDate = _maxDate(target._tradeAtlasLastArrivalDate, source._tradeAtlasLastArrivalDate);
  target._tradeAtlasFirstArrivalDate = _minDate(target._tradeAtlasFirstArrivalDate, source._tradeAtlasFirstArrivalDate);
  // Counterpart firms — birlashtiramiz va dublikatlarni olib tashlaymiz
  var existingCp = Array.isArray(target._tradeAtlasCounterpartFirms) ? target._tradeAtlasCounterpartFirms : [];
  var newCp = Array.isArray(source._tradeAtlasCounterpartFirms) ? source._tradeAtlasCounterpartFirms : [];
  if(newCp.length){
    var cpSeen = Object.create(null);
    existingCp.forEach(function(cp){
      var k = apolloNormalizeText((cp && cp.name) || '') + '|' + apolloNormalizeText((cp && cp.country) || '');
      cpSeen[k] = cp;
    });
    newCp.forEach(function(cp){
      var k = apolloNormalizeText((cp && cp.name) || '') + '|' + apolloNormalizeText((cp && cp.country) || '');
      if(cpSeen[k]){
        // Mavjud counterpart — qiymatlarni qo'shish
        cpSeen[k].totalValue = _sumNum(cpSeen[k].totalValue, cp.totalValue);
        cpSeen[k].totalQty = _sumNum(cpSeen[k].totalQty, cp.totalQty);
        cpSeen[k].docCount = _sumNum(cpSeen[k].docCount, cp.docCount);
        cpSeen[k].lastDate = _maxDate(cpSeen[k].lastDate, cp.lastDate);
      } else {
        existingCp.push(cp);
        cpSeen[k] = cp;
      }
    });
    target._tradeAtlasCounterpartFirms = existingCp;
  }
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
  // Faqat email'i bor kompaniyalar — email leadda bo'lishi shart
  var withEmail = unique.filter(function(item){ return apolloCountEmailContacts(item) >= 1; });
  if(!withEmail.length) return [];
  // Email kontaktini birinchi o'ringa (leadga) qo'yamiz (1 ta email bor yetarli)
  withEmail.forEach(function(item){
    var candidates = Array.isArray(item._contactCandidates) ? item._contactCandidates : [];
    var emailFirst = candidates.filter(finderContactHasEmail);
    var rest = candidates.filter(function(c){ return !finderContactHasEmail(c); });
    item._contactCandidates = emailFirst.concat(rest);
    var lead = emailFirst[0];
    if(lead){
      var secondary = rest[0] || emailFirst[1];
      item.contacts = secondary ? [lead, secondary] : [lead];
      item.rahbar = lead.name || item.rahbar || '';
      item.lavozim = lead.title || item.lavozim || '';
      item.email = lead.email;
      item.telefon = lead.telefon || item.telefon || '';
      item.photoUrl = lead.photoUrl || item.photoUrl || '';
      item.linkedin = lead.linkedin || item.linkedin || '';
      item._personId = lead.personId || item._personId || '';
    }
  });
  return withEmail.slice(0, Math.min(2, perCountry || 2));
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
  else if(body.search_type === 'organizations' || body.search_type === 'organization'){ body.action = 'organization_search'; delete body.search_type; }
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
  var prod = null;
  if(prodId){
    prod = (DB.products||[]).find(function(p){return p.id==prodId;});
  }
  // Mahsulot tanlanmasa — manual HS kod yoki firma nomi input field'ni tekshirish
  if(!prod){
    var manualEl = document.getElementById('finder-manual-hs');
    var manualRaw = manualEl ? String(manualEl.value || '').trim() : '';
    var manualHs = manualRaw.replace(/\D/g,'');
    var isPureDigits = manualRaw.length > 0 && /^\d+$/.test(manualRaw);
    if(isPureDigits && manualHs.length >= 2){
      // Synthetic product — manual HS kod bilan
      prod = {
        id: 'manual-' + manualHs,
        hs_code: manualHs,
        name: 'HS ' + manualHs,
        name_uz: 'HS ' + manualHs + ' (manual)',
        name_en: 'HS ' + manualHs + ' (manual)'
      };
    } else if(!isPureDigits && manualRaw.length >= 2){
      // Synthetic product — firma nomi bo'yicha qidiruv (faqat TradeAtlas qo'llab-quvvatlaydi)
      if(source !== 'tradeatlas'){
        toast('⚠️ Firma nomi bilan qidiruv faqat TradeAtlas\'da ishlaydi','error');
        return;
      }
      prod = {
        id: 'manual-firm-' + manualRaw.toLowerCase().replace(/\s+/g,'-').slice(0,40),
        hs_code: '',
        name: manualRaw,
        name_uz: manualRaw,
        name_en: manualRaw,
        _firmNameSearch: true,
        _firmName: manualRaw
      };
    } else {
      if(source === 'tradeatlas'){ showTradeAtlasUsageDialog(); return; }
      toast('⚠️ Mahsulot tanlang, HS kod yoki firma nomini yozing','error');
      return;
    }
  }
  var meta = getFinderModeMeta((document.getElementById('finder-mode')||{}).value || 'importers');
  _finderMode = meta.mode;
  var sourceScope = getFinderSourceSelection();
  var countSettings = getFinderCountSettings();
  var requestedCount = countSettings.count;
  var strategy = getFinderStrategyFilters();

  // ═══ TOP 100 GLOBAL MODE — Apollo always runs in Top 100 mode (country filter ignored) ═══
  var isTop100Global = (source === 'apollo');
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

  var _taApiMode = 'firms';
  var _taSnapshotId = '';
  var _taCachedSnapshot = null;
  if(source === 'tradeatlas'){
    // ═══ Cache check: shu filtr uchun avval Firebase'da saqlangan natija bormi? ═══
    try {
      if(typeof ensureCollectionLoaded === 'function') await ensureCollectionLoaded('taFirmSnapshots');
    } catch(_e){}
    // ═══ Import-analysis snapshots'ni ham yuklab qo'yamiz — enrichment uchun kerak ═══
    try {
      if(typeof ensureCollectionLoaded === 'function') await ensureCollectionLoaded('importSnapshots');
    } catch(_e){}
    // Kesh kaliti — kerak bolsa modal'gacha tekshiriladi (default firms mode bilan; user shipments tanlasa qayta tekshiriladi)
    var _taHsPre = getExactImportHsCode(prod);
    var _taTargetCodesPre = (targetCountries || []).map(getTradeAtlasCountryCode).filter(Boolean);
    var _taSourceCodesPre = filterTradeAtlasAfricanCodes(((sourceScope && sourceScope.effectiveCountries) || []).map(getTradeAtlasCountryCode).filter(Boolean));
    var _taDateRangePre = (typeof getImportAnalysisDateRange === 'function') ? getImportAnalysisDateRange() : { startDate:'', endDate:'' };
    var _taSnapIdFirms = _buildTaSnapshotId(prod, _taHsPre, _taTargetCodesPre, _taSourceCodesPre, _taDateRangePre, 'firms');
    var _taSnapIdShipments = _buildTaSnapshotId(prod, _taHsPre, _taTargetCodesPre, _taSourceCodesPre, _taDateRangePre, 'shipments');
    var _taCacheFirms = _getTaSnapshot(_taSnapIdFirms);
    var _taCacheShipments = _getTaSnapshot(_taSnapIdShipments);
    var _taCacheFlags = { firms: !!_taCacheFirms, shipments: !!_taCacheShipments };

    var taPreRes = await showTradeAtlasPreSearchConfirm(prod, meta, targetCountries, sourceScope, _taCacheFlags);
    var taConfirmed = !!(taPreRes && taPreRes.confirmed);
    _taApiMode = (taPreRes && taPreRes.apiMode) || 'firms';
    window._taApiMode = _taApiMode;  // Africa filter shu global'ga qaraydi
    var _taForceRefresh = !!(taPreRes && taPreRes.forceRefresh);
    // Foydalanuvchi tomonidan tanlangan limit (kredit tejash uchun)
    window._taMaxLimit = (taPreRes && Number(taPreRes.maxLimit)) || 0;
    if(!taConfirmed){
      document.getElementById('finderProgress').style.display = 'none';
      toast('ℹ️ TradeAtlas qidiruvi bekor qilindi','info');
      return;
    }
    // Tanlangan apiMode bo'yicha snapshot id va cache
    _taSnapshotId = _taApiMode === 'shipments' ? _taSnapIdShipments : _taSnapIdFirms;
    _taCachedSnapshot = _taForceRefresh ? null : _getTaSnapshot(_taSnapshotId);
  }

  try {
    if(source === 'tradeatlas'){
      syncImportSourceSelect('tradeatlas');
      runImportAnalysis(true, 'tradeatlas').catch(function(err){
        console.warn('TradeAtlas auto analysis error:', err && err.message ? err.message : err);
      });
      document.getElementById('finderBar').style.width = '38%';
      document.getElementById('finderProgressText').textContent =
        'TradeAtlas ('+(_taApiMode==='shipments'?'📦 shipments':'🏢 firms')+'): HS ' + (getExactImportHsCode(prod) || '-') +
        ' | Importyor: ' + targetCountries.slice(0,4).map(getFinderCountryLabel).join(', ') + (targetCountries.length > 4 ? '...' : '') +
        ' | Eksportyor: ' + (((sourceScope && sourceScope.effectiveCountries) || []).length
          ? sourceScope.effectiveCountries.slice(0,4).map(getFinderCountryLabel).join(', ') + (sourceScope.effectiveCountries.length > 4 ? '...' : '')
          : 'Butun dunyo');
      var tradeAtlasResults;
      if(_taCachedSnapshot && Array.isArray(_taCachedSnapshot.results) && _taCachedSnapshot.results.length){
        // ═══ Firebase'dan saqlangan natija — kredit sarflanmaydi ═══
        document.getElementById('finderProgressText').textContent = '💾 Firebase keshidan tiklanmoqda — kredit sarflanmaydi (saqlangan: ' + (_taCachedSnapshot.cachedAt || '').slice(0, 10) + ')';
        tradeAtlasResults = _taCachedSnapshot.results.slice();
        toast('💾 Saqlangan natija topildi: ' + tradeAtlasResults.length + ' kompaniya (kreditsiz)', 'success');
      } else if(_taApiMode === 'shipments'){
        // Aniq yo'l: /shipments/search → per-firm aggregation (hajm + FOB qiymat + counterpart)
        tradeAtlasResults = await tradeAtlasFinderSearch(prod, meta, targetCountries, sourceScope);
      } else {
        // Arzon yo'l: /firms/search (har firma = 1 kredit), shipment aggregation yo'q
        tradeAtlasResults = await tradeAtlasFirmsOnlySearch(prod, meta, targetCountries, sourceScope);
      }
      tradeAtlasResults.filter(finderResultIsRenderable).forEach(function(item){
        _finderResults.push(item);
      });
      // Enrichment olib tashlandi — faqat tanlangan filter (shipment) natijalari ko'rsatiladi
      dedupeFinderResults();
      _finderResults = _finderResults.filter(finderResultIsRenderable);
      if(!_finderResults.length){
        throw new Error('TradeAtlas qidiruvi natija qaytarmadi');
      }
      // ═══ Kreditli yangi search bo'lsa, natijani Firebase keshiga saqlaymiz ═══
      if(!_taCachedSnapshot && _taSnapshotId){
        var _taSnap = {
          id: _taSnapshotId,
          productId: String((prod && prod.id) || ''),
          productName: (typeof formatBilingualProductName === 'function') ? formatBilingualProductName(prod) : (prod && (prod.name_en || prod.name_uz) || ''),
          hsCode: getExactImportHsCode(prod) || '',
          targetCodes: (targetCountries || []).map(getTradeAtlasCountryCode).filter(Boolean).slice().sort(),
          sourceCodes: filterTradeAtlasAfricanCodes(((sourceScope && sourceScope.effectiveCountries) || []).map(getTradeAtlasCountryCode).filter(Boolean)).slice().sort(),
          startDate: (typeof getImportAnalysisDateRange === 'function' && getImportAnalysisDateRange().startDate) || '',
          endDate: (typeof getImportAnalysisDateRange === 'function' && getImportAnalysisDateRange().endDate) || '',
          apiMode: _taApiMode,
          results: _finderResults.slice(),
          cachedAt: new Date().toISOString()
        };
        _saveTaSnapshot(_taSnap).catch(function(e){ console.warn('TA snapshot saqlash xatosi:', e && e.message); });
      }
      document.getElementById('finderBar').style.width = '70%';

      // ═══ Investor base + Apollo + Gemini 3-bosqich enrichment ═══
      var apolloEnrichKey = getApolloApiKey();
      var hasGemini = typeof callGemini === 'function';
      var totalToEnrich = _finderResults.length;
      var apolloFound = 0, geminiFound = 0, dbFound = 0, totalSkipped = 0;
      // Investor base index (kompaniya nomi → record) — tezkor lookup uchun
      var _investorIndex = Object.create(null);
      (DB.investorCompanies || []).forEach(function(rec){
        if(!rec || !rec.kompaniya) return;
        var key = apolloCompanyKey(rec.kompaniya);
        if(!key) return;
        // Email/rahbar bor bo'lgan recordlarni saqlaymiz
        if(String(rec.email || '').trim() || String(rec.rahbar || '').trim()){
          if(!_investorIndex[key]) _investorIndex[key] = rec;
        }
      });
      for(var tei = 0; tei < totalToEnrich; tei++){
        var taItem = _finderResults[tei];
        if(!taItem || !taItem.kompaniya) { totalSkipped++; continue; }
        var alreadyHasContact = String(taItem.email || '').trim() || String(taItem.rahbar || '').trim();
        if(alreadyHasContact){ totalSkipped++; continue; }
        var progress = 70 + (tei/totalToEnrich)*18;
        // 0-qadam: Investor bazadan tekshirish — agar bor bo'lsa, kontaktni nusxalaymiz (kreditsiz)
        var dbKey = apolloCompanyKey(taItem.kompaniya);
        var dbRec = dbKey ? _investorIndex[dbKey] : null;
        if(dbRec){
          if(!taItem.email && dbRec.email) taItem.email = dbRec.email;
          if(!taItem.rahbar && dbRec.rahbar) taItem.rahbar = dbRec.rahbar;
          if(!taItem.lavozim && dbRec.lavozim) taItem.lavozim = dbRec.lavozim;
          if(!taItem.telefon && dbRec.telefon) taItem.telefon = dbRec.telefon;
          if(!taItem.linkedin && dbRec.linkedin) taItem.linkedin = dbRec.linkedin;
          if(!taItem.website && dbRec.website) taItem.website = dbRec.website;
          if(taItem.email || taItem.rahbar){
            dbFound++;
            console.log('[Enrichment] '+taItem.kompaniya+' → DB\'dan topildi (kreditsiz)');
            continue;
          }
        }
        // 1-qadam: Apollo orqali kompaniya + lead qidirish
        if(apolloEnrichKey){
          document.getElementById('finderProgressText').textContent = '🅰️ Apollo: '+taItem.kompaniya+' ('+(tei+1)+'/'+totalToEnrich+') — lead qidirilmoqda...';
          document.getElementById('finderBar').style.width = progress+'%';
          try {
            await apolloEnrichTradeAtlasItem(taItem, apolloEnrichKey, prod, meta);
            if(String(taItem.email || '').trim() || String(taItem.rahbar || '').trim()){
              apolloFound++;
              continue; // Apollo topdi — Gemini'ga o'tmaymiz
            }
          } catch(enErr){
            console.log('Apollo enrichment '+taItem.kompaniya+' error:', enErr && enErr.message);
          }
        }
        // 2-qadam: Apollo topa olmasa, Gemini orqali fallback
        if(hasGemini){
          document.getElementById('finderProgressText').textContent = '✨ Gemini: '+taItem.kompaniya+' ('+(tei+1)+'/'+totalToEnrich+') — lead qidirilmoqda (Apollo topmadi)...';
          document.getElementById('finderBar').style.width = progress+'%';
          try {
            await geminiEnrichTradeAtlasItem(taItem, prod, meta);
            if(String(taItem.email || '').trim() || String(taItem.rahbar || '').trim()){
              geminiFound++;
            }
          } catch(geErr){
            console.log('Gemini enrichment '+taItem.kompaniya+' error:', geErr && geErr.message);
          }
        }
      }
      console.log('[Enrichment] DB:'+dbFound+', Apollo:'+apolloFound+', Gemini:'+geminiFound+', Skipped:'+totalSkipped+', Jami:'+totalToEnrich);
      if(dbFound + apolloFound + geminiFound > 0){
        toast('✅ Lead topildi: 🗄️ DB:'+dbFound+' · 🅰️ Apollo:'+apolloFound+' · ✨ Gemini:'+geminiFound, 'success');
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

      // Har bir Top kompaniya uchun email'i bor kontakt qidirish + enrichment orqali unlock
      document.getElementById('finderProgressText').textContent = '📧 Top kompaniyalar uchun email qidirilmoqda...';
      var apolloKeyTop = getApolloApiKey();
      for(var tpi = 0; tpi < top100Results.length; tpi++){
        var tpItem = top100Results[tpi];
        if(!tpItem._orgId) continue;
        try {
          var peopleReq = {
            search_type: 'people',
            page: 1,
            per_page: 5,
            api_key: apolloKeyTop,
            organization_ids: [tpItem._orgId],
            person_titles: ['CEO','Founder','Owner','President','Director','Sales Manager','Export Manager','Procurement Manager']
          };
          var peopleData = await apolloRequestJson(peopleReq);
          var persons = normalizeApolloArray(peopleData, ['people','contacts']);
          // Candidates: email bor yoki hasEmailHint bor
          var allContacts = persons.map(function(p){ return apolloPersonToContact(p, p.organization || {}); }).filter(Boolean);
          var directEmail = allContacts.filter(finderContactHasEmail);
          var hintEmail = allContacts.filter(function(c){ return !finderContactHasEmail(c) && c.hasEmailHint; });

          // Agar direct email yo'q bo'lsa, hint'dan birini enrichment orqali unlock qilamiz
          if(!directEmail.length && hintEmail.length){
            document.getElementById('finderProgressText').textContent = '🔓 '+tpItem.kompaniya+' — email unlock qilinmoqda...';
            var candidate = hintEmail[0];
            try {
              var enrichData = await apolloRequestJson({
                search_type: 'people_enrichment',
                api_key: apolloKeyTop,
                id: candidate.personId || '',
                first_name: (candidate.name || '').split(' ')[0] || '',
                last_name: (candidate.name || '').split(' ').slice(1).join(' ') || '',
                organization_name: tpItem.kompaniya || '',
                organization_domain: (function(){
                  try { var u = String(tpItem.website || '').trim(); if(!u) return ''; if(!/^https?:\/\//i.test(u)) u = 'https://' + u; return new URL(u).hostname.replace(/^www\./,''); } catch(_e){ return ''; }
                })()
              });
              var enrichedPerson = enrichData && enrichData.person;
              if(enrichedPerson){
                var enriched = apolloPersonToContact(enrichedPerson, enrichedPerson.organization || {});
                if(finderContactHasEmail(enriched)) directEmail.push(enriched);
              }
            } catch(_enrichErr){
              console.log('Enrich error for '+tpItem.kompaniya+':', _enrichErr && _enrichErr.message);
            }
          }

          var finalContacts = directEmail.concat(
            allContacts.filter(function(c){ return !finderContactHasEmail(c) && !directEmail.some(function(d){ return d.personId === c.personId; }); })
          );
          // Top natijalari uchun oddiy contact biriktirish — 1 ta email bor lead yetarli
          if(finalContacts.length){
            tpItem._contactCandidates = finalContacts;
            var emailLead = finalContacts.filter(finderContactHasEmail)[0];
            if(emailLead){
              var secondary = finalContacts.filter(function(c){ return c !== emailLead; })[0];
              tpItem.contacts = secondary ? [emailLead, secondary] : [emailLead];
              tpItem.rahbar = emailLead.name || tpItem.rahbar;
              tpItem.lavozim = emailLead.title || tpItem.lavozim;
              tpItem.email = emailLead.email || '';
              tpItem.telefon = emailLead.telefon || '';
              tpItem.photoUrl = emailLead.photoUrl || '';
              tpItem.linkedin = emailLead.linkedin || '';
              tpItem._personId = emailLead.personId || '';
            }
          }
        } catch(emailErr){
          console.log('Top email fetch error for '+tpItem.kompaniya+':', emailErr && emailErr.message);
        }
      }
      // Faqat haqiqiy email'i bor kompaniyalar qoldiriladi
      top100Results = top100Results.filter(function(item){
        return !!String(item.email || '').trim();
      });

      // Add rank
      top100Results.forEach(function(item, idx){ item.top100Rank = idx + 1; });

      _finderResults = top100Results;
      if(!_finderResults.length){
        throw new Error('Apollo Top '+TOP100_CAP+' qidiruvi email\'i bor kompaniya topa olmadi.' + (top100Errors.length ? ' Xatolar: '+top100Errors.slice(0,3).join(' | ') : ''));
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

// TradeAtlas hajm + counterpart cellni formatlash uchun yordamchi funksiyalar
function _fmtTaHajmCell(item){
  if(!item) return '<span style="color:var(--text3)">—</span>';
  var qty = Number(item._tradeAtlasQuantity || 0);
  var unit = String(item._tradeAtlasQuantityUnit || '').trim();
  if(!qty){
    // Fallback: gross/net og'irlik bo'lsa shuni ko'rsat
    var gw = Number(item._tradeAtlasGrossWeight || 0);
    var nw = Number(item._tradeAtlasNetWeight || 0);
    var w = gw || nw;
    if(!w) return '<span style="color:var(--text3)">—</span>';
    qty = w;
    unit = String(item._tradeAtlasGrossWeightUnit || item._tradeAtlasNetWeightUnit || 'kg').trim();
  }
  var disp;
  if(qty >= 1e6) disp = (qty/1e6).toFixed(2) + 'M';
  else if(qty >= 1e3) disp = (qty/1e3).toFixed(1) + 'K';
  else disp = String(Math.round(qty * 100) / 100);
  return '<span style="font-weight:700">'+disp+'</span><span style="font-size:.6rem;color:var(--text3);margin-left:3px">'+escHtml(unit||'kg')+'</span>';
}

// Sana cell — eksport/import sanasini ko'rsatish (oxirgi shipment + birinchi shipment)
function _fmtTaSanaCell(item){
  if(!item) return '<span style="color:var(--text3)">—</span>';
  // Asosiy: last_arrival_date (oxirgi shipment), fallback: first counterpart firmaning sanasi
  var last = String(item._tradeAtlasLastArrivalDate || '').trim();
  var first = String(item._tradeAtlasFirstArrivalDate || '').trim();
  // Counterpart firmlardan eng yangi sanani olish (last bo'lmasa)
  if(!last){
    var firms = Array.isArray(item._tradeAtlasCounterpartFirms) ? item._tradeAtlasCounterpartFirms : [];
    if(firms.length){
      var dates = firms.map(function(cp){ return String(cp.lastDate || '').slice(0,10); }).filter(Boolean).sort();
      if(dates.length){
        last = dates[dates.length-1];
        if(!first && dates.length > 1) first = dates[0];
      }
    }
  }
  if(!last && !first) return '<span style="color:var(--text3)">—</span>';
  var lastTxt = last ? String(last).slice(0,10) : '';
  var firstTxt = first ? String(first).slice(0,10) : '';
  // Yangi sana yashil, eski sana kulrang
  var html = '';
  if(lastTxt){
    html += '<div style="font-weight:700;color:#059669;line-height:1.25" title="So\'nggi shipment sanasi">📅 '+escHtml(lastTxt)+'</div>';
  }
  if(firstTxt && firstTxt !== lastTxt){
    html += '<div style="font-size:.58rem;color:var(--text3);margin-top:1px" title="Birinchi shipment sanasi">↳ '+escHtml(firstTxt)+'</div>';
  }
  return html || '<span style="color:var(--text3)">—</span>';
}

function _fmtTaCounterpartCell(item){
  if(!item) return '<span style="color:var(--text3)">—</span>';
  var role = String(item.finderMode || '').toLowerCase();
  var arrow = '';
  if(role === 'exporters'){
    arrow = '<span style="color:#059669;font-weight:800;margin-right:3px" title="Eksport qildi (target tomonga)">→</span>';
  } else if(role === 'importers'){
    arrow = '<span style="color:#7C3AED;font-weight:800;margin-right:3px" title="Import qildi (manba tomondan)">←</span>';
  }
  // Counterpart-ning roli — asosiy item importer bo'lsa, counterpart exporter va aksincha
  var counterpartRole = (role === 'importers') ? 'exporters' : (role === 'exporters' ? 'importers' : '');
  // Eng yaxshi: counterpart_firms array (har hamkor firma to'liq ma'lumotlari)
  var firms = Array.isArray(item._tradeAtlasCounterpartFirms) ? item._tradeAtlasCounterpartFirms : [];
  if(firms.length){
    var topFirms = firms.slice(0, 2);
    var moreFirms = firms.length > 2 ? '<div style="font-size:.6rem;color:var(--text3);font-weight:600;margin-top:2px">+' + (firms.length - 2) + ' ta hamkor</div>' : '';
    var firmsHtml = topFirms.map(function(cp, cpIdx){
      var qty = Number(cp.totalQty || 0);
      var qtyTxt = qty >= 1e6 ? (qty/1e6).toFixed(1)+'M' : qty >= 1e3 ? (qty/1e3).toFixed(1)+'K' : (qty ? Math.round(qty) : '');
      var val = Number(cp.totalValue || 0);
      var valTxt = val >= 1e6 ? '$'+(val/1e6).toFixed(1)+'M' : val >= 1e3 ? '$'+(val/1e3).toFixed(0)+'K' : (val ? '$'+val : '');
      var flag = (typeof getFinderCountryFlag === 'function' && cp.country) ? getFinderCountryFlag(cp.country) : '';
      // Counterpart firma uchun unique key — index-based JSON ga teng
      var payload = {
        name: cp.name || '',
        country: cp.country || '',
        countryCode: cp.countryCode || '',
        cityState: cp.cityState || '',
        email: cp.email || '',
        tel: cp.tel || '',
        web: cp.web || '',
        linkedin: cp.linkedin || '',
        totalQty: cp.totalQty || 0,
        totalValue: cp.totalValue || 0,
        docCount: cp.docCount || 0,
        lastDate: cp.lastDate || '',
        role: counterpartRole,
        parentName: item.kompaniya || '',
        parentCountry: item.davlat || ''
      };
      var payloadJson = encodeURIComponent(JSON.stringify(payload));
      return '<div style="font-size:.65rem;line-height:1.35;margin-bottom:2px">'+
        arrow+'<b onclick="openTaCounterpartDetail(\''+payloadJson+'\')" style="color:var(--text);cursor:pointer;text-decoration:underline;text-decoration-color:rgba(67,97,238,.3);text-underline-offset:2px" title="Batafsil ko\'rish">'+escHtml(String(cp.name || '').slice(0, 22))+'</b> '+
        '<span style="color:var(--text3)">'+(flag || cp.countryCode || '')+'</span>'+
        (qtyTxt || valTxt ? '<div style="font-size:.58rem;color:var(--text3);margin-left:14px">'+(qtyTxt?qtyTxt+' kg ':'')+(valTxt?'· '+valTxt:'')+'</div>' : '')+
      '</div>';
    }).join('');
    return firmsHtml + moreFirms;
  }
  // Fallback: faqat davlat ro'yxati (firms mode yoki backend deploy qilinmagan)
  var arr = Array.isArray(item._tradeAtlasCounterpartCountries) ? item._tradeAtlasCounterpartCountries.filter(Boolean) : [];
  if(!arr.length){
    var desc = String(item.description || '').trim();
    var m = desc.match(/Hamkor davlatlar:\s*(.+)/i);
    if(m && m[1]){
      arr = m[1].split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    }
  }
  if(!arr.length) return arrow + '<span style="color:var(--text3)">—</span>';
  var shown = arr.slice(0, 3);
  var more = arr.length > 3 ? ' <span style="color:var(--text3);font-size:.6rem;font-weight:600">+'+(arr.length-3)+'</span>' : '';
  var list = shown.map(function(name){
    var flag = (typeof getFinderCountryFlag === 'function') ? getFinderCountryFlag(name) : '';
    var label = (typeof getFinderCountryLabel === 'function') ? getFinderCountryLabel(name) : name;
    return (flag ? flag+' ' : '') + escHtml(String(label || name).slice(0, 12));
  }).join(', ') + more;
  return arrow + list;
}

// Eksportyor/Importyor rolini ajratib ko'rsatish uchun badge
function _fmtTaRoleBadge(item){
  if(!item) return '';
  var role = String(item.finderMode || '').toLowerCase();
  if(role === 'exporters'){
    return '<span style="display:inline-block;padding:1px 6px;border-radius:4px;background:rgba(5,150,105,.12);color:#059669;font-size:.55rem;font-weight:800;letter-spacing:.04em;margin-top:2px">📤 EKSPORT</span>';
  }
  if(role === 'importers'){
    return '<span style="display:inline-block;padding:1px 6px;border-radius:4px;background:rgba(124,58,237,.12);color:#7C3AED;font-size:.55rem;font-weight:800;letter-spacing:.04em;margin-top:2px">📥 IMPORT</span>';
  }
  return '';
}

// Counterpart firma uchun batafsil modal — exporter / importer kim ekanligi va shipment ma'lumotlari
function openTaCounterpartDetail(payloadJson){
  var data;
  try {
    data = JSON.parse(decodeURIComponent(payloadJson));
  } catch(e){
    if(typeof toast === 'function') toast('Ma\'lumotni o\'qib bo\'lmadi','error');
    return;
  }
  if(!data || !data.name){
    if(typeof toast === 'function') toast('Ma\'lumot yo\'q','error');
    return;
  }
  var role = String(data.role || '').toLowerCase();
  var isImp = role === 'importers';
  var roleLabel = isImp ? '📥 IMPORTYOR KOMPANIYA' : (role === 'exporters' ? '📤 EKSPORTYOR KOMPANIYA' : 'KOMPANIYA');
  var roleColor = isImp ? '#7C3AED' : (role === 'exporters' ? '#059669' : '#465fff');
  var roleBg = isImp ? 'rgba(124,58,237,.08)' : (role === 'exporters' ? 'rgba(5,150,105,.08)' : 'rgba(70,95,255,.08)');
  var flag = (typeof getFinderCountryFlag === 'function' && data.country) ? getFinderCountryFlag(data.country) : '';
  var label = (typeof getFinderCountryLabel === 'function' && data.country) ? getFinderCountryLabel(data.country) : (data.country || '');
  var qty = Number(data.totalQty || 0);
  var qtyTxt = qty >= 1e6 ? (qty/1e6).toFixed(2)+'M' : qty >= 1e3 ? (qty/1e3).toFixed(1)+'K' : (qty ? Math.round(qty) : '0');
  var val = Number(data.totalValue || 0);
  var valTxt = val >= 1e6 ? '$'+(val/1e6).toFixed(2)+'M' : val >= 1e3 ? '$'+(val/1e3).toFixed(1)+'K' : (val ? '$'+val : '$0');
  var docs = Number(data.docCount || 0);
  // Aks tomon (parent kompaniya) info
  var parentRole = isImp ? 'eksportyor' : 'importyor';
  var parentColor = isImp ? '#059669' : '#7C3AED';
  var parentArrow = isImp ? '←' : '→';
  var parentLabel = isImp ? 'Manba (kimdan olgan)' : 'Maqsad (kimga sotgan)';
  // Modal HTML
  var modal = document.getElementById('taCounterpartModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'taCounterpartModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.55);display:none;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px)';
    modal.onclick = function(e){ if(e.target === modal) modal.style.display = 'none'; };
    document.body.appendChild(modal);
  }
  var contactsHtml = '';
  if(data.email){
    contactsHtml += '<div style="display:flex;gap:8px;align-items:center;font-size:.8rem;color:#1F2937;margin-bottom:6px"><span style="color:#3B82F6;font-weight:700">📧</span><a href="mailto:'+escHtml(data.email)+'" style="color:#3B82F6;text-decoration:none">'+escHtml(data.email)+'</a></div>';
  }
  if(data.tel){
    contactsHtml += '<div style="display:flex;gap:8px;align-items:center;font-size:.8rem;color:#1F2937;margin-bottom:6px"><span style="color:#059669;font-weight:700">📞</span><a href="tel:'+escHtml(data.tel)+'" style="color:#059669;text-decoration:none">'+escHtml(data.tel)+'</a></div>';
  }
  if(data.web){
    var webUrl = data.web.indexOf('http') === 0 ? data.web : 'https://'+data.web;
    contactsHtml += '<div style="display:flex;gap:8px;align-items:center;font-size:.8rem;color:#1F2937;margin-bottom:6px"><span style="color:#7C3AED;font-weight:700">🌐</span><a href="'+escHtml(webUrl)+'" target="_blank" rel="noopener" style="color:#7C3AED;text-decoration:none">'+escHtml(data.web)+'</a></div>';
  }
  if(data.linkedin){
    var liUrl = data.linkedin.indexOf('http') === 0 ? data.linkedin : 'https://'+data.linkedin;
    contactsHtml += '<div style="display:flex;gap:8px;align-items:center;font-size:.8rem;color:#1F2937;margin-bottom:6px"><span style="color:#0A66C2;font-weight:700">in</span><a href="'+escHtml(liUrl)+'" target="_blank" rel="noopener" style="color:#0A66C2;text-decoration:none">'+escHtml(data.linkedin)+'</a></div>';
  }
  if(!contactsHtml) contactsHtml = '<div style="font-size:.75rem;color:var(--text3);font-style:italic">Kontakt ma\'lumotlari TradeAtlas\'da topilmadi</div>';
  modal.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:600px;width:100%;max-height:85vh;overflow:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,.25)">'+
    '<div style="padding:1.25rem;border-bottom:1px solid var(--border);background:'+roleBg+';border-radius:16px 16px 0 0">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem">'+
        '<div style="flex:1;min-width:0">'+
          '<div style="font-size:.62rem;font-weight:800;color:'+roleColor+';letter-spacing:.05em;margin-bottom:4px">'+roleLabel+'</div>'+
          '<div style="font-size:1.15rem;font-weight:800;color:#111827;line-height:1.3;word-break:break-word">'+escHtml(data.name)+'</div>'+
          '<div style="font-size:.78rem;color:#4B5563;margin-top:4px">'+(flag?flag+' ':'')+escHtml(label || data.country || '—')+(data.cityState?' · '+escHtml(data.cityState):'')+'</div>'+
        '</div>'+
        '<button onclick="document.getElementById(\'taCounterpartModal\').style.display=\'none\'" style="border:none;background:#fff;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1.1rem;color:#6B7280;flex-shrink:0">×</button>'+
      '</div>'+
    '</div>'+
    '<div style="padding:1.25rem">'+
      // Parent (aks tomon)
      '<div style="background:rgba(70,95,255,.04);border-left:3px solid '+parentColor+';padding:.75rem 1rem;border-radius:0 8px 8px 0;margin-bottom:1rem">'+
        '<div style="font-size:.6rem;font-weight:700;color:'+parentColor+';letter-spacing:.04em;text-transform:uppercase;margin-bottom:3px">'+parentArrow+' '+parentLabel+'</div>'+
        '<div style="font-size:.85rem;font-weight:700;color:#111827">'+escHtml(data.parentName || '—')+'</div>'+
        (data.parentCountry?'<div style="font-size:.7rem;color:#6B7280;margin-top:2px">'+(typeof getFinderCountryFlag==='function'?getFinderCountryFlag(data.parentCountry)+' ':'')+escHtml(data.parentCountry)+'</div>':'')+
      '</div>'+
      // KPI
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;margin-bottom:1rem">'+
        '<div style="background:#F0F9FF;border-radius:10px;padding:.7rem;border:1px solid rgba(14,165,233,.2)"><div style="font-size:.55rem;font-weight:700;color:#0284C7;letter-spacing:.04em">HAJM</div><div style="font-size:1.1rem;font-weight:800;color:#0C4A6E;margin-top:2px">'+qtyTxt+'</div><div style="font-size:.55rem;color:#0284C7;margin-top:1px">kg</div></div>'+
        '<div style="background:#F0FDF4;border-radius:10px;padding:.7rem;border:1px solid rgba(34,197,94,.2)"><div style="font-size:.55rem;font-weight:700;color:#16A34A;letter-spacing:.04em">QIYMAT</div><div style="font-size:1.1rem;font-weight:800;color:#14532D;margin-top:2px">'+valTxt+'</div><div style="font-size:.55rem;color:#16A34A;margin-top:1px">FOB / CIF</div></div>'+
        '<div style="background:#FEF3F2;border-radius:10px;padding:.7rem;border:1px solid rgba(239,68,68,.2)"><div style="font-size:.55rem;font-weight:700;color:#DC2626;letter-spacing:.04em">SHIPMENT</div><div style="font-size:1.1rem;font-weight:800;color:#7F1D1D;margin-top:2px">'+docs+'</div><div style="font-size:.55rem;color:#DC2626;margin-top:1px">ta</div></div>'+
      '</div>'+
      // Last date
      (data.lastDate?'<div style="font-size:.72rem;color:#6B7280;margin-bottom:.85rem">📅 So\'nggi shipment: <b style="color:#1F2937">'+escHtml(String(data.lastDate).slice(0,10))+'</b></div>':'')+
      // Contacts
      '<div>'+
        '<div style="font-size:.6rem;font-weight:700;color:#374151;letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px">Kontakt ma\'lumotlari</div>'+
        contactsHtml+
      '</div>'+
    '</div>'+
    '<div style="padding:1rem 1.25rem;border-top:1px solid var(--border);background:#FAFBFF;border-radius:0 0 16px 16px;font-size:.65rem;color:var(--text3);line-height:1.5">💡 <b>Eslatma:</b> Ushbu kompaniya '+(isImp?'parent eksportyor kompaniyaning shipment ma\'lumotlaridan':'parent importyor kompaniyaning shipment ma\'lumotlaridan')+' aggregate qilingan. To\'liq firma profili uchun TradeAtlas\'da alohida qidiring.</div>'+
  '</div>';
  modal.style.display = 'flex';
}
window.openTaCounterpartDetail = openTaCounterpartDetail;

// Section header — Importyor / Eksportyor guruhini ajratish uchun
// + sub-header row (column-aligned) — section'ga qarab "Importyor kompaniya" / "Eksportyor kompaniya" labellari
function _fmtTaSectionHeader(role, count){
  var isImp = role === 'importers';
  var label = isImp ? '📥 Importyor kompaniyalar' : '📤 Eksportyor kompaniyalar';
  var bg = isImp ? 'linear-gradient(90deg,rgba(124,58,237,.12),rgba(124,58,237,.04))' : 'linear-gradient(90deg,rgba(5,150,105,.12),rgba(5,150,105,.04))';
  var color = isImp ? '#7C3AED' : '#059669';
  var sub = isImp ? 'Mahsulotni manba davlatdan import qilgan firmalar' : 'Mahsulotni maqsad davlatga eksport qilgan firmalar';
  // Section'ga qarab column nomlari (rol = ushbu sektorning satrlari, partner = aks tomon)
  var rowLabel = isImp ? '📥 Importyor kompaniya' : '📤 Eksportyor kompaniya';
  var partnerLabel = isImp ? '📤 Eksportyor kompaniya' : '📥 Importyor kompaniya';
  var rowColor = isImp ? '#7C3AED' : '#059669';
  var partnerColor = isImp ? '#059669' : '#7C3AED';
  var subHeadCellStyle = 'padding:.45rem .55rem;background:#F9FAFB;border-bottom:1px solid var(--border);font-size:.62rem;font-weight:700;letter-spacing:.04em;color:var(--text3);text-transform:uppercase';
  var bannerRow = '<tr class="finder-section-header" aria-hidden="true">'+
    '<td colspan="11" style="padding:.6rem .9rem;background:'+bg+';border:none;border-left:3px solid '+color+'">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:.7rem">'+
        '<div>'+
          '<div style="font-family:\'Sora\',sans-serif;font-size:.85rem;font-weight:800;color:'+color+'">'+label+' <span style="background:#fff;color:'+color+';padding:1px 8px;border-radius:8px;font-size:.7rem;margin-left:6px">'+count+'</span></div>'+
          '<div style="font-size:.62rem;color:var(--text3);margin-top:2px">'+sub+'</div>'+
        '</div>'+
      '</div>'+
    '</td>'+
  '</tr>';
  // Bo'sh section uchun sub-header'ni chiqarmaslik (count 0 bo'lsa keyingisi empty msg row keladi)
  if(!count) return bannerRow;
  var subHeadRow = '<tr class="finder-section-subhead" aria-hidden="true">'+
    '<td style="'+subHeadCellStyle+'"></td>'+
    '<td style="'+subHeadCellStyle+'">#</td>'+
    '<td style="'+subHeadCellStyle+';color:'+rowColor+'">'+rowLabel+'</td>'+
    '<td style="'+subHeadCellStyle+'">Davlat</td>'+
    '<td style="'+subHeadCellStyle+'">Sana</td>'+
    '<td style="'+subHeadCellStyle+'">Hajm</td>'+
    '<td style="'+subHeadCellStyle+';color:'+partnerColor+'">'+partnerLabel+'</td>'+
    '<td style="'+subHeadCellStyle+'">Kontaktlar</td>'+
    '<td style="'+subHeadCellStyle+'">Score</td>'+
    '<td style="'+subHeadCellStyle+'">Email holati</td>'+
    '<td style="'+subHeadCellStyle+'">Amal</td>'+
  '</tr>';
  return bannerRow + subHeadRow;
}

// Final override: keep one company row-group and show multiple contacts under that company.
function renderFinderTable(results){
  updateFinderModeUI();
  var tb = document.getElementById('finder-tbody');
  if(!tb) return;
  var rows = [];
  var allResults = Array.isArray(_finderResults) ? _finderResults : [];
  // Section split olib tashlandi — barcha natijalarni qiymat (TradeAtlas trade value) yoki score bo'yicha tartiblaymiz
  var _sortedResults = (results || []).slice().sort(function(a, b){
    var aVal = Number(a._tradeAtlasTradeValue || 0);
    var bVal = Number(b._tradeAtlasTradeValue || 0);
    if(aVal !== bVal) return bVal - aVal;
    return (b.score || 0) - (a.score || 0);
  });
  var _visibleResults = _sortedResults.filter(function(_r){
    var _c = getFinderVisibleContacts(_r);
    return _c && _c.length > 0;
  });
  var _lastVisibleIdx = _visibleResults.length - 1;
  var _renderedIdx = -1;
  _sortedResults.forEach(function(r, i){
    var contacts = getFinderVisibleContacts(r);
    if(!contacts.length) return;
    _renderedIdx++;
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
        row += '<td rowspan="'+rowspan+'"><div onclick="openFinderContactDetail('+sourceIdx+',0)" style="cursor:pointer;padding:4px 6px;border-radius:8px;transition:background .15s" onmouseover="this.style.background=\'rgba(70,95,255,.06)\'" onmouseout="this.style.background=\'\'" title="Batafsil"><b>'+escHtml(r.kompaniya || '—')+'</b>'+(r.website ? '<div style="font-size:.55rem;color:var(--text3)">'+escHtml(r.website)+'</div>' : '')+_fmtTaRoleBadge(r)+'</div></td>';
        row += '<td rowspan="'+rowspan+'">'+getFinderCountryFlag(r.davlat)+' '+getFinderCountryLabel(r.davlat)+'</td>';
        row += '<td rowspan="'+rowspan+'" style="font-size:.7rem;white-space:nowrap">'+_fmtTaSanaCell(r)+'</td>';
        row += '<td rowspan="'+rowspan+'" style="font-size:.7rem;white-space:nowrap">'+_fmtTaHajmCell(r)+'</td>';
        row += '<td rowspan="'+rowspan+'" style="font-size:.7rem">'+_fmtTaCounterpartCell(r)+'</td>';
      }
      // Kontakt cell — har TradeAtlas firma uchun "Lead topish" tugma (faqat email YO'Q bo'lsa)
      var _contactCellHtml = renderFinderContactCard(state.contact);
      var _isTradeAtlasItem = String(r.manba || '').toLowerCase().indexOf('tradeatlas') !== -1;
      var _hasAnyEmail = !!(String(r.email || '').trim() || (state.contact && String(state.contact.email || '').trim()));
      // TradeAtlas firma + email yo'q + birinchi qator → tugma
      if(_isTradeAtlasItem && !_hasAnyEmail && contactRowIdx === 0){
        _contactCellHtml += '<div style="margin-top:8px"><button id="findLeadBtn-'+sourceIdx+'" type="button" onclick="event.stopPropagation();findContactsForFinderItem('+sourceIdx+')" style="background:linear-gradient(135deg,#7C3AED,#465fff);color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:.7rem;font-weight:700;cursor:pointer;display:inline-block;box-shadow:0 2px 8px rgba(124,58,237,.35);white-space:nowrap" title="Apollo + Gemini orqali lead va email topish">🔍 Lead topish</button></div>';
      }
      row += '<td>'+_contactCellHtml+'</td>';
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
    if(_renderedIdx < _lastVisibleIdx){
      rows.push(
        '<tr class="finder-company-separator" aria-hidden="true">'+
          '<td colspan="11" style="padding:0;border:none;background:transparent">'+
            '<div style="height:3px;margin:4px 0;border-radius:999px;background:linear-gradient(90deg,transparent 0%,rgba(67,97,238,.18) 12%,rgba(67,97,238,.55) 35%,rgba(245,124,0,.7) 50%,rgba(67,97,238,.55) 65%,rgba(67,97,238,.18) 88%,transparent 100%);box-shadow:0 0 6px rgba(245,124,0,.15)"></div>'+
          '</td>'+
        '</tr>'
      );
    }
  });
  // Section split olib tashlangan — empty headers ham ko'rinmaydi
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
  var partnersAdded = 0;
  var meta = getCurrentFinderProductMeta();

  // Counterpart firmni alohida investor record sifatida saqlaymiz, parent bilan _partnerOf orqali bog'laymiz
  function _savePartnerFirm(parentItem, parentRec, cpFirm){
    if(!cpFirm || !String(cpFirm.name || '').trim()) return null;
    var partnerRole = String(parentItem.finderMode || '').toLowerCase() === 'exporters' ? 'importer' : 'exporter';
    var parentRole = String(parentItem.finderMode || '').toLowerCase() === 'exporters' ? 'exporter' : 'importer';
    // Synthetic item — counterpart firmadan finder result yasaymiz
    var partnerItem = {
      id: 'fc_ta_partner_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      kompaniya: cpFirm.name,
      davlat: cpFirm.country || '',
      shahar: cpFirm.cityState || '',
      website: cpFirm.web || '',
      email: cpFirm.email || '',
      telefon: cpFirm.tel || '',
      linkedin: cpFirm.linkedin || '',
      soha: parentItem.soha || '',
      mahsulotNomi: parentItem.mahsulotNomi || (meta && meta.productLabel) || '',
      productId: parentItem.productId || (meta && meta.productId) || '',
      mahsulotHs: parentItem.mahsulotHs || (meta && meta.productHs) || '',
      manba: 'TradeAtlas',
      finderMode: partnerRole + 's',
      score: parentItem.score || 70,
      _tradeAtlasTradeValue: cpFirm.totalValue || 0,
      _tradeAtlasQuantity: cpFirm.totalQty || 0,
      _tradeAtlasDocCount: cpFirm.docCount || 0,
      _tradeAtlasLastArrivalDate: cpFirm.lastDate || ''
    };
    var partnerContact = {
      name: '', title: 'TradeAtlas ' + (partnerRole === 'importer' ? 'import' : 'eksport') + ' kontakti',
      email: cpFirm.email || '', telefon: cpFirm.tel || '',
      website: cpFirm.web || '', linkedin: cpFirm.linkedin || '',
      photoUrl: '', personId: ''
    };
    // Mavjud recordni qidiramiz (kompaniya nomi + kontaktsiz)
    var partnerKey = String(cpFirm.name).trim().toLowerCase();
    var existingPartner = (DB.investorCompanies || []).find(function(r){
      return String(r.kompaniya || '').trim().toLowerCase() === partnerKey;
    }) || null;
    var partnerRec = upsertFinderContactInvestorRecord(existingPartner, partnerItem, partnerContact, meta);
    if(!partnerRec) return null;
    // _partnerOf — qaysi parent kompaniya bilan aloqasi bor
    if(!Array.isArray(partnerRec._partnerOf)) partnerRec._partnerOf = [];
    var linkKey = String(parentItem.kompaniya || '').trim().toLowerCase();
    if(!partnerRec._partnerOf.find(function(p){ return String(p.kompaniya || '').trim().toLowerCase() === linkKey; })){
      partnerRec._partnerOf.push({
        kompaniya: parentItem.kompaniya,
        davlat: parentItem.davlat || '',
        role: parentRole,
        totalValue: cpFirm.totalValue || 0,
        totalQty: cpFirm.totalQty || 0,
        docCount: cpFirm.docCount || 0,
        lastDate: cpFirm.lastDate || ''
      });
      if(typeof fbSave === 'function') fbSave('investorCompanies', partnerRec);
    }
    if(!existingPartner) partnersAdded++;
    return partnerRec;
  }

  function _attachPartnersToParent(parentItem, parentRec){
    var firms = Array.isArray(parentItem._tradeAtlasCounterpartFirms) ? parentItem._tradeAtlasCounterpartFirms : [];
    if(!firms.length) return;
    if(!Array.isArray(parentRec._partners)) parentRec._partners = [];
    firms.forEach(function(cpFirm){
      _savePartnerFirm(parentItem, parentRec, cpFirm);
      // Parent record'ga ham ushbu hamkor qo'shiladi
      var linkKey = String(cpFirm.name || '').trim().toLowerCase();
      if(!linkKey) return;
      var partnerSlot = parentRec._partners.find(function(p){ return String(p.kompaniya || '').trim().toLowerCase() === linkKey; });
      var slot = {
        kompaniya: cpFirm.name,
        davlat: cpFirm.country || '',
        countryCode: cpFirm.countryCode || '',
        cityState: cpFirm.cityState || '',
        email: cpFirm.email || '',
        tel: cpFirm.tel || '',
        web: cpFirm.web || '',
        role: String(parentItem.finderMode || '').toLowerCase() === 'exporters' ? 'importer' : 'exporter',
        totalValue: cpFirm.totalValue || 0,
        totalQty: cpFirm.totalQty || 0,
        docCount: cpFirm.docCount || 0,
        lastDate: cpFirm.lastDate || ''
      };
      if(partnerSlot) Object.assign(partnerSlot, slot);
      else parentRec._partners.push(slot);
    });
    if(typeof fbSave === 'function') fbSave('investorCompanies', parentRec);
  }

  (_finderResults || []).forEach(function(item){
    if(!item || !String(item.kompaniya || '').trim()) return;
    var contacts = getFinderVisibleContacts(item);
    var savedRec = null;
    if(!contacts.length){
      // Lead/kontakt bo'lmasa ham kompaniyaning o'zini saqlaymiz (bo'sh kontakt bilan)
      var emptyContact = {
        name: '', title: '', email: '', telefon: '',
        website: item.website || '', linkedin: item.linkedin || '',
        photoUrl: '', personId: ''
      };
      var companyKey = String(item.kompaniya || '').trim().toLowerCase();
      var existing = (DB.investorCompanies || []).find(function(rec){
        if(String(rec.kompaniya || '').trim().toLowerCase() !== companyKey) return false;
        return !String(rec.email || '').trim() && !String(rec.rahbar || '').trim();
      }) || null;
      var rec = upsertFinderContactInvestorRecord(existing, item, emptyContact, meta);
      if(rec){
        if(existing) updated++;
        else added++;
        savedRec = rec;
      }
    } else {
      contacts.forEach(function(contact){
        var existing = findFinderContactInvestorRecord(item, contact);
        var rec = upsertFinderContactInvestorRecord(existing, item, contact, meta);
        if(!rec) return;
        if(existing) updated++;
        else added++;
        if(!savedRec) savedRec = rec; // birinchi saqlangan record bilan partnerlar bog'lanadi
      });
    }
    // Hamkor firmalar — ekspotyor uchun importyorlar; importyor uchun eksportyorlar
    if(savedRec) _attachPartnersToParent(item, savedRec);
  });
  var partnerSuffix = partnersAdded > 0 ? ' · 🤝 ' + partnersAdded + ' ta hamkor firma ham qo\'shildi' : '';
  if(added > 0 && updated > 0){
    toast('✅ '+added+' ta yangi kontakt saqlandi, '+updated+' ta yangilandi!' + partnerSuffix);
  } else if(added > 0){
    toast('✅ '+added+' ta kontakt bazaga saqlandi!' + partnerSuffix);
  } else if(updated > 0){
    toast('✅ Yangi kontakt yo\'q, '+updated+' ta mavjud kontakt yangilandi.' + partnerSuffix);
  } else if(partnersAdded > 0){
    toast('✅ '+partnersAdded+' ta hamkor firma saqlandi.');
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

