import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";
import { registerForPushNotifications, sendTokenToServer } from "@/lib/push";

const LANGUAGES = [
  { code: "pt", label: "Portugues" },
  { code: "es", label: "Espanol" },
  { code: "en", label: "English" },
  { code: "ru", label: "Russkiy" },
];

export default function ProfileScreen() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [currentLang, setCurrentLang] = useState(i18n.locale);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: cliente } = await (supabase as any)
          .from("clientes")
          .select("nome")
          .eq("email", user.email)
          .single();
        setName(cliente?.nome ?? "");
      }
    }
    load();
  }, []);

  const changeLang = (code: string) => {
    i18n.locale = code;
    setCurrentLang(code);
  };

  const togglePush = async () => {
    if (!pushEnabled) {
      const token = await registerForPushNotifications();
      if (token) {
        const ok = await sendTokenToServer(token);
        if (ok) {
          setPushEnabled(true);
        } else {
          Alert.alert("Error", i18n.t("profile.pushError"));
        }
      } else {
        Alert.alert("Bellus", i18n.t("profile.pushDenied"));
      }
    } else {
      setPushEnabled(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(i18n.t("auth.logout"), "", [
      { text: i18n.t("common.cancel"), style: "cancel" },
      {
        text: i18n.t("auth.logout"),
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("profile.title")}</Text>

      <View style={styles.section}>
        <Text style={styles.name}>{name || email}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t("profile.language")}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langChip, currentLang === lang.code && styles.langChipActive]}
              onPress={() => changeLang(lang.code)}
            >
              <Text style={[styles.langText, currentLang === lang.code && styles.langTextActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>{i18n.t("profile.notifications")}</Text>
        <Switch
          value={pushEnabled}
          onValueChange={togglePush}
          trackColor={{ true: bellusGold, false: "#ccc" }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>{i18n.t("profile.version")}</Text>
        <Text style={styles.rowValue}>1.0.0</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{i18n.t("auth.logout")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: bellusDark, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 10 },
  name: { fontSize: 20, fontWeight: "600", color: bellusDark },
  email: { fontSize: 14, color: "#999", marginTop: 2 },
  langRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  langChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#f5f5f5" },
  langChipActive: { backgroundColor: bellusGold },
  langText: { fontSize: 14, color: "#666" },
  langTextActive: { color: "#fff", fontWeight: "600" },
  row: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
  },
  rowLabel: { fontSize: 16, color: "#333" },
  rowValue: { fontSize: 14, color: "#999" },
  logoutBtn: {
    marginTop: 40, borderWidth: 1, borderColor: "#ef4444",
    borderRadius: 12, padding: 16, alignItems: "center",
  },
  logoutText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
});
