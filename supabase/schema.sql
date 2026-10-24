-- ClipLens consolidated Supabase setup.
-- Safe to re-run: tables, columns, triggers, policies, and buckets are guarded
-- or replaced. The ordered files in supabase/migrations remain the migration
-- history used by the Supabase CLI.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('upload', 'youtube')),
  source_label text not null,
  source_url text not null default '',
  status text not null default 'uploading'
    check (status in ('uploading', 'scenes', 'titles', 'preparing', 'completed', 'failed')),
  progress numeric not null default 0,
  score numeric,
  summary text,
  thumbnail_url text,
  title_suggestions jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  duration_seconds numeric,
  youtube_stats jsonb,
  error_message text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index if not exists analyses_user_created_idx on public.analyses (user_id, created_date desc);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null unique default true check (singleton),
  brand_name text,
  logo_image_url text,
  accent_color text,
  hero_image_url text,
  hero_images jsonb,
  tool_analyze_image_url text,
  tool_review_image_url text,
  before_image_url text,
  after_image_url text,
  gallery_images jsonb,
  texts jsonb,
  credits_enabled boolean,
  credits_cost numeric,
  credits_upload_cost numeric not null default 2,
  credits_signup numeric,
  credits_pro_price numeric,
  credits_pro_amount numeric,
  particles_style text not null default 'neural',
  particle_count integer not null default 120,
  particle_size numeric not null default 1.55,
  updated_date timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists credits_upload_cost numeric not null default 2,
  add column if not exists particles_style text not null default 'neural',
  add column if not exists particle_count integer not null default 120,
  add column if not exists particle_size numeric not null default 1.55;

alter table public.site_settings
  alter column particle_count set default 120,
  alter column particle_size set default 1.55;

alter table public.site_settings
  drop constraint if exists site_settings_particles_style_check,
  drop constraint if exists site_settings_particle_count_check,
  drop constraint if exists site_settings_particle_size_check;
alter table public.site_settings
  add constraint site_settings_particles_style_check check (particles_style in ('none', 'neural')),
  add constraint site_settings_particle_count_check check (particle_count between 12 and 360),
  add constraint site_settings_particle_size_check check (particle_size between 0.45 and 4.8);

create table if not exists public.credit_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric not null default 0 check (balance >= 0),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  history jsonb not null default '[]'::jsonb,
  updated_date timestamptz not null default now()
);

create table if not exists public.upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan text not null default 'pro',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null unique references public.analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  api_started boolean not null default false,
  created_date timestamptz not null default now()
);
alter table public.credit_transactions add column if not exists api_started boolean not null default false;

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

create or replace function public.set_updated_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_date := now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

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
    jsonb_build_array(jsonb_build_object('change', v_signup_credits, 'reason', 'signup', 'date', now()))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

drop trigger if exists analyses_set_updated_date on public.analyses;
create trigger analyses_set_updated_date before update on public.analyses
  for each row execute procedure public.set_updated_date();
drop trigger if exists site_settings_set_updated_date on public.site_settings;
create trigger site_settings_set_updated_date before update on public.site_settings
  for each row execute procedure public.set_updated_date();
drop trigger if exists credit_accounts_set_updated_date on public.credit_accounts;
create trigger credit_accounts_set_updated_date before update on public.credit_accounts
  for each row execute procedure public.set_updated_date();
drop trigger if exists upgrade_requests_set_updated_date on public.upgrade_requests;
create trigger upgrade_requests_set_updated_date before update on public.upgrade_requests
  for each row execute procedure public.set_updated_date();

update public.site_settings
set credits_enabled = coalesce(credits_enabled, true),
    credits_cost = coalesce(credits_cost, 1),
    credits_upload_cost = coalesce(credits_upload_cost, 2),
    credits_signup = coalesce(credits_signup, 3),
    credits_pro_price = coalesce(credits_pro_price, 20),
    credits_pro_amount = coalesce(credits_pro_amount, 200);
insert into public.site_settings (
  singleton, credits_enabled, credits_cost, credits_upload_cost,
  credits_signup, credits_pro_price, credits_pro_amount
)
values (true, true, 1, 2, 3, 20, 200)
on conflict (singleton) do nothing;

insert into public.credit_accounts (user_id, balance, history)
select users.id, coalesce(settings.credits_signup, 3),
       jsonb_build_array(jsonb_build_object(
         'change', coalesce(settings.credits_signup, 3), 'reason', 'signup', 'date', now()
       ))
from auth.users as users
left join public.site_settings as settings on settings.singleton = true
on conflict (user_id) do nothing;

-- Retain the project's existing initial admin assignment.
update public.profiles
set role = 'admin'
where user_id = (select id from auth.users where email = 'abedbaitam121@gmail.com');

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

  select source_type into v_source_type from public.analyses
    where id = p_analysis_id and user_id = v_user_id;
  if not found then
    raise exception 'Analysis not found' using errcode = '42501';
  end if;

  select coalesce(credits_enabled, true), coalesce(credits_cost, 1), coalesce(credits_upload_cost, 2)
    into v_enabled, v_link_cost, v_upload_cost
    from public.site_settings where singleton = true;
  v_enabled := coalesce(v_enabled, true);
  v_cost := case when v_source_type = 'upload' then v_upload_cost else v_link_cost end;
  v_cost := greatest(coalesce(v_cost, case when v_source_type = 'upload' then 2 else 1 end), 0);

  insert into public.credit_accounts (user_id, balance, history)
  values (v_user_id, 0, '[]'::jsonb) on conflict (user_id) do nothing;
  select balance, history, plan into v_balance, v_history, v_plan
    from public.credit_accounts where user_id = v_user_id for update;

  select true into v_already_charged from public.credit_transactions
    where analysis_id = p_analysis_id and user_id = v_user_id for update;
  if coalesce(v_already_charged, false) then
    if p_claim_api then
      update public.credit_transactions set api_started = true
        where analysis_id = p_analysis_id and user_id = v_user_id and api_started = false;
      if found then
        return jsonb_build_object('ok', true, 'balance', v_balance, 'plan', v_plan, 'already_charged', true);
      end if;
      return jsonb_build_object('ok', false, 'reason', 'already_used', 'balance', v_balance);
    end if;
    return jsonb_build_object('ok', true, 'already_charged', true, 'balance', v_balance, 'plan', v_plan);
  end if;

  if not v_enabled then
    return jsonb_build_object('ok', true, 'disabled', true, 'balance', v_balance, 'plan', v_plan);
  end if;
  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'reason', 'insufficient', 'balance', v_balance, 'required', v_cost);
  end if;

  update public.credit_accounts
    set balance = v_balance - v_cost,
        history = (
          select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
          from jsonb_array_elements(coalesce(v_history, '[]'::jsonb) || jsonb_build_array(
            jsonb_build_object(
              'change', -v_cost,
              'reason', case when v_source_type = 'upload' then 'video_upload_analysis' else 'youtube_link_analysis' end,
              'analysis_id', p_analysis_id,
              'date', now()
            )
          )) with ordinality as items(entry, ordinal)
          where ordinal > jsonb_array_length(coalesce(v_history, '[]'::jsonb) || jsonb_build_array('{}'::jsonb)) - 50
        ),
        updated_date = now()
    where user_id = v_user_id returning balance into v_balance;

  insert into public.credit_transactions (analysis_id, user_id, amount, api_started)
    values (p_analysis_id, v_user_id, v_cost, p_claim_api);
  return jsonb_build_object('ok', true, 'balance', v_balance, 'plan', v_plan, 'charged', v_cost);
end;
$$;

drop function if exists public.consume_credit();
revoke all on function public.consume_credit(uuid, boolean) from public, anon;
grant execute on function public.consume_credit(uuid, boolean) to authenticated;

create or replace function public.grant_subscription_credits(
  p_event_id text, p_subscription_id text, p_user_id uuid, p_credits numeric,
  p_amount_paid integer, p_currency text, p_status text default 'active'
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
  if p_event_id is null or p_subscription_id is null or p_user_id is null or p_credits is null or p_credits <= 0 then
    raise exception 'Invalid paid subscription event' using errcode = '22023';
  end if;

  insert into public.stripe_subscriptions (subscription_id, user_id, credits, status, updated_date)
  values (p_subscription_id, p_user_id, p_credits, coalesce(p_status, 'active'), now())
  on conflict (subscription_id) do update
    set credits = excluded.credits, status = excluded.status, updated_date = now()
    where public.stripe_subscriptions.user_id = excluded.user_id;
  if not exists (select 1 from public.stripe_subscriptions where subscription_id = p_subscription_id and user_id = p_user_id) then
    raise exception 'Subscription is already linked to another account' using errcode = '23505';
  end if;

  insert into public.credit_accounts (user_id, balance, history) values (p_user_id, 0, '[]'::jsonb)
    on conflict (user_id) do nothing;
  insert into public.stripe_payments (event_id, subscription_id, amount_paid, currency)
  values (p_event_id, p_subscription_id, greatest(coalesce(p_amount_paid, 0), 0), lower(coalesce(p_currency, 'usd')))
    on conflict (event_id) do nothing;
  if not found then return jsonb_build_object('ok', true, 'duplicate', true); end if;

  select balance, history into v_balance, v_history from public.credit_accounts where user_id = p_user_id for update;
  update public.credit_accounts
    set plan = 'pro', balance = v_balance + p_credits,
        history = (
          select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
          from jsonb_array_elements(coalesce(v_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
            'change', p_credits, 'reason', 'stripe_subscription_payment', 'event_id', p_event_id, 'date', now()
          ))) with ordinality as items(entry, ordinal)
          where ordinal > jsonb_array_length(coalesce(v_history, '[]'::jsonb) || jsonb_build_array('{}'::jsonb)) - 50
        ),
        updated_date = now()
    where user_id = p_user_id returning balance into v_balance;
  return jsonb_build_object('ok', true, 'balance', v_balance);
end;
$$;

create or replace function public.grant_subscription_renewal(
  p_event_id text, p_subscription_id text, p_amount_paid integer, p_currency text
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
  select user_id, credits into v_user_id, v_credits from public.stripe_subscriptions
    where subscription_id = p_subscription_id and status = 'active';
  if not found then raise exception 'Active subscription not found' using errcode = 'P0002'; end if;

  insert into public.stripe_payments (event_id, subscription_id, amount_paid, currency)
  values (p_event_id, p_subscription_id, greatest(coalesce(p_amount_paid, 0), 0), lower(coalesce(p_currency, 'usd')))
    on conflict (event_id) do nothing;
  if not found then return jsonb_build_object('ok', true, 'duplicate', true); end if;

  select balance, history into v_balance, v_history from public.credit_accounts where user_id = v_user_id for update;
  update public.credit_accounts
    set balance = v_balance + v_credits, plan = 'pro',
        history = (
          select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
          from jsonb_array_elements(coalesce(v_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
            'change', v_credits, 'reason', 'stripe_subscription_renewal', 'event_id', p_event_id, 'date', now()
          ))) with ordinality as items(entry, ordinal)
          where ordinal > jsonb_array_length(coalesce(v_history, '[]'::jsonb) || jsonb_build_array('{}'::jsonb)) - 50
        ),
        updated_date = now()
    where user_id = v_user_id returning balance into v_balance;
  return jsonb_build_object('ok', true, 'balance', v_balance);
end;
$$;

create or replace function public.cancel_subscription(p_subscription_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_user_id uuid;
begin
  update public.stripe_subscriptions set status = 'canceled', updated_date = now()
    where subscription_id = p_subscription_id returning user_id into v_user_id;
  if v_user_id is not null then
    update public.credit_accounts set plan = 'free', updated_date = now() where user_id = v_user_id;
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

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.site_settings enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.upgrade_requests enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.stripe_subscriptions enable row level security;
alter table public.stripe_payments enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.analyses to authenticated;
grant select on public.profiles to authenticated;
grant insert, update on public.site_settings to authenticated;
grant select, insert, update, delete on public.credit_accounts to authenticated;
grant select, insert, update on public.upgrade_requests to authenticated;
revoke all on public.credit_transactions, public.stripe_subscriptions, public.stripe_payments from anon, authenticated;

drop policy if exists "Users read their profile; admins read all" on public.profiles;
create policy "Users read their profile; admins read all" on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Users read own analyses; admins read all" on public.analyses;
create policy "Users read own analyses; admins read all" on public.analyses for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Users create own analyses" on public.analyses;
create policy "Users create own analyses" on public.analyses for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Users update own analyses; admins update all" on public.analyses;
create policy "Users update own analyses; admins update all" on public.analyses for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Users delete own analyses; admins delete all" on public.analyses;
create policy "Users delete own analyses; admins delete all" on public.analyses for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Anyone can read site settings" on public.site_settings;
create policy "Anyone can read site settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Users read own credit account; admins read all" on public.credit_accounts;
create policy "Users read own credit account; admins read all" on public.credit_accounts for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Admins manage credit accounts" on public.credit_accounts;
create policy "Admins manage credit accounts" on public.credit_accounts for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Users read own upgrade requests; admins read all" on public.upgrade_requests;
create policy "Users read own upgrade requests; admins read all" on public.upgrade_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "Users create own upgrade requests" on public.upgrade_requests;
create policy "Users create own upgrade requests" on public.upgrade_requests for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Admins manage upgrade requests" on public.upgrade_requests;
create policy "Admins manage upgrade requests" on public.upgrade_requests for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do update set public = excluded.public;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnail-reference-temp', 'thumbnail-reference-temp', false, 1000000, array['image/jpeg']::text[])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
grant select on storage.objects to anon, authenticated;
grant insert on storage.objects to authenticated;
drop policy if exists "Public can view uploaded assets" on storage.objects;
create policy "Public can view uploaded assets" on storage.objects for select to anon, authenticated
  using (bucket_id = 'public-assets');
drop policy if exists "Admins can upload assets" on storage.objects;
create policy "Admins can upload assets" on storage.objects for insert to authenticated
  with check (bucket_id = 'public-assets' and (select public.is_admin()));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'credit_accounts'
     ) then
    execute 'alter publication supabase_realtime add table public.credit_accounts';
  end if;
end;
$$;

commit;
