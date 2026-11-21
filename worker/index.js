/*
 * Abundance site Worker.
 * Serves the static site, and handles POST /api/forms: checks the submission
 * and emails it to the inbox verified in Cloudflare Email Routing.
 * Every other request goes straight to the static files.
 */
import { EmailMessage } from 'cloudflare:email';

const FROM = 'forms@abundancephysical.com';            // must be on a domain with Email Routing turned on
const SITE_HOSTS = ['abundancephysical.com', 'www.abundancephysical.com'];

// Which fields each form may send, and how long each may be
const FORMS = {
  'contact-sales': { title: 'Contact sales', fields: { name: 100, email: 200, company: 120, need: 60, message: 2000 }, required: ['name', 'email', 'company', 'need'], subject: (f) => 'Contact sales: ' + f.company },
  support:         { title: 'Support', fields: { topic: 60, note: 1000, name: 100, email: 200, company: 120, message: 2000 }, required: ['topic', 'name', 'email'], subject: (f) => 'Support: ' + f.topic },
  waitlist:        { title: 'Waitlist', fields: { email: 200, kind: 10, item: 120, about: 1000 }, required: ['email'], subject: (f) => 'Waitlist: ' + (f.item || f.kind || 'general') },
  order:           { title: 'Order', fields: { summary: 20000, totals: 500 }, required: ['summary'], subject: () => 'New dataset order' }
};
const LABELS = { name: 'Name', email: 'Email', company: 'Company', need: 'Interested in', message: 'Message', topic: 'Topic', note: 'Note', kind: 'From', item: 'Job or task', about: 'About their work', summary: 'Order', totals: 'Totals' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/forms') return handleForm(request, env);
    return env.ASSETS.fetch(request);
  }
};

async function handleForm(request, env) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  // Only accept submissions sent from the site itself
  const origin = request.headers.get('Origin') || '';
  let originHost = '';
  try { originHost = new URL(origin).hostname; } catch (e) {}
  const selfHost = new URL(request.url).hostname;
  if (!SITE_HOSTS.includes(originHost) && originHost !== selfHost) return json({ ok: false, error: 'origin' }, 403);

  if ((request.headers.get('Content-Type') || '').indexOf('application/json') !== 0) return json({ ok: false, error: 'type' }, 415);
  const raw = await request.text();
  if (raw.length > 40000) return json({ ok: false, error: 'size' }, 413);

  let body;
  try { body = JSON.parse(raw); } catch (e) { return json({ ok: false, error: 'json' }, 400); }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'json' }, 400);

  // Hidden "website" field: people never fill it in, spam bots usually do. Pretend it worked.
  if (body.website) return json({ ok: true });

  const spec = FORMS[body.form];
  if (!spec) return json({ ok: false, error: 'form' }, 400);

  const fields = {};
  for (const [key, max] of Object.entries(spec.fields)) {
    const v = body.fields && body.fields[key];
    if (typeof v === 'string' && v.trim()) fields[key] = v.trim().slice(0, max);
  }
  for (const key of spec.required) if (!fields[key]) return json({ ok: false, error: 'missing', field: key }, 400);
  if (fields.email && !EMAIL_RE.test(fields.email)) return json({ ok: false, error: 'email' }, 400);

  const lines = ['New ' + spec.title + ' submission from abundancephysical.com', ''];
  for (const key of Object.keys(spec.fields)) {
    if (!fields[key]) continue;
    const v = fields[key];
    lines.push(v.indexOf('\n') === -1 ? LABELS[key] + ': ' + v : LABELS[key] + ':\n' + v, '');
  }
  lines.push('Sent ' + new Date().toUTCString());

  const subject = clean(spec.subject(fields)).slice(0, 150);
  const replyTo = fields.email && EMAIL_RE.test(fields.email) ? clean(fields.email) : '';
  const mime = buildMime({ from: FROM, to: env.FORMS_TO, replyTo, subject, text: lines.join('\n') });

  try {
    await env.FORMS.send(new EmailMessage(FROM, env.FORMS_TO, mime));
  } catch (e) {
    console.error('send failed', e && e.message);
    return json({ ok: false, error: 'send' }, 502);
  }
  return json({ ok: true });
}

// Remove line breaks so nothing can be slipped into the email headers
function clean(s) { return String(s).replace(/[\r\n]+/g, ' ').trim(); }

function b64(s) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function buildMime({ from, to, replyTo, subject, text }) {
  const body = b64(text).replace(/.{76}/g, '$&\r\n');
  const head = [
    'From: Abundance website <' + from + '>',
    'To: <' + to + '>',
    replyTo ? 'Reply-To: <' + replyTo + '>' : '',
    'Subject: =?UTF-8?B?' + b64(subject) + '?=',
    'Date: ' + new Date().toUTCString(),
    'Message-ID: <' + crypto.randomUUID() + '@abundancephysical.com>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64'
  ].filter(Boolean);
  return head.join('\r\n') + '\r\n\r\n' + body + '\r\n';
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
