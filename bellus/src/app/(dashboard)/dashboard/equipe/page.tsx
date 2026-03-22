import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EquipeList } from "./equipe-list";

export default async function EquipePage() {
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

  // Buscar profissionais do salao (RLS filtra por salao_id)
  const { data: profissionais } = await supabase
    .from("profissionais" as string)
    .select("*")
    .order("nome");

  // Buscar servicos ativos (para o dialog de atribuição)
  const { data: servicos } = await supabase
    .from("servicos" as string)
    .select("id, nome, preco_base, categoria")
    .eq("ativo", true)
    .order("categoria")
    .order("nome");

  // Buscar associações profissional-servico
  const { data: servicosProfissionais } = await supabase
    .from("servicos_profissionais" as string)
    .select("servico_id, profissional_id, preco_override");

  return (
    <div className="space-y-6">
      <EquipeList
        profissionais={(profissionais as Array<{
          id: string;
          nome: string;
          email: string;
          telefone: string | null;
          role: string;
          cor_agenda: string;
          ativo: boolean;
        }>) ?? []}
        servicos={(servicos as Array<{
          id: string;
          nome: string;
          preco_base: number;
          categoria: string;
        }>) ?? []}
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
