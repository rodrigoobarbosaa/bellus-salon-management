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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  useEffect(() => {
    async function getSalao() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const { data: cliente } = await sb
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
        const { data } = await sb
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
        const { data } = await sb
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
    const { data: profs } = await sb
      .from("profissionais").select("id, nome")
      .eq("salao_id", salaoId).eq("ativo", true);
    const { data: favs } = await sb
      .from("favoritos").select("profissional_id")
      .eq("cliente_id", clienteId);
    const favIds = new Set((favs ?? []).map((f: any) => f.profissional_id));
    const { data: svcCounts } = await sb
      .from("servicos_profissionais").select("profissional_id");
    const countMap: Record<string, number> = {};
    (svcCounts ?? []).forEach((s: any) => {
      countMap[s.profissional_id] = (countMap[s.profissional_id] || 0) + 1;
    });
    const { data: ratings } = await sb
      .from("avaliacoes").select("profissional_id, nota").eq("salao_id", salaoId);
    const ratingMap: Record<string, { sum: number; count: number }> = {};
    (ratings ?? []).forEach((r: any) => {
      if (!r.profissional_id) return;
      if (!ratingMap[r.profissional_id]) ratingMap[r.profissional_id] = { sum: 0, count: 0 };
      ratingMap[r.profissional_id].sum += r.nota;
      ratingMap[r.profissional_id].count += 1;
    });
    setFavorites((profs ?? []).map((p: any) => ({
      id: p.id, profissional_id: p.id, nome: p.nome,
      servicos_count: countMap[p.id] || 0,
      avg_rating: ratingMap[p.id] ? ratingMap[p.id].sum / ratingMap[p.id].count : 0,
      isFav: favIds.has(p.id),
    })));
  };

  const toggleFavorite = async (profId: string) => {
    if (!clienteId) return;
    const current = favorites.find(f => f.profissional_id === profId);
    if (!current) return;
    if (current.isFav) {
      await sb.from("favoritos").delete()
        .eq("cliente_id", clienteId).eq("profissional_id", profId);
    } else {
      await sb.from("favoritos")
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
          <Text key={star} style={{ fontSize: size, color: star <= rating ? bellusGold : "#ddd" }}>
            {"\u2605"}
          </Text>
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
    <View style={styles.favCard}>
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
        <Text style={{ fontSize: 22, color: item.isFav ? "#e74c3c" : "#ccc" }}>
          {item.isFav ? "\u2764" : "\u2661"}
        </Text>
      </TouchableOpacity>
    </View>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", color: bellusDark, padding: 20, paddingBottom: 12 },
  ratingOverview: { alignItems: "center", paddingBottom: 16 },
  ratingBig: { fontSize: 36, fontWeight: "bold", color: bellusDark },
  ratingCount: { fontSize: 13, color: "#999", marginTop: 4 },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 12, gap: 10 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f5f5f5" },
  tabActive: { backgroundColor: bellusGold },
  tabText: { fontSize: 14, color: "#666" },
  tabTextActive: { color: "#fff", fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  grid: { paddingHorizontal: 12 },
  photoCard: { margin: 4, width: PHOTO_SIZE },
  photoImg: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 8, backgroundColor: "#f0f0f0" },
  photoCaption: { fontSize: 10, color: "#999", marginTop: 4, textAlign: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  reviewCard: {
    backgroundColor: "#fafafa", borderRadius: 12, padding: 16, marginBottom: 10,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  reviewName: { fontSize: 15, fontWeight: "600", color: bellusDark },
  reviewDate: { fontSize: 12, color: "#999", marginTop: 2 },
  reviewProfessional: { fontSize: 13, color: bellusGold, marginTop: 8, fontWeight: "500" },
  reviewComment: { fontSize: 14, color: "#444", marginTop: 8, lineHeight: 20 },
  empty: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 14 },
  favCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fafafa",
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  favAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: bellusGold,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  favAvatarText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  favInfo: { flex: 1 },
  favName: { fontSize: 15, fontWeight: "600", color: bellusDark },
  favMeta: { fontSize: 12, color: "#999", marginTop: 2 },
  heartBtn: { padding: 8 },
});
