import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { submitXmlToAeat, canSubmitToAeat } from "@/lib/verifactu/aeat-client";

/**
 * GET /api/cron/verifactu-retry
 *
 * Processa faturas pendientes/error e reenvia à AEAT com backoff exponencial.
 * Schedule: cada 30min via Vercel Cron.
 * Protected by CRON_SECRET header.
 *
 * Backoff: 5min, 15min, 1h, 6h, 24h (max 5 tentativas).
 * Erros retryable: NETWORK_ERROR, HTTP_5xx, SOAP_FAULT (server-side).
 * Erros non-retryable: HTTP_4xx (exceto 429), PARSE_ERROR com rechazo.
 */

const BACKOFF_MINUTES = [5, 15, 60, 360, 1440]; // 5min, 15min, 1h, 6h, 24h
const MAX_RETRIES = 5;

// Response codes que NÃO devem ser reenviados (erros de validação/client)
const NON_RETRYABLE_CODES = new Set([
  "HTTP_400",
  "HTTP_401",
  "HTTP_403",
  "HTTP_404",
  "HTTP_422",
]);

function isRetryableError(responseCode: string): boolean {
  if (NON_RETRYABLE_CODES.has(responseCode)) return false;
  // Rechazado pela AEAT = erro de validação, não retry
  if (responseCode === "UNKNOWN" || responseCode === "PARSE_ERROR") return false;
  // Network errors, server errors, SOAP faults = retry
  return true;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canSubmitToAeat()) {
    return NextResponse.json({
      skipped: true,
      reason: "No AEAT certificate configured",
    });
  }

  const supabase = createServiceClient();
  const now = new Date();

  // Fetch all facturas eligible for retry (pendiente or error, not rechazado)
  const { data: facturas, error: fetchErr } = await supabase
    .from("facturas")
    .select("id, salao_id, xml_verifactu, estado_aeat, numero_completo, created_at")
    .in("estado_aeat", ["pendiente", "enviado"])
    .not("xml_verifactu", "is", null)
    .order("created_at", { ascending: true })
    .limit(50);

  if (fetchErr || !facturas || facturas.length === 0) {
    return NextResponse.json({
      processed: 0,
      message: fetchErr?.message || "No pending facturas",
    });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let maxRetriesReached = 0;

  for (const factura of facturas) {
    // Count previous attempts
    const { count: attemptCount } = await supabase
      .from("factura_envios_aeat")
      .select("id", { count: "exact", head: true })
      .eq("factura_id", factura.id);

    const attempts = attemptCount || 0;

    // Max retries reached — mark as permanent error
    if (attempts >= MAX_RETRIES) {
      // Check if last attempt had a non-retryable error
      const { data: lastEnvio } = await supabase
        .from("factura_envios_aeat")
        .select("response_code")
        .eq("factura_id", factura.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Update to rechazado (permanent failure after max retries)
      await supabase
        .from("facturas")
        .update({ estado_aeat: "rechazado" })
        .eq("id", factura.id);

      await supabase.from("factura_eventos").insert({
        factura_id: factura.id,
        salao_id: factura.salao_id,
        tipo_evento: "error_aeat",
        detalle: {
          action: "max_retries_reached",
          attempts,
          last_code: lastEnvio?.response_code || "unknown",
        },
      });

      maxRetriesReached++;
      continue;
    }

    // Check backoff — should we retry now?
    if (attempts > 0) {
      const { data: lastEnvio } = await supabase
        .from("factura_envios_aeat")
        .select("created_at, response_code")
        .eq("factura_id", factura.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lastEnvio) {
        // Non-retryable error — skip
        if (!isRetryableError(lastEnvio.response_code || "")) {
          skipped++;
          continue;
        }

        // Backoff check
        const backoffMinutes = BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];
        const lastAttempt = new Date(lastEnvio.created_at);
        const nextRetry = new Date(lastAttempt.getTime() + backoffMinutes * 60 * 1000);

        if (now < nextRetry) {
          skipped++;
          continue;
        }
      }
    }

    // Submit to AEAT
    const response = await submitXmlToAeat(factura.xml_verifactu!);

    // Record envio
    await supabase.from("factura_envios_aeat").insert({
      factura_id: factura.id,
      xml_enviado: factura.xml_verifactu,
      status: response.success ? "aceptado" : response.status === "rechazado" ? "rechazado" : "error",
      response_code: response.response_code,
      response_body: response.response_body.substring(0, 5000), // truncate large responses
      enviado_em: now.toISOString(),
    });

    // Update factura estado
    if (response.success) {
      await supabase
        .from("facturas")
        .update({ estado_aeat: "aceptado" })
        .eq("id", factura.id);
      sent++;
    } else if (response.status === "rechazado") {
      await supabase
        .from("facturas")
        .update({ estado_aeat: "rechazado" })
        .eq("id", factura.id);
      failed++;
    } else {
      failed++;
    }

    // Log event
    await supabase.from("factura_eventos").insert({
      factura_id: factura.id,
      salao_id: factura.salao_id,
      tipo_evento: response.success ? "envio_aeat" : "error_aeat",
      detalle: {
        action: "cron_retry",
        attempt: attempts + 1,
        response_code: response.response_code,
        error: response.error_description,
      },
    });
  }

  return NextResponse.json({
    processed: facturas.length,
    sent,
    skipped,
    failed,
    maxRetriesReached,
    timestamp: now.toISOString(),
  });
}
