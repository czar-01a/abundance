/**
 * Abundance website forms → team@abundancephysical.com
 *
 * Paste this into a new project at script.google.com, then:
 *   1. Run setup() once and copy the secret it prints.
 *   2. Deploy > New deployment > Web app
 *        Execute as: Me
 *        Who has access: Anyone
 *   3. Copy the Web app URL.
 * Only requests carrying the secret are emailed; everything else is ignored.
 */
const TO = 'team@abundancephysical.com';

function setup() {
  const secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('SECRET', secret);
  Logger.log('Your secret (paste into Cloudflare as FORMS_SECRET): ' + secret);
}

function doPost(e) {
  const reply = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return reply({ ok: false, error: 'json' }); }

  const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (!secret || data.secret !== secret) return reply({ ok: false, error: 'auth' });

  const subject = String(data.subject || 'Website form').replace(/[\r\n]+/g, ' ').slice(0, 150);
  const body = String(data.text || '').slice(0, 30000);
  const options = { name: 'Abundance website' };
  if (typeof data.replyTo === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.replyTo)) options.replyTo = data.replyTo;

  MailApp.sendEmail(TO, subject, body, options);
  return reply({ ok: true });
}
