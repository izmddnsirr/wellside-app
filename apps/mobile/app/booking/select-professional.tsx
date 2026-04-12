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
import { useBooking } from "../../context/BookingContext";
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

export default function SelectProfessionalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setBarber } = useBooking();
  const [barbers, setBarbers] = useState<BarberRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
    } else {
      setBarbers(data ?? []);
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
      };
    });
  }, [barbers]);

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
            Select barbers
          </Text>
          <Text className="mt-1 text-base text-slate-600">
            Choose your preferred barber.
          </Text>
        </View>

        <View className="px-5 pt-6 flex-row flex-wrap justify-between">
          {isLoading ? (
            <Text className="mt-2 text-sm text-slate-600">
              Loading barbers...
            </Text>
          ) : null}
          {errorMessage ? (
            <Text className="mt-2 text-sm text-red-500">{errorMessage}</Text>
          ) : null}
          {!isLoading && !errorMessage && barbers.length === 0 ? (
            <Text className="mt-2 text-sm text-slate-600">
              No barbers available right now.
            </Text>
          ) : null}
          {professionals.map((pro) => (
            <Pressable
              key={pro.id}
              onPress={() => {
                setBarber({ id: pro.id, displayName: pro.name });
                router.push("/booking/select-time");
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
              {pro.level ? (
                <Text className="mt-1 text-center text-sm text-slate-600">
                  {pro.level}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
