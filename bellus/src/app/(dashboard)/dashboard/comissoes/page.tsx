"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getCommissionsData,
  updateProfessionalCommission,
  type CommissionsData,
} from "@/app/actions/comissoes";
import {
  Percent,
  TrendingUp,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Check,
  X,
  Trophy,
} from "lucide-react";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default function ComissoesPage() {
  const t = useTranslations("commissions");
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<CommissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPct, setEditPct] = useState("");
  const [editMeta, setEditMeta] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCommissionsData(month, year).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [month, year]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
    if (isCurrentMonth) return;
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function startEdit(id: string, pct: number, meta: number) {
    setEditingId(id);
    setEditPct(String(pct));
    setEditMeta(String(meta));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditPct("");
    setEditMeta("");
  }

  async function saveEdit(id: string) {
    setSaving(true);
    const result = await updateProfessionalCommission(
      id,
      parseFloat(editPct) || 30,
      parseFloat(editMeta) || 1600
    );
    setSaving(false);

    if (result.success) {
      setEditingId(null);
      // Refresh data
      const d = await getCommissionsData(month, year);
      setData(d);
    }
  }

  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-stone-900">{t("title")}</h1>
        <p className="text-sm text-stone-500">{t("subtitle")}</p>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={prevMonth}
          className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="min-w-[180px] text-center text-lg font-semibold capitalize text-stone-800">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {loading ? (
        <p className="py-20 text-center text-sm text-stone-400">{t("loading")}</p>
      ) : !data || data.professionals.length === 0 ? (
        <p className="py-20 text-center text-sm text-stone-400">{t("noData")}</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <TrendingUp className="size-4" />
                {t("totalBilled")}
              </div>
              <p className="mt-1 text-2xl font-bold text-stone-900">
                {formatCurrency(data.totals.totalBilled)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Building2 className="size-4" />
                {t("salonTotal")}
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {formatCurrency(data.totals.totalSalonCut)}
              </p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <User className="size-4" />
                {t("professionalsTotal")}
              </div>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {formatCurrency(data.totals.totalProfessionalEarnings)}
              </p>
            </div>
          </div>

          {/* Professional cards */}
          <div className="space-y-4">
            {data.professionals.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">{p.name}</h3>
                    <p className="text-sm text-stone-500">
                      {p.transactionCount} {t("transactions")} · {t("rate")}: {p.comissaoPct}% → {t("salon")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.metaReached && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <Trophy className="size-3" />
                        {t("goalReached")}
                      </span>
                    )}
                    {editingId !== p.id && (
                      <button
                        onClick={() => startEdit(p.id, p.comissaoPct, p.metaComissao)}
                        className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                        title={t("editConfig")}
                      >
                        <Settings2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Edit config inline */}
                {editingId === p.id && (
                  <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-stone-50 p-3">
                    <div>
                      <label className="mb-1 block text-xs text-stone-500">{t("salonPct")}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editPct}
                          onChange={(e) => setEditPct(e.target.value)}
                          className="w-20 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                          min={0}
                          max={100}
                          step={1}
                        />
                        <Percent className="size-4 text-stone-400" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-stone-500">{t("monthlyGoal")}</label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-stone-400">€</span>
                        <input
                          type="number"
                          value={editMeta}
                          onChange={(e) => setEditMeta(e.target.value)}
                          className="w-24 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                          min={0}
                          step={100}
                        />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveEdit(p.id)}
                        disabled={saving}
                        className="rounded-lg bg-bellus-gold p-1.5 text-white hover:bg-bellus-gold/90 disabled:opacity-50"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg bg-stone-200 p-1.5 text-stone-600 hover:bg-stone-300"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Progress bar toward meta */}
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-stone-500">
                      {t("salonAccumulated")}: {formatCurrency(p.salonCut)}
                    </span>
                    <span className="font-medium text-stone-700">
                      {t("goalOf")} {formatCurrency(p.metaComissao)}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-stone-100">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        p.metaReached
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-gradient-to-r from-amber-400 to-amber-500"
                      }`}
                      style={{ width: `${p.metaProgress}%` }}
                    />
                  </div>
                  {p.metaReached && (
                    <p className="mt-1 text-xs text-emerald-600">
                      {t("goalReachedDesc")}
                    </p>
                  )}
                </div>

                {/* Numbers grid */}
                <div className="grid grid-cols-3 gap-4 rounded-lg bg-stone-50 p-3">
                  <div className="text-center">
                    <p className="text-xs text-stone-500">{t("billed")}</p>
                    <p className="text-lg font-bold text-stone-900">
                      {formatCurrency(p.totalBilled)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-stone-500">{t("salonCut")}</p>
                    <p className="text-lg font-bold text-amber-600">
                      {formatCurrency(p.salonCut)}
                    </p>
                    <p className="text-xs text-stone-400">
                      {p.metaReached
                        ? t("capped")
                        : `${p.comissaoPct}%`}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-stone-500">{t("youKeep")}</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {formatCurrency(p.professionalEarnings)}
                    </p>
                    <p className="text-xs text-stone-400">
                      {p.metaReached
                        ? "100%"
                        : `${100 - p.comissaoPct}%`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-stone-700">{t("howItWorks")}</h4>
            <ul className="space-y-1 text-xs text-stone-500">
              <li>1. {t("rule1")}</li>
              <li>2. {t("rule2")}</li>
              <li>3. {t("rule3")}</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
