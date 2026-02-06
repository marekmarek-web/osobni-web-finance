/**
 * Vercel Serverless API – send-report.js
 * Bez externích npm balíčků (pouze vestavěný fetch / AbortController).
 *
 * Povinné ENV:
 *  - RESEND_API_KEY
 *  - MAIL_FROM
 *  - MAIL_TO_MAREK
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *  - CALENDLY_URL (nepovinné)
 */

const FETCH_TIMEOUT = 15000; // ms

function timeoutFetch(resource, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), options.timeout || FETCH_TIMEOUT);
  const finalOpts = { ...options, signal: controller.signal };
  return fetch(resource, finalOpts)
    .finally(() => clearTimeout(id));
}

async function getSignedUrl(supabaseUrl, serviceKey, reportPath) {
  try {
    if (!supabaseUrl || !serviceKey || !reportPath) return '';
    const url = (supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/sign/reports');
    const body = { path: reportPath, expiresIn: 3600 };
    const res = await timeoutFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + serviceKey,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch (e) { throw new Error(`Invalid JSON from Supabase signed URL: ${text}`); }

    if (!res.ok) {
      throw new Error(`Supabase signed URL error ${res.status}: ${text}`);
    }

    // Supabase may return signedURL or signedUrl
    if (data.signedURL) return data.signedURL;
    if (data.signedUrl) return data.signedUrl;
    if (data.path) {
      // fallback: construct public-ish link with token if provided by API
      return supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/reports/' + data.path + '?token=' + (data.token || '');
    }
    return '';
  } catch (e) {
    console.error('getSignedUrl error:', e && e.message ? e.message : e);
    return '';
  }
}

async function sendResendEmail(apiKey, from, to, subject, html, attachments) {
  const payload = { from, to: Array.isArray(to) ? to : [to], subject, html };
  if (attachments && attachments.length) payload.attachments = attachments;
  const url = 'https://api.resend.com/emails';
  try {
    const res = await timeoutFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch (e) { throw new Error(`Invalid JSON from Resend: ${text}`); }

    if (!res.ok) {
      const message = data?.message || data?.error || text || `Status ${res.status}`;
      throw new Error(`Resend API error ${res.status}: ${message}`);
    }
    return data;
  } catch (e) {
    console.error('sendResendEmail error:', e && e.message ? e.message : e);
    throw e;
  }
}

module.exports = async function handler(req, res) {
  try {
    console.info('send-report invoked', { method: req.method });

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const mailFrom = process.env.MAIL_FROM || 'diagnostika@yourdomain.com';
    const mailToMarek = process.env.MAIL_TO_MAREK || 'mrcreaw@gmail.com';
    const calendlyUrl = process.env.CALENDLY_URL || 'https://calendly.com/marekmarek/30min';
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!resendKey) {
      console.error('Missing RESEND_API_KEY');
      return res.status(500).json({ error: 'Chybí RESEND_API_KEY v nastavení Vercelu.' });
    }

    // Robust body parsing and logging
    let rawBody = req.body;
    if (typeof rawBody === 'string') {
      try { rawBody = rawBody ? JSON.parse(rawBody) : {}; } catch (err) {
        console.error('Invalid JSON body:', req.body);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }
    const body = rawBody || {};
    console.info('parsed body keys:', Object.keys(body));

    const { lead = {}, assessmentId, reportPath, reportPdfBase64, attachmentsMeta = [], outputJson = {} } = body;

    if (!lead || !lead.email) {
      console.warn('Missing lead.email');
      return res.status(400).json({ error: 'Chybí lead.email' });
    }
    if (!reportPath && !reportPdfBase64) {
      console.warn('Missing report asset');
      return res.status(400).json({ error: 'Chybí reportPath nebo reportPdfBase64' });
    }

    // Signed URL (if available)
    let reportUrl = '';
    if (reportPath && supabaseUrl && supabaseServiceKey) {
      reportUrl = await getSignedUrl(supabaseUrl, supabaseServiceKey, reportPath);
      console.info('reportUrl resolved:', reportUrl ? '[OK]' : '[EMPTY]');
    }

    // Prepare pdf attachment if provided base64
    let pdfAttachment = [];
    if (reportPdfBase64 && typeof reportPdfBase64 === 'string') {
      // Resend expects attachments with properties name/content/base64; we'll send base64 content
      pdfAttachment = [{ filename: 'diagnostika-shrnuti.pdf', content: reportPdfBase64 }];
    }

    const score = (outputJson && typeof outputJson.score !== 'undefined') ? outputJson.score : 0;
    const topFindings = Array.isArray(outputJson.topFindings) ? outputJson.topFindings.join('; ') : (outputJson.topFindings || '—');

    const htmlMarek = `
      <h2>Nový lead z diagnostiky</h2>
      <p><strong>Jméno:</strong> ${lead.name || '—'}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      <p><strong>Telefon:</strong> ${lead.phone || '—'}</p>
      <p><strong>Firma:</strong> ${lead.company_name || '—'}</p>
      <p><strong>Skóre:</strong> ${score}/100</p>
      <p><strong>Top nálezy:</strong> ${topFindings}</p>
      ${reportUrl ? '<p><a href="' + reportUrl + '" target="_blank">Stáhnout PDF</a></p>' : ''}
      ${(attachmentsMeta && attachmentsMeta.length) ? '<p>Přílohy: ' + attachmentsMeta.map(function(a) { return a.name; }).join(', ') + '</p>' : ''}
      <p>Assessment ID: ${assessmentId || '—'}</p>
    `;

    const htmlClient = `
      <p>Dobrý den${lead.name ? ' ' + lead.name : ''},</p>
      <p>díky za vyplnění diagnostiky. Připojuji shrnutí.</p>
      <p><strong>Skóre rizik:</strong> ${score}/100</p>
      <p><strong>Hlavní nálezy:</strong> ${topFindings}</p>
      ${reportUrl ? '<p><a href="' + reportUrl + '" target="_blank">Stáhnout shrnutí (PDF)</a></p>' : ''}
      <p>Chcete přesný návrh? Rezervujte si 15min call: <a href="${calendlyUrl}">${calendlyUrl}</a></p>
      <p>S pozdravem</p>
    `;

    // Send both emails in parallel, bubble errors separately
    let marekResult = null;
    let clientResult = null;
    try {
      [marekResult, clientResult] = await Promise.all([
        sendResendEmail(resendKey, mailFrom, mailToMarek, 'Diagnostika: ' + (lead.company_name || lead.email) + ' – ' + (lead.name || 'bez jména'), htmlMarek, pdfAttachment),
        sendResendEmail(resendKey, mailFrom, lead.email, 'Diagnostika „Má to smysl?“ – shrnutí', htmlClient, pdfAttachment),
      ]);
    } catch (emailErr) {
      console.error('Email sending error (one or both):', emailErr && emailErr.message ? emailErr.message : emailErr);
      // Return partial success with details
      return res.status(502).json({ error: 'Chyba při odesílání e-mailů', details: emailErr.message || String(emailErr) });
    }

    return res.status(200).json({ ok: true, marek: marekResult, client: clientResult });
  } catch (err) {
    console.error('send-report top-level error:', err && err.message ? err.message : err);
    return res.status(500).json({
      error: err.message || 'Chyba při odesílání e-mailu',
    });
  }
};
