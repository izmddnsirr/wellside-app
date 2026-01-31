"use client";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    if (!email) {
      setErrorMessage("Email is required.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?type=recovery`,
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage("Failed to send reset email. Please try again.");
      return;
    }

    setSuccessMessage("Reset email sent. Check your inbox.");
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <form className="w-full max-w-xs" onSubmit={handleSubmit}>
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
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
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
