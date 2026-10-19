-- База данных СОР / СОЧ / ФО
-- Выполните этот файл в Supabase SQL Editor (Project -> SQL Editor -> New query).

create extension if not exists "pgcrypto";

create table if not exists works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  grade smallint not null check (grade between 1 and 11),
  quarter smallint not null check (quarter between 1 and 4),
  work_type text not null,
  max_score integer,
  variants_count integer,
  test_date date,
  image_urls text[] not null default '{}',
  image_variants jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table works add column if not exists image_variants jsonb not null default '[]'::jsonb;

update works
set image_variants = jsonb_build_array(jsonb_build_object('variant', 1, 'image_urls', to_jsonb(image_urls)))
where jsonb_array_length(image_variants) = 0 and cardinality(image_urls) > 0;

create index if not exists works_subject_idx on works (subject);
create index if not exists works_grade_idx on works (grade);
create index if not exists works_quarter_idx on works (quarter);
create index if not exists works_work_type_idx on works (work_type);
create index if not exists works_created_at_idx on works (created_at desc);

alter table works enable row level security;

-- Публичное чтение доступно всем (сайт открыт для просмотра без входа).
drop policy if exists "Public read access" on works;
create policy "Public read access"
  on works for select
  using (true);

-- Вставка/обновление/удаление выполняются только через service_role ключ
-- (используется в server actions админ-панели и обходит RLS), поэтому
-- отдельные policy для anon/authenticated на insert/update/delete не нужны.

-- Storage: бакет для фотографий работ
insert into storage.buckets (id, name, public)
values ('work-photos', 'work-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public read work photos" on storage.objects;
create policy "Public read work photos"
  on storage.objects for select
  using (bucket_id = 'work-photos');

-- Комментарии и реакции добавляются также в supabase/discussion.sql,
-- чтобы их можно было применить к уже существующей базе.
