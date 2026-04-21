"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getUserSalaoId(supabase: SupabaseClient) {
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

export interface ProfessionalCommission {
  id: string;
  name: string;
  comissaoPct: number;
  metaComissao: number;
  totalBilled: number;
  salonCut: number;
  professionalEarnings: number;
  metaReached: boolean;
  metaProgress: number; // 0-100
  transactionCount: number;
}

export interface CommissionsData {
  professionals: ProfessionalCommission[];
  totals: {
    totalBilled: number;
    totalSalonCut: number;
    totalProfessionalEarnings: number;
  };
  month: string;
  year: number;
}

export async function getCommissionsData(
  month: number,
  year: number
): Promise<CommissionsData | null> {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return null;

  // Date range for the month (YYYY-MM-DD for data_servico)
  const monthStartDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDate = month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  // Fetch professionals and transactions in parallel
  const [profRes, txRes] = await Promise.all([
    supabase
      .from("profissionais")
      .select("id, nome, comissao_salao_pct, meta_comissao_salao")
      .eq("salao_id", salaoId)
      .eq("ativo", true)
      .order("nome"),

    supabase
      .from("transacoes")
      .select("profissional_id, valor_final")
      .eq("salao_id", salaoId)
      .gte("data_servico", monthStartDate)
      .lt("data_servico", monthEndDate),
  ]);

  type ProfRow = {
    id: string;
    nome: string;
    comissao_salao_pct: number;
    meta_comissao_salao: number;
  };
  type TxRow = { profissional_id: string | null; valor_final: number };

  const professionals = (profRes.data as unknown as ProfRow[]) || [];
  const transactions = (txRes.data as unknown as TxRow[]) || [];

  // Aggregate transactions by professional
  const txByProf: Record<string, { total: number; count: number }> = {};
  for (const tx of transactions) {
    if (tx.profissional_id) {
      if (!txByProf[tx.profissional_id])
        txByProf[tx.profissional_id] = { total: 0, count: 0 };
      txByProf[tx.profissional_id].total += tx.valor_final || 0;
      txByProf[tx.profissional_id].count++;
    }
  }

  let totalBilled = 0;
  let totalSalonCut = 0;
  let totalProfessionalEarnings = 0;

  const result: ProfessionalCommission[] = professionals.map((p) => {
    const billed = Math.round((txByProf[p.id]?.total ?? 0) * 100) / 100;
    const count = txByProf[p.id]?.count ?? 0;
    const pct = p.comissao_salao_pct ?? 30;
    const meta = p.meta_comissao_salao ?? 1600;

    // Commission calculation:
    // Salon takes pct% of revenue until it reaches the monthly cap (meta)
    const salonCutRaw = billed * (pct / 100);
    const salonCut = Math.round(Math.min(salonCutRaw, meta) * 100) / 100;
    const profEarnings = Math.round((billed - salonCut) * 100) / 100;
    const metaReached = salonCutRaw >= meta;
    const metaProgress = meta > 0 ? Math.min(Math.round((salonCutRaw / meta) * 100), 100) : 0;

    totalBilled += billed;
    totalSalonCut += salonCut;
    totalProfessionalEarnings += profEarnings;

    return {
      id: p.id,
      name: p.nome,
      comissaoPct: pct,
      metaComissao: meta,
      totalBilled: billed,
      salonCut,
      professionalEarnings: profEarnings,
      metaReached,
      metaProgress,
      transactionCount: count,
    };
  });

  return {
    professionals: result,
    totals: {
      totalBilled: Math.round(totalBilled * 100) / 100,
      totalSalonCut: Math.round(totalSalonCut * 100) / 100,
      totalProfessionalEarnings: Math.round(totalProfessionalEarnings * 100) / 100,
    },
    month: `${year}-${String(month).padStart(2, "0")}`,
    year,
  };
}

export async function updateProfessionalCommission(
  profissionalId: string,
  comissaoPct: number,
  metaComissao: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const salaoId = await getUserSalaoId(supabase);
  if (!salaoId) return { success: false, error: "Not authenticated" };

  if (comissaoPct < 0 || comissaoPct > 100) {
    return { success: false, error: "Percentage must be between 0 and 100" };
  }
  if (metaComissao < 0) {
    return { success: false, error: "Target must be >= 0" };
  }

  const { error } = await supabase
    .from("profissionais")
    .update({
      comissao_salao_pct: comissaoPct,
      meta_comissao_salao: metaComissao,
    })
    .eq("id", profissionalId)
    .eq("salao_id", salaoId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
