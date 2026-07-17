/* ═══ GEMINI CONFIG (must be first) ═══ */
// API kalit Firebase'dan yuklanadi, agar yo'q bo'lsa fallback
var GEMINI_KEY = (window._apiKeys && window._apiKeys.gemini) || '';
// Faqat ishlaydigan modellar — 2.0-flash va lite YOQILMAGAN, faqat 2.5-flash ishlaydi
// Gemini 2.5 Flash first (250K token quota), Gemma as fallback
// Gemma first — has much higher free-tier daily limit (14,400 RPD vs Gemini 2.5 Flash 250 RPD)
const GEMINI_MODELS = ['gemma-3-27b-it','gemma-3-12b-it','gemma-3-4b-it','gemini-2.5-flash','gemini-2.5-flash-lite','gemini-2.0-flash','gemini-2.0-flash-lite'];

function getGeminiKey(){
  if(window._apiKeys && window._apiKeys.gemini) return window._apiKeys.gemini;
  return GEMINI_KEY;
}
function getGeminiKey2(){
  return (window._apiKeys && window._apiKeys.gemini2) || '';
}
// Get all available keys (primary first, then fallback)
function getAllGeminiKeys(){
  var keys = [];
  var k1 = getGeminiKey();
  var k2 = getGeminiKey2();
  if(k1) keys.push(k1);
  if(k2 && k2 !== k1) keys.push(k2);
  return keys;
}
function geminiUrl(model, key){
  return 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + (key || getGeminiKey());
}
/* AI proxy orqali chaqirish — kalit SERVERDA qoladi (brauzerga tushmaydi).
   Faqat brauzerda kalit YO'Q bo'lganda ishlatiladi. Proxy topilmasa (statik
   hosting) bir marta belgilanadi va eski usulga qaytiladi. */
async function _geminiViaProxy(body){
  if(typeof AI_PROXY_BASE === 'undefined' || !AI_PROXY_BASE || window._aiProxyDown === true) return null;
  var idToken = (typeof getFirebaseIdToken === 'function') ? await getFirebaseIdToken() : '';
  if(!idToken) return null;
  var r = await fetch(AI_PROXY_BASE + '/gemini', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':'Bearer ' + idToken },
    body: JSON.stringify({ model: GEMINI_MODELS[0], payload: body })
  });
  if(r.status === 404 || r.status === 405){
    window._aiProxyDown = true;
    console.warn('ℹ️ AI proxy topilmadi — Gemini brauzerdagi kalit bilan chaqiriladi.');
    return null;
  }
  var d = await r.json().catch(function(){ return {}; });
  if(r.ok && d.candidates && d.candidates[0]) return d;
  throw new Error('Gemini (proxy): ' + ((d.error && d.error.message) || d.error || ('Status ' + r.status)));
}

async function callGemini(body, _retryCount, _keyIdx){
  var retryCount = _retryCount || 0;
  var keyIdx = _keyIdx || 0;
  var maxRetries = 2;
  var keys = getAllGeminiKeys();
  /* Kalit brauzerda yo'q → server proxy orqali urinib ko'ramiz */
  if(!keys.length){
    var viaProxy = await _geminiViaProxy(body);
    if(viaProxy) return viaProxy;
  }
  if(!keys.length) throw new Error('Gemini kalit yo\'q. Sayt Vercel\'ga deploy qilinsa kalit serverda bo\'ladi; aks holda ⚙️ Sozlamalardan kiriting.');
  var key = keys[keyIdx];
  if(!key) throw new Error('Gemini API kalit yo\'q.');

  // Tools (google_search) bo'lsa Gemma'ni o'tkazib yuboramiz — Gemma tools'ni qo'llamaydi
  var hasTools = body && Array.isArray(body.tools) && body.tools.length > 0;
  for(var m=0; m<GEMINI_MODELS.length; m++){
    try {
      var modelName = GEMINI_MODELS[m];
      // Tools bor bo'lsa Gemma modellarni skip qilamiz
      if(hasTools && modelName.indexOf('gemma') !== -1) continue;
      // Gemma modellar JSON mode'ni qo'llab-quvvatlamaydi — clone qilib responseMimeType ni olib tashlaymiz
      var bodyToSend = body;
      if(modelName.indexOf('gemma') !== -1 && body && body.generationConfig && (body.generationConfig.responseMimeType || body.generationConfig.responseSchema)){
        bodyToSend = JSON.parse(JSON.stringify(body));
        delete bodyToSend.generationConfig.responseMimeType;
        delete bodyToSend.generationConfig.responseSchema;
      }
      var resp = await fetch(geminiUrl(modelName, key),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(bodyToSend)});
      if(resp.ok){
        var data = await resp.json();
        if(data.candidates && data.candidates[0]) return data;
      }
      // Read error body once
      var errBody = await resp.json().catch(function(){return {};});
      var errMsg = errBody.error?.message || ('Status: '+resp.status);
      
      // 429 = rate limit / quota
      if(resp.status === 429){
        var isQuota = errMsg.indexOf('quota') !== -1 || errMsg.indexOf('Quota') !== -1;
        // Try next API key if quota exhausted
        if(isQuota && keyIdx + 1 < keys.length){
          console.warn('Gemini key #'+(keyIdx+1)+' kvota tugadi → key #'+(keyIdx+2)+' ga o\'tilmoqda');
          toast('🔄 Asosiy kalit kvota tugadi — zaxira kalit ishlatilmoqda','info');
          return callGemini(body, 0, keyIdx + 1);
        }
        if(isQuota){
          // Disable auto-translate so it stops burning quota
          try { localStorage.setItem('_autotr_disabled', '1'); } catch(e){}
          throw new Error('Barcha Gemini kalitlar kvota tugadi. Sozlamalardan yangi kalit qo\'shing yoki ertaga qayta urining.');
        }
        // Rate limit (not quota) — short retry
        if(retryCount < maxRetries){
          var waitMatch = errMsg.match(/retry in (\d+)/i);
          var waitSec = waitMatch ? parseInt(waitMatch[1])+3 : 20;
          toast('⏳ Gemini limit — '+waitSec+'s kutilmoqda... ('+(retryCount+1)+'/'+maxRetries+')','info');
          await new Promise(function(r){setTimeout(r, waitSec*1000);});
          return callGemini(body, retryCount+1, keyIdx);
        }
      }
      console.log('Gemini '+GEMINI_MODELS[m]+' xato:', errMsg);
    } catch(e){ console.log('Gemini '+GEMINI_MODELS[m]+' fetch error:',e); }
  }
  throw new Error('Gemini API xato. 15 soniya kutib qayta urinib ko\'ring.');
}

// Streaming variant — barcha GEMINI_MODELS ni navbat bilan sinaydi, ishlaganida
// real-time matn oqimini onChunk(textDelta, full) orqali qaytaradi.
// messages = [{role:'system'|'user', content:'...'}] (OpenAI uslubida — moslashuvchanlik uchun)
async function callGeminiStream(messages, opts, onChunk){
  opts = opts || {};
  var keys = getAllGeminiKeys();
  if(!keys.length) throw new Error('Gemini API kalit yo\'q. ⚙️ Sozlamalar sahifasidan kiriting.');

  // system + user contentlarni Gemini formatiga aylantiramiz
  var systemText = '';
  var userParts = [];
  (messages || []).forEach(function(m){
    if(!m) return;
    if(m.role === 'system'){ systemText += (systemText ? '\n\n' : '') + String(m.content || ''); }
    else { userParts.push(String(m.content || '')); }
  });
  var body = {
    contents: [{ role: 'user', parts: [{ text: userParts.join('\n\n') }] }],
    generationConfig: {
      temperature: Number.isFinite(Number(opts.temperature)) ? Number(opts.temperature) : 0.7,
      maxOutputTokens: Math.min(Math.max(Number(opts.maxTokens) || 4096, 256), 8192)
    }
  };
  // System instruction (Gemma uni qo'llamaydi — pastda olib tashlanadi)
  if(systemText) body.systemInstruction = { parts: [{ text: systemText }] };

  var lastErr = null;
  for(var ki = 0; ki < keys.length; ki++){
    var key = keys[ki];
    for(var m = 0; m < GEMINI_MODELS.length; m++){
      var modelName = GEMINI_MODELS[m];
      // Gemma modellar systemInstruction'ni qo'llamaydi — clone qilib system'ni user'ga qo'shamiz
      var bodyToSend = body;
      if(modelName.indexOf('gemma') !== -1){
        bodyToSend = JSON.parse(JSON.stringify(body));
        if(bodyToSend.systemInstruction){
          var sysT = (bodyToSend.systemInstruction.parts && bodyToSend.systemInstruction.parts[0] && bodyToSend.systemInstruction.parts[0].text) || '';
          delete bodyToSend.systemInstruction;
          if(sysT && bodyToSend.contents && bodyToSend.contents[0]){
            bodyToSend.contents[0].parts[0].text = sysT + '\n\n' + bodyToSend.contents[0].parts[0].text;
          }
        }
      }
      // Idle/overall timeout — stream osilib qolmasin
      var ctrl = new AbortController();
      var overallTimer = setTimeout(function(){ try{ctrl.abort();}catch(_e){} }, Number(opts.timeoutMs) || 180000);
      var idleTimer = null;
      var resetIdle = function(){ if(idleTimer) clearTimeout(idleTimer); idleTimer = setTimeout(function(){ try{ctrl.abort();}catch(_e){} }, Number(opts.idleTimeoutMs) || 45000); };
      try {
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + modelName + ':streamGenerateContent?alt=sse&key=' + encodeURIComponent(key);
        var resp = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(bodyToSend), signal: ctrl.signal });
        if(!resp.ok){
          var errTxt = await resp.text().catch(function(){return '';});
          lastErr = new Error(modelName + ' → ' + resp.status + ': ' + errTxt.slice(0,150));
          console.log('[callGeminiStream] '+modelName+' status '+resp.status);
          clearTimeout(overallTimer); if(idleTimer) clearTimeout(idleTimer);
          continue; // keyingi modelni sinaymiz
        }
        var reader = resp.body.getReader();
        var decoder = new TextDecoder();
        var full = '';
        var buf = '';
        var finishReason = '';
        resetIdle();
        while(true){
          var chunk = await reader.read();
          if(chunk.done) break;
          resetIdle();
          buf += decoder.decode(chunk.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();
          for(var li = 0; li < lines.length; li++){
            var line = lines[li].trim();
            if(!line.startsWith('data:')) continue;
            var dataStr = line.slice(5).trim();
            if(!dataStr) continue;
            try {
              var payload = JSON.parse(dataStr);
              var cand0 = (payload.candidates || [])[0] || {};
              var parts = ((cand0.content || {}).parts) || [];
              var delta = parts.map(function(p){ return (p && p.text) || ''; }).join('');
              if(cand0.finishReason) finishReason = String(cand0.finishReason);
              if(delta){ full += delta; if(typeof onChunk === 'function') onChunk(delta, full); }
            } catch(_pe){ /* malformed chunk — skip */ }
          }
        }
        clearTimeout(overallTimer); if(idleTimer) clearTimeout(idleTimer);
        if(full && full.trim()){
          console.log('[callGeminiStream] OK model: '+modelName+' (key #'+(ki+1)+') finishReason='+(finishReason||'?'));
          return { content: full, model: modelName, finishReason: finishReason };
        }
        // bo'sh javob — keyingi modelni sinaymiz
        lastErr = new Error(modelName + ' bo\'sh javob qaytardi');
      } catch(e){
        clearTimeout(overallTimer); if(idleTimer) clearTimeout(idleTimer);
        // Abort bo'lib qisman matn yig'ilgan bo'lsa — uni qaytaramiz
        if(e && e.name === 'AbortError'){
          lastErr = new Error(modelName + ' timeout');
          console.log('[callGeminiStream] '+modelName+' timeout');
        } else {
          lastErr = e;
          console.log('[callGeminiStream] '+modelName+' xato:', e && e.message);
        }
        continue;
      }
    }
  }
  throw new Error('Barcha Gemini modellari ishlamadi: ' + (lastErr && lastErr.message ? lastErr.message : 'noma\'lum xato'));
}

// Safe JSON parser — handles Gemini's messy responses
function safeParseJSON(raw){
  if(!raw) throw new Error('Bo\'sh javob');
  var text = raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
  
  // 1. Direct parse
  try { return JSON.parse(text); } catch(e){}
  
  // 2. Find JSON start
  var start = -1;
  for(var i=0;i<text.length;i++){
    if(text[i]==='{' || text[i]==='['){start=i;break;}
  }
  if(start<0) throw new Error('JSON topilmadi javobda');
  var sub = text.slice(start);
  
  // 3. Try direct
  try { return JSON.parse(sub); } catch(e){}
  
  // 4. Fix truncated: count brackets and close them properly
  var stack = [];
  var inStr = false;
  var esc = false;
  var lastValidPos = 0;
  
  for(var i=0;i<sub.length;i++){
    var ch = sub[i];
    if(esc){ esc=false; continue; }
    if(ch==='\\'){ esc=true; continue; }
    if(ch==='"'){ inStr=!inStr; continue; }
    if(inStr) continue;
    if(ch==='{') stack.push('}');
    else if(ch==='[') stack.push(']');
    else if(ch==='}' || ch===']'){
      if(stack.length>0) stack.pop();
      if(stack.length===0){ lastValidPos=i; break; }
    }
  }
  
  // Try up to last valid closing position
  if(lastValidPos>0){
    try { return JSON.parse(sub.slice(0,lastValidPos+1)); } catch(e){}
  }
  
  // 5. Brute force close all open brackets
  var fixed = sub.replace(/,\s*$/, '');
  // Remove incomplete last key-value pair
  fixed = fixed.replace(/,\s*"[^"]*"\s*:\s*"?[^"{}[\]]*$/, '');
  fixed = fixed.replace(/,\s*$/, '');
  // Close all open brackets
  var s2 = [];
  var inStr2 = false; var esc2 = false;
  for(var i=0;i<fixed.length;i++){
    var ch = fixed[i];
    if(esc2){ esc2=false; continue; }
    if(ch==='\\'){ esc2=true; continue; }
    if(ch==='"'){ inStr2=!inStr2; continue; }
    if(inStr2) continue;
    if(ch==='{') s2.push('}');
    else if(ch==='[') s2.push(']');
    else if(ch==='}' || ch===']') s2.pop();
  }
  while(s2.length>0) fixed += s2.pop();
  try { return JSON.parse(fixed); } catch(e){}
  
  // 6. Last resort — find any complete JSON object
  var re = /\{[^{}]*\}/g;
  var match;
  while((match=re.exec(sub))!==null){
    try { return JSON.parse(match[0]); } catch(e){}
  }
  
  throw new Error('JSON parse xato. Gemini javobini qayta urinib ko\'ring.');
}

function geminiText(data){
  if(data && data.candidates && data.candidates[0] && data.candidates[0].content)
    return data.candidates[0].content.parts[0].text || '';
  return '';
}
