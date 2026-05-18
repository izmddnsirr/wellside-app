import { View } from "react-native";

export function SkeletonBlock({ className }: { className: string }) {
  return <View className={`bg-neutral-200 ${className}`} />;
}

export function ServiceListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="pt-7">
      <SkeletonBlock className="h-3 w-16 rounded-full" />
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className={`mt-4 rounded-2xl border border-neutral-200 bg-white p-4 ${
            index === count - 1 ? "mb-2" : ""
          }`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <SkeletonBlock className="h-5 w-40 rounded-full" />
              <View className="mt-2 flex-row items-center">
                <SkeletonBlock className="h-6 w-16 rounded-full" />
                <SkeletonBlock className="ml-2 h-6 w-20 rounded-full" />
              </View>
            </View>
            <SkeletonBlock className="h-12 w-12 rounded-full" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function BarberListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className="mb-4 flex-row items-center rounded-3xl border border-neutral-200 bg-white px-3 py-3"
        >
          <SkeletonBlock className="mr-5 h-20 w-20 rounded-full" />
          <View className="min-w-0 flex-1">
            <SkeletonBlock className="h-5 w-32 rounded-full" />
            <SkeletonBlock className="mt-2 h-4 w-16 rounded-full" />
            <View className="mt-2 flex-row items-center">
              {Array.from({ length: 5 }).map((__, starIndex) => (
                <SkeletonBlock
                  key={starIndex}
                  className="mr-1 h-3 w-3 rounded-full"
                />
              ))}
              <SkeletonBlock className="ml-1 h-3 w-14 rounded-full" />
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

export function TimeSlotListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className="mb-4 rounded-3xl border border-neutral-200 bg-white px-4 py-5"
        >
          <SkeletonBlock className="h-5 w-24 rounded-full" />
        </View>
      ))}
    </>
  );
}

export function UpcomingBookingSkeleton() {
  return (
    <View className="mt-4 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
      <View className="bg-neutral-900 px-5 py-5">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <SkeletonBlock className="h-3 w-24 rounded-full bg-neutral-700" />
            <SkeletonBlock className="mt-3 h-8 w-28 rounded-full bg-neutral-700" />
            <SkeletonBlock className="mt-2 h-4 w-44 rounded-full bg-neutral-700" />
          </View>
          <SkeletonBlock className="h-10 w-10 rounded-full bg-neutral-700" />
        </View>
      </View>
      <View className="p-5">
        <View className="flex-row items-center justify-between">
          {Array.from({ length: 2 }).map((_, index) => (
            <View key={index} className="flex-row items-center">
              <SkeletonBlock className="h-9 w-9 rounded-full" />
              <View className="ml-3">
                <SkeletonBlock className="h-3 w-14 rounded-full" />
                <SkeletonBlock className="mt-2 h-4 w-12 rounded-full" />
              </View>
            </View>
          ))}
        </View>
        <SkeletonBlock className="mt-5 h-12 w-full rounded-3xl" />
        <SkeletonBlock className="mx-auto mt-3 h-3 w-56 rounded-full" />
      </View>
    </View>
  );
}

export function CompactServiceListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className="rounded-3xl border border-neutral-200 bg-white p-4"
        >
          <View className="flex-row items-center justify-between">
            <View>
              <SkeletonBlock className="h-4 w-36 rounded-full" />
              <SkeletonBlock className="mt-2 h-4 w-20 rounded-full" />
            </View>
            <SkeletonBlock className="h-4 w-12 rounded-full" />
          </View>
        </View>
      ))}
    </>
  );
}

export function ProfessionalGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className="mb-3 w-[48%] rounded-3xl border border-neutral-200 bg-white p-4"
        >
          <SkeletonBlock className="h-10 w-10 rounded-full" />
          <SkeletonBlock className="mt-3 h-4 w-24 rounded-full" />
          <SkeletonBlock className="mt-2 h-4 w-16 rounded-full" />
        </View>
      ))}
    </>
  );
}

export function HomeAppointmentSkeleton() {
  return (
    <View className="mx-5 mt-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
      <View className="absolute -left-3 top-24 h-6 w-6 rounded-full border border-neutral-200 bg-neutral-50" />
      <View className="absolute -right-3 top-24 h-6 w-6 rounded-full border border-neutral-200 bg-neutral-50" />
      <View className="bg-neutral-900 px-6 py-5">
        <View className="flex-row items-center justify-between">
          <SkeletonBlock className="h-3 w-20 rounded-full bg-neutral-700" />
          <SkeletonBlock className="h-6 w-20 rounded-full bg-neutral-700" />
        </View>
        <SkeletonBlock className="mt-3 h-8 w-32 rounded-full bg-neutral-700" />
        <SkeletonBlock className="mt-2 h-5 w-44 rounded-full bg-neutral-700" />
      </View>
      <View className="p-6">
        <View className="flex-row items-center justify-between">
          <View>
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="mt-2 h-5 w-28 rounded-full" />
          </View>
          <View className="items-end">
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="mt-2 h-5 w-24 rounded-full" />
          </View>
        </View>
        <SkeletonBlock className="mt-5 h-11 w-full rounded-full" />
      </View>
    </View>
  );
}

export function ProfileCardSkeleton() {
  return (
    <View className="mx-5 mt-6 flex-row items-center rounded-3xl bg-neutral-900 p-5">
      <SkeletonBlock className="mr-5 h-16 w-16 rounded-full bg-neutral-700" />
      <View className="flex-1">
        <SkeletonBlock className="h-6 w-36 rounded-full bg-neutral-700" />
        <SkeletonBlock className="mt-2 h-5 w-44 rounded-full bg-neutral-700" />
      </View>
      <SkeletonBlock className="h-9 w-16 rounded-full bg-neutral-700" />
    </View>
  );
}

export function ProfileHistorySkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="rounded-2xl border border-neutral-700 bg-neutral-800 px-4 py-4">
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className={`rounded-2xl border border-neutral-700 bg-neutral-900 px-4 py-3 ${
            index === count - 1 ? "" : "mb-3"
          }`}
        >
          <View className="flex-row items-center justify-between">
            <SkeletonBlock className="h-5 w-32 rounded-full bg-neutral-700" />
            <SkeletonBlock className="h-6 w-20 rounded-full bg-neutral-700" />
          </View>
          <SkeletonBlock className="mt-2 h-4 w-44 rounded-full bg-neutral-700" />
          <View className="mt-2 flex-row items-center justify-between">
            <SkeletonBlock className="h-4 w-24 rounded-full bg-neutral-700" />
            <SkeletonBlock className="h-4 w-12 rounded-full bg-neutral-700" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ProfileEditFormSkeleton() {
  return (
    <View className="px-5 pt-7">
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index}>
          <SkeletonBlock className="mb-3 h-3 w-24 rounded-full" />
          <SkeletonBlock className="mb-6 h-16 w-full rounded-3xl" />
        </View>
      ))}
      <SkeletonBlock className="h-14 w-full rounded-full" />
    </View>
  );
}

export function NotificationListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className="h-[76px] justify-center gap-2 rounded-3xl border border-neutral-200 bg-white px-5"
        >
          <View className="flex-row items-center justify-between">
            <SkeletonBlock className="h-4 w-2/5 rounded-full" />
            <SkeletonBlock className="h-3 w-12 rounded-full" />
          </View>
          <SkeletonBlock className="h-3 w-3/4 rounded-full" />
        </View>
      ))}
    </>
  );
}
