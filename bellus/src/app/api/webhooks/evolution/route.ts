import { NextResponse } from "next/server";

/**
 * Evolution API webhook — DEPRECATED.
 * Migrated to Meta Cloud API (/api/webhooks/meta).
 * This endpoint returns 410 Gone.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Evolution API webhook deprecated. Use /api/webhooks/meta" },
    { status: 410 }
  );
}
