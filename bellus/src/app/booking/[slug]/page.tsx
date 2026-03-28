import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { SalonInfo } from "./salon-info";
import { BookingWizard } from "./booking-wizard";
import type { SupabaseClient } from "@supabase/supabase-js";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: salao } = await supabase
    .from("saloes")
    .select("nome, slug")
    .eq("slug", slug)
    .single();

  if (!salao) {
    return { title: "Booking | Bellus" };
  }

  const title = `Agendar em ${salao.nome} | Bellus`;
  const description = `Marque o seu servico online em ${salao.nome}. Rapido, facil e sem telefonemas.`;

  return {
    title,
    description,
    alternates: { canonical: `https://bellus.app/booking/${salao.slug}` },
    openGraph: {
      title,
      description: `Marque online em ${salao.nome}.`,
      url: `https://bellus.app/booking/${salao.slug}`,
      siteName: "Bellus",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `Bellus - ${salao.nome}` }],
      locale: "pt_PT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `Marque online em ${salao.nome}.`,
      images: ["/og-image.png"],
    },
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const supabase = createServiceClient();

  // Fetch salon by slug
  const { data: salao } = await supabase
    .from("saloes")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!salao) {
    notFound();
  }

  const salon = salao as {
    id: string;
    nome: string;
    slug: string;
    whatsapp: string | null;
    timezone: string;
    moeda: string;
    logo_url: string | null;
    cor_primaria: string;
    endereco: string | null;
    telefone: string | null;
    horario_funcionamento: Record<string, { abre: string; fecha: string } | null> | null;
    instagram_url: string | null;
    google_maps_url: string | null;
  };

  // Fetch active services for this salon
  const { data: servicosRaw } = await supabase
    .from("servicos")
    .select("id, nome, descricao, duracao_minutos, preco_base, categoria")
    .eq("salao_id", salon.id)
    .eq("ativo", true)
    .order("categoria")
    .order("nome");

  const servicos = (servicosRaw ?? []) as Array<{
    id: string;
    nome: string;
    descricao: string | null;
    duracao_minutos: number;
    preco_base: number;
    categoria: string;
  }>;

  // Fetch professionals with their services
  const { data: profissionaisRaw } = await supabase
    .from("profissionais")
    .select("id, nome, cor_agenda")
    .eq("salao_id", salon.id)
    .eq("ativo", true)
    .order("nome");

  const profissionais = (profissionaisRaw ?? []) as Array<{
    id: string;
    nome: string;
    cor_agenda: string;
  }>;

  // Fetch service-professional associations
  const { data: spRaw } = await supabase
    .from("servicos_profissionais")
    .select("servico_id, profissional_id, preco_override");

  const servicoProfissionais = (spRaw ?? []) as Array<{
    servico_id: string;
    profissional_id: string;
    preco_override: number | null;
  }>;

  return (
    <div
      className="min-h-screen"
      style={{ "--salon-primary": salon.cor_primaria } as React.CSSProperties}
    >
      {/* Header with salon info */}
      <SalonInfo salon={salon} />

      {/* Booking wizard */}
      <div className="mx-auto max-w-lg px-4 pb-12">
        <BookingWizard
          salaoId={salon.id}
          servicos={servicos}
          profissionais={profissionais}
          servicoProfissionais={servicoProfissionais}
          horarioFuncionamento={salon.horario_funcionamento}
          timezone={salon.timezone}
          moeda={salon.moeda}
        />
      </div>
    </div>
  );
}
