-- Migration: Create lembretes_config + notificacoes_log tables
-- Story 1.2 - Task 6 (AC: 8, 9)

-- ENUM for notification type
CREATE TYPE tipo_notificacao AS ENUM ('confirmacao', 'lembrete_24h', 'lembrete_retorno');

-- ENUM for notification status
CREATE TYPE status_notificacao AS ENUM ('pendente', 'enviado', 'falhou');

-- Configuração de lembretes automáticos
CREATE TABLE lembretes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE, -- NULL = aplica a todos os clientes do serviço
  intervalo_dias INT NOT NULL CHECK (intervalo_dias > 0),
  template_mensagem TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Log de notificações enviadas
CREATE TABLE notificacoes_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL, -- NULL para lembretes de retorno
  tipo tipo_notificacao NOT NULL,
  mensagem TEXT NOT NULL,
  status status_notificacao NOT NULL DEFAULT 'pendente',
  enviado_em TIMESTAMPTZ, -- NULL até ser enviado
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lembretes_config IS 'Configuração de lembretes automáticos por serviço/cliente';
COMMENT ON COLUMN lembretes_config.cliente_id IS 'NULL = regra global para todos os clientes deste serviço';
COMMENT ON TABLE notificacoes_log IS 'Log de todas as notificações enviadas (WhatsApp, SMS, e-mail)';
