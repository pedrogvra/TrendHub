-- Supabase Storage buckets para TrendHub
-- Execute este script no SQL Editor do Supabase para criar os buckets usados pela aplicação.
-- Se os buckets já existirem, a execução pode falhar com erro de duplicação.

select storage.create_bucket('avatars', true);
select storage.create_bucket('post-media', true);
