"use client";

import { useState, useMemo } from "react";
import { Pencil, Plus, ToggleLeft, ToggleRight, Wrench, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toggleProfissionalAtivo } from "@/app/actions/equipe";
import { ProfissionalForm } from "./profissional-form";
import { ServicosDialog } from "./servicos-dialog";

interface Profissional {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: string;
  cor_agenda: string;
  ativo: boolean;
}

interface Servico {
  id: string;
  nome: string;
  preco_base: number;
  categoria: string;
}

interface ServicoProfissional {
  servico_id: string;
  profissional_id: string;
  preco_override: number | null;
}

type FiltroStatus = "todos" | "ativos" | "inativos";

interface EquipeListProps {
  profissionais: Profissional[];
  servicos: Servico[];
  servicosProfissionais: ServicoProfissional[];
  isProprietario: boolean;
}

export function EquipeList({
  profissionais,
  servicos,
  servicosProfissionais,
  isProprietario,
}: EquipeListProps) {
  const t = useTranslations("team");
  const tc = useTranslations("common");

  const [createOpen, setCreateOpen] = useState(false);
  const [editProfissional, setEditProfissional] = useState<Profissional | null>(null);
  const [servicosDialogProf, setServicosDialogProf] = useState<Profissional | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [busca, setBusca] = useState("");

  const filteredProfissionais = useMemo(() => {
    let result = profissionais;

    // Filtro por status
    if (filtroStatus === "ativos") {
      result = result.filter((p) => p.ativo);
    } else if (filtroStatus === "inativos") {
      result = result.filter((p) => !p.ativo);
    }

    // Filtro por busca
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      result = result.filter(
        (p) =>
          p.nome.toLowerCase().includes(termo) ||
          p.email.toLowerCase().includes(termo) ||
          (p.telefone && p.telefone.toLowerCase().includes(termo))
      );
    }

    return result;
  }, [profissionais, filtroStatus, busca]);

  async function handleToggle(id: string, currentAtivo: boolean) {
    setTogglingId(id);
    await toggleProfissionalAtivo(id, !currentAtivo);
    setTogglingId(null);
  }

  function getServiceCount(profId: string) {
    return servicosProfissionais.filter((sp) => sp.profissional_id === profId).length;
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">{t("title")}</h2>
          <p className="mt-1 text-sm text-stone-500">
            {t("count", { count: profissionais.length })}
          </p>
        </div>
        {isProprietario && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="size-4" />
            {t("newProfessional")}
          </Button>
        )}
      </div>

      {/* Busca + Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(["todos", "ativos", "inativos"] as FiltroStatus[]).map((filtro) => (
            <button
              key={filtro}
              onClick={() => setFiltroStatus(filtro)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroStatus === filtro
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {filtro === "todos"
                ? t("filterAll")
                : filtro === "ativos"
                  ? t("filterActive")
                  : t("filterInactive")}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filteredProfissionais.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-stone-500">
              {profissionais.length === 0
                ? t("noProfessionals")
                : tc("noResults")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProfissionais.map((prof) => {
            const serviceCount = getServiceCount(prof.id);

            return (
              <Card
                key={prof.id}
                className={`transition-opacity ${!prof.ativo ? "opacity-50" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar colorido */}
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: prof.cor_agenda }}
                      >
                        {prof.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold text-stone-900">
                            {prof.nome}
                          </h3>
                          {!prof.ativo && (
                            <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                              {t("inactive")}
                            </span>
                          )}
                        </div>
                        <span
                          className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            prof.role === "proprietario"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {prof.role === "proprietario"
                            ? t("roleOwner")
                            : t("roleProfessional")}
                        </span>
                      </div>
                    </div>

                    {isProprietario && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setEditProfissional(prof)}
                          title={tc("edit")}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleToggle(prof.id, prof.ativo)}
                          disabled={togglingId === prof.id}
                          title={prof.ativo ? t("deactivate") : t("activate")}
                        >
                          {prof.ativo ? (
                            <ToggleRight className="size-3.5 text-green-600" />
                          ) : (
                            <ToggleLeft className="size-3.5 text-stone-400" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="mt-3 space-y-1 text-xs text-stone-500">
                    <p className="truncate">{prof.email}</p>
                    {prof.telefone && <p>{prof.telefone}</p>}
                  </div>

                  {/* Serviços */}
                  <div className="mt-3 border-t border-stone-100 pt-2">
                    <p className="text-[11px] text-stone-400">
                      {serviceCount > 0
                        ? `${serviceCount} ${t("services")}`
                        : t("noServices")}
                    </p>
                    {isProprietario && (
                      <button
                        onClick={() => setServicosDialogProf(prof)}
                        className="mt-1 text-[11px] font-medium text-bellus-gold hover:underline"
                      >
                        {serviceCount > 0 ? t("manageServices") : t("assignServices")}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <ProfissionalForm open={createOpen} onOpenChange={setCreateOpen} />
      <ProfissionalForm
        open={!!editProfissional}
        onOpenChange={(open) => !open && setEditProfissional(null)}
        profissional={editProfissional}
      />
      {servicosDialogProf && (
        <ServicosDialog
          open={!!servicosDialogProf}
          onOpenChange={(open) => !open && setServicosDialogProf(null)}
          profissional={servicosDialogProf}
          servicos={servicos}
          currentAssociations={servicosProfissionais.filter(
            (sp) => sp.profissional_id === servicosDialogProf.id
          )}
        />
      )}
    </>
  );
}
