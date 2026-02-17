/**
 * Vercel Serverless API – Stripe webhook pro předplatné.
 * POST /api/stripe-webhook (raw body – v Vercel nastavte bodyParser: false pro tuto route)
 * ENV: STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * V Stripe Dashboard: Webhooks → Add endpoint → URL: https://vas-domena.vercel.app/api/stripe-webhook
 * Vyberte události: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 */

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeSignature(payload, signature, secret) {
  const crypto = require('crypto');
  const parts = signature.split(',');
  let timestamp = '';
  let v1 = '';
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k === 't') timestamp = v;
    if (k === 'v1') v1 = v;
  }
  const signed = timestamp + '.' + payload;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return v1 === expected;
}

async function updateAdvisorSubscription(supabaseUrl, serviceKey, userId, data) {
  const url = supabaseUrl.replace(/\/$/, '') + '/rest/v1/advisors?user_id=eq.' + userId;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: 'Bearer ' + serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  return res.ok;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing STRIPE_WEBHOOK_SECRET or Supabase env');
    return res.status(500).end();
  }

  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (e) {
    return res.status(400).end();
  }
  const signature = req.headers['stripe-signature'] || '';
  if (!verifyStripeSignature(rawBody.toString('utf8'), signature, secret)) {
    return res.status(400).end();
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    return res.status(400).end();
  }

  const type = event.type;
  const userId = (event.data && event.data.object && event.data.object.metadata && event.data.object.metadata.user_id) ||
    (event.data && event.data.object && event.data.object.client_reference_id);

  if (type === 'checkout.session.completed') {
    const session = event.data.object;
    const uid = session.client_reference_id || (session.metadata && session.metadata.user_id);
    if (!uid) {
      res.status(200).end();
      return;
    }
    const subId = session.subscription;
    const customerId = session.customer;
    await updateAdvisorSubscription(supabaseUrl, supabaseServiceKey, uid, {
      stripe_customer_id: customerId,
      stripe_subscription_id: subId,
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    });
    if (subId) {
      const subRes = await fetch('https://api.stripe.com/v1/subscriptions/' + subId, {
        headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY }
      });
      const sub = await subRes.json();
      if (sub.current_period_end) {
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        await updateAdvisorSubscription(supabaseUrl, supabaseServiceKey, uid, {
          subscription_current_period_end: periodEnd
        });
      }
    }
    res.status(200).end();
    return;
  }

  if (type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const uid = sub.metadata && sub.metadata.user_id;
    if (!uid) {
      res.status(200).end();
      return;
    }
    const status = sub.status === 'active' ? 'active' : sub.cancel_at_period_end ? 'active' : 'canceled';
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
    await updateAdvisorSubscription(supabaseUrl, supabaseServiceKey, uid, {
      subscription_status: status,
      subscription_current_period_end: periodEnd,
      updated_at: new Date().toISOString()
    });
    res.status(200).end();
    return;
  }

  res.status(200).end();
};
