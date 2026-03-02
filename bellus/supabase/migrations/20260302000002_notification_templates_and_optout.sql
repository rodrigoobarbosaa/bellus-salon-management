-- Migration: notification_templates + opt_out_notificacoes
-- EPIC-03 Stories 3.6 + 3.7

-- Notification templates table (custom per salon)
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('confirmacao', 'lembrete_24h', 'lembrete_retorno')),
  idioma VARCHAR(5) NOT NULL CHECK (idioma IN ('pt', 'es', 'en', 'ru')),
  template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_template_salao_tipo_idioma UNIQUE (salao_id, tipo, idioma)
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select notification_templates" ON notification_templates
  FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant insert notification_templates" ON notification_templates
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "Tenant update notification_templates" ON notification_templates
  FOR UPDATE USING (salao_id = public.get_salao_id());
CREATE POLICY "Tenant delete notification_templates" ON notification_templates
  FOR DELETE USING (salao_id = public.get_salao_id());

-- Public read for service_role (used by cron and public booking)
CREATE POLICY "Service role select notification_templates" ON notification_templates
  FOR SELECT USING (true);

-- Opt-out column on clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS opt_out_notificacoes BOOLEAN NOT NULL DEFAULT false;

-- Index
CREATE INDEX idx_notification_templates_salao ON notification_templates(salao_id, tipo);
