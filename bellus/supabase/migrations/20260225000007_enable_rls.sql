-- Migration: Enable RLS + create policies for all tables
-- Story 1.2 - Task 7 (AC: 10, 11)

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos_profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembretes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policies: authenticated users (profissionais do salão)
-- Por ora, modelo single-tenant: todos profissionais autenticados
-- compartilham acesso aos dados do salão.
-- Multi-tenant (salao_id) será implementado se necessário.
-- ============================================================

-- profissionais: autenticado pode ver todos, editar apenas o próprio
CREATE POLICY "profissionais_select" ON profissionais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profissionais_update_own" ON profissionais
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- clientes: autenticado pode CRUD
CREATE POLICY "clientes_select" ON clientes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "clientes_insert" ON clientes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "clientes_update" ON clientes
  FOR UPDATE TO authenticated USING (true);

-- servicos: autenticado pode ver; insert/update para todos (gerência)
CREATE POLICY "servicos_select" ON servicos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "servicos_insert" ON servicos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "servicos_update" ON servicos
  FOR UPDATE TO authenticated USING (true);

-- servicos_profissionais: autenticado pode CRUD
CREATE POLICY "servicos_profissionais_select" ON servicos_profissionais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "servicos_profissionais_insert" ON servicos_profissionais
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "servicos_profissionais_delete" ON servicos_profissionais
  FOR DELETE TO authenticated USING (true);

-- agendamentos: autenticado pode CRUD
CREATE POLICY "agendamentos_select" ON agendamentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "agendamentos_insert" ON agendamentos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "agendamentos_update" ON agendamentos
  FOR UPDATE TO authenticated USING (true);

-- pagamentos: autenticado pode ver, criar e atualizar
CREATE POLICY "pagamentos_select" ON pagamentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pagamentos_insert" ON pagamentos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "pagamentos_update" ON pagamentos
  FOR UPDATE TO authenticated USING (true);

-- transacoes_fiscais: autenticado pode ver e criar
CREATE POLICY "transacoes_fiscais_select" ON transacoes_fiscais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "transacoes_fiscais_insert" ON transacoes_fiscais
  FOR INSERT TO authenticated WITH CHECK (true);

-- lembretes_config: autenticado pode CRUD
CREATE POLICY "lembretes_config_select" ON lembretes_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "lembretes_config_insert" ON lembretes_config
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "lembretes_config_update" ON lembretes_config
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "lembretes_config_delete" ON lembretes_config
  FOR DELETE TO authenticated USING (true);

-- notificacoes_log: autenticado pode ver, criar e atualizar status
CREATE POLICY "notificacoes_log_select" ON notificacoes_log
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "notificacoes_log_insert" ON notificacoes_log
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notificacoes_log_update" ON notificacoes_log
  FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- Policies: service_role (server-side, bypasses RLS by default)
-- Supabase service_role já bypassa RLS automaticamente.
-- Não é necessário criar policies explícitas para service_role.
-- ============================================================
