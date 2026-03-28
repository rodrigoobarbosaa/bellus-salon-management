"use client";

import dynamic from "next/dynamic";

const AgendaView = dynamic(
  () => import("./agenda-view").then((m) => m.AgendaView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] animate-pulse rounded-lg bg-stone-100" />
    ),
  }
);

interface Profissional {
  id: string;
  nome: string;
  cor_agenda: string;
  user_id: string;
}

interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco_base: number;
  tempo_pausa_minutos?: number | null;
  duracao_pos_pausa_minutos?: number | null;
}

interface AgendaViewLazyProps {
  profissionais: Profissional[];
  servicos: Servico[];
  salaoId: string;
  userRole: string;
  currentProfissionalId: string | null;
}

export function AgendaViewLazy(props: AgendaViewLazyProps) {
  return <AgendaView {...props} />;
}
