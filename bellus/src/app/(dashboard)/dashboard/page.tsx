import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardData } from "@/app/actions/dashboard";
import {
  TodayAgendaCard,
  RevenueKPICard,
  ClientKPICard,
  TopServicesCard,
  FiscalSummaryCard,
} from "./dashboard-widgets";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios" as string)
    .select("nome")
    .eq("id", user.id)
    .single();

  const userName =
    (usuario as { nome: string } | null)?.nome ??
    user.user_metadata?.nome ??
    user.email ??
    "Usuario";

  const t = await getTranslations("kpi");
  const dashboardData = await getDashboardData();

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "goodMorning" : hour < 18 ? "goodAfternoon" : "goodEvening";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-900">
          {t(greetingKey)}, {userName}!
        </h2>
        <p className="mt-1 text-sm text-stone-500 capitalize">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {dashboardData ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TodayAgendaCard appointments={dashboardData.todayAppointments} />
          <RevenueKPICard revenue={dashboardData.revenue} />
          <ClientKPICard data={dashboardData.clientData} />
          <TopServicesCard services={dashboardData.topServices} />
          <FiscalSummaryCard data={dashboardData.fiscalSummary} />
        </div>
      ) : (
        <p className="text-sm text-stone-400">{t("noData")}</p>
      )}
    </div>
  );
}
