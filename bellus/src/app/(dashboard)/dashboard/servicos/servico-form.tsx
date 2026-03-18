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
import { createServico, updateServico } from "@/app/actions/servicos";

const CATEGORIA_KEYS = ["corte", "coloracao", "mechas", "tratamento", "outro"] as const;

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

const CATEGORIAS_COM_PAUSA = ["coloracao", "mechas", "tratamento"];

interface ServicoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico?: Servico | null;
}

export function ServicoForm({ open, onOpenChange, servico }: ServicoFormProps) {
  const t = useTranslations("services");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoria, setCategoria] = useState(servico?.categoria ?? "corte");
  const isEditing = !!servico;
  const showPausaFields = CATEGORIAS_COM_PAUSA.includes(categoria);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    const action = isEditing ? updateServico : createServico;
    const result = await action(formData);

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
          <DialogTitle>{isEditing ? t("editService") : t("newService")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {isEditing && <input type="hidden" name="id" value={servico.id} />}

          <div className="space-y-2">
            <label htmlFor="nome" className="text-sm font-medium text-stone-700">
              {t("name")}
            </label>
            <Input
              id="nome"
              name="nome"
              type="text"
              placeholder={t("namePlaceholder")}
              required
              disabled={isLoading}
              defaultValue={servico?.nome ?? ""}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="descricao" className="text-sm font-medium text-stone-700">
              {t("description")}
            </label>
            <Input
              id="descricao"
              name="descricao"
              type="text"
              placeholder={t("descriptionPlaceholder")}
              disabled={isLoading}
              defaultValue={servico?.descricao ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="duracao_minutos" className="text-sm font-medium text-stone-700">
                {t("durationMin")}
              </label>
              <Input
                id="duracao_minutos"
                name="duracao_minutos"
                type="number"
                min={1}
                placeholder="30"
                required
                disabled={isLoading}
                defaultValue={servico?.duracao_minutos ?? ""}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="preco_base" className="text-sm font-medium text-stone-700">
                {t("priceEur")}
              </label>
              <Input
                id="preco_base"
                name="preco_base"
                type="number"
                min={0}
                step={0.01}
                placeholder="25.00"
                required
                disabled={isLoading}
                defaultValue={servico?.preco_base ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="categoria" className="text-sm font-medium text-stone-700">
              {t("category")}
            </label>
            <select
              id="categoria"
              name="categoria"
              required
              disabled={isLoading}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {CATEGORIA_KEYS.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Campos de pausa/secado — só para coloração, mechas, tratamento */}
          {showPausaFields && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-700">
                {t("stagesConfig")}
              </p>
              <p className="text-xs text-amber-600">
                {t("stagesHint")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="tempo_pausa_minutos" className="text-xs font-medium text-stone-700">
                    {t("pauseMin")}
                  </label>
                  <Input
                    id="tempo_pausa_minutos"
                    name="tempo_pausa_minutos"
                    type="number"
                    min={1}
                    placeholder="Ej: 40"
                    disabled={isLoading}
                    defaultValue={servico?.tempo_pausa_minutos ?? ""}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="duracao_pos_pausa_minutos" className="text-xs font-medium text-stone-700">
                    {t("dryingMin")}
                  </label>
                  <Input
                    id="duracao_pos_pausa_minutos"
                    name="duracao_pos_pausa_minutos"
                    type="number"
                    min={1}
                    placeholder="Ej: 25"
                    disabled={isLoading}
                    defaultValue={servico?.duracao_pos_pausa_minutos ?? ""}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="intervalo_retorno_dias" className="text-sm font-medium text-stone-700">
              {t("returnInterval")}
            </label>
            <Input
              id="intervalo_retorno_dias"
              name="intervalo_retorno_dias"
              type="number"
              min={1}
              placeholder={t("returnIntervalPlaceholder")}
              disabled={isLoading}
              defaultValue={servico?.intervalo_retorno_dias ?? ""}
            />
            <p className="text-xs text-stone-400">
              {t("returnIntervalHint")}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? t("saving")
                  : t("creating")
                : isEditing
                  ? t("saveChanges")
                  : t("createService")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
