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

  // Calculate final value
  let valorFinal = valor;
  if (tipoDesconto === "percentual" && valorDesconto > 0) {
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
    tipo_desconto: tipoDesconto,
    valor_desconto: valorDesconto,
    valor_final: Math.round(valorFinal * 100) / 100,
    forma_pagamento: formaPagamento,
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
