/**
 * Vercel Serverless API: Odeslání reportu e-mailem (tobě + klientovi)
 * POST /api/send-report
 * Body: { lead, assessmentId, reportPath, attachmentsMeta, outputJson }
 *
 * ENV: RESEND_API_KEY, MAIL_FROM, MAIL_TO_MAREK, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CALENDLY_URL
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const mailFrom = process.env.MAIL_FROM || 'diagnostika@yourdomain.com';
const mailToMarek = process.env.MAIL_TO_MAREK || 'marek@example.com';
const calendlyUrl = process.env.CALENDLY_URL || 'https://calendly.com/';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lead = {}, assessmentId, reportPath, attachmentsMeta = [], outputJson = {} } = req.body || {};

  if (!reportPath || !lead.email) {
    return res.status(400).json({ error: 'Chybí reportPath nebo lead.email' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Chybí Supabase konfigurace' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let reportUrl = '';
  try {
    const { data: signed } = await supabase.storage.from('reports').createSignedUrl(reportPath, 3600);
    reportUrl = signed?.signedUrl || '';
  } catch (e) {
    console.error('Signed URL error:', e);
  }

  const score = outputJson.score ?? 0;
  const topFindings = (outputJson.topFindings || []).join('; ') || '—';

  const emailToMarek = {
    from: mailFrom,
    to: mailToMarek,
    subject: `Diagnostika: ${lead.company_name || lead.email} – ${lead.name || 'bez jména'}`,
    html: `
      <h2>Nový lead z diagnostiky</h2>
      <p><strong>Jméno:</strong> ${lead.name || '—'}</p>
      <p><strong>Email:</strong> ${lead.email}</p>
      <p><strong>Telefon:</strong> ${lead.phone || '—'}</p>
      <p><strong>Firma:</strong> ${lead.company_name || '—'}</p>
      <p><strong>Skóre:</strong> ${score}/100</p>
      <p><strong>Top nálezy:</strong> ${topFindings}</p>
      ${reportUrl ? `<p><a href="${reportUrl}">Stáhnout PDF</a></p>` : ''}
      ${attachmentsMeta.length ? `<p>Přílohy: ${attachmentsMeta.map((a) => a.name).join(', ')}</p>` : ''}
      <p>Assessment ID: ${assessmentId || '—'}</p>
    `,
  };

  const emailToClient = {
    from: mailFrom,
    to: lead.email,
    subject: 'Diagnostika „Má to smysl?“ – shrnutí',
    html: `
      <p>Dobrý den${lead.name ? ' ' + lead.name : ''},</p>
      <p>díky za vyplnění diagnostiky. Připojuji shrnutí.</p>
      <p><strong>Skóre rizik:</strong> ${score}/100</p>
      <p><strong>Hlavní nálezy:</strong> ${topFindings}</p>
      ${reportUrl ? `<p><a href="${reportUrl}">Stáhnout shrnutí (PDF)</a></p>` : ''}
      <p>Chcete přesný návrh? Rezervujte si 15min call: <a href="${calendlyUrl}">${calendlyUrl}</a></p>
      <p>S pozdravem</p>
    `,
  };

  try {
    const [r1, r2] = await Promise.all([
      resend.emails.send(emailToMarek),
      resend.emails.send(emailToClient),
    ]);
    return res.status(200).json({ ok: true, marek: r1, client: r2 });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: err.message || 'Chyba při odesílání e-mailu' });
  }
}
