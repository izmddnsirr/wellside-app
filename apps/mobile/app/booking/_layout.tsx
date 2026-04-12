import { Stack } from "expo-router";

export default function BookingLayout() {
  return (
    <Stack>
      <Stack.Screen name="select-service" options={{ headerShown: false }} />
      <Stack.Screen name="select-professional" options={{ headerShown: false }} />
      <Stack.Screen name="select-time" options={{ headerShown: false }} />
      <Stack.Screen name="review-confirm" options={{ headerShown: false }} />
      <Stack.Screen name="confirming" options={{ headerShown: false }} />
      <Stack.Screen name="success" options={{ headerShown: false }} />
    </Stack>
  );
}
