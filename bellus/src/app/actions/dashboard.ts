"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getUserSalaoId(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  return usuario?.salao_id ?? null;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59).toISOString();
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return startOfDay(new Date(d.setDate(diff)));
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

function startOfQuarter(date: Date) {
  const q = Math.floor(date.getMonth() / 3) * 3;
  return new Date(date.getFullYear(), q, 1).toISOString();
}

function startOfPrevWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - 7);
  return startOfWeek(d);
}

function endOfPrevWeek(date: Date) {
  const d = new Date(startOfWeek(date));
  d.setMilliseconds(-1);
  return d.toISOString();
}

function startOfPrevMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString();
}

function endOfPrevMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59).toISOString();
}

export interface TodayAppointment {
  id: string;
  data_hora_inicio: string;
  status: string;
  cliente_nome: string;
  servico_nome: string;
  profissional_nome: string;
}

export interface RevenueData {
  today: number;
  week: number;
  month: number;
  quarter: number;
  prevWeek: number;
  prevMonth: number;
}

export interface ClientData {
  totalActive: number;
  newThisMonth: number;
  returningThisMonth: number;
  remindersSent: number;
  remindersConverted: number;
  prevMonthNew: number;
}

export interface TopService {
  servico_id: string;
  nome: string;
  count: number;
  revenue: number;
}

export interface FiscalSummary {
  ivaRepercutido: number;
  ivaSoportado: number;
  saldoIva: number;
  irpfEstimado: number;
  cuotaAutonomos: number;
  cuotaMensual: number;
  nextDeadline: string;
  daysUntilDeadline: number;
}

export interface TodayForecast {
  total: number;
  confirmed: number;
  pending: number;
  completed: number;
  appointmentCount: number;
}

export async function getDashboardData() {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return null;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const quarterStart = startOfQuarter(now);
  const prevWeekStart = startOfPrevWeek(now);
  const prevWeekEnd = endOfPrevWeek(now);
  const prevMonthStart = startOfPrevMonth(now);
  const prevMonthEnd = endOfPrevMonth(now);

  // --- Today's appointments (single query with JOINs) ---
  const { data: rawAppointments } = await supabase
    .from("agendamentos")
    .select(
      "id, data_hora_inicio, status, " +
      "cliente:clientes(nome), " +
      "servico:servicos(nome, preco_base), " +
      "profissional:profissionais(nome)"
    )
    .eq("salao_id", salaoId)
    .gte("data_hora_inicio", todayStart)
    .lte("data_hora_inicio", todayEnd)
    .neq("status", "cancelado")
    .order("data_hora_inicio", { ascending: true });

  type RawAppointment = {
    id: string;
    data_hora_inicio: string;
    status: string;
    cliente: { nome: string } | null;
    servico: { nome: string; preco_base: number } | null;
    profissional: { nome: string } | null;
  };

  const rawList = (rawAppointments as unknown as RawAppointment[]) || [];

  const todayAppointments: TodayAppointment[] = rawList.map((a) => ({
    id: a.id,
    data_hora_inicio: a.data_hora_inicio,
    status: a.status,
    cliente_nome: a.cliente?.nome ?? "—",
    servico_nome: a.servico?.nome ?? "—",
    profissional_nome: a.profissional?.nome ?? "—",
  }));

  // --- Today's forecast (predicted income) ---
  let forecastConfirmed = 0;
  let forecastPending = 0;
  let forecastCompleted = 0;
  for (const a of rawList) {
    const preco = a.servico?.preco_base ?? 0;
    if (a.status === "concluido") forecastCompleted += preco;
    else if (a.status === "confirmado") forecastConfirmed += preco;
    else if (a.status === "pendente") forecastPending += preco;
  }

  const todayForecast: TodayForecast = {
    total: Math.round((forecastConfirmed + forecastPending + forecastCompleted) * 100) / 100,
    confirmed: Math.round(forecastConfirmed * 100) / 100,
    pending: Math.round(forecastPending * 100) / 100,
    completed: Math.round(forecastCompleted * 100) / 100,
    appointmentCount: rawList.length,
  };

  // --- Revenue ---
  type Transacao = { valor_final: number; created_at: string };

  const { data: allTx } = await supabase
    .from("transacoes")
    .select("valor_final, created_at")
    .eq("salao_id", salaoId)
    .gte("created_at", prevMonthStart);

  const txList = (allTx as Transacao[]) || [];

  function sumRange(start: string, end: string) {
    return txList
      .filter((t) => t.created_at >= start && t.created_at <= end)
      .reduce((sum, t) => sum + (t.valor_final || 0), 0);
  }

  const revenue: RevenueData = {
    today: sumRange(todayStart, todayEnd),
    week: sumRange(weekStart, todayEnd),
    month: sumRange(monthStart, todayEnd),
    quarter: 0,
    prevWeek: sumRange(prevWeekStart, prevWeekEnd),
    prevMonth: sumRange(prevMonthStart, prevMonthEnd),
  };

  // Quarter needs separate query since prevMonthStart might not cover it
  const { data: quarterTx } = await supabase
    .from("transacoes")
    .select("valor_final")
    .eq("salao_id", salaoId)
    .gte("created_at", quarterStart);

  revenue.quarter = ((quarterTx as { valor_final: number }[]) || []).reduce(
    (sum, t) => sum + (t.valor_final || 0),
    0
  );

  // --- Clients ---
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: activeClients } = await supabase
    .from("clientes")
    .select("id, created_at")
    .eq("salao_id", salaoId);

  const allClients = (activeClients as { id: string; created_at: string }[]) || [];

  // Clients with appointments in last 90 days
  const { data: recentAppointments } = await supabase
    .from("agendamentos")
    .select("cliente_id")
    .eq("salao_id", salaoId)
    .eq("status", "concluido")
    .gte("data_hora_inicio", ninetyDaysAgo.toISOString());

  const activeClientIds = new Set(
    ((recentAppointments as { cliente_id: string }[]) || []).map((a) => a.cliente_id)
  );

  // Single query for all this-month completed appointments
  // (replaces two separate queries for monthAppointments + completedAppts)
  const [monthApptRes, reminderRes, serviceTxRes] = await Promise.all([
    supabase
      .from("agendamentos")
      .select("cliente_id, servico_id")
      .eq("salao_id", salaoId)
      .eq("status", "concluido")
      .gte("data_hora_inicio", monthStart),
    supabase
      .from("notificacoes_log")
      .select("id, status")
      .eq("salao_id", salaoId)
      .eq("tipo", "lembrete_retorno")
      .gte("created_at", monthStart),
    supabase
      .from("transacoes")
      .select("servico_id, valor_final")
      .eq("salao_id", salaoId)
      .gte("created_at", monthStart),
  ]);

  type MonthAppt = { cliente_id: string; servico_id: string };
  const monthAppts = (monthApptRes.data as unknown as MonthAppt[]) || [];

  const monthClientCounts: Record<string, number> = {};
  const serviceCounts: Record<string, number> = {};
  monthAppts.forEach((a) => {
    if (a.cliente_id) monthClientCounts[a.cliente_id] = (monthClientCounts[a.cliente_id] || 0) + 1;
    if (a.servico_id) serviceCounts[a.servico_id] = (serviceCounts[a.servico_id] || 0) + 1;
  });

  const newThisMonth = allClients.filter((c) => c.created_at >= monthStart).length;
  const returningThisMonth = Object.values(monthClientCounts).filter((c) => c > 1).length;

  const reminders = (reminderRes.data as { id: string; status: string }[]) || [];
  const remindersSent = reminders.filter((r) => r.status === "enviado").length;

  const prevMonthNew = allClients.filter(
    (c) => c.created_at >= prevMonthStart && c.created_at <= prevMonthEnd
  ).length;

  const clientData: ClientData = {
    totalActive: activeClientIds.size,
    newThisMonth,
    returningThisMonth,
    remindersSent,
    remindersConverted: 0,
    prevMonthNew,
  };

  // --- Top Services (data already fetched above) ---
  const serviceRevenue: Record<string, number> = {};
  ((serviceTxRes.data as { servico_id: string; valor_final: number }[]) || []).forEach((t) => {
    if (t.servico_id) {
      serviceRevenue[t.servico_id] = (serviceRevenue[t.servico_id] || 0) + (t.valor_final || 0);
    }
  });

  const topServiceIds = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);

  const { data: serviceNames } = topServiceIds.length
    ? await supabase.from("servicos").select("id, nome").in("id", topServiceIds)
    : { data: [] };

  const serviceNameMap: Record<string, string> = {};
  ((serviceNames as { id: string; nome: string }[]) || []).forEach(
    (s) => (serviceNameMap[s.id] = s.nome)
  );

  const topServices: TopService[] = topServiceIds.map((id) => ({
    servico_id: id,
    nome: serviceNameMap[id] || "—",
    count: serviceCounts[id] || 0,
    revenue: Math.round((serviceRevenue[id] || 0) * 100) / 100,
  }));

  // --- Fiscal Summary ---
  const { data: configFiscal } = await supabase
    .from("configuracoes_fiscais")
    .select("iva_pct, irpf_pct, cuota_autonomos_mensual")
    .eq("salao_id", salaoId)
    .single();

  const config = configFiscal as {
    iva_pct: number;
    irpf_pct: number;
    cuota_autonomos_mensual: number;
  } | null;

  const ivaPct = config?.iva_pct ?? 21;
  const irpfPct = config?.irpf_pct ?? 15;
  const cuotaMensual = config?.cuota_autonomos_mensual ?? 0;

  // IVA repercutido = revenue * (iva / (100 + iva))
  const ivaRepercutido = revenue.quarter * (ivaPct / (100 + ivaPct));

  // IVA soportado from despesas
  const { data: despesasQ } = await supabase
    .from("despesas")
    .select("valor")
    .eq("salao_id", salaoId)
    .gte("data", quarterStart.split("T")[0]);

  const totalDespesas = ((despesasQ as { valor: number }[]) || []).reduce(
    (sum, d) => sum + (d.valor || 0),
    0
  );
  const ivaSoportado = totalDespesas * (ivaPct / (100 + ivaPct));
  const saldoIva = ivaRepercutido - ivaSoportado;

  // IRPF = (revenue - expenses) * irpfPct / 100
  const revenueNet = revenue.quarter / (1 + ivaPct / 100);
  const expensesNet = totalDespesas / (1 + ivaPct / 100);
  const irpfEstimado = Math.max(0, (revenueNet - expensesNet) * (irpfPct / 100));

  // Cuota autonomos: months elapsed in quarter
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  const monthsElapsed = now.getMonth() - quarterMonth + 1;
  const cuotaAutonomos = cuotaMensual * monthsElapsed;

  // Next fiscal deadline
  const deadlines = [
    { month: 0, day: 30, label: "Q4" }, // Jan 30
    { month: 3, day: 20, label: "Q1" }, // Apr 20
    { month: 6, day: 20, label: "Q2" }, // Jul 20
    { month: 9, day: 20, label: "Q3" }, // Oct 20
  ];

  let nextDeadline = "";
  let daysUntilDeadline = 999;
  for (const dl of deadlines) {
    const dlDate = new Date(now.getFullYear(), dl.month, dl.day);
    if (dlDate < now) {
      dlDate.setFullYear(dlDate.getFullYear() + 1);
    }
    const diff = Math.ceil((dlDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < daysUntilDeadline) {
      daysUntilDeadline = diff;
      nextDeadline = dlDate.toISOString().split("T")[0];
    }
  }

  const fiscalSummary: FiscalSummary = {
    ivaRepercutido: Math.round(ivaRepercutido * 100) / 100,
    ivaSoportado: Math.round(ivaSoportado * 100) / 100,
    saldoIva: Math.round(saldoIva * 100) / 100,
    irpfEstimado: Math.round(irpfEstimado * 100) / 100,
    cuotaAutonomos: Math.round(cuotaAutonomos * 100) / 100,
    cuotaMensual,
    nextDeadline,
    daysUntilDeadline,
  };

  return {
    todayAppointments,
    todayForecast,
    revenue,
    clientData,
    topServices,
    fiscalSummary,
  };
}
