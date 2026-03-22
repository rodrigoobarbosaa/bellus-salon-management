/**
 * Tests for fiscal calculations
 * These mirror the inline calculations in fiscal-view.tsx
 */

// Pure functions extracted from fiscal-view.tsx for testing
function calcIvaRepercutido(ingresos: number, ivaPct: number): number {
  return ingresos * (ivaPct / 100);
}

function calcIvaSoportado(gastos: number, ivaPct: number): number {
  return gastos * (ivaPct / 100);
}

function calcIvaLiquidar(ingresos: number, gastos: number, ivaPct: number): number {
  return calcIvaRepercutido(ingresos, ivaPct) - calcIvaSoportado(gastos, ivaPct);
}

function calcRendimientoNeto(ingresos: number, gastos: number): number {
  return ingresos - gastos;
}

function calcIrpfPagar(ingresos: number, gastos: number, irpfPct: number): number {
  const rendimientoNeto = ingresos - gastos;
  return Math.max(0, rendimientoNeto * (irpfPct / 100));
}

function getCurrentTrimestre(): number {
  const month = new Date().getMonth();
  return Math.floor(month / 3) + 1;
}

function getTrimestreDates(year: number, trimestre: number) {
  const startMonth = (trimestre - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59);
  return { start, end };
}

describe("fiscal calculations", () => {
  describe("IVA calculations", () => {
    it("should calculate IVA collected at 21%", () => {
      const result = calcIvaRepercutido(10000, 21);
      expect(result).toBe(2100);
    });

    it("should calculate IVA deductible at 21%", () => {
      const result = calcIvaSoportado(3000, 21);
      expect(result).toBe(630);
    });

    it("should calculate IVA balance (Modelo 303)", () => {
      // ingresos: 10000, gastos: 3000, IVA 21%
      // IVA repercutido: 2100, IVA soportado: 630, balance: 1470
      const result = calcIvaLiquidar(10000, 3000, 21);
      expect(result).toBe(1470);
    });

    it("should handle zero income", () => {
      const result = calcIvaLiquidar(0, 1000, 21);
      expect(result).toBe(-210);
    });
  });

  describe("IRPF calculations", () => {
    it("should calculate IRPF at 15% on net income", () => {
      // ingresos: 10000, gastos: 3000, net: 7000, IRPF: 1050
      const result = calcIrpfPagar(10000, 3000, 15);
      expect(result).toBe(1050);
    });

    it("should return 0 when net income is negative", () => {
      // ingresos: 1000, gastos: 5000, net: -4000 → IRPF: 0
      const result = calcIrpfPagar(1000, 5000, 15);
      expect(result).toBe(0);
    });
  });

  describe("net income", () => {
    it("should calculate rendimiento neto correctly", () => {
      const result = calcRendimientoNeto(10000, 3000);
      expect(result).toBe(7000);
    });

    it("should handle negative net income", () => {
      const result = calcRendimientoNeto(1000, 5000);
      expect(result).toBe(-4000);
    });
  });

  describe("trimestre utilities", () => {
    it("should return trimestre between 1-4", () => {
      const result = getCurrentTrimestre();
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(4);
    });

    it("should return correct date range for T1", () => {
      const { start, end } = getTrimestreDates(2026, 1);
      expect(start.getMonth()).toBe(0); // January
      expect(end.getMonth()).toBe(2); // March
    });

    it("should return correct date range for T4", () => {
      const { start, end } = getTrimestreDates(2026, 4);
      expect(start.getMonth()).toBe(9); // October
      expect(end.getMonth()).toBe(11); // December
    });
  });
});
