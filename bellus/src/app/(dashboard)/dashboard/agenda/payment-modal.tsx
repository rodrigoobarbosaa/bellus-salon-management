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
  Gift,
  Star,
  Camera,
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

const COURTESY_TYPES = [
  { value: "cortesia", label: "Cortesía", icon: Gift },
  { value: "influencer", label: "Influencer", icon: Star },
  { value: "modelo", label: "Modelo", icon: Camera },
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
  const [modo, setModo] = useState<"normal" | "cortesia">("normal");
  const [courtesyType, setCourtesyType] = useState<string>("cortesia");
  const [precoManual, setPrecoManual] = useState("");
  const [usarPrecoManual, setUsarPrecoManual] = useState(false);

  const valorFinal = useMemo(() => {
    if (modo === "cortesia") return 0;
    if (usarPrecoManual && precoManual !== "") {
      return Math.max(0, parseFloat(precoManual) || 0);
    }
    const desc = parseFloat(valorDesconto) || 0;
    if (tipoDesconto === "percentual" && desc > 0) {
      return Math.max(0, precoBase - (precoBase * desc) / 100);
    }
    if (tipoDesconto === "fixo" && desc > 0) {
      return Math.max(0, precoBase - desc);
    }
    return precoBase;
  }, [modo, usarPrecoManual, precoManual, precoBase, tipoDesconto, valorDesconto]);

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

    if (modo === "cortesia") {
      fd.set("forma_pagamento", "efectivo");
      fd.set("tipo_desconto", "percentual");
      fd.set("valor_desconto", "100");
      fd.set("valor_final", "0");
      const courtesyLabel =
        COURTESY_TYPES.find((t) => t.value === courtesyType)?.label ?? "Cortesía";
      fd.set(
        "notas",
        notas
          ? `[${courtesyLabel.toUpperCase()}] ${notas}`
          : `[${courtesyLabel.toUpperCase()}]`
      );
    } else {
      fd.set("forma_pagamento", formaPagamento);
      fd.set("valor_final", valorFinal.toString());
      if (usarPrecoManual && precoManual !== "") {
        const diff = precoBase - valorFinal;
        if (diff > 0) {
          fd.set("tipo_desconto", "fixo");
          fd.set("valor_desconto", diff.toFixed(2));
        }
      } else if (tipoDesconto) {
        fd.set("tipo_desconto", tipoDesconto);
        fd.set("valor_desconto", valorDesconto || "0");
      }
      if (notas) fd.set("notas", notas);
    }

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
    setModo("normal");
    setCourtesyType("cortesia");
    setPrecoManual("");
    setUsarPrecoManual(false);
    onOpenChange(false);
  }

  function handleDownloadRecibo() {
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF({ unit: "mm", format: [80, 160] });
      const w = 80;
      const fecha = new Date().toLocaleDateString("es-ES");
      let y = 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("RECIBO", w / 2, y, { align: "center" });
      y += 8;

      doc.setDrawColor(180);
      doc.line(5, y, w - 5, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const info = [
        ["Cliente", agendamento.cliente_nome ?? "—"],
        ["Servicio", agendamento.servico_nome ?? servico?.nome ?? "—"],
        ["Profesional", agendamento.profissional_nome ?? "—"],
        ["Fecha", fecha],
      ];
      for (const [label, value] of info) {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 5, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 30, y);
        y += 5;
      }

      y += 3;
      doc.line(5, y, w - 5, y);
      y += 6;

      doc.setFontSize(9);
      doc.text("Precio base:", 5, y);
      doc.text(formatCurrency(precoBase), w - 5, y, { align: "right" });
      y += 5;

      if (valorFinal !== precoBase) {
        doc.text("Descuento:", 5, y);
        doc.text(`-${formatCurrency(precoBase - valorFinal)}`, w - 5, y, {
          align: "right",
        });
        y += 5;
      }

      y += 2;
      doc.setDrawColor(0);
      doc.line(5, y, w - 5, y);
      y += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("TOTAL:", 5, y);
      doc.text(formatCurrency(valorFinal), w - 5, y, { align: "right" });
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `Pago: ${FORMAS_PAGAMENTO.find((f) => f.value === formaPagamento)?.label ?? formaPagamento}`,
        5,
        y
      );
      y += 10;

      doc.setFontSize(10);
      doc.text("¡Gracias por su visita!", w / 2, y, { align: "center" });

      doc.save(`recibo-${new Date().toISOString().slice(0, 10)}.pdf`);
    });
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h3 className="text-lg font-semibold">
              {modo === "cortesia" ? "Cortesía registrada" : "Pago registrado"}
            </h3>
            <p className="text-center text-sm text-muted-foreground">
              {modo === "cortesia"
                ? `${COURTESY_TYPES.find((t) => t.value === courtesyType)?.label} — ${agendamento.servico_nome ?? servico?.nome}`
                : `${formatCurrency(valorFinal)} — ${FORMAS_PAGAMENTO.find((f) => f.value === formaPagamento)?.label}`}
            </p>
            <div className="flex gap-2">
              {modo !== "cortesia" && (
                <Button
                  variant="outline"
                  onClick={handleDownloadRecibo}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar recibo
                </Button>
              )}
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service info */}
          <div className="rounded-lg border bg-gray-50 p-3">
            <p className="font-medium">
              {agendamento.servico_nome ?? servico?.nome}
            </p>
            <p className="text-sm text-muted-foreground">
              {agendamento.cliente_nome} · {agendamento.profissional_nome}
            </p>
            <p className="mt-1 text-lg font-bold">{formatCurrency(precoBase)}</p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => setModo("normal")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                modo === "normal"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-50"
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setModo("cortesia")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium border-l transition-colors ${
                modo === "cortesia"
                  ? "bg-purple-600 text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              <Gift className="h-3.5 w-3.5" />
              Cortesía
            </button>
          </div>

          {modo === "cortesia" ? (
            <>
              {/* Courtesy type */}
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {COURTESY_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCourtesyType(value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${
                        courtesyType === value
                          ? "border-purple-400 bg-purple-50 text-purple-700 font-medium"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free service indicator */}
              <div className="flex justify-between items-center rounded-lg border-2 border-purple-200 bg-purple-50 p-3">
                <span className="text-sm font-medium text-purple-800">
                  Servicio gratuito
                </span>
                <span className="text-xl font-bold text-purple-700">
                  {formatCurrency(0)}
                </span>
              </div>
            </>
          ) : (
            <>
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

              {/* Price section */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {usarPrecoManual ? "Precio manual" : "Descuento (opcional)"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUsarPrecoManual(!usarPrecoManual);
                      setTipoDesconto("");
                      setValorDesconto("");
                      setPrecoManual("");
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    {usarPrecoManual ? "Usar descuento" : "Precio manual"}
                  </button>
                </div>

                {usarPrecoManual ? (
                  <div className="mt-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        €
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={precoManual}
                        onChange={(e) => setPrecoManual(e.target.value)}
                        placeholder={precoBase.toFixed(2)}
                        className="w-full rounded-lg border pl-8 pr-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2">
                    <div className="flex rounded-lg border overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setTipoDesconto(
                            tipoDesconto === "percentual" ? "" : "percentual"
                          )
                        }
                        className={`flex items-center gap-1 px-3 py-2 text-sm ${
                          tipoDesconto === "percentual"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <Percent className="h-3 w-3" />%
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTipoDesconto(
                            tipoDesconto === "fixo" ? "" : "fixo"
                          )
                        }
                        className={`flex items-center gap-1 px-3 py-2 text-sm border-l ${
                          tipoDesconto === "fixo"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <Hash className="h-3 w-3" />€
                      </button>
                    </div>
                    {tipoDesconto && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={valorDesconto}
                        onChange={(e) => setValorDesconto(e.target.value)}
                        placeholder={
                          tipoDesconto === "percentual" ? "10" : "5.00"
                        }
                        className="flex-1 rounded-lg border px-3 py-2 text-sm"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Final value display */}
              {((tipoDesconto && parseFloat(valorDesconto) > 0) ||
                (usarPrecoManual &&
                  precoManual !== "" &&
                  valorFinal !== precoBase)) && (
                <div className="flex justify-between items-center rounded-lg border-2 border-green-200 bg-green-50 p-3">
                  <span className="text-sm font-medium text-green-800">
                    Total a cobrar:
                  </span>
                  <span className="text-xl font-bold text-green-700">
                    {formatCurrency(valorFinal)}
                  </span>
                </div>
              )}
            </>
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
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className={
              modo === "cortesia"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-green-600 hover:bg-green-700"
            }
          >
            {isLoading
              ? "Registrando..."
              : modo === "cortesia"
                ? "Registrar cortesía"
                : `Cobrar ${formatCurrency(valorFinal)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
