import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import {
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ALL_STATES,
  HAIRSTYLE_DICTIONARY,
  type HairstyleEntry,
  type HairstyleGender,
  type MalaysianState,
} from "../data/hairstyle-dictionary";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const GENDER_FILTERS: { label: string; value: HairstyleGender | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Men", value: "male" },
  { label: "Women", value: "female" },
  { label: "Unisex", value: "unisex" },
];

const MAINTENANCE_COLOR: Record<HairstyleEntry["maintenanceLevel"], string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
};

const MAINTENANCE_LABEL: Record<HairstyleEntry["maintenanceLevel"], string> = {
  low: "Easy",
  medium: "Moderate",
  high: "High effort",
};

const GENDER_LABEL: Record<HairstyleGender, string> = {
  male: "Men",
  female: "Women",
  unisex: "Unisex",
};

const openExamples = async (searchQuery: string) => {
  const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Could not open browser", "Please try again.");
  }
};

export default function HairstyleDictionaryModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedGender, setSelectedGender] = useState<HairstyleGender | "all">("all");
  const [selectedState, setSelectedState] = useState<MalaysianState | "all">("all");
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return HAIRSTYLE_DICTIONARY.filter((h) => {
      if (selectedGender !== "all" && h.gender !== selectedGender) return false;
      if (selectedState !== "all" && !h.states.includes(selectedState as MalaysianState)) return false;
      if (q) {
        return (
          h.name.toLowerCase().includes(q) ||
          h.localName?.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q) ||
          h.tags.some((t) => t.includes(q))
        );
      }
      return true;
    });
  }, [search, selectedGender, selectedState]);

  const handleClose = () => {
    setSearch("");
    setSelectedGender("all");
    setSelectedState("all");
    setStateDropdownOpen(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        style={{ flex: 1, backgroundColor: "#ffffff", paddingTop: 20 }}
      >

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#0a0a0a", letterSpacing: -0.5 }}>
            Malaysian Hairstyles
          </Text>
          <TouchableOpacity onPress={handleClose} style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="close" size={20} color="#404040" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f5", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}>
            <Ionicons name="search-outline" size={15} color="#a3a3a3" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search styles..."
              placeholderTextColor="#a3a3a3"
              style={{ flex: 1, fontSize: 14, color: "#0a0a0a" }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={15} color="#a3a3a3" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Gender filter */}
        <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 6, marginBottom: 10 }}>
          {GENDER_FILTERS.map((f) => {
            const isActive = selectedGender === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setSelectedGender(f.value)}
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 8,
                  backgroundColor: isActive ? "#0a0a0a" : "#f5f5f5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#ffffff" : "#525252" }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* State filter — custom dropdown */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16, zIndex: 10 }}>
          <TouchableOpacity
            onPress={() => setStateDropdownOpen((o) => !o)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: selectedState !== "all" ? "#0a0a0a" : "#f5f5f5",
              borderRadius: 8,
              paddingHorizontal: 14,
              height: 34,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: selectedState !== "all" ? "#ffffff" : "#525252" }}>
              {selectedState === "all" ? "All States" : selectedState}
            </Text>
            <Ionicons
              name={stateDropdownOpen ? "chevron-up" : "chevron-down"}
              size={13}
              color={selectedState !== "all" ? "#ffffff" : "#a3a3a3"}
            />
          </TouchableOpacity>

          {stateDropdownOpen ? (
            <View style={{
              position: "absolute",
              top: 38,
              left: 20,
              right: 20,
              backgroundColor: "#ffffff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#f0f0f0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 8,
              zIndex: 20,
              maxHeight: 240,
              overflow: "hidden",
            }}>
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {[{ label: "All States", value: "all" as const }, ...ALL_STATES.map((s) => ({ label: s, value: s as MalaysianState }))].map((item, index, arr) => {
                  const isActive = selectedState === item.value;
                  const isLast = index === arr.length - 1;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => {
                        setSelectedState(item.value);
                        setStateDropdownOpen(false);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 14,
                        paddingVertical: 11,
                        borderBottomWidth: isLast ? 0 : 1,
                        borderBottomColor: "#f5f5f5",
                        backgroundColor: isActive ? "#fafafa" : "#ffffff",
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: isActive ? "600" : "400", color: isActive ? "#0a0a0a" : "#404040" }}>
                        {item.label}
                      </Text>
                      {isActive ? <Ionicons name="checkmark" size={14} color="#0a0a0a" /> : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {/* Count */}
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 12, color: "#a3a3a3", fontWeight: "500" }}>
            {filtered.length} style{filtered.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32, gap: 12 }}
        >
          {filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60, gap: 8 }}>
              <Ionicons name="cut-outline" size={28} color="#d4d4d4" />
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#404040" }}>No styles found</Text>
              <Text style={{ fontSize: 13, color: "#a3a3a3", textAlign: "center" }}>
                Try a different search or filter
              </Text>
            </View>
          ) : (
            filtered.map((entry) => (
              <View
                key={entry.id}
                style={{ backgroundColor: "#fafafa", borderRadius: 14, padding: 16, gap: 10 }}
              >
                {/* Title row */}
                <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: "#0a0a0a" }}>
                      {entry.name}
                    </Text>
                    {entry.localName ? (
                      <Text style={{ fontSize: 11, color: "#a3a3a3", marginTop: 1 }}>
                        {entry.localName}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#a3a3a3" }}>
                      {GENDER_LABEL[entry.gender]}
                    </Text>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: MAINTENANCE_COLOR[entry.maintenanceLevel] }} />
                  </View>
                </View>

                {/* Description */}
                <Text style={{ fontSize: 13, lineHeight: 19, color: "#525252" }}>
                  {entry.description}
                </Text>

                {/* Best suits */}
                <Text style={{ fontSize: 12, color: "#737373" }}>
                  <Text style={{ fontWeight: "600", color: "#404040" }}>Suits · </Text>
                  {entry.suits}
                </Text>

                {/* Tags + maintenance */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  <View style={{ backgroundColor: MAINTENANCE_COLOR[entry.maintenanceLevel] + "18", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: MAINTENANCE_COLOR[entry.maintenanceLevel] }}>
                      {MAINTENANCE_LABEL[entry.maintenanceLevel]}
                    </Text>
                  </View>
                  {entry.tags.slice(0, 3).map((tag) => (
                    <View key={tag} style={{ backgroundColor: "#efefef", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, color: "#737373" }}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* View examples */}
                <TouchableOpacity
                  onPress={() => openExamples(entry.searchQuery)}
                  activeOpacity={0.7}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#f5f5f5", borderRadius: 8, paddingVertical: 10 }}
                >
                  <Ionicons name="images-outline" size={14} color="#525252" />
                  <Text style={{ fontSize: 13, color: "#525252", fontWeight: "600" }}>View examples</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
