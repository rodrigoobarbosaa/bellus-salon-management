import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import i18n from "@/lib/i18n";
import { bellusGold, bellusDark } from "@/constants/Colors";

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    } catch {
      Alert.alert("Error", i18n.t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) return;

    if (password !== confirmPassword) {
      Alert.alert("Error", i18n.t("auth.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", i18n.t("auth.passwordTooShort"));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            phone: phone.trim(),
          },
        },
      });
      if (error) throw error;

      // If email confirmation is disabled, session is returned immediately
      if (data.session) {
        // Logged in automatically — auth listener will redirect
        return;
      }

      // Email confirmation required
      Alert.alert("Bellus", i18n.t("auth.registerSuccess"));
      setMode("login");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? i18n.t("auth.registerError"));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>Bellus</Text>
        <Text style={styles.subtitle}>
          {mode === "login" ? i18n.t("auth.login") : i18n.t("auth.register")}
        </Text>

        {mode === "register" && (
          <>
            <TextInput
              style={styles.input}
              placeholder={i18n.t("auth.name")}
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <TextInput
              style={styles.input}
              placeholder={i18n.t("auth.phone")}
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder={i18n.t("auth.email")}
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder={i18n.t("auth.password")}
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {mode === "register" && (
          <TextInput
            style={styles.input}
            placeholder={i18n.t("auth.confirmPassword")}
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={mode === "login" ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={bellusDark} />
          ) : (
            <Text style={styles.buttonText}>
              {mode === "login" ? i18n.t("auth.login") : i18n.t("auth.register")}
            </Text>
          )}
        </TouchableOpacity>

        {mode === "login" && (
          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.forgotText}>
              {i18n.t("auth.forgotPassword")}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.switchLink} onPress={switchMode}>
          <Text style={styles.switchText}>
            {mode === "login"
              ? i18n.t("auth.noAccount")
              : i18n.t("auth.hasAccount")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: bellusDark },
  inner: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: bellusGold,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#2a2a4a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    marginBottom: 16,
  },
  button: {
    backgroundColor: bellusGold,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: bellusDark, fontSize: 16, fontWeight: "bold" },
  forgotLink: { marginTop: 16, alignItems: "center" },
  forgotText: { color: bellusGold, fontSize: 14 },
  switchLink: { marginTop: 24, alignItems: "center" },
  switchText: { color: "#aaa", fontSize: 14 },
});
