"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  const inicio = new Date(data_hora_inicio);
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
  const { data: conflitos } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("profissional_id", profissional_id)
    .neq("status", "cancelado")
    .lt("data_hora_inicio", fim.toISOString())
    .gt("data_hora_fim", inicio.toISOString());

  if (conflitos && (conflitos as Array<{ id: string }>).length > 0) {
    return { error: "Conflicto de horario: el profesional ya tiene un turno en ese horario." };
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

  // Criar agendamento
  const { error } = await supabase.from("agendamentos").insert({
    salao_id: salaoId,
    cliente_id,
    profissional_id,
    servico_id,
    data_hora_inicio: inicio.toISOString(),
    data_hora_fim: fim.toISOString(),
    status: "pendente",
    notas,
  });

  if (error) {
    return { error: "Error al crear el turno. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/agenda");
  return { success: true };
}

export async function updateAgendamentoStatus(id: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado." };
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
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: "Error al actualizar el estado." };
  }

  // When completing an appointment, calculate next return date
  if (status === "concluido") {
    const { data: agendamento } = await supabase
      .from("agendamentos")
      .select("cliente_id")
      .eq("id", id)
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
  return updateAgendamentoStatus(id, "cancelado");
}
