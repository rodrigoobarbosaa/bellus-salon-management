import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";

const BG = "#faf8f5";
const CARD = "#ffffff";
const GOLD = bellusGold;
const DARK = bellusDark;
const MUTED = "#8a7c6e";
const BORDER = "#ede8e3";
const GOLD_LIGHT = "#f7f0e6";

interface Service {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco_base: number;
}

interface Professional {
  id: string;
  nome: string;
}

function StepIndicator({ step }: { step: number }) {
  const steps = [
    i18n.t("booking.service"),
    i18n.t("booking.professional"),
    i18n.t("booking.date"),
    i18n.t("booking.time"),
  ];
  return (
    <View style={si.row}>
      {steps.map((label, idx) => {
        const num = idx + 1;
        const done = step > num;
        const active = step === num;
        return (
          <View key={num} style={si.stepWrap}>
            <View style={[si.circle, done && si.circleDone, active && si.circleActive]}>
              {done ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={[si.circleText, active && si.circleTextActive]}>{num}</Text>
              )}
            </View>
            <Text style={[si.label, active && si.labelActive]} numberOfLines={1}>
              {label}
            </Text>
            {idx < steps.length - 1 && (
              <View style={[si.line, step > num && si.lineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const si = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  stepWrap: { flex: 1, alignItems: "center", position: "relative" },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0ece8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e0dbd6",
  },
  circleActive: { borderColor: GOLD, backgroundColor: GOLD_LIGHT },
  circleDone: { backgroundColor: GOLD, borderColor: GOLD },
  circleText: { fontSize: 12, fontWeight: "700", color: "#aaa" },
  circleTextActive: { color: GOLD },
  label: { fontSize: 10, color: "#bbb", marginTop: 4, textAlign: "center" },
  labelActive: { color: GOLD, fontWeight: "600" },
  line: {
    position: "absolute",
    top: 13,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: "#e8e3de",
  },
  lineDone: { backgroundColor: GOLD },
});

function SectionHeader({ num, title }: { num: number; title: string }) {
  return (
    <View style={sh.row}>
      <View style={sh.badge}>
        <Text style={sh.badgeText}>{num}</Text>
      </View>
      <Text style={sh.title}>{title}</Text>
    </View>
  );
}

const sh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 14, marginTop: 6 },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DARK,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  badgeText: { color: GOLD, fontSize: 12, fontWeight: "700" },
  title: { fontSize: 16, fontWeight: "700", color: DARK, letterSpacing: 0.3 },
});

export default function BookScreen() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [salaoId, setSalaoId] = useState<string | null>(null);
  const [salaoNome, setSalaoNome] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [busySlots, setBusySlots] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) { setLoading(false); return; }

        const { data: cliente } = await supabase
          .from("clientes").select("salao_id").eq("email", user.email).single();

        const sid = cliente?.salao_id;
        if (!sid) { setLoading(false); return; }
        setSalaoId(sid);

        const { data: salao } = await supabase.from("saloes").select("nome").eq("id", sid).single();
        setSalaoNome(salao?.nome ?? "");

        const { data: svcs } = await supabase
          .from("servicos").select("id, nome, duracao_minutos, preco_base")
          .eq("salao_id", sid).eq("ativo", true).order("nome");
        setServices(svcs ?? []);

        const { data: profs } = await supabase
          .from("profissionais").select("id, nome")
          .eq("salao_id", sid).eq("ativo", true).order("nome");
        setProfessionals(profs ?? []);
      } catch (err) {
        console.error("Error loading booking data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const loadSlots = useCallback(async () => {
    if (!salaoId || !selectedDate || !selectedService) return;
    try {
      let query = supabase
        .from("agendamentos").select("data_hora_inicio")
        .eq("salao_id", salaoId)
        .gte("data_hora_inicio", `${selectedDate}T00:00:00`)
        .lt("data_hora_inicio", `${selectedDate}T23:59:59`)
        .neq("status", "cancelado");

      if (selectedProfessional?.id) {
        query = query.eq("profissional_id", selectedProfessional.id);
      }

      const { data } = await query;
      const busy = (data ?? []).map((a: { data_hora_inicio: string }) => {
        const d = new Date(a.data_hora_inicio);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      });
      setBusySlots(busy);
    } catch {
      setBusySlots([]);
    }
  }, [salaoId, selectedDate, selectedService, selectedProfessional]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  const timeSlots = Array.from({ length: 22 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const min = (i % 2) * 30;
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }).filter((t) => !busySlots.includes(t));

  const handleConfirm = async () => {
    if (!salaoId || !selectedService || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data: cliente } = await supabase
        .from("clientes").select("id").eq("email", user.email).single();

      if (!cliente?.id) { Alert.alert("Error", i18n.t("booking.error")); return; }

      const inicio = new Date(`${selectedDate}T${selectedTime}:00`);
      const fim = new Date(inicio.getTime() + selectedService.duracao_minutos * 60 * 1000);
      const profId = selectedProfessional?.id ?? professionals[0]?.id;

      if (!profId) { Alert.alert("Error", i18n.t("booking.error")); return; }

      const { error } = await supabase.from("agendamentos").insert({
        salao_id: salaoId,
        cliente_id: cliente.id,
        profissional_id: profId,
        servico_id: selectedService.id,
        data_hora_inicio: inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
        status: "pendente",
      });

      if (error) { Alert.alert("Error", i18n.t("booking.error")); return; }

      Alert.alert("Bellus ✓", i18n.t("booking.success"));
      setStep(1);
      setSelectedService(null);
      setSelectedProfessional(null);
      setSelectedDate("");
      setSelectedTime("");
    } catch {
      Alert.alert("Error", i18n.t("booking.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={GOLD} />
        <Text style={styles.loadingText}>Bellus</Text>
      </View>
    );
  }

  const dateObj = selectedDate ? new Date(selectedDate + "T12:00:00") : null;
  const dateDisplay = dateObj
    ? dateObj.toLocaleDateString(i18n.locale, { weekday: "long", day: "numeric", month: "long" })
    : null;

  return (
    <View style={styles.root}>
      {/* Step indicator */}
      <StepIndicator step={step} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Salon name */}
        {salaoNome ? (
          <View style={styles.salonBadge}>
            <Ionicons name="location-outline" size={13} color={GOLD} />
            <Text style={styles.salonName}>{salaoNome}</Text>
          </View>
        ) : null}

        {/* STEP 1 — Service */}
        <View style={styles.section}>
          <SectionHeader num={1} title={i18n.t("booking.selectService")} />
          {services.map((svc) => {
            const selected = selectedService?.id === svc.id;
            return (
              <TouchableOpacity
                key={svc.id}
                style={[styles.serviceCard, selected && styles.serviceCardActive]}
                onPress={() => { setSelectedService(svc); if (step < 2) setStep(2); }}
                activeOpacity={0.75}
              >
                <View style={styles.serviceLeft}>
                  <View style={[styles.serviceIcon, selected && styles.serviceIconActive]}>
                    <Ionicons name="cut-outline" size={18} color={selected ? "#fff" : MUTED} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.serviceName, selected && styles.serviceNameActive]}>
                      {svc.nome}
                    </Text>
                    <View style={styles.serviceMeta}>
                      <View style={styles.metaTag}>
                        <Ionicons name="time-outline" size={11} color={MUTED} />
                        <Text style={styles.metaTagText}>{svc.duracao_minutos} min</Text>
                      </View>
                      <View style={[styles.metaTag, styles.metaTagGold]}>
                        <Text style={styles.metaTagGoldText}>{svc.preco_base} €</Text>
                      </View>
                    </View>
                  </View>
                </View>
                {selected && <Ionicons name="checkmark-circle" size={22} color={GOLD} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* STEP 2 — Professional */}
        {step >= 2 && (
          <View style={styles.section}>
            <SectionHeader num={2} title={i18n.t("booking.selectProfessional")} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profRow}>
              {/* Any professional */}
              <TouchableOpacity
                style={[styles.profCard, !selectedProfessional && styles.profCardActive]}
                onPress={() => { setSelectedProfessional(null); if (step < 3) setStep(3); }}
              >
                <View style={[styles.profAvatar, !selectedProfessional && styles.profAvatarActive]}>
                  <Ionicons name="people-outline" size={20} color={!selectedProfessional ? "#fff" : MUTED} />
                </View>
                <Text style={[styles.profName, !selectedProfessional && styles.profNameActive]}>
                  {i18n.t("booking.any")}
                </Text>
              </TouchableOpacity>

              {professionals.map((prof) => {
                const selected = selectedProfessional?.id === prof.id;
                return (
                  <TouchableOpacity
                    key={prof.id}
                    style={[styles.profCard, selected && styles.profCardActive]}
                    onPress={() => { setSelectedProfessional(prof); if (step < 3) setStep(3); }}
                  >
                    <View style={[styles.profAvatar, selected && styles.profAvatarActive]}>
                      <Text style={[styles.profAvatarText, selected && styles.profAvatarTextActive]}>
                        {prof.nome.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.profName, selected && styles.profNameActive]} numberOfLines={1}>
                      {prof.nome.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* STEP 3 — Date */}
        {step >= 3 && (
          <View style={styles.section}>
            <SectionHeader num={3} title={i18n.t("booking.selectDate")} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateRow}>
              {dates.map((d, idx) => {
                const dateObj = new Date(d + "T12:00:00");
                const dayName = dateObj.toLocaleDateString(i18n.locale, { weekday: "short" });
                const dayNum = dateObj.getDate();
                const monthName = dateObj.toLocaleDateString(i18n.locale, { month: "short" });
                const isToday = idx === 0;
                const selected = selectedDate === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dateCard, selected && styles.dateCardActive]}
                    onPress={() => { setSelectedDate(d); setSelectedTime(""); if (step < 4) setStep(4); }}
                  >
                    {isToday && <View style={styles.todayDot} />}
                    <Text style={[styles.dateDayName, selected && styles.dateTextActive]}>
                      {dayName.toUpperCase()}
                    </Text>
                    <Text style={[styles.dateDayNum, selected && styles.dateTextActive]}>
                      {dayNum}
                    </Text>
                    <Text style={[styles.dateMonth, selected && styles.dateTextActive]}>
                      {monthName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* STEP 4 — Time */}
        {step >= 4 && selectedDate && (
          <View style={styles.section}>
            <SectionHeader num={4} title={i18n.t("booking.selectTime")} />
            {timeSlots.length === 0 ? (
              <View style={styles.noSlotsBox}>
                <Ionicons name="calendar-clear-outline" size={32} color="#ccc" />
                <Text style={styles.noSlots}>{i18n.t("booking.noSlots")}</Text>
              </View>
            ) : (
              <View style={styles.timeGrid}>
                {timeSlots.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                    onPress={() => setSelectedTime(t)}
                  >
                    <Text style={[styles.timeText, selectedTime === t && styles.timeTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Summary + Confirm */}
        {selectedService && selectedDate && selectedTime && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>{i18n.t("booking.summary")}</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="cut-outline" size={15} color={MUTED} />
              <Text style={styles.summaryText}>{selectedService.nome}</Text>
            </View>
            {selectedProfessional && (
              <View style={styles.summaryRow}>
                <Ionicons name="person-outline" size={15} color={MUTED} />
                <Text style={styles.summaryText}>{selectedProfessional.nome}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={15} color={MUTED} />
              <Text style={styles.summaryText}>{dateDisplay}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="time-outline" size={15} color={MUTED} />
              <Text style={styles.summaryText}>{selectedTime}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Ionicons name="pricetag-outline" size={15} color={GOLD} />
              <Text style={[styles.summaryText, { color: DARK, fontWeight: "700" }]}>
                {selectedService.preco_base} € · {selectedService.duracao_minutos} min
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={DARK} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={DARK} />
                  <Text style={styles.confirmText}>{i18n.t("booking.confirm")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG },
  loadingText: { color: GOLD, fontSize: 18, fontWeight: "700", letterSpacing: 3, marginTop: 16 },

  salonBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginBottom: 20,
  },
  salonName: { fontSize: 13, color: MUTED, fontWeight: "500" },

  section: { marginBottom: 28 },

  // Service cards
  serviceCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: CARD, borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 2, borderColor: "transparent",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  serviceCardActive: { borderColor: GOLD, backgroundColor: GOLD_LIGHT },
  serviceLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  serviceIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#f0ece8", justifyContent: "center", alignItems: "center",
  },
  serviceIconActive: { backgroundColor: GOLD },
  serviceName: { fontSize: 15, fontWeight: "600", color: DARK, marginBottom: 6 },
  serviceNameActive: { color: DARK },
  serviceMeta: { flexDirection: "row", gap: 8, alignItems: "center" },
  metaTag: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#f0ece8", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  metaTagText: { fontSize: 11, color: MUTED, fontWeight: "500" },
  metaTagGold: { backgroundColor: GOLD_LIGHT },
  metaTagGoldText: { fontSize: 11, color: GOLD, fontWeight: "700" },

  // Professional cards
  profRow: { marginBottom: 4 },
  profCard: {
    alignItems: "center", marginRight: 14, paddingVertical: 10, paddingHorizontal: 6,
    minWidth: 72,
  },
  profCardActive: {},
  profAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#f0ece8", justifyContent: "center", alignItems: "center",
    borderWidth: 2.5, borderColor: "transparent",
    marginBottom: 6,
  },
  profAvatarActive: { borderColor: GOLD, backgroundColor: GOLD_LIGHT },
  profAvatarText: { fontSize: 20, fontWeight: "700", color: MUTED },
  profAvatarTextActive: { color: GOLD },
  profName: { fontSize: 12, color: "#999", fontWeight: "500", textAlign: "center" },
  profNameActive: { color: GOLD, fontWeight: "700" },

  // Date picker
  dateRow: { marginBottom: 4 },
  dateCard: {
    alignItems: "center", backgroundColor: CARD, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 14, marginRight: 10,
    borderWidth: 2, borderColor: "transparent",
    minWidth: 58,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  dateCardActive: { borderColor: GOLD, backgroundColor: GOLD_LIGHT },
  todayDot: {
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: GOLD,
    position: "absolute", top: 7,
  },
  dateDayName: { fontSize: 10, fontWeight: "600", color: "#bbb", letterSpacing: 0.5 },
  dateDayNum: { fontSize: 22, fontWeight: "800", color: DARK, lineHeight: 28 },
  dateMonth: { fontSize: 10, color: MUTED },
  dateTextActive: { color: GOLD },

  // Time grid
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeChip: {
    backgroundColor: CARD, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 2, borderColor: "transparent",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  timeChipActive: { borderColor: GOLD, backgroundColor: GOLD_LIGHT },
  timeText: { fontSize: 14, color: DARK, fontWeight: "500" },
  timeTextActive: { color: GOLD, fontWeight: "700" },
  noSlotsBox: { alignItems: "center", paddingVertical: 24, gap: 8 },
  noSlots: { color: "#bbb", fontSize: 14 },

  // Summary
  summaryBox: {
    backgroundColor: CARD, borderRadius: 16, padding: 20,
    borderWidth: 1.5, borderColor: BORDER, marginBottom: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  summaryTitle: { fontSize: 13, fontWeight: "700", color: MUTED, letterSpacing: 1, marginBottom: 14, textTransform: "uppercase" },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  summaryText: { fontSize: 14, color: "#555", flex: 1 },
  summaryDivider: { height: 1, backgroundColor: BORDER, marginVertical: 10 },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: GOLD, borderRadius: 14, padding: 16, marginTop: 8, gap: 8,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: { color: DARK, fontSize: 16, fontWeight: "800", letterSpacing: 0.5 },
});
