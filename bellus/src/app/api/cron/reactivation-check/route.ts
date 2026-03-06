import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: SupabaseClient): SupabaseClient<any> {
  return supabase as SupabaseClient<Record<string, unknown>>;
}

export async function GET() {
  try {
    const supabase = db(createServiceClient());

    const { data: configs } = await supabase
      .from("marketing_config")
      .select("salao_id, dias_inatividade_reativacao");

    type Config = { salao_id: string; dias_inatividade_reativacao: number | null };
    const configList = (configs as Config[]) || [];

    if (configList.length === 0) {
      return NextResponse.json({ message: "No salons configured", processed: 0 });
    }

    let remindersQueued = 0;

    for (const config of configList) {
      const salaoId = config.salao_id;
      const daysThreshold = config.dias_inatividade_reativacao || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

      const { data: clients } = await supabase
        .from("clientes")
        .select("id, nome, telefone, idioma_preferido")
        .eq("salao_id", salaoId)
        .eq("opt_out", false);

      type Client = { id: string; nome: string; telefone: string; idioma_preferido: string | null };
      const clientList = (clients as Client[]) || [];

      if (clientList.length === 0) continue;

      for (const client of clientList) {
        const { data: lastAppt } = await supabase
          .from("agendamentos")
          .select("data_hora_inicio")
          .eq("cliente_id", client.id)
          .eq("status", "concluido")
          .order("data_hora_inicio", { ascending: false })
          .limit(1);

        type Appt = { data_hora_inicio: string };
        const appts = (lastAppt as Appt[]) || [];
        if (appts.length === 0) continue;

        const lastDate = new Date(appts[0].data_hora_inicio);
        if (lastDate > cutoffDate) continue;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { count } = await supabase
          .from("notificacoes_log")
          .select("id", { count: "exact", head: true })
          .eq("cliente_id", client.id)
          .eq("tipo", "lembrete_retorno")
          .gte("created_at", thirtyDaysAgo.toISOString());

        if ((count || 0) > 0) continue;

        const { data: salao } = await supabase
          .from("saloes")
          .select("nome, slug")
          .eq("id", salaoId)
          .single();

        const salaoData = salao as { nome: string; slug: string } | null;
        const bookingLink = salaoData?.slug
          ? `${process.env.NEXT_PUBLIC_APP_URL}/booking/${salaoData.slug}`
          : "";

        const message = buildReactivationMessage(
          client.nome,
          salaoData?.nome || "nuestro salon",
          bookingLink,
          client.idioma_preferido || "es"
        );

        await supabase.from("notificacoes_log").insert({
          salao_id: salaoId,
          cliente_id: client.id,
          tipo: "lembrete_retorno",
          mensagem: message,
          status: "pendente",
        });

        remindersQueued++;
      }
    }

    return NextResponse.json({ message: "Reactivation check done", remindersQueued });
  } catch (error) {
    console.error("Reactivation cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildReactivationMessage(
  clientName: string,
  salonName: string,
  bookingLink: string,
  language: string
): string {
  const messages: Record<string, string> = {
    es: `Hola ${clientName}! Hace tiempo que no te vemos en ${salonName}. Te echamos de menos! Agenda tu proxima cita: ${bookingLink}`,
    pt: `Ola ${clientName}! Faz tempo que nao te vemos no ${salonName}. Sentimos sua falta! Agende sua proxima visita: ${bookingLink}`,
    en: `Hi ${clientName}! It's been a while since your last visit to ${salonName}. We miss you! Book your next appointment: ${bookingLink}`,
    ru: `Privet ${clientName}! Davno ne videli vas v ${salonName}. My skuchayem! Zapisat'sya: ${bookingLink}`,
  };

  return messages[language] || messages.es;
}
