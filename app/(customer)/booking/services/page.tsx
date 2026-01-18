import { Plus } from "lucide-react";
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

const services = [
  {
    name: "Cut",
    duration: "45 min",
    price: "MYR 25",
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

export default async function SelectServicesPage({
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
                  Select Services
                </h1>
                <p className="text-sm text-slate-500 lg:text-base">
                  Choose your cut and finishing.
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
                    <BreadcrumbPage>Services</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            <section className="space-y-4" style={{ animationDelay: "80ms" }}>
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.name}
                    className=" text-card-foreground flex flex-col gap-6 border rounded-3xl border-slate-200/80 bg-white/80"
                  >
                    <div className="px-6 flex items-center justify-between py-6">
                      <div className="space-y-3">
                        <p className="text-base font-semibold text-slate-900">
                          {service.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600"
                          >
                            {service.duration}
                          </Badge>
                          <Badge className="rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold text-white">
                            {service.price}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        asChild
                        size="icon"
                        className="h-14 w-14 rounded-full bg-slate-900 text-white hover:bg-slate-900/90"
                      >
                        <Link
                          href={`/booking/barbers${buildQuery({
                            service: service.name,
                            duration: service.duration,
                            price: service.price,
                            total: service.price,
                            date: bookingDate,
                            time: bookingTime,
                            barber: barberName,
                          })}`}
                          aria-label={`Add ${service.name}`}
                        >
                          <Plus className="h-6 w-6" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="hidden lg:block lg:flex-1 lg:self-start">
            <div className="sticky top-6">
              <BookingSummaryCard
                ctaHref={`/booking/barbers${buildQuery({
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
