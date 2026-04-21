"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { madridToISO } from "@/lib/timezone";
import { sendBookingConfirmation } from "@/lib/notifications/send-notification";
import { generateOptOutToken } from "@/lib/opt-out-token";

async function getUserSalaoId(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, salaoId: null };

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    salaoId: (usuario as { salao_id: string } | null)?.salao_id ?? null,
  };
}

export async function createAgendamento(formData: FormData) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado o salón no encontrado." };
  }

  const profissional_id = formData.get("profissional_id") as string;
  const servico_id = formData.get("servico_id") as string;
  const data_hora_inicio = formData.get("data_hora_inicio") as string;
  const notas = (formData.get("notas") as string) || null;
  const isNewCliente = formData.get("new_cliente") === "true";
  const forceOverlap = formData.get("force_overlap") === "true";

  if (!profissional_id || !servico_id || !data_hora_inicio) {
    return { error: "Profesional, servicio y fecha/hora son obligatorios." };
  }

  // Buscar duração do serviço
  const { data: servico } = await supabase
    .from("servicos")
    .select("duracao_minutos")
    .eq("id", servico_id)
    .single();

  if (!servico) {
    return { error: "Servicio no encontrado." };
  }

  const duracao = (servico as { duracao_minutos: number }).duracao_minutos;
  const inicio = new Date(madridToISO(data_hora_inicio));
  const fim = new Date(inicio.getTime() + duracao * 60 * 1000);

  // Resolver cliente
  let cliente_id = formData.get("cliente_id") as string | null;

  if (isNewCliente) {
    const nome = formData.get("new_cliente_nome") as string;
    const telefone = (formData.get("new_cliente_telefone") as string) || "";

    if (!nome) {
      return { error: "El nombre del cliente es obligatorio." };
    }

    const { data: newCliente, error: clienteError } = await supabase
      .from("clientes")
      .insert({ salao_id: salaoId, nome, telefone })
      .select("id")
      .single();

    if (clienteError || !newCliente) {
      console.error("Error creating client:", clienteError);
      return { error: `Error al crear el cliente: ${clienteError?.message ?? "desconocido"}` };
    }

    cliente_id = (newCliente as { id: string }).id;
  }

  if (!cliente_id) {
    return { error: "Selecciona un cliente." };
  }

  // Verificar conflito de horário com agendamentos
  if (!forceOverlap) {
    const { data: conflitos } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("profissional_id", profissional_id)
      .neq("status", "cancelado")
      .lt("data_hora_inicio", fim.toISOString())
      .gt("data_hora_fim", inicio.toISOString());

    if (conflitos && (conflitos as Array<{ id: string }>).length > 0) {
      return { conflict: true, message: "El profesional ya tiene un turno en ese horario. ¿Deseas agendar de todas formas?" };
    }
  }

  // Verificar conflito com bloqueios
  const { data: bloqueios } = await supabase
    .from("bloqueios")
    .select("id")
    .eq("profissional_id", profissional_id)
    .lt("data_hora_inicio", fim.toISOString())
    .gt("data_hora_fim", inicio.toISOString());

  if (bloqueios && (bloqueios as Array<{ id: string }>).length > 0) {
    return { error: "El profesional tiene un bloqueo de horario en ese periodo." };
  }

  // Verificar se é agendamento com secado
  const addSecado = formData.get("add_secado") === "true";
  const secadoHoraInicio = formData.get("secado_hora_inicio") as string | null;

  // Buscar dados do serviço para secado
  let tempoPausa = 0;
  let duracaoPospausa = 0;
  if (addSecado && secadoHoraInicio) {
    const { data: servicoFull } = await supabase
      .from("servicos")
      .select("tempo_pausa_minutos, duracao_pos_pausa_minutos")
      .eq("id", servico_id)
      .single();

    const sf = servicoFull as { tempo_pausa_minutos: number | null; duracao_pos_pausa_minutos: number | null } | null;
    tempoPausa = sf?.tempo_pausa_minutos ?? 0;
    duracaoPospausa = sf?.duracao_pos_pausa_minutos ?? 0;
  }

  const tipoEtapa = addSecado && secadoHoraInicio ? "aplicacao" : "unico";

  // Criar agendamento principal
  const { data: newAgendamento, error } = await supabase
    .from("agendamentos")
    .insert({
      salao_id: salaoId,
      cliente_id,
      profissional_id,
      servico_id,
      data_hora_inicio: inicio.toISOString(),
      data_hora_fim: fim.toISOString(),
      status: "pendente",
      notas,
      tipo_etapa: tipoEtapa as "unico" | "aplicacao" | "secado",
    })
    .select("id")
    .single();

  if (error || !newAgendamento) {
    return { error: "Error al crear el turno. Intenta de nuevo." };
  }

  // Criar secado vinculado se solicitado
  if (addSecado && secadoHoraInicio && duracaoPospausa > 0) {
    const secadoInicio = new Date(madridToISO(secadoHoraInicio));
    const secadoFim = new Date(secadoInicio.getTime() + duracaoPospausa * 60 * 1000);

    // Verificar conflito do secado
    const { data: secadoConflitos } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("profissional_id", profissional_id)
      .neq("status", "cancelado")
      .neq("id", (newAgendamento as { id: string }).id)
      .lt("data_hora_inicio", secadoFim.toISOString())
      .gt("data_hora_fim", secadoInicio.toISOString());

    if (secadoConflitos && (secadoConflitos as Array<{ id: string }>).length > 0) {
      // Conflito no secado - avisar mas manter a aplicação
      return { error: "Turno creado, pero conflicto de horario en el secado. Ajusta el horario del secado." };
    }

    const { error: secadoError } = await supabase.from("agendamentos").insert({
      salao_id: salaoId,
      cliente_id,
      profissional_id,
      servico_id,
      data_hora_inicio: secadoInicio.toISOString(),
      data_hora_fim: secadoFim.toISOString(),
      status: "pendente",
      notas: notas ? `Secado — ${notas}` : "Secado",
      tipo_etapa: "secado" as "unico" | "aplicacao" | "secado",
      agendamento_pai_id: (newAgendamento as { id: string }).id,
    });

    if (secadoError) {
      return { error: "Turno principal creado, pero error al crear el secado." };
    }
  }

  // Send WhatsApp confirmation (non-blocking)
  const agendamentoId = (newAgendamento as { id: string }).id;
  sendAgendamentoConfirmation(salaoId, cliente_id, agendamentoId, servico_id, profissional_id, inicio).catch(() => {});

  revalidatePath("/dashboard/agenda");
  return { success: true };
}

export async function updateAgendamentoStatus(id: string, status: string) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado o salón no encontrado." };
  }

  // Validar transições válidas
  const validTransitions: Record<string, string[]> = {
    pendente: ["confirmado", "cancelado"],
    confirmado: ["concluido", "cancelado"],
  };

  const { data: current } = await supabase
    .from("agendamentos")
    .select("status")
    .eq("id", id)
    .eq("salao_id", salaoId)
    .single();

  if (!current) {
    return { error: "Turno no encontrado." };
  }

  const currentStatus = (current as { status: string }).status;
  const allowed = validTransitions[currentStatus] ?? [];

  if (!allowed.includes(status)) {
    return { error: `No se puede cambiar de "${currentStatus}" a "${status}".` };
  }

  const { error } = await supabase
    .from("agendamentos")
    .update({ status: status as "pendente" | "confirmado" | "concluido" | "cancelado", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("salao_id", salaoId);

  if (error) {
    return { error: "Error al actualizar el estado." };
  }

  // When completing an appointment, calculate next return date
  if (status === "concluido") {
    const { data: agendamento } = await supabase
      .from("agendamentos")
      .select("cliente_id")
      .eq("id", id)
      .eq("salao_id", salaoId)
      .single();

    if (agendamento) {
      const clienteId = (agendamento as { cliente_id: string }).cliente_id;
      const { data: cliente } = await supabase
        .from("clientes")
        .select("intervalo_retorno_dias")
        .eq("id", clienteId)
        .single();

      const intervalo = (cliente as { intervalo_retorno_dias: number | null } | null)
        ?.intervalo_retorno_dias;

      if (intervalo && intervalo > 0) {
        const proximoRetorno = new Date();
        proximoRetorno.setDate(proximoRetorno.getDate() + intervalo);
        await supabase
          .from("clientes")
          .update({ proximo_retorno: proximoRetorno.toISOString().split("T")[0] })
          .eq("id", clienteId);
      }
    }
  }

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function cancelAgendamento(id: string) {
  const result = await updateAgendamentoStatus(id, "cancelado");

  // Cancelar secado vinculado em cascata
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (salaoId) {
    const { data: filhos } = await supabase
      .from("agendamentos")
      .select("id")
      .eq("agendamento_pai_id", id)
      .eq("salao_id", salaoId)
      .neq("status", "cancelado");

    if (filhos) {
      for (const filho of filhos as Array<{ id: string }>) {
        await supabase
          .from("agendamentos")
          .update({ status: "cancelado" as const, updated_at: new Date().toISOString() })
          .eq("id", filho.id)
          .eq("salao_id", salaoId);
      }
    }
  }

  return result;
}

export async function updateAgendamento(id: string, formData: FormData) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado o salón no encontrado." };
  }

  const profissional_id = formData.get("profissional_id") as string;
  const servico_id = formData.get("servico_id") as string;
  const data_hora_inicio = formData.get("data_hora_inicio") as string;
  const notas = (formData.get("notas") as string) || null;

  if (!profissional_id || !servico_id || !data_hora_inicio) {
    return { error: "Profesional, servicio y fecha/hora son obligatorios." };
  }

  // Buscar duração do serviço
  const { data: servico } = await supabase
    .from("servicos")
    .select("duracao_minutos")
    .eq("id", servico_id)
    .single();

  if (!servico) {
    return { error: "Servicio no encontrado." };
  }

  const duracao = (servico as { duracao_minutos: number }).duracao_minutos;
  const inicio = new Date(madridToISO(data_hora_inicio));
  const fim = new Date(inicio.getTime() + duracao * 60 * 1000);

  // Verificar conflito (excluindo o próprio agendamento)
  const { data: conflitos } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("profissional_id", profissional_id)
    .neq("status", "cancelado")
    .neq("id", id)
    .lt("data_hora_inicio", fim.toISOString())
    .gt("data_hora_fim", inicio.toISOString());

  if (conflitos && (conflitos as Array<{ id: string }>).length > 0) {
    return { error: "Conflicto de horario: el profesional ya tiene un turno en ese horario." };
  }

  // Verificar bloqueios
  const { data: bloqueios } = await supabase
    .from("bloqueios")
    .select("id")
    .eq("profissional_id", profissional_id)
    .lt("data_hora_inicio", fim.toISOString())
    .gt("data_hora_fim", inicio.toISOString());

  if (bloqueios && (bloqueios as Array<{ id: string }>).length > 0) {
    return { error: "El profesional tiene un bloqueo de horario en ese periodo." };
  }

  const { error } = await supabase
    .from("agendamentos")
    .update({
      profissional_id,
      servico_id,
      data_hora_inicio: inicio.toISOString(),
      data_hora_fim: fim.toISOString(),
      notas,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("salao_id", salaoId);

  if (error) {
    return { error: "Error al actualizar el turno." };
  }

  revalidatePath("/dashboard/agenda");
  return { success: true };
}

export async function rescheduleAgendamento(
  id: string,
  newStart: string,
  newEnd: string
) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado." };
  }

  // Buscar dados do agendamento (com filtro salao_id)
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("profissional_id, status")
    .eq("id", id)
    .eq("salao_id", salaoId)
    .single();

  if (!agendamento) {
    return { error: "Turno no encontrado." };
  }

  const ag = agendamento as { profissional_id: string; status: string };

  if (ag.status === "concluido" || ag.status === "cancelado") {
    return { error: "No se puede mover un turno completado o cancelado." };
  }

  const inicio = new Date(madridToISO(newStart));
  const fim = new Date(madridToISO(newEnd));

  // Verificar conflito (excluindo o próprio)
  const { data: conflitos } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("profissional_id", ag.profissional_id)
    .neq("status", "cancelado")
    .neq("id", id)
    .lt("data_hora_inicio", fim.toISOString())
    .gt("data_hora_fim", inicio.toISOString());

  if (conflitos && (conflitos as Array<{ id: string }>).length > 0) {
    return { error: "Conflicto de horario en el nuevo horario." };
  }

  // Verificar bloqueios
  const { data: bloqueios } = await supabase
    .from("bloqueios")
    .select("id")
    .eq("profissional_id", ag.profissional_id)
    .lt("data_hora_inicio", fim.toISOString())
    .gt("data_hora_fim", inicio.toISOString());

  if (bloqueios && (bloqueios as Array<{ id: string }>).length > 0) {
    return { error: "Hay un bloqueo de horario en el nuevo periodo." };
  }

  const { error } = await supabase
    .from("agendamentos")
    .update({
      data_hora_inicio: inicio.toISOString(),
      data_hora_fim: fim.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("salao_id", salaoId);

  if (error) {
    return { error: "Error al mover el turno." };
  }

  revalidatePath("/dashboard/agenda");
  return { success: true };
}

// --- Notification helper (fire-and-forget) ---

async function sendAgendamentoConfirmation(
  salaoId: string,
  clienteId: string,
  agendamentoId: string,
  servicoId: string,
  profissionalId: string,
  inicio: Date,
) {
  const svc = createServiceClient();

  const [clRes, svcRes, profRes, salaoRes] = await Promise.all([
    svc.from("clientes").select("nome, telefone, idioma_preferido").eq("id", clienteId).single(),
    svc.from("servicos").select("nome").eq("id", servicoId).single(),
    svc.from("profissionais").select("nome").eq("id", profissionalId).single(),
    svc.from("saloes").select("nome, endereco").eq("id", salaoId).single(),
  ]);

  const cliente = clRes.data as { nome: string; telefone: string; idioma_preferido: string } | null;
  if (!cliente?.telefone) return;

  const idioma = cliente.idioma_preferido || "es";
  const servicoNome = (svcRes.data as { nome: string } | null)?.nome ?? "";
  const profNome = (profRes.data as { nome: string } | null)?.nome ?? "";
  const salao = salaoRes.data as { nome: string; endereco: string | null } | null;

  const dateStr = inicio.toLocaleDateString(idioma, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" });
  const timeStr = inicio.toLocaleTimeString(idioma, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });

  await sendBookingConfirmation({
    supabase: svc,
    salaoId,
    clienteId,
    agendamentoId,
    telefone: cliente.telefone,
    idioma,
    variables: {
      nome_cliente: cliente.nome,
      servico: servicoNome,
      profissional: profNome,
      data: dateStr,
      hora: timeStr,
      salao: salao?.nome ?? "",
      endereco: salao?.endereco ?? "",
      link_optout: `${process.env.NEXT_PUBLIC_APP_URL || "https://bellus.app"}/api/opt-out?client_id=${clienteId}&token=${generateOptOutToken(clienteId)}`,
    },
  });
}
