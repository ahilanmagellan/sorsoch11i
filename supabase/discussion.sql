-- Выполните в Supabase SQL Editor один раз после schema.sql.

create table if not exists public.work_comments (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  author_name text not null default '' check (char_length(author_name) <= 40),
  body text not null check (char_length(body) between 1 and 2000),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists work_comments_work_created_idx
  on public.work_comments (work_id, created_at desc);

create table if not exists public.work_votes (
  work_id uuid not null references public.works(id) on delete cascade,
  voter_id uuid not null,
  vote text not null check (vote in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (work_id, voter_id)
);

create table if not exists public.comment_votes (
  comment_id uuid not null references public.work_comments(id) on delete cascade,
  voter_id uuid not null,
  vote text not null check (vote in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (comment_id, voter_id)
);

alter table public.work_comments enable row level security;
alter table public.work_votes enable row level security;
alter table public.comment_votes enable row level security;

drop policy if exists "Public read work comments" on public.work_comments;
create policy "Public read work comments"
  on public.work_comments for select to anon, authenticated using (true);

drop policy if exists "Public create regular comments" on public.work_comments;
create policy "Public create regular comments"
  on public.work_comments for insert to anon, authenticated
  with check (is_admin = false);

drop policy if exists "Public read work votes" on public.work_votes;
create policy "Public read work votes"
  on public.work_votes for select to anon, authenticated using (true);
drop policy if exists "Public add work votes" on public.work_votes;
create policy "Public add work votes"
  on public.work_votes for insert to anon, authenticated with check (true);
drop policy if exists "Public update work votes" on public.work_votes;
create policy "Public update work votes"
  on public.work_votes for update to anon, authenticated using (true) with check (true);
drop policy if exists "Public remove work votes" on public.work_votes;
create policy "Public remove work votes"
  on public.work_votes for delete to anon, authenticated using (true);

drop policy if exists "Public read comment votes" on public.comment_votes;
create policy "Public read comment votes"
  on public.comment_votes for select to anon, authenticated using (true);
drop policy if exists "Public add comment votes" on public.comment_votes;
create policy "Public add comment votes"
  on public.comment_votes for insert to anon, authenticated with check (true);
drop policy if exists "Public update comment votes" on public.comment_votes;
create policy "Public update comment votes"
  on public.comment_votes for update to anon, authenticated using (true) with check (true);
drop policy if exists "Public remove comment votes" on public.comment_votes;
create policy "Public remove comment votes"
  on public.comment_votes for delete to anon, authenticated using (true);

grant select, insert on public.work_comments to anon, authenticated;
grant select, insert, update, delete on public.work_votes to anon, authenticated;
grant select, insert, update, delete on public.comment_votes to anon, authenticated;
