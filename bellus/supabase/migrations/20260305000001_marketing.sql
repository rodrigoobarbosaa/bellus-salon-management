-- EPIC-08: Marketing IA — tabelas de marketing

-- Enum para plataformas de anuncio
DO $$ BEGIN
  CREATE TYPE plataforma_marketing AS ENUM ('meta', 'google', 'google_business');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum para status de campanha
DO $$ BEGIN
  CREATE TYPE status_campanha AS ENUM ('rascunho', 'ativa', 'pausada', 'concluida', 'cancelada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum para canal de atribuicao
DO $$ BEGIN
  CREATE TYPE canal_atribuicao AS ENUM ('instagram', 'google', 'organico', 'indicacao', 'whatsapp', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum para tom de voz
DO $$ BEGIN
  CREATE TYPE tom_voz AS ENUM ('profissional', 'descontraido', 'luxo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. Conversas de marketing (chat com IA)
CREATE TABLE IF NOT EXISTS marketing_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  titulo TEXT,
  mensagens JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_conversas_salao ON marketing_conversas(salao_id);

ALTER TABLE marketing_conversas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_conversas_select" ON marketing_conversas FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "mkt_conversas_insert" ON marketing_conversas FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "mkt_conversas_update" ON marketing_conversas FOR UPDATE USING (salao_id = public.get_salao_id());
CREATE POLICY "mkt_conversas_delete" ON marketing_conversas FOR DELETE USING (salao_id = public.get_salao_id());

-- 2. Integracoes de marketing (OAuth tokens)
CREATE TABLE IF NOT EXISTS marketing_integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  provider plataforma_marketing NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  account_id TEXT,
  account_name TEXT,
  meta JSONB DEFAULT '{}',
  connected_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (salao_id, provider)
);

ALTER TABLE marketing_integracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_integracoes_select" ON marketing_integracoes FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "mkt_integracoes_insert" ON marketing_integracoes FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "mkt_integracoes_update" ON marketing_integracoes FOR UPDATE USING (salao_id = public.get_salao_id());
CREATE POLICY "mkt_integracoes_delete" ON marketing_integracoes FOR DELETE USING (salao_id = public.get_salao_id());

-- 3. Campanhas de marketing
CREATE TABLE IF NOT EXISTS marketing_campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  plataforma plataforma_marketing NOT NULL,
  external_id TEXT,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'alcance',
  status status_campanha NOT NULL DEFAULT 'rascunho',
  orcamento_diario NUMERIC(10,2),
  orcamento_total NUMERIC(10,2),
  segmentacao JSONB DEFAULT '{}',
  metricas JSONB DEFAULT '{"impressoes": 0, "cliques": 0, "custo": 0, "alcance": 0, "conversoes": 0}',
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_campanhas_salao ON marketing_campanhas(salao_id);
CREATE INDEX idx_mkt_campanhas_status ON marketing_campanhas(salao_id, status);
CREATE INDEX idx_mkt_campanhas_plataforma ON marketing_campanhas(salao_id, plataforma);

ALTER TABLE marketing_campanhas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_campanhas_select" ON marketing_campanhas FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "mkt_campanhas_insert" ON marketing_campanhas FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "mkt_campanhas_update" ON marketing_campanhas FOR UPDATE USING (salao_id = public.get_salao_id());
CREATE POLICY "mkt_campanhas_delete" ON marketing_campanhas FOR DELETE USING (salao_id = public.get_salao_id());

-- 4. Conteudos gerados por IA
CREATE TABLE IF NOT EXISTS marketing_conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  campanha_id UUID REFERENCES marketing_campanhas(id) ON DELETE SET NULL,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL DEFAULT 'copy',
  tom tom_voz NOT NULL DEFAULT 'profissional',
  conteudo JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_conteudos_salao ON marketing_conteudos(salao_id);

ALTER TABLE marketing_conteudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_conteudos_select" ON marketing_conteudos FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "mkt_conteudos_insert" ON marketing_conteudos FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "mkt_conteudos_delete" ON marketing_conteudos FOR DELETE USING (salao_id = public.get_salao_id());

-- 5. Atribuicao de clientes (de onde veio)
CREATE TABLE IF NOT EXISTS marketing_atribuicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  canal canal_atribuicao NOT NULL DEFAULT 'organico',
  campanha_id UUID REFERENCES marketing_campanhas(id) ON DELETE SET NULL,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mkt_atribuicoes_salao ON marketing_atribuicoes(salao_id);
CREATE INDEX idx_mkt_atribuicoes_canal ON marketing_atribuicoes(salao_id, canal);
CREATE INDEX idx_mkt_atribuicoes_cliente ON marketing_atribuicoes(cliente_id);

ALTER TABLE marketing_atribuicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_atribuicoes_select" ON marketing_atribuicoes FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "mkt_atribuicoes_insert" ON marketing_atribuicoes FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

-- 6. Configuracao de marketing do salao
CREATE TABLE IF NOT EXISTS marketing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL UNIQUE REFERENCES saloes(id) ON DELETE CASCADE,
  orcamento_maximo_mensal NUMERIC(10,2) DEFAULT 500,
  dias_inatividade_reativacao INTEGER DEFAULT 90,
  ocupacao_minima_trigger NUMERIC(5,2) DEFAULT 60,
  datas_sazonais JSONB DEFAULT '[]',
  relatorio_semanal_ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE marketing_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_config_select" ON marketing_config FOR SELECT USING (salao_id = public.get_salao_id());
CREATE POLICY "mkt_config_insert" ON marketing_config FOR INSERT WITH CHECK (salao_id = public.get_salao_id());
CREATE POLICY "mkt_config_update" ON marketing_config FOR UPDATE USING (salao_id = public.get_salao_id());
