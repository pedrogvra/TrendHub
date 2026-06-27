/**
 * CreatePage
 * ----------
 * Rota dedicada para "criar" (post). Exibe opções rápidas e abre o modal.
 */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreatePostModal } from "@/components/CreatePostModal";
import { PlusCircle, Users, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Link } from "react-router-dom";

export function CreatePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Abre modal direto ao entrar na rota
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold flex items-center gap-2">
        <PlusCircle className="h-6 w-6 text-cyan-500" /> Criar
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover:border-cyan-500 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-cyan-500" />
              Novo post
            </CardTitle>
            <CardDescription>Compartilhe texto, imagem ou vídeo no feed.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreatePostModal open={true} onOpenChange={(o) => !o && navigate("/feed")} onSaved={() => navigate("/feed")} />
          </CardContent>
        </Card>

        <Link to="/communities/new">
          <Card className="hover:border-violet-500 transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-500" />
                Nova comunidade
              </CardTitle>
              <CardDescription>Crie uma comunidade ou desafio criativo.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Reúna pessoas ao redor de um tema, defina regras e compartilhe desafios.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/chat">
          <Card className="hover:border-blue-500 transition-colors h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                Iniciar conversa
              </CardTitle>
              <CardDescription>Envie uma mensagem privada para alguém.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Acesse o chat para encontrar conversas ou iniciar uma nova.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
