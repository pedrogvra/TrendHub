/**
 * useMessages
 * -----------
 * Mensagens privadas em tempo real usando Supabase Realtime.
 *
 * - `listConversations`: retorna as pessoas com quem o usuário trocou mensagens.
 * - `fetchConversation`: carrega o histórico entre dois usuários.
 * - `sendMessage`: insere uma nova mensagem.
 * - `subscribeToMessages`: abre um canal Realtime e chama o callback
 *   sempre que houver INSERT/UPDATE.
 */
import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Conversation, Message } from "@/types";

export function useMessages() {
  const { user } = useAuth();

  const listConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!user) return [];
    // Busca todas as mensagens enviadas ou recebidas
    const { data: sent } = await supabase
      .from("messages")
      .select(`*, receiver:profiles!messages_receiver_id_fkey (id, username, full_name, avatar_url)`)
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false });

    const { data: received } = await supabase
      .from("messages")
      .select(`*, sender:profiles!messages_sender_id_fkey (id, username, full_name, avatar_url)`)
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    // Consolida por peer e mantém o último envio mais recente.
    const map = new Map<string, Conversation>();
    const process = (m: any, incoming: boolean) => {
      const peer = incoming ? m.sender : m.receiver;
      if (!peer) return;
      const message: Message = {
        id: m.id,
        sender_id: m.sender_id,
        receiver_id: m.receiver_id,
        content: m.content,
        created_at: m.created_at,
        read_at: m.read_at,
      };
      const existing = map.get(peer.id);
      const unreadIncrement = incoming && !m.read_at ? 1 : 0;

      if (!existing) {
        map.set(peer.id, {
          peer: peer as any,
          last_message: message,
          unread_count: unreadIncrement,
        });
        return;
      }

      // Atualiza última mensagem se esta for mais recente.
      if (new Date(message.created_at).getTime() > new Date(existing.last_message.created_at).getTime()) {
        existing.last_message = message;
      }

      if (incoming && !m.read_at) {
        existing.unread_count += 1;
      }
    };

    [...(sent || []), ...(received || [])].forEach((m: any) => process(m, m.receiver_id === user.id));

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.last_message?.created_at || 0).getTime() -
        new Date(a.last_message?.created_at || 0).getTime()
    );
  }, [user]);

  const fetchConversation = useCallback(
    async (peerId: string): Promise<Message[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("messages")
        .select(
          `*, sender:profiles!messages_sender_id_fkey (id, username, full_name, avatar_url), receiver:profiles!messages_receiver_id_fkey (id, username, full_name, avatar_url)`
        )
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) return [];

      // Marca como lidas as recebidas
      const unread = (data || []).filter((m: any) => m.receiver_id === user.id && !m.read_at);
      if (unread.length) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .in(
            "id",
            unread.map((m: any) => m.id)
          );
      }
      return (data || []) as Message[];
    },
    [user]
  );

  const sendMessage = useCallback(
    async (receiverId: string, content: string) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("messages")
        .insert({ sender_id: user.id, receiver_id: receiverId, content })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Message;
    },
    [user]
  );

  const updateMessage = useCallback(
    async (messageId: string, content: string) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("messages")
        .update({ content })
        .eq("id", messageId)
        .eq("sender_id", user.id)
        .is("read_at", null)
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Mensagem não encontrada ou já lida");
      return data as Message;
    },
    [user]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", user.id)
        .is("read_at", null)
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Mensagem não encontrada ou já lida");
    },
    [user]
  );

  /** Inscreve em mudanças na tabela de mensagens para o usuário atual. */
  const subscribeToMessages = useCallback(
    (callback: (msg: Message) => void) => {
      if (!user) return () => {};
      const channel = supabase.channel(`messages:${user.id}`);
      channel
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload: any) => {
            const row = payload.new as Message;
            if (row.sender_id === user.id || row.receiver_id === user.id) {
              callback(row);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages" },
          (payload: any) => {
            const row = payload.new as Message;
            if (row.sender_id === user.id || row.receiver_id === user.id) {
              callback(row);
            }
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    },
    [user]
  );

  // Hook-friendly: mantém a subscription viva enquanto o componente estiver montado
  const useLiveMessages = useCallback(
    (callback: (msg: Message) => void) => {
      const cbRef = useRef(callback);
      cbRef.current = callback;
      useEffect(() => {
        return subscribeToMessages((m) => cbRef.current(m));
      }, [subscribeToMessages]);
    },
    [subscribeToMessages]
  );

  return { listConversations, fetchConversation, sendMessage, updateMessage, deleteMessage, useLiveMessages };
}
