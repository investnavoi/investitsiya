function openApolloSearch(){
  document.getElementById('apolloModal').classList.add('open');
  _apoResults = [];
  _apoSelected.clear();
  document.getElementById('apolloResults').innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text3)"><div style="font-size:2.5rem;margin-bottom:.5rem">\u{1F50D}</div><div style="font-size:.82rem">Filtrlarni tanlang va <b>Qidirish</b> tugmasini bosing</div><div style="font-size:.68rem;margin-top:.3rem">People Search \u2014 bepul, kredit sarflamaydi</div></div>';
  document.getElementById('apolloImportBar').style.display = 'none';
}

function closeApolloSearch(){
  document.getElementById('apolloModal').classList.remove('open');
}

function getSelectedOptions(id){
  var sel = document.getElementById(id);
  var vals = [];
  for(var i=0;i<sel.options.length;i++){
    if(sel.options[i].selected) vals.push(sel.options[i].value);
  }
  return vals;
}

async function apolloSearch(page){
  if(page) _apoPage = page; else _apoPage = 1;
  var industries = getSelectedOptions('apo-industry');
  var locations = getSelectedOptions('apo-location');
  var titles = getSelectedOptions('apo-title');

  if(!industries.length && !locations.length && !titles.length){
    alert('Kamida bitta filtr tanlang!');
    return;
  }

  var btn = document.getElementById('apolloSearchBtn');
  var status = document.getElementById('apolloStatus');
  btn.disabled = true;
  btn.textContent = '\u23F3 Qidirilmoqda...';
  status.textContent = 'Apollo bazasidan ma\'lumot olinmoqda...';

  var body = {
    action: 'people_search',
    page: _apoPage,
    per_page: 25,
    api_key: getApolloApiKey()
  };
  if(titles.length) body.person_titles = titles;
  if(locations.length) body.organization_locations = locations;
  if(industries.length) body.q_organization_keyword_tags = industries;

  try {
    var resp = await fetch(APOLLO_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if(!resp.ok){
      var errText = await resp.text();
      throw new Error('Apollo API xato: ' + resp.status + ' - ' + errText);
    }

    var data = await resp.json();
    _apoResults = (data.people || []);
    var totalCount = data.pagination ? data.pagination.total_entries : _apoResults.length;
    var totalPages = data.pagination ? data.pagination.total_pages : 1;

    status.textContent = totalCount + ' ta natija topildi (sahifa ' + _apoPage + '/' + totalPages + ')';
    document.getElementById('apoPageNum').textContent = _apoPage;

    renderApolloResults();
  } catch(err){
    status.textContent = 'Xato: ' + err.message;
    document.getElementById('apolloResults').innerHTML = '<div style="text-align:center;padding:2rem;color:#EF233C"><div style="font-size:2rem;margin-bottom:.5rem">\u26A0\u{FE0F}</div><div style="font-size:.8rem">'+err.message+'</div><div style="font-size:.68rem;margin-top:.5rem;color:var(--text3)">CORS muammosi bo\'lsa, Apollo Chrome Extension orqali CSV eksport qiling va import tugmasidan foydalaning</div></div>';
  }

  btn.disabled = false;
  btn.textContent = '\u{1F50D} Qidirish';
}

function renderApolloResults(){
  var container = document.getElementById('apolloResults');
  if(!_apoResults.length){
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text3)"><div style="font-size:2rem">\u{1F6AB}</div><div>Natija topilmadi. Filtrlarni o\'zgartiring.</div></div>';
    document.getElementById('apolloImportBar').style.display = 'none';
    return;
  }

  var html = '<table style="width:100%;font-size:.72rem;border-collapse:collapse">';
  html += '<thead><tr style="background:var(--bg);border-bottom:2px solid var(--border)">';
  html += '<th style="width:35px;padding:8px"><input type="checkbox" onchange="apolloToggleAll(this)" id="apoCheckAll"></th>';
  html += '<th style="padding:8px;text-align:left">Ism / Lavozim</th>';
  html += '<th style="padding:8px;text-align:left">Kompaniya</th>';
  html += '<th style="padding:8px;text-align:left">Mamlakat</th>';
  html += '<th style="padding:8px;text-align:left">Soha</th>';
  html += '<th style="padding:8px;text-align:left">Email</th>';
  html += '</tr></thead><tbody>';

  _apoResults.forEach(function(p, i){
    var name = (p.first_name||'') + ' ' + (p.last_name||'');
    var title = p.title || '';
    var orgName = (p.organization && p.organization.name) || p.organization_name || '';
    var city = p.city || '';
    var country = p.country || '';
    var loc = [city, country].filter(Boolean).join(', ');
    var industry = (p.organization && p.organization.industry) || '';
    var email = p.email || '';
    var phone = p.phone_number || p.sanitized_phone || '';
    var avatar = (name.trim().charAt(0) || '?').toUpperCase();
    var checked = _apoSelected.has(i) ? ' checked' : '';
    var linkedIn = p.linkedin_url || '';

    html += '<tr style="border-bottom:1px solid var(--border);transition:background .15s" onmouseover="this.style.background=\'rgba(67,97,238,.06)\'" onmouseout="this.style.background=\'transparent\'">';
    html += '<td style="padding:8px;text-align:center"><input type="checkbox" onchange="apolloToggle('+i+',this)"'+checked+'></td>';
    html += '<td style="padding:8px"><div style="display:flex;align-items:center;gap:8px">';
    html += '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#4361EE,#7209B7);display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0">'+avatar+'</div>';
    html += '<div><div style="font-weight:700;color:var(--text)">'+name.trim()+'</div>';
    html += '<div style="font-size:.62rem;color:var(--text2)">'+title+'</div></div></div></td>';
    html += '<td style="padding:8px"><div style="font-weight:600;color:var(--text)">'+orgName+'</div></td>';
    html += '<td style="padding:8px;color:var(--text2)">'+loc+'</td>';
    html += '<td style="padding:8px"><span style="font-size:.6rem;background:rgba(67,97,238,.1);padding:2px 6px;border-radius:6px;color:#4361EE">'+industry+'</span></td>';
    html += '<td style="padding:8px">';
    if(email){
      html += '<span style="color:#059669;font-size:.65rem">\u{2709}\u{FE0F} '+email+'</span>';
    } else {
      html += '<span style="color:var(--text3);font-size:.62rem">Email yo\'q (Enrich kerak)</span>';
    }
    html += '</td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;

  document.getElementById('apolloImportBar').style.display = 'flex';
  updateApoSelectedInfo();
}

function apolloToggle(idx, el){
  if(el.checked) _apoSelected.add(idx); else _apoSelected.delete(idx);
  updateApoSelectedInfo();
}

function apolloToggleAll(el){
  _apoResults.forEach(function(p,i){
    if(el.checked) _apoSelected.add(i); else _apoSelected.delete(i);
  });
  renderApolloResults();
}

function apolloSelectAll(){
  _apoResults.forEach(function(p,i){ _apoSelected.add(i); });
  renderApolloResults();
}

function updateApoSelectedInfo(){
  document.getElementById('apoSelectedInfo').textContent = _apoSelected.size + ' / ' + _apoResults.length + ' ta tanlandi';
}

async function apolloImportSelected(){
  if(!_apoSelected.size){
    alert('Kamida bitta kontakt tanlang!');
    return;
  }

  var importList = [];
  _apoSelected.forEach(function(idx){
    var p = _apoResults[idx];
    if(!p) return;
    importList.push(apolloPersonToRecord(p));
  });

  if(!confirm(importList.length + ' ta kontaktni saytga import qilamizmi?')) return;
  var count = await saveApolloRecords(importList);
  alert('\u2705 ' + count + ' ta kontakt muvaffaqiyatli import qilindi!');
  closeApolloSearch();
  renderInvestorCompanies();
  renderAll();
}

function apolloPersonToRecord(p){
  var name = ((p.first_name||'') + ' ' + (p.last_name||'')).trim();
  return {
    kompaniya: (p.organization && p.organization.name) || p.organization_name || '',
    rahbar: name,
    photoUrl: p.photo_url || p.photoUrl || '',
    lavozim: p.title || '',
    email: p.email || '',
    telefon: p.phone_number || p.sanitized_phone || '',
    davlat: p.country || '',
    shahar: p.city || '',
    soha: (p.organization && p.organization.industry) || '',
    linkedin: p.linkedin_url || '',
    website: (p.organization && p.organization.website_url) || '',
    holat: 'Yangi',
    manba: 'Apollo.io',
    sana: new Date().toISOString().slice(0,10),
    emailSent: false
  };
}

async function saveApolloRecords(list){
  if(!DB.investorCompanies) DB.investorCompanies = [];
  var successCount = 0;
  var existNames = DB.investorCompanies.map(function(r){ return ((r.kompaniya||'')+'|'+(r.rahbar||'')).toLowerCase(); });

  for(var i=0; i<list.length; i++){
    var item = Object.assign({}, list[i]);
    var key = ((item.kompaniya||'')+'|'+(item.rahbar||'')).toLowerCase();
    if(existNames.includes(key)) continue;
    try {
      item.id = nextId(DB.investorCompanies);
      if(typeof fbSave==='function'){
        await fbSave('investorCompanies', item);
      } else if(typeof firebase !== 'undefined' && firebase.firestore){
        await firebase.firestore().collection('investorCompanies').doc(String(item.id)).set(item);
      }
      DB.investorCompanies.push(item);
      existNames.push(key);
      successCount++;
    } catch(e){
      console.error('Import xato:', e);
    }
  }
  return successCount;
}

/* ═══ APOLLO AUTO-IMPORT ═══ */
const APOLLO_AUTO_SEARCHES = [
  {label:'Mining & Metals — Germany, Canada, Australia', titles:['CEO','Founder','Managing Director','Chairman'], locations:['Germany','Canada','Australia'], industries:['mining & metals']},
  {label:'Oil & Energy — UAE, Saudi Arabia, USA', titles:['CEO','Founder','President','Director'], locations:['United Arab Emirates','Saudi Arabia','United States'], industries:['oil & energy']},
  {label:'Manufacturing — China, Turkey, South Korea', titles:['CEO','Founder','Managing Director','Owner'], locations:['China','Turkey','South Korea'], industries:['manufacturing']},
  {label:'Construction — Turkey, Germany, UAE', titles:['CEO','Founder','Director','Owner'], locations:['Turkey','Germany','United Arab Emirates'], industries:['construction']},
  {label:'Agriculture — India, China, Germany', titles:['CEO','Founder','Managing Director'], locations:['India','China','Germany'], industries:['agriculture']},
  {label:'Textiles — Turkey, China, India', titles:['CEO','Founder','Owner','Director'], locations:['Turkey','China','India'], industries:['textiles']},
  {label:'Chemicals — Germany, China, Japan', titles:['CEO','Founder','Managing Director'], locations:['Germany','China','Japan'], industries:['chemicals']},
  {label:'Renewable Energy — Germany, UAE, UK', titles:['CEO','Founder','Director'], locations:['Germany','United Arab Emirates','United Kingdom'], industries:['renewable energy']},
  {label:'Food & Beverages — UAE, Turkey, Russia', titles:['CEO','Founder','Owner'], locations:['United Arab Emirates','Turkey','Russia'], industries:['food & beverages']},
  {label:'Logistics — China, UAE, Singapore', titles:['CEO','Founder','Director'], locations:['China','United Arab Emirates','Singapore'], industries:['logistics']}
];

let _apoAutoRunning = false;

async function apolloAutoImport(){
  if(_apoAutoRunning){
    alert('Import allaqachon ishlayapti, kuting!');
    return;
  }

  if(!confirm('Apollo.io dan Navoiyga mos 10 ta sanoat bo\'yicha avtomatik qidiruv va import boshlanadi.\n\nHar bir qidiruvdan 25 tadan kontakt olinadi.\nJami: ~250 ta kontakt.\n\nDavom etsinmi?')) return;

  _apoAutoRunning = true;
  var btn = document.getElementById('apoAutoBtn');
  btn.disabled = true;
  btn.textContent = '\u23F3 Import qilinmoqda...';

  var progressDiv = document.getElementById('apoAutoProgress');
  var bar = document.getElementById('apoAutoBar');
  var statusEl = document.getElementById('apoAutoStatus');
  var detailEl = document.getElementById('apoAutoDetail');
  var titleEl = document.getElementById('apoAutoTitle');
  progressDiv.style.display = 'block';

  var totalImported = 0;
  var totalFound = 0;
  var totalSearches = APOLLO_AUTO_SEARCHES.length;

  for(var s=0; s<totalSearches; s++){
    var search = APOLLO_AUTO_SEARCHES[s];
    var pct = Math.round(((s)/totalSearches)*100);
    bar.style.width = pct + '%';
    statusEl.textContent = (s+1) + ' / ' + totalSearches + ' qidiruv';
    detailEl.textContent = '\u{1F50D} ' + search.label;
    titleEl.textContent = '\u26A1 ' + search.label;

    try {
      var body = {
        page: 1,
        per_page: 25,
        api_key: getApolloApiKey(),
        action: 'people_search',
        person_titles: search.titles,
        organization_locations: search.locations
      };
      if(search.industries && search.industries.length) body.organization_industry_tag_ids = search.industries;

      var resp = await fetch(APOLLO_PROXY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if(!resp.ok){
        detailEl.textContent = '\u26A0\uFE0F Xato: ' + resp.status + ' — keyingisiga o\'tilmoqda...';
        await new Promise(function(r){setTimeout(r,1500)});
        continue;
      }

      var data = await resp.json();
      var people = data.people || [];
      totalFound += people.length;

      if(people.length > 0){
        var records = people.map(apolloPersonToRecord);
        var imported = await saveApolloRecords(records);
        totalImported += imported;
        detailEl.textContent = '\u2705 ' + people.length + ' topildi, ' + imported + ' ta import qilindi';
      } else {
        detailEl.textContent = '\u{1F6AB} Natija topilmadi';
      }
    } catch(err){
      detailEl.textContent = '\u26A0\uFE0F ' + err.message;
    }

    // Rate limit — Apollo bepul: 50 req/min
    await new Promise(function(r){setTimeout(r,1500)});
  }

  bar.style.width = '100%';
  statusEl.textContent = 'Tugadi!';
  titleEl.textContent = '\u2705 Import yakunlandi!';
  detailEl.textContent = 'Jami topildi: ' + totalFound + ' | Import qilindi: ' + totalImported + ' | Dublikatlar o\'tkazib yuborildi';

  btn.disabled = false;
  btn.textContent = '\u26A1 Apollo import';
  _apoAutoRunning = false;

  renderInvestorCompanies();
  renderAll();

  setTimeout(function(){
    progressDiv.style.display = 'none';
  }, 8000);
}

