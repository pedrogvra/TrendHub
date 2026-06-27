-- Políticas de Storage para os buckets públicos `avatars` e `post-media`.
-- Execute este script no SQL Editor do Supabase após criar os buckets.

-- Permite leitura pública das mídias e avatares.
drop policy if exists "public_read_storage_objects" on storage.objects;
create policy "public_read_storage_objects" on storage.objects
  for select using (
    bucket_id in ('avatars', 'post-media')
  );

-- Permite upload apenas por usuários autenticados.
drop policy if exists "authenticated_upload_storage_objects" on storage.objects;
create policy "authenticated_upload_storage_objects" on storage.objects
  for insert with check (
    auth.uid() is not null
    and bucket_id in ('avatars', 'post-media')
  );

-- Permite atualizar apenas o dono do arquivo.
drop policy if exists "owner_update_storage_objects" on storage.objects;
create policy "owner_update_storage_objects" on storage.objects
  for update using (
    auth.uid() = owner
  )
  with check (
    auth.uid() = owner
  );

-- Permite excluir apenas o dono do arquivo.
drop policy if exists "owner_delete_storage_objects" on storage.objects;
create policy "owner_delete_storage_objects" on storage.objects
  for delete using (
    auth.uid() = owner
  );
