import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ImageBackground, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const onEmailContinue = () => {
    router.push("/(auth)/login");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/cut.png")}
      resizeMode="cover"
      style={{ flex: 1, paddingTop: insets.top }}
    >
      <View className="flex-1 justify-end">
        <View className="items-center px-5 pb-5">
          <Image
            source={require("../../assets/images/wellside-logo-white.png")}
            style={{ width: 150, height: 55 }}
            resizeMode="contain"
          />
        </View>

        <View
          className="bg-white rounded-t-3xl px-5 pt-7"
          style={{
            paddingBottom: Math.max(insets.bottom, 14),
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: -4 },
            elevation: 10,
          }}
        >
          {/* <Text className="text-center text-2xl font-semibold text-slate-900">
            Log in with
          </Text> */}

          <Text className="text-center text-2xl font-semibold text-slate-900">
            Lets get started.
          </Text>

          {/* <Pressable
            onPress={onGoogleLogin}
            className="mt-6 h-16 w-full items-center justify-center rounded-full border border-slate-300 active:opacity-80"
          >
            <AntDesign name="google" size={22} color="#4285F4" />
          </Pressable> */}

          {/* <View className="mt-6 flex-row items-center justify-center">
            <View className="h-px w-10 bg-slate-200" />
            <Text className="mx-4 text-base text-slate-400">or</Text>
            <View className="h-px w-10 bg-slate-200" />
          </View> */}

          <Pressable
            onPress={onEmailContinue}
            className="mt-6 h-16 w-full flex-row items-center justify-center rounded-full border border-slate-300 active:opacity-80 bg-slate-900"
          >
            <Ionicons name="mail-outline" size={20} color="#ffffff" />
            <Text className="ml-3 text-base font-semibold text-white">
              Continue with email
            </Text>
          </Pressable>

          <View className="mt-8 items-center">
            <Text className="text-center text-sm text-slate-400">
              By continuing, you agree to our Terms &amp; Privacy Policy.
            </Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}
