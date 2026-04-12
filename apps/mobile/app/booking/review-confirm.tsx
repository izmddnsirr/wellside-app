import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBooking } from "../../context/BookingContext";
import { supabase } from "../../utils/supabase";

const TIME_ZONE = "Asia/Kuala_Lumpur";
const dateLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const timeLabelFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

function formatTimeLabel(value?: string) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return timeLabelFormatter.format(parsed);
}

function formatTimeRange(startAt?: string, endAt?: string) {
  const startLabel = formatTimeLabel(startAt);
  const endLabel = formatTimeLabel(endAt);
  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }
  if (startLabel) {
    return startLabel;
  }
  if (endLabel) {
    return endLabel;
  }
  return null;
}

export default function ReviewConfirmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedService, selectedBarber, selectedDate, selectedSlot } =
    useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dateLabel = selectedDate?.date
    ? dateLabelFormatter.format(selectedDate.date)
    : "Select date";
  const slotLabel =
    selectedSlot?.label ??
    formatTimeRange(selectedSlot?.startAt, selectedSlot?.endAt) ??
    "Select time";
  const duration = selectedService?.durationMinutes
    ? `${selectedService.durationMinutes} min`
    : "Duration unavailable";
  const barberName = selectedBarber?.displayName ?? "Select professional";
  const subtotal = selectedService?.basePrice ?? 0;
  const total = selectedService?.basePrice ?? 0;
  const canConfirm =
    !!selectedService && !!selectedBarber && !!selectedDate && !!selectedSlot;

  const handleConfirm = async () => {
    if (!canConfirm || isSubmitting) {
      if (!canConfirm) {
        setErrorMessage("Please complete all booking details.");
      }
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setIsSubmitting(false);
      setErrorMessage("Please sign in again to confirm your booking.");
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
      setIsSubmitting(false);
      setErrorMessage("Unable to confirm booking right now.");
      return;
    }

    if (existingBooking) {
      setIsSubmitting(false);
      setErrorMessage("You already have an active booking.");
      return;
    }

    setIsSubmitting(false);
    router.push({
      pathname: "/booking/confirming",
      params: {
        startedAt: String(Date.now()),
      },
    });
  };

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        <View className="flex-row items-center justify-between px-5 pt-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </Pressable>
          <Pressable
            onPress={() => {
              router.dismissAll();
              router.replace("/(tabs)/booking");
            }}
            className="h-10 w-10 items-center justify-center"
            hitSlop={10}
          >
            <Ionicons name="close" size={24} color="#0f172a" />
          </Pressable>
        </View>

        <View className="px-5 pt-2">
          <Text className="text-3xl font-semibold text-slate-900">
            Review and confirm
          </Text>
        </View>

        <View className="mt-6 px-5">
          <View className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
            <View className="relative">
              <View className="bg-slate-900 px-5 py-4">
                <Text className="text-xs font-semibold tracking-[0.2em] text-slate-300">
                  Booking Details
                </Text>
                <Text className="mt-2 text-lg font-semibold text-white">
                  {dateLabel}
                </Text>
                <Text className="mt-1 text-sm text-slate-300">
                  {slotLabel}
                </Text>
              </View>

              <View className="px-5 py-4">
                <Text className="text-xs font-semibold text-slate-500 tracking-[0.2em]">
                  Appointment
                </Text>
                <View className="mt-3 flex-row items-center">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <Ionicons name="calendar-outline" size={16} color="#0f172a" />
                  </View>
                  <Text className="ml-3 text-base font-semibold text-slate-900">
                    {dateLabel}
                  </Text>
                </View>
                <View className="mt-3 flex-row items-center">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <Ionicons name="time-outline" size={16} color="#0f172a" />
                  </View>
                  <Text className="ml-3 text-base font-semibold text-slate-900">
                    {slotLabel}
                  </Text>
                </View>
                <View className="mt-3 flex-row items-center">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <Ionicons name="person-outline" size={16} color="#0f172a" />
                  </View>
                  <Text className="ml-3 text-base font-semibold text-slate-900">
                    {barberName}
                  </Text>
                </View>
              </View>

              <View className="relative">
                <View className="h-px border-t border-dashed border-slate-200" />
                <View className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-slate-200 bg-slate-50" />
                <View className="absolute -right-3 -top-3 h-6 w-6 rounded-full border border-slate-200 bg-slate-50" />
              </View>

              <View className="px-5 py-4">
                <Text className="text-xs font-semibold text-slate-500 tracking-[0.2em]">
                  Service
                </Text>
                <View className="mt-3 flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-semibold text-slate-900">
                      {selectedService?.name ?? "Service not selected"}
                    </Text>
                    <Text className="mt-1 text-sm text-slate-600">
                      {duration}
                    </Text>
                  </View>
                  <Text className="text-base font-semibold text-slate-900">
                    RM {subtotal}
                  </Text>
                </View>
              </View>

              <View className="h-px bg-slate-200" />

              <View className="px-5 py-4">
                <Text className="text-xs font-semibold text-slate-500 tracking-[0.2em]">
                  Summary
                </Text>
                
                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-slate-900">
                    Total
                  </Text>
                  <Text className="text-lg font-semibold text-slate-900">
                    MYR {total}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {errorMessage ? (
          <View className="mt-4 px-5">
            <Text className="text-sm text-red-500">{errorMessage}</Text>
          </View>
        ) : null}

      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-5 py-4"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base font-semibold text-slate-900">
              MYR {total}
            </Text>
            <Text className="mt-1 text-sm text-slate-600">
              {selectedService ? "1 service" : "No service"} · {duration}
            </Text>
          </View>
          <Pressable
            onPress={handleConfirm}
            disabled={!canConfirm || isSubmitting}
            className={`rounded-full px-8 py-4 mb-2 ${
              !canConfirm || isSubmitting
                ? "bg-slate-200"
                : "bg-slate-900"
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Confirm Booking
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
