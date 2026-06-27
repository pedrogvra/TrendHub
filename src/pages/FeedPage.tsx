/**
 * Feed
 * ----
 * Linha do tempo: posts de quem o usuário segue + posts das comunidades
 * em que ele é membro. Exibe ainda um atalho para criar um novo post.
 */
import { useEffect, useState } from "react";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { PostSkeleton } from "@/components/ui/Skeleton";
import { CreatePostModal } from "@/components/CreatePostModal";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Compass, PlusCircle, Flame, RefreshCw, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useCommunities } from "@/hooks/useCommunities";
import type { Post, Community } from "@/types";

export function FeedPage() {
  const { user, profile } = useAuth();
  const { fetchFeed } = usePosts();
  const { listJoined } = useCommunities();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const bannerColors = ["#06B6D4", "#2563EB", "#8B5CF6"];
  const [bannerColor, setBannerColor] = useState<string>(bannerColors[1]);

  useEffect(() => {
    const prevIndex = Number(localStorage.getItem("feedBannerIndex") ?? -1);
    const nextIndex = prevIndex >= 0 ? (prevIndex + 1) % bannerColors.length : 0;
    localStorage.setItem("feedBannerIndex", String(nextIndex));
    setBannerColor(bannerColors[nextIndex]);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [feedData, joined] = await Promise.all([fetchFeed(), listJoined()]);
      setPosts(feedData);
      setJoinedCommunities(joined);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg" style={{ backgroundColor: bannerColor }}>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-white/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-violet-100">
            <Flame className="h-4 w-4" />
            Tendências do momento
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            Olá, {profile?.full_name || profile?.username || "explorador"} 👋
          </h1>
          <p className="mt-1 text-sm text-cyan-50">
            Descubra novas trends, participe de desafios e conecte-se com comunidades incríveis.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="bg-white text-blue-700 hover:bg-slate-100"
              onClick={() => setCreateOpen(true)}
            >
              <PlusCircle className="h-4 w-4" /> Novo post
            </Button>
            <Link to="/explore">
              <Button variant="ghost" className="bg-white/15 hover:bg-white/25 text-white">
                <Compass className="h-4 w-4" /> Explorar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Comunidades do usuário */}
      {joinedCommunities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Suas comunidades
            </h2>
            <Link to="/communities" className="text-xs text-violet-600 dark:text-cyan-300 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {joinedCommunities.map((c) => (
              <Link
                key={c.id}
                to={`/communities/${c.id}`}
                className="flex-shrink-0 flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 pr-3 hover:border-cyan-500 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-8 w-8 rounded-lg bg-violet-500 overflow-hidden">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white text-xs font-bold">
                      {c.title.slice(0, 1)}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{c.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Controle do feed */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Feed</h2>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={"h-4 w-4 " + (loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {loading && (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}
        {!loading && posts.length === 0 && (
          <EmptyState
            icon={<Users className="h-10 w-10 text-violet-500" />}
            title="Seu feed está vazio"
            description="Siga pessoas ou entre em comunidades para ver publicações aqui."
            action={
              <Link to="/explore">
                <Button>
                  <Compass className="h-4 w-4" /> Explorar comunidades
                </Button>
              </Link>
            }
          />
        )}
        {!loading && posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)}
      </div>

      <CreatePostModal open={createOpen} onOpenChange={setCreateOpen} onSaved={load} />
    </div>
  );
}
