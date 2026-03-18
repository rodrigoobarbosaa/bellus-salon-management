"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DateSelectArg, DatesSetArg, EventDropArg } from "@fullcalendar/core";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Ban } from "lucide-react";
import { AgendamentoForm } from "./agendamento-form";
import { AgendamentoDetail } from "./agendamento-detail";
import { BloqueioForm } from "./bloqueio-form";
import { deleteBloqueio } from "@/app/actions/bloqueios";
import { rescheduleAgendamento } from "@/app/actions/agendamentos";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Profissional {
  id: string;
  nome: string;
  cor_agenda: string;
  user_id: string;
}

interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco_base: number;
  tempo_pausa_minutos?: number | null;
  duracao_pos_pausa_minutos?: number | null;
}

interface Agendamento {
  id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
  notas: string | null;
  tipo_etapa?: string;
  agendamento_pai_id?: string | null;
  cliente_nome?: string;
  servico_nome?: string;
  profissional_nome?: string;
}

interface Bloqueio {
  id: string;
  profissional_id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  dia_inteiro: boolean;
  motivo: string | null;
}

interface AgendaViewProps {
  profissionais: Profissional[];
  servicos: Servico[];
  salaoId: string;
  userRole: string;
  currentProfissionalId: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  pendente: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  confirmado: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
  concluido: { bg: "#dcfce7", border: "#22c55e", text: "#166534" },
  cancelado: { bg: "#f3f4f6", border: "#9ca3af", text: "#6b7280" },
};

export function AgendaView({
  profissionais,
  servicos,
  salaoId,
  userRole,
  currentProfissionalId,
}: AgendaViewProps) {
  const t = useTranslations("agenda");
  const tc = useTranslations("common");
  const calendarRef = useRef<FullCalendar>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [bloqueioOpen, setBloqueioOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAgendamento, setSelectedAgendamento] = useState<Agendamento | null>(null);
  const [selectedBloqueio, setSelectedBloqueio] = useState<Bloqueio | null>(null);
  const [filteredProfIds, setFilteredProfIds] = useState<Set<string> | null>(null);
  const [currentRange, setCurrentRange] = useState<{ start: string; end: string } | null>(null);
  const [, startTransition] = useTransition();

  const supabase = useMemo(() => createClient(), []);

  const profMap = useMemo(() => {
    const m = new Map<string, Profissional>();
    profissionais.forEach((p) => m.set(p.id, p));
    return m;
  }, [profissionais]);

  const servicoMap = useMemo(() => {
    const m = new Map<string, Servico>();
    servicos.forEach((s) => m.set(s.id, s));
    return m;
  }, [servicos]);

  type RawAgendamento = Omit<Agendamento, "cliente_nome" | "servico_nome" | "profissional_nome"> & {
    clientes: { nome: string } | null;
    tipo_etapa?: string;
    agendamento_pai_id?: string | null;
  };

  // Fetch agendamentos + bloqueios
  const fetchData = useCallback(
    async (start: string, end: string) => {
      // Agendamentos
      let agQuery = supabase
        .from("agendamentos")
        .select("*, clientes!inner(nome)" as string)
        .gte("data_hora_inicio", start)
        .lte("data_hora_inicio", end);

      if (userRole === "profissional" && currentProfissionalId) {
        agQuery = agQuery.eq("profissional_id", currentProfissionalId);
      }

      // Bloqueios
      let blQuery = supabase
        .from("bloqueios")
        .select("*")
        .gte("data_hora_inicio", start)
        .lte("data_hora_inicio", end);

      if (userRole === "profissional" && currentProfissionalId) {
        blQuery = blQuery.eq("profissional_id", currentProfissionalId);
      }

      const [agResult, blResult] = await Promise.all([agQuery, blQuery]);

      if (agResult.data) {
        const mapped = (agResult.data as unknown as RawAgendamento[]).map((a) => ({
          id: a.id,
          cliente_id: a.cliente_id,
          profissional_id: a.profissional_id,
          servico_id: a.servico_id,
          data_hora_inicio: a.data_hora_inicio,
          data_hora_fim: a.data_hora_fim,
          status: a.status,
          notas: a.notas,
          tipo_etapa: a.tipo_etapa ?? "unico",
          agendamento_pai_id: a.agendamento_pai_id ?? null,
          cliente_nome: a.clientes?.nome ?? t("client"),
          servico_nome: servicoMap.get(a.servico_id)?.nome ?? t("service"),
          profissional_nome: profMap.get(a.profissional_id)?.nome ?? t("professional"),
        }));
        setAgendamentos(mapped);
      }

      if (blResult.data) {
        setBloqueios(blResult.data as unknown as Bloqueio[]);
      }
    },
    [supabase, userRole, currentProfissionalId, servicoMap, profMap, t]
  );

  // Refetch quando range muda
  useEffect(() => {
    if (currentRange) {
      startTransition(() => {
        fetchData(currentRange.start, currentRange.end);
      });
    }
  }, [currentRange, fetchData, startTransition]);

  // Supabase Realtime
  useEffect(() => {
    if (!salaoId) return;

    const channel = supabase
      .channel("agenda-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agendamentos", filter: `salao_id=eq.${salaoId}` },
        () => {
          if (currentRange) fetchData(currentRange.start, currentRange.end);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bloqueios", filter: `salao_id=eq.${salaoId}` },
        () => {
          if (currentRange) fetchData(currentRange.start, currentRange.end);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, salaoId, currentRange, fetchData]);

  // FullCalendar events (agendamentos + bloqueios)
  const calendarEvents = useMemo(() => {
    const agEvents = agendamentos
      .filter((a) => {
        if (!filteredProfIds) return true;
        return filteredProfIds.has(a.profissional_id);
      })
      .map((a) => {
        const prof = profMap.get(a.profissional_id);
        const statusColor = STATUS_COLORS[a.status] ?? STATUS_COLORS.pendente;

        const etapaPrefix = a.tipo_etapa === "aplicacao" ? "🎨 " : a.tipo_etapa === "secado" ? "💨 " : "";

        return {
          id: a.id,
          title: `${etapaPrefix}${a.cliente_nome} — ${a.servico_nome}`,
          start: a.data_hora_inicio,
          end: a.data_hora_fim,
          backgroundColor: a.status === "cancelado" ? statusColor.bg : (prof?.cor_agenda ?? "#C9A96E"),
          borderColor: a.status === "cancelado" ? statusColor.border : (prof?.cor_agenda ?? "#C9A96E"),
          textColor: a.status === "cancelado" ? statusColor.text : "#fff",
          editable: a.status !== "cancelado" && a.status !== "concluido",
          extendedProps: { agendamento: a, type: "agendamento" },
          classNames: a.status === "cancelado" ? ["opacity-50", "line-through"] : [],
        };
      });

    const blEvents = bloqueios
      .filter((b) => {
        if (!filteredProfIds) return true;
        return filteredProfIds.has(b.profissional_id);
      })
      .map((b) => {
        const prof = profMap.get(b.profissional_id);
        const profNome = prof?.nome.split(" ")[0] ?? "";
        return {
          id: `bloqueio-${b.id}`,
          title: b.motivo ? `🚫 ${b.motivo} (${profNome})` : `🚫 ${t("block")} (${profNome})`,
          start: b.data_hora_inicio,
          end: b.data_hora_fim,
          display: "background" as const,
          backgroundColor: "#e7e5e4",
          borderColor: "#a8a29e",
          textColor: "#78716c",
          extendedProps: { bloqueio: b, type: "bloqueio" },
        };
      });

    return [...agEvents, ...blEvents];
  }, [agendamentos, bloqueios, filteredProfIds, profMap]);

  function handleDatesSet(arg: DatesSetArg) {
    setCurrentRange({ start: arg.startStr, end: arg.endStr });
  }

  function handleDateSelect(arg: DateSelectArg) {
    setSelectedDate(new Date(arg.startStr));
    setCreateOpen(true);
  }

  function handleEventClick(arg: EventClickArg) {
    const type = arg.event.extendedProps.type;
    if (type === "agendamento") {
      setSelectedAgendamento(arg.event.extendedProps.agendamento as Agendamento);
    } else if (type === "bloqueio") {
      setSelectedBloqueio(arg.event.extendedProps.bloqueio as Bloqueio);
    }
  }

  async function handleEventDrop(arg: EventDropArg) {
    const type = arg.event.extendedProps.type;
    if (type !== "agendamento") {
      arg.revert();
      return;
    }

    const ag = arg.event.extendedProps.agendamento as Agendamento;
    if (ag.status === "concluido" || ag.status === "cancelado") {
      arg.revert();
      return;
    }

    const newStart = arg.event.startStr;
    const newEnd = arg.event.endStr;

    const result = await rescheduleAgendamento(ag.id, newStart, newEnd);
    if (result.error) {
      arg.revert();
      alert(result.error);
    } else {
      handleRefresh();
    }
  }

  function handleRefresh() {
    if (currentRange) fetchData(currentRange.start, currentRange.end);
  }

  function toggleProfFilter(profId: string) {
    setFilteredProfIds((prev) => {
      if (!prev) return new Set([profId]);
      const next = new Set(prev);
      if (next.has(profId)) {
        next.delete(profId);
        if (next.size === 0) return null;
      } else {
        next.add(profId);
      }
      return next;
    });
  }

  async function handleDeleteBloqueio() {
    if (!selectedBloqueio) return;
    await deleteBloqueio(selectedBloqueio.id);
    setSelectedBloqueio(null);
    handleRefresh();
  }

  // Badge: contagem de turnos de hoje
  const todayCount = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    return agendamentos.filter(
      (a) => a.status !== "cancelado" && a.data_hora_inicio.slice(0, 10) === todayStr
    ).length;
  }, [agendamentos]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-stone-900">{t("title")}</h2>
          {todayCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-bellus-gold/15 px-2.5 py-0.5 text-xs font-semibold text-bellus-gold">
              {t("shiftsToday", { count: todayCount })}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {userRole === "proprietario" && (
            <Button
              variant="outline"
              onClick={() => { setSelectedDate(new Date()); setBloqueioOpen(true); }}
              className="gap-2"
            >
              <Ban className="size-4" />
              {t("block")}
            </Button>
          )}
          <Button onClick={() => { setSelectedDate(new Date()); setCreateOpen(true); }} className="gap-2">
            <Plus className="size-4" />
            {t("newShift")}
          </Button>
        </div>
      </div>

      {/* Filtro de profissionais */}
      {profissionais.length > 1 && userRole === "proprietario" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilteredProfIds(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !filteredProfIds
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {tc("all")}
          </button>
          {profissionais.map((prof) => (
            <button
              key={prof.id}
              onClick={() => toggleProfFilter(prof.id)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  filteredProfIds?.has(prof.id) || !filteredProfIds
                    ? prof.cor_agenda + "20"
                    : "#f5f5f4",
                color: filteredProfIds?.has(prof.id) || !filteredProfIds
                  ? prof.cor_agenda
                  : "#a8a29e",
                borderWidth: 1,
                borderColor: filteredProfIds?.has(prof.id) ? prof.cor_agenda : "transparent",
              }}
            >
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: prof.cor_agenda }}
              />
              {prof.nome.split(" ")[0]}
            </button>
          ))}
        </div>
      )}

      {/* Calendário */}
      <div className="rounded-lg border border-stone-200 bg-white p-2 sm:p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay",
          }}
          locale="es"
          timeZone="Europe/Madrid"
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          selectable={true}
          selectMirror={true}
          nowIndicator={true}
          weekends={true}
          editable={true}
          eventDurationEditable={false}
          events={calendarEvents}
          datesSet={handleDatesSet}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          height="auto"
          stickyHeaderDates={true}
          dayHeaderFormat={{ weekday: "short", day: "numeric" }}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          buttonText={{
            today: t("today"),
            week: t("week"),
            day: t("day"),
          }}
        />
      </div>

      {/* Modal criar agendamento */}
      <AgendamentoForm
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) handleRefresh();
        }}
        profissionais={profissionais}
        servicos={servicos}
        defaultDate={selectedDate}
        currentProfissionalId={currentProfissionalId}
      />

      {/* Modal criar bloqueio */}
      <BloqueioForm
        open={bloqueioOpen}
        onOpenChange={(open) => {
          setBloqueioOpen(open);
          if (!open) handleRefresh();
        }}
        profissionais={profissionais}
        defaultDate={selectedDate}
        currentProfissionalId={currentProfissionalId}
      />

      {/* Modal detalhe agendamento */}
      {selectedAgendamento && (
        <AgendamentoDetail
          open={!!selectedAgendamento}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedAgendamento(null);
              handleRefresh();
            }
          }}
          agendamento={selectedAgendamento}
          profissionais={profissionais}
          servicos={servicos}
          userRole={userRole}
          currentProfissionalId={currentProfissionalId}
        />
      )}

      {/* Modal detalhe bloqueio */}
      {selectedBloqueio && (
        <Dialog
          open={!!selectedBloqueio}
          onOpenChange={(open) => { if (!open) setSelectedBloqueio(null); }}
        >
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>{t("blockTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">{t("professional")}:</span>{" "}
                {profMap.get(selectedBloqueio.profissional_id)?.nome ?? "—"}
              </p>
              <p>
                <span className="font-medium">{t("reason")}:</span>{" "}
                {selectedBloqueio.motivo ?? t("noReason")}
              </p>
              <p>
                <span className="font-medium">{t("period")}:</span>{" "}
                {selectedBloqueio.dia_inteiro
                  ? new Date(selectedBloqueio.data_hora_inicio).toLocaleDateString("es-ES")
                  + ` (${t("fullDay")})`
                  : `${new Date(selectedBloqueio.data_hora_inicio).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })} — ${new Date(selectedBloqueio.data_hora_fim).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>
            {userRole === "proprietario" && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedBloqueio(null)}>
                  {t("close")}
                </Button>
                <Button
                  onClick={handleDeleteBloqueio}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {t("deleteBlock")}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
