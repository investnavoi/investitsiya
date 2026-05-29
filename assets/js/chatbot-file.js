/* ═══════════════════════════════════════════════════════════
   CHATBOT FILE HANDLER — So'rovnoma yuklash va to'ldirish
   1. Ma'lum so'rovnomalar → tayyor faylni qaytarish
   2. O'zbek tilidagi tarjimalar → AI bilan aniqlash
   3. Yangi so'rovnomalar → AI internet research + original faylni to'ldirish
═══════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────────
   MA'LUM SO'ROVNOMALAR BAZASI
   keywords: ingliz va boshqa tillardagi kalit so'zlar
   uzKeywords: o'zbek tilidagi ekvivalentlar
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
        /* ASCII printable, Cyrillic, Latin extended, CJK */
        if ((c >= 32 && c < 127) || (c >= 0xC0)) {
          text += String.fromCharCode(c);
        } else if (c === 10 || c === 13) {
          text += '\n';
        }
      }
      resolve(text.replace(/\s+/g, ' ').trim().slice(0, 10000));
    };
    reader.onerror = function() { resolve(file.name); };
    reader.readAsArrayBuffer(file);
  });
}

/* ──────────────────────────────────────────────────────────
   SO'ROVNOMANI ANIQLASH
   1-bosqich: kalit so'zlar
   2-bosqich: AI klassifikatsiya (o'zbek tarjimasi uchun)
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
      'Classify this questionnaire into ONE of the categories below (respond ONLY with the ID, e.g. "factory_cis" or "unknown").\n\n' +
      'Categories:\n' + ids + '\nunknown — not in the list above\n\n' +
      'File name: ' + filename + '\n' +
      'File content (first 1500 chars):\n' + text.slice(0, 1500);
    var r = await callOpenAI([{ role: 'user', content: prompt }],
      { model: window.OPENAI_MODEL_DEFAULT || 'gpt-4o', maxTokens: 20, temperature: 0 });
    var id = (r.content || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    return QUESTIONNAIRE_LIBRARY.find(function(q) { return q.id === id; }) || null;
  } catch (e) {
    console.warn('AI classify error:', e && e.message);
    return null;
  }
}

async function matchQuestionnaire(text, filename, botDiv) {
  /* 1. Tezkor kalit so'z tekshiruvi */
  var m = _keywordMatch(text, filename);
  if (m) return m;

  /* 2. AI klassifikatsiya (o'zbek tarjimasi yoki boshqa til bo'lsa) */
  return await _aiClassify(text, filename);
}

/* ──────────────────────────────────────────────────────────
   YANGI SO'ROVNOMANI AI BILAN TO'LDIRISH
────────────────────────────────────────────────────────── */
async function fillQuestionnaireWithAI(file, extractedText, botDiv) {
  var ext = file.name.split('.').pop().toLowerCase();

  /* Bosqich 1: Savollarni ajrating */

  var qListPrompt =
    'From the questionnaire below, extract every question or blank field that needs to be answered.\n' +
    'Return ONLY valid JSON (no markdown): [{"n":1,"q":"question text"},{"n":2,"q":"..."},...]\n' +
    'Max 50 items. Short question summaries (under 120 chars each).\n\n' +
    extractedText.slice(0, 4500);

  var questions = [];
  try {
    var qRes = await callOpenAI([{ role: 'user', content: qListPrompt }],
      { model: window.OPENAI_MODEL_DEFAULT || 'gpt-4o', jsonMode: true, maxTokens: 2000 });
    questions = JSON.parse(qRes.content || '[]');
    if (!Array.isArray(questions)) questions = [];
  } catch (e) { questions = []; }

  if (!questions.length) {
    throw new Error('So\'rovnoma savollari ajratilmadi');
  }

  /* Bosqich 2: Har savol uchun AI javob (web search) */
  if (botDiv) updateChatMsg(botDiv, '🧠 So\'rovnoma to\'ldirilmoqda...');

  var systemCtx = (typeof NAVOIY_CONTEXT !== 'undefined') ? NAVOIY_CONTEXT :
    'You are an expert on Navoi region, Uzbekistan investment environment. ' +
    'Answer each question accurately and concisely based on official data.';

  var answerPrompt =
    'Fill in the following questionnaire about Navoi region, Uzbekistan.\n' +
    'For each question give a specific, accurate, concise answer (1-3 sentences max).\n' +
    'Return ONLY valid JSON: {"1":"answer","2":"answer",...}\n\n' +
    'Questions:\n' +
    questions.map(function(q) { return q.n + '. ' + q.q; }).join('\n');

  var answers = {};
  try {
    var aRes = await callOpenAI(
      [{ role: 'system', content: systemCtx }, { role: 'user', content: answerPrompt }],
      {
        model: window.OPENAI_MODEL_SEARCH || 'gpt-4o-search-preview',
        webSearch: true,
        jsonMode: true,
        maxTokens: 3000,
        timeoutMs: 90000
      }
    );
    answers = JSON.parse(aRes.content || '{}');
    if (typeof answers !== 'object' || Array.isArray(answers)) answers = {};
  } catch (e) {
    console.warn('AI answers error:', e && e.message);
    /* Fallback: gpt-4o without search */
    try {
      var fb = await callOpenAI(
        [{ role: 'system', content: systemCtx }, { role: 'user', content: answerPrompt }],
        { model: window.OPENAI_MODEL_DEFAULT || 'gpt-4o', jsonMode: true, maxTokens: 3000 }
      );
      answers = JSON.parse(fb.content || '{}');
      if (typeof answers !== 'object' || Array.isArray(answers)) answers = {};
    } catch (e2) { answers = {}; }
  }

  if (botDiv) updateChatMsg(botDiv, '📝 Original fayl to\'ldirilmoqda...');

  /* Bosqich 3: Faylni to'ldirish */
  if (ext === 'docx') return await _fillDocxFile(file, questions, answers);
  if (ext === 'xlsx') return await _fillXlsxFile(file, questions, answers);
  return null; /* PDF uchun blob qaytarmaymiz */
}

/* ── DOCX to'ldirish ──────────────────────────────────────────────────────── */
async function _fillDocxFile(file, questions, answers) {
  await _ensureJSZip();
  var ab = await file.arrayBuffer();
  var zip = await JSZip.loadAsync(ab);
  var xmlEntry = zip.file('word/document.xml');
  if (!xmlEntry) throw new Error('Invalid DOCX: word/document.xml topilmadi');
  var xml = await xmlEntry.async('string');

  /* Blanklarni tartib bilan to'ldirish:
     1) _{4,} — uzun chiziqchalar
     2) Bo'sh jadval katakchalari (w:tc ichida faqat w:p > bo'sh w:t) */
  var qIdx = 1;
  /* __ bilan belgilangan bo'sh joylarni to'ldirish */
  xml = xml.replace(/_(_+)/g, function() {
    var ans = answers[String(qIdx)];
    qIdx++;
    return ans ? _xmlEsc(String(ans)) : '';
  });

  /* Jadval katakchalarida matn yo'q yoki faqat bo'sh bo'lsa — javob qo'shish */
  xml = xml.replace(
    /(<w:tc\b[^>]*>)((?:(?!<w:tc)[\s\S])*?)(<\/w:tc>)/g,
    function(full, open, inner, close) {
      /* Katakchada matn bormi? */
      var hasText = /<w:t[^/]/.test(inner) &&
                    inner.replace(/<[^>]+>/g, '').trim().length > 0;
      if (hasText) return full; /* matn bor — o'zgartirmaymiz */
      /* Bo'sh jadval katakchasi — javob joylashtiramiz */
      var ans = answers[String(qIdx)];
      if (!ans) { qIdx++; return full; }
      qIdx++;
      /* Minimal XML: yozuv qo'shamiz */
      var textXml =
        '<w:p><w:r><w:rPr></w:rPr><w:t xml:space="preserve">' +
        _xmlEsc(String(ans)) + '</w:t></w:r></w:p>';
      /* Mavjud w:p larni saqlab qolamiz, yangi qo'shmaymiz — faqat birinchi bo'sh w:t ni to'ldiramiz */
      return open + inner.replace(/<w:t><\/w:t>/, '<w:t xml:space="preserve">' + _xmlEsc(String(ans)) + '</w:t>') + close;
    }
  );

  zip.file('word/document.xml', xml);
  var blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  return blob;
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

    /* "Reply" ustunini topish */
    var replyCol = -1;
    for (var c = range.s.c; c <= range.e.c; c++) {
      var hCell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: c })];
      if (hCell && /reply|javob|answer/i.test(String(hCell.v || ''))) {
        replyCol = c; break;
      }
    }
    /* Topilmasa — eng oxirgi ustun */
    if (replyCol < 0) replyCol = range.e.c;

    var qIdx = 1;
    for (var r = range.s.r + 1; r <= range.e.r; r++) {
      /* Birinchi ustunda matn bormi (savol satri)? */
      var qCell = ws[XLSX.utils.encode_cell({ r: r, c: range.s.c })];
      if (!qCell || !String(qCell.v || '').trim()) continue;

      var addr = XLSX.utils.encode_cell({ r: r, c: replyCol });
      var existing = ws[addr];
      if (!existing || !String(existing.v || '').trim()) {
        var ans = answers[String(qIdx)];
        if (ans) {
          ws[addr] = { t: 's', v: String(ans) };
        }
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
   ASOSIY UPLOAD HANDLER
────────────────────────────────────────────────────────── */
async function handleChatFileUpload(e) {
  var file = (e.target && e.target.files && e.target.files[0]) ||
             (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
  if (!file) return;
  if (e.target) e.target.value = '';

  var ext = file.name.split('.').pop().toLowerCase();
  if (!['docx', 'xlsx', 'pdf'].includes(ext)) {
    addChatMsg('⚠️ Faqat .docx, .xlsx, .pdf formatdagi fayllar qabul qilinadi.', 'bot');
    return;
  }
  var sizeKB = Math.round(file.size / 1024);
  if (file.size > 20 * 1024 * 1024) {
    addChatMsg('⚠️ Fayl hajmi 20 MB dan oshmasligi kerak.', 'bot');
    return;
  }

  /* Foydalanuvchi xabari */
  addChatMsg('📎 ' + file.name + ' (' + sizeKB + ' KB)', 'user');

  var botDiv = addChatMsg('⏳', 'bot typing');
  var sendBtn = document.getElementById('chatSendBtn');
  var attachBtn = document.getElementById('chatAttachBtn');
  if (sendBtn) sendBtn.disabled = true;
  if (attachBtn) attachBtn.disabled = true;

  try {
    /* 1. Matn ajratish */
    var text = await extractFileText(file);

    /* 2. So'rovnomani aniqlash */
    var match = await matchQuestionnaire(text, file.name, botDiv);

    if (match) {
      /* ── Tayyor javob faylini yuborish ── */
      botDiv.classList.remove('typing');
      var icon = match.ext === 'pdf' ? '📄' : match.ext === 'xlsx' ? '📊' : '📝';
      updateChatMsg(botDiv,
        icon + ' **[' + file.name.replace(/\.(docx|xlsx|pdf)$/i, '') + ' — to\'ldirilgan](' + match.file + ')**\n\n' +
        'So\'rovnomani to\'ldirdim, yuklab olishingiz mumkin.'
      );

    } else {
      /* ── Yangi so'rovnoma — AI to'ldiradi ── */
      updateChatMsg(botDiv, '🧠 So\'rovnoma to\'ldirilmoqda...');

      var filledBlob = null;
      var fillErr = null;
      try {
        filledBlob = await fillQuestionnaireWithAI(file, text, botDiv);
      } catch (err) {
        fillErr = err;
        console.warn('fillQuestionnaireWithAI error:', err && err.message);
      }

      botDiv.classList.remove('typing');

      if (filledBlob) {
        /* Blob URL yasash va download link */
        var blobUrl = URL.createObjectURL(filledBlob);
        var outName = file.name.replace(/\.(docx|xlsx)$/i, '_completed.$1');
        updateChatMsg(botDiv,
          '✅ **' + file.name + '** so\'rovnomasi AI yordamida to\'ldirildi!\n\n' +
          '📥 **[To\'ldirilgan faylni yuklab olish](' + blobUrl + ')**\n\n' +
          '_Javoblar Navoiy viloyati bo\'yicha internet orqali tekshirilgan ma\'lumotlarga asoslanadi. ' +
          'Yuborishdan oldin ko\'rib chiqishingizni tavsiya qilamiz._'
        );
        /* Blob havolasiga download atributini qo'shamiz */
        setTimeout(function() {
          var lastMsg = document.getElementById('chatMsgs').lastElementChild;
          if (lastMsg) {
            lastMsg.querySelectorAll('a').forEach(function(a) {
              if (a.href.startsWith('blob:')) {
                a.download = outName;
                a.setAttribute('rel', 'noopener');
              }
            });
          }
        }, 150);
      } else {
        /* PDF yoki to'ldirish muvaffaqiyatsiz — matn sifatida javob */
        updateChatMsg(botDiv,
          '📋 So\'rovnoma yangi yoki PDF format (to\'g\'ridan-to\'g\'ri to\'ldirish qo\'llab-quvvatlanmaydi).\n\n' +
          '💬 So\'rovnoma savollarini chatga yozib yuboring — men har biriga javob beraman!'
        );
      }
    }

  } catch (err) {
    botDiv.classList.remove('typing');
    var msg = (err && err.message) ? err.message : String(err);
    updateChatMsg(botDiv, '⚠️ Xato: ' + msg);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    if (attachBtn) attachBtn.disabled = false;
  }
}

/* ──────────────────────────────────────────────────────────
   DRAG-AND-DROP qo'llab-quvvatlash (chat panel ustiga)
────────────────────────────────────────────────────────── */
function _initChatDragDrop() {
  var panel = document.getElementById('chatPanel');
  if (!panel) return;
  panel.addEventListener('dragover', function(e) {
    e.preventDefault();
    panel.classList.add('chat-drag-over');
  });
  panel.addEventListener('dragleave', function() {
    panel.classList.remove('chat-drag-over');
  });
  panel.addEventListener('drop', function(e) {
    e.preventDefault();
    panel.classList.remove('chat-drag-over');
    handleChatFileUpload(e);
  });
}

/* ──────────────────────────────────────────────────────────
   INIT
────────────────────────────────────────────────────────── */
function initChatFileUpload() {
  var inp = document.getElementById('chatFileInput');
  if (inp) inp.addEventListener('change', handleChatFileUpload);
  _initChatDragDrop();
}

/* DOMContentLoaded keyin ishga tushiramiz */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initChatFileUpload);
} else {
  initChatFileUpload();
}

window.handleChatFileUpload = handleChatFileUpload;
window.extractFileText = extractFileText;
window.matchQuestionnaire = matchQuestionnaire;
