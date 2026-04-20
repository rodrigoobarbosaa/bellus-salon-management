"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sendReply } from "@/lib/evolution/send-message";

async function getAuthenticatedSalao() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id, role")
    .eq("id", user.id)
    .single();

  if (!usuario) redirect("/login");

  const { salao_id: salaoId, role } = usuario as { salao_id: string; role: string };
  return { supabase, salaoId, role };
}

/**
 * Assume conversation — human takes over from bot.
 */
export async function assumeConversation(conversaId: string) {
  const { supabase, salaoId } = await getAuthenticatedSalao();

  const { error } = await supabase
    .from("conversas")
    .update({ estado: "aguardando_humano" })
    .eq("id", conversaId)
    .eq("salao_id", salaoId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Release conversation — bot resumes control.
 */
export async function releaseConversation(conversaId: string) {
  const { supabase, salaoId } = await getAuthenticatedSalao();

  const { error } = await supabase
    .from("conversas")
    .update({ estado: "ativo" })
    .eq("id", conversaId)
    .eq("salao_id", salaoId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Close conversation.
 */
export async function closeConversation(conversaId: string) {
  const { supabase, salaoId } = await getAuthenticatedSalao();

  const { error } = await supabase
    .from("conversas")
    .update({ estado: "encerrado" })
    .eq("id", conversaId)
    .eq("salao_id", salaoId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Send a human message — sends via Meta API and logs in conversation.
 */
export async function sendHumanMessage(
  conversaId: string,
  salaoId: string,
  canal: string,
  externalId: string,
  message: string
) {
  const { supabase } = await getAuthenticatedSalao();

  // Send via Meta API
  const result = await sendReply(
    canal as "whatsapp" | "instagram",
    externalId,
    message
  );

  // Log message in conversation history
  await supabase
    .from("conversas_mensagens")
    .insert({
      conversa_id: conversaId,
      salao_id: salaoId,
      direcao: "enviada",
      tipo: "texto",
      conteudo: message,
      meta_message_id: result.messageId ?? null,
      status: result.success ? "enviada" : "falhou",
    });

  // Update last message timestamp
  await supabase
    .from("conversas")
    .update({ ultima_mensagem_em: new Date().toISOString() })
    .eq("id", conversaId);

  if (!result.success) return { success: false, error: result.error };
  return { success: true };
}
