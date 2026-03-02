-- Migration: Add proximo_retorno to clientes for return reminder engine
-- EPIC-04 Story 4.1

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS proximo_retorno DATE;

CREATE INDEX idx_clientes_proximo_retorno ON clientes(proximo_retorno)
  WHERE proximo_retorno IS NOT NULL;
