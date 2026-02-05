/**
 * Vercel Serverless API – BEZ npm balíčků (pouze vestavěné fetch).
 * POST /api/send-report
 * ENV: RESEND_API_KEY, MAIL_FROM, MAIL_TO_MAREK, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CALENDLY_URL
 */

async function getSignedUrl(supabaseUrl, serviceKey, reportPath) {
  try {
    const url = supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/sign/reports';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + serviceKey,
      },
      body: JSON.stringify({ path: reportPath, expiresIn: 3600 }),
    });
    const data = await res.json();
    if (data.signedURL) return data.signedURL;
    if (data.signedUrl) return data.signedUrl;
    if (data.path) return supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/reports/' + data.path + '?token=' + (data.token || '');
    return '';
  } catch (e) {
    console.error('Signed URL error:', e);
    return '';
  }
}

async function sendResendEmail(apiKey, from, to, subject, html, attachments) {
  const payload = { from, to: Array.isArray(to) ? to : [to], subject, html };
  if (attachments && attachments.length) payload.attachments = attachments;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Resend API error');
  return data;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const mailFrom = process.env.MAIL_FROM || 'diagnostika@yourdomain.com';
    const mailToMarek = process.env.MAIL_TO_MAREK || 'marek@example.com';
    const calendlyUrl = process.env.CALENDLY_URL || 'https://calendly.com/';
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!resendKey) {
      return res.status(500).json({ error: 'Chybí RESEND_API_KEY v nastavení Vercelu.' });
    }

    const body = typeof req.body === 'string' ? (req.body ? JSON.parse(req.body) : {}) : (req.body || {});
    const { lead = {}, assessmentId, reportPath, reportPdfBase64, attachmentsMeta = [], outputJson = {} } = body;

    if (!lead.email) {
      return res.status(400).json({ error: 'Chybí lead.email' });
    }
    if (!reportPath && !reportPdfBase64) {
      return res.status(400).json({ error: 'Chybí reportPath nebo reportPdfBase64' });
    }

    let reportUrl = '';
    if (reportPath && supabaseUrl && supabaseServiceKey) {
      reportUrl = await getSignedUrl(supabaseUrl, supabaseServiceKey, reportPath);
    }
    var pdfAttachment = [];
    if (reportPdfBase64 && typeof reportPdfBase64 === 'string') {
      pdfAttachment = [{ filename: 'diagnostika-shrnuti.pdf', content: reportPdfBase64 }];
    }

    const score = outputJson.score ?? 0;
    const topFindings = (outputJson.topFindings || []).join('; ') || '—';

    const htmlMarek = `
      <h2>Nový lead z diagnostiky</h2>
      <p><strong>Jméno:</strong> ${lead.name || '—'}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      <p><strong>Telefon:</strong> ${lead.phone || '—'}</p>
      <p><strong>Firma:</strong> ${lead.company_name || '—'}</p>
      <p><strong>Skóre:</strong> ${score}/100</p>
      <p><strong>Top nálezy:</strong> ${topFindings}</p>
      ${reportUrl ? '<p><a href="' + reportUrl + '">Stáhnout PDF</a></p>' : ''}
      ${(attachmentsMeta && attachmentsMeta.length) ? '<p>Přílohy: ' + attachmentsMeta.map(function(a) { return a.name; }).join(', ') + '</p>' : ''}
      <p>Assessment ID: ${assessmentId || '—'}</p>
    `;

    const htmlClient = `
      <p>Dobrý den${lead.name ? ' ' + lead.name : ''},</p>
      <p>díky za vyplnění diagnostiky. Připojuji shrnutí.</p>
      <p><strong>Skóre rizik:</strong> ${score}/100</p>
      <p><strong>Hlavní nálezy:</strong> ${topFindings}</p>
      ${reportUrl ? '<p><a href="' + reportUrl + '">Stáhnout shrnutí (PDF)</a></p>' : ''}
      <p>Chcete přesný návrh? Rezervujte si 15min call: <a href="${calendlyUrl}">${calendlyUrl}</a></p>
      <p>S pozdravem</p>
    `;

    const [r1, r2] = await Promise.all([
      sendResendEmail(resendKey, mailFrom, mailToMarek, 'Diagnostika: ' + (lead.company_name || lead.email) + ' – ' + (lead.name || 'bez jména'), htmlMarek, pdfAttachment),
      sendResendEmail(resendKey, mailFrom, lead.email, 'Diagnostika „Má to smysl?“ – shrnutí', htmlClient, pdfAttachment),
    ]);

    return res.status(200).json({ ok: true, marek: r1, client: r2 });
  } catch (err) {
    console.error('send-report error:', err);
    return res.status(500).json({
      error: err.message || 'Chyba při odesílání e-mailu',
    });
  }
};
