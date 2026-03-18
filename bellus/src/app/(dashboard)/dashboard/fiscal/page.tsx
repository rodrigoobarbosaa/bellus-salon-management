import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FiscalView } from "./fiscal-view";

export default async function FiscalPage() {
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
  if (role !== "proprietario") redirect("/dashboard");

  // Get or create fiscal config
  let configFiscal = null;
  const { data: existing } = await supabase
    .from("configuracoes_fiscais")
    .select("*")
    .eq("salao_id", salaoId)
    .single();

  if (existing) {
    configFiscal = existing as {
      iva_pct: number;
      irpf_pct: number;
      cuota_autonomos_mensual: number;
      nif: string | null;
      nombre_fiscal: string | null;
    };
  } else {
    // Create default
    const { data: created } = await supabase
      .from("configuracoes_fiscais")
      .insert({
        salao_id: salaoId,
        iva_pct: 21,
        irpf_pct: 15,
        cuota_autonomos_mensual: 0,
      })
      .select("*")
      .single();

    configFiscal = (created as typeof configFiscal) ?? {
      iva_pct: 21,
      irpf_pct: 15,
      cuota_autonomos_mensual: 0,
      nif: null,
      nombre_fiscal: null,
    };
  }

  // Get salon name for exports
  const { data: salao } = await supabase
    .from("saloes")
    .select("nome")
    .eq("id", salaoId)
    .single();

  const salaoNome = (salao as { nome: string } | null)?.nome ?? "";

  const t = await getTranslations("fiscal");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <FiscalView
        salaoId={salaoId}
        salaoNome={salaoNome}
        configFiscal={configFiscal}
      />
    </div>
  );
}
