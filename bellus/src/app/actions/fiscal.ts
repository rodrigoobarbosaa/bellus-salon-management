"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getUserSalaoId(supabase: SupabaseClient) {
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

// --- Despesas ---

export async function createDespesa(formData: FormData) {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return { error: "No autenticado." };

  const descricao = formData.get("descricao") as string;
  const categoria = formData.get("categoria") as string;
  const valor = parseFloat(formData.get("valor") as string);
  const data = (formData.get("data") as string) || new Date().toISOString().split("T")[0];
  const notas = (formData.get("notas") as string) || null;

  if (!descricao || !categoria || isNaN(valor) || valor <= 0) {
    return { error: "Datos incompletos." };
  }

  const { error } = await supabase.from("despesas").insert({
    salao_id: salaoId,
    descricao,
    categoria: categoria as "produtos" | "aluguel" | "formacao" | "suprimentos" | "cuota_autonomos" | "outros",
    valor,
    data,
    notas,
  });

  if (error) return { error: "Error al registrar el gasto." };

  revalidatePath("/dashboard/fiscal");
  return { success: true };
}

export async function deleteDespesa(id: string) {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return { error: "No autenticado." };

  const { error } = await supabase
    .from("despesas")
    .delete()
    .eq("id", id)
    .eq("salao_id", salaoId);

  if (error) return { error: "Error al eliminar el gasto." };

  revalidatePath("/dashboard/fiscal");
  return { success: true };
}

// --- Configurações Fiscais ---

export async function getOrCreateConfigFiscal() {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return { error: "No autenticado.", data: null };

  const { data: existing } = await supabase
    .from("configuracoes_fiscais")
    .select("*")
    .eq("salao_id", salaoId)
    .single();

  if (existing) {
    return { data: existing as ConfigFiscal };
  }

  // Create default config
  const { data: created, error } = await supabase
    .from("configuracoes_fiscais")
    .insert({
      salao_id: salaoId,
      iva_pct: 21,
      irpf_pct: 15,
      cuota_autonomos_mensual: 0,
    })
    .select("*")
    .single();

  if (error) return { error: "Error al crear configuración fiscal.", data: null };

  return { data: created as ConfigFiscal };
}

interface ConfigFiscal {
  id: string;
  salao_id: string;
  iva_pct: number;
  irpf_pct: number;
  cuota_autonomos_mensual: number;
  nif: string | null;
  nombre_fiscal: string | null;
}

export async function updateConfigFiscal(formData: FormData) {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return { error: "No autenticado." };

  const ivaPct = parseFloat(formData.get("iva_pct") as string);
  const irpfPct = parseFloat(formData.get("irpf_pct") as string);
  const cuota = parseFloat(formData.get("cuota_autonomos_mensual") as string) || 0;
  const nif = (formData.get("nif") as string) || null;
  const nombreFiscal = (formData.get("nombre_fiscal") as string) || null;
  const emitirFacturaAuto = formData.get("emitir_factura_auto") !== "false";

  if (isNaN(ivaPct) || isNaN(irpfPct)) {
    return { error: "Los porcentajes son obligatorios." };
  }

  const { error } = await supabase
    .from("configuracoes_fiscais")
    .update({
      iva_pct: ivaPct,
      irpf_pct: irpfPct,
      cuota_autonomos_mensual: cuota,
      nif,
      nombre_fiscal: nombreFiscal,
      emitir_factura_auto: emitirFacturaAuto,
      updated_at: new Date().toISOString(),
    })
    .eq("salao_id", salaoId);

  if (error) return { error: "Error al actualizar configuración fiscal." };

  revalidatePath("/dashboard/fiscal");
  return { success: true };
}
