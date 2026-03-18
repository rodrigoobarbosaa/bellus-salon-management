"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createAgendamento } from "@/app/actions/agendamentos";

interface Profissional {
  id: string;
  nome: string;
  cor_agenda: string;
}

interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
  tempo_pausa_minutos?: number | null;
  duracao_pos_pausa_minutos?: number | null;
}

interface AgendamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profissionais: Profissional[];
  servicos: Servico[];
  defaultDate: Date | null;
  currentProfissionalId: string | null;
}

export function AgendamentoForm({
  open,
  onOpenChange,
  profissionais,
  servicos,
  defaultDate,
  currentProfissionalId,
}: AgendamentoFormProps) {
  const t = useTranslations("agenda");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clienteSearch, setClienteSearch] = useState("");
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string; telefone: string | null }>>([]);
  const [selectedCliente, setSelectedCliente] = useState<{ id: string; nome: string } | null>(null);
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [selectedServico, setSelectedServico] = useState("");
  const [addSecado, setAddSecado] = useState(false);
  const [secadoHorario, setSecadoHorario] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Formatar data para input datetime-local
  const defaultDateTime = defaultDate
    ? new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : "";

  // Calcular hora fim baseado no serviço
  const selectedServicoObj = servicos.find((s) => s.id === selectedServico);
  const duracao = selectedServicoObj?.duracao_minutos ?? 0;
  const hasPausa = !!(selectedServicoObj?.tempo_pausa_minutos && selectedServicoObj?.duracao_pos_pausa_minutos);

  // Buscar clientes com debounce
  useEffect(() => {
    if (clienteSearch.length < 2) {
      setClientes([]);
      return;
    }

    if (searchTimeout) clearTimeout(searchTimeout);

    const timeout = setTimeout(async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("clientes")
        .select("id, nome, telefone")
        .ilike("nome", `%${clienteSearch}%`)
        .limit(5);

      if (data) {
        setClientes(data);
      }
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteSearch]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    // Se é novo cliente, adicionar flag
    if (showNewCliente) {
      formData.set("new_cliente", "true");
    } else if (selectedCliente) {
      formData.set("cliente_id", selectedCliente.id);
    } else {
      setError(t("selectClient"));
      setIsLoading(false);
      return;
    }

    // Secado
    if (addSecado && secadoHorario) {
      formData.set("add_secado", "true");
      formData.set("secado_hora_inicio", new Date(secadoHorario).toISOString());
    }

    const result = await createAgendamento(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // Reset e fechar
    setIsLoading(false);
    setSelectedCliente(null);
    setClienteSearch("");
    setShowNewCliente(false);
    setSelectedServico("");
    setAddSecado(false);
    setSecadoHorario("");
    onOpenChange(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null);
      setSelectedCliente(null);
      setClienteSearch("");
      setShowNewCliente(false);
      setSelectedServico("");
      setAddSecado(false);
      setSecadoHorario("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newShift")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {/* Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">{t("clientRequired")}</label>
            {!showNewCliente ? (
              <>
                {selectedCliente ? (
                  <div className="flex items-center justify-between rounded-md border border-bellus-gold/30 bg-bellus-gold/5 p-2">
                    <span className="text-sm font-medium">{selectedCliente.nome}</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedCliente(null); setClienteSearch(""); }}
                      className="text-xs text-stone-500 hover:text-stone-700"
                    >
                      {t("change")}
                    </button>
                  </div>
                ) : (
                  <>
                    <Input
                      type="text"
                      placeholder={t("searchClient")}
                      value={clienteSearch}
                      onChange={(e) => setClienteSearch(e.target.value)}
                      disabled={isLoading}
                    />
                    {clientes.length > 0 && (
                      <div className="rounded-md border border-stone-200 bg-white shadow-sm">
                        {clientes.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCliente({ id: c.id, nome: c.nome });
                              setClienteSearch("");
                              setClientes([]);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-stone-50"
                          >
                            <span>{c.nome}</span>
                            {c.telefone && (
                              <span className="text-xs text-stone-400">{c.telefone}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNewCliente(true)}
                      className="text-xs font-medium text-bellus-gold hover:underline"
                    >
                      {t("createNewClient")}
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="space-y-2 rounded-md border border-stone-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-500">{t("newClient")}</span>
                  <button
                    type="button"
                    onClick={() => setShowNewCliente(false)}
                    className="text-xs text-stone-400 hover:text-stone-600"
                  >
                    {t("close")}
                  </button>
                </div>
                <Input
                  name="new_cliente_nome"
                  type="text"
                  placeholder={t("clientNameRequired")}
                  required={showNewCliente}
                  disabled={isLoading}
                />
                <Input
                  name="new_cliente_telefone"
                  type="tel"
                  placeholder={t("phoneOptional")}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Serviço */}
          <div className="space-y-2">
            <label htmlFor="servico_id" className="text-sm font-medium text-stone-700">
              {t("serviceRequired")}
            </label>
            <select
              id="servico_id"
              name="servico_id"
              required
              disabled={isLoading}
              value={selectedServico}
              onChange={(e) => setSelectedServico(e.target.value)}
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{t("selectService")}</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.duracao_minutos} min)
                </option>
              ))}
            </select>
            {duracao > 0 && (
              <p className="text-xs text-stone-400">{t("duration")}: {duracao} {t("minutes")}</p>
            )}
          </div>

          {/* Profissional */}
          <div className="space-y-2">
            <label htmlFor="profissional_id" className="text-sm font-medium text-stone-700">
              {t("professionalRequired")}
            </label>
            <select
              id="profissional_id"
              name="profissional_id"
              required
              disabled={isLoading}
              defaultValue={currentProfissionalId ?? ""}
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">{t("selectProfessional")}</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Data/hora */}
          <div className="space-y-2">
            <label htmlFor="data_hora_inicio" className="text-sm font-medium text-stone-700">
              {t("dateTime")}
            </label>
            <Input
              id="data_hora_inicio"
              name="data_hora_inicio"
              type="datetime-local"
              required
              disabled={isLoading}
              defaultValue={defaultDateTime}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <label htmlFor="notas" className="text-sm font-medium text-stone-700">
              {t("notes")}
            </label>
            <Input
              id="notas"
              name="notas"
              type="text"
              placeholder={t("notesOptional")}
              disabled={isLoading}
            />
          </div>

          {/* Secado — só aparece se serviço tem pausa configurada */}
          {hasPausa && selectedServicoObj && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="add_secado_check"
                  checked={addSecado}
                  onChange={(e) => {
                    setAddSecado(e.target.checked);
                    if (e.target.checked && defaultDateTime) {
                      // Auto-sugestão: início + duração aplicação + pausa
                      const inicioDate = new Date(defaultDateTime);
                      const sugerido = new Date(
                        inicioDate.getTime() +
                          (selectedServicoObj.duracao_minutos + (selectedServicoObj.tempo_pausa_minutos ?? 0)) * 60 * 1000
                      );
                      const local = new Date(sugerido.getTime() - sugerido.getTimezoneOffset() * 60000);
                      setSecadoHorario(local.toISOString().slice(0, 16));
                    }
                  }}
                  className="size-4 rounded border-stone-300 accent-bellus-gold"
                />
                <label htmlFor="add_secado_check" className="text-sm font-medium text-amber-700">
                  {t("addDrying")}
                </label>
              </div>
              {addSecado && (
                <>
                  <p className="text-xs text-amber-600">
                    {t("processingPause")}: {selectedServicoObj.tempo_pausa_minutos} min · {t("drying")}: {selectedServicoObj.duracao_pos_pausa_minutos} min
                  </p>
                  <div className="space-y-1">
                    <label htmlFor="secado_hora" className="text-xs font-medium text-stone-700">
                      {t("dryingTime")}
                    </label>
                    <Input
                      id="secado_hora"
                      type="datetime-local"
                      value={secadoHorario}
                      onChange={(e) => setSecadoHorario(e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-stone-400">
                      {t("dryingHint")}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              {t("close")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("creating") : t("createShift")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
