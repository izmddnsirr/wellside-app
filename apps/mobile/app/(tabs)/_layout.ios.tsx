import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs
      iconColor={{
        default: "#94A3B8",
        selected: "#334155",
      }}
      tintColor="#334155"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label hidden>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="booking">
        <NativeTabs.Trigger.Label hidden>Book</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ai">
        <NativeTabs.Trigger.Label hidden>AI</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="sparkles" md="auto_awesome" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="notification">
        <NativeTabs.Trigger.Label hidden>Alerts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bell.fill" md="notifications" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label hidden>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
