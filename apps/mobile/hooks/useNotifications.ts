import Constants from "expo-constants";
import * as Device from "expo-device";
import { useEffect } from "react";
import { Platform } from "react-native";
import {
  configureNotificationHandler,
  getExpoPushToken,
  getNotificationPermissionStatus,
  requestNotificationPermission,
  setDefaultAndroidNotificationChannel,
} from "../utils/notifications";
import { supabase } from "../utils/supabase";

export function useNotifications(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    configureNotificationHandler();
    registerPushToken(userId);
  }, [userId]);
}

async function registerPushToken(userId: string) {
  // Push notifications don't work on simulators
  if (!Device.isDevice) return;

  try {
    await setDefaultAndroidNotificationChannel();

    const existingStatus = await getNotificationPermissionStatus();
    if (!existingStatus) return;

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const requestedStatus = await requestNotificationPermission();
      if (!requestedStatus) return;
      finalStatus = requestedStatus;
    }

    if (finalStatus !== "granted") return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId as string | undefined;

    const token = await getExpoPushToken(projectId);
    if (!token) return;

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
