import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "../../context/OnboardingContext";
import { supabase } from "../../utils/supabase";

export default function DetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    setFirstName,
    setLastName,
    setPhone,
    reset,
  } = useOnboarding();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onRegister = async () => {
    if (!email.trim() || !password) {
      const message = "Please complete your account details first.";
      setErrorMessage(message);
      Alert.alert("Check your details", message);
      return;
    }
    if (!firstName.trim()) {
      const message = "First name is required.";
      setErrorMessage(message);
      Alert.alert("Check your details", message);
      return;
    }
    if (!lastName.trim()) {
      const message = "Last name is required.";
      setErrorMessage(message);
      Alert.alert("Check your details", message);
      return;
    }
    if (phone.trim().length < 8) {
      const message = "Please enter a valid phone number.";
      setErrorMessage(message);
      Alert.alert("Check your details", message);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          role: "customer",
        },
      },
    });

    if (error) {
      setIsSubmitting(false);
      setErrorMessage(error.message);
      Alert.alert("Sign-up failed", error.message);
      return;
    }

    const registeredUser = data.session?.user ?? data.user;
    if (registeredUser) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: registeredUser.id,
            email: registeredUser.email ?? email.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            role: "customer",
          },
          { onConflict: "id" }
        );

      if (profileError) {
        setIsSubmitting(false);
        setErrorMessage(profileError.message);
        Alert.alert("Profile setup failed", profileError.message);
        return;
      }
    }

    reset();
    setIsSubmitting(false);
    if (!data.session) {
      Alert.alert(
        "Confirm your email",
        "Check your inbox to confirm your email before signing in.",
        [
          {
            text: "OK",
            onPress: () => {
              router.dismissAll();
              router.replace("/(auth)/login");
            },
          },
        ]
      );
      return;
    }

    router.replace("/(tabs)");
  };

  return (
    <View
      className="flex-1 px-5 bg-slate-50"
      style={{ paddingTop: insets.top }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            {/* Top Header */}
            <View className="mt-3">
              <Text className="text-3xl mt-1 font-semibold text-slate-900">
                Enter Details.
              </Text>
              <Text className="text-slate-600 text-base mt-1 mb-6">
                Register now to book your seat.
              </Text>
            </View>

            {/* FULL NAME */}
            <Text className="text-xs font-semibold text-slate-600 mb-3 tracking-[0.2em]">
              First Name
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-3xl p-5 text-base leading-5 mb-6 text-slate-900"
              placeholder="Enter your first name"
              autoCapitalize="words"
              value={firstName}
              onChangeText={(value) => setFirstName(value)}
            />

            {/* FULL NAME */}
            <Text className="text-xs font-semibold text-slate-600 mb-3 tracking-[0.2em]">
              Last Name
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-3xl p-5 text-base leading-5 mb-6 text-slate-900"
              placeholder="Enter your last name"
              autoCapitalize="words"
              value={lastName}
              onChangeText={(value) => setLastName(value)}
            />

            {/* PHONE NUMBER */}
            <Text className="text-xs font-semibold text-slate-600 mb-3 tracking-[0.2em]">
              Phone Number
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-3xl p-5 text-base leading-5 mb-6 text-slate-900"
              placeholder="Enter your phone number"
              keyboardType="number-pad"
              autoCapitalize="none"
              value={phone}
              onChangeText={(value) => setPhone(value)}
            />

            {errorMessage ? (
              <Text className="text-sm text-red-600 mb-4">{errorMessage}</Text>
            ) : null}

            {/* Register Button */}
            <Pressable
              onPress={onRegister}
              disabled={isSubmitting}
              className={`bg-slate-900 p-4 mt-2 rounded-full active:opacity-80 mb-6 ${
                isSubmitting ? "opacity-60" : ""
              }`}
            >
              <Text className="text-center text-white font-semibold text-lg">
                {isSubmitting ? "Creating account..." : "Register"}
              </Text>
            </Pressable>

            {/* Login Link */}
            {/* <View className="flex-row justify-center mb-4">
              <Text className="text-base text-slate-600">
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.replace("/(auth)/login")}>
                <Text className="text-base font-semibold text-slate-900">
                  Login
                </Text>
              </Pressable>
            </View> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
