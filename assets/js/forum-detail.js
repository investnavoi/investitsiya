/* ═══════════════════════════════════════
   FORUM DETAIL & EDIT
═══════════════════════════════════════ */
var _forumDetailId = null;

/* Delegated hover for investor company grouped rows — keeps all rows in the same
   company group painted the same hover color (fixes rowspan'd soha cell appearing
   faded when a non-first row is hovered). */
(function bindIcGroupHover(){
  if(typeof window === 'undefined' || window._icGroupHoverBound) return;
  window._icGroupHoverBound = true;
  function paint(tr, bgAttr){
    if(!tr || !tr.classList || !tr.classList.contains('ic-group-row')) return;
    var group = tr.getAttribute('data-group');
    var bg = tr.getAttribute(bgAttr);
    var tbody = tr.parentNode;
    if(!group || !bg || !tbody) return;
    var rows = tbody.querySelectorAll('tr.ic-group-row[data-group="'+group+'"]');
    for(var i=0;i<rows.length;i++) rows[i].style.background = bg;
  }
  document.addEventListener('mouseover', function(e){
    var tr = e.target && e.target.closest ? e.target.closest('tr.ic-group-row') : null;
    if(tr) paint(tr, 'data-group-hover');
  });
  document.addEventListener('mouseout', function(e){
    var tr = e.target && e.target.closest ? e.target.closest('tr.ic-group-row') : null;
    if(!tr) return;
    // Only restore if mouse actually left the whole group — check relatedTarget
    var rel = e.relatedTarget;
    if(rel && rel.closest && rel.closest('tr.ic-group-row[data-group="'+tr.getAttribute('data-group')+'"]')) return;
    paint(tr, 'data-group-bg');
  });
})();

function openForumDetail(id){
  const r = DB.forums.find(f=>f.id===id);
  if(!r) return;
  _forumDetailId = id;

  document.getElementById('fdNom').textContent = r.nom||'—';
  document.getElementById('fdMeta').textContent = (r.sana||'') + ' • ' + (r.shahar||'') + ', ' + (r.davlat||'');
  document.getElementById('fdLoc').textContent = (r.shahar||'—') + ', ' + (r.davlat||'—');
  document.getElementById('fdTuri').textContent = r.turi||'—';
  document.getElementById('fdSana').textContent = r.sana||'—';
  document.getElementById('fdHolat').innerHTML = `<span style="font-weight:600">${r.holat||'—'}</span>`;
  document.getElementById('fdDesc').textContent = r.desc||'—';
  document.getElementById('fdIzoh').textContent = r.izoh||'—';
  document.getElementById('fdIzohWrap').style.display = r.izoh ? 'block' : 'none';

  // Show edit/add doc buttons only for admin
  document.getElementById('fdEditBtn').style.display = isAdmin ? 'inline-flex' : 'none';
  document.getElementById('fdAddDocBtn').style.display = isAdmin ? 'inline-flex' : 'none';
  document.getElementById('fdDocForm').style.display = 'none';

  renderForumDocs(r);
  document.getElementById('forumDetailModal').classList.add('open');
}

function closeForumDetail(){
  document.getElementById('forumDetailModal').classList.remove('open');
  _forumDetailId = null;
}

function renderForumDocs(r){
  const docs = r.docs||[];
  const list = document.getElementById('fdDocList');
  if(!docs.length){
    list.innerHTML = '<div style="font-size:.72rem;color:var(--text3);text-align:center;padding:1.2rem 0">📁 Hujjat qo\'shilmagan</div>';
    return;
  }
  list.innerHTML = docs.map((d,i)=>{
    const sizeStr = d.size ? (d.size>1024*1024 ? (d.size/1024/1024).toFixed(1)+' MB' : Math.round(d.size/1024)+' KB') : '';
    const dlBtn = d.data
      ? `<a href="${d.data}" download="${d.fileName||d.nom}" class="btn btn-blue btn-sm" style="font-size:.63rem;flex-shrink:0" onclick="event.stopPropagation()">⬇️ Yuklab olish</a>`
      : (d.url ? `<a href="${d.url}" target="_blank" class="btn btn-blue btn-sm" style="font-size:.63rem;flex-shrink:0" onclick="event.stopPropagation()">🔗 Ochish</a>` : '');
    return `
    <div style="display:flex;align-items:center;gap:.6rem;padding:.55rem .7rem;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
      <span style="font-size:1.2rem">${d.icon||'📄'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:.73rem;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.nom||'Hujjat'}</div>
        <div style="font-size:.62rem;color:var(--text3)">${d.fileName||''} ${sizeStr?'• '+sizeStr:''}</div>
      </div>
      ${dlBtn}
      ${isAdmin?`<button class="btn btn-danger btn-sm" style="font-size:.63rem;flex-shrink:0" onclick="deleteForumDoc(${i})">🗑</button>`:''}
    </div>`;
  }).join('');
}

var _fdSelectedFile = null;

function onFdFileSelect(input){
  const file = input.files[0];
  if(!file) return;
  _fdSelectedFile = file;
  document.getElementById('fdFileName').textContent = file.name;
  document.getElementById('fdFileLabel').style.borderColor = '#4361EE';
  // Auto-fill name if empty
  const nameEl = document.getElementById('fdDocName');
  if(!nameEl.value) nameEl.value = file.name.replace(/\.[^/.]+$/,'');
}

function showAddDocForm(){
  _fdSelectedFile = null;
  document.getElementById('fdDocForm').style.display = 'block';
  document.getElementById('fdDocName').value = '';
  document.getElementById('fdFileName').textContent = 'Fayl tanlash (Excel, Word, PDF, Rasm...)';
  document.getElementById('fdFileLabel').style.borderColor = 'var(--border)';
  document.getElementById('fdFileInput').value = '';
}

function cancelFdDoc(){
  _fdSelectedFile = null;
  document.getElementById('fdDocForm').style.display = 'none';
}

function getFileIcon(name){
  if(!name) return '📁';
  const ext = name.split('.').pop().toLowerCase();
  if(['xlsx','xls','csv'].includes(ext)) return '📊';
  if(['doc','docx'].includes(ext)) return '📝';
  if(['pdf'].includes(ext)) return '📄';
  if(['png','jpg','jpeg','gif','webp'].includes(ext)) return '🖼';
  if(['pptx','ppt'].includes(ext)) return '📑';
  return '📁';
}

function saveForumDoc(){
  const r = DB.forums.find(f=>f.id===_forumDetailId);
  if(!r) return;
  if(!_fdSelectedFile){ toast('⚠️ Fayl tanlang','error'); return; }
  const nom = document.getElementById('fdDocName').value.trim() || _fdSelectedFile.name;
  const icon = getFileIcon(_fdSelectedFile.name);

  const reader = new FileReader();
  reader.onload = function(e){
    if(!r.docs) r.docs = [];
    r.docs.push({nom, icon, data: e.target.result, fileName: _fdSelectedFile.name, size: _fdSelectedFile.size});
    if(typeof fbSave==='function') fbSave('forums', r);
    renderForumDocs(r);
    renderForums();
    cancelFdDoc();
    toast('📎 Hujjat qo\'shildi!');
    _fdSelectedFile = null;
  };
  reader.readAsDataURL(_fdSelectedFile);
}

function deleteForumDoc(idx){
  const r = DB.forums.find(f=>f.id===_forumDetailId);
  if(!r||!r.docs) return;
  r.docs.splice(idx,1);
  if(typeof fbSave==='function') fbSave('forums', r);
  renderForumDocs(r);
  renderForums();
  toast('🗑 Hujjat o\'chirildi');
}

function openForumEdit(){
  const r = DB.forums.find(f=>f.id===_forumDetailId);
  if(!r) return;
  document.getElementById('fed-nom').value = r.nom||'';
  document.getElementById('fed-sana').value = dateToDisplay(r.sana||'');
  document.getElementById('fed-shahar').value = r.shahar||'';
  document.getElementById('fed-davlat').value = r.davlat||'';
  document.getElementById('fed-turi').value = r.turi||'';
  document.getElementById('fed-holat').value = r.holat||'';
  document.getElementById('fed-desc').value = r.desc||'';
  document.getElementById('fed-izoh').value = r.izoh||'';
  document.getElementById('forumEditModal').classList.add('open');
}

function closeForumEdit(){
  document.getElementById('forumEditModal').classList.remove('open');
}

function saveForumEdit(){
  const r = DB.forums.find(f=>f.id===_forumDetailId);
  if(!r) return;
  r.nom = document.getElementById('fed-nom').value.trim();
  r.sana = dateToISO(document.getElementById('fed-sana').value);
  r.shahar = document.getElementById('fed-shahar').value.trim();
  r.davlat = document.getElementById('fed-davlat').value.trim();
  r.turi = document.getElementById('fed-turi').value;
  r.holat = document.getElementById('fed-holat').value;
  r.desc = document.getElementById('fed-desc').value.trim();
  r.izoh = document.getElementById('fed-izoh').value.trim();
  if(typeof fbSave==='function') fbSave('forums', r);
  closeForumEdit();
  openForumDetail(_forumDetailId); // refresh detail view
  renderForums();
  toast('✅ Forum yangilandi!');
}


function getEmailStatusBadge(r){
  if(!r.email) return '<span style="font-size:.65rem;color:var(--text3)">— Email yo\'q</span>';
  const notifs = (typeof _notifications !== 'undefined' && _notifications) ? _notifications : [];
  const hasReply = notifs.some(function(n){ return n.fromEmail && n.fromEmail.toLowerCase()===r.email.toLowerCase(); });
  if(hasReply) return '<span class="email-reply-badge" onclick="openCompanyReply(\''+r.email+'\')" style="cursor:pointer"><span style="width:7px;height:7px;border-radius:50%;background:#7C3AED;display:inline-block"></span>Javob keldi</span>';
  if(r.emailSent) return '<span class="email-sent-badge"><span style="width:7px;height:7px;border-radius:50%;background:#059669;display:inline-block"></span>Yuborildi</span>';
  return '<span class="email-unsent-badge"><span style="width:7px;height:7px;border-radius:50%;background:#D97706;display:inline-block"></span>Yuborilmagan</span>';
}

function openCompanyReply(email){
  const notifs = (typeof _notifications !== 'undefined' && _notifications) ? _notifications : [];
  // Find most recent reply from this company email
  const replies = notifs.filter(function(n){ return n.fromEmail && n.fromEmail.toLowerCase()===email.toLowerCase(); });
  if(!replies.length) return;
  // Sort by date, open most recent
  replies.sort(function(a,b){
    const da = a.dateRaw ? new Date(a.dateRaw).getTime() : (a.ts||0);
    const db = b.dateRaw ? new Date(b.dateRaw).getTime() : (b.ts||0);
    return db - da;
  });
  openReplyDrawer(replies[0]);
}

if(typeof _investorAiTargetId === 'undefined') var _investorAiTargetId = null;
if(typeof _investorAiOpen === 'undefined') var _investorAiOpen = false;
if(typeof _investorAiWorkspaceEl === 'undefined') var _investorAiWorkspaceEl = null;
if(typeof _investorDetailId === 'undefined') var _investorDetailId = null;
if(typeof _investorGeoFilterStateCode === 'undefined') var _investorGeoFilterStateCode = '';
if(typeof _investorProductFilterId === 'undefined') var _investorProductFilterId = '';

var _investorSohaEditId = '';

function getInvestorCompanyLocation(rec){
  rec = rec || {};
  var rawLocation = String(rec.davlat || rec.country || '').trim();
  var city = String(rec.shahar || rec.city || '').trim();
  var region = String(rec.region || rec.province || rec.state || '').trim();
  if(!city && !region) return rawLocation;
  var parts = [];
  [city, region, rawLocation].forEach(function(part){
    if(!part) return;
    if(parts.indexOf(part) === -1) parts.push(part);
  });
  return parts.join(', ');
}

function getInvestorSohaValue(rec){
  return String((rec && (rec.mahsulotNomi || rec.soha)) || '').trim();
}

function getInvestorGeoCountrySource(rec){
  rec = rec || {};
  var locationText = getInvestorCompanyLocation(rec);
  if(locationText){
    var parts = String(locationText).split(',').map(function(part){
      return String(part || '').trim();
    }).filter(Boolean);
    if(parts.length){
      return parts[parts.length - 1];
    }
  }
  return String(rec.davlat || rec.country || '').trim();
}

var INVESTOR_GEO_HUBS = {
  UZB:{name:"O'zbekiston",lat:41.3111,lon:69.2797},
  CHN:{name:'China',lat:35.8617,lon:104.1954},
  USA:{name:'United States',lat:39.8283,lon:-98.5795},
  DEU:{name:'Germany',lat:51.1657,lon:10.4515},
  FRA:{name:'France',lat:46.2276,lon:2.2137},
  ITA:{name:'Italy',lat:41.8719,lon:12.5674},
  ESP:{name:'Spain',lat:40.4637,lon:-3.7492},
  GBR:{name:'United Kingdom',lat:55.3781,lon:-3.4360},
  NLD:{name:'Netherlands',lat:52.1326,lon:5.2913},
  BEL:{name:'Belgium',lat:50.5039,lon:4.4699},
  CHE:{name:'Switzerland',lat:46.8182,lon:8.2275},
  AUT:{name:'Austria',lat:47.5162,lon:14.5501},
  POL:{name:'Poland',lat:51.9194,lon:19.1451},
  TUR:{name:'Turkey',lat:38.9637,lon:35.2433},
  ARE:{name:'United Arab Emirates',lat:23.4241,lon:53.8478},
  SAU:{name:'Saudi Arabia',lat:23.8859,lon:45.0792},
  QAT:{name:'Qatar',lat:25.3548,lon:51.1839},
  JPN:{name:'Japan',lat:36.2048,lon:138.2529},
  KOR:{name:'South Korea',lat:35.9078,lon:127.7669},
  IND:{name:'India',lat:20.5937,lon:78.9629},
  CAN:{name:'Canada',lat:56.1304,lon:-106.3468},
  AUS:{name:'Australia',lat:-25.2744,lon:133.7751},
  BRA:{name:'Brazil',lat:-14.2350,lon:-51.9253},
  MEX:{name:'Mexico',lat:23.6345,lon:-102.5528},
  SGP:{name:'Singapore',lat:1.3521,lon:103.8198},
  RUS:{name:'Russia',lat:61.5240,lon:105.3188},
  KAZ:{name:'Kazakhstan',lat:48.0196,lon:66.9237},
  KGZ:{name:'Kyrgyzstan',lat:41.2044,lon:74.7661},
  TJK:{name:'Tajikistan',lat:38.8610,lon:71.2761},
  TKM:{name:'Turkmenistan',lat:38.9697,lon:59.5563},
  MNG:{name:'Mongolia',lat:46.8625,lon:103.8467},
  AZE:{name:'Azerbaijan',lat:40.1431,lon:47.5769},
  GEO:{name:'Georgia',lat:42.3154,lon:43.3569},
  ARM:{name:'Armenia',lat:40.0691,lon:45.0382},
  IRN:{name:'Iran',lat:32.4279,lon:53.6880},
  AFG:{name:'Afghanistan',lat:33.9391,lon:67.7100},
  PAK:{name:'Pakistan',lat:30.3753,lon:69.3451}
};

var INVESTOR_GEO_ISO2_BY_ISO3 = {
  UZB:'UZ', CHN:'CN', USA:'US', DEU:'DE', FRA:'FR', ITA:'IT', ESP:'ES', GBR:'GB', NLD:'NL', BEL:'BE',
  CHE:'CH', AUT:'AT', POL:'PL', TUR:'TR', ARE:'AE', SAU:'SA', QAT:'QA', JPN:'JP', KOR:'KR', IND:'IN',
  CAN:'CA', AUS:'AU', BRA:'BR', MEX:'MX', SGP:'SG', RUS:'RU', KAZ:'KZ', KGZ:'KG', TJK:'TJ', TKM:'TM',
  MNG:'MN', AZE:'AZ', GEO:'GE', ARM:'AM', IRN:'IR', AFG:'AF', PAK:'PK'
};

var INVESTOR_GEO_ISO2_ALIASES = {
  "o'zbekiston":'UZ', uzbekistan:'UZ',
  turkmenistan:'TM', turkmaniston:'TM',
  tajikistan:'TJ', tojikiston:'TJ',
  kyrgyzstan:'KG', "qirg'iziston":'KG', qirgiziston:'KG',
  kazakhstan:'KZ', "qozog'iston":'KZ', qozogiston:'KZ',
  mongolia:'MN', mongoliya:'MN',
  russia:'RU', rossiya:'RU',
  azerbaijan:'AZ', ozarbayjon:'AZ',
  georgia:'GE', gruziya:'GE',
  armenia:'AM', armaniston:'AM',
  iran:'IR', eron:'IR',
  afghanistan:'AF', "afg'oniston":'AF', afgoniston:'AF',
  pakistan:'PK', pokiston:'PK',
  china:'CN', xitoy:'CN',
  germany:'DE', germaniya:'DE',
  france:'FR', fransiya:'FR',
  italy:'IT', italiya:'IT',
  spain:'ES', ispaniya:'ES',
  "united kingdom":'GB', britain:'GB', england:'GB',
  netherlands:'NL', nederland:'NL',
  belgium:'BE', belgiya:'BE',
  switzerland:'CH', shveytsariya:'CH',
  austria:'AT', avstriya:'AT',
  poland:'PL', polsha:'PL',
  turkey:'TR', turkiye:'TR', turkiya:'TR',
  "united arab emirates":'AE', uae:'AE', baa:'AE',
  "saudi arabia":'SA',
  qatar:'QA',
  japan:'JP', yaponiya:'JP',
  "south korea":'KR', korea:'KR', koreya:'KR',
  india:'IN', hindiston:'IN',
  canada:'CA',
  australia:'AU', avstraliya:'AU',
  brazil:'BR', braziliya:'BR',
  mexico:'MX', meksika:'MX',
  singapore:'SG', singapur:'SG'
};

var INVESTOR_GEO_ALIASES = {
  "o'zbekiston":'UZB', uzbekistan:'UZB',
  turkmenistan:'TKM', turkmaniston:'TKM',
  tajikistan:'TJK', tojikiston:'TJK',
  kyrgyzstan:'KGZ', "qirg'iziston":'KGZ', "qirgiziston":'KGZ',
  kazakhstan:'KAZ', "qozog'iston":'KAZ', qozogiston:'KAZ',
  mongolia:'MNG', mongoliya:'MNG',
  russia:'RUS', rossiya:'RUS',
  azerbaijan:'AZE', ozarbayjon:'AZE',
  georgia:'GEO', gruziya:'GEO',
  armenia:'ARM', armaniston:'ARM',
  iran:'IRN', eron:'IRN',
  afghanistan:'AFG', "afg'oniston":'AFG', afgoniston:'AFG',
  pakistan:'PAK', pokiston:'PAK',
  china:'CHN', xitoy:'CHN',
  germany:'DEU', germaniya:'DEU',
  france:'FRA', fransiya:'FRA',
  italy:'ITA', italiya:'ITA',
  spain:'ESP', ispaniya:'ESP',
  "united kingdom":'GBR', britain:'GBR', england:'GBR',
  netherlands:'NLD', nederland:'NLD',
  belgium:'BEL', belgiya:'BEL',
  switzerland:'CHE', shveytsariya:'CHE',
  austria:'AUT', avstriya:'AUT',
  poland:'POL', polsha:'POL',
  turkey:'TUR', turkiye:'TUR', turkiya:'TUR',
  "united arab emirates":'ARE', uae:'ARE', bAA:'ARE', baa:'ARE',
  "saudi arabia":'SAU', arabiston:'SAU',
  qatar:'QAT',
  japan:'JPN', yaponiya:'JPN',
  "south korea":'KOR', korea:'KOR', koreya:'KOR',
  india:'IND', hindiston:'IND',
  canada:'CAN',
  australia:'AUS', avstraliya:'AUS',
  brazil:'BRA', braziliya:'BRA',
  mexico:'MEX', meksika:'MEX',
  singapore:'SGP', singapur:'SGP'
};

function normalizeInvestorGeoCountry(value){
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z]{2}\s+/,'')
    .replace(/\s+/g,' ');
}

function getInvestorGeoHub(rec){
  rec = rec || {};
  var iso3 = String(rec.iso3 || rec.countryIso3 || rec.country_iso3 || '').trim().toUpperCase();
  if(iso3 && INVESTOR_GEO_HUBS[iso3]){
    return Object.assign({ iso3: iso3, display: INVESTOR_GEO_HUBS[iso3].name }, INVESTOR_GEO_HUBS[iso3]);
  }
  var rawCountry = getInvestorGeoCountrySource(rec);
  var normalized = normalizeInvestorGeoCountry(rawCountry);
  var aliasIso = INVESTOR_GEO_ALIASES[normalized] || '';
  if(aliasIso && INVESTOR_GEO_HUBS[aliasIso]){
    return Object.assign({ iso3: aliasIso, display: rawCountry || INVESTOR_GEO_HUBS[aliasIso].name }, INVESTOR_GEO_HUBS[aliasIso]);
  }
  var matchedIso = Object.keys(INVESTOR_GEO_HUBS).find(function(key){
    return normalizeInvestorGeoCountry(INVESTOR_GEO_HUBS[key].name) === normalized;
  });
  if(matchedIso){
    return Object.assign({ iso3: matchedIso, display: rawCountry || INVESTOR_GEO_HUBS[matchedIso].name }, INVESTOR_GEO_HUBS[matchedIso]);
  }
  return null;
}

function getInvestorGeoStateCode(rec, stateSpecific){
  rec = rec || {};
  var rawIso2 = String(rec.iso2 || rec.countryIso2 || rec.country_iso2 || '').trim().toUpperCase();
  if(rawIso2 && stateSpecific && stateSpecific[rawIso2]) return rawIso2;
  var hub = getInvestorGeoHub(rec);
  if(hub && hub.iso3 && INVESTOR_GEO_ISO2_BY_ISO3[hub.iso3]) return INVESTOR_GEO_ISO2_BY_ISO3[hub.iso3];
  var rawCountry = getInvestorGeoCountrySource(rec);
  var normalized = normalizeInvestorGeoCountry(rawCountry);
  if(INVESTOR_GEO_ISO2_ALIASES[normalized]) return INVESTOR_GEO_ISO2_ALIASES[normalized];
  if(stateSpecific){
    var found = Object.keys(stateSpecific).find(function(code){
      return normalizeInvestorGeoCountry(stateSpecific[code].name) === normalized;
    });
    if(found) return found;
  }
  return '';
}

function projectInvestorGeoPoint(lat, lon, width, height){
  var safeLat = Math.max(-60, Math.min(82, Number(lat) || 0));
  var safeLon = Math.max(-180, Math.min(180, Number(lon) || 0));
  return {
    x: ((safeLon + 180) / 360) * width,
    y: ((90 - safeLat) / 180) * height
  };
}

function buildInvestorGeoMapSvg(markers){
  var width = 1000;
  var height = 480;
  var markerSvg = (markers || []).map(function(marker){
    var point = projectInvestorGeoPoint(marker.lat, marker.lon, width, height);
    var radius = Math.max(20, Math.min(42, 18 + (marker.count * 4)));
    var fill = marker.iso3 === 'UZB' ? '#16A34A' : (marker.count > 3 ? '#4F46E5' : '#3B82F6');
    var stroke = marker.iso3 === 'UZB' ? 'rgba(22,163,74,.18)' : 'rgba(59,130,246,.18)';
    var label = marker.count > 999 ? (Math.round(marker.count / 100) / 10) + 'k' : String(marker.count);
    return '<g>' +
      '<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="' + radius.toFixed(1) + '" fill="' + fill + '" fill-opacity="0.9" stroke="#ffffff" stroke-width="3"></circle>' +
      '<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="' + (radius + 8).toFixed(1) + '" fill="' + stroke + '"></circle>' +
      '<text x="' + point.x.toFixed(1) + '" y="' + (point.y - 2).toFixed(1) + '" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="' + (radius >= 30 ? 28 : 22) + '" font-weight="800" fill="#ffffff">' + label + '</text>' +
      '<text x="' + point.x.toFixed(1) + '" y="' + (point.y + 19).toFixed(1) + '" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#ffffff">' + escHtml(marker.labelShort) + '</text>' +
    '</g>';
  }).join('');
  return '' +
    '<svg viewBox="0 0 ' + width + ' ' + height + '" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="Investorlar geografiyasi">' +
      '<defs>' +
        '<linearGradient id="invGeoBg" x1="0" x2="0" y1="0" y2="1">' +
          '<stop offset="0%" stop-color="#eef6ff"></stop>' +
          '<stop offset="100%" stop-color="#d9ecff"></stop>' +
        '</linearGradient>' +
      '</defs>' +
      '<rect width="' + width + '" height="' + height + '" rx="26" fill="url(#invGeoBg)"></rect>' +
      '<g fill="#9fc5ff" fill-opacity="0.95" stroke="#ffffff" stroke-width="3">' +
        '<path d="M57 143 L105 100 L173 85 L236 109 L265 151 L257 203 L210 222 L166 208 L120 177 L81 176 L57 143 Z"></path>' +
        '<path d="M226 252 L281 279 L307 340 L287 419 L252 461 L220 422 L205 356 L212 296 L226 252 Z"></path>' +
        '<path d="M454 108 L493 90 L545 97 L568 128 L549 154 L503 161 L469 145 L454 108 Z"></path>' +
        '<path d="M487 170 L525 184 L548 227 L535 289 L506 349 L472 322 L461 257 L468 203 L487 170 Z"></path>' +
        '<path d="M533 112 L621 78 L742 90 L845 117 L918 152 L930 207 L897 235 L829 216 L771 229 L724 206 L662 208 L611 193 L579 168 L533 112 Z"></path>' +
        '<path d="M783 299 L847 311 L889 340 L910 388 L870 410 L816 401 L779 368 L783 299 Z"></path>' +
      '</g>' +
      '<g stroke="rgba(255,255,255,.55)" stroke-width="1">' +
        '<line x1="0" y1="120" x2="' + width + '" y2="120"></line>' +
        '<line x1="0" y1="240" x2="' + width + '" y2="240"></line>' +
        '<line x1="0" y1="360" x2="' + width + '" y2="360"></line>' +
        '<line x1="166" y1="0" x2="166" y2="' + height + '"></line>' +
        '<line x1="333" y1="0" x2="333" y2="' + height + '"></line>' +
        '<line x1="500" y1="0" x2="500" y2="' + height + '"></line>' +
        '<line x1="666" y1="0" x2="666" y2="' + height + '"></line>' +
        '<line x1="833" y1="0" x2="833" y2="' + height + '"></line>' +
      '</g>' +
      markerSvg +
    '</svg>';
}

function renderInvestorGeoStatePanel(stateCode){
  var panel = document.getElementById('investorGeoStatePanel');
  var statsMap = window._investorGeoStateStats || {};
  if(!panel) return;
  var info = statsMap[String(stateCode || '').toUpperCase()] || null;
  if(!info){
    panel.style.display = 'none';
    panel.innerHTML = '';
    return;
  }
  var companies = Array.isArray(info.companies) ? info.companies : [];
  panel.style.display = 'block';
  panel.innerHTML =
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap">' +
      '<div>' +
        '<div style="font-family:Sora,sans-serif;font-size:1rem;font-weight:800;color:var(--text)">' + escHtml(info.name || info.code || 'Davlat') + '</div>' +
        '<div style="font-size:.78rem;color:var(--text3);margin-top:4px">' + (Number(info.count) || 0) + ' ta kompaniya topilgan</div>' +
      '</div>' +
      '<button class="btn btn-ghost btn-sm" type="button" onclick="document.getElementById(\'investorGeoStatePanel\').style.display=\'none\'">Yopish</button>' +
    '</div>' +
    (companies.length ? '<div style="display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.9rem">' + companies.slice(0,18).map(function(name){ return '<span style="display:inline-flex;align-items:center;padding:.42rem .7rem;border-radius:999px;background:#EEF4FF;border:1px solid #D6E4FF;color:#1E3A8A;font-size:.72rem;font-weight:700">' + escHtml(name) + '</span>'; }).join('') + '</div>' : '<div style="margin-top:.85rem;font-size:.8rem;color:var(--text3)">Bu davlat uchun hozircha kompaniya yozuvi yo\'q.</div>') +
    (companies.length > 18 ? '<div style="margin-top:.7rem;font-size:.72rem;color:var(--text3)">Yana +' + (companies.length - 18) + ' ta kompaniya mavjud</div>' : '');
}
window.onInvestorGeoCountryClick = function(stateCode){
  _investorGeoFilterStateCode = String(stateCode || '').toUpperCase();
  renderInvestorGeoStatePanel(stateCode);
  renderInvestorCompanies();
  showIcTableCard();
  // Show embassy buttons
  if(stateCode) updateEmbassyButtons(String(stateCode).toUpperCase());
};

function clearInvestorGeoFilter(){
  _investorGeoFilterStateCode = '';
  _selectedEmbassyCountry = '';
  renderInvestorGeoStatePanel('');
  renderInvestorCompanies();
  var card = document.getElementById('icTableCard');
  if(card) card.style.display = 'none';
  // Hide embassy buttons
  var b1=document.getElementById('btnEmbassyUzb');if(b1)b1.style.display='none';
  var b2=document.getElementById('btnEmbassyForeign');if(b2)b2.style.display='none';
}
window.clearInvestorGeoFilter = clearInvestorGeoFilter;

/* Embassy moved to assets/js/embassy.js */

function getInvestorGeoTooltipHtml(info){
  if(!info) return '';
  return '<div style="font-size:.8rem;font-weight:800">' + escHtml(info.name || info.code || 'Davlat') + '</div>' +
    '<div style="font-size:.7rem;font-weight:600;opacity:.92;margin-top:2px">' + (Number(info.count) || 0) + ' ta kompaniya</div>';
}

function extractInvestorGeoStateCodeFromElement(el, stateSpecific){
  if(!el || !stateSpecific) return '';
  var raw = [
    el.id || '',
    el.getAttribute ? (el.getAttribute('data-id') || '') : '',
    el.getAttribute ? (el.getAttribute('name') || '') : '',
    el.getAttribute ? (el.getAttribute('class') || '') : ''
  ].join(' ');
  var upper = raw.toUpperCase();
  var tokens = upper.split(/[^A-Z0-9]+/).filter(Boolean);
  for(var i=0;i<tokens.length;i++){
    var token = tokens[i];
    if(token.length === 2 && stateSpecific[token]) return token;
  }
  var match = upper.match(/(?:STATE|COUNTRY|AREA|REGION)[-_]?([A-Z]{2})/);
  if(match && stateSpecific[match[1]]) return match[1];
  return '';
}

function attachInvestorGeoInteractions(stateSpecific, stateStats){
  var mapEl = document.getElementById('map');
  var tooltipEl = document.getElementById('investorGeoTooltip');
  if(!mapEl || !tooltipEl) return;
  var targets = Array.from(mapEl.querySelectorAll('path, polygon, area, [id], [class]'));
  targets.forEach(function(node){
    var code = extractInvestorGeoStateCodeFromElement(node, stateSpecific);
    if(!code) return;
    if(node.dataset && node.dataset.investorGeoBound === '1') return;
    if(node.dataset) node.dataset.investorGeoBound = '1';
    node.style.cursor = 'pointer';
    node.addEventListener('mouseenter', function(ev){
      var info = (stateStats && stateStats[code]) || {
        code: code,
        name: (stateSpecific[code] && stateSpecific[code].name) || code,
        count: 0
      };
      tooltipEl.innerHTML = getInvestorGeoTooltipHtml(info);
      tooltipEl.style.display = 'block';
      var rect = mapEl.getBoundingClientRect();
      var x = (ev.clientX || rect.left) - rect.left;
      var y = (ev.clientY || rect.top) - rect.top;
      tooltipEl.style.left = x + 'px';
      tooltipEl.style.top = y + 'px';
    });
    node.addEventListener('mousemove', function(ev){
      if(tooltipEl.style.display !== 'block') return;
      var rect = mapEl.getBoundingClientRect();
      tooltipEl.style.left = ((ev.clientX || rect.left) - rect.left) + 'px';
      tooltipEl.style.top = ((ev.clientY || rect.top) - rect.top) + 'px';
    });
    node.addEventListener('mouseleave', function(){
      tooltipEl.style.display = 'none';
    });
    node.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      window.onInvestorGeoCountryClick(code);
    });
  });
}

function getInvestorGeoLocationAnchors(){
  var mapEl = document.getElementById('map');
  if(!mapEl) return [];
  return Array.from(mapEl.querySelectorAll('svg rect, svg circle')).filter(function(node){
    var rect = node.getBoundingClientRect();
    if(!rect || rect.width < 8 || rect.height < 8 || rect.width > 48 || rect.height > 48) return false;
    var attrStyle = String(node.getAttribute('style') || '');
    var fillAttr = String(node.getAttribute('fill') || '');
    var strokeAttr = String(node.getAttribute('stroke') || '');
    var computed = window.getComputedStyle ? window.getComputedStyle(node) : null;
    var colorBlob = [attrStyle, fillAttr, strokeAttr, computed && computed.fill, computed && computed.stroke].join(' ').toLowerCase();
    return /ff0067|255,\s*0,\s*103|ff5aa5|255,\s*90,\s*165/.test(colorBlob);
  });
}

function getInvestorGeoMainSvg(){
  var mapEl = document.getElementById('map');
  if(!mapEl) return null;
  var svgs = Array.from(mapEl.querySelectorAll('svg'));
  if(!svgs.length) return null;
  svgs.sort(function(a, b){
    var ap = a.querySelectorAll('path').length;
    var bp = b.querySelectorAll('path').length;
    if(bp !== ap) return bp - ap;
    var ar = a.getBoundingClientRect();
    var br = b.getBoundingClientRect();
    return (br.width * br.height) - (ar.width * ar.height);
  });
  return svgs[0] || null;
}

function getInvestorGeoStateLayer(svg){
  if(!svg) return null;
  var groups = Array.from(svg.querySelectorAll('g'));
  if(!groups.length) return svg;
  groups.sort(function(a, b){
    var ap = a.querySelectorAll('path').length;
    var bp = b.querySelectorAll('path').length;
    if(bp !== ap) return bp - ap;
    var ach = a.children ? a.children.length : 0;
    var bch = b.children ? b.children.length : 0;
    return bch - ach;
  });
  return groups[0] || svg;
}

function getInvestorGeoStateElements(svg, stateSpecific){
  if(!svg || !stateSpecific) return {};
  var map = {};
  Array.from(svg.querySelectorAll('path, polygon, rect')).forEach(function(node){
    var code = extractInvestorGeoStateCodeFromElement(node, stateSpecific);
    if(!code || map[code]) return;
    try{
      var box = typeof node.getBBox === 'function' ? node.getBBox() : null;
      if(!box || !box.width || !box.height) return;
      map[code] = node;
    }catch(_err){}
  });
  return map;
}

function getInvestorGeoLocationRect(locationObj, mapRect){
  if(!locationObj) return null;
  try{
    if(locationObj.node && typeof locationObj.node.getBoundingClientRect === 'function'){
      return locationObj.node.getBoundingClientRect();
    }
    if(locationObj[0] && locationObj[0].node && typeof locationObj[0].node.getBoundingClientRect === 'function'){
      return locationObj[0].node.getBoundingClientRect();
    }
    if(typeof locationObj.getBBox === 'function'){
      var box = locationObj.getBBox();
      if(box && box.width && box.height){
        return {
          left: mapRect.left + box.x,
          top: mapRect.top + box.y,
          width: box.width,
          height: box.height
        };
      }
    }
    if(locationObj.sm && typeof locationObj.sm.x === 'number' && typeof locationObj.sm.y === 'number'){
      var size = Number(locationObj.sm.size) || 24;
      return {
        left: mapRect.left + locationObj.sm.x - (size / 2),
        top: mapRect.top + locationObj.sm.y - (size / 2),
        width: size,
        height: size
      };
    }
  }catch(_err){}
  return null;
}

var _geoSvgBubbleTimer = null;
function renderInvestorGeoSvgBubbles(markers, attempt){
  if(!attempt && _geoSvgBubbleTimer) clearTimeout(_geoSvgBubbleTimer);
  if(!attempt){ _geoSvgBubbleTimer = setTimeout(function(){ _renderGeoSvgBubblesNow(markers, 0); }, 80); return; }
  _renderGeoSvgBubblesNow(markers, attempt);
}
function _renderGeoSvgBubblesNow(markers, attempt){
  var mapEl = document.getElementById('map');
  if(!mapEl) return;
  var overlayEl = document.getElementById('investorGeoOverlay');
  if(!overlayEl) return;
  var tooltipEl = document.getElementById('investorGeoTooltip');
  overlayEl.innerHTML = '';
  var instance = window._investorGeoMapInstance || window.simplemaps_worldmap;
  var locations = instance && instance.locations ? instance.locations : null;
  var keys = locations ? Object.keys(locations).sort(function(a, b){ return Number(a) - Number(b); }) : [];
  if(!keys.length){
    if((Number(attempt) || 0) < 4){
      setTimeout(function(){ _renderGeoSvgBubblesNow(markers, (Number(attempt) || 0) + 1); }, 200);
    }
    return;
  }
  var mapRect = mapEl.getBoundingClientRect();
  var rendered = 0;
  keys.forEach(function(key, idx){
    var marker = markers[idx];
    if(!marker) return;
    var rect = getInvestorGeoLocationRect(locations[key], mapRect);
    if(!rect || !rect.width || !rect.height) return;
    var badge = document.createElement('div');
    badge.className = 'investor-geo-badge';
    badge.textContent = String(marker.count);
    badge.style.position = 'absolute';
    badge.style.left = ((rect.left - mapRect.left) + (rect.width / 2)) + 'px';
    badge.style.top = ((rect.top - mapRect.top) + (rect.height / 2)) + 'px';
    badge.style.transform = 'translate(-50%, -50%)';
    var sz = marker.count >= 50 ? 60 : marker.count >= 20 ? 48 : marker.count >= 10 ? 42 : marker.count >= 5 ? 41 : 38;
    badge.style.width = sz + 'px';
    badge.style.height = sz + 'px';
    badge.style.borderRadius = '9999px';
    badge.style.background = marker.count >= 10 ? '#3C82F6' : '#4A51DD';
    badge.style.border = '2px solid #fff';
    badge.style.boxShadow = '0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06)';
    badge.style.color = '#fff';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.fontFamily = 'Inter, Arial, sans-serif';
    badge.style.fontWeight = '700';
    badge.style.fontSize = (marker.count >= 50 ? 16 : marker.count >= 20 ? 14 : 12) + 'px';
    badge.style.pointerEvents = 'auto';
    badge.style.cursor = 'pointer';
    badge.title = marker.name + ' — ' + marker.count + ' ta kompaniya';
    if(tooltipEl){
      badge.addEventListener('mouseenter', function(ev){
        tooltipEl.innerHTML = getInvestorGeoTooltipHtml({
          code: marker.code,
          name: marker.name,
          count: marker.count
        });
        tooltipEl.style.display = 'block';
        var rectLocal = mapEl.getBoundingClientRect();
        tooltipEl.style.left = ((ev.clientX || rectLocal.left) - rectLocal.left) + 'px';
        tooltipEl.style.top = ((ev.clientY || rectLocal.top) - rectLocal.top) + 'px';
      });
      badge.addEventListener('mousemove', function(ev){
        if(tooltipEl.style.display !== 'block') return;
        var rectLocal = mapEl.getBoundingClientRect();
        tooltipEl.style.left = ((ev.clientX || rectLocal.left) - rectLocal.left) + 'px';
        tooltipEl.style.top = ((ev.clientY || rectLocal.top) - rectLocal.top) + 'px';
      });
      badge.addEventListener('mouseleave', function(){
        tooltipEl.style.display = 'none';
      });
    }
    badge.addEventListener('click', function(){
      if(!marker.code) return;
      if(typeof window.onInvestorGeoCountryClick === 'function'){
        window.onInvestorGeoCountryClick(marker.code);
      } else {
        renderInvestorGeoStatePanel(marker.code);
      }
    });
    overlayEl.appendChild(badge);
    rendered += 1;
  });
  if(!rendered && (Number(attempt) || 0) < 8){
    setTimeout(function(){ renderInvestorGeoSvgBubbles(markers, (Number(attempt) || 0) + 1); }, 120);
  }
}

function renderInvestorGeoCard(companies){
  var mapEl = document.getElementById('investorGeoJvMap');
  var metaEl = document.getElementById('investorGeoMeta');
  if(!mapEl || !metaEl) return;
  companies = Array.isArray(companies) ? companies : [];

  if(!companies.length){
    metaEl.textContent = 'Investorlar bazasida davlat ma\'lumoti topilmadi';
    mapEl.innerHTML = '<div style="height:480px;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:.92rem;font-weight:700">Kompaniya davlatlari saqlangach, xarita shu yerda ko\'rinadi</div>';
    return;
  }

  if(typeof jsVectorMap === 'undefined'){
    mapEl.innerHTML = '<div style="height:480px;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:.92rem;font-weight:700">jsVectorMap kutubxonasi yuklanmadi</div>';
    return;
  }

  // Defer if container not visible yet (hidden tab)
  if(!mapEl.offsetWidth || !mapEl.offsetHeight){
    window._pendingInvestorGeoCompanies = companies.slice();
    return;
  }

  // Unique kompaniyalar — KPI bilan mos (parent + child duplikatlar olib tashlanadi)
  var stateStats = {};
  var seenGroupsGlobal = {};
  var uniqueCompanyCount = 0;

  // ═══ AGAR markazlashgan _icStats mavjud bo'lsa — to'g'ridan-to'g'ri shu yerdan o'qiydi ═══
  // (xarita = jadval bilan AYNAN mos: 368 = 368)
  if(window._icStats && window._icStats.byCountry){
    Object.keys(window._icStats.byCountry).forEach(function(code){
      var src = window._icStats.byCountry[code];
      stateStats[code] = {
        code: code,
        name: src.name || code,
        count: src.count,
        companies: (src.companies || []).slice(),
        lat: src.lat,
        lon: src.lon,
        _seenGroups: {}
      };
    });
    uniqueCompanyCount = window._icStats.jami;
  } else {
    // Fallback (eski mantiq) — _icStats yo'q bo'lsa ishlatamiz
    var groupHasExporter = Object.create(null);
    companies.forEach(function(rec){
      var groupKey = (typeof getInvestorCompanyGroupKey === 'function')
        ? getInvestorCompanyGroupKey(rec) : String(rec.kompaniya || '').toLowerCase();
      if(!groupKey) return;
      var fm = String(rec.finderMode || rec.role || '').toLowerCase();
      var isExp = (fm === 'exporters' || fm === 'exporter');
      var isImp = (fm === 'importers' || fm === 'importer');
      if(isExp){ groupHasExporter[groupKey] = true; }
      else if(!isImp){ groupHasExporter[groupKey] = groupHasExporter[groupKey] || true; }
      if(Array.isArray(rec._partners) && rec._partners.some(function(p){ return String(p.role||'').toLowerCase() === 'importer'; })){
        groupHasExporter[groupKey] = true;
      }
    });
    companies.forEach(function(rec){
      var code = getInvestorGeoStateCode(rec, {});
      if(!code) return;
      var groupKey = (typeof getInvestorCompanyGroupKey === 'function')
        ? getInvestorCompanyGroupKey(rec)
        : String(rec.kompaniya || rec.id || '').toLowerCase();
      if(!groupHasExporter[groupKey]) return;
      if(!stateStats[code]){
        stateStats[code] = { code: code, name: String(getInvestorGeoCountrySource(rec) || code), count: 0, companies: [], lat: null, lon: null, _seenGroups: {} };
      }
      var st = stateStats[code];
      if(!st._seenGroups[groupKey]){
        st._seenGroups[groupKey] = true;
        st.count += 1;
        if(rec.kompaniya) st.companies.push(String(rec.kompaniya));
      }
      if(!seenGroupsGlobal[groupKey]){
        seenGroupsGlobal[groupKey] = true;
        uniqueCompanyCount += 1;
      }
      if(st.lat == null || st.lon == null){
        var geo = getInvestorGeoHub(rec);
        if(geo){ st.lat = geo.lat; st.lon = geo.lon; }
      }
    });
  }
  window._investorGeoStateStats = stateStats;

  var regionColors = {};
  var jvMarkers = [];
  Object.keys(stateStats).forEach(function(code){
    var item = stateStats[code];
    if(item.count > 0){
      regionColors[code] = 0;
      if(typeof item.lat === 'number' && typeof item.lon === 'number'){
        jvMarkers.push({
          name: item.name + ' — ' + item.count + ' ta kompaniya',
          coords: [item.lat, item.lon]
        });
      }
    }
  });

  var countryCount = Object.keys(stateStats).filter(function(c){ return stateStats[c].count > 0; }).length;
  metaEl.textContent = uniqueCompanyCount + ' ta kompaniya \u00b7 ' + countryCount + ' ta davlat';

  mapEl.innerHTML = '';
  var bubblesEl = document.getElementById('investorGeoBubbles');
  if(bubblesEl) bubblesEl.innerHTML = '';
  if(window._investorGeoJvInstance){
    try{ window._investorGeoJvInstance.destroy(); }catch(e){}
    window._investorGeoJvInstance = null;
  }

  // Build markers with count data
  var markerData = [];
  Object.keys(stateStats).forEach(function(code){
    var item = stateStats[code];
    if(item.count > 0 && typeof item.lat === 'number' && typeof item.lon === 'number'){
      markerData.push({ code: code, name: item.name, count: item.count, coords: [item.lat, item.lon] });
    }
  });

  try{
    window._investorGeoJvInstance = new jsVectorMap({
      selector: '#investorGeoJvMap',
      map: 'world',
      zoomButtons: true,
      zoomOnScroll: true,
      draggable: true,
      regionStyle: {
        initial: { fill: '#80B9FF', 'fill-opacity': 1, stroke: '#fff', 'stroke-width': 0.5 },
        hover: { 'fill-opacity': 0.85, fill: '#465fff' }
      },
      series: { regions: [{ attribute: 'fill', scale: ['#465fff'], values: regionColors }] },
      markers: markerData.map(function(m){ return { name: m.name + ' — ' + m.count + ' ta', coords: m.coords }; }),
      markerStyle: {
        initial: { fill: 'rgba(70,95,255,.15)', stroke: 'transparent', r: 4, opacity: 0 },
        hover: { fill: 'rgba(70,95,255,.3)', r: 5, opacity: 0.5 }
      },
      showTooltip: true,
      onRegionClick: function(event, code){
        _showInvestorGeoCountryPanel(code, companies);
      }
    });
  }catch(e){ console.warn('investorGeoJvMap error:', e); }

  // Render HTML count bubbles over markers (with retry for timing)
  window._investorGeoMarkerData = markerData;
  _renderInvestorGeoBubbles();
  setTimeout(_renderInvestorGeoBubbles, 300);
  setTimeout(_renderInvestorGeoBubbles, 800);
  setTimeout(_renderInvestorGeoBubbles, 1500);

  // Re-render bubbles on zoom/pan
  if(window._investorGeoJvInstance){
    var mapInstance = window._investorGeoJvInstance;
    var origZoomIn = mapInstance.zoomIn ? mapInstance.zoomIn.bind(mapInstance) : null;
    var origZoomOut = mapInstance.zoomOut ? mapInstance.zoomOut.bind(mapInstance) : null;
    // Observe SVG transform changes via MutationObserver
    var svgG = mapEl.querySelector('svg g[transform]');
    if(svgG){
      var obs = new MutationObserver(function(){ _renderInvestorGeoBubbles(); });
      obs.observe(svgG, { attributes: true, attributeFilter: ['transform'] });
      window._investorGeoObserver = obs;
    }
  }
}

function _renderInvestorGeoBubbles(){
  var bubblesEl = document.getElementById('investorGeoBubbles');
  var mapEl = document.getElementById('investorGeoJvMap');
  if(!bubblesEl || !mapEl || !window._investorGeoMarkerData) return;
  var markers = window._investorGeoMarkerData;
  if(!markers.length){ bubblesEl.innerHTML=''; return; }
  var wrapRect = bubblesEl.getBoundingClientRect();
  if(!wrapRect.width || !wrapRect.height) return;

  // Try method 1: use .jvm-marker elements
  var markerEls = mapEl.querySelectorAll('.jvm-marker');
  var html = '';
  if(markerEls.length >= markers.length){
    markers.forEach(function(m, i){
      var el = markerEls[i];
      if(el){
        var r = el.getBoundingClientRect();
        var cx = r.left + r.width / 2 - wrapRect.left;
        var cy = r.top + r.height / 2 - wrapRect.top;
        var size = Math.max(28, Math.min(48, 24 + m.count * 1.5));
        html += '<div class="investor-geo-bubble" onclick="_showInvestorGeoCountryPanel(\'' + (m.code || '') + '\')" style="left:' + cx + 'px;top:' + cy + 'px;width:' + size + 'px;height:' + size + 'px;font-size:' + (m.count > 99 ? '.6' : '.72') + 'rem" title="' + tgEscapeAttr(m.name + ': ' + m.count + ' ta kompaniya') + '">' + m.count + '</div>';
      }
    });
  } else {
    // Fallback method 2: project lat/lon to container coordinates using Mercator
    var w = wrapRect.width;
    var h = wrapRect.height;
    markers.forEach(function(m){
      if(!m.coords || m.coords.length < 2) return;
      var lat = m.coords[0], lon = m.coords[1];
      var x = ((lon + 180) / 360) * w;
      var latRad = lat * Math.PI / 180;
      var mercN = Math.log(Math.tan(Math.PI/4 + latRad/2));
      var y = (h/2) - (w * mercN / (2 * Math.PI));
      // Adjust for typical map padding
      x = x * 0.97 + w * 0.015;
      y = y * 0.85 + h * 0.06;
      var size = Math.max(28, Math.min(48, 24 + m.count * 1.5));
      html += '<div class="investor-geo-bubble" onclick="_showInvestorGeoCountryPanel(\'' + (m.code || '') + '\')" style="left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + size + 'px;font-size:' + (m.count > 99 ? '.6' : '.72') + 'rem" title="' + tgEscapeAttr(m.name + ': ' + m.count + ' ta kompaniya') + '">' + m.count + '</div>';
    });
  }
  bubblesEl.innerHTML = html;
}

function _showInvestorGeoCountryPanel(code){
  code = String(code || '').toUpperCase();
  var stats = window._investorGeoStateStats || {};
  var info = stats[code];
  if(!info || !info.count) return;
  _investorGeoFilterStateCode = code;
  renderInvestorGeoStatePanel(code);
  renderInvestorCompanies();
  showIcTableCard();
  // Show embassy buttons
  if(typeof updateEmbassyButtons === 'function') updateEmbassyButtons(code);
}

function renderPersonNameWithPhoto(name, photoUrl, extraHtml, size){
  var cleanName = String(name || '').trim();
  var cleanPhoto = String(photoUrl || '').trim();
  var avatarSize = Number(size || 28) || 28;
  var html = '<div style="display:flex;align-items:flex-start;gap:8px">';
  if(cleanPhoto){
    html += '<img src="'+tgEscapeAttr(cleanPhoto)+'" alt="'+tgEscapeAttr(cleanName || 'Contact')+'" style="width:'+avatarSize+'px;height:'+avatarSize+'px;border-radius:999px;object-fit:cover;flex:0 0 auto;border:1px solid rgba(67,97,238,.18);box-shadow:0 2px 6px rgba(15,23,42,.12)">';
  }
  html += '<div style="min-width:0">';
  html += cleanName ? escHtml(cleanName) : '<span style="color:var(--text3)">—</span>';
  if(extraHtml) html += extraHtml;
  html += '</div></div>';
  return html;
}

function finderContactHasEmail(contact){
  return !!String(contact && contact.email || '').trim();
}

function finderContactHasPhone(contact){
  return !!String(contact && contact.telefon || '').trim();
}

function finderContactHasWebsite(contact){
  return !!String(contact && contact.website || '').trim();
}

function finderHasMinimumContactSet(contacts){
  var list = Array.isArray(contacts) ? contacts.filter(finderContactIsQualified).slice(0,2) : [];
  return list.length >= 2 && list.some(finderContactHasPhone);
}

function finderContactIsQualified(contact){
  if(!contact) return false;
  var name = String(contact.name || contact.ism || '').trim();
  return !!(name || finderContactHasEmail(contact) || finderContactHasPhone(contact) || finderContactHasWebsite(contact));
}

function getFinderQualifiedContacts(item){
  return getFinderDisplayContacts(item).filter(finderContactIsQualified);
}

function getFinderRenderableContacts(item){
  var source = String((item && (item.manba || item.source)) || '').toLowerCase();
  var displayContacts = getFinderDisplayContacts(item);
  var qualified = displayContacts.filter(finderContactIsQualified);
  if(finderHasMinimumContactSet(qualified)) return qualified;
  if(qualified.length >= 1) return qualified;
  if(source.indexOf('tradeatlas') !== -1){
    // TradeAtlas firma — kontakt yo'q bo'lsa ham placeholder bilan ko'rsatamiz
    if(displayContacts.length) return [displayContacts[0]];
    if(item && item.kompaniya){
      return [{ name:'', ism:'', email:item.email||'', telefon:item.telefon||'', website:item.website||'', _placeholder:true }];
    }
  }
  if(source.indexOf('apollo top') !== -1 && item && item.kompaniya){
    return [{ name:'', ism:'', email:'', telefon:'', website:item.website||'', _placeholder:true }];
  }
  return [];
}

function getFinderVisibleContacts(item){
  return getFinderRenderableContacts(item);
}

function finderResultIsRenderable(item){
  if(item && item.manba === 'Apollo Top 100') return !!(item.kompaniya);
  // TradeAtlas firmlarini kontakti bo'lmasa ham ko'rsatamiz (faqat kompaniya nomi yetarli)
  var source = String((item && (item.manba || item.source)) || '').toLowerCase();
  if(source.indexOf('tradeatlas') !== -1) return !!(item && String(item.kompaniya || '').trim());
  return getFinderVisibleContacts(item).length > 0;
}

function renderFinderContactCard(contact){
  if(!contact){
    return '<span style="color:var(--text3)">—</span>';
  }
  var extras = '<div style="font-size:.62rem;color:var(--text3)">'+escHtml(contact.title||'—')+'</div>';
  extras += finderContactHasEmail(contact)
    ? '<div style="font-size:.6rem;color:#0ea5e9;margin-top:2px">'+escHtml(contact.email)+'</div>'
    : '<div style="font-size:.58rem;color:var(--text3)">— Email yo\'q</div>';
  if(finderContactHasPhone(contact)){
    extras += '<div style="font-size:.58rem;color:#059669;margin-top:2px">'+escHtml(contact.telefon)+'</div>';
  }
  return renderPersonNameWithPhoto(contact.name, contact.photoUrl, extras, 28);
}

function renderFinderContactsHtml(contacts){
  var list = Array.isArray(contacts) ? contacts.filter(finderContactIsQualified) : [];
  // Email alone is enough — don't require phone or 2 contacts
  if(!list.length){
    return '<span style="color:var(--text3)">—</span>';
  }
  return '<div style="display:flex;flex-direction:column;gap:8px">' + list.map(function(contact){
    return renderFinderContactCard(contact);
  }).join('') + '</div>';
}

function getFinderDisplayContacts(item){
  if(item && Array.isArray(item.contacts) && item.contacts.length){
    return item.contacts;
  }
  if(!item) return [];
  var fallback = {
    name: String(item.rahbar || '').trim(),
    title: String(item.lavozim || '').trim(),
    email: String(item.email || '').trim(),
    telefon: String(item.telefon || '').trim(),
    photoUrl: String(item.photoUrl || item.photo_url || '').trim(),
    linkedin: String(item.linkedin || '').trim()
  };
  if(!fallback.name && !fallback.email && !fallback.telefon && !fallback.title){
    return [];
  }
  return [fallback];
}

function getCurrentFinderProductMeta(){
  var finderSel = document.getElementById('finder-product-select');
  var currentProd = (DB.products||[]).find(function(p){
    return String(p.id) === String((finderSel||{}).value || '');
  });
  return {
    item: currentProd || null,
    productId: currentProd ? String(currentProd.id || '') : '',
    productHs: currentProd ? String(currentProd.hs_code || '').replace(/\D/g,'').slice(0,6) : '',
    productLabel: currentProd ? formatBilingualProductName(currentProd) : ''
  };
}

function findFinderContactInvestorRecord(item, contact){
  var companyKey = String((item && item.kompaniya) || '').trim().toLowerCase();
  if(!companyKey) return null;
  var emailKey = String((contact && contact.email) || '').trim().toLowerCase();
  var phoneKey = String((contact && contact.telefon) || '').trim();
  var nameKey = String((contact && contact.name) || '').trim().toLowerCase();
  var companyRecords = (DB.investorCompanies || []).filter(function(rec){
    if(String(rec.kompaniya || '').trim().toLowerCase() !== companyKey) return false;
    return true;
  });
  if(emailKey){
    var byEmail = companyRecords.find(function(rec){
      return String(rec.email || '').trim().toLowerCase() === emailKey;
    });
    if(byEmail) return byEmail;
  }
  if(nameKey){
    var byName = companyRecords.find(function(rec){
      return String(rec.rahbar || '').trim().toLowerCase() === nameKey;
    });
    if(byName) return byName;
  }
  // NOTE:
  // Bir kompaniyada bir xil umumiy telefon (switchboard) bir nechta xodimda qayta
  // ishlatilishi mumkin. Shuning uchun telefon bo'yicha match faqat email va ism
  // bo'lmaganda (zaif fallback) ishlatiladi.
  if(phoneKey && !emailKey && !nameKey){
    var byPhone = companyRecords.find(function(rec){
      if(String(rec.telefon || rec.tel || '').trim() !== phoneKey) return false;
      var recEmail = String(rec.email || '').trim();
      var recName = String(rec.rahbar || '').trim();
      return !recEmail && !recName;
    });
    if(byPhone) return byPhone;
  }
  return null;
}

function upsertFinderContactInvestorRecord(record, item, contact, meta){
  if(!DB.investorCompanies) DB.investorCompanies = [];
  var rec = record || { id: nextId(DB.investorCompanies) };
  var created = !record;
  var today = new Date().toISOString().slice(0,10);
  rec.kompaniya = item.kompaniya || rec.kompaniya || '';
  rec.davlat = item.davlat || rec.davlat || '';
  rec.shahar = item.shahar || rec.shahar || '';
  rec.website = item.website || rec.website || '';
  rec.soha = item.mahsulotNomi || (meta && meta.productLabel) || item.soha || rec.soha || '';
  rec.mahsulotNomi = item.mahsulotNomi || (meta && meta.productLabel) || rec.mahsulotNomi || rec.soha || '';
  rec.productId = item.productId || (meta && meta.productId) || rec.productId || '';
  rec.mahsulotProductId = item.mahsulotProductId || rec.mahsulotProductId || rec.productId || (meta && meta.productId) || '';
  rec.mahsulotHs = item.mahsulotHs || item.productHs || item.hsCode || (meta && meta.productHs) || rec.mahsulotHs || '';
  rec.productHs = rec.mahsulotHs || rec.productHs || (meta && meta.productHs) || '';
  rec.holat = rec.holat || 'Yangi';
  rec.sana = rec.sana || today;
  rec.emailSent = !!rec.emailSent;
  rec.manba = item.manba || rec.manba || 'Apollo';
  rec.score = item.score || rec.score || 0;
  rec.xodimlar = item.xodimlar || item.employees || rec.xodimlar || '';
  rec.daromad = item.daromad || item.revenue || rec.daromad || '';
  rec.tpilyil = item.tpilyil || item.foundedYear || item.founded_year || rec.tpilyil || '';
  rec.rahbar = contact.name || rec.rahbar || '';
  rec.lavozim = contact.title || rec.lavozim || '';
  rec.email = contact.email || rec.email || '';
  rec.telefon = contact.telefon || rec.telefon || rec.tel || '';
  rec.tel = rec.telefon || rec.tel || '';
  rec.photoUrl = contact.photoUrl || rec.photoUrl || rec.photo_url || '';
  rec.photo_url = rec.photoUrl || rec.photo_url || '';
  rec.linkedin = contact.linkedin || rec.linkedin || '';
  if(created){
    DB.investorCompanies.push(rec);
  }
  if(typeof fbSave === 'function') fbSave('investorCompanies', rec);
  // localStorage backup — Firebase fail bo'lsa ham refresh'da yo'qolmasin
  if(typeof setLocalCollectionBackup === 'function'){
    try { setLocalCollectionBackup('investorCompanies', DB.investorCompanies); } catch(_e){}
  }
  return rec;
}

function ensureFinderContactInvestorRecord(resultIdx, contactIdx){
  var item = (_finderResults || [])[resultIdx];
  if(!item) return null;
  var contacts = getFinderVisibleContacts(item);
  var contact = contacts[contactIdx];
  if(!contact) return null;
  var existing = findFinderContactInvestorRecord(item, contact);
  return upsertFinderContactInvestorRecord(existing, item, contact, getCurrentFinderProductMeta());
}

function renderFinderContactEmailStatus(resultIdx, contactIdx, contact){
  var item = (_finderResults || [])[resultIdx];
  var rec = item ? findFinderContactInvestorRecord(item, contact) : null;
  return getEmailStatusBadge(rec || { email: (contact && contact.email) || '', emailSent: false });
}

function refreshFinderResultTabs(){
  var tabsEl = document.getElementById('finderCountryTabs');
  var countEl = document.getElementById('finder-result-count');
  var list = (Array.isArray(_finderResults) ? _finderResults : []).filter(finderResultIsRenderable);
  if(countEl) countEl.textContent = list.length;
  if(!tabsEl) return;
  var countryGroups = {};
  list.forEach(function(r){
    if(!countryGroups[r.davlat]) countryGroups[r.davlat] = [];
    countryGroups[r.davlat].push(r);
  });
  var countryNames = Object.keys(countryGroups);
  var activeCountry = String(_finderActiveCountryFilter || '').trim();
  if(activeCountry && !countryGroups[activeCountry]) activeCountry = '';
  _finderActiveCountryFilter = activeCountry;
  var activeStyle = 'border-bottom:2px solid #4361EE;background:rgba(67,97,238,.08);';
  var inactiveStyle = 'border-bottom:2px solid transparent;background:transparent;';
  tabsEl.innerHTML = '<div onclick="filterFinderByCountry(\'\')" style="flex:0 0 auto;padding:8px 14px;cursor:pointer;font-size:.7rem;font-weight:700;'+(!activeCountry ? activeStyle : inactiveStyle)+'">📋 Hammasi ('+list.length+')</div>';
  countryNames.forEach(function(cn){
    tabsEl.innerHTML += '<div onclick="filterFinderByCountry(\''+cn+'\')" style="flex:0 0 auto;padding:8px 14px;cursor:pointer;font-size:.7rem;font-weight:600;'+(activeCountry === cn ? activeStyle : inactiveStyle)+'">'+(typeof getFinderCountryFlag==='function'?getFinderCountryFlag(cn):'')+' '+(typeof getFinderCountryLabel==='function'?getFinderCountryLabel(cn):cn)+' ('+countryGroups[cn].length+')</div>';
  });
}

if(typeof _finderActiveCountryFilter === 'undefined') var _finderActiveCountryFilter = '';
if(typeof _finderDetailTargetKey === 'undefined') var _finderDetailTargetKey = '';

function getFinderCurrentResults(){
  var list = Array.isArray(_finderResults) ? _finderResults : [];
  var activeCountry = String(_finderActiveCountryFilter || '').trim();
  if(!activeCountry) return list;
  return list.filter(function(r){
    return String((r && r.davlat) || '').trim() === activeCountry;
  });
}

function renderCurrentFinderTable(){
  renderFinderTable(getFinderCurrentResults());
}

function getFinderContactTargetKey(resultIdx, contactIdx, rec){
  return String(resultIdx) + ':' + String(contactIdx) + ':' + String((rec && rec.id) || '');
}

function renderFinderInlineDetail(item, contact, rec){
  var company = escHtml((item && item.kompaniya) || '—');
  var website = escHtml((item && item.website) || '');
  var country = escHtml((item && item.davlat) || '—');
  var city = escHtml((item && item.shahar) || '—');
  var person = escHtml((contact && contact.name) || (rec && rec.rahbar) || '—');
  var title = escHtml((contact && contact.title) || (rec && rec.lavozim) || '—');
  var email = escHtml((contact && contact.email) || (rec && rec.email) || '—');
  var phone = escHtml((contact && contact.telefon) || (rec && (rec.telefon || rec.tel)) || '—');
  var linkedin = escHtml((contact && contact.linkedin) || (rec && rec.linkedin) || '');
  var photo = (contact && contact.photoUrl) || (rec && (rec.photoUrl || rec.photo_url)) || '';
  return ''+
    '<div class="finder-inline-detail" style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:14px 16px;box-shadow:0 12px 34px rgba(15,23,42,.08);margin-bottom:.85rem">'+
      '<div style="display:grid;grid-template-columns:minmax(220px,320px) 1fr;gap:16px;align-items:start">'+
        '<div style="display:flex;gap:12px;align-items:flex-start">'+
          renderPersonNameWithPhoto(person, photo, ''+
            '<div style="font-size:.72rem;color:var(--text2);margin-top:2px">'+title+'</div>'+
            '<div style="font-size:.72rem;color:#0ea5e9;margin-top:4px">'+email+'</div>'+
            '<div style="font-size:.7rem;color:#059669;margin-top:3px">'+phone+'</div>'
          , 42)+
        '</div>'+
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:10px 14px;font-size:.74rem">'+
          '<div><div style="color:var(--text3);font-size:.64rem;text-transform:uppercase;font-weight:700">Kompaniya</div><div style="font-weight:700;color:var(--text2)">'+company+'</div>'+(website?'<div style="font-size:.65rem;color:var(--text3);margin-top:3px">'+website+'</div>':'')+'</div>'+
          '<div><div style="color:var(--text3);font-size:.64rem;text-transform:uppercase;font-weight:700">Manzil</div><div style="font-weight:700;color:var(--text2)">'+city+', '+country+'</div></div>'+
          '<div><div style="color:var(--text3);font-size:.64rem;text-transform:uppercase;font-weight:700">Soha</div><div style="font-weight:700;color:var(--text2)">'+escHtml((item && item.soha) || (rec && rec.soha) || '—')+'</div></div>'+
          '<div><div style="color:var(--text3);font-size:.64rem;text-transform:uppercase;font-weight:700">LinkedIn</div><div style="font-weight:700;color:var(--text2)">'+(linkedin?'<a href="'+linkedin+'" target="_blank" rel="noopener">Profil</a>':'—')+'</div></div>'+
        '</div>'+
      '</div>'+
    '</div>';
}

function openFinderContactDetail(resultIdx, contactIdx){
  var rec = ensureFinderContactInvestorRecord(resultIdx, contactIdx);
  if(!rec || !rec.id) return;
  if(typeof openInvestorDetailModal === 'function'){
    openInvestorDetailModal(rec.id);
    return;
  }
  var targetKey = getFinderContactTargetKey(resultIdx, contactIdx, rec);
  _finderDetailTargetKey = (String(_finderDetailTargetKey || '') === targetKey) ? '' : targetKey;
  renderCurrentFinderTable();
}

if(typeof _finderAiOpen === 'undefined') var _finderAiOpen = false;
if(typeof _finderAiTargetKey === 'undefined') var _finderAiTargetKey = '';

function openFinderContactAi(resultIdx, contactIdx){
  var rec = ensureFinderContactInvestorRecord(resultIdx, contactIdx);
  if(!rec || !rec.id) return;
  if(typeof openInvestorAiWorkspace === 'function'){
    openInvestorAiWorkspace(rec.id);
  }
}

function openFinderContactEmail(resultIdx, contactIdx){
  var rec = ensureFinderContactInvestorRecord(resultIdx, contactIdx);
  if(rec && rec.id) openEmailModal(rec.id);
}

function openFinderContactSchedule(resultIdx, contactIdx){
  var rec = ensureFinderContactInvestorRecord(resultIdx, contactIdx);
  if(rec && rec.id) openScheduleModal(rec.id);
}

function deleteFinderContactResult(resultIdx, contactIdx){
  var item = (_finderResults || [])[resultIdx];
  if(!item) return;
  var contacts = getFinderVisibleContacts(item);
  var contact = contacts[contactIdx];
  if(!contact) return;
  var existing = findFinderContactInvestorRecord(item, contact);
  if(existing){
    DB.investorCompanies = (DB.investorCompanies || []).filter(function(rec){
      return String(rec.id) !== String(existing.id);
    });
    if(typeof fbDelete === 'function') fbDelete('investorCompanies', existing.id);
  }
  var _matchContact = function(candidate){
    if(!candidate) return false;
    var same = apolloContactKey(candidate) === apolloContactKey(contact);
    if(!same){
      same = !!contact.email && String(candidate.email || '').trim().toLowerCase() === String(contact.email || '').trim().toLowerCase();
    }
    return same;
  };
  if(Array.isArray(item.contacts) && item.contacts.length){
    var _removed1 = false;
    item.contacts = item.contacts.filter(function(c){
      if(_removed1) return true;
      if(_matchContact(c)){ _removed1 = true; return false; }
      return true;
    });
  }
  if(Array.isArray(item._contactCandidates) && item._contactCandidates.length){
    var _removed2 = false;
    item._contactCandidates = item._contactCandidates.filter(function(c){
      if(_removed2) return true;
      if(_matchContact(c)){ _removed2 = true; return false; }
      return true;
    });
  }
  var _primary = (item.contacts && item.contacts[0]) || null;
  if(_primary){
    item.rahbar = _primary.name || '';
    item.lavozim = _primary.title || '';
    item.email = _primary.email || '';
    item.telefon = _primary.telefon || '';
    item.photoUrl = _primary.photoUrl || '';
    item.photo_url = item.photoUrl;
    item.linkedin = _primary.linkedin || '';
    item._personId = _primary.personId || '';
  } else {
    item.rahbar = ''; item.lavozim = ''; item.email = ''; item.telefon = '';
    item.photoUrl = ''; item.photo_url = ''; item.linkedin = ''; item._personId = '';
  }
  var _remaining = Array.isArray(item.contacts) ? item.contacts.filter(finderContactIsQualified) : [];
  if(!_remaining.length){
    _finderResults.splice(resultIdx, 1);
  }
  refreshFinderResultTabs();
  renderCurrentFinderTable();
  toast('Kontakt o\'chirildi', 'info');
}

window.openFinderContactDetail = openFinderContactDetail;
window.openFinderContactAi = openFinderContactAi;
window.openFinderContactEmail = openFinderContactEmail;
window.openFinderContactSchedule = openFinderContactSchedule;
window.deleteFinderContactResult = deleteFinderContactResult;

function closeInvestorDetailModal(){
  var modal = document.getElementById('investorDetailModal');
  if(modal){ modal.classList.remove('open'); modal.style.display = 'none'; }
}
window.closeInvestorDetailModal = closeInvestorDetailModal;

async function enrichCompanyFromApollo(rec){
  if(!rec) return false;
  var domain = String(rec.website||'').toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0];
  if(!domain && !rec.kompaniya){ toast('⚠️ Website yoki kompaniya nomi yo\'q','error'); return false; }
  var loadingToast = typeof toastLoading==='function' ? toastLoading('🔍 Apollo\'dan ma\'lumot olinmoqda... (credit yo\'q)') : null;
  async function trySearch(payload){
    var resp = await fetch(APOLLO_PROXY, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    var d = null; try { d = await resp.json(); } catch(_){}
    return { ok: resp.ok, data: d };
  }
  try {
    var attempts = [];
    if(domain) attempts.push({ action:'people_search', per_page:5, page:1, api_key:getApolloApiKey(), q_organization_domains:[domain] });
    if(rec.kompaniya) attempts.push({ action:'people_search', per_page:5, page:1, api_key:getApolloApiKey(), q_organization_name:rec.kompaniya });
    var org = null;
    for(var ai=0; ai<attempts.length && !org; ai++){
      var r = await trySearch(attempts[ai]);
      if(r.data && r.data.error){ continue; }
      var people = (r.data && (r.data.people || r.data.contacts)) || [];
      var orgs = (r.data && (r.data.organizations || r.data.accounts)) || [];
      for(var pi=0; pi<people.length && !org; pi++){
        if(people[pi] && people[pi].organization) org = people[pi].organization;
      }
      if(!org && orgs.length){
        org = orgs[0];
        if(domain){
          var match = orgs.find(function(o){
            var od = String((o && (o.primary_domain || o.website_url || o.domain))||'').toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0];
            return od === domain;
          });
          if(match) org = match;
        }
      }
      if(!org && people.length && people[0].organization_id && orgs.length){
        var oid = people[0].organization_id;
        var found = orgs.find(function(o){return String(o.id)===String(oid);});
        if(found) org = found;
      }
    }
    if(!org){
      if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, '⚠️ Apollo\'da ma\'lumot topilmadi', 'info');
      return false;
    }
    var changed = false;
    var emp = org.estimated_num_employees || org.num_employees || org.employee_count;
    if(emp){ rec.xodimlar = String(emp); changed = true; }
    var rev = org.organization_revenue_printed || org.annual_revenue_printed || org.estimated_annual_revenue;
    if(rev){ rec.daromad = String(rev); changed = true; }
    var fy = org.founded_year || org.year_founded;
    if(fy){ rec.tpilyil = String(fy); changed = true; }
    // Skip phone — Apollo charges credit when phone field is accessed
    if(changed){
      if(typeof fbSave==='function') fbSave('investorCompanies', rec);
      if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, '✅ Apollo ma\'lumot yuklandi', 'success');
    } else {
      if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, 'ℹ️ Yangi ma\'lumot topilmadi', 'info');
    }
    return changed;
  } catch(e){
    console.warn('Apollo enrich failed:', e);
    if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, '❌ '+e.message, 'error');
    return false;
  }
}
window.enrichCompanyFromApollo = enrichCompanyFromApollo;

async function enrichAndReopen(id){
  var rec = (DB.investorCompanies||[]).find(function(r){return String(r.id)===String(id);});
  if(!rec) return;
  var changed = await enrichCompanyFromApollo(rec);
  if(changed) openInvestorDetailModal(id);
}
window.enrichAndReopen = enrichAndReopen;

async function enrichCompanyFromApolloPaid(rec){
  if(!rec) return false;
  var domain = String(rec.website||'').toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0];
  if(!domain && !rec.kompaniya){ toast('⚠️ Website yoki kompaniya nomi yo\'q','error'); return false; }
  if(!confirm('⚠️ Bu so\'rov 1 ta Apollo crediti ishlatadi.\n\nDavom etilsinmi?')) return false;
  var loadingToast = typeof toastLoading==='function' ? toastLoading('💎 Apollo org_enrichment... (1 credit)') : null;
  try {
    var body = { action:'org_enrichment', api_key:getApolloApiKey() };
    if(domain) body.domain = domain;
    if(rec.kompaniya) body.organization_name = rec.kompaniya;
    var resp = await fetch(APOLLO_PROXY, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    var data = await resp.json();
    if(!resp.ok || data.error){
      if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, '❌ Apollo: '+(data.error||resp.status), 'error');
      return false;
    }
    var org = data.organization || data.account || data;
    if(!org){
      if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, '⚠️ Topilmadi', 'info');
      return false;
    }
    var changed = false;
    var emp = org.estimated_num_employees || org.num_employees || org.employee_count;
    if(emp){ rec.xodimlar = String(emp); changed = true; }
    var rev = org.organization_revenue_printed || org.annual_revenue_printed || org.estimated_annual_revenue;
    if(rev){ rec.daromad = String(rev); changed = true; }
    var fy = org.founded_year || org.year_founded;
    if(fy){ rec.tpilyil = String(fy); changed = true; }
    var phone = org.phone || org.organization_phone || org.primary_phone;
    if(phone){ rec.telefon = String(phone); changed = true; }
    if(changed){
      if(typeof fbSave==='function') fbSave('investorCompanies', rec);
      if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, '✅ To\'liq ma\'lumot yuklandi (1 credit)', 'success');
    } else {
      if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, 'ℹ️ Yangi ma\'lumot yo\'q', 'info');
    }
    return changed;
  } catch(e){
    console.warn('Apollo paid enrich failed:', e);
    if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, '❌ '+e.message, 'error');
    return false;
  }
}

async function enrichAndReopenPaid(id){
  var rec = (DB.investorCompanies||[]).find(function(r){return String(r.id)===String(id);});
  if(!rec) return;
  var changed = await enrichCompanyFromApolloPaid(rec);
  if(changed) openInvestorDetailModal(id);
}
window.enrichAndReopenPaid = enrichAndReopenPaid;

/* Render AI-extracted website profile section */
function renderWebsiteAiProfileSection(rec){
  var profile = rec.websiteAiProfile || null;
  var ts = rec.websiteAiProfileAt || '';
  if(!profile){
    return '<div style="padding:1rem;border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,#fff,#f0f9ff)">'+
      '<div style="display:flex;align-items:center;gap:10px;padding:.8rem 0">'+
        '<div style="width:18px;height:18px;border:2px solid rgba(14,165,233,.25);border-top-color:#0EA5E9;border-radius:50%;animation:spin 0.8s linear infinite"></div>'+
        '<div style="font-size:.74rem;color:var(--text2);line-height:1.5">AI kompaniya saytidan ma\'lumot olmoqda... Bu 10-20 soniya olishi mumkin.</div>'+
      '</div>'+
      (rec.website ? '' : '<div style="font-size:.7rem;color:#d97706;margin-top:.4rem;padding:.5rem .7rem;background:rgba(217,119,6,.08);border-radius:8px">⚠️ Kompaniya website\'i kiritilmagan — profil tayyorlash uchun website kerak.</div>')+
    '</div>';
  }
  var row = function(lbl, val){
    if(!val) return '';
    return '<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px dashed rgba(15,23,42,.07);font-size:.75rem;line-height:1.5"><b style="color:var(--text3);min-width:110px;font-weight:600">'+escHtml(lbl)+'</b><span style="color:var(--text);flex:1">'+escHtml(val)+'</span></div>';
  };
  var bullets = function(lbl, arr){
    if(!arr || !arr.length) return '';
    return '<div style="margin-top:.55rem"><div style="font-size:.7rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">'+escHtml(lbl)+'</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:4px">'+
        arr.slice(0,12).map(function(x){return '<span style="font-size:.68rem;padding:3px 8px;background:rgba(14,165,233,.09);color:#0369A1;border-radius:999px;border:1px solid rgba(14,165,233,.2)">'+escHtml(x)+'</span>';}).join('')+
      '</div></div>';
  };
  var socials = profile.socialLinks || {};
  var socialHtml = '';
  ['linkedin','facebook','twitter','instagram','youtube'].forEach(function(k){
    if(socials[k]){
      socialHtml += '<a href="'+tgEscapeAttr(socials[k])+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;font-size:.7rem;padding:4px 10px;background:#fff;border:1px solid var(--border);border-radius:8px;color:#2563EB;text-decoration:none;margin-right:6px;margin-top:4px">'+k.charAt(0).toUpperCase()+k.slice(1)+'</a>';
    }
  });
  var textBlock = function(lbl, val){
    if(!val) return '';
    return '<div style="margin-top:.65rem"><div style="font-size:.68rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">'+escHtml(lbl)+'</div>'+
      '<div style="font-size:.74rem;color:var(--text2);line-height:1.55;padding:.5rem .65rem;background:rgba(14,165,233,.05);border-radius:8px;border-left:2px solid rgba(14,165,233,.35)">'+escHtml(val)+'</div></div>';
  };
  var contact = profile.contactInfo || {};
  var contactLines = [];
  if(contact.phone) contactLines.push('📞 '+escHtml(contact.phone));
  if(contact.email) contactLines.push('✉️ '+escHtml(contact.email));
  if(contact.address) contactLines.push('📍 '+escHtml(contact.address));

  return '<div style="padding:1rem;border:1px solid rgba(14,165,233,.28);border-radius:16px;background:linear-gradient(180deg,#fff,#f0f9ff)">'+
    (ts ? '<div style="display:flex;justify-content:flex-end;margin-bottom:.55rem"><div style="font-size:.6rem;color:var(--text3)">'+escHtml(new Date(ts).toLocaleDateString())+'</div></div>' : '')+
    (profile.about ? '<div style="font-size:.76rem;color:var(--text2);line-height:1.6;margin-bottom:.7rem;padding:.65rem .8rem;background:rgba(14,165,233,.06);border-radius:10px;border-left:3px solid #0EA5E9">'+escHtml(profile.about)+'</div>' : '')+
    textBlock('Missiya', profile.mission)+
    textBlock('Tarix', profile.history)+
    '<div style="margin-top:.55rem">'+
      row('Asos yili', profile.founded)+
      row('Bosh ofis', profile.headquarters)+
      row('Xodimlar', profile.employeeCount)+
      row('Yillik daromad', profile.annualRevenue)+
      row('Soha', profile.industry)+
      row('Tuzilma', profile.legalForm)+
      row('Asoschi/CEO', profile.ceo || profile.founder)+
    '</div>'+
    bullets('Qo\'shimcha ofislar/zavodlar', profile.offices)+
    bullets('Qo\'shimcha sohalar', profile.subIndustries)+
    bullets('Kalit shaxslar', profile.keyPeople)+
    bullets('Asosiy mahsulotlar', profile.products)+
    bullets('Xizmatlar', profile.services)+
    bullets('Mahsulot kategoriyalari', profile.productCategories)+
    bullets('Mutaxassislik', profile.specializations)+
    bullets('Maqsadli bozorlar', profile.markets)+
    bullets('Yirik loyihalar', profile.majorProjects)+
    bullets('Sertifikatlar', profile.certifications)+
    bullets('Mukofotlar', profile.awards)+
    textBlock('Barqarorlik', profile.sustainability)+
    textBlock('Texnologiya', profile.technology)+
    bullets('Hamkorlar/mijozlar', profile.partners)+
    bullets('Tillar', profile.languages)+
    bullets('Kalit so\'zlar', profile.keywords)+
    (contactLines.length ? '<div style="margin-top:.6rem;padding:.55rem .7rem;background:rgba(14,165,233,.05);border-radius:8px;font-size:.72rem;color:var(--text2);line-height:1.6">'+contactLines.join('<br>')+'</div>' : '')+
    (socialHtml ? '<div style="margin-top:.65rem"><div style="font-size:.7rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Ijtimoiy tarmoqlar</div>'+socialHtml+'</div>' : '')+
    '<div style="margin-top:.7rem;display:flex;gap:6px;flex-wrap:wrap">'+
      '<button type="button" onclick="enrichFromWebsite(\''+rec.id+'\', true)" style="font-size:.68rem;padding:5px 10px;border-radius:8px;background:rgba(14,165,233,.1);color:#0369A1;border:1px solid rgba(14,165,233,.25);cursor:pointer;font-weight:600">🔄 Qayta yangilash</button>'+
    '</div>'+
  '</div>';
}
window.renderWebsiteAiProfileSection = renderWebsiteAiProfileSection;

/* Extract company profile from website using Gemini */
async function enrichFromWebsite(id, force){
  var rec = (DB.investorCompanies || []).find(function(item){ return String(item.id) === String(id); });
  if(!rec){ toast('Kompaniya topilmadi','error'); return; }
  if(!rec.website && !rec.kompaniya){ toast('Kompaniya nomi yoki sayti kiritilmagan','error'); return; }
  if(rec.websiteAiProfile && !force){
    toast('ℹ️ AI profil allaqachon mavjud. Qayta yangilash uchun "Qayta yangilash" ni bosing');
    return;
  }
  if(typeof getAllGeminiKeys !== 'function'){ toast('Gemini kalit topilmadi','error'); return; }
  var keys = getAllGeminiKeys();
  if(!keys.length){ toast('⚙️ Sozlamalardan Gemini API kalit kiriting','error'); return; }

  var lt = toastLoading('🌐 AI saytdan ma\'lumot olmoqda...');

  try {
    // Step 1: Fetch actual website text via proxy (about pages, home page, etc.)
    var websiteText = '';
    var fetchedPages = [];
    if(rec.website){
      try {
        toast('📡 Sayt matnini yuklanmoqda...');
        var proxyBase = (typeof AI_TRADE_ANALYZER_API_BASE !== 'undefined') ? AI_TRADE_ANALYZER_API_BASE : 'https://navoiy-api-proxy.vercel.app/api';
        var fResp = await fetch(proxyBase + '/analyze-material', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ mode: 'fetchWebsite', url: rec.website })
        });
        if(fResp.ok){
          var fData = await fResp.json();
          websiteText = fData.text || '';
          fetchedPages = fData.pages || [];
          // Save logo if found
          if(fData.logoUrl){
            rec.logoUrl = fData.logoUrl;
            rec.logoFound = !!fData.logoFound;
          }
          if(websiteText){
            toast('🧠 AI matnni tahlil qilmoqda... ('+Math.round(websiteText.length/1000)+' KB, '+fetchedPages.length+' ta sahifa)');
            console.log('[enrichFromWebsite] fetched pages:', fetchedPages);
          } else {
            toast('⚠️ Sayt yuklanmadi: '+(fData.error || 'noma\'lum'),'info');
            console.warn('[enrichFromWebsite] fetch failed:', fData.reasons);
          }
        } else {
          var errText = await fResp.text();
          console.warn('[enrichFromWebsite] proxy error:', fResp.status, errText);
        }
      } catch(e){ console.warn('Website fetch failed:', e); }
    }

    var prompt = 'You are a business intelligence extractor. Analyze the company using (1) the actual website text provided below, and (2) your existing knowledge.\n\n'+
      'Company name: ' + (rec.kompaniya || '(unknown)') + '\n'+
      'Website: ' + (rec.website || '(unknown)') + '\n'+
      'Country: ' + (rec.davlat || '') + '\n'+
      'City/Address: ' + (rec.manzil || '') + '\n'+
      'Industry/Product (from our DB): ' + (rec.soha || rec.mahsulotNomi || '') + '\n'+
      'LinkedIn: ' + (rec.linkedin || '') + '\n\n'+
      (websiteText
        ? '=== ACTUAL WEBSITE CONTENT (home + about pages) ===\n' + websiteText + '\n=== END WEBSITE CONTENT ===\n\nUse this website content as PRIMARY source. Augment with your knowledge only where gaps exist.\n\n'
        : '(website content could not be retrieved — use your knowledge)\n\n') +
      'Return STRICT JSON (no markdown, no commentary) with these keys (use null if unknown):\n'+
      '{\n'+
      '  "about": "4-6 DETAILED sentences describing the company — what they do, their core business, key strengths, unique value (in Uzbek/lotincha)",\n'+
      '  "mission": "mission statement or core philosophy, 1-2 sentences in Uzbek",\n'+
      '  "history": "brief history — founding story, key milestones, 2-3 sentences in Uzbek",\n'+
      '  "founded": "year founded",\n'+
      '  "headquarters": "full HQ address — city, country",\n'+
      '  "offices": ["list of additional office/factory locations if any"],\n'+
      '  "employeeCount": "employee count/range (e.g., \\"50-100 xodim\\")",\n'+
      '  "annualRevenue": "revenue estimate (e.g., \\"$5-10M\\" or \\"~€20M\\")",\n'+
      '  "industry": "primary industry/sector in Uzbek",\n'+
      '  "subIndustries": ["secondary industries/niches"],\n'+
      '  "legalForm": "LLC, PLC, SPA, GmbH, Lda, etc.",\n'+
      '  "ceo": "founder or current CEO name",\n'+
      '  "keyPeople": ["other key executives/managers with titles if mentioned"],\n'+
      '  "products": ["MAIN products — be specific, extract ALL from website"],\n'+
      '  "services": ["services offered (if different from products)"],\n'+
      '  "productCategories": ["broader product families/categories"],\n'+
      '  "specializations": ["technical specializations, capabilities, expertise areas"],\n'+
      '  "markets": ["target export markets/countries — extract ALL mentioned"],\n'+
      '  "majorProjects": ["notable projects, clients, or case studies if mentioned"],\n'+
      '  "certifications": ["ISO 9001, CE, FSC, etc."],\n'+
      '  "awards": ["awards, recognitions if any"],\n'+
      '  "sustainability": "sustainability/environment practices if mentioned",\n'+
      '  "technology": "technologies, equipment, innovations used",\n'+
      '  "partners": ["major partners/clients/suppliers if listed"],\n'+
      '  "languages": ["languages supported by the company"],\n'+
      '  "keywords": ["8-12 specific business keywords in Uzbek"],\n'+
      '  "contactInfo": { "phone": "", "email": "", "address": "" },\n'+
      '  "socialLinks": { "linkedin": "url", "facebook": "url", "instagram": "url", "twitter": "url", "youtube": "url" }\n'+
      '}\n\n'+
      'Rules:\n'+
      '- Output ONLY valid JSON object, no extra text, no markdown code fences\n'+
      '- Use Uzbek (lotincha) for descriptive text fields (about, mission, history, industry)\n'+
      '- Extract AS MUCH as possible from website content — be thorough\n'+
      '- Product lists should be COMPREHENSIVE, not limited to 3-4 items\n'+
      '- If website content mentions specific numbers, years, project names — include them\n'+
      '- If truly unknown, use null (don\'t invent)\n'+
      '- Markets: list specific countries';

    var body = { contents: [{ role:'user', parts:[{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 4096 } };
    // Agar sayt matni yuklanmagan bo'lsa — Google Search grounding orqali ma'lumot olish
    var usingGoogleSearch = false;
    if(!websiteText){
      body.tools = [{ google_search: {} }];
      usingGoogleSearch = true;
      toast('🔍 Google qidiruvi orqali ma\'lumot olinmoqda...');
    }
    // Use direct Gemini call via callGemini helper (supports cascade)
    var data;
    try {
      data = await callGemini(body);
    } catch(callErr){
      // Google Search bilan failed bo'lsa, tools'siz fallback (faqat training data)
      if(usingGoogleSearch){
        console.warn('[enrichFromWebsite] Google search failed, fallback to knowledge:', callErr.message);
        delete body.tools;
        toast('⚠️ Google qidiruv ishlamadi — Gemini bilim asosida...');
        data = await callGemini(body);
      } else {
        throw callErr;
      }
    }
    // Multiple parts'larni birlashtirish (grounding bo'lganda matn bo'lakli kelishi mumkin)
    var raw = '';
    if(data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts){
      var parts = data.candidates[0].content.parts;
      for(var pi = 0; pi < parts.length; pi++){
        if(parts[pi] && parts[pi].text) raw += String(parts[pi].text);
      }
      raw = raw.trim();
    }
    if(!raw){ toastDone(lt, '❌ Bo\'sh javob','error'); return; }

    var profile;
    try { profile = safeParseJSON(raw); }
    catch(err){ toastDone(lt, '❌ JSON parse xato: '+err.message,'error'); console.warn('Raw:', raw); return; }
    if(!profile || typeof profile !== 'object'){ toastDone(lt, '❌ Noto\'g\'ri format','error'); return; }

    rec.websiteAiProfile = profile;
    rec.websiteAiProfileAt = new Date().toISOString();
    // 1. Save to Firebase (await — must finish before we say "done")
    if(typeof fbSave === 'function'){
      try { await fbSave('investorCompanies', rec); }
      catch(err){ console.warn('Firebase save error:', err); }
    }
    // 2. Update localStorage cache so next page reload has new profile (cache-fresh path)
    if(typeof setLocalCollectionBackup === 'function' && Array.isArray(DB.investorCompanies)){
      setLocalCollectionBackup('investorCompanies', DB.investorCompanies);
    }
    toastDone(lt, '✅ Saytdan AI profil tayyor! (saqlandi)');
    openInvestorDetailModal(id); // re-render
  } catch(e){
    console.error(e);
    toastDone(lt, '❌ '+(e.message || 'Xato'),'error');
  }
}
window.enrichFromWebsite = enrichFromWebsite;

// ═══ TradeAtlas batafsil ma'lumot sektsiyasi ═══
function renderTradeAtlasDetailSection(rec){
  if(!rec) return '';
  var isTa = String(rec.manba || '').toLowerCase() === 'tradeatlas';
  var hasAny = isTa && (
    rec._tradeAtlasDocCount || rec._tradeAtlasTradeValue || rec._tradeAtlasQuantity ||
    rec._tradeAtlasGrossWeight || rec._tradeAtlasNetWeight ||
    (Array.isArray(rec._tradeAtlasShipmentExamples) && rec._tradeAtlasShipmentExamples.length) ||
    (Array.isArray(rec._tradeAtlasCounterpartCountries) && rec._tradeAtlasCounterpartCountries.length) ||
    (Array.isArray(rec._tradeAtlasPortsOfDeparture) && rec._tradeAtlasPortsOfDeparture.length)
  );
  if(!hasAny) return '';

  function fmtUsd(v){ v = Number(v || 0); if(!v) return '—'; if(v >= 1e9) return '$' + (v/1e9).toFixed(2) + 'B'; if(v >= 1e6) return '$' + (v/1e6).toFixed(2) + 'M'; if(v >= 1e3) return '$' + (v/1e3).toFixed(1) + 'K'; return '$' + Number(v).toLocaleString(); }
  function fmtNum(v, unit){ v = Number(v || 0); if(!v) return '—'; var out = v >= 1e6 ? (v/1e6).toFixed(2)+'M' : v >= 1e3 ? (v/1e3).toFixed(1)+'K' : String(Math.round(v*100)/100); return out + (unit ? (' ' + unit) : ''); }
  function fmtDate(v){ if(!v) return '—'; var d = new Date(v); if(!isNaN(d)) return d.toISOString().slice(0, 10); return String(v); }
  function listChips(arr, max, color){
    if(!Array.isArray(arr) || !arr.length) return '—';
    var shown = arr.slice(0, max || 6);
    var more = arr.length > shown.length ? (' <span style="color:var(--text3);font-size:.7rem">+' + (arr.length - shown.length) + '</span>') : '';
    return shown.map(function(v){
      return '<span style="display:inline-block;padding:2px 8px;border-radius:6px;background:'+(color||'rgba(67,97,238,.08)')+';color:var(--text);font-size:.7rem;margin:2px 4px 2px 0;font-weight:600">'+escHtml(String(v))+'</span>';
    }).join('') + more;
  }

  function kpi(label, value, accent){
    return '<div style="padding:.7rem;border:1px solid var(--border);border-radius:10px;background:#fff"><div style="font-size:.58rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;font-weight:700">'+escHtml(label)+'</div><div style="font-size:.9rem;font-weight:800;color:'+(accent||'var(--text)')+';margin-top:3px;word-break:break-all">'+value+'</div></div>';
  }

  var kpiFinancial =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.55rem;margin-bottom:.9rem">'+
      kpi('Shipmentlar', (rec._tradeAtlasDocCount || 0).toLocaleString(), '#4361EE')+
      kpi('FOB qiymati', fmtUsd(rec._tradeAtlasFobUsd || rec._tradeAtlasTradeValue), '#059669')+
      kpi('CIF qiymati', fmtUsd(rec._tradeAtlasCifUsd), '#0EA5E9')+
      kpi('Statistik qiymat', fmtUsd(rec._tradeAtlasStatValueUsd), '#7C3AED')+
      kpi('Yuk narxi', fmtUsd(rec._tradeAtlasFreightUsd), '#F97316')+
      kpi('Sug\'urta', fmtUsd(rec._tradeAtlasInsuranceUsd), '#EF4444')+
      kpi('O\'rt. birlik narx', fmtUsd(rec._tradeAtlasAvgUnitPriceUsd), '#EC4899')+
    '</div>';

  var kpiVolume =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.55rem;margin-bottom:.9rem">'+
      kpi('Miqdor', fmtNum(rec._tradeAtlasQuantity, rec._tradeAtlasQuantityUnit), '#059669')+
      kpi('Gross og\'irlik', fmtNum(rec._tradeAtlasGrossWeight, rec._tradeAtlasGrossWeightUnit || 'kg'), '#4361EE')+
      kpi('Net og\'irlik', fmtNum(rec._tradeAtlasNetWeight, rec._tradeAtlasNetWeightUnit || 'kg'), '#0EA5E9')+
      kpi('Konteynerlar', (rec._tradeAtlasContainers || 0).toLocaleString(), '#7C3AED')+
      kpi('Paketlar', fmtNum(rec._tradeAtlasPackages, rec._tradeAtlasPackageUnit), '#F97316')+
      kpi('TEU', fmtNum(rec._tradeAtlasTeus), '#EC4899')+
    '</div>';

  var datesRow = (rec._tradeAtlasFirstArrivalDate || rec._tradeAtlasLastArrivalDate) ?
    ('<div style="display:grid;grid-template-columns:1fr 1fr;gap:.55rem;margin-bottom:.9rem">'+
      kpi('Birinchi shipment', fmtDate(rec._tradeAtlasFirstArrivalDate))+
      kpi('Oxirgi shipment', fmtDate(rec._tradeAtlasLastArrivalDate))+
    '</div>') : '';

  function chipBlock(title, arr, color){
    if(!Array.isArray(arr) || !arr.length) return '';
    return '<div style="margin-bottom:.7rem"><div style="font-size:.62rem;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">'+escHtml(title)+'</div><div>'+listChips(arr, 10, color)+'</div></div>';
  }

  var productsBlock =
    chipBlock('HS kodlar', rec._tradeAtlasHsCodes, 'rgba(124,58,237,.1)')+
    chipBlock('HS tavsifi', rec._tradeAtlasHsDescriptions, 'rgba(124,58,237,.08)')+
    chipBlock('Mahsulot tafsilotlari', rec._tradeAtlasProductDetails, 'rgba(67,97,238,.08)')+
    chipBlock('Brendlar', rec._tradeAtlasBrandNames, 'rgba(236,72,153,.1)')+
    chipBlock('Kelib chiqish davlatlari', rec._tradeAtlasCountriesOfOrigin, 'rgba(5,150,105,.1)')+
    chipBlock('Holati (new/used)', rec._tradeAtlasConditionsNewUsed, 'rgba(249,115,22,.1)');

  var logisticsBlock =
    chipBlock('Jo\'natish portlari', rec._tradeAtlasPortsOfDeparture, 'rgba(14,165,233,.1)')+
    chipBlock('Qabul portlari', rec._tradeAtlasPortsOfArrival, 'rgba(14,165,233,.1)')+
    chipBlock('Kemalar', rec._tradeAtlasVessels, 'rgba(67,97,238,.08)')+
    chipBlock('Incoterms', rec._tradeAtlasIncoterms, 'rgba(124,58,237,.1)')+
    chipBlock('Transport turi', rec._tradeAtlasTransportTypes, 'rgba(5,150,105,.1)')+
    chipBlock('To\'lov turi', rec._tradeAtlasPaymentTypes, 'rgba(245,158,11,.1)')+
    chipBlock('Rejim', rec._tradeAtlasRegimes, 'rgba(239,68,68,.08)');

  var counterpartBlock =
    chipBlock('Hamkor davlatlar', rec._tradeAtlasCounterpartCountries, 'rgba(5,150,105,.1)')+
    chipBlock('Hamkor kompaniyalar', rec._tradeAtlasCounterpartCompanies, 'rgba(67,97,238,.08)');

  var partiesBlock =
    chipBlock('Ishlab chiqaruvchi', rec._tradeAtlasManufacturingCompanies, 'rgba(124,58,237,.08)')+
    chipBlock('Transport kompaniya', rec._tradeAtlasTransportCompanies, 'rgba(14,165,233,.08)')+
    chipBlock('Notify party', rec._tradeAtlasNotifyParties, 'rgba(236,72,153,.08)');

  var identityBlock = '';
  if(rec._tradeAtlasTaxId || rec._tradeAtlasCompanyTypeCode || rec._tradeAtlasFax || rec._tradeAtlasFacebook || rec._tradeAtlasTwitter || rec._tradeAtlasInstagram){
    identityBlock = '<div style="margin-bottom:.7rem"><div style="font-size:.62rem;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Qo\'shimcha ma\'lumotlar</div>'+
      '<div style="font-size:.75rem;color:var(--text2);line-height:1.7;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.25rem .9rem">'+
        (rec._tradeAtlasTaxId ? '<div><b>Soliq ID:</b> '+escHtml(rec._tradeAtlasTaxId)+'</div>' : '')+
        (rec._tradeAtlasCompanyTypeCode ? '<div><b>Kompaniya turi:</b> '+escHtml(rec._tradeAtlasCompanyTypeCode)+'</div>' : '')+
        (rec._tradeAtlasFax ? '<div><b>Faks:</b> '+escHtml(rec._tradeAtlasFax)+'</div>' : '')+
        (rec._tradeAtlasFacebook ? '<div><b>Facebook:</b> <a href="'+tgEscapeAttr(rec._tradeAtlasFacebook)+'" target="_blank" rel="noopener" style="color:#1877F2">ochish</a></div>' : '')+
        (rec._tradeAtlasTwitter ? '<div><b>Twitter/X:</b> <a href="'+tgEscapeAttr(rec._tradeAtlasTwitter)+'" target="_blank" rel="noopener" style="color:#000">ochish</a></div>' : '')+
        (rec._tradeAtlasInstagram ? '<div><b>Instagram:</b> <a href="'+tgEscapeAttr(rec._tradeAtlasInstagram)+'" target="_blank" rel="noopener" style="color:#E4405F">ochish</a></div>' : '')+
      '</div></div>';
  }

  // Shipment examples (oxirgi 5 ta misol)
  var examplesBlock = '';
  var examples = Array.isArray(rec._tradeAtlasShipmentExamples) ? rec._tradeAtlasShipmentExamples : [];
  if(examples.length){
    var rows = examples.map(function(ex){
      var cells = [];
      cells.push('<td style="padding:6px 8px;font-size:.68rem;color:var(--text2)">'+escHtml(fmtDate(ex.arrivalDate))+'</td>');
      cells.push('<td style="padding:6px 8px;font-size:.68rem">'+escHtml(String(ex.exporterCountry || '')+' → '+String(ex.importerCountry || ''))+'</td>');
      cells.push('<td style="padding:6px 8px;font-size:.68rem">'+escHtml(String(ex.hsCode || ''))+'</td>');
      cells.push('<td style="padding:6px 8px;font-size:.68rem;font-weight:700">'+fmtUsd(ex.usdFob || ex.statisticalValueUsd)+'</td>');
      cells.push('<td style="padding:6px 8px;font-size:.68rem">'+escHtml(fmtNum(ex.quantity, ex.quantityUnit))+'</td>');
      cells.push('<td style="padding:6px 8px;font-size:.68rem">'+escHtml(String(ex.portOfDeparture || '')+' → '+String(ex.portOfArrival || ''))+'</td>');
      cells.push('<td style="padding:6px 8px;font-size:.68rem">'+escHtml(String(ex.vesselName || '—'))+'</td>');
      cells.push('<td style="padding:6px 8px;font-size:.68rem">'+escHtml(String(ex.incoterms || ex.transportType || '—'))+'</td>');
      return '<tr>'+cells.join('')+'</tr>';
    }).join('');
    examplesBlock = '<div style="margin-top:.9rem"><div style="font-size:.62rem;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Oxirgi shipmentlar (5 tagacha)</div>'+
      '<div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px"><table style="width:100%;border-collapse:collapse;font-size:.7rem">'+
        '<thead style="background:#F8FAFC"><tr>'+
          '<th style="padding:7px 8px;text-align:left;font-weight:700;color:var(--text2)">Sana</th>'+
          '<th style="padding:7px 8px;text-align:left;font-weight:700;color:var(--text2)">Yo\'nalish</th>'+
          '<th style="padding:7px 8px;text-align:left;font-weight:700;color:var(--text2)">HS</th>'+
          '<th style="padding:7px 8px;text-align:left;font-weight:700;color:var(--text2)">FOB</th>'+
          '<th style="padding:7px 8px;text-align:left;font-weight:700;color:var(--text2)">Hajm</th>'+
          '<th style="padding:7px 8px;text-align:left;font-weight:700;color:var(--text2)">Portlar</th>'+
          '<th style="padding:7px 8px;text-align:left;font-weight:700;color:var(--text2)">Kema</th>'+
          '<th style="padding:7px 8px;text-align:left;font-weight:700;color:var(--text2)">Incoterms</th>'+
        '</tr></thead>'+
        '<tbody>'+rows+'</tbody>'+
      '</table></div></div>';
  }

  return '<div style="padding:1rem;border:1px solid rgba(67,97,238,.25);border-radius:16px;background:linear-gradient(180deg,#fff,#f0f4ff)">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:.85rem">'+
      '<div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#1E3A8A,#4361EE);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.7rem;letter-spacing:-.02em">TA</div>'+
      '<div style="font-family:\'Sora\',sans-serif;font-size:.9rem;font-weight:800;color:var(--text)">TradeAtlas — Shipment tahlili</div>'+
    '</div>'+
    '<div style="font-size:.62rem;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Moliya</div>'+
    kpiFinancial +
    '<div style="font-size:.62rem;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Hajm va qadoqlash</div>'+
    kpiVolume +
    datesRow +
    identityBlock +
    counterpartBlock +
    productsBlock +
    logisticsBlock +
    partiesBlock +
    examplesBlock +
  '</div>';
}
window.renderTradeAtlasDetailSection = renderTradeAtlasDetailSection;

// Eksport / Import savdo tafsilotlari — _partners va _partnerOf'dan aggregate (synthetic record uchun ham ishlaydi)
function renderExportTradeSection(rec){
  if(!rec) return '';
  var partners = Array.isArray(rec._partners) ? rec._partners : [];
  var partnerOf = Array.isArray(rec._partnerOf) ? rec._partnerOf : [];
  if(!partners.length && !partnerOf.length) return '';

  var role = String(rec.finderMode || rec.role || '').toLowerCase();
  var isExp = role === 'exporters' || role === 'exporter';
  var isImp = role === 'importers' || role === 'importer';
  // Fallback rol aniqlash
  if(!isExp && !isImp){
    if(partners.length && String(partners[0].role||'').toLowerCase() === 'importer') isExp = true;
    else if(partners.length && String(partners[0].role||'').toLowerCase() === 'exporter') isImp = true;
    else if(partnerOf.length && String(partnerOf[0].role||'').toLowerCase() === 'exporter') isImp = true;
    else if(partnerOf.length && String(partnerOf[0].role||'').toLowerCase() === 'importer') isExp = true;
  }

  // Aggregate
  var totalQty = 0, totalVal = 0, totalDocs = 0;
  var firstDate = '', lastDate = '';
  function aggSrc(arr){
    arr.forEach(function(p){
      totalQty += Number(p.totalQty || 0);
      totalVal += Number(p.totalValue || 0);
      totalDocs += Number(p.docCount || 0);
      var d = String(p.lastDate || '').slice(0,10);
      if(d){
        if(!lastDate || d > lastDate) lastDate = d;
        if(!firstDate || d < firstDate) firstDate = d;
      }
    });
  }
  aggSrc(partners);
  aggSrc(partnerOf);

  if(!totalQty && !totalVal && !lastDate) return '';

  function fmtKg(v){
    v = Number(v || 0);
    if(!v) return '—';
    if(v >= 1e6) return (v/1e6).toFixed(2)+'M kg';
    if(v >= 1e3) return (v/1e3).toFixed(1)+'K kg';
    return Math.round(v)+' kg';
  }
  function fmtUsd(v){
    v = Number(v || 0);
    if(!v) return '—';
    if(v >= 1e6) return '$'+(v/1e6).toFixed(2)+'M';
    if(v >= 1e3) return '$'+(v/1e3).toFixed(1)+'K';
    return '$'+Math.round(v).toLocaleString();
  }
  function kpiCard(label, value, accent, icon){
    return '<div style="padding:.85rem;border:1px solid var(--border);border-radius:12px;background:#fff;min-width:0">'+
      '<div style="display:flex;align-items:center;gap:6px;font-size:.58rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;font-weight:700">'+
        (icon ? '<span style="font-size:.85rem">'+icon+'</span>' : '')+
        '<span>'+escHtml(label)+'</span>'+
      '</div>'+
      '<div style="font-size:1.1rem;font-weight:800;color:'+(accent||'var(--text)')+';margin-top:5px;word-break:break-all">'+value+'</div>'+
    '</div>';
  }

  var roleLabel = isExp ? '📤 Eksport savdo tafsilotlari' : (isImp ? '📥 Import savdo tafsilotlari' : '🤝 Savdo tafsilotlari');
  var accentColor = isExp ? '#059669' : (isImp ? '#7C3AED' : '#465fff');
  var bgColor = isExp ? 'linear-gradient(180deg,#fff,#F0FDF4)' : (isImp ? 'linear-gradient(180deg,#fff,#FAF5FF)' : 'linear-gradient(180deg,#fff,#EEF2FF)');
  var subTitle = isExp ? 'Bu eksportyor kompaniyaning savdo aloqalari' : (isImp ? 'Bu importyor kompaniyaning savdo aloqalari' : 'Savdo aloqalari');

  // Hamkor partnerlar listasi
  var allPartners = [];
  partners.forEach(function(p){ allPartners.push(Object.assign({_src:'partners'}, p)); });
  partnerOf.forEach(function(p){ allPartners.push(Object.assign({_src:'partnerOf'}, p)); });
  // Dublikat olib tashlash (kompaniya nomi bo'yicha)
  var seen = Object.create(null);
  allPartners = allPartners.filter(function(p){
    var k = String(p.kompaniya||'').trim().toLowerCase();
    if(!k || seen[k]) return false;
    seen[k] = true;
    return true;
  });
  // Hajm bo'yicha tartiblash (eng yirikdan)
  allPartners.sort(function(a, b){ return Number(b.totalQty||0) - Number(a.totalQty||0); });

  var partnerRowsHtml = allPartners.map(function(p){
    var pCountry = String(p.davlat || p.country || '').trim();
    var flag = (typeof getFinderCountryFlag === 'function' && pCountry) ? getFinderCountryFlag(pCountry) : '';
    var pRole = String(p.role || '').toLowerCase();
    var pRoleLabel = pRole === 'importer' ? '📥 Importyor' : (pRole === 'exporter' ? '📤 Eksportyor' : '');
    var pAccent = pRole === 'importer' ? '#7C3AED' : (pRole === 'exporter' ? '#059669' : '#465fff');
    var qtyTxt = fmtKg(p.totalQty);
    var valTxt = fmtUsd(p.totalValue);
    var dateTxt = p.lastDate ? String(p.lastDate).slice(0,10) : '';
    return '<tr>'+
      '<td style="padding:8px 10px;font-size:.72rem;border-bottom:1px solid var(--border)">'+
        (pRoleLabel ? '<span style="display:inline-block;padding:2px 7px;border-radius:5px;background:'+pAccent+'18;color:'+pAccent+';font-size:.55rem;font-weight:800;letter-spacing:.04em;margin-right:6px">'+pRoleLabel+'</span>' : '')+
        '<b style="color:var(--text)">'+escHtml(p.kompaniya || '—')+'</b>'+
        (pCountry ? '<div style="font-size:.62rem;color:var(--text3);margin-top:2px">'+(flag?flag+' ':'')+escHtml(pCountry)+'</div>' : '')+
      '</td>'+
      '<td style="padding:8px 10px;font-size:.72rem;font-weight:700;color:#0EA5E9;text-align:right;border-bottom:1px solid var(--border);white-space:nowrap">'+qtyTxt+'</td>'+
      '<td style="padding:8px 10px;font-size:.72rem;font-weight:700;color:#16A34A;text-align:right;border-bottom:1px solid var(--border);white-space:nowrap">'+valTxt+'</td>'+
      '<td style="padding:8px 10px;font-size:.65rem;color:var(--text2);text-align:right;border-bottom:1px solid var(--border);white-space:nowrap">'+(dateTxt?'📅 '+escHtml(dateTxt):'—')+'</td>'+
    '</tr>';
  }).join('');

  return '<div style="padding:1rem;border:1px solid '+accentColor+'33;border-radius:16px;background:'+bgColor+';margin-bottom:1rem">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:.85rem">'+
      '<div style="width:32px;height:32px;border-radius:8px;background:'+accentColor+';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.85rem">📊</div>'+
      '<div>'+
        '<div style="font-family:\'Sora\',sans-serif;font-size:.9rem;font-weight:800;color:var(--text)">'+roleLabel+'</div>'+
        '<div style="font-size:.62rem;color:var(--text3);margin-top:2px">'+subTitle+'</div>'+
      '</div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.55rem;margin-bottom:.9rem">'+
      kpiCard('Jami hajm', fmtKg(totalQty), '#0EA5E9', '📦')+
      kpiCard('Jami qiymat', fmtUsd(totalVal), '#16A34A', '💰')+
      (totalDocs ? kpiCard('Shipmentlar', totalDocs.toLocaleString(), '#F97316', '🚢') : '')+
      (lastDate ? kpiCard('So\'nggi sana', escHtml(lastDate), '#7C3AED', '📅') : '')+
      (firstDate && firstDate !== lastDate ? kpiCard('Birinchi sana', escHtml(firstDate), '#6366F1', '📆') : '')+
    '</div>'+
    (partnerRowsHtml ?
      '<div style="font-size:.62rem;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px;margin-top:.5rem">Hamkor kompaniyalar bo\'yicha taqsimot ('+allPartners.length+' ta)</div>'+
      '<div style="overflow-x:auto;border:1px solid var(--border);border-radius:10px;background:#fff">'+
        '<table style="width:100%;border-collapse:collapse">'+
          '<thead style="background:#F8FAFC">'+
            '<tr>'+
              '<th style="padding:8px 10px;text-align:left;font-size:.62rem;font-weight:700;color:var(--text2);letter-spacing:.04em;text-transform:uppercase">Kompaniya</th>'+
              '<th style="padding:8px 10px;text-align:right;font-size:.62rem;font-weight:700;color:var(--text2);letter-spacing:.04em;text-transform:uppercase">Hajm</th>'+
              '<th style="padding:8px 10px;text-align:right;font-size:.62rem;font-weight:700;color:var(--text2);letter-spacing:.04em;text-transform:uppercase">Qiymat</th>'+
              '<th style="padding:8px 10px;text-align:right;font-size:.62rem;font-weight:700;color:var(--text2);letter-spacing:.04em;text-transform:uppercase">Sana</th>'+
            '</tr>'+
          '</thead>'+
          '<tbody>'+partnerRowsHtml+'</tbody>'+
        '</table>'+
      '</div>'
    : '')+
  '</div>';
}
window.renderExportTradeSection = renderExportTradeSection;

function openInvestorDetailModal(id){
  // Foydalanuvchi text tanlagan (kopirovat qilayotgan) bo'lsa — modal ochilmaydi
  try {
    var sel = window.getSelection ? window.getSelection() : null;
    var selText = sel ? String(sel.toString() || '').trim() : '';
    if(selText.length > 0) return; // text tanlangan — modal yopiq qoladi
  } catch(_e){}
  _investorDetailId = String(id || '');
  var rec = (DB.investorCompanies || []).find(function(item){ return String(item.id) === _investorDetailId; });
  if(!rec) return;
  var modal = document.getElementById('investorDetailModal');
  var subtitle = document.getElementById('investorDetailSubtitle');
  var body = document.getElementById('investorDetailBody');
  if(!modal || !subtitle || !body) return;
  subtitle.textContent = rec.kompaniya || 'Investor tafsilotlari';
  var locationText = getInvestorCompanyLocation(rec) || '—';
  var sohaValue = getInvestorSohaValue(rec) || '—';
  var linkedinUrl = rec.linkedin ? (String(rec.linkedin).startsWith('http') ? rec.linkedin : 'https://' + String(rec.linkedin).replace(/^\/+/, '')) : '';
  body.innerHTML =
    '<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.85fr);gap:1rem;align-items:start">'+
      '<div style="display:grid;gap:1rem">'+
      '<div style="padding:1rem;border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,#fff,#f8fbff)">'+
        '<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:.9rem">'+
          renderPersonNameWithPhoto(rec.rahbar, rec.photoUrl || rec.photo_url, rec.lavozim?'<div style="font-size:.72rem;color:var(--text3);margin-top:2px">'+escHtml(rec.lavozim)+'</div>':'', 56)+
        '</div>'+
        '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem">'+
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Kompaniya</div><div style="font-size:.9rem;font-weight:800;color:var(--text);margin-top:4px">'+escHtml(rec.kompaniya || '—')+'</div></div>'+
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Kompaniya manzili</div><div style="font-size:.85rem;font-weight:700;color:var(--text);margin-top:4px">'+escHtml(locationText)+'</div></div>'+
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Soha / mahsulot</div><div style="font-size:.85rem;font-weight:700;color:var(--text);margin-top:4px">'+escHtml(sohaValue)+'</div></div>'+
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Email</div><div style="font-size:.85rem;font-weight:700;color:#4361EE;margin-top:4px;word-break:break-word">'+(rec.email ? escHtml(rec.email) : '<span style=\"color:var(--text3)\">—</span>')+'</div></div>'+
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Xodimlar</div><div style="font-size:.95rem;font-weight:800;color:var(--text);margin-top:4px">'+escHtml(rec.xodimlar || '—')+'</div></div>'+
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff" title="'+escHtml(rec.daromad || '')+'"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Daromad</div><div style="font-size:.95rem;font-weight:800;color:var(--text);margin-top:4px">'+escHtml(formatRevenue(rec.daromad))+'</div></div>'+
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">T/yil</div><div style="font-size:.95rem;font-weight:800;color:var(--text);margin-top:4px">'+escHtml(rec.tpilyil || '—')+'</div></div>'+
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Telefon</div><div style="font-size:.85rem;font-weight:700;color:var(--text);margin-top:4px">'+escHtml(rec.telefon || rec.tel || '—')+'</div></div>'+
        '</div>'+
        '<div style="margin-top:.9rem;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem">'+
          '<div style="padding:1rem;border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,#fff,#fbfcff)">'+
            '<div style="font-family:\'Sora\',sans-serif;font-size:.82rem;font-weight:800;color:var(--text);margin-bottom:.55rem">Aloqa va status</div>'+
            '<div style="font-size:.76rem;color:var(--text2);line-height:1.7"><b>Rahbar:</b> '+escHtml(rec.rahbar || '—')+'<br><b>Lavozim:</b> '+escHtml(rec.lavozim || '—')+'<br><b>Email holati:</b> '+getEmailStatusBadge(rec)+'<br><b>Manba:</b> '+escHtml(rec.manba || '—')+'</div>'+
          '</div>'+
          '<div style="padding:1rem;border:1px solid var(--border);border-radius:16px;background:linear-gradient(180deg,#fff,#fbfcff)">'+
            '<div style="font-family:\'Sora\',sans-serif;font-size:.82rem;font-weight:800;color:var(--text);margin-bottom:.55rem">Tashqi havolalar</div>'+
            '<div style="display:grid;gap:.55rem">'+
              '<div style="font-size:.76rem;color:var(--text2)"><b>Website:</b> '+(rec.website ? '<a href="'+tgEscapeAttr(rec.website)+'" target="_blank" rel="noopener" style="color:#2563EB;text-decoration:none">'+escHtml(rec.website)+'</a>' : '—')+'</div>'+
              '<div style="font-size:.76rem;color:var(--text2)"><b>LinkedIn:</b> '+(linkedinUrl ? '<a href="'+tgEscapeAttr(linkedinUrl)+'" target="_blank" rel="noopener" style="color:#0A66C2;text-decoration:none">Profilni ochish</a>' : '—')+'</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div style="margin-top:.9rem;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap">'+
          '<button type="button" onclick="enrichAndReopen(\''+rec.id+'\')" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:linear-gradient(135deg,#059669,#06D6A0);color:#fff;border:none;border-radius:10px;font-size:.78rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(5,150,105,.25)" title="Apollo people_search — credit ishlatmaydi">⚡ Yangilash <span style="font-size:.62rem;background:rgba(255,255,255,.25);padding:2px 6px;border-radius:6px">bepul</span></button>'+
          '<button type="button" onclick="enrichAndReopenPaid(\''+rec.id+'\')" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:linear-gradient(135deg,#7C3AED,#465fff);color:#fff;border:none;border-radius:10px;font-size:.78rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(124,58,237,.25)" title="Apollo org_enrichment — telefon va to\'liq ma\'lumot, 1 credit">💎 To\'liq ma\'lumot <span style="font-size:.62rem;background:rgba(255,255,255,.25);padding:2px 6px;border-radius:6px">1 credit</span></button>'+
        '</div>'+
      '</div>'+
      renderExportTradeSection(rec)+
      renderTradeAtlasDetailSection(rec)+
      '</div>'+
      '<div>'+renderWebsiteAiProfileSection(rec)+'</div>'+
    '</div>';
  modal.classList.add('open');
  modal.style.display = 'flex';

  // Auto-fetch AI profile — website bo'lsa saytdan, bo'lmasa Gemini knowledge orqali
  if(!rec.websiteAiProfile && rec.kompaniya && !rec._autoFetchingProfile){
    rec._autoFetchingProfile = true;
    setTimeout(function(){
      if(typeof enrichFromWebsite === 'function'){
        enrichFromWebsite(rec.id).finally(function(){ rec._autoFetchingProfile = false; });
      }
    }, 400);
  }
}
window.openInvestorDetailModal = openInvestorDetailModal;

// Investor base record uchun: Apollo → Gemini orqali lead topish
window.findContactsForInvestorRecord = async function(recordId, btnEl){
  if(!recordId) return;
  var rec = (DB.investorCompanies || []).find(function(r){ return String(r.id) === String(recordId); });
  if(!rec){
    if(typeof toast === 'function') toast('Record topilmadi','error');
    return;
  }
  if(btnEl){
    btnEl.disabled = true;
    btnEl.textContent = '⏳ Qidirilmoqda...';
    btnEl.style.opacity = '.7';
  }
  // Sintetik finder result item yaratamiz Apollo/Gemini funksiyalari uchun
  var item = {
    id: rec.id,
    kompaniya: rec.kompaniya || '',
    davlat: rec.davlat || '',
    shahar: rec.shahar || '',
    website: rec.website || '',
    email: rec.email || '',
    telefon: rec.telefon || '',
    rahbar: rec.rahbar || '',
    lavozim: rec.lavozim || '',
    linkedin: rec.linkedin || '',
    soha: rec.soha || '',
    manba: rec.manba || 'TradeAtlas',
    finderMode: rec.finderMode || 'exporters',
    score: rec.score || 70
  };
  var prod = null;
  if(rec.productId){
    prod = (DB.products || []).find(function(p){ return String(p.id) === String(rec.productId); }) || null;
  }
  if(!prod){
    prod = { name_en: rec.mahsulotNomi || rec.soha || '', hs_code: rec.mahsulotHs || '', id: rec.productId || '' };
  }
  var meta = { mode: String(rec.finderMode || 'exporters').toLowerCase() };
  var foundSource = '';
  try {
    // Faqat Gemini orqali qidirish (Apollo subscription tugagan)
    if(typeof geminiEnrichTradeAtlasItem === 'function'){
      if(btnEl) btnEl.textContent = '✨ Gemini qidirmoqda...';
      await geminiEnrichTradeAtlasItem(item, prod, meta);
      if(String(item.email || '').trim() || String(item.rahbar || '').trim()){
        foundSource = 'Gemini';
      }
    } else {
      throw new Error('Gemini funksiyasi mavjud emas');
    }
  } catch(e){
    console.error('[findContactsForInvestorRecord] error:', e && e.message);
    if(typeof toast === 'function') toast('Xatolik: ' + (e && e.message || ''), 'error');
  }
  if(foundSource){
    // Topilgan ma'lumotlarni record'ga yozamiz va saqlaymiz
    if(item.email) rec.email = item.email;
    if(item.rahbar) rec.rahbar = item.rahbar;
    if(item.lavozim) rec.lavozim = item.lavozim;
    if(item.telefon) rec.telefon = item.telefon;
    if(item.linkedin) rec.linkedin = item.linkedin;
    if(item.website && !rec.website) rec.website = item.website;
    if(item.shahar && !rec.shahar) rec.shahar = item.shahar;
    if(item.soha && !rec.soha) rec.soha = item.soha;
    if(typeof fbSave === 'function') fbSave('investorCompanies', rec);
    if(typeof toast === 'function'){
      toast('✅ Lead topildi: ✨ Gemini — ' + rec.kompaniya, 'success');
    }
    if(typeof renderInvestorCompanies === 'function') renderInvestorCompanies();
  } else {
    if(typeof toast === 'function') toast('⚠️ Lead topilmadi: ' + rec.kompaniya, 'error');
    if(btnEl){
      btnEl.disabled = false;
      btnEl.textContent = '🔍 Lead topish';
      btnEl.style.opacity = '1';
    }
  }
};

function openInvestorSohaEdit(id){
  // Text tanlangan bo'lsa — modal/edit ochilmaydi (kopirovat qilish uchun)
  try {
    var _sel = window.getSelection ? window.getSelection() : null;
    if(_sel && String(_sel.toString() || '').trim().length > 0) return;
  } catch(_e){}
  _investorSohaEditId = String(id || '');
  renderInvestorCompanies();
  setTimeout(function(){
    var inp = document.getElementById('investor-soha-input-' + id);
    if(inp){
      inp.focus();
      inp.select();
    }
  }, 20);
}
window.openInvestorSohaEdit = openInvestorSohaEdit;

function cancelInvestorSohaEdit(){
  _investorSohaEditId = '';
  renderInvestorCompanies();
}
window.cancelInvestorSohaEdit = cancelInvestorSohaEdit;

async function saveInvestorSohaEdit(id){
  var rec = (DB.investorCompanies || []).find(function(item){ return String(item.id) === String(id); });
  if(!rec) return;
  var inp = document.getElementById('investor-soha-input-' + id);
  var value = String((inp && inp.value) || '').trim();
  rec.soha = value;
  rec.mahsulotNomi = value;
  if(typeof fbSave === 'function') await fbSave('investorCompanies', rec);
  _investorSohaEditId = '';
  renderInvestorCompanies();
  toast('✅ Soha yangilandi');
}
window.saveInvestorSohaEdit = saveInvestorSohaEdit;

function investorCompanyMatchesProductFilter(rec, product){
  rec = rec || {};
  product = product || null;
  if(!product) return true;

  var productId = String(product.id || '').trim();
  var recordProductId = String(rec.mahsulotProductId || rec.productId || '').trim();

  if(productId && recordProductId && productId === recordProductId) return true;

  // Manual HS kodli virtual product — faqat HS kod bo'yicha solishtirish
  if(productId.indexOf('manual_hs_') === 0){
    var virtualHs = productId.replace(/^manual_hs_/, '').replace(/\D/g,'');
    var recHs = String(rec.mahsulotHs || rec.hsCode || '').replace(/\D/g,'');
    if(virtualHs && recHs && virtualHs === recHs) return true;
    // mahsulotNomi ichida HS kod yozilgan bo'lishi mumkin (masalan "HS 731822 - Temir-po'lat")
    var nameMatch = String(rec.mahsulotNomi || '').match(/HS\s*(\d{2,10})/i);
    if(nameMatch && nameMatch[1] === virtualHs) return true;
    return false;
  }

  var companyFields = [
    String(rec.mahsulotNomi || '').trim(),
    String(rec.soha || '').trim()
  ].filter(Boolean).map(apolloNormalizeText).filter(Boolean);
  if(!companyFields.length) return false;

  var explicitUz = String(product.name_uz || '').trim();
  var bilingualName = String(formatBilingualProductName(product) || '').trim();
  var candidates = [
    String(product.name_en || '').trim(),
    explicitUz,
    bilingualName
  ].filter(Boolean).map(apolloNormalizeText).filter(Boolean).filter(function(token, idx, arr){
    return arr.indexOf(token) === idx;
  });

  return companyFields.some(function(field){
    return candidates.some(function(token){
      return field === token || (token.length >= 10 && field.indexOf(token) !== -1);
    });
  });
}

var _icPage = _icPage || 1;
var IC_PAGE_SIZE = 15;
function toggleIcTableCard(){
  var card = document.getElementById('icTableCard');
  if(!card) return;
  if(card.style.display === 'none'){
    card.style.display = '';
    card.scrollIntoView({behavior:'smooth', block:'start'});
  } else {
    card.style.display = 'none';
  }
}
function showIcTableCard(){
  var card = document.getElementById('icTableCard');
  if(card) { card.style.display = ''; card.scrollIntoView({behavior:'smooth', block:'start'}); }
}
/* ═══ DEBOUNCE: renderInvestorCompanies ═══ */
var _icRenderTimer = null;
var _icGeoHash = '';
function renderInvestorCompanies(){
  if(_icRenderTimer) clearTimeout(_icRenderTimer);
  _icRenderTimer = setTimeout(_renderInvestorCompaniesNow, 60);
}
/* Apollo / TradeAtlas KPI kartochkasi bosilganda manbasiga qarab filter qo'llash (toggle).
   source = null bo'lsa filter butunlay olib tashlanadi (Jami bosilganda chaqiriladi) */
window.filterInvestorsBySource = function(source){
  var current = window._investorSourceFilter || null;
  if(source === null){
    // Filter butunlay olib tashlash (Jami bosilganda)
    if(current){
      window._investorSourceFilter = null;
      if(typeof toast === 'function') toast('Barcha kompaniyalar — filter olib tashlandi', 'info');
    }
  } else if(current === source){
    // Bir xil source ikki marta bosilsa — filter olib tashlanadi
    window._investorSourceFilter = null;
    if(typeof toast === 'function') toast('Filter olib tashlandi — barcha kompaniyalar', 'info');
  } else {
    window._investorSourceFilter = source;
    var label = source === 'apollo' ? 'Apollo' : (source === 'tradeatlas' ? 'TradeAtlas' : source);
    if(typeof toast === 'function') toast('Filter: faqat ' + label + ' manbasidagi kompaniyalar', 'info');
  }
  // Jadvalga scroll qilib o'tamiz (faqat aniq filter qo'llaganda — Jami bosilganda toggleIcTableCard o'zi qiladi)
  if(source !== null){
    var card = document.getElementById('icTableCard');
    if(card){ card.style.display = ''; card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }
  if(typeof renderInvestorCompanies === 'function') renderInvestorCompanies();
};
function _renderInvestorCompaniesNow(){
  _icRenderTimer = null;
  /* delegated to the main (second) definition below */
  if(typeof _renderInvestorCompaniesMain === 'function') return _renderInvestorCompaniesMain();
}

function investorWebsiteDomain(value){
  var site = String(value || '').trim().toLowerCase();
  if(!site) return '';
  site = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
  site = site.split('/')[0] || '';
  return site;
}

function getInvestorCompanyGroupKey(rec){
  rec = rec || {};
  var normalizeText = (typeof apolloNormalizeText === 'function')
    ? apolloNormalizeText
    : function(v){
        return String(v || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g,' ')
          .replace(/\s+/g,' ')
          .trim();
      };
  var companyKey = (typeof apolloCompanyKey === 'function')
    ? apolloCompanyKey(rec.kompaniya || '')
    : normalizeText(rec.kompaniya || '')
        .replace(/\b(co|company|corp|corporation|ltd|llc|inc|group|holding|holdings|limited|plc|sa|ag|gmbh|pte|pty)\b/g,'')
        .replace(/\s+/g,' ')
        .trim();
  var countryKey = normalizeText(rec.davlat || rec.country || '');
  if(companyKey){
    return companyKey + '|' + countryKey;
  }
  var siteKey = investorWebsiteDomain(rec.website || '');
  var cityKey = normalizeText(rec.shahar || rec.city || '');
  return [siteKey || 'no-company', countryKey, cityKey].join('|');
}

_renderInvestorCompaniesMain = function(){
  // Avvalgi render'lardan qoldirilgan in-memory synthetic record'larni DB'dan olib tashlaymiz
  // (avvalgi bug — har render'da DB.investorCompanies o'sib boryotgan edi)
  if(Array.isArray(DB.investorCompanies)){
    var _cleaned = DB.investorCompanies.filter(function(r){
      return !(r && (r._isInMemoryOnly === true || String(r.id||'').indexOf('inmem_partner_') === 0));
    });
    if(_cleaned.length !== DB.investorCompanies.length){
      DB.investorCompanies = _cleaned;
    }
  }
  var rawCo = DB.investorCompanies || [];
  // Period filter
  var periodSel = document.getElementById('ic-period-select');
  var periodVal = periodSel ? periodSel.value : 'all';
  var range = (typeof getCrmPeriodRange==='function') ? (function(){
    var saved = periodSel ? periodSel.value : 'all';
    var dummy = document.getElementById('crm-period-select');
    var origVal = dummy ? dummy.value : null;
    if(dummy) dummy.value = saved;
    var r = getCrmPeriodRange();
    if(dummy && origVal !== null) dummy.value = origVal;
    return r;
  })() : null;
  const allCo = (range && typeof inRange==='function') ? rawCo.filter(function(c){return inRange(c, range);}) : rawCo;

  var productFilter = null;
  if(_investorProductFilterId){
    var pidStr = String(_investorProductFilterId);
    // Manual HS kod virtual product — DB.products'da yo'q
    if(pidStr.indexOf('manual_hs_') === 0){
      var manualHsCode = pidStr.replace(/^manual_hs_/, '').replace(/\D/g,'');
      productFilter = {
        id: pidStr,
        hs_code: manualHsCode,
        name_uz: 'HS ' + manualHsCode,
        name_en: 'HS ' + manualHsCode,
        _isManualHs: true
      };
    } else {
      productFilter = (DB.products || []).find(function(item){ return String(item.id || '') === pidStr; }) || null;
    }
  }

  // Source filter — Apollo yoki TradeAtlas KPI kartochkasi bosilganda
  var _sourceFilter = window._investorSourceFilter || null;
  function _matchesSourceFilter(rec){
    if(!_sourceFilter) return true;
    var src = String(rec.manba || rec.source || '').toLowerCase();
    if(_sourceFilter === 'apollo') return src.indexOf('apollo') !== -1;
    if(_sourceFilter === 'tradeatlas') return src.indexOf('tradeatlas') !== -1 || src === 'trade';
    return true;
  }
  // Record importyor ekanligini aniqlash — finderMode + _partners + _partnerOf'dan
  function _isImporterRec(r){
    var fm = String(r.finderMode || r.role || '').toLowerCase();
    if(fm === 'importers' || fm === 'importer') return true;
    if(fm === 'exporters' || fm === 'exporter') return false;
    // Fallback: agar _partners[0].role === 'importer' bo'lsa, BU rec eksportyor (sherigi importer)
    if(Array.isArray(r._partners) && r._partners.length){
      var pr0 = String((r._partners[0] || {}).role || '').toLowerCase();
      if(pr0 === 'importer') return false;
      if(pr0 === 'exporter') return true;
    }
    // _partnerOf[0].role === 'exporter' bo'lsa, BU rec importer (parent eksportyor)
    if(Array.isArray(r._partnerOf) && r._partnerOf.length){
      var po0 = String((r._partnerOf[0] || {}).role || '').toLowerCase();
      if(po0 === 'exporter') return true;
      if(po0 === 'importer') return false;
    }
    return false; // noma'lum — eksportyor deb hisoblanadi
  }
  // Jami uchun "filtersiz" total (geo/source/product qo'llanmagan, faqat eksportyor + period)
  // Source filter aktiv bo'lganda Jami KPI shu raqamni saqlaydi
  // Apollo va TradeAtlas badge'lari ham shu yerdan filtersiz total'ni oladi
  var _jamiBaseGroupKeys = Object.create(null);
  var _apolloBaseGroupKeys = Object.create(null);
  var _taBaseGroupKeys = Object.create(null);
  allCo.forEach(function(r){
    if(_isImporterRec(r)) return;
    var gk = (typeof getInvestorCompanyGroupKey === 'function') ? getInvestorCompanyGroupKey(r) : String(r.kompaniya || '').toLowerCase();
    if(!gk) return;
    _jamiBaseGroupKeys[gk] = true;
    var src = String(r.manba || r.source || '').toLowerCase().trim();
    if(src.indexOf('apollo') !== -1 || src === 'csv-import' || src === 'finder') _apolloBaseGroupKeys[gk] = true;
    if(src.indexOf('tradeatlas') !== -1 || src.indexOf('trade atlas') !== -1 || src === 'trade' || src === 'ta') _taBaseGroupKeys[gk] = true;
  });
  var _jamiBaseTotal = Object.keys(_jamiBaseGroupKeys).length;
  var _apolloBaseTotal = Object.keys(_apolloBaseGroupKeys).length;
  var _taBaseTotal = Object.keys(_taBaseGroupKeys).length;

  const co = allCo.filter(function(r){
    if(_isImporterRec(r)) return false;
    if(_investorGeoFilterStateCode){
      if(getInvestorGeoStateCode(r, window._investorGeoStateStats || {}) !== _investorGeoFilterStateCode) return false;
    }
    if(productFilter && !investorCompanyMatchesProductFilter(r, productFilter)) return false;
    if(!_matchesSourceFilter(r)) return false;
    return true;
  });

  var allGroupMap = Object.create(null);
  var apolloGroups = Object.create(null);
  var tradeAtlasGroups = Object.create(null);
  var groupRoles = Object.create(null); // key -> { hasExporter, hasImporter }
  var tayyor = 0, emailSent = 0, hasEmail = 0;
  var emailSentGroups = Object.create(null);
  var hasEmailGroups = Object.create(null);
  // Har group uchun exporter/importer aniqlash — jadvaldagi 279 ta bilan to'liq mos
  // Apollo va TradeAtlas count xarita bilan mos: faqat geo code valid bo'lgan kompaniyalar
  allCo.forEach(function(rec){
    var key = getInvestorCompanyGroupKey(rec);
    if(!groupRoles[key]) groupRoles[key] = { hasExporter: false, hasImporter: false };
    var fm = String(rec.finderMode || rec.role || '').toLowerCase();
    var detectedExp = false, detectedImp = false;
    if(fm === 'exporters' || fm === 'exporter') detectedExp = true;
    if(fm === 'importers' || fm === 'importer') detectedImp = true;
    // Partners orqali rolni aniqlash
    if(Array.isArray(rec._partners) && rec._partners.some(function(p){
      return String(p.role||'').toLowerCase() === 'importer';
    })) detectedExp = true;
    if(Array.isArray(rec._partnerOf) && rec._partnerOf.some(function(p){
      return String(p.role||'').toLowerCase() === 'exporter';
    })) detectedImp = true;
    // _partners.role bo'sh bo'lsa-da, _partnerOf bilan kross-tekshiruv
    if(!detectedExp && !detectedImp && Array.isArray(rec._partners) && rec._partners.length){
      // _partners bor lekin role yo'q — bu rec ko'p hollarda eksportyor (sheriklari ham bor)
      detectedExp = true;
    }
    if(!detectedExp && !detectedImp && Array.isArray(rec._partnerOf) && rec._partnerOf.length){
      // _partnerOf bor — bu rec sherikning bolasi, ya'ni importyor
      detectedImp = true;
    }
    if(detectedExp) groupRoles[key].hasExporter = true;
    if(detectedImp) groupRoles[key].hasImporter = true;
    var src = String(rec.manba || rec.source || '').toLowerCase();
    var geoCode = (typeof getInvestorGeoStateCode === 'function') ? getInvestorGeoStateCode(rec, {}) : '';
    var hasGeo = !!geoCode;
    if(src.indexOf('apollo') !== -1 && hasGeo) apolloGroups[key] = true;
    if((src.indexOf('tradeatlas') !== -1 || src === 'trade') && hasGeo) tradeAtlasGroups[key] = true;
    if(rec.holat === 'Tayyor') tayyor++;
    if(rec.emailSent) emailSentGroups[key] = true;
    if(rec.email) hasEmailGroups[key] = true;
  });
  // Group eksportyor hisoblanadi: hasExporter true YOKI (hech qanday role aniqlanmagan)
  // Faqat aniq importyor (hasImporter && !hasExporter) tashlanadi
  var _importerCount = 0, _exporterCount = 0, _unknownCount = 0;
  Object.keys(groupRoles).forEach(function(key){
    var role = groupRoles[key];
    var isImporterOnly = role.hasImporter && !role.hasExporter;
    if(isImporterOnly){
      _importerCount++;
      // Importyor — apollo/TA count'lardan ham olib tashlash
      delete apolloGroups[key];
      delete tradeAtlasGroups[key];
    } else {
      allGroupMap[key] = true;
      if(role.hasExporter) _exporterCount++;
      else _unknownCount++;
    }
  });
  console.log('[KPI] Total records:', allCo.length, '| Unique groups:', Object.keys(groupRoles).length, '| Exporter:', _exporterCount, '| Importer-only:', _importerCount, '| Unknown:', _unknownCount, '| Counted:', Object.keys(allGroupMap).length);
  emailSent = Object.keys(emailSentGroups).length;
  hasEmail = Object.keys(hasEmailGroups).length;
  const total = allCo.reduce(function(s, r){ return s + (parseFloat(r.summa) || 0); }, 0);
  var groupCount = Object.keys(allGroupMap).length;
  var apolloCount = Object.keys(apolloGroups).length;
  var tradeAtlasCount = Object.keys(tradeAtlasGroups).length;
  document.getElementById('ic-k1').innerHTML = groupCount + ' <span class="kpi-unit">ta</span>';
  document.getElementById('ic-k2').innerHTML = tayyor + ' <span class="kpi-unit">ta</span>';
  document.getElementById('ic-k3').innerHTML = emailSent + '/' + hasEmail + ' <span class="kpi-unit">ta</span>';
  const ic4 = document.getElementById('ic-k4'); if(ic4) ic4.textContent = '$' + Math.round(total / 1e6) + 'M';
  var apolloEl = document.getElementById('ic-k-apollo');
  if(apolloEl) apolloEl.textContent = apolloCount;
  var taEl = document.getElementById('ic-k-tradeatlas');
  if(taEl) taEl.textContent = tradeAtlasCount;
  // Sidebar badge — agar avvalgi visible count mavjud bo'lsa, undan foydalanish
  // Aks holda groupCount (override pastda visibleGroups bilan ishlaydi)
  var _badgeInitVal = (window._icCounts && typeof window._icCounts.jami === 'number') ? window._icCounts.jami : groupCount;
  document.getElementById('badge-investorco').textContent = _badgeInitVal;

  /* Geo karta va pie chart visibleGroups asosida pastda chiqariladi (visibleRecords) */
  if(typeof renderInvestorProductFilterPicker === 'function'){
    renderInvestorProductFilterPicker();
  }

  var filterBar = document.getElementById('investorGeoFilterBar');
  var filterLabel = document.getElementById('investorGeoFilterLabel');
  if(filterBar){
    if(_investorGeoFilterStateCode && window._investorGeoStateStats && window._investorGeoStateStats[_investorGeoFilterStateCode]){
      filterBar.style.display = 'flex';
      if(filterLabel){
        var filterInfo = window._investorGeoStateStats[_investorGeoFilterStateCode];
        filterLabel.textContent = (filterInfo.name || _investorGeoFilterStateCode) + ' (' + co.length + ' ta kontakt)';
      }
    } else {
      filterBar.style.display = 'none';
      if(filterLabel) filterLabel.textContent = 'Davlat';
    }
  }

  // ═══ Backfill: hamkor recordlarni avto-yaratish (DB'da yo'q bo'lsa) ═══
  // IKKALA yo'nalishdan ham — _partnerOf VA _partners (sayohatchi tomonida turli yo'nalishlarda saqlanadi)
  var _existingNamesLower = Object.create(null);
  (DB.investorCompanies || []).forEach(function(r){
    var k = String(r.kompaniya || '').trim().toLowerCase();
    if(k) _existingNamesLower[k] = r;
  });
  var _backfillNeeded = [];
  function _createSyntheticFromPartner(rec, p, partnerRoleOverride){
    if(!p || !p.kompaniya) return;
    var nm = String(p.kompaniya).trim().toLowerCase();
    if(!nm || _existingNamesLower[nm]) return;
    var role = partnerRoleOverride || String(p.role || '').toLowerCase();
    if(role !== 'exporter' && role !== 'importer') return;
    var oppositeRole = role === 'exporter' ? 'importer' : 'exporter';
    var syntheticRec = {
      id: 'syn_' + Date.now() + '_' + Math.random().toString(36).slice(2,7),
      kompaniya: p.kompaniya,
      davlat: p.davlat || p.country || '',
      shahar: p.cityState || '',
      soha: rec.soha || '',
      mahsulotNomi: rec.mahsulotNomi || '',
      productId: rec.productId || '',
      mahsulotHs: rec.mahsulotHs || '',
      manba: 'TradeAtlas',
      finderMode: role + 's',
      score: 70,
      rahbar: '', lavozim: '',
      email: p.email || '', telefon: p.tel || '', website: p.web || '',
      emailSent: false, holat: 'Yangi',
      _tradeAtlasTradeValue: p.totalValue || 0,
      _tradeAtlasQuantity: p.totalQty || 0,
      _tradeAtlasDocCount: p.docCount || 0,
      _tradeAtlasLastArrivalDate: p.lastDate || ''
    };
    // Ikki tomonlama bog'lanish — sintetik record ushbu rec bilan partnerlik aloqasi
    if(role === 'exporter'){
      // sintetik = eksportyor parent → uning _partners da rec (importer)
      syntheticRec._partners = [{
        kompaniya: rec.kompaniya || '', davlat: rec.davlat || '',
        countryCode: '', cityState: rec.shahar || '',
        email: rec.email || '', tel: rec.telefon || '', web: rec.website || '',
        role: 'importer',
        totalValue: p.totalValue || 0, totalQty: p.totalQty || 0,
        docCount: p.docCount || 0, lastDate: p.lastDate || ''
      }];
    } else {
      // sintetik = importer → uning _partnerOf da rec (eksportyor) parent
      syntheticRec._partnerOf = [{
        kompaniya: rec.kompaniya || '', davlat: rec.davlat || '',
        role: 'exporter',
        totalValue: p.totalValue || 0, totalQty: p.totalQty || 0,
        docCount: p.docCount || 0, lastDate: p.lastDate || ''
      }];
    }
    _existingNamesLower[nm] = syntheticRec;
    _backfillNeeded.push(syntheticRec);
  }
  co.forEach(function(rec){
    var recRole = String(rec.finderMode || '').toLowerCase();
    // Yo'nalish A: rec._partnerOf — bu rec hamkor bo'lgan parentlar (parent bilan bog'lanadi)
    var po = Array.isArray(rec._partnerOf) ? rec._partnerOf : [];
    po.forEach(function(p){
      // p.role = parent'ning roli, parent IS our partner here
      _createSyntheticFromPartner(rec, p);
    });
    // Yo'nalish B: rec._partners — bu rec'ning hamkorlari
    var ps = Array.isArray(rec._partners) ? rec._partners : [];
    ps.forEach(function(p){
      // p.role = partnerning roli (counterpart)
      _createSyntheticFromPartner(rec, p);
    });
  });
  // Sintetik recordlarni DB ga qo'shamiz va saqlaymiz
  if(_backfillNeeded.length){
    if(!Array.isArray(DB.investorCompanies)) DB.investorCompanies = [];
    _backfillNeeded.forEach(function(r){
      DB.investorCompanies.push(r);
      if(typeof fbSave === 'function') fbSave('investorCompanies', r);
    });
    // Sintetiklarni co'ga qo'shish — DOIM faqat eksportyorlar (importyor sinetiklar tashlanadi)
    _backfillNeeded.forEach(function(r){
      if(_isImporterRec(r)) return; // har holatda importyorlar yo'q
      if(_investorGeoFilterStateCode){
        var rCode = getInvestorGeoStateCode(r, window._investorGeoStateStats || {});
        if(rCode !== _investorGeoFilterStateCode) return;
      }
      co.push(r);
    });
  }

  // ═══ Filter bypass: xarita davlat filtri tufayli o'tib ketgan PARENT (eksportyor) recordlarini ham qo'shamiz ═══
  // FAQAT geo filter aktiv BO'LMAGANDA bypass ishlaydi.
  // Geo filter aktiv bo'lsa — boshqa davlat parent'larini olmaymiz (foydalanuvchi tanlovi bo'yicha)
  if(!_investorGeoFilterStateCode){
    var _coKeysSet = Object.create(null);
    co.forEach(function(r){
      var k = String(r.kompaniya || '').trim().toLowerCase();
      if(k) _coKeysSet[k] = true;
    });
    var _coSnapshot = co.slice();
    _coSnapshot.forEach(function(rec){
      var linked = [];
      (rec._partners || []).forEach(function(p){ if(p && p.kompaniya) linked.push(String(p.kompaniya).trim().toLowerCase()); });
      (rec._partnerOf || []).forEach(function(p){ if(p && p.kompaniya) linked.push(String(p.kompaniya).trim().toLowerCase()); });
      linked.forEach(function(nm){
        if(!nm || _coKeysSet[nm]) return;
        var existingRec = _existingNamesLower[nm];
        if(existingRec){
          co.push(existingRec);
          _coKeysSet[nm] = true;
        }
      });
    });
  }

  var groupedMap = Object.create(null);
  var grouped = [];
  co.forEach(function(rec){
    var key = getInvestorCompanyGroupKey(rec);
    if(!groupedMap[key]){
      groupedMap[key] = { key: key, records: [] };
      grouped.push(groupedMap[key]);
    }
    groupedMap[key].records.push(rec);
  });
  grouped.forEach(function(group){
    group.records.sort(function(a,b){
      var aId = Number(a && a.id);
      var bId = Number(b && b.id);
      if(Number.isFinite(aId) && Number.isFinite(bId)) return aId - bId;
      return String((a && a.id) || '').localeCompare(String((b && b.id) || ''));
    });
  });

  // ═══ Parent-Child reordering: EKSPORTYOR tepada → uning importyor xaridorlari pastida ═══
  function _detectGroupRole(group){
    var rec = group.records[0];
    if(!rec) return '';
    var mode = String(rec.finderMode || rec.role || '').toLowerCase();
    if(mode === 'exporters' || mode === 'exporter') return 'exporter';
    if(mode === 'importers' || mode === 'importer') return 'importer';
    // Fallback _partners[0].role'dan
    if(Array.isArray(rec._partners) && rec._partners.length){
      var fp = rec._partners[0];
      if(fp.role === 'importer') return 'exporter';
      if(fp.role === 'exporter') return 'importer';
    }
    if(Array.isArray(rec._partnerOf) && rec._partnerOf.length){
      var fr = rec._partnerOf[0];
      if(fr.role === 'exporter') return 'importer';
      if(fr.role === 'importer') return 'exporter';
    }
    return '';
  }
  // Har guruhga rolni biriktirib, name → group map yasaymiz
  var _groupByName = Object.create(null);
  grouped.forEach(function(g){
    g._role = _detectGroupRole(g);
    var nm = String((g.records[0] && g.records[0].kompaniya) || '').trim().toLowerCase();
    if(nm && !_groupByName[nm]) _groupByName[nm] = g;
  });
  // GROUP DARAJASIDA importyor guruhlarni butunlay tashlash (jadvalda IMPORTYOR badge'i ko'rinmasin)
  grouped = grouped.filter(function(g){ return g._role !== 'importer'; });
  // ═══ Parent → children map qurish (IKKALA yo'nalishdan) ═══
  // 1) Eksportyor record._partners[].role='importer' → child importerlar
  // 2) Importer record._partnerOf[].role='exporter' → bu importer parent eksportyorning bolasi
  var _parentToChildren = Object.create(null);
  function _addParentChildLink(parentName, childName){
    var pk = String(parentName || '').trim().toLowerCase();
    var ck = String(childName || '').trim().toLowerCase();
    if(!pk || !ck || pk === ck) return;
    if(!_parentToChildren[pk]) _parentToChildren[pk] = [];
    if(_parentToChildren[pk].indexOf(ck) === -1) _parentToChildren[pk].push(ck);
  }
  grouped.forEach(function(g){
    var rec = g.records[0];
    if(!rec) return;
    // Yo'nalish 1: eksportyor → uning importer xaridorlari (_partners)
    if(g._role === 'exporter' && Array.isArray(rec._partners)){
      rec._partners.forEach(function(p){
        if(String(p.role || '').toLowerCase() === 'importer'){
          _addParentChildLink(rec.kompaniya, p.kompaniya);
        }
      });
    }
    // Yo'nalish 2: importer → uning eksportyor manbai (_partnerOf, teskari)
    if(g._role === 'importer' && Array.isArray(rec._partnerOf)){
      rec._partnerOf.forEach(function(p){
        if(String(p.role || '').toLowerCase() === 'exporter'){
          _addParentChildLink(p.kompaniya, rec.kompaniya);
        }
      });
    }
    // Yo'nalish 3: importer → uning eksportyor manbalari (_partners[role='exporter'])
    // Importer parent search natijasida _partners ga eksportyor counterpartlar saqlangan
    if(g._role === 'importer' && Array.isArray(rec._partners)){
      rec._partners.forEach(function(p){
        if(String(p.role || '').toLowerCase() === 'exporter'){
          _addParentChildLink(p.kompaniya, rec.kompaniya);
        }
      });
    }
    // Yo'nalish 4: eksportyor → uning importer xaridorlari (_partnerOf[role='importer'])
    // Eksportyor counterpart bo'lib saqlanganda, _partnerOf'da importer parent ko'rinadi
    if(g._role === 'exporter' && Array.isArray(rec._partnerOf)){
      rec._partnerOf.forEach(function(p){
        if(String(p.role || '').toLowerCase() === 'importer'){
          _addParentChildLink(rec.kompaniya, p.kompaniya);
        }
      });
    }
  });

  // Yangi tartib: faqat eksportyor parent rowlarini ko'rsatamiz, child importerlar — hover'da chiqadi
  var _visited = Object.create(null);
  var _orderedGroups = [];
  var _displayCounter = 0;
  grouped.forEach(function(g){
    if(_visited[g.key]) return;
    if(g._role !== 'exporter') return;
    g._isParent = true;
    g._parentName = (g.records[0] && g.records[0].kompaniya) || '';
    _visited[g.key] = true;
    _displayCounter++;
    g._displayNumber = _displayCounter;
    _orderedGroups.push(g);
    var pk = String(g._parentName).trim().toLowerCase();
    var childNames = _parentToChildren[pk] || [];
    g._childrenData = []; // ekspandda ko'rsatish uchun yig'amiz
    var parentRec = g.records[0];
    var _addedChildKeys = Object.create(null); // dedupe
    // ═══ MANBA 1: _partners VA _partnerOf — TradeAtlas saqlangan barcha sheriklar ═══
    function _addPartnersFromArray(arr, expectedRole){
      if(!Array.isArray(arr)) return;
      arr.forEach(function(p){
        if(!p || !p.kompaniya) return;
        var pRole = String(p.role || '').toLowerCase();
        if(expectedRole && pRole && pRole !== expectedRole) return;
        var pName = String(p.kompaniya).trim();
        var pKey = pName.toLowerCase();
        if(!pKey || _addedChildKeys[pKey]) return;
        _addedChildKeys[pKey] = true;
        var existingChild = _groupByName[pKey];
        var childGk = existingChild ? existingChild.key : '';

        // Agar DB'da bu sherik kompaniya YO'Q bo'lsa — synthetic record + group yaratamiz
        // Shu orqali bosilganda full row (Lead topish + kontakt) chiqadi
        if(!existingChild){
          var syntheticRec = {
            id: 'inmem_partner_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            kompaniya: pName,
            davlat: p.davlat || p.country || '',
            shahar: p.cityState || '',
            soha: parentRec.soha || '',
            mahsulotNomi: parentRec.mahsulotNomi || '',
            productId: parentRec.productId || '',
            mahsulotHs: parentRec.mahsulotHs || '',
            manba: 'TradeAtlas',
            finderMode: 'importers',
            score: 70,
            rahbar: '', lavozim: '',
            email: p.email || '', telefon: p.tel || '', website: p.web || '',
            emailSent: false, holat: 'Yangi',
            _tradeAtlasTradeValue: Number(p.totalValue || 0),
            _tradeAtlasQuantity: Number(p.totalQty || 0),
            _tradeAtlasDocCount: Number(p.docCount || 0),
            _tradeAtlasLastArrivalDate: p.lastDate || '',
            _partnerOf: [{
              kompaniya: parentRec.kompaniya || '',
              davlat: parentRec.davlat || '',
              role: 'exporter',
              totalValue: Number(p.totalValue || 0),
              totalQty: Number(p.totalQty || 0),
              docCount: Number(p.docCount || 0),
              lastDate: p.lastDate || ''
            }],
            _isInMemoryOnly: true // Firebase'ga yuborilmaydi
          };
          var synthGroup = {
            key: 'inmem_' + pKey + '_' + Math.random().toString(36).slice(2,5),
            records: [syntheticRec],
            _role: 'importer',
            _isChild: true,
            _isHiddenChild: true,
            _isOrphan: false,
            _parentKey: g.key,
            _parentName: g._parentName,
            _displayNumber: g._displayNumber,
            _isInMemoryGroup: true
          };
          // FAQAT in-memory render uchun — DB.investorCompanies'ga PUSH QILMAYMIZ
          // (har render'da kumulyativ o'sib kompaniya soni ko'paymasligi uchun)
          _groupByName[pKey] = synthGroup;
          _visited[synthGroup.key] = true;
          _orderedGroups.push(synthGroup);
          existingChild = synthGroup;
          childGk = synthGroup.key;
        } else if(!_visited[existingChild.key]){
          // DB'da mavjud bo'lsa — hidden child sifatida belgilash
          existingChild._isChild = true;
          existingChild._isHiddenChild = true;
          existingChild._parentKey = g.key;
          existingChild._parentName = g._parentName;
          existingChild._displayNumber = g._displayNumber;
          _visited[existingChild.key] = true;
          _orderedGroups.push(existingChild);
        }

        g._childrenData.push({
          kompaniya: pName,
          davlat: p.davlat || p.country || '',
          shahar: p.cityState || '',
          totalQty: Number(p.totalQty || 0),
          totalValue: Number(p.totalValue || 0),
          lastDate: p.lastDate || '',
          docCount: Number(p.docCount || 0),
          childGroupKey: childGk
        });
      });
    }
    if(parentRec){
      _addPartnersFromArray(parentRec._partners, 'importer');
      _addPartnersFromArray(parentRec._partnerOf, 'importer');
    }
    // ═══ MANBA 2: DB'dagi child kompaniyalar — _parentToChildren orqali ═══
    childNames.forEach(function(childName){
      var child = _groupByName[childName];
      if(!child || _visited[child.key]) return;
      if(child._role !== 'importer' && child._role !== '') return;
      var childRec = child.records[0];
      if(childRec){
        var parentPartnersMatch = null;
        if(parentRec && Array.isArray(parentRec._partners)){
          parentPartnersMatch = parentRec._partners.find(function(p){
            return String(p.kompaniya || '').trim().toLowerCase() === childName;
          });
        }
        var childPartnerOfMatch = null;
        if(Array.isArray(childRec._partnerOf)){
          childPartnerOfMatch = childRec._partnerOf.find(function(p){
            return String(p.kompaniya || '').trim().toLowerCase() === pk;
          });
        }
        var matched = parentPartnersMatch || childPartnerOfMatch || {};
        // Agar yuqorida _partners orqali allaqachon qo'shilgan bo'lsa, dedupe orqali takror qo'shilmaydi
        if(!_addedChildKeys[childName]){
          _addedChildKeys[childName] = true;
          g._childrenData.push({
            kompaniya: childRec.kompaniya || '',
            davlat: childRec.davlat || '',
            shahar: childRec.shahar || '',
            totalQty: Number(matched.totalQty || childRec._tradeAtlasQuantity || 0),
            totalValue: Number(matched.totalValue || childRec._tradeAtlasTradeValue || 0),
            lastDate: matched.lastDate || childRec._tradeAtlasLastArrivalDate || '',
            docCount: Number(matched.docCount || childRec._tradeAtlasDocCount || 0),
            childGroupKey: child.key
          });
        }
      }
      child._isChild = true;
      child._isHiddenChild = true;
      child._parentKey = g.key;
      child._parentName = g._parentName;
      child._displayNumber = g._displayNumber;
      _visited[child.key] = true;
      _orderedGroups.push(child);
    });
  });
  // Eksportyor bo'lmagan orphan recordlarni ko'rsatmaslik
  grouped.forEach(function(g){
    if(_visited[g.key]) return;
    // Importer kompaniya — faqat HAQIQIY orphan (hech qanday partner linkage yo'q) yashiriladi
    // TradeAtlas'dan saqlangan importyorlarda _partnerOf mavjud → ko'rinadi
    if(g._role === 'importer'){
      var rec0 = (g.records && g.records[0]) || null;
      var hasLinkage = !!(rec0 && (
        (Array.isArray(rec0._partnerOf) && rec0._partnerOf.length) ||
        (Array.isArray(rec0._partners) && rec0._partners.length)
      ));
      if(!hasLinkage){
        _visited[g.key] = true;
        g._isHiddenChild = true;
        return;
      }
      // Linkage bor — ko'rsatamiz
    }
    _visited[g.key] = true;
    _displayCounter++;
    g._displayNumber = _displayCounter;
    g._isOrphan = true;
    _orderedGroups.push(g);
  });
  grouped = _orderedGroups;

  const tb = document.getElementById('ic-tbody');
  if(!grouped.length){
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--ta-gray-400);font-size:.85rem">Ma\'lumot topilmadi</td></tr>';
    if(typeof mountInvestorAiWorkspace === 'function') mountInvestorAiWorkspace();
    return;
  }

  // ═══ YANGI QOSHILGANLAR BIRINCHIDA — har group'ni eng yangi record ID/timestamp bo'yicha tartiblash ═══
  // ID timestamp asosida (Date.now() yoki shunga o'xshash) — eng katta birinchi
  function _maxRecTime(g){
    if(!g || !Array.isArray(g.records) || !g.records.length) return 0;
    var max = 0;
    g.records.forEach(function(r){
      // ID dan timestamp ajratish — masalan "fc_ta_partner_1735632000_xxx" yoki "1735632000" yoki Number
      var idStr = String(r.id || '');
      var nMatch = idStr.match(/(\d{10,})/); // 10+ raqamli timestamp (ms yoki s)
      var t = nMatch ? Number(nMatch[1]) : Number(r.id) || 0;
      if(Number.isFinite(t) && t > max) max = t;
      // sana yoki createdAt ham bor bo'lsa, shu ham hisobga olinadi
      var sd = Date.parse(r.createdAt || r.sana || '');
      if(Number.isFinite(sd) && sd > max) max = sd;
    });
    return max;
  }
  // Parent-child orderni saqlab, lekin har parent (visible) tartibini yangilik bo'yicha qaytadan tartiblash
  // _isHiddenChild larni ham parent tartibiga ergashtiramiz
  var _parentSorted = grouped.filter(function(g){ return !g._isHiddenChild; })
    .sort(function(a, b){ return _maxRecTime(b) - _maxRecTime(a); });
  var _childByParent = Object.create(null);
  grouped.forEach(function(g){
    if(g._isHiddenChild && g._parentKey){
      if(!_childByParent[g._parentKey]) _childByParent[g._parentKey] = [];
      _childByParent[g._parentKey].push(g);
    }
  });
  var _newOrder = [];
  var _displayCounter2 = 0;
  _parentSorted.forEach(function(parent){
    _displayCounter2++;
    parent._displayNumber = _displayCounter2;
    _newOrder.push(parent);
    var kids = _childByParent[parent.key] || [];
    kids.forEach(function(k){
      k._displayNumber = _displayCounter2;
      _newOrder.push(k);
    });
  });
  // Hidden child orphan'lar (parent topilmagan) — oxiriga qo'shiladi
  grouped.forEach(function(g){
    if(g._isHiddenChild && _newOrder.indexOf(g) === -1){
      _newOrder.push(g);
    }
  });
  grouped = _newOrder;

  // Pagination — faqat visible (non-hidden-child) kompaniyalar bo'yicha
  var visibleGroups = grouped.filter(function(g){ return !g._isHiddenChild; });
  // KPI ni jadvaldagi soniga moslashtirish — visibleGroups.length = jadvaldagi 279 ta
  // Hamma statistika visibleGroups dan hisoblanadi
  var visibleApolloGroups = Object.create(null);
  var visibleTaGroups = Object.create(null);
  var vTayyor = 0, vEmailSent = 0, vHasEmail = 0;
  var vEmailSentGroups = Object.create(null);
  var vHasEmailGroups = Object.create(null);
  var visibleRecords = []; // pie chart va geo karta uchun
  visibleGroups.forEach(function(g){
    if(!Array.isArray(g.records)) return;
    g.records.forEach(function(rec){
      visibleRecords.push(rec);
      var src = String(rec.manba || rec.source || '').toLowerCase().trim();
      if(src.indexOf('apollo') !== -1) visibleApolloGroups[g.key] = true;
      if(src.indexOf('tradeatlas') !== -1 || src.indexOf('trade atlas') !== -1 || src === 'trade' || src === 'ta') visibleTaGroups[g.key] = true;
      if(rec.holat === 'Tayyor') vTayyor++;
      if(rec.emailSent) vEmailSentGroups[g.key] = true;
      if(rec.email) vHasEmailGroups[g.key] = true;
    });
  });
  vEmailSent = Object.keys(vEmailSentGroups).length;
  vHasEmail = Object.keys(vHasEmailGroups).length;
  // "Jami" KPI — keyinroq _icStats yig'ilgandan keyin yangilanadi (pastki blok'da)
  var ic1El = document.getElementById('ic-k1');
  var ic2El = document.getElementById('ic-k2');
  if(ic2El) ic2El.innerHTML = vTayyor + ' <span class="kpi-unit">ta</span>';
  var ic3El = document.getElementById('ic-k3');
  if(ic3El) ic3El.innerHTML = vEmailSent + '/' + vHasEmail + ' <span class="kpi-unit">ta</span>';
  // Apollo/TradeAtlas badge'lari — group-level role detection bilan filtersiz to'liq son
  // (apolloCount/tradeAtlasCount = importyor-only group'lar olib tashlangan, jadvaldagi soniga to'liq mos)
  var apolloEl2 = document.getElementById('ic-k-apollo');
  if(apolloEl2) apolloEl2.textContent = apolloCount;
  var taEl2 = document.getElementById('ic-k-tradeatlas');
  if(taEl2) taEl2.textContent = tradeAtlasCount;
  // ═══ MARKAZLASHGAN STATISTIKA — barcha komponentlar shu yerdan o'qiydi ═══
  // SOURCE OF TRUTH: visibleGroups (jadvaldagi haqiqiy kompaniyalar)
  var statsByCountry = Object.create(null);
  var statsByCountryName = Object.create(null);
  var statsBySource = { apollo: 0, tradeatlas: 0, other: 0 };
  var statsByRole = { exporters: 0, importers: 0, unknown: 0 };
  // ═══ byCountry — `co` (filter qo'llangan, parent-child reorderdan oldin) bo'yicha ═══
  // Faqat eksportyor — Jami = xarita yig'indisi
  var _byCountrySeenGroups = Object.create(null);
  var _exporterGroupKeys = Object.create(null); // jami eksportyor sonini hisoblash
  co.forEach(function(rec){
    if(_isImporterRec(rec)) return;
    var code = (typeof getInvestorGeoStateCode === 'function') ? getInvestorGeoStateCode(rec, {}) : '';
    var groupKey = (typeof getInvestorCompanyGroupKey === 'function') ? getInvestorCompanyGroupKey(rec) : String(rec.kompaniya || '').toLowerCase();
    if(!groupKey) return;
    _exporterGroupKeys[groupKey] = true;
    if(!code) return;
    if(!_byCountrySeenGroups[code]) _byCountrySeenGroups[code] = Object.create(null);
    if(_byCountrySeenGroups[code][groupKey]) return;
    _byCountrySeenGroups[code][groupKey] = true;
    if(!statsByCountry[code]){
      statsByCountry[code] = { code: code, count: 0, companies: [], lat: null, lon: null, name: '' };
      var hub = (typeof getInvestorGeoHub === 'function') ? getInvestorGeoHub(rec) : null;
      if(hub){
        statsByCountry[code].lat = hub.lat;
        statsByCountry[code].lon = hub.lon;
        statsByCountry[code].name = hub.display || (typeof getInvestorGeoCountrySource === 'function' ? getInvestorGeoCountrySource(rec) : '') || code;
      } else {
        statsByCountry[code].name = (typeof getInvestorGeoCountrySource === 'function' ? getInvestorGeoCountrySource(rec) : '') || code;
      }
    }
    statsByCountry[code].count++;
    if(rec.kompaniya) statsByCountry[code].companies.push(String(rec.kompaniya));
    statsByCountryName[statsByCountry[code].name] = (statsByCountryName[statsByCountry[code].name] || 0) + 1;
  });
  var _exporterTotal = Object.keys(_exporterGroupKeys).length;

  // visibleGroups loop — role va source uchun saqlandi
  visibleGroups.forEach(function(g){
    if(!Array.isArray(g.records) || !g.records.length) return;
    var rec0 = g.records[0];
    // Role — group._role yoki record finderMode'dan
    var role = String(g._role || rec0.finderMode || rec0.role || '').toLowerCase();
    if(role === 'exporter' || role === 'exporters') statsByRole.exporters++;
    else if(role === 'importer' || role === 'importers') statsByRole.importers++;
    else {
      // _partners orqali aniqlash
      var hasImpPartner = Array.isArray(rec0._partners) && rec0._partners.some(function(p){ return String(p.role||'').toLowerCase() === 'importer'; });
      var hasExpPartnerOf = Array.isArray(rec0._partnerOf) && rec0._partnerOf.some(function(p){ return String(p.role||'').toLowerCase() === 'exporter'; });
      if(hasImpPartner) statsByRole.exporters++;
      else if(hasExpPartnerOf) statsByRole.importers++;
      else statsByRole.exporters++; // noma'lum — eksportyor deb hisoblanadi
    }
    // Source
    var hasApollo = false, hasTa = false;
    g.records.forEach(function(r){
      var src = String(r.manba || r.source || '').toLowerCase();
      if(src.indexOf('apollo') !== -1 || src === 'csv-import' || src === 'finder') hasApollo = true;
      if(src.indexOf('tradeatlas') !== -1 || src === 'trade' || src === 'ta') hasTa = true;
    });
    if(hasTa) statsBySource.tradeatlas++;
    else if(hasApollo) statsBySource.apollo++;
    else statsBySource.other++;
  });
  // _icStats — markazlashgan source of truth
  // Jami = source filter aktiv bo'lsa group-level total (groupCount), aks holda visible
  var _jamiUnified = _sourceFilter ? groupCount : visibleGroups.length;
  window._icStats = {
    jami: _jamiUnified,                  // ✓ Jami — barcha joyda bir xil (KPI, sidebar, map, CRM)
    exporterTotalRaw: _exporterTotal,    // co dan hisoblangan raw (orphan synthetic'lar bilan)
    visibleTotal: visibleGroups.length,
    apollo: apolloCount,                 // ✓ group-level: importyor-only olib tashlangan
    tradeatlas: tradeAtlasCount,         // ✓ group-level: importyor-only olib tashlangan
    apolloVisible: statsBySource.apollo, // visible (filterlangan) — kerak bo'lsa
    tradeatlasVisible: statsBySource.tradeatlas,
    other: statsBySource.other,
    exporters: statsByRole.exporters,
    importers: statsByRole.importers,
    unknown: statsByRole.unknown,
    tayyor: vTayyor,
    emailSent: vEmailSent,
    hasEmail: vHasEmail,
    byCountry: statsByCountry,
    byCountryName: statsByCountryName,
    countryCodes: Object.keys(statsByCountry),
    countryCount: Object.keys(statsByCountry).length,
    timestamp: Date.now()
  };
  console.log('[STATS] Jami:', window._icStats.jami, '| Eksp:', window._icStats.exporters, '| Imp:', window._icStats.importers, '| Apollo:', window._icStats.apollo, '| TA:', window._icStats.tradeatlas);
  // Jami KPI — markazlashgan _icStats.jami dan o'qiydi
  if(ic1El){
    ic1El.innerHTML = window._icStats.jami + ' <span class="kpi-unit">ta</span>';
  }

  // Pie chart va geo karta — markazlashgan stats'dan oqiydi
  if(typeof renderIcCharts === 'function') renderIcCharts(visibleRecords);
  var visGeoHash = visibleRecords.map(function(r){ return (r.id||'')+'|'+(r.davlat||r.country||''); }).join(',') + '|src:' + (_sourceFilter || '') + '|v:visible';
  if(visGeoHash !== _icGeoHash){
    _icGeoHash = visGeoHash;
    if(typeof renderInvestorGeoCard === 'function') renderInvestorGeoCard(visibleRecords);
  }
  // Backwards compatibility — eski _icCounts API (pipeline-crm va sidebar uchun)
  window._icCounts = {
    jami: window._icStats.jami,
    apollo: window._icStats.apollo,
    tradeatlas: window._icStats.tradeatlas,
    tayyor: window._icStats.tayyor,
    emailSent: window._icStats.emailSent,
    hasEmail: window._icStats.hasEmail,
    timestamp: window._icStats.timestamp
  };
  // Select all uchun visible record IDs (filter qo'llangan)
  var _visIdsSet = new Set();
  visibleGroups.forEach(function(g){
    if(Array.isArray(g.records)){
      g.records.forEach(function(rec){ if(rec && rec.id) _visIdsSet.add(String(rec.id)); });
    }
  });
  window._icVisibleIds = _visIdsSet;
  // Sidebar badge — markazlashgan _icStats.jami dan (KPI bilan bir xil bo'lishi uchun)
  try {
    var sidebarBadge = document.getElementById('badge-investorco');
    if(sidebarBadge) sidebarBadge.textContent = window._icStats.jami;
  } catch(_e){}
  // Pipeline CRM mavjud bo'lsa qayta render
  try { if(typeof renderCrmDashboard === 'function' && document.getElementById('crm-kpi-tree')) renderCrmDashboard(); } catch(_e){}
  console.log('[KPI override] Jami:', visibleGroups.length, '| Tayyor:', vTayyor, '| Email:', vEmailSent+'/'+vHasEmail, '| Apollo:', Object.keys(visibleApolloGroups).length, '| TA:', Object.keys(visibleTaGroups).length);
  var icTotalPages = Math.max(1, Math.ceil(visibleGroups.length / IC_PAGE_SIZE));
  if(_icPage > icTotalPages) _icPage = icTotalPages;
  if(_icPage < 1) _icPage = 1;
  var icStart = (_icPage - 1) * IC_PAGE_SIZE;
  var icEnd = icStart + IC_PAGE_SIZE;
  // Bu sahifaga 15 ta visible kompaniya
  var visiblePageGroups = visibleGroups.slice(icStart, icEnd);
  // Visible parentlarning yashirin child'larini ham qo'shamiz
  var visibleKeys = Object.create(null);
  visiblePageGroups.forEach(function(g){ visibleKeys[g.key] = true; });
  var groupPage = grouped.filter(function(g){
    if(visibleKeys[g.key]) return true;
    if(g._isHiddenChild && g._parentKey && visibleKeys[g._parentKey]) return true;
    return false;
  });

  var paginEl = document.getElementById('ic-pagination');
  if(paginEl){
    if(icTotalPages > 1){
      var pages = [];
      for(var p=1; p<=icTotalPages; p++){
        var isActive = p === _icPage;
        pages.push('<button onclick="_icPage='+p+';renderInvestorCompanies()" style="min-width:2rem;padding:4px 8px;border:1px solid '+(isActive?'#4361EE':'var(--border)')+';border-radius:6px;background:'+(isActive?'#4361EE':'var(--bg)')+';color:'+(isActive?'#fff':'var(--text)')+';font-size:.75rem;font-weight:'+(isActive?'700':'400')+';cursor:pointer">'+p+'</button>');
      }
      var prevBtn = '<button onclick="if(_icPage>1){_icPage--;renderInvestorCompanies();}" style="padding:4px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);font-size:.75rem;cursor:pointer">&#8592;</button>';
      var nextBtn = '<button onclick="if(_icPage<'+icTotalPages+'){_icPage++;renderInvestorCompanies();}" style="padding:4px 10px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text);font-size:.75rem;cursor:pointer">&#8594;</button>';
      paginEl.innerHTML = '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:.75rem 0">'+prevBtn+pages.join('')+nextBtn+'<span style="font-size:.72rem;color:var(--text3);margin-left:6px">'+visibleGroups.length+' ta / '+_icPage+'-bet</span></div>';
      paginEl.style.display = 'block';
    } else {
      paginEl.innerHTML = '';
      paginEl.style.display = 'none';
    }
  }

  tb.innerHTML = groupPage.map(function(group, groupIdx){
    var recs = group.records || [];
    if(!recs.length) return '';
    var companyRec = recs[0];
    // Parent va Child bir xil raqamga ega — _displayNumber ishlatamiz
    var rowNumber = (typeof group._displayNumber === 'number') ? group._displayNumber : (icStart + groupIdx + 1);
    var countryName = String(companyRec.davlat || companyRec.country || '').trim();
    var countryLabel = countryName ? (typeof getFinderCountryLabel === 'function' ? getFinderCountryLabel(countryName) : countryName) : '';
    var cityText = String(companyRec.shahar || companyRec.city || '').trim();
    var groupIds = recs.map(function(rec){ return String(rec.id); }).join(',');
    var sohaEditRecord = recs.find(function(rec){
      return String(_investorSohaEditId || '') === String(rec.id);
    }) || companyRec;
    var isSohaEdit = String(_investorSohaEditId || '') === String(sohaEditRecord.id);
    var sohaValue = getInvestorSohaValue(sohaEditRecord);
    var sohaCell = isSohaEdit
      ? '<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">' +
          '<input id="investor-soha-input-'+sohaEditRecord.id+'" value="'+tgEscapeAttr(sohaValue)+'" placeholder="Soha / mahsulot nomi" style="min-width:170px;max-width:260px;padding:5px 10px;font-size:.75rem;border:1px solid #465fff;border-radius:8px;background:#fff" onkeydown="if(event.key===\'Enter\')saveInvestorSohaEdit(\''+sohaEditRecord.id+'\');if(event.key===\'Escape\')cancelInvestorSohaEdit()">' +
          '<button type="button" onclick="saveInvestorSohaEdit(\''+sohaEditRecord.id+'\')" style="background:#059669;color:#fff;border:none;border-radius:8px;padding:5px 10px;font-size:.7rem;cursor:pointer">💾</button>' +
          '<button type="button" onclick="cancelInvestorSohaEdit()" style="background:var(--ta-gray-100);color:var(--ta-gray-700);border:none;border-radius:8px;padding:5px 10px;font-size:.7rem;cursor:pointer">Bekor</button>' +
        '</div>'
      : (sohaValue
          ? '<div style="display:flex;align-items:flex-start;gap:6px;min-width:0"><span class="ic-soha-cell" style="font-size:.78rem;color:#1F2937;font-weight:500" title="'+tgEscapeAttr(sohaValue)+'">'+escHtml(sohaValue)+'</span>'+(isAdmin?'<button type="button" onclick="openInvestorSohaEdit(\''+sohaEditRecord.id+'\')" title="Soha tahrirlash" style="border:none;background:none;color:#465fff;cursor:pointer;font-size:.82rem;line-height:1;padding:2px;flex-shrink:0">✏️</button>':'')+'</div>'
          : (isAdmin
              ? '<button type="button" onclick="openInvestorSohaEdit(\''+sohaEditRecord.id+'\')" style="background:var(--ta-warning-50);color:var(--ta-warning-600);border:none;border-radius:8px;padding:5px 12px;font-size:.7rem;cursor:pointer;font-weight:500">Soha qo\'shish</button>'
              : '<span style="color:var(--ta-gray-300)">—</span>'));
    /* Company cell with TailAdmin avatar initials */
    var compName = companyRec.kompaniya || '—';
    var compInitials = compName.split(/\s+/).slice(0,2).map(function(w){return w.charAt(0).toUpperCase()}).join('');
    var avatarColors = ['#465fff','#059669','#D97706','#7C3AED','#EF4444','#0EA5E9','#EC4899','#8B5CF6'];
    var avatarColor = avatarColors[rowNumber % avatarColors.length];
    var locationLine = '';
    if(countryName || cityText){
      locationLine = '<div style="font-size:.66rem;color:#4B5563;margin-top:2px;display:flex;align-items:center;gap:4px">' +
        (countryName && typeof getFinderCountryFlag === 'function' ? getFinderCountryFlag(countryName)+' ' : '') +
        '<span>'+escHtml((countryLabel||countryName)+(cityText?', '+cityText:''))+'</span></div>';
    }
    var logoUrl = companyRec.logoUrl || '';
    var avatarHtml;
    if(logoUrl){
      avatarHtml = '<div style="width:38px;height:38px;border-radius:50%;background:#fff;border:1px solid rgba(15,23,42,.08);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0">'+
        '<img src="'+tgEscapeAttr(logoUrl)+'" alt="'+escHtml(compName)+'" style="width:100%;height:100%;object-fit:contain" onerror="var p=this.parentElement;if(!p)return;p.style.background=&quot;'+avatarColor+'18&quot;;p.style.color=&quot;'+avatarColor+'&quot;;p.style.fontSize=&quot;.76rem&quot;;p.style.fontWeight=&quot;800&quot;;p.innerHTML=&quot;'+compInitials+'&quot;">'+
      '</div>';
    } else {
      avatarHtml = '<div style="width:38px;height:38px;border-radius:50%;background:'+avatarColor+'18;color:'+avatarColor+';display:flex;align-items:center;justify-content:center;font-size:.76rem;font-weight:800;flex-shrink:0">'+compInitials+'</div>';
    }
    // ═══ Parent (eksportyor) / Child (importyor) visual indikatorlari ═══
    var _isParent = !!group._isParent;
    var _isChild = !!group._isChild;
    var _detectedRole = group._role || '';
    var _isExporterRow = _detectedRole === 'exporter';
    var _isImporterRow = _detectedRole === 'importer';
    var _parentName = group._parentName || '';
    // Rol badge — har satr boshida aniq ko'rinsin
    var _roleBadgeHtml = '';
    if(_isExporterRow){
      _roleBadgeHtml = '<div style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:6px;background:linear-gradient(135deg,#059669,#047857);color:#fff;font-size:.6rem;font-weight:800;letter-spacing:.05em;margin-bottom:5px;box-shadow:0 2px 4px rgba(5,150,105,.25)">📤 EKSPORTYOR</div>';
    } else if(_isImporterRow){
      _roleBadgeHtml = '<div style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:6px;background:linear-gradient(135deg,#7C3AED,#6D28D9);color:#fff;font-size:.6rem;font-weight:800;letter-spacing:.05em;margin-bottom:5px;box-shadow:0 2px 4px rgba(124,58,237,.25)">📥 IMPORTYOR</div>';
    }
    // Child uchun parent bog'lanish chizig'i (eski — endi child'lar yashirin, faqat orphan'lar uchun)
    var _childLinkHtml = '';
    if(_isChild && _parentName){
      _childLinkHtml = '<div style="display:flex;align-items:center;gap:6px;font-size:.65rem;color:#7C3AED;margin-bottom:4px;font-style:italic"><span style="font-size:.85rem">↳</span><span>Eksportyor <b style="color:#059669">'+escHtml(_parentName)+'</b>\'dan import qilgan</span></div>';
    }
    // Parent (eksportyor) uchun — hover'da ochiladigan importyor xaridorlar ro'yxati
    var _hoverImporterBadge = '';
    var _childrenData = (_isParent && Array.isArray(group._childrenData)) ? group._childrenData : [];
    if(_isParent && _childrenData.length){
      var importerLines = _childrenData.map(function(ci){
        var qty = Number(ci.totalQty || 0);
        var qtyTxt = qty >= 1e6 ? (qty/1e6).toFixed(1)+'M kg' : qty >= 1e3 ? (qty/1e3).toFixed(1)+'K kg' : (qty ? Math.round(qty)+' kg' : '');
        var val = Number(ci.totalValue || 0);
        var valTxt = val >= 1e6 ? '$'+(val/1e6).toFixed(1)+'M' : val >= 1e3 ? '$'+(val/1e3).toFixed(0)+'K' : (val ? '$'+val : '');
        var flag = (typeof getFinderCountryFlag === 'function' && ci.davlat) ? getFinderCountryFlag(ci.davlat) : '';
        var dateTxt = ci.lastDate ? '📅 '+escHtml(String(ci.lastDate).slice(0,10)) : '';
        var meta = [qtyTxt, valTxt, dateTxt].filter(Boolean).join(' · ');
        var childKeyAttr = tgEscapeAttr(ci.childGroupKey || '');
        // Bosilganda — ushbu importyorning to'liq qatori (kontakt, soha, buttonlar) chiqadi
        return '<div onclick="event.stopPropagation();toggleHiddenChildRow(\''+childKeyAttr+'\',this)" style="font-size:.7rem;color:#5B21B6;line-height:1.45;padding:5px 8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;cursor:pointer;border-radius:6px;transition:background .15s" onmouseover="this.style.background=\'rgba(124,58,237,.08)\'" onmouseout="this.style.background=\'\'" title="Bosing — to\'liq ma\'lumot va tugmalar chiqadi">'+
          '<span class="ic-toggle-arrow" style="font-size:.85rem;color:#7C3AED;font-weight:800;transition:transform .15s">▶</span>'+
          '<span>Importyor <b style="color:#7C3AED">'+escHtml(ci.kompaniya || '—')+'</b>'+(flag?' '+flag:'')+(ci.davlat?' '+escHtml(ci.davlat):'')+'</span>'+
          (meta?'<span style="color:#9CA3AF;font-size:.62rem">· '+meta+'</span>':'')+
        '</div>';
      }).join('');
      _hoverImporterBadge = '<div class="ic-importer-hover" style="display:none;margin-top:6px;padding:6px;background:#FAF5FF;border-left:3px solid #7C3AED;border-radius:6px">'+
        '<div style="font-size:.6rem;color:#6B21A8;font-weight:600;letter-spacing:.04em;margin-bottom:3px;padding:2px 6px;text-transform:uppercase">▼ Bu eksportyordan import qilgan kompaniyalar — bosing batafsil</div>'+
        importerLines+
      '</div>';
    }
    // Parent uchun — ostidagi children sonini ko'rsatish (hint label)
    var _parentChildrenCount = _childrenData.length;
    var _parentSubLine = '';
    if(_isParent && _parentChildrenCount){
      _parentSubLine = '<div style="font-size:.62rem;color:#059669;margin-top:2px;font-weight:600;cursor:help" title="Hover qilib ko\'ring">👁️ '+_parentChildrenCount+' ta importyor xaridor (hover qiling)</div>';
    }
    // Eksport hajmi + sanasi — jami children'lardan aggregate, fallback companyRec._partners'dan
    var _exportInfoLine = '';
    if(_isParent){
      var _totalExpQty = 0;
      var _totalExpVal = 0;
      var _maxDate = '';
      _childrenData.forEach(function(ci){
        _totalExpQty += Number(ci.totalQty || 0);
        _totalExpVal += Number(ci.totalValue || 0);
        var d = String(ci.lastDate || '').slice(0,10);
        if(d && (!_maxDate || d > _maxDate)) _maxDate = d;
      });
      // Fallback 1: companyRec._partners array'idan aggregate (har importer xaridor info)
      if(!_totalExpQty || !_totalExpVal || !_maxDate){
        if(Array.isArray(companyRec._partners)){
          companyRec._partners.forEach(function(p){
            if(!_totalExpQty) _totalExpQty += Number(p.totalQty || 0);
            if(!_totalExpVal) _totalExpVal += Number(p.totalValue || 0);
            var d = String(p.lastDate || '').slice(0,10);
            if(d && (!_maxDate || d > _maxDate)) _maxDate = d;
          });
        }
        // _partners aggregate ham bo'lmasa, _partnerOf'dan ham urinib ko'ramiz
        if((!_totalExpQty || !_totalExpVal || !_maxDate) && Array.isArray(companyRec._partnerOf)){
          companyRec._partnerOf.forEach(function(p){
            if(!_totalExpQty) _totalExpQty += Number(p.totalQty || 0);
            if(!_totalExpVal) _totalExpVal += Number(p.totalValue || 0);
            var d = String(p.lastDate || '').slice(0,10);
            if(d && (!_maxDate || d > _maxDate)) _maxDate = d;
          });
        }
      }
      // Fallback 2: recordning o'z _tradeAtlas* field'laridan
      if(!_totalExpQty) _totalExpQty = Number(companyRec._tradeAtlasQuantity || 0);
      if(!_totalExpVal) _totalExpVal = Number(companyRec._tradeAtlasTradeValue || 0);
      if(!_maxDate) _maxDate = String(companyRec._tradeAtlasLastArrivalDate || '').slice(0,10);
      if(_totalExpQty || _totalExpVal || _maxDate){
        var _qtyTxt = '';
        if(_totalExpQty >= 1e6) _qtyTxt = (_totalExpQty/1e6).toFixed(1)+'M';
        else if(_totalExpQty >= 1e3) _qtyTxt = (_totalExpQty/1e3).toFixed(1)+'K';
        else if(_totalExpQty) _qtyTxt = String(Math.round(_totalExpQty));
        var _valTxt = '';
        if(_totalExpVal >= 1e6) _valTxt = '$'+(_totalExpVal/1e6).toFixed(1)+'M';
        else if(_totalExpVal >= 1e3) _valTxt = '$'+(_totalExpVal/1e3).toFixed(0)+'K';
        else if(_totalExpVal) _valTxt = '$'+Math.round(_totalExpVal);
        _exportInfoLine = '<div style="font-size:.65rem;margin-top:5px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">'+
          (_qtyTxt ? '<span style="background:rgba(5,150,105,.1);color:#059669;padding:2px 8px;border-radius:6px;font-weight:700;display:inline-flex;align-items:center;gap:3px" title="Eksport hajmi (jami)">📦 '+_qtyTxt+' kg</span>' : '')+
          (_valTxt ? '<span style="background:rgba(34,197,94,.1);color:#16A34A;padding:2px 8px;border-radius:6px;font-weight:700;display:inline-flex;align-items:center;gap:3px" title="Eksport qiymati (jami FOB/CIF)">💰 '+_valTxt+'</span>' : '')+
          (_maxDate ? '<span style="background:rgba(99,102,241,.08);color:#4338CA;padding:2px 8px;border-radius:6px;font-weight:600;font-size:.62rem;display:inline-flex;align-items:center;gap:3px" title="So\'nggi eksport sanasi">📅 '+escHtml(_maxDate)+'</span>' : '')+
        '</div>';
      }
    }
    // Avatar oldida child bo'lsa indentation (orphan importerlar uchun ham qo'llanmaydi endi)
    var _avatarPrefixHtml = '';

    // Pastida nechta importyor borligi (clickable — bosilganda importyor badgelar VA child row'lar ochiladi/yopiladi)
    var _importerCountLine = '';
    if(_isParent && _childrenData.length){
      _importerCountLine = '<div onclick="event.stopPropagation();window.toggleImporterWrapper(this)" style="font-size:.62rem;color:#7C3AED;margin-top:3px;font-weight:600;cursor:pointer;user-select:none;display:inline-flex;align-items:center;gap:4px;padding:2px 6px;border-radius:6px;background:rgba(124,58,237,.08);transition:background .15s" onmouseover="this.style.background=\'rgba(124,58,237,.18)\'" onmouseout="this.style.background=\'rgba(124,58,237,.08)\'" title="Importyor xaridorlarni ko\'rsatish/yashirish"><span class="ic-toggle-arrow">▸</span> '+_childrenData.length+' ta importyor</div>';
    }
    var companyHtml = '<div onclick="openInvestorDetailModal(\''+companyRec.id+'\')" style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:4px 6px;border-radius:8px;transition:background .15s'+(_isChild?';padding-left:20px':'')+'" onmouseover="this.style.background=\'rgba(70,95,255,.06)\'" onmouseout="this.style.background=\'\'" title="Batafsil — eksport hajmi, qiymati va sanasi modalda">' +
      _avatarPrefixHtml +
      avatarHtml +
      '<div style="flex:1;min-width:0">' +
        _roleBadgeHtml +
        _childLinkHtml +
        '<div class="ic-company-name-2line" style="font-size:.85rem;font-weight:700;color:#111827" title="'+tgEscapeAttr(compName)+'">'+escHtml(compName)+'</div>' +
        (companyRec.website ? '<div style="font-size:.66rem;color:#6366F1;margin-top:1px">'+escHtml(companyRec.website)+'</div>' : '') +
        locationLine +
        _importerCountLine +
        _hoverImporterBadge +
      '</div></div>';

    var html = '';
    // Parent (eksportyor) / Child (importyor) uchun farqli fon va chap chiziq
    var _groupBg;
    var _groupBorderLeft = '';
    if(_isParent){
      _groupBg = '#F0FDF4'; // engil yashil — eksportyor
      _groupBorderLeft = 'border-left:4px solid #059669;';
    } else if(_isChild){
      _groupBg = '#FAF5FF'; // engil binafsha — importyor xaridor
      _groupBorderLeft = 'border-left:4px solid #7C3AED;';
    } else if(_isExporterRow){
      _groupBg = '#F0FDF4';
      _groupBorderLeft = 'border-left:4px solid #059669;';
    } else if(_isImporterRow){
      _groupBg = '#FAF5FF';
      _groupBorderLeft = 'border-left:4px solid #7C3AED;';
    } else {
      _groupBg = (groupIdx % 2 === 0) ? '#f8fafd' : '#ffffff';
    }
    var _groupHoverBg = '#eef2ff';
    recs.forEach(function(rec, recIdx){
      var isAiOpen = !!_investorAiOpen && String(_investorAiTargetId || '') === String(rec.id);
      var contact = {
        name: String(rec.rahbar || '').trim(),
        title: String(rec.lavozim || '').trim(),
        email: String(rec.email || '').trim(),
        telefon: String(rec.telefon || rec.tel || '').trim(),
        photoUrl: String(rec.photoUrl || rec.photo_url || '').trim(),
        linkedin: String(rec.linkedin || '').trim()
      };
      /* Contact cell TailAdmin style — TradeAtlas placeholder va empty marker yozuvlar yashiriladi */
      var _placeholderTitles = ['tradeatlas eksport kontakti','tradeatlas import kontakti','tradeatlas kontakt'];
      // Empty/placeholder marker check — '.', '-', '—', whitespace, etc.
      function _isEmptyMarker(v){
        var s = String(v || '').trim();
        if(!s) return true;
        // Faqat tinish belgilari yoki boshqa placeholder belgilarni filter qilish
        return /^[.\-–—_\s]+$/.test(s);
      }
      var _titleLower = String(contact.title || '').toLowerCase().trim();
      var _isPlaceholderTitle = _placeholderTitles.indexOf(_titleLower) !== -1 || _isEmptyMarker(contact.title);
      var _nameLower = String(contact.name || '').toLowerCase().trim();
      var _kompLower = String(rec.kompaniya || '').toLowerCase().trim();
      var _isPlaceholderName = _nameLower === _kompLower
        || _placeholderTitles.indexOf(_nameLower) !== -1
        || _isEmptyMarker(contact.name);
      var _isPlaceholderEmail = _isEmptyMarker(contact.email);
      var _isPlaceholderPhone = _isEmptyMarker(contact.telefon);
      var contactHtml = '<div style="min-width:0;word-break:break-word">';
      if(contact.name && !_isPlaceholderName) contactHtml += '<div style="font-size:.82rem;font-weight:700;color:#111827;word-break:break-word">'+escHtml(contact.name)+'</div>';
      if(contact.title && !_isPlaceholderTitle) contactHtml += '<div style="font-size:.68rem;color:#4B5563;margin-top:2px;word-break:break-word">'+escHtml(contact.title)+'</div>';
      if(contact.email && !_isPlaceholderEmail) contactHtml += '<div style="font-size:.68rem;color:#3B82F6;margin-top:2px;word-break:break-all;font-weight:500">'+escHtml(contact.email)+'</div>';
      if(contact.telefon && !_isPlaceholderPhone) contactHtml += '<div style="font-size:.65rem;color:#6B7280;margin-top:2px">'+escHtml(contact.telefon)+'</div>';
      var _hasVisibleContact = (contact.name && !_isPlaceholderName)
        || (contact.email && !_isPlaceholderEmail)
        || (contact.title && !_isPlaceholderTitle)
        || (contact.telefon && !_isPlaceholderPhone);
      // Faqat birinchi qator (parent)ga "—" qo'yiladi — har kompaniyada 1 ta dash
      if(!_hasVisibleContact && recIdx === 0) contactHtml += '<span style="color:var(--ta-gray-300)">—</span>';
      // "Lead topish" tugmasi — faqat birinchi qator (parent)ga, har 1 kompaniyaga 1 ta tugma
      var _isTaRec = String(rec.manba || '').toLowerCase().indexOf('tradeatlas') !== -1;
      if(_isTaRec && recIdx === 0){
        contactHtml += '<div style="margin-top:8px;display:block"><button type="button" onclick="event.stopPropagation();findContactsForInvestorRecord(\''+rec.id+'\',this)" style="background:linear-gradient(135deg,#7C3AED,#465fff);color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:.72rem;font-weight:700;cursor:pointer;display:inline-block;box-shadow:0 3px 8px rgba(124,58,237,.4);white-space:nowrap" title="Gemini orqali lead va email topish">🔍 Lead topish</button></div>';
      }
      contactHtml += '</div>';

      var groupBorderStyle = recIdx === 0 ? 'border-top:2px solid transparent;' : '';
      // Hover handler olib tashlandi — importyor faqat "N ta importyor" tugmasini bosganda ochiladi
      var _hoverHandlers = '';
      // Yashirin child (importyor) qator — boshlang'ich display:none, bosilgancha
      var _hiddenChildAttrs = '';
      var _hiddenChildStyle = '';
      if(group._isHiddenChild){
        _hiddenChildAttrs = ' data-child-key="'+tgEscapeAttr(group.key)+'" data-hidden-child="1"';
        _hiddenChildStyle = 'display:none;';
      }
      html += '<tr class="ic-group-row'+(_isParent?' ic-row-parent':'')+(_isChild?' ic-row-child':'')+'" data-group="'+groupIdx+'" data-group-bg="'+_groupBg+'" data-group-hover="'+_groupHoverBg+'" id="investor-row-'+rec.id+'" style="'+_hiddenChildStyle+'background:'+_groupBg+';transition:background .15s;'+_groupBorderLeft+groupBorderStyle+'"'+_hoverHandlers+_hiddenChildAttrs+'>';
      if(recIdx === 0){
        html += '<td rowspan="'+recs.length+'" style="padding-left:1.25rem;vertical-align:middle">'+(isAdmin ? ('<input type="checkbox" class="ic-check" data-ids="'+tgEscapeAttr(groupIds)+'" onchange="saveIcCheck(this);updateSelectedCount()" style="width:18px;height:18px;border-radius:5px;accent-color:#465fff;cursor:pointer">') : '')+'</td>';
        html += '<td rowspan="'+recs.length+'" style="font-size:.82rem;color:#374151;font-weight:600;vertical-align:middle">'+rowNumber+'</td>';
        html += '<td rowspan="'+recs.length+'" style="vertical-align:middle">'+companyHtml+'</td>';
      }
      html += '<td style="vertical-align:middle">'+contactHtml+'</td>';
      if(recIdx === 0){
        html += '<td rowspan="'+recs.length+'" style="vertical-align:middle">'+sohaCell+'</td>';
      }
      /* Status badge va Action buttons — faqat birinchi qator (recIdx === 0)ga rowspan bilan */
      if(recIdx === 0){
        var _parentRec = recs[0];
        html += '<td rowspan="'+recs.length+'" style="vertical-align:middle">'+getEmailStatusBadge(_parentRec)+'</td>';
        var _abtn = 'width:30px;height:30px;border-radius:7px;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all .2s ease;flex-shrink:0;';
        var _srcBadge = '';
        var _srcRaw = String(_parentRec.manba || _parentRec.source || companyRec.manba || companyRec.source || '').toLowerCase();
        var _isApolloSource = _srcRaw.indexOf('apollo') !== -1 || _srcRaw === 'csv-import' || _srcRaw === 'csv import' || _srcRaw === 'finder';
        if(_isApolloSource){
          _srcBadge = '<span title="Apollo" style="width:26px;height:26px;border-radius:7px;background:#FFE600;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:4px"><img src="assets/apollo.ico" alt="Apollo" style="width:18px;height:18px;display:block"></span>';
        } else if(_srcRaw.indexOf('tradeatlas') !== -1 || _srcRaw === 'trade'){
          _srcBadge = '<span title="TradeAtlas" style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#1E3A8A,#1E40AF);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.55rem;font-weight:800;flex-shrink:0;margin-right:4px;letter-spacing:-.02em">TA</span>';
        }
        html += '<td rowspan="'+recs.length+'" style="vertical-align:middle">' +
          '<div style="display:flex;gap:4px;align-items:center;flex-wrap:nowrap">' +
          _srcBadge +
          (isAdmin
            ? '<button style="'+_abtn+'background:transparent;padding:0" onclick="openInvestorAiWorkspace(\''+_parentRec.id+'\')" title="AI xat va tahlil"><svg width="26" height="26" viewBox="0 0 24 24"><defs><radialGradient id="aiGrad'+_parentRec.id+'" cx="50%" cy="40%" r="65%"><stop offset="0%" stop-color="#FFB554"/><stop offset="100%" stop-color="#F57C00"/></radialGradient></defs><circle cx="12" cy="12" r="11" fill="url(#aiGrad'+_parentRec.id+')"/><text x="12" y="16" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="11" fill="#fff">Ai</text></svg></button>' +
              (_parentRec.email ? '<button style="'+_abtn+'background:#EFF4FF;color:#3B82F6" onclick="openEmailModal(\''+_parentRec.id+'\')" title="Xabar yuborish" onmouseover="this.style.background=\'#3B82F6\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'#EFF4FF\';this.style.color=\'#3B82F6\'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 20.5H7c-3 0-5-1.5-5-5v-7c0-3.5 2-5 5-5h10c3 0 5 1.5 5 5v7c0 3.5-2 5-5 5z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 9l-3.13 2.5c-1.03.82-2.72.82-3.75 0L7 9" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : '') +
              (_parentRec.email ? '<button style="'+_abtn+'background:'+(_parentRec.emailSchedule?.active?'#ECFDF5':'#F3F4F6')+';color:'+(_parentRec.emailSchedule?.active?'#059669':'#6B7280')+'" onclick="openScheduleModal(\''+_parentRec.id+'\')" title="Email rejalashtirish" onmouseover="this.style.background=\''+(_parentRec.emailSchedule?.active?'#059669':'#6B7280')+'\';this.style.color=\'#fff\'" onmouseout="this.style.background=\''+(_parentRec.emailSchedule?.active?'#ECFDF5':'#F3F4F6')+'\';this.style.color=\''+(_parentRec.emailSchedule?.active?'#059669':'#6B7280')+'\'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.69 13.7h.01M15.69 16.7h.01M11.99 13.7h.02M11.99 16.7h.02M8.29 13.7h.02M8.29 16.7h.02" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : '') +
              '<button style="'+_abtn+'background:#FEF3F2;color:#EF4444" onclick="deleteRecord(\'investorCompanies\',\''+_parentRec.id+'\')" title="O\'chirish" onmouseover="this.style.background=\'#EF4444\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'#FEF3F2\';this.style.color=\'#EF4444\'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 5.98c-3.33-.33-6.68-.5-10.02-.5-1.98 0-3.96.1-5.94.3L3 5.98M8.5 4.97l.22-1.31C8.88 2.71 9 2 10.69 2h2.62c1.69 0 1.82.75 1.97 1.67l.22 1.3M18.85 9.14l-.65 10.07C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14M10.33 16.5h3.33M9.5 12.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
            : '') +
          '</div></td>';
      }
      html += '</tr>';
    });

    // ═══ Hamkor firmalar paneli — savdo aloqalarini oddiy ko'rsatish ═══
    // Child satrlar uchun panelni ko'rsatmaymiz — parent allaqachon yuqorida ko'rinadi
    // Parent satrlar uchun ham qisqa panel — DB'da topilmagan importyorlar bo'lsa shularni alohida chiqaramiz
    var _partnersDirect = Array.isArray(companyRec._partners) ? companyRec._partners : [];
    var _partnersReverse = Array.isArray(companyRec._partnerOf) ? companyRec._partnerOf : [];
    var _showPartnerPanel = !_isChild && (_partnersDirect.length || _partnersReverse.length);
    if(_showPartnerPanel){
      // Companyrec'ning roli (importyor / eksportyor)
      var _selfMode = String(companyRec.finderMode || companyRec.role || '').toLowerCase();
      var _selfIsExp = _selfMode === 'exporters' || _selfMode === 'exporter';
      var _selfIsImp = _selfMode === 'importers' || _selfMode === 'importer';
      // Fallback — agar finderMode noma'lum bo'lsa, partnerlardan kelib chiqib aniqlaymiz
      if(!_selfIsExp && !_selfIsImp){
        if(_partnersDirect.length){
          // Partner roli aniq bo'lsa, men teskari rolda bo'laman
          var fp = _partnersDirect[0];
          if(fp.role === 'importer') _selfIsExp = true;
          else if(fp.role === 'exporter') _selfIsImp = true;
        }
        if(!_selfIsExp && !_selfIsImp && _partnersReverse.length){
          // _partnerOf da role parent'ning roli — men teskari rolda
          var fr = _partnersReverse[0];
          if(fr.role === 'exporter') _selfIsImp = true;
          else if(fr.role === 'importer') _selfIsExp = true;
        }
      }

      // Barcha partnerlarni 1 ta ro'yxatga to'plash, har biri uchun PARTNER'ning roli aniqlanadi
      var _allPartners = [];
      _partnersDirect.forEach(function(p){
        _allPartners.push({
          kompaniya: p.kompaniya, davlat: p.davlat || p.country || '',
          countryCode: p.countryCode || '', cityState: p.cityState || '',
          email: p.email || '', tel: p.tel || '', web: p.web || '',
          // _partners ichida role = partnerning ROLI
          partnerRole: String(p.role || '').toLowerCase(), // 'importer' yoki 'exporter'
          totalValue: p.totalValue || 0, totalQty: p.totalQty || 0,
          docCount: p.docCount || 0, lastDate: p.lastDate || ''
        });
      });
      _partnersReverse.forEach(function(p){
        // _partnerOf da role = parent'ning roli (parent IS our partner now)
        // ya'ni p.role ni partner roli sifatida olamiz
        _allPartners.push({
          kompaniya: p.kompaniya, davlat: p.davlat || p.country || '',
          countryCode: p.countryCode || '', cityState: p.cityState || '',
          email: '', tel: '', web: '',
          partnerRole: String(p.role || '').toLowerCase(),
          totalValue: p.totalValue || 0, totalQty: p.totalQty || 0,
          docCount: p.docCount || 0, lastDate: p.lastDate || ''
        });
      });
      // Dublikatlarni olib tashlash (kompaniya nomi bo'yicha)
      var _seenPart = {};
      _allPartners = _allPartners.filter(function(p){
        var k = String(p.kompaniya || '').trim().toLowerCase();
        if(!k || _seenPart[k]) return false;
        _seenPart[k] = true;
        return true;
      });
      // Agar parent (eksportyor) bo'lsa — DB'da allaqachon child satr sifatida ko'rinayotgan importyorlarni filterdan o'tkazamiz
      if(_isParent){
        _allPartners = _allPartners.filter(function(p){
          var k = String(p.kompaniya || '').trim().toLowerCase();
          // Bu importyor DB'da bormi va shu eksportyorga bog'langanmi?
          var inDb = (DB.investorCompanies || []).some(function(r){
            return String(r.kompaniya || '').trim().toLowerCase() === k;
          });
          // Agar DB'da bor bo'lsa va child satr sifatida pastida turibdi bo'lsa, panelda qaytarib ko'rsatmaymiz
          return !inDb;
        });
      }

      // Companyrec'ning roli aniq bo'lsa va partnerRole bo'sh bo'lsa, qarama-qarshini quyamiz
      if(_selfIsExp || _selfIsImp){
        _allPartners.forEach(function(p){
          if(!p.partnerRole){
            p.partnerRole = _selfIsExp ? 'importer' : 'exporter';
          }
        });
      }

      // Partnerlarni rolga qarab guruhlaymiz
      var _expPartners = _allPartners.filter(function(p){ return p.partnerRole === 'exporter'; });
      var _impPartners = _allPartners.filter(function(p){ return p.partnerRole === 'importer'; });
      var _otherPartners = _allPartners.filter(function(p){ return p.partnerRole !== 'exporter' && p.partnerRole !== 'importer'; });

      function _findInvestorIdByCompany(cName){
        var key = String(cName || '').trim().toLowerCase();
        if(!key) return '';
        var found = (DB.investorCompanies || []).find(function(r){
          return String(r.kompaniya || '').trim().toLowerCase() === key;
        });
        return found ? String(found.id) : '';
      }

      // Kartochkalar — har bir partner uchun
      function _fmtPartnerCard(p, accent){
        var qty = Number(p.totalQty || 0);
        var qtyTxt = qty >= 1e6 ? (qty/1e6).toFixed(1)+'M' : qty >= 1e3 ? (qty/1e3).toFixed(1)+'K' : (qty ? Math.round(qty) : '');
        var val = Number(p.totalValue || 0);
        var valTxt = val >= 1e6 ? '$'+(val/1e6).toFixed(1)+'M' : val >= 1e3 ? '$'+(val/1e3).toFixed(0)+'K' : (val ? '$'+val : '');
        var partnerCountry = String(p.davlat || '').trim();
        var partnerFlag = (typeof getFinderCountryFlag === 'function' && partnerCountry) ? getFinderCountryFlag(partnerCountry) : '';
        var partnerLabel = (typeof getFinderCountryLabel === 'function' && partnerCountry) ? getFinderCountryLabel(partnerCountry) : partnerCountry;
        var pid = _findInvestorIdByCompany(p.kompaniya);
        var jumpHandler = pid
          ? 'document.getElementById(\'investor-row-'+pid+'\').scrollIntoView({behavior:\'smooth\',block:\'center\'});document.getElementById(\'investor-row-'+pid+'\').style.outline=\'2px solid '+accent+'\';setTimeout(function(){var el=document.getElementById(\'investor-row-'+pid+'\');if(el)el.style.outline=\'\'},1500);'
          : '';
        var clickAttr = pid ? ('onclick="'+jumpHandler+'" style="cursor:pointer"') : 'style="cursor:default"';
        return '<div '+clickAttr+' onmouseover="this.style.borderColor=\''+accent+'\';this.style.boxShadow=\'0 4px 12px rgba(0,0,0,.08)\'" onmouseout="this.style.borderColor=\'#E5E7EB\';this.style.boxShadow=\'none\'" style="display:inline-flex;flex-direction:column;gap:4px;padding:10px 14px;background:#fff;border:1px solid #E5E7EB;border-left:3px solid '+accent+';border-radius:10px;font-size:.72rem;min-width:200px;max-width:280px;transition:all .15s">'+
          '<div style="font-weight:700;color:#111827;line-height:1.3;font-size:.78rem">'+
            escHtml(p.kompaniya || '—')+
          '</div>'+
          (partnerCountry?'<div style="font-size:.66rem;color:#6B7280">'+(partnerFlag?partnerFlag+' ':'')+escHtml(partnerLabel || partnerCountry)+(p.cityState?' · '+escHtml(p.cityState):'')+'</div>':'')+
          (qtyTxt || valTxt ? '<div style="display:flex;gap:8px;font-size:.66rem;color:#374151;margin-top:2px">'+(qtyTxt?'<span><b>'+qtyTxt+'</b> kg</span>':'')+(valTxt?'<span style="color:#059669"><b>'+valTxt+'</b></span>':'')+'</div>' : '')+
          (p.lastDate?'<div style="font-size:.6rem;color:#9CA3AF;margin-top:1px">📅 '+escHtml(String(p.lastDate).slice(0,10))+'</div>':'')+
        '</div>';
      }

      // Section render — har rol guruhi uchun aniq title
      function _renderPartnerGroup(list, role, parentRole){
        if(!list.length) return '';
        var isExp = role === 'exporter';
        var accent = isExp ? '#059669' : '#7C3AED';
        var bg = isExp ? 'rgba(5,150,105,.05)' : 'rgba(124,58,237,.05)';
        var icon = isExp ? '📤' : '📥';
        var roleLabel = isExp ? 'Eksportyor kompaniyalar' : 'Importyor kompaniyalar';
        // Kontekst sentence — companyrec'ga nisbatan
        var ctxSentence = '';
        if(parentRole === 'exporter'){
          // Bu kompaniya eksportyor, partner importyor → "ushbu kompaniyadan sotib olganlar"
          ctxSentence = isExp ? 'Bu eksportyor bilan birga ishlagan eksportyorlar' : 'Bu kompaniyadan sotib olganlar (xaridorlar)';
        } else if(parentRole === 'importer'){
          ctxSentence = isExp ? 'Bu kompaniya kimdan sotib olgan (manbalar)' : 'Bu importyor bilan birga ishlagan importyorlar';
        }
        var topList = list.slice(0, 8);
        var moreCount = list.length - topList.length;
        var cards = topList.map(function(p){ return _fmtPartnerCard(p, accent); }).join('');
        var moreBadge = moreCount > 0 ? '<span style="display:inline-flex;align-items:center;padding:8px 12px;background:#F3F4F6;color:#6B7280;border-radius:10px;font-size:.7rem;font-weight:600">+'+moreCount+' ta ko\'proq</span>' : '';
        return '<div style="background:'+bg+';border-radius:10px;padding:10px 12px;margin-bottom:8px">'+
          '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">'+
            '<span style="font-size:.85rem">'+icon+'</span>'+
            '<span style="font-size:.78rem;font-weight:700;color:'+accent+'">'+roleLabel+'</span>'+
            '<span style="background:#fff;color:'+accent+';padding:1px 8px;border-radius:8px;font-size:.65rem;font-weight:700">'+list.length+' ta</span>'+
            (ctxSentence?'<span style="font-size:.62rem;color:#6B7280;margin-left:4px">— '+ctxSentence+'</span>':'')+
          '</div>'+
          '<div style="display:flex;flex-wrap:wrap;gap:8px">'+cards+moreBadge+'</div>'+
        '</div>';
      }

      var _parentRole = _selfIsExp ? 'exporter' : (_selfIsImp ? 'importer' : '');
      var _panelHtml = '';
      _panelHtml += _renderPartnerGroup(_expPartners, 'exporter', _parentRole);
      _panelHtml += _renderPartnerGroup(_impPartners, 'importer', _parentRole);
      // "Other" — agar role aniq bo'lmasa, neutralda chiqaramiz
      if(_otherPartners.length){
        _panelHtml += '<div style="background:rgba(70,95,255,.05);border-radius:10px;padding:10px 12px"><div style="font-size:.78rem;font-weight:700;color:#465fff;margin-bottom:8px">🤝 Hamkorlar <span style="background:#fff;padding:1px 8px;border-radius:8px;font-size:.65rem">'+_otherPartners.length+' ta</span></div><div style="display:flex;flex-wrap:wrap;gap:8px">'+_otherPartners.slice(0,8).map(function(p){ return _fmtPartnerCard(p, '#465fff'); }).join('')+'</div></div>';
      }

      if(_panelHtml){
        html += '<tr class="ic-partner-panel-row" data-group="'+groupIdx+'" style="background:'+_groupBg+'">';
        html += '<td colspan="7" style="padding:10px 1.25rem 14px;border-top:1px dashed rgba(70,95,255,.18)">';
        html += _panelHtml;
        html += '</td></tr>';
      }
    }

    // ═══ Gradient ajratuvchi — keyingi kompaniyadan ajratish uchun ═══
    // Faqat IMMEDIATE next group parent/orphan bo'lsa separator qo'yiladi
    // (current parent va next hidden child bo'lsa, separator keyinroq — child'dan keyin chiqadi)
    var _nextGroup = groupPage[groupIdx + 1];
    var _nextIsTopLevel = _nextGroup && (_nextGroup._isParent || _nextGroup._isOrphan);
    if(_nextIsTopLevel){
      html += '<tr class="ic-company-separator" aria-hidden="true">'+
        '<td colspan="7" style="padding:6px 12px !important;border:none !important;background:transparent !important">'+
          '<div style="height:2px !important;background:linear-gradient(90deg,transparent 0%,rgba(67,97,238,.25) 12%,rgba(67,97,238,.55) 35%,rgba(245,124,0,.6) 50%,rgba(67,97,238,.55) 65%,rgba(67,97,238,.25) 88%,transparent 100%) !important;border-radius:99px !important;box-shadow:0 0 4px rgba(245,124,0,.15) !important;display:block !important"></div>'+
        '</td>'+
      '</tr>';
    }

    return html;
  }).join('');

  restoreIcChecks();
  updateSelectedCount();
  var bulkBtn = document.getElementById('bulkSendBtn');
  var bulkAiBtn = document.getElementById('bulkAiBtn');
  var bulkExcelBtn = document.getElementById('bulkExcelBtn');
  var checkAll = document.getElementById('checkAll');
  if(bulkBtn) bulkBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  if(bulkAiBtn) bulkAiBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  if(bulkExcelBtn) bulkExcelBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  var bulkSchedBtn = document.getElementById('bulkSchedBtn');
  if(bulkSchedBtn) bulkSchedBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  var bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  if(bulkDeleteBtn) bulkDeleteBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  if(checkAll) checkAll.style.display = isAdmin ? 'inline-block' : 'none';
  if(typeof mountInvestorAiWorkspace === 'function') mountInvestorAiWorkspace();
};

window._icSelectedIds = window._icSelectedIds || new Set();
function saveIcCheck(cb){
  var ids = String(cb.dataset.ids || cb.dataset.id || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
  ids.forEach(function(id){
    if(cb.checked) window._icSelectedIds.add(id);
    else window._icSelectedIds.delete(id);
  });
}
function restoreIcChecks(){
  document.querySelectorAll('.ic-check').forEach(function(cb){
    var ids = String(cb.dataset.ids || cb.dataset.id || '').split(',').map(function(s){return s.trim();}).filter(Boolean);
    cb.checked = ids.some(function(id){ return window._icSelectedIds.has(id); });
  });
}
window.saveIcCheck = saveIcCheck;
window.restoreIcChecks = restoreIcChecks;

function toggleAllCheckboxes(el){
  document.querySelectorAll('.ic-check').forEach(function(c){
    c.checked = el.checked;
    saveIcCheck(c);
  });
  updateSelectedCount();
}

function updateSelectedCount(){
  // ID emas, GURUH (kompaniya) soni — har kompaniya parent + child IDs ga ega
  var groupCount = 0;
  if(window._icSelectedIds && window._icSelectedIds.size){
    var co = DB.investorCompanies || [];
    var seen = Object.create(null);
    window._icSelectedIds.forEach(function(id){
      var rec = co.find(function(r){ return String(r.id) === String(id); });
      if(rec){
        var gk = (typeof getInvestorCompanyGroupKey === 'function') ? getInvestorCompanyGroupKey(rec) : String(rec.kompaniya || '').toLowerCase();
        if(gk && !seen[gk]){ seen[gk] = true; groupCount++; }
      }
    });
  }
  const el = document.getElementById('selectedCount');
  if(el) el.textContent = groupCount ? (groupCount + ' ta tanlangan') : '0 ta tanlangan';
  const bulkAiBtn = document.getElementById('bulkAiBtn');
  if(bulkAiBtn) bulkAiBtn.disabled = !groupCount;
  const bulkSendBtn = document.getElementById('bulkSendBtn');
  if(bulkSendBtn) bulkSendBtn.disabled = !groupCount;
  const bulkSchedBtn = document.getElementById('bulkSchedBtn');
  if(bulkSchedBtn) bulkSchedBtn.disabled = !groupCount;
  const bulkExcelBtn = document.getElementById('bulkExcelBtn');
  if(bulkExcelBtn) bulkExcelBtn.disabled = !groupCount;
}

function toggleSelectMenu(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  var cb = document.getElementById('checkAll'); if(cb) cb.checked = false;
  var menu = document.getElementById('selectAllMenu');
  if(!menu) return;
  // Faqat KO'RINIB TURGAN checkbox'larni hisoblash (yashirin child qatorlarni hisoblamaslik)
  var pageCount = 0;
  document.querySelectorAll('.ic-check').forEach(function(c){
    if(c.offsetParent !== null) pageCount++;
  });
  // Filter qo'llangan visible kompaniyalar soni (jadvaldagi haqiqiy soni)
  var totalCount = (window._icCounts && typeof window._icCounts.jami === 'number')
    ? window._icCounts.jami
    : (DB.investorCompanies||[]).length;
  var pcEl = document.getElementById('selPageCount'); if(pcEl) pcEl.textContent = pageCount;
  var acEl = document.getElementById('selAllCount'); if(acEl) acEl.textContent = totalCount;
  var willOpen = (menu.style.display === 'none' || !menu.style.display);
  menu.style.display = willOpen ? 'block' : 'none';
  if(willOpen){
    // Joriy click event'ini hisobga olmaslik uchun timestamp belgilanadi
    window._selMenuOpenedAt = Date.now();
    // Capture phase'da ro'yxatga olish — boshqa handler'lardan oldin chaqirilishi uchun
    if(!window._selMenuOutsideRegistered){
      document.addEventListener('mousedown', _closeSelectMenuOnOutside, true);
      window._selMenuOutsideRegistered = true;
    }
  }
}
function _closeSelectMenuOnOutside(e){
  var menu = document.getElementById('selectAllMenu');
  if(!menu || menu.style.display !== 'block') return;
  // Menu yangi ochilgan bo'lsa (50ms ichida) — hisoblamaymiz
  if(window._selMenuOpenedAt && (Date.now() - window._selMenuOpenedAt) < 100) return;
  // Menu ichida yoki #checkAll ustida bosilgan bo'lsa — hech narsa qilmaymiz
  if(menu.contains(e.target)) return;
  if(e.target && e.target.id === 'checkAll') return;
  // Tashqarida bosildi — yopamiz
  menu.style.display = 'none';
}
// ESC bilan ham yopiladi
if(typeof window !== 'undefined' && !window._selMenuEscRegistered){
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      var menu = document.getElementById('selectAllMenu');
      if(menu && menu.style.display === 'block') menu.style.display = 'none';
    }
  });
  window._selMenuEscRegistered = true;
}
function selectThisPage(event){
  if(event){ event.stopPropagation(); }
  if(!window._icSelectedIds) window._icSelectedIds = new Set();
  // Faqat KO'RINIB TURGAN checkbox'larni tanlash (yashirin child qatorlar emas)
  document.querySelectorAll('.ic-check').forEach(function(cb){
    if(cb.offsetParent === null) return; // yashirin — o'tib ketamiz
    cb.checked = true;
    if(typeof saveIcCheck === 'function') saveIcCheck(cb);
  });
  updateSelectedCount();
  document.getElementById('selectAllMenu').style.display = 'none';
}
function selectAll(event){
  if(event){ event.stopPropagation(); }
  if(!window._icSelectedIds) window._icSelectedIds = new Set();
  // Faqat filter ostida ko'rinadigan kompaniyalarni tanlash (visible record IDs)
  if(window._icVisibleIds && window._icVisibleIds.size > 0){
    window._icVisibleIds.forEach(function(id){ window._icSelectedIds.add(id); });
  } else {
    (DB.investorCompanies||[]).forEach(function(r){
      window._icSelectedIds.add(String(r.id));
    });
  }
  if(typeof restoreIcChecks === 'function') restoreIcChecks();
  updateSelectedCount();
  document.getElementById('selectAllMenu').style.display = 'none';
}
function clearSelection(event){
  if(event){ event.stopPropagation(); }
  if(window._icSelectedIds) window._icSelectedIds.clear();
  document.querySelectorAll('.ic-check').forEach(function(cb){ cb.checked = false; });
  updateSelectedCount();
  document.getElementById('selectAllMenu').style.display = 'none';
}
window.toggleSelectMenu = toggleSelectMenu;
window.selectThisPage = selectThisPage;
window.selectAll = selectAll;
window.clearSelection = clearSelection;

// "N ta importyor" tugmasi bosilganda — wrapper'ni va ichidagi child row'larni toggle qiladi
window.toggleImporterWrapper = function(btnEl){
  if(!btnEl) return;
  var parent = btnEl.parentNode;
  if(!parent) return;
  var wrappers = parent.querySelectorAll('.ic-importer-hover');
  if(!wrappers.length) return;
  var isOpen = wrappers[0].style.display === 'block';
  // Toggle wrapper visibility
  for(var i=0; i<wrappers.length; i++){
    wrappers[i].style.display = isOpen ? 'none' : 'block';
    wrappers[i].dataset.pinned = isOpen ? '' : '1';
  }
  // Yopilayotgan bo'lsa — ichidagi barcha ochilgan child row'larni ham yopish
  if(isOpen){
    var importerLinks = parent.querySelectorAll('[onclick*="toggleHiddenChildRow"]');
    for(var k=0; k<importerLinks.length; k++){
      var attr = String(importerLinks[k].getAttribute('onclick') || '');
      var m = attr.match(/toggleHiddenChildRow\(['"]([^'"]+)['"]/);
      if(m && m[1]){
        var rows = document.querySelectorAll('tr[data-child-key="' + m[1] + '"]');
        for(var r=0; r<rows.length; r++) rows[r].style.display = 'none';
        var arrow = importerLinks[k].querySelector('.ic-toggle-arrow');
        if(arrow) arrow.textContent = '▶';
      }
    }
  }
  // Asosiy strelka yangilanadi
  var mainArrow = btnEl.querySelector('.ic-toggle-arrow');
  if(mainArrow) mainArrow.textContent = isOpen ? '▸' : '▾';
};

// Hover badge'da importyor nomi bosilganda — uning to'liq qatorini ko'rsatadi/yashiradi
window.toggleHiddenChildRow = function(childKey, badgeEl){
  if(!childKey) return;
  var rows = document.querySelectorAll('tr[data-child-key="'+childKey+'"]');
  if(!rows || !rows.length) return;
  var firstRow = rows[0];
  // To'g'ri tekshirish: faqat 'none' bo'lsa hidden, aks holda visible
  var isCurrentlyHidden = firstRow.style.display === 'none';
  var willShow = isCurrentlyHidden;
  for(var i=0;i<rows.length;i++){
    rows[i].style.display = willShow ? '' : 'none';
  }
  if(badgeEl){
    var arrow = badgeEl.querySelector('.ic-toggle-arrow');
    if(arrow) arrow.textContent = willShow ? '▼' : '▶';
    // Hover badge'ni pin qilish — biror bola ochilganda yashinmasin (mouseleave bo'lsa ham)
    var hoverContainer = badgeEl.closest('.ic-importer-hover');
    if(hoverContainer){
      // Hozir ochilgan bolalar bormi tekshiramiz
      var arrows = hoverContainer.querySelectorAll('.ic-toggle-arrow');
      var anyExpanded = false;
      for(var j=0;j<arrows.length;j++){
        if(arrows[j].textContent === '▼'){ anyExpanded = true; break; }
      }
      hoverContainer.dataset.pinned = anyExpanded ? '1' : '';
      hoverContainer.style.display = anyExpanded ? 'block' : '';
    }
    if(willShow){
      // Ochilgan importyorga scroll va animatsiya
      setTimeout(function(){
        firstRow.scrollIntoView({behavior:'smooth', block:'nearest'});
        firstRow.style.outline = '2px solid #7C3AED';
        setTimeout(function(){ firstRow.style.outline=''; }, 1500);
      }, 100);
    }
  }
};

function openSentEmailsDrawer(){
  var sent = (DB.investorCompanies||[]).filter(function(r){return r.emailSent;});
  sent.sort(function(a,b){return String(b.emailSentDate||'').localeCompare(String(a.emailSentDate||''));});
  // Group by company key
  var groupsMap = {};
  sent.forEach(function(r){
    var k = (typeof getInvestorCompanyGroupKey==='function') ? getInvestorCompanyGroupKey(r) : String(r.kompaniya||r.id||'').toLowerCase();
    if(!groupsMap[k]) groupsMap[k] = { rep: r, contacts: [] };
    groupsMap[k].contacts.push(r);
  });
  var groups = Object.values(groupsMap);
  var avatarColors = ['#465fff','#059669','#D97706','#7C3AED','#EF4444','#0EA5E9','#EC4899','#8B5CF6'];
  var html = '<div id="sentEmailsDrawer" style="position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#fff;border-top:1px solid var(--border);box-shadow:0 -10px 40px rgba(15,23,42,.25);max-height:80vh;display:flex;flex-direction:column;animation:drawerSlideUp .3s ease">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border);flex-shrink:0">'+
      '<div><div style="font-size:1rem;font-weight:800;color:var(--text)">📧 Email yuborilgan kompaniyalar</div><div style="font-size:.7rem;color:var(--text3);margin-top:2px">Jami: '+groups.length+' ta kompaniya · '+sent.length+' ta kontakt</div></div>'+
      '<button onclick="document.getElementById(\'sentEmailsDrawer\').remove()" style="background:#F3F4F6;border:none;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1rem;color:var(--text2)">✕</button>'+
    '</div>'+
    '<div style="overflow-y:auto;flex:1">'+
      (groups.length === 0
        ? '<div style="text-align:center;padding:3rem;color:var(--text3);font-size:.85rem">Hali email yuborilgan kompaniya yo\'q</div>'
        : '<table style="width:100%;border-collapse:collapse">'+
          '<thead style="background:#F9FAFB;position:sticky;top:0;z-index:1"><tr>'+
            '<th style="padding:10px 16px;text-align:left;font-size:.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--border)">#</th>'+
            '<th style="padding:10px 16px;text-align:left;font-size:.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--border)">Kompaniya</th>'+
            '<th style="padding:10px 16px;text-align:left;font-size:.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--border)">Kontaktlar</th>'+
            '<th style="padding:10px 16px;text-align:left;font-size:.65rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid var(--border)">Yuborilgan</th>'+
          '</tr></thead>'+
          '<tbody>'+
          groups.map(function(g,i){
            var c = g.rep;
            var compName = c.kompaniya || '—';
            var compInitials = compName.split(/\s+/).slice(0,2).map(function(w){return w.charAt(0).toUpperCase()}).join('');
            var avatarColor = avatarColors[i % avatarColors.length];
            return '<tr onclick="openInvestorDetailModal(\''+c.id+'\');document.getElementById(\'sentEmailsDrawer\').remove()" style="cursor:pointer;border-bottom:1px solid #F3F4F6" onmouseover="this.style.background=\'#F9FAFB\'" onmouseout="this.style.background=\'\'">'+
              '<td style="padding:12px 16px;font-size:.78rem;color:var(--text3);font-weight:600;width:40px">'+(i+1)+'</td>'+
              '<td style="padding:12px 16px;width:30%">'+
                '<div style="display:flex;align-items:center;gap:10px">'+
                  '<div style="width:36px;height:36px;border-radius:50%;background:'+avatarColor+'18;color:'+avatarColor+';display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:800;flex-shrink:0">'+compInitials+'</div>'+
                  '<div><div style="font-size:.85rem;font-weight:700;color:#111827">'+escHtml(compName)+'</div>'+
                    (c.davlat ? '<div style="font-size:.66rem;color:#4B5563;margin-top:2px">📍 '+escHtml(c.davlat)+(c.shahar?', '+escHtml(c.shahar):'')+'</div>' : '')+
                  '</div>'+
                '</div>'+
              '</td>'+
              '<td style="padding:12px 16px">'+
                g.contacts.slice(0,3).map(function(p){
                  return '<div style="font-size:.74rem;line-height:1.5">'+
                    '<span style="font-weight:700;color:#111827">'+escHtml(p.rahbar||'—')+'</span>'+
                    (p.lavozim?'<span style="color:#4B5563"> · '+escHtml(p.lavozim)+'</span>':'')+
                    (p.email?'<div style="font-size:.66rem;color:#3B82F6">'+escHtml(p.email)+'</div>':'')+
                  '</div>';
                }).join('')+
                (g.contacts.length > 3 ? '<div style="font-size:.65rem;color:var(--text3);margin-top:3px">+'+(g.contacts.length-3)+' yana</div>' : '')+
              '</td>'+
              '<td style="padding:12px 16px">'+
                g.contacts.map(function(p){
                  return p.emailSentDate ? '<div style="font-size:.7rem;color:#059669;font-weight:600">✅ '+escHtml(p.emailSentDate)+'</div>' : '';
                }).join('')+
              '</td>'+
            '</tr>';
          }).join('')+
          '</tbody></table>')+
    '</div>'+
  '</div>';
  var existing = document.getElementById('sentEmailsDrawer');
  if(existing) existing.remove();
  if(!document.getElementById('drawerKeyframes')){
    var st = document.createElement('style');
    st.id = 'drawerKeyframes';
    st.textContent = '@keyframes drawerSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}';
    document.head.appendChild(st);
  }
  document.body.insertAdjacentHTML('beforeend', html);
}
window.openSentEmailsDrawer = openSentEmailsDrawer;

async function deleteSelectedInvestorCompanies(){
  if(!isAdmin){toast('⚠️ Admin sifatida kiring','error');return;}
  var ids = getSelectedIds();
  if(!ids.length){toast('⚠️ Avval kompaniyalarni tanlang','error');return;}
  if(!confirm(ids.length+' ta kompaniya o\'chirilsinmi?\n\nBu amalni qaytarib bo\'lmaydi.')) return;
  var loadingToast = typeof toastLoading==='function' ? toastLoading('🗑 '+ids.length+' ta kompaniya o\'chirilmoqda...') : null;
  try {
    DB.investorCompanies = (DB.investorCompanies||[]).filter(function(r){return ids.indexOf(String(r.id)) === -1;});
    var jobs = ids.map(function(id){return typeof fbDelete==='function' ? fbDelete('investorCompanies', id) : Promise.resolve();});
    await Promise.all(jobs);
    if(window._icSelectedIds) window._icSelectedIds.clear();
    renderInvestorCompanies();
    renderAdminLists();
    if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, '✅ '+ids.length+' ta kompaniya o\'chirildi','success');
    else toast('✅ '+ids.length+' ta kompaniya o\'chirildi','success');
  } catch(e){
    console.error('Bulk delete error:', e);
    if(loadingToast && typeof toastDone==='function') toastDone(loadingToast, '❌ '+e.message,'error');
    else toast('❌ '+e.message,'error');
  }
}
window.deleteSelectedInvestorCompanies = deleteSelectedInvestorCompanies;

function getSelectedIds(){
  var ids = [];
  if(window._icSelectedIds && window._icSelectedIds.size){
    window._icSelectedIds.forEach(function(id){
      if(ids.indexOf(String(id)) === -1) ids.push(String(id));
    });
  }
  Array.from(document.querySelectorAll('.ic-check:checked')).forEach(function(c){
    String(c.dataset.ids || c.dataset.id || '')
      .split(',')
      .map(function(part){ return String(part || '').trim(); })
      .filter(Boolean)
      .forEach(function(id){
        if(ids.indexOf(id) === -1) ids.push(id);
      });
  });
  return ids;
}

function sendBulkEmail(){
  if(!isAdmin){toast('⚠️ Email yuborish uchun admin sifatida kiring!','error');openAdminOrLogin();return;}
  const ids = getSelectedIds();
  if(!ids.length){ toast('⚠️ Avval kompaniyalarni tanlang!','error'); return; }
  const targets = ids.map(id=>DB.investorCompanies.find(r=>String(r.id)===String(id))).filter(r=>r&&r.email);
  if(!targets.length){ toast('⚠️ Tanlangan kompaniyalarda email manzil topilmadi','error'); return; }

  const withAi = targets.filter(r => r.aiLetterData && r.aiLetterData.body);
  const withoutAi = targets.filter(r => !(r.aiLetterData && r.aiLetterData.body));
  const allHaveAi = withoutAi.length === 0;

  document.getElementById('bulkModalSub').textContent =
    allHaveAi
      ? `${targets.length} ta kompaniyaga AI tayyorlagan xat yuboriladi`
      : `${targets.length} ta kompaniyaga email yuboriladi (${withAi.length} AI xat, ${withoutAi.length} qo'lda matn)`;
  const list = document.getElementById('bulkRcptList');
  list.innerHTML = targets.map((r,idx)=>{
    const hasAi = r.aiLetterData && r.aiLetterData.body;
    const badge = hasAi
      ? '<span style="font-size:.6rem;background:#F0EAFF;color:#7C3AED;padding:2px 6px;border-radius:6px;font-weight:700;white-space:nowrap">🤖 AI xat</span>'
      : '<span style="font-size:.6rem;background:#FEF3F2;color:#D97706;padding:2px 6px;border-radius:6px;font-weight:700;white-space:nowrap">⚠️ qo\'lda</span>';
    const subj = hasAi ? (r.aiLetterData.subject || '') : '';
    const body = hasAi ? (r.aiLetterData.body || '') : '';
    const previewId = 'bulkPrev-' + idx;
    return `
    <div style="border-bottom:1px solid var(--border)">
      <div onclick="togglebulkPreview('${previewId}')" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:6px 4px;gap:8px" onmouseover="this.style.background='rgba(70,95,255,.04)'" onmouseout="this.style.background=''">
        <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
          <span style="font-size:.7rem;color:#9ca3af" id="${previewId}-caret">▸</span>
          ${badge}
          <span style="font-size:.75rem;font-weight:700;color:var(--text)">${escHtml(r.kompaniya||'')}</span>
          <span style="font-size:.65rem;color:var(--text3)">${escHtml(r.rahbar||'')}</span>
        </div>
        <span style="font-size:.65rem;color:#4361EE">${escHtml(r.email||'')}</span>
      </div>
      <div id="${previewId}" style="display:none;padding:8px 10px 12px;background:#F9FAFB;border-radius:8px;margin:4px 0 8px">
        ${hasAi
          ? `<div style="font-size:.7rem;color:#6B7280;margin-bottom:4px"><b>Subject:</b> ${escHtml(subj)}</div>
             <pre style="white-space:pre-wrap;font-family:inherit;font-size:.72rem;line-height:1.55;color:#1F2937;margin:0;background:#fff;padding:10px;border-radius:6px;border:1px solid var(--border);max-height:260px;overflow-y:auto">${escHtml(body)}</pre>`
          : `<div style="font-size:.72rem;color:#D97706">AI xat tayyorlanmagan. Pastdagi umumiy matn yuboriladi.</div>`
        }
      </div>
    </div>`;
  }).join('');

  const msgEl = document.getElementById('bulkEmailMsg');
  if(allHaveAi){
    msgEl.value = '';
    msgEl.style.display = 'none';
    msgEl.removeAttribute('required');
  } else {
    msgEl.style.display = '';
    msgEl.value = `Hurmatli tadbirkor,\n\nNavoiy viloyati investitsiya bo'limi sizning kompaniyangiz bilan hamkorlik qilishdan manfaatdor.\n\nQo'shimcha ma'lumot uchun biz bilan bog'laning.`;
  }
  document.getElementById('bulkProgress').style.display='none';
  document.getElementById('bulkSendBtnModal').disabled=false;
  document.getElementById('bulkSendBtnModal').textContent = allHaveAi ? 'AI XATLARNI YUBORISH 📧' : 'HAMMAGA YUBORISH 📧';
  document.getElementById('bulkCancelBtn').textContent='Bekor qilish';
  document.getElementById('bulkEmailModal').classList.add('open');
  window._bulkTargets = targets;
  window._bulkAllHaveAi = allHaveAi;
}

function closeBulkEmailModal(){
  document.getElementById('bulkEmailModal').classList.remove('open');
  window._bulkTargets = null;
}

function togglebulkPreview(id){
  var el = document.getElementById(id);
  var caret = document.getElementById(id+'-caret');
  if(!el) return;
  var isOpen = el.style.display !== 'none';
  el.style.display = isOpen ? 'none' : 'block';
  if(caret) caret.textContent = isOpen ? '▸' : '▾';
}
window.togglebulkPreview = togglebulkPreview;

async function executeBulkSend(){
  const targets = window._bulkTargets;
  if(!targets||!targets.length) return;
  const msg = document.getElementById('bulkEmailMsg').value.trim();
  if(!msg){ alert('Iltimos, xabar yozing!'); return; }

  const btn = document.getElementById('bulkSendBtnModal');
  const cancelBtn = document.getElementById('bulkCancelBtn');
  btn.disabled=true; btn.textContent='YUBORILMOQDA...';
  cancelBtn.disabled=true;

  const progress = document.getElementById('bulkProgress');
  const progressText = document.getElementById('bulkProgressText');
  const progressCount = document.getElementById('bulkProgressCount');
  const progressBar = document.getElementById('bulkProgressBar');
  progress.style.display='block';

  emailjs.init('tPxgtKC4xvZkjqpd7');
  window._sgKey  = 'SG.aiNmC8tRRXqoubmIuHF-Ig.lzv7lZq26zm-In5xcAQ0QtQBH0VXzMaRXXXXE92dYpE';
  window._sgFrom = 'thelivezoneuz1@gmail.com';
  let sent=0, failed=0;

  for(let i=0; i<targets.length; i++){
    const r = targets[i];
    const mailboxEmail = getPrimaryMailboxEmail();
    progressText.textContent = `"${r.kompaniya}" ga yuborilmoqda...`;
    progressCount.textContent = `${i+1}/${targets.length}`;
    progressBar.style.width = `${Math.round((i+1)/targets.length*100)}%`;
    try{
      const result = await emailjs.send('service_1w08xxe','template_c1nxcvg',{
        to_email: r.email,
        to_name: r.rahbar,
        company_name: r.kompaniya,
        message: msg,
        reply_to: mailboxEmail || '',
        from_name: 'Navoiy Investitsiya Bo\'limi',
      });
      if(result.status===200){
        const rec = DB.investorCompanies.find(x=>String(x.id)===String(r.id));
        if(rec){
          rec.emailSent=true;
          rec.emailSentDate=new Date().toISOString().split('T')[0];
          rec.sentByMailbox = mailboxEmail || '';
          if(typeof fbSave==='function') fbSave('investorCompanies',rec);
        }
        recordMailboxActivity(mailboxEmail, 'cold', 1);
        sent++;
      } else { failed++; }
    } catch(e){ console.error(e); failed++; }
    // Small delay to avoid rate limit
    if(i < targets.length-1) await new Promise(res=>setTimeout(res,500));
  }

  renderInvestorCompanies();
  if(typeof renderPipeline==='function') renderPipeline();
  progressText.textContent = `✅ ${sent} ta yuborildi${failed?`, ❌ ${failed} ta xato`:''}`;
  progressBar.style.background = failed ? 'linear-gradient(90deg,#059669,#EF233C)' : 'linear-gradient(90deg,#059669,#06D6A0)';
  btn.textContent = 'TAYYOR ✅';
  cancelBtn.disabled=false; cancelBtn.textContent='Yopish';
  toast(`✅ ${sent} ta emaildan ${sent} tasi yuborildi!`, 'success');
  window._bulkTargets = null;
}

/* ═══════════════════════════════════════
   EXCEL EXPORT — foydalanuvchi yuborgan namuna shablonni AYNAN saqlaydi
   ExcelJS bilan — barcha styling, border, color, merge to'liq saqlanadi
═══════════════════════════════════════ */
async function exportSelectedToExcel(){
  if(typeof ExcelJS === 'undefined' || !ExcelJS){
    toast('❌ ExcelJS kutubxonasi yuklanmagan','error');
    return;
  }
  var ids = (typeof getSelectedIds === 'function') ? getSelectedIds() : [];
  if(!ids.length){ toast('⚠️ Avval kompaniyalarni tanlang','error'); return; }
  var co = DB.investorCompanies || [];
  var selected = co.filter(function(r){ return ids.indexOf(String(r.id)) !== -1; });
  if(!selected.length){ toast('⚠️ Tanlangan kompaniyalar topilmadi','error'); return; }

  // Dedupe by group key
  var seen = {};
  var rows = [];
  selected.forEach(function(rec){
    var k = (typeof getInvestorCompanyGroupKey === 'function') ? getInvestorCompanyGroupKey(rec) : String(rec.kompaniya || rec.id || '').toLowerCase().trim();
    if(!k || seen[k]) return;
    seen[k] = true;
    rows.push(rec);
  });

  // Davlat nomlarini O'zbekchaga tarjima qilish
  var COUNTRY_UZ = {
    'south korea':'Janubiy Koreya','korea, south':'Janubiy Koreya','korea':'Janubiy Koreya','republic of korea':'Janubiy Koreya',
    'north korea':'Shimoliy Koreya','korea, north':'Shimoliy Koreya',
    'uzbekistan':"O'zbekiston",'uz':"O'zbekiston",
    'united states':'AQSh','usa':'AQSh','us':'AQSh','united states of america':'AQSh',
    'china':'Xitoy','cn':'Xitoy','people\'s republic of china':'Xitoy',
    'japan':'Yaponiya','jp':'Yaponiya',
    'germany':'Germaniya','de':'Germaniya','deutschland':'Germaniya',
    'france':'Fransiya','fr':'Fransiya',
    'united kingdom':'Buyuk Britaniya','uk':'Buyuk Britaniya','great britain':'Buyuk Britaniya','britain':'Buyuk Britaniya','england':'Buyuk Britaniya',
    'italy':'Italiya','it':'Italiya','italia':'Italiya',
    'spain':'Ispaniya','es':'Ispaniya',
    'russia':'Rossiya','russian federation':'Rossiya','ru':'Rossiya',
    'turkey':'Turkiya','türkiye':'Turkiya','tr':'Turkiya',
    'india':'Hindiston','in':'Hindiston',
    'kazakhstan':"Qozog'iston",'kz':"Qozog'iston",
    'kyrgyzstan':"Qirg'iziston",'kg':"Qirg'iziston",
    'tajikistan':'Tojikiston','tj':'Tojikiston',
    'turkmenistan':'Turkmaniston','tm':'Turkmaniston',
    'azerbaijan':'Ozarbayjon','az':'Ozarbayjon',
    'armenia':'Armaniston','am':'Armaniston',
    'georgia':'Gruziya','ge':'Gruziya',
    'belarus':'Belorussiya','by':'Belorussiya',
    'ukraine':'Ukraina','ua':'Ukraina',
    'moldova':'Moldova','md':'Moldova',
    'iran':'Eron','ir':'Eron',
    'iraq':'Iroq','iq':'Iroq',
    'saudi arabia':'Saudiya Arabistoni','sa':'Saudiya Arabistoni',
    'united arab emirates':'BAA','uae':'BAA','ae':'BAA','emirates':'BAA',
    'israel':'Isroil','il':'Isroil',
    'egypt':'Misr','eg':'Misr',
    'pakistan':'Pokiston','pk':'Pokiston',
    'bangladesh':'Bangladesh','bd':'Bangladesh',
    'vietnam':'Vyetnam','vn':'Vyetnam',
    'thailand':'Tayland','th':'Tayland',
    'indonesia':'Indoneziya','id':'Indoneziya',
    'malaysia':'Malayziya','my':'Malayziya',
    'philippines':'Filippin','ph':'Filippin',
    'singapore':'Singapur','sg':'Singapur',
    'taiwan':'Tayvan','tw':'Tayvan',
    'hong kong':'Gonkong','hk':'Gonkong',
    'mongolia':'Mongoliya','mn':'Mongoliya',
    'australia':'Avstraliya','au':'Avstraliya',
    'new zealand':'Yangi Zelandiya','nz':'Yangi Zelandiya',
    'canada':'Kanada','ca':'Kanada',
    'mexico':'Meksika','mx':'Meksika',
    'brazil':'Braziliya','br':'Braziliya',
    'argentina':'Argentina','ar':'Argentina',
    'netherlands':'Niderlandiya','nl':'Niderlandiya',
    'belgium':'Belgiya','be':'Belgiya',
    'sweden':'Shvetsiya','se':'Shvetsiya',
    'norway':'Norvegiya','no':'Norvegiya',
    'denmark':'Daniya','dk':'Daniya',
    'finland':'Finlandiya','fi':'Finlandiya',
    'switzerland':'Shveytsariya','ch':'Shveytsariya',
    'austria':'Avstriya','at':'Avstriya',
    'poland':'Polsha','pl':'Polsha',
    'czech republic':'Chexiya','czechia':'Chexiya','cz':'Chexiya',
    'hungary':'Vengriya','hu':'Vengriya',
    'greece':'Yunoniston','gr':'Yunoniston',
    'portugal':'Portugaliya','pt':'Portugaliya',
    'ireland':'Irlandiya','ie':'Irlandiya',
    'qatar':'Qatar','qa':'Qatar',
    'kuwait':'Kuvayt','kw':'Kuvayt',
    'oman':'Ummon','om':'Ummon',
    'bahrain':'Bahrayn','bh':'Bahrayn',
    'jordan':'Iordaniya','jo':'Iordaniya',
    'south africa':'Janubiy Afrika','za':'Janubiy Afrika',
    'nigeria':'Nigeriya','ng':'Nigeriya',
    'kenya':'Keniya','ke':'Keniya',
    'morocco':'Marokash','ma':'Marokash',
    'algeria':'Jazoir','dz':'Jazoir',
    'tunisia':'Tunis','tn-iso':'Tunis'
  };
  function _toUzCountry(name){
    var raw = String(name||'').trim();
    if(!raw) return '';
    var key = raw.toLowerCase();
    return COUNTRY_UZ[key] || raw;
  }

  // Mahsulot nomi va HS kodini ajratish
  function _parseProduct(rec){
    var raw = String(rec.mahsulotNomi || rec.soha || '').trim();
    var hs = String(rec.mahsulotHs || rec.hsCode || '').trim().replace(/\D/g,'');
    // mahsulotNomi'dan HS kod ajratish (agar yozilgan bo'lsa)
    if(!hs){
      var m = raw.match(/HS\s*(\d{2,10})/i);
      if(m) hs = m[1];
    }
    // mahsulot nomidan HS prefiksi va manual qavslarini olib tashlash
    var name = raw
      .replace(/^HS\s*\d{2,10}\s*(\([^)]+\))?\s*[-—:]?\s*/i, '')
      .replace(/^\s*[-—:]\s*/, '')
      .trim();
    if(!name) name = raw;
    return { name: name, hs: hs };
  }

  // Bo'sh yoki faqat punctuation (".", ",", ";", "-") qiymatni "ma'nosiz" deb hisoblash
  function _isMeaningful(s){
    var t = String(s || '').trim();
    if(!t) return false;
    return !/^[.,;\-_\s]+$/.test(t);
  }
  function _buildContacts(rec){
    var parts = [];
    var n = String(rec.contact || rec.kontakt || '').trim();
    var pos = String(rec.position || rec.lavozim || '').trim();
    var em = String(rec.email || '').trim();
    var tel = String(rec.telefon || rec.phone || '').trim();
    if(_isMeaningful(n)) parts.push(n + (_isMeaningful(pos) ? (' (' + pos + ')') : ''));
    if(_isMeaningful(em)) parts.push(em);
    if(_isMeaningful(tel)) parts.push(tel);
    return parts.length ? parts.join(', ') : '-';
  }
  function _buildImporter(rec){
    var imp = null;
    if(Array.isArray(rec._partners) && rec._partners.length){
      imp = rec._partners.find(function(p){ return p.role === 'importer' || !p.role; }) || rec._partners[0];
    }
    if(!imp && Array.isArray(rec._partnerOf) && rec._partnerOf.length){
      imp = rec._partnerOf.find(function(p){ return p.role === 'importer' || !p.role; }) || rec._partnerOf[0];
    }
    if(!imp) return { name: '-', country: '-', contacts: '-' };
    var cParts = [imp.contact, imp.email, imp.telefon].filter(_isMeaningful);
    var contacts = cParts.length ? cParts.join(', ') : '-';
    var impName = String(imp.kompaniya || imp.name || '').trim();
    var impCountry = _toUzCountry(imp.davlat || imp.country || '');
    return {
      name: _isMeaningful(impName) ? impName : '-',
      country: _isMeaningful(impCountry) ? impCountry : '-',
      contacts: contacts
    };
  }
  // Batafsil panel'da ko'rsatiladigan jami hajm/qiymat — _partners/_partnerOf'dan yig'ish
  function _sumTradeData(rec){
    var totalQty = Number(rec._tradeAtlasQuantity || rec.weight || 0) || 0;
    var totalValue = Number(rec._tradeAtlasTradeValue || rec.import_volume || rec.summa || 0) || 0;
    // Agar _partners array'da ham ma'lumot bo'lsa — yig'amiz (batafsil panel mantig'i)
    if(Array.isArray(rec._partners) && rec._partners.length){
      var qtySum = 0, valSum = 0;
      rec._partners.forEach(function(p){
        qtySum += Number(p.totalQty || 0) || 0;
        valSum += Number(p.totalValue || 0) || 0;
      });
      if(qtySum > totalQty) totalQty = qtySum;
      if(valSum > totalValue) totalValue = valSum;
    }
    if(Array.isArray(rec._partnerOf) && rec._partnerOf.length){
      var qS = 0, vS = 0;
      rec._partnerOf.forEach(function(p){
        qS += Number(p.totalQty || 0) || 0;
        vS += Number(p.totalValue || 0) || 0;
      });
      if(qS > totalQty) totalQty = qS;
      if(vS > totalValue) totalValue = vS;
    }
    return { qty: totalQty, value: totalValue };
  }
  // Ming dollar yaxlitligida — masalan: $110000 → "110", $100 → "0.1", $50 → "0.05"
  function _fmtMoneyK(n){
    var v = Number(n) || 0;
    if(!v) return '-';
    var k = v / 1000;
    if(k >= 100) return String(Math.round(k));      // 110, 1500
    if(k >= 1)   return (Math.round(k * 10) / 10) + ''; // 1.5 yoki 5
    if(k >= 0.1) return (Math.round(k * 100) / 100) + ''; // 0.1, 0.15
    return (Math.round(k * 1000) / 1000) + '';      // 0.005 yoki kichikroq
  }
  function _fmtWeight(kg){
    var v = Number(kg) || 0;
    if(!v) return '';
    if(v >= 1e6) return (v/1e6).toFixed(1) + ' Kt';
    if(v >= 1e3) return (v/1e3).toFixed(0) + ' t';
    return v + ' kg';
  }

  var countries = {};
  rows.forEach(function(r){
    var c = String(r.davlat || r.country || '').trim();
    if(c) countries[c] = (countries[c]||0) + 1;
  });
  var topCountry = Object.keys(countries).sort(function(a,b){return countries[b]-countries[a];})[0] || '__';
  var nowD = new Date();
  var year = nowD.getFullYear();
  var loadingToast = (typeof toastLoading === 'function') ? toastLoading('⏳ Namuna shablon yuklanmoqda...') : null;

  try {
    // Namuna shablonni ExcelJS bilan yuklab olish — barcha styling saqlanadi
    // Cache-bust: har safar yangi versiyani majburlash
    var resp = await fetch('assets/templates/manzilli-template.xlsx?t=' + Date.now(), { cache: 'no-store' });
    if(!resp.ok) throw new Error('Namuna fayl yuklanmadi (HTTP ' + resp.status + ')');
    var buf = await resp.arrayBuffer();
    var wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    var ws = wb.worksheets[0];
    if(!ws) throw new Error('Namuna sheet topilmadi');

    // Title (R2 — A2:L2 merged) — davlat nomi O'zbekchada
    var titleCell = ws.getCell('A2');
    var topCountryUz = _toUzCountry(topCountry);
    titleCell.value = topCountryUz + ' davlatidan O\'zbekiston davlatiga ' + year + '-yilda eksport qilgan kompaniyalarning\r\nMANZILLI RO\'YXATI';

    // Jami: ___ ta — C6 va J6 (orange row) — value yangilanadi
    ws.getCell('C6').value = 'Jami: ' + rows.length + ' ta';
    ws.getCell('J6').value = 'Jami: ' + rows.length + ' ta';
    // H6 — Eksport qiymati umumiy yig'indisi (ming dollarda)
    var totalExportValue = rows.reduce(function(sum, r){
      var t = _sumTradeData(r);
      return sum + (Number(t.value) || 0);
    }, 0);
    ws.getCell('H6').value = totalExportValue ? _fmtMoneyK(totalExportValue) : 0;

    // ═══ Har eksportyor — har importyor uchun alohida row (counterpart bo'lsa) ═══
    // BOBUR 2 importerga eksport qilgan bo'lsa → 2 ta row, har biri o'zining qty/value bilan
    var expandedRows = [];
    rows.forEach(function(r){
      // Importyor sheriklarni topish (_partners + _partnerOf'dan, faqat importer rol)
      var partners = [];
      if(Array.isArray(r._partners)){
        r._partners.forEach(function(p){
          if(!p || !p.kompaniya) return;
          var role = String(p.role || '').toLowerCase();
          if(role && role !== 'importer') return;
          partners.push(p);
        });
      }
      if(Array.isArray(r._partnerOf)){
        r._partnerOf.forEach(function(p){
          if(!p || !p.kompaniya) return;
          var role = String(p.role || '').toLowerCase();
          if(role && role !== 'importer') return;
          // Dedupe — bir xil nom 2 marta kirmasligi uchun
          var dup = partners.find(function(x){ return String(x.kompaniya||'').toLowerCase() === String(p.kompaniya||'').toLowerCase(); });
          if(!dup) partners.push(p);
        });
      }
      if(partners.length){
        // Har sherik uchun alohida row
        partners.forEach(function(p){
          expandedRows.push({
            exporter: r,
            partner: p,
            qty: Number(p.totalQty || 0),
            value: Number(p.totalValue || 0)
          });
        });
      } else {
        // Sherik yo'q — eksportyor o'zi (importyor ma'lumotsiz)
        expandedRows.push({
          exporter: r,
          partner: null,
          qty: Number(r._tradeAtlasQuantity || r.weight || 0),
          value: Number(r._tradeAtlasTradeValue || r.import_volume || r.summa || 0)
        });
      }
    });

    // Data rows — R7 dan boshlanadi
    var DATA_START_ROW = 7;
    var TEMPLATE_ROWS = 8; // R7..R14 namunadagi qatorlar

    expandedRows.forEach(function(er, i){
      var r = er.exporter;
      var p = er.partner;
      var product = _parseProduct(r);
      var rowNum = DATA_START_ROW + i;

      // Agar template'da bunday qator yo'q bo'lsa — yangi qator yaratiladi va styling 1-row'dan ko'chiriladi
      if(i >= TEMPLATE_ROWS){
        var refRow = ws.getRow(DATA_START_ROW);
        var newRow = ws.getRow(rowNum);
        if(refRow.height) newRow.height = refRow.height;
        ['A','B','C','D','E','F','G','H','I','J','K','L'].forEach(function(L){
          var refCell = ws.getCell(L + DATA_START_ROW);
          var newCell = ws.getCell(L + rowNum);
          if(refCell.style) newCell.style = JSON.parse(JSON.stringify(refCell.style));
        });
      }

      var exporterContacts = _buildContacts(r);
      // Importyor ma'lumotlari — partner mavjud bo'lsa, undan; aks holda _buildImporter (eski)
      var impName = '-', impCountry = '-', impContacts = '-';
      if(p){
        impName = String(p.kompaniya || '').trim() || '-';
        impCountry = _toUzCountry(p.davlat || p.country || '') || '-';
        var cParts = [p.email, p.tel, p.telefon, p.contact].filter(_isMeaningful);
        impContacts = cParts.length ? cParts.join(', ') : '-';
      } else {
        var imp = _buildImporter(r);
        impName = imp.name; impCountry = imp.country; impContacts = imp.contacts;
      }

      // Hujayra qiymatlarini yozish
      ws.getCell('A' + rowNum).value = i + 1;
      ws.getCell('B' + rowNum).value = 'Navoiy viloyati';
      ws.getCell('C' + rowNum).value = String(r.kompaniya || '').trim() || '-';
      ws.getCell('D' + rowNum).value = _toUzCountry(r.davlat || r.country || '') || '-';
      ws.getCell('E' + rowNum).value = product.name || '-';
      ws.getCell('F' + rowNum).value = product.hs || '-';
      ws.getCell('G' + rowNum).value = er.qty ? _fmtWeight(er.qty) : '-';
      ws.getCell('H' + rowNum).value = er.value ? _fmtMoneyK(er.value) : '-';
      ws.getCell('I' + rowNum).value = exporterContacts;
      ws.getCell('J' + rowNum).value = impName;
      ws.getCell('K' + rowNum).value = impCountry;
      ws.getCell('L' + rowNum).value = impContacts;
    });

    // Total row Jami: __ ta yangilanadi (expandedRows soniga)
    ws.getCell('C6').value = 'Jami: ' + expandedRows.length + ' ta';
    ws.getCell('J6').value = 'Jami: ' + expandedRows.length + ' ta';
    // Jami eksport qiymati — expandedRows yig'indisi
    var totalExpValue = expandedRows.reduce(function(s, e){ return s + (Number(e.value) || 0); }, 0);
    ws.getCell('H6').value = totalExpValue ? _fmtMoneyK(totalExpValue) : 0;

    // Ortiqcha bo'sh template qatorlarini o'chirish
    if(expandedRows.length < TEMPLATE_ROWS){
      var firstEmptyRow = DATA_START_ROW + expandedRows.length;
      var emptyCount = TEMPLATE_ROWS - expandedRows.length;
      ws.spliceRows(firstEmptyRow, emptyCount);
    }

    // Saqlash
    var dd = String(nowD.getDate()).padStart(2,'0');
    var mm = String(nowD.getMonth()+1).padStart(2,'0');
    var yyyy = nowD.getFullYear();
    var fname = 'Kompaniyalar_ro\'yxati_' + dd + '.' + mm + '.' + yyyy + '.xlsx';

    var outBuf = await wb.xlsx.writeBuffer();
    var blob = new Blob([outBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fname;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 100);

    if(loadingToast && typeof toastDone === 'function') toastDone(loadingToast, '✅ ' + rows.length + ' ta kompaniya namuna Excel\'ga to\'ldirildi: ' + fname, 'success');
    else toast('✅ ' + rows.length + ' ta kompaniya namuna Excel\'ga to\'ldirildi: ' + fname,'success');
  } catch(e){
    console.error('Excel export error:', e);
    if(loadingToast && typeof toastDone === 'function') toastDone(loadingToast, '❌ Excel saqlanmadi: ' + (e.message||e), 'error');
    else toast('❌ Excel saqlanmadi: ' + (e.message||e),'error');
  }
}
window.exportSelectedToExcel = exportSelectedToExcel;
