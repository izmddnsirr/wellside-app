import { Suspense } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { BookingSummaryCard } from "@/components/customer/booking-summary-card";
import { BookingFlowActions } from "@/components/customer/booking-flow-actions";
import { createClient } from "@/utils/supabase/server";
import { redirectIfCustomerBookingDisabled } from "../booking-availability";

type ServiceRow = {
  id: string;
  service_code: string | null;
  name: string;
  base_price: number | null;
  duration_minutes: number | null;
  is_active: boolean;
};

const formatServicePrice = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return undefined;
  }
  return `MYR ${new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
};

const formatServiceDuration = (value: number | null) => {
  if (!value || Number.isNaN(value)) {
    return undefined;
  }
  return `${value} min`;
};

type BookingSearchParams = {
  service?: string | string[];
  duration?: string | string[];
  price?: string | string[];
  total?: string | string[];
  date?: string | string[];
  time?: string | string[];
  barber?: string | string[];
  barberId?: string | string[];
  serviceId?: string | string[];
};

const readParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const buildQuery = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

async function ServicesList({ params }: { params: BookingSearchParams }) {
  const supabase = await createClient();
  const { data: servicesData, error: servicesError } = await supabase
    .from("services")
    .select(
      "id, service_code, name, base_price, duration_minutes, is_active, allow_booking",
    )
    .eq("is_active", true)
    .eq("allow_booking", true)
    .order("service_code", { ascending: true })
    .order("name", { ascending: true });
  const services = servicesData ?? [];

  const serviceName = readParam(params.service);
  const serviceDuration = readParam(params.duration);
  const servicePrice = readParam(params.price);
  const totalPrice = readParam(params.total);
  const bookingDate = readParam(params.date);
  const bookingTime = readParam(params.time);
  const barberName = readParam(params.barber);
  const barberId = readParam(params.barberId);
  const serviceId = readParam(params.serviceId);

  return (
    <section className="space-y-4" style={{ animationDelay: "80ms" }}>
      <div className="space-y-4">
        {servicesError ? (
          <p className="text-sm text-red-500">
            Unable to load services right now.
          </p>
        ) : null}
        {!servicesError && services.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No services available right now.
          </p>
        ) : null}
        {services.map((service: ServiceRow) => {
          const durationValue = formatServiceDuration(service.duration_minutes);
          const priceValue = formatServicePrice(service.base_price);
          const durationLabel = durationValue ?? "-";
          const priceLabel = priceValue ?? "Custom price";
          const isSelected =
            (serviceId
              ? serviceId === service.id
              : serviceName === service.name) &&
            serviceDuration === durationValue &&
            servicePrice === priceValue;
          const selectionQuery = buildQuery({
            serviceId: service.id,
            service: service.name,
            duration: durationValue,
            price: priceValue,
            total: priceValue,
            date: bookingDate,
            time: bookingTime,
            barber: barberName,
            barberId,
          });

          return (
            <div
              key={service.id}
              className={`text-card-foreground flex flex-col gap-6 rounded-3xl border bg-card/80 ${
                isSelected
                  ? "border-primary/60 shadow-sm"
                  : "border-border/60"
              }`}
            >
              <div className="px-6 flex items-center justify-between py-6">
                <div className="space-y-3">
                  <p className="text-base font-semibold text-foreground">
                    {service.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-muted px-4 py-1 text-xs font-semibold text-muted-foreground"
                    >
                      {durationLabel}
                    </Badge>
                    <Badge className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                      {priceLabel}
                    </Badge>
                  </div>
                </div>
                <Button
                  asChild
                  size="icon"
                  className="hidden h-14 w-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 lg:inline-flex"
                >
                  <Link
                    href={`/booking/services${selectionQuery}`}
                    aria-label={`Select ${service.name}`}
                  >
                    <Plus className="h-6 w-6" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="icon"
                  className="h-14 w-14 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 lg:hidden"
                >
                  <Link
                    href={`/booking/barbers${selectionQuery}`}
                    aria-label={`Select ${service.name}`}
                  >
                    <Plus className="h-6 w-6" />
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ServicesListSkeleton() {
  return (
    <section className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-border/60 bg-card/80 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-14 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </section>
  );
}

export default async function SelectServicesPage({
  searchParams,
}: {
  searchParams?: Promise<BookingSearchParams>;
}) {
  await redirectIfCustomerBookingDisabled();

  const params = (await searchParams) ?? {};
  const serviceName = readParam(params.service);
  const serviceDuration = readParam(params.duration);
  const servicePrice = readParam(params.price);
  const totalPrice = readParam(params.total);
  const bookingDate = readParam(params.date);
  const bookingTime = readParam(params.time);
  const barberName = readParam(params.barber);
  const barberId = readParam(params.barberId);
  const serviceId = readParam(params.serviceId);

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-300">
      <div className="pb-12">
        <div className="flex flex-col gap-10 lg:flex lg:flex-row lg:items-start lg:gap-12">
          <div className="flex flex-col gap-6 lg:flex-[1.4] lg:min-w-0">
            <header className="space-y-4">
              <div className="lg:hidden">
                <BookingFlowActions backHref="/booking" />
              </div>
              <Breadcrumb className="hidden sm:block">
                <BreadcrumbList className="text-sm">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/booking">Booking</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Services</BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-muted-foreground">Barbers</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-muted-foreground">Time</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-muted-foreground">Review</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-muted-foreground">Confirmed</span>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold text-foreground lg:text-4xl">
                  Select Services
                </h1>
                <p className="text-sm text-muted-foreground lg:text-base">
                  Choose your cut and finishing.
                </p>
              </div>
            </header>
            <Suspense fallback={<ServicesListSkeleton />}>
              <ServicesList params={params} />
            </Suspense>
          </div>

          <aside className="hidden lg:block lg:flex-1 lg:self-start">
            <div className="sticky top-6">
              <BookingSummaryCard
                ctaHref={`/booking/barbers${buildQuery({
                  serviceId,
                  service: serviceName,
                  duration: serviceDuration,
                  price: servicePrice,
                  total: totalPrice ?? servicePrice,
                  date: bookingDate,
                  time: bookingTime,
                  barber: barberName,
                  barberId,
                })}`}
                bookingDate={bookingDate}
                bookingTime={bookingTime}
                barberName={barberName}
                serviceName={serviceName}
                serviceDuration={serviceDuration}
                servicePrice={servicePrice}
                totalPrice={totalPrice ?? servicePrice}
                requiredFields={["service", "duration", "price"]}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
