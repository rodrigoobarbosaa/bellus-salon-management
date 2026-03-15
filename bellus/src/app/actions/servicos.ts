"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Helper: executa query sem type-checking rígido do supabase-js
// Necessário porque o Database type usa enums que não aceitam string genérica
async function getSalaoId(supabase: SupabaseClient) {
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

export async function createServico(formData: FormData) {
  const supabase = await createClient();
  const salaoId = await getSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado o salón no encontrado." };
  }

  const nome = formData.get("nome") as string;
  const descricao = (formData.get("descricao") as string) || null;
  const duracao_minutos = parseInt(formData.get("duracao_minutos") as string, 10);
  const preco_base = parseFloat(formData.get("preco_base") as string);
  const categoria = formData.get("categoria") as string;
  const intervalo_retorno_dias = formData.get("intervalo_retorno_dias")
    ? parseInt(formData.get("intervalo_retorno_dias") as string, 10)
    : null;

  if (!nome || !duracao_minutos || isNaN(preco_base)) {
    return { error: "Nombre, duración y precio son obligatorios." };
  }

  if (duracao_minutos <= 0) {
    return { error: "La duración debe ser mayor que 0." };
  }

  if (preco_base < 0) {
    return { error: "El precio no puede ser negativo." };
  }

  const tempo_pausa_minutos = formData.get("tempo_pausa_minutos")
    ? parseInt(formData.get("tempo_pausa_minutos") as string, 10)
    : null;
  const duracao_pos_pausa_minutos = formData.get("duracao_pos_pausa_minutos")
    ? parseInt(formData.get("duracao_pos_pausa_minutos") as string, 10)
    : null;

  const { error } = await supabase.from("servicos").insert({
    salao_id: salaoId,
    nome,
    descricao,
    duracao_minutos,
    preco_base,
    categoria: categoria as "corte" | "coloracao" | "mechas" | "tratamento" | "outro",
    intervalo_retorno_dias,
    tempo_pausa_minutos,
    duracao_pos_pausa_minutos,
  });

  if (error) {
    return { error: "Error al crear el servicio. Intenta de nuevo." };
  }

  revalidatePath("/dashboard/servicos");
  return { success: true };
}

export async function updateServico(formData: FormData) {
  const supabase = await createClient();
  const salaoId = await getSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado o salón no encontrado." };
  }

  const id = formData.get("id") as string;
  const nome = formData.get("nome") as string;
  const descricao = (formData.get("descricao") as string) || null;
  const duracao_minutos = parseInt(formData.get("duracao_minutos") as string, 10);
  const preco_base = parseFloat(formData.get("preco_base") as string);
  const categoria = formData.get("categoria") as string;
  const intervalo_retorno_dias = formData.get("intervalo_retorno_dias")
    ? parseInt(formData.get("intervalo_retorno_dias") as string, 10)
    : null;

  if (!id || !nome || !duracao_minutos || isNaN(preco_base)) {
    return { error: "Datos incompletos." };
  }

  if (duracao_minutos <= 0) {
    return { error: "La duración debe ser mayor que 0." };
  }

  if (preco_base < 0) {
    return { error: "El precio no puede ser negativo." };
  }

  const tempo_pausa_minutos = formData.get("tempo_pausa_minutos")
    ? parseInt(formData.get("tempo_pausa_minutos") as string, 10)
    : null;
  const duracao_pos_pausa_minutos = formData.get("duracao_pos_pausa_minutos")
    ? parseInt(formData.get("duracao_pos_pausa_minutos") as string, 10)
    : null;

  const { error } = await supabase
    .from("servicos")
    .update({
      nome,
      descricao,
      duracao_minutos,
      preco_base,
      categoria: categoria as "corte" | "coloracao" | "mechas" | "tratamento" | "outro",
      intervalo_retorno_dias,
      tempo_pausa_minutos,
      duracao_pos_pausa_minutos,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: "Error al actualizar el servicio." };
  }

  revalidatePath("/dashboard/servicos");
  return { success: true };
}

export async function toggleServicoAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado." };
  }

  const { error } = await supabase
    .from("servicos")
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { error: "Error al cambiar el estado del servicio." };
  }

  revalidatePath("/dashboard/servicos");
  return { success: true };
}

export async function updateServicoProfissionais(
  servicoId: string,
  profissionais: { profissional_id: string; preco_override: number | null }[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado." };
  }

  // Remover associações existentes
  const { error: deleteError } = await supabase
    .from("servicos_profissionais")
    .delete()
    .eq("servico_id", servicoId);

  if (deleteError) {
    return { error: "Error al actualizar profesionales." };
  }

  // Inserir novas associações
  if (profissionais.length > 0) {
    const rows = profissionais.map((p) => ({
      servico_id: servicoId,
      profissional_id: p.profissional_id,
      preco_override: p.preco_override,
    }));

    const { error: insertError } = await supabase
      .from("servicos_profissionais")
      .insert(rows);

    if (insertError) {
      return { error: "Error al asociar profesionales." };
    }
  }

  revalidatePath("/dashboard/servicos");
  return { success: true };
}
