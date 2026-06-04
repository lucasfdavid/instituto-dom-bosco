# Instituto Dom Bosco — App

App mobile-first de repetição espaçada (método D1·D7·D30) para o Instituto Dom Bosco.

## Stack
- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Supabase** (banco de dados + autenticação)
- **Vercel** (hospedagem)

---

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
# Preencha .env.local com suas credenciais do Supabase
npm run dev
```

---

## Configuração do Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Vá em **SQL Editor** e cole o conteúdo de `supabase-schema.sql`
3. Clique em **Run**
4. Copie a **URL** e a **anon key** em Project Settings → API
5. Cole no arquivo `.env.local`

### Criar usuários de teste

No Supabase: **Authentication → Users → Add User**

Preencha os **User Metadata** assim:
```json
{ "nome": "João Oliveira", "role": "aluno" }
{ "nome": "Sarah Fernandes", "role": "professor" }
```

### Vincular professor ↔ aluno

No Supabase: **Table Editor → professor_aluno → Insert Row**
- `professor_id`: ID da Sarah
- `aluno_id`: ID do João

---

## Deploy no Vercel

1. Suba o projeto no GitHub
2. Acesse [vercel.com](https://vercel.com) → **Import Project**
3. Selecione o repositório
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Clique em **Deploy**

---

## Logo

Coloque os arquivos em `/public/images/`:
- `logo.png` — logotipo tipográfico (fundo transparente)
- `coluna.png` — ícone da coluna

---

## Estrutura do projeto

```
src/
├── app/
│   ├── auth/login/         # Tela de login
│   ├── aluno/              # Painel do aluno
│   │   ├── page.tsx        # Home (revisões do dia)
│   │   ├── calendario/     # Calendário
│   │   ├── registrar/      # Registrar conteúdo
│   │   └── historico/      # Histórico
│   └── professor/          # Painel do professor
│       ├── page.tsx        # Lista de alunos
│       └── aluno/[id]/     # Detalhe do aluno
├── components/
│   ├── ui/                 # Topbar, BottomNav
│   ├── calendar/           # Componente de calendário
│   └── tasks/              # RevCard
└── lib/
    ├── supabase/           # Clientes (browser + server)
    ├── types.ts            # Tipos TypeScript
    └── utils.ts            # Helpers
```
