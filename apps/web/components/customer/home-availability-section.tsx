import { HomeAvailabilityDeferred } from "@/components/customer/home-availability-deferred";
import { getCachedActiveBarbers } from "@/utils/home-data";

export async function HomeAvailabilitySection() {
  const barbers = await getCachedActiveBarbers();

  return <HomeAvailabilityDeferred barbers={barbers} />;
}
