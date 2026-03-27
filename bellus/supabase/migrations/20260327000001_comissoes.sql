-- Add commission fields to profissionais table
ALTER TABLE profissionais
  ADD COLUMN comissao_salao_pct NUMERIC(5,2) NOT NULL DEFAULT 30,
  ADD COLUMN meta_comissao_salao NUMERIC(10,2) NOT NULL DEFAULT 1600;

-- Comment for clarity
COMMENT ON COLUMN profissionais.comissao_salao_pct IS 'Percentage of revenue that goes to the salon (like chair rental)';
COMMENT ON COLUMN profissionais.meta_comissao_salao IS 'Monthly cap: once salon accumulates this amount, professional keeps 100%';
