import { useRouter } from "expo-router";
import { useState } from "react";
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
import { supabase } from "../../utils/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSendReset = async () => {
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

    setIsSubmitting(true);
    setErrorMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      Alert.alert("Reset failed", error.message);
      return;
    }

    Alert.alert(
      "Check your email",
      "We sent a password reset link to your inbox.",
      [
        {
          text: "OK",
          onPress: () => {
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 px-5 bg-slate-50" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 22 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View className="mt-3">
              <Text className="text-3xl mt-1 font-semibold text-slate-900">
                Reset password.
              </Text>
              <Text className="text-slate-600 text-base mt-1">
                Enter your email to receive a reset link.
              </Text>
            </View>

            <Text className="text-xs font-semibold text-slate-600 mb-3 tracking-[0.2em] mt-6">
              Email
            </Text>
            <TextInput
              className="bg-white border border-slate-200 rounded-3xl p-5 text-base leading-5 mb-6 text-slate-900"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {errorMessage ? (
              <Text className="text-sm text-red-600 mb-4">{errorMessage}</Text>
            ) : null}

            <Pressable
              onPress={onSendReset}
              disabled={isSubmitting}
              className={`bg-slate-900 p-4 mt-2 rounded-full active:opacity-80 mb-6 ${
                isSubmitting ? "opacity-60" : ""
              }`}
            >
              <Text className="text-center text-white font-semibold text-lg">
                {isSubmitting ? "Sending..." : "Send reset link"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              className="items-center"
            >
              <Text className="text-sm font-semibold text-slate-900">
                Back to login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
