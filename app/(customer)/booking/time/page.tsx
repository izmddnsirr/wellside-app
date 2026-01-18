import { ChevronDown } from "lucide-react";
import Link from "next/link";
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

const days = [
  { day: "18", label: "Sunday" },
  { day: "19", label: "Monday", isActive: true },
  { day: "20", label: "Tuesday" },
  { day: "21", label: "Wednesday" },
  { day: "22", label: "Thursday" },
];

const slots = [
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
  "5:00 PM - 6:00 PM",
  "6:00 PM - 7:00 PM",
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

export default async function SelectTimePage({
  searchParams,
}: {
  searchParams?: Promise<BookingSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const serviceName = readParam(params.service);
  const serviceDuration = readParam(params.duration);
  const servicePrice = readParam(params.price);
  const totalPrice = readParam(params.total);
  const selectedDate = readParam(params.date);
  const selectedTime = readParam(params.time);
  const barberName = readParam(params.barber);
  const activeDay = days.find((day) => day.isActive) ?? days[0];
  const defaultDate = activeDay
    ? `${activeDay.label}, Jan ${activeDay.day}, 2026`
    : undefined;
  const highlightedDate = selectedDate ?? defaultDate;

  return (
    <div className="mx-auto w-full max-w-xl lg:max-w-[1200px]">
      <div className="pb-12">
        <div className="flex flex-col gap-10 lg:flex lg:flex-row lg:items-start lg:gap-12">
          <div className="flex flex-col gap-8 lg:flex-[1.4] lg:min-w-0">
            <header className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold text-slate-900 lg:text-4xl">
                  Select time
                </h1>
                <p className="text-sm text-slate-500 lg:text-base">
                  Pick a slot that fits your day.
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
                    <BreadcrumbLink asChild>
                      <Link href="/booking/barbers">Barbers</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Time</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            <section
              className="space-y-6"
              style={{ animationDelay: "80ms" }}
            >
              <Button
                variant="outline"
                className="h-auto w-fit rounded-full border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-none"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                  IN
                </span>
                <span className="text-slate-900">
                  {barberName ?? "Select barber"}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>

              <div className="space-y-4">
                <p className="text-lg font-semibold text-slate-900">
                  January 2026
                </p>
                <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
                  {days.map((item) => (
                    <div
                      key={item.day}
                      className="flex flex-col items-center gap-3"
                    >
                      <Button
                        asChild
                        variant={
                          highlightedDate ===
                          `${item.label}, Jan ${item.day}, 2026`
                            ? "default"
                            : "outline"
                        }
                        className={`h-20 w-20 rounded-full text-lg font-semibold shadow-none ${
                          highlightedDate ===
                          `${item.label}, Jan ${item.day}, 2026`
                            ? "bg-slate-900 text-white hover:bg-slate-900/90"
                            : "border-slate-200/80 bg-white/80 text-slate-900"
                        }`}
                      >
                        <Link
                          href={`/booking/time${buildQuery({
                            service: serviceName,
                            duration: serviceDuration,
                            price: servicePrice,
                            total: totalPrice ?? servicePrice,
                            date: `${item.label}, Jan ${item.day}, 2026`,
                            time: selectedTime,
                            barber: barberName,
                          })}`}
                        >
                          {item.day}
                        </Link>
                      </Button>
                      <span className="text-sm text-slate-500">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section
              className="space-y-4"
              style={{ animationDelay: "160ms" }}
            >
              {slots.map((slot) => (
                <Button
                  key={slot}
                  asChild
                  variant={selectedTime === slot ? "default" : "outline"}
                  className={`h-auto w-full justify-start rounded-3xl px-6 py-5 text-left text-base font-semibold shadow-none transition ${
                    selectedTime === slot
                      ? "bg-slate-900 text-white hover:bg-slate-900/90"
                      : "border-slate-200/80 bg-white/80 text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <Link
                    href={`/booking/time${buildQuery({
                      service: serviceName,
                      duration: serviceDuration,
                      price: servicePrice,
                      total: totalPrice ?? servicePrice,
                      date: highlightedDate,
                      time: slot,
                      barber: barberName,
                    })}`}
                  >
                    {slot}
                  </Link>
                </Button>
              ))}
            </section>
          </div>

          <aside className="hidden lg:block lg:flex-[1] lg:self-start">
            <div className="sticky top-6">
              <BookingSummaryCard
                ctaHref={`/booking/review${buildQuery({
                  service: serviceName,
                  duration: serviceDuration,
                  price: servicePrice,
                  total: totalPrice ?? servicePrice,
                  date: selectedDate,
                  time: selectedTime,
                  barber: barberName,
                })}`}
                bookingDate={selectedDate}
                bookingTime={selectedTime}
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
