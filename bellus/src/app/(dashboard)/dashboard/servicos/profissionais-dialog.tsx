"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateServicoProfissionais } from "@/app/actions/servicos";

interface Profissional {
  id: string;
  nome: string;
}

interface ServicoProfissional {
  servico_id: string;
  profissional_id: string;
  preco_override: number | null;
}

interface ProfissionaisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico: { id: string; nome: string; preco_base: number };
  profissionais: Profissional[];
  currentAssociations: ServicoProfissional[];
}

interface ProfState {
  selected: boolean;
  preco_override: string;
}

export function ProfissionaisDialog({
  open,
  onOpenChange,
  servico,
  profissionais,
  currentAssociations,
}: ProfissionaisDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profStates, setProfStates] = useState<Record<string, ProfState>>(() => {
    const states: Record<string, ProfState> = {};
    for (const p of profissionais) {
      const assoc = currentAssociations.find((a) => a.profissional_id === p.id);
      states[p.id] = {
        selected: !!assoc,
        preco_override: assoc?.preco_override != null ? String(assoc.preco_override) : "",
      };
    }
    return states;
  });

  function toggleProf(id: string) {
    setProfStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected },
    }));
  }

  function setPreco(id: string, value: string) {
    setProfStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], preco_override: value },
    }));
  }

  async function handleSave() {
    setError(null);
    setIsLoading(true);

    const selected = Object.entries(profStates)
      .filter(([, state]) => state.selected)
      .map(([profId, state]) => ({
        profissional_id: profId,
        preco_override: state.preco_override ? parseFloat(state.preco_override) : null,
      }));

    const result = await updateServicoProfissionais(servico.id, selected);

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
          <DialogTitle>Profesionales — {servico.nome}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <p className="text-xs text-stone-500">
          Precio base: <strong>{servico.preco_base.toFixed(2)} €</strong>.
          Deja el precio vacío para usar el precio base.
        </p>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {profissionais.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-500">
              No hay profesionales registrados.
            </p>
          ) : (
            profissionais.map((prof) => {
              const state = profStates[prof.id];
              return (
                <div
                  key={prof.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                    state.selected
                      ? "border-bellus-gold/30 bg-bellus-gold/5"
                      : "border-stone-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={state.selected}
                    onChange={() => toggleProf(prof.id)}
                    className="size-4 rounded border-stone-300 text-bellus-gold accent-bellus-gold"
                  />
                  <span className="flex-1 text-sm font-medium text-stone-700">
                    {prof.nome}
                  </span>
                  {state.selected && (
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder={`${servico.preco_base.toFixed(2)}`}
                      value={state.preco_override}
                      onChange={(e) => setPreco(prof.id, e.target.value)}
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
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
