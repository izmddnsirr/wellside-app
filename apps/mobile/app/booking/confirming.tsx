import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Animated,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBooking } from "../../context/BookingContext";
import { scheduleAppointmentReminder } from "../../utils/notifications";
import { supabase } from "../../utils/supabase";
import {
  evaluateShopDateStatus,
  hasRestWindowOverlap,
  loadShopOperatingRules,
} from "../../utils/shop-operations";

const GRACE_PERIOD_MS = 5000;
const malaysiaDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Kuala_Lumpur",
});

const malaysiaHourMinuteFormatter = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kuala_Lumpur",
});

const malaysiaWeekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  timeZone: "Asia/Kuala_Lumpur",
});

const WEEKDAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type Phase =
  | "counting"
  | "confirming"
  | "cancelled"
  | "confirmed"
  | "error";

const parseTimeToMinutes = (value: string | null) => {
  if (!value) {
    return null;
  }
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return hour * 60 + minute;
};

const toMalaysiaDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return malaysiaDateKeyFormatter.format(date);
};

const toMinutesInMalaysia = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const parts = malaysiaHourMinuteFormatter.formatToParts(date);
  const hour = Number(
    parts.find((part) => part.type === "hour")?.value ?? "NaN",
  );
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "NaN",
  );
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  return hour * 60 + minute;
};

const toWeekdayInMalaysia = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const weekday = malaysiaWeekdayFormatter.format(date).toLowerCase();
  return WEEKDAY_KEYS.includes(weekday as (typeof WEEKDAY_KEYS)[number])
    ? weekday
    : null;
};

export default function ConfirmingBookingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { startedAt: startedAtParam } = useLocalSearchParams<{
    startedAt?: string;
  }>();
  const { selectedService, selectedBarber, selectedSlot } = useBooking();
  const [phase, setPhase] = useState<Phase>("counting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const finalizeRequestedRef = useRef(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const startedAt = useMemo(() => {
    const parsed = Number(startedAtParam);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return Date.now();
  }, [startedAtParam]);

  const elapsed = Math.max(0, now - startedAt);
  const remaining = Math.max(0, GRACE_PERIOD_MS - elapsed);
  const secondsLeft = Math.ceil(remaining / 1000);

  const syncProgressAnimation = useCallback(() => {
    const elapsedNow = Math.max(0, Date.now() - startedAt);
    const remainingNow = Math.max(0, GRACE_PERIOD_MS - elapsedNow);
    const progressNow = Math.min(1, elapsedNow / GRACE_PERIOD_MS);
    progressAnim.setValue(progressNow);
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingNow,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [progressAnim, startedAt]);

  useEffect(() => {
    if (phase !== "counting") {
      return;
    }
    return syncProgressAnimation();
  }, [phase, startedAt, syncProgressAnimation]);

  useEffect(() => {
    if (phase !== "counting") {
      return;
    }
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setNow(Date.now());
        if (phase === "counting") {
          syncProgressAnimation();
        }
      }
    });
    return () => subscription.remove();
  }, [phase, startedAt, syncProgressAnimation]);

  useEffect(() => {
    if (!selectedService || !selectedBarber || !selectedSlot) {
      setPhase("error");
      setErrorMessage("Booking details are missing. Please review again.");
    }
  }, [selectedService, selectedBarber, selectedSlot]);

  const saveConfirmationNotification = useCallback(
    async (userId: string, serviceName: string, startAt: string) => {
      // Save in-app notification record
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Booking confirmed",
        body: `Your ${serviceName} has been booked. See you soon!`,
      });

      // Schedule a local reminder 1 hour before the appointment
      const appointmentTime = new Date(startAt).getTime();
      const reminderTime = new Date(appointmentTime - 60 * 60 * 1000);
      if (reminderTime > new Date()) {
        try {
          await scheduleAppointmentReminder(serviceName, reminderTime);
        } catch {
          // Notification permission may not be granted — fail silently
        }
      }
    },
    [],
  );

  const sendBookingEmail = useCallback(
    async ({ bookingId }: { bookingId: string }) => {
      try {
        const { error } = await supabase.functions.invoke(
          "send-booking-email",
          { body: { event: "confirmation", bookingId } },
        );
        if (error) {
          console.warn("Booking email failed:", error.message);
        }
      } catch (err) {
        console.warn("Booking email request failed:", err);
      }
    },
    [],
  );

  const finalizeBooking = useCallback(async () => {
    if (finalizeRequestedRef.current || phase !== "counting") {
      return;
    }
    finalizeRequestedRef.current = true;
    setPhase("confirming");
    setErrorMessage(null);

    if (!selectedService || !selectedBarber || !selectedSlot) {
      setPhase("error");
      setErrorMessage("Booking details are missing. Please review again.");
      finalizeRequestedRef.current = false;
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setPhase("error");
      setErrorMessage("Please sign in again to confirm your booking.");
      finalizeRequestedRef.current = false;
      return;
    }

    const { data: existingBooking, error: existingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("customer_id", authData.user.id)
      .in("status", ["scheduled", "in_progress"])
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Booking check failed:", existingError);
      setPhase("error");
      setErrorMessage("Unable to confirm booking right now.");
      finalizeRequestedRef.current = false;
      return;
    }

    if (existingBooking) {
      setPhase("error");
      setErrorMessage("You already have an active booking.");
      finalizeRequestedRef.current = false;
      return;
    }

    const startAt = selectedSlot.startAt;
    const endAt = selectedSlot.endAt;
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
      setPhase("error");
      setErrorMessage("Unable to confirm booking right now.");
      finalizeRequestedRef.current = false;
      return;
    }

    const operatingRules = await loadShopOperatingRules(supabase);
    if (!operatingRules.bookingEnabled) {
      setPhase("error");
      setErrorMessage("Online booking is currently paused.");
      finalizeRequestedRef.current = false;
      return;
    }

    const shopStatus = evaluateShopDateStatus(
      startAt,
      operatingRules.weeklySchedule,
      operatingRules.temporaryClosures,
    );

    if (shopStatus.closed) {
      setPhase("error");
      setErrorMessage(shopStatus.reason ?? "Shop is closed for selected date.");
      finalizeRequestedRef.current = false;
      return;
    }

    if (hasRestWindowOverlap(startAt, endAt, operatingRules.restWindows)) {
      setPhase("error");
      setErrorMessage("Selected slot overlaps with shop rest window.");
      finalizeRequestedRef.current = false;
      return;
    }

    const { data: barberProfile, error: barberError } = await supabase
      .from("profiles")
      .select("working_start_time, working_end_time, off_days")
      .eq("id", selectedBarber.id)
      .single();

    if (barberError || !barberProfile) {
      setPhase("error");
      setErrorMessage("Unable to confirm booking right now.");
      finalizeRequestedRef.current = false;
      return;
    }

    const workingStartMinutes = parseTimeToMinutes(
      barberProfile?.working_start_time ?? null,
    );
    const rawWorkingEndMinutes = parseTimeToMinutes(
      barberProfile?.working_end_time ?? null,
    );
    const bookingStartMinutes = toMinutesInMalaysia(startAt);
    const rawBookingEndMinutes = toMinutesInMalaysia(endAt);
    const bookingWeekday = toWeekdayInMalaysia(startAt);
    const offDays = Array.isArray(barberProfile?.off_days)
      ? barberProfile.off_days.map((value: string) => value.toLowerCase())
      : [];
    const bookingStartDateKey = toMalaysiaDateKey(startAt);
    const bookingEndDateKey = toMalaysiaDateKey(endAt);

    const workingEndMinutes =
      workingStartMinutes !== null && rawWorkingEndMinutes !== null
        ? rawWorkingEndMinutes <= workingStartMinutes
          ? rawWorkingEndMinutes + 24 * 60
          : rawWorkingEndMinutes
        : null;

    const bookingEndMinutes =
      bookingStartMinutes !== null && rawBookingEndMinutes !== null
        ? bookingEndDateKey !== bookingStartDateKey ||
          rawBookingEndMinutes <= bookingStartMinutes
          ? rawBookingEndMinutes + 24 * 60
          : rawBookingEndMinutes
        : null;

    if (
      workingStartMinutes === null ||
      workingEndMinutes === null ||
      bookingStartMinutes === null ||
      bookingEndMinutes === null ||
      (bookingWeekday !== null && offDays.includes(bookingWeekday)) ||
      bookingStartMinutes < workingStartMinutes ||
      bookingEndMinutes > workingEndMinutes
    ) {
      setPhase("error");
      setErrorMessage("Selected slot is not available anymore.");
      finalizeRequestedRef.current = false;
      return;
    }

    const { data: overlappingBooking, error: overlapError } = await supabase
      .from("bookings")
      .select("id")
      .eq("barber_id", selectedBarber.id)
      .neq("status", "cancelled")
      .lt("start_at", endAt)
      .gt("end_at", startAt)
      .limit(1)
      .maybeSingle();

    if (overlapError) {
      setPhase("error");
      setErrorMessage("Unable to confirm booking right now.");
      finalizeRequestedRef.current = false;
      return;
    }

    if (overlappingBooking) {
      setPhase("error");
      setErrorMessage("Selected slot is no longer available.");
      finalizeRequestedRef.current = false;
      return;
    }

    const { data: overlappingUnavailability, error: unavailabilityError } =
      await supabase
        .from("barber_unavailability")
        .select("id")
        .eq("barber_id", selectedBarber.id)
        .lt("start_at", endAt)
        .gt("end_at", startAt)
        .limit(1)
        .maybeSingle();

    if (unavailabilityError) {
      setPhase("error");
      setErrorMessage("Unable to confirm booking right now.");
      finalizeRequestedRef.current = false;
      return;
    }

    if (overlappingUnavailability) {
      setPhase("error");
      setErrorMessage("Selected slot is unavailable.");
      finalizeRequestedRef.current = false;
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: authData.user.id,
        barber_id: selectedBarber.id,
        service_id: selectedService.id,
        start_at: selectedSlot.startAt,
        end_at: selectedSlot.endAt,
        status: "scheduled",
      })
      .select("id,booking_ref")
      .single();

    if (error || !data) {
      console.error("Booking confirm failed:", error);
      setPhase("error");
      setErrorMessage(error?.message ?? "Unable to confirm booking right now.");
      finalizeRequestedRef.current = false;
      return;
    }

    void sendBookingEmail({ bookingId: data.id });

    void saveConfirmationNotification(
      authData.user.id,
      selectedService.name,
      selectedSlot.startAt,
    );

    setPhase("confirmed");
    router.replace({
      pathname: "/booking/success",
      params: {
        bookingId: data.id,
        bookingCode: data.booking_ref ?? "",
      },
    });
  }, [
    phase,
    router,
    saveConfirmationNotification,
    selectedBarber,
    selectedService,
    selectedSlot,
    sendBookingEmail,
  ]);

  useEffect(() => {
    if (phase !== "counting") {
      return;
    }
    if (elapsed >= GRACE_PERIOD_MS) {
      void finalizeBooking();
    }
  }, [elapsed, phase, finalizeBooking]);

  const handleCancel = () => {
    if (phase !== "counting") {
      return;
    }
    setPhase("cancelled");
    router.back();
  };

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 pt-3">
        <Pressable
          onPress={handleCancel}
          className="h-10 w-10 items-center justify-center"
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={22} color="#171717" />
        </Pressable>
        <Pressable
          onPress={handleCancel}
          className="h-10 w-10 items-center justify-center"
          hitSlop={10}
        >
          <Ionicons name="close" size={24} color="#171717" />
        </Pressable>
      </View>

      <View className="px-5 pt-2">
        <Text className="text-3xl font-semibold text-neutral-900">
          Confirming booking
        </Text>
      </View>

      <View className="mt-6 px-5">
        <View className="rounded-3xl border border-neutral-200 bg-white p-5">
          <View className="h-3 overflow-hidden rounded-full bg-neutral-200">
            <Animated.View
              className="h-3 rounded-full bg-neutral-900"
              style={{
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              }}
            />
          </View>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm text-neutral-500">Time remaining</Text>
            <Text className="text-sm font-semibold text-neutral-900">
              {secondsLeft}s
            </Text>
          </View>

          {phase === "confirming" ? (
            <View className="mt-5 flex-row items-center">
              <ActivityIndicator color="#171717" />
              <Text className="ml-3 text-sm text-neutral-500">
                Finalizing your booking…
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <Text className="mt-4 text-sm text-red-500">{errorMessage}</Text>
          ) : null}

          <Pressable
            onPress={handleCancel}
            disabled={phase !== "counting"}
            className={`mt-5 border border-red-200 bg-red-50 px-4 py-3 rounded-3xl ${
              phase !== "counting" ? "opacity-60" : ""
            }`}
          >
            <Text className="text-center text-red-600 font-semibold">
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
