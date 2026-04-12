import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";
import { supabase } from "../utils/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    registerPushToken(userId);
  }, [userId]);
}

async function registerPushToken(userId: string) {
  // Push notifications don't work on simulators
  if (!Device.isDevice) return;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    await supabase.from("device_tokens").upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS,
      },
      { onConflict: "user_id,token" }
    );
  } catch (err) {
    // Push notifications not supported in this environment (e.g. Expo Go SDK 53+)
    console.warn("Push token registration skipped:", err);
  }
}
