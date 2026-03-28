"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  Calendar,
  Clock,
  DollarSign,
  Edit2,
  Save,
  X,
  ExternalLink,
  BellOff,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { updateCliente } from "@/app/actions/clientes";
import { SALON_TZ } from "@/lib/timezone";

interface Visita {
  id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
  notas: string | null;
  servico_id: string;
  profissional_id: string;
  servico_nome: string;
  servico_preco: number;
  profissional_nome: string;
}

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  idioma_preferido: string;
  notas: string | null;
  intervalo_retorno_dias: number | null;
  opt_out_notificacoes: boolean;
  proximo_retorno: string | null;
  created_at: string;
}

interface ClienteFichaProps {
  cliente: Cliente;
  visitas: Visita[];
  totalVisitas: number;
  totalSpent: number;
  salaoSlug: string;
}

const statusLabels: Record<string, string> = {
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  pendente: "Pendente",
  no_show: "No-show",
};

const statusColors: Record<string, string> = {
  confirmado: "bg-blue-100 text-blue-800",
  concluido: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
  pendente: "bg-yellow-100 text-yellow-800",
  no_show: "bg-gray-100 text-gray-800",
};

const idiomaLabels: Record<string, string> = {
  es: "Español",
  pt: "Português",
  en: "English",
  ru: "Русский",
};

export function ClienteFicha({
  cliente,
  visitas,
  totalVisitas,
  totalSpent,
  salaoSlug,
}: ClienteFichaProps) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nome, setNome] = useState(cliente.nome);
  const [telefone, setTelefone] = useState(cliente.telefone);
  const [email, setEmail] = useState(cliente.email ?? "");
  const [idioma, setIdioma] = useState(cliente.idioma_preferido);
  const [notas, setNotas] = useState(cliente.notas ?? "");
  const [intervaloRetorno, setIntervaloRetorno] = useState(
    cliente.intervalo_retorno_dias?.toString() ?? ""
  );

  const isReturnOverdue =
    cliente.proximo_retorno &&
    new Date(cliente.proximo_retorno) < new Date();

  async function handleSave() {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("id", cliente.id);
    fd.set("nome", nome);
    fd.set("telefone", telefone);
    fd.set("email", email);
    fd.set("idioma_preferido", idioma);
    fd.set("notas", notas);
    if (intervaloRetorno) {
      fd.set("intervalo_retorno_dias", intervaloRetorno);
    }
    const result = await updateCliente(fd);
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setEditing(false);
      router.refresh();
    }
  }

  function handleCancel() {
    setNome(cliente.nome);
    setTelefone(cliente.telefone);
    setEmail(cliente.email ?? "");
    setIdioma(cliente.idioma_preferido);
    setNotas(cliente.notas ?? "");
    setIntervaloRetorno(cliente.intervalo_retorno_dias?.toString() ?? "");
    setEditing(false);
    setError(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: SALON_TZ,
    });
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: SALON_TZ,
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/clientes"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{cliente.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {t("clientSince")} {formatDate(cliente.created_at)}
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            {tc("edit")}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              {tc("cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? t("saving") : tc("save")}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            {t("visits")}
          </div>
          <p className="text-2xl font-bold">{totalVisitas}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <DollarSign className="h-4 w-4" />
            {t("totalSpent")}
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            {t("nextReturn")}
          </div>
          {cliente.proximo_retorno ? (
            <p className={`text-2xl font-bold ${isReturnOverdue ? "text-red-600" : ""}`}>
              {formatDate(cliente.proximo_retorno)}
              {isReturnOverdue && (
                <AlertTriangle className="inline ml-2 h-5 w-5 text-red-500" />
              )}
            </p>
          ) : (
            <p className="text-2xl font-bold text-muted-foreground">—</p>
          )}
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">{t("clientInfo")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("name")}</label>
            {editing ? (
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            ) : (
              <p className="mt-1">{cliente.nome}</p>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" /> {t("phone")}
            </label>
            {editing ? (
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            ) : (
              <p className="mt-1">
                <a href={`tel:${cliente.telefone}`} className="text-primary hover:underline">
                  {cliente.telefone}
                </a>
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email
            </label>
            {editing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            ) : (
              <p className="mt-1">{cliente.email || "—"}</p>
            )}
          </div>

          {/* Idioma */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" /> {t("language")}
            </label>
            {editing ? (
              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="es">Español</option>
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
            ) : (
              <p className="mt-1">{idiomaLabels[cliente.idioma_preferido] ?? cliente.idioma_preferido}</p>
            )}
          </div>

          {/* Intervalo retorno */}
          <div>
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {t("returnInterval")}
            </label>
            {editing ? (
              <input
                type="number"
                min="1"
                value={intervaloRetorno}
                onChange={(e) => setIntervaloRetorno(e.target.value)}
                placeholder={t("returnIntervalPlaceholder")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            ) : (
              <p className="mt-1">
                {cliente.intervalo_retorno_dias
                  ? `${cliente.intervalo_retorno_dias} días`
                  : "—"}
              </p>
            )}
          </div>

          {/* Notificações */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">{t("notifications")}</label>
            <p className="mt-1 flex items-center gap-1">
              {cliente.opt_out_notificacoes ? (
                <>
                  <BellOff className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Opt-out</span>
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">{t("active")}</span>
                </>
              )}
            </p>
          </div>

          {/* Notas - full width */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-muted-foreground">{t("notes")}</label>
            {editing ? (
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="w-full mt-1 px-3 py-2 border rounded-lg resize-none"
              />
            ) : (
              <p className="mt-1 whitespace-pre-wrap">{cliente.notas || "—"}</p>
            )}
          </div>
        </div>

        {/* Booking link */}
        {salaoSlug && (
          <div className="mt-4 pt-4 border-t">
            <Link
              href={`/booking/${salaoSlug}`}
              target="_blank"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              {t("bookingLink")}
            </Link>
          </div>
        )}
      </div>

      {/* Visit History */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">{t("visitHistory")}</h2>
        {visitas.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t("noVisits")}
          </p>
        ) : (
          <div className="space-y-3">
            {visitas.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{v.servico_nome}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusColors[v.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {statusLabels[v.status] ?? v.status}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatDate(v.data_hora_inicio)} {formatTime(v.data_hora_inicio)}–
                    {formatTime(v.data_hora_fim)} · {v.profissional_nome}
                  </div>
                  {v.notas && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      {v.notas}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-medium">{formatCurrency(v.servico_preco)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
