import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import HairstyleDictionaryModal from "../hairstyle-dictionary-modal";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { supabase } from "../../utils/supabase";

type HairstyleSuggestion = {
  name: string;
  description: string;
  suits_because: string;
  example_search_query?: string;
};

type HairAnalysisResult = {
  face_shape: string;
  hair_type: string;
  gender?: string;
  suggestions: HairstyleSuggestion[];
};

type PresignedUrlResponse = {
  presignedUrl: string;
  key: string;
};

type FollowUpResponse = {
  answer: string;
};

type ManualSuggestionsResponse = {
  suggestions: HairstyleSuggestion[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

type FunctionErrorResponse = {
  error?: string;
  details?: {
    name?: string;
    message?: string;
  };
};

type FunctionInvokeError = Error & {
  context?: Response;
};

const isSupportedImageMimeType = (mimeType?: string | null) =>
  Boolean(
    mimeType?.includes("jpeg") ||
      mimeType?.includes("jpg") ||
      mimeType?.includes("png") ||
      mimeType?.includes("gif") ||
      mimeType?.includes("webp")
  );

const getImageFormat = (mimeType?: string | null) => {
  if (mimeType?.includes("png")) return "png";
  if (mimeType?.includes("gif")) return "gif";
  if (mimeType?.includes("webp")) return "webp";
  return "jpeg";
};

const getImageFileName = (
  asset: ImagePicker.ImagePickerAsset,
  imageFormat: string
) => {
  if (asset.fileName) {
    const baseName = asset.fileName.replace(/\.[^/.]+$/, "");
    const extension = imageFormat === "jpeg" ? "jpg" : imageFormat;
    return `${baseName}.${extension}`;
  }
  const extension = imageFormat === "jpeg" ? "jpg" : imageFormat;
  return `photo.${extension}`;
};

const getResizeAction = (asset: ImagePicker.ImagePickerAsset) => {
  const width = asset.width ?? 0;
  const height = asset.height ?? 0;
  if (Math.max(width, height) <= 1600) return [];
  return [
    {
      resize: width >= height ? { width: 1600 } : { height: 1600 },
    },
  ];
};

const prepareImageForBedrock = async (asset: ImagePicker.ImagePickerAsset) => {
  const shouldResize =
    !isSupportedImageMimeType(asset.mimeType) ||
    (asset.fileSize !== undefined && asset.fileSize > 4_500_000) ||
    (asset.width !== undefined && asset.width > 1600) ||
    (asset.height !== undefined && asset.height > 1600);

  if (!shouldResize && isSupportedImageMimeType(asset.mimeType)) {
    const imageFormat = getImageFormat(asset.mimeType);
    return {
      uri: asset.uri,
      fileName: getImageFileName(asset, imageFormat),
      fileType: asset.mimeType ?? "image/jpeg",
      imageFormat,
    };
  }

  const convertedImage = await ImageManipulator.manipulateAsync(
    asset.uri,
    getResizeAction(asset),
    { compress: 0.72, format: ImageManipulator.SaveFormat.JPEG }
  );

  return {
    uri: convertedImage.uri,
    fileName: getImageFileName(asset, "jpeg"),
    fileType: "image/jpeg",
    imageFormat: "jpeg",
  };
};

const titleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const isUnknownValue = (value?: string) => {
  if (!value) return true;
  const normalizedValue = value.toLowerCase().trim();
  return (
    normalizedValue.includes("unable") ||
    normalizedValue.includes("unknown") ||
    normalizedValue.includes("determine") ||
    normalizedValue === "n/a"
  );
};

const isCoveredHairValue = (value?: string) =>
  value?.toLowerCase().trim() === "covered";

const manualHairTypes = ["straight", "wavy", "curly", "coily"];

const getFunctionErrorMessage = async (
  error: FunctionInvokeError | null,
  fallback: string
) => {
  if (!error) return fallback;
  const response = error.context;
  if (!response) return error.message || fallback;
  try {
    const body = (await response.json()) as FunctionErrorResponse;
    return body.details?.message ?? body.error ?? error.message ?? fallback;
  } catch {
    return error.message || fallback;
  }
};

export default function AIScreen() {
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<HairAnalysisResult | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [selectedManualHairType, setSelectedManualHairType] = useState<string | null>(
    null
  );
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const imageMediaTypes: ImagePicker.MediaType[] = ["images"];
  const isBusy = isPicking || isAnalyzing || isGeneratingSuggestions;
  const hasImage = Boolean(imageUri);
  const hasUsableAnalysis = Boolean(
    analysisResult &&
      !isUnknownValue(analysisResult.face_shape) &&
      !isUnknownValue(analysisResult.hair_type) &&
      !isCoveredHairValue(analysisResult.hair_type) &&
      analysisResult.suggestions.length > 0
  );
  const canChooseManualHairType = Boolean(
    analysisResult &&
      !isUnknownValue(analysisResult.face_shape) &&
      (isUnknownValue(analysisResult.hair_type) ||
        isCoveredHairValue(analysisResult.hair_type))
  );

  const [isDictionaryVisible, setIsDictionaryVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isAnalyzing) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.45,
            duration: 850,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 850,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isAnalyzing, pulseAnim]);

  const clearImage = () => {
    setImageUri(null);
    setSelectedImage(null);
    setAnalysisResult(null);
    setSelectedSuggestionIndex(0);
    setChatMessages([]);
    setChatInput("");
    setSelectedManualHairType(null);
  };

  const setPickedImage = (asset: ImagePicker.ImagePickerAsset) => {
    setImageUri(asset.uri);
    setSelectedImage(asset);
    setAnalysisResult(null);
    setSelectedSuggestionIndex(0);
    setChatMessages([]);
    setChatInput("");
    setSelectedManualHairType(null);
  };

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
    if (isBusy) return;
    const hasPermission = await requestLibraryPermissions();
    if (!hasPermission) return;
    setIsPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: imageMediaTypes,
        quality: 0.9,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPickedImage(result.assets[0]);
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
    if (isBusy) return;
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;
    setIsPicking(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: imageMediaTypes,
        quality: 0.9,
        cameraType: ImagePicker.CameraType.front,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPickedImage(result.assets[0]);
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
        if (width > 0 && height > 0) setImageAspectRatio(width / height);
      },
      () => setImageAspectRatio(null)
    );
  }, [imageUri]);

  const analyzeHairstyle = async () => {
    if (!imageUri || !selectedImage || isBusy) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const preparedImage = await prepareImageForBedrock(selectedImage);

      const { data: presignedData, error: presignedError } =
        await supabase.functions.invoke<PresignedUrlResponse>(
          "generate-presigned-url",
          {
            body: {
              fileName: preparedImage.fileName,
              fileType: preparedImage.fileType,
            },
          }
        );

      if (presignedError || !presignedData?.presignedUrl) {
        throw new Error(
          await getFunctionErrorMessage(
            presignedError as FunctionInvokeError | null,
            "Unable to prepare image upload."
          )
        );
      }

      const imageBlob = await fetch(preparedImage.uri).then((r) => r.blob());
      const uploadResponse = await fetch(presignedData.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": preparedImage.fileType },
        body: imageBlob,
      });

      if (!uploadResponse.ok) throw new Error("Image upload failed.");

      const { data: analysisData, error: analysisError } =
        await supabase.functions.invoke<HairAnalysisResult | string>(
          "analyze-hair",
          {
            body: {
              s3Key: presignedData.key,
              imageFormat: preparedImage.imageFormat,
            },
          }
        );

      if (analysisError || !analysisData) {
        throw new Error(
          await getFunctionErrorMessage(
            analysisError as FunctionInvokeError | null,
            "Unable to analyze this hairstyle."
          )
        );
      }

      const parsedResult =
        typeof analysisData === "string"
          ? (JSON.parse(analysisData) as HairAnalysisResult)
          : analysisData;

      setAnalysisResult(parsedResult);
      setSelectedSuggestionIndex(0);
      setChatMessages([]);
      setChatInput("");
      setSelectedManualHairType(null);
    } catch (error) {
      console.warn("Hair analysis failed:", error);
      Alert.alert(
        "Analysis failed",
        error instanceof Error
          ? error.message
          : "Please try again with another photo."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedSuggestion =
    analysisResult?.suggestions[selectedSuggestionIndex] ?? null;

  const generateSuggestionsForHairType = async (hairType: string) => {
    if (!analysisResult || isGeneratingSuggestions) return;

    setSelectedManualHairType(hairType);
    setIsGeneratingSuggestions(true);
    setChatMessages([]);
    setChatInput("");

    try {
      const { data, error } = await supabase.functions.invoke<
        ManualSuggestionsResponse | string
      >("generate-hairstyle-suggestions", {
        body: {
          faceShape: analysisResult.face_shape,
          hairType,
          gender: analysisResult.gender,
        },
      });

      if (error || !data) {
        throw new Error(
          await getFunctionErrorMessage(
            error as FunctionInvokeError | null,
            "Unable to generate hairstyle suggestions."
          )
        );
      }

      const parsedResponse =
        typeof data === "string"
          ? (JSON.parse(data) as ManualSuggestionsResponse)
          : data;

      setAnalysisResult({
        ...analysisResult,
        hair_type: hairType,
        suggestions: parsedResponse.suggestions,
      });
      setSelectedSuggestionIndex(0);
    } catch (error) {
      console.warn("Manual hairstyle generation failed:", error);
      Alert.alert(
        "Unable to generate suggestions",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const askFollowUp = async () => {
    const question = chatInput.trim();

    if (!question || !analysisResult || !selectedSuggestion || isAskingFollowUp) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: question,
    };

    setChatMessages((messages) => [...messages, userMessage]);
    setChatInput("");
    setIsAskingFollowUp(true);

    try {
      const { data, error } = await supabase.functions.invoke<
        FollowUpResponse | string
      >("hairstyle-follow-up", {
        body: {
          question,
          analysis: analysisResult,
          selectedSuggestion,
        },
      });

      if (error || !data) {
        throw new Error(
          await getFunctionErrorMessage(
            error as FunctionInvokeError | null,
            "Unable to answer this question."
          )
        );
      }

      const parsedResponse =
        typeof data === "string"
          ? (JSON.parse(data) as FollowUpResponse)
          : data;

      setChatMessages((messages) => [
        ...messages,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: parsedResponse.answer,
        },
      ]);
    } catch (error) {
      console.warn("Hairstyle follow-up failed:", error);
      Alert.alert(
        "Unable to answer",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  const openSelectedSuggestionExamples = async () => {
    if (!analysisResult || !selectedSuggestion) return;
    const searchQuery =
      selectedSuggestion.example_search_query ||
      `${selectedSuggestion.name} hairstyle ${analysisResult.face_shape} face ${analysisResult.hair_type} hair`;
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery)}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.warn("Failed to open hairstyle examples:", error);
      Alert.alert("Unable to open examples", "Please try again later.");
    }
  };

  return (
    <View className="flex-1 bg-neutral-50" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
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
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-3xl mt-1 font-semibold text-neutral-900">
                AI Style Studio
              </Text>
              <Text className="text-neutral-500 text-base mt-1">
                Upload a photo for tailored cut suggestions.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsDictionaryVisible(true)}
              className="mt-2 ml-3 flex-row items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-2"
            >
              <Ionicons name="book-outline" size={14} color="#171717" />
              <Text className="text-xs font-semibold text-neutral-900">
                Gaya MY
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <HairstyleDictionaryModal
          visible={isDictionaryVisible}
          onClose={() => setIsDictionaryVisible(false)}
        />

        {/* Upload */}
        <View className="mx-5 mt-6">
          {/* Image area */}
          <TouchableOpacity
            onPress={pickFromGallery}
            disabled={isBusy}
            activeOpacity={0.9}
            className={`overflow-hidden rounded-2xl ${
              imageUri
                ? "border border-neutral-200 bg-white"
                : "border-2 border-dashed border-neutral-200 bg-neutral-50"
            } items-center justify-center relative`}
            style={{ height: imageUri ? undefined : 200 }}
          >
            {imageUri ? (
              <>
                <Animated.View style={{ opacity: pulseAnim, width: "100%" }}>
                  <Image
                    source={{ uri: imageUri }}
                    className="w-full"
                    resizeMode="cover"
                    style={
                      imageAspectRatio
                        ? {
                            aspectRatio: Math.max(
                              0.78,
                              Math.min(1.25, imageAspectRatio)
                            ),
                          }
                        : { height: 320 }
                    }
                  />
                </Animated.View>

                <TouchableOpacity
                  onPress={clearImage}
                  disabled={isBusy}
                  className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-white/90"
                >
                  <Ionicons name="close" size={18} color="#171717" />
                </TouchableOpacity>

                {/* Analysing overlay */}
                {isAnalyzing ? (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(10,10,10,0.62)",
                      borderRadius: 16,
                    }}
                  >
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text className="mt-2.5 text-sm font-semibold text-white">
                      Analysing your style...
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 10,
                      right: 10,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "rgba(0,0,0,0.48)",
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Ionicons name="repeat-outline" size={13} color="#fff" />
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: "600",
                        }}
                      >
                        Tap to change
                      </Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View className="items-center px-8 py-8">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-900">
                  <Ionicons
                    name="cloud-upload-outline"
                    size={22}
                    color="#ffffff"
                  />
                </View>
                <Text className="mt-3 text-base font-semibold text-neutral-900">
                  Tap to add a photo
                </Text>
                <Text className="mt-1 text-center text-sm text-neutral-500">
                  Front or side profile works best.
                </Text>
              </View>
            )}
            {isPicking ? (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: imageUri
                    ? "rgba(10,10,10,0.55)"
                    : "rgba(250,250,250,0.9)",
                  borderRadius: 16,
                }}
              >
                <ActivityIndicator
                  size="large"
                  color={imageUri ? "#ffffff" : "#171717"}
                />
                <Text
                  className={`mt-2.5 text-sm font-semibold ${
                    imageUri ? "text-white" : "text-neutral-900"
                  }`}
                >
                  Preparing image...
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>

          {/* Camera / Gallery buttons */}
          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              onPress={takePhoto}
              disabled={isBusy}
              className={`flex-1 rounded-full bg-neutral-900 px-4 py-3 ${
                isBusy ? "opacity-60" : ""
              }`}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons name="camera-outline" size={17} color="#ffffff" />
                <Text className="text-center font-semibold text-white">
                  Camera
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromGallery}
              disabled={isBusy}
              className={`flex-1 rounded-full border border-neutral-200 bg-white px-4 py-3 ${
                isBusy ? "opacity-60" : ""
              }`}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons name="images-outline" size={17} color="#171717" />
                <Text className="text-center font-semibold text-neutral-900">
                  Gallery
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Analyse button */}
          <TouchableOpacity
            onPress={analyzeHairstyle}
            disabled={!hasImage || isBusy}
            className={`mt-4 rounded-full bg-neutral-900 px-4 py-3.5 ${
              !hasImage || isBusy ? "opacity-40" : ""
            }`}
          >
            <View className="flex-row items-center justify-center gap-2">
              {isAnalyzing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="sparkles-outline" size={17} color="#ffffff" />
              )}
              <Text className="text-center font-semibold text-white">
                {isAnalyzing ? "Analysing..." : "Get suggestions"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {analysisResult ? (
          <View className="mx-5 mt-6">
            <Text className="text-lg font-semibold text-neutral-900">
              {hasUsableAnalysis
                ? "Recommended cuts"
                : "Needs another photo"}
            </Text>

            {hasUsableAnalysis ? (
              <>
                {/* Face & hair type */}
                <View className="mt-4 flex-row gap-3">
                  <View className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4">
                    <View className="mb-2.5 h-9 w-9 items-center justify-center rounded-full bg-neutral-900">
                      <Ionicons name="person-outline" size={17} color="#fff" />
                    </View>
                    <Text className="text-xs font-semibold text-neutral-500">
                      Face shape
                    </Text>
                    <Text className="mt-0.5 text-lg font-bold text-neutral-900">
                      {titleCase(analysisResult.face_shape)}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-2xl border border-neutral-200 bg-white p-4">
                    <View className="mb-2.5 h-9 w-9 items-center justify-center rounded-full bg-neutral-900">
                      <Ionicons name="cut-outline" size={17} color="#fff" />
                    </View>
                    <Text className="text-xs font-semibold text-neutral-500">
                      Hair type
                    </Text>
                    <Text className="mt-0.5 text-lg font-bold text-neutral-900">
                      {titleCase(analysisResult.hair_type)}
                    </Text>
                  </View>
                </View>

                {/* Suggestions */}
                <View className="mt-4 gap-3">
                  {analysisResult.suggestions
                    .slice(0, 3)
                    .map((suggestion, index) => {
                      const isSelected = selectedSuggestionIndex === index;
                      return (
                        <TouchableOpacity
                          key={`${suggestion.name}-${index}`}
                          onPress={() => setSelectedSuggestionIndex(index)}
                          activeOpacity={0.88}
                          style={{
                            borderRadius: 16,
                            borderWidth: isSelected ? 1.5 : 1,
                            borderColor: isSelected ? "#171717" : "#e5e5e5",
                            backgroundColor: "#ffffff",
                            borderLeftWidth: isSelected ? 4 : 1,
                            borderLeftColor: isSelected ? "#171717" : "#e5e5e5",
                            padding: 16,
                          }}
                        >
                          <View className="flex-row items-start gap-3">
                            <View
                              className={`h-8 w-8 items-center justify-center rounded-full ${
                                isSelected ? "bg-neutral-900" : "bg-neutral-100"
                              }`}
                            >
                              <Text
                                className={`text-xs font-bold ${
                                  isSelected
                                    ? "text-white"
                                    : "text-neutral-500"
                                }`}
                              >
                                {index + 1}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-base font-bold text-neutral-900">
                                {suggestion.name}
                              </Text>
                              <Text className="mt-1.5 text-sm leading-5 text-neutral-500">
                                {suggestion.description}
                              </Text>
                              <View className="mt-3 rounded-xl bg-neutral-50 px-3 py-2.5">
                                <Text className="text-sm leading-5 text-neutral-700">
                                  {suggestion.suits_because}
                                </Text>
                              </View>

                              {/* View examples — inside selected card */}
                              {isSelected ? (
                                <TouchableOpacity
                                  onPress={openSelectedSuggestionExamples}
                                  activeOpacity={0.88}
                                  className="mt-3 rounded-full bg-neutral-900 px-4 py-2.5"
                                >
                                  <View className="flex-row items-center justify-center gap-2">
                                    <Ionicons
                                      name="images-outline"
                                      size={16}
                                      color="#ffffff"
                                    />
                                    <Text className="text-sm font-semibold text-white">
                                      View examples
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                <View className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
                  <Text className="text-xs font-semibold text-neutral-500">
                    Ask more
                  </Text>

                  {chatMessages.length ? (
                    <View className="mt-4 gap-2">
                      {chatMessages.map((message) => (
                        <View
                          key={message.id}
                          className={`max-w-[88%] rounded-2xl px-4 py-3 ${
                            message.role === "user"
                              ? "self-end bg-neutral-900"
                              : "self-start bg-white border border-neutral-200"
                          }`}
                        >
                          <Text
                            className={`text-sm leading-5 ${
                              message.role === "user"
                                ? "text-white"
                                : "text-neutral-700"
                            }`}
                          >
                            {message.text}
                          </Text>
                        </View>
                      ))}
                      {isAskingFollowUp ? (
                        <View className="self-start rounded-2xl border border-neutral-200 bg-white px-4 py-3">
                          <View className="flex-row items-center gap-2">
                            <ActivityIndicator size="small" color="#737373" />
                            <Text className="text-sm text-neutral-500">
                              Thinking...
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  ) : null}

                  <View className="mt-4 flex-row items-center gap-2">
                    <TextInput
                      value={chatInput}
                      onChangeText={setChatInput}
                      editable={!isAskingFollowUp}
                      placeholder="Ask about this style..."
                      placeholderTextColor="#a3a3a3"
                      returnKeyType="send"
                      onSubmitEditing={askFollowUp}
                      className="flex-1 rounded-full border border-neutral-200 bg-white px-4 py-3 text-neutral-900"
                    />
                    <TouchableOpacity
                      onPress={askFollowUp}
                      disabled={!chatInput.trim() || isAskingFollowUp}
                      className={`h-12 w-12 items-center justify-center rounded-full bg-neutral-900 ${
                        !chatInput.trim() || isAskingFollowUp
                          ? "opacity-40"
                          : ""
                      }`}
                    >
                      {isAskingFollowUp ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Ionicons name="send" size={18} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <View className="mt-5 rounded-2xl border border-neutral-200 bg-white px-5 py-6">
                {canChooseManualHairType ? (
                  <>
                    <View className="flex-row items-start gap-3">
                      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
                        <Ionicons
                          name="information-circle-outline"
                          size={22}
                          color="#525252"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-neutral-900">
                          Hair is covered
                        </Text>
                        <Text className="mt-1 text-sm leading-5 text-neutral-500">
                          I can read your face shape as{" "}
                          {titleCase(analysisResult.face_shape)}. Choose your
                          hair type to generate hairstyle suggestions.
                        </Text>
                      </View>
                    </View>

                    <View className="mt-4 flex-row flex-wrap gap-2">
                      {manualHairTypes.map((hairType) => {
                        const isSelected = selectedManualHairType === hairType;
                        return (
                          <TouchableOpacity
                            key={hairType}
                            onPress={() => generateSuggestionsForHairType(hairType)}
                            disabled={isGeneratingSuggestions}
                            className={`rounded-full border px-4 py-2.5 ${
                              isSelected
                                ? "border-neutral-900 bg-neutral-900"
                                : "border-neutral-200 bg-white"
                            }`}
                          >
                            <Text
                              className={`text-sm font-semibold ${
                                isSelected ? "text-white" : "text-neutral-800"
                              }`}
                            >
                              {titleCase(hairType)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {isGeneratingSuggestions ? (
                      <View className="mt-4 flex-row items-center gap-2">
                        <ActivityIndicator size="small" color="#737373" />
                        <Text className="text-sm text-neutral-500">
                          Generating suggestions...
                        </Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <View className="items-center py-2">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
                      <Ionicons
                        name="person-outline"
                        size={24}
                        color="#737373"
                      />
                    </View>
                    <Text className="mt-4 text-center text-lg font-semibold text-neutral-900">
                      No face or hair detected
                    </Text>
                    <Text className="mt-2 text-center text-sm leading-5 text-neutral-500">
                      Upload a clear portrait so the AI can read face shape and
                      hair texture.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
