-- ============================================================================
-- Migration: Fix RLS policies
-- Story: Security hardening
--
-- Problems fixed:
--   1. Migration 007 created single-tenant policies that were NEVER dropped
--      (migration 009 tried to drop them but used wrong names — they coexisted
--       with multi-tenant policies, allowing cross-tenant reads via OR logic)
--   2. Missing DELETE policies on core tables
--   3. profissionais UPDATE restricted to own profile — proprietario couldn't
--      manage other professionals in their salon
--   4. portfolio_fotos/avaliacoes INSERT with CHECK(true) — unauthenticated
--      users could insert records
--   5. favoritos SELECT/INSERT/DELETE fully open — any user could see/modify
--      any client's favorites
-- ============================================================================

-- ============================================================================
-- 1. Drop leftover single-tenant policies from migration 007
--    (migration 009 attempted to drop these but used wrong names)
-- ============================================================================

DROP POLICY IF EXISTS "profissionais_select"         ON profissionais;
DROP POLICY IF EXISTS "profissionais_update_own"     ON profissionais;

DROP POLICY IF EXISTS "clientes_select"              ON clientes;
DROP POLICY IF EXISTS "clientes_insert"              ON clientes;
DROP POLICY IF EXISTS "clientes_update"              ON clientes;

DROP POLICY IF EXISTS "servicos_select"              ON servicos;
DROP POLICY IF EXISTS "servicos_insert"              ON servicos;
DROP POLICY IF EXISTS "servicos_update"              ON servicos;

DROP POLICY IF EXISTS "servicos_profissionais_select" ON servicos_profissionais;
DROP POLICY IF EXISTS "servicos_profissionais_insert" ON servicos_profissionais;
DROP POLICY IF EXISTS "servicos_profissionais_delete" ON servicos_profissionais;

DROP POLICY IF EXISTS "agendamentos_select"          ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert"          ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_update"          ON agendamentos;

DROP POLICY IF EXISTS "pagamentos_select"            ON pagamentos;
DROP POLICY IF EXISTS "pagamentos_insert"            ON pagamentos;
DROP POLICY IF EXISTS "pagamentos_update"            ON pagamentos;

DROP POLICY IF EXISTS "transacoes_fiscais_select"    ON transacoes_fiscais;
DROP POLICY IF EXISTS "transacoes_fiscais_insert"    ON transacoes_fiscais;

DROP POLICY IF EXISTS "lembretes_config_select"      ON lembretes_config;
DROP POLICY IF EXISTS "lembretes_config_insert"      ON lembretes_config;
DROP POLICY IF EXISTS "lembretes_config_update"      ON lembretes_config;
DROP POLICY IF EXISTS "lembretes_config_delete"      ON lembretes_config;

DROP POLICY IF EXISTS "notificacoes_log_select"      ON notificacoes_log;
DROP POLICY IF EXISTS "notificacoes_log_insert"      ON notificacoes_log;
DROP POLICY IF EXISTS "notificacoes_log_update"      ON notificacoes_log;

-- ============================================================================
-- 2. Add missing DELETE policies for core tenant tables
--    (migration 009 only added SELECT/INSERT/UPDATE on most tables)
-- ============================================================================

-- clientes: proprietario pode deletar clientes do seu salão
CREATE POLICY "Tenant delete clientes" ON clientes
  FOR DELETE USING (salao_id = public.get_salao_id());

-- servicos: proprietario pode deletar serviços do seu salão
CREATE POLICY "Tenant delete servicos" ON servicos
  FOR DELETE USING (salao_id = public.get_salao_id());

-- agendamentos: cancelamento = UPDATE status; DELETE para limpeza de dados
CREATE POLICY "Tenant delete agendamentos" ON agendamentos
  FOR DELETE USING (salao_id = public.get_salao_id());

-- pagamentos: proprietario pode deletar pagamentos do seu salão
CREATE POLICY "Tenant delete pagamentos" ON pagamentos
  FOR DELETE USING (salao_id = public.get_salao_id());

-- notificacoes_log: limpeza de logs antigos
CREATE POLICY "Tenant delete notificacoes_log" ON notificacoes_log
  FOR DELETE USING (salao_id = public.get_salao_id());

-- servicos_profissionais: já tinha DELETE na migration 009 (via 007 leftover)
-- Garantir que existe policy correta com escopo tenant
DROP POLICY IF EXISTS "Tenant delete servicos_profissionais" ON servicos_profissionais;
CREATE POLICY "Tenant delete servicos_profissionais" ON servicos_profissionais
  FOR DELETE USING (
    profissional_id IN (
      SELECT id FROM profissionais WHERE salao_id = public.get_salao_id()
    )
  );

-- ============================================================================
-- 3. Fix profissionais UPDATE — proprietario deve poder editar qualquer
--    profissional do seu salão (não só o próprio perfil)
-- ============================================================================

-- Drop a policy restritiva existente (só permitia editar o próprio perfil)
DROP POLICY IF EXISTS "Tenant update own profissional" ON profissionais;

-- Profissional: pode editar apenas o próprio perfil
CREATE POLICY "Profissional update own profile" ON profissionais
  FOR UPDATE USING (
    salao_id = public.get_salao_id()
    AND user_id = auth.uid()
  );

-- Proprietario: pode editar qualquer profissional do seu salão
-- Helper: verifica se o usuário autenticado tem role 'proprietario'
CREATE OR REPLACE FUNCTION public.is_proprietario()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
      AND role = 'proprietario'
      AND salao_id = public.get_salao_id()
  )
$$;

CREATE POLICY "Proprietario update any profissional" ON profissionais
  FOR UPDATE USING (
    salao_id = public.get_salao_id()
    AND public.is_proprietario()
  );

-- Proprietario pode deletar profissional do seu salão
DROP POLICY IF EXISTS "Tenant delete profissionais" ON profissionais;
CREATE POLICY "Tenant delete profissionais" ON profissionais
  FOR DELETE USING (
    salao_id = public.get_salao_id()
    AND public.is_proprietario()
  );

-- ============================================================================
-- 4. Fix portfolio_fotos — INSERT aberto para qualquer um (até anonimo)
-- ============================================================================

DROP POLICY IF EXISTS "portfolio_insert" ON portfolio_fotos;

-- Apenas usuários autenticados do salão podem inserir fotos
CREATE POLICY "Tenant insert portfolio" ON portfolio_fotos
  FOR INSERT WITH CHECK (
    salao_id = public.get_salao_id()
  );

-- Proprietario pode atualizar e deletar fotos do portfolio
CREATE POLICY "Tenant update portfolio" ON portfolio_fotos
  FOR UPDATE USING (salao_id = public.get_salao_id());

CREATE POLICY "Tenant delete portfolio" ON portfolio_fotos
  FOR DELETE USING (salao_id = public.get_salao_id());

-- ============================================================================
-- 5. Fix avaliacoes — INSERT aberto para qualquer um (até anonimo)
-- ============================================================================

DROP POLICY IF EXISTS "avaliacoes_insert" ON avaliacoes;

-- Apenas clientes autenticados podem inserir avaliações
-- Cliente deve pertencer ao mesmo salão
CREATE POLICY "Authenticated insert avaliacoes" ON avaliacoes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND salao_id = public.get_salao_id()
  );

-- DELETE: proprietario pode remover avaliações impróprias
CREATE POLICY "Tenant delete avaliacoes" ON avaliacoes
  FOR DELETE USING (salao_id = public.get_salao_id());

-- ============================================================================
-- 6. Fix favoritos — totalmente aberto (qualquer um via SELECT/INSERT/DELETE)
-- ============================================================================

DROP POLICY IF EXISTS "favoritos_read"   ON favoritos;
DROP POLICY IF EXISTS "favoritos_insert" ON favoritos;
DROP POLICY IF EXISTS "favoritos_delete" ON favoritos;

-- Helper: retorna o cliente_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_cliente_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.clientes
  WHERE email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
  LIMIT 1
$$;

-- Cliente só vê seus próprios favoritos
CREATE POLICY "Cliente select own favoritos" ON favoritos
  FOR SELECT USING (
    cliente_id = public.get_cliente_id()
  );

-- Cliente só cria favoritos para si mesmo
CREATE POLICY "Cliente insert own favoritos" ON favoritos
  FOR INSERT WITH CHECK (
    cliente_id = public.get_cliente_id()
  );

-- Cliente só remove seus próprios favoritos
CREATE POLICY "Cliente delete own favoritos" ON favoritos
  FOR DELETE USING (
    cliente_id = public.get_cliente_id()
  );

-- ============================================================================
-- 7. saloes e usuarios: garantir que não há políticas de INSERT abertas
--    (migration 009 tem INSERT em usuarios com get_salao_id() que pode
--     permitir auto-registro de usuários em salões aleatórios)
-- ============================================================================

-- Apenas proprietario pode adicionar novos membros ao salão
DROP POLICY IF EXISTS "Users can insert into own salon" ON usuarios;

CREATE POLICY "Proprietario insert usuarios" ON usuarios
  FOR INSERT WITH CHECK (
    salao_id = public.get_salao_id()
    AND public.is_proprietario()
  );

-- Adicionar policy de UPDATE para usuarios (faltava)
CREATE POLICY "Users update own profile" ON usuarios
  FOR UPDATE USING (id = auth.uid());

-- ============================================================================
-- 8. Indexes para as novas funções helper (performance)
-- ============================================================================

-- get_cliente_id() faz lookup por email — garantir index
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- is_proprietario() faz lookup por (id, role, salao_id)
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(id, role, salao_id);
