/* Checkout page: reads the cart saved by the demo page, collects contact details, opens a pre-filled email */
(function () {
  var KEY = 'abundance-cart-v1';
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  function str(v, n) { return typeof v === 'string' ? v.slice(0, n || 800) : ''; }
  function arr(v) { return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : []; }
  function num(v, lo, hi, d) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }

  // Only trust well-formed items from storage
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { cart = []; }
  cart = (Array.isArray(cart) ? cart : []).filter(function (it) { return it && typeof it === 'object'; }).slice(0, 50).map(function (it) {
    var est = it.est && typeof it.est === 'object' ? it.est : {};
    return {
      qty: num(it.qty, 1, 99, 1), title: str(it.title, 120) || 'Untitled dataset', taskLabel: str(it.taskLabel, 120),
      bodyLabel: str(it.bodyLabel, 120) || 'Not selected', modLabels: arr(it.modLabels), equipLabels: arr(it.equipLabels), noteLabels: arr(it.noteLabels),
      desc: str(it.desc), fileNames: arr(it.fileNames), hours: num(it.hours, 0, 1e6, 0), envs: num(it.envs, 0, 1e6, 0), formatLabel: str(it.formatLabel, 40) || 'LeRobot',
      est: { episodes: num(est.episodes, 0, 1e12, 0), gb: num(est.gb, 0, 1e12, 0), weeks: num(est.weeks, 0, 1e4, 0) }
    };
  });

  if (!cart.length) { $('co-empty').hidden = false; return; }
  if (!$('co-form').hasAttribute('data-off')) $('co-form').hidden = false;
  $('co-summary').hidden = false;

  var tq = 0, h = 0, ep = 0, gb = 0, wk = 0;
  cart.forEach(function (it) {
    tq += it.qty; h += it.hours * it.qty; ep += it.est.episodes * it.qty; gb += it.est.gb * it.qty; wk = Math.max(wk, it.est.weeks);
    var row = el('div', 'co-item'), top = el('div', 'co-item-top');
    top.appendChild(el('span', 'co-item-title', it.title));
    top.appendChild(el('span', 'co-qty', '× ' + it.qty));
    row.appendChild(top);
    // Specs as a labeled list so each one reads on its own
    var specs = el('dl', 'co-specs');
    [['Task', it.taskLabel && it.taskLabel !== 'No task selected' ? it.taskLabel : ''],
     ['Embodiment', it.bodyLabel !== 'Not selected' ? it.bodyLabel : ''],
     ['Modalities', it.modLabels.join(', ')],
     ['Equipment', it.equipLabels.join(', ')],
     ['Annotations', it.noteLabels.join(', ')],
     ['Volume', fmt(it.hours) + ' hours'],
     ['Locations', fmt(it.envs)],
     ['Format', it.formatLabel],
     ['Demo files', it.fileNames.join(', ')],
     ['Description', it.desc]].forEach(function (s) {
      if (!s[1]) return;
      specs.appendChild(el('dt', null, s[0]));
      specs.appendChild(el('dd', s[0] === 'Description' ? 'co-desc' : null, s[1]));
    });
    row.appendChild(specs);
    $('co-items').appendChild(row);
  });
  $('co-count').textContent = fmt(tq);
  $('co-hours').textContent = fmt(h);
  $('co-episodes').textContent = fmt(ep);
  $('co-weeks').textContent = wk + ' weeks';

  var form = $('co-form'), f = form.elements, CKEY = KEY + '-contact';
  try { var saved = JSON.parse(localStorage.getItem(CKEY) || '{}'); ['name', 'email', 'company', 'notes'].forEach(function (k) { if (typeof saved[k] === 'string') f[k].value = saved[k].slice(0, 1000); }); } catch (e) {}
  form.addEventListener('input', function () {
    var o = {}; ['name', 'email', 'company', 'notes'].forEach(function (k) { o[k] = f[k].value; });
    try { localStorage.setItem(CKEY, JSON.stringify(o)); } catch (e) {}
    f.email.setAttribute('aria-invalid', 'false'); $('co-err').hidden = true;
  });

  var mailto = '';
  function build() {
    var email = f.email.value.trim();
    var L = ['Hi Abundance team,', '', 'I would like to request ' + tq + (tq === 1 ? ' dataset:' : ' datasets:'), ''];
    cart.forEach(function (it, i) {
      L.push((i + 1) + '. ' + it.title + (it.qty > 1 ? ' (x' + it.qty + ')' : ''),
        '   - Quantity: ' + it.qty,
        '   - Task: ' + (it.taskLabel || it.title),
        '   - Embodiment: ' + it.bodyLabel,
        '   - Modalities: ' + (it.modLabels.join(', ') || 'None'),
        '   - Equipment: ' + (it.equipLabels.join(', ') || 'None'),
        '   - Annotations: ' + (it.noteLabels.join(', ') || 'None'),
        '   - Description: ' + (it.desc || 'Not provided'),
        '   - Reference media: ' + (it.fileNames.length ? it.fileNames.join(', ') + ' (attached)' : 'None'),
        '   - Volume: ' + fmt(it.hours) + ' hours across ' + it.envs + ' locations',
        '   - Format: ' + it.formatLabel, '');
    });
    if (!form.hidden) L.push('Name: ' + (f.name.value.trim() || '-'), 'Email: ' + email, 'Company: ' + (f.company.value.trim() || '-'));
    if (!form.hidden && f.notes.value.trim()) L.push('', 'Notes:', f.notes.value.trim());
    var subj = 'Dataset request: ' + tq + (tq === 1 ? ' dataset' : ' datasets') + (!form.hidden && f.company.value.trim() ? ' (' + f.company.value.trim() + ')' : '');
    return 'mailto:hello@abundancephysical.com?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(L.join('\n'));
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) {
      f.email.setAttribute('aria-invalid', 'true'); $('co-err').hidden = false; f.email.focus(); return;
    }
    finish();
  });
  function finish() {
    mailto = build();
    window.location.href = mailto;
    form.hidden = true; $('co-summary').hidden = true; $('co-done').hidden = false;
    var h = $('co-done').querySelector('h2'); h.setAttribute('tabindex', '-1'); h.focus();
  }
  $('co-checkout').addEventListener('click', function () {
    if (!form.hidden) { if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true })); return; }
    finish();
  });
  $('co-again').addEventListener('click', function () { if (mailto) window.location.href = mailto; });
  $('co-clear').addEventListener('click', function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    window.location.href = 'demo.html';
  });
})();
