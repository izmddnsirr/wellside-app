import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs
      iconColor={{
        default: "#a3a3a3",
        selected: "#262626",
      }}
      tintColor="#262626"
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
