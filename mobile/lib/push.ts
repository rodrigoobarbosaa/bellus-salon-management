import * as Notifications from "expo-notifications";
import * as Device from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import { API_BASE_URL } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.default.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Bellus",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: Device.default.expoConfig?.extra?.eas?.projectId,
  });

  return tokenData.data;
}

export async function sendTokenToServer(pushToken: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: cliente } = await (supabase as any)
      .from("clientes")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!cliente?.id) return false;

    const res = await fetch(`${API_BASE_URL}/api/push/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteId: cliente.id,
        pushToken,
        platform: Platform.OS,
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("Error sending push token:", err);
    return false;
  }
}
