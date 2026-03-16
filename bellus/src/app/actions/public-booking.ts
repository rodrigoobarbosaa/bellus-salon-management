"use server";

import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendBookingConfirmation } from "@/lib/notifications/send-notification";

/**
 * Public booking creation — no auth required.
 * Uses service_role to bypass RLS.
 */
export async function createPublicBooking(formData: FormData) {
  const salaoId = formData.get("salao_id") as string;
  const servicoId = formData.get("servico_id") as string;
  const profissionalId = formData.get("profissional_id") as string;
  const date = formData.get("data") as string;
  const hora = formData.get("hora") as string;
  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const email = (formData.get("email") as string) || "";
  const idioma = (formData.get("idioma") as string) || "es";

  if (!salaoId || !servicoId || !date || !hora || !nome || !telefone) {
    return { error: "Datos incompletos." };
  }

  const supabase = createServiceClient();

  // Fetch service duration
  const { data: servico } = await supabase
    .from("servicos")
    .select("duracao_minutos, nome")
    .eq("id", servicoId)
    .single();

  if (!servico) {
    return { error: "Servicio no encontrado." };
  }

  const { duracao_minutos, nome: servicoNome } = servico as { duracao_minutos: number; nome: string };

  const inicio = new Date(`${date}T${hora}:00`);
  const fim = new Date(inicio.getTime() + duracao_minutos * 60 * 1000);

  // Resolve professional — if not specified, pick first available
  let resolvedProfId = profissionalId;
  if (!resolvedProfId) {
    // Get professionals for this service
    const { data: sps } = await supabase
      .from("servicos_profissionais")
      .select("profissional_id")
      .eq("servico_id", servicoId);

    const spList = (sps ?? []) as Array<{ profissional_id: string }>;
    const profIds = spList.map((sp) => sp.profissional_id);

    // If no associations, get all active professionals
    if (profIds.length === 0) {
      const { data: allProfs } = await supabase
        .from("profissionais")
        .select("id")
        .eq("salao_id", salaoId)
        .eq("ativo", true);
      const allList = (allProfs ?? []) as Array<{ id: string }>;
      for (const p of allList) profIds.push(p.id);
    }

    // Find first available (no conflict)
    for (const pid of profIds) {
      const { data: conflicts } = await supabase
        .from("agendamentos")
        .select("id")
        .eq("profissional_id", pid)
        .neq("status", "cancelado")
        .lt("data_hora_inicio", fim.toISOString())
        .gt("data_hora_fim", inicio.toISOString());

      const { data: blockConflicts } = await supabase
        .from("bloqueios")
        .select("id")
        .eq("profissional_id", pid)
        .lt("data_hora_inicio", fim.toISOString())
        .gt("data_hora_fim", inicio.toISOString());

      if (
        (!conflicts || (conflicts as Array<{ id: string }>).length === 0) &&
        (!blockConflicts || (blockConflicts as Array<{ id: string }>).length === 0)
      ) {
        resolvedProfId = pid;
        break;
      }
    }

    if (!resolvedProfId) {
      return { error: "No hay profesionales disponibles en ese horario." };
    }
  }

  // Verify no conflict for resolved professional
  const { data: conflitos } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("profissional_id", resolvedProfId)
    .neq("status", "cancelado")
    .lt("data_hora_inicio", fim.toISOString())
    .gt("data_hora_fim", inicio.toISOString());

  if (conflitos && (conflitos as Array<{ id: string }>).length > 0) {
    return { error: "Horario no disponible. Por favor selecciona otro." };
  }

  // Check bloqueios
  const { data: bloqueios } = await supabase
    .from("bloqueios")
    .select("id")
    .eq("profissional_id", resolvedProfId)
    .lt("data_hora_inicio", fim.toISOString())
    .gt("data_hora_fim", inicio.toISOString());

  if (bloqueios && (bloqueios as Array<{ id: string }>).length > 0) {
    return { error: "Horario bloqueado. Por favor selecciona otro." };
  }

  // Find or create client
  const validIdiomas = ["pt", "es", "en", "ru"];
  const idiomaCliente = validIdiomas.includes(idioma) ? idioma : "es";

  const { data: existingClient } = await supabase
    .from("clientes")
    .select("id")
    .eq("salao_id", salaoId)
    .eq("telefone", telefone)
    .single();

  let clienteId: string;

  if (existingClient) {
    clienteId = (existingClient as { id: string }).id;
  } else {
    const { data: newClient, error: clienteError } = await supabase
      .from("clientes")
      .insert({
        salao_id: salaoId,
        nome,
        telefone,
        email: email || null,
        idioma_preferido: idiomaCliente as "pt" | "es" | "en" | "ru",
      })
      .select("id")
      .single();

    if (clienteError || !newClient) {
      return { error: `Error al registrar cliente: ${clienteError?.message ?? "desconocido"}` };
    }
    clienteId = (newClient as { id: string }).id;
  }

  // Get professional name for notification
  const { data: profData } = await supabase
    .from("profissionais")
    .select("nome")
    .eq("id", resolvedProfId)
    .single();

  const profNome = (profData as { nome: string } | null)?.nome ?? "";

  // Get salon info for notification
  const { data: salaoData } = await supabase
    .from("saloes")
    .select("nome, endereco")
    .eq("id", salaoId)
    .single();

  const salaoNome = (salaoData as { nome: string; endereco: string | null } | null)?.nome ?? "";
  const salaoEndereco = (salaoData as { nome: string; endereco: string | null } | null)?.endereco ?? "";

  // Create appointment
  const { data: agendamento, error: agendamentoError } = await supabase
    .from("agendamentos")
    .insert({
      salao_id: salaoId,
      cliente_id: clienteId,
      profissional_id: resolvedProfId,
      servico_id: servicoId,
      data_hora_inicio: inicio.toISOString(),
      data_hora_fim: fim.toISOString(),
      status: "pendente",
    })
    .select("id")
    .single();

  if (agendamentoError) {
    return { error: "Error al crear la cita. Intenta de nuevo." };
  }

  const agendamentoId = (agendamento as { id: string }).id;

  // Send confirmation notification (non-blocking)
  sendBookingConfirmation({
    supabase,
    salaoId,
    clienteId,
    agendamentoId,
    telefone,
    idioma: idiomaCliente,
    variables: {
      nome_cliente: nome,
      servico: servicoNome,
      profissional: profNome,
      data: date,
      hora,
      salao: salaoNome,
      endereco: salaoEndereco,
      link_optout: `${process.env.NEXT_PUBLIC_APP_URL || "https://bellus.app"}/api/opt-out?client_id=${clienteId}`,
    },
  }).catch((err) => {
    console.error("Error sending confirmation:", err);
  });

  return { success: true };
}
