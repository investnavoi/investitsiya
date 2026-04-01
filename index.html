const DEFAULT_COUNTRIES = [
  { reporterCode: "860", code: "UZ", iso3: "UZB", name: "Uzbekistan" },
  { reporterCode: "795", code: "TM", iso3: "TKM", name: "Turkmenistan" },
  { reporterCode: "762", code: "TJ", iso3: "TJK", name: "Tajikistan" },
  { reporterCode: "417", code: "KG", iso3: "KGZ", name: "Kyrgyzstan" },
  { reporterCode: "398", code: "KZ", iso3: "KAZ", name: "Kazakhstan" },
  { reporterCode: "496", code: "MN", iso3: "MNG", name: "Mongolia" },
  { reporterCode: "643", code: "RU", iso3: "RUS", name: "Russia" },
  { reporterCode: "031", code: "AZ", iso3: "AZE", name: "Azerbaijan" },
  { reporterCode: "268", code: "GE", iso3: "GEO", name: "Georgia" },
  { reporterCode: "051", code: "AM", iso3: "ARM", name: "Armenia" },
  { reporterCode: "364", code: "IR", iso3: "IRN", name: "Iran" },
  { reporterCode: "004", code: "AF", iso3: "AFG", name: "Afghanistan" },
  { reporterCode: "586", code: "PK", iso3: "PAK", name: "Pakistan" }
];

const YEARS = [2021, 2022, 2023, 2024];
const REPORTERS_URL = "https://comtradeapi.un.org/files/v1/app/reference/Reporters.json";
const WITS_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Referer": "https://wits.worldbank.org/",
  "Origin": "https://wits.worldbank.org"
};
const STATIC_COUNTRY_LOOKUP = {"Afghanistan":{"code":"AF","iso3":"AFG","reporterCode":"004"},"Albania":{"code":"AL","iso3":"ALB","reporterCode":"008"},"Algeria":{"code":"DZ","iso3":"DZA","reporterCode":"012"},"Andorra":{"code":"AD","iso3":"AND","reporterCode":"020"},"Angola":{"code":"AO","iso3":"AGO","reporterCode":"024"},"Antigua and Barbuda":{"code":"AG","iso3":"ATG","reporterCode":"028"},"Argentina":{"code":"AR","iso3":"ARG","reporterCode":"032"},"Armenia":{"code":"AM","iso3":"ARM","reporterCode":"051"},"Australia":{"code":"AU","iso3":"AUS","reporterCode":"036"},"Austria":{"code":"AT","iso3":"AUT","reporterCode":"040"},"Azerbaijan":{"code":"AZ","iso3":"AZE","reporterCode":"031"},"Bahamas":{"code":"BS","iso3":"BHS","reporterCode":"044"},"Bahrain":{"code":"BH","iso3":"BHR","reporterCode":"048"},"Bangladesh":{"code":"BD","iso3":"BGD","reporterCode":"050"},"Barbados":{"code":"BB","iso3":"BRB","reporterCode":"052"},"Belarus":{"code":"BY","iso3":"BLR","reporterCode":"112"},"Belgium":{"code":"BE","iso3":"BEL","reporterCode":"056"},"Belize":{"code":"BZ","iso3":"BLZ","reporterCode":"084"},"Benin":{"code":"BJ","iso3":"BEN","reporterCode":"204"},"Bhutan":{"code":"BT","iso3":"BTN","reporterCode":"064"},"Bolivia":{"code":"BO","iso3":"BOL","reporterCode":"068"},"Bosnia and Herzegovina":{"code":"BA","iso3":"BIH","reporterCode":"070"},"Botswana":{"code":"BW","iso3":"BWA","reporterCode":"072"},"Brazil":{"code":"BR","iso3":"BRA","reporterCode":"076"},"Brunei":{"code":"BN","iso3":"BRN","reporterCode":"096"},"Bulgaria":{"code":"BG","iso3":"BGR","reporterCode":"100"},"Burkina Faso":{"code":"BF","iso3":"BFA","reporterCode":"854"},"Burundi":{"code":"BI","iso3":"BDI","reporterCode":"108"},"Cabo Verde":{"code":"CV","iso3":"CPV","reporterCode":"132"},"Cambodia":{"code":"KH","iso3":"KHM","reporterCode":"116"},"Cameroon":{"code":"CM","iso3":"CMR","reporterCode":"120"},"Canada":{"code":"CA","iso3":"CAN","reporterCode":"124"},"Central African Republic":{"code":"CF","iso3":"CAF","reporterCode":"140"},"Chad":{"code":"TD","iso3":"TCD","reporterCode":"148"},"Chile":{"code":"CL","iso3":"CHL","reporterCode":"152"},"China":{"code":"CN","iso3":"CHN","reporterCode":"156"},"Colombia":{"code":"CO","iso3":"COL","reporterCode":"170"},"Comoros":{"code":"KM","iso3":"COM","reporterCode":"174"},"Congo":{"code":"CG","iso3":"COG","reporterCode":"178"},"Costa Rica":{"code":"CR","iso3":"CRI","reporterCode":"188"},"Croatia":{"code":"HR","iso3":"HRV","reporterCode":"191"},"Cuba":{"code":"CU","iso3":"CUB","reporterCode":"192"},"Cyprus":{"code":"CY","iso3":"CYP","reporterCode":"196"},"Czech Republic":{"code":"CZ","iso3":"CZE","reporterCode":"203"},"DR Congo":{"code":"CD","iso3":"COD","reporterCode":"180"},"Denmark":{"code":"DK","iso3":"DNK","reporterCode":"208"},"Djibouti":{"code":"DJ","iso3":"DJI","reporterCode":"262"},"Dominica":{"code":"DM","iso3":"DMA","reporterCode":"212"},"Dominican Republic":{"code":"DO","iso3":"DOM","reporterCode":"214"},"Ecuador":{"code":"EC","iso3":"ECU","reporterCode":"218"},"Egypt":{"code":"EG","iso3":"EGY","reporterCode":"818"},"El Salvador":{"code":"SV","iso3":"SLV","reporterCode":"222"},"Equatorial Guinea":{"code":"GQ","iso3":"GNQ","reporterCode":"226"},"Eritrea":{"code":"ER","iso3":"ERI","reporterCode":"232"},"Estonia":{"code":"EE","iso3":"EST","reporterCode":"233"},"Eswatini":{"code":"SZ","iso3":"SWZ","reporterCode":"748"},"Ethiopia":{"code":"ET","iso3":"ETH","reporterCode":"231"},"Fiji":{"code":"FJ","iso3":"FJI","reporterCode":"242"},"Finland":{"code":"FI","iso3":"FIN","reporterCode":"246"},"France":{"code":"FR","iso3":"FRA","reporterCode":"250"},"Gabon":{"code":"GA","iso3":"GAB","reporterCode":"266"},"Gambia":{"code":"GM","iso3":"GMB","reporterCode":"270"},"Georgia":{"code":"GE","iso3":"GEO","reporterCode":"268"},"Germany":{"code":"DE","iso3":"DEU","reporterCode":"276"},"Ghana":{"code":"GH","iso3":"GHA","reporterCode":"288"},"Greece":{"code":"GR","iso3":"GRC","reporterCode":"300"},"Grenada":{"code":"GD","iso3":"GRD","reporterCode":"308"},"Guatemala":{"code":"GT","iso3":"GTM","reporterCode":"320"},"Guinea":{"code":"GN","iso3":"GIN","reporterCode":"324"},"Guinea-Bissau":{"code":"GW","iso3":"GNB","reporterCode":"624"},"Guyana":{"code":"GY","iso3":"GUY","reporterCode":"328"},"Haiti":{"code":"HT","iso3":"HTI","reporterCode":"332"},"Honduras":{"code":"HN","iso3":"HND","reporterCode":"340"},"Hungary":{"code":"HU","iso3":"HUN","reporterCode":"348"},"Iceland":{"code":"IS","iso3":"ISL","reporterCode":"352"},"India":{"code":"IN","iso3":"IND","reporterCode":"356"},"Indonesia":{"code":"ID","iso3":"IDN","reporterCode":"360"},"Iran":{"code":"IR","iso3":"IRN","reporterCode":"364"},"Iraq":{"code":"IQ","iso3":"IRQ","reporterCode":"368"},"Ireland":{"code":"IE","iso3":"IRL","reporterCode":"372"},"Israel":{"code":"IL","iso3":"ISR","reporterCode":"376"},"Italy":{"code":"IT","iso3":"ITA","reporterCode":"380"},"Ivory Coast":{"code":"CI","iso3":"CIV","reporterCode":"384"},"Jamaica":{"code":"JM","iso3":"JAM","reporterCode":"388"},"Japan":{"code":"JP","iso3":"JPN","reporterCode":"392"},"Jordan":{"code":"JO","iso3":"JOR","reporterCode":"400"},"Kazakhstan":{"code":"KZ","iso3":"KAZ","reporterCode":"398"},"Kenya":{"code":"KE","iso3":"KEN","reporterCode":"404"},"Kiribati":{"code":"KI","iso3":"KIR","reporterCode":"296"},"Kosovo":{"code":"XK","iso3":"XKX","reporterCode":""},"Kuwait":{"code":"KW","iso3":"KWT","reporterCode":"414"},"Kyrgyzstan":{"code":"KG","iso3":"KGZ","reporterCode":"417"},"Laos":{"code":"LA","iso3":"LAO","reporterCode":"418"},"Latvia":{"code":"LV","iso3":"LVA","reporterCode":"428"},"Lebanon":{"code":"LB","iso3":"LBN","reporterCode":"422"},"Lesotho":{"code":"LS","iso3":"LSO","reporterCode":"426"},"Liberia":{"code":"LR","iso3":"LBR","reporterCode":"430"},"Libya":{"code":"LY","iso3":"LBY","reporterCode":"434"},"Liechtenstein":{"code":"LI","iso3":"LIE","reporterCode":"438"},"Lithuania":{"code":"LT","iso3":"LTU","reporterCode":"440"},"Luxembourg":{"code":"LU","iso3":"LUX","reporterCode":"442"},"Madagascar":{"code":"MG","iso3":"MDG","reporterCode":"450"},"Malawi":{"code":"MW","iso3":"MWI","reporterCode":"454"},"Malaysia":{"code":"MY","iso3":"MYS","reporterCode":"458"},"Maldives":{"code":"MV","iso3":"MDV","reporterCode":"462"},"Mali":{"code":"ML","iso3":"MLI","reporterCode":"466"},"Malta":{"code":"MT","iso3":"MLT","reporterCode":"470"},"Marshall Islands":{"code":"MH","iso3":"MHL","reporterCode":"584"},"Mauritania":{"code":"MR","iso3":"MRT","reporterCode":"478"},"Mauritius":{"code":"MU","iso3":"MUS","reporterCode":"480"},"Mexico":{"code":"MX","iso3":"MEX","reporterCode":"484"},"Micronesia":{"code":"FM","iso3":"FSM","reporterCode":"583"},"Moldova":{"code":"MD","iso3":"MDA","reporterCode":"498"},"Monaco":{"code":"MC","iso3":"MCO","reporterCode":"492"},"Mongolia":{"code":"MN","iso3":"MNG","reporterCode":"496"},"Montenegro":{"code":"ME","iso3":"MNE","reporterCode":"499"},"Morocco":{"code":"MA","iso3":"MAR","reporterCode":"504"},"Mozambique":{"code":"MZ","iso3":"MOZ","reporterCode":"508"},"Myanmar":{"code":"MM","iso3":"MMR","reporterCode":"104"},"Namibia":{"code":"NA","iso3":"NAM","reporterCode":"516"},"Nauru":{"code":"NR","iso3":"NRU","reporterCode":"520"},"Nepal":{"code":"NP","iso3":"NPL","reporterCode":"524"},"Netherlands":{"code":"NL","iso3":"NLD","reporterCode":"528"},"New Zealand":{"code":"NZ","iso3":"NZL","reporterCode":"554"},"Nicaragua":{"code":"NI","iso3":"NIC","reporterCode":"558"},"Niger":{"code":"NE","iso3":"NER","reporterCode":"562"},"Nigeria":{"code":"NG","iso3":"NGA","reporterCode":"566"},"North Korea":{"code":"KP","iso3":"PRK","reporterCode":"408"},"North Macedonia":{"code":"MK","iso3":"MKD","reporterCode":"807"},"Norway":{"code":"NO","iso3":"NOR","reporterCode":"578"},"Oman":{"code":"OM","iso3":"OMN","reporterCode":"512"},"Pakistan":{"code":"PK","iso3":"PAK","reporterCode":"586"},"Palau":{"code":"PW","iso3":"PLW","reporterCode":"585"},"Palestine":{"code":"PS","iso3":"PSE","reporterCode":"275"},"Panama":{"code":"PA","iso3":"PAN","reporterCode":"591"},"Papua New Guinea":{"code":"PG","iso3":"PNG","reporterCode":"598"},"Paraguay":{"code":"PY","iso3":"PRY","reporterCode":"600"},"Peru":{"code":"PE","iso3":"PER","reporterCode":"604"},"Philippines":{"code":"PH","iso3":"PHL","reporterCode":"608"},"Poland":{"code":"PL","iso3":"POL","reporterCode":"616"},"Portugal":{"code":"PT","iso3":"PRT","reporterCode":"620"},"Qatar":{"code":"QA","iso3":"QAT","reporterCode":"634"},"Romania":{"code":"RO","iso3":"ROU","reporterCode":"642"},"Russia":{"code":"RU","iso3":"RUS","reporterCode":"643"},"Rwanda":{"code":"RW","iso3":"RWA","reporterCode":"646"},"Saint Kitts and Nevis":{"code":"KN","iso3":"KNA","reporterCode":"659"},"Saint Lucia":{"code":"LC","iso3":"LCA","reporterCode":"662"},"Saint Vincent and the Grenadines":{"code":"VC","iso3":"VCT","reporterCode":"670"},"Samoa":{"code":"WS","iso3":"WSM","reporterCode":"882"},"San Marino":{"code":"SM","iso3":"SMR","reporterCode":"674"},"Sao Tome and Principe":{"code":"ST","iso3":"STP","reporterCode":"678"},"Saudi Arabia":{"code":"SA","iso3":"SAU","reporterCode":"682"},"Senegal":{"code":"SN","iso3":"SEN","reporterCode":"686"},"Serbia":{"code":"RS","iso3":"SRB","reporterCode":"688"},"Seychelles":{"code":"SC","iso3":"SYC","reporterCode":"690"},"Sierra Leone":{"code":"SL","iso3":"SLE","reporterCode":"694"},"Singapore":{"code":"SG","iso3":"SGP","reporterCode":"702"},"Slovakia":{"code":"SK","iso3":"SVK","reporterCode":"703"},"Slovenia":{"code":"SI","iso3":"SVN","reporterCode":"705"},"Solomon Islands":{"code":"SB","iso3":"SLB","reporterCode":"090"},"Somalia":{"code":"SO","iso3":"SOM","reporterCode":"706"},"South Africa":{"code":"ZA","iso3":"ZAF","reporterCode":"710"},"South Korea":{"code":"KR","iso3":"KOR","reporterCode":"410"},"South Sudan":{"code":"SS","iso3":"SSD","reporterCode":"728"},"Spain":{"code":"ES","iso3":"ESP","reporterCode":"724"},"Sri Lanka":{"code":"LK","iso3":"LKA","reporterCode":"144"},"Sudan":{"code":"SD","iso3":"SDN","reporterCode":"729"},"Suriname":{"code":"SR","iso3":"SUR","reporterCode":"740"},"Sweden":{"code":"SE","iso3":"SWE","reporterCode":"752"},"Switzerland":{"code":"CH","iso3":"CHE","reporterCode":"756"},"Syria":{"code":"SY","iso3":"SYR","reporterCode":"760"},"Tajikistan":{"code":"TJ","iso3":"TJK","reporterCode":"762"},"Tanzania":{"code":"TZ","iso3":"TZA","reporterCode":"834"},"Thailand":{"code":"TH","iso3":"THA","reporterCode":"764"},"Timor-Leste":{"code":"TL","iso3":"TLS","reporterCode":"626"},"Togo":{"code":"TG","iso3":"TGO","reporterCode":"768"},"Tonga":{"code":"TO","iso3":"TON","reporterCode":"776"},"Trinidad and Tobago":{"code":"TT","iso3":"TTO","reporterCode":"780"},"Tunisia":{"code":"TN","iso3":"TUN","reporterCode":"788"},"Turkey":{"code":"TR","iso3":"TUR","reporterCode":"792"},"Turkmenistan":{"code":"TM","iso3":"TKM","reporterCode":"795"},"Tuvalu":{"code":"TV","iso3":"TUV","reporterCode":"798"},"Uganda":{"code":"UG","iso3":"UGA","reporterCode":"800"},"Ukraine":{"code":"UA","iso3":"UKR","reporterCode":"804"},"United Arab Emirates":{"code":"AE","iso3":"ARE","reporterCode":"784"},"United Kingdom":{"code":"GB","iso3":"GBR","reporterCode":"826"},"United States":{"code":"US","iso3":"USA","reporterCode":"840"},"Uruguay":{"code":"UY","iso3":"URY","reporterCode":"858"},"Uzbekistan":{"code":"UZ","iso3":"UZB","reporterCode":"860"},"Vanuatu":{"code":"VU","iso3":"VUT","reporterCode":"548"},"Vatican City":{"code":"VA","iso3":"VAT","reporterCode":"336"},"Venezuela":{"code":"VE","iso3":"VEN","reporterCode":"862"},"Vietnam":{"code":"VN","iso3":"VNM","reporterCode":"704"},"Yemen":{"code":"YE","iso3":"YEM","reporterCode":"887"},"Zambia":{"code":"ZM","iso3":"ZMB","reporterCode":"894"},"Zimbabwe":{"code":"ZW","iso3":"ZWE","reporterCode":"716"}};
const COUNTRY_ALIASES = {
  "bolivia": "Bolivia (Plurinational State of)",
  "bosnia and herzegovina": "Bosnia Herzegovina",
  "brunei": "Brunei Darussalam",
  "central african republic": "Central African Rep.",
  "czech republic": "Czechia",
  "dr congo": "Dem. Rep. of the Congo",
  "dominican republic": "Dominican Rep.",
  "ivory coast": "CI",
  "laos": "Lao People's Dem. Rep.",
  "liechtenstein": "CH",
  "marshall islands": "Marshall Isds",
  "micronesia": "FS Micronesia",
  "moldova": "Rep. of Moldova",
  "monaco": "FR",
  "north korea": "Dem. People's Rep. of Korea",
  "palestine": "State of Palestine",
  "russia": "Russian Federation",
  "solomon islands": "Solomon Isds",
  "south korea": "Rep. of Korea",
  "tanzania": "United Rep. of Tanzania",
  "turkey": "TR",
  "united states": "US",
  "vatican city": "Holy See (Vatican City State)",
  "vietnam": "Viet Nam"
};
let reportersLookupPromise = null;
let staticCountryMaps = null;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function buildReporterEntry(item, preferredName) {
  return {
    reporterCode: String(item.reporterCode || "").padStart(3, "0"),
    iso3: item.reporterCodeIsoAlpha3 || "",
    code: item.reporterCodeIsoAlpha2 || preferredName || item.text || "",
    name: preferredName || item.text || ""
  };
}

async function getReportersLookup() {
  if (!reportersLookupPromise) {
    reportersLookupPromise = fetch(REPORTERS_URL)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Reporters ${response.status}`);
        return response.json();
      })
      .then((json) => {
        const results = Array.isArray(json?.results) ? json.results.filter((item) => !item?.isGroup) : [];
        const byCode = new Map();
        const byIso2 = new Map();
        const byIso3 = new Map();
        const byName = new Map();
        results.forEach((item) => {
          const reporterCode = String(item?.reporterCode || "").padStart(3, "0");
          if (reporterCode) byCode.set(reporterCode, item);
          if (item?.reporterCodeIsoAlpha2) byIso2.set(String(item.reporterCodeIsoAlpha2).toUpperCase(), item);
          if (item?.reporterCodeIsoAlpha3) byIso3.set(String(item.reporterCodeIsoAlpha3).toUpperCase(), item);
          [item?.text, item?.reporterDesc, item?.reporterNote].forEach((value) => {
            const normalized = normalizeText(value);
            if (normalized && !byName.has(normalized)) byName.set(normalized, item);
          });
        });
        return { byCode, byIso2, byIso3, byName };
      })
      .catch((error) => {
        reportersLookupPromise = null;
        throw error;
      });
  }
  return reportersLookupPromise;
}

function getStaticCountryMaps() {
  if (staticCountryMaps) return staticCountryMaps;
  const byCode = new Map();
  const byIso2 = new Map();
  const byIso3 = new Map();
  const byName = new Map();
  Object.entries(STATIC_COUNTRY_LOOKUP).forEach(([name, raw]) => {
    const entry = {
      reporterCode: String(raw?.reporterCode || "").padStart(3, "0"),
      iso3: String(raw?.iso3 || "").toUpperCase(),
      code: String(raw?.code || "").toUpperCase(),
      name
    };
    if (entry.reporterCode) byCode.set(entry.reporterCode, entry);
    if (entry.code) byIso2.set(entry.code, entry);
    if (entry.iso3) byIso3.set(entry.iso3, entry);
    const normalized = normalizeText(name);
    if (normalized) byName.set(normalized, entry);
  });
  staticCountryMaps = { byCode, byIso2, byIso3, byName };
  return staticCountryMaps;
}

function resolveStaticCountry(token) {
  const maps = getStaticCountryMaps();
  const numeric = /^\d+$/.test(token) ? String(token).padStart(3, "0") : "";
  if (numeric && maps.byCode.has(numeric)) return maps.byCode.get(numeric);
  const upper = String(token || "").toUpperCase();
  const normalized = normalizeText(token);
  const alias = COUNTRY_ALIASES[normalized];
  const aliasNormalized = alias ? normalizeText(alias) : "";
  const aliasUpper = alias ? String(alias).toUpperCase() : "";
  const aliasNumeric = alias && /^\d+$/.test(String(alias)) ? String(alias).padStart(3, "0") : "";
  return (
    maps.byIso2.get(upper) ||
    maps.byIso3.get(upper) ||
    (aliasUpper ? maps.byIso2.get(aliasUpper) : null) ||
    (aliasUpper ? maps.byIso3.get(aliasUpper) : null) ||
    (aliasNumeric ? maps.byCode.get(aliasNumeric) : null) ||
    maps.byName.get(normalized) ||
    (aliasNormalized ? maps.byName.get(aliasNormalized) : null) ||
    null
  );
}

function resolveLiveCountry(token, lookup) {
  let item = null;
  const numeric = /^\d+$/.test(token) ? String(token).padStart(3, "0") : "";
  if (numeric && lookup.byCode.has(numeric)) {
    item = lookup.byCode.get(numeric);
  } else {
    const upper = String(token || "").toUpperCase();
    const normalized = normalizeText(token);
    const alias = COUNTRY_ALIASES[normalized];
    const aliasNormalized = alias ? normalizeText(alias) : "";
    const aliasUpper = alias ? String(alias).toUpperCase() : "";
    const aliasNumeric = alias && /^\d+$/.test(String(alias)) ? String(alias).padStart(3, "0") : "";
    item =
      lookup.byIso2.get(upper) ||
      lookup.byIso3.get(upper) ||
      (aliasUpper ? lookup.byIso2.get(aliasUpper) : null) ||
      (aliasUpper ? lookup.byIso3.get(aliasUpper) : null) ||
      (aliasNumeric ? lookup.byCode.get(aliasNumeric) : null) ||
      lookup.byName.get(normalized) ||
      (aliasNormalized ? lookup.byName.get(aliasNormalized) : null) ||
      null;
  }
  return item ? buildReporterEntry(item, token) : null;
}

async function normalizeCountryList(rawCodes) {
  if (!rawCodes) return DEFAULT_COUNTRIES;
  const tokens = String(rawCodes)
    .split(/[|,]/)
    .map((token) => token.trim())
    .filter(Boolean);
  const resolved = [];
  const seen = new Set();
  let liveLookup = null;

  for (const token of tokens) {
    let entry = resolveStaticCountry(token);
    if (!entry) {
      try {
        if (!liveLookup) liveLookup = await getReportersLookup();
        entry = resolveLiveCountry(token, liveLookup);
      } catch (error) {
        entry = null;
      }
    }
    if (!entry || !entry.reporterCode || seen.has(entry.reporterCode)) continue;
    seen.add(entry.reporterCode);
    resolved.push(entry);
  }

  return resolved;
}

function buildUrl({ reporterCode, hs, periods, hasKey, maxRecords }) {
  const base = hasKey
    ? "https://comtradeapi.un.org/data/v1/get/C/A/HS"
    : "https://comtradeapi.un.org/public/v1/preview/C/A/HS";
  const params = new URLSearchParams({
    reporterCode,
    period: periods.join(","),
    flowCode: "M",
    partnerCode: "0",
    partner2Code: "0",
    customsCode: "C00",
    motCode: "0",
    cmdCode: String(hs),
    maxRecords: String(maxRecords),
    includeDesc: "true"
  });
  return `${base}?${params.toString()}`;
}

async function fetchTradeSeries({ reporterCode, hs, key }) {
  const hasKey = Boolean(key);
  const headers = hasKey ? { "Ocp-Apim-Subscription-Key": key } : {};
  const maxRecords = hasKey ? 500 : 200;

  async function requestPeriods(periods) {
    const url = buildUrl({ reporterCode, hs, periods, hasKey, maxRecords });
    let response = null;
    let lastStatus = 0;
    let lastError = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        response = await fetchWithTimeout(url, { headers }, 12000 + (attempt * 4000));
        lastStatus = response.status;
        if (response.ok) {
          return await response.json();
        }
        if (response.status !== 429 || attempt === 2) {
          throw new Error(`Comtrade ${reporterCode}: ${response.status}`);
        }
      } catch (error) {
        lastError = error;
        if (attempt === 2 && (!response || !response.ok)) {
          throw error?.name === "AbortError"
            ? new Error(`Comtrade ${reporterCode}: timeout`)
            : error;
        }
      }
      await sleep(1200 * (attempt + 1));
    }

    throw lastError || new Error(`Comtrade ${reporterCode}: ${lastStatus || 0}`);
  }

  let payload = null;
  let usedPeriods = YEARS.slice();
  try {
    payload = await requestPeriods(YEARS);
  } catch (error) {
    const fallbackRows = [];
    for (const year of YEARS) {
      try {
        const yearPayload = await requestPeriods([year]);
        const yearRows = Array.isArray(yearPayload?.data)
          ? yearPayload.data
          : Array.isArray(yearPayload?.dataset)
            ? yearPayload.dataset
            : [];
        fallbackRows.push(...yearRows);
      } catch (yearError) {
        // Keep going so we can still return partial exact totals for other years.
      }
    }
    if (!fallbackRows.length) throw error;
    payload = { data: fallbackRows };
    usedPeriods = YEARS.slice();
  }

  const json = payload || {};
  const rows = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.dataset)
      ? json.dataset
      : [];
  const totalRows = rows.filter((row) => {
    const partnerCode = Number(row?.partnerCode ?? -1);
    const partner2Code = Number(row?.partner2Code ?? -1);
    const customsCode = String(row?.customsCode || "");
    const motCode = Number(row?.motCode ?? -1);
    return partnerCode === 0 && partner2Code === 0 && customsCode === "C00" && motCode === 0;
  });
  const sourceRows = totalRows.length ? totalRows : rows;

  const yearImports = {};
  const yearWeights = {};
  const yearStatuses = {};
  usedPeriods.forEach((year) => {
    yearImports[String(year)] = 0;
    yearWeights[String(year)] = 0;
    yearStatuses[String(year)] = "no_data";
  });
  YEARS.forEach((year) => {
    if (!Object.prototype.hasOwnProperty.call(yearImports, String(year))) {
      yearImports[String(year)] = 0;
      yearWeights[String(year)] = 0;
      yearStatuses[String(year)] = "error";
    }
  });

  sourceRows.forEach((row) => {
    const year = String(row?.period || "");
    if (!yearImports.hasOwnProperty(year)) return;
    const value = Number(row?.primaryValue || 0);
    const weight = Number(row?.netWgt || 0);
    if (totalRows.length) {
      yearImports[year] = value;
      yearWeights[year] = weight;
    } else {
      yearImports[year] += value;
      yearWeights[year] += weight;
    }
    yearStatuses[year] = (value || weight) ? "ok" : yearStatuses[year];
  });

  const totalValue = YEARS.reduce((sum, year) => sum + Number(yearImports[String(year)] || 0), 0);
  const totalWeight = YEARS.reduce((sum, year) => sum + Number(yearWeights[String(year)] || 0), 0);
  const firstDesc = sourceRows.find((row) => row?.cmdDesc)?.cmdDesc || "";

  return {
    rows: sourceRows,
    totalValue,
    totalWeight,
    desc: firstDesc,
    latestValue: Number(yearImports["2024"] || 0),
    yearImports,
    yearStatuses,
    weightUnit: "kg",
    status: sourceRows.length > 0 ? "ok" : "no_data"
  };
}

function normalizeWitsHtml(html) {
  return String(html || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseWitsSummary(html) {
  const text = normalizeWitsHtml(html);
  const totalMatch = text.match(/was\s+\$([\d,]+(?:\.\d+)?)K\s+and quantity\s+([\d,]+)\s*Kg/i);
  if (!totalMatch) {
    return {
      importUsd: 0,
      quantityTons: 0,
      status: /no trade data|no data available|not available/i.test(text) ? "no_data" : "error"
    };
  }
  return {
    importUsd: Number(String(totalMatch[1]).replace(/,/g, "")) * 1000,
    quantityTons: Number(String(totalMatch[2]).replace(/,/g, "")) / 1000,
    status: "ok"
  };
}

async function fetchWitsTradeSeries({ iso3, hs }) {
  if (!iso3) throw new Error("WITS reporter missing");
  const yearImports = {};
  const yearWeights = {};
  const yearStatuses = {};

  for (const year of YEARS) {
    yearImports[String(year)] = 0;
    yearWeights[String(year)] = 0;
    yearStatuses[String(year)] = "no_data";
    const url = `https://wits.worldbank.org/trade/comtrade/en/country/${String(iso3).toUpperCase()}/year/${year}/tradeflow/Imports/partner/ALL/product/${encodeURIComponent(hs)}`;
    const response = await fetchWithTimeout(url, { headers: WITS_HEADERS }, 18000);
    if (!response.ok) {
      yearStatuses[String(year)] = "error";
      continue;
    }
    const html = await response.text();
    const parsed = parseWitsSummary(html);
    yearImports[String(year)] = parsed.importUsd;
    yearWeights[String(year)] = parsed.quantityTons;
    yearStatuses[String(year)] = parsed.status;
  }

  const totalValue = YEARS.reduce((sum, year) => sum + Number(yearImports[String(year)] || 0), 0);
  const totalWeight = YEARS.reduce((sum, year) => sum + Number(yearWeights[String(year)] || 0), 0);
  const latestValue = Number(yearImports["2024"] || yearImports["2023"] || yearImports["2022"] || yearImports["2021"] || 0);
  return {
    totalValue,
    totalWeight,
    latestValue,
    yearImports,
    yearStatuses,
    weightUnit: "tons",
    status: YEARS.some((year) => yearStatuses[String(year)] === "ok") ? "ok" : "no_data",
    rows: []
  };
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const hs = String(req.query.hs || "2516").replace(/\D/g, "").slice(0, 6) || "2516";
    const source = String(req.query.source || "comtrade").trim().toLowerCase();
    const key = String(
      process.env.COMTRADE_API_KEY ||
      process.env.COMTRADE_PRIMARY_KEY ||
      req.query.key ||
      ""
    ).trim();
    const requestedCountries = await normalizeCountryList(req.query.countries);

    const countries = [];

    for (const country of requestedCountries) {
      try {
        let current = source === "wits"
          ? await fetchWitsTradeSeries({
              iso3: country.iso3,
              hs
            })
          : await fetchTradeSeries({
              reporterCode: country.reporterCode,
              hs,
              key
            });
        let sourceUsed = source === "wits" ? "WITS (World Bank)" : "UN Comtrade";

        if (source !== "wits" && (!current || current.status !== "ok") && country.iso3) {
          try {
            const fallback = await fetchWitsTradeSeries({
              iso3: country.iso3,
              hs
            });
            if (fallback && fallback.status === "ok") {
              current = fallback;
              sourceUsed = "UN Comtrade (WITS mirror fallback)";
            }
          } catch (fallbackError) {
            // Ignore mirror fallback errors and keep the original Comtrade failure below.
          }
        }

        countries.push({
          code: country.code,
          name: country.name,
          reporterCode: country.reporterCode,
          import_usd: current.totalValue,
          latest_import_usd: current.latestValue,
          volume_tons: current.weightUnit === "tons"
            ? Math.round(current.totalWeight || 0)
            : Math.round((current.totalWeight || 0) / 1000),
          trend_pct: null,
          status: current.status,
          source_used: sourceUsed,
          year_imports: current.yearImports,
          year_statuses: current.yearStatuses,
          products: Array.isArray(current.rows) ? current.rows.map((row) => ({
            hs: row?.cmdCode || hs,
            period: row?.period || "",
            desc: row?.cmdDesc || current.desc || "",
            value: Number(row?.primaryValue || 0),
            weight: Number(row?.netWgt || 0)
          })) : []
        });
      } catch (error) {
        console.log(source === "wits" ? "WITS error:" : "Comtrade error:", country.reporterCode || country.iso3, error.message);
        const yearStatuses = {};
        YEARS.forEach((year) => {
          yearStatuses[String(year)] = source === "wits"
            ? "error"
            : (String(error.message || "").includes("429") ? "rate_limited" : "error");
        });
        countries.push({
          code: country.code,
          name: country.name,
          reporterCode: country.reporterCode,
          import_usd: 0,
          latest_import_usd: 0,
          volume_tons: 0,
          trend_pct: null,
          status: source === "wits"
            ? "error"
            : (String(error.message || "").includes("429") ? "rate_limited" : "error"),
          year_imports: { "2021": 0, "2022": 0, "2023": 0, "2024": 0 },
          year_statuses: yearStatuses,
          products: []
        });
      }
    }

    const okCountries = countries.filter((country) => country.status === "ok");
    const total = okCountries.reduce((sum, country) => sum + Number(country.import_usd || 0), 0);
    const biggest = okCountries.slice().sort((a, b) => (b.import_usd || 0) - (a.import_usd || 0))[0] || {};

    res.status(200).json({
      countries,
      total_usd: total,
      biggest_market: biggest.name || "",
      fastest_growing: "",
      count: countries.length,
      source: source === "wits" ? "WITS (World Bank)" : "UN Comtrade"
    });
  } catch (error) {
    res.status(200).json({
      countries: [],
      total_usd: 0,
      biggest_market: "",
      fastest_growing: "",
      count: 0,
      source: String(req.query.source || "comtrade").trim().toLowerCase() === "wits" ? "WITS (World Bank)" : "UN Comtrade",
      error: error.message
    });
  }
}
