"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  MessageSquare,
  Megaphone,
  BarChart3,
  Sparkles,
  UserCheck,
} from "lucide-react";
import type { Campaign, Integration, GeneratedContent } from "@/app/actions/marketing";
import { ChatPanel } from "./chat-panel";
import { CampaignsPanel } from "./campaigns-panel";
import { AnalyticsPanel } from "./analytics-panel";
import { ContentPanel } from "./content-panel";
import { ReactivationPanel } from "./reactivation-panel";
import { IntegrationsBar } from "./integrations-bar";

interface MarketingViewProps {
  campaigns: Campaign[];
  integrations: Integration[];
  contents: GeneratedContent[];
  analytics: { channels: { canal: string; clientes: number }[]; totalSpend: number; totalRevenue: number };
  servicos: { id: string; nome: string; preco_base: number; categoria: string }[];
}

const tabs = [
  { id: "chat", icon: MessageSquare },
  { id: "campaigns", icon: Megaphone },
  { id: "analytics", icon: BarChart3 },
  { id: "content", icon: Sparkles },
  { id: "reactivation", icon: UserCheck },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function MarketingView({
  campaigns,
  integrations,
  contents,
  analytics,
  servicos,
}: MarketingViewProps) {
  const t = useTranslations("marketing");
  const [activeTab, setActiveTab] = useState<TabId>("chat");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-stone-900">{t("title")}</h2>
        <p className="mt-1 text-sm text-stone-500">{t("subtitle")}</p>
      </div>

      <IntegrationsBar integrations={integrations} />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-stone-100 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              <Icon className="size-4" />
              {t(`tab.${tab.id}`)}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-[500px]">
        {activeTab === "chat" && <ChatPanel />}
        {activeTab === "campaigns" && <CampaignsPanel campaigns={campaigns} />}
        {activeTab === "analytics" && <AnalyticsPanel analytics={analytics} />}
        {activeTab === "content" && <ContentPanel contents={contents} servicos={servicos} />}
        {activeTab === "reactivation" && <ReactivationPanel />}
      </div>
    </div>
  );
}
