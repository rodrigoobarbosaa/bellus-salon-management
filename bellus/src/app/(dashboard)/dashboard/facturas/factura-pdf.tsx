"use client";

import { useCallback, useState } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { FacturaCompleta } from "@/lib/verifactu/types";

interface SalonInfo {
  nome: string;
  endereco: string | null;
  telefone: string | null;
  cor_primaria: string;
  logo_url: string | null;
}

interface ConfigFiscalInfo {
  nif: string | null;
  nombre_fiscal: string | null;
}

export interface FacturaPDFData {
  factura: FacturaCompleta;
  salon: SalonInfo;
  configFiscal: ConfigFiscalInfo;
}

// --- Color helpers ---

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const num = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// --- PDF Generator ---

export async function generateFacturaPDF(data: FacturaPDFData): Promise<jsPDF> {
  const { factura, salon, configFiscal } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "A4" });
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const brandColor = hexToRgb(salon.cor_primaria || "#1a1a2e");

  let y = margin;

  // ===== HEADER =====
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, pageWidth, 35, "F");

  // Salon name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(salon.nome, margin, 15);

  // Fiscal name & NIF
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const nif = configFiscal.nif || "";
  const nombreFiscal = configFiscal.nombre_fiscal || salon.nome;
  doc.text(`${nombreFiscal}  |  NIF: ${nif}`, margin, 22);

  // Address & phone
  const infoLine = [salon.endereco, salon.telefone].filter(Boolean).join("  |  ");
  if (infoLine) {
    doc.text(infoLine, margin, 28);
  }

  // FACTURA label (right side)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FACTURA", pageWidth - margin, 15, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(factura.numero_completo, pageWidth - margin, 22, { align: "right" });
  doc.text(formatDate(factura.fecha_emision), pageWidth - margin, 28, { align: "right" });

  y = 45;

  // ===== CLIENT INFO =====
  doc.setTextColor(0, 0, 0);
  if (factura.cliente) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("CLIENTE", margin, y);
    y += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(factura.cliente.nome, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const clientDetails = [factura.cliente.email, factura.cliente.telefone].filter(Boolean).join("  |  ");
    if (clientDetails) {
      doc.text(clientDetails, margin, y);
      y += 5;
    }
  }

  y += 5;

  // ===== LINE ITEMS TABLE =====
  // Header row
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(80, 80, 80);

  const col = {
    desc: margin + 2,
    qty: margin + 95,
    price: margin + 115,
    iva: margin + 140,
    subtotal: margin + contentWidth - 2,
  };

  doc.text("Descripcion", col.desc, y + 5.5);
  doc.text("Cant.", col.qty, y + 5.5);
  doc.text("Precio", col.price, y + 5.5);
  doc.text("IVA %", col.iva, y + 5.5);
  doc.text("Subtotal", col.subtotal, y + 5.5, { align: "right" });

  y += 10;

  // Line items
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  for (const linea of factura.lineas) {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    // Alternate row background
    if (factura.lineas.indexOf(linea) % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 1, contentWidth, 7, "F");
    }

    const desc = linea.descripcion.length > 50
      ? linea.descripcion.substring(0, 47) + "..."
      : linea.descripcion;

    doc.text(desc, col.desc, y + 4);
    doc.text(String(linea.cantidad), col.qty, y + 4);
    doc.text(formatMoney(linea.precio_unitario), col.price, y + 4);
    doc.text(`${linea.iva_pct}%`, col.iva, y + 4);
    doc.text(formatMoney(linea.subtotal), col.subtotal, y + 4, { align: "right" });

    y += 7;
  }

  // Line separator
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  // ===== FISCAL SUMMARY =====
  const summaryX = margin + contentWidth - 65;
  const labelX = summaryX;
  const valueX = margin + contentWidth - 2;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  // Base imponible
  doc.text("Base imponible:", labelX, y);
  doc.text(formatMoney(factura.base_imponible), valueX, y, { align: "right" });
  y += 6;

  // IVA
  doc.text(`IVA (${factura.iva_pct}%):`, labelX, y);
  doc.text(formatMoney(factura.iva_valor), valueX, y, { align: "right" });
  y += 6;

  // IRPF (if applicable)
  if (factura.irpf_valor > 0) {
    doc.text(`IRPF (${factura.irpf_pct}%):`, labelX, y);
    doc.text(`-${formatMoney(factura.irpf_valor)}`, valueX, y, { align: "right" });
    y += 6;
  }

  // Total
  doc.setDrawColor(200, 200, 200);
  doc.line(labelX, y, valueX, y);
  y += 5;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", labelX, y);
  doc.text(`${formatMoney(factura.total)} EUR`, valueX, y, { align: "right" });
  y += 8;

  // Payment method
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Forma de pago: ${formatPagamento(factura.forma_pagamento)}`, labelX, y);

  // ===== QR CODE (bottom-right) =====
  if (factura.qr_data) {
    try {
      const qrDataUrl = await QRCode.toDataURL(factura.qr_data, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      const qrSize = 35;
      const qrX = pageWidth - margin - qrSize;
      const qrY = 297 - margin - qrSize - 10;

      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

      // QR label
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text("Verificacion AEAT", qrX + qrSize / 2, qrY + qrSize + 4, { align: "center" });
    } catch {
      // QR generation failed — continue without it
    }
  }

  // ===== FOOTER =====
  const footerY = 297 - margin;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Factura ${factura.numero_completo} | Emitida em ${formatDate(factura.fecha_emision)} | ${nombreFiscal} - NIF ${nif}`,
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  return doc;
}

// --- Download helper ---

export function downloadFacturaPDF(doc: jsPDF, factura: FacturaCompleta, nif: string): void {
  const fileName = `factura-${factura.serie}-${factura.numero}-${nif || "SIN-NIF"}.pdf`;
  doc.save(fileName);
}

// --- Format helpers ---

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatMoney(value: number): string {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatPagamento(forma: string): string {
  const map: Record<string, string> = {
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
    bizum: "Bizum",
    transferencia: "Transferencia",
  };
  return map[forma] || forma;
}

// --- React Button Component ---

interface DownloadFacturaPDFButtonProps {
  factura: FacturaCompleta;
  salon: SalonInfo;
  configFiscal: ConfigFiscalInfo;
  className?: string;
  children?: React.ReactNode;
}

export function DownloadFacturaPDFButton({
  factura,
  salon,
  configFiscal,
  className,
  children,
}: DownloadFacturaPDFButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    try {
      const doc = await generateFacturaPDF({ factura, salon, configFiscal });
      downloadFacturaPDF(doc, factura, configFiscal.nif || "");
    } catch (err) {
      console.error("Error generating PDF:", err);
    } finally {
      setLoading(false);
    }
  }, [factura, salon, configFiscal]);

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className={className}
    >
      {loading ? "Generando..." : children || "Download PDF"}
    </button>
  );
}
