import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { supabase } from "../utils/supabase";

export default function SplashScreen() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }
      const nextRoute = data.session ? "/(tabs)" : "/(auth)/start";
      setTimeout(() => {
        if (!isMounted) {
          return;
        }
        router.replace(nextRoute);
        setIsChecking(false);
      }, 1200);
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <StatusBar style="auto" />

      <Image
        source={require("../assets/images/wellside-logo.png")}
        style={{
          width: 240,
          height: 78,
        }}
        resizeMode="contain"
      />

      {/* Loader at the bottom */}
      <View className="absolute bottom-20 left-0 right-0 items-center">
        <Text className="pb-6 text-slate-600">
          {isChecking ? "Preparing your chair" : "Redirecting"}
        </Text>
        <ActivityIndicator size="small" color="#0f172a" />
      </View>
    </View>
  );
}
