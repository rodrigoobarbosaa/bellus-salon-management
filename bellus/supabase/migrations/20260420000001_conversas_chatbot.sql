-- EPIC-11 Story 11.1: Schema de conversas para automação WhatsApp + Instagram
-- Suporta sessões de conversa por cliente+canal e histórico de mensagens

-- Sessão de conversa (uma por cliente por canal por salão)
CREATE TABLE conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'instagram')),
  external_id TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'ativo' CHECK (estado IN ('ativo', 'aguardando_humano', 'encerrado')),
  contexto JSONB DEFAULT '{}',
  ultima_mensagem_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salao_id, canal, external_id)
);

-- Mensagens individuais (recebidas e enviadas)
CREATE TABLE conversas_mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES conversas(id) ON DELETE CASCADE,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  direcao TEXT NOT NULL CHECK (direcao IN ('recebida', 'enviada')),
  tipo TEXT NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagem', 'audio', 'template', 'interativo')),
  conteudo TEXT,
  meta_message_id TEXT,
  status TEXT DEFAULT 'recebida' CHECK (status IN ('recebida', 'enviada', 'entregue', 'lida', 'falhou')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_conversas_salao ON conversas(salao_id);
CREATE INDEX idx_conversas_cliente ON conversas(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX idx_conversas_external ON conversas(canal, external_id);
CREATE INDEX idx_conversas_estado ON conversas(salao_id, estado) WHERE estado = 'ativo';
CREATE INDEX idx_mensagens_conversa ON conversas_mensagens(conversa_id, created_at);
CREATE INDEX idx_mensagens_meta_id ON conversas_mensagens(meta_message_id) WHERE meta_message_id IS NOT NULL;

-- RLS
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversas_salao_policy" ON conversas
  FOR ALL USING (salao_id = public.get_salao_id());

CREATE POLICY "conversas_mensagens_salao_policy" ON conversas_mensagens
  FOR ALL USING (salao_id = public.get_salao_id());

-- Updated_at trigger (reuse existing function)
CREATE TRIGGER conversas_updated_at
  BEFORE UPDATE ON conversas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
