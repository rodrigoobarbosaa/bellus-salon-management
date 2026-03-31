"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeVerifactuProps {
  qrData: string;
  size?: number;
}

export function QRCodeVerifactu({ qrData, size = 200 }: QRCodeVerifactuProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!qrData) return;
    QRCode.toDataURL(qrData, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "M",
    }).then(setSrc);
  }, [qrData, size]);

  if (!qrData) {
    return (
      <div className="text-xs text-muted-foreground">
        QR não disponível
      </div>
    );
  }

  if (!src) return null;

  return (
    <img
      src={src}
      alt="QR Code Verifactu"
      width={size}
      height={size}
      className="rounded"
    />
  );
}
