"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

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

    const intervalo = (cliente as { intervalo_retorno_dias: number | null } | null)
      ?.intervalo_retorno_dias;

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

  // Fetch service prices
  const { data: svcData } = await supabase
    .from("servicos")
    .select("id, preco_base")
    .in("id", servicos);

  const priceMap = new Map<string, number>();
  if (svcData) {
    for (const s of svcData as { id: string; preco_base: number }[]) {
      priceMap.set(s.id, s.preco_base);
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

    const intervalo = (cliente as { intervalo_retorno_dias: number | null } | null)
      ?.intervalo_retorno_dias;

    if (intervalo && intervalo > 0) {
      const proximoRetorno = new Date();
      proximoRetorno.setDate(proximoRetorno.getDate() + intervalo);
      await supabase
        .from("clientes")
        .update({ proximo_retorno: proximoRetorno.toISOString().split("T")[0] })
        .eq("id", cliente_id);
    }
  }

  revalidatePath("/dashboard/agenda");
  revalidatePath("/dashboard/caixa");
  revalidatePath("/dashboard/clientes");
  const transacaoIds = insertedTxs?.map((t: { id: string }) => t.id) ?? [];
  return { success: true, transacaoIds };
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
