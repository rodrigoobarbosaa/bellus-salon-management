"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Download, ExternalLink, Check } from "lucide-react";
import QRCode from "qrcode";

interface BookingQrCodeProps {
  slug: string;
  corPrimaria: string;
}

export function BookingQrCode({ slug, corPrimaria }: BookingQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const bookingUrl = `${appUrl}/booking/${slug}`;

  useEffect(() => {
    if (canvasRef.current && slug) {
      QRCode.toCanvas(canvasRef.current, bookingUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: corPrimaria,
          light: "#ffffff",
        },
      });
    }
  }, [bookingUrl, corPrimaria, slug]);

  async function handleCopy() {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `qr-${slug}.png`;
    link.href = url;
    link.click();
  }

  if (!slug) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Portal de Reservas Online</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-stone-500">
          Comparte este enlace o código QR con tus clientes para que reserven online.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* QR Code */}
          <div className="rounded-lg border border-stone-200 bg-white p-3">
            <canvas ref={canvasRef} />
          </div>

          {/* Link + Actions */}
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <Input value={bookingUrl} readOnly className="text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopy} title="Copiar enlace">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-1 h-4 w-4" />
                Descargar QR
              </Button>
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  Abrir portal
                </Button>
              </a>
            </div>

            <p className="text-xs text-stone-400">
              Imprime el código QR y colócalo en tu salón para que los clientes escaneen y reserven.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
