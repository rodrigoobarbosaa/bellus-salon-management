-- ============================================================================
-- Migration 010: Campos de configuração do salão (FR-00)
-- Story 1.4 — Configuração do Salão
-- ============================================================================

-- Campos que já existem em saloes (migration 009): nome, slug, whatsapp, timezone, moeda
-- Adicionando campos de configuração visual e contato

ALTER TABLE saloes ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS cor_primaria text NOT NULL DEFAULT '#c9a96e';
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS telefone text;
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS horario_funcionamento jsonb DEFAULT '{"seg":{"abre":"09:00","fecha":"19:00"},"ter":{"abre":"09:00","fecha":"19:00"},"qua":{"abre":"09:00","fecha":"19:00"},"qui":{"abre":"09:00","fecha":"19:00"},"sex":{"abre":"09:00","fecha":"19:00"},"sab":{"abre":"09:00","fecha":"14:00"},"dom":null}'::jsonb;
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS google_maps_url text;

-- Política para proprietário atualizar configurações do salão
CREATE POLICY "Owner can update own salon" ON saloes
  FOR UPDATE USING (id = public.get_salao_id());
