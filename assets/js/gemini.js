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
async function callGemini(body, _retryCount, _keyIdx){
  var retryCount = _retryCount || 0;
  var keyIdx = _keyIdx || 0;
  var maxRetries = 2;
  var keys = getAllGeminiKeys();
  if(!keys.length) throw new Error('Gemini API kalit yo\'q. ⚙️ Sozlamalar sahifasidan kiriting.');
  var key = keys[keyIdx];
  if(!key) throw new Error('Gemini API kalit yo\'q.');

  for(var m=0; m<GEMINI_MODELS.length; m++){
    try {
      // Gemma modellar JSON mode'ni qo'llab-quvvatlamaydi — clone qilib responseMimeType ni olib tashlaymiz
      var modelName = GEMINI_MODELS[m];
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
