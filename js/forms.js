/* Sends a form to the site's email handler. Resolves on success, rejects on any failure. */
/* Error message with a short code (e.g. "auth") so problems can be traced */
window.sendError = function (e) {
  var code = e && e.message && e.message !== 'send' ? ' (code: ' + e.message + ')' : '';
  return 'Sorry, that didn\u2019t send. Please try again in a moment.' + code;
};
window.sendForm = function (form, fields) {
  return fetch('/api/forms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ form: form, fields: fields, website: '' })
  }).then(function (r) {
    return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok || !d.ok) throw new Error(d.error || 'send'); return d; });
  });
};
/* Turns a button off while a form is sending, so it can't be clicked twice. The label stays the same. */
window.busyButton = function (btn, on) {
  if (btn) btn.disabled = !!on;
};
