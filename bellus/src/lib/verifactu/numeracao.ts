import { createClient } from "@/lib/supabase/server";

/**
 * Obtém o próximo número de fatura de forma atómica (race-condition safe).
 * Chama a função SQL `get_next_factura_numero` que usa advisory lock.
 */
export async function getNextFacturaNumero(
  salaoId: string,
  serie: string = "B"
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_next_factura_numero", {
    p_salao_id: salaoId,
    p_serie: serie,
  });

  if (error) {
    throw new Error(`Erro ao obter número de fatura: ${error.message}`);
  }

  return data as number;
}

/**
 * Obtém a série configurada para o salão, ou 'B' como default.
 */
export async function getSerieFactura(salaoId: string): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configuracoes_fiscais")
    .select("serie_factura")
    .eq("salao_id", salaoId)
    .single();

  if (error || !data) {
    return "B";
  }

  return (data as { serie_factura: string }).serie_factura || "B";
}
