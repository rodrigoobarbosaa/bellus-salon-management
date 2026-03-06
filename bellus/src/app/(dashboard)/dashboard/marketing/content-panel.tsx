"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Copy, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { saveGeneratedContent, type GeneratedContent } from "@/app/actions/marketing";
import { toast } from "sonner";

interface ContentPanelProps {
  contents: GeneratedContent[];
  servicos: { id: string; nome: string; preco_base: number; categoria: string }[];
}

export function ContentPanel({ contents, servicos }: ContentPanelProps) {
  const t = useTranslations("marketing");
  const [selectedService, setSelectedService] = useState("");
  const [tone, setTone] = useState("profissional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    variations?: { title: string; body: string }[];
    headlines?: string[];
    descriptions?: string[];
    hashtags?: string[];
  } | null>(null);

  async function handleGenerate() {
    if (!selectedService) {
      toast.error(t("selectService"));
      return;
    }

    const svc = servicos.find((s) => s.id === selectedService);
    if (!svc) return;

    setIsGenerating(true);
    setResult(null);

    try {
      const response = await fetch("/api/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: svc.nome,
          serviceCategory: svc.categoria,
          servicePrice: svc.preco_base,
          tone,
          language: "es",
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      setResult(data);

      // Save to DB
      await saveGeneratedContent({
        tipo: "copy",
        tom: tone,
        conteudo: data,
        servico_id: selectedService,
      });
    } catch {
      toast.error(t("generateError"));
    } finally {
      setIsGenerating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success(t("copied"));
  }

  return (
    <div className="space-y-4">
      {/* Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-stone-600">{t("generateContent")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
          >
            <option value="">{t("selectService")}</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} — {s.preco_base} EUR
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            {(["profissional", "descontraido", "luxo"] as const).map((t_) => (
              <button
                key={t_}
                onClick={() => setTone(t_)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  tone === t_
                    ? "bg-bellus-gold text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {t(`tone.${t_}`)}
              </button>
            ))}
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating || !selectedService} className="w-full">
            {isGenerating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            {isGenerating ? t("generating") : t("generate")}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-stone-600">{t("generatedResult")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Variations */}
            {result.variations && (
              <div>
                <p className="mb-2 text-xs font-medium text-stone-500">{t("adVariations")}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {result.variations.map((v, i) => (
                    <div
                      key={i}
                      className="group relative rounded-lg border border-stone-200 p-3"
                    >
                      <p className="text-sm font-semibold text-stone-900">{v.title}</p>
                      <p className="mt-1 text-xs text-stone-600">{v.body}</p>
                      <button
                        onClick={() => copyToClipboard(`${v.title}\n${v.body}`)}
                        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Copy className="size-3.5 text-stone-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Headlines */}
            {result.headlines && (
              <div>
                <p className="mb-1 text-xs font-medium text-stone-500">Headlines</p>
                <div className="flex flex-wrap gap-1">
                  {result.headlines.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => copyToClipboard(h)}
                      className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-200"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hashtags */}
            {result.hashtags && (
              <div>
                <p className="mb-1 text-xs font-medium text-stone-500">Hashtags</p>
                <button
                  onClick={() => copyToClipboard(result.hashtags!.join(" "))}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {result.hashtags.join(" ")}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {contents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-stone-600">{t("contentHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contents.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg bg-stone-50 p-2 text-sm">
                  <div>
                    <span className="font-medium text-stone-700">{c.tipo}</span>
                    <span className="ml-2 text-xs text-stone-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs capitalize text-stone-600">
                    {c.tom}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
