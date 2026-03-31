import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { Factura } from "./types";

/**
 * Hash SHA-256 encadeado conforme RD 1007/2023.
 *
 * Input: NIF + numero_factura + fecha (YYYY-MM-DD) + tipo (F1|R1) +
 *        base_imponible + cuota_iva + total + hash_anterior
 *
 * Genesis (primeira fatura): hash_anterior = "0"
 * Resultado: hex string (64 chars)
 */

const HASH_SEPARATOR = "&";
const GENESIS_HASH = "0";

export interface HashInput {
  nif: string;
  numero_factura: string;
  fecha_emision: string; // ISO string ou YYYY-MM-DD
  tipo_factura: "F1" | "R1";
  base_imponible: number;
  cuota_iva: number;
  importe_total: number;
  hash_anterior: string;
}

/**
 * Calcula o hash SHA-256 de uma fatura conforme RD 1007/2023.
 */
export function calculateFacturaHash(input: HashInput): string {
  const fecha = input.fecha_emision.substring(0, 10); // YYYY-MM-DD
  const parts = [
    input.nif,
    input.numero_factura,
    fecha,
    input.tipo_factura,
    input.base_imponible.toFixed(2),
    input.cuota_iva.toFixed(2),
    input.importe_total.toFixed(2),
    input.hash_anterior || GENESIS_HASH,
  ];

  const payload = parts.join(HASH_SEPARATOR);
  return createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * Obtém o hash da última fatura emitida para um salão+série.
 * Retorna "0" (genesis) se não existir nenhuma fatura anterior.
 */
export async function getLastHash(
  salaoId: string,
  serie: string
): Promise<string> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("facturas")
    .select("hash_actual")
    .eq("salao_id", salaoId)
    .eq("serie", serie)
    .order("numero", { ascending: false })
    .limit(1)
    .single();

  if (!data) return GENESIS_HASH;
  return (data as { hash_actual: string | null }).hash_actual || GENESIS_HASH;
}

/**
 * Determina o tipo de fatura: F1 (normal) ou R1 (retificativa/anulação).
 * Retificativas têm total negativo.
 */
export function getTipoFactura(total: number): "F1" | "R1" {
  return total < 0 ? "R1" : "F1";
}

export interface ChainVerificationResult {
  valid: boolean;
  total_checked: number;
  break_point?: {
    numero: number;
    numero_completo: string;
    expected_hash: string;
    actual_hash: string;
  };
}

/**
 * Verifica a integridade de toda a cadeia de faturas de um salão+série.
 * Recalcula hashes sequencialmente e compara com os armazenados.
 */
export async function verifyFacturaChain(
  salaoId: string,
  serie: string,
  nif: string
): Promise<ChainVerificationResult> {
  const supabase = await createClient();

  // Buscar todas as faturas ordenadas por número
  const { data: facturas } = await supabase
    .from("facturas")
    .select("numero, numero_completo, fecha_emision, base_imponible, iva_valor, total, hash_anterior, hash_actual")
    .eq("salao_id", salaoId)
    .eq("serie", serie)
    .order("numero", { ascending: true });

  if (!facturas || (facturas as unknown[]).length === 0) {
    return { valid: true, total_checked: 0 };
  }

  const fList = facturas as Pick<
    Factura,
    "numero" | "numero_completo" | "fecha_emision" | "base_imponible" | "iva_valor" | "total" | "hash_anterior" | "hash_actual"
  >[];

  let previousHash = GENESIS_HASH;

  for (let i = 0; i < fList.length; i++) {
    const f = fList[i];
    const tipoFactura = getTipoFactura(f.total);

    const expectedHash = calculateFacturaHash({
      nif,
      numero_factura: f.numero_completo,
      fecha_emision: f.fecha_emision,
      tipo_factura: tipoFactura,
      base_imponible: f.base_imponible,
      cuota_iva: f.iva_valor,
      importe_total: f.total,
      hash_anterior: previousHash,
    });

    if (expectedHash !== f.hash_actual) {
      return {
        valid: false,
        total_checked: i + 1,
        break_point: {
          numero: f.numero,
          numero_completo: f.numero_completo,
          expected_hash: expectedHash,
          actual_hash: f.hash_actual || "",
        },
      };
    }

    previousHash = expectedHash;
  }

  return { valid: true, total_checked: fList.length };
}
