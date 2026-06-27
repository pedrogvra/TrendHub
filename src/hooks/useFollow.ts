/**
 * useFollow
 * ---------
 * Relações de seguir/deixar de seguir, além de contagens de seguidores/seguindo
 * e listagens associadas.
 */
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types";

export function useFollow() {
  const { user } = useAuth();

  const isFollowing = useCallback(
    async (targetId: string): Promise<boolean> => {
      if (!user) return false;
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetId)
        .maybeSingle();
      return Boolean(data);
    },
    [user]
  );

  const toggleFollow = useCallback(
    async (targetId: string): Promise<boolean> => {
      if (!user) throw new Error("Não autenticado");
      if (targetId === user.id) throw new Error("Você não pode seguir a si mesmo");

      const { data: existing } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetId)
        .maybeSingle();

      if (existing) {
        await supabase.from("follows").delete().eq("id", existing.id);
        return false;
      }
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      return true;
    },
    [user]
  );

  const getStats = useCallback(
    async (userId: string): Promise<{ followers: number; following: number }> => {
      const [f1, f2] = await Promise.all([
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
      ]);
      return { followers: f1.count || 0, following: f2.count || 0 };
    },
    []
  );

  const listFollowers = useCallback(async (userId: string): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from("follows")
      .select(`follower:profiles!follows_follower_id_fkey (id, username, full_name, avatar_url)`)
      .eq("following_id", userId);
    if (error) return [];
    return (data || []).map((d: any) => d.follower as Profile);
  }, []);

  const listFollowing = useCallback(async (userId: string): Promise<Profile[]> => {
    const { data, error } = await supabase
      .from("follows")
      .select(`following:profiles!follows_following_id_fkey (id, username, full_name, avatar_url)`)
      .eq("follower_id", userId);
    if (error) return [];
    return (data || []).map((d: any) => d.following as Profile);
  }, []);

  return { isFollowing, toggleFollow, getStats, listFollowers, listFollowing };
}
