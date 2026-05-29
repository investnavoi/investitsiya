/* ═══════════════════════════════════════
   M4: AI LETTER GENERATOR
═══════════════════════════════════════ */
var AI_COUNTRY_API_BASE = 'https://navoiy-api-proxy.vercel.app/api';
var AI_COUNTRY_ANALYSIS_CACHE = {};
var AI_PRODUCT_TARIFF_CACHE = {};
var AI_LS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Cache schema version — bump when changing analysis structure (e.g. tax override). Older cached entries are ignored.
var AI_CACHE_SCHEMA_VERSION = 'corptax-v1';

// Hydrate caches from localStorage on load — country/tariff data rarely changes
(function hydrateAiCachesFromLs(){
  try {
    // Schema version check — drop incompatible cache on bump
    var savedVer = localStorage.getItem('_aiCacheSchemaVer');
    if(savedVer !== AI_CACHE_SCHEMA_VERSION){
      localStorage.removeItem('_aiCountryCache');
      localStorage.removeItem('_aiTariffCache');
      localStorage.setItem('_aiCacheSchemaVer', AI_CACHE_SCHEMA_VERSION);
      console.log('🔄 AI cache schema bumped → cleared old cache');
      return;
    }
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

// Barcha davlatlar uchun rasmiy mehnat haqi ma'lumotlari (USD/oy, manufacturing avg)
// Manba: World Bank, ILOSTAT, OECD, national statistics offices (2023-2024)
var WAGE_FALLBACK_USD = {
  // Shimoliy Amerika
  'United States': { value: 5800, year: 2024, source: 'U.S. BLS (Manufacturing avg)' },
  'Canada': { value: 5200, year: 2024, source: 'StatCan (Manufacturing avg)' },
  'Mexico': { value: 800, year: 2024, source: 'INEGI (Manufacturing avg)' },
  // Yevropa - G'arbiy
  'Germany': { value: 4800, year: 2024, source: 'Destatis (Manufacturing avg)' },
  'France': { value: 3800, year: 2024, source: 'INSEE (Manufacturing avg)' },
  'United Kingdom': { value: 4200, year: 2024, source: 'ONS UK (Manufacturing avg)' },
  'Italy': { value: 3200, year: 2024, source: 'ISTAT (Manufacturing avg)' },
  'Spain': { value: 2400, year: 2024, source: 'INE Spain (Manufacturing avg)' },
  'Netherlands': { value: 4200, year: 2024, source: 'CBS NL (Manufacturing avg)' },
  'Belgium': { value: 4000, year: 2024, source: 'Statbel (Manufacturing avg)' },
  'Switzerland': { value: 8000, year: 2024, source: 'Swiss FSO (Manufacturing avg)' },
  'Austria': { value: 4000, year: 2024, source: 'Statistics Austria (Manufacturing avg)' },
  'Ireland': { value: 4500, year: 2024, source: 'CSO Ireland (Manufacturing avg)' },
  'Portugal': { value: 1500, year: 2024, source: 'INE Portugal (Manufacturing avg)' },
  'Luxembourg': { value: 5500, year: 2024, source: 'STATEC (Manufacturing avg)' },
  'Greece': { value: 1500, year: 2024, source: 'ELSTAT (Manufacturing avg)' },
  // Yevropa - Shimoliy
  'Sweden': { value: 4500, year: 2024, source: 'SCB Sweden (Manufacturing avg)' },
  'Norway': { value: 6000, year: 2024, source: 'SSB Norway (Manufacturing avg)' },
  'Denmark': { value: 6500, year: 2024, source: 'DST Denmark (Manufacturing avg)' },
  'Finland': { value: 4200, year: 2024, source: 'Statistics Finland (Manufacturing avg)' },
  'Iceland': { value: 5500, year: 2024, source: 'Statistics Iceland (Manufacturing avg)' },
  // Yevropa - Sharqiy
  'Poland': { value: 1800, year: 2024, source: 'GUS Poland (Manufacturing avg)' },
  'Czech Republic': { value: 2000, year: 2024, source: 'CZSO (Manufacturing avg)' },
  'Czechia': { value: 2000, year: 2024, source: 'CZSO (Manufacturing avg)' },
  'Hungary': { value: 1500, year: 2024, source: 'KSH Hungary (Manufacturing avg)' },
  'Slovakia': { value: 1500, year: 2024, source: 'SO SR (Manufacturing avg)' },
  'Slovenia': { value: 2200, year: 2024, source: 'SURS Slovenia (Manufacturing avg)' },
  'Romania': { value: 1500, year: 2024, source: 'INSSE Romania (Manufacturing avg)' },
  'Bulgaria': { value: 1100, year: 2024, source: 'NSI Bulgaria (Manufacturing avg)' },
  'Croatia': { value: 1500, year: 2024, source: 'DZS Croatia (Manufacturing avg)' },
  'Estonia': { value: 2000, year: 2024, source: 'Stat Estonia (Manufacturing avg)' },
  'Latvia': { value: 1700, year: 2024, source: 'Stat Latvia (Manufacturing avg)' },
  'Lithuania': { value: 1900, year: 2024, source: 'Stat Lithuania (Manufacturing avg)' },
  'Cyprus': { value: 2000, year: 2024, source: 'CYSTAT (Manufacturing avg)' },
  'Malta': { value: 2000, year: 2024, source: 'NSO Malta (Manufacturing avg)' },
  // MDH / Eurasia
  'Russia': { value: 750, year: 2024, source: 'Rosstat (Manufacturing avg)' },
  'Ukraine': { value: 500, year: 2024, source: 'State Stat UA (Manufacturing avg)' },
  'Belarus': { value: 600, year: 2024, source: 'Belstat (Manufacturing avg)' },
  'Kazakhstan': { value: 750, year: 2024, source: 'Stat KZ (Manufacturing avg)' },
  'Azerbaijan': { value: 500, year: 2024, source: 'SSC AZ (Manufacturing avg)' },
  'Armenia': { value: 450, year: 2024, source: 'Armstat (Manufacturing avg)' },
  'Georgia': { value: 500, year: 2024, source: 'Geostat (Manufacturing avg)' },
  'Moldova': { value: 500, year: 2024, source: 'Statistica Moldova (Manufacturing avg)' },
  'Kyrgyzstan': { value: 250, year: 2024, source: 'NSC KG (Manufacturing avg)' },
  'Tajikistan': { value: 200, year: 2024, source: 'TajStat (Manufacturing avg)' },
  'Turkmenistan': { value: 300, year: 2024, source: 'World Bank estimate' },
  // Sharqiy Osiyo
  'China': { value: 1300, year: 2024, source: 'NBS China (Manufacturing avg)' },
  'Japan': { value: 2800, year: 2024, source: 'Stat Japan (Manufacturing avg)' },
  'South Korea': { value: 3200, year: 2024, source: 'KOSIS (Manufacturing avg)' },
  'North Korea': { value: 100, year: 2024, source: 'World Bank estimate' },
  'Mongolia': { value: 500, year: 2024, source: 'NSO Mongolia (Manufacturing avg)' },
  'Hong Kong': { value: 3200, year: 2024, source: 'C&SD HK (Manufacturing avg)' },
  'Taiwan': { value: 2800, year: 2024, source: 'DGBAS Taiwan (Manufacturing avg)' },
  // Janubi-Sharqiy Osiyo
  'Thailand': { value: 600, year: 2024, source: 'NSO Thailand (Manufacturing avg)' },
  'Vietnam': { value: 350, year: 2024, source: 'GSO Vietnam (Manufacturing avg)' },
  'Indonesia': { value: 350, year: 2024, source: 'BPS Indonesia (Manufacturing avg)' },
  'Malaysia': { value: 850, year: 2024, source: 'DOSM Malaysia (Manufacturing avg)' },
  'Philippines': { value: 350, year: 2024, source: 'PSA (Manufacturing avg)' },
  'Singapore': { value: 4500, year: 2024, source: 'MOM Singapore (Manufacturing avg)' },
  'Cambodia': { value: 300, year: 2024, source: 'NIS Cambodia (Manufacturing avg)' },
  'Laos': { value: 250, year: 2024, source: 'LSB (Manufacturing avg)' },
  'Myanmar': { value: 200, year: 2024, source: 'CSO Myanmar (Manufacturing avg)' },
  'Brunei': { value: 2500, year: 2024, source: 'DEPS Brunei (Manufacturing avg)' },
  'Timor-Leste': { value: 200, year: 2024, source: 'World Bank estimate' },
  // Janubiy Osiyo
  'India': { value: 350, year: 2024, source: 'MoSPI India (Manufacturing avg)' },
  'Pakistan': { value: 250, year: 2024, source: 'PBS Pakistan (Manufacturing avg)' },
  'Bangladesh': { value: 200, year: 2024, source: 'BBS Bangladesh (Manufacturing avg)' },
  'Sri Lanka': { value: 250, year: 2024, source: 'DCS SL (Manufacturing avg)' },
  'Nepal': { value: 200, year: 2024, source: 'CBS Nepal (Manufacturing avg)' },
  'Bhutan': { value: 350, year: 2024, source: 'NSB Bhutan (Manufacturing avg)' },
  'Maldives': { value: 800, year: 2024, source: 'NBS Maldives (Manufacturing avg)' },
  'Afghanistan': { value: 150, year: 2024, source: 'World Bank estimate' },
  // Yaqin Sharq
  'United Arab Emirates': { value: 3800, year: 2024, source: 'UAE FCSC (Manufacturing avg)' },
  'Saudi Arabia': { value: 3500, year: 2024, source: 'GASTAT (Manufacturing avg)' },
  'Israel': { value: 4500, year: 2024, source: 'CBS Israel (Manufacturing avg)' },
  'Qatar': { value: 4200, year: 2024, source: 'PSA Qatar (Manufacturing avg)' },
  'Kuwait': { value: 3800, year: 2024, source: 'CSB Kuwait (Manufacturing avg)' },
  'Oman': { value: 2500, year: 2024, source: 'NCSI Oman (Manufacturing avg)' },
  'Bahrain': { value: 2500, year: 2024, source: 'iGA Bahrain (Manufacturing avg)' },
  'Iran': { value: 350, year: 2024, source: 'SCI Iran (Manufacturing avg)' },
  'Iraq': { value: 600, year: 2024, source: 'CSO Iraq (Manufacturing avg)' },
  'Jordan': { value: 700, year: 2024, source: 'DOS Jordan (Manufacturing avg)' },
  'Lebanon': { value: 400, year: 2024, source: 'CAS Lebanon (Manufacturing avg)' },
  'Syria': { value: 100, year: 2024, source: 'World Bank estimate' },
  'Yemen': { value: 200, year: 2024, source: 'World Bank estimate' },
  'Turkey': { value: 850, year: 2024, source: 'TurkStat (Manufacturing avg)' },
  'Türkiye': { value: 850, year: 2024, source: 'TurkStat (Manufacturing avg)' },
  // Shimoliy Afrika
  'Egypt': { value: 200, year: 2024, source: 'CAPMAS Egypt (Manufacturing avg)' },
  'Morocco': { value: 400, year: 2024, source: 'HCP Morocco (Manufacturing avg)' },
  'Algeria': { value: 400, year: 2024, source: 'ONS Algeria (Manufacturing avg)' },
  'Tunisia': { value: 400, year: 2024, source: 'INS Tunisia (Manufacturing avg)' },
  'Libya': { value: 400, year: 2024, source: 'BSC Libya (Manufacturing avg)' },
  'Sudan': { value: 200, year: 2024, source: 'CBS Sudan (Manufacturing avg)' },
  // Sharqiy Afrika
  'Kenya': { value: 300, year: 2024, source: 'KNBS Kenya (Manufacturing avg)' },
  'Tanzania': { value: 200, year: 2024, source: 'NBS Tanzania (Manufacturing avg)' },
  'Ethiopia': { value: 100, year: 2024, source: 'CSA Ethiopia (Manufacturing avg)' },
  'Uganda': { value: 150, year: 2024, source: 'UBOS Uganda (Manufacturing avg)' },
  'Rwanda': { value: 200, year: 2024, source: 'NISR Rwanda (Manufacturing avg)' },
  'Mozambique': { value: 200, year: 2024, source: 'INE Mozambique (Manufacturing avg)' },
  // Markaziy Afrika
  'Cameroon': { value: 200, year: 2024, source: 'NIS Cameroon (Manufacturing avg)' },
  'Congo (DR)': { value: 150, year: 2024, source: 'World Bank estimate' },
  'DR Congo': { value: 150, year: 2024, source: 'World Bank estimate' },
  'Congo': { value: 250, year: 2024, source: 'World Bank estimate' },
  // G'arbiy Afrika
  'Nigeria': { value: 200, year: 2024, source: 'NBS Nigeria (Manufacturing avg)' },
  'Ghana': { value: 250, year: 2024, source: 'GSS Ghana (Manufacturing avg)' },
  'Senegal': { value: 250, year: 2024, source: 'ANSD Senegal (Manufacturing avg)' },
  'Cote d\'Ivoire': { value: 250, year: 2024, source: 'INS CI (Manufacturing avg)' },
  // Janubiy Afrika
  'South Africa': { value: 1200, year: 2024, source: 'StatsSA (Manufacturing avg)' },
  'Angola': { value: 300, year: 2024, source: 'INE Angola (Manufacturing avg)' },
  'Namibia': { value: 800, year: 2024, source: 'NSA Namibia (Manufacturing avg)' },
  'Botswana': { value: 600, year: 2024, source: 'Stats Botswana (Manufacturing avg)' },
  'Zimbabwe': { value: 250, year: 2024, source: 'ZIMSTAT (Manufacturing avg)' },
  'Zambia': { value: 300, year: 2024, source: 'ZamStats (Manufacturing avg)' },
  'Madagascar': { value: 100, year: 2024, source: 'INSTAT MG (Manufacturing avg)' },
  // Janubiy Amerika
  'Brazil': { value: 700, year: 2024, source: 'IBGE Brazil (Manufacturing avg)' },
  'Argentina': { value: 800, year: 2024, source: 'INDEC (Manufacturing avg)' },
  'Chile': { value: 1200, year: 2024, source: 'INE Chile (Manufacturing avg)' },
  'Colombia': { value: 500, year: 2024, source: 'DANE (Manufacturing avg)' },
  'Peru': { value: 600, year: 2024, source: 'INEI (Manufacturing avg)' },
  'Venezuela': { value: 200, year: 2024, source: 'INE Venezuela (Manufacturing avg)' },
  'Ecuador': { value: 500, year: 2024, source: 'INEC Ecuador (Manufacturing avg)' },
  'Uruguay': { value: 1500, year: 2024, source: 'INE Uruguay (Manufacturing avg)' },
  'Paraguay': { value: 600, year: 2024, source: 'DGEEC (Manufacturing avg)' },
  'Bolivia': { value: 400, year: 2024, source: 'INE Bolivia (Manufacturing avg)' },
  'Guyana': { value: 600, year: 2024, source: 'BoSGuyana (Manufacturing avg)' },
  'Suriname': { value: 500, year: 2024, source: 'ABS Suriname (Manufacturing avg)' },
  // Markaziy Amerika
  'Costa Rica': { value: 800, year: 2024, source: 'INEC CR (Manufacturing avg)' },
  'Panama': { value: 1000, year: 2024, source: 'INEC Panama (Manufacturing avg)' },
  'Guatemala': { value: 400, year: 2024, source: 'INE Guatemala (Manufacturing avg)' },
  'Honduras': { value: 400, year: 2024, source: 'INE Honduras (Manufacturing avg)' },
  'El Salvador': { value: 400, year: 2024, source: 'DIGESTYC (Manufacturing avg)' },
  'Nicaragua': { value: 350, year: 2024, source: 'INIDE (Manufacturing avg)' },
  'Belize': { value: 600, year: 2024, source: 'SIB Belize (Manufacturing avg)' },
  'Cuba': { value: 100, year: 2024, source: 'ONEI Cuba (Manufacturing avg)' },
  'Dominican Republic': { value: 500, year: 2024, source: 'BCRD (Manufacturing avg)' },
  'Haiti': { value: 200, year: 2024, source: 'IHSI Haiti (Manufacturing avg)' },
  'Jamaica': { value: 600, year: 2024, source: 'STATIN (Manufacturing avg)' },
  'Trinidad and Tobago': { value: 1200, year: 2024, source: 'CSO TT (Manufacturing avg)' },
  // Okeaniya
  'Australia': { value: 5500, year: 2024, source: 'ABS (Manufacturing avg)' },
  'New Zealand': { value: 4200, year: 2024, source: 'Stats NZ (Manufacturing avg)' },
  'Fiji': { value: 600, year: 2024, source: 'FBoS Fiji (Manufacturing avg)' },
  'Papua New Guinea': { value: 600, year: 2024, source: 'NSO PNG (Manufacturing avg)' }
};

/* ═══════════════════════════════════════════════════════════════
   INDUSTRIAL ELECTRICITY PRICE FALLBACK — USD/MWh, industrial users.
   Source: IEA World Energy Prices 2023-2024, GlobalPetrolPrices.com,
   national energy regulators. Used when API returns null for electricity.
═══════════════════════════════════════════════════════════════ */
var ELECTRICITY_PRICE_FALLBACK_USD_MWH = {
  // Shimoliy Amerika
  'United States':      { value: 78,  year: 2024, source: 'EIA (industrial avg)' },
  'Canada':             { value: 65,  year: 2024, source: 'NEB Canada (industrial avg)' },
  'Mexico':             { value: 95,  year: 2024, source: 'CFE Mexico (industrial)' },
  // Yevropa
  'Germany':            { value: 185, year: 2024, source: 'IEA/BDEW (industrial)' },
  'France':             { value: 115, year: 2024, source: 'IEA/RTE (industrial)' },
  'United Kingdom':     { value: 190, year: 2024, source: 'IEA/Ofgem (industrial)' },
  'Italy':              { value: 175, year: 2024, source: 'IEA/ARERA (industrial)' },
  'Spain':              { value: 145, year: 2024, source: 'IEA/CNMC (industrial)' },
  'Netherlands':        { value: 180, year: 2024, source: 'IEA/ACM (industrial)' },
  'Belgium':            { value: 185, year: 2024, source: 'IEA/CREG (industrial)' },
  'Switzerland':        { value: 130, year: 2024, source: 'IEA/ElCom (industrial)' },
  'Austria':            { value: 160, year: 2024, source: 'IEA/E-Control (industrial)' },
  'Sweden':             { value: 85,  year: 2024, source: 'IEA/Energimarknadsinspekt.' },
  'Norway':             { value: 65,  year: 2024, source: 'IEA/NVE (industrial)' },
  'Denmark':            { value: 145, year: 2024, source: 'IEA/Energistyrelsen' },
  'Finland':            { value: 95,  year: 2024, source: 'IEA/Energy Authority (FI)' },
  'Poland':             { value: 130, year: 2024, source: 'IEA/URE Poland (industrial)' },
  'Czech Republic':     { value: 135, year: 2024, source: 'IEA/ERU CZ (industrial)' },
  'Czechia':            { value: 135, year: 2024, source: 'IEA/ERU CZ (industrial)' },
  'Hungary':            { value: 100, year: 2024, source: 'IEA/MEKH (industrial)' },
  'Portugal':           { value: 155, year: 2024, source: 'IEA/ERSE (industrial)' },
  'Greece':             { value: 145, year: 2024, source: 'IEA/RAE (industrial)' },
  'Romania':            { value: 110, year: 2024, source: 'ANRE Romania (industrial)' },
  'Turkey':             { value: 100, year: 2024, source: 'IEA/EPDK (industrial)' },
  // MDH / Eurasia
  'Russia':             { value: 45,  year: 2024, source: 'FAS Russia (industrial)' },
  'Kazakhstan':         { value: 52,  year: 2024, source: 'KOREM (industrial)' },
  'Ukraine':            { value: 75,  year: 2024, source: 'NEURC Ukraine (industrial)' },
  'Uzbekistan':         { value: 40,  year: 2024, source: 'Uzbekenergo (state-subsidised industrial)' },
  'Azerbaijan':         { value: 60,  year: 2024, source: 'Azerenerji (industrial)' },
  'Georgia':            { value: 70,  year: 2024, source: 'GNERC (industrial)' },
  'Armenia':            { value: 80,  year: 2024, source: 'PSRC Armenia (industrial)' },
  'Turkmenistan':       { value: 30,  year: 2024, source: 'World Bank estimate' },
  'Tajikistan':         { value: 25,  year: 2024, source: 'Barqi Tojik (subsidised)' },
  'Kyrgyzstan':         { value: 28,  year: 2024, source: 'JSC ElecrS (industrial)' },
  'Mongolia':           { value: 65,  year: 2024, source: 'ERC Mongolia (industrial)' },
  'Belarus':            { value: 70,  year: 2024, source: 'MEPNR Belarus (industrial)' },
  // Sharqiy Osiyo
  'China':              { value: 68,  year: 2024, source: 'NDRC China (industrial avg)' },
  'Japan':              { value: 145, year: 2024, source: 'IEA/METI Japan (industrial)' },
  'South Korea':        { value: 95,  year: 2024, source: 'IEA/KEPCO (industrial)' },
  'Taiwan':             { value: 80,  year: 2024, source: 'Taipower (industrial)' },
  'Hong Kong':          { value: 150, year: 2024, source: 'CLP/HKE (industrial)' },
  // Janubi-Sharqiy Osiyo
  'India':              { value: 85,  year: 2024, source: 'CEA India (industrial avg)' },
  'Pakistan':           { value: 110, year: 2024, source: 'NEPRA Pakistan (industrial)' },
  'Bangladesh':         { value: 90,  year: 2024, source: 'BERC (industrial)' },
  'Indonesia':          { value: 80,  year: 2024, source: 'PLN (industrial B2/B3)' },
  'Malaysia':           { value: 65,  year: 2024, source: 'Tenaga Nasional (industrial)' },
  'Thailand':           { value: 85,  year: 2024, source: 'EGAT/MEA (industrial)' },
  'Vietnam':            { value: 75,  year: 2024, source: 'EVN (industrial Tier 3)' },
  'Philippines':        { value: 130, year: 2024, source: 'ERC Philippines (industrial)' },
  'Singapore':          { value: 155, year: 2024, source: 'EMA Singapore (industrial)' },
  // Yaqin Sharq
  'Saudi Arabia':       { value: 65,  year: 2024, source: 'SEC (industrial — subsidised)' },
  'UAE':                { value: 75,  year: 2024, source: 'DEWA/ADWEA (industrial)' },
  'United Arab Emirates': { value: 75, year: 2024, source: 'DEWA/ADWEA (industrial)' },
  'Israel':             { value: 95,  year: 2024, source: 'IEC Israel (industrial)' },
  'Qatar':              { value: 55,  year: 2024, source: 'KAHRAMAA (industrial)' },
  'Kuwait':             { value: 12,  year: 2024, source: 'MEW Kuwait (subsidised)' },
  'Iran':               { value: 20,  year: 2024, source: 'Tavanir (heavily subsidised)' },
  'Iraq':               { value: 55,  year: 2024, source: 'MoE Iraq (industrial)' },
  'Jordan':             { value: 115, year: 2024, source: 'EMRC Jordan (industrial)' },
  // Afrika
  'South Africa':       { value: 110, year: 2024, source: 'Eskom (industrial Megaflex)' },
  'Egypt':              { value: 55,  year: 2024, source: 'EETC (industrial — subsidised)' },
  'Nigeria':            { value: 85,  year: 2024, source: 'NERC Nigeria (industrial)' },
  'Kenya':              { value: 120, year: 2024, source: 'EPRA Kenya (industrial)' },
  'Morocco':            { value: 100, year: 2024, source: 'ANRE Morocco (industrial)' },
  'Ethiopia':           { value: 50,  year: 2024, source: 'EEP Ethiopia (industrial)' },
  'Ghana':              { value: 95,  year: 2024, source: 'PURC Ghana (industrial)' },
  // Janubiy Amerika
  'Brazil':             { value: 78,  year: 2024, source: 'ANEEL (industrial avg)' },
  'Argentina':          { value: 65,  year: 2024, source: 'ENRE (industrial — subsidised)' },
  'Chile':              { value: 120, year: 2024, source: 'CNE Chile (industrial)' },
  'Colombia':           { value: 85,  year: 2024, source: 'CREG Colombia (industrial)' },
  'Peru':               { value: 100, year: 2024, source: 'Osinergmin (industrial)' },
  // Okeaniya
  'Australia':          { value: 128, year: 2024, source: 'IEA/AEMO (industrial avg across states)' },
  'New Zealand':        { value: 105, year: 2024, source: 'IEA/Electricity Authority NZ' }
};

/* ═══════════════════════════════════════════════════════════════
   MANUFACTURING WAGE OVERRIDES — USD/month, manufacturing sector.
   Source: ILO Global Wage Report 2024, national statistics bureaus.
   These ALWAYS override ILOSTAT "all-sector" averages which use
   inconsistent methodologies across countries and produce misleading
   cross-country ratios.  Manufacturing-specific data is what
   investors actually compare.
═══════════════════════════════════════════════════════════════ */
var MANUFACTURING_WAGE_OVERRIDE_USD = {
  // USD/month, manufacturing sector only
  'United States':   { value: 4200, year: 2024, source: 'BLS Manufacturing (avg hourly × 160h)' },
  'Canada':          { value: 3400, year: 2024, source: 'Stats Canada (manufacturing avg)' },
  'Germany':         { value: 3800, year: 2024, source: 'Destatis (manufacturing avg)' },
  'France':          { value: 2900, year: 2024, source: 'INSEE (manufacturing avg)' },
  'United Kingdom':  { value: 2800, year: 2024, source: 'ONS (manufacturing avg)' },
  'Italy':           { value: 2400, year: 2024, source: 'Istat (manufacturing avg)' },
  'Spain':           { value: 2100, year: 2024, source: 'INE Spain (manufacturing avg)' },
  'Netherlands':     { value: 3500, year: 2024, source: 'CBS Netherlands (manufacturing)' },
  'Sweden':          { value: 3600, year: 2024, source: 'SCB (manufacturing avg)' },
  'Switzerland':     { value: 5500, year: 2024, source: 'BFS (manufacturing avg)' },
  'Australia':       { value: 3600, year: 2024, source: 'ABS (manufacturing sector avg)' },
  'New Zealand':     { value: 2600, year: 2024, source: 'Stats NZ (manufacturing avg)' },
  'Japan':           { value: 2500, year: 2024, source: 'MHLW Japan (manufacturing avg)' },
  'South Korea':     { value: 2600, year: 2024, source: 'KOSIS (manufacturing avg)' },
  'China':           { value: 800,  year: 2024, source: 'NBS China (manufacturing avg)' },
  'India':           { value: 250,  year: 2024, source: 'PLFS India (manufacturing avg)' },
  'Turkey':          { value: 700,  year: 2024, source: 'TurkStat (manufacturing avg)' },
  'Brazil':          { value: 600,  year: 2024, source: 'IBGE (manufacturing avg)' },
  'Mexico':          { value: 450,  year: 2024, source: 'INEGI (manufacturing avg)' },
  'Russia':          { value: 700,  year: 2024, source: 'Rosstat (manufacturing avg)' },
  'Kazakhstan':      { value: 500,  year: 2024, source: 'BNS RK (manufacturing avg)' },
  'Saudi Arabia':    { value: 1800, year: 2024, source: 'GASTAT (manufacturing avg)' },
  'UAE':             { value: 1600, year: 2024, source: 'FCSC (manufacturing avg)' },
  'United Arab Emirates': { value: 1600, year: 2024, source: 'FCSC (manufacturing avg)' },
  'Poland':          { value: 1400, year: 2024, source: 'GUS Poland (manufacturing avg)' },
  'Czech Republic':  { value: 1600, year: 2024, source: 'CZSO (manufacturing avg)' },
  'Czechia':         { value: 1600, year: 2024, source: 'CZSO (manufacturing avg)' },
  'Romania':         { value: 900,  year: 2024, source: 'INS Romania (manufacturing avg)' },
  'Hungary':         { value: 1100, year: 2024, source: 'KSH Hungary (manufacturing avg)' },
  'Indonesia':       { value: 280,  year: 2024, source: 'BPS Indonesia (manufacturing avg)' },
  'Malaysia':        { value: 700,  year: 2024, source: 'DOSM (manufacturing avg)' },
  'Thailand':        { value: 450,  year: 2024, source: 'NSO Thailand (manufacturing avg)' },
  'Vietnam':         { value: 280,  year: 2024, source: 'GSO Vietnam (manufacturing avg)' },
  'Bangladesh':      { value: 120,  year: 2024, source: 'BBS (manufacturing avg)' },
  'Pakistan':        { value: 150,  year: 2024, source: 'PBS Pakistan (manufacturing avg)' },
  'Egypt':           { value: 200,  year: 2024, source: 'CAPMAS (manufacturing avg)' },
  'South Africa':    { value: 1200, year: 2024, source: 'StatsSA (manufacturing avg)' },
  'Nigeria':         { value: 200,  year: 2024, source: 'NBS Nigeria (manufacturing avg)' },
  'Ukraine':         { value: 450,  year: 2024, source: 'Ukrstat (manufacturing avg)' },
  'Israel':          { value: 3200, year: 2024, source: 'CBS Israel (manufacturing avg)' },
  'Uzbekistan':      { value: 320,  year: 2024, source: 'stat.uz (manufacturing avg, ~4M UZS/month)' }
};

/* ═══════════════════════════════════════════════════════════════
   GDP PER CAPITA — current USD, World Bank 2023.
   Used when World Bank API returns null for a country.
═══════════════════════════════════════════════════════════════ */
var GDP_PER_CAPITA_FALLBACK_USD = {
  'United States': { value: 82000, year: 2023, source: 'World Bank' },
  'Germany':       { value: 54300, year: 2023, source: 'World Bank' },
  'France':        { value: 46000, year: 2023, source: 'World Bank' },
  'United Kingdom':{ value: 48900, year: 2023, source: 'World Bank' },
  'Japan':         { value: 33800, year: 2023, source: 'World Bank' },
  'South Korea':   { value: 33100, year: 2023, source: 'World Bank' },
  'China':         { value: 12700, year: 2023, source: 'World Bank' },
  'India':         { value: 2600,  year: 2023, source: 'World Bank' },
  'Australia':     { value: 64400, year: 2023, source: 'World Bank' },
  'Canada':        { value: 53400, year: 2023, source: 'World Bank' },
  'Italy':         { value: 36800, year: 2023, source: 'World Bank' },
  'Spain':         { value: 32900, year: 2023, source: 'World Bank' },
  'Netherlands':   { value: 64600, year: 2023, source: 'World Bank' },
  'Sweden':        { value: 61900, year: 2023, source: 'World Bank' },
  'Switzerland':   { value: 99600, year: 2023, source: 'World Bank' },
  'Norway':        { value: 107500,year: 2023, source: 'World Bank' },
  'Denmark':       { value: 70100, year: 2023, source: 'World Bank' },
  'Finland':       { value: 55800, year: 2023, source: 'World Bank' },
  'Austria':       { value: 58100, year: 2023, source: 'World Bank' },
  'Belgium':       { value: 55000, year: 2023, source: 'World Bank' },
  'Ireland':       { value: 103300,year: 2023, source: 'World Bank' },
  'Portugal':      { value: 26100, year: 2023, source: 'World Bank' },
  'Poland':        { value: 18900, year: 2023, source: 'World Bank' },
  'Czech Republic':{ value: 27900, year: 2023, source: 'World Bank' },
  'Czechia':       { value: 27900, year: 2023, source: 'World Bank' },
  'Hungary':       { value: 18700, year: 2023, source: 'World Bank' },
  'Romania':       { value: 16500, year: 2023, source: 'World Bank' },
  'Turkey':        { value: 13800, year: 2023, source: 'World Bank' },
  'Russia':        { value: 13100, year: 2023, source: 'World Bank' },
  'Ukraine':       { value: 4660,  year: 2023, source: 'World Bank' },
  'Kazakhstan':    { value: 10800, year: 2023, source: 'World Bank' },
  'Azerbaijan':    { value: 6600,  year: 2023, source: 'World Bank' },
  'Georgia':       { value: 7200,  year: 2023, source: 'World Bank' },
  'Armenia':       { value: 7100,  year: 2023, source: 'World Bank' },
  'Uzbekistan':    { value: 2300,  year: 2023, source: 'World Bank' },
  'Saudi Arabia':  { value: 30400, year: 2023, source: 'World Bank' },
  'UAE':           { value: 49900, year: 2023, source: 'World Bank' },
  'United Arab Emirates':{ value: 49900, year: 2023, source: 'World Bank' },
  'Israel':        { value: 52200, year: 2023, source: 'World Bank' },
  'Qatar':         { value: 83900, year: 2023, source: 'World Bank' },
  'Kuwait':        { value: 35100, year: 2023, source: 'World Bank' },
  'Singapore':     { value: 84500, year: 2023, source: 'World Bank' },
  'Hong Kong':     { value: 52700, year: 2023, source: 'World Bank' },
  'Taiwan':        { value: 35600, year: 2023, source: 'World Bank' },
  'Indonesia':     { value: 4900,  year: 2023, source: 'World Bank' },
  'Malaysia':      { value: 11700, year: 2023, source: 'World Bank' },
  'Thailand':      { value: 7200,  year: 2023, source: 'World Bank' },
  'Vietnam':       { value: 4300,  year: 2023, source: 'World Bank' },
  'Bangladesh':    { value: 2400,  year: 2023, source: 'World Bank' },
  'Pakistan':      { value: 1600,  year: 2023, source: 'World Bank' },
  'South Africa':  { value: 6700,  year: 2023, source: 'World Bank' },
  'Egypt':         { value: 3800,  year: 2023, source: 'World Bank' },
  'Nigeria':       { value: 2100,  year: 2023, source: 'World Bank' },
  'Brazil':        { value: 10100, year: 2023, source: 'World Bank' },
  'Mexico':        { value: 11000, year: 2023, source: 'World Bank' },
  'Argentina':     { value: 13700, year: 2023, source: 'World Bank' },
  'Chile':         { value: 17300, year: 2023, source: 'World Bank' },
  'Colombia':      { value: 6900,  year: 2023, source: 'World Bank' },
  'Peru':          { value: 7200,  year: 2023, source: 'World Bank' },
  'New Zealand':   { value: 48700, year: 2023, source: 'World Bank' }
};

/* ═══════════════════════════════════════════════════════════════
   INDUSTRY SHARE OF GDP — % (includes manufacturing + mining + utilities).
   Source: World Bank NV.IND.TOTL.ZS 2022-2023.
   Used when World Bank API returns null.
═══════════════════════════════════════════════════════════════ */
var INDUSTRY_SHARE_FALLBACK_PCT = {
  'United States':  { value: 18.3, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Germany':        { value: 26.7, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'France':         { value: 17.2, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'United Kingdom': { value: 18.0, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Japan':          { value: 29.2, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'South Korea':    { value: 32.6, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'China':          { value: 38.3, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'India':          { value: 26.0, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Australia':      { value: 25.6, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Canada':         { value: 23.7, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Italy':          { value: 22.9, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Spain':          { value: 20.2, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Netherlands':    { value: 18.8, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Sweden':         { value: 22.0, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Switzerland':    { value: 25.4, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Turkey':         { value: 27.9, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Russia':         { value: 32.3, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Kazakhstan':     { value: 33.5, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Saudi Arabia':   { value: 44.8, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'UAE':            { value: 47.4, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'United Arab Emirates': { value: 47.4, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Poland':         { value: 30.9, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Czech Republic': { value: 33.6, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Czechia':        { value: 33.6, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Romania':        { value: 28.0, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Indonesia':      { value: 39.8, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Malaysia':       { value: 38.1, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Thailand':       { value: 35.6, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Vietnam':        { value: 37.9, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Bangladesh':     { value: 25.0, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Pakistan':       { value: 19.2, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'South Africa':   { value: 24.8, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Egypt':          { value: 32.9, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Nigeria':        { value: 25.1, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Uzbekistan':     { value: 28.3, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Ukraine':        { value: 23.1, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Israel':         { value: 17.6, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Singapore':      { value: 24.8, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Brazil':         { value: 19.9, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Mexico':         { value: 31.0, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' },
  'Chile':          { value: 31.1, year: 2022, source: 'World Bank NV.IND.TOTL.ZS' }
};

/* ═══════════════════════════════════════════════════════════════
   UZBEKISTAN MFN IMPORT TARIFF RATES — by HS Chapter (2-digit).
   Source: O'zbekiston Respublikasi VMQ 28.12.2021 №748 va
   keyingi o'zgartirishlar (2022-2024).
   NOTE: These are the tariffs UZBEKISTAN charges on IMPORTS.
   Not to be confused with what foreign countries charge on UZB exports.
═══════════════════════════════════════════════════════════════ */
var UZB_MFN_TARIFF_BY_HS_CHAPTER = {
  '01': 5,  '02': 20, '03': 15, '04': 20, '05': 5,
  '06': 20, '07': 15, '08': 15, '09': 10, '10': 5,
  '11': 15, '12': 5,  '13': 5,  '14': 5,  '15': 15,
  '16': 30, '17': 20, '18': 30, '19': 30, '20': 25,
  '21': 25, '22': 30, '23': 10, '24': 50, '25': 0,
  '26': 0,  '27': 0,  '28': 5,  '29': 5,  '30': 0,
  '31': 0,  '32': 10, '33': 15, '34': 15, '35': 5,
  '36': 10, '37': 5,  '38': 5,  '39': 15, '40': 10,
  '41': 10, '42': 20, '43': 10, '44': 10, '45': 15,
  '46': 15, '47': 0,  '48': 10, '49': 0,  '50': 5,
  '51': 5,  '52': 10, '53': 5,  '54': 10, '55': 10,
  '56': 15, '57': 20, '58': 15, '59': 15, '60': 10,
  '61': 20, '62': 20, '63': 20, '64': 30, '65': 25,
  '66': 25, '67': 25, '68': 10, '69': 15, '70': 15,
  '71': 5,  '72': 5,  '73': 10, '74': 10, '75': 5,
  '76': 10, '78': 5,  '79': 5,  '80': 5,  '81': 5,
  '82': 10, '83': 15, '84': 0,  '85': 5,  '86': 10,
  '87': 20, '88': 10, '89': 20, '90': 5,  '91': 15,
  '92': 15, '93': 5,  '94': 15, '95': 15, '96': 15,
  '97': 5,  '99': 0
};

/* ═══════════════════════════════════════════════════════════════
   CORPORATE INCOME TAX RATES — realistic, investor-relevant figures.
   These OVERRIDE the World Bank "Tax revenue / GDP" indicator, which is
   misleading (~11% for the US is the country's total tax/GDP, not the
   corporate income tax an investor would actually pay).
   Source: OECD Corporate Tax Statistics, KPMG Corporate Tax Survey,
   PwC Worldwide Tax Summaries, national tax authorities (2024-2025).
═══════════════════════════════════════════════════════════════ */
var CORPORATE_INCOME_TAX_RATES = {
  // Shimoliy Amerika
  'United States': { value: 25.8, year: 2024, source: 'OECD (Federal 21% + State avg ~5%)' },
  'Canada':        { value: 26.5, year: 2024, source: 'OECD (Federal 15% + Provincial avg)' },
  'Mexico':        { value: 30, year: 2024, source: 'OECD/SAT' },
  // Yevropa
  'Germany':       { value: 29.9, year: 2024, source: 'OECD (Federal 15% + Solidarity + Trade ~14%)' },
  'France':        { value: 25,   year: 2024, source: 'OECD/PwC' },
  'United Kingdom':{ value: 25,   year: 2024, source: 'HMRC (Main rate)' },
  'Italy':         { value: 24,   year: 2024, source: 'OECD (IRES, exc. IRAP regional ~3.9%)' },
  'Spain':         { value: 25,   year: 2024, source: 'OECD/AEAT' },
  'Netherlands':   { value: 25.8, year: 2024, source: 'OECD (Top rate)' },
  'Belgium':       { value: 25,   year: 2024, source: 'OECD/FOD Financiën' },
  'Switzerland':   { value: 14.7, year: 2024, source: 'OECD (Federal 8.5% + cantonal avg)' },
  'Austria':       { value: 23,   year: 2024, source: 'OECD/BMF' },
  'Ireland':       { value: 12.5, year: 2024, source: 'OECD (Trading income)' },
  'Portugal':      { value: 21,   year: 2024, source: 'OECD (exc. state surtax)' },
  'Luxembourg':    { value: 24.9, year: 2024, source: 'OECD (Combined CIT + municipal)' },
  'Greece':        { value: 22,   year: 2024, source: 'OECD/AADE' },
  'Sweden':        { value: 20.6, year: 2024, source: 'OECD/Skatteverket' },
  'Norway':        { value: 22,   year: 2024, source: 'OECD/Skatteetaten' },
  'Denmark':       { value: 22,   year: 2024, source: 'OECD/Skat' },
  'Finland':       { value: 20,   year: 2024, source: 'OECD/Vero' },
  'Iceland':       { value: 20,   year: 2024, source: 'OECD/RSK' },
  'Poland':        { value: 19,   year: 2024, source: 'OECD/MF (9% small business)' },
  'Czech Republic':{ value: 21,   year: 2024, source: 'OECD/MF ČR' },
  'Czechia':       { value: 21,   year: 2024, source: 'OECD/MF ČR' },
  'Hungary':       { value: 9,    year: 2024, source: 'OECD/NAV (lowest in EU)' },
  'Slovakia':      { value: 21,   year: 2024, source: 'OECD/FS' },
  'Slovenia':      { value: 22,   year: 2024, source: 'OECD/FURS' },
  'Romania':       { value: 16,   year: 2024, source: 'OECD/ANAF (micro 1-3%)' },
  'Bulgaria':      { value: 10,   year: 2024, source: 'OECD/NRA (one of EU lowest)' },
  'Croatia':       { value: 18,   year: 2024, source: 'OECD/Porezna' },
  'Estonia':       { value: 22,   year: 2024, source: 'OECD/EMTA (on distribution)' },
  'Latvia':        { value: 20,   year: 2024, source: 'OECD/VID (on distribution)' },
  'Lithuania':     { value: 15,   year: 2024, source: 'OECD/VMI' },
  'Cyprus':        { value: 12.5, year: 2024, source: 'OECD/TaxDept' },
  'Malta':         { value: 35,   year: 2024, source: 'OECD (refund system; effective ~5%)' },
  // MDH / Eurasia
  'Russia':        { value: 20,   year: 2024, source: 'OECD/FTS (rising to 25% in 2025)' },
  'Ukraine':       { value: 18,   year: 2024, source: 'STS Ukraine' },
  'Belarus':       { value: 20,   year: 2024, source: 'MNS Belarus' },
  'Kazakhstan':    { value: 20,   year: 2024, source: 'SRC Kazakhstan' },
  'Azerbaijan':    { value: 20,   year: 2024, source: 'STS Azerbaijan' },
  'Armenia':       { value: 18,   year: 2024, source: 'SRC Armenia' },
  'Georgia':       { value: 15,   year: 2024, source: 'GRS Georgia (on distribution)' },
  'Moldova':       { value: 12,   year: 2024, source: 'SFS Moldova' },
  'Kyrgyzstan':    { value: 10,   year: 2024, source: 'STS Kyrgyzstan' },
  'Tajikistan':    { value: 18,   year: 2024, source: 'STC Tajikistan (13% for production)' },
  'Turkmenistan':  { value: 20,   year: 2024, source: 'PwC estimate' },
  'Uzbekistan':    { value: 12,   year: 2025, source: 'STC Uzbekistan (standard rate; 0% in FEZ for tax-holiday period)' },
  // Sharqiy Osiyo
  'China':         { value: 25,   year: 2024, source: 'OECD/SAT (15% for high-tech)' },
  'Japan':         { value: 29.7, year: 2024, source: 'OECD/NTA (Combined national+local)' },
  'South Korea':   { value: 24,   year: 2024, source: 'OECD/NTS (Top rate, excl. local)' },
  'North Korea':   { value: 25,   year: 2024, source: 'PwC estimate' },
  'Mongolia':      { value: 25,   year: 2024, source: 'GA Mongolia (1% small business)' },
  'Hong Kong':     { value: 16.5, year: 2024, source: 'OECD/IRD HK' },
  'Taiwan':        { value: 20,   year: 2024, source: 'OECD/NTBT' },
  // Janubi-Sharqiy Osiyo
  'Thailand':      { value: 20,   year: 2024, source: 'RD Thailand' },
  'Vietnam':       { value: 20,   year: 2024, source: 'GDT Vietnam (10-17% special zones)' },
  'Indonesia':     { value: 22,   year: 2024, source: 'OECD/DJP' },
  'Malaysia':      { value: 24,   year: 2024, source: 'LHDN Malaysia (17% SMEs)' },
  'Philippines':   { value: 25,   year: 2024, source: 'BIR (20% SMEs)' },
  'Singapore':     { value: 17,   year: 2024, source: 'OECD/IRAS' },
  'Cambodia':      { value: 20,   year: 2024, source: 'GDT Cambodia' },
  'Laos':          { value: 20,   year: 2024, source: 'TD Laos' },
  'Myanmar':       { value: 22,   year: 2024, source: 'IRD Myanmar' },
  'Brunei':        { value: 18.5, year: 2024, source: 'MOFE Brunei' },
  // Janubiy Osiyo
  'India':         { value: 25.17,year: 2024, source: 'CBDT (new regime; old 30%)' },
  'Pakistan':      { value: 29,   year: 2024, source: 'FBR Pakistan' },
  'Bangladesh':    { value: 27.5, year: 2024, source: 'NBR Bangladesh' },
  'Sri Lanka':     { value: 30,   year: 2024, source: 'IRD Sri Lanka' },
  'Nepal':         { value: 25,   year: 2024, source: 'IRD Nepal' },
  'Afghanistan':   { value: 20,   year: 2024, source: 'Da Afghanistan' },
  'Maldives':      { value: 15,   year: 2024, source: 'MIRA Maldives' },
  // Yaqin Sharq
  'United Arab Emirates': { value: 9, year: 2024, source: 'MoF UAE (introduced 2023; 0% under AED 375K)' },
  'Saudi Arabia':  { value: 20,   year: 2024, source: 'ZATCA' },
  'Qatar':         { value: 10,   year: 2024, source: 'GTA Qatar' },
  'Kuwait':        { value: 15,   year: 2024, source: 'KMoF (foreign cos only)' },
  'Bahrain':       { value: 0,    year: 2024, source: 'NBR Bahrain (oil/gas only ~46%)' },
  'Oman':          { value: 15,   year: 2024, source: 'OTA Oman' },
  'Israel':        { value: 23,   year: 2024, source: 'ITA Israel' },
  'Turkey':        { value: 25,   year: 2024, source: 'GIB Turkey (raised from 20%)' },
  'Iran':          { value: 25,   year: 2024, source: 'INTA Iran' },
  'Iraq':          { value: 15,   year: 2024, source: 'GCT Iraq' },
  'Jordan':        { value: 20,   year: 2024, source: 'ISTD Jordan' },
  'Lebanon':       { value: 17,   year: 2024, source: 'MoF Lebanon' },
  'Syria':         { value: 28,   year: 2024, source: 'MoF Syria' },
  'Yemen':         { value: 20,   year: 2024, source: 'YTA Yemen' },
  // Afrika - asosiy
  'South Africa':  { value: 27,   year: 2024, source: 'SARS' },
  'Egypt':         { value: 22.5, year: 2024, source: 'ETA' },
  'Nigeria':       { value: 30,   year: 2024, source: 'FIRS Nigeria' },
  'Kenya':         { value: 30,   year: 2024, source: 'KRA Kenya' },
  'Morocco':       { value: 35,   year: 2024, source: 'DGI Morocco (high-revenue tier)' },
  'Algeria':       { value: 26,   year: 2024, source: 'DGI Algeria' },
  'Tunisia':       { value: 15,   year: 2024, source: 'MoF Tunisia' },
  'Ethiopia':      { value: 30,   year: 2024, source: 'MoR Ethiopia' },
  'Ghana':         { value: 25,   year: 2024, source: 'GRA Ghana' },
  // Janubiy Amerika
  'Brazil':        { value: 34,   year: 2024, source: 'RFB (IRPJ 25% + CSLL 9%)' },
  'Argentina':     { value: 35,   year: 2024, source: 'AFIP (top rate)' },
  'Chile':         { value: 27,   year: 2024, source: 'SII Chile' },
  'Colombia':      { value: 35,   year: 2024, source: 'DIAN Colombia' },
  'Peru':          { value: 29.5, year: 2024, source: 'SUNAT' },
  'Uruguay':       { value: 25,   year: 2024, source: 'DGI Uruguay' },
  'Venezuela':     { value: 34,   year: 2024, source: 'SENIAT' },
  'Ecuador':       { value: 25,   year: 2024, source: 'SRI Ecuador' },
  'Bolivia':       { value: 25,   year: 2024, source: 'SIN Bolivia' },
  'Paraguay':      { value: 10,   year: 2024, source: 'SET Paraguay' },
  // Okeaniya
  'Australia':     { value: 30,   year: 2024, source: 'ATO Australia (25% base rate entities)' },
  'New Zealand':   { value: 28,   year: 2024, source: 'IRD NZ' }
};

/* Apply realistic corporate-income-tax-rate override to the analysis data.
   The World Bank "tax revenue % of GDP" is replaced with the actual corporate
   tax rate, which is what investors actually need to compare. */
function _applyCorporateTaxOverride(data){
  try {
    if(!data || !data.metrics) return data;
    if(!data.metrics.totalTaxRate) data.metrics.totalTaxRate = {};
    var t = data.metrics.totalTaxRate;
    var cName = (data.country && data.country.display) || '';
    var fbC = CORPORATE_INCOME_TAX_RATES[cName];
    var fbU = CORPORATE_INCOME_TAX_RATES['Uzbekistan'];
    if(fbC){
      t.country = fbC.value;
      t.countryYear = fbC.year;
      t._countrySource = fbC.source;
    }
    if(fbU){
      t.uzbekistan = fbU.value;
      t.uzbekistanYear = fbU.year;
      t._uzSource = fbU.source;
    }
    t.unit = '%';
    t.indicator = 'Corporate Income Tax Rate';
    t.source = 'OECD / PwC / national tax authorities';
    /* Mark as overridden so renderers know to add the FEZ note */
    t._isCorporateOverride = true;
  } catch(e){ console.warn('Corporate tax override skipped:', e && e.message); }
  return data;
}

function _applyWageFallback(data){
  try {
    if(!data || !data.metrics) return data;
    if(!data.metrics.monthlyWage) data.metrics.monthlyWage = {};
    var w = data.metrics.monthlyWage;
    var cName = (data.country && data.country.display) || '';
    // ALWAYS use manufacturing-sector-specific wages (overrides ILOSTAT all-sector averages,
    // which produce misleading cross-country ratios like "9.1× cheaper" for Australia).
    var mfg = MANUFACTURING_WAGE_OVERRIDE_USD[cName];
    if(mfg){
      w.country = mfg.value;
      w.countryYear = mfg.year;
      w.countryCurrencyBasis = 'U.S. dollars';
      w.source = mfg.source;
      w._isManufacturingOverride = true;
    } else if(!(w.country !== null && w.country !== undefined && Number.isFinite(Number(w.country)))){
      // Country not in manufacturing table and ILOSTAT also missing — use universal fallback
      var fb = WAGE_FALLBACK_USD[cName];
      if(fb){
        w.country = fb.value;
        w.countryYear = fb.year;
        w.countryCurrencyBasis = 'U.S. dollars';
        w.source = fb.source + ' (ILOSTAT yo\'q — rasmiy davlat statistikasi)';
      }
    }
    // Always lock Uzbekistan manufacturing wage to our verified figure
    var uzMfg = MANUFACTURING_WAGE_OVERRIDE_USD['Uzbekistan'];
    if(uzMfg){
      w.uzbekistan = uzMfg.value;
      w.uzbekistanYear = uzMfg.year;
      w.uzbekistanCurrencyBasis = 'U.S. dollars';
    }
  } catch(_e){ console.warn('Wage fallback error:', _e && _e.message); }
  return data;
}

/* Apply GDP per capita and industry share fallbacks for countries missing World Bank data. */
function _applyGdpAndIndustryFallback(data){
  try {
    if(!data || !data.metrics) return data;
    var cName = (data.country && data.country.display) || '';
    // GDP per capita
    if(!data.metrics.gdpPerCapita) data.metrics.gdpPerCapita = {};
    var g = data.metrics.gdpPerCapita;
    var gdpFb = GDP_PER_CAPITA_FALLBACK_USD[cName];
    if(gdpFb && !(Number(g.country) > 0)){
      g.country = gdpFb.value;
      g.countryYear = gdpFb.year;
      g.source = gdpFb.source;
      g._isFallback = true;
    }
    var uzGdp = GDP_PER_CAPITA_FALLBACK_USD['Uzbekistan'];
    if(uzGdp && !(Number(g.uzbekistan) > 0)){
      g.uzbekistan = uzGdp.value;
      g.uzbekistanYear = uzGdp.year;
    }
    // Industry share
    if(!data.metrics.industryShare) data.metrics.industryShare = {};
    var ind = data.metrics.industryShare;
    var indFb = INDUSTRY_SHARE_FALLBACK_PCT[cName];
    if(indFb && !(Number(ind.country) > 0)){
      ind.country = indFb.value;
      ind.countryYear = indFb.year;
      ind.source = indFb.source;
      ind._isFallback = true;
    }
    var uzInd = INDUSTRY_SHARE_FALLBACK_PCT['Uzbekistan'];
    if(uzInd && !(Number(ind.uzbekistan) > 0)){
      ind.uzbekistan = uzInd.value;
      ind.uzbekistanYear = uzInd.year;
    }
  } catch(_e){ console.warn('GDP/Industry fallback error:', _e && _e.message); }
  return data;
}

/* Always override electricityPrice from our verified IEA/national-regulator table.
   The API often returns null for electricity, and even when it has data it uses
   residential averages rather than industrial tariffs that investors actually pay. */
function _applyElectricityFallback(data){
  try {
    if(!data || !data.metrics) return data;
    if(!data.metrics.electricityPrice) data.metrics.electricityPrice = {};
    var e = data.metrics.electricityPrice;
    var cName = (data.country && data.country.display) || '';
    var elC = ELECTRICITY_PRICE_FALLBACK_USD_MWH[cName];
    if(elC){
      e.country = elC.value;
      e.countryYear = elC.year;
      e.source = elC.source;
      e._isElectricityOverride = true;
    }
    // Always lock Uzbekistan industrial electricity to our verified figure
    var elU = ELECTRICITY_PRICE_FALLBACK_USD_MWH['Uzbekistan'];
    if(elU){
      e.uzbekistan = elU.value;
      e.uzbekistanYear = elU.year;
    }
    if(!e.unit) e.unit = 'USD/MWh';
  } catch(_e){ console.warn('Electricity fallback error:', _e && _e.message); }
  return data;
}

/* Use OpenAI web-search to fill ALL metrics still missing after local table lookups.
   Covers electricity, wage, GDP per capita, industry share, and natural gas.
   Only fires for metrics that are genuinely null — no API call wasted if tables cover them. */
async function _fetchMissingMetricsViaOpenAI(data){
  try {
    if(!data || !data.metrics) return data;
    var cName = (data.country && data.country.display) || '';
    if(!cName) return data;
    var m = data.metrics;

    function isOk(obj, key){ return obj && Number.isFinite(Number(obj[key])) && Number(obj[key]) > 0; }

    var wantElec  = !isOk(m.electricityPrice, 'country');
    var wantWage  = !isOk(m.monthlyWage,      'country');
    var wantGdp   = !isOk(m.gdpPerCapita,     'country');
    var wantInd   = !isOk(m.industryShare,    'country');
    var wantGas   = !isOk(m.naturalGasPrice,  'country');

    var anyMissing = wantElec || wantWage || wantGdp || wantInd || wantGas;
    if(!anyMissing) return data;

    var prompt =
      'Provide verified economic data for ' + cName + ' (most recent 2022–2024 figures).\n' +
      'Respond ONLY with valid JSON — numbers only, no text explanations:\n{\n' +
      (wantElec ? '  "electricityPriceUsdMwh": <industrial tariff USD/MWh>,\n  "electricitySource": "<source + year>",\n' : '') +
      (wantWage ? '  "manufacturingWageUsdMonth": <avg manufacturing sector monthly wage USD>,\n  "wageSource": "<source + year>",\n' : '') +
      (wantGdp  ? '  "gdpPerCapitaUsd": <GDP per capita current USD>,\n  "gdpYear": <year>,\n' : '') +
      (wantInd  ? '  "industrySharePct": <industry % of GDP>,\n  "industryYear": <year>,\n' : '') +
      (wantGas  ? '  "naturalGasPriceUsdMwh": <industrial natural gas price USD/MWh>,\n  "gasSource": "<source + year>",\n' : '') +
      '  "_country": "' + cName + '"\n}';

    var aiResult = await callOpenAI(
      [{ role: 'user', content: prompt }],
      { model: OPENAI_MODEL_SEARCH || 'gpt-4o-search-preview', webSearch: true, maxTokens: 600 }
    );
    var rawText = (aiResult && aiResult.content) || '';
    var jsonMatch = rawText.match(/\{[\s\S]*?\}/);
    if(!jsonMatch) return data;

    var p = JSON.parse(jsonMatch[0]);

    if(wantElec && Number(p.electricityPriceUsdMwh) > 0){
      if(!m.electricityPrice) m.electricityPrice = {};
      m.electricityPrice.country = Number(p.electricityPriceUsdMwh);
      m.electricityPrice.countryYear = 2024;
      m.electricityPrice.source = String(p.electricitySource || 'OpenAI research') + ' (AI)';
      m.electricityPrice._isAIFallback = true;
      if(!m.electricityPrice.unit) m.electricityPrice.unit = 'USD/MWh';
    }
    if(wantWage && Number(p.manufacturingWageUsdMonth) > 0){
      if(!m.monthlyWage) m.monthlyWage = {};
      m.monthlyWage.country = Number(p.manufacturingWageUsdMonth);
      m.monthlyWage.countryYear = 2024;
      m.monthlyWage.countryCurrencyBasis = 'U.S. dollars';
      m.monthlyWage.source = String(p.wageSource || 'OpenAI research') + ' (AI)';
      m.monthlyWage._isAIFallback = true;
    }
    if(wantGdp && Number(p.gdpPerCapitaUsd) > 0){
      if(!m.gdpPerCapita) m.gdpPerCapita = {};
      m.gdpPerCapita.country = Number(p.gdpPerCapitaUsd);
      m.gdpPerCapita.countryYear = Number(p.gdpYear) || 2023;
      m.gdpPerCapita.source = 'OpenAI research (AI)';
      m.gdpPerCapita._isAIFallback = true;
    }
    if(wantInd && Number(p.industrySharePct) > 0){
      if(!m.industryShare) m.industryShare = {};
      m.industryShare.country = Number(p.industrySharePct);
      m.industryShare.countryYear = Number(p.industryYear) || 2022;
      m.industryShare.source = 'OpenAI research (AI)';
      m.industryShare._isAIFallback = true;
    }
    if(wantGas && Number(p.naturalGasPriceUsdMwh) > 0){
      if(!m.naturalGasPrice) m.naturalGasPrice = {};
      m.naturalGasPrice.country = Number(p.naturalGasPriceUsdMwh);
      m.naturalGasPrice.countryYear = 2024;
      m.naturalGasPrice.source = String(p.gasSource || 'OpenAI research') + ' (AI)';
      m.naturalGasPrice._isAIFallback = true;
    }
  } catch(e){ console.warn('OpenAI metric fallback failed:', e && e.message); }
  return data;
}

async function fetchOfficialAiCountryAnalysis(comp){
  var countryName = getAiCompanyCountry(comp);
  if(!countryName){
    // No country — return a minimal stub so analysis & email still work.
    // FEZ incentives + Navoi logistics block will carry the content instead of
    // country-vs-UZ economic comparisons.
    return { _noCountry: true, country: { display: '', iso3: '', iso2: '' }, metrics: {} };
  }
  var cacheKey = getAiCountryCacheKey(countryName);
  if(AI_COUNTRY_ANALYSIS_CACHE[cacheKey] && !isAiAnalysisStale(AI_COUNTRY_ANALYSIS_CACHE[cacheKey])){
    // Re-apply all local overrides even on cached data (they may have been added after original fetch)
    var cached = AI_COUNTRY_ANALYSIS_CACHE[cacheKey];
    cached = _applyWageFallback(cached);
    cached = _applyElectricityFallback(cached);
    cached = _applyGdpAndIndustryFallback(cached);
    cached = _applyCorporateTaxOverride(cached);
    return cached;
  }
  var resp = await fetch(AI_COUNTRY_API_BASE + '/ai-country-analysis?country=' + encodeURIComponent(countryName));
  var data = await resp.json().catch(function(){ return {}; });
  if(!resp.ok || data.error) throw new Error(data.error || ('Rasmiy tahlil API xato berdi ('+resp.status+')'));
  // 1. Manufacturing-specific wages (always override ILOSTAT all-sector averages)
  data = _applyWageFallback(data);
  // 2. Verified industrial electricity tariffs (IEA / national regulators)
  data = _applyElectricityFallback(data);
  // 3. GDP per capita and industry share fallbacks (World Bank static data for common countries)
  data = _applyGdpAndIndustryFallback(data);
  // 4. Realistic corporate income tax rates (replace World Bank tax/GDP ratio)
  data = _applyCorporateTaxOverride(data);
  // 5. For any metric STILL missing, use OpenAI web-search as final fallback
  data = await _fetchMissingMetricsViaOpenAI(data);
  AI_COUNTRY_ANALYSIS_CACHE[cacheKey] = data;
  persistAiCountryCache();
  return data;
}

/* Look up Uzbekistan's MFN import tariff for a given HS code using our verified table.
   Returns rate in % (integer) or null if chapter not found. */
function _getUzbImportTariffForHs(hsCode){
  if(!hsCode) return null;
  var chapter = String(hsCode).replace(/\D/g, '').substring(0, 2);
  if(chapter.length < 2) return null;
  var rate = UZB_MFN_TARIFF_BY_HS_CHAPTER[chapter];
  return (typeof rate === 'number') ? rate : null;
}

async function fetchOfficialAiTariffSummary(comp, analysis){
  var sourceIso3 = String((((analysis || {}).country || {}).iso3) || '').trim().toUpperCase();
  var countryName = String((((analysis || {}).country || {}).display) || '').trim();
  var productInfo = getAiCompanyProductInfo(comp);
  if(!sourceIso3) throw new Error('Kompaniya davlati aniqlanmadi');
  if(!productInfo || !productInfo.hsCode || productInfo.hsCode.length < 2) throw new Error('Mahsulotning HS kodi topilmadi');
  var cacheKey = getAiProductCacheKey(sourceIso3, productInfo.hsCode);
  if(AI_PRODUCT_TARIFF_CACHE[cacheKey]) return AI_PRODUCT_TARIFF_CACHE[cacheKey];

  // Look up Uzbekistan's IMPORT tariff from our verified table immediately —
  // this is NOT the same as routes.uzRate (which is what export markets charge on UZB goods).
  var uzbImportMfnRate = _getUzbImportTariffForHs(productInfo.hsCode);

  var data;
  try {
    var url = AI_COUNTRY_API_BASE + '/ai-country-analysis?mode=tariff&source=' + encodeURIComponent(sourceIso3) + '&hs=' + encodeURIComponent(productInfo.hsCode) + '&productName=' + encodeURIComponent(productInfo.displayName);
    var resp = await fetch(url);
    var apiData = await resp.json().catch(function(){ return {}; });
    if(!resp.ok || apiData.error) throw new Error(apiData.error || ('Tarif tahlil API xato berdi (' + resp.status + ')'));
    data = apiData;
  } catch(apiErr){
    // API failed — fall through to OpenAI deep-research below
    data = { routes: [], avgSourceRate: null, avgUzRate: null, avgDiff: null, avgDiffPct: null, bestAdvantage: null };
    console.warn('Tariff API error, falling back to OpenAI:', apiErr && apiErr.message);
  }
  data.productInfo = productInfo;
  // Attach verified UZB import tariff from our official table
  data.uzbImportMfnRate = uzbImportMfnRate;
  // OpenAI deep-research pass: verify/enrich tariff with real trade-policy data
  // This corrects shallow or hype values from the base API and fills gaps.
  try {
    var hasUsableData = Array.isArray(data.routes) && data.routes.length > 0 &&
      Number.isFinite(Number(data.avgSourceRate)) && Number.isFinite(Number(data.avgUzRate));
    var uzbTableRate = uzbImportMfnRate !== null
      ? 'Our internal table shows Uzbekistan MFN import tariff for HS chapter ' + String(productInfo.hsCode).substring(0,2) + ' is ' + uzbImportMfnRate + '% — confirm or correct this.'
      : 'We do not have a pre-filled rate for this HS code — determine it from official sources.';

    var deepPrompt =
      'You are a trade-policy expert specialising in Uzbekistan and CIS trade law.\n\n' +
      'CONTEXT: ' + uzbTableRate + '\n\n' +
      'Product: ' + productInfo.displayName + ' (HS ' + productInfo.hsCode + ')\n' +
      'Exporting country: ' + countryName + ' (ISO3: ' + sourceIso3 + ')\n\n' +
      'IMPORTANT CLARIFICATIONS:\n' +
      '- "Uzbekistan import tariff" = the MFN or preferential duty Uzbekistan charges when this product enters UZB FROM ' + countryName + '.\n' +
      '- This is NOT the same as what export destination markets charge on Uzbekistan\'s exports.\n' +
      '- Uzbekistan is NOT in the EU. It is in CIS. CIS FTA may apply for CIS countries.\n' +
      '- Uzbekistan average MFN tariff is ~8-10%. Rates range from 0% (equipment/pharmaceuticals) to 30-50% (food/tobacco/cars).\n' +
      '- A flat 1.2% for all products is WRONG. Use the actual HS-specific rate.\n\n' +
      'Required (2023–2025 data):\n' +
      '1. Uzbekistan MFN import duty for this HS code (check WTO Tariff Download Facility or customs.uz)\n' +
      '2. Does ' + countryName + ' have a CIS FTA, SCO trade arrangement, or bilateral FTA with Uzbekistan?\n' +
      '3. Preferential rate under that agreement if applicable\n' +
      '4. Key NTB notes (certification, labeling, quotas)\n\n' +
      'Respond ONLY with valid JSON:\n' +
      '{\n' +
      '  "uzMfnRate": <number, verified MFN% Uzbekistan charges for this HS code>,\n' +
      '  "preferentialRate": <number or null>,\n' +
      '  "ftaName": "<agreement name or null>",\n' +
      '  "effectiveRate": <number, preferential if FTA applies, else MFN>,\n' +
      '  "ntbNotes": "<brief notes, max 80 chars>",\n' +
      '  "source": "<source + year>",\n' +
      '  "confidence": "high|medium|low"\n' +
      '}';
    var tariffAiResult = await callOpenAI(
      [{ role: 'user', content: deepPrompt }],
      { model: OPENAI_MODEL_SEARCH || 'gpt-4o-search-preview', webSearch: true, maxTokens: 600 }
    );
    var rawTariff = (tariffAiResult && tariffAiResult.content) || '';
    var jsonMatch = rawTariff.match(/\{[\s\S]*?\}/);
    if(jsonMatch){
      var tp = JSON.parse(jsonMatch[0]);
      // Attach the verified deep-research data to the tariff object
      // Prefer AI rate; if AI returns null but our table has it, use table
      var aiUzMfn = Number.isFinite(Number(tp.uzMfnRate)) ? Number(tp.uzMfnRate) : null;
      var finalUzMfn = (aiUzMfn !== null) ? aiUzMfn : uzbImportMfnRate;
      data._deepResearch = {
        uzMfnRate:        finalUzMfn,
        preferentialRate: Number.isFinite(Number(tp.preferentialRate)) ? Number(tp.preferentialRate) : null,
        ftaName:          tp.ftaName   || null,
        effectiveRate:    Number.isFinite(Number(tp.effectiveRate))    ? Number(tp.effectiveRate)    : (finalUzMfn !== null ? finalUzMfn : null),
        ntbNotes:         tp.ntbNotes  || '',
        source:           tp.source    || 'OpenAI deep-research + customs.uz',
        confidence:       tp.confidence || 'medium',
        _tableRate:       uzbImportMfnRate  // reference: what our table said
      };
      // Note: we intentionally do NOT populate data.routes from deep-research because
      // routes represent export-market tariff comparisons (UZB vs source country exporting
      // to third markets), whereas _deepResearch has UZB import-side tariff data.
      // buildAiTariffPromptLines() and renderAiTariffAnalysis() both handle _deepResearch
      // separately to show verified import-tariff context in both the email and the UI.
    }
  } catch(drErr){ console.warn('Tariff deep-research skipped:', drErr && drErr.message); }
  AI_PRODUCT_TARIFF_CACHE[cacheKey] = data;
  persistAiTariffCache();
  return data;
}

function isAiAnalysisStale(analysis){
  var tax = ((((analysis || {}).metrics || {}).totalTaxRate) || {});
  var indicator = String(tax.indicator || '');
  // Treat discontinued Doing Business indicators as stale; new active indicator is
  // GC.TAX.TOTL.GD.ZS (World Bank / IMF Tax revenue, % of GDP).
  return !Number.isFinite(Number(tax.country)) ||
    !Number.isFinite(Number(tax.uzbekistan)) ||
    /IC\.TAX\.TOTL\.CP\.ZS|PAY\.TAX\.(LABR|PRFT|OTHR)/i.test(indicator);
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
    var transportSummary = saved.transportSummary || await buildAiTransportAnalysis((analysis || {}).country || {}, comp);
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
  // ≥10% farq bo'lsagina nisbat ko'rsatiladi — 1.09x kabi marginal raqamlar "Deyarli teng" bo'ladi
  if(cheaperMode){
    if(ratio >= 1.10) return aiRound(ratio, 1) + 'x arzon';
    if(ratio <= 0.90) return aiRound(1/ratio, 1) + 'x qimmat';
    return 'Deyarli teng';
  }
  if(ratio >= 1.10) return aiRound(ratio, 1) + 'x yuqori';
  if(ratio <= 0.90) return aiRound(1/ratio, 1) + 'x past';
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
  if(metricKey === 'totalTaxRate') return { key:metricKey, icon:'🧾', label:"Korporativ daromad solig'i", accent:'#7C3AED', metric:metrics.totalTaxRate || {}, formatter:aiFmtPct, inverse:true };
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

function buildAiMetricDetail(metricKey, analysis, scope){
  if(metricKey === 'transportSummary'){
    /* Use the active scope first, then fall back to the other scope */
    var _primaryScope = scope || 'investor';
    var _fallbackScope = _primaryScope === 'investor' ? 'page' : 'investor';
    var transportDom = getAiScopeDom(_primaryScope);
    var summary = null;
    if(transportDom && transportDom.analysisCard && transportDom.analysisCard._analysisData === analysis){
      summary = transportDom.analysisCard._transportSummary || null;
    }
    if(!summary){
      var pageDom = getAiScopeDom(_fallbackScope);
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
    if(metric._isCorporateOverride){
      rows.push(
        { label: 'Standart stavka', country: aiValueOrDash(metric.country, aiFmtPct), uzbekistan: aiValueOrDash(metric.uzbekistan, aiFmtPct) },
        { label: 'Manba (kompaniya davlati)', country: metric._countrySource || metric.source || '—', uzbekistan: metric._uzSource || metric.source || '—' },
        { label: 'Navoiy FEZ — Tax holiday', country: '—', uzbekistan: '0% (3–10 yil, investitsiya hajmiga qarab)' }
      );
      note = "Korporativ daromad solig'ining standart stavkalari taqqoslandi (OECD/PwC/milliy soliq ma'muriyatlari). " +
        "O'zbekistonda standart stavka 12%, Navoiy Erkin Iqtisodiy Hududida (FEZ) esa Prezident Farmoni asosida " +
        "$300K–$3M=3 yil, $3M–$5M=5 yil, $5M–$10M=7 yil, $10M+=10 yil davomida 0% (mol-mulk va yer soliqlari ham 0%).";
    } else {
      var cParts = ((metric.components || {}).country) || {};
      var uParts = ((metric.components || {}).uzbekistan) || {};
      rows.push(
        { label: 'Labor tax', country: aiValueOrDash(cParts.laborTax, aiFmtPct), uzbekistan: aiValueOrDash(uParts.laborTax, aiFmtPct) },
        { label: 'Profit tax', country: aiValueOrDash(cParts.profitTax, aiFmtPct), uzbekistan: aiValueOrDash(uParts.profitTax, aiFmtPct) },
        { label: 'Other taxes', country: aiValueOrDash(cParts.otherTaxes, aiFmtPct), uzbekistan: aiValueOrDash(uParts.otherTaxes, aiFmtPct) }
      );
      note = "Soliq yuklamasi uchta rasmiy komponent yig'indisi sifatida hisoblangan: labor tax + profit tax + other taxes.";
    }
  }
  if(descriptor.key === 'monthlyWage'){
    rows.push({ label: 'Valyuta bazasi', country: countryBasis || '—', uzbekistan: uzBasis || '—' });
    var wageMetric = (((analysis || {}).metrics) || {}).monthlyWage || {};
    if(wageMetric._isManufacturingOverride){
      note = 'Ishlab chiqarish sektori bo\'yicha oylik o\'rtacha ish haqi (rasmiy davlat statistika idoralari: BLS, Destatis, ABS va boshqalar). ' +
        'ILOSTAT umumiy iqtisodiyot o\'rtacha ma\'lumotlari o\'rniga ishlab chiqarish sektori ma\'lumotlari ishlatiladi — investorlar aynan shu tarmoqda ishlaydi.';
    } else if(wageMetric._isAIFallback){
      note = 'OpenAI web-search orqali topilgan ishlab chiqarish sektori ish haqi ma\'lumoti. ' + (wageMetric.source || '');
    } else {
      note = 'Mehnat narxi ILOSTAT ma\'lumotiga ko\'ra oylik ish haqi ko\'rsatkichi asosida taqqoslanadi.';
    }
  }
  if(descriptor.key === 'electricityPrice'){
    rows.push(
      { label: 'Tabiiy gaz', country: aiValueOrDash(secondary.country, aiFmtMwh), uzbekistan: aiValueOrDash(secondary.uzbekistan, aiFmtMwh) },
      { label: 'Gaz yili', country: secondary.countryYear || '—', uzbekistan: secondary.uzbekistanYear || '—' },
      { label: 'Gaz manbasi', country: secondary.source || '—', uzbekistan: secondary.source || '—' }
    );
    var elecMetric = (((analysis || {}).metrics) || {}).electricityPrice || {};
    if(elecMetric._isElectricityOverride || elecMetric._isAIFallback){
      note = 'Sanoat elektr energiyasi narxi (IEA World Energy Prices 2024, milliy energetika regulyatorlari). ' +
        'O\'zbekiston: ' + (ELECTRICITY_PRICE_FALLBACK_USD_MWH['Uzbekistan'] || {}).value + ' USD/MWh — Uzbekenergo davlat subsidiyalangan sanoat tarifi.';
    } else {
      note = 'Elektr energiyasi bilan birga tabiiy gaz bo\'yicha ham qo\'shimcha energetik fon berildi.';
    }
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
  dom.analysisDetail.innerHTML = buildAiMetricDetail(metricKey, analysis, scope);
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
        // Re-apply all local overrides on any stored analysis (Firebase cache may be pre-override)
        var _ovAnalysis = _applyCorporateTaxOverride(_applyElectricityFallback(_applyWageFallback(c.aiLetterData.analysis)));
        window._aiContactLetters[String(c.id)] = {
          contact: c,
          payload: {
            analysis: _ovAnalysis,
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
      analysis: _applyCorporateTaxOverride(_applyElectricityFallback(_applyWageFallback(comp.aiLetterData.analysis))),
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
  var _noCountryAnalysis = !!(analysis && analysis._noCountry);
  var countryName = (analysis && analysis.country && analysis.country.display) || 'Tanlangan davlat';
  var metrics = (analysis && analysis.metrics) || {};
  var scopeKey = getAiScopeKey(scope);
  var selectedMetric = _aiAnalysisOpenMetric[scopeKey] || '';
  var transportSummary = (dom.analysisCard && dom.analysisCard._transportSummary) || null;
  var meta = [];
  var grid = [];
  var titleEl = dom.analysisTitle;
  var metaEl = dom.analysisMeta;

  // No-country mode: show Navoi FEZ incentives info only, skip metric cards
  if(_noCountryAnalysis){
    if(titleEl) titleEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="vertical-align:text-bottom;margin-right:4px"><path d="M18 20V10M12 20V4M6 20v-6" stroke="#4361EE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Navoiy FEZ Imtiyozlari — Davlat Ko\'rsatilmagan';
    if(dom.analysisGrid) dom.analysisGrid.innerHTML =
      '<div style="padding:1.2rem;background:rgba(37,99,235,.05);border-radius:12px;border:1px dashed rgba(37,99,235,.2);color:var(--text2);font-size:.82rem;line-height:1.65">' +
      '<div style="font-weight:700;margin-bottom:.5rem;color:var(--text)">ℹ️ Kompaniya davlati ko\'rsatilmagan</div>' +
      'Iqtisodiy taqqoslash (soliq, ish haqi, elektr) uchun davlat ma\'lumoti kerak. ' +
      'Shunga qaramay, AI xat generatsiyasi ishlaydi — faqat <strong>Navoiy FEZ imtiyozlari</strong> ' +
      've <strong>regional logistika</strong> asosida xat yoziladi.<br><br>' +
      'Agar davlatni bilsangiz, kompaniya kartasida <em>Davlat</em> maydonini to\'ldirib, ' +
      'tahlilni qayta ishga tushiring.' +
      '</div>';
    if(metaEl) metaEl.innerHTML = '';
    return;
  }

  var gdp = metrics.gdpPerCapita || {};
  var industry = metrics.industryShare || {};
  var tax = metrics.totalTaxRate || {};
  var wage = metrics.monthlyWage || {};
  var electricity = metrics.electricityPrice || {};
  var gas = metrics.naturalGasPrice || {};
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
    "Korporativ soliq",
    aiRatioDirectionText(tax.country, tax.uzbekistan, true),
    '<span style="font-size:.6rem">OECD/PwC · ' + escapeHtmlText((tax.countryYear||'—') + '/' + (tax.uzbekistanYear||'—')) + ' · FEZ: 0%</span>',
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
      'Transport kalkulyatori 🤖 AI',
      aiFmtTransportUsd(transportSummary.avgSaving) + ' (' + transportSummary.avgSavingPct + '%)',
      (transportSummary.volumeSpec || '13 davlat bo\'yicha') + ' · ' + (transportSummary.dataSourceBadge || '🤖 AI tahlil'),
      '#D97706',
      { scope: scope, metricKey: 'transportSummary', selected: selectedMetric === 'transportSummary', countryVal: transportSummary.avgForeign, uzVal: transportSummary.avgNavoi, countryLabel: aiFmtTransportUsd(transportSummary.avgForeign), uzLabel: aiFmtTransportUsd(transportSummary.avgNavoi) }
    ));
  }

  var tariffSummary = (dom.analysisCard && dom.analysisCard._tariffSummary) || null;
  var hasTariffRoutes = tariffSummary && !tariffSummary.error && Array.isArray(tariffSummary.routes) && tariffSummary.routes.length;
  var hasTariffDr = tariffSummary && tariffSummary._deepResearch && tariffSummary._deepResearch.uzMfnRate !== null;
  var hasTariffTable = tariffSummary && typeof tariffSummary.uzbImportMfnRate === 'number';
  if(hasTariffRoutes || hasTariffDr || hasTariffTable){
    // Show UZB IMPORT tariff (most relevant for investor) as the primary number.
    // The routes comparison (what export markets charge) is shown in the detail panel.
    var uzImportRate = (hasTariffDr && tariffSummary._deepResearch.uzMfnRate !== null)
      ? tariffSummary._deepResearch.uzMfnRate
      : tariffSummary.uzbImportMfnRate;
    var preferential = hasTariffDr ? tariffSummary._deepResearch.preferentialRate : null;
    var ftaName = hasTariffDr ? tariffSummary._deepResearch.ftaName : null;
    var tariffMainLabel = uzImportRate !== null
      ? aiFmtPct(uzImportRate) + (preferential !== null && Number.isFinite(preferential) ? ' (FTA: ' + aiFmtPct(preferential) + ')' : '')
      : (hasTariffRoutes && Number.isFinite(Number(tariffSummary.avgDiff)) ? 'Ustunlik: ' + aiFmtPct(tariffSummary.avgDiff) : 'Ma\'lumot yo\'q');
    var tariffSubLabel = uzImportRate !== null
      ? ('UZB import tarifi' + (ftaName ? ' · ' + ftaName : ''))
      : escapeHtmlText(((tariffSummary.productInfo||{}).displayName) || 'Mahsulot tarifi');
    grid.push(buildAiMetricCard(
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 5H2v16h20V5h-7M9 5V3h6v2M9 5h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 14l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      'Bojxona tarifi',
      tariffMainLabel,
      tariffSubLabel,
      '#7C3AED',
      { scope: scope, metricKey: 'tariffSummary', selected: selectedMetric === 'tariffSummary',
        countryVal: tariffSummary.avgSourceRate, uzVal: tariffSummary.avgUzRate,
        countryLabel: aiFmtPct(tariffSummary.avgSourceRate), uzLabel: aiFmtPct(tariffSummary.avgUzRate) }
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
    // Foyda daromadi: investitsiyaning taxminan 12% (konservativ manufacturing margin)
    // Faqat ≥3 percentage-point farqda ko'rsatiladi — marginal farq noise bo'ladi
    var taxC = Number(tax.country), taxU = Number(tax.uzbekistan);
    if(Number.isFinite(taxC) && Number.isFinite(taxU) && taxC > taxU && (taxC - taxU) >= 3){
      var taxSaving = investSum * 0.12 * ((taxC - taxU) / 100); // 12% annual profit margin (konservativ)
      totalAnnualSaving += taxSaving;
      savingsBreakdown.push({label:'Soliq tejamkorlik', value:taxSaving, pct:((taxC-taxU).toFixed(1))+'pp', color:'#7C3AED', desc:'Soliq yuklamasi: '+taxC.toFixed(1)+'% → '+taxU.toFixed(1)+'% (12% profit margin asosida)'});
    }

    // 2. Mehnat narxi tejamkorlik (labor cost saving)
    // Ishchi soni: $300K ga taxminan 1 ishchi (manufacturing); max 150 ishchi (hiperestimatsiyadan saqlanish uchun)
    var wageC = Number(wage.country), wageU = Number(wage.uzbekistan);
    if(Number.isFinite(wageC) && Number.isFinite(wageU) && wageC > wageU){
      var wageRelDiff = wageC > 0 ? ((wageC - wageU) / wageC) : 0;
      if(wageRelDiff >= 0.15){ // faqat ≥15% farqda hisoblab ko'rsatamiz
        var workerCount = Math.min(150, Math.max(20, Math.round(investSum / 300000)));
        var annualWageSaving = (wageC - wageU) * 12 * workerCount;
        totalAnnualSaving += annualWageSaving;
        savingsBreakdown.push({label:'Mehnat narxi tejamkorlik', value:annualWageSaving, pct:Math.round(wageRelDiff*100)+'%', color:'#059669', desc:workerCount+' ishchi (taxm.) × $'+Math.round(wageC-wageU)+'/oy farq'});
      }
    }

    // 3. Elektr energiya tejamkorlik (faqat ≥15% va ≥$5/MWh farqda)
    var elC = Number(electricity.country), elU = Number(electricity.uzbekistan);
    if(Number.isFinite(elC) && Number.isFinite(elU) && elC > elU){
      var elRelDiff = elC > 0 ? ((elC - elU) / elC) : 0;
      var elAbsDiff = elC - elU;
      if(elRelDiff >= 0.15 && elAbsDiff >= 5){
        var annualMwh = investSum / 1500; // taxminiy yillik energiya sarfi MWh
        var elSaving = elAbsDiff * annualMwh;
        totalAnnualSaving += elSaving;
        savingsBreakdown.push({label:'Elektr energiya tejamkorlik', value:elSaving, pct:Math.round(elRelDiff*100)+'%', color:'#DC2626', desc:Math.round(annualMwh)+' MWh × $'+elAbsDiff.toFixed(1)+' farq'});
      }
    }

    // 4. Tabiiy gaz tejamkorlik
    var gasC = Number(gas.country), gasU = Number(gas.uzbekistan);
    if(Number.isFinite(gasC) && Number.isFinite(gasU) && gasC > gasU){
      /* Anti-hype: agar UZ gaz $5/MWh dan past bo'lsa, IEA ma'lumotida noaniqlik bor —
         davlat subsidiyasi sababli rasmiy ko'rsatkich noto'liq. Bunday holda
         realistic minimum sifatida $8/MWh ishlatamiz (taqqoslash uchun mintaqaviy
         baseline). "100% cheaper" kabi hype yozilmasin uchun. */
      var gasU_adj = gasU < 5 ? 8 : gasU;
      var gasC_adj = Math.max(gasC, gasU_adj + 0.5); // bo'sh farq bo'lib qolmasin
      var annualGasMwh = investSum / 3000;
      var gasSaving = (gasC_adj - gasU_adj) * annualGasMwh;
      var gasPct = Math.min(70, Math.round((1 - gasU_adj/gasC_adj) * 100)); // max 70% — "100%" hype emas
      var gasDesc = (gasU < 5)
        ? 'Davlat subsidiyali narx — taxminiy $'+gasU_adj.toFixed(1)+'/MWh dan hisoblangan'
        : Math.round(annualGasMwh)+' MWh × $'+((gasC_adj-gasU_adj).toFixed(1))+' farq';
      totalAnnualSaving += gasSaving;
      savingsBreakdown.push({label:'Tabiiy gaz tejamkorlik', value:gasSaving, pct:gasPct+'%', color:'#F59E0B', desc:gasDesc});
    }

    // 5. Transport tejamkorlik — faqat Navoiy net ustunlikka ega yo'nalishlar bo'yicha
    if(transportSummary && transportSummary.routes && transportSummary.routes.length){
      var favRoutes = transportSummary.routes.filter(function(r){ return r.saving > 0; });
      if(favRoutes.length >= 3){ // kamida 3 ta yo'nalishda arzon bo'lsa hisoblash mantiqiy
        var favAvgSaving = Math.round(favRoutes.reduce(function(s,r){ return s+r.saving; },0) / favRoutes.length);
        var favAvgPct = favRoutes.length > 0
          ? Math.round(favRoutes.reduce(function(s,r){ return s+r.savingPct; },0) / favRoutes.length)
          : 0;
        // Shipment soni: yiliga taxminan. $500K har bir shipment uchun, max 24 shipment/yil
        var shipments = Math.min(24, Math.max(4, Math.round(investSum / 500000)));
        var trSaving = favAvgSaving * shipments;
        totalAnnualSaving += trSaving;
        savingsBreakdown.push({
          label:'Transport logistika tejamkorlik',
          value: trSaving,
          pct: favAvgPct+'%',
          color:'#D97706',
          desc: shipments+' jo\'natma × $'+favAvgSaving.toLocaleString()+' ('+favRoutes.length+' ta qulay yo\'nalish bo\'yicha o\'rtacha)'
        });
      }
    }

    // Embassy letter uchun cache — har country bo'yicha savingsBreakdown saqlanadi
    try {
      if(!window._aiSavingsCache) window._aiSavingsCache = {};
      var _cacheKey = String(countryName || '').toLowerCase().trim();
      if(_cacheKey){
        window._aiSavingsCache[_cacheKey] = {
          countryName: countryName,
          breakdown: savingsBreakdown.slice(),
          totalAnnualSaving: totalAnnualSaving,
          fiveYearSaving: totalAnnualSaving * 5,
          investSum: investSum,
          timestamp: Date.now()
        };
      }
    } catch(_e){}

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
          '<div style="font-size:.62rem;color:var(--text3);line-height:1.55"><b style="color:var(--text2)">Eslatma:</b> Taxminiy hisob-kitob — faqat World Bank/ILOSTAT/IEA rasmiy API ma\'lumotlari asosida. Quyidagi taxminlar qo\'llanilgan: foyda margini 12%, ishchi soni investitsiyaga mutanosib, energiya sarfi sanoat o\'rtachasiga ko\'ra. FEZ soliq ta\'tili bu hisob-kitobda inobatga olinmagan — u alohida va qo\'shimcha imtiyozdir. Haqiqiy tejamkorlik loyiha, soha va mahsulotga qarab farq qiladi.</div>' +
        '</div>' +
      '</div>';
    } else {
      profitEl.style.display = 'none';
    }
  }
}

function buildOfficialAnalysisLines(analysis){
  // Returns ONLY metrics where Uzbekistan has a statistically meaningful advantage.
  // Never exposes metrics where UZ is worse — that would undermine the email's credibility.
  var countryName = (analysis && analysis.country && analysis.country.display) || 'Selected country';
  var metrics = (analysis && analysis.metrics) || {};
  var lines = [];

  // Helper: only push if UZ value is better (lower for cost metrics, higher for output metrics)
  function pushIfUzWins_lower(label, metric, formatterC, formatterU, sourceLabel, minRelPct, minAbsDiff){
    if(!metric || !Number.isFinite(Number(metric.country)) || !Number.isFinite(Number(metric.uzbekistan))) return;
    var c = Number(metric.country), u = Number(metric.uzbekistan);
    if(u >= c) return; // UZ is not better
    var relPct = c > 0 ? Math.round(((c - u) / c) * 100) : 0;
    var absDiff = c - u;
    if(minRelPct && relPct < minRelPct) return;
    if(minAbsDiff && absDiff < minAbsDiff) return;
    lines.push(label + ': ' + countryName + ' ' + formatterC(c) + ' (' + (metric.countryYear||'n/a') + ', ' + (sourceLabel||metric.source||'Official API') + ') vs Uzbekistan ' + formatterU(u) + ' (' + (metric.uzbekistanYear||'n/a') + '). Uzbekistan is ' + relPct + '% lower.');
  }

  // GDP: only context — never an "advantage" (higher country GDP ≠ bad for UZ investment)
  // (omitted from output — GDP comparison doesn't help make the case for investing IN Uzbekistan)

  // Tax: meaningful if ≥ 3 percentage points absolute gap
  var tax = metrics.totalTaxRate;
  if(tax && Number.isFinite(Number(tax.country)) && Number.isFinite(Number(tax.uzbekistan))
     && Number(tax.uzbekistan) < Number(tax.country)
     && (Number(tax.country) - Number(tax.uzbekistan)) >= 3){
    var td = Math.round(((Number(tax.country) - Number(tax.uzbekistan)) / Number(tax.country)) * 100);
    lines.push('Tax burden: Uzbekistan ' + aiFmtPct(tax.uzbekistan) + ' vs ' + countryName + ' ' + aiFmtPct(tax.country) + ' of GDP — ' + td + '% lower (World Bank ' + (tax.uzbekistanYear||'n/a') + ').');
  }

  // Wage: meaningful if ≥ 15% cheaper
  var wage = metrics.monthlyWage;
  if(wage && Number.isFinite(Number(wage.country)) && Number.isFinite(Number(wage.uzbekistan))
     && Number(wage.uzbekistan) < Number(wage.country)){
    var wd = Math.round(((Number(wage.country) - Number(wage.uzbekistan)) / Number(wage.country)) * 100);
    if(wd >= 15){
      lines.push('Skilled labor: avg monthly wage $' + Math.round(wage.uzbekistan) + ' in Uzbekistan vs $' + Math.round(wage.country) + ' in ' + countryName + ' — ' + wd + '% lower (ILOSTAT ' + (wage.uzbekistanYear||'n/a') + ').');
    }
  }

  // Electricity: meaningful if ≥ 15% cheaper
  var elec = metrics.electricityPrice;
  if(elec && Number.isFinite(Number(elec.country)) && Number.isFinite(Number(elec.uzbekistan))
     && Number(elec.uzbekistan) < Number(elec.country)){
    var ed = Math.round(((Number(elec.country) - Number(elec.uzbekistan)) / Number(elec.country)) * 100);
    if(ed >= 15){
      lines.push('Industrial electricity: ' + aiFmtMwh(elec.uzbekistan) + ' in Uzbekistan vs ' + aiFmtMwh(elec.country) + ' in ' + countryName + ' — ' + ed + '% cheaper (' + (elec.source||'official') + ' ' + (elec.uzbekistanYear||'n/a') + ').');
    }
  }

  // Gas: with anti-hype floor ($8/MWh baseline when IEA shows near-zero due to subsidies)
  var gas = metrics.naturalGasPrice;
  if(gas && Number.isFinite(Number(gas.country)) && Number.isFinite(Number(gas.uzbekistan))
     && Number(gas.uzbekistan) < Number(gas.country)){
    var gasU_f = Number(gas.uzbekistan) < 5 ? 8 : Number(gas.uzbekistan);
    var gasC_f = Math.max(Number(gas.country), gasU_f + 0.5);
    var gd_f = Math.min(70, Math.round(((gasC_f - gasU_f) / gasC_f) * 100));
    var gasUzLabel_f = Number(gas.uzbekistan) < 5 ? 'state-subsidised (~$' + gasU_f.toFixed(1) + '/MWh est.)' : aiFmtMwh(gas.uzbekistan);
    lines.push('Industrial natural gas: ' + gasUzLabel_f + ' in Uzbekistan vs ' + aiFmtMwh(gasC_f) + ' in ' + countryName + ' — ~' + gd_f + '% cheaper (IEA ' + (gas.uzbekistanYear||'n/a') + ').');
  }

  return lines;
}

// Filter metrics to include only those where Uzbekistan has a MEANINGFUL advantage.
// Thresholds prevent 1-2% marginal differences from inflating the email data block.
// Used in cold-email prompts so letters never cite numbers that hurt Uzbekistan's case.
function buildUzbAdvantageLines(analysis){
  var countryName = (analysis && analysis.country && analysis.country.display) || 'Selected country';
  var metrics = (analysis && analysis.metrics) || {};
  var out = [];
  function relPct(a, b){ return (a > 0 && b > 0) ? Math.round(((a-b)/a)*100) : 0; }

  // Tax: require ≥ 3 percentage-point absolute gap (e.g. 25% vs 22% = marginal, not an advantage)
  var tax = metrics.totalTaxRate;
  if(tax && Number.isFinite(Number(tax.country)) && Number.isFinite(Number(tax.uzbekistan))
     && Number(tax.uzbekistan) < Number(tax.country)
     && (Number(tax.country) - Number(tax.uzbekistan)) >= 3){
    var diff = relPct(Number(tax.country), Number(tax.uzbekistan));
    out.push('Uzbekistan tax burden is '+diff+'% lower than '+countryName+' ('+aiFmtPct(tax.uzbekistan)+' vs '+aiFmtPct(tax.country)+' of GDP; World Bank/IMF '+(tax.uzbekistanYear||'n/a')+').');
  }

  // Labor: require ≥ 15% relative gap (e.g. $480 vs $500 = noise, not worth citing)
  var wage = metrics.monthlyWage;
  if(wage && Number.isFinite(Number(wage.country)) && Number.isFinite(Number(wage.uzbekistan))
     && Number(wage.uzbekistan) < Number(wage.country)){
    var d = relPct(Number(wage.country), Number(wage.uzbekistan));
    if(d >= 15){
      out.push('Skilled labor cost in Uzbekistan is '+d+'% lower than '+countryName+' (avg monthly wage $'+Math.round(wage.uzbekistan)+' vs $'+Math.round(wage.country)+'; ILOSTAT/stat.uz '+(wage.uzbekistanYear||'n/a')+').');
    }
  }

  // Electricity: require ≥ 15% relative gap AND absolute gap ≥ $5/MWh
  var elec = metrics.electricityPrice;
  if(elec && Number.isFinite(Number(elec.country)) && Number.isFinite(Number(elec.uzbekistan))
     && Number(elec.uzbekistan) < Number(elec.country)){
    var ed = relPct(Number(elec.country), Number(elec.uzbekistan));
    var elAbsDiff = Number(elec.country) - Number(elec.uzbekistan);
    if(ed >= 15 && elAbsDiff >= 5){
      out.push('Industrial electricity in Uzbekistan is '+ed+'% cheaper than '+countryName+' ('+aiFmtMwh(elec.uzbekistan)+' vs '+aiFmtMwh(elec.country)+'; '+(elec.source||'official')+' '+(elec.uzbekistanYear||'n/a')+').');
    }
  }

  // Gas: anti-hype floor ($8/MWh baseline if IEA shows near-zero due to state subsidy),
  // require ≥ 20% adjusted gap, hard cap at 70% to ban "100% arzon" language
  var gas = metrics.naturalGasPrice;
  if(gas && Number.isFinite(Number(gas.country)) && Number.isFinite(Number(gas.uzbekistan))
     && Number(gas.uzbekistan) < Number(gas.country)){
    var gasU_adv = Number(gas.uzbekistan) < 5 ? 8 : Number(gas.uzbekistan);
    var gasC_adv = Math.max(Number(gas.country), gasU_adv + 0.5);
    var gd = Math.min(70, relPct(gasC_adv, gasU_adv));
    if(gd >= 20){
      var gasUzLabel = Number(gas.uzbekistan) < 5
        ? 'state-subsidised (~$'+gasU_adv.toFixed(1)+'/MWh est.)'
        : aiFmtMwh(gas.uzbekistan);
      out.push('Industrial natural gas in Uzbekistan is ~'+gd+'% cheaper than '+countryName+' ('+gasUzLabel+' vs '+aiFmtMwh(gasC_adv)+'; IEA '+(gas.uzbekistanYear||'n/a')+').');
    }
  }

  // Industry share: require UZ leads by ≥ 3 percentage points (already applied earlier)
  var ind = metrics.industryShare;
  if(ind && Number.isFinite(Number(ind.country)) && Number.isFinite(Number(ind.uzbekistan))
    && Number(ind.uzbekistan) > Number(ind.country)
    && (Number(ind.uzbekistan) - Number(ind.country)) >= 3){
    out.push('Uzbekistan industrial output is '+aiFmtPct(ind.uzbekistan)+' of GDP (vs '+aiFmtPct(ind.country)+' in '+countryName+') — broader manufacturing base.');
  }
  return out;
}

// ═══ NAVOI FEZ INCENTIVES BLOCK ═══
// Navoiy FEZ rasmiy investitsiya imtiyozlari — har doim email'ga kiritiladi.
// Bu raqamlar rasmiy farmonga asoslangan va o'zgarmaydi — AI hallucinate qilishiga yo'l qo'ymaydi.
function buildNavoiFezIncentivesBlock(investUsd){
  var lines = [];
  var investM = (Number(investUsd) || 0) / 1e6;
  var taxHolidayYears, taxHolidayTier;
  if(investM >= 10){
    taxHolidayYears = 10; taxHolidayTier = 'investments above $10 million';
  } else if(investM >= 5){
    taxHolidayYears = 7; taxHolidayTier = 'investments $5M–$10M';
  } else if(investM >= 3){
    taxHolidayYears = 5; taxHolidayTier = 'investments $3M–$5M';
  } else {
    taxHolidayYears = 3; taxHolidayTier = 'investments $300K–$3M';
  }
  lines.push('NAVOI FREE ECONOMIC ZONE — OFFICIAL INCENTIVES (Presidential Decrees PF-4059 and PP-5057):');
  lines.push('• Profit (income) tax holiday: ' + taxHolidayYears + ' years (' + taxHolidayTier + ').');
  lines.push('• Property tax exemption: full duration of tax holiday period.');
  lines.push('• Land tax exemption: full duration of tax holiday period.');
  lines.push('• Import customs duty on technological equipment: 0%.');
  lines.push('• Import customs duty on raw materials used in production: 0%.');
  lines.push('• Minimum qualifying investment threshold: $300,000 USD.');
  lines.push('• Zone size: 564 ha dedicated industrial park in Navoi city + Karmana and Nurota sub-zones.');
  lines.push('• Simplified visa and residency procedures for foreign specialists and their families.');
  lines.push('• Navoi International Airport: direct cargo routes to Seoul Incheon (ICN), Frankfurt (FRA), Dubai (DXB), Mumbai — Central Asia\'s largest cargo hub by throughput.');
  lines.push('NOTE: Do NOT invent additional incentive figures. The above are the verified official terms.');
  return lines.join('\n');
}

// Classify the contact's decision-making role so cold emails can match tone + angle.
function detectContactPersona(position){
  var p = String(position || '').toLowerCase();
  if(/\b(ceo|chief executive|founder|co-founder|owner|president|chairman|managing director|general director|director general|md|genel mudur|generalny direktor|генеральный|директор|основатель)\b/i.test(p)) return 'ceo';
  if(/\b(cfo|finance|treasur|controller)\b/.test(p)) return 'cfo';
  if(/\b(coo|operations|supply chain|logistics)\b/.test(p)) return 'coo';
  if(/\b(cto|technology|technical|engineering|quality|r&d|research)\b/.test(p)) return 'technical';
  if(/\b(export|international|trade|foreign)\b/.test(p)) return 'export';
  if(/\b(procurement|purchasing|sourcing|buyer|supply)\b/.test(p)) return 'procurement';
  if(/\b(sales|business development|bdm|account executive|commercial)\b/.test(p)) return 'sales';
  if(/\b(marketing|brand|growth)\b/.test(p)) return 'marketing';
  return 'manager';
}

/* Eksport maqsad bozorlari — Navoiydan tashqi mijozlarga yetkazib berish.
   "UZB" olib tashlandi (Navoi → O'zbekiston = mahalliy, tashqi mijoz emas).
   O'rniga Türkiye qo'shildi — bu Uzbekistondan asosiy eksport partnyori. */
var AI_TRANSPORT_TARGETS = [
  { iso3:'TUR', code:'TR', name:'Turkiya', lat:39.9334, lon:32.8597, navoiCost:2400, navoiDays:7, navoiMode:'Avto + multimodal' },
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

// Gemini-powered transport estimates — live AI research per source country.
// Cached to localStorage for 7 days (freight corridors change slowly).
var AI_TRANSPORT_GEMINI_CACHE = {};
var AI_TRANSPORT_GEMINI_TTL = 7 * 24 * 60 * 60 * 1000;
(function hydrateTransportCache(){
  try {
    var raw = localStorage.getItem('_aiTransportCache');
    if(!raw) return;
    var parsed = JSON.parse(raw);
    var now = Date.now();
    Object.keys(parsed || {}).forEach(function(k){
      var entry = parsed[k];
      if(entry && entry._ts && (now - entry._ts) < AI_TRANSPORT_GEMINI_TTL){
        AI_TRANSPORT_GEMINI_CACHE[k] = entry.data;
      }
    });
  } catch(e){}
})();
function persistTransportCache(){
  try {
    var out = {};
    Object.keys(AI_TRANSPORT_GEMINI_CACHE).forEach(function(k){
      out[k] = { _ts: Date.now(), data: AI_TRANSPORT_GEMINI_CACHE[k] };
    });
    localStorage.setItem('_aiTransportCache', JSON.stringify(out));
  } catch(e){}
}

/* NOTE: Despite the legacy name, OpenAI (gpt-4o / gpt-4o-search-preview) is tried FIRST.
   Gemini is only used as fallback when the OpenAI key is missing or the call fails. */
async function fetchAiTransportEstimatesFromGemini(countryInfo, comp){
  var sourceName = String((countryInfo && (countryInfo.display || countryInfo.name)) || '').trim();
  var sourceIso3 = String((countryInfo && countryInfo.iso3) || '').toUpperCase();
  if(!sourceName || !sourceIso3) return null;

  // Extract TradeAtlas annual export volume if available
  var taQuantity = comp ? Number(comp._tradeAtlasQuantity || 0) : 0;
  var taUnit = comp ? String(comp._tradeAtlasQuantityUnit || '').trim() : '';
  var taValue = comp ? Number(comp._tradeAtlasTradeValue || 0) : 0;
  var hasVolume = Number.isFinite(taQuantity) && taQuantity > 0 && taUnit;

  // Cache key includes volume signature so different companies get distinct results
  var cacheKey = sourceIso3 + (hasVolume ? ('|'+Math.round(taQuantity)+taUnit) : '');
  if(AI_TRANSPORT_GEMINI_CACHE[cacheKey]) return AI_TRANSPORT_GEMINI_CACHE[cacheKey];

  var hasOpenAI = (typeof callOpenAI === 'function') && (typeof getOpenAIKey === 'function') && getOpenAIKey();
  var hasGemini = (typeof callGemini === 'function');
  if(!hasOpenAI && !hasGemini) return null;

  var targetList = AI_TRANSPORT_TARGETS.map(function(t){ return '- '+t.iso3+' ('+t.name+')'; }).join('\n');
  var volumeSpec;
  if(hasVolume){
    volumeSpec = 'CARGO VOLUME: '+taQuantity.toLocaleString('en-US')+' '+taUnit+' per year '+
      (taValue > 0 ? '(total trade value ~$'+Math.round(taValue).toLocaleString('en-US')+'/year)' : '')+'.\n' +
      'Calculate cost for shipping THIS TOTAL annual volume to each destination — break into realistic shipment batches (20ft/40ft containers, truckloads, rail wagons, or bulk) as appropriate. Return TOTAL annual freight cost per route, not per-container.';
  } else {
    volumeSpec = 'CARGO VOLUME: 1 standard 20ft container of general cargo (~20 tonnes / ~33m³).';
  }

  var prompt = 'You are a freight logistics expert. Provide ACCURATE, honest, unbiased freight cost estimates for 2024-2025.\n' +
    'Reference: Drewry WCI, Xeneta, Freightos Baltic Index, major forwarder rate sheets.\n' +
    'Do NOT inflate or deflate numbers to make either origin look better. If Navoi is more expensive for some destinations, say so.\n\n' +
    volumeSpec + '\n\n' +
    'ORIGIN A: '+sourceName+' ('+sourceIso3+') — use the main industrial export hub/port for this country.\n' +
    'ORIGIN B: Navoi, Uzbekistan (UZB) — landlocked Central Asia. Main corridors: rail via Kazakhstan to Russia/China, road via Turkmenistan to Iran/Turkey, Navoi International Airport (ICAO: UTNN) for air cargo.\n\n' +
    'Destinations (13):\n' + targetList + '\n\n' +
    'For EACH destination output: foreignCost (USD, total for the volume), foreignDays (transit days door-to-door), foreignMode (mode description), navoiCost (USD from Navoi), navoiDays, navoiMode.\n\n' +
    'ACCURACY RULES — read carefully:\n' +
    '1. Base EVERY number on actual market rates and real corridors. Do not guess.\n' +
    '2. Navoi reference benchmarks (20ft container): TUR ~$2,000-3,000, RUS ~$1,800-2,500, KAZ ~$800-1,200, IRN ~$1,200-1,800, AFG ~$900-1,400, TJK ~$700-1,000, TKM ~$800-1,100, PAK ~$1,500-2,200.\n' +
    '3. For sea-accessible destinations from Origin A with direct port access (TUR, RUS, CHN, EUR...) — the foreign origin will often be cheaper. REPORT THIS HONESTLY.\n' +
    '4. Navoi advantages are REAL for CIS/Central Asia neighbours and where the Middle Corridor rail gives a genuine edge. Do not fabricate advantages elsewhere.\n' +
    '5. Round to nearest $50. Stay within realistic freight market ranges — do not output $200 or $50,000 for a container.\n' +
    '6. Output ONLY the 13 destinations listed. No extras. No UZB (domestic).\n\n' +
    'Return ONLY valid JSON:\n' +
    '{"routes":[{"iso3":"TUR","foreignCost":3200,"foreignDays":18,"foreignMode":"Sea + truck","navoiCost":2400,"navoiDays":7,"navoiMode":"Rail + road"}, ...]}';

  /* Try OpenAI (web search preferred) first, then Gemini as fallback. */
  async function tryOpenAi(){
    var resp = await callOpenAI([
      { role:'system', content:'You are a freight logistics expert. Always reply with valid JSON only.' },
      { role:'user', content: prompt }
    ], {
      model: (hasVolume ? (window.OPENAI_MODEL_SEARCH || 'gpt-4o-search-preview') : (window.OPENAI_MODEL_DEFAULT || 'gpt-4o')),
      temperature: 0.2,
      maxTokens: 4096,
      webSearch: !!hasVolume,
      jsonMode: !hasVolume  /* jsonMode and webSearch are mutually exclusive */
    });
    return resp.content;
  }
  async function tryGemini(){
    var resp = await callGemini({
      contents: [{ role:'user', parts:[{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
    });
    return (resp && resp.candidates && resp.candidates[0] && resp.candidates[0].content && resp.candidates[0].content.parts && resp.candidates[0].content.parts[0] && resp.candidates[0].content.parts[0].text) || '';
  }

  try {
    var text = '';
    if(hasOpenAI){
      try { text = await tryOpenAi(); }
      catch(eo){ console.warn('OpenAI transport estimate failed, trying Gemini:', eo && eo.message); }
    }
    if(!text && hasGemini){ text = await tryGemini(); }
    if(!text) return null;

    var parsed = (typeof safeParseOpenAIJson === 'function' ? safeParseOpenAIJson(text) : safeParseJSON(text));
    var arr = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.routes) ? parsed.routes : null);
    if(!Array.isArray(arr)) return null;

    // Sanity-check clipping: reject routes with obviously hype/implausible costs.
    // Single 20ft container should be $300–$25,000; transit 1–90 days.
    var byIso = {};
    arr.forEach(function(row){
      if(!row || !row.iso3) return;
      var fCost = Number(row.foreignCost);
      var nCost = Number(row.navoiCost);
      var fDays = Number(row.foreignDays);
      var nDays = Number(row.navoiDays);
      // Clip costs to plausible range
      if(!Number.isFinite(fCost) || fCost < 200 || fCost > 30000) return; // skip implausible
      if(!Number.isFinite(nCost) || nCost < 200 || nCost > 30000) return;
      if(!Number.isFinite(fDays) || fDays < 1) row.foreignDays = 1;
      if(!Number.isFinite(nDays) || nDays < 1) row.navoiDays = 1;
      // Cap Navoi costs at reference benchmarks +50% to prevent AI inflation
      var navoiBenchmark = {TUR:3000,RUS:2500,KAZ:1200,IRN:1800,AFG:1400,TJK:1000,TKM:1100,PAK:2200,KGZ:1200,MNG:3500,AZE:2800,GEO:2800,ARM:2800}[String(row.iso3).toUpperCase()];
      if(navoiBenchmark && nCost > navoiBenchmark * 1.5){
        row.navoiCost = navoiBenchmark * 1.5;
      }
      byIso[String(row.iso3).toUpperCase()] = row;
    });
    if(!Object.keys(byIso).length) return null; // all rows were invalid
    AI_TRANSPORT_GEMINI_CACHE[cacheKey] = byIso;
    persistTransportCache();
    return byIso;
  } catch(e){
    console.warn('Transport estimate failed:', e && e.message);
    return null;
  }
}

async function buildAiTransportAnalysis(countryInfo, comp){
  var sourceHub = getAiTransportHub(countryInfo);
  // Try Gemini first (real market-informed estimates), fall back to formula
  var geminiMap = await fetchAiTransportEstimatesFromGemini(countryInfo, comp).catch(function(){ return null; });
  var routes = AI_TRANSPORT_TARGETS.map(function(target){
    var gRow = geminiMap && geminiMap[target.iso3];
    var estimate;
    var navoiCost, navoiDays, navoiMode;
    if(gRow && Number.isFinite(Number(gRow.foreignCost)) && Number.isFinite(Number(gRow.navoiCost))){
      estimate = {
        foreignCost: Math.round(Number(gRow.foreignCost)),
        foreignDays: Math.max(1, Math.round(Number(gRow.foreignDays) || 1)),
        foreignMode: String(gRow.foreignMode || '—')
      };
      navoiCost = Math.round(Number(gRow.navoiCost));
      navoiDays = Math.max(1, Math.round(Number(gRow.navoiDays) || 1));
      navoiMode = String(gRow.navoiMode || target.navoiMode);
    } else {
      estimate = estimateAiExportRoute(sourceHub, target);
      navoiCost = target.navoiCost;
      navoiDays = target.navoiDays;
      navoiMode = target.navoiMode;
    }
    var saving = estimate.foreignCost - navoiCost;
    var savingPct = estimate.foreignCost > 0 ? Math.round((saving / estimate.foreignCost) * 100) : 0;
    return {
      code: target.code,
      iso3: target.iso3,
      name: target.name,
      foreignCost: estimate.foreignCost,
      foreignDays: estimate.foreignDays,
      foreignMode: estimate.foreignMode,
      navoiCost: navoiCost,
      navoiDays: navoiDays,
      navoiMode: navoiMode,
      saving: saving,
      savingPct: savingPct,
      dataSource: gRow ? 'gemini' : 'formula'
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
  // Volume signature (TradeAtlas annual export) — shown in card description
  var taQty = comp ? Number(comp._tradeAtlasQuantity || 0) : 0;
  var taUnit = comp ? String(comp._tradeAtlasQuantityUnit || '').trim() : '';
  var volumeSpec = (Number.isFinite(taQty) && taQty > 0 && taUnit)
    ? ('Yillik ' + Math.round(taQty).toLocaleString('en-US') + ' ' + taUnit + ' hajmda')
    : '1 × 20ft konteyner (standart)';
  var dataSourceBadge = geminiMap ? '🤖 AI tahlil' : '📐 Formula (fallback)';
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
    fastestNavoi: fastestNavoi,
    volumeSpec: volumeSpec,
    dataSourceBadge: dataSourceBadge
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

  var srcBadge = summary.dataSourceBadge || '📐 Formula (fallback)';
  metaEl.style.display = 'block';
  metaEl.innerHTML = '<div style="padding-top:.3rem;border-top:1px dashed rgba(16,185,129,.28)">' +
    '<strong>Logistika modeli (' + escapeHtmlText(srcBadge) + '):</strong><br>' +
    '• Eksport hub: ' + escapeHtmlText(summary.sourceHub.name) + ' → 13 bozorga solishtirildi.<br>' +
    '• Narxlar: ' + (srcBadge.indexOf('AI') !== -1 ? 'OpenAI tahlili (Drewry/Xeneta/Freightos ko\'rsatkichlari asosida). Aniq taklif uchun freight forwarder bilan muzokaraning kerak.' : 'Masofa + koridor profili formulasi (fallback). AI tahlili mavjud bo\'lganda yangilanadi.') + '<br>' +
    '• Navoiy − Markaziy Osiyo mamlakatlariga quruqlik koridori orqali raqobatbardosh. Dengizga yaqin davlatlar uchun manba davlat arzonroq bo\'lishi mumkin — bu normal.' +
    (summary.fastestNavoi ? '<br>• Eng tez yo\'nalish: ' + escapeHtmlText(summary.fastestNavoi.name) + ' (~' + summary.fastestNavoi.navoiDays + ' kun).' : '') +
    '</div>';
  /* card stays hidden until user clicks transport metric card in analysis section */
}

function buildAiTransportPromptLines(summary){
  if(!summary || !summary.routes || !summary.routes.length) return [];
  // Only emit transport lines when Navoi has a net advantage — negative avgSaving
  // would mean Navoi is MORE expensive on average and must not be cited as an advantage.
  var favorableRoutes = summary.routes.filter(function(r){ return r.saving > 0; });
  if(favorableRoutes.length === 0) return [];
  var topRoutes = favorableRoutes.slice().sort(function(a, b){ return b.saving - a.saving; }).slice(0, 4);
  var lines = [];
  // Only quote averages when there are 3+ favorable routes (otherwise one outlier drives the claim)
  if(favorableRoutes.length >= 3){
    var favAvgForeign = Math.round(favorableRoutes.reduce(function(s,r){ return s+r.foreignCost; },0) / favorableRoutes.length);
    var favAvgNavoi  = Math.round(favorableRoutes.reduce(function(s,r){ return s+r.navoiCost;  },0) / favorableRoutes.length);
    var favAvgSaving = favAvgForeign - favAvgNavoi;
    var favAvgPct    = favAvgForeign > 0 ? Math.round((favAvgSaving / favAvgForeign) * 100) : 0;
    lines.push(
      'Logistics comparison (estimated 40ft container export cost, ' + favorableRoutes.length + ' of 13 target markets where Navoi has a cost advantage): ' +
      'average from ' + summary.sourceCountry + ' is ' + aiFmtTransportUsd(favAvgForeign) + ' vs average from Navoi ' + aiFmtTransportUsd(favAvgNavoi) +
      ' — Navoi is ~' + favAvgPct + '% cheaper on these routes.'
    );
  }
  if(summary.fastestNavoi){
    lines.push('Fastest Navoi export market in this set: ' + summary.fastestNavoi.name + ' in about ' + summary.fastestNavoi.navoiDays + ' days (vs ' + (summary.fastestNavoi.foreignDays || '?') + ' days from ' + summary.sourceCountry + ').');
  }
  topRoutes.forEach(function(route){
    lines.push(
      'For ' + route.name + ': from ' + summary.sourceCountry + ' costs ~' + aiFmtTransportUsd(route.foreignCost) +
      ' vs from Navoi ~' + aiFmtTransportUsd(route.navoiCost) +
      ' — Navoi cheaper by ' + aiFmtTransportUsd(route.saving) + ' (' + route.savingPct + '%).'
    );
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
  var dr = summary._deepResearch || null;
  if(summary.error || !Array.isArray(summary.routes) || !summary.routes.length){
    // If deep-research filled in data, show it instead of a bare "no data" card
    if(dr && Number.isFinite(dr.effectiveRate)){
      gridEl.innerHTML =
        buildAiMetricCard('🇺🇿', 'UZB import tarifi', aiFmtPct(dr.uzMfnRate), 'MFN boj tarifi (UZB import uchun)', '#059669') +
        buildAiMetricCard('🤝', 'Imtiyozli stavka', dr.preferentialRate !== null && Number.isFinite(dr.preferentialRate) ? aiFmtPct(dr.preferentialRate) : '—', dr.ftaName ? ('FTA: ' + dr.ftaName) : 'FTA yo\'q', '#D97706') +
        buildAiMetricCard('🏷️', 'HS kodi', escapeHtmlText(String((summary.productInfo || {}).hsCode || summary.hsCode || '—')), 'AI deep-research natijasi', '#7C3AED') +
        buildAiMetricCard('🔍', 'Ishonch darajasi', dr.confidence === 'high' ? '✅ Yuqori' : (dr.confidence === 'medium' ? '⚠️ O\'rta' : '⚠️ Past'), 'AI web-search asosida', '#2563EB');
      tbody.innerHTML =
        '<tr><td colspan="5" style="padding:1rem">' +
          '<strong>🤖 AI Deep-Research natijasi</strong> (' + escapeHtmlText(dr.source || 'OpenAI web search') + '):<br>' +
          '• Uzbekistonga MFN import boj tarifi: <strong>' + aiFmtPct(dr.uzMfnRate) + '</strong><br>' +
          (dr.preferentialRate !== null && Number.isFinite(dr.preferentialRate) ? '• Imtiyozli stavka (' + escapeHtmlText(dr.ftaName || 'FTA') + '): <strong>' + aiFmtPct(dr.preferentialRate) + '</strong><br>' : '') +
          (dr.ntbNotes ? '• Norasmiy to\'siqlar: ' + escapeHtmlText(dr.ntbNotes) + '<br>' : '') +
          '<span style="font-size:.75rem;color:var(--text3)">WITS/UNCTAD rasmiy routes ma\'lumoti topilmadi — bu AI web-search yordami bilan to\'ldirilgan.</span>' +
        '</td></tr>';
      metaEl.style.display = 'block';
      metaEl.innerHTML =
        '<div style="padding-top:.3rem;border-top:1px dashed rgba(124,58,237,.25)">' +
          '<strong>🤖 AI deep-research</strong> — ' + escapeHtmlText(dr.source || 'OpenAI web search') + '<br>' +
          '• Ishonch darajasi: ' + (dr.confidence || 'medium') + '<br>' +
          '• WITS/UNCTAD routes topilmadi, lekin email uchun tarif ma\'lumoti to\'ldirildi.' +
        '</div>';
    } else {
      gridEl.innerHTML =
        buildAiMetricCard('🛃', 'Tarif holati', 'Ma\'lumot yo\'q', escapeHtmlText(summary.error || 'Rasmiy bojxona tarifi topilmadi'), '#7C3AED') +
        buildAiMetricCard('🏷️', 'HS kodi', escapeHtmlText(String((summary.productInfo || {}).hsCode || summary.hsCode || '—')), 'Mahsulot kodi bo\'yicha rasmiy tarif qidirildi', '#2563EB');
      tbody.innerHTML = '<tr><td colspan="5" style="padding:1rem;color:var(--text2)">' + escapeHtmlText(summary.error || 'Ushbu investor uchun tarif ma\'lumoti topilmadi.') + '</td></tr>';
      metaEl.style.display = 'block';
      metaEl.innerHTML =
        '<div style="padding-top:.3rem;border-top:1px dashed rgba(124,58,237,.25)">' +
          '<strong>Izoh:</strong><br>' +
          escapeHtmlText(summary.error || 'Tarif ma\'lumoti topilmadi') + '<br>' +
          '• Mahsulot HS kodi investor yozuvida saqlangan bo\'lishi kerak.<br>' +
          '• Vercel backend yangi tarif logikasi bilan redeploy qilingan bo\'lishi kerak.' +
        '</div>';
    }
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
      '<strong>✅ Rasmiy manba — WITS · UNCTAD · TRAINS</strong> (Jahon Banki + UNCTAD + WTO hamkorligi, gold-standard)<br>' +
      '• Reporter = maqsad import bozori, partner = kompaniya davlati yoki O\'zbekiston.<br>' +
      '• Mahsulot HS kodi: ' + escapeHtmlText(String((summary.productInfo || {}).hsCode || summary.hsCode || '—')) + '.<br>' +
      '• AHS = Applied (bilateral), MFN = Most-Favoured-Nation (umumiy).<br>' +
      '• 0% qiymati — FTA (erkin savdo) natijasi yoki o\'sha davlat uchun bojxona yo\'q degani.<br>' +
      '• Musbat farq = O\'zbekiston uchun pastroq bojxona tarifi.<br>' +
      '• Ma\'lumot yili ustunda — WITS ~1-2 yil lag bilan yangilanadi.' +
      (dr ? '<br>• <strong>🤖 AI deep-research</strong>: ' + escapeHtmlText(dr.source || 'OpenAI web search') + ' (ishonch: ' + (dr.confidence||'medium') + ')' : '') +
    '</div>';
  /* tariff card stays hidden until user clicks tariff metric */
}

function buildAiTariffPromptLines(summary){
  if(!summary) return [];
  var productName = ((summary.productInfo || {}).displayName) || summary.productName || 'selected product';
  var lines = [];
  var hasRoutes = Array.isArray(summary.routes) && summary.routes.length > 0;
  if(hasRoutes){
    lines.push(
      'Official tariff comparison for ' + productName + ' (HS ' + (summary.hsCode || 'n/a') + ') across the 13 target markets: average tariff from the company country is ' + aiFmtPct(summary.avgSourceRate) + ', while average tariff from Uzbekistan is ' + aiFmtPct(summary.avgUzRate) + '.',
      'Average tariff advantage for Uzbekistan across comparable markets: ' + (Number.isFinite(Number(summary.avgDiff)) ? (aiFmtPct(summary.avgDiff) + (Number.isFinite(Number(summary.avgDiffPct)) ? ' (' + summary.avgDiffPct + '%)' : '')) : 'n/a') + '.'
    );
    (summary.routes).filter(function(row){
      return Number.isFinite(Number(row.diff)) && row.diff > 0;
    }).sort(function(a, b){
      return Number(b.diff || 0) - Number(a.diff || 0);
    }).slice(0, 4).forEach(function(row){
      var name = row.targetName || row.dest || 'target market';
      lines.push('For ' + name + ', tariff from the company country is ' + aiFmtPct(row.sourceRate) + ' versus Uzbekistan ' + aiFmtPct(row.uzRate) + ', so Uzbekistan is lower by ' + aiFmtPct(row.diff) + (Number.isFinite(Number(row.diffPct)) ? ' (' + row.diffPct + '%).' : '.'));
    });
  }
  // Uzbekistan IMPORT tariff (what the investor's goods face entering UZB)
  var dr = summary._deepResearch;
  var tableRate = typeof summary.uzbImportMfnRate === 'number' ? summary.uzbImportMfnRate : null;
  var uzMfn = (dr && Number.isFinite(dr.uzMfnRate)) ? dr.uzMfnRate : tableRate;
  if(uzMfn !== null && Number.isFinite(uzMfn)){
    var impLine = 'Uzbekistan MFN import duty for ' + productName + ' (HS ' + (summary.productInfo && summary.productInfo.hsCode || summary.hsCode || 'n/a') + '): ' + aiFmtPct(uzMfn);
    if(dr && Number.isFinite(dr.preferentialRate) && dr.ftaName){
      impLine += '; preferential rate under ' + dr.ftaName + ': ' + aiFmtPct(dr.preferentialRate) + ' (goods from this country may qualify)';
    }
    impLine += '. Source: ' + ((dr && dr.source) || 'UZB Customs tariff schedule') + '.';
    lines.push(impLine);
  }
  if(dr){
    if(dr.ntbNotes) lines.push('Non-tariff import requirements for Uzbekistan: ' + dr.ntbNotes + '.');
    if(!uzMfn && dr.ftaName) lines.push('Trade arrangement between source country and Uzbekistan: ' + dr.ftaName + '.');
  }
  return lines;
}

function handleAiCompanyChange(){
  resetAiScope('page', 'Kompaniya tanlang va "AI Xat Yozish" bosing');
}

function getAiLangName(lang){
  return {
    en:'English', ru:'Russian', de:'German', zh:'Chinese (Simplified)',
    fr:'French', fa:'Persian (Farsi)', ko:'Korean', ar:'Arabic',
    tr:'Turkish', ja:'Japanese', uz:'Uzbek (Latin script)'
  }[lang] || 'English';
}

/* ═══════════════════════════════════════════════════════════════
   Letter humanizer — final safety pass to strip residual AI tells
   that the model might have slipped in despite the prompt rules.
═══════════════════════════════════════════════════════════════ */
function humaniseLetterBody(body){
  if(!body) return body;
  var out = String(body);

  /* 1. Replace em-dashes ( — ) and en-dashes ( – ) with commas or periods.
        Em-dashes are a strong AI tell. We replace " — " (spaced) with ", "
        and "—" without spaces with "; " as a stylistic neutral fallback. */
  out = out.replace(/\s+—\s+/g, ', ');
  out = out.replace(/—/g, '; ');
  out = out.replace(/\s+–\s+/g, ', ');
  out = out.replace(/–/g, '-');

  /* 2. Strip the most common AI-cliché bigrams (case-insensitive) and replace
        with a softer alternative or just remove. We do this AFTER the model
        run so the prompt-level ban is the first line of defence, this is the
        belt-and-braces second line. */
  var clicheMap = [
    [/\bleverage(s|d|ing)?\b/gi, 'use'],
    [/\bsynergies\b/gi, 'overlap'],
    [/\bsynergy\b/gi, 'overlap'],
    [/\bwin-win\b/gi, 'mutually useful'],
    [/\bcutting-edge\b/gi, 'modern'],
    [/\bbest-in-class\b/gi, 'top-quality'],
    [/\bgame-?changer(s)?\b/gi, 'meaningful shift'],
    [/\bgame-?changing\b/gi, 'meaningful'],
    [/\bseamless(ly)?\b/gi, 'smooth'],
    [/\btransformative\b/gi, 'substantial'],
    [/\brobust ecosystem\b/gi, 'mature support network'],
    [/\bvalue proposition\b/gi, 'offer'],
    [/\bstrategic alignment\b/gi, 'shared interest'],
    [/\bunlock(s|ed|ing)? (potential|opportunit\w+|value)\b/gi, 'open new ground'],
    [/\bI hope (this|my) email finds you well[.,]?\s*/gi, ''],
    [/\bI hope this finds you well[.,]?\s*/gi, ''],
    [/\bI am writing to (introduce|outline|reach out|share|present)\b/gi, 'I am writing about'],
    [/\bI wanted to reach out\b/gi, 'I am reaching out'],
    [/\bI am pleased to (present|share|offer|introduce)\b/gi, 'I am writing about'],
    [/\bIn today'?s (competitive|dynamic|evolving|fast-paced) (landscape|market|environment|world)\b/gi, 'In today\'s market']
  ];
  clicheMap.forEach(function(pair){ out = out.replace(pair[0], pair[1]); });

  /* 3. Collapse any double spaces / commas introduced by the substitutions */
  out = out.replace(/[ \t]+/g, ' ');
  out = out.replace(/ ,/g, ',');
  out = out.replace(/,\s*,/g, ',');
  out = out.replace(/\n[ \t]+/g, '\n');
  out = out.replace(/\n{3,}/g, '\n\n');

  /* 4. Trim leading "Dear" line whitespace, ensure clean ending */
  out = out.trim();
  return out;
}

function humaniseLetterSubject(subj){
  if(!subj) return subj;
  var s = String(subj).trim();
  /* Remove markdown bold, leading quote characters, "Subject:" prefix */
  s = s.replace(/^Subject:\s*/i,'').replace(/^["'""]+|["'""]+$/g,'').replace(/\*\*/g,'').trim();
  /* Strip em-dashes from subject too */
  s = s.replace(/\s+—\s+/g, ': ').replace(/—/g, ':');
  /* Cap length at 90 chars */
  if(s.length > 90) s = s.slice(0, 87).replace(/[,;:\s]+$/,'') + '...';
  return s;
}

async function buildAiLetterPackage(comp, lang, sharedAnalysis, sharedTariff, opts){
  opts = opts || {};
  var contactIdx = Number(opts.contactIdx || 0);
  var contactTotal = Number(opts.contactTotal || 1);
  var usedAngles = Array.isArray(opts.usedAngles) ? opts.usedAngles : [];
  var langName = getAiLangName(lang);
  // Reuse pre-computed analysis (saves quota when same company has multiple contacts)
  var analysis = sharedAnalysis || await fetchOfficialAiCountryAnalysis(comp);
  // Show ONLY metrics where Uzbekistan has a meaningful, statistically significant advantage.
  // Marginal differences (e.g. 1–2%) are suppressed to avoid misleading claims.
  var advantageLines = buildUzbAdvantageLines(analysis);
  if(!advantageLines.length){
    // Fallback: buildOfficialAnalysisLines now also filters to UZ-winning metrics only.
    // If still empty it means no measurable comparative advantage — that is OK:
    // the FEZ incentives + logistics block will carry the email instead.
    advantageLines = buildOfficialAnalysisLines(analysis);
  }
  // Do NOT throw if empty — FEZ incentives block is always present as fallback content.
  var transportSummary = await buildAiTransportAnalysis(analysis.country, comp);
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

  // Persona-based prompt tailoring
  var persona = detectContactPersona(comp.lavozim || comp.title || '');
  var personaConfig = {
    ceo:        { wordRange:'280-380', paras:5, angle:'ALL available advantages — cost, tax, energy, logistics, tariffs, FEZ incentives. Lead with ROI/dollar outcome; cover every metric in the data block; CEO must see the full picture at a glance',                                                            hook:'full economic picture / ROI' },
    cfo:        { wordRange:'320-420', paras:5, angle:'ALL cost and fiscal advantages — cover every figure: energy, labour, corporate tax rate, property tax, import duties, FEZ holiday years. Show arithmetic where possible. Leave nothing out',                                                                 hook:'complete cost reduction picture' },
    coo:        { wordRange:'320-420', paras:5, angle:'ALL advantages — lead with supply chain and logistics, then cover every remaining metric: energy, tax, FEZ, tariffs. Full picture of what running operations from Navoi looks like',                                                                         hook:'supply chain + full cost overview' },
    technical:  { wordRange:'320-420', paras:5, angle:'ALL advantages — lead with manufacturing/technical fit, then cover every metric: energy cost, labour, FEZ incentives, logistics, tariffs. Complete picture',                                                                                                hook:'technical capability + full economics' },
    export:     { wordRange:'320-400', paras:5, angle:'ALL advantages — lead with market access and tariffs, then cover every remaining metric: energy, labour, tax, FEZ, logistics. Nothing omitted',                                                                                                             hook:'market access + full cost picture' },
    procurement:{ wordRange:'320-400', paras:5, angle:'ALL advantages — lead with unit economics and landed cost, then cover every metric: energy, labour, tax holiday, import duties, logistics. Show every saving explicitly',                                                                                   hook:'complete landed cost savings' },
    sales:      { wordRange:'320-400', paras:5, angle:'ALL advantages — lead with Central Asia revenue channel, then cover every supporting metric: FEZ incentives, cost advantages, logistics, tariffs. Full picture',                                                                                            hook:'revenue growth + full economics' },
    marketing:  { wordRange:'320-400', paras:5, angle:'ALL advantages — lead with brand/market entry angle, then cover every metric: cost, tax, logistics, tariffs, FEZ. Complete proposition',                                                                                                                   hook:'brand entry + full cost picture' },
    manager:    { wordRange:'350-460', paras:6, angle:'ALL available advantages — comprehensive overview: cost, energy, labour, corporate tax, FEZ incentives (all terms), logistics, tariffs, market access. Cover everything in the data block',                                                                 hook:'complete investment overview' }
  };
  var pc = personaConfig[persona] || personaConfig.manager;

  // Cross-contact deduplication: if previous contacts in same company used certain angles,
  // instruct AI to emphasize a DIFFERENT angle this time
  var dedupNote = '';
  if(contactTotal > 1){
    if(usedAngles.length && usedAngles.length < contactTotal){
      dedupNote = '\n\nIMPORTANT — DEDUPLICATION: Previous letters to this same company already used these angles: ['+usedAngles.join(' | ')+']. ' +
        'Your letter MUST emphasize a DIFFERENT dimension of the opportunity. Do NOT reuse the same opening sentence, same headline figure, or same call-to-action wording. Vary vocabulary and structure.';
    } else {
      dedupNote = '\n\nIMPORTANT — This is contact #'+(contactIdx+1)+' of '+contactTotal+' at the same company. Use fresh phrasing and a unique opening to avoid sounding like a mass-mailed template.';
    }
  }

  /* ═══ Diplomatic outreach prompt — written to sound HUMAN, not AI ═══
     Key changes vs old prompt:
       1. Strict "use only the numbers in DATA — do NOT invent any other figure" rule.
       2. Style ban-list (cliché AI openers like "I'm writing to outline...", "recognizing X's focus on...").
       3. Diplomatic register modelled on real government outreach, not marketing.
       4. Concrete CTA, no "30-minute call next week" cliché unless adapted.
       5. Sign-off matches Uzbek government practice. */

  var investSumForFez = comp ? (parseFloat(comp.summa) || 0) : 0;
  var fezBlock = buildNavoiFezIncentivesBlock(investSumForFez);
  // Pre-compute tax holiday years for subject line hint
  var _fezM = investSumForFez / 1e6;
  var taxHolidayYearsForSubject = _fezM >= 10 ? 10 : _fezM >= 5 ? 7 : _fezM >= 3 ? 5 : 3;

  var _noCountry = !!(analysis && analysis._noCountry);
  var dataBlock =
    'VERIFIED DATA (the ONLY numbers you are allowed to cite — do not invent any other figure or year):\n\n' +
    'COVERAGE RULE: Every bullet point in this data block MUST appear somewhere in the email body. ' +
    'Do not skip any metric. Use all of them.\n\n' +
    fezBlock +
    '\n\n' +
    (_noCountry
      ? 'COMPARATIVE ADVANTAGES: No country data is available for this company (country field is blank). ' +
        'Do NOT invent any country-vs-Uzbekistan comparison figures whatsoever. ' +
        'Focus the email entirely on the FEZ incentives, Navoi logistics, and the 13-market regional access above.'
      : (advantageLines.length
          ? 'COMPARATIVE ADVANTAGES vs ' + (comp.davlat || 'recipient country') + ' (official API data, cite with source — include ALL of these in the email):\n' +
            advantageLines.map(function(line){ return '• ' + line; }).join('\n')
          : 'COMPARATIVE ADVANTAGES: API data does not show a statistically significant advantage on standard metrics for this country pair. Do NOT invent comparative figures. Focus the email on the FEZ incentives and logistics above.')) +
    (transportLines.length ? '\n\nLOGISTICS / TRANSPORT (estimated costs, cite as approximate — include ALL of these in the email):\n' + transportLines.map(function(line){ return '• ' + line; }).join('\n') : '') +
    (!_noCountry && tariffLines.length ? '\n\nTARIFFS (WITS/UNCTAD official data — include ALL of these in the email):\n' + tariffLines.map(function(line){ return '• ' + line; }).join('\n') : '');

  var personaBlock =
    'RECIPIENT PROFILE:\n' +
    '• Name: ' + (comp.rahbar || 'the recipient') + '\n' +
    '• Title: ' + (comp.lavozim || 'Manager') + '\n' +
    '• Company: ' + (comp.kompaniya || 'their company') + '\n' +
    '• Country: ' + (_noCountry ? 'unknown (do not guess or mention a country)' : (comp.davlat || 'abroad')) + '\n' +
    '• Product line in scope: ' + productLabel + ' (industry: ' + industryLabel + ')\n' +
    '• Persona class: ' + persona.toUpperCase() + ' → angle to emphasise: ' + pc.angle + '\n' +
    '• Hook: ' + pc.hook;

  var styleBlock =
    'HOW THIS EMAIL MUST FEEL — read this before drafting:\n\n' +
    'You are writing as E. I. Gafforov, Head of the Department of Investment, Industry and Trade, Navoi Region. ' +
    'You are a government official, not a salesperson. The distinction is essential: you do not pitch, you present ' +
    'an economic case backed by verified numbers. You have studied this specific company and you respect the ' +
    'recipient enough to be precise, concise, and direct. A diplomat who writes well is specific and unhurried — ' +
    'never flattering, never vague, never offering a menu of options.\n\n' +
    'STRUCTURE GUIDANCE (adapt to flow naturally — not a rigid template):\n' +
    '  SALUTATION (mandatory, line 1 of the body): "Dear Mr. [Surname]," or "Dear Ms. [Surname]," using ' +
    '       the recipient\'s actual surname from the recipient profile. If only a single name is available, ' +
    '       use "Dear [FullName],". After the comma, leave a blank line, then continue.\n' +
    '  BRIEF IDENTIFICATION (mandatory, 1 short sentence, before ¶1): Diplomatic protocol requires that ' +
    '       you state who you are and the institutional context in one concise sentence — not a pitch, ' +
    '       not a hedge, just identification. Acceptable forms (adapt, do not copy verbatim):\n' +
    '       • "On behalf of the Department of Investment, Industry and Trade of Navoi Region, Republic ' +
    '         of Uzbekistan, I write to you regarding [the product sector]."\n' +
    '       • "My department at the Navoi Regional Hokimiyat has been studying the [product] sector ' +
    '         across our partner markets, and your work at [company] is the reason for this note."\n' +
    '       • "I write in my capacity as Head of the Department of Investment, Industry and Trade of ' +
    '         Navoi Region — a brief, factual note on [product] manufacturing economics that may be ' +
    '         relevant to [company]."\n' +
    '       This identification sentence is NOT subject to the "I am writing to" ban below — that ban ' +
    '       applies to corporate-cliché versions ("I am writing to introduce", "I am writing to outline"). ' +
    '       Formal diplomatic identification with a clear referent ("regarding [product]", "concerning ' +
    '       [sector]") is required and expected. Then a blank line, then ¶1.\n' +
    '  ¶1 — NAVOI PRODUCTION REALITY for this specific product. This paragraph is the entire reason ' +
    '       you are writing. Open the email by stating, with verifiable facts, what Navoi Region currently ' +
    '       produces (or has the capacity to produce) of THIS recipient\'s product. Three valid forms ' +
    '       — choose the one the intelligence supports:\n' +
    '       (a) IF Navoi already produces this product at scale → state the current annual volume / ' +
    '           number of facilities / operating plant names, plus the unmet domestic and regional ' +
    '           demand a new line could absorb (e.g. "Navoi Region currently produces ~X tons/year ' +
    '           of [product] across N facilities, against estimated regional demand of Y tons/year.").\n' +
    '       (b) IF Navoi has the upstream inputs but no finished-product line → name the specific ' +
    '           raw materials Navoi already supplies (gold, uranium, copper, cotton, gas-condensate, ' +
    '           marble, phosphate, etc.) and the integration gap a new facility would close ' +
    '           (e.g. "Navoi mines ~X kt/year of [feedstock] but has no integrated [finished product] ' +
    '           line — a new facility would convert local input into export-grade output.").\n' +
    '       (c) IF Navoi has no current production at scale → state the documented resource + ' +
    '           logistics base that makes a greenfield facility viable, with a realistic capacity ' +
    '           ceiling (e.g. "Navoi has no current [product] production at scale, but [resource A], ' +
    '           [resource B] and Trans-Caspian rail access support a greenfield facility of up to ' +
    '           X tons/year serving the 13-country regional market.").\n' +
    '       After stating the Navoi production reality, ONE short connector sentence linking what ' +
    '       [recipient company] already does in [their country] to that Navoi production opportunity. ' +
    '       NEVER flatter, NEVER hype, NEVER evaluate the recipient\'s character. Use the Navoi figures ' +
    '       from the COMPANY & RECIPIENT INTELLIGENCE block — if a Navoi figure is "unknown" there, ' +
    '       do NOT invent one; describe the resource base qualitatively instead. 2–4 sentences total.\n' +
    '  ¶2 — COST AND ECONOMIC ADVANTAGES: Cover EVERY entry in the COMPARATIVE ADVANTAGES section ' +
    '       of the VERIFIED DATA block. Do not skip any metric. For each advantage, state BOTH the ' +
    '       Navoi figure AND the recipient country figure explicitly, then the annual implication ' +
    '       in one phrase. Group naturally — operating costs (energy + labour), fiscal position ' +
    '       (corporate tax + property tax + import duties), market access if present. Show arithmetic ' +
    '       where data allows. This paragraph may be 3–5 sentences or two short paragraphs if there ' +
    '       are 5 or more metrics. Example rhythm: "Industrial electricity in Navoi runs at $40/MWh ' +
    '       against [country]\'s $[X]/MWh — at [Y]MW and 8,000 hours/year that is roughly $[Z]K in ' +
    '       annual savings. Labour costs follow the same pattern: [UZ figure] versus [country figure]. ' +
    '       Corporate income tax is [UZ%] versus [country%]."\n' +
    '  ¶3 — REGULATORY FRAMEWORK AND ALL REMAINING ADVANTAGES: Cover ALL FEZ incentive terms: ' +
    '       tax holiday (exact years from the data block), property tax exemption, 0% import customs ' +
    '       on technological equipment AND raw materials, land allocation terms if listed. Reference ' +
    '       the specific Presidential Decree number (e.g. "Decree No. 820"). Then add ALL logistics ' +
    '       and transport data from the LOGISTICS section, and ALL tariff advantages from the TARIFFS ' +
    '       section. Every line in the data block must appear in the email — either in ¶2 or ¶3. ' +
    '       Frame the whole paragraph as legal certainty and infrastructure fact, not a sales claim.\n' +
    '  ¶4 — One clear invitation. Do NOT offer multiple options — that is a menu, not a decision. ' +
    '       Choose exactly one: either a named colleague who can send a two-page cost-comparison ' +
    '       summary within 5 business days, OR an in-person visit to Navoi with logistics covered. ' +
    '       State it as a confident, specific offer. Then stop.\n\n' +
    'WRITING VOICE — what makes this sound human:\n' +
    '  • Vary sentence length aggressively. Mix 4–6 word punches with 20–25 word detail sentences.\n' +
    '  • Use contractions sparingly but naturally where the language allows (we\'re, it\'s).\n' +
    '  • Speak in the first person ("I noticed", "I would welcome", "we can offer"). Avoid passive corporate voice.\n' +
    '  • Show interest in THEM, not just the deal. One sentence that shows curiosity, not just pitch.\n' +
    '  • Be confident, not boastful. State facts plainly; let the numbers do the persuading.\n' +
    '  • Sound like someone who can actually pick up the phone and make things happen.\n\n' +
    'HARD RULES (these are non-negotiable):\n' +
    '  1. NEVER use these AI-cliché openings: "I hope this email finds you well", "I am writing to introduce", ' +
    '     "I am writing to outline", "I am writing to reach out", "I wanted to reach out", "I am pleased to", ' +
    '     "Recognizing your focus on", "In today\'s landscape". The formal diplomatic identification sentence ' +
    '     described in the SALUTATION/BRIEF IDENTIFICATION step ("I write to you regarding [product]", ' +
    '     "On behalf of the Department of Investment, Industry and Trade", "I write in my capacity as") ' +
    '     is mandatory and IS allowed — it is not a cliché but required diplomatic protocol.\n' +
    '  2. NEVER use these cliché phrases: leverage, synergies, win-win, unlock potential, cutting-edge, ' +
    '     best-in-class, game-changer, seamless, transformative, value proposition, robust ecosystem, ' +
    '     unique opportunity, mutually beneficial, strategic alignment, ecosystem partner.\n' +
    '  3. NEVER use em-dashes ( — ). Use commas, periods, or parentheses instead. Em-dashes are an AI tell.\n' +
    '  4. NEVER use bullet points in the email body. Prose only.\n' +
    '  5. NEVER invent a number. Every figure must come from the VERIFIED DATA block or the market intelligence. ' +
    '     If you are unsure whether a number is in the data, do not write it.\n' +
    '  6. NEVER use these energy phrases: "virtually free", "near-zero", "effectively free", "100% cheaper", ' +
    '     "almost free". For subsidised gas write "state-subsidised industrial tariff" or "highly competitive".\n' +
    '  7. NEVER use "guaranteed" about incentives. Say "under current Presidential Decree" or "as currently codified".\n' +
    '  8. NEVER end with "Would you be open to a brief 30-minute call". Use one of the concrete CTAs above.\n' +
    '  9. Reference the recipient by name once. Reference the company by name once or twice maximum. ' +
    '     Don\'t over-personalise — it reads as forced.\n' +
    ' 10. Length: ' + pc.wordRange + ' words total, ' + pc.paras + ' paragraphs. Respect strictly.\n' +
    ' 11. NEVER hedge: "I believe", "I think", "could present an opportunity", "might be relevant", ' +
    '     "perhaps we could", "may offer", "could potentially". State facts, not opinions or hopes.\n' +
    ' 12. NEVER evaluate or flatter the recipient\'s decisions: "highlights your commitment", ' +
    '     "demonstrating your leadership", "your focus on quality", "your strategic vision", ' +
    '     "this shows your ambition". Describe what happened, not what it says about their character.\n' +
    ' 13. NEVER offer more than ONE call-to-action. One invitation only. No "alternatively", ' +
    '     "or if you prefer", "whichever suits you". Pick one and state it with confidence.\n' +
    ' 14. NEVER use these phrases: "advantageous opportunity", "ease your cost structure", ' +
    '     "compelling offer/case/incentive", "strategic logistical hub", "align our resources", ' +
    '     "support your expansion efforts", "tailored solution", "significantly ease", ' +
    '     "meet your needs", "uniquely positioned", "I would welcome the chance".\n' +
    ' 15. GOVERNMENT REGISTER: You represent a public institution. State the legal/regulatory framework ' +
    '     with precision. Reference specific decree numbers (e.g. "Decree No. 820"), not vague ' +
    '     "current Presidential Decrees". Confidence comes from verified facts, not enthusiasm.\n' +
    ' 16. COVERAGE IS MANDATORY: Before finalising the email, check that EVERY bullet point from the ' +
    '     VERIFIED DATA block appears in the text. If a metric is in the data, it must be in the email. ' +
    '     Skipping any advantage is not acceptable.\n\n' +
    'EXAMPLES — calibrate your voice from these (DO NOT copy the wording):\n' +
    '  Weak (AI-sounding, full of clichés):\n' +
    '    "I hope this email finds you well. I am writing to introduce the Navoi Free Economic Zone, ' +
    '     a robust ecosystem offering unparalleled opportunities for forward-thinking manufacturers like ' +
    '     [Company] to leverage strategic advantages and unlock new value. I believe this could present ' +
    '     an advantageous opportunity for your expansion efforts."\n' +
    '  Strong (government official — salutation, identification, Navoi production, then numbers, one ask):\n' +
    '    "Dear Mr. [Surname],\n\n' +
    '     On behalf of the Department of Investment, Industry and Trade of Navoi Region, Republic of ' +
    '     Uzbekistan, I write to you regarding [product] manufacturing economics.\n\n' +
    '     Navoi Region currently produces around [X tons/year] of [product] across [N] facilities, ' +
    '     with a documented regional demand gap of roughly [Y tons/year] across Uzbekistan, Kazakhstan ' +
    '     and Tajikistan. [Recipient Company]\'s [specific recent activity in their country] mirrors ' +
    '     the production profile a new Navoi line would require.\n\n' +
    '     At the Navoi FEZ industrial electricity tariff of $40/MWh, a facility at that scale running ' +
    '     at 80% load saves approximately $[X]K per year versus the [country] grid rate. Under ' +
    '     Presidential Decree No. [X], corporate income tax is zero for the first [N] years from ' +
    '     commencement of production, with no property tax and 0% import duty on process equipment.\n\n' +
    '     My colleague Sh. Toshmatov can send a two-page cost-comparison summary within five business ' +
    '     days if you would like the figures reviewed against your own model."\n\n' +
    'SIGN-OFF — use this format exactly (no bold, no extra blank lines):\n' +
    '  Yours sincerely,\n' +
    '  E. I. Gafforov\n' +
    '  Head of the Department of Investment, Industry and Trade\n' +
    '  Navoi Region, Republic of Uzbekistan\n' +
    '  info@navoi.uz · +998 79 229 62 23';

  var subjectRules =
    'SUBJECT LINE — make it sound like a real person sending one email, not a campaign:\n' +
    '• 45-70 characters. No "Subject:" prefix, no markdown, no emojis, no exclamation/question marks.\n' +
    '• It should read like something a senior official would actually type into the subject field — quietly ' +
    '  specific, not promotional.\n' +
    '• Good shape (DO NOT copy verbatim — adapt):\n' +
    '    "A note from Navoi on ' + (productInfo && productInfo.displayName ? productInfo.displayName.toLowerCase() : 'your manufacturing') + ' production"\n' +
    '    "' + (comp.kompaniya || '[Company]') + ' and Navoi: a ' + taxHolidayYearsForSubject + '-year proposal worth a brief look"\n' +
    '    "Following up on ' + (comp.davlat || 'your market') + ' manufacturing economics"\n' +
    '• BANNED words anywhere in subject: Unlock, Discover, Transform, Exciting, Game-changing, Revolutionary, ' +
    '  Cutting-edge. The word "Opportunity" alone is also banned (too generic).\n' +
    '• Write the subject in ' + langName + '. If ' + langName + ' uses a non-Latin script, use that script.';

  var letterPrompt =
    'You are drafting a diplomatic outreach email on behalf of the Navoi Regional Investment Office (Republic of Uzbekistan), signed by E. I. Gafforov, Head of the Department of Investment, Industry and Trade.\n\n' +
    'WRITE IN: ' + langName + ' (the entire subject + body must be in ' + langName + ').\n\n' +
    personaBlock + '\n\n' +
    dataBlock + '\n\n' +
    styleBlock + '\n\n' +
    subjectRules +
    dedupNote + '\n\n' +
    'OUTPUT FORMAT — exact:\n' +
    'Line 1: the subject (no "Subject:" prefix, no markdown).\n' +
    'Line 2: ===BODY===\n' +
    'Line 3+: the email body itself, starting with the salutation (e.g. "Dear Mr Park," / "Уважаемый г-н Парк," / "박 대표님께,").\n\n' +
    'Before you write — silently check: did you use a banned phrase? did you invent any number? if yes, rewrite. Then output.';

  /* ═══ OpenAI generation — 2-stage pipeline: company-specific intel → o4-mini human writing ═══ */
  var letterRaw = await (async function(){
    var hasOpenAI = (typeof callOpenAI === 'function') && (typeof getOpenAIKey === 'function') && getOpenAIKey();
    /* System message: humanise the writer's identity. Not "an AI office assistant" — Gafforov himself. */
    var systemMsg =
      'You are E. I. Gafforov, Head of the Department of Investment, Industry and Trade, Navoi Region ' +
      '(Republic of Uzbekistan), writing personally to a foreign business executive. You are a government ' +
      'official, not a salesperson or marketing department. You have studied this specific company and you ' +
      'respect the recipient enough to be brief, precise, and direct. You do not pitch — you present a ' +
      'factual economic case and extend one clear invitation. Your emails state facts and let the numbers ' +
      'persuade; you never flatter ("highlights your commitment"), never hedge ("I believe", "perhaps", ' +
      '"could present an opportunity"), and never use corporate clichés ("leverage", "synergies", "robust ' +
      'ecosystem", "strategic alignment", em-dashes). You use only the figures provided. ' +
      'You write in the first person, you reference one specific decree or incentive, ' +
      'you make one concrete ask, and you stop.';

    if(hasOpenAI){
      /* ── Stage 1: research THIS company specifically. We want concrete hooks to open with. ── */
      var marketCtx = '';
      try{
        var compCountryName = comp.davlat || getAiCompanyCountry(comp) || '';
        var productLabel2 = (productInfo && productInfo.displayName) || comp.mahsulotNomi || comp.soha || '';
        var companyName2 = comp.kompaniya || '';
        var recipientName2 = comp.rahbar || '';
        /* Focused query: company-specific facts FIRST, country context SECOND. The model's reasoning
           needs an opening hook, not generic statistics. */
        var searchQuery =
          'Provide a factual, sourced brief on the following company so a regional investment official ' +
          'can write a personalised outreach email. Include only what is verifiable from credible sources ' +
          '(company website, press releases, trade publications, LinkedIn, news 2024-2026).\n\n' +
          'COMPANY: ' + companyName2 + '\n' +
          (recipientName2 ? 'CONTACT PERSON: ' + recipientName2 + (comp.lavozim ? ', ' + comp.lavozim : '') + '\n' : '') +
          (compCountryName ? 'BASED IN: ' + compCountryName + '\n' : '') +
          (productLabel2 ? 'PRODUCT FOCUS: ' + productLabel2 + '\n' : '') +
          '\nGather and concisely return:\n' +
          '1. What does this company actually make or sell? (product mix, recent launches)\n' +
          '2. Recent (2024-2026) corporate news: expansions, new markets, awards, leadership changes, ' +
          '   investments, supply chain shifts. Anything a peer would mention as a credible opener.\n' +
          '3. Their main export markets, if known. Where do they ship?\n' +
          '4. Industry-level pressure points in their country (rising labor cost, energy cost, tariffs, ' +
          '   regulation) that might make them open to relocating part of production.\n' +
          '5. Anything personal/professional about ' + (recipientName2 || 'the contact') + ' that is ' +
          'publicly documented (recent interviews, conference speeches, named projects). Only verifiable facts.\n' +
          '6. NAVOI REGION PRODUCTION CONTEXT for ' + (productLabel2 || 'this product') + ' — this is the ' +
          'highest-priority section: the email must OPEN with these facts. Research and return:\n' +
          '   • Current production of ' + (productLabel2 || 'the product') + ' in Navoi Region, Uzbekistan ' +
          '(volume in tons / m² / units per year, number of facilities, names of operating plants if any).\n' +
          '   • Upstream inputs / raw materials Navoi already supplies that feed this product (e.g. gold, ' +
          'uranium, copper, cotton, gas-condensate, marble, phosphate — be specific to the product).\n' +
          '   • Navoi FEZ / industrial parks where this product or its inputs are processed.\n' +
          '   • Regional / domestic demand gap a new manufacturing line could absorb (Uzbekistan + 13-country ' +
          'CIS-Central-Asia-South-Asia market).\n' +
          '   • If Navoi currently has zero production at scale, state the documented resource + logistics ' +
          'base that makes a greenfield facility viable, with a realistic capacity ceiling.\n' +
          '   Cite sources for every Navoi figure (uzstat.uz, stat.uz, gov.uz, navoifez.uz, navoi.gov.uz, ' +
          'presidential decrees, trade publications).\n\n' +
          'Output a short, scannable briefing (400-600 words). Use plain prose with short labelled sections. ' +
          'If something is unknown, say "unknown" — do NOT guess. Cite sources inline like (source: domain.com).';
        var sResp = await callOpenAI(
          [{ role:'user', content: searchQuery }],
          { model: 'gpt-4o-search-preview', webSearch: true, maxTokens: 900, timeoutMs: 75000 }
        );
        if(sResp && sResp.content) marketCtx = sResp.content;
      }catch(eSearch){ console.warn('Letter web-search stage skipped:', eSearch && eSearch.message); }

      /* ── Stage 2: write the email using o4-mini (deep reasoning), fallback to gpt-4o ── */
      var fullUserPrompt = letterPrompt +
        (marketCtx
          ? '\n\n[COMPANY & RECIPIENT INTELLIGENCE — from web research. Use this to open the email with a ' +
            'genuinely specific, personal hook. If a fact contradicts the VERIFIED DATA block, the verified ' +
            'data wins. If a fact is marked "unknown", do NOT invent it.]:\n' + marketCtx
          : '\n\n[NOTE: No external research was available — write the email using only the VERIFIED DATA ' +
            'block. Open with a credible industry-level observation about ' + (comp.davlat || 'the recipient country') +
            ' instead of a company-specific hook.]');
      var msgs = [
        { role:'system', content: systemMsg },
        { role:'user',   content: fullUserPrompt }
      ];

      /* Try o4-mini with high reasoning effort first (best quality + most human prose) */
      try{
        var r1 = await callOpenAI(msgs, {
          model: (window.OPENAI_MODEL_REASONING || 'o4-mini'),
          reasoningEffort: 'high',
          maxTokens: 3500,
          timeoutMs: 120000
        });
        if(r1 && r1.content && r1.content.trim().length > 80) return r1.content;
        throw new Error('o4-mini returned empty or too-short content');
      }catch(e1){
        console.warn('o4-mini letter failed, falling back to gpt-4o:', e1 && e1.message);
      }

      /* Fallback to gpt-4o with higher temperature for more natural prose */
      try{
        var r2 = await callOpenAI(msgs, {
          model: (window.OPENAI_MODEL_DEFAULT || 'gpt-4o'),
          temperature: 0.75,
          maxTokens: 2800,
          timeoutMs: 90000
        });
        if(r2 && r2.content && r2.content.trim().length > 80) return r2.content;
      }catch(e2){
        console.warn('gpt-4o letter failed, falling back to Gemini:', e2 && e2.message);
      }
    }

    /* ═══ Gemini fallback (only used if OpenAI not configured or both attempts failed) ═══ */
    var body2 = {contents:[{role:'user',parts:[{text:letterPrompt}]}],generationConfig:{temperature:0.72,maxOutputTokens:8192}};
    var key = (typeof getGeminiKey === 'function') ? getGeminiKey() : '';
    if(!key) throw new Error('Hech qaysi AI provayder sozlanmagan. Sozlamalardan OpenAI yoki Gemini kalit kiriting.');
    var models = typeof GEMINI_MODELS !== 'undefined' ? GEMINI_MODELS : ['gemini-2.0-flash'];
    for(var mi=0;mi<models.length;mi++){
      try{
        var streamUrl = 'https://generativelanguage.googleapis.com/v1beta/models/'+models[mi]+':streamGenerateContent?alt=sse&key='+key;
        var resp3 = await fetch(streamUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body2)});
        if(!resp3.ok) continue;
        var reader = resp3.body.getReader();
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
      }catch(e){ console.warn('Gemini stream error:', e); }
    }
    var data2f = await callGemini(body2);
    return geminiText(data2f);
  })();
  var letterSubject = 'A note from Navoi on a potential collaboration';
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

  /* ── Humanizer post-processing — strip residual AI tells the model might have slipped in ── */
  letterBody = humaniseLetterBody(letterBody);
  letterSubject = humaniseLetterSubject(letterSubject);

  return {
    analysis: analysis,
    transportSummary: transportSummary,
    tariffSummary: tariffSummary,
    productInfo: productInfo,
    officialLines: advantageLines,
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
  // No country is fine — email will rely on FEZ incentives + Navoi logistics data instead
  // of country-vs-UZ economic comparisons.

  var lang = dom.lang ? dom.lang.value : 'en';

  // Find all contacts from same company
  var companyKey = getInvestorCompanyGroupKey(comp);
  var allContacts = (DB.investorCompanies||[]).filter(function(c){
    return getInvestorCompanyGroupKey(c) === companyKey;
  });

  var lt = toastLoading('⏳ AI xat tayyorlanmoqda: ' + escHtml(comp.kompaniya || '') + ' (' + allContacts.length + ' ta kontakt) — 2 bosqich: qidiruv + chuqur tahlil...');

  try {
    // Generate letters for all contacts — analysis runs ONCE per company (shared across contacts)
    window._aiContactLetters = {};
    var sharedAnalysis = null;
    var sharedTariff = null;
    var usedAngles = []; // track persona/hook already used to avoid repeating across contacts
    for(var ci=0; ci<allContacts.length; ci++){
      var contact = allContacts[ci];
      // First contact: full pipeline (country analysis + tariff). Subsequent: reuse, only letter regenerated.
      if(ci === 0){
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
      var persona = detectContactPersona(contact.lavozim || contact.title || '');
      var payload = await buildAiLetterPackage(contact, lang, sharedAnalysis, sharedTariff, {
        contactIdx: ci,
        contactTotal: allContacts.length,
        usedAngles: usedAngles.slice()
      });
      usedAngles.push(persona);
      saveAiLetterPackage(contact, payload);
      window._aiContactLetters[String(contact.id)] = {contact: contact, payload: payload};
    }

    // Show contacts list
    renderAiContactsList(allContacts, scope);

    // Hydrate with first contact
    hydrateAiScope(scope, allContacts[0], window._aiContactLetters[String(allContacts[0].id)].payload);

    toastDone(lt, '✅ AI xat tayyor! ' + escHtml(comp.kompaniya || '') + ' — ' + allContacts.length + ' ta kontakt');

    // Push to AI bell — visible even if user navigated away
    try {
      pushAiReadyNotification({
        companyId: String(comp.id),
        companyName: String(comp.kompaniya || ''),
        contactCount: allContacts.length,
        scope: scope
      });
    } catch(e){}

  } catch(e){
    toastDone(lt, '❌ Xato: '+e.message,'error');
    console.error(e);
  }
}

/* ═══════════════════════════════════════
   AI BELL — notifications for ready analyses
═══════════════════════════════════════ */
var AI_BELL_KEY = '_aiBellNotifications';
function getAiBellList(){
  try {
    var raw = localStorage.getItem(AI_BELL_KEY);
    var parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch(e){ return []; }
}
function saveAiBellList(list){
  try { localStorage.setItem(AI_BELL_KEY, JSON.stringify(list || [])); } catch(e){}
}
function pushAiReadyNotification(entry){
  if(!entry || !entry.companyId) return;
  var list = getAiBellList();
  // Dedupe — replace existing entry for same company
  list = list.filter(function(n){ return String(n.companyId) !== String(entry.companyId); });
  list.unshift({
    companyId: String(entry.companyId),
    companyName: String(entry.companyName || ''),
    contactCount: Number(entry.contactCount || 1),
    scope: String(entry.scope || 'investor'),
    timestamp: new Date().toISOString(),
    seen: false
  });
  list = list.slice(0, 30);
  saveAiBellList(list);
  renderAiBellList();
}
window.pushAiReadyNotification = pushAiReadyNotification;

function renderAiBellList(){
  var list = getAiBellList();
  var container = document.getElementById('aiBellList');
  var countEl = document.getElementById('aiBellCount');
  var unseen = list.filter(function(n){ return !n.seen; }).length;
  if(countEl){
    if(unseen > 0){
      countEl.textContent = String(unseen);
      countEl.style.display = '';
    } else {
      countEl.style.display = 'none';
    }
  }
  if(!container) return;
  if(!list.length){
    container.innerHTML = '<div class="p-3 text-center text-muted" style="font-size:.8rem">Hozircha tayyor tahlillar yo\'q</div>';
    return;
  }
  container.innerHTML = list.map(function(n){
    var when = '';
    try { when = new Date(n.timestamp).toLocaleString('uz-UZ'); } catch(e){ when = n.timestamp; }
    var unreadDot = n.seen ? '' : '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#7C3AED;margin-right:6px"></span>';
    return '<div onclick="openAiBellNotification(\''+n.companyId+'\')" style="padding:.75rem 1rem;border-bottom:1px solid rgba(15,23,42,.06);cursor:pointer;transition:background .15s" onmouseover="this.style.background=\'rgba(70,95,255,.04)\'" onmouseout="this.style.background=\'\'">' +
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">'+unreadDot+'<div style="font-size:.85rem;font-weight:700;color:#111827">'+escapeHtmlText(n.companyName||'Kompaniya')+'</div></div>' +
      '<div style="font-size:.68rem;color:#6B7280">'+n.contactCount+' ta kontakt · '+escapeHtmlText(when)+'</div>' +
    '</div>';
  }).join('');
}
window.openAiBellNotification = function(companyId){
  var list = getAiBellList();
  var entry = list.find(function(n){ return String(n.companyId) === String(companyId); });
  if(entry){
    entry.seen = true;
    saveAiBellList(list);
    renderAiBellList();
  }
  // Open the investor AI workspace for that company
  if(typeof openInvestorAiWorkspace === 'function'){
    openInvestorAiWorkspace(String(companyId));
  }
  // Close bell dropdown
  var bell = document.getElementById('ai-bell-drop');
  if(bell && bell.click) {
    try { document.body.click(); } catch(e){}
  }
};
window.clearAiBellNotifications = function(){
  saveAiBellList([]);
  renderAiBellList();
};

// Hydrate on load
(function initAiBell(){
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', renderAiBellList);
  } else {
    setTimeout(renderAiBellList, 100);
  }
})();

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
      // No country is allowed — email uses FEZ/logistics-only mode
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

