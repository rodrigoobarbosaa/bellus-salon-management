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
import { createCliente } from "@/app/actions/clientes";

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteForm({ open, onOpenChange }: ClienteFormProps) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await createCliente(formData);

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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("newClient")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div className="space-y-2">
            <label htmlFor="nome" className="text-sm font-medium text-stone-700">{t("name")}</label>
            <Input id="nome" name="nome" required disabled={isLoading} />
          </div>

          <div className="space-y-2">
            <label htmlFor="telefone" className="text-sm font-medium text-stone-700">{t("phone")}</label>
            <Input id="telefone" name="telefone" type="tel" required disabled={isLoading} placeholder="+34 600 000 000" />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-stone-700">{t("email")}</label>
            <Input id="email" name="email" type="email" disabled={isLoading} />
          </div>

          <div className="space-y-2">
            <label htmlFor="idioma_preferido" className="text-sm font-medium text-stone-700">{t("language")}</label>
            <select
              id="idioma_preferido"
              name="idioma_preferido"
              defaultValue="es"
              disabled={isLoading}
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs"
            >
              <option value="es">Español</option>
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="notas" className="text-sm font-medium text-stone-700">{t("notes")}</label>
            <textarea
              id="notas"
              name="notas"
              rows={2}
              disabled={isLoading}
              className="w-full rounded-md border border-stone-200 p-2 text-sm"
              placeholder={t("notesPlaceholder")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("creating") : t("createClient")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
