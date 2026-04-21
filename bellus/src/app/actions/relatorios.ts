"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getUserSalaoId(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  return (usuario as { salao_id: string } | null)?.salao_id ?? null;
}

export interface DailyRevenue {
  date: string;
  total: number;
  count: number;
}

export interface DailyAppointments {
  date: string;
  count: number;
  completed: number;
  cancelled: number;
}

export interface MonthlyOverview {
  month: string;
  label: string;
  revenue: number;
  newClients: number;
  appointments: number;
}

export interface PaymentBreakdown {
  method: string;
  total: number;
  count: number;
}

export interface ProfessionalStats {
  name: string;
  revenue: number;
  appointments: number;
}

export interface ReportsData {
  dailyRevenue: DailyRevenue[];
  dailyAppointments: DailyAppointments[];
  monthlyOverview: MonthlyOverview[];
  paymentBreakdown: PaymentBreakdown[];
  professionalStats: ProfessionalStats[];
}

function toDateKey(isoStr: string): string {
  return isoStr.slice(0, 10);
}

function toMonthKey(isoStr: string): string {
  return isoStr.slice(0, 7);
}

export async function getReportsData(): Promise<ReportsData | null> {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return null;

  const now = new Date();

  // 30 days ago
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  // 6 months ago (start of that month)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sixMonthsAgoISO = sixMonthsAgo.toISOString();

  // Current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Date strings (YYYY-MM-DD) for data_servico queries
  const thirtyDaysAgoDate = thirtyDaysAgo.toISOString().split("T")[0];
  const sixMonthsAgoDate = sixMonthsAgo.toISOString().split("T")[0];

  // Fetch all data in parallel
  const [txRes, apptRes, clientsRes, monthTxRes, profRes] = await Promise.all([
    // Transactions last 30 days
    supabase
      .from("transacoes")
      .select("valor_final, forma_pagamento, data_servico, profissional_id")
      .eq("salao_id", salaoId)
      .gte("data_servico", thirtyDaysAgoDate),

    // Appointments last 30 days
    supabase
      .from("agendamentos")
      .select("data_hora_inicio, status")
      .eq("salao_id", salaoId)
      .gte("data_hora_inicio", thirtyDaysAgoISO),

    // Clients last 6 months
    supabase
      .from("clientes")
      .select("created_at")
      .eq("salao_id", salaoId)
      .gte("created_at", sixMonthsAgoISO),

    // Transactions last 6 months (for monthly revenue)
    supabase
      .from("transacoes")
      .select("valor_final, data_servico")
      .eq("salao_id", salaoId)
      .gte("data_servico", sixMonthsAgoDate),

    // Professionals (for names)
    supabase
      .from("profissionais")
      .select("id, nome")
      .eq("salao_id", salaoId)
      .eq("ativo", true),
  ]);

  type TxRow = { valor_final: number; forma_pagamento: string; data_servico: string; profissional_id: string | null };
  type ApptRow = { data_hora_inicio: string; status: string };
  type ClientRow = { created_at: string };
  type MonthTxRow = { valor_final: number; data_servico: string };
  type ProfRow = { id: string; nome: string };

  const transactions = (txRes.data as unknown as TxRow[]) || [];
  const appointments = (apptRes.data as unknown as ApptRow[]) || [];
  const clients = (clientsRes.data as unknown as ClientRow[]) || [];
  const monthTransactions = (monthTxRes.data as unknown as MonthTxRow[]) || [];
  const professionals = (profRes.data as unknown as ProfRow[]) || [];

  const profNameMap = Object.fromEntries(professionals.map((p) => [p.id, p.nome]));

  // --- Daily Revenue (last 30 days) ---
  const dailyRevenueMap: Record<string, { total: number; count: number }> = {};
  for (const tx of transactions) {
    const key = tx.data_servico; // YYYY-MM-DD date
    if (!dailyRevenueMap[key]) dailyRevenueMap[key] = { total: 0, count: 0 };
    dailyRevenueMap[key].total += tx.valor_final || 0;
    dailyRevenueMap[key].count++;
  }

  // Fill all 30 days (including zeros)
  const dailyRevenue: DailyRevenue[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d.toISOString());
    dailyRevenue.push({
      date: key,
      total: Math.round((dailyRevenueMap[key]?.total ?? 0) * 100) / 100,
      count: dailyRevenueMap[key]?.count ?? 0,
    });
  }

  // --- Daily Appointments (last 30 days) ---
  const dailyApptMap: Record<string, { count: number; completed: number; cancelled: number }> = {};
  for (const appt of appointments) {
    const key = toDateKey(appt.data_hora_inicio);
    if (!dailyApptMap[key]) dailyApptMap[key] = { count: 0, completed: 0, cancelled: 0 };
    dailyApptMap[key].count++;
    if (appt.status === "concluido") dailyApptMap[key].completed++;
    if (appt.status === "cancelado") dailyApptMap[key].cancelled++;
  }

  const dailyAppointments: DailyAppointments[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d.toISOString());
    dailyAppointments.push({
      date: key,
      count: dailyApptMap[key]?.count ?? 0,
      completed: dailyApptMap[key]?.completed ?? 0,
      cancelled: dailyApptMap[key]?.cancelled ?? 0,
    });
  }

  // --- Monthly Overview (last 6 months) ---
  const monthlyRevenueMap: Record<string, number> = {};
  for (const tx of monthTransactions) {
    const key = toMonthKey(tx.data_servico); // YYYY-MM from date
    monthlyRevenueMap[key] = (monthlyRevenueMap[key] ?? 0) + (tx.valor_final || 0);
  }

  const monthlyClientsMap: Record<string, number> = {};
  for (const cl of clients) {
    const key = toMonthKey(cl.created_at);
    monthlyClientsMap[key] = (monthlyClientsMap[key] ?? 0) + 1;
  }

  // Count monthly appointments from the 6-month range
  const { data: sixMonthAppts } = await supabase
    .from("agendamentos")
    .select("data_hora_inicio")
    .eq("salao_id", salaoId)
    .eq("status", "concluido")
    .gte("data_hora_inicio", sixMonthsAgoISO);

  const monthlyApptMap: Record<string, number> = {};
  for (const a of (sixMonthAppts as { data_hora_inicio: string }[]) || []) {
    const key = toMonthKey(a.data_hora_inicio);
    monthlyApptMap[key] = (monthlyApptMap[key] ?? 0) + 1;
  }

  const monthLabels = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const monthlyOverview: MonthlyOverview[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyOverview.push({
      month: key,
      label: `${monthLabels[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`,
      revenue: Math.round((monthlyRevenueMap[key] ?? 0) * 100) / 100,
      newClients: monthlyClientsMap[key] ?? 0,
      appointments: monthlyApptMap[key] ?? 0,
    });
  }

  // --- Payment Breakdown (this month) ---
  const monthStartDate = monthStart.split("T")[0]; // YYYY-MM-DD
  const paymentMap: Record<string, { total: number; count: number }> = {};
  for (const tx of transactions) {
    if (tx.data_servico >= monthStartDate) {
      const method = tx.forma_pagamento || "otro";
      if (!paymentMap[method]) paymentMap[method] = { total: 0, count: 0 };
      paymentMap[method].total += tx.valor_final || 0;
      paymentMap[method].count++;
    }
  }

  const paymentBreakdown: PaymentBreakdown[] = Object.entries(paymentMap)
    .map(([method, data]) => ({
      method,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total);

  // --- Professional Stats (this month) ---
  const profMap: Record<string, { revenue: number; appointments: number }> = {};
  for (const tx of transactions) {
    if (tx.data_servico >= monthStartDate && tx.profissional_id) {
      if (!profMap[tx.profissional_id]) profMap[tx.profissional_id] = { revenue: 0, appointments: 0 };
      profMap[tx.profissional_id].revenue += tx.valor_final || 0;
      profMap[tx.profissional_id].appointments++;
    }
  }

  const professionalStats: ProfessionalStats[] = Object.entries(profMap)
    .map(([id, data]) => ({
      name: profNameMap[id] || "—",
      revenue: Math.round(data.revenue * 100) / 100,
      appointments: data.appointments,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    dailyRevenue,
    dailyAppointments,
    monthlyOverview,
    paymentBreakdown,
    professionalStats,
  };
}
