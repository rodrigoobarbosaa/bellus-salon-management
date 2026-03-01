import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/shared/skeleton";
import { Calendar, DollarSign, Users } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: usuario } = await supabase
    .from("usuarios" as string)
    .select("nome")
    .eq("id", user.id)
    .single();

  const userName = (usuario as { nome: string } | null)?.nome
    ?? user.user_metadata?.nome
    ?? user.email
    ?? "Usuario";

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-900">Bienvenido/a, {userName}!</h2>
        <p className="mt-1 text-sm text-stone-500 capitalize">{today}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Próximas citas hoy</CardTitle>
            <Calendar className="text-bellus-gold size-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Ingresos de hoy</CardTitle>
            <DollarSign className="text-bellus-gold size-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-8 w-24" />
            <Skeleton className="h-4 w-28" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-stone-600">Clientes este mes</CardTitle>
            <Users className="text-bellus-gold size-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-8 w-12" />
            <Skeleton className="h-4 w-36" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
