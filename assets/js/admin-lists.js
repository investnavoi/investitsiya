/* ═══════════════════════════════════════
   RENDER ADMIN LISTS
═══════════════════════════════════════ */
function renderAdminLists(){
  // Investors
  document.getElementById('inv-count').textContent=DB.investors.length;
  const ail=document.getElementById('admin-inv-list');
  ail.innerHTML=DB.investors.length?DB.investors.map((r,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${r.shahar||'—'}</td>
      <td>${fmtDate(r.sana)}</td>
      <td>${r.flag||''} ${r.davlat||'—'}</td>
      <td>${r.maqsad||'—'}</td>
      <td><b>${r.kompaniya||'—'}</b></td>
      <td>${r.loyiha||'—'}</td>
      <td style="color:#059669;font-weight:700">${r.qiymat||'—'}</td>
      <td>${makomBadge(r.makom)}</td>
      <td>${r.hudud||'—'}</td>
      <td style="font-size:.72rem;color:var(--text3)">${r.izoh||'—'}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteRecord('investors',${r.id})">🗑</button></td>
    </tr>`).join('')
    :'<tr><td colspan="12"><div class="tc-empty"><div class="tc-empty-icon">🌍</div><p>Hali ma\'lumot yo\'q</p></div></td></tr>';

  // Local
  document.getElementById('loc-count').textContent=DB.local.length;
  const all=document.getElementById('admin-loc-list');
  all.innerHTML=DB.local.length?DB.local.map((r,i)=>`
    <tr><td>${i+1}</td><td><b>${r.kompaniya||'—'}</b></td><td>${r.rahbar||'—'}</td><td>${r.soha||'—'}</td>
    <td class="td-num" style="color:#059669">${fmtMoney(r.summa)}</td><td>${holatBadge(r.holat)}</td>
    <td>${r.tel||'—'}</td>
    <td><button class="btn btn-danger btn-sm" onclick="deleteRecord('local',${r.id})">🗑</button></td></tr>`).join('')
    :'<tr><td colspan="8"><div class="tc-empty"><div class="tc-empty-icon">🏢</div><p>Hali ma\'lumot yo\'q</p></div></td></tr>';

  // Zoom
  document.getElementById('zm-count').textContent=DB.zoom.length;
  const azl=document.getElementById('admin-zm-list');
  azl.innerHTML=DB.zoom.length?DB.zoom.map((r,i)=>`
    <tr><td>${i+1}</td><td><b>${r.ism||'—'}</b></td><td>${r.org||'—'}</td><td>${r.davlat||'—'}</td>
    <td>${fmtDate(r.sana)}</td><td>${r.ishtirokchi||1}</td><td>${natijaHolatBadge(r.natijaHolat)}</td>
    <td><button class="btn btn-danger btn-sm" onclick="deleteRecord('zoom',${r.id})">🗑</button></td></tr>`).join('')
    :'<tr><td colspan="8"><div class="tc-empty"><div class="tc-empty-icon">💻</div><p>Hali ma\'lumot yo\'q</p></div></td></tr>';

  // Forums
  document.getElementById('fr-count').textContent=DB.forums.length;
  const afl=document.getElementById('admin-fr-list');
  afl.innerHTML=DB.forums.length?DB.forums.map((r,i)=>`
    <tr><td>${i+1}</td><td><b>${r.nom||'—'}</b></td><td>${fmtDate(r.sana)}</td>
    <td>${r.shahar||''}, ${r.davlat||''}</td>
    <td><span class="badge bdg-blue">${r.turi||'—'}</span></td><td>${r.holat||'—'}</td>
    <td><button class="btn btn-danger btn-sm" onclick="deleteRecord('forums',${r.id})">🗑</button></td></tr>`).join('')
    :'<tr><td colspan="7"><div class="tc-empty"><div class="tc-empty-icon">🗓</div><p>Hali ma\'lumot yo\'q</p></div></td></tr>';

  // Investor Companies
  const icEl = document.getElementById('ic-admin-count');
  if(icEl) icEl.textContent = (DB.investorCompanies||[]).length;
  const aicl = document.getElementById('admin-ic-list');
  if(aicl){
    const co = DB.investorCompanies||[];
    aicl.innerHTML = co.length ? co.map((r,i)=>`
      <tr>
        <td>${i+1}</td>
        <td><b>${r.kompaniya||'—'}</b></td>
        <td>${r.rahbar||'—'}</td>
        <td style="font-size:.65rem">${r.lavozim||'—'}</td>
        <td style="font-size:.65rem">${r.mahsulotNomi||r.soha||'—'}</td>
        <td style="font-size:.65rem">${r.davlat||'—'}</td>
        <td style="font-size:.65rem">${r.email ? (r.emailStatus==='verified'?'<span style="color:#059669">✅ '+r.email+'</span>':r.email) : '—'}</td>
        <td>${r.linkedin?'<a href="'+(r.linkedin.startsWith('http')?r.linkedin:'https://'+r.linkedin)+'" target="_blank" rel="noopener" style="color:#0A66C2;font-size:.62rem;text-decoration:none" title="'+r.linkedin+'">🔗 Ochish</a>':'—'}</td>
        <td style="font-size:.6rem;color:var(--text3)">${r.manba||'—'}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteRecord('investorCompanies','${r.id}')">🗑</button></td>
      </tr>`).join('')
      : '<tr><td colspan="13"><div class="tc-empty"><div class="tc-empty-icon">🏢</div><p>Hali ma\'lumot yo\'q</p></div></td></tr>';
  }
}

/* Investor Companies Add/Excel moved to assets/js/investor-companies.js */
