import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ClientesList } from "./clientes-list";

export default async function ClientesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  if (!usuario) redirect("/login");

  const salaoId = (usuario as { salao_id: string }).salao_id;

  // Fetch all clients, salon info, and completed visit counts in parallel
  const [{ data: clientes }, { data: salao }, { data: notifStats }, { data: completedAppts }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nome, telefone, email, idioma_preferido, opt_out_notificacoes, proximo_retorno, created_at")
      .eq("salao_id", salaoId)
      .order("nome"),
    supabase
      .from("saloes")
      .select("nome, endereco")
      .eq("id", salaoId)
      .single(),
    supabase
      .from("notificacoes_log")
      .select("id, tipo, status, cliente_id")
      .eq("salao_id", salaoId)
      .eq("tipo", "lembrete_retorno"),
    supabase
      .from("agendamentos")
      .select("cliente_id")
      .eq("salao_id", salaoId)
      .eq("status", "concluido"),
  ]);

  const clientesList = (clientes ?? []) as Array<{
    id: string;
    nome: string;
    telefone: string;
    email: string | null;
    idioma_preferido: string;
    opt_out_notificacoes: boolean;
    proximo_retorno: string | null;
    created_at: string;
  }>;

  // Count completed visits per client
  const visitCounts: Record<string, number> = {};
  for (const apt of (completedAppts ?? []) as Array<{ cliente_id: string }>) {
    visitCounts[apt.cliente_id] = (visitCounts[apt.cliente_id] ?? 0) + 1;
  }

  const today = new Date().toISOString().slice(0, 10);
  const overdueClientIds = clientesList
    .filter((c) => c.proximo_retorno && c.proximo_retorno <= today)
    .map((c) => c.id);
  const pendingReturn = overdueClientIds.length;

  // Fetch last completed appointment for each overdue client (for return reminder message)
  let lastServices: Record<string, { servico_nome: string; data_hora_inicio: string }> = {};
  if (overdueClientIds.length > 0) {
    const { data: lastAppointments } = await supabase
      .from("agendamentos")
      .select("cliente_id, data_hora_inicio, servico_id")
      .in("cliente_id", overdueClientIds)
      .eq("status", "concluido")
      .order("data_hora_inicio", { ascending: false });

    // Collect unique servico_ids and build per-client map
    const perClient: Record<string, { servico_id: string; data_hora_inicio: string }> = {};
    const servicoIds = new Set<string>();
    for (const apt of (lastAppointments ?? []) as Array<{
      cliente_id: string;
      data_hora_inicio: string;
      servico_id: string;
    }>) {
      if (!perClient[apt.cliente_id]) {
        perClient[apt.cliente_id] = { servico_id: apt.servico_id, data_hora_inicio: apt.data_hora_inicio };
        servicoIds.add(apt.servico_id);
      }
    }

    // Fetch service names
    if (servicoIds.size > 0) {
      const { data: servicos } = await supabase
        .from("servicos")
        .select("id, nome")
        .in("id", Array.from(servicoIds));

      const servicoNomes: Record<string, string> = {};
      for (const s of (servicos ?? []) as Array<{ id: string; nome: string }>) {
        servicoNomes[s.id] = s.nome;
      }

      for (const [clienteId, info] of Object.entries(perClient)) {
        lastServices[clienteId] = {
          servico_nome: servicoNomes[info.servico_id] ?? "",
          data_hora_inicio: info.data_hora_inicio,
        };
      }
    }
  }

  const returnNotifs = (notifStats ?? []) as Array<{
    id: string;
    tipo: string;
    status: string;
    cliente_id: string;
  }>;

  const salonName = salao?.nome ?? "";
  const salonEndereco = salao?.endereco ?? "";

  return (
    <ClientesList
      clientes={clientesList}
      totalClientes={clientesList.length}
      pendingReturn={pendingReturn}
      returnNotifs={returnNotifs}
      salonName={salonName}
      salonEndereco={salonEndereco}
      lastServices={lastServices}
      visitCounts={visitCounts}
    />
  );
}
