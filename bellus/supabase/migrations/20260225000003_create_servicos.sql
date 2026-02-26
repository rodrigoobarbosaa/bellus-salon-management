-- Migration: Create servicos + servicos_profissionais tables
-- Story 1.2 - Task 3 (AC: 3, 4)

-- ENUM for service category
CREATE TYPE categoria_servico AS ENUM ('corte', 'coloracao', 'mechas', 'tratamento', 'outro');

-- Serviços table
CREATE TABLE servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  duracao_minutos INT NOT NULL CHECK (duracao_minutos > 0),
  preco_base DECIMAL(10,2) NOT NULL CHECK (preco_base >= 0),
  categoria categoria_servico NOT NULL DEFAULT 'outro',
  intervalo_retorno_dias INT, -- sugestão de retorno após o serviço
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relação N:N entre serviços e profissionais com preço override
CREATE TABLE servicos_profissionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  profissional_id UUID NOT NULL REFERENCES profissionais(id) ON DELETE CASCADE,
  preco_override DECIMAL(10,2) CHECK (preco_override >= 0), -- NULL = usa preco_base
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_servico_profissional UNIQUE (servico_id, profissional_id)
);

COMMENT ON TABLE servicos IS 'Catálogo de serviços oferecidos pelo salão';
COMMENT ON TABLE servicos_profissionais IS 'Relação N:N — quais profissionais realizam quais serviços';
COMMENT ON COLUMN servicos_profissionais.preco_override IS 'Preço específico do profissional — NULL usa preco_base do serviço';
