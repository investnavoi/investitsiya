/* ═══════════════════════════════════════
   COMPANY CONSTELLATION — 3D starfield of companies
   Light theme, clustered by industry, click to explore
═══════════════════════════════════════ */

const FCONST_INDUSTRIES = [
  { name: 'Metallurgiya',  color: 0x465fff, center: [-45, 15, -10] },
  { name: 'Tekstil',        color: 0x10b981, center: [40, -10, -5] },
  { name: 'Energetika',     color: 0xf59e0b, center: [0, 35, -20] },
  { name: 'Kimyo',          color: 0xec4899, center: [-30, -30, -15] },
  { name: 'Qurilish',       color: 0x8b5cf6, center: [35, 25, 10] },
  { name: 'Oziq-ovqat',     color: 0x06b6d4, center: [-15, -5, 20] }
];

const FCONST_COMPANIES_PER_CLUSTER = 80;
const FCONST_CLUSTER_SPREAD = 18;

const FCONST_SAMPLE_COMPANIES = [
  { name: 'Hunan Goldsun Cable', country: '🇨🇳', stat: '$128M', extra: 'Mis simi eksportyori' },
  { name: 'Siemens Wire GmbH', country: '🇩🇪', stat: '€94M', extra: 'Elektrokabel ishlab chiqaruvchi' },
  { name: 'Nexans Türkiye', country: '🇹🇷', stat: '€580M', extra: 'Quvvat kabellari' },
  { name: 'Polycab India', country: '🇮🇳', stat: '₹140B', extra: 'Qurilish simlari' },
  { name: 'Prysmian Group', country: '🇮🇹', stat: '€12B', extra: 'Global offshore leader' },
  { name: 'Sumitomo Electric', country: '🇯🇵', stat: '¥3.8T', extra: 'Yarimo\'tkazgichlar' },
  { name: 'LS Cable', country: '🇰🇷', stat: '₩4.2T', extra: 'Optik tolali kabel' },
  { name: 'Ducab', country: '🇦🇪', stat: '$1.4B', extra: 'MENA mintaqasi' },
  { name: 'Southwire Co.', country: '🇺🇸', stat: '$2.1B', extra: 'Sanoat mis simi' },
  { name: 'BASF', country: '🇩🇪', stat: '€68B', extra: 'Global kimyo gigant' },
  { name: 'Inditex', country: '🇪🇸', stat: '€32B', extra: 'Tekstil & retail' },
  { name: 'LafargeHolcim', country: '🇨🇭', stat: '$28B', extra: 'Qurilish materiallari' },
  { name: 'Saudi Aramco', country: '🇸🇦', stat: '$494B', extra: 'Energetika' },
  { name: 'Nestlé', country: '🇨🇭', stat: '$94B', extra: 'Oziq-ovqat' },
  { name: 'Mitsubishi Chemical', country: '🇯🇵', stat: '¥2.5T', extra: 'Kimyo sanoati' },
  { name: 'ArcelorMittal', country: '🇱🇺', stat: '$68B', extra: 'Po\'lat ishlab chiqaruvchi' },
  { name: 'Levi Strauss', country: '🇺🇸', stat: '$6.2B', extra: 'Global tekstil brendi' },
  { name: 'TotalEnergies', country: '🇫🇷', stat: '€200B', extra: 'Neft va gaz' }
];

function _fconstPickSampleCompany(industryName){
  const idx = Math.floor(Math.random() * FCONST_SAMPLE_COMPANIES.length);
  const c = FCONST_SAMPLE_COMPANIES[idx];
  return { ...c, industry: industryName };
}

let _fconstState = null;
let _fconstInitAttempts = 0;

window.initFinderConstellation = function(){
  const container = document.getElementById('finderConstellation');
  if(!container) return;
  if(typeof THREE === 'undefined'){
    if(_fconstInitAttempts < 30){
      _fconstInitAttempts++;
      setTimeout(window.initFinderConstellation, 250);
    }
    return;
  }
  const rect = container.getBoundingClientRect();
  if(rect.width < 50 || rect.height < 50){
    if(_fconstInitAttempts < 30){
      _fconstInitAttempts++;
      setTimeout(window.initFinderConstellation, 250);
    }
    return;
  }
  _fconstInitAttempts = 0;
  if(_fconstState){
    try{ _fconstState.renderer.dispose(); }catch(e){}
    container.innerHTML = '';
    _fconstState = null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, rect.width / rect.height, 0.1, 1000);
  camera.position.set(0, 0, 90);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(rect.width, rect.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  /* Generate companies distributed in clusters */
  const companies = [];
  const positions = [];
  const colors = [];
  const sizes = [];
  const originalSizes = [];

  FCONST_INDUSTRIES.forEach((ind, indIdx) => {
    for(let i = 0; i < FCONST_COMPANIES_PER_CLUSTER; i++){
      /* Position near cluster center with Gaussian spread */
      const x = ind.center[0] + (Math.random() - 0.5) * FCONST_CLUSTER_SPREAD * (Math.random() + 0.5);
      const y = ind.center[1] + (Math.random() - 0.5) * FCONST_CLUSTER_SPREAD * (Math.random() + 0.5);
      const z = ind.center[2] + (Math.random() - 0.5) * FCONST_CLUSTER_SPREAD * (Math.random() + 0.5);

      positions.push(x, y, z);

      const col = new THREE.Color(ind.color);
      /* Slight brightness variation */
      const brightness = 0.8 + Math.random() * 0.4;
      colors.push(col.r * brightness, col.g * brightness, col.b * brightness);

      /* Size variation — some large "featured" */
      const isFeatured = Math.random() < 0.08;
      const size = isFeatured ? (2.5 + Math.random() * 1.5) : (0.8 + Math.random() * 0.8);
      sizes.push(size);
      originalSizes.push(size);

      companies.push({
        position: new THREE.Vector3(x, y, z),
        industry: ind.name,
        color: ind.color,
        featured: isFeatured,
        data: _fconstPickSampleCompany(ind.name),
        index: companies.length
      });
    }
  });

  /* Custom shader for glowing points */
  const vertexShader = `
    attribute float size;
    attribute vec3 customColor;
    varying vec3 vColor;
    uniform float pulse;
    void main(){
      vColor = customColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  const fragmentShader = `
    varying vec3 vColor;
    void main(){
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float r = length(xy) * 2.0;
      if(r > 1.0) discard;
      float alpha = pow(1.0 - r, 2.0) * 0.95;
      /* Core glow */
      float core = pow(1.0 - r, 6.0);
      vec3 finalColor = vColor + vec3(core * 0.4);
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: { pulse: { value: 0 } },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  /* Connection lines within clusters */
  const lineSegments = [];
  FCONST_INDUSTRIES.forEach((ind, indIdx) => {
    const clusterCompanies = companies.filter(c => c.industry === ind.name);
    /* Connect each company to 1-3 nearest in same cluster */
    for(let i = 0; i < clusterCompanies.length; i++){
      const a = clusterCompanies[i];
      const connections = 1 + Math.floor(Math.random() * 2);
      const distances = clusterCompanies.map((b, j) => ({
        j,
        dist: j === i ? Infinity : a.position.distanceTo(b.position)
      })).sort((x, y) => x.dist - y.dist);
      for(let k = 0; k < connections && k < distances.length; k++){
        const b = clusterCompanies[distances[k].j];
        if(!b) continue;
        lineSegments.push(a.position.x, a.position.y, a.position.z);
        lineSegments.push(b.position.x, b.position.y, b.position.z);
      }
    }
  });

  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(lineSegments, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x7c3aed,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending
  });
  const lines = new THREE.LineSegments(lineGeom, lineMat);
  scene.add(lines);

  /* Cross-cluster "trade" lines (sparse) */
  const tradeSegments = [];
  for(let i = 0; i < 25; i++){
    const a = companies[Math.floor(Math.random() * companies.length)];
    const b = companies[Math.floor(Math.random() * companies.length)];
    if(a.industry === b.industry) continue;
    tradeSegments.push(a.position.x, a.position.y, a.position.z);
    tradeSegments.push(b.position.x, b.position.y, b.position.z);
  }
  const tradeLineGeom = new THREE.BufferGeometry();
  tradeLineGeom.setAttribute('position', new THREE.Float32BufferAttribute(tradeSegments, 3));
  const tradeLineMat = new THREE.LineBasicMaterial({
    color: 0x465fff,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending
  });
  const tradeLines = new THREE.LineSegments(tradeLineGeom, tradeLineMat);
  scene.add(tradeLines);

  /* Raycaster for hover/click */
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 2;
  const mouse = new THREE.Vector2();
  let hoveredIndex = -1;

  const tooltip = document.getElementById('finderConstellationTooltip');

  function onPointerMove(event){
    const r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -((event.clientY - r.top) / r.height) * 2 + 1;
  }
  renderer.domElement.addEventListener('mousemove', onPointerMove);

  renderer.domElement.addEventListener('mouseleave', () => {
    if(tooltip) tooltip.style.display = 'none';
    hoveredIndex = -1;
  });

  /* Auto-rotate + pulse animation */
  let t0 = performance.now();
  const autoRotateSpeed = 0.00012;
  let userInteractedAt = 0;

  renderer.domElement.addEventListener('mousedown', () => { userInteractedAt = performance.now(); });

  function animate(){
    const now = performance.now();
    const dt = now - t0;
    t0 = now;

    /* Auto-rotate scene */
    points.rotation.y += autoRotateSpeed * dt;
    lines.rotation.y += autoRotateSpeed * dt;
    tradeLines.rotation.y += autoRotateSpeed * dt;

    /* Pulse featured stars */
    const pulse = Math.sin(now * 0.002) * 0.5 + 0.5;
    const sizeAttr = geometry.attributes.size;
    companies.forEach((c, i) => {
      if(c.featured){
        sizeAttr.array[i] = originalSizes[i] * (1 + pulse * 0.6);
      }
    });
    sizeAttr.needsUpdate = true;

    /* Raycast for hover */
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(points);
    if(intersects.length > 0){
      /* Find nearest intersected point */
      const nearest = intersects.reduce((best, cur) => cur.distanceToRay < best.distanceToRay ? cur : best);
      const idx = nearest.index;
      if(idx !== hoveredIndex && idx != null && companies[idx]){
        hoveredIndex = idx;
        const c = companies[idx];
        if(tooltip){
          tooltip.innerHTML = `
            <div class="fct-head">
              <span class="fct-flag">${c.data.country}</span>
              <span class="fct-industry" style="background:#${c.color.toString(16).padStart(6,'0')}22;color:#${c.color.toString(16).padStart(6,'0')}">${c.industry}</span>
            </div>
            <div class="fct-name">${c.data.name}</div>
            <div class="fct-sub">${c.data.extra}</div>
            <div class="fct-stat"><b>${c.data.stat}</b><span>YILLIK SAVDO</span></div>
          `;
          tooltip.style.display = 'block';
        }
      }
      if(tooltip){
        const mx = (mouse.x + 1) / 2 * rect.width;
        const my = (-mouse.y + 1) / 2 * rect.height;
        tooltip.style.left = Math.min(rect.width - 240, mx + 18) + 'px';
        tooltip.style.top = Math.max(0, my - 80) + 'px';
      }
      renderer.domElement.style.cursor = 'pointer';
    } else {
      if(hoveredIndex !== -1){
        hoveredIndex = -1;
        if(tooltip) tooltip.style.display = 'none';
      }
      renderer.domElement.style.cursor = 'default';
    }

    renderer.render(scene, camera);
    _fconstState.animationId = requestAnimationFrame(animate);
  }

  _fconstState = { renderer, scene, camera, points, lines, tradeLines, geometry, companies, animationId: null };
  animate();

  /* Resize */
  if(window.ResizeObserver){
    if(window._fconstResizeObs){ try{window._fconstResizeObs.disconnect();}catch(e){} }
    window._fconstResizeObs = new ResizeObserver(() => {
      const r = container.getBoundingClientRect();
      if(r.width < 50 || r.height < 50) return;
      camera.aspect = r.width / r.height;
      camera.updateProjectionMatrix();
      renderer.setSize(r.width, r.height);
    });
    window._fconstResizeObs.observe(container);
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
    const el = document.getElementById('finderConstellation');
    if(!el || !isVisible() || _fconstState) return;
    window.initFinderConstellation();
  }
  const mo = new MutationObserver(() => setTimeout(tryInit, 100));
  mo.observe(pageEl, { attributes: true, attributeFilter: ['class', 'style'] });
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryInit, 300));
  } else {
    setTimeout(tryInit, 300);
  }
})();
