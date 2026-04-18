/* ═══════════════════════════════════════
   ADMIN TABS
═══════════════════════════════════════ */
function switchAdminTab(id){
  document.querySelectorAll('.atab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.admin-section').forEach(s=>s.style.display='none');
  const at=document.getElementById('atab-'+id);
  if(at)at.classList.add('active');
  const as=document.getElementById('asec-'+id);
  if(as)as.style.display='block';
  // Render pending investor geo map when tab becomes visible
  if(id === 'investorco' && window._pendingInvestorGeoCompanies && window._pendingInvestorGeoCompanies.length){
    var pending = window._pendingInvestorGeoCompanies;
    window._pendingInvestorGeoCompanies = null;
    setTimeout(function(){ renderInvestorGeoCard(pending); }, 80);
  }
}

/* ═══════════════════════════════════════
   DELETE
═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   FORMS
═══════════════════════════════════════ */
function clearForm(ids){ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=''});}

function addInvestor(){
  if(!v('inv-shahar')||!v('inv-davlat')||!v('inv-kompaniya')||!v('inv-loyiha')||!v('inv-makom')||!v('inv-maqsad')){toast('⚠️ Majburiy maydonlarni to\'ldiring!','error');return;}
  const rec={id:nextId(DB.investors),shahar:v('inv-shahar'),sana:dateToISO(v('inv-sana')),davlat:v('inv-davlat'),flag:v('inv-flag'),maqsad:v('inv-maqsad'),kompaniya:v('inv-kompaniya'),loyiha:v('inv-loyiha'),qiymat:v('inv-qiymat'),makom:v('inv-makom'),hudud:v('inv-hudud'),izoh:v('inv-izoh')};
  DB.investors.push(rec);
  if(typeof fbSave==='function') fbSave('investors',rec);
  clearForm(['inv-shahar','inv-sana','inv-davlat','inv-flag','inv-maqsad','inv-kompaniya','inv-loyiha','inv-qiymat','inv-makom','inv-hudud','inv-izoh']);
  renderAll();toast('✅ Investor qo\'shildi!');
}
function addLocal(){
  if(!v('loc-kompaniya')||!v('loc-rahbar')||!v('loc-soha')||!v('loc-holat')){toast('⚠️ Majburiy maydonlarni to\'ldiring!','error');return;}
  const rec={id:nextId(DB.local),kompaniya:v('loc-kompaniya'),rahbar:v('loc-rahbar'),lavozim:v('loc-lavozim'),soha:v('loc-soha'),summa:parseFloat(v('loc-summa'))||0,holat:v('loc-holat'),tel:v('loc-tel'),izoh:v('loc-izoh')};
  DB.local.push(rec);
  if(typeof fbSave==='function') fbSave('local',rec);
  clearForm(['loc-kompaniya','loc-rahbar','loc-lavozim','loc-soha','loc-summa','loc-holat','loc-tel','loc-izoh']);
  renderAll();toast('✅ Tadbirkor qo\'shildi!');
}
function addZoom(){
  if(!v('zm-ism')||!v('zm-org')||!v('zm-sana')||!v('zm-natija-holat')){toast('⚠️ Majburiy maydonlarni to\'ldiring!','error');return;}
  const rec={id:nextId(DB.zoom),ism:v('zm-ism'),org:v('zm-org'),davlat:v('zm-davlat'),sana:dateToISO(v('zm-sana')),ishtirokchi:parseInt(v('zm-ishtirokchi'))||1,natijaHolat:v('zm-natija-holat'),desc:v('zm-desc'),natija:v('zm-natija'),media:[..._zmAdminMedia]};
  DB.zoom.push(rec);
  _zmAdminMedia=[];
  if(typeof fbSave==='function') fbSave('zoom',rec);
  clearZmForm();renderAll();toast('✅ Uchrashuv saqlandi!');
}
