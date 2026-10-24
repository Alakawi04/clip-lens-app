create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

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

create table public.analyses (
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

create index analyses_user_created_idx on public.analyses (user_id, created_date desc);

create table public.site_settings (
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
  credits_signup numeric,
  credits_pro_price numeric,
  credits_pro_amount numeric,
  updated_date timestamptz not null default now()
);

create table public.credit_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  balance numeric not null default 0 check (balance >= 0),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  history jsonb not null default '[]'::jsonb,
  updated_date timestamptz not null default now()
);

create table public.upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan text not null default 'pro',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create trigger analyses_set_updated_date before update on public.analyses
  for each row execute procedure public.set_updated_date();
create trigger site_settings_set_updated_date before update on public.site_settings
  for each row execute procedure public.set_updated_date();
create trigger credit_accounts_set_updated_date before update on public.credit_accounts
  for each row execute procedure public.set_updated_date();
create trigger upgrade_requests_set_updated_date before update on public.upgrade_requests
  for each row execute procedure public.set_updated_date();

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do update set public = excluded.public;

create policy "Public can view uploaded assets"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'public-assets');
create policy "Admins can upload assets"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'public-assets' and (select public.is_admin()));

alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.site_settings enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.upgrade_requests enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant select, insert, update, delete on public.analyses to authenticated;
grant select on public.profiles to authenticated;
grant insert, update on public.site_settings to authenticated;
grant select, insert, update, delete on public.credit_accounts to authenticated;
grant select, insert, update on public.upgrade_requests to authenticated;
grant select on storage.objects to anon, authenticated;
grant insert on storage.objects to authenticated;

create policy "Users read their profile; admins read all"
  on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Users read own analyses; admins read all"
  on public.analyses for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Users create own analyses"
  on public.analyses for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users update own analyses; admins update all"
  on public.analyses for update to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()))
  with check (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Users delete own analyses; admins delete all"
  on public.analyses for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Anyone can read site settings"
  on public.site_settings for select to anon, authenticated using (true);
create policy "Admins manage site settings"
  on public.site_settings for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Users read own credit account; admins read all"
  on public.credit_accounts for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins manage credit accounts"
  on public.credit_accounts for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
create policy "Users read own upgrade requests; admins read all"
  on public.upgrade_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Users create own upgrade requests"
  on public.upgrade_requests for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Admins manage upgrade requests"
  on public.upgrade_requests for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create or replace function public.consume_credit()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_enabled boolean := false;
  v_cost numeric := 1;
  v_bonus numeric := 3;
  v_balance numeric;
  v_history jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select credits_enabled, credits_cost, credits_signup
    into v_enabled, v_cost, v_bonus
    from public.site_settings
    order by updated_date desc
    limit 1;
  v_enabled := coalesce(v_enabled, false);
  if not v_enabled then
    return jsonb_build_object('ok', true, 'disabled', true);
  end if;
  v_cost := coalesce(v_cost, 1);
  v_bonus := coalesce(v_bonus, 3);
  v_cost := greatest(v_cost, 0);
  v_bonus := greatest(v_bonus, 0);

  insert into public.credit_accounts (user_id, balance, history)
  values (v_user_id, v_bonus, jsonb_build_array(
    jsonb_build_object('change', v_bonus, 'reason', 'signup', 'date', now())
  ))
  on conflict (user_id) do nothing;

  select balance, history into v_balance, v_history
    from public.credit_accounts where user_id = v_user_id for update;
  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'reason', 'insufficient', 'balance', v_balance);
  end if;

  update public.credit_accounts
    set balance = v_balance - v_cost,
        history = (
          select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
          from jsonb_array_elements(
            coalesce(v_history, '[]'::jsonb) || jsonb_build_array(
              jsonb_build_object('change', -v_cost, 'reason', 'analysis', 'date', now())
            )
          ) with ordinality as items(entry, ordinal)
          where ordinal > jsonb_array_length(
            coalesce(v_history, '[]'::jsonb) || jsonb_build_array(
              jsonb_build_object('change', -v_cost, 'reason', 'analysis', 'date', now())
            )
          ) - 50
        ),
        updated_date = now()
    where user_id = v_user_id
    returning balance into v_balance;

  return jsonb_build_object('ok', true, 'balance', v_balance);
end;
$$;

grant execute on function public.consume_credit() to authenticated;

alter publication supabase_realtime add table public.credit_accounts;


UPDATE public.profiles
SET role = 'admin'
WHERE user_id = (
  SELECT id
  FROM auth.users
  WHERE email = 'abedbaitam121@gmail.com'
);