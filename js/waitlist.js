/* Waitlist page: email plus an optional note about your work */
(function () {
  var params = new URLSearchParams(location.search);
  var type = params.get('type') === 'task' ? 'task' : 'job';
  var $ = function (id) { return document.getElementById(id); };

  var list = type === 'task' ? 'tasks.html' : 'jobs.html';
  $('wl-back').href = list; $('wl-more').href = list;
  $('wl-back-label').textContent = type === 'task' ? 'All tasks' : 'All jobs';
  $('wl-more').textContent = type === 'task' ? 'Browse more tasks' : 'Browse more jobs';

  var item = (params.get('item') || '').slice(0, 120);
  // Industry (for jobs) or category (for tasks), used for the Google Form's charts
  function groupOf(name) {
    if (!name) return '';
    if (type === 'job') {
      var job = (window.ABUNDANCE_JOBS || []).filter(function (r) { return r[0] === name; })[0];
      return job ? job[1] : '';
    }
    var g = (window.ABUNDANCE_TASKS || []).filter(function (g) { return g[1].indexOf(name) !== -1; })[0];
    return g ? g[0] : '';
  }

  var email = $('wl-email'), err = $('wl-err');
  email.addEventListener('input', function () { email.removeAttribute('aria-invalid'); err.hidden = true; });
  $('wl-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      email.setAttribute('aria-invalid', 'true'); err.textContent = 'Please enter a valid email address.'; err.hidden = false; email.focus(); return;
    }
    var btn = $('wl-form').querySelector('button[type="submit"]');
    busyButton(btn, true);
    sendForm('waitlist', { email: v, kind: type, group: groupOf(item), item: item, about: $('wl-about').value })
      .then(function () { busyButton(btn, false); $('wl-form').hidden = true; $('wl-done').hidden = false; $('wl-done').focus(); })
      .catch(function () { busyButton(btn, false); err.textContent = 'Sorry, that didn\u2019t send. Please try again in a moment.'; err.hidden = false; });
  });
})();
