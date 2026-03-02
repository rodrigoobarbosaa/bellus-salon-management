"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  updateAgendamentoStatus,
  cancelAgendamento,
} from "@/app/actions/agendamentos";
import { Clock, User, Scissors, Calendar, FileText } from "lucide-react";

interface Agendamento {
  id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
  notas: string | null;
  cliente_nome?: string;
  servico_nome?: string;
  profissional_nome?: string;
}

interface Profissional {
  id: string;
  nome: string;
  cor_agenda: string;
}

interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
}

interface AgendamentoDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: Agendamento;
  profissionais: Profissional[];
  servicos: Servico[];
  userRole: string;
  currentProfissionalId: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendiente",
  confirmado: "Confirmado",
  concluido: "Completado",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-700",
  confirmado: "bg-blue-100 text-blue-700",
  concluido: "bg-green-100 text-green-700",
  cancelado: "bg-stone-100 text-stone-500",
};

export function AgendamentoDetail({
  open,
  onOpenChange,
  agendamento,
  userRole,
  currentProfissionalId,
}: AgendamentoDetailProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const canEdit =
    userRole === "proprietario" ||
    agendamento.profissional_id === currentProfissionalId;

  const isTerminal = agendamento.status === "concluido" || agendamento.status === "cancelado";

  const inicio = new Date(agendamento.data_hora_inicio);
  const fim = new Date(agendamento.data_hora_fim);

  const dateStr = inicio.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const timeStr = `${inicio.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${fim.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })}`;

  async function handleStatusChange(newStatus: string) {
    setIsLoading(true);
    await updateAgendamentoStatus(agendamento.id, newStatus);
    setIsLoading(false);
    onOpenChange(false);
  }

  async function handleCancel() {
    setIsLoading(true);
    await cancelAgendamento(agendamento.id);
    setIsLoading(false);
    setShowCancelConfirm(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalle del turno
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[agendamento.status] ?? ""}`}
            >
              {STATUS_LABELS[agendamento.status] ?? agendamento.status}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <User className="size-4 text-stone-400" />
            <span className="font-medium">{agendamento.cliente_nome}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Scissors className="size-4 text-stone-400" />
            <span>{agendamento.servico_nome}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Calendar className="size-4 text-stone-400" />
            <span className="capitalize">{dateStr}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Clock className="size-4 text-stone-400" />
            <span>{timeStr}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div
              className="size-4 rounded-full border"
              style={{ backgroundColor: "#C9A96E" }}
            />
            <span>{agendamento.profissional_nome}</span>
          </div>

          {agendamento.notas && (
            <div className="flex items-start gap-3 text-sm">
              <FileText className="mt-0.5 size-4 text-stone-400" />
              <span className="text-stone-500">{agendamento.notas}</span>
            </div>
          )}
        </div>

        {/* Status transitions */}
        {canEdit && !isTerminal && !showCancelConfirm && (
          <div className="space-y-2 border-t border-stone-100 pt-3">
            <p className="text-xs font-medium text-stone-500">Cambiar estado:</p>
            <div className="flex flex-wrap gap-2">
              {agendamento.status === "pendente" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("confirmado")}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Confirmar
                </Button>
              )}
              {agendamento.status === "confirmado" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("concluido")}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Completar
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                disabled={isLoading}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Cancelar turno
              </Button>
            </div>
          </div>
        )}

        {/* Confirmação de cancelamento */}
        {showCancelConfirm && (
          <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-700">
              ¿Seguro que quieres cancelar este turno?
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isLoading}
              >
                No
              </Button>
              <Button
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Cancelando..." : "Sí, cancelar"}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
