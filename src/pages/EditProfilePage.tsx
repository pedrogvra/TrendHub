/**
 * EditProfilePage
 * ---------------
 * Edição do perfil do usuário logado.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { toast } from "sonner";
import { Upload, User as UserIcon } from "lucide-react";

export function EditProfilePage() {
  const { profile } = useAuth();
  const { updateProfile, uploadAvatar, deleteAvatar } = useProfile();
  const navigate = useNavigate();

  const [username, setUsername] = useState(profile?.username || "");
  const [full_name, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAvatarUrl(profile?.avatar_url || "");
  }, [profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Nome de usuário obrigatório");
    setLoading(true);
    try {
      let finalAvatar = avatarUrl;
      if (avatarFile) {
        finalAvatar = await uploadAvatar(avatarFile);
      }
      await updateProfile({
        username: username.trim(),
        full_name: full_name.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatar || null,
      });
      toast.success("Perfil atualizado!");
      navigate("/profile");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl && !avatarFile) return;
    setLoading(true);
    try {
      if (avatarUrl) {
        await deleteAvatar(avatarUrl);
      }
      setAvatarFile(null);
      setAvatarUrl("");
      toast.success("Foto de perfil removida.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover avatar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold flex items-center gap-2 mb-4">
        <UserIcon className="h-6 w-6 text-cyan-500" /> Editar perfil
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Informações pessoais</CardTitle>
          <CardDescription>Atualize como você aparece para outras pessoas.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={avatarUrl}
                alt={full_name || username}
                fallback={full_name || username}
                seed={username}
                size="xl"
              />
              <div className="flex-1">
                <label className="text-sm font-medium">Avatar</label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Enviar arquivo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setAvatarFile(f);
                      }}
                    />
                  </label>
                  {(avatarUrl || avatarFile) && (
                    <Button type="button" variant="outline" onClick={handleRemoveAvatar} disabled={loading}>
                      Remover foto
                    </Button>
                  )}
                  {avatarFile && <span className="self-center text-xs text-slate-500">{avatarFile.name}</span>}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Nome de usuário</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Nome completo</label>
              <Input value={full_name} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Bio</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/profile")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
