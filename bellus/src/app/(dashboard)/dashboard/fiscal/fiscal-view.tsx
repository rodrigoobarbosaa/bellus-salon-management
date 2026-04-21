"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  Calculator,
  Receipt,
  TrendingDown,
  TrendingUp,
  Download,
  Plus,
  Trash2,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createDespesa, deleteDespesa, updateConfigFiscal } from "@/app/actions/fiscal";

interface ConfigFiscal {
  iva_pct: number;
  irpf_pct: number;
  cuota_autonomos_mensual: number;
  nif: string | null;
  nombre_fiscal: string | null;
  emitir_factura_auto: boolean;
}

interface Despesa {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  notas: string | null;
}

interface FiscalViewProps {
  salaoId: string;
  salaoNome: string;
  configFiscal: ConfigFiscal;
}

// TRIMESTRE_LABELS and CATEGORIA_LABELS moved inside component for i18n access

// AEAT deadline dates
const DEADLINES = [
  { month: 0, day: 20, label: "T4 anterior" },
  { month: 3, day: 20, label: "T1" },
  { month: 6, day: 20, label: "T2" },
  { month: 9, day: 20, label: "T3" },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

function getCurrentTrimestre() {
  const month = new Date().getMonth();
  return Math.floor(month / 3) + 1;
}

function getTrimestreDates(year: number, trimestre: number) {
  const startMonth = (trimestre - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59);
  return { start, end };
}

export function FiscalView({ salaoId, salaoNome, configFiscal }: FiscalViewProps) {
  const t = useTranslations("fiscal");
  const tc = useTranslations("common");

  const TRIMESTRE_LABELS = ["T1 (Ene-Mar)", "T2 (Abr-Jun)", "T3 (Jul-Sep)", "T4 (Oct-Dic)"];

  const CATEGORIA_LABELS: Record<string, string> = {
    produtos: t("categories.produtos"),
    aluguel: t("categories.aluguel"),
    formacao: t("categories.formacao"),
    suprimentos: t("categories.suprimentos"),
    cuota_autonomos: t("categories.cuota_autonomos"),
    outros: t("categories.outros"),
  };

  const [tab, setTab] = useState<"resumo" | "despesas" | "config">("resumo");
  const [year, setYear] = useState(new Date().getFullYear());
  const [trimestre, setTrimestre] = useState(getCurrentTrimestre());

  // Data
  const [ingresos, setIngresos] = useState(0);
  const [gastos, setGastos] = useState(0);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);

  // Despesa form
  const [showDespesaForm, setShowDespesaForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Config form
  const [ivaPct, setIvaPct] = useState(configFiscal.iva_pct.toString());
  const [irpfPct, setIrpfPct] = useState(configFiscal.irpf_pct.toString());
  const [cuota, setCuota] = useState(configFiscal.cuota_autonomos_mensual.toString());
  const [nif, setNif] = useState(configFiscal.nif ?? "");
  const [nombreFiscal, setNombreFiscal] = useState(configFiscal.nombre_fiscal ?? "");
  const [emitirFacturaAuto, setEmitirFacturaAuto] = useState(configFiscal.emitir_factura_auto);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState("");

  const supabase = createClient();

  // Fiscal alert
  const nextDeadline = DEADLINES.find((d) => {
    const deadline = new Date(year, d.month, d.day);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return diff > 0 && diff < 30 * 86400000;
  });

  const fetchData = useCallback(async () => {
    setLoading(true);

    const { start, end } = getTrimestreDates(year, trimestre);

    // Fetch transactions (ingresos) — filter by service date
    const startDate = start.toISOString().split("T")[0];
    const endDate = end.toISOString().split("T")[0];
    const { data: transacoes } = await supabase
      .from("transacoes")
      .select("valor_final")
      .gte("data_servico", startDate)
      .lte("data_servico", endDate);

    const totalIngresos = ((transacoes as { valor_final: number }[]) ?? [])
      .reduce((sum: number, t: { valor_final: number }) => sum + t.valor_final, 0);
    setIngresos(totalIngresos);

    // Fetch despesas
    const { data: rawDespesas } = await supabase
      .from("despesas")
      .select("*")
      .gte("data", start.toISOString().split("T")[0])
      .lte("data", end.toISOString().split("T")[0])
      .order("data", { ascending: false });

    const despList = (rawDespesas ?? []) as Despesa[];
    setDespesas(despList);

    const totalGastos = despList.reduce((sum, d) => sum + d.valor, 0);
    // Add cuota autonomos for 3 months if configured
    const cuotaTotal = configFiscal.cuota_autonomos_mensual * 3;
    setGastos(totalGastos + cuotaTotal);

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, trimestre]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculations
  const ivaRepercutido = ingresos * (configFiscal.iva_pct / 100);
  const ivaSoportado = gastos * (configFiscal.iva_pct / 100);
  const ivaLiquidar = ivaRepercutido - ivaSoportado;
  const rendimientoNeto = ingresos - gastos;
  const irpfPagar = Math.max(0, rendimientoNeto * (configFiscal.irpf_pct / 100));

  async function handleCreateDespesa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await createDespesa(fd);
    setSaving(false);
    setShowDespesaForm(false);
    fetchData();
  }

  async function handleDeleteDespesa(id: string) {
    await deleteDespesa(id);
    fetchData();
  }

  async function handleSaveConfig() {
    setConfigSaving(true);
    setConfigMsg("");
    const fd = new FormData();
    fd.set("iva_pct", ivaPct);
    fd.set("irpf_pct", irpfPct);
    fd.set("cuota_autonomos_mensual", cuota);
    fd.set("nif", nif);
    fd.set("nombre_fiscal", nombreFiscal);
    fd.set("emitir_factura_auto", emitirFacturaAuto ? "true" : "false");
    const result = await updateConfigFiscal(fd);
    setConfigSaving(false);
    if (result.error) {
      setConfigMsg(result.error);
    } else {
      setConfigMsg(t("savedOk"));
    }
  }

  function exportModelo303() {
    const lines = [
      "MODELO 303 — AUTOLIQUIDACIÓN IVA",
      `Periodo: ${TRIMESTRE_LABELS[trimestre - 1]} ${year}`,
      `Contribuyente: ${configFiscal.nombre_fiscal ?? salaoNome}`,
      `NIF: ${configFiscal.nif ?? "—"}`,
      "",
      "CONCEPTO;BASE IMPONIBLE;TIPO;CUOTA",
      `IVA Repercutido (ventas);${ingresos.toFixed(2)};${configFiscal.iva_pct}%;${ivaRepercutido.toFixed(2)}`,
      `IVA Soportado (gastos);${gastos.toFixed(2)};${configFiscal.iva_pct}%;${ivaSoportado.toFixed(2)}`,
      "",
      `RESULTADO A INGRESAR/DEVOLVER;${ivaLiquidar.toFixed(2)}`,
    ];

    downloadCSV(lines.join("\n"), `modelo-303-${TRIMESTRE_LABELS[trimestre - 1]}-${year}.csv`);
  }

  function exportModelo130() {
    const lines = [
      "MODELO 130 — PAGO FRACCIONADO IRPF",
      `Periodo: ${TRIMESTRE_LABELS[trimestre - 1]} ${year}`,
      `Contribuyente: ${configFiscal.nombre_fiscal ?? salaoNome}`,
      `NIF: ${configFiscal.nif ?? "—"}`,
      "",
      "CONCEPTO;IMPORTE",
      `Ingresos íntegros;${ingresos.toFixed(2)}`,
      `Gastos deducibles;${gastos.toFixed(2)}`,
      `Rendimiento neto;${rendimientoNeto.toFixed(2)}`,
      `Tipo aplicable;${configFiscal.irpf_pct}%`,
      `Pago fraccionado;${irpfPagar.toFixed(2)}`,
    ];

    downloadCSV(lines.join("\n"), `modelo-130-${TRIMESTRE_LABELS[trimestre - 1]}-${year}.csv`);
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Fiscal alert */}
      {nextDeadline && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-medium text-amber-800">
              {t("nextDeadline")} ({nextDeadline.label})
            </p>
            <p className="text-sm text-amber-700">
              {t("deadlineDate")}: 20/{(DEADLINES.indexOf(nextDeadline) * 3 + 1).toString().padStart(2, "0")}/{year}.
              {" "}{t("deadlineReminder")}
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <AlertTriangle className="mr-2 inline size-4" />
        {t("disclaimer")}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {(["resumo", "despesas", "config"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabKey ? "bg-white shadow-sm" : "hover:bg-gray-200"
            }`}
          >
            {tabKey === "resumo" ? t("quarterlySummary") : tabKey === "despesas" ? t("expenses") : t("configuration")}
          </button>
        ))}
      </div>

      {/* Trimestre selector (for resumo and despesas) */}
      {tab !== "config" && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="flex gap-1 rounded-lg border overflow-hidden">
            {TRIMESTRE_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => setTrimestre(i + 1)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  trimestre === i + 1
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-gray-50"
                }`}
              >
                T{i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* === RESUMO TAB === */}
      {tab === "resumo" && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{tc("loading")}</div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    {t("income")}
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(ingresos)}</p>
                </div>

                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    {t("expenses")}
                  </div>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(gastos)}</p>
                </div>

                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Receipt className="h-4 w-4 text-blue-500" />
                    {t("ivaToSettle")}
                  </div>
                  <p className={`text-2xl font-bold ${ivaLiquidar >= 0 ? "text-blue-600" : "text-green-600"}`}>
                    {formatCurrency(ivaLiquidar)}
                  </p>
                </div>

                <div className="bg-white border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calculator className="h-4 w-4 text-purple-500" />
                    {t("irpfInstallment")}
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(irpfPagar)}</p>
                </div>
              </div>

              {/* Detailed breakdown */}
              <div className="bg-white border rounded-xl p-6">
                <h2 className="font-semibold mb-4">{t("breakdown")} — {TRIMESTRE_LABELS[trimestre - 1]} {year}</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span>{t("grossIncome")}</span>
                    <span className="font-medium">{formatCurrency(ingresos)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>{t("ivaCollected")} ({configFiscal.iva_pct}%)</span>
                    <span className="font-medium">{formatCurrency(ivaRepercutido)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>{t("deductibleExpenses")}</span>
                    <span className="font-medium text-red-600">-{formatCurrency(gastos)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>{t("ivaDeductible")} ({configFiscal.iva_pct}%)</span>
                    <span className="font-medium text-red-600">-{formatCurrency(ivaSoportado)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b font-semibold">
                    <span>{t("ivaBalance")}</span>
                    <span className={ivaLiquidar >= 0 ? "text-blue-600" : "text-green-600"}>
                      {formatCurrency(ivaLiquidar)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>{t("netIncome")}</span>
                    <span className="font-medium">{formatCurrency(rendimientoNeto)}</span>
                  </div>
                  <div className="flex justify-between py-2 font-semibold">
                    <span>{t("irpfPayment")} {configFiscal.irpf_pct}% (Modelo 130)</span>
                    <span className="text-purple-600">{formatCurrency(irpfPagar)}</span>
                  </div>
                </div>
              </div>

              {/* Export buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={exportModelo303} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t("exportModelo303")}
                </Button>
                <Button onClick={exportModelo130} variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  {t("exportModelo130")}
                </Button>
              </div>
              <p className="text-xs text-stone-400 italic">{t("exportDisclaimer")}</p>
            </>
          )}
        </div>
      )}

      {/* === DESPESAS TAB === */}
      {tab === "despesas" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">{t("deductibleExpenses")} — {TRIMESTRE_LABELS[trimestre - 1]} {year}</h2>
            <Button onClick={() => setShowDespesaForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("newExpense")}
            </Button>
          </div>

          {configFiscal.cuota_autonomos_mensual > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              {t("cuotaAutonomos")}: {formatCurrency(configFiscal.cuota_autonomos_mensual)}/mes ×3 = {formatCurrency(configFiscal.cuota_autonomos_mensual * 3)} ({t("includedAutomatically")})
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{tc("loading")}</div>
          ) : despesas.length === 0 ? (
            <div className="bg-white border rounded-xl p-8 text-center text-muted-foreground">
              {t("noExpenses")}
            </div>
          ) : (
            <div className="bg-white border rounded-xl divide-y">
              {despesas.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{d.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORIA_LABELS[d.categoria] ?? d.categoria} · {d.data}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatCurrency(d.valor)}</span>
                    <button
                      onClick={() => handleDeleteDespesa(d.id)}
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between p-4 bg-gray-50 font-semibold">
                <span>{t("totalRegistered")}</span>
                <span>{formatCurrency(despesas.reduce((sum, d) => sum + d.valor, 0))}</span>
              </div>
            </div>
          )}

          {/* New despesa dialog */}
          <Dialog open={showDespesaForm} onOpenChange={setShowDespesaForm}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("newDeductibleExpense")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDespesa} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t("expenseDescription")}</label>
                  <input
                    name="descricao"
                    required
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                    placeholder={t("descriptionPlaceholder")}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">{t("expenseCategory")}</label>
                    <select name="categoria" required className="w-full mt-1 border rounded-lg px-3 py-2 text-sm">
                      {Object.entries(CATEGORIA_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t("valueEur")}</label>
                    <input
                      name="valor"
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">{t("date")}</label>
                  <input
                    name="data"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t("notesOptional")}</label>
                  <input
                    name="notas"
                    className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                    placeholder={t("notesPlaceholder")}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowDespesaForm(false)}>
                    {tc("cancel")}
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? tc("saving") : tc("save")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* === CONFIG TAB === */}
      {tab === "config" && (
        <div className="bg-white border rounded-xl p-6 max-w-lg">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-5 w-5" />
            <h2 className="font-semibold">{t("fiscalConfig")}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("nif")}</label>
              <input
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                placeholder={t("nifPlaceholder")}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("fiscalName")}</label>
              <input
                value={nombreFiscal}
                onChange={(e) => setNombreFiscal(e.target.value)}
                className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                placeholder={t("fiscalNamePlaceholder")}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">{t("ivaPct")}</label>
                <input
                  type="number"
                  step="0.01"
                  value={ivaPct}
                  onChange={(e) => setIvaPct(e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("irpfPct")}</label>
                <input
                  type="number"
                  step="0.01"
                  value={irpfPct}
                  onChange={(e) => setIrpfPct(e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t("cuotaMonthly")}</label>
                <input
                  type="number"
                  step="0.01"
                  value={cuota}
                  onChange={(e) => setCuota(e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Toggle emitir factura automática */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{t("autoInvoice")}</p>
                <p className="text-xs text-muted-foreground">{t("autoInvoiceDesc")}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emitirFacturaAuto}
                onClick={() => setEmitirFacturaAuto(!emitirFacturaAuto)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  emitirFacturaAuto ? "bg-green-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                    emitirFacturaAuto ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {configMsg && (
              <p className={`text-sm ${configMsg.includes("Error") ? "text-red-600" : "text-green-600"}`}>
                {configMsg}
              </p>
            )}

            <Button onClick={handleSaveConfig} disabled={configSaving}>
              {configSaving ? tc("saving") : t("saveConfig")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
