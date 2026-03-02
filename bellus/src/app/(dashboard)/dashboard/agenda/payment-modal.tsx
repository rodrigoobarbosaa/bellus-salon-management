"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createTransacao } from "@/app/actions/transacoes";
import {
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
  Percent,
  Hash,
  CheckCircle,
  Download,
} from "lucide-react";

interface Agendamento {
  id: string;
  cliente_id: string;
  profissional_id: string;
  servico_id: string;
  cliente_nome?: string;
  servico_nome?: string;
  profissional_nome?: string;
}

interface Servico {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco_base: number;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: Agendamento;
  servicos: Servico[];
}

const FORMAS_PAGAMENTO = [
  { value: "efectivo", label: "Efectivo", icon: Banknote },
  { value: "tarjeta", label: "Tarjeta", icon: CreditCard },
  { value: "bizum", label: "Bizum", icon: Smartphone },
  { value: "transferencia", label: "Transferencia", icon: Building2 },
] as const;

export function PaymentModal({
  open,
  onOpenChange,
  agendamento,
  servicos,
}: PaymentModalProps) {
  const servico = servicos.find((s) => s.id === agendamento.servico_id);
  const precoBase = servico?.preco_base ?? 0;

  const [formaPagamento, setFormaPagamento] = useState<string>("efectivo");
  const [tipoDesconto, setTipoDesconto] = useState<"percentual" | "fixo" | "">("");
  const [valorDesconto, setValorDesconto] = useState("");
  const [notas, setNotas] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valorFinal = useMemo(() => {
    const desc = parseFloat(valorDesconto) || 0;
    if (tipoDesconto === "percentual" && desc > 0) {
      return Math.max(0, precoBase - (precoBase * desc) / 100);
    }
    if (tipoDesconto === "fixo" && desc > 0) {
      return Math.max(0, precoBase - desc);
    }
    return precoBase;
  }, [precoBase, tipoDesconto, valorDesconto]);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);

    const fd = new FormData();
    fd.set("agendamento_id", agendamento.id);
    fd.set("cliente_id", agendamento.cliente_id);
    fd.set("profissional_id", agendamento.profissional_id);
    fd.set("servico_id", agendamento.servico_id);
    fd.set("valor", precoBase.toString());
    fd.set("forma_pagamento", formaPagamento);
    if (tipoDesconto) {
      fd.set("tipo_desconto", tipoDesconto);
      fd.set("valor_desconto", valorDesconto || "0");
    }
    if (notas) fd.set("notas", notas);

    const result = await createTransacao(fd);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  function handleClose() {
    setSuccess(false);
    setError(null);
    setFormaPagamento("efectivo");
    setTipoDesconto("");
    setValorDesconto("");
    setNotas("");
    onOpenChange(false);
  }

  function handleDownloadRecibo() {
    // Generate simple text receipt for download
    const lines = [
      "═══════════════════════════════",
      "           RECIBO",
      "═══════════════════════════════",
      "",
      `Cliente: ${agendamento.cliente_nome ?? "—"}`,
      `Servicio: ${agendamento.servico_nome ?? servico?.nome ?? "—"}`,
      `Profesional: ${agendamento.profissional_nome ?? "—"}`,
      `Fecha: ${new Date().toLocaleDateString("es-ES")}`,
      "",
      "───────────────────────────────",
      `Precio base:     ${formatCurrency(precoBase)}`,
    ];

    if (tipoDesconto && parseFloat(valorDesconto) > 0) {
      const descLabel = tipoDesconto === "percentual"
        ? `Descuento (${valorDesconto}%):`
        : "Descuento:";
      lines.push(`${descLabel.padEnd(17)} -${formatCurrency(precoBase - valorFinal)}`);
    }

    lines.push(
      "───────────────────────────────",
      `TOTAL:           ${formatCurrency(valorFinal)}`,
      `Forma de pago:   ${FORMAS_PAGAMENTO.find(f => f.value === formaPagamento)?.label ?? formaPagamento}`,
      "",
      "═══════════════════════════════",
      "         ¡Gracias!",
      "═══════════════════════════════",
    );

    const text = lines.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recibo-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-lg font-semibold">Pago registrado</h3>
            <p className="text-center text-sm text-muted-foreground">
              {formatCurrency(valorFinal)} — {FORMAS_PAGAMENTO.find(f => f.value === formaPagamento)?.label}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadRecibo} className="gap-2">
                <Download className="h-4 w-4" />
                Descargar recibo
              </Button>
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service info */}
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="font-medium">{agendamento.servico_nome ?? servico?.nome}</p>
            <p className="text-sm text-muted-foreground">
              {agendamento.cliente_nome} · {agendamento.profissional_nome}
            </p>
            <p className="mt-1 text-lg font-bold">{formatCurrency(precoBase)}</p>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-sm font-medium">Forma de pago</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {FORMAS_PAGAMENTO.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormaPagamento(value)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                    formaPagamento === value
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="text-sm font-medium">Descuento (opcional)</label>
            <div className="mt-2 flex gap-2">
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTipoDesconto(tipoDesconto === "percentual" ? "" : "percentual")}
                  className={`flex items-center gap-1 px-3 py-2 text-sm ${
                    tipoDesconto === "percentual"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <Percent className="h-3 w-3" />
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDesconto(tipoDesconto === "fixo" ? "" : "fixo")}
                  className={`flex items-center gap-1 px-3 py-2 text-sm border-l ${
                    tipoDesconto === "fixo"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <Hash className="h-3 w-3" />
                  €
                </button>
              </div>
              {tipoDesconto && (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorDesconto}
                  onChange={(e) => setValorDesconto(e.target.value)}
                  placeholder={tipoDesconto === "percentual" ? "10" : "5.00"}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                />
              )}
            </div>
          </div>

          {/* Final value */}
          {tipoDesconto && parseFloat(valorDesconto) > 0 && (
            <div className="flex justify-between items-center rounded-lg border-2 border-green-200 bg-green-50 p-3">
              <span className="text-sm font-medium text-green-800">Total a cobrar:</span>
              <span className="text-xl font-bold text-green-700">{formatCurrency(valorFinal)}</span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Notas (opcional)</label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas del pago..."
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Registrando..." : `Cobrar ${formatCurrency(valorFinal)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
