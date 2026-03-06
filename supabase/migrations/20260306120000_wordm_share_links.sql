create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text null,
  token_hash text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  allow_portfolio boolean not null default true,
  allow_blog boolean not null default true,
  allow_deploy boolean not null default false,
  allow_resume boolean not null default false,
  allow_all_projects boolean not null default true,
  allowed_project_slugs text[] not null default '{}',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz null
);

create index if not exists idx_share_links_user_created_at on public.share_links(user_id, created_at desc);
create index if not exists idx_share_links_status_expires_at on public.share_links(status, expires_at);

alter table public.share_links enable row level security;

drop policy if exists "share_links_select_own" on public.share_links;
create policy "share_links_select_own"
on public.share_links
for select
to authenticated
using (auth.uid() = user_id);

revoke insert, update, delete on table public.share_links from anon, authenticated;
grant select on table public.share_links to authenticated;
