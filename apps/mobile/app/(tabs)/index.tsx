import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
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

type Barber = {
  id: string;
  name: string;
  level: string | null;
  avatar_url: string | null;
  rating: number | null;
  reviewCount: number;
};

type LastVisit = {
  startAt: string;
  serviceName: string;
  serviceId: string;
  barberName: string;
  barberId: string;
};

type UpcomingBooking = {
  startAt: string;
  serviceName: string;
  barberName: string;
  status: "scheduled" | "in_progress";
};

const TIME_ZONE = "Asia/Kuala_Lumpur";

const getDaysSince = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};
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
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [lastVisit, setLastVisit] = useState<LastVisit | null>(null);
  const [activeBarberIndex, setActiveBarberIndex] = useState(0);
  const barberScrollRef = useRef<ScrollView>(null);
  const isUserScrolling = useRef(false);
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const CARD_MARGIN = 20;
  const CARD_GAP = 12;
  const CARDS_VISIBLE = 2;
  const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 2 - CARD_GAP) / CARDS_VISIBLE;

  const fetchHome = useCallback(async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setProfile(null);
      setUpcoming(null);
      return;
    }

    const [{ data: profileData }, { data: barberData }, { data: lastVisitData }, { data: reviewData }] = await Promise.all([
      supabase.from("profiles").select("first_name").eq("id", authData.user.id).maybeSingle(),
      supabase.from("profiles").select("id,display_name,first_name,last_name,avatar_url,barber_level").eq("role", "barber").eq("is_active", true),
      supabase.from("bookings").select("start_at,service_id,barber_id").eq("customer_id", authData.user.id).eq("status", "completed").order("start_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("barber_reviews").select("barber_id,rating"),
    ]);

    setProfile({
      first_name: profileData?.first_name ?? null,
    });

    const reviewsByBarber = (reviewData ?? []).reduce<Record<string, number[]>>((acc, r) => {
      if (!acc[r.barber_id]) acc[r.barber_id] = [];
      acc[r.barber_id].push(r.rating);
      return acc;
    }, {});

    setBarbers(
      (barberData ?? []).map((b) => {
        const ratings = reviewsByBarber[b.id] ?? [];
        const avg = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;
        return {
          id: b.id,
          name:
            b.display_name?.trim() ||
            [b.first_name, b.last_name].filter(Boolean).join(" ").trim() ||
            "Barber",
          level: b.barber_level ?? null,
          avatar_url: b.avatar_url ?? null,
          rating: avg,
          reviewCount: ratings.length,
        };
      })
    );

    if (lastVisitData) {
      const [{ data: lvService }, { data: lvBarber }] = await Promise.all([
        supabase.from("services").select("name").eq("id", lastVisitData.service_id).maybeSingle(),
        supabase.from("profiles").select("display_name,first_name,last_name").eq("id", lastVisitData.barber_id).maybeSingle(),
      ]);
      setLastVisit({
        startAt: lastVisitData.start_at,
        serviceName: lvService?.name ?? "Service",
        serviceId: lastVisitData.service_id,
        barberName:
          lvBarber?.display_name?.trim() ||
          [lvBarber?.first_name, lvBarber?.last_name].filter(Boolean).join(" ").trim() ||
          "Barber",
        barberId: lastVisitData.barber_id,
      });
    } else {
      setLastVisit(null);
    }

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

    const [{ data: serviceData }, { data: bookingBarberData }] = await Promise.all([
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
      bookingBarberData?.display_name?.trim() ||
      [bookingBarberData?.first_name, bookingBarberData?.last_name]
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

  useEffect(() => {
    if (barbers.length <= 1) return;
    const interval = setInterval(() => {
      if (isUserScrolling.current) return;
      setActiveBarberIndex((prev) => {
        const next = (prev + 1) % barbers.length;
        barberScrollRef.current?.scrollTo({
          x: next * (CARD_WIDTH + CARD_GAP),
          animated: true,
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [barbers.length, CARD_WIDTH, CARD_GAP]);

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

          </View>
        </View>

        {barbers.length > 0 && (
          <View className="mt-6">
            <Text className="mx-5 text-lg font-semibold text-neutral-900">
              Meet the barbers
            </Text>
            <ScrollView
              ref={barberScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + CARD_GAP}
              snapToAlignment="start"
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: CARD_MARGIN, paddingTop: 12, gap: CARD_GAP }}
              onScrollBeginDrag={() => { isUserScrolling.current = true; }}
              onMomentumScrollEnd={(e) => {
                isUserScrolling.current = false;
                const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP));
                setActiveBarberIndex(index);
              }}
            >
              {barbers.map((barber) => (
                <TouchableOpacity
                  key={barber.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/booking",
                      params: { barberId: barber.id },
                    })
                  }
                  activeOpacity={0.85}
                  style={{ width: CARD_WIDTH }}
                  className="items-center rounded-3xl border border-neutral-200 bg-white p-4"
                >
                  {barber.avatar_url ? (
                    <Image
                      source={{ uri: barber.avatar_url }}
                      className="h-20 w-20 rounded-full"
                      style={{ borderWidth: 2, borderColor: "#e5e5e5" }}
                    />
                  ) : (
                    <View
                      className="h-20 w-20 items-center justify-center rounded-full bg-neutral-100"
                      style={{ borderWidth: 2, borderColor: "#e5e5e5" }}
                    >
                      <Ionicons name="person" size={30} color="#a3a3a3" />
                    </View>
                  )}
                  <Text className="mt-3 text-center text-sm font-semibold text-neutral-900" numberOfLines={1}>
                    {barber.name}
                  </Text>
                  {barber.level ? (
                    <Text className="mt-0.5 text-center text-xs text-neutral-400" numberOfLines={1}>
                      {barber.level}
                    </Text>
                  ) : null}
                  <View className="mt-3 flex-row items-center gap-1">
                    <Ionicons name="star" size={11} color={barber.rating ? "#f59e0b" : "#d4d4d4"} />
                    <Text className="text-xs font-medium text-neutral-500">
                      {barber.rating ? barber.rating.toFixed(1) : "—"}
                    </Text>
                    {barber.reviewCount > 0 && (
                      <Text className="text-xs text-neutral-400">({barber.reviewCount})</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {lastVisit && (
          <View className="mx-5 mt-6">
            <Text className="text-lg font-semibold text-neutral-900">Last visit</Text>
            <View className="mt-3 rounded-3xl border border-neutral-200 bg-white p-5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
                    <Ionicons name="time-outline" size={17} color="#525252" />
                  </View>
                  <View>
                    <Text className="text-xs text-neutral-400">
                      {(() => {
                        const days = getDaysSince(lastVisit.startAt);
                        if (days === 0) return "Today";
                        if (days === 1) return "Yesterday";
                        return `${days} days ago`;
                      })()}
                    </Text>
                    <Text className="text-sm font-semibold text-neutral-900">
                      {lastVisit.serviceName}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-neutral-400">with {lastVisit.barberName}</Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/booking",
                    params: {
                      serviceId: lastVisit.serviceId,
                      barberId: lastVisit.barberId,
                    },
                  })
                }
                className="mt-4 flex-row items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 py-3"
              >
                <Ionicons name="refresh-outline" size={15} color="#171717" />
                <Text className="ml-2 text-sm font-semibold text-neutral-900">Book again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
