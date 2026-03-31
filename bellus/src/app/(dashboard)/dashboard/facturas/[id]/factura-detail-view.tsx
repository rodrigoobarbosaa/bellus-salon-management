"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  ArrowLeft,
  FileDown,
  RefreshCw,
  Ban,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoAeatBadge } from "@/components/shared/estado-aeat-badge";
import { EnviosAeatHistory } from "@/components/shared/envios-aeat-history";
import { QRCodeVerifactu } from "@/components/shared/qr-verifactu";
import { DownloadFacturaPDFButton } from "../factura-pdf";
import { getSalonSettings } from "@/app/actions/settings";
import { getOrCreateConfigFiscal } from "@/app/actions/fiscal";
import { submitFacturaToAeat } from "@/app/actions/verifactu";
import { anularFactura } from "@/app/actions/facturas";
import type { FacturaCompleta, EstadoAeat, TipoEventoFactura } from "@/lib/verifactu/types";

interface Props {
  factura: FacturaCompleta;
}

export function FacturaDetailView({ factura }: Props) {
  const t = useTranslations("facturaDetail");
  const router = useRouter();
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

  // Anular modal
  const [showAnular, setShowAnular] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [anulando, setAnulando] = useState(false);

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

  const handleReenviar = useCallback(async () => {
    await submitFacturaToAeat(factura.id);
    router.refresh();
  }, [factura.id, router]);

  const handleAnular = useCallback(async () => {
    if (!motivo.trim()) return;
    setAnulando(true);
    const result = await anularFactura(factura.id, motivo);
    setAnulando(false);
    if (!result.error) {
      setShowAnular(false);
      router.refresh();
    }
  }, [factura.id, motivo, router]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isRetificativa = !!factura.factura_rectificada_id;
  const anulacaoEvento = factura.eventos.find((e) => e.tipo_evento === "anulacion");
  const isAnulada = isRetificativa || !!anulacaoEvento;
  const canReenviar = factura.estado_aeat === "rechazado" || factura.estado_aeat === "pendiente";
  const canAnular = !isAnulada && factura.estado_aeat !== "rechazado";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/facturas"
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              {t("title")} {factura.numero_completo}
            </h1>
            <p className="text-sm text-stone-500">
              {formatDate(factura.fecha_emision)}
            </p>
          </div>
          <EstadoAeatBadge estado={factura.estado_aeat as EstadoAeat} size="md" />
        </div>

        <div className="flex items-center gap-2">
          {salon && configFiscal && (
            <DownloadFacturaPDFButton
              factura={factura}
              salon={salon}
              configFiscal={configFiscal}
              className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
            >
              <FileDown className="size-4" /> PDF
            </DownloadFacturaPDFButton>
          )}
          {canReenviar && (
            <button
              type="button"
              onClick={handleReenviar}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              <RefreshCw className="size-4" /> {t("reenviar")}
            </button>
          )}
          {canAnular && (
            <button
              type="button"
              onClick={() => setShowAnular(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <Ban className="size-4" /> {t("anular")}
            </button>
          )}
        </div>
      </div>

      {/* Retificativa / Anulada banners */}
      {isRetificativa && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-red-200 bg-red-50 p-3">
          <Ban className="size-5 text-red-600 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-red-800">{t("rectificativaDe")}</span>{" "}
            <Link
              href={`/dashboard/facturas/${factura.factura_rectificada_id}`}
              className="font-medium text-primary hover:underline"
            >
              {factura.notas?.match(/Anulación de ([\w-]+)/)?.[1] ?? t("facturaOriginal")}
            </Link>
          </div>
        </div>
      )}
      {!isRetificativa && anulacaoEvento && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="size-5 text-amber-600 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-amber-800">{t("facturaAnulada")}</span>{" "}
            {(anulacaoEvento.detalle as { retificativa_id?: string; retificativa_numero?: string }).retificativa_id && (
              <Link
                href={`/dashboard/facturas/${(anulacaoEvento.detalle as { retificativa_id: string }).retificativa_id}`}
                className="font-medium text-primary hover:underline"
              >
                {t("verRetificativa")} {(anulacaoEvento.detalle as { retificativa_numero?: string }).retificativa_numero ?? ""}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: main data */}
        <div className="space-y-6 lg:col-span-2">
          {/* Client + Emissor */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {t("emissor")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{configFiscal?.nombre_fiscal || salon?.nome || "—"}</p>
                <p className="text-sm text-stone-500">NIF: {configFiscal?.nif || "—"}</p>
                {salon?.endereco && <p className="text-sm text-stone-500">{salon.endereco}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {t("cliente")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {factura.cliente ? (
                  <>
                    <p className="font-medium">{factura.cliente.nome}</p>
                    {factura.cliente.email && (
                      <p className="text-sm text-stone-500">{factura.cliente.email}</p>
                    )}
                    {factura.cliente.telefone && (
                      <p className="text-sm text-stone-500">{factura.cliente.telefone}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-stone-400">{t("clienteGenerico")}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Line items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {t("lineas")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left">
                    <th className="px-4 py-2 font-medium text-stone-500">{t("descripcion")}</th>
                    <th className="px-4 py-2 font-medium text-stone-500">{t("cant")}</th>
                    <th className="px-4 py-2 font-medium text-stone-500">{t("precio")}</th>
                    <th className="px-4 py-2 font-medium text-stone-500">{t("iva")}</th>
                    <th className="px-4 py-2 text-right font-medium text-stone-500">{t("subtotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {factura.lineas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-stone-400">
                        {t("noLineas")}
                      </td>
                    </tr>
                  ) : (
                    factura.lineas.map((l) => (
                      <tr key={l.id} className="border-b border-stone-50">
                        <td className="px-4 py-2">{l.descripcion}</td>
                        <td className="px-4 py-2 tabular-nums">{l.cantidad}</td>
                        <td className="px-4 py-2 tabular-nums">{fmt(l.precio_unitario)}</td>
                        <td className="px-4 py-2 tabular-nums">{l.iva_pct}%</td>
                        <td className="px-4 py-2 text-right font-medium tabular-nums">{fmt(l.subtotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Fiscal summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="ml-auto max-w-xs space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">{t("baseImponible")}</span>
                  <span className="font-medium tabular-nums">{fmt(factura.base_imponible)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">IVA ({factura.iva_pct}%)</span>
                  <span className="font-medium tabular-nums">{fmt(factura.iva_valor)}</span>
                </div>
                {factura.irpf_valor > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">IRPF ({factura.irpf_pct}%)</span>
                    <span className="font-medium tabular-nums text-red-600">-{fmt(factura.irpf_valor)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-stone-200 pt-2 text-base">
                  <span className="font-bold">{t("total")}</span>
                  <span className="font-bold tabular-nums">{fmt(factura.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">{t("formaPago")}</span>
                  <span className="capitalize text-stone-600">{factura.forma_pagamento}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Events Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {t("timeline")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {factura.eventos.length === 0 ? (
                <p className="text-sm text-stone-400">{t("noEventos")}</p>
              ) : (
                <div className="space-y-3">
                  {factura.eventos.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <EventIcon tipo={ev.tipo_evento as TipoEventoFactura} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-stone-700">
                          {eventLabel(ev.tipo_evento as TipoEventoFactura)}
                        </p>
                        {ev.detalle && Object.keys(ev.detalle).length > 0 && (
                          <p className="text-xs text-stone-500">
                            {JSON.stringify(ev.detalle).substring(0, 120)}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-stone-400">
                        {formatDate(ev.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: QR + envios */}
        <div className="space-y-6">
          {/* QR Code */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                QR Verifactu
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <QRCodeVerifactu qrData={factura.qr_data || ""} size={180} />
            </CardContent>
          </Card>

          {/* Envios AEAT */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {t("enviosAeat")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnviosAeatHistory envios={factura.envios_aeat} />
            </CardContent>
          </Card>

          {/* Hash info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                {t("verifactuInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div>
                <span className="text-stone-400">Hash: </span>
                <span className="break-all font-mono text-stone-600">
                  {factura.hash_actual || "—"}
                </span>
              </div>
              <div>
                <span className="text-stone-400">Hash anterior: </span>
                <span className="break-all font-mono text-stone-600">
                  {factura.hash_anterior || "0 (genesis)"}
                </span>
              </div>
              <div>
                <span className="text-stone-400">Firma: </span>
                <span className="text-stone-600">
                  {factura.firma_digital ? "Assinada" : "Sem certificado"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Anular Modal */}
      {showAnular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-stone-900">{t("anularTitulo")}</h3>
            <p className="mt-1 text-sm text-stone-500">{t("anularDescripcion")}</p>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={t("anularMotivoPlaceholder")}
              className="mt-4 h-24 w-full rounded-lg border border-stone-200 p-3 text-sm outline-none focus:border-stone-400"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAnular(false)}
                className="rounded-lg px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
              >
                {t("cancelar")}
              </button>
              <button
                type="button"
                onClick={handleAnular}
                disabled={anulando || !motivo.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {anulando ? t("anulando") : t("confirmarAnular")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function EventIcon({ tipo }: { tipo: TipoEventoFactura }) {
  switch (tipo) {
    case "emision":
      return <FileText className="size-4 text-green-500" />;
    case "anulacion":
      return <Ban className="size-4 text-red-500" />;
    case "envio_aeat":
      return <Send className="size-4 text-blue-500" />;
    case "error_aeat":
      return <AlertTriangle className="size-4 text-amber-500" />;
    case "rectificacion":
      return <XCircle className="size-4 text-orange-500" />;
    default:
      return <Clock className="size-4 text-stone-400" />;
  }
}

function eventLabel(tipo: TipoEventoFactura): string {
  const labels: Record<string, string> = {
    emision: "Factura emitida",
    anulacion: "Factura anulada",
    rectificacion: "Factura rectificada",
    envio_aeat: "Envio a AEAT",
    error_aeat: "Error AEAT",
    consulta: "Consulta",
  };
  return labels[tipo] || tipo;
}
