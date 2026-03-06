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
    .from("usuarios" as string)
    .select("salao_id, role")
    .eq("id", user.id)
    .single();

  const role = (usuario as { role: string } | null)?.role;
  if (role !== "proprietario") redirect("/dashboard");

  const salaoId = (usuario as { salao_id: string } | null)?.salao_id;

  // Fetch services for content generator
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: servicos } = await db
    .from("servicos")
    .select("id, nome, preco_base, categoria")
    .eq("salao_id", salaoId)
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
