-- Reviews & Portfolio tables for mobile app (Booksy-style)

-- Portfolio: fotos dos trabalhos
CREATE TABLE IF NOT EXISTS portfolio_fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE SET NULL,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Avaliações dos clientes
CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE SET NULL,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
  nota SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agendamento_id)
);

-- Favoritos dos clientes
CREATE TABLE IF NOT EXISTS favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, profissional_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_salao ON portfolio_fotos(salao_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_profissional ON portfolio_fotos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_salao ON avaliacoes(salao_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_profissional ON avaliacoes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_cliente ON avaliacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_cliente ON favoritos(cliente_id);

-- RLS
ALTER TABLE portfolio_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;

-- Portfolio: anyone can read, salon owners can insert/update/delete
CREATE POLICY "portfolio_read" ON portfolio_fotos FOR SELECT USING (true);
CREATE POLICY "portfolio_insert" ON portfolio_fotos FOR INSERT WITH CHECK (true);

-- Avaliacoes: anyone can read, clients can insert their own
CREATE POLICY "avaliacoes_read" ON avaliacoes FOR SELECT USING (true);
CREATE POLICY "avaliacoes_insert" ON avaliacoes FOR INSERT WITH CHECK (true);

-- Favoritos: clients manage their own
CREATE POLICY "favoritos_read" ON favoritos FOR SELECT USING (true);
CREATE POLICY "favoritos_insert" ON favoritos FOR INSERT WITH CHECK (true);
CREATE POLICY "favoritos_delete" ON favoritos FOR DELETE USING (true);
