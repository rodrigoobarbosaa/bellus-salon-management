import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-6xl font-bold text-stone-300">404</h1>
      <h2 className="text-xl font-semibold text-stone-700">
        Página no encontrada
      </h2>
      <p className="text-sm text-stone-500">
        La página que buscas no existe o fue movida.
      </p>
      <Button asChild>
        <Link href="/dashboard">Volver al panel</Link>
      </Button>
    </main>
  );
}
