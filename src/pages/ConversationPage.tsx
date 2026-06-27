/**
 * ConversationPage
 * ----------------
 * Janela de chat em tempo real entre dois usuários.
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import type { Message, Profile } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowLeft, Edit3, Send, Trash2 } from "lucide-react";

export function ConversationPage() {
  const { peerId = "" } = useParams<{ peerId: string }>();
  const { user } = useAuth();
  const { fetchConversation, sendMessage, updateMessage, deleteMessage, useLiveMessages } = useMessages();
  const { getById } = useProfile();
  const navigate = useNavigate();

  const [peer, setPeer] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!peerId) return;
    setLoading(true);
    const [p, msgs] = await Promise.all([getById(peerId), fetchConversation(peerId)]);
    setPeer(p);
    setMessages(msgs);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId]);

  useLiveMessages((m) => {
    if (m.sender_id === peerId || m.receiver_id === peerId) {
      setMessages((prev) => {
        const existing = prev.find((x) => x.id === m.id);
        if (!existing) return [...prev, m];
        return prev.map((x) => (x.id === m.id ? m : x));
      });
    }
  });

  const startEditing = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  const saveEdit = async (e: React.FormEvent, messageId: string) => {
    e.preventDefault();
    if (!editingText.trim()) return;
    setActionLoading(messageId);
    try {
      const updated = await updateMessage(messageId, editingText.trim());
      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? updated : msg)));
      toast.success("Mensagem atualizada");
      cancelEditing();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar mensagem");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Excluir mensagem antes de ser lida?")) return;
    setActionLoading(messageId);
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success("Mensagem excluída");
      if (editingMessageId === messageId) cancelEditing();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir mensagem");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !user) return;
    const content = value.trim();
    setValue("");
    setSending(true);
    try {
      const m = await sendMessage(peerId, content);
      setMessages((prev) => [...prev, m]);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500" />
      </div>
    );
  }

  if (!peer) return <EmptyState title="Usuário não encontrado" />;

  return (
    <div className="relative w-full overflow-hidden">
      {/* Cabeçalho */}
      <div className="fixed inset-x-0 top-0 z-20 flex w-full items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:left-64 lg:top-0">
        <div className="flex w-full items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")} aria-label="Voltar">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Link to={`/u/${peer.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar
              src={peer.avatar_url}
              alt={peer.username}
              fallback={peer.full_name || peer.username}
              seed={peer.username}
            />
            <div className="min-w-0">
              <div className="font-semibold truncate">{peer.full_name || peer.username}</div>
              <div className="text-xs text-slate-500 truncate">@{peer.username}</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Mensagens */}
      <div className="fixed inset-x-0 top-24 bottom-20 overflow-y-auto px-4 py-4 space-y-2 lg:left-64 lg:right-0 lg:top-14 lg:bottom-14">
        {messages.length === 0 ? (
          <EmptyState title="Diga olá!" description={`Inicie a conversa com ${peer.full_name || peer.username}.`} />
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            const isEditing = editingMessageId === m.id;
            const canModify = mine && !m.read_at;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    mine
                      ? "bg-[#2563EB] text-white rounded-br-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm"
                  )}
                >
                  {isEditing ? (
                    <form onSubmit={(e) => saveEdit(e, m.id)} className="space-y-2">
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="rounded-xl border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={!editingText.trim() || actionLoading === m.id}
                          className="rounded-xl bg-white/10 px-3 py-1 text-xs font-semibold text-white enabled:hover:bg-white/20 disabled:opacity-50"
                        >
                          Salvar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className={cn("text-[10px]", mine ? "text-white/70" : "text-slate-500")}>{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                        {canModify && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(m)}
                              disabled={actionLoading === m.id}
                              aria-label="Editar mensagem"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteMessage(m.id)}
                              disabled={actionLoading === m.id}
                              aria-label="Deletar mensagem"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={submit}
        className="fixed inset-x-0 bottom-0 z-20 mx-0 flex items-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:left-64"
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Digite sua mensagem..."
            maxLength={1000}
          />
          <Button type="submit" size="icon" disabled={!value.trim() || sending} aria-label="Enviar">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
