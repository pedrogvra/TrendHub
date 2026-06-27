/**
 * CommentSection
 * --------------
 * Lista e adiciona comentários de um post.
 */
import { useEffect, useState } from "react";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatRelativeTime } from "@/lib/utils";
import type { Comment } from "@/types";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Trash2, Send } from "lucide-react";

export function CommentSection({ postId, onChange }: { postId: string; onChange?: () => void }) {
  const { user } = useAuth();
  const { fetchComments, addComment, deleteComment } = usePosts();
  const [comments, setComments] = useState<Comment[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetchComments(postId);
    setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !user) return;
    setSending(true);
    try {
      const c = await addComment(postId, value.trim());
      setComments((prev) => [...prev, c]);
      setValue("");
      onChange?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao comentar");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      onChange?.();
      toast.success("Comentário removido");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover");
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-500">Carregando comentários...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Seja o primeiro a comentar.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Link to={`/u/${c.author?.id}`}>
                <Avatar
                  src={c.author?.avatar_url}
                  alt={c.author?.username}
                  fallback={c.author?.username}
                  seed={c.author?.username}
                  size="sm"
                />
              </Link>
              <div className="flex-1 rounded-2xl bg-slate-100 dark:bg-slate-800 px-3 py-2">
                <div className="flex items-center gap-2 text-xs">
                  <Link
                    to={`/u/${c.author?.id}`}
                    className="font-semibold text-slate-900 dark:text-white hover:underline"
                  >
                    {c.author?.full_name || c.author?.username}
                  </Link>
                  <span className="text-slate-400">· {formatRelativeTime(c.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm whitespace-pre-wrap">{c.content}</p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => remove(c.id)}
                  className="self-start p-1 text-slate-400 hover:text-red-500"
                  aria-label="Excluir comentário"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {user && (
        <form onSubmit={submit} className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Escreva um comentário..."
            maxLength={500}
          />
          <Button type="submit" size="icon" disabled={!value.trim() || sending} aria-label="Enviar">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
