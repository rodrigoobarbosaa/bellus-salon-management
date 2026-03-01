import type { RoleProfissional } from "@/stores/auth-store";

export function isProprietario(role: RoleProfissional | null): boolean {
  return role === "proprietario";
}

export function isProfissional(role: RoleProfissional | null): boolean {
  return role === "profissional";
}

// Rotas restritas ao proprietário
const PROPRIETARIO_ROUTES = ["/dashboard/fiscal", "/dashboard/equipe"];

export function canAccessRoute(pathname: string, role: RoleProfissional | null): boolean {
  if (isProprietario(role)) return true;

  return !PROPRIETARIO_ROUTES.some((route) => pathname.startsWith(route));
}
