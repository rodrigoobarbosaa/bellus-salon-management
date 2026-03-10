import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 48) / 3;

interface PortfolioPhoto {
  id: string;
  url: string;
  descricao: string | null;
  profissional_nome: string;
  servico_nome: string | null;
}

interface Review {
  id: string;
  nota: number;
  comentario: string | null;
  created_at: string;
  cliente_nome: string;
  profissional_nome: string;
  servico_nome: string | null;
}

interface FavProfessional {
  id: string;
  profissional_id: string;
  nome: string;
  servicos_count: number;
  avg_rating: number;
  isFav: boolean;
}

type Tab = "gallery" | "reviews" | "favorites";

export default function ExploreScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("gallery");
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorites, setFavorites] = useState<FavProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salaoId, setSalaoId] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);


  useEffect(() => {
    async function getSalao() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const { data: cliente } = await supabase
        .from("clientes")
        .select("id, salao_id")
        .eq("email", user.email)
        .single();
      if (cliente?.salao_id) {
        setSalaoId(cliente.salao_id);
        setClienteId(cliente.id);
      }
    }
    getSalao();
  }, []);

  const loadData = useCallback(async () => {
    if (!salaoId) return;
    try {
      if (tab === "gallery") {
        const { data } = await supabase
          .from("portfolio_fotos")
          .select("id, url, descricao, profissional:profissionais(nome), servico:servicos(nome)")
          .eq("salao_id", salaoId)
          .order("created_at", { ascending: false })
          .limit(60);

        setPhotos(
          (data ?? []).map((p: any) => ({
            id: p.id,
            url: p.url,
            descricao: p.descricao,
            profissional_nome: p.profissional?.nome ?? "",
            servico_nome: p.servico?.nome ?? null,
          }))
        );
      } else if (tab === "reviews") {
        const { data } = await supabase
          .from("avaliacoes")
          .select("id, nota, comentario, created_at, cliente:clientes(nome), profissional:profissionais(nome), agendamento:agendamentos(servico:servicos(nome))")
          .eq("salao_id", salaoId)
          .order("created_at", { ascending: false })
          .limit(50);

        const mapped: Review[] = (data ?? []).map((r: any) => ({
          id: r.id,
          nota: r.nota,
          comentario: r.comentario,
          created_at: r.created_at,
          cliente_nome: r.cliente?.nome ?? i18n.t("explore.anonymous"),
          profissional_nome: r.profissional?.nome ?? "",
          servico_nome: r.agendamento?.servico?.nome ?? null,
        }));

        setReviews(mapped);

        // Calculate average
        if (mapped.length > 0) {
          const sum = mapped.reduce((acc, r) => acc + r.nota, 0);
          setAvgRating(sum / mapped.length);
          setTotalReviews(mapped.length);
        }
      } else if (tab === "favorites") {
        await loadFavorites();
      }
    } catch (err) {
      console.error("Error loading explore data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [salaoId, tab]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const loadFavorites = async () => {
    if (!salaoId || !clienteId) return;

    // Run 3 queries in parallel instead of 4 sequential full-table scans.
    // servicos_profissionais is now filtered by salao profissionais only.
    const [profsResult, favsResult, ratingsResult] = await Promise.all([
      supabase.from("profissionais")
        .select("id, nome, servicos_profissionais(count)")
        .eq("salao_id", salaoId)
        .eq("ativo", true),
      supabase.from("favoritos")
        .select("profissional_id")
        .eq("cliente_id", clienteId),
      supabase.from("avaliacoes")
        .select("profissional_id, nota")
        .eq("salao_id", salaoId),
    ]);

    const favIds = new Set(
      (favsResult.data ?? []).map((f: any) => f.profissional_id as string)
    );

    const ratingMap: Record<string, { sum: number; count: number }> = {};
    (ratingsResult.data ?? []).forEach((r: any) => {
      if (!r.profissional_id) return;
      if (!ratingMap[r.profissional_id]) ratingMap[r.profissional_id] = { sum: 0, count: 0 };
      ratingMap[r.profissional_id].sum += r.nota;
      ratingMap[r.profissional_id].count += 1;
    });

    setFavorites(
      (profsResult.data ?? []).map((p: any) => ({
        id: p.id,
        profissional_id: p.id,
        nome: p.nome,
        servicos_count: p.servicos_profissionais?.[0]?.count ?? 0,
        avg_rating: ratingMap[p.id]
          ? ratingMap[p.id].sum / ratingMap[p.id].count
          : 0,
        isFav: favIds.has(p.id),
      }))
    );
  };

  const toggleFavorite = async (profId: string) => {
    if (!clienteId) return;
    const current = favorites.find(f => f.profissional_id === profId);
    if (!current) return;
    if (current.isFav) {
      await supabase.from("favoritos").delete()
        .eq("cliente_id", clienteId).eq("profissional_id", profId);
    } else {
      await supabase.from("favoritos")
        .insert({ cliente_id: clienteId, profissional_id: profId });
    }
    setFavorites(prev =>
      prev.map(f => f.profissional_id === profId ? { ...f, isFav: !f.isFav } : f)
    );
  };

  const renderStars = (rating: number, size = 16) => {
    return (
      <View style={{ flexDirection: "row", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={size}
            color={star <= rating ? bellusGold : "#ddd"}
          />
        ))}
      </View>
    );
  };

  const renderPhoto = ({ item }: { item: PortfolioPhoto }) => (
    <View style={styles.photoCard}>
      <Image source={{ uri: item.url }} style={styles.photoImg} />
      {item.profissional_nome ? (
        <Text style={styles.photoCaption} numberOfLines={1}>
          {item.profissional_nome}
          {item.servico_nome ? ` \u2022 ${item.servico_nome}` : ""}
        </Text>
      ) : null}
    </View>
  );

  const renderFavorite = ({ item }: { item: FavProfessional }) => (
    <TouchableOpacity
      style={styles.favCard}
      onPress={() =>
        router.push({
          pathname: "/professional",
          params: { profissionalId: item.profissional_id, nome: item.nome, salaoId: salaoId ?? "" },
        })
      }
    >
      <View style={styles.favAvatar}>
        <Text style={styles.favAvatarText}>{item.nome.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.favInfo}>
        <Text style={styles.favName}>{item.nome}</Text>
        <Text style={styles.favMeta}>
          {item.servicos_count} {i18n.t("explore.services")}
          {item.avg_rating > 0 ? ` \u2022 ${item.avg_rating.toFixed(1)} \u2605` : ""}
        </Text>
      </View>
      <TouchableOpacity style={styles.heartBtn} onPress={() => toggleFavorite(item.profissional_id)}>
        <Ionicons
          name={item.isFav ? "heart" : "heart-outline"}
          size={22}
          color={item.isFav ? "#e74c3c" : "#ccc"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderReview = ({ item }: { item: Review }) => {
    const date = new Date(item.created_at).toLocaleDateString(i18n.locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewName}>{item.cliente_nome}</Text>
            <Text style={styles.reviewDate}>{date}</Text>
          </View>
          {renderStars(item.nota)}
        </View>
        {item.profissional_nome ? (
          <Text style={styles.reviewProfessional}>
            {item.profissional_nome}
            {item.servico_nome ? ` \u2022 ${item.servico_nome}` : ""}
          </Text>
        ) : null}
        {item.comentario ? (
          <Text style={styles.reviewComment}>{item.comentario}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("explore.title")}</Text>

      {tab === "reviews" && totalReviews > 0 && (
        <View style={styles.ratingOverview}>
          <Text style={styles.ratingBig}>{avgRating.toFixed(1)}</Text>
          {renderStars(Math.round(avgRating), 22)}
          <Text style={styles.ratingCount}>
            {totalReviews} {i18n.t("explore.reviewCount")}
          </Text>
        </View>
      )}

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "gallery" && styles.tabActive]}
          onPress={() => setTab("gallery")}
        >
          <Text style={[styles.tabText, tab === "gallery" && styles.tabTextActive]}>
            {i18n.t("explore.gallery")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "reviews" && styles.tabActive]}
          onPress={() => setTab("reviews")}
        >
          <Text style={[styles.tabText, tab === "reviews" && styles.tabTextActive]}>
            {i18n.t("explore.reviews")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "favorites" && styles.tabActive]}
          onPress={() => setTab("favorites")}
        >
          <Text style={[styles.tabText, tab === "favorites" && styles.tabTextActive]}>
            {i18n.t("explore.favorites")}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={bellusGold} />
        </View>
      ) : tab === "gallery" ? (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={renderPhoto}
          numColumns={3}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              tintColor={bellusGold}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{i18n.t("explore.noPhotos")}</Text>
          }
        />
      ) : tab === "reviews" ? (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReview}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              tintColor={bellusGold}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{i18n.t("explore.noReviews")}</Text>
          }
        />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderFavorite}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              tintColor={bellusGold}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{i18n.t("explore.noFavorites")}</Text>
          }
        />
      )}
    </View>
  );
}

const BG = "#faf8f5";
const CARD = "#ffffff";
const GOLD = bellusGold;
const DARK = bellusDark;
const MUTED = "#8a7c6e";
const BORDER = "#ede8e3";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  title: { fontSize: 22, fontWeight: "800", color: DARK, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4, letterSpacing: 0.5 },
  ratingOverview: {
    alignItems: "center", paddingVertical: 16, marginHorizontal: 20, marginBottom: 8,
    backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER,
  },
  ratingBig: { fontSize: 40, fontWeight: "800", color: DARK, lineHeight: 46 },
  ratingCount: { fontSize: 12, color: MUTED, marginTop: 4 },
  tabRow: {
    flexDirection: "row", marginHorizontal: 20, marginBottom: 14,
    backgroundColor: CARD, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: BORDER,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  tabActive: { backgroundColor: DARK },
  tabText: { fontSize: 13, color: MUTED, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  grid: { paddingHorizontal: 12, paddingBottom: 20 },
  photoCard: { margin: 3, width: PHOTO_SIZE },
  photoImg: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 10, backgroundColor: "#ede8e3" },
  photoCaption: { fontSize: 9, color: MUTED, marginTop: 3, textAlign: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  reviewCard: {
    backgroundColor: CARD, borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  reviewName: { fontSize: 15, fontWeight: "700", color: DARK },
  reviewDate: { fontSize: 11, color: MUTED, marginTop: 2 },
  reviewProfessional: { fontSize: 12, color: GOLD, marginTop: 8, fontWeight: "600" },
  reviewComment: { fontSize: 14, color: "#555", marginTop: 8, lineHeight: 20 },
  empty: { textAlign: "center", color: "#bbb", marginTop: 60, fontSize: 14 },
  favCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: CARD,
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  favAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: DARK,
    justifyContent: "center", alignItems: "center", marginRight: 14,
  },
  favAvatarText: { color: GOLD, fontSize: 18, fontWeight: "800" },
  favInfo: { flex: 1 },
  favName: { fontSize: 15, fontWeight: "700", color: DARK },
  favMeta: { fontSize: 12, color: MUTED, marginTop: 3 },
  heartBtn: { padding: 8 },
});
