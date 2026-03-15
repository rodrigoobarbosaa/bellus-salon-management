-- Migration: Add multi-step appointment support (coloração + secado)
-- Story 2.7 — Agendamento com Etapas

-- 1. Add pause/post-pause fields to servicos
ALTER TABLE servicos ADD COLUMN tempo_pausa_minutos INT CHECK (tempo_pausa_minutos > 0);
ALTER TABLE servicos ADD COLUMN duracao_pos_pausa_minutos INT CHECK (duracao_pos_pausa_minutos > 0);

COMMENT ON COLUMN servicos.tempo_pausa_minutos IS 'Tempo de processamento/pausa entre etapas (ex: 40 min para cor processar)';
COMMENT ON COLUMN servicos.duracao_pos_pausa_minutos IS 'Duração da etapa final/secado após a pausa';

-- 2. Create enum for appointment step type
CREATE TYPE tipo_etapa_agendamento AS ENUM ('unico', 'aplicacao', 'secado');

-- 3. Add step fields to agendamentos
ALTER TABLE agendamentos ADD COLUMN agendamento_pai_id UUID REFERENCES agendamentos(id) ON DELETE CASCADE;
ALTER TABLE agendamentos ADD COLUMN tipo_etapa tipo_etapa_agendamento NOT NULL DEFAULT 'unico';

COMMENT ON COLUMN agendamentos.agendamento_pai_id IS 'Referência ao agendamento principal (para secado vinculado)';
COMMENT ON COLUMN agendamentos.tipo_etapa IS 'unico=normal, aplicacao=primeira etapa, secado=etapa final pós-pausa';

-- 4. Index for fast lookup of child appointments
CREATE INDEX idx_agendamentos_pai ON agendamentos(agendamento_pai_id) WHERE agendamento_pai_id IS NOT NULL;
