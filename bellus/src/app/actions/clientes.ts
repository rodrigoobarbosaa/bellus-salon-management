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
  if (!user) return { userId: null, salaoId: null };

  const { data: usuario } = await db(supabase)
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    salaoId: (usuario as { salao_id: string } | null)?.salao_id ?? null,
  };
}

export async function updateCliente(formData: FormData) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) return { error: "No autenticado." };

  const id = formData.get("id") as string;
  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const email = (formData.get("email") as string) || null;
  const idioma_preferido = formData.get("idioma_preferido") as string;
  const notas = (formData.get("notas") as string) || null;
  const intervalo_retorno_dias = formData.get("intervalo_retorno_dias") as string;
  const opt_out = formData.get("opt_out_notificacoes") === "true";

  if (!id || !nome || !telefone) {
    return { error: "Nombre y teléfono son obligatorios." };
  }

  const { error } = await db(supabase)
    .from("clientes")
    .update({
      nome,
      telefone,
      email,
      idioma_preferido,
      notas,
      intervalo_retorno_dias: intervalo_retorno_dias ? parseInt(intervalo_retorno_dias) : null,
      opt_out_notificacoes: opt_out,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("salao_id", salaoId);

  if (error) return { error: error.message };

  revalidatePath(`/dashboard/clientes/${id}`);
  revalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function createCliente(formData: FormData) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) return { error: "No autenticado." };

  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const email = (formData.get("email") as string) || null;
  const idioma_preferido = (formData.get("idioma_preferido") as string) || "es";
  const notas = (formData.get("notas") as string) || null;

  if (!nome || !telefone) {
    return { error: "Nombre y teléfono son obligatorios." };
  }

  const { data, error } = await db(supabase)
    .from("clientes")
    .insert({
      salao_id: salaoId,
      nome,
      telefone,
      email,
      idioma_preferido,
      notas,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/clientes");
  return { success: true, id: (data as { id: string }).id };
}
