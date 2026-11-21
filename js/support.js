/* Support page: pick a topic, Submit, then fill in your details and Send */
(function () {
  // Topic label and a hint for the message box
  var TOPICS = {
    sales: ['Order a dataset', 'What do you need? Task, robot, volume, timeline'],
    order: ['Check on an order', 'Which dataset is it about?'],
    record: ['Recording a task', 'Which task, and what happened?'],
    jobs: ['Jobs and applications', 'Which job is it about?'],
    account: ['Account and login', 'What’s happening with your account?'],
    privacy: ['Privacy and data requests', 'What would you like us to do with your data?'],
    other: ['Others', 'Tell us what you need']
  };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('sup-form'), err = $('sup-err'), details = $('sup-details'), sent = $('sup-sent');
  var otherWrap = $('sup-other-wrap'), other = $('sup-other');
  var picked = null;
  // Bring the card into view below the sticky header after each step
  function reveal(el) {
    var card = el.closest('.sup-card'), head = document.getElementById('site-header');
    var top = card.getBoundingClientRect().top + window.pageYOffset - (head ? head.offsetHeight : 0) - 16;
    if (card.getBoundingClientRect().top < (head ? head.offsetHeight : 0)) window.scrollTo(0, top);
    el.focus({ preventScroll: true });
  }

  // Show the text box only when Others is picked
  form.addEventListener('change', function (e) {
    err.hidden = true;
    if (e.target.name !== 'topic') return;
    var show = e.target.value === 'other';
    otherWrap.hidden = !show;
    if (show) other.focus();
  });

  // Step 1: pick a topic
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = form.querySelector('input[name="topic"]:checked');
    if (!r) { err.hidden = false; form.querySelector('input[name="topic"]').focus(); return; }
    picked = r.value;
    $('sup-topic').textContent = TOPICS[picked][0];
    $('sup-msg').placeholder = TOPICS[picked][1];
    if (picked === 'other' && other.value.trim() && !$('sup-msg').value.trim()) $('sup-msg').value = other.value.trim();
    form.hidden = true; details.hidden = false;
    reveal($('sup-name'));
  });

  // Step 2: your details
  var derr = $('sup-derr');
  ['sup-name', 'sup-email'].forEach(function (id) {
    $(id).addEventListener('input', function () { $(id).removeAttribute('aria-invalid'); derr.hidden = true; });
  });
  details.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('sup-name').value.trim(), email = $('sup-email').value.trim();
    var bad = !name ? ['sup-name', 'Please enter your name.'] : !EMAIL_RE.test(email) ? ['sup-email', 'Please enter a valid business email.'] : null;
    if (bad) { $(bad[0]).setAttribute('aria-invalid', 'true'); derr.textContent = bad[1]; derr.hidden = false; $(bad[0]).focus(); return; }
    var btn = details.querySelector('button[type="submit"]');
    busyButton(btn, true);
    sendForm('support', { topic: TOPICS[picked][0], note: picked === 'other' ? other.value : '', name: name, email: email, company: $('sup-company').value, message: $('sup-msg').value })
      .then(function () {
        busyButton(btn, false);
        $('sup-sent-title').textContent = 'Thanks, ' + name.split(/\s+/)[0] + '.';
        $('sup-sent-text').textContent = 'We’ll get back to you at ' + email + '.';
        details.hidden = true; sent.hidden = false; reveal(sent);
      })
      .catch(function () { busyButton(btn, false); derr.textContent = 'Sorry, that didn\u2019t send. Please try again in a moment.'; derr.hidden = false; });
  });
  $('sup-back').addEventListener('click', function () {
    details.hidden = true; form.hidden = false;
    (form.querySelector('input[name="topic"]:checked') || form.querySelector('input[name="topic"]')).focus();
  });
})();
