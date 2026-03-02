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

export async function getNotificationTemplates() {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) return { templates: [], error: "No autenticado." };

  const { data, error } = await db(supabase)
    .from("notification_templates")
    .select("*")
    .eq("salao_id", salaoId)
    .order("tipo")
    .order("idioma");

  if (error) return { templates: [], error: error.message };

  return {
    templates: (data ?? []) as Array<{
      id: string;
      salao_id: string;
      tipo: string;
      idioma: string;
      template: string;
    }>,
  };
}

export async function upsertNotificationTemplate(formData: FormData) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) return { error: "No autenticado." };

  const tipo = formData.get("tipo") as string;
  const idioma = formData.get("idioma") as string;
  const template = formData.get("template") as string;

  if (!tipo || !idioma || !template) {
    return { error: "Todos los campos son obligatorios." };
  }

  // Check if exists
  const { data: existing } = await db(supabase)
    .from("notification_templates")
    .select("id")
    .eq("salao_id", salaoId)
    .eq("tipo", tipo)
    .eq("idioma", idioma)
    .single();

  if (existing) {
    const { error } = await db(supabase)
      .from("notification_templates")
      .update({ template, updated_at: new Date().toISOString() })
      .eq("id", (existing as { id: string }).id);

    if (error) return { error: error.message };
  } else {
    const { error } = await db(supabase)
      .from("notification_templates")
      .insert({ salao_id: salaoId, tipo, idioma, template });

    if (error) return { error: error.message };
  }

  revalidatePath("/dashboard/notificacoes");
  return { success: true };
}

export async function deleteNotificationTemplate(id: string) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) return { error: "No autenticado." };

  const { error } = await db(supabase)
    .from("notification_templates")
    .delete()
    .eq("id", id)
    .eq("salao_id", salaoId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/notificacoes");
  return { success: true };
}
