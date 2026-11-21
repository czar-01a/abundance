/* Contact sales: check the required fields, then show a thank-you */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var form = $('cs-form'), err = $('cs-err');
  ['cs-need'].forEach(function (id) {
    $(id).addEventListener('change', function () { $(id).classList.toggle('empty', !$(id).value); $(id).removeAttribute('aria-invalid'); err.hidden = true; });
  });
  ['cs-name', 'cs-email', 'cs-company'].forEach(function (id) {
    $(id).addEventListener('input', function () { $(id).removeAttribute('aria-invalid'); err.hidden = true; });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var checks = [
      ['cs-name', !$('cs-name').value.trim(), 'Please enter your name.'],
      ['cs-email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('cs-email').value.trim()), 'Please enter a valid work email.'],
      ['cs-company', !$('cs-company').value.trim(), 'Please enter your company.'],
      ['cs-need', !$('cs-need').value, 'Please choose what you’re interested in.']
    ];
    for (var i = 0; i < checks.length; i++) {
      if (checks[i][1]) { var el = $(checks[i][0]); el.setAttribute('aria-invalid', 'true'); err.textContent = checks[i][2]; err.hidden = false; el.focus(); return; }
    }
    form.hidden = true; $('cs-done').hidden = false;
    var head = document.getElementById('site-header'), card = $('cs-done').closest('.wl-card');
    if (card.getBoundingClientRect().top < (head ? head.offsetHeight : 0)) window.scrollTo(0, card.getBoundingClientRect().top + window.pageYOffset - (head ? head.offsetHeight : 0) - 16);
    $('cs-done').focus({ preventScroll: true });
  });
})();
