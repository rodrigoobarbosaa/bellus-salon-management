"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { upsertNotificationTemplate, deleteNotificationTemplate } from "@/app/actions/notification-templates";
import { CONFIRMATION_TEMPLATES, REMINDER_24H_TEMPLATES, renderTemplate } from "@/lib/notifications/templates";

const TIPOS = [
  { value: "confirmacao", label: "Confirmación de cita" },
  { value: "lembrete_24h", label: "Recordatorio 24h" },
] as const;

const IDIOMAS = [
  { value: "es", label: "Español" },
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
  { value: "ru", label: "Русский" },
] as const;

const VARIABLES = [
  { key: "{nome_cliente}", desc: "Nombre del cliente" },
  { key: "{servico}", desc: "Servicio reservado" },
  { key: "{profissional}", desc: "Profesional asignado" },
  { key: "{data}", desc: "Fecha (YYYY-MM-DD)" },
  { key: "{hora}", desc: "Hora (HH:MM)" },
  { key: "{salao}", desc: "Nombre del salón" },
  { key: "{endereco}", desc: "Dirección del salón" },
];

const PREVIEW_VARS: Record<string, string> = {
  nome_cliente: "María García",
  servico: "Corte + Peinado",
  profissional: "Tatiana",
  data: "2026-03-15",
  hora: "10:30",
  salao: "Tati & Rodri Hair Studio",
  endereco: "Calle Ejemplo 123, Valencia",
};

interface ExistingTemplate {
  id: string;
  tipo: string;
  idioma: string;
  template: string;
}

interface TemplateEditorProps {
  existingTemplates: ExistingTemplate[];
}

function getDefaultTemplate(tipo: string, idioma: string): string {
  if (tipo === "confirmacao") return CONFIRMATION_TEMPLATES[idioma] ?? CONFIRMATION_TEMPLATES.es;
  if (tipo === "lembrete_24h") return REMINDER_24H_TEMPLATES[idioma] ?? REMINDER_24H_TEMPLATES.es;
  return "";
}

export function TemplateEditor({ existingTemplates }: TemplateEditorProps) {
  const [selectedTipo, setSelectedTipo] = useState("confirmacao");
  const [selectedIdioma, setSelectedIdioma] = useState("es");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Find existing custom template
  const existing = existingTemplates.find(
    (t) => t.tipo === selectedTipo && t.idioma === selectedIdioma
  );

  const defaultTpl = getDefaultTemplate(selectedTipo, selectedIdioma);
  const [template, setTemplate] = useState(existing?.template ?? defaultTpl);

  // Update template when tipo/idioma changes
  function handleTipoChange(tipo: string) {
    setSelectedTipo(tipo);
    const ex = existingTemplates.find((t) => t.tipo === tipo && t.idioma === selectedIdioma);
    setTemplate(ex?.template ?? getDefaultTemplate(tipo, selectedIdioma));
    setMessage(null);
  }

  function handleIdiomaChange(idioma: string) {
    setSelectedIdioma(idioma);
    const ex = existingTemplates.find((t) => t.tipo === selectedTipo && t.idioma === idioma);
    setTemplate(ex?.template ?? getDefaultTemplate(selectedTipo, idioma));
    setMessage(null);
  }

  async function handleSave() {
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.set("tipo", selectedTipo);
    formData.set("idioma", selectedIdioma);
    formData.set("template", template);

    const result = await upsertNotificationTemplate(formData);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Plantilla guardada correctamente." });
    }
    setIsLoading(false);
  }

  async function handleRestore() {
    if (existing) {
      setIsLoading(true);
      await deleteNotificationTemplate(existing.id);
      setIsLoading(false);
    }
    setTemplate(defaultTpl);
    setMessage({ type: "success", text: "Plantilla restaurada al valor predeterminado." });
  }

  const preview = renderTemplate(template, PREVIEW_VARS);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-stone-800">Plantillas de mensajes</h2>

      {message && (
        <div className={`mb-4 rounded-md p-3 text-sm ${
          message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}>
          {message.text}
        </div>
      )}

      {/* Tipo selector */}
      <div className="mb-4 flex gap-2">
        {TIPOS.map((t) => (
          <button
            key={t.value}
            onClick={() => handleTipoChange(t.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedTipo === t.value
                ? "bg-bellus-gold text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Idioma selector */}
      <div className="mb-4 flex gap-2">
        {IDIOMAS.map((i) => (
          <button
            key={i.value}
            onClick={() => handleIdiomaChange(i.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedIdioma === i.value
                ? "bg-stone-800 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {i.label}
          </button>
        ))}
      </div>

      {/* Available variables */}
      <div className="mb-4 rounded-md bg-stone-50 p-3">
        <p className="mb-2 text-xs font-medium text-stone-500">Variables disponibles:</p>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <code key={v.key} className="rounded bg-white px-2 py-0.5 text-xs text-stone-600 border border-stone-200" title={v.desc}>
              {v.key}
            </code>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Editor */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Plantilla</label>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-stone-200 bg-white p-3 font-mono text-sm text-stone-700 focus:border-bellus-gold focus:outline-none focus:ring-1 focus:ring-bellus-gold"
          />
        </div>

        {/* Preview */}
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Vista previa</label>
          <div className="h-full min-h-[200px] rounded-lg border border-green-200 bg-green-50 p-3 text-sm whitespace-pre-wrap text-stone-700">
            {preview}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar plantilla"}
        </Button>
        <Button variant="outline" onClick={handleRestore} disabled={isLoading}>
          Restaurar predeterminado
        </Button>
      </div>
    </div>
  );
}
