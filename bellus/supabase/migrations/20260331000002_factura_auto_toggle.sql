-- EPIC-09 Story 9.15: Toggle emissão automática de fatura
ALTER TABLE configuracoes_fiscais
  ADD COLUMN IF NOT EXISTS emitir_factura_auto BOOLEAN NOT NULL DEFAULT true;
