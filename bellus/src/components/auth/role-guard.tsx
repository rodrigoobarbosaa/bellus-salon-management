"use client";

import { useRole } from "@/hooks/use-role";
import type { RoleProfissional } from "@/stores/auth-store";

interface RoleGuardProps {
  role: RoleProfissional | RoleProfissional[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ role, children, fallback = null }: RoleGuardProps) {
  const { role: userRole } = useRole();

  if (!userRole) return fallback;

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(userRole)) return fallback;

  return <>{children}</>;
}
