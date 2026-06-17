import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ProfileCardSkeleton,
  ProfileHistorySkeleton,
} from "../../components/booking-skeletons";
import { getExpoPushToken } from "../../utils/notifications";
import { supabase } from "../../utils/supabase";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

type HistoryItem = {
  id: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  serviceName: string;
  barberName: string;
  barberId: string | null;
  barberAvatar: string | null;
  basePrice: number | null;
  status: "completed" | "cancelled" | "no_show";
  review: { rating: number; comment: string | null } | null;
};

const TIME_ZONE = "Asia/Kuala_Lumpur";
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});
export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ bookingId: string; barberId: string; barberName: string; barberAvatar: string | null } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      Alert.alert(
        "Unable to load profile",
        authError?.message ?? "Please sign in again."
      );
      setProfile(null);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("first_name,last_name,email,phone,avatar_url")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      Alert.alert("Unable to load profile", profileError.message);
      return;
    }

    setProfile({
      id: authData.user.id,
      first_name: profileData?.first_name ?? null,
      last_name: profileData?.last_name ?? null,
      email: profileData?.email ?? authData.user.email ?? null,
      phone: profileData?.phone ?? null,
      avatar_url: profileData?.avatar_url ?? null,
    });
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setHistory([]);
      setIsHistoryLoading(false);
      return;
    }

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select("id,start_at,end_at,created_at,service_id,barber_id,status")
      .eq("customer_id", authData.user.id)
      .in("status", ["completed", "cancelled", "no_show"])
      .order("created_at", { ascending: false });

    if (bookingError) {
      setHistory([]);
      setIsHistoryLoading(false);
      setHistoryError("Unable to load booking history.");
      return;
    }

    const serviceIds = Array.from(
      new Set((bookingData ?? []).map((b) => b.service_id).filter(Boolean))
    );
    const barberIds = Array.from(
      new Set((bookingData ?? []).map((b) => b.barber_id).filter(Boolean))
    );

    const bookingIds = (bookingData ?? []).map((b) => b.id);

    const [{ data: serviceData }, { data: barberData }, { data: reviewData }] = await Promise.all([
      serviceIds.length
        ? supabase.from("services").select("id,name,base_price").in("id", serviceIds)
        : Promise.resolve({ data: [] }),
      barberIds.length
        ? supabase.from("profiles").select("id,display_name,first_name,last_name,avatar_url").in("id", barberIds)
        : Promise.resolve({ data: [] }),
      bookingIds.length
        ? supabase.from("barber_reviews").select("booking_id,rating,comment").in("booking_id", bookingIds)
        : Promise.resolve({ data: [] }),
    ]);

    const reviewMap = new Map(
      (reviewData ?? []).map((r) => [r.booking_id, { rating: r.rating, comment: r.comment }])
    );

    const serviceMap = new Map(
      (serviceData ?? []).map((service) => [service.id, service])
    );
    const barberMap = new Map(
      (barberData ?? []).map((barber) => {
        const barberName =
          barber.display_name?.trim() ||
          [barber.first_name, barber.last_name]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          "Barber";
        return [barber.id, { name: barberName, avatar: barber.avatar_url ?? null }];
      })
    );

    const historyItems: HistoryItem[] = (bookingData ?? []).map((booking) => {
      const service = serviceMap.get(booking.service_id);
      return {
        id: booking.id,
        startAt: booking.start_at,
        endAt: booking.end_at,
        createdAt: booking.created_at,
        serviceName: service?.name ?? "Service",
        barberName: barberMap.get(booking.barber_id)?.name ?? "Barber",
        barberId: booking.barber_id ?? null,
        barberAvatar: barberMap.get(booking.barber_id)?.avatar ?? null,
        basePrice: service?.base_price ?? null,
        status: booking.status,
        review: reviewMap.get(booking.id) ?? null,
      };
    });

    setHistory(historyItems);
    setIsHistoryLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const load = async () => {
        setIsLoading(true);
        await Promise.all([fetchProfile(), fetchHistory()]);
        if (isMounted) {
          setIsLoading(false);
        }
      };

      load();

      return () => {
        isMounted = false;
      };
    }, [fetchProfile, fetchHistory])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchProfile(), fetchHistory()]);
    setIsRefreshing(false);
  }, [fetchProfile, fetchHistory]);

  const handleAvatarUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow photo library access to change your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert("Upload failed", "Could not read image data.");
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) return;

    setIsUploadingAvatar(true);
    try {
      const mimeType = asset.mimeType ?? "image/jpeg";
      const ext = mimeType.split("/")[1] ?? "jpg";
      const filePath = `${authData.user.id}/avatar.${ext}`;

      // Convert base64 to ArrayBuffer
      const base64 = asset.base64;
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, arrayBuffer, { upsert: true, contentType: mimeType });

      if (uploadError) {
        console.error("[Avatar] Upload error:", JSON.stringify(uploadError));
        throw uploadError;
      }

      console.log("[Avatar] Upload success:", uploadData);

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      console.log("[Avatar] Public URL:", publicUrl);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", authData.user.id);

      if (updateError) {
        console.error("[Avatar] Profile update error:", JSON.stringify(updateError));
        throw updateError;
      }

      setProfile((prev) => prev ? { ...prev, avatar_url: publicUrl } : prev);
      Alert.alert("Success", "Profile picture updated.");
    } catch (err) {
      console.error("[Avatar] Failed:", err);
      Alert.alert("Upload failed", `Error: ${err instanceof Error ? err.message : JSON.stringify(err)}`);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget || reviewRating === 0) return;
    setReviewLoading(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("barber_reviews").insert({
        booking_id: reviewTarget.bookingId,
        customer_id: authData.user.id,
        barber_id: reviewTarget.barberId,
        rating: reviewRating,
        comment: reviewComment.trim() || null,
      });

      if (error) throw error;

      setHistory((prev) =>
        prev.map((item) =>
          item.id === reviewTarget.bookingId
            ? { ...item, review: { rating: reviewRating, comment: reviewComment.trim() || null } }
            : item
        )
      );
      setReviewTarget(null);
      setReviewRating(0);
      setReviewComment("");
      Alert.alert("Thank you!", "Your review has been submitted.");
    } catch {
      Alert.alert("Error", "Failed to submit review. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  };

  const onLogout = async () => {
    Alert.alert("Log out?", "You can sign in again anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          const token = await getExpoPushToken();
          if (token) {
            await supabase.from("device_tokens").delete().eq("token", token);
          }
          const { error } = await supabase.auth.signOut();
          if (error) {
            Alert.alert("Logout failed", error.message);
            return;
          }
          router.replace("/(auth)/start");
        },
      },
    ]);
  };

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");
  const initials = `${profile?.first_name?.[0] ?? ""}${
    profile?.last_name?.[0] ?? ""
  }`.toUpperCase();
  const completedVisits = useMemo(
    () => history.filter((item) => item.status === "completed").length,
    [history]
  );

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Greeting Section */}
        <View className="mx-5 mt-3 flex-row justify-between items-center">
          <View>
            <Text className="text-3xl mt-1 font-semibold text-neutral-900">
              Profile
            </Text>
          </View>
          <TouchableOpacity
            onPress={onLogout}
            className="bg-white px-4 py-3 rounded-full flex-row items-center border border-neutral-200"
          >
            <Ionicons name="log-out-outline" size={16} color="#171717" />
            <Text className="font-semibold text-neutral-900 ml-2">Log out</Text>
          </TouchableOpacity>
        </View>

        {/* Card */}
        {isLoading ? (
          <ProfileCardSkeleton />
        ) : (
        <View className="bg-neutral-900 mx-5 mt-6 rounded-3xl p-5 flex-row items-center">
          <TouchableOpacity
            onPress={handleAvatarUpload}
            disabled={isUploadingAvatar || isLoading}
            className="mr-5"
          >
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#e5e5e5", overflow: "hidden", justifyContent: "center", alignItems: "center" }}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={{ position: "absolute", top: 0, left: 0, width: 64, height: 64 }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-2xl text-neutral-900 font-semibold text-center">
                  {initials || "?"}
                </Text>
              )}
            </View>
            {isUploadingAvatar ? (
              <View className="absolute inset-0 rounded-full bg-black/50 justify-center items-center">
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            ) : (
              <View className="absolute bottom-0 right-0 bg-white rounded-full w-5 h-5 justify-center items-center border border-neutral-200">
                <Ionicons name="camera" size={11} color="#171717" />
              </View>
            )}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text className="text-white font-semibold text-xl">
              {fullName || "Your Profile"}
            </Text>
            <Text className="text-neutral-200 text-base mt-1">
              {profile?.email || "—"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/profile-edit")}
            className="bg-white px-4 py-2 rounded-full active:opacity-80"
          >
            <Text className="font-semibold text-neutral-900">Edit</Text>
          </TouchableOpacity>
        </View>
        )}

        {/* History */}
        <View className="mx-5 mt-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-neutral-900">
              Booking History
            </Text>
            <View className="rounded-full border border-neutral-200 bg-white px-3 py-1">
              <Text className="text-xs font-semibold text-neutral-700">
                {completedVisits} visits
              </Text>
            </View>
          </View>

          <View className="mt-4 rounded-3xl bg-neutral-900 p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-xl font-semibold">
                  Recent visits
                </Text>
                <Text className="text-neutral-300 text-sm mt-1">
                  Track your appointments history
                </Text>
              </View>
              <View className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
                <Ionicons name="time-outline" size={18} color="#e5e5e5" />
              </View>
            </View>

            <View className="mt-5">
              {isHistoryLoading ? (
                <ProfileHistorySkeleton />
              ) : null}
              {historyError ? (
                <View className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-4">
                  <Text className="text-sm text-rose-200">{historyError}</Text>
                </View>
              ) : null}
              {!isHistoryLoading && !historyError && history.length === 0 ? (
                <View className="items-center justify-center rounded-2xl border border-neutral-700 bg-neutral-800 px-6 py-10">
                  <Ionicons name="calendar-outline" size={32} color="#e5e5e5" />
                  <Text className="mt-3 text-sm text-neutral-300 text-center">
                    No visits yet. Your next booking will show up here.
                  </Text>
                </View>
              ) : null}
              {!isHistoryLoading && !historyError && history.length > 0 ? (
                <View>
                  {history.map((item, index) => {
                    const startDate = new Date(item.startAt);
                    const endDate = new Date(item.endAt);
                    const dateLabel = Number.isNaN(startDate.getTime())
                      ? "Date unavailable"
                      : dateFormatter.format(startDate);
                    const timeLabel =
                      Number.isNaN(startDate.getTime()) ||
                      Number.isNaN(endDate.getTime())
                        ? "Time unavailable"
                        : `${timeFormatter.format(
                            startDate
                          )} - ${timeFormatter.format(endDate)}`;
                    return (
                      <View
                        key={item.id}
                        className={`rounded-2xl border border-neutral-200 bg-white px-4 py-3 ${
                          index === history.length - 1 ? "" : "mb-3"
                        }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-base font-semibold text-neutral-900">
                            {item.serviceName}
                          </Text>
                          <View
                            className={`rounded-full px-3 py-1 ${
                              item.status === "cancelled"
                                ? "bg-rose-100"
                                : item.status === "no_show"
                                  ? "bg-purple-100"
                                  : "bg-emerald-100"
                            }`}
                          >
                            <Text
                              className={`text-xs font-semibold ${
                                item.status === "cancelled"
                                  ? "text-rose-700"
                                  : item.status === "no_show"
                                    ? "text-purple-700"
                                    : "text-emerald-700"
                              }`}
                            >
                              {item.status.replace("_", " ").toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-sm text-neutral-500 mt-1">
                          {dateLabel} · {timeLabel}
                        </Text>
                        <View className="mt-2 flex-row items-center justify-between">
                          <Text className="text-sm text-neutral-500">
                            {item.barberName}
                          </Text>
                          <Text className="text-sm font-semibold text-neutral-900">
                            {item.basePrice ? `RM${item.basePrice}` : "Custom"}
                          </Text>
                        </View>
                        {item.status === "completed" && (
                          <View className="mt-2 pt-2 border-t border-neutral-100">
                            {item.review ? (
                              <View className="flex-row items-center gap-1.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Ionicons
                                    key={i}
                                    name={i < item.review!.rating ? "star" : "star-outline"}
                                    size={13}
                                    color={i < item.review!.rating ? "#f59e0b" : "#d4d4d4"}
                                  />
                                ))}
                                {item.review.comment ? (
                                  <Text className="text-xs text-neutral-400 flex-1" numberOfLines={1}>
                                    {item.review.comment}
                                  </Text>
                                ) : null}
                              </View>
                            ) : item.barberId ? (
                              <TouchableOpacity
                                onPress={() => {
                                  setReviewTarget({ bookingId: item.id, barberId: item.barberId!, barberName: item.barberName, barberAvatar: item.barberAvatar });
                                  setReviewRating(0);
                                  setReviewComment("");
                                }}
                                className="flex-row items-center gap-1"
                              >
                                <Ionicons name="star-outline" size={13} color="#a3a3a3" />
                                <Text className="text-xs text-neutral-400">Rate this visit</Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={reviewTarget !== null}
        animationType="none"
        presentationStyle="pageSheet"
        onRequestClose={() => setReviewTarget(null)}
      >
        {reviewTarget && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-white"
            keyboardVerticalOffset={0}
            style={{ paddingTop: 20 }}
          >
            <View className="flex-row items-center justify-between px-5 pb-5">
              <Text className="text-lg font-bold text-neutral-900">Rate your visit</Text>
              <TouchableOpacity
                onPress={() => setReviewTarget(null)}
                className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100"
              >
                <Ionicons name="close" size={16} color="#404040" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-5"
              contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="items-center mb-5">
                {reviewTarget.barberAvatar ? (
                  <Image
                    source={{ uri: reviewTarget.barberAvatar }}
                    className="h-24 w-24 rounded-full"
                    style={{ borderWidth: 3, borderColor: "#e5e5e5" }}
                  />
                ) : (
                  <View className="h-24 w-24 rounded-full bg-neutral-200 items-center justify-center" style={{ borderWidth: 3, borderColor: "#e5e5e5" }}>
                    <Ionicons name="person" size={40} color="#a3a3a3" />
                  </View>
                )}
                <Text className="mt-3 text-base font-semibold text-neutral-900">{reviewTarget.barberName}</Text>
              </View>
              <Text className="text-sm text-neutral-500 text-center">
                How was your session?
              </Text>

              {/* Stars */}
              <View className="flex-row justify-center gap-3 py-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setReviewRating(i + 1)}>
                    <Ionicons
                      name={i < reviewRating ? "star" : "star-outline"}
                      size={36}
                      color={i < reviewRating ? "#f59e0b" : "#d4d4d4"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Comment */}
              <View>
                <Text className="text-sm font-semibold text-neutral-700 mb-2">Comment (optional)</Text>
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Share your experience..."
                  placeholderTextColor="#a3a3a3"
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  className="border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 bg-neutral-50"
                  style={{ textAlignVertical: "top", minHeight: 80 }}
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmitReview}
                disabled={reviewRating === 0 || reviewLoading}
                className={`mt-6 rounded-full py-4 items-center ${
                  reviewRating === 0 ? "bg-neutral-200" : "bg-neutral-900"
                }`}
              >
                <Text className={`font-semibold text-base ${reviewRating === 0 ? "text-neutral-400" : "text-white"}`}>
                  {reviewLoading ? "Submitting..." : "Submit review"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </View>
  );
}
