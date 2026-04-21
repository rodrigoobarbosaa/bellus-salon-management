"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  updateAgendamentoStatus,
  updateAgendamento,
  cancelAgendamento,
} from "@/app/actions/agendamentos";
import { Clock, User, Scissors, Calendar, FileText, Pencil, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { buildWhatsAppLink } from "@/lib/whatsapp-link";
import { toMadridDatetimeLocal, SALON_TZ } from "@/lib/timezone";
import { PaymentModal } from "./payment-modal";

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
  servico_preco?: number;
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
  preco_base: number;
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
  profissionais,
  servicos,
  userRole,
  currentProfissionalId,
}: AgendamentoDetailProps) {
  const t = useTranslations("agenda");
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [clientePhone, setClientePhone] = useState<string | null>(null);
  const [clienteIdioma, setClienteIdioma] = useState<"pt" | "es" | "en" | "ru">("es");
  const [salonName, setSalonName] = useState("");

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();

    async function fetchClientAndSalon() {
      const [{ data: cliente }, { data: salao }] = await Promise.all([
        supabase
          .from("clientes")
          .select("telefone, idioma_preferido")
          .eq("id", agendamento.cliente_id)
          .single(),
        supabase
          .from("saloes")
          .select("nome")
          .limit(1)
          .single(),
      ]);
      setClientePhone(cliente?.telefone ?? null);
      setClienteIdioma(cliente?.idioma_preferido ?? "es");
      setSalonName(salao?.nome ?? "");
    }

    fetchClientAndSalon();
  }, [open, agendamento.cliente_id]);

  // Edit form state
  const [editServico, setEditServico] = useState(agendamento.servico_id);
  const [editProfissional, setEditProfissional] = useState(agendamento.profissional_id);
  const [editInicio, setEditInicio] = useState(
    toMadridDatetimeLocal(new Date(agendamento.data_hora_inicio))
  );
  const [editNotas, setEditNotas] = useState(agendamento.notas ?? "");

  const canEdit =
    userRole === "proprietario" ||
    agendamento.profissional_id === currentProfissionalId;

  const isProprietario = userRole === "proprietario";
  const isConcluido = agendamento.status === "concluido";
  const isCancelado = agendamento.status === "cancelado";
  const isTerminal = isConcluido || isCancelado;
  // Proprietario can edit profissional/servico on completed appointments
  const canEditConcluido = isConcluido && isProprietario;

  const inicio = new Date(agendamento.data_hora_inicio);
  const fim = new Date(agendamento.data_hora_fim);

  const dateStr = inicio.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: SALON_TZ,
  });

  const timeStr = `${inicio.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SALON_TZ })} - ${fim.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SALON_TZ })}`;

  const selectedServico = servicos.find((s) => s.id === editServico);

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

  async function submitEditForm(fd: FormData) {
    setIsLoading(true);
    setEditError(null);

    const result = await updateAgendamento(agendamento.id, fd);
    setIsLoading(false);

    if (result && "conflict" in result && result.conflict) {
      setConflictMessage(result.message as string);
      setPendingFormData(fd);
      return;
    }

    if (result.error) {
      setEditError(result.error);
      return;
    }

    setConflictMessage(null);
    setPendingFormData(null);
    setIsEditing(false);
    onOpenChange(false);
  }

  async function handleSaveEdit() {
    setConflictMessage(null);

    const fd = new FormData();
    fd.set("profissional_id", editProfissional);
    fd.set("servico_id", editServico);
    fd.set("notas", editNotas);

    if (isConcluido) {
      // Completed appointment: only send profissional/servico changes
      fd.set("concluido_edit", "true");
    } else {
      fd.set("data_hora_inicio", editInicio);
    }

    await submitEditForm(fd);
  }

  async function handleForceOverlap() {
    if (!pendingFormData) return;
    pendingFormData.set("force_overlap", "true");
    setConflictMessage(null);
    await submitEditForm(pendingFormData);
  }

  async function handleReopen() {
    setIsLoading(true);
    await updateAgendamentoStatus(agendamento.id, "confirmado");
    setIsLoading(false);
    setShowReopenConfirm(false);
    onOpenChange(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setIsEditing(false);
      setShowCancelConfirm(false);
      setShowReopenConfirm(false);
      setEditError(null);
      setConflictMessage(null);
      setPendingFormData(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? "Editar turno" : "Detalle del turno"}
            {!isEditing && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[agendamento.status] ?? ""}`}
              >
                {STATUS_LABELS[agendamento.status] ?? agendamento.status}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isEditing ? (
          /* ===== EDIT MODE ===== */
          <div className="space-y-4">
            {editError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{editError}</div>
            )}

            {conflictMessage && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2">
                <p className="text-sm font-medium text-amber-800">{conflictMessage}</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => { setConflictMessage(null); setPendingFormData(null); }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleForceOverlap}
                    disabled={isLoading}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isLoading ? "Guardando..." : "Guardar de todas formas"}
                  </Button>
                </div>
              </div>
            )}

            {isConcluido && (
              <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700">
                Turno completado — solo se puede cambiar profesional y servicio.
              </div>
            )}

            {/* Serviço */}
            <div className="space-y-2">
              <label htmlFor="edit-servico" className="text-sm font-medium text-stone-700">
                Servicio *
              </label>
              <select
                id="edit-servico"
                value={editServico}
                onChange={(e) => setEditServico(e.target.value)}
                disabled={isLoading}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              >
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} ({s.duracao_minutos} min — €{s.preco_base})
                  </option>
                ))}
              </select>
              {selectedServico && (
                <p className="text-xs text-stone-500">
                  Duración: {selectedServico.duracao_minutos} min
                </p>
              )}
            </div>

            {/* Profissional */}
            <div className="space-y-2">
              <label htmlFor="edit-prof" className="text-sm font-medium text-stone-700">
                Profesional *
              </label>
              <select
                id="edit-prof"
                value={editProfissional}
                onChange={(e) => setEditProfissional(e.target.value)}
                disabled={isLoading}
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              >
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Data/hora — hidden for completed appointments */}
            {!isConcluido && (
              <div className="space-y-2">
                <label htmlFor="edit-inicio" className="text-sm font-medium text-stone-700">
                  Fecha y hora *
                </label>
                <Input
                  id="edit-inicio"
                  type="datetime-local"
                  value={editInicio}
                  onChange={(e) => setEditInicio(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Notas */}
            <div className="space-y-2">
              <label htmlFor="edit-notas" className="text-sm font-medium text-stone-700">
                Notas
              </label>
              <Input
                id="edit-notas"
                type="text"
                value={editNotas}
                onChange={(e) => setEditNotas(e.target.value)}
                placeholder="Notas opcionales..."
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => { setIsEditing(false); setEditError(null); setConflictMessage(null); setPendingFormData(null); }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        ) : (
          /* ===== VIEW MODE ===== */
          <>
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
                      onClick={() => setShowPayment(true)}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Completar y cobrar
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

            {/* Reopen button for completed appointments (proprietario only) */}
            {isConcluido && isProprietario && !showReopenConfirm && (
              <div className="space-y-2 border-t border-stone-100 pt-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReopenConfirm(true)}
                    disabled={isLoading}
                    className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  >
                    Reabrir turno
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

            {/* Confirmação de reabertura */}
            {showReopenConfirm && (
              <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-700">
                  ¿Reabrir este turno? Se eliminarán las transacciones asociadas y la comanda deberá rehacerse.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowReopenConfirm(false)}
                    disabled={isLoading}
                  >
                    No
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReopen}
                    disabled={isLoading}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {isLoading ? "Reabriendo..." : "Sí, reabrir"}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {!isTerminal && clientePhone && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const inicio = new Date(agendamento.data_hora_inicio);
                    const link = buildWhatsAppLink({
                      telefone: clientePhone,
                      nome_cliente: agendamento.cliente_nome ?? "",
                      servico: agendamento.servico_nome ?? "",
                      profissional: agendamento.profissional_nome ?? "",
                      data: inicio.toLocaleDateString(clienteIdioma === "en" ? "en-US" : clienteIdioma === "ru" ? "ru-RU" : clienteIdioma === "pt" ? "pt-BR" : "es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: SALON_TZ }),
                      hora: inicio.toLocaleTimeString(clienteIdioma === "en" ? "en-US" : "es-ES", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: SALON_TZ }),
                      salao: salonName,
                      idioma: clienteIdioma,
                    });
                    window.open(link, "_blank");
                  }}
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                  title={t("sendWhatsApp")}
                >
                  <MessageCircle className="size-3.5" />
                  {t("sendWhatsApp")}
                </Button>
              )}
              {((canEdit && !isTerminal) || canEditConcluido) && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Pencil className="size-3.5" />
                  {canEditConcluido ? "Corregir" : "Editar"}
                </Button>
              )}
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        onOpenChange={(open) => {
          setShowPayment(open);
          if (!open) handleOpenChange(false);
        }}
        agendamento={agendamento}
        servicos={servicos}
      />
    </Dialog>
  );
}
