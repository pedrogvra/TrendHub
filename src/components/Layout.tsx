/**
 * Layout principal do TrendHub.
 * - Desktop: sidebar à esquerda + conteúdo central + rail à direita.
 * - Mobile: conteúdo central + bottom nav bar fixa.
 */
import * as React from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar } from "@/components/ui/Avatar";
import {
  Flame,
  Compass,
  PlusCircle,
  MessageCircle,
  User as UserIcon,
  Sun,
  Moon,
  LogOut,
  TrendingUp,
  Users,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/feed" className="flex items-center gap-2 group">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] shadow-sm shadow-slate-400/20">
        <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.5} />
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-violet-400 ring-2 ring-white dark:ring-slate-900" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-lg font-extrabold tracking-tight">
            <span className="text-[#2563EB]">Trend</span>
            <span className="text-[#8B5CF6]">Hub</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Trends • Comunidades
          </div>
        </div>
      )}
    </Link>
  );
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { to: "/feed", label: "Feed", icon: Home },
  { to: "/explore", label: "Explorar", icon: Compass },
  { to: "/create", label: "Criar", icon: PlusCircle },
  { to: "/communities", label: "Comunidades", icon: Users },
  { to: "/chat", label: "Chat", icon: MessageCircle },
];

function DesktopSidebar() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-200 bg-white/80 backdrop-blur-xl dark:bg-slate-950/80 dark:border-slate-800 p-5 gap-6">
      <Logo />
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/feed" || item.to === "/profile"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-violet-100 text-violet-700 dark:bg-slate-800 dark:text-cyan-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-3">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {theme === "dark" ? "Modo claro" : "Modo escuro"}
        </button>
        <Link
          to="/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Avatar
            src={profile?.avatar_url}
            alt={profile?.full_name || profile?.username}
            fallback={profile?.username}
            seed={profile?.username}
          />
          <div className="flex-1 min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold">{profile?.full_name || profile?.username}</div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">@{profile?.username}</div>
          </div>
        </Link>
        <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}

function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="lg:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:bg-slate-950/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
      <Logo compact />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Abrir menu do perfil"
          >
            <Avatar
              src={profile?.avatar_url}
              alt={profile?.full_name || profile?.username}
              fallback={profile?.username}
              seed={profile?.username}
              size="sm"
              className="h-7 w-7 ring-0"
            />
          </Button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-950">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <UserIcon className="h-4 w-4" />
                Perfil
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur-xl dark:bg-slate-950/90 dark:border-slate-800">
      <div className="flex items-center justify-between gap-1 px-1 py-2">
        {navItems.slice(0, 5).map((item) => {
          const active =
            location.pathname === item.to ||
            (item.to !== "/feed" && location.pathname.startsWith(item.to));
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={cn(
                "flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 text-[10px] font-medium whitespace-nowrap transition-colors",
                active
                  ? "text-blue-600 dark:text-cyan-300"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]")} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function Layout({ children, hideMobileShell = false }: { children: React.ReactNode; hideMobileShell?: boolean }) {
  return (
    <div className="min-h-screen flex">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {!hideMobileShell && <MobileHeader />}
        <main className="flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
        </main>
      </div>
      {!hideMobileShell && <MobileBottomNav />}
    </div>
  );
}

/** Ícone de trend para uso promocional */
export { Flame };
