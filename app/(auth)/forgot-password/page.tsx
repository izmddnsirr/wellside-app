import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    sent?: string;
  }>;
};

const requestReset = async (formData: FormData) => {
  "use server";

  const email = String(formData.get("email") || "").trim();
  if (!email) {
    redirect("/forgot-password?error=missing");
  }

  const headerStore = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    headerStore.get("origin") ??
    "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  if (error) {
    redirect("/forgot-password?error=failed");
  }

  redirect("/forgot-password?sent=1");
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const errorMessage =
    params?.error === "missing"
      ? "Email is required."
      : params?.error === "failed"
      ? "Failed to send reset email. Please try again."
      : null;
  const successMessage = params?.sent
    ? "Reset email sent. Check your inbox."
    : null;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <form className="w-full max-w-xs" action={requestReset}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <img
                  src="/wellside-logo.png"
                  alt="Wellside"
                  className="h-14 w-auto dark:invert"
                />
                <h1 className="text-2xl font-bold">Reset your password</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  We&apos;ll send you a reset link.
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
              {errorMessage ? (
                <FieldDescription className="text-center text-red-600">
                  {errorMessage}
                </FieldDescription>
              ) : successMessage ? (
                <FieldDescription className="text-center text-emerald-600">
                  {successMessage}
                </FieldDescription>
              ) : null}
              <Field>
                <button
                  type="submit"
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Send reset link
                </button>
              </Field>
              <FieldDescription className="text-center">
                Back to{" "}
                <a href="/login" className="underline underline-offset-4">
                  login
                </a>
              </FieldDescription>
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
