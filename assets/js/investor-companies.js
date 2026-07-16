/* ═══════════════════════════════════════
   INVESTOR COMPANIES ADD / EXCEL
═══════════════════════════════════════ */
async function addInvestorCo(){
  const komp = document.getElementById('ic-kompaniya').value.trim();
  const rahb = document.getElementById('ic-rahbar').value.trim();
  const soha = document.getElementById('ic-soha').value.trim();
  if(!komp||!rahb||!soha){toast(t('toast_fill'),'error');return;}
  // Dublikat himoyasi — normalize qilingan nom bo'yicha tekshiramiz
  if(typeof findDuplicateCompany === 'function'){
    var dup = findDuplicateCompany(komp);
    if(dup){
      var dupOwner = (typeof memberName === 'function' && dup.assignedTo) ? (' — Mas\'ul: ' + memberName(dup.assignedTo)) : '';
      if(!confirm('⚠️ "' + komp + '" nomli kompaniya allaqachon bazada bor' + dupOwner + '.\n\nBaribir yangi yozuv sifatida qo\'shilsinmi?')) return;
    }
  }
  var _me = (typeof getCurrentMember === 'function') ? getCurrentMember() : null;
  var _nowIso = new Date().toISOString();
  const rec = {
    id: nextId(DB.investorCompanies||[]),
    kompaniya: komp,
    rahbar: rahb,
    lavozim: (document.getElementById('ic-lavozim')||{}).value||'',
    soha: soha,
    email: document.getElementById('ic-email').value.trim(),
    telefon: (document.getElementById('ic-telefon')||{}).value||'',
    davlat: (document.getElementById('ic-davlat')||{}).value||'',
    linkedin: (document.getElementById('ic-linkedin')||{}).value||'',
    website: (document.getElementById('ic-website')||{}).value||'',
    manba: 'Qo\'lda kiritildi',
    holat: 'Yangi',
    status: 'new',
    sana: new Date().toISOString().slice(0,10),
    emailSent: false,
    // Jamoa maydonlari — qo'shgan odam avtomatik mas'ul bo'ladi
    createdBy: _me ? _me.id : '',
    assignedTo: _me ? _me.id : '',
    createdAt: _nowIso,
    lastActivityAt: _nowIso
  };
  if(!DB.investorCompanies) DB.investorCompanies = [];
  DB.investorCompanies.push(rec);
  if(typeof fbSave==='function') await fbSave('investorCompanies', rec);
  clearIcForm();
  renderInvestorCompanies();
  renderAdminLists();
  toast('✅ Kompaniya saqlandi!');
}

/* ── Apollo BULK import (apollo-bulk-results.json faylini yuklab, bazaga qo'shish) ──
   5719 ta kompaniya faylda qolgan edi — bu yerdan yuklab bazaga import qilinadi.
   Login sessiyasidan foydalanadi (service-account kerak emas). Faqat superadmin. */
async function importApolloBulkFile(input){
  var file = (input.files||[])[0];
  if(input) input.value = '';
  if(!file) return;
  if(typeof canEditGlobal === 'function' && !canEditGlobal()){ toast('⛔ Bu amal faqat superadmin uchun','error'); return; }
  var statusEl = document.getElementById('apolloBulkImportStatus');
  var setS = function(t){ if(statusEl) statusEl.textContent = t; };
  setS('📂 Fayl o\'qilmoqda...');
  var text;
  try { text = await file.text(); } catch(e){ setS('❌ Faylni o\'qib bo\'lmadi'); return; }
  var arr;
  try { arr = JSON.parse(text); } catch(e){ setS('❌ Fayl JSON emas'); toast('❌ Noto\'g\'ri fayl','error'); return; }
  if(!Array.isArray(arr)){ setS('❌ JSON massiv kutilgan edi'); return; }

  var norm = (typeof normalizeCompanyName === 'function') ? normalizeCompanyName : function(s){ return String(s||'').toLowerCase().trim(); };
  var existing = Object.create(null);
  (DB.investorCompanies||[]).forEach(function(r){ var k = norm(r.kompaniya); if(k) existing[k] = true; });
  var seen = Object.create(null);
  var toAdd = [];
  var nowIso = new Date().toISOString();
  arr.forEach(function(r){
    var name = String(r.kompaniya || r.name || '').trim();
    var k = norm(name);
    if(!k || existing[k] || seen[k]) return;
    seen[k] = true;
    toAdd.push({
      id: 'abulk_' + k.replace(/\s+/g,'_').slice(0,60),
      kompaniya: name, rahbar: r.rahbar||'', lavozim: r.lavozim||'',
      email: r.email||'', telefon: r.telefon||'',
      davlat: r.davlat||'', shahar: r.shahar||'', soha: r.soha||'',
      linkedin: r.linkedin||'', website: r.website||'', photoUrl: r.photoUrl||'',
      manba: r.manba || 'Apollo.io (bulk)', holat: 'Yangi', status: 'new',
      sana: r.sana || nowIso.slice(0,10), emailSent: false, needsEmail: !r.email,
      assignedTo: '', createdBy: 'import:apollo-bulk', createdAt: nowIso, lastActivityAt: nowIso
    });
  });

  if(!toAdd.length){ setS('✅ Yangi kompaniya yo\'q — hammasi bazada bor'); toast('Yangi kompaniya topilmadi'); return; }
  if(!confirm('Faylda ' + arr.length + ' ta yozuv. Ulardan ' + toAdd.length + ' tasi YANGI (bazada yo\'q).\n\n' + toAdd.length + ' ta kompaniyani bazaga qo\'shamizmi?')){ setS('Bekor qilindi'); return; }
  setS('⏳ Yozilmoqda... 0/' + toAdd.length);
  try {
    await window.fbBulkAdd('investorCompanies', toAdd, function(w,t){ setS('⏳ Yozilmoqda... ' + w + '/' + t); });
    setS('✅ ' + toAdd.length + ' ta kompaniya qo\'shildi! Jami baza: ' + (DB.investorCompanies||[]).length);
    toast('✅ ' + toAdd.length + ' ta kompaniya import qilindi');
    if(typeof renderInvestorCompanies === 'function') renderInvestorCompanies();
    if(typeof renderAdminLists === 'function') renderAdminLists();
  } catch(e){ setS('❌ Xato: ' + (e && e.message || e)); toast('❌ Import xatosi','error'); }
}
window.importApolloBulkFile = importApolloBulkFile;

function clearIcForm(){
  ['ic-kompaniya','ic-rahbar','ic-lavozim','ic-soha','ic-email','ic-telefon','ic-davlat','ic-linkedin','ic-website'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
}

var _icExcelParsed = [];

function handleIcExcelUpload(input){
  const file = (input.files||[])[0];
  if(!file) return;
  const ext = file.name.split('.').pop().toLowerCase();

  const processRows = function(jsonRows, headerArr){
    if(!jsonRows.length){ toast('\u26A0\uFE0F Faylda ma\'lumot topilmadi','error'); return; }

    var source = detectSource(headerArr || Object.keys(jsonRows[0]));

    _icExcelParsed = jsonRows.map(function(row){
      var keys = Object.keys(row);
      var get = function(exactNames){
        for(var i=0; i<exactNames.length; i++){
          // Exact match first
          for(var j=0; j<keys.length; j++){
            if(keys[j].toLowerCase().trim() === exactNames[i].toLowerCase()){
              var v = row[keys[j]];
              if(v !== undefined && v !== null && String(v).trim()) return String(v).trim();
            }
          }
        }
        // Fuzzy match
        for(var i=0; i<exactNames.length; i++){
          for(var j=0; j<keys.length; j++){
            if(keys[j].toLowerCase().indexOf(exactNames[i].toLowerCase()) !== -1){
              var v = row[keys[j]];
              if(v !== undefined && v !== null && String(v).trim()) return String(v).trim();
            }
          }
        }
        return '';
      };

      var fullName = get(['full name','name','contact name','rahbar']);
      if(!fullName){
        var fn = get(['first name','firstname']);
        var ln = get(['last name','lastname']);
        fullName = ((fn||'') + ' ' + (ln||'')).trim();
      }

      // Get email status FIRST, then email with exclusion
      var emailStatus = get(['email status','email_status']);

      // Special email getter — skip columns with "status" in name
      var emailVal = '';
      for(var j=0; j<keys.length; j++){
        var kl = keys[j].toLowerCase().trim();
        if(kl === 'email' || kl === 'email address' || kl === 'work email' || kl === 'business email'){
          var v = row[keys[j]];
          if(v && String(v).trim() && String(v).indexOf('@') !== -1){
            emailVal = String(v).trim();
            break;
          }
        }
      }
      // Fallback: any column with "email" but NOT "status"
      if(!emailVal){
        for(var j=0; j<keys.length; j++){
          var kl = keys[j].toLowerCase();
          if(kl.indexOf('email') !== -1 && kl.indexOf('status') === -1){
            var v = row[keys[j]];
            if(v && String(v).trim() && String(v).indexOf('@') !== -1){
              emailVal = String(v).trim();
              break;
            }
          }
        }
      }

      var _kompRaw = get(['company name','company','organization name','organization','kompaniya','tashkilot','nomi']);
      var _alt = get(['company name for emails']);
      var _looksLikeDesc = _kompRaw && (_kompRaw.length > 100 || _kompRaw.split(/\s+/).length > 8);
      if(_looksLikeDesc){
        if(_alt && _alt.length <= 100 && _alt.split(/\s+/).length <= 8) _kompRaw = _alt;
        else _kompRaw = '';
      }
      return {
        kompaniya: _kompRaw,
        _skipRow: _looksLikeDesc && !_kompRaw,
        rahbar: fullName,
        lavozim: get(['job title','title','position','lavozim','role','designation']),
        soha: get(['industry','soha','sector','tarmoq']),
        email: emailVal,
        emailStatus: emailStatus,
        telefon: get(['corporate phone','work direct phone','mobile phone','company phone','company phone numbers','phone','phone number','mobile','telefon']),
        davlat: get(['company country','country','location','davlat']),
        shahar: get(['company city','city','shahar']),
        linkedin: get(['person linkedin url','company linkedin url','linkedin url','linkedin']),
        website: get(['website','company website','domain']),
        xodimlar: get(['# employees','#employees','num employees','employees','employee count','xodimlar']),
        daromad: get(['annual revenue','revenue','daromad']),
        tpilyil: get(['founded year','year founded','founded','tashkil yil']),
        manba: source,
        holat: 'Yangi',
        sana: new Date().toISOString().slice(0,10),
        emailSent: false
      };
    }).filter(function(r){
      if(r._skipRow) return false;
      if(!r.kompaniya) return false;
      if(r.kompaniya.length > 100) return false;
      if(!(r.rahbar || r.email)) return false;
      return true;
    }).map(function(r){ delete r._skipRow; return r; });

    if(!_icExcelParsed.length){ toast('\u26A0\uFE0F Kontaktlar topilmadi','error'); return; }

    var withEmail = _icExcelParsed.filter(function(r){return r.email;}).length;
    var verified = _icExcelParsed.filter(function(r){return r.emailStatus === 'verified';}).length;
    var info = _icExcelParsed.length + ' ta kontakt topildi | ' + withEmail + ' ta email';
    if(verified) info += ' | ' + verified + ' ta verified';
    info += ' | Manba: ' + source;
    document.getElementById('icExcelPreviewInfo').innerHTML = '<b>\u{1F4E5} ' + info + '</b>';

    document.getElementById('icExcelPreviewHead').innerHTML = '<tr><th>#</th><th>Kompaniya</th><th>Rahbar</th><th>Lavozim</th><th>Soha</th><th>Davlat</th><th>Email</th><th>LinkedIn</th></tr>';
    document.getElementById('icExcelPreviewBody').innerHTML = _icExcelParsed.map(function(r,i){
      var emailBadge = r.email ? (r.emailStatus==='verified' ? '<span style="color:#059669;font-size:.65rem">\u2705 '+r.email+'</span>' : '<span style="font-size:.65rem">'+r.email+'</span>') : '<span style="color:var(--text3);font-size:.65rem">\u2014</span>';
      var liLink = r.linkedin ? '<a href="'+(r.linkedin.startsWith('http')?r.linkedin:'https://'+r.linkedin)+'" target="_blank" rel="noopener" style="color:#0A66C2;font-size:.6rem;text-decoration:none">🔗 Profil</a>' : '\u2014';
      return '<tr><td>'+(i+1)+'</td><td><b>'+r.kompaniya+'</b></td><td>'+r.rahbar+'</td><td style="font-size:.65rem">'+r.lavozim+'</td><td style="font-size:.65rem">'+r.soha+'</td><td style="font-size:.65rem">'+r.davlat+'</td><td>'+emailBadge+'</td><td>'+liLink+'</td></tr>';
    }).join('');
    document.getElementById('icExcelPreview').style.display = 'block';
  };

  if(ext === 'csv'){
    file.text().then(function(text){
      try {
        var wb = XLSX.read(text, {type:'string'});
        var rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval:''});
        if(!rows.length){ toast('\u26A0\uFE0F CSV bo\'sh','error'); return; }
        processRows(rows);
      } catch(e){
        console.error('CSV parse error:', e);
        toast('\u274C CSV parse xatosi: '+e.message,'error');
      }
    });
  } else {
    var reader = new FileReader();
    reader.onload = function(e){
      var wb = XLSX.read(e.target.result, {type:'array'});
      var sheetNames = wb.SheetNames || [];
      var sheetsParsed = sheetNames.map(function(n){return XLSX.utils.sheet_to_json(wb.Sheets[n], {defval:''});});
      function isContactsSheet(rows){
        if(!rows || !rows.length) return false;
        var keys = Object.keys(rows[0]).map(function(k){return String(k||'').toLowerCase().trim();});
        return keys.indexOf('first name') !== -1 || keys.indexOf('last name') !== -1;
      }
      var contactsIdx = sheetsParsed.findIndex(isContactsSheet);
      if(contactsIdx === -1) contactsIdx = 0;
      var accountsIdx = sheetsParsed.findIndex(function(r,i){return i!==contactsIdx && r && r.length;});
      var firstRows = sheetsParsed[contactsIdx];
      var accountsMap = {};
      if(accountsIdx !== -1){
        var secondRows = sheetsParsed[accountsIdx];
        secondRows.forEach(function(row){
          var keys = Object.keys(row);
          var pick = function(names){
            for(var i=0;i<names.length;i++){
              for(var j=0;j<keys.length;j++){
                if(keys[j].toLowerCase().trim() === names[i].toLowerCase()){
                  var v = row[keys[j]]; if(v!==undefined && v!==null && String(v).trim()) return String(v).trim();
                }
              }
            }
            return '';
          };
          var name = pick(['company name','company','organization name','organization']);
          var site = pick(['website','company website','domain']);
          var siteKey = String(site||'').toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0];
          var nameKey = String(name||'').toLowerCase().trim();
          var info = {
            foundedYear: pick(['founded year','year founded','founded']),
            annualRevenue: pick(['annual revenue','revenue']),
            employees: pick(['# employees','#employees','num employees','employees','employee count']),
            industry: pick(['industry']),
            companyPhone: pick(['company phone','phone']),
            companyLinkedin: pick(['company linkedin url','linkedin url','linkedin']),
            companyCity: pick(['company city','city']),
            companyCountry: pick(['company country','country'])
          };
          if(siteKey) accountsMap['site:'+siteKey] = info;
          if(nameKey) accountsMap['name:'+nameKey] = info;
        });
      }
      // Attach account data onto each contact row (merge by Website then Company Name)
      firstRows.forEach(function(r){
        var keys = Object.keys(r);
        var siteCol = keys.find(function(k){return k.toLowerCase().trim()==='website'||k.toLowerCase().trim()==='company website';});
        var nameCol = keys.find(function(k){return k.toLowerCase().trim()==='company name'||k.toLowerCase().trim()==='company';});
        var sv = siteCol ? String(r[siteCol]||'').toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0] : '';
        var nv = nameCol ? String(r[nameCol]||'').toLowerCase().trim() : '';
        var info = (sv && accountsMap['site:'+sv]) || (nv && accountsMap['name:'+nv]) || null;
        if(info){
          if(info.foundedYear && !r['Founded Year']) r['Founded Year'] = info.foundedYear;
          if(info.annualRevenue && !r['Annual Revenue']) r['Annual Revenue'] = info.annualRevenue;
          if(info.employees && !r['# Employees']) r['# Employees'] = info.employees;
          if(info.industry && !r['Industry']) r['Industry'] = info.industry;
          if(info.companyPhone && !r['Company Phone']) r['Company Phone'] = info.companyPhone;
          if(info.companyLinkedin && !r['Company Linkedin Url']) r['Company Linkedin Url'] = info.companyLinkedin;
          if(info.companyCity && !r['Company City']) r['Company City'] = info.companyCity;
          if(info.companyCountry && !r['Company Country']) r['Company Country'] = info.companyCountry;
        }
      });
      processRows(firstRows);
    };
    reader.readAsArrayBuffer(file);
  }
  if(input.value !== undefined) input.value = '';
}

async function importIcExcel(){
  if(!_icExcelParsed || !_icExcelParsed.length) return;
  if(!DB.investorCompanies) DB.investorCompanies = [];

  var existKeys = DB.investorCompanies.map(function(r){ return ((r.kompaniya||'')+'|'+(r.rahbar||'')).toLowerCase(); });
  var added = 0;
  var saveJobs = [];

  _icExcelParsed.forEach(function(r){
    var key = ((r.kompaniya||'')+'|'+(r.rahbar||'')).toLowerCase();
    if(existKeys.indexOf(key) !== -1) return; // skip duplicates

    var rec = Object.assign({id: nextId(DB.investorCompanies)}, r);
    DB.investorCompanies.push(rec);
    existKeys.push(key);
    if(typeof fbSave==='function') saveJobs.push(fbSave('investorCompanies', rec));
    added++;
  });

  if(saveJobs.length) await Promise.all(saveJobs);

  toast('\u2705 ' + added + ' ta kompaniya import qilindi!' + (_icExcelParsed.length - added > 0 ? ' (' + (_icExcelParsed.length - added) + ' ta dublikat o\'tkazildi)' : ''));
  _icExcelParsed = [];
  cancelIcExcel();
  renderInvestorCompanies();
  renderAdminLists();
}

function cancelIcExcel(){
  _icExcelParsed = [];
  document.getElementById('icExcelPreview').style.display = 'none';
}

function renderAll(){
  renderOverview();
  renderInvestors();
  renderLocal();
  renderZoom();
  renderForums();
  renderIntlForums();
  renderInvestorCompanies();
  if(isAdmin) renderAdminLists();
  if(typeof renderProducts==='function') renderProducts();
  if(typeof renderPipeline==='function') renderPipeline();
  if(typeof updateFinderModeUI==='function') updateFinderModeUI();
  if(typeof renderFinderSourceFilters==='function') renderFinderSourceFilters();
  if(typeof loadSettings==='function') loadSettings();
  if(typeof updateTradeFirebaseCount==='function') updateTradeFirebaseCount();
  if(typeof renderEntrepreneurs==='function') renderEntrepreneurs();
}
