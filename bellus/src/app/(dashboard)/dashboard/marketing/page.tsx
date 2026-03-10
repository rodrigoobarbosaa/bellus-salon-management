import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCampaigns,
  getIntegrations,
  getGeneratedContents,
  getMarketingAnalytics,
} from "@/app/actions/marketing";
import { MarketingView } from "./marketing-view";

export default async function MarketingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check role — owner only
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id, role")
    .eq("id", user.id)
    .single();

  if (usuario?.role !== "proprietario") redirect("/dashboard");

  const salaoId = usuario?.salao_id;

  // Fetch services for content generator
  const { data: servicos } = await supabase
    .from("servicos")
    .select("id, nome, preco_base, categoria")
    .eq("salao_id", salaoId ?? "")
    .eq("ativo", true);

  const [campaigns, integrations, contents, analytics] = await Promise.all([
    getCampaigns(),
    getIntegrations(),
    getGeneratedContents(),
    getMarketingAnalytics(),
  ]);

  return (
    <MarketingView
      campaigns={campaigns}
      integrations={integrations}
      contents={contents}
      analytics={analytics}
      servicos={(servicos as { id: string; nome: string; preco_base: number; categoria: string }[]) || []}
    />
  );
}
