"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Calendar,
  DollarSign,
  Users,
  Scissors,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type {
  TodayAppointment,
  TodayForecast,
  RevenueData,
  ClientData,
  TopService,
  FiscalSummary,
} from "@/app/actions/dashboard";

// --- Status Badge ---

const statusColors: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-700",
  confirmado: "bg-blue-100 text-blue-700",
  concluido: "bg-green-100 text-green-700",
  cancelado: "bg-stone-100 text-stone-500",
};

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("kpi");
  const labels: Record<string, string> = {
    pendente: t("statusPending"),
    confirmado: t("statusConfirmed"),
    concluido: t("statusCompleted"),
    cancelado: t("statusCancelled"),
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status] || "bg-stone-100"}`}>
      {labels[status] || status}
    </span>
  );
}

// --- Trend Indicator ---

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  const isUp = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-green-600" : "text-red-500"}`}>
      {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {isUp ? "+" : ""}
      {pct}%
    </span>
  );
}

// --- 1. Today Agenda Card ---

export function TodayAgendaCard({ appointments }: { appointments: TodayAppointment[] }) {
  const t = useTranslations("kpi");
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-stone-600">{t("todayAgenda")}</CardTitle>
        <Calendar className="text-bellus-gold size-4" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-stone-900">{appointments.length}</p>
        {appointments.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">{t("noAppointments")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {appointments.slice(0, 5).map((appt) => (
              <li key={appt.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 truncate">
                  <Clock className="size-3 shrink-0 text-stone-400" />
                  <span className="font-medium text-stone-700">
                    {new Date(appt.data_hora_inicio).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="truncate text-stone-600">
                    {appt.cliente_nome} — {appt.servico_nome}
                  </span>
                </div>
                <StatusBadge status={appt.status} />
              </li>
            ))}
            {appointments.length > 5 && (
              <li className="text-xs text-stone-400">
                +{appointments.length - 5} {t("more")}
              </li>
            )}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href="/dashboard/agenda"
          className="text-bellus-gold hover:text-bellus-gold/80 inline-flex items-center gap-1 text-sm font-medium"
        >
          {t("viewFullAgenda")} <ArrowRight className="size-3" />
        </Link>
      </CardFooter>
    </Card>
  );
}

// --- 1b. Today Forecast Card ---

export function TodayForecastCard({ forecast }: { forecast: TodayForecast }) {
  const t = useTranslations("kpi");
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-stone-600">{t("todayForecast")}</CardTitle>
        <TrendingUp className="text-bellus-gold size-4" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-stone-900">{fmt(forecast.total)}</p>
        <p className="text-xs text-stone-400">
          {forecast.appointmentCount} {t("appointments")}
        </p>
        <div className="mt-3 space-y-1.5">
          {forecast.completed > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-green-500" />
                <span className="text-stone-500">{t("statusCompleted")}</span>
              </span>
              <span className="font-medium text-green-700">{fmt(forecast.completed)}</span>
            </div>
          )}
          {forecast.confirmed > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-blue-500" />
                <span className="text-stone-500">{t("statusConfirmed")}</span>
              </span>
              <span className="font-medium text-blue-700">{fmt(forecast.confirmed)}</span>
            </div>
          )}
          {forecast.pending > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500" />
                <span className="text-stone-500">{t("statusPending")}</span>
              </span>
              <span className="font-medium text-amber-700">{fmt(forecast.pending)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// --- 2. Revenue KPI Card ---

export function RevenueKPICard({ revenue }: { revenue: RevenueData }) {
  const t = useTranslations("kpi");
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);

  const items = [
    { label: t("today"), value: revenue.today },
    { label: t("thisWeek"), value: revenue.week, prev: revenue.prevWeek },
    { label: t("thisMonth"), value: revenue.month, prev: revenue.prevMonth },
    { label: t("thisQuarter"), value: revenue.quarter },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-stone-600">{t("revenue")}</CardTitle>
        <DollarSign className="text-bellus-gold size-4" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-stone-900">{fmt(revenue.month)}</p>
        <div className="mt-3 space-y-1.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-stone-500">{item.label}</span>
              <span className="flex items-center gap-2 font-medium text-stone-700">
                {fmt(item.value)}
                {item.prev !== undefined && (
                  <TrendIndicator current={item.value} previous={item.prev} />
                )}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- 3. Client KPI Card ---

export function ClientKPICard({ data }: { data: ClientData }) {
  const t = useTranslations("kpi");
  const conversionRate =
    data.remindersSent > 0
      ? Math.round((data.remindersConverted / data.remindersSent) * 100)
      : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-stone-600">{t("clients")}</CardTitle>
        <Users className="text-bellus-gold size-4" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-stone-900">{data.totalActive}</p>
        <p className="text-xs text-stone-400">{t("activeClients")}</p>
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">{t("newThisMonth")}</span>
            <span className="flex items-center gap-2 font-medium text-stone-700">
              {data.newThisMonth}
              {data.prevMonthNew > 0 && (
                <TrendIndicator current={data.newThisMonth} previous={data.prevMonthNew} />
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">{t("returning")}</span>
            <span className="font-medium text-stone-700">{data.returningThisMonth}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">{t("reminderConversion")}</span>
            <span className="font-medium text-stone-700">
              {data.remindersSent > 0 ? `${conversionRate}%` : "—"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- 4. Top Services Card ---

export function TopServicesCard({ services }: { services: TopService[] }) {
  const t = useTranslations("kpi");
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);

  const maxCount = services.length > 0 ? services[0].count : 1;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-stone-600">{t("topServices")}</CardTitle>
        <Scissors className="text-bellus-gold size-4" />
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <p className="text-sm text-stone-400">{t("noData")}</p>
        ) : (
          <ul className="space-y-3">
            {services.map((svc) => (
              <li key={svc.servico_id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium text-stone-700">{svc.nome}</span>
                  <span className="shrink-0 text-stone-500">
                    {svc.count}x &middot; {fmt(svc.revenue)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-stone-100">
                  <div
                    className="bg-bellus-gold h-1.5 rounded-full transition-all"
                    style={{ width: `${(svc.count / maxCount) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// --- 5. Fiscal Summary Card ---

export function FiscalSummaryCard({ data }: { data: FiscalSummary }) {
  const t = useTranslations("kpi");
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);

  const isUrgent = data.daysUntilDeadline <= 15;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-stone-600">{t("fiscalSummary")}</CardTitle>
        <Receipt className="text-bellus-gold size-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">{t("ivaCollected")}</span>
            <span className="font-medium text-stone-700">{fmt(data.ivaRepercutido)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">{t("ivaDeductible")}</span>
            <span className="font-medium text-stone-700">-{fmt(data.ivaSoportado)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-stone-100 pt-1.5 text-sm">
            <span className="font-medium text-stone-600">{t("ivaBalance")}</span>
            <span className={`font-bold ${data.saldoIva >= 0 ? "text-red-600" : "text-green-600"}`}>
              {fmt(data.saldoIva)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">{t("irpfEstimated")}</span>
            <span className="font-medium text-stone-700">{fmt(data.irpfEstimado)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">{t("cuotaAutonomos")}</span>
            <span className="font-medium text-stone-700">{fmt(data.cuotaAutonomos)}</span>
          </div>
        </div>

        <div
          className={`mt-4 flex items-center gap-2 rounded-lg p-2.5 text-sm ${
            isUrgent ? "bg-red-50 text-red-700" : "bg-stone-50 text-stone-600"
          }`}
        >
          {isUrgent && <AlertTriangle className="size-4 shrink-0" />}
          <span>
            {t("nextDeadline")}: <strong>{data.nextDeadline}</strong>{" "}
            ({data.daysUntilDeadline} {t("days")})
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Link
          href="/dashboard/fiscal"
          className="text-bellus-gold hover:text-bellus-gold/80 inline-flex items-center gap-1 text-sm font-medium"
        >
          {t("viewFiscal")} <ArrowRight className="size-3" />
        </Link>
      </CardFooter>
    </Card>
  );
}
