"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";

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

const FORMA_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  bizum: "Bizum",
  transferencia: "Transferencia",
};

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

  const supabase = createClient();

  const profMap = new Map(profissionais.map((p) => [p.id, p.nome]));
  const servicoMap = new Map(servicos.map((s) => [s.id, s.nome]));

  const fetchTransacoes = useCallback(
    async (from: string, to: string) => {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      const toEnd = new Date(to);
      toEnd.setDate(toEnd.getDate() + 1);

      let query = sb
        .from("transacoes")
        .select("*, clientes(nome)")
        .gte("created_at", `${from}T00:00:00`)
        .lt("created_at", toEnd.toISOString())
        .order("created_at", { ascending: false });

      if (filterProf) {
        query = query.eq("profissional_id", filterProf);
      }
      if (filterForma) {
        query = query.eq("forma_pagamento", filterForma);
      }

      const { data } = await query;

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = (data as any[]).map((t) => ({
          ...t,
          cliente_nome: t.clientes?.nome ?? "—",
          servico_nome: servicoMap.get(t.servico_id) ?? "—",
          profissional_nome: profMap.get(t.profissional_id) ?? "—",
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
          Cierre del día
        </button>
        <button
          onClick={() => setTab("historico")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "historico" ? "bg-white shadow-sm" : "hover:bg-gray-200"
          }`}
        >
          Historial
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
              <label className="text-sm text-muted-foreground">Desde:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Hasta:</label>
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
              Filtros
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 ml-auto"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
              <div>
                <label className="text-xs text-muted-foreground">Profesional</label>
                <select
                  value={filterProf}
                  onChange={(e) => setFilterProf(e.target.value)}
                  className="block mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Todos</option>
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Forma de pago</label>
                <select
                  value={filterForma}
                  onChange={(e) => setFilterForma(e.target.value)}
                  className="block mt-1 border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Todas</option>
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
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-muted-foreground">{totalCount} transacciones</p>
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
              <p className="text-lg font-bold">{formatCurrency(total)}</p>
              <p className="text-xs opacity-70">{count} pagos</p>
            </div>
          );
        })}
      </div>

      {/* Transactions list */}
      <div className="bg-white border rounded-xl">
        <div className="p-4 border-b">
          <h2 className="font-semibold">
            {tab === "dia" ? "Transacciones del día" : "Historial de transacciones"}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando...</div>
        ) : transacoes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Sin transacciones {tab === "dia" ? "para este día" : "en este período"}
          </div>
        ) : (
          <div className="divide-y">
            {transacoes.map((t) => {
              const Icon = FORMA_ICONS[t.forma_pagamento] ?? Banknote;
              const time = new Date(t.created_at).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const date = tab === "historico"
                ? new Date(t.created_at).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                  })
                : null;

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
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(t.valor_final)}</p>
                    {t.valor_desconto > 0 && (
                      <p className="text-xs text-red-500 line-through">
                        {formatCurrency(t.valor)}
                      </p>
                    )}
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
