"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl">Iniciar sesión</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-stone-700">
              Correo electrónico
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-stone-700">
              Contraseña
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={isLoading}
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Iniciar sesión"}
          </Button>
          <div className="flex flex-col items-center gap-2">
            <Link href="/register" className="text-sm text-bellus-gold hover:text-bellus-gold/80 font-medium">
              ¿No tienes cuenta? Regístrate
            </Link>
            <Link href="/forgot-password" className="text-sm text-stone-500 hover:text-stone-700">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
