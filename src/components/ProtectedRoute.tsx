import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/ui/Skeleton";

/**
 * ProtectedRoute
 * --------------
 * Componente de proteção de rotas. Se o usuário não estiver autenticado,
 * redireciona para /login preservando o `from` (para voltar depois).
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}

/** Redirect de rotas públicas para quem já está logado (ex.: login, register). */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/feed" replace />;
  return <>{children}</>;
}
