/**
 * Tipagens centrais do TrendHub.
 *
 * Mantemos tudo em um único arquivo para facilitar a consulta
 * e reutilização nos hooks, contextos e componentes.
 */

export type UUID = string;

/** Perfil público do usuário (extensão da tabela auth.users). */
export interface Profile {
  id: UUID;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

/** Comunidade / desafio criativo. */
export interface Community {
  id: UUID;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  status: "active" | "inactive";
  rules: string | null;
  created_by: UUID;
  created_at: string;
  members_count?: number;
  is_member?: boolean;
  creator?: Profile;
}

/** Postagem (texto, foto ou vídeo via URL). */
export interface Post {
  id: UUID;
  content: string;
  media_url: string | null;
  media_type?: "image" | "video" | null;
  user_id: UUID;
  community_id: UUID | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
  community?: Community | null;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

/** Curtida de post (chave única: user_id + post_id). */
export interface Like {
  id: UUID;
  user_id: UUID;
  post_id: UUID;
  created_at: string;
}

/** Comentário vinculado a um post. */
export interface Comment {
  id: UUID;
  content: string;
  user_id: UUID;
  post_id: UUID;
  created_at: string;
  author?: Profile;
}

/** Relação de seguir entre usuários (follower -> following). */
export interface Follow {
  id: UUID;
  follower_id: UUID;
  following_id: UUID;
  created_at?: string;
}

/** Participação de usuário em comunidade. */
export interface CommunityMember {
  id: UUID;
  user_id: UUID;
  community_id: UUID;
  joined_at: string;
  user?: Profile;
}

/** Mensagem privada entre dois usuários. */
export interface Message {
  id: UUID;
  sender_id: UUID;
  receiver_id: UUID;
  content: string;
  created_at: string;
  read_at: string | null;
  sender?: Profile;
  receiver?: Profile;
}

/** Resumo de uma conversa (lista de chats do usuário). */
export interface Conversation {
  peer: Profile;
  last_message: Message | null;
  unread_count: number;
}
