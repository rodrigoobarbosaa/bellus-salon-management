"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

interface DashboardHeaderProps {
  userName: string;
}

const routeLabelKeys: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/dashboard/agenda": "nav.agenda",
  "/dashboard/clientes": "nav.clientes",
  "/dashboard/servicos": "nav.servicos",
  "/dashboard/caixa": "nav.caixa",
  "/dashboard/fiscal": "nav.fiscal",
  "/dashboard/equipe": "nav.equipe",
  "/dashboard/configuracoes": "nav.configuracoes",
  "/dashboard/atendimentos": "nav.atendimentos",
  "/dashboard/marketing": "nav.marketing",
  "/dashboard/notificacoes": "nav.notificacoes",
};

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const pathname = usePathname();
  const t = useTranslations();

  const labelKey = routeLabelKeys[pathname];
  const currentLabel = labelKey
    ? t(labelKey)
    : pathname.split("/").pop()?.replace(/-/g, " ") ?? "Dashboard";

  return (
    <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-bellus-dark text-lg font-semibold md:hidden">
          <span className="text-bellus-gold">B</span>ellus
        </h1>
        <div className="hidden items-center gap-2 text-sm text-stone-500 md:flex">
          <span>Bellus</span>
          <span>/</span>
          <span className="font-medium text-stone-900">{currentLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <div
          className="bg-bellus-gold/20 text-bellus-gold flex size-8 items-center justify-center rounded-full text-sm font-semibold"
          aria-label={userName}
        >
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
