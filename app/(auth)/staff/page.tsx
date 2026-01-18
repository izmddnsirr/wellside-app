import { StaffLoginForm } from "./staff-login-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type StaffLoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

const staffLogin = async (formData: FormData) => {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/staff?error=missing");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/staff?error=invalid");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/staff?error=invalid");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role) {
    await supabase.auth.signOut();
    redirect("/staff?error=profile");
  }

  if (profile.role === "admin") {
    redirect("/admin");
  }

  if (profile.role === "barber") {
    redirect("/barber");
  }

  await supabase.auth.signOut();
  redirect("/staff?error=unauthorized");
};

export default async function LoginStaffPage({ searchParams }: StaffLoginPageProps) {
  const params = await searchParams;
  const errorMessage =
    params?.error === "missing"
      ? "Email and password are required."
      : params?.error === "invalid"
        ? "Invalid email or password."
        : params?.error === "profile"
          ? "Account profile not found."
      : params?.error === "unauthorized"
        ? "This account is not staff."
        : null;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <StaffLoginForm action={staffLogin} errorMessage={errorMessage} />
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
