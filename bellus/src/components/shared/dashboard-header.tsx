"use client";

import { usePathname } from "next/navigation";

interface DashboardHeaderProps {
  userName: string;
}

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/agenda": "Agenda",
  "/dashboard/clientes": "Clientes",
  "/dashboard/servicos": "Servicios",
  "/dashboard/caixa": "Caja",
  "/dashboard/fiscal": "Fiscal",
  "/dashboard/equipe": "Equipo",
  "/dashboard/configuracoes": "Ajustes",
  "/dashboard/atendimentos": "Mis Citas",
};

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const pathname = usePathname();

  const currentLabel =
    routeLabels[pathname] ??
    pathname.split("/").pop()?.replace(/-/g, " ") ??
    "Dashboard";

  return (
    <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-bellus-dark md:hidden">
          <span className="text-bellus-gold">B</span>ellus
        </h1>
        <div className="hidden items-center gap-2 text-sm text-stone-500 md:flex">
          <span>Bellus</span>
          <span>/</span>
          <span className="font-medium text-stone-900">{currentLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
          aria-label="Cambiar idioma"
          title="Idioma (Story 1.5)"
          disabled
        >
          ES
        </button>
        <div
          className="flex size-8 items-center justify-center rounded-full bg-bellus-gold/20 text-sm font-semibold text-bellus-gold"
          aria-label={`Perfil de ${userName}`}
        >
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
