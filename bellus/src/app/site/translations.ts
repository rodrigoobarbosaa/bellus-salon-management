export type LandingLocale = "pt" | "es" | "en";

const translations: Record<LandingLocale, Record<string, string>> = {
  pt: {
    // Nav
    navFeatures: "Funcionalidades",
    navSoftware: "Software",
    navPricing: "Planos",
    navLogin: "Entrar",
    navCta: "Começar grátis",

    // Hero
    heroBadge: "Comece grátis — sem comissão — sem taxa oculta",
    heroTitle1: "O sistema completo",
    heroTitle2: "que seu salão precisa",
    heroSubtitle:
      "Agenda, caixa, fiscal, WhatsApp e marketing com IA. Tudo num só lugar. Do celular. Em 4 idiomas.",
    heroCta1: "Criar conta grátis",
    heroCta2: "Ver o software",

    // Metrics
    metricCommission: "comissão",
    metricStart: "para começar",
    metricLanguages: "idiomas",
    metricSetup: "para configurar",

    // Dashboard mockup
    dashGreeting: "Bom dia,",
    dashToday: "Hoje",
    dashWeek: "Semana",
    dashActiveClients: "Clientes ativos",
    dashShifts: "turnos",
    dashTodayAgenda: "Agenda de hoje",

    // Software section
    softwareLabel: "O Software",
    softwareTitle: "Conheça cada módulo",
    softwareSubtitle:
      "Do agendamento ao marketing. Cada tela foi pensada para facilitar o dia a dia do seu salão.",

    // Screen 1 - Agenda
    agendaTitle: "Agenda inteligente",
    agendaDesc:
      "Visualize por dia, semana ou mês. Arraste para reagendar. Bloqueie horários. Cada profissional tem sua cor. O cliente agenda sozinho pelo link de reserva.",
    agendaFeat1: "Drag & drop para reagendar",
    agendaFeat2: "Link de reserva público",
    agendaFeat3: "Bloqueio de horários",
    agendaFeat4: "Cores por profissional",

    // Screen 2 - Caixa
    caixaTitle: "Caixa e pagamentos",
    caixaDesc:
      "Registre pagamentos ao concluir o atendimento. Fechamento diário automático. Filtre por profissional, método de pagamento ou período. Exporte CSV.",
    caixaFeat1: "Pagamento ao concluir turno",
    caixaFeat2: "Fechamento diário automático",
    caixaFeat3: "Filtros por profissional",
    caixaFeat4: "Exportação CSV",
    caixaRevenue: "Faturamento hoje",

    // Screen 3 - WhatsApp
    whatsappTitle: "WhatsApp com 1 clique",
    whatsappDesc:
      "Envie lembretes de agendamento direto pelo WhatsApp. A mensagem vai pronta, no idioma preferido do cliente. Zero API, zero Twilio, zero custo.",
    whatsappFeat1: "Mensagem pré-preenchida",
    whatsappFeat2: "Idioma do cliente automático",
    whatsappFeat3: "Sem custo de API",
    whatsappFeat4: "Abre WhatsApp Web/App",
    whatsappShiftDetail: "Detalhe do turno",
    whatsappService: "Serviço",
    whatsappDate: "Data",
    whatsappTime: "Hora",
    whatsappProfessional: "Profissional",
    whatsappEdit: "Editar",

    // Features grid
    featuresLabel: "Funcionalidades",
    featuresTitle: "Tudo num só lugar",
    feat1Title: "Agenda inteligente",
    feat1Desc: "Dia, semana, mês. Drag & drop. Link de reserva para clientes.",
    feat2Title: "WhatsApp grátis",
    feat2Desc: "Lembretes com 1 clique no idioma do cliente. Zero custo.",
    feat3Title: "Caixa e pagamentos",
    feat3Desc: "Pagamentos ao concluir. Fechamento diário. CSV.",
    feat4Title: "Dashboard e KPIs",
    feat4Desc: "Faturamento, clientes ativos, serviços top. Tempo real.",
    feat5Title: "Marketing com IA",
    feat5Desc: "Conteúdo para redes, campanhas, reativação de clientes.",
    feat6Title: "4 idiomas",
    feat6Desc: "PT, ES, EN, RU. Equipes internacionais. Clientes globais.",
    feat7Title: "Módulo fiscal",
    feat7Desc: "IVA, IRPF, despesas, cuota. Modelos 303 e 130.",
    feat8Title: "Gestão de clientes",
    feat8Desc: "Histórico, lembretes de retorno, idioma, opt-out.",
    feat9Title: "Funciona no celular",
    feat9Desc: "Responsivo. Instale como app na tela inicial.",

    // Comparison
    comparisonLabel: "Comparativo",
    comparisonTitle: "Por que o Bellus?",
    compFeature: "Feature",
    compOnlineSchedule: "Agenda online",
    compBookingLink: "Link de reserva",
    compFreeWhatsapp: "WhatsApp grátis",
    compCashier: "Caixa e financeiro",
    compFiscal: "Módulo fiscal",
    compAiMarketing: "Marketing com IA",
    compLanguages: "4 idiomas",
    compNoCommission: "Sem comissão",
    compPrice: "Preço",
    compBellusPrice: "A partir de €0",
    compSpreadsheet: "Planilha",
    compFree: "Grátis",

    // Pricing
    pricingLabel: "Planos",
    pricingTitle: "Escolha o plano ideal",
    pricingSubtitle:
      "Comece grátis. Sem comissão. Sem taxa por agendamento. Cancele quando quiser.",
    pricingMonth: "/mês",
    pricingFreeForever: "Grátis para sempre",
    pricingProSubtitle: "Tudo que um salão profissional precisa",
    pricingPremiumSubtitle: "Para salões em crescimento",
    pricingMostPopular: "MAIS POPULAR",
    pricingStartFree: "Começar grátis",
    pricingStartNow: "Começar agora",
    planSchedules30: "Até 30 agendamentos/mês",
    plan1Professional: "1 profissional",
    planScheduleLink: "Agenda + link de reserva",
    planClientMgmt: "Gestão de clientes",
    planBasicDash: "Dashboard básico",
    planWhatsapp: "Lembretes WhatsApp",
    planCashier: "Caixa e financeiro",
    planFiscal: "Módulo fiscal",
    planAiMarketing: "Marketing com IA",
    planUnlimitedSchedules: "Agendamentos ilimitados",
    plan5Professionals: "Até 5 profissionais",
    planUnlimitedClients: "Clientes ilimitados",
    planFullDash: "Dashboard completo + KPIs",
    planFreeWhatsapp: "Lembretes WhatsApp grátis",
    planDailyCashier: "Caixa e fechamento diário",
    planFullFiscal: "Módulo fiscal completo",
    planUnlimitedProfessionals: "Profissionais ilimitados",

    // Testimonials
    testimonialsLabel: "Depoimentos",
    testimonialsTitle: "Quem usa, recomenda",

    // Final CTA
    ctaTitle1: "Seu salão merece",
    ctaTitle2: "tecnologia de ponta",
    ctaSubtitle:
      "Chega de planilha, de caos no WhatsApp, de pagar comissão. Crie sua conta em 3 minutos.",
    ctaCta: "Criar conta grátis",
    ctaNote: "Sem cartão de crédito. Comece grátis. Upgrade quando quiser.",

    // Mockup — sidebar
    mockSidebar1: "Dashboard",
    mockSidebar2: "Agenda",
    mockSidebar3: "Clientes",
    mockSidebar4: "Serviços",
    mockSidebar5: "Caixa",
    mockSidebar6: "Fiscal",
    mockSidebar7: "Marketing IA",

    // Mockup — services
    mockCutBlowout: "Corte + Escova",
    mockColoring: "Coloração completa",
    mockHighlights: "Mechas + Hidratação",
    mockMensCut: "Corte masculino",
    mockKeratin: "Progressiva",
    mockCut: "Corte",

    // Mockup — agenda short
    mockAgenda1: "Juliana — Corte",
    mockAgenda2: "Carmen — Coloração",
    mockAgenda3: "Olga — Mechas",
    mockAgenda5: "Sarah — Progressiva",
    mockAgenda6: "Fernanda — Corte",

    // Mockup — payment
    mockCard: "Cartão",
    mockCash: "Dinheiro",

    // Mockup — WhatsApp detail
    mockDateValue: "Terça, 25 março",

    // Footer
    footerLogin: "Entrar",
    footerRegister: "Criar conta",
    footerRights: "Todos os direitos reservados.",
  },

  es: {
    navFeatures: "Funcionalidades",
    navSoftware: "Software",
    navPricing: "Planes",
    navLogin: "Entrar",
    navCta: "Empezar gratis",

    heroBadge: "Empieza gratis — sin comisión — sin tasas ocultas",
    heroTitle1: "El sistema completo",
    heroTitle2: "que tu salón necesita",
    heroSubtitle:
      "Agenda, caja, fiscal, WhatsApp y marketing con IA. Todo en un solo lugar. Desde el móvil. En 4 idiomas.",
    heroCta1: "Crear cuenta gratis",
    heroCta2: "Ver el software",

    metricCommission: "comisión",
    metricStart: "para empezar",
    metricLanguages: "idiomas",
    metricSetup: "para configurar",

    dashGreeting: "Buenos días,",
    dashToday: "Hoy",
    dashWeek: "Semana",
    dashActiveClients: "Clientes activos",
    dashShifts: "turnos",
    dashTodayAgenda: "Agenda de hoy",

    softwareLabel: "El Software",
    softwareTitle: "Conoce cada módulo",
    softwareSubtitle:
      "De la programación al marketing. Cada pantalla fue pensada para facilitar el día a día de tu salón.",

    agendaTitle: "Agenda inteligente",
    agendaDesc:
      "Visualiza por día, semana o mes. Arrastra para reprogramar. Bloquea horarios. Cada profesional tiene su color. El cliente agenda solo por el link de reserva.",
    agendaFeat1: "Drag & drop para reprogramar",
    agendaFeat2: "Link de reserva público",
    agendaFeat3: "Bloqueo de horarios",
    agendaFeat4: "Colores por profesional",

    caixaTitle: "Caja y pagos",
    caixaDesc:
      "Registra pagos al concluir la atención. Cierre diario automático. Filtra por profesional, método de pago o período. Exporta CSV.",
    caixaFeat1: "Pago al concluir turno",
    caixaFeat2: "Cierre diario automático",
    caixaFeat3: "Filtros por profesional",
    caixaFeat4: "Exportación CSV",
    caixaRevenue: "Facturación hoy",

    whatsappTitle: "WhatsApp con 1 clic",
    whatsappDesc:
      "Envía recordatorios de cita directo por WhatsApp. El mensaje va listo, en el idioma preferido del cliente. Zero API, zero Twilio, zero coste.",
    whatsappFeat1: "Mensaje pre-rellenado",
    whatsappFeat2: "Idioma del cliente automático",
    whatsappFeat3: "Sin coste de API",
    whatsappFeat4: "Abre WhatsApp Web/App",
    whatsappShiftDetail: "Detalle del turno",
    whatsappService: "Servicio",
    whatsappDate: "Fecha",
    whatsappTime: "Hora",
    whatsappProfessional: "Profesional",
    whatsappEdit: "Editar",

    featuresLabel: "Funcionalidades",
    featuresTitle: "Todo en un solo lugar",
    feat1Title: "Agenda inteligente",
    feat1Desc: "Día, semana, mes. Drag & drop. Link de reserva para clientes.",
    feat2Title: "WhatsApp gratis",
    feat2Desc: "Recordatorios con 1 clic en el idioma del cliente. Zero coste.",
    feat3Title: "Caja y pagos",
    feat3Desc: "Pagos al concluir. Cierre diario. CSV.",
    feat4Title: "Dashboard y KPIs",
    feat4Desc: "Facturación, clientes activos, servicios top. Tiempo real.",
    feat5Title: "Marketing con IA",
    feat5Desc: "Contenido para redes, campañas, reactivación de clientes.",
    feat6Title: "4 idiomas",
    feat6Desc: "PT, ES, EN, RU. Equipos internacionales. Clientes globales.",
    feat7Title: "Módulo fiscal",
    feat7Desc: "IVA, IRPF, gastos, cuota. Modelos 303 y 130.",
    feat8Title: "Gestión de clientes",
    feat8Desc: "Historial, recordatorios de retorno, idioma, opt-out.",
    feat9Title: "Funciona en el móvil",
    feat9Desc: "Responsivo. Instala como app en la pantalla de inicio.",

    comparisonLabel: "Comparativo",
    comparisonTitle: "¿Por qué Bellus?",
    compFeature: "Feature",
    compOnlineSchedule: "Agenda online",
    compBookingLink: "Link de reserva",
    compFreeWhatsapp: "WhatsApp gratis",
    compCashier: "Caja y financiero",
    compFiscal: "Módulo fiscal",
    compAiMarketing: "Marketing con IA",
    compLanguages: "4 idiomas",
    compNoCommission: "Sin comisión",
    compPrice: "Precio",
    compBellusPrice: "Desde €0",
    compSpreadsheet: "Hoja de cálculo",
    compFree: "Gratis",

    pricingLabel: "Planes",
    pricingTitle: "Elige el plan ideal",
    pricingSubtitle:
      "Empieza gratis. Sin comisión. Sin tasa por programación. Cancela cuando quieras.",
    pricingMonth: "/mes",
    pricingFreeForever: "Gratis para siempre",
    pricingProSubtitle: "Todo lo que un salón profesional necesita",
    pricingPremiumSubtitle: "Para salones en crecimiento",
    pricingMostPopular: "MÁS POPULAR",
    pricingStartFree: "Empezar gratis",
    pricingStartNow: "Empezar ahora",
    planSchedules30: "Hasta 30 citas/mes",
    plan1Professional: "1 profesional",
    planScheduleLink: "Agenda + link de reserva",
    planClientMgmt: "Gestión de clientes",
    planBasicDash: "Dashboard básico",
    planWhatsapp: "Recordatorios WhatsApp",
    planCashier: "Caja y financiero",
    planFiscal: "Módulo fiscal",
    planAiMarketing: "Marketing con IA",
    planUnlimitedSchedules: "Citas ilimitadas",
    plan5Professionals: "Hasta 5 profesionales",
    planUnlimitedClients: "Clientes ilimitados",
    planFullDash: "Dashboard completo + KPIs",
    planFreeWhatsapp: "Recordatorios WhatsApp gratis",
    planDailyCashier: "Caja y cierre diario",
    planFullFiscal: "Módulo fiscal completo",
    planUnlimitedProfessionals: "Profesionales ilimitados",

    testimonialsLabel: "Testimonios",
    testimonialsTitle: "Quien lo usa, lo recomienda",

    ctaTitle1: "Tu salón merece",
    ctaTitle2: "tecnología de punta",
    ctaSubtitle:
      "Basta de hojas de cálculo, de caos en WhatsApp, de pagar comisión. Crea tu cuenta en 3 minutos.",
    ctaCta: "Crear cuenta gratis",
    ctaNote: "Sin tarjeta de crédito. Empieza gratis. Upgrade cuando quieras.",

    mockSidebar1: "Dashboard",
    mockSidebar2: "Agenda",
    mockSidebar3: "Clientes",
    mockSidebar4: "Servicios",
    mockSidebar5: "Caja",
    mockSidebar6: "Fiscal",
    mockSidebar7: "Marketing IA",

    mockCutBlowout: "Corte + Peinado",
    mockColoring: "Coloración completa",
    mockHighlights: "Mechas + Hidratación",
    mockMensCut: "Corte masculino",
    mockKeratin: "Alisado",
    mockCut: "Corte",

    mockAgenda1: "Juliana — Corte",
    mockAgenda2: "Carmen — Coloración",
    mockAgenda3: "Olga — Mechas",
    mockAgenda5: "Sarah — Alisado",
    mockAgenda6: "Fernanda — Corte",

    mockCard: "Tarjeta",
    mockCash: "Efectivo",

    mockDateValue: "Martes, 25 marzo",

    footerLogin: "Entrar",
    footerRegister: "Crear cuenta",
    footerRights: "Todos los derechos reservados.",
  },

  en: {
    navFeatures: "Features",
    navSoftware: "Software",
    navPricing: "Pricing",
    navLogin: "Sign in",
    navCta: "Start free",

    heroBadge: "Start free — zero commission — no hidden fees",
    heroTitle1: "The complete system",
    heroTitle2: "your salon needs",
    heroSubtitle:
      "Scheduling, cashier, tax, WhatsApp & AI marketing. All in one place. From your phone. In 4 languages.",
    heroCta1: "Create free account",
    heroCta2: "See the software",

    metricCommission: "commission",
    metricStart: "to start",
    metricLanguages: "languages",
    metricSetup: "to set up",

    dashGreeting: "Good morning,",
    dashToday: "Today",
    dashWeek: "Week",
    dashActiveClients: "Active clients",
    dashShifts: "shifts",
    dashTodayAgenda: "Today's schedule",

    softwareLabel: "The Software",
    softwareTitle: "Explore each module",
    softwareSubtitle:
      "From scheduling to marketing. Every screen was designed to simplify your salon's daily routine.",

    agendaTitle: "Smart scheduling",
    agendaDesc:
      "View by day, week, or month. Drag to reschedule. Block time slots. Each professional has their color. Clients book themselves via the booking link.",
    agendaFeat1: "Drag & drop to reschedule",
    agendaFeat2: "Public booking link",
    agendaFeat3: "Time slot blocking",
    agendaFeat4: "Colors per professional",

    caixaTitle: "Cashier & payments",
    caixaDesc:
      "Register payments when completing service. Automatic daily closing. Filter by professional, payment method, or period. Export CSV.",
    caixaFeat1: "Payment on shift completion",
    caixaFeat2: "Automatic daily closing",
    caixaFeat3: "Filter by professional",
    caixaFeat4: "CSV export",
    caixaRevenue: "Revenue today",

    whatsappTitle: "WhatsApp in 1 click",
    whatsappDesc:
      "Send appointment reminders directly via WhatsApp. The message is ready, in the client's preferred language. Zero API, zero Twilio, zero cost.",
    whatsappFeat1: "Pre-filled message",
    whatsappFeat2: "Automatic client language",
    whatsappFeat3: "No API cost",
    whatsappFeat4: "Opens WhatsApp Web/App",
    whatsappShiftDetail: "Shift detail",
    whatsappService: "Service",
    whatsappDate: "Date",
    whatsappTime: "Time",
    whatsappProfessional: "Professional",
    whatsappEdit: "Edit",

    featuresLabel: "Features",
    featuresTitle: "Everything in one place",
    feat1Title: "Smart scheduling",
    feat1Desc: "Day, week, month. Drag & drop. Booking link for clients.",
    feat2Title: "Free WhatsApp",
    feat2Desc: "Reminders with 1 click in the client's language. Zero cost.",
    feat3Title: "Cashier & payments",
    feat3Desc: "Payments on completion. Daily closing. CSV.",
    feat4Title: "Dashboard & KPIs",
    feat4Desc: "Revenue, active clients, top services. Real time.",
    feat5Title: "AI Marketing",
    feat5Desc: "Social content, campaigns, client reactivation.",
    feat6Title: "4 languages",
    feat6Desc: "PT, ES, EN, RU. International teams. Global clients.",
    feat7Title: "Tax module",
    feat7Desc: "VAT, income tax, expenses, installments. Models 303 & 130.",
    feat8Title: "Client management",
    feat8Desc: "History, return reminders, language, opt-out.",
    feat9Title: "Works on mobile",
    feat9Desc: "Responsive. Install as an app on your home screen.",

    comparisonLabel: "Comparison",
    comparisonTitle: "Why Bellus?",
    compFeature: "Feature",
    compOnlineSchedule: "Online scheduling",
    compBookingLink: "Booking link",
    compFreeWhatsapp: "Free WhatsApp",
    compCashier: "Cashier & financial",
    compFiscal: "Tax module",
    compAiMarketing: "AI Marketing",
    compLanguages: "4 languages",
    compNoCommission: "No commission",
    compPrice: "Price",
    compBellusPrice: "From €0",
    compSpreadsheet: "Spreadsheet",
    compFree: "Free",

    pricingLabel: "Plans",
    pricingTitle: "Choose the ideal plan",
    pricingSubtitle:
      "Start free. No commission. No booking fee. Cancel anytime.",
    pricingMonth: "/month",
    pricingFreeForever: "Free forever",
    pricingProSubtitle: "Everything a professional salon needs",
    pricingPremiumSubtitle: "For growing salons",
    pricingMostPopular: "MOST POPULAR",
    pricingStartFree: "Start free",
    pricingStartNow: "Start now",
    planSchedules30: "Up to 30 bookings/month",
    plan1Professional: "1 professional",
    planScheduleLink: "Schedule + booking link",
    planClientMgmt: "Client management",
    planBasicDash: "Basic dashboard",
    planWhatsapp: "WhatsApp reminders",
    planCashier: "Cashier & financial",
    planFiscal: "Tax module",
    planAiMarketing: "AI Marketing",
    planUnlimitedSchedules: "Unlimited bookings",
    plan5Professionals: "Up to 5 professionals",
    planUnlimitedClients: "Unlimited clients",
    planFullDash: "Full dashboard + KPIs",
    planFreeWhatsapp: "Free WhatsApp reminders",
    planDailyCashier: "Cashier & daily closing",
    planFullFiscal: "Full tax module",
    planUnlimitedProfessionals: "Unlimited professionals",

    testimonialsLabel: "Testimonials",
    testimonialsTitle: "Loved by salon owners",

    ctaTitle1: "Your salon deserves",
    ctaTitle2: "cutting-edge technology",
    ctaSubtitle:
      "No more spreadsheets, WhatsApp chaos, or commission fees. Create your account in 3 minutes.",
    ctaCta: "Create free account",
    ctaNote: "No credit card. Start free. Upgrade when you want.",

    mockSidebar1: "Dashboard",
    mockSidebar2: "Schedule",
    mockSidebar3: "Clients",
    mockSidebar4: "Services",
    mockSidebar5: "Cashier",
    mockSidebar6: "Tax",
    mockSidebar7: "AI Marketing",

    mockCutBlowout: "Cut + Blowout",
    mockColoring: "Full coloring",
    mockHighlights: "Highlights + Treatment",
    mockMensCut: "Men's cut",
    mockKeratin: "Keratin",
    mockCut: "Cut",

    mockAgenda1: "Juliana — Cut",
    mockAgenda2: "Carmen — Coloring",
    mockAgenda3: "Olga — Highlights",
    mockAgenda5: "Sarah — Keratin",
    mockAgenda6: "Fernanda — Cut",

    mockCard: "Card",
    mockCash: "Cash",

    mockDateValue: "Tuesday, March 25",

    footerLogin: "Sign in",
    footerRegister: "Create account",
    footerRights: "All rights reserved.",
  },
};

export function getLandingTranslations(locale: string) {
  if (locale === "pt") return translations.pt;
  if (locale === "en") return translations.en;
  return translations.es; // default + "es"
}
