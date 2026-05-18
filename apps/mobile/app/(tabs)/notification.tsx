import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
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

const CARD_HEIGHT = 80;

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
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mx-5 mt-3 flex-row justify-between items-center">
          <View>
            <Text className="text-3xl mt-1 font-semibold text-neutral-900">
              Notifications
            </Text>
            <Text className="text-neutral-500 text-base mt-1">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </Text>
          </View>
          {isLoading && <ActivityIndicator size="small" color="#171717" />}
        </View>

        <View className="mx-5 mt-6 gap-3">
          {!isLoading && notifications.length === 0 ? (
            <View className="rounded-3xl border border-dashed border-neutral-200 bg-white p-6">
              <Text className="text-neutral-500 text-base">
                No notifications yet.
              </Text>
            </View>
          ) : null}

          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  style={{ height: CARD_HEIGHT }}
                  className="rounded-3xl border border-neutral-200 bg-white px-5 justify-center gap-2"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="h-4 w-2/5 rounded-full bg-neutral-100" />
                    <View className="h-3 w-12 rounded-full bg-neutral-100" />
                  </View>
                  <View className="h-3 w-3/4 rounded-full bg-neutral-100" />
                </View>
              ))
            : null}

          {notifications.map((item) => (
            <ReanimatedSwipeable
              key={item.id}
              renderRightActions={(_progress, _translation, _swipeable) => (
                <TouchableOpacity
                  style={{ height: CARD_HEIGHT }}
                  className="justify-center items-center bg-red-500 rounded-3xl w-20 ml-2"
                  onPress={() => deleteNotification(item.id)}
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-xs font-semibold">
                    Delete
                  </Text>
                </TouchableOpacity>
              )}
              onSwipeableOpen={(direction: string) => {
                if (direction === "left") deleteNotification(item.id);
              }}
              rightThreshold={80}
              overshootRight={false}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelected(item)}
                style={{ height: CARD_HEIGHT }}
                className={`rounded-3xl border overflow-hidden flex-row ${
                  item.read
                    ? "bg-white border-neutral-200"
                    : "bg-neutral-50 border-neutral-200"
                }`}
              >
                {!item.read && (
                  <View className="w-1 bg-neutral-900 self-stretch" />
                )}
                <View className="flex-1 px-5 justify-center">
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
                  <Text
                    numberOfLines={1}
                    className="mt-1 text-sm text-neutral-500"
                  >
                    {item.body}
                  </Text>
                </View>
              </TouchableOpacity>
            </ReanimatedSwipeable>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={selected !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <View
            className="flex-1 bg-neutral-50"
            style={{ paddingTop: insets.top }}
          >
            <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-neutral-100">
              <Text className="text-lg font-semibold text-neutral-900 flex-1 mr-4">
                {selected.title}
              </Text>
              <TouchableOpacity
                onPress={() => setSelected(null)}
                className="bg-neutral-100 rounded-full px-4 py-1.5"
                activeOpacity={0.7}
              >
                <Text className="text-sm font-medium text-neutral-600">
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <Text className="text-sm text-neutral-400 mb-4">
                {dateTimeFormatter.format(new Date(selected.created_at))}
              </Text>
              <Text className="text-base text-neutral-700 leading-7">
                {selected.body}
              </Text>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}
