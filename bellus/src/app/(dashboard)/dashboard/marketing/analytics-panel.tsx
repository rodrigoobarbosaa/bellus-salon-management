"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Target } from "lucide-react";

interface AnalyticsPanelProps {
  analytics: {
    channels: { canal: string; clientes: number }[];
    totalSpend: number;
    totalRevenue: number;
  };
}

const canalColors: Record<string, string> = {
  instagram: "bg-pink-500",
  google: "bg-blue-500",
  organico: "bg-green-500",
  indicacao: "bg-amber-500",
  whatsapp: "bg-emerald-500",
  outro: "bg-stone-400",
};

export function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  const t = useTranslations("marketing");
  const fmt = (v: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v);

  const roi =
    analytics.totalSpend > 0
      ? Math.round(((analytics.totalRevenue - analytics.totalSpend) / analytics.totalSpend) * 100)
      : 0;

  const totalClients = analytics.channels.reduce((sum, c) => sum + c.clientes, 0);
  const cac = totalClients > 0 ? analytics.totalSpend / totalClients : 0;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500">{t("totalSpend")}</p>
                <p className="text-xl font-bold text-stone-900">{fmt(analytics.totalSpend)}</p>
              </div>
              <DollarSign className="size-8 text-stone-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500">{t("totalRevenue")}</p>
                <p className="text-xl font-bold text-stone-900">{fmt(analytics.totalRevenue)}</p>
              </div>
              <TrendingUp className="size-8 text-stone-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500">ROI</p>
                <p className={`text-xl font-bold ${roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {roi}%
                </p>
              </div>
              <Target className="size-8 text-stone-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500">CAC</p>
                <p className="text-xl font-bold text-stone-900">{fmt(cac)}</p>
              </div>
              <Users className="size-8 text-stone-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-stone-600">{t("channelBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.channels.length === 0 ? (
            <p className="text-sm text-stone-400">{t("noChannelData")}</p>
          ) : (
            <div className="space-y-3">
              {analytics.channels.map((ch) => (
                <div key={ch.canal}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`size-2.5 rounded-full ${canalColors[ch.canal] || "bg-stone-400"}`} />
                      <span className="font-medium capitalize text-stone-700">{ch.canal}</span>
                    </div>
                    <span className="text-stone-500">{ch.clientes} {t("clients")}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-stone-100">
                    <div
                      className={`h-1.5 rounded-full ${canalColors[ch.canal] || "bg-stone-400"}`}
                      style={{
                        width: `${totalClients > 0 ? (ch.clientes / totalClients) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
