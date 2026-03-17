"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { mobileNavItems, type NavItem } from "@/lib/navigation";
import type { RoleProfissional } from "@/stores/auth-store";

interface BottomNavProps {
  userRole: RoleProfissional;
}

export function BottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const items: NavItem[] = mobileNavItems[userRole] ?? mobileNavItems.profissional;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white md:hidden"
      aria-label={t("nav.dashboard")}
    >
      <div className="flex h-16 items-center justify-around">
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors",
                isActive ? "text-bellus-gold" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <item.icon className="size-5" />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
