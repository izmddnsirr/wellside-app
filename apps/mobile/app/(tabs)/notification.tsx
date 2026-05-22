import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationListSkeleton } from "../../components/booking-skeletons";
import { clearNotificationBadge } from "../../utils/notifications";
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
  const [selected, setSelected] = useState<Notification | null>(null);

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

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notifications").delete().eq("id", id);
  }, []);

  const clearAll = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;
    setNotifications([]);
    await supabase.from("notifications").delete().eq("user_id", authData.user.id);
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
          clearNotificationBadge();
        }
      };

      load();

      // Realtime subscription — auto refresh when new notification arrives
      const channel = supabase
        .channel("notifications-tab")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          () => {
            if (isMounted) {
              fetchNotifications().then(() => {
                markAllRead();
                clearNotificationBadge();
              });
            }
          }
        )
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }, [fetchNotifications, markAllRead]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  }, [fetchNotifications]);

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View className="mx-5 mt-3 flex-row justify-between items-center">
          <View>
            <Text className="text-3xl mt-1 font-semibold text-neutral-900">
              Notifications
            </Text>
          </View>
          {!isLoading && notifications.length > 0 ? (
            <TouchableOpacity
              onPress={clearAll}
              className="bg-white px-4 py-3 rounded-full flex-row items-center border border-neutral-200"
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#171717" />
              <Text className="font-semibold text-neutral-900 ml-2">Clear all</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="mx-5 mt-6 gap-3">
          {!isLoading && notifications.length === 0 ? (
            <View className="min-h-[270px] items-center justify-center rounded-[28px] border border-dashed border-neutral-300 bg-neutral-50 px-6">
              <Ionicons name="notifications-outline" size={42} color="#171717" />
              <Text className="mt-5 text-center text-base text-neutral-600">
                No notifications yet.
              </Text>
            </View>
          ) : null}

          {isLoading ? <NotificationListSkeleton /> : null}

          {notifications.map((item) => (
            <View
              key={item.id}
              className="flex-row items-stretch gap-2"
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelected(item)}
                className={`flex-1 rounded-3xl border overflow-hidden flex-row ${
                  item.read ? "bg-white border-neutral-200" : "bg-neutral-50 border-neutral-200"
                }`}
              >
                {!item.read && (
                  <View className="w-1 bg-neutral-900 self-stretch" />
                )}
                <View className="flex-1 px-5 py-4">
                  <View className="flex-row items-center justify-between gap-3">
                    <Text
                      numberOfLines={1}
                      className={`flex-1 text-base font-semibold ${
                        item.read ? "text-neutral-600" : "text-neutral-900"
                      }`}
                    >
                      {item.title}
                    </Text>
                    <Text className="text-xs text-neutral-400 shrink-0">
                      {timeAgo(item.created_at)}
                    </Text>
                  </View>
                  <Text numberOfLines={1} className="mt-1 text-sm text-neutral-500">
                    {item.body}
                  </Text>
                </View>
              </TouchableOpacity>
              <View className="justify-center">
                <TouchableOpacity
                  className="h-12 w-12 justify-center items-center bg-red-500 rounded-full"
                  onPress={() => deleteNotification(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={selected !== null}
        animationType="none"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <View className="flex-1 bg-white" style={{ paddingTop: 20 }}>
            <View className="flex-row items-center justify-end px-5 pb-5">
              <TouchableOpacity
                onPress={() => setSelected(null)}
                className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100"
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color="#404040" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-2xl font-bold text-neutral-900 leading-tight">
                {selected.title}
              </Text>
              <Text className="text-xs text-neutral-400 mt-2">
                {dateTimeFormatter.format(new Date(selected.created_at))}
              </Text>
              <View className="h-px bg-neutral-100 my-5" />
              <Text className="text-base text-neutral-600 leading-7">
                {selected.body}
              </Text>
            </ScrollView>
          </View>
        )}
      </Modal>

    </View>
  );
}
