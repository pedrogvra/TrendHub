/**
 * useCommunities
 * --------------
 * CRUD completo para comunidades/desafios criativos.
 * Inclui também: entrar/sair da comunidade, listar membros e explorar.
 */
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Community, CommunityMember } from "@/types";

const COMMUNITY_FIELDS = `
  *,
  creator:profiles!communities_created_by_fkey (id, username, full_name, avatar_url),
  members_count:community_members(count),
  is_member:community_members(user_id)
`;

export function useCommunities() {
  const { user } = useAuth();

  const normalize = useCallback(
    (rows: any[]): Community[] =>
      (rows || []).map((r: any) => ({
        ...r,
        members_count: Array.isArray(r.members_count)
          ? typeof r.members_count[0]?.count === "number"
            ? r.members_count[0].count
            : r.members_count.length
          : r.members_count || 0,
        is_member: user
          ? Array.isArray(r.is_member)
            ? r.is_member.some((m: any) => m.user_id === user.id)
            : Boolean(r.is_member)
          : false,
      })),
    [user]
  );

  const listAll = useCallback(
    async ({ category, search }: { category?: string; search?: string } = {}): Promise<Community[]> => {
      let query = supabase.from("communities").select(COMMUNITY_FIELDS).order("created_at", { ascending: false });
      if (category) query = query.eq("category", category);
      if (search) query = query.ilike("title", `%${search}%`);
      const { data, error } = await query;
      if (error) return [];
      return normalize(data || []);
    },
    [normalize]
  );

  const listMine = useCallback(async (): Promise<Community[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("communities")
      .select(COMMUNITY_FIELDS)
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    if (error) return [];
    return normalize(data || []);
  }, [user, normalize]);

  const listJoined = useCallback(async (): Promise<Community[]> => {
    if (!user) return [];
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);
    const ids = (memberships || []).map((m) => m.community_id);
    if (!ids.length) return [];
    const { data, error } = await supabase
      .from("communities")
      .select(COMMUNITY_FIELDS)
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (error) return [];
    return normalize(data || []);
  }, [user, normalize]);

  const getById = useCallback(
    async (id: string): Promise<Community | null> => {
      const { data, error } = await supabase
        .from("communities")
        .select(COMMUNITY_FIELDS)
        .eq("id", id)
        .single();
      if (error || !data) return null;
      return normalize([data])[0];
    },
    [normalize]
  );

  const create = useCallback(
    async (input: Omit<Community, "id" | "created_at" | "creator" | "members_count" | "is_member">) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("communities")
        .insert({ ...input, created_by: user.id })
        .select(COMMUNITY_FIELDS)
        .single();
      if (error) throw new Error(error.message);
      const created = normalize([data])[0];

      // Adiciona o criador automaticamente como membro
      await supabase.from("community_members").insert({
        user_id: user.id,
        community_id: created.id,
      });
      return created;
    },
    [user, normalize]
  );

  const update = useCallback(
    async (id: string, patch: Partial<Community>) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("communities")
        .update(patch)
        .eq("id", id)
        .eq("created_by", user.id)
        .select(COMMUNITY_FIELDS)
        .single();
      if (error) throw new Error(error.message);
      return normalize([data])[0];
    },
    [user, normalize]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("communities").delete().eq("id", id).eq("created_by", user.id);
      if (error) throw new Error(error.message);
    },
    [user]
  );

  const join = useCallback(
    async (communityId: string) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("community_members").insert({
        user_id: user.id,
        community_id: communityId,
      });
      if (error && error.code !== "23505") throw new Error(error.message);
    },
    [user]
  );

  const leave = useCallback(
    async (communityId: string) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("user_id", user.id)
        .eq("community_id", communityId);
      if (error) throw new Error(error.message);
    },
    [user]
  );

  const listMembers = useCallback(async (communityId: string): Promise<CommunityMember[]> => {
    const { data, error } = await supabase
      .from("community_members")
      .select(`id, user_id, community_id, joined_at, user:profiles!community_members_user_id_fkey (id, username, full_name, avatar_url)`)
      .eq("community_id", communityId)
      .order("joined_at", { ascending: true });
    if (error) return [];
    return (data || []) as unknown as CommunityMember[];
  }, []);

  return {
    listAll,
    listMine,
    listJoined,
    getById,
    create,
    update,
    remove,
    join,
    leave,
    listMembers,
  };
}
