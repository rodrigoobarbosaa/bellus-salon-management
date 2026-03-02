import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CaixaView } from "./caixa-view";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db(supabase: SupabaseClient): SupabaseClient<any> {
  return supabase as SupabaseClient<Record<string, unknown>>;
}

export default async function CaixaPage() {
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

  if (!usuario) redirect("/login");

  const { salao_id: salaoId, role } = usuario as { salao_id: string; role: string };

  if (role !== "proprietario") redirect("/dashboard");

  // Fetch profissionais for filters
  const { data: rawProfs } = await db(supabase)
    .from("profissionais")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  const profissionais = (rawProfs ?? []) as Array<{ id: string; nome: string }>;

  // Fetch servicos for filters
  const { data: rawServicos } = await db(supabase)
    .from("servicos")
    .select("id, nome")
    .order("nome");

  const servicos = (rawServicos ?? []) as Array<{ id: string; nome: string }>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Caja</h1>
      <CaixaView
        salaoId={salaoId}
        profissionais={profissionais}
        servicos={servicos}
      />
    </div>
  );
}
