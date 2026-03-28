import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import {
  Calendar,
  MessageCircle,
  BarChart3,
  CreditCard,
  Globe,
  Sparkles,
  Users,
  Shield,
  ChevronRight,
  Check,
  X,
  Smartphone,
  Star,
  Scissors,
  ArrowRight,
} from "lucide-react";
import { getLandingTranslations } from "./translations";
import { LandingLangSwitcher } from "./lang-switcher";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bellus — Salon Management Software",
  description:
    "Online scheduling, cashier, tax, AI marketing & WhatsApp reminders. The complete system your salon needs. From €9/month.",
  alternates: {
    canonical: "https://bellus.app/site",
  },
  openGraph: {
    title: "Bellus — Salon Management Software",
    description: "The complete system your salon needs. Online scheduling, cashier, tax, AI marketing & WhatsApp reminders.",
    url: "https://bellus.app/site",
    siteName: "Bellus",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Bellus Salon Management" }],
    locale: "pt_PT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bellus — Salon Management Software",
    description: "The complete system your salon needs. Online scheduling, cashier, tax, AI marketing & WhatsApp reminders.",
    images: ["/og-image.png"],
  },
};

/* ───── Glass card helper ───── */
function Glass({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-lg shadow-black/20 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-4 inline-block rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#c9a96e]">
      {children}
    </span>
  );
}

/* ───── Light app screen builder (matches real app) ───── */
function AppScreen({
  title,
  children,
  url,
}: {
  title: string;
  children: React.ReactNode;
  url: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/40">
      {/* browser chrome — dark */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="size-2.5 rounded-full bg-[#ff5f57]" />
          <div className="size-2.5 rounded-full bg-[#febc2e]" />
          <div className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto rounded-md bg-white px-3 py-0.5 text-[10px] text-gray-400">
          {url}
        </div>
      </div>
      {/* page title */}
      <div className="border-b border-gray-100 bg-white px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c9a96e]">
          {title}
        </span>
      </div>
      {/* content — white background */}
      <div className="bg-white p-4">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */
export default async function LandingPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "es";
  const t = getLandingTranslations(locale);

  /* ── JSON-LD Structured Data ── */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Bellus",
    applicationCategory: "BusinessApplication",
    description:
      "Salon management software — online scheduling, cashier, tax, AI marketing & WhatsApp reminders.",
    url: "https://bellus.app/site",
    operatingSystem: "Web",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: "15",
      priceCurrency: "EUR",
      offerCount: "3",
    },
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-[#c9a96e]/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ━━━ NAV ━━━ */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/site" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a96e] to-[#a07d3a]">
              <Scissors className="size-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Bellus</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm md:flex">
            <a href="#features" className="text-white/50 transition hover:text-white">
              {t.navFeatures}
            </a>
            <a href="#software" className="text-white/50 transition hover:text-white">
              {t.navSoftware}
            </a>
            <a href="#pricing" className="text-white/50 transition hover:text-white">
              {t.navPricing}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <LandingLangSwitcher />
            <Link
              href="/login"
              className="hidden text-sm font-medium text-white/60 transition hover:text-white sm:block"
            >
              {t.navLogin}
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#c9a96e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#d4b87e]"
            >
              {t.navCta}
            </Link>
          </div>
        </div>
      </nav>

      {/* ━━━ HERO ━━━ */}
      <section className="relative overflow-hidden pt-32 pb-24 sm:pt-44 sm:pb-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c9a96e]/[0.07] blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-[#c9a96e]/[0.04] blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c9a96e]/20 bg-[#c9a96e]/[0.08] px-4 py-1.5 text-sm text-[#c9a96e]">
            <Sparkles className="size-3.5" />
            {t.heroBadge}
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
            {t.heroTitle1}
            <br />
            <span className="bg-gradient-to-r from-[#c9a96e] via-[#e0c58a] to-[#c9a96e] bg-clip-text text-transparent">
              {t.heroTitle2}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/40 sm:text-xl">
            {t.heroSubtitle}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#b8964d] px-8 py-3.5 text-base font-semibold text-black shadow-lg shadow-[#c9a96e]/20 transition hover:shadow-[#c9a96e]/30"
            >
              {t.heroCta1}
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#software"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-8 py-3.5 text-base font-semibold text-white/80 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              {t.heroCta2}
            </a>
          </div>

          {/* Metrics */}
          <div className="mx-auto mt-16 flex max-w-2xl flex-wrap items-center justify-center gap-10 sm:gap-16">
            {[
              ["0%", t.metricCommission],
              ["€0", t.metricStart],
              ["4", t.metricLanguages],
              ["3 min", t.metricSetup],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="text-2xl font-bold text-[#c9a96e]">{value}</div>
                <div className="text-[11px] text-white/30">{label}</div>
              </div>
            ))}
          </div>

          {/* ── HERO MOCKUP: Dashboard (light theme — matches real app) ── */}
          <div className="relative mx-auto mt-20 max-w-5xl">
            <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-[#c9a96e]/[0.06] blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl shadow-black/40">
              {/* browser chrome */}
              <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-100 px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="size-2.5 rounded-full bg-[#febc2e]" />
                  <div className="size-2.5 rounded-full bg-[#28c840]" />
                </div>
                <div className="mx-auto rounded-lg bg-white px-6 py-1 text-xs text-gray-400">
                  app.bellus.com/dashboard
                </div>
              </div>

              <div className="grid grid-cols-12 gap-0 bg-gray-50">
                {/* sidebar */}
                <div className="col-span-3 hidden min-h-[360px] border-r border-gray-200 bg-white p-4 lg:block">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <div className="flex size-6 items-center justify-center rounded-md bg-[#c9a96e]">
                      <Scissors className="size-3 text-white" />
                    </div>
                    Bellus
                  </div>
                  <div className="mt-5 space-y-0.5">
                    {[
                      { name: t.mockSidebar1, active: true },
                      { name: t.mockSidebar2, active: false },
                      { name: t.mockSidebar3, active: false },
                      { name: t.mockSidebar4, active: false },
                      { name: t.mockSidebar5, active: false },
                      { name: t.mockSidebar6, active: false },
                      { name: t.mockSidebar7, active: false },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className={`rounded-lg px-3 py-2 text-xs transition ${
                          item.active
                            ? "bg-[#c9a96e]/10 font-semibold text-[#c9a96e]"
                            : "text-gray-400"
                        }`}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* main */}
                <div className="col-span-12 space-y-4 p-5 lg:col-span-9">
                  <div className="text-left text-sm text-gray-400">
                    {t.dashGreeting} <span className="font-semibold text-gray-700">Maria</span>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: t.dashToday, value: "€ 480", border: "border-[#c9a96e]/30", text: "text-[#c9a96e]" },
                      { label: t.dashWeek, value: "€ 2.340", border: "border-emerald-200", text: "text-emerald-600" },
                      { label: t.dashActiveClients, value: "127", border: "border-blue-200", text: "text-blue-600" },
                      { label: t.dashToday, value: `8 ${t.dashShifts}`, border: "border-violet-200", text: "text-violet-600" },
                    ].map((kpi, i) => (
                      <div
                        key={i}
                        className={`rounded-xl border ${kpi.border} bg-white p-3 text-left shadow-sm`}
                      >
                        <div className="text-[10px] text-gray-400">{kpi.label}</div>
                        <div className={`mt-1 text-lg font-bold ${kpi.text}`}>{kpi.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Agenda preview */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm">
                    <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {t.dashTodayAgenda}
                    </div>
                    <div className="space-y-2">
                      {[
                        { time: "09:00", name: "Juliana Mendes", service: t.mockCutBlowout, color: "bg-[#c9a96e]" },
                        { time: "10:30", name: "Carmen López", service: t.mockColoring, color: "bg-violet-400" },
                        { time: "12:00", name: "Olga Petrova", service: t.mockHighlights, color: "bg-emerald-400" },
                        { time: "14:00", name: "Sarah Miller", service: t.mockMensCut, color: "bg-blue-400" },
                        { time: "15:30", name: "Fernanda Costa", service: t.mockKeratin, color: "bg-pink-400" },
                      ].map((apt) => (
                        <div
                          key={apt.time}
                          className="flex items-center gap-3 rounded-lg bg-gray-50 p-2.5 transition hover:bg-gray-100"
                        >
                          <div className={`h-8 w-1 rounded-full ${apt.color}`} />
                          <div className="w-10 text-xs font-mono text-gray-300">{apt.time}</div>
                          <div>
                            <div className="text-xs font-medium text-gray-700">{apt.name}</div>
                            <div className="text-[10px] text-gray-400">{apt.service}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ SOFTWARE SHOWCASE ━━━ */}
      <section id="software" className="relative px-4 py-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-[#c9a96e]/[0.03] blur-[100px]" />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <SectionLabel>{t.softwareLabel}</SectionLabel>
            <h2 className="text-3xl font-bold sm:text-4xl">{t.softwareTitle}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/35">{t.softwareSubtitle}</p>
          </div>

          {/* ── Screen 1: Agenda ── */}
          <div className="mt-20 grid items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="inline-flex rounded-lg bg-[#c9a96e]/10 p-2 text-[#c9a96e]">
                <Calendar className="size-5" />
              </div>
              <h3 className="mt-4 text-2xl font-bold">{t.agendaTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/40">{t.agendaDesc}</p>
              <ul className="mt-4 space-y-2">
                {[t.agendaFeat1, t.agendaFeat2, t.agendaFeat3, t.agendaFeat4].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white/30">
                    <Check className="size-3 text-[#c9a96e]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <AppScreen title={t.mockSidebar2} url="app.bellus.com/agenda">
              <div className="space-y-1.5">
                {[
                  { time: "09:00", w: "w-[70%]", color: "bg-[#c9a96e]/20 border-[#c9a96e]/30", name: t.mockAgenda1 },
                  { time: "10:00", w: "w-[85%]", color: "bg-violet-100 border-violet-200", name: t.mockAgenda2 },
                  { time: "11:00", w: "w-[60%]", color: "bg-emerald-50 border-emerald-200", name: t.mockAgenda3 },
                  { time: "12:00", w: "w-full", color: "bg-gray-50 border-gray-100", name: "" },
                  { time: "13:00", w: "w-[90%]", color: "bg-blue-50 border-blue-200", name: t.mockAgenda5 },
                  { time: "14:00", w: "w-[50%]", color: "bg-pink-50 border-pink-200", name: t.mockAgenda6 },
                ].map((slot) => (
                  <div key={slot.time} className="flex items-center gap-3">
                    <span className="w-10 text-right text-[10px] font-mono text-gray-300">{slot.time}</span>
                    <div className={`${slot.w} rounded-md border ${slot.color} px-2 py-1.5 text-[10px] text-gray-600`}>
                      {slot.name || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </AppScreen>
          </div>

          {/* ── Screen 2: Caixa ── */}
          <div className="mt-24 grid items-center gap-8 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <AppScreen title={t.mockSidebar5} url="app.bellus.com/caixa">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="text-xs text-gray-500">{t.caixaRevenue}</span>
                    <span className="text-lg font-bold text-[#c9a96e]">€ 480</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { client: "Juliana Mendes", service: t.mockCutBlowout, value: "€ 45", method: t.mockCard },
                      { client: "Carmen López", service: t.mockColoring, value: "€ 85", method: t.mockCash },
                      { client: "Olga Petrova", service: t.mockHighlights, value: "€ 120", method: "Bizum" },
                      { client: "Sarah Miller", service: t.mockMensCut, value: "€ 25", method: t.mockCard },
                    ].map((tx) => (
                      <div key={tx.client} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
                        <div>
                          <div className="text-[11px] font-medium text-gray-700">{tx.client}</div>
                          <div className="text-[9px] text-gray-400">{tx.service}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-semibold text-emerald-600">{tx.value}</div>
                          <div className="text-[9px] text-gray-400">{tx.method}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AppScreen>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex rounded-lg bg-emerald-400/10 p-2 text-emerald-400">
                <CreditCard className="size-5" />
              </div>
              <h3 className="mt-4 text-2xl font-bold">{t.caixaTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/40">{t.caixaDesc}</p>
              <ul className="mt-4 space-y-2">
                {[t.caixaFeat1, t.caixaFeat2, t.caixaFeat3, t.caixaFeat4].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white/30">
                    <Check className="size-3 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Screen 3: WhatsApp ── */}
          <div className="mt-24 grid items-center gap-8 lg:grid-cols-2">
            <div>
              <div className="inline-flex rounded-lg bg-green-400/10 p-2 text-green-400">
                <MessageCircle className="size-5" />
              </div>
              <h3 className="mt-4 text-2xl font-bold">{t.whatsappTitle}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/40">{t.whatsappDesc}</p>
              <ul className="mt-4 space-y-2">
                {[t.whatsappFeat1, t.whatsappFeat2, t.whatsappFeat3, t.whatsappFeat4].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white/30">
                    <Check className="size-3 text-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <AppScreen title={t.whatsappShiftDetail} url="app.bellus.com/agenda">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#c9a96e]/10 text-xs font-bold text-[#c9a96e]">
                    JM
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-700">Juliana Mendes</div>
                    <div className="text-[10px] text-gray-400">+55 11 98765-4321</div>
                  </div>
                </div>
                <div className="space-y-1.5 rounded-lg bg-gray-50 p-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">{t.whatsappService}</span>
                    <span className="text-gray-700">{t.mockCutBlowout}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">{t.whatsappDate}</span>
                    <span className="text-gray-700">{t.mockDateValue}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">{t.whatsappTime}</span>
                    <span className="text-gray-700">09:00</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">{t.whatsappProfessional}</span>
                    <span className="text-gray-700">Maria</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-green-200 bg-green-50 py-2 text-[11px] font-semibold text-green-600">
                    <MessageCircle className="size-3" />
                    WhatsApp
                  </div>
                  <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-2 text-[11px] text-gray-500">
                    {t.whatsappEdit}
                  </div>
                </div>
              </div>
            </AppScreen>
          </div>
        </div>
      </section>

      {/* ━━━ FEATURES GRID ━━━ */}
      <section id="features" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <SectionLabel>{t.featuresLabel}</SectionLabel>
            <h2 className="text-3xl font-bold sm:text-4xl">{t.featuresTitle}</h2>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Calendar, title: t.feat1Title, desc: t.feat1Desc },
              { icon: MessageCircle, title: t.feat2Title, desc: t.feat2Desc },
              { icon: CreditCard, title: t.feat3Title, desc: t.feat3Desc },
              { icon: BarChart3, title: t.feat4Title, desc: t.feat4Desc },
              { icon: Sparkles, title: t.feat5Title, desc: t.feat5Desc },
              { icon: Globe, title: t.feat6Title, desc: t.feat6Desc },
              { icon: Shield, title: t.feat7Title, desc: t.feat7Desc },
              { icon: Users, title: t.feat8Title, desc: t.feat8Desc },
              { icon: Smartphone, title: t.feat9Title, desc: t.feat9Desc },
            ].map((feat) => (
              <Glass
                key={feat.title}
                className="group p-5 transition hover:border-[#c9a96e]/15 hover:bg-white/[0.06]"
              >
                <div className="mb-3 inline-flex rounded-lg bg-white/[0.06] p-2.5 text-[#c9a96e] transition group-hover:bg-[#c9a96e]/20">
                  <feat.icon className="size-4" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-white/80">{feat.title}</h3>
                <p className="text-xs leading-relaxed text-white/30">{feat.desc}</p>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ COMPARISON ━━━ */}
      <section id="comparison" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <SectionLabel>{t.comparisonLabel}</SectionLabel>
            <h2 className="text-3xl font-bold sm:text-4xl">{t.comparisonTitle}</h2>
          </div>

          <div className="mx-auto mt-12 max-w-3xl overflow-x-auto">
            <Glass className="p-6">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="pb-4 pr-4 font-medium text-white/25">{t.compFeature}</th>
                    <th className="pb-4 pr-4 text-center font-bold text-[#c9a96e]">Bellus</th>
                    <th className="pb-4 pr-4 text-center font-medium text-white/25">Treatwell</th>
                    <th className="pb-4 pr-4 text-center font-medium text-white/25">Booksy</th>
                    <th className="pb-4 text-center font-medium text-white/25">{t.compSpreadsheet}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {[
                    [t.compOnlineSchedule, true, true, true, false],
                    [t.compBookingLink, true, true, true, false],
                    [t.compFreeWhatsapp, true, false, false, false],
                    [t.compCashier, true, true, true, false],
                    [t.compFiscal, true, false, false, false],
                    [t.compAiMarketing, true, false, false, false],
                    [t.compLanguages, true, false, false, false],
                    [t.compNoCommission, true, false, false, true],
                    [t.compPrice, t.compBellusPrice, "25-35%", "€30+/mês", t.compFree],
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="py-3 pr-4 font-medium text-white/50">{row[0] as string}</td>
                      {(row.slice(1) as (boolean | string)[]).map((cell, j) => (
                        <td key={j} className="py-3 pr-4 text-center">
                          {typeof cell === "boolean" ? (
                            cell ? (
                              <Check className="mx-auto size-4 text-emerald-400" />
                            ) : (
                              <X className="mx-auto size-4 text-white/10" />
                            )
                          ) : (
                            <span className={`text-xs font-semibold ${j === 0 ? "text-[#c9a96e]" : "text-white/25"}`}>
                              {cell}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Glass>
          </div>
        </div>
      </section>

      {/* ━━━ PRICING ━━━ */}
      <section id="pricing" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <SectionLabel>{t.pricingLabel}</SectionLabel>
            <h2 className="text-3xl font-bold sm:text-4xl">{t.pricingTitle}</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/35">{t.pricingSubtitle}</p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
            {/* Starter */}
            <Glass className="flex flex-col p-8">
              <div className="text-center">
                <div className="text-sm font-semibold text-white/40">Starter</div>
                <div className="mt-3 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold">€0</span>
                  <span className="text-white/25">{t.pricingMonth}</span>
                </div>
                <div className="mt-1 text-xs text-white/20">{t.pricingFreeForever}</div>
              </div>
              <div className="my-6 h-px bg-white/[0.06]" />
              <ul className="flex-1 space-y-3">
                {[
                  { t: t.planSchedules30, ok: true },
                  { t: t.plan1Professional, ok: true },
                  { t: t.planScheduleLink, ok: true },
                  { t: t.planClientMgmt, ok: true },
                  { t: t.planBasicDash, ok: true },
                  { t: t.planWhatsapp, ok: false },
                  { t: t.planCashier, ok: false },
                  { t: t.planFiscal, ok: false },
                  { t: t.planAiMarketing, ok: false },
                ].map((f) => (
                  <li key={f.t} className="flex items-center gap-2.5 text-sm">
                    {f.ok ? <Check className="size-3.5 text-emerald-400" /> : <X className="size-3.5 text-white/10" />}
                    <span className={f.ok ? "text-white/60" : "text-white/20"}>{f.t}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08]"
              >
                {t.pricingStartFree}
              </Link>
            </Glass>

            {/* Pro */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-[#c9a96e]/40 to-[#c9a96e]/10 blur-[1px]" />
              <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#c9a96e]/30 bg-[#0f0f11] shadow-2xl shadow-[#c9a96e]/10">
                <div className="bg-gradient-to-r from-[#c9a96e] to-[#b8964d] py-1.5 text-center text-xs font-bold text-black">
                  {t.pricingMostPopular}
                </div>
                <div className="p-8">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-[#c9a96e]">Pro</div>
                    <div className="mt-3 flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-extrabold">€9</span>
                      <span className="text-white/25">{t.pricingMonth}</span>
                    </div>
                    <div className="mt-1 text-xs text-white/30">{t.pricingProSubtitle}</div>
                  </div>
                  <div className="my-6 h-px bg-white/[0.06]" />
                  <ul className="space-y-3">
                    {[
                      { t: t.planUnlimitedSchedules, ok: true },
                      { t: t.plan5Professionals, ok: true },
                      { t: t.planScheduleLink, ok: true },
                      { t: t.planUnlimitedClients, ok: true },
                      { t: t.planFullDash, ok: true },
                      { t: t.planFreeWhatsapp, ok: true },
                      { t: t.planDailyCashier, ok: true },
                      { t: t.planFullFiscal, ok: true },
                      { t: t.planAiMarketing, ok: false },
                    ].map((f) => (
                      <li key={f.t} className="flex items-center gap-2.5 text-sm">
                        {f.ok ? <Check className="size-3.5 text-emerald-400" /> : <X className="size-3.5 text-white/10" />}
                        <span className={f.ok ? "text-white/70" : "text-white/20"}>{f.t}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#b8964d] py-3.5 text-base font-semibold text-black transition hover:opacity-90"
                  >
                    {t.pricingStartNow}
                    <ChevronRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Premium */}
            <Glass className="flex flex-col p-8">
              <div className="text-center">
                <div className="text-sm font-semibold text-white/40">Premium</div>
                <div className="mt-3 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold">€15</span>
                  <span className="text-white/25">{t.pricingMonth}</span>
                </div>
                <div className="mt-1 text-xs text-white/20">{t.pricingPremiumSubtitle}</div>
              </div>
              <div className="my-6 h-px bg-white/[0.06]" />
              <ul className="flex-1 space-y-3">
                {[
                  t.planUnlimitedSchedules,
                  t.planUnlimitedProfessionals,
                  t.planScheduleLink,
                  t.planUnlimitedClients,
                  t.planFullDash,
                  t.planFreeWhatsapp,
                  t.planDailyCashier,
                  t.planFullFiscal,
                  t.planAiMarketing,
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="size-3.5 text-emerald-400" />
                    <span className="text-white/60">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.10]"
              >
                {t.pricingStartNow}
                <ChevronRight className="size-4" />
              </Link>
            </Glass>
          </div>
        </div>
      </section>

      {/* ━━━ TESTIMONIALS ━━━ */}
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <SectionLabel>{t.testimonialsLabel}</SectionLabel>
            <h2 className="text-3xl font-bold sm:text-4xl">{t.testimonialsTitle}</h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Juliana Mendes",
                role: "Studio Juliana, São Paulo",
                flag: "🇧🇷",
                text: "Antes eu perdia 2 horas por dia gerenciando agenda no WhatsApp. Com o Bellus, minhas clientes agendam sozinhas e eu recebo lembrete automático. Mudou meu salão!",
              },
              {
                name: "María García",
                role: "Peluquería María, Madrid",
                flag: "🇪🇸",
                text: "El módulo fiscal me salvó. Controlo IVA e IRPF sin planilla. Y los recordatorios por WhatsApp redujeron las faltas en un 80%. Lo recomiendo mucho.",
              },
              {
                name: "Fernanda Costa",
                role: "Beleza & Arte, Belo Horizonte",
                flag: "🇧🇷",
                text: "Testei Booksy e Treatwell, pagava uma fortuna em comissão. O Bellus me dá tudo que eu preciso por €9/mês. É outro nível.",
              },
              {
                name: "Olga Ivanova",
                role: "Beauty Space, Barcelona",
                flag: "🇷🇺",
                text: "Моя команда говорит на 3 языках. Bellus работает на всех. Каждый клиент получает сообщение на своём языке. Потрясающе.",
              },
              {
                name: "Camila Rodrigues",
                role: "Espaço Camila, Rio de Janeiro",
                flag: "🇧🇷",
                text: "O dashboard me mostrou que 40% do meu faturamento vem de coloração. Mudei minha estratégia e aumentei o ticket médio em 30%.",
              },
              {
                name: "Carmen López",
                role: "Salón Carmen, Valencia",
                flag: "🇪🇸",
                text: "Lo configuré en 5 minutos. El primer día ya recibí 3 citas por el link. La simplicidad es todo.",
              },
            ].map((testimonial) => (
              <Glass key={testimonial.name} className="p-5">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-[#c9a96e] text-[#c9a96e]" />
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-white/40">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{testimonial.flag}</span>
                  <div>
                    <div className="text-xs font-semibold text-white/60">{testimonial.name}</div>
                    <div className="text-[10px] text-white/25">{testimonial.role}</div>
                  </div>
                </div>
              </Glass>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="relative overflow-hidden px-4 py-32 text-center sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c9a96e]/[0.08] blur-[150px]" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-4xl font-bold sm:text-5xl">
            {t.ctaTitle1}{" "}
            <span className="bg-gradient-to-r from-[#c9a96e] via-[#e0c58a] to-[#c9a96e] bg-clip-text text-transparent">
              {t.ctaTitle2}
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/30">{t.ctaSubtitle}</p>
          <Link
            href="/register"
            className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a96e] to-[#b8964d] px-10 py-4 text-lg font-semibold text-black shadow-xl shadow-[#c9a96e]/20 transition hover:shadow-[#c9a96e]/30"
          >
            {t.ctaCta}
            <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-6 text-xs text-white/20">{t.ctaNote}</p>
        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-white/[0.06] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#c9a96e] to-[#a07d3a]">
              <Scissors className="size-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">Bellus</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/25">
            <Link href="/login" className="transition hover:text-white/50">{t.footerLogin}</Link>
            <Link href="/register" className="transition hover:text-white/50">{t.footerRegister}</Link>
            <a href="#features" className="transition hover:text-white/50">{t.navFeatures}</a>
            <a href="#pricing" className="transition hover:text-white/50">{t.navPricing}</a>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/20">
            <Globe className="size-3" />
            PT / ES / EN / RU
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl text-center text-[11px] text-white/15">
          © {new Date().getFullYear()} Bellus. {t.footerRights}
        </div>
      </footer>
    </div>
  );
}
