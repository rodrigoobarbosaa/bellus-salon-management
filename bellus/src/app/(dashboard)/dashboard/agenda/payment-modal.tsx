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
import { createComandaTransacoes } from "@/app/actions/transacoes";
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
  Plus,
  X,
  Split,
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

  // Existing state
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

  // Extra services state
  const [servicosExtras, setServicosExtras] = useState<string[]>([]);
  const [showExtraSelect, setShowExtraSelect] = useState(false);

  // Split payment state
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [split1Forma, setSplit1Forma] = useState("efectivo");
  const [split2Forma, setSplit2Forma] = useState("tarjeta");
  const [split1Valor, setSplit1Valor] = useState("");
  const [split2Valor, setSplit2Valor] = useState("");

  // Total bruto = main service + extras
  const totalBruto = useMemo(() => {
    let total = precoBase;
    for (const sid of servicosExtras) {
      const s = servicos.find((sv) => sv.id === sid);
      if (s) total += s.preco_base;
    }
    return total;
  }, [precoBase, servicosExtras, servicos]);

  // Valor final after discount
  const valorFinal = useMemo(() => {
    if (modo === "cortesia") return 0;
    if (usarPrecoManual && precoManual !== "") {
      return Math.max(0, parseFloat(precoManual) || 0);
    }
    const desc = parseFloat(valorDesconto) || 0;
    if (tipoDesconto === "percentual" && desc > 0) {
      return Math.max(0, totalBruto - (totalBruto * desc) / 100);
    }
    if (tipoDesconto === "fixo" && desc > 0) {
      return Math.max(0, totalBruto - desc);
    }
    return totalBruto;
  }, [modo, usarPrecoManual, precoManual, totalBruto, tipoDesconto, valorDesconto]);

  // Split validation
  const splitValid = useMemo(() => {
    if (!splitEnabled) return true;
    const v1 = parseFloat(split1Valor) || 0;
    const v2 = parseFloat(split2Valor) || 0;
    return Math.abs(v1 + v2 - valorFinal) < 0.01 && v1 > 0 && v2 > 0;
  }, [splitEnabled, split1Valor, split2Valor, valorFinal]);

  // Available services for extras (exclude main + already added)
  const availableExtras = useMemo(() => {
    const usedIds = new Set([agendamento.servico_id, ...servicosExtras]);
    return servicos.filter((s) => !usedIds.has(s.id) && s.preco_base > 0);
  }, [servicos, agendamento.servico_id, servicosExtras]);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  }

  function addExtra(servicoId: string) {
    setServicosExtras((prev) => [...prev, servicoId]);
    setShowExtraSelect(false);
  }

  function removeExtra(servicoId: string) {
    setServicosExtras((prev) => prev.filter((id) => id !== servicoId));
  }

  // Auto-fill split2 when split1 changes
  function handleSplit1Change(val: string) {
    setSplit1Valor(val);
    const v1 = parseFloat(val) || 0;
    if (v1 > 0 && v1 <= valorFinal) {
      setSplit2Valor((valorFinal - v1).toFixed(2));
    }
  }

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);

    // Build all service items
    const allServicos = [agendamento.servico_id, ...servicosExtras];

    // Build payload
    const payload = {
      agendamento_id: agendamento.id,
      cliente_id: agendamento.cliente_id,
      profissional_id: agendamento.profissional_id,
      servicos: allServicos,
      tipo_desconto: null as string | null,
      valor_desconto: 0,
      notas: null as string | null,
      cortesia: modo === "cortesia",
      tipo_cortesia: modo === "cortesia" ? courtesyType : null,
      split: splitEnabled && modo !== "cortesia",
      pagamento1: {
        forma: splitEnabled ? split1Forma : formaPagamento,
        valor: splitEnabled ? parseFloat(split1Valor) || 0 : valorFinal,
      },
      pagamento2: splitEnabled
        ? {
            forma: split2Forma,
            valor: parseFloat(split2Valor) || 0,
          }
        : null,
    };

    if (modo === "cortesia") {
      const courtesyLabel =
        COURTESY_TYPES.find((ct) => ct.value === courtesyType)?.label ?? "Cortesía";
      payload.tipo_desconto = "percentual";
      payload.valor_desconto = 100;
      payload.notas = notas
        ? `[${courtesyLabel.toUpperCase()}] ${notas}`
        : `[${courtesyLabel.toUpperCase()}]`;
      payload.pagamento1 = { forma: "efectivo", valor: 0 };
    } else {
      if (usarPrecoManual && precoManual !== "") {
        const diff = totalBruto - valorFinal;
        if (diff > 0) {
          payload.tipo_desconto = "fixo";
          payload.valor_desconto = parseFloat(diff.toFixed(2));
        }
      } else if (tipoDesconto) {
        payload.tipo_desconto = tipoDesconto;
        payload.valor_desconto = parseFloat(valorDesconto) || 0;
      }
      if (notas) payload.notas = notas;
    }

    const result = await createComandaTransacoes(JSON.stringify(payload));
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
    setServicosExtras([]);
    setShowExtraSelect(false);
    setSplitEnabled(false);
    setSplit1Forma("efectivo");
    setSplit2Forma("tarjeta");
    setSplit1Valor("");
    setSplit2Valor("");
    onOpenChange(false);
  }

  function handleDownloadRecibo() {
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF({ unit: "mm", format: [80, 200] });
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

      // List all services
      doc.setFontSize(9);
      const mainNome = agendamento.servico_nome ?? servico?.nome ?? "—";
      doc.text(mainNome, 5, y);
      doc.text(formatCurrency(precoBase), w - 5, y, { align: "right" });
      y += 5;

      for (const sid of servicosExtras) {
        const extraSvc = servicos.find((sv) => sv.id === sid);
        if (extraSvc) {
          doc.text(extraSvc.nome, 5, y);
          doc.text(formatCurrency(extraSvc.preco_base), w - 5, y, { align: "right" });
          y += 5;
        }
      }

      if (valorFinal !== totalBruto) {
        doc.text("Descuento:", 5, y);
        doc.text(`-${formatCurrency(totalBruto - valorFinal)}`, w - 5, y, {
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

      // Payment method(s)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      if (splitEnabled) {
        const label1 = FORMAS_PAGAMENTO.find((f) => f.value === split1Forma)?.label ?? split1Forma;
        const label2 = FORMAS_PAGAMENTO.find((f) => f.value === split2Forma)?.label ?? split2Forma;
        doc.text(`${label1}: ${formatCurrency(parseFloat(split1Valor) || 0)}`, 5, y);
        y += 5;
        doc.text(`${label2}: ${formatCurrency(parseFloat(split2Valor) || 0)}`, 5, y);
      } else {
        doc.text(
          `Pago: ${FORMAS_PAGAMENTO.find((f) => f.value === formaPagamento)?.label ?? formaPagamento}`,
          5,
          y
        );
      }
      y += 10;

      doc.setFontSize(10);
      doc.text("¡Gracias por su visita!", w / 2, y, { align: "center" });

      doc.save(`recibo-${new Date().toISOString().slice(0, 10)}.pdf`);
    });
  }

  // --- Success screen ---
  if (success) {
    const successMsg = splitEnabled
      ? `${formatCurrency(parseFloat(split1Valor) || 0)} + ${formatCurrency(parseFloat(split2Valor) || 0)}`
      : `${formatCurrency(valorFinal)} — ${FORMAS_PAGAMENTO.find((f) => f.value === formaPagamento)?.label}`;

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
                ? `${COURTESY_TYPES.find((ct) => ct.value === courtesyType)?.label} — ${agendamento.servico_nome ?? servico?.nome}`
                : successMsg}
            </p>
            {servicosExtras.length > 0 && (
              <p className="text-xs text-muted-foreground">
                +{servicosExtras.length} servicio{servicosExtras.length > 1 ? "s" : ""} adicional{servicosExtras.length > 1 ? "es" : ""}
              </p>
            )}
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

  // --- Main form ---
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main service info */}
          <div className="rounded-lg border bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {agendamento.servico_nome ?? servico?.nome}
                </p>
                <p className="text-sm text-muted-foreground">
                  {agendamento.cliente_nome} · {agendamento.profissional_nome}
                </p>
              </div>
              <p className="text-lg font-bold">{formatCurrency(precoBase)}</p>
            </div>
          </div>

          {/* Extra services */}
          {servicosExtras.length > 0 && (
            <div className="space-y-1">
              {servicosExtras.map((sid) => {
                const extraSvc = servicos.find((sv) => sv.id === sid);
                if (!extraSvc) return null;
                return (
                  <div
                    key={sid}
                    className="flex items-center justify-between rounded-lg border bg-blue-50 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-blue-800">
                      {extraSvc.nome}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-blue-700">
                        {formatCurrency(extraSvc.preco_base)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExtra(sid)}
                        className="text-blue-400 hover:text-red-500 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add extra service button */}
          {modo !== "cortesia" && (
            <div>
              {showExtraSelect ? (
                <div className="space-y-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) addExtra(e.target.value);
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Seleccionar servicio...
                    </option>
                    {availableExtras.map((sv) => (
                      <option key={sv.id} value={sv.id}>
                        {sv.nome} — {formatCurrency(sv.preco_base)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowExtraSelect(false)}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                availableExtras.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowExtraSelect(true)}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Añadir servicio
                  </button>
                )
              )}
            </div>
          )}

          {/* Total bruto if extras exist */}
          {servicosExtras.length > 0 && modo !== "cortesia" && (
            <div className="flex justify-between items-center rounded-lg border bg-gray-100 px-3 py-2">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm font-bold">{formatCurrency(totalBruto)}</span>
            </div>
          )}

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
              {/* Payment method (single or split) */}
              {!splitEnabled ? (
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
              ) : (
                <div className="space-y-3">
                  {/* Split 1 */}
                  <div className="rounded-lg border p-3 space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Pago 1
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FORMAS_PAGAMENTO.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSplit1Forma(value)}
                          className={`flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-colors ${
                            split1Forma === value
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        €
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={valorFinal}
                        value={split1Valor}
                        onChange={(e) => handleSplit1Change(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border pl-8 pr-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Split 2 */}
                  <div className="rounded-lg border p-3 space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Pago 2
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {FORMAS_PAGAMENTO.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setSplit2Forma(value)}
                          className={`flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-colors ${
                            split2Forma === value
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        €
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={split2Valor}
                        onChange={(e) => setSplit2Valor(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border pl-8 pr-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Split validation */}
                  {split1Valor && split2Valor && !splitValid && (
                    <p className="text-xs text-red-500">
                      La suma ({formatCurrency((parseFloat(split1Valor) || 0) + (parseFloat(split2Valor) || 0))}) debe ser igual al total ({formatCurrency(valorFinal)})
                    </p>
                  )}
                </div>
              )}

              {/* Split toggle */}
              <button
                type="button"
                onClick={() => {
                  setSplitEnabled(!splitEnabled);
                  setSplit1Valor("");
                  setSplit2Valor("");
                }}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  splitEnabled
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Split className="h-4 w-4" />
                {splitEnabled ? "Cancelar pago dividido" : "Dividir pago"}
              </button>

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
                        placeholder={totalBruto.toFixed(2)}
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
                  valorFinal !== totalBruto) ||
                servicosExtras.length > 0) && (
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
            disabled={isLoading || (splitEnabled && !splitValid)}
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
