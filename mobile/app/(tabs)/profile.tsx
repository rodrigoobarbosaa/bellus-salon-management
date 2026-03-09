import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
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
  const [phone, setPhone] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.locale);
  const [pushEnabled, setPushEnabled] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
        const { data: cliente } = await sb
          .from("clientes")
          .select("id, nome, telefone")
          .eq("email", user.email)
          .single();
        setName(cliente?.nome ?? "");
        setPhone(cliente?.telefone ?? "");
        setClienteId(cliente?.id ?? null);
      }
    }
    load();
  }, []);

  const handleSaveProfile = async () => {
    if (!clienteId) return;
    setSaving(true);
    try {
      const { error } = await sb
        .from("clientes")
        .update({ nome: name.trim(), telefone: phone.trim() })
        .eq("id", clienteId);
      if (error) throw error;
      setEditing(false);
      Alert.alert("Bellus", i18n.t("profile.saved"));
    } catch {
      Alert.alert("Error", i18n.t("profile.saveError"));
    } finally {
      setSaving(false);
    }
  };

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
        {editing ? (
          <>
            <Text style={styles.sectionTitle}>{i18n.t("auth.name")}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={i18n.t("auth.name")}
              placeholderTextColor="#999"
            />
            <Text style={styles.sectionTitle}>{i18n.t("profile.phone")}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={i18n.t("profile.phone")}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
            <View style={styles.editBtnRow}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{i18n.t("profile.save")}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelEditText}>{i18n.t("common.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.name}>{name || email}</Text>
            {phone ? <Text style={styles.phoneText}>{phone}</Text> : null}
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.editHint}>{i18n.t("profile.editProfile")}</Text>
          </TouchableOpacity>
        )}
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
  input: {
    borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12,
    fontSize: 16, color: bellusDark, marginBottom: 12, backgroundColor: "#fafafa",
  },
  editBtnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  saveBtn: {
    backgroundColor: bellusGold, borderRadius: 10, paddingHorizontal: 20,
    paddingVertical: 10, alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  cancelEditBtn: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  cancelEditText: { color: "#999", fontSize: 14 },
  phoneText: { fontSize: 14, color: "#666", marginTop: 2 },
  editHint: { fontSize: 12, color: bellusGold, marginTop: 6 },
});
