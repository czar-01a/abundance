/* Log-in flow with password reset.
   Prototype only: any email and password log in. Connect a backend before launch. */
(function () {
  var form = document.getElementById('login-form');
  var screens = Array.prototype.slice.call(form.querySelectorAll('.screen'));
  var backBtn = document.getElementById('back');
  var submitBtn = document.getElementById('submit');
  var errorEl = document.getElementById('form-error');
  var foot = document.getElementById('form-foot');
  var LABELS = { login: 'Log in', forgot: 'Send code', reset: 'Reset password' };
  var screen = 'login';
  var usedGoogle = false;

  function val(name) { return String(form.elements[name].value || '').trim(); }
  function validEmail(v) { return /^\S+@\S+\.\S+$/.test(v); }
  function email() { return val('email') || val('reset-email'); }

  function go(next) {
    screen = next;
    screens.forEach(function (s) { s.hidden = s.dataset.screen !== screen; });
    backBtn.hidden = !(screen === 'forgot' || screen === 'reset');
    foot.hidden = !LABELS[screen];
    submitBtn.textContent = LABELS[screen] || '';
    errorEl.textContent = '';
    var shown = email() || (usedGoogle ? 'your Google account' : 'your email');
    form.querySelectorAll('.email-shown').forEach(function (n) { n.textContent = shown; });
    var active = screens.filter(function (s) { return !s.hidden; })[0];
    var focusable = active.querySelector('h2[tabindex]') || active.querySelector('input');
    if (focusable && next !== 'login') focusable.focus();
    window.scrollTo(0, 0);
  }

  function fail(msg, field) {
    errorEl.textContent = msg;
    if (field) form.elements[field].focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (screen === 'login') {
      if (!validEmail(val('email'))) return fail('Enter a valid email address.', 'email');
      if (!form.elements.password.value) return fail('Enter your password.', 'password');
      usedGoogle = false;
      return go('done');
    }
    if (screen === 'forgot') {
      if (!validEmail(val('reset-email'))) return fail('Enter a valid email address.', 'reset-email');
      form.elements.email.value = val('reset-email');
      return go('reset');
    }
    if (screen === 'reset') {
      if (!/^\d{6}$/.test(val('code'))) return fail('Enter the 6-digit code.', 'code');
      if (form.elements['new-password'].value.length < 8) return fail('Your new password needs at least 8 characters.', 'new-password');
      form.elements.password.value = '';
      return go('resetDone');
    }
  });
  form.addEventListener('input', function () { errorEl.textContent = ''; });

  document.getElementById('to-forgot').addEventListener('click', function () {
    form.elements['reset-email'].value = val('email');
    go('forgot');
  });
  document.getElementById('google').addEventListener('click', function () { usedGoogle = true; go('done'); });
  backBtn.addEventListener('click', function () { go('login'); });
  form.querySelectorAll('[data-to-login]').forEach(function (b) { b.addEventListener('click', function () { go('login'); }); });
  var resend = document.getElementById('resend');
  resend.addEventListener('click', function () { resend.textContent = 'Code sent again'; });

  go('login');
})();
