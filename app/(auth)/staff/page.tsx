import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
          <form className="w-full max-w-xs" action={staffLogin}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Login to your account</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Enter your email below to login to your account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                />
              </Field>
              {errorMessage ? (
                <FieldDescription className="text-center text-red-600">
                  {errorMessage}
                </FieldDescription>
              ) : null}
              <Field>
                <Button type="submit">Login</Button>
              </Field>
            </FieldGroup>
          </form>
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
