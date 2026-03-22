/**
 * Tests for servicos.ts server actions
 */

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Supabase mock helpers
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn();

const mockFrom = jest.fn().mockReturnValue({
  insert: mockInsert,
  update: mockUpdate,
  select: mockSelect,
  eq: mockEq,
  single: mockSingle,
});

const mockSupabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: "test-user-id" } },
    }),
  },
  from: mockFrom,
};

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue(mockSupabase),
}));

mockEq.mockImplementation(() => ({
  eq: mockEq,
  single: mockSingle,
  update: mockUpdate,
}));

mockUpdate.mockImplementation(() => ({
  eq: mockEq,
}));

import {
  createServico,
  updateServico,
  toggleServicoAtivo,
} from "../servicos";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    fd.set(k, v);
  }
  return fd;
}

describe("servicos server actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { salao_id: "test-salao" } });
    mockInsert.mockResolvedValue({ error: null });
    mockEq.mockImplementation(() => ({
      eq: mockEq,
      single: mockSingle,
      update: mockUpdate,
    }));
    mockUpdate.mockImplementation(() => ({
      eq: mockEq,
    }));
  });

  describe("createServico", () => {
    it("should create service with valid data", async () => {
      const fd = makeFormData({
        nome: "Corte masculino",
        duracao_minutos: "30",
        preco_base: "25.00",
        categoria: "corte",
      });

      const result = await createServico(fd);
      expect(result).toEqual({ success: true });
    });

    it("should return error when nome is missing", async () => {
      const fd = makeFormData({
        nome: "",
        duracao_minutos: "30",
        preco_base: "25.00",
        categoria: "corte",
      });

      const result = await createServico(fd);
      expect(result.error).toBeDefined();
    });

    it("should reject negative price", async () => {
      const fd = makeFormData({
        nome: "Corte",
        duracao_minutos: "30",
        preco_base: "-5",
        categoria: "corte",
      });

      const result = await createServico(fd);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateServico", () => {
    it("should update service with valid data", async () => {
      const fd = makeFormData({
        id: "svc-1",
        nome: "Corte Updated",
        duracao_minutos: "45",
        preco_base: "30.00",
        categoria: "corte",
      });

      const result = await updateServico(fd);
      expect(result).toEqual({ success: true });
    });

    it("should return error when id is missing", async () => {
      const fd = makeFormData({
        id: "",
        nome: "Corte",
        duracao_minutos: "30",
        preco_base: "25",
        categoria: "corte",
      });

      const result = await updateServico(fd);
      expect(result.error).toBeDefined();
    });
  });

  describe("toggleServicoAtivo", () => {
    it("should toggle service to inactive", async () => {
      const result = await toggleServicoAtivo("svc-1", false);
      expect(result).toEqual({ success: true });
    });
  });
});
