create table if not exists public.site_pricing_configs (
  id integer primary key check (id = 1),
  config jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id) on delete set null
);

create or replace function public.wordm_touch_site_pricing_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_wordm_site_pricing_updated_at on public.site_pricing_configs;
create trigger trg_wordm_site_pricing_updated_at
before update on public.site_pricing_configs
for each row
execute function public.wordm_touch_site_pricing_updated_at();

alter table public.site_pricing_configs enable row level security;

insert into public.site_pricing_configs (id, config)
values (
  1,
  '{
    "version": 1,
    "updatedAt": null,
    "singleUnlock": {
      "enabled": true,
      "defaultPriceZh": null,
      "defaultPriceEn": null,
      "defaultCheckoutProductId": null
    },
    "allAccess": {
      "enabled": true,
      "priceZh": null,
      "priceEn": null,
      "checkoutProductId": null
    },
    "projects": {
      "40-aidoc": { "access": "free" },
      "page-glance-extension": { "access": "free" },
      "personalinflationbasket": { "access": "free" },
      "llm-layer": { "access": "free" },
      "ai-stroke-writer": { "access": "limited_free", "freeUntil": "2026-03-31T23:59:59+08:00" },
      "open-deep-research": { "access": "limited_free", "freeUntil": "2026-03-31T23:59:59+08:00" },
      "dynamic-delegate-2": { "access": "limited_free", "freeUntil": "2026-03-31T23:59:59+08:00" }
    }
  }'::jsonb
)
on conflict (id) do nothing;

create or replace function public.wordm_get_unlock_state()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_grants jsonb;
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'id', g.id::text,
               'kind', g.kind,
               'grantedAt', g.granted_at,
               'projectSlug', g.project_slug,
               'catalogSlugs', g.catalog_slugs,
               'newUnlockUntil', g.new_unlock_until
             )
             order by g.granted_at asc
           ),
           '[]'::jsonb
         )
    into v_grants
    from public.project_unlock_grants g
   where g.user_id = v_uid;

  return jsonb_build_object(
    'grants', v_grants
  );
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
  v_exists boolean;
  v_plan_tier integer;
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if v_kind not in ('single', 'all_current', 'all_current_plus_year') then
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

  if v_kind = 'single' and v_project_slug = '' then
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

  else
    v_plan_tier := public.wordm_unlock_plan_tier(v_uid);
    if v_plan_tier < 1 then
      raise exception 'PAYMENT_REQUIRED';
    end if;

    insert into public.project_unlock_grants (user_id, kind, catalog_slugs, granted_at, new_unlock_until)
    values (v_uid, 'all_current_plus_year', v_catalog_slugs, v_now, v_now + interval '1 year');
  end if;

  return public.wordm_get_unlock_state();
end;
$$;

grant execute on function public.wordm_get_unlock_state() to authenticated;
grant execute on function public.wordm_apply_unlock_grant(text, text, text[]) to authenticated;
