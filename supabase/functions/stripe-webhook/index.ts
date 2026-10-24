const encoder = new TextEncoder();

function hexToBytes(hex: string) {
  if (!/^[\da-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  return Uint8Array.from(hex.match(/.{2}/g) || [], (byte) => Number.parseInt(byte, 16));
}

async function verifySignature(rawBody: string, header: string, secret: string) {
  const values = new Map<string, string[]>();
  for (const part of header.split(',')) {
    const [key, value] = part.split('=', 2);
    if (key && value) values.set(key, [...(values.get(key) || []), value]);
  }
  const timestamp = values.get('t')?.[0];
  const signatures = values.get('v1') || [];
  const timestampNumber = Number(timestamp);
  if (!timestamp || !Number.isInteger(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) {
    return false;
  }
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const signedPayload = encoder.encode(`${timestamp}.${rawBody}`);
  for (const signature of signatures) {
    const bytes = hexToBytes(signature);
    if (bytes && await crypto.subtle.verify('HMAC', key, bytes, signedPayload)) return true;
  }
  return false;
}

async function callRpc(
  supabaseUrl: string,
  serviceKey: string,
  functionName: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    console.error('Stripe webhook credit RPC failed', { functionName, status: response.status });
    throw new Error('Credit fulfillment failed');
  }
  return response.json();
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!webhookSecret || !supabaseUrl || !serviceKey) {
    return new Response('Webhook not configured', { status: 503 });
  }

  const rawBody = await request.text();
  let signatureValid = false;
  try {
    signatureValid = await verifySignature(rawBody, request.headers.get('stripe-signature') || '', webhookSecret);
  } catch {
    signatureValid = false;
  }
  if (!signatureValid) return new Response('Invalid signature', { status: 400 });

  let event: { id?: string; type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid event', { status: 400 });
  }
  const object = event.data?.object;

  try {
    if (event.type === 'checkout.session.completed' && object?.mode === 'subscription' && object.payment_status === 'paid') {
      const userId = typeof object.client_reference_id === 'string' ? object.client_reference_id : '';
      const subscriptionId = typeof object.subscription === 'string' ? object.subscription : '';
      const metadata = object.metadata as Record<string, unknown> | undefined;
      const credits = Number(metadata?.credits);
      if (!userId || !subscriptionId || !Number.isInteger(credits) || credits <= 0 || !event.id) {
        return new Response('Invalid paid checkout metadata', { status: 400 });
      }
      await callRpc(supabaseUrl, serviceKey, 'grant_subscription_credits', {
        p_event_id: event.id,
        p_subscription_id: subscriptionId,
        p_user_id: userId,
        p_credits: credits,
        p_amount_paid: Number(object.amount_total) || 0,
        p_currency: typeof object.currency === 'string' ? object.currency : 'usd',
        p_status: 'active',
      });
    } else if (event.type === 'invoice.paid') {
      const subscriptionId = typeof object?.subscription === 'string'
        ? object.subscription
        : typeof (object?.parent as Record<string, unknown> | undefined)?.subscription_details === 'object'
          ? String(((object?.parent as Record<string, unknown>).subscription_details as Record<string, unknown>).subscription || '')
          : '';
      const billingReason = object?.billing_reason;
      if (subscriptionId && billingReason === 'subscription_cycle' && event.id) {
        await callRpc(supabaseUrl, serviceKey, 'grant_subscription_renewal', {
          p_event_id: event.id,
          p_subscription_id: subscriptionId,
          p_amount_paid: Number(object?.amount_paid) || 0,
          p_currency: typeof object?.currency === 'string' ? object.currency : 'usd',
        });
      }
    } else if (event.type === 'customer.subscription.deleted' && typeof object?.id === 'string') {
      await callRpc(supabaseUrl, serviceKey, 'cancel_subscription', {
        p_subscription_id: object.id,
      });
    }
  } catch {
    return new Response('Webhook processing failed', { status: 500 });
  }

  return Response.json({ received: true });
});
