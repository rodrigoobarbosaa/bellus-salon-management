import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyOptOutToken } from "@/lib/opt-out-token";

/**
 * GET /api/opt-out?client_id=X&token=Y
 * Public endpoint for clients to opt out of notifications via link.
 * Requires a valid HMAC token to prevent IDOR attacks.
 */
export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id");
  const token = request.nextUrl.searchParams.get("token");

  if (!clientId || !token) {
    return new NextResponse(optOutPage("error", "Enlace inválido."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Verify HMAC token to prevent unauthorized opt-out of arbitrary clients
  try {
    if (!verifyOptOutToken(clientId, token)) {
      return new NextResponse(optOutPage("error", "Enlace inválido o expirado."), {
        headers: { "Content-Type": "text/html" },
      });
    }
  } catch {
    return new NextResponse(optOutPage("error", "Enlace inválido o expirado."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("clientes")
    .update({ opt_out_notificacoes: true, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (error) {
    return new NextResponse(optOutPage("error", "Error al procesar tu solicitud."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  return new NextResponse(
    optOutPage("success", "Has dejado de recibir notificaciones de este salón."),
    { headers: { "Content-Type": "text/html" } }
  );
}

function optOutPage(status: "success" | "error", message: string) {
  const icon = status === "success" ? "✅" : "❌";
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificaciones — Bellus</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafaf9; }
    .card { text-align: center; padding: 2rem; max-width: 400px; }
    .icon { font-size: 3rem; }
    .msg { margin-top: 1rem; color: #44403c; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <p class="msg">${message}</p>
  </div>
</body>
</html>`;
}
