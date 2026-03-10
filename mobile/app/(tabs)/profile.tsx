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
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { supabase } from "@/lib/supabase";

type IoniconsName = ComponentProps<typeof Ionicons>["name"];
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";
import { registerForPushNotifications, sendTokenToServer } from "@/lib/push";

const BG = "#faf8f5";
const CARD = "#ffffff";
const GOLD = bellusGold;
const DARK = bellusDark;
const MUTED = "#8a7c6e";
const BORDER = "#ede8e3";

const LANGUAGES = [
  { code: "pt", label: "PT", full: "Português" },
  { code: "es", label: "ES", full: "Español" },
  { code: "en", label: "EN", full: "English" },
  { code: "ru", label: "RU", full: "Русский" },
];

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  danger,
}: {
  icon: IoniconsName;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={0.7}
    >
      <View style={[styles.settingsIcon, danger && styles.settingsIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? "#ef4444" : MUTED} />
      </View>
      <Text style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}>{label}</Text>
      <View style={styles.settingsRight}>
        {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
        {rightElement ?? (onPress ? <Ionicons name="chevron-forward" size={16} color="#ccc" /> : null)}
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.locale);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
        const { data: cliente } = await supabase
          .from("clientes").select("id, nome, telefone").eq("email", user.email).single();
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
      const { error } = await supabase
        .from("clientes").update({ nome: name.trim(), telefone: phone.trim() }).eq("id", clienteId);
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
        if (ok) setPushEnabled(true);
        else Alert.alert("Error", i18n.t("profile.pushError"));
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
        onPress: async () => { await supabase.auth.signOut(); },
      },
    ]);
  };

  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : email.charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent}>
      {/* Avatar header */}
      <View style={styles.header}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.inputLabel}>{i18n.t("auth.name")}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={i18n.t("auth.name")}
              placeholderTextColor="#bbb"
            />
            <Text style={styles.inputLabel}>{i18n.t("profile.phone")}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={i18n.t("profile.phone")}
              placeholderTextColor="#bbb"
              keyboardType="phone-pad"
            />
            <View style={styles.editBtns}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.saveBtnText}>{i18n.t("profile.save")}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>{i18n.t("common.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name || "—"}</Text>
            {phone ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={13} color={MUTED} />
                <Text style={styles.infoText}>{phone}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={13} color={MUTED} />
              <Text style={styles.infoText}>{email}</Text>
            </View>
            <TouchableOpacity style={styles.editProfileBtn} onPress={() => setEditing(true)}>
              <Ionicons name="pencil-outline" size={13} color={GOLD} />
              <Text style={styles.editProfileText}>{i18n.t("profile.editProfile")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Language section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{i18n.t("profile.language")}</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => {
            const active = currentLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langChip, active && styles.langChipActive]}
                onPress={() => changeLang(lang.code)}
              >
                <Text style={[styles.langCode, active && styles.langCodeActive]}>
                  {lang.label}
                </Text>
                <Text style={[styles.langFull, active && styles.langFullActive]}>
                  {lang.full}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Settings section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{i18n.t("profile.notifications")}</Text>
        <SettingsRow
          icon="notifications-outline"
          label={i18n.t("profile.notifications")}
          rightElement={
            <Switch
              value={pushEnabled}
              onValueChange={togglePush}
              trackColor={{ true: GOLD, false: "#ddd" }}
              thumbColor="#fff"
            />
          }
        />
        <SettingsRow
          icon="information-circle-outline"
          label={i18n.t("profile.version")}
          value="1.0.0"
        />
      </View>

      {/* Logout */}
      <View style={styles.sectionCard}>
        <SettingsRow
          icon="log-out-outline"
          label={i18n.t("auth.logout")}
          onPress={handleLogout}
          danger
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 40 },

  // Header / Avatar
  header: {
    backgroundColor: CARD,
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 16,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: GOLD,
    padding: 4,
    marginBottom: 14,
  },
  avatar: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: DARK,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: GOLD, fontSize: 26, fontWeight: "800" },
  profileInfo: { alignItems: "center", gap: 4 },
  profileName: { fontSize: 22, fontWeight: "800", color: DARK, marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoText: { fontSize: 13, color: MUTED },
  editProfileBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    marginTop: 12, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: GOLD,
  },
  editProfileText: { fontSize: 13, color: GOLD, fontWeight: "600" },

  // Edit form
  editForm: { width: "100%", marginTop: 4 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: MUTED, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, padding: 12,
    fontSize: 15, color: DARK, marginBottom: 14, backgroundColor: BG,
  },
  editBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  saveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: GOLD, borderRadius: 12, paddingVertical: 12,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cancelBtn: {
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: BORDER,
  },
  cancelBtnText: { color: MUTED, fontSize: 14 },

  // Section cards
  sectionCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: "700", color: MUTED,
    letterSpacing: 1, textTransform: "uppercase",
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },

  // Language
  langRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 8, flexWrap: "wrap" },
  langChip: {
    alignItems: "center", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, backgroundColor: BG,
    minWidth: 64,
  },
  langChipActive: { borderColor: GOLD, backgroundColor: "#f7f0e6" },
  langCode: { fontSize: 13, fontWeight: "800", color: MUTED },
  langCodeActive: { color: GOLD },
  langFull: { fontSize: 10, color: "#bbb", marginTop: 1 },
  langFullActive: { color: GOLD },

  // Settings rows
  settingsRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#f5f0ea",
  },
  settingsIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#f5f0ea", justifyContent: "center", alignItems: "center",
    marginRight: 12,
  },
  settingsIconDanger: { backgroundColor: "#fef2f2" },
  settingsLabel: { flex: 1, fontSize: 15, color: DARK },
  settingsLabelDanger: { color: "#ef4444" },
  settingsRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  settingsValue: { fontSize: 14, color: MUTED },
});
