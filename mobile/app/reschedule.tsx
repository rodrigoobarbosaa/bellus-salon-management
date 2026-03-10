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
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";

export default function RescheduleScreen() {
  const { agendamentoId, salaoId, servicoDuracao } = useLocalSearchParams<{
    agendamentoId: string;
    salaoId: string;
    servicoDuracao: string;
  }>();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const loadSlots = useCallback(async () => {
    if (!salaoId || !selectedDate) return;
    try {
      const { data } = await supabase
        .from("agendamentos")
        .select("data_hora_inicio")
        .eq("salao_id", salaoId)
        .gte("data_hora_inicio", `${selectedDate}T00:00:00`)
        .lt("data_hora_inicio", `${selectedDate}T23:59:59`)
        .neq("status", "cancelado")
        .neq("id", agendamentoId);

      const busy = (data ?? []).map((a: { data_hora_inicio: string }) => {
        const d = new Date(a.data_hora_inicio);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      });
      setBusySlots(busy);
    } catch {
      setBusySlots([]);
    }
  }, [salaoId, selectedDate, agendamentoId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const timeSlots = Array.from({ length: 22 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const min = (i % 2) * 30;
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }).filter((t) => !busySlots.includes(t));

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime || !agendamentoId) return;
    setSubmitting(true);
    try {
      const duracao = parseInt(servicoDuracao || "60", 10);
      const inicio = new Date(`${selectedDate}T${selectedTime}:00`);
      const fim = new Date(inicio.getTime() + duracao * 60 * 1000);

      const { error } = await supabase
        .from("agendamentos")
        .update({
          data_hora_inicio: inicio.toISOString(),
          data_hora_fim: fim.toISOString(),
          status: "pendente",
        })
        .eq("id", agendamentoId);

      if (error) throw error;

      Alert.alert("Bellus", i18n.t("appointments.rescheduleSuccess"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", i18n.t("appointments.rescheduleError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{i18n.t("appointments.reschedule")}</Text>

      <Text style={styles.stepLabel}>1. {i18n.t("booking.selectDate")}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {dates.map((d) => {
          const dateObj = new Date(d + "T12:00:00");
          const dayName = dateObj.toLocaleDateString(i18n.locale, { weekday: "short" });
          const dayNum = dateObj.getDate();
          return (
            <TouchableOpacity
              key={d}
              style={[styles.dateChip, selectedDate === d && styles.chipActive]}
              onPress={() => { setSelectedDate(d); setSelectedTime(""); }}
            >
              <Text style={[styles.dayName, selectedDate === d && styles.chipTextActive]}>{dayName}</Text>
              <Text style={[styles.dayNum, selectedDate === d && styles.chipTextActive]}>{dayNum}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {selectedDate && (
        <>
          <Text style={styles.stepLabel}>2. {i18n.t("booking.selectTime")}</Text>
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

      {selectedDate && selectedTime && (
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.buttonDisabled]}
          onPress={handleReschedule}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={bellusDark} />
          ) : (
            <Text style={styles.confirmText}>{i18n.t("appointments.reschedule")}</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>{i18n.t("common.cancel")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "bold", color: bellusDark, marginBottom: 20 },
  stepLabel: { fontSize: 14, fontWeight: "600", color: "#666", marginTop: 20, marginBottom: 10 },
  chipRow: { flexDirection: "row", marginBottom: 4 },
  dateChip: {
    backgroundColor: "#f5f5f5", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, marginRight: 10, alignItems: "center", borderWidth: 2, borderColor: "transparent",
  },
  chipActive: { borderColor: bellusGold, backgroundColor: "#fdf8ef" },
  chipText: { fontSize: 14, color: "#333" },
  chipTextActive: { color: bellusGold, fontWeight: "600" },
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
  backBtn: { alignItems: "center", marginTop: 16 },
  backText: { color: "#999", fontSize: 14 },
});
