/* ═══════════════════════════════════════════════════════════
   CHATBOT FILE HANDLER — So'rovnoma yuklash va to'ldirish
   1. Ma'lum so'rovnomalar → tayyor faylni qaytarish
   2. O'zbek tilidagi tarjimalar → AI bilan aniqlash
   3. Yangi so'rovnomalar → AI internet research + original faylni to'ldirish
═══════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────
   MA'LUM SO'ROVNOMALAR BAZASI
────────────────────────────────────────────────────────── */
var QUESTIONNAIRE_LIBRARY = [
  {
    id: 'omni_sugarcane',
    name: 'Omni Group – Sugarcane Technical Data Form',
    keywords: [
      'omni group','sugarcane','technical data request','sugarcane cultivation',
      'agro-industrial','zarafshan','frost-free days','irrigation water reliability',
      'soil conditions','climate overview','karachi','omni'
    ],
    uzKeywords: ['shakarqamish','qand qamish','omni guruh'],
    file: 'assets/questionnaires/Omni_Group_Navoi_Technical_Data_Form_Completed.pdf',
    ext: 'pdf',
    minScore: 2
  },
  {
    id: 'factory_cis',
    name: 'Factory Installation Prerequisites – Uzbekistan / CIS',
    keywords: [
      'factory installation prerequisites','manufacturing factory setup',
      'land acquisition','shell scheme','load shedding','swift system',
      'corporate income tax','banking channels','construction costs',
      'free economic zone','labor costs','freehold ownership'
    ],
    uzKeywords: [
      'zavod o\'rnatish','zavodlar','yer ijarasi','qurilish xarajatlari',
      'korxona ro\'yxatdan o\'tkazish','bank kanallari'
    ],
    file: 'assets/questionnaires/Quessionair_for_Factory_in_CIS_completed.docx',
    ext: 'docx',
    minScore: 2
  },
  {
    id: 'samsons_agri',
    name: 'Samsons Agri – Due Diligence Questionnaire (Livestock / Breeding)',
    keywords: [
      'samsons agri','due diligence','livestock','breeding','joint venture',
      'veterinary','samsons','naslchilik','chorvachilik','наслчилик','чорвачилик'
    ],
    uzKeywords: [
      'naslchilik','chorvachilik','qo\'shma korxona','qoramol','qo\'y','yilqichilik'
    ],
    file: 'assets/questionnaires/Samsons_Agri_Due_Diligence_completed.docx',
    ext: 'docx',
    minScore: 2
  },
  {
    id: 'kibing_silica',
    name: 'Kibing – Silica (Quartz) Sand Demand Questionnaire',
    keywords: [
      'kibing','silica','quartz sand','sio2','fe2o3','float glass',
      '旗滨','dolomite','limestone','minable reserves','subsoil',
      'mining permit','exploration'
    ],
    uzKeywords: ['kremniy qum','kvarts qum','shisha','ohaktosh','dolomit'],
    file: 'assets/questionnaires/0201Kibing_Questionaire_for_Silica_Quartz_Sand_Demand_completed.xlsx',
    ext: 'xlsx',
    minScore: 2
  }
];

/* ──────────────────────────────────────────────────────────
   STAGED FILE — faylni saqlash va preview ko'rsatish
────────────────────────────────────────────────────────── */
window._stagedFile = null;

function _stageFile(file) {
  window._stagedFile = file;
  var preview = document.getElementById('chatAttachPreview');
  var nameEl  = document.getElementById('chatAttachPreviewName');
  var sizeEl  = document.getElementById('chatAttachPreviewSize');
  var ext     = file.name.split('.').pop().toLowerCase();
  var icon    = ext === 'pdf' ? '📄' : ext === 'xlsx' ? '📊' : '📝';
  if (preview) {
    if (nameEl) nameEl.textContent = icon + ' ' + file.name;
    if (sizeEl) sizeEl.textContent = '(' + Math.round(file.size / 1024) + ' KB)';
    preview.style.display = 'flex';
  }
  var input = document.getElementById('chatInput');
  if (input) {
    input.placeholder = 'Izoh qo\'shing (ixtiyoriy)...';
    input.focus();
  }
}

function cancelStagedFile() {
  window._stagedFile = null;
  var preview = document.getElementById('chatAttachPreview');
  if (preview) preview.style.display = 'none';
  var input = document.getElementById('chatInput');
  if (input) input.placeholder = 'Savolingizni yozing... yoki 📎 so\'rovnoma yuboring';
}
window.cancelStagedFile = cancelStagedFile;

/* ──────────────────────────────────────────────────────────
   SEND WITH STAGED FILE (chatbot.js sendChat chaqiradi)
────────────────────────────────────────────────────────── */
window._sendWithStagedFile = async function() {
  var file = window._stagedFile;
  if (!file) return;
  var input = document.getElementById('chatInput');
  var caption = (input ? input.value.trim() : '');
  if (input) input.value = '';
  cancelStagedFile();
  await _processChatFile(file, caption);
};

/* ──────────────────────────────────────────────────────────
   CDN KUTUBXONALARINI LAZY YUKLASH
────────────────────────────────────────────────────────── */
function _loadScript(src) {
  return new Promise(function(resolve, reject) {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    var s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}
async function _ensureJSZip() {
  if (typeof JSZip === 'function') return;
  await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
}
async function _ensureSheetJS() {
  if (typeof XLSX !== 'undefined') return;
  await _loadScript('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');
}

/* ──────────────────────────────────────────────────────────
   FAYL MATNI AJRATISH (DOCX / XLSX / PDF)
────────────────────────────────────────────────────────── */
async function extractFileText(file) {
  var ext = file.name.split('.').pop().toLowerCase();
  try {
    if (ext === 'docx') return await _extractDocxText(file);
    if (ext === 'xlsx') return await _extractXlsxText(file);
    if (ext === 'pdf')  return await _extractPdfText(file);
    return await file.text().catch(function() { return ''; });
  } catch (e) {
    console.warn('extractFileText error:', e && e.message);
    return '';
  }
}

async function _extractDocxText(file) {
  await _ensureJSZip();
  var ab = await file.arrayBuffer();
  var zip = await JSZip.loadAsync(ab);
  var xmlFile = zip.file('word/document.xml');
  if (!xmlFile) return file.name;
  var xml = await xmlFile.async('string');
  return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 10000);
}

async function _extractXlsxText(file) {
  await _ensureSheetJS();
  var ab = await file.arrayBuffer();
  var wb = XLSX.read(ab, { type: 'array' });
  var text = '';
  wb.SheetNames.forEach(function(sn) {
    text += XLSX.utils.sheet_to_csv(wb.Sheets[sn]) + '\n';
  });
  return text.slice(0, 10000);
}

async function _extractPdfText(file) {
  return new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var buf = new Uint8Array(e.target.result);
      var text = '';
      for (var i = 0; i < Math.min(buf.length, 50000); i++) {
        var c = buf[i];
        if ((c >= 32 && c < 127) || c >= 0xC0) text += String.fromCharCode(c);
        else if (c === 10 || c === 13) text += '\n';
      }
      resolve(text.replace(/\s+/g, ' ').trim().slice(0, 10000));
    };
    reader.onerror = function() { resolve(file.name); };
    reader.readAsArrayBuffer(file);
  });
}

/* ──────────────────────────────────────────────────────────
   SO'ROVNOMANI ANIQLASH
────────────────────────────────────────────────────────── */
function _keywordMatch(text, filename) {
  var combined = (text + ' ' + filename).toLowerCase();
  var best = null, bestScore = 0;
  QUESTIONNAIRE_LIBRARY.forEach(function(q) {
    var score = 0;
    var allKw = (q.keywords || []).concat(q.uzKeywords || []);
    allKw.forEach(function(kw) {
      if (combined.includes(kw.toLowerCase())) score++;
    });
    if (score > bestScore) { bestScore = score; best = q; }
  });
  return (best && bestScore >= (best.minScore || 2)) ? best : null;
}

async function _aiClassify(text, filename) {
  try {
    if (typeof callOpenAI !== 'function' || !getOpenAIKey()) return null;
    var ids = QUESTIONNAIRE_LIBRARY.map(function(q) {
      return q.id + ' — ' + q.name;
    }).join('\n');
    var prompt =
      'Classify this questionnaire into ONE of the categories below.\n' +
      'Respond ONLY with the ID (e.g. "factory_cis") or "unknown".\n\n' +
      'Categories:\n' + ids + '\nunknown — not in the list\n\n' +
      'File: ' + filename + '\nContent:\n' + text.slice(0, 1500);
    var r = await callOpenAI([{ role: 'user', content: prompt }],
      { model: window.OPENAI_MODEL_DEFAULT || 'gpt-4o', maxTokens: 20, temperature: 0 });
    var id = (r.content || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    return QUESTIONNAIRE_LIBRARY.find(function(q) { return q.id === id; }) || null;
  } catch (e) {
    console.warn('AI classify error:', e && e.message);
    return null;
  }
}

async function matchQuestionnaire(text, filename) {
  var m = _keywordMatch(text, filename);
  if (m) return m;
  return await _aiClassify(text, filename);
}

/* ──────────────────────────────────────────────────────────
   YUKLAB OLISH TUGMASINI CHAT XABARIGA QO'SHISH
   formatChatText faqat https:// URLlarni link qiladi,
   shu sababli biz DOM orqali to'g'ridan-to'g'ri button qo'shamiz.
────────────────────────────────────────────────────────── */
function _appendDownloadBtn(msgDiv, absoluteUrl, filename) {
  var btn = document.createElement('a');
  btn.href = absoluteUrl;
  btn.download = filename;
  btn.target = '_blank';
  btn.rel = 'noopener';
  btn.style.cssText =
    'display:inline-flex;align-items:center;gap:6px;margin-top:8px;' +
    'background:#1a56db;color:#fff;padding:9px 18px;border-radius:8px;' +
    'text-decoration:none;font-weight:600;font-size:.82rem;cursor:pointer;' +
    'transition:opacity .15s';
  btn.onmouseenter = function() { btn.style.opacity = '.85'; };
  btn.onmouseleave = function() { btn.style.opacity = '1'; };
  btn.innerHTML = '⬇️ &nbsp;Yuklab olish';
  msgDiv.appendChild(document.createElement('br'));
  msgDiv.appendChild(btn);
}

/* ──────────────────────────────────────────────────────────
   ASOSIY FAYL PROCESSING LOGIC
────────────────────────────────────────────────────────── */
async function _processChatFile(file, caption) {
  var ext = file.name.split('.').pop().toLowerCase();
  if (!['docx', 'xlsx', 'pdf'].includes(ext)) {
    addChatMsg('⚠️ Faqat .docx, .xlsx, .pdf formatdagi fayllar qabul qilinadi.', 'bot');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    addChatMsg('⚠️ Fayl hajmi 20 MB dan oshmasligi kerak.', 'bot');
    return;
  }

  var sizeKB = Math.round(file.size / 1024);
  var userMsg = '📎 ' + file.name + ' (' + sizeKB + ' KB)';
  if (caption) userMsg += '\n' + caption;
  addChatMsg(userMsg, 'user');

  var botDiv = addChatMsg('⏳', 'bot typing');
  var sendBtn = document.getElementById('chatSendBtn');
  var attachBtn = document.getElementById('chatAttachBtn');
  if (sendBtn) sendBtn.disabled = true;
  if (attachBtn) attachBtn.disabled = true;

  try {
    var text = await extractFileText(file);
    var match = await matchQuestionnaire(text, file.name);

    if (match) {
      /* ── Tayyor fayl — download button qo'shamiz ── */
      var absUrl = new URL(match.file, window.location.href).href;
      var icon = match.ext === 'pdf' ? '📄' : match.ext === 'xlsx' ? '📊' : '📝';
      botDiv.classList.remove('typing');
      botDiv.innerHTML = icon + ' <b>' + _esc(file.name) + '</b> — to\'ldirilgan';
      _appendDownloadBtn(botDiv, absUrl, match.file.split('/').pop());

    } else {
      /* ── Yangi so'rovnoma — AI to'ldiradi ── */
      updateChatMsg(botDiv, '🧠 So\'rovnoma to\'ldirilmoqda...');

      var filledBlob = null;
      try {
        filledBlob = await _fillQuestionnaireWithAI(file, text, botDiv);
      } catch (err) {
        console.warn('fillQuestionnaireWithAI error:', err && err.message);
      }

      botDiv.classList.remove('typing');

      if (filledBlob) {
        var blobUrl = URL.createObjectURL(filledBlob);
        var outName = file.name.replace(/\.(docx|xlsx)$/i, '_completed.$1');
        var icon2 = ext === 'xlsx' ? '📊' : '📝';
        botDiv.innerHTML = icon2 + ' <b>' + _esc(file.name) + '</b> — to\'ldirilgan';
        _appendDownloadBtn(botDiv, blobUrl, outName);
        /* Blob URL-larda download atribut ishlamaydi agar same-origin bo'lmasa —
           shu sababli anchor ga click trigger qilamiz */
        setTimeout(function() {
          var a = botDiv.querySelector('a[download]');
          if (a && a.href.startsWith('blob:')) {
            a.removeAttribute('target'); /* blob-da target=_blank kerak emas */
          }
        }, 100);
      } else {
        botDiv.innerHTML = '📋 So\'rovnoma yangi yoki PDF format.<br>' +
          '💬 So\'rovnoma savollarini chatga yozing — har biriga javob beraman!';
      }
    }

  } catch (err) {
    botDiv.classList.remove('typing');
    botDiv.innerHTML = '⚠️ Xato: ' + _esc((err && err.message) ? err.message : String(err));
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    if (attachBtn) attachBtn.disabled = false;
  }
}

function _esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ──────────────────────────────────────────────────────────
   YANGI SO'ROVNOMANI AI BILAN TO'LDIRISH
────────────────────────────────────────────────────────── */
async function _fillQuestionnaireWithAI(file, extractedText, botDiv) {
  var ext = file.name.split('.').pop().toLowerCase();

  var qListPrompt =
    'From the questionnaire below, extract every question or blank field that needs an answer.\n' +
    'Return ONLY valid JSON (no markdown): [{"n":1,"q":"question text"},{"n":2,"q":"..."},...]\n' +
    'Max 50 items. Short question summaries under 120 chars.\n\n' +
    extractedText.slice(0, 4500);

  var questions = [];
  try {
    var qRes = await callOpenAI([{ role: 'user', content: qListPrompt }],
      { model: window.OPENAI_MODEL_DEFAULT || 'gpt-4o', jsonMode: true, maxTokens: 2000 });
    questions = JSON.parse(qRes.content || '[]');
    if (!Array.isArray(questions)) questions = [];
  } catch (e) { questions = []; }

  if (!questions.length) throw new Error('So\'rovnoma savollari ajratilmadi');

  var systemCtx = (typeof NAVOIY_CONTEXT !== 'undefined') ? NAVOIY_CONTEXT :
    'You are an expert on Navoi region, Uzbekistan. Answer investor questions accurately.';

  var answerPrompt =
    'Fill the following questionnaire about Navoi region, Uzbekistan.\n' +
    'Each answer must be specific and concise (1-3 sentences). Use web search for current data.\n' +
    'Return ONLY valid JSON: {"1":"answer","2":"answer",...}\n\n' +
    'Questions:\n' +
    questions.map(function(q) { return q.n + '. ' + q.q; }).join('\n');

  var answers = {};
  try {
    var aRes = await callOpenAI(
      [{ role: 'system', content: systemCtx }, { role: 'user', content: answerPrompt }],
      {
        model: window.OPENAI_MODEL_SEARCH || 'gpt-4o-search-preview',
        webSearch: true, jsonMode: true, maxTokens: 3000, timeoutMs: 90000
      }
    );
    answers = JSON.parse(aRes.content || '{}');
    if (typeof answers !== 'object' || Array.isArray(answers)) answers = {};
  } catch (e) {
    try {
      var fb = await callOpenAI(
        [{ role: 'system', content: systemCtx }, { role: 'user', content: answerPrompt }],
        { model: window.OPENAI_MODEL_DEFAULT || 'gpt-4o', jsonMode: true, maxTokens: 3000 }
      );
      answers = JSON.parse(fb.content || '{}');
      if (typeof answers !== 'object' || Array.isArray(answers)) answers = {};
    } catch (e2) { answers = {}; }
  }

  if (ext === 'docx') return await _fillDocxFile(file, questions, answers);
  if (ext === 'xlsx') return await _fillXlsxFile(file, questions, answers);
  return null;
}

/* ── DOCX to'ldirish ──────────────────────────────────────────────────────── */
async function _fillDocxFile(file, questions, answers) {
  await _ensureJSZip();
  var ab = await file.arrayBuffer();
  var zip = await JSZip.loadAsync(ab);
  var xmlEntry = zip.file('word/document.xml');
  if (!xmlEntry) throw new Error('Invalid DOCX: word/document.xml topilmadi');
  var xml = await xmlEntry.async('string');

  var qIdx = 1;
  xml = xml.replace(/_(_+)/g, function() {
    var ans = answers[String(qIdx++)];
    return ans ? _xmlEsc(String(ans)) : '';
  });

  zip.file('word/document.xml', xml);
  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

/* ── XLSX to'ldirish ─────────────────────────────────────────────────────── */
async function _fillXlsxFile(file, questions, answers) {
  await _ensureSheetJS();
  var ab = await file.arrayBuffer();
  var wb = XLSX.read(ab, { type: 'array' });

  wb.SheetNames.forEach(function(sn) {
    var ws = wb.Sheets[sn];
    if (!ws['!ref']) return;
    var range = XLSX.utils.decode_range(ws['!ref']);
    var replyCol = -1;
    for (var c = range.s.c; c <= range.e.c; c++) {
      var hCell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: c })];
      if (hCell && /reply|javob|answer/i.test(String(hCell.v || ''))) {
        replyCol = c; break;
      }
    }
    if (replyCol < 0) replyCol = range.e.c;

    var qIdx = 1;
    for (var r = range.s.r + 1; r <= range.e.r; r++) {
      var qCell = ws[XLSX.utils.encode_cell({ r: r, c: range.s.c })];
      if (!qCell || !String(qCell.v || '').trim()) continue;
      var addr = XLSX.utils.encode_cell({ r: r, c: replyCol });
      var existing = ws[addr];
      if (!existing || !String(existing.v || '').trim()) {
        var ans = answers[String(qIdx)];
        if (ans) ws[addr] = { t: 's', v: String(ans) };
      }
      qIdx++;
    }
    ws['!ref'] = XLSX.utils.encode_range(range);
  });

  var wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

function _xmlEsc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/* ──────────────────────────────────────────────────────────
   FILE INPUT EVENT — faylni stage qilamiz (hali jo'natmaymiz)
────────────────────────────────────────────────────────── */
function handleChatFileSelect(e) {
  var file = e.target && e.target.files && e.target.files[0];
  if (!file) return;
  if (e.target) e.target.value = '';

  var ext = file.name.split('.').pop().toLowerCase();
  if (!['docx', 'xlsx', 'pdf'].includes(ext)) {
    addChatMsg('⚠️ Faqat .docx, .xlsx, .pdf fayllar qabul qilinadi.', 'bot');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    addChatMsg('⚠️ Fayl hajmi 20 MB dan oshmasligi kerak.', 'bot');
    return;
  }
  _stageFile(file);
}

/* Drag-and-drop */
function _initChatDragDrop() {
  var panel = document.getElementById('chatPanel');
  if (!panel) return;
  panel.addEventListener('dragover', function(e) {
    e.preventDefault();
    panel.classList.add('chat-drag-over');
  });
  panel.addEventListener('dragleave', function(e) {
    if (!panel.contains(e.relatedTarget)) panel.classList.remove('chat-drag-over');
  });
  panel.addEventListener('drop', function(e) {
    e.preventDefault();
    panel.classList.remove('chat-drag-over');
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) _stageFile(file);
  });
}

/* ──────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────── */
function initChatFileUpload() {
  var inp = document.getElementById('chatFileInput');
  if (inp) inp.addEventListener('change', handleChatFileSelect);
  _initChatDragDrop();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatFileUpload);
} else {
  initChatFileUpload();
}

window.handleChatFileSelect = handleChatFileSelect;
window.extractFileText = extractFileText;
window.matchQuestionnaire = matchQuestionnaire;
