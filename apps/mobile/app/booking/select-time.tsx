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
import {
  BarberListSkeleton,
  TimeSlotListSkeleton,
} from "../../components/booking-skeletons";
import {
  BookingPageTransition,
  BookingStaggerItem,
  BookingStaggerList,
} from "../../components/motion";
import { useBooking } from "../../context/BookingContext";
import { getBarberRatings } from "../../utils/barber-ratings";
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
  barber_level: string | null;
  is_active: boolean | null;
};

const buildInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const formatRating = (average: number) => average.toFixed(1);

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
  const [ratings, setRatings] = useState(
    new Map<string, { average: number; count: number }>()
  );
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
        "id,role,first_name,last_name,display_name,avatar_url,barber_level,is_active"
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
      setRatings(new Map());
    } else {
      const barberRows = data ?? [];
      setBarbers(barberRows);
      const ratingMap = await getBarberRatings(
        barberRows.map((barber) => barber.id)
      );
      if (isMountedRef.current) {
        setRatings(ratingMap);
      }
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
        level: barber.barber_level?.trim() || null,
        initials: buildInitials(displayName) || "B",
        rating: ratings.get(barber.id) ?? null,
      };
    });
  }, [barbers, ratings]);

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
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
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
            <Ionicons name="arrow-back" size={22} color="#171717" />
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
            hitSlop={10}
          >
            <Ionicons name="close" size={24} color="#171717" />
          </Pressable>
        </View>

        <BookingPageTransition className="px-5 pt-2">
          <Text className="text-3xl font-semibold text-neutral-900">
            Select time
          </Text>
        </BookingPageTransition>

        <BookingStaggerList>
        <BookingStaggerItem className="mt-6 gap-6">
          <View className="px-5">
            {(() => {
              const avatarUrl = professionals.find((p) => p.id === selectedBarber?.id)?.avatarUrl ?? null;
              const initials = barberName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase())
                .join("");
              return (
                <Pressable
                  onPress={() => setIsBarberModalVisible(true)}
                  className="flex-row items-center self-start rounded-full border border-neutral-200 bg-white pl-1.5 pr-4 py-1.5"
                >
                  <View className="mr-3 h-10 w-10 overflow-hidden rounded-full bg-neutral-200 items-center justify-center">
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40 }} resizeMode="cover" />
                    ) : (
                      <Text className="text-xs font-semibold text-neutral-900">
                        {initials || "B"}
                      </Text>
                    )}
                  </View>
                  <Text className="text-sm font-semibold text-neutral-900">
                    {barberName}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="#737373"
                    style={{ marginLeft: 8 }}
                  />
                </Pressable>
              );
            })()}
          </View>

          <View className="gap-4">
            <Text className="px-5 text-base font-semibold text-neutral-900">
              {monthYearLabel}
            </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5"
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
                        ? "border-transparent bg-neutral-900"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-lg font-semibold ${
                        isSelected ? "text-white" : "text-neutral-900"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                  <Text
                    className={`mt-2 text-sm ${
                      isSelected ? "text-neutral-900" : "text-neutral-500"
                    }`}
                  >
                    {isClosed ? "Closed" : option.detail}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
          </View>
        </BookingStaggerItem>
        </BookingStaggerList>

        <BookingStaggerList className="px-5 mt-6">
          {isLoadingSlots ? (
            <TimeSlotListSkeleton />
          ) : null}
          {slotError ? (
            <Text className="text-sm text-red-500">{slotError}</Text>
          ) : null}
          {!slotError && selectedDateClosure ? (
            <Text className="text-sm text-red-500">{selectedDateClosure.reason}</Text>
          ) : null}
          {!isLoadingSlots && !slotError && timeSlots.length === 0 ? (
            <Text className="text-sm text-neutral-500">No available slots.</Text>
          ) : null}
          {!isLoadingSlots && timeSlots.map((slot, index) => {
            const isSelected = slot.label === selectedSlot?.label;
            return (
              <BookingStaggerItem key={slot.label}>
                <Pressable
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
                      ? "border-neutral-900 bg-neutral-900"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      isSelected ? "text-white" : "text-neutral-900"
                    }`}
                  >
                    {slot.label}
                  </Text>
                </Pressable>
              </BookingStaggerItem>
            );
          })}
        </BookingStaggerList>
      </ScrollView>

      <Modal
        visible={isBarberModalVisible}
        animationType="slide"
        onRequestClose={() => setIsBarberModalVisible(false)}
      >
        <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
          <View className="flex-row items-center justify-between px-5 pt-3">
            <Pressable
              onPress={() => setIsBarberModalVisible(false)}
              className="h-10 w-10 items-center justify-center"
              hitSlop={10}
            >
              <Ionicons name="close" size={24} color="#171717" />
            </Pressable>
          </View>

          <View className="px-5 pt-2">
            <Text className="text-3xl font-semibold text-neutral-900">
              Select barber
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          >
            <View className="px-5 pt-6">
              {isLoadingBarbers ? (
                <BarberListSkeleton />
              ) : null}
              {barberError ? (
                <Text className="mt-2 text-sm text-red-500">{barberError}</Text>
              ) : null}
              {!isLoadingBarbers && !barberError && barbers.length === 0 ? (
                <Text className="mt-2 text-sm text-neutral-500">
                  No barbers available right now.
                </Text>
              ) : null}
              <BookingStaggerList>
              {!isLoadingBarbers && professionals.map((pro) => (
                <BookingStaggerItem key={pro.id}>
                  <Pressable
                    onPress={() => {
                      setBarber({ id: pro.id, displayName: pro.name });
                      setIsBarberModalVisible(false);
                    }}
                    className={`mb-4 flex-row items-center rounded-3xl border bg-white px-3 py-3 ${
                      selectedBarber?.id === pro.id
                        ? "border-neutral-900"
                        : "border-neutral-200"
                    }`}
                  >
                  <View className="mr-5">
                    {pro.avatarUrl ? (
                      <Image
                        source={{ uri: pro.avatarUrl }}
                        className="h-20 w-20 rounded-full"
                      />
                    ) : (
                      <View className="h-20 w-20 items-center justify-center rounded-full bg-neutral-200">
                        <Text className="text-lg font-semibold text-neutral-900">
                          {pro.initials}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-base font-semibold text-neutral-900">
                      {pro.name}
                    </Text>
                    <Text className="mt-1 text-sm text-neutral-500">
                      {pro.level ?? "Barber"}
                    </Text>
                    {pro.rating ? (
                      <View className="mt-1.5 flex-row items-center">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Ionicons
                            key={index}
                            name={
                              index < Math.round(pro.rating!.average)
                                ? "star"
                                : "star-outline"
                            }
                            size={12}
                            color={
                              index < Math.round(pro.rating!.average)
                                ? "#f59e0b"
                                : "#d4d4d4"
                            }
                            style={{ marginRight: 1 }}
                          />
                        ))}
                        <Text className="ml-1 text-xs text-neutral-500">
                          {formatRating(pro.rating.average)} ({pro.rating.count})
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  </Pressable>
                </BookingStaggerItem>
              ))}
              </BookingStaggerList>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
