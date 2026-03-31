"use server";

import { createClient } from "@/lib/supabase/server";
import {
  submitXmlToAeat,
  canSubmitToAeat,
  getAeatEnvironment,
} from "@/lib/verifactu/aeat-client";
import type { AeatResponse } from "@/lib/verifactu/aeat-client";
import { validateVerifactuXml } from "@/lib/verifactu/xml-validator";
import { logFacturaEvento } from "./factura-eventos";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getUserSalaoId(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { salaoId: null };

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  return {
    salaoId: (usuario as { salao_id: string } | null)?.salao_id ?? null,
  };
}

// --- Submit Single Factura ---

/**
 * Envia uma fatura à AEAT.
 * Se não há certificado configurado, a fatura fica como pendiente.
 */
export async function submitFacturaToAeat(facturaId: string) {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);
  if (!salaoId) return { error: "No autenticado" };

  // Fetch factura
  const { data: factura, error: fetchErr } = await supabase
    .from("facturas")
    .select("id, xml_verifactu, estado_aeat, numero_completo, salao_id")
    .eq("id", facturaId)
    .eq("salao_id", salaoId)
    .single();

  if (fetchErr || !factura) return { error: "Factura no encontrada" };
  if (!factura.xml_verifactu) return { error: "Factura sin XML Verifactu generado" };
  if (factura.estado_aeat === "aceptado") return { error: "Factura ya aceptada por la AEAT" };

  // Validate XML before submission
  const validation = validateVerifactuXml(factura.xml_verifactu);
  if (!validation.valid) {
    await logFacturaEvento({
      factura_id: facturaId,
      tipo_evento: "error_aeat",
      detalle: {
        action: "xml_validation_failed",
        errors: validation.errors,
        environment: getAeatEnvironment(),
      },
    });

    return {
      error: `XML inválido (${validation.errors.length} erro${validation.errors.length > 1 ? "s" : ""}): ${validation.errors[0]}`,
    };
  }

  // Check if we can actually submit
  if (!canSubmitToAeat()) {
    // Record as pending — no certificate available
    await supabase.from("factura_envios_aeat").insert({
      factura_id: facturaId,
      xml_enviado: factura.xml_verifactu,
      status: "pendiente",
      response_code: "NO_CERT",
      response_body: "Certificado digital no configurado. Envio pendiente.",
    });

    await logFacturaEvento({
      factura_id: facturaId,
      tipo_evento: "envio_aeat",
      detalle: {
        status: "pendiente",
        reason: "no_certificate",
        environment: getAeatEnvironment(),
      },
    });

    return {
      data: {
        status: "pendiente" as const,
        message: "Certificado digital no configurado. La factura queda pendiente de envio.",
      },
    };
  }

  // Submit to AEAT
  let response: AeatResponse;
  try {
    response = await submitXmlToAeat(factura.xml_verifactu);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";

    await supabase.from("factura_envios_aeat").insert({
      factura_id: facturaId,
      xml_enviado: factura.xml_verifactu,
      status: "error",
      response_code: "EXCEPTION",
      response_body: message,
    });

    await logFacturaEvento({
      factura_id: facturaId,
      tipo_evento: "error_aeat",
      detalle: { error: message, environment: getAeatEnvironment() },
    });

    return { error: `Error al enviar a AEAT: ${message}` };
  }

  // Record submission
  const envioStatus = response.success ? "aceptado" : response.status === "rechazado" ? "rechazado" : "error";

  await supabase.from("factura_envios_aeat").insert({
    factura_id: facturaId,
    xml_enviado: factura.xml_verifactu,
    status: envioStatus,
    response_code: response.response_code,
    response_body: response.response_body,
    enviado_em: new Date().toISOString(),
  });

  // Update factura estado_aeat
  if (response.success) {
    await supabase
      .from("facturas")
      .update({ estado_aeat: "aceptado" })
      .eq("id", facturaId);
  } else if (response.status === "rechazado") {
    await supabase
      .from("facturas")
      .update({ estado_aeat: "rechazado" })
      .eq("id", facturaId);
  }

  // Log event
  await logFacturaEvento({
    factura_id: facturaId,
    tipo_evento: response.success ? "envio_aeat" : "error_aeat",
    detalle: {
      status: envioStatus,
      response_code: response.response_code,
      csv: response.csv,
      error: response.error_description,
      environment: getAeatEnvironment(),
    },
  });

  return {
    data: {
      status: envioStatus,
      response_code: response.response_code,
      csv: response.csv,
      error_description: response.error_description,
    },
  };
}

// --- Retry Pending Facturas ---

/**
 * Reenvia todas as faturas pendientes à AEAT.
 * Retorna contagem de sucessos e falhas.
 */
export async function retryPendingFacturas() {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);
  if (!salaoId) return { error: "No autenticado" };

  if (!canSubmitToAeat()) {
    return { error: "Certificado digital no configurado. No es posible enviar." };
  }

  // Get all pending facturas
  const { data: pending, error: queryErr } = await supabase
    .from("facturas")
    .select("id, numero_completo")
    .eq("salao_id", salaoId)
    .eq("estado_aeat", "pendiente")
    .order("created_at", { ascending: true });

  if (queryErr) return { error: "Error al consultar facturas pendientes" };
  if (!pending || pending.length === 0) {
    return { data: { total: 0, success: 0, failed: 0, results: [] } };
  }

  const results: Array<{ factura_id: string; numero: string; status: string }> = [];
  let success = 0;
  let failed = 0;

  for (const f of pending) {
    const result = await submitFacturaToAeat(f.id);
    if (result.data && result.data.status === "aceptado") {
      success++;
      results.push({ factura_id: f.id, numero: f.numero_completo, status: "aceptado" });
    } else {
      failed++;
      results.push({
        factura_id: f.id,
        numero: f.numero_completo,
        status: result.error || result.data?.status || "error",
      });
    }
  }

  // Log summary event
  await logFacturaEvento({
    factura_id: null,
    tipo_evento: "envio_aeat",
    detalle: {
      action: "retry_pending",
      total: pending.length,
      success,
      failed,
      environment: getAeatEnvironment(),
    },
  });

  return { data: { total: pending.length, success, failed, results } };
}

// --- Get Pending Count ---

/**
 * Retorna a contagem de faturas pendientes de envio à AEAT.
 */
export async function getPendingFacturasCount() {
  const supabase = await createClient();
  const { salaoId: sId } = await getUserSalaoId(supabase);
  if (!sId) return { error: "No autenticado", count: 0 };

  const { count, error } = await supabase
    .from("facturas")
    .select("id", { count: "exact", head: true })
    .eq("salao_id", sId)
    .eq("estado_aeat", "pendiente");

  if (error) return { error: error.message, count: 0 };
  return { count: count || 0 };
}

// --- Stats for Dashboard ---

export interface FacturasAeatStats {
  pendientes: number;
  rechazadas: number;
  aceptadas: number;
  rechazadasAntigas: number; // > 24h sem resolver
}

/**
 * Retorna contadores de faturas por estado AEAT para o dashboard.
 */
export async function getFacturasAeatStats(): Promise<{ data: FacturasAeatStats | null; error: string | null }> {
  const supabase = await createClient();
  const { salaoId } = await getUserSalaoId(supabase);
  if (!salaoId) return { data: null, error: "No autenticado" };

  const [pendientesRes, rechazadasRes, aceptadasRes, rechazadasAntigasRes] = await Promise.all([
    supabase
      .from("facturas")
      .select("id", { count: "exact", head: true })
      .eq("salao_id", salaoId)
      .eq("estado_aeat", "pendiente"),
    supabase
      .from("facturas")
      .select("id", { count: "exact", head: true })
      .eq("salao_id", salaoId)
      .eq("estado_aeat", "rechazado"),
    supabase
      .from("facturas")
      .select("id", { count: "exact", head: true })
      .eq("salao_id", salaoId)
      .eq("estado_aeat", "aceptado"),
    supabase
      .from("facturas")
      .select("id", { count: "exact", head: true })
      .eq("salao_id", salaoId)
      .eq("estado_aeat", "rechazado")
      .lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return {
    data: {
      pendientes: pendientesRes.count || 0,
      rechazadas: rechazadasRes.count || 0,
      aceptadas: aceptadasRes.count || 0,
      rechazadasAntigas: rechazadasAntigasRes.count || 0,
    },
    error: null,
  };
}
