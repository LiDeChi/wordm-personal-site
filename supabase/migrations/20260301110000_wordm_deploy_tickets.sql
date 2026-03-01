-- One-time deploy tickets for center-control self-host installation.

create table if not exists public.deploy_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('center_control_personal')),
  target text not null check (target in ('local', 'remote')),
  token_hash text not null unique,
  status text not null default 'issued' check (status in ('issued', 'consumed', 'expired')),
  expires_at timestamptz not null,
  issued_at timestamptz not null default now(),
  consumed_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_deploy_tickets_user_issued_at
  on public.deploy_tickets(user_id, issued_at desc);

create index if not exists idx_deploy_tickets_status_expires_at
  on public.deploy_tickets(status, expires_at);

alter table public.deploy_tickets enable row level security;

drop policy if exists "deploy_tickets_select_own" on public.deploy_tickets;
create policy "deploy_tickets_select_own"
on public.deploy_tickets
for select
to authenticated
using (auth.uid() = user_id);

revoke insert, update, delete on table public.deploy_tickets from anon, authenticated;
grant select on table public.deploy_tickets to authenticated;
