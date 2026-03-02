import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ClienteFicha } from "./cliente-ficha";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: SupabaseClient): SupabaseClient<any> {
  return supabase as SupabaseClient<Record<string, unknown>>;
}

interface ClientePageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientePage({ params }: ClientePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuario } = await db(supabase)
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  if (!usuario) redirect("/login");
  const salaoId = (usuario as { salao_id: string }).salao_id;

  // Fetch client
  const { data: cliente } = await db(supabase)
    .from("clientes")
    .select("*")
    .eq("id", id)
    .eq("salao_id", salaoId)
    .single();

  if (!cliente) notFound();

  const cl = cliente as {
    id: string;
    nome: string;
    telefone: string;
    email: string | null;
    idioma_preferido: string;
    notas: string | null;
    intervalo_retorno_dias: number | null;
    opt_out_notificacoes: boolean;
    proximo_retorno: string | null;
    created_at: string;
  };

  // Fetch visit history (agendamentos with service and professional)
  const { data: visitas } = await db(supabase)
    .from("agendamentos")
    .select("id, data_hora_inicio, data_hora_fim, status, notas, servico_id, profissional_id")
    .eq("cliente_id", id)
    .eq("salao_id", salaoId)
    .order("data_hora_inicio", { ascending: false })
    .limit(50);

  const visitasList = (visitas ?? []) as Array<{
    id: string;
    data_hora_inicio: string;
    data_hora_fim: string;
    status: string;
    notas: string | null;
    servico_id: string;
    profissional_id: string;
  }>;

  // Fetch service names
  const servicoIds = [...new Set(visitasList.map((v) => v.servico_id))];
  const { data: servicos } = servicoIds.length > 0
    ? await db(supabase).from("servicos").select("id, nome, preco_base").in("id", servicoIds)
    : { data: [] };

  const servicoMap = new Map(
    ((servicos ?? []) as Array<{ id: string; nome: string; preco_base: number }>).map((s) => [s.id, s])
  );

  // Fetch professional names
  const profIds = [...new Set(visitasList.map((v) => v.profissional_id))];
  const { data: profs } = profIds.length > 0
    ? await db(supabase).from("profissionais").select("id, nome").in("id", profIds)
    : { data: [] };

  const profMap = new Map(
    ((profs ?? []) as Array<{ id: string; nome: string }>).map((p) => [p.id, p])
  );

  // Build enriched visits
  const enrichedVisits = visitasList.map((v) => ({
    ...v,
    servico_nome: servicoMap.get(v.servico_id)?.nome ?? "—",
    servico_preco: servicoMap.get(v.servico_id)?.preco_base ?? 0,
    profissional_nome: profMap.get(v.profissional_id)?.nome ?? "—",
  }));

  // Calculate totals
  const completedVisits = enrichedVisits.filter((v) => v.status === "concluido");
  const totalSpent = completedVisits.reduce((sum, v) => sum + v.servico_preco, 0);

  // Fetch salon slug for booking link
  const { data: salao } = await db(supabase)
    .from("saloes")
    .select("slug")
    .eq("id", salaoId)
    .single();

  const slug = (salao as { slug: string } | null)?.slug ?? "";

  return (
    <ClienteFicha
      cliente={cl}
      visitas={enrichedVisits}
      totalVisitas={completedVisits.length}
      totalSpent={totalSpent}
      salaoSlug={slug}
    />
  );
}
