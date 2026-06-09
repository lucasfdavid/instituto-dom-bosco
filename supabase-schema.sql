-- =============================================
-- INSTITUTO DOM BOSCO — Schema do Supabase
-- Cole este SQL no Supabase > SQL Editor > Run
-- =============================================

-- 1. PERFIS (extensão da tabela auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  email text not null,
  role text not null check (role in ('aluno', 'professor')),
  criado_em timestamptz default now()
);

-- Trigger: cria perfil automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', 'Usuário'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'aluno')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CONTEÚDOS ESTUDADOS
create table public.conteudos (
  id uuid default gen_random_uuid() primary key,
  aluno_id uuid references public.profiles(id) on delete cascade not null,
  materia text not null,
  assunto text not null,
  data_estudo date not null,
  criado_em timestamptz default now()
);

-- 3. REVISÕES (D1, D7, D30)
create table public.revisoes (
  id uuid default gen_random_uuid() primary key,
  conteudo_id uuid references public.conteudos(id) on delete cascade not null,
  aluno_id uuid references public.profiles(id) on delete cascade not null,
  tipo text not null check (tipo in ('D1', 'D7', 'D30')),
  data_revisao date not null,
  concluida boolean default false,
  concluida_em timestamptz,
  status text,
  teacher_comment text,
  obs_aluno text,
  criado_em timestamptz default now()
);

-- 4. VÍNCULO PROFESSOR ↔ ALUNO
create table public.professor_aluno (
  id uuid default gen_random_uuid() primary key,
  professor_id uuid references public.profiles(id) on delete cascade not null,
  aluno_id uuid references public.profiles(id) on delete cascade not null,
  criado_em timestamptz default now(),
  unique(professor_id, aluno_id)
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) — segurança dos dados
-- =============================================

alter table public.profiles enable row level security;
alter table public.conteudos enable row level security;
alter table public.revisoes enable row level security;
alter table public.professor_aluno enable row level security;

-- Profiles: cada um vê o próprio perfil; professores veem alunos vinculados
create policy "Usuário vê próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Professor vê perfis dos seus alunos"
  on public.profiles for select
  using (
    exists (
      select 1 from public.professor_aluno pa
      where pa.professor_id = auth.uid()
      and pa.aluno_id = profiles.id
    )
  );

-- Conteúdos: aluno vê/cria os próprios; professor vê dos seus alunos
create policy "Aluno acessa próprios conteúdos"
  on public.conteudos for all
  using (auth.uid() = aluno_id);

create policy "Professor vê conteúdos dos seus alunos"
  on public.conteudos for select
  using (
    exists (
      select 1 from public.professor_aluno pa
      where pa.professor_id = auth.uid()
      and pa.aluno_id = conteudos.aluno_id
    )
  );

-- Revisões: aluno vê/atualiza as próprias; professor vê dos seus alunos
create policy "Aluno acessa próprias revisões"
  on public.revisoes for all
  using (auth.uid() = aluno_id);

create policy "Professor vê revisões dos seus alunos"
  on public.revisoes for select
  using (
    exists (
      select 1 from public.professor_aluno pa
      where pa.professor_id = auth.uid()
      and pa.aluno_id = revisoes.aluno_id
    )
  );

-- Professor_aluno: professor vê seus vínculos
create policy "Professor vê seus vínculos"
  on public.professor_aluno for select
  using (auth.uid() = professor_id);

-- =============================================
-- DADOS DE EXEMPLO (opcional — remova em produção)
-- =============================================

-- Para criar usuários de teste, use o Supabase Auth > Users > Add User
-- e preencha os metadados: { "nome": "João Oliveira", "role": "aluno" }
