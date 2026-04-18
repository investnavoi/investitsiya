/* ═══════════════════════════════════════
   SETTINGS
═══════════════════════════════════════ */
function loadSettings(){
  var s = DB.settings||{};
  var fields = {
    'set-elektr':s.elektr||0.03, 'set-gaz':s.gaz||0.01, 'set-suv':s.suv||0.15,
    'set-yer':s.yer||0, 'set-maosh':s.maosh||400, 'set-min-maosh':s.minMaosh||100,
    'set-soliq':s.soliq||0, 'set-soliq-yil':s.soliqYil||7,
    'set-daily-limit':s.dailyLimit||50, 'set-fu1':s.fu1||7, 'set-fu2':s.fu2||14, 'set-fu3':s.fu3||21,
    'set-tg-token':s.tgToken||(window._apiKeys&&window._apiKeys.tgToken)||'', 'set-tg-chatid':s.tgChatId||(window._apiKeys&&window._apiKeys.tgChatId)||'',
    'set-tg-apiid':(window._apiKeys&&window._apiKeys.tgApiId)||'', 'set-tg-apihash':(window._apiKeys&&window._apiKeys.tgApiHash)||'', 'set-tg-session':(window._apiKeys&&window._apiKeys.tgSession)||''
  };
  Object.keys(fields).forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = fields[id];
  });
  // API keys from Firebase
  var keys = window._apiKeys||{};
  var gkEl = document.getElementById('set-gemini-key');
  if(gkEl) gkEl.value = keys.gemini||getGeminiKey()||'';
  var akEl = document.getElementById('set-apollo-key');
  if(akEl) akEl.value = keys.apollo||'';
  var srEl = document.getElementById('set-searates-key');
  if(srEl) srEl.value = keys.searates||'';
  var ctEl = document.getElementById('set-comtrade-key');
  if(ctEl) ctEl.value = keys.comtrade||'';
  var pptxEl = document.getElementById('set-pptx-url');
  if(pptxEl) pptxEl.value = keys.pptx_url||'';
  if(keys.pptx_url && typeof PPTX_TEMPLATE_URL!=='undefined') PPTX_TEMPLATE_URL = keys.pptx_url;
}

function saveSettings(){
  DB.settings = Object.assign({}, DB.settings||{}, {
    elektr: parseFloat(document.getElementById('set-elektr').value)||0.03,
    gaz: parseFloat(document.getElementById('set-gaz').value)||0.01,
    suv: parseFloat(document.getElementById('set-suv').value)||0.15,
    yer: parseFloat(document.getElementById('set-yer').value)||0,
    maosh: parseInt(document.getElementById('set-maosh').value)||400,
    minMaosh: parseInt(document.getElementById('set-min-maosh').value)||100,
    soliq: parseInt(document.getElementById('set-soliq').value)||0,
    soliqYil: parseInt(document.getElementById('set-soliq-yil').value)||7,
    dailyLimit: parseInt(document.getElementById('set-daily-limit').value)||50,
    fu1: parseInt(document.getElementById('set-fu1').value)||7,
    fu2: parseInt(document.getElementById('set-fu2').value)||14,
    fu3: parseInt(document.getElementById('set-fu3').value)||21,
    tgToken: document.getElementById('set-tg-token').value.trim(),
    tgChatId: document.getElementById('set-tg-chatid').value.trim()
  });
  // Save settings to Firebase
  if(typeof fbSaveSettings==='function') fbSaveSettings(DB.settings);

  // Save API keys to Firebase (alohida collection)
  var geminiVal = (document.getElementById('set-gemini-key')||{}).value||'';
  var apolloVal = (document.getElementById('set-apollo-key')||{}).value||'';
  if(geminiVal && typeof saveApiKey==='function'){
    saveApiKey('gemini', geminiVal.trim());
    GEMINI_KEY = geminiVal.trim(); // Update runtime key
  }
  if(apolloVal && typeof saveApiKey==='function'){
    saveApiKey('apollo', apolloVal.trim());
  }
  var searatesVal = (document.getElementById('set-searates-key')||{}).value||'';
  if(searatesVal && typeof saveApiKey==='function'){
    saveApiKey('searates', searatesVal.trim());
  }
  var comtradeVal = (document.getElementById('set-comtrade-key')||{}).value||'';
  if(comtradeVal && typeof saveApiKey==='function'){
    saveApiKey('comtrade', comtradeVal.trim());
  }
  // Telegram token va chatId ham apiKeys ga saqlash
  var tgTokenVal = (document.getElementById('set-tg-token')||{}).value||'';
  var tgChatVal = (document.getElementById('set-tg-chatid')||{}).value||'';
  if(tgTokenVal && typeof saveApiKey==='function') saveApiKey('tgToken', tgTokenVal.trim());
  if(tgChatVal && typeof saveApiKey==='function') saveApiKey('tgChatId', tgChatVal.trim());
  // MTProto credentials
  var tgApiId = (document.getElementById('set-tg-apiid')||{}).value||'';
  var tgApiHash = (document.getElementById('set-tg-apihash')||{}).value||'';
  var tgSession = (document.getElementById('set-tg-session')||{}).value||'';
  if(tgApiId && typeof saveApiKey==='function') saveApiKey('tgApiId', tgApiId.trim());
  if(tgApiHash && typeof saveApiKey==='function') saveApiKey('tgApiHash', tgApiHash.trim());
  if(tgSession && typeof saveApiKey==='function') saveApiKey('tgSession', tgSession.trim());
  var pptxUrl = (document.getElementById('set-pptx-url')||{}).value||'';
  if(pptxUrl){
    PPTX_TEMPLATE_URL = pptxUrl.trim();
    _pptxTemplateCache = null; // reset cache
    if(typeof saveApiKey==='function') saveApiKey('pptx_url', pptxUrl.trim());
  }
  toast('✅ Sozlamalar va API kalitlar Firebase ga saqlandi!');
}

