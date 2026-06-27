/**
 * Página de autenticação: login, cadastro e "esqueci senha".
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";
import { TrendingUp, Mail, Lock, User as UserIcon, ArrowLeft, Sun, Moon } from "lucide-react";

type Mode = "login" | "register" | "forgot";

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await signIn(email, password);
        if (res.error) return toast.error(res.error);
        toast.success("Bem-vindo(a) de volta!");
        navigate("/feed");
      } else if (mode === "register") {
        if (!username.trim()) return toast.error("Informe um nome de usuário");
        if (!name.trim()) return toast.error("Informe seu nome");
        if (password.length < 6) return toast.error("Senha deve ter ao menos 6 caracteres");
        if (password !== confirmPassword) return toast.error("As senhas não coincidem");
        const res = await signUp(email, password, username.trim(), name.trim());
        if (res.error) return toast.error(res.error);
        toast.success("Conta criada! Verifique seu e-mail se necessário.");
        navigate("/feed");
      } else {
        const res = await resetPassword(email);
        if (res.error) return toast.error(res.error);
        toast.success("Enviamos um link de recuperação para seu e-mail");
        setMode("login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-6">
      <div className="absolute top-4 left-4 flex items-center gap-2 sm:top-8 sm:left-8 z-20">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8B5CF6] shadow-lg shadow-violet-500/20">
          <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-lg font-extrabold sm:text-xl">
          <span className="text-[#2563EB]">Trend</span>
          <span className="text-[#8B5CF6]">Hub</span>
        </span>
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm shadow-slate-200 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950/90 dark:text-slate-200 dark:shadow-none dark:hover:bg-slate-900 sm:top-8 sm:right-8 sm:text-sm"
        aria-label="Alternar tema"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {theme === "dark" ? "Claro" : "Escuro"}
      </button>

      <div className="w-full max-w-md mx-auto mt-20 sm:mt-0">
        <div className="text-center mb-6 px-3 sm:px-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {mode === "login" && "Entre no TrendHub"}
            {mode === "register" && "Crie sua conta"}
            {mode === "forgot" && "Recuperar senha"}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            {mode === "login" && "Conecte-se às suas trends e comunidades favoritas."}
            {mode === "register" && "Entre para tendências, desafios e comunidades incríveis."}
            {mode === "forgot" && "Enviaremos um link de recuperação para seu e-mail."}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "login" && "Login"}
              {mode === "register" && "Cadastro"}
              {mode === "forgot" && "Esqueci minha senha"}
            </CardTitle>
            <CardDescription>
              {mode === "login" && "Acesse com suas credenciais"}
              {mode === "register" && "Preencha seus dados para começar"}
              {mode === "forgot" && "Informe o e-mail da sua conta"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3 px-3 sm:px-0">
              {mode === "register" && (
              <>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nome de usuário"
                    className="pl-9"
                    required
                    autoComplete="username"
                  />
                </div>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome"
                    className="pl-9"
                    required
                    autoComplete="name"
                  />
                </div>
              </>
            )}
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="pl-9"
                  required
                  autoComplete="email"
                />
              </div>
              {mode !== "forgot" && (
                <>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Senha"
                      className="pl-9"
                      required
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                    />
                  </div>
                  {mode === "register" && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmar senha"
                        className="pl-9"
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  )}
                </>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Processando..." : mode === "login" ? "Entrar" : mode === "register" ? "Criar conta" : "Enviar link"}
              </Button>
            </form>

            <div className="mt-4 text-sm text-center space-y-1 px-3 sm:px-0">
              {mode === "login" && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-blue-600 dark:text-cyan-300 hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                  <p className="text-slate-600 dark:text-slate-400">
                    Não tem conta?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-blue-600 dark:text-cyan-300 hover:underline font-medium"
                    >
                      Cadastre-se
                    </button>
                  </p>
                </>
              )}
              {(mode === "register" || mode === "forgot") && (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-cyan-300 hover:underline"
                >
                  <ArrowLeft className="h-3 w-3" /> Voltar para login
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          Ao continuar você concorda com os Termos de Uso e Política de Privacidade do TrendHub.
        </p>
      </div>
    </div>
  );
}
