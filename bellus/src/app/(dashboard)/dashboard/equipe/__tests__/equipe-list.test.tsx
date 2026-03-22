/**
 * Tests for EquipeList component
 */
import { render, screen, fireEvent } from "@testing-library/react";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: (ns: string) => {
    const keys: Record<string, Record<string, string>> = {
      team: {
        title: "Equipe",
        count: "{count} profissional(is)",
        searchPlaceholder: "Buscar por nome, email ou telefone...",
        filterAll: "Todos",
        filterActive: "Ativos",
        filterInactive: "Inativos",
        noProfessionals: "Nenhum profissional registrado.",
        inactive: "INATIVO",
        manageServices: "Gerenciar serviços",
        newProfessional: "Novo profissional",
        noServices: "Sem serviços",
        services: "serviço(s)",
        activate: "Ativar",
        deactivate: "Desativar",
      },
      common: {
        edit: "Editar",
        search: "Buscar",
      },
    };
    return (key: string) => keys[ns]?.[key] ?? key;
  },
}));

// Mock server actions
jest.mock("@/app/actions/equipe", () => ({
  toggleProfissionalAtivo: jest.fn().mockResolvedValue({ success: true }),
}));

import { EquipeList } from "../equipe-list";

const mockProfissionais = [
  {
    id: "p1",
    nome: "Ana Silva",
    email: "ana@test.com",
    telefone: "+34600000001",
    role: "profissional" as const,
    cor_agenda: "#6366f1",
    ativo: true,
  },
  {
    id: "p2",
    nome: "Maria Santos",
    email: "maria@test.com",
    telefone: "+34600000002",
    role: "proprietario" as const,
    cor_agenda: "#f43f5e",
    ativo: true,
  },
  {
    id: "p3",
    nome: "Carlos Inativo",
    email: "carlos@test.com",
    telefone: null,
    role: "profissional" as const,
    cor_agenda: "#22c55e",
    ativo: false,
  },
];

const mockServicos: never[] = [];
const mockAssociacoes: never[] = [];

describe("EquipeList", () => {
  it("should render professional cards", () => {
    render(
      <EquipeList
        profissionais={mockProfissionais}
        servicos={mockServicos}
        servicosProfissionais={mockAssociacoes}
        isProprietario={true}
      />,
    );

    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("Maria Santos")).toBeInTheDocument();
    expect(screen.getByText("Carlos Inativo")).toBeInTheDocument();
  });

  it("should filter by search text", () => {
    render(
      <EquipeList
        profissionais={mockProfissionais}
        servicos={mockServicos}
        servicosProfissionais={mockAssociacoes}
        isProprietario={true}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      "Buscar por nome, email ou telefone...",
    );
    fireEvent.change(searchInput, { target: { value: "Ana" } });

    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.queryByText("Maria Santos")).not.toBeInTheDocument();
    expect(screen.queryByText("Carlos Inativo")).not.toBeInTheDocument();
  });

  it("should show INATIVO badge for inactive professionals", () => {
    render(
      <EquipeList
        profissionais={mockProfissionais}
        servicos={mockServicos}
        servicosProfissionais={mockAssociacoes}
        isProprietario={true}
      />,
    );

    expect(screen.getByText("INATIVO")).toBeInTheDocument();
  });

  it("should show empty state when no professionals", () => {
    render(
      <EquipeList
        profissionais={[]}
        servicos={mockServicos}
        servicosProfissionais={mockAssociacoes}
        isProprietario={true}
      />,
    );

    expect(
      screen.getByText("Nenhum profissional registrado."),
    ).toBeInTheDocument();
  });
});
