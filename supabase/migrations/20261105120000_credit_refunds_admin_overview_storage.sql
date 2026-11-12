begin;

-- Allow refunding a tool credit when the run it paid for fails before producing
-- a usable report. One refund per credit transaction.
alter table public.credit_tool_transactions
  add column if not exists refunded_at timestamptz;

create or replace function public.refund_tool_credit(
  p_analysis_id uuid,
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction public.credit_tool_transactions%rowtype;
  v_balance numeric;
  v_history jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_analysis_id is null or p_request_id is null then
    raise exception 'Invalid refund request' using errcode = '22023';
  end if;

  select * into v_transaction
    from public.credit_tool_transactions
    where request_id = p_request_id
      and analysis_id = p_analysis_id
      and user_id = v_user_id
    for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_charged');
  end if;
  if v_transaction.refunded_at is not null then
    return jsonb_build_object('ok', true, 'already_refunded', true);
  end if;

  if v_transaction.amount <= 0 then
    update public.credit_tool_transactions
      set refunded_at = now()
      where request_id = p_request_id;
    return jsonb_build_object('ok', true, 'refunded', 0);
  end if;

  select balance, history into v_balance, v_history
    from public.credit_accounts
    where user_id = v_user_id
    for update;

  update public.credit_accounts
    set balance = v_balance + v_transaction.amount,
        history = (
          select coalesce(jsonb_agg(entry order by ordinal), '[]'::jsonb)
          from jsonb_array_elements(
            coalesce(v_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
              'change', v_transaction.amount,
              'reason', 'refund_tool_' || v_transaction.tool,
              'tool', v_transaction.tool,
              'analysis_id', p_analysis_id,
              'request_id', p_request_id,
              'date', now()
            ))
          ) with ordinality as items(entry, ordinal)
          where ordinal > jsonb_array_length(coalesce(v_history, '[]'::jsonb) || jsonb_build_array('{}'::jsonb)) - 50
        ),
        updated_date = now()
    where user_id = v_user_id
    returning balance into v_balance;

  update public.credit_tool_transactions
    set refunded_at = now()
    where request_id = p_request_id;

  return jsonb_build_object('ok', true, 'balance', v_balance, 'refunded', v_transaction.amount);
end;
$$;

revoke all on function public.refund_tool_credit(uuid, uuid) from public, anon;
grant execute on function public.refund_tool_credit(uuid, uuid) to authenticated;

-- Aggregated admin dashboard data. Analysis records themselves stay private to
-- their owner, so the dashboard reads this reduced, admin-only summary instead
-- of selecting every user's reports.
create or replace function public.admin_analysis_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_by_status jsonb;
  v_by_source jsonb;
  v_recent jsonb;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(
      jsonb_build_object('status', grouped.status, 'count', grouped.count, 'avg_score', grouped.avg_score)
      order by grouped.status
    ), '[]'::jsonb)
    into v_by_status
    from (
      select status, count(*)::int as count, round(avg(score)::numeric, 2) as avg_score
      from public.analyses
      group by status
    ) as grouped;

  select coalesce(jsonb_agg(
      jsonb_build_object('source_type', grouped.source_type, 'count', grouped.count)
      order by grouped.source_type
    ), '[]'::jsonb)
    into v_by_source
    from (
      select source_type, count(*)::int as count
      from public.analyses
      group by source_type
    ) as grouped;

  select coalesce(jsonb_agg(row_to_json(recent_rows)), '[]'::jsonb)
    into v_recent
    from (
      select source_label, source_type, status, score, created_date
      from public.analyses
      order by created_date desc
      limit 8
    ) as recent_rows;

  return jsonb_build_object(
    'by_status', v_by_status,
    'by_source', v_by_source,
    'recent', v_recent
  );
end;
$$;

revoke all on function public.admin_analysis_overview() from public, anon;
grant execute on function public.admin_analysis_overview() to authenticated;

-- Administrators can replace or remove public assets they uploaded.
grant update, delete on storage.objects to authenticated;

drop policy if exists "Admins can update assets" on storage.objects;
create policy "Admins can update assets"
  on storage.objects for update to authenticated
  using (bucket_id = 'public-assets' and (select public.is_admin()))
  with check (bucket_id = 'public-assets' and (select public.is_admin()));

drop policy if exists "Admins can delete assets" on storage.objects;
create policy "Admins can delete assets"
  on storage.objects for delete to authenticated
  using (bucket_id = 'public-assets' and (select public.is_admin()));

commit;
