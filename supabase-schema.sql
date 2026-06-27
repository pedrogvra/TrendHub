-- ======================================================================
-- TrendHub - schema SQL para Supabase (PostgreSQL)
-- ======================================================================
-- Como usar:
--   1. No dashboard do Supabase vá em SQL Editor.
--   2. Cole este script e execute.
--   3. Ele cria as tabelas, índices, chaves estrangeiras, RLS e políticas.
--
-- Observação:
--   O trigger `on_auth_user_created` (ao final) cria automaticamente
--   o perfil quando um novo usuário se registra em auth.users.
-- ======================================================================

-- Extensões úteis
create extension if not exists "pgcrypto";

-- =============================================================
-- TABELA: profiles
-- =============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- =============================================================
-- TABELA: communities
-- =============================================================
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text,
  image_url text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  rules text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists communities_created_by_idx on public.communities (created_by);
create index if not exists communities_category_idx on public.communities (category);

-- =============================================================
-- TABELA: community_members
-- =============================================================
create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (user_id, community_id)
);

create index if not exists community_members_user_idx on public.community_members (user_id);
create index if not exists community_members_community_idx on public.community_members (community_id);

-- =============================================================
-- TABELA: posts
-- =============================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  content text not null default '',
  media_url text,
  user_id uuid not null references public.profiles(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_user_idx on public.posts (user_id);
create index if not exists posts_community_idx on public.posts (community_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- =============================================================
-- TABELA: likes
-- =============================================================
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists likes_user_idx on public.likes (user_id);
create index if not exists likes_post_idx on public.likes (post_id);

-- =============================================================
-- TABELA: comments
-- =============================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id);

-- =============================================================
-- TABELA: follows
-- =============================================================
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_following_idx on public.follows (following_id);

-- =============================================================
-- TABELA: messages
-- =============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_sender_idx on public.messages (sender_id);
create index if not exists messages_receiver_idx on public.messages (receiver_id);
create index if not exists messages_pair_idx on public.messages (sender_id, receiver_id, created_at desc);

-- =============================================================
-- Trigger: cria perfil automaticamente ao registrar usuário
-- =============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.messages enable row level security;

-- ====== PROFILES ======
-- Qualquer usuário autenticado pode ler todos os perfis.
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated using (true);

-- Usuário só pode atualizar seu próprio perfil.
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Perfil é criado via trigger; não é necessário insert policy.
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- ====== COMMUNITIES ======
-- Leitura pública (para explorar).
drop policy if exists "communities_select_all" on public.communities;
create policy "communities_select_all" on public.communities
  for select to authenticated using (true);

-- Qualquer usuário autenticado pode criar.
drop policy if exists "communities_insert_auth" on public.communities;
create policy "communities_insert_auth" on public.communities
  for insert to authenticated
  with check (auth.uid() = created_by);

-- Atualizar/excluir apenas o criador.
drop policy if exists "communities_update_creator" on public.communities;
create policy "communities_update_creator" on public.communities
  for update to authenticated
  using (auth.uid() = created_by);

drop policy if exists "communities_delete_creator" on public.communities;
create policy "communities_delete_creator" on public.communities
  for delete to authenticated
  using (auth.uid() = created_by);

-- ====== COMMUNITY_MEMBERS ======
drop policy if exists "community_members_select_all" on public.community_members;
create policy "community_members_select_all" on public.community_members
  for select to authenticated using (true);

drop policy if exists "community_members_insert_self" on public.community_members;
create policy "community_members_insert_self" on public.community_members
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "community_members_delete_self" on public.community_members;
create policy "community_members_delete_self" on public.community_members
  for delete to authenticated
  using (auth.uid() = user_id);

-- ====== POSTS ======
-- Leitura pública.
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts
  for select to authenticated using (true);

-- Criar: apenas próprio user_id.
drop policy if exists "posts_insert_self" on public.posts;
create policy "posts_insert_self" on public.posts
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Atualizar/excluir: apenas autor.
drop policy if exists "posts_update_self" on public.posts;
create policy "posts_update_self" on public.posts
  for update to authenticated
  using (auth.uid() = user_id);

drop policy if exists "posts_delete_self" on public.posts;
create policy "posts_delete_self" on public.posts
  for delete to authenticated
  using (auth.uid() = user_id);

-- ====== LIKES ======
drop policy if exists "likes_select_all" on public.likes;
create policy "likes_select_all" on public.likes
  for select to authenticated using (true);

drop policy if exists "likes_insert_self" on public.likes;
create policy "likes_insert_self" on public.likes
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "likes_delete_self" on public.likes;
create policy "likes_delete_self" on public.likes
  for delete to authenticated
  using (auth.uid() = user_id);

-- ====== COMMENTS ======
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments
  for select to authenticated using (true);

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self" on public.comments
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "comments_delete_self" on public.comments;
create policy "comments_delete_self" on public.comments
  for delete to authenticated
  using (auth.uid() = user_id);

-- ====== FOLLOWS ======
drop policy if exists "follows_select_all" on public.follows;
create policy "follows_select_all" on public.follows
  for select to authenticated using (true);

drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self" on public.follows
  for insert to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self" on public.follows
  for delete to authenticated
  using (auth.uid() = follower_id);

-- ====== MESSAGES ======
-- Usuário pode ver mensagens em que é remetente ou destinatário.
drop policy if exists "messages_select_self" on public.messages;
create policy "messages_select_self" on public.messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "messages_insert_self" on public.messages;
create policy "messages_insert_self" on public.messages
  for insert to authenticated
  with check (auth.uid() = sender_id);

-- Atualização (marcação de leitura) apenas pelo destinatário.
drop policy if exists "messages_update_receiver" on public.messages;
create policy "messages_update_receiver" on public.messages
  for update to authenticated
  using (auth.uid() = receiver_id);

-- O remetente pode editar a própria mensagem somente enquanto ela não foi lida.
drop policy if exists "messages_update_sender" on public.messages;
create policy "messages_update_sender" on public.messages
  for update to authenticated
  using (auth.uid() = sender_id and read_at is null);

drop policy if exists "messages_delete_sender" on public.messages;
create policy "messages_delete_sender" on public.messages
  for delete to authenticated
  using (auth.uid() = sender_id and read_at is null);

-- =============================================================
-- STORAGE (executar manualmente no dashboard)
-- =============================================================
-- Crie dois buckets públicos/privados:
--   - `avatars`     (público) - imagens de perfil
--   - `post-media`  (público) - mídias de posts
--
-- As políticas de storage ficam em:
--   - `supabase-storage-buckets.sql`
--   - `supabase-storage-policies.sql`
-- =============================================================

-- Habilita realtime nas tabelas relevantes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
        AND n.nspname = 'public'
        AND c.relname = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
        AND n.nspname = 'public'
        AND c.relname = 'likes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_rel pr
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE pr.prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
        AND n.nspname = 'public'
        AND c.relname = 'comments'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    END IF;
  END IF;
END;
$$;
