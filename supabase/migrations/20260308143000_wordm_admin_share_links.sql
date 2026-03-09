alter table public.share_links
  alter column user_id drop not null;

alter table public.share_links
  add column if not exists issued_by text not null default 'user' check (issued_by in ('user', 'admin')),
  add column if not exists issued_by_label text null;

create index if not exists idx_share_links_issued_by_created_at on public.share_links(issued_by, created_at desc);
