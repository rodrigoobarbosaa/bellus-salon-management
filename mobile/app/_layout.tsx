import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export { ErrorBoundary } from "expo-router";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (error) console.warn("Font loading error:", error);
  }, [error]);

  useEffect(() => {
    if (loaded || error) {
      if (Platform.OS !== "web") {
        SplashScreen.hideAsync();
      }
    }
  }, [loaded, error]);

  if (!loaded && !error && Platform.OS !== "web") return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!navigationState?.key) return;

    const inAuthGroup = segments[0] === "login";

    if (!session && !inAuthGroup) {
      router.replace("/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, ready, navigationState?.key]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="review" options={{ presentation: "modal" }} />
      <Stack.Screen name="reschedule" options={{ presentation: "modal" }} />
    </Stack>
  );
}
