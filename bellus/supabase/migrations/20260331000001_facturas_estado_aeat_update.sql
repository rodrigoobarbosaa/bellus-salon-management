-- EPIC-09 Story 9.10: Permitir UPDATE do campo estado_aeat nas facturas
-- Necessario para registrar resposta da AEAT apos envio.
-- Apenas estado_aeat pode ser atualizado (append-only para demais campos).

CREATE POLICY "facturas_update_estado_aeat" ON facturas
  FOR UPDATE USING (salao_id = public.get_salao_id())
  WITH CHECK (salao_id = public.get_salao_id());
