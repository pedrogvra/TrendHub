/**
 * useProfile
 * ----------
 * Operações relacionadas ao perfil (atualização de dados e upload de avatar).
 */
import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function useProfile() {
  const { user, refreshProfile } = useAuth();

  const updateProfile = useCallback(
    async (patch: { username?: string; full_name?: string; bio?: string; avatar_url?: string | null }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (error) throw new Error(error.message);
      await refreshProfile();
    },
    [user, refreshProfile]
  );

  /** Faz upload de avatar para o bucket `avatars` e retorna a URL pública. */
  const uploadAvatar = useCallback(
    async (file: File): Promise<string> => {
      if (!user) throw new Error("Não autenticado");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      return data.publicUrl;
    },
    [user]
  );

  const getById = useCallback(async (id: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (error) return null;
    return data;
  }, []);

  const deleteAvatar = useCallback(
    async (avatarUrl?: string) => {
      if (!user) throw new Error("Não autenticado");
      if (!avatarUrl) return;

      const url = new URL(avatarUrl);
      const match = url.pathname.match(/\/storage\/v1\/object\/public\/avatars\/(.+)/);
      const path = match?.[1] || url.pathname.split("/avatars/").pop();
      if (!path) throw new Error("Não foi possível identificar o arquivo de avatar");

      const { error: removeErr } = await supabase.storage.from("avatars").remove([decodeURIComponent(path)]);
      if (removeErr) throw new Error(removeErr.message);

      await updateProfile({ avatar_url: null });
    },
    [user, updateProfile]
  );

  const searchUsers = useCallback(async (q: string) => {
    if (!q) return [];
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${q}%`)
      .limit(20);
    return data || [];
  }, []);

  return { updateProfile, uploadAvatar, deleteAvatar, getById, searchUsers };
}
