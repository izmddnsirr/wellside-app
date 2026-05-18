import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ServiceListSkeleton } from "../../components/booking-skeletons";
import {
  BookingPageTransition,
  BookingStaggerItem,
  BookingStaggerList,
} from "../../components/motion";
import { useBooking } from "../../context/BookingContext";
import { supabase } from "../../utils/supabase";
import { loadBookingAvailability } from "../../utils/shop-operations";

type ServiceRow = {
  id: string;
  service_code: string | null;
  name: string;
  base_price: number | null;
  duration_minutes: number;
  is_active: boolean;
  allow_booking: boolean;
};

export default function SelectServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setService } = useBooking();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const isMountedRef = useRef(true);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const isBookingEnabled = await loadBookingAvailability(supabase as never);
    if (!isMountedRef.current) {
      return;
    }

    setBookingEnabled(isBookingEnabled);

    if (!isBookingEnabled) {
      setServices([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("services")
      .select("id,service_code,name,base_price,duration_minutes,is_active,allow_booking")
      .eq("is_active", true)
      .eq("allow_booking", true)
      .order("service_code", { ascending: true })
      .order("name", { ascending: true });

    if (!isMountedRef.current) {
      return;
    }

    if (error) {
      setErrorMessage("Unable to load services right now.");
      setServices([]);
    } else {
      setServices(data ?? []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchServices();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchServices]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchServices();
    setIsRefreshing(false);
  }, [fetchServices]);

  const groupedServices = useMemo(() => {
    return [
      {
        category: "Services",
        items: services,
      },
    ];
  }, [services]);

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
          <Text className="text-3xl font-semibold text-neutral-900">Select Services</Text>
          <Text className="mt-1 text-base text-neutral-500">
            Choose your cut and finishing.
          </Text>
        </BookingPageTransition>

        <View className="px-5">
          {isLoading ? (
            <ServiceListSkeleton />
          ) : null}
          {errorMessage ? (
            <Text className="mt-6 text-sm text-red-500">{errorMessage}</Text>
          ) : null}
          {!isLoading && !errorMessage && !bookingEnabled ? (
            <View className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <Text className="text-base font-semibold text-amber-900">
                Online booking is paused
              </Text>
              <Text className="mt-2 text-sm leading-5 text-amber-800">
                The shop is not accepting online bookings right now. Please
                check again later or contact the shop.
              </Text>
            </View>
          ) : null}
          {!isLoading && !errorMessage && services.length === 0 ? (
            <Text
              className={`mt-6 text-sm text-neutral-500 ${
                !bookingEnabled ? "hidden" : ""
              }`}
            >
              No services available right now.
            </Text>
          ) : null}
          {!isLoading && bookingEnabled ? groupedServices.map((group) => (
            <View key={group.category} className="pt-7">
              <Text className="text-xs font-semibold text-neutral-500">
                {group.category}
              </Text>
              <BookingStaggerList>
              {group.items.map((service, index) => (
                <BookingStaggerItem
                  key={service.id}
                  className={`mt-4 rounded-2xl border border-neutral-200 bg-white p-4 ${
                    index === group.items.length - 1 ? "mb-2" : ""
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="text-base font-semibold text-neutral-900">
                        {service.name}
                      </Text>
                      <View className="mt-2 flex-row items-center">
                        <View className="rounded-full bg-neutral-100 px-3 py-1">
                          <Text className="text-xs font-semibold text-neutral-700">
                            {service.duration_minutes} min
                          </Text>
                        </View>
                        <View className="ml-2 rounded-full bg-neutral-900 px-3 py-1">
                          <Text className="text-xs font-semibold text-white">
                            MYR {service.base_price ?? 0}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => {
                        setService({
                          id: service.id,
                          name: service.name,
                          basePrice: service.base_price,
                          durationMinutes: service.duration_minutes,
                        });
                        router.push("/booking/select-professional");
                      }}
                      className="h-12 w-12 items-center justify-center rounded-full bg-neutral-900"
                    >
                      <Ionicons name="add" size={22} color="#ffffff" />
                    </Pressable>
                  </View>
                </BookingStaggerItem>
              ))}
              </BookingStaggerList>
            </View>
          )) : null}
        </View>
      </ScrollView>
    </View>
  );
}
