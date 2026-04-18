/* ═══════════════════════════════════════
   SNOV.IO INTEGRATION
═══════════════════════════════════════ */
var SNOV_PROXY = 'https://navoiy-api-proxy.vercel.app/api/snov-search';

// Target company domains for Navoiy-relevant industries
var SNOV_TARGET_DOMAINS = [
  // Mining & Metals
  {domain:'rio-tinto.com',label:'Rio Tinto (Mining)'},
  {domain:'bhp.com',label:'BHP (Mining)'},
  {domain:'glencore.com',label:'Glencore (Mining/Trading)'},
  {domain:'barrick.com',label:'Barrick Gold (Mining)'},
  {domain:'newmont.com',label:'Newmont (Gold Mining)'},
  {domain:'freeportmcmoran.com',label:'Freeport-McMoRan (Copper/Gold)'},
  {domain:'angloamerican.com',label:'Anglo American (Mining)'},
  {domain:'vale.com',label:'Vale (Mining)'},
  {domain:'teck.com',label:'Teck Resources (Mining)'},
  // Energy
  {domain:'totalenergies.com',label:'TotalEnergies (Energy)'},
  {domain:'siemens-energy.com',label:'Siemens Energy'},
  {domain:'vestas.com',label:'Vestas (Wind Energy)'},
  {domain:'shell.com',label:'Shell (Energy)'},
  {domain:'bp.com',label:'BP (Energy)'},
  // Construction & Engineering
  {domain:'bechtel.com',label:'Bechtel (Engineering)'},
  {domain:'vinci.com',label:'Vinci (Construction)'},
  {domain:'skanska.com',label:'Skanska (Construction)'},
  // Manufacturing
  {domain:'caterpillar.com',label:'Caterpillar (Heavy Machinery)'},
  {domain:'komatsu.com',label:'Komatsu (Mining Equipment)'},
  {domain:'sandvik.com',label:'Sandvik (Industrial)'},
  // Agriculture & Food
  {domain:'bayer.com',label:'Bayer (Agriculture)'},
  {domain:'syngenta.com',label:'Syngenta (Agriculture)'},
  {domain:'deere.com',label:'John Deere (Agriculture)'},
  // Textiles
  {domain:'lenzing.com',label:'Lenzing (Textiles/Fiber)'},
  // Chemicals
  {domain:'basf.com',label:'BASF (Chemicals)'},
  {domain:'linde.com',label:'Linde (Industrial Gas)'}
];

let _snovRunning = false;

async function snovAutoImport(){
  if(_snovRunning){
    alert('Snov.io import allaqachon ishlayapti!');
    return;
  }

  if(!confirm('Snov.io orqali 26 ta yirik xalqaro kompaniyadan tadbirkorlar (email bilan) import qilinadi.\n\nHar bir kompaniyadan CEO, Director, VP lavozimli kontaktlar olinadi.\n\nDavom etsinmi?')) return;

  _snovRunning = true;
  var btn = document.getElementById('snovAutoBtn');
  btn.disabled = true;
  btn.textContent = '\u23F3 Snov.io import...';

  var progressDiv = document.getElementById('apoAutoProgress');
  var bar = document.getElementById('apoAutoBar');
  var statusEl = document.getElementById('apoAutoStatus');
  var detailEl = document.getElementById('apoAutoDetail');
  var titleEl = document.getElementById('apoAutoTitle');
  progressDiv.style.display = 'block';
  progressDiv.style.background = 'linear-gradient(135deg,rgba(67,97,238,.08),rgba(114,9,183,.08))';
  progressDiv.style.borderColor = 'rgba(67,97,238,.2)';

  var totalImported = 0;
  var totalFound = 0;
  var total = SNOV_TARGET_DOMAINS.length;

  for(var s=0; s<total; s++){
    var target = SNOV_TARGET_DOMAINS[s];
    var pct = Math.round((s/total)*100);
    bar.style.width = pct + '%';
    bar.style.background = 'linear-gradient(90deg,#4361EE,#7209B7)';
    statusEl.textContent = (s+1) + ' / ' + total;
    detailEl.textContent = '\u{1F50D} ' + target.label + ' (' + target.domain + ')';
    titleEl.textContent = '\u{1F52E} Snov.io: ' + target.label;

    try {
      // Step 1: Start domain search
      var resp1 = await fetch(SNOV_PROXY, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({_action:'domain-search', domain:target.domain})
      });

      if(!resp1.ok){
        var errData = await resp1.json().catch(function(){return {};});
        detailEl.textContent = '\u26A0\uFE0F ' + (errData.error || resp1.status) + ' — keyingisiga...';
        await new Promise(function(r){setTimeout(r,2000)});
        continue;
      }

      var data1 = await resp1.json();

      // Check if we got results directly or need to fetch
      var prospects = [];

      if(data1.prospects && data1.prospects.length){
        prospects = data1.prospects;
      } else if(data1.data && data1.data.prospects){
        prospects = data1.data.prospects;
      } else if(data1.links && data1.links.prospects){
        // Step 2: Get prospects from result URL
        await new Promise(function(r){setTimeout(r,2000)});
        var resp2 = await fetch(SNOV_PROXY, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({_action:'domain-search-results', resultUrl: data1.links.prospects})
        });
        if(resp2.ok){
          var data2 = await resp2.json();
          prospects = data2.data || data2.prospects || [];
        }
      }

      totalFound += prospects.length;

      if(prospects.length > 0){
        var records = prospects.map(function(p){
          var firstName = p.firstName || p.first_name || '';
          var lastName = p.lastName || p.last_name || '';
          var name = (firstName + ' ' + lastName).trim();
          var emails = p.emails || [];
          var email = '';
          if(emails.length > 0){
            // Prefer verified email
            var valid = emails.find(function(e){return e.status === 'valid';});
            email = valid ? valid.email : emails[0].email;
          }
          return {
            kompaniya: p.company || target.label.split('(')[0].trim(),
            rahbar: name,
            lavozim: p.position || p.title || '',
            email: email || '',
            telefon: '',
            davlat: p.country || '',
            shahar: p.city || '',
            soha: p.industry || target.label.match(/\(([^)]+)\)/)?.[1] || '',
            linkedin: p.social_link || p.linkedin || '',
            website: target.domain,
            holat: 'Yangi',
            manba: 'Snov.io',
            sana: new Date().toISOString().slice(0,10),
            emailSent: false
          };
        });

        var imported = await saveApolloRecords(records);
        totalImported += imported;
        detailEl.textContent = '\u2705 ' + prospects.length + ' topildi, ' + imported + ' import qilindi';
      } else {
        detailEl.textContent = '\u{1F6AB} Natija topilmadi yoki API kreditsiz';
      }

    } catch(err){
      detailEl.textContent = '\u26A0\uFE0F ' + err.message;
    }

    // Rate limit — Snov.io: 60 req/min
    await new Promise(function(r){setTimeout(r,2500)});
  }

  bar.style.width = '100%';
  statusEl.textContent = 'Tugadi!';
  titleEl.textContent = '\u2705 Snov.io import yakunlandi!';
  detailEl.textContent = 'Jami topildi: ' + totalFound + ' | Import: ' + totalImported + ' | Dublikatlar o\'tkazildi';

  btn.disabled = false;
  btn.textContent = '\u{1F52E} Snov.io import';
  _snovRunning = false;

  renderInvestorCompanies();
  renderAll();

  setTimeout(function(){
    progressDiv.style.display = 'none';
    progressDiv.style.background = '';
    progressDiv.style.borderColor = '';
  }, 8000);
}
