"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TipoEventoFactura, FacturaEvento } from "@/lib/verifactu/types";

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

// ============================================================
// logFacturaEvento — registra evento inalterável no audit log
// ============================================================
export async function logFacturaEvento(params: {
  factura_id?: string | null;
  tipo_evento: TipoEventoFactura;
  detalle?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { userId, salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado." };
  }

  const { error } = await supabase.from("factura_eventos").insert({
    factura_id: params.factura_id ?? null,
    salao_id: salaoId,
    tipo_evento: params.tipo_evento,
    detalle: params.detalle ?? {},
    usuario_id: userId,
  });

  if (error) {
    console.error("Error logging factura evento:", error);
    return { error: "Error al registrar evento." };
  }

  return { success: true };
}

// ============================================================
// getFacturaEventos — timeline de eventos de uma fatura
// ============================================================
export async function getFacturaEventos(facturaId: string) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado.", data: null };
  }

  const { data, error } = await supabase
    .from("factura_eventos")
    .select("*")
    .eq("factura_id", facturaId)
    .eq("salao_id", salaoId)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: "Error al obtener eventos.", data: null };
  }

  return { data: (data ?? []) as FacturaEvento[], error: null };
}

// ============================================================
// getAuditLog — consulta geral do audit log com paginação
// ============================================================
export async function getAuditLog(filters: {
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_evento?: TipoEventoFactura;
  page?: number;
  per_page?: number;
} = {}) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);

  if (!salaoId) {
    return { error: "No autenticado.", data: null, count: 0 };
  }

  const page = filters.page ?? 1;
  const perPage = filters.per_page ?? 50;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("factura_eventos")
    .select("*", { count: "exact" })
    .eq("salao_id", salaoId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.fecha_desde) {
    query = query.gte("created_at", filters.fecha_desde);
  }
  if (filters.fecha_hasta) {
    query = query.lte("created_at", filters.fecha_hasta);
  }
  if (filters.tipo_evento) {
    query = query.eq("tipo_evento", filters.tipo_evento);
  }

  const { data, error, count } = await query;

  if (error) {
    return { error: "Error al obtener audit log.", data: null, count: 0 };
  }

  return {
    data: (data ?? []) as FacturaEvento[],
    count: count ?? 0,
    error: null,
  };
}
