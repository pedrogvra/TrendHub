/**
 * CreateCommunityPage
 * -------------------
 * Formulário para criar uma nova comunidade / desafio criativo.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCommunities } from "@/hooks/useCommunities";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { toast } from "sonner";
import { Users, Sparkles } from "lucide-react";

export function CreateCommunityPage() {
  const navigate = useNavigate();
  const { create } = useCommunities();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Geral");
  const [image_url, setImageUrl] = useState("");
  const [rules, setRules] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Informe um título");
    if (!description.trim()) return toast.error("Informe uma descrição");
    setLoading(true);
    try {
      const c = await create({
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || "Geral",
        image_url: image_url.trim() || null,
        rules: rules.trim() || null,
        status,
        created_by: "", // substituído pelo backend (RLS / auth.uid)
      });
      toast.success("Comunidade criada!");
      navigate(`/communities/${c.id}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar comunidade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-500" />
          Nova comunidade
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Crie um espaço para trends, desafios criativos ou discussões de nicho.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-500" />
            Informações da comunidade
          </CardTitle>
          <CardDescription>Preencha os campos para criar sua comunidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Design Minimalista" required />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição *</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sobre o que é essa comunidade?" rows={3} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Arte, Games, Tech" />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">URL da imagem de capa (opcional)</label>
              <Input value={image_url} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
              {image_url && (
                <div className="mt-2 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img src={image_url} alt="preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Regras (opcional)</label>
              <Textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Defina breves regras de convivência..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/communities")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar comunidade"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
