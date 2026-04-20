import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversasView } from "./conversas-view";

export default async function ConversasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id, role")
    .eq("id", user.id)
    .single();

  if (!usuario) redirect("/login");

  const { salao_id: salaoId, role } = usuario as { salao_id: string; role: string };

  // Proprietário only
  if (role !== "proprietario") redirect("/dashboard");

  // Fetch conversas with client info
  const { data: conversas } = await supabase
    .from("conversas")
    .select("id, canal, external_id, estado, ultima_mensagem_em, created_at, cliente_id, clientes(nome, telefone)")
    .eq("salao_id", salaoId)
    .order("ultima_mensagem_em", { ascending: false });

  // Count by state for stats
  const list = (conversas ?? []) as Array<{
    id: string;
    canal: string;
    external_id: string;
    estado: string;
    ultima_mensagem_em: string | null;
    created_at: string;
    cliente_id: string | null;
    clientes: { nome: string; telefone: string } | null;
  }>;

  const stats = {
    total: list.length,
    ativas: list.filter((c) => c.estado === "ativo").length,
    aguardando: list.filter((c) => c.estado === "aguardando_humano").length,
    encerradas: list.filter((c) => c.estado === "encerrado").length,
  };

  return (
    <ConversasView
      conversas={list}
      stats={stats}
      salaoId={salaoId}
    />
  );
}
