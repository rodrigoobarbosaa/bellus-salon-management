-- Migration: Create pagamentos + transacoes_fiscais tables
-- Story 1.2 - Task 5 (AC: 6, 7)

-- ENUM for payment method
CREATE TYPE forma_pagamento AS ENUM ('efectivo', 'tarjeta', 'bizum', 'transferencia');

-- ENUM for tax type
CREATE TYPE tipo_fiscal AS ENUM ('IVA', 'IRPF');

-- Pagamentos table
CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE RESTRICT,
  valor_bruto DECIMAL(10,2) NOT NULL CHECK (valor_bruto >= 0),
  desconto DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (desconto >= 0),
  valor_liquido DECIMAL(10,2) NOT NULL CHECK (valor_liquido >= 0),
  iva_pct DECIMAL(5,2) NOT NULL DEFAULT 21.0,
  iva_valor DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (iva_valor >= 0),
  forma_pagamento forma_pagamento NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transações fiscais (controle trimestral IVA/IRPF)
CREATE TABLE transacoes_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id UUID NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
  trimestre INT NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
  ano INT NOT NULL CHECK (ano >= 2024),
  tipo tipo_fiscal NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE pagamentos IS 'Registro de pagamentos por atendimento';
COMMENT ON COLUMN pagamentos.iva_pct IS 'Percentual de IVA aplicado (padrão 21% Espanha)';
COMMENT ON TABLE transacoes_fiscais IS 'Controle trimestral de impostos (IVA/IRPF) para declaração fiscal';
