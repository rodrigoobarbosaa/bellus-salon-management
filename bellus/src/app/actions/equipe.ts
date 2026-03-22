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

  if (nome.length > 100) {
    return { error: "Nome muito longo (máximo 100 caracteres)." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Email inválido." };
  }

  if (telefone && telefone.length > 20) {
    return { error: "Telefone muito longo (máximo 20 caracteres)." };
  }

  const validRoles = ["proprietario", "profissional"] as const;
  if (!validRoles.includes(role as (typeof validRoles)[number])) {
    return { error: "Cargo inválido." };
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

  if (nome.length > 100) {
    return { error: "Nome muito longo (máximo 100 caracteres)." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Email inválido." };
  }

  if (telefone && telefone.length > 20) {
    return { error: "Telefone muito longo (máximo 20 caracteres)." };
  }

  const validRoles = ["proprietario", "profissional"] as const;
  if (!validRoles.includes(role as (typeof validRoles)[number])) {
    return { error: "Cargo inválido." };
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

  // Validar que todos os serviços pertencem ao mesmo salão
  if (servicos.length > 0) {
    const servicoIds = servicos.map((s) => s.servico_id);
    const { data: validServicos } = await supabase
      .from("servicos")
      .select("id")
      .eq("salao_id", salaoId)
      .in("id", servicoIds);

    if ((validServicos as Array<{ id: string }> | null)?.length !== servicoIds.length) {
      return { error: "Alguns serviços não pertencem a este salão." };
    }

    // Validar preco_override >= 0
    for (const s of servicos) {
      if (s.preco_override !== null && s.preco_override < 0) {
        return { error: "Preço override não pode ser negativo." };
      }
    }
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
