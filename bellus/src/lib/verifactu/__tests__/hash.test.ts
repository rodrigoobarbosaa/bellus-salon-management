import { calculateFacturaHash, getTipoFactura, type HashInput } from "../hash";

describe("calculateFacturaHash", () => {
  const baseInput: HashInput = {
    nif: "B12345678",
    numero_factura: "B-000001",
    fecha_emision: "2026-03-31T10:00:00.000Z",
    tipo_factura: "F1",
    base_imponible: 100.0,
    cuota_iva: 21.0,
    importe_total: 121.0,
    hash_anterior: "0",
  };

  it("should return a 64-char hex string (SHA-256)", () => {
    const hash = calculateFacturaHash(baseInput);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should be deterministic — same input produces same hash", () => {
    const h1 = calculateFacturaHash(baseInput);
    const h2 = calculateFacturaHash(baseInput);
    expect(h1).toBe(h2);
  });

  it("should change when any input field changes", () => {
    const original = calculateFacturaHash(baseInput);

    const modified = calculateFacturaHash({
      ...baseInput,
      importe_total: 121.01,
    });

    expect(original).not.toBe(modified);
  });

  it("should use only YYYY-MM-DD from fecha_emision", () => {
    const h1 = calculateFacturaHash({
      ...baseInput,
      fecha_emision: "2026-03-31T10:00:00.000Z",
    });
    const h2 = calculateFacturaHash({
      ...baseInput,
      fecha_emision: "2026-03-31T23:59:59.999Z",
    });
    expect(h1).toBe(h2);
  });

  it("should use genesis hash '0' when hash_anterior is empty", () => {
    const h1 = calculateFacturaHash({ ...baseInput, hash_anterior: "" });
    const h2 = calculateFacturaHash({ ...baseInput, hash_anterior: "0" });
    expect(h1).toBe(h2);
  });
});

describe("hash chaining — 3 facturas", () => {
  const nif = "B12345678";

  function makeInput(
    numero: number,
    total: number,
    hashAnterior: string
  ): HashInput {
    return {
      nif,
      numero_factura: `B-${String(numero).padStart(6, "0")}`,
      fecha_emision: "2026-03-31",
      tipo_factura: total < 0 ? "R1" : "F1",
      base_imponible: Math.abs(total) / 1.21,
      cuota_iva: Math.abs(total) - Math.abs(total) / 1.21,
      importe_total: total,
      hash_anterior: hashAnterior,
    };
  }

  it("should produce a valid chain where each hash depends on the previous", () => {
    const input1 = makeInput(1, 121.0, "0");
    const hash1 = calculateFacturaHash(input1);

    const input2 = makeInput(2, 60.5, hash1);
    const hash2 = calculateFacturaHash(input2);

    const input3 = makeInput(3, 242.0, hash2);
    const hash3 = calculateFacturaHash(input3);

    // Each hash should be unique
    expect(new Set([hash1, hash2, hash3]).size).toBe(3);

    // Recalculating should produce the same chain
    expect(calculateFacturaHash(input1)).toBe(hash1);
    expect(calculateFacturaHash(input2)).toBe(hash2);
    expect(calculateFacturaHash(input3)).toBe(hash3);
  });

  it("should detect tampering — modified factura breaks chain", () => {
    const input1 = makeInput(1, 121.0, "0");
    const hash1 = calculateFacturaHash(input1);

    const input2 = makeInput(2, 60.5, hash1);
    const hash2 = calculateFacturaHash(input2);

    // Tamper with factura 2 (change total)
    const tampered2 = makeInput(2, 99.99, hash1);
    const tamperedHash2 = calculateFacturaHash(tampered2);

    expect(tamperedHash2).not.toBe(hash2);

    // Factura 3 built on original hash2 would not match if chain is recalculated
    const input3Original = makeInput(3, 242.0, hash2);
    const input3Tampered = makeInput(3, 242.0, tamperedHash2);

    expect(calculateFacturaHash(input3Original)).not.toBe(
      calculateFacturaHash(input3Tampered)
    );
  });
});

describe("getTipoFactura", () => {
  it("should return F1 for positive totals", () => {
    expect(getTipoFactura(121.0)).toBe("F1");
    expect(getTipoFactura(0.01)).toBe("F1");
    expect(getTipoFactura(0)).toBe("F1");
  });

  it("should return R1 for negative totals (retificativa)", () => {
    expect(getTipoFactura(-121.0)).toBe("R1");
    expect(getTipoFactura(-0.01)).toBe("R1");
  });
});
