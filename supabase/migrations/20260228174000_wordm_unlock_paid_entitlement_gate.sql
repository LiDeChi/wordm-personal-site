-- Align paid unlock authorization with latti-wordm entitlements.

create or replace function public.wordm_unlock_plan_tier(p_user_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan text := '';
  v_plan_id text := '';
  v_expires_at timestamptz := null;
begin
  if p_user_id is null then
    return 0;
  end if;

  begin
    execute '
      select lower(coalesce(plan, '''')), lower(coalesce(plan_id, '''')), expires_at
      from public.entitlements
      where user_id = $1
      limit 1
    '
      into v_plan, v_plan_id, v_expires_at
      using p_user_id;
  exception
    when undefined_table then
      return 0;
  end;

  if v_plan = 'lifetime' or v_plan_id = 'lifetime' then
    return 2;
  end if;

  if v_plan = 'subscription' or v_plan_id in ('basic', 'pro', 'subscription') then
    if v_expires_at is null or v_expires_at > now() then
      return 1;
    end if;
  end if;

  return 0;
end;
$$;

create or replace function public.wordm_apply_unlock_grant(
  p_kind text,
  p_project_slug text default null,
  p_catalog_slugs text[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_kind text := lower(coalesce(trim(p_kind), ''));
  v_project_slug text := lower(coalesce(trim(p_project_slug), ''));
  v_catalog_slugs text[];
  v_now timestamptz := now();
  v_free_total integer;
  v_free_used integer;
  v_exists boolean;
  v_account_created_at timestamptz;
  v_plan_tier integer;
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if v_kind not in ('single', 'all_current', 'all_current_plus_year', 'free_pick') then
    raise exception 'INVALID_UNLOCK_KIND';
  end if;

  if p_catalog_slugs is not null then
    select coalesce(array_agg(distinct lower(trim(item))), '{}')
      into v_catalog_slugs
      from unnest(p_catalog_slugs) as item
     where trim(coalesce(item, '')) <> '';
  else
    v_catalog_slugs := '{}';
  end if;

  if v_kind in ('single', 'free_pick') and v_project_slug = '' then
    raise exception 'PROJECT_SLUG_REQUIRED';
  end if;

  if v_kind in ('all_current', 'all_current_plus_year') and coalesce(array_length(v_catalog_slugs, 1), 0) = 0 then
    raise exception 'CATALOG_SLUGS_REQUIRED';
  end if;

  if v_kind = 'single' then
    select exists(
      select 1
        from public.project_unlock_grants g
       where g.user_id = v_uid
         and g.kind in ('single', 'free_pick')
         and g.project_slug = v_project_slug
    )
    into v_exists;

    if not v_exists then
      v_plan_tier := public.wordm_unlock_plan_tier(v_uid);
      if v_plan_tier < 1 then
        raise exception 'PAYMENT_REQUIRED';
      end if;

      insert into public.project_unlock_grants (user_id, kind, project_slug, granted_at)
      values (v_uid, 'single', v_project_slug, v_now);
    end if;

  elsif v_kind = 'all_current' then
    v_plan_tier := public.wordm_unlock_plan_tier(v_uid);
    if v_plan_tier < 1 then
      raise exception 'PAYMENT_REQUIRED';
    end if;

    insert into public.project_unlock_grants (user_id, kind, catalog_slugs, granted_at)
    values (v_uid, 'all_current', v_catalog_slugs, v_now);

  elsif v_kind = 'all_current_plus_year' then
    v_plan_tier := public.wordm_unlock_plan_tier(v_uid);
    if v_plan_tier < 2 then
      raise exception 'LIFETIME_REQUIRED';
    end if;

    insert into public.project_unlock_grants (user_id, kind, catalog_slugs, granted_at, new_unlock_until)
    values (v_uid, 'all_current_plus_year', v_catalog_slugs, v_now, v_now + interval '1 year');

  else
    select exists(
      select 1
        from public.project_unlock_grants g
       where g.user_id = v_uid
         and g.kind in ('single', 'free_pick')
         and g.project_slug = v_project_slug
    )
    into v_exists;

    if not v_exists then
      select p.free_offer_total
        into v_free_total
        from public.project_unlock_profiles p
       where p.user_id = v_uid;

      if v_free_total is null then
        select u.created_at
          into v_account_created_at
          from auth.users u
         where u.id = v_uid;

        v_free_total := public.wordm_account_free_offer_total(v_account_created_at);

        insert into public.project_unlock_profiles (user_id, free_offer_total)
        values (v_uid, v_free_total)
        on conflict (user_id)
        do update set free_offer_total = excluded.free_offer_total;
      end if;

      select count(*)
        into v_free_used
        from public.project_unlock_grants g
       where g.user_id = v_uid
         and g.kind = 'free_pick';

      if v_free_used >= coalesce(v_free_total, 0) then
        raise exception 'FREE_OFFER_EXHAUSTED';
      end if;

      insert into public.project_unlock_grants (user_id, kind, project_slug, granted_at)
      values (v_uid, 'free_pick', v_project_slug, v_now);
    end if;
  end if;

  return public.wordm_get_unlock_state();
end;
$$;

grant execute on function public.wordm_unlock_plan_tier(uuid) to authenticated;
grant execute on function public.wordm_apply_unlock_grant(text, text, text[]) to authenticated;
