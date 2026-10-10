/* Jobs page: tabs, filters, search, sorting, pagination, saved jobs. */
(function () {
  var PRODUCTS = [
    { name: 'Factory', cat: 'industrial' }, { name: '3D Printer', cat: 'industrial' },
    { name: 'Energy', cat: 'infrastructure' }, { name: 'Build', cat: 'infrastructure' },
    { name: 'Home', cat: 'consumer' }, { name: 'Food', cat: 'consumer' }, { name: 'Sports', cat: 'consumer' },
    { name: 'Research', cat: 'frontier' }, { name: 'Medicine', cat: 'frontier' }, { name: 'Beyond', cat: 'frontier' }
  ];
  var CATS = [
    { id: 'all', label: 'All' },
    { id: 'industrial', label: 'Industrial & Manufacturing' },
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'consumer', label: 'Consumer' },
    { id: 'frontier', label: 'Frontier' }
  ];
  var MODES = ['Remote', 'On-site'];
  var KINDS = ['Full-time', 'Part-time', 'Contract', 'Flexible'];
  var ACTIONS = ['Apply', 'Reserve'];
  var PER_PAGE = 12;

  var catOf = {};
  PRODUCTS.forEach(function (p) { catOf[p.name] = p.cat; });

  // Industrial & Manufacturing jobs (and the Line Cook demo) use "Apply"; everything else uses "Reserve".
  function actionOf(job) {
    return catOf[job.product] === 'industrial' || job.title === 'Line Cook' ? 'Apply' : 'Reserve';
  }

  var JOBS = (window.ABUNDANCE_JOBS || []).map(function (r, i) {
    return { id: i, title: r[0], product: r[1], mode: r[2], kind: r[3], lo: r[4], hi: r[5] };
  });

  // ---------- State ----------
  var params = new URLSearchParams(location.search);
  var state = {
    cat: CATS.some(function (c) { return c.id === params.get('cat'); }) ? params.get('cat') : 'all',
    products: [],
    modes: [],
    kinds: [],
    actions: [],
    sort: 'featured',
    query: params.get('q') || '',
    page: 0,
    filtersOpen: window.matchMedia('(min-width: 1025px)').matches
  };
  var requested = params.get('product');
  if (requested && catOf[requested]) {
    state.products = [requested];
    state.cat = catOf[requested];
  }

  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('abundance-saved-jobs') || '[]'); } catch (e) { saved = []; }
  function persistSaved() {
    try { localStorage.setItem('abundance-saved-jobs', JSON.stringify(saved)); } catch (e) { /* storage unavailable */ }
  }

  // ---------- Elements ----------
  var $ = function (id) { return document.getElementById(id); };
  var tabsEl = $('tabs');
  var titleEl = $('jobs-title');
  var crumbSep = $('crumb-sep');
  var crumbCat = $('crumb-cat');
  var resultsEl = $('results');
  var grid = $('job-grid');
  var emptyEl = $('empty');
  var pager = $('pager');
  var pageLabel = $('page-label');
  var prevBtn = $('prev');
  var nextBtn = $('next');
  var listing = $('listing');
  var filterToggle = $('filter-toggle');
  var filterLabel = $('filter-label');
  var appliedEl = $('applied');
  var appliedChips = $('applied-chips');
  var searchInput = document.getElementById('site-search');

  // ---------- Helpers ----------
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(markup) {
    var t = document.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstChild;
  }
  var HEART = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.3 8.4 3 5 6.4 5c2 0 3.5 1.1 4.3 2.6h2.6C14.1 6.1 15.6 5 17.6 5 21 5 22.7 8.4 21.2 11.4 19 15.6 12 20 12 20z"></path></svg>';
  var ARROW = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7"></path><path d="M8 7h9v9"></path></svg>';
  var X = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>';

  function toggleIn(list, value) {
    var i = list.indexOf(value);
    if (i === -1) list.push(value); else list.splice(i, 1);
  }
  function catLabel(id) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].label;
    return '';
  }
  function countWhere(fn) { return JOBS.filter(fn).length; }

  function filtered() {
    var q = state.query.trim().toLowerCase();
    var list = JOBS.filter(function (j) {
      return (state.cat === 'all' || catOf[j.product] === state.cat) &&
        (!state.products.length || state.products.indexOf(j.product) !== -1) &&
        (!state.modes.length || state.modes.indexOf(j.mode) !== -1) &&
        (!state.kinds.length || state.kinds.indexOf(j.kind) !== -1) &&
        (!state.actions.length || state.actions.indexOf(actionOf(j)) !== -1) &&
        (!q || (j.title + ' ' + j.product).toLowerCase().indexOf(q) !== -1);
    });
    if (state.sort === 'high') list = list.slice().sort(function (a, b) { return b.hi - a.hi; });
    if (state.sort === 'low') list = list.slice().sort(function (a, b) { return a.lo - b.lo; });
    return list;
  }

  // ---------- Filter checkboxes ----------
  function renderChecks(container, key, values, count) {
    container.innerHTML = '';
    values.forEach(function (v) {
      var label = el('label', 'opt');
      var input = el('input');
      input.type = 'checkbox';
      input.value = v;
      input.checked = state[key].indexOf(v) !== -1;
      input.addEventListener('change', function () {
        toggleIn(state[key], v);
        state.page = 0;
        render();
      });
      label.appendChild(input);
      label.appendChild(el('span', 'label', v));
      label.appendChild(el('span', 'count', String(count(v))));
      container.appendChild(label);
    });
  }

  function renderFilters() {
    var visibleProducts = PRODUCTS.filter(function (p) { return state.cat === 'all' || p.cat === state.cat; })
      .map(function (p) { return p.name; });
    renderChecks($('f-products'), 'products', visibleProducts, function (v) { return countWhere(function (j) { return j.product === v; }); });
    renderChecks($('f-modes'), 'modes', MODES, function (v) { return countWhere(function (j) { return j.mode === v; }); });
    renderChecks($('f-kinds'), 'kinds', KINDS, function (v) { return countWhere(function (j) { return j.kind === v; }); });
    renderChecks($('f-actions'), 'actions', ACTIONS, function (v) { return countWhere(function (j) { return actionOf(j) === v; }); });
    document.querySelectorAll('input[name="sort"]').forEach(function (r) { r.checked = r.value === state.sort; });
  }

  function appliedList() {
    var out = [];
    if (state.cat !== 'all') out.push({ label: catLabel(state.cat), remove: function () { state.cat = 'all'; state.products = []; } });
    ['products', 'modes', 'kinds', 'actions'].forEach(function (key) {
      state[key].forEach(function (v) { out.push({ label: v, remove: function () { toggleIn(state[key], v); } }); });
    });
    return out;
  }

  function renderApplied(list) {
    appliedEl.hidden = list.length === 0;
    appliedChips.innerHTML = '';
    list.forEach(function (item) {
      var b = el('button', 'chip-x');
      b.type = 'button';
      b.setAttribute('aria-label', 'Remove filter: ' + item.label);
      b.appendChild(el('span', null, item.label));
      b.appendChild(svg(X));
      b.addEventListener('click', function () { item.remove(); state.page = 0; render(); });
      appliedChips.appendChild(b);
    });
  }

  // ---------- Tabs ----------
  function renderTabs() {
    tabsEl.innerHTML = '';
    CATS.forEach(function (c) {
      var b = el('button', 'tab', c.label);
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', state.cat === c.id ? 'true' : 'false');
      b.addEventListener('click', function () {
        state.cat = c.id;
        state.products = [];
        state.page = 0;
        render();
      });
      tabsEl.appendChild(b);
    });
  }

  // ---------- Cards ----------
  function card(job) {
    var action = actionOf(job);
    var art = el('article', 'job');

    var cover = el('a', 'cover');
    cover.href = 'signup.html';
    cover.setAttribute('aria-label', action + ' ' + job.title);
    art.appendChild(cover);

    var top = el('div', 'top');
    top.appendChild(el('span', 'product', 'Abundance ' + job.product));
    var save = el('button', 'save');
    save.type = 'button';
    var isSaved = saved.indexOf(job.title) !== -1;
    save.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
    save.setAttribute('aria-label', (isSaved ? 'Unsave ' : 'Save ') + job.title);
    save.appendChild(svg(HEART));
    save.addEventListener('click', function () {
      toggleIn(saved, job.title);
      persistSaved();
      var now = saved.indexOf(job.title) !== -1;
      save.setAttribute('aria-pressed', now ? 'true' : 'false');
      save.setAttribute('aria-label', (now ? 'Unsave ' : 'Save ') + job.title);
    });
    top.appendChild(save);
    art.appendChild(top);

    art.appendChild(el('h3', 'title', job.title));
    art.appendChild(el('div', 'meta', job.mode + ' · ' + job.kind));

    var bottom = el('div', 'bottom');
    bottom.appendChild(el('span', 'pay', '$' + job.lo + '–$' + job.hi + '/hr'));
    var act = el('span', 'action', action);
    act.appendChild(svg(ARROW));
    bottom.appendChild(act);
    art.appendChild(bottom);
    return art;
  }

  // ---------- Render ----------
  function render() {
    var list = filtered();
    var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (state.page > pages - 1) state.page = pages - 1;
    var slice = list.slice(state.page * PER_PAGE, state.page * PER_PAGE + PER_PAGE);

    var label = catLabel(state.cat);
    titleEl.textContent = state.cat === 'all' ? 'All jobs' : label + ' jobs';
    crumbSep.hidden = crumbCat.hidden = state.cat === 'all';
    crumbCat.textContent = label;

    renderTabs();
    renderFilters();
    var applied = appliedList();
    renderApplied(applied);

    resultsEl.textContent = list.length + (list.length === 1 ? ' result' : ' results');
    filterLabel.textContent = (state.filtersOpen ? 'Hide filters' : 'Show filters') + (applied.length ? ' (' + applied.length + ')' : '');
    filterToggle.setAttribute('aria-expanded', state.filtersOpen ? 'true' : 'false');
    listing.classList.toggle('filters-hidden', !state.filtersOpen);

    grid.innerHTML = '';
    slice.forEach(function (j) { grid.appendChild(card(j)); });
    emptyEl.hidden = list.length !== 0;

    pager.hidden = pages <= 1;
    pageLabel.textContent = 'Page ' + (state.page + 1) + ' of ' + pages;
    prevBtn.disabled = state.page === 0;
    nextBtn.disabled = state.page >= pages - 1;
  }

  // ---------- Events ----------
  filterToggle.addEventListener('click', function () {
    state.filtersOpen = !state.filtersOpen;
    render();
  });
  document.querySelectorAll('input[name="sort"]').forEach(function (r) {
    r.addEventListener('change', function () { state.sort = r.value; state.page = 0; render(); });
  });
  document.querySelectorAll('[data-clear]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.cat = 'all'; state.products = []; state.modes = []; state.kinds = []; state.actions = []; state.page = 0;
      render();
    });
  });
  function goToPage(n) {
    state.page = n;
    render();
    titleEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  prevBtn.addEventListener('click', function () { goToPage(Math.max(0, state.page - 1)); });
  nextBtn.addEventListener('click', function () { goToPage(state.page + 1); });

  // Header search filters this page live instead of navigating.
  if (searchInput) {
    var form = searchInput.form;
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    searchInput.addEventListener('input', function () {
      state.query = searchInput.value;
      state.page = 0;
      render();
    });
  }

  render();
})();
