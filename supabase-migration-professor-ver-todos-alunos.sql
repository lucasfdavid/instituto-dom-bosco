-- Migração: professor passa a ver todos os alunos (não apenas vinculados)
-- Execute no Supabase > SQL Editor

-- Remove a policy antiga (restrita a vínculos)
drop policy if exists "Professor vê perfis dos seus alunos" on public.profiles;

-- Cria nova policy: professor vê todos os perfis com role = 'aluno'
create policy "Professor vê todos os alunos"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'professor'
    )
    and profiles.role = 'aluno'
  );
