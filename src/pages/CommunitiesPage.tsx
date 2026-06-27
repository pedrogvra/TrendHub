/**
 * CommunitiesPage
 * ---------------
 * Lista de todas as comunidades + atalho para criar uma nova.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCommunities } from "@/hooks/useCommunities";
import { CommunityCard } from "@/components/CommunityCard";
import { EmptyState } from "@/components/EmptyState";
import { PostSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlusCircle, Search, Users } from "lucide-react";
import type { Community } from "@/types";

export function CommunitiesPage() {
  const { listAll } = useCommunities();
  const [items, setItems] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const data = await listAll({ search: q });
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2">
            <Users className="h-6 w-6 text-violet-500" />
            Comunidades
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Participe de comunidades e desafios criativos.
          </p>
        </div>
        <Link to="/communities/new">
          <Button>
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Nova comunidade</span>
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar comunidades..."
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhuma comunidade ainda"
          description="Seja o primeiro a criar uma comunidade no TrendHub."
          icon={<Users className="h-10 w-10 text-violet-500" />}
          action={
            <Link to="/communities/new">
              <Button>
                <PlusCircle className="h-4 w-4" /> Criar comunidade
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((c) => (
            <CommunityCard key={c.id} community={c} onChange={load} />
          ))}
        </div>
      )}
    </div>
  );
}
