"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsAppTemplate, isMetaWhatsAppConfigured } from "@/lib/meta/send-message";

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

export async function createTransacao(formData: FormData) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado o salón no encontrado." };
  }

  const agendamentoId = formData.get("agendamento_id") as string;
  const clienteId = (formData.get("cliente_id") as string) || null;
  const profissionalId = (formData.get("profissional_id") as string) || null;
  const servicoId = (formData.get("servico_id") as string) || null;
  const valor = parseFloat(formData.get("valor") as string);
  const tipoDesconto = (formData.get("tipo_desconto") as string) || null;
  const valorDesconto = parseFloat(formData.get("valor_desconto") as string) || 0;
  const formaPagamento = formData.get("forma_pagamento") as string;
  const notas = (formData.get("notas") as string) || null;

  if (!agendamentoId || isNaN(valor) || !formaPagamento) {
    return { error: "Datos incompletos para registrar el pago." };
  }

  // Fetch appointment date so transaction records the actual service date
  const { data: agendamentoData } = await supabase
    .from("agendamentos")
    .select("data_hora_inicio")
    .eq("id", agendamentoId)
    .single();

  // Extract date in Madrid timezone (YYYY-MM-DD) for data_servico
  const agendamentoStart = (agendamentoData as { data_hora_inicio: string } | null)?.data_hora_inicio;
  const dataServico = agendamentoStart
    ? new Date(agendamentoStart).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" })
    : new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

  // Calculate final value (accept client override for custom price / courtesy)
  const valorFinalOverride = formData.get("valor_final") ? parseFloat(formData.get("valor_final") as string) : null;

  let valorFinal = valor;
  if (valorFinalOverride !== null && !isNaN(valorFinalOverride)) {
    valorFinal = Math.max(0, valorFinalOverride);
  } else if (tipoDesconto === "percentual" && valorDesconto > 0) {
    valorFinal = valor - (valor * valorDesconto) / 100;
  } else if (tipoDesconto === "fixo" && valorDesconto > 0) {
    valorFinal = valor - valorDesconto;
  }
  if (valorFinal < 0) valorFinal = 0;

  const { error } = await supabase.from("transacoes").insert({
    salao_id: salaoId,
    agendamento_id: agendamentoId,
    cliente_id: clienteId,
    profissional_id: profissionalId,
    servico_id: servicoId,
    valor,
    tipo_desconto: (tipoDesconto === "nenhum" ? null : tipoDesconto) as "percentual" | "fixo" | null,
    valor_desconto: valorDesconto,
    valor_final: Math.round(valorFinal * 100) / 100,
    forma_pagamento: formaPagamento as "efectivo" | "tarjeta" | "bizum" | "transferencia",
    notas,
    data_servico: dataServico,
  });

  if (error) {
    console.error("Error creating transaction:", error);
    return { error: "Error al registrar el pago." };
  }

  // Also update agendamento status to concluido if not already
  await supabase
    .from("agendamentos")
    .update({ status: "concluido", updated_at: new Date().toISOString() })
    .eq("id", agendamentoId);

  // Calculate proximo_retorno for client
  if (clienteId) {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("intervalo_retorno_dias")
      .eq("id", clienteId)
      .single();

    let intervalo = (cliente as { intervalo_retorno_dias: number | null } | null)
      ?.intervalo_retorno_dias;

    // Fallback to service interval if client has no custom interval
    if (!intervalo && servicoId) {
      const { data: servico } = await supabase
        .from("servicos")
        .select("intervalo_retorno_dias")
        .eq("id", servicoId)
        .single();

      intervalo = (servico as { intervalo_retorno_dias: number | null } | null)
        ?.intervalo_retorno_dias ?? null;
    }

    if (intervalo && intervalo > 0) {
      const proximoRetorno = new Date();
      proximoRetorno.setDate(proximoRetorno.getDate() + intervalo);
      await supabase
        .from("clientes")
        .update({ proximo_retorno: proximoRetorno.toISOString().split("T")[0] })
        .eq("id", clienteId);
    }
  }

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard/clientes");
  return { success: true };
}

interface ComandaPayload {
  agendamento_id: string;
  cliente_id: string;
  profissional_id: string;
  servicos: string[]; // array of service IDs (first = main)
  tipo_desconto: string | null;
  valor_desconto: number;
  notas: string | null;
  cortesia: boolean;
  tipo_cortesia: string | null;
  split: boolean;
  pagamento1: { forma: string; valor: number };
  pagamento2: { forma: string; valor: number } | null;
  valor_final_override?: number; // manual price override (can be > or < base price)
}

export async function createComandaTransacoes(payloadJson: string) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado o salón no encontrado." };
  }

  let payload: ComandaPayload;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    return { error: "Datos inválidos." };
  }

  const { agendamento_id, cliente_id, profissional_id, servicos, notas } = payload;

  if (!agendamento_id || servicos.length === 0) {
    return { error: "Datos incompletos para registrar el pago." };
  }

  // Fetch appointment date so transaction records the actual service date
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("data_hora_inicio")
    .eq("id", agendamento_id)
    .single();

  // Extract date in Madrid timezone (YYYY-MM-DD) for data_servico
  const agendamentoStart = (agendamento as { data_hora_inicio: string } | null)?.data_hora_inicio;
  const dataServico = agendamentoStart
    ? new Date(agendamentoStart).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" })
    : new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

  // Fetch service prices and return intervals
  const { data: svcData } = await supabase
    .from("servicos")
    .select("id, preco_base, intervalo_retorno_dias")
    .in("id", servicos);

  const priceMap = new Map<string, number>();
  const intervalMap = new Map<string, number | null>();
  if (svcData) {
    for (const s of svcData as { id: string; preco_base: number; intervalo_retorno_dias: number | null }[]) {
      priceMap.set(s.id, s.preco_base);
      intervalMap.set(s.id, s.intervalo_retorno_dias);
    }
  }

  const totalBruto = servicos.reduce((sum, sid) => sum + (priceMap.get(sid) ?? 0), 0);

  // Calculate final value after discount or manual override
  let valorFinalTotal: number;
  if (payload.cortesia) {
    valorFinalTotal = 0;
  } else if (payload.valor_final_override != null && payload.valor_final_override >= 0) {
    // Manual price override (supports both surcharges and discounts)
    valorFinalTotal = payload.valor_final_override;
  } else {
    valorFinalTotal = totalBruto;
    if (payload.tipo_desconto === "percentual" && payload.valor_desconto > 0) {
      valorFinalTotal = totalBruto - (totalBruto * payload.valor_desconto) / 100;
    } else if (payload.tipo_desconto === "fixo" && payload.valor_desconto > 0) {
      valorFinalTotal = totalBruto - payload.valor_desconto;
    }
    if (valorFinalTotal < 0) valorFinalTotal = 0;
  }

  const tipoDesc = (payload.tipo_desconto === "nenhum" ? null : payload.tipo_desconto) as
    | "percentual"
    | "fixo"
    | null;

  const transacoes: Array<{
    salao_id: string;
    agendamento_id: string;
    cliente_id: string | null;
    profissional_id: string | null;
    servico_id: string | null;
    valor: number;
    tipo_desconto: "percentual" | "fixo" | null;
    valor_desconto: number;
    valor_final: number;
    forma_pagamento: "efectivo" | "tarjeta" | "bizum" | "transferencia";
    notas: string | null;
    data_servico: string;
  }> = [];

  if (payload.split && payload.pagamento2) {
    // Split payment: 2 transactions dividing the total
    transacoes.push({
      salao_id: salaoId,
      agendamento_id,
      cliente_id: cliente_id || null,
      profissional_id: profissional_id || null,
      servico_id: servicos[0],
      valor: totalBruto,
      tipo_desconto: tipoDesc,
      valor_desconto: payload.valor_desconto,
      valor_final: Math.round(payload.pagamento1.valor * 100) / 100,
      forma_pagamento: payload.pagamento1.forma as "efectivo" | "tarjeta" | "bizum" | "transferencia",
      notas: notas ? `[SPLIT 1/2] ${notas}` : "[SPLIT 1/2]",
      data_servico: dataServico,
    });
    transacoes.push({
      salao_id: salaoId,
      agendamento_id,
      cliente_id: cliente_id || null,
      profissional_id: profissional_id || null,
      servico_id: servicos[0],
      valor: 0,
      tipo_desconto: null,
      valor_desconto: 0,
      valor_final: Math.round(payload.pagamento2.valor * 100) / 100,
      forma_pagamento: payload.pagamento2.forma as "efectivo" | "tarjeta" | "bizum" | "transferencia",
      notas: notas ? `[SPLIT 2/2] ${notas}` : "[SPLIT 2/2]",
      data_servico: dataServico,
    });

    // If extras exist, add separate transactions for each extra
    for (let i = 1; i < servicos.length; i++) {
      const sid = servicos[i];
      const price = priceMap.get(sid) ?? 0;
      transacoes.push({
        salao_id: salaoId,
        agendamento_id,
        cliente_id: cliente_id || null,
        profissional_id: profissional_id || null,
        servico_id: sid,
        valor: price,
        tipo_desconto: null,
        valor_desconto: 0,
        valor_final: 0, // included in split total
        forma_pagamento: payload.pagamento1.forma as "efectivo" | "tarjeta" | "bizum" | "transferencia",
        notas: "[ADICIONAL - incluido en split]",
        data_servico: dataServico,
      });
    }
  } else {
    // No split: one transaction per service
    // Discount applied proportionally across services
    const discountRatio = totalBruto > 0 ? valorFinalTotal / totalBruto : 0;

    for (let i = 0; i < servicos.length; i++) {
      const sid = servicos[i];
      const basePrice = priceMap.get(sid) ?? 0;
      const finalPrice = payload.cortesia ? 0 : Math.round(basePrice * discountRatio * 100) / 100;

      transacoes.push({
        salao_id: salaoId,
        agendamento_id,
        cliente_id: cliente_id || null,
        profissional_id: profissional_id || null,
        servico_id: sid,
        valor: basePrice,
        tipo_desconto: i === 0 ? tipoDesc : null,
        valor_desconto: i === 0 ? payload.valor_desconto : 0,
        valor_final: finalPrice,
        forma_pagamento: payload.pagamento1.forma as "efectivo" | "tarjeta" | "bizum" | "transferencia",
        notas: i === 0 ? (notas ?? null) : (servicos.length > 1 ? "[ADICIONAL]" : null),
        data_servico: dataServico,
      });
    }
  }

  // Insert all transactions
  const { data: insertedTxs, error } = await supabase.from("transacoes").insert(transacoes).select("id");

  if (error) {
    console.error("Error creating transactions:", error);
    return { error: "Error al registrar el pago." };
  }

  // Update agendamento status to concluido
  await supabase
    .from("agendamentos")
    .update({ status: "concluido", updated_at: new Date().toISOString() })
    .eq("id", agendamento_id);

  // Calculate proximo_retorno for client
  if (cliente_id) {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("intervalo_retorno_dias")
      .eq("id", cliente_id)
      .single();

    let intervalo = (cliente as { intervalo_retorno_dias: number | null } | null)
      ?.intervalo_retorno_dias;

    // Fallback to main service interval if client has no custom interval
    if (!intervalo && servicos.length > 0) {
      intervalo = intervalMap.get(servicos[0]) ?? null;
    }

    if (intervalo && intervalo > 0) {
      const proximoRetorno = new Date();
      proximoRetorno.setDate(proximoRetorno.getDate() + intervalo);
      await supabase
        .from("clientes")
        .update({ proximo_retorno: proximoRetorno.toISOString().split("T")[0] })
        .eq("id", cliente_id);
    }
  }

  // Send Google Reviews request
  console.log(`[Reviews] cliente_id=${cliente_id}, salaoId=${salaoId}, agendamento_id=${agendamento_id}`);
  if (cliente_id) {
    try {
      console.log("[Reviews] Calling sendReviewRequestAfterComanda...");
      await sendReviewRequestAfterComanda(salaoId, agendamento_id, cliente_id);
      console.log("[Reviews] Done.");
    } catch (err) {
      console.error("[Reviews] Failed:", err);
    }
  } else {
    console.log("[Reviews] SKIPPED — no cliente_id in payload");
  }

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard/clientes");
  const transacaoIds = insertedTxs?.map((t: { id: string }) => t.id) ?? [];
  return { success: true, transacaoIds };
}

async function sendReviewRequestAfterComanda(
  salaoId: string,
  agendamentoId: string,
  clienteId: string,
) {
  console.log(`[Reviews] START — salao=${salaoId}, agendamento=${agendamentoId}, cliente=${clienteId}`);
  const svc = createServiceClient();

  const [clienteRes, salaoRes] = await Promise.all([
    svc.from("clientes").select("nome, telefone, idioma_preferido").eq("id", clienteId).single(),
    svc.from("saloes").select("nome, link_google_reviews").eq("id", salaoId).single(),
  ]);

  if (clienteRes.error) {
    console.error("[Reviews] Error fetching client:", clienteRes.error.message);
    return;
  }
  if (salaoRes.error) {
    console.error("[Reviews] Error fetching salon:", salaoRes.error.message);
    return;
  }

  const cl = clienteRes.data as { nome: string; telefone: string | null; idioma_preferido: string };
  const s = salaoRes.data as { nome: string; link_google_reviews: string | null };

  if (!cl.telefone) { console.log("[Reviews] No phone, skip"); return; }
  if (!s.link_google_reviews) { console.log("[Reviews] No review link configured, skip"); return; }

  if (!isMetaWhatsAppConfigured()) {
    console.log("[Reviews] WhatsApp Meta API not configured, skip");
    return;
  }

  // Check already sent
  const { data: alreadySent } = await svc
    .from("notificacoes_log")
    .select("id")
    .eq("agendamento_id", agendamentoId)
    .eq("tipo", "review_request")
    .limit(1);

  if (alreadySent && (alreadySent as Array<{ id: string }>).length > 0) {
    console.log("[Reviews] Already sent, skip");
    return;
  }

  console.log(`[Reviews] Sending to ${cl.nome} (${cl.telefone})...`);

  // Send via Meta Cloud API template
  const waResult = await sendWhatsAppTemplate(
    cl.telefone,
    "solicitud_resena",
    "es",
    [cl.nome, s.nome, s.link_google_reviews]
  );

  if (waResult.success) {
    await svc.from("notificacoes_log").insert({
      salao_id: salaoId,
      cliente_id: clienteId,
      agendamento_id: agendamentoId,
      tipo: "review_request",
      mensagem: `[Template: solicitud_resena] ${cl.nome}, ${s.nome}, ${s.link_google_reviews}`,
      status: "enviado",
      enviado_em: new Date().toISOString(),
    });
    console.log(`[Reviews] SUCCESS — review sent to ${cl.nome}`);
  } else {
    console.error(`[Reviews] FAILED: ${waResult.error}`);
    await svc.from("notificacoes_log").insert({
      salao_id: salaoId,
      cliente_id: clienteId,
      agendamento_id: agendamentoId,
      tipo: "review_request",
      mensagem: `[Template: solicitud_resena] ${cl.nome}, ${s.nome}`,
      status: "falhou",
    });
  }
}

export async function updateTransacaoFormaPagamento(
  transacaoId: string,
  novaForma: "efectivo" | "tarjeta" | "bizum" | "transferencia"
) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado o salón no encontrado." };
  }

  const { error } = await supabase
    .from("transacoes")
    .update({ forma_pagamento: novaForma })
    .eq("id", transacaoId)
    .eq("salao_id", salaoId);

  if (error) {
    console.error("Error updating payment method:", error);
    return { error: "Error al actualizar la forma de pago." };
  }

  revalidatePath("/dashboard/caixa");
  return { success: true };
}
