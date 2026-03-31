import { generateVerifactuQRData, generateQRFromFactura } from "../qr-generator";
import type { Factura } from "../types";

describe("generateVerifactuQRData", () => {
  const input = {
    nif: "B12345678",
    numero_factura: "B-000042",
    fecha_emision: "2026-03-31T10:30:00.000Z",
    importe_total: 121.0,
    hash_actual: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
  };

  it("should return a URL with AEAT base", () => {
    const qr = generateVerifactuQRData(input);
    expect(qr).toContain(
      "https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR"
    );
  });

  it("should include nif parameter", () => {
    const qr = generateVerifactuQRData(input);
    expect(qr).toContain("nif=B12345678");
  });

  it("should include numserie parameter", () => {
    const qr = generateVerifactuQRData(input);
    expect(qr).toContain("numserie=B-000042");
  });

  it("should format fecha as YYYY-MM-DD only", () => {
    const qr = generateVerifactuQRData(input);
    expect(qr).toContain("fecha=2026-03-31");
    expect(qr).not.toContain("T10:30");
  });

  it("should format importe with 2 decimals", () => {
    const qr = generateVerifactuQRData(input);
    expect(qr).toContain("importe=121.00");
  });

  it("should use first 8 chars of hash as huella", () => {
    const qr = generateVerifactuQRData(input);
    expect(qr).toContain("huella=abcdef01");
  });

  it("should handle empty hash gracefully", () => {
    const qr = generateVerifactuQRData({ ...input, hash_actual: "" });
    expect(qr).toContain("huella=");
  });
});

describe("generateQRFromFactura", () => {
  it("should extract correct fields from Factura object", () => {
    const factura = {
      numero_completo: "B-000099",
      fecha_emision: "2026-01-15T08:00:00.000Z",
      total: 242.0,
      hash_actual: "deadbeef12345678",
    } as Factura;

    const qr = generateQRFromFactura(factura, "X99999999");

    expect(qr).toContain("nif=X99999999");
    expect(qr).toContain("numserie=B-000099");
    expect(qr).toContain("fecha=2026-01-15");
    expect(qr).toContain("importe=242.00");
    expect(qr).toContain("huella=deadbeef");
  });
});
