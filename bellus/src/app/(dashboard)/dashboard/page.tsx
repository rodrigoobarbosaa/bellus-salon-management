import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profissionais" as string)
    .select("nome, role")
    .eq("user_id", user.id)
    .single();

  const profile = data as { nome: string; role: string } | null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
      <p className="text-stone-600">
        Bienvenido, {profile?.nome ?? user.email}
      </p>
      {profile?.role && (
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
          {profile.role}
        </span>
      )}
      <SignOutButton />
    </main>
  );
}
