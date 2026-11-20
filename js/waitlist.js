/* Waitlist page: shows which job or task, collects an email */
(function () {
  var params = new URLSearchParams(location.search);
  var type = params.get('type') === 'task' ? 'task' : 'job';
  var item = (params.get('item') || '').slice(0, 120);
  var $ = function (id) { return document.getElementById(id); };
  var list = type === 'task' ? 'tasks.html' : 'jobs.html';

  $('wl-back').href = list; $('wl-more').href = list;
  $('wl-back-label').textContent = type === 'task' ? 'All tasks' : 'All jobs';
  $('wl-more').textContent = type === 'task' ? 'Browse more tasks' : 'Browse more jobs';
  $('wl-kind').textContent = type === 'task' ? 'Task waitlist' : 'Job waitlist';
  if (item) { $('wl-title').textContent = item; document.title = 'Waitlist: ' + item + ' - Abundance'; }

  var form = $('wl-form'), email = $('wl-email'), err = $('wl-err');
  email.addEventListener('input', function () { email.removeAttribute('aria-invalid'); err.hidden = true; });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { email.setAttribute('aria-invalid', 'true'); err.hidden = false; email.focus(); return; }
    $('wl-done-text').textContent = 'We’ll email ' + v + ' when ' + (item ? item : 'a spot') + (item ? ' opens up.' : ' opens up.');
    form.hidden = true; $('wl-done').hidden = false; $('wl-done').focus();
  });
})();
