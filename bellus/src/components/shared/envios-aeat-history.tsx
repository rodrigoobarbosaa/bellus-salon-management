"use client";

import type { FacturaEnvioAeat } from "@/lib/verifactu/types";
import { EstadoAeatBadge } from "./estado-aeat-badge";
import type { EstadoAeat } from "@/lib/verifactu/types";

interface EnviosAeatHistoryProps {
  envios: FacturaEnvioAeat[];
}

export function EnviosAeatHistory({ envios }: EnviosAeatHistoryProps) {
  if (envios.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma tentativa de envio registrada.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Historico de envios AEAT
      </h4>
      <div className="space-y-1.5">
        {envios.map((envio) => (
          <div
            key={envio.id}
            className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 text-sm"
          >
            <div className="flex items-center gap-3">
              <EstadoAeatBadge estado={envio.status as EstadoAeat} />
              <span className="text-stone-500">
                {envio.response_code || "—"}
              </span>
            </div>
            <span className="text-xs text-stone-400">
              {envio.enviado_em
                ? new Date(envio.enviado_em).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : new Date(envio.created_at).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
