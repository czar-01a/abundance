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
