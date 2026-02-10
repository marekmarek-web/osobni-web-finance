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

async function sendResendEmail(apiKey, from, to, subject, html, attachments, cc) {
  const payload = { 
    from, 
    to: Array.isArray(to) ? to : [to], 
    subject, 
    html 
  };
  if (cc) {
    payload.cc = Array.isArray(cc) ? cc : [cc];
  }
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
  // CORS hlavičky - povolit všechny originy (v produkci můžeš omezit na konkrétní domény)
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hodin
  
  // Handle preflight OPTIONS request - MUSÍ být před try blokem
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    if (req.method !== 'POST') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const mailFrom = process.env.MAIL_FROM || 'diagnostika@yourdomain.com';
    const mailToMarek = process.env.MAIL_TO_MAREK || 'marek@example.com';
    const calendlyUrl = process.env.CALENDLY_URL || 'https://calendly.com/';
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!resendKey) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      return res.status(500).json({ error: 'Chybí RESEND_API_KEY v nastavení Vercelu.' });
    }

    const body = typeof req.body === 'string' ? (req.body ? JSON.parse(req.body) : {}) : (req.body || {});
    const { lead = {}, assessmentId, reportPath, reportPdfBase64, attachmentsMeta = [], outputJson = {} } = body;

    if (!lead.email) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      return res.status(400).json({ error: 'Chybí lead.email' });
    }
    if (!reportPath && !reportPdfBase64) {
      res.setHeader('Access-Control-Allow-Origin', origin);
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
    const allFindings = outputJson.allFindings || outputJson.topFindings || [];
    const biggestHole = outputJson.biggestHole || (allFindings.length ? allFindings.join(' ') : '—');
    const quickWin = outputJson.quickWin || '—';
    const nextSteps = outputJson.nextSteps || [];
    const gapsCount = outputJson.gapsCount ?? 0;
    const riskItems = outputJson.riskItems || [];
    const companyName = outputJson.companyName || lead.company_name || '—';
    const benefitSavings = outputJson.benefitSavings || 0;
    const fmtKc = (n) => n ? Math.round(n).toLocaleString('cs-CZ') + ' Kč' : '—';

    const htmlMarek = `
      <h2>Nový kontakt z rychlého přehledu</h2>
      <p><strong>Jméno:</strong> ${lead.name || '—'}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      <p><strong>Telefon:</strong> ${lead.phone || '—'}</p>
      <p><strong>Firma:</strong> ${companyName}</p>
      <p><strong>Skóre:</strong> ${score}/100</p>
      <p><strong>Míst ke zlepšení:</strong> ${gapsCount}</p>
      <p><strong>Top nálezy:</strong> ${Array.isArray(allFindings) ? allFindings.join('; ') : allFindings}</p>
      ${reportUrl ? '<p><a href="' + reportUrl + '">Stáhnout PDF</a></p>' : ''}
      ${(attachmentsMeta && attachmentsMeta.length) ? '<p>Přílohy: ' + attachmentsMeta.map(a => a.name).join(', ') + '</p>' : ''}
      <p>Assessment ID: ${assessmentId || '—'}</p>
    `;

    const riskRows = riskItems.map(item => `
      <tr><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${item.ok ? '✓' : '✗'}</td><td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;">${item.label}</td></tr>
    `).join('');
    const findingsList = Array.isArray(allFindings) && allFindings.length > 0
      ? allFindings.map(f => `<li style="margin:6px 0;">${f}</li>`).join('')
      : `<li>${biggestHole}</li>`;
    const nextStepsList = Array.isArray(nextSteps) && nextSteps.length > 0
      ? nextSteps.map(s => `<li style="margin:6px 0;">${s}</li>`).join('')
      : '';

    const htmlClient = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
        <p style="font-size:16px;line-height:1.6;">Dobrý den${lead.name ? ' ' + lead.name.split(' ')[0] : ''},</p>
        <p style="font-size:16px;line-height:1.6;">připojuji shrnutí vašeho rychlého přehledu – co jste vyplnili a kde vidím příležitosti.</p>
        
        <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #0B3A7A;">
          <p style="margin:0 0 8px;font-weight:700;color:#0f172a;">${companyName}</p>
          <p style="margin:0;font-size:14px;color:#64748b;">Skóre rizik: <strong>${score}/100</strong> &nbsp;|&nbsp; Našel jsem <strong>${gapsCount} míst</strong> ke zlepšení</p>
          ${benefitSavings > 0 ? '<p style="margin:8px 0 0;font-size:14px;color:#10b981;">Potenciál úspor: <strong>' + fmtKc(benefitSavings) + '/rok</strong></p>' : ''}
        </div>

        <h3 style="font-size:16px;color:#0f172a;margin:24px 0 12px;">Kritické nálezy</h3>
        <ul style="font-size:15px;line-height:1.7;padding-left:20px;margin:0;">
          ${findingsList}
        </ul>

        ${riskItems.length > 0 ? `
        <h3 style="font-size:16px;color:#0f172a;margin:24px 0 12px;">Přehled krytí rizik</h3>
        <table style="font-size:14px;border-collapse:collapse;width:100%;">
          ${riskRows}
        </table>
        ` : ''}

        ${nextStepsList ? `
        <h3 style="font-size:16px;color:#0f172a;margin:24px 0 12px;">Doporučené kroky</h3>
        <ul style="font-size:15px;line-height:1.7;padding-left:20px;margin:0;">
          ${nextStepsList}
        </ul>
        ` : ''}

        <p style="font-size:16px;line-height:1.6;margin-top:24px;">${reportUrl ? 'Příloha: <a href="' + reportUrl + '" style="color:#0B3A7A;">stáhnout shrnutí (PDF)</a>. ' : ''}Pro přesný návrh na míru si rezervujte 15min call:</p>
        <p style="margin:16px 0;"><a href="${calendlyUrl}" style="display:inline-block;background:#ffcc00;color:#0a0f29;font-weight:700;padding:12px 24px;text-decoration:none;border-radius:8px;">${calendlyUrl}</a></p>
        
        <p style="font-size:16px;line-height:1.6;margin-top:32px;">S pozdravem</p>
        <p style="font-size:16px;font-weight:700;color:#0f172a;">Marek Marek</p>
      </div>
    `;

    // Validace a očištění emailových adres
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Odstranění [blocked] a dalších neplatných částí z emailů
    const mailFromClean = (mailFrom || '').replace(/\s*\[blocked\]\s*/gi, '').trim();
    const mailToMarekClean = (mailToMarek || '').replace(/\s*\[blocked\]\s*/gi, '').trim();
    const leadEmailClean = (lead.email || '').replace(/\s*\[blocked\]\s*/gi, '').trim();
    
    if (!emailRegex.test(mailFromClean)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      return res.status(500).json({ error: 'Neplatná MAIL_FROM adresa: ' + mailFromClean });
    }
    if (!emailRegex.test(mailToMarekClean)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      return res.status(500).json({ error: 'Neplatná MAIL_TO_MAREK adresa: ' + mailToMarekClean });
    }
    if (!emailRegex.test(leadEmailClean)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      return res.status(400).json({ error: 'Neplatná emailová adresa v lead objektu: ' + leadEmailClean });
    }

    const [r1, r2] = await Promise.all([
      sendResendEmail(resendKey, mailFromClean, mailToMarekClean, 'Diagnostika: ' + (lead.company_name || leadEmailClean) + ' – ' + (lead.name || 'bez jména'), htmlMarek, pdfAttachment),
      sendResendEmail(resendKey, mailFromClean, leadEmailClean, 'Shrnutí rychlého přehledu' + (companyName !== '—' ? ' – ' + companyName : ''), htmlClient, pdfAttachment),
    ]);

    res.setHeader('Access-Control-Allow-Origin', origin);
    return res.status(200).json({ ok: true, marek: r1, client: r2 });
  } catch (err) {
    console.error('send-report error:', err);
    res.setHeader('Access-Control-Allow-Origin', origin);
    return res.status(500).json({
      error: err.message || 'Chyba při odesílání e-mailu',
    });
  }
};
