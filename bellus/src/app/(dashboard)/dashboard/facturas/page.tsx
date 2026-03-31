import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { FacturasView } from "./facturas-view";

export default async function FacturasPage() {
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

  const t = await getTranslations("facturas");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          {t("title")}
        </h1>
        <p className="text-sm text-stone-500">{t("subtitle")}</p>
      </div>
      <FacturasView />
    </div>
  );
}
