"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function createProfissional(formData: FormData) {
  const supabase = await createClient();
  const salaoId = await getSalaoId(supabase);

  if (!salaoId) {
    return { error: "Não autenticado ou salão não encontrado." };
  }

  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const telefone = (formData.get("telefone") as string) || null;
  const role = (formData.get("role") as string) || "profissional";
  const cor_agenda = (formData.get("cor_agenda") as string) || "#6366f1";

  if (!nome || !email) {
    return { error: "Nome e email são obrigatórios." };
  }

  const { error } = await supabase.from("profissionais").insert({
    user_id: crypto.randomUUID(),
    salao_id: salaoId,
    nome,
    email,
    telefone,
    role: role as "proprietario" | "profissional",
    cor_agenda,
  });

  if (error) {
    return { error: "Erro ao criar profissional. Tente novamente." };
  }

  revalidatePath("/dashboard/equipe");
  return { success: true };
}

export async function updateProfissional(formData: FormData) {
  const supabase = await createClient();
  const salaoId = await getSalaoId(supabase);

  if (!salaoId) {
    return { error: "Não autenticado ou salão não encontrado." };
  }

  const id = formData.get("id") as string;
  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const telefone = (formData.get("telefone") as string) || null;
  const role = (formData.get("role") as string) || "profissional";
  const cor_agenda = (formData.get("cor_agenda") as string) || "#6366f1";

  if (!id || !nome || !email) {
    return { error: "Dados incompletos." };
  }

  const { error } = await supabase
    .from("profissionais")
    .update({
      nome,
      email,
      telefone,
      role: role as "proprietario" | "profissional",
      cor_agenda,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("salao_id", salaoId);

  if (error) {
    return { error: "Erro ao atualizar profissional." };
  }

  revalidatePath("/dashboard/equipe");
  return { success: true };
}

export async function toggleProfissionalAtivo(id: string, ativo: boolean) {
  const supabase = await createClient();
  const salaoId = await getSalaoId(supabase);

  if (!salaoId) {
    return { error: "Não autenticado ou salão não encontrado." };
  }

  const { error } = await supabase
    .from("profissionais")
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("salao_id", salaoId);

  if (error) {
    return { error: "Erro ao alterar status do profissional." };
  }

  revalidatePath("/dashboard/equipe");
  return { success: true };
}

export async function updateProfissionalServicos(
  profissionalId: string,
  servicos: { servico_id: string; preco_override: number | null }[]
) {
  const supabase = await createClient();
  const salaoId = await getSalaoId(supabase);

  if (!salaoId) {
    return { error: "Não autenticado ou salão não encontrado." };
  }

  // Verificar que o profissional pertence ao salão
  const { data: prof } = await supabase
    .from("profissionais")
    .select("id")
    .eq("id", profissionalId)
    .eq("salao_id", salaoId)
    .single();

  if (!prof) {
    return { error: "Profissional não encontrado ou não pertence ao salão." };
  }

  // Remover associações existentes
  const { error: deleteError } = await supabase
    .from("servicos_profissionais")
    .delete()
    .eq("profissional_id", profissionalId);

  if (deleteError) {
    return { error: "Erro ao atualizar serviços." };
  }

  // Inserir novas associações
  if (servicos.length > 0) {
    const rows = servicos.map((s) => ({
      servico_id: s.servico_id,
      profissional_id: profissionalId,
      preco_override: s.preco_override,
    }));

    const { error: insertError } = await supabase
      .from("servicos_profissionais")
      .insert(rows);

    if (insertError) {
      return { error: "Erro ao associar serviços." };
    }
  }

  revalidatePath("/dashboard/equipe");
  revalidatePath("/dashboard/servicos");
  return { success: true };
}
