"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { MessageSquare, Bot, User, Search, Phone, Instagram } from "lucide-react";
import { ConversaDetail } from "./conversa-detail";

interface Conversa {
  id: string;
  canal: string;
  external_id: string;
  estado: string;
  ultima_mensagem_em: string | null;
  created_at: string;
  cliente_id: string | null;
  clientes: { nome: string; telefone: string } | null;
}

interface ConversasViewProps {
  conversas: Conversa[];
  stats: { total: number; ativas: number; aguardando: number; encerradas: number };
  salaoId: string;
}

export function ConversasView({ conversas, stats, salaoId }: ConversasViewProps) {
  const t = useTranslations("conversas");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todas" | "ativo" | "aguardando_humano" | "encerrado">("todas");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return conversas.filter((c) => {
      const matchSearch =
        !search ||
        (c.clientes?.nome ?? c.external_id).toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "todas" || c.estado === filter;
      return matchSearch && matchFilter;
    });
  }, [conversas, search, filter]);

  const selected = conversas.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">{t("title")}</h1>
        <p className="text-sm text-stone-500">{t("description")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("stats.total")} value={stats.total} />
        <StatCard label={t("stats.ativas")} value={stats.ativas} color="text-green-600" />
        <StatCard
          label={t("stats.aguardando")}
          value={stats.aguardando}
          color="text-amber-600"
          pulse={stats.aguardando > 0}
        />
        <StatCard label={t("stats.encerradas")} value={stats.encerradas} color="text-stone-400" />
      </div>

      {/* Main content: list + detail */}
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Sidebar list */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-bellus-gold focus:outline-none focus:ring-1 focus:ring-bellus-gold"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
            {(["todas", "ativo", "aguardando_humano", "encerrado"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                  filter === f
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {t(`filter.${f}`)}
              </button>
            ))}
          </div>

          {/* Conversation list */}
          <div className="max-h-[calc(100vh-380px)] space-y-1.5 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-stone-400">
                {t("empty")}
              </div>
            ) : (
              filtered.map((conversa) => (
                <button
                  key={conversa.id}
                  onClick={() => setSelectedId(conversa.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedId === conversa.id
                      ? "border-bellus-gold bg-bellus-gold/5"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {conversa.canal === "whatsapp" ? (
                        <Phone className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Instagram className="h-3.5 w-3.5 text-pink-500" />
                      )}
                      <span className="text-sm font-medium text-stone-900">
                        {conversa.clientes?.nome ?? conversa.external_id}
                      </span>
                    </div>
                    <EstadoBadge estado={conversa.estado} />
                  </div>
                  {conversa.clientes?.telefone && (
                    <p className="mt-1 text-xs text-stone-400">{conversa.clientes.telefone}</p>
                  )}
                  {conversa.ultima_mensagem_em && (
                    <p className="mt-1 text-xs text-stone-400">
                      {formatRelativeTime(conversa.ultima_mensagem_em)}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="min-h-[500px] rounded-xl border border-stone-200 bg-white">
          {selected ? (
            <ConversaDetail conversa={selected} salaoId={salaoId} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
              <MessageSquare className="h-12 w-12 text-stone-300" />
              <p className="text-sm text-stone-400">{t("selectConversa")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "text-stone-900",
  pulse = false,
}: {
  label: string;
  value: number;
  color?: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3">
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`text-xl font-bold ${color} ${pulse ? "animate-pulse" : ""}`}>{value}</p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    ativo: "bg-green-100 text-green-700",
    aguardando_humano: "bg-amber-100 text-amber-700",
    encerrado: "bg-stone-100 text-stone-500",
  };

  const labels: Record<string, string> = {
    ativo: "Bot",
    aguardando_humano: "Humano",
    encerrado: "Cerrada",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[estado] ?? styles.encerrado}`}>
      {labels[estado] ?? estado}
    </span>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}
