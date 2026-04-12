import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="details"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
