/**
 * ProfilePage
 * -----------
 * Visualiza perfil público do usuário logado ou de outro usuário.
 * - Se for o próprio, exibe botão de editar.
 * - Se for outro, exibe botão seguir/deixar de seguir + stats.
 * - Lista posts e abas para seguidores/seguindo.
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { useFollow } from "@/hooks/useFollow";
import { Avatar, getAvatarColorClass } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { PostSkeleton } from "@/components/ui/Skeleton";
import { TabsTrigger } from "@/components/ui/Tabs";
import { toast } from "sonner";
import type { Post, Profile } from "@/types";
import { Edit2, UserPlus, UserMinus, MessageCircle, Calendar } from "lucide-react";

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { getById } = useProfile();
  const { fetchUserPosts } = usePosts();
  const { toggleFollow, isFollowing, getStats, listFollowers, listFollowing } = useFollow();
  const navigate = useNavigate();

  const targetId = id || user?.id || "";
  const isMe = !id || id === user?.id;

  const [viewProfile, setViewProfile] = useState<Profile | null>(isMe ? profile : null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollow, setIsFollow] = useState(false);
  const [tab, setTab] = useState<"posts" | "followers" | "following">("posts");
  const [loading, setLoading] = useState(true);
  const [followList, setFollowList] = useState<Profile[]>([]);

  const load = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [p, ps, stats] = await Promise.all([
        isMe ? Promise.resolve(profile) : getById(targetId),
        fetchUserPosts(targetId),
        getStats(targetId),
      ]);
      setViewProfile(p || null);
      setPosts(ps);
      setFollowers(stats.followers);
      setFollowing(stats.following);
      if (!isMe && user) setIsFollow(await isFollowing(targetId));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, user?.id]);

  const handleFollow = async () => {
    if (!user) return toast.error("Faça login");
    try {
      const now = await toggleFollow(targetId);
      setIsFollow(now);
      setFollowers((v) => v + (now ? 1 : -1));
      toast.success(now ? "Seguindo!" : "Deixou de seguir");
      if (tab === "followers" || tab === "following") {
        await openFollowList(tab);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openFollowList = async (kind: "followers" | "following") => {
    setTab(kind);
    const data = kind === "followers" ? await listFollowers(targetId) : await listFollowing(targetId);
    setFollowList(data);
  };

  const displayName = viewProfile?.full_name || viewProfile?.username || "usuário";

  if (loading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (!viewProfile) {
    return <EmptyState title="Perfil não encontrado" />;
  }

  const bannerColorClass = getAvatarColorClass(viewProfile?.username, viewProfile?.full_name, viewProfile?.username);

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className={"h-32 relative " + bannerColorClass} />
        <CardContent className="pt-4">
          <div className="-mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar src={viewProfile.avatar_url} alt={displayName} fallback={viewProfile.username} seed={viewProfile.username} size="xl" />
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                {displayName}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">@{viewProfile.username}</p>
            </div>
            <div className="flex gap-2">
              {isMe ? (
                <Button onClick={() => navigate("/profile/edit")}>
                  <Edit2 className="h-4 w-4" /> Editar perfil
                </Button>
              ) : (
                <>
                  <Button variant={isFollow ? "outline" : "primary"} onClick={handleFollow}>
                    {isFollow ? <UserMinus className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isFollow ? "Deixar de seguir" : "Seguir"}
                  </Button>
                  <Button variant="outline" onClick={() => navigate(`/chat/${targetId}`)} aria-label="Mensagem">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {viewProfile.bio && <p className="mt-4 whitespace-pre-wrap text-sm">{viewProfile.bio}</p>}

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Desde {new Date(viewProfile.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
          </div>

          <div className="mt-4 flex gap-5">
            <button onClick={() => openFollowList("followers")} className="text-sm hover:underline">
              <span className="font-bold">{followers}</span>{" "}
              <span className="text-slate-500 dark:text-slate-400">seguidores</span>
            </button>
            <button onClick={() => openFollowList("following")} className="text-sm hover:underline">
              <span className="font-bold">{following}</span>{" "}
              <span className="text-slate-500 dark:text-slate-400">seguindo</span>
            </button>
            <span className="text-sm">
              <span className="font-bold">{posts.length}</span>{" "}
              <span className="text-slate-500 dark:text-slate-400">posts</span>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <TabsTrigger value="posts" activeValue={tab} onSelect={() => setTab("posts")}>
          Posts
        </TabsTrigger>
        <TabsTrigger value="followers" activeValue={tab} onSelect={() => openFollowList("followers")}>
          Seguidores
        </TabsTrigger>
        <TabsTrigger value="following" activeValue={tab} onSelect={() => openFollowList("following")}>
          Seguindo
        </TabsTrigger>
      </div>

      {tab === "posts" && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <EmptyState title="Sem publicações ainda" description="Este usuário ainda não publicou nada." />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)
          )}
        </div>
      )}

      {(tab === "followers" || tab === "following") && (
        <div className="space-y-2">
          {followList.length === 0 ? (
            <EmptyState title="Nenhum usuário aqui ainda" />
          ) : (
            followList.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <Link to={`/u/${u.id}`}>
                  <Avatar
                    src={u.avatar_url}
                    alt={u.username}
                    fallback={u.full_name || u.username}
                    seed={u.username}
                  />
                </Link>
                <Link to={`/u/${u.id}`} className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{u.full_name || u.username}</div>
                  <div className="text-xs text-slate-500 truncate">@{u.username}</div>
                </Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
