import { AdminShell } from "../components/admin-shell";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/server";
import { createAdminAuthClient } from "@/utils/supabase/admin";
import { isValidE164, normalizePhone } from "@/src/lib/phone";
import { BarbersCard } from "./barbers-card";

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

  if (!email) {
    return;
  }

  const phoneInput = normalizeValue(formData.get("phone"));
  const normalizedPhone = phoneInput ? normalizePhone(phoneInput, "MY") : null;
  if (normalizedPhone && !isValidE164(normalizedPhone)) {
    return;
  }

  const workingStart = normalizeValue(formData.get("working_start_time"));
  const workingEnd = normalizeValue(formData.get("working_end_time"));
  const barberLevel = normalizeValue(formData.get("barber_level"));
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

  let status: "invited" | "converted" = "converted";

  const metadata = {
    display_name: displayName ?? undefined,
    first_name: firstName ?? undefined,
    last_name: lastName ?? undefined,
  };

  if (!userId) {
    const headerStore = await headers();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      headerStore.get("origin") ??
      "http://localhost:3000";
    const { data: inviteData, error: inviteError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: "barber", ...metadata },
        redirectTo: `${origin}/auth/callback`,
      });

    if (inviteError || !inviteData?.user?.id) {
      console.error("Failed to invite barber", inviteError);
      return;
    }

    userId = inviteData.user.id;
    status = "invited";
  }

  if (!userId) {
    return;
  }

  const { error: updateUserError } = await supabase.auth.admin.updateUserById(
    userId,
    { user_metadata: metadata }
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

export default async function Page() {
  const supabase = await createAdminClient();
  const { data: barbers, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, display_name, email, phone, is_active, created_at, working_start_time, working_end_time, barber_level"
    )
    .eq("role", "barber")
    .order("created_at", { ascending: false });
  const errorMessage = error
    ? "Failed to load barbers. Please try again."
    : null;

  return (
    <AdminShell
      title="Barbers"
      description="Manage staff schedules and performance."
    >
      <div className="px-4 lg:px-6">
        <BarbersCard
          barbers={barbers ?? []}
          errorMessage={errorMessage}
          createBarber={createBarber}
        />
      </div>
    </AdminShell>
  );
}
