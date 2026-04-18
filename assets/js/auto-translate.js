/* ═══════════════════════════════════════════════════════════════════
   AUTO-TRANSLATE via Gemini
   - Scans DOM text nodes after each render
   - Translates UZ → RU/EN in batches
   - Caches in localStorage (instant on revisit)
   - Re-runs after page navigation / dynamic content changes
═══════════════════════════════════════════════════════════════════ */

(function(){
  // Source language (the UI is authored in)
  var SOURCE_LANG = 'uz';
  // Cache key per target lang
  var CACHE_PREFIX = '_autotr_';
  // Max chars per batch (Gemini context limit)
  var BATCH_CHARS = 3000;
  // Don't translate text shorter than this (1 char usually icons/symbols)
  var MIN_LEN = 2;
  // Cyrillic / Latin letter ratio threshold — only translate if text is mostly letters
  var LETTER_RATIO_MIN = 0.3;
  // Skip selectors (inside these, don't translate)
  var SKIP_SELECTORS = 'script,style,code,pre,svg,canvas,.apexcharts-canvas,[data-no-translate],[contenteditable="true"]';
  // Skip if attribute present (already handled by data-i18n system)
  var SKIPPED_ATTR = 'data-i18n';

  // Per-lang in-memory cache
  var memCache = {};

  function loadCache(lang){
    if(memCache[lang]) return memCache[lang];
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + lang);
      memCache[lang] = raw ? JSON.parse(raw) : {};
    } catch(e){ memCache[lang] = {}; }
    return memCache[lang];
  }

  function saveCache(lang){
    try {
      localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(memCache[lang] || {}));
    } catch(e){
      // Cache too big — keep only last 2000 entries
      var c = memCache[lang] || {};
      var keys = Object.keys(c);
      if(keys.length > 2000){
        var trimmed = {};
        keys.slice(-2000).forEach(function(k){ trimmed[k] = c[k]; });
        memCache[lang] = trimmed;
        try { localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(trimmed)); } catch(e2){}
      }
    }
  }

  // Should this text be translated?
  function isTranslatable(text){
    if(!text) return false;
    var t = text.trim();
    if(t.length < MIN_LEN) return false;
    // Skip pure numbers / dates / currency
    if(/^[\d\s.,:;\/\\\-+()$€₽%]+$/.test(t)) return false;
    // Skip emoji-only text
    if(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+$/u.test(t)) return false;
    // Skip if no letters at all (e.g. "12 / 13", "—", "→")
    var letters = (t.match(/[\p{L}]/gu) || []).length;
    if(letters === 0) return false;
    return true;
  }

  // Walk DOM and collect text nodes that need translation
  function collectTextNodes(root){
    var nodes = [];
    if(!root) root = document.body;
    var skipMatcher;
    try { skipMatcher = root.querySelectorAll(SKIP_SELECTORS); } catch(e){ skipMatcher = []; }
    var skipSet = new Set(Array.prototype.slice.call(skipMatcher));

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node){
        if(!node.nodeValue || !isTranslatable(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = node.parentElement;
        if(!p) return NodeFilter.FILTER_REJECT;
        if(p.hasAttribute && p.hasAttribute(SKIPPED_ATTR)) return NodeFilter.FILTER_REJECT;
        // Walk up to check skip ancestors
        var cur = p;
        while(cur && cur !== root){
          if(skipSet.has(cur)) return NodeFilter.FILTER_REJECT;
          cur = cur.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    var n;
    while((n = walker.nextNode())) nodes.push(n);

    // Also collect translatable attributes (placeholder, title, alt, aria-label, value on submit/button)
    var attrEls = root.querySelectorAll('[placeholder],[title],[alt],[aria-label]');
    var attrTargets = [];
    Array.prototype.forEach.call(attrEls, function(el){
      // Skip if inside a skipped ancestor
      var cur = el;
      while(cur && cur !== root){
        if(skipSet.has(cur)) return;
        cur = cur.parentElement;
      }
      ['placeholder','title','alt','aria-label'].forEach(function(attr){
        var v = el.getAttribute(attr);
        if(v && isTranslatable(v)) attrTargets.push({ el: el, attr: attr, value: v });
      });
    });

    return { textNodes: nodes, attrNodes: attrTargets };
  }

  // Apply cached translation to a node (text or attribute target)
  function applyCachedToNode(target, cache, isAttr){
    var orig = isAttr ? target.value : target.nodeValue;
    var key = orig.trim();
    var hit = cache[key];
    if(!hit) return false;
    // Preserve leading/trailing whitespace
    var leading = (orig.match(/^\s*/) || [''])[0];
    var trailing = (orig.match(/\s*$/) || [''])[0];
    var newVal = leading + hit + trailing;
    if(isAttr){
      target.el.setAttribute(target.attr, newVal);
      target.value = newVal;
    } else {
      // Stash original on first translation so we can restore when switching back to source
      if(!target.__origUz) target.__origUz = orig;
      target.nodeValue = newVal;
    }
    return true;
  }

  function restoreOriginal(node, isAttr){
    if(isAttr){
      // For attrs we don't keep an original — just leave as-is (next translate call will re-cache)
      return;
    }
    if(node.__origUz != null){
      node.nodeValue = node.__origUz;
    }
  }

  // Build batches under BATCH_CHARS each
  function buildBatches(items){
    var batches = [];
    var cur = [];
    var curLen = 0;
    items.forEach(function(s){
      var len = s.length + 4;
      if(curLen + len > BATCH_CHARS && cur.length){
        batches.push(cur);
        cur = [];
        curLen = 0;
      }
      cur.push(s);
      curLen += len;
    });
    if(cur.length) batches.push(cur);
    return batches;
  }

  // Translate a batch via Gemini, return map { orig: translated }
  async function translateBatch(strings, targetLang){
    if(typeof callGemini !== 'function' || typeof getGeminiKey !== 'function') {
      console.warn('Auto-translate: Gemini not available');
      return {};
    }
    if(!getGeminiKey()){
      console.warn('Auto-translate: Gemini API kalit yo\'q');
      return {};
    }
    var langName = { ru: 'Russian', en: 'English', uz: 'Uzbek (Latin)' }[targetLang] || targetLang;
    var prompt = 'Translate the following Uzbek UI strings to ' + langName + '. ' +
                 'Return ONLY a valid JSON object (no markdown, no explanation) mapping each input string EXACTLY to its translation. ' +
                 'Preserve emojis, numbers, punctuation, and HTML entities. ' +
                 'Keep keys identical to inputs.\n\n' +
                 'Input strings (JSON array):\n' + JSON.stringify(strings);
    var body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    };
    try {
      var data = await callGemini(body);
      var raw = (typeof geminiText === 'function') ? geminiText(data) : '';
      if(!raw) return {};
      // Strip markdown fences
      raw = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      var json = raw.match(/\{[\s\S]*\}/);
      if(!json) return {};
      var parsed;
      try { parsed = JSON.parse(json[0]); }
      catch(e){
        if(typeof safeParseJSON === 'function'){ parsed = safeParseJSON(json[0]); }
        else throw e;
      }
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch(e){
      console.error('Auto-translate batch error:', e);
      return {};
    }
  }

  // Public: translate page to targetLang
  var _running = false;
  var _pendingLang = null;
  var _failCount = 0;
  var _disabled = false;
  async function autoTranslatePage(targetLang){
    if(_disabled){ console.warn('Auto-translate: disabled (too many failures)'); return; }
    if(!targetLang || targetLang === SOURCE_LANG){
      // Restore originals
      var collected = collectTextNodes(document.body);
      collected.textNodes.forEach(function(n){ restoreOriginal(n); });
      return;
    }
    if(_running){ _pendingLang = targetLang; return; }
    _running = true;
    try {
      var cache = loadCache(targetLang);
      var collected = collectTextNodes(document.body);
      var allTargets = [];
      collected.textNodes.forEach(function(n){ allTargets.push({ kind: 'text', node: n, key: (n.nodeValue || '').trim() }); });
      collected.attrNodes.forEach(function(t){ allTargets.push({ kind: 'attr', target: t, key: t.value.trim() }); });

      // Apply cache hits immediately, collect misses
      var missing = {};
      allTargets.forEach(function(t){
        if(!t.key) return;
        if(cache[t.key]){
          if(t.kind === 'text') applyCachedToNode(t.node, cache, false);
          else applyCachedToNode(t.target, cache, true);
        } else {
          missing[t.key] = true;
        }
      });
      var missList = Object.keys(missing);

      if(missList.length){
        var batches = buildBatches(missList);
        for(var i = 0; i < batches.length; i++){
          var result = await translateBatch(batches[i], targetLang);
          if(!result || !Object.keys(result).length){
            _failCount++;
            if(_failCount >= 8){
              _disabled = true;
              console.error('Auto-translate: 8 marta xato — vaqtincha o\'chirildi. Console: enableAutoTranslate() qilib qayta yoqing.');
              return;
            }
          } else {
            _failCount = 0;
          }
          // Merge into cache
          Object.keys(result).forEach(function(k){
            if(typeof result[k] === 'string') cache[k] = result[k];
          });
          // Apply to DOM after each batch (progressive)
          allTargets.forEach(function(t){
            if(t.key && cache[t.key]){
              if(t.kind === 'text') applyCachedToNode(t.node, cache, false);
              else applyCachedToNode(t.target, cache, true);
            }
          });
        }
        saveCache(targetLang);
        console.log('🌐 Auto-translate ('+targetLang+'): '+missList.length+' yangi, jami keshda '+Object.keys(cache).length);
      }
    } finally {
      _running = false;
      if(_pendingLang){
        var next = _pendingLang;
        _pendingLang = null;
        autoTranslatePage(next);
      }
    }
  }

  // Debounced re-translate after dynamic content changes
  var _retranslateTimer = null;
  function scheduleRetranslate(delay){
    if(_retranslateTimer) clearTimeout(_retranslateTimer);
    _retranslateTimer = setTimeout(function(){
      _retranslateTimer = null;
      var lang = window.currentLang;
      if(lang && lang !== SOURCE_LANG) autoTranslatePage(lang);
    }, delay || 1500);
  }

  // Smart DOM watcher — long debounce (1.5s), ignore chart/map noise
  function watchDom(){
    // Hook into showPage — translate after page render
    if(typeof window.showPage === 'function' && !window._showPageTranslateHooked){
      window._showPageTranslateHooked = true;
      var origShowPage = window.showPage;
      window.showPage = function(){
        var r = origShowPage.apply(this, arguments);
        scheduleRetranslate(800);
        return r;
      };
    }
    // Watch for new TEXT (not chart/map redraws)
    var observer = new MutationObserver(function(mutations){
      for(var i = 0; i < mutations.length; i++){
        var m = mutations[i];
        if(!m.addedNodes || !m.addedNodes.length) continue;
        for(var j = 0; j < m.addedNodes.length; j++){
          var node = m.addedNodes[j];
          if(node.nodeType !== 1) continue;
          // Skip if added inside chart/map/svg
          if(node.closest && node.closest('.apexcharts-canvas, svg, canvas, .jvm-container')) continue;
          // Skip text-less nodes
          var text = (node.textContent || '').trim();
          if(text.length < 3) continue;
          scheduleRetranslate(1500);
          return;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Expose globals
  window.autoTranslatePage = autoTranslatePage;
  window.scheduleRetranslate = scheduleRetranslate;
  window.enableAutoTranslate = function(){ _disabled = false; _failCount = 0; console.log('🌐 Auto-translate qayta yoqildi'); };
  // Force re-scan and translate everything (manual)
  window.forceTranslateAll = function(){
    _disabled = false; _failCount = 0;
    var lang = window.currentLang;
    if(lang && lang !== SOURCE_LANG){
      console.log('🌐 Force translate boshlandi:', lang);
      autoTranslatePage(lang);
    }
  };
  // Show status
  window.autoTranslateStatus = function(){
    var lang = window.currentLang;
    var cache = lang && lang !== SOURCE_LANG ? loadCache(lang) : {};
    console.log('🌐 Auto-translate status:', { lang: lang, disabled: _disabled, failCount: _failCount, running: _running, cacheSize: Object.keys(cache).length });
  };
  window.clearAutoTranslateCache = function(lang){
    if(lang){ memCache[lang] = {}; localStorage.removeItem(CACHE_PREFIX + lang); }
    else { memCache = {}; ['ru','en'].forEach(function(l){ localStorage.removeItem(CACHE_PREFIX + l); }); }
    console.log('🌐 Auto-translate cache tozalandi:', lang || 'all');
  };

  // Wire up: watch DOM after page loads
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', watchDom);
  } else {
    watchDom();
  }
})();
