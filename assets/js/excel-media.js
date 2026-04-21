/* ═══════════════════════════════════════
   EXCEL & ZOOM MEDIA FUNCTIONS
═══════════════════════════════════════ */
function handleAdminZoomMedia(input){
  const files = Array.from(input.files);
  let loaded = 0;
  files.forEach(file => {
    const type = file.type.startsWith('video') ? 'video' : 'image';
    const reader = new FileReader();
    reader.onload = e => {
      _zmAdminMedia.push({ type, src: e.target.result, name: file.name });
      loaded++;
      if(loaded === files.length) renderAdminZoomPreview();
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function renderAdminZoomPreview(){
  const wrap = document.getElementById('zmMediaPreview');
  if(!wrap) return;
  wrap.innerHTML = _zmAdminMedia.map((m, i) => `
    <div class="zm-preview-item">
      ${m.type==='image'
        ? `<img src="${m.src}" alt="">`
        : `<video src="${m.src}" muted></video>`}
      <div class="zm-preview-type">${m.type==='video'?'🎬':'🖼'}</div>
      <button class="zm-prev-del" type="button" onclick="removeAdminZoomMedia(${i})">✕</button>
    </div>`).join('');
}

function removeAdminZoomMedia(idx){
  _zmAdminMedia.splice(idx, 1);
  renderAdminZoomPreview();
}

function addForum(){
  if(!v('fr-nom')||!v('fr-sana')||!v('fr-shahar')||!v('fr-davlat')||!v('fr-holat')){toast(t('toast_fill'),'error');return;}
  const rec={id:nextId(DB.forums),nom:v('fr-nom'),sana:dateToISO(v('fr-sana')),shahar:v('fr-shahar'),davlat:v('fr-davlat'),turi:v('fr-turi'),holat:v('fr-holat'),desc:v('fr-desc'),izoh:v('fr-izoh'),docs:[]};
  DB.forums.push(rec);
  if(typeof fbSave==='function') fbSave('forums', rec);
  clearFrForm();
  renderForums();
  renderAdminLists();
  renderOverview();
  toast('✅ Forum saqlandi!');
}

/* ============================
   DELETE
   ============================ */
function closeDeleteModal(){
  document.getElementById('deleteModal').classList.remove('open');
  document.getElementById('deleteModal').style.display='';
}
function confirmDelete(){
  // This is a fallback — actual onclick set dynamically by deleteRecord()
}

function deleteRecord(table, id){
  const rec = DB[table].find(r => String(r.id) === String(id));
  let name;
  if(table === 'investorCompanies' && rec){
    const _lead = String(rec.rahbar || '').trim();
    const _comp = String(rec.kompaniya || '').trim();
    if(_lead && _comp) name = `${_lead} (${_comp})`;
    else name = _lead || _comp || 'Yozuv';
  } else {
    name = rec ? (rec.kompaniya||rec.ism||rec.nom||rec.rahbar||'Yozuv') : 'Yozuv';
  }

  const modal   = document.getElementById('deleteModal');
  const msgEl   = document.getElementById('deleteMsg');
  const confirmBtn = document.getElementById('deleteConfirmBtn');

  const _msgLabel = (table === 'investorCompanies') ? `Lead "${name}" ni o'chirishni tasdiqlaysizmi?` : `"${name}" yozuvini o'chirishni tasdiqlaysizmi?`;
  msgEl.textContent = _msgLabel;
  modal.style.display = 'flex';
  modal.classList.add('open');

  // Remove old listener, set fresh one
  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  newBtn.onclick = () => {
    DB[table] = DB[table].filter(r => String(r.id) !== String(id));
    if(typeof setLocalCollectionBackup === 'function') try { setLocalCollectionBackup(table, DB[table] || []); } catch(_e){}
    if(typeof fbDelete==='function') fbDelete(table, id);
    const _renderers = {
      investors: typeof renderInvestors === 'function' ? renderInvestors : null,
      local: typeof renderLocal === 'function' ? renderLocal : null,
      zoom: typeof renderZoom === 'function' ? renderZoom : null,
      forums: typeof renderForums === 'function' ? renderForums : null,
      investorCompanies: typeof renderInvestorCompanies === 'function' ? renderInvestorCompanies : null,
      rawMaterials: typeof renderRawMaterials === 'function' ? renderRawMaterials : null,
      products: typeof renderProducts === 'function' ? renderProducts : null,
      entrepreneurs: typeof renderEntrepreneurs === 'function' ? renderEntrepreneurs : null
    };
    if(_renderers[table]) _renderers[table]();
    if(table === 'investorCompanies'){
      if(typeof refreshFinderResultTabs === 'function') try { refreshFinderResultTabs(); } catch(_e){}
      if(typeof renderCurrentFinderTable === 'function') try { renderCurrentFinderTable(); } catch(_e){}
    }
    if(typeof renderOverview === 'function') renderOverview();
    modal.classList.remove('open');
    modal.style.display = '';
    toast(`"${name}" o'chirildi`, 'info');
  };
}
function clearAllConfirm(table){
  var nameMap = {
    investors:'Investorlar', local:'Tadbirkorlar', zoom:'Zoom', forums:'Forumlar',
    investorCompanies:'Investorlar bazasi', rawMaterials:'Xomashyolar', products:'Mahsulotlar',
    entrepreneurs:'Mahalliy tadbirkorlar'
  };
  var count = (DB[table]||[]).length;
  document.getElementById('deleteMsg').textContent = (nameMap[table]||table)+' — '+count+' ta yozuvni o\'chirish tasdiqlaysizmi?';
  document.getElementById('deleteModal').classList.add('open');
  document.getElementById('deleteModal').style.display = 'flex';
  const confirmBtn = document.getElementById('deleteConfirmBtn');
  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  newBtn.onclick=()=>{
    DB[table]=[];
    if(table==='entrepreneurs') setLocalCollectionBackup('entrepreneurs', []);
    if(typeof fbDeleteCollection==='function') fbDeleteCollection(table);
    var renderMap = {
      investors:renderInvestors, local:renderLocal, zoom:renderZoom, forums:renderForums,
      investorCompanies:renderInvestorCompanies,
      rawMaterials:typeof renderProducts==='function'?renderProducts:null,
      products:typeof renderProducts==='function'?renderProducts:null,
      entrepreneurs:typeof renderEntrepreneurs==='function'?renderEntrepreneurs:null
    };
    if(renderMap[table]) renderMap[table]();
    renderOverview();
    document.getElementById('deleteModal').classList.remove('open');
    document.getElementById('deleteModal').style.display='';
    toast('🗑 '+count+' ta yozuv o\'chirildi!','info');
  };
}

/* ============================
   CLEAR FORMS
   ============================ */
function clearInvForm(){['inv-shahar','inv-sana','inv-davlat','inv-flag','inv-kompaniya','inv-loyiha','inv-qiymat','inv-hudud','inv-izoh'].forEach(id=>document.getElementById(id).value='');document.getElementById('inv-maqsad').value='';document.getElementById('inv-makom').value='';}
function clearLocForm(){['loc-kompaniya','loc-rahbar','loc-lavozim','loc-soha','loc-summa','loc-tel','loc-email','loc-manzil','loc-izoh'].forEach(id=>document.getElementById(id).value='');document.getElementById('loc-holat').value='';}
function clearZmForm(){
  ['zm-ism','zm-org','zm-davlat','zm-sana','zm-ishtirokchi','zm-desc','zm-natija'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('zm-natija-holat').value='';
  _zmAdminMedia = [];
  renderAdminZoomPreview();
}
function clearFrForm(){['fr-nom','fr-sana','fr-shahar','fr-davlat','fr-desc','fr-izoh'].forEach(id=>document.getElementById(id).value='');document.getElementById('fr-turi').value='';document.getElementById('fr-holat').value='';}

/* ============================
   EXCEL EXPORT
   ============================ */
function exportInvestorsExcel(){
  const wb  = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
  const year = now.getFullYear();

  /* ═══════════════════════════════════════════
     STYLE DEFINITIONS  (xlsx-js-style format)
  ═══════════════════════════════════════════ */
  const thin  = { style:'thin',   color:{rgb:'000000'} };
  const bAll  = { top:thin, bottom:thin, left:thin, right:thin };

  const fTitle = { name:'Arial',           sz:16, bold:true  };
  const fDate  = { name:'Arial',           sz:10, color:{rgb:'0070C0'} };
  const fMln   = { name:'Arial',           sz:10 };
  const fHdr   = { name:'Times New Roman', sz:14, bold:true  };
  const fSub   = { name:'Times New Roman', sz:14, bold:false };
  const fJami  = { name:'Times New Roman', sz:14, bold:true  };
  const fData  = { name:'Times New Roman', sz:14 };

  const flHdr  = { patternType:'solid', fgColor:{rgb:'5B9BD5'} }; // blue accent5
  const flJami = { patternType:'solid', fgColor:{rgb:'ED7D31'} }; // orange accent2
  const flNone = { patternType:'none'  };

  const aC = { horizontal:'center', vertical:'center', wrapText:true  };
  const aL = { horizontal:'left',   vertical:'center', wrapText:true  };
  const aR = { horizontal:'right',  vertical:'center', wrapText:false };

  /* helper: build a cell object */
  const C = (v, font, align, fill, border, numFmt) => {
    const t = typeof v==='number' ? 'n' : 's';
    const s = {};
    if(font)   s.font      = font;
    if(align)  s.alignment = align;
    if(fill)   s.fill      = fill;
    if(border) s.border    = border;
    if(numFmt) s.numFmt    = numFmt;
    return { v: v??'', t, s };
  };
  const Hdr   = (v)  => C(v,  fHdr,  aC, flHdr,  bAll);
  const HdrE  = ()   => C('', fHdr,  aC, flHdr,  bAll);
  const Jami  = (v)  => C(v,  fJami, aC, flJami, bAll);
  const JamiE = ()   => C('', fJami, aC, flJami, bAll);
  const Dat   = (v)  => C(v,  fData, aC, flNone, bAll);
  const DatL  = (v)  => C(v,  fData, aL, flNone, bAll);
  const DatN  = (v)  => C(v,  fData, aC, flNone, bAll, '#,##0.0');
  const Emp   = ()   => C('', fData, aC, flNone, bAll);

  /* ═══════════════════════════════════════════
     BUILD WORKSHEET  (15 columns A-O)
  ═══════════════════════════════════════════ */
  const ws = {};
  const set = (r,c,obj) => ws[XLSX.utils.encode_cell({r,c})] = obj;

  // ── ROW 0 (Excel row 1): date top-right in col N(13)
  set(0,13, C(dateStr, fDate, aR));

  // ── ROW 1 (Excel row 2): merged title
  set(1,0, C(
    `Navoiy viloyati hokimligi tomonidan ${year}-yilda xorijiy davlatlarga amalga oshirilgan\n`+
    `safarlarda xorijiy investorlar bilan muhokama qilingan istiqbolli loyihalar\n`+
    `MANZILLI RO'YHATI`,
    fTitle, {horizontal:'center',vertical:'center',wrapText:true}
  ));
  for(let c=1;c<14;c++) set(1,c,{v:'',t:'s',s:{font:fTitle}});

  // ── ROW 2 (Excel row 3): "mln dollar" right in col N(13)
  set(2,13, C('mln dollar', fMln, aR));

  // ── ROW 3 (Excel row 4): main headers
  // Columns: 0=A 1=B(hid) 2=C 3=D 4=E 5=F(hid) 6=G(hid) 7=H(hid) 8=I 9=J 10=K 11=L 12=M 13=N
  set(3, 0, Hdr('T/r'));
  set(3, 1, HdrE());                                                          // B hidden
  set(3, 2, Hdr('Shahar va\ntumanlar nomi'));
  set(3, 3, Hdr('Tashrif\nsanasi'));
  set(3, 4, Hdr('Davlat\nnomi'));
  set(3, 5, HdrE());                                                          // F hidden
  set(3, 6, HdrE());                                                          // G hidden
  set(3, 7, HdrE());                                                          // H hidden
  set(3, 8, Hdr("Investorning tashrif\nmaqsadi\n(individual/ forum\ndoirasida)"));
  set(3, 9, Hdr('Kompaniya\nnomi'));
  set(3,10, Hdr('Muhokama qilingan loyiha'));   // K–L merge
  set(3,11, HdrE());                            // L (under K merge)
  set(3,12, Hdr("Loyiha maqomi\n(kelishilgan,\nko'rib chiqilmoqda)"));
  set(3,13, Hdr("Loyiha amalga\noshiriladigan\nhudud nomi"));
  set(4,14, Hdr("Izoh\n(qo'shimcha\nma'lumotlar\nkiritiladi)"));   // row 4 — will merge r3c14:r4c14

  // wait — O spans both rows 4-5 so add it at row 3
  set(3,14, Hdr("Izoh\n(qo'shimcha ma'lumotlar kiritiladi)"));

  // ── ROW 4 (Excel row 5): sub-headers (nomi / qiymati under K/L)
  for(let c=0;c<10;c++) set(4,c,HdrE());           // A-J empty (merged above)
  set(4,10, C('nomi',    fSub, aC, flHdr, bAll));
  set(4,11, C('qiymati', fSub, aC, flHdr, bAll));
  set(4,12, HdrE()); set(4,13, HdrE());            // M,N empty (merged above)

  // ── ROW 5 (Excel row 6): JAMI
  set(5, 0, Jami('Jami'));
  for(let c=1;c<11;c++) set(5,c, JamiE());  // B-K (merged label A-K)
  // L: SUBTOTAL formula
  const lastDataRow = 7 + DB.investors.length;
  set(5,11, { v:0, t:'n',
    f:`SUBTOTAL(9,L7:L${lastDataRow})`,
    s:{ font:fJami, alignment:aC, fill:flJami, border:bAll } });
  set(5,12, JamiE()); set(5,13, JamiE()); set(5,14, JamiE());

  // ── ROWS 6+ (Excel rows 7+): DATA
  DB.investors.forEach((inv, i) => {
    const r = 6 + i;

    // Parse numeric value from qiymat (e.g. "$120M" → 120)
    const rawQ = String(inv.qiymat||'').replace(/[$,\s]/g,'');
    let numVal = null;
    if(/^\d+(\.\d+)?[Mm]$/.test(rawQ))     numVal = parseFloat(rawQ);
    else if(/^\d+(\.\d+)?$/.test(rawQ))    numVal = parseFloat(rawQ);

    // Format date
    let dateTxt = '';
    if(inv.sana){ const p=inv.sana.split('-'); if(p.length===3) dateTxt=`${p[2]}.${p[1]}.${p[0]}`; }

    set(r, 0,  Dat(i+1));
    set(r, 1,  C('Navoiy viloyati', fData, aC, flNone, bAll));   // B hidden
    set(r, 2,  Dat(inv.shahar||''));
    set(r, 3,  Dat(dateTxt));
    set(r, 4,  Dat(stripFlag(inv.davlat||'')));
    set(r, 5,  Emp());  // F hidden helper
    set(r, 6,  Emp());  // G hidden helper
    set(r, 7,  Emp());  // H hidden
    set(r, 8,  Dat(inv.maqsad||''));
    set(r, 9,  Dat(inv.kompaniya||''));
    set(r,10,  Dat(inv.loyiha||''));
    set(r,11,  numVal!==null ? DatN(numVal) : Emp());
    set(r,12,  Dat(inv.makom||''));
    set(r,13,  Dat(inv.hudud||''));
    set(r,14,  DatL(inv.izoh||''));
  });

  ws['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0}, e:{r:6+DB.investors.length, c:14}});

  /* ── MERGES ─────────────────────────────────────────── */
  ws['!merges'] = [
    {s:{r:1,c:0},  e:{r:1,c:13}},  // title
    {s:{r:3,c:0},  e:{r:4,c:0}},   // A: T/r
    {s:{r:3,c:1},  e:{r:4,c:1}},   // B
    {s:{r:3,c:2},  e:{r:4,c:2}},   // C
    {s:{r:3,c:3},  e:{r:4,c:3}},   // D
    {s:{r:3,c:4},  e:{r:4,c:4}},   // E
    {s:{r:3,c:5},  e:{r:4,c:5}},   // F
    {s:{r:3,c:6},  e:{r:4,c:6}},   // G
    {s:{r:3,c:7},  e:{r:4,c:7}},   // H
    {s:{r:3,c:8},  e:{r:4,c:8}},   // I
    {s:{r:3,c:9},  e:{r:4,c:9}},   // J
    {s:{r:3,c:10}, e:{r:3,c:11}},  // K4:L4 — Muhokama loyiha
    {s:{r:3,c:12}, e:{r:4,c:12}},  // M
    {s:{r:3,c:13}, e:{r:4,c:13}},  // N
    {s:{r:3,c:14}, e:{r:4,c:14}},  // O
    {s:{r:5,c:0},  e:{r:5,c:10}},  // Jami A:K
  ];

  /* ── COLUMN WIDTHS & VISIBILITY ─────────────────────── */
  ws['!cols'] = [
    {wch: 5.0,  hidden:false},  // A T/r
    {wch:13.7,  hidden:true },  // B hidden
    {wch:14.6,  hidden:false},  // C shahar
    {wch:13.0,  hidden:false},  // D sana
    {wch:15.1,  hidden:false},  // E davlat
    {wch:15.1,  hidden:true },  // F hidden
    {wch:13.0,  hidden:true },  // G hidden
    {wch:13.0,  hidden:true },  // H hidden
    {wch:24.0,  hidden:false},  // I maqsad
    {wch:19.7,  hidden:false},  // J kompaniya
    {wch:38.7,  hidden:false},  // K loyiha nomi
    {wch:13.3,  hidden:false},  // L qiymat
    {wch:18.7,  hidden:false},  // M makom
    {wch:20.7,  hidden:false},  // N hudud
    {wch:67.3,  hidden:false},  // O izoh
  ];

  /* ── ROW HEIGHTS ─────────────────────────────────────── */
  const rowHts = [
    {hpt:14},    // 0 date
    {hpt:62},    // 1 title
    {hpt:14},    // 2 mln dollar
    {hpt:56},    // 3 header row 1
    {hpt:67},    // 4 header row 2 (nomi/qiymati)
    {hpt:20},    // 5 jami
  ];
  DB.investors.forEach(() => rowHts.push({hpt:65}));
  ws['!rows'] = rowHts;

  /* ── PAGE SETUP ──────────────────────────────────────── */
  ws['!pageSetup'] = { orientation:'landscape', paperSize:9, scale:70 };

  const wbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wbook, ws, 'манзилли');
  XLSX.writeFile(wbook, `Investorlar_tashriflari_${dateStr}.xlsx`);
  toast('📥 ' + t('toast_excel'));
}

function exportToExcel(tableId,fileName){
  const table=document.getElementById(tableId);if(!table)return;
  const rows=[];
  table.querySelectorAll('tr').forEach(tr=>{
    const cells=tr.querySelectorAll('th,td');
    const row=[];cells.forEach(c=>row.push(c.innerText.trim().replace(/\n+/g,' ')));
    if(row.some(c=>c))rows.push(row);
  });
  const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=rows[0]?rows[0].map(()=>({wch:22})):[];
  XLSX.utils.book_append_sheet(wb,ws,"Ma'lumotlar");
  XLSX.writeFile(wb,fileName+'_'+new Date().toISOString().slice(0,10)+'.xlsx');
  toast('📥 '+t('toast_excel'));
}
function exportZoomExcel(){
  const h=['#','Ism','Tashkilot','Davlat','Sana','Ishtirokchi','Natija holati','Muhokama','Natija'];
  const rows=[h,...DB.zoom.map((r,i)=>[i+1,r.ism,r.org,r.davlat,fmtDate(r.sana),r.ishtirokchi,r.natijaHolat,r.desc,r.natija])];
  const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=h.map(()=>({wch:24}));
  XLSX.utils.book_append_sheet(wb,ws,'Zoom');
  XLSX.writeFile(wb,'Zoom_uchrashuvlar_'+new Date().toISOString().slice(0,10)+'.xlsx');
  toast('📥 '+t('toast_excel'));
}
function exportForumExcel(){
  const h=['#','Nom','Sana','Shahar','Davlat','Turi','Holat',"Ta'rif",'Izoh'];
  const rows=[h,...DB.forums.map((r,i)=>[i+1,r.nom,fmtDate(r.sana),r.shahar,r.davlat,r.turi,r.holat,r.desc,r.izoh])];
  const wb=XLSX.utils.book_new();const ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=h.map(()=>({wch:24}));
  XLSX.utils.book_append_sheet(wb,ws,'Forumlar');
  XLSX.writeFile(wb,'Forumlar_'+new Date().toISOString().slice(0,10)+'.xlsx');
  toast('📥 '+t('toast_excel'));
}

/* ============================
   KIRILCHA → LOTIN TRANSLITERATSIYA
   ============================ */
function cyrillicToLatin(text){
  if(!text) return text;
  const map = {
    // Uzbek Cyrillic specific
    'ъ':'','ь':'','ё':'yo','Ё':'Yo',
    'а':'a','А':'A','б':'b','Б':'B','в':'v','В':'V',
    'г':'g','Г':'G','д':'d','Д':'D','е':'e','Е':'E',
    'ж':'j','Ж':'J','з':'z','З':'Z','и':'i','И':'I',
    'й':'y','Й':'Y','к':'k','К':'K','л':'l','Л':'L',
    'м':'m','М':'M','н':'n','Н':'N','о':'o','О':'O',
    'п':'p','П':'P','р':'r','Р':'R','с':'s','С':'S',
    'т':'t','Т':'T','у':'u','У':'U','ф':'f','Ф':'F',
    'х':'x','Х':'X','ц':'ts','Ц':'Ts','ч':'ch','Ч':'Ch',
    'ш':'sh','Ш':'Sh','щ':'sh','Щ':'Sh',
    'э':'e','Э':'E','ю':'yu','Ю':'Yu','я':'ya','Я':'Ya',
    // Uzbek specific letters
    'ғ':"g'", 'Ғ':"G'", 'қ':'q', 'Қ':'Q',
    'ҳ':'h',  'Ҳ':'H',  'ў':'o\'','Ў':"O'",
    'ң':'ng', 'Ң':'Ng',
  };
  // Process char by char — е/Е gets "ye" only at word start or after vowel
  const vowels = new Set(['а','е','ё','и','о','у','э','ю','я','a','e','i','o','u','y']);
  let result = '';
  for(let i = 0; i < text.length; i++){
    const ch   = text[i];
    const prev = i > 0 ? text[i-1] : null;
    if(ch === 'е' || ch === 'Е'){
      const isWordStart = !prev || /[\s\-(,.\[\]/\\]/.test(prev);
      const afterVowel  = prev && vowels.has(prev.toLowerCase());
      result += (isWordStart || afterVowel) ? (ch === 'Е' ? 'Ye' : 'ye') : (ch === 'Е' ? 'E' : 'e');
    } else {
      result += map[ch] !== undefined ? map[ch] : ch;
    }
  }
  return result;
}

function translitRow(obj){
  const skip = ['id','sana','flag','qiymat']; // don't transliterate these
  const result = {...obj};
  for(const key of Object.keys(result)){
    if(!skip.includes(key) && typeof result[key]==='string'){
      result[key] = cyrillicToLatin(result[key]);
    }
  }
  return result;
}

/* ============================
   ZOOM DETAIL MODAL
   ============================ */
let _zdCurrentId = null;

function openZoomDetail(id){
  const r = DB.zoom.find(z => Number(z.id) === Number(id));
  if(!r) return;
  _zdCurrentId = Number(id);
  if(!r.media) r.media = [];

  // Fill header
  const initials = (r.ism||'?').split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2);
  document.getElementById('zdAvatar').textContent   = initials;
  document.getElementById('zdName').textContent     = r.ism||'—';
  document.getElementById('zdOrg').textContent      = r.org||'—';
  document.getElementById('zdDavlat').textContent   = r.davlat||'—';
  document.getElementById('zdSana').textContent     = fmtDate(r.sana);
  document.getElementById('zdIshtirokchi').textContent = r.ishtirokchi||1;
  document.getElementById('zdHolat').innerHTML      = natijaHolatBadge(r.natijaHolat);

  // Fill body
  document.getElementById('zdDesc').textContent    = r.desc||'—';
  document.getElementById('zdNatija').textContent  = r.natija||'—';

  // Show upload buttons only for admin
  document.getElementById('zdMediaBtns').style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('zdUrlRow').style.display    = isAdmin ? 'flex' : 'none';

  renderZoomMedia(r);

  document.getElementById('zoomDetailModal').classList.add('open');
}

function renderZoomMedia(r){
  const grid = document.getElementById('zdMediaGrid');
  if(!r.media || !r.media.length){
    grid.innerHTML = '<div class="zoom-media-empty">📁 Hali media fayl yo\'q</div>';
    return;
  }
  grid.innerHTML = r.media.map((m, i) => {
    if(m.type === 'image'){
      return `<div class="zoom-media-item" onclick="openLightbox('image','${m.src}')">
        <img src="${m.src}" alt="rasm">
        ${isAdmin?`<button class="zoom-media-del" onclick="event.stopPropagation();removeZoomMedia(${i})">✕</button>`:''}
      </div>`;
    } else {
      return `<div class="zoom-media-item" onclick="openLightbox('video','${m.src}')">
        <video src="${m.src}" muted></video>
        <div class="zoom-media-play">▶️</div>
        ${isAdmin?`<button class="zoom-media-del" onclick="event.stopPropagation();removeZoomMedia(${i})">✕</button>`:''}
      </div>`;
    }
  }).join('');
}

function addZoomMediaUrl(){
  const url  = document.getElementById('zmMediaUrl').value.trim();
  const type = document.getElementById('zmMediaUrlType').value;
  if(!url){ toast('⚠️ URL kiriting', 'error'); return; }

  const finalUrl = convertToDirectUrl(url);
  _zmAdminMedia.push({ type, src: finalUrl, name: url });
  document.getElementById('zmMediaUrl').value = '';
  renderAdminZoomPreview();
  toast(`✅ ${type==='video'?'Video':'Rasm'} qo\'shildi`, 'success');
}

function addZoomDetailUrl(){
  const url  = document.getElementById('zdMediaUrl').value.trim();
  const type = document.getElementById('zdMediaUrlType').value;
  if(!url){ toast('⚠️ URL kiriting', 'error'); return; }
  const r = DB.zoom.find(z => Number(z.id) === _zdCurrentId);
  if(!r) return;
  if(!r.media) r.media = [];
  r.media.push({ type, src: convertToDirectUrl(url), name: url });
  if(typeof fbSave==='function') fbSave('zoom', r);
  document.getElementById('zdMediaUrl').value = '';
  renderZoomMedia(r);
  renderZoom();
  toast(`✅ ${type==='video'?'Video':'Rasm'} qo\'shildi`, 'success');
}

// Convert Google Drive / Firebase / Dropbox share links to direct embed URLs
function convertToDirectUrl(url){
  // Google Drive: /file/d/FILE_ID/view → direct
  const gdMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if(gdMatch) return `https://drive.google.com/uc?export=view&id=${gdMatch[1]}`;

  // Google Drive open?id=
  const gdMatch2 = url.match(/[?&]id=([^&]+)/);
  if(url.includes('drive.google.com') && gdMatch2) return `https://drive.google.com/uc?export=view&id=${gdMatch2[1]}`;

  // Dropbox: ?dl=0 → ?raw=1
  if(url.includes('dropbox.com')) return url.replace('?dl=0','?raw=1').replace('www.dropbox','dl.dropboxusercontent');

  // Firebase Storage — already direct
  return url;
}

function addZoomMedia(input, type){
  const r = DB.zoom.find(z => Number(z.id) === _zdCurrentId);
  if(!r) return;
  if(!r.media) r.media = [];
  const files = Array.from(input.files);
  let loaded = 0;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e){
      r.media.push({ type, src: e.target.result, name: file.name });
      loaded++;
      if(loaded === files.length){
        if(typeof fbSave==='function') fbSave('zoom', r);
        renderZoomMedia(r);
        renderZoom();
        toast(`✅ ${files.length} ta fayl qo'shildi`, 'success');
      }
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

function removeZoomMedia(idx){
  const r = DB.zoom.find(z => Number(z.id) === _zdCurrentId);
  if(!r || !r.media) return;
  r.media.splice(idx, 1);
  if(typeof fbSave==='function') fbSave('zoom', r);
  renderZoomMedia(r);
  renderZoom();
}

function openLightbox(type, src){
  const img = document.getElementById('lightboxImg');
  const vid = document.getElementById('lightboxVid');
  if(type === 'image'){
    img.src = src; img.style.display = 'block';
    vid.style.display = 'none'; vid.src = '';
  } else {
    vid.src = src; vid.style.display = 'block';
    img.style.display = 'none'; img.src = '';
  }
  document.getElementById('lightboxOverlay').style.display = 'flex';
}
function closeLightbox(){
  const img = document.getElementById('lightboxImg');
  const vid = document.getElementById('lightboxVid');
  img.style.display='none'; img.src='';
  vid.style.display='none'; vid.src='';
  document.getElementById('lightboxOverlay').style.display = 'none';
}

/* ============================
   EXCEL UPLOAD & IMPORT
   ============================ */
let _excelParsed = [];

function handleExcelUpload(input){
  const file = input.files[0];
  if(!file){ return; }

  const dropZone = document.getElementById('excelDropZone');
  dropZone.innerHTML = `<div class="excel-drop-icon">⏳</div><div class="excel-drop-text">Fayl o'qilmoqda...</div>`;

  const reader = new FileReader();
  reader.onload = function(e){
    try {
      const data = new Uint8Array(e.target.result);
      const wb   = XLSX.read(data, {type:'array', cellDates:true});
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, {header:1, defval:'', raw:false});

      // Find data rows — skip header/jami rows, accept rows where col A is a number OR has enough content
      const rows = [];
      for(let i=0; i<json.length; i++){
        const row = json[i];
        const cellA = String(row[0]||'').trim();
        const cellC = String(row[2]||'').trim();  // shahar
        const cellE = String(row[4]||'').trim();  // davlat
        const cellJ = String(row[9]||'').trim();  // kompaniya
        const cellK = String(row[10]||'').trim(); // loyiha

        // Skip header/total keywords
        const skipWords = ['т/р','жами','jami','номи','nomi','#','no','t/r','тр','т/p','номи','наименование'];
        const isHeader = skipWords.some(w =>
          cellA.toLowerCase()===w || cellA.toLowerCase().includes(w)
        );
        if(isHeader) continue;

        // Accept row if col A is a positive number
        const numVal = parseFloat(String(cellA).replace(',','.'));
        const isRowNum = !isNaN(numVal) && numVal > 0 && numVal < 10000;

        // Row must have at least kompaniya or loyiha filled
        const hasData = cellJ.length > 0 || cellK.length > 0;

        if(isRowNum && hasData){
          rows.push(row);
        }
      }

      // Fallback: if no rows found with row numbers, try rows that have company name (col J)
      if(!rows.length){
        for(let i=0; i<json.length; i++){
          const row = json[i];
          const cellJ = String(row[9]||'').trim();
          const cellK = String(row[10]||'').trim();
          const cellA = String(row[0]||'').trim().toLowerCase();
          const skipWords = ['т/р','жами','jami','номи','nomi','#','компанияси'];
          if(skipWords.some(w=>cellA.includes(w))) continue;
          if(cellJ.length > 2 || cellK.length > 2) rows.push(row);
        }
      }

      if(!rows.length){
        toast('⚠️ Fayl ichida ma\'lumot topilmadi. Ustun tartibini tekshiring.', 'error');
        resetDropZone();
        return;
      }

      // Map to investor objects then transliterate Cyrillic → Latin
      _excelParsed = rows.map((row, idx) => {
        // Format date
        let sana = '';
        const rawDate = String(row[3]||'').trim();
        if(rawDate){
          // Try DD.MM.YYYY or YYYY-MM-DD
          if(/^\d{2}\.\d{2}\.\d{4}$/.test(rawDate)){
            const [d,m,y] = rawDate.split('.');
            sana = `${y}-${m}-${d}`;
          } else if(/^\d{4}-\d{2}-\d{2}$/.test(rawDate)){
            sana = rawDate;
          } else {
            // Try to parse as date object string
            const dt = new Date(rawDate);
            if(!isNaN(dt)) sana = dt.toISOString().split('T')[0];
            else sana = rawDate;
          }
        }

        const davlat = String(row[4]||'').trim();
        const qiymatRaw = String(row[11]||'').trim();
        const qiymat = qiymatRaw ? (parseFloat(qiymatRaw)||0)+' mln$' : '';

        const inv = {
          id: idx+1,
          shahar:   String(row[2]||'').trim(),
          sana:     sana,
          davlat:   davlat,
          flag:     getFlag(davlat),
          maqsad:   String(row[8]||'').trim(),
          kompaniya:String(row[9]||'').trim(),
          loyiha:   String(row[10]||'').trim(),
          qiymat:   qiymat,
          makom:    String(row[12]||'').trim(),
          hudud:    String(row[13]||'').trim(),
          izoh:     String(row[14]||'').trim(),
        };
        return translitRow(inv);
      }).filter(r => r.kompaniya || r.loyiha);

      if(!_excelParsed.length){
        toast('⚠️ Yaroqli ma\'lumot satrlari topilmadi.', 'error');
        resetDropZone();
        return;
      }

      // Show preview
      showExcelPreview(_excelParsed, file.name);
      toast(`📋 ${_excelParsed.length} ta yozuv topildi — tekshiring va tasdiqlang`, 'info');

    } catch(err){
      console.error(err);
      toast('❌ Faylni o\'qishda xato: ' + err.message, 'error');
      resetDropZone();
    }
  };
  reader.readAsArrayBuffer(file);
  input.value = '';
}

// Strip flag emoji (regional indicator pairs U+1F1E6-1F1FF) and leading/trailing spaces
function stripFlag(str){
  return String(str||'').replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu,'').trim();
}

function getFlag(davlat){
  const flags = [
    // Latin — O'zbekcha
    [['xitoy'],                          '🇨🇳'],
    [['rossiya'],                        '🇷🇺'],
    [['germaniya'],                      '🇩🇪'],
    [['turkiya'],                        '🇹🇷'],
    [['janubiy koreya','koreya'],        '🇰🇷'],
    [['baa','yae','arab amirlik'],       '🇦🇪'],
    [['aqsh','qўshma shtat'],            '🇺🇸'],
    [['yaponiya'],                       '🇯🇵'],
    [['fransiya'],                       '🇫🇷'],
    [['angliya','buyuk britaniya'],      '🇬🇧'],
    [['hindiston'],                      '🇮🇳'],
    [['kanada'],                         '🇨🇦'],
    [['italiya'],                        '🇮🇹'],
    [['ispaniya'],                       '🇪🇸'],
    [['niderlandiya'],                   '🇳🇱'],
    [['shvetsiya'],                      '🇸🇪'],
    [['shveytsariya'],                   '🇨🇭'],
    [['avstriya'],                       '🇦🇹'],
    [['polsha'],                         '🇵🇱'],
    [['qozog'],                          '🇰🇿'],
    [['belarus'],                        '🇧🇾'],
    [['ukraina'],                        '🇺🇦'],
    [['ozarbayjon'],                     '🇦🇿'],
    [['gruziya'],                        '🇬🇪'],
    [['eron'],                           '🇮🇷'],
    [['pokiston'],                       '🇵🇰'],
    [['singapur'],                       '🇸🇬'],
    [['malayziya'],                      '🇲🇾'],
    [['tailand'],                        '🇹🇭'],
    [['indoneziya'],                     '🇮🇩'],
    [['braziliya'],                      '🇧🇷'],
    [['saudiya'],                        '🇸🇦'],
    [['isroil'],                         '🇮🇱'],
    [['misr'],                           '🇪🇬'],
    // Cyrillic — Кириллча
    [['хитой','китай'],                  '🇨🇳'],
    [['россия'],                         '🇷🇺'],
    [['герман'],                         '🇩🇪'],
    [['турк'],                           '🇹🇷'],
    [['жанубий кор','корея','южная кор'],'🇰🇷'],
    [['ааэ','оаэ','амирлик'],            '🇦🇪'],
    [['сша','қўшма штат'],               '🇺🇸'],
    [['япон'],                           '🇯🇵'],
    [['франц'],                          '🇫🇷'],
    [['британ','англия'],                '🇬🇧'],
    [['ҳиндистон','индия'],              '🇮🇳'],
    [['итали'],                          '🇮🇹'],
    [['испан'],                          '🇪🇸'],
    [['нидерланд'],                      '🇳🇱'],
    [['швеци','швед'],                   '🇸🇪'],
    [['швейцар'],                        '🇨🇭'],
    [['австри'],                         '🇦🇹'],
    [['польш','поляк'],                  '🇵🇱'],
    [['қозоғ','казах'],                  '🇰🇿'],
    [['беларус'],                        '🇧🇾'],
    [['украин'],                         '🇺🇦'],
    [['озарбайж','азербайж'],            '🇦🇿'],
    [['груз'],                           '🇬🇪'],
    [['эрон','иран'],                    '🇮🇷'],
    [['покист','пакист'],                '🇵🇰'],
    [['сингап'],                         '🇸🇬'],
    [['малайз'],                         '🇲🇾'],
    [['таилан','тайлан'],                '🇹🇭'],
    [['индонез'],                        '🇮🇩'],
    [['бразил'],                         '🇧🇷'],
    [['сауд'],                           '🇸🇦'],
    [['израил','исроил'],                '🇮🇱'],
    [['мисr','египет'],                  '🇪🇬'],
  ];
  const key = String(davlat||'').toLowerCase().trim();
  for(const [keywords, flag] of flags){
    if(keywords.some(k => key.includes(k))) return flag;
  }
  return '🌐';
}

function getBadgeClass(makom){
  const m = String(makom||'').toLowerCase();
  if(m.includes('kelishilgan')||m.includes('келишилган')||m.includes('согласован')||m.includes('подписан')) return 'badge-green';
  if(m.includes('yangi')||m.includes('янги')||m.includes('новый')) return 'badge-blue';
  if(m.includes('bekor')||m.includes('бекор')||m.includes('отмен')) return 'badge-red';
  return 'badge-yellow';
}

function showExcelPreview(data, fileName){
  const dropZone = document.getElementById('excelDropZone');
  dropZone.innerHTML = `
    <div class="excel-drop-icon">✅</div>
    <div class="excel-drop-text" style="color:#059669">${fileName}</div>
    <div class="excel-drop-sub">${data.length} ta yozuv yuklashga tayyor</div>
    <div style="margin-top:.5rem"><button class="btn btn-ghost btn-sm" onclick="document.getElementById('excelFileInput').click()">🔄 Boshqa fayl</button></div>`;

  document.getElementById('excelPreviewInfo').textContent = `${data.length} ta yozuv topildi — ko'rib chiqing va tasdiqlang`;

  const tbody = document.getElementById('excelPreviewBody');
  tbody.innerHTML = data.map((r,i) => `
    <tr>
      <td>${i+1}</td>
      <td>${r.shahar||'—'}</td>
      <td>${r.sana||'—'}</td>
      <td>${r.flag} ${r.davlat||'—'}</td>
      <td>${r.maqsad||'—'}</td>
      <td><b>${r.kompaniya||'—'}</b></td>
      <td>${r.loyiha||'—'}</td>
      <td>${r.qiymat||'—'}</td>
      <td><span class="badge ${getBadgeClass(r.makom)}">${r.makom||'—'}</span></td>
      <td>${r.hudud||'—'}</td>
    </tr>`).join('');

  document.getElementById('excelPreview').style.display = 'block';
}

function importExcelData(){
  try {
    if(!_excelParsed || !_excelParsed.length){
      toast('⚠️ Yuklash uchun ma\'lumot yo\'q. Avval Excel faylni tanlang.','error');
      return;
    }
    const replace = document.getElementById('excelReplaceAll').checked;
    const count   = _excelParsed.length;

    if(replace){
      DB.investors = _excelParsed.map((r,i)=>({...r, id:i+1}));
    } else {
      const startId = nextId(DB.investors);
      _excelParsed.forEach((r,i)=>{ DB.investors.push({...r, id:startId+i}); });
    }

    renderInvestors();
    renderOverview();
    // Sync to Firebase
    if(typeof fbSaveCollection==='function') fbSaveCollection('investors', DB.investors);

    const msg = replace
      ? `✅ ${count} ta yozuv bilan almashtirild!`
      : `✅ ${count} ta yozuv muvaffaqiyatli qo'shildi!`;

    _excelParsed = [];
    cancelExcelUpload();
    toast(msg, 'success');

    setTimeout(()=>{
      showPage('investors', document.getElementById('nav-investors'));
    }, 600);

  } catch(err) {
    console.error('importExcelData error:', err);
    toast('❌ Xato: ' + err.message, 'error');
  }
}

function cancelExcelUpload(){
  _excelParsed = [];
  document.getElementById('excelPreview').style.display = 'none';
  document.getElementById('excelReplaceAll').checked = false;
  resetDropZone();
}

function resetDropZone(){
  document.getElementById('excelDropZone').innerHTML = `
    <input type="file" id="excelFileInput" accept=".xlsx,.xls" style="display:none" onchange="handleExcelUpload(this)">
    <div class="excel-drop-icon">📊</div>
    <div class="excel-drop-text">Excel faylni shu yerga tashlang yoki bosing</div>
    <div class="excel-drop-sub">.xlsx yoki .xls format • Namuna fayl ustuni tartibida bo'lishi kerak</div>`;
}

// Drag & drop support
document.addEventListener('DOMContentLoaded', () => {
  const zone = document.getElementById('excelDropZone');
  if(!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if(file && (file.name.endsWith('.xlsx')||file.name.endsWith('.xls'))){
      const dt = new DataTransfer(); dt.items.add(file);
      const inp = document.getElementById('excelFileInput');
      inp.files = dt.files;
      handleExcelUpload(inp);
    } else {
      toast('⚠️ Faqat .xlsx yoki .xls fayl qabul qilinadi','error');
    }
  });
});

