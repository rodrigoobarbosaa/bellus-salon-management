import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { handleConfirmationTimeout } from "@/lib/notifications/handle-confirmation";

/**
 * GET /api/cron/confirmation-check
 * Checks for unresponsive confirmation requests and notifies professionals.
 * Runs every 2 hours.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find conversations with confirmation context
  const { data: conversas, error } = await supabase
    .from("conversas")
    .select("id, salao_id, contexto")
    .not("contexto", "is", null);

  if (error) {
    console.error("[ConfirmationCheck] Error fetching conversas:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const now = new Date();
  let processed = 0;
  let skipped = 0;

  for (const conv of (conversas ?? []) as Array<{ id: string; salao_id: string; contexto: Record<string, unknown> }>) {
    const ctx = conv.contexto;
    if (!ctx?.awaiting_confirmation) continue;

    const expiresAt = ctx.expires_at ? new Date(ctx.expires_at as string) : null;
    if (!expiresAt || expiresAt > now) {
      skipped++;
      continue;
    }

    // Expired — handle timeout
    await handleConfirmationTimeout(supabase, conv.salao_id, conv.id, ctx);
    processed++;
  }

  console.log(`[ConfirmationCheck] Processed: ${processed}, Still waiting: ${skipped}`);
  return NextResponse.json({ processed, skipped });
}
