alter table public.share_links
  add column if not exists visit_count integer not null default 0,
  add column if not exists last_accessed_at timestamptz null;
