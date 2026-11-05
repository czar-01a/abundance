/* Coming soon page: show which page is on its way, e.g. coming-soon.html?page=Blog */
(function () {
  var name = new URLSearchParams(location.search).get('page');
  if (!name) return;
  name = name.slice(0, 40);
  var slot = document.getElementById('soon-name');
  if (slot) slot.textContent = name; // textContent, so the query string can never inject markup
  document.title = name + ' - Coming soon - Abundance';
})();
