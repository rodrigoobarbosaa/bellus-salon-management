import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/shared/sidebar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import type { RoleProfissional } from "@/stores/auth-store";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar perfil: primeiro usuarios (bridge), fallback profissionais
  const { data: usuario } = await supabase
    .from("usuarios" as string)
    .select("nome, role")
    .eq("id", user.id)
    .single();

  let userName = (usuario as { nome: string } | null)?.nome
    ?? user.user_metadata?.nome
    ?? user.email
    ?? "Usuario";
  let userRole: RoleProfissional = ((usuario as { role: string } | null)?.role as RoleProfissional)
    ?? "profissional";

  if (!usuario) {
    const { data: prof } = await supabase
      .from("profissionais" as string)
      .select("nome, role")
      .eq("user_id", user.id)
      .single();
    if (prof) {
      userName = (prof as { nome: string }).nome;
      userRole = (prof as { role: string }).role as RoleProfissional;
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
      <Sidebar userName={userName} userRole={userRole} />

      <div className="flex min-h-screen flex-col pb-16 md:pb-0">
        <DashboardHeader userName={userName} />
        <main className="flex-1 bg-stone-50 p-4 md:p-6">{children}</main>
      </div>

      <BottomNav userRole={userRole} />
    </div>
  );
}
