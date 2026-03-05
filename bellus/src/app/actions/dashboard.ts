"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: SupabaseClient): SupabaseClient<any> {
  return supabase as SupabaseClient<Record<string, unknown>>;
}

async function getUserSalaoId(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await db(supabase)
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  return (usuario as { salao_id: string } | null)?.salao_id ?? null;
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

  // --- Today's appointments ---
  const { data: rawAppointments } = await db(supabase)
    .from("agendamentos")
    .select("id, data_hora_inicio, status, cliente_id, servico_id, profissional_id")
    .eq("salao_id", salaoId)
    .gte("data_hora_inicio", todayStart)
    .lte("data_hora_inicio", todayEnd)
    .neq("status", "cancelado")
    .order("data_hora_inicio", { ascending: true });

  type RawAppointment = {
    id: string;
    data_hora_inicio: string;
    status: string;
    cliente_id: string | null;
    servico_id: string | null;
    profissional_id: string | null;
  };

  const appointments = (rawAppointments as RawAppointment[]) || [];

  // Fetch related names
  const clienteIds = [...new Set(appointments.map((a) => a.cliente_id).filter(Boolean))] as string[];
  const servicoIds = [...new Set(appointments.map((a) => a.servico_id).filter(Boolean))] as string[];
  const profIds = [...new Set(appointments.map((a) => a.profissional_id).filter(Boolean))] as string[];

  const [clientesRes, servicosRes, profsRes] = await Promise.all([
    clienteIds.length
      ? db(supabase).from("clientes").select("id, nome").in("id", clienteIds)
      : { data: [] },
    servicoIds.length
      ? db(supabase).from("servicos").select("id, nome").in("id", servicoIds)
      : { data: [] },
    profIds.length
      ? db(supabase).from("profissionais").select("id, nome").in("id", profIds)
      : { data: [] },
  ]);

  type NameMap = Record<string, string>;
  const clienteMap: NameMap = {};
  ((clientesRes.data as { id: string; nome: string }[]) || []).forEach(
    (c) => (clienteMap[c.id] = c.nome)
  );
  const servicoMap: NameMap = {};
  ((servicosRes.data as { id: string; nome: string }[]) || []).forEach(
    (s) => (servicoMap[s.id] = s.nome)
  );
  const profMap: NameMap = {};
  ((profsRes.data as { id: string; nome: string }[]) || []).forEach(
    (p) => (profMap[p.id] = p.nome)
  );

  const todayAppointments: TodayAppointment[] = appointments.map((a) => ({
    id: a.id,
    data_hora_inicio: a.data_hora_inicio,
    status: a.status,
    cliente_nome: a.cliente_id ? clienteMap[a.cliente_id] || "—" : "—",
    servico_nome: a.servico_id ? servicoMap[a.servico_id] || "—" : "—",
    profissional_nome: a.profissional_id ? profMap[a.profissional_id] || "—" : "—",
  }));

  // --- Revenue ---
  type Transacao = { valor_final: number; created_at: string };

  const { data: allTx } = await db(supabase)
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
  const { data: quarterTx } = await db(supabase)
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

  const { data: activeClients } = await db(supabase)
    .from("clientes")
    .select("id, created_at")
    .eq("salao_id", salaoId);

  const allClients = (activeClients as { id: string; created_at: string }[]) || [];

  // Clients with appointments in last 90 days
  const { data: recentAppointments } = await db(supabase)
    .from("agendamentos")
    .select("cliente_id")
    .eq("salao_id", salaoId)
    .eq("status", "concluido")
    .gte("data_hora_inicio", ninetyDaysAgo.toISOString());

  const activeClientIds = new Set(
    ((recentAppointments as { cliente_id: string }[]) || []).map((a) => a.cliente_id)
  );

  // Clients with >1 completed appointment this month
  const { data: monthAppointments } = await db(supabase)
    .from("agendamentos")
    .select("cliente_id")
    .eq("salao_id", salaoId)
    .eq("status", "concluido")
    .gte("data_hora_inicio", monthStart);

  const monthClientCounts: Record<string, number> = {};
  ((monthAppointments as { cliente_id: string }[]) || []).forEach((a) => {
    monthClientCounts[a.cliente_id] = (monthClientCounts[a.cliente_id] || 0) + 1;
  });

  const newThisMonth = allClients.filter((c) => c.created_at >= monthStart).length;
  const returningThisMonth = Object.values(monthClientCounts).filter((c) => c > 1).length;

  // Reminder conversion
  const { data: reminderLogs } = await db(supabase)
    .from("notificacoes_log")
    .select("id, tipo, status")
    .eq("salao_id", salaoId)
    .eq("tipo", "lembrete_retorno")
    .gte("created_at", monthStart);

  const reminders = (reminderLogs as { id: string; tipo: string; status: string }[]) || [];
  const remindersSent = reminders.filter((r) => r.status === "enviado").length;

  // Prev month new clients
  const prevMonthNew = allClients.filter(
    (c) => c.created_at >= prevMonthStart && c.created_at <= prevMonthEnd
  ).length;

  const clientData: ClientData = {
    totalActive: activeClientIds.size,
    newThisMonth,
    returningThisMonth,
    remindersSent,
    remindersConverted: 0, // Would need tracking of conversions
    prevMonthNew,
  };

  // --- Top Services ---
  const { data: completedAppts } = await db(supabase)
    .from("agendamentos")
    .select("servico_id")
    .eq("salao_id", salaoId)
    .eq("status", "concluido")
    .gte("data_hora_inicio", monthStart);

  const serviceCounts: Record<string, number> = {};
  ((completedAppts as { servico_id: string }[]) || []).forEach((a) => {
    if (a.servico_id) {
      serviceCounts[a.servico_id] = (serviceCounts[a.servico_id] || 0) + 1;
    }
  });

  // Get revenue per service
  const { data: serviceTx } = await db(supabase)
    .from("transacoes")
    .select("servico_id, valor_final")
    .eq("salao_id", salaoId)
    .gte("created_at", monthStart);

  const serviceRevenue: Record<string, number> = {};
  ((serviceTx as { servico_id: string; valor_final: number }[]) || []).forEach((t) => {
    if (t.servico_id) {
      serviceRevenue[t.servico_id] = (serviceRevenue[t.servico_id] || 0) + (t.valor_final || 0);
    }
  });

  const topServiceIds = Object.entries(serviceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);

  const { data: serviceNames } = topServiceIds.length
    ? await db(supabase).from("servicos").select("id, nome").in("id", topServiceIds)
    : { data: [] };

  const serviceNameMap: NameMap = {};
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
  const { data: configFiscal } = await db(supabase)
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
  const { data: despesasQ } = await db(supabase)
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
    revenue,
    clientData,
    topServices,
    fiscalSummary,
  };
}
