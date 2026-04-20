/**
 * Tools que o Claude pode usar durante conversas com clientes.
 * Cada tool consulta o Supabase e retorna dados estruturados.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { madridToISO } from "@/lib/timezone";

// --- Tool Definitions (para enviar ao Claude) ---

export const CHATBOT_TOOLS = [
  {
    name: "listar_servicos",
    description: "Lista todos os serviços disponíveis no salão com preços e duração.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "listar_profissionais",
    description: "Lista os profissionais disponíveis, opcionalmente filtrados por serviço.",
    input_schema: {
      type: "object" as const,
      properties: {
        servico_id: {
          type: "string",
          description: "ID do serviço para filtrar profissionais que o realizam.",
        },
      },
      required: [],
    },
  },
  {
    name: "verificar_disponibilidade",
    description: "Verifica horários disponíveis para um serviço numa data específica. Retorna lista de horários livres.",
    input_schema: {
      type: "object" as const,
      properties: {
        data: {
          type: "string",
          description: "Data no formato YYYY-MM-DD.",
        },
        servico_id: {
          type: "string",
          description: "ID do serviço desejado.",
        },
        profissional_id: {
          type: "string",
          description: "ID do profissional (opcional — se omitido, verifica todos).",
        },
      },
      required: ["data", "servico_id"],
    },
  },
  {
    name: "criar_agendamento",
    description: "Cria uma reserva/agendamento para o cliente. Usar APENAS depois de confirmar serviço, data, hora e profissional com o cliente.",
    input_schema: {
      type: "object" as const,
      properties: {
        servico_id: { type: "string", description: "ID do serviço." },
        profissional_id: { type: "string", description: "ID do profissional." },
        data: { type: "string", description: "Data YYYY-MM-DD." },
        hora: { type: "string", description: "Hora HH:MM." },
        nome_cliente: { type: "string", description: "Nome do cliente." },
        telefone_cliente: { type: "string", description: "Telefone do cliente." },
      },
      required: ["servico_id", "profissional_id", "data", "hora", "nome_cliente", "telefone_cliente"],
    },
  },
  {
    name: "cancelar_agendamento",
    description: "Cancela um agendamento existente do cliente.",
    input_schema: {
      type: "object" as const,
      properties: {
        agendamento_id: { type: "string", description: "ID do agendamento a cancelar." },
      },
      required: ["agendamento_id"],
    },
  },
  {
    name: "consultar_agendamentos_cliente",
    description: "Consulta os próximos agendamentos de um cliente (pelo telefone).",
    input_schema: {
      type: "object" as const,
      properties: {
        telefone: { type: "string", description: "Telefone do cliente." },
      },
      required: ["telefone"],
    },
  },
  {
    name: "escalar_para_humano",
    description: "Transfere a conversa para atendimento humano quando não consegue resolver. Usar para: preços especiais, reclamações, perguntas fora do escopo.",
    input_schema: {
      type: "object" as const,
      properties: {
        motivo: { type: "string", description: "Motivo da escalação." },
      },
      required: ["motivo"],
    },
  },
];

// --- Tool Execution ---

export async function executeTool(
  supabase: SupabaseClient,
  salaoId: string,
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case "listar_servicos":
      return listarServicos(supabase, salaoId);
    case "listar_profissionais":
      return listarProfissionais(supabase, salaoId, input.servico_id as string | undefined);
    case "verificar_disponibilidade":
      return verificarDisponibilidade(
        supabase, salaoId,
        input.data as string,
        input.servico_id as string,
        input.profissional_id as string | undefined
      );
    case "criar_agendamento":
      return criarAgendamento(supabase, salaoId, input);
    case "cancelar_agendamento":
      return cancelarAgendamento(supabase, salaoId, input.agendamento_id as string);
    case "consultar_agendamentos_cliente":
      return consultarAgendamentosCliente(supabase, salaoId, input.telefone as string);
    case "escalar_para_humano":
      return JSON.stringify({ escalado: true, motivo: input.motivo });
    default:
      return JSON.stringify({ error: `Tool desconhecida: ${toolName}` });
  }
}

// --- Tool Implementations ---

async function listarServicos(supabase: SupabaseClient, salaoId: string): Promise<string> {
  const { data } = await supabase
    .from("servicos")
    .select("id, nome, preco_base, duracao_minutos, categoria")
    .eq("salao_id", salaoId)
    .eq("ativo", true)
    .order("categoria")
    .order("nome");

  const servicos = (data ?? []) as Array<{
    id: string; nome: string; preco_base: number;
    duracao_minutos: number; categoria: string;
  }>;

  return JSON.stringify(servicos.map(s => ({
    id: s.id,
    nome: s.nome,
    preco: `${s.preco_base}€`,
    duracao: `${s.duracao_minutos} min`,
    categoria: s.categoria,
  })));
}

async function listarProfissionais(
  supabase: SupabaseClient,
  salaoId: string,
  servicoId?: string
): Promise<string> {
  if (servicoId) {
    const { data } = await supabase
      .from("servicos_profissionais")
      .select("profissional_id, profissionais(id, nome)")
      .eq("servico_id", servicoId);

    const sps = (data ?? []) as Array<{
      profissional_id: string;
      profissionais: { id: string; nome: string } | null;
    }>;

    return JSON.stringify(sps
      .filter(sp => sp.profissionais)
      .map(sp => ({ id: sp.profissionais!.id, nome: sp.profissionais!.nome }))
    );
  }

  const { data } = await supabase
    .from("profissionais")
    .select("id, nome")
    .eq("salao_id", salaoId)
    .eq("ativo", true);

  return JSON.stringify((data ?? []) as Array<{ id: string; nome: string }>);
}

async function verificarDisponibilidade(
  supabase: SupabaseClient,
  salaoId: string,
  data: string,
  servicoId: string,
  profissionalId?: string
): Promise<string> {
  // Get service duration
  const { data: servico } = await supabase
    .from("servicos")
    .select("duracao_minutos, nome")
    .eq("id", servicoId)
    .single();

  if (!servico) return JSON.stringify({ error: "Serviço não encontrado" });

  const { duracao_minutos } = servico as { duracao_minutos: number; nome: string };

  // Get salon business hours
  const { data: salao } = await supabase
    .from("saloes")
    .select("horario_funcionamento")
    .eq("id", salaoId)
    .single();

  const horarios = (salao as { horario_funcionamento: Record<string, unknown> | null })?.horario_funcionamento;

  // Get day of week (0=domingo, 1=segunda, ...)
  const dayOfWeek = new Date(`${data}T12:00:00`).getDay();
  const dayNames = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const dayKey = dayNames[dayOfWeek];

  const dayHours = horarios?.[dayKey] as { abertura?: string; fecho?: string; fechado?: boolean } | undefined;

  if (!dayHours || dayHours.fechado) {
    return JSON.stringify({ disponivel: false, motivo: "Salão fechado neste dia" });
  }

  const openTime = dayHours.abertura ?? "09:00";
  const closeTime = dayHours.fecho ?? "20:00";

  // Get professionals to check
  let profIds: string[] = [];
  if (profissionalId) {
    profIds = [profissionalId];
  } else {
    const { data: sps } = await supabase
      .from("servicos_profissionais")
      .select("profissional_id")
      .eq("servico_id", servicoId);
    profIds = ((sps ?? []) as Array<{ profissional_id: string }>).map(sp => sp.profissional_id);

    if (profIds.length === 0) {
      const { data: allProfs } = await supabase
        .from("profissionais")
        .select("id")
        .eq("salao_id", salaoId)
        .eq("ativo", true);
      profIds = ((allProfs ?? []) as Array<{ id: string }>).map(p => p.id);
    }
  }

  // Get professional names
  const { data: profNames } = await supabase
    .from("profissionais")
    .select("id, nome")
    .in("id", profIds);

  const nameMap = new Map(
    ((profNames ?? []) as Array<{ id: string; nome: string }>).map(p => [p.id, p.nome])
  );

  // Check availability per professional
  const dayStart = madridToISO(`${data}T00:00`);
  const dayEnd = madridToISO(`${data}T23:59`);

  const slots: Array<{ hora: string; profissional_id: string; profissional: string }> = [];

  for (const pid of profIds) {
    // Get existing appointments
    const { data: agendamentos } = await supabase
      .from("agendamentos")
      .select("data_hora_inicio, data_hora_fim")
      .eq("profissional_id", pid)
      .neq("status", "cancelado")
      .gte("data_hora_inicio", dayStart)
      .lte("data_hora_inicio", dayEnd);

    const { data: bloqueios } = await supabase
      .from("bloqueios")
      .select("data_hora_inicio, data_hora_fim")
      .eq("profissional_id", pid)
      .lte("data_hora_inicio", dayEnd)
      .gte("data_hora_fim", dayStart);

    const busyRanges = [
      ...((agendamentos ?? []) as Array<{ data_hora_inicio: string; data_hora_fim: string }>),
      ...((bloqueios ?? []) as Array<{ data_hora_inicio: string; data_hora_fim: string }>),
    ];

    // Generate 30-min slots within business hours
    const [openH, openM] = openTime.split(":").map(Number);
    const [closeH, closeM] = closeTime.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    for (let m = openMinutes; m + duracao_minutos <= closeMinutes; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      const slotStart = new Date(madridToISO(`${data}T${hh}:${mm}`));
      const slotEnd = new Date(slotStart.getTime() + duracao_minutos * 60 * 1000);

      // Skip past slots
      if (slotStart < new Date()) continue;

      const hasConflict = busyRanges.some(range => {
        const rangeStart = new Date(range.data_hora_inicio);
        const rangeEnd = new Date(range.data_hora_fim);
        return slotStart < rangeEnd && slotEnd > rangeStart;
      });

      if (!hasConflict) {
        slots.push({
          hora: `${hh}:${mm}`,
          profissional_id: pid,
          profissional: nameMap.get(pid) ?? "Profissional",
        });
      }
    }
  }

  return JSON.stringify({
    data,
    servico: (servico as { nome: string }).nome,
    slots_disponiveis: slots,
  });
}

async function criarAgendamento(
  supabase: SupabaseClient,
  salaoId: string,
  input: Record<string, unknown>
): Promise<string> {
  const servicoId = input.servico_id as string;
  const profissionalId = input.profissional_id as string;
  const data = input.data as string;
  const hora = input.hora as string;
  const nomeCliente = input.nome_cliente as string;
  const telefoneCliente = input.telefone_cliente as string;

  // Get service duration
  const { data: servico } = await supabase
    .from("servicos")
    .select("duracao_minutos, nome")
    .eq("id", servicoId)
    .single();

  if (!servico) return JSON.stringify({ success: false, error: "Serviço não encontrado" });

  const { duracao_minutos, nome: servicoNome } = servico as { duracao_minutos: number; nome: string };

  const inicio = new Date(madridToISO(`${data}T${hora}`));
  const fim = new Date(inicio.getTime() + duracao_minutos * 60 * 1000);

  // Verify no conflict
  const { data: conflitos } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("profissional_id", profissionalId)
    .neq("status", "cancelado")
    .lt("data_hora_inicio", fim.toISOString())
    .gt("data_hora_fim", inicio.toISOString());

  if (conflitos && (conflitos as Array<{ id: string }>).length > 0) {
    return JSON.stringify({ success: false, error: "Horário não disponível" });
  }

  // Find or create client
  const { data: existingClient } = await supabase
    .from("clientes")
    .select("id")
    .eq("salao_id", salaoId)
    .eq("telefone", telefoneCliente)
    .single();

  let clienteId: string;
  if (existingClient) {
    clienteId = (existingClient as { id: string }).id;
  } else {
    const { data: newClient } = await supabase
      .from("clientes")
      .insert({
        salao_id: salaoId,
        nome: nomeCliente,
        telefone: telefoneCliente,
      })
      .select("id")
      .single();

    if (!newClient) return JSON.stringify({ success: false, error: "Erro ao criar cliente" });
    clienteId = (newClient as { id: string }).id;
  }

  // Get professional name
  const { data: prof } = await supabase
    .from("profissionais")
    .select("nome")
    .eq("id", profissionalId)
    .single();

  const profNome = (prof as { nome: string } | null)?.nome ?? "";

  // Create appointment
  const { data: agendamento, error } = await supabase
    .from("agendamentos")
    .insert({
      salao_id: salaoId,
      cliente_id: clienteId,
      profissional_id: profissionalId,
      servico_id: servicoId,
      data_hora_inicio: inicio.toISOString(),
      data_hora_fim: fim.toISOString(),
      status: "pendente",
    })
    .select("id")
    .single();

  if (error) return JSON.stringify({ success: false, error: error.message });

  return JSON.stringify({
    success: true,
    agendamento_id: (agendamento as { id: string }).id,
    servico: servicoNome,
    profissional: profNome,
    data,
    hora,
    duracao: `${duracao_minutos} min`,
  });
}

async function cancelarAgendamento(
  supabase: SupabaseClient,
  salaoId: string,
  agendamentoId: string
): Promise<string> {
  const { error } = await supabase
    .from("agendamentos")
    .update({ status: "cancelado" })
    .eq("id", agendamentoId)
    .eq("salao_id", salaoId);

  if (error) return JSON.stringify({ success: false, error: error.message });
  return JSON.stringify({ success: true, cancelado: agendamentoId });
}

async function consultarAgendamentosCliente(
  supabase: SupabaseClient,
  salaoId: string,
  telefone: string
): Promise<string> {
  // Find client
  const variants = [telefone, `+${telefone}`, telefone.replace(/^\+/, "")];
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("salao_id", salaoId)
    .in("telefone", variants)
    .limit(1)
    .single();

  if (!cliente) return JSON.stringify({ agendamentos: [], mensagem: "Cliente não encontrado" });

  const clienteId = (cliente as { id: string }).id;

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("id, data_hora_inicio, status, servicos(nome), profissionais(nome)")
    .eq("cliente_id", clienteId)
    .eq("salao_id", salaoId)
    .in("status", ["pendente", "confirmado"])
    .gte("data_hora_inicio", new Date().toISOString())
    .order("data_hora_inicio", { ascending: true })
    .limit(5);

  const items = ((agendamentos ?? []) as Array<{
    id: string; data_hora_inicio: string; status: string;
    servicos: { nome: string } | null; profissionais: { nome: string } | null;
  }>).map(a => ({
    id: a.id,
    data_hora: a.data_hora_inicio,
    status: a.status,
    servico: a.servicos?.nome ?? "—",
    profissional: a.profissionais?.nome ?? "—",
  }));

  return JSON.stringify({ agendamentos: items });
}
