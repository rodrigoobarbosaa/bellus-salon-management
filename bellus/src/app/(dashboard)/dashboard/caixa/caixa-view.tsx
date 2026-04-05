"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Receipt,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { updateTransacaoFormaPagamento } from "@/app/actions/transacoes";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SALON_TZ } from "@/lib/timezone";

interface Transacao {
  id: string;
  valor: number;
  tipo_desconto: string | null;
  valor_desconto: number;
  valor_final: number;
  forma_pagamento: string;
  notas: string | null;
  created_at: string;
  cliente_id: string | null;
  profissional_id: string | null;
  servico_id: string | null;
  cliente_nome?: string;
  servico_nome?: string;
  profissional_nome?: string;
}

interface CaixaViewProps {
  salaoId: string;
  profissionais: Array<{ id: string; nome: string }>;
  servicos: Array<{ id: string; nome: string }>;
}

const FORMA_ICONS: Record<string, typeof Banknote> = {
  efectivo: Banknote,
  tarjeta: CreditCard,
  bizum: Smartphone,
  transferencia: Building2,
};

// FORMA_LABELS moved inside component for i18n access

const FORMA_COLORS: Record<string, string> = {
  efectivo: "bg-green-50 border-green-200 text-green-700",
  tarjeta: "bg-blue-50 border-blue-200 text-blue-700",
  bizum: "bg-purple-50 border-purple-200 text-purple-700",
  transferencia: "bg-orange-50 border-orange-200 text-orange-700",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export function CaixaView({ salaoId, profissionais, servicos }: CaixaViewProps) {
  const t = useTranslations("cashier");
  const tc = useTranslations("common");

  const FORMA_LABELS: Record<string, string> = {
    efectivo: t("paymentLabels.efectivo"),
    tarjeta: t("paymentLabels.tarjeta"),
    bizum: t("paymentLabels.bizum"),
    transferencia: t("paymentLabels.transferencia"),
  };

  const [tab, setTab] = useState<"dia" | "historico">("dia");
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);

  // History filters
  const [dateFrom, setDateFrom] = useState(formatDate(new Date(Date.now() - 30 * 86400000)));
  const [dateTo, setDateTo] = useState(formatDate(new Date()));
  const [filterProf, setFilterProf] = useState("");
  const [filterForma, setFilterForma] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Edit payment method state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForma, setEditForma] = useState<string>("");
  const [editLoading, setEditLoading] = useState(false);

  const supabase = createClient();

  const profMap = new Map(profissionais.map((p) => [p.id, p.nome]));
  const servicoMap = new Map(servicos.map((s) => [s.id, s.nome]));

  type RawTransacao = Omit<Transacao, "cliente_nome" | "servico_nome" | "profissional_nome"> & {
    clientes: { nome: string } | null;
  };

  const fetchTransacoes = useCallback(
    async (from: string, to: string) => {
      setLoading(true);

      const toEnd = new Date(to);
      toEnd.setDate(toEnd.getDate() + 1);

      let query = supabase
        .from("transacoes")
        .select("*, clientes(nome)" as string)
        .gte("created_at", `${from}T00:00:00`)
        .lt("created_at", toEnd.toISOString())
        .order("created_at", { ascending: false });

      if (filterProf) {
        query = query.eq("profissional_id", filterProf);
      }
      if (filterForma) {
        query = query.eq("forma_pagamento", filterForma as "efectivo" | "tarjeta" | "bizum" | "transferencia");
      }

      const { data } = await query;

      if (data) {
        const mapped = (data as unknown as RawTransacao[]).map((t) => ({
          ...t,
          cliente_nome: t.clientes?.nome ?? "—",
          servico_nome: servicoMap.get(t.servico_id ?? "") ?? "—",
          profissional_nome: profMap.get(t.profissional_id ?? "") ?? "—",
        }));
        setTransacoes(mapped);
      } else {
        setTransacoes([]);
      }
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterProf, filterForma]
  );

  useEffect(() => {
    if (tab === "dia") {
      fetchTransacoes(selectedDate, selectedDate);
    } else {
      fetchTransacoes(dateFrom, dateTo);
    }
  }, [tab, selectedDate, dateFrom, dateTo, fetchTransacoes]);

  // Day navigation
  function prevDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDate(d));
  }

  function nextDay() {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDate(d));
  }

  // Stats by forma
  const formaStats = ["efectivo", "tarjeta", "bizum", "transferencia"].map((forma) => {
    const items = transacoes.filter((t) => t.forma_pagamento === forma);
    return {
      forma,
      count: items.length,
      total: items.reduce((sum, t) => sum + t.valor_final, 0),
    };
  });

  const totalAmount = transacoes.reduce((sum, t) => sum + t.valor_final, 0);
  const totalCount = transacoes.length;

  async function handleSaveForma(transacaoId: string) {
    setEditLoading(true);
    const result = await updateTransacaoFormaPagamento(
      transacaoId,
      editForma as "efectivo" | "tarjeta" | "bizum" | "transferencia"
    );
    setEditLoading(false);
    if (result.success) {
      setTransacoes((prev) =>
        prev.map((t) =>
          t.id === transacaoId ? { ...t, forma_pagamento: editForma } : t
        )
      );
      setEditingId(null);
    }
  }

  function handleExport() {
    const header = "Fecha,Cliente,Servicio,Profesional,Valor,Descuento,Total,Forma\n";
    const rows = transacoes
      .map(
        (t) =>
          `${new Date(t.created_at).toLocaleString("es-ES")},${t.cliente_nome},${t.servico_nome},${t.profissional_nome},${t.valor},${t.valor_desconto},${t.valor_final},${FORMA_LABELS[t.forma_pagamento] ?? t.forma_pagamento}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes-${tab === "dia" ? selectedDate : `${dateFrom}_${dateTo}`}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setTab("dia")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "dia" ? "bg-white shadow-sm" : "hover:bg-gray-200"
          }`}
        >
          {t("dailyClose")}
        </button>
        <button
          onClick={() => setTab("historico")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "historico" ? "bg-white shadow-sm" : "hover:bg-gray-200"
          }`}
        >
          {t("history")}
        </button>
      </div>

      {/* Day selector (cierre) */}
      {tab === "dia" && (
        <div className="flex items-center gap-3">
          <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* History filters */}
      {tab === "historico" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{t("from")}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{t("to")}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                showFilters ? "bg-primary text-primary-foreground" : "hover:bg-gray-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              {t("filters")}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 ml-auto"
            >
              <Download className="h-4 w-4" />
              {t("exportCsv")}
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="text-xs text-muted-foreground">{t("professional")}</label>
                <select
                  value={filterProf}
                  onChange={(e) => setFilterProf(e.target.value)}
                  className="block mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">{t("allProfessionals")}</option>
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("paymentMethod")}</label>
                <select
                  value={filterForma}
                  onChange={(e) => setFilterForma(e.target.value)}
                  className="block mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">{t("all")}</option>
                  {Object.entries(FORMA_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total */}
        <div className="col-span-2 sm:col-span-1 bg-white border-2 border-gray-900 rounded-xl p-4">
          <p className="text-xs text-muted-foreground">{t("total")}</p>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-muted-foreground tabular-nums">{totalCount} {t("transactions")}</p>
        </div>

        {/* Per forma */}
        {formaStats.map(({ forma, count, total }) => {
          const Icon = FORMA_ICONS[forma] ?? Banknote;
          return (
            <div
              key={forma}
              className={`border rounded-xl p-4 ${FORMA_COLORS[forma] ?? ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{FORMA_LABELS[forma]}</span>
              </div>
              <p className="text-lg font-bold tabular-nums">{formatCurrency(total)}</p>
              <p className="text-xs opacity-70 tabular-nums">{count} {t("payments")}</p>
            </div>
          );
        })}
      </div>

      {/* Transactions list */}
      <div className="bg-white border rounded-xl">
        <div className="p-4 border-b">
          <h2 className="font-semibold">
            {tab === "dia" ? t("dailyTransactions") : t("transactionHistory")}
          </h2>
        </div>

        {loading ? (
          <SkeletonList rows={4} />
        ) : transacoes.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={`${t("noTransactions")} ${tab === "dia" ? t("forThisDay") : t("inThisPeriod")}`}
            className="py-8"
          />
        ) : (
          <div className="divide-y">
            {transacoes.map((t) => {
              const Icon = FORMA_ICONS[t.forma_pagamento] ?? Banknote;
              const time = new Date(t.created_at).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: SALON_TZ,
              });
              const date = tab === "historico"
                ? new Date(t.created_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    timeZone: SALON_TZ,
                  })
                : null;

              const isEditing = editingId === t.id;

              return (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${FORMA_COLORS[t.forma_pagamento] ?? "bg-gray-50"}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.servico_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.cliente_nome} · {t.profissional_nome}
                        {date && ` · ${date}`} · {time}
                      </p>
                      {isEditing && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {(["efectivo", "tarjeta", "bizum", "transferencia"] as const).map((forma) => {
                            const FIcon = FORMA_ICONS[forma] ?? Banknote;
                            return (
                              <button
                                key={forma}
                                type="button"
                                onClick={() => setEditForma(forma)}
                                className={`flex items-center gap-1 rounded border px-2 py-1 text-xs transition-colors ${
                                  editForma === forma
                                    ? "border-primary bg-primary/10 text-primary font-medium"
                                    : "border-gray-200 hover:bg-gray-100"
                                }`}
                              >
                                <FIcon className="h-3 w-3" />
                                {FORMA_LABELS[forma]}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => handleSaveForma(t.id)}
                            disabled={editLoading || editForma === t.forma_pagamento}
                            className="p-1 rounded text-green-600 hover:bg-green-50 disabled:opacity-40"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded text-gray-400 hover:bg-gray-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(t.id);
                          setEditForma(t.forma_pagamento);
                        }}
                        className="p-1.5 rounded text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors"
                        title={tc("edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div className="text-right">
                      <p className="font-medium tabular-nums">{formatCurrency(t.valor_final)}</p>
                      {t.valor_desconto > 0 && (
                        <p className="text-xs text-red-500 line-through">
                          {formatCurrency(t.valor)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
