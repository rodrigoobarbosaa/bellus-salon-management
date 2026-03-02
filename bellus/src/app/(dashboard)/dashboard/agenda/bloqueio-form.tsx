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
import { createBloqueio } from "@/app/actions/bloqueios";

interface Profissional {
  id: string;
  nome: string;
}

interface BloqueioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profissionais: Profissional[];
  defaultDate: Date | null;
  currentProfissionalId: string | null;
}

export function BloqueioForm({
  open,
  onOpenChange,
  profissionais,
  defaultDate,
  currentProfissionalId,
}: BloqueioFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diaInteiro, setDiaInteiro] = useState(false);

  const defaultDateStr = defaultDate
    ? defaultDate.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const defaultTimeStart = defaultDate
    ? new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.set("dia_inteiro", diaInteiro ? "true" : "false");

    const result = await createBloqueio(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setDiaInteiro(false);
    onOpenChange(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null);
      setDiaInteiro(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Bloquear horario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {/* Profissional */}
          <div className="space-y-2">
            <label htmlFor="profissional_id" className="text-sm font-medium text-stone-700">
              Profesional *
            </label>
            <select
              id="profissional_id"
              name="profissional_id"
              required
              disabled={isLoading}
              defaultValue={currentProfissionalId ?? ""}
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Seleccionar...</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Dia inteiro toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="dia_inteiro_check"
              checked={diaInteiro}
              onChange={(e) => setDiaInteiro(e.target.checked)}
              className="size-4 rounded border-stone-300 accent-bellus-gold"
            />
            <label htmlFor="dia_inteiro_check" className="text-sm text-stone-700">
              Día completo (folga)
            </label>
          </div>

          {diaInteiro ? (
            <div className="space-y-2">
              <label htmlFor="fecha" className="text-sm font-medium text-stone-700">
                Fecha *
              </label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                required
                disabled={isLoading}
                defaultValue={defaultDateStr}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="data_hora_inicio" className="text-sm font-medium text-stone-700">
                  Inicio *
                </label>
                <Input
                  id="data_hora_inicio"
                  name="data_hora_inicio"
                  type="datetime-local"
                  required={!diaInteiro}
                  disabled={isLoading}
                  defaultValue={defaultTimeStart}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="data_hora_fim" className="text-sm font-medium text-stone-700">
                  Fin *
                </label>
                <Input
                  id="data_hora_fim"
                  name="data_hora_fim"
                  type="datetime-local"
                  required={!diaInteiro}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <label htmlFor="motivo" className="text-sm font-medium text-stone-700">
              Motivo
            </label>
            <Input
              id="motivo"
              name="motivo"
              type="text"
              placeholder="Ej: Almuerzo, Vacaciones, Curso..."
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Bloquear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
