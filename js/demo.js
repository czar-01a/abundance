/* Dataset builder demo: the form, demo media, and the cart */
(function () {
  var form = document.getElementById('builder-form');
  if (!form) return;
  form.addEventListener('submit', function (e) { e.preventDefault(); }); // Enter in a text field must not reload the page

  // Task options on the page: label, and seconds per episode (used for the cart's episode estimate)
  var TASKS = {
    pick: { label: 'Pick and place', sec: 20 },
    household: { label: 'Household manipulation', sec: 45 },
    warehouse: { label: 'Warehouse picking', sec: 30 },
    assembly: { label: 'Assembly', sec: 60 },
    folding: { label: 'Cloth folding', sec: 60 },
    other: { label: 'Custom task', sec: 60 }
  };
  // Modality options on the page: raw data per hour of recording, in GB (used for the cart's estimate)
  var MODS = { video: 7, wrist: 5, joints: 0.05, teleop: 0.05, depth: 5, other: 1 };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(id) { return document.getElementById(id); }
  function val(name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function vals(name) { return Array.prototype.map.call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (el) { return el.value; }); }
  function fmt(n) { return n.toLocaleString('en-US'); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function otherText(name) { var box = $(name + '-other'); return box ? box.value.trim() : ''; }
  function syncOthers() {
    ['task', 'body', 'mod', 'equip', 'note'].forEach(function (name) {
      var on = !!form.querySelector('input[name="' + name + '"][value="other"]:checked'), box = $(name + '-other');
      if (box && box.hidden === on) { box.hidden = !on; if (on && document.activeElement && document.activeElement.value === 'other') box.focus(); }
    });
  }
  function chipLabel(name, v) {
    if (!v) return 'Not selected';
    if (v === 'other') return otherText(name) || 'Other';
    var input = Array.prototype.find.call(form.querySelectorAll('input[name="' + name + '"]'), function (i) { return i.value === v; });
    return input ? input.parentNode.textContent.trim() : 'Not selected';
  }
  var GENERIC = { label: 'Your dataset', sec: 60 };
  function taskInfo(s) {
    var t = TASKS[s.task];
    if (!t) return GENERIC;
    return s.task === 'other' ? { label: otherText('task') || t.label, sec: t.sec } : t;
  }

  function readState() {
    return {
      task: val('task'), body: val('body'), mods: vals('mod'), equip: vals('equip'), notes: vals('note'), format: val('format'),
      hours: +$('hours').value, envs: +$('envs').value
    };
  }

  // Cart estimates: episodes, raw size, and weeks to deliver
  function estimates(s) {
    var t = taskInfo(s);
    var episodes = Math.round(s.hours * 3600 / t.sec);
    var people = Math.max(Math.ceil(s.envs * 1.2), Math.ceil(s.hours / 40));
    var hardware = !!s.body && s.body !== 'human';
    var weeks = 2 + Math.ceil(s.hours / (people * 10)) + Math.ceil(s.hours / 500) + (hardware ? 1 : 0);
    var gb = s.mods.reduce(function (sum, m) { return sum + (MODS[m] || 0); }, 0) * s.hours;
    return { episodes: episodes, weeks: weeks, gb: gb };
  }

  /* ---------- task description + demo media ---------- */
  var files = [], MAX_FILES = 5;
  function kb(n) { return n >= 1e9 ? (n / 1e9).toFixed(1) + ' GB' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB'; }
  function thumb(f) {
    var m = f.file.type.indexOf('video') === 0 ? el('video') : el('img');
    if (m.tagName === 'VIDEO') { m.src = f.url + '#t=0.1'; m.preload = 'metadata'; m.muted = true; m.playsInline = true; m.setAttribute('aria-label', f.file.name); }
    else { m.src = f.url; m.alt = f.file.name; }
    return m;
  }
  function renderMedia() {
    var list = $('media-list'); list.textContent = '';
    files.forEach(function (f, i) {
      var row = el('div', 'mitem'), info = el('div');
      row.appendChild(thumb(f));
      info.appendChild(el('div', 'mname', f.file.name));
      info.appendChild(el('div', 'msize', kb(f.file.size)));
      row.appendChild(info);
      var x = el('button'); x.type = 'button'; x.setAttribute('aria-label', 'Remove ' + f.file.name);
      x.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6L6 18"></path></svg>';
      x.addEventListener('click', function () { URL.revokeObjectURL(f.url); files.splice(i, 1); renderMedia(); render(); });
      row.appendChild(x); list.appendChild(row);
    });
    $('media-note').hidden = !files.length;
    $('drop').hidden = files.length >= MAX_FILES;
  }
  function addFiles(list) {
    Array.prototype.forEach.call(list, function (file) {
      if (files.length >= MAX_FILES) return;
      if (!/^(video|image)\//.test(file.type)) return;
      files.push({ file: file, url: URL.createObjectURL(file) });
    });
    renderMedia(); render();
  }
  $('media').addEventListener('change', function (e) { addFiles(e.target.files); e.target.value = ''; });
  var drop = $('drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { if (e.dataTransfer) addFiles(e.dataTransfer.files); });

  /* ---------- render ---------- */
  function render() {
    syncOthers();
    var s = readState();
    ['hours', 'envs'].forEach(function (id) {
      var r = $(id); r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    });
    $('hours-out').textContent = fmt(s.hours) + ' hrs';
    $('envs-out').textContent = fmt(s.envs) + ' locations';
    if (typeof cart !== 'undefined' && cart) syncQty(false);
  }

  // Task and Embodiment: pick one at a time, click again to unselect
  form.addEventListener('change', function (e) {
    var t = e.target;
    if ((t.name === 'task' || t.name === 'body') && t.checked) {
      form.querySelectorAll('input[name="' + t.name + '"]').forEach(function (o) { if (o !== t) o.checked = false; });
    }
  }, true);
  /* ---------- cart ---------- */
  var KEY = 'abundance-cart-v1', cart = [], editingId = null, memFiles = {}, toastTimer = null;
  // Saved carts come from the visitor's own browser storage; keep only well-formed items so an old or edited value can't break the page
  function cleanItem(it) {
    if (!it || typeof it !== 'object' || typeof it.id !== 'string') return null;
    var arr = function (v) { return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string'; }) : []; };
    var str = function (v) { return typeof v === 'string' ? v.slice(0, 800) : ''; };
    var num = function (v, lo, hi, d) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
    var est = it.est && typeof it.est === 'object' ? it.est : {};
    return {
      id: it.id.slice(0, 40), qty: num(it.qty, 1, 99, 1),
      task: str(it.task), body: str(it.body), mods: arr(it.mods), equip: arr(it.equip), notes: arr(it.notes),
      format: ['lerobot', 'rlds', 'mcap'].indexOf(it.format) > -1 ? it.format : 'lerobot',
      hours: num(it.hours, 10, 2000, 200), envs: num(it.envs, 5, 200, 25),
      other: it.other && typeof it.other === 'object' ? { task: str(it.other.task), body: str(it.other.body), mod: str(it.other.mod), equip: str(it.other.equip), note: str(it.other.note) } : {},
      desc: str(it.desc), name: str(it.name), taskLabel: str(it.taskLabel), fileNames: arr(it.fileNames),
      title: str(it.title) || 'Untitled dataset', bodyLabel: str(it.bodyLabel) || 'Not selected',
      modLabels: arr(it.modLabels), equipLabels: arr(it.equipLabels), noteLabels: arr(it.noteLabels), formatLabel: str(it.formatLabel) || 'LeRobot',
      est: { episodes: num(est.episodes, 0, 1e9, 0), gb: num(est.gb, 0, 1e9, 0), weeks: num(est.weeks, 0, 1000, 0) }
    };
  }
  try { cart = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (err) { cart = []; }
  cart = (Array.isArray(cart) ? cart : []).map(cleanItem).filter(Boolean).slice(0, 50);
  function saveCart() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (err) {} }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function snapshot() {
    var s = readState(), e = estimates(s), ti = taskInfo(s);
    return {
      task: s.task, body: s.body, mods: s.mods, equip: s.equip, notes: s.notes, format: s.format, hours: s.hours, envs: s.envs,
      other: { task: otherText('task'), body: otherText('body'), mod: otherText('mod'), equip: otherText('equip'), note: otherText('note') },
      desc: $('task-desc').value.trim(),
      name: $('ds-name').value.trim(),
      taskLabel: s.task ? ti.label : 'No task selected',
      fileNames: files.map(function (f) { return f.file.name; }),
      title: $('ds-name').value.trim() || (s.task ? ti.label : 'Untitled dataset'),
      bodyLabel: chipLabel('body', s.body),
      modLabels: s.mods.map(function (m) { return chipLabel('mod', m); }),
      equipLabels: s.equip.map(function (v) { return chipLabel('equip', v); }),
      noteLabels: s.notes.map(function (v) { return chipLabel('note', v); }),
      formatLabel: form.querySelector('input[name="format"]:checked').parentNode.textContent.trim(),
      est: { episodes: e.episodes, gb: s.mods.length ? e.gb : 0, weeks: e.weeks }
    };
  }
  function setFiles(list) {
    files.forEach(function (f) { if (!list || list.indexOf(f) < 0) URL.revokeObjectURL(f.url); });
    files = list ? list.slice() : [];
    renderMedia();
  }
  function restore(it) {
    form.querySelectorAll('input[name="task"], input[name="body"], input[name="mod"], input[name="equip"], input[name="note"]').forEach(function (i) {
      var v = i.value, n = i.name;
      i.checked = n === 'task' ? it.task === v : n === 'body' ? it.body === v : n === 'mod' ? it.mods.indexOf(v) > -1 : n === 'equip' ? (it.equip || []).indexOf(v) > -1 : it.notes.indexOf(v) > -1;
    });
    ['task', 'body', 'mod', 'equip', 'note'].forEach(function (n) { var box = $(n + '-other'); if (box) box.value = (it.other && it.other[n]) || ''; });
    $('task-desc').value = it.desc || '';
    $('ds-name').value = it.name || '';
    $('hours').value = it.hours; $('envs').value = it.envs;
    form.querySelectorAll('input[name="format"]').forEach(function (f) { f.checked = f.value === it.format; });
  }
  function blank() {
    restore({ task: '', body: '', mods: [], equip: [], notes: [], format: 'lerobot', hours: 200, envs: 25, desc: '', other: {} });
    setFiles([]);
    setFormQty(1);
  }
  var formQty = 1;
  function setFormQty(n) {
    formQty = Math.max(1, Math.min(99, n));
    $('fq-n').textContent = formQty;
    $('fq-minus').disabled = formQty <= 1;
    $('fq-plus').disabled = formQty >= 99;
  }
  // If this dataset is already in the cart (or being edited), the stepper changes the cart right away
  function liveQty() {
    var target = editingId ? cart.find(function (c) { return c.id === editingId; }) : findSame(snapshot());
    if (!target) return;
    target.qty = formQty;
    saveCart(); updateCounts(); renderCart();
  }
  $('fq-minus').addEventListener('click', function () { setFormQty(formQty - 1); liveQty(); if ($('fq-minus').disabled) $('fq-plus').focus(); });
  $('fq-plus').addEventListener('click', function () { setFormQty(formQty + 1); liveQty(); if ($('fq-plus').disabled) $('fq-minus').focus(); });
  function setEditing(id) {
    editingId = id;
    $('cancel-edit').hidden = !id;
  }
  function sig(it) {
    return JSON.stringify([it.name || '', it.task, it.body, it.mods.slice().sort(), (it.equip || []).slice().sort(), it.notes.slice().sort(), it.other || {}, it.desc || '', it.hours, it.envs, it.format, (it.fileNames || []).slice().sort()]);
  }
  function qtyOf(it) { return Math.max(1, Math.min(99, it.qty || 1)); }
  function cartQty() { return cart.reduce(function (a, it) { return a + qtyOf(it); }, 0); }
  function updateCounts() {
    var q = cartQty();
    document.querySelectorAll('.cart-n').forEach(function (n) { n.textContent = q; });
  }
  function showToast(msg) {
    $('toast-msg').textContent = msg;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('toast').hidden = true; }, 3000);
  }
  function hideToast() { clearTimeout(toastTimer); $('toast').hidden = true; }
  // Keep the Quantity stepper in step with the cart: if this exact dataset is already in the cart,
  // the stepper shows its quantity and the button updates it.
  var specKey = null;
  function findSame(it) { var k = sig(it); return cart.find(function (c) { return sig(c) === k; }); }
  function syncQty(force) {
    var it = snapshot(), k = sig(it), same = findSame(it);
    if (force || k !== specKey) {
      specKey = k;
      if (!editingId) setFormQty(same ? qtyOf(same) : 1);
    }
    $('add-cart').textContent = editingId || same ? 'Update cart' : 'Add to cart';
  }
  // Description is required before anything goes into the cart
  function descOk() {
    var box = $('task-desc'), ok = !!box.value.trim();
    box.setAttribute('aria-invalid', ok ? 'false' : 'true');
    $('desc-err').hidden = ok;
    if (!ok) {
      box.focus({ preventScroll: true });
      window.scrollTo({ top: Math.max(0, box.getBoundingClientRect().top + window.pageYOffset - 140), behavior: reduce ? 'auto' : 'smooth' });
    }
    return ok;
  }
  $('task-desc').addEventListener('input', function () {
    if ($('task-desc').value.trim()) { $('task-desc').setAttribute('aria-invalid', 'false'); $('desc-err').hidden = true; }
  });
  $('add-cart').addEventListener('click', function () {
    if (!descOk()) return;
    var item = snapshot();
    if (editingId) {
      var idx = cart.findIndex(function (c) { return c.id === editingId; });
      item.id = editingId;
      item.qty = formQty;
      if (!files.length && !memFiles[editingId] && idx > -1) item.fileNames = cart[idx].fileNames;
      if (idx > -1) cart[idx] = item; else cart.push(item);
      memFiles[item.id] = files.slice();
      setEditing(null);
      saveCart(); updateCounts(); renderCart(); syncQty(true);
      showToast(item.title + ' updated in your cart.');
      return;
    }
    var same = findSame(item);
    if (same) {
      var before = qtyOf(same);
      same.qty = formQty;
      saveCart(); updateCounts(); renderCart(); syncQty(true);
      showToast(before === formQty ? same.title + ' is already in your cart (quantity ' + formQty + ').' : same.title + ' quantity updated to ' + formQty + '.');
    } else {
      item.id = uid(); item.qty = formQty;
      memFiles[item.id] = files.slice();
      cart.push(item);
      saveCart(); updateCounts(); renderCart(); syncQty(true);
      showToast((item.qty > 1 ? item.qty + ' \u00D7 ' : '') + item.title + ' added to your cart.');
    }
  });
  $('cancel-edit').addEventListener('click', function () { setEditing(null); blank(); render(); renderCart(); });
  $('view-cart').addEventListener('click', openCart);

  var lastFocus = null;
  function openCart() {
    hideToast(); renderCart();
    lastFocus = document.activeElement;
    $('cart').hidden = false;
    document.body.style.overflow = 'hidden';
    $('cart').querySelector('.cart-x').focus();
  }
  function closeCart() {
    if ($('cart').hidden) return;
    $('cart').hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $('cart').addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeCart(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });

  function focusQty(id, which) {
    var g = document.querySelector('.qty[data-id="' + id + '"]'); if (!g) return;
    var btns = g.querySelectorAll('button'), b = btns[which];
    (b && !b.disabled ? b : btns[1 - which]).focus();
  }
  function renderCart() {
    var list = $('cart-items'); list.textContent = '';
    cart.forEach(function (it, i) {
      var card = el('div', 'citem' + (it.id === editingId ? ' editing' : ''));
      var top = el('div', 'citem-top');
      // Dataset name is editable right in the cart
      var nameIn = el('input', 'citem-name'); nameIn.type = 'text'; nameIn.maxLength = 80;
      nameIn.value = it.title; nameIn.placeholder = it.taskLabel && it.taskLabel !== 'No task selected' ? it.taskLabel : 'Untitled dataset';
      nameIn.setAttribute('aria-label', 'Dataset name');
      var fit = function () { nameIn.size = Math.max(6, Math.min(40, (nameIn.value || nameIn.placeholder).length + 1)); }; // width follows the text in every browser
      fit(); nameIn.addEventListener('input', fit);
      nameIn.addEventListener('change', function () {
        var v = nameIn.value.trim().slice(0, 80);
        it.name = v;
        it.title = v || (it.taskLabel && it.taskLabel !== 'No task selected' ? it.taskLabel : 'Untitled dataset');
        nameIn.value = it.title; fit();
        saveCart(); syncQty(true);
      });
      nameIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); nameIn.blur(); } });
      top.appendChild(nameIn);
      var pen = el('button', 'citem-pen'); pen.type = 'button'; pen.setAttribute('aria-label', 'Rename ' + it.title);
      pen.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z"></path><path d="M13.5 6.5l4 4"></path></svg>';
      pen.addEventListener('click', function () { nameIn.focus(); nameIn.select(); });
      top.appendChild(pen);
      top.appendChild(el('div', 'citem-num', String(i + 1).padStart(2, '0')));
      card.appendChild(top);
      if (it.name && it.taskLabel) card.appendChild(el('div', 'citem-meta', it.taskLabel));
      card.appendChild(el('div', 'citem-meta', [it.bodyLabel, it.modLabels.join(', ') || 'No modalities', it.noteLabels.join(', ') || 'No annotations'].join(' \u00B7 ')));
      if (it.equipLabels.length) card.appendChild(el('div', 'citem-meta', 'Equipment: ' + it.equipLabels.join(', ')));
      card.appendChild(el('div', 'citem-meta', fmt(it.hours) + ' hrs \u00B7 ' + it.envs + ' locations \u00B7 ' + it.formatLabel + (it.fileNames.length ? ' \u00B7 ' + it.fileNames.length + (it.fileNames.length === 1 ? ' file' : ' files') : '')));
      if (it.desc) card.appendChild(el('div', 'citem-desc', it.desc));
      var acts = el('div', 'citem-actions');
      [['Edit', function () {
        restore(it); setFiles(memFiles[it.id] || []); setFormQty(qtyOf(it)); setEditing(it.id); render(); closeCart();
        window.scrollTo({ top: Math.max(0, form.getBoundingClientRect().top + window.pageYOffset - 100), behavior: reduce ? 'auto' : 'smooth' });
      }], ['Remove', function () {
        cart.splice(i, 1); delete memFiles[it.id];
        if (editingId === it.id) setEditing(null);
        saveCart(); updateCounts(); renderCart(); syncQty(true);
      }]].forEach(function (a, k) {
        var b = el('button', a[0] === 'Remove' ? 'rm' : null, a[0]); b.type = 'button';
        b.setAttribute('aria-label', a[0] + ' ' + it.title); b.addEventListener('click', a[1]); acts.appendChild(b);
      });
      var q = qtyOf(it), step = el('div', 'qty');
      step.setAttribute('role', 'group'); step.setAttribute('aria-label', 'Quantity for ' + it.title);
      var minus = el('button', 'qty-btn'); minus.type = 'button'; minus.setAttribute('aria-label', 'Decrease quantity'); minus.disabled = q <= 1;
      minus.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"></path></svg>';
      var num = el('span', 'qty-n', String(q)); num.setAttribute('aria-live', 'polite');
      var plus = el('button', 'qty-btn'); plus.type = 'button'; plus.setAttribute('aria-label', 'Increase quantity'); plus.disabled = q >= 99;
      plus.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>';
      minus.addEventListener('click', function () { it.qty = Math.max(1, q - 1); saveCart(); updateCounts(); renderCart(); syncQty(true); focusQty(it.id, 0); });
      plus.addEventListener('click', function () { it.qty = Math.min(99, q + 1); saveCart(); updateCounts(); renderCart(); syncQty(true); focusQty(it.id, 1); });
      step.appendChild(minus); step.appendChild(num); step.appendChild(plus);
      step.dataset.id = it.id;
      acts.appendChild(step);
      card.appendChild(acts);
      list.appendChild(card);
    });
    var has = cart.length > 0;
    $('cart-empty').hidden = has; $('cart-totals').hidden = !has; $('cart-foot').hidden = !has;
    if (has) {
      var h = 0, ep = 0, gb = 0, wk = 0;
      cart.forEach(function (it) { var q = qtyOf(it); h += it.hours * q; ep += it.est.episodes * q; gb += it.est.gb * q; wk = Math.max(wk, it.est.weeks); });
      $('tot-hours').textContent = fmt(h);
      $('tot-episodes').textContent = fmt(ep);
      $('tot-weeks').textContent = wk + ' weeks';
    }
  }

  // Checkout goes to its own page; the cart is read there from browser storage
  $('send-request').addEventListener('click', function () { saveCart(); window.location.href = 'checkout.html'; });

  updateCounts();
  if (location.hash === '#cart') setTimeout(openCart, 0); // "Edit cart" from the checkout page
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  render();
})();
