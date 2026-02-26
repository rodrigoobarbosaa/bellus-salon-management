-- Migration: Create agendamentos table
-- Story 1.2 - Task 4 (AC: 5)

-- ENUM for appointment status
CREATE TYPE status_agendamento AS ENUM ('pendente', 'confirmado', 'concluido', 'cancelado');

-- Agendamentos table
CREATE TABLE agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE RESTRICT,
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim TIMESTAMPTZ NOT NULL,
  status status_agendamento NOT NULL DEFAULT 'pendente',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_horario CHECK (data_hora_fim > data_hora_inicio)
);

COMMENT ON TABLE agendamentos IS 'Agenda de atendimentos do salão';
COMMENT ON COLUMN agendamentos.status IS 'pendente → confirmado → concluido | cancelado';
