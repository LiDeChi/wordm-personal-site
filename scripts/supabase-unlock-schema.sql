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

create or replace function public.wordm_get_unlock_state()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.project_unlock_profiles%rowtype;
  v_grants jsonb;
  v_free_picked text[];
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select *
    into v_profile
    from public.project_unlock_profiles
   where user_id = v_uid;

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

  select coalesce(array_agg(g.project_slug order by g.granted_at asc), '{}')
    into v_free_picked
    from public.project_unlock_grants g
   where g.user_id = v_uid
     and g.kind = 'free_pick'
     and g.project_slug is not null;

  return jsonb_build_object(
    'grants', v_grants,
    'freeOfferTotal', v_profile.free_offer_total,
    'freePickedSlugs', to_jsonb(v_free_picked)
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
  v_free_total integer;
  v_free_used integer;
  v_exists boolean;
  v_account_created_at timestamptz;
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
      insert into public.project_unlock_grants (user_id, kind, project_slug, granted_at)
      values (v_uid, 'single', v_project_slug, v_now);
    end if;

  elsif v_kind = 'all_current' then
    insert into public.project_unlock_grants (user_id, kind, catalog_slugs, granted_at)
    values (v_uid, 'all_current', v_catalog_slugs, v_now);

  elsif v_kind = 'all_current_plus_year' then
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

grant execute on function public.wordm_get_unlock_state() to authenticated;
grant execute on function public.wordm_apply_unlock_grant(text, text, text[]) to authenticated;
