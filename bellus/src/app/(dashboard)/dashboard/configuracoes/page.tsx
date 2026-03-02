"use client";

import { useState, useEffect, useRef } from "react";
import { updateSalonSettings, getSalonSettings, uploadSalonLogo } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Save } from "lucide-react";
import Image from "next/image";
import { BookingQrCode } from "./booking-qr-code";

interface SalonSettings {
  nome: string;
  slug: string;
  whatsapp: string;
  endereco: string;
  telefone: string;
  cor_primaria: string;
  instagram_url: string;
  google_maps_url: string;
  moeda: string;
  timezone: string;
  logo_url: string | null;
}

const defaultSettings: SalonSettings = {
  nome: "",
  slug: "",
  whatsapp: "",
  endereco: "",
  telefone: "",
  cor_primaria: "#c9a96e",
  instagram_url: "",
  google_maps_url: "",
  moeda: "EUR",
  timezone: "Europe/Madrid",
  logo_url: null,
};

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<SalonSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSettings() {
      const result = await getSalonSettings();
      if ("data" in result && result.data) {
        const d = result.data;
        setSettings({
          nome: d.nome ?? "",
          slug: d.slug ?? "",
          whatsapp: d.whatsapp ?? "",
          endereco: d.endereco ?? "",
          telefone: d.telefone ?? "",
          cor_primaria: d.cor_primaria ?? "#c9a96e",
          instagram_url: d.instagram_url ?? "",
          google_maps_url: d.google_maps_url ?? "",
          moeda: d.moeda ?? "EUR",
          timezone: d.timezone ?? "Europe/Madrid",
          logo_url: d.logo_url ?? null,
        });
      }
      setIsLoading(false);
    }
    loadSettings();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateSalonSettings(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Configuraciones guardadas correctamente" });
    }
    setIsSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    const result = await uploadSalonLogo(formData);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result.data) {
      setSettings((prev) => ({ ...prev, logo_url: result.data!.url }));
      setMessage({ type: "success", text: "Logo actualizado" });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-stone-500">Cargando configuraciones...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Configuración del Salón</h1>

      {message && (
        <div
          className={`rounded-md p-3 text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Logo del Salón</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div
            className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-stone-300 bg-stone-100"
            onClick={() => fileInputRef.current?.click()}
          >
            {settings.logo_url ? (
              <Image
                src={settings.logo_url}
                alt="Logo del salón"
                width={80}
                height={80}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <Camera className="h-8 w-8 text-stone-400" />
            )}
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              {settings.logo_url ? "Cambiar logo" : "Subir logo"}
            </Button>
            <p className="mt-1 text-xs text-stone-500">JPG o PNG, máximo 2MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </CardContent>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-medium text-stone-700">
                Nombre del salón *
              </label>
              <Input
                id="nome"
                name="nome"
                value={settings.nome}
                onChange={(e) => setSettings((p) => ({ ...p, nome: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="whatsapp" className="text-sm font-medium text-stone-700">
                  WhatsApp Business *
                </label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings((p) => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="+34 600 000 000"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="telefone" className="text-sm font-medium text-stone-700">
                  Teléfono
                </label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={settings.telefone}
                  onChange={(e) => setSettings((p) => ({ ...p, telefone: e.target.value }))}
                  placeholder="+34 960 000 000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="endereco" className="text-sm font-medium text-stone-700">
                Dirección
              </label>
              <Input
                id="endereco"
                name="endereco"
                value={settings.endereco}
                onChange={(e) => setSettings((p) => ({ ...p, endereco: e.target.value }))}
                placeholder="Calle, número, ciudad"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="cor_primaria" className="text-sm font-medium text-stone-700">
                Color primario del salón
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="cor_primaria"
                  name="cor_primaria"
                  value={settings.cor_primaria}
                  onChange={(e) => setSettings((p) => ({ ...p, cor_primaria: e.target.value }))}
                  className="h-10 w-14 cursor-pointer rounded border border-stone-300"
                />
                <Input
                  value={settings.cor_primaria}
                  onChange={(e) => setSettings((p) => ({ ...p, cor_primaria: e.target.value }))}
                  className="w-32"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="instagram_url" className="text-sm font-medium text-stone-700">
                  Instagram
                </label>
                <Input
                  id="instagram_url"
                  name="instagram_url"
                  value={settings.instagram_url}
                  onChange={(e) => setSettings((p) => ({ ...p, instagram_url: e.target.value }))}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="google_maps_url" className="text-sm font-medium text-stone-700">
                  Google Maps
                </label>
                <Input
                  id="google_maps_url"
                  name="google_maps_url"
                  value={settings.google_maps_url}
                  onChange={(e) => setSettings((p) => ({ ...p, google_maps_url: e.target.value }))}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="moeda" className="text-sm font-medium text-stone-700">
                  Moneda
                </label>
                <select
                  id="moeda"
                  name="moeda"
                  value={settings.moeda}
                  onChange={(e) => setSettings((p) => ({ ...p, moeda: e.target.value }))}
                  className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="timezone" className="text-sm font-medium text-stone-700">
                  Zona horaria
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings((p) => ({ ...p, timezone: e.target.value }))}
                  className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="Europe/Madrid">Europe/Madrid</option>
                  <option value="Europe/Lisbon">Europe/Lisbon</option>
                  <option value="America/Sao_Paulo">America/São Paulo</option>
                  <option value="America/New_York">America/New York</option>
                </select>
              </div>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar configuraciones"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Booking QR Code */}
      <BookingQrCode slug={settings.slug} corPrimaria={settings.cor_primaria} />
    </div>
  );
}
