-- First-party analytics event log for wordm.us.
-- Stores product behavior events without raw passwords, input contents, or raw IP addresses.

create extension if not exists pgcrypto;

create table if not exists public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null check (
    event_type in (
      'page_view',
      'click',
      'download',
      'engagement',
      'signup',
      'login',
      'logout'
    )
  ),
  session_id text not null check (char_length(session_id) between 8 and 96),
  user_id uuid null references auth.users(id) on delete set null,
  user_role text null check (user_role in ('admin', 'tester', 'user', 'guest')),
  path text not null default '/',
  search text null,
  page_title text null,
  referrer text null,
  language text null,
  viewport_width integer null check (viewport_width between 0 and 20000),
  viewport_height integer null check (viewport_height between 0 and 20000),
  duration_ms integer null check (duration_ms between 0 and 86400000),
  element_tag text null,
  element_label text null,
  element_href text null,
  download_url text null,
  download_name text null,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text null,
  ip_hash text null
);

create index if not exists idx_site_analytics_events_created_at
  on public.site_analytics_events(created_at desc);

create index if not exists idx_site_analytics_events_event_type_created_at
  on public.site_analytics_events(event_type, created_at desc);

create index if not exists idx_site_analytics_events_session_id_created_at
  on public.site_analytics_events(session_id, created_at desc);

create index if not exists idx_site_analytics_events_user_id_created_at
  on public.site_analytics_events(user_id, created_at desc)
  where user_id is not null;

alter table public.site_analytics_events enable row level security;

revoke all on table public.site_analytics_events from anon, authenticated;
grant insert, select, delete on table public.site_analytics_events to service_role;

comment on table public.site_analytics_events is
  'First-party site analytics events. Inserted by the site-analytics Edge Function only.';
comment on column public.site_analytics_events.ip_hash is
  'Optional salted hash of request IP, only populated when WORDM_ANALYTICS_IP_SALT is configured. Raw IP is never stored.';
