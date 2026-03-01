"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { menuItems, type NavItem } from "@/lib/navigation";
import { signOut } from "@/app/actions/auth";
import type { RoleProfissional } from "@/stores/auth-store";

interface SidebarProps {
  userName: string;
  userRole: RoleProfissional;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const items: NavItem[] = menuItems[userRole] ?? menuItems.profissional;

  return (
    <aside className="bg-bellus-dark hidden h-screen w-60 flex-col border-r border-stone-800 md:flex">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="text-2xl font-bold tracking-tight text-white">
          <span className="text-bellus-gold">B</span>ellus
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Menu principal">
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-bellus-gold/15 text-bellus-gold"
                  : "text-stone-400 hover:bg-stone-800 hover:text-white"
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-800 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="bg-bellus-gold/20 text-bellus-gold flex size-9 items-center justify-center rounded-full text-sm font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="text-xs text-stone-500">
              {userRole === "proprietario" ? "Propietario" : "Profesional"}
            </p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
            aria-label="Cerrar sesión"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
