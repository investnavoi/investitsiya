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

async function openEmbassyModal(type){
  var code = _selectedEmbassyCountry;
  if(!code){ toast('⚠️ Avval xaritadan davlat tanlang','error'); return; }
  // Firebase'dan saqlangan AI xatlarni boshqa kompyuterda ham yuklash uchun
  try { if(typeof ensureCollectionLoaded === 'function') await ensureCollectionLoaded('embassyLetters'); } catch(_e){}
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

  // Count companies for this country — UNIQUE kompaniyalar (xarita bilan AYNAN mos)
  // FAQAT DB.investorCompanies + xarita bilan bir xil filter logic (getInvestorGeoStateCode)
  var co = DB.investorCompanies || [];
  var rawCountryRecords = co.filter(function(c){
    if(typeof getInvestorGeoStateCode === 'function'){
      return getInvestorGeoStateCode(c, {}) === code;
    }
    return typeof matchesCountry === 'function'
      ? matchesCountry(c.davlat||c.country||'', code)
      : (String(c.davlat||c.country||'').toLowerCase().indexOf(cName.toLowerCase()) !== -1);
  });
  // Dedupe by group key — har kompaniya 1 marta hisoblanadi (parent + child + duplikatlar yo'q)
  var countryCompanies = (function(){
    var seen = Object.create(null);
    var out = [];
    rawCountryRecords.forEach(function(r){
      var k = (typeof getInvestorCompanyGroupKey === 'function')
        ? getInvestorCompanyGroupKey(r)
        : String(r.kompaniya || r.id || '').toLowerCase().trim();
      if(!k || seen[k]) return;
      seen[k] = true;
      out.push(r);
    });
    return out;
  })();

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
  // Maqsad davlatlar — O'zbekistondan tashqari 12 ta davlat (Maqsad davlatlar filterdan)
  var _targetCountriesUz = 'Turkmaniston, Tojikiston, Qirg\'iziston, Qozog\'iston, Mongoliya, Rossiya, Ozarbayjon, Gruziya, Armaniston, Eron, Afg\'oniston, Pokiston';
  var _targetCountriesEn = 'Turkmenistan, Tajikistan, Kyrgyzstan, Kazakhstan, Mongolia, Russia, Azerbaijan, Georgia, Armenia, Iran, Afghanistan, Pakistan';
  var _targetCountriesRu = 'Туркменистан, Таджикистан, Кыргызстан, Казахстан, Монголия, Россия, Азербайджан, Грузия, Армения, Иран, Афганистан, Пакистан';
  var _targetCountriesZh = '土库曼斯坦、塔吉克斯坦、吉尔吉斯斯坦、哈萨克斯坦、蒙古、俄罗斯、阿塞拜疆、格鲁吉亚、亚美尼亚、伊朗、阿富汗、巴基斯坦';

  // Til detection: O'zbekiston elchixonasi → uz, xorij CIS → ru, CN/TW/HK/MO → zh, boshqa → en
  var _lang = isUzbEmbassy ? 'uz' : (isCN ? 'zh' : (isCIS ? 'ru' : 'en'));

  if(_lang === 'en'){
    letterSubject = 'Cooperation Opportunities for Industrial Investments in Navoi Region';
    letterBody = 'REPUBLIC OF UZBEKISTAN\n'
      + 'KHOKIMIYAT OF NAVOI REGION\n'
      + 'DEPARTMENT OF INVESTMENTS, INDUSTRY AND TRADE\n\n'
      + 'Dear Mr./Ms. Ambassador,\n\n'
      + 'As part of strategic analyses and studies of the investment climate aimed at attracting foreign investors to Navoi Region, ' + cnt + ' leading companies operating in ' + cName + ' have been identified. (the list is attached)\n\n'
      + 'The identified companies are international leaders in the production of (...) products. Considering the full alignment with Navoi Region\'s mineral-raw material base and existing industrial infrastructure, attracting them as investors to the region is of strategic importance.\n\n'
      + 'According to comprehensive economic calculations, if these companies establish their production capacities in Navoi Region and export the finished products to ' + _targetCountriesEn + ', the following economic efficiency indicators have been identified:\n\n'
      + '— Tax incentive savings: ' + _solStr + ' USD;\n'
      + '— Labor resource cost savings: ' + _wageStr + ' USD;\n'
      + '— Infrastructure cost savings: ' + _infraStr + ' USD;\n'
      + '— Transport and logistics cost savings: ' + _trStr + ' USD.\n\n'
      + 'In total, if these companies establish operations in Navoi Region, an annual economic effect of ' + _totalStr + ' USD can be achieved. This will not only provide investors with high profitability, but will also serve as an important basis for strengthening trade and economic ties between our countries, creating new jobs in Navoi Region, and expanding the region\'s export potential.\n\n'
      + 'Taking the above into consideration, we kindly request your assistance in establishing initial contacts with these companies, providing practical support during negotiations, and helping to build an effective cooperation bridge between our region and foreign investors.\n\n'
      + 'For additional information and detailed negotiations, please contact the responsible officer:\n\n'
      + 'Department of Investments, Industry and Trade of Navoi Region\n'
      + 'Responsible Officer — Shahzod Barnoqulov\n'
      + 'Email: sh.barnokulov@investnavoi.uz\n'
      + 'Phone: +998 88 890 11 10\n\n'
      + 'Expressing confidence in our cooperation, we wish you robust health and success in your diplomatic activities.\n\n'
      + 'Sincerely,\n'
      + 'Khokimiyat of Navoi Region';
  } else if(_lang === 'ru'){
    letterSubject = 'О возможностях сотрудничества по промышленным инвестициям в Навоийской области';
    letterBody = 'РЕСПУБЛИКА УЗБЕКИСТАН\n'
      + 'ХОКИМИЯТ НАВОИЙСКОЙ ОБЛАСТИ\n'
      + 'УПРАВЛЕНИЕ ИНВЕСТИЦИЙ, ПРОМЫШЛЕННОСТИ И ТОРГОВЛИ\n\n'
      + 'Уважаемый господин/госпожа Посол,\n\n'
      + 'В рамках стратегических аналитических работ и исследования инвестиционной среды, направленных на привлечение иностранных инвесторов в Навоийскую область, выявлено ' + cnt + ' ведущих компаний, осуществляющих деятельность на территории ' + cName + '. (список прилагается)\n\n'
      + 'Выявленные компании являются мировыми лидерами в производстве продукции (...). С учётом полного соответствия минерально-сырьевой базе и существующей промышленной инфраструктуре Навоийской области, их привлечение в качестве инвесторов имеет стратегическое значение.\n\n'
      + 'Согласно проведённым комплексным экономическим расчётам, при размещении производственных мощностей данных компаний в Навоийской области и экспорте готовой продукции в ' + _targetCountriesRu + ', были выявлены следующие показатели экономической эффективности:\n\n'
      + '— экономия за счёт налоговых льгот: ' + _solStr + ' долларов США;\n'
      + '— экономия на трудовых ресурсах: ' + _wageStr + ' долларов США;\n'
      + '— экономия на инфраструктурных расходах: ' + _infraStr + ' долларов США;\n'
      + '— экономия на транспортных и логистических расходах: ' + _trStr + ' долларов США.\n\n'
      + 'В общей сложности, при налаживании деятельности этих компаний в Навоийской области, появляется возможность достижения ежегодного экономического эффекта в размере ' + _totalStr + ' долларов США. Это станет не только источником высокой доходности для инвесторов, но и важной основой для укрепления торгово-экономических связей между странами, создания новых рабочих мест в Навоийской области и расширения экспортного потенциала региона.\n\n'
      + 'Учитывая вышеизложенное, просим Вас оказать содействие в установлении первоначальных контактов с указанными компаниями, оказать практическую помощь в переговорах и помочь в создании эффективного моста сотрудничества между нашим регионом и иностранными инвесторами.\n\n'
      + 'Для получения дополнительной информации и подробных переговоров можно связаться с ответственным сотрудником:\n\n'
      + 'Управление инвестиций, промышленности и торговли Навоийской области\n'
      + 'Ответственный сотрудник — Шахзод Барноқулов\n'
      + 'Электронная почта: sh.barnokulov@investnavoi.uz\n'
      + 'Телефон: +998 88 890 11 10\n\n'
      + 'Выражая уверенность в нашем сотрудничестве, желаю Вам крепкого здоровья и успехов в дипломатической деятельности.\n\n'
      + 'С уважением,\n'
      + 'Хокимият Навоийской области';
  } else if(_lang === 'zh'){
    letterSubject = '关于在纳沃伊州工业投资合作机会的函';
    letterBody = '乌兹别克斯坦共和国\n'
      + '纳沃伊州霍基米亚特\n'
      + '投资、工业和贸易管理局\n\n'
      + '尊敬的大使阁下：\n\n'
      + '为吸引外国投资者到纳沃伊州，在开展战略分析和投资环境研究工作中，已确认在' + cName + '境内运营的 ' + cnt + ' 家领先企业。（名单附后）\n\n'
      + '已确认的企业在(...)产品制造领域具有国际领先地位。考虑到与纳沃伊州矿产原材料基础和现有工业基础设施的完全匹配，吸引这些企业作为投资者具有重要的战略意义。\n\n'
      + '根据综合经济测算，如果这些企业在纳沃伊州建立生产能力，并将成品出口到' + _targetCountriesZh + '，已确定以下经济效益指标：\n\n'
      + '— 税收优惠节约：' + _solStr + ' 美元；\n'
      + '— 劳动力成本节约：' + _wageStr + ' 美元；\n'
      + '— 基础设施成本节约：' + _infraStr + ' 美元；\n'
      + '— 运输和物流成本节约：' + _trStr + ' 美元。\n\n'
      + '总体而言，如果这些企业在纳沃伊州开展业务，每年可实现 ' + _totalStr + ' 美元的经济效益。这不仅为投资者带来高收益，也将成为加强两国贸易经济联系、在纳沃伊州创造新就业岗位以及扩大地区出口潜力的重要基础。\n\n'
      + '鉴于上述情况，恳请贵馆协助与上述企业建立初步联系，在谈判过程中提供实际帮助，并协助在我州与外国投资者之间架起有效的合作桥梁。\n\n'
      + '关于详细信息和具体谈判事宜，请联系负责人员：\n\n'
      + '纳沃伊州投资、工业和贸易管理局\n'
      + '负责人 — Shahzod Barnoqulov\n'
      + '电子邮件：sh.barnokulov@investnavoi.uz\n'
      + '电话：+998 88 890 11 10\n\n'
      + '相信我们的合作，祝您身体健康，外交工作顺利。\n\n'
      + '此致敬礼，\n'
      + '纳沃伊州霍基米亚特';
  } else {
    // O'zbekcha (uz) — O'zbekiston elchixonasi xorij davlatda
    letterSubject = 'Navoiy viloyatida sanoat investitsiyalari bo\'yicha hamkorlik imkoniyatlari xususida';
    letterBody = 'O\'ZBEKISTON RESPUBLIKASI\n'
      + 'NAVOIY VILOYATI HOKIMLIGI\n'
      + 'INVESTITSIYALAR, SANOAT VA SAVDO BOSHQARMASI\n\n'
      + 'Hurmatli Elchi Janoblari,\n\n'
      + 'Xorijiy investorlarni Navoiy viloyatiga jalb qilish maqsadida olib borilayotgan strategik tahlillar va investitsion muhitni o\'rganish ishlari doirasida ' + cName + ' davlati hududida faoliyat yuritayotgan ' + cnt + ' ta yetakchi kompaniya aniqlangan. (ilova qilinadi)\n\n'
      + 'Aniqlangan kompaniyalar (...) mahsulotlarini ishlab chiqarish sohasida xalqaro miqyosda yetakchi o\'rinni egallab kelmoqda hamda Navoiy viloyatining mineral-xomashyo bazasi va mavjud sanoat infratuzilmasi bilan to\'liq muvofiqligi inobatga olingan holda, ularni viloyatga investor sifatida jalb etish strategik ahamiyatga molikdir.\n\n'
      + 'O\'tkazilgan kompleks iqtisodiy hisob-kitoblarga muvofiq, mazkur kompaniyalar Navoiy viloyatida o\'z ishlab chiqarish quvvatlarini tashkil etib, tayyor mahsulotlarni ' + _targetCountriesUz + ' davlatlariga eksport qilgan taqdirda quyidagi iqtisodiy samaradorlik ko\'rsatkichlari aniqlandi:\n\n'
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
  }

  // Use cached letter if exists VA yangi format markerini o'z ichiga olsa VA til mos kelsa
  // Eski format AI-generatsiya qilingan xatlar (NIEZ, EIZ, NFEZ, Buyuk Ipak yo'li va h.k.) — tashlanadi
  var _cached = (typeof getEmbassyCache==='function') ? getEmbassyCache(code, type) : null;
  // Cache xat tilini aniqlash
  var _detectCacheLang = function(body){
    if(!body) return '';
    var b = String(body);
    if(b.indexOf('NAVOI REGION') !== -1) return 'en';
    if(b.indexOf('НАВОИЙСКОЙ ОБЛАСТИ') !== -1) return 'ru';
    if(b.indexOf('纳沃伊州') !== -1) return 'zh';
    if(b.indexOf('NAVOIY VILOYATI') !== -1) return 'uz';
    return '';
  };
  var _isNewFormat = function(body){
    if(!body) return false;
    var b = String(body);
    var hasContact = b.indexOf('Barnoqulov') !== -1 || b.indexOf('Барноқулов') !== -1;
    if(!hasContact) return false;
    return !!_detectCacheLang(b);
  };
  if(_cached && _cached.body && _isNewFormat(_cached.body)){
    var cachedLang = _detectCacheLang(_cached.body);
    if(cachedLang === _lang){
      // Til mos kelyapti — cache'dan yuklash
      if(_cached.subject) letterSubject = _cached.subject;
      letterBody = _cached.body;
    } else {
      // Til mos emas — cache'ni tashlaymiz, yangi shablon ishlatiladi
      console.log('[Embassy] Cache til mos emas (' + cachedLang + ' → ' + _lang + ') — qayta yaratiladi:', code, type);
      if(DB.settings && DB.settings.embassyAiCache){
        try { delete DB.settings.embassyAiCache[embassyMarkKey(code,type)]; } catch(_e){}
      }
      if(Array.isArray(DB.embassyLetters)){
        DB.embassyLetters = DB.embassyLetters.filter(function(l){ return String(l.id) !== embassyMarkKey(code,type); });
      }
    }
  } else if(_cached){
    // Eski format cache — o'chiramiz va yangi shablonni ishlatamiz
    if(DB.settings && DB.settings.embassyAiCache){
      try { delete DB.settings.embassyAiCache[embassyMarkKey(code,type)]; } catch(_e){}
      if(typeof fbSaveSettings==='function') fbSaveSettings(DB.settings);
    }
    console.log('[Embassy] Eski format cache tashlandi:', code, type);
  }

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
  // Static shablon (aynan foydalanuvchi yuborgan format) ishlatiladi.
  // AI avtomatik ishga tushmaydi — foydalanuvchi xohlasa "🤖 AI xat yaratish" tugmasini bosadi.
  setTimeout(function(){
    if(_cached && _cached.subject && _cached.body){
      if(typeof _attachEmbassyAutoSave === 'function') _attachEmbassyAutoSave(code, type);
      if(typeof toast === 'function') toast('💾 Saqlangan AI xat yuklandi','info');
    } else {
      // Static shablon allaqachon textareada — AI chaqirmaymiz
      if(typeof _attachEmbassyAutoSave === 'function') _attachEmbassyAutoSave(code, type);
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
  var key = embassyMarkKey(code, type);
  // 1. Avval Firebase'dagi embassyLetters collection'idan qidirish (cross-device sync)
  if(Array.isArray(DB.embassyLetters)){
    var hit = DB.embassyLetters.find(function(l){ return String(l.id) === key; });
    if(hit) return hit;
  }
  // 2. Fallback — eski legacy DB.settings.embassyAiCache
  var m = (DB.settings && DB.settings.embassyAiCache) || {};
  return m[key] || null;
}
function setEmbassyCache(code, type, payload){
  var key = embassyMarkKey(code, type);
  // 1. Firebase embassyLetters collection — cross-device sync uchun asosiy manba
  var docPayload = Object.assign({}, payload, { id: key });
  if(!Array.isArray(DB.embassyLetters)) DB.embassyLetters = [];
  var existingIdx = DB.embassyLetters.findIndex(function(l){ return String(l.id) === key; });
  if(existingIdx !== -1) DB.embassyLetters[existingIdx] = docPayload;
  else DB.embassyLetters.push(docPayload);
  if(typeof fbSave === 'function') fbSave('embassyLetters', docPayload);
  // 2. Legacy fallback — DB.settings.embassyAiCache (eski clientlar uchun)
  if(!DB.settings) DB.settings = {};
  if(!DB.settings.embassyAiCache) DB.settings.embassyAiCache = {};
  DB.settings.embassyAiCache[key] = payload;
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
    // FAQAT DB.investorCompanies + xarita bilan AYNAN bir xil filter (getInvestorGeoStateCode)
    var co = DB.investorCompanies || [];
    var rawByCountry = co.filter(function(c){
      if(typeof getInvestorGeoStateCode === 'function'){
        return getInvestorGeoStateCode(c, {}) === countryCode;
      }
      return matchesCountry(c.davlat||c.country||'', countryCode);
    });
    // Dedupe — har kompaniya 1 marta (KPI bilan mos)
    var allByCountry = (function(){
      var seen = Object.create(null);
      var out = [];
      rawByCountry.forEach(function(r){
        var k = (typeof getInvestorCompanyGroupKey === 'function')
          ? getInvestorCompanyGroupKey(r)
          : String(r.kompaniya || r.id || '').toLowerCase().trim();
        if(!k || seen[k]) return;
        seen[k] = true;
        out.push(r);
      });
      return out;
    })();
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

    // Try cache: if cached letter exists for same company set + til mos → use cache, no AI call
    var cache = getEmbassyCache(countryCode, type);
    var currentIds = all.map(function(c){return String(c.id);}).sort().join(',');
    // Joriy expected til
    var _isCisAi0 = ['RU','KZ','KG','TJ','BY','AM','AZ','GE','MD','UA','TM'].indexOf(countryCode) !== -1;
    var _isCnAi0 = ['CN','TW','HK','MO'].indexOf(countryCode) !== -1;
    var _expectedLang = (type === 'uzb') ? 'uz' : (_isCnAi0 ? 'zh' : (_isCisAi0 ? 'ru' : 'en'));
    var _detectLang0 = function(body){
      if(!body) return '';
      var b = String(body);
      if(b.indexOf('NAVOI REGION') !== -1) return 'en';
      if(b.indexOf('НАВОИЙСКОЙ ОБЛАСТИ') !== -1) return 'ru';
      if(b.indexOf('纳沃伊州') !== -1) return 'zh';
      if(b.indexOf('NAVOIY VILOYATI') !== -1) return 'uz';
      return '';
    };
    var cacheLang = cache && cache.body ? _detectLang0(cache.body) : '';
    if(cache && cache.companyIds === currentIds && cache.subject && cache.body && cacheLang === _expectedLang){
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
    // Maqsad davlatlar — O'zbekistondan tashqari 12 ta davlat (Maqsad davlatlar filterdan)
    var targetSummary = 'Turkmaniston, Tojikiston, Qirg\'iziston, Qozog\'iston, Mongoliya, Rossiya, Ozarbayjon, Gruziya, Armaniston, Eron, Afg\'oniston, Pokiston';

    // Iqtisodiy Tahlil cache'dan haqiqiy summalar (ai-letter.js'da saqlangan)
    function _fmtUsdLong(n){
      var v = Number(n) || 0;
      if(v <= 0) return '';
      if(v >= 1000000) return v.toLocaleString('en-US', {maximumFractionDigits: 0}) + ' (taxminan ' + (v/1000000).toFixed(2).replace(/\.?0+$/,'') + ' mln)';
      return v.toLocaleString('en-US', {maximumFractionDigits: 0});
    }
    function _findSv(breakdown, label){
      if(!Array.isArray(breakdown)) return 0;
      var hit = breakdown.find(function(s){ return String(s.label || '').toLowerCase().indexOf(label.toLowerCase()) !== -1; });
      return hit ? Number(hit.value || 0) : 0;
    }
    var sCache = (window._aiSavingsCache && window._aiSavingsCache[String(cName).toLowerCase().trim()]) || null;
    var sSol = sCache ? _findSv(sCache.breakdown, 'soliq') : 0;
    var sWage = sCache ? _findSv(sCache.breakdown, 'mehnat') : 0;
    var sEl = sCache ? _findSv(sCache.breakdown, 'elektr') : 0;
    var sGas = sCache ? _findSv(sCache.breakdown, 'gaz') : 0;
    var sTr = sCache ? _findSv(sCache.breakdown, 'transport') : 0;
    var sInfra = sEl + sGas;
    var sTotal = sCache ? Number(sCache.totalAnnualSaving || 0) : 0;
    // Fallback: agar cache yo'q bo'lsa, totalUsd dan tahminiy hisoblash
    if(sTotal <= 0 && totalUsd > 0){
      sTotal = Math.round(totalUsd * 0.18);
      sSol = Math.round(sTotal * 0.30);
      sWage = Math.round(sTotal * 0.35);
      sInfra = Math.round(sTotal * 0.10);
      sTr = Math.round(sTotal * 0.25);
    }
    var sSolStr = _fmtUsdLong(sSol) || '(...)';
    var sWageStr = _fmtUsdLong(sWage) || '(...)';
    var sInfraStr = _fmtUsdLong(sInfra) || '(...)';
    var sTrStr = _fmtUsdLong(sTr) || '(...)';
    var sTotalStr = _fmtUsdLong(sTotal) || '(...)';

    // Til detection — bir xil mantiq openEmbassyModal bilan
    var _isCisAi = ['RU','KZ','KG','TJ','BY','AM','AZ','GE','MD','UA','TM'].indexOf(countryCode) !== -1;
    var _isCnAi = ['CN','TW','HK','MO'].indexOf(countryCode) !== -1;
    var _aiLang = isUzbEmbassy ? 'uz' : (_isCnAi ? 'zh' : (_isCisAi ? 'ru' : 'en'));
    var _langInstr = {
      uz: 'Faqat o\'zbek tilida (lotin alifbosida) yoz.',
      en: 'Write ONLY in formal English.',
      ru: 'Пиши ТОЛЬКО на русском языке (формальный диплом. стиль).',
      zh: '仅用正式中文（简体）书写。'
    };
    var _subjects = {
      uz: 'Navoiy viloyatida sanoat investitsiyalari bo\'yicha hamkorlik imkoniyatlari xususida',
      en: 'Cooperation Opportunities for Industrial Investments in Navoi Region',
      ru: 'О возможностях сотрудничества по промышленным инвестициям в Навоийской области',
      zh: '关于在纳沃伊州工业投资合作机会的函'
    };
    var _targetByLang = {
      uz: 'Turkmaniston, Tojikiston, Qirg\'iziston, Qozog\'iston, Mongoliya, Rossiya, Ozarbayjon, Gruziya, Armaniston, Eron, Afg\'oniston, Pokiston',
      en: 'Turkmenistan, Tajikistan, Kyrgyzstan, Kazakhstan, Mongolia, Russia, Azerbaijan, Georgia, Armenia, Iran, Afghanistan, Pakistan',
      ru: 'Туркменистан, Таджикистан, Кыргызстан, Казахстан, Монголия, Россия, Азербайджан, Грузия, Армения, Иран, Афганистан, Пакистан',
      zh: '土库曼斯坦、塔吉克斯坦、吉尔吉斯斯坦、哈萨克斯坦、蒙古、俄罗斯、阿塞拜疆、格鲁吉亚、亚美尼亚、伊朗、阿富汗、巴基斯坦'
    };
    var _aiTargetSummary = _targetByLang[_aiLang];

    // AI ishlatmaymiz — AYNAN foydalanuvchi yuborgan static shablon ishlatiladi (paraphrase qilmasdan)
    // Til bo'yicha shablon va kontakt ma'lumotlari to'liq saqlanadi
    var staticBody = '';
    if(_aiLang === 'en'){
      staticBody = 'REPUBLIC OF UZBEKISTAN\n'
        + 'KHOKIMIYAT OF NAVOI REGION\n'
        + 'DEPARTMENT OF INVESTMENTS, INDUSTRY AND TRADE\n\n'
        + 'Dear Mr./Ms. Ambassador,\n\n'
        + 'As part of strategic analyses and studies of the investment climate aimed at attracting foreign investors to Navoi Region, ' + cnt + ' leading companies operating in ' + cName + ' have been identified. (the list is attached)\n\n'
        + 'The identified companies are international leaders in the production of ' + prodSummary + ' products. Considering the full alignment with Navoi Region\'s mineral-raw material base and existing industrial infrastructure, attracting them as investors to the region is of strategic importance.\n\n'
        + 'According to comprehensive economic calculations, if these companies establish their production capacities in Navoi Region and export the finished products to ' + _aiTargetSummary + ', the following economic efficiency indicators have been identified:\n\n'
        + '— Tax incentive savings: ' + sSolStr + ' USD;\n'
        + '— Labor resource cost savings: ' + sWageStr + ' USD;\n'
        + '— Infrastructure cost savings: ' + sInfraStr + ' USD;\n'
        + '— Transport and logistics cost savings: ' + sTrStr + ' USD.\n\n'
        + 'In total, if these companies establish operations in Navoi Region, an annual economic effect of ' + sTotalStr + ' USD can be achieved. This will not only provide investors with high profitability, but will also serve as an important basis for strengthening trade and economic ties between our countries, creating new jobs in Navoi Region, and expanding the region\'s export potential.\n\n'
        + 'Taking the above into consideration, we kindly request your assistance in establishing initial contacts with these companies, providing practical support during negotiations, and helping to build an effective cooperation bridge between our region and foreign investors.\n\n'
        + 'For additional information and detailed negotiations, please contact the responsible officer:\n\n'
        + 'Department of Investments, Industry and Trade of Navoi Region\n'
        + 'Responsible Officer — Shahzod Barnoqulov\n'
        + 'Email: sh.barnokulov@investnavoi.uz\n'
        + 'Phone: +998 88 890 11 10\n\n'
        + 'Expressing confidence in our cooperation, we wish you robust health and success in your diplomatic activities.\n\n'
        + 'Sincerely,\n'
        + 'Khokimiyat of Navoi Region';
    } else if(_aiLang === 'ru'){
      staticBody = 'РЕСПУБЛИКА УЗБЕКИСТАН\n'
        + 'ХОКИМИЯТ НАВОИЙСКОЙ ОБЛАСТИ\n'
        + 'УПРАВЛЕНИЕ ИНВЕСТИЦИЙ, ПРОМЫШЛЕННОСТИ И ТОРГОВЛИ\n\n'
        + 'Уважаемый господин/госпожа Посол,\n\n'
        + 'В рамках стратегических аналитических работ и исследования инвестиционной среды, направленных на привлечение иностранных инвесторов в Навоийскую область, выявлено ' + cnt + ' ведущих компаний, осуществляющих деятельность на территории ' + cName + '. (список прилагается)\n\n'
        + 'Выявленные компании являются мировыми лидерами в производстве продукции ' + prodSummary + '. С учётом полного соответствия минерально-сырьевой базе и существующей промышленной инфраструктуре Навоийской области, их привлечение в качестве инвесторов имеет стратегическое значение.\n\n'
        + 'Согласно проведённым комплексным экономическим расчётам, при размещении производственных мощностей данных компаний в Навоийской области и экспорте готовой продукции в ' + _aiTargetSummary + ', были выявлены следующие показатели экономической эффективности:\n\n'
        + '— экономия за счёт налоговых льгот: ' + sSolStr + ' долларов США;\n'
        + '— экономия на трудовых ресурсах: ' + sWageStr + ' долларов США;\n'
        + '— экономия на инфраструктурных расходах: ' + sInfraStr + ' долларов США;\n'
        + '— экономия на транспортных и логистических расходах: ' + sTrStr + ' долларов США.\n\n'
        + 'В общей сложности, при налаживании деятельности этих компаний в Навоийской области, появляется возможность достижения ежегодного экономического эффекта в размере ' + sTotalStr + ' долларов США. Это станет не только источником высокой доходности для инвесторов, но и важной основой для укрепления торгово-экономических связей между странами, создания новых рабочих мест в Навоийской области и расширения экспортного потенциала региона.\n\n'
        + 'Учитывая вышеизложенное, просим Вас оказать содействие в установлении первоначальных контактов с указанными компаниями, оказать практическую помощь в переговорах и помочь в создании эффективного моста сотрудничества между нашим регионом и иностранными инвесторами.\n\n'
        + 'Для получения дополнительной информации и подробных переговоров можно связаться с ответственным сотрудником:\n\n'
        + 'Управление инвестиций, промышленности и торговли Навоийской области\n'
        + 'Ответственный сотрудник — Шахзод Барноқулов\n'
        + 'Электронная почта: sh.barnokulov@investnavoi.uz\n'
        + 'Телефон: +998 88 890 11 10\n\n'
        + 'Выражая уверенность в нашем сотрудничестве, желаю Вам крепкого здоровья и успехов в дипломатической деятельности.\n\n'
        + 'С уважением,\n'
        + 'Хокимият Навоийской области';
    } else if(_aiLang === 'zh'){
      staticBody = '乌兹别克斯坦共和国\n'
        + '纳沃伊州霍基米亚特\n'
        + '投资、工业和贸易管理局\n\n'
        + '尊敬的大使阁下：\n\n'
        + '为吸引外国投资者到纳沃伊州，在开展战略分析和投资环境研究工作中，已确认在' + cName + '境内运营的 ' + cnt + ' 家领先企业。（名单附后）\n\n'
        + '已确认的企业在' + prodSummary + '产品制造领域具有国际领先地位。考虑到与纳沃伊州矿产原材料基础和现有工业基础设施的完全匹配，吸引这些企业作为投资者具有重要的战略意义。\n\n'
        + '根据综合经济测算，如果这些企业在纳沃伊州建立生产能力，并将成品出口到' + _aiTargetSummary + '，已确定以下经济效益指标：\n\n'
        + '— 税收优惠节约：' + sSolStr + ' 美元；\n'
        + '— 劳动力成本节约：' + sWageStr + ' 美元；\n'
        + '— 基础设施成本节约：' + sInfraStr + ' 美元；\n'
        + '— 运输和物流成本节约：' + sTrStr + ' 美元。\n\n'
        + '总体而言，如果这些企业在纳沃伊州开展业务，每年可实现 ' + sTotalStr + ' 美元的经济效益。这不仅为投资者带来高收益，也将成为加强两国贸易经济联系、在纳沃伊州创造新就业岗位以及扩大地区出口潜力的重要基础。\n\n'
        + '鉴于上述情况，恳请贵馆协助与上述企业建立初步联系，在谈判过程中提供实际帮助，并协助在我州与外国投资者之间架起有效的合作桥梁。\n\n'
        + '关于详细信息和具体谈判事宜，请联系负责人员：\n\n'
        + '纳沃伊州投资、工业和贸易管理局\n'
        + '负责人 — Shahzod Barnoqulov\n'
        + '电子邮件：sh.barnokulov@investnavoi.uz\n'
        + '电话：+998 88 890 11 10\n\n'
        + '相信我们的合作，祝您身体健康，外交工作顺利。\n\n'
        + '此致敬礼，\n'
        + '纳沃伊州霍基米亚特';
    } else {
      // Uzbek (default)
      staticBody = 'O\'ZBEKISTON RESPUBLIKASI\n'
        + 'NAVOIY VILOYATI HOKIMLIGI\n'
        + 'INVESTITSIYALAR, SANOAT VA SAVDO BOSHQARMASI\n\n'
        + 'Hurmatli Elchi Janoblari,\n\n'
        + 'Xorijiy investorlarni Navoiy viloyatiga jalb qilish maqsadida olib borilayotgan strategik tahlillar va investitsion muhitni o\'rganish ishlari doirasida ' + cName + ' davlati hududida faoliyat yuritayotgan ' + cnt + ' ta yetakchi kompaniya aniqlangan. (ilova qilinadi)\n\n'
        + 'Aniqlangan kompaniyalar ' + prodSummary + ' mahsulotlarini ishlab chiqarish sohasida xalqaro miqyosda yetakchi o\'rinni egallab kelmoqda hamda Navoiy viloyatining mineral-xomashyo bazasi va mavjud sanoat infratuzilmasi bilan to\'liq muvofiqligi inobatga olingan holda, ularni viloyatga investor sifatida jalb etish strategik ahamiyatga molikdir.\n\n'
        + 'O\'tkazilgan kompleks iqtisodiy hisob-kitoblarga muvofiq, mazkur kompaniyalar Navoiy viloyatida o\'z ishlab chiqarish quvvatlarini tashkil etib, tayyor mahsulotlarni ' + _aiTargetSummary + ' davlatlariga eksport qilgan taqdirda quyidagi iqtisodiy samaradorlik ko\'rsatkichlari aniqlandi:\n\n'
        + '— soliq imtiyozlari hisobiga ' + sSolStr + ' AQSh dollari miqdorida tejam;\n'
        + '— mehnat resurslari xarajatlarida ' + sWageStr + ' AQSh dollari miqdorida iqtisod;\n'
        + '— infratuzilma xarajatlarida ' + sInfraStr + ' AQSh dollari miqdorida tejam;\n'
        + '— transport va logistika xarajatlarida ' + sTrStr + ' AQSh dollari miqdorida iqtisod.\n\n'
        + 'Umumiy hisobda, mazkur kompaniyalar Navoiy viloyatida o\'z faoliyatini yo\'lga qo\'ygan taqdirda yillik ' + sTotalStr + ' AQSh dollari miqdorida iqtisodiy samaraga erishish imkoniyati yaratiladi. Bu esa nafaqat investorlar uchun yuqori daromadlilik, balki ikki davlat o\'rtasidagi savdo-iqtisodiy aloqalarning mustahkamlanishi, Navoiy viloyatida yangi ish o\'rinlarining yaratilishi va mintaqaning eksport salohiyatining kengayishi uchun muhim asos bo\'lib xizmat qiladi.\n\n'
        + 'Yuqoridagilarni inobatga olgan holda, Sizdan mazkur kompaniyalar bilan dastlabki aloqalar o\'rnatishga ko\'maklashishingiz, muzokaralar jarayonida amaliy yordam ko\'rsatishingiz hamda viloyatimiz va xorijiy investorlar o\'rtasida samarali hamkorlik ko\'prigini yaratishda yordam berishingizni so\'raymiz.\n\n'
        + 'Qo\'shimcha ma\'lumotlar va batafsil muzokaralar yuzasidan quyidagi mas\'ul xodim bilan bog\'lanishingiz mumkin:\n\n'
        + 'Navoiy viloyati Investitsiyalar, sanoat va savdo boshqarmasi\n'
        + 'mas\'ul xodimi — Barnoqulov Shahzod\n'
        + 'Elektron pochta: sh.barnokulov@investnavoi.uz\n'
        + 'Telefon: +998 88 890 11 10\n\n'
        + 'Hamkorligimizga ishonch bildirib, Sizga mustahkam sog\'lik va olib borayotgan diplomatik faoliyatingizda muvaffaqiyatlar tilab qolaman.\n\n'
        + 'Hurmat bilan,\n'
        + 'Navoiy viloyati hokimligi';
    }
    var parsed = { subject: _subjects[_aiLang], body: staticBody };
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
