import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const imageMediaTypes: ImagePicker.MediaType[] = ["images"];
  const isBusy = isPicking;

  const requestLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to upload an image."
      );
      return false;
    }
    return true;
  };

  const pickFromGallery = async () => {
    if (isBusy) {
      return;
    }
    const hasPermission = await requestLibraryPermissions();
    if (!hasPermission) {
      return;
    }
    setIsPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: imageMediaTypes,
        quality: 0.9,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.warn("Image library picker failed:", error);
    } finally {
      setIsPicking(false);
    }
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow camera access to take a photo."
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    if (isBusy) {
      return;
    }
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) {
      return;
    }
    setIsPicking(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: imageMediaTypes,
        quality: 0.9,
        cameraType: ImagePicker.CameraType.front,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.warn("Camera launch failed:", error);
    } finally {
      setIsPicking(false);
    }
  };

  useEffect(() => {
    if (!imageUri) {
      setImageAspectRatio(null);
      return;
    }
    Image.getSize(
      imageUri,
      (width, height) => {
        if (width > 0 && height > 0) {
          setImageAspectRatio(width / height);
        }
      },
      () => {
        setImageAspectRatio(null);
      }
    );
  }, [imageUri]);

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={async () => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 600);
            }}
          />
        }
      >
        {/* Header */}
        <View className="mx-5 mt-3">
          <Text className="text-3xl mt-1 font-semibold text-slate-900">
            AI Style Studio
          </Text>
          <Text className="text-slate-600 text-base mt-1">
            Upload a photo for tailored cut suggestions.
          </Text>
        </View>

        {/* Upload */}
        <View className="mx-5 mt-6 rounded-3xl border border-slate-200 bg-white p-5">
          <Text className="text-xs font-semibold tracking-[0.2em] text-slate-600">
            Upload Photo
          </Text>
          <TouchableOpacity
            onPress={pickFromGallery}
            disabled={isBusy}
            activeOpacity={0.9}
            className={`mt-4 overflow-hidden rounded-2xl ${
              imageUri
                ? "border border-slate-200 bg-slate-100"
                : "border-2 border-dashed border-slate-200 bg-slate-50"
            } items-center justify-center relative`}
            style={{
              height: imageUri ? undefined : 208,
            }}
          >
            {imageUri ? (
              <>
                <Image
                  source={{ uri: imageUri }}
                  className="w-full"
                  resizeMode="contain"
                  style={
                    imageAspectRatio
                      ? { aspectRatio: imageAspectRatio }
                      : undefined
                  }
                />
                <TouchableOpacity
                  onPress={() => setImageUri(null)}
                  className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-white">Remove</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="h-12 w-12 rounded-full bg-slate-900 items-center justify-center">
                  <Ionicons
                    name="cloud-upload-outline"
                    size={22}
                    color="#ffffff"
                  />
                </View>
                <Text className="mt-3 text-base font-semibold text-slate-900">
                  Tap to add a photo
                </Text>
                <Text className="mt-1 text-sm text-slate-600 text-center">
                  Front or side profile works best.
                </Text>
              </>
            )}
          </TouchableOpacity>
          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              onPress={takePhoto}
              disabled={isBusy}
              className={`flex-1 rounded-full bg-slate-900 px-4 py-3 ${
                isBusy ? "opacity-60" : ""
              }`}
            >
              <Text className="text-center text-white font-semibold">
                Take photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromGallery}
              disabled={isBusy}
              className={`flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 ${
                isBusy ? "opacity-60" : ""
              }`}
            >
              <Text className="text-center text-slate-900 font-semibold">
                Upload image
              </Text>
            </TouchableOpacity>
          </View>
          {isPicking ? (
            <View className="mt-3 flex-row items-center justify-center gap-2">
              <ActivityIndicator size="small" color="#0f172a" />
              <Text className="text-sm text-slate-500">
                Preparing image...
              </Text>
            </View>
          ) : null}
        </View>

        {/* Suggestions */}
        {/* <View className="mx-5 mt-6 rounded-3xl border border-slate-200 bg-white p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-semibold tracking-[0.2em] text-slate-600">
              AI Suggestion
            </Text>
            <View className="rounded-full bg-emerald-100 px-3 py-1">
              <Text className="text-xs font-semibold text-emerald-700">
                READY
              </Text>
            </View>
          </View>
          <Text className="text-lg font-semibold mt-3 text-slate-900">
            Soft taper + textured top
          </Text>
          <Text className="text-slate-600 mt-2">
            Your hair pattern suits a soft taper with light texture. Ask for
            3-4cm on top and a matte finish for easy styling.
          </Text>
        </View> */}

        {/* Notes */}
        {/* <View className="mx-5 mt-6 rounded-3xl border border-slate-200 bg-white p-4">
          <Text className="text-xs font-semibold tracking-[0.2em] text-slate-600">
            ADD NOTES
          </Text>
          <TextInput
            className="mt-3 text-base text-slate-900"
            placeholder="Describe your hair goals..."
            multiline
          />
          <TouchableOpacity className="mt-4 bg-slate-900 rounded-full py-3">
            <Text className="text-center text-white font-semibold">
              Get suggestions
            </Text>
          </TouchableOpacity>
        </View> */}

        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
