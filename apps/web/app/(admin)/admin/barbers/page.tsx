import { Suspense } from "react";
import { AdminShell } from "../components/admin-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { revalidatePath } from "next/cache";

export const revalidate = 60;
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/server";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { isValidE164, normalizePhone } from "@/src/lib/phone";
import { BarbersCard } from "./barbers-card";
import { getBarberRatings } from "@/utils/barber-ratings";

const normalizeValue = (value: FormDataEntryValue | null) => {
  if (value === null) {
    return null;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const createBarber = async (formData: FormData) => {
  "use server";
  const supabase = createAdminAuthClient();
  const emailRaw = normalizeValue(formData.get("email"));
  const email = emailRaw ? emailRaw.toLowerCase() : null;
  const firstName = normalizeValue(formData.get("first_name"));
  const lastName = normalizeValue(formData.get("last_name"));
  const displayNameInput = normalizeValue(formData.get("display_name"));
  const fallbackDisplayName = [firstName, lastName].filter(Boolean).join(" ");
  const displayName =
    displayNameInput || fallbackDisplayName
      ? (displayNameInput ?? fallbackDisplayName)
      : null;
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!email) {
    return;
  }

  if (!password || password.length < 8 || password !== confirm) {
    redirect("/admin/barbers?toast=barber-password-invalid");
  }

  const phoneInput = normalizeValue(formData.get("phone"));
  const normalizedPhone = phoneInput ? normalizePhone(phoneInput, "MY") : null;
  if (normalizedPhone && !isValidE164(normalizedPhone)) {
    return;
  }

  const workingStart = normalizeValue(formData.get("working_start_time"));
  const workingEnd = normalizeValue(formData.get("working_end_time"));
  const barberLevel = normalizeValue(formData.get("barber_level"));
  const offDays = formData
    .getAll("off_days")
    .map((value) => String(value).trim().toLowerCase())
    .filter(Boolean);
  const isActive = formData.get("is_active") === "on";

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profileLookupError) {
    console.error("Failed to lookup profile by email", profileLookupError);
    return;
  }

  let userId = existingProfile?.id ?? null;

  if (!userId) {
    const findUserIdByEmail = async (targetEmail: string) => {
      const maxPages = 5;
      const perPage = 1000;
      for (let page = 1; page <= maxPages; page += 1) {
        const { data: listData, error: listError } =
          await supabase.auth.admin.listUsers({
            page,
            perPage,
          });
        if (listError) {
          console.error("Failed to list users", listError);
          return null;
        }
        const match = listData.users.find(
          (user) => user.email?.toLowerCase() === targetEmail
        );
        if (match?.id) {
          return match.id;
        }
        if (listData.users.length < perPage) {
          break;
        }
      }
      return null;
    };

    userId = await findUserIdByEmail(email);
  }

  let status: "created" | "converted" = "converted";

  const metadata = {
    display_name: displayName ?? undefined,
    first_name: firstName ?? undefined,
    last_name: lastName ?? undefined,
  };

  if (!userId) {
    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });

    if (createError || !createData?.user?.id) {
      console.error("Failed to create barber user", createError);
      redirect("/admin/barbers?toast=barber-password-failed");
    }

    userId = createData.user.id;
    status = "created";
  }

  if (!userId) {
    return;
  }

  const { error: updateUserError } = await supabase.auth.admin.updateUserById(
    userId,
    { password, user_metadata: metadata }
  );
  if (updateUserError) {
    console.error("Failed to update barber auth metadata", updateUserError);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      role: "barber",
      email,
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      phone: normalizedPhone,
      working_start_time: workingStart,
      working_end_time: workingEnd,
      barber_level: barberLevel,
      off_days: offDays,
      is_active: isActive,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.error("Failed to save barber profile", profileError);
    return;
  }

  revalidatePath("/admin/barbers");
  redirect(`/admin/barbers?toast=barber-${status}`);
};

const moveBarberToCustomer = async (formData: FormData) => {
  "use server";
  const supabase = createAdminAuthClient();
  const barberId = String(formData.get("id") ?? "");

  if (!barberId) {
    redirect("/admin/barbers?toast=barber-demote-invalid");
  }

  const { data: activeBooking, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("barber_id", barberId)
    .in("status", ["scheduled", "in_progress"])
    .limit(1)
    .maybeSingle();

  if (bookingError) {
    console.error("Failed to validate active bookings for demotion", bookingError);
    redirect("/admin/barbers?toast=barber-demote-failed");
  }

  if (activeBooking) {
    redirect("/admin/barbers?toast=barber-demote-blocked");
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      role: "customer",
      working_start_time: null,
      working_end_time: null,
      barber_level: null,
      is_active: true,
    })
    .eq("id", barberId)
    .eq("role", "barber");

  if (updateError) {
    console.error("Failed to move barber to customer", updateError);
    redirect("/admin/barbers?toast=barber-demote-failed");
  }

  revalidatePath("/admin/barbers");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/bookings/active");
  revalidatePath("/admin/bookings/past");
  revalidatePath("/admin/bookings/calendar");
  redirect("/admin/barbers?toast=barber-demoted");
};

async function BarbersContent() {
  const supabase = await createAdminClient();
  const { data: barbers, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, display_name, email, phone, is_active, created_at, working_start_time, working_end_time, barber_level, off_days, avatar_url"
    )
    .eq("role", "barber")
    .order("created_at", { ascending: false });
  const errorMessage = error ? "Failed to load barbers. Please try again." : null;

  const barberIds = (barbers ?? []).map((b) => b.id);
  const ratingsMap = await getBarberRatings(barberIds);

  const barbersWithRatings = (barbers ?? []).map((b) => {
    const r = ratingsMap.get(b.id);
    return { ...b, ratingAverage: r?.average ?? null, ratingCount: r?.count ?? 0 };
  });

  return (
    <BarbersCard
      barbers={barbersWithRatings}
      errorMessage={errorMessage}
      createBarber={createBarber}
      moveBarberToCustomer={moveBarberToCustomer}
    />
  );
}

function BarbersSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-37.5" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-9 w-45" />
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-8 w-12" />
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-3 bg-muted/40 border-b border-border/60 px-4 py-3">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-18" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="ml-auto h-3 w-14" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/60 bg-background px-4 py-3 last:border-0">
            <div className="flex items-center gap-2 w-[18%]">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-28 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell title="Barbers">
      <div className="px-4 lg:px-6">
        <Suspense fallback={<BarbersSkeleton />}>
          <BarbersContent />
        </Suspense>
      </div>
    </AdminShell>
  );
}
