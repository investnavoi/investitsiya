/* ═══ GEMINI CONFIG (must be first) ═══ */
// API kalit Firebase'dan yuklanadi, agar yo'q bo'lsa fallback
var GEMINI_KEY = (window._apiKeys && window._apiKeys.gemini) || '';
// Faqat ishlaydigan modellar — 2.0-flash va lite YOQILMAGAN, faqat 2.5-flash ishlaydi
const GEMINI_MODELS = ['gemini-2.5-pro','gemini-2.5-flash','gemma-3-27b-it','gemma-3-12b-it','gemma-3-4b-it'];

function getGeminiKey(){
  // Always check Firebase first
  if(window._apiKeys && window._apiKeys.gemini) return window._apiKeys.gemini;
  return GEMINI_KEY;
}
function geminiUrl(model){
  return 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + getGeminiKey();
}
async function callGemini(body, _retryCount){
  var retryCount = _retryCount || 0;
  var maxRetries = 2;
  var key = getGeminiKey();
  if(!key) throw new Error('Gemini API kalit yo\'q. ⚙️ Sozlamalar sahifasidan kiriting.');
  
  for(var m=0; m<GEMINI_MODELS.length; m++){
    try {
      var resp = await fetch(geminiUrl(GEMINI_MODELS[m]),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(resp.ok){
        var data = await resp.json();
        if(data.candidates && data.candidates[0]) return data;
      }
      // Read error body once
      var errBody = await resp.json().catch(function(){return {};});
      var errMsg = errBody.error?.message || ('Status: '+resp.status);
      
      // 429 = rate limit — wait and retry
      if(resp.status === 429 && retryCount < maxRetries){
        var waitMatch = errMsg.match(/retry in (\d+)/i);
        var waitSec = waitMatch ? parseInt(waitMatch[1])+3 : 20;
        toast('⏳ Gemini limit — '+waitSec+'s kutilmoqda... ('+(retryCount+1)+'/'+maxRetries+')','info');
        await new Promise(function(r){setTimeout(r, waitSec*1000);});
        return callGemini(body, retryCount+1);
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
