/* Sign-up flow: account → path → details → verify → done.
   Prototype only: nothing is sent or stored. Connect a backend before launch. */
(function () {
  var STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas',
    'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'];
  var PRODUCTS = ['Factory', '3D Printer', 'Energy', 'Build', 'Home', 'Food', 'Sports', 'Research', 'Medicine', 'Beyond'];

  var form = document.getElementById('signup-form');
  var screens = Array.prototype.slice.call(form.querySelectorAll('.screen'));
  var progress = Array.prototype.slice.call(document.querySelectorAll('#progress li'));
  var backBtn = document.getElementById('back');
  var stepCount = document.getElementById('step-count');
  var submitBtn = document.getElementById('submit');
  var errorEl = document.getElementById('form-error');
  var legal = document.getElementById('legal');
  var foot = document.getElementById('form-foot');
  var step = 0;
  var usedGoogle = false;

  // Fill the state dropdown and product chips
  var stateSelect = document.getElementById('su-state');
  STATES.forEach(function (s) {
    var o = document.createElement('option');
    o.value = s; o.textContent = s;
    stateSelect.appendChild(o);
  });
  var pickProducts = document.getElementById('pick-products');
  PRODUCTS.forEach(function (p) {
    var label = document.createElement('label');
    label.className = 'pick';
    var input = document.createElement('input');
    input.type = 'checkbox'; input.name = 'products'; input.value = p;
    var span = document.createElement('span');
    span.textContent = p;
    label.appendChild(input); label.appendChild(span);
    pickProducts.appendChild(label);
  });

  // "Request a dataset" links open this page with ?path=team
  var preset = new URLSearchParams(location.search).get('path');
  if (preset === 'team' || preset === 'contributor') {
    form.querySelector('input[name="path"][value="' + preset + '"]').checked = true;
  }

  function val(name) {
    var f = form.elements[name];
    return f ? String(f.value || '').trim() : '';
  }
  function checked(name) {
    return Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]:checked')).map(function (i) { return i.value; });
  }
  function path() { return checked('path')[0] || ''; }

  function validate() {
    if (step === 0) {
      if (!val('name')) return ['Enter your full name.', 'name'];
      if (!/^\S+@\S+\.\S+$/.test(val('email'))) return ['Enter a valid email address.', 'email'];
      if (form.elements.password.value.length < 8) return ['Your password needs at least 8 characters.', 'password'];
    }
    if (step === 1 && !path()) return ['Choose how you will use Abundance.'];
    if (step === 2 && path() === 'contributor') {
      if (!val('state')) return ['Select your state.', 'state'];
      if (!checked('products').length) return ['Pick at least one product.'];
      if (!checked('availability').length) return ['Choose your availability.'];
    }
    if (step === 2 && path() === 'team') {
      if (!val('company')) return ['Enter your company name.', 'company'];
      if (!checked('data').length) return ['Pick at least one type of data.'];
    }
    if (step === 3 && !/^\d{6}$/.test(val('code'))) return ['Enter the 6-digit code.', 'code'];
    return null;
  }

  function show() {
    var p = path();
    screens.forEach(function (s) {
      var match = Number(s.dataset.step) === step && (!s.dataset.path || s.dataset.path === (p || 'contributor'));
      s.hidden = !match;
    });
    progress.forEach(function (li, i) {
      li.classList.toggle('done', i < step);
      li.classList.toggle('active', i === step);
      if (i === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    document.getElementById('step3-label').textContent = p === 'team' ? 'Team details' : 'Your details';
    backBtn.hidden = step === 0 || step === 4;
    stepCount.hidden = step === 4;
    stepCount.textContent = 'Step ' + (step + 1) + ' of 4';
    foot.hidden = step === 4;
    legal.hidden = step !== 0;
    submitBtn.textContent = step === 0 ? 'Create account' : step === 3 ? 'Verify' : 'Continue';
    errorEl.textContent = '';

    var email = val('email') || (usedGoogle ? 'your Google email' : 'your email');
    form.querySelectorAll('.email-shown').forEach(function (n) { n.textContent = email; });

    if (step === 4) {
      var first = val('name').split(' ')[0];
      var contributor = p !== 'team';
      document.getElementById('done-title').textContent = (contributor ? 'You’re in' : 'Thanks') + (first ? ', ' + first : '') + '.';
      document.getElementById('done-text').textContent = contributor
        ? 'Your contributor account is ready. Browse open jobs and reserve or apply to the ones that fit you.'
        : 'Our team will review your request and reach out with a collection plan and quote.';
      var link = document.getElementById('done-link');
      link.textContent = contributor ? 'Browse jobs' : 'Back to home';
      link.href = contributor ? 'jobs.html' : 'index.html';
      document.getElementById('done-title').focus();
    } else {
      var firstField = screens.filter(function (s) { return !s.hidden; })[0].querySelector('input:not([type=radio]):not([type=checkbox]), select');
      if (firstField && step > 0) firstField.focus();
    }
    window.scrollTo(0, 0);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var err = validate();
    if (err) {
      errorEl.textContent = err[0];
      if (err[1] && form.elements[err[1]]) form.elements[err[1]].focus();
      return;
    }
    step = Math.min(4, step + 1);
    show();
  });
  form.addEventListener('input', function () { errorEl.textContent = ''; });
  form.addEventListener('change', function () { errorEl.textContent = ''; });

  backBtn.addEventListener('click', function () { step = Math.max(0, step - 1); show(); });
  document.getElementById('google').addEventListener('click', function () { usedGoogle = true; step = 1; show(); });
  var resend = document.getElementById('resend');
  resend.addEventListener('click', function () { resend.textContent = 'Code sent again'; });

  show();
})();
