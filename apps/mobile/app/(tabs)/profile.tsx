import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
};

type HistoryItem = {
  id: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  serviceName: string;
  barberName: string;
  basePrice: number | null;
  status: "completed" | "cancelled" | "no_show";
};

const TIME_ZONE = "Asia/Kuala_Lumpur";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      Alert.alert(
        "Unable to load profile",
        authError?.message ?? "Please sign in again."
      );
      setProfile(null);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("first_name,last_name,email,phone")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      Alert.alert("Unable to load profile", profileError.message);
      return;
    }

    setProfile({
      id: authData.user.id,
      first_name: profileData?.first_name ?? null,
      last_name: profileData?.last_name ?? null,
      email: profileData?.email ?? authData.user.email ?? null,
      phone: profileData?.phone ?? null,
    });
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setHistory([]);
      setIsHistoryLoading(false);
      return;
    }

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("id,start_at,end_at,created_at,service_id,barber_id,status")
      .eq("customer_id", authData.user.id)
      .in("status", ["completed", "cancelled", "no_show"])
      .order("created_at", { ascending: false });

    if (bookingError) {
      setHistory([]);
      setIsHistoryLoading(false);
      setHistoryError("Unable to load booking history.");
      return;
    }

    const serviceIds = Array.from(
      new Set((bookingData ?? []).map((b) => b.service_id).filter(Boolean))
    );
    const barberIds = Array.from(
      new Set((bookingData ?? []).map((b) => b.barber_id).filter(Boolean))
    );

    const [{ data: serviceData }, { data: barberData }] = await Promise.all([
      serviceIds.length
        ? supabase
            .from("services")
            .select("id,name,base_price")
            .in("id", serviceIds)
        : Promise.resolve({ data: [] }),
      barberIds.length
        ? supabase
            .from("profiles")
            .select("id,display_name,first_name,last_name")
            .in("id", barberIds)
        : Promise.resolve({ data: [] }),
    ]);

    const serviceMap = new Map(
      (serviceData ?? []).map((service) => [service.id, service])
    );
    const barberMap = new Map(
      (barberData ?? []).map((barber) => {
        const barberName =
          barber.display_name?.trim() ||
          [barber.first_name, barber.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          "Barber";
        return [barber.id, barberName];
      })
    );

    const historyItems: HistoryItem[] = (bookingData ?? []).map((booking) => {
      const service = serviceMap.get(booking.service_id);
      return {
        id: booking.id,
        startAt: booking.start_at,
        endAt: booking.end_at,
        createdAt: booking.created_at,
        serviceName: service?.name ?? "Service",
        barberName: barberMap.get(booking.barber_id) ?? "Barber",
        basePrice: service?.base_price ?? null,
        status: booking.status,
      };
    });

    setHistory(historyItems);
    setIsHistoryLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const load = async () => {
        setIsLoading(true);
        await Promise.all([fetchProfile(), fetchHistory()]);
        if (isMounted) {
          setIsLoading(false);
        }
      };

      load();

      return () => {
        isMounted = false;
      };
    }, [fetchProfile, fetchHistory])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchProfile(), fetchHistory()]);
    setIsRefreshing(false);
  }, [fetchProfile, fetchHistory]);

  const onLogout = async () => {
    Alert.alert("Log out?", "You can sign in again anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
          if (tokenData?.data) {
            await supabase.from("device_tokens").delete().eq("token", tokenData.data);
          }
          const { error } = await supabase.auth.signOut();
          if (error) {
            Alert.alert("Logout failed", error.message);
            return;
          }
          router.replace("/(auth)/start");
        },
      },
    ]);
  };

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");
  const initials = `${profile?.first_name?.[0] ?? ""}${
    profile?.last_name?.[0] ?? ""
  }`.toUpperCase();
  const completedVisits = useMemo(
    () => history.filter((item) => item.status === "completed").length,
    [history]
  );

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Greeting Section */}
        <View className="mx-5 mt-3 flex-row justify-between items-center">
          <View>
            <Text className="text-3xl mt-1 font-semibold text-slate-900">
              Profile
            </Text>
            <Text className="text-slate-600 text-base mt-1">
              Customized your profile
            </Text>
          </View>
          <TouchableOpacity
            onPress={onLogout}
            className="bg-white px-4 py-3 rounded-full flex-row items-center border border-slate-200"
          >
            <Ionicons name="log-out-outline" size={16} color="#0f172a" />
            <Text className="font-semibold text-slate-900 ml-2">Log out</Text>
          </TouchableOpacity>
        </View>

        {/* Card */}
        <View className="bg-slate-900 mx-5 mt-6 rounded-3xl p-5 flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-slate-200 mr-5 overflow-hidden justify-center items-center">
            {/* Replace the source URI with user profile image path if available */}
            {isLoading ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <Text className="text-2xl text-slate-900 font-semibold text-center">
                {initials || "?"}
              </Text>
            )}
            {/* Example for Image: */}
            {/* <Image source={{ uri: "https://example.com/profile.jpg" }} className="w-16 h-16 rounded-full" /> */}
          </View>
          <View style={{ flex: 1 }}>
            <Text className="text-white font-semibold text-xl">
              {isLoading ? "Loading..." : fullName || "Your Profile"}
            </Text>
            <Text className="text-slate-200 text-base mt-1">
              {isLoading ? "Fetching details" : profile?.email || "—"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/profile-edit")}
            className="bg-white px-4 py-2 rounded-full active:opacity-80"
          >
            <Text className="font-semibold text-slate-900">Edit</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        <View className="mx-5 mt-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold tracking-[0.2em] text-slate-500">
              Booking History
            </Text>
            <View className="rounded-full border border-slate-200 bg-white px-3 py-1">
              <Text className="text-xs font-semibold text-slate-700">
                {completedVisits} visits
              </Text>
            </View>
          </View>

          <View className="mt-4 rounded-3xl bg-slate-900 p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-xl font-semibold">
                  Recent visits
                </Text>
                <Text className="text-slate-300 text-sm mt-1">
                  Track your appointments history
                </Text>
              </View>
              <View className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
                <Ionicons name="time-outline" size={18} color="#e2e8f0" />
              </View>
            </View>

            <View className="mt-5">
              {isHistoryLoading ? (
                <View className="items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 px-6 py-8">
                  <ActivityIndicator size="small" color="#e2e8f0" />
                  <Text className="text-slate-300 text-sm mt-3">
                    Loading your visits
                  </Text>
                </View>
              ) : null}
              {historyError ? (
                <View className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4">
                  <Text className="text-sm text-rose-200">{historyError}</Text>
                </View>
              ) : null}
              {!isHistoryLoading && !historyError && history.length === 0 ? (
                <View className="items-center justify-center rounded-2xl border border-slate-700 bg-slate-800 px-6 py-10">
                  <Ionicons name="calendar-outline" size={32} color="#e2e8f0" />
                  <Text className="mt-3 text-sm text-slate-300 text-center">
                    No visits yet. Your next booking will show up here.
                  </Text>
                </View>
              ) : null}
              {!isHistoryLoading && !historyError && history.length > 0 ? (
                <View>
                  {history.map((item, index) => {
                    const startDate = new Date(item.startAt);
                    const endDate = new Date(item.endAt);
                    const dateLabel = Number.isNaN(startDate.getTime())
                      ? "Date unavailable"
                      : dateFormatter.format(startDate);
                    const timeLabel =
                      Number.isNaN(startDate.getTime()) ||
                      Number.isNaN(endDate.getTime())
                        ? "Time unavailable"
                        : `${timeFormatter.format(
                            startDate
                          )} - ${timeFormatter.format(endDate)}`;
                    return (
                      <View
                        key={item.id}
                        className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 ${
                          index === history.length - 1 ? "" : "mb-3"
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-base font-semibold text-slate-900">
                            {item.serviceName}
                          </Text>
                          <View
                            className={`rounded-full px-3 py-1 ${
                              item.status === "cancelled"
                                ? "bg-rose-100"
                                : item.status === "no_show"
                                  ? "bg-purple-100"
                                  : "bg-emerald-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                item.status === "cancelled"
                                  ? "text-rose-700"
                                  : item.status === "no_show"
                                    ? "text-purple-700"
                                    : "text-emerald-700"
                              }`}
                            >
                              {item.status.replace("_", " ").toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-sm text-slate-600 mt-1">
                          {dateLabel} · {timeLabel}
                        </Text>
                        <View className="mt-2 flex-row items-center justify-between">
                          <Text className="text-sm text-slate-500">
                            {item.barberName}
                          </Text>
                          <Text className="text-sm font-semibold text-slate-900">
                            {item.basePrice ? `RM${item.basePrice}` : "RM0"}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
