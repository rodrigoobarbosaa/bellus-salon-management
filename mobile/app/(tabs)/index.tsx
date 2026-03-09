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
import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";

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

export default function BookScreen() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [salaoId, setSalaoId] = useState<string | null>(null);
  const [salaoNome, setSalaoNome] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessional, setSelectedProfessional] =
    useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [busySlots, setBusySlots] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.email) {
          setLoading(false);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;

        const { data: cliente } = await sb
          .from("clientes")
          .select("salao_id")
          .eq("email", user.email)
          .single();

        const sid = cliente?.salao_id;
        if (!sid) { setLoading(false); return; }
        setSalaoId(sid);

        const { data: salao } = await sb
          .from("saloes")
          .select("nome")
          .eq("id", sid)
          .single();

        setSalaoNome(salao?.nome ?? "");

        const { data: svcs } = await sb
          .from("servicos")
          .select("id, nome, duracao_minutos, preco_base")
          .eq("salao_id", sid)
          .eq("ativo", true)
          .order("nome");

        setServices(svcs ?? []);

        const { data: profs } = await sb
          .from("profissionais")
          .select("id, nome")
          .eq("salao_id", sid)
          .eq("ativo", true)
          .order("nome");

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;
      let query = sb
        .from("agendamentos")
        .select("data_hora_inicio")
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

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      const { data: cliente } = await sb
        .from("clientes")
        .select("id")
        .eq("email", user.email)
        .single();

      if (!cliente?.id) {
        Alert.alert("Error", i18n.t("booking.error"));
        return;
      }

      const inicio = new Date(`${selectedDate}T${selectedTime}:00`);
      const fim = new Date(inicio.getTime() + selectedService.duracao_minutos * 60 * 1000);
      const profId = selectedProfessional?.id ?? professionals[0]?.id;

      if (!profId) {
        Alert.alert("Error", i18n.t("booking.error"));
        return;
      }

      const { error } = await sb.from("agendamentos").insert({
        salao_id: salaoId,
        cliente_id: cliente.id,
        profissional_id: profId,
        servico_id: selectedService.id,
        data_hora_inicio: inicio.toISOString(),
        data_hora_fim: fim.toISOString(),
        status: "pendente",
      });

      if (error) {
        Alert.alert("Error", i18n.t("booking.error"));
        return;
      }

      Alert.alert("Bellus", i18n.t("booking.success"));
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
        <ActivityIndicator size="large" color={bellusGold} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{i18n.t("booking.title")}</Text>
      {salaoNome ? <Text style={styles.salonName}>{salaoNome}</Text> : null}

      <Text style={styles.stepLabel}>1. {i18n.t("booking.selectService")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {services.map((svc) => (
          <TouchableOpacity
            key={svc.id}
            style={[styles.chip, selectedService?.id === svc.id && styles.chipActive]}
            onPress={() => { setSelectedService(svc); if (step < 2) setStep(2); }}
          >
            <Text style={[styles.chipText, selectedService?.id === svc.id && styles.chipTextActive]}>
              {svc.nome}
            </Text>
            <Text style={styles.chipMeta}>{svc.duracao_minutos}min - {svc.preco_base}EUR</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {step >= 2 && (
        <>
          <Text style={styles.stepLabel}>2. {i18n.t("booking.selectProfessional")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, !selectedProfessional && styles.chipActive]}
              onPress={() => { setSelectedProfessional(null); if (step < 3) setStep(3); }}
            >
              <Text style={[styles.chipText, !selectedProfessional && styles.chipTextActive]}>
                {i18n.t("booking.any")}
              </Text>
            </TouchableOpacity>
            {professionals.map((prof) => (
              <TouchableOpacity
                key={prof.id}
                style={[styles.chip, selectedProfessional?.id === prof.id && styles.chipActive]}
                onPress={() => { setSelectedProfessional(prof); if (step < 3) setStep(3); }}
              >
                <Text style={[styles.chipText, selectedProfessional?.id === prof.id && styles.chipTextActive]}>
                  {prof.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {step >= 3 && (
        <>
          <Text style={styles.stepLabel}>3. {i18n.t("booking.selectDate")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {dates.map((d) => {
              const dateObj = new Date(d + "T12:00:00");
              const dayName = dateObj.toLocaleDateString(i18n.locale, { weekday: "short" });
              const dayNum = dateObj.getDate();
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.dateChip, selectedDate === d && styles.chipActive]}
                  onPress={() => { setSelectedDate(d); setSelectedTime(""); if (step < 4) setStep(4); }}
                >
                  <Text style={[styles.dayName, selectedDate === d && styles.chipTextActive]}>{dayName}</Text>
                  <Text style={[styles.dayNum, selectedDate === d && styles.chipTextActive]}>{dayNum}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}

      {step >= 4 && selectedDate && (
        <>
          <Text style={styles.stepLabel}>4. {i18n.t("booking.selectTime")}</Text>
          {timeSlots.length === 0 ? (
            <Text style={styles.noSlots}>{i18n.t("booking.noSlots")}</Text>
          ) : (
            <View style={styles.timeGrid}>
              {timeSlots.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeChip, selectedTime === t && styles.chipActive]}
                  onPress={() => setSelectedTime(t)}
                >
                  <Text style={[styles.chipText, selectedTime === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {selectedService && selectedDate && selectedTime && (
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={bellusDark} />
          ) : (
            <Text style={styles.confirmText}>{i18n.t("booking.confirm")}</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: bellusDark, marginBottom: 4 },
  salonName: { fontSize: 14, color: "#999", marginBottom: 24 },
  stepLabel: { fontSize: 14, fontWeight: "600", color: "#666", marginTop: 20, marginBottom: 10 },
  chipRow: { flexDirection: "row", marginBottom: 4 },
  chip: {
    backgroundColor: "#f5f5f5", borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 12, marginRight: 10, borderWidth: 2, borderColor: "transparent",
  },
  chipActive: { borderColor: bellusGold, backgroundColor: "#fdf8ef" },
  chipText: { fontSize: 14, color: "#333" },
  chipTextActive: { color: bellusGold, fontWeight: "600" },
  chipMeta: { fontSize: 11, color: "#999", marginTop: 2 },
  dateChip: {
    backgroundColor: "#f5f5f5", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, marginRight: 10, alignItems: "center", borderWidth: 2, borderColor: "transparent",
  },
  dayName: { fontSize: 11, color: "#999", textTransform: "uppercase" },
  dayNum: { fontSize: 18, fontWeight: "bold", color: "#333" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeChip: {
    backgroundColor: "#f5f5f5", borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: 10, borderWidth: 2, borderColor: "transparent",
  },
  noSlots: { color: "#999", fontStyle: "italic", marginTop: 8 },
  confirmBtn: { backgroundColor: bellusGold, borderRadius: 14, padding: 18, alignItems: "center", marginTop: 30 },
  buttonDisabled: { opacity: 0.6 },
  confirmText: { color: bellusDark, fontSize: 16, fontWeight: "bold" },
});
