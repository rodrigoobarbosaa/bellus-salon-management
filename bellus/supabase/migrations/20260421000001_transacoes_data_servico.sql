-- Add data_servico column to transacoes
-- This stores the date the service was actually performed (from agendamentos.data_hora_inicio)
-- instead of relying on created_at which is the comanda closure timestamp.

ALTER TABLE transacoes
  ADD COLUMN data_servico DATE;

-- Backfill existing rows: extract the date portion of the linked appointment's start time
UPDATE transacoes t
  SET data_servico = (a.data_hora_inicio AT TIME ZONE 'Europe/Madrid')::date
  FROM agendamentos a
  WHERE t.agendamento_id = a.id
    AND t.data_servico IS NULL;

-- For transactions without an appointment link, fall back to created_at date
UPDATE transacoes
  SET data_servico = (created_at AT TIME ZONE 'Europe/Madrid')::date
  WHERE data_servico IS NULL;

-- Make NOT NULL now that all rows are populated
ALTER TABLE transacoes
  ALTER COLUMN data_servico SET NOT NULL;

-- Default for future inserts (overridden by application code)
ALTER TABLE transacoes
  ALTER COLUMN data_servico SET DEFAULT CURRENT_DATE;

-- Index for date-range queries (replaces idx_transacoes_data on created_at for business queries)
CREATE INDEX idx_transacoes_data_servico ON transacoes(data_servico);
