/**
 * CreatePostModal
 * ---------------
 * Modal para criar ou editar um post. Aceita texto + URL opcional de mídia
 * e associação a uma comunidade da qual o usuário seja membro.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { useCommunities } from "@/hooks/useCommunities";
import type { Community, Post } from "@/types";
import { toast } from "sonner";
import { Image as ImageIcon, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
  /** Quando fornecido, o modal entra em modo de edição. */
  editing?: Post | null;
  /** Comunidade pré-selecionada (usada em CommunityDetail). */
  initialCommunityId?: string | null;
}

export function CreatePostModal({ open, onOpenChange, onSaved, editing, initialCommunityId }: Props) {
  const { user } = useAuth();
  const { createPost, updatePost } = usePosts();
  const { listJoined } = useCommunities();

  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setContent(editing.content || "");
      setMediaUrl(editing.media_url || "");
      setCommunityId(editing.community_id || null);
    } else {
      setContent("");
      setMediaUrl("");
      setCommunityId(initialCommunityId || null);
    }
  }, [editing, initialCommunityId, open]);

  useEffect(() => {
    if (!user) return;
    listJoined().then(setCommunities);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaUrl.trim()) {
      toast.error("Escreva algo ou adicione uma mídia");
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        await updatePost(editing.id, {
          content: content.trim(),
          media_url: mediaUrl.trim() || null,
          community_id: communityId,
        });
        toast.success("Post atualizado");
      } else {
        await createPost({
          content: content.trim(),
          media_url: mediaUrl.trim() || null,
          community_id: communityId,
        });
        toast.success("Post publicado!");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar post" : "Criar post"}</DialogTitle>
          <DialogDescription>
            Compartilhe o que está rolando nas trends ou em uma comunidade.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="No que você está pensando?"
            rows={4}
            maxLength={1000}
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="URL de imagem ou vídeo (opcional)"
                className="pl-9"
              />
              {mediaUrl && (
                <button
                  type="button"
                  onClick={() => setMediaUrl("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {mediaUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              {/\.(mp4|webm|mov)(\?|#|$)/i.test(mediaUrl) ? (
                <video src={mediaUrl} controls className="max-h-56 w-full" />
              ) : (
                <img src={mediaUrl} alt="preview" className="max-h-56 w-full object-cover" />
              )}
            </div>
          )}

          <select
            value={communityId || ""}
            onChange={(e) => setCommunityId(e.target.value || null)}
            className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Sem comunidade (feed pessoal)</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {editing ? "Salvar" : "Publicar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
