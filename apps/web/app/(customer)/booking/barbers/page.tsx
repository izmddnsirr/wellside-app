import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BookingSummaryCard } from "@/components/customer/booking-summary-card";
import { BookingFlowActions } from "@/components/customer/booking-flow-actions";
import { createClient } from "@/utils/supabase/server";
import { redirectIfCustomerBookingDisabled } from "../booking-availability";

type BarberRow = {
  id: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  barber_level: string | null;
  is_active: boolean | null;
};

const buildInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

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

export default async function SelectBarberPage({
  searchParams,
}: {
  searchParams?: Promise<BookingSearchParams>;
}) {
  await redirectIfCustomerBookingDisabled();

  const supabase = await createClient();
  const { data: barbersData, error: barbersError } = await supabase
    .from("profiles")
    .select(
      "id, role, first_name, last_name, display_name, avatar_url, barber_level, is_active"
    )
    .eq("is_active", true)
    .eq("role", "barber")
    .order("display_name");
  const barbers = (barbersData ?? []).map((barber: BarberRow) => {
    const name =
      barber.display_name?.trim() ||
      [barber.first_name, barber.last_name].filter(Boolean).join(" ").trim() ||
      "Barber";

    return {
      id: barber.id,
      name,
      level: barber.barber_level?.trim() || "Barber",
      initials: buildInitials(name) || "B",
    };
  });

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

  if (!serviceName || !serviceDuration || !servicePrice || !serviceId) {
    redirect("/booking/services");
  }

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-300">
      <div className="pb-12">
        <div className="flex flex-col gap-10 lg:flex lg:flex-row lg:items-start lg:gap-12">
          <div className="flex flex-col gap-6 lg:flex-[1.4] lg:min-w-0">
            <header className="space-y-4">
              <div className="lg:hidden">
                <BookingFlowActions backHref="/booking/services" />
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
                    <BreadcrumbLink asChild>
                      <Link href="/booking/services">Services</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Barbers</BreadcrumbPage>
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
                  Select barbers
                </h1>
                <p className="text-sm text-muted-foreground lg:text-base">
                  Choose your preferred barber.
                </p>
              </div>
            </header>

            <section className="" style={{ animationDelay: "80ms" }}>
              <div className="space-y-4">
                {barbersError ? (
                  <p className="text-sm text-destructive">
                    Unable to load barbers right now.
                  </p>
                ) : null}
                {!barbersError && barbers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No barbers available right now.
                  </p>
                ) : null}
                {barbers.map((barber) => {
                  const selectionQuery = buildQuery({
                    serviceId,
                    service: serviceName,
                    duration: serviceDuration,
                    price: servicePrice,
                    total: totalPrice ?? servicePrice,
                    date: bookingDate,
                    time: bookingTime,
                    barber: barber.name,
                    barberId: barber.id,
                  });
                  const isSelected = barberId
                    ? barberId === barber.id
                    : barberName === barber.name;
                  const cardClassName = `text-card-foreground flex flex-col gap-6 rounded-3xl border bg-card/85 transition hover:border-border focus:outline-none focus-visible:outline-none focus-visible:ring-0 ${
                    isSelected
                      ? "border-primary ring-1 ring-primary/10"
                      : "border-border/60"
                  }`;

                  return (
                    <div key={barber.name}>
                      <Link
                        href={`/booking/time${selectionQuery}`}
                        className="block lg:hidden"
                        aria-label={`Select ${barber.name}`}
                      >
                        <div className={cardClassName}>
                          <div className="px-3 flex items-center gap-5 py-3">
                            <Badge
                              variant="secondary"
                              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground"
                            >
                              {barber.initials}
                            </Badge>
                            <div className="space-y-1">
                              <p className="text-base font-semibold text-foreground">
                                {barber.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {barber.level}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                      <Link
                        href={`/booking/barbers${selectionQuery}`}
                        className="hidden lg:block"
                        aria-label={`Select ${barber.name}`}
                      >
                        <div className={cardClassName}>
                          <div className="px-3 flex items-center gap-5 py-3">
                            <Badge
                              variant="secondary"
                              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground"
                            >
                              {barber.initials}
                            </Badge>
                            <div className="space-y-1">
                              <p className="text-base font-semibold text-foreground">
                                {barber.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {barber.level}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <aside className="hidden lg:block lg:flex-1 lg:self-start">
            <div className="sticky top-6">
                <BookingSummaryCard
                  ctaHref={`/booking/time${buildQuery({
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
                requiredFields={["service", "duration", "price", "barber"]}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
