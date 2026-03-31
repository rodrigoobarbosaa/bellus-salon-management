import { validateVerifactuXml } from "../xml-validator";
import { buildRegistroAlta, buildRegistroAnulacion, buildFacturaXml } from "../xml-builder";
import type { Factura } from "../types";

// --- Test Helpers ---

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
    irpf_pct: 0,
    irpf_valor: 0,
    total: 121.0,
    forma_pagamento: "efectivo",
    hash_anterior: "0",
    hash_actual: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    firma_digital: "FIRMA_BASE64_VALID",
    qr_data: "https://aeat.es/qr?test",
    estado_aeat: "pendiente",
    xml_verifactu: null,
    notas: null,
    factura_rectificada_id: null,
    created_at: "2026-03-31T10:00:00.000Z",
    ...overrides,
  };
}

// --- Testes: XML válido (gerado pelo builder) ---

describe("validateVerifactuXml — XML válido do builder", () => {
  it("should validate RegistroAlta from builder", () => {
    const xml = buildRegistroAlta({
      factura: makeFactura(),
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus Test Salon",
    });

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should validate RegistroAlta with destinatario", () => {
    const xml = buildRegistroAlta({
      factura: makeFactura(),
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
      nif_destinatario: "A98765432",
      nombre_destinatario: "Cliente S.L.",
    });

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should validate RegistroAlta with chained hash (PrimerRegistro=N)", () => {
    const xml = buildRegistroAlta({
      factura: makeFactura({
        hash_anterior: "f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0",
      }),
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should validate RegistroAlta R1 (retificativa)", () => {
    const xml = buildRegistroAlta({
      factura: makeFactura({ total: -121.0, base_imponible: -100, iva_valor: -21 }),
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(true);
  });

  it("should validate RegistroAnulacion from builder", () => {
    const xml = buildRegistroAnulacion({
      factura: makeFactura({ total: -121.0 }),
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus Salon",
    });

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("should validate buildFacturaXml routing (positive = Alta)", () => {
    const xml = buildFacturaXml({
      factura: makeFactura({ total: 100 }),
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(true);
  });

  it("should validate buildFacturaXml routing (negative = Anulacion)", () => {
    const xml = buildFacturaXml({
      factura: makeFactura({ total: -100 }),
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(true);
  });
});

// --- Testes: XML inválido ---

describe("validateVerifactuXml — XML inválido", () => {
  it("should reject empty XML", () => {
    const result = validateVerifactuXml("");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("XML vazio");
  });

  it("should reject XML without declaration", () => {
    const xml = `<sf:SuministroFacturacion xmlns:sf="test">
      <sf:RegistroFacturacion><sf:RegistroAlta></sf:RegistroAlta></sf:RegistroFacturacion>
    </sf:SuministroFacturacion>`;

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Declaração XML"))).toBe(true);
  });

  it("should reject XML without root element", () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?><other>test</other>';
    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("SuministroFacturacion"))).toBe(true);
  });

  it("should reject XML without namespace", () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?><sf:SuministroFacturacion><sf:RegistroFacturacion><sf:RegistroAlta></sf:RegistroAlta></sf:RegistroFacturacion></sf:SuministroFacturacion>';
    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Namespace"))).toBe(true);
  });

  it("should reject XML without any registro type", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sf:SuministroFacturacion xmlns:sf="test">
      <sf:Cabecera></sf:Cabecera>
    </sf:SuministroFacturacion>`;

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Nenhum tipo de registro"))).toBe(true);
  });

  it("should reject RegistroAlta missing Cabecera", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sf:SuministroFacturacion xmlns:sf="test">
      <sf:RegistroFacturacion>
        <sf:RegistroAlta>
          <sf:IDFactura>
            <sf:IDEmisorFactura>B12345678</sf:IDEmisorFactura>
            <sf:NumSerieFactura>B-000001</sf:NumSerieFactura>
            <sf:FechaExpedicionFactura>2026-03-31</sf:FechaExpedicionFactura>
          </sf:IDFactura>
          <sf:TipoFactura>F1</sf:TipoFactura>
          <sf:ClaveRegimenIvaEsp>01</sf:ClaveRegimenIvaEsp>
          <sf:DescripcionOperacion>Test</sf:DescripcionOperacion>
          <sf:ImporteTotal>121.00</sf:ImporteTotal>
          <sf:Desglose><sf:DesgloseTipoOperacion><sf:PrestacionServicios>
            <sf:DetalleIVA>
              <sf:TipoImpositivo>21.00</sf:TipoImpositivo>
              <sf:BaseImponible>100.00</sf:BaseImponible>
              <sf:CuotaRepercutida>21.00</sf:CuotaRepercutida>
            </sf:DetalleIVA>
          </sf:PrestacionServicios></sf:DesgloseTipoOperacion></sf:Desglose>
          <sf:Encadenamiento><sf:PrimerRegistro>S</sf:PrimerRegistro></sf:Encadenamiento>
          <sf:SistemaInformatico>
            <sf:NombreRazon>Synkra</sf:NombreRazon>
            <sf:NIF>B12345678</sf:NIF>
            <sf:NombreSistemaInformatico>Bellus</sf:NombreSistemaInformatico>
            <sf:IdSistemaInformatico>BELLUS-V1</sf:IdSistemaInformatico>
            <sf:Version>1.0.0</sf:Version>
            <sf:NumeroInstalacion>1</sf:NumeroInstalacion>
          </sf:SistemaInformatico>
          <sf:Huella>abc123</sf:Huella>
        </sf:RegistroAlta>
      </sf:RegistroFacturacion>
    </sf:SuministroFacturacion>`;

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Cabecera"))).toBe(true);
  });

  it("should reject RegistroAlta missing IDFactura", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sf:SuministroFacturacion xmlns:sf="test">
      <sf:Cabecera>
        <sf:IDVersion>1.0</sf:IDVersion>
        <sf:ObligadoEmision>
          <sf:NombreRazon>Test</sf:NombreRazon>
          <sf:NIF>B12345678</sf:NIF>
        </sf:ObligadoEmision>
      </sf:Cabecera>
      <sf:RegistroFacturacion>
        <sf:RegistroAlta>
          <sf:TipoFactura>F1</sf:TipoFactura>
          <sf:Huella>abc</sf:Huella>
        </sf:RegistroAlta>
      </sf:RegistroFacturacion>
    </sf:SuministroFacturacion>`;

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("IDFactura"))).toBe(true);
  });

  it("should reject invalid TipoFactura", () => {
    const factura = makeFactura();
    let xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });
    xml = xml.replace("<sf:TipoFactura>F1</sf:TipoFactura>", "<sf:TipoFactura>X9</sf:TipoFactura>");

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("TipoFactura") && e.includes("X9"))).toBe(true);
  });

  it("should reject invalid date format", () => {
    const factura = makeFactura();
    let xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });
    xml = xml.replace(
      "<sf:FechaExpedicionFactura>2026-03-31</sf:FechaExpedicionFactura>",
      "<sf:FechaExpedicionFactura>31/03/2026</sf:FechaExpedicionFactura>"
    );

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("FechaExpedicionFactura") && e.includes("31/03/2026"))).toBe(true);
  });

  it("should reject invalid amount format", () => {
    const factura = makeFactura();
    let xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });
    xml = xml.replace("<sf:ImporteTotal>121.00</sf:ImporteTotal>", "<sf:ImporteTotal>121</sf:ImporteTotal>");

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("ImporteTotal") && e.includes("121"))).toBe(true);
  });

  it("should reject PrimerRegistro=N without RegistroAnterior", () => {
    const factura = makeFactura({ hash_anterior: "abc123" });
    let xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });
    // Remove the RegistroAnterior block
    xml = xml.replace(/<sf:RegistroAnterior>[\s\S]*?<\/sf:RegistroAnterior>/, "");

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("RegistroAnterior") && e.includes("PrimerRegistro=N"))).toBe(true);
  });

  it("should reject missing SistemaInformatico", () => {
    const factura = makeFactura();
    let xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });
    xml = xml.replace(/<sf:SistemaInformatico>[\s\S]*?<\/sf:SistemaInformatico>/, "");

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("SistemaInformatico"))).toBe(true);
  });

  it("should reject missing Encadenamiento", () => {
    const factura = makeFactura();
    let xml = buildRegistroAlta({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });
    xml = xml.replace(/<sf:Encadenamiento>[\s\S]*?<\/sf:Encadenamiento>/, "");

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Encadenamiento"))).toBe(true);
  });

  it("should collect multiple errors", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sf:SuministroFacturacion xmlns:sf="test">
      <sf:RegistroFacturacion>
        <sf:RegistroAlta></sf:RegistroAlta>
      </sf:RegistroFacturacion>
    </sf:SuministroFacturacion>`;

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3);
  });
});

// --- Testes: RegistroAnulacion inválido ---

describe("validateVerifactuXml — RegistroAnulacion inválido", () => {
  it("should reject Anulacion missing IDFactura", () => {
    const factura = makeFactura({ total: -121 });
    let xml = buildRegistroAnulacion({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });
    xml = xml.replace(/<sf:IDFactura>[\s\S]*?<\/sf:IDFactura>/, "");

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("IDFactura"))).toBe(true);
  });

  it("should reject Anulacion missing Encadenamiento", () => {
    const factura = makeFactura({ total: -121 });
    let xml = buildRegistroAnulacion({
      factura,
      nif_emisor: "B12345678",
      nombre_emisor: "Bellus",
    });
    xml = xml.replace(/<sf:Encadenamiento>[\s\S]*?<\/sf:Encadenamiento>/, "");

    const result = validateVerifactuXml(xml);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes("Encadenamiento"))).toBe(true);
  });
});
