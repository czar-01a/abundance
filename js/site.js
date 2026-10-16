/* Shared header behavior: Products menu, search bar, mobile menu. */
(function () {
  var header = document.getElementById('site-header');
  if (!header) return;

  var productsBtn = document.getElementById('products-btn');
  var menu = document.getElementById('products-menu');
  var menuToggle = header.querySelector('.menu-toggle');
  var actions = document.getElementById('header-actions');
  var searchToggle = header.querySelector('.search-toggle');
  var searchForm = header.querySelector('.search');
  var searchInput = document.getElementById('site-search');
  var searchClose = searchForm ? searchForm.querySelector('.close') : null;
  var desktop = window.matchMedia('(min-width: 1200px)');

  // Line the menu's left edge up with the Products button, keeping it on screen.
  function placeMenu() {
    if (!menu || !desktop.matches) return;
    var inner = header.querySelector('.header-inner');
    var box = inner.getBoundingClientRect();
    var gutter = parseFloat(getComputedStyle(inner).paddingLeft) || 20;
    var edge = 16; // minimum space to the window edge
    var left = productsBtn.getBoundingClientRect().left - box.left;
    var width = Math.min(900, box.width - edge - left);
    if (width < 720) { // not enough room to the right: shift left just enough
      width = Math.min(720, box.width - gutter * 2);
      left = Math.max(gutter, box.width - edge - width);
    }
    menu.style.setProperty('--mega-left', left + 'px');
    menu.style.setProperty('--mega-width', width + 'px');
  }
  window.addEventListener('resize', placeMenu);

  function setMenu(open) {
    if (!menu) return;
    if (open) placeMenu();
    menu.classList.toggle('open', open);
    productsBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (productsBtn && menu) {
    productsBtn.addEventListener('click', function () {
      setMenu(!menu.classList.contains('open'));
    });
    // Hover zone = the Products button plus the open menu panel.
    // A short delay lets the pointer cross the small gap between them.
    var closeTimer = null;
    function cancelClose() { clearTimeout(closeTimer); closeTimer = null; }
    function scheduleClose() {
      cancelClose();
      closeTimer = setTimeout(function () { setMenu(false); }, 150);
    }
    var panel = menu.querySelector('.mega-panel');
    productsBtn.addEventListener('mouseenter', function () {
      if (!desktop.matches) return;
      cancelClose();
      setMenu(true);
    });
    [productsBtn, panel].forEach(function (el) {
      el.addEventListener('mouseleave', function () {
        if (desktop.matches) scheduleClose();
      });
    });
    panel.addEventListener('mouseenter', function () {
      if (desktop.matches) cancelClose();
    });
    header.querySelectorAll('.brand, .main-nav a, .header-actions').forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        if (!desktop.matches) return;
        cancelClose();
        setMenu(false);
      });
    });
    document.addEventListener('click', function (e) {
      if (desktop.matches && !header.contains(e.target)) setMenu(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (menu && menu.classList.contains('open')) {
      setMenu(false);
      productsBtn.focus();
    }
  });

  // Mobile menu
  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      var open = !header.classList.contains('nav-open');
      header.classList.toggle('nav-open', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (!open) setMenu(false);
    });
  }

  // Search
  function openSearch() {
    actions.classList.add('search-open');
    setMenu(false);
    searchInput.focus();
  }
  function closeSearch() {
    // Fade and shrink out, then hide (skipped when reduced motion is on)
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (searchForm.animate && !reduceMotion && actions.classList.contains('search-open') && !searchForm.dataset.closing) {
      searchForm.dataset.closing = '1';
      searchForm.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 160, easing: 'ease-in' })
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
