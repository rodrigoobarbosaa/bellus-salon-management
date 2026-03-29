"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Users, AlertCircle, TrendingUp, Phone, Mail, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ClienteForm } from "./cliente-form";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  idioma_preferido: string;
  opt_out_notificacoes: boolean;
  proximo_retorno: string | null;
  created_at: string;
}

interface ReturnNotif {
  id: string;
  tipo: string;
  status: string;
  cliente_id: string;
}

interface ClientesListProps {
  clientes: Cliente[];
  totalClientes: number;
  pendingReturn: number;
  returnNotifs: ReturnNotif[];
}

const IDIOMA_LABELS: Record<string, string> = { es: "ES", pt: "PT", en: "EN", ru: "RU" };

export function ClientesList({ clientes, totalClientes, pendingReturn, returnNotifs }: ClientesListProps) {
  const t = useTranslations("clients");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filtroIdioma, setFiltroIdioma] = useState<string | null>(null);
  const [filtroOptOut, setFiltroOptOut] = useState<boolean | null>(null);
  const [filtroRetorno, setFiltroRetorno] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let result = clientes;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.nome.toLowerCase().includes(q) ||
          c.telefone.includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }
    if (filtroIdioma) {
      result = result.filter((c) => c.idioma_preferido === filtroIdioma);
    }
    if (filtroOptOut !== null) {
      result = result.filter((c) => c.opt_out_notificacoes === filtroOptOut);
    }
    if (filtroRetorno) {
      result = result.filter((c) => c.proximo_retorno && c.proximo_retorno <= today);
    }
    return result;
  }, [clientes, search, filtroIdioma, filtroOptOut, filtroRetorno, today]);

  // Conversion stats
  const totalSent = returnNotifs.length;
  const totalConverted = returnNotifs.filter((n) => n.status === "enviado").length;
  const conversionRate = totalSent > 0 ? Math.round((totalConverted / totalSent) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">{t("title")}</h1>
          <p className="text-sm text-stone-500">{t("registered", { count: totalClientes })}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" /> {t("newClient")}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800 tabular-nums">{totalClientes}</p>
              <p className="text-xs text-stone-500">{t("total")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800 tabular-nums">{pendingReturn}</p>
              <p className="text-xs text-stone-500">{t("pendingReturn")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800 tabular-nums">{conversionRate}%</p>
              <p className="text-xs text-stone-500">{t("returnConversion")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Idioma filter */}
        {(["es", "pt", "en", "ru"] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setFiltroIdioma(filtroIdioma === lang ? null : lang)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filtroIdioma === lang
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {IDIOMA_LABELS[lang]}
          </button>
        ))}
        <span className="mx-1 self-center text-stone-300">|</span>
        {/* Opt-out filter */}
        <button
          onClick={() => setFiltroOptOut(filtroOptOut === true ? null : true)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filtroOptOut === true
              ? "bg-red-600 text-white"
              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}
        >
          Opt-out
        </button>
        {/* Retorno pendiente filter */}
        <button
          onClick={() => setFiltroRetorno(!filtroRetorno)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filtroRetorno
              ? "bg-amber-600 text-white"
              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}
        >
          {t("pendingReturn")}
        </button>
        {/* Clear filters */}
        {(filtroIdioma || filtroOptOut !== null || filtroRetorno) && (
          <button
            onClick={() => { setFiltroIdioma(null); setFiltroOptOut(null); setFiltroRetorno(false); }}
            className="rounded-full px-3 py-1 text-xs font-medium text-stone-400 hover:text-stone-600"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      {/* Client list */}
      <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? t("noResults") : t("noClients")}
            description={search ? undefined : t("registered", { count: 0 })}
            className="py-8"
          />
        ) : (
          filtered.map((c) => {
            const isOverdue = c.proximo_retorno && c.proximo_retorno <= today;
            return (
              <Link
                key={c.id}
                href={`/dashboard/clientes/${c.id}`}
                className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bellus-gold/10 text-sm font-bold text-bellus-gold">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-800">{c.nome}</span>
                      <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                        {IDIOMA_LABELS[c.idioma_preferido] ?? c.idioma_preferido}
                      </span>
                      {isOverdue && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          {t("return")}
                        </span>
                      )}
                      {c.opt_out_notificacoes && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                          Opt-out
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.telefone}
                      </span>
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
              </Link>
            );
          })
        )}
      </div>

      <ClienteForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
}
