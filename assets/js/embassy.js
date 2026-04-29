/* ═══ EMBASSY (ELCHIXONA) SYSTEM ═══ */
var _selectedEmbassyCountry = '';

// Embassy data stored in DB.embassies = [{country:'US',countryName:'Amerika Qo\'shma Shtatlari',uzbEmbassy:{name:'',email:'',address:''},foreignEmbassy:{name:'',email:'',address:''}}]
function getEmbassyDB(){
  if(!DB.embassies) DB.embassies = [];
  return DB.embassies;
}

function getEmbassyForCountry(countryCode){
  var embassies = getEmbassyDB();
  return embassies.find(function(e){ return e.country === countryCode; }) || null;
}

// Country code to name mapping
var _embassyCountryNames = {
  'US':'AQSh','CN':'Xitoy','DE':'Germaniya','GB':'Buyuk Britaniya','FR':'Fransiya',
  'JP':'Yaponiya','KR':'Janubiy Koreya','IN':'Hindiston','TR':'Turkiya','RU':'Rossiya',
  'AE':'BAA','SA':'Saudiya Arabistoni','IT':'Italiya','ES':'Ispaniya','CA':'Kanada',
  'AU':'Avstraliya','BR':'Braziliya','MX':'Meksika','ID':'Indoneziya','TH':'Tailand',
  'MY':'Malayziya','SG':'Singapur','PL':'Polsha','CZ':'Chexiya','AT':'Avstriya',
  'NL':'Niderlandiya','SE':'Shvetsiya','CH':'Shveytsariya','IL':'Isroil','EG':'Misr',
  'KZ':'Qozog\'iston','PK':'Pokiston','BD':'Bangladesh','VN':'Vyetnam','PH':'Filippin'
};

function updateEmbassyButtons(countryCode){
  _selectedEmbassyCountry = countryCode;
  var cName = _embassyCountryNames[countryCode] || countryCode;
  var b1 = document.getElementById('btnEmbassyUzb');
  var b2 = document.getElementById('btnEmbassyForeign');
  var l1 = document.getElementById('btnEmbassyUzbLabel');
  var l2 = document.getElementById('btnEmbassyForeignLabel');
  if(b1 && l1){
    l1.textContent = cName + ' UZB elchixona';
    b1.style.display = 'inline-flex';
  }
  if(b2 && l2){
    l2.textContent = cName + ' xorij elchixona';
    b2.style.display = 'inline-flex';
  }
}

function openEmbassyModal(type){
  var code = _selectedEmbassyCountry;
  if(!code){ toast('⚠️ Avval xaritadan davlat tanlang','error'); return; }
  var cName = _embassyCountryNames[code] || code;
  var embassy = getEmbassyForCountry(code);
  var data = null;
  var title = '';
  var isUzbEmbassy = (type === 'uzb');
  if(isUzbEmbassy){
    title = '🏛️ O\'zbekiston elchixonasi — ' + cName + 'da';
    data = embassy ? embassy.uzbEmbassy : null;
  } else {
    title = '🏛️ ' + cName + ' elchixonasi — O\'zbekistonda';
    data = embassy ? embassy.foreignEmbassy : null;
  }

  // Count companies for this country
  var co = DB.investorCompanies || [];
  var finder = DB.finderResults || [];
  var countryCompanies = co.concat(finder).filter(function(c){
    return typeof matchesCountry === 'function' ? matchesCountry(c.davlat||c.country||'', code) : (String(c.davlat||c.country||'').toLowerCase().indexOf(cName.toLowerCase()) !== -1);
  });

  var emailTo = data ? data.email : '';
  var embName = data ? data.name : '';
  var embAddr = data ? (data.address||'') : '';

  // Generate letter based on embassy type and country language
  var _cisCountries = ['RU','KZ','KG','TJ','BY','AM','AZ','GE','MD','UA','TM'];
  var _cnCountries = ['CN','TW','HK','MO'];
  var isCIS = _cisCountries.indexOf(code) !== -1;
  var isCN = _cnCountries.indexOf(code) !== -1;
  var letterSubject, letterBody;
  var cnt = countryCompanies.length;

  // Iqtisodiy Tahlil cache'dan real raqamlarni o'qiymiz (ai-letter.js'da saqlangan)
  function _fmtUsd(v){
    var n = Number(v) || 0;
    if(n >= 1000000) return (n/1000000).toFixed(2).replace(/\.?0+$/,'') + ' mln';
    if(n >= 1000) return Math.round(n/1000) + ' ming';
    return Math.round(n).toString();
  }
  function _findSavings(breakdown, label){
    if(!Array.isArray(breakdown)) return 0;
    var hit = breakdown.find(function(s){ return String(s.label || '').toLowerCase().indexOf(label.toLowerCase()) !== -1; });
    return hit ? Number(hit.value || 0) : 0;
  }
  var savingsCache = (window._aiSavingsCache && window._aiSavingsCache[String(cName).toLowerCase().trim()]) || null;
  var _solSv = savingsCache ? _findSavings(savingsCache.breakdown, 'soliq') : 0;
  var _wageSv = savingsCache ? _findSavings(savingsCache.breakdown, 'mehnat') : 0;
  var _elSv = savingsCache ? _findSavings(savingsCache.breakdown, 'elektr') : 0;
  var _gasSv = savingsCache ? _findSavings(savingsCache.breakdown, 'gaz') : 0;
  var _trSv = savingsCache ? _findSavings(savingsCache.breakdown, 'transport') : 0;
  var _infraSv = _elSv + _gasSv; // infratuzilma = elektr + gaz
  var _totalSv = savingsCache ? Number(savingsCache.totalAnnualSaving || 0) : 0;
  // Agar cache bo'sh bo'lsa "(...)" placeholder, aks holda real raqam
  var _solStr = _solSv > 0 ? _fmtUsd(_solSv) : '(...)';
  var _wageStr = _wageSv > 0 ? _fmtUsd(_wageSv) : '(...)';
  var _infraStr = _infraSv > 0 ? _fmtUsd(_infraSv) : '(...)';
  var _trStr = _trSv > 0 ? _fmtUsd(_trSv) : '(...)';
  var _totalStr = _totalSv > 0 ? _fmtUsd(_totalSv) : '(...)';

  // BARCHA elchixonalar uchun — yagona rasmiy o'zbekcha shablon
  letterSubject = 'Navoiy viloyatida sanoat investitsiyalari bo\'yicha hamkorlik imkoniyatlari xususida';
  letterBody = 'O\'ZBEKISTON RESPUBLIKASI\n'
    + 'NAVOIY VILOYATI HOKIMLIGI\n'
    + 'INVESTITSIYALAR, SANOAT VA SAVDO BOSHQARMASI\n\n'
    + 'Hurmatli Elchi Janoblari,\n\n'
    + 'Xorijiy investorlarni Navoiy viloyatiga jalb qilish maqsadida olib borilayotgan strategik tahlillar va investitsion muhitni o\'rganish ishlari doirasida ' + cName + ' davlati hududida faoliyat yuritayotgan ' + cnt + ' ta yetakchi kompaniya aniqlangan. (ilova qilinadi)\n\n'
    + 'Aniqlangan kompaniyalar (...) mahsulotlarini ishlab chiqarish sohasida xalqaro miqyosda yetakchi o\'rinni egallab kelmoqda hamda Navoiy viloyatining mineral-xomashyo bazasi va mavjud sanoat infratuzilmasi bilan to\'liq muvofiqligi inobatga olingan holda, ularni viloyatga investor sifatida jalb etish strategik ahamiyatga molikdir.\n\n'
    + 'O\'tkazilgan kompleks iqtisodiy hisob-kitoblarga muvofiq, mazkur kompaniyalar Navoiy viloyatida o\'z ishlab chiqarish quvvatlarini tashkil etib, tayyor mahsulotlarni (...) davlatlariga eksport qilgan taqdirda quyidagi iqtisodiy samaradorlik ko\'rsatkichlari aniqlandi:\n\n'
    + '— soliq imtiyozlari hisobiga ' + _solStr + ' AQSh dollari miqdorida tejam;\n'
    + '— mehnat resurslari xarajatlarida ' + _wageStr + ' AQSh dollari miqdorida iqtisod;\n'
    + '— infratuzilma xarajatlarida ' + _infraStr + ' AQSh dollari miqdorida tejam;\n'
    + '— transport va logistika xarajatlarida ' + _trStr + ' AQSh dollari miqdorida iqtisod.\n\n'
    + 'Umumiy hisobda, mazkur kompaniyalar Navoiy viloyatida o\'z faoliyatini yo\'lga qo\'ygan taqdirda yillik ' + _totalStr + ' AQSh dollari miqdorida iqtisodiy samaraga erishish imkoniyati yaratiladi. Bu esa nafaqat investorlar uchun yuqori daromadlilik, balki ikki davlat o\'rtasidagi savdo-iqtisodiy aloqalarning mustahkamlanishi, Navoiy viloyatida yangi ish o\'rinlarining yaratilishi va mintaqaning eksport salohiyatining kengayishi uchun muhim asos bo\'lib xizmat qiladi.\n\n'
    + 'Yuqoridagilarni inobatga olgan holda, Sizdan mazkur kompaniyalar bilan dastlabki aloqalar o\'rnatishga ko\'maklashishingiz, muzokaralar jarayonida amaliy yordam ko\'rsatishingiz hamda viloyatimiz va xorijiy investorlar o\'rtasida samarali hamkorlik ko\'prigini yaratishda yordam berishingizni so\'raymiz.\n\n'
    + 'Qo\'shimcha ma\'lumotlar va batafsil muzokaralar yuzasidan quyidagi mas\'ul xodim bilan bog\'lanishingiz mumkin:\n\n'
    + 'Navoiy viloyati Investitsiyalar, sanoat va savdo boshqarmasi\n'
    + 'mas\'ul xodimi — Barnoqulov Shahzod\n'
    + 'Elektron pochta: sh.barnokulov@investnavoi.uz\n'
    + 'Telefon: +998 88 890 11 10\n\n'
    + 'Hamkorligimizga ishonch bildirib, Sizga mustahkam sog\'lik va olib borayotgan diplomatik faoliyatingizda muvaffaqiyatlar tilab qolaman.\n\n'
    + 'Hurmat bilan,\n'
    + 'Navoiy viloyati hokimligi';

  // Use cached letter if exists (avoid Gemini cost)
  var _cached = (typeof getEmbassyCache==='function') ? getEmbassyCache(code, type) : null;
  if(_cached && _cached.subject) letterSubject = _cached.subject;
  if(_cached && _cached.body) letterBody = _cached.body;

  // Build modal
  var modalHtml = '<div id="embassyModal" style="position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);animation:fadeIn .2s">'
    + '<div style="background:var(--card);border-radius:16px;width:640px;max-width:92vw;max-height:88vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:0">'
    + '<div style="padding:1.2rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">'
      + '<div style="font-size:1rem;font-weight:700;color:var(--text)">'+title+'</div>'
      + '<button onclick="document.getElementById(\'embassyModal\').remove()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text3)">✕</button>'
    + '</div>'
    + '<div style="padding:1.2rem 1.5rem">'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin-bottom:1rem">'
        + '<div><label style="font-size:.72rem;font-weight:600;color:var(--text3);display:block;margin-bottom:4px">Elchixona nomi</label>'
          + '<input id="emb-name" type="text" value="'+escHtml(embName)+'" placeholder="Elchixona nomi..." style="width:100%;padding:.5rem .7rem;border:1px solid var(--border);border-radius:8px;font-size:.82rem"></div>'
        + '<div><label style="font-size:.72rem;font-weight:600;color:var(--text3);display:block;margin-bottom:4px">Email</label>'
          + '<input id="emb-email" type="email" value="'+escHtml(emailTo)+'" placeholder="embassy@email.com" style="width:100%;padding:.5rem .7rem;border:1px solid var(--border);border-radius:8px;font-size:.82rem"></div>'
      + '</div>'
      + '<div style="margin-bottom:1rem"><label style="font-size:.72rem;font-weight:600;color:var(--text3);display:block;margin-bottom:4px">Manzil</label>'
        + '<input id="emb-address" type="text" value="'+escHtml(embAddr)+'" placeholder="Manzil..." style="width:100%;padding:.5rem .7rem;border:1px solid var(--border);border-radius:8px;font-size:.82rem"></div>'
      + '<div style="margin-bottom:.6rem"><label style="font-size:.72rem;font-weight:600;color:var(--text3);display:block;margin-bottom:4px">Xat mavzusi (Subject)</label>'
        + '<input id="emb-subject" type="text" value="'+escHtml(letterSubject)+'" style="width:100%;padding:.5rem .7rem;border:1px solid var(--border);border-radius:8px;font-size:.82rem"></div>'
      + '<div style="margin-bottom:1rem"><label style="font-size:.72rem;font-weight:600;color:var(--text3);display:block;margin-bottom:4px">Xat matni</label>'
        + '<textarea id="emb-body" rows="8" style="width:100%;padding:.6rem .7rem;border:1px solid var(--border);border-radius:8px;font-size:.8rem;resize:vertical;line-height:1.5">'+escHtml(letterBody)+'</textarea></div>'
      + '<div style="background:var(--bg2);border-radius:10px;padding:.7rem .9rem;margin-bottom:1rem;font-size:.72rem;color:var(--text3)">'
        + '📊 <b>'+cName+'</b> dan bazadagi kompaniyalar: <b>'+countryCompanies.length+'</b> ta'
        + (countryCompanies.length > 0 ? '<br>Top: ' + countryCompanies.slice(0,5).map(function(c){return c.kompaniya||c.name||'';}).join(', ') : '')
      + '</div>'
      + '<div style="display:flex;gap:.5rem;justify-content:flex-end;flex-wrap:wrap">'
        + '<button id="emb-ai-btn" onclick="generateEmbassyAiLetter(\''+code+'\',\''+type+'\')" style="padding:.5rem 1rem;background:#7C3AED;color:#fff;border:none;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer">🤖 AI xat yaratish</button>'
        + '<button onclick="saveEmbassyData(\''+code+'\',\''+type+'\')" style="padding:.5rem 1rem;background:#059669;color:#fff;border:none;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer">💾 Saqlash</button>'
        + '<button onclick="sendEmbassyLetter(\''+code+'\',\''+type+'\')" style="padding:.5rem 1rem;background:#3b82f6;color:#fff;border:none;border-radius:8px;font-size:.8rem;font-weight:600;cursor:pointer">📧 Xat yuborish</button>'
        + '<button onclick="document.getElementById(\'embassyModal\').remove()" style="padding:.5rem 1rem;background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:8px;font-size:.8rem;cursor:pointer">Yopish</button>'
      + '</div>'
    + '</div></div></div>';

  // Remove old modal if exists
  var old = document.getElementById('embassyModal');
  if(old) old.remove();
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  // Auto-generate AI letter on open (or use cache to avoid credits)
  setTimeout(function(){
    if(_cached && _cached.subject && _cached.body){
      if(typeof _attachEmbassyAutoSave === 'function') _attachEmbassyAutoSave(code, type);
      if(typeof toast === 'function') toast('💾 Saqlangan AI xat yuklandi','info');
    } else if(typeof generateEmbassyAiLetter === 'function'){
      generateEmbassyAiLetter(code, type);
    }
  }, 200);
}

function saveEmbassyData(countryCode, type){
  var embassies = getEmbassyDB();
  var existing = embassies.find(function(e){return e.country===countryCode;});
  if(!existing){
    existing = {country:countryCode, countryName:_embassyCountryNames[countryCode]||countryCode, uzbEmbassy:{name:'',email:'',address:''}, foreignEmbassy:{name:'',email:'',address:''}};
    embassies.push(existing);
  }
  var target = type==='uzb' ? 'uzbEmbassy' : 'foreignEmbassy';
  existing[target] = {
    name: (document.getElementById('emb-name')||{}).value||'',
    email: (document.getElementById('emb-email')||{}).value||'',
    address: (document.getElementById('emb-address')||{}).value||''
  };
  DB.embassies = embassies;
  if(typeof saveDB === 'function') saveDB();
  if(typeof fbSaveSettings === 'function') fbSaveSettings(DB.settings);
  toast('✅ Elchixona ma\'lumotlari saqlandi','success');
}

var _embassyAutoSaveTimer = null;
function _attachEmbassyAutoSave(countryCode, type){
  var subjEl = document.getElementById('emb-subject');
  var bodyEl = document.getElementById('emb-body');
  function save(){
    if(_embassyAutoSaveTimer) clearTimeout(_embassyAutoSaveTimer);
    _embassyAutoSaveTimer = setTimeout(function(){
      var prev = getEmbassyCache(countryCode, type) || {};
      setEmbassyCache(countryCode, type, {
        subject: (subjEl && subjEl.value) || '',
        body: (bodyEl && bodyEl.value) || '',
        companyIds: prev.companyIds || '',
        generatedAt: prev.generatedAt || new Date().toISOString(),
        editedAt: new Date().toISOString()
      });
    }, 800);
  }
  if(subjEl && !subjEl._autoSaveAttached){ subjEl.addEventListener('input', save); subjEl._autoSaveAttached = true; }
  if(bodyEl && !bodyEl._autoSaveAttached){ bodyEl.addEventListener('input', save); bodyEl._autoSaveAttached = true; }
}
window._attachEmbassyAutoSave = _attachEmbassyAutoSave;

function embassyMarkKey(countryCode, type){ return countryCode+'|'+type; }
function isCompanyInEmbassyLetter(c, countryCode, type){
  var key = embassyMarkKey(countryCode,type);
  return !!(c.embassyLetters && c.embassyLetters[key]);
}
function getEmbassyCache(code, type){
  var m = (DB.settings && DB.settings.embassyAiCache) || {};
  return m[embassyMarkKey(code,type)] || null;
}
function setEmbassyCache(code, type, payload){
  if(!DB.settings) DB.settings = {};
  if(!DB.settings.embassyAiCache) DB.settings.embassyAiCache = {};
  DB.settings.embassyAiCache[embassyMarkKey(code,type)] = payload;
  if(typeof fbSaveSettings==='function') fbSaveSettings(DB.settings);
}

var _embassyCountryAliases = {
  'US':['aqsh','usa','united states','amerika','u.s.','u.s','america'],
  'CN':['xitoy','china','cn','prc'],
  'DE':['germaniya','germany','deutschland'],
  'GB':['buyuk britaniya','uk','united kingdom','britain','england'],
  'FR':['fransiya','france'],
  'JP':['yaponiya','japan'],
  'KR':['janubiy koreya','south korea','korea'],
  'IN':['hindiston','india'],
  'TR':['turkiya','turkey','türkiye'],
  'RU':['rossiya','russia','российская'],
  'AE':['baa','uae','united arab emirates','emirates'],
  'SA':['saudiya arabistoni','saudi arabia'],
  'IT':['italiya','italy'],
  'ES':['ispaniya','spain'],
  'CA':['kanada','canada'],
  'AU':['avstraliya','australia'],
  'BR':['braziliya','brazil'],
  'MX':['meksika','mexico'],
  'ID':['indoneziya','indonesia'],
  'TH':['tailand','thailand'],
  'MY':['malayziya','malaysia'],
  'SG':['singapur','singapore'],
  'PL':['polsha','poland'],
  'CZ':['chexiya','czech','czechia'],
  'AT':['avstriya','austria'],
  'NL':['niderlandiya','netherlands','holland'],
  'SE':['shvetsiya','sweden'],
  'CH':['shveytsariya','switzerland'],
  'IL':['isroil','israel'],
  'EG':['misr','egypt'],
  'KZ':["qozog'iston",'kazakhstan','kz'],
  'PK':['pokiston','pakistan'],
  'BD':['bangladesh'],
  'VN':['vyetnam','vietnam'],
  'PH':['filippin','philippines']
};
function matchesCountry(text, code){
  var t = String(text||'').toLowerCase();
  if(!t) return false;
  var aliases = _embassyCountryAliases[code] || [];
  aliases = aliases.concat([(_embassyCountryNames[code]||'').toLowerCase(), String(code||'').toLowerCase()]);
  return aliases.filter(Boolean).some(function(a){ return t.indexOf(a) !== -1; });
}

async function generateEmbassyAiLetter(countryCode, type){
  var btn = document.getElementById('emb-ai-btn');
  if(btn){ btn.disabled = true; btn.textContent = '⏳ AI yozmoqda...'; }
  var loadingToast = null;
  // Wait up to 10 seconds for Firebase to load API keys
  for(var w=0; w<20; w++){
    if(typeof getGeminiKey === 'function' && getGeminiKey()) break;
    await new Promise(function(r){setTimeout(r, 500);});
  }
  try {
    if(typeof callGemini !== 'function'){ throw new Error('Gemini funksiyasi topilmadi'); }
    if(typeof getGeminiKey === 'function' && !getGeminiKey()){ throw new Error('Gemini API kalit yo\'q. Sozlamalardan qo\'shing.'); }
    var cName = _embassyCountryNames[countryCode] || countryCode;
    var co = DB.investorCompanies || [];
    var finder = DB.finderResults || [];
    var allByCountry = co.concat(finder).filter(function(c){
      return matchesCountry(c.davlat||c.country||'', countryCode);
    });
    if(!allByCountry.length){ throw new Error(cName+' davlatidan bazada kompaniya topilmadi'); }
    var alreadySent = allByCountry.filter(function(c){ return isCompanyInEmbassyLetter(c, countryCode, type); });
    var all = allByCountry.filter(function(c){ return !isCompanyInEmbassyLetter(c, countryCode, type); });
    if(!all.length){
      toast('ℹ️ Yangi kompaniya yo\'q — barcha '+allByCountry.length+' ta kompaniya oldin xat yuborilgan','info');
      if(btn){ btn.disabled = false; btn.textContent = '🤖 AI xat yaratish'; }
      return;
    }
    window._currentEmbassyCompanies = all;
    var cnt = all.length;

    // Try cache: if cached letter exists for same company set → use cache, no AI call
    var cache = getEmbassyCache(countryCode, type);
    var currentIds = all.map(function(c){return String(c.id);}).sort().join(',');
    if(cache && cache.companyIds === currentIds && cache.subject && cache.body){
      var subjEl = document.getElementById('emb-subject');
      var bodyEl = document.getElementById('emb-body');
      if(subjEl) subjEl.value = cache.subject;
      if(bodyEl) bodyEl.value = cache.body;
      _attachEmbassyAutoSave(countryCode, type);
      toast('💾 Saqlangan AI xat yuklandi (credit ishlatilmadi)','success');
      if(btn){ btn.disabled = false; btn.textContent = '🤖 AI xat yaratish'; }
      return;
    }
    loadingToast = typeof toastLoading === 'function' ? toastLoading('🤖 AI xat yaratilmoqda...') : toast('🤖 AI xat yaratilmoqda...','info');
    var totalUsd = 0;
    var targetCountries = {};
    var industries = {};
    all.forEach(function(c){
      var v = Number(c._tradeAtlasTradeValue || c.import_volume || 0) || 0;
      if(v) totalUsd += v;
      var counter = String(c.description || '').replace(/^Hamkor davlatlar:\s*/i,'');
      counter.split(/[,;]/).map(function(s){return s.trim();}).filter(Boolean).forEach(function(t){
        targetCountries[t] = (targetCountries[t]||0) + 1;
      });
      var s = String(c.soha||'').trim();
      if(s) industries[s] = (industries[s]||0) + 1;
    });
    var targetList = Object.keys(targetCountries).sort(function(a,b){return targetCountries[b]-targetCountries[a];}).slice(0,15);
    var industryList = Object.keys(industries).sort(function(a,b){return industries[b]-industries[a];}).slice(0,8);
    function fmtUsd(n){ if(n>=1e9) return '$'+(n/1e9).toFixed(2)+'B'; if(n>=1e6) return '$'+(n/1e6).toFixed(1)+'M'; if(n>=1e3) return '$'+(n/1e3).toFixed(0)+'K'; return '$'+n; }
    var totalStr = totalUsd ? fmtUsd(totalUsd) : 'noma\'lum';
    var savingsEstimate = totalUsd ? fmtUsd(Math.round(totalUsd * 0.18)) : 'sezilarli qiymatda';
    var isUzbEmbassy = (type === 'uzb');
    var lang = isUzbEmbassy ? 'uz' : (countryCode==='CN' ? 'zh' : (['RU','KZ','KG','TJ','BY','AM','AZ','GE','MD','UA','TM'].indexOf(countryCode)!==-1 ? 'ru' : 'en'));
    var langLabel = {uz:"O'zbek tilida",ru:"Rus tilida (русский язык)",zh:"Xitoy tilida (中文)",en:"Ingliz tilida (English)"}[lang];

    var prodSummary = industryList.length ? industryList.join(', ') : 'sanoat ishlab chiqarish';
    var targetSummary = targetList.length ? targetList.join(', ') : '(...)';
    var prompt = 'Sen Navoiy viloyati Investitsiyalar, sanoat va savdo boshqarmasi nomidan rasmiy diplomatik xat yozadigan tajribali davlat xizmatchisisan. '
      + 'Xat ' + cName + ' davlatining elchixonasiga yo\'llanadi.\n\n'
      + 'XAT QATIY ANIQ SHABLONDA YOZILSIN — har bir paragraf va so\'z shablonga to\'liq mos kelishi kerak. Faqat o\'zbek tilida yoz.\n\n'
      + 'Mana XATning to\'liq matni — har bir (...) ni real ma\'lumot bilan to\'ldirib chiqarish kerak:\n\n'
      + '"""\n'
      + 'O\'ZBEKISTON RESPUBLIKASI\n'
      + 'NAVOIY VILOYATI HOKIMLIGI\n'
      + 'INVESTITSIYALAR, SANOAT VA SAVDO BOSHQARMASI\n\n'
      + 'Hurmatli Elchi Janoblari,\n\n'
      + 'Xorijiy investorlarni Navoiy viloyatiga jalb qilish maqsadida olib borilayotgan strategik tahlillar va investitsion muhitni o\'rganish ishlari doirasida ' + cName + ' davlati hududida faoliyat yuritayotgan ' + cnt + ' ta yetakchi kompaniya aniqlangan. (ilova qilinadi)\n\n'
      + 'Aniqlangan kompaniyalar ' + prodSummary + ' mahsulotlarini ishlab chiqarish sohasida xalqaro miqyosda yetakchi o\'rinni egallab kelmoqda hamda Navoiy viloyatining mineral-xomashyo bazasi va mavjud sanoat infratuzilmasi bilan to\'liq muvofiqligi inobatga olingan holda, ularni viloyatga investor sifatida jalb etish strategik ahamiyatga molikdir.\n\n'
      + 'O\'tkazilgan kompleks iqtisodiy hisob-kitoblarga muvofiq, mazkur kompaniyalar Navoiy viloyatida o\'z ishlab chiqarish quvvatlarini tashkil etib, tayyor mahsulotlarni ' + targetSummary + ' davlatlariga eksport qilgan taqdirda quyidagi iqtisodiy samaradorlik ko\'rsatkichlari aniqlandi:\n\n'
      + '— soliq imtiyozlari hisobiga (...) AQSh dollari miqdorida tejam;\n'
      + '— mehnat resurslari xarajatlarida (...) AQSh dollari miqdorida iqtisod;\n'
      + '— infratuzilma xarajatlarida (...) AQSh dollari miqdorida tejam;\n'
      + '— transport va logistika xarajatlarida (...) AQSh dollari miqdorida iqtisod.\n\n'
      + 'Umumiy hisobda, mazkur kompaniyalar Navoiy viloyatida o\'z faoliyatini yo\'lga qo\'ygan taqdirda yillik ' + (savingsEstimate || '(...)') + ' miqdorida iqtisodiy samaraga erishish imkoniyati yaratiladi. Bu esa nafaqat investorlar uchun yuqori daromadlilik, balki ikki davlat o\'rtasidagi savdo-iqtisodiy aloqalarning mustahkamlanishi, Navoiy viloyatida yangi ish o\'rinlarining yaratilishi va mintaqaning eksport salohiyatining kengayishi uchun muhim asos bo\'lib xizmat qiladi.\n\n'
      + 'Yuqoridagilarni inobatga olgan holda, Sizdan mazkur kompaniyalar bilan dastlabki aloqalar o\'rnatishga ko\'maklashishingiz, muzokaralar jarayonida amaliy yordam ko\'rsatishingiz hamda viloyatimiz va xorijiy investorlar o\'rtasida samarali hamkorlik ko\'prigini yaratishda yordam berishingizni so\'raymiz.\n\n'
      + 'Qo\'shimcha ma\'lumotlar va batafsil muzokaralar yuzasidan quyidagi mas\'ul xodim bilan bog\'lanishingiz mumkin:\n\n'
      + 'Navoiy viloyati Investitsiyalar, sanoat va savdo boshqarmasi\n'
      + 'mas\'ul xodimi — Barnoqulov Shahzod\n'
      + 'Elektron pochta: sh.barnokulov@investnavoi.uz\n'
      + 'Telefon: +998 88 890 11 10\n\n'
      + 'Hamkorligimizga ishonch bildirib, Sizga mustahkam sog\'lik va olib borayotgan diplomatik faoliyatingizda muvaffaqiyatlar tilab qolaman.\n\n'
      + 'Hurmat bilan,\n'
      + 'Navoiy viloyati hokimligi\n'
      + '"""\n\n'
      + 'QATIY QOIDALAR:\n'
      + '- Yuqoridagi shablonga TO\'LIQ rioya qil. Sarlavhani, paragraflarni, tartibni o\'zgartirma.\n'
      + '- Mahsulot turi (...) ni ' + prodSummary + ' bilan to\'ldir.\n'
      + '- Eksport davlatlari ro\'yxati (...) ni ' + targetSummary + ' bilan to\'ldir.\n'
      + '- 4 ta dollar (...) ni real iqtisodiy hisob asosida tahminiy raqamlar bilan to\'ldir (masalan: "1 250 000", "850 000" — son aniq, manba placeholder).\n'
      + '- Yillik umumiy iqtisod summasi: ' + (savingsEstimate || 'tahminiy raqam') + '.\n'
      + '- Markdown YO\'Q (** # * lar yo\'q). Oddiy matn. Emojilar yo\'q.\n'
      + '- Stikerlar, multfilm uslubi YO\'Q. Faqat rasmiy diplomatik ohang.\n'
      + '- Kontakt ma\'lumotlari saqlansin (Barnoqulov Shahzod, sh.barnokulov@investnavoi.uz, +998 88 890 11 10).\n'
      + '- Faqat o\'zbek tilida yoz.\n\n'
      + 'Subject: "Navoiy viloyatida sanoat investitsiyalari bo\'yicha hamkorlik imkoniyatlari xususida"\n\n'
      + 'JAVOB FORMATI: Faqat JSON, boshqa narsa yo\'q: {"subject":"...","body":"..."}';

    var data = await callGemini({
      contents:[{role:'user',parts:[{text: prompt}]}],
      generationConfig:{temperature:0.7}
    });
    var raw = geminiText(data);
    var parsed = null;
    try { parsed = JSON.parse(raw); } catch(e){
      var m = raw.match(/\{[\s\S]*\}/);
      if(m) { try { parsed = JSON.parse(m[0]); } catch(e2){} }
    }
    if(!parsed || !parsed.body){ throw new Error('AI javobidan JSON ajratib olib bo\'lmadi'); }
    var subjEl = document.getElementById('emb-subject');
    var bodyEl = document.getElementById('emb-body');
    if(subjEl && parsed.subject) subjEl.value = parsed.subject;
    if(bodyEl && parsed.body) bodyEl.value = parsed.body;
    setEmbassyCache(countryCode, type, {
      subject: parsed.subject || '',
      body: parsed.body || '',
      companyIds: currentIds,
      generatedAt: new Date().toISOString()
    });
    _attachEmbassyAutoSave(countryCode, type);
    if(typeof toastDone === 'function') toastDone(loadingToast, '✅ AI xat yaratildi va saqlandi ('+cnt+' ta yangi kompaniya)', 'success');
    else toast('✅ AI xat yaratildi va saqlandi ('+cnt+' ta yangi kompaniya)','success');
  } catch(e){
    console.error('Embassy AI error:', e);
    if(typeof toastDone === 'function') toastDone(loadingToast, '❌ AI xato: '+(e.message||e), 'error');
    else toast('❌ AI xato: '+(e.message||e),'error');
  } finally {
    if(btn){ btn.disabled = false; btn.textContent = '🤖 AI xat yaratish'; }
  }
}
window.generateEmbassyAiLetter = generateEmbassyAiLetter;

function markEmbassyCompaniesSent(companies, countryCode, type){
  var key = embassyMarkKey(countryCode, type);
  var stamp = new Date().toISOString();
  (companies||[]).forEach(function(c){
    if(!c.embassyLetters) c.embassyLetters = {};
    c.embassyLetters[key] = stamp;
    if((DB.investorCompanies||[]).some(function(x){return String(x.id)===String(c.id);})){
      if(typeof fbSave==='function') fbSave('investorCompanies', c);
    }
  });
}

function sendEmbassyLetter(countryCode, type){
  var email = (document.getElementById('emb-email')||{}).value;
  var subject = (document.getElementById('emb-subject')||{}).value;
  var body = (document.getElementById('emb-body')||{}).value;
  if(!email){toast('⚠️ Email manzil kiritilmagan','error');return;}
  saveEmbassyData(countryCode, type);
  var companiesToMark = window._currentEmbassyCompanies || [];
  if(typeof emailjs !== 'undefined' && emailjs.send){
    emailjs.send('service_1w08xxe','template_c1nxcvg',{
      to_email: email,
      subject: subject,
      message: body,
      from_name: 'Navoiy EIZ'
    }).then(function(){
      markEmbassyCompaniesSent(companiesToMark, countryCode, type);
      toast('✅ Xat yuborildi: '+email+(companiesToMark.length?(' ('+companiesToMark.length+' ta kompaniya belgilandi)'):''),'success');
      document.getElementById('embassyModal').remove();
      window._currentEmbassyCompanies = null;
    },function(err){
      toast('❌ Xat yuborilmadi: '+err.text,'error');
    });
  } else {
    var mailtoUrl = 'mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    window.open(mailtoUrl);
    markEmbassyCompaniesSent(companiesToMark, countryCode, type);
    toast('📧 Email dasturi ochildi','success');
  }
}
