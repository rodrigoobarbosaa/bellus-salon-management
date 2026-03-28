"use client";

import dynamic from "next/dynamic";
import type {
  DailyRevenue,
  DailyAppointments,
  MonthlyOverview,
  PaymentBreakdown,
  ProfessionalStats,
} from "@/app/actions/relatorios";

const ChartLoading = () => (
  <div className="h-[320px] animate-pulse rounded-xl bg-stone-100" />
);

export const RevenueChartLazy = dynamic(
  () => import("./report-charts").then((m) => {
    const C = m.RevenueChart;
    return { default: C };
  }),
  { ssr: false, loading: ChartLoading }
) as React.ComponentType<{ data: DailyRevenue[] }>;

export const AppointmentsChartLazy = dynamic(
  () => import("./report-charts").then((m) => {
    const C = m.AppointmentsChart;
    return { default: C };
  }),
  { ssr: false, loading: ChartLoading }
) as React.ComponentType<{ data: DailyAppointments[] }>;

export const MonthlyChartLazy = dynamic(
  () => import("./report-charts").then((m) => {
    const C = m.MonthlyChart;
    return { default: C };
  }),
  { ssr: false, loading: ChartLoading }
) as React.ComponentType<{ data: MonthlyOverview[] }>;

export const PaymentChartLazy = dynamic(
  () => import("./report-charts").then((m) => {
    const C = m.PaymentChart;
    return { default: C };
  }),
  { ssr: false, loading: ChartLoading }
) as React.ComponentType<{ data: PaymentBreakdown[] }>;

export const ProfessionalChartLazy = dynamic(
  () => import("./report-charts").then((m) => {
    const C = m.ProfessionalChart;
    return { default: C };
  }),
  { ssr: false, loading: ChartLoading }
) as React.ComponentType<{ data: ProfessionalStats[] }>;
