"use client";

import { useTranslations } from "next-intl";
import { Instagram, Plug, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Integration, disconnectIntegration } from "@/app/actions/marketing";
import { toast } from "sonner";

const providers = [
  { id: "meta", name: "Meta Ads", icon: Instagram, color: "text-pink-500" },
  { id: "google", name: "Google Ads", icon: () => <span className="text-sm font-bold text-blue-500">G</span>, color: "text-blue-500" },
  { id: "google_business", name: "Google Business", icon: () => <span className="text-sm font-bold text-green-600">GB</span>, color: "text-green-600" },
] as const;

export function IntegrationsBar({ integrations }: { integrations: Integration[] }) {
  const t = useTranslations("marketing");
  const connectedProviders = new Set(integrations.map((i) => i.provider));

  async function handleDisconnect(provider: string) {
    const result = await disconnectIntegration(provider);
    if (result.error) toast.error(result.error);
    else toast.success(t("disconnected"));
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
          <Plug className="size-3.5" />
          {t("integrations")}:
        </div>
        {providers.map((p) => {
          const isConnected = connectedProviders.has(p.id);
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                isConnected ? "bg-green-50 text-green-700" : "bg-stone-50 text-stone-400"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{p.name}</span>
              {isConnected ? (
                <>
                  <CheckCircle className="size-3" />
                  <button
                    onClick={() => handleDisconnect(p.id)}
                    className="ml-1 text-red-400 hover:text-red-600"
                  >
                    <XCircle className="size-3" />
                  </button>
                </>
              ) : (
                <Button size="xs" variant="ghost" className="h-4 px-1 text-[10px]">
                  {t("connect")}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
