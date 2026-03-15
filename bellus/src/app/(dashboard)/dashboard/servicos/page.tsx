import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServicosList } from "./servicos-list";

export default async function ServicosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar role do usuario
  const { data: usuario } = await supabase
    .from("usuarios" as string)
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = (usuario as { role: string } | null)?.role ?? "profissional";
  const isProprietario = userRole === "proprietario";

  // Buscar servicos do salao (RLS filtra por salao_id)
  const { data: servicos } = await supabase
    .from("servicos" as string)
    .select("*")
    .order("categoria")
    .order("nome");

  // Buscar profissionais ativos
  const { data: profissionais } = await supabase
    .from("profissionais" as string)
    .select("id, nome")
    .eq("ativo", true)
    .order("nome");

  // Buscar associações servico-profissional
  const { data: servicosProfissionais } = await supabase
    .from("servicos_profissionais" as string)
    .select("servico_id, profissional_id, preco_override");

  return (
    <div className="space-y-6">
      <ServicosList
        servicos={(servicos as Array<{
          id: string;
          nome: string;
          descricao: string | null;
          duracao_minutos: number;
          preco_base: number;
          categoria: string;
          intervalo_retorno_dias: number | null;
          tempo_pausa_minutos: number | null;
          duracao_pos_pausa_minutos: number | null;
          ativo: boolean;
        }>) ?? []}
        profissionais={(profissionais as Array<{ id: string; nome: string }>) ?? []}
        servicosProfissionais={(servicosProfissionais as Array<{
          servico_id: string;
          profissional_id: string;
          preco_override: number | null;
        }>) ?? []}
        isProprietario={isProprietario}
      />
    </div>
  );
}
