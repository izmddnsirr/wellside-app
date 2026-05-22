import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeAppointmentSkeleton } from "../../components/booking-skeletons";
import { supabase } from "../../utils/supabase";

type Profile = {
  first_name: string | null;
};

type UpcomingBooking = {
  startAt: string;
  serviceName: string;
  barberName: string;
  status: "scheduled" | "in_progress";
};

const TIME_ZONE = "Asia/Kuala_Lumpur";
const dayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "long",
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHome = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setProfile(null);
      setUpcoming(null);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", authData.user.id)
      .maybeSingle();

    setProfile({
      first_name: profileData?.first_name ?? null,
    });

    const { data: bookingData } = await supabase
      .from("bookings")
      .select("start_at,service_id,barber_id,status")
      .eq("customer_id", authData.user.id)
      .in("status", ["scheduled", "in_progress"])
      .order("start_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!bookingData) {
      setUpcoming(null);
      return;
    }

    const [{ data: serviceData }, { data: barberData }] = await Promise.all([
      supabase
        .from("services")
        .select("name")
        .eq("id", bookingData.service_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("display_name,first_name,last_name")
        .eq("id", bookingData.barber_id)
        .maybeSingle(),
    ]);

    const barberName =
      barberData?.display_name?.trim() ||
      [barberData?.first_name, barberData?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      "Barber";

    setUpcoming({
      startAt: bookingData.start_at,
      serviceName: serviceData?.name ?? "Service",
      barberName,
      status: bookingData.status,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const load = async () => {
        setIsLoading(true);
        await fetchHome();
        if (isMounted) {
          setIsLoading(false);
        }
      };

      load();

      return () => {
        isMounted = false;
      };
    }, [fetchHome]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchHome();
    setIsRefreshing(false);
  }, [fetchHome]);

  const dayLabel = useMemo(() => {
    if (!upcoming) {
      return "";
    }
    const date = new Date(upcoming.startAt);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return `${dayFormatter.format(date)}, ${dateFormatter.format(date)}`;
  }, [upcoming]);

  const timeLabel = useMemo(() => {
    if (!upcoming) {
      return "";
    }
    const date = new Date(upcoming.startAt);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return timeFormatter.format(date);
  }, [upcoming]);

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View className="mx-5 mt-3 flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center">
              <Text className="text-3xl mt-1 font-semibold text-neutral-900">
                Hi{profile?.first_name ? `, ${profile.first_name}` : ""}
              </Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <HomeAppointmentSkeleton />
        ) : (
        <View className="mx-5 mt-6 rounded-3xl border border-neutral-200 bg-white overflow-hidden relative">
          <View className="absolute -left-3 top-24 h-6 w-6 rounded-full bg-neutral-50 border border-neutral-200" />
          <View className="absolute -right-3 top-24 h-6 w-6 rounded-full bg-neutral-50 border border-neutral-200" />
          {!isLoading ? (
            <>
              <View className="bg-neutral-900 px-6 py-5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-neutral-200 text-[11px]">
                    Upcoming
                  </Text>
                  {upcoming ? (
                    <View
                      className={`rounded-full px-3 py-1 ${
                        upcoming.status === "in_progress"
                          ? "bg-amber-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          upcoming.status === "in_progress"
                            ? "text-amber-700"
                            : "text-blue-700"
                        }`}
                      >
                        {upcoming.status === "in_progress"
                          ? "IN PROGRESS"
                          : "SCHEDULED"}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {upcoming ? (
                  <>
                    <Text className="mt-3 text-3xl font-semibold text-white">
                      {dayLabel}
                    </Text>
                    <Text className="text-lg text-neutral-200">
                      {timeLabel} · {upcoming.serviceName}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="mt-3 text-2xl font-semibold text-white">
                      No upcoming booking
                    </Text>
                    <Text className="text-base text-neutral-200 mt-2">
                      Book a slot to see it here.
                    </Text>
                  </>
                )}
              </View>
              {upcoming ? (
                <View className="p-6">
                  <View className="flex-row items-center justify-between">
                    <View>
                      <View className="flex-row items-center">
                        <Ionicons
                          name="cut-outline"
                          size={14}
                          color="#737373"
                        />
                        <Text className="ml-2 text-xs text-neutral-500">
                          Service
                        </Text>
                      </View>
                      <Text className="mt-1 text-base font-semibold text-neutral-900">
                        {upcoming.serviceName}
                      </Text>
                    </View>
                    <View>
                      <View className="flex-row items-center justify-end">
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color="#737373"
                        />
                        <Text className="ml-2 text-xs text-neutral-500 text-right">
                          Barber
                        </Text>
                      </View>
                      <Text className="mt-1 text-base font-semibold text-neutral-900 text-right">
                        {upcoming.barberName}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/booking")}
                    className="mt-5 border border-neutral-200 bg-neutral-50 px-5 py-3 rounded-full w-full flex-row items-center justify-center"
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#171717"
                    />
                    <Text className="font-semibold text-neutral-900 text-center ml-2">
                      Manage booking
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="p-6">
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/booking")}
                    className="bg-neutral-900 px-5 py-3 rounded-full w-full flex-row items-center justify-center"
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#fafafa"
                    />
                    <Text className="font-semibold text-neutral-50 text-center ml-2">
                      Start booking
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : null}
        </View>
        )}

        <View className="mx-5 mt-6">
          <Text className="text-lg font-semibold text-neutral-900">
            Quick actions
          </Text>
          <View className="mt-3 flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/booking")}
              className="flex-1 items-center justify-center rounded-3xl border border-neutral-200 bg-white p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-900">
                <Ionicons name="calendar-outline" size={18} color="#ffffff" />
              </View>
              <Text className="mt-3 text-sm font-semibold text-neutral-900">
                Book
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/ai")}
              className="flex-1 items-center justify-center rounded-3xl border border-neutral-900 bg-neutral-900 p-4"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Ionicons name="sparkles-outline" size={18} color="#ffffff" />
              </View>
              <Text className="mt-3 text-sm font-semibold text-white">
                AI Style
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled
              className="flex-1 items-center justify-center rounded-3xl border border-neutral-200 bg-white p-4 opacity-60"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                <Ionicons name="people-outline" size={18} color="#525252" />
              </View>
              <Text className="mt-3 text-sm font-semibold text-neutral-900">
                Queue
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
