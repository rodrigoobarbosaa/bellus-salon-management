import type { SupabaseClient } from "@supabase/supabase-js";
import type { IncomingMessage, StatusUpdate } from "./parse-webhook";

/**
 * Processa uma mensagem recebida:
 * 1. Encontra ou cria conversa (sessão)
 * 2. Tenta vincular a um cliente existente
 * 3. Persiste a mensagem
 * 4. Retorna conversa + mensagem para processamento posterior (IA)
 */
export async function handleIncomingMessage(
  supabase: SupabaseClient,
  salaoId: string,
  msg: IncomingMessage
) {
  // 1. Encontra ou cria conversa
  const { data: existingConversa } = await supabase
    .from("conversas")
    .select("id, cliente_id, estado, contexto")
    .eq("salao_id", salaoId)
    .eq("canal", msg.canal)
    .eq("external_id", msg.externalId)
    .single();

  let conversaId: string;
  let clienteId: string | null = null;
  let estado: string;
  let contexto: Record<string, unknown>;

  if (existingConversa) {
    conversaId = existingConversa.id;
    clienteId = existingConversa.cliente_id;
    estado = existingConversa.estado;
    contexto = (existingConversa.contexto ?? {}) as Record<string, unknown>;

    // Reativar conversa encerrada se cliente manda mensagem nova
    const updates: Record<string, unknown> = {
      ultima_mensagem_em: new Date().toISOString(),
    };
    if (estado === "encerrado") {
      updates.estado = "ativo";
      estado = "ativo";
    }
    await supabase
      .from("conversas")
      .update(updates)
      .eq("id", conversaId);
  } else {
    // Tentar vincular por telefone (WhatsApp)
    if (msg.canal === "whatsapp") {
      clienteId = await findClienteByPhone(supabase, salaoId, msg.externalId);
    }

    const { data: newConversa } = await supabase
      .from("conversas")
      .insert({
        salao_id: salaoId,
        cliente_id: clienteId,
        canal: msg.canal,
        external_id: msg.externalId,
        estado: "ativo",
        ultima_mensagem_em: new Date().toISOString(),
      })
      .select("id")
      .single();

    conversaId = (newConversa as { id: string }).id;
    estado = "ativo";
    contexto = {};
  }

  // 2. Persistir mensagem
  const { data: mensagem } = await supabase
    .from("conversas_mensagens")
    .insert({
      conversa_id: conversaId,
      salao_id: salaoId,
      direcao: "recebida",
      tipo: msg.tipo,
      conteudo: msg.conteudo,
      meta_message_id: msg.messageId,
      status: "recebida",
      metadata: msg.metadata,
    })
    .select("id")
    .single();

  return {
    conversaId,
    mensagemId: (mensagem as { id: string })?.id,
    clienteId,
    estado,
    contexto,
    canal: msg.canal,
    externalId: msg.externalId,
    conteudo: msg.conteudo,
    tipo: msg.tipo,
  };
}

/**
 * Atualiza status de uma mensagem enviada (delivered, read, failed).
 */
export async function handleStatusUpdate(
  supabase: SupabaseClient,
  update: StatusUpdate
) {
  if (!update.messageId) return;

  await supabase
    .from("conversas_mensagens")
    .update({ status: update.status })
    .eq("meta_message_id", update.messageId);
}

/**
 * Busca cliente pelo telefone (normalizado).
 * O telefone no WhatsApp vem sem '+' (ex: "34612345678").
 */
async function findClienteByPhone(
  supabase: SupabaseClient,
  salaoId: string,
  phone: string
): Promise<string | null> {
  // Tenta com +, sem +, e variantes comuns
  const variants = [
    phone,
    `+${phone}`,
    phone.replace(/^34/, "+34"),  // Espanha
    phone.replace(/^351/, "+351"), // Portugal
    phone.replace(/^55/, "+55"),   // Brasil
  ];

  const { data } = await supabase
    .from("clientes")
    .select("id, telefone")
    .eq("salao_id", salaoId)
    .in("telefone", variants)
    .limit(1)
    .single();

  return (data as { id: string } | null)?.id ?? null;
}
