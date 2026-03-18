"use client";

import { useState } from "react";
import { Pencil, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toggleServicoAtivo } from "@/app/actions/servicos";
import { ServicoForm } from "./servico-form";
import { ProfissionaisDialog } from "./profissionais-dialog";

interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  preco_base: number;
  categoria: string;
  intervalo_retorno_dias: number | null;
  tempo_pausa_minutos: number | null;
  duracao_pos_pausa_minutos: number | null;
  ativo: boolean;
}

interface Profissional {
  id: string;
  nome: string;
}

interface ServicoProfissional {
  servico_id: string;
  profissional_id: string;
  preco_override: number | null;
}

const CATEGORIA_LABELS: Record<string, string> = {
  corte: "Corte",
  coloracao: "Coloración",
  mechas: "Mechas",
  tratamento: "Tratamiento",
  outro: "Otro",
};

const CATEGORIA_COLORS: Record<string, string> = {
  corte: "bg-blue-100 text-blue-700",
  coloracao: "bg-purple-100 text-purple-700",
  mechas: "bg-amber-100 text-amber-700",
  tratamento: "bg-green-100 text-green-700",
  outro: "bg-stone-100 text-stone-600",
};

interface ServicosListProps {
  servicos: Servico[];
  profissionais: Profissional[];
  servicosProfissionais: ServicoProfissional[];
  isProprietario: boolean;
}

export function ServicosList({
  servicos,
  profissionais,
  servicosProfissionais,
  isProprietario,
}: ServicosListProps) {
  const t = useTranslations("services");
  const tc = useTranslations("common");

  const CATEGORIA_LABELS_I18N: Record<string, string> = {
    corte: t("categories.corte"),
    coloracao: t("categories.coloracao"),
    mechas: t("categories.mechas"),
    tratamento: t("categories.tratamento"),
    outro: t("categories.outro"),
  };

  const [createOpen, setCreateOpen] = useState(false);
  const [editServico, setEditServico] = useState<Servico | null>(null);
  const [profDialogServico, setProfDialogServico] = useState<Servico | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);

  const filteredServicos = filtroCategoria
    ? servicos.filter((s) => s.categoria === filtroCategoria)
    : servicos;

  const categorias = [...new Set(servicos.map((s) => s.categoria))];

  async function handleToggle(id: string, currentAtivo: boolean) {
    setTogglingId(id);
    await toggleServicoAtivo(id, !currentAtivo);
    setTogglingId(null);
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">{t("title")}</h2>
          <p className="mt-1 text-sm text-stone-500">
            {t("count", { count: servicos.length })}
          </p>
        </div>
        {isProprietario && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="size-4" />
            {t("newService")}
          </Button>
        )}
      </div>

      {/* Filtros */}
      {categorias.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroCategoria(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filtroCategoria === null
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {tc("all")}
          </button>
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltroCategoria(cat === filtroCategoria ? null : cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                cat === filtroCategoria
                  ? "bg-stone-900 text-white"
                  : `${CATEGORIA_COLORS[cat] ?? "bg-stone-100 text-stone-600"} hover:opacity-80`
              }`}
            >
              {CATEGORIA_LABELS_I18N[cat] ?? cat}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {filteredServicos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-stone-500">
              {servicos.length === 0
                ? t("noServices")
                : t("noServicesCategory")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServicos.map((servico) => {
            const profs = servicosProfissionais
              .filter((sp) => sp.servico_id === servico.id)
              .map((sp) => profissionais.find((p) => p.id === sp.profissional_id))
              .filter(Boolean);

            return (
              <Card
                key={servico.id}
                className={`transition-opacity ${!servico.ativo ? "opacity-50" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold text-stone-900">
                          {servico.nome}
                        </h3>
                        {!servico.ativo && (
                          <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                            {t("inactive")}
                          </span>
                        )}
                      </div>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          CATEGORIA_COLORS[servico.categoria] ?? "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {CATEGORIA_LABELS_I18N[servico.categoria] ?? servico.categoria}
                      </span>
                    </div>

                    {isProprietario && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => setEditServico(servico)}
                          title={tc("edit")}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleToggle(servico.id, servico.ativo)}
                          disabled={togglingId === servico.id}
                          title={servico.ativo ? t("deactivate") : t("activate")}
                        >
                          {servico.ativo ? (
                            <ToggleRight className="size-3.5 text-green-600" />
                          ) : (
                            <ToggleLeft className="size-3.5 text-stone-400" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {servico.descricao && (
                    <p className="mt-2 line-clamp-2 text-xs text-stone-500">
                      {servico.descricao}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="font-semibold text-bellus-gold">
                      {servico.preco_base.toFixed(2)} €
                    </span>
                    <span className="text-stone-400">
                      {servico.duracao_minutos} min
                    </span>
                    {servico.intervalo_retorno_dias && (
                      <span className="text-xs text-stone-400">
                        ↻ {servico.intervalo_retorno_dias}d
                      </span>
                    )}
                  </div>

                  {/* Profissionais associados */}
                  <div className="mt-3 border-t border-stone-100 pt-2">
                    {profs.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {profs.map((p) => (
                          <span
                            key={p!.id}
                            className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600"
                          >
                            {p!.nome.split(" ")[0]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-stone-400">{t("noProfessionals")}</p>
                    )}
                    {isProprietario && (
                      <button
                        onClick={() => setProfDialogServico(servico)}
                        className="mt-1 text-[11px] font-medium text-bellus-gold hover:underline"
                      >
                        {profs.length > 0 ? t("manage") : t("assignProfessionals")}
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
      <ServicoForm open={createOpen} onOpenChange={setCreateOpen} />
      <ServicoForm
        open={!!editServico}
        onOpenChange={(open) => !open && setEditServico(null)}
        servico={editServico}
      />
      {profDialogServico && (
        <ProfissionaisDialog
          open={!!profDialogServico}
          onOpenChange={(open) => !open && setProfDialogServico(null)}
          servico={profDialogServico}
          profissionais={profissionais}
          currentAssociations={servicosProfissionais.filter(
            (sp) => sp.servico_id === profDialogServico.id
          )}
        />
      )}
    </>
  );
}
