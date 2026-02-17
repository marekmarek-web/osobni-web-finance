/**
 * Vercel Serverless API – vytvoření Stripe Checkout Session pro měsíční předplatné.
 * POST /api/create-checkout
 * Headers: Authorization: Bearer <Supabase JWT>
 * Body: { success_url: string, cancel_url: string }
 * ENV: STRIPE_SECRET_KEY, STRIPE_PRICE_ID (price_xxx měsíční), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

async function getSupabaseUser(accessToken, supabaseUrl) {
  const res = await fetch(supabaseUrl.replace(/\/$/, '') + '/auth/v1/user', {
    headers: { Authorization: 'Bearer ' + accessToken, apikey: process.env.SUPABASE_ANON_KEY || '' }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.id ? data : null;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = req.headers.authorization;
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Chybí přihlášení.' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !priceId) {
    return res.status(500).json({ error: 'Není nastaveno Stripe (STRIPE_SECRET_KEY, STRIPE_PRICE_ID).' });
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Není nastaven Supabase.' });
  }

  const body = typeof req.body === 'object' ? req.body : {};
  const successUrl = body.success_url || (origin + '/fp-poradce-vstup.html?success=1');
  const cancelUrl = body.cancel_url || origin;

  let user;
  try {
    const userRes = await fetch(supabaseUrl.replace(/\/$/, '') + '/auth/v1/user', {
      headers: {
        Authorization: 'Bearer ' + token,
        apikey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    if (!userRes.ok) {
      return res.status(401).json({ error: 'Neplatné přihlášení.' });
    }
    const userData = await userRes.json();
    user = userData.id ? userData : null;
  } catch (e) {
    return res.status(401).json({ error: 'Neplatné přihlášení.' });
  }

  if (!user || !user.id) {
    return res.status(401).json({ error: 'Uživatel nenalezen.' });
  }

  let customerId = null;
  try {
    const advRes = await fetch(
      supabaseUrl.replace(/\/$/, '') + '/rest/v1/advisors?user_id=eq.' + user.id + '&select=stripe_customer_id',
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: 'Bearer ' + supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      }
    );
    const advData = await advRes.json();
    if (Array.isArray(advData) && advData[0] && advData[0].stripe_customer_id) {
      customerId = advData[0].stripe_customer_id;
    }
  } catch (_) {}

  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('success_url', successUrl);
  params.set('cancel_url', cancelUrl);
  params.set('client_reference_id', user.id);
  params.set('line_items[0][price]', priceId);
  params.set('line_items[0][quantity]', '1');
  params.set('subscription_data[metadata][user_id]', user.id);
  params.set('locale', 'cs');
  if (customerId) params.set('customer', customerId);
  else if (user.email) params.set('customer_email', user.email);

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + stripeSecret,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });

  const session = await stripeRes.json();
  if (session.error) {
    return res.status(400).json({ error: session.error.message || 'Stripe chyba.' });
  }
  if (!session.url) {
    return res.status(500).json({ error: 'Stripe nevrátil URL.' });
  }

  res.status(200).json({ url: session.url });
};
