/**
 * Cliente Supabase do TrendHub.
 *
 * As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem
 * ser configuradas no arquivo `.env` do projeto. Caso não estejam
 * presentes, o cliente é instanciado com valores vazios — isso
 * evita que o build quebre em ambientes sem credenciais.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Helper para detectar se o Supabase está efetivamente configurado. */
export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("your-project"));
