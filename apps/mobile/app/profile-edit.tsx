import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../utils/supabase";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

export default function ProfileEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (!isMounted) {
        return;
      }
      if (authError || !authData.user) {
        setIsLoading(false);
        Alert.alert(
          "Unable to load profile",
          authError?.message ?? "Please sign in again."
        );
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name,last_name,phone")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }
      if (profileError) {
        setIsLoading(false);
        Alert.alert("Unable to load profile", profileError.message);
        return;
      }

      setProfile({
        id: authData.user.id,
        first_name: profileData?.first_name ?? null,
        last_name: profileData?.last_name ?? null,
        phone: profileData?.phone ?? null,
      });
      setFirstName(profileData?.first_name ?? "");
      setLastName(profileData?.last_name ?? "");
      setPhone(profileData?.phone ?? "");
      setIsLoading(false);
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const onSave = async () => {
    if (!profile) {
      return;
    }
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirst || !trimmedLast) {
      Alert.alert("Check your details", "First and last name are required.");
      return;
    }
    if (trimmedPhone && trimmedPhone.length < 8) {
      Alert.alert("Check your details", "Please enter a valid phone number.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: trimmedFirst,
        last_name: trimmedLast,
        phone: trimmedPhone || null,
      })
      .eq("id", profile.id);

    if (error) {
      setIsSaving(false);
      Alert.alert("Update failed", error.message);
      return;
    }

    setIsSaving(false);
    router.back();
  };

  const onDelete = async () => {
    if (!profile) {
      return;
    }
    Alert.alert(
      "Delete profile?",
      "This removes your profile record. Your auth account remains.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("profiles")
              .delete()
              .eq("id", profile.id);

            if (error) {
              Alert.alert("Delete failed", error.message);
              return;
            }

            router.back();
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex-row items-center justify-between px-5 pt-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center"
            hitSlop={10}
          >
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </Pressable>
          <View className="h-10 w-10" />
        </View>

        <View className="px-5 pt-2">
          <Text className="text-3xl font-semibold text-slate-900">
            Edit profile
          </Text>
          <Text className="mt-1 text-base text-slate-600">
            Update your details
          </Text>
        </View>

        {isLoading ? (
          <View className="mt-10 items-center">
            <ActivityIndicator size="small" color="#111827" />
          </View>
        ) : (
          <View className="px-5 pt-7">
            <Text className="text-xs font-semibold text-slate-600 mb-3 tracking-[0.2em]">
              First Name
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-3xl p-5 text-base leading-5 mb-6 text-slate-900"
              placeholder="Enter your first name"
              autoCapitalize="words"
              value={firstName}
              onChangeText={setFirstName}
            />

            <Text className="text-xs font-semibold text-slate-600 mb-3 tracking-[0.2em]">
              Last Name
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-3xl p-5 text-base leading-5 mb-6 text-slate-900"
              placeholder="Enter your last name"
              autoCapitalize="words"
              value={lastName}
              onChangeText={setLastName}
            />

            <Text className="text-xs font-semibold text-slate-600 mb-3 tracking-[0.2em]">
              Phone Number
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-3xl p-5 text-base leading-5 mb-6 text-slate-900"
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              autoCapitalize="none"
              value={phone}
              onChangeText={setPhone}
            />

            <TouchableOpacity
              onPress={onSave}
              disabled={isSaving}
              className={`bg-slate-900 p-4 rounded-full active:opacity-80 ${
                isSaving ? "opacity-60" : ""
              }`}
            >
              <Text className="text-center text-white font-semibold text-lg">
                {isSaving ? "Saving..." : "Save changes"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDelete}
              className="mt-4 border border-red-200 bg-red-50 p-4 rounded-full active:opacity-80"
            >
              <Text className="text-center text-red-600 font-semibold text-lg">
                Delete profile
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
