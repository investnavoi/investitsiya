#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   SeaRates rate populator
   Fills the two JSON caches with REAL SeaRates FCL 20ft rates via the proxy:
     1) assets/data/searates-navoi-to-neighbors.json   (Navoi -> 12 neighbours)
     2) assets/data/searates-country-to-navoi.json      (45 countries -> Navoi)

   Run ONLY when you have SeaRates search budget (each route = 1 search):
     node scripts/populate-searates.js                 # fill missing/null only
     node scripts/populate-searates.js --all           # refetch everything
     node scripts/populate-searates.js --neighbors     # only the 12 neighbours
     node scripts/populate-searates.js --countries     # only the 45 countries

   Total to fully populate = 12 + 45 = 57 searches. The trial is 20, so do it
   after upgrading the SeaRates plan, or run in chunks (--neighbors first).
   ════════════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const PROXY = 'https://navoiy-api-proxy.vercel.app/api/ai-country-analysis?mode=freight';
const NAVOI = { lat: 40.1039, lng: 65.3686 };
const DATA_DIR = path.join(__dirname, '..', 'assets', 'data');
const NEIGHBORS_FILE = path.join(DATA_DIR, 'searates-navoi-to-neighbors.json');
const COUNTRIES_FILE = path.join(DATA_DIR, 'searates-country-to-navoi.json');

// 12 neighbour coordinates (must match the JSON keys)
const NEIGHBOR_COORDS = {
  KAZ: [43.2389, 76.8897], RUS: [55.7558, 37.6173], IRN: [35.6892, 51.3890],
  PAK: [31.5204, 74.3587], KGZ: [42.8746, 74.5698], TKM: [37.9601, 58.3261],
  TJK: [38.5598, 68.7870], MNG: [47.8864, 106.9057], AZE: [40.4093, 49.8671],
  GEO: [41.7151, 44.8271], ARM: [40.1792, 44.4991], AFG: [34.5553, 69.2075]
};

const args = process.argv.slice(2);
const REFETCH_ALL = args.includes('--all');
const ONLY_NEIGHBORS = args.includes('--neighbors');
const ONLY_COUNTRIES = args.includes('--countries');

async function fetchRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const resp = await fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routes: [{ from_lat: fromLat, from_lng: fromLng, to_lat: toLat, to_lng: toLng }] })
    });
    const json = await resp.json();
    const r = json && json.results && json.results[0];
    if (r && r.rate_usd) return { rate_usd: r.rate_usd, transit_days: r.transit_days, source: 'searates' };
    return null;
  } catch (e) { console.warn('  fetch error:', e.message); return null; }
}

async function populateNeighbors() {
  const doc = JSON.parse(fs.readFileSync(NEIGHBORS_FILE, 'utf8'));
  let filled = 0;
  for (const iso3 of Object.keys(doc.routes)) {
    const entry = doc.routes[iso3];
    if (!REFETCH_ALL && entry.rate_usd != null) { console.log(`  ${iso3}: cached ($${entry.rate_usd})`); continue; }
    const coords = NEIGHBOR_COORDS[iso3];
    if (!coords) continue;
    process.stdout.write(`  Navoi -> ${iso3} ... `);
    const r = await fetchRoute(NAVOI.lat, NAVOI.lng, coords[0], coords[1]);
    if (r) { entry.rate_usd = r.rate_usd; entry.transit_days = r.transit_days; entry.source = 'searates'; filled++; console.log(`$${r.rate_usd} / ${r.transit_days}d`); }
    else { console.log('NO RATE (quota or no route) — left as model'); }
    await new Promise(res => setTimeout(res, 600));
  }
  doc._updatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(NEIGHBORS_FILE, JSON.stringify(doc, null, 2) + '\n');
  console.log(`Neighbours: ${filled} new rates written.\n`);
}

async function populateCountries() {
  const doc = JSON.parse(fs.readFileSync(COUNTRIES_FILE, 'utf8'));
  let filled = 0;
  for (const iso3 of Object.keys(doc.routes)) {
    const entry = doc.routes[iso3];
    if (!REFETCH_ALL && entry.rate_usd != null) { console.log(`  ${iso3}: cached ($${entry.rate_usd})`); continue; }
    if (entry.lat == null || entry.lng == null) continue;
    process.stdout.write(`  ${iso3} -> Navoi ... `);
    const r = await fetchRoute(entry.lat, entry.lng, NAVOI.lat, NAVOI.lng);
    if (r) { entry.rate_usd = r.rate_usd; entry.transit_days = r.transit_days; entry.source = 'searates'; filled++; console.log(`$${r.rate_usd} / ${r.transit_days}d`); }
    else { console.log('NO RATE (quota or no route) — left as model'); }
    await new Promise(res => setTimeout(res, 600));
  }
  doc._updatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(COUNTRIES_FILE, JSON.stringify(doc, null, 2) + '\n');
  console.log(`Countries: ${filled} new rates written.\n`);
}

(async () => {
  console.log('SeaRates rate populator (each route = 1 trial search)\n');
  if (!ONLY_COUNTRIES) { console.log('— Navoi -> 12 neighbours —'); await populateNeighbors(); }
  if (!ONLY_NEIGHBORS) { console.log('— 45 countries -> Navoi —'); await populateCountries(); }
  console.log('Done. Commit the updated JSON files to publish.');
})();
