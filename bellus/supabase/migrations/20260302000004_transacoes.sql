-- EPIC-05: Tabela de transações (pagamentos)
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE SET NULL,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,

  valor NUMERIC(10,2) NOT NULL,
  tipo_desconto TEXT CHECK (tipo_desconto IN ('percentual', 'fixo')),
  valor_desconto NUMERIC(10,2) DEFAULT 0,
  valor_final NUMERIC(10,2) NOT NULL,

  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('efectivo', 'tarjeta', 'bizum', 'transferencia')),

  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Immutable: no updated_at, transactions are append-only
  CONSTRAINT valor_final_positive CHECK (valor_final >= 0)
);

-- Indexes
CREATE INDEX idx_transacoes_salao ON transacoes(salao_id);
CREATE INDEX idx_transacoes_data ON transacoes(created_at);
CREATE INDEX idx_transacoes_forma ON transacoes(salao_id, forma_pagamento);
CREATE INDEX idx_transacoes_profissional ON transacoes(profissional_id);
CREATE INDEX idx_transacoes_agendamento ON transacoes(agendamento_id);

-- RLS
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transacoes_select" ON transacoes
  FOR SELECT USING (salao_id = public.get_salao_id());

CREATE POLICY "transacoes_insert" ON transacoes
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

-- No UPDATE or DELETE policies — transactions are immutable
