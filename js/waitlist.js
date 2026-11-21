/* Waitlist page: email plus an optional note about your work */
(function () {
  var params = new URLSearchParams(location.search);
  var type = params.get('type') === 'task' ? 'task' : 'job';
  var $ = function (id) { return document.getElementById(id); };

  var list = type === 'task' ? 'tasks.html' : 'jobs.html';
  $('wl-back').href = list; $('wl-more').href = list;
  $('wl-back-label').textContent = type === 'task' ? 'All tasks' : 'All jobs';
  $('wl-more').textContent = type === 'task' ? 'Browse more tasks' : 'Browse more jobs';

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
    sendForm('waitlist', { email: v, kind: type, item: (params.get('item') || '').slice(0, 120), about: $('wl-about').value })
      .then(function () { busyButton(btn, false); $('wl-form').hidden = true; $('wl-done').hidden = false; $('wl-done').focus(); })
      .catch(function () { busyButton(btn, false); err.textContent = 'Sorry, that didn\u2019t send. Please try again in a moment.'; err.hidden = false; });
  });
})();
