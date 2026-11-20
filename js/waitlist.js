/* Waitlist page: email, industry, and the job or task (pre-filled from the card that was clicked) */
(function () {
  var params = new URLSearchParams(location.search);
  var type = params.get('type') === 'task' ? 'task' : 'job';
  var picked = (params.get('item') || '').slice(0, 120);
  var $ = function (id) { return document.getElementById(id); };
  var INDUSTRIES = ['Factory', '3D Printer', 'Energy', 'Build', 'Intelligence', 'Home', 'Food', 'Sports', 'Research', 'Medicine', 'Beyond'];
  var JOBS = (window.ABUNDANCE_JOBS || []).map(function (r) { return { title: r[0], industry: r[1] }; });
  var TASKS = window.ABUNDANCE_TASKS || [];
  var OTHER = '__other';

  var list = type === 'task' ? 'tasks.html' : 'jobs.html';
  $('wl-back').href = list; $('wl-more').href = list;
  $('wl-back-label').textContent = type === 'task' ? 'All tasks' : 'All jobs';
  $('wl-more').textContent = type === 'task' ? 'Browse more tasks' : 'Browse more jobs';
  $('wl-item-label').textContent = type === 'task' ? 'Task' : 'Job';
  $('wl-item-other').placeholder = type === 'task' ? 'Name the task' : 'Name the job';
  $('wl-item-other').setAttribute('aria-label', $('wl-item-other').placeholder);

  var ind = $('wl-ind'), item = $('wl-item'), indOther = $('wl-ind-other'), itemOther = $('wl-item-other');
  var err = $('wl-err'), email = $('wl-email');

  function opt(parent, value, text, disabled) {
    var o = document.createElement('option'); o.value = value; o.textContent = text;
    if (disabled) { o.disabled = true; o.hidden = true; o.selected = true; }
    parent.appendChild(o); return o;
  }
  function group(label) { var g = document.createElement('optgroup'); g.label = label; return g; }
  function syncEmpty(sel) { sel.classList.toggle('empty', !sel.value); }

  // Industry list
  opt(ind, '', 'Choose an industry', true);
  INDUSTRIES.forEach(function (n) { opt(ind, n, n); });
  opt(ind, OTHER, 'Other');

  // Job or task list. Jobs follow the chosen industry; tasks are grouped by category.
  function fillItems(keep) {
    var cur = keep !== undefined ? keep : item.value;
    item.textContent = '';
    opt(item, '', type === 'task' ? 'Choose a task' : 'Choose a job', true);
    if (type === 'task') {
      TASKS.forEach(function (g) { var og = group(g[0]); g[1].forEach(function (t) { opt(og, t, t); }); item.appendChild(og); });
    } else {
      var i = ind.value;
      if (i && i !== OTHER) {
        JOBS.filter(function (j) { return j.industry === i; }).forEach(function (j) { opt(item, j.title, j.title); });
      } else {
        INDUSTRIES.forEach(function (n) {
          var og = group(n);
          JOBS.filter(function (j) { return j.industry === n; }).forEach(function (j) { opt(og, j.title, j.title); });
          item.appendChild(og);
        });
      }
    }
    opt(item, OTHER, 'Other');
    var has = Array.prototype.some.call(item.options, function (o) { return o.value === cur && !o.disabled; });
    if (has) item.value = cur; else item.selectedIndex = 0;
    syncEmpty(item); syncOther();
  }
  function syncOther() {
    indOther.hidden = ind.value !== OTHER;
    itemOther.hidden = item.value !== OTHER;
  }

  // Pre-fill from the card that was clicked
  var startItem = '';
  if (type === 'job') {
    var job = JOBS.filter(function (j) { return j.title === picked; })[0];
    if (job) { ind.value = job.industry; startItem = job.title; }
  } else if (TASKS.some(function (g) { return g[1].indexOf(picked) !== -1; })) {
    startItem = picked;
  }
  if (!ind.value || (type === 'task' && !picked)) ind.selectedIndex = ind.value ? ind.selectedIndex : 0;
  syncEmpty(ind);
  fillItems(startItem);

  function clearErr(el) { el.removeAttribute('aria-invalid'); err.hidden = true; }
  ind.addEventListener('change', function () {
    clearErr(ind); syncEmpty(ind);
    if (type === 'job') fillItems(); else syncOther();
    if (ind.value === OTHER) indOther.focus();
  });
  item.addEventListener('change', function () { clearErr(item); syncEmpty(item); syncOther(); if (item.value === OTHER) itemOther.focus(); });
  [email, indOther, itemOther].forEach(function (el) { el.addEventListener('input', function () { clearErr(el); }); });

  $('wl-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var checks = [
      [email, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), 'Please enter a valid email address.'],
      [ind, !ind.value, 'Please choose an industry.'],
      [indOther, ind.value === OTHER && !indOther.value.trim(), 'Please name your industry.'],
      [item, !item.value, type === 'task' ? 'Please choose a task.' : 'Please choose a job.'],
      [itemOther, item.value === OTHER && !itemOther.value.trim(), type === 'task' ? 'Please name the task.' : 'Please name the job.']
    ];
    for (var i = 0; i < checks.length; i++) {
      if (checks[i][1]) { checks[i][0].setAttribute('aria-invalid', 'true'); err.textContent = checks[i][2]; err.hidden = false; checks[i][0].focus(); return; }
    }
    var what = item.value === OTHER ? itemOther.value.trim() : item.value;
    $('wl-done-text').textContent = 'We’ll email ' + email.value.trim() + ' when ' + what + ' opens up.';
    $('wl-form').hidden = true; $('wl-done').hidden = false; $('wl-done').focus();
  });
})();
