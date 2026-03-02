-- Migration: Create bloqueios table
-- Story 2.5 — Bloqueio de Horários e Folgas

CREATE TABLE bloqueios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  data_hora_inicio TIMESTAMPTZ NOT NULL,
  data_hora_fim TIMESTAMPTZ NOT NULL,
  dia_inteiro BOOLEAN NOT NULL DEFAULT false,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_bloqueio_horario CHECK (data_hora_fim > data_hora_inicio)
);

COMMENT ON TABLE bloqueios IS 'Bloqueios de horário e folgas dos profissionais';
COMMENT ON COLUMN bloqueios.dia_inteiro IS 'Se true, bloqueia o dia inteiro';
COMMENT ON COLUMN bloqueios.motivo IS 'Motivo opcional: Almuerzo, Vacaciones, Curso, etc.';

-- RLS
ALTER TABLE bloqueios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant select bloqueios" ON bloqueios
  FOR SELECT USING (salao_id = public.get_salao_id());

CREATE POLICY "Tenant insert bloqueios" ON bloqueios
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

CREATE POLICY "Tenant delete bloqueios" ON bloqueios
  FOR DELETE USING (salao_id = public.get_salao_id());

-- Índices
CREATE INDEX idx_bloqueios_salao ON bloqueios(salao_id);
CREATE INDEX idx_bloqueios_profissional ON bloqueios(profissional_id);
CREATE INDEX idx_bloqueios_periodo ON bloqueios(data_hora_inicio, data_hora_fim);
