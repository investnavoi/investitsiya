/* ═══════════════════════════════════════════════════════════════════════
   GLOBAL ERROR HANDLER (Xatolarni ushlagich)
   ───────────────────────────────────────────────────────────────────────
   Maqsad: bitta ushlanmagan xato butun ilovani buzmasligi kerak.
   Bu fayl ENG BIRINCHI yuklanadi (boshqa skriptlardan oldin).

   Nimani qiladi:
     1) window 'error'           — sinxron runtime xatolarini ushlaydi
     2) window 'unhandledrejection' — Promise/await xatolarini ushlaydi
     3) safeAsync()              — API chaqiruvlarini xavfsiz o'rash uchun
     4) safe()                   — har qanday funksiyani xavfsiz chaqirish
   Foydalanuvchiga muloyim toast ko'rsatadi, console'ga to'liq log yozadi.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  // Bir xil xato spam bo'lmasligi uchun rate-limit (3 soniya)
  var _lastErrShown = 0;
  var _lastErrMsg = '';
  var _ERR_COOLDOWN = 3000;

  // Toast ko'rsatish (mavjud bo'lsa global toast, aks holda minimal fallback)
  function _showErrorToast(msg){
    var now = Date.now();
    // Bir xil xabarni qayta-qayta ko'rsatmaymiz
    if(msg === _lastErrMsg && (now - _lastErrShown) < _ERR_COOLDOWN) return;
    _lastErrShown = now;
    _lastErrMsg = msg;
    try {
      if(typeof window.toast === 'function'){
        window.toast(msg, 'error');
        return;
      }
    } catch(_e){}
    // Fallback: minimal toast (toast funksiyasi hali yuklanmagan bo'lsa)
    try {
      var el = document.createElement('div');
      el.textContent = msg;
      el.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);' +
        'background:#ef233c;color:#fff;padding:10px 18px;border-radius:10px;z-index:999999;' +
        'font-size:13px;font-family:system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:90vw';
      document.body.appendChild(el);
      setTimeout(function(){ try{ document.body.removeChild(el); }catch(_e){} }, 4000);
    } catch(_e){}
  }

  // Xato xabarini foydalanuvchi tushunadigan matnga aylantirish
  function _humanizeError(err){
    var raw = (err && (err.message || err.reason || err)) || '';
    raw = String(raw);
    if(/network|fetch|failed to fetch|load failed|networkerror/i.test(raw)){
      return '🌐 Internet/server bilan aloqa uzildi. Qayta urinib ko\'ring.';
    }
    if(/timeout|timed out/i.test(raw)){
      return '⏱ So\'rov javob bermadi (timeout). Keyinroq urinib ko\'ring.';
    }
    if(/quota|rate limit|429|too many/i.test(raw)){
      return '⚠️ So\'rovlar limiti tugadi. Bir ozdan keyin urinib ko\'ring.';
    }
    if(/api key|unauthorized|401|403|forbidden/i.test(raw)){
      return '🔑 API kalit bilan muammo. Sozlamalarni tekshiring.';
    }
    if(/qutted|permission|firebase|firestore/i.test(raw)){
      return '💾 Ma\'lumotlar bazasi bilan muammo yuz berdi.';
    }
    // Umumiy xato — texnik tafsilotni qisqartirib ko'rsatamiz
    return '⚠️ Xatolik yuz berdi. Sahifa ishlashda davom etmoqda.';
  }

  // ── 1) Sinxron runtime xatolari ──
  window.addEventListener('error', function(e){
    // Resurs yuklanish xatolari (img/script/link) — toast ko'rsatmaymiz, faqat log
    if(e && e.target && e.target !== window && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')){
      console.warn('[resource-error]', e.target.src || e.target.href || e.target);
      return;
    }
    var err = e && (e.error || e.message);
    console.error('[global-error]', err, e && e.filename, e && e.lineno);
    _showErrorToast(_humanizeError(err));
    // preventDefault QILMAYMIZ — console'da xato ko'rinib tursin (debug uchun)
  });

  // ── 2) Promise/await xatolari (eng ko'p uchraydigan crash sababi) ──
  window.addEventListener('unhandledrejection', function(e){
    var reason = e && e.reason;
    console.error('[unhandled-promise]', reason);
    _showErrorToast(_humanizeError(reason));
    // Bu xatoni "ushlangan" deb belgilaymiz — sahifa buzilmasin
    if(e && typeof e.preventDefault === 'function') e.preventDefault();
  });

  // ── 3) Async funksiyani xavfsiz o'rash ──
  // Foydalanish: var data = await safeAsync(() => fetchSomething(), {fallback: null, label: 'Apollo'});
  window.safeAsync = async function(fn, opts){
    opts = opts || {};
    try {
      return await fn();
    } catch(err){
      console.error('[safeAsync' + (opts.label ? ':' + opts.label : '') + ']', err);
      if(opts.silent !== true){
        _showErrorToast(opts.message || _humanizeError(err));
      }
      return ('fallback' in opts) ? opts.fallback : null;
    }
  };

  // ── 4) Sinxron funksiyani xavfsiz chaqirish ──
  // Foydalanish: safe(() => riskyThing(), null);
  window.safe = function(fn, fallback){
    try {
      return fn();
    } catch(err){
      console.error('[safe]', err);
      return (fallback !== undefined) ? fallback : null;
    }
  };

  // Boshqa modullar foydalanishi uchun
  window._humanizeError = _humanizeError;

  console.log('[error-handler] Global xato ushlagich faollashtirildi ✓');
})();
