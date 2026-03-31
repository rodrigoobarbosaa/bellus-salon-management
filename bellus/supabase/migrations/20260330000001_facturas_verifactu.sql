-- EPIC-09 Story 9.1: Schema DB — Tabelas de Facturação Verifactu
-- Ley Antifraude (11/2021) + Real Decreto 1007/2023
-- Tabelas append-only para integridade e rastreabilidade

-- ============================================================
-- ENUMs (como CHECK constraints, seguindo padrão existente)
-- ============================================================

-- estado_aeat: estado do envio à Agencia Tributaria
-- tipo_evento_factura: tipos de evento no audit log
-- status_envio_aeat: estado de cada tentativa de envio

-- ============================================================
-- 1. FACTURAS (append-only — sem UPDATE/DELETE)
-- ============================================================
CREATE TABLE IF NOT EXISTS facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  transacao_id UUID REFERENCES transacoes(id) ON DELETE SET NULL,

  -- Numeracao
  serie TEXT NOT NULL DEFAULT 'B',
  numero INTEGER NOT NULL,
  numero_completo TEXT GENERATED ALWAYS AS (serie || '-' || lpad(numero::text, 6, '0')) STORED,

  -- Partes
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  profissional_id UUID REFERENCES profissionais(id) ON DELETE SET NULL,
  agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL,

  -- Datas
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Valores fiscais
  base_imponible NUMERIC(10,2) NOT NULL,
  iva_pct NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  iva_valor NUMERIC(10,2) NOT NULL,
  irpf_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  irpf_valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,

  -- Pagamento
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('efectivo', 'tarjeta', 'bizum', 'transferencia')),

  -- Verifactu: hash encadeado (Story 9.4)
  hash_anterior TEXT,
  hash_actual TEXT,

  -- Verifactu: assinatura digital (Story 9.5)
  firma_digital TEXT,

  -- Verifactu: QR (Story 9.8)
  qr_data TEXT,

  -- Verifactu: estado AEAT (Story 9.11)
  estado_aeat TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_aeat IN ('pendiente', 'enviado', 'aceptado', 'rechazado')),

  -- Verifactu: XML gerado (Story 9.7)
  xml_verifactu TEXT,

  -- Notas
  notas TEXT,

  -- Imutavel: sem updated_at
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT facturas_unique_numero UNIQUE (salao_id, serie, numero),
  CONSTRAINT facturas_total_check CHECK (total >= 0 OR total < 0) -- permite retificativas negativas
);

-- ============================================================
-- 2. FACTURA_LINEAS (linhas de servico da fatura)
-- ============================================================
CREATE TABLE IF NOT EXISTS factura_lineas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  descripcion TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL,
  iva_pct NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  subtotal NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. FACTURA_EVENTOS (audit log — append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS factura_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES facturas(id) ON DELETE SET NULL,
  salao_id UUID NOT NULL REFERENCES saloes(id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('emision', 'anulacion', 'rectificacion', 'envio_aeat', 'error_aeat', 'consulta')),
  detalle JSONB DEFAULT '{}',
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. FACTURA_ENVIOS_AEAT (historico de envios a AEAT)
-- ============================================================
CREATE TABLE IF NOT EXISTS factura_envios_aeat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  xml_enviado TEXT,
  response_code TEXT,
  response_body TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'enviado', 'aceptado', 'rechazado', 'error')),
  enviado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- FACTURAS: append-only (SELECT + INSERT apenas)
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facturas_select" ON facturas
  FOR SELECT USING (salao_id = public.get_salao_id());

CREATE POLICY "facturas_insert" ON facturas
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

-- No UPDATE or DELETE policies — facturas are immutable (Ley Antifraude)

-- FACTURA_LINEAS: acesso via salao da fatura
ALTER TABLE factura_lineas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "factura_lineas_select" ON factura_lineas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM facturas f WHERE f.id = factura_lineas.factura_id AND f.salao_id = public.get_salao_id())
  );

CREATE POLICY "factura_lineas_insert" ON factura_lineas
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM facturas f WHERE f.id = factura_lineas.factura_id AND f.salao_id = public.get_salao_id())
  );

-- FACTURA_EVENTOS: append-only (SELECT + INSERT apenas)
ALTER TABLE factura_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "factura_eventos_select" ON factura_eventos
  FOR SELECT USING (salao_id = public.get_salao_id());

CREATE POLICY "factura_eventos_insert" ON factura_eventos
  FOR INSERT WITH CHECK (salao_id = public.get_salao_id());

-- No UPDATE or DELETE policies — audit log is immutable

-- FACTURA_ENVIOS_AEAT: acesso via salao da fatura
ALTER TABLE factura_envios_aeat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "factura_envios_aeat_select" ON factura_envios_aeat
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM facturas f WHERE f.id = factura_envios_aeat.factura_id AND f.salao_id = public.get_salao_id())
  );

CREATE POLICY "factura_envios_aeat_insert" ON factura_envios_aeat
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM facturas f WHERE f.id = factura_envios_aeat.factura_id AND f.salao_id = public.get_salao_id())
  );

CREATE POLICY "factura_envios_aeat_update" ON factura_envios_aeat
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM facturas f WHERE f.id = factura_envios_aeat.factura_id AND f.salao_id = public.get_salao_id())
  );

-- ============================================================
-- INDEXES
-- ============================================================

-- facturas
CREATE INDEX idx_facturas_salao_serie_numero ON facturas(salao_id, serie, numero);
CREATE INDEX idx_facturas_salao_fecha ON facturas(salao_id, fecha_emision);
CREATE INDEX idx_facturas_salao_estado ON facturas(salao_id, estado_aeat);
CREATE INDEX idx_facturas_transacao ON facturas(transacao_id);

-- factura_lineas
CREATE INDEX idx_factura_lineas_factura ON factura_lineas(factura_id);

-- factura_eventos
CREATE INDEX idx_factura_eventos_factura ON factura_eventos(factura_id);
CREATE INDEX idx_factura_eventos_salao ON factura_eventos(salao_id);
CREATE INDEX idx_factura_eventos_tipo ON factura_eventos(tipo_evento);

-- factura_envios_aeat
CREATE INDEX idx_factura_envios_factura ON factura_envios_aeat(factura_id);
CREATE INDEX idx_factura_envios_status ON factura_envios_aeat(status);
