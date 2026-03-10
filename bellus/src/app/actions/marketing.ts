"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

async function getUserSalaoId(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  return (usuario as { salao_id: string } | null)?.salao_id ?? null;
}

// --- Conversas ---

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export async function getConversations() {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return [];

  const { data } = await supabase
    .from("marketing_conversas")
    .select("id, titulo, created_at, updated_at")
    .eq("salao_id", salaoId)
    .order("updated_at", { ascending: false })
    .limit(20);

  return (data as { id: string; titulo: string; created_at: string; updated_at: string }[]) || [];
}

export async function getConversation(id: string) {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return null;

  const { data } = await supabase
    .from("marketing_conversas")
    .select("*")
    .eq("id", id)
    .eq("salao_id", salaoId)
    .single();

  return data as { id: string; salao_id: string; titulo: string; mensagens: ChatMessage[]; created_at: string } | null;
}

export async function createConversation() {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return null;

  const { data } = await supabase
    .from("marketing_conversas")
    .insert({ salao_id: salaoId, titulo: "Nova conversa", mensagens: [] })
    .select("id")
    .single();

  revalidatePath("/dashboard/marketing");
  return (data as { id: string } | null)?.id ?? null;
}

export async function updateConversation(id: string, mensagens: ChatMessage[], titulo?: string) {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return;

  const update: Record<string, unknown> = {
    mensagens,
    updated_at: new Date().toISOString(),
  };
  if (titulo) update.titulo = titulo;

  await supabase
    .from("marketing_conversas")
    .update(update)
    .eq("id", id)
    .eq("salao_id", salaoId);
}

// --- Campanhas ---

export interface Campaign {
  id: string;
  plataforma: string;
  nome: string;
  tipo: string;
  status: string;
  orcamento_diario: number | null;
  orcamento_total: number | null;
  metricas: {
    impressoes: number;
    cliques: number;
    custo: number;
    alcance: number;
    conversoes: number;
  };
  data_inicio: string | null;
  data_fim: string | null;
  created_at: string;
}

export async function getCampaigns() {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return [];

  const { data } = await supabase
    .from("marketing_campanhas")
    .select("*")
    .eq("salao_id", salaoId)
    .order("created_at", { ascending: false });

  return (data as Campaign[]) || [];
}

export async function createCampaign(formData: FormData) {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return { error: "No autenticado." };

  const nome = formData.get("nome") as string;
  const plataforma = formData.get("plataforma") as string;
  const tipo = formData.get("tipo") as string;
  const orcamentoDiario = parseFloat(formData.get("orcamento_diario") as string) || null;
  const orcamentoTotal = parseFloat(formData.get("orcamento_total") as string) || null;

  if (!nome || !plataforma) return { error: "Nombre y plataforma obligatorios." };

  const { error } = await supabase.from("marketing_campanhas").insert({
    salao_id: salaoId,
    nome,
    plataforma,
    tipo: tipo || "alcance",
    orcamento_diario: orcamentoDiario,
    orcamento_total: orcamentoTotal,
    status: "rascunho",
  });

  if (error) return { error: "Error al crear campanha." };

  revalidatePath("/dashboard/marketing");
  return { success: true };
}

export async function updateCampaignStatus(id: string, status: string) {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return { error: "No autenticado." };

  const { error } = await supabase
    .from("marketing_campanhas")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("salao_id", salaoId);

  if (error) return { error: "Error al actualizar campanha." };

  revalidatePath("/dashboard/marketing");
  return { success: true };
}

// --- Integracoes ---

export interface Integration {
  id: string;
  provider: string;
  account_name: string | null;
  connected_at: string;
}

export async function getIntegrations() {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return [];

  const { data } = await supabase
    .from("marketing_integracoes")
    .select("id, provider, account_name, connected_at")
    .eq("salao_id", salaoId);

  return (data as Integration[]) || [];
}

export async function disconnectIntegration(provider: string) {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return { error: "No autenticado." };

  await supabase
    .from("marketing_integracoes")
    .delete()
    .eq("salao_id", salaoId)
    .eq("provider", provider);

  revalidatePath("/dashboard/marketing");
  return { success: true };
}

// --- Conteudos ---

export interface GeneratedContent {
  id: string;
  tipo: string;
  tom: string;
  conteudo: {
    headlines?: string[];
    descriptions?: string[];
    hashtags?: string[];
    variations?: { title: string; body: string }[];
  };
  created_at: string;
}

export async function getGeneratedContents() {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return [];

  const { data } = await supabase
    .from("marketing_conteudos")
    .select("*")
    .eq("salao_id", salaoId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data as GeneratedContent[]) || [];
}

export async function saveGeneratedContent(content: {
  tipo: string;
  tom: string;
  conteudo: Record<string, unknown>;
  servico_id?: string;
}) {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return null;

  const { data } = await supabase
    .from("marketing_conteudos")
    .insert({
      salao_id: salaoId,
      tipo: content.tipo,
      tom: content.tom,
      conteudo: content.conteudo,
      servico_id: content.servico_id || null,
    })
    .select("id")
    .single();

  revalidatePath("/dashboard/marketing");
  return (data as { id: string } | null)?.id ?? null;
}

// --- Analytics / Atribuicoes ---

export interface ChannelStats {
  canal: string;
  clientes: number;
  agendamentos: number;
  receita: number;
}

export async function getMarketingAnalytics() {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return { channels: [], totalSpend: 0, totalRevenue: 0 };

  // Atribuicoes por canal
  const { data: atribuicoes } = await supabase
    .from("marketing_atribuicoes")
    .select("canal, cliente_id")
    .eq("salao_id", salaoId);

  const channelMap: Record<string, Set<string>> = {};
  ((atribuicoes as { canal: string; cliente_id: string }[]) || []).forEach((a) => {
    if (!channelMap[a.canal]) channelMap[a.canal] = new Set();
    channelMap[a.canal].add(a.cliente_id);
  });

  // Total spend from campaigns
  const { data: campanhas } = await supabase
    .from("marketing_campanhas")
    .select("metricas")
    .eq("salao_id", salaoId);

  type CampanhaMetricas = { metricas: { custo: number } };
  const totalSpend = ((campanhas as CampanhaMetricas[]) || []).reduce(
    (sum, c) => sum + (c.metricas?.custo || 0),
    0
  );

  // Total revenue this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: txData } = await supabase
    .from("transacoes")
    .select("valor_final")
    .eq("salao_id", salaoId)
    .gte("created_at", monthStart.toISOString());

  const totalRevenue = ((txData as { valor_final: number }[]) || []).reduce(
    (sum, t) => sum + (t.valor_final || 0),
    0
  );

  const channels: ChannelStats[] = Object.entries(channelMap).map(([canal, clienteSet]) => ({
    canal,
    clientes: clienteSet.size,
    agendamentos: 0,
    receita: 0,
  }));

  return { channels, totalSpend: Math.round(totalSpend * 100) / 100, totalRevenue: Math.round(totalRevenue * 100) / 100 };
}

// --- Config ---

export async function getMarketingConfig() {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return null;

  const { data } = await supabase
    .from("marketing_config")
    .select("*")
    .eq("salao_id", salaoId)
    .single();

  if (data) return data as Record<string, unknown>;

  // Create default
  const { data: created } = await supabase
    .from("marketing_config")
    .insert({ salao_id: salaoId })
    .select("*")
    .single();

  return (created as Record<string, unknown>) || null;
}

// --- Salon context for AI chat ---

export async function getSalonContext() {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return null;

  const [salaoRes, servicosRes, clientesCountRes, agendamentosRes, campanhasRes] = await Promise.all([
    supabase.from("saloes").select("nome, endereco, whatsapp").eq("id", salaoId).single(),
    supabase.from("servicos").select("nome, preco_base, categoria, duracao_minutos").eq("salao_id", salaoId).eq("ativo", true),
    supabase.from("clientes").select("id", { count: "exact", head: true }).eq("salao_id", salaoId),
    supabase
      .from("agendamentos")
      .select("id", { count: "exact", head: true })
      .eq("salao_id", salaoId)
      .gte("data_hora_inicio", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("marketing_campanhas").select("nome, plataforma, status, metricas").eq("salao_id", salaoId).in("status", ["ativa", "pausada"]),
  ]);

  type Servico = { nome: string; preco_base: number; categoria: string; duracao_minutos: number };
  type Salao = { nome: string; endereco: string; whatsapp: string };
  type Campanha = { nome: string; plataforma: string; status: string; metricas: Record<string, number> };

  return {
    salao: salaoRes.data as Salao | null,
    servicos: (servicosRes.data as Servico[]) || [],
    totalClientes: clientesCountRes.count || 0,
    agendamentosUltimos30Dias: agendamentosRes.count || 0,
    campanhasAtivas: (campanhasRes.data as Campanha[]) || [],
  };
}
