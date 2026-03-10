import * as Notifications from "expo-notifications";
import * as Device from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

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

  
    const { data: cliente } = await sb
      .from("clientes")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!cliente?.id) return false;

    const { error } = await sb
      .from("push_tokens")
      .upsert(
        {
          cliente_id: cliente.id,
          token: pushToken,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );

    return !error;
  } catch (err) {
    console.error("Error sending push token:", err);
    return false;
  }
}
