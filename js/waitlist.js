/* Waitlist page: email plus an optional note about your work */
(function () {
  var params = new URLSearchParams(location.search);
  var type = params.get('type') === 'task' ? 'task' : 'job';
  var picked = (params.get('item') || '').slice(0, 120);
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
    $('wl-done-text').textContent = 'We’ll email ' + v + ' when ' + (picked || 'a spot') + ' opens up.';
    $('wl-form').hidden = true; $('wl-done').hidden = false; $('wl-done').focus();
  });
})();
