/**
 * ChatPage
 * --------
 * Lista de conversas do usuário logado.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PostSkeleton } from "@/components/ui/Skeleton";
import { formatRelativeTime } from "@/lib/utils";
import type { Conversation } from "@/types";
import { MessageCircle } from "lucide-react";

export function ChatPage() {
  const { listConversations, useLiveMessages } = useMessages();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await listConversations();
    setConversations(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLiveMessages(() => {
    load();
  });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 pb-28 lg:pb-0">
      <h1 className="text-2xl font-extrabold flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-violet-500" /> Mensagens
      </h1>

      {loading ? (
        <div className="space-y-2">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          title="Nenhuma conversa ainda"
          description="Vá até um perfil e inicie uma conversa."
          icon={<MessageCircle className="h-10 w-10 text-violet-500" />}
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link
              key={c.peer.id}
              to={`/chat/${c.peer.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 hover:border-cyan-500 transition-colors dark:border-slate-800 dark:bg-slate-900/60"
            >
              <Avatar
                src={c.peer.avatar_url}
                alt={c.peer.username}
                fallback={c.peer.full_name || c.peer.username}
                seed={c.peer.username}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold truncate">{c.peer.full_name || c.peer.username}</div>
                  {c.last_message && (
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(c.last_message.created_at)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {c.last_message?.content || "Sem mensagens"}
                </div>
              </div>
              {c.unread_count > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-500 px-2 text-xs font-bold text-white">
                  {c.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
