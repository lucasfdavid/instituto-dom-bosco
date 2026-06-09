-- Migração: adiciona coluna obs_aluno à tabela revisoes
-- Execute no Supabase > SQL Editor

alter table public.revisoes add column if not exists obs_aluno text;
