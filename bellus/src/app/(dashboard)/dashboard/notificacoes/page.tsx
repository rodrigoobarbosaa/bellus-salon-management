import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TemplateEditor } from "./template-editor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: SupabaseClient): SupabaseClient<any> {
  return supabase as SupabaseClient<Record<string, unknown>>;
}

export default async function NotificacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuario } = await db(supabase)
    .from("usuarios")
    .select("salao_id, role")
    .eq("id", user.id)
    .single();

  if (!usuario || (usuario as { role: string }).role !== "proprietario") {
    redirect("/dashboard");
  }

  const salaoId = (usuario as { salao_id: string }).salao_id;

  // Fetch existing custom templates
  const { data: templates } = await db(supabase)
    .from("notification_templates")
    .select("*")
    .eq("salao_id", salaoId)
    .order("tipo")
    .order("idioma");

  const existingTemplates = (templates ?? []) as Array<{
    id: string;
    tipo: string;
    idioma: string;
    template: string;
  }>;

  // Fetch recent notification log
  const { data: recentLogs } = await db(supabase)
    .from("notificacoes_log")
    .select("id, tipo, status, mensagem, enviado_em, created_at")
    .eq("salao_id", salaoId)
    .order("created_at", { ascending: false })
    .limit(20);

  const logs = (recentLogs ?? []) as Array<{
    id: string;
    tipo: string;
    status: string;
    mensagem: string;
    enviado_em: string | null;
    created_at: string;
  }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Notificaciones</h1>
        <p className="text-sm text-stone-500">
          Personaliza los mensajes de WhatsApp/SMS que reciben tus clientes.
        </p>
      </div>

      <TemplateEditor existingTemplates={existingTemplates} />

      {/* Recent notifications log */}
      <div className="rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-stone-800">Historial reciente</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-stone-400">No hay notificaciones enviadas aún.</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${
                      log.status === "enviado" ? "bg-green-500" :
                      log.status === "falhou" ? "bg-red-500" :
                      "bg-yellow-500"
                    }`} />
                    <span className="text-xs font-medium uppercase text-stone-400">
                      {log.tipo.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-stone-600">{log.mensagem.slice(0, 80)}...</p>
                </div>
                <div className="ml-4 text-right text-xs text-stone-400">
                  {new Date(log.created_at).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
