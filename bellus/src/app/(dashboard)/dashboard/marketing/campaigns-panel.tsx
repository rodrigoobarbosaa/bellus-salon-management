"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pause, Play, Instagram } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type Campaign, createCampaign, updateCampaignStatus } from "@/app/actions/marketing";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  rascunho: "bg-stone-100 text-stone-600",
  ativa: "bg-green-100 text-green-700",
  pausada: "bg-amber-100 text-amber-700",
  concluida: "bg-blue-100 text-blue-700",
  cancelada: "bg-red-100 text-red-600",
};

const platformIcons: Record<string, React.ReactNode> = {
  meta: <Instagram className="size-4 text-pink-500" />,
  google: <span className="text-sm font-bold text-blue-500">G</span>,
};

export function CampaignsPanel({ campaigns }: { campaigns: Campaign[] }) {
  const t = useTranslations("marketing");
  const [open, setOpen] = useState(false);
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);

  async function handleCreate(formData: FormData) {
    const result = await createCampaign(formData);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("campaignCreated"));
      setOpen(false);
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "ativa" ? "pausada" : "ativa";
    const result = await updateCampaignStatus(id, newStatus);
    if (result.error) toast.error(result.error);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-900">{t("campaignsTitle")}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 size-4" /> {t("newCampaign")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("newCampaign")}</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-3">
              <Input name="nome" placeholder={t("campaignName")} required />
              <select
                name="plataforma"
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
                required
              >
                <option value="meta">Instagram / Facebook (Meta)</option>
                <option value="google">Google Ads</option>
              </select>
              <select
                name="tipo"
                className="w-full rounded-md border border-stone-200 px-3 py-2 text-sm"
              >
                <option value="alcance">{t("typeReach")}</option>
                <option value="pesquisa">{t("typeSearch")}</option>
                <option value="display">Display</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <Input name="orcamento_diario" type="number" step="0.01" placeholder={t("dailyBudget")} />
                <Input name="orcamento_total" type="number" step="0.01" placeholder={t("totalBudget")} />
              </div>
              <Button type="submit" className="w-full">{t("create")}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Megaphone className="mx-auto mb-2 size-8 text-stone-300" />
            <p className="text-sm text-stone-400">{t("noCampaigns")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-stone-50">
                    {platformIcons[c.plataforma] || <Megaphone className="size-4" />}
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">{c.nome}</p>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status]}`}>
                        {t(`status.${c.status}`)}
                      </span>
                      <span>{c.metricas.impressoes} imp</span>
                      <span>{c.metricas.cliques} clicks</span>
                      <span>{fmt(c.metricas.custo)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {(c.status === "ativa" || c.status === "pausada") && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => toggleStatus(c.id, c.status)}
                    >
                      {c.status === "ativa" ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Megaphone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 11 18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}
