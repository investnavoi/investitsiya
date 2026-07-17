/* ═══════════════════════════════════════
   OPENAI WRAPPER — Chat Completions + Web Search
   Key loaded from window._apiKeys.openai (Firebase apiKeys collection)
   Replaces Gemini for chatbot + AI letter / analysis.
═══════════════════════════════════════ */

var OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/* Modellar:
   - gpt-4o            → asosiy yuqori sifatli model (chatbot, analiz)
   - gpt-4o-mini       → arzon fallback (fallback bo'lganda)
   - gpt-4o-search-preview → web search baked-in (email + tahlil uchun)
   Web search modelda temperature parametri qabul qilinmaydi.
*/
var OPENAI_MODEL_DEFAULT = 'gpt-4o';
var OPENAI_MODEL_MINI = 'gpt-4o-mini';
var OPENAI_MODEL_SEARCH = 'gpt-4o-search-preview';
var OPENAI_MODEL_REASONING = 'o4-mini'; /* Reasoning model — chuqur tahlil (extended thinking) */

function getOpenAIKey(){
  return (window._apiKeys && window._apiKeys.openai) || '';
}

/* ────────────────────────────────────────
   AI proxy orqali yuborish — kalit SERVERDA qoladi, brauzerga tushmaydi.
   Agar proxy mavjud bo'lmasa (masalan GitHub Pages'da serverless yo'q),
   bir marta belgilab qo'yamiz va eski usulga (brauzerdagi kalit) qaytamiz.
   Shu sababli bu o'zgarish ikkala hostingda ham xavfsiz ishlaydi.
──────────────────────────────────────── */
async function _openaiFetch(body, signal){
  var canProxy = (typeof AI_PROXY_BASE !== 'undefined') && AI_PROXY_BASE && window._aiProxyDown !== true;
  if(canProxy){
    var idToken = (typeof getFirebaseIdToken === 'function') ? await getFirebaseIdToken() : '';
    if(idToken){
      var r = await fetch(AI_PROXY_BASE + '/openai', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + idToken },
        body: JSON.stringify(body),
        signal: signal
      });
      /* 404/405 = proxy yo'q (statik hosting) → eski usulga qaytamiz */
      if(r.status !== 404 && r.status !== 405) return r;
      window._aiProxyDown = true;
      console.warn('ℹ️ AI proxy topilmadi — brauzerdagi kalit bilan to\'g\'ridan-to\'g\'ri chaqiriladi.');
    }
  }
  var key = getOpenAIKey();
  if(!key) throw new Error('OpenAI kalit yo\'q. Sayt Vercel\'ga deploy qilinsa kalit serverda bo\'ladi; aks holda ⚙️ Sozlamalardan kiriting.');
  return fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + key },
    body: JSON.stringify(body),
    signal: signal
  });
}

/* ────────────────────────────────────────
   Asosiy chaqiruv. messages = [{role,content}, ...]
   opts:
     model            — model nomi (default gpt-4o)
     temperature      — 0..2 (default 0.7) — search/o-series modellarda inkor etiladi
     maxTokens        — javob uzunligi (default 2048; o-series: max_completion_tokens)
     jsonMode         — true bo'lsa response_format=json_object
     webSearch        — true bo'lsa gpt-4o-search-preview
     reasoningEffort  — 'low'|'medium'|'high' — faqat o-series (o4-mini, o3 …) uchun
     timeoutMs        — fetch timeout (default: o-series 90s, search 120s, boshqa 60s)
   Return: {content, raw, model} — content = assistant matni
──────────────────────────────────────── */
async function callOpenAI(messages, opts){
  opts = opts || {};
  /* Kalit tekshiruvi endi _openaiFetch ichida — proxy ishlatilsa kalit umuman kerak emas */
  var useSearch = !!opts.webSearch;
  var model = opts.model || (useSearch ? OPENAI_MODEL_SEARCH : OPENAI_MODEL_DEFAULT);
  /* o-series (o1, o3, o4-mini …) → max_completion_tokens + reasoning_effort, NO temperature/max_tokens */
  var isOSeries = /^o\d/.test(model);
  var body = {
    model: model,
    messages: messages
  };
  if(isOSeries){
    body.max_completion_tokens = Math.min(Math.max(Number(opts.maxTokens) || 2000, 256), 16384);
    if(opts.reasoningEffort) body.reasoning_effort = String(opts.reasoningEffort); /* 'low'|'medium'|'high' */
  } else {
    body.max_tokens = Math.min(Math.max(Number(opts.maxTokens) || 2048, 128), 16384);
    /* search-preview model temperature ni qo'llab-quvvatlamaydi */
    if(!/-search-/.test(model)){
      body.temperature = Number.isFinite(Number(opts.temperature)) ? Number(opts.temperature) : 0.7;
    }
  }
  if(opts.jsonMode){
    body.response_format = { type: 'json_object' };
  }

  var ctrl = new AbortController();
  var defaultTimeout = isOSeries ? 90000 : (useSearch ? 120000 : 60000);
  var to = setTimeout(function(){ ctrl.abort(); }, Number(opts.timeoutMs) || defaultTimeout);
  var resp;
  try {
    resp = await _openaiFetch(body, ctrl.signal);
  } catch(e){
    clearTimeout(to);
    if(e && e.name === 'AbortError') throw new Error('OpenAI so\'rovi vaqtdan oshdi (timeout)');
    throw e;
  }
  clearTimeout(to);

  if(!resp.ok){
    var errBody = await resp.json().catch(function(){ return {}; });
    var errMsg = (errBody.error && errBody.error.message) || ('Status ' + resp.status);
    if(resp.status === 401) throw new Error('OpenAI: API kalit noto\'g\'ri yoki bekor qilingan. Sozlamalardan yangilang.');
    if(resp.status === 429) throw new Error('OpenAI: rate limit yoki kvota tugagan. Biroz kutib qayta urining.');
    if(resp.status === 400 && /web_search/i.test(errMsg)) throw new Error('OpenAI web search modeli mavjud emas — gpt-4o ga o\'tilmoqda. Iltimos, qayta urining.');
    throw new Error('OpenAI xato: ' + errMsg);
  }

  var data = await resp.json();
  var content = (((data.choices || [])[0] || {}).message || {}).content || '';
  return { content: String(content || ''), raw: data, model: model };
}

/* Streaming variant — onChunk(text) har bir token kelganda chaqiriladi.
   Chatbot uchun real-time javob ko'rsatish.
*/
async function callOpenAIStream(messages, opts, onChunk){
  opts = opts || {};
  var key = getOpenAIKey();
  /* Proxy rejimi: kalit brauzerda yo'q. Streaming'ni proxy qo'llab-quvvatlamaydi,
     shuning uchun oddiy (stream'siz) chaqiruvga tushamiz va matnni bir marta beramiz.
     Chatbot ishlaydi — faqat token-token yozilmaydi. */
  if(!key){
    var _out = await callOpenAI(messages, opts);
    if(typeof onChunk === 'function' && _out && _out.content) onChunk(_out.content);
    return _out;
  }

  var model = opts.model || OPENAI_MODEL_DEFAULT;
  var body = {
    model: model,
    messages: messages,
    max_tokens: Math.min(Math.max(Number(opts.maxTokens) || 1024, 128), 8192),
    stream: true
  };
  if(!/-search-/.test(model)){
    body.temperature = Number.isFinite(Number(opts.temperature)) ? Number(opts.temperature) : 0.7;
  }

  // AbortController — umumiy va idle (chunklar orasidagi) timeout uchun.
  // Stream stalled bo'lsa (yangi token kelmasa) abadiy osilib qolmaslik kerak.
  var ctrl = new AbortController();
  var OVERALL_MS = Number(opts.timeoutMs) || 180000; // 3 daqiqa umumiy
  var IDLE_MS = Number(opts.idleTimeoutMs) || 45000;  // 45s yangi chunk kelmasa
  var overallTimer = setTimeout(function(){ try { ctrl.abort(); } catch(_e){} }, OVERALL_MS);
  var idleTimer = null;
  function resetIdle(){
    if(idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function(){ try { ctrl.abort(); } catch(_e){} }, IDLE_MS);
  }

  var resp;
  try {
    resp = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + key },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
  } catch(e){
    clearTimeout(overallTimer); if(idleTimer) clearTimeout(idleTimer);
    if(e && e.name === 'AbortError') throw new Error('OpenAI so\'rovi vaqtdan oshdi (timeout)');
    throw e;
  }
  if(!resp.ok){
    clearTimeout(overallTimer); if(idleTimer) clearTimeout(idleTimer);
    var errBody = await resp.json().catch(function(){ return {}; });
    var errMsg = (errBody.error && errBody.error.message) || ('Status ' + resp.status);
    if(resp.status === 401) throw new Error('OpenAI: API kalit noto\'g\'ri.');
    if(resp.status === 429) throw new Error('OpenAI: rate limit. Biroz kuting.');
    throw new Error('OpenAI xato: ' + errMsg);
  }

  var reader = resp.body.getReader();
  var decoder = new TextDecoder();
  var full = '';
  var buf = '';
  resetIdle();
  try {
    while(true){
      var chunk = await reader.read();
      if(chunk.done) break;
      resetIdle();
      buf += decoder.decode(chunk.value, { stream: true });
      var lines = buf.split('\n');
      buf = lines.pop();
      for(var i = 0; i < lines.length; i++){
        var line = lines[i].trim();
        if(!line.startsWith('data:')) continue;
        var dataStr = line.slice(5).trim();
        if(!dataStr || dataStr === '[DONE]') continue;
        try {
          var payload = JSON.parse(dataStr);
          var delta = (((payload.choices || [])[0] || {}).delta || {}).content || '';
          if(delta){
            full += delta;
            if(typeof onChunk === 'function') onChunk(delta, full);
          }
        } catch(e){ /* malformed chunk — skip */ }
      }
    }
  } catch(e){
    // Stream o'rtada uzilsa — agar matn yig'ilgan bo'lsa, uni qaytaramiz (foydalanuvchi
    // qisman tahlilni ko'radi); aks holda xato tashlaymiz.
    if(e && e.name === 'AbortError'){
      if(full && full.trim().length > 50){ console.warn('[callOpenAIStream] stream timeout — qisman natija qaytarildi'); }
      else { clearTimeout(overallTimer); if(idleTimer) clearTimeout(idleTimer); throw new Error('OpenAI stream vaqtdan oshdi (timeout)'); }
    } else { clearTimeout(overallTimer); if(idleTimer) clearTimeout(idleTimer); throw e; }
  }
  clearTimeout(overallTimer); if(idleTimer) clearTimeout(idleTimer);
  return { content: full, model: model };
}

/* Sanity check on load — log key health silently */
async function testOpenAIKey(){
  var key = getOpenAIKey();
  if(!key){ return false; }
  try {
    var r = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization':'Bearer ' + key }
    });
    if(r.ok){ console.log('✅ OpenAI API kaliti ishlayapti'); return true; }
    if(r.status === 401){ console.error('❌ OpenAI: kalit yaroqsiz'); return false; }
    console.warn('OpenAI test status:', r.status);
    return false;
  } catch(e){ console.warn('OpenAI test error:', e && e.message); return false; }
}

/* JSON javobni xavfsiz tarzda parse qilish (search modeldan keluvchi shovqin tahliliga ham mos) */
function safeParseOpenAIJson(raw){
  if(!raw) throw new Error('Bo\'sh javob');
  var text = String(raw).replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
  try { return JSON.parse(text); } catch(e){}
  /* JSON boshini topish */
  var start = -1;
  for(var i = 0; i < text.length; i++){
    if(text[i] === '{' || text[i] === '['){ start = i; break; }
  }
  if(start < 0) throw new Error('JSON topilmadi');
  var sub = text.slice(start);
  /* Oxiri tamomlanmagan bo'lsa qavslarni yopib parse qilamiz */
  var stack = [];
  var inStr = false;
  var esc = false;
  for(var j = 0; j < sub.length; j++){
    var ch = sub[j];
    if(esc){ esc = false; continue; }
    if(ch === '\\'){ esc = true; continue; }
    if(ch === '"'){ inStr = !inStr; continue; }
    if(inStr) continue;
    if(ch === '{') stack.push('}');
    else if(ch === '[') stack.push(']');
    else if(ch === '}' || ch === ']') stack.pop();
  }
  var fixed = sub.replace(/,\s*$/, '');
  while(stack.length > 0) fixed += stack.pop();
  return JSON.parse(fixed);
}

/* Sahifa ochilganda kalitni tekshiramiz — _apiKeys loadlangandan keyin */
window.addEventListener('load', function(){
  setTimeout(function(){ try { testOpenAIKey(); } catch(e){} }, 2000);
});

/* Global eksport */
window.callOpenAI = callOpenAI;
window.callOpenAIStream = callOpenAIStream;
window.getOpenAIKey = getOpenAIKey;
window.safeParseOpenAIJson = safeParseOpenAIJson;
window.OPENAI_MODEL_DEFAULT = OPENAI_MODEL_DEFAULT;
window.OPENAI_MODEL_SEARCH = OPENAI_MODEL_SEARCH;
window.OPENAI_MODEL_MINI = OPENAI_MODEL_MINI;
window.OPENAI_MODEL_REASONING = OPENAI_MODEL_REASONING;
