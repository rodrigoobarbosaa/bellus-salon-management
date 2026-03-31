-- EPIC-09 Story 9.2: Sistema de Numeração Sequencial de Faturas
-- Função atómica race-condition safe com advisory lock

-- ============================================================
-- 1. Campo serie_factura em configuracoes_fiscais
-- ============================================================
ALTER TABLE configuracoes_fiscais
  ADD COLUMN IF NOT EXISTS serie_factura TEXT NOT NULL DEFAULT 'B';

-- ============================================================
-- 2. Função get_next_factura_numero
--    Usa pg_advisory_xact_lock para garantir atomicidade
--    dentro da mesma transação. Dois INSERTs simultâneos
--    nunca recebem o mesmo número.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_next_factura_numero(
  p_salao_id UUID,
  p_serie TEXT DEFAULT 'B'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next INTEGER;
  v_lock_key BIGINT;
BEGIN
  -- Gerar lock key único por (salao_id, serie)
  -- hashtext retorna int4, cast para bigint para advisory lock
  v_lock_key := hashtext(p_salao_id::text || '::' || p_serie);

  -- Advisory lock transacional (libera no COMMIT/ROLLBACK)
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Buscar o maior número existente na série
  SELECT COALESCE(MAX(numero), 0) + 1
    INTO v_next
    FROM facturas
   WHERE salao_id = p_salao_id
     AND serie = p_serie;

  RETURN v_next;
END;
$$;
