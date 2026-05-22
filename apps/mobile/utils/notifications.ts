import Constants from "expo-constants";
import { Platform } from "react-native";

type ExpoNotificationsModule = typeof import("expo-notifications");

const isAndroidExpoGo =
  Platform.OS === "android" && Constants.executionEnvironment === "storeClient";

let notificationsPromise: Promise<ExpoNotificationsModule | null> | null = null;
let notificationHandlerConfigured = false;

async function getNotificationsModule() {
  if (isAndroidExpoGo) {
    return null;
  }

  notificationsPromise ??= import("expo-notifications").catch((error) => {
    console.warn("Notifications unavailable in this environment:", error);
    return null;
  });

  return notificationsPromise;
}

export async function configureNotificationHandler() {
  if (notificationHandlerConfigured) {
    return;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  notificationHandlerConfigured = true;
}

export async function clearNotificationBadge() {
  const Notifications = await getNotificationsModule();
  await Notifications?.setBadgeCountAsync(0).catch(() => null);
}

export async function getExpoPushToken(projectId?: string) {
  const Notifications = await getNotificationsModule();
  const tokenData = await Notifications?.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  ).catch(() => null);

  return tokenData?.data ?? null;
}

export async function getNotificationPermissionStatus() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestNotificationPermission() {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return null;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status;
}

export async function setDefaultAndroidNotificationChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function scheduleAppointmentReminder(
  serviceName: string,
  reminderTime: Date,
) {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Appointment reminder",
      body: `Your ${serviceName} is in 1 hour. Get ready!`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime,
    },
  });
}
