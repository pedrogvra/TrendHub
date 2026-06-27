/**
 * AuthContext
 * -----------
 * Gerencia o ciclo de vida de autenticação do usuário:
 *  - Sessão atual (Supabase Auth)
 *  - Perfil carregado da tabela `profiles`
 *  - Ações de sign up, sign in, sign out e reset de senha
 *
 * Também expõe um helper `refreshProfile()` para recarregar o perfil
 * após edições.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, full_name: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  /** Busca o perfil vinculado ao usuário logado. */
  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("loadProfile error", error);
      return;
    }
    setProfile(data as Profile | null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  useEffect(() => {
    // Pega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    // Escuta mudanças de auth (login, logout, token refresh, etc.)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(
    async (email: string, password: string, username: string, full_name: string) => {
      // Verifica username único antes de registrar
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (existing) return { error: "Este nome de usuário já está em uso." };

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, full_name } },
      });
      if (error) return { error: error.message };

      // Após o cadastro, cria o perfil inicial (caso o trigger não exista)
      const {
        data: { user: newUser },
      } = await supabase.auth.getUser();
      if (newUser) {
        const { error: insertError } = await supabase.from("profiles").upsert({
          id: newUser.id,
          username,
          full_name,
        });
        if (insertError) console.warn("Erro ao criar perfil inicial:", insertError.message);
      }
      return {};
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, session, loading, signUp, signIn, signOut, resetPassword, refreshProfile }),
    [user, profile, session, loading, signUp, signIn, signOut, resetPassword, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
