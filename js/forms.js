/* Sends a form to the site's email handler. Resolves on success, rejects on any failure. */
window.sendForm = function (form, fields) {
  return fetch('/api/forms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ form: form, fields: fields, website: '' })
  }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok || !d.ok) throw new Error(d.error || 'send'); return d; });
  });
};
/* Shows "Sending…" on a button while waiting, and puts the label back afterwards */
window.busyButton = function (btn, on) {
  if (!btn) return;
  if (on) { btn.dataset.label = btn.textContent; btn.textContent = 'Sending…'; btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
};
