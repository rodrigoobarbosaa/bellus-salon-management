import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CaixaView } from "./caixa-view";

export default async function CaixaPage() {
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

  // Fetch profissionais for filters
  const { data: rawProfs } = await supabase
    .from("profissionais")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  const profissionais = (rawProfs ?? []) as Array<{ id: string; nome: string }>;

  // Fetch servicos for filters
  const { data: rawServicos } = await supabase
    .from("servicos")
    .select("id, nome")
    .order("nome");

  const servicos = (rawServicos ?? []) as Array<{ id: string; nome: string }>;

  const t = await getTranslations("cashier");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <CaixaView
        salaoId={salaoId}
        profissionais={profissionais}
        servicos={servicos}
      />
    </div>
  );
}
