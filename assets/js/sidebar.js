/* Sidebar toggle + hover + mobile (extracted from index.html) */
function closeMobileSidebar(){
  document.querySelector('.sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebarBackdrop')?.classList.remove('show');
  // Reset hamburger icon back to ☰
  var togBtn = document.getElementById('taSidebarToggle');
  if(togBtn){
    var openIcon = togBtn.querySelector('.ta-hamburger-open');
    var closeIcon = togBtn.querySelector('.ta-hamburger-close');
    if(openIcon) openIcon.style.display = 'block';
    if(closeIcon) closeIcon.style.display = 'none';
    togBtn.classList.remove('active');
  }
}
// === Sidebar toggle (hamburger button) ===
document.querySelectorAll('[data-toggle="sidebar"]').forEach(function(btn){
  btn.addEventListener('click', function(){
    var sidebar = document.querySelector('.sidebar');
    if(!sidebar) return;
    if(window.innerWidth < 1200){
      // Mobile: slide in/out
      sidebar.classList.toggle('mobile-open');
      document.getElementById('sidebarBackdrop')?.classList.toggle('show');
    } else {
      // Desktop: collapse/expand
      sidebar.classList.remove('hover-open');
      sidebar.classList.toggle('sidebar-mini');
    }
    updateHamburgerIcon();
  });
});

function updateHamburgerIcon(){
  var sidebar = document.querySelector('.sidebar');
  var togBtn = document.getElementById('taSidebarToggle');
  if(!togBtn || !sidebar) return;
  var openIcon = togBtn.querySelector('.ta-hamburger-open');
  var closeIcon = togBtn.querySelector('.ta-hamburger-close');
  if(!openIcon || !closeIcon) return;
  var isClosed = sidebar.classList.contains('sidebar-mini') && !sidebar.classList.contains('hover-open');
  if(window.innerWidth < 1200) isClosed = !sidebar.classList.contains('mobile-open');
  openIcon.style.display = isClosed ? 'block' : 'none';
  closeIcon.style.display = isClosed ? 'none' : 'block';
  togBtn.classList.toggle('active', !isClosed);
}

// === Desktop: navbar/hover-zone hover opens collapsed sidebar ===
(function(){
  var sidebar = document.querySelector('.sidebar');
  var hoverZone = document.getElementById('sidebarHoverZone');
  var navbar = document.querySelector('.iq-navbar');
  if(!sidebar) return;

  function openSidebar(){
    if(sidebar.classList.contains('sidebar-mini') && window.innerWidth >= 1200){
      sidebar.classList.add('sidebar-force-hover');
    }
  }
  function closeSidebar(){
    if(window.innerWidth >= 1200){
      setTimeout(function(){
        if(!sidebar.matches(':hover') && !(hoverZone && hoverZone.matches(':hover'))){
          sidebar.classList.remove('sidebar-force-hover');
        }
      }, 200);
    }
  }

  // Hover zone (left edge) triggers sidebar
  if(hoverZone){
    hoverZone.addEventListener('mouseenter', openSidebar);
    hoverZone.addEventListener('mouseleave', closeSidebar);
  }
  // Sidebar itself — open on hover, close when mouse leaves
  sidebar.addEventListener('mouseleave', closeSidebar);
  sidebar.addEventListener('mouseenter', function(e){
    if(sidebar.classList.contains('sidebar-mini') && window.innerWidth >= 1200 && e.clientY > 75){
      sidebar.classList.add('sidebar-force-hover');
    }
  });
})();

// Close sidebar when clicking a nav link on mobile
document.querySelectorAll('#sidebar-menu .nav-link:not(.static-item)').forEach(function(link){
  link.addEventListener('click', function(){
    if(window.innerWidth < 1200) closeMobileSidebar();
  });
});
// Loader hide
setTimeout(function(){
  var loader = document.getElementById('loading');
  if(loader) loader.classList.add('d-none');
}, 500);
