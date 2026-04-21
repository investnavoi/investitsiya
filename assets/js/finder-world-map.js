/* ═══════════════════════════════════════
   FINDER 3D GLOBE — Light theme, global trade flows
   Uses globe.gl + Three.js
═══════════════════════════════════════ */

const FWM_TARGETS = [
  { code: 'UZ', name: 'O\'zbekiston',  lat: 41.38, lng: 64.58 },
  { code: 'RU', name: 'Rossiya',       lat: 55.75, lng: 37.62 },
  { code: 'KZ', name: 'Qozog\'iston',  lat: 48.02, lng: 66.92 },
  { code: 'KG', name: 'Qirg\'iziston', lat: 41.20, lng: 74.77 },
  { code: 'TJ', name: 'Tojikiston',    lat: 38.86, lng: 71.28 },
  { code: 'TM', name: 'Turkmaniston',  lat: 38.97, lng: 59.56 },
  { code: 'AZ', name: 'Ozarbayjon',    lat: 40.14, lng: 47.58 },
  { code: 'GE', name: 'Gruziya',       lat: 42.32, lng: 43.36 },
  { code: 'AM', name: 'Armaniston',    lat: 40.07, lng: 45.04 },
  { code: 'AF', name: 'Afg\'oniston',  lat: 33.94, lng: 67.71 },
  { code: 'IR', name: 'Eron',          lat: 32.43, lng: 53.69 },
  { code: 'PK', name: 'Pokiston',      lat: 30.37, lng: 69.35 },
  { code: 'MN', name: 'Mongoliya',     lat: 46.86, lng: 103.85 }
];

const FWM_WORLD = [
  { code: 'US', name: 'AQSh',            lat:  39.83, lng:  -98.58 },
  { code: 'CN', name: 'Xitoy',           lat:  35.86, lng:  104.20 },
  { code: 'DE', name: 'Germaniya',       lat:  51.17, lng:   10.45 },
  { code: 'GB', name: 'Buyuk Britaniya', lat:  55.38, lng:   -3.44 },
  { code: 'FR', name: 'Fransiya',        lat:  46.23, lng:    2.21 },
  { code: 'JP', name: 'Yaponiya',        lat:  36.20, lng:  138.25 },
  { code: 'IN', name: 'Hindiston',       lat:  20.59, lng:   78.96 },
  { code: 'BR', name: 'Braziliya',       lat: -14.24, lng:  -51.93 },
  { code: 'TR', name: 'Turkiya',         lat:  38.96, lng:   35.24 },
  { code: 'KR', name: 'Janubiy Koreya',  lat:  35.91, lng:  127.77 },
  { code: 'AU', name: 'Avstraliya',      lat: -25.27, lng:  133.78 },
  { code: 'IT', name: 'Italiya',         lat:  41.87, lng:   12.57 },
  { code: 'ES', name: 'Ispaniya',        lat:  40.46, lng:   -3.75 },
  { code: 'CA', name: 'Kanada',          lat:  56.13, lng: -106.35 },
  { code: 'AE', name: 'BAA',             lat:  23.42, lng:   53.85 },
  { code: 'SG', name: 'Singapur',        lat:   1.35, lng:  103.82 },
  { code: 'ID', name: 'Indoneziya',      lat:  -0.79, lng:  113.92 },
  { code: 'ZA', name: 'JAR',             lat: -30.56, lng:   22.94 },
  { code: 'EG', name: 'Misr',            lat:  26.82, lng:   30.80 },
  { code: 'SA', name: 'Saudiya',         lat:  23.88, lng:   45.08 },
  { code: 'TH', name: 'Tailand',         lat:  15.87, lng:  100.99 },
  { code: 'NL', name: 'Niderlandiya',    lat:  52.13, lng:    5.29 }
];

function getDestinationsForTarget(targetCode){
  const hash = targetCode.charCodeAt(0) + targetCode.charCodeAt(1);
  const count = 2 + (hash % 2);
  const destinations = [];
  const used = new Set();
  for(let i = 0; i < count; i++){
    const idx = (hash + i * 11) % FWM_WORLD.length;
    if(!used.has(idx)){
      destinations.push(FWM_WORLD[idx]);
      used.add(idx);
    }
  }
  return destinations;
}

let _fwmGlobe = null;
let _fwmInitAttempts = 0;

window.initFinderWorldMap = function(){
  const container = document.getElementById('finderGlobe');
  if(!container) return;
  if(typeof Globe === 'undefined' || typeof THREE === 'undefined'){
    if(_fwmInitAttempts < 30){
      _fwmInitAttempts++;
      setTimeout(window.initFinderWorldMap, 250);
    }
    return;
  }
  const rect = container.getBoundingClientRect();
  if(rect.width < 50 || rect.height < 50){
    if(_fwmInitAttempts < 30){
      _fwmInitAttempts++;
      setTimeout(window.initFinderWorldMap, 250);
    }
    return;
  }
  _fwmInitAttempts = 0;
  if(_fwmGlobe){ try{ _fwmGlobe._destructor && _fwmGlobe._destructor(); }catch(e){} _fwmGlobe = null; container.innerHTML = ''; }

  /* Build arcs: each target → 2-3 world destinations */
  const arcs = [];
  FWM_TARGETS.forEach(t => {
    const dests = getDestinationsForTarget(t.code);
    dests.forEach(d => {
      arcs.push({
        startLat: t.lat, startLng: t.lng,
        endLat: d.lat, endLng: d.lng,
        color: ['#10b981', '#465fff']
      });
    });
  });

  /* Points */
  const points = [
    ...FWM_TARGETS.map(t => ({ lat: t.lat, lng: t.lng, name: t.name, color: '#10b981', size: 0.55 })),
    ...FWM_WORLD.map(w => ({ lat: w.lat, lng: w.lng, name: w.name, color: '#465fff', size: 0.3 }))
  ];

  /* Pulse rings on target countries */
  const rings = FWM_TARGETS.map(t => ({
    lat: t.lat, lng: t.lng,
    maxR: 3,
    propagationSpeed: 2,
    repeatPeriod: 1800
  }));

  /* Hex polygons from countries for 3D relief effect */
  _fwmGlobe = Globe()(container)
    .width(rect.width)
    .height(rect.height)
    .backgroundColor('rgba(0,0,0,0)')
    /* Light earth texture */
    .globeImageUrl('https://unpkg.com/three-globe@2.27.2/example/img/earth-blue-marble.jpg')
    .bumpImageUrl('https://unpkg.com/three-globe@2.27.2/example/img/earth-topology.png')
    .showAtmosphere(true)
    .atmosphereColor('#93c5fd')
    .atmosphereAltitude(0.22)
    /* Arcs */
    .arcsData(arcs)
    .arcColor('color')
    .arcAltitudeAutoScale(0.45)
    .arcStroke(0.5)
    .arcDashLength(0.35)
    .arcDashGap(0.15)
    .arcDashAnimateTime(2200)
    /* Points */
    .pointsData(points)
    .pointLat('lat')
    .pointLng('lng')
    .pointColor('color')
    .pointAltitude(0.012)
    .pointRadius('size')
    .pointLabel(d => `<div style="background:rgba(15,23,42,.95);color:#fff;padding:6px 12px;border-radius:8px;font-size:.75rem;font-family:'Inter',sans-serif;border:1px solid rgba(16,185,129,.35);box-shadow:0 8px 20px -4px rgba(0,0,0,.3)"><b>${d.name}</b></div>`)
    /* Rings */
    .ringsData(rings)
    .ringColor(() => t => `rgba(16,185,129,${1 - t})`)
    .ringMaxRadius('maxR')
    .ringPropagationSpeed('propagationSpeed')
    .ringRepeatPeriod('repeatPeriod');

  setTimeout(() => {
    try {
      const controls = _fwmGlobe.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = false;
      controls.enablePan = false;
      _fwmGlobe.pointOfView({ lat: 36, lng: 65, altitude: 2.3 }, 0);
    } catch(e){}
  }, 50);

  if(window.ResizeObserver){
    if(window._fwmResizeObs){ try{window._fwmResizeObs.disconnect();}catch(e){} }
    window._fwmResizeObs = new ResizeObserver(() => {
      const r = container.getBoundingClientRect();
      if(_fwmGlobe && r.width > 50 && r.height > 50){
        _fwmGlobe.width(r.width).height(r.height);
      }
    });
    window._fwmResizeObs.observe(container);
  }
};

(function watchFinderPage(){
  const pageEl = document.getElementById('page-finder');
  if(!pageEl){
    setTimeout(watchFinderPage, 500);
    return;
  }
  function isVisible(){
    if(!pageEl) return false;
    if(pageEl.style.display === 'none') return false;
    const r = pageEl.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function tryInit(){
    const mapEl = document.getElementById('finderGlobe');
    if(!mapEl) return;
    if(!isVisible()) return;
    if(_fwmGlobe) return;
    window.initFinderWorldMap();
  }
  const mo = new MutationObserver(() => setTimeout(tryInit, 100));
  mo.observe(pageEl, { attributes: true, attributeFilter: ['class', 'style'] });
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryInit, 300));
  } else {
    setTimeout(tryInit, 300);
  }
})();
