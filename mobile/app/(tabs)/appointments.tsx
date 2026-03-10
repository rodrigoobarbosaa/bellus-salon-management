import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";

const BG = "#faf8f5";
const CARD = "#ffffff";
const GOLD = bellusGold;
const DARK = bellusDark;
const MUTED = "#8a7c6e";
const BORDER = "#ede8e3";

interface Appointment {
  id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
  notas: string | null;
  servico_nome: string;
  servico_duracao: number;
  profissional_nome: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: IoniconsName }> = {
  pendente:   { color: "#f59e0b", label: "pending",   icon: "time-outline" },
  confirmado: { color: "#22c55e", label: "confirmed", icon: "checkmark-circle-outline" },
  concluido:  { color: "#6b7280", label: "completed", icon: "checkmark-done-outline" },
  cancelado:  { color: "#ef4444", label: "cancelled", icon: "close-circle-outline" },
};

export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [salaoId, setSalaoId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data: cliente } = await supabase
        .from("clientes").select("id, salao_id").eq("email", user.email).single();

      if (!cliente?.id) return;
      setSalaoId(cliente.salao_id ?? null);

      const now = new Date().toISOString();
      let query = supabase
        .from("agendamentos")
        .select("id, data_hora_inicio, data_hora_fim, status, notas, servico:servicos(nome, duracao_minutos), profissional:profissionais(nome)")
        .eq("cliente_id", cliente.id);

      if (tab === "upcoming") {
        query = query.gte("data_hora_inicio", now).neq("status", "cancelado").order("data_hora_inicio", { ascending: true });
      } else {
        query = query.lt("data_hora_inicio", now).order("data_hora_inicio", { ascending: false });
      }

      const { data } = await query.limit(50);

      type RawAppt = {
        id: string; data_hora_inicio: string; data_hora_fim: string;
        status: string; notas: string | null;
        servico: { nome: string; duracao_minutos: number } | null;
        profissional: { nome: string } | null;
      };
      const mapped: Appointment[] = ((data as RawAppt[]) ?? []).map((a) => ({
        id: a.id,
        data_hora_inicio: a.data_hora_inicio,
        data_hora_fim: a.data_hora_fim,
        status: a.status,
        notas: a.notas,
        servico_nome: a.servico?.nome ?? "—",
        servico_duracao: a.servico?.duracao_minutos ?? 60,
        profissional_nome: a.profissional?.nome ?? "—",
      }));

      setAppointments(mapped);
    } catch (err) {
      console.error("Error loading appointments:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    loadAppointments();
  }, [loadAppointments]);

  const handleCancel = (apptId: string) => {
    Alert.alert(i18n.t("appointments.cancel"), i18n.t("appointments.cancelConfirm"), [
      { text: i18n.t("appointments.no"), style: "cancel" },
      {
        text: i18n.t("appointments.yes"),
        style: "destructive",
        onPress: async () => {
          await supabase.from("agendamentos").update({ status: "cancelado" }).eq("id", apptId);
          Alert.alert("Bellus", i18n.t("appointments.cancelSuccess"));
          loadAppointments();
        },
      },
    ]);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(i18n.locale, { hour: "2-digit", minute: "2-digit" });

  const renderItem = ({ item }: { item: Appointment }) => {
    const cfg = STATUS_CONFIG[item.status] ?? { color: "#999", label: item.status, icon: "ellipse-outline" };
    const canCancel = item.status === "pendente" || item.status === "confirmado";

    return (
      <View style={[styles.card, { borderLeftColor: cfg.color }]}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View style={styles.dateBlock}>
            <Text style={styles.dateText}>{formatDate(item.data_hora_inicio)}</Text>
            <Text style={styles.timeText}>{formatTime(item.data_hora_inicio)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + "18" }]}>
            <Ionicons name={cfg.icon} size={13} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>
              {i18n.t(`appointments.status.${item.status}`)}
            </Text>
          </View>
        </View>

        {/* Service + professional */}
        <Text style={styles.serviceName}>{item.servico_nome}</Text>
        <View style={styles.profRow}>
          <Ionicons name="person-outline" size={13} color={MUTED} />
          <Text style={styles.profName}>{item.profissional_nome}</Text>
          <View style={styles.dot} />
          <Ionicons name="time-outline" size={13} color={MUTED} />
          <Text style={styles.profName}>{item.servico_duracao} min</Text>
        </View>

        {/* Actions */}
        {(canCancel && tab === "upcoming") || (item.status === "concluido" && tab === "past") ? (
          <View style={styles.actions}>
            {canCancel && tab === "upcoming" && (
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/reschedule",
                      params: {
                        agendamentoId: item.id,
                        salaoId: salaoId ?? "",
                        servicoDuracao: String(item.servico_duracao),
                      },
                    })
                  }
                >
                  <Ionicons name="calendar-outline" size={14} color={GOLD} />
                  <Text style={styles.actionBtnText}>{i18n.t("appointments.reschedule")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnDanger]}
                  onPress={() => handleCancel(item.id)}
                >
                  <Ionicons name="close-outline" size={14} color="#ef4444" />
                  <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>
                    {i18n.t("appointments.cancel")}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {item.status === "concluido" && tab === "past" && salaoId && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnReview]}
                onPress={() =>
                  router.push({
                    pathname: "/review",
                    params: {
                      agendamentoId: item.id,
                      servicoNome: item.servico_nome,
                      profissionalNome: item.profissional_nome,
                      salaoId,
                    },
                  })
                }
              >
                <Ionicons name="star-outline" size={14} color={GOLD} />
                <Text style={styles.actionBtnText}>{i18n.t("appointments.review")}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "upcoming" && styles.tabBtnActive]}
          onPress={() => setTab("upcoming")}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={tab === "upcoming" ? "#fff" : MUTED}
          />
          <Text style={[styles.tabText, tab === "upcoming" && styles.tabTextActive]}>
            {i18n.t("appointments.upcoming")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "past" && styles.tabBtnActive]}
          onPress={() => setTab("past")}
        >
          <Ionicons
            name="time-outline"
            size={16}
            color={tab === "past" ? "#fff" : MUTED}
          />
          <Text style={[styles.tabText, tab === "past" && styles.tabTextActive]}>
            {i18n.t("appointments.past")}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadAppointments(); }}
              tintColor={GOLD}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="calendar-clear-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>{i18n.t("appointments.empty")}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: CARD,
    margin: 16,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 11,
  },
  tabBtnActive: { backgroundColor: DARK },
  tabText: { fontSize: 13, fontWeight: "600", color: MUTED },
  tabTextActive: { color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: GOLD,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  dateBlock: {},
  dateText: { fontSize: 13, fontWeight: "600", color: DARK },
  timeText: { fontSize: 20, fontWeight: "800", color: DARK, lineHeight: 26 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  serviceName: { fontSize: 16, fontWeight: "700", color: DARK, marginBottom: 4 },
  profRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  profName: { fontSize: 13, color: MUTED },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#ccc" },
  actions: { flexDirection: "row", gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1.5, borderColor: GOLD, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  actionBtnText: { fontSize: 13, color: GOLD, fontWeight: "600" },
  actionBtnDanger: { borderColor: "#ef4444" },
  actionBtnTextDanger: { color: "#ef4444" },
  actionBtnReview: { borderColor: GOLD },
  emptyBox: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { color: "#bbb", fontSize: 15 },
});
