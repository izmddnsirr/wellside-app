import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs
      backgroundColor="#ffffff"
      iconColor={{
        default: "#737373",
        selected: "#000000",
      }}
      indicatorColor="#f5f5f5"
      labelStyle={{
        default: {
          color: "#737373",
          fontWeight: "500",
        },
        selected: {
          color: "#000000",
          fontWeight: "500",
        },
      }}
      labelVisibilityMode="labeled"
      tintColor="#000000"
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon src={<VectorIcon family={Ionicons} name="home" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="booking">
        <Label>Book</Label>
        <Icon src={<VectorIcon family={Ionicons} name="calendar" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ai">
        <Label>AI</Label>
        <Icon src={<VectorIcon family={Ionicons} name="sparkles" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="notification">
        <Label>Alerts</Label>
        <Icon src={<VectorIcon family={Ionicons} name="notifications" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon src={<VectorIcon family={Ionicons} name="person" />} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
