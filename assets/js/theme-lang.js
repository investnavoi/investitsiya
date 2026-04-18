/* ═══════════════════════════════════════
   THEME & LANG
═══════════════════════════════════════ */

function toggleTheme(){
  isDark=!isDark;
  document.documentElement.setAttribute('data-bs-theme',isDark?'dark':'light');
  document.documentElement.setAttribute('data-theme',isDark?'dark':'light');
  const tog=document.getElementById('themeToggle');
  if(tog) tog.classList.toggle('dark',isDark);
  localStorage.setItem('theme',isDark?'dark':'light');
}
function setLang(l){
  currentLang = l;
  window.currentLang = l;
  localStorage.setItem('_lang', l);
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.remove('active');
    if(b.textContent.trim().toLowerCase() === l.toLowerCase()) b.classList.add('active');
  });
  var langLabel = document.getElementById('currentLangLabel');
  if(langLabel) langLabel.textContent = l.toUpperCase();
  applyTranslations();
  renderAll();
  renderOverview();
  if(l === 'uz'){
    // Restore Uzbek from cache reverse-lookup (no API call, no reload)
    if(typeof restoreUzbekFromCache === 'function'){
      [100, 800, 2000].forEach(function(delay){
        setTimeout(function(){
          var n = restoreUzbekFromCache();
          if(n) console.log('🌐 UZ tiklash: '+n+' element');
        }, delay);
      });
    }
    return;
  }
  // Auto-translate to RU/EN (Gemini-powered, cached)
  if(typeof autoTranslatePage === 'function'){
    [100, 1500, 4000, 8000].forEach(function(delay){
      setTimeout(function(){ autoTranslatePage(l); }, delay);
    });
  }
}
