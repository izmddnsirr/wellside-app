"use client";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { useState } from "react";

export default function SetPasswordPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const confirm = String(formData.get("confirm_password") || "");

    if (!password || password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage("Unable to update password. Please try again.");
      return;
    }

    setSuccessMessage("Password updated. You can now log in.");
    window.location.assign("/home");
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <form className="w-full max-w-xs" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <Image
                  src="/wellside-logo.png"
                  alt="Wellside"
                  width={160}
                  height={56}
                  className="h-14 w-auto dark:invert"
                  priority
                />
                <h1 className="text-2xl font-bold">Set your password</h1>
                <p className="text-muted-foreground text-sm text-balance">
                  Create a new password to access your account.
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <PasswordInput id="password" name="password" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm_password">
                  Confirm password
                </FieldLabel>
                <PasswordInput
                  id="confirm_password"
                  name="confirm_password"
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
                  {isSubmitting ? "Updating..." : "Update password"}
                </button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/placeholder.svg"
          alt="Image"
          fill
          className="object-cover dark:brightness-[0.2] dark:grayscale"
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
      </div>
    </div>
  );
}
