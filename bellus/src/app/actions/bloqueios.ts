"use server";

import { revalidatePath } from "next/cache";
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

export async function createBloqueio(formData: FormData) {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado o salón no encontrado." };
  }

  const profissional_id = formData.get("profissional_id") as string;
  const dia_inteiro = formData.get("dia_inteiro") === "true";
  const motivo = (formData.get("motivo") as string) || null;

  if (!profissional_id) {
    return { error: "Profesional es obligatorio." };
  }

  let data_hora_inicio: string;
  let data_hora_fim: string;

  if (dia_inteiro) {
    const fecha = formData.get("fecha") as string;
    if (!fecha) {
      return { error: "Fecha es obligatoria." };
    }
    // Día completo: 00:00 a 23:59
    data_hora_inicio = new Date(`${fecha}T00:00:00`).toISOString();
    data_hora_fim = new Date(`${fecha}T23:59:59`).toISOString();
  } else {
    const inicio = formData.get("data_hora_inicio") as string;
    const fim = formData.get("data_hora_fim") as string;

    if (!inicio || !fim) {
      return { error: "Hora de inicio y fin son obligatorias." };
    }

    data_hora_inicio = new Date(inicio).toISOString();
    data_hora_fim = new Date(fim).toISOString();

    if (data_hora_fim <= data_hora_inicio) {
      return { error: "La hora de fin debe ser posterior a la de inicio." };
    }
  }

  const { error } = await db(supabase).from("bloqueios").insert({
    salao_id: salaoId,
    profissional_id,
    data_hora_inicio,
    data_hora_fim,
    dia_inteiro,
    motivo,
  });

  if (error) {
    return { error: "Error al crear el bloqueo. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/agenda");
  return { success: true };
}

export async function deleteBloqueio(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado." };
  }

  const { error } = await db(supabase)
    .from("bloqueios")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "Error al eliminar el bloqueo." };
  }

  revalidatePath("/dashboard/agenda");
  return { success: true };
}
