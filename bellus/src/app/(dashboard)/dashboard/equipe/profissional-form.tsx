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
import { createProfissional, updateProfissional } from "@/app/actions/equipe";

interface Profissional {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: string;
  cor_agenda: string;
  ativo: boolean;
}

interface ProfissionalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profissional?: Profissional | null;
}

export function ProfissionalForm({ open, onOpenChange, profissional }: ProfissionalFormProps) {
  const t = useTranslations("team");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!profissional;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    const action = isEditing ? updateProfissional : createProfissional;
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
          <DialogTitle>{isEditing ? t("editProfessional") : t("newProfessional")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {isEditing && <input type="hidden" name="id" value={profissional.id} />}

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
              defaultValue={profissional?.nome ?? ""}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-stone-700">
              {t("email")}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              required
              disabled={isLoading}
              defaultValue={profissional?.email ?? ""}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="telefone" className="text-sm font-medium text-stone-700">
              {t("phone")}
            </label>
            <Input
              id="telefone"
              name="telefone"
              type="text"
              placeholder={t("phonePlaceholder")}
              disabled={isLoading}
              defaultValue={profissional?.telefone ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-stone-700">
                {t("role")}
              </label>
              <select
                id="role"
                name="role"
                disabled={isLoading}
                defaultValue={profissional?.role ?? "profissional"}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="profissional">{t("roleProfessional")}</option>
                <option value="proprietario">{t("roleOwner")}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="cor_agenda" className="text-sm font-medium text-stone-700">
                {t("calendarColor")}
              </label>
              <Input
                id="cor_agenda"
                name="cor_agenda"
                type="color"
                disabled={isLoading}
                defaultValue={profissional?.cor_agenda ?? "#6366f1"}
                className="h-9 cursor-pointer p-1"
              />
            </div>
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
                  : t("createProfessional")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
