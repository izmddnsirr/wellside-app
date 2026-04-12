import type { Session } from "@supabase/supabase-js";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BookingProvider } from "../context/BookingContext";
import { OnboardingProvider } from "../context/OnboardingContext";
import "../global.css";
import { useNotifications } from "../hooks/useNotifications";
import { supabase } from "../utils/supabase";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useNotifications(session?.user.id ?? null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }
      setSession(data.session);
      setIsSessionReady(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
      },
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!navigationState?.key || !isSessionReady) {
      return;
    }

    const inAuthGroup =
      segments[0] === "(auth)" ||
      segments[0] === "(onboarding)" ||
      segments[0] === undefined;
    const inTabsGroup = segments[0] === "(tabs)";

    if (!session && inTabsGroup) {
      router.replace("/(auth)/start");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [navigationState?.key, isSessionReady, segments, session, router]);

  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <BookingProvider>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="(auth)"
              options={{
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                animation: "none",
              }}
            />
            <Stack.Screen
              name="(onboarding)"
              options={{
                animation: "slide_from_right",
              }}
            />
          </Stack>
        </BookingProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}
