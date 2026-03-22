"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateProfissionalServicos } from "@/app/actions/equipe";

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

interface ServicosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profissional: { id: string; nome: string };
  servicos: Servico[];
  currentAssociations: ServicoProfissional[];
}

interface ServicoState {
  selected: boolean;
  preco_override: string;
}

export function ServicosDialog({
  open,
  onOpenChange,
  profissional,
  servicos,
  currentAssociations,
}: ServicosDialogProps) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [servicoStates, setServicoStates] = useState<Record<string, ServicoState>>(() => {
    const states: Record<string, ServicoState> = {};
    for (const s of servicos) {
      const assoc = currentAssociations.find((a) => a.servico_id === s.id);
      states[s.id] = {
        selected: !!assoc,
        preco_override: assoc?.preco_override != null ? String(assoc.preco_override) : "",
      };
    }
    return states;
  });

  function toggleServico(id: string) {
    setServicoStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected },
    }));
  }

  function setPreco(id: string, value: string) {
    setServicoStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], preco_override: value },
    }));
  }

  async function handleSave() {
    setError(null);
    setIsLoading(true);

    const selected = Object.entries(servicoStates)
      .filter(([, state]) => state.selected)
      .map(([servicoId, state]) => ({
        servico_id: servicoId,
        preco_override: state.preco_override ? parseFloat(state.preco_override) : null,
      }));

    const result = await updateProfissionalServicos(profissional.id, selected);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("servicesFor", { name: profissional.nome })}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <p className="text-xs text-stone-500">
          {t("priceOverrideHint")}
        </p>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {servicos.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-500">
              {t("noServicesAvailable")}
            </p>
          ) : (
            servicos.map((servico) => {
              const state = servicoStates[servico.id];
              return (
                <div
                  key={servico.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    state.selected
                      ? "border-bellus-gold/30 bg-bellus-gold/5"
                      : "border-stone-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={state.selected}
                    onChange={() => toggleServico(servico.id)}
                    className="size-4 rounded border-stone-300 text-bellus-gold accent-bellus-gold"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-stone-700">
                      {servico.nome}
                    </span>
                    <span className="ml-2 text-xs text-stone-400">
                      {t("basePrice")}: {servico.preco_base.toFixed(2)} €
                    </span>
                  </div>
                  {state.selected && (
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder={`${servico.preco_base.toFixed(2)}`}
                      value={state.preco_override}
                      onChange={(e) => setPreco(servico.id, e.target.value)}
                      className="h-8 w-24 text-right text-sm"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? t("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
