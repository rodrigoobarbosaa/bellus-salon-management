/**
 * Tests for equipe.ts server actions
 */

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

// Mock crypto.randomUUID
const mockUUID = "test-uuid-1234";
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: () => mockUUID },
});

// Supabase mock helpers
const mockInsert = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockReturnThis();
const mockDelete = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockSingle = jest.fn();

const mockFrom = jest.fn().mockReturnValue({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
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

// Mock createClient
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn().mockResolvedValue(mockSupabase),
}));

// Chain fix: make eq return the mock object with the right methods
mockEq.mockImplementation(() => ({
  eq: mockEq,
  single: mockSingle,
  update: mockUpdate,
  delete: mockDelete,
}));

mockUpdate.mockImplementation(() => ({
  eq: mockEq,
}));

mockDelete.mockImplementation(() => ({
  eq: mockEq,
}));

import {
  createProfissional,
  updateProfissional,
  toggleProfissionalAtivo,
} from "../equipe";

function makeFormData(data: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    fd.set(k, v);
  }
  return fd;
}

describe("equipe server actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset getSalaoId chain
    mockSingle.mockResolvedValue({ data: { salao_id: "test-salao" } });
    mockInsert.mockResolvedValue({ error: null });
    mockEq.mockImplementation(() => ({
      eq: mockEq,
      single: mockSingle,
      update: mockUpdate,
      delete: mockDelete,
    }));
    mockUpdate.mockImplementation(() => ({
      eq: mockEq,
    }));
  });

  describe("createProfissional", () => {
    it("should create professional with valid data", async () => {
      const fd = makeFormData({
        nome: "Ana Silva",
        email: "ana@test.com",
        telefone: "+34600000000",
        role: "profissional",
        cor_agenda: "#ff0000",
      });

      const result = await createProfissional(fd);
      expect(result).toEqual({ success: true });
    });

    it("should return error when nome is missing", async () => {
      const fd = makeFormData({ nome: "", email: "ana@test.com" });

      const result = await createProfissional(fd);
      expect(result).toEqual({ error: "Nome e email são obrigatórios." });
    });

    it("should return error when email is missing", async () => {
      const fd = makeFormData({ nome: "Ana", email: "" });

      const result = await createProfissional(fd);
      expect(result).toEqual({ error: "Nome e email são obrigatórios." });
    });

    it("should reject invalid email format", async () => {
      const fd = makeFormData({
        nome: "Ana",
        email: "not-an-email",
        role: "profissional",
      });

      const result = await createProfissional(fd);
      expect(result).toEqual({ error: "Email inválido." });
    });

    it("should reject invalid role", async () => {
      const fd = makeFormData({
        nome: "Ana",
        email: "ana@test.com",
        role: "admin",
      });

      const result = await createProfissional(fd);
      expect(result).toEqual({ error: "Cargo inválido." });
    });

    it("should reject nome over 100 chars", async () => {
      const fd = makeFormData({
        nome: "A".repeat(101),
        email: "ana@test.com",
        role: "profissional",
      });

      const result = await createProfissional(fd);
      expect(result).toEqual({ error: "Nome muito longo (máximo 100 caracteres)." });
    });
  });

  describe("updateProfissional", () => {
    it("should update professional with valid data", async () => {
      const fd = makeFormData({
        id: "prof-1",
        nome: "Ana Updated",
        email: "ana@updated.com",
        role: "profissional",
        cor_agenda: "#00ff00",
      });

      const result = await updateProfissional(fd);
      expect(result).toEqual({ success: true });
    });

    it("should return error when id is missing", async () => {
      const fd = makeFormData({
        id: "",
        nome: "Ana",
        email: "ana@test.com",
      });

      const result = await updateProfissional(fd);
      expect(result).toEqual({ error: "Dados incompletos." });
    });
  });

  describe("toggleProfissionalAtivo", () => {
    it("should toggle ativo to false", async () => {
      const result = await toggleProfissionalAtivo("prof-1", false);
      expect(result).toEqual({ success: true });
    });

    it("should toggle ativo to true", async () => {
      const result = await toggleProfissionalAtivo("prof-1", true);
      expect(result).toEqual({ success: true });
    });
  });
});
