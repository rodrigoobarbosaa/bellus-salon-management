import { buildRegistroAlta, buildRegistroAnulacion, buildFacturaXml } from "../xml-builder";
import type { Factura } from "../types";

function makeFactura(overrides: Partial<Factura> = {}): Factura {
  return {
    id: "test-id",
    salao_id: "salao-1",
    transacao_id: null,
    serie: "B",
    numero: 1,
    numero_completo: "B-000001",
    cliente_id: null,
    profissional_id: null,
    agendamento_id: null,
    fecha_emision: "2026-03-31T10:00:00.000Z",
    base_imponible: 100.0,
    iva_pct: 21,
    iva_valor: 21.0,
    irpf_pct: 15,
    irpf_valor: 15.0,
    total: 106.0,
    forma_pagamento: "efectivo",
    hash_anterior: "0",
    hash_actual: "abc123def456",
    firma_digital: "FIRMA_BASE64",
    qr_data: "https://aeat.es/qr?test",
    estado_aeat: "pendiente",
    xml_verifactu: null,
    notas: null,
    factura_rectificada_id: null,
    created_at: "2026-03-31T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildRegistroAlta", () => {
  it("should generate valid XML with required elements", () => {
    const factura = makeFactura();
    const xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus Test",
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<sf:SuministroFacturacion");
    expect(xml).toContain("<sf:RegistroAlta>");
    expect(xml).toContain("<sf:IDEmisorFactura>B12345678</sf:IDEmisorFactura>");
    expect(xml).toContain("<sf:NumSerieFactura>B-000001</sf:NumSerieFactura>");
    expect(xml).toContain("<sf:FechaExpedicionFactura>2026-03-31</sf:FechaExpedicionFactura>");
    expect(xml).toContain("<sf:TipoFactura>F1</sf:TipoFactura>");
    expect(xml).toContain("<sf:ImporteTotal>106.00</sf:ImporteTotal>");
    expect(xml).toContain("<sf:BaseImponible>100.00</sf:BaseImponible>");
    expect(xml).toContain("<sf:CuotaRepercutida>21.00</sf:CuotaRepercutida>");
    expect(xml).toContain("<sf:Huella>abc123def456</sf:Huella>");
    expect(xml).toContain("<sf:Firma>FIRMA_BASE64</sf:Firma>");
  });

  it("should set PrimerRegistro=S when hash_anterior is 0", () => {
    const factura = makeFactura({ hash_anterior: "0" });
    const xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });

    expect(xml).toContain("<sf:PrimerRegistro>S</sf:PrimerRegistro>");
    expect(xml).not.toContain("<sf:RegistroAnterior>");
  });

  it("should include RegistroAnterior when hash_anterior is not 0", () => {
    const factura = makeFactura({ hash_anterior: "prev_hash_abc" });
    const xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });

    expect(xml).toContain("<sf:PrimerRegistro>N</sf:PrimerRegistro>");
    expect(xml).toContain("<sf:Huella>prev_hash_abc</sf:Huella>");
  });

  it("should include Destinatario when nif_destinatario is provided", () => {
    const factura = makeFactura();
    const xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
      nif_destinatario: "A98765432",
      nombre_destinatario: "Cliente S.L.",
    });

    expect(xml).toContain("<sf:Destinatario>");
    expect(xml).toContain("<sf:NIF>A98765432</sf:NIF>");
  });

  it("should use R1 tipo when total is negative", () => {
    const factura = makeFactura({ total: -106.0 });
    const xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });

    expect(xml).toContain("<sf:TipoFactura>R1</sf:TipoFactura>");
  });

  it("should escape XML special characters", () => {
    const factura = makeFactura();
    const xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: 'Peluquería "O\'Hair" & Co',
    });

    expect(xml).toContain("Peluquería &quot;O&apos;Hair&quot; &amp; Co");
    expect(xml).not.toContain('"O\'Hair"');
  });
});

describe("buildRegistroAnulacion", () => {
  it("should generate RegistroAnulacion XML", () => {
    const factura = makeFactura({ total: -106.0 });
    const xml = buildRegistroAnulacion({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });

    expect(xml).toContain("<sf:RegistroAnulacion>");
    expect(xml).not.toContain("<sf:RegistroAlta>");
    expect(xml).toContain("<sf:NumSerieFactura>B-000001</sf:NumSerieFactura>");
    expect(xml).toContain("<sf:Huella>abc123def456</sf:Huella>");
  });
});

describe("buildFacturaXml", () => {
  it("should route to RegistroAlta for positive totals", () => {
    const factura = makeFactura({ total: 100 });
    const xml = buildFacturaXml({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });
    expect(xml).toContain("<sf:RegistroAlta>");
  });

  it("should route to RegistroAnulacion for negative totals", () => {
    const factura = makeFactura({ total: -100 });
    const xml = buildFacturaXml({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });
    expect(xml).toContain("<sf:RegistroAnulacion>");
  });
});
