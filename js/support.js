/* Support page: pick a topic, Submit, and see the right way to get help */
(function () {
  var MAIL = 'hello@abundancephysical.com';
  var TOPICS = {
    sales: ['Order a dataset', 'Spec your dataset in the demo, or email our team to talk it through.', [['Spec your dataset', 'demo.html'], ['Email sales', 'Sales inquiry']]],
    order: ['Check on an order', 'Email us with the name of your dataset and we’ll follow up on its status.', [['Email us', 'Order question']]],
    record: ['Recording a task', 'Browse the tasks you can record, or email us if something isn’t working.', [['Browse tasks', 'tasks.html'], ['Email us', 'Recording help']]],
    jobs: ['Jobs and applications', 'See open jobs, or email us about an application you’ve sent.', [['Browse jobs', 'jobs.html'], ['Email us', 'Job application']]],
    account: ['Account and login', 'Email us from the address on your account and tell us what’s happening.', [['Email us', 'Account help']]],
    privacy: ['Privacy and data requests', 'Email us to ask about, access, or delete data connected to you.', [['Email us', 'Privacy request']]],
    other: ['Something else', 'Email us and tell us what you need.', [['Email us', 'Support']]]
  };
  var form = document.getElementById('sup-form'), err = document.getElementById('sup-err');
  var ans = document.getElementById('sup-answer'), acts = document.getElementById('sup-actions');
  form.addEventListener('change', function () { err.hidden = true; });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var picked = form.querySelector('input[name="topic"]:checked');
    if (!picked) { err.hidden = false; form.querySelector('input[name="topic"]').focus(); return; }
    var t = TOPICS[picked.value];
    document.getElementById('sup-title').textContent = t[0];
    document.getElementById('sup-text').textContent = t[1];
    acts.textContent = '';
    t[2].forEach(function (a, i) {
      var link = document.createElement('a');
      link.className = 'btn btn-lg ' + (i === 0 ? 'btn-primary' : 'btn-outline');
      link.textContent = a[0];
      link.href = /\.html$/.test(a[1]) ? a[1] : 'mailto:' + MAIL + '?subject=' + encodeURIComponent(a[1]);
      acts.appendChild(link);
    });
    form.hidden = true; ans.hidden = false; ans.focus();
  });
  document.getElementById('sup-back').addEventListener('click', function () {
    ans.hidden = true; form.hidden = false;
    var picked = form.querySelector('input[name="topic"]:checked');
    (picked || form.querySelector('input[name="topic"]')).focus();
  });
})();
