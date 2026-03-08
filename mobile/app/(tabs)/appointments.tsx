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
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";

interface Appointment {
  id: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
  notas: string | null;
  servico_nome: string;
  profissional_nome: string;
}

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sb = supabase as any;

      const { data: cliente } = await sb
        .from("clientes")
        .select("id, salao_id")
        .eq("email", user.email)
        .single();

      if (!cliente?.id) return;
      setSalaoId(cliente.salao_id ?? null);

      const now = new Date().toISOString();
      let query = sb
        .from("agendamentos")
        .select("id, data_hora_inicio, data_hora_fim, status, notas, servico:servicos(nome), profissional:profissionais(nome)")
        .eq("cliente_id", cliente.id);

      if (tab === "upcoming") {
        query = query.gte("data_hora_inicio", now).neq("status", "cancelado").order("data_hora_inicio", { ascending: true });
      } else {
        query = query.lt("data_hora_inicio", now).order("data_hora_inicio", { ascending: false });
      }

      const { data } = await query.limit(50);

      const mapped: Appointment[] = (data ?? []).map((a: any) => ({
        id: a.id,
        data_hora_inicio: a.data_hora_inicio,
        data_hora_fim: a.data_hora_fim,
        status: a.status,
        notas: a.notas,
        servico_nome: a.servico?.nome ?? "—",
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("agendamentos").update({ status: "cancelado" }).eq("id", apptId);
          Alert.alert("Bellus", i18n.t("appointments.cancelSuccess"));
          loadAppointments();
        },
      },
    ]);
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString(i18n.locale, { weekday: "short", day: "numeric", month: "short" });
    const time = d.toLocaleTimeString(i18n.locale, { hour: "2-digit", minute: "2-digit" });
    return { date, time };
  };

  const statusColor: Record<string, string> = {
    pendente: "#f59e0b",
    confirmado: "#22c55e",
    concluido: "#6b7280",
    cancelado: "#ef4444",
  };

  const renderItem = ({ item }: { item: Appointment }) => {
    const { date, time } = formatDateTime(item.data_hora_inicio);
    const canCancel = item.status === "pendente" || item.status === "confirmado";

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusColor[item.status] ?? "#999" }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{item.servico_nome}</Text>
            <Text style={styles.profName}>{item.profissional_nome}</Text>
            <Text style={styles.dateText}>{date} - {time}</Text>
            <Text style={[styles.statusText, { color: statusColor[item.status] ?? "#999" }]}>
              {i18n.t(`appointments.status.${item.status}`)}
            </Text>
          </View>
        </View>
        <View style={{ gap: 6 }}>
          {canCancel && tab === "upcoming" && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
              <Text style={styles.cancelText}>{i18n.t("appointments.cancel")}</Text>
            </TouchableOpacity>
          )}
          {item.status === "concluido" && tab === "past" && salaoId && (
            <TouchableOpacity
              style={styles.reviewBtn}
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
              <Text style={styles.reviewText}>{i18n.t("appointments.review")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("appointments.title")}</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "upcoming" && styles.tabActive]}
          onPress={() => setTab("upcoming")}
        >
          <Text style={[styles.tabText, tab === "upcoming" && styles.tabTextActive]}>
            {i18n.t("appointments.upcoming")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "past" && styles.tabActive]}
          onPress={() => setTab("past")}
        >
          <Text style={[styles.tabText, tab === "past" && styles.tabTextActive]}>
            {i18n.t("appointments.past")}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={bellusGold} />
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
              tintColor={bellusGold}
            />
          }
          ListEmptyComponent={<Text style={styles.empty}>{i18n.t("appointments.empty")}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", color: bellusDark, padding: 20, paddingBottom: 12 },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 12, gap: 10 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f5f5f5" },
  tabActive: { backgroundColor: bellusGold },
  tabText: { fontSize: 14, color: "#666" },
  tabTextActive: { color: "#fff", fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#fafafa", borderRadius: 12, padding: 16, marginBottom: 10,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  serviceName: { fontSize: 16, fontWeight: "600", color: bellusDark },
  profName: { fontSize: 13, color: "#666", marginTop: 2 },
  dateText: { fontSize: 13, color: "#999", marginTop: 2 },
  statusText: { fontSize: 12, fontWeight: "500", marginTop: 4 },
  cancelBtn: { borderWidth: 1, borderColor: "#ef4444", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  cancelText: { color: "#ef4444", fontSize: 12 },
  reviewBtn: { borderWidth: 1, borderColor: bellusGold, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  reviewText: { color: bellusGold, fontSize: 12, fontWeight: "500" },
  empty: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 14 },
});
