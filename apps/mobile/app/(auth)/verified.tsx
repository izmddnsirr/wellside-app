import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifiedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 px-5">
      <View className="flex-1 justify-center items-center">
        <Text className="text-3xl mt-1 mb-8 font-semibold text-center text-neutral-900">
          Email verified ✅
        </Text>

        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          className="bg-neutral-900 rounded-full py-5 px-8 active:opacity-80"
        >
          <Text className="text-white font-semibold text-lg">Go to Login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
