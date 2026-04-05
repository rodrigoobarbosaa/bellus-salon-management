-- Allow updating forma_pagamento and notas on transactions
-- This is a classification correction, not a financial alteration
-- The factura (legally immutable) remains unchanged

CREATE POLICY "transacoes_update_forma" ON transacoes
  FOR UPDATE USING (salao_id = public.get_salao_id())
  WITH CHECK (salao_id = public.get_salao_id());
