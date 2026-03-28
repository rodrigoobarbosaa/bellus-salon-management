import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getReportsData } from "@/app/actions/relatorios";
import {
  RevenueChartLazy as RevenueChart,
  AppointmentsChartLazy as AppointmentsChart,
  MonthlyChartLazy as MonthlyChart,
  PaymentChartLazy as PaymentChart,
  ProfessionalChartLazy as ProfessionalChart,
} from "./report-charts-lazy";

export default async function RelatoriosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const t = await getTranslations("reports");
  const data = await getReportsData();

  if (!data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-stone-900">{t("title")}</h2>
        <p className="text-sm text-stone-400">{t("noData")}</p>
      </div>
    );
  }

  // Summary stats
  const totalRevenue30d = data.dailyRevenue.reduce((sum, d) => sum + d.total, 0);
  const totalAppt30d = data.dailyAppointments.reduce((sum, d) => sum + d.count, 0);
  const totalCompleted30d = data.dailyAppointments.reduce((sum, d) => sum + d.completed, 0);
  const avgDaily = totalRevenue30d / 30;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-stone-900">{t("title")}</h2>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-stone-500">{t("revenue30d")}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">
            {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(totalRevenue30d)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-stone-500">{t("avgDaily")}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">
            {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(avgDaily)}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-stone-500">{t("appointments30d")}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{totalAppt30d}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-stone-500">{t("completionRate")}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">
            {totalAppt30d > 0 ? Math.round((totalCompleted30d / totalAppt30d) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart data={data.dailyRevenue} />
        <AppointmentsChart data={data.dailyAppointments} />
        <MonthlyChart data={data.monthlyOverview} />
        <PaymentChart data={data.paymentBreakdown} />
      </div>

      {/* Professional stats */}
      <ProfessionalChart data={data.professionalStats} />
    </div>
  );
}
