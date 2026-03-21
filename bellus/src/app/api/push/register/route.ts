import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/push/register
 * Body: { clienteId: string, pushToken: string, platform: "ios" | "android" }
 * Stores the Expo push token for a client.
 */
export async function POST(request: NextRequest) {
  // Auth check
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clienteId, pushToken, platform } = body;

    if (!clienteId || !pushToken) {
      return NextResponse.json(
        { error: "clienteId and pushToken are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient() as unknown as SupabaseClient;

    // Upsert push token
    const { error } = await supabase.from("push_tokens").upsert(
      {
        cliente_id: clienteId,
        token: pushToken,
        platform: platform || "unknown",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cliente_id" }
    );

    if (error) {
      console.error("Error storing push token:", error);
      return NextResponse.json(
        { error: "Failed to store push token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
