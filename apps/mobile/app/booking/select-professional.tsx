import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarberListSkeleton } from "../../components/booking-skeletons";
import {
  BookingPageTransition,
  BookingStaggerItem,
  BookingStaggerList,
} from "../../components/motion";
import { useBooking } from "../../context/BookingContext";
import { getBarberRatings } from "../../utils/barber-ratings";
import { supabase } from "../../utils/supabase";

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

export default function SelectProfessionalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedBarber, setBarber } = useBooking();
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ratings, setRatings] = useState(
    new Map<string, { average: number; count: number }>()
  );
  const isMountedRef = useRef(true);

  const fetchBarbers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
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
      setErrorMessage("Unable to load professionals right now.");
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
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBarbers();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBarbers]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchBarbers();
    setIsRefreshing(false);
  }, [fetchBarbers]);

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

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
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
            <Ionicons name="arrow-back" size={22} color="#171717" />
          </Pressable>
          <Pressable
            onPress={() => {
              router.dismissAll();
              router.replace("/(tabs)/booking");
            }}
            className="h-10 w-10 items-center justify-center"
            hitSlop={10}
          >
            <Ionicons name="close" size={24} color="#171717" />
          </Pressable>
        </View>

        <BookingPageTransition className="px-5 pt-2">
          <Text className="text-3xl font-semibold text-neutral-900">
            Select barbers
          </Text>
          <Text className="mt-1 text-base text-neutral-500">
            Choose your preferred barber.
          </Text>
        </BookingPageTransition>

        <View className="px-5 pt-6">
          {isLoading ? (
            <BarberListSkeleton />
          ) : null}
          {errorMessage ? (
            <Text className="mt-2 text-sm text-red-500">{errorMessage}</Text>
          ) : null}
          {!isLoading && !errorMessage && barbers.length === 0 ? (
            <Text className="mt-2 text-sm text-neutral-500">
              No barbers available right now.
            </Text>
          ) : null}
          <BookingStaggerList>
          {!isLoading && professionals.map((pro) => (
            <BookingStaggerItem key={pro.id}>
              <Pressable
                onPress={() => {
                  setBarber({ id: pro.id, displayName: pro.name });
                  router.push("/booking/select-time");
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
  );
}
