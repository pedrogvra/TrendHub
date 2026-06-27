/**
 * App.tsx
 * -------
 * Ponto de entrada da aplicação TrendHub.
 * Configura provedores (tema, autenticação, toasts) e define as rotas.
 */
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { ProtectedRoute, PublicOnlyRoute } from "@/components/ProtectedRoute";

// Páginas
import { AuthPage } from "@/pages/AuthPage";
import { FeedPage } from "@/pages/FeedPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { CreatePage } from "@/pages/CreatePage";
import { CommunitiesPage } from "@/pages/CommunitiesPage";
import { CommunityDetailPage } from "@/pages/CommunityDetailPage";
import { CreateCommunityPage } from "@/pages/CreateCommunityPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { EditProfilePage } from "@/pages/EditProfilePage";
import { ChatPage } from "@/pages/ChatPage";
import { ConversationPage } from "@/pages/ConversationPage";

// Escolhe HashRouter em ambiente estático (vite-plugin-singlefile)
const Router: typeof BrowserRouter =
  typeof window !== "undefined" && window.location.protocol === "file:"
    ? (HashRouter as any)
    : (HashRouter as any);

function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      theme={theme}
      toastOptions={{
        style: {
          background: theme === "dark" ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.95)",
          color: theme === "dark" ? "#f8fafc" : "#0f172a",
          border: theme === "dark" ? "1px solid rgba(148,163,184,0.16)" : "1px solid rgba(15,23,42,0.1)",
          backdropFilter: "blur(12px)",
        },
      }}
    />
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rotas públicas */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <AuthPage />
                </PublicOnlyRoute>
              }
            />

            {/* Rotas protegidas com layout */}
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Layout>
                    <FeedPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ExplorePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreatePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communities"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CommunitiesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communities/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateCommunityPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/communities/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CommunityDetailPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/u/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProfilePage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChatPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:peerId"
              element={
                <ProtectedRoute>
                  <Layout hideMobileShell>
                    <ConversationPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Redirecionamentos */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </Router>

        <AppToaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
