import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createServiceClient() as unknown as SupabaseClient;

    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Get all salons with marketing config
    const { data: configs } = await supabase
      .from("marketing_config")
      .select("salao_id, ocupacao_minima_trigger")
      .eq("relatorio_semanal_ativo", true);

    type Config = { salao_id: string; ocupacao_minima_trigger: number | null };
    const configList = (configs as Config[]) || [];

    if (configList.length === 0) {
      return NextResponse.json({ message: "No salons with marketing config", processed: 0 });
    }

    let triggersCreated = 0;

    for (const config of configList) {
      const salaoId = config.salao_id;
      const minOccupancy = config.ocupacao_minima_trigger || 60;

      const { data: profs } = await supabase
        .from("profissionais")
        .select("id")
        .eq("salao_id", salaoId)
        .eq("ativo", true);

      if (!profs || profs.length === 0) continue;

      const { count: appointmentCount } = await supabase
        .from("agendamentos")
        .select("id", { count: "exact", head: true })
        .eq("salao_id", salaoId)
        .gte("data_hora_inicio", now.toISOString())
        .lte("data_hora_inicio", in48h.toISOString())
        .neq("status", "cancelado");

      const totalSlots = profs.length * 16;
      const occupancy = totalSlots > 0 ? ((appointmentCount || 0) / totalSlots) * 100 : 100;

      if (occupancy < minOccupancy) {
        await supabase.from("marketing_conversas").insert({
          salao_id: salaoId,
          titulo: `[Auto] Baja ocupacion: ${Math.round(occupancy)}%`,
          mensagens: [
            {
              role: "assistant",
              content: `He detectado que la ocupacion de tu agenda para las proximas 48 horas es solo del ${Math.round(occupancy)}%. Te sugiero crear una campanha promocional para llenar esos horarios vacios. Quieres que te prepare una propuesta?`,
              timestamp: now.toISOString(),
            },
          ],
        });

        triggersCreated++;
      }
    }

    return NextResponse.json({ message: "Marketing triggers processed", triggersCreated });
  } catch (error) {
    console.error("Marketing triggers cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
