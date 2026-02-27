"use client";

import { useAuthStore } from "@/stores/auth-store";
import { isProprietario, isProfissional, canAccessRoute } from "@/lib/auth/roles";

export function useRole() {
  const role = useAuthStore((state) => state.role);

  return {
    role,
    isProprietario: isProprietario(role),
    isProfissional: isProfissional(role),
    canAccess: (pathname: string) => canAccessRoute(pathname, role),
  };
}
