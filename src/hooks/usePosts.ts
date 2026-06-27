/**
 * usePosts
 * --------
 * Hook central para operações relacionadas a posts:
 *  - Buscar feed (postagens de quem o usuário segue + comunidades das quais é membro)
 *  - Buscar posts de um usuário / de uma comunidade
 *  - Criar, editar, excluir post
 *  - Curtir / descurtir
 *  - Adicionar / listar comentários
 */
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Comment, Post } from "@/types";
import { detectMediaType } from "@/lib/utils";

const POST_FIELDS = `
  id, content, media_url, user_id, community_id, created_at, updated_at,
  author:profiles!posts_user_id_fkey (id, username, full_name, avatar_url),
  community:communities (id, title, image_url, category),
  likes_count:likes(count),
  comments_count:comments(count),
  is_liked:likes(user_id)
`;

export function usePosts() {
  const { user } = useAuth();

  /** Monta o array de posts normalizando os contadores agregados. */
  const normalize = useCallback((rows: any[]): Post[] => {
    return (rows || []).map((r: any) => ({
      ...r,
      media_type: detectMediaType(r.media_url),
      likes_count: Array.isArray(r.likes_count)
        ? typeof r.likes_count[0]?.count === "number"
          ? r.likes_count[0].count
          : r.likes_count.length
        : r.likes_count || 0,
      comments_count: Array.isArray(r.comments_count)
        ? typeof r.comments_count[0]?.count === "number"
          ? r.comments_count[0].count
          : r.comments_count.length
        : r.comments_count || 0,
      is_liked: user
        ? Array.isArray(r.is_liked)
          ? r.is_liked.some((l: any) => l.user_id === user.id)
          : Boolean(r.is_liked)
        : false,
    }));
  }, [user]);

  /** Feed: posts dos usuários seguidos + posts das comunidades das quais participa. */
  const fetchFeed = useCallback(async (): Promise<Post[]> => {
    if (!user) return [];

    // 1) Lista de IDs seguidos
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const followingIds = (following || []).map((f) => f.following_id);

    // 2) Lista de IDs de comunidades das quais é membro
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);
    const communityIds = (memberships || []).map((m) => m.community_id);

    // 3) Busca unificada (posts do próprio usuário, de seguidos OU de comunidades que participa)
    let query = supabase.from("posts").select(POST_FIELDS).order("created_at", { ascending: false }).limit(100);

    const userIds = Array.from(new Set([user.id, ...followingIds]));
    const orConditions: string[] = [];
    if (userIds.length) orConditions.push(`user_id.in.(${userIds.join(",")})`);
    if (communityIds.length) orConditions.push(`community_id.in.(${communityIds.join(",")})`);

    if (!orConditions.length) {
      // Usuário sem follows/membros: mostra posts globais recentes
      const { data } = await supabase
        .from("posts")
        .select(POST_FIELDS)
        .order("created_at", { ascending: false })
        .limit(50);
      return normalize(data || []);
    }

    query = query.or(orConditions.join(","));
    const { data, error } = await query;
    if (error) {
      console.error("fetchFeed error", error);
      return [];
    }
    return normalize(data || []);
  }, [user, normalize]);

  const fetchUserPosts = useCallback(async (userId: string): Promise<Post[]> => {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_FIELDS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return normalize(data || []);
  }, [normalize]);

  const fetchCommunityPosts = useCallback(async (communityId: string): Promise<Post[]> => {
    const { data, error } = await supabase
      .from("posts")
      .select(POST_FIELDS)
      .eq("community_id", communityId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return normalize(data || []);
  }, [normalize]);

  const createPost = useCallback(
    async (input: { content: string; media_url?: string | null; community_id?: string | null }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: input.content,
          media_url: input.media_url || null,
          community_id: input.community_id || null,
        })
        .select(POST_FIELDS)
        .single();
      if (error) throw new Error(error.message);
      return normalize([data])[0];
    },
    [user, normalize]
  );

  const updatePost = useCallback(
    async (
      postId: string,
      patch: { content?: string; media_url?: string | null; community_id?: string | null }
    ) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("posts")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", postId)
        .eq("user_id", user.id) // só pode editar o próprio
        .select(POST_FIELDS)
        .single();
      if (error) throw new Error(error.message);
      return normalize([data])[0];
    },
    [user, normalize]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("posts").delete().eq("id", postId).eq("user_id", user.id);
      if (error) throw new Error(error.message);
    },
    [user]
  );

  /** Alterna o like no post. Retorna `true` se ficou curtido. */
  const toggleLike = useCallback(
    async (postId: string): Promise<boolean> => {
      if (!user) throw new Error("Não autenticado");
      const { data: existing } = await supabase
        .from("likes")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from("likes").delete().eq("id", existing.id);
        return false;
      }
      await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
      return true;
    },
    [user]
  );

  const fetchComments = useCallback(async (postId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from("comments")
      .select(`id, content, user_id, post_id, created_at, author:profiles!comments_user_id_fkey (id, username, full_name, avatar_url)`)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) return [];
    return (data || []) as unknown as Comment[];
  }, []);

  const addComment = useCallback(
    async (postId: string, content: string) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("comments")
        .insert({ post_id: postId, user_id: user.id, content })
        .select(`id, content, user_id, post_id, created_at, author:profiles!comments_user_id_fkey (id, username, full_name, avatar_url)`)
        .single();
      if (error) throw new Error(error.message);
      return data as unknown as Comment;
    },
    [user]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);
      if (error) throw new Error(error.message);
    },
    [user]
  );

  return {
    fetchFeed,
    fetchUserPosts,
    fetchCommunityPosts,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    fetchComments,
    addComment,
    deleteComment,
  };
}
