import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgendaView } from "./agenda-view";

export default async function AgendaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar role + salao_id
  const { data: usuario } = await supabase
    .from("usuarios" as string)
    .select("role, salao_id")
    .eq("id", user.id)
    .single();

  const userRole = (usuario as { role: string } | null)?.role ?? "profissional";
  const salaoId = (usuario as { salao_id: string } | null)?.salao_id ?? "";

  // Buscar profissionais do salão
  const { data: rawProfissionais } = await supabase
    .from("profissionais" as string)
    .select("id, nome, cor_agenda, user_id")
    .eq("ativo", true)
    .order("nome");

  type Prof = {
    id: string;
    nome: string;
    cor_agenda: string;
    user_id: string;
  };

  const profissionais = (rawProfissionais as Prof[] | null) ?? [];

  // Buscar serviços ativos
  const { data: rawServicos } = await supabase
    .from("servicos" as string)
    .select("id, nome, duracao_minutos, preco_base, tempo_pausa_minutos, duracao_pos_pausa_minutos")
    .eq("ativo", true)
    .order("nome");

  type Serv = { id: string; nome: string; duracao_minutos: number; preco_base: number; tempo_pausa_minutos: number | null; duracao_pos_pausa_minutos: number | null };
  const servicos = (rawServicos as Serv[] | null) ?? [];

  // Determinar profissional_id do user logado (para profissional ver só a sua agenda)
  const currentProf = profissionais.find((p) => p.user_id === user.id);

  return (
    <div className="space-y-4">
      <AgendaView
        profissionais={profissionais}
        servicos={servicos}
        salaoId={salaoId}
        userRole={userRole}
        currentProfissionalId={currentProf?.id ?? null}
      />
    </div>
  );
}
