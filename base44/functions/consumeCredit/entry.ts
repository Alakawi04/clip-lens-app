import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Spends credits for one analysis on behalf of the signed-in user.
// Runs with the service role so users can never touch their own balance
// directly — the only way a balance changes is through this function or
// an admin action in the dashboard.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Credit system configuration comes from the public SiteSettings record.
    const settingsPage = await base44.asServiceRole.entities.SiteSettings.filter(
      {},
      { sort: '-updated_date', limit: 1 }
    );
    const cfg = settingsPage.items?.[0] || {};
    const cost =
      typeof cfg.credits_cost === 'number' && cfg.credits_cost > 0
        ? cfg.credits_cost
        : 1;
    const signupBonus =
      typeof cfg.credits_signup === 'number' && cfg.credits_signup >= 0
        ? cfg.credits_signup
        : 3;

    const now = new Date().toISOString();
    const page = await base44.asServiceRole.entities.CreditAccount.filter(
      { user_id: user.id },
      { limit: 1 }
    );
    let account = page.items?.[0] || null;

    // First analysis: create the account with the signup bonus.
    if (!account) {
      account = await base44.asServiceRole.entities.CreditAccount.create({
        user_id: user.id,
        balance: signupBonus,
        plan: 'free',
        history: [{ change: signupBonus, reason: 'signup', date: now }],
      });
    }

    if ((account.balance || 0) < cost) {
      return Response.json({
        ok: false,
        reason: 'insufficient',
        balance: account.balance || 0,
      });
    }

    const history = [...(account.history || []), { change: -cost, reason: 'analysis', date: now }].slice(-50);
    const updated = await base44.asServiceRole.entities.CreditAccount.update(account.id, {
      balance: (account.balance || 0) - cost,
      history,
    });

    return Response.json({ ok: true, balance: updated.balance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}