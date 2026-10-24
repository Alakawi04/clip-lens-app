alter table public.site_settings
  add column if not exists credits_upload_cost numeric not null default 2;

update public.site_settings
set credits_enabled = true,
    credits_cost = 1,
    credits_upload_cost = 2,
    credits_signup = 3,
    credits_pro_price = 20,
    credits_pro_amount = 200;

insert into public.site_settings (
  singleton,
  credits_enabled,
  credits_cost,
  credits_upload_cost,
  credits_signup,
  credits_pro_price,
  credits_pro_amount
)
values (true, true, 1, 2, 3, 20, 200)
on conflict (singleton) do nothing;

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null unique references public.analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  api_started boolean not null default false,
  created_date timestamptz not null default now()
);

alter table public.credit_transactions
  add column if not exists api_started boolean not null default false;

alter table public.credit_transactions enable row level security;
revoke all on public.credit_transactions from anon, authenticated;

create table if not exists public.stripe_subscriptions (
  subscription_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  credits numeric not null check (credits > 0),
  status text not null default 'active',
  updated_date timestamptz not null default now()
);

create table if not exists public.stripe_payments (
  event_id text primary key,
  subscription_id text not null references public.stripe_subscriptions(subscription_id),
  amount_paid integer not null default 0,
  currency text not null default 'usd',
  created_date timestamptz not null default now()
);

alter table public.stripe_subscriptions enable row level security;
alter table public.stripe_payments enable row level security;
revoke all on public.stripe_subscriptions, public.stripe_payments from anon, authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_signup_credits numeric := 3;
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do update set email = excluded.email;

  select greatest(coalesce(credits_signup, 3), 0)
    into v_signup_credits
    from public.site_settings
    where singleton = true;
  v_signup_credits := coalesce(v_signup_credits, 3);

  insert into public.credit_accounts (user_id, balance, history)
  values (
    new.id,
    v_signup_credits,
    jsonb_build_array(jsonb_build_object(
      'change', v_signup_credits,
      'reason', 'signup',
      'date', now()
    ))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

insert into public.credit_accounts (user_id, balance, history)
select
  users.id,
  coalesce(settings.credits_signup, 3),
  jsonb_build_array(jsonb_build_object(
    'change', coalesce(settings.credits_signup, 3),
    'reason', 'signup',
    'date', now()
  ))
from auth.users as users
left join public.site_settings as settings on settings.singleton = true
on conflict (user_id) do nothing;

create or replace function public.consume_credit(p_analysis_id uuid, p_claim_api boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_source_type text;
  v_enabled boolean;
  v_link_cost numeric;
  v_upload_cost numeric;
  v_cost numeric;
  v_balance numeric;
  v_history jsonb;
  v_plan text;
  v_already_charged boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_analysis_id is null then
    raise exception 'Analysis id is required' using errcode = '22023';
  end if;

  select source_type into v_source_type
    from public.analyses
    where id = p_analysis_id and user_id = v_user_id;
  if not found then
    raise exception 'Analysis not found' using errcode = '42501';
  end if;

  select coalesce(credits_enabled, true),
         coalesce(credits_cost, 1),
         coalesce(credits_upload_cost, 2)
    into v_enabled, v_link_cost, v_upload_cost
    from public.site_settings
    where singleton = true;
  v_enabled := coalesce(v_enabled, true);
  v_cost := case when v_source_type = 'upload' then v_upload_cost else v_link_cost end;
  v_cost := greatest(coalesce(v_cost, case when v_source_type = 'upload' then 2 else 1 end), 0);

  insert into public.credit_accounts (user_id, balance, history)
  values (v_user_id, 0, '[]'::jsonb)
  on conflict (user_id) do nothing;

  select balance, history, plan
    into v_balance, v_history, v_plan
    from public.credit_accounts
    where user_id = v_user_id
    for update;

  select true into v_already_charged
    from public.credit_transactions
    where analysis_id = p_analysis_id and user_id = v_user_id
    for update;

  if coalesce(v_already_charged, false) then
    if p_claim_api then
      update public.credit_transactions
        set api_started = true
        where analysis_id = p_analysis_id and user_id = v_user_id and api_started = false;
      if found then
        return jsonb_build_object('ok', true, 'balance', v_balance, 'plan', v_plan, 'already_charged', true);
      end if;
      return jsonb_build_object('ok', false, 'reason', 'already_used', 'balance', v_balance);
    end if;
    return jsonb_build_object(
      'ok', true,
      'already_charged', true,
      'balance', v_balance,
      'plan', v_plan
    );
  end if;

  if not v_enabled then
    if p_claim_api then
      return jsonb_build_object('ok', true, 'disabled', true, 'balance', v_balance, 'plan', v_plan);
    end if;
    return jsonb_build_object('ok', true, 'disabled', true, 'balance', v_balance, 'plan', v_plan);
  end if;

  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'reason', 'insufficient', 'balance', v_balance, 'required', v_cost);
  end if;

  update public.credit_accounts
    set balance = v_balance - v_cost,
        history = (
          select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
          from jsonb_array_elements(
            coalesce(v_history, '[]'::jsonb) || jsonb_build_array(
              jsonb_build_object(
                'change', -v_cost,
                'reason', case when v_source_type = 'upload' then 'video_upload_analysis' else 'youtube_link_analysis' end,
                'analysis_id', p_analysis_id,
                'date', now()
              )
            )
          ) with ordinality as items(entry, ordinal)
          where ordinal > jsonb_array_length(
            coalesce(v_history, '[]'::jsonb) || jsonb_build_array(
              jsonb_build_object('change', -v_cost, 'date', now())
            )
          ) - 50
        ),
        updated_date = now()
    where user_id = v_user_id
    returning balance into v_balance;

  insert into public.credit_transactions (analysis_id, user_id, amount, api_started)
  values (p_analysis_id, v_user_id, v_cost, p_claim_api);

  return jsonb_build_object('ok', true, 'balance', v_balance, 'plan', v_plan, 'charged', v_cost);
end;
$$;

drop function if exists public.consume_credit();
revoke all on function public.consume_credit(uuid, boolean) from public, anon;
grant execute on function public.consume_credit(uuid, boolean) to authenticated;

create or replace function public.grant_subscription_credits(
  p_event_id text,
  p_subscription_id text,
  p_user_id uuid,
  p_credits numeric,
  p_amount_paid integer,
  p_currency text,
  p_status text default 'active'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance numeric;
  v_history jsonb;
begin
  if p_event_id is null or p_subscription_id is null or p_user_id is null
     or p_credits is null or p_credits <= 0 then
    raise exception 'Invalid paid subscription event' using errcode = '22023';
  end if;

  insert into public.stripe_subscriptions (subscription_id, user_id, credits, status, updated_date)
  values (p_subscription_id, p_user_id, p_credits, coalesce(p_status, 'active'), now())
  on conflict (subscription_id) do update
    set credits = excluded.credits,
        status = excluded.status,
        updated_date = now()
    where public.stripe_subscriptions.user_id = excluded.user_id;

  if not exists (
    select 1 from public.stripe_subscriptions
    where subscription_id = p_subscription_id and user_id = p_user_id
  ) then
    raise exception 'Subscription is already linked to another account' using errcode = '23505';
  end if;

  insert into public.credit_accounts (user_id, balance, history)
  values (p_user_id, 0, '[]'::jsonb)
  on conflict (user_id) do nothing;

  insert into public.stripe_payments (event_id, subscription_id, amount_paid, currency)
  values (p_event_id, p_subscription_id, greatest(coalesce(p_amount_paid, 0), 0), lower(coalesce(p_currency, 'usd')))
  on conflict (event_id) do nothing;
  if not found then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  select balance, history into v_balance, v_history
    from public.credit_accounts where user_id = p_user_id for update;

  update public.credit_accounts
    set plan = 'pro',
        balance = v_balance + p_credits,
        history = (
          select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
          from jsonb_array_elements(
            coalesce(v_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
              'change', p_credits,
              'reason', 'stripe_subscription_payment',
              'event_id', p_event_id,
              'date', now()
            ))
          ) with ordinality as items(entry, ordinal)
          where ordinal > jsonb_array_length(coalesce(v_history, '[]'::jsonb) || jsonb_build_array('{}'::jsonb)) - 50
        ),
        updated_date = now()
    where user_id = p_user_id
    returning balance into v_balance;

  return jsonb_build_object('ok', true, 'balance', v_balance);
end;
$$;

create or replace function public.grant_subscription_renewal(
  p_event_id text,
  p_subscription_id text,
  p_amount_paid integer,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_credits numeric;
  v_balance numeric;
  v_history jsonb;
begin
  select user_id, credits into v_user_id, v_credits
    from public.stripe_subscriptions
    where subscription_id = p_subscription_id and status = 'active';
  if not found then
    raise exception 'Active subscription not found' using errcode = 'P0002';
  end if;

  insert into public.stripe_payments (event_id, subscription_id, amount_paid, currency)
  values (p_event_id, p_subscription_id, greatest(coalesce(p_amount_paid, 0), 0), lower(coalesce(p_currency, 'usd')))
  on conflict (event_id) do nothing;
  if not found then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  select balance, history into v_balance, v_history
    from public.credit_accounts where user_id = v_user_id for update;
  update public.credit_accounts
    set balance = v_balance + v_credits,
        plan = 'pro',
        history = (
          select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
          from jsonb_array_elements(
            coalesce(v_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
              'change', v_credits,
              'reason', 'stripe_subscription_renewal',
              'event_id', p_event_id,
              'date', now()
            ))
          ) with ordinality as items(entry, ordinal)
          where ordinal > jsonb_array_length(coalesce(v_history, '[]'::jsonb) || jsonb_build_array('{}'::jsonb)) - 50
        ),
        updated_date = now()
    where user_id = v_user_id
    returning balance into v_balance;
  return jsonb_build_object('ok', true, 'balance', v_balance);
end;
$$;

create or replace function public.cancel_subscription(p_subscription_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  update public.stripe_subscriptions
    set status = 'canceled', updated_date = now()
    where subscription_id = p_subscription_id
    returning user_id into v_user_id;
  if v_user_id is not null then
    update public.credit_accounts set plan = 'free', updated_date = now()
      where user_id = v_user_id;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.grant_subscription_credits(text, text, uuid, numeric, integer, text, text) from public, anon, authenticated;
revoke all on function public.grant_subscription_renewal(text, text, integer, text) from public, anon, authenticated;
revoke all on function public.cancel_subscription(text) from public, anon, authenticated;
grant execute on function public.grant_subscription_credits(text, text, uuid, numeric, integer, text, text) to service_role;
grant execute on function public.grant_subscription_renewal(text, text, integer, text) to service_role;
grant execute on function public.cancel_subscription(text) to service_role;
