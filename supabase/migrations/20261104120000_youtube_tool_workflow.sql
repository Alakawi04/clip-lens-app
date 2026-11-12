begin;

alter table public.site_settings
  add column if not exists credits_review_cost numeric not null default 2,
  add column if not exists credits_titles_cost numeric not null default 1,
  add column if not exists credits_thumbnail_cost numeric not null default 3;

update public.site_settings
set credits_review_cost = coalesce(credits_review_cost, 2),
    credits_titles_cost = coalesce(credits_titles_cost, 1),
    credits_thumbnail_cost = coalesce(credits_thumbnail_cost, 3);

create table if not exists public.credit_tool_transactions (
  request_id uuid primary key,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null check (tool in ('review', 'titles', 'thumbnail')),
  amount numeric not null check (amount >= 0),
  created_date timestamptz not null default now()
);

alter table public.credit_tool_transactions enable row level security;
revoke all on public.credit_tool_transactions from anon, authenticated;
grant select on public.credit_tool_transactions to authenticated;
drop policy if exists "Users read own tool credit transactions" on public.credit_tool_transactions;
create policy "Users read own tool credit transactions"
  on public.credit_tool_transactions for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.consume_tool_credit(
  p_analysis_id uuid,
  p_tool text,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_owned boolean;
  v_enabled boolean;
  v_cost numeric;
  v_balance numeric;
  v_history jsonb;
  v_existing public.credit_tool_transactions%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_analysis_id is null or p_request_id is null or p_tool is null or p_tool not in ('review', 'titles', 'thumbnail') then
    raise exception 'Invalid tool credit request' using errcode = '22023';
  end if;

  select exists (
    select 1 from public.analyses
    where id = p_analysis_id and user_id = v_user_id and source_type = 'youtube'
  ) into v_owned;
  if not v_owned then
    raise exception 'Analysis not found' using errcode = '42501';
  end if;

  insert into public.credit_accounts (user_id, balance, history)
  values (v_user_id, 0, '[]'::jsonb)
  on conflict (user_id) do nothing;
  select balance, history into v_balance, v_history
    from public.credit_accounts where user_id = v_user_id for update;

  select * into v_existing from public.credit_tool_transactions
    where request_id = p_request_id for update;
  if found then
    if v_existing.user_id <> v_user_id or v_existing.analysis_id <> p_analysis_id or v_existing.tool <> p_tool then
      raise exception 'Credit request id was already used' using errcode = '22023';
    end if;
    return jsonb_build_object('ok', true, 'already_charged', true, 'balance', v_balance, 'charged', v_existing.amount);
  end if;

  select coalesce(credits_enabled, true),
    case p_tool
      when 'review' then coalesce(credits_review_cost, 2)
      when 'titles' then coalesce(credits_titles_cost, 1)
      when 'thumbnail' then coalesce(credits_thumbnail_cost, 3)
    end
    into v_enabled, v_cost
    from public.site_settings where singleton = true;
  v_enabled := coalesce(v_enabled, true);
  v_cost := greatest(coalesce(v_cost, case p_tool when 'review' then 2 when 'titles' then 1 else 3 end), 0);
  if not v_enabled then v_cost := 0; end if;

  if v_balance < v_cost then
    return jsonb_build_object('ok', false, 'reason', 'insufficient', 'balance', v_balance, 'required', v_cost);
  end if;

  update public.credit_accounts
  set balance = v_balance - v_cost,
      history = case when v_cost > 0 then (
        select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
        from jsonb_array_elements(coalesce(v_history, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object(
            'change', -v_cost,
            'reason', 'tool_' || p_tool,
            'tool', p_tool,
            'analysis_id', p_analysis_id,
            'request_id', p_request_id,
            'date', now()
          )
        )) with ordinality as items(entry, ordinal)
        where ordinal > jsonb_array_length(coalesce(v_history, '[]'::jsonb) || jsonb_build_array('{}'::jsonb)) - 50
      ) else coalesce(v_history, '[]'::jsonb) end,
      updated_date = now()
  where user_id = v_user_id returning balance into v_balance;

  insert into public.credit_tool_transactions (request_id, analysis_id, user_id, tool, amount)
  values (p_request_id, p_analysis_id, v_user_id, p_tool, v_cost);
  return jsonb_build_object('ok', true, 'balance', v_balance, 'charged', v_cost);
end;
$$;

revoke all on function public.consume_tool_credit(uuid, text, uuid) from public, anon;
grant execute on function public.consume_tool_credit(uuid, text, uuid) to authenticated;

-- Analysis records are private to their owner, including when the owner has an admin role.
drop policy if exists "Users read own analyses; admins read all" on public.analyses;
create policy "Users read own analyses" on public.analyses for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "Users update own analyses; admins update all" on public.analyses;
create policy "Users update own analyses" on public.analyses for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users delete own analyses; admins delete all" on public.analyses;
create policy "Users delete own analyses" on public.analyses for delete to authenticated
  using (user_id = (select auth.uid()));

commit;
