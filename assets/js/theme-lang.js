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
  var prevLang = window.currentLang || 'uz';
  currentLang = l;
  window.currentLang = l;
  localStorage.setItem('_lang', l);
  // Switching to source (uz) — re-render dynamic DOM gets messy with cached translations.
  // Simplest reliable behavior: full reload.
  if(l === 'uz' && prevLang !== 'uz'){
    location.reload();
    return;
  }
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.remove('active');
    if(b.textContent.trim().toLowerCase() === l.toLowerCase()) b.classList.add('active');
  });
  var langLabel = document.getElementById('currentLangLabel');
  if(langLabel) langLabel.textContent = l.toUpperCase();
  applyTranslations();
  renderAll();
  renderOverview();
  // Auto-translate everything else (Gemini-powered, cached).
  // Run in waves to catch late-rendered Firebase data, modals, charts.
  if(typeof autoTranslatePage === 'function'){
    [100, 1500, 4000, 8000].forEach(function(delay){
      setTimeout(function(){ autoTranslatePage(l); }, delay);
    });
  }
}
