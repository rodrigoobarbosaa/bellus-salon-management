import type { Factura } from "./types";

/**
 * Gerador de QR data string conforme especificação Verifactu.
 *
 * URL base AEAT: https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR
 * Params: nif, numserie, fecha, importe, huella
 */

const AEAT_QR_BASE_URL =
  "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR";

export interface QRInput {
  nif: string;
  numero_factura: string;
  fecha_emision: string; // ISO string
  importe_total: number;
  hash_actual: string;
}

/**
 * Gera a URL de verificação AEAT para incluir no QR Code.
 * Formato: URL base + parâmetros encoded.
 */
export function generateVerifactuQRData(input: QRInput): string {
  const fecha = input.fecha_emision.substring(0, 10); // YYYY-MM-DD
  const huella = (input.hash_actual || "").substring(0, 8); // primeiros 8 chars

  const params = new URLSearchParams({
    nif: input.nif,
    numserie: input.numero_factura,
    fecha,
    importe: input.importe_total.toFixed(2),
    huella,
  });

  return `${AEAT_QR_BASE_URL}?${params.toString()}`;
}

/**
 * Gera QR data a partir de uma fatura completa.
 */
export function generateQRFromFactura(
  factura: Factura,
  nif: string
): string {
  return generateVerifactuQRData({
    nif,
    numero_factura: factura.numero_completo,
    fecha_emision: factura.fecha_emision,
    importe_total: factura.total,
    hash_actual: factura.hash_actual || "",
  });
}
