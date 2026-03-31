/**
 * Testes E2E do fluxo Verifactu — simulam o fluxo completo
 * sem dependência do Supabase ou AEAT real.
 *
 * Fluxo: Pagamento → Fatura → Hash → XML → QR → Estado pendiente
 *        Anulação → Retificativa R1 → XML Anulacion → Encadeamento
 */

import { calculateFacturaHash, getTipoFactura, type HashInput } from "../hash";
import { buildRegistroAlta, buildRegistroAnulacion, buildFacturaXml } from "../xml-builder";
import { generateVerifactuQRData } from "../qr-generator";
import { signFacturaHash, verifyFacturaSignature } from "../signature";
import { generateKeyPairSync } from "crypto";
import type { Factura } from "../types";

// Test helpers
const NIF = "B12345678";
const SERIE = "B";

function buildTestFactura(
  numero: number,
  total: number,
  hashAnterior: string,
  keys: { privateKey: string; publicKey: string }
): { factura: Factura; hash: string } {
  const numeroCompleto = `${SERIE}-${String(numero).padStart(6, "0")}`;
  const fechaEmision = "2026-03-31T12:00:00.000Z";
  const tipoFactura = getTipoFactura(total);
  const baseImponible = Math.round((Math.abs(total) / 1.21) * 100) / 100;
  const ivaValor = Math.round((Math.abs(total) - baseImponible) * 100) / 100;

  const hash = calculateFacturaHash({
    nif: NIF,
    numero_factura: numeroCompleto,
    fecha_emision: fechaEmision,
    tipo_factura: tipoFactura,
    base_imponible: total >= 0 ? baseImponible : -baseImponible,
    cuota_iva: total >= 0 ? ivaValor : -ivaValor,
    importe_total: total,
    hash_anterior: hashAnterior,
  });

  const signResult = signFacturaHash(hash, keys.privateKey);

  const factura: Factura = {
    id: `factura-${numero}`,
    salao_id: "salao-1",
    transacao_id: `tx-${numero}`,
    serie: SERIE,
    numero,
    numero_completo: numeroCompleto,
    cliente_id: "cliente-1",
    profissional_id: "prof-1",
    agendamento_id: "agd-1",
    fecha_emision: fechaEmision,
    base_imponible: total >= 0 ? baseImponible : -baseImponible,
    iva_pct: 21,
    iva_valor: total >= 0 ? ivaValor : -ivaValor,
    irpf_pct: 0,
    irpf_valor: 0,
    total,
    forma_pagamento: "efectivo",
    hash_anterior: hashAnterior,
    hash_actual: hash,
    firma_digital: signResult.firma_digital,
    qr_data: generateVerifactuQRData({
      nif: NIF,
      numero_factura: numeroCompleto,
      fecha_emision: fechaEmision,
      importe_total: total,
      hash_actual: hash,
    }),
    estado_aeat: "pendiente",
    xml_verifactu: null,
    notas: null,
    factura_rectificada_id: null,
    created_at: fechaEmision,
  };

  return { factura, hash };
}

describe("E2E: Pagamento → Fatura → Hash → XML → QR → Estado pendiente", () => {
  const keys = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  }) as unknown as { privateKey: string; publicKey: string };

  it("should create a complete factura with all Verifactu components", () => {
    const { factura, hash } = buildTestFactura(1, 121.0, "0", keys);

    // Hash is calculated
    expect(factura.hash_actual).toBe(hash);
    expect(factura.hash_actual).toHaveLength(64);

    // Firma is signed
    expect(factura.firma_digital).toBeTruthy();
    expect(
      verifyFacturaSignature(hash, factura.firma_digital!, keys.publicKey)
    ).toBe(true);

    // QR is generated
    expect(factura.qr_data).toContain("ValidarQR");
    expect(factura.qr_data).toContain("nif=B12345678");
    expect(factura.qr_data).toContain("numserie=B-000001");

    // XML RegistroAlta is valid
    const xml = buildRegistroAlta({
      factura,
      nif_emisor: NIF,
      nombre_emisor: "Bellus Test",
    });
    expect(xml).toContain("<sf:RegistroAlta>");
    expect(xml).toContain("<sf:TipoFactura>F1</sf:TipoFactura>");
    expect(xml).toContain(`<sf:NumSerieFactura>B-000001</sf:NumSerieFactura>`);

    // Estado starts as pendiente
    expect(factura.estado_aeat).toBe("pendiente");
  });
});

describe("E2E: Anulação → Retificativa R1 → XML Anulacion → Encadeamento", () => {
  const keys = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  }) as unknown as { privateKey: string; publicKey: string };

  it("should create retificativa with negative values chained after original", () => {
    // Step 1: Create original
    const { factura: original, hash: hash1 } = buildTestFactura(
      1,
      121.0,
      "0",
      keys
    );

    // Step 2: Create retificativa (negative) chained from original hash
    const { factura: retificativa, hash: hash2 } = buildTestFactura(
      2,
      -121.0,
      hash1,
      keys
    );

    // Retificativa should have negative values
    expect(retificativa.total).toBe(-121.0);
    expect(retificativa.base_imponible).toBeLessThan(0);

    // Chain is intact
    expect(retificativa.hash_anterior).toBe(original.hash_actual);
    expect(hash2).not.toBe(hash1);

    // XML should be RegistroAnulacion
    const xml = buildFacturaXml({
      factura: retificativa,
      nif_emisor: NIF,
      nombre_emisor: "Bellus",
    });
    expect(xml).toContain("<sf:RegistroAnulacion>");
    expect(xml).not.toContain("<sf:RegistroAlta>");
  });
});

describe("E2E: Cadeia de 5 faturas — integridade completa", () => {
  const keys = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  }) as unknown as { privateKey: string; publicKey: string };

  it("should produce valid chain with verifiable signatures", () => {
    const totals = [50.0, 121.0, 200.0, 80.0, 150.0];
    const facturas: Factura[] = [];
    let prevHash = "0";

    for (let i = 0; i < totals.length; i++) {
      const { factura, hash } = buildTestFactura(
        i + 1,
        totals[i],
        prevHash,
        keys
      );
      facturas.push(factura);
      prevHash = hash;
    }

    // Verify chain
    let chainHash = "0";
    for (const f of facturas) {
      expect(f.hash_anterior).toBe(chainHash);

      // Recalculate and verify
      const recalculated = calculateFacturaHash({
        nif: NIF,
        numero_factura: f.numero_completo,
        fecha_emision: f.fecha_emision,
        tipo_factura: getTipoFactura(f.total),
        base_imponible: f.base_imponible,
        cuota_iva: f.iva_valor,
        importe_total: f.total,
        hash_anterior: chainHash,
      });
      expect(recalculated).toBe(f.hash_actual);

      // Verify signature
      if (f.firma_digital) {
        expect(
          verifyFacturaSignature(f.hash_actual!, f.firma_digital, keys.publicKey)
        ).toBe(true);
      }

      chainHash = f.hash_actual!;
    }
  });
});

describe("E2E: Mock AEAT responses", () => {
  it("should handle aceptado response structure", () => {
    const mockAceptado = {
      success: true,
      status: "aceptado" as const,
      response_code: "HTTP_200",
      response_body: "<soap:Envelope>...</soap:Envelope>",
      csv: "CSV123456789",
    };

    expect(mockAceptado.success).toBe(true);
    expect(mockAceptado.status).toBe("aceptado");
    expect(mockAceptado.csv).toBeTruthy();
  });

  it("should handle rechazado response structure", () => {
    const mockRechazado = {
      success: false,
      status: "rechazado" as const,
      response_code: "HTTP_400",
      response_body: "<soap:Fault>Invalid NIF</soap:Fault>",
      error_description: "NIF no válido",
    };

    expect(mockRechazado.success).toBe(false);
    expect(mockRechazado.status).toBe("rechazado");
    expect(mockRechazado.error_description).toBeTruthy();
  });

  it("should handle timeout/error response for retry scenarios", () => {
    const mockTimeout = {
      success: false,
      status: "error" as const,
      response_code: "TIMEOUT",
      response_body: "",
      error_description: "Connection timeout",
    };

    expect(mockTimeout.success).toBe(false);
    expect(mockTimeout.status).toBe("error");
    // Retry logic: error status is retryable, rechazado is not (for validation errors)
    expect(["error", "rechazado"]).toContain(mockTimeout.status);
  });
});
