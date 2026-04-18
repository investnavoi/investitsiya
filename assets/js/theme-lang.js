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
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.remove('active');
    if(b.textContent.trim().toLowerCase() === l.toLowerCase()) b.classList.add('active');
  });
  // Update Hope UI lang label
  var langLabel = document.getElementById('currentLangLabel');
  if(langLabel) langLabel.textContent = l.toUpperCase();
  localStorage.setItem('_lang', l);
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
