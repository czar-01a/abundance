/* Shared header behavior: Products menu, search bar, mobile menu. */
(function () {
  var header = document.getElementById('site-header');
  if (!header) return;

  var menuToggle = header.querySelector('.menu-toggle');
  var actions = document.getElementById('header-actions');
  var searchToggle = header.querySelector('.search-toggle');
  var searchForm = header.querySelector('.search');
  var searchInput = document.getElementById('site-search');
  var searchClose = searchForm ? searchForm.querySelector('.close') : null;
  var desktop = window.matchMedia('(min-width: 1200px)');

  // Dropdown menus (Products, Resources). Each lines up with its button.
  var menus = [
    { btn: document.getElementById('products-btn'), menu: document.getElementById('products-menu'), max: 900, min: 720 },
    { btn: document.getElementById('resources-btn'), menu: document.getElementById('resources-menu'), max: 680, min: 560 }
  ].filter(function (m) { return m.btn && m.menu; });

  function placeMenu(m) {
    if (!desktop.matches) return;
    var inner = header.querySelector('.header-inner');
    var box = inner.getBoundingClientRect();
    var gutter = parseFloat(getComputedStyle(inner).paddingLeft) || 20;
    var edge = 16; // minimum space to the window edge
    var left = m.btn.getBoundingClientRect().left - box.left;
    var width = Math.min(m.max, box.width - edge - left);
    if (width < m.min) { // not enough room to the right: shift left just enough
      width = Math.min(m.min, box.width - gutter * 2);
      left = Math.max(gutter, box.width - edge - width);
    }
    m.menu.style.setProperty('--mega-left', left + 'px');
    m.menu.style.setProperty('--mega-width', width + 'px');
  }
  window.addEventListener('resize', function () { menus.forEach(placeMenu); });

  function setMenu(m, open) {
    if (open) { menus.forEach(function (o) { if (o !== m) setMenu(o, false); }); placeMenu(m); }
    m.menu.classList.toggle('open', open);
    m.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeMenus() { menus.forEach(function (m) { setMenu(m, false); }); }

  menus.forEach(function (m) {
    m.btn.addEventListener('click', function () { setMenu(m, !m.menu.classList.contains('open')); });
    // Hover zone = the button plus its open panel. A short delay lets the
    // pointer cross the small gap between them.
    var closeTimer = null;
    function cancelClose() { clearTimeout(closeTimer); closeTimer = null; }
    function scheduleClose() { cancelClose(); closeTimer = setTimeout(function () { setMenu(m, false); }, 150); }
    m.cancelClose = cancelClose;
    var panel = m.menu.querySelector('.mega-panel');
    m.btn.addEventListener('mouseenter', function () {
      if (!desktop.matches) return;
      menus.forEach(function (o) { if (o.cancelClose) o.cancelClose(); });
      setMenu(m, true);
    });
    [m.btn, panel].forEach(function (el) {
      el.addEventListener('mouseleave', function () { if (desktop.matches) scheduleClose(); });
    });
    panel.addEventListener('mouseenter', function () { if (desktop.matches) cancelClose(); });
  });
  header.querySelectorAll('.brand, .main-nav a, .header-actions').forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      if (!desktop.matches) return;
      menus.forEach(function (m) { if (m.cancelClose) m.cancelClose(); });
      closeMenus();
    });
  });
  document.addEventListener('click', function (e) {
    if (desktop.matches && !header.contains(e.target)) closeMenus();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    menus.forEach(function (m) {
      if (m.menu.classList.contains('open')) { setMenu(m, false); m.btn.focus(); }
    });
  });

  // Mobile menu
  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      var open = !header.classList.contains('nav-open');
      header.classList.toggle('nav-open', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (!open) closeMenus();
    });
  }

  // Search
  function openSearch() {
    actions.classList.add('search-open');
    closeMenus();
    searchInput.focus();
  }
  function closeSearch() {
    // Fade and shrink out, then hide (skipped when reduced motion is on)
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (searchForm.animate && !reduceMotion && actions.classList.contains('search-open') && !searchForm.dataset.closing) {
      searchForm.dataset.closing = '1';
      searchForm.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 120, easing: 'ease' })
        .onfinish = function () { delete searchForm.dataset.closing; finishClose(); };
      return;
    }
    finishClose();
  }
  function finishClose() {
    actions.classList.remove('search-open');
    if (searchInput.value) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    searchToggle.focus();
  }
  if (searchToggle && searchForm) {
    searchToggle.addEventListener('click', openSearch);
    searchClose.addEventListener('click', closeSearch);
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
    });
    // Open the bar if the page loads with a search term (e.g. jobs.html?q=chef)
    var q = new URLSearchParams(location.search).get('q');
    if (q) {
      searchInput.value = q;
      actions.classList.add('search-open');
    }
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
