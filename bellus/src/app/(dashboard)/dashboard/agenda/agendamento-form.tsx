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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clienteSearch, setClienteSearch] = useState("");
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string; telefone: string | null }>>([]);
  const [selectedCliente, setSelectedCliente] = useState<{ id: string; nome: string } | null>(null);
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [selectedServico, setSelectedServico] = useState("");
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
      setError("Selecciona un cliente o crea uno nuevo.");
      setIsLoading(false);
      return;
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
    onOpenChange(false);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null);
      setSelectedCliente(null);
      setClienteSearch("");
      setShowNewCliente(false);
      setSelectedServico("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo turno</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          {/* Cliente */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">Cliente *</label>
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
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <>
                    <Input
                      type="text"
                      placeholder="Buscar cliente por nombre..."
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
                      + Crear nuevo cliente
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="space-y-2 rounded-md border border-stone-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-500">Nuevo cliente</span>
                  <button
                    type="button"
                    onClick={() => setShowNewCliente(false)}
                    className="text-xs text-stone-400 hover:text-stone-600"
                  >
                    Cancelar
                  </button>
                </div>
                <Input
                  name="new_cliente_nome"
                  type="text"
                  placeholder="Nombre del cliente *"
                  required={showNewCliente}
                  disabled={isLoading}
                />
                <Input
                  name="new_cliente_telefone"
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          {/* Serviço */}
          <div className="space-y-2">
            <label htmlFor="servico_id" className="text-sm font-medium text-stone-700">
              Servicio *
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
              <option value="">Seleccionar servicio...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.duracao_minutos} min)
                </option>
              ))}
            </select>
            {duracao > 0 && (
              <p className="text-xs text-stone-400">Duración: {duracao} minutos</p>
            )}
          </div>

          {/* Profissional */}
          <div className="space-y-2">
            <label htmlFor="profissional_id" className="text-sm font-medium text-stone-700">
              Profesional *
            </label>
            <select
              id="profissional_id"
              name="profissional_id"
              required
              disabled={isLoading}
              defaultValue={currentProfissionalId ?? ""}
              className="border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Seleccionar profesional...</option>
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
              Fecha y hora *
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
              Notas
            </label>
            <Input
              id="notas"
              name="notas"
              type="text"
              placeholder="Notas opcionales..."
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creando..." : "Crear turno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
