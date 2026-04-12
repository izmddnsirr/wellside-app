import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBooking } from "../../context/BookingContext";
import { getAvailableSlots } from "../../utils/slots";
import { getClosedDatesMap } from "../../utils/shop-operations";
import { supabase } from "../../utils/supabase";

const TIME_ZONE = "Asia/Kuala_Lumpur";
const MAX_DAYS_AHEAD = 14;

type DateOption = {
  id: string;
  label: string;
  detail: string;
  date: Date;
};

type Slot = {
  label: string;
  start_at: string;
  end_at: string;
};

type ClosedDateMap = Record<
  string,
  {
    reason: string;
    source: "temporary" | "weekly";
  }
>;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "long",
});

const monthYearFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  month: "long",
  year: "numeric",
});

function getDateParts(date: Date) {
  const parts = dateFormatter.formatToParts(date);
  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(getPart("year")),
    month: Number(getPart("month")),
    day: Number(getPart("day")),
    weekday: getPart("weekday"),
  };
}

function formatISOFromParts(parts: {
  year: number;
  month: number;
  day: number;
}) {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

function formatDateISO(date: Date) {
  return formatISOFromParts(getDateParts(date));
}

function buildDateOptions(): DateOption[] {
  const now = new Date();
  const todayParts = getDateParts(now);
  const todayUTC = new Date(
    Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day)
  );

  return Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, index) => {
    const date = new Date(todayUTC);
    date.setUTCDate(todayUTC.getUTCDate() + index);

    const parts = getDateParts(date);
    const id = formatISOFromParts(parts);

    return {
      id,
      label: String(parts.day),
      detail: parts.weekday,
      date,
    };
  });
}

type BarberRow = {
  id: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
};

export default function SelectTimeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    selectedBarber,
    selectedDate,
    selectedSlot,
    setBarber,
    setDate,
    setSlot,
  } = useBooking();
  const [isBarberModalVisible, setIsBarberModalVisible] = useState(false);
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(true);
  const [barberError, setBarberError] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [closedDates, setClosedDates] = useState<ClosedDateMap>({});
  const [timeSlots, setTimeSlots] = useState<Slot[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMountedRef = useRef(true);
  const dateOptions = useMemo(() => buildDateOptions(), []);

  const barberName = selectedBarber?.displayName ?? "Select barber";
  const dateISO = useMemo(() => {
    if (!selectedDate) {
      return null;
    }
    return formatDateISO(selectedDate.date);
  }, [selectedDate]);
  const selectedDateClosure = dateISO ? closedDates[dateISO] : undefined;
  const monthYearLabel = useMemo(() => {
    const baseDate = selectedDate?.date ?? dateOptions[0]?.date;
    return baseDate ? monthYearFormatter.format(baseDate) : "";
  }, [dateOptions, selectedDate]);

  const fetchBarbers = useCallback(async () => {
    setIsLoadingBarbers(true);
    setBarberError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,role,first_name,last_name,display_name,avatar_url,is_active"
      )
      .eq("is_active", true)
      .eq("role", "barber")
      .order("display_name");

    if (!isMountedRef.current) {
      return;
    }

    if (error) {
      setBarberError("Unable to load professionals right now.");
      setBarbers([]);
    } else {
      setBarbers(data ?? []);
    }
    setIsLoadingBarbers(false);
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!selectedBarber?.id || !dateISO) {
      if (isMountedRef.current) {
        setTimeSlots([]);
      }
      return;
    }

    const closure = closedDates[dateISO];
    if (closure) {
      if (isMountedRef.current) {
        setSlotError(closure.reason);
        setTimeSlots([]);
      }
      return;
    }

    setIsLoadingSlots(true);
    setSlotError(null);
    try {
      const slots = await getAvailableSlots(selectedBarber.id, dateISO);
      if (isMountedRef.current) {
        setTimeSlots(slots);
      }
    } catch {
      if (isMountedRef.current) {
        setSlotError("Unable to load available slots right now.");
        setTimeSlots([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoadingSlots(false);
      }
    }
  }, [closedDates, dateISO, selectedBarber?.id]);

  useEffect(() => {
    fetchBarbers();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBarbers]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    let active = true;
    const fromISO = dateOptions[0]?.id;
    const toISO = dateOptions[dateOptions.length - 1]?.id;

    if (!fromISO || !toISO) {
      return;
    }

    (async () => {
      try {
        const closed = await getClosedDatesMap(supabase, fromISO, toISO);
        if (active && isMountedRef.current) {
          setClosedDates(closed);
        }
      } catch {
        if (active && isMountedRef.current) {
          setClosedDates({});
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [dateOptions]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchBarbers(), fetchSlots()]);
    setIsRefreshing(false);
  }, [fetchBarbers, fetchSlots]);

  const professionals = useMemo(() => {
    return barbers.map((barber) => {
      const displayName =
        barber.display_name?.trim() ||
        [barber.first_name, barber.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        "Barber";

      return {
        id: barber.id,
        name: displayName,
        avatarUrl: barber.avatar_url ?? null,
      };
    });
  }, [barbers]);

  useEffect(() => {
    if (!selectedDate) {
      const fallbackDate = dateOptions[0];
      setDate({
        id: fallbackDate.id,
        label: fallbackDate.label,
        detail: fallbackDate.detail,
        date: fallbackDate.date,
      });
    }
  }, [dateOptions, selectedDate, setDate]);

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
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
            Select time
          </Text>
          <Text className="mt-1 text-base text-slate-600">
            Pick a slot that fits your day.
          </Text>
        </View>

        <View className="px-5 mt-5 flex-row items-center justify-between">
          <Pressable
            onPress={() => setIsBarberModalVisible(true)}
            className="flex-row items-center rounded-full border border-slate-200 bg-white px-4 py-3"
          >
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-slate-200">
              <Text className="text-xs font-semibold text-slate-900">
                {barberName
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </Text>
            </View>
            <Text className="text-sm font-semibold text-slate-900">
              {barberName}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#0f172a"
              style={{ marginLeft: 8 }}
            />
          </Pressable>
          <View className="h-12 w-12" />
        </View>

        <View className="px-5 mt-6">
          <Text className="text-base font-semibold text-slate-900">
            {monthYearLabel}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 mt-4"
        >
          <View className="flex-row">
            {dateOptions.map((option) => {
              const isSelected = option.id === selectedDate?.id;
              const isClosed = Boolean(closedDates[option.id]);
              return (
                <Pressable
                  key={option.id}
                  disabled={isClosed}
                  onPress={() =>
                    setDate({
                      id: option.id,
                      label: option.label,
                      detail: option.detail,
                      date: option.date,
                    })
                  }
                  className={`mr-4 items-center ${isClosed ? "opacity-50" : ""}`}
                >
                  <View
                    className={`h-20 w-20 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-transparent bg-slate-900"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-lg font-semibold ${
                        isSelected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                  <Text
                    className={`mt-2 text-sm ${
                      isSelected ? "text-slate-900" : "text-slate-600"
                    }`}
                  >
                    {isClosed ? "Closed" : option.detail}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View className="px-5 mt-6">
          {isLoadingSlots ? (
            <Text className="text-sm text-slate-600">
              Loading available slots...
            </Text>
          ) : null}
          {slotError ? (
            <Text className="text-sm text-red-500">{slotError}</Text>
          ) : null}
          {!slotError && selectedDateClosure ? (
            <Text className="text-sm text-red-500">{selectedDateClosure.reason}</Text>
          ) : null}
          {!isLoadingSlots && !slotError && timeSlots.length === 0 ? (
            <Text className="text-sm text-slate-600">No available slots.</Text>
          ) : null}
          {timeSlots.map((slot) => {
            const isSelected = slot.label === selectedSlot?.label;
            return (
              <Pressable
                key={slot.label}
                onPress={() => {
                  setSlot({
                    startAt: slot.start_at,
                    endAt: slot.end_at,
                    label: slot.label,
                  });
                  router.push("/booking/review-confirm");
                }}
                className={`mb-4 rounded-3xl border px-4 py-5 ${
                  isSelected
                    ? "border-slate-900 bg-slate-900"
                    : "border-slate-200 bg-white"
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    isSelected ? "text-white" : "text-slate-900"
                  }`}
                >
                  {slot.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={isBarberModalVisible}
        animationType="slide"
        onRequestClose={() => setIsBarberModalVisible(false)}
      >
        <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between px-5 pt-3">
            <Pressable
              onPress={() => setIsBarberModalVisible(false)}
              className="h-10 w-10 items-center justify-center"
              hitSlop={10}
            >
              <Ionicons name="close" size={24} color="#0f172a" />
            </Pressable>
          </View>

          <View className="px-5 pt-2">
            <Text className="text-3xl font-semibold text-slate-900">
              Select barber
            </Text>
            <Text className="mt-1 text-base text-slate-600">
              Switch to another barber.
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View className="px-5 pt-6 flex-row flex-wrap justify-between">
              {isLoadingBarbers ? (
                <Text className="mt-2 text-sm text-slate-600">
                  Loading barbers...
                </Text>
              ) : null}
              {barberError ? (
                <Text className="mt-2 text-sm text-red-500">{barberError}</Text>
              ) : null}
              {!isLoadingBarbers && !barberError && barbers.length === 0 ? (
                <Text className="mt-2 text-sm text-slate-600">
                  No barbers available right now.
                </Text>
              ) : null}
              {professionals.map((pro) => (
                <Pressable
                  key={pro.id}
                  onPress={() => {
                    setBarber({ id: pro.id, displayName: pro.name });
                    setIsBarberModalVisible(false);
                  }}
                  className="mb-4 w-[48%] items-center rounded-3xl border border-slate-200 bg-white p-5"
                >
                  <View className="items-center">
                    {pro.avatarUrl ? (
                      <Image
                        source={{ uri: pro.avatarUrl }}
                        className="h-16 w-16 rounded-full"
                      />
                    ) : (
                      <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                        <Text className="text-base font-semibold text-slate-900">
                          {pro.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="mt-4 text-center text-base font-semibold text-slate-900">
                    {pro.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
