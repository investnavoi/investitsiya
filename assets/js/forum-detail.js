/* ═══════════════════════════════════════
   FORUM DETAIL & EDIT
═══════════════════════════════════════ */
var _forumDetailId = null;

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

  var stateStats = {};
  companies.forEach(function(rec){
    var code = getInvestorGeoStateCode(rec, {});
    if(!code) return;
    if(!stateStats[code]){
      stateStats[code] = { code: code, name: String(getInvestorGeoCountrySource(rec) || code), count: 0, companies: [], lat: null, lon: null };
    }
    stateStats[code].count += 1;
    if(rec.kompaniya) stateStats[code].companies.push(String(rec.kompaniya));
    if(stateStats[code].lat == null || stateStats[code].lon == null){
      var geo = getInvestorGeoHub(rec);
      if(geo){ stateStats[code].lat = geo.lat; stateStats[code].lon = geo.lon; }
    }
  });
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
  metaEl.textContent = companies.length + ' ta kompaniya \u00b7 ' + countryCount + ' ta davlat';

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
  if(source.indexOf('tradeatlas') !== -1 && displayContacts.length){
    return [displayContacts[0]];
  }
  return [];
}

function getFinderVisibleContacts(item){
  return getFinderRenderableContacts(item);
}

function finderResultIsRenderable(item){
  if(item && item.manba === 'Apollo Top 100') return !!(item.kompaniya);
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
  extras += finderContactHasPhone(contact)
    ? '<div style="font-size:.58rem;color:#059669;margin-top:2px">'+escHtml(contact.telefon)+'</div>'
    : '<div style="font-size:.58rem;color:var(--text3)">— Tel yo\'q</div>';
  return renderPersonNameWithPhoto(contact.name, contact.photoUrl, extras, 28);
}

function renderFinderContactsHtml(contacts){
  var list = Array.isArray(contacts) ? contacts.filter(finderContactIsQualified) : [];
  if(!finderHasMinimumContactSet(list)){
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
    tabsEl.innerHTML += '<div onclick="filterFinderByCountry(\''+cn+'\')" style="flex:0 0 auto;padding:8px 14px;cursor:pointer;font-size:.7rem;font-weight:600;'+(activeCountry === cn ? activeStyle : inactiveStyle)+'">'+getFinderCountryFlag(cn)+' '+getFinderCountryLabel(cn)+' ('+countryGroups[cn].length+')</div>';
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
  if(Array.isArray(item.contacts) && item.contacts.length){
    var removed = false;
    item.contacts = item.contacts.filter(function(candidate){
      if(removed) return true;
      var same = apolloContactKey(candidate) === apolloContactKey(contact);
      if(!same){
        same = !!contact.email && String(candidate.email || '').trim().toLowerCase() === String(contact.email || '').trim().toLowerCase();
      }
      if(same){
        removed = true;
        return false;
      }
      return true;
    });
    apolloApplyCompanyContacts(item);
  }
  if(getFinderVisibleContacts(item).length < 1){
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

function openInvestorDetailModal(id){
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
    '<div style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(260px,.8fr);gap:1rem;align-items:start">'+
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
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Daromad</div><div style="font-size:.95rem;font-weight:800;color:var(--text);margin-top:4px">'+escHtml(rec.daromad || '—')+'</div></div>'+
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">T/yil</div><div style="font-size:.95rem;font-weight:800;color:var(--text);margin-top:4px">'+escHtml(rec.tpilyil || '—')+'</div></div>'+
          '<div style="padding:.8rem;border:1px solid var(--border);border-radius:12px;background:#fff"><div style="font-size:.62rem;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Telefon</div><div style="font-size:.85rem;font-weight:700;color:var(--text);margin-top:4px">'+escHtml(rec.telefon || rec.tel || '—')+'</div></div>'+
        '</div>'+
        '<div style="margin-top:.9rem;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap">'+
          '<button type="button" onclick="enrichAndReopen(\''+rec.id+'\')" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:linear-gradient(135deg,#059669,#06D6A0);color:#fff;border:none;border-radius:10px;font-size:.78rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(5,150,105,.25)" title="Apollo people_search — credit ishlatmaydi">⚡ Yangilash <span style="font-size:.62rem;background:rgba(255,255,255,.25);padding:2px 6px;border-radius:6px">bepul</span></button>'+
          '<button type="button" onclick="enrichAndReopenPaid(\''+rec.id+'\')" style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:linear-gradient(135deg,#7C3AED,#465fff);color:#fff;border:none;border-radius:10px;font-size:.78rem;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(124,58,237,.25)" title="Apollo org_enrichment — telefon va to\'liq ma\'lumot, 1 credit">💎 To\'liq ma\'lumot <span style="font-size:.62rem;background:rgba(255,255,255,.25);padding:2px 6px;border-radius:6px">1 credit</span></button>'+
        '</div>'+
      '</div>'+
      '<div style="display:grid;gap:.85rem">'+
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
    '</div>';
  modal.classList.add('open');
  modal.style.display = 'flex';
}
window.openInvestorDetailModal = openInvestorDetailModal;

function openInvestorSohaEdit(id){
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

  var productFilter = _investorProductFilterId
    ? (DB.products || []).find(function(item){ return String(item.id || '') === String(_investorProductFilterId || ''); }) || null
    : null;

  const co = allCo.filter(function(r){
    if(_investorGeoFilterStateCode && getInvestorGeoStateCode(r, window._investorGeoStateStats || {}) !== _investorGeoFilterStateCode) return false;
    if(productFilter && !investorCompanyMatchesProductFilter(r, productFilter)) return false;
    return true;
  });

  var allGroupMap = Object.create(null);
  var tayyor = 0, emailSent = 0, hasEmail = 0;
  var emailSentGroups = Object.create(null);
  var hasEmailGroups = Object.create(null);
  allCo.forEach(function(rec){
    var key = getInvestorCompanyGroupKey(rec);
    allGroupMap[key] = true;
    if(rec.holat === 'Tayyor') tayyor++;
    if(rec.emailSent) emailSentGroups[key] = true;
    if(rec.email) hasEmailGroups[key] = true;
  });
  emailSent = Object.keys(emailSentGroups).length;
  hasEmail = Object.keys(hasEmailGroups).length;
  const total = allCo.reduce(function(s, r){ return s + (parseFloat(r.summa) || 0); }, 0);
  var groupCount = Object.keys(allGroupMap).length;
  document.getElementById('ic-k1').textContent = groupCount;
  document.getElementById('ic-k2').textContent = tayyor;
  document.getElementById('ic-k3').textContent = emailSent + '/' + hasEmail;
  const ic4 = document.getElementById('ic-k4'); if(ic4) ic4.textContent = '$' + Math.round(total / 1e6) + 'M';
  document.getElementById('badge-investorco').textContent = groupCount;

  /* Skip expensive map re-render if company geo data hasn't changed */
  var geoHash = allCo.map(function(r){ return (r.id||'')+'|'+(r.davlat||r.country||''); }).join(',');
  if(geoHash !== _icGeoHash){
    _icGeoHash = geoHash;
    renderInvestorGeoCard(allCo);
  }
  renderIcCharts(allCo);
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

  const tb = document.getElementById('ic-tbody');
  if(!grouped.length){
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--ta-gray-400);font-size:.85rem">Ma\'lumot topilmadi</td></tr>';
    if(typeof mountInvestorAiWorkspace === 'function') mountInvestorAiWorkspace();
    return;
  }

  var icTotalPages = Math.max(1, Math.ceil(grouped.length / IC_PAGE_SIZE));
  if(_icPage > icTotalPages) _icPage = icTotalPages;
  if(_icPage < 1) _icPage = 1;
  var icStart = (_icPage - 1) * IC_PAGE_SIZE;
  var icEnd = icStart + IC_PAGE_SIZE;
  var groupPage = grouped.slice(icStart, icEnd);

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
      paginEl.innerHTML = '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:.75rem 0">'+prevBtn+pages.join('')+nextBtn+'<span style="font-size:.72rem;color:var(--text3);margin-left:6px">'+grouped.length+' ta / '+_icPage+'-bet</span></div>';
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
    var rowNumber = icStart + groupIdx + 1;
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
          ? '<div style="display:flex;align-items:flex-start;gap:6px;min-width:0;word-break:break-word"><span style="font-size:.78rem;color:#1F2937;font-weight:500;word-break:break-word;white-space:normal;line-height:1.35">'+escHtml(sohaValue)+'</span>'+(isAdmin?'<button type="button" onclick="openInvestorSohaEdit(\''+sohaEditRecord.id+'\')" title="Soha tahrirlash" style="border:none;background:none;color:#465fff;cursor:pointer;font-size:.82rem;line-height:1;padding:2px;flex-shrink:0">✏️</button>':'')+'</div>'
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
        (countryName ? getFinderCountryFlag(countryName)+' ' : '') +
        '<span>'+escHtml((countryLabel||countryName)+(cityText?', '+cityText:''))+'</span></div>';
    }
    var companyHtml = '<div onclick="openInvestorDetailModal(\''+companyRec.id+'\')" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:4px 6px;border-radius:8px;transition:background .15s" onmouseover="this.style.background=\'rgba(70,95,255,.06)\'" onmouseout="this.style.background=\'\'" title="Batafsil">' +
      '<div style="width:38px;height:38px;border-radius:50%;background:'+avatarColor+'18;color:'+avatarColor+';display:flex;align-items:center;justify-content:center;font-size:.76rem;font-weight:800;flex-shrink:0">'+compInitials+'</div>' +
      '<div><div style="font-size:.85rem;font-weight:700;color:#111827">'+escHtml(compName)+'</div>' +
      (companyRec.website ? '<div style="font-size:.66rem;color:#6366F1;margin-top:1px">'+escHtml(companyRec.website)+'</div>' : '') +
      locationLine +
      '</div></div>';

    var html = '';
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
      /* Contact cell TailAdmin style */
      var contactHtml = '<div style="min-width:0;word-break:break-word">';
      if(contact.name) contactHtml += '<div style="font-size:.82rem;font-weight:700;color:#111827;word-break:break-word">'+escHtml(contact.name)+'</div>';
      if(contact.title) contactHtml += '<div style="font-size:.68rem;color:#4B5563;margin-top:2px;word-break:break-word">'+escHtml(contact.title)+'</div>';
      if(contact.email) contactHtml += '<div style="font-size:.68rem;color:#3B82F6;margin-top:2px;word-break:break-all;font-weight:500">'+escHtml(contact.email)+'</div>';
      if(contact.telefon && contact.telefon !== '—') contactHtml += '<div style="font-size:.65rem;color:#6B7280;margin-top:2px">'+escHtml(contact.telefon)+'</div>';
      if(!contact.name && !contact.email) contactHtml += '<span style="color:var(--ta-gray-300)">—</span>';
      contactHtml += '</div>';

      var groupBorderStyle = recIdx === 0 ? 'border-top:2px solid rgba(67,97,238,.15);' : '';
      html += '<tr id="investor-row-'+rec.id+'" style="transition:background .15s;'+groupBorderStyle+'" onmouseover="this.style.background=\'rgba(70,95,255,.03)\'" onmouseout="this.style.background=\'\'">';
      if(recIdx === 0){
        html += '<td rowspan="'+recs.length+'" style="padding-left:1.25rem;vertical-align:middle">'+(isAdmin ? ('<input type="checkbox" class="ic-check" data-ids="'+tgEscapeAttr(groupIds)+'" onchange="saveIcCheck(this);updateSelectedCount()" style="width:18px;height:18px;border-radius:5px;accent-color:#465fff;cursor:pointer">') : '')+'</td>';
        html += '<td rowspan="'+recs.length+'" style="font-size:.82rem;color:#374151;font-weight:600;vertical-align:middle">'+rowNumber+'</td>';
        html += '<td rowspan="'+recs.length+'" style="vertical-align:middle">'+companyHtml+'</td>';
      }
      html += '<td style="vertical-align:middle">'+contactHtml+'</td>';
      if(recIdx === 0){
        html += '<td rowspan="'+recs.length+'" style="vertical-align:middle">'+sohaCell+'</td>';
      }
      /* Status badge */
      html += '<td style="vertical-align:middle">'+getEmailStatusBadge(rec)+'</td>';
      /* Action buttons - TailAdmin style SVG icons */
      var _abtn = 'width:30px;height:30px;border-radius:7px;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:all .2s ease;flex-shrink:0;';
      var _srcBadge = '';
      var _srcRaw = String(rec.manba || rec.source || companyRec.manba || companyRec.source || '').toLowerCase();
      var _isApolloSource = _srcRaw.indexOf('apollo') !== -1 || _srcRaw === 'csv-import' || _srcRaw === 'csv import' || _srcRaw === 'finder';
      if(_isApolloSource){
        _srcBadge = '<span title="Apollo" style="width:26px;height:26px;border-radius:7px;background:#FFE600;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:4px"><img src="assets/apollo.ico" alt="Apollo" style="width:18px;height:18px;display:block"></span>';
      } else if(_srcRaw.indexOf('tradeatlas') !== -1 || _srcRaw === 'trade'){
        _srcBadge = '<span title="TradeAtlas" style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#1E3A8A,#1E40AF);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.55rem;font-weight:800;flex-shrink:0;margin-right:4px;letter-spacing:-.02em">TA</span>';
      }
      html += '<td style="vertical-align:middle">' +
        '<div style="display:flex;gap:4px;align-items:center;flex-wrap:nowrap">' +
        _srcBadge +
        (isAdmin
          ? '<button style="'+_abtn+'background:transparent;padding:0" onclick="openInvestorAiWorkspace(\''+rec.id+'\')" title="AI xat va tahlil"><svg width="26" height="26" viewBox="0 0 24 24"><defs><radialGradient id="aiGrad'+rec.id+'" cx="50%" cy="40%" r="65%"><stop offset="0%" stop-color="#FFB554"/><stop offset="100%" stop-color="#F57C00"/></radialGradient></defs><circle cx="12" cy="12" r="11" fill="url(#aiGrad'+rec.id+')"/><text x="12" y="16" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="11" fill="#fff">Ai</text></svg></button>' +
            (rec.email ? '<button style="'+_abtn+'background:#EFF4FF;color:#3B82F6" onclick="openEmailModal(\''+rec.id+'\')" title="Xabar yuborish" onmouseover="this.style.background=\'#3B82F6\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'#EFF4FF\';this.style.color=\'#3B82F6\'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17 20.5H7c-3 0-5-1.5-5-5v-7c0-3.5 2-5 5-5h10c3 0 5 1.5 5 5v7c0 3.5-2 5-5 5z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 9l-3.13 2.5c-1.03.82-2.72.82-3.75 0L7 9" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : '') +
            (rec.email ? '<button style="'+_abtn+'background:'+(rec.emailSchedule?.active?'#ECFDF5':'#F3F4F6')+';color:'+(rec.emailSchedule?.active?'#059669':'#6B7280')+'" onclick="openScheduleModal(\''+rec.id+'\')" title="Email rejalashtirish" onmouseover="this.style.background=\''+(rec.emailSchedule?.active?'#059669':'#6B7280')+'\';this.style.color=\'#fff\'" onmouseout="this.style.background=\''+(rec.emailSchedule?.active?'#ECFDF5':'#F3F4F6')+'\';this.style.color=\''+(rec.emailSchedule?.active?'#059669':'#6B7280')+'\'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 2v3M16 2v3M3.5 9.09h17M21 8.5V17c0 3-1.5 5-5 5H8c-3.5 0-5-2-5-5V8.5c0-3 1.5-5 5-5h8c3.5 0 5 2 5 5z" stroke="currentColor" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.69 13.7h.01M15.69 16.7h.01M11.99 13.7h.02M11.99 16.7h.02M8.29 13.7h.02M8.29 16.7h.02" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : '') +
            '<button style="'+_abtn+'background:#FEF3F2;color:#EF4444" onclick="deleteRecord(\'investorCompanies\',\''+rec.id+'\')" title="O\'chirish" onmouseover="this.style.background=\'#EF4444\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'#FEF3F2\';this.style.color=\'#EF4444\'"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 5.98c-3.33-.33-6.68-.5-10.02-.5-1.98 0-3.96.1-5.94.3L3 5.98M8.5 4.97l.22-1.31C8.88 2.71 9 2 10.69 2h2.62c1.69 0 1.82.75 1.97 1.67l.22 1.3M18.85 9.14l-.65 10.07C18.09 20.78 18 22 15.21 22H8.79C6 22 5.91 20.78 5.8 19.21L5.15 9.14M10.33 16.5h3.33M9.5 12.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
          : '') +
        '</div></td>';
      html += '</tr>';
    });
    return html;
  }).join('');

  restoreIcChecks();
  updateSelectedCount();
  var bulkBtn = document.getElementById('bulkSendBtn');
  var bulkAiBtn = document.getElementById('bulkAiBtn');
  var checkAll = document.getElementById('checkAll');
  if(bulkBtn) bulkBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  if(bulkAiBtn) bulkAiBtn.style.display = isAdmin ? 'inline-flex' : 'none';
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
  const n = getSelectedIds().length;
  const el = document.getElementById('selectedCount');
  if(el) el.textContent = n ? `${n} ta tanlangan` : '0 ta tanlangan';
  const bulkAiBtn = document.getElementById('bulkAiBtn');
  if(bulkAiBtn) bulkAiBtn.disabled = !n;
  const bulkSendBtn = document.getElementById('bulkSendBtn');
  if(bulkSendBtn) bulkSendBtn.disabled = !n;
  const bulkSchedBtn = document.getElementById('bulkSchedBtn');
  if(bulkSchedBtn) bulkSchedBtn.disabled = !n;
}

function toggleSelectMenu(event){
  if(event){ event.preventDefault(); event.stopPropagation(); }
  var cb = document.getElementById('checkAll'); if(cb) cb.checked = false;
  var menu = document.getElementById('selectAllMenu');
  if(!menu) return;
  var pageCount = document.querySelectorAll('.ic-check').length;
  var totalCount = (DB.investorCompanies||[]).length;
  var pcEl = document.getElementById('selPageCount'); if(pcEl) pcEl.textContent = pageCount;
  var acEl = document.getElementById('selAllCount'); if(acEl) acEl.textContent = totalCount;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  if(menu.style.display === 'block'){
    setTimeout(function(){
      document.addEventListener('click', _closeSelectMenuOnOutside);
    }, 0);
  }
}
function _closeSelectMenuOnOutside(e){
  var menu = document.getElementById('selectAllMenu');
  if(!menu) return;
  if(!menu.contains(e.target) && e.target.id !== 'checkAll'){
    menu.style.display = 'none';
    document.removeEventListener('click', _closeSelectMenuOnOutside);
  }
}
function selectThisPage(event){
  if(event){ event.stopPropagation(); }
  if(!window._icSelectedIds) window._icSelectedIds = new Set();
  document.querySelectorAll('.ic-check').forEach(function(cb){
    cb.checked = true;
    if(typeof saveIcCheck === 'function') saveIcCheck(cb);
  });
  updateSelectedCount();
  document.getElementById('selectAllMenu').style.display = 'none';
}
function selectAll(event){
  if(event){ event.stopPropagation(); }
  if(!window._icSelectedIds) window._icSelectedIds = new Set();
  (DB.investorCompanies||[]).forEach(function(r){
    window._icSelectedIds.add(String(r.id));
  });
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
