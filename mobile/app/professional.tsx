import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";

interface ProfService {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco_base: number;
}

interface ProfReview {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  cliente_nome: string;
}

export default function ProfessionalScreen() {
  const { profissionalId, nome, salaoId } = useLocalSearchParams<{
    profissionalId: string;
    nome: string;
    salaoId: string;
  }>();
  const router = useRouter();

  const [services, setServices] = useState<ProfService[]>([]);
  const [reviews, setReviews] = useState<ProfReview[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  useEffect(() => {
    async function load() {
      try {
        // Services via junction table
        const { data: svcLinks } = await sb
          .from("servicos_profissionais")
          .select("servico:servicos(id, nome, duracao_minutos, preco_base)")
          .eq("profissional_id", profissionalId);

        const svcs: ProfService[] = (svcLinks ?? [])
          .filter((s: any) => s.servico)
          .map((s: any) => s.servico);
        setServices(svcs);

        // Reviews
        const { data: revs } = await sb
          .from("avaliacoes")
          .select("id, nota, comentario, created_at, cliente:clientes(nome)")
          .eq("profissional_id", profissionalId)
          .order("created_at", { ascending: false })
          .limit(10);

        const mapped: ProfReview[] = (revs ?? []).map((r: any) => ({
          id: r.id,
          nota: r.nota,
          comentario: r.comentario,
          created_at: r.created_at,
          cliente_nome: r.cliente?.nome ?? i18n.t("explore.anonymous"),
        }));
        setReviews(mapped);

        if (mapped.length > 0) {
          const sum = mapped.reduce((acc, r) => acc + r.nota, 0);
          setAvgRating(sum / mapped.length);
          setTotalReviews(mapped.length);
        }
      } catch (err) {
        console.error("Error loading professional:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profissionalId]);

  const renderStars = (rating: number, size = 16) => (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Text key={star} style={{ fontSize: size, color: star <= rating ? bellusGold : "#ddd" }}>
          {"\u2605"}
        </Text>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={bellusGold} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(nome ?? "P").charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{nome}</Text>
        {totalReviews > 0 && (
          <View style={styles.ratingRow}>
            {renderStars(Math.round(avgRating), 20)}
            <Text style={styles.ratingText}>
              {avgRating.toFixed(1)} ({totalReviews})
            </Text>
          </View>
        )}
      </View>

      {services.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{i18n.t("explore.professionalServices")}</Text>
          {services.map((svc) => (
            <View key={svc.id} style={styles.serviceCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{svc.nome}</Text>
                <Text style={styles.serviceMeta}>{svc.duracao_minutos}min</Text>
              </View>
              <Text style={styles.servicePrice}>{svc.preco_base}EUR</Text>
            </View>
          ))}
        </>
      )}

      {reviews.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{i18n.t("explore.professionalReviews")}</Text>
          {reviews.map((rev) => {
            const date = new Date(rev.created_at).toLocaleDateString(i18n.locale, {
              day: "numeric", month: "short",
            });
            return (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewName}>{rev.cliente_nome}</Text>
                  {renderStars(rev.nota, 14)}
                </View>
                <Text style={styles.reviewDate}>{date}</Text>
                {rev.comentario ? (
                  <Text style={styles.reviewComment}>{rev.comentario}</Text>
                ) : null}
              </View>
            );
          })}
        </>
      )}

      <TouchableOpacity
        style={styles.bookBtn}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text style={styles.bookBtnText}>
          {i18n.t("explore.bookWith")} {nome}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>{i18n.t("common.cancel")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: bellusGold,
    justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  name: { fontSize: 24, fontWeight: "bold", color: bellusDark },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  ratingText: { fontSize: 14, color: "#666" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: bellusDark, marginTop: 20, marginBottom: 12 },
  serviceCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fafafa",
    borderRadius: 10, padding: 14, marginBottom: 8,
  },
  serviceName: { fontSize: 15, fontWeight: "500", color: bellusDark },
  serviceMeta: { fontSize: 12, color: "#999", marginTop: 2 },
  servicePrice: { fontSize: 15, fontWeight: "600", color: bellusGold },
  reviewCard: { backgroundColor: "#fafafa", borderRadius: 10, padding: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewName: { fontSize: 14, fontWeight: "500", color: bellusDark },
  reviewDate: { fontSize: 11, color: "#999", marginTop: 2 },
  reviewComment: { fontSize: 13, color: "#444", marginTop: 6, lineHeight: 18 },
  bookBtn: {
    backgroundColor: bellusGold, borderRadius: 14, padding: 18,
    alignItems: "center", marginTop: 24,
  },
  bookBtnText: { color: bellusDark, fontSize: 16, fontWeight: "bold" },
  backBtn: { alignItems: "center", marginTop: 16 },
  backText: { color: "#999", fontSize: 14 },
});
