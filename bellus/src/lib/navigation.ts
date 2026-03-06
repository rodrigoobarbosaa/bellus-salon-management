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
  label: string;
  icon: LucideIcon;
}

export const menuItems: Record<"proprietario" | "profissional", NavItem[]> = {
  proprietario: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
    { href: "/dashboard/clientes", label: "Clientes", icon: Users },
    { href: "/dashboard/servicos", label: "Servicios", icon: Scissors },
    { href: "/dashboard/caixa", label: "Caja", icon: CreditCard },
    { href: "/dashboard/fiscal", label: "Fiscal", icon: Receipt },
    { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone },
    { href: "/dashboard/notificacoes", label: "Notificaciones", icon: Bell },
    { href: "/dashboard/equipe", label: "Equipo", icon: UserCog },
    { href: "/dashboard/configuracoes", label: "Ajustes", icon: Settings },
  ],
  profissional: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/agenda", label: "Mi Agenda", icon: Calendar },
    { href: "/dashboard/atendimentos", label: "Mis Citas", icon: Scissors },
  ],
};

export const mobileNavItems: Record<"proprietario" | "profissional", NavItem[]> = {
  proprietario: [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
    { href: "/dashboard/clientes", label: "Clientes", icon: Users },
    { href: "/dashboard/caixa", label: "Caja", icon: CreditCard },
    { href: "/dashboard/configuracoes", label: "Más", icon: Settings },
  ],
  profissional: [
    { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
    { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
    { href: "/dashboard/atendimentos", label: "Citas", icon: Scissors },
  ],
};
