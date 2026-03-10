import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = db(createServiceClient());

    const now = new Date();
    if (now.getDay() !== 1) {
      return NextResponse.json({ message: "Not Monday, skipping", processed: 0 });
    }

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: configs } = await supabase
      .from("marketing_config")
      .select("salao_id")
      .eq("relatorio_semanal_ativo", true);

    type Config = { salao_id: string };
    const configList = (configs as Config[]) || [];

    if (configList.length === 0) {
      return NextResponse.json({ message: "No salons with weekly report", processed: 0 });
    }

    let reportsSent = 0;

    for (const config of configList) {
      const salaoId = config.salao_id;

      const { data: salao } = await supabase
        .from("saloes")
        .select("nome, whatsapp")
        .eq("id", salaoId)
        .single();

      const salaoData = salao as { nome: string; whatsapp: string } | null;
      if (!salaoData?.whatsapp) continue;

      const { count: appointmentCount } = await supabase
        .from("agendamentos")
        .select("id", { count: "exact", head: true })
        .eq("salao_id", salaoId)
        .gte("data_hora_inicio", weekAgo.toISOString())
        .eq("status", "concluido");

      const { data: txData } = await supabase
        .from("transacoes")
        .select("valor_final")
        .eq("salao_id", salaoId)
        .gte("created_at", weekAgo.toISOString());

      const revenue = ((txData as { valor_final: number }[]) || []).reduce(
        (sum, t) => sum + (t.valor_final || 0),
        0
      );

      const { count: campaignCount } = await supabase
        .from("marketing_campanhas")
        .select("id", { count: "exact", head: true })
        .eq("salao_id", salaoId)
        .eq("status", "ativa");

      const { data: campanhas } = await supabase
        .from("marketing_campanhas")
        .select("metricas")
        .eq("salao_id", salaoId)
        .gte("updated_at", weekAgo.toISOString());

      type CampMetricas = { metricas: { custo?: number } };
      const campaignSpend = ((campanhas as CampMetricas[]) || []).reduce(
        (sum, c) => sum + (c.metricas?.custo || 0),
        0
      );

      const fmt = (v: number) => v.toFixed(2);

      const reportText = [
        `Resumen semanal - ${salaoData.nome}`,
        ``,
        `Citas completadas: ${appointmentCount || 0}`,
        `Ingresos: ${fmt(revenue)} EUR`,
        `Campanhas activas: ${campaignCount || 0}`,
        `Gasto en anuncios: ${fmt(campaignSpend)} EUR`,
        ``,
        `Abre Bellus para ver mas detalles.`,
      ].join("\n");

      await supabase.from("notificacoes_log").insert({
        salao_id: salaoId,
        tipo: "lembrete_retorno",
        mensagem: reportText,
        status: "pendente",
      });

      reportsSent++;
    }

    return NextResponse.json({ message: "Weekly reports generated", reportsSent });
  } catch (error) {
    console.error("Weekly report cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
