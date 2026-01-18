import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

const barbers = [
  {
    name: "Ikhwan Nasir",
    level: "Senior",
    initials: "IN",
  },
];

type BookingSearchParams = {
  service?: string | string[];
  duration?: string | string[];
  price?: string | string[];
  total?: string | string[];
  date?: string | string[];
  time?: string | string[];
  barber?: string | string[];
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
  const params = (await searchParams) ?? {};
  const serviceName = readParam(params.service);
  const serviceDuration = readParam(params.duration);
  const servicePrice = readParam(params.price);
  const totalPrice = readParam(params.total);
  const bookingDate = readParam(params.date);
  const bookingTime = readParam(params.time);
  const barberName = readParam(params.barber);

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-[1200px]">
      <div className="pb-12">
        <div className="flex flex-col gap-10 lg:flex lg:flex-row lg:items-start lg:gap-12">
          <div className="flex flex-col gap-8 lg:flex-[1.4] lg:min-w-0">
            <header className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl">
                  Select barbers
                </h1>
                <p className="text-sm text-slate-500 lg:text-base">
                  Choose your preferred barber.
                </p>
              </div>
              <Breadcrumb>
                <BreadcrumbList className="text-xs">
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
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            <section className="" style={{ animationDelay: "80ms" }}>
              <div className="space-y-4">
                {barbers.map((barber) => (
                  <Link
                    key={barber.name}
                    href={`/booking/time${buildQuery({
                      service: serviceName,
                      duration: serviceDuration,
                      price: servicePrice,
                      total: totalPrice ?? servicePrice,
                      date: bookingDate,
                      time: bookingTime,
                      barber: barber.name,
                    })}`}
                    className="block"
                    aria-label={`Select ${barber.name}`}
                  >
                    <div className="text-card-foreground flex flex-col gap-6 border rounded-3xl border-slate-200/80 bg-white/85 transition hover:border-slate-300">
                      <div className="px-3 flex items-center gap-5 py-3">
                        <Badge
                          variant="secondary"
                          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700"
                        >
                          {barber.initials}
                        </Badge>
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-slate-900">
                            {barber.name}
                          </p>
                          <p className="text-sm text-slate-500">
                            {barber.level}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="hidden lg:block lg:flex-1 lg:self-start">
            <div className="sticky top-6">
              <BookingSummaryCard
                ctaHref={`/booking/time${buildQuery({
                  service: serviceName,
                  duration: serviceDuration,
                  price: servicePrice,
                  total: totalPrice ?? servicePrice,
                  date: bookingDate,
                  time: bookingTime,
                  barber: barberName,
                })}`}
                bookingDate={bookingDate}
                bookingTime={bookingTime}
                barberName={barberName}
                serviceName={serviceName}
                serviceDuration={serviceDuration}
                servicePrice={servicePrice}
                totalPrice={totalPrice ?? servicePrice}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
