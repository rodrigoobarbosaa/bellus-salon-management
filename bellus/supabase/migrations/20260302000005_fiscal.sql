-- EPIC-06: Módulo Fiscal — despesas e configurações fiscais

-- Tabela de despesas dedutíveis
CREATE TABLE IF NOT EXISTS despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('produtos', 'aluguel', 'formacao', 'suprimentos', 'cuota_autonomos', 'outros')),
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_despesas_salao ON despesas(salao_id);
CREATE INDEX idx_despesas_data ON despesas(data);
CREATE INDEX idx_despesas_categoria ON despesas(salao_id, categoria);

ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "despesas_select" ON despesas
  FOR SELECT USING (salao_id = public.get_salao_id());

CREATE POLICY "despesas_insert" ON despesas
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

CREATE POLICY "despesas_update" ON despesas
  FOR UPDATE USING (salao_id = public.get_salao_id());

CREATE POLICY "despesas_delete" ON despesas
  FOR DELETE USING (salao_id = public.get_salao_id());

-- Tabela de configurações fiscais (uma por salão)
CREATE TABLE IF NOT EXISTS configuracoes_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL UNIQUE REFERENCES saloes(id) ON DELETE CASCADE,
  iva_pct NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  irpf_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  cuota_autonomos_mensual NUMERIC(10,2) NOT NULL DEFAULT 0,
  nif TEXT,
  nombre_fiscal TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE configuracoes_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_fiscal_select" ON configuracoes_fiscais
  FOR SELECT USING (salao_id = public.get_salao_id());

CREATE POLICY "config_fiscal_insert" ON configuracoes_fiscais
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

CREATE POLICY "config_fiscal_update" ON configuracoes_fiscais
  FOR UPDATE USING (salao_id = public.get_salao_id());
