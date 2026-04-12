import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const galleryScrollRef = useRef<ScrollView | null>(null);
  const galleryMetrics = useRef({
    contentWidth: 0,
    containerWidth: 0,
    offset: 0,
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalBookings, setTotalBookings] = useState(0);

  const fetchHome = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setProfile(null);
      setUpcoming(null);
      setTotalBookings(0);
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

    const { count: bookingCount } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", authData.user.id);
    setTotalBookings(bookingCount ?? 0);

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

  useFocusEffect(
    useCallback(() => {
      const intervalId = setInterval(() => {
        const { contentWidth, containerWidth, offset } = galleryMetrics.current;
        if (!galleryScrollRef.current || contentWidth <= containerWidth) {
          return;
        }
        const maxOffset = contentWidth - containerWidth;
        const nextOffset = offset + 160 > maxOffset ? 0 : offset + 160;
        galleryMetrics.current.offset = nextOffset;
        galleryScrollRef.current.scrollTo({ x: nextOffset, animated: true });
      }, 3000);

      return () => clearInterval(intervalId);
    }, []),
  );

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="mx-5 mt-3 flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center">
              <Text className="text-3xl mt-1 font-semibold text-slate-900">
                Hi{profile?.first_name ? `, ${profile.first_name}` : ""}
              </Text>
              {isLoading ? (
                <ActivityIndicator className="ml-3" size="small" />
              ) : null}
            </View>
            <Text className="text-slate-600 text-base mt-1">
              Clean lines. Calm day.
            </Text>
          </View>
        </View>

        <View className="mx-5 mt-6 rounded-3xl border border-slate-200 bg-white overflow-hidden relative">
          <View className="absolute -left-3 top-24 h-6 w-6 rounded-full bg-slate-50 border border-slate-200" />
          <View className="absolute -right-3 top-24 h-6 w-6 rounded-full bg-slate-50 border border-slate-200" />
          {isLoading ? (
            <View className="p-6 items-center justify-center">
              <ActivityIndicator size="small" color="#0f172a" />
            </View>
          ) : null}
          {!isLoading ? (
            <>
              <View className="bg-slate-900 px-6 py-5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-200 text-[11px] tracking-[0.2em]">
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
                    <Text className="text-lg text-slate-200">
                      {timeLabel} · {upcoming.serviceName}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="mt-3 text-2xl font-semibold text-white">
                      No upcoming booking
                    </Text>
                    <Text className="text-base text-slate-200 mt-2">
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
                          color="#64748b"
                        />
                        <Text className="ml-2 text-xs text-slate-500 tracking-[0.2em]">
                          Service
                        </Text>
                      </View>
                      <Text className="mt-1 text-base font-semibold text-slate-900">
                        {upcoming.serviceName}
                      </Text>
                    </View>
                    <View>
                      <View className="flex-row items-center justify-end">
                        <Ionicons
                          name="person-outline"
                          size={14}
                          color="#64748b"
                        />
                        <Text className="ml-2 text-xs text-slate-500 tracking-[0.2em] text-right">
                          Barber
                        </Text>
                      </View>
                      <Text className="mt-1 text-base font-semibold text-slate-900 text-right">
                        {upcoming.barberName}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/booking")}
                    className="mt-5 border border-slate-200 bg-slate-50 px-5 py-3 rounded-full w-full flex-row items-center justify-center"
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#0f172a"
                    />
                    <Text className="font-semibold text-slate-900 text-center ml-2">
                      Manage booking
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="p-6">
                  <TouchableOpacity
                    onPress={() => router.push("/(tabs)/booking")}
                    className="bg-slate-900 px-5 py-3 rounded-full w-full flex-row items-center justify-center"
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color="#f8fafc"
                    />
                    <Text className="font-semibold text-slate-50 text-center ml-2">
                      Start booking
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : null}
        </View>

        <View className="mx-5 mt-5 flex-row justify-between">
          <View className="w-[31%] rounded-3xl bg-white border border-slate-200 p-4">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={12} color="#64748b" />
              <Text className="ml-2 text-[11px] tracking-[0.2em] text-slate-600">
                Next
              </Text>
            </View>
            <Text className="mt-2 text-base font-semibold text-slate-900">
              {upcoming ? timeLabel : "None"}
            </Text>
            <Text className="mt-1 text-xs text-slate-500">
              {upcoming ? dayLabel : "Book now"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/ai")}
            className="w-[31%] rounded-3xl bg-slate-900 border border-slate-900 p-4"
          >
            <View className="flex-row items-center">
              <Ionicons name="sparkles-outline" size={12} color="#e2e8f0" />
              <Text className="ml-2 text-[11px] tracking-[0.2em] text-slate-200">
                Try AI
              </Text>
            </View>
            <Text className="mt-2 text-base font-semibold text-white">
              Suggest
            </Text>
            <Text className="mt-1 text-xs text-slate-300">New look</Text>
          </TouchableOpacity>
          <View className="w-[31%] rounded-3xl bg-white border border-slate-200 p-4">
            <View className="flex-row items-center">
              <Ionicons name="receipt-outline" size={12} color="#64748b" />
              <Text className="ml-2 text-[11px] tracking-[0.2em] text-slate-600">
                Total
              </Text>
            </View>
            <Text className="mt-2 text-base font-semibold text-slate-900">
              {totalBookings}
            </Text>
            <Text className="mt-1 text-xs text-slate-500">Bookings</Text>
          </View>
        </View>

        {/* <Text className="mx-5 mt-6 text-[11px] tracking-[0.2em] text-slate-600 font-semibold">
          Gallery
        </Text>
        <ScrollView
          ref={galleryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingLeft: 18, paddingRight: 12 }}
          onContentSizeChange={(width) => {
            galleryMetrics.current.contentWidth = width;
          }}
          onLayout={(event) => {
            galleryMetrics.current.containerWidth =
              event.nativeEvent.layout.width;
          }}
          onScroll={(event) => {
            galleryMetrics.current.offset = event.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
        >
          {["bg-slate-200", "bg-slate-300", "bg-slate-100", "bg-slate-200"].map(
            (bgClass, index) => (
              <View
                key={`${bgClass}-${index}`}
                className={`mr-4 h-40 w-32 rounded-3xl ${bgClass}`}
              />
            )
          )}
        </ScrollView> */}
      </ScrollView>
    </View>
  );
}
