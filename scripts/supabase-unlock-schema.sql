-- Supabase schema for Wordm project unlock persistence and server-side validation.
-- Run in Supabase SQL Editor for the "latti-wordm" project.

create extension if not exists pgcrypto;

create table if not exists public.project_unlock_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_offer_total integer null check (free_offer_total between 0 and 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_unlock_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('single', 'all_current', 'all_current_plus_year', 'free_pick')),
  project_slug text null,
  catalog_slugs text[] null,
  granted_at timestamptz not null default now(),
  new_unlock_until timestamptz null
);

create index if not exists idx_project_unlock_grants_user_id on public.project_unlock_grants(user_id);
create index if not exists idx_project_unlock_grants_user_kind on public.project_unlock_grants(user_id, kind);
create index if not exists idx_project_unlock_grants_project_slug on public.project_unlock_grants(project_slug);

create or replace function public.wordm_touch_unlock_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_wordm_unlock_profile_updated_at on public.project_unlock_profiles;
create trigger trg_wordm_unlock_profile_updated_at
before update on public.project_unlock_profiles
for each row
execute function public.wordm_touch_unlock_profile_updated_at();

alter table public.project_unlock_profiles enable row level security;
alter table public.project_unlock_grants enable row level security;

drop policy if exists "wordm_unlock_profiles_select_own" on public.project_unlock_profiles;
drop policy if exists "wordm_unlock_profiles_insert_own" on public.project_unlock_profiles;
drop policy if exists "wordm_unlock_profiles_update_own" on public.project_unlock_profiles;
drop policy if exists "wordm_unlock_grants_select_own" on public.project_unlock_grants;

create policy "wordm_unlock_profiles_select_own"
on public.project_unlock_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "wordm_unlock_profiles_insert_own"
on public.project_unlock_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "wordm_unlock_profiles_update_own"
on public.project_unlock_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "wordm_unlock_grants_select_own"
on public.project_unlock_grants
for select
to authenticated
using (auth.uid() = user_id);

revoke insert, update, delete on table public.project_unlock_grants from anon, authenticated;

create or replace function public.wordm_account_free_offer_total(p_created_at timestamptz)
returns integer
language plpgsql
stable
as $$
declare
  v_age_days numeric;
begin
  if p_created_at is null then
    return 0;
  end if;

  v_age_days := extract(epoch from (now() - p_created_at)) / 86400.0;

  if v_age_days < 0 then
    return 0;
  end if;

  if v_age_days <= 7 then
    return 2;
  end if;

  if v_age_days <= 30 then
    return 1;
  end if;

  return 0;
end;
$$;

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

grant execute on function public.wordm_get_unlock_state() to authenticated;
grant execute on function public.wordm_unlock_plan_tier(uuid) to authenticated;
grant execute on function public.wordm_apply_unlock_grant(text, text, text[]) to authenticated;
