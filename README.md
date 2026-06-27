# TrendHub

Rede social focada em **trends, desafios criativos e comunidades de nicho**. Construída com Vite + React + TypeScript, Supabase como backend e shadcn/ui-inspired component library.

![TrendHub](https://img.shields.io/badge/stack-React%20%7C%20Vite%20%7C%20Supabase-%2306B6D4)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

---

## ✨ Funcionalidades

- **Autenticação completa**: login, cadastro, "esqueci senha" (Supabase Auth).
- **Feed personalizado**: posts de quem você segue + das comunidades em que você é membro.
- **Posts multimídia**: texto, imagens e vídeos via URL. Curtir, comentar, editar e excluir.
- **Comunidades (CRUD temático)**: crie, edite e exclua comunidades ou desafios criativos; regras, capa, categoria e status.
- **Conexões sociais**: seguir / deixar de seguir, visualizar seguidores e seguindo.
- **Chat em tempo real**: mensagens privadas com Supabase Realtime.
- **Explorar**: busca por comunidades (com filtro por categoria) e usuários.
- **Perfil editável**: avatar (upload para Storage), nome, bio e username.
- **Tema claro/escuro** com persistência em `localStorage`.
- **Interface responsiva**: sidebar no desktop, bottom-nav no mobile.

## 🎨 Paleta oficial

- `#06B6D4` (Ciano)
- `#2563EB` (Azul)
- `#8B5CF6` (Violeta)
- `#64748B` (Cinza)
- `#0F172A` (Escuro)

## 🧱 Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | Vite + React 19 |
| Linguagem | TypeScript 5 |
| Estilos | Tailwind CSS 4 |
| Componentes | shadcn/ui-inspired |
| Backend/BaaS | Supabase (Auth, Postgres, Storage, Realtime) |
| Roteamento | React Router DOM |
| Toasts | sonner |
| Ícones | lucide-react |

## 📁 Estrutura do projeto

```
src/
├── components/      # Componentes compartilhados + UI primitivos
│   └── ui/          # Button, Input, Card, Avatar, Dialog, etc.
├── contexts/        # AuthContext, ThemeContext
├── hooks/           # usePosts, useCommunities, useFollow, useMessages, useProfile
├── lib/             # Supabase client e utilitários
├── pages/           # Páginas da aplicação
├── types/           # Tipagens TypeScript centrais
├── utils/           # Helpers (cn, formatação)
└── App.tsx          # Entry point das rotas
```

## 🚀 Como rodar localmente

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd trendhub
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz (existe `.env.example` como referência):

```bash
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

### 4. Configure o Supabase

No dashboard do seu projeto Supabase:

1. Vá em **SQL Editor** → **New query**.
2. Cole todo o conteúdo do arquivo [`supabase-schema.sql`](./supabase-schema.sql) e execute.
3. Ainda no **SQL Editor**, execute também os scripts:
   - [`supabase-storage-buckets.sql`](./supabase-storage-buckets.sql)
   - [`supabase-storage-policies.sql`](./supabase-storage-policies.sql)
4. Em **Storage**, confirme que os buckets existem:
   - `avatars` (público)
   - `post-media` (público)
5. Em **Authentication** → **Providers**, habilite **Email** (e desative "Confirm email" durante testes, se preferir).
6. Em **Realtime**, habilite realtime para as tabelas `messages`, `likes` e `comments`.

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173).

### 6. Build de produção

```bash
npm run build
npm run preview
```

## 🚢 Deploy na Vercel

1. Faça push para o GitHub.
2. Em [vercel.com](https://vercel.com), importe o repositório.
3. Nas configurações do projeto, adicione as **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. O build é automático (`npm run build`).

## 🔐 Segurança

- Todas as tabelas possuem **Row Level Security (RLS)** habilitado.
- Políticas de leitura/escrita restritas ao `auth.uid()`.
- Uploads no Storage seguem as mesmas restrições (path inicia com `auth.uid()`).
- Senhas são gerenciadas pelo Supabase Auth (bcrypt + salts).

## 🧪 Estrutura do banco

- `profiles` (1-1 com `auth.users`)
- `communities` + `community_members`
- `posts`, `likes`, `comments`
- `follows`
- `messages`

Veja o DDL completo em [`supabase-schema.sql`](./supabase-schema.sql).

## 👤 Autoria

- **Projeto:** TrendHub
- **Desenvolvido por:** Pedro Gabriel
- **Stack:** Vite · React · TypeScript · Supabase · Tailwind CSS