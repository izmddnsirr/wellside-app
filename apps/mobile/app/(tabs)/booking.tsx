import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../utils/supabase";
import { loadBookingAvailability } from "../../utils/shop-operations";

const TIME_ZONE = "Asia/Kuala_Lumpur";
const DEFAULT_DIRECTIONS_QUERY =
  "Wellside Barbershop, 24, Jalan Palas 5, Taman Teratai, 81300 Skudai, Johor Darul Ta'zim";
const APPLE_MAPS_URL = "https://maps.apple/p/5nkCrxT7TWN7Mu";
const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/qt9QgpidbmVmrMoy6?g_st=ipc";
const DEFAULT_WHATSAPP_PHONE = "01112564440";
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

type UpcomingBooking = {
  id: string;
  bookingRef: string | null;
  startAt: string;
  endAt: string;
  serviceName: string;
  durationMinutes: number | null;
  basePrice: number | null;
  barberName: string;
  barberPhone: string | null;
  status: "scheduled" | "in_progress";
};

type ServicePreview = {
  id: string;
  name: string;
  basePrice: number | null;
  durationMinutes: number | null;
};

type ProfessionalPreview = {
  id: string;
  name: string;
  level: string | null;
};

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<UpcomingBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [services, setServices] = useState<ServicePreview[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalPreview[]>([]);
  const [bookingEnabled, setBookingEnabled] = useState(true);

  const fetchUpcoming = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setIsLoading(false);
      setUpcoming(null);
      setServices([]);
      setProfessionals([]);
      setBookingEnabled(true);
      setErrorMessage("Please sign in to view your booking.");
      return;
    }

    const [
      isBookingEnabled,
      { data: servicesData },
      { data: barbersData },
    ] = await Promise.all([
      loadBookingAvailability(supabase as never),
      supabase
        .from("services")
        .select("id,name,base_price,duration_minutes")
        .eq("is_active", true)
        .eq("allow_booking", true)
        .order("service_code", { ascending: true })
        .order("name", { ascending: true })
        .limit(3),
      supabase
        .from("profiles")
        .select("id,display_name,first_name,last_name,barber_level")
        .eq("is_active", true)
        .eq("role", "barber")
        .order("display_name")
        .limit(4),
    ]);

    setBookingEnabled(isBookingEnabled);

    setServices(
      (servicesData ?? []).map((service) => ({
        id: service.id,
        name: service.name,
        basePrice: service.base_price ?? null,
        durationMinutes: service.duration_minutes ?? null,
      })),
    );

    setProfessionals(
      (barbersData ?? []).map((barber) => ({
        id: barber.id,
        name:
          barber.display_name?.trim() ||
          [barber.first_name, barber.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          "Barber",
        level: barber.barber_level?.trim() || null,
      })),
    );

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("id,booking_ref,start_at,end_at,status,service_id,barber_id")
      .eq("customer_id", authData.user.id)
      .in("status", ["scheduled", "in_progress"])
      .order("start_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (bookingError || !bookingData) {
      setIsLoading(false);
      setUpcoming(null);
      if (bookingError) {
        setErrorMessage("Unable to load your upcoming booking.");
      }
      return;
    }

    const [{ data: serviceData }, { data: barberData }] = await Promise.all([
      supabase
        .from("services")
        .select("name,base_price,duration_minutes")
        .eq("id", bookingData.service_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("display_name,first_name,last_name,phone")
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
      id: bookingData.id,
      bookingRef: bookingData.booking_ref ?? null,
      startAt: bookingData.start_at,
      endAt: bookingData.end_at,
      serviceName: serviceData?.name ?? "Service",
      durationMinutes: serviceData?.duration_minutes ?? null,
      basePrice: serviceData?.base_price ?? null,
      barberName,
      barberPhone: barberData?.phone ?? null,
      status: bookingData.status,
    });
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        await fetchUpcoming();
      };

      load();
    }, [fetchUpcoming]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchUpcoming();
    setIsRefreshing(false);
  }, [fetchUpcoming]);

  const sendCancellationEmail = useCallback(
    async (booking: UpcomingBooking) => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (sessionError || !accessToken) {
        console.warn(
          "Booking cancellation email skipped: missing auth session.",
        );
        return;
      }

      const explicitApiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";
      const localBase = process.env.EXPO_PUBLIC_BASE_URL_LOCAL ?? "";
      const hostedBase = process.env.EXPO_PUBLIC_BASE_URL ?? "";
      const apiBase =
        Platform.OS === "web"
          ? ""
          : __DEV__
            ? localBase || explicitApiBase || hostedBase
            : explicitApiBase || hostedBase;
      if (!apiBase && Platform.OS !== "web") {
        console.warn(
          "Booking email skipped: API base URL missing. Set EXPO_PUBLIC_BASE_URL_LOCAL or EXPO_PUBLIC_API_BASE_URL.",
        );
        return;
      }

      const payload = {
        bookingId: booking.id,
        bookingRef: booking.bookingRef ?? undefined,
        event: "cancellation" as const,
      };

      try {
        const [customerRes, adminRes] = await Promise.all([
          fetch(`${apiBase}/api/booking-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              ...payload,
              audience: "customer",
            }),
          }),
          fetch(`${apiBase}/api/booking-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              ...payload,
              audience: "admin",
            }),
          }),
        ]);

        if (!customerRes.ok) {
          console.warn(
            `Customer cancellation email failed (status ${customerRes.status}).`,
          );
        }
        if (!adminRes.ok) {
          console.warn(
            `Admin cancellation email failed (status ${adminRes.status}).`,
          );
        }
      } catch (emailError) {
        console.warn("Booking cancellation email failed:", emailError);
      }
    },
    [],
  );

  const onCancelBooking = useCallback(() => {
    if (!upcoming || isCancelling) {
      return;
    }
    Alert.alert(
      "Cancel booking?",
      "Your booking will be marked as cancelled.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            const bookingSnapshot = upcoming;
            if (!bookingSnapshot) {
              return;
            }
            setIsCancelling(true);
            const { error } = await supabase.rpc("cancel_booking", {
              p_booking_id: bookingSnapshot.id,
            });

            if (error) {
              Alert.alert("Cancel failed", error.message);
              setIsCancelling(false);
              return;
            }

            setIsCancelling(false);
            await sendCancellationEmail(bookingSnapshot);
            await fetchUpcoming();
          },
        },
      ],
    );
  }, [fetchUpcoming, isCancelling, sendCancellationEmail, upcoming]);

  const timeLabel = useMemo(() => {
    if (!upcoming) {
      return "";
    }
    const start = new Date(upcoming.startAt);
    const end = new Date(upcoming.endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "";
    }
    return `${timeFormatter.format(start)} · ${timeFormatter.format(end)}`;
  }, [upcoming]);

  const dayLabel = useMemo(() => {
    if (!upcoming) {
      return "";
    }
    const start = new Date(upcoming.startAt);
    if (Number.isNaN(start.getTime())) {
      return "";
    }
    return `${dayFormatter.format(start)}, ${dateFormatter.format(start)}`;
  }, [upcoming]);

  const openWhatsApp = useCallback(
    async (message: string) => {
      if (!upcoming) {
        return;
      }
      const rawPhone = DEFAULT_WHATSAPP_PHONE;
      const digitsOnly = rawPhone.replace(/\D/g, "");
      if (!digitsOnly) {
        Alert.alert("Contact unavailable", "No phone number is available.");
        return;
      }
      const normalized = digitsOnly.startsWith("0")
        ? `60${digitsOnly.slice(1)}`
        : digitsOnly;
      const encodedMessage = encodeURIComponent(message);
      const appUrl = `whatsapp://send?phone=${normalized}&text=${encodedMessage}`;
      const webUrl = `https://wa.me/${normalized}?text=${encodedMessage}`;
      const canOpen = await Linking.canOpenURL(appUrl);
      const url = canOpen ? appUrl : webUrl;
      Linking.openURL(url).catch(() => {
        Alert.alert("Unable to open WhatsApp", "Please try again later.");
      });
    },
    [upcoming],
  );

  const onPressDirections = useCallback(() => {
    const query = DEFAULT_DIRECTIONS_QUERY.trim();
    if (!query) {
      Alert.alert("Location unavailable", "We don't have a location yet.");
      return;
    }
    const url = Platform.OS === "ios" ? APPLE_MAPS_URL : GOOGLE_MAPS_URL;
    Linking.openURL(url).catch(() => {
      Alert.alert("Unable to open maps", "Please try again later.");
    });
  }, []);

  const onPressContact = useCallback(() => {
    openWhatsApp("Hi! I have a question about my booking.");
  }, [openWhatsApp]);

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* Greeting Section */}
        <View className="mx-5 mt-3 flex-row justify-between items-center">
          <View>
            <Text className="text-3xl mt-1 font-semibold text-neutral-900">
              Booking
            </Text>
            <Text className="text-neutral-500 text-base mt-1">
              Choose your chair now
            </Text>
          </View>
        </View>

        {/* Upcoming */}
        <View className="mx-5 mt-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-neutral-900">
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
                          ? "In progress"
                          : "Scheduled"}
                </Text>
              </View>
            ) : null}
          </View>

          {!isLoading && !errorMessage && !upcoming ? (
            <View className="mt-4 min-h-[180px] items-center justify-center border border-dashed border-neutral-300 rounded-3xl p-6 bg-neutral-100">
              <Ionicons name="calendar-outline" size={32} color="#171717" />
              <Text className="mt-3 text-sm text-neutral-700 text-center">
                No upcoming bookings yet.
              </Text>
            </View>
          ) : (
            <View className="mt-4 rounded-3xl border border-neutral-200 bg-white overflow-hidden min-h-[180px]">
              {isLoading ? (
                <View className="flex-1 items-center justify-center p-6">
                  <ActivityIndicator size="small" color="#171717" />
                </View>
              ) : null}
              {errorMessage ? (
                <View className="p-5">
                  <Text className="text-sm text-red-500">{errorMessage}</Text>
                </View>
              ) : null}
              {!isLoading && !errorMessage && upcoming ? (
                <>
                  <View className="bg-neutral-900 px-5 py-5">
                    <View className="flex-row items-start justify-between">
                      <View style={{ flex: 1, paddingRight: 12 }}>
                        <Text className="text-neutral-300 text-xs">
                          {dayLabel}
                        </Text>
                        <Text className="text-white text-2xl font-semibold mt-2">
                          {timeLabel}
                        </Text>
                        <Text className="text-neutral-300 mt-1">
                          {upcoming.serviceName} · {upcoming.barberName}
                        </Text>
                      </View>
                      <View className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#e5e5e5"
                        />
                      </View>
                    </View>
                  </View>
                  <View className="p-5">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="h-9 w-9 rounded-full bg-neutral-100 items-center justify-center">
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color="#171717"
                          />
                        </View>
                        <View className="ml-3">
                          <Text className="text-xs text-neutral-500">
                            Duration
                          </Text>
                          <Text className="text-sm font-semibold text-neutral-900">
                            {upcoming.durationMinutes
                              ? `${upcoming.durationMinutes} min`
                              : "N/A"}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <View className="h-9 w-9 rounded-full bg-neutral-100 items-center justify-center">
                          <Ionicons
                            name="cash-outline"
                            size={16}
                            color="#171717"
                          />
                        </View>
                        <View className="ml-3">
                          <Text className="text-xs text-neutral-500">
                            Total
                          </Text>
                          <Text className="text-sm font-semibold text-neutral-900">
                            {upcoming.basePrice
                              ? `RM${upcoming.basePrice}`
                              : "RM0"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={onCancelBooking}
                      disabled={isCancelling}
                      className={`mt-5 border border-red-200 bg-red-50 px-4 py-3 rounded-3xl ${
                        isCancelling ? "opacity-60" : ""
                      }`}
                    >
                      <Text className="text-center text-red-600 font-semibold">
                        {isCancelling ? "Cancelling..." : "Cancel booking"}
                      </Text>
                    </TouchableOpacity>
                    <Text className="mt-3 text-xs text-neutral-500 text-center">
                      You can cancel up to 2 hours before your appointment.
                      After that, please contact your barber.
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
          )}
          {!isLoading && !errorMessage && upcoming ? (
            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity
                onPress={onPressDirections}
                className="flex-1 flex-row items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-3"
              >
                <Ionicons name="navigate-outline" size={16} color="#171717" />
                <Text className="ml-2 text-sm font-semibold text-neutral-700">
                  Get direction
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onPressContact}
                className="flex-1 flex-row items-center justify-center rounded-full border border-neutral-200 bg-white px-4 py-3"
              >
                <Ionicons name="call-outline" size={16} color="#171717" />
                <Text className="ml-2 text-sm font-semibold text-neutral-700">
                  Contact
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* New appointment */}
        <View className="mx-5 mt-6 rounded-3xl border border-neutral-200 bg-white p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-semibold text-neutral-900">
                New appointment
              </Text>
              <Text className="mt-1 text-sm text-neutral-500">
                Pick a service, barber, and time that works for you.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/booking/select-service")}
              disabled={!bookingEnabled}
              className={`rounded-full px-4 py-2.5 ${
                bookingEnabled ? "bg-neutral-900" : "bg-neutral-200"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  bookingEnabled ? "text-white" : "text-neutral-500"
                }`}
              >
                {bookingEnabled ? "Book now" : "Paused"}
              </Text>
            </TouchableOpacity>
          </View>
          {!bookingEnabled ? (
            <View className="mt-4 rounded-2xl bg-amber-50 p-3">
              <Text className="text-sm leading-5 text-amber-800">
                Online booking is currently paused. Please contact the shop for
                urgent changes.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Services */}
        <View className="mx-5 mt-6">
          <Text className="text-lg font-semibold text-neutral-900">
            Services
          </Text>
          <View className="mt-3 gap-3">
            {services.length ? (
              services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  onPress={() => {
                    if (bookingEnabled) {
                      router.push("/booking/select-service");
                    }
                  }}
                  disabled={!bookingEnabled}
                  className={`rounded-3xl border border-neutral-200 bg-white p-4 ${
                    !bookingEnabled ? "opacity-60" : ""
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className="font-semibold text-neutral-900">
                        {service.name}
                      </Text>
                      <Text className="mt-1 text-sm text-neutral-500">
                        {service.durationMinutes
                          ? `${service.durationMinutes} min`
                          : "Duration unavailable"}
                      </Text>
                    </View>
                    <Text className="font-semibold text-neutral-900">
                      {service.basePrice ? `RM${service.basePrice}` : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="rounded-3xl border border-neutral-200 bg-white p-4">
                <Text className="text-sm text-neutral-500">
                  Services will appear here when available.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Professionals */}
        <View className="mx-5 mt-6">
          <Text className="text-lg font-semibold text-neutral-900">
            Professionals
          </Text>
          <View className="mt-3 flex-row flex-wrap justify-between">
            {professionals.length ? (
              professionals.map((professional) => (
                <TouchableOpacity
                  key={professional.id}
                  onPress={() => {
                    if (bookingEnabled) {
                      router.push("/booking/select-service");
                    }
                  }}
                  disabled={!bookingEnabled}
                  className={`mb-3 w-[48%] rounded-3xl border border-neutral-200 bg-white p-4 ${
                    !bookingEnabled ? "opacity-60" : ""
                  }`}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                    <Text className="text-sm font-semibold text-neutral-900">
                      {professional.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </Text>
                  </View>
                  <Text className="mt-3 font-semibold text-neutral-900">
                    {professional.name}
                  </Text>
                  {professional.level ? (
                    <Text className="mt-1 text-sm text-neutral-500">
                      {professional.level}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))
            ) : (
              <View className="w-full rounded-3xl border border-neutral-200 bg-white p-4">
                <Text className="text-sm text-neutral-500">
                  Professionals will appear here when available.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Booking note */}
        <View className="mx-5 mt-3 rounded-3xl border border-neutral-200 bg-white p-4">
          <View className="flex-row items-start">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#525252"
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-neutral-900">
                Booking note
              </Text>
              <Text className="mt-1 text-sm leading-5 text-neutral-500">
                Please arrive 5 minutes before your slot. For late changes,
                contact the shop directly.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
