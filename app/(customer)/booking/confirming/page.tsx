import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  buildBookingConfirmationPayload,
  sendBookingConfirmationEmailTo,
} from "@/utils/email/booking-confirmation";
import { ConfirmingBookingClient } from "./confirming-booking-client";

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
  startAt?: string | string[];
  endAt?: string | string[];
  startedAt?: string | string[];
};

const readParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function ConfirmingBookingPage({
  searchParams,
}: {
  searchParams?: Promise<BookingSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const serviceId = readParam(params.serviceId) ?? "";
  const barberId = readParam(params.barberId) ?? "";
  const startAt = readParam(params.startAt) ?? "";
  const endAt = readParam(params.endAt) ?? "";

  const startedAtParam = readParam(params.startedAt);
  const startedAt =
    startedAtParam && !Number.isNaN(Number(startedAtParam))
      ? Number(startedAtParam)
      : 0;

  const baseParams = {
    service: readParam(params.service) ?? "",
    duration: readParam(params.duration) ?? "",
    price: readParam(params.price) ?? "",
    total: readParam(params.total) ?? "",
    date: readParam(params.date) ?? "",
    time: readParam(params.time) ?? "",
    barber: readParam(params.barber) ?? "",
    barberId,
    serviceId,
    startAt,
    endAt,
  };
  const returnParams = new URLSearchParams(baseParams);
  const returnHref = `/booking/review?${returnParams.toString()}`;
  if (!serviceId || !barberId || !startAt || !endAt) {
    redirect(returnHref);
  }

  const confirmBooking = async () => {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      redirect("/login");
    }

    const redirectWithError = (code: "booking" | "active") => {
      const query = new URLSearchParams({
        ...baseParams,
        error: code,
      });
      redirect(`/booking/review?${query.toString()}`);
    };

    const { data: existingBooking, error: existingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("customer_id", user.id)
      .in("status", ["scheduled", "in_progress"])
      .limit(1)
      .maybeSingle();

    if (existingError) {
      redirectWithError("booking");
    }

    if (existingBooking) {
      redirectWithError("active");
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: user.id,
        barber_id: barberId,
        service_id: serviceId,
        start_at: startAt,
        end_at: endAt,
        status: "scheduled",
      })
      .select("id")
      .single();

    const bookingId = data?.id;

    if (error || !bookingId) {
      redirectWithError("booking");
    }

    try {
      const { data: bookingDetails, error: bookingDetailsError } =
        await supabase
          .from("bookings")
          .select(
            `
            id,
            booking_ref,
            status,
            start_at,
            end_at,
            booking_date,
            customer:customer_id (first_name, last_name, email, phone),
            barber:barber_id (display_name, first_name, last_name),
            service:service_id (name, base_price)
          `
          )
          .eq("id", bookingId)
          .single();

      if (bookingDetailsError || !bookingDetails) {
        console.error("Failed to load booking details for email", {
          bookingId,
          bookingDetailsError,
        });
      } else {
        const { payload, customerEmail } =
          buildBookingConfirmationPayload(bookingDetails);

        const { data: adminRows, error: adminError } = await supabase
          .from("profiles")
          .select("email")
          .eq("role", "admin")
          .not("email", "is", null);

        if (adminError) {
          console.error("Failed to load admin emails", adminError);
        }

        const adminEmails = (adminRows ?? [])
          .map((row) => row.email)
          .filter((email): email is string => Boolean(email));

        const sendOps: Promise<unknown>[] = [];
        if (customerEmail) {
          sendOps.push(
            sendBookingConfirmationEmailTo(payload, customerEmail, "Customer")
          );
        } else {
          console.error("Missing customer email for booking confirmation", {
            bookingId,
          });
        }

        if (adminEmails.length > 0) {
          sendOps.push(
            sendBookingConfirmationEmailTo(payload, adminEmails, "Admin")
          );
        } else {
          console.error("Missing admin emails for booking confirmation");
        }

        await Promise.allSettled(sendOps);
      }
    } catch (emailError) {
      console.error("Failed to send booking confirmation email", emailError);
    }

    redirect(`/booking/confirmed?bookingId=${bookingId}`);
  };

  return (
    <ConfirmingBookingClient
      startedAt={startedAt}
      returnHref={returnHref}
      confirmAction={confirmBooking}
    />
  );
}
