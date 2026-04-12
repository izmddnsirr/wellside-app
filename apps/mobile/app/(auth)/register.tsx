import { Ionicons } from "@expo/vector-icons";
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

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { email, password, setEmail, setPassword } = useOnboarding();
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onRegister = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      const message = "Email is required.";
      setErrorMessage(message);
      Alert.alert("Check your details", message);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      const message = "Please enter a valid email.";
      setErrorMessage(message);
      Alert.alert("Check your details", message);
      return;
    }
    if (password.length < 6) {
      const message = "Password must be at least 6 characters.";
      setErrorMessage(message);
      Alert.alert("Check your details", message);
      return;
    }
    if (password !== confirmPassword) {
      const message = "Passwords do not match.";
      setErrorMessage(message);
      Alert.alert("Check your details", message);
      return;
    }
    setErrorMessage("");
    router.push("/(onboarding)/details");
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
                Create account.
              </Text>
              <Text className="text-slate-600 text-base mt-1 mb-6">
                Your personal barber.
              </Text>
            </View>

            {/* EMAIL */}
            <Text className="text-xs font-semibold text-slate-600 mb-3 tracking-[0.2em]">
              Email
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-3xl p-5 text-base leading-5 mb-6 text-slate-900"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(value) => setEmail(value)}
            />

            {/* PASSWORD */}
            <Text className="text-xs font-semibold text-slate-600 mb-3 tracking-[0.2em]">
              Password
            </Text>
            <View className="relative mb-6">
              <TextInput
                className="bg-white border border-slate-200 rounded-3xl p-5 pr-12 text-base leading-5 text-slate-900"
                placeholder="Enter your password"
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                value={password}
                onChangeText={(value) => setPassword(value)}
              />
              <Pressable
                onPress={() => setIsPasswordVisible((value) => !value)}
                style={{
                  position: "absolute",
                  right: 18,
                  top: "50%",
                  marginTop: -11,
                }}
                hitSlop={10}
              >
                <Ionicons
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#0f172a"
                />
              </Pressable>
            </View>

            {/* CONFIRM PASSWORD */}
            <Text className="text-xs font-semibold text-slate-600 mb-3 tracking-[0.2em]">
              Confirm Password
            </Text>
            <View className="relative mb-6">
              <TextInput
                className="bg-white border border-slate-200 rounded-3xl p-5 pr-12 text-base leading-5 text-slate-900"
                placeholder="Confirm your password"
                secureTextEntry={!isConfirmPasswordVisible}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Pressable
                onPress={() =>
                  setIsConfirmPasswordVisible((value) => !value)
                }
                style={{
                  position: "absolute",
                  right: 18,
                  top: "50%",
                  marginTop: -11,
                }}
                hitSlop={10}
              >
                <Ionicons
                  name={
                    isConfirmPasswordVisible ? "eye-off-outline" : "eye-outline"
                  }
                  size={22}
                  color="#0f172a"
                />
              </Pressable>
            </View>

            {errorMessage ? (
              <Text className="text-sm text-red-600 mb-4">{errorMessage}</Text>
            ) : null}

            {/* Register Button */}
            <Pressable
              onPress={onRegister}
              className="bg-slate-900 p-4 mt-2 rounded-full active:opacity-80 mb-6"
            >
              <Text className="text-center text-white font-semibold text-lg">
                Next
              </Text>
            </Pressable>

            {/* Login Link */}
            <View className="flex-row justify-center mb-4">
              <Text className="text-base text-slate-600">
                Already have an account?{" "}
              </Text>
              <Pressable onPress={() => router.back()}>
                <Text className="text-base font-semibold text-slate-900">
                  Login
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
