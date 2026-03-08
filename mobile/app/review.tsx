import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";

export default function ReviewScreen() {
  const { agendamentoId, servicoNome, profissionalNome, salaoId } =
    useLocalSearchParams<{
      agendamentoId: string;
      servicoNome: string;
      profissionalNome: string;
      salaoId: string;
    }>();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Bellus", i18n.t("review.selectRating"));
      return;
    }

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

      if (!cliente?.id) return;

      // Get agendamento details for profissional_id
      const { data: agendamento } = await sb
        .from("agendamentos")
        .select("profissional_id")
        .eq("id", agendamentoId)
        .single();

      const { error } = await sb.from("avaliacoes").insert({
        salao_id: salaoId,
        cliente_id: cliente.id,
        profissional_id: agendamento?.profissional_id ?? null,
        agendamento_id: agendamentoId,
        nota: rating,
        comentario: comment.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          Alert.alert("Bellus", i18n.t("review.alreadyReviewed"));
        } else {
          Alert.alert("Error", i18n.t("review.error"));
        }
        return;
      }

      Alert.alert("Bellus", i18n.t("review.success"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", i18n.t("review.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>{"\u2190"} {i18n.t("common.cancel")}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{i18n.t("review.title")}</Text>
        <Text style={styles.subtitle}>{servicoNome}</Text>
        {profissionalNome ? (
          <Text style={styles.profName}>{profissionalNome}</Text>
        ) : null}

        <Text style={styles.label}>{i18n.t("review.howWasIt")}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={[styles.star, star <= rating && styles.starActive]}>
                {"\u2605"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && (
          <Text style={styles.ratingLabel}>
            {[
              "",
              i18n.t("review.rating1"),
              i18n.t("review.rating2"),
              i18n.t("review.rating3"),
              i18n.t("review.rating4"),
              i18n.t("review.rating5"),
            ][rating]}
          </Text>
        )}

        <Text style={styles.label}>{i18n.t("review.comment")}</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder={i18n.t("review.commentPlaceholder")}
          placeholderTextColor="#999"
          value={comment}
          onChangeText={setComment}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={bellusDark} />
          ) : (
            <Text style={styles.submitText}>{i18n.t("review.submit")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 16, color: bellusGold },
  title: { fontSize: 24, fontWeight: "bold", color: bellusDark },
  subtitle: { fontSize: 16, color: "#666", marginTop: 4 },
  profName: { fontSize: 14, color: bellusGold, marginTop: 2 },
  label: { fontSize: 14, fontWeight: "600", color: "#666", marginTop: 28, marginBottom: 12 },
  starsRow: { flexDirection: "row", justifyContent: "center", gap: 12 },
  star: { fontSize: 44, color: "#ddd" },
  starActive: { color: bellusGold },
  ratingLabel: { textAlign: "center", fontSize: 14, color: bellusGold, marginTop: 8, fontWeight: "500" },
  input: {
    backgroundColor: "#f5f5f5", borderRadius: 12, padding: 16, fontSize: 15,
    color: "#333", minHeight: 100,
  },
  submitBtn: {
    backgroundColor: bellusGold, borderRadius: 14, padding: 18,
    alignItems: "center", marginTop: 30,
  },
  btnDisabled: { opacity: 0.6 },
  submitText: { color: bellusDark, fontSize: 16, fontWeight: "bold" },
});
