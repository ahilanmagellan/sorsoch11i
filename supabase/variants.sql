-- Выполните в Supabase SQL Editor, чтобы включить отдельные фото для вариантов.
-- Существующие фотографии сохраняются и привязываются к варианту 1.

alter table public.works
  add column if not exists image_variants jsonb not null default '[]'::jsonb;

update public.works
set image_variants = jsonb_build_array(
  jsonb_build_object('variant', 1, 'image_urls', to_jsonb(image_urls))
)
where jsonb_array_length(image_variants) = 0
  and cardinality(image_urls) > 0;
