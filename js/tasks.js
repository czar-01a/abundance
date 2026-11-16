/* Tasks page: filter the task groups by category */
(function () {
  var chips = document.querySelectorAll('.tchip'), groups = document.querySelectorAll('.tgroup');
  Array.prototype.forEach.call(chips, function (c) {
    c.addEventListener('click', function () {
      var cat = c.getAttribute('data-cat');
      Array.prototype.forEach.call(chips, function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
      Array.prototype.forEach.call(groups, function (g) { g.hidden = cat !== 'all' && g.getAttribute('data-cat') !== cat; });
    });
  });
})();

/* Tasks page: save (heart) tasks, remembered on this device */
(function () {
  var KEY = 'abundance-saved-tasks', saved = [];
  try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { saved = []; }
  if (!Array.isArray(saved)) saved = [];
  saved = saved.filter(function (t) { return typeof t === 'string'; });
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* storage unavailable */ } }
  function paint(b, on) {
    var name = b.getAttribute('data-task');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.setAttribute('aria-label', (on ? 'Unsave ' : 'Save ') + name);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.tsave'), function (b) {
    var name = b.getAttribute('data-task');
    paint(b, saved.indexOf(name) !== -1);
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var i = saved.indexOf(name), on = i === -1;
      if (on) saved.push(name); else saved.splice(i, 1);
      persist(); paint(b, on);
      b.classList.remove('pop'); void b.offsetWidth; // restart the animation
      if (on) b.classList.add('pop');
    });
  });
})();
