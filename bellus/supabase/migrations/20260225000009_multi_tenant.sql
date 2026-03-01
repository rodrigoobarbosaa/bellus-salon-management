-- ============================================================================
-- Migration 009: Multi-tenant schema (saloes + usuarios + salao_id FKs)
-- Story 1.3 — Schema do Banco de Dados Base
-- ============================================================================

-- 1. Tabela saloes (cada salão = um tenant)
CREATE TABLE IF NOT EXISTS saloes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text UNIQUE NOT NULL,
  whatsapp text,
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  moeda text NOT NULL DEFAULT 'EUR',
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabela usuarios (bridge entre auth.users e o sistema)
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salao_id uuid NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('proprietario', 'profissional', 'cliente')),
  nome text NOT NULL,
  email text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- 3. Adicionar salao_id em todas as tabelas existentes
ALTER TABLE profissionais ADD COLUMN IF NOT EXISTS salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE servicos ADD COLUMN IF NOT EXISTS salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE transacoes_fiscais ADD COLUMN IF NOT EXISTS salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE lembretes_config ADD COLUMN IF NOT EXISTS salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;
ALTER TABLE notificacoes_log ADD COLUMN IF NOT EXISTS salao_id uuid REFERENCES saloes(id) ON DELETE CASCADE;

-- 4. Função helper para obter salao_id do usuário autenticado
-- Nota: usa public schema (auth schema é protegido no Supabase Dashboard)
CREATE OR REPLACE FUNCTION public.get_salao_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT salao_id FROM public.usuarios WHERE id = auth.uid()
$$;

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE saloes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 6. Dropar políticas RLS single-tenant existentes
DROP POLICY IF EXISTS "Authenticated users can select profissionais" ON profissionais;
DROP POLICY IF EXISTS "Authenticated users can insert profissionais" ON profissionais;
DROP POLICY IF EXISTS "Profissionais can update own profile" ON profissionais;
DROP POLICY IF EXISTS "Authenticated users can select clientes" ON clientes;
DROP POLICY IF EXISTS "Authenticated users can insert clientes" ON clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON clientes;
DROP POLICY IF EXISTS "Authenticated users can select servicos" ON servicos;
DROP POLICY IF EXISTS "Authenticated users can insert servicos" ON servicos;
DROP POLICY IF EXISTS "Authenticated users can update servicos" ON servicos;
DROP POLICY IF EXISTS "Authenticated users can select servicos_profissionais" ON servicos_profissionais;
DROP POLICY IF EXISTS "Authenticated users can insert servicos_profissionais" ON servicos_profissionais;
DROP POLICY IF EXISTS "Authenticated users can delete servicos_profissionais" ON servicos_profissionais;
DROP POLICY IF EXISTS "Authenticated users can select agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Authenticated users can insert agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Authenticated users can update agendamentos" ON agendamentos;
DROP POLICY IF EXISTS "Authenticated users can select pagamentos" ON pagamentos;
DROP POLICY IF EXISTS "Authenticated users can insert pagamentos" ON pagamentos;
DROP POLICY IF EXISTS "Authenticated users can select transacoes_fiscais" ON transacoes_fiscais;
DROP POLICY IF EXISTS "Authenticated users can insert transacoes_fiscais" ON transacoes_fiscais;
DROP POLICY IF EXISTS "Authenticated users can select lembretes_config" ON lembretes_config;
DROP POLICY IF EXISTS "Authenticated users can insert lembretes_config" ON lembretes_config;
DROP POLICY IF EXISTS "Authenticated users can update lembretes_config" ON lembretes_config;
DROP POLICY IF EXISTS "Authenticated users can select notificacoes_log" ON notificacoes_log;
DROP POLICY IF EXISTS "Authenticated users can insert notificacoes_log" ON notificacoes_log;
DROP POLICY IF EXISTS "Authenticated users can update notificacoes_log" ON notificacoes_log;

-- 7. Políticas RLS multi-tenant: saloes
CREATE POLICY "Users can select own salon" ON saloes
  FOR SELECT USING (id = public.get_salao_id());

-- 8. Políticas RLS multi-tenant: usuarios
CREATE POLICY "Users can select salon members" ON usuarios
  FOR SELECT USING (salao_id = public.get_salao_id());

CREATE POLICY "Users can insert into own salon" ON usuarios
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

-- 9. Políticas RLS multi-tenant para tabelas existentes
-- profissionais
CREATE POLICY "Tenant select profissionais" ON profissionais
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert profissionais" ON profissionais
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update own profissional" ON profissionais
  FOR UPDATE USING (salao_id = public.get_salao_id() AND user_id = auth.uid());

-- clientes
CREATE POLICY "Tenant select clientes" ON clientes
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert clientes" ON clientes
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update clientes" ON clientes
  FOR UPDATE USING (salao_id = public.get_salao_id());

-- servicos
CREATE POLICY "Tenant select servicos" ON servicos
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert servicos" ON servicos
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update servicos" ON servicos
  FOR UPDATE USING (salao_id = public.get_salao_id());

-- agendamentos
CREATE POLICY "Tenant select agendamentos" ON agendamentos
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert agendamentos" ON agendamentos
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update agendamentos" ON agendamentos
  FOR UPDATE USING (salao_id = public.get_salao_id());

-- pagamentos
CREATE POLICY "Tenant select pagamentos" ON pagamentos
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert pagamentos" ON pagamentos
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

-- transacoes_fiscais
CREATE POLICY "Tenant select transacoes_fiscais" ON transacoes_fiscais
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert transacoes_fiscais" ON transacoes_fiscais
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

-- lembretes_config
CREATE POLICY "Tenant select lembretes_config" ON lembretes_config
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert lembretes_config" ON lembretes_config
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update lembretes_config" ON lembretes_config
  FOR UPDATE USING (salao_id = public.get_salao_id());

-- notificacoes_log
CREATE POLICY "Tenant select notificacoes_log" ON notificacoes_log
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert notificacoes_log" ON notificacoes_log
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update notificacoes_log" ON notificacoes_log
  FOR UPDATE USING (salao_id = public.get_salao_id());

-- 10. Índices multi-tenant
CREATE INDEX IF NOT EXISTS idx_usuarios_salao ON usuarios(salao_id);
CREATE INDEX IF NOT EXISTS idx_saloes_slug ON saloes(slug);
CREATE INDEX IF NOT EXISTS idx_profissionais_salao ON profissionais(salao_id);
CREATE INDEX IF NOT EXISTS idx_clientes_salao ON clientes(salao_id);
CREATE INDEX IF NOT EXISTS idx_servicos_salao ON servicos(salao_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_salao ON agendamentos(salao_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_salao ON pagamentos(salao_id);
