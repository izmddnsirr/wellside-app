import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

type SetPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    type?: string;
  }>;
};

const updatePassword = async (formData: FormData) => {
  "use server";

  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm_password") || "");

  if (!password || password.length < 8) {
    redirect("/set-password?error=weak");
  }
  if (password !== confirm) {
    redirect("/set-password?error=mismatch");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/set-password?error=failed");
  }

  redirect("/home");
};

export default async function SetPasswordPage({
  searchParams,
}: SetPasswordPageProps) {
  const params = await searchParams;
  const errorMessage =
    params?.error === "weak"
      ? "Password must be at least 8 characters."
      : params?.error === "mismatch"
      ? "Passwords do not match."
      : params?.error === "failed"
      ? "Unable to update password. Please try again."
      : null;

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <form className="w-full max-w-xs" action={updatePassword}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <img
                  src="/wellside-logo.png"
                  alt="Wellside"
                  className="h-14 w-auto dark:invert"
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
              ) : null}
              <Field>
                <button
                  type="submit"
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Update password
                </button>
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
