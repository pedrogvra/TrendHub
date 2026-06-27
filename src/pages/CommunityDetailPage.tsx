/**
 * CommunityDetailPage
 * -------------------
 * Detalhe de uma comunidade: cabeçalho, descrição, regras, membros e posts.
 * Permite entrar/sair, editar (se criador) e publicar dentro da comunidade.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCommunities } from "@/hooks/useCommunities";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";
import { PostSkeleton } from "@/components/ui/Skeleton";
import { CreatePostModal } from "@/components/CreatePostModal";
import { toast } from "sonner";
import type { Community, CommunityMember, Post } from "@/types";
import {
  Users,
  PlusCircle,
  LogOut as LogOutIcon,
  Edit2,
  Trash2,
  BookOpen,
  Calendar,
  Crown,
} from "lucide-react";

export function CommunityDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getById, join, leave, remove, listMembers } = useCommunities();
  const { fetchCommunityPosts } = usePosts();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const isCreator = user?.id === community?.created_by;
  const isMember = community?.is_member || isCreator;

  const load = async () => {
    setLoading(true);
    const [c, p, m] = await Promise.all([getById(id), fetchCommunityPosts(id), listMembers(id)]);
    setCommunity(c);
    setPosts(p);
    setMembers(m);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const handleToggleMembership = async () => {
    if (!user) return toast.error("Faça login");
    try {
      if (community?.is_member) {
        await leave(id);
        toast.success("Você saiu da comunidade");
      } else {
        await join(id);
        toast.success("Você entrou na comunidade!");
      }
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erro");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Você é o proprietário. Sair excluirá a comunidade. Deseja continuar?")) return;
    try {
      await remove(id);
      toast.success("Comunidade excluída");
      navigate("/communities");
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    }
  };

  const sortedMembers = useMemo(() => {
    const arr = [...members];
    arr.sort((a, b) => {
      if (a.user_id === community?.created_by) return -1;
      if (b.user_id === community?.created_by) return 1;
      return 0;
    });
    return arr;
  }, [members, community?.created_by]);

  if (loading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (!community) {
    return (
      <EmptyState
        title="Comunidade não encontrada"
        description="Ela pode ter sido removida ou você não tem permissão."
        action={
          <Button onClick={() => navigate("/communities")}>Ver comunidades</Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
        style={{
          backgroundImage: community.image_url ? `url(${community.image_url})` : undefined,
          backgroundColor: community.image_url ? undefined : "#8B5CF6",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="p-6 text-white">
          <Badge variant="outline" className="bg-white/20 text-white border-white/40">
            {community.category || "Geral"}
          </Badge>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{community.title}</h1>
          <p className="mt-1 text-sm text-white/90">{community.description}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/80">
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" /> {community.members_count || 0} membros
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Criada em{" "}
              {new Date(community.created_at).toLocaleDateString("pt-BR")}
            </span>
            {community.status === "inactive" && (
              <Badge variant="gray" className="bg-white/20 text-white border-white/40">
                Inativa
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        {user && !isCreator && (
          <Button variant={community.is_member ? "outline" : "primary"} onClick={handleToggleMembership}>
            {community.is_member ? (
              <>
                <LogOutIcon className="h-4 w-4" /> Sair da comunidade
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" /> Participar
              </>
            )}
          </Button>
        )}
        {isMember && user && (
          <Button variant="secondary" onClick={() => setCreateOpen(true)}>
            <PlusCircle className="h-4 w-4" /> Publicar aqui
          </Button>
        )}
        {isCreator && (
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit2 className="h-4 w-4" /> Editar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <LogOutIcon className="h-4 w-4" /> Sair da comunidade
            </Button>
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Posts */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold">Publicações</h2>
          {posts.length === 0 ? (
            <EmptyState
              title="Ainda sem publicações"
              description={isMember ? "Seja o primeiro a publicar nesta comunidade!" : "Entre na comunidade para publicar."}
            />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)
          )}
        </div>

        {/* Sidebar: regras + membros */}
        <div className="space-y-4">
          {community.rules && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-blue-500" /> Regras
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                {community.rules}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-violet-500" /> Membros ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sortedMembers.slice(0, 8).map((m) => (
                <Link
                  key={m.id}
                  to={`/u/${m.user?.id}`}
                  className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Avatar
                    src={m.user?.avatar_url}
                    alt={m.user?.username}
                    fallback={m.user?.username}
                    seed={m.user?.username}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0 leading-tight">
                    <div className="text-sm font-medium truncate flex items-center gap-1">
                      {m.user_id === community.created_by && <Crown className="h-3 w-3 text-violet-500" />}
                      {m.user?.full_name || m.user?.username}
                    </div>
                    <div className="text-xs text-slate-500 truncate">@{m.user?.username}</div>
                  </div>
                </Link>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-slate-500">Ainda sem membros.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modais */}
      {createOpen && (
        <CreatePostModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          initialCommunityId={community.id}
          onSaved={load}
        />
      )}

      {editOpen && community && (
        <EditCommunityModal
          open={editOpen}
          onOpenChange={setEditOpen}
          community={community}
          onSaved={async () => {
            setEditOpen(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function EditCommunityModal({
  open,
  onOpenChange,
  community,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  community: Community;
  onSaved: () => void;
}) {
  const { update } = useCommunities();
  const [title, setTitle] = useState(community.title);
  const [description, setDescription] = useState(community.description);
  const [category, setCategory] = useState(community.category);
  const [image_url, setImageUrl] = useState(community.image_url || "");
  const [rules, setRules] = useState(community.rules || "");
  const [status, setStatus] = useState<"active" | "inactive">(community.status);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await update(community.id, { title, description, category, image_url, rules, status });
      toast.success("Comunidade atualizada");
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Editar comunidade</DialogTitle>
          <DialogDescription>Atualize as informações da sua comunidade.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" required />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" rows={3} required />
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria" />
          <Input value={image_url} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL da imagem" />
          <Textarea value={rules} onChange={(e) => setRules(e.target.value)} placeholder="Regras (opcional)" rows={3} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="active">Ativa</option>
            <option value="inactive">Inativa</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
