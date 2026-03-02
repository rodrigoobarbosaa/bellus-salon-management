"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, Check, Clock, User, Scissors, Calendar, UserCircle } from "lucide-react";
import { createPublicBooking } from "@/app/actions/public-booking";

// --- Booking i18n ---
const TEXTS: Record<string, Record<string, string>> = {
  es: {
    step1Title: "Selecciona un servicio",
    step2Title: "Elige un profesional",
    step3Title: "Selecciona fecha y hora",
    step4Title: "Tus datos",
    step5Title: "Confirmar reserva",
    min: "min",
    anyone: "Sin preferencia",
    anyoneDesc: "El primero disponible",
    name: "Nombre *",
    phone: "Teléfono *",
    email: "Email (opcional)",
    service: "Servicio",
    professional: "Profesional",
    dateTime: "Fecha y hora",
    price: "Precio",
    confirm: "Confirmar reserva",
    back: "Atrás",
    next: "Siguiente",
    noSlots: "No hay horarios disponibles para esta fecha",
    successTitle: "¡Reserva confirmada!",
    successMsg: "Te esperamos en la fecha indicada. Recibirás una confirmación por WhatsApp.",
    newBooking: "Hacer otra reserva",
    loadingSlots: "Buscando horarios...",
    creating: "Reservando...",
    error: "Error al crear la reserva. Intenta de nuevo.",
    selectDate: "Selecciona una fecha",
    closed: "Cerrado",
  },
  pt: {
    step1Title: "Selecione um serviço",
    step2Title: "Escolha um profissional",
    step3Title: "Selecione data e horário",
    step4Title: "Seus dados",
    step5Title: "Confirmar reserva",
    min: "min",
    anyone: "Sem preferência",
    anyoneDesc: "O primeiro disponível",
    name: "Nome *",
    phone: "Telefone *",
    email: "Email (opcional)",
    service: "Serviço",
    professional: "Profissional",
    dateTime: "Data e hora",
    price: "Preço",
    confirm: "Confirmar reserva",
    back: "Voltar",
    next: "Próximo",
    noSlots: "Sem horários disponíveis para esta data",
    successTitle: "Reserva confirmada!",
    successMsg: "Esperamos você na data indicada. Você receberá uma confirmação por WhatsApp.",
    newBooking: "Fazer outra reserva",
    loadingSlots: "Buscando horários...",
    creating: "Reservando...",
    error: "Erro ao criar reserva. Tente novamente.",
    selectDate: "Selecione uma data",
    closed: "Fechado",
  },
  en: {
    step1Title: "Select a service",
    step2Title: "Choose a professional",
    step3Title: "Select date and time",
    step4Title: "Your details",
    step5Title: "Confirm booking",
    min: "min",
    anyone: "No preference",
    anyoneDesc: "First available",
    name: "Name *",
    phone: "Phone *",
    email: "Email (optional)",
    service: "Service",
    professional: "Professional",
    dateTime: "Date and time",
    price: "Price",
    confirm: "Confirm booking",
    back: "Back",
    next: "Next",
    noSlots: "No available time slots for this date",
    successTitle: "Booking confirmed!",
    successMsg: "We look forward to seeing you! You'll receive a WhatsApp confirmation.",
    newBooking: "Make another booking",
    loadingSlots: "Loading time slots...",
    creating: "Booking...",
    error: "Error creating booking. Please try again.",
    selectDate: "Select a date",
    closed: "Closed",
  },
  ru: {
    step1Title: "Выберите услугу",
    step2Title: "Выберите специалиста",
    step3Title: "Выберите дату и время",
    step4Title: "Ваши данные",
    step5Title: "Подтвердите бронирование",
    min: "мин",
    anyone: "Без предпочтений",
    anyoneDesc: "Первый доступный",
    name: "Имя *",
    phone: "Телефон *",
    email: "Email (необязательно)",
    service: "Услуга",
    professional: "Специалист",
    dateTime: "Дата и время",
    price: "Цена",
    confirm: "Подтвердить",
    back: "Назад",
    next: "Далее",
    noSlots: "Нет доступных слотов на эту дату",
    successTitle: "Бронирование подтверждено!",
    successMsg: "Ждём вас! Вы получите подтверждение в WhatsApp.",
    newBooking: "Новое бронирование",
    loadingSlots: "Загрузка расписания...",
    creating: "Бронирование...",
    error: "Ошибка при создании бронирования. Попробуйте снова.",
    selectDate: "Выберите дату",
    closed: "Закрыто",
  },
};

const LANG_LABELS: Record<string, string> = { es: "ES", pt: "PT", en: "EN", ru: "RU" };

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  es: { corte: "Corte", coloracao: "Coloración", mechas: "Mechas", tratamento: "Tratamiento", outro: "Otros" },
  pt: { corte: "Corte", coloracao: "Coloração", mechas: "Mechas", tratamento: "Tratamento", outro: "Outros" },
  en: { corte: "Haircut", coloracao: "Coloring", mechas: "Highlights", tratamento: "Treatment", outro: "Other" },
  ru: { corte: "Стрижка", coloracao: "Окрашивание", mechas: "Мелирование", tratamento: "Уход", outro: "Другое" },
};

const DAY_MAP: Record<number, string> = { 1: "seg", 2: "ter", 3: "qua", 4: "qui", 5: "sex", 6: "sab", 0: "dom" };

interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  duracao_minutos: number;
  preco_base: number;
  categoria: string;
}

interface Profissional {
  id: string;
  nome: string;
  cor_agenda: string;
}

interface ServicoProfissional {
  servico_id: string;
  profissional_id: string;
  preco_override: number | null;
}

interface BookingWizardProps {
  salaoId: string;
  servicos: Servico[];
  profissionais: Profissional[];
  servicoProfissionais: ServicoProfissional[];
  horarioFuncionamento: Record<string, { abre: string; fecha: string } | null> | null;
  timezone: string;
  moeda: string;
}

function detectLocale(): string {
  if (typeof navigator === "undefined") return "es";
  const lang = navigator.language?.toLowerCase() ?? "es";
  if (lang.startsWith("pt")) return "pt";
  if (lang.startsWith("en")) return "en";
  if (lang.startsWith("ru")) return "ru";
  return "es";
}

function formatPrice(price: number, moeda: string) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: moeda }).format(price);
}

export function BookingWizard({
  salaoId,
  servicos,
  profissionais,
  servicoProfissionais,
  horarioFuncionamento,
  timezone,
  moeda,
}: BookingWizardProps) {
  const [locale, setLocale] = useState(detectLocale);
  const t = TEXTS[locale] ?? TEXTS.es;
  const catLabels = CATEGORY_LABELS[locale] ?? CATEGORY_LABELS.es;

  const [step, setStep] = useState(1);
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const map: Record<string, Servico[]> = {};
    for (const s of servicos) {
      if (!map[s.categoria]) map[s.categoria] = [];
      map[s.categoria].push(s);
    }
    return map;
  }, [servicos]);

  // Filter professionals by selected service
  const availableProfessionals = useMemo(() => {
    if (!selectedServico) return [];
    const ids = new Set(
      servicoProfissionais
        .filter((sp) => sp.servico_id === selectedServico.id)
        .map((sp) => sp.profissional_id)
    );
    // If no associations, show all professionals
    if (ids.size === 0) return profissionais;
    return profissionais.filter((p) => ids.has(p.id));
  }, [selectedServico, servicoProfissionais, profissionais]);

  // Get price for selected service + professional
  const finalPrice = useMemo(() => {
    if (!selectedServico) return 0;
    if (!selectedProfissional) return selectedServico.preco_base;
    const sp = servicoProfissionais.find(
      (x) => x.servico_id === selectedServico.id && x.profissional_id === selectedProfissional.id
    );
    return sp?.preco_override ?? selectedServico.preco_base;
  }, [selectedServico, selectedProfissional, servicoProfissionais]);

  // Min date = today
  const minDate = new Date().toISOString().slice(0, 10);

  // Fetch available slots when date changes
  async function handleDateChange(date: string) {
    setSelectedDate(date);
    setSelectedTime("");
    if (!date || !selectedServico) return;

    // Check if salon is open on this day
    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    const dayKey = DAY_MAP[dayOfWeek];
    const dayHours = horarioFuncionamento?.[dayKey];

    if (!dayHours) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);

    // Generate all possible slots for the day
    const [openH, openM] = dayHours.abre.split(":").map(Number);
    const [closeH, closeM] = dayHours.fecha.split(":").map(Number);
    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;
    const duration = selectedServico.duracao_minutos;

    const allSlots: string[] = [];
    for (let m = openMin; m + duration <= closeMin; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      allSlots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }

    // Fetch existing appointments for the day and selected professional
    try {
      const res = await fetch(
        `/api/booking/slots?salao_id=${salaoId}&date=${date}&profissional_id=${selectedProfissional?.id ?? ""}&duration=${duration}`
      );
      const data = await res.json();
      const busySlots = new Set<string>(data.busy ?? []);

      const free = allSlots.filter((slot) => !busySlots.has(slot));

      // Filter past times if date is today
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      const filtered = date === today
        ? free.filter((slot) => {
            const [h, m] = slot.split(":").map(Number);
            return h * 60 + m > now.getHours() * 60 + now.getMinutes() + 30;
          })
        : free;

      setAvailableSlots(filtered);
    } catch {
      setAvailableSlots(allSlots);
    } finally {
      setLoadingSlots(false);
    }
  }

  // Submit booking
  async function handleConfirm() {
    if (!selectedServico || !selectedDate || !selectedTime || !nome || !telefone) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("salao_id", salaoId);
    formData.set("servico_id", selectedServico.id);
    formData.set("profissional_id", selectedProfissional?.id ?? "");
    formData.set("data", selectedDate);
    formData.set("hora", selectedTime);
    formData.set("nome", nome);
    formData.set("telefone", telefone);
    formData.set("email", email);
    formData.set("idioma", locale);

    const result = await createPublicBooking(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setSuccess(true);
  }

  function reset() {
    setStep(1);
    setSelectedServico(null);
    setSelectedProfissional(null);
    setSelectedDate("");
    setSelectedTime("");
    setNome("");
    setTelefone("");
    setEmail("");
    setError(null);
    setSuccess(false);
  }

  // --- SUCCESS STATE ---
  if (success) {
    return (
      <div className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">{t.successTitle}</h2>
        <p className="mt-2 text-stone-500">{t.successMsg}</p>
        <Button onClick={reset} className="mt-6" style={{ backgroundColor: "var(--salon-primary)" }}>
          {t.newBooking}
        </Button>
      </div>
    );
  }

  // --- STEP INDICATORS ---
  const steps = [
    { icon: Scissors, num: 1 },
    { icon: User, num: 2 },
    { icon: Calendar, num: 3 },
    { icon: UserCircle, num: 4 },
    { icon: Check, num: 5 },
  ];

  return (
    <div className="mt-6">
      {/* Language switcher */}
      <div className="mb-4 flex justify-center gap-1">
        {Object.entries(LANG_LABELS).map(([code, label]) => (
          <button
            key={code}
            onClick={() => setLocale(code)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              locale === code
                ? "text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
            style={locale === code ? { backgroundColor: "var(--salon-primary)" } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Step indicators */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {steps.map(({ icon: Icon, num }) => (
          <div
            key={num}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all ${
              num === step
                ? "text-white shadow-md scale-110"
                : num < step
                  ? "bg-green-100 text-green-600"
                  : "bg-stone-100 text-stone-400"
            }`}
            style={num === step ? { backgroundColor: "var(--salon-primary)" } : undefined}
          >
            {num < step ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* STEP 1: Service */}
        {step === 1 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-stone-800">{t.step1Title}</h2>
            <div className="space-y-4">
              {Object.entries(servicesByCategory).map(([cat, items]) => (
                <div key={cat}>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                    {catLabels[cat] ?? cat}
                  </h3>
                  <div className="space-y-2">
                    {items.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedServico(s);
                          setStep(2);
                        }}
                        className="flex w-full items-center justify-between rounded-lg border border-stone-200 p-3 text-left hover:border-stone-300 hover:bg-stone-50 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-stone-800">{s.nome}</div>
                          {s.descricao && (
                            <div className="mt-0.5 text-xs text-stone-400">{s.descricao}</div>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-xs text-stone-500">
                            <Clock className="h-3 w-3" />
                            <span>{s.duracao_minutos} {t.min}</span>
                          </div>
                        </div>
                        <div className="text-sm font-semibold" style={{ color: "var(--salon-primary)" }}>
                          {formatPrice(s.preco_base, moeda)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Professional */}
        {step === 2 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-stone-800">{t.step2Title}</h2>
            <div className="space-y-2">
              {/* No preference option */}
              <button
                onClick={() => {
                  setSelectedProfissional(null);
                  setStep(3);
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-stone-200 p-3 text-left hover:border-stone-300 hover:bg-stone-50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-stone-800">{t.anyone}</div>
                  <div className="text-xs text-stone-400">{t.anyoneDesc}</div>
                </div>
              </button>

              {availableProfessionals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProfissional(p);
                    setStep(3);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg border border-stone-200 p-3 text-left hover:border-stone-300 hover:bg-stone-50 transition-colors"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: p.cor_agenda }}
                  >
                    {p.nome.charAt(0)}
                  </div>
                  <div className="font-medium text-stone-800">{p.nome}</div>
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setStep(1)} className="mt-4 w-full">
              <ChevronLeft className="mr-1 h-4 w-4" /> {t.back}
            </Button>
          </div>
        )}

        {/* STEP 3: Date & Time */}
        {step === 3 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-stone-800">{t.step3Title}</h2>

            <div className="space-y-4">
              <div>
                <Input
                  type="date"
                  min={minDate}
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>

              {selectedDate && loadingSlots && (
                <p className="text-center text-sm text-stone-400">{t.loadingSlots}</p>
              )}

              {selectedDate && !loadingSlots && availableSlots.length === 0 && (
                <p className="text-center text-sm text-stone-400">{t.noSlots}</p>
              )}

              {selectedDate && !loadingSlots && availableSlots.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => {
                        setSelectedTime(slot);
                        setStep(4);
                      }}
                      className={`rounded-lg border p-2 text-sm font-medium transition-colors ${
                        selectedTime === slot
                          ? "border-transparent text-white"
                          : "border-stone-200 text-stone-700 hover:bg-stone-50"
                      }`}
                      style={
                        selectedTime === slot
                          ? { backgroundColor: "var(--salon-primary)" }
                          : undefined
                      }
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="outline" onClick={() => setStep(2)} className="mt-4 w-full">
              <ChevronLeft className="mr-1 h-4 w-4" /> {t.back}
            </Button>
          </div>
        )}

        {/* STEP 4: Client Data */}
        {step === 4 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-stone-800">{t.step4Title}</h2>
            <div className="space-y-3">
              <Input
                placeholder={t.name}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <Input
                placeholder={t.phone}
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
              <Input
                placeholder={t.email}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                <ChevronLeft className="mr-1 h-4 w-4" /> {t.back}
              </Button>
              <Button
                onClick={() => setStep(5)}
                disabled={!nome || !telefone}
                className="flex-1 text-white"
                style={{ backgroundColor: "var(--salon-primary)" }}
              >
                {t.next}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Confirmation */}
        {step === 5 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-stone-800">{t.step5Title}</h2>
            <div className="space-y-3 rounded-lg bg-stone-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">{t.service}</span>
                <span className="font-medium text-stone-800">{selectedServico?.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t.professional}</span>
                <span className="font-medium text-stone-800">
                  {selectedProfissional?.nome ?? t.anyone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t.dateTime}</span>
                <span className="font-medium text-stone-800">
                  {selectedDate} {selectedTime}
                </span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-2">
                <span className="text-stone-500">{t.price}</span>
                <span className="text-lg font-bold" style={{ color: "var(--salon-primary)" }}>
                  {formatPrice(finalPrice, moeda)}
                </span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                <ChevronLeft className="mr-1 h-4 w-4" /> {t.back}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 text-white"
                style={{ backgroundColor: "var(--salon-primary)" }}
              >
                {isLoading ? t.creating : t.confirm}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
