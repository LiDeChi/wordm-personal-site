-- Allow anonymous deploy tickets so unauthenticated users can install the free edition.

alter table public.deploy_tickets
  alter column user_id drop not null;
