/* ═══════════════════════════════════════
   CSV IMPORT (Apollo / Snov.io / Skrapp / Hunter)
═══════════════════════════════════════ */
async function handleCSVImport(input){
  var file = input.files[0];
  if(!file) return;
  input.value = '';

  var ext = file.name.split('.').pop().toLowerCase();
  var rows = [];
  var header = [];

  try {
    if(ext === 'csv'){
      var text = await file.text();
      var lines = text.split('\n').map(function(l){return l.trim();}).filter(Boolean);
      if(lines.length < 2){ alert('CSV fayl bo\'sh!'); return; }
      header = parseCSVLine(lines[0]).map(function(h){return h.trim();});
      for(var i=1; i<lines.length; i++){
        var vals = parseCSVLine(lines[i]);
        if(vals.length < 2) continue;
        var obj = {};
        header.forEach(function(h,idx){ obj[h] = (vals[idx]||'').trim(); });
        rows.push(obj);
      }
    } else if(ext === 'xlsx' || ext === 'xls'){
      var data = await file.arrayBuffer();
      var wb = XLSX.read(data, {type:'array'});
      var ws = wb.Sheets[wb.SheetNames[0]];
      var jsonRows = XLSX.utils.sheet_to_json(ws, {defval:''});
      if(!jsonRows.length){ alert('Excel fayl bo\'sh!'); return; }
      header = Object.keys(jsonRows[0]);
      rows = jsonRows;
    } else {
      alert('Faqat CSV yoki XLSX fayl yuklang!');
      return;
    }
  } catch(e){
    alert('Fayl o\'qishda xato: ' + e.message);
    return;
  }

  if(!rows.length){ alert('Faylda ma\'lumot topilmadi!'); return; }

  // Map columns — Apollo exact column names + universal
  var records = rows.map(function(row){
    var r = {};
    // Try each key directly first (for Apollo XLSX exact match)
    var keys = Object.keys(row);
    var get = function(exactNames){
      for(var i=0; i<exactNames.length; i++){
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

    r.kompaniya = get(['company name','company','organization name','organization','kompaniya']);
    r.rahbar = get(['full name','name','contact name','rahbar']) || ((get(['first name','firstname'])+' '+get(['last name','lastname'])).trim());
    r.lavozim = get(['job title','title','position','lavozim','role','designation']);
    r.emailStatus = get(['email status','email_status']);

    // Smart email extraction — only values with @ symbol
    r.email = '';
    for(var j=0; j<keys.length; j++){
      var kl = keys[j].toLowerCase().trim();
      if(kl === 'email' || kl === 'email address' || kl === 'work email' || kl === 'business email'){
        var v = row[keys[j]];
        if(v && String(v).indexOf('@') !== -1){ r.email = String(v).trim(); break; }
      }
    }
    if(!r.email){
      for(var j=0; j<keys.length; j++){
        var kl = keys[j].toLowerCase();
        if(kl.indexOf('email') !== -1 && kl.indexOf('status') === -1){
          var v = row[keys[j]];
          if(v && String(v).indexOf('@') !== -1){ r.email = String(v).trim(); break; }
        }
      }
    }

    r.telefon = get(['company phone numbers','phone','phone number','mobile','direct phone','telefon']);
    r.davlat = get(['country','location','davlat']);
    r.shahar = get(['city','shahar']);
    r.soha = get(['industry','soha','sector']);
    r.linkedin = get(['linkedin url','linkedin','linkedin profile']);
    r.website = get(['company website','website','domain']);
    r.xodimlar = get(['employees','employee count']);
    r.holat = 'Yangi';
    r.manba = detectSource(header);
    r.sana = new Date().toISOString().slice(0,10);
    r.emailSent = false;
    return r;
  }).filter(function(r){ return r.kompaniya || r.rahbar || r.email; });

  if(!records.length){
    alert('Fayldan kontaktlar o\'qib bo\'lmadi.\nUstun nomlari tekshiring.');
    return;
  }

  // Preview
  var withEmail = records.filter(function(r){return r.email;}).length;
  var verified = records.filter(function(r){return r.emailStatus === 'verified';}).length;
  var msg = '\u{1F4E5} Import natijasi (' + ext.toUpperCase() + '):\n\n';
  msg += '\u2022 Jami qatorlar: ' + records.length + '\n';
  msg += '\u2022 Email bor: ' + withEmail + '\n';
  if(verified) msg += '\u2022 Verified email: ' + verified + '\n';
  msg += '\u2022 Email yo\'q: ' + (records.length - withEmail) + '\n';
  msg += '\u2022 Manba: ' + records[0].manba + '\n\n';
  msg += 'Namuna:\n';
  records.slice(0,3).forEach(function(r){
    msg += '  \u2192 ' + r.rahbar + ' | ' + r.kompaniya + ' | ' + r.lavozim + ' | ' + (r.email||'email yo\'q') + '\n';
  });
  msg += '\nImport qilamizmi?';

  if(!confirm(msg)) return;

  var count = await saveApolloRecords(records);
  alert('\u2705 ' + count + ' ta kontakt muvaffaqiyatli import qilindi!\nDublikatlar o\'tkazib yuborildi.');

  renderInvestorCompanies();
  renderAll();
}

function parseCSVLine(line){
  var result = [];
  var current = '';
  var inQuotes = false;
  for(var i=0; i<line.length; i++){
    var ch = line[i];
    if(ch === '"'){
      inQuotes = !inQuotes;
    } else if(ch === ',' && !inQuotes){
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function findCol(row, names){
  for(var i=0; i<names.length; i++){
    var keys = Object.keys(row);
    for(var j=0; j<keys.length; j++){
      if(keys[j].toLowerCase().includes(names[i].toLowerCase())){
        if(row[keys[j]]) return row[keys[j]];
      }
    }
  }
  return '';
}

function buildName(row){
  var fn = findCol(row,['first name','first_name','firstname','ism']);
  var ln = findCol(row,['last name','last_name','lastname','familiya']);
  if(fn || ln) return ((fn||'') + ' ' + (ln||'')).trim();
  return '';
}

function detectSource(header){
  var h = (Array.isArray(header) ? header.join(' ') : String(header)).toLowerCase();
  if(h.includes('apollo id') || h.includes('email status')) return 'Apollo.io';
  if(h.includes('apollo') || h.includes('organization')) return 'Apollo.io';
  if(h.includes('snov')) return 'Snov.io';
  if(h.includes('skrapp')) return 'Skrapp.io';
  if(h.includes('hunter')) return 'Hunter.io';
  if(h.includes('lusha')) return 'Lusha';
  if(h.includes('instantly')) return 'Instantly';
  if(h.includes('linkedin')) return 'LinkedIn';
  if(h.includes('kaspr')) return 'Kaspr';
  if(h.includes('rocketreach')) return 'RocketReach';
  return 'Import';
}

/* Snov.io moved to assets/js/snov.js */

/* Forum Detail moved to assets/js/forum-detail.js */

