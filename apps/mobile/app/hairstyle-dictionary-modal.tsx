import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import {
  Linking,
  Modal,
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
  { label: "Semua", value: "all" },
  { label: "Lelaki", value: "male" },
  { label: "Perempuan", value: "female" },
  { label: "Unisex", value: "unisex" },
];

const MAINTENANCE_LABEL: Record<HairstyleEntry["maintenanceLevel"], string> = {
  low: "Mudah jaga",
  medium: "Sederhana",
  high: "Perlu usaha",
};

const MAINTENANCE_COLOR: Record<HairstyleEntry["maintenanceLevel"], string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
};

const GENDER_LABEL: Record<HairstyleGender, string> = {
  male: "Lelaki",
  female: "Perempuan",
  unisex: "Unisex",
};

const openExamples = async (searchQuery: string) => {
  const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Gagal buka contoh", "Sila cuba lagi.");
  }
};

export default function HairstyleDictionaryModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedGender, setSelectedGender] = useState<
    HairstyleGender | "all"
  >("all");
  const [selectedState, setSelectedState] = useState<
    MalaysianState | "all"
  >("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return HAIRSTYLE_DICTIONARY.filter((h) => {
      if (selectedGender !== "all" && h.gender !== selectedGender) return false;
      if (
        selectedState !== "all" &&
        !h.states.includes(selectedState as MalaysianState)
      )
        return false;
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
    setExpandedId(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View
        className="flex-1 bg-neutral-50"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pb-4">
          <View>
            <Text className="text-2xl font-bold text-neutral-900">
              Gaya Rambut Malaysia
            </Text>
            <Text className="text-sm text-neutral-500 mt-0.5">
              {filtered.length} gaya ditemui
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100"
          >
            <Ionicons name="close" size={18} color="#171717" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View className="px-5 mb-3">
          <View className="flex-row items-center rounded-full border border-neutral-200 bg-white px-4 py-2.5 gap-2">
            <Ionicons name="search-outline" size={16} color="#a3a3a3" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Cari gaya rambut..."
              placeholderTextColor="#a3a3a3"
              className="flex-1 text-neutral-900 text-sm"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color="#a3a3a3" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Gender filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          className="mb-3 max-h-10"
        >
          {GENDER_FILTERS.map((f) => {
            const isActive = selectedGender === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setSelectedGender(f.value)}
                className={`rounded-full px-4 py-1.5 border ${
                  isActive
                    ? "bg-neutral-900 border-neutral-900"
                    : "bg-white border-neutral-200"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isActive ? "text-white" : "text-neutral-700"
                  }`}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* State filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          className="mb-4 max-h-10"
        >
          <TouchableOpacity
            onPress={() => setSelectedState("all")}
            className={`rounded-full px-4 py-1.5 border ${
              selectedState === "all"
                ? "bg-neutral-900 border-neutral-900"
                : "bg-white border-neutral-200"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                selectedState === "all" ? "text-white" : "text-neutral-700"
              }`}
            >
              Semua Negeri
            </Text>
          </TouchableOpacity>
          {ALL_STATES.map((state) => {
            const isActive = selectedState === state;
            return (
              <TouchableOpacity
                key={state}
                onPress={() => setSelectedState(state)}
                className={`rounded-full px-4 py-1.5 border ${
                  isActive
                    ? "bg-neutral-900 border-neutral-900"
                    : "bg-white border-neutral-200"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isActive ? "text-white" : "text-neutral-700"
                  }`}
                >
                  {state}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 24,
            gap: 12,
          }}
        >
          {filtered.length === 0 ? (
            <View className="items-center py-16">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 mb-4">
                <Ionicons name="cut-outline" size={26} color="#737373" />
              </View>
              <Text className="text-base font-semibold text-neutral-900">
                Tiada gaya ditemui
              </Text>
              <Text className="text-sm text-neutral-500 mt-1 text-center">
                Cuba tukar filter atau kata carian
              </Text>
            </View>
          ) : (
            filtered.map((entry) => {
              const isExpanded = expandedId === entry.id;
              return (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() =>
                    setExpandedId(isExpanded ? null : entry.id)
                  }
                  activeOpacity={0.88}
                  style={{
                    borderRadius: 16,
                    borderWidth: isExpanded ? 1.5 : 1,
                    borderColor: isExpanded ? "#171717" : "#e5e5e5",
                    backgroundColor: "#ffffff",
                    borderLeftWidth: isExpanded ? 4 : 1,
                    borderLeftColor: isExpanded ? "#171717" : "#e5e5e5",
                    padding: 16,
                  }}
                >
                  {/* Title row */}
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-neutral-900">
                        {entry.name}
                      </Text>
                      {entry.localName ? (
                        <Text className="text-xs text-neutral-400 mt-0.5">
                          {entry.localName}
                        </Text>
                      ) : null}
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className="rounded-full bg-neutral-100 px-2.5 py-1">
                        <Text className="text-xs font-semibold text-neutral-600">
                          {GENDER_LABEL[entry.gender]}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color="#737373"
                      />
                    </View>
                  </View>

                  {/* Badges */}
                  <View className="flex-row flex-wrap gap-2 mt-2.5">
                    <View
                      style={{
                        backgroundColor:
                          MAINTENANCE_COLOR[entry.maintenanceLevel] + "18",
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: MAINTENANCE_COLOR[entry.maintenanceLevel],
                        }}
                      >
                        {MAINTENANCE_LABEL[entry.maintenanceLevel]}
                      </Text>
                    </View>
                    {entry.tags.slice(0, 3).map((tag) => (
                      <View
                        key={tag}
                        className="rounded-full bg-neutral-100 px-2.5 py-0.5"
                      >
                        <Text className="text-xs text-neutral-500">{tag}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Expanded content */}
                  {isExpanded ? (
                    <View className="mt-4 gap-3">
                      <Text className="text-sm leading-5 text-neutral-600">
                        {entry.description}
                      </Text>

                      <View className="rounded-xl bg-neutral-50 px-3 py-2.5">
                        <Text className="text-xs font-semibold text-neutral-500 mb-1">
                          Sesuai untuk
                        </Text>
                        <Text className="text-sm text-neutral-700">
                          {entry.suits}
                        </Text>
                      </View>

                      <View className="rounded-xl bg-neutral-50 px-3 py-2.5">
                        <Text className="text-xs font-semibold text-neutral-500 mb-2">
                          Popular di
                        </Text>
                        <View className="flex-row flex-wrap gap-1.5">
                          {entry.states.map((state) => (
                            <View
                              key={state}
                              className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5"
                            >
                              <Text className="text-xs text-neutral-600">
                                {state}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => openExamples(entry.searchQuery)}
                        activeOpacity={0.88}
                        className="rounded-full bg-neutral-900 px-4 py-2.5"
                      >
                        <View className="flex-row items-center justify-center gap-2">
                          <Ionicons
                            name="images-outline"
                            size={15}
                            color="#ffffff"
                          />
                          <Text className="text-sm font-semibold text-white">
                            Lihat contoh gambar
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
