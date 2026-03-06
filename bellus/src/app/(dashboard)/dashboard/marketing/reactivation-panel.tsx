"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Send, Clock } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface InactiveClient {
  id: string;
  nome: string;
  telefone: string;
  ultimo_servico: string;
  dias_inativo: number;
}

export function ReactivationPanel() {
  const t = useTranslations("marketing");
  const [clients, setClients] = useState<InactiveClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysThreshold, setDaysThreshold] = useState(90);

  const fetchInactiveClients = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

      // Get clients with their last appointment
      const { data: clientsData } = await supabase
        .from("clientes" as string)
        .select("id, nome, telefone")
        .eq("opt_out", false);

      if (!clientsData) {
        setClients([]);
        return;
      }

      // For each client, check last appointment
      const inactive: InactiveClient[] = [];

      for (const client of clientsData as { id: string; nome: string; telefone: string }[]) {
        const { data: lastAppt } = await supabase
          .from("agendamentos" as string)
          .select("data_hora_inicio, servico_id")
          .eq("cliente_id", client.id)
          .eq("status", "concluido")
          .order("data_hora_inicio", { ascending: false })
          .limit(1);

        const appts = lastAppt as { data_hora_inicio: string; servico_id: string }[] | null;
        if (appts && appts.length > 0) {
          const lastDate = new Date(appts[0].data_hora_inicio);
          const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysSince >= daysThreshold) {
            // Get service name
            let serviceName = "—";
            if (appts[0].servico_id) {
              const { data: svc } = await supabase
                .from("servicos" as string)
                .select("nome")
                .eq("id", appts[0].servico_id)
                .single();
              serviceName = (svc as { nome: string } | null)?.nome || "—";
            }

            inactive.push({
              id: client.id,
              nome: client.nome,
              telefone: client.telefone,
              ultimo_servico: serviceName,
              dias_inativo: daysSince,
            });
          }
        }
      }

      inactive.sort((a, b) => b.dias_inativo - a.dias_inativo);
      setClients(inactive.slice(0, 20));
    } catch (error) {
      console.error("Error fetching inactive clients:", error);
    } finally {
      setLoading(false);
    }
  }, [daysThreshold]);

  useEffect(() => {
    fetchInactiveClients();
  }, [fetchInactiveClients]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-900">{t("reactivationTitle")}</h3>
        <select
          value={daysThreshold}
          onChange={(e) => setDaysThreshold(Number(e.target.value))}
          className="rounded-md border border-stone-200 px-2 py-1 text-sm"
        >
          <option value={60}>60 {t("days")}</option>
          <option value={90}>90 {t("days")}</option>
          <option value={120}>120 {t("days")}</option>
          <option value={180}>180 {t("days")}</option>
        </select>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-stone-400">{t("loading")}</p>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <UserCheck className="mx-auto mb-2 size-8 text-green-300" />
            <p className="text-sm text-stone-400">{t("noInactiveClients")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-stone-900">{client.nome}</p>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span>{client.ultimo_servico}</span>
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <Clock className="size-3" />
                      {client.dias_inativo} {t("days")}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Send className="mr-1 size-3" /> {t("sendReminder")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
