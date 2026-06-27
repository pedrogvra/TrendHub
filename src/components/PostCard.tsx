/**
 * PostCard
 * --------
 * Card reutilizável que renderiza um post com:
 *  - autor, comunidade associada
 *  - conteúdo textual + mídia (imagem/vídeo)
 *  - ações: curtir, comentar, excluir/editar (se for do autor)
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts } from "@/hooks/usePosts";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime, detectMediaType } from "@/lib/utils";
import { Heart, MessageCircle, Trash2, Edit2 } from "lucide-react";
import type { Post } from "@/types";
import { toast } from "sonner";
import { CommentSection } from "./CommentSection";
import { CreatePostModal } from "./CreatePostModal";

interface PostCardProps {
  post: Post;
  onChange?: () => void;
}

export function PostCard({ post, onChange }: PostCardProps) {
  const { user } = useAuth();
  const { toggleLike, deletePost } = usePosts();
  const [showComments, setShowComments] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [liking, setLiking] = useState(false);

  const isAuthor = user?.id === post.user_id;
  const mediaType = post.media_type || detectMediaType(post.media_url);

  const handleLike = async () => {
    if (!user) return toast.error("Faça login para curtir");
    setLiking(true);
    try {
      await toggleLike(post.id);
      onChange?.();
    } catch (e: any) {
      toast.error(e.message || "Não foi possível curtir");
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Deseja realmente excluir este post?")) return;
    try {
      await deletePost(post.id);
      toast.success("Post excluído");
      onChange?.();
    } catch (e: any) {
      toast.error(e.message || "Não foi possível excluir");
    }
  };

  return (
    <>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        {/* Cabeçalho do autor */}
        <header className="flex items-start gap-3">
          <Link to={`/u/${post.author?.id}`}>
            <Avatar
              src={post.author?.avatar_url}
              alt={post.author?.username}
              fallback={post.author?.full_name || post.author?.username}
              seed={post.author?.username}
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Link
                to={`/u/${post.author?.id}`}
                className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-300 truncate"
              >
                {post.author?.full_name || post.author?.username || "usuário"}
              </Link>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                @{post.author?.username}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>
            {post.community && (
              <Link
                to={`/communities/${post.community.id}`}
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                {post.community.title}
              </Link>
            )}
          </div>
          {isAuthor && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Editar">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Excluir" className="text-red-500">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </header>

        {/* Conteúdo */}
        {post.content && (
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-800 dark:text-slate-100">
            {post.content}
          </p>
        )}

        {/* Mídia */}
        {post.media_url && mediaType === "video" && (
          <div className="mt-3 overflow-hidden rounded-xl bg-black">
            <video
              src={post.media_url}
              controls
              className="w-full max-h-[520px]"
              preload="metadata"
            />
          </div>
        )}
        {post.media_url && mediaType === "image" && (
          <div className="mt-3 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
            <a href={post.media_url} target="_blank" rel="noreferrer" className="block">
              <img
                src={post.media_url}
                alt="mídia do post"
                className="w-full max-h-[520px] object-cover"
                loading="lazy"
              />
            </a>
          </div>
        )}

        {/* Ações */}
        <footer className="mt-4 flex items-center gap-4 text-sm">
          <button
            onClick={handleLike}
            disabled={liking || !user}
            className="group inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-500"
            aria-label="Curtir"
          >
            <Heart
              className={
                "h-5 w-5 transition-all " +
                (post.is_liked
                  ? "fill-rose-500 text-rose-500 scale-110"
                  : "group-hover:scale-110")
              }
            />
            <span className="font-medium">{post.likes_count || 0}</span>
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600"
            aria-label="Comentar"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-medium">{post.comments_count || 0}</span>
          </button>
          <span className="ml-auto text-xs text-slate-400">
            <Badge variant={post.is_liked ? "violet" : "gray"}>
              {post.is_liked ? "Curtido" : "Não curtido"}
            </Badge>
          </span>
        </footer>

        {/* Comentários */}
        {showComments && (
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <CommentSection postId={post.id} onChange={() => onChange?.()} />
          </div>
        )}
      </article>

      {editOpen && (
        <CreatePostModal
          open={editOpen}
          onOpenChange={setEditOpen}
          editing={post}
          onSaved={() => {
            setEditOpen(false);
            onChange?.();
          }}
        />
      )}
    </>
  );
}
