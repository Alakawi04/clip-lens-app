const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const siteUrlValue = Deno.env.get('SITE_URL');
  if (!stripeKey || !supabaseUrl || !siteUrlValue) {
    return jsonResponse({ error: 'billing_not_configured' }, 503);
  }

  const authorization = request.headers.get('Authorization');
  const publishableKey = request.headers.get('apikey');
  if (!authorization || !publishableKey) return jsonResponse({ error: 'authentication_required' }, 401);

  let siteUrl: URL;
  try {
    siteUrl = new URL(siteUrlValue);
    const isLocalDevelopment = siteUrl.protocol === 'http:' && siteUrl.hostname === 'localhost';
    if (siteUrl.protocol !== 'https:' && !isLocalDevelopment) throw new Error('Invalid site URL');
    if (siteUrl.username || siteUrl.password) throw new Error('Invalid site URL');
    siteUrl.search = '';
    siteUrl.hash = '';
  } catch {
    return jsonResponse({ error: 'billing_not_configured' }, 503);
  }

  let user: { id?: string; email?: string };
  try {
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: authorization, apikey: publishableKey },
      signal: AbortSignal.timeout(10000),
    });
    if (!userResponse.ok) return jsonResponse({ error: 'authentication_required' }, 401);
    user = await userResponse.json();
  } catch {
    return jsonResponse({ error: 'authentication_service_unavailable' }, 502);
  }
  if (typeof user.id !== 'string') return jsonResponse({ error: 'authentication_required' }, 401);

  let settingsResponse: Response;
  try {
    settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?select=credits_pro_price,credits_pro_amount&singleton=eq.true&limit=1`,
      {
        headers: { Authorization: authorization, apikey: publishableKey },
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return jsonResponse({ error: 'billing_settings_unavailable' }, 502);
  }
  if (!settingsResponse.ok) return jsonResponse({ error: 'billing_settings_unavailable' }, 502);
  const settings = (await settingsResponse.json())?.[0];
  const price = Number(settings?.credits_pro_price);
  const credits = Number(settings?.credits_pro_amount);
  if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(credits) || credits <= 0) {
    return jsonResponse({ error: 'billing_settings_invalid' }, 503);
  }

  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('success_url', `${siteUrl.origin}/?purchase=success`);
  form.set('cancel_url', `${siteUrl.origin}/?purchase=cancelled#pricing`);
  form.set('client_reference_id', user.id);
  form.set('metadata[credits]', String(credits));
  form.set('metadata[user_id]', user.id);
  if (user.email) form.set('customer_email', user.email);
  form.set('line_items[0][quantity]', '1');
  form.set('line_items[0][price_data][currency]', 'usd');
  form.set('line_items[0][price_data][unit_amount]', String(Math.round(price * 100)));
  form.set('line_items[0][price_data][recurring][interval]', 'month');
  form.set('line_items[0][price_data][product_data][name]', `ClipLens Pro — ${credits} credits`);
  form.set('line_items[0][price_data][product_data][description]', 'Monthly AI creator tools and credit balance');
  form.set('subscription_data[metadata][user_id]', user.id);
  form.set('subscription_data[metadata][credits]', String(credits));

  try {
    const checkoutResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
      signal: AbortSignal.timeout(20000),
    });
    const checkout = await checkoutResponse.json();
    if (!checkoutResponse.ok || typeof checkout.url !== 'string') {
      console.error('Stripe checkout session creation failed', { status: checkoutResponse.status });
      return jsonResponse({ error: 'checkout_creation_failed' }, 502);
    }
    return jsonResponse({ url: checkout.url });
  } catch {
    return jsonResponse({ error: 'checkout_service_unavailable' }, 502);
  }
});
