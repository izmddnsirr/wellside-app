import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor="#ffffff"
      iconColor={{
        default: "#737373",
        selected: "#000000",
      }}
      labelStyle={{
        default: {
          color: "#737373",
          fontWeight: "500",
        },
        selected: {
          color: "#000000",
          fontWeight: "700",
        },
      }}
      tintColor="#000000"
    >
      <NativeTabs.Trigger name="index">
        <Label hidden>Home</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="booking">
        <Label hidden>Book</Label>
        <Icon sf="calendar" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ai">
        <Label hidden>AI</Label>
        <Icon sf="sparkles" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="notification">
        <Label hidden>Alerts</Label>
        <Icon sf="bell.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label hidden>Profile</Label>
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
