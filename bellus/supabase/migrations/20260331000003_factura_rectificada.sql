-- EPIC-09 Story 9.17: Fatura Retificativa — FK para fatura original
ALTER TABLE facturas
  ADD COLUMN IF NOT EXISTS factura_rectificada_id UUID REFERENCES facturas(id);

-- Índice para consulta rápida de retificativas vinculadas
CREATE INDEX IF NOT EXISTS idx_facturas_rectificada_id
  ON facturas(factura_rectificada_id)
  WHERE factura_rectificada_id IS NOT NULL;
