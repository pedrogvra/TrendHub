/**
 * Explorar
 * --------
 * Busca por comunidades e usuários.
 */
import { useEffect, useMemo, useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { useProfile } from "@/hooks/useProfile";
import { CommunityCard } from "@/components/CommunityCard";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/EmptyState";
import { PostSkeleton } from "@/components/ui/Skeleton";
import type { Community, Profile } from "@/types";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { Search, Sparkles } from "lucide-react";

const CATEGORIES = ["Todos", "Arte", "Música", "Games", "Tech", "Fitness", "Culinária", "Moda", "Viagem"];

export function ExplorePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [tab, setTab] = useState<"communities" | "users">("communities");
  const { listAll } = useCommunities();
  const { searchUsers } = useProfile();
  const { user } = useAuth();
  const { toggleFollow, isFollowing } = useFollow();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const c = await listAll({ category: category === "Todos" ? undefined : category, search: query });
      setCommunities(c);
      if (tab === "users") {
        const u = await searchUsers(query);
        setUsers(u);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, tab]);

  useEffect(() => {
    const refresh = async () => {
      const m: Record<string, boolean> = {};
      await Promise.all(
        users.map(async (u) => {
          if (user && u.id !== user.id) m[u.id] = await isFollowing(u.id);
        })
      );
      setFollowingMap(m);
    };
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, user?.id]);

  const toggleFollowHandler = async (id: string) => {
    if (!user) return toast.error("Faça login para seguir");
    try {
      const nowFollowing = await toggleFollow(id);
      setFollowingMap((m) => ({ ...m, [id]: nowFollowing }));
      toast.success(nowFollowing ? "Seguindo!" : "Deixou de seguir");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!query) return users;
    const q = query.toLowerCase();
    return users.filter(
      (u) => u.username.toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-500" />
          Explorar
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Descubra comunidades e pessoas alinhadas com seus interesses.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar comunidades ou usuários..."
          className="pl-9 h-11"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tab === "communities" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("communities")}
        >
          Comunidades
        </Button>
        <Button
          variant={tab === "users" ? "primary" : "outline"}
          size="sm"
          onClick={() => setTab("users")}
        >
          Usuários
        </Button>
      </div>

      {tab === "communities" && (
        <>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={
                  "px-3 py-1 rounded-full text-sm font-medium transition-all " +
                  (category === c
                    ? "bg-[#2563EB] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300")
                }
              >
                {c}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : communities.length === 0 ? (
            <EmptyState title="Nenhuma comunidade encontrada" description="Tente outra busca ou categoria." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {communities.map((c) => (
                <CommunityCard key={c.id} community={c} onChange={load} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "users" && (
        <div className="space-y-2">
          {loading ? (
            <PostSkeleton />
          ) : filteredUsers.length === 0 ? (
            <EmptyState title="Nenhum usuário encontrado" description="Tente outro termo." />
          ) : (
            filteredUsers.map((u) => (
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
                {user && user.id !== u.id && (
                  <Button
                    size="sm"
                    variant={followingMap[u.id] ? "outline" : "primary"}
                    onClick={() => toggleFollowHandler(u.id)}
                  >
                    {followingMap[u.id] ? "Seguindo" : "Seguir"}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
