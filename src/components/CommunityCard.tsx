/**
 * CommunityCard
 * -------------
 * Card usado em listagens de comunidades (explorar, perfil, etc).
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useCommunities } from "@/hooks/useCommunities";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Community } from "@/types";
import { Users } from "lucide-react";

export function CommunityCard({
  community,
  onChange,
}: {
  community: Community;
  onChange?: () => void;
}) {
  const { user } = useAuth();
  const { join, leave } = useCommunities();

  const toggle = async () => {
    if (!user) return toast.error("Faça login para entrar");
    try {
      if (community.is_member) {
        await leave(community.id);
        toast.success("Você saiu da comunidade");
      } else {
        await join(community.id);
        toast.success("Você entrou na comunidade!");
      }
      onChange?.();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar");
    }
  };

  return (
    <Card className="overflow-hidden group">
      {community.image_url && (
        <div className="h-32 bg-blue-600 relative">
          <img src={community.image_url} alt={community.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/25" />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar
            src={community.image_url}
            alt={community.title}
            fallback={community.title}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <Link
              to={`/communities/${community.id}`}
              className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-300 line-clamp-1"
            >
              {community.title}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="violet">{community.category || "Geral"}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Users className="h-3 w-3" />
                {community.members_count || 0} membros
              </span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {community.description}
        </p>
        {user && (
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant={community.is_member ? "outline" : "primary"}
              onClick={toggle}
            >
              {community.is_member ? "Sair" : "Participar"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
