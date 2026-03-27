"use client";

import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type {
  DailyRevenue,
  DailyAppointments,
  MonthlyOverview,
  PaymentBreakdown,
  ProfessionalStats,
} from "@/app/actions/relatorios";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDay(dateStr: unknown) {
  const d = new Date(String(dateStr) + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

const COLORS = ["#C9A96E", "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];
const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  bizum: "Bizum",
  transferencia: "Transfer.",
};

// --- Revenue Trend ---
export function RevenueChart({ data }: { data: DailyRevenue[] }) {
  const t = useTranslations("reports");

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-stone-900">{t("revenueTrend")}</h3>
        <p className="text-xs text-stone-500">{t("last30Days")}</p>
      </div>
      {data.every((d) => d.total === 0) ? (
        <p className="py-10 text-center text-sm text-stone-400">{t("noData")}</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              tick={{ fontSize: 11, fill: "#78716c" }}
              interval={6}
            />
            <YAxis
              tickFormatter={(v) => `€${v}`}
              tick={{ fontSize: 11, fill: "#78716c" }}
              width={50}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), t("revenue")]}
              labelFormatter={formatDay}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#C9A96E"
              strokeWidth={2}
              fill="url(#gradRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// --- Appointments Trend ---
export function AppointmentsChart({ data }: { data: DailyAppointments[] }) {
  const t = useTranslations("reports");

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-stone-900">{t("appointmentsTrend")}</h3>
        <p className="text-xs text-stone-500">{t("last30Days")}</p>
      </div>
      {data.every((d) => d.count === 0) ? (
        <p className="py-10 text-center text-sm text-stone-400">{t("noData")}</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDay}
              tick={{ fontSize: 11, fill: "#78716c" }}
              interval={6}
            />
            <YAxis tick={{ fontSize: 11, fill: "#78716c" }} width={30} allowDecimals={false} />
            <Tooltip
              formatter={(value, name) => [
                Number(value),
                name === "completed" ? t("completed") : name === "cancelled" ? t("cancelled") : t("total"),
              ]}
              labelFormatter={formatDay}
            />
            <Bar dataKey="completed" stackId="a" fill="#C9A96E" radius={[0, 0, 0, 0]} />
            <Bar dataKey="cancelled" stackId="a" fill="#d6d3d1" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// --- Monthly Overview ---
export function MonthlyChart({ data }: { data: MonthlyOverview[] }) {
  const t = useTranslations("reports");

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-stone-900">{t("monthlyOverview")}</h3>
        <p className="text-xs text-stone-500">{t("last6Months")}</p>
      </div>
      {data.every((d) => d.revenue === 0 && d.appointments === 0) ? (
        <p className="py-10 text-center text-sm text-stone-400">{t("noData")}</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#78716c" }} />
            <YAxis
              yAxisId="revenue"
              tickFormatter={(v) => `€${v}`}
              tick={{ fontSize: 11, fill: "#78716c" }}
              width={50}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 11, fill: "#78716c" }}
              width={30}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "revenue") return [formatCurrency(Number(value)), t("revenue")];
                if (name === "newClients") return [Number(value), t("newClients")];
                return [Number(value), t("appointments")];
              }}
            />
            <Legend
              formatter={(value: string) => {
                if (value === "revenue") return t("revenue");
                if (value === "newClients") return t("newClients");
                return t("appointments");
              }}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar yAxisId="revenue" dataKey="revenue" fill="#C9A96E" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="count" dataKey="appointments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="count" dataKey="newClients" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// --- Payment Breakdown ---
export function PaymentChart({ data }: { data: PaymentBreakdown[] }) {
  const t = useTranslations("reports");

  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-stone-900">{t("paymentMethods")}</h3>
        <p className="text-xs text-stone-500">{t("thisMonth")}</p>
      </div>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-400">{t("noData")}</p>
      ) : (
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="method"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label) => PAYMENT_LABELS[String(label)] ?? String(label)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {data.map((d, i) => (
              <div key={d.method} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-stone-600">
                    {PAYMENT_LABELS[d.method] ?? d.method}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-stone-900">{formatCurrency(d.total)}</span>
                  <span className="ml-1 text-xs text-stone-400">
                    ({total > 0 ? Math.round((d.total / total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Professional Stats ---
export function ProfessionalChart({ data }: { data: ProfessionalStats[] }) {
  const t = useTranslations("reports");

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-stone-900">{t("byProfessional")}</h3>
        <p className="text-xs text-stone-500">{t("thisMonth")}</p>
      </div>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-400">{t("noData")}</p>
      ) : (
        <div className="space-y-3">
          {data.map((p, i) => {
            const maxRevenue = data[0]?.revenue || 1;
            const pct = Math.round((p.revenue / maxRevenue) * 100);
            return (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-stone-700">{p.name}</span>
                  <span className="text-stone-500">
                    {formatCurrency(p.revenue)} · {p.appointments} {t("appointments")}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-stone-100">
                  <div
                    className="h-2 rounded-full bg-bellus-gold"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
