import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

const TIME_ZONE = "Asia/Kuala_Lumpur";
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return dateTimeFormatter.format(new Date(isoString));
}

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setNotifications([]);
      return;
    }

    const { data } = await supabase
      .from("notifications")
      .select("id, title, body, read, created_at")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifications(data ?? []);
  }, []);

  const markAllRead = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", authData.user.id)
      .eq("read", false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const load = async () => {
        setIsLoading(true);
        await fetchNotifications();
        if (isMounted) {
          setIsLoading(false);
          markAllRead();
          Notifications.setBadgeCountAsync(0);
        }
      };

      load();

      return () => {
        isMounted = false;
      };
    }, [fetchNotifications, markAllRead]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mx-5 mt-3 flex-row justify-between items-center">
          <View>
            <Text className="text-3xl mt-1 font-semibold text-slate-900">
              Notifications
            </Text>
            <Text className="text-slate-600 text-base mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </Text>
          </View>
          {isLoading && <ActivityIndicator size="small" color="#0f172a" />}
        </View>

        <View className="mx-5 mt-6 gap-3">
          {!isLoading && notifications.length === 0 ? (
            <View className="rounded-3xl border border-dashed border-slate-200 bg-white p-6">
              <Text className="text-slate-600 text-base">
                No notifications yet.
              </Text>
            </View>
          ) : null}

          {notifications.map((item) => (
            <View
              key={item.id}
              className={`rounded-3xl border p-5 ${
                item.read
                  ? "bg-white border-slate-200"
                  : "bg-white border-slate-900"
              }`}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    {!item.read && (
                      <View className="h-2 w-2 rounded-full bg-slate-900" />
                    )}
                    <Text
                      className={`text-base font-semibold ${
                        item.read ? "text-slate-700" : "text-slate-900"
                      }`}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <Text className="mt-1 text-sm text-slate-500 leading-5">
                    {item.body}
                  </Text>
                </View>
              </View>
              <Text className="mt-3 text-xs text-slate-400">
                {timeAgo(item.created_at)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
