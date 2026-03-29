import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 animate-fade-in", className)}>
      <div className="rounded-full bg-stone-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-stone-400" />
      </div>
      <h3 className="text-sm font-semibold text-stone-700">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-stone-400 text-center max-w-[240px]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
