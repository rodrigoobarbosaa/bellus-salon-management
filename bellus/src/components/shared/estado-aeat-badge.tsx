"use client";

import type { EstadoAeat } from "@/lib/verifactu/types";

const config: Record<EstadoAeat, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  enviado: {
    label: "Enviado",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  aceptado: {
    label: "Aceptado",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  rechazado: {
    label: "Rechazado",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

interface EstadoAeatBadgeProps {
  estado: EstadoAeat;
  motivo?: string | null;
  size?: "sm" | "md";
}

export function EstadoAeatBadge({ estado, motivo, size = "sm" }: EstadoAeatBadgeProps) {
  const { label, className } = config[estado] || config.pendiente;
  const sizeClass = size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]";

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center rounded-full border font-medium ${className} ${sizeClass}`}
      >
        <span
          className={`mr-1.5 inline-block size-1.5 rounded-full ${
            estado === "aceptado"
              ? "bg-green-500"
              : estado === "rechazado"
                ? "bg-red-500"
                : estado === "enviado"
                  ? "bg-blue-500"
                  : "bg-amber-500"
          }`}
        />
        {label}
      </span>
      {motivo && estado === "rechazado" && (
        <span className="max-w-[200px] truncate text-[10px] text-red-500" title={motivo}>
          {motivo}
        </span>
      )}
    </span>
  );
}
