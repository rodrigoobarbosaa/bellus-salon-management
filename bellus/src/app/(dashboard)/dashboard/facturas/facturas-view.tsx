"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, FileDown, RefreshCw, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoAeatBadge } from "@/components/shared/estado-aeat-badge";
import { DownloadFacturaPDFButton } from "./factura-pdf";
import { getFacturas } from "@/app/actions/facturas";
import { getSalonSettings } from "@/app/actions/settings";
import { getOrCreateConfigFiscal } from "@/app/actions/fiscal";
import { submitFacturaToAeat } from "@/app/actions/verifactu";
import type { Factura, EstadoAeat } from "@/lib/verifactu/types";

const PER_PAGE = 20;

export function FacturasView() {
  const t = useTranslations("facturas");
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, startTransition] = useTransition();

  // Filters
  const [busca, setBusca] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoAeat | "">("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Salon data for PDF
  const [salon, setSalon] = useState<{
    nome: string;
    endereco: string | null;
    telefone: string | null;
    cor_primaria: string;
    logo_url: string | null;
  } | null>(null);
  const [configFiscal, setConfigFiscal] = useState<{
    nif: string | null;
    nombre_fiscal: string | null;
  } | null>(null);

  // Totals
  const totalFaturado = facturas.reduce((sum, f) => sum + f.total, 0);
  const pendientes = facturas.filter((f) => f.estado_aeat === "pendiente").length;
  const rechazadas = facturas.filter((f) => f.estado_aeat === "rechazado").length;
  const totalPages = Math.ceil(total / PER_PAGE);

  const fetchFacturas = useCallback(() => {
    startTransition(async () => {
      const result = await getFacturas({
        page,
        per_page: PER_PAGE,
        busca: busca || undefined,
        estado_aeat: (estadoFilter as EstadoAeat) || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
      });
      if (result.data) {
        setFacturas(result.data);
        setTotal(result.count);
      }
    });
  }, [page, busca, estadoFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  // Load salon info once for PDF generation
  useEffect(() => {
    (async () => {
      const [salonRes, fiscalRes] = await Promise.all([
        getSalonSettings(),
        getOrCreateConfigFiscal(),
      ]);
      if (salonRes.data) setSalon(salonRes.data);
      if (fiscalRes.data) setConfigFiscal(fiscalRes.data);
    })();
  }, []);

  const handleReenviar = useCallback(
    async (facturaId: string) => {
      await submitFacturaToAeat(facturaId);
      fetchFacturas();
    },
    [fetchFacturas]
  );

  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="space-y-4">
      {/* Summary counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-stone-400">{t("totalFacturas")}</p>
            <p className="text-2xl font-bold tabular-nums">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-stone-400">{t("totalFaturado")}</p>
            <p className="text-2xl font-bold tabular-nums">{fmt(totalFaturado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-amber-500">{t("pendientes")}</p>
            <p className="text-2xl font-bold tabular-nums text-amber-600">{pendientes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase text-red-500">{t("rechazadas")}</p>
            <p className="text-2xl font-bold tabular-nums text-red-600">{rechazadas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPage(1);
            }}
            className="h-9 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-stone-400"
          />
        </div>
        <select
          value={estadoFilter}
          onChange={(e) => {
            setEstadoFilter(e.target.value as EstadoAeat | "");
            setPage(1);
          }}
          className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none"
        >
          <option value="">{t("allEstados")}</option>
          <option value="pendiente">{t("estadoPendiente")}</option>
          <option value="enviado">{t("estadoEnviado")}</option>
          <option value="aceptado">{t("estadoAceptado")}</option>
          <option value="rechazado">{t("estadoRechazado")}</option>
        </select>
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => {
            setFechaDesde(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none"
        />
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => {
            setFechaHasta(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" />
            </div>
          ) : facturas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-400">
              <FileText className="mb-2 size-10" />
              <p className="text-sm">{t("noFacturas")}</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 text-left">
                      <th className="px-4 py-3 font-medium text-stone-500">{t("colNumero")}</th>
                      <th className="px-4 py-3 font-medium text-stone-500">{t("colFecha")}</th>
                      <th className="px-4 py-3 font-medium text-stone-500">{t("colCliente")}</th>
                      <th className="px-4 py-3 font-medium text-stone-500 text-right">{t("colTotal")}</th>
                      <th className="px-4 py-3 font-medium text-stone-500">{t("colEstado")}</th>
                      <th className="px-4 py-3 font-medium text-stone-500">{t("colAcciones")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturas.map((f) => (
                      <tr key={f.id} className={`border-b border-stone-50 hover:bg-stone-50/50 ${f.factura_rectificada_id ? "bg-red-50/30" : ""}`}>
                        <td className="px-4 py-3 font-medium tabular-nums">
                          <Link href={`/dashboard/facturas/${f.id}`} className="hover:underline text-primary">
                            {f.numero_completo}
                          </Link>
                          {f.factura_rectificada_id && (
                            <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">R1</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-stone-600">{formatDate(f.fecha_emision)}</td>
                        <td className="px-4 py-3 text-stone-600">{f.cliente_id ? "—" : "—"}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{fmt(f.total)}</td>
                        <td className="px-4 py-3">
                          <EstadoAeatBadge estado={f.estado_aeat as EstadoAeat} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {salon && configFiscal && (
                              <DownloadFacturaPDFButton
                                factura={{ ...f, lineas: [], eventos: [], envios_aeat: [] }}
                                salon={salon}
                                configFiscal={configFiscal}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-stone-600 hover:bg-stone-100"
                              >
                                <FileDown className="size-3.5" /> PDF
                              </DownloadFacturaPDFButton>
                            )}
                            {(f.estado_aeat === "rechazado" || f.estado_aeat === "pendiente") && (
                              <button
                                type="button"
                                onClick={() => handleReenviar(f.id)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                              >
                                <RefreshCw className="size-3.5" /> {t("reenviar")}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-stone-100">
                {facturas.map((f) => (
                  <div key={f.id} className={`flex items-center justify-between px-4 py-3 ${f.factura_rectificada_id ? "bg-red-50/30" : ""}`}>
                    <div className="space-y-0.5">
                      <p className="font-medium tabular-nums text-sm">
                        <Link href={`/dashboard/facturas/${f.id}`} className="hover:underline text-primary">
                          {f.numero_completo}
                        </Link>
                        {f.factura_rectificada_id && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">R1</span>
                        )}
                      </p>
                      <p className="text-xs text-stone-500">{formatDate(f.fecha_emision)}</p>
                      <EstadoAeatBadge estado={f.estado_aeat as EstadoAeat} />
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums">{fmt(f.total)}</p>
                      <div className="mt-1 flex items-center gap-1 justify-end">
                        {salon && configFiscal && (
                          <DownloadFacturaPDFButton
                            factura={{ ...f, lineas: [], eventos: [], envios_aeat: [] }}
                            salon={salon}
                            configFiscal={configFiscal}
                            className="rounded-md p-1 text-stone-500 hover:bg-stone-100"
                          >
                            <FileDown className="size-4" />
                          </DownloadFacturaPDFButton>
                        )}
                        {(f.estado_aeat === "rechazado" || f.estado_aeat === "pendiente") && (
                          <button
                            type="button"
                            onClick={() => handleReenviar(f.id)}
                            className="rounded-md p-1 text-blue-500 hover:bg-blue-50"
                          >
                            <RefreshCw className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">
            {t("pagination", { from: (page - 1) * PER_PAGE + 1, to: Math.min(page * PER_PAGE, total), total })}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md p-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-2 tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md p-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
