import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  CreditCard,
  Receipt,
  UserCog,
  Settings,
  Bell,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const menuItems: Record<"proprietario" | "profissional", NavItem[]> = {
  proprietario: [
    { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { href: "/dashboard/agenda", labelKey: "nav.agenda", icon: Calendar },
    { href: "/dashboard/clientes", labelKey: "nav.clientes", icon: Users },
    { href: "/dashboard/servicos", labelKey: "nav.servicos", icon: Scissors },
    { href: "/dashboard/caixa", labelKey: "nav.caixa", icon: CreditCard },
    { href: "/dashboard/fiscal", labelKey: "nav.fiscal", icon: Receipt },
    { href: "/dashboard/marketing", labelKey: "nav.marketing", icon: Megaphone },
    { href: "/dashboard/notificacoes", labelKey: "nav.notificacoes", icon: Bell },
    { href: "/dashboard/equipe", labelKey: "nav.equipe", icon: UserCog },
    { href: "/dashboard/configuracoes", labelKey: "nav.configuracoes", icon: Settings },
  ],
  profissional: [
    { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
    { href: "/dashboard/agenda", labelKey: "nav.minhaAgenda", icon: Calendar },
    { href: "/dashboard/atendimentos", labelKey: "nav.atendimentos", icon: Scissors },
  ],
};

export const mobileNavItems: Record<"proprietario" | "profissional", NavItem[]> = {
  proprietario: [
    { href: "/dashboard", labelKey: "nav.inicio", icon: LayoutDashboard },
    { href: "/dashboard/agenda", labelKey: "nav.agenda", icon: Calendar },
    { href: "/dashboard/clientes", labelKey: "nav.clientes", icon: Users },
    { href: "/dashboard/caixa", labelKey: "nav.caixa", icon: CreditCard },
    { href: "/dashboard/configuracoes", labelKey: "nav.mas", icon: Settings },
  ],
  profissional: [
    { href: "/dashboard", labelKey: "nav.inicio", icon: LayoutDashboard },
    { href: "/dashboard/agenda", labelKey: "nav.agenda", icon: Calendar },
    { href: "/dashboard/atendimentos", labelKey: "nav.citas", icon: Scissors },
  ],
};
