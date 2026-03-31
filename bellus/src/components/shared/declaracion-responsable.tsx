"use client";

import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";

const SOFTWARE_VERSION = "0.1.0";
const FECHA_DECLARACION = "31 de marzo de 2026";
const FABRICANTE = "Synkra Technologies";
const NOMBRE_SOFTWARE = "Bellus Salon Management";

/**
 * Declaración Responsable — texto legal exigido pelo RD 1007/2023.
 * Sempre em espanhol (idioma legal), independente do locale do utilizador.
 */
export function DeclaracionResponsable() {
  return (
    <div className="rounded-xl border bg-white p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-stone-900">Certificación Verifactu</h3>
      </div>

      <div className="rounded-lg bg-stone-50 border p-4 text-sm text-stone-700 space-y-3 leading-relaxed">
        <p className="font-semibold text-stone-900">DECLARACIÓN RESPONSABLE</p>

        <p>
          {FABRICANTE}, en calidad de fabricante del software de facturación{" "}
          <strong>{NOMBRE_SOFTWARE}</strong> (versión {SOFTWARE_VERSION}), declara
          bajo su responsabilidad que dicho sistema informático cumple con lo
          establecido en el{" "}
          <strong>Real Decreto 1007/2023, de 5 de diciembre</strong>, por el que se
          aprueba el Reglamento que establece los requisitos que deben adoptar los
          sistemas y programas informáticos o electrónicos que soporten los procesos
          de facturación de empresarios y profesionales, y la estandarización de
          formatos de los registros de facturación, así como con la{" "}
          <strong>Ley 11/2021, de 9 de julio</strong>, de medidas de prevención y
          lucha contra el fraude fiscal (Ley Antifraude).
        </p>

        <p>
          En particular, el sistema garantiza la <strong>integridad</strong>,{" "}
          <strong>conservación</strong>, <strong>accesibilidad</strong>,{" "}
          <strong>legibilidad</strong>, <strong>trazabilidad</strong> e{" "}
          <strong>inalterabilidad</strong> de los registros de facturación, conforme
          a los requisitos técnicos establecidos en la{" "}
          <strong>Orden HAC/1177/2024</strong> y sus especificaciones técnicas.
        </p>

        <p>
          El sistema implementa el encadenamiento de registros mediante hash
          (SHA-256), generación de código QR Verifactu, y está preparado para la
          remisión electrónica de registros de facturación a la Agencia Estatal de
          Administración Tributaria (AEAT) a través del sistema Verifactu.
        </p>

        <div className="border-t pt-3 mt-3 text-xs text-stone-500 space-y-1">
          <p><strong>Fabricante:</strong> {FABRICANTE}</p>
          <p><strong>Software:</strong> {NOMBRE_SOFTWARE} v{SOFTWARE_VERSION}</p>
          <p><strong>Fecha de declaración:</strong> {FECHA_DECLARACION}</p>
          <p><strong>Normativa aplicable:</strong> RD 1007/2023 · Ley 11/2021 · Orden HAC/1177/2024</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Link compacto para o sidebar que abre um modal com a declaração.
 */
export function DeclaracionResponsableLink() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-300"
      >
        <ShieldCheck className="size-3.5" />
        Verifactu
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="relative mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            >
              <X className="size-4" />
            </button>
            <DeclaracionResponsable />
          </div>
        </div>
      )}
    </>
  );
}
