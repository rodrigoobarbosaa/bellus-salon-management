import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ClientesList } from "./clientes-list";

export default async function ClientesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  if (!usuario) redirect("/login");

  const salaoId = (usuario as { salao_id: string }).salao_id;

  // Fetch all clients
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nome, telefone, email, idioma_preferido, opt_out_notificacoes, proximo_retorno, created_at")
    .eq("salao_id", salaoId)
    .order("nome");

  // Count total and pending return
  const clientesList = (clientes ?? []) as Array<{
    id: string;
    nome: string;
    telefone: string;
    email: string | null;
    idioma_preferido: string;
    opt_out_notificacoes: boolean;
    proximo_retorno: string | null;
    created_at: string;
  }>;

  const today = new Date().toISOString().slice(0, 10);
  const pendingReturn = clientesList.filter(
    (c) => c.proximo_retorno && c.proximo_retorno <= today
  ).length;

  // Fetch notification stats for conversion dashboard
  const { data: notifStats } = await supabase
    .from("notificacoes_log")
    .select("id, tipo, status, cliente_id")
    .eq("salao_id", salaoId)
    .eq("tipo", "lembrete_retorno");

  const returnNotifs = (notifStats ?? []) as Array<{
    id: string;
    tipo: string;
    status: string;
    cliente_id: string;
  }>;

  return (
    <ClientesList
      clientes={clientesList}
      totalClientes={clientesList.length}
      pendingReturn={pendingReturn}
      returnNotifs={returnNotifs}
    />
  );
}
