import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/conversas/[id]/mensagens — Fetch messages for a conversation.
 * Authenticated (requires logged-in user with access to the salon).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversaId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user has access to this conversation's salon
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  if (!usuario) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const salaoId = (usuario as { salao_id: string }).salao_id;

  // Verify conversa belongs to this salon
  const { data: conversa } = await supabase
    .from("conversas")
    .select("id")
    .eq("id", conversaId)
    .eq("salao_id", salaoId)
    .single();

  if (!conversa) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch messages
  const { data: mensagens } = await supabase
    .from("conversas_mensagens")
    .select("id, direcao, tipo, conteudo, status, created_at")
    .eq("conversa_id", conversaId)
    .order("created_at", { ascending: true })
    .limit(100);

  return NextResponse.json({ mensagens: mensagens ?? [] });
}
