import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFacturaById } from "@/app/actions/facturas";
import { FacturaDetailView } from "./factura-detail-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FacturaDetailPage({ params }: Props) {
  const { id } = await params;
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
  const { role } = usuario as { salao_id: string; role: string };
  if (role !== "proprietario") redirect("/dashboard");

  const result = await getFacturaById(id);
  if (result.error || !result.data) redirect("/dashboard/facturas");

  return <FacturaDetailView factura={result.data} />;
}
